'use client'

import { use, useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, ReferenceLine, Cell } from 'recharts';
import { SportsDemoGate, RoleSwitcher } from '@/components/sports-demo'
import type { SportsDemoSession } from '@/components/sports-demo'


export const CRICKET_ROLES = [
  { id: 'chairman',   label: 'Club Chairman',   icon: '🏛️', description: 'Board & strategy'    },
  { id: 'manager',    label: 'Club Manager',     icon: '🏏', description: 'Full club view'       },
  { id: 'captain',    label: 'Club Captain',     icon: '🏆', description: 'Squad & fixtures'     },
  { id: 'head_coach', label: 'Head Coach',       icon: '🎯', description: 'Coaching & analytics' },
  { id: 'commercial', label: 'Commercial',       icon: '💼', description: 'Sponsors & events'    },
  { id: 'secretary',  label: 'Club Secretary',   icon: '📋', description: 'Admin & compliance'   },
]

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
  {id:7,n:'Alex Morgan',r:'Off Spinner',age:33,ch:true,t2:false,od:true,hu:false,st:'fit',load:58},
  {id:8,n:'Jake Harrison',r:'Fast Bowler',age:24,ch:true,t2:true,od:true,hu:true,st:'injury',load:0,note:'Hamstring — 70% — physio clearance Wed 8 Apr'},
  {id:9,n:'Sam Reed',r:'Fast Bowler',age:27,ch:true,t2:true,od:true,hu:true,st:'fit',load:83},
  {id:10,n:'Oliver Kent',r:'Left-Arm Spin',age:29,ch:true,t2:true,od:false,hu:false,st:'fit',load:61},
  {id:11,n:'Chris Dawson',r:'Fast Bowler',age:22,ch:true,t2:false,od:false,hu:false,st:'monitoring',load:45,note:'A:C ratio 1.62 — cap workload this block'},
  {id:12,n:'Rajan Nortje',r:'Fast Bowler',age:30,ch:true,t2:false,od:true,hu:false,st:'fit',load:77,os:true,osNote:'Arrives Thu — SA'},
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
  {n:'Rajan Nortje',sleep:8.5,energy:9,soreness:2,mood:9,score:9.0},
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
  {n:'Tom Bailey',r:'Academy Coach',exp:'Jun 2026',st:'expiring'},
  {n:'Phil Grant',r:'Academy Coach',exp:'Apr 2026',st:'urgent'},
  {n:'Sarah Cooper',r:'Physiotherapist',exp:'Feb 2027',st:'valid'},
  {n:'Mark Evans',r:'S&C Coach',exp:'Aug 2026',st:'valid'},
  {n:'Julie Park',r:'Academy Volunteer',exp:'Mar 2026',st:'expired'},
];

const OVERSEAS=[
  {n:'Rajan Nortje',country:'South Africa',formats:'Championship, One Day Cup',visa:'Work Permit — Confirmed',arrives:'Thu 9 Apr 2026',agent:'Titan Sports Mgmt',st:'confirmed'},
  {n:'Brett Mason',country:'Australia',formats:'T20 Blast, The Hundred',visa:'Tier 5 — Pending Home Office',arrives:'Est. 14 Apr 2026',agent:'Southern Cross Cricket',st:'pending'},
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
  {id:1,name:'Adam Lyth',age:37,role:'Batter',nationality:'England',format:'Red-ball',battingAvg:41.2,bowlingAvg:null,fitness:'fit',contractEnd:'2026'},
  {id:2,name:'Harry Brook',age:26,role:'Batter',nationality:'England',format:'All',battingAvg:52.8,bowlingAvg:null,fitness:'fit',contractEnd:'2027'},
  {id:3,name:'Dawid Malan',age:38,role:'Batter',nationality:'England',format:'All',battingAvg:44.1,bowlingAvg:null,fitness:'monitoring',contractEnd:'2026'},
  {id:4,name:'Jonny Bairstow',age:36,role:'WK',nationality:'England',format:'All',battingAvg:39.6,bowlingAvg:null,fitness:'fit',contractEnd:'2027'},
  {id:5,name:'Jonathan Tattersall',age:31,role:'WK',nationality:'England',format:'All',battingAvg:30.1,bowlingAvg:null,fitness:'fit',contractEnd:'2026'},
  {id:6,name:'George Hill',age:25,role:'Allrounder',nationality:'England',format:'All',battingAvg:34.2,bowlingAvg:28.7,fitness:'fit',contractEnd:'2028'},
  {id:7,name:'Jordan Thompson',age:29,role:'Allrounder',nationality:'England',format:'White-ball',battingAvg:26.8,bowlingAvg:31.5,fitness:'fit',contractEnd:'2026'},
  {id:8,name:'Dom Bess',age:29,role:'Bowler',nationality:'England',format:'Red-ball',battingAvg:18.2,bowlingAvg:32.4,fitness:'fit',contractEnd:'2027'},
  {id:9,name:'Ben Coad',age:32,role:'Bowler',nationality:'England',format:'Red-ball',battingAvg:12.1,bowlingAvg:24.8,fitness:'fit',contractEnd:'2026'},
  {id:10,name:'Matthew Fisher',age:28,role:'Bowler',nationality:'England',format:'All',battingAvg:14.6,bowlingAvg:27.2,fitness:'monitoring',contractEnd:'2027'},
  {id:11,name:'Jack Shutt',age:29,role:'Bowler',nationality:'England',format:'White-ball',battingAvg:9.8,bowlingAvg:29.1,fitness:'fit',contractEnd:'2026'},
  {id:12,name:'Dom Leech',age:25,role:'Bowler',nationality:'England',format:'Red-ball',battingAvg:11.4,bowlingAvg:30.6,fitness:'injured',contractEnd:'2027'},
  {id:13,name:'Will Luxton',age:23,role:'Batter',nationality:'England',format:'All',battingAvg:32.8,bowlingAvg:null,fitness:'fit',contractEnd:'2027'},
  {id:14,name:'Fin Bean',age:25,role:'Batter',nationality:'England',format:'Red-ball',battingAvg:38.9,bowlingAvg:null,fitness:'fit',contractEnd:'2026'},
  {id:15,name:'James Wharton',age:24,role:'Batter',nationality:'England',format:'All',battingAvg:35.4,bowlingAvg:null,fitness:'fit',contractEnd:'2028'},
  {id:16,name:'Mickey Edwards',age:30,role:'Bowler',nationality:'Australia',format:'White-ball',battingAvg:8.2,bowlingAvg:25.9,fitness:'fit',contractEnd:'2026'},
  {id:17,name:'Shan Masood',age:36,role:'Batter',nationality:'Pakistan',format:'Red-ball',battingAvg:45.6,bowlingAvg:null,fitness:'fit',contractEnd:'2026'},
  {id:18,name:'Matty Revis',age:24,role:'Allrounder',nationality:'England',format:'All',battingAvg:29.7,bowlingAvg:33.8,fitness:'fit',contractEnd:'2027'},
];

type CricketFixture={id:number;date:string;competition:string;opponent:string;venue:string;homeAway:'H'|'A';format:'4-day'|'T20'|'OD'};
const CRICKET_FIXTURES:CricketFixture[]=[
  {id:1,date:'Fri 11 Apr',competition:'County Championship',opponent:'Lancashire',venue:'Headingley',homeAway:'H',format:'4-day'},
  {id:2,date:'Tue 22 Apr',competition:'County Championship',opponent:'Surrey',venue:'The Oval',homeAway:'A',format:'4-day'},
  {id:3,date:'Fri 2 May',competition:'County Championship',opponent:'Essex',venue:'Headingley',homeAway:'H',format:'4-day'},
  {id:4,date:'Sun 18 May',competition:'Metro Bank One Day Cup',opponent:'Durham',venue:'Headingley',homeAway:'H',format:'OD'},
  {id:5,date:'Wed 28 May',competition:'Metro Bank One Day Cup',opponent:'Notts',venue:'Trent Bridge',homeAway:'A',format:'OD'},
  {id:6,date:'Fri 6 Jun',competition:'Vitality Blast',opponent:'Warwickshire',venue:'Headingley',homeAway:'H',format:'T20'},
  {id:7,date:'Sun 8 Jun',competition:'Vitality Blast',opponent:'Lancashire',venue:'Old Trafford',homeAway:'A',format:'T20'},
  {id:8,date:'Fri 13 Jun',competition:'Vitality Blast',opponent:'Derbyshire',venue:'Headingley',homeAway:'H',format:'T20'},
];

type CricketResult={id:number;date:string;competition:string;opponent:string;homeAway:'H'|'A';score:string;oppScore:string;result:'W'|'L'|'D';format:string};
const CRICKET_RESULTS:CricketResult[]=[
  {id:1,date:'4 Apr',competition:'Friendly',opponent:'Durham MCCU',homeAway:'H',score:'412/7d',oppScore:'198 & 204',result:'W',format:'4-day'},
  {id:2,date:'28 Mar',competition:'Pre-season',opponent:'Leeds/Bradford',homeAway:'H',score:'286/6',oppScore:'241',result:'W',format:'OD'},
  {id:3,date:'22 Mar',competition:'Pre-season',opponent:'Yorkshire 2nd XI',homeAway:'H',score:'348',oppScore:'352/8',result:'L',format:'OD'},
  {id:4,date:'15 Sep 2025',competition:'County Championship',opponent:'Warwickshire',homeAway:'A',score:'388 & 221/4d',oppScore:'342 & 198',result:'W',format:'4-day'},
  {id:5,date:'5 Sep 2025',competition:'County Championship',opponent:'Somerset',homeAway:'H',score:'312 & 288',oppScore:'412 & 190/3',result:'L',format:'4-day'},
];

type CricketStaff={id:number;name:string;role:string;department:string;dbs:'valid'|'expiring'|'expired';dbsExpiry:string};
const CRICKET_STAFF_EXT:CricketStaff[]=[
  {id:1,name:'Ottis Gibson',role:'Head Coach',department:'Cricket',dbs:'valid',dbsExpiry:'Sep 2027'},
  {id:2,name:'Andrew Gale',role:'Assistant Coach',department:'Cricket',dbs:'valid',dbsExpiry:'May 2027'},
  {id:3,name:'Ian Dews',role:'Academy Director',department:'Pathway',dbs:'expiring',dbsExpiry:'Jun 2026'},
  {id:4,name:'Richard Pyrah',role:'Bowling Coach',department:'Cricket',dbs:'valid',dbsExpiry:'Feb 2028'},
  {id:5,name:'Kunwar Bansil',role:'Batting Coach',department:'Cricket',dbs:'valid',dbsExpiry:'Nov 2027'},
  {id:6,name:'Dr Nick Peirce',role:'Club Doctor',department:'Medical',dbs:'valid',dbsExpiry:'Aug 2027'},
  {id:7,name:'Kunle Odetoyinbo',role:'Head Physio',department:'Medical',dbs:'valid',dbsExpiry:'Jan 2028'},
  {id:8,name:'Sarah Hampson',role:'Safeguarding Lead',department:'Operations',dbs:'valid',dbsExpiry:'Mar 2028'},
  {id:9,name:'Darren Gough',role:'Director of Cricket',department:'Cricket',dbs:'valid',dbsExpiry:'Oct 2027'},
  {id:10,name:'Phil Grant',role:'Academy Volunteer',department:'Pathway',dbs:'expired',dbsExpiry:'Jan 2026'},
];

type TravelTrip={id:number;dest:string;date:string;nights:number;budget:number;transport:string};
const CRICKET_TRIPS:TravelTrip[]=[
  {id:1,dest:'The Oval, London',date:'22 Apr',nights:4,budget:18400,transport:'Coach + Hotel'},
  {id:2,dest:'Trent Bridge, Nottingham',date:'28 May',nights:2,budget:9800,transport:'Coach + Hotel'},
  {id:3,dest:'Old Trafford, Manchester',date:'8 Jun',nights:1,budget:4200,transport:'Coach'},
  {id:4,dest:'Taunton, Somerset',date:'20 Jun',nights:4,budget:21600,transport:'Coach + Hotel'},
  {id:5,dest:'Chester-le-Street, Durham',date:'4 Jul',nights:2,budget:8900,transport:'Coach + Hotel'},
];

type Contract={player:string;type:string;expiry:string;wage:number;agent:string};
const CRICKET_CONTRACTS:Contract[]=[
  {player:'Harry Brook',type:'Central + County',expiry:'Sep 2027',wage:450000,agent:'ISM'},
  {player:'Adam Lyth',type:'County',expiry:'Sep 2026',wage:120000,agent:'AGI Sport'},
  {player:'Dawid Malan',type:'County',expiry:'Sep 2026',wage:180000,agent:'Phoenix'},
  {player:'Ben Coad',type:'County',expiry:'Sep 2026',wage:95000,agent:'Saracens'},
  {player:'Jack Shutt',type:'County',expiry:'Sep 2026',wage:62000,agent:'—'},
  {player:'Shan Masood',type:'Overseas',expiry:'Sep 2026',wage:85000,agent:'PMG'},
];

type Facility={name:string;type:string;status:string;lastCheck:string};
const CRICKET_FACILITIES:Facility[]=[
  {name:'Headingley Main Pitch',type:'Pitch',status:'Excellent',lastCheck:'5 Apr'},
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
  {id:1,title:'Brook 198* vs Lancashire — innings',dur:'12:42',type:'Match Footage',tags:['batting','brook']},
  {id:2,title:'Coad 5-fer vs Surrey — spell analysis',dur:'8:14',type:'Match Footage',tags:['bowling','coad']},
  {id:3,title:'Bouncer drill — indoor nets 3 Apr',dur:'24:08',type:'Training',tags:['training','bowling']},
  {id:4,title:'Lancs top-order weakness report',dur:'6:52',type:'Opposition',tags:['scout','lancs']},
  {id:5,title:'March highlights reel',dur:'3:21',type:'Highlights',tags:['media','highlights']},
];

const CRICKET_COMMS=[
  {id:1,author:'Ottis Gibson',role:'Head Coach',time:'08:12',msg:'Team meeting 9:30 in the pavilion — selection for Friday announced.'},
  {id:2,author:'Kunle Odetoyinbo',role:'Physio',time:'Yesterday',msg:'Leech scan results in — 4 week rehab, no return-to-play before 5 May.'},
  {id:3,author:'Darren Gough',role:'DoC',time:'Yesterday',msg:'Brook available full season — ECB rest window confirmed.'},
  {id:4,author:'Comms',role:'Media',time:'2 days ago',msg:'Sky Sports will broadcast the Lancashire opener. Media training Thu 2pm.'},
];

const CHAMPIONSHIP_TABLE=[
  {team:'Surrey',p:3,w:2,d:1,l:0,bonus:12,pts:62},
  {team:'Yorkshire',p:3,w:2,d:1,l:0,bonus:11,pts:61},
  {team:'Somerset',p:3,w:2,d:0,l:1,bonus:10,pts:54},
  {team:'Essex',p:3,w:1,d:2,l:0,bonus:11,pts:49},
  {team:'Nottinghamshire',p:3,w:1,d:1,l:1,bonus:9,pts:41},
  {team:'Durham',p:3,w:1,d:1,l:1,bonus:8,pts:40},
  {team:'Warwickshire',p:3,w:0,d:2,l:1,bonus:7,pts:27},
  {team:'Hampshire',p:3,w:0,d:1,l:2,bonus:5,pts:17},
];

const BLAST_NORTH=[
  {team:'Lancashire',p:4,w:3,l:1,nrr:1.24,pts:6},
  {team:'Yorkshire',p:4,w:3,l:1,nrr:0.88,pts:6},
  {team:'Durham',p:4,w:2,l:2,nrr:0.41,pts:4},
  {team:'Notts',p:4,w:2,l:2,nrr:0.18,pts:4},
  {team:'Birmingham',p:4,w:2,l:2,nrr:-0.02,pts:4},
  {team:'Worcestershire',p:4,w:2,l:2,nrr:-0.31,pts:4},
  {team:'Derbyshire',p:4,w:1,l:3,nrr:-0.64,pts:2},
  {team:'Leicestershire',p:4,w:1,l:3,nrr:-0.82,pts:2},
  {team:'Northamptonshire',p:4,w:0,l:4,nrr:-1.12,pts:0},
];

const NAV=[
  {id:'briefing',label:'Morning Briefing',icon:'☀'},
];
const SECTIONED_NAV:{section:string;items:{id:string;label:string;icon:string;badge?:string}[]}[]=[
  {section:'OVERVIEW',items:[
    {id:'dashboard',label:'Dashboard',icon:'🏠'},
    {id:'briefing',label:'Morning Briefing',icon:'☀'},
  ]},
  {section:'PERFORMANCE',items:[
    {id:'match-centre',label:'Match Centre',icon:'🏏'},
    {id:'batting-analytics',label:'Batting Analytics',icon:'📊'},
    {id:'bowling-analytics',label:'Bowling Analytics',icon:'🎯'},
    {id:'video-analysis',label:'Video Analysis',icon:'🎬'},
    {id:'opposition',label:'Opposition Scout',icon:'🔬'},
    {id:'livescores',label:'Live Scores',icon:'📡'},
    {id:'practice-log',label:'Practice Log',icon:'📋'},
    {id:'declaration',label:'Declaration Planner',icon:'📐'},
    {id:'dls',label:'D/L Calculator',icon:'🌧️'},
    {id:'net-planner',label:'Net Session Planner',icon:'🏋️'},
    {id:'performance-stats',label:'Performance Stats',icon:'⭐'},
    {id:'match-report',label:'Match Report',icon:'📄'},
  ]},
  {section:'SQUAD',items:[
    {id:'squad',label:'Squad Manager',icon:'👥'},
    {id:'medical',label:'Medical Hub',icon:'🏥'},
    {id:'gps',label:'GPS Tracking',icon:'📡',badge:'NEW'},
    {id:'pathway',label:'Player Pathway',icon:'🎓'},
    {id:'overseas',label:'Overseas Players',icon:'✈'},
    {id:'contract-hub',label:'Contract Hub',icon:'📝'},
    {id:'agent-pipeline',label:'Agent Pipeline',icon:'🤝'},
    {id:'signings',label:'Signing Pipeline',icon:'🎯'},
  ]},
  {section:'COMPETITIONS',items:[
    {id:'county-championship',label:'County Championship',icon:'🏆'},
    {id:'vitality-blast',label:'Vitality Blast',icon:'⚡'},
    {id:'od-cup',label:'One Day Cup',icon:'🥇'},
    {id:'the-hundred',label:'The Hundred',icon:'💯'},
    {id:'womens',label:"Women's Cricket",icon:'🏏'},
    {id:'academy',label:'Academy & Youth',icon:'🎓'},
  ]},
  {section:'OPERATIONS',items:[
    {id:'staff',label:'Staff & HR',icon:'👤'},
    {id:'facilities',label:'Facilities & Grounds',icon:'🏟'},
    {id:'kit',label:'Kit & Equipment',icon:'👕'},
    {id:'travel',label:'Travel & Logistics',icon:'✈'},
    {id:'team-comms',label:'Team Comms',icon:'💬'},
    {id:'preseason',label:'Pre-Season',icon:'🏏',badge:'NEW'},
  ]},
  {section:'COMMERCIAL',items:[
    {id:'commercial',label:'Commercial',icon:'💼'},
    {id:'sponsorship',label:'Sponsorship Pipeline',icon:'🤝'},
    {id:'media',label:'Media & Content',icon:'📱'},
    {id:'ticket-matchday',label:'Ticket & Match Day',icon:'🎟'},
    {id:'fan-engagement',label:'Fan Engagement',icon:'🎟️'},
  ]},
  {section:'GOVERNANCE',items:[
    {id:'board',label:'Board Suite',icon:'📊'},
    {id:'compliance',label:'ECB Compliance',icon:'📋'},
    {id:'edi',label:'EDI Dashboard',icon:'🌍'},
    {id:'safeguarding',label:'Safeguarding',icon:'🛡'},
    {id:'finance',label:'Finance',icon:'💰'},
    {id:'settings',label:'Settings',icon:'⚙'},
  ]},
];
void NAV;

const fmt=(n:number)=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n);
const pct=(a:number,b:number)=>Math.round((a/b)*100);

const FAN_DATA = {
  membership: { total: 8240, target: 9000, renewalRate: 84, newThisSeason: 620 },
  attendance: [
    { match: 'vs Durham MCCU', att: 3200, cap: 18350, format: '4-day' },
    { match: 'vs Essex (CC)', att: 8400, cap: 18350, format: '4-day', projected: true },
    { match: 'vs Lancashire (CC)', att: 17200, cap: 18350, format: '4-day', projected: true },
    { match: 'vs Warwicks (T20)', att: 14800, cap: 18350, format: 'T20' },
    { match: 'vs Durham (OD)', att: 6200, cap: 18350, format: 'OD' },
  ] as Array<{match:string;att:number;cap:number;format:string;projected?:boolean}>,
  social: { twitter: 48200, instagram: 62400, facebook: 31800, tiktok: 18600, engagementRate: 4.1 },
  nps: { score: 67, promoters: 72, passives: 18, detractors: 10 },
  seasonTickets: { sold: 6840, target: 7500, renewedEarly: 5210, newBuyers: 820 },
};

const SIGNING_PIPELINE = [
  { id:1, name:'Marcus Bailey',  role:'Fast Bowler',    age:23, county:'Leicestershire', col:'Identified',  value:'£65k/yr',        agent:'AGI Sport',      notes:'Academy product — wants first team cricket', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id:2, name:'Jordan Hayes',   role:'Opening Batter', age:26, county:'Northants',      col:'Approached',  value:'£90k/yr',        agent:'Phoenix Sports', notes:'Out of contract Sep 2026 — interested in move north', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id:3, name:'Arjun Singh',    role:'Leg Spinner',    age:28, county:'Middlesex',      col:'Approached',  value:'£75k/yr',        agent:'—',              notes:'Self-represented. Championship specialist.', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id:4, name:'Kyle Petersen',  role:'All-Rounder',    age:30, county:'Cape Town',      col:'Negotiating', value:'£95k + OS slot', agent:'Titan Sports',   notes:'SA passport — would use overseas slot. T20 + OD.', flag:'🇿🇦' },
  { id:5, name:'Tom Hendricks',  role:'WK-Batter',      age:24, county:'Kent',           col:'Negotiating', value:'£72k/yr',        agent:'ISM',            notes:'Strong Championship avg 36.4. Long-term Bairstow cover.', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id:6, name:'Dev Sharma',     role:'Off Spinner',    age:29, county:'Warwickshire',   col:'Done',        value:'£68k/yr',        agent:'Elite Cricket',  notes:'Signed for 2027 — red-ball specialist, 3-year deal.', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id:7, name:'Lee Clifford',   role:'Seam Bowler',    age:22, county:'—',              col:'Failed',      value:'£55k/yr',        agent:'—',              notes:'Released by Durham — signed Nottinghamshire instead.', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
];

// ─── CRICKET PRE-SEASON / TOUR PREP CAMP VIEW ────────────────────────────────
function CricketPreSeasonView() {
  const SK = 'lumio_cricket_preseason'
  const [camp, setCamp] = useState<{ opener: string; opposition: string; squad: number; isAway: boolean; destination: string } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ opener: '', opposition: '', squad: '18', isAway: false, destination: '' })
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiHighlights, setAiHighlights] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const today2 = new Date().toISOString().split('T')[0]
  const checklistKey = `${SK}_checklist_${today2}`
  const [checklist, setChecklist] = useState<boolean[]>(() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem(checklistKey) : null; return s ? JSON.parse(s) : Array(8).fill(false) } catch { return Array(8).fill(false) } })
  useEffect(() => { localStorage.setItem(checklistKey, JSON.stringify(checklist)) }, [checklist, checklistKey])
  const [fitnessTests, setFitnessTests] = useState<string[]>(() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem(`${SK}_fitness`) : null; return s ? JSON.parse(s) : ['progress','pass','warn','progress','progress'] } catch { return ['progress','pass','warn','progress','progress'] } })
  useEffect(() => { localStorage.setItem(`${SK}_fitness`, JSON.stringify(fitnessTests)) }, [fitnessTests])
  const [overs, setOvers] = useState(34)
  const [tactical, setTactical] = useState<boolean[]>(() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem(`${SK}_tactical`) : null; return s ? JSON.parse(s) : Array(8).fill(false) } catch { return Array(8).fill(false) } })
  useEffect(() => { localStorage.setItem(`${SK}_tactical`, JSON.stringify(tactical)) }, [tactical])
  const [warmups, setWarmups] = useState<{opp:string;score:string;notes:string;result:'W'|'D'|'L'}[]>(() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem(`${SK}_warmups`) : null; return s ? JSON.parse(s) : [{opp:'Durham MCCU',score:'412/7d vs 189',notes:'Brook 156*, Coad 4-38',result:'W'}] } catch { return [{opp:'Durham MCCU',score:'412/7d vs 189',notes:'Brook 156*, Coad 4-38',result:'W'}] } })
  useEffect(() => { localStorage.setItem(`${SK}_warmups`, JSON.stringify(warmups)) }, [warmups])
  useEffect(() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem(SK) : null; if (s) setCamp(JSON.parse(s)) } catch {} }, [])
  const activate = () => { const c2 = { opener: form.opener, opposition: form.opposition, squad: parseInt(form.squad), isAway: form.isAway, destination: form.destination }; setCamp(c2); localStorage.setItem(SK, JSON.stringify(c2)); setShowModal(false) }
  const deactivate = () => { setCamp(null); localStorage.removeItem(SK) }
  const daysTo = camp ? Math.max(0, Math.ceil((new Date(camp.opener).getTime() - Date.now()) / 86400000)) : 0
  const totalDays = camp ? Math.max(1, daysTo + 30) : 30
  const pctRemaining = camp ? daysTo / totalDays : 1
  const phase = pctRemaining > 0.66 ? 'Fitness Block' : pctRemaining > 0.33 ? 'Skills Block' : 'Match Sharpness'
  const phaseColor = pctRemaining > 0.66 ? '#3B82F6' : pctRemaining > 0.33 ? '#F59E0B' : '#22C55E'
  useEffect(() => { if (!camp) return; setAiLoading(true); const tourNote = camp.isAway ? `, away tour to ${camp.destination}` : ''; Promise.all([fetch('/api/ai/cricket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:500,messages:[{role:'user',content:`Cricket pre-season AI summary for director/head coach. Opening fixture vs ${camp.opposition}, ${daysTo} days remaining, ${phase} phase, squad of ${camp.squad}${tourNote}. 6 bullet points: squad fitness, batting readiness, bowling workload, fielding sharpness, injury concerns, one watch-out. No intro.`}]})}).then(r=>r.json()).then(d=>setAiSummary(d.content?.[0]?.text||null)).catch(()=>{}),fetch('/api/ai/cricket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:300,messages:[{role:'user',content:`5 urgent pre-season action items for cricket director, ${daysTo} days from opener vs ${camp.opposition} in ${phase} phase${tourNote}. Cover: fitness gaps, batting concerns, bowling load, fielding issues, conditions prep. No intro.`}]})}).then(r=>r.json()).then(d=>setAiHighlights(d.content?.[0]?.text||null)).catch(()=>{})]).finally(()=>setAiLoading(false)); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camp?.opener])
  const readinessScores = [{label:'Fitness Base',score:71},{label:'Batting Sharpness',score:58},{label:'Bowling Fitness',score:65},{label:'Fielding & Catching',score:72},{label:'Match Sharpness',score:44},{label:'Acclimatisation',score:camp?.isAway?50:85}]
  const overallScore = Math.round(readinessScores.reduce((a,s)=>a+s.score,0)/readinessScores.length)
  const scoreColor = (s: number) => s >= 80 ? '#22C55E' : s >= 60 ? '#F59E0B' : '#EF4444'
  const checklistItems = ['Morning gym & fitness','Batting nets session','Bowling spell & workload','Fielding & catching drills','Team tactics session','Recovery & physio','Video opposition analysis','Nutrition & hydration logged']
  const completedChecklist = checklist.filter(Boolean).length
  const fitnessTestData = [{label:'Bleep Test (VO2 Max)',target:'Level 12'},{label:'Sprint 20m',target:'<3.1s'},{label:'Throw velocity',target:'>85km/h'},{label:'Bowling workload (overs/week)',target:'60 overs'},{label:'Recovery Score (HRV)',target:'>80'}]
  const baseTactical = ['Home pitch conditions studied','Opposition batting patterns analysed','Bowling plans per batsman agreed','Fielding placements set','Toss strategy discussed']
  const awayTactical = ['Pitch type researched (spin/pace/bounce)','Altitude/heat acclimatisation plan set','Local conditions briefing done']
  const allTactical = camp?.isAway ? [...baseTactical, ...awayTactical] : baseTactical

  if (!camp) return (
    <div className="space-y-6"><div className="rounded-2xl p-12 text-center" style={{backgroundColor:C.card,border:`1px solid ${C.border}`}}><div className="text-6xl mb-4">🏏</div><h2 className="text-2xl font-black mb-2" style={{color:C.text}}>Pre-Season Camp Mode</h2><p className="text-lg mb-2" style={{color:C.amber}}>Prepare the squad. Read the conditions. Win the series.</p><p className="text-sm max-w-lg mx-auto mb-8" style={{color:C.muted}}>Activate pre-season and Lumio tracks every session, fitness test, bowling workload, batting sharpness and conditions readiness — all the way to your opening fixture.</p><button onClick={()=>setShowModal(true)} className="px-8 py-3 rounded-xl text-sm font-bold" style={{backgroundColor:C.amber,color:'#07080F'}}>Activate Pre-Season →</button></div>
      {showModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.85)'}} onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}><div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{backgroundColor:C.card,border:`1px solid ${C.border}`}}><h3 className="text-lg font-bold" style={{color:C.text}}>Activate Pre-Season</h3><div><label className="text-xs mb-1 block" style={{color:C.dim}}>Season opener date</label><input type="date" value={form.opener} onChange={e=>setForm(f=>({...f,opener:e.target.value}))} className="w-full px-3 py-2.5 rounded-xl text-sm" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.text}}/></div><div><label className="text-xs mb-1 block" style={{color:C.dim}}>Opposition</label><input value={form.opposition} onChange={e=>setForm(f=>({...f,opposition:e.target.value}))} placeholder="e.g. Lancashire" className="w-full px-3 py-2.5 rounded-xl text-sm" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.text}}/></div>{form.opener&&<div className="text-xs" style={{color:C.dim}}>Camp length: {Math.max(0,Math.ceil((new Date(form.opener).getTime()-Date.now())/86400000))} days</div>}<div className="flex gap-2">{(['Home','Away Tour'] as const).map(t=>(<button key={t} onClick={()=>setForm(f=>({...f,isAway:t==='Away Tour'}))} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{backgroundColor:form.isAway===(t==='Away Tour')?C.amberDim:C.cardAlt,border:form.isAway===(t==='Away Tour')?`1px solid ${C.amber}`:`1px solid ${C.border}`,color:form.isAway===(t==='Away Tour')?C.amber:C.muted}}>{t}</button>))}</div>{form.isAway&&<div><label className="text-xs mb-1 block" style={{color:C.dim}}>Tour destination</label><input value={form.destination} onChange={e=>setForm(f=>({...f,destination:e.target.value}))} placeholder="e.g. India" className="w-full px-3 py-2.5 rounded-xl text-sm" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.text}}/></div>}<div><label className="text-xs mb-1 block" style={{color:C.dim}}>Squad size</label><input type="number" value={form.squad} onChange={e=>setForm(f=>({...f,squad:e.target.value}))} className="w-full px-3 py-2.5 rounded-xl text-sm" style={{backgroundColor:C.cardAlt,border:`1px solid ${C.border}`,color:C.text}}/></div><button onClick={activate} disabled={!form.opener||!form.opposition} className="w-full py-3 rounded-xl text-sm font-bold" style={{backgroundColor:form.opener&&form.opposition?C.amber:C.border,color:form.opener&&form.opposition?'#07080F':C.dim}}>Activate Pre-Season 🏏</button></div></div>)}</div>
  )
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-5 py-3 rounded-xl" style={{backgroundColor:`${C.amber}20`,border:`1px solid ${C.amber}40`}}><div className="flex items-center gap-3 flex-wrap"><span>🏏</span><span className="text-sm font-bold" style={{color:C.text}}>Pre-Season Active</span><span className="text-sm" style={{color:C.amber}}>vs {camp.opposition} · {daysTo} days</span><span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white" style={{backgroundColor:phaseColor}}>{phase}</span>{camp.isAway&&<span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{backgroundColor:C.blueDim,color:C.blue}}>✈️ Away Tour — {camp.destination}</span>}</div><button onClick={deactivate} className="text-xs px-3 py-1.5 rounded-lg" style={{backgroundColor:C.cardAlt,color:C.muted}}>Deactivate</button></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><div className="rounded-xl p-5" style={{backgroundColor:C.card,border:`1px solid ${C.border}`}}><div className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:C.purple}}>AI Pre-Season Summary</div>{aiLoading?<div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-3 rounded animate-pulse" style={{width:`${80+i*5}%`,background:C.border}}/>)}</div>:aiSummary?<div className="text-xs leading-relaxed whitespace-pre-wrap" style={{color:C.text}}>{aiSummary}</div>:<div className="text-xs" style={{color:C.dim}}>Generating...</div>}</div><div className="rounded-xl p-5" style={{backgroundColor:C.card,border:`1px solid ${C.border}`}}><div className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:C.amber}}>AI Key Highlights</div>{aiLoading?<div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-3 rounded animate-pulse" style={{width:`${70+i*8}%`,background:C.border}}/>)}</div>:aiHighlights?<div className="text-xs leading-relaxed whitespace-pre-wrap" style={{color:C.text}}>{aiHighlights}</div>:<div className="text-xs" style={{color:C.dim}}>Generating...</div>}</div></div>
      <div className="rounded-xl p-5" style={{backgroundColor:C.card,border:`1px solid ${C.border}`}}><div className="flex items-center justify-between mb-4"><div className="text-sm font-bold" style={{color:C.text}}>Squad Readiness Score</div><div className="text-3xl font-black" style={{color:scoreColor(overallScore)}}>{overallScore}<span className="text-sm" style={{color:C.dim}}>/100</span></div></div><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{readinessScores.map(s=>(<div key={s.label} className="rounded-lg p-3" style={{backgroundColor:C.bg,border:`1px solid ${C.border}`}}><div className="flex items-center justify-between mb-1"><span className="text-xs" style={{color:C.text}}>{s.label}</span><span className="text-sm font-black" style={{color:scoreColor(s.score)}}>{s.score}</span></div><div className="w-full rounded-full h-1.5" style={{background:C.border}}><div className="h-1.5 rounded-full" style={{width:`${s.score}%`,backgroundColor:scoreColor(s.score)}}/></div>{s.score<60&&<div className="text-[9px] mt-1" style={{color:C.red}}>Needs attention</div>}</div>))}</div></div>
      <div className="rounded-xl p-5" style={{backgroundColor:C.card,border:`1px solid ${C.border}`}}><div className="flex items-center justify-between mb-3"><div className="text-sm font-bold" style={{color:C.text}}>Today&apos;s Session Checklist</div><div className="text-xs" style={{color:scoreColor(completedChecklist>=6?80:completedChecklist>=4?65:40)}}>{completedChecklist}/8</div></div><div className="space-y-2">{checklistItems.map((item,i)=>(<button key={i} onClick={()=>setChecklist(ck=>ck.map((v,j)=>j===i?!v:v))} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left" style={{backgroundColor:checklist[i]?`${C.green}15`:'transparent',border:checklist[i]?`1px solid ${C.green}33`:`1px solid ${C.border}`}}><div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={{borderColor:checklist[i]?C.green:C.border,backgroundColor:checklist[i]?`${C.green}33`:'transparent'}}>{checklist[i]&&<span className="text-[10px]" style={{color:C.green}}>✓</span>}</div><span className="text-xs" style={{color:checklist[i]?C.green:C.text,textDecoration:checklist[i]?'line-through':'none'}}>{item}</span></button>))}</div></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><div className="rounded-xl p-5" style={{backgroundColor:C.card,border:`1px solid ${C.border}`}}><div className="text-sm font-bold mb-3" style={{color:C.text}}>Fitness & Readiness Tracker</div><div className="space-y-2">{fitnessTestData.map((t,i)=>(<div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{backgroundColor:C.bg,border:`1px solid ${C.border}`}}><div><div className="text-xs" style={{color:C.text}}>{t.label}</div><div className="text-[10px]" style={{color:C.dim}}>Target: {t.target}</div></div><select value={fitnessTests[i]} onChange={e=>setFitnessTests(f=>f.map((v,j)=>j===i?e.target.value:v))} className="text-[10px] px-2 py-1 rounded" style={{backgroundColor:C.cardAlt,color:fitnessTests[i]==='pass'?C.green:fitnessTests[i]==='warn'?C.amber:C.dim,border:'none'}}><option value="progress">In Progress</option><option value="pass">✅ Passed</option><option value="warn">⚠️ Below target</option><option value="fail">❌ Failed</option></select></div>))}</div></div><div className="rounded-xl p-5" style={{backgroundColor:C.card,border:`1px solid ${C.border}`}}><div className="text-sm font-bold mb-3" style={{color:C.text}}>Bowling Workload Tracker</div><div className="text-center mb-4"><div className="text-4xl font-black" style={{color:overs>=50?C.green:overs>=35?C.amber:C.red}}>{overs}<span className="text-sm" style={{color:C.dim}}> overs</span></div><div className="text-xs" style={{color:C.dim}}>of 60 weekly target (fast bowlers)</div></div><div className="w-full rounded-full h-2 mb-3" style={{background:C.border}}><div className="h-2 rounded-full" style={{width:`${Math.min(100,(overs/60)*100)}%`,backgroundColor:overs>=50?C.green:overs>=35?C.amber:C.red}}/></div><div className="flex justify-center gap-3 mb-3"><button onClick={()=>setOvers(o=>Math.max(0,o-5))} className="px-4 py-1.5 rounded-lg text-xs" style={{backgroundColor:C.cardAlt,color:C.muted}}>- 5 overs</button><button onClick={()=>setOvers(o=>o+5)} className="px-4 py-1.5 rounded-lg text-xs" style={{backgroundColor:C.cardAlt,color:C.muted}}>+ 5 overs</button></div><div className="text-[10px] text-center" style={{color:C.dim}}>Increase workload by max 15% per week to avoid injury</div></div></div>
      <div className="rounded-xl p-5" style={{backgroundColor:C.card,border:`1px solid ${C.border}`}}><div className="flex items-center justify-between mb-3"><div className="text-sm font-bold" style={{color:C.text}}>Warm-up Matches</div><div className="text-xs" style={{color:C.dim}}>{warmups.length} of 4 planned</div></div><div className="space-y-2">{warmups.map((w,i)=>(<div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{backgroundColor:C.bg,border:`1px solid ${C.border}`}}><div className="flex items-center gap-3"><span className="text-[10px] px-1.5 py-0.5 rounded font-bold text-white" style={{backgroundColor:w.result==='W'?C.green:w.result==='D'?C.amber:C.red}}>{w.result}</span><div><div className="text-xs" style={{color:C.text}}>{w.opp}</div><div className="text-[10px]" style={{color:C.dim}}>{w.notes}</div></div></div><span className="text-xs font-bold" style={{color:C.text}}>{w.score}</span></div>))}</div><button onClick={()=>setWarmups(wm=>[...wm,{opp:'TBC',score:'0-0',notes:'',result:'D'}])} className="mt-3 w-full py-2 rounded-lg text-xs font-bold" style={{backgroundColor:C.cardAlt,color:C.muted}}>+ Add Result</button></div>
      <div className="rounded-xl p-5" style={{backgroundColor:C.card,border:`1px solid ${C.border}`}}><div className="flex items-center justify-between mb-3"><div className="text-sm font-bold" style={{color:C.text}}>Conditions Readiness</div>{camp.isAway&&<span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{backgroundColor:C.blueDim,color:C.blue}}>Away Tour</span>}</div><div className="space-y-2">{allTactical.map((item,i)=>(<button key={i} onClick={()=>setTactical(t=>{const n=[...t];n[i]=!n[i];return n})} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left" style={{backgroundColor:tactical[i]?`${C.green}15`:'transparent',border:tactical[i]?`1px solid ${C.green}33`:`1px solid ${C.border}`}}><div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={{borderColor:tactical[i]?C.green:C.border,backgroundColor:tactical[i]?`${C.green}33`:'transparent'}}>{tactical[i]&&<span className="text-[10px]" style={{color:C.green}}>✓</span>}</div><span className="text-xs" style={{color:tactical[i]?C.green:C.text,textDecoration:tactical[i]?'line-through':'none'}}>{item}</span></button>))}</div></div>
    </div>
  )
}

function CricketPortalInner({ session }: { session?: SportsDemoSession } = {}){
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
  const [roleOverride, setRoleOverride] = useState(session?.role || 'chairman')
  const[battingFmt,setBattingFmt]=useState('All');
  const[bowlingFmt,setBowlingFmt]=useState('All');
  const[videoFilter,setVideoFilter]=useState('All');
  const[perfPlayer,setPerfPlayer]=useState(CRICKET_SQUAD[1].id);
  const[perfTab,setPerfTab]=useState<'Batting'|'Bowling'|'Fielding'>('Batting');
  const[expandedMatch,setExpandedMatch]=useState<number|null>(null);
  const[format,setFormat]=useState('ch');
  const[matchDay,setMatchDay]=useState<number|null>(null);
  const[gpsIdx,setGpsIdx]=useState(0);

  // ── AI feature state (parent scope — inline components remount each render) ──
  type OppDossier = { batting_threats: string; bowling_threats: string; weaknesses: string; game_plan: string; key_matchup: string };
  const[oppLoading,setOppLoading]=useState(false);
  const[oppDossier,setOppDossier]=useState<OppDossier|null>(null);
  const[oppError,setOppError]=useState<string|null>(null);
  const[oppTarget,setOppTarget]=useState('Lancashire');
  const[oppFormat,setOppFormat]=useState<'Championship'|'T20'|'OD'>('Championship');

  type PressConferenceResult = { questions: { q: string; a: string }[] };
  const[pcLoading,setPcLoading]=useState(false);
  const[pcResult,setPcResult]=useState<PressConferenceResult|null>(null);
  const[pcError,setPcError]=useState<string|null>(null);
  const[pcOpen,setPcOpen]=useState<number|null>(null);
  const[pcRecent,setPcRecent]=useState('Won vs Durham MCCU — 412/7d');
  const[pcUpcoming,setPcUpcoming]=useState('vs Lancashire, Championship Round 1, Fri 11 Apr');
  const[pcNews,setPcNews]=useState('Harrison fitness doubt, Nortje arriving Thu, Dawson workload managed');

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
          messages: [{ role: 'user', content: `Yorkshire CCC squad for this week. Available players (fit only): ${JSON.stringify(fit)}. This week: Championship vs Lancashire (4-day, Fri), plus T20 Blast planning. Suggest the optimal XI for each format, considering format eligibility and player roles. Chris Dawson should have capped overs in Championship. Rajan Nortje available Championship + OD only. Respond ONLY in JSON (no markdown): { "championship": { "xi": ["player1", ...11 players], "reasoning": "2 sentences" }, "t20": { "xi": ["player1", ...11 players], "reasoning": "2 sentences" } }` }],
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
  const[tossGround,setTossGround]=useState('Headingley');
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
  const[reportMom,setReportMom]=useState('Harry Brook');
  const[reportNotes,setReportNotes]=useState('Brook 124, Coad 4-62, disciplined bowling throughout');
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
          messages: [{ role: 'user', content: `You are a county cricket analyst. Toss situation: Ground: ${tossGround}. Weather: ${tossWeather}. Pitch: ${tossPitch}. Opposition batting: ${tossBatting}. Should Yorkshire bat or field first in a 4-day County Championship match? Give a clear recommendation with reasoning. Respond ONLY in JSON (no markdown): { "decision": "BAT" or "FIELD", "confidence": "High/Medium/Low", "reasoning": "2-3 sentences", "key_factor": "one sentence on the single most important factor" }` }],
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
    try {
      const expiring2026 = CRICKET_CONTRACTS.filter(c => c.expiry.includes('2026'));
      const res = await fetch('/api/ai/cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [{ role: 'user', content: `You are a cricket club's commercial director. Here are the contracts expiring this season: ${JSON.stringify(expiring2026)}. Also note: Adam Lyth is 37 and considering retirement. Shan Masood is Pakistan captain with international commitments. Ben Coad is the leading Championship bowler. Write a renewal priority memo for the Board. Respond ONLY in JSON (no markdown): { "urgent": [{ "player": "name", "recommendation": "action", "reason": "1 sentence" }], "strategy_note": "2-3 sentence overall strategic note for the board" }` }],
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
          system: 'You are an ECB compliance expert helping a County Championship club. Be direct and specific. The club is Yorkshire CCC, CPA completion 73%, 3 DBS issues, safeguarding incidents pending. Answer questions about County Partnership Agreement requirements, ECB standards, and deadlines.',
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
          messages: [{ role: 'user', content: `Generate a cricket opposition dossier for Yorkshire CCC vs ${oppTarget} in the ${oppFormat === 'Championship' ? 'County Championship 2026' : oppFormat === 'T20' ? 'Vitality Blast 2026' : 'Metro Bank One Day Cup 2026'}. Include realistic insights. Respond ONLY in JSON (no markdown): { "batting_threats": "2-3 sentence analysis", "bowling_threats": "2-3 sentence analysis", "weaknesses": "2-3 sentence analysis", "game_plan": "3-4 sentence tactical recommendation", "key_matchup": "one specific player vs player matchup to target" }` }],
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
          messages: [{ role: 'user', content: `You are a cricket media officer preparing a Yorkshire CCC head coach for a press conference. Based on: Recent result: ${pcRecent}. Upcoming: ${pcUpcoming}. Team news: ${pcNews}. Generate 5 likely journalist questions with suggested answers. Respond ONLY in JSON (no markdown): { "questions": [ { "q": "question text", "a": "suggested answer 2-3 sentences" }, ... ] }` }],
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
    w.document.write(`<!DOCTYPE html><html><head><title>Morning Briefing — Yorkshire CCC — 8 April 2026</title>
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
<div class="meta">Yorkshire County Cricket Club · Wednesday 8 April 2026 · Generated 06:45 · CONFIDENTIAL</div>
<div class="kpis">
  <div class="kpi"><div class="kpi-val" style="color:#10B981">11/13</div><div class="kpi-label">Squad Fit</div><div style="font-size:10px;color:#666">1 injury · 1 monitoring</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#F59E0B">73%</div><div class="kpi-label">CPA Completion</div><div style="font-size:10px;color:#666">3 sections incomplete</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#EF4444">3</div><div class="kpi-label">DBS Issues</div><div style="font-size:10px;color:#666">1 expired · 2 at risk</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#14B8A6">£4.7m</div><div class="kpi-label">Windfall Remaining</div><div style="font-size:10px;color:#666">of £8.4m total</div></div>
</div>
<div class="briefing">
  <p>"Good morning. The County Championship opens in six days. Jake Harrison is 70% — hamstring, grade 2. Physio wants a final assessment Wednesday. Chris Dawson's A:C ratio is at 1.62 — cap his workload this block. Rajan Nortje visa confirmed — arrives Thursday. Brett Mason still pending — chase the agent today. Noah Patel contract decision overdue since 31 March. Phil Grant DBS expired — must resolve before academy activity resumes. Midlands Bank activation at 85% — one outstanding obligation before round one. Make it count."</p>
</div>
<div class="section"><h3>Priority Actions Today</h3>
  <div class="action"><div class="dot red"></div>Noah Patel contract review — overdue since 31 Mar</div>
  <div class="action"><div class="dot amber"></div>Chase Brett Mason visa — agent Southern Cross Cricket</div>
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
          <p style={{margin:'4px 0 0',fontSize:12,color:C.muted}}>Wednesday 8 April 2026 · Northbrook CC · County Championship begins in 6 days</p>
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
          <strong style={{color:C.teal,fontStyle:'normal'}}>Overseas:</strong> Rajan Nortje visa confirmed — arrives Thursday. Available from the Championship opener. Brett Mason (T20 and Hundred) — visa still pending with the Home Office; expected 14 April, but chase the agent today.<br/><br/>
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
            {label:"Chase Brett Mason visa — agent Southern Cross Cricket",color:C.amber},
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
            {comp:'County Championship',opp:'vs Yorkshire (A)',date:'Fri 11 Apr',format:'4-day'},
            {comp:'County Championship',opp:'vs Essex (H)',date:'Tue 29 Apr',format:'4-day'},
            {comp:'One Day Cup',opp:'vs Durham (H)',date:'Sun 18 May',format:'50-over'},
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
            <div style={{fontSize:12,color:C.muted,marginBottom:10}}>This week: Championship vs Lancashire (Fri) + T20 Blast qualification push</div>
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

  // ── PAGE: GPS ────────────────────────────────────────────────────
  const GPS=()=>(
    <div>
      <SectionHead title="GPS Tracking Hub" sub="Session: Morning Training · Wed 8 Apr 2026 · Lumio Vest System · 10Hz GPS + Accelerometer"/>
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
      {gp.bowl && (() => {
        const acr = gp.bowl.acr ?? 1.0;
        const weeks = [0.82, 0.91, 1.12, acr];
        const minW = 0.6, maxW = 1.6, chartW = 260, chartH = 80, padL = 28, padR = 8, padT = 10, padB = 20;
        const plotW = chartW - padL - padR, plotH = chartH - padT - padB;
        const xFor = (i: number) => padL + (i / (weeks.length - 1)) * plotW;
        const yFor = (v: number) => padT + plotH - ((v - minW) / (maxW - minW)) * plotH;
        const polyline = weeks.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ');
        // Safe zone 0.8–1.3 band
        const safeTopY = yFor(1.3);
        const safeBottomY = yFor(0.8);
        // Red zone > 1.3
        const redTopY = padT;
        const redBottomY = yFor(1.3);
        // Load recommendation
        let recoColor = C.green, recoText = '🟢 Well within safe zone. Can increase by up to 10% this block.';
        if (acr > 1.3) { recoColor = C.red;   recoText = '🔴 Reduce load immediately — risk of injury spike. Max 4 overs next 3 days.'; }
        else if (acr >= 1.0) { recoColor = C.amber; recoText = '🟡 Manage carefully — on the edge of the safe zone. No increases this week.'; }
        // Player format flags — check if this player is in both Championship and T20 squads
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
              {/* Week planner */}
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
              {/* A/C ratio chart */}
              <div>
                <div style={{fontSize:10,color:C.dim,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.04em'}}>A/C ratio — last 4 weeks</div>
                <svg width={chartW} height={chartH} style={{display:'block',background:C.cardAlt,borderRadius:4,border:`1px solid ${C.border}`}}>
                  {/* Safe zone band (green) */}
                  <rect x={padL} y={safeTopY} width={plotW} height={safeBottomY - safeTopY} fill={C.green} opacity="0.1"/>
                  {/* Red zone (> 1.3) */}
                  <rect x={padL} y={redTopY} width={plotW} height={redBottomY - redTopY} fill={C.red} opacity="0.08"/>
                  {/* Reference lines at 0.8 and 1.3 */}
                  <line x1={padL} x2={chartW - padR} y1={yFor(0.8)} y2={yFor(0.8)} stroke={C.green} strokeWidth="1" strokeDasharray="2,2" opacity="0.6"/>
                  <line x1={padL} x2={chartW - padR} y1={yFor(1.3)} y2={yFor(1.3)} stroke={C.red}   strokeWidth="1" strokeDasharray="2,2" opacity="0.6"/>
                  {/* Polyline */}
                  <polyline points={polyline} fill="none" stroke={C.teal} strokeWidth="2"/>
                  {/* Dots */}
                  {weeks.map((v, i) => (
                    <circle key={i} cx={xFor(i)} cy={yFor(v)} r="3" fill={i === weeks.length - 1 ? recoColor : C.teal} />
                  ))}
                  {/* Y labels */}
                  <text x="4" y={yFor(0.8) + 3} fontSize="9" fill={C.dim}>0.8</text>
                  <text x="4" y={yFor(1.3) + 3} fontSize="9" fill={C.dim}>1.3</text>
                  {/* X labels */}
                  {['-3w','-2w','-1w','Now'].map((lbl, i) => (
                    <text key={i} x={xFor(i)} y={chartH - 6} fontSize="9" fill={C.dim} textAnchor="middle">{lbl}</text>
                  ))}
                </svg>
                <div style={{fontSize:10,color:C.muted,marginTop:4}}>Current ACWR: <strong style={{color:recoColor}}>{acr.toFixed(2)}</strong></div>
              </div>
            </div>
            {/* Recommendation */}
            <div style={{padding:10,borderRadius:6,background:`${recoColor}14`,border:`1px solid ${recoColor}55`,color:recoColor,fontSize:12,fontWeight:600,marginBottom:8}}>
              {recoText}
            </div>
            {/* Dual format warning */}
            {dualFormat && (
              <div style={{padding:10,borderRadius:6,background:C.amberDim,border:`1px solid ${C.amber}55`,color:C.amber,fontSize:11}}>
                ⚠️ Dual format week — Championship overs will impact T20 readiness. Prioritise Championship, cap T20 contribution.
              </div>
            )}
          </Card>
        );
      })()}
    </div>
  );

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
      { name:'Trent Boult', country:'New Zealand', role:'Fast Bowler', age:35, available:'T20 Blast', ecbCat:'Category B', status:'Available', contact:'NZ Cricket Board', notes:'Interested in county stint. IPL-free window Jun-Jul.' },
      { name:'Quinton de Kock', country:'South Africa', role:'WK-Batter', age:32, available:'Full season', ecbCat:'Category B', status:'Exploring', contact:'CSA Agent', notes:'Retirement from Tests — open to county contract.' },
      { name:'Mujeeb Ur Rahman', country:'Afghanistan', role:'Off Spinner', age:23, available:'T20 Only', ecbCat:'Category C', status:'Available', contact:'Direct', notes:'Blast specialist. High economy risk in 4-day.' },
      { name:'Aiden Markram', country:'South Africa', role:'Batter', age:30, available:'Championship', ecbCat:'Category B', status:'Interested', contact:'Titan Sports', notes:'Strong red-ball average 43.2. Available May onward.' },
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
        <Stat label="Confirmed" value="1" color={C.green} sub="Rajan Nortje"/>
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
            {[{n:'Rajan Nortje',ch:true,t2:false,od:true,hu:false,dr:'N/A'},
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
            {[{d:'11 Apr',e:'Championship vs Yorkshire',t:'cricket',util:100},
              {d:'18 Apr',e:'Corporate Golf Day',t:'event',util:85},
              {d:'25 Apr',e:'Easter Conference (Midlands Bank)',t:'venue',util:100},
              {d:'29 Apr',e:'Championship vs Essex',t:'cricket',util:100},
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
            <div style={{fontSize:13,fontWeight:600,color:C.text}}>Round 1 — Yorkshire (Away)</div>
            <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,background:C.purpleDim,color:C.purple}}>11 Apr · 4-day</span>
          </div>
          <div style={{fontSize:13,color:C.muted,marginBottom:14,fontStyle:'italic',borderLeft:`3px solid ${C.purple}`,paddingLeft:12,lineHeight:1.7}}>
            "Yorkshire have won 3 of their last 5 Championship openers at Headingley. Their top-order averages 42.1 in April conditions; pace-friendly pitch with lateral movement in sessions 1–3. Key threat: Root-type figure at No.3, averaging 58 in home conditions. Recommend seam-heavy attack in first two sessions, target leg stump."
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
            ⚡ CricViz Centurion integration active — head-to-head matchups and Hawk-Eye data available
          </div>
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Upcoming Opposition</div>
          {[{opp:'Yorkshire',date:'11 Apr',format:'Championship',prepared:true},
            {opp:'Essex',date:'29 Apr',format:'Championship',prepared:false},
            {opp:'Durham',date:'18 May',format:'One Day Cup',prepared:false},
            {opp:'Warwickshire',date:'6 Jun',format:'T20 Blast',prepared:false},
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
      <SectionHead title="Women's Cricket Integration" sub="Northbrook Women · ECB Tier 1 · Shared facilities and compliance management"/>
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
              {n:'Tom Bailey',r:'Academy Director',end:'Sep 2028',q:'ECB Level 4',st:'fit'},
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
    ch:{ sub:'Wednesday 8 April 2026 · Headingley · Championship opener Friday vs Lancashire',
      pos:{ label:'League Position', value:'2nd',         sub:'Div 1 · 61 pts' },
      next:{ label:'Next Match',      value:'Fri 11 Apr',  sub:'vs Lancashire (H)' } },
    t2:{ sub:'Wednesday 8 April 2026 · Headingley · T20 Blast — opener vs Warwickshire',
      pos:{ label:'North Group Position', value:'2nd',    sub:'6 pts' },
      next:{ label:'Next Blast',           value:'Fri 6 Jun', sub:'vs Warwickshire (H)' } },
    od:{ sub:'Wednesday 8 April 2026 · Headingley · One Day Cup group stage',
      pos:{ label:'One Day Cup Group', value:'3rd',       sub:'Group B' },
      next:{ label:'Next OD',          value:'Sun 18 May', sub:'vs Durham (H)' } },
    hu:{ sub:'Wednesday 8 April 2026 · Headingley · Northern Superchargers preparations',
      pos:{ label:'Hundred Status',    value:'Visa pending', sub:'Brett Mason — Home Office' },
      next:{ label:'Next Hundred',     value:'TBC',          sub:'Season opener — awaiting fixture' } },
  };
  const fmtMeta = FORMAT_META[format] || FORMAT_META.ch;
  const pitch = getPitchReport(matchDay);

  // Dashboard state
  const [dashTab, setDashTab] = useState<'gettingstarted'|'today'|'quickwins'|'dailytasks'|'insights'|'dontmiss'|'team'>(() => {
    try { const seen = typeof window !== 'undefined' ? localStorage.getItem('cricket_getting_started_seen') : null; return seen ? 'today' : 'gettingstarted' } catch { return 'gettingstarted' }
  })
  const [tourStep, setTourStep] = useState(0)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // TTS speaker
  const speakBriefing = () => {
    if (typeof window === 'undefined') return
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return }
    const text = aiSummary || 'Good morning. Championship opener in 3 days. Brook passed his final fitness check. Coad bowled 12 overs in nets. Lancashire opener Jennings flagged as vulnerable to the nip-backer early. Weather looks good. Ticket sales at 94% capacity.'
    const u = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    const pref = voices.find(v => v.name.includes('Daniel') || v.name.includes('Google UK') || v.lang === 'en-GB') || voices.find(v => v.lang.startsWith('en'))
    if (pref) u.voice = pref; u.rate = 0.95
    u.onstart = () => setIsSpeaking(true); u.onend = () => setIsSpeaking(false); u.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(u)
  }
  useEffect(() => { return () => { if (typeof window !== 'undefined') window.speechSynthesis.cancel() } }, [])

  // Auto-generate AI summary on mount
  useEffect(() => {
    setAiLoading(true)
    fetch('/api/ai/cricket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 300, messages: [{ role: 'user', content: 'Morning briefing for Yorkshire CCC director. Cover: Division One position (2nd), upcoming fixture vs Lancashire, squad availability (16/18 fit), Brook batting form, Coad bowling workload, one pitch/weather watch-out. 4-5 sentences, director tone. No intro, just the briefing.' }] }) })
      .then(r => r.json()).then(d => setAiSummary(d.content?.[0]?.text || null)).catch(() => {}).finally(() => setAiLoading(false))
  }, [])

  const CRICKET_QUOTES = [
    { text: "Cricket is a game which the English, not being a spiritual people, have invented in order to give themselves some conception of eternity.", author: "Lord Mancroft" },
    { text: "In cricket, as in no other game, a great master may be judged as much by his technique as by his record.", author: "Neville Cardus" },
    { text: "Cricket civilizes people and creates good gentlemen. I want everyone to play cricket.", author: "Robert Mugabe" },
    { text: "The only time an Australian ever walks is when his car breaks down.", author: "Barry Richards" },
  ]
  const cricketQuote = CRICKET_QUOTES[new Date().getDay() % CRICKET_QUOTES.length]

  const Dashboard=()=>(
    <div className="space-y-6">
      {/* Morning Banner — all in one card */}
      <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(7,8,15,0.95) 60%)', border: `1px solid ${C.purple}33` }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: C.text }}>Good morning, Director. 🏏</h1>
            <p className="text-sm mt-1" style={{ color: C.muted }}>{new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
            <p className="text-xs italic mt-2" style={{ color: C.amber }}>&ldquo;{cricketQuote.text}&rdquo; &mdash; {cricketQuote.author}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* TTS speaker */}
            <button onClick={speakBriefing} title={isSpeaking ? 'Stop reading' : 'Read briefing aloud'}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
              style={{ background: isSpeaking ? `${C.purple}40` : 'rgba(255,255,255,0.08)', border: isSpeaking ? `1px solid ${C.purple}80` : '1px solid rgba(255,255,255,0.12)', color: isSpeaking ? C.purple : C.muted, fontSize: 14 }}>
              {isSpeaking ? '⏹' : '🔊'}
            </button>
            {/* World clock */}
            <div className="hidden md:flex items-center gap-5 text-xs text-right">
              {[{ city:'London', tz:'Europe/London' },{ city:'Mumbai', tz:'Asia/Kolkata' },{ city:'Sydney', tz:'Australia/Sydney' },{ city:'Cape Town', tz:'Africa/Johannesburg' }].map(({ city, tz }) => (
                <div key={city}><div className="font-bold" style={{ color: C.text }}>{new Date().toLocaleTimeString('en-GB', { timeZone: tz, hour:'2-digit', minute:'2-digit' })}</div><div style={{ color: C.dim }}>{city}</div></div>
              ))}
            </div>
          </div>
        </div>
        {/* Stat boxes inside banner */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          <div className="rounded-xl p-4" style={{ background: `${C.bg}99`, border: `1px solid ${C.purple}33` }}>
            <div className="text-2xl font-black" style={{ color: C.text }}>2nd</div>
            <div className="text-xs mt-0.5" style={{ color: C.muted }}>Division One</div>
            <div className="text-[10px] mt-1" style={{ color: C.teal }}>Championship</div>
          </div>
          <div className="rounded-xl p-4" style={{ background: `${C.bg}99`, border: `1px solid ${C.purple}33` }}>
            <div className="text-2xl font-black" style={{ color: C.text }}>Fri 11 Apr</div>
            <div className="text-xs mt-0.5" style={{ color: C.muted }}>Next Match</div>
            <div className="text-[10px] mt-1" style={{ color: C.purple }}>vs Lancashire</div>
          </div>
          <div className="rounded-xl p-4" style={{ background: `${C.bg}99`, border: `1px solid ${C.purple}33` }}>
            <div className="text-2xl font-black" style={{ color: C.text }}>16/18</div>
            <div className="text-xs mt-0.5" style={{ color: C.muted }}>Squad Available</div>
            <div className="text-[10px] mt-1" style={{ color: C.green }}>1 injury · 1 monitoring</div>
          </div>
          <div className="rounded-xl p-4" style={{ background: `${C.bg}99`, border: `1px solid ${C.purple}33` }}>
            <div className="text-2xl font-black" style={{ color: C.text }}>£3.2m</div>
            <div className="text-xs mt-0.5" style={{ color: C.muted }}>Budget Remaining</div>
            <div className="text-[10px] mt-1" style={{ color: C.amber }}>of £9.8m annual</div>
          </div>
        </div>
      </div>

      {/* Quick Actions — 2-row grid */}
      <div className="mb-5">
        <div className="text-xs font-bold uppercase tracking-wider mb-2.5 px-1" style={{ color: C.dim }}>Quick actions</div>
        <div className="flex flex-wrap gap-2">
          {[
            { label:'Book Flight',        icon:'✈️', color:'#0ea5e9' },
            { label:'Team Selection AI',  icon:'👥', color:C.purple, hot:true },
            { label:'Toss Advisor',       icon:'🌤️', color:C.teal, hot:true },
            { label:'Sponsor Post',       icon:'📱', color:C.amber },
            { label:'Log Injury',         icon:'🏥', color:C.red },
            { label:'Add Expense',        icon:'💰', color:C.dim },
            { label:'Match Report',       icon:'📋', color:C.purple },
            { label:'Visa Check',         icon:'🌍', color:C.dim },
          ].map((a, i) => (
            <button key={i} className="relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap"
              style={{ background: (a as {hot?:boolean}).hot ? `${a.color}18` : '#111318', border: (a as {hot?:boolean}).hot ? `1px solid ${a.color}50` : '1px solid #1F2937', color: (a as {hot?:boolean}).hot ? a.color : C.muted }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${a.color}60`; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = (a as {hot?:boolean}).hot ? `${a.color}50` : '#1F2937'; e.currentTarget.style.color = (a as {hot?:boolean}).hot ? a.color : C.muted }}>
              <span>{a.icon}</span>{a.label}
              {(a as {hot?:boolean}).hot && <span className="absolute -top-1 -right-1 text-[8px] px-1 py-0.5 rounded-full font-black leading-none" style={{ backgroundColor: a.color, color: '#fff' }}>AI</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        <button onClick={() => setDashTab('gettingstarted')}
          className="flex items-center gap-1.5 px-5 py-3 text-xs font-semibold border-b-2 transition-all -mb-px whitespace-nowrap"
          style={{ borderColor: dashTab === 'gettingstarted' ? C.purple : 'transparent', color: dashTab === 'gettingstarted' ? C.purple : C.dim }}>
          🚀 Getting Started
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: C.purple }}>10</span>
        </button>
        {([
          { id:'today' as const, label:'Today', icon:'🏠' },{ id:'quickwins' as const, label:'Quick Wins', icon:'⚡' },
          { id:'dailytasks' as const, label:'Daily Tasks', icon:'✅' },{ id:'insights' as const, label:'Insights', icon:'📊' },
          { id:'dontmiss' as const, label:"Don't Miss", icon:'🔴' },{ id:'team' as const, label:'Team', icon:'👥' },
        ]).map(t => (
          <button key={t.id} onClick={() => setDashTab(t.id)}
            className="flex items-center gap-1.5 px-5 py-3 text-xs font-semibold border-b-2 transition-all -mb-px whitespace-nowrap"
            style={{ borderColor: dashTab === t.id ? C.purple : 'transparent', color: dashTab === t.id ? C.text : C.dim }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* GETTING STARTED */}
      {dashTab === 'gettingstarted' && (() => {
        const STEPS = [
          { n:1, label:'Connect your ECB/county profile' },{ n:2, label:'Add your coaching team' },{ n:3, label:'Set your fixture schedule' },{ n:4, label:'Upload sponsor agreements' },{ n:5, label:'Set your budget target' },{ n:6, label:'Configure squad availability' },{ n:7, label:'Set up GPS tracking' },{ n:8, label:'Add your analyst' },{ n:9, label:'Connect opposition scouting' },{ n:10, label:"You're ready — good luck out there" },
        ]
        const step = STEPS[tourStep]
        return (
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 mr-4">
                <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: C.purple }}>STEP {tourStep + 1} OF {STEPS.length}</div>
                <div className="w-full rounded-full h-1" style={{ background: C.border }}><div className="h-1 rounded-full transition-all duration-500" style={{ width: `${((tourStep + 1) / STEPS.length) * 100}%`, backgroundColor: C.purple }} /></div>
              </div>
              <button onClick={() => { localStorage.setItem('cricket_getting_started_seen', 'true'); setDashTab('today') }} className="text-sm flex-shrink-0" style={{ color: C.dim }}>Skip tour →</button>
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
                    <span className="text-sm" style={{ color: tourStep === i ? C.text : C.dim }}>{s.label}</span>
                  </button>
                ))}
              </div>
              <div className="lg:col-span-2">
                <div className="rounded-2xl p-8" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, minHeight: 400 }}>
                  <div className="text-5xl mb-4">🏏</div>
                  <h2 className="text-2xl font-black mb-3" style={{ color: C.text }}>{step.label}</h2>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: C.muted }}>Set up your Lumio Cricket portal step by step. Each item connects a key part of Yorkshire CCC to your director&apos;s dashboard.</p>
                  <div className="rounded-xl p-4 mb-6" style={{ background: C.purpleDim, border: `1px solid ${C.purple}33` }}>
                    <div className="grid grid-cols-4 gap-2">
                      {[{ icon:'🏆', v:'2nd', label:'Div One', c:C.teal },{ icon:'🏏', v:'Fri 11', label:'Next Match', c:C.purple },{ icon:'👥', v:'16/18', label:'Squad', c:C.green },{ icon:'💰', v:'£3.2m', label:'Budget', c:C.amber }].map((s, i) => (
                        <div key={i} className="rounded-lg p-2 text-center" style={{ backgroundColor: C.bg }}><div className="text-lg">{s.icon}</div><div className="text-xs font-black mt-0.5" style={{ color: s.c }}>{s.v}</div><div className="text-[9px] mt-0.5" style={{ color: C.dim }}>{s.label}</div></div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => { if (tourStep < STEPS.length - 1) setTourStep(tourStep + 1); else { localStorage.setItem('cricket_getting_started_seen', 'true'); setDashTab('today') } }}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: C.purple }}>
                    {tourStep < STEPS.length - 1 ? 'Next →' : "Let's go 🏏"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* TODAY tab — existing dashboard content */}
      {dashTab === 'today' && (<div>
      {/* AI Summary Card */}
      <div className="rounded-xl p-5 mb-4" style={{ background: `linear-gradient(135deg, ${C.card}, ${C.cardAlt})`, border: `1px solid ${C.purple}33` }}>
        <div className="flex items-center gap-2 mb-3">
          <div style={{width:28,height:28,borderRadius:'50%',background:C.purpleDim,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>🤖</div>
          <span className="text-xs font-bold" style={{ color: C.purple }}>Lumio AI — Morning Summary</span>
          {aiLoading && <span className="text-[10px] px-2 py-0.5 rounded-full animate-pulse" style={{ background: C.purpleDim, color: C.purple }}>Generating...</span>}
        </div>
        {aiLoading ? (
          <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-3 rounded animate-pulse" style={{width:`${80+i*5}%`, background: C.border}}/>)}</div>
        ) : aiSummary ? (
          <div className="text-sm leading-relaxed" style={{ color: C.text, fontStyle:'italic', borderLeft:`3px solid ${C.purple}`, paddingLeft:14 }}>{aiSummary}</div>
        ) : (
          <div className="text-sm leading-relaxed" style={{ color: C.text, fontStyle:'italic', borderLeft:`3px solid ${C.purple}`, paddingLeft:14 }}>
            Good morning. Championship opener in 3 days. Brook passed his final fitness check — full availability confirmed. Coad bowled 12 overs unbroken in nets. Lancashire&apos;s opener Jennings flagged as vulnerable to the nip-backer early. Weather looks good. Ticket sales at 94% capacity.
          </div>
        )}
      </div>

      {/* Format tabs */}
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        {FORMAT_TABS.map(t => {
          const active = format === t.id;
          return (
            <button key={t.id} type="button" onClick={() => setFormat(t.id)}
              style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer',
                border:`1px solid ${active ? C.teal : C.border}`, background: active ? C.tealDim : 'transparent',
                color: active ? C.teal : C.muted, transition:'all 0.15s ease' }}>
              {t.label}
            </button>
          );
        })}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Today's Schedule</div>
          {[
            {t:'07:00',e:'Gym & S&C — main squad'},
            {t:'09:30',e:'Team meeting — selection announce'},
            {t:'10:30',e:'Nets — batters + spinners'},
            {t:'13:00',e:'Media session (Sky Sports)'},
            {t:'15:00',e:'Fielding session'},
            {t:'17:30',e:'Physio clinic'},
          ].map((s,i)=>(
            <div key={i} style={{display:'flex',gap:10,padding:'7px 0',borderBottom:i<5?`1px solid ${C.border}`:'none'}}>
              <span style={{fontSize:12,color:C.teal,fontWeight:600,width:42}}>{s.t}</span>
              <span style={{fontSize:12,color:C.muted}}>{s.e}</span>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Recent Results</div>
          {CRICKET_RESULTS.map((r,i)=>(
            <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<CRICKET_RESULTS.length-1?`1px solid ${C.border}`:'none'}}>
              <div>
                <div style={{fontSize:12,color:C.text}}>vs {r.opponent} ({r.homeAway})</div>
                <div style={{fontSize:10,color:C.dim}}>{r.date} · {r.format}</div>
              </div>
              <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:resultColor(r.result)+'22',color:resultColor(r.result)}}>{r.result}</span>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Injury Room</div>
          {CRICKET_SQUAD.filter(p=>p.fitness!=='fit').map((p,i,a)=>(
            <div key={p.id} style={{padding:'8px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:13,color:C.text}}>{p.name}</span>
                <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:fitBadge(p.fitness)+'22',color:fitBadge(p.fitness)}}>{p.fitness}</span>
              </div>
              <div style={{fontSize:10,color:C.dim,marginTop:2}}>{p.role} · {p.age}y</div>
            </div>
          ))}
          <div style={{fontSize:11,color:C.green,marginTop:10}}>✓ {CRICKET_SQUAD.filter(p=>p.fitness==='fit').length} fully fit</div>
        </Card>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:12,marginBottom:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Headingley Weather — Fri</div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{fontSize:48}}>⛅</div>
            <div>
              <div style={{fontSize:28,fontWeight:600,color:C.text}}>14°C</div>
              <div style={{fontSize:11,color:C.muted}}>Partly cloudy · 22% rain</div>
              <div style={{fontSize:11,color:C.dim}}>Wind SW 14 km/h · Humidity 68%</div>
            </div>
          </div>
          <div style={{marginTop:12}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
              <span style={{fontSize:10,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600,flex:1}}>Pitch</span>
              {[
                {k:null,l:'Pre'},
                {k:1,l:'D1'},
                {k:2,l:'D2'},
                {k:3,l:'D3'},
                {k:4,l:'D4'},
              ].map((d,i)=>{
                const active = matchDay === d.k;
                return (
                  <button key={i}
                    type="button"
                    onClick={()=>setMatchDay(d.k)}
                    style={{
                      padding:'3px 8px', borderRadius:4, fontSize:10, fontWeight:600,
                      cursor:'pointer',
                      border:`1px solid ${active ? pitch.color : C.border}`,
                      background: active ? `${pitch.color}22` : 'transparent',
                      color: active ? pitch.color : C.muted,
                    }}>
                    {d.l}
                  </button>
                );
              })}
            </div>
            <div style={{padding:10,background:`${pitch.color}1A`,border:`1px solid ${pitch.color}55`,borderRadius:6,fontSize:11,color:pitch.color,display:'flex',alignItems:'flex-start',gap:8}}>
              <span style={{fontSize:13,lineHeight:1}}>{pitch.icon}</span>
              <div>
                <div style={{fontWeight:700,marginBottom:2}}>{pitch.label}</div>
                <div style={{color:C.muted,fontSize:10,lineHeight:1.5}}>{pitch.description}</div>
              </div>
            </div>
          </div>
        </Card>
        <Card style={{background:'linear-gradient(135deg,#0F1629 0%,#141d35 100%)',borderColor:C.purpleDim}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
            <div style={{width:32,height:32,borderRadius:'50%',background:C.purpleDim,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🤖</div>
            <div style={{fontSize:12,fontWeight:600,color:C.purple}}>Lumio AI — Morning Summary</div>
          </div>
          <div style={{fontSize:13,color:C.text,lineHeight:1.7,fontStyle:'italic',borderLeft:`3px solid ${C.purple}`,paddingLeft:14}}>
            "Good morning. Championship opener in 3 days. Brook passed his final fitness check yesterday — full availability confirmed. Coad bowled 12 overs unbroken in nets, on track for match workload. Lancashire's opener Jennings returned from injury last week — scout report flags he's been vulnerable to the nip-backer early. Weather looks good for toss decisions. Media training this afternoon with Sky — I'd suggest Brook and Gibson. Ticket sales at 94% of capacity for Friday — we're on track for a full Western Terrace."
          </div>
        </Card>
      </div>
      {/* AI Toss Decision Advisor */}
      <Card style={{marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em'}}>🌤️ AI Toss Decision Advisor</div>
          <button onClick={getTossAdvice} disabled={tossLoading} style={{padding:'6px 14px',borderRadius:6,border:'none',background:tossLoading?C.cardAlt:C.teal,color:tossLoading?C.muted:'#07080F',fontSize:11,fontWeight:700,cursor:tossLoading?'wait':'pointer'}}>
            {tossLoading?'Thinking…':'Get Toss Advice'}
          </button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:12}}>
          <div>
            <div style={{fontSize:10,color:C.dim,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.04em'}}>Ground</div>
            <input value={tossGround} onChange={e=>setTossGround(e.target.value)} style={{width:'100%',padding:'6px 8px',borderRadius:4,border:`1px solid ${C.border}`,background:C.cardAlt,color:C.text,fontSize:12}} />
          </div>
          <div>
            <div style={{fontSize:10,color:C.dim,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.04em'}}>Weather</div>
            <select value={tossWeather} onChange={e=>setTossWeather(e.target.value)} style={{width:'100%',padding:'6px 8px',borderRadius:4,border:`1px solid ${C.border}`,background:C.cardAlt,color:C.text,fontSize:12}}>
              {['Sunny','Overcast','Rain risk','Hot & dry'].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:10,color:C.dim,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.04em'}}>Pitch look</div>
            <select value={tossPitch} onChange={e=>setTossPitch(e.target.value)} style={{width:'100%',padding:'6px 8px',borderRadius:4,border:`1px solid ${C.border}`,background:C.cardAlt,color:C.text,fontSize:12}}>
              {['Green and grassy','Dry and brown','Normal','Damp'].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:10,color:C.dim,marginBottom:3,textTransform:'uppercase',letterSpacing:'0.04em'}}>Opposition batting</div>
            <select value={tossBatting} onChange={e=>setTossBatting(e.target.value)} style={{width:'100%',padding:'6px 8px',borderRadius:4,border:`1px solid ${C.border}`,background:C.cardAlt,color:C.text,fontSize:12}}>
              {['Strong top order','Balanced','Tail-heavy'].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        {tossError && <div style={{padding:10,background:C.redDim,border:`1px solid ${C.red}55`,borderRadius:6,fontSize:11,color:C.red}}>⚠ {tossError}</div>}
        {tossResult && !tossError && (()=>{
          const bat = tossResult.decision?.toUpperCase().includes('BAT');
          const color = bat ? C.green : C.amber;
          const bg = bat ? C.greenDim : C.amberDim;
          return (
            <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:14,alignItems:'start'}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                <div style={{padding:'14px 20px',borderRadius:8,background:bg,border:`2px solid ${color}`,color,fontSize:20,fontWeight:800,letterSpacing:'0.03em',whiteSpace:'nowrap'}}>
                  {bat ? 'BAT FIRST' : 'FIELD FIRST'}
                </div>
                <div style={{padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:C.cardAlt,color:C.muted,border:`1px solid ${C.border}`,textTransform:'uppercase',letterSpacing:'0.04em'}}>
                  {tossResult.confidence} confidence
                </div>
              </div>
              <div>
                <div style={{fontSize:12,color:C.text,lineHeight:1.6,marginBottom:10}}>{tossResult.reasoning}</div>
                {tossResult.key_factor && (
                  <div style={{padding:10,background:C.tealDim,border:`1px solid ${C.teal}55`,borderRadius:6,fontSize:11,color:C.teal}}>
                    <strong>Key factor:</strong> {tossResult.key_factor}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
        {!tossResult && !tossLoading && !tossError && (
          <div style={{fontSize:11,color:C.dim,fontStyle:'italic'}}>Enter match conditions above and click Get Toss Advice.</div>
        )}
      </Card>
      </div>)}

      {/* Other tabs — placeholder content */}
      {dashTab === 'quickwins' && <div className="pt-4 text-sm" style={{ color: C.muted }}>Quick win suggestions will appear here based on your upcoming fixtures and squad availability.</div>}
      {dashTab === 'dailytasks' && <div className="pt-4 text-sm" style={{ color: C.muted }}>Your daily tasks for today — team selection, media sessions, net bookings, and admin.</div>}
      {dashTab === 'insights' && <div className="pt-4 text-sm" style={{ color: C.muted }}>Performance insights, squad analytics, and competition trends across all formats.</div>}
      {dashTab === 'dontmiss' && <div className="pt-4 text-sm" style={{ color: C.muted }}>Time-sensitive items — ECB deadlines, contract renewals, overseas player visa status.</div>}
      {dashTab === 'team' && <div className="pt-4 text-sm" style={{ color: C.muted }}>Your coaching and support staff — availability, recent notes, and contact details.</div>}
    </div>
  );

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
              <span style={{fontSize:13,fontWeight:500}}>{r.date} · Yorkshire v {r.opponent} — {r.score} vs {r.oppScore}</span>
              <span style={{fontSize:11,color:C.dim}}>{expandedMatch===r.id?'▲':'▼'}</span>
            </button>
            {expandedMatch===r.id&&(
              <div style={{marginTop:10,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div>
                  <div style={{fontSize:11,color:C.dim,marginBottom:6}}>BATTING</div>
                  {[{n:'Lyth',r:82,b:136},{n:'Brook',r:124,b:142},{n:'Malan',r:46,b:78},{n:'Bairstow',r:52,b:61}].map(b=>(
                    <div key={b.n} style={{display:'flex',justifyContent:'space-between',fontSize:12,color:C.muted,padding:'3px 0'}}>
                      <span>{b.n}</span><span>{b.r} ({b.b})</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{fontSize:11,color:C.dim,marginBottom:6}}>BOWLING</div>
                  {[{n:'Coad',o:24,m:6,r:62,w:4},{n:'Fisher',o:22,m:5,r:71,w:3},{n:'Bess',o:18,m:3,r:54,w:2},{n:'Hill',o:10,m:2,r:28,w:1}].map(b=>(
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
          <Stat label="Top Average" value="52.8" color={C.teal} sub="Harry Brook"/>
          <Stat label="Team Run Rate" value="4.7" color={C.purple} sub="Runs per over · last 10"/>
          <Stat label="100s this season" value="8" color={C.amber} sub="Brook 3 · Lyth 2 · Malan 2 · Wharton 1"/>
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
          <div style={{fontSize:13,color:C.muted}}>Powered by CricViz · Hawkeye data feed</div>
        </div>
      </Card>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,color:C.dim,marginBottom:8}}>COUNTY CHAMPIONSHIP · DAY 2 OF 4</div>
        <div style={{fontSize:16,fontWeight:600,color:C.text,marginBottom:10}}>Yorkshire v Lancashire · Headingley</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:16}}>
          <div>
            <div style={{fontSize:11,color:C.dim}}>YORKSHIRE — 1ST INNINGS</div>
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
          <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:13,color:C.text}}>K Jennings *</span><span style={{fontSize:13,color:C.teal}}>78 (142)</span></div>
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
      <SectionHead title="County Championship — Division One" sub="LV= Insurance County Championship 2026 · CPA 2.0 compliance required"/>
      <Card style={{marginBottom:12,background:C.purpleDim,borderColor:C.purple}}>
        <div style={{fontSize:12,color:C.purple,fontWeight:600}}>CPA 2.0 · Minimum standards for Division One clubs — compliance check quarterly</div>
      </Card>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Division One Standings</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Team</Th><Th>P</Th><Th>W</Th><Th>D</Th><Th>L</Th><Th>Bonus</Th><Th>Pts</Th></tr></thead>
          <tbody>
            {CHAMPIONSHIP_TABLE.map((r,i)=>(
              <tr key={r.team} style={{borderBottom:i<CHAMPIONSHIP_TABLE.length-1?`1px solid ${C.border}`:'none',background:r.team==='Yorkshire'?C.tealDim:'transparent'}}>
                <Td color={r.team==='Yorkshire'?C.teal:C.text}>{i+1}. {r.team}</Td>
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
          <div style={{fontSize:12,color:C.muted,marginTop:8}}>2 up · 2 down format continues · Surrey & Yorkshire currently on promotion-form pace.</div>
        </Card>
      </div>
    </div>
  );

  const VitalityBlast=()=>(
    <div>
      <SectionHead title="Vitality Blast T20" sub="North Group · Road to Finals Day at Edgbaston"/>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>North Group</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Team</Th><Th>P</Th><Th>W</Th><Th>L</Th><Th>NRR</Th><Th>Pts</Th></tr></thead>
          <tbody>
            {BLAST_NORTH.map((t,i)=>(
              <tr key={t.team} style={{borderBottom:i<BLAST_NORTH.length-1?`1px solid ${C.border}`:'none',background:t.team==='Yorkshire'?C.tealDim:'transparent'}}>
                <Td color={t.team==='Yorkshire'?C.teal:C.text}>{i+1}. {t.team}</Td>
                <Td>{t.p}</Td><Td>{t.w}</Td><Td>{t.l}</Td><Td color={t.nrr>0?C.green:C.red}>{t.nrr>0?'+':''}{t.nrr.toFixed(2)}</Td><Td color={C.teal}>{t.pts}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:12}}>
        <Stat label="Team NRR" value="+0.88" color={C.green}/>
        <Stat label="Highest Score" value="214/4" color={C.purple} sub="vs Derbyshire"/>
        <Stat label="Best Bowling" value="4/18" color={C.amber} sub="Shutt"/>
      </div>
      <Card>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Finals Day Countdown</div>
        <div style={{fontSize:30,fontWeight:600,color:C.teal}}>14 Sep · Edgbaston</div>
        <div style={{fontSize:12,color:C.muted,marginTop:4}}>Qualification scenario: top 4 from 9 advance to quarters. Yorkshire projected 2nd in group on current pace.</div>
      </Card>
    </div>
  );

  const OneDayCup=()=>(
    <div>
      <SectionHead title="Metro Bank One Day Cup" sub="50-over competition · Group B"/>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Group B Standings</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}><Th>Team</Th><Th>P</Th><Th>W</Th><Th>L</Th><Th>NRR</Th><Th>Pts</Th></tr></thead>
          <tbody>
            {[{t:'Yorkshire',p:4,w:3,l:1,nrr:0.96,pts:6},{t:'Durham',p:4,w:3,l:1,nrr:0.42,pts:6},{t:'Notts',p:4,w:2,l:2,nrr:0.1,pts:4},{t:'Derbyshire',p:4,w:1,l:3,nrr:-0.6,pts:2},{t:'Leicestershire',p:4,w:1,l:3,nrr:-0.88,pts:2}].map((r,i,a)=>(
              <tr key={r.t} style={{borderBottom:i<a.length-1?`1px solid ${C.border}`:'none',background:r.t==='Yorkshire'?C.tealDim:'transparent'}}>
                <Td color={r.t==='Yorkshire'?C.teal:C.text}>{i+1}. {r.t}</Td><Td>{r.p}</Td><Td>{r.w}</Td><Td>{r.l}</Td><Td>{r.nrr.toFixed(2)}</Td><Td color={C.teal}>{r.pts}</Td>
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
        <div style={{fontSize:12,color:C.muted}}>Yorkshire's 49% retained stake in Northern Superchargers locks in annual revenue share of approx £5.2m/yr for 2026–2031.</div>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Northern Superchargers</div>
          <div style={{fontSize:18,color:C.text,marginBottom:6}}>Franchise partner · Headingley home</div>
          <div style={{fontSize:12,color:C.muted}}>Joint operations: pitch, matchday, kit storage · Yorkshire provides 3 facility staff on loan.</div>
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
          {['Harry Brook','Jonny Bairstow','Adam Lyth','George Hill','Dawid Malan','Matthew Fisher','Jack Shutt','Will Luxton'].map(n=>(
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
      <SectionHead title="Academy & Youth Pathway" sub="Yorkshire Pathway · U10 through U21 · ECB-aligned talent ID"/>
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
                {n:'Oliver Hartley',a:16,s:'U17',r:'A-',m:'U19 promotion'},
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
              {n:'Liam Dawson',c:'Hampshire',r:'Allrounder',a:'Phoenix Sports',s:'In talks',int:'High'},
              {n:'Tom Lawes',c:'Surrey',r:'Bowler',a:'SFX',s:'Initial contact',int:'Medium'},
              {n:'Ollie Robinson',c:'Sussex',r:'Bowler',a:'ISM',s:'Research',int:'High'},
              {n:'Jake Libby',c:'Worcs',r:'Batter',a:'AGI',s:'Dormant',int:'Low'},
              {n:'Sam Hain',c:'Warwicks',r:'Batter',a:'ISM',s:'In talks',int:'High'},
              {n:'Luke Wood',c:'Lancashire',r:'Bowler',a:'Phoenix',s:'Research',int:'Medium'},
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
      <SectionHead title="Facilities & Grounds" sub="Headingley main ground, nets, outgrounds and maintenance"/>
      <Card style={{marginBottom:12,background:'linear-gradient(90deg,#0f1629,#1a2340)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div style={{fontSize:11,color:C.dim}}>MAIN GROUND</div>
            <div style={{fontSize:20,fontWeight:600,color:C.text}}>Headingley Cricket Ground</div>
            <div style={{fontSize:12,color:C.muted,marginTop:4}}>Leeds, West Yorkshire · Test venue · Home of Yorkshire CCC since 1890</div>
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
            {i:'Western Terrace roof leak',s:'Scheduled'},
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
                {i:'Whites (XL)',s:'Adidas',st:6,status:'low'},
                {i:'Pads, batting',s:'Masuri',st:22,status:'ok'},
                {i:'Pads, wicket-keeping',s:'Masuri',st:4,status:'ok'},
                {i:'Helmets',s:'Masuri',st:18,status:'ok'},
                {i:'Red Dukes balls',s:'Dukes',st:3,status:'reorder'},
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
            {[{s:'Adidas',val:180000,e:'Dec 2027'},{s:'Gray-Nicolls',val:65000,e:'Sep 2026'},{s:'Masuri',val:28000,e:'Mar 2027'}].map((c,i,a)=>(
              <div key={c.s} style={{padding:'6px 0',borderBottom:i<a.length-1?`1px solid ${C.border}`:'none'}}>
                <div style={{fontSize:12,color:C.text}}>{c.s}</div>
                <div style={{fontSize:10,color:C.dim}}>{fmt(c.val)} · exp {c.e}</div>
              </div>
            ))}
          </Card>
          <Card style={{background:C.amberDim,borderColor:C.amber}}>
            <div style={{fontSize:12,color:C.amber,fontWeight:600,marginBottom:6}}>⚠ Reorder Alerts</div>
            <div style={{fontSize:11,color:C.muted}}>Red Dukes balls &lt; 6 unit threshold — reorder 24 today</div>
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
        <div style={{fontSize:12,color:C.muted,padding:'6px 0'}}>• Yorkshire Building Society — Headline partner exploratory · £120k</div>
        <div style={{fontSize:12,color:C.muted,padding:'6px 0'}}>• Leeds United FC — cross-city partnership · £30k trial</div>
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
            {d:'Sat 12 Apr',c:'Brook feature longform'},
            {d:'Sun 13 Apr',c:'Women\'s match preview'},
            {d:'Mon 14 Apr',c:'Coad training diary'},
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
            <div style={{fontSize:12,color:C.muted,padding:'5px 0'}}>• The Cricketer — Brook profile</div>
            <div style={{fontSize:12,color:C.muted,padding:'5px 0'}}>• Yorkshire Post — Gibson Q&A</div>
          </Card>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Broadcast</div>
            <div style={{fontSize:12,color:C.muted}}>Sky Sports · Lancs (H) · Day 1 live</div>
            <div style={{fontSize:12,color:C.muted}}>BBC Radio Leeds · all home matches</div>
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
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Friday vs Lancashire</div>
          <div style={{fontSize:16,color:C.text}}>Projected attendance: <span style={{color:C.teal,fontWeight:600}}>17,280</span></div>
          <div style={{fontSize:12,color:C.muted,marginTop:4}}>94% of capacity · Western Terrace full</div>
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
          <div style={{fontSize:14,color:C.text,fontWeight:500}}>Sarah Hampson</div>
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
          {[{c:'Midlands Bank',v:60000,d:'Q1 activation'},{c:'Apex Construction',v:22500,d:'Quarterly'},{c:'Sky Sports',v:18000,d:'Filming access'}].map((inv,i,a)=>(
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
    <div>
      <SectionHead title="Settings" sub="Club configuration, integrations, notifications"/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Card>
          <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Club Details</div>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:11,color:C.dim,marginBottom:4}}>Club name</div>
            <input defaultValue="Yorkshire County Cricket Club" style={{width:'100%',padding:'8px 10px',background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:13}}/>
          </div>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:11,color:C.dim,marginBottom:4}}>Home ground</div>
            <input defaultValue="Headingley Cricket Ground" style={{width:'100%',padding:'8px 10px',background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:13}}/>
          </div>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:11,color:C.dim,marginBottom:4}}>ECB number · CPA ID</div>
            <div style={{display:'flex',gap:6}}>
              <input defaultValue="ECB-18" style={{flex:1,padding:'8px 10px',background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:13}}/>
              <input defaultValue="CPA-YORKS-26" style={{flex:1,padding:'8px 10px',background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:13}}/>
            </div>
          </div>
          <div>
            <div style={{fontSize:11,color:C.dim,marginBottom:4}}>Club logo</div>
            <button style={{padding:'8px 14px',borderRadius:6,border:`1px dashed ${C.border}`,background:'transparent',color:C.muted,fontSize:12,cursor:'pointer',width:'100%'}}>Upload logo (PNG/SVG)</button>
          </div>
        </Card>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Notifications</div>
            {['Injury alerts','Contract deadlines','Match reminders','DBS expiry warnings','AI briefing email'].map(n=>(
              <label key={n} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 0',fontSize:12,color:C.muted,cursor:'pointer'}}>
                <input type="checkbox" defaultChecked/>{n}
              </label>
            ))}
          </Card>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Integrations</div>
            {[{n:'CricViz',on:true},{n:'Hawkeye',on:false},{n:'Catapult GPS',on:true},{n:'Play-Cricket',on:true}].map(i=>(
              <div key={i.n} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:13,color:C.text}}>{i.n}</span>
                <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:i.on?C.greenDim:C.border,color:i.on?C.green:C.dim}}>{i.on?'Connected':'Off'}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
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
              <div style={{fontSize:10,textTransform:'uppercase',color:C.muted}}>Revised target</div>
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
      try {
        const res = await fetch('/api/ai/cricket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 400,
            messages: [{ role: 'user', content: 'Yorkshire CCC net session review. Bowlers: Reed (72 del planned, limit 96, ACWR 0.94), Dawson (48 del planned, limit 36, ACWR 1.62), Harrison (12 del, return-to-play). Championship vs Lancashire in 2 days. Is this week\u2019s load appropriate? Give 2-3 sentence recommendation.' }],
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
      try {
        const res = await fetch('/api/ai/cricket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 600,
            system: 'You are the media officer for Yorkshire CCC. Write match reports in a professional but warm style for club communications.',
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
<h1>YORKSHIRE CCC — MATCH REPORT</h1>
<div class="sub">vs ${selected.opponent} (${selected.homeAway}) &middot; ${selected.competition} &middot; ${selected.date} &middot; ${selected.result}</div>
<div class="body">${reportText.replace(/</g,'&lt;')}</div>
<div class="footer">Generated by Lumio Tour &middot; Yorkshire CCC Media Office</div>
</body></html>`);
      w.document.close();
      setTimeout(() => { try { w.print(); } catch {} }, 300);
    }
    const previousReports = [
      { date:'18 Mar 2026', opp:'Durham MCCU', result:'W', text:'Yorkshire opened their pre-season with an emphatic performance at Headingley, thanks largely to Harry Brook\u2019s patient 124. Coad led the bowling with 4-62 in a disciplined red-ball display.' },
      { date:'03 Mar 2026', opp:'Lancashire XI', result:'D', text:'A rain-affected draw at Emirates Old Trafford saw Yorkshire declare on 380/6 before weather intervened. Bairstow contributed 87 from number five.' },
      { date:'22 Feb 2026', opp:'MCC', result:'W', text:'Gibson\u2019s five-wicket haul was the standout of a commanding 6-wicket win at Lord\u2019s. Yorkshire chased down 210 in 42 overs with Lyth anchoring the innings.' },
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

  const pages={
    dashboard:<Dashboard/>,briefing:<Briefing/>,
    'match-centre':<MatchCentre/>,'batting-analytics':<BattingAnalytics/>,'bowling-analytics':<BowlingAnalytics/>,
    'video-analysis':<VideoAnalysis/>,opposition:<Opposition/>,livescores:<LiveScores/>,'practice-log':<PracticeLog/>,declaration:<DeclarationPlanner/>,dls:<DLSCalculator/>,'fan-engagement':<FanEngagement/>,'performance-stats':<PerformanceStats/>,
    squad:<Squad/>,medical:<Medical/>,gps:<GPS/>,pathway:<Pathway/>,overseas:<Overseas/>,'contract-hub':<ContractHub/>,'agent-pipeline':<AgentPipeline/>,signings:<SigningPipeline/>,'net-planner':<NetSessionPlanner/>,'match-report':<MatchReport/>,
    'county-championship':<CountyChampionship/>,'vitality-blast':<VitalityBlast/>,'od-cup':<OneDayCup/>,'the-hundred':<TheHundred/>,womens:<Womens/>,academy:<AcademyYouth/>,
    staff:<Staff/>,facilities:<FacilitiesGrounds/>,kit:<KitEquipment/>,travel:<TravelLogistics/>,'team-comms':<TeamComms/>,
    commercial:<Commercial/>,sponsorship:<SponsorshipPipeline/>,media:<MediaContent/>,'ticket-matchday':<TicketMatchDay/>,
    board:<Board/>,compliance:<Compliance/>,edi:<EDIDashboard/>,safeguarding:<SafeguardingView/>,finance:<FinanceView/>,settings:<SettingsView/>,
    preseason:<div className="p-8 text-center text-gray-500">Pre-Season coming soon</div>,
  };

  return(
    <div style={{display:'flex',minHeight:'100vh',background:C.bg,fontFamily:'"DM Sans","Inter",system-ui,sans-serif',color:C.text}}>
      {/* Sidebar — floating when unpinned */}
      <aside
        className="hidden md:flex flex-col overflow-hidden"
        style={{
          width: sidebarExpanded ? 220 : 72,
          backgroundColor: C.sidebar,
          borderRight: `1px solid ${C.border}`,
          transition: 'width 250ms ease',
          position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 40,
        }}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}>

        <div className="flex items-center shrink-0" style={{ borderBottom: `1px solid ${C.border}`, minHeight: 56, padding: sidebarExpanded ? '12px 10px' : '12px 4px', gap: sidebarExpanded ? 8 : 0 }}>
          <div className="flex items-center gap-2 flex-1 min-w-0" style={{ justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? 4 : 0 }}>
            <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${C.purple},${C.teal})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>🏏</div>
            {sidebarExpanded && <div><div style={{fontSize:13,fontWeight:700,color:C.text}}>Lumio Cricket</div><div style={{fontSize:10,color:C.dim}}>Yorkshire CCC</div></div>}
          </div>
          {sidebarExpanded && (
            <button onClick={toggleSidebarPin} className="shrink-0 p-1 rounded" style={{ color: sidebarPinned ? C.purple : '#4B5563', transform: sidebarPinned ? 'rotate(0deg)' : 'rotate(45deg)', transition: 'transform 200ms, color 200ms' }} title={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar open'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z"/></svg>
            </button>
          )}
        </div>

        <nav style={{flex:1,overflowY:'auto',padding:'10px 6px'}}>
          {SECTIONED_NAV.map((sec,si)=>(
            <div key={sec.section}>
              {sidebarExpanded && <div style={{fontSize:10,color:C.dim,letterSpacing:'0.1em',padding:'10px 10px 6px',textTransform:'uppercase',marginTop:si===0?0:6}}>{sec.section}</div>}
              {sec.items.map(item=>(
                <button key={item.id} onClick={()=>{setPage(item.id); if (!sidebarPinned) setSidebarHovered(false)}}
                  className="w-full flex items-center gap-2.5 py-2 rounded-lg mb-0.5 transition-all text-left"
                  style={{
                    backgroundColor: page===item.id ? C.purpleDim : 'transparent',
                    color: page===item.id ? C.purple : C.muted,
                    borderLeft: page===item.id ? `2px solid ${C.purple}` : '2px solid transparent',
                    paddingLeft: sidebarExpanded ? 10 : 0,
                    justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                    border: 'none', cursor: 'pointer',
                  }}
                  title={sidebarExpanded ? undefined : item.label}>
                  <span style={{fontSize:14,width:18,textAlign:'center',flexShrink:0}}>{item.icon}</span>
                  {sidebarExpanded && <span style={{fontSize:13,fontWeight:page===item.id?600:400}}>{item.label}</span>}
                  {sidebarExpanded && item.badge && <span style={{marginLeft:'auto',fontSize:9,padding:'1px 6px',borderRadius:10,background:C.tealDim,color:C.teal}}>{item.badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {session && (
          <RoleSwitcher
            session={session}
            roles={CRICKET_ROLES}
            accentColor="#b45309"
            onRoleChange={(role) => {
              setRoleOverride(role)
              const key = 'lumio_cricket_demo_session'
              const stored = localStorage.getItem(key)
              if (stored) { const parsed = JSON.parse(stored); localStorage.setItem(key, JSON.stringify({ ...parsed, role })) }
            }}
            sidebarCollapsed={!sidebarExpanded}
          />
        )}

        <div className="p-4 border-t flex items-center justify-center" style={{ borderColor: C.border }}>
          {sidebarExpanded
            ? <img src="/cricket_logo.png" alt="Lumio Cricket" style={{ maxHeight: 32, objectFit: 'contain' }} className="opacity-70 hover:opacity-100 transition-opacity" />
            : <span className="text-lg">🏏</span>}
        </div>
      </aside>

      {/* Content */}
      <div style={{flex:1,overflowY:'auto',marginLeft: sidebarPinned ? 220 : 72, transition:'margin-left 250ms ease'}}>
        {/* Demo workspace banner */}
        <div className="flex items-center justify-between px-6 py-2 text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#0D9488', color: '#ffffff' }}>
          <span>Demo workspace · sample data</span>
          <a href="/pricing-sports" className="flex items-center gap-1 hover:underline font-semibold" style={{ color: '#ffffff' }}>To see your own data — sign up for 3 months free →</a>
        </div>
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
      defaultClubName="Lumio Cricket Club"
      defaultSlug={slug}
      accentColor="#b45309"
      accentColorLight="#d97706"
      sportEmoji="🏏"
      sportLabel="Lumio Cricket"
      roles={CRICKET_ROLES}
    >
      {(session) => <CricketPortalInner session={session} />}
    </SportsDemoGate>
  )
}
