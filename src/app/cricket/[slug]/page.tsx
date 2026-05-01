'use client'

import { use, useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, ReferenceLine, Cell } from 'recharts';
import { SportsDemoGate, RoleSwitcher } from '@/components/sports-demo'
import type { SportsDemoSession } from '@/components/sports-demo'
import { generateSmartBriefing, buildRoundupSummary, buildScheduleItems, getUserTimezone } from '@/lib/sports/smartBriefing'
import MediaContentModule from '@/components/sports/media-content/MediaContentModule'
import CricketToursAndCampsView from '@/components/cricket/ToursAndCampsView'
import SportsSettings from '@/components/sports/SportsSettings'
import RoleAwareQuickActionsBar from '@/components/portals/RoleAwareQuickActionsBar'
import { Volume2 } from 'lucide-react'
import { CANNED } from '@/lib/ai/canned-demo-responses'
import { GPSHeatmapsView } from './v2/_components/GPSHeatmapsView'
import { THEMES, ACCENTS, DENSITY, FONT, getGreeting } from './v2/_lib/theme'
import {
  HeroToday, TodaySchedule, StatTiles, AIBrief, Inbox,
  Squad as DashboardSquad, Fixtures, Perf, Recents, Season,
} from './v2/_components/Modules'
import {
  CommandPalette, AskLumio, FixtureDrawer,
  Toast as DashboardToast, useToast as useDashboardToast, useKey,
} from './v2/_components/Overlays'
import { Icon as V2Icon } from './v2/_components/Icon'
import type { Fixture as V2Fixture } from './v2/_lib/data'


export const CRICKET_ROLES = [
  { id: 'director',   label: 'Director',          icon: '🏛️', description: 'Board & strategy'    },
  { id: 'head_coach', label: 'Head Coach',        icon: '🎯', description: 'Coaching & analytics' },
  { id: 'captain',    label: 'Captain',           icon: '🏆', description: 'Squad & fixtures'     },
  { id: 'analyst',    label: 'Analyst',           icon: '📊', description: 'Data & performance'   },
  { id: 'sponsor',    label: 'Sponsor',           icon: '🤝', description: 'Sponsorship & events' },
  { id: 'groundsman', label: 'Groundsman',        icon: '🌱', description: 'Pitch & facilities'   },
  { id: 'medical',    label: 'Medical',           icon: '🏥', description: 'Physio + S&C'         },
  { id: 'media',      label: 'Media',             icon: '📣', description: 'Press & social'       },
  { id: 'operations', label: 'Operations',        icon: '🧰', description: 'Team manager & ops'   },
  { id: 'mental',     label: 'Mental',            icon: '🧠', description: 'Mental performance'   },
]

const CRICKET_ROLE_CONFIG: Record<string, { label: string; icon: string; accent: string; sidebar: 'all' | string[]; message: string | null }> = {
  director:   { label: 'Director',    icon: '🏛️', accent: '#8B5CF6', sidebar: 'all', message: null },
  head_coach: { label: 'Head Coach',  icon: '🎯', accent: '#22C55E', sidebar: ['dashboard','briefing','insights','match-centre','ai-innings-brief','batting-analytics','bowling-analytics','video-analysis','opposition','practice-log','declaration','net-planner','performance-stats','squad','medical','gps','gps-heatmaps','pathway','overseas','bowling-workload','settings'], message: 'Coaching and performance view.' },
  captain:    { label: 'Captain',     icon: '🏆', accent: '#3B82F6', sidebar: ['dashboard','briefing','insights','match-centre','ai-innings-brief','batting-analytics','bowling-analytics','squad','medical','opposition','livescores','team-comms','settings'], message: 'Squad and match view.' },
  analyst:    { label: 'Analyst',     icon: '📊', accent: '#F59E0B', sidebar: ['dashboard','briefing','insights','match-centre','ai-innings-brief','batting-analytics','bowling-analytics','video-analysis','opposition','performance-stats','gps','gps-heatmaps','livescores','settings'], message: 'Data and analytics view.' },
  sponsor:    { label: 'Sponsor',     icon: '🤝', accent: '#EC4899', sidebar: ['dashboard','insights','sponsorship','media','ticket-matchday','fan-engagement','commercial','settings'], message: null },
  // ── New roles (Insights expansion). Each gets dashboard + briefing +
  //    insights + the sidebar sections most relevant to their day-to-day.
  //    Permission system unchanged — these slot into the existing shape.
  groundsman: { label: 'Groundsman',  icon: '🌱', accent: '#16A34A', sidebar: ['dashboard','briefing','insights','grounds','facilities','match-centre','livescores','team-comms','settings'], message: 'Pitch + facilities view.' },
  medical:    { label: 'Medical',     icon: '🏥', accent: '#DC2626', sidebar: ['dashboard','briefing','insights','medical','gps','gps-heatmaps','squad','match-centre','team-comms','bowling-workload','mental-performance','settings'], message: 'Physio, S&C and workload view.' },
  media:      { label: 'Media',       icon: '📣', accent: '#06B6D4', sidebar: ['dashboard','briefing','insights','media-hub','media','sponsorship','ticket-matchday','fan-engagement','team-comms','settings'], message: 'Media + comms view.' },
  operations: { label: 'Operations',  icon: '🧰', accent: '#0EA5E9', sidebar: ['dashboard','briefing','insights','operations','staff','facilities','kit','travel','team-comms','safeguarding','settings'], message: 'Team manager + ops view.' },
  mental:     { label: 'Mental',      icon: '🧠', accent: '#A855F7', sidebar: ['dashboard','briefing','insights','medical','squad','team-comms','mental-performance','settings'], message: 'Mental performance view.' },
}

const C = {
  bg:'#07080F',sidebar:'#0B0D1B',card:'#0F1629',cardAlt:'#111827',
  border:'rgba(255,255,255,0.07)',borderHi:'rgba(255,255,255,0.13)',
  purple:'#8B5CF6',purpleDim:'rgba(139,92,246,0.15)',
  teal:'#14B8A6',tealDim:'rgba(20,184,166,0.15)',
  amber:'#F59E0B',amberDim:'rgba(245,158,11,0.15)',
  green:'#10B981',greenDim:'rgba(16,185,129,0.15)',
  red:'#EF4444',redDim:'rgba(239,68,68,0.15)',
  blue:'#3B82F6',blueDim:'rgba(59,130,246,0.15)',
  pink:'#EC4899',pinkDim:'rgba(236,72,153,0.15)',
  text:'#F1F5F9',muted:'#94A3B8',dim:'#475569',
};

const SQUAD=[
  {id:1,n:'Daniel Webb',r:'Opening Batter',age:29,ch:true,t2:true,od:true,hu:true,st:'fit',load:72},
  {id:2,n:'Tom Fletcher',r:'Opening Batter',age:27,ch:true,t2:true,od:true,hu:false,st:'fit',load:68},
  {id:3,n:'Marcus Cole',r:'No.3 Batter',age:31,ch:true,t2:false,od:true,hu:true,st:'fit',load:81},
  {id:4,n:'Ryan Shaw',r:'No.4 / Captain',age:26,ch:true,t2:true,od:true,hu:true,st:'fit',load:74},
  {id:5,n:'James Hill',r:'All-Rounder',age:28,ch:true,t2:true,od:true,hu:true,st:'fit',load:79},
  {id:6,n:'Callum Price',r:'Wicketkeeper',age:25,ch:true,t2:true,od:true,hu:true,st:'fit',load:66},
  {id:7,n:'Alex Merriman',r:'Off Spinner',age:33,ch:true,t2:false,od:true,hu:false,st:'fit',load:58},
  {id:8,n:'Jake Harrison',r:'Fast Bowler',age:24,ch:true,t2:true,od:true,hu:true,st:'injury',load:0,note:'Hamstring — 70% — physio clearance Wed 8 Apr'},
  {id:9,n:'Sam Reed',r:'Fast Bowler',age:27,ch:true,t2:true,od:true,hu:true,st:'fit',load:83},
  {id:10,n:'Oliver Halden CCC',r:'Left-Arm Spin',age:29,ch:true,t2:true,od:false,hu:false,st:'fit',load:61},
  {id:11,n:'Chris Dawson',r:'Fast Bowler',age:22,ch:true,t2:false,od:false,hu:false,st:'monitoring',load:45,note:'A:C ratio 1.62 — cap workload this block'},
  {id:12,n:'Rajan Steenkamp',r:'Fast Bowler',age:30,ch:true,t2:false,od:true,hu:false,st:'fit',load:77,os:true,osNote:'Arrives Thu — SA'},
  {id:13,n:'Brett Mason',r:'Batter',age:28,ch:false,t2:true,od:false,hu:true,st:'tbc',load:0,os:true,osNote:'Visa pending — AUS'},
];

const GPS_DATA=[
  {name:'Daniel Webb',role:'Opening Batter',dist:8.4,spd:30.2,sprints:24,hi:2.8,load:387,bowl:null,
   zones:[{x:275,y:165,r:28,c:'#EF4444',o:0.55},{x:268,y:195,r:24,c:'#F97316',o:0.48},{x:242,y:118,r:20,c:'#F59E0B',o:0.40},{x:295,y:210,r:16,c:'#EAB308',o:0.30},{x:288,y:248,r:12,c:'#84CC16',o:0.22},{x:258,y:268,r:10,c:'#22C55E',o:0.18}],
   lines:[{x1:268,y1:195,x2:275,y2:165},{x1:275,y1:165,x2:242,y2:118},{x1:295,y1:210,x2:268,y2:195},{x1:242,y1:118,x2:270,y2:75}],
   dz:[{n:'Stand',v:1.2,c:'#475569'},{n:'Walk',v:2.8,c:'#3B82F6'},{n:'Jog',v:2.6,c:'#10B981'},{n:'Run',v:1.4,c:'#F59E0B'},{n:'Sprint',v:0.4,c:'#EF4444'}]},
  {name:'Sam Reed',role:'Fast Bowler',dist:6.1,spd:28.7,sprints:14,hi:1.6,load:298,bowl:{ov:12,del:72,lim:96,acr:0.94,st:'green'},
   zones:[{x:200,y:270,r:30,c:'#EF4444',o:0.60},{x:200,y:245,r:22,c:'#F97316',o:0.50},{x:138,y:310,r:22,c:'#EF4444',o:0.45},{x:158,y:118,r:16,c:'#F59E0B',o:0.35},{x:130,y:75,r:12,c:'#84CC16',o:0.25},{x:148,y:285,r:10,c:'#EAB308',o:0.28}],
   lines:[{x1:200,y1:320,x2:200,y2:248},{x1:200,y1:248,x2:200,y2:195},{x1:138,y1:310,x2:158,y2:118},{x1:130,y1:75,x2:158,y2:118}],
   dz:[{n:'Stand',v:1.8,c:'#475569'},{n:'Walk',v:2.1,c:'#3B82F6'},{n:'Jog',v:1.4,c:'#10B981'},{n:'Run',v:0.6,c:'#F59E0B'},{n:'Sprint',v:0.2,c:'#EF4444'}]},
  {name:'Jake Harrison',role:'Fast Bowler',dist:3.2,spd:24.1,sprints:6,hi:0.4,load:142,bowl:{ov:0,del:0,lim:48,acr:1.62,st:'amber',note:'Return-to-play only'},
   zones:[{x:158,y:118,r:14,c:'#3B82F6',o:0.35},{x:130,y:75,r:10,c:'#3B82F6',o:0.25},{x:125,y:165,r:10,c:'#22C55E',o:0.20}],
   lines:[{x1:130,y1:75,x2:158,y2:118}],
   dz:[{n:'Stand',v:1.2,c:'#475569'},{n:'Walk',v:1.6,c:'#3B82F6'},{n:'Jog',v:0.3,c:'#10B981'},{n:'Run',v:0.1,c:'#F59E0B'},{n:'Sprint',v:0.0,c:'#EF4444'}]},
  {name:'Chris Dawson',role:'Fast Bowler',dist:5.8,spd:29.3,sprints:16,hi:1.9,load:271,bowl:{ov:6,del:36,lim:72,acr:1.62,st:'amber'},
   zones:[{x:200,y:270,r:26,c:'#EF4444',o:0.55},{x:200,y:245,r:18,c:'#F97316',o:0.45},{x:258,y:310,r:18,c:'#F59E0B',o:0.35},{x:242,y:118,r:12,c:'#84CC16',o:0.22},{x:270,y:75,r:10,c:'#22C55E',o:0.18}],
   lines:[{x1:200,y1:320,x2:200,y2:248},{x1:258,y1:310,x2:242,y2:118},{x1:200,y1:248,x2:200,y2:200}],
   dz:[{n:'Stand',v:1.5,c:'#475569'},{n:'Walk',v:2.0,c:'#3B82F6'},{n:'Jog',v:1.5,c:'#10B981'},{n:'Run',v:0.6,c:'#F59E0B'},{n:'Sprint',v:0.2,c:'#EF4444'}]},
  {name:'James Hill',role:'All-Rounder',dist:9.1,spd:31.4,sprints:28,hi:3.4,load:421,bowl:{ov:8,del:48,lim:72,acr:0.88,st:'green'},
   zones:[{x:125,y:165,r:26,c:'#EF4444',o:0.55},{x:132,y:195,r:22,c:'#F97316',o:0.48},{x:158,y:118,r:18,c:'#F59E0B',o:0.38},{x:105,y:210,r:14,c:'#EAB308',o:0.28},{x:200,y:270,r:16,c:'#F97316',o:0.40},{x:200,y:245,r:12,c:'#F59E0B',o:0.32}],
   lines:[{x1:125,y1:165,x2:132,y2:195},{x1:132,y1:195,x2:158,y2:118},{x1:200,y1:320,x2:200,y2:248},{x1:105,y1:210,x2:130,y2:75}],
   dz:[{n:'Stand',v:1.0,c:'#475569'},{n:'Walk',v:2.5,c:'#3B82F6'},{n:'Jog',v:3.1,c:'#10B981'},{n:'Run',v:1.8,c:'#F59E0B'},{n:'Sprint',v:0.7,c:'#EF4444'}]},
];

const WELLNESS=[
  {n:'Daniel Webb',sleep:8.2,energy:8,soreness:2,mood:8,score:8.5},
  {n:'Tom Fletcher',sleep:7.1,energy:7,soreness:4,mood:7,score:7.0},
  {n:'Sam Reed',sleep:8.8,energy:9,soreness:2,mood:9,score:8.8},
  {n:'James Hill',sleep:6.8,energy:6,soreness:5,mood:6,score:6.2},
  {n:'Jake Harrison',sleep:7.4,energy:5,soreness:8,mood:5,score:4.2},
  {n:'Callum Price',sleep:8.0,energy:8,soreness:3,mood:8,score:8.1},
  {n:'Rajan Steenkamp',sleep:8.5,energy:9,soreness:2,mood:9,score:9.0},
];

const ACADEMY=[
  {n:'Noah Patel',age:20,stage:'2nd XI',target:'Full contract',due:'31 Mar 2026',pri:'urgent',caps:'England U19 — 6 caps',ed:'Apprenticeship'},
  {n:'Ethan Clarke',age:19,stage:'2nd XI',target:'1st XI debut',due:'30 Apr 2026',pri:'urgent',caps:'England U19 — 4 caps',ed:'Sports Science, Loughborough'},
  {n:'Liam Foster',age:17,stage:'U19 Scholar',target:'2nd XI contract',due:'31 Jul 2026',pri:'high',caps:'England U17 — 2 caps',ed:'A-Levels'},
  {n:'Finn Cooper',age:21,stage:'2nd XI',target:'Contract extension',due:'30 Sep 2026',pri:'medium',caps:'England Lions — 1 tour',ed:'Sports Science (grad)'},
  {n:'Jack Williams',age:18,stage:'U19 Scholar',target:'Renew scholarship',due:'31 Aug 2026',pri:'medium',caps:'—',ed:'A-Levels'},
];

const CPA=[
  {s:'Player Welfare & Safeguarding',c:7,t:12,urgent:'Incident log — 2 entries pending'},
  {s:'Pathway Development Standards',c:9,t:10,urgent:null},
  {s:'Financial Reporting & Wage Cap',c:6,t:8,urgent:'Wage cap declaration — due 30 Apr'},
  {s:'Coaching Standards & Qualifications',c:10,t:10,urgent:null},
  {s:'Equality, Diversity & Inclusion',c:5,t:8,urgent:null},
  {s:'Ground & Facilities Standards',c:8,t:9,urgent:null},
  {s:"Women's Cricket Obligations",c:4,t:7,urgent:'Tier 1 Head Physio appointment outstanding'},
];

const DBS=[
  {n:'Dave Richards',r:'Head Coach',exp:'Mar 2028',st:'valid'},
  {n:'Karen Smith',r:'Safeguarding Officer',exp:'Nov 2026',st:'valid'},
  {n:'Tom Kellett',r:'Academy Coach',exp:'Jun 2026',st:'expiring'},
  {n:'Phil Grant',r:'Academy Coach',exp:'Apr 2026',st:'urgent'},
  {n:'Sarah Cooper',r:'Physiotherapist',exp:'Feb 2027',st:'valid'},
  {n:'Mark Evans',r:'S&C Coach',exp:'Aug 2026',st:'valid'},
  {n:'Julie Park',r:'Academy Volunteer',exp:'Mar 2026',st:'expired'},
];

const OVERSEAS=[
  {n:'Rajan Steenkamp',country:'South Africa',formats:'Championship, One Day Cup',visa:'Work Permit — Confirmed',arrives:'Thu 9 Apr 2026',agent:'Kingsgate Sports Mgmt',st:'confirmed'},
  {n:'Brett Mason',country:'Australia',formats:'T20 Blast, The Hundred',visa:'Tier 5 — Pending Home Office',arrives:'Est. 14 Apr 2026',agent:'Coastal Cricket Mgmt',st:'pending'},
];

const SPONSORS=[
  {n:'Midlands Bank',type:'Principal Partner',val:120000,st:'active',ren:'Dec 2026',act:85},
  {n:'Apex Construction',type:'Ground Naming',val:45000,st:'active',ren:'Sep 2026',act:62},
  {n:'TechForge Ltd',type:'Shirt Sleeve',val:28000,st:'negotiating',ren:null,act:0},
  {n:'City Motors',type:'Kit Partner',val:18000,st:'active',ren:'Feb 2027',act:91},
  {n:'NutriFuel Sports',type:'Official Supplier',val:22000,st:'prospecting',ren:null,act:0},
];

const WINDFALL={total:8400000,projects:[
  {n:'Indoor Cricket Centre',budget:2500000,spent:800000,st:'In progress'},
  {n:"Women's Academy Programme",budget:400000,spent:400000,st:'Complete'},
  {n:'Pitch Renovation (G1 & G2)',budget:180000,spent:180000,st:'Complete'},
  {n:'Lumio Cricket Platform',budget:60000,spent:0,st:'Approved'},
  {n:'Fan Zone Redevelopment',budget:560000,spent:470000,st:'In progress'},
]};

type CricketPlayer={id:number;name:string;age:number;role:'Batter'|'Bowler'|'Allrounder'|'WK';nationality:string;format:'All'|'Red-ball'|'White-ball';battingAvg:number;bowlingAvg:number|null;fitness:'fit'|'monitoring'|'injured';contractEnd:string};
const CRICKET_SQUAD:CricketPlayer[]=[
  {id:1,name:'Adam Kingsley',age:37,role:'Batter',nationality:'England',format:'Red-ball',battingAvg:41.2,bowlingAvg:null,fitness:'fit',contractEnd:'2026'},
  {id:2,name:'Harry Fairweather',age:26,role:'Batter',nationality:'England',format:'All',battingAvg:52.8,bowlingAvg:null,fitness:'fit',contractEnd:'2027'},
  {id:3,name:'Dawid Ashworth',age:38,role:'Batter',nationality:'England',format:'All',battingAvg:44.1,bowlingAvg:null,fitness:'monitoring',contractEnd:'2026'},
  {id:4,name:'Jonny Pennington',age:36,role:'WK',nationality:'England',format:'All',battingAvg:39.6,bowlingAvg:null,fitness:'fit',contractEnd:'2027'},
  {id:5,name:'Jonathan Marchant',age:31,role:'WK',nationality:'England',format:'All',battingAvg:30.1,bowlingAvg:null,fitness:'fit',contractEnd:'2026'},
  {id:6,name:'George Holbrook',age:25,role:'Allrounder',nationality:'England',format:'All',battingAvg:34.2,bowlingAvg:28.7,fitness:'fit',contractEnd:'2028'},
  {id:7,name:'Jordan Lockwood',age:29,role:'Allrounder',nationality:'England',format:'White-ball',battingAvg:26.8,bowlingAvg:31.5,fitness:'fit',contractEnd:'2026'},
  {id:8,name:'Dom Westcombe',age:29,role:'Bowler',nationality:'England',format:'Red-ball',battingAvg:18.2,bowlingAvg:32.4,fitness:'fit',contractEnd:'2027'},
  {id:9,name:'Ben Ridley',age:32,role:'Bowler',nationality:'England',format:'Red-ball',battingAvg:12.1,bowlingAvg:24.8,fitness:'fit',contractEnd:'2026'},
  {id:10,name:'Matthew Fenwick',age:28,role:'Bowler',nationality:'England',format:'All',battingAvg:14.6,bowlingAvg:27.2,fitness:'monitoring',contractEnd:'2027'},
  {id:11,name:'Jack Sterling',age:29,role:'Bowler',nationality:'England',format:'White-ball',battingAvg:9.8,bowlingAvg:29.1,fitness:'fit',contractEnd:'2026'},
  {id:12,name:'Dom Talbot',age:25,role:'Bowler',nationality:'England',format:'Red-ball',battingAvg:11.4,bowlingAvg:30.6,fitness:'injured',contractEnd:'2027'},
  {id:13,name:'Will Banister',age:23,role:'Batter',nationality:'England',format:'All',battingAvg:32.8,bowlingAvg:null,fitness:'fit',contractEnd:'2027'},
  {id:14,name:'Fin Hargreaves',age:25,role:'Batter',nationality:'England',format:'Red-ball',battingAvg:38.9,bowlingAvg:null,fitness:'fit',contractEnd:'2026'},
  {id:15,name:'James Sedgwick',age:24,role:'Batter',nationality:'England',format:'All',battingAvg:35.4,bowlingAvg:null,fitness:'fit',contractEnd:'2028'},
  {id:16,name:'Mickey Darlow',age:30,role:'Bowler',nationality:'Australia',format:'White-ball',battingAvg:8.2,bowlingAvg:25.9,fitness:'fit',contractEnd:'2026'},
  {id:17,name:'Shan Abbas',age:36,role:'Batter',nationality:'Pakistan',format:'Red-ball',battingAvg:45.6,bowlingAvg:null,fitness:'fit',contractEnd:'2026'},
  {id:18,name:'Matty Thorpe',age:24,role:'Allrounder',nationality:'England',format:'All',battingAvg:29.7,bowlingAvg:33.8,fitness:'fit',contractEnd:'2027'},
];

type CricketFixture={id:number;date:string;competition:string;opponent:string;venue:string;homeAway:'H'|'A';format:'4-day'|'T20'|'OD'};
const CRICKET_FIXTURES:CricketFixture[]=[
  {id:1,date:'Fri 11 Apr',competition:'County Championship',opponent:'Calderbrook CCC',venue:'Oakridge Park',homeAway:'H',format:'4-day'},
  {id:2,date:'Tue 22 Apr',competition:'County Championship',opponent:'Highford County',venue:'Crown Park Cricket Ground',homeAway:'A',format:'4-day'},
  {id:3,date:'Fri 2 May',competition:'County Championship',opponent:'Riverbank County',venue:'Oakridge Park',homeAway:'H',format:'4-day'},
  {id:4,date:'Sun 18 May',competition:'One Day Cup',opponent:'Brackenfell CCC',venue:'Oakridge Park',homeAway:'H',format:'OD'},
  {id:5,date:'Wed 28 May',competition:'One Day Cup',opponent:'Stannerton County',venue:'Northbridge Cricket Ground',homeAway:'A',format:'OD'},
  {id:6,date:'Fri 6 Jun',competition:'T20 Blast',opponent:'Aldermount County',venue:'Oakridge Park',homeAway:'H',format:'T20'},
  {id:7,date:'Sun 8 Jun',competition:'T20 Blast',opponent:'Calderbrook CCC',venue:'Westmoor Cricket Ground',homeAway:'A',format:'T20'},
  {id:8,date:'Fri 13 Jun',competition:'T20 Blast',opponent:'Castleford CCC',venue:'Oakridge Park',homeAway:'H',format:'T20'},
];

type CricketResult={id:number;date:string;competition:string;opponent:string;homeAway:'H'|'A';score:string;oppScore:string;result:'W'|'L'|'D';format:string};
const CRICKET_RESULTS:CricketResult[]=[
  {id:1,date:'4 Apr',competition:'Friendly',opponent:'Glenhill MCCU',homeAway:'H',score:'412/7d',oppScore:'198 & 204',result:'W',format:'4-day'},
  {id:2,date:'28 Mar',competition:'Pre-season',opponent:'Leeds/Bradford',homeAway:'H',score:'286/6',oppScore:'241',result:'W',format:'OD'},
  {id:3,date:'22 Mar',competition:'Pre-season',opponent:'Oakridge 2nd XI',homeAway:'H',score:'348',oppScore:'352/8',result:'L',format:'OD'},
  {id:4,date:'15 Sep 2025',competition:'County Championship',opponent:'Aldermount County',homeAway:'A',score:'388 & 221/4d',oppScore:'342 & 198',result:'W',format:'4-day'},
  {id:5,date:'5 Sep 2025',competition:'County Championship',opponent:'Somerset',homeAway:'H',score:'312 & 288',oppScore:'412 & 190/3',result:'L',format:'4-day'},
];

type CricketStaff={id:number;name:string;role:string;department:string;dbs:'valid'|'expiring'|'expired';dbsExpiry:string};
const CRICKET_STAFF_EXT:CricketStaff[]=[
  {id:1,name:'Ottis Caldwell',role:'Head Coach',department:'Cricket',dbs:'valid',dbsExpiry:'Sep 2027'},
  {id:2,name:'Ashley Winterbourne',role:'Assistant Coach',department:'Cricket',dbs:'valid',dbsExpiry:'May 2027'},
  {id:3,name:'Ian Tremayne',role:'Academy Director',department:'Pathway',dbs:'expiring',dbsExpiry:'Jun 2026'},
  {id:4,name:'Richard Cavendish',role:'Bowling Coach',department:'Cricket',dbs:'valid',dbsExpiry:'Feb 2028'},
  {id:5,name:'Kunwar Rao',role:'Batting Coach',department:'Cricket',dbs:'valid',dbsExpiry:'Nov 2027'},
  {id:6,name:'Dr Nick Lawson',role:'Club Doctor',department:'Medical',dbs:'valid',dbsExpiry:'Aug 2027'},
  {id:7,name:'Kunle Oduya',role:'Head Physio',department:'Medical',dbs:'valid',dbsExpiry:'Jan 2028'},
  {id:8,name:'Sarah Hollis',role:'Safeguarding Lead',department:'Operations',dbs:'valid',dbsExpiry:'Mar 2028'},
  {id:9,name:'Darren Ellesmere',role:'Director of Cricket',department:'Cricket',dbs:'valid',dbsExpiry:'Oct 2027'},
  {id:10,name:'Phil Grant',role:'Academy Volunteer',department:'Pathway',dbs:'expired',dbsExpiry:'Jan 2026'},
];

type TravelTrip={id:number;dest:string;date:string;nights:number;budget:number;transport:string};
const CRICKET_TRIPS:TravelTrip[]=[
  {id:1,dest:'Crown Park Cricket Ground, London',date:'22 Apr',nights:4,budget:18400,transport:'Coach + Hotel'},
  {id:2,dest:'Northbridge Cricket Ground, Nottingham',date:'28 May',nights:2,budget:9800,transport:'Coach + Hotel'},
  {id:3,dest:'Westmoor Cricket Ground, Manchester',date:'8 Jun',nights:1,budget:4200,transport:'Coach'},
  {id:4,dest:'Taunton, Somerset',date:'20 Jun',nights:4,budget:21600,transport:'Coach + Hotel'},
  {id:5,dest:'Brackenfell Cricket Ground, Brackenfell',date:'4 Jul',nights:2,budget:8900,transport:'Coach + Hotel'},
];

type Contract={player:string;type:string;expiry:string;wage:number;agent:string};
const CRICKET_CONTRACTS:Contract[]=[
  {player:'Harry Fairweather',type:'Central + County',expiry:'Sep 2027',wage:450000,agent:'Oakridge Sports'},
  {player:'Adam Kingsley',type:'County',expiry:'Sep 2026',wage:120000,agent:'Thornton Sports'},
  {player:'Dawid Ashworth',type:'County',expiry:'Sep 2026',wage:180000,agent:'Pinnacle'},
  {player:'Ben Ridley',type:'County',expiry:'Sep 2026',wage:95000,agent:'Lancaster Mgmt'},
  {player:'Jack Sterling',type:'County',expiry:'Sep 2026',wage:62000,agent:'—'},
  {player:'Shan Abbas',type:'Overseas',expiry:'Sep 2026',wage:85000,agent:'Meridian Group'},
];

type Facility={name:string;type:string;status:string;lastCheck:string};
const CRICKET_FACILITIES:Facility[]=[
  {name:'Oakridge Park Main Pitch',type:'Pitch',status:'Excellent',lastCheck:'5 Apr'},
  {name:'Indoor Nets (6 lanes)',type:'Training',status:'Operational',lastCheck:'7 Apr'},
  {name:'Outdoor Nets',type:'Training',status:'2 lanes closed — reseeding',lastCheck:'6 Apr'},
  {name:'Gym & S&C Suite',type:'Performance',status:'Operational',lastCheck:'7 Apr'},
];

const CRICKET_OUTGROUNDS=[
  {name:'North Marine Road, Scarborough',cap:11500,use:'Festival Week'},
  {name:'Clifton Park, York',cap:4500,use:'2nd XI, Academy'},
  {name:'The Circle, Hull',cap:3200,use:'Occasional OD'},
  {name:'St George\'s Road, Harrogate',cap:5000,use:'Festival / T20'},
];

const CRICKET_VIDEO=[
  {id:1,title:'Fairweather 198* vs Calderbrook CCC — innings',dur:'12:42',type:'Match Footage',tags:['batting','brook']},
  {id:2,title:'Ridley 5-fer vs Highford County — spell analysis',dur:'8:14',type:'Match Footage',tags:['bowling','coad']},
  {id:3,title:'Bouncer drill — indoor nets 3 Apr',dur:'24:08',type:'Training',tags:['training','bowling']},
  {id:4,title:'Lancs top-order weakness report',dur:'6:52',type:'Opposition',tags:['scout','lancs']},
  {id:5,title:'March highlights reel',dur:'3:21',type:'Highlights',tags:['media','highlights']},
];

const CRICKET_COMMS=[
  {id:1,author:'Ottis Caldwell',role:'Head Coach',time:'08:12',msg:'Team meeting 9:30 in the pavilion — selection for Friday announced.'},
  {id:2,author:'Kunle Oduya',role:'Physio',time:'Yesterday',msg:'Talbot scan results in — 4 week rehab, no return-to-play before 5 May.'},
  {id:3,author:'Darren Ellesmere',role:'DoC',time:'Yesterday',msg:'Fairweather available full season — ECB rest window confirmed.'},
  {id:4,author:'Comms',role:'Media',time:'2 days ago',msg:'Northbridge Sport will broadcast the Calderbrook CCC opener. Media training Thu 2pm.'},
];

const CHAMPIONSHIP_TABLE=[
  {team:'Highford County',p:3,w:2,d:1,l:0,bonus:12,pts:62},
  {team:'Oakridge',p:3,w:2,d:1,l:0,bonus:11,pts:61},
  {team:'Somerset',p:3,w:2,d:0,l:1,bonus:10,pts:54},
  {team:'Riverbank County',p:3,w:1,d:2,l:0,bonus:11,pts:49},
  {team:'Stannerton County',p:3,w:1,d:1,l:1,bonus:9,pts:41},
  {team:'Brackenfell CCC',p:3,w:1,d:1,l:1,bonus:8,pts:40},
  {team:'Aldermount County',p:3,w:0,d:2,l:1,bonus:7,pts:27},
  {team:'Easthaven CCC',p:3,w:0,d:1,l:2,bonus:5,pts:17},
];

const BLAST_NORTH=[
  {team:'Calderbrook CCC',p:4,w:3,l:1,nrr:1.24,pts:6},
  {team:'Oakridge',p:4,w:3,l:1,nrr:0.88,pts:6},
  {team:'Brackenfell CCC',p:4,w:2,l:2,nrr:0.41,pts:4},
  {team:'Stannerton County',p:4,w:2,l:2,nrr:0.18,pts:4},
  {team:'Birmingham',p:4,w:2,l:2,nrr:-0.02,pts:4},
  {team:'Worcestershire',p:4,w:2,l:2,nrr:-0.31,pts:4},
  {team:'Castleford CCC',p:4,w:1,l:3,nrr:-0.64,pts:2},
  {team:'Leicestershire',p:4,w:1,l:3,nrr:-0.82,pts:2},
  {team:'Northamptonshire',p:4,w:0,l:4,nrr:-1.12,pts:0},
];

const NAV=[
  {id:'briefing',label:'Morning Briefing',icon:'☀'},
];
// Sidebar nav — icons are Lucide name strings (mapped via the v2 Icon
// component imported below). IDs match the `pages` map keys so role
// filtering and view switching keep working unchanged.
const SECTIONED_NAV:{section:string;items:{id:string;label:string;icon:string;badge?:string}[]}[]=[
  {section:'OVERVIEW',items:[
    {id:'dashboard',label:'Dashboard',icon:'home'},
    {id:'briefing',label:'Morning Briefing',icon:'sun'},
    {id:'insights',label:'Insights',icon:'bars'},
  ]},
  {section:'PERFORMANCE',items:[
    {id:'match-centre',label:'Match Centre',icon:'flag'},
    {id:'livescores',label:'Live Scores',icon:'dot'},
    {id:'ai-innings-brief',label:'AI Innings Brief',icon:'sparkles',badge:'NEW'},
    {id:'batting-analytics',label:'Batting Analytics',icon:'bars'},
    {id:'bowling-analytics',label:'Bowling Analytics',icon:'crosshair'},
    {id:'video-analysis',label:'Video Analysis',icon:'play'},
    {id:'opposition',label:'Opposition Scout',icon:'eye'},
    {id:'practice-log',label:'Practice Log',icon:'note'},
    {id:'declaration',label:'Declaration Planner',icon:'note'},
    {id:'dls',label:'D/L Calculator',icon:'cloud'},
    {id:'net-planner',label:'Net Session Planner',icon:'calendar'},
    {id:'performance-stats',label:'Performance Stats',icon:'lightning'},
    {id:'match-report',label:'Match Report',icon:'note'},
  ]},
  {section:'WELFARE',items:[
    {id:'mental-performance',label:'Mental Performance',icon:'sparkles',badge:'NEW'},
  ]},
  {section:'GPS & LOAD',items:[
    {id:'gps',label:'GPS Tracking',icon:'wave',badge:'NEW'},
    {id:'bowling-workload',label:'Bowling Workload',icon:'flame',badge:'NEW'},
    {id:'gps-heatmaps',label:'Heatmaps',icon:'grid',badge:'NEW'},
  ]},
  {section:'SQUAD',items:[
    {id:'squad',label:'Squad Manager',icon:'people'},
    {id:'medical',label:'Medical Hub',icon:'medical'},
    {id:'pathway',label:'Player Pathway',icon:'arrow-up-right'},
    {id:'overseas',label:'Overseas Players',icon:'plane'},
    {id:'contract-hub',label:'Contract Hub',icon:'briefcase'},
    {id:'agent-pipeline',label:'Agent Pipeline',icon:'briefcase'},
    {id:'signings',label:'Signing Pipeline',icon:'crosshair'},
  ]},
  {section:'COMPETITIONS',items:[
    {id:'county-championship',label:'County Championship',icon:'trophy'},
    {id:'vitality-blast',label:'T20 Blast',icon:'lightning'},
    {id:'od-cup',label:'One Day Cup',icon:'trophy'},
    {id:'the-hundred',label:'The Hundred',icon:'trophy'},
    {id:'womens',label:"Women's Cricket",icon:'trophy'},
    {id:'academy',label:'Academy & Youth',icon:'arrow-up-right'},
  ]},
  {section:'GROUNDS',items:[
    {id:'grounds',label:'Grounds & Facilities',icon:'pin',badge:'NEW'},
  ]},
  {section:'COMMS',items:[
    {id:'media-hub',label:'Media Hub',icon:'megaphone',badge:'NEW'},
  ]},
  {section:'OPERATIONS',items:[
    {id:'operations',label:'Operations',icon:'wrench',badge:'NEW'},
    {id:'staff',label:'Staff & HR',icon:'people'},
    {id:'facilities',label:'Facilities & Grounds',icon:'pin'},
    {id:'kit',label:'Kit & Equipment',icon:'briefcase'},
    {id:'travel',label:'Travel & Logistics',icon:'plane'},
    {id:'team-comms',label:'Team Comms',icon:'mic'},
    {id:'tours-camps',label:'Tours & Camps',icon:'calendar',badge:'NEW'},
  ]},
  {section:'COMMERCIAL',items:[
    {id:'commercial',label:'Commercial',icon:'briefcase'},
    {id:'sponsorship',label:'Sponsorship Pipeline',icon:'briefcase'},
    {id:'media',label:'Media & Content',icon:'newspaper'},
    {id:'ticket-matchday',label:'Ticket & Match Day',icon:'ticket'},
    {id:'fan-engagement',label:'Fan Engagement',icon:'people'},
  ]},
  {section:'GOVERNANCE',items:[
    {id:'board',label:'Board Suite',icon:'bars'},
    {id:'compliance',label:'ECB Compliance',icon:'note'},
    {id:'edi',label:'EDI Dashboard',icon:'globe'},
    {id:'safeguarding',label:'Safeguarding',icon:'shield'},
    {id:'finance',label:'Finance',icon:'pound'},
    {id:'settings',label:'Settings',icon:'settings'},
  ]},
];
void NAV;

const fmt=(n:number)=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n);
const pct=(a:number,b:number)=>Math.round((a/b)*100);

const FAN_DATA = {
  membership: { total: 8240, target: 9000, renewalRate: 84, newThisSeason: 620 },
  attendance: [
    { match: 'vs Brackenfell CCC MCCU', att: 3200, cap: 18350, format: '4-day' },
    { match: 'vs Riverbank County (CC)', att: 8400, cap: 18350, format: '4-day', projected: true },
    { match: 'vs Calderbrook CCC (CC)', att: 17200, cap: 18350, format: '4-day', projected: true },
    { match: 'vs Warwicks (T20)', att: 14800, cap: 18350, format: 'T20' },
    { match: 'vs Brackenfell CCC (OD)', att: 6200, cap: 18350, format: 'OD' },
  ] as Array<{match:string;att:number;cap:number;format:string;projected?:boolean}>,
  social: { twitter: 48200, instagram: 62400, facebook: 31800, tiktok: 18600, engagementRate: 4.1 },
  nps: { score: 67, promoters: 72, passives: 18, detractors: 10 },
  seasonTickets: { sold: 6840, target: 7500, renewedEarly: 5210, newBuyers: 820 },
};

const SIGNING_PIPELINE = [
  { id:1, name:'Marcus Bailey',  role:'Fast Bowler',    age:23, county:'Leicestershire', col:'Identified',  value:'£65k/yr',        agent:'Thornton Sports',      notes:'Academy product — wants first team cricket', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id:2, name:'Jordan Hayes',   role:'Opening Batter', age:26, county:'Northants',      col:'Approached',  value:'£90k/yr',        agent:'Pinnacle Sports', notes:'Out of contract Sep 2026 — interested in move north', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id:3, name:'Arjun Singh',    role:'Leg Spinner',    age:28, county:'Middlesex',      col:'Approached',  value:'£75k/yr',        agent:'—',              notes:'Self-represented. Championship specialist.', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id:4, name:'Kyle Beukes',  role:'All-Rounder',    age:30, county:'Cape Town',      col:'Negotiating', value:'£95k + OS slot', agent:'Kingsgate Sports',   notes:'SA passport — would use overseas slot. T20 + OD.', flag:'🇿🇦' },
  { id:5, name:'Tom Hendricks',  role:'WK-Batter',      age:24, county:'Halden CCC',           col:'Negotiating', value:'£72k/yr',        agent:'Oakridge Sports',            notes:'Strong Championship avg 36.4. Long-term Pennington cover.', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id:6, name:'Dev Sharma',     role:'Off Spinner',    age:29, county:'Aldermount County',   col:'Done',        value:'£68k/yr',        agent:'Crown Cricket Mgmt',  notes:'Signed for 2027 — red-ball specialist, 3-year deal.', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id:7, name:'Lee Clifford',   role:'Seam Bowler',    age:22, county:'—',              col:'Failed',      value:'£55k/yr',        agent:'—',              notes:'Released by Brackenfell CCC — signed Stannerton County instead.', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
];

// ─── CRICKET PRE-SEASON / TOUR PREP CAMP VIEW ────────────────────────────────
function CricketPreSeasonView({ session }: { session?: SportsDemoSession }) {
  const SK = 'lumio_cricket_preseason'
  const CK = 'lumio_cricket_training_camp'
  const scoreColor = (s: number) => s >= 80 ? C.green : s >= 60 ? C.amber : '#EF4444'
  const [camp, setCamp] = useState<{ opener: string; opposition: string; squad: number; format: string; isAway: boolean; destination: string } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ opener: '', opposition: '', squad: '18', format: 'County Championship', isAway: false, destination: '' })
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiHighlights, setAiHighlights] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const today2 = new Date().toISOString().split('T')[0]
  const checklistKey = `${SK}_checklist_${today2}`
  const [checklist, setChecklist] = useState<boolean[]>(() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem(checklistKey) : null; return s ? JSON.parse(s) : Array(8).fill(false) } catch { return Array(8).fill(false) } })
  useEffect(() => { localStorage.setItem(checklistKey, JSON.stringify(checklist)) }, [checklist, checklistKey])
  useEffect(() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem(SK) : null; if (s) setCamp(JSON.parse(s)) } catch {} }, [])
  const activate = () => { const c2 = { opener: form.opener, opposition: form.opposition, squad: parseInt(form.squad), format: form.format, isAway: form.isAway, destination: form.destination }; setCamp(c2); localStorage.setItem(SK, JSON.stringify(c2)); setShowModal(false) }
  const deactivate = () => { setCamp(null); localStorage.removeItem(SK) }
  const daysTo = camp ? Math.max(0, Math.ceil((new Date(camp.opener).getTime() - Date.now()) / 86400000)) : 0
  const totalDays = camp ? Math.max(1, daysTo + 30) : 30
  const pctRemaining = camp ? daysTo / totalDays : 1
  const phase = pctRemaining > 0.66 ? 'Fitness Block' : pctRemaining > 0.33 ? 'Skills Block' : 'Match Sharpness'
  const phaseColor = pctRemaining > 0.66 ? '#3B82F6' : pctRemaining > 0.33 ? '#F59E0B' : '#22C55E'
  useEffect(() => {
    if (!camp) return;
    // Demo sessions short-circuit to canned pre-season content — critical:
    // this fires automatically on camp activation, so a live /api/ai/cricket
    // call would burn credits on every founder demo.
    if (session?.isDemoShell !== false) {
      setAiSummary(CANNED.cricket.preSeasonSummary ?? null);
      setAiHighlights('1. Close the last two fitness gaps before the Abu Dhabi block closes out.\n2. One more simulated middle-order innings from Webb and Shaw before the Calderbrook CCC opener.\n3. Dawson workload flag (A:C 1.62) — opening four-day XI needs a seam backup plan.\n4. Ridley\'s reverse-seam consistency is the headline — keep the work intact.\n5. Top-order pitch-read drills before the season opener (seam-friendly surfaces expected).');
      return;
    }
    setAiLoading(true);
    const tourNote = camp.isAway ? `, away tour to ${camp.destination}` : '';
    Promise.all([
      fetch('/api/ai/cricket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:500,messages:[{role:'user',content:`Cricket pre-season AI summary for director/head coach. Opening fixture vs ${camp.opposition} (${camp.format}), ${daysTo} days remaining, ${phase} phase, squad of ${camp.squad}${tourNote}. 6 bullet points: squad fitness, batting readiness, bowling workload, fielding sharpness, injury concerns, one watch-out. No intro.`}]})}).then(r=>r.json()).then(d=>setAiSummary(d.content?.[0]?.text||null)).catch(()=>{}),
      fetch('/api/ai/cricket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:300,messages:[{role:'user',content:`5 urgent pre-season action items for cricket director, ${daysTo} days from opener vs ${camp.opposition} in ${phase} phase${tourNote}. Cover: fitness gaps, batting concerns, bowling load, fielding issues, conditions prep. No intro.`}]})}).then(r=>r.json()).then(d=>setAiHighlights(d.content?.[0]?.text||null)).catch(()=>{})
    ]).finally(()=>setAiLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camp?.opener])
  const readinessScores = [{label:'Fitness Base',score:71},{label:'Batting Form',score:63},{label:'Bowling Workload',score:57,warn:true},{label:'Fielding',score:69},{label:'Squad Balance',score:74},{label:'Injury Status',score:79}]
  const overallScore = Math.round(readinessScores.reduce((a,s)=>a+s.score,0)/readinessScores.length)
  const checklistItems = ['Morning fitness','Batting nets','Bowling workload','Fielding drills','Skills practice','Recovery/physio','Video analysis','Nutrition logged']
  const completedChecklist = checklist.filter(Boolean).length

  // Training Camp state
  const [campSections, setCampSections] = useState<Record<string, boolean>>({ venue: false, schedule: false, kit: false, budget: false, content: false })
  const toggleSection = (s: string) => setCampSections(p => ({ ...p, [s]: !p[s] }))
  // Venue AI
  const [venueQuery, setVenueQuery] = useState({ destination: '', squad: camp?.squad?.toString() || '18', requirements: 'Cricket nets (6 lanes minimum), gym, outdoor practice area, video room' })
  const [venueResults, setVenueResults] = useState<string | null>(null)
  const [venueLoading, setVenueLoading] = useState(false)
  const searchVenues = async () => { setVenueLoading(true); try { const res = await fetch('/api/ai/cricket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, messages: [{ role: 'user', content: `You are a cricket pre-season training camp venue finder. Find 3 ideal training camp venues near/in "${venueQuery.destination}" for a squad of ${venueQuery.squad}. Requirements: ${venueQuery.requirements}. For each venue give: name, location, facilities, approximate cost per day, pros/cons. Format as a clear numbered list.` }] }) }); const data = await res.json(); setVenueResults(data.content?.[0]?.text || 'No results returned') } catch { setVenueResults('Failed to search venues') } setVenueLoading(false) }
  // Schedule
  const CAMP_DAYS = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7']
  const AM_DEFAULTS = ['Batting nets', 'Bowling workload', 'Fielding drills', 'Double session', 'Match simulation', 'Batting nets', 'Bowling workload']
  const PM_DEFAULTS = ['Recovery & physio', 'Video analysis', 'Skills practice', 'Rest', 'Warm-up match', 'Recovery & physio', 'Video analysis']
  const [campSchedule, setCampSchedule] = useState<{ am: string; pm: string; eve: string }[]>(() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem(`${CK}_schedule`) : null; return s ? JSON.parse(s) : CAMP_DAYS.map((_, i) => ({ am: AM_DEFAULTS[i] || 'Training', pm: PM_DEFAULTS[i] || 'Recovery', eve: 'Team meeting' })) } catch { return CAMP_DAYS.map((_, i) => ({ am: AM_DEFAULTS[i] || 'Training', pm: PM_DEFAULTS[i] || 'Recovery', eve: 'Team meeting' })) } })
  useEffect(() => { localStorage.setItem(`${CK}_schedule`, JSON.stringify(campSchedule)) }, [campSchedule])
  // Kit & Equipment
  const KIT_ITEMS = ['Training whites', 'Coloured kit (ODI/T20)', 'Helmets & grilles', 'Batting pads (set)', 'Batting gloves (set)', 'Thigh guards', 'Training bibs', 'Cricket balls (x60)']
  const MEDICAL_ITEMS = ['Physio table (portable)', 'Ice bath supplies', 'Strapping & tape', 'First aid kits (x3)', 'Resistance bands', 'Foam rollers', 'Bowling speed gun', 'Heart rate monitors']
  const [kitChecked, setKitChecked] = useState<boolean[]>(() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem(`${CK}_kit`) : null; return s ? JSON.parse(s) : Array(16).fill(false) } catch { return Array(16).fill(false) } })
  useEffect(() => { localStorage.setItem(`${CK}_kit`, JSON.stringify(kitChecked)) }, [kitChecked])
  const kitProgress = Math.round((kitChecked.filter(Boolean).length / 16) * 100)
  // Budget
  const [campBudget, setCampBudget] = useState<{ flights: number; accommodation: number; meals: number; facility: number; misc: number; total: number }>(() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem(`${CK}_budget`) : null; return s ? JSON.parse(s) : { flights: 10000, accommodation: 15000, meals: 6000, facility: 4000, misc: 2000, total: 40000 } } catch { return { flights: 10000, accommodation: 15000, meals: 6000, facility: 4000, misc: 2000, total: 40000 } } })
  useEffect(() => { localStorage.setItem(`${CK}_budget`, JSON.stringify(campBudget)) }, [campBudget])
  const budgetSpent = campBudget.flights + campBudget.accommodation + campBudget.meals + campBudget.facility + campBudget.misc
  const budgetPct = Math.round((budgetSpent / campBudget.total) * 100)
  // Content & Sponsor Planner
  const [contentSlots, setContentSlots] = useState<{ title: string; type: string; sponsor: string }[]>(() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem(`${CK}_content`) : null; return s ? JSON.parse(s) : [{ title: 'Arrival day vlog', type: 'Video', sponsor: '' }, { title: 'Net session montage', type: 'Reel', sponsor: '' }, { title: 'Player interview', type: 'Video', sponsor: '' }, { title: 'Behind the scenes', type: 'Story', sponsor: '' }, { title: 'Warm-up match highlights', type: 'Video', sponsor: '' }] } catch { return [{ title: 'Arrival day vlog', type: 'Video', sponsor: '' }, { title: 'Net session montage', type: 'Reel', sponsor: '' }, { title: 'Player interview', type: 'Video', sponsor: '' }, { title: 'Behind the scenes', type: 'Story', sponsor: '' }, { title: 'Warm-up match highlights', type: 'Video', sponsor: '' }] } })
  useEffect(() => { localStorage.setItem(`${CK}_content`, JSON.stringify(contentSlots)) }, [contentSlots])
  const [contentIdeas, setContentIdeas] = useState<string | null>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const generateContentIdeas = async () => {
    setContentLoading(true);
    if (session?.isDemoShell !== false) {
      setContentIdeas(CANNED.cricket.contentPlanner ?? null);
      setContentLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/ai/cricket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500, messages: [{ role: 'user', content: `Generate 8 creative content ideas for a county cricket club's pre-season training camp. Mix of video, social, behind-the-scenes, player-led, and sponsor-friendly content. Brief description for each. Numbered list, no intro.` }] }) });
      const data = await res.json();
      setContentIdeas(data.content?.[0]?.text || null);
    } catch { setContentIdeas('Failed to generate ideas'); }
    setContentLoading(false);
  }

  const cardStyle = { backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }
  const sectionHeader = (label: string, key: string, emoji: string) => (
    <button onClick={() => toggleSection(key)} className="w-full flex items-center justify-between p-4" style={{ ...cardStyle, cursor: 'pointer' }}>
      <div className="flex items-center gap-2"><span>{emoji}</span><span className="text-sm font-bold" style={{ color: C.text }}>{label}</span></div>
      <span style={{ color: C.muted, fontSize: 18 }}>{campSections[key] ? '\u2212' : '+'}</span>
    </button>
  )

  if (!camp) return (
    <div className="space-y-6">
      <div className="rounded-2xl p-12 text-center" style={cardStyle}>
        <div className="text-6xl mb-4">🏏</div>
        <h2 className="text-2xl font-black mb-2" style={{color:C.text}}>Pre-Season Camp Mode</h2>
        <p className="text-lg mb-2" style={{color:C.amber}}>Prepare the squad. Read the conditions. Win the series.</p>
        <p className="text-sm max-w-lg mx-auto mb-8" style={{color:C.muted}}>Activate pre-season and Lumio tracks every session, fitness test, bowling workload, batting sharpness and conditions readiness — all the way to your opening fixture.</p>
        <button onClick={()=>setShowModal(true)} className="px-8 py-3 rounded-xl text-sm font-bold" style={{backgroundColor:C.amber,color:'#07080F'}}>Activate Pre-Season</button>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.85)'}} onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={cardStyle}>
            <h3 className="text-lg font-bold" style={{color:C.text}}>Activate Pre-Season</h3>
            <div><label className="text-xs mb-1 block" style={{color:C.dim}}>Season opener date</label><input type="date" value={form.opener} onChange={e=>setForm(f=>({...f,opener:e.target.value}))} className="w-full px-3 py-2.5 rounded-xl text-sm" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.text}}/></div>
            <div><label className="text-xs mb-1 block" style={{color:C.dim}}>Opposition</label><input value={form.opposition} onChange={e=>setForm(f=>({...f,opposition:e.target.value}))} placeholder="e.g. Calderbrook CCC" className="w-full px-3 py-2.5 rounded-xl text-sm" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.text}}/></div>
            <div><label className="text-xs mb-1 block" style={{color:C.dim}}>Squad size</label><input type="number" value={form.squad} onChange={e=>setForm(f=>({...f,squad:e.target.value}))} className="w-full px-3 py-2.5 rounded-xl text-sm" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.text}}/></div>
            <div><label className="text-xs mb-1 block" style={{color:C.dim}}>Format</label><select value={form.format} onChange={e=>setForm(f=>({...f,format:e.target.value}))} className="w-full px-3 py-2.5 rounded-xl text-sm" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.text}}><option value="County Championship">County Championship</option><option value="One-Day">One-Day</option><option value="T20">T20</option></select></div>
            <div className="flex gap-2">{(['Home','Away Tour'] as const).map(t=>(<button key={t} onClick={()=>setForm(f=>({...f,isAway:t==='Away Tour'}))} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{backgroundColor:form.isAway===(t==='Away Tour')?C.amberDim:C.cardAlt,border:form.isAway===(t==='Away Tour')?`1px solid ${C.amber}`:`1px solid ${C.border}`,color:form.isAway===(t==='Away Tour')?C.amber:C.muted}}>{t}</button>))}</div>
            {form.isAway&&<div><label className="text-xs mb-1 block" style={{color:C.dim}}>Tour destination</label><input value={form.destination} onChange={e=>setForm(f=>({...f,destination:e.target.value}))} placeholder="e.g. India" className="w-full px-3 py-2.5 rounded-xl text-sm" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.text}}/></div>}
            <button onClick={activate} disabled={!form.opener||!form.opposition} className="w-full py-3 rounded-xl text-sm font-bold" style={{backgroundColor:form.opener&&form.opposition?C.amber:C.border,color:form.opener&&form.opposition?'#07080F':C.dim}}>Activate Pre-Season 🏏</button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Active banner */}
      <div className="flex items-center justify-between px-5 py-3 rounded-xl" style={{backgroundColor:`${C.amber}20`,border:`1px solid ${C.amber}40`}}>
        <div className="flex items-center gap-3 flex-wrap">
          <span>🏏</span><span className="text-sm font-bold" style={{color:C.text}}>Pre-Season Active</span>
          <span className="text-sm" style={{color:C.amber}}>vs {camp.opposition} | {daysTo} days | {camp.format}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white" style={{backgroundColor:phaseColor}}>{phase}</span>
          {camp.isAway&&<span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{backgroundColor:C.blueDim,color:C.blue}}>Away Tour — {camp.destination}</span>}
        </div>
        <button onClick={deactivate} className="text-xs px-3 py-1.5 rounded-lg" style={{backgroundColor:C.cardAlt,color:C.muted}}>Deactivate</button>
      </div>

      {/* AI summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={cardStyle}><div className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:C.purple}}>AI Pre-Season Summary</div>{aiLoading?<div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-3 rounded animate-pulse" style={{width:`${80+i*5}%`,background:C.border}}/>)}</div>:aiSummary?<div className="text-xs leading-relaxed whitespace-pre-wrap" style={{color:C.text}}>{aiSummary}</div>:<div className="text-xs" style={{color:C.dim}}>Generating...</div>}</div>
        <div className="rounded-xl p-5" style={cardStyle}><div className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:C.amber}}>AI Key Highlights</div>{aiLoading?<div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-3 rounded animate-pulse" style={{width:`${70+i*8}%`,background:C.border}}/>)}</div>:aiHighlights?<div className="text-xs leading-relaxed whitespace-pre-wrap" style={{color:C.text}}>{aiHighlights}</div>:<div className="text-xs" style={{color:C.dim}}>Generating...</div>}</div>
      </div>

      {/* Readiness Score */}
      <div className="rounded-xl p-5" style={cardStyle}>
        <div className="flex items-center justify-between mb-4"><div className="text-sm font-bold" style={{color:C.text}}>Pre-Season Readiness Score</div><div className="text-3xl font-black" style={{color:scoreColor(overallScore)}}>{overallScore}<span className="text-sm" style={{color:C.dim}}>/100</span></div></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{readinessScores.map(s=>(
          <div key={s.label} className="rounded-lg p-3" style={{backgroundColor:C.bg,border:`1px solid ${C.border}`}}>
            <div className="flex items-center justify-between mb-1"><span className="text-xs" style={{color:C.text}}>{s.label}</span><span className="text-sm font-black" style={{color:scoreColor(s.score)}}>{s.score}{'warn' in s && s.warn ? '\u26A0\uFE0F' : ''}</span></div>
            <div className="w-full rounded-full h-1.5" style={{background:C.border}}><div className="h-1.5 rounded-full" style={{width:`${s.score}%`,backgroundColor:scoreColor(s.score)}}/></div>
            {s.score<60&&<div className="text-[9px] mt-1" style={{color:C.red}}>Needs attention</div>}
          </div>
        ))}</div>
      </div>

      {/* Daily Checklist */}
      <div className="rounded-xl p-5" style={cardStyle}>
        <div className="flex items-center justify-between mb-3"><div className="text-sm font-bold" style={{color:C.text}}>Today&apos;s Session Checklist</div><div className="text-xs" style={{color:scoreColor(completedChecklist>=6?80:completedChecklist>=4?65:40)}}>{completedChecklist}/8</div></div>
        <div className="space-y-2">{checklistItems.map((item,i)=>(
          <button key={i} onClick={()=>setChecklist(ck=>ck.map((v,j)=>j===i?!v:v))} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left" style={{backgroundColor:checklist[i]?`${C.green}15`:'transparent',border:checklist[i]?`1px solid ${C.green}33`:`1px solid ${C.border}`}}>
            <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={{borderColor:checklist[i]?C.green:C.border,backgroundColor:checklist[i]?`${C.green}33`:'transparent'}}>{checklist[i]&&<span className="text-[10px]" style={{color:C.green}}>✓</span>}</div>
            <span className="text-xs" style={{color:checklist[i]?C.green:C.text,textDecoration:checklist[i]?'line-through':'none'}}>{item}</span>
          </button>
        ))}</div>
      </div>

      {/* ── Training Camp ── */}
      <div className="rounded-xl p-5" style={cardStyle}>
        <div className="text-sm font-bold mb-1" style={{color:C.text}}>Training Camp</div>
        <div className="text-xs mb-4" style={{color:C.muted}}>Plan your pre-season training camp end-to-end</div>
        <div className="space-y-3">

          {/* 1. Venue Finder AI */}
          {sectionHeader('Venue Finder AI', 'venue', '\uD83C\uDFDF\uFE0F')}
          {campSections.venue && (
            <div className="rounded-xl p-4 space-y-3" style={{backgroundColor:C.bg,border:`1px solid ${C.border}`}}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><label className="text-[10px] block mb-1" style={{color:C.dim}}>Destination</label><input value={venueQuery.destination} onChange={e=>setVenueQuery(q=>({...q,destination:e.target.value}))} placeholder="e.g. Cape Town, SA" className="w-full px-3 py-2 rounded-lg text-xs" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.text}}/></div>
                <div><label className="text-[10px] block mb-1" style={{color:C.dim}}>Squad size</label><input value={venueQuery.squad} onChange={e=>setVenueQuery(q=>({...q,squad:e.target.value}))} className="w-full px-3 py-2 rounded-lg text-xs" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.text}}/></div>
                <div><label className="text-[10px] block mb-1" style={{color:C.dim}}>Requirements</label><input value={venueQuery.requirements} onChange={e=>setVenueQuery(q=>({...q,requirements:e.target.value}))} className="w-full px-3 py-2 rounded-lg text-xs" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.text}}/></div>
              </div>
              <button onClick={searchVenues} disabled={venueLoading||!venueQuery.destination} className="px-4 py-2 rounded-lg text-xs font-bold" style={{backgroundColor:C.amber,color:'#07080F'}}>{venueLoading ? 'Searching...' : 'Search Venues'}</button>
              {venueResults && <div className="text-xs leading-relaxed whitespace-pre-wrap p-3 rounded-lg" style={{backgroundColor:C.card,color:C.text}}>{venueResults}</div>}
            </div>
          )}

          {/* 2. Camp Schedule */}
          {sectionHeader('Camp Schedule', 'schedule', '\uD83D\uDCC5')}
          {campSections.schedule && (
            <div className="rounded-xl p-4 overflow-x-auto" style={{backgroundColor:C.bg,border:`1px solid ${C.border}`}}>
              <table className="w-full text-xs" style={{color:C.text}}>
                <thead><tr style={{color:C.dim}}><th className="text-left p-2">Day</th><th className="text-left p-2">AM</th><th className="text-left p-2">PM</th><th className="text-left p-2">Evening</th></tr></thead>
                <tbody>
                  {CAMP_DAYS.map((day, i) => (
                    <tr key={day} style={{borderTop:`1px solid ${C.border}`}}>
                      <td className="p-2 font-bold" style={{color:C.amber}}>{day}</td>
                      <td className="p-2"><select value={campSchedule[i]?.am||''} onChange={e=>setCampSchedule(s=>s.map((r,j)=>j===i?{...r,am:e.target.value}:r))} className="w-full px-2 py-1 rounded text-xs" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.text}}>
                        {['Batting nets','Bowling workload','Fielding drills','Double session','Match simulation'].map(o=><option key={o} value={o}>{o}</option>)}
                      </select></td>
                      <td className="p-2"><select value={campSchedule[i]?.pm||''} onChange={e=>setCampSchedule(s=>s.map((r,j)=>j===i?{...r,pm:e.target.value}:r))} className="w-full px-2 py-1 rounded text-xs" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.text}}>
                        {['Recovery & physio','Video analysis','Skills practice','Rest','Warm-up match'].map(o=><option key={o} value={o}>{o}</option>)}
                      </select></td>
                      <td className="p-2"><input value={campSchedule[i]?.eve||''} onChange={e=>setCampSchedule(s=>s.map((r,j)=>j===i?{...r,eve:e.target.value}:r))} className="w-full px-2 py-1 rounded text-xs" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.text}}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Kit & Equipment */}
          {sectionHeader('Kit & Equipment', 'kit', '\uD83D\uDC55')}
          {campSections.kit && (
            <div className="rounded-xl p-4 space-y-3" style={{backgroundColor:C.bg,border:`1px solid ${C.border}`}}>
              <div className="flex items-center justify-between mb-2"><span className="text-xs" style={{color:C.muted}}>Packed: {kitChecked.filter(Boolean).length}/16</span><span className="text-xs font-bold" style={{color:kitProgress===100?C.green:kitProgress>=50?C.amber:C.red}}>{kitProgress}%</span></div>
              <div className="w-full rounded-full h-2" style={{background:C.border}}><div className="h-2 rounded-full transition-all" style={{width:`${kitProgress}%`,backgroundColor:kitProgress===100?C.green:kitProgress>=50?C.amber:C.red}}/></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div><div className="text-[10px] font-bold uppercase mb-2" style={{color:C.dim}}>Kit</div>{KIT_ITEMS.map((item,i)=>(
                  <button key={i} onClick={()=>setKitChecked(k=>k.map((v,j)=>j===i?!v:v))} className="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded" style={{color:kitChecked[i]?C.green:C.text}}>
                    <span className="text-[10px]">{kitChecked[i]?'\u2705':'\u2B1C'}</span><span className="text-xs" style={{textDecoration:kitChecked[i]?'line-through':'none'}}>{item}</span>
                  </button>
                ))}</div>
                <div><div className="text-[10px] font-bold uppercase mb-2" style={{color:C.dim}}>Medical</div>{MEDICAL_ITEMS.map((item,i)=>(
                  <button key={i+8} onClick={()=>setKitChecked(k=>k.map((v,j)=>j===i+8?!v:v))} className="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded" style={{color:kitChecked[i+8]?C.green:C.text}}>
                    <span className="text-[10px]">{kitChecked[i+8]?'\u2705':'\u2B1C'}</span><span className="text-xs" style={{textDecoration:kitChecked[i+8]?'line-through':'none'}}>{item}</span>
                  </button>
                ))}</div>
              </div>
            </div>
          )}

          {/* 4. Camp Budget */}
          {sectionHeader('Camp Budget', 'budget', '\uD83D\uDCB0')}
          {campSections.budget && (
            <div className="rounded-xl p-4 space-y-3" style={{backgroundColor:C.bg,border:`1px solid ${C.border}`}}>
              <div className="flex items-center justify-between mb-2"><span className="text-xs" style={{color:C.muted}}>Spent: {'\u00A3'}{budgetSpent.toLocaleString()}</span><span className="text-xs font-bold" style={{color:budgetPct>100?C.red:budgetPct>80?C.amber:C.green}}>of {'\u00A3'}{campBudget.total.toLocaleString()} ({budgetPct}%)</span></div>
              <div className="w-full rounded-full h-2" style={{background:C.border}}><div className="h-2 rounded-full" style={{width:`${Math.min(100,budgetPct)}%`,backgroundColor:budgetPct>100?C.red:budgetPct>80?C.amber:C.green}}/></div>
              <div className="space-y-2 mt-3">
                {([['Flights','flights'],['Accommodation','accommodation'],['Meals','meals'],['Facility hire','facility'],['Miscellaneous','misc']] as const).map(([label,key])=>(
                  <div key={key} className="flex items-center justify-between gap-3">
                    <span className="text-xs w-28" style={{color:C.text}}>{label}</span>
                    <input type="number" value={campBudget[key]} onChange={e=>setCampBudget(b=>({...b,[key]:parseInt(e.target.value)||0}))} className="flex-1 px-2 py-1 rounded text-xs text-right" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.text}}/>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2" style={{borderTop:`1px solid ${C.border}`}}>
                  <span className="text-xs font-bold" style={{color:C.text}}>Budget cap</span>
                  <input type="number" value={campBudget.total} onChange={e=>setCampBudget(b=>({...b,total:parseInt(e.target.value)||0}))} className="w-32 px-2 py-1 rounded text-xs text-right" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.amber}}/>
                </div>
              </div>
            </div>
          )}

          {/* 5. Content & Sponsor Planner */}
          {sectionHeader('Content & Sponsor Planner', 'content', '\uD83C\uDFA5')}
          {campSections.content && (
            <div className="rounded-xl p-4 space-y-3" style={{backgroundColor:C.bg,border:`1px solid ${C.border}`}}>
              <div className="space-y-2">{contentSlots.map((slot,i)=>(
                <div key={i} className="grid grid-cols-3 gap-2">
                  <input value={slot.title} onChange={e=>setContentSlots(s=>s.map((r,j)=>j===i?{...r,title:e.target.value}:r))} className="px-2 py-1.5 rounded text-xs" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.text}} placeholder="Content title"/>
                  <select value={slot.type} onChange={e=>setContentSlots(s=>s.map((r,j)=>j===i?{...r,type:e.target.value}:r))} className="px-2 py-1.5 rounded text-xs" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.text}}>
                    {['Video','Reel','Story','Photo','Blog'].map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                  <input value={slot.sponsor} onChange={e=>setContentSlots(s=>s.map((r,j)=>j===i?{...r,sponsor:e.target.value}:r))} className="px-2 py-1.5 rounded text-xs" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.text}} placeholder="Sponsor (optional)"/>
                </div>
              ))}</div>
              <button onClick={generateContentIdeas} disabled={contentLoading} className="px-4 py-2 rounded-lg text-xs font-bold" style={{backgroundColor:C.amber,color:'#07080F'}}>{contentLoading ? 'Generating...' : 'AI Content Ideas'}</button>
              {contentIdeas && <div className="text-xs leading-relaxed whitespace-pre-wrap p-3 rounded-lg" style={{backgroundColor:C.card,color:C.text}}>{contentIdeas}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Static morning briefing used in demo shells to avoid a live /api/ai/cricket
// hit on every page load. Persona: Oakridge CC director, Championship opener
// vs Calderbrook CCC context.
const DEMO_CRICKET_DASHBOARD_SUMMARY = `Championship opener against Calderbrook CCC on Friday, Oakridge Park 10:30 — sitting 2nd in Division One on 61 points. Fairweather cleared his fitness check Wednesday, Ridley bowled twelve overs unbroken in the nets the same evening. Main Stand gone from Monday's members sale, 94% overall capacity before walk-up opens. Pitch reading seam-friendly under dry April skies; Sinclair returns to the Calderbrook CCC top order against a nip-backing new-ball plan he's historically struggled with (career avg 17 to the ball that holds). One commercial flag: Northbridge Financial's client-day hospitality suite has three boxes still open for Friday — ~£2,400 of unbooked revenue to tidy up before Thursday lunch.`

function CricketPortalInner({ session, slug }: { session?: SportsDemoSession; slug: string }){
  const[page,setPage]=useState('dashboard');

  // Floating sidebar state
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const sidebarLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sidebarExpanded = sidebarPinned || sidebarHovered
  useEffect(() => { setSidebarPinned(typeof window !== 'undefined' && localStorage.getItem('lumio_cricket_sidebar_pinned') === 'true') }, [])
  function toggleSidebarPin() { setSidebarPinned(p => { const next = !p; localStorage.setItem('lumio_cricket_sidebar_pinned', String(next)); return next }) }
  function handleSidebarEnter() { if (sidebarLeaveTimer.current) { clearTimeout(sidebarLeaveTimer.current); sidebarLeaveTimer.current = null }; setSidebarHovered(true) }
  function handleSidebarLeave() { sidebarLeaveTimer.current = setTimeout(() => setSidebarHovered(false), 400) }

  // Role override
  const [roleOverride, setRoleOverride] = useState(session?.role || 'director')
  const currentRole = (roleOverride || 'director') as keyof typeof CRICKET_ROLE_CONFIG
  const roleConfig = CRICKET_ROLE_CONFIG[currentRole] ?? CRICKET_ROLE_CONFIG.director
  const isDirector = currentRole === 'director'
  const isSponsor = currentRole === 'sponsor'

  // liveSession reflects the LIVE role override so RoleSwitcher's
  // "Current view" highlight tracks the override (not session.role at mount).
  const liveSession = session ? { ...session, role: roleOverride } : session

  // Render guard: if `page` falls outside the new role's allowed sidebar after
  // a role switch, snap back to the first allowed nav item.
  const allFlatNav = SECTIONED_NAV.flatMap(s => s.items)
  const allowedPageIds: string[] = roleConfig.sidebar === 'all'
    ? allFlatNav.map(i => i.id)
    : roleConfig.sidebar
  useEffect(() => {
    if (allowedPageIds.length > 0 && !allowedPageIds.includes(page)) {
      setPage(allowedPageIds[0])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleOverride])
  const[battingFmt,setBattingFmt]=useState('All');
  const[bowlingFmt,setBowlingFmt]=useState('All');
  const[videoFilter,setVideoFilter]=useState('All');
  const[perfPlayer,setPerfPlayer]=useState(CRICKET_SQUAD[1].id);
  const[perfTab,setPerfTab]=useState<'Batting'|'Bowling'|'Fielding'>('Batting');
  const[expandedMatch,setExpandedMatch]=useState<number|null>(null);
  const[format,setFormat]=useState('ch');
  const[matchDay,setMatchDay]=useState<number|null>(null);
  const[gpsIdx,setGpsIdx]=useState(0);
  const[gpsTab,setGpsTab]=useState<'session'|'bowling'|'mvt'|'season'|'connect'>('session');

  // ── AI feature state (parent scope — inline components remount each render) ──
  type OppDossier = { batting_threats: string; bowling_threats: string; weaknesses: string; game_plan: string; key_matchup: string };
  const[oppLoading,setOppLoading]=useState(false);
  const[oppDossier,setOppDossier]=useState<OppDossier|null>(null);
  const[oppError,setOppError]=useState<string|null>(null);
  const[oppTarget,setOppTarget]=useState('Calderbrook CCC');
  const[oppFormat,setOppFormat]=useState<'Championship'|'T20'|'OD'>('Championship');

  type PressConferenceResult = { questions: { q: string; a: string }[] };
  const[pcLoading,setPcLoading]=useState(false);
  const[pcResult,setPcResult]=useState<PressConferenceResult|null>(null);
  const[pcError,setPcError]=useState<string|null>(null);
  const[pcOpen,setPcOpen]=useState<number|null>(null);
  const[pcRecent,setPcRecent]=useState('Won vs Brackenfell CCC MCCU — 412/7d');
  const[pcUpcoming,setPcUpcoming]=useState('vs Calderbrook CCC, Championship Round 1, Fri 11 Apr');
  const[pcNews,setPcNews]=useState('Harrison fitness doubt, Steenkamp arriving Thu, Dawson workload managed');

  const[ecbQuestion,setEcbQuestion]=useState('');
  const[ecbAnswer,setEcbAnswer]=useState('');
  const[ecbLoading,setEcbLoading]=useState(false);
  const[optimiserOpen,setOptimiserOpen]=useState(false);
  const[optLoading,setOptLoading]=useState(false);
  const[optResult,setOptResult]=useState<{[fmt:string]:{xi:string[];reasoning:string}}|null>(null);
  const[optError,setOptError]=useState<string|null>(null);

  async function generateSquadOptimiser() {
    setOptLoading(true); setOptError(null);
    try {
      const fit = (SQUAD as Array<Record<string,unknown>>).filter(p=>p.st==='fit').map(p=>({name:p.n,role:p.r,formats:{ch:p.ch,t2:p.t2,od:p.od}}));
      const res = await fetch('/api/ai/cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          messages: [{ role: 'user', content: `Oakridge CC squad for this week. Available players (fit only): ${JSON.stringify(fit)}. This week: Championship vs Calderbrook CCC (4-day, Fri), plus T20 Blast planning. Suggest the optimal XI for each format, considering format eligibility and player roles. Chris Dawson should have capped overs in Championship. Rajan Steenkamp available Championship + OD only. Respond ONLY in JSON (no markdown): { "championship": { "xi": ["player1", ...11 players], "reasoning": "2 sentences" }, "t20": { "xi": ["player1", ...11 players], "reasoning": "2 sentences" } }` }],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const text: string = data?.content?.[0]?.text || '';
      const s = text.indexOf('{'); const e = text.lastIndexOf('}');
      if (s === -1 || e === -1) throw new Error('No JSON in response');
      setOptResult(JSON.parse(text.slice(s, e + 1)));
    } catch (err) {
      setOptError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setOptLoading(false);
    }
  }

  const[overseasTab,setOverseasTab]=useState<'current'|'recruitment'>('current');
  const[eligName,setEligName]=useState('');
  const[eligCountry,setEligCountry]=useState('');
  const[eligGuideOpen,setEligGuideOpen]=useState(false);

  const[dlsState,setDlsState]=useState({overs:50,wickets:0,interruption:'batting',overslost:10,targetOvers:40,format:'OD' as 'OD'|'T20',team1Score:250,oversFaced:50,currentScore:120,currentOvers:25});

  const[declAiLoading,setDeclAiLoading]=useState(false);
  const[declAiResult,setDeclAiResult]=useState('');
  const[declState,setDeclState]=useState({targetScore:280,currentScore:180,overs:45,bowlOvers:90,wickets:4,days:4,dayTime:'Day 3 · Session 2'});

  // Toss Advisor state
  const[tossGround,setTossGround]=useState('Oakridge Park');
  const[tossWeather,setTossWeather]=useState('Overcast');
  const[tossPitch,setTossPitch]=useState('Normal');
  const[tossBatting,setTossBatting]=useState('Balanced');
  const[tossLoading,setTossLoading]=useState(false);
  const[tossResult,setTossResult]=useState<{decision:string;confidence:string;reasoning:string;key_factor:string}|null>(null);
  const[tossError,setTossError]=useState<string|null>(null);
  // Contract AI state
  const[contractAiLoading,setContractAiLoading]=useState(false);
  const[contractAiResult,setContractAiResult]=useState<{urgent:{player:string;recommendation:string;reason:string}[];strategy_note:string}|null>(null);
  const[contractAiError,setContractAiError]=useState<string|null>(null);
  // Net session planner + AI
  const[netSessions,setNetSessions]=useState<Record<string,string>>({Mon:'Batting',Tue:'Bowling',Wed:'S&C',Thu:'Batting',Fri:'Match',Sat:'Match',Sun:'Rest'});
  const[netAiLoading,setNetAiLoading]=useState(false);
  const[netAiResult,setNetAiResult]=useState<string|null>(null);
  const[netAiError,setNetAiError]=useState<string|null>(null);
  // Match report state
  const[reportMatchIdx,setReportMatchIdx]=useState(0);
  const[reportMom,setReportMom]=useState('Harry Fairweather');
  const[reportNotes,setReportNotes]=useState('Fairweather 124, Ridley 4-62, disciplined bowling throughout');
  const[reportLoading,setReportLoading]=useState(false);
  const[reportText,setReportText]=useState<string|null>(null);
  const[reportError,setReportError]=useState<string|null>(null);
  const[reportCopied,setReportCopied]=useState(false);
  const[reportTab,setReportTab]=useState<'generate'|'previous'>('generate');

  async function getTossAdvice() {
    setTossLoading(true); setTossError(null);
    try {
      const res = await fetch('/api/ai/cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          messages: [{ role: 'user', content: `You are a county cricket analyst. Toss situation: Ground: ${tossGround}. Weather: ${tossWeather}. Pitch: ${tossPitch}. Opposition batting: ${tossBatting}. Should Oakridge bat or field first in a 4-day County Championship match? Give a clear recommendation with reasoning. Respond ONLY in JSON (no markdown): { "decision": "BAT" or "FIELD", "confidence": "High/Medium/Low", "reasoning": "2-3 sentences", "key_factor": "one sentence on the single most important factor" }` }],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const text: string = data?.content?.[0]?.text || '';
      const s = text.indexOf('{'); const e = text.lastIndexOf('}');
      if (s === -1 || e === -1) throw new Error('No JSON in response');
      const parsed = JSON.parse(text.slice(s, e + 1));
      setTossResult({ decision: parsed.decision || '', confidence: parsed.confidence || '', reasoning: parsed.reasoning || '', key_factor: parsed.key_factor || '' });
    } catch (err) {
      setTossError(err instanceof Error ? err.message : 'Failed to get toss advice');
    } finally {
      setTossLoading(false);
    }
  }

  async function getContractAiSummary() {
    setContractAiLoading(true); setContractAiError(null);
    if (session?.isDemoShell !== false) {
      setContractAiResult({
        urgent: [
          { player: 'Harry Fairweather', recommendation: 'Extend 3 years to end-2029 on the drafted combined county/central tier', reason: 'Peak-form top-order anchor; retaining him underpins the Crownmark Cricket image-rights schedule.' },
          { player: 'Ben Ridley',        recommendation: 'Open extension talks immediately, 2-year deal with Hundred release window', reason: 'Leading Championship bowler — reverse-swing work from camp is a rare asset to lose.' },
          { player: 'Adam Kingsley',     recommendation: 'One-year extension with a structured retirement path', reason: 'At 37, succession planning is on the table; the club keeps the dressing-room voice.' },
        ],
        strategy_note: 'Prioritise Fairweather + Ridley before the Calderbrook CCC opener so the announce lands inside commercial-partner sign-off. Kingsley\'s one-year is a morale move — worth it. Shan Abbas\'s Pakistan commitments warrant a separate conversation and are not urgent for this board cycle.',
      });
      setContractAiLoading(false);
      return;
    }
    try {
      const expiring2026 = CRICKET_CONTRACTS.filter(c => c.expiry.includes('2026'));
      const res = await fetch('/api/ai/cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [{ role: 'user', content: `You are a cricket club's commercial director. Here are the contracts expiring this season: ${JSON.stringify(expiring2026)}. Also note: Adam Kingsley is 37 and considering retirement. Shan Abbas is Pakistan captain with international commitments. Ben Ridley is the leading Championship bowler. Write a renewal priority memo for the Board. Respond ONLY in JSON (no markdown): { "urgent": [{ "player": "name", "recommendation": "action", "reason": "1 sentence" }], "strategy_note": "2-3 sentence overall strategic note for the board" }` }],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const text: string = data?.content?.[0]?.text || '';
      const s = text.indexOf('{'); const e = text.lastIndexOf('}');
      if (s === -1 || e === -1) throw new Error('No JSON in response');
      const parsed = JSON.parse(text.slice(s, e + 1));
      setContractAiResult({
        urgent: Array.isArray(parsed.urgent) ? parsed.urgent : [],
        strategy_note: parsed.strategy_note || '',
      });
    } catch (err) {
      setContractAiError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setContractAiLoading(false);
    }
  }

  async function askEcbCompliance(q: string) {
    const question = q || ecbQuestion;
    if (!question.trim()) return;
    setEcbQuestion(question);
    setEcbLoading(true); setEcbAnswer('');
    try {
      const res = await fetch('/api/ai/cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 600,
          system: 'You are an ECB compliance expert helping a County Championship club. Be direct and specific. The club is Oakridge CC, CPA completion 73%, 3 DBS issues, safeguarding incidents pending. Answer questions about County Partnership Agreement requirements, ECB standards, and deadlines.',
          messages: [{ role: 'user', content: question }],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      setEcbAnswer(data?.content?.[0]?.text || '');
    } catch (err) {
      setEcbAnswer(`Error: ${err instanceof Error ? err.message : 'request failed'}`);
    } finally {
      setEcbLoading(false);
    }
  }

  async function askDeclarationAdvice() {
    setDeclAiLoading(true); setDeclAiResult('');
    try {
      const res = await fetch('/api/ai/cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 400,
          messages: [{ role: 'user', content: `County Championship 4-day match. Current score: ${declState.currentScore}/${declState.wickets}. Planning to declare at ${declState.targetScore}. ${declState.overs} overs left in the match. Should we declare now or bat on? Give a direct 2-3 sentence recommendation.` }],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      setDeclAiResult(data?.content?.[0]?.text || '');
    } catch (err) {
      setDeclAiResult(`Error: ${err instanceof Error ? err.message : 'request failed'}`);
    } finally {
      setDeclAiLoading(false);
    }
  }

  async function generateOppDossier() {
    setOppLoading(true); setOppError(null);
    try {
      const res = await fetch('/api/ai/cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          messages: [{ role: 'user', content: `Generate a cricket opposition dossier for Oakridge CC vs ${oppTarget} in the ${oppFormat === 'Championship' ? 'County Championship 2026' : oppFormat === 'T20' ? 'T20 Blast 2026' : 'One Day Cup 2026'}. Include realistic insights. Respond ONLY in JSON (no markdown): { "batting_threats": "2-3 sentence analysis", "bowling_threats": "2-3 sentence analysis", "weaknesses": "2-3 sentence analysis", "game_plan": "3-4 sentence tactical recommendation", "key_matchup": "one specific player vs player matchup to target" }` }],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const text: string = data?.content?.[0]?.text || '';
      const s = text.indexOf('{'); const e = text.lastIndexOf('}');
      if (s === -1 || e === -1) throw new Error('No JSON in response');
      setOppDossier(JSON.parse(text.slice(s, e + 1)) as OppDossier);
    } catch (err) {
      setOppError(err instanceof Error ? err.message : 'Failed to generate dossier');
    } finally {
      setOppLoading(false);
    }
  }

  async function generatePressConference() {
    setPcLoading(true); setPcError(null);
    try {
      const res = await fetch('/api/ai/cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          messages: [{ role: 'user', content: `You are a cricket media officer preparing a Oakridge CC head coach for a press conference. Based on: Recent result: ${pcRecent}. Upcoming: ${pcUpcoming}. Team news: ${pcNews}. Generate 5 likely journalist questions with suggested answers. Respond ONLY in JSON (no markdown): { "questions": [ { "q": "question text", "a": "suggested answer 2-3 sentences" }, ... ] }` }],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const text: string = data?.content?.[0]?.text || '';
      const s = text.indexOf('{'); const e = text.lastIndexOf('}');
      if (s === -1 || e === -1) throw new Error('No JSON in response');
      setPcResult(JSON.parse(text.slice(s, e + 1)) as PressConferenceResult);
    } catch (err) {
      setPcError(err instanceof Error ? err.message : 'Failed to generate briefing');
    } finally {
      setPcLoading(false);
    }
  }

  const printMorningBriefing = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Morning Briefing — Oakridge CC — 8 April 2026</title>
<style>
  body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; color: #1a1a2e; font-size: 13px; line-height: 1.7; }
  h1 { font-size: 20px; border-bottom: 2px solid #8B5CF6; padding-bottom: 8px; margin-bottom: 6px; }
  .meta { font-size: 11px; color: #666; margin-bottom: 20px; }
  .briefing { font-style: italic; border-left: 3px solid #8B5CF6; padding-left: 16px; margin-bottom: 24px; }
  .kpis { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 24px; }
  .kpi { border: 1px solid #ddd; border-radius: 6px; padding: 12px; text-align: center; }
  .kpi-val { font-size: 20px; font-weight: 600; }
  .kpi-label { font-size: 10px; color: #666; text-transform: uppercase; }
  .section { margin-bottom: 20px; }
  .section h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 10px; }
  .action { display: flex; gap: 8px; padding: 6px 0; border-bottom: 1px solid #eee; font-size: 12px; }
  .dot { width: 6px; height: 6px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
  .red { background: #EF4444; } .amber { background: #F59E0B; }
  footer { margin-top: 32px; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }
  @media print { body { margin: 20px; } }
</style></head><body>
<h1>Lumio AI — Morning Briefing</h1>
<div class="meta">Oakridge County Cricket Club · Wednesday 8 April 2026 · Generated 06:45 · CONFIDENTIAL</div>
<div class="kpis">
  <div class="kpi"><div class="kpi-val" style="color:#10B981">11/13</div><div class="kpi-label">Squad Fit</div><div style="font-size:10px;color:#666">1 injury · 1 monitoring</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#F59E0B">73%</div><div class="kpi-label">CPA Completion</div><div style="font-size:10px;color:#666">3 sections incomplete</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#EF4444">3</div><div class="kpi-label">DBS Issues</div><div style="font-size:10px;color:#666">1 expired · 2 at risk</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#14B8A6">£4.7m</div><div class="kpi-label">Windfall Remaining</div><div style="font-size:10px;color:#666">of £8.4m total</div></div>
</div>
<div class="briefing">
  <p>"Good morning. The County Championship opens in six days. Jake Harrison is 70% — hamstring, grade 2. Physio wants a final assessment Wednesday. Chris Dawson's A:C ratio is at 1.62 — cap his workload this block. Rajan Steenkamp visa confirmed — arrives Thursday. Brett Mason still pending — chase the agent today. Noah Patel contract decision overdue since 31 March. Phil Grant DBS expired — must resolve before academy activity resumes. Midlands Bank activation at 85% — one outstanding obligation before round one. Make it count."</p>
</div>
<div class="section"><h3>Priority Actions Today</h3>
  <div class="action"><div class="dot red"></div>Noah Patel contract review — overdue since 31 Mar</div>
  <div class="action"><div class="dot amber"></div>Chase Brett Mason visa — agent Coastal Cricket Mgmt</div>
  <div class="action"><div class="dot red"></div>Phil Grant DBS renewal — expired Apr 2026</div>
  <div class="action"><div class="dot amber"></div>Jake Harrison physio assessment — Wed AM</div>
  <div class="action"><div class="dot amber"></div>CPA player welfare log — 2 entries pending</div>
</div>
<footer>Generated by Lumio Cricket · lumiocms.com · For internal distribution only · ${new Date().toLocaleDateString('en-GB')}</footer>
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  function getPitchReport(md: number | null): { label: string; icon: string; color: string; description: string } {
    if(md===null) return { label:'Pre-match', icon:'🏏', color:C.teal,  description:'Pitch prep underway — dry surface, covers on overnight' };
    if(md===1)    return { label:'Day 1 — Fresh',    icon:'🟢', color:C.green, description:'Hard, dry surface. Seam movement early. Pack the slips.' };
    if(md===2)    return { label:'Day 2 — Settling', icon:'🟡', color:C.amber, description:'Surface flattening. Batters in command from Session 2.' };
    if(md===3)    return { label:'Day 3 — Wearing',  icon:'🟠', color:C.amber, description:'Rough patches developing. Spinners increasingly effective.' };
    return { label:'Day 4 — Turning', icon:'🔴', color:C.red, description:'Significant turn and uneven bounce. Spinners to lead attack.' };
  }
  const gp=GPS_DATA[gpsIdx];

  const statusColor=(st:string)=>{
    if(st==='fit'||st==='confirmed'||st==='valid'||st==='active'||st==='Complete')return C.green;
    if(st==='monitoring'||st==='pending'||st==='expiring'||st==='negotiating'||st==='amber'||st==='In progress'||st==='Approved')return C.amber;
    if(st==='injury'||st==='expired'||st==='urgent'||st==='red')return C.red;
    return C.muted;
  };
  const statusBg=(st:string)=>{
    const s=statusColor(st);
    return s===C.green?C.greenDim:s===C.amber?C.amberDim:s===C.red?C.redDim:C.border;
  };

  const Pill=({label,active,onClick}:{label:string;active:boolean;onClick:()=>void})=>(
    <button onClick={onClick} style={{padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:500,cursor:'pointer',
      border:'1px solid',transition:'all 0.15s',
      borderColor:active?C.purple:C.border,
      background:active?C.purpleDim:'transparent',
      color:active?C.purple:C.muted}}>
      {label}
    </button>
  );

  const Stat=({label,value,sub,color=C.teal}:{label:string;value:string|number;sub?:string;color?:string})=>(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'14px 18px',flex:1,minWidth:0}}>
      <div style={{fontSize:11,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>{label}</div>
      <div style={{fontSize:22,fontWeight:600,color,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>{sub}</div>}
    </div>
  );

  const Card=({children,style={}}:{children:React.ReactNode;style?:React.CSSProperties})=>(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,...style}}>{children}</div>
  );

  const SectionHead=({title,sub}:{title:string;sub?:string})=>(
    <div style={{marginBottom:20}}>
      <h2 style={{fontSize:20,fontWeight:600,color:C.text,margin:0}}>{title}</h2>
      {sub&&<p style={{fontSize:13,color:C.muted,margin:'4px 0 0'}}>{sub}</p>}
    </div>
  );

  const StatusBadge=({st,label}:{st:string;label?:string})=>{
    const l=label||st;
    return <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,
      color:statusColor(st),background:statusBg(st)}}>{l}</span>;
  };

  // ── CRICKET GROUND SVG ────────────────────────────────────────────
  const CricketGround=({player}:{player:{lines:{x1:number;y1:number;x2:number;y2:number}[];zones:{x:number;y:number;r:number;c:string;o:number}[]}})=>(
    <svg viewBox="0 0 400 400" style={{width:'100%',maxWidth:360,display:'block'}}>
      {/* Outfield */}
      <ellipse cx="200" cy="200" rx="175" ry="165" fill="#0a1f0a"/>
      <ellipse cx="200" cy="200" rx="175" ry="165" fill="none" stroke="#1a4a1a" strokeWidth="0.5"/>
      {/* Mowing stripes */}
      {[0,1,2,3,4,5,6,7].map(i=>(
        <ellipse key={i} cx="200" cy="200" rx={40+i*17} ry={38+i*16}
          fill="none" stroke={i%2===0?'rgba(255,255,255,0.018)':'rgba(0,0,0,0.1)'} strokeWidth="8"/>
      ))}
      {/* Boundary rope */}
      <ellipse cx="200" cy="200" rx="174" ry="164" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.5"/>
      {/* 30-yard circle */}
      <ellipse cx="200" cy="200" rx="103" ry="96" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="5,5"/>
      {/* Pitch */}
      <rect x="192" y="108" width="16" height="184" rx="2" fill="#8B6914" opacity="0.8"/>
      <rect x="192" y="108" width="16" height="184" rx="2" fill="none" stroke="#A0845C" strokeWidth="0.5"/>
      {/* Creases */}
      <line x1="188" y1="137" x2="212" y2="137" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
      <line x1="188" y1="263" x2="212" y2="263" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
      {/* Stumps */}
      {[193,197,201,205,209].map((x,i)=>(i<3?[
        <rect key={`t${i}`} x={x} y="105" width="1.5" height="14" fill="white" rx="0.5"/>,
        <rect key={`b${i}`} x={x} y="281" width="1.5" height="14" fill="white" rx="0.5"/>
      ]:null))}
      {/* Bails */}
      <line x1="193" y1="105" x2="208" y2="105" stroke="white" strokeWidth="1" opacity="0.8"/>
      <line x1="193" y1="295" x2="208" y2="295" stroke="white" strokeWidth="1" opacity="0.8"/>
      {/* Sprint lines */}
      {player.lines.map((l,i)=>(
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="#F59E0B" strokeWidth="1.5" opacity="0.55" strokeDasharray="4,3"/>
      ))}
      {/* Heat zones */}
      {player.zones.map((z,i)=>(
        <circle key={i} cx={z.x} cy={z.y} r={z.r} fill={z.c} opacity={z.o}/>
      ))}
      {/* Sprint dots at line starts */}
      {player.lines.map((l,i)=>(
        <circle key={`d${i}`} cx={l.x2} cy={l.y2} r="3" fill="#F59E0B" opacity="0.7"/>
      ))}
      {/* Position labels */}
      <text x="200" y="62" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">Long off · Long on</text>
      <text x="200" y="358" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">Fine leg · Third man</text>
      <text x="28" y="205" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">Mid W</text>
      <text x="372" y="205" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">Cover</text>
    </svg>
  );

  // ── BOWLING LOAD GAUGE ────────────────────────────────────────────
  const BowlGauge=({bowl}:{bowl:{del:number;lim:number;ov:number;st:string;acr?:number;note?:string}|null})=>{
    if(!bowl)return null;
    const pct=Math.min(bowl.del/bowl.lim,1);
    const r=52,cx=80,cy=80;
    const angle=(pct*180);
    const rad=(angle-180)*Math.PI/180;
    const x2=cx+r*Math.cos(rad);
    const y2=cy+r*Math.sin(rad);
    const arcColor=bowl.st==='green'?C.green:bowl.st==='amber'?C.amber:C.red;
    const largeArc=angle>180?1:0;
    const d=`M ${cx-r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    const bg=`M ${cx-r} ${cy} A ${r} ${r} 0 1 1 ${cx+r} ${cy}`;
    return(
      <Card>
        <div style={{fontSize:12,color:C.muted,marginBottom:12,fontWeight:500}}>Bowling Load — This Week</div>
        <div style={{display:'flex',gap:20,alignItems:'center'}}>
          <svg viewBox="0 0 160 95" style={{width:160,flexShrink:0}}>
            <path d={bg} fill="none" stroke={C.border} strokeWidth="10" strokeLinecap="round"/>
            {pct>0&&<path d={d} fill="none" stroke={arcColor} strokeWidth="10" strokeLinecap="round"/>}
            <text x={cx} y={cy+8} textAnchor="middle" fill={C.text} fontSize="18" fontWeight="600">{bowl.del}</text>
            <text x={cx} y={cy+22} textAnchor="middle" fill={C.muted} fontSize="10">of {bowl.lim} deliveries</text>
            <text x={cx} y={cy+35} textAnchor="middle" fill={C.dim} fontSize="9">{bowl.ov} overs</text>
          </svg>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div>
              <div style={{fontSize:10,color:C.dim,marginBottom:2}}>Acute:Chronic Ratio</div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:20,fontWeight:600,color:(bowl.acr??0)>1.3?C.red:(bowl.acr??0)>1.0?C.amber:C.green}}>{(bowl.acr??0).toFixed(2)}</span>
                <span style={{padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:500,
                  color:statusColor(bowl.st),background:statusBg(bowl.st)}}>
                  {bowl.st==='green'?'Safe zone':bowl.st==='amber'?'Manage carefully':'Danger zone'}
                </span>
              </div>
            </div>
            <div style={{fontSize:11,color:C.muted}}>Target sweet spot: 0.8–1.3</div>
            {bowl.note&&<div style={{fontSize:11,color:C.amber,background:C.amberDim,padding:'6px 10px',borderRadius:6}}>{bowl.note}</div>}
          </div>
        </div>
      </Card>
    );
  };

  // ── PAGE: BRIEFING ────────────────────────────────────────────────
  const Briefing=()=>(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,gap:16}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:600,color:C.text}}>Morning Briefing</h2>
          <p style={{margin:'4px 0 0',fontSize:12,color:C.muted}}>Wednesday 8 April 2026 · Oakridge CC · County Championship begins in 6 days</p>
        </div>
        <button onClick={printMorningBriefing} style={{background:C.purple,color:'#fff',border:'none',borderRadius:6,padding:'8px 14px',fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>📄 Print Briefing</button>
      </div>
      <Card style={{background:'linear-gradient(135deg,#0F1629 0%,#141d35 100%)',borderColor:C.purpleDim,marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
          <div style={{width:36,height:36,borderRadius:'50%',background:C.purpleDim,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🤖</div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:C.purple}}>Lumio AI — Director of Cricket Briefing</div>
            <div style={{fontSize:11,color:C.dim}}>Generated 06:45 · Based on live squad, medical & commercial data</div>
          </div>
        </div>
        <div style={{fontSize:14,color:C.text,lineHeight:1.75,fontStyle:'italic',borderLeft:`3px solid ${C.purple}`,paddingLeft:16}}>
          "Good morning. The County Championship opens in six days. Here's your picture.<br/><br/>
          <strong style={{color:C.amber,fontStyle:'normal'}}>Squad fitness:</strong> Jake Harrison is 70% — hamstring, grade 2. Physio wants a final assessment Wednesday before you select; he should be available round two at the latest. Chris Dawson's acute:chronic ratio is at 1.62 — his workload needs capping this block or he'll miss round one. All others are clear.<br/><br/>
          <strong style={{color:C.teal,fontStyle:'normal'}}>Overseas:</strong> Rajan Steenkamp visa confirmed — arrives Thursday. Available from the Championship opener. Brett Mason (T20 and Hundred) — visa still pending with the Home Office; expected 14 April, but chase the agent today.<br/><br/>
          <strong style={{color:C.green,fontStyle:'normal'}}>Academy:</strong> Noah Patel and Ethan Clarke both need contract decisions this month. Noah's decision deadline was March 31 — already overdue. Recommend scheduling reviews this week.<br/><br/>
          <strong style={{color:C.red,fontStyle:'normal'}}>ECB:</strong> CPA self-assessment is 73% complete — three sections outstanding. Player welfare log has two incidents pending review. Phil Grant's DBS expired this month; Julie Park's is also lapsed. Both must be resolved before academy activity resumes.<br/><br/>
          <strong style={{color:C.amber,fontStyle:'normal'}}>Commercial:</strong> Midlands Bank activation pack is at 85% — one outstanding obligation before round one. TechForge shirt sleeve negotiation has stalled; worth a call this week. Windfall spend tracker: Fan Zone is on budget, Indoor Centre is 32% spent against a full-season build schedule.<br/><br/>
          Make it count."
        </div>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        {[
          {label:'Squad Fit',value:'11 / 13',color:C.green,sub:'1 injury · 1 monitoring'},
          {label:'CPA Completion',value:'73%',color:C.amber,sub:'3 sections incomplete'},
          {label:'DBS Issues',value:'3',color:C.red,sub:'1 expired · 1 urgent · 1 expiring'},
          {label:'Windfall Remaining',value:'£4.7m',color:C.teal,sub:'of £8.4m total'},
        ].map((s,i)=><Stat key={i} label={s.label} value={s.value} color={s.color} sub={s.sub}/>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Priority Actions Today</div>
          {[
            {label:'Noah Patel contract review — overdue since 31 Mar',color:C.red},
            {label:"Chase Brett Mason visa — agent Coastal Cricket Mgmt",color:C.amber},
            {label:"Phil Grant DBS renewal — expired Apr 2026",color:C.red},
            {label:"Jake Harrison physio assessment — Wed AM",color:C.amber},
            {label:"CPA player welfare log — 2 entries pending",color:C.amber},
          ].map((a,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<4?`1px solid ${C.border}`:'none'}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:a.color,flexShrink:0}}/>
              <span style={{fontSize:13,color:C.muted}}>{a.label}</span>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Upcoming Fixtures</div>
          {[
            {comp:'County Championship',opp:'vs Calderbrook CCC (H)',date:'Fri 11 Apr',format:'4-day'},
            {comp:'County Championship',opp:'vs Riverbank County (H)',date:'Tue 29 Apr',format:'4-day'},
            {comp:'One Day Cup',opp:'vs Brackenfell CCC (H)',date:'Sun 18 May',format:'50-over'},
            {comp:'T20 Blast',opp:'vs Warwicks (H)',date:'Fri 6 Jun',format:'T20'},
          ].map((f,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<3?`1px solid ${C.border}`:'none'}}>
              <div>
                <div style={{fontSize:13,color:C.text,fontWeight:500}}>{f.opp}</div>
                <div style={{fontSize:11,color:C.dim}}>{f.comp}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:12,color:C.muted}}>{f.date}</div>
                <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:C.purpleDim,color:C.purple}}>{f.format}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );

  // ── PAGE: INSIGHTS ────────────────────────────────────────────────
  // Mirrors the womens FC Insights pattern (src/app/womens/[slug]/page.tsx
  // ~line 121). Single component, internal role-tab state, per-role
  // content function. Demo data inline (no shared config). Cloned rather
  // than extracted because cricket and womens use different helper
  // primitives (Card/SectionHead vs ICard/SectionHeader/StatCard).
  const Insights=()=>{
    const [insightsRole, setInsightsRole] = useState<'director'|'head_coach'|'captain'|'analyst'|'sponsor'|'groundsman'|'medical'|'media'|'operations'|'mental'>('director');
    const insightsRoles = [
      { id:'director' as const,   label:'Director',    icon:'🏛️', accent:C.purple },
      { id:'head_coach' as const, label:'Head Coach',  icon:'🎯', accent:C.green },
      { id:'captain' as const,    label:'Captain',     icon:'🏆', accent:'#3B82F6' },
      { id:'analyst' as const,    label:'Analyst',     icon:'📊', accent:C.amber },
      { id:'sponsor' as const,    label:'Sponsor',     icon:'🤝', accent:'#EC4899' },
      { id:'groundsman' as const, label:'Groundsman',  icon:'🌱', accent:'#16A34A' },
      { id:'medical' as const,    label:'Medical',     icon:'🏥', accent:'#DC2626' },
      { id:'media' as const,      label:'Media',       icon:'📣', accent:'#06B6D4' },
      { id:'operations' as const, label:'Operations',  icon:'🧰', accent:'#0EA5E9' },
      { id:'mental' as const,     label:'Mental',      icon:'🧠', accent:'#A855F7' },
    ];
    const Tile=({label,value,sub,color}:{label:string;value:string;sub?:string;color:string})=>(
      <div style={{background:C.card,border:`1px solid ${color}33`,borderRadius:12,padding:18}}>
        <div style={{fontSize:11,color:C.dim,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600}}>{label}</div>
        <div style={{fontSize:24,fontWeight:800,color}}>{value}</div>
        {sub&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>{sub}</div>}
      </div>
    );
    const PanelHead=({children}:{children:React.ReactNode})=>(
      <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>{children}</div>
    );

    const directorContent=()=>(
      <div style={{display:'flex',flexDirection:'column',gap:20}}>
        <SectionHead title="Director View" sub="Revenue, squad cost, fixtures, and board KPIs" />
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          <Tile label="Revenue YTD"     value="£6.4m"  sub="vs £6.8m budget · 94%" color={C.purple} />
          <Tile label="Squad Cost"      value="£3.8m"  sub="58% of revenue · within target" color={C.green} />
          <Tile label="Fixtures Booked" value="42/42"  sub="Full county season + CC + T20" color={C.teal} />
          <Tile label="Board KPIs"      value="6/8"    sub="2 amber · 0 red" color={C.amber} />
        </div>
        <Card>
          <PanelHead>Board Review — Q1 2026</PanelHead>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              {label:'Revenue vs Budget',       text:'£6.4m delivered vs £6.8m forecast — 94%. Tracking on T20 Blast hospitality (£185k below) but ahead on membership renewal (+£75k).',color:C.amber},
              {label:'Squad Investment',        text:'Harris contract closing — £340k against £450k budget. Headroom for one more overseas signing in winter window.',color:C.green},
              {label:'Decisions Pending',       text:'(1) Approve Harris signing by 18 Apr · (2) Sign off Oakridge Park East Stand redevelopment scoping · (3) ECB safeguarding audit response by 5 May.',color:C.red},
            ].map((row,i)=>(
              <div key={i} style={{padding:12,borderRadius:8,background:`${row.color}10`,border:`1px solid ${row.color}33`}}>
                <div style={{fontSize:11,fontWeight:700,color:row.color,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.05em'}}>{row.label}</div>
                <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{row.text}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );

    const headCoachContent=()=>(
      <div style={{display:'flex',flexDirection:'column',gap:20}}>
        <SectionHead title="Head Coach View" sub="Squad readiness, form, and performance flags" />
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          <Tile label="Squad Available"      value="16/18" sub="2 unavailable · Rafiq (strain) · Cooper (bruise)" color={C.green} />
          <Tile label="Form (last 5)"        value="3W-1L-1D" sub="Championship · 4 of last 5 chasing scores" color={C.purple} />
          <Tile label="Top Run-Scorer"       value="Fairweather" sub="412 runs · avg 58.9 · SR 87" color={C.amber} />
          <Tile label="Leading Wicket-Taker" value="Ridley"  sub="18 wickets · avg 19.2 · econ 2.4" color={C.teal} />
        </div>
        <Card>
          <PanelHead>Squad Readiness — Friday vs Calderbrook CCC</PanelHead>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[
              {n:'Fairweather',          pos:'Bat',     status:'Fit',      load:'92%',   note:'Cleared fitness check Wed. Confirmed for No.4.'},
              {n:'Pennington',       pos:'WK-Bat',  status:'Fit',      load:'88%',   note:'Strong nets — push for opener role discussion this week.'},
              {n:'Endicott',           pos:'Bat',     status:'Fit',      load:'95%',   note:'Captain confirmed. Net session 09:30 Thu.'},
              {n:'Ridley',           pos:'Bowl',    status:'Fit',      load:'82%',   note:'12 overs unbroken Wed nets — workload monitored.'},
              {n:'Rafiq',          pos:'Bowl',    status:'Injured',  load:'—',     note:'Hamstring strain — out 10 days. Replaced by Ravenhill.'},
              {n:'Cooper',         pos:'Bat',     status:'Doubt',    load:'60%',   note:'Bruise from net session — back Saturday for T20 Blast opener.'},
            ].map((p,i)=>{
              const sc = p.status==='Fit'?C.green:p.status==='Doubt'?C.amber:C.red;
              return (
                <div key={i} style={{display:'grid',gridTemplateColumns:'140px 80px 70px 60px 1fr',gap:12,padding:'8px 0',alignItems:'center',borderBottom:i<5?`1px solid ${C.border}`:'none'}}>
                  <span style={{fontSize:13,color:C.text,fontWeight:600}}>{p.n}</span>
                  <span style={{fontSize:11,color:C.muted}}>{p.pos}</span>
                  <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:`${sc}22`,color:sc,textAlign:'center',fontWeight:600}}>{p.status}</span>
                  <span style={{fontSize:11,color:C.dim}}>{p.load}</span>
                  <span style={{fontSize:11,color:C.muted}}>{p.note}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <PanelHead>Performance Trend — Last 5 Championship Matches</PanelHead>
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            {['W','L','W','D','W'].map((r,i)=>{
              const c = r==='W'?C.green:r==='L'?C.red:C.amber;
              return <span key={i} style={{width:32,height:32,borderRadius:8,background:`${c}22`,color:c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700}}>{r}</span>;
            })}
          </div>
          <div style={{fontSize:11,color:C.dim,marginBottom:4}}>Avg runs scored per match (last 5)</div>
          <svg viewBox="0 0 200 40" style={{width:'100%',maxWidth:280,height:40}}>
            {[342,287,398,356,412].map((v,i,a)=>{const x=i*50;const y=40-((v-200)/250)*36;return i<a.length-1?<line key={i} x1={x} y1={y} x2={(i+1)*50} y2={40-((a[i+1]-200)/250)*36} stroke={C.purple} strokeWidth="2"/>:null;})}
            {[342,287,398,356,412].map((v,i)=><circle key={i} cx={i*50} cy={40-((v-200)/250)*36} r="3" fill={C.purple}/>)}
          </svg>
        </Card>
      </div>
    );

    const captainContent=()=>(
      <div style={{display:'flex',flexDirection:'column',gap:20}}>
        <SectionHead title="Captain View" sub="Match-day decisions, opposition intel, pitch & toss" />
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          <Tile label="Next Match"   value="Fri 11 Apr" sub="vs Calderbrook CCC (A) · Westmoor Cricket Ground" color={C.purple} />
          <Tile label="H2H Record"   value="6-3"        sub="Last 10 vs Lancs CC · 1 draw" color={C.green} />
          <Tile label="Pitch Report" value="Seam-friendly" sub="Lateral movement Sessions 1–3" color={C.teal} />
          <Tile label="Toss Win Rate" value="58%"       sub="Bat first away · 11/19 last 2 seasons" color={C.amber} />
        </div>
        <Card>
          <PanelHead>Match-Day Decisions — Calderbrook CCC (A)</PanelHead>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            <div style={{padding:12,borderRadius:8,background:`${C.purple}10`,border:`1px solid ${C.purple}33`}}>
              <div style={{fontSize:11,fontWeight:700,color:C.purple,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>Bowling Plan</div>
              <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>Ridley + Alam first 12 overs — exploit lateral movement. Switch to Ravenhill + spinner from over 25.</div>
            </div>
            <div style={{padding:12,borderRadius:8,background:`${C.teal}10`,border:`1px solid ${C.teal}33`}}>
              <div style={{fontSize:11,fontWeight:700,color:C.teal,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>Field Setups</div>
              <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>3-4 slips + gully for Sinclair. Drop deep cover after over 20 — bring man to short midwicket.</div>
            </div>
            <div style={{padding:12,borderRadius:8,background:`${C.amber}10`,border:`1px solid ${C.amber}33`}}>
              <div style={{fontSize:11,fontWeight:700,color:C.amber,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>Batting Order</div>
              <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>Promote Pennington to open with Kingsley. Fairweather 4. Hold Endicott at 5 to anchor middle session if collapse.</div>
            </div>
          </div>
        </Card>
        <Card>
          <PanelHead>Opposition Key Players — Calderbrook CCC</PanelHead>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[
              {n:'Keaton Sinclair', pos:'Opener', threat:'Avg 17 vs nip-back ball',          plan:'Full + straight. Target stumps from over the wicket. Forcing chest-high LBW shape.'},
              {n:'Tom Kellett',     pos:'Pace',   threat:'Reverse swing after over 35',       plan:'Rotate strike against him in spell 2. Don\'t let him bowl maidens.'},
              {n:'Tom Ravenhill',    pos:'Spin',   threat:'Bowls full + flat to lefties',      plan:'Sweep early. Use feet to disrupt length once set.'},
            ].map((p,i)=>(
              <div key={i} style={{padding:12,background:C.cardAlt,borderRadius:8,border:`1px solid ${C.border}`}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                  <span style={{fontSize:13,fontWeight:700,color:C.text}}>{p.n}</span>
                  <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:C.purpleDim,color:C.purple}}>{p.pos}</span>
                </div>
                <div style={{fontSize:11,color:C.amber,marginBottom:4}}><strong>Threat:</strong> {p.threat}</div>
                <div style={{fontSize:11,color:C.text,lineHeight:1.5}}><strong style={{color:C.green}}>Plan:</strong> {p.plan}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );

    const analystContent=()=>(
      <div style={{display:'flex',flexDirection:'column',gap:20}}>
        <SectionHead title="Analyst View" sub="Data pipelines, deep dives, and scout reports" />
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          <Tile label="Data Streams Live"  value="8/8"  sub="Lumio Ball Tracking · CricViz · GPS · Wear · 4 ECB feeds" color={C.green} />
          <Tile label="Reports Delivered"  value="12"   sub="This week · 3 to coaches · 9 to scouts" color={C.purple} />
          <Tile label="Videos Tagged"      value="284"  sub="Last 7 days · 47 player highlights" color={C.teal} />
          <Tile label="Scout Reports Open" value="6"    sub="3 high-priority · 2 contract decisions pending" color={C.amber} />
        </div>
        <Card>
          <PanelHead>Deep Dives In Progress</PanelHead>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              {title:'Calderbrook CCC — Spin Vulnerability Study',     owner:'A. Patel',  due:'Thu 10 Apr', status:'In review',   color:C.green},
              {title:'Harris (target) — 3-year T20 form analysis', owner:'M. Singh',  due:'Fri 11 Apr', status:'Drafting',    color:C.amber},
              {title:'Fairweather — Off-side Strike Rate Decomposition',  owner:'A. Patel',  due:'Mon 14 Apr', status:'Data pull',   color:C.teal},
              {title:'Oakridge Park — Pitch Bounce Profile (5y trend)',owner:'R. Khan',   due:'Wed 16 Apr', status:'Scoping',     color:'#3B82F6'},
            ].map((d,i)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 120px 120px 100px',gap:12,alignItems:'center',padding:'10px 0',borderBottom:i<3?`1px solid ${C.border}`:'none'}}>
                <span style={{fontSize:12,color:C.text,fontWeight:600}}>{d.title}</span>
                <span style={{fontSize:11,color:C.muted}}>{d.owner}</span>
                <span style={{fontSize:11,color:C.dim}}>Due {d.due}</span>
                <span style={{fontSize:10,padding:'3px 10px',borderRadius:10,background:`${d.color}22`,color:d.color,textAlign:'center',fontWeight:600}}>{d.status}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <PanelHead>Pipeline — Upcoming Analysis Tasks</PanelHead>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {[
              'Highford County T20 prep dossier — 3 days post Calderbrook CCC result',
              'Ridley workload review — bridging Championship → T20 transition',
              'Academy bowler hat-trick clip set — recommend for first-team trial',
              'ECB top-order spinner exposure rates — quarterly update',
              'Northbridge Sport interview prep — stats sheet for Fairweather & Pennington',
            ].map((t,i)=>(
              <div key={i} style={{padding:'8px 12px',background:C.cardAlt,borderRadius:6,fontSize:11,color:C.muted,display:'flex',alignItems:'center',gap:8}}>
                <span style={{color:C.dim}}>•</span>{t}
              </div>
            ))}
          </div>
        </Card>
      </div>
    );

    const sponsorContent=()=>(
      <div style={{display:'flex',flexDirection:'column',gap:20}}>
        <SectionHead title="Sponsor View" sub="Brand exposure, engagement, ROI, and active campaigns" />
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          <Tile label="Brand Exposure"   value="14.2M" sub="Impressions YTD · across broadcast + digital" color="#EC4899" />
          <Tile label="Engagement Rate"  value="6.4%"  sub="Above industry benchmark of 4.1%" color={C.green} />
          <Tile label="ROI"              value="3.8x"  sub="Across portfolio · Northbridge top performer" color={C.purple} />
          <Tile label="Active Campaigns" value="6"     sub="3 broadcast · 2 social · 1 hospitality" color={C.amber} />
        </div>
        <Card>
          <PanelHead>Sponsor Summary — April 2026</PanelHead>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              {label:'Deliverables This Month',  text:'5 broadcast spots delivered (vs 6 contracted) · 12 social posts (target 10) · 3 player appearances (target 4 — 1 deferred to May).',color:C.amber},
              {label:'KPI Performance vs Contract', text:'Northbridge Financial: 102% impressions, 138% engagement (over-delivering). Crown Wagers: 87% impressions (under by 1.4M — TV slot reschedule).',color:C.green},
              {label:'Renewals & Pipeline',     text:'Northbridge renewing for 2 years at +12% (£185k → £207k). Meridian Sports proposing a 3-year hospitality bundle worth £340k.',color:C.purple},
            ].map((row,i)=>(
              <div key={i} style={{padding:12,borderRadius:8,background:`${row.color}10`,border:`1px solid ${row.color}33`}}>
                <div style={{fontSize:11,fontWeight:700,color:row.color,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.05em'}}>{row.label}</div>
                <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{row.text}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <PanelHead>Active Campaigns</PanelHead>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[
              {sponsor:'Northbridge Financial', campaign:'Championship Title Partner — Boundary Boards', status:'Live',      color:C.green},
              {sponsor:'Crown Wagers',          campaign:'T20 Blast — Player of the Match nightly',       status:'Live',      color:C.green},
              {sponsor:'Meridian Sports',       campaign:'Hospitality activation — Oakridge Park test week', status:'Pending',   color:C.amber},
              {sponsor:'Apex Performance',      campaign:'Kit sponsor — full season jersey + warmup',     status:'Live',      color:C.green},
              {sponsor:'Vanta Sports',          campaign:'Pre-match social reels (8-week run)',           status:'Live',      color:C.green},
              {sponsor:'Briar & Stoke',         campaign:'In-stand brand activation — T20 Blast Fri',     status:'Scoping',   color:'#3B82F6'},
            ].map((c,i,a)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'160px 1fr 100px',gap:12,alignItems:'center',padding:'8px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
                <span style={{fontSize:12,color:C.text,fontWeight:600}}>{c.sponsor}</span>
                <span style={{fontSize:11,color:C.muted}}>{c.campaign}</span>
                <span style={{fontSize:10,padding:'3px 10px',borderRadius:10,background:`${c.color}22`,color:c.color,textAlign:'center',fontWeight:600}}>{c.status}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );

    const groundsmanContent=()=>(
      <div style={{display:'flex',flexDirection:'column',gap:20}}>
        <SectionHead title="Groundsman View" sub="Pitch preparation, weather, and ground readiness" />
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          <Tile label="Pitch Prep Status" value="Day 3 of 5" sub="Final cut Thu · Roll Fri 06:00" color="#16A34A" />
          <Tile label="48hr Rain Risk"    value="22%"        sub="Showers possible Thu evening" color={C.amber} />
          <Tile label="Ground Condition"  value="Amber"      sub="Surface firming · 1 light water Wed" color={C.amber} />
          <Tile label="Days to Match"     value="3 days"     sub="vs Calderbrook CCC · 10:30 start" color="#16A34A" />
        </div>
        <Card>
          <PanelHead>Pitch Report — Oakridge Park · Friday Strip</PanelHead>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:14}}>
            {[
              {l:'Hardness',     v:'7.2 / 10', sub:'Firm — pace-friendly day 1'},
              {l:'Grass Cover',  v:'4mm',      sub:'Slight green tinge'},
              {l:'Moisture',     v:'12%',      sub:'Within target band 10–14'},
              {l:'Profile',      v:'Seam day', sub:'Spinning by day 3'},
            ].map(s=>(
              <div key={s.l} style={{padding:12,background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:8}}>
                <div style={{fontSize:10,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600}}>{s.l}</div>
                <div style={{fontSize:16,fontWeight:700,color:C.text,margin:'4px 0'}}>{s.v}</div>
                <div style={{fontSize:10,color:C.muted}}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div style={{padding:12,background:`${C.green}10`,border:`1px solid ${C.green}33`,borderRadius:8,fontSize:12,color:C.text,lineHeight:1.6}}>
            <strong style={{color:C.green}}>Assessment:</strong> Lateral movement first 2 sessions, batting day 2, increasing turn from session 5. Recommend 2 spinners + 3 seamers for the XI. No covers needed overnight unless 8mm+ rain.
          </div>
        </Card>
        <Card>
          <PanelHead>Pitch Preparation Schedule — Next 5 Days</PanelHead>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {[
              {day:'Mon 7 Apr',  task:'Heavy roll · 2hr · then water if temp >18°C',     done:true},
              {day:'Tue 8 Apr',  task:'Light water 06:00 · cut to 8mm · weather check',  done:true},
              {day:'Wed 9 Apr',  task:'Roll 1hr · cut to 6mm · final sub-soil moisture', done:true},
              {day:'Thu 10 Apr', task:'Final cut to 4mm · strip cover ON for evening',    done:false},
              {day:'Fri 11 Apr', task:'06:00 cover OFF · final roll · ground inspection 09:00', done:false},
            ].map((d,i,a)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'120px 24px 1fr',gap:12,alignItems:'center',padding:'8px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
                <span style={{fontSize:12,color:C.muted,fontFamily:'monospace'}}>{d.day}</span>
                <span style={{fontSize:14,color:d.done?C.green:C.dim}}>{d.done?'✓':'○'}</span>
                <span style={{fontSize:12,color:C.text,opacity:d.done?0.7:1}}>{d.task}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );

    const medicalContent=()=>(
      <div style={{display:'flex',flexDirection:'column',gap:20}}>
        <SectionHead title="Medical View" sub="Fitness, injuries, RTP plans, and workload flags" />
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          <Tile label="Fit Players"      value="16 of 18"  sub="2 unavailable · 1 monitored" color={C.green} />
          <Tile label="Active Injuries"  value="2 players" sub="1 strain · 1 contusion"      color="#DC2626" />
          <Tile label="On RTP Plans"     value="1"         sub="Cooper · phase 3 of 4"        color={C.amber} />
          <Tile label="Workload Flags"   value="1 amber"   sub="Ridley — bowling load over threshold" color={C.amber} />
        </div>
        <Card>
          <PanelHead>Medical Priorities — This Week</PanelHead>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              {label:'Active Injuries',     text:'Rafiq — left hamstring strain Grade 1. Day 4 of estimated 10. Modified bike + pool work today, return to running Mon 14 Apr.', color:'#DC2626'},
              {label:'RTP Plans',            text:'Cooper — quad contusion. Cleared for net session Thu, full training Fri morning. Confirmed available for T20 Blast opener Sat.', color:C.amber},
              {label:'Workload Risk',        text:'Ridley — bowling load 142 high-intensity efforts last 7 days vs ceiling of 130. Recommend reduced run-up Wed nets, no live bowling Thu.', color:C.amber},
              {label:'Wellness Screening',   text:'18/18 morning check-ins logged. 1 sleep flag (Pennington — 5.2hrs avg this week) — referred to mental performance.', color:C.green},
            ].map((row,i)=>(
              <div key={i} style={{padding:12,borderRadius:8,background:`${row.color}10`,border:`1px solid ${row.color}33`}}>
                <div style={{fontSize:11,fontWeight:700,color:row.color,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.05em'}}>{row.label}</div>
                <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{row.text}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <PanelHead>Player Fitness Register</PanelHead>
          <div style={{display:'grid',gridTemplateColumns:'160px 160px 120px 100px 1fr',gap:12,padding:'8px 0',borderBottom:`1px solid ${C.border}`,fontSize:10,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600}}>
            <span>Player</span><span>Issue</span><span>ETA Return</span><span>Status</span><span>Notes</span>
          </div>
          {[
            {n:'Rafiq',    issue:'L hamstring (Gr 1)', eta:'Mon 14 Apr',  status:'Injured', sc:'#DC2626', notes:'Modified rehab · pool + bike day 4'},
            {n:'Cooper',   issue:'Quad contusion',     eta:'Thu 10 Apr',  status:'RTP',     sc:C.amber,   notes:'Phase 3 · cleared for nets Thu'},
            {n:'Ridley',     issue:'Bowling load amber',  eta:'Active',      status:'Manage',  sc:C.amber,   notes:'Reduced run-up Wed · no live Thu'},
            {n:'Pennington', issue:'Sleep flag',          eta:'Active',      status:'Monitor', sc:'#3B82F6', notes:'Referred to mental performance'},
            {n:'Fairweather',    issue:'—',                   eta:'—',           status:'Fit',     sc:C.green,   notes:'Full availability confirmed'},
            {n:'Endicott',     issue:'—',                   eta:'—',           status:'Fit',     sc:C.green,   notes:'Full availability confirmed'},
          ].map((r,i,a)=>(
            <div key={i} style={{display:'grid',gridTemplateColumns:'160px 160px 120px 100px 1fr',gap:12,padding:'8px 0',alignItems:'center',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
              <span style={{fontSize:12,color:C.text,fontWeight:600}}>{r.n}</span>
              <span style={{fontSize:11,color:C.muted}}>{r.issue}</span>
              <span style={{fontSize:11,color:C.dim}}>{r.eta}</span>
              <span style={{fontSize:10,padding:'3px 10px',borderRadius:10,background:`${r.sc}22`,color:r.sc,textAlign:'center',fontWeight:600}}>{r.status}</span>
              <span style={{fontSize:11,color:C.muted}}>{r.notes}</span>
            </div>
          ))}
        </Card>
      </div>
    );

    const mediaContent=()=>(
      <div style={{display:'flex',flexDirection:'column',gap:20}}>
        <SectionHead title="Media View" sub="Press, social calendar, requests, and brand sentiment" />
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          <Tile label="Press Confs This Week"   value="2"            sub="Wed 14:00 · Sat post-match" color="#06B6D4" />
          <Tile label="Social Posts Scheduled"  value="8"            sub="6 IG · 4 X · 2 TikTok"      color={C.purple} />
          <Tile label="Media Requests"          value="5 pending"    sub="2 print · 2 broadcast · 1 podcast" color={C.amber} />
          <Tile label="Brand Sentiment"         value="Positive 78%" sub="Last 7 days · +6% vs prior week" color={C.green} />
        </div>
        <Card>
          <PanelHead>Media Priorities — Week of 7 April</PanelHead>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              {label:'Upcoming Press Conf', text:'Wed 14:00 Oakridge Park press room — Fairweather + Head Coach. Approved Q list shared. Northbridge Sport + 4 nationals confirmed.', color:'#06B6D4'},
              {label:'Interview Requests',  text:'2 podcast requests pending review (Cricket Digest + The Cricket Almanack). 1 long-form feature (The Times) on Fairweather — recommend approval given form story.', color:C.amber},
              {label:'Crisis Comms',         text:'No active items. Standby line drafted re: Rafiq injury — pending head coach sign-off before publishing if asked.', color:C.green},
              {label:'Social Campaign',      text:'#OakridgeRising hashtag tracking 2.4k mentions this week (+38%). Fairweather fitness clip = top post — 184k impressions, 6.8% engagement.', color:C.purple},
            ].map((row,i)=>(
              <div key={i} style={{padding:12,borderRadius:8,background:`${row.color}10`,border:`1px solid ${row.color}33`}}>
                <div style={{fontSize:11,fontWeight:700,color:row.color,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.05em'}}>{row.label}</div>
                <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{row.text}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <PanelHead>Content Calendar — Next 7 Days</PanelHead>
          <div style={{display:'grid',gridTemplateColumns:'120px 80px 80px 1fr',gap:12,padding:'8px 0',borderBottom:`1px solid ${C.border}`,fontSize:10,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600}}>
            <span>Date / Time</span><span>Platform</span><span>Type</span><span>Asset / Caption</span>
          </div>
          {[
            {when:'Tue 09:00',     plat:'Instagram', type:'Reel',     asset:'Fairweather fitness check montage · 30s'},
            {when:'Tue 17:30',     plat:'X',         type:'Quote',    asset:'Captain pre-match build-up quote graphic'},
            {when:'Wed 12:00',     plat:'TikTok',    type:'BTS',      asset:'Pitch prep day-in-the-life with groundsman'},
            {when:'Wed 15:00',     plat:'YouTube',   type:'Recap',    asset:'Press conf highlights · 90s edit'},
            {when:'Thu 08:30',     plat:'Instagram', type:'Carousel', asset:'Squad fitness scoreboard graphic + captions'},
            {when:'Fri 06:00',     plat:'X',         type:'Live',     asset:'Match-day countdown thread (5 posts)'},
            {when:'Fri 10:25',     plat:'Instagram', type:'Story',    asset:'Walk-out tunnel POV · 15s'},
            {when:'Fri 18:00',     plat:'TikTok',    type:'Reel',     asset:'Post-match interview cuts · 45s'},
          ].map((c,i,a)=>(
            <div key={i} style={{display:'grid',gridTemplateColumns:'120px 80px 80px 1fr',gap:12,padding:'8px 0',alignItems:'center',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
              <span style={{fontSize:11,color:C.muted,fontFamily:'monospace'}}>{c.when}</span>
              <span style={{fontSize:11,color:C.text,fontWeight:600}}>{c.plat}</span>
              <span style={{fontSize:10,padding:'3px 8px',borderRadius:8,background:C.purpleDim,color:C.purple,textAlign:'center'}}>{c.type}</span>
              <span style={{fontSize:11,color:C.text}}>{c.asset}</span>
            </div>
          ))}
        </Card>
      </div>
    );

    const operationsContent=()=>(
      <div style={{display:'flex',flexDirection:'column',gap:20}}>
        <SectionHead title="Operations View" sub="Travel, kit, accommodation, and safeguarding" />
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          <Tile label="Next Away Trip"         value="Lancs (A)"       sub="Fri 11 Apr · Westmoor Cricket Ground"  color="#0EA5E9" />
          <Tile label="Accommodation Booked"   value="21 of 21"        sub="Hilton Manchester · 2 nights" color={C.green} />
          <Tile label="Kit Ready"              value="Yes"             sub="Match + training · checked Tue" color={C.green} />
          <Tile label="Safeguarding Status"    value="Compliant"       sub="DBS 100% · last audit 2 Apr" color={C.green} />
        </div>
        <Card>
          <PanelHead>Operations Checklist — Calderbrook CCC (Away)</PanelHead>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              {label:'Travel',          text:'Coach booked Thu 14:00 from Oakridge Park. ETA Westmoor Cricket Ground 17:30. Backup train tickets held for 6 staff (return Sun).', color:'#0EA5E9'},
              {label:'Hotel & Meals',    text:'Hilton Manchester 2 nights (21 rooms). Pre-match meal Fri 07:30 (Chef Marco — agreed menu). Recovery shake bar on bus.', color:C.green},
              {label:'Kit & Equipment',  text:'Match kit + 2 sets training kit packed Tue. Match balls (12) signed off by umpires. Stringer attending Friday — 4 spare bats.', color:C.green},
              {label:'Safeguarding',     text:'No youth players on tour. Welfare officer (Dr. Patel) on call. Code-of-conduct briefing Thu 16:00. Anti-doping rep on standby.', color:C.purple},
            ].map((row,i)=>(
              <div key={i} style={{padding:12,borderRadius:8,background:`${row.color}10`,border:`1px solid ${row.color}33`}}>
                <div style={{fontSize:11,fontWeight:700,color:row.color,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.05em'}}>{row.label}</div>
                <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{row.text}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <PanelHead>Match-Day Logistics</PanelHead>
          <div style={{display:'grid',gridTemplateColumns:'100px 140px 1fr 100px',gap:12,padding:'8px 0',borderBottom:`1px solid ${C.border}`,fontSize:10,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600}}>
            <span>Time</span><span>Activity</span><span>Detail</span><span>Lead</span>
          </div>
          {[
            {t:'07:00', act:'Hotel breakfast',     d:'Function room A · pre-match menu',          lead:'Chef Marco'},
            {t:'08:15', act:'Coach to ground',     d:'Lobby pickup · 12 min transfer',            lead:'Operations'},
            {t:'08:45', act:'Arrival + setup',     d:'Dressing room 2 · physio table + ice baths', lead:'Medical'},
            {t:'09:30', act:'Ground inspection',    d:'Captain + umpires + groundsman',            lead:'Captain'},
            {t:'10:00', act:'Toss',                d:'Pitch-side · live broadcast',                lead:'Captain'},
            {t:'10:30', act:'Match start',          d:'First session 10:30–13:10',                  lead:'Match referee'},
            {t:'13:10', act:'Lunch',                d:'Squad room · 40 min · meal plan v2',         lead:'Chef'},
            {t:'18:30', act:'Post-match recovery',  d:'Ice baths + nutrition + media',              lead:'Medical + Media'},
          ].map((r,i,a)=>(
            <div key={i} style={{display:'grid',gridTemplateColumns:'100px 140px 1fr 100px',gap:12,padding:'8px 0',alignItems:'center',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
              <span style={{fontSize:11,color:C.muted,fontFamily:'monospace'}}>{r.t}</span>
              <span style={{fontSize:11,color:C.text,fontWeight:600}}>{r.act}</span>
              <span style={{fontSize:11,color:C.muted}}>{r.d}</span>
              <span style={{fontSize:10,padding:'3px 8px',borderRadius:8,background:C.cardAlt,color:C.muted,textAlign:'center',border:`1px solid ${C.border}`}}>{r.lead}</span>
            </div>
          ))}
        </Card>
      </div>
    );

    const mentalContent=()=>(
      <div style={{display:'flex',flexDirection:'column',gap:20}}>
        <SectionHead title="Mental Performance View" sub="Wellbeing, flagged players, sessions, and team morale" />
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          <Tile label="Wellbeing Check-ins" value="18 / 18"  sub="100% completion · last Tue 09:00"   color="#A855F7" />
          <Tile label="Flagged Players"     value="1 amber"  sub="Pennington — sleep + form pressure"   color={C.amber} />
          <Tile label="Sessions Booked"     value="3"        sub="Wed 1:1 · Thu group · Sat 1:1"      color="#A855F7" />
          <Tile label="Team Morale Trend"   value="Stable+"  sub="Net positive · trending up vs prior week" color={C.green} />
        </div>
        <Card>
          <PanelHead>Mental Performance Focus</PanelHead>
          <div style={{padding:10,background:`${C.purple}10`,border:`1px solid ${C.purple}33`,borderRadius:8,fontSize:11,color:C.muted,marginBottom:10,fontStyle:'italic'}}>
            Confidentiality notice — names visible to coaching staff with welfare clearance only. Detail intentionally light.
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              {label:'Flagged Players',  text:'1 active flag — Pennington (amber). Sleep avg 5.2h last 7 days, mild pre-season form anxiety. Voluntary 1:1 booked Wed 17:00 with Dr. Lewis. Captain + head coach informed at high-level only.', color:C.amber},
              {label:'Upcoming Sessions', text:'Group session Thu 09:00 — visualisation + pre-match routines. 2 individual 1:1 (Pennington Wed, Ridley Sat). All voluntary, all logged.', color:'#A855F7'},
              {label:'Resources Used',    text:'Squad accessing the breathing app daily (avg 14 mins). Sleep journals returning steady data — usable trends after 4 weeks. No adverse incidents.', color:C.green},
              {label:'Team Morale',       text:'Pulse survey Mon: 78% positive (vs 72% prior week). Pre-season build-up + Fairweather return appear to be lifting the room. Watch leg of T20 Blast opener — historically dip post-Championship round 1.', color:'#3B82F6'},
            ].map((row,i)=>(
              <div key={i} style={{padding:12,borderRadius:8,background:`${row.color}10`,border:`1px solid ${row.color}33`}}>
                <div style={{fontSize:11,fontWeight:700,color:row.color,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.05em'}}>{row.label}</div>
                <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{row.text}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <PanelHead>Upcoming Session Schedule</PanelHead>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {[
              {when:'Wed 17:00', who:'1:1 — voluntary',         topic:'Sleep + pre-season anxiety',     led:'Dr. Lewis'},
              {when:'Thu 09:00', who:'Group — 14 attending',     topic:'Visualisation + pre-match routine', led:'Dr. Lewis'},
              {when:'Sat 16:00', who:'1:1 — voluntary',          topic:'Bowling pressure decompression',  led:'Dr. Lewis'},
              {when:'Sun 19:00', who:'Captain check-in',         topic:'Match reflection + week ahead',   led:'Dr. Lewis'},
            ].map((s,i,a)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'120px 180px 1fr 120px',gap:12,padding:'8px 0',alignItems:'center',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
                <span style={{fontSize:11,color:C.muted,fontFamily:'monospace'}}>{s.when}</span>
                <span style={{fontSize:11,color:C.text,fontWeight:600}}>{s.who}</span>
                <span style={{fontSize:11,color:C.muted}}>{s.topic}</span>
                <span style={{fontSize:11,color:C.dim}}>{s.led}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );

    const renderInsightsRole=()=>{
      switch(insightsRole){
        case 'director':   return directorContent();
        case 'head_coach': return headCoachContent();
        case 'captain':    return captainContent();
        case 'analyst':    return analystContent();
        case 'sponsor':    return sponsorContent();
        case 'groundsman': return groundsmanContent();
        case 'medical':    return medicalContent();
        case 'media':      return mediaContent();
        case 'operations': return operationsContent();
        case 'mental':     return mentalContent();
      }
    };

    return (
      <div>
        <SectionHead title="Oakridge CC — Insights" sub="Role-based dashboards — 10 views across the cricket club" />
        <div style={{display:'flex',gap:6,marginBottom:24,overflowX:'auto',paddingBottom:4}}>
          {insightsRoles.map(r=>(
            <button key={r.id} onClick={()=>setInsightsRole(r.id)}
              style={{padding:'8px 14px',borderRadius:6,border:`1px solid ${insightsRole===r.id ? r.accent : C.border}`,background:insightsRole===r.id ? `${r.accent}1A` : 'transparent',color:insightsRole===r.id ? r.accent : C.muted,fontSize:12,fontWeight:600,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6,whiteSpace:'nowrap',transition:'all 0.15s ease'}}>
              <span>{r.icon}</span>{r.label}
            </button>
          ))}
        </div>
        {renderInsightsRole()}
      </div>
    );
  };

  // ── PAGE: GROUNDS & FACILITIES ────────────────────────────────────
  const Grounds=()=>(
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <SectionHead title="Grounds & Facilities" sub="Pitch preparation, weather, ground conditions, and match-day readiness" />
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        <Card><div style={{fontSize:11,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600,marginBottom:6}}>Match Day Readiness</div><div style={{fontSize:24,fontWeight:800,color:'#16A34A'}}>92 / 100</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>Green · final check Fri 09:00</div></Card>
        <Card><div style={{fontSize:11,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600,marginBottom:6}}>Pitch Prep</div><div style={{fontSize:24,fontWeight:800,color:C.purple}}>Day 3 of 5</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>Final cut Thu · roll Fri 06:00</div></Card>
        <Card><div style={{fontSize:11,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600,marginBottom:6}}>48hr Weather</div><div style={{fontSize:24,fontWeight:800,color:C.amber}}>22% rain</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>Showers Thu PM · Fri dry</div></Card>
        <Card><div style={{fontSize:11,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600,marginBottom:6}}>Outfield</div><div style={{fontSize:24,fontWeight:800,color:'#16A34A'}}>Excellent</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>Drainage tested 2 Apr · pass</div></Card>
      </div>

      <Card>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Pitch Prep Schedule — This Week</div>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {[
            {day:'Mon 7 Apr',  task:'Heavy roll · 2hr · then water if temp >18°C',     done:true},
            {day:'Tue 8 Apr',  task:'Light water 06:00 · cut to 8mm · weather check',  done:true},
            {day:'Wed 9 Apr',  task:'Roll 1hr · cut to 6mm · sub-soil moisture log',   done:true},
            {day:'Thu 10 Apr', task:'Final cut to 4mm · strip cover ON for evening',    done:false},
            {day:'Fri 11 Apr', task:'06:00 cover OFF · final roll · ground inspection 09:00', done:false},
            {day:'Sat 12 Apr', task:'Post-match assessment · re-cover · renovate weak spots', done:false},
            {day:'Sun 13 Apr', task:'Aerate · top-dress · seed worn areas',              done:false},
          ].map((d,i,a)=>(
            <div key={i} style={{display:'grid',gridTemplateColumns:'120px 24px 1fr',gap:12,alignItems:'center',padding:'8px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
              <span style={{fontSize:12,color:C.muted,fontFamily:'monospace'}}>{d.day}</span>
              <span style={{fontSize:14,color:d.done?C.green:C.dim}}>{d.done?'✓':'○'}</span>
              <span style={{fontSize:12,color:C.text,opacity:d.done?0.7:1}}>{d.task}</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Weather Forecast — Next 5 Days</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {[
              {d:'Wed',  t:'14°', icon:'⛅', wind:'SW 12', rain:'5%'},
              {d:'Thu',  t:'13°', icon:'🌦️', wind:'SW 18', rain:'48%'},
              {d:'Fri',  t:'15°', icon:'🌤️', wind:'W 9',   rain:'12%'},
              {d:'Sat',  t:'17°', icon:'☀️', wind:'W 6',   rain:'4%'},
              {d:'Sun',  t:'16°', icon:'⛅', wind:'NW 14', rain:'18%'},
            ].map((w,i,a)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'60px 36px 60px 1fr 70px',gap:10,alignItems:'center',padding:'6px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
                <span style={{fontSize:12,color:C.text,fontWeight:600}}>{w.d}</span>
                <span style={{fontSize:18,textAlign:'center'}}>{w.icon}</span>
                <span style={{fontSize:12,color:C.text}}>{w.t}</span>
                <span style={{fontSize:11,color:C.muted}}>{w.wind} km/h</span>
                <span style={{fontSize:11,color:parseInt(w.rain)>30?C.amber:C.dim,textAlign:'right'}}>{w.rain} rain</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Ground Conditions Log</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[
              {when:'Tue 09:00', metric:'Pitch hardness', val:'7.2 / 10',  note:'Within target band'},
              {when:'Tue 09:00', metric:'Grass cover',    val:'4mm',       note:'Cut to 4mm Thu'},
              {when:'Tue 14:00', metric:'Sub-soil moisture', val:'12%',    note:'Within 10–14 target'},
              {when:'Mon 16:00', metric:'Outfield drainage', val:'Pass',   note:'Test load 30mm/hr'},
              {when:'Mon 12:00', metric:'Square — practice strip', val:'Wear visible', note:'Schedule renovation Sun'},
            ].map((l,i,a)=>(
              <div key={i} style={{padding:'8px 10px',background:C.cardAlt,borderRadius:6,border:`1px solid ${C.border}`}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                  <span style={{fontSize:11,color:C.muted}}>{l.when}</span>
                  <span style={{fontSize:11,color:C.text,fontWeight:600}}>{l.val}</span>
                </div>
                <div style={{fontSize:11,color:C.text}}>{l.metric}</div>
                <div style={{fontSize:10,color:C.dim,marginTop:2}}>{l.note}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  // ── PAGE: MEDIA HUB ──────────────────────────────────────────────
  const MediaHub=()=>(
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <SectionHead title="Media Hub" sub="Press conferences, social calendar, media requests, and brand mentions" />
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        <Card><div style={{fontSize:11,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600,marginBottom:6}}>Press Confs</div><div style={{fontSize:24,fontWeight:800,color:'#06B6D4'}}>2 this week</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>Wed 14:00 · Sat post-match</div></Card>
        <Card><div style={{fontSize:11,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600,marginBottom:6}}>Posts Scheduled</div><div style={{fontSize:24,fontWeight:800,color:C.purple}}>8</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>Across IG · X · TikTok · YT</div></Card>
        <Card><div style={{fontSize:11,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600,marginBottom:6}}>Pending Requests</div><div style={{fontSize:24,fontWeight:800,color:C.amber}}>5</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>2 print · 2 broadcast · 1 podcast</div></Card>
        <Card><div style={{fontSize:11,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600,marginBottom:6}}>Sentiment</div><div style={{fontSize:24,fontWeight:800,color:C.green}}>78% Positive</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>+6% vs prior 7 days</div></Card>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Press Conference Schedule</div>
          {[
            {when:'Wed 9 Apr · 14:00', who:'Fairweather + Head Coach', topic:'Championship build-up · pitch + selection', venue:'Oakridge Park press room'},
            {when:'Fri 11 Apr · 17:00', who:'Captain (post-toss)', topic:'Day 1 close · session-by-session review', venue:'Westmoor Cricket Ground media centre'},
            {when:'Sat 12 Apr · 18:30', who:'Match-winner (TBC)', topic:'Post-match — full quotes + 1:1 slots', venue:'Westmoor Cricket Ground media centre'},
            {when:'Mon 14 Apr · 11:00', who:'Director + Coach', topic:'Pre T20 Blast season launch', venue:'Oakridge Park pavilion'},
          ].map((p,i,a)=>(
            <div key={i} style={{padding:'10px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
              <div style={{fontSize:11,color:'#06B6D4',marginBottom:3,fontFamily:'monospace'}}>{p.when}</div>
              <div style={{fontSize:12,color:C.text,fontWeight:600,marginBottom:2}}>{p.who}</div>
              <div style={{fontSize:11,color:C.muted,marginBottom:2}}>{p.topic}</div>
              <div style={{fontSize:10,color:C.dim}}>{p.venue}</div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Social Calendar — This Week</div>
          {[
            {when:'Tue 09:00', plat:'IG · Reel',     asset:'Fairweather fitness check montage · 30s'},
            {when:'Tue 17:30', plat:'X · Quote',      asset:'Captain pre-match build-up'},
            {when:'Wed 12:00', plat:'TikTok · BTS',   asset:'Pitch prep day-in-the-life'},
            {when:'Wed 15:00', plat:'YT · Recap',     asset:'Press conf highlights · 90s'},
            {when:'Thu 08:30', plat:'IG · Carousel',  asset:'Squad fitness scoreboard'},
            {when:'Fri 06:00', plat:'X · Live',       asset:'Match-day countdown thread'},
            {when:'Fri 10:25', plat:'IG · Story',     asset:'Walk-out tunnel POV · 15s'},
            {when:'Fri 18:00', plat:'TikTok · Reel',  asset:'Post-match interview cuts'},
          ].map((c,i,a)=>(
            <div key={i} style={{display:'grid',gridTemplateColumns:'90px 130px 1fr',gap:8,alignItems:'center',padding:'7px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
              <span style={{fontSize:10,color:C.muted,fontFamily:'monospace'}}>{c.when}</span>
              <span style={{fontSize:11,color:C.text,fontWeight:600}}>{c.plat}</span>
              <span style={{fontSize:11,color:C.muted}}>{c.asset}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Media Requests — Pending Review</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[
            {outlet:'Cricket Digest',   type:'Podcast',  asks:'30 min slot with Fairweather on Championship form', dl:'Reply by 12 Apr', urgency:'medium'},
            {outlet:'The Cricket Almanack',            type:'Podcast',  asks:'Captain panel — Oakridge vs Lancs rivalry retrospective', dl:'Reply by 18 Apr', urgency:'low'},
            {outlet:'The Broadsheet',         type:'Print',    asks:'Long-form feature — Fairweather return narrative', dl:'Reply by 14 Apr', urgency:'medium'},
            {outlet:'Northbridge Sport', type:'Broadcast', asks:'Pre-match pitch tour with groundsman', dl:'Reply by 10 Apr', urgency:'high'},
            {outlet:'YCCC Members Mag',  type:'Print',    asks:'Q&A with Director — vision for 2026/27 season', dl:'Reply by 25 Apr', urgency:'low'},
          ].map((r,i,a)=>{
            const c = r.urgency==='high'?C.red:r.urgency==='medium'?C.amber:C.dim;
            return (
              <div key={i} style={{padding:10,background:C.cardAlt,borderRadius:6,border:`1px solid ${C.border}`,display:'grid',gridTemplateColumns:'140px 90px 1fr 110px 80px',gap:10,alignItems:'center'}}>
                <span style={{fontSize:11,color:C.text,fontWeight:600}}>{r.outlet}</span>
                <span style={{fontSize:10,padding:'3px 8px',borderRadius:8,background:C.purpleDim,color:C.purple,textAlign:'center'}}>{r.type}</span>
                <span style={{fontSize:11,color:C.muted}}>{r.asks}</span>
                <span style={{fontSize:10,color:C.dim,fontFamily:'monospace'}}>{r.dl}</span>
                <span style={{fontSize:10,padding:'3px 8px',borderRadius:8,background:`${c}22`,color:c,textAlign:'center',fontWeight:600,textTransform:'uppercase'}}>{r.urgency}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Brand Mentions — Last 7 Days</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {[
            {label:'Total Mentions', value:'2,420',  sub:'+38% vs prior week', color:C.purple},
            {label:'Reach',          value:'1.8M',    sub:'TV + social combined', color:'#06B6D4'},
            {label:'Top Hashtag',    value:'#OakridgeRising', sub:'2.4k uses · trending', color:C.amber},
            {label:'Influencer Posts', value:'14',    sub:'7 athlete · 4 media · 3 brand', color:C.green},
          ].map(s=>(
            <div key={s.label} style={{padding:12,background:C.cardAlt,borderRadius:6,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:10,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600}}>{s.label}</div>
              <div style={{fontSize:18,fontWeight:800,color:s.color,margin:'4px 0'}}>{s.value}</div>
              <div style={{fontSize:10,color:C.muted}}>{s.sub}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  // ── PAGE: OPERATIONS ─────────────────────────────────────────────
  const Operations=()=>(
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <SectionHead title="Operations" sub="Travel, kit, accommodation, and safeguarding" />
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        <Card><div style={{fontSize:11,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600,marginBottom:6}}>Next Away Trip</div><div style={{fontSize:18,fontWeight:800,color:'#0EA5E9'}}>Lancs (A)</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>Fri 11 Apr · Westmoor Cricket Ground</div></Card>
        <Card><div style={{fontSize:11,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600,marginBottom:6}}>Accommodation</div><div style={{fontSize:24,fontWeight:800,color:C.green}}>21 / 21</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>Hilton Manchester · 2 nights</div></Card>
        <Card><div style={{fontSize:11,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600,marginBottom:6}}>Kit Status</div><div style={{fontSize:24,fontWeight:800,color:C.green}}>Ready</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>Match + 2 training sets · Tue check</div></Card>
        <Card><div style={{fontSize:11,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600,marginBottom:6}}>Safeguarding</div><div style={{fontSize:24,fontWeight:800,color:C.green}}>Compliant</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>DBS 100% · last audit 2 Apr</div></Card>
      </div>

      <Card>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Travel Plan — Calderbrook CCC Away</div>
        <div style={{display:'grid',gridTemplateColumns:'120px 140px 1fr 100px',gap:12,padding:'8px 0',borderBottom:`1px solid ${C.border}`,fontSize:10,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600}}>
          <span>When</span><span>Mode</span><span>Detail</span><span>Owner</span>
        </div>
        {[
          {w:'Thu 14:00', m:'Coach',  d:'Oakridge Park → Westmoor Cricket Ground · ETA 17:30 · 21 seats + kit',           o:'Operations'},
          {w:'Thu 17:45', m:'Hilton', d:'Check-in · 21 rooms · briefing room booked 19:00–20:30',           o:'Operations'},
          {w:'Fri 07:30', m:'Hotel',  d:'Pre-match meal · function room A · agreed menu (Chef Marco)',     o:'Operations'},
          {w:'Fri 08:15', m:'Coach',  d:'Hotel → ground · 12 min transfer',                                 o:'Operations'},
          {w:'Sat 19:00', m:'Coach',  d:'Ground → Hotel · post-match recovery',                             o:'Operations'},
          {w:'Sun 11:00', m:'Coach',  d:'Hotel → Oakridge Park · ETA 14:30 · Sun 11 returns by train',         o:'Operations'},
        ].map((r,i,a)=>(
          <div key={i} style={{display:'grid',gridTemplateColumns:'120px 140px 1fr 100px',gap:12,padding:'8px 0',alignItems:'center',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
            <span style={{fontSize:11,color:C.muted,fontFamily:'monospace'}}>{r.w}</span>
            <span style={{fontSize:11,color:C.text,fontWeight:600}}>{r.m}</span>
            <span style={{fontSize:11,color:C.muted}}>{r.d}</span>
            <span style={{fontSize:10,padding:'3px 8px',borderRadius:8,background:C.cardAlt,color:C.muted,textAlign:'center',border:`1px solid ${C.border}`}}>{r.o}</span>
          </div>
        ))}
      </Card>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Kit Inventory</div>
          {[
            {item:'Match shirts (LS)', qty:'42 (2 per player)', status:'Ready', sc:C.green},
            {item:'Training kit',      qty:'63 (3 per player)', status:'Ready', sc:C.green},
            {item:'Match trousers',    qty:'42',                status:'Ready', sc:C.green},
            {item:'Caps + sun hats',    qty:'21 + 21',           status:'Ready', sc:C.green},
            {item:'Match balls',        qty:'12 (signed off)',   status:'Ready', sc:C.green},
            {item:'Spare bats',         qty:'4 (Stringer Fri)',   status:'In transit', sc:C.amber},
            {item:'Helmets + grilles',  qty:'21',                status:'Ready', sc:C.green},
            {item:'Pads + gloves',      qty:'Set per player',    status:'Ready', sc:C.green},
          ].map((k,i,a)=>(
            <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 130px 80px',gap:8,padding:'7px 0',alignItems:'center',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
              <span style={{fontSize:11,color:C.text}}>{k.item}</span>
              <span style={{fontSize:10,color:C.muted}}>{k.qty}</span>
              <span style={{fontSize:10,padding:'3px 8px',borderRadius:8,background:`${k.sc}22`,color:k.sc,textAlign:'center',fontWeight:600}}>{k.status}</span>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Safeguarding Log — Recent Items</div>
          {[
            {when:'2 Apr',  item:'Annual safeguarding audit',  status:'Pass',   notes:'All actions closed. Next audit Oct 2026.'},
            {when:'4 Apr',  item:'Welfare officer briefing',    status:'Done',   notes:'Squad + staff · code-of-conduct refresher.'},
            {when:'5 Apr',  item:'DBS register review',         status:'100%',   notes:'21 squad + 8 staff · all current.'},
            {when:'Thu 10', item:'Anti-doping rep on call',     status:'Pending',notes:'Standby for surprise testing — confirmed.'},
            {when:'Thu 10', item:'Code-of-conduct briefing',    status:'Pending',notes:'16:00 hotel briefing room · all squad.'},
            {when:'Sat 12', item:'Match-day welfare check',     status:'Pending',notes:'Welfare officer present · on-site contact.'},
          ].map((s,i,a)=>{
            const sc = s.status==='Pass'||s.status==='Done'||s.status==='100%'?C.green:C.amber;
            return (
              <div key={i} style={{display:'grid',gridTemplateColumns:'70px 1fr 80px',gap:8,padding:'7px 0',alignItems:'center',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
                <span style={{fontSize:10,color:C.muted,fontFamily:'monospace'}}>{s.when}</span>
                <div>
                  <div style={{fontSize:11,color:C.text,fontWeight:600}}>{s.item}</div>
                  <div style={{fontSize:10,color:C.dim,marginTop:2}}>{s.notes}</div>
                </div>
                <span style={{fontSize:10,padding:'3px 8px',borderRadius:8,background:`${sc}22`,color:sc,textAlign:'center',fontWeight:600}}>{s.status}</span>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );

  // ── PAGE: SQUAD ───────────────────────────────────────────────────
  const Squad=()=>{
    const fmts=[{id:'ch',label:'Championship'},{id:'t2',label:'T20 Blast'},{id:'od',label:'One Day Cup'},{id:'hu',label:'The Hundred'}];
    const filtered=SQUAD.filter(p=>(p as Record<string,unknown>)[format]);
    return(
      <div>
        <SectionHead title="Multi-Format Squad Manager" sub="Player availability, eligibility and format conflicts across all four competitions"/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <span style={{fontSize:12,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em'}}>🤖 Format Squad Optimiser</span>
          <button onClick={()=>setOptimiserOpen(!optimiserOpen)} style={{padding:'6px 14px',borderRadius:20,fontSize:12,background:C.tealDim,color:C.teal,border:'none',cursor:'pointer',fontWeight:600}}>{optimiserOpen?'Close':'Suggest XIs for this week'}</button>
        </div>
        {optimiserOpen && (
          <Card style={{marginBottom:16,borderColor:C.purpleDim,background:C.cardAlt}}>
            <div style={{fontSize:12,color:C.muted,marginBottom:10}}>This week: Championship vs Calderbrook CCC (Fri) + T20 Blast qualification push</div>
            <button onClick={generateSquadOptimiser} disabled={optLoading} style={{background:C.purple,color:'#fff',border:'none',borderRadius:6,padding:'8px 14px',fontSize:12,fontWeight:600,cursor:optLoading?'wait':'pointer',opacity:optLoading?0.6:1}}>{optLoading?'Generating…':'Generate XIs'}</button>
            {optError && <div style={{fontSize:11,color:C.red,marginTop:8}}>⚠ {optError}</div>}
            {optResult && (
              <div style={{marginTop:14,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {(['championship','t20'] as const).map(key=>{
                  const r = optResult[key]; if (!r) return null;
                  return (
                    <div key={key} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:12}}>
                      <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:0.5,color:key==='championship'?C.teal:C.amber,fontWeight:700,marginBottom:8}}>{key==='championship'?'Championship XI':'T20 XI'}</div>
                      <ol style={{margin:0,paddingLeft:20,fontSize:12,color:C.text,lineHeight:1.7}}>
                        {r.xi.map((n,i)=><li key={i}>{n}</li>)}
                      </ol>
                      <div style={{fontSize:11,color:C.muted,marginTop:10,fontStyle:'italic',lineHeight:1.5}}>{r.reasoning}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
          {fmts.map(f=><Pill key={f.id} label={f.label} active={format===f.id} onClick={()=>setFormat(f.id)}/>)}
          <div style={{marginLeft:'auto',display:'flex',gap:8}}>
            <span style={{padding:'6px 14px',borderRadius:20,fontSize:12,background:C.greenDim,color:C.green}}>✓ {SQUAD.filter(p=>(p as Record<string,unknown>)[format]&&p.st==='fit').length} fit</span>
            {SQUAD.filter(p=>(p as Record<string,unknown>)[format]&&p.st==='injury').length>0&&<span style={{padding:'6px 14px',borderRadius:20,fontSize:12,background:C.redDim,color:C.red}}>⚠ {SQUAD.filter(p=>(p as Record<string,unknown>)[format]&&p.st==='injury').length} injured</span>}
          </div>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${C.border}`}}>
                {['Player','Role','Age','Status','Weekly Load','Formats','Note'].map(h=>(
                  <th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:11,fontWeight:500,color:C.dim,textTransform:'uppercase',letterSpacing:'0.04em'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p,i)=>(
                <tr key={p.id} style={{borderBottom:i<filtered.length-1?`1px solid ${C.border}`:'none',background:i%2===0?'transparent':'rgba(255,255,255,0.01)'}}>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:32,height:32,borderRadius:'50%',background:C.purpleDim,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:C.purple,flexShrink:0}}>
                        {p.n.split(' ').map(w=>w[0]).join('')}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:500,color:C.text}}>{p.n}</div>
                        {p.os&&<span style={{fontSize:10,color:C.amber}}>◆ Overseas</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{padding:'12px 16px',fontSize:13,color:C.muted}}>{p.r}</td>
                  <td style={{padding:'12px 16px',fontSize:13,color:C.muted}}>{p.age}</td>
                  <td style={{padding:'12px 16px'}}><StatusBadge st={p.st}/></td>
                  <td style={{padding:'12px 16px'}}>
                    {p.load>0?(
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:60,height:4,background:C.border,borderRadius:2}}>
                          <div style={{width:`${p.load}%`,height:'100%',borderRadius:2,background:p.load>80?C.amber:C.teal}}/>
                        </div>
                        <span style={{fontSize:12,color:C.muted}}>{p.load}</span>
                      </div>
                    ):<span style={{fontSize:12,color:C.dim}}>—</span>}
                  </td>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{display:'flex',gap:4}}>
                      {[{k:'ch',l:'CC'},{k:'t2',l:'T20'},{k:'od',l:'OD'},{k:'hu',l:'HUN'}].map(f=>(
                        (p as Record<string,unknown>)[f.k]?<span key={f.k} style={{padding:'1px 6px',borderRadius:3,fontSize:10,background:format===f.k?C.purple:C.purpleDim,color:format===f.k?'white':C.purple}}>{f.l}</span>:
                        <span key={f.k} style={{padding:'1px 6px',borderRadius:3,fontSize:10,background:C.border,color:C.dim}}>{f.l}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{padding:'12px 16px',fontSize:11,color:p.st==='injury'?C.red:p.st==='monitoring'?C.amber:C.dim,maxWidth:200}}>{p.note||p.osNote||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:12}}>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Format Conflicts</div>
            {SQUAD.filter(p=>p.ch&&p.t2).length>3?
              <div style={{fontSize:13,color:C.muted}}>⚠ {SQUAD.filter(p=>p.ch&&p.t2).length} players selected in both Championship and T20 Blast — overlapping window 6–18 Jun. Review rotation plan.</div>:
              <div style={{fontSize:13,color:C.green}}>✓ No format conflicts detected for this selection</div>}
          </Card>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>ECB Eligibility Flags</div>
            <div style={{fontSize:13,color:C.amber}}>⚠ Brett Mason — overseas eligibility TBC pending visa. Cannot confirm Hundred selection until 14 Apr.</div>
          </Card>
        </div>
      </div>
    );
  };

  // ── PAGE: GPS ──────────────────────────────────
  const GPS=()=>{
    const TABS:{k:'session'|'bowling'|'mvt'|'season'|'connect';label:string;sub:string}[]=[
      {k:'session',label:'Session Hub',sub:"Today's training & match data"},
      {k:'bowling',label:'Bowling Load',sub:'ACWR · over caps · injury risk'},
      {k:'mvt',label:'Match vs Training',sub:'Compare loads side-by-side'},
      {k:'season',label:'Season Overview',sub:'Trends · leaders · consistency'},
      {k:'connect',label:'Connect GPS',sub:'Johan Sports · CSV upload'},
    ];
    const BOWLERS_TODAY=[
      {n:'Sam Reed',acr:0.94,st:'green',ov:12,del:72,lim:96,wk:[42,48,56,72]},
      {n:'James Hill',acr:0.88,st:'green',ov:8,del:48,lim:72,wk:[36,42,48,48]},
      {n:'Jake Harrison',acr:1.62,st:'amber',ov:0,del:0,lim:48,wk:[18,28,32,0]},
      {n:'Chris Dawson',acr:1.62,st:'amber',ov:6,del:36,lim:72,wk:[24,30,42,36]},
      {n:'Alex Merriman',acr:1.05,st:'green',ov:9,del:54,lim:72,wk:[36,42,48,54]},
      {n:'Oliver Halden CCC',acr:0.71,st:'green',ov:4,del:24,lim:72,wk:[18,22,24,24]},
    ];
    const SEASON_BOWLING=[
      {wk:'W1',sam:48,hill:42,jake:32,chris:30,alex:36,oliv:18},
      {wk:'W2',sam:54,hill:48,jake:36,chris:36,alex:42,oliv:22},
      {wk:'W3',sam:60,hill:48,jake:42,chris:42,alex:48,oliv:24},
      {wk:'W4',sam:66,hill:54,jake:48,chris:48,alex:54,oliv:24},
      {wk:'W5',sam:72,hill:60,jake:38,chris:54,alex:54,oliv:28},
      {wk:'W6',sam:66,hill:54,jake:24,chris:60,alex:48,oliv:32},
      {wk:'W7',sam:72,hill:60,jake:18,chris:66,alex:54,oliv:30},
      {wk:'W8',sam:78,hill:66,jake:0, chris:72,alex:60,oliv:32},
      {wk:'W9',sam:72,hill:60,jake:0, chris:48,alex:54,oliv:30},
      {wk:'W10',sam:72,hill:48,jake:0,chris:36,alex:54,oliv:24},
    ];
    const MVT={
      dist:{match:11.4,train:8.4},
      sprints:{match:32,train:24},
      hsr:{match:1.8,train:1.1},
      bowling:{match:96,train:54},
    };
    const SEASON_PLAYERS=['Daniel Webb','Sam Reed','Jake Harrison','Chris Dawson','James Hill'];
    const SEASON_GRID=[
      {n:'Daniel Webb',m:[8.1,8.6,7.9,9.2,8.4,7.8,8.5,9.1,8.7,8.4]},
      {n:'Sam Reed',   m:[5.8,6.0,6.2,6.4,6.1,6.0,5.9,6.1,5.8,6.1]},
      {n:'Jake Harrison',m:[4.2,4.0,3.8,0,0,0,0,0,3.0,3.2]},
      {n:'Chris Dawson',m:[5.6,5.8,6.0,6.2,5.9,6.1,5.5,5.4,5.6,5.8]},
      {n:'James Hill', m:[8.8,9.0,9.4,9.1,9.2,8.9,9.3,9.5,9.0,9.1]},
    ];
    const TOTAL_DISTANCE=[
      {n:'James Hill',v:88.3},
      {n:'Daniel Webb',v:85.0},
      {n:'Sam Reed',v:60.4},
      {n:'Chris Dawson',v:57.9},
      {n:'Jake Harrison',v:18.2},
    ];
    const TOP_SPEED=[
      {n:'James Hill',v:31.4,d:'10 Apr vs Halden CCC'},
      {n:'Daniel Webb',v:30.2,d:'8 Apr training'},
      {n:'Chris Dawson',v:29.3,d:'5 Apr vs Highford County'},
      {n:'Sam Reed',v:28.7,d:'12 Apr training'},
      {n:'Jake Harrison',v:24.1,d:'31 Mar — pre-injury'},
    ];
    const CONSISTENCY=[
      {n:'Daniel Webb',cv:5.6,note:'Tightest spread — distance per match'},
      {n:'James Hill',cv:6.1,note:'High output every match'},
      {n:'Sam Reed',cv:7.2,note:'Reliable bowling-day distance'},
      {n:'Chris Dawson',cv:11.4,note:'Workload swings — manage'},
      {n:'Jake Harrison',cv:38.2,note:'Injury-affected sample'},
    ];
    const BAT_RUN=[
      {n:'Daniel Webb',  inn:9, runs:412,b:618,fast:62,t:'1.6 km between wickets · 91 sprints'},
      {n:'James Hill',   inn:8, runs:368,b:512,fast:54,t:'1.4 km between wickets · 86 sprints'},
      {n:'Ryan Shaw',    inn:9, runs:288,b:498,fast:48,t:'1.4 km between wickets · 72 sprints'},
      {n:'Marcus Cole',  inn:7, runs:241,b:412,fast:38,t:'1.1 km between wickets · 58 sprints'},
      {n:'Callum Price', inn:9, runs:186,b:298,fast:32,t:'0.9 km between wickets · 44 sprints'},
    ];
    const INTEGRATIONS=[
      {n:'JOHAN Sports',tag:'Recommended for Cricket',featured:true,
        bullets:['Cricket-tuned algorithms — fielding zone tracking, not just rugby/football',
                 'Bowling run-up biomechanics — stride length, run-up speed, delivery stride',
                 'Between-wickets running profile — turn speed, sprint duration, recovery',
                 'Camp-load automation — auto-build reports for England Cricket Board submissions'],
        price:'£99/player/month + 12 month commitment',cta:'Connect JOHAN'},
      {n:'CSV Upload',tag:'Any vendor',featured:false,
        bullets:['Generic GPS export — drag and drop','Auto-detects column formats','One-time backfill or per-session import'],
        price:'Included',cta:'Upload CSV'},
      {n:'Polar',tag:'Entry-level',featured:false,
        bullets:['Polar Team Pro — 10Hz GPS + HR','Strong HR analytics','Lower price point — academy/2nd XI']
        ,price:'£59/player/month',cta:'Request quote'},
    ];
    const SPRINT_BLOCKS=[
      {t:'0–15',v:2},{t:'15–30',v:5},{t:'30–45',v:6},{t:'45–60',v:4},
      {t:'60–75',v:3},{t:'75–90',v:2},{t:'90–105',v:1},{t:'105–120',v:1},
    ];
    const tabBtn=(t:typeof TABS[number])=>{
      const active=gpsTab===t.k;
      return (
        <button key={t.k} onClick={()=>setGpsTab(t.k)} style={{
          textAlign:'left',padding:'10px 14px',borderRadius:8,cursor:'pointer',
          border:'1px solid '+(active?C.teal:C.border),
          background:active?C.tealDim:'transparent',
          color:active?C.teal:C.muted,
          flex:'1 1 0',minWidth:140,transition:'all 0.15s'}}>
          <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>{t.label}</div>
          <div style={{fontSize:10.5,color:active?C.teal:C.dim,fontWeight:500}}>{t.sub}</div>
        </button>
      );
    };
    return (
    <div>
      <SectionHead title="GPS Tracking Hub" sub="Session: Morning Training · Wed 8 Apr 2026 · Lumio Vest System · 10Hz GPS + Accelerometer"/>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>{TABS.map(tabBtn)}</div>

      {gpsTab==='session' && <>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
        {GPS_DATA.map((p,i)=>(
          <button key={i} onClick={()=>setGpsIdx(i)} style={{padding:'7px 14px',borderRadius:20,fontSize:12,fontWeight:500,cursor:'pointer',
            border:'1px solid',transition:'all 0.15s',
            borderColor:gpsIdx===i?C.teal:C.border,
            background:gpsIdx===i?C.tealDim:'transparent',
            color:gpsIdx===i?C.teal:C.muted}}>
            {p.name}
            {p.bowl?.st==='amber'&&<span style={{marginLeft:6,color:C.amber}}>⚠</span>}
          </button>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        <Stat label="Distance Covered" value={`${gp.dist} km`} color={C.teal} sub="This session"/>
        <Stat label="Top Speed" value={`${gp.spd} km/h`} color={C.purple} sub="Max recorded"/>
        <Stat label="Sprint Count" value={gp.sprints} color={C.amber} sub={`>${22} km/h efforts`}/>
        <Stat label="Player Load" value={gp.load} color={gp.load>400?C.amber:C.green} sub="Composite score"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card style={{padding:16}}>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>
            Fielding Heatmap — {gp.name}
          </div>
          <div style={{display:'flex',justifyContent:'center'}}>
            <CricketGround player={gp}/>
          </div>
          <div style={{display:'flex',gap:12,justifyContent:'center',marginTop:10,flexWrap:'wrap'}}>
            {[['High activity','#EF4444'],['Medium','#F59E0B'],['Low','#22C55E'],['Sprint path','#F59E0B']].map(([l,c],i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:C.dim}}>
                {i<3?<div style={{width:10,height:10,borderRadius:'50%',background:c,opacity:0.7}}/>:
                  <div style={{width:16,height:2,background:c,borderRadius:1}}/>}
                {l}
              </div>
            ))}
          </div>
        </Card>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Distance by Intensity Zone</div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={gp.dz} margin={{top:0,right:0,left:-20,bottom:0}}>
                <XAxis dataKey="n" tick={{fontSize:11,fill:C.dim}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:C.dim}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}} formatter={v=>[`${v} km`,'']}/>
                <Bar dataKey="v" radius={[4,4,0,0]}>
                  {gp.dz.map((d,i)=>(
                    <rect key={i} fill={d.c}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Speed Profile</div>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={[
                {t:'0m',v:8},{t:'15m',v:18},{t:'30m',v:gp.spd*0.6},{t:'45m',v:gp.spd*0.8},{t:'60m',v:gp.spd},{t:'75m',v:gp.spd*0.7},{t:'90m',v:gp.spd*0.4},{t:'105m',v:gp.spd*0.9},{t:'120m',v:12}
              ]} margin={{top:0,right:0,left:-20,bottom:0}}>
                <defs><linearGradient id="spd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.teal} stopOpacity={0.3}/><stop offset="95%" stopColor={C.teal} stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="t" tick={{fontSize:10,fill:C.dim}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:C.dim}} axisLine={false} tickLine={false} domain={[0,35]}/>
                <Area type="monotone" dataKey="v" stroke={C.teal} strokeWidth={2} fill="url(#spd)"/>
                <Tooltip contentStyle={{background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}} formatter={((v:number)=>[`${v.toFixed(1)} km/h`,'']) as never}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      {/* Per-player Distance by Intensity Zone — horizontal stacked bar */}
      <Card style={{marginTop:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Distance by Intensity Zone — Squad</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {GPS_DATA.map((p,i)=>{
            const total=p.dz.reduce((a,d)=>a+d.v,0);
            return (
              <div key={i} style={{display:'grid',gridTemplateColumns:'140px 1fr 60px',gap:10,alignItems:'center'}}>
                <div style={{fontSize:12,color:gpsIdx===i?C.teal:C.text,fontWeight:gpsIdx===i?600:500,cursor:'pointer'}} onClick={()=>setGpsIdx(i)}>{p.name}</div>
                <div style={{display:'flex',height:14,borderRadius:3,overflow:'hidden',background:C.cardAlt,border:`1px solid ${C.border}`}}>
                  {p.dz.map((d,j)=>(
                    <div key={j} title={`${d.n}: ${d.v} km`} style={{flex:`${d.v} 0 0`,background:d.c}}/>
                  ))}
                </div>
                <div style={{fontSize:11,color:C.muted,textAlign:'right'}}>{total.toFixed(1)} km</div>
              </div>
            );
          })}
        </div>
        <div style={{display:'flex',gap:14,justifyContent:'center',marginTop:12,flexWrap:'wrap'}}>
          {[['Stand','#475569'],['Walk','#3B82F6'],['Jog','#10B981'],['Run','#F59E0B'],['Sprint','#EF4444']].map(([l,c],i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:C.dim}}>
              <div style={{width:10,height:10,borderRadius:2,background:c}}/>{l}
            </div>
          ))}
        </div>
      </Card>

      {/* Sprint frequency line chart — per 15-min block */}
      <Card style={{marginTop:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Sprint Frequency — {gp.name}</div>
        {(()=>{
          const W=560,H=140,padL=32,padR=12,padT=12,padB=24;
          const plotW=W-padL-padR,plotH=H-padT-padB;
          const max=Math.max(...SPRINT_BLOCKS.map(b=>b.v),6);
          const xFor=(i:number)=>padL+(i/(SPRINT_BLOCKS.length-1))*plotW;
          const yFor=(v:number)=>padT+plotH-(v/max)*plotH;
          const pts=SPRINT_BLOCKS.map((b,i)=>`${xFor(i)},${yFor(b.v)}`).join(' ');
          return (
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{display:'block'}}>
              {[0,2,4,6].map(g=>(
                <g key={g}>
                  <line x1={padL} x2={W-padR} y1={yFor(g)} y2={yFor(g)} stroke={C.border} strokeDasharray="3,3"/>
                  <text x={padL-6} y={yFor(g)+3} fontSize="9" fill={C.dim} textAnchor="end">{g}</text>
                </g>
              ))}
              <polyline points={pts} fill="none" stroke={C.amber} strokeWidth="2"/>
              {SPRINT_BLOCKS.map((b,i)=>(
                <g key={i}>
                  <circle cx={xFor(i)} cy={yFor(b.v)} r="3" fill={C.amber}/>
                  <text x={xFor(i)} y={H-6} fontSize="9" fill={C.dim} textAnchor="middle">{b.t}</text>
                </g>
              ))}
              <text x={W-padR} y={padT-2} fontSize="9" fill={C.dim} textAnchor="end">sprints/15min</text>
            </svg>
          );
        })()}
      </Card>

      {gp.bowl&&<BowlGauge bowl={gp.bowl}/>}
      <Card style={{marginTop:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Squad Session Summary — Morning Training 8 Apr</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
            {['Player','Role','Distance','Top Speed','Sprints','Player Load','Bowling Load','Status'].map(h=>(
              <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:500,color:C.dim,textTransform:'uppercase',letterSpacing:'0.04em'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {GPS_DATA.map((p,i)=>(
              <tr key={i} style={{borderBottom:i<GPS_DATA.length-1?`1px solid ${C.border}`:'none',cursor:'pointer',background:gpsIdx===i?`${C.teal}08`:'transparent'}}
                onClick={()=>setGpsIdx(i)}>
                <td style={{padding:'10px 12px',fontSize:13,fontWeight:500,color:C.text}}>{p.name}</td>
                <td style={{padding:'10px 12px',fontSize:12,color:C.muted}}>{p.role}</td>
                <td style={{padding:'10px 12px',fontSize:13,color:C.teal,fontWeight:500}}>{p.dist} km</td>
                <td style={{padding:'10px 12px',fontSize:13,color:C.purple}}>{p.spd} km/h</td>
                <td style={{padding:'10px 12px',fontSize:13,color:C.muted}}>{p.sprints}</td>
                <td style={{padding:'10px 12px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:50,height:3,background:C.border,borderRadius:2}}>
                      <div style={{width:`${Math.min(p.load/5,100)}%`,height:'100%',borderRadius:2,background:p.load>400?C.amber:C.green}}/>
                    </div>
                    <span style={{fontSize:12,color:C.muted}}>{p.load}</span>
                  </div>
                </td>
                <td style={{padding:'10px 12px',fontSize:12,color:C.muted}}>
                  {p.bowl?`${p.bowl.ov} ov (${p.bowl.del} del)`:'N/A'}
                </td>
                <td style={{padding:'10px 12px'}}>
                  {p.bowl?<StatusBadge st={p.bowl.st}/>:<span style={{fontSize:12,color:C.dim}}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Bowling Load quick-view mini table */}
      <Card style={{marginTop:12}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em'}}>Bowling Load — Quick View</div>
          <button onClick={()=>setGpsTab('bowling')} style={{fontSize:11,color:C.teal,background:'transparent',border:`1px solid ${C.teal}66`,borderRadius:6,padding:'4px 10px',cursor:'pointer'}}>Open Bowling Load →</button>
        </div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
            {['Bowler','Today','Cap','Used','ACWR','Status'].map(h=>(
              <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:500,color:C.dim,textTransform:'uppercase',letterSpacing:'0.04em'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {BOWLERS_TODAY.map((b,i)=>{
              const pct=b.lim?Math.round((b.del/b.lim)*100):0;
              return (
                <tr key={i} style={{borderBottom:i<BOWLERS_TODAY.length-1?`1px solid ${C.border}`:'none'}}>
                  <td style={{padding:'10px 12px',fontSize:13,color:C.text,fontWeight:500}}>{b.n}</td>
                  <td style={{padding:'10px 12px',fontSize:12,color:C.muted}}>{b.ov} ov · {b.del} del</td>
                  <td style={{padding:'10px 12px',fontSize:12,color:C.dim}}>{b.lim} del</td>
                  <td style={{padding:'10px 12px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:60,height:4,background:C.border,borderRadius:2}}><div style={{width:`${Math.min(pct,100)}%`,height:'100%',borderRadius:2,background:pct>=100?C.red:pct>=80?C.amber:C.green}}/></div>
                      <span style={{fontSize:11,color:C.muted}}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{padding:'10px 12px',fontSize:12,color:b.acr>1.5?C.red:b.acr>1.3?C.amber:C.green,fontWeight:600}}>{b.acr.toFixed(2)}</td>
                  <td style={{padding:'10px 12px'}}><StatusBadge st={b.st}/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {gp.bowl && (() => {
        const acr = gp.bowl.acr ?? 1.0;
        const weeks = [0.82, 0.91, 1.12, acr];
        const minW = 0.6, maxW = 1.6, chartW = 260, chartH = 80, padL = 28, padR = 8, padT = 10, padB = 20;
        const plotW = chartW - padL - padR, plotH = chartH - padT - padB;
        const xFor = (i: number) => padL + (i / (weeks.length - 1)) * plotW;
        const yFor = (v: number) => padT + plotH - ((v - minW) / (maxW - minW)) * plotH;
        const polyline = weeks.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ');
        const safeTopY = yFor(1.3);
        const safeBottomY = yFor(0.8);
        const redTopY = padT;
        const redBottomY = yFor(1.3);
        let recoColor = C.green, recoText = '🟢 Well within safe zone. Can increase by up to 10% this block.';
        if (acr > 1.3) { recoColor = C.red;   recoText = '🔴 Reduce load immediately — risk of injury spike. Max 4 overs next 3 days.'; }
        else if (acr >= 1.0) { recoColor = C.amber; recoText = '🟡 Manage carefully — on the edge of the safe zone. No increases this week.'; }
        const squadRow = SQUAD.find(s => s.n === gp.name);
        const dualFormat = Boolean(squadRow && (squadRow as Record<string, unknown>).ch && (squadRow as Record<string, unknown>).t2);
        const weekPlan = [
          { day:'Mon', load:'light',  del:24, ov:4,  label:'Recovery' },
          { day:'Tue', load:'light',  del:24, ov:4,  label:'Recovery' },
          { day:'Wed', load:'medium', del:36, ov:6,  label:'Build' },
          { day:'Thu', load:'match',  del:48, ov:8,  label:'Match' },
          { day:'Fri', load:'match',  del:48, ov:8,  label:'Match' },
          { day:'Sat', load:'medium', del:36, ov:6,  label:'Match' },
          { day:'Sun', load:'light',  del:24, ov:4,  label:'Recovery' },
        ];
        const loadColor = (l: string) => l === 'match' ? C.red : l === 'medium' ? C.amber : C.green;
        const loadBg    = (l: string) => l === 'match' ? C.redDim : l === 'medium' ? C.amberDim : C.greenDim;
        return (
          <Card style={{marginTop:12}}>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>📊 Bowling Load Management — {gp.name}</div>
            <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:14,marginBottom:12}}>
              <div>
                <div style={{fontSize:10,color:C.dim,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.04em'}}>Week planner — delivery caps</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
                  {weekPlan.map((d,i)=>(
                    <div key={i} style={{padding:'8px 4px',borderRadius:4,background:loadBg(d.load),border:`1px solid ${loadColor(d.load)}55`,textAlign:'center'}}>
                      <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:'uppercase'}}>{d.day}</div>
                      <div style={{fontSize:14,color:loadColor(d.load),fontWeight:800,lineHeight:1.1,marginTop:2}}>{d.del}</div>
                      <div style={{fontSize:8,color:C.dim,marginTop:1}}>{d.ov} ov</div>
                      <div style={{fontSize:8,color:loadColor(d.load),marginTop:2,fontWeight:600}}>{d.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{fontSize:10,color:C.dim,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.04em'}}>A/C ratio — last 4 weeks</div>
                <svg width={chartW} height={chartH} style={{display:'block',background:C.cardAlt,borderRadius:4,border:`1px solid ${C.border}`}}>
                  <rect x={padL} y={safeTopY} width={plotW} height={safeBottomY - safeTopY} fill={C.green} opacity="0.1"/>
                  <rect x={padL} y={redTopY} width={plotW} height={redBottomY - redTopY} fill={C.red} opacity="0.08"/>
                  <line x1={padL} x2={chartW - padR} y1={yFor(0.8)} y2={yFor(0.8)} stroke={C.green} strokeWidth="1" strokeDasharray="2,2" opacity="0.6"/>
                  <line x1={padL} x2={chartW - padR} y1={yFor(1.3)} y2={yFor(1.3)} stroke={C.red}   strokeWidth="1" strokeDasharray="2,2" opacity="0.6"/>
                  <polyline points={polyline} fill="none" stroke={C.teal} strokeWidth="2"/>
                  {weeks.map((v, i) => (
                    <circle key={i} cx={xFor(i)} cy={yFor(v)} r="3" fill={i === weeks.length - 1 ? recoColor : C.teal} />
                  ))}
                  <text x="4" y={yFor(0.8) + 3} fontSize="9" fill={C.dim}>0.8</text>
                  <text x="4" y={yFor(1.3) + 3} fontSize="9" fill={C.dim}>1.3</text>
                  {['-3w','-2w','-1w','Now'].map((lbl, i) => (
                    <text key={i} x={xFor(i)} y={chartH - 6} fontSize="9" fill={C.dim} textAnchor="middle">{lbl}</text>
                  ))}
                </svg>
                <div style={{fontSize:10,color:C.muted,marginTop:4}}>Current ACWR: <strong style={{color:recoColor}}>{acr.toFixed(2)}</strong></div>
              </div>
            </div>
            <div style={{padding:10,borderRadius:6,background:`${recoColor}14`,border:`1px solid ${recoColor}55`,color:recoColor,fontSize:12,fontWeight:600,marginBottom:8}}>
              {recoText}
            </div>
            {dualFormat && (
              <div style={{padding:10,borderRadius:6,background:C.amberDim,border:`1px solid ${C.amber}55`,color:C.amber,fontSize:11}}>
                ⚠️ Dual format week — Championship overs will impact T20 readiness. Prioritise Championship, cap T20 contribution.
              </div>
            )}
          </Card>
        );
      })()}
      </>}

      {gpsTab==='bowling' && <>
      {(()=>{
        const redBowlers=BOWLERS_TODAY.filter(b=>b.acr>1.5);
        return redBowlers.length>0 ? (
          <Card style={{marginBottom:12,padding:14,background:C.redDim,border:`1px solid ${C.red}66`}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{fontSize:24}}>🚨</div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:C.red,marginBottom:2}}>Injury risk — ACWR &gt; 1.5</div>
                <div style={{fontSize:12,color:C.text}}>{redBowlers.map(b=>`${b.n} (${b.acr.toFixed(2)})`).join(' · ')} — Cap workload immediately. Max 4 overs next 3 days.</div>
              </div>
            </div>
          </Card>
        ) : null;
      })()}

      {/* Over-by-over load grid */}
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Over-by-Over Load — Today</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:560}}>
            <thead><tr>
              <th style={{padding:'6px 8px',textAlign:'left',fontSize:11,color:C.dim,textTransform:'uppercase',letterSpacing:'0.04em',fontWeight:500}}>Bowler</th>
              {Array.from({length:12},(_,i)=>(<th key={i} style={{padding:'6px 4px',fontSize:10,color:C.dim,fontWeight:500,textAlign:'center'}}>O{i+1}</th>))}
              <th style={{padding:'6px 8px',fontSize:10,color:C.dim,fontWeight:500,textAlign:'right'}}>Total</th>
            </tr></thead>
            <tbody>
              {BOWLERS_TODAY.map((b,bi)=>{
                const cells=Array.from({length:12},(_,oi)=>{
                  const bowled=oi<b.ov;
                  if(!bowled) return null;
                  const intensity=Math.round(50+Math.random()*50);
                  const hue=120-(intensity*1.2);
                  return {intensity,hue};
                });
                return (
                  <tr key={bi} style={{borderTop:`1px solid ${C.border}`}}>
                    <td style={{padding:'6px 8px',fontSize:12,color:C.text,fontWeight:500}}>{b.n}</td>
                    {cells.map((c,oi)=>(
                      <td key={oi} style={{padding:2,textAlign:'center'}}>
                        {c?
                          <div title={`O${oi+1} · intensity ${c.intensity}%`} style={{width:24,height:18,borderRadius:3,margin:'0 auto',background:`hsl(${c.hue}, 70%, 38%)`}}/>:
                          <div style={{width:24,height:18,borderRadius:3,margin:'0 auto',background:C.cardAlt,border:`1px dashed ${C.border}`}}/>
                        }
                      </td>
                    ))}
                    <td style={{padding:'6px 8px',fontSize:12,color:C.muted,textAlign:'right'}}>{b.ov} ov</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',marginTop:10,fontSize:10.5,color:C.dim}}>
          <span>Intensity:</span>
          {[60,70,80,90,100].map(v=>(<div key={v} style={{width:18,height:10,borderRadius:2,background:`hsl(${120-(v*1.2)}, 70%, 38%)`}}/>))}
          <span style={{marginLeft:2}}>low → high</span>
        </div>
      </Card>

      {/* Full ACWR table */}
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>ACWR Table — All Bowlers</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
            {['Bowler','-3w','-2w','-1w','Now (ACWR)','Trend','Status'].map(h=>(
              <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:500,color:C.dim,textTransform:'uppercase',letterSpacing:'0.04em'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {BOWLERS_TODAY.map((b,i)=>{
              const trend=b.wk[3]>b.wk[2]?'↑':b.wk[3]<b.wk[2]?'↓':'→';
              const trendColor=b.acr>1.3?C.red:b.acr>1.0?C.amber:C.green;
              return (
                <tr key={i} style={{borderBottom:i<BOWLERS_TODAY.length-1?`1px solid ${C.border}`:'none'}}>
                  <td style={{padding:'10px 12px',fontSize:13,color:C.text,fontWeight:500}}>{b.n}</td>
                  {b.wk.slice(0,3).map((w,j)=>(<td key={j} style={{padding:'10px 12px',fontSize:12,color:C.muted}}>{w} del</td>))}
                  <td style={{padding:'10px 12px',fontSize:13,color:b.acr>1.5?C.red:b.acr>1.3?C.amber:C.green,fontWeight:700}}>{b.acr.toFixed(2)}</td>
                  <td style={{padding:'10px 12px',fontSize:14,color:trendColor}}>{trend}</td>
                  <td style={{padding:'10px 12px'}}><StatusBadge st={b.st}/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Season bowling load chart — last 10 weeks */}
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Season Bowling Load — Last 10 Weeks (deliveries/week)</div>
        {(()=>{
          const W=720,H=240,padL=40,padR=14,padT=14,padB=28;
          const plotW=W-padL-padR,plotH=H-padT-padB;
          const max=84;
          const xFor=(i:number)=>padL+(i/(SEASON_BOWLING.length-1))*plotW;
          const yFor=(v:number)=>padT+plotH-(v/max)*plotH;
          const series=[
            {key:'sam',name:'Sam Reed',color:C.teal},
            {key:'hill',name:'James Hill',color:C.purple},
            {key:'jake',name:'Jake Harrison',color:C.amber},
            {key:'chris',name:'Chris Dawson',color:C.red},
            {key:'alex',name:'Alex Merriman',color:C.green},
            {key:'oliv',name:'Oliver Halden CCC',color:C.blue},
          ];
          return (
            <>
              <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
                {[0,21,42,63,84].map(g=>(
                  <g key={g}>
                    <line x1={padL} x2={W-padR} y1={yFor(g)} y2={yFor(g)} stroke={C.border} strokeDasharray="3,3"/>
                    <text x={padL-6} y={yFor(g)+3} fontSize="10" fill={C.dim} textAnchor="end">{g}</text>
                  </g>
                ))}
                {/* Ceiling line at 72 */}
                <line x1={padL} x2={W-padR} y1={yFor(72)} y2={yFor(72)} stroke={C.red} strokeDasharray="6,4" strokeWidth="1.5"/>
                <text x={W-padR-4} y={yFor(72)-4} fontSize="10" fill={C.red} textAnchor="end">Weekly cap (72)</text>
                {series.map(s=>{
                  const pts=SEASON_BOWLING.map((w,i)=>`${xFor(i)},${yFor((w as unknown as Record<string,number>)[s.key])}`).join(' ');
                  return <polyline key={s.key} points={pts} fill="none" stroke={s.color} strokeWidth="2"/>;
                })}
                {SEASON_BOWLING.map((w,i)=>(
                  <text key={i} x={xFor(i)} y={H-8} fontSize="10" fill={C.dim} textAnchor="middle">{w.wk}</text>
                ))}
              </svg>
              <div style={{display:'flex',gap:14,flexWrap:'wrap',justifyContent:'center',marginTop:8}}>
                {series.map(s=>(
                  <div key={s.key} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:C.muted}}>
                    <div style={{width:14,height:2,background:s.color}}/>{s.name}
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </Card>

      {/* Injury risk callout */}
      <Card style={{padding:14,background:C.amberDim,border:`1px solid ${C.amber}55`}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
          <div style={{fontSize:24}}>⚠️</div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.amber,marginBottom:4}}>Injury Risk Watch</div>
            <div style={{fontSize:12,color:C.text,lineHeight:1.5}}>
              <strong>Chris Dawson</strong> has logged a 26% increase in chronic load over the last 4 weeks. ACWR has held at 1.62 for two consecutive weeks — statistically associated with a 4.5× elevated soft-tissue injury risk in fast bowlers. Recommend deload week or rotation into spinner-heavy plan.
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:6,fontStyle:'italic'}}>Source: Hulin et al. — Br J Sports Med (acute:chronic workload modelling).</div>
          </div>
        </div>
      </Card>
      </>}

      {gpsTab==='mvt' && <>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:12}}>
        {([
          {label:'Distance (km/session)',m:MVT.dist.match,t:MVT.dist.train,unit:'km',color:C.teal},
          {label:'Sprints (per session)',m:MVT.sprints.match,t:MVT.sprints.train,unit:'',color:C.amber},
          {label:'High-Speed Running (km)',m:MVT.hsr.match,t:MVT.hsr.train,unit:'km',color:C.red},
          {label:'Bowling load (deliveries)',m:MVT.bowling.match,t:MVT.bowling.train,unit:'',color:C.purple},
        ] as const).map((r,i)=>{
          const max=Math.max(r.m,r.t)*1.1;
          const matchPct=(r.m/max)*100;
          const trainPct=(r.t/max)*100;
          const delta=Math.round(((r.m-r.t)/r.t)*100);
          return (
            <Card key={i}>
              <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>{r.label}</div>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.dim,marginBottom:4}}><span>Match day</span><span style={{color:r.color,fontWeight:700,fontSize:13}}>{r.m}{r.unit}</span></div>
                  <div style={{height:14,background:C.cardAlt,borderRadius:3,overflow:'hidden'}}><div style={{width:`${matchPct}%`,height:'100%',background:r.color,borderRadius:3}}/></div>
                </div>
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.dim,marginBottom:4}}><span>Training</span><span style={{color:C.muted,fontWeight:600,fontSize:13}}>{r.t}{r.unit}</span></div>
                  <div style={{height:14,background:C.cardAlt,borderRadius:3,overflow:'hidden'}}><div style={{width:`${trainPct}%`,height:'100%',background:`${r.color}66`,borderRadius:3}}/></div>
                </div>
              </div>
              <div style={{marginTop:12,fontSize:11,color:delta>30?C.red:delta>15?C.amber:C.green,fontWeight:600}}>
                Match · +{delta}% vs training avg
              </div>
            </Card>
          );
        })}
      </div>
      <Card style={{padding:14,background:C.purpleDim,border:`1px solid ${C.purple}55`}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
          <div style={{fontSize:24}}>💡</div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.purple,marginBottom:4}}>Key insight</div>
            <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>
              Match-day distance runs <strong>+36% above training average</strong>, and high-speed running is <strong>+64% higher</strong>. Training intensity is well below match demands — expect compensation in the next 2 sessions. Consider scheduling a match-intensity simulation block on Tuesday before the next Championship fixture.
            </div>
          </div>
        </div>
      </Card>
      </>}

      {gpsTab==='season' && <>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Rolling 10-Match Distance Grid (km/match)</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:560}}>
            <thead><tr>
              <th style={{padding:'6px 8px',textAlign:'left',fontSize:11,color:C.dim,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.04em'}}>Player</th>
              {Array.from({length:10},(_,i)=>(<th key={i} style={{padding:'6px 4px',fontSize:10,color:C.dim,fontWeight:500,textAlign:'center'}}>M{i+1}</th>))}
              <th style={{padding:'6px 8px',fontSize:10,color:C.dim,fontWeight:500,textAlign:'right'}}>Avg</th>
            </tr></thead>
            <tbody>
              {SEASON_GRID.map((p,pi)=>{
                const valid=p.m.filter(v=>v>0);
                const avg=valid.length?valid.reduce((a,b)=>a+b,0)/valid.length:0;
                const max=Math.max(...p.m,1);
                return (
                  <tr key={pi} style={{borderTop:`1px solid ${C.border}`}}>
                    <td style={{padding:'6px 8px',fontSize:12,color:C.text,fontWeight:500}}>{p.n}</td>
                    {p.m.map((v,mi)=>{
                      const intensity=v/max;
                      const hue=v===0?0:200-intensity*120;
                      const sat=v===0?0:55;
                      return (
                        <td key={mi} style={{padding:2,textAlign:'center'}}>
                          <div title={v?`${v} km`:'DNP'} style={{width:30,height:22,borderRadius:3,margin:'0 auto',background:v===0?C.cardAlt:`hsl(${hue}, ${sat}%, ${30+intensity*20}%)`,fontSize:9,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',border:v===0?`1px dashed ${C.border}`:'none'}}>
                            {v?v.toFixed(1):'—'}
                          </div>
                        </td>
                      );
                    })}
                    <td style={{padding:'6px 8px',fontSize:12,color:C.teal,fontWeight:600,textAlign:'right'}}>{avg.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Season Distance Leaders</div>
          {TOTAL_DISTANCE.map((p,i)=>{
            const max=TOTAL_DISTANCE[0].v;
            return (
              <div key={i} style={{display:'grid',gridTemplateColumns:'24px 140px 1fr 64px',gap:8,alignItems:'center',padding:'6px 0',borderBottom:i<TOTAL_DISTANCE.length-1?`1px solid ${C.border}`:'none'}}>
                <div style={{fontSize:11,color:C.dim,fontWeight:700}}>#{i+1}</div>
                <div style={{fontSize:13,color:C.text,fontWeight:500}}>{p.n}</div>
                <div style={{height:8,background:C.cardAlt,borderRadius:2,overflow:'hidden'}}><div style={{width:`${(p.v/max)*100}%`,height:'100%',background:C.teal}}/></div>
                <div style={{fontSize:12,color:C.teal,fontWeight:600,textAlign:'right'}}>{p.v.toFixed(1)} km</div>
              </div>
            );
          })}
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Top Speed Leaderboard</div>
          {TOP_SPEED.map((p,i)=>(
            <div key={i} style={{display:'grid',gridTemplateColumns:'24px 1fr 64px',gap:8,alignItems:'baseline',padding:'8px 0',borderBottom:i<TOP_SPEED.length-1?`1px solid ${C.border}`:'none'}}>
              <div style={{fontSize:11,color:C.dim,fontWeight:700}}>#{i+1}</div>
              <div>
                <div style={{fontSize:13,color:C.text,fontWeight:500}}>{p.n}</div>
                <div style={{fontSize:10.5,color:C.dim}}>{p.d}</div>
              </div>
              <div style={{fontSize:13,color:C.purple,fontWeight:700,textAlign:'right'}}>{p.v} km/h</div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Most Consistent Performers</div>
          <div style={{fontSize:10.5,color:C.dim,marginBottom:8}}>Coefficient of variation (lower = more consistent)</div>
          {CONSISTENCY.sort((a,b)=>a.cv-b.cv).map((p,i)=>(
            <div key={i} style={{padding:'8px 0',borderBottom:i<CONSISTENCY.length-1?`1px solid ${C.border}`:'none',display:'grid',gridTemplateColumns:'1fr 60px',gap:8,alignItems:'center'}}>
              <div>
                <div style={{fontSize:13,color:C.text,fontWeight:500}}>{p.n}</div>
                <div style={{fontSize:10.5,color:C.dim}}>{p.note}</div>
              </div>
              <div style={{fontSize:12,color:p.cv<10?C.green:p.cv<20?C.amber:C.red,fontWeight:600,textAlign:'right'}}>{p.cv.toFixed(1)}%</div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Batting Running Stats</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
              {['Player','Inn','Runs','Fast singles','Notes'].map((h,j)=>(<th key={j} style={{padding:'6px 8px',textAlign:'left',fontSize:10,color:C.dim,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.04em'}}>{h}</th>))}
            </tr></thead>
            <tbody>
              {BAT_RUN.map((p,i)=>(
                <tr key={i} style={{borderBottom:i<BAT_RUN.length-1?`1px solid ${C.border}`:'none'}}>
                  <td style={{padding:'8px',fontSize:12,color:C.text,fontWeight:500}}>{p.n}</td>
                  <td style={{padding:'8px',fontSize:11,color:C.muted}}>{p.inn}</td>
                  <td style={{padding:'8px',fontSize:12,color:C.teal,fontWeight:600}}>{p.runs}</td>
                  <td style={{padding:'8px',fontSize:11,color:C.amber,fontWeight:600}}>{p.fast}</td>
                  <td style={{padding:'8px',fontSize:10.5,color:C.dim}}>{p.t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      </>}

      {gpsTab==='connect' && <>
      <Card style={{marginBottom:12,padding:18,border:`2px solid ${C.teal}`,background:`linear-gradient(135deg, ${C.tealDim} 0%, transparent 100%)`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
          <div>
            <div style={{display:'inline-block',padding:'3px 10px',borderRadius:12,background:C.teal,color:'#03100E',fontSize:10.5,fontWeight:700,letterSpacing:'0.04em',textTransform:'uppercase',marginBottom:8}}>Recommended for cricket</div>
            <div style={{fontSize:22,fontWeight:700,color:C.text,marginBottom:4}}>JOHAN Sports</div>
            <div style={{fontSize:13,color:C.muted}}>The only major GPS provider with cricket-tuned algorithms out of the box.</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:11,color:C.dim,marginBottom:2,textTransform:'uppercase',letterSpacing:'0.04em'}}>Pricing</div>
            <div style={{fontSize:14,color:C.teal,fontWeight:700}}>{INTEGRATIONS[0].price}</div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:14}}>
          {INTEGRATIONS[0].bullets.map((b,i)=>(
            <div key={i} style={{display:'flex',alignItems:'flex-start',gap:8,padding:10,borderRadius:6,background:C.cardAlt,border:`1px solid ${C.border}`}}>
              <div style={{color:C.teal,fontSize:14,marginTop:1}}>✓</div>
              <div style={{fontSize:12,color:C.text,lineHeight:1.5}}>{b}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:8}}>
          <button style={{padding:'10px 18px',borderRadius:6,background:C.teal,color:'#03100E',fontSize:13,fontWeight:700,border:'none',cursor:'pointer'}}>Connect JOHAN →</button>
          <button style={{padding:'10px 18px',borderRadius:6,background:'transparent',color:C.teal,border:`1px solid ${C.teal}66`,fontSize:13,fontWeight:600,cursor:'pointer'}}>Book a demo</button>
        </div>
      </Card>

      <div style={{fontSize:11,color:C.dim,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600}}>Other supported providers</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
        {INTEGRATIONS.slice(1).map((it,i)=>(
          <Card key={i}>
            <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:2}}>{it.n}</div>
            <div style={{fontSize:10.5,color:C.dim,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.04em'}}>{it.tag}</div>
            <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:10}}>
              {it.bullets.map((b,j)=>(
                <div key={j} style={{display:'flex',alignItems:'flex-start',gap:6,fontSize:11,color:C.muted}}><div style={{color:C.dim,marginTop:1}}>·</div>{b}</div>
              ))}
            </div>
            <div style={{fontSize:11,color:C.muted,marginBottom:8}}>{it.price}</div>
            <button style={{width:'100%',padding:'8px 12px',borderRadius:6,background:'transparent',color:C.muted,border:`1px solid ${C.border}`,fontSize:12,fontWeight:500,cursor:'pointer'}}>{it.cta}</button>
          </Card>
        ))}
      </div>
      </>}
    </div>
    );
  };

  // ── PAGE: GPS HEATMAPS ───────────────────────────────────────────
  // ── PAGE: GPS HEATMAPS — uses the canonical v2 component for full
  //    heatmap-stack richness. Hard-coded to dark/oxford tokens since v1
  //    chrome is the live cricket portal palette; the GPS view stands as
  //    its own institutional surface inside that shell.
  const GPSHeatmaps = () => {
    return (
      <GPSHeatmapsView
        T={THEMES.dark}
        accent={ACCENTS.oxford}
        density={DENSITY.regular}
      />
    );
  };

  // ── PAGE: MEDICAL ────────────────────────────────────────────────
  const Medical=()=>(
    <div>
      <SectionHead title="Medical & Fitness Hub" sub="Injury log, fitness clearances, wellness check-ins and return-to-play protocols"/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
        <Stat label="Fit to Train" value="11" color={C.green} sub="Full training"/>
        <Stat label="Injured" value="1" color={C.red} sub="Jake Harrison — hamstring"/>
        <Stat label="Monitoring" value="1" color={C.amber} sub="Chris Dawson — workload"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Injury & Status Log</div>
          {[{n:'Jake Harrison',st:'injury',d:'Hamstring grade 2',since:'28 Mar',rtp:'~10 Apr',note:'Physio + fitness test before selection'},
            {n:'Chris Dawson',st:'monitoring',d:'Workload — A:C 1.62',since:'Ongoing',rtp:'—',note:'Cap deliveries this week'},
            {n:'Brett Mason',st:'tbc',d:'Medical records pending',since:'—',rtp:'—',note:'Pre-contract — Cricket Australia clearance required'},
          ].map((p,i)=>(
            <div key={i} style={{padding:'12px 0',borderBottom:i<2?`1px solid ${C.border}`:'none'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                <span style={{fontSize:13,fontWeight:500,color:C.text}}>{p.n}</span>
                <StatusBadge st={p.st}/>
              </div>
              <div style={{fontSize:12,color:C.muted,marginBottom:2}}>{p.d} · Since {p.since} · RTP: {p.rtp}</div>
              <div style={{fontSize:11,color:C.dim}}>{p.note}</div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Today's Wellness Check-ins</div>
          {WELLNESS.map((p,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<WELLNESS.length-1?`1px solid ${C.border}`:'none'}}>
              <span style={{fontSize:13,color:C.text,width:120}}>{p.n}</span>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                {[{k:'sleep',l:'😴'},{k:'energy',l:'⚡'},{k:'soreness',l:'💪'},{k:'mood',l:'😊'}].map(m=>(
                  <div key={m.k} style={{textAlign:'center'}}>
                    <div style={{fontSize:9,color:C.dim}}>{m.l}</div>
                    <div style={{fontSize:11,color:(p as unknown as Record<string,number>)[m.k]>=7?C.green:(p as unknown as Record<string,number>)[m.k]>=5?C.amber:C.red,fontWeight:500}}>{(p as unknown as Record<string,number>)[m.k]}</div>
                  </div>
                ))}
                <div style={{width:42,textAlign:'right'}}>
                  <span style={{fontSize:14,fontWeight:600,color:p.score>=7.5?C.green:p.score>=5?C.amber:C.red}}>{p.score}</span>
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>
      <Card>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Pre-Match Fitness Clearance — Championship Round 1 (11 Apr)</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {SQUAD.filter(p=>p.ch).map((p,i)=>(
            <div key={i} style={{padding:'10px',border:`1px solid ${C.border}`,borderRadius:8,display:'flex',flexDirection:'column',gap:4}}>
              <span style={{fontSize:12,fontWeight:500,color:C.text}}>{p.n.split(' ').pop()}</span>
              <StatusBadge st={p.st} label={p.st==='fit'?'Cleared':p.st==='injury'?'Withheld':'TBC'}/>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  // ── PAGE: COMPLIANCE ─────────────────────────────────────────────
  const Compliance=()=>{
    const totalC=CPA.reduce((a,s)=>a+s.c,0);
    const totalT=CPA.reduce((a,s)=>a+s.t,0);
    return(
      <div>
        <SectionHead title="ECB Compliance & CPA Tracker" sub="County Partnership Agreement 2026 — self-assessment due 30 June 2026 · 11 weeks remaining"/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
          <Stat label="CPA Completion" value={`${pct(totalC,totalT)}%`} color={pct(totalC,totalT)>80?C.green:C.amber} sub={`${totalC} of ${totalT} criteria met`}/>
          <Stat label="DBS Issues" value="3" color={C.red} sub="1 expired · 1 urgent · 1 expiring"/>
          <Stat label="Safeguarding Incidents" value="2" color={C.amber} sub="Pending review in log"/>
          <Stat label="Weeks to Submission" value="11" color={C.blue} sub="Due 30 Jun 2026"/>
        </div>
        <Card style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>CPA Self-Assessment Progress</div>
          {CPA.map((s,i)=>{
            const p=pct(s.c,s.t);
            return(
              <div key={i} style={{marginBottom:i<CPA.length-1?16:0}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <div>
                    <span style={{fontSize:13,color:C.text,fontWeight:500}}>{s.s}</span>
                    {s.urgent&&<span style={{marginLeft:8,fontSize:11,color:C.amber}}>⚠ {s.urgent}</span>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:12,color:C.muted}}>{s.c}/{s.t}</span>
                    <span style={{fontSize:12,fontWeight:600,color:p===100?C.green:p>60?C.amber:C.red}}>{p}%</span>
                  </div>
                </div>
                <div style={{height:6,background:C.border,borderRadius:3,overflow:'hidden'}}>
                  <div style={{width:`${p}%`,height:'100%',borderRadius:3,background:p===100?C.green:p>60?C.amber:C.red,transition:'width 0.4s ease'}}/>
                </div>
              </div>
            );
          })}
        </Card>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>DBS Check Status</div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                {['Name','Role','Expires','Status'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',fontSize:10,fontWeight:500,color:C.dim,textTransform:'uppercase'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {DBS.map((d,i)=>(
                  <tr key={i} style={{borderBottom:i<DBS.length-1?`1px solid ${C.border}`:'none'}}>
                    <td style={{padding:'8px',fontSize:12,color:C.text,fontWeight:500}}>{d.n}</td>
                    <td style={{padding:'8px',fontSize:12,color:C.muted}}>{d.r}</td>
                    <td style={{padding:'8px',fontSize:12,color:C.muted}}>{d.exp}</td>
                    <td style={{padding:'8px'}}><StatusBadge st={d.st}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>ECB Submission Deadlines</div>
            {[
              {d:'30 Apr 2026',t:'Wage cap & collar declaration',st:'urgent'},
              {d:'30 Jun 2026',t:'Annual CPA self-assessment submission',st:'monitoring'},
              {d:'30 Jul 2026',t:'Women\'s Tier compliance return',st:'monitoring'},
              {d:'31 Aug 2026',t:'Academy performance data return',st:'fit'},
              {d:'30 Sep 2026',t:'Season-end player welfare log export',st:'fit'},
            ].map((e,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<4?`1px solid ${C.border}`:'none'}}>
                <div>
                  <div style={{fontSize:12,color:C.text}}>{e.t}</div>
                  <div style={{fontSize:11,color:C.dim}}>{e.d}</div>
                </div>
                <StatusBadge st={e.st} label={e.st==='urgent'?'Urgent':e.st==='monitoring'?'Upcoming':'On track'}/>
              </div>
            ))}
          </Card>
        </div>
        <Card style={{marginTop:16,borderColor:C.purpleDim,background:C.cardAlt}}>
          <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:4}}>🤖 AI ECB Compliance Assistant</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:12}}>Ask questions about CPA, ECB standards and deadlines.</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
            {['CPA 73% complete','Wage cap declaration due 30 Apr','Phil Grant DBS expired'].map((p,i)=>(
              <div key={i} style={{fontSize:10,padding:'4px 8px',borderRadius:999,border:`1px solid ${C.border}`,background:'#0b1020',color:C.muted}}>{p}</div>
            ))}
          </div>
          <div style={{display:'flex',gap:8,marginBottom:10}}>
            <input value={ecbQuestion} onChange={e=>setEcbQuestion(e.target.value)} placeholder="Ask about your compliance..." style={{flex:1,background:'#0b1020',border:`1px solid ${C.border}`,borderRadius:6,padding:'8px 10px',color:C.text,fontSize:12}}/>
            <button onClick={()=>askEcbCompliance(ecbQuestion)} disabled={ecbLoading} style={{background:C.purple,color:'#fff',border:'none',borderRadius:6,padding:'8px 14px',fontSize:12,fontWeight:600,cursor:ecbLoading?'wait':'pointer',opacity:ecbLoading?0.6:1}}>{ecbLoading?'Thinking…':'Ask Lumio AI'}</button>
          </div>
          <div style={{fontSize:10,textTransform:'uppercase',color:C.muted,marginBottom:6}}>Quick prompts</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
            {[
              'What are the consequences of missing the wage cap deadline?',
              "What do I need to fix Phil Grant's DBS urgently?",
              "What's the priority order for the outstanding CPA sections?",
            ].map((q,i)=>(
              <button key={i} onClick={()=>askEcbCompliance(q)} style={{fontSize:11,padding:'5px 10px',borderRadius:999,border:`1px solid ${C.border}`,background:'transparent',color:C.text,cursor:'pointer'}}>{q}</button>
            ))}
          </div>
          {ecbAnswer && (
            <div style={{borderLeft:`3px solid ${C.purple}`,paddingLeft:12,fontSize:12,color:C.text,lineHeight:1.6,whiteSpace:'pre-wrap'}}>{ecbAnswer}</div>
          )}
        </Card>
      </div>
    );
  };

  // ── PAGE: PATHWAY ────────────────────────────────────────────────
  const Pathway=()=>(
    <div>
      <SectionHead title="Player Pathway & Academy Tracker" sub="U16 scholarship → 2nd XI → 1st XI → England Lions — 5 academy players tracked"/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
        <Stat label="Contract Decisions Due" value="2" color={C.red} sub="Overdue or imminent"/>
        <Stat label="Academy Players" value="5" color={C.teal} sub="U17 – 2nd XI"/>
        <Stat label="England Age Group" value="12" color={C.purple} sub="Combined caps this season"/>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {ACADEMY.map((p,i)=>(
          <Card key={i} style={{border:`1px solid ${p.pri==='urgent'?C.red:p.pri==='high'?C.amber:C.border}`}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:12}}>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:C.tealDim,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,color:C.teal}}>
                    {p.n.split(' ').map(w=>w[0]).join('')}
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:C.text}}>{p.n} <span style={{fontSize:12,fontWeight:400,color:C.dim}}>Age {p.age}</span></div>
                    <div style={{fontSize:12,color:C.muted}}>{p.stage}</div>
                  </div>
                  <StatusBadge st={p.pri} label={p.pri==='urgent'?'Decision urgent':p.pri==='high'?'Action needed':'On track'}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,fontSize:12}}>
                  <div><div style={{color:C.dim,marginBottom:2}}>Target</div><div style={{color:C.text}}>{p.target}</div></div>
                  <div><div style={{color:C.dim,marginBottom:2}}>Contract due</div><div style={{color:p.pri==='urgent'?C.red:C.text,fontWeight:p.pri==='urgent'?600:400}}>{p.due}</div></div>
                  <div><div style={{color:C.dim,marginBottom:2}}>Age group</div><div style={{color:C.purple}}>{p.caps}</div></div>
                </div>
              </div>
              <div style={{textAlign:'right',fontSize:11,color:C.dim,whiteSpace:'nowrap'}}>{p.ed}</div>
            </div>
            {/* Progress timeline */}
            <div style={{marginTop:12,display:'flex',alignItems:'center',gap:0}}>
              {['U16','Scholar','2nd XI','1st XI','Lions','England'].map((s,j)=>{
                const stageIdx=['U16','Scholar','2nd XI','1st XI','Lions','England'];
                const curr=stageIdx.findIndex(x=>x===p.stage||p.stage.includes(x));
                const done=j<=curr;
                return(
                  <div key={j} style={{display:'flex',alignItems:'center',flex:j<5?1:0}}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                      <div style={{width:20,height:20,borderRadius:'50%',border:`2px solid ${done?C.teal:C.border}`,background:done?C.teal:'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {done&&<div style={{width:8,height:8,borderRadius:'50%',background:'white'}}/>}
                      </div>
                      <span style={{fontSize:9,color:done?C.teal:C.dim,marginTop:3,whiteSpace:'nowrap'}}>{s}</span>
                    </div>
                    {j<5&&<div style={{flex:1,height:2,background:done&&j<curr?C.teal:C.border,margin:'0 2px',marginBottom:14}}/>}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  // ── PAGE: OVERSEAS ────────────────────────────────────────────────
  const Overseas=()=>{
    const targets = [
      { name:'Jack Hartwell', country:'New Zealand', role:'Fast Bowler', age:35, available:'T20 Blast', ecbCat:'Category B', status:'Available', contact:'NZ Cricket Board', notes:'Interested in county stint. IPL-free window Jun-Jul.' },
      { name:'Quentin du Preez', country:'South Africa', role:'WK-Batter', age:32, available:'Full season', ecbCat:'Category B', status:'Exploring', contact:'CSA Agent', notes:'Retirement from Tests — open to county contract.' },
      { name:'Basit Khan', country:'Afghanistan', role:'Off Spinner', age:23, available:'T20 Only', ecbCat:'Category C', status:'Available', contact:'Direct', notes:'Blast specialist. High economy risk in 4-day.' },
      { name:'Byron Kruger', country:'South Africa', role:'Batter', age:30, available:'Championship', ecbCat:'Category B', status:'Interested', contact:'Kingsgate Sports', notes:'Strong red-ball average 43.2. Available May onward.' },
    ];
    const catColor = (c:string)=>c.includes('A')?C.green:c.includes('B')?C.amber:C.red;
    const statusColorR = (s:string)=>s==='Available'?C.green:s==='Exploring'?C.amber:C.teal;
    const categoryACountries = ['UK','United Kingdom','England','Scotland','Wales','Northern Ireland','Ireland'];
    const categoryBCountries = ['Australia','New Zealand','South Africa','India','Pakistan','Sri Lanka','Bangladesh','Zimbabwe','West Indies','Jamaica','Barbados','Trinidad'];
    const eligResult = (() => {
      if (!eligCountry.trim()) return null;
      const c = eligCountry.trim();
      if (categoryACountries.some(x=>x.toLowerCase()===c.toLowerCase())) return {cat:'Category A',color:C.green,note:'British/Irish — no overseas slot used.'};
      if (categoryBCountries.some(x=>x.toLowerCase()===c.toLowerCase())) return {cat:'Category B',color:C.amber,note:'Full overseas allocation (max 2 per county in Championship).'};
      return {cat:'Category C',color:C.red,note:'T20 Blast/Hundred only — cannot play 4-day.'};
    })();
    return (
    <div>
      <SectionHead title="Overseas Player Management" sub="ECB eligibility tracking, visa management and format rotation planning"/>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {(['current','recruitment'] as const).map(t=>(
          <button key={t} onClick={()=>setOverseasTab(t)} style={{padding:'6px 14px',borderRadius:20,fontSize:12,border:`1px solid ${overseasTab===t?C.teal:C.border}`,background:overseasTab===t?C.tealDim:'transparent',color:overseasTab===t?C.teal:C.muted,cursor:'pointer',fontWeight:600}}>{t==='current'?'Current Players':'Recruitment Hub'}</button>
        ))}
      </div>
      {overseasTab==='recruitment' ? (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
            <Stat label="Available Targets" value={String(targets.length)} color={C.teal} sub="In scouting pipeline"/>
            <Stat label="Category B" value={String(targets.filter(t=>t.ecbCat.includes('B')).length)} color={C.amber} sub="Full allocation"/>
            <Stat label="Category C" value={String(targets.filter(t=>t.ecbCat.includes('C')).length)} color={C.red} sub="Limited formats"/>
            <Stat label="Active Conversations" value={String(targets.filter(t=>t.status!=='Available').length)} color={C.purple} sub="Exploring or interested"/>
          </div>
          <Card style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Recruitment Targets</div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${C.border}`,color:C.dim,textAlign:'left'}}>
                    {['Player','Country','Role','Age','Available for','ECB Cat','Status','Contact','Notes'].map(h=><th key={h} style={{padding:'8px 10px',fontSize:10,textTransform:'uppercase'}}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {targets.map((t,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid ${C.border}`,color:C.text}}>
                      <td style={{padding:'10px',fontWeight:600}}>{t.name}</td>
                      <td style={{padding:'10px'}}>{t.country}</td>
                      <td style={{padding:'10px'}}>{t.role}</td>
                      <td style={{padding:'10px'}}>{t.age}</td>
                      <td style={{padding:'10px'}}>{t.available}</td>
                      <td style={{padding:'10px'}}><span style={{padding:'3px 8px',borderRadius:999,background:catColor(t.ecbCat)+'22',color:catColor(t.ecbCat),fontSize:10,fontWeight:600}}>{t.ecbCat}</span></td>
                      <td style={{padding:'10px'}}><span style={{padding:'3px 8px',borderRadius:999,background:statusColorR(t.status)+'22',color:statusColorR(t.status),fontSize:10,fontWeight:600}}>{t.status}</span></td>
                      <td style={{padding:'10px',color:C.muted}}>{t.contact}</td>
                      <td style={{padding:'10px',color:C.muted,maxWidth:240}}>{t.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:12,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em'}}>ECB Eligibility Guide</div>
              <button onClick={()=>setEligGuideOpen(!eligGuideOpen)} style={{background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:'4px 10px',fontSize:11,cursor:'pointer'}}>{eligGuideOpen?'Hide':'Show'}</button>
            </div>
            {eligGuideOpen && (
              <div style={{marginTop:12,fontSize:12,color:C.text,lineHeight:1.7}}>
                <div><strong style={{color:C.green}}>Category A:</strong> British/Irish passport — no overseas slot used.</div>
                <div><strong style={{color:C.amber}}>Category B:</strong> Full overseas allocation (max 2 per county in Championship).</div>
                <div><strong style={{color:C.red}}>Category C:</strong> T20 Blast/Hundred only — cannot play 4-day.</div>
              </div>
            )}
          </Card>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Check Eligibility</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:10,alignItems:'center'}}>
              <input value={eligName} onChange={e=>setEligName(e.target.value)} placeholder="Player name" style={{background:'#0b1020',border:`1px solid ${C.border}`,borderRadius:6,padding:'8px 10px',color:C.text,fontSize:12}}/>
              <input value={eligCountry} onChange={e=>setEligCountry(e.target.value)} placeholder="Country" style={{background:'#0b1020',border:`1px solid ${C.border}`,borderRadius:6,padding:'8px 10px',color:C.text,fontSize:12}}/>
              {eligResult ? (
                <span style={{padding:'6px 12px',borderRadius:999,background:eligResult.color+'22',color:eligResult.color,fontSize:11,fontWeight:600,whiteSpace:'nowrap'}}>{eligResult.cat}</span>
              ) : <span style={{fontSize:11,color:C.dim}}>Enter country →</span>}
            </div>
            {eligResult && <div style={{fontSize:11,color:C.muted,marginTop:8}}>{eligName||'Player'}: {eligResult.note}</div>}
          </Card>
        </div>
      ) : (<></>)}
      {overseasTab==='current' && (<></>)}
      {overseasTab==='current' && (<>
      </>)}
      <div style={{display:overseasTab==='current'?'block':'none'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
        <Stat label="Overseas Players" value="2" color={C.teal} sub="This season"/>
        <Stat label="Confirmed" value="1" color={C.green} sub="Rajan Steenkamp"/>
        <Stat label="Pending" value="1" color={C.amber} sub="Brett Mason — visa"/>
      </div>
      {OVERSEAS.map((p,i)=>(
        <Card key={i} style={{marginBottom:12,border:`1px solid ${p.st==='confirmed'?C.greenDim:C.amberDim}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:44,height:44,borderRadius:'50%',background:p.st==='confirmed'?C.greenDim:C.amberDim,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:600,color:p.st==='confirmed'?C.green:C.amber}}>
                {p.n.split(' ').map(w=>w[0]).join('')}
              </div>
              <div>
                <div style={{fontSize:16,fontWeight:600,color:C.text}}>{p.n}</div>
                <div style={{fontSize:12,color:C.muted}}>{p.country} · {p.formats}</div>
              </div>
            </div>
            <StatusBadge st={p.st} label={p.st==='confirmed'?'Confirmed':'Visa pending'}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {[
              {l:'Visa Status',v:p.visa},{l:'Arrives',v:p.arrives},
              {l:'Agent',v:p.agent},{l:'Formats',v:p.formats}
            ].map((f,j)=>(
              <div key={j}>
                <div style={{fontSize:11,color:C.dim,marginBottom:2}}>{f.l}</div>
                <div style={{fontSize:12,color:C.text,fontWeight:500}}>{f.v}</div>
              </div>
            ))}
          </div>
        </Card>
      ))}
      <Card>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Format Eligibility & Availability</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
            {['Player','Championship','T20 Blast','One Day Cup','The Hundred','Hundred Draft'].map(h=>(
              <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:500,color:C.dim}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {[{n:'Rajan Steenkamp',ch:true,t2:false,od:true,hu:false,dr:'N/A'},
              {n:'Brett Mason',ch:false,t2:true,od:false,hu:true,dr:'Retained 2025'}].map((p,i)=>(
              <tr key={i} style={{borderBottom:i===0?`1px solid ${C.border}`:'none'}}>
                <td style={{padding:'10px 12px',fontSize:13,fontWeight:500,color:C.text}}>{p.n}</td>
                {[p.ch,p.t2,p.od,p.hu].map((v,j)=>(
                  <td key={j} style={{padding:'10px 12px'}}>
                    <span style={{color:v?C.green:C.dim,fontSize:16}}>{v?'✓':'—'}</span>
                  </td>
                ))}
                <td style={{padding:'10px 12px',fontSize:12,color:C.muted}}>{p.dr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      </div>
    </div>
  );
  };

  // ── PAGE: COMMERCIAL ──────────────────────────────────────────────
  const Commercial=()=>{
    const totalARR=SPONSORS.filter(s=>s.st==='active').reduce((a,s)=>a+s.val,0);
    const totalPipeline=SPONSORS.filter(s=>s.st!=='active').reduce((a,s)=>a+s.val,0);
    const totalSpent=WINDFALL.projects.reduce((a,p)=>a+p.spent,0);
    const totalBudgeted=WINDFALL.projects.reduce((a,p)=>a+p.budget,0);
    return(
      <div>
        <SectionHead title="Commercial & Venue" sub="Sponsorship pipeline, Hundred windfall deployment and venue operations"/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
          <Stat label="Active Sponsor Revenue" value={fmt(totalARR)} color={C.green} sub="Confirmed for 2026"/>
          <Stat label="Pipeline Value" value={fmt(totalPipeline)} color={C.amber} sub="2 deals in progress"/>
          <Stat label="Windfall Spent" value={fmt(totalSpent)} color={C.teal} sub={`of ${fmt(totalBudgeted)} budgeted`}/>
          <Stat label="Windfall Remaining" value={fmt(WINDFALL.total-totalBudgeted)} color={C.purple} sub="Unallocated ECB windfall"/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Sponsorship Pipeline</div>
            {SPONSORS.map((s,i)=>(
              <div key={i} style={{padding:'10px 0',borderBottom:i<SPONSORS.length-1?`1px solid ${C.border}`:'none'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                  <div>
                    <span style={{fontSize:13,fontWeight:500,color:C.text}}>{s.n}</span>
                    <span style={{fontSize:11,color:C.dim,marginLeft:8}}>{s.type}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:13,fontWeight:600,color:C.green}}>{fmt(s.val)}</span>
                    <StatusBadge st={s.st}/>
                  </div>
                </div>
                {s.act>0&&(
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{flex:1,height:3,background:C.border,borderRadius:2}}>
                      <div style={{width:`${s.act}%`,height:'100%',borderRadius:2,background:s.act>80?C.green:C.amber}}/>
                    </div>
                    <span style={{fontSize:10,color:C.dim}}>{s.act}% activated</span>
                    {s.ren&&<span style={{fontSize:10,color:C.dim}}>Renewal: {s.ren}</span>}
                  </div>
                )}
              </div>
            ))}
          </Card>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Hundred Windfall Spend Tracker</div>
            <div style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:C.muted,marginBottom:6}}>
                <span>Total windfall received</span><span style={{color:C.text,fontWeight:600}}>{fmt(WINDFALL.total)}</span>
              </div>
              <div style={{height:8,background:C.border,borderRadius:4,overflow:'hidden',marginBottom:4}}>
                <div style={{width:`${pct(totalSpent,WINDFALL.total)}%`,height:'100%',background:`linear-gradient(90deg,${C.teal},${C.purple})`,borderRadius:4}}/>
              </div>
              <div style={{fontSize:11,color:C.dim}}>{fmt(totalSpent)} deployed of {fmt(totalBudgeted)} budgeted · {fmt(WINDFALL.total-totalBudgeted)} unallocated</div>
            </div>
            {WINDFALL.projects.map((p,i)=>(
              <div key={i} style={{padding:'8px 0',borderBottom:i<WINDFALL.projects.length-1?`1px solid ${C.border}`:'none'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                  <div>
                    <span style={{fontSize:12,color:C.text,fontWeight:500}}>{p.n}</span>
                    <StatusBadge st={p.st} label={p.st}/>
                  </div>
                  <span style={{fontSize:12,color:C.muted}}>{fmt(p.spent)} / {fmt(p.budget)}</span>
                </div>
                <div style={{height:3,background:C.border,borderRadius:2}}>
                  <div style={{width:`${pct(p.spent,p.budget)}%`,height:'100%',borderRadius:2,background:p.st==='Complete'?C.green:C.teal}}/>
                </div>
              </div>
            ))}
          </Card>
        </div>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Venue Calendar — April 2026</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
            {[{d:'11 Apr',e:'Championship vs Calderbrook CCC',t:'cricket',util:100},
              {d:'18 Apr',e:'Corporate Golf Day',t:'event',util:85},
              {d:'25 Apr',e:'Easter Conference (Midlands Bank)',t:'venue',util:100},
              {d:'29 Apr',e:'Championship vs Riverbank County',t:'cricket',util:100},
            ].map((v,i)=>(
              <div key={i} style={{padding:'12px',border:`1px solid ${C.border}`,borderRadius:8,borderLeft:`3px solid ${v.t==='cricket'?C.green:v.t==='event'?C.purple:C.teal}`}}>
                <div style={{fontSize:11,color:C.dim,marginBottom:4}}>{v.d}</div>
                <div style={{fontSize:12,color:C.text,marginBottom:4}}>{v.e}</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:10,color:C.muted}}>{v.t}</span>
                  <span style={{fontSize:10,color:v.util===100?C.green:C.amber}}>{v.util}% cap</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  // ── PAGE: OPPOSITION ──────────────────────────────────────────────
  const Opposition=()=>(
    <div>
      <SectionHead title="Opposition Analysis" sub="AI match prep packs · CricViz integration placeholder · Head-to-head intelligence"/>
      <Card style={{marginBottom:16,borderColor:C.purpleDim,background:C.cardAlt}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:600,color:C.text}}>🤖 AI Opposition Dossier Generator</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr auto',gap:10,marginBottom:12}}>
          <input value={oppTarget} onChange={e=>setOppTarget(e.target.value)} placeholder="Opponent name" style={{background:'#0b1020',border:`1px solid ${C.border}`,borderRadius:6,padding:'8px 10px',color:C.text,fontSize:12}}/>
          <select value={oppFormat} onChange={e=>setOppFormat(e.target.value as 'Championship'|'T20'|'OD')} style={{background:'#0b1020',border:`1px solid ${C.border}`,borderRadius:6,padding:'8px 10px',color:C.text,fontSize:12}}>
            <option value="Championship">Championship</option>
            <option value="T20">T20</option>
            <option value="OD">One Day</option>
          </select>
          <button onClick={generateOppDossier} disabled={oppLoading} style={{background:C.purple,color:'#fff',border:'none',borderRadius:6,padding:'8px 14px',fontSize:12,fontWeight:600,cursor:oppLoading?'wait':'pointer',opacity:oppLoading?0.6:1}}>{oppLoading?'Generating…':'Generate Dossier'}</button>
        </div>
        {oppError && <div style={{fontSize:11,color:C.red,marginBottom:8}}>⚠ {oppError}</div>}
        {oppDossier && (
          <div style={{display:'grid',gap:10,marginTop:8}}>
            <div><div style={{fontSize:10,textTransform:'uppercase',letterSpacing:0.5,color:C.red,fontWeight:600,marginBottom:4}}>Batting Threats</div><div style={{fontSize:12,color:C.text,lineHeight:1.5}}>{oppDossier.batting_threats}</div></div>
            <div><div style={{fontSize:10,textTransform:'uppercase',letterSpacing:0.5,color:C.amber,fontWeight:600,marginBottom:4}}>Bowling Threats</div><div style={{fontSize:12,color:C.text,lineHeight:1.5}}>{oppDossier.bowling_threats}</div></div>
            <div><div style={{fontSize:10,textTransform:'uppercase',letterSpacing:0.5,color:C.green,fontWeight:600,marginBottom:4}}>Weaknesses</div><div style={{fontSize:12,color:C.text,lineHeight:1.5}}>{oppDossier.weaknesses}</div></div>
            <div><div style={{fontSize:10,textTransform:'uppercase',letterSpacing:0.5,color:C.teal,fontWeight:600,marginBottom:4}}>Game Plan</div><div style={{fontSize:12,color:C.text,lineHeight:1.5}}>{oppDossier.game_plan}</div></div>
            <div><div style={{fontSize:10,textTransform:'uppercase',letterSpacing:0.5,color:C.purple,fontWeight:600,marginBottom:4}}>Key Matchup</div><div style={{fontSize:12,color:C.text,lineHeight:1.5}}>{oppDossier.key_matchup}</div></div>
          </div>
        )}
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card style={{border:`1px solid ${C.purpleDim}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:600,color:C.text}}>Round 1 — Calderbrook CCC (Home)</div>
            <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,background:C.purpleDim,color:C.purple}}>11 Apr · 4-day</span>
          </div>
          <div style={{fontSize:13,color:C.muted,marginBottom:14,fontStyle:'italic',borderLeft:`3px solid ${C.purple}`,paddingLeft:12,lineHeight:1.7}}>
            "Calderbrook CCC have won 3 of their last 5 Championship openers away. Their top-order averages 42.1 in April conditions; pace-friendly pitch with lateral movement in sessions 1–3. Key threat: a world-class No.3 type figure, averaging 58 in away conditions. Recommend seam-heavy attack in first two sessions, target leg stump."
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
            {[{l:'Their batting avg',v:'38.4'},{l:'Pace taken (this yr)',v:'68%'},{l:'Home win rate',v:'60%'}].map((s,i)=>(
              <div key={i} style={{textAlign:'center',padding:'8px',background:C.cardAlt,borderRadius:6}}>
                <div style={{fontSize:16,fontWeight:600,color:C.purple}}>{s.v}</div>
                <div style={{fontSize:10,color:C.dim}}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:12,padding:'8px',background:C.border,borderRadius:6,fontSize:11,color:C.dim}}>
            ⚡ CricViz Centurion integration active — head-to-head matchups and ball-tracking data available
          </div>
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Upcoming Opposition</div>
          {[{opp:'Calderbrook CCC',date:'11 Apr',format:'Championship',prepared:true},
            {opp:'Riverbank County',date:'29 Apr',format:'Championship',prepared:false},
            {opp:'Brackenfell CCC',date:'18 May',format:'One Day Cup',prepared:false},
            {opp:'Aldermount County',date:'6 Jun',format:'T20 Blast',prepared:false},
          ].map((m,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:i<3?`1px solid ${C.border}`:'none'}}>
              <div>
                <span style={{fontSize:13,color:C.text,fontWeight:500}}>vs {m.opp}</span>
                <span style={{fontSize:11,color:C.dim,marginLeft:8}}>{m.date}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:11,color:C.dim}}>{m.format}</span>
                <StatusBadge st={m.prepared?'fit':'tbc'} label={m.prepared?'Prep ready':'Pending'}/>
              </div>
            </div>
          ))}
        </Card>
      </div>
      <Card>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>CricViz Integration — Placeholder</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {['Head-to-head matchup viewer','Pitch & conditions intelligence','Bowling load modelling'].map((f,i)=>(
            <div key={i} style={{padding:'14px',border:`1px solid ${C.border}`,borderRadius:8,opacity:0.6,textAlign:'center'}}>
              <div style={{fontSize:24,marginBottom:6}}>{'📊🏟️📐'[i]}</div>
              <div style={{fontSize:12,color:C.muted}}>{f}</div>
              <div style={{fontSize:10,color:C.dim,marginTop:4}}>API integration ready</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  // ── PAGE: WOMEN'S ────────────────────────────────────────────────
  const Womens=()=>(
    <div>
      <SectionHead title="Women's Cricket Integration" sub="Oakridge Women · ECB Tier 1 · Shared facilities and compliance management"/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
        <Stat label="Women's Squad" value="18" color={C.pink} sub="Tier 1 programme"/>
        <Stat label="ECB Tier Compliance" value="57%" color={C.amber} sub="4 of 7 criteria met"/>
        <Stat label="Shared Facility Bookings" value="12" color={C.teal} sub="April schedule"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>ECB Tier 1 Compliance</div>
          {[{s:'Head Coach — qualified ECB Level 4',st:'fit'},{s:'Head Physio — full-time appointment',st:'injury'},{s:'Women\'s Academy — pathway programme',st:'fit'},{s:'Safeguarding lead — designated women\'s',st:'fit'},{s:'Strength & conditioning coach',st:'monitoring'},{s:'Welfare officer — ECB certified',st:'fit'},{s:'Performance analyst',st:'monitoring'}].map((c,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:i<6?`1px solid ${C.border}`:'none'}}>
              <span style={{fontSize:12,color:C.muted}}>{c.s}</span>
              <StatusBadge st={c.st} label={c.st==='fit'?'✓ Met':c.st==='injury'?'✗ Outstanding':'⚠ In progress'}/>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Shared Facility Schedule — Apr</div>
          {[{d:'Mon/Wed/Fri',time:'09:00–12:00',user:"Women's 1st XI",location:'Main nets'},
            {d:'Tue/Thu',time:'09:00–11:00',user:"Men's 1st XI",location:'Main nets'},
            {d:'Sat',time:'All day',user:"Women's home fixture",location:'Ground 1'},
            {d:'Sun',time:'13:00–17:00',user:"Mixed academy",location:'Ground 2'},
          ].map((b,i)=>(
            <div key={i} style={{padding:'8px 0',borderBottom:i<3?`1px solid ${C.border}`:'none'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                <span style={{fontSize:12,color:C.text,fontWeight:500}}>{b.user}</span>
                <span style={{fontSize:11,color:C.teal}}>{b.time}</span>
              </div>
              <div style={{fontSize:11,color:C.dim}}>{b.d} · {b.location}</div>
            </div>
          ))}
          <div style={{marginTop:10,padding:'8px',background:C.amberDim,borderRadius:6,fontSize:11,color:C.amber}}>
            ⚠ Conflict: Tue 15 Apr — Women's match day clashes with Men's net booking. Resolve required.
          </div>
        </Card>
      </div>
    </div>
  );

  // ── PAGE: BOARD ───────────────────────────────────────────────────
  const Board=()=>(
    <div>
      <SectionHead title="Board Suite" sub="CEO financial overview, ECB relationship and strategic priorities — Q1 2026"/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        <Stat label="Projected Season Revenue" value="£14.2m" color={C.green} sub="vs £12.8m budget"/>
        <Stat label="Wages to Revenue Ratio" value="62%" color={C.amber} sub="ECB ceiling: 70%"/>
        <Stat label="ECB Distribution (2026)" value="£2.1m" color={C.teal} sub="Received Apr 2026"/>
        <Stat label="Windfall Unallocated" value="£4.7m" color={C.purple} sub="Available to deploy"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Revenue vs Budget — 2026 Season</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[
              {stream:'Match day',budget:2800000,actual:2950000},
              {stream:'Sponsorship',budget:2200000,actual:2050000},
              {stream:'ECB Dist.',budget:2100000,actual:2100000},
              {stream:'Venue/Events',budget:1400000,actual:1620000},
              {stream:'Membership',budget:1200000,actual:1180000},
              {stream:'Media',budget:480000,actual:520000},
            ]} margin={{top:0,right:0,left:0,bottom:0}}>
              <XAxis dataKey="stream" tick={{fontSize:10,fill:C.dim}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}} formatter={((v:number)=>[fmt(v),'']) as never}/>
              <Bar dataKey="budget" fill={C.border} radius={[3,3,0,0]} name="Budget"/>
              <Bar dataKey="actual" fill={C.teal} radius={[3,3,0,0]} name="Actual/Forecast"/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Board Priorities — Spring 2026</div>
          {[
            {p:'Deploy remaining £4.7m windfall — ECB mandate by Dec 2027',st:'monitoring'},
            {p:'CPA self-assessment — 27% outstanding, due June',st:'monitoring'},
            {p:'Women\'s Tier 1 — Head Physio appointment outstanding',st:'injury'},
            {p:'Brett Mason visa resolution — T20/Hundred planning at risk',st:'monitoring'},
            {p:'Season sponsorship — TechForge negotiation close to terms',st:'fit'},
            {p:'Q1 board report — revenue tracking 10.9% ahead of budget',st:'fit'},
          ].map((b,i)=>(
            <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'8px 0',borderBottom:i<5?`1px solid ${C.border}`:'none'}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:statusColor(b.st),flexShrink:0,marginTop:5}}/>
              <span style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{b.p}</span>
            </div>
          ))}
        </Card>
      </div>
      <Card>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Monthly Revenue Trend — 2025–26</div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={[
            {m:'Sep',v:420000},{m:'Oct',v:380000},{m:'Nov',v:290000},{m:'Dec',v:340000},{m:'Jan',v:310000},{m:'Feb',v:460000},{m:'Mar',v:890000},{m:'Apr',v:1240000},{m:'May',v:1580000},{m:'Jun',v:2100000},
          ]} margin={{top:0,right:0,left:0,bottom:0}}>
            <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.purple} stopOpacity={0.3}/><stop offset="95%" stopColor={C.purple} stopOpacity={0}/></linearGradient></defs>
            <XAxis dataKey="m" tick={{fontSize:10,fill:C.dim}} axisLine={false} tickLine={false}/>
            <Area type="monotone" dataKey="v" stroke={C.purple} strokeWidth={2} fill="url(#rev)"/>
            <Tooltip contentStyle={{background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}} formatter={((v:number)=>[fmt(v),'']) as never}/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );

  // ── PAGE: STAFF ───────────────────────────────────────────────────
  const Staff=()=>(
    <div>
      <SectionHead title="Staff & HR" sub="Coaching staff, support team and ECB wage cap compliance"/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
        <Stat label="Total Staff" value="24" color={C.teal} sub="Coaching, support & admin"/>
        <Stat label="Wage Ratio" value="62%" color={C.amber} sub="ECB ceiling 70%"/>
        <Stat label="Contracts Expiring" value="3" color={C.amber} sub="By end of season"/>
      </div>
      <Card>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Coaching & Support Staff</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
            {['Name','Role','Contract End','Qualification','Status'].map(h=>(
              <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:500,color:C.dim,textTransform:'uppercase'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {[{n:'Dave Richards',r:'Head Coach',end:'Sep 2027',q:'ECB Level 4',st:'fit'},
              {n:'Karen Smith',r:'Assistant Coach',end:'Sep 2026',q:'ECB Level 3',st:'monitoring'},
              {n:'Sarah Cooper',r:'Lead Physiotherapist',end:'Sep 2027',q:'HCPC Chartered',st:'fit'},
              {n:'Mark Evans',r:'Head of S&C',end:'Sep 2026',q:'CSCS + NSCA',st:'monitoring'},
              {n:'Tom Kellett',r:'Academy Director',end:'Sep 2028',q:'ECB Level 4',st:'fit'},
              {n:'Phil Grant',r:'Academy Coach',end:'Sep 2026',q:'ECB Level 2',st:'injury'},
              {n:'Liz Ford',r:'Performance Analyst',end:'Dec 2026',q:'BSc Sports Sci.',st:'fit'},
              {n:'James Park',r:'Psychologist',end:'Sep 2027',q:'BASES Accredited',st:'fit'},
            ].map((s,i)=>(
              <tr key={i} style={{borderBottom:i<7?`1px solid ${C.border}`:'none'}}>
                <td style={{padding:'10px 12px',fontSize:13,fontWeight:500,color:C.text}}>{s.n}</td>
                <td style={{padding:'10px 12px',fontSize:12,color:C.muted}}>{s.r}</td>
                <td style={{padding:'10px 12px',fontSize:12,color:C.muted}}>{s.end}</td>
                <td style={{padding:'10px 12px',fontSize:12,color:C.dim}}>{s.q}</td>
                <td style={{padding:'10px 12px'}}><StatusBadge st={s.st} label={s.st==='fit'?'Active':s.st==='monitoring'?'Expiring soon':'DBS issue'}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );

  // ═══════════════ NEW VIEWS ═══════════════
  const fitBadge=(f:string)=>f==='fit'?C.green:f==='monitoring'?C.amber:C.red;
  const resultColor=(r:string)=>r==='W'?C.green:r==='L'?C.red:C.amber;
  const Th=({children}:{children:React.ReactNode})=>(
    <th style={{padding:'10px 14px',textAlign:'left',fontSize:11,fontWeight:500,color:C.dim,textTransform:'uppercase',letterSpacing:'0.04em'}}>{children}</th>
  );
  const Td=({children,color}:{children:React.ReactNode;color?:string})=>(
    <td style={{padding:'11px 14px',fontSize:13,color:color||C.muted}}>{children}</td>
  );
  const ProgressBar=({value,max,color=C.teal}:{value:number;max:number;color?:string})=>(
    <div style={{width:'100%',height:8,background:C.border,borderRadius:4,overflow:'hidden'}}>
      <div style={{width:`${Math.min(100,(value/max)*100)}%`,height:'100%',background:color,borderRadius:4}}/>
    </div>
  );

  const FORMAT_TABS: Array<{ id: string; label: string }> = [
    { id:'ch', label:'Championship' },
    { id:'t2', label:'T20 Blast' },
    { id:'od', label:'One Day Cup' },
    { id:'hu', label:'The Hundred' },
  ];
  const FORMAT_META: Record<string,{ sub:string; pos:{ label:string; value:string; sub:string }; next:{ label:string; value:string; sub:string } }> = {
    ch:{ sub:'Wednesday 8 April 2026 · Oakridge Park · Championship opener Friday vs Calderbrook CCC',
      pos:{ label:'League Position', value:'2nd',         sub:'Div 1 · 61 pts' },
      next:{ label:'Next Match',      value:'Fri 11 Apr',  sub:'vs Calderbrook CCC (H)' } },
    t2:{ sub:'Wednesday 8 April 2026 · Oakridge Park · T20 Blast — opener vs Aldermount County',
      pos:{ label:'North Group Position', value:'2nd',    sub:'6 pts' },
      next:{ label:'Next Blast',           value:'Fri 6 Jun', sub:'vs Aldermount County (H)' } },
    od:{ sub:'Wednesday 8 April 2026 · Oakridge Park · One Day Cup group stage',
      pos:{ label:'One Day Cup Group', value:'3rd',       sub:'Group B' },
      next:{ label:'Next OD',          value:'Sun 18 May', sub:'vs Brackenfell CCC (H)' } },
    hu:{ sub:'Wednesday 8 April 2026 · Oakridge Park · Northern Superchargers preparations',
      pos:{ label:'Hundred Status',    value:'Visa pending', sub:'Brett Mason — Home Office' },
      next:{ label:'Next Hundred',     value:'TBC',          sub:'Season opener — awaiting fixture' } },
  };
  const fmtMeta = FORMAT_META[format] || FORMAT_META.ch;
  const pitch = getPitchReport(matchDay);

  // Dashboard state
  const [dashTab, setDashTab] = useState<'gettingstarted'|'today'|'quickwins'|'dailytasks'|'insights'|'dontmiss'|'team'>(() => {
    try { const seen = typeof window !== 'undefined' ? localStorage.getItem('lumio_cricket_onboarding') : null; return seen ? 'today' : 'gettingstarted' } catch { return 'gettingstarted' }
  })
  const [tourStep, setTourStep] = useState(0)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [roundupOpen, setRoundupOpen] = useState<string | null>(null)
  const [weather, setWeather] = useState<{ temp:string; condition:string; icon:string; location?:string }>({ temp:'--', condition:'Loading...', icon:'🌤️' })
  const [dismissedWins, setDismissedWins] = useState<Set<string>>(new Set())
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [taskChecked, setTaskChecked] = useState<Record<string, boolean>>({ 't-briefing': true })
  const [teamSubTab, setTeamSubTab] = useState<'today'|'org'|'info'>('today')


  // Live weather — same source as football pro's banner. Condition → emoji
  // map so we can drop the hardcoded ⛅ and still get a sensible glyph for
  // whatever open-meteo returns (Rain / Storm / Snow / etc).
  useEffect(() => {
    fetch('/api/home/weather').then(r => r.json()).then((d: { temp?:string; condition?:string; location?:string }) => {
      const cond = d.condition || 'Partly cloudy'
      const icon = /storm/i.test(cond) ? '⛈️'
                 : /snow/i.test(cond)  ? '🌨️'
                 : /rain/i.test(cond)  ? '🌧️'
                 : /drizzle/i.test(cond) ? '🌦️'
                 : /fog/i.test(cond)   ? '🌫️'
                 : /sunny|clear/i.test(cond) ? '☀️'
                 : '⛅'
      setWeather({ temp: d.temp || '--', condition: cond, location: d.location, icon })
    }).catch(() => {})
  }, [])

  // ── Morning Roundup — per-channel demo messages (tap row → sheet) ─────
  type RoundupMessage = { id:string; from:string; avatar:string; time:string; subject:string; preview:string; urgent?:boolean }
  type RoundupChannel = { id:string; icon:string; label:string; count:number; urgent?:boolean; color:string; bg:string; border:string; messages:RoundupMessage[] }
  const ROUNDUP_CHANNELS: RoundupChannel[] = [
    { id:'sms',      icon:'💬', label:'SMS (Urgent)',      count:3, urgent:true,  color:'#f87171', bg:'rgba(248,113,113,0.08)', border:'rgba(248,113,113,0.4)', messages:[
      { id:'sms1', from:'Director',            avatar:'DR', time:'07:12', subject:'Board prep — need 2pm slot',       preview:'Can you free up 2pm today? Chair wants a quick read on the Westcombe contract before she heads to Lord’s tomorrow.', urgent:true },
      { id:'sms2', from:'Head Coach Caldwell', avatar:'MC', time:'06:58', subject:'Dawson — scan booked',              preview:'Stress-fracture screening confirmed Wed 16:00. Need medical sign-off before we finalise Friday XI.', urgent:true },
      { id:'sms3', from:'Physio Lawson',       avatar:'NL', time:'06:42', subject:'Harrison RTP — phase 3',            preview:'Phase 3 nets went well yesterday. Recommend 6 overs/innings cap for Friday if selected.' },
    ]},
    { id:'whatsapp', icon:'📱', label:'WhatsApp',           count:4, urgent:false, color:'#22c55e', bg:'rgba(34,197,94,0.08)',  border:'rgba(34,197,94,0.4)', messages:[
      { id:'wa1', from:'Squad Group',     avatar:'SG', time:'07:05', subject:'Travel call — Westmoor Cricket Ground',    preview:'Coach leaves 14:00 Thu from Oakridge Park. Kit drop 13:30. Reply 👍 to confirm.' },
      { id:'wa2', from:'Senior Players',  avatar:'SP', time:'Yesterday', subject:'Team dinner Sun',           preview:'Skipper wants the senior group out Sun evening. Local place at 19:30 — reply if you’re in.' },
      { id:'wa3', from:'Overseas Chat',   avatar:'OS', time:'Yesterday', subject:'Steenkamp landed',          preview:'Wheels down 14:20. Bags into the team hotel. Will come to training tomorrow — not bowling yet.' },
      { id:'wa4', from:'Analysts',        avatar:'AN', time:'06:30', subject:'Lancs LH match-up file',        preview:'Dropped the LH batters pack in the analyst drive. 3 clips per batter, 2 weaknesses each. Ready for selection.' },
    ]},
    { id:'slack',    icon:'#',  label:'Slack',              count:4, urgent:false, color:'#a855f7', bg:'rgba(168,85,247,0.08)', border:'rgba(168,85,247,0.4)', messages:[
      { id:'sl1', from:'#cricket-ops',  avatar:'OP', time:'07:22', subject:'Ground prep — 06:45 mow',         preview:'Pitch rolled overnight, strip covered until 09:00. Main Stand hospitality set for 240 pax Fri.' },
      { id:'sl2', from:'#analysts',     avatar:'AN', time:'07:14', subject:'Opposition batting splits',       preview:'Pulled 5-year Lancs home/away splits for the top 7. Sinclair avg 17 vs the nip-backer first 10 overs.' },
      { id:'sl3', from:'#media-comms',  avatar:'MC', time:'Yesterday', subject:'Press room Wed 14:00',        preview:'Press conf confirmed with Fairweather + Caldwell. Q-list prepared. Northbridge + 4 nationals attending.' },
      { id:'sl4', from:'#dressing-room', avatar:'DR',time:'Yesterday', subject:'Team meeting 09:30',          preview:'Full squad, pavilion room 2. Selection announce + Lancs plans. Coffee laid on from 09:15.' },
    ]},
    { id:'email',    icon:'✉️', label:'Email',              count:6, urgent:false, color:'#60a5fa', bg:'rgba(96,165,250,0.08)', border:'rgba(96,165,250,0.4)', messages:[
      { id:'em1', from:'Oakridge Sports',   avatar:'OS', time:'07:30', subject:'Fairweather — renewal terms',          preview:'Attaching the heads of terms for the new central + county deal. Client wants sign-off by end of week before the Champ opener.' },
      { id:'em2', from:'Pennine Mutual',    avatar:'PM', time:'06:55', subject:'Renewal — Q3 discussions',             preview:'Pennine Mutual’s renewal meeting hasn’t yet been booked. 92 days to expiry. Can we lock a date this week?' },
      { id:'em3', from:'ECB Compliance',    avatar:'EC', time:'Yesterday', subject:'CPA 2.0 — 3 sections outstanding', preview:'Player welfare log and wage cap declaration are the two critical items. Deadline 30 Apr for full submission.' },
      { id:'em4', from:'The Broadsheet',    avatar:'TB', time:'Yesterday', subject:'Long-form feature — Fairweather',   preview:'Reply by 14 Apr please. 2,500 words for the Saturday supplement. Ideally 20 minutes with Harry next week.' },
      { id:'em5', from:'Oakridge Chronicle', avatar:'OC', time:'2 days ago', subject:'Caldwell Q&A',                     preview:'Print spread for Friday’s match-day edition. 8 questions, 600-word answers. Draft back by Thu 12:00.' },
      { id:'em6', from:'Brightline Telecoms',avatar:'BT', time:'2 days ago', subject:'Shirt-front renewal proposal',     preview:'Draft proposal attached. 4-year term, £620k/yr. Matchday activation schedule in appendix B.' },
    ]},
    { id:'agent',    icon:'🤝', label:'Agent Messages',     count:3, urgent:true,  color:C.purple, bg:`${C.purple}14`, border:`${C.purple}40`, messages:[
      { id:'ag1', from:'Thornton Sports',     avatar:'TS', time:'07:18', subject:'Kingsley — extension ask',        preview:'Client wants to open talks before the Champ opener. Initial ask is £135k/yr for 2 years. Thoughts?', urgent:true },
      { id:'ag2', from:'Meridian Group',      avatar:'MG', time:'Yesterday', subject:'Abbas visa — minor query',     preview:'Home Office came back with one document clarification. Non-blocking, but we’ll need it signed off by Fri.' },
      { id:'ag3', from:'Lancaster Mgmt',      avatar:'LM', time:'2 days ago', subject:'Ridley — release clause',      preview:'Brackenfell CCC enquiry came in yesterday. £95k release active Oct. Client open to talking — wants reassurance on Champ minutes.', urgent:true },
    ]},
    { id:'board',    icon:'🏛️', label:'Board Messages',     count:2, urgent:false, color:C.teal,   bg:`${C.teal}14`,   border:`${C.teal}40`, messages:[
      { id:'bd1', from:'Board Chair',       avatar:'BC', time:'Yesterday', subject:'Windfall programme review',     preview:'Need a 15-min read on the Indoor Centre spend before Fri. Currently 32% of budget consumed — on track or slipping?' },
      { id:'bd2', from:'Finance Director',  avatar:'FD', time:'2 days ago', subject:'Wage cap declaration',          preview:'CPA wage cap declaration due 30 Apr. Have the numbers — need director sign-off before submission.' },
    ]},
    { id:'media',    icon:'📰', label:'Media & Press',      count:4, urgent:false, color:C.amber,  bg:`${C.amber}14`,  border:`${C.amber}40`, messages:[
      { id:'md1', from:'Willow Quarterly',    avatar:'WQ', time:'Yesterday', subject:'Fairweather profile',         preview:'Pitching a long-form piece on Fairweather’s central + county balance. Would like 45 min with him before the Champ opener.' },
      { id:'md2', from:'Cricket Digest',      avatar:'CD', time:'2 days ago', subject:'Podcast — 30 min',            preview:'Drive-time cricket podcast. 30 min slot with Fairweather on Champ form. Reply by 12 Apr.' },
      { id:'md3', from:'The Cricket Almanack',avatar:'CA', time:'2 days ago', subject:'Captain panel',               preview:'Retrospective panel on Oakridge vs Lancs rivalry. Looking for Shaw + one senior pro. Low urgency — reply by 18 Apr.' },
      { id:'md4', from:'Northbridge Sport',   avatar:'NS', time:'3 days ago', subject:'Pre-match pitch tour',         preview:'Broadcast crew want a pitch tour with groundsman Wed morning. Reply by 10 Apr so we can lock the crew booking.' },
    ]},
    { id:'transfer', icon:'🔁', label:'Transfer Activity',  count:2, urgent:true,  color:C.red,    bg:`${C.red}14`,    border:`${C.red}40`, messages:[
      { id:'tr1', from:'Recruitment',       avatar:'RC', time:'07:08', subject:'Hendricks — WK cover',         preview:'Long-term Pennington cover. Halden CCC willing to sell for £72k/yr. Shortlist him before we see Highford County’s offer.', urgent:true },
      { id:'tr2', from:'Scouting',          avatar:'SC', time:'Yesterday', subject:'Beukes — OS slot',          preview:'SA passport, would use overseas slot. T20 + OD only. 30yo, strong red-ball avg. Priority call before he signs elsewhere.', urgent:true },
    ]},
    { id:'staff',    icon:'👔', label:'Staff Updates',      count:2, urgent:false, color:'#0ea5e9', bg:'rgba(14,165,233,0.08)', border:'rgba(14,165,233,0.4)', messages:[
      { id:'st1', from:'Operations',   avatar:'OP', time:'Yesterday', subject:'DBS — Grant + Park',            preview:'Phil Grant’s DBS expired Apr 2026 and Julie Park’s also lapsed. Both need resolving before academy resumes.' },
      { id:'st2', from:'HR',           avatar:'HR', time:'2 days ago', subject:'Batting coach interview',        preview:'Three candidates shortlisted. Rao + Winterbourne recommend we push to final. Need dates before end of April.' },
    ]},
    { id:'academy',  icon:'🎓', label:'Academy',            count:2, urgent:false, color:C.green, bg:`${C.green}14`, border:`${C.green}40`, messages:[
      { id:'ac1', from:'Academy Director', avatar:'AD', time:'Yesterday', subject:'Noah Patel — contract',      preview:'Decision overdue since 31 Mar. Recommend offer full contract — England U19 caps + pathway A-grade.' },
      { id:'ac2', from:'Pathway',          avatar:'PW', time:'2 days ago', subject:'Clarke 1st XI debut',        preview:'Ready for debut. Scored back-to-back 2nd XI centuries. Suggest selection for Somerset round.' },
    ]},
  ]

  // ── Format filter helper — maps ch/t2/od/hu tab to format strings ─────
  const formatToLabel = (id:string) => id==='ch' ? '4-day' : id==='t2' ? 'T20' : id==='od' ? 'OD' : 'Hundred'
  const FORMAT_LABEL = formatToLabel(format)

  // Per-format demo fixtures + results for the Today tab cards. Real
  // CRICKET_FIXTURES / CRICKET_RESULTS arrays stay untouched — those feed
  // other pages (Match Centre etc). These smaller decks are scoped to the
  // dashboard so the format tab buttons can visibly filter without having
  // to invent new Hundred entries on the existing master lists.
  const FORMAT_FIXTURES: Record<string, Array<{ date:string; opponent:string; venue:'Home'|'Away'; time:string; competition:string }>> = {
    ch: [
      { date:'Fri 11 Apr',  opponent:'Calderbrook CCC',     venue:'Home', time:'10:30', competition:'Championship' },
      { date:'Tue 22 Apr',  opponent:'Highford County',         venue:'Away', time:'10:30', competition:'Championship' },
      { date:'Fri 2 May',   opponent:'Riverbank County',          venue:'Home', time:'10:30', competition:'Championship' },
      { date:'Fri 16 May',  opponent:'Somerset',       venue:'Away', time:'10:30', competition:'Championship' },
    ],
    t2: [
      { date:'Fri 6 Jun',   opponent:'Aldermount County',   venue:'Home', time:'18:30', competition:'T20 Blast' },
      { date:'Sun 8 Jun',   opponent:'Calderbrook CCC',     venue:'Away', time:'14:30', competition:'T20 Blast' },
      { date:'Fri 13 Jun',  opponent:'Castleford CCC',     venue:'Home', time:'18:30', competition:'T20 Blast' },
      { date:'Sat 21 Jun',  opponent:'Stannerton County',venue:'Away', time:'14:30', competition:'T20 Blast' },
    ],
    od: [
      { date:'Sun 18 May',  opponent:'Brackenfell CCC',         venue:'Home', time:'11:00', competition:'One Day Cup' },
      { date:'Wed 28 May',  opponent:'Stannerton County',          venue:'Away', time:'11:00', competition:'One Day Cup' },
      { date:'Sun 1 Jun',   opponent:'Leicestershire', venue:'Home', time:'11:00', competition:'One Day Cup' },
    ],
    hu: [
      { date:'Sat 2 Aug',   opponent:'Manchester Originals', venue:'Home', time:'19:00', competition:'The Hundred' },
      { date:'Wed 6 Aug',   opponent:'London Spirit',        venue:'Away', time:'19:00', competition:'The Hundred' },
      { date:'Sun 10 Aug',  opponent:'Oval Invincibles',     venue:'Home', time:'15:00', competition:'The Hundred' },
    ],
  }
  const FORMAT_RESULTS: Record<string, Array<{ date:string; opponent:string; venue:'Home'|'Away'; result:'W'|'L'|'D'; score:string; oppScore:string; format:string }>> = {
    ch: [
      { date:'4 Apr',  opponent:'Glenhill MCCU',        venue:'Home', result:'W', score:'412/7d', oppScore:'198 & 204', format:'Championship' },
      { date:'15 Sep', opponent:'Aldermount County',       venue:'Away', result:'W', score:'388 & 221/4d', oppScore:'342 & 198', format:'Championship' },
      { date:'5 Sep',  opponent:'Somerset',           venue:'Home', result:'L', score:'312 & 288', oppScore:'412 & 190/3', format:'Championship' },
    ],
    t2: [
      { date:'28 Aug', opponent:'Castleford CCC',         venue:'Home', result:'W', score:'184/5', oppScore:'162/9',      format:'T20 Blast' },
      { date:'22 Aug', opponent:'Calderbrook CCC',         venue:'Away', result:'L', score:'149/8', oppScore:'151/4',      format:'T20 Blast' },
      { date:'15 Aug', opponent:'Aldermount County',       venue:'Home', result:'W', score:'201/6', oppScore:'186/9',      format:'T20 Blast' },
    ],
    od: [
      { date:'28 Mar', opponent:'Leeds/Bradford',     venue:'Home', result:'W', score:'286/6', oppScore:'241',        format:'One Day Cup' },
      { date:'22 Mar', opponent:'Oakridge 2nd XI',    venue:'Home', result:'L', score:'348',   oppScore:'352/8',      format:'One Day Cup' },
      { date:'14 Mar', opponent:'Brackenfell CCC',             venue:'Away', result:'W', score:'262/7', oppScore:'248',        format:'One Day Cup' },
    ],
    hu: [
      { date:'24 Aug', opponent:'Northern Superchargers', venue:'Home', result:'W', score:'152/6', oppScore:'144/8', format:'The Hundred' },
      { date:'18 Aug', opponent:'Welsh Fire',             venue:'Away', result:'L', score:'138/9', oppScore:'142/5', format:'The Hundred' },
    ],
  }
  const FORMAT_KEYSTAT: Record<string, { topRuns:string; topWickets:string; form:string }> = {
    ch: { topRuns:'Fairweather · 412',  topWickets:'Ridley · 18',   form:'W W L W W' },
    t2: { topRuns:'Pennington · 284',   topWickets:'Sterling · 11',  form:'W L W W L' },
    od: { topRuns:'Kingsley · 198',     topWickets:'Fenwick · 9',   form:'W L W W' },
    hu: { topRuns:'Hill · 124',         topWickets:'Halden CCC · 8',      form:'W L' },
  }
  const fxForFormat      = FORMAT_FIXTURES[format]      || FORMAT_FIXTURES.ch
  const resultsForFormat = FORMAT_RESULTS[format]       || FORMAT_RESULTS.ch
  const keyStatForFormat = FORMAT_KEYSTAT[format]       || FORMAT_KEYSTAT.ch

  // TTS speaker
  const speakBriefing = () => {
    if (typeof window === 'undefined') return
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return }
    const text = aiSummary || generateSmartBriefing({
      now: new Date(),
      playerName: session?.userName || 'Director',
      schedule: [],
      match: null,
      roundupSummary: { totalMessages: 0, urgentCount: 0, urgentLabels: [] },
      sport: 'cricket',
      timezone: getUserTimezone(),
      extra: 'Championship opener in 3 days. Squad: 16 of 18 available.',
    })
    const u = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    const pref = voices.find(v => v.name.includes('Daniel') || v.name.includes('Google UK') || v.lang === 'en-GB') || voices.find(v => v.lang.startsWith('en'))
    if (pref) u.voice = pref; u.rate = 0.95
    u.onstart = () => setIsSpeaking(true); u.onend = () => setIsSpeaking(false); u.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(u)
  }
  useEffect(() => { return () => { if (typeof window !== 'undefined') window.speechSynthesis.cancel() } }, [])

  // Auto-generate AI summary on mount — gated on demo shells (static fallback)
  useEffect(() => {
    if (session?.isDemoShell !== false) {
      setAiSummary(DEMO_CRICKET_DASHBOARD_SUMMARY)
      return
    }
    setAiLoading(true)
    fetch('/api/ai/cricket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 300, messages: [{ role: 'user', content: 'Morning briefing for Oakridge CC director. Division One position: 2nd. Next fixture: vs Calderbrook CCC. Squad: 16/18 available. Cover: match preparation, pitch/weather, one opportunity.' }] }) })
      .then(r => r.json()).then(d => setAiSummary(d.content?.[0]?.text || null)).catch(() => {}).finally(() => setAiLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── DASHBOARD (v2 modular grid) ───────────────────────────────────────
  // The Director dashboard now uses the v2 redesign — a 5-row, 12-col
  // grid of modular cards (Hero · Today schedule · Stat tiles · AI Brief ·
  // Inbox · Squad · Fixtures · Perf · Recents · Season). v2 theme tokens
  // (Club Dark + Oxford accent) are scoped to the dashboard wrapper so the
  // rest of the portal keeps the v1 `C` palette unchanged.
  // ─── DASHBOARD (v2 modular grid) — restored tab bar + 16 quick actions ─
  // Full v1 tab system around the v2 grid: Getting Started · Today (v2 grid) ·
  // Quick Wins · Daily Tasks · Insights · Don't Miss · Team. Quick action
  // strip rendered above the active tab content. v2 theme tokens (Club Dark
  // + Oxford accent) scoped to the dashboard wrapper so other views keep the
  // v1 `C` palette.
  const Dashboard = () => {
    const T       = THEMES.dark
    const accent  = ACCENTS.oxford
    const density = DENSITY.regular
    const greeting = getGreeting('matchday')

    const [openFixture, setOpenFixture] = useState<V2Fixture | null>(null)
    const [cmdOpen, setCmdOpen] = useState(false)
    const [askOpen, setAskOpen] = useState(false)
    const [dashToast, showDashToast] = useDashboardToast()

    useKey('cmdk', () => setCmdOpen(o => !o))

    return (
      <>
        <style jsx global>{`
          .tnum { font-variant-numeric: tabular-nums; }
          @keyframes cricketV2PulseDim   { 0%,100% { opacity: .5 } 50% { opacity: .95 } }
          @keyframes cricketV2FadeUp     { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
          @keyframes cricketV2SlideLeft  { from { opacity: 0; transform: translateX(20px) } to { opacity: 1; transform: none } }
          @keyframes cricketV2SlideUp    { from { opacity: 0; transform: translate(-50%, 8px) } to { opacity: 1; transform: translate(-50%, 0) } }
        `}</style>

      {/* Hero banner — match-day context, persistent across tabs */}
      {/* BANNER FULL WIDTH — Today schedule moved into the three-column
          row alongside AI Morning Summary and Inbox; Squad Availability
          moved to bottom of page as full-width strip. Layout reflow per
          user spec — do not re-add Today as banner sibling without
          product approval. align-items: start retained defensively in
          case future siblings get added to this row. */}
      <div style={{ background: T.bg, color: T.text, fontFamily: FONT, padding: density.gap, borderRadius: 12, marginBottom: density.gap }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap, alignItems: 'start' }}>
          <HeroToday
            T={T} accent={accent} density={density} greeting={greeting}
            onConfirm={() => showDashToast('Starting XI confirmed · squad notified')}
            onAsk={() => setAskOpen(true)}
          />
        </div>
      </div>

      {/* Tab bar — Lucide icons + accent underline (matches rugby v2). */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        borderBottom: `1px solid ${T.border}`, overflowX: 'auto', marginBottom: density.gap,
      }}>
        {([
          { id: 'gettingstarted' as const, label: 'Getting Started', icon: 'sparkles' },
          { id: 'today'          as const, label: 'Today',           icon: 'home' },
          { id: 'quickwins'      as const, label: 'Quick Wins',      icon: 'lightning' },
          { id: 'dailytasks'     as const, label: 'Daily Tasks',     icon: 'check' },
          { id: 'insights'       as const, label: 'Insights',        icon: 'bars' },
          { id: 'dontmiss'       as const, label: "Don't Miss",      icon: 'flag' },
          { id: 'team'           as const, label: 'Team',            icon: 'people' },
        ]).map(t => {
          const active = dashTab === t.id
          return (
            <button key={t.id} onClick={() => setDashTab(t.id)}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = T.text2 }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = T.text3 }}
              style={{
                appearance: 'none', border: 0, background: 'transparent',
                padding: '10px 14px',
                fontFamily: FONT, fontSize: 12.5, fontWeight: active ? 600 : 500,
                color: active ? '#fff' : T.text3,
                borderBottom: `2px solid ${active ? accent.hex : 'transparent'}`,
                marginBottom: -1,
                cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 7,
                transition: 'color .12s, border-color .12s',
              }}>
              <V2Icon name={t.icon} size={12} stroke={1.6} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Quick Actions — role-aware: 6 buttons reshape per active role. */}
      {/* QUICK ACTIONS row centered horizontally for breathing space
          between the left-aligned Tabs row above and the KPI cards
          below. Visual hierarchy: navigation flush-left, actions
          centered. */}
      <div style={{ marginBottom: density.gap, display: 'flex', justifyContent: 'center' }}>
        <RoleAwareQuickActionsBar
          sport="cricket"
          role={currentRole as string}
          onNavigate={(dept) => setPage(dept)}
          onAction={(modalId) => showDashToast(`${modalId} — coming soon`)}
          accentHex={accent.hex}
        />
      </div>

      {/* TODAY — v2 modular grid (hero rendered above tabs) */}
      {dashTab === 'today' && (
        <div style={{ background: T.bg, color: T.text, fontFamily: FONT, padding: density.gap, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: density.gap }}>
          <StatTiles T={T} accent={accent} density={density} />

          {/* Three-column row — AI Morning Summary | Inbox | Today.
              Cards rendered as DIRECT grid children (no per-card wrapper
              divs). Each card sets its own gridColumn internally
              (AIBrief default '1/span 4', Inbox '5/span 4',
              TodaySchedule '9/span 4' — totalling 12).
              CARD ROW GAP — gap: 8 (tighter than density.gap=14) so
              the three cards read as one unified row visual rather than
              three disconnected cards. */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8, alignItems: 'stretch' }}>
            <AIBrief T={T} accent={accent} density={density} onAsk={() => setAskOpen(true)} />
            <Inbox   T={T} accent={accent} density={density} />
            <TodaySchedule T={T} accent={accent} density={density} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
            <Fixtures T={T} accent={accent} density={density} onPick={setOpenFixture} />
            <Perf     T={T} accent={accent} density={density} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
            <Recents T={T} accent={accent} density={density} />
            <Season  T={T} accent={accent} density={density} />
          </div>

          {/* Squad Availability — full-width strip at bottom of page,
              direct grid child spanning '1 / -1'. */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
            <DashboardSquad T={T} accent={accent} density={density} />
          </div>

          <div style={{ padding: '6px 0 8px', display: 'flex', gap: 14, fontSize: 10.5, color: T.text3, justifyContent: 'center' }}>
            <span>⌘K command palette</span><span>·</span><span>esc close overlays</span>
          </div>
        </div>
      )}

      {dashTab === 'gettingstarted' && (() => {
        // Per-step showcase keys. Body switches on step.preview and renders
        // an interactive fragment — same pattern tennis uses. Callout card
        // at the bottom of each showcase is purple-tinted (cricket theme).
        const STEPS: Array<{ n:number; short:string; icon:string; title:string; sub:string; preview:string }> = [
          { n:1,  short:'Your cricket OS',                icon:'🏏', title:'Your cricket OS, fully connected',
            sub:'Every system that matters for a county — ECB, PCA, sponsors, county board, agents — in one dashboard. No more spreadsheets. No more WhatsApp threads.',
            preview:'cricket_os' },
          { n:2,  short:'Match-day briefing',             icon:'🌅', title:'Start every match day knowing everything',
            sub:"10 channels in one briefing, sorted by urgency, scored by impact. Director's-eye view in 90 seconds.",
            preview:'matchday_briefing' },
          { n:3,  short:'One click to anywhere',           icon:'⚡', title:'Every action, one click away',
            sub:'Team selection. Toss call. Media brief. Workload check. One button. One response.',
            preview:'quick_actions' },
          { n:4,  short:'PCA, ECB, county in sync',        icon:'📋', title:'PCA, ECB, county — all in sync',
            sub:'DBS expiry alerts. Compliance logs. Overseas slot tracking. Play-Cricket sync. Safeguarding audit-ready.',
            preview:'compliance' },
          { n:5,  short:'Workload protection',             icon:'🦾', title:'Workload protection that actually works',
            sub:'ICC guidelines baked in. Red/amber/green flags per bowler. Spell-length caps auto-calculated.',
            preview:'workload' },
          { n:6,  short:'AI that helps you win',           icon:'🧠', title:'AI that actually helps you win',
            sub:'Toss decisions informed by 20,000 pitch readings. Team selection optimised for opposition weakness. Tactical briefs at innings breaks.',
            preview:'ai_advisor' },
          { n:7,  short:'Your team, front and centre',     icon:'👥', title:'Your team, front and centre',
            sub:"10 role dashboards for 10 different jobs. Director's board. Head Coach's squad. Groundsman's pitch view.",
            preview:'roles' },
          { n:8,  short:'Sponsors managed automatically',  icon:'🤝', title:'Sponsors managed automatically',
            sub:'Deliverable tracking. Deadline alerts. Renewal pipeline. No more "forgot to post the kit photo" at 23:59.',
            preview:'sponsorship' },
          { n:9,  short:'Nothing falls through the cracks',icon:'🔴', title:'Nothing falls through the cracks',
            sub:'Travel, kit, accommodation, entries, medicals, mental check-ins — all tracked, all flagged.',
            preview:'dontmiss' },
          { n:10, short:'Run your club like a business',   icon:'💼', title:'Run your cricket club like a business',
            sub:"Because that's what it is.",
            preview:'business' },
        ]
        const step = STEPS[tourStep]
        const calloutBox: React.CSSProperties = { backgroundColor: `${C.purple}14`, border: `1px solid ${C.purple}40`, color: '#E9D5FF' }
        return (
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 mr-4">
                <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: C.purple }}>STEP {tourStep + 1} OF {STEPS.length}</div>
                <div className="w-full rounded-full h-1" style={{ background: C.border }}><div className="h-1 rounded-full transition-all duration-500" style={{ width: `${((tourStep + 1) / STEPS.length) * 100}%`, backgroundColor: C.purple }} /></div>
              </div>
              <button onClick={() => { localStorage.setItem('lumio_cricket_onboarding', 'true'); setDashTab('today') }} className="text-sm flex-shrink-0" style={{ color: C.dim }}>Skip tour →</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                {STEPS.map((s, i) => (
                  <button key={s.n} onClick={() => setTourStep(i)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{ backgroundColor: tourStep === i ? C.purpleDim : 'transparent', border: tourStep === i ? `1px solid ${C.purple}50` : '1px solid transparent' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: i < tourStep ? C.green : tourStep === i ? C.purple : 'rgba(255,255,255,0.05)', color: i <= tourStep ? '#fff' : C.dim }}>
                      {i < tourStep ? '✓' : s.n}
                    </div>
                    <span className="text-sm" style={{ color: tourStep === i ? C.text : C.dim }}>{s.short}</span>
                  </button>
                ))}
              </div>
              <div className="lg:col-span-2">
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, minHeight: 480 }}>
                  <div className="p-8">
                    <div className="text-4xl mb-3">{step.icon}</div>
                    <h2 className="text-xl font-black mb-2" style={{ color: C.text }}>{step.title}</h2>
                    <p className="text-sm leading-relaxed mb-5" style={{ color: C.muted }}>{step.sub}</p>

                    {/* ── STEP 1 — cricket OS overview ───────────────────── */}
                    {step.preview === 'cricket_os' && (<>
                      <div className="rounded-xl p-4" style={{ background: `${C.purple}0f`, border: `1px solid ${C.purple}33` }}>
                        <div className="text-xs font-bold mb-3" style={{ color: C.text }}>Director dashboard · Oakridge CC</div>
                        <div className="grid grid-cols-4 gap-2">
                          {[{ icon:'🏆', v:'2nd',      label:'Div One',    c:C.teal },
                            { icon:'🏏', v:'Fri 11',   label:'Next Match', c:C.purple },
                            { icon:'👥', v:'16/18',    label:'Squad',      c:C.green },
                            { icon:'💰', v:'£3.2m',    label:'Budget',     c:C.amber }].map((s, i) => (
                            <div key={i} className="rounded-lg p-2 text-center" style={{ backgroundColor: C.bg }}>
                              <div className="text-lg">{s.icon}</div>
                              <div className="text-xs font-black mt-0.5" style={{ color: s.c }}>{s.v}</div>
                              <div className="text-[9px] mt-0.5" style={{ color: C.dim }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                        <div className="text-[10px] text-center mt-3" style={{ color: C.dim }}>Powered by Play-Cricket · ECB Hub · Gmail · Calendar · Lumio GPS</div>
                      </div>
                      <div className="mt-4 rounded-xl p-3 text-xs leading-relaxed" style={calloutBox}>
                        💡 Every county system in one dashboard — no more tab-hopping between Play-Cricket, the Hub, and your 12 WhatsApp groups.
                      </div>
                    </>)}

                    {/* ── STEP 2 — Morning Roundup preview ──────────────── */}
                    {step.preview === 'matchday_briefing' && (<>
                      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                        <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: C.bg, borderBottom: `1px solid ${C.border}` }}>
                          <div className="flex items-center gap-2"><span>🌅</span><span className="text-sm font-bold" style={{ color: C.text }}>Morning Roundup</span></div>
                          <span className="text-[10px]" style={{ color: C.dim }}>Since you were last here · 06:00</span>
                        </div>
                        {[{ icon:'💬', label:'SMS (Urgent)',   count:3, urgent:true,  color:'#f87171' },
                          { icon:'📱', label:'WhatsApp',       count:4, urgent:false, color:'#22c55e' },
                          { icon:'🤝', label:'Agent Messages', count:3, urgent:true,  color:C.purple },
                          { icon:'🏥', label:'Physio & Medical',count:2, urgent:true, color:C.red },
                          { icon:'🏛️', label:'Board Messages', count:2, urgent:false, color:C.teal }].map((ch, i, a) => (
                          <div key={i} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: i < a.length - 1 ? `1px solid ${C.border}` : 'none', backgroundColor: C.card }}>
                            <div className="flex items-center gap-2">
                              <span>{ch.icon}</span>
                              <span className="text-xs" style={{ color: C.text }}>{ch.label}</span>
                              {ch.urgent && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: C.red }}>Urgent</span>}
                            </div>
                            <span className="text-sm font-bold" style={{ color: ch.color }}>{ch.count}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 rounded-xl p-3 text-xs leading-relaxed" style={calloutBox}>
                        🔊 10 channels collapse into one director&apos;s-eye view every morning at 06:00. Already triaged, already sorted.
                      </div>
                    </>)}

                    {/* ── STEP 3 — Quick Actions pills ──────────────────── */}
                    {step.preview === 'quick_actions' && (<>
                      <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: C.dim }}>Quick actions</div>
                      <div className="flex flex-wrap gap-2">
                        {[{ icon:'👥', label:'Team Selection AI',  color:C.purple, hot:true },
                          { icon:'🌤️', label:'Toss Advisor',       color:C.teal,   hot:true },
                          { icon:'📱', label:'Sponsor Post AI',    color:C.amber,  hot:true },
                          { icon:'🗞️', label:'Press Statement AI', color:C.red,    hot:true },
                          { icon:'🤝', label:'Agent Brief AI',     color:C.purple, hot:true },
                          { icon:'🎯', label:'Match Prep AI',      color:C.teal,   hot:true },
                          { icon:'🧠', label:'Innings Brief AI',   color:C.amber,  hot:true },
                          { icon:'🏥', label:'Log Injury',         color:C.red,    hot:false }].map((a, i) => (
                          <div key={i} className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                            style={{ background: a.hot ? `${a.color}18` : '#111318', border: a.hot ? `1px solid ${a.color}50` : `1px solid ${C.border}`, color: a.hot ? a.color : C.muted }}>
                            <span>{a.icon}</span>{a.label}
                            {a.hot && <span className="absolute -top-1 -right-1 text-[8px] px-1 py-0.5 rounded-full font-black leading-none" style={{ backgroundColor: a.color, color: '#fff' }}>AI</span>}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 rounded-xl p-3 text-xs leading-relaxed" style={calloutBox}>
                        💡 16 quick actions on your dashboard — pick your XI, draft a press statement, log an injury, brief your agent. All in under 60 seconds.
                      </div>
                    </>)}

                    {/* ── STEP 4 — Compliance checklist ─────────────────── */}
                    {step.preview === 'compliance' && (<>
                      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                        <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: C.bg, borderBottom: `1px solid ${C.border}` }}>
                          <div className="flex items-center gap-2"><span>📋</span><span className="text-sm font-bold" style={{ color: C.text }}>Compliance status</span></div>
                          <span className="text-[10px]" style={{ color: C.dim }}>ECB · PCA · Play-Cricket</span>
                        </div>
                        {[{ label:'DBS renewals', sub:'18/19 staff current', flag:'✓', color:C.green },
                          { label:'Overseas player slots', sub:'2/2 allocated · Steenkamp + Mason', flag:'✓', color:C.green },
                          { label:'Safeguarding audit', sub:'Last passed 12 Feb', flag:'✓', color:C.green },
                          { label:'Play-Cricket fixture sync', sub:'Last sync 06:12', flag:'✓', color:C.green },
                          { label:'Winterbourne DBS', sub:'Due in 14 days', flag:'!', color:C.amber }].map((r, i, a) => (
                          <div key={i} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: i < a.length - 1 ? `1px solid ${C.border}` : 'none', backgroundColor: C.card }}>
                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${r.color}22`, color: r.color, border: `1px solid ${r.color}55` }}>{r.flag}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold" style={{ color: C.text }}>{r.label}</div>
                              <div className="text-[10px]" style={{ color: C.dim }}>{r.sub}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 rounded-xl p-3 text-xs leading-relaxed" style={calloutBox}>
                        🛡 DBS, CPA, overseas slots, safeguarding — every county compliance item flagged before it becomes a problem.
                      </div>
                    </>)}

                    {/* ── STEP 5 — Bowling workload mini-table ──────────── */}
                    {step.preview === 'workload' && (<>
                      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                        <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: C.bg, borderBottom: `1px solid ${C.border}` }}>
                          <div className="flex items-center gap-2"><span>🦾</span><span className="text-sm font-bold" style={{ color: C.text }}>Bowling Workload Tracker</span></div>
                          <span className="text-[10px]" style={{ color: C.dim }}>ICC fast-bowler guidelines · last 7 days</span>
                        </div>
                        <div className="grid grid-cols-4 px-4 py-2 text-[10px] font-bold uppercase" style={{ color: C.dim, borderBottom: `1px solid ${C.border}`, backgroundColor: C.cardAlt }}>
                          <div>Bowler</div><div>Overs 7d</div><div>Recovery</div><div className="text-right">Flag</div>
                        </div>
                        {[{ name:'Chris Dawson',  overs:'48 (A:C 1.62)', recovery:'2 days', flag:'RED',   color:C.red,    note:'Spell cap 5 overs' },
                          { name:'Sam Reed',      overs:'38',            recovery:'1 day',  flag:'AMBER', color:C.amber,  note:'Reduce T20 block' },
                          { name:'Rajan Steenkamp',overs:'32',           recovery:'3 days', flag:'GREEN', color:C.green,  note:'Within guideline' }].map((r, i, a) => (
                          <div key={i} className="grid grid-cols-4 items-center px-4 py-3 text-xs" style={{ borderBottom: i < a.length - 1 ? `1px solid ${C.border}` : 'none', backgroundColor: C.card }}>
                            <div>
                              <div className="font-bold" style={{ color: C.text }}>{r.name}</div>
                              <div className="text-[10px]" style={{ color: C.dim }}>{r.note}</div>
                            </div>
                            <div style={{ color: C.muted }}>{r.overs}</div>
                            <div style={{ color: C.muted }}>{r.recovery}</div>
                            <div className="text-right">
                              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${r.color}22`, color: r.color }}>{r.flag}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 rounded-xl p-3 text-xs leading-relaxed" style={calloutBox}>
                        🛡 ICC guidelines baked in. Your physio&apos;s spell-length calculator, automated per bowler per format.
                      </div>
                    </>)}

                    {/* ── STEP 6 — Toss Advisor sample response ─────────── */}
                    {step.preview === 'ai_advisor' && (<>
                      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.teal}40` }}>
                        <div className="px-4 py-3" style={{ backgroundColor: `${C.teal}14`, borderBottom: `1px solid ${C.teal}40` }}>
                          <div className="text-xs font-bold flex items-center gap-2" style={{ color: C.teal }}>
                            <span>🌤️</span> Toss Advisor · Oakridge Park · Fri 10:30
                            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-black" style={{ backgroundColor: C.teal, color: '#07080F' }}>AI</span>
                          </div>
                        </div>
                        <div className="p-4" style={{ backgroundColor: C.card }}>
                          <div className="inline-block px-3 py-1.5 rounded-lg text-lg font-black mb-3" style={{ backgroundColor: C.greenDim, color: C.green, border: `2px solid ${C.green}` }}>BAT FIRST</div>
                          <div className="text-xs leading-relaxed mb-3" style={{ color: C.text }}>
                            Pitch moisture gone after the overnight cover. Our top order averages 44.2 batting first on this ground since 2022, and Calderbrook CCC&apos;s opening attack leaks in the first hour — particularly to left-handers pushing hard at the fourth stump.
                          </div>
                          <div className="rounded-lg p-2 text-[11px]" style={{ backgroundColor: `${C.teal}14`, border: `1px solid ${C.teal}33`, color: C.teal }}>
                            <b>Key factor:</b> Top-order avg 44.2 batting first · home ground · April conditions
                          </div>
                        </div>
                        <div className="px-4 py-2 text-[10px]" style={{ backgroundColor: C.bg, color: C.dim }}>Generated from 20,000+ pitch readings · live weather · squad form splits</div>
                      </div>
                      <div className="mt-4 rounded-xl p-3 text-xs leading-relaxed" style={calloutBox}>
                        ✨ Decisions informed by 20,000+ pitch readings. Tactical brief ready at innings breaks, not three overs too late.
                      </div>
                    </>)}

                    {/* ── STEP 7 — 10-role picker ───────────────────────── */}
                    {step.preview === 'roles' && (<>
                      <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: C.dim }}>10 role dashboards · one portal</div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {CRICKET_ROLES.map(r => (
                          <div key={r.id} className="rounded-lg p-2 text-center" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
                            <div className="text-lg">{r.icon}</div>
                            <div className="text-[11px] font-bold mt-0.5" style={{ color: C.text }}>{r.label}</div>
                            <div className="text-[9px] mt-0.5" style={{ color: C.dim }}>{r.description}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 rounded-xl p-3 text-xs leading-relaxed" style={calloutBox}>
                        👥 10 dashboards for 10 jobs. Everyone sees what they need, nothing they don&apos;t — switch role any time from the bottom of the sidebar.
                      </div>
                    </>)}

                    {/* ── STEP 8 — Sponsorship Pipeline preview ─────────── */}
                    {step.preview === 'sponsorship' && (<>
                      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                        <div className="px-4 py-3" style={{ backgroundColor: C.bg, borderBottom: `1px solid ${C.border}` }}>
                          <div className="text-xs font-bold flex items-center gap-2" style={{ color: C.text }}>
                            <span>🤝</span> Sponsorship Pipeline
                            <span className="ml-auto text-[10px]" style={{ color: C.dim }}>£4.7m annual · 3 renewals Q3</span>
                          </div>
                        </div>
                        {[{ n:'Pennine Mutual',     tier:'Shirt Front',     stage:'Negotiating', val:'£340k/yr', color:C.amber, emoji:'⚡' },
                          { n:'Midlands Bank',      tier:'Naming Rights',   stage:'Active',      val:'£1.8m/yr', color:C.green, emoji:'✓' },
                          { n:'Brightline Telecoms',tier:'Official Partner',stage:'Prospecting', val:'£620k/yr', color:C.teal,  emoji:'•' }].map((s, i, a) => (
                          <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < a.length - 1 ? `1px solid ${C.border}` : 'none', backgroundColor: C.card }}>
                            <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${s.color}22`, color: s.color }}>{s.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold" style={{ color: C.text }}>{s.n}</div>
                              <div className="text-[10px]" style={{ color: C.dim }}>{s.tier} · {s.val}</div>
                            </div>
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${s.color}22`, color: s.color }}>{s.stage.toUpperCase()}</span>
                          </div>
                        ))}
                        <div className="px-4 py-2.5 text-[11px] flex items-center gap-2" style={{ backgroundColor: `${C.red}14`, borderTop: `1px solid ${C.red}40`, color: C.red }}>
                          <span>🚨</span><span><b>Acme Insurance</b> — 92 days to expiry · renewal meeting not yet booked</span>
                        </div>
                      </div>
                      <div className="mt-4 rounded-xl p-3 text-xs leading-relaxed" style={calloutBox}>
                        🤝 Deliverables, deadlines, renewals — all tracked, all alerted. No more missed kit photos at 23:59.
                      </div>
                    </>)}

                    {/* ── STEP 9 — Don't Miss grouped alerts ────────────── */}
                    {step.preview === 'dontmiss' && (<>
                      <div className="space-y-2">
                        {[{ urgency:'URGENT',  urgencyColor:C.red,   urgencyBg:C.redDim,   item:'T20 Blast squad submission — today 17:00. Pending 2 signatures.' },
                          { urgency:'THIS WK', urgencyColor:C.amber, urgencyBg:C.amberDim, item:'Team sheet deadline — Wed 17:00 for Calderbrook CCC Friday opener.' },
                          { urgency:'30 APR',  urgencyColor:C.dim,   urgencyBg:'rgba(75,85,99,0.15)', item:'ECB Compliance quarterly audit · CPA self-assessment outstanding.' },
                          { urgency:'FRI',     urgencyColor:C.purple,urgencyBg:C.purpleDim, item:'vs Calderbrook CCC — Oakridge Park · Championship opener · 10:30.' }].map((d, i) => (
                          <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded flex-shrink-0 mt-0.5" style={{ backgroundColor: d.urgencyBg, color: d.urgencyColor }}>{d.urgency}</span>
                            <span className="text-xs" style={{ color: C.text }}>{d.item}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 rounded-xl p-3 text-xs leading-relaxed" style={calloutBox}>
                        ⚠ Travel, kit, medicals, safeguarding, entries — tracked across every surface. Nothing lost in a thread.
                      </div>
                    </>)}

                    {/* ── STEP 10 — Director business snapshot ──────────── */}
                    {step.preview === 'business' && (<>
                      <div className="grid grid-cols-2 gap-3">
                        {[{ icon:'💰', label:'Annual Revenue',    v:'£14.2m', sub:'+8% vs last season',      color:C.green },
                          { icon:'👕', label:'Squad Cost',        v:'£9.8m',  sub:'ECB wage cap 91%',         color:C.amber },
                          { icon:'📅', label:'Fixtures Booked',   v:'38/38',  sub:'All formats · 2026 season', color:C.purple },
                          { icon:'🏛️', label:'Board KPIs Met',    v:'8/10',   sub:'Windfall spend on track',  color:C.teal }].map((s, i) => (
                          <div key={i} className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                            <div className="text-2xl">{s.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px]" style={{ color: C.dim }}>{s.label}</div>
                              <div className="text-xl font-black" style={{ color: s.color }}>{s.v}</div>
                              <div className="text-[10px]" style={{ color: C.muted }}>{s.sub}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 rounded-xl p-3 text-xs" style={{ background: `${C.purple}12`, border: `1px solid ${C.purple}33` }}>
                        <div className="text-[10px] font-bold uppercase mb-1" style={{ color: C.purple }}>Board briefing — Q2</div>
                        <div className="text-xs" style={{ color: C.muted }}>Revenue tracking ahead of budget. Pennine Mutual renewal at £340k/yr adds £60k vs current. CPA compliance clean · wage cap 91% with headroom for one late signing.</div>
                      </div>
                      <div className="mt-4 rounded-xl p-3 text-xs leading-relaxed" style={calloutBox}>
                        💼 Because that&apos;s what it is. And because that&apos;s how the clubs staying solvent do it.
                      </div>
                    </>)}
                  </div>

                  {/* ── Back / counter / Next footer ────────────────────── */}
                  <div className="flex items-center justify-between px-6 pb-6 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
                    <button onClick={() => setTourStep(Math.max(0, tourStep - 1))} disabled={tourStep === 0}
                      className="px-4 py-2 rounded-xl text-sm transition-all"
                      style={{ backgroundColor: tourStep === 0 ? 'transparent' : C.border, color: tourStep === 0 ? C.dim : C.muted, cursor: tourStep === 0 ? 'not-allowed' : 'pointer' }}>← Back</button>
                    <span className="text-xs" style={{ color: C.dim }}>{tourStep + 1} / {STEPS.length}</span>
                    {tourStep < STEPS.length - 1 ? (
                      <button onClick={() => setTourStep(tourStep + 1)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: C.purple }}>Next →</button>
                    ) : (
                      <button onClick={() => { localStorage.setItem('lumio_cricket_onboarding', 'true'); setDashTab('today') }} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: C.green }}>You&apos;re ready — let&apos;s go 🏏</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {dashTab === 'quickwins' && (() => {
        const CRICKET_QUICK_WINS: Array<{ id:string; impact:'high'|'medium'|'low'; effort:string; category:string; title:string; description:string; source:string; action:string; actionSection:string }> = [
          { id:'qw-1', impact:'high',   effort:'2min',  category:'Travel',     title:'Book Calderbrook CCC trip flights — prices rising daily',       description:'Departing 10 Apr. Train £180 vs flight £95 this week. Window closes Wed.',               source:'Operations · travel desk',     action:'Search flights',    actionSection:'travel' },
          { id:'qw-2', impact:'high',   effort:'5min',  category:'Commercial', title:'Reply to Pennine Mutual renewal inquiry',                  description:'Agent Oakridge Sports sent the renewal brief 3 days ago. Decision needed this week.',   source:'Sponsorship pipeline',         action:'Open sponsorship', actionSection:'sponsorship' },
          { id:'qw-3', impact:'high',   effort:'2min',  category:'Sponsor',    title:'Crownmark post overdue today',                             description:'Photographer needs bat shot by 14:00 today to meet the contractual matchday post slot.', source:'Media & Content',              action:'View obligation',   actionSection:'media' },
          { id:'qw-4', impact:'high',   effort:'5min',  category:'Entries',    title:'T20 Blast quarter-final entry — deadline today',           description:'ECB needs squad submitted by 17:00. Pending 2 signatures (Director + Head Coach).',     source:'ECB Compliance Hub',           action:'Manage entries',    actionSection:'vitality-blast' },
          { id:'qw-5', impact:'medium', effort:'10min', category:'Match Prep', title:'Review Calderbrook CCC bowling patterns',                        description:"Friday's match at 10:30. Analysis team uploaded 4 tagged clips for the top 6 batters.",  source:'Analyst — Opposition Scout',   action:'View match prep',   actionSection:'opposition' },
          { id:'qw-6', impact:'medium', effort:'5min',  category:'Staff',      title:'DBS check expiring — Assistant Coach Winterbourne',        description:'Renewal required by 20 Apr. ECB compliance flag — signed DBS-3 form outstanding.',     source:'Compliance / Safeguarding',    action:'Open compliance',   actionSection:'compliance' },
          { id:'qw-7', impact:'medium', effort:'15min', category:'Medical',    title:'Ridley workload review',                                   description:'142 high-intensity efforts in 7 days vs 130 ceiling. Adjust Thu session before Friday.', source:'Medical / S&C',                action:'Review plan',       actionSection:'bowling-workload' },
          { id:'qw-8', impact:'low',    effort:'20min', category:'Academy',    title:'Second XI hat-trick bowler — first-team shortlist',        description:'Academy Director flagged Clarke for Monday selection meeting. Profile ready to review.', source:'Academy — Pathway',           action:'View report',       actionSection:'academy' },
        ]
        const impactColor = (imp:string) => imp === 'high' ? C.red : imp === 'medium' ? C.amber : C.teal
        const impactBg    = (imp:string) => imp === 'high' ? C.redDim : imp === 'medium' ? C.amberDim : C.tealDim
        const visible = CRICKET_QUICK_WINS.filter(w => !dismissedWins.has(w.id))
        return (
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: C.text }}>Quick Wins</h3>
                <p className="text-[11px]" style={{ color: C.dim }}>{visible.length} actions remaining</p>
              </div>
              {dismissedWins.size > 0 && (
                <span className="text-[10px] px-2 py-1 rounded-full font-bold" style={{ background: C.greenDim, color: C.green }}>
                  {dismissedWins.size} completed
                </span>
              )}
            </div>
            {visible.length === 0 ? (
              <div className="text-center py-12 rounded-xl" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                <div className="text-3xl mb-3">🎉</div>
                <div className="text-sm font-semibold" style={{ color: C.text }}>All done!</div>
                <div className="text-xs" style={{ color: C.dim }}>You have cleared all your quick wins for today.</div>
              </div>
            ) : (
              visible.map(win => (
                <div key={win.id} className="rounded-2xl p-5 transition-all" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: impactBg(win.impact), color: impactColor(win.impact) }}>
                          {win.impact === 'high' ? 'HIGH IMPACT' : win.impact === 'medium' ? 'MEDIUM IMPACT' : 'LOW IMPACT'}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(14,165,233,0.15)', color: '#38bdf8' }}>⏱ {win.effort}</span>
                        <span className="text-xs" style={{ color: C.dim }}>{win.category}</span>
                      </div>
                      <h3 className="font-bold mb-1" style={{ color: C.text }}>{win.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{win.description}</p>
                      <p className="text-xs mt-2" style={{ color: C.dim }}>Source: {win.source}</p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={() => setPage(win.actionSection)} className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{ backgroundColor: C.purple }}>
                        {win.action} →
                      </button>
                      <button onClick={() => setDismissedWins(s => { const n = new Set(s); n.add(win.id); return n })} className="px-4 py-2 text-xs rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: C.muted }}>
                        Mark done
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
            {CRICKET_QUICK_WINS.filter(w => dismissedWins.has(w.id)).length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.dim }}>Completed</div>
                {CRICKET_QUICK_WINS.filter(w => dismissedWins.has(w.id)).map(win => (
                  <div key={win.id} className="flex items-center gap-3 rounded-lg px-4 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-xs" style={{ color: C.green }}>✓</span>
                    <span className="text-xs" style={{ color: C.dim, textDecoration: 'line-through' }}>{win.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* DAILY TASKS TAB */}
      {dashTab === 'dailytasks' && (() => {
        const CRICKET_TASKS: Array<{ id:string; priority:'critical'|'high'|'medium'|'low'; category:string; title:string; due:string; description?:string; action?:string; actionSection?:string }> = [
          { id:'t-briefing',  priority:'low',      category:'Admin',    title:'Morning briefing recorded',                       due:'Done 06:45',        description:'Director briefing listened to — all key items logged.' },
          { id:'t-teamsheet', priority:'critical', category:'Selection',title:'Team sheet submitted — deadline 17:00',           due:'Today 17:00',       description:'Friday XI + travel group. Pending final sign-off from Head Coach.',     action:'Submit team sheet', actionSection:'squad' },
          { id:'t-injury',    priority:'high',     category:'Medical',  title:'Injury status updated',                            due:'Today 12:00',       description:'Rafiq + Cooper latest readings. Harrison RTP phase 3 assessment.',       action:'Open medical',      actionSection:'medical' },
          { id:'t-dbs',       priority:'high',     category:'Compliance',title:'DBS compliance review (4 outstanding)',            due:'By 20 Apr',         description:'Winterbourne, Tremayne, Cavendish, Rao. Renewals required by month end.', action:'Open compliance',   actionSection:'compliance' },
          { id:'t-oppo',      priority:'high',     category:'Match Prep',title:'Opposition scout review',                          due:'Today 15:00',       description:'Calderbrook CCC batters + bowling patterns. Analyst deck ready to approve.',  action:'Open scout',        actionSection:'opposition' },
          { id:'t-workload',  priority:'medium',   category:'Medical',  title:'Workload dashboard checked (2 amber flags)',        due:'Today',             description:'Dawson A:C 1.62 · Harrison RTP phase 3. Review cap for Friday selection.',action:'Open workload',     actionSection:'bowling-workload' },
          { id:'t-mental',    priority:'medium',   category:'Welfare',  title:'Mental Performance check-ins reviewed',             due:'Today',             description:'18/18 complete · 2 amber flags (Cole, Harrison). Confidentiality preserved.', action:'Open mental perf', actionSection:'mental-performance' },
          { id:'t-media',     priority:'medium',   category:'Media',    title:'Media request reviewed (2 pending)',                due:'Today',             description:'Willow Quarterly long-form + Cricket Digest podcast. Reply by Fri.',     action:'Open media hub',    actionSection:'media-hub' },
          { id:'t-sponsor',   priority:'low',      category:'Commercial',title:'Sponsor content approved (Pennine Mutual)',        due:'This week',         description:'Matchday social post + hospitality brief. Agent awaiting sign-off.',     action:'Open sponsorship',  actionSection:'sponsorship' },
        ]
        const PRIORITY_STYLES: Record<string,{ label:string; color:string; bg:string; dot:string }> = {
          critical: { label:'CRITICAL', color:C.red,   bg:C.redDim,   dot:C.red },
          high:     { label:'HIGH',     color:C.amber, bg:C.amberDim, dot:C.amber },
          medium:   { label:'MEDIUM',   color:C.teal,  bg:C.tealDim,  dot:C.teal },
          low:      { label:'LOW',      color:C.dim,   bg:'rgba(75,85,99,0.15)', dot:C.dim },
        }
        const remaining = CRICKET_TASKS.filter(t => !taskChecked[t.id]).length
        const done = Object.values(taskChecked).filter(Boolean).length
        return (
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: C.text }}>Daily Tasks</h3>
                <p className="text-[11px]" style={{ color: C.dim }}>{remaining} remaining · {done} done</p>
              </div>
            </div>
            {CRICKET_TASKS.map(t => {
              const checked = taskChecked[t.id] || false
              const ps = PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.medium
              return (
                <div key={t.id} className="rounded-xl p-4 flex items-start gap-4 border transition-all" style={{ backgroundColor: checked ? 'rgba(255,255,255,0.01)' : C.card, borderColor: t.priority === 'critical' && !checked ? `${C.red}55` : C.border, opacity: checked ? 0.55 : 1 }}>
                  <button onClick={() => setTaskChecked(m => ({ ...m, [t.id]: !checked }))} className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all" style={{ borderColor: checked ? C.green : C.dim, background: checked ? C.greenDim : 'transparent' }}>
                    {checked && <span className="text-[9px] font-bold" style={{ color: C.green }}>✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: ps.bg, color: ps.color }}>{ps.label}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: C.border, color: C.muted }}>{t.category}</span>
                      <span className="text-xs ml-auto" style={{ color: C.dim }}>{t.due}</span>
                    </div>
                    <h4 className="font-semibold text-sm" style={{ color: checked ? C.dim : C.text, textDecoration: checked ? 'line-through' : 'none' }}>{t.title}</h4>
                    {!checked && t.description && <p className="text-xs mt-1 leading-relaxed" style={{ color: C.muted }}>{t.description}</p>}
                  </div>
                  {!checked && t.action && t.actionSection && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={() => setPage(t.actionSection!)} className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{ backgroundColor: C.purple }}>{t.action} →</button>
                      <button onClick={() => setTaskChecked(m => ({ ...m, [t.id]: true }))} className="px-4 py-2 text-xs rounded-xl whitespace-nowrap" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: C.muted }}>Mark done</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* INSIGHTS TAB */}
      {dashTab === 'insights' && (
        <div className="pt-4 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label:'Championship Position', value:'2nd',      sub:'Division One',                color:C.purple, icon:'🏆' },
              { label:'Batting Avg (team)',    value:'38.4',     sub:'Season rank: 3rd',            color:C.teal,   icon:'🏏' },
              { label:'Bowling Avg (team)',    value:'24.7',     sub:'Season rank: 2nd',            color:C.green,  icon:'🎯' },
              { label:'Format Win Rate',       value:'72%',      sub:'All formats · last 8',        color:C.amber,  icon:'📈' },
              { label:'Form',                  value:'3W-1L-1D', sub:'Last 5 Championship matches', color:'#EC4899',icon:'🔥' },
            ].map((kpi, i) => (
              <div key={i} className="rounded-xl p-4 text-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                <div className="text-lg mb-1">{kpi.icon}</div>
                <div className="text-[10px] mb-0.5" style={{ color: C.dim }}>{kpi.label}</div>
                <div className="text-xl font-black" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="text-[10px] mt-0.5" style={{ color: C.muted }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { type:'ALERT',       icon:'⚠️', color:C.red,    bg:`${C.red}14`,    border:`${C.red}40`,    title:'DBS compliance: 4 staff overdue',           desc:'Winterbourne, Tremayne, Cavendish, Rao. Renewals required by end of month.',                                           action:'View compliance →',     section:'compliance' },
              { type:'OPPORTUNITY', icon:'💡', color:C.amber,  bg:`${C.amber}14`,  border:`${C.amber}40`,  title:'Pennine Mutual shirt sponsor renewal',       desc:'Proposal from agent Oakridge Sports — £340k/yr vs current £280k. Decision needed by end of month.',                      action:'View pipeline →',       section:'sponsorship' },
              { type:'TREND',       icon:'📈', color:C.green,  bg:`${C.green}14`,  border:`${C.green}40`,  title:'Bowling unit SR improving',                  desc:'Last 5 matches: 24.7 vs 27.1 season avg. Ridley + Fenwick partnership working on Division One pitches.',               action:'View bowling stats →',  section:'bowling-analytics' },
              { type:'ACHIEVEMENT', icon:'🏆', color:C.purple, bg:`${C.purple}14`, border:`${C.purple}40`, title:'Most Division One wickets in a week',        desc:'42 wickets across 2 matches. Club record since 2004. Analyst team pulling the breakdown for the board pack.',           action:'View match reports →',  section:'match-report' },
            ].map((tile, i) => (
              <div key={i} className="rounded-xl p-5" style={{ backgroundColor: tile.bg, border: `1px solid ${tile.border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{tile.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: tile.color }}>{tile.type}</span>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: C.text }}>{tile.title}</p>
                <p className="text-xs mb-3" style={{ color: C.muted }}>{tile.desc}</p>
                <button onClick={() => setPage(tile.section)} className="text-[11px] font-semibold transition-all" style={{ color: tile.color, background:'transparent', border:'none', cursor:'pointer', padding:0 }}>{tile.action}</button>
              </div>
            ))}
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C.dim }}>Key Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label:'Batting Avg (team)',    value:'38.4',  trend:'↑ 2.1',  trendColor:C.green },
                { label:'Bowling Avg (team)',    value:'24.7',  trend:'↓ 1.8',  trendColor:C.green },
                { label:'Strike Rate (bat)',     value:'62.3',  trend:'→ 0',    trendColor:C.dim },
                { label:'Economy Rate (bowl)',   value:'3.4',   trend:'↓ 0.2',  trendColor:C.green },
                { label:'Catches / Drops',       value:'42/6',  trend:'↑ 3',    trendColor:C.green },
                { label:'Boundary %',            value:'48%',   trend:'↑ 2%',   trendColor:C.green },
                { label:'Run Rate (first 15)',   value:'4.8',   trend:'↑ 0.3',  trendColor:C.green },
                { label:'Death-over Economy',    value:'7.1',   trend:'↓ 0.4',  trendColor:C.green },
              ].map((m, i) => (
                <div key={i} className="rounded-lg p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                  <div className="text-[10px] mb-1" style={{ color: C.dim }}>{m.label}</div>
                  <div className="text-lg font-black" style={{ color: C.text }}>{m.value}</div>
                  <div className="text-[10px] font-semibold" style={{ color: m.trendColor }}>{m.trend}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${C.purple}40` }}>
              <div className="flex items-center gap-2 px-5 py-4" style={{ backgroundColor: `${C.purple}14`, borderBottom: `1px solid ${C.purple}40` }}>
                <span className="text-sm">✨</span>
                <span className="text-sm font-bold" style={{ color: C.text }}>AI Department Intelligence — Summary</span>
              </div>
              <div className="p-5" style={{ backgroundColor: '#0f0e17' }}>
                <p className="text-xs leading-relaxed" style={{ color: C.text }}>
                  Oakridge go into the Championship opener with the best red-ball bowling average in the division after 5 matches — 24.7 is a club high since the 2004 title run. Batting depth is the question: Fairweather + Pennington + Endicott carrying the top order, middle order still a selection toss-up with Harrison in RTP phase 3. Dawson&apos;s A:C ratio 1.62 is the biggest workload flag and Friday's XI likely caps his spell length. Commercial side: Pennine Mutual renewal at £340k/yr is on the table and needs board sign-off before month end — that's the single biggest revenue lever live right now.
                </p>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${C.teal}40` }}>
              <div className="flex items-center gap-2 px-5 py-4" style={{ backgroundColor: `${C.teal}14`, borderBottom: `1px solid ${C.teal}40` }}>
                <span className="text-sm">📊</span>
                <span className="text-sm font-bold" style={{ color: C.text }}>Performance Intelligence</span>
              </div>
              <div className="p-5 space-y-3" style={{ backgroundColor: '#0f0e17' }}>
                {[
                  'Team batting avg trending up — 38.4 now vs 35.8 this time last year (+7%).',
                  'Bowling unit cohesion: Ridley + Fenwick partnership has 42 wickets at 18.6 across last 5 games.',
                  'Fielding alerts: 6 drops flagged in the review — 4 at slip. Recommend extra catching block Fri AM.',
                  'Fitness scores: 15/18 above threshold, 2 monitoring, 1 injured. Harrison RTP phase 3.',
                  'Opposition weakness: Lancs LH batters avg 18 vs left-arm spin last 12 months — Halden CCC and Talbot to exploit.',
                ].map((line, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: `${C.teal}33`, color: C.teal }}>{i + 1}</span>
                    <p className="text-xs leading-relaxed" style={{ color: C.text }}>{line}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DON'T MISS TAB */}
      {dashTab === 'dontmiss' && (() => {
        const DONT_MISS = [
          { id:'dm-1',  urgency:'URGENT', group:'Today',      urgencyColor:C.red,    urgencyBg:C.redDim,    category:'Entries',     deadline:'Today 17:00',  title:'T20 Blast squad submission',             desc:'ECB needs squad submitted by 17:00. Pending 2 signatures.',                                  consequence:'Forfeit of quarter-final entry.',                       action:'Manage entries →',  section:'vitality-blast' },
          { id:'dm-2',  urgency:'URGENT', group:'Today',      urgencyColor:C.red,    urgencyBg:C.redDim,    category:'Sponsor',     deadline:'Today 14:00',  title:'Sponsor content: Crownmark bat photo',   desc:'Photographer needs bat shot by 14:00 for contractual matchday post.',                        consequence:'Breach of sponsor obligation — penalty clause.',        action:'Open brief →',      section:'media' },
          { id:'dm-3',  urgency:'URGENT', group:'Today',      urgencyColor:C.red,    urgencyBg:C.redDim,    category:'Compliance',  deadline:'Today',        title:'DBS renewal: Winterbourne signature needed',desc:'Assistant Coach DBS-3 form outstanding. ECB compliance flag — blocks Thu academy session.', consequence:'Academy activity paused until renewed.',                action:'Open compliance →', section:'compliance' },
          { id:'dm-4',  urgency:'THIS WK',group:'This week',  urgencyColor:C.amber,  urgencyBg:C.amberDim,  category:'Selection',   deadline:'Wed 17:00',    title:'Team sheet deadline for Calderbrook CCC',      desc:'Friday XI + travel group. Head Coach sign-off pending.',                                    consequence:'Auto-submission of Wednesday draft XI.',                action:'Submit team sheet →',section:'squad' },
          { id:'dm-5',  urgency:'THIS WK',group:'This week',  urgencyColor:C.amber,  urgencyBg:C.amberDim,  category:'Media',       deadline:'Wed 14:00',    title:'Media availability: 14:00 press conference',desc:'Fairweather + Caldwell confirmed. Q-list approved, Northbridge + 4 nationals attending.',   consequence:'Loss of pre-match media window.',                        action:'Open media hub →',   section:'media-hub' },
          { id:'dm-6',  urgency:'THIS WK',group:'This week',  urgencyColor:C.amber,  urgencyBg:C.amberDim,  category:'Medical',     deadline:'Thu 10:00',    title:'Workload review meeting',                 desc:'Medical + Head Coach sign-off. Dawson + Harrison on the agenda.',                           consequence:'Workload caps default to conservative — loss of selection flexibility.', action:'Open workload →', section:'bowling-workload' },
          { id:'dm-7',  urgency:'30 APR', group:'Coming up',  urgencyColor:C.dim,    urgencyBg:'rgba(75,85,99,0.15)', category:'Compliance',deadline:'30 Apr',      title:'ECB Compliance quarterly audit',          desc:'CPA self-assessment submission + 3 outstanding welfare log entries.',                        consequence:'Audit flag on club profile for the following quarter.',  action:'Open compliance →', section:'compliance' },
          { id:'dm-8',  urgency:'5 MAY',  group:'Coming up',  urgencyColor:C.dim,    urgencyBg:'rgba(75,85,99,0.15)', category:'Commercial',deadline:'5 May',      title:'Sponsorship renewal decision',            desc:'Pennine Mutual £340k/yr or retain current £280k. Board decision required.',                  consequence:'Auto-renewal at current terms.',                         action:'View pipeline →',   section:'sponsorship' },
          { id:'dm-9',  urgency:'15 MAY', group:'Coming up',  urgencyColor:C.dim,    urgencyBg:'rgba(75,85,99,0.15)', category:'Overseas',  deadline:'15 May',     title:'Overseas player review',                  desc:'Steenkamp + Mason mid-season review. Visa renewals + performance window decisions.',         consequence:'Late slot changes cost 2–3 weeks of match availability.',action:'Open overseas →',   section:'overseas' },
          { id:'dm-10', urgency:'FRI',    group:'Fixtures',   urgencyColor:C.purple, urgencyBg:C.purpleDim, category:'Match',       deadline:'Fri 10:30',    title:'vs Calderbrook CCC — Oakridge Park',           desc:'Championship opener. Pitch verdict + selection announce 09:30.',                             consequence:'—',                                                     action:'Open match centre →',section:'match-centre' },
          { id:'dm-11', urgency:'SAT',    group:'Fixtures',   urgencyColor:C.purple, urgencyBg:C.purpleDim, category:'Match',       deadline:'Sat',          title:'vs Highford County — Away (T20 Blast)',            desc:'Travel Thursday PM. Overseas player rotation — Mason visa cleared.',                         consequence:'—',                                                     action:'Open match centre →',section:'match-centre' },
        ]
        const visible = DONT_MISS.filter(d => !dismissedAlerts.has(d.id))
        const groups = ['Today','This week','Coming up','Fixtures'] as const
        const grouped: Record<string, typeof visible> = {}
        for (const g of groups) grouped[g] = visible.filter(v => v.group === g)
        return (
          <div className="pt-4 space-y-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: C.text }}>Don&apos;t Miss</h3>
                <p className="text-[11px]" style={{ color: C.dim }}>{visible.length} items need attention</p>
              </div>
            </div>
            {visible.length === 0 ? (
              <div className="text-center py-12 rounded-xl" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                <div className="text-3xl mb-3">✅</div>
                <div className="text-sm font-semibold" style={{ color: C.text }}>All clear</div>
                <div className="text-xs" style={{ color: C.dim }}>No urgent items remaining. Check back later.</div>
              </div>
            ) : groups.map(g => grouped[g].length === 0 ? null : (
              <div key={g}>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: C.dim }}>{g === 'Today' ? '🚨 Today' : g === 'This week' ? '⚠️ This week' : g === 'Coming up' ? '📅 Coming up' : '🏆 Fixtures'}</h4>
                <div className="space-y-3">
                  {grouped[g].map(d => (
                    <div key={d.id} className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                      <div className="flex items-start gap-3">
                        <span className="text-[10px] px-2 py-1 rounded font-black flex-shrink-0 mt-0.5" style={{ background: d.urgencyBg, color: d.urgencyColor }}>{d.urgency}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: C.border, color: C.dim }}>{d.category}</span>
                            <span className="text-[10px]" style={{ color: C.dim }}>Due: {d.deadline}</span>
                          </div>
                          <p className="text-sm font-semibold mb-1" style={{ color: C.text }}>{d.title}</p>
                          <p className="text-xs mb-1" style={{ color: C.muted }}>{d.desc}</p>
                          {d.consequence !== '—' && <p className="text-[11px] italic mb-3" style={{ color: C.red }}>If missed: {d.consequence}</p>}
                          <div className="flex items-center gap-2">
                            <button onClick={() => setPage(d.section)} className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all" style={{ backgroundColor: C.purple, color: '#fff', border:'none', cursor:'pointer' }}>{d.action}</button>
                            <button onClick={() => setDismissedAlerts(s => { const n = new Set(s); n.add(d.id); return n })} className="text-[11px] px-3 py-1.5 rounded-lg transition-all" style={{ border: `1px solid ${C.border}`, color: C.muted, background:'transparent', cursor:'pointer' }}>Dismiss</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* TEAM TAB */}
      {dashTab === 'team' && (() => {
        type StaffMember = { name:string; role:string; dept:'Coaching'|'Medical'|'Analytics'|'Support'; initials:string; status:string; available:boolean; location:string; phone:string; speciality:string; focus:string }
        const TEAM_MEMBERS: StaffMember[] = [
          { name:'Marcus Caldwell',   role:'Head Coach',            dept:'Coaching',  initials:'MC', status:'Selection call 09:30 today',     available:true,  location:'Oakridge Park',    phone:'+44 7700 xxx xxx', speciality:'Tactical & selection',        focus:'Friday XI sign-off · Lancs prep' },
          { name:'Ashley Winterbourne',role:'Assistant Coach',       dept:'Coaching',  initials:'AW', status:'DBS renewal pending',            available:true,  location:'Oakridge Park',    phone:'+44 7700 xxx xxx', speciality:'Fielding & 2nd XI',           focus:'2nd XI promotion review' },
          { name:'Richard Cavendish', role:'Bowling Coach',          dept:'Coaching',  initials:'RC', status:'Video session 11:00',            available:true,  location:'Indoor Nets',      phone:'+44 7700 xxx xxx', speciality:'Seam & swing analysis',       focus:'Ridley + Fenwick partnership film' },
          { name:'Kunal Rao',         role:'Batting Coach',          dept:'Coaching',  initials:'KR', status:'Net session 10:30',              available:true,  location:'Main Nets',        phone:'+44 7700 xxx xxx', speciality:'Red-ball batting technique',  focus:'Top-order balance vs new-ball' },
          { name:'Ian Tremayne',      role:'Academy Director',       dept:'Coaching',  initials:'IT', status:'DBS expiring Jun',                available:false, location:'Academy — remote', phone:'+44 7700 xxx xxx', speciality:'Pathway development',         focus:'Noah Patel contract · Clarke debut' },
          { name:'Dr Nick Lawson',    role:'Club Doctor',            dept:'Medical',   initials:'NL', status:'Clinic 17:30 today',             available:true,  location:'Medical suite',    phone:'+44 7700 xxx xxx', speciality:'Sports medicine',              focus:'Rafiq + Cooper recovery window' },
          { name:'Kofi Oduya',        role:'Head Physio',            dept:'Medical',   initials:'KO', status:'Harrison RTP phase 3',           available:true,  location:'Medical suite',    phone:'+44 7700 xxx xxx', speciality:'Rehab & return-to-play',       focus:'Harrison RTP · Dawson workload' },
          { name:'Sarah Hollis',      role:'S&C Lead',               dept:'Medical',   initials:'SH', status:'Gym block 07:00',                available:true,  location:'S&C Suite',        phone:'+44 7700 xxx xxx', speciality:'Strength & bowling load',      focus:'Bowling A:C monitoring' },
          { name:'A. Patel',          role:'Head of Analysis',       dept:'Analytics', initials:'AP', status:'Opposition deck ready',          available:true,  location:'Analyst room',     phone:'+44 7700 xxx xxx', speciality:'Opposition scout + data',      focus:'Lancs LH batter match-ups' },
          { name:'R. Khan',           role:'Performance Analyst',    dept:'Analytics', initials:'RK', status:'Pitch profile report — Wed',     available:true,  location:'Analyst room',     phone:'+44 7700 xxx xxx', speciality:'Pitch + bounce modelling',     focus:'Oakridge Park 5y trend' },
          { name:'Sarah Hollis',      role:'Team Manager',           dept:'Support',   initials:'SH', status:'Travel brief 12:00',             available:true,  location:'Oakridge Park',    phone:'+44 7700 xxx xxx', speciality:'Operations & logistics',      focus:'Lancs travel + kit drop' },
          { name:'Phil Grant',        role:'Kit & Equipment',        dept:'Support',   initials:'PG', status:'DBS expired — renewal in progress',available:false,location:'Equipment store',  phone:'+44 7700 xxx xxx', speciality:'Match-day setup',              focus:'Crownmark ball reorder · 24 units' },
          { name:'Darren Ellesmere',  role:'Director of Cricket',    dept:'Support',   initials:'DE', status:'Board prep today',                available:true,  location:'Oakridge Park',    phone:'+44 7700 xxx xxx', speciality:'Strategy & board',             focus:'Pennine Mutual renewal briefing' },
        ]
        const byDept = (d: StaffMember['dept']) => TEAM_MEMBERS.filter(m => m.dept === d)
        const deptColor = (d: StaffMember['dept']) => d === 'Coaching' ? C.purple : d === 'Medical' ? C.red : d === 'Analytics' ? C.teal : C.amber
        return (
          <div className="pt-4 space-y-4">
            <div className="flex gap-1 border-b pb-0" style={{ borderColor: C.border, overflowX: 'hidden' }}>
              {([
                { id:'today' as const, label:'Team Today',  icon:'📍' },
                { id:'org'   as const, label:'Org Chart',   icon:'🏗️' },
                { id:'info'  as const, label:'Departments', icon:'📋' },
              ]).map(t => (
                <button key={t.id} onClick={() => setTeamSubTab(t.id)} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap"
                  style={{ borderBottomColor: teamSubTab === t.id ? C.purple : 'transparent', color: teamSubTab === t.id ? C.purple : C.dim, backgroundColor: teamSubTab === t.id ? `${C.purple}0d` : 'transparent' }}>
                  <span className="text-base">{t.icon}</span>{t.label}
                </button>
              ))}
            </div>

            {teamSubTab === 'today' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TEAM_MEMBERS.map((m, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${deptColor(m.dept)}20`, border: `1px solid ${deptColor(m.dept)}55`, color: deptColor(m.dept) }}>
                      {m.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: C.text }}>{m.name}</span>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.available ? C.green : C.dim }} />
                      </div>
                      <div className="text-[10px]" style={{ color: deptColor(m.dept) }}>{m.role}</div>
                      <div className="text-[10px] truncate" style={{ color: C.muted }}>{m.status}</div>
                      <div className="text-[10px]" style={{ color: C.dim }}>📍 {m.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {teamSubTab === 'org' && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="rounded-xl p-4 text-center" style={{ backgroundColor: C.card, border: `1px solid ${C.purple}55`, minWidth: 200 }}>
                    <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-sm font-bold mb-2" style={{ background: C.purpleDim, border: `2px solid ${C.purple}`, color: C.purple }}>DR</div>
                    <div className="text-sm font-semibold" style={{ color: C.text }}>Director</div>
                    <div className="text-[10px]" style={{ color: C.purple }}>Oakridge CC</div>
                  </div>
                </div>
                <div className="flex justify-center"><div className="w-px h-6" style={{ background: C.border }} /></div>
                {(['Coaching','Medical','Analytics','Support'] as const).map(dept => (
                  <div key={dept}>
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: deptColor(dept) }}>{dept}</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {byDept(dept).map((m, i) => (
                        <div key={i} className="rounded-xl p-3 text-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                          <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold mb-1.5" style={{ background: `${deptColor(dept)}20`, border: `1px solid ${deptColor(dept)}55`, color: deptColor(dept) }}>{m.initials}</div>
                          <div className="text-xs font-semibold" style={{ color: C.text }}>{m.name}</div>
                          <div className="text-[10px]" style={{ color: deptColor(dept) }}>{m.role}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {teamSubTab === 'info' && (
              <div className="space-y-4">
                {(['Coaching','Medical','Analytics','Support'] as const).map(dept => (
                  <div key={dept} className="rounded-xl p-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: deptColor(dept) }}>{dept}</span>
                      <span className="text-[10px]" style={{ color: C.dim }}>{byDept(dept).length} staff</span>
                    </div>
                    <div className="space-y-2">
                      {byDept(dept).map((m, i) => (
                        <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < byDept(dept).length - 1 ? `1px solid ${C.border}` : 'none' }}>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold" style={{ color: C.text }}>{m.name}</div>
                            <div className="text-[11px]" style={{ color: C.muted }}>{m.role} · <span style={{ color: C.dim }}>{m.speciality}</span></div>
                            <div className="text-[10px] mt-0.5" style={{ color: C.dim }}>Current focus: {m.focus}</div>
                          </div>
                          <div className="text-[10px] flex-shrink-0 ml-4" style={{ color: C.muted }}>{m.phone}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

        <CommandPalette T={T} accent={accent} open={cmdOpen} onClose={() => setCmdOpen(false)} onAskLumio={() => { setCmdOpen(false); setAskOpen(true) }} />
        <AskLumio       T={T} accent={accent} open={askOpen} onClose={() => setAskOpen(false)} />
        <FixtureDrawer  T={T} accent={accent} fixture={openFixture} onClose={() => setOpenFixture(null)} />
        <DashboardToast T={T} accent={accent} msg={dashToast} />
      </>
    )
  }


  const MatchCentre=()=>(
    <div>
      <SectionHead title="Match Centre" sub="Upcoming fixtures, recent results and match scorecards"/>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Upcoming Fixtures</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Date</Th><Th>Competition</Th><Th>Opponent</Th><Th>Venue</Th><Th>Format</Th></tr></thead>
          <tbody>
            {CRICKET_FIXTURES.map((f,i)=>(
              <tr key={f.id} style={{borderBottom:i<CRICKET_FIXTURES.length-1?`1px solid ${C.border}`:'none'}}>
                <Td color={C.text}>{f.date}</Td>
                <Td>{f.competition}</Td>
                <Td color={C.text}>{f.opponent} ({f.homeAway})</Td>
                <Td>{f.venue}</Td>
                <Td><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,background:C.purpleDim,color:C.purple}}>{f.format}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Recent Results</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Date</Th><Th>Competition</Th><Th>Opponent</Th><Th>Score</Th><Th>Opp</Th><Th>Result</Th></tr></thead>
          <tbody>
            {CRICKET_RESULTS.map((r,i)=>(
              <tr key={r.id} style={{borderBottom:i<CRICKET_RESULTS.length-1?`1px solid ${C.border}`:'none'}}>
                <Td>{r.date}</Td><Td>{r.competition}</Td><Td color={C.text}>{r.opponent} ({r.homeAway})</Td><Td>{r.score}</Td><Td>{r.oppScore}</Td>
                <Td><span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:resultColor(r.result)+'22',color:resultColor(r.result)}}>{r.result}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Scorecards</div>
        {CRICKET_RESULTS.slice(0,3).map(r=>(
          <div key={r.id} style={{borderBottom:`1px solid ${C.border}`,padding:'10px 0'}}>
            <button onClick={()=>setExpandedMatch(expandedMatch===r.id?null:r.id)} style={{width:'100%',background:'transparent',border:'none',color:C.text,display:'flex',justifyContent:'space-between',cursor:'pointer',padding:0}}>
              <span style={{fontSize:13,fontWeight:500}}>{r.date} · Oakridge v {r.opponent} — {r.score} vs {r.oppScore}</span>
              <span style={{fontSize:11,color:C.dim}}>{expandedMatch===r.id?'▲':'▼'}</span>
            </button>
            {expandedMatch===r.id&&(
              <div style={{marginTop:10,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div>
                  <div style={{fontSize:11,color:C.dim,marginBottom:6}}>BATTING</div>
                  {[{n:'Kingsley',r:82,b:136},{n:'Fairweather',r:124,b:142},{n:'Ashworth',r:46,b:78},{n:'Pennington',r:52,b:61}].map(b=>(
                    <div key={b.n} style={{display:'flex',justifyContent:'space-between',fontSize:12,color:C.muted,padding:'3px 0'}}>
                      <span>{b.n}</span><span>{b.r} ({b.b})</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{fontSize:11,color:C.dim,marginBottom:6}}>BOWLING</div>
                  {[{n:'Ridley',o:24,m:6,r:62,w:4},{n:'Fenwick',o:22,m:5,r:71,w:3},{n:'Westcombe',o:18,m:3,r:54,w:2},{n:'Holbrook',o:10,m:2,r:28,w:1}].map(b=>(
                    <div key={b.n} style={{display:'flex',justifyContent:'space-between',fontSize:12,color:C.muted,padding:'3px 0'}}>
                      <span>{b.n}</span><span>{b.o}-{b.m}-{b.r}-{b.w}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </Card>
    </div>
  );

  const BattingAnalytics=()=>{
    const fmts=['All','4-Day','T20','OD'];
    const batters=CRICKET_SQUAD.filter(p=>p.role==='Batter'||p.role==='Allrounder'||p.role==='WK').slice(0,8);
    const trend=[{m:'Oct',v:3.8},{m:'Nov',v:3.6},{m:'Dec',v:4.1},{m:'Jan',v:4.0},{m:'Feb',v:4.4},{m:'Mar',v:4.7}];
    return(
      <div>
        <SectionHead title="Batting Analytics" sub="Per-player batting stats, wagon wheels and run-rate trends"/>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {fmts.map(f=><Pill key={f} label={f} active={battingFmt===f} onClick={()=>setBattingFmt(f)}/>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
          <Stat label="Top Average" value="52.8" color={C.teal} sub="Harry Fairweather"/>
          <Stat label="Team Run Rate" value="4.7" color={C.purple} sub="Runs per over · last 10"/>
          <Stat label="100s this season" value="8" color={C.amber} sub="Fairweather 3 · Kingsley 2 · Ashworth 2 · Sedgwick 1"/>
        </div>
        <Card style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Batters — {battingFmt}</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Player</Th><Th>Role</Th><Th>Avg</Th><Th>SR</Th><Th>100s</Th><Th>50s</Th></tr></thead>
            <tbody>
              {batters.map((p,i)=>(
                <tr key={p.id} style={{borderBottom:i<batters.length-1?`1px solid ${C.border}`:'none'}}>
                  <Td color={C.text}>{p.name}</Td><Td>{p.role}</Td><Td color={C.teal}>{p.battingAvg.toFixed(1)}</Td>
                  <Td>{(p.battingAvg*1.4+40).toFixed(0)}</Td><Td>{Math.max(0,Math.floor(p.battingAvg/14))}</Td><Td>{Math.floor(p.battingAvg/6)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Run Rate — Last 6 Months</div>
            <svg viewBox="0 0 400 140" style={{width:'100%'}}>
              {trend.map((t,i)=>(
                <g key={i}>
                  <rect x={30+i*60} y={140-t.v*22} width="40" height={t.v*22} fill={C.teal} opacity="0.7" rx="3"/>
                  <text x={50+i*60} y={132-t.v*22} fontSize="10" fill={C.text} textAnchor="middle">{t.v}</text>
                  <text x={50+i*60} y={135} fontSize="10" fill={C.dim} textAnchor="middle">{t.m}</text>
                </g>
              ))}
            </svg>
          </Card>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Wagon Wheel</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              {[{z:'Off-Front',v:32},{z:'Off-Back',v:18},{z:'Leg-Front',v:28},{z:'Leg-Back',v:22}].map(w=>(
                <div key={w.z} style={{padding:10,background:C.cardAlt,borderRadius:6,textAlign:'center'}}>
                  <div style={{fontSize:10,color:C.dim}}>{w.z}</div>
                  <div style={{fontSize:20,fontWeight:600,color:C.teal}}>{w.v}%</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const BowlingAnalytics=()=>{
    const fmts=['All','4-Day','T20','OD'];
    const bowlers=CRICKET_SQUAD.filter(p=>p.bowlingAvg!==null);
    const econ=[26,28,24,29,25,27];
    return(
      <div>
        <SectionHead title="Bowling Analytics" sub="Per-player bowling stats, line & length matrix, economy trends"/>
        <div style={{display:'flex',gap:8,marginBottom:16}}>{fmts.map(f=><Pill key={f} label={f} active={bowlingFmt===f} onClick={()=>setBowlingFmt(f)}/>)}</div>
        <Card style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Bowlers — {bowlingFmt}</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Player</Th><Th>Role</Th><Th>Avg</Th><Th>SR</Th><Th>Econ</Th><Th>Wkts</Th></tr></thead>
            <tbody>
              {bowlers.map((p,i)=>(
                <tr key={p.id} style={{borderBottom:i<bowlers.length-1?`1px solid ${C.border}`:'none'}}>
                  <Td color={C.text}>{p.name}</Td><Td>{p.role}</Td><Td color={C.teal}>{p.bowlingAvg?.toFixed(1)}</Td>
                  <Td>{((p.bowlingAvg||0)*1.8).toFixed(0)}</Td><Td>{(3.2+(p.bowlingAvg||0)/30).toFixed(2)}</Td><Td>{Math.floor(80-(p.bowlingAvg||0))}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Line & Length Wkt%</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4}}>
              {[['Off-Short','18%'],['Middle-Short','12%'],['Leg-Short','8%'],['Off-Good','32%'],['Middle-Good','24%'],['Leg-Good','14%'],['Off-Full','11%'],['Middle-Full','18%'],['Leg-Full','6%']].map(([l,v],i)=>{
                const n=parseInt(v);
                return <div key={i} style={{padding:12,background:`rgba(20,184,166,${n/40})`,borderRadius:4,textAlign:'center'}}>
                  <div style={{fontSize:9,color:C.muted}}>{l}</div>
                  <div style={{fontSize:14,fontWeight:600,color:C.text}}>{v}</div>
                </div>;
              })}
            </div>
          </Card>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Economy — Last 6 matches</div>
            <svg viewBox="0 0 400 160" style={{width:'100%'}}>
              <polyline fill="none" stroke={C.teal} strokeWidth="2" points={econ.map((v,i)=>`${30+i*65},${160-v*4}`).join(' ')}/>
              {econ.map((v,i)=>(
                <g key={i}>
                  <circle cx={30+i*65} cy={160-v*4} r="4" fill={C.teal}/>
                  <text x={30+i*65} y={155-v*4} fontSize="10" fill={C.text} textAnchor="middle">{(v/10).toFixed(1)}</text>
                </g>
              ))}
            </svg>
          </Card>
        </div>
      </div>
    );
  };

  const VideoAnalysis=()=>{
    const filters=['All','Match Footage','Training','Opposition','Highlights'];
    const clips=videoFilter==='All'?CRICKET_VIDEO:CRICKET_VIDEO.filter(v=>v.type===videoFilter);
    return(
      <div>
        <SectionHead title="Video Analysis" sub="Match footage, training clips, opposition scouting and highlights"/>
        <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center'}}>
          {filters.map(f=><Pill key={f} label={f} active={videoFilter===f} onClick={()=>setVideoFilter(f)}/>)}
          <button style={{marginLeft:'auto',padding:'8px 16px',borderRadius:8,border:`1px solid ${C.teal}`,background:C.tealDim,color:C.teal,fontSize:12,cursor:'pointer'}}>+ Upload Footage</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:12}}>
          {clips.map(c=>(
            <Card key={c.id} style={{padding:0,overflow:'hidden'}}>
              <div style={{background:'linear-gradient(135deg,#0a1020,#1a2340)',height:130,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
                <div style={{fontSize:36,opacity:0.4}}>▶</div>
                <span style={{position:'absolute',bottom:8,right:8,padding:'2px 8px',background:'rgba(0,0,0,0.6)',borderRadius:4,fontSize:10,color:C.text}}>{c.dur}</span>
              </div>
              <div style={{padding:12}}>
                <div style={{fontSize:13,color:C.text,fontWeight:500,marginBottom:6}}>{c.title}</div>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  {c.tags.map(t=><span key={t} style={{fontSize:10,padding:'2px 6px',borderRadius:4,background:C.purpleDim,color:C.purple}}>#{t}</span>)}
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Card style={{background:C.purpleDim,borderColor:C.purple}}>
          <div style={{fontSize:13,color:C.purple}}>⚡ Coming soon: AI-powered auto-tagging for shots, spells, and phases of play.</div>
        </Card>
      </div>
    );
  };

  const LiveScores=()=>(
    <div>
      <SectionHead title="Live Scores" sub="Real-time scoring · CricViz integration · ball-by-ball commentary"/>
      <Card style={{marginBottom:12,background:'linear-gradient(90deg,#0f1629,#1a0f29)',borderColor:C.purple}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{fontSize:11,padding:'4px 10px',background:C.red,color:'white',borderRadius:20,fontWeight:600}}>LIVE</div>
          <div style={{fontSize:13,color:C.muted}}>Powered by CricViz · Lumio Ball Tracking data feed</div>
        </div>
      </Card>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,color:C.dim,marginBottom:8}}>COUNTY CHAMPIONSHIP · DAY 2 OF 4</div>
        <div style={{fontSize:16,fontWeight:600,color:C.text,marginBottom:10}}>Oakridge v Calderbrook CCC · Oakridge Park</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:16}}>
          <div>
            <div style={{fontSize:11,color:C.dim}}>OAKRIDGE — 1ST INNINGS</div>
            <div style={{fontSize:28,fontWeight:600,color:C.teal}}>342 <span style={{fontSize:14,color:C.muted}}>all out (98.2 ov)</span></div>
          </div>
          <div>
            <div style={{fontSize:11,color:C.dim}}>LANCASHIRE — 1ST INNINGS</div>
            <div style={{fontSize:28,fontWeight:600,color:C.purple}}>186/4 <span style={{fontSize:14,color:C.muted}}>(58.3 ov)</span></div>
          </div>
        </div>
        <div style={{fontSize:12,color:C.muted,marginBottom:6}}>CURRENT OVER</div>
        <div style={{display:'flex',gap:6}}>
          {['1','•','4','W','•','2'].map((b,i)=>{
            const isW=b==='W',isBoundary=b==='4'||b==='6';
            return <div key={i} style={{width:36,height:36,borderRadius:'50%',background:isW?C.red:isBoundary?C.teal:C.cardAlt,color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:600}}>{b}</div>;
          })}
        </div>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Batters At Crease</div>
          <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:13,color:C.text}}>K Sinclair *</span><span style={{fontSize:13,color:C.teal}}>78 (142)</span></div>
          <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0'}}><span style={{fontSize:13,color:C.text}}>J Bohannon</span><span style={{fontSize:13,color:C.teal}}>34 (52)</span></div>
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Connect CricViz</div>
          <p style={{fontSize:12,color:C.muted,marginBottom:10}}>Deeper metrics: expected runs, impact, bowler xA, spell quality.</p>
          <button style={{padding:'8px 14px',borderRadius:8,border:`1px solid ${C.purple}`,background:C.purpleDim,color:C.purple,fontSize:12,cursor:'pointer'}}>Configure API Key</button>
        </Card>
      </div>
    </div>
  );

  const PracticeLog=()=>{
    const sessions=[
      {id:1,date:'8 Apr',type:'Nets',duration:'2h',focus:'Spin vs seam',attendance:16},
      {id:2,date:'7 Apr',type:'S&C',duration:'1h 15m',focus:'Upper body',attendance:18},
      {id:3,date:'6 Apr',type:'Fielding',duration:'1h 30m',focus:'Slip catching',attendance:15},
      {id:4,date:'5 Apr',type:'Nets',duration:'2h 30m',focus:'Bounce practice',attendance:17},
      {id:5,date:'4 Apr',type:'Match sim',duration:'6h',focus:'4-day conditions',attendance:16},
    ];
    return(
      <div>
        <SectionHead title="Practice Log" sub="Session tracking, focus areas and attendance"/>
        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
          <button style={{padding:'8px 14px',borderRadius:8,border:`1px solid ${C.teal}`,background:C.tealDim,color:C.teal,fontSize:12,cursor:'pointer'}}>+ Add Session</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}>
          <Card>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Date</Th><Th>Type</Th><Th>Duration</Th><Th>Focus</Th><Th>Att.</Th></tr></thead>
              <tbody>
                {sessions.map((s,i)=>(
                  <tr key={s.id} style={{borderBottom:i<sessions.length-1?`1px solid ${C.border}`:'none'}}>
                    <Td color={C.text}>{s.date}</Td><Td><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,background:C.purpleDim,color:C.purple}}>{s.type}</span></Td>
                    <Td>{s.duration}</Td><Td>{s.focus}</Td><Td color={C.teal}>{s.attendance}/18</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Session Types</div>
            <svg viewBox="0 0 200 200" style={{width:'100%'}}>
              <circle cx="100" cy="100" r="70" fill="none" stroke={C.teal} strokeWidth="30" strokeDasharray="176 440"/>
              <circle cx="100" cy="100" r="70" fill="none" stroke={C.purple} strokeWidth="30" strokeDasharray="132 440" strokeDashoffset="-176"/>
              <circle cx="100" cy="100" r="70" fill="none" stroke={C.amber} strokeWidth="30" strokeDasharray="88 440" strokeDashoffset="-308"/>
              <circle cx="100" cy="100" r="70" fill="none" stroke={C.green} strokeWidth="30" strokeDasharray="44 440" strokeDashoffset="-396"/>
              <text x="100" y="105" textAnchor="middle" fill={C.text} fontSize="16" fontWeight="600">40 sessions</text>
            </svg>
            <div style={{fontSize:11,color:C.muted,display:'flex',flexDirection:'column',gap:4,marginTop:8}}>
              <div>● Nets 40% <span style={{color:C.teal}}>■</span></div>
              <div>● S&C 30% <span style={{color:C.purple}}>■</span></div>
              <div>● Fielding 20% <span style={{color:C.amber}}>■</span></div>
              <div>● Match sim 10% <span style={{color:C.green}}>■</span></div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const PerformanceStats=()=>{
    const player=CRICKET_SQUAD.find(p=>p.id===perfPlayer)||CRICKET_SQUAD[0];
    return(
      <div>
        <SectionHead title="Performance Stats" sub="Deep-dive player analytics, season totals and format comparison"/>
        <div style={{marginBottom:16}}>
          <select value={perfPlayer} onChange={e=>setPerfPlayer(Number(e.target.value))} style={{padding:'10px 14px',borderRadius:8,background:C.card,color:C.text,border:`1px solid ${C.border}`,fontSize:13,minWidth:260}}>
            {CRICKET_SQUAD.map(p=><option key={p.id} value={p.id}>{p.name} — {p.role}</option>)}
          </select>
        </div>
        <Card style={{marginBottom:12}}>
          <div style={{display:'flex',gap:16,alignItems:'center'}}>
            <div style={{width:72,height:72,borderRadius:'50%',background:C.purpleDim,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:600,color:C.purple}}>
              {player.name.split(' ').map(w=>w[0]).join('')}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:20,fontWeight:600,color:C.text}}>{player.name}</div>
              <div style={{fontSize:12,color:C.muted}}>{player.role} · {player.nationality} · Age {player.age}</div>
              <div style={{fontSize:11,color:C.dim,marginTop:4}}>Contract to {player.contractEnd} · Formats: {player.format}</div>
            </div>
            <StatusBadge st={player.fitness==='fit'?'fit':player.fitness==='monitoring'?'monitoring':'injury'}/>
          </div>
        </Card>
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          {(['Batting','Bowling','Fielding'] as const).map(t=><Pill key={t} label={t} active={perfTab===t} onClick={()=>setPerfTab(t)}/>)}
        </div>
        <Card style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>{perfTab} — Season 2026</div>
          {perfTab==='Batting'&&(
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>M</Th><Th>Inn</Th><Th>Runs</Th><Th>HS</Th><Th>Avg</Th><Th>SR</Th><Th>100s</Th><Th>50s</Th></tr></thead>
              <tbody><tr><Td>8</Td><Td>14</Td><Td color={C.teal}>{Math.floor(player.battingAvg*14)}</Td><Td>{Math.floor(player.battingAvg*3)}</Td><Td color={C.teal}>{player.battingAvg.toFixed(1)}</Td><Td>{(player.battingAvg*1.3+40).toFixed(0)}</Td><Td>{Math.floor(player.battingAvg/14)}</Td><Td>{Math.floor(player.battingAvg/8)}</Td></tr></tbody>
            </table>
          )}
          {perfTab==='Bowling'&&(
            player.bowlingAvg?
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>M</Th><Th>Ov</Th><Th>Wkts</Th><Th>BB</Th><Th>Avg</Th><Th>Econ</Th><Th>5WI</Th></tr></thead>
              <tbody><tr><Td>8</Td><Td>210</Td><Td color={C.teal}>{Math.floor(80-player.bowlingAvg)}</Td><Td>5/42</Td><Td color={C.teal}>{player.bowlingAvg.toFixed(1)}</Td><Td>{(3+player.bowlingAvg/30).toFixed(2)}</Td><Td>2</Td></tr></tbody>
            </table>
            :<div style={{fontSize:13,color:C.dim}}>Not a bowler.</div>
          )}
          {perfTab==='Fielding'&&(
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Catches</Th><Th>Stumpings</Th><Th>Run outs</Th><Th>Drops</Th></tr></thead>
              <tbody><tr><Td color={C.teal}>12</Td><Td>{player.role==='WK'?8:0}</Td><Td>3</Td><Td>1</Td></tr></tbody>
            </table>
          )}
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Format Comparison</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
            {['4-Day','T20','OD'].map(f=>(
              <div key={f} style={{padding:12,background:C.cardAlt,borderRadius:8}}>
                <div style={{fontSize:11,color:C.dim}}>{f}</div>
                <div style={{fontSize:22,fontWeight:600,color:C.teal}}>{(player.battingAvg*(f==='4-Day'?1.05:f==='T20'?0.68:0.92)).toFixed(1)}</div>
                <div style={{fontSize:10,color:C.muted}}>Average</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const CountyChampionship=()=>(
    <div>
      <SectionHead title="County Championship — Division One" sub="County Championship 2026 · CPA 2.0 compliance required"/>
      <Card style={{marginBottom:12,background:C.purpleDim,borderColor:C.purple}}>
        <div style={{fontSize:12,color:C.purple,fontWeight:600}}>CPA 2.0 · Minimum standards for Division One clubs — compliance check quarterly</div>
      </Card>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Division One Standings</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Team</Th><Th>P</Th><Th>W</Th><Th>D</Th><Th>L</Th><Th>Bonus</Th><Th>Pts</Th></tr></thead>
          <tbody>
            {CHAMPIONSHIP_TABLE.map((r,i)=>(
              <tr key={r.team} style={{borderBottom:i<CHAMPIONSHIP_TABLE.length-1?`1px solid ${C.border}`:'none',background:r.team==='Oakridge'?C.tealDim:'transparent'}}>
                <Td color={r.team==='Oakridge'?C.teal:C.text}>{i+1}. {r.team}</Td>
                <Td>{r.p}</Td><Td>{r.w}</Td><Td>{r.d}</Td><Td>{r.l}</Td><Td>{r.bonus}</Td><Td color={C.teal}>{r.pts}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Next 3 Fixtures</div>
          {CRICKET_FIXTURES.filter(f=>f.format==='4-day').slice(0,3).map((f,i,a)=>(
            <div key={f.id} style={{padding:'8px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none',fontSize:13}}>
              <span style={{color:C.text}}>{f.date}</span> · <span style={{color:C.muted}}>vs {f.opponent} ({f.homeAway})</span>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Promotion / Relegation</div>
          <div style={{fontSize:13,color:C.text,marginBottom:6}}>Gap to top: <span style={{color:C.teal}}>1 pt</span></div>
          <div style={{fontSize:13,color:C.text,marginBottom:6}}>Gap to safety: <span style={{color:C.green}}>+44 pts</span></div>
          <div style={{fontSize:12,color:C.muted,marginTop:8}}>2 up · 2 down format continues · Highford County & Oakridge currently on promotion-form pace.</div>
        </Card>
      </div>
    </div>
  );

  const VitalityBlast=()=>(
    <div>
      <SectionHead title="T20 Blast T20" sub="North Group · Road to Finals Day at Edgbaston"/>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>North Group</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Team</Th><Th>P</Th><Th>W</Th><Th>L</Th><Th>NRR</Th><Th>Pts</Th></tr></thead>
          <tbody>
            {BLAST_NORTH.map((t,i)=>(
              <tr key={t.team} style={{borderBottom:i<BLAST_NORTH.length-1?`1px solid ${C.border}`:'none',background:t.team==='Oakridge'?C.tealDim:'transparent'}}>
                <Td color={t.team==='Oakridge'?C.teal:C.text}>{i+1}. {t.team}</Td>
                <Td>{t.p}</Td><Td>{t.w}</Td><Td>{t.l}</Td><Td color={t.nrr>0?C.green:C.red}>{t.nrr>0?'+':''}{t.nrr.toFixed(2)}</Td><Td color={C.teal}>{t.pts}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:12}}>
        <Stat label="Team NRR" value="+0.88" color={C.green}/>
        <Stat label="Highest Score" value="214/4" color={C.purple} sub="vs Castleford CCC"/>
        <Stat label="Best Bowling" value="4/18" color={C.amber} sub="Sterling"/>
      </div>
      <Card>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Finals Day Countdown</div>
        <div style={{fontSize:30,fontWeight:600,color:C.teal}}>14 Sep · Edgbaston</div>
        <div style={{fontSize:12,color:C.muted,marginTop:4}}>Qualification scenario: top 4 from 9 advance to quarters. Oakridge projected 2nd in group on current pace.</div>
      </Card>
    </div>
  );

  const OneDayCup=()=>(
    <div>
      <SectionHead title="One Day Cup" sub="50-over competition · Group B"/>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Group B Standings</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Team</Th><Th>P</Th><Th>W</Th><Th>L</Th><Th>NRR</Th><Th>Pts</Th></tr></thead>
          <tbody>
            {[{t:'Oakridge',p:4,w:3,l:1,nrr:0.96,pts:6},{t:'Brackenfell CCC',p:4,w:3,l:1,nrr:0.42,pts:6},{t:'Stannerton County',p:4,w:2,l:2,nrr:0.1,pts:4},{t:'Castleford CCC',p:4,w:1,l:3,nrr:-0.6,pts:2},{t:'Leicestershire',p:4,w:1,l:3,nrr:-0.88,pts:2}].map((r,i,a)=>(
              <tr key={r.t} style={{borderBottom:i<a.length-1?`1px solid ${C.border}`:'none',background:r.t==='Oakridge'?C.tealDim:'transparent'}}>
                <Td color={r.t==='Oakridge'?C.teal:C.text}>{i+1}. {r.t}</Td><Td>{r.p}</Td><Td>{r.w}</Td><Td>{r.l}</Td><Td>{r.nrr.toFixed(2)}</Td><Td color={C.teal}>{r.pts}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>NRR Tracker</div>
          <div style={{fontSize:28,fontWeight:600,color:C.green}}>+0.96</div>
          <div style={{fontSize:11,color:C.muted,marginTop:4}}>Need to maintain above +0.42 to hold top spot on tiebreaker.</div>
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Next OD Cup Fixtures</div>
          {CRICKET_FIXTURES.filter(f=>f.format==='OD').map((f,i,a)=>(
            <div key={f.id} style={{padding:'6px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none',fontSize:12,color:C.muted}}>{f.date} · vs {f.opponent} ({f.homeAway})</div>
          ))}
        </Card>
      </div>
    </div>
  );

  const TheHundred=()=>(
    <div>
      <SectionHead title="The Hundred" sub="Franchise connection · Northern Superchargers · 2025 equity sale transition"/>
      <Card style={{marginBottom:12,background:C.purpleDim,borderColor:C.purple}}>
        <div style={{fontSize:13,color:C.purple,fontWeight:600,marginBottom:4}}>2025 Equity Sale Complete</div>
        <div style={{fontSize:12,color:C.muted}}>Oakridge's 49% retained stake in Northern Superchargers locks in annual revenue share of approx £5.2m/yr for 2026–2031.</div>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Northern Superchargers</div>
          <div style={{fontSize:18,color:C.text,marginBottom:6}}>Franchise partner · Oakridge Park home</div>
          <div style={{fontSize:12,color:C.muted}}>Joint operations: pitch, matchday, kit storage · Oakridge provides 3 facility staff on loan.</div>
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Revenue Share 2026</div>
          <div style={{fontSize:28,fontWeight:600,color:C.teal}}>£5.2m</div>
          <ProgressBar value={2.1} max={5.2} color={C.teal}/>
          <div style={{fontSize:11,color:C.muted,marginTop:6}}>£2.1m received to date · on track</div>
        </Card>
      </div>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Feeder Players</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {['Harry Fairweather','Jonny Pennington','Adam Kingsley','George Holbrook','Dawid Ashworth','Matthew Fenwick','Jack Sterling','Will Banister'].map(n=>(
            <div key={n} style={{padding:8,background:C.cardAlt,borderRadius:6,fontSize:12,color:C.text}}>{n}</div>
          ))}
        </div>
      </Card>
      <Card>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Draft Planning Tool</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:10}}>Pre-draft shortlist builder · performance overlays · salary cap simulator.</div>
        <button style={{padding:'8px 14px',borderRadius:8,border:`1px solid ${C.purple}`,background:C.purpleDim,color:C.purple,fontSize:12,cursor:'pointer'}}>Open Draft Planner →</button>
      </Card>
    </div>
  );

  const AcademyYouth=()=>(
    <div>
      <SectionHead title="Academy & Youth Pathway" sub="Oakridge Pathway · U10 through U21 · ECB-aligned talent ID"/>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Age Group Squads</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8}}>
          {[['U10',18],['U13',22],['U15',24],['U17',18],['U19',16],['U21',14]].map(([ag,n])=>(
            <div key={ag as string} style={{padding:14,background:C.cardAlt,borderRadius:8,textAlign:'center'}}>
              <div style={{fontSize:11,color:C.dim}}>{ag}</div>
              <div style={{fontSize:22,fontWeight:600,color:C.teal}}>{n}</div>
            </div>
          ))}
        </div>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12,marginBottom:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Pathway Players</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Name</Th><Th>Age</Th><Th>Stage</Th><Th>Dev Rating</Th><Th>Next Milestone</Th></tr></thead>
            <tbody>
              {[
                {n:'Noah Patel',a:20,s:'2nd XI',r:'A+',m:'Full contract'},
                {n:'Ethan Clarke',a:19,s:'2nd XI',r:'A',m:'1st XI debut'},
                {n:'Liam Foster',a:17,s:'U19 Scholar',r:'A-',m:'2nd XI contract'},
                {n:'Finn Cooper',a:21,s:'2nd XI',r:'B+',m:'Extension'},
                {n:'Jack Williams',a:18,s:'U19 Scholar',r:'B',m:'Renew scholarship'},
                {n:'Oliver Ravenhill',a:16,s:'U17',r:'A-',m:'U19 promotion'},
              ].map((p,i,a)=>(
                <tr key={p.n} style={{borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
                  <Td color={C.text}>{p.n}</Td><Td>{p.a}</Td><Td>{p.s}</Td><Td color={C.teal}>{p.r}</Td><Td>{p.m}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>ECBPA Compliance</div>
          <div style={{fontSize:28,fontWeight:600,color:C.green}}>96%</div>
          <ProgressBar value={96} max={100} color={C.green}/>
          <div style={{fontSize:11,color:C.muted,marginTop:8}}>Trial dates</div>
          <div style={{fontSize:12,color:C.text,marginTop:4}}>U13 · 20 Apr<br/>U15 · 27 Apr<br/>U17 · 3 May</div>
        </Card>
      </div>
      <Card>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Talent ID Pipeline — Flagged Players</div>
        {[
          {n:'Tyler Drew',age:14,club:'Bradford & Bingley',note:'Left-arm seam, 128 km/h at age 14'},
          {n:'Arjun Singh',age:15,club:'Sheffield Collegiate',note:'Leg-spin prodigy, U15 England trial'},
          {n:'Mo Hussain',age:13,club:'Manningham Mills',note:'Opening bat, hundred-maker'},
          {n:'Jake Murray',age:16,club:'Harrogate',note:'All-rounder, exceptional fielding'},
          {n:'Sam Roberts',age:15,club:'York CC',note:'Wicket-keeper, strong hands'},
        ].map((p,i,a)=>(
          <div key={p.n} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
            <div>
              <div style={{fontSize:13,color:C.text}}>{p.n} <span style={{fontSize:11,color:C.dim}}>· {p.age}y · {p.club}</span></div>
              <div style={{fontSize:11,color:C.muted}}>{p.note}</div>
            </div>
            <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:C.amberDim,color:C.amber,alignSelf:'center'}}>Flagged</span>
          </div>
        ))}
      </Card>
    </div>
  );

  const ContractHub=()=>{
    const expiringSoon=(e:string)=>e==='2026';
    return(
      <div>
        <SectionHead title="Contract Hub" sub="Player contracts, wage bill, renewal calendar"/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
          <Stat label="Wage Bill" value="£6.8m" color={C.teal} sub="Annual total"/>
          <Stat label="Expiring 2026" value="7" color={C.amber} sub="Renewal decisions due"/>
          <Stat label="Wage Cap Usage" value="89%" color={C.amber} sub="ECB CPA 2.0 cap"/>
        </div>
        <Card style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Player Contracts</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Player</Th><Th>Role</Th><Th>Contract to</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {CRICKET_SQUAD.map((p,i)=>(
                <tr key={p.id} style={{borderBottom:i<CRICKET_SQUAD.length-1?`1px solid ${C.border}`:'none',background:expiringSoon(p.contractEnd)?C.amberDim:'transparent'}}>
                  <Td color={C.text}>{p.name}</Td><Td>{p.role}</Td>
                  <Td color={expiringSoon(p.contractEnd)?C.amber:C.muted}>{p.contractEnd}</Td>
                  <Td>
                    <div style={{display:'flex',gap:4}}>
                      <button style={{padding:'3px 8px',borderRadius:4,fontSize:10,background:C.tealDim,color:C.teal,border:'none',cursor:'pointer'}}>Extend</button>
                      <button style={{padding:'3px 8px',borderRadius:4,fontSize:10,background:C.redDim,color:C.red,border:'none',cursor:'pointer'}}>Release</button>
                      <button style={{padding:'3px 8px',borderRadius:4,fontSize:10,background:C.purpleDim,color:C.purple,border:'none',cursor:'pointer'}}>Agent</button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Top Wages</div>
          {CRICKET_CONTRACTS.map((c,i)=>(
            <div key={c.player} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:i<CRICKET_CONTRACTS.length-1?`1px solid ${C.border}`:'none'}}>
              <div><span style={{fontSize:13,color:C.text}}>{c.player}</span><span style={{fontSize:10,color:C.dim,marginLeft:8}}>{c.type} · {c.agent}</span></div>
              <span style={{fontSize:13,color:C.teal,fontWeight:500}}>{fmt(c.wage)}</span>
            </div>
          ))}
        </Card>
        {/* AI Contract Renewal Summary */}
        <Card>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em'}}>🤖 AI Contract Renewal Summary</div>
            <button onClick={getContractAiSummary} disabled={contractAiLoading} style={{padding:'6px 14px',borderRadius:6,border:'none',background:contractAiLoading?C.cardAlt:C.purple,color:contractAiLoading?C.muted:'#fff',fontSize:11,fontWeight:700,cursor:contractAiLoading?'wait':'pointer'}}>
              {contractAiLoading?'Thinking…':'Generate Summary'}
            </button>
          </div>
          {contractAiError && <div style={{padding:10,background:C.redDim,border:`1px solid ${C.red}55`,borderRadius:6,fontSize:11,color:C.red}}>⚠ {contractAiError}</div>}
          {contractAiResult && !contractAiError && (
            <div>
              {contractAiResult.strategy_note && (
                <div style={{marginBottom:12,padding:12,borderLeft:`3px solid ${C.purple}`,background:C.purpleDim,borderRadius:4}}>
                  <div style={{fontSize:10,color:C.purple,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>Strategy Note</div>
                  <div style={{fontSize:12,color:C.text,lineHeight:1.6,fontStyle:'italic'}}>{contractAiResult.strategy_note}</div>
                </div>
              )}
              {contractAiResult.urgent.length > 0 && (
                <div>
                  <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Urgent Actions</div>
                  {contractAiResult.urgent.map((u, i) => {
                    const rec = (u.recommendation || '').toLowerCase();
                    const color = rec.includes('extend') || rec.includes('retain') ? C.green
                                : rec.includes('release') || rec.includes('decline') ? C.red
                                : rec.includes('renegoti') || rec.includes('monitor') ? C.amber
                                : C.teal;
                    return (
                      <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 0',borderBottom:i<contractAiResult.urgent.length-1?`1px solid ${C.border}`:'none'}}>
                        <div style={{flex:'0 0 140px'}}>
                          <div style={{fontSize:12,color:C.text,fontWeight:600}}>{u.player}</div>
                        </div>
                        <div style={{flex:'0 0 auto'}}>
                          <span style={{padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:`${color}22`,color,border:`1px solid ${color}55`,textTransform:'uppercase',letterSpacing:'0.04em'}}>{u.recommendation}</span>
                        </div>
                        <div style={{flex:1,fontSize:11,color:C.muted,lineHeight:1.5}}>{u.reason}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {!contractAiResult && !contractAiLoading && !contractAiError && (
            <div style={{fontSize:11,color:C.dim,fontStyle:'italic'}}>Click Generate Summary to get an AI-written renewal memo for the Board.</div>
          )}
        </Card>
      </div>
    );
  };

  const AgentPipeline=()=>(
    <div>
      <SectionHead title="Agent & Transfer Pipeline" sub="Target tracking, agent conversations, scouting pipeline"/>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:16,textTransform:'uppercase',letterSpacing:'0.05em'}}>Workflow</div>
        <div style={{display:'flex',gap:8}}>
          {['Configure','Research','Results','Action'].map((s,i)=>(
            <div key={s} style={{flex:1,padding:12,background:i===1?C.purpleDim:C.cardAlt,borderRadius:8,textAlign:'center',border:`1px solid ${i===1?C.purple:C.border}`}}>
              <div style={{fontSize:11,color:C.dim}}>Step {i+1}</div>
              <div style={{fontSize:13,color:i===1?C.purple:C.text,fontWeight:500}}>{s}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Transfer Targets</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Player</Th><Th>Current Club</Th><Th>Role</Th><Th>Agent</Th><Th>Status</Th><Th>Interest</Th></tr></thead>
          <tbody>
            {[
              {n:'Liam Hughson',c:'Easthaven CCC',r:'Allrounder',a:'Pinnacle Sports',s:'In talks',int:'High'},
              {n:'Tom Lawes',c:'Highford County',r:'Bowler',a:'SFX',s:'Initial contact',int:'Medium'},
              {n:'Ollie Pennfield',c:'Sussex',r:'Bowler',a:'Oakridge Sports',s:'Research',int:'High'},
              {n:'Jake Libby',c:'Worcs',r:'Batter',a:'AGI',s:'Dormant',int:'Low'},
              {n:'Sam Pennant',c:'Warwicks',r:'Batter',a:'Oakridge Sports',s:'In talks',int:'High'},
              {n:'Luke Tindale',c:'Calderbrook CCC',r:'Bowler',a:'Pinnacle',s:'Research',int:'Medium'},
            ].map((t,i,a)=>(
              <tr key={t.n} style={{borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
                <Td color={C.text}>{t.n}</Td><Td>{t.c}</Td><Td>{t.r}</Td><Td>{t.a}</Td><Td>{t.s}</Td>
                <Td><span style={{padding:'2px 10px',borderRadius:10,fontSize:10,background:t.int==='High'?C.greenDim:t.int==='Medium'?C.amberDim:C.border,color:t.int==='High'?C.green:t.int==='Medium'?C.amber:C.dim}}>{t.int}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );

  const FacilitiesGrounds=()=>(
    <div>
      <SectionHead title="Facilities & Grounds" sub="Oakridge Park main ground, nets, outgrounds and maintenance"/>
      <Card style={{marginBottom:12,background:'linear-gradient(90deg,#0f1629,#1a2340)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div style={{fontSize:11,color:C.dim}}>MAIN GROUND</div>
            <div style={{fontSize:20,fontWeight:600,color:C.text}}>Oakridge Park Cricket Ground</div>
            <div style={{fontSize:12,color:C.muted,marginTop:4}}>Oakridge Park · Home of Oakridge CC since 1890 · 18,500 capacity</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:11,color:C.dim}}>CAPACITY</div>
            <div style={{fontSize:24,fontWeight:600,color:C.teal}}>18,350</div>
          </div>
        </div>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Pitch Report Log</div>
          {[
            {d:'5 Apr',n:'Pitch 1',r:'Firm, dry — good batting surface'},
            {d:'3 Apr',n:'Pitch 2',r:'Slightly tacky — roll before play'},
            {d:'1 Apr',n:'Pitch 1',r:'Moisture present, will quicken'},
            {d:'29 Mar',n:'Pitch 3',r:'Spin day 3+ projected'},
            {d:'26 Mar',n:'Pitch 2',r:'Even bounce, good carry'},
          ].map((p,i,a)=>(
            <div key={i} style={{padding:'6px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none',fontSize:12,color:C.muted}}>
              <span style={{color:C.teal}}>{p.d}</span> · {p.n}: {p.r}
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Nets Bookings — Next 7 Days</div>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i)=>(
            <div key={d} style={{display:'flex',alignItems:'center',gap:10,padding:'5px 0'}}>
              <span style={{fontSize:11,color:C.dim,width:34}}>{d}</span>
              <div style={{flex:1,display:'flex',gap:3}}>
                {[0,1,2,3,4,5].map(b=><div key={b} style={{flex:1,height:18,background:(i+b)%3===0?C.tealDim:C.cardAlt,borderRadius:3}}/>)}
              </div>
            </div>
          ))}
        </Card>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Maintenance — Open</div>
          {[
            {i:'Sightscreen south — motor replacement',s:'In progress'},
            {i:'Main Stand roof leak',s:'Scheduled'},
            {i:'Outdoor nets lane 3&4 — reseeding',s:'In progress'},
          ].map((m,i,a)=>(
            <div key={i} style={{padding:'6px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none',display:'flex',justifyContent:'space-between'}}>
              <span style={{fontSize:12,color:C.muted}}>{m.i}</span>
              <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:C.amberDim,color:C.amber}}>{m.s}</span>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Outgrounds</div>
          {CRICKET_OUTGROUNDS.map((g,i)=>(
            <div key={g.name} style={{padding:'7px 0',borderBottom:i<CRICKET_OUTGROUNDS.length-1?`1px solid ${C.border}`:'none'}}>
              <div style={{fontSize:12,color:C.text}}>{g.name}</div>
              <div style={{fontSize:10,color:C.dim}}>Cap: {g.cap.toLocaleString()} · {g.use}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );

  const KitEquipment=()=>(
    <div>
      <SectionHead title="Kit & Equipment" sub="Inventory, allocations, supplier contracts"/>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12,marginBottom:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Inventory</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Item</Th><Th>Supplier</Th><Th>Stock</Th><Th>Status</Th></tr></thead>
            <tbody>
              {[
                {i:'Match bats (Gray-Nicolls)',s:'Gray-Nicolls',st:24,status:'ok'},
                {i:'Training bats',s:'Gunn & Moore',st:38,status:'ok'},
                {i:'Whites (XL)',s:'Apex Performance',st:6,status:'low'},
                {i:'Pads, batting',s:'Masuri',st:22,status:'ok'},
                {i:'Pads, wicket-keeping',s:'Masuri',st:4,status:'ok'},
                {i:'Helmets',s:'Masuri',st:18,status:'ok'},
                {i:'Red match balls',s:'Crownmark',st:3,status:'reorder'},
                {i:'White Kookaburra',s:'Kookaburra',st:12,status:'ok'},
              ].map((k,i,a)=>(
                <tr key={k.i} style={{borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
                  <Td color={C.text}>{k.i}</Td><Td>{k.s}</Td><Td>{k.st}</Td>
                  <Td><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,background:k.status==='ok'?C.greenDim:k.status==='low'?C.amberDim:C.redDim,color:k.status==='ok'?C.green:k.status==='low'?C.amber:C.red}}>{k.status}</span></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Supplier Contracts</div>
            {[{s:'Apex Performance',val:180000,e:'Dec 2027'},{s:'Gray-Nicolls',val:65000,e:'Sep 2026'},{s:'Masuri',val:28000,e:'Mar 2027'}].map((c,i,a)=>(
              <div key={c.s} style={{padding:'6px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
                <div style={{fontSize:12,color:C.text}}>{c.s}</div>
                <div style={{fontSize:10,color:C.dim}}>{fmt(c.val)} · exp {c.e}</div>
              </div>
            ))}
          </Card>
          <Card style={{background:C.amberDim,borderColor:C.amber}}>
            <div style={{fontSize:12,color:C.amber,fontWeight:600,marginBottom:6}}>⚠ Reorder Alerts</div>
            <div style={{fontSize:11,color:C.muted}}>Red match balls &lt; 6 unit threshold — reorder 24 today</div>
            <div style={{fontSize:11,color:C.muted}}>Whites XL &lt; 10 unit threshold — reorder 12</div>
          </Card>
        </div>
      </div>
    </div>
  );

  const TravelLogistics=()=>(
    <div>
      <SectionHead title="Travel & Logistics" sub="Away trips, coach bookings, mileage tracker"/>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Upcoming Trips</div>
        {CRICKET_TRIPS.map((t,i)=>(
          <div key={t.id} style={{borderBottom:i<CRICKET_TRIPS.length-1?`1px solid ${C.border}`:'none',padding:'10px 0'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:13,color:C.text,fontWeight:500}}>{t.dest}</div>
                <div style={{fontSize:11,color:C.dim}}>{t.date} · {t.nights} nights · {t.transport}</div>
              </div>
              <div style={{fontSize:14,color:C.teal,fontWeight:600}}>{fmt(t.budget)}</div>
            </div>
          </div>
        ))}
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Travel Budget</div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontSize:13,color:C.muted}}>Used · {fmt(62900)}</span>
            <span style={{fontSize:13,color:C.muted}}>of {fmt(185000)}</span>
          </div>
          <ProgressBar value={62900} max={185000} color={C.teal}/>
          <div style={{fontSize:11,color:C.green,marginTop:6}}>✓ 34% used · on track for season</div>
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Mileage Reimbursement</div>
          <div style={{fontSize:22,fontWeight:600,color:C.purple}}>£4,820</div>
          <div style={{fontSize:11,color:C.muted,marginTop:4}}>Across 14 staff · March 2026</div>
          <button style={{marginTop:10,padding:'7px 14px',borderRadius:8,border:`1px solid ${C.purple}`,background:C.purpleDim,color:C.purple,fontSize:12,cursor:'pointer'}}>Export Report</button>
        </Card>
      </div>
    </div>
  );

  const TeamComms=()=>(
    <div>
      <SectionHead title="Team Communications" sub="Announcements, channels and pre-match briefs"/>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12,marginBottom:12}}>
        <Card>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em'}}>Feed</div>
            <button style={{padding:'7px 14px',borderRadius:8,border:`1px solid ${C.teal}`,background:C.tealDim,color:C.teal,fontSize:12,cursor:'pointer'}}>+ Compose</button>
          </div>
          {CRICKET_COMMS.map((c,i)=>(
            <div key={c.id} style={{padding:'10px 0',borderBottom:i<CRICKET_COMMS.length-1?`1px solid ${C.border}`:'none'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <div style={{width:26,height:26,borderRadius:'50%',background:C.purpleDim,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:600,color:C.purple}}>{c.author.split(' ').map(w=>w[0]).join('')}</div>
                <span style={{fontSize:12,color:C.text,fontWeight:500}}>{c.author}</span>
                <span style={{fontSize:10,color:C.dim}}>{c.role} · {c.time}</span>
              </div>
              <div style={{fontSize:12,color:C.muted,paddingLeft:34}}>{c.msg}</div>
            </div>
          ))}
        </Card>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Channels</div>
            {[{n:'WhatsApp — 1st XI',c:C.green},{n:'Email — Staff',c:C.purple},{n:'Slack — Pathway',c:C.teal},{n:'WhatsApp — 2nd XI',c:C.green}].map(ch=>(
              <div key={ch.n} style={{padding:'6px 0',display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:ch.c}}/>
                <span style={{fontSize:12,color:C.muted}}>{ch.n}</span>
              </div>
            ))}
          </Card>
          <Card style={{background:C.purpleDim,borderColor:C.purple}}>
            <div style={{fontSize:11,color:C.purple,fontWeight:600}}>SCHEDULED</div>
            <div style={{fontSize:13,color:C.text,marginTop:4}}>Saturday pre-match brief</div>
            <div style={{fontSize:11,color:C.muted,marginTop:4}}>Auto-send 06:00 Sat 11 Apr · all squad channels</div>
          </Card>
        </div>
      </div>
    </div>
  );

  const SponsorshipPipeline=()=>(
    <div>
      <SectionHead title="Sponsorship Pipeline" sub="Active deals, renewals, prospects and revenue tracking"/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
        <Stat label="Active Revenue" value={fmt(215000)} color={C.teal} sub="Annual run-rate"/>
        <Stat label="Target" value={fmt(300000)} color={C.purple} sub="2026 season"/>
        <Stat label="Prospects Value" value={fmt(50000)} color={C.amber} sub="2 in conversation"/>
      </div>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Revenue vs Target</div>
        <ProgressBar value={215000} max={300000} color={C.teal}/>
        <div style={{fontSize:11,color:C.muted,marginTop:6}}>72% of target · £85k gap to close</div>
      </Card>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Deals</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Sponsor</Th><Th>Type</Th><Th>Value</Th><Th>Deliverables</Th><Th>Status</Th></tr></thead>
          <tbody>
            {SPONSORS.map((s,i)=>(
              <tr key={s.n} style={{borderBottom:i<SPONSORS.length-1?`1px solid ${C.border}`:'none'}}>
                <Td color={C.text}>{s.n}</Td><Td>{s.type}</Td><Td color={C.teal}>{fmt(s.val)}</Td><Td>{s.act}% done</Td>
                <Td><StatusBadge st={s.st}/></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Prospects</div>
        <div style={{fontSize:12,color:C.muted,padding:'6px 0'}}>• Pennine Mutual — Headline partner exploratory · £120k</div>
        <div style={{fontSize:12,color:C.muted,padding:'6px 0'}}>• Oakridge Park United — cross-city partnership · £30k trial</div>
      </Card>
    </div>
  );

  const MediaContent=()=>(
    <div>
      <SectionHead title="Media & Content" sub="Social, broadcast, content calendar, press"/>
      <Card style={{marginBottom:16,borderColor:C.purpleDim,background:C.cardAlt}}>
        <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:12}}>🎙️ AI Press Conference Briefing Generator</div>
        <div style={{display:'grid',gap:8,marginBottom:10}}>
          <div>
            <div style={{fontSize:10,textTransform:'uppercase',color:C.muted,marginBottom:3}}>Recent Result</div>
            <input value={pcRecent} onChange={e=>setPcRecent(e.target.value)} style={{width:'100%',background:'#0b1020',border:`1px solid ${C.border}`,borderRadius:6,padding:'7px 10px',color:C.text,fontSize:12}}/>
          </div>
          <div>
            <div style={{fontSize:10,textTransform:'uppercase',color:C.muted,marginBottom:3}}>Upcoming Match</div>
            <input value={pcUpcoming} onChange={e=>setPcUpcoming(e.target.value)} style={{width:'100%',background:'#0b1020',border:`1px solid ${C.border}`,borderRadius:6,padding:'7px 10px',color:C.text,fontSize:12}}/>
          </div>
          <div>
            <div style={{fontSize:10,textTransform:'uppercase',color:C.muted,marginBottom:3}}>Key Team News</div>
            <input value={pcNews} onChange={e=>setPcNews(e.target.value)} style={{width:'100%',background:'#0b1020',border:`1px solid ${C.border}`,borderRadius:6,padding:'7px 10px',color:C.text,fontSize:12}}/>
          </div>
        </div>
        <button onClick={generatePressConference} disabled={pcLoading} style={{background:C.purple,color:'#fff',border:'none',borderRadius:6,padding:'8px 14px',fontSize:12,fontWeight:600,cursor:pcLoading?'wait':'pointer',opacity:pcLoading?0.6:1}}>{pcLoading?'Generating…':'Generate Briefing'}</button>
        {pcError && <div style={{fontSize:11,color:C.red,marginTop:8}}>⚠ {pcError}</div>}
        {pcLoading && <div style={{marginTop:12,display:'grid',gap:6}}>{[0,1,2,3,4].map(i=><div key={i} style={{height:32,background:'#0b1020',borderRadius:4,opacity:0.5}}/>)}</div>}
        {pcResult && (
          <div style={{marginTop:14,display:'grid',gap:6}}>
            {pcResult.questions.map((qa,i)=>(
              <div key={i} style={{border:`1px solid ${C.border}`,borderRadius:6,overflow:'hidden'}}>
                <button onClick={()=>setPcOpen(pcOpen===i?null:i)} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'transparent',border:'none',cursor:'pointer',textAlign:'left'}}>
                  <div style={{width:22,height:22,borderRadius:'50%',background:C.purple,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1,fontSize:12,fontWeight:600,color:C.text}}>{qa.q}</div>
                  <div style={{color:C.muted,fontSize:12}}>{pcOpen===i?'▾':'▸'}</div>
                </button>
                {pcOpen===i && <div style={{padding:'0 12px 12px 44px',fontSize:12,color:C.muted,lineHeight:1.6}}>{qa.a}</div>}
              </div>
            ))}
          </div>
        )}
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        <Stat label="X / Twitter" value="214k" color={C.blue} sub="+1.2% this week"/>
        <Stat label="Instagram" value="168k" color={C.pink} sub="+2.8% this week"/>
        <Stat label="Facebook" value="92k" color={C.blue} sub="+0.4% this week"/>
        <Stat label="Engagement" value="4.8%" color={C.teal} sub="Above sector avg"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12,marginBottom:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Content Calendar</div>
          {[
            {d:'Thu 9 Apr',c:'Squad reveal video — Lancs opener'},
            {d:'Fri 11 Apr',c:'Matchday live thread + in-play clips'},
            {d:'Sat 12 Apr',c:'Fairweather feature longform'},
            {d:'Sun 13 Apr',c:'Women\'s match preview'},
            {d:'Mon 14 Apr',c:'Ridley training diary'},
          ].map((p,i,a)=>(
            <div key={i} style={{display:'flex',gap:10,padding:'7px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
              <span style={{fontSize:11,color:C.purple,width:80,fontWeight:500}}>{p.d}</span>
              <span style={{fontSize:12,color:C.muted}}>{p.c}</span>
            </div>
          ))}
        </Card>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Press Enquiries</div>
            <div style={{fontSize:12,color:C.muted,padding:'5px 0'}}>• Willow Quarterly — Fairweather profile</div>
            <div style={{fontSize:12,color:C.muted,padding:'5px 0'}}>• Oakridge Chronicle — Caldwell Q&A</div>
          </Card>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Broadcast</div>
            <div style={{fontSize:12,color:C.muted}}>Northbridge Sport · Lancs (H) · Day 1 live</div>
            <div style={{fontSize:12,color:C.muted}}>Crown Broadcasting Radio · all home matches</div>
          </Card>
        </div>
      </div>
    </div>
  );

  const TicketMatchDay=()=>(
    <div>
      <SectionHead title="Ticket & Match Day" sub="Ticket sales, gate revenue, matchday operations"/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Season Tickets</div>
          <div style={{fontSize:28,fontWeight:600,color:C.teal}}>6,240 <span style={{fontSize:14,color:C.muted}}>/ 7,500</span></div>
          <ProgressBar value={6240} max={7500} color={C.teal}/>
          <div style={{fontSize:11,color:C.green,marginTop:6}}>83% of cap · +8% YoY</div>
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Friday vs Calderbrook CCC</div>
          <div style={{fontSize:16,color:C.text}}>Projected attendance: <span style={{color:C.teal,fontWeight:600}}>17,280</span></div>
          <div style={{fontSize:12,color:C.muted,marginTop:4}}>94% of capacity · Main Stand full</div>
          <div style={{fontSize:12,color:C.muted,marginTop:8}}>Gate revenue forecast: <span style={{color:C.green,fontWeight:600}}>{fmt(268000)}</span></div>
        </Card>
      </div>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Matchday Ops Checklist</div>
        {[
          {t:'Turnstile staff briefed',d:true},
          {t:'Big screen content loaded',d:true},
          {t:'PA announcements scheduled',d:false},
          {t:'Food & beverage stock confirmed',d:true},
          {t:'Stewarding plan approved',d:false},
        ].map((c,i,a)=>(
          <div key={i} style={{padding:'6px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none',display:'flex',alignItems:'center',gap:10}}>
            <span style={{color:c.d?C.green:C.dim,fontSize:16}}>{c.d?'✓':'○'}</span>
            <span style={{fontSize:13,color:c.d?C.muted:C.text}}>{c.t}</span>
          </div>
        ))}
      </Card>
      <Card style={{background:C.greenDim,borderColor:C.green}}>
        <div style={{fontSize:13,color:C.green,fontWeight:600,marginBottom:4}}>♿ Changing Places Facilities</div>
        <div style={{fontSize:12,color:C.muted}}>Accessible viewing: 120 spaces · Changing Places toilet located at North Stand · ECB Accessibility Guide compliant.</div>
      </Card>
    </div>
  );

  const EDIDashboard=()=>(
    <div>
      <SectionHead title="EDI Dashboard" sub="Equality, Diversity & Inclusion · ICEC report compliance"/>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>ICEC Compliance</div>
        <ProgressBar value={78} max={100} color={C.amber}/>
        <div style={{fontSize:12,color:C.amber,marginTop:6}}>78% — 7 of 44 ICEC recommendations remain open</div>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Staff Diversity — Gender</div>
          {[{l:'Male',v:62,c:C.teal},{l:'Female',v:36,c:C.purple},{l:'Prefer not to say',v:2,c:C.dim}].map(g=>(
            <div key={g.l} style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.muted,marginBottom:4}}><span>{g.l}</span><span>{g.v}%</span></div>
              <ProgressBar value={g.v} max={100} color={g.c}/>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Staff Diversity — Ethnicity</div>
          {[{l:'White British',v:71,c:C.teal},{l:'South Asian',v:14,c:C.purple},{l:'Black',v:6,c:C.amber},{l:'Other',v:9,c:C.green}].map(g=>(
            <div key={g.l} style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.muted,marginBottom:4}}><span>{g.l}</span><span>{g.v}%</span></div>
              <ProgressBar value={g.v} max={100} color={g.c}/>
            </div>
          ))}
        </Card>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>ECB EDI Deadlines</div>
          {[{d:'30 Apr',t:'Annual EDI return',s:'Due'},{d:'31 May',t:'Staff training completion',s:'On track'},{d:'30 Jun',t:'Board diversity report',s:'Draft ready'}].map((d,i,a)=>(
            <div key={i} style={{padding:'7px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none',display:'flex',justifyContent:'space-between'}}>
              <span style={{fontSize:12,color:C.text}}>{d.d} · {d.t}</span>
              <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:C.amberDim,color:C.amber}}>{d.s}</span>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Anti-Discrimination Unit</div>
          <div style={{fontSize:12,color:C.muted}}>ECB Anti-Discrimination Unit</div>
          <div style={{fontSize:11,color:C.dim,marginTop:4}}>adu@ecb.co.uk · 020 7432 1200</div>
        </Card>
      </div>
      <Card style={{marginTop:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>South Asian Engagement Programme</div>
        <ProgressBar value={64} max={100} color={C.purple}/>
        <div style={{fontSize:11,color:C.muted,marginTop:6}}>64% of year 1 targets met · 8 community clubs partnered · 240 participants recruited into pathway.</div>
      </Card>
    </div>
  );

  const SafeguardingView=()=>(
    <div>
      <SectionHead title="Safeguarding" sub="DBS checks, safeguarding leads, policy reviews"/>
      <Card style={{marginBottom:12,background:C.greenDim,borderColor:C.green}}>
        <div style={{fontSize:14,color:C.green,fontWeight:600}}>✓ 0 open safeguarding concerns</div>
      </Card>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>DBS Checks — All Staff</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Name</Th><Th>Role</Th><Th>Dept</Th><Th>Expiry</Th><Th>Status</Th></tr></thead>
          <tbody>
            {CRICKET_STAFF_EXT.map((s,i)=>(
              <tr key={s.id} style={{borderBottom:i<CRICKET_STAFF_EXT.length-1?`1px solid ${C.border}`:'none',background:s.dbs==='expired'?C.redDim:s.dbs==='expiring'?C.amberDim:'transparent'}}>
                <Td color={C.text}>{s.name}</Td><Td>{s.role}</Td><Td>{s.department}</Td>
                <Td color={s.dbs==='expired'?C.red:s.dbs==='expiring'?C.amber:C.muted}>{s.dbsExpiry}</Td>
                <Td><StatusBadge st={s.dbs}/></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Safeguarding Lead</div>
          <div style={{fontSize:14,color:C.text,fontWeight:500}}>Sarah Hollis</div>
          <div style={{fontSize:12,color:C.muted}}>Designated Safeguarding Officer</div>
          <div style={{fontSize:11,color:C.dim,marginTop:4}}>safeguarding@yorkshireccc.com · Direct: 0113 203 3580</div>
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Policy Reviews</div>
          {[{p:'Safeguarding Policy',d:'Mar 2027'},{p:'Whistleblowing',d:'Sep 2026'},{p:'Code of Conduct',d:'Jan 2027'}].map((p,i,a)=>(
            <div key={p.p} style={{padding:'5px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none',display:'flex',justifyContent:'space-between',fontSize:12}}>
              <span style={{color:C.muted}}>{p.p}</span><span style={{color:C.dim}}>{p.d}</span>
            </div>
          ))}
        </Card>
      </div>
      <Card style={{marginTop:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>ECB Safeguarding Code Checklist</div>
        {['Designated Safeguarding Officer in post','Annual safeguarding training complete','DBS policy published','Whistleblowing policy current','Incident reporting log up to date','Parent/guardian consent forms on file'].map(item=>(
          <div key={item} style={{padding:'5px 0',display:'flex',gap:8,fontSize:12,color:C.muted}}>
            <span style={{color:C.green}}>✓</span>{item}
          </div>
        ))}
      </Card>
    </div>
  );

  const FinanceView=()=>(
    <div>
      <SectionHead title="Finance" sub="Revenue streams, wage bill, grants and budgets"/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        <Stat label="Annual Turnover" value="£24.8m" color={C.teal}/>
        <Stat label="Wage Bill %" value="61%" color={C.amber} sub="of turnover"/>
        <Stat label="Net Position" value="+£1.2m" color={C.green}/>
        <Stat label="CPA Funding" value="£4.6m" color={C.purple} sub="Received 2026"/>
      </div>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Revenue Streams</div>
        <svg viewBox="0 0 500 180" style={{width:'100%'}}>
          {[{l:'ECB/CPA',v:4.6,c:C.purple},{l:'The Hundred',v:5.2,c:C.teal},{l:'Ticketing',v:6.1,c:C.amber},{l:'Sponsorship',v:3.4,c:C.green},{l:'Hospitality',v:3.8,c:C.blue},{l:'Other',v:1.7,c:C.pink}].map((r,i)=>(
            <g key={r.l}>
              <rect x={20+i*78} y={180-r.v*22} width="60" height={r.v*22} fill={r.c} rx="3"/>
              <text x={50+i*78} y={170-r.v*22} fontSize="11" fill={C.text} textAnchor="middle">£{r.v}m</text>
              <text x={50+i*78} y={175} fontSize="10" fill={C.dim} textAnchor="middle">{r.l}</text>
            </g>
          ))}
        </svg>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Outstanding Invoices</div>
          {[{c:'Midlands Bank',v:60000,d:'Q1 activation'},{c:'Apex Construction',v:22500,d:'Quarterly'},{c:'Northbridge Sport',v:18000,d:'Filming access'}].map((inv,i,a)=>(
            <div key={inv.c} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
              <div><div style={{fontSize:12,color:C.text}}>{inv.c}</div><div style={{fontSize:10,color:C.dim}}>{inv.d}</div></div>
              <div style={{fontSize:13,color:C.amber,fontWeight:500}}>{fmt(inv.v)}</div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Grant Applications</div>
          <div style={{padding:'7px 0',borderBottom:`1px solid ${C.border}`,fontSize:12}}>
            <div style={{color:C.text}}>Sport England Capital Fund</div>
            <div style={{color:C.dim}}>£400k · Under review</div>
          </div>
          <div style={{padding:'7px 0',fontSize:12}}>
            <div style={{color:C.text}}>ECB Facilities Grant</div>
            <div style={{color:C.dim}}>£180k · Submitted</div>
          </div>
        </Card>
      </div>
      <Card style={{marginTop:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Annual Budget Progress</div>
        {[{l:'Playing budget',v:6.8,t:7.2},{l:'Operations',v:3.1,t:4.0},{l:'Ground maintenance',v:0.8,t:1.2},{l:'Commercial & marketing',v:0.6,t:1.0}].map(b=>(
          <div key={b.l} style={{marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.muted,marginBottom:4}}><span>{b.l}</span><span>£{b.v}m / £{b.t}m</span></div>
            <ProgressBar value={b.v} max={b.t} color={b.v/b.t>0.9?C.amber:C.teal}/>
          </div>
        ))}
      </Card>
    </div>
  );

  const SettingsView=()=>(
    <SportsSettings
      sport="cricket"
      slug={slug}
      sportLabel="Cricket"
      entity="club"
      accentColour="#b45309"
      accentLight="#d97706"
      session={{
        userName: session?.userName,
        photoDataUrl: session?.photoDataUrl,
        email: session?.email,
        nickname: session?.nickname,
        clubName: session?.clubName || 'Oakridge CC',
        logoDataUrl: session?.logoDataUrl,
        isDemoShell: session?.isDemoShell,
      }}
      storagePrefix="lumio_cricket_"
      profile={{
        name: 'Director Name',
        tour: 'Competition',
        tourValue: 'County Championship · Division One',
        ranking: 'Division Position',
        rankingValue: '2nd · Division One',
        coach: 'Head Coach',
        coachValue: 'Marcus Caldwell',
        agent: 'Director of Cricket',
        agentValue: 'Darren Ellesmere',
        homeVenue: 'Home Ground',
        homeVenueValue: 'Oakridge Park',
        playerIdLabel: 'Play-Cricket Club ID',
        staffInviteRoles: ['Director','Head Coach','Captain','Analyst','Medical','Operations','Sponsor','Media','Groundsman','Mental Performance'],
      }}
      configFields={[
        { id: 'ecbNumber',    label: 'ECB Club Number',     description: 'First-class county ID issued by the ECB', kind: 'text',   placeholder: 'e.g. ECB-18',        defaultValue: 'ECB-18' },
        { id: 'cpaId',        label: 'CPA Reference',       description: 'County Partnership Agreement ID for compliance reporting', kind: 'text', placeholder: 'e.g. CPA-OAKR-26', defaultValue: 'CPA-OAKR-26' },
        { id: 'playCricketId',label: 'Play-Cricket Club ID',description: 'Links fixtures, scorecards and umpire reports', kind: 'text', placeholder: 'e.g. play-cricket-0018', defaultValue: '' },
        { id: 'competition',  label: 'Primary Competition', description: 'Men’s senior competition tier', kind: 'select', options: ['County Championship — Division One','County Championship — Division Two','T20 Blast','One Day Cup','The Hundred'], defaultValue: 'County Championship — Division One' },
        { id: 'homeGround',   label: 'Home Ground',         description: 'Primary first-class venue', kind: 'text', placeholder: 'e.g. Oakridge Park', defaultValue: 'Oakridge Park' },
        { id: 'gpsProvider',  label: 'GPS Hardware Provider', description: 'Movement and load tracking system', kind: 'select', options: ['None','Lumio GPS (recommended)','Lumio GPS Pro (with live data)','CSV Upload (manual)'], defaultValue: 'Lumio GPS (recommended)' },
      ]}
      integrationGroups={[
        {
          title: 'CRICKET DATA PROVIDERS',
          items: [
            { name: 'CricViz',       desc: 'Ball-by-ball metrics, PV and expected runs', connected: true  },
            { name: 'Lumio Ball Tracking', desc: 'Ball tracking, LBW and bounce profile', connected: false },
            { name: 'Play-Cricket',  desc: 'Fixtures, scorecards and umpire reports',     connected: true  },
            { name: 'ECB Compliance Hub', desc: 'CPA self-assessment + safeguarding',     connected: true  },
          ],
        },
        {
          title: 'VIDEO & TRACKING',
          items: [
            { name: 'Lumio GPS',     desc: 'Player movement load + bowling spells',       connected: true  },
            { name: 'Lumio Vision',  desc: 'Ball-by-ball video, clip tagging and AI review' },
            { name: 'PitchVision',   desc: 'Net session analysis and bat-speed capture' },
          ],
        },
        {
          title: 'COMMUNICATION',
          items: [
            { name: 'Slack',             desc: 'Dressing-room + staff messaging' },
            { name: 'Microsoft Teams',   desc: 'Board reviews + video conferencing' },
            { name: 'Google Workspace',  desc: 'Calendar, Drive & email' },
            { name: 'WhatsApp Business', desc: 'Match-day broadcast channel for squad + staff' },
          ],
        },
      ]}
      voiceOptions={[
        { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah',      desc: 'Warm, confident British female — ideal for morning briefings' },
        { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte',  desc: 'Calm, authoritative British female — steady match-day narration' },
        { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George',     desc: 'Professional British male — composed and match-report ready' },
      ]}
      notificationPreferences={[
        'Injury alerts',
        'Contract deadlines',
        'Match reminders',
        'DBS expiry warnings',
        'Bowling workload red flags',
        'Mental Performance check-ins',
        'AI briefing email',
      ]}
      teamInvite={{
        enabled: true,
        staffCount: 10,
        pendingInvites: 0,
        roleOptions: ['Director','Head Coach','Captain','Analyst','Medical','Operations','Sponsor','Media','Groundsman','Mental Performance'],
      }}
      navItems={[
        { key: 'dashboard',          label: 'Dashboard',          emoji: '🏠' },
        { key: 'briefing',           label: 'Morning Briefing',   emoji: '☀️' },
        { key: 'insights',           label: 'Insights',           emoji: '📊' },
        { key: 'match-centre',       label: 'Match Centre',       emoji: '🏏' },
        { key: 'ai-innings-brief',   label: 'AI Innings Brief',   emoji: '🧠' },
        { key: 'batting-analytics',  label: 'Batting Analytics',  emoji: '📊' },
        { key: 'bowling-analytics',  label: 'Bowling Analytics',  emoji: '🎯' },
        { key: 'opposition',         label: 'Opposition Scout',   emoji: '🔬' },
        { key: 'declaration',        label: 'Declaration Planner',emoji: '📐' },
        { key: 'bowling-workload',   label: 'Bowling Workload',   emoji: '🦾' },
        { key: 'mental-performance', label: 'Mental Performance', emoji: '🧠' },
        { key: 'sponsorship',        label: 'Sponsorship Pipeline', emoji: '🤝' },
      ]}
      featureItems={[
        { key: 'morning-briefing', label: 'Morning Briefing',    emoji: '🌅', description: 'AI summary at top of dashboard' },
        { key: 'quick-actions',    label: 'Quick Actions bar',   emoji: '⚡', description: 'Action buttons below tab bar' },
        { key: 'ai-section',       label: 'AI Department Intelligence', emoji: '✨', description: 'AI Summary + Key Highlights' },
        { key: 'world-clock',      label: 'World Clock',         emoji: '🕐', description: 'Multi-timezone clock in banner' },
        { key: 'weather',          label: 'Weather widget',      emoji: '🌤️', description: 'Ground weather + forecast' },
      ]}
      showWorldClock
      showAppearance
      showDeveloperTools
      devApiRouteOptions={['/api/ai/cricket']}
    />
  );

  const DeclarationPlanner=()=>{
    const runsToAdd = declState.targetScore - declState.currentScore;
    const overs4rpo = runsToAdd > 0 ? Math.ceil(runsToAdd / 4) : 0;
    const risk = declState.targetScore < 200 ? {label:'Too low — opposition favourite',color:C.red}
      : declState.targetScore <= 280 ? {label:'Competitive',color:C.amber}
      : declState.targetScore <= 350 ? {label:'Strong position',color:C.green}
      : {label:'May not bowl them out',color:C.red};
    const recommendation = runsToAdd <= 0
      ? 'Target already reached — consider declaring now to maximise bowling overs.'
      : declState.targetScore < 200
        ? 'Target is too low — bat on and build a safer lead before declaring.'
        : declState.bowlOvers < 60
          ? 'Limited bowling overs remaining — declare now or risk a draw.'
          : `Bat on for ~${overs4rpo} more overs at 4 rpo to reach the target, then declare.`;
    const upd=(k:keyof typeof declState,v:number|string)=>setDeclState(s=>({...s,[k]:v}));
    return (
      <div>
        <SectionHead title="Declaration Planner" sub="4-day match run rate calculator and declaration risk model"/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Match Situation</div>
            {[
              {k:'currentScore',l:'Your current score'},
              {k:'targetScore',l:'Target to set'},
              {k:'overs',l:'Overs remaining'},
              {k:'bowlOvers',l:'Overs available to bowl'},
              {k:'wickets',l:'Wickets in hand'},
            ].map(f=>(
              <div key={f.k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
                <div style={{fontSize:12,color:C.text}}>{f.l}</div>
                <input type="number" value={declState[f.k as 'currentScore']} onChange={e=>upd(f.k as 'currentScore',Number(e.target.value))} style={{width:90,background:'#0b1020',border:`1px solid ${C.border}`,borderRadius:6,padding:'6px 8px',color:C.text,fontSize:12,textAlign:'right'}}/>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0'}}>
              <div style={{fontSize:12,color:C.text}}>Match day</div>
              <select value={declState.days} onChange={e=>upd('days',Number(e.target.value))} style={{width:90,background:'#0b1020',border:`1px solid ${C.border}`,borderRadius:6,padding:'6px 8px',color:C.text,fontSize:12}}>
                {[1,2,3,4].map(d=><option key={d} value={d}>Day {d}</option>)}
              </select>
            </div>
          </Card>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Declaration Analysis</div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,textTransform:'uppercase',color:C.muted}}>Runs to add</div>
              <div style={{fontSize:32,fontWeight:700,color:C.teal,lineHeight:1.1}}>{Math.max(0,runsToAdd)}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              <div><div style={{fontSize:10,textTransform:'uppercase',color:C.muted}}>Time at 4 rpo</div><div style={{fontSize:16,color:C.text,fontWeight:600}}>{overs4rpo} overs</div></div>
              <div><div style={{fontSize:10,textTransform:'uppercase',color:C.muted}}>Bowl time</div><div style={{fontSize:16,color:C.text,fontWeight:600}}>{declState.bowlOvers} overs</div></div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,textTransform:'uppercase',color:C.muted,marginBottom:4}}>Risk assessment</div>
              <div style={{display:'inline-block',padding:'4px 10px',borderRadius:999,background:risk.color+'22',color:risk.color,fontSize:11,fontWeight:600}}>{risk.label}</div>
            </div>
            <div style={{marginBottom:14,fontSize:12,color:C.text,lineHeight:1.5,fontStyle:'italic'}}>{recommendation}</div>
            <button onClick={askDeclarationAdvice} disabled={declAiLoading} style={{background:C.purple,color:'#fff',border:'none',borderRadius:6,padding:'8px 14px',fontSize:12,fontWeight:600,cursor:declAiLoading?'wait':'pointer',opacity:declAiLoading?0.6:1}}>{declAiLoading?'Asking Lumio AI…':'Get AI Declaration Advice'}</button>
            {declAiResult && (
              <div style={{marginTop:12,borderLeft:`3px solid ${C.purple}`,paddingLeft:12,fontSize:12,color:C.text,lineHeight:1.6,whiteSpace:'pre-wrap'}}>{declAiResult}</div>
            )}
          </Card>
        </div>
      </div>
    );
  };

  const DLSCalculator=()=>{
    const resourceTable: {[overs:number]:number[]} = {
      50:[100.0,93.4,85.1,74.9,62.7,49.0,34.9,22.0,11.9,4.7],
      40:[89.3,84.2,77.8,69.6,59.5,47.6,34.6,22.0,11.9,4.7],
      30:[75.1,71.8,67.3,61.6,54.1,44.7,33.6,21.8,11.9,4.7],
      20:[56.6,54.8,52.4,49.1,44.6,38.6,30.8,21.2,11.9,4.7],
      10:[32.1,31.6,30.8,29.8,28.3,26.1,22.8,17.9,10.9,4.7],
      5:[17.2,17.0,16.8,16.5,16.1,15.4,14.3,12.5,9.4,4.6],
      0:[0,0,0,0,0,0,0,0,0,0],
    };
    const getResource=(oversRem:number,wk:number)=>{
      const keys=Object.keys(resourceTable).map(Number).sort((a,b)=>b-a);
      const hi=keys.find(k=>k<=oversRem) ?? 0;
      const lo=keys.filter(k=>k>oversRem).sort((a,b)=>a-b)[0] ?? hi;
      const rHi=resourceTable[hi][Math.min(9,Math.max(0,wk))];
      const rLo=resourceTable[lo]?.[Math.min(9,Math.max(0,wk))] ?? rHi;
      if (hi===lo) return rHi;
      const t=(oversRem-hi)/(lo-hi);
      return rHi + (rLo-rHi)*t;
    };
    const upd=<K extends keyof typeof dlsState>(k:K,v:(typeof dlsState)[K])=>setDlsState(s=>({...s,[k]:v}));
    const fullOvers = dlsState.format==='OD'?50:20;
    const team1Resources = 100;
    const team2OversAvail = fullOvers - dlsState.overslost;
    const team2Resources = getResource(team2OversAvail, 0);
    const revisedTarget = Math.floor(dlsState.team1Score * (team2Resources / team1Resources)) + 1;
    const parIntervals = [20,15,10,5].filter(o=>o<=team2OversAvail).map(oRem=>{
      const oversBowled = team2OversAvail - oRem;
      const usedRes = team2Resources - getResource(oRem, dlsState.wickets);
      const par = Math.floor(dlsState.team1Score * (usedRes / team1Resources));
      return {oRem,oversBowled,par};
    });
    const currentRemOvers = team2OversAvail - dlsState.currentOvers;
    const currentUsedRes = team2Resources - getResource(Math.max(0,currentRemOvers), dlsState.wickets);
    const currentPar = Math.floor(dlsState.team1Score * (currentUsedRes / team1Resources));
    const diff = dlsState.currentScore - currentPar;
    const statusLabel = Math.abs(diff)<3?{t:'On track',c:C.amber}: diff>0?{t:`Ahead by ${diff}`,c:C.green}:{t:`Behind by ${Math.abs(diff)}`,c:C.red};
    return (
      <div>
        <SectionHead title="D/L Calculator" sub="Duckworth-Lewis-Stern par score for weather-interrupted matches"/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Match Situation Input</div>
            <div style={{display:'flex',gap:6,marginBottom:12}}>
              {(['OD','T20'] as const).map(f=>(
                <button key={f} onClick={()=>upd('format',f)} style={{flex:1,padding:'6px 10px',borderRadius:6,border:`1px solid ${C.border}`,background:dlsState.format===f?C.tealDim:'transparent',color:dlsState.format===f?C.teal:C.muted,fontSize:12,cursor:'pointer',fontWeight:600}}>{f==='OD'?'One Day (50 over)':'T20 (20 over)'}</button>
              ))}
            </div>
            {[
              {k:'team1Score' as const,l:'Team 1 score'},
              {k:'oversFaced' as const,l:'Overs faced by Team 1'},
              {k:'overslost' as const,l:'Overs lost to weather'},
              {k:'wickets' as const,l:'Wickets lost at interruption'},
              {k:'currentScore' as const,l:'Team 2 current score'},
              {k:'currentOvers' as const,l:'Team 2 current overs'},
            ].map(f=>(
              <div key={f.k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
                <div style={{fontSize:12,color:C.text}}>{f.l}</div>
                <input type="number" value={dlsState[f.k]} onChange={e=>upd(f.k,Number(e.target.value))} style={{width:90,background:'#0b1020',border:`1px solid ${C.border}`,borderRadius:6,padding:'6px 8px',color:C.text,fontSize:12,textAlign:'right'}}/>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0'}}>
              <div style={{fontSize:12,color:C.text}}>Interruption affected</div>
              <select value={dlsState.interruption} onChange={e=>upd('interruption',e.target.value)} style={{width:120,background:'#0b1020',border:`1px solid ${C.border}`,borderRadius:6,padding:'6px 8px',color:C.text,fontSize:12}}>
                <option value="batting">Team 2 chase</option>
                <option value="team1">Team 1 innings</option>
              </select>
            </div>
          </Card>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>D/L Result</div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,textTransform:'uppercase',color:C.muted}}>Thorpeed target</div>
              <div style={{fontSize:36,fontWeight:700,color:C.teal,lineHeight:1.1}}>{revisedTarget}</div>
              <div style={{fontSize:11,color:C.muted}}>from {team2OversAvail} overs · {team2Resources.toFixed(1)}% resources</div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,textTransform:'uppercase',color:C.muted,marginBottom:6}}>Par score by overs remaining</div>
              <table style={{width:'100%',fontSize:12}}>
                <thead><tr style={{color:C.dim}}><th style={{textAlign:'left',padding:'4px 0'}}>Overs left</th><th style={{textAlign:'right'}}>Overs bowled</th><th style={{textAlign:'right'}}>Par</th></tr></thead>
                <tbody>
                  {parIntervals.map((p,i)=>(
                    <tr key={i} style={{borderTop:`1px solid ${C.border}`,color:C.text}}><td style={{padding:'4px 0'}}>{p.oRem}</td><td style={{textAlign:'right'}}>{p.oversBowled}</td><td style={{textAlign:'right',fontWeight:600}}>{p.par}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,textTransform:'uppercase',color:C.muted,marginBottom:4}}>Team 2 status</div>
              <div style={{display:'inline-block',padding:'4px 10px',borderRadius:999,background:statusLabel.c+'22',color:statusLabel.c,fontSize:11,fontWeight:600}}>{statusLabel.t}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:4}}>Par at {dlsState.currentOvers} overs: {currentPar}</div>
            </div>
            <div style={{fontSize:10,color:C.dim,fontStyle:'italic',lineHeight:1.5}}>This uses a simplified resource table. For official match use, consult the ECB/ICC official DLS calculator.</div>
          </Card>
        </div>
      </div>
    );
  };

  const FanEngagement=()=>{
    const fmtColor=(f:string)=>f==='T20'?C.amber:f==='OD'?C.purple:C.teal;
    const nps=FAN_DATA.nps;
    const soc=FAN_DATA.social;
    const socialTotal = soc.twitter+soc.instagram+soc.facebook+soc.tiktok;
    const platforms=[
      {n:'Twitter/X',v:soc.twitter,c:C.teal},
      {n:'Instagram',v:soc.instagram,c:C.purple},
      {n:'Facebook',v:soc.facebook,c:C.amber},
      {n:'TikTok',v:soc.tiktok,c:C.red},
    ];
    return (
      <div>
        <SectionHead title="Fan Engagement" sub="Membership, attendance, social media and sentiment — season 2026"/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
          <Stat label="Members" value={FAN_DATA.membership.total.toLocaleString()} color={C.teal} sub={`of ${FAN_DATA.membership.target.toLocaleString()} target`}/>
          <Stat label="NPS Score" value={String(nps.score)} color={C.green} sub="Promoters - Detractors"/>
          <Stat label="Season Tickets" value={FAN_DATA.seasonTickets.sold.toLocaleString()} color={C.purple} sub={`of ${FAN_DATA.seasonTickets.target.toLocaleString()}`}/>
          <Stat label="Social Followers" value={`${Math.round(socialTotal/1000)}k`} color={C.amber} sub={`${soc.engagementRate}% engagement`}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1.3fr 1fr',gap:12,marginBottom:12}}>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Attendance Tracker</div>
            <div style={{height:240}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={FAN_DATA.attendance} margin={{top:10,right:10,left:0,bottom:30}}>
                  <XAxis dataKey="match" tick={{fontSize:10,fill:C.muted}} angle={-18} textAnchor="end" interval={0}/>
                  <YAxis tick={{fontSize:10,fill:C.muted}}/>
                  <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,fontSize:12}}/>
                  <ReferenceLine y={18350} stroke={C.red} strokeDasharray="3 3" label={{value:'Capacity',fill:C.red,fontSize:10,position:'right'}}/>
                  <Bar dataKey="att">
                    {FAN_DATA.attendance.map((d,i)=><Cell key={i} fill={fmtColor(d.format)} fillOpacity={d.projected?0.45:1}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{fontSize:10,color:C.dim,marginTop:6}}>Lower-opacity bars indicate projected attendance</div>
          </Card>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Membership Health</div>
            <div style={{marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.muted,marginBottom:4}}><span>Renewal rate</span><span style={{color:C.green,fontWeight:600}}>{FAN_DATA.membership.renewalRate}%</span></div>
              <div style={{height:8,background:'#0b1020',borderRadius:4,overflow:'hidden'}}><div style={{width:`${FAN_DATA.membership.renewalRate}%`,height:'100%',background:C.green}}/></div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.muted,marginBottom:4}}><span>Season tickets sold</span><span style={{color:C.purple,fontWeight:600}}>{FAN_DATA.seasonTickets.sold.toLocaleString()} / {FAN_DATA.seasonTickets.target.toLocaleString()}</span></div>
              <div style={{height:8,background:'#0b1020',borderRadius:4,overflow:'hidden'}}><div style={{width:`${(FAN_DATA.seasonTickets.sold/FAN_DATA.seasonTickets.target)*100}%`,height:'100%',background:C.purple}}/></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div style={{border:`1px solid ${C.border}`,borderRadius:6,padding:10}}>
                <div style={{fontSize:10,textTransform:'uppercase',color:C.muted}}>Early renewals</div>
                <div style={{fontSize:18,fontWeight:700,color:C.teal}}>{FAN_DATA.seasonTickets.renewedEarly.toLocaleString()}</div>
              </div>
              <div style={{border:`1px solid ${C.border}`,borderRadius:6,padding:10}}>
                <div style={{fontSize:10,textTransform:'uppercase',color:C.muted}}>New buyers</div>
                <div style={{fontSize:18,fontWeight:700,color:C.amber}}>{FAN_DATA.seasonTickets.newBuyers.toLocaleString()}</div>
              </div>
            </div>
          </Card>
        </div>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Social & Sentiment</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
            {platforms.map(p=>(
              <div key={p.n} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:12}}>
                <div style={{fontSize:11,color:C.muted}}>{p.n}</div>
                <div style={{fontSize:20,fontWeight:700,color:p.c}}>{(p.v/1000).toFixed(1)}k</div>
                <div style={{fontSize:10,color:C.green}}>▲ growing</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.muted,marginBottom:6}}><span>NPS breakdown — score {nps.score}</span><span>Promoters {nps.promoters}% · Passives {nps.passives}% · Detractors {nps.detractors}%</span></div>
            <div style={{display:'flex',height:14,borderRadius:7,overflow:'hidden'}}>
              <div style={{width:`${nps.promoters}%`,background:C.green}}/>
              <div style={{width:`${nps.passives}%`,background:C.amber}}/>
              <div style={{width:`${nps.detractors}%`,background:C.red}}/>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // ── SIGNING PIPELINE ─────────────────────────────────────────────
  const SigningPipeline = () => {
    const [pipeline, setPipeline] = useState<typeof SIGNING_PIPELINE>([...SIGNING_PIPELINE]);
    const [showForm, setShowForm] = useState(false);
    const [newTarget, setNewTarget] = useState({ name:'', role:'', county:'', value:'', agent:'', notes:'' });
    const cols = ['Identified','Approached','Negotiating','Done','Failed'];
    const colColors: Record<string,string> = { 'Identified':C.blue, 'Approached':C.amber, 'Negotiating':C.purple, 'Done':C.green, 'Failed':C.red };
    const countByCol = (c: string) => pipeline.filter(p => p.col === c).length;
    function addTarget() {
      if (!newTarget.name.trim()) return;
      const id = Math.max(0, ...pipeline.map(p => p.id)) + 1;
      setPipeline([...pipeline, { id, ...newTarget, age: 0, col:'Identified', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' }]);
      setNewTarget({ name:'', role:'', county:'', value:'', agent:'', notes:'' });
      setShowForm(false);
    }
    const inp = { padding:'6px 8px', borderRadius:4, border:`1px solid ${C.border}`, background:C.cardAlt, color:C.text, fontSize:12, width:'100%' } as React.CSSProperties;
    return (
      <div>
        <SectionHead title="Signing Pipeline" sub="Identified targets, negotiations, and completed deals"/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
          <Stat label="Identified" value={countByCol('Identified')} color={C.blue} sub="Scouted targets"/>
          <Stat label="In Negotiation" value={countByCol('Negotiating')} color={C.purple} sub="Active discussions"/>
          <Stat label="Signed This Window" value={countByCol('Done')} color={C.green} sub="Completed deals"/>
          <Stat label="Failed / Withdrawn" value={countByCol('Failed')} color={C.red} sub="Fell through"/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:12}}>
          {cols.map(colName => {
            const color = colColors[colName];
            const items = pipeline.filter(p => p.col === colName);
            return (
              <div key={colName} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:10,minHeight:200}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${C.border}`}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:color}}/>
                  <span style={{fontSize:11,fontWeight:700,color:C.text,textTransform:'uppercase',letterSpacing:'0.04em',flex:1}}>{colName}</span>
                  <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:10,background:`${color}22`,color}}>{items.length}</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {items.map(p => (
                    <div key={p.id} style={{background:C.cardAlt,borderRadius:6,padding:8,borderLeft:`3px solid ${color}`}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                        <span style={{fontSize:13}}>{p.flag}</span>
                        <span style={{fontSize:12,fontWeight:600,color:C.text,flex:1,lineHeight:1.2}}>{p.name}</span>
                        {p.age > 0 && <span style={{fontSize:10,color:C.dim}}>{p.age}y</span>}
                      </div>
                      <div style={{fontSize:10,color:C.muted,marginBottom:4}}>{p.role}{p.county && p.county !== '—' ? ` · ${p.county}` : ''}</div>
                      {p.value && <div style={{fontSize:10,color:color,fontWeight:600,marginBottom:3}}>{p.value}</div>}
                      {p.agent && p.agent !== '—' && <div style={{fontSize:9,color:C.dim,marginBottom:4}}>Agent: {p.agent}</div>}
                      {p.notes && <div style={{fontSize:10,color:C.muted,lineHeight:1.4,fontStyle:'italic'}}>{p.notes}</div>}
                    </div>
                  ))}
                  {items.length === 0 && <div style={{fontSize:10,color:C.dim,fontStyle:'italic',textAlign:'center',padding:10}}>No targets</div>}
                </div>
              </div>
            );
          })}
        </div>
        {!showForm ? (
          <button onClick={() => setShowForm(true)} style={{padding:'8px 14px',borderRadius:6,border:`1px solid ${C.teal}55`,background:C.tealDim,color:C.teal,fontSize:12,fontWeight:600,cursor:'pointer'}}>+ Add Target</button>
        ) : (
          <Card>
            <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:10}}>Add New Target</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10}}>
              <input placeholder="Name" value={newTarget.name} onChange={e=>setNewTarget({...newTarget,name:e.target.value})} style={inp}/>
              <input placeholder="Role" value={newTarget.role} onChange={e=>setNewTarget({...newTarget,role:e.target.value})} style={inp}/>
              <input placeholder="County" value={newTarget.county} onChange={e=>setNewTarget({...newTarget,county:e.target.value})} style={inp}/>
              <input placeholder="Value (e.g. £70k/yr)" value={newTarget.value} onChange={e=>setNewTarget({...newTarget,value:e.target.value})} style={inp}/>
              <input placeholder="Agent" value={newTarget.agent} onChange={e=>setNewTarget({...newTarget,agent:e.target.value})} style={inp}/>
              <input placeholder="Notes" value={newTarget.notes} onChange={e=>setNewTarget({...newTarget,notes:e.target.value})} style={inp}/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={addTarget} style={{padding:'6px 14px',borderRadius:6,border:'none',background:C.teal,color:'#07080F',fontSize:11,fontWeight:700,cursor:'pointer'}}>Add</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'6px 14px',borderRadius:6,border:`1px solid ${C.border}`,background:'transparent',color:C.muted,fontSize:11,cursor:'pointer'}}>Cancel</button>
            </div>
          </Card>
        )}
      </div>
    );
  };

  // ── NET SESSION PLANNER ──────────────────────────────────────────
  const NetSessionPlanner = () => {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const bowlers = GPS_DATA.filter(g => g.bowl);
    const projected: Record<string,number> = { 'Sam Reed': 72, 'Jake Harrison': 12, 'Chris Dawson': 48, 'James Hill': 40 };
    const dawsonCap = 36;
    const sessionColor = (s: string) => {
      if (s === 'Match') return C.red;
      if (s === 'Batting' || s === 'Bowling') return C.teal;
      if (s === 'Fielding' || s === 'S&C') return C.purple;
      if (s === 'Rest') return C.muted;
      return C.blue;
    };
    async function runAiReview() {
      setNetAiLoading(true); setNetAiError(null);
      if (session?.isDemoShell !== false) {
        setNetAiResult(CANNED.cricket.netsReview ?? '');
        setNetAiLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/ai/cricket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 400,
            messages: [{ role: 'user', content: 'Oakridge CC net session review. Bowlers: Reed (72 del planned, limit 96, ACWR 0.94), Dawson (48 del planned, limit 36, ACWR 1.62), Harrison (12 del, return-to-play). Championship vs Calderbrook CCC in 2 days. Is this week\u2019s load appropriate? Give 2-3 sentence recommendation.' }],
          }),
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        const text: string = data?.content?.[0]?.text || '';
        setNetAiResult(text.trim());
      } catch (err) {
        setNetAiError(err instanceof Error ? err.message : 'AI review failed');
      } finally {
        setNetAiLoading(false);
      }
    }
    return (
      <div>
        <SectionHead title="Net Session Planner" sub="Weekly schedule builder with bowling load limits and overuse flagging"/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>This Week&apos;s Sessions</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {days.map(d => {
                const s = netSessions[d];
                const c = sessionColor(s);
                return (
                  <div key={d} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:C.cardAlt,borderRadius:6,borderLeft:`3px solid ${c}`}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.dim,width:30,textTransform:'uppercase'}}>{d}</div>
                    <div style={{flex:1,fontSize:12,color:C.text}}>{s || 'No session'}</div>
                    {s && s !== 'Rest' && s !== 'Match' && <div style={{fontSize:10,color:C.muted}}>{s === 'S&C' ? '45 min' : '90 min'}</div>}
                    {!s && (
                      <button onClick={()=>setNetSessions({...netSessions,[d]:'Batting'})} style={{fontSize:10,padding:'3px 8px',borderRadius:4,border:`1px solid ${C.border}`,background:'transparent',color:C.teal,cursor:'pointer'}}>+ Add</button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Bowling Load Monitor</div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {bowlers.map(b => {
                const proj = projected[b.name] ?? 0;
                const isDawson = b.name === 'Chris Dawson';
                const cap = isDawson ? dawsonCap : (b.bowl?.lim ?? 96);
                const pct = cap > 0 ? (proj / cap) * 100 : 0;
                const color = pct > 100 ? C.red : pct > 80 ? C.amber : C.green;
                return (
                  <div key={b.name}>
                    <div style={{display:'flex',alignItems:'center',marginBottom:4}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:600,color:C.text}}>{b.name}</div>
                        <div style={{fontSize:10,color:C.dim}}>{b.role}</div>
                      </div>
                      <span style={{padding:'2px 7px',borderRadius:10,fontSize:9,fontWeight:700,background:`${color}22`,color,textTransform:'uppercase'}}>
                        {pct > 100 ? 'Over cap' : pct > 80 ? 'High' : 'Safe'}
                      </span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                      <div style={{flex:1,height:4,background:C.border,borderRadius:2,overflow:'hidden'}}>
                        <div style={{width:`${Math.min(pct,100)}%`,height:'100%',background:color}}/>
                      </div>
                      <div style={{fontSize:10,color:C.muted,minWidth:58,textAlign:'right'}}>{proj}/{cap} del</div>
                    </div>
                    {isDawson && (
                      <div style={{fontSize:10,color:C.red,fontStyle:'italic'}}>⚠️ A:C 1.62 — reduced cap this week: 36 deliveries max</div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Load Flags &amp; Recommendations</div>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
              <div style={{padding:10,background:C.cardAlt,borderRadius:6,borderLeft:`3px solid ${C.red}`}}>
                <div style={{fontSize:11,fontWeight:700,color:C.red,marginBottom:3}}>Chris Dawson</div>
                <div style={{fontSize:10,color:C.muted,lineHeight:1.5}}>48 projected deliveries exceeds 36-delivery cap this week. Remove 2 bowling slots.</div>
              </div>
              <div style={{padding:10,background:C.cardAlt,borderRadius:6,borderLeft:`3px solid ${C.amber}`}}>
                <div style={{fontSize:11,fontWeight:700,color:C.amber,marginBottom:3}}>Sam Reed</div>
                <div style={{fontSize:10,color:C.muted,lineHeight:1.5}}>72 projected deliveries — approaching weekly limit. Monitor closely.</div>
              </div>
              <div style={{padding:10,background:C.cardAlt,borderRadius:6,borderLeft:`3px solid ${C.amber}`}}>
                <div style={{fontSize:11,fontWeight:700,color:C.amber,marginBottom:3}}>Jake Harrison</div>
                <div style={{fontSize:10,color:C.muted,lineHeight:1.5}}>Return-to-play only. Max 12 deliveries per session.</div>
              </div>
            </div>
            <button onClick={runAiReview} disabled={netAiLoading} style={{width:'100%',padding:'8px 14px',borderRadius:6,border:'none',background:netAiLoading?C.cardAlt:C.teal,color:netAiLoading?C.muted:'#07080F',fontSize:11,fontWeight:700,cursor:netAiLoading?'wait':'pointer'}}>
              {netAiLoading ? 'Thinking…' : '✨ AI Session Review'}
            </button>
            {netAiError && <div style={{marginTop:8,padding:8,background:C.redDim,borderRadius:6,fontSize:10,color:C.red}}>⚠ {netAiError}</div>}
            {netAiResult && !netAiError && (
              <div style={{marginTop:8,padding:10,background:C.tealDim,border:`1px solid ${C.teal}55`,borderRadius:6,fontSize:11,color:C.teal,lineHeight:1.5}}>{netAiResult}</div>
            )}
          </Card>
        </div>
      </div>
    );
  };

  // ── MATCH REPORT ─────────────────────────────────────────────────
  const MatchReport = () => {
    const selected = CRICKET_RESULTS[reportMatchIdx] || CRICKET_RESULTS[0];
    const inp = { padding:'6px 8px', borderRadius:4, border:`1px solid ${C.border}`, background:C.cardAlt, color:C.text, fontSize:12, width:'100%' } as React.CSSProperties;
    const lbl = { fontSize:10, color:C.dim, textTransform:'uppercase' as const, letterSpacing:'0.04em', marginBottom:3, display:'block' as const };
    async function generateReport() {
      setReportLoading(true); setReportError(null); setReportText(null);
      if (session?.isDemoShell !== false) {
        setReportText(CANNED.cricket.matchReport ?? '');
        setReportLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/ai/cricket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 600,
            system: 'You are the media officer for Oakridge CC. Write match reports in a professional but warm style for club communications.',
            messages: [{ role: 'user', content: `Write a 150-word match report for: ${selected.opponent} (${selected.homeAway}), ${selected.competition}, ${selected.date}. Score: ${selected.score} vs ${selected.oppScore}. Result: ${selected.result}. Man of match: ${reportMom}. Notes: ${reportNotes}. Format for club website and social media use.` }],
          }),
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        setReportText((data?.content?.[0]?.text || '').trim());
      } catch (err) {
        setReportError(err instanceof Error ? err.message : 'Failed to generate report');
      } finally {
        setReportLoading(false);
      }
    }
    function copyReport() {
      if (!reportText) return;
      try { navigator.clipboard.writeText(reportText); setReportCopied(true); setTimeout(()=>setReportCopied(false), 2000); } catch {}
    }
    function downloadPdf() {
      if (!reportText) return;
      const w = window.open('', '_blank', 'width=800,height=1000');
      if (!w) return;
      w.document.write(`<!doctype html><html><head><title>Match Report — ${selected.opponent}</title><style>
@media print { body { margin: 0 } }
body { font-family: -apple-system, system-ui, serif; font-size: 12px; color: #111; background: #fff; padding: 24px; line-height: 1.6; max-width: 720px; margin: 0 auto }
h1 { font-size: 20px; margin: 0 0 4px; letter-spacing: 0.02em }
.sub { font-size: 11px; color: #666; margin-bottom: 20px }
.body { white-space: pre-wrap; font-size: 13px }
.footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 10px; color: #888 }
</style></head><body>
<h1>OAKRIDGE CC — MATCH REPORT</h1>
<div class="sub">vs ${selected.opponent} (${selected.homeAway}) &middot; ${selected.competition} &middot; ${selected.date} &middot; ${selected.result}</div>
<div class="body">${reportText.replace(/</g,'&lt;')}</div>
<div class="footer">Generated by Lumio Tour &middot; Oakridge CC Media Office</div>
</body></html>`);
      w.document.close();
      setTimeout(() => { try { w.print(); } catch {} }, 300);
    }
    const previousReports = [
      { date:'18 Mar 2026', opp:'Brackenfell CCC MCCU', result:'W', text:'Oakridge opened their pre-season with an emphatic performance at Oakridge Park, thanks largely to Harry Fairweather\u2019s patient 124. Ridley led the bowling with 4-62 in a disciplined red-ball display.' },
      { date:'03 Mar 2026', opp:'Calderbrook CCC XI', result:'D', text:'A rain-affected draw at Westmoor Cricket Ground saw Oakridge declare on 380/6 before weather intervened. Pennington contributed 87 from number five.' },
      { date:'22 Feb 2026', opp:'MCC', result:'W', text:'Caldwell\u2019s five-wicket haul was the standout of a commanding 6-wicket win at Lord\u2019s. Oakridge chased down 210 in 42 overs with Kingsley anchoring the innings.' },
    ];
    return (
      <div>
        <SectionHead title="Match Report Generator" sub="Auto-populate from scorecard data and publish to club communications"/>
        <div style={{display:'flex',gap:6,marginBottom:14,borderBottom:`1px solid ${C.border}`}}>
          {(['generate','previous'] as const).map(t => (
            <button key={t} onClick={()=>setReportTab(t)} style={{padding:'8px 16px',background:'transparent',border:'none',borderBottom:`2px solid ${reportTab===t?C.teal:'transparent'}`,color:reportTab===t?C.teal:C.muted,fontSize:12,fontWeight:600,cursor:'pointer'}}>
              {t === 'generate' ? 'Generate Report' : 'Previous Reports'}
            </button>
          ))}
        </div>
        {reportTab === 'generate' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1.2fr',gap:12}}>
            <Card>
              <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Scorecard Inputs</div>
              <div style={{marginBottom:10}}>
                <label style={lbl}>Match</label>
                <select value={reportMatchIdx} onChange={e=>setReportMatchIdx(parseInt(e.target.value,10))} style={inp}>
                  {CRICKET_RESULTS.map((r, i) => (
                    <option key={r.id} value={i}>vs {r.opponent} — {r.date} — {r.result}</option>
                  ))}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                <div><label style={lbl}>Opposition</label><div style={{...inp,background:C.card}}>{selected.opponent}</div></div>
                <div><label style={lbl}>Venue</label><div style={{...inp,background:C.card}}>{selected.homeAway}</div></div>
                <div><label style={lbl}>Format</label><div style={{...inp,background:C.card}}>{selected.format}</div></div>
                <div><label style={lbl}>Result</label><div style={{...inp,background:C.card,color:resultColor(selected.result),fontWeight:700}}>{selected.result}</div></div>
                <div><label style={lbl}>Our score</label><div style={{...inp,background:C.card}}>{selected.score}</div></div>
                <div><label style={lbl}>Their score</label><div style={{...inp,background:C.card}}>{selected.oppScore}</div></div>
              </div>
              <div style={{marginBottom:10}}>
                <label style={lbl}>Man of match</label>
                <input value={reportMom} onChange={e=>setReportMom(e.target.value)} style={inp}/>
              </div>
              <div style={{marginBottom:10}}>
                <label style={lbl}>Key performance notes</label>
                <textarea value={reportNotes} onChange={e=>setReportNotes(e.target.value)} rows={4} style={{...inp,fontFamily:'inherit',resize:'vertical'}}/>
              </div>
              <button onClick={generateReport} disabled={reportLoading} style={{width:'100%',padding:'8px 14px',borderRadius:6,border:'none',background:reportLoading?C.cardAlt:C.teal,color:reportLoading?C.muted:'#07080F',fontSize:11,fontWeight:700,cursor:reportLoading?'wait':'pointer'}}>
                {reportLoading ? 'Generating…' : '✨ Generate Report'}
              </button>
            </Card>
            <Card>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div style={{fontSize:12,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em'}}>Preview</div>
                {reportText && !reportLoading && (
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={copyReport} style={{padding:'4px 10px',borderRadius:4,border:`1px solid ${C.border}`,background:'transparent',color:reportCopied?C.green:C.muted,fontSize:10,fontWeight:600,cursor:'pointer'}}>{reportCopied ? '✓ Copied' : 'Copy'}</button>
                    <button onClick={downloadPdf} style={{padding:'4px 10px',borderRadius:4,border:`1px solid ${C.border}`,background:'transparent',color:C.muted,fontSize:10,fontWeight:600,cursor:'pointer'}}>Download PDF</button>
                  </div>
                )}
              </div>
              {reportLoading ? (
                <div style={{padding:20,textAlign:'center',color:C.dim,fontSize:11}}>Generating report…</div>
              ) : reportError ? (
                <div style={{padding:10,background:C.redDim,borderRadius:6,fontSize:11,color:C.red}}>⚠ {reportError}</div>
              ) : reportText ? (
                <div style={{padding:14,background:'#fff',color:'#1a1a1a',borderRadius:6,fontSize:13,lineHeight:1.7,fontFamily:'Georgia, serif',whiteSpace:'pre-wrap',minHeight:240}}>{reportText}</div>
              ) : (
                <div style={{padding:20,textAlign:'center',color:C.dim,fontSize:11,fontStyle:'italic'}}>Select a match, adjust notes, and click Generate Report.</div>
              )}
            </Card>
          </div>
        )}
        {reportTab === 'previous' && (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {previousReports.map((r, i) => (
              <Card key={i}>
                <details>
                  <summary style={{cursor:'pointer',listStyle:'none',display:'flex',alignItems:'center',gap:10}}>
                    <div style={{fontSize:11,color:C.dim,width:100}}>{r.date}</div>
                    <div style={{flex:1,fontSize:13,color:C.text,fontWeight:600}}>vs {r.opp}</div>
                    <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:resultColor(r.result)+'22',color:resultColor(r.result)}}>{r.result}</span>
                    <span style={{fontSize:10,color:C.teal,marginLeft:8}}>View →</span>
                  </summary>
                  <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`,fontSize:12,color:C.muted,lineHeight:1.6}}>{r.text}</div>
                </details>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Sponsor dashboard for sponsor role
  const CricketSponsorDashboard = () => {
    const [sTab, setSTab] = useState<'overview'|'obligations'|'content'|'events'|'roi'>('overview')
    return (
      <div className="space-y-6">
        <div><h2 className="text-xl font-black" style={{color:C.text}}>Sponsor Dashboard</h2><p className="text-xs" style={{color:C.dim}}>Oakridge CC partnership overview</p></div>
        <div className="flex gap-1 border-b" style={{borderColor:C.border}}>
          {([{id:'overview' as const,label:'Overview',icon:'🏠'},{id:'obligations' as const,label:'Obligations',icon:'📋'},{id:'content' as const,label:'Content',icon:'📸'},{id:'events' as const,label:'Events',icon:'🏏'},{id:'roi' as const,label:'ROI & Reach',icon:'📊'}]).map(t=>(
            <button key={t.id} onClick={()=>setSTab(t.id)} className="px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px whitespace-nowrap" style={{borderColor:sTab===t.id?C.amber:'transparent',color:sTab===t.id?C.amber:C.dim}}>{t.icon} {t.label}</button>
          ))}
        </div>
        {sTab==='overview'&&<div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[{l:'Partnership Value',v:'£180k/yr',c:C.amber},{l:'Contract Ends',v:'Dec 2027',c:C.teal},{l:'Obligations Met',v:'8/12',c:C.green},{l:'ROI Score',v:'4.2x',c:C.purple}].map((s,i)=>(<div key={i} className="rounded-xl p-4" style={{backgroundColor:C.card,border:`1px solid ${C.border}`}}><div className="text-xs" style={{color:C.dim}}>{s.l}</div><div className="text-xl font-black" style={{color:s.c}}>{s.v}</div></div>))}</div>}
        {sTab==='obligations'&&<div className="space-y-2">{[{t:'Boundary board branding',s:'✅ Done'},{t:'Matchday hospitality x6',s:'4/6 used'},{t:'Player appearance (1)',s:'⏳ Pending'},{t:'Social media posts x12',s:'8/12 done'}].map((o,i)=>(<div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{backgroundColor:C.card,border:`1px solid ${C.border}`}}><span className="text-sm" style={{color:C.text}}>{o.t}</span><span className="text-xs" style={{color:C.amber}}>{o.s}</span></div>))}</div>}
        {sTab==='content'&&<div className="rounded-xl p-5" style={{backgroundColor:C.card,border:`1px solid ${C.border}`}}><div className="text-sm font-bold mb-3" style={{color:C.text}}>Content Calendar</div><div className="text-xs" style={{color:C.muted}}>Scheduled posts, co-branded content, and player feature opportunities managed through the media team.</div></div>}
        {sTab==='events'&&<div className="space-y-2">{[{e:'T20 Blast Finals Day',d:'Sep 2026',t:'Hospitality'},{e:'County Championship vs Calderbrook CCC',d:'11 Apr 2026',t:'Boundary boards'},{e:'Annual Awards Dinner',d:'Oct 2026',t:'Title sponsor'}].map((ev,i)=>(<div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{backgroundColor:C.card,border:`1px solid ${C.border}`}}><div><div className="text-sm" style={{color:C.text}}>{ev.e}</div><div className="text-xs" style={{color:C.dim}}>{ev.d}</div></div><span className="text-[10px] px-2 py-0.5 rounded-full" style={{backgroundColor:C.amberDim,color:C.amber}}>{ev.t}</span></div>))}</div>}
        {sTab==='roi'&&<div className="grid grid-cols-2 gap-3">{[{l:'Brand impressions',v:'2.4M',c:C.teal},{l:'Social reach',v:'480k',c:C.blue},{l:'Matchday footfall',v:'12,400',c:C.green},{l:'Media mentions',v:'34',c:C.purple}].map((s,i)=>(<div key={i} className="rounded-xl p-4 text-center" style={{backgroundColor:C.card,border:`1px solid ${C.border}`}}><div className="text-xs" style={{color:C.dim}}>{s.l}</div><div className="text-xl font-black" style={{color:s.c}}>{s.v}</div></div>))}</div>}
      </div>
    )
  }

  // ── BOWLING WORKLOAD TRACKER ───────────────────────────────────────
  const BOWLING_WORKLOAD = [
    {name:'Sam Reed',      type:'Pace',  ov7:38, ov28:142, recovery:1, nextLimit:'8 overs max spell', st:'amber',
     note:'A:C ratio 1.28 — reduce T20 workload this block'},
    {name:'Jake Harrison', type:'Pace',  ov7:0,  ov28:0,   recovery:28,nextLimit:'RTP · 6 overs / innings cap', st:'amber',
     note:'Returning from Grade 2 hamstring — lumbar load capped for 4 weeks'},
    {name:'Chris Dawson',  type:'Pace',  ov7:48, ov28:196, recovery:2, nextLimit:'5 overs max spell · 12 overs total', st:'red',
     note:'80 overs in last 10 days · A:C ratio 1.62 · stress-fracture screening booked Wed'},
    {name:'Rajan Steenkamp',  type:'Pace',  ov7:32, ov28:128, recovery:3, nextLimit:'No restriction', st:'green',
     note:'Load within ECB fast-bowler guideline bands'},
    {name:'Jamie Ashford',  type:'Pace', ov7:22, ov28:88,  recovery:4, nextLimit:'No restriction', st:'green',
     note:'Under-workloaded — available as extra seamer'},
    {name:'Alex Merriman',   type:'Spin',  ov7:54, ov28:212, recovery:1, nextLimit:'No restriction', st:'green',
     note:'Spin workload not weight-bearing — no cap'},
    {name:'Oliver Halden CCC',   type:'Spin',  ov7:41, ov28:178, recovery:2, nextLimit:'No restriction', st:'green',
     note:'Normal workload'},
    {name:'Tariq Shah',    type:'Spin',  ov7:28, ov28:104, recovery:2, nextLimit:'No restriction', st:'amber',
     note:'Monitor shoulder load — precautionary only'},
  ];
  const flagColor=(st:string)=> st==='red'?C.red : st==='amber'?C.amber : C.green;
  const flagBg   =(st:string)=> st==='red'?C.redDim : st==='amber'?C.amberDim : C.greenDim;
  const BowlingWorkloadTracker=()=>{
    const counts={red:BOWLING_WORKLOAD.filter(b=>b.st==='red').length,
                  amber:BOWLING_WORKLOAD.filter(b=>b.st==='amber').length,
                  green:BOWLING_WORKLOAD.filter(b=>b.st==='green').length};
    return (
      <div>
        <SectionHead title="Bowling Workload Tracker"
          sub="ECB fast-bowler guideline compliance, A:C ratio, spell-length caps and return-to-play flags"/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
          <Stat label="Bowlers Monitored" value={String(BOWLING_WORKLOAD.length)} color={C.teal} sub="Across pace + spin"/>
          <Stat label="Red Flag" value={`${counts.red} bowler${counts.red===1?'':'s'}`} color={C.red} sub="Stress-fracture risk / on limit"/>
          <Stat label="Amber Flag" value={`${counts.amber} bowlers`} color={C.amber} sub="Monitoring / RTP phase"/>
          <Stat label="Green / Fit" value={`${counts.green} bowlers`} color={C.green} sub="Within guideline bands"/>
        </div>

        <Card style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Bowler Workload</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:720}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                <Th>Name</Th><Th>Type</Th><Th>Overs (7d)</Th><Th>Overs (28d)</Th><Th>Recovery days</Th><Th>Next-match limit</Th><Th>Flag</Th>
              </tr></thead>
              <tbody>
                {BOWLING_WORKLOAD.map((b,i)=>(
                  <tr key={b.name} style={{borderBottom:i<BOWLING_WORKLOAD.length-1?`1px solid ${C.border}`:'none',background:b.st==='red'?C.redDim:'transparent'}}>
                    <Td color={C.text}>
                      <div style={{fontWeight:600}}>{b.name}</div>
                      <div style={{fontSize:10,color:C.dim,marginTop:2}}>{b.note}</div>
                    </Td>
                    <Td>{b.type}</Td>
                    <Td color={b.ov7>45?C.red:b.ov7>35?C.amber:C.text}>{b.ov7}</Td>
                    <Td color={b.ov28>180?C.red:b.ov28>140?C.amber:C.text}>{b.ov28}</Td>
                    <Td color={b.recovery<=1?C.amber:C.text}>{b.recovery}d</Td>
                    <Td>{b.nextLimit}</Td>
                    <Td>
                      <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,color:flagColor(b.st),background:flagBg(b.st),textTransform:'uppercase'}}>{b.st}</span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div style={{display:'grid',gridTemplateColumns:'1.3fr 1fr',gap:12}}>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>ICC & ECB Workload Guidelines</div>
            <div style={{display:'grid',gap:10,fontSize:12,color:C.muted,lineHeight:1.6}}>
              <div><b style={{color:C.text}}>Fast bowlers · U19–U25:</b> max 6 overs per spell · 18 overs per day · 45 overs per week in red-ball windows.</div>
              <div><b style={{color:C.text}}>Fast bowlers · senior:</b> Acute:Chronic ratio target 0.8–1.3. Above 1.5 = stress-fracture / lumbar-load risk.</div>
              <div><b style={{color:C.text}}>Recovery hours:</b> min 48h between T20 spells, 72h post-match recovery after &gt;15 overs in red-ball.</div>
              <div><b style={{color:C.text}}>Return-to-play:</b> phased progression — nets → match-simulation → restricted spells → full availability.</div>
              <div><b style={{color:C.text}}>Spin bowlers:</b> no hard overs cap; monitor shoulder / knee / finger load individually.</div>
            </div>
          </Card>

          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Actions</div>
            <div style={{display:'flex',flexDirection:'column',gap:8,fontSize:12,color:C.muted,lineHeight:1.5}}>
              <div style={{padding:10,border:`1px solid ${C.redDim}`,borderRadius:8,background:C.redDim}}>
                <div style={{color:C.red,fontWeight:600,marginBottom:4}}>🚨 Dawson — Mandatory review</div>
                <div>Cap at 5-over spells next match. Book bone-scan (Wed 16:00). Not available for back-to-back fixtures.</div>
              </div>
              <div style={{padding:10,border:`1px solid ${C.amberDim}`,borderRadius:8,background:C.amberDim}}>
                <div style={{color:C.amber,fontWeight:600,marginBottom:4}}>⚠ Harrison — RTP progression</div>
                <div>Phase 3 of 4. Max 6 overs per innings until clinical sign-off.</div>
              </div>
              <div style={{padding:10,border:`1px solid ${C.border}`,borderRadius:8}}>
                <div style={{color:C.text,fontWeight:600,marginBottom:4}}>📋 Weekly workload review</div>
                <div>Medical + Head Coach sign-off every Monday · export to ECB Cricket Performance Hub.</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // ── MENTAL PERFORMANCE ─────────────────────────────────────────────
  const MENTAL_WELLBEING = [
    {name:'Daniel Webb',    last:'22 Apr',  score:8, flag:null, note:'Routine check-in — stable.'},
    {name:'Tom Fletcher',   last:'22 Apr',  score:7, flag:null, note:'Managing county-England balance.'},
    {name:'Marcus Cole',    last:'18 Apr',  score:5, flag:'amber', note:'Flagged — confidential 1:1 scheduled.'},
    {name:'Ryan Shaw',      last:'21 Apr',  score:9, flag:null, note:'Captaincy load normal.'},
    {name:'James Hill',     last:'20 Apr',  score:8, flag:null, note:'—'},
    {name:'Callum Price',   last:'22 Apr',  score:8, flag:null, note:'—'},
    {name:'Alex Merriman',    last:'19 Apr',  score:7, flag:null, note:'—'},
    {name:'Jake Harrison',  last:'22 Apr',  score:6, flag:'amber', note:'Return from injury — low mood markers.'},
    {name:'Sam Reed',       last:'21 Apr',  score:8, flag:null, note:'—'},
    {name:'Oliver Halden CCC',    last:'20 Apr',  score:7, flag:null, note:'—'},
    {name:'Chris Dawson',   last:'22 Apr',  score:7, flag:null, note:'Academy transition — well supported.'},
    {name:'Rajan Steenkamp',   last:'19 Apr',  score:7, flag:null, note:'Overseas adjustment.'},
  ];
  const MENTAL_SESSIONS = [
    {player:'Marcus Cole',  type:'1:1 Clinical',   practitioner:'Dr. P. Lawson',    date:'Wed 24 Apr · 14:00', mode:'Onsite (Welfare Office)'},
    {player:'Jake Harrison',type:'Return-to-Play',  practitioner:'Dr. P. Lawson',    date:'Thu 25 Apr · 11:00', mode:'Onsite'},
    {player:'Full squad',   type:'Pressure workshop',practitioner:'Sporting Chance', date:'Mon 29 Apr · 10:00', mode:'Onsite (Main meeting room)'},
  ];
  const MentalPerformance=()=>{
    const amber = MENTAL_WELLBEING.filter(p=>p.flag==='amber').length;
    return (
      <div>
        <SectionHead title="Mental Performance"
          sub="Wellbeing check-ins, flagged players, sessions, and team morale trend"/>

        <div style={{marginBottom:16,padding:'12px 14px',borderRadius:10,border:`1px solid ${C.purpleDim}`,background:C.purpleDim,color:C.purple,fontSize:12,lineHeight:1.5}}>
          🔒 <b>Confidential.</b> Information on this page is restricted to the Wellbeing Lead and Medical team.
          The Director sees aggregated data only. Clinical notes are never surfaced in the dashboard.
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
          <Stat label="Check-ins This Week" value={`${MENTAL_WELLBEING.length}/${MENTAL_WELLBEING.length}`} color={C.green} sub="100% completion"/>
          <Stat label="Flagged Players" value={`${amber} · Amber`} color={amber>0?C.amber:C.green} sub="0 red · supported"/>
          <Stat label="Sessions Booked" value={String(MENTAL_SESSIONS.length)} color={C.purple} sub="This week"/>
          <Stat label="Team Morale Trend" value="Stable" color={C.teal} sub="vs last 4 weeks"/>
        </div>

        <Card style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Player Wellbeing Board</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))',gap:8}}>
            {MENTAL_WELLBEING.map(p=>(
              <div key={p.name} style={{background:C.cardAlt,border:`1px solid ${p.flag==='amber'?C.amberDim:C.border}`,borderRadius:8,padding:12}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.text}}>{p.name}</div>
                  {p.flag && <span style={{padding:'2px 8px',borderRadius:12,fontSize:10,fontWeight:600,color:C.amber,background:C.amberDim,textTransform:'uppercase'}}>{p.flag}</span>}
                </div>
                <div style={{display:'flex',alignItems:'baseline',gap:6,marginBottom:4}}>
                  <div style={{fontSize:18,fontWeight:700,color:p.score>=7?C.green:p.score>=5?C.amber:C.red}}>{p.score}</div>
                  <div style={{fontSize:10,color:C.dim}}>/ 10 wellbeing</div>
                </div>
                <div style={{fontSize:10,color:C.dim,marginBottom:4}}>Last check-in: {p.last}</div>
                <div style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{p.note}</div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{display:'grid',gridTemplateColumns:'1.3fr 1fr',gap:12}}>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Upcoming Sessions</div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Player</Th><Th>Session</Th><Th>Practitioner</Th><Th>Date</Th><Th>Mode</Th></tr></thead>
              <tbody>
                {MENTAL_SESSIONS.map((s,i)=>(
                  <tr key={i} style={{borderBottom:i<MENTAL_SESSIONS.length-1?`1px solid ${C.border}`:'none'}}>
                    <Td color={C.text}>{s.player}</Td><Td>{s.type}</Td><Td>{s.practitioner}</Td><Td color={C.teal}>{s.date}</Td><Td>{s.mode}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Resources</div>
            <div style={{display:'flex',flexDirection:'column',gap:8,fontSize:12}}>
              <a href="#" style={{color:C.teal,textDecoration:'none',padding:'8px 10px',border:`1px solid ${C.border}`,borderRadius:6}}>🎯 Sporting Chance — Clinic & 24/7 helpline →</a>
              <a href="#" style={{color:C.teal,textDecoration:'none',padding:'8px 10px',border:`1px solid ${C.border}`,borderRadius:6}}>🏏 PCA — Player support services →</a>
              <a href="#" style={{color:C.teal,textDecoration:'none',padding:'8px 10px',border:`1px solid ${C.border}`,borderRadius:6}}>🏛 ECB Welfare & Safeguarding hub →</a>
              <a href="#" style={{color:C.teal,textDecoration:'none',padding:'8px 10px',border:`1px solid ${C.border}`,borderRadius:6}}>🧠 Team pressure workshop materials →</a>
              <div style={{fontSize:10,color:C.dim,marginTop:6,lineHeight:1.5}}>
                If a player is in distress outside of working hours, call the PCA 24/7 Personal Development Line immediately.
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // ── SPONSORSHIP PIPELINE (enhanced) ────────────────────────────────
  const SPONSORSHIP_TIERED = [
    {tier:'Naming Rights',    rows:[
      {n:'Midlands Bank',       val:'£1.8m/yr', exp:'Dec 2027', st:'active'},
    ]},
    {tier:'Shirt Front',      rows:[
      {n:'Brightline Telecoms', val:'£620k/yr', exp:'Oct 2026', st:'renewal-due'},
    ]},
    {tier:'Kit Partner',      rows:[
      {n:'Oakridge Apparel',             val:'£540k/yr', exp:'Jan 2028', st:'active'},
      {n:'City Motors',         val:'£180k/yr', exp:'Feb 2027', st:'active'},
    ]},
    {tier:'Ground Sponsor',   rows:[
      {n:'Apex Construction',   val:'£450k/yr', exp:'Sep 2026', st:'renewal-due'},
    ]},
    {tier:'Official Partners',rows:[
      {n:'NorthCo Energy',      val:'£240k/yr', exp:'Mar 2027', st:'active'},
      {n:'Acme Insurance',      val:'£210k/yr', exp:'Jul 2026', st:'renewal-due'},
      {n:'Oakridge Park Hotels',   val:'£140k/yr', exp:'Dec 2026', st:'active'},
      {n:'Riverside Spirits',   val:'£120k/yr', exp:'May 2027', st:'active'},
    ]},
    {tier:'Suppliers',        rows:[
      {n:'PitchPro Groundscare',val:'£60k/yr',  exp:'Aug 2026', st:'active'},
      {n:'Crownmark Cricket',   val:'£40k/yr',  exp:'Jan 2027', st:'active'},
      {n:'NutriFuel Sports',    val:'£38k/yr',  exp:'Apr 2027', st:'active'},
    ]},
  ];
  const SPONSORSHIP_PIPELINE_DEALS = [
    {name:'Pennine Mutual', stage:'Prospecting',  val:'£600k/yr', lik:'30%', note:'Headline partner exploratory · RFP not yet issued'},
    {name:'TechForge Ltd',              stage:'Negotiating',   val:'£180k/yr', lik:'65%', note:'Shirt-sleeve — drafting heads of terms this week'},
    {name:'Oakridge Park United',            stage:'Negotiating',   val:'£90k',     lik:'50%', note:'Cross-city partnership trial · 1-year'},
    {name:'FreshGrain Bakery',          stage:'Closed Won',    val:'£45k/yr',  lik:'100%',note:'Signed Fri — matchday food partner'},
    {name:'Velocity Wearables',         stage:'Closed Lost',   val:'£80k/yr',  lik:'0%',  note:'Chose Highford County · feedback: wanted London audience'},
  ];
  const SPONSORSHIP_RENEWAL_ALERTS = [
    {n:'Acme Insurance',      days:92,  status:'Renewal meeting not yet booked', sev:'red'},
    {n:'Apex Construction',   days:151, status:'Draft proposal out · awaiting response',sev:'amber'},
    {n:'Brightline Telecoms', days:180, status:'Draft proposal ready',           sev:'amber'},
  ];
  const sponsStatusBadge=(s:string)=>{
    if(s==='renewal-due') return <span style={{padding:'2px 8px',borderRadius:12,fontSize:10,fontWeight:600,color:C.amber,background:C.amberDim}}>RENEWAL DUE</span>;
    return <span style={{padding:'2px 8px',borderRadius:12,fontSize:10,fontWeight:600,color:C.green,background:C.greenDim}}>ACTIVE</span>;
  };
  const SponsorshipPipelineV2=()=>(
    <div>
      <SectionHead title="Sponsorship Pipeline"
        sub="Tiered sponsor portfolio, deals in flight, and renewal alerts"/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        <Stat label="Active Sponsors" value="12" color={C.teal} sub="Across 6 tiers"/>
        <Stat label="Annual Value" value="£4.7m" color={C.green} sub="Contract run-rate"/>
        <Stat label="Deals in Pipeline" value="4" color={C.amber} sub="£915k potential"/>
        <Stat label="Renewals Due Q3" value="3" color={C.red} sub="Next 6 months"/>
      </div>

      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Active Sponsors by Tier</div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {SPONSORSHIP_TIERED.map(g=>(
            <div key={g.tier}>
              <div style={{fontSize:11,fontWeight:700,color:C.purple,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{g.tier}</div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <tbody>
                  {g.rows.map((r,i)=>(
                    <tr key={r.n} style={{borderBottom:i<g.rows.length-1?`1px solid ${C.border}`:'none'}}>
                      <Td color={C.text}><b>{r.n}</b></Td>
                      <Td color={C.teal}>{r.val}</Td>
                      <Td>Expires {r.exp}</Td>
                      <Td>{sponsStatusBadge(r.st)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </Card>

      <div style={{display:'grid',gridTemplateColumns:'1.3fr 1fr',gap:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Pipeline</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Prospect</Th><Th>Stage</Th><Th>Value</Th><Th>Likelihood</Th><Th>Notes</Th></tr></thead>
            <tbody>
              {SPONSORSHIP_PIPELINE_DEALS.map((d,i)=>{
                const stColor = d.stage==='Closed Won'?C.green : d.stage==='Closed Lost'?C.red : d.stage==='Negotiating'?C.amber : C.teal;
                return (
                <tr key={d.name} style={{borderBottom:i<SPONSORSHIP_PIPELINE_DEALS.length-1?`1px solid ${C.border}`:'none'}}>
                  <Td color={C.text}>{d.name}</Td>
                  <Td><span style={{color:stColor,fontWeight:600}}>{d.stage}</span></Td>
                  <Td color={C.teal}>{d.val}</Td>
                  <Td>{d.lik}</Td>
                  <Td>{d.note}</Td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Renewal Alerts</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {SPONSORSHIP_RENEWAL_ALERTS.map(a=>{
              const color = a.sev==='red'?C.red:C.amber;
              const bg    = a.sev==='red'?C.redDim:C.amberDim;
              return (
                <div key={a.n} style={{padding:10,border:`1px solid ${bg}`,borderRadius:8,background:bg}}>
                  <div style={{color,fontWeight:600,fontSize:12,marginBottom:2}}>{a.n}</div>
                  <div style={{color:C.muted,fontSize:11}}>{a.days} days to expiry — {a.status}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );

  // ── AI INNINGS BRIEF ───────────────────────────────────────────────
  const AIInningsBrief=()=>{
    const insights = [
      'Webb–Shaw partnership (83 runs, 20 overs) — worth more than scoreboard suggests. Recommend retaining Webb when new ball taken at over 80.',
      'Opposition leg-spinner Singh conceded 58 off 12 — target with LH batters at 4–6. Promote Hill to 5 if Shaw falls before lunch.',
      'Pitch is softening — moisture almost gone. Expect seam movement to drop sharply after tea. Bat deep: session-by-session.',
      'Projected total 342 @ current run-rate 3.8/over. Declaration window opens around over 110 if RR holds (see planner).',
      'Bowling plan for opp innings: open Reed + Harrison · switch to Merriman at over 20 when ball softens · Halden CCC from the Kirkstall end.',
      'Weather: cloud cover 60% forecast after 16:00 — swing conditions may return for the final session. Adjust seamer rotation.',
    ];
    const oppWeaknesses = [
      {name:'Nathan Taylor',    weak:'LBW-prone on front pad to in-swing (4/last-6 dismissals)', matchup:'Reed full at middle stump'},
      {name:'Simon Pritchard',  weak:'Averages 18 vs off-spin; driven into short cover trap',    matchup:'Merriman with short cover + silly mid off'},
      {name:'James Holloway',   weak:'Struggles vs left-arm spin; 11% strike vs LAS last 12m',    matchup:'Halden CCC over the wicket · stock line on stumps'},
    ];
    return (
      <div>
        <SectionHead title="AI Innings Brief"
          sub="Generated between innings / at drinks — match situation, insights, and declaration guidance"/>

        <div style={{marginBottom:12,padding:'10px 14px',borderRadius:10,border:`1px solid ${C.purpleDim}`,background:C.purpleDim,color:C.purple,fontSize:11,display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:6}}>
          <span>🧠 AI-generated · refresh after each session. Pulls from Opposition Scout, Batting/Bowling Analytics and Declaration Planner.</span>
          <span style={{color:C.muted}}>Generated 14:22 · Day 1 · Tea interval</span>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
          <Stat label="Current Score" value="247/8" color={C.teal} sub="after 65 overs"/>
          <Stat label="Match Situation" value="Batting 1st · Day 1" color={C.purple} sub="vs Calderbrook CCC (H)"/>
          <Stat label="Partnership Alerts" value="2 flagged" color={C.amber} sub="Webb–Shaw · Cole–Hill"/>
          <Stat label="Wicket Clusters" value="3rd spell" color={C.red} sub="weakness identified overs 28–34"/>
        </div>

        <Card style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>AI Innings Summary</div>
          <ul style={{margin:0,paddingLeft:0,listStyle:'none',display:'flex',flexDirection:'column',gap:8}}>
            {insights.map((t,i)=>(
              <li key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:10,background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:8}}>
                <div style={{width:22,height:22,borderRadius:'50%',background:C.purpleDim,color:C.purple,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</div>
                <div style={{fontSize:12,color:C.text,lineHeight:1.55}}>{t}</div>
              </li>
            ))}
          </ul>
        </Card>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
          <Card>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em'}}>Declaration Window</div>
              <button onClick={()=>setPage('declaration')} style={{fontSize:10,color:C.teal,background:'transparent',border:'none',cursor:'pointer',padding:0}}>View full planner →</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10}}>
              <div style={{padding:10,background:C.cardAlt,borderRadius:8,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:10,color:C.dim,textTransform:'uppercase'}}>Runs above par</div>
                <div style={{fontSize:18,fontWeight:700,color:C.green}}>+42</div>
              </div>
              <div style={{padding:10,background:C.cardAlt,borderRadius:8,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:10,color:C.dim,textTransform:'uppercase'}}>Projected total</div>
                <div style={{fontSize:18,fontWeight:700,color:C.teal}}>342</div>
              </div>
              <div style={{padding:10,background:C.cardAlt,borderRadius:8,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:10,color:C.dim,textTransform:'uppercase'}}>Decl. window opens</div>
                <div style={{fontSize:18,fontWeight:700,color:C.amber}}>Over 110</div>
              </div>
            </div>
            <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>
              Recommended decl. target: <b style={{color:C.text}}>340–360</b> · 90 overs remaining at current rate. Weather buffer: -15 runs for Day 2 drizzle risk.
            </div>
          </Card>

          <Card>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em'}}>Opposition Weakness Panel</div>
              <button onClick={()=>setPage('opposition')} style={{fontSize:10,color:C.teal,background:'transparent',border:'none',cursor:'pointer',padding:0}}>View full scout →</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {oppWeaknesses.map((w,i)=>(
                <div key={i} style={{padding:10,background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:8}}>
                  <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:2}}>{w.name}</div>
                  <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{w.weak}</div>
                  <div style={{fontSize:11,color:C.teal}}>→ {w.matchup}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Cross-links</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button onClick={()=>setPage('opposition')} style={{padding:'6px 12px',borderRadius:20,border:`1px solid ${C.border}`,background:C.cardAlt,color:C.teal,fontSize:11,cursor:'pointer'}}>🔬 Opposition Scout →</button>
            <button onClick={()=>setPage('declaration')} style={{padding:'6px 12px',borderRadius:20,border:`1px solid ${C.border}`,background:C.cardAlt,color:C.teal,fontSize:11,cursor:'pointer'}}>📐 Declaration Planner →</button>
            <button onClick={()=>setPage('batting-analytics')} style={{padding:'6px 12px',borderRadius:20,border:`1px solid ${C.border}`,background:C.cardAlt,color:C.teal,fontSize:11,cursor:'pointer'}}>📊 Batting Analytics →</button>
            <button onClick={()=>setPage('bowling-analytics')} style={{padding:'6px 12px',borderRadius:20,border:`1px solid ${C.border}`,background:C.cardAlt,color:C.teal,fontSize:11,cursor:'pointer'}}>🎯 Bowling Analytics →</button>
          </div>
        </Card>
      </div>
    );
  };

  const pages={
    dashboard: isSponsor ? <CricketSponsorDashboard/> : <Dashboard/>,briefing:<Briefing/>,insights:<Insights/>,
    grounds:<Grounds/>,'media-hub':<MediaHub/>,operations:<Operations/>,
    'match-centre':<MatchCentre/>,'batting-analytics':<BattingAnalytics/>,'bowling-analytics':<BowlingAnalytics/>,
    'video-analysis':<VideoAnalysis/>,opposition:<Opposition/>,livescores:<LiveScores/>,'practice-log':<PracticeLog/>,declaration:<DeclarationPlanner/>,dls:<DLSCalculator/>,'fan-engagement':<FanEngagement/>,'performance-stats':<PerformanceStats/>,
    'ai-innings-brief':<AIInningsBrief/>,
    'bowling-workload':<BowlingWorkloadTracker/>,'mental-performance':<MentalPerformance/>,
    squad:<Squad/>,medical:<Medical/>,gps:<GPS/>,'gps-heatmaps':<GPSHeatmaps/>,pathway:<Pathway/>,overseas:<Overseas/>,'contract-hub':<ContractHub/>,'agent-pipeline':<AgentPipeline/>,signings:<SigningPipeline/>,'net-planner':<NetSessionPlanner/>,'match-report':<MatchReport/>,
    'county-championship':<CountyChampionship/>,'vitality-blast':<VitalityBlast/>,'od-cup':<OneDayCup/>,'the-hundred':<TheHundred/>,womens:<Womens/>,academy:<AcademyYouth/>,
    staff:<Staff/>,facilities:<FacilitiesGrounds/>,kit:<KitEquipment/>,travel:<TravelLogistics/>,'team-comms':<TeamComms/>,
    commercial:<Commercial/>,sponsorship:<SponsorshipPipelineV2/>,media:<MediaContentModule sport="cricket" accentColor="#a855f7" existingContentLabel="Cricket — Press Briefing Generator & Broadcast log" existingContent={<MediaContent/>} isDemoShell={session?.isDemoShell !== false} />,'ticket-matchday':<TicketMatchDay/>,
    board:<Board/>,compliance:<Compliance/>,edi:<EDIDashboard/>,safeguarding:<SafeguardingView/>,finance:<FinanceView/>,settings:<SettingsView/>,
    'tours-camps':<CricketToursAndCampsView preSeasonContent={<CricketPreSeasonView session={session}/>} />,
  };

  return(
    <div style={{display:'flex',minHeight:'100vh',background:C.bg,color:C.text,zoom:0.9}}>
      {/* Sidebar — floating when unpinned */}
      <aside
        className="hidden md:flex flex-col overflow-hidden"
        style={{
          width: sidebarExpanded ? 220 : 72,
          backgroundColor: C.sidebar,
          borderRight: `1px solid ${C.border}`,
          transition: 'width 250ms ease',
          position: 'sticky', top: 0, height: 'calc(100vh / 0.9)', flexShrink: 0, zIndex: 40,
        }}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}>

        <div className="flex items-center shrink-0" style={{ borderBottom: `1px solid ${C.border}`, minHeight: 56, padding: sidebarExpanded ? '12px 10px' : '12px 4px', gap: sidebarExpanded ? 8 : 0 }}>
          <div className="flex items-center gap-2 flex-1 min-w-0" style={{ justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? 4 : 0 }}>
            <img src="/badges/oakridge_cc_crest.svg" alt="Oakridge CC" style={{width:32,height:32,borderRadius:6,flexShrink:0,objectFit:'contain'}}/>
            {sidebarExpanded && <div><div style={{fontSize:13,fontWeight:700,color:C.text}}>Lumio Cricket</div><div style={{fontSize:10,color:C.dim}}>Oakridge CC</div></div>}
          </div>
          {sidebarExpanded && (
            <button onClick={toggleSidebarPin} className="shrink-0 p-1 rounded" style={{ color: sidebarPinned ? C.purple : '#4B5563', transform: sidebarPinned ? 'rotate(0deg)' : 'rotate(45deg)', transition: 'transform 200ms, color 200ms' }} title={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar open'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z"/></svg>
            </button>
          )}
        </div>

        <nav style={{flex:1,minHeight:0,overflowY:'auto',overflowX:'hidden',padding:'14px 10px',display:'flex',flexDirection:'column',gap:10}}>
          {SECTIONED_NAV.map((sec,si)=>{
            const filteredItems = roleConfig.sidebar === 'all' ? sec.items : sec.items.filter(item => (roleConfig.sidebar as string[]).includes(item.id))
            if (filteredItems.length === 0) return null
            return (
            <div key={sec.section}>
              {sidebarExpanded && (
                <div style={{padding:'0 8px 6px',fontSize:9.5,color:'rgba(255,255,255,0.42)',letterSpacing:'0.1em',textTransform:'uppercase',userSelect:'none'}}>{sec.section}</div>
              )}
              <div style={{display:'flex',flexDirection:'column',gap:1}}>
                {filteredItems.map(item=>{
                  const active = page===item.id
                  return (
                    <button key={item.id} onClick={()=>{setPage(item.id); if (!sidebarPinned) setSidebarHovered(false)}}
                      title={sidebarExpanded ? undefined : item.label}
                      style={{
                        display:'flex', alignItems:'center', gap:10,
                        padding: sidebarExpanded ? '6px 8px' : '6px 0',
                        borderRadius:6,
                        background: active ? '#3A6CA822' : 'transparent',
                        color: active ? '#E8EAEE' : 'rgba(232,234,238,0.64)',
                        boxShadow: active ? `inset 2px 0 0 #3A6CA8` : 'none',
                        border: 'none', cursor:'pointer',
                        textAlign:'left', width:'100%',
                        justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                        transition: 'background .12s, color .12s',
                      }}>
                      <V2Icon name={item.icon || 'dot'} size={13} stroke={1.6} style={{ color: active ? '#3A6CA8' : 'rgba(232,234,238,0.42)', flexShrink: 0 }} />
                      {sidebarExpanded && <span style={{flex:1,fontSize:12.5}}>{item.label}</span>}
                      {sidebarExpanded && item.badge && (
                        <span style={{fontSize:9,padding:'1px 5px',borderRadius:3,background:'#3A6CA8',color:'#0E1014',fontWeight:700,letterSpacing:'0.04em'}}>{item.badge}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
            )
          })}
        </nav>

        {session && (
          <div style={{ flexShrink: 0 }}>
          <RoleSwitcher
            session={liveSession ?? session}
            roles={CRICKET_ROLES}
            accentColor="#b45309"
            onRoleChange={(role) => {
              setRoleOverride(role)
              // Reset `page` to the new role's first allowed nav item so we
              // never render content from a tab the new role can't see.
              const newConfig = CRICKET_ROLE_CONFIG[role as keyof typeof CRICKET_ROLE_CONFIG]
              if (newConfig) {
                const allFlat = SECTIONED_NAV.flatMap(s => s.items)
                const firstAllowed = newConfig.sidebar === 'all'
                  ? allFlat[0]?.id
                  : newConfig.sidebar[0]
                if (firstAllowed) setPage(firstAllowed)
              }
              const key = 'lumio_cricket_demo_session'
              const stored = localStorage.getItem(key)
              if (stored) { const parsed = JSON.parse(stored); localStorage.setItem(key, JSON.stringify({ ...parsed, role })) }
            }}
            sidebarCollapsed={!sidebarExpanded}
          />
          </div>
        )}

        {/* Sidebar footer logo removed — redundant brand mark inside
            Lumio's own product. Bottom of sidebar ends at role selector. */}
      </aside>

      {/* Content */}
      <div style={{flex:1, minHeight:'100vh', minWidth:0}}>
        {/* Demo workspace banner */}
        <div className="flex items-center justify-between px-6 py-2 text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#FBBF24', color: '#000000' }}>
          <span>This is a demo · sample data</span>
          <a href="/sports-signup" className="flex items-center gap-1 hover:underline font-semibold" style={{ color: '#000000' }}>Apply for your free founding access → lumiosports.com/sports-signup</a>
        </div>
        {/* Role banner */}
        {!isDirector && !isSponsor && (
          <div className="flex items-center gap-2 px-6 py-2 text-xs" style={{ backgroundColor: `${roleConfig.accent}12`, borderBottom: `1px solid ${roleConfig.accent}25` }}>
            <span>{roleConfig.icon}</span>
            <span style={{ color: roleConfig.accent }}>Viewing as <strong>{roleConfig.label}</strong>{roleConfig.message ? ` — ${roleConfig.message}` : ''}</span>
          </div>
        )}
        <div style={{padding:'24px 28px'}}>
          {(pages as Record<string,React.ReactNode>)[page]||<Dashboard/>}
        </div>
      </div>
    </div>
  );
}


export default function CricketPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return (
    <SportsDemoGate
      sport="cricket"
      defaultClubName="Oakridge CC"
      defaultSlug={slug}
      accentColor="#b45309"
      accentColorLight="#d97706"
      sportEmoji="🏏"
      sportLabel="Lumio Cricket"
      roles={CRICKET_ROLES}
    >
      {(session) => <CricketPortalInner session={session} slug={slug} />}
    </SportsDemoGate>
  )
}
