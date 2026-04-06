'use client'

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line } from "recharts";

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

const NAV=[
  {id:'briefing',label:'Morning Briefing',icon:'☀'},
  {id:'squad',label:'Squad Manager',icon:'👥'},
  {id:'pathway',label:'Player Pathway',icon:'🎓'},
  {id:'medical',label:'Medical Hub',icon:'🏥'},
  {id:'gps',label:'GPS Tracking',icon:'📡'},
  {id:'compliance',label:'ECB Compliance',icon:'📋'},
  {id:'overseas',label:'Overseas Players',icon:'✈'},
  {id:'opposition',label:'Opposition',icon:'🔬'},
  {id:'womens',label:"Women's Cricket",icon:'🏏'},
  {id:'commercial',label:'Commercial',icon:'💼'},
  {id:'board',label:'Board Suite',icon:'📊'},
  {id:'staff',label:'Staff & HR',icon:'👤'},
];

const fmt=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n);
const pct=(a,b)=>Math.round((a/b)*100);

export default function LumioCricket(){
  const[page,setPage]=useState('briefing');
  const[format,setFormat]=useState('ch');
  const[gpsIdx,setGpsIdx]=useState(0);
  const gp=GPS_DATA[gpsIdx];

  const statusColor=st=>{
    if(st==='fit'||st==='confirmed'||st==='valid'||st==='active'||st==='Complete')return C.green;
    if(st==='monitoring'||st==='pending'||st==='expiring'||st==='negotiating'||st==='amber'||st==='In progress'||st==='Approved')return C.amber;
    if(st==='injury'||st==='expired'||st==='urgent'||st==='red')return C.red;
    return C.muted;
  };
  const statusBg=st=>{
    const s=statusColor(st);
    return s===C.green?C.greenDim:s===C.amber?C.amberDim:s===C.red?C.redDim:C.border;
  };

  const Pill=({label,active,onClick})=>(
    <button onClick={onClick} style={{padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:500,cursor:'pointer',
      border:'1px solid',transition:'all 0.15s',
      borderColor:active?C.purple:C.border,
      background:active?C.purpleDim:'transparent',
      color:active?C.purple:C.muted}}>
      {label}
    </button>
  );

  const Stat=({label,value,sub,color=C.teal})=>(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'14px 18px',flex:1,minWidth:0}}>
      <div style={{fontSize:11,color:C.dim,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>{label}</div>
      <div style={{fontSize:22,fontWeight:600,color,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>{sub}</div>}
    </div>
  );

  const Card=({children,style={}})=>(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,...style}}>{children}</div>
  );

  const SectionHead=({title,sub})=>(
    <div style={{marginBottom:20}}>
      <h2 style={{fontSize:20,fontWeight:600,color:C.text,margin:0}}>{title}</h2>
      {sub&&<p style={{fontSize:13,color:C.muted,margin:'4px 0 0'}}>{sub}</p>}
    </div>
  );

  const StatusBadge=({st,label})=>{
    const l=label||st;
    return <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,
      color:statusColor(st),background:statusBg(st)}}>{l}</span>;
  };

  // ── CRICKET GROUND SVG ────────────────────────────────────────────
  const CricketGround=({player})=>(
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
  const BowlGauge=({bowl})=>{
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
                <span style={{fontSize:20,fontWeight:600,color:bowl.acr>1.3?C.red:bowl.acr>1.0?C.amber:C.green}}>{bowl.acr.toFixed(2)}</span>
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
      <SectionHead title="Morning Briefing" sub="Wednesday 8 April 2026 · Northbrook CC · County Championship begins in 6 days"/>
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
    const filtered=SQUAD.filter(p=>p[format]);
    return(
      <div>
        <SectionHead title="Multi-Format Squad Manager" sub="Player availability, eligibility and format conflicts across all four competitions"/>
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
          {fmts.map(f=><Pill key={f.id} label={f.label} active={format===f.id} onClick={()=>setFormat(f.id)}/>)}
          <div style={{marginLeft:'auto',display:'flex',gap:8}}>
            <span style={{padding:'6px 14px',borderRadius:20,fontSize:12,background:C.greenDim,color:C.green}}>✓ {SQUAD.filter(p=>p[format]&&p.st==='fit').length} fit</span>
            {SQUAD.filter(p=>p[format]&&p.st==='injury').length>0&&<span style={{padding:'6px 14px',borderRadius:20,fontSize:12,background:C.redDim,color:C.red}}>⚠ {SQUAD.filter(p=>p[format]&&p.st==='injury').length} injured</span>}
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
                        p[f.k]?<span key={f.k} style={{padding:'1px 6px',borderRadius:3,fontSize:10,background:format===f.k?C.purple:C.purpleDim,color:format===f.k?'white':C.purple}}>{f.l}</span>:
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
                <Tooltip contentStyle={{background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}} formatter={v=>[`${v.toFixed(1)} km/h`,'']}/>
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
                    <div style={{fontSize:11,color:p[m.k]>=7?C.green:p[m.k]>=5?C.amber:C.red,fontWeight:500}}>{p[m.k]}</div>
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
  const Overseas=()=>(
    <div>
      <SectionHead title="Overseas Player Management" sub="ECB eligibility tracking, visa management and format rotation planning"/>
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
  );

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
              <Tooltip contentStyle={{background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}} formatter={v=>[fmt(v),'']}/>
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
            <Tooltip contentStyle={{background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}} formatter={v=>[fmt(v),'']}/>
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

  const pages={briefing:<Briefing/>,squad:<Squad/>,gps:<GPS/>,medical:<Medical/>,pathway:<Pathway/>,compliance:<Compliance/>,overseas:<Overseas/>,opposition:<Opposition/>,womens:<Womens/>,commercial:<Commercial/>,board:<Board/>,staff:<Staff/>};

  return(
    <div style={{display:'flex',minHeight:'100vh',background:C.bg,fontFamily:'"DM Sans","Inter",system-ui,sans-serif',color:C.text}}>
      {/* Sidebar */}
      <div style={{width:220,background:C.sidebar,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',flexShrink:0,position:'sticky',top:0,height:'100vh',overflowY:'auto'}}>
        <div style={{padding:'18px 16px 14px',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${C.purple},${C.teal})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🏏</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:C.text,letterSpacing:'-0.01em'}}>Lumio Cricket</div>
              <div style={{fontSize:10,color:C.dim}}>Northbrook CC</div>
            </div>
          </div>
          <div style={{padding:'6px 10px',background:C.purpleDim,borderRadius:6,display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6}}>
            <span style={{fontSize:11,color:C.purple}}>Division One · 2026</span>
            <span style={{width:6,height:6,borderRadius:'50%',background:C.green,display:'inline-block'}}/>
          </div>
        </div>
        <nav style={{flex:1,padding:'10px 8px'}}>
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>setPage(item.id)} style={{
              width:'100%',display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:8,
              border:'none',cursor:'pointer',marginBottom:2,textAlign:'left',
              transition:'all 0.12s',
              background:page===item.id?C.purpleDim:'transparent',
              color:page===item.id?C.purple:C.muted,
            }}>
              <span style={{fontSize:14,width:18,textAlign:'center'}}>{item.icon}</span>
              <span style={{fontSize:13,fontWeight:page===item.id?500:400}}>{item.label}</span>
              {item.id==='gps'&&<span style={{marginLeft:'auto',fontSize:9,padding:'1px 6px',borderRadius:10,background:C.tealDim,color:C.teal}}>NEW</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:'12px 16px',borderTop:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,color:C.dim,marginBottom:4}}>GPS System</div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:C.green}}/>
            <span style={{fontSize:11,color:C.green}}>Lumio Vest · 7 active</span>
          </div>
          <div style={{fontSize:10,color:C.dim,marginTop:2}}>Last sync: 08:12 today</div>
        </div>
      </div>
      {/* Content */}
      <div style={{flex:1,overflowY:'auto',padding:'24px 28px'}}>
        {pages[page]||<Briefing/>}
      </div>
    </div>
  );
}
