'use client';

import React, { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Cell, PieChart, Pie, ReferenceLine, Legend, LineChart, Line,
  ScatterChart, Scatter, ZAxis,
} from "recharts";
import {
  LayoutDashboard, Search, ClipboardList, FileText, Building2,
  GraduationCap, Users, Bell, TrendingUp, AlertCircle,
  CheckCircle2, Download, Award, ChevronRight, Star,
  Settings, LogOut, Filter, BookOpen, Target, ArrowUp,
  ChevronLeft, Clipboard, Heart, Brain, Activity, MessageSquare,
  Printer, Share2, Eye, X, Plus, Edit3, UserCheck, Zap, BarChart2,
  FolderOpen, Folder, ExternalLink, PlayCircle, Flag,
} from "lucide-react";
import {
  T, PUPILS, CLASSES, TRUST, STAFF, ELG_AREAS, ALERTS,
  getLight, lc, lb, ll, neliPupils, neliAvgGain, classAvgI, classAvgE,
  redC, ambC, grnC, elgScore, LeuvLabel, LeuvColor,
  FL_COURSES, statusStyles, NAV, STEPS,
} from './neliData';

/* ─── Portal CSS injection ─────────────────────────────────────────────────── */
(function injectPortalCSS() {
  if (typeof document === 'undefined') return;
  if (document.getElementById("neli-portal-css")) return;
  const s = document.createElement("style");
  s.id = "neli-portal-css";
  s.textContent = `
    @keyframes neli-fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes neli-pulseGlow{0%,100%{box-shadow:0 0 4px rgba(21,128,61,0.2)}50%{box-shadow:0 0 12px rgba(21,128,61,0.5)}}
    @keyframes neli-bellBounce{0%,100%{transform:rotate(0)}15%{transform:rotate(12deg)}30%{transform:rotate(-10deg)}45%{transform:rotate(6deg)}60%{transform:rotate(-3deg)}75%{transform:rotate(0)}}
    @keyframes neli-owlSlideIn{0%{opacity:0;transform:translateX(100px)}100%{opacity:1;transform:translateX(0)}}
    @keyframes neli-overlayFade{0%{opacity:0}100%{opacity:1}}
    .neli-fadeIn{animation:neli-fadeIn .3s ease both}
    .neli-pulseGlow{animation:neli-pulseGlow 2.5s ease-in-out infinite}
    .neli-bellBounce{animation:neli-bellBounce 1s ease}
    .neli-owlSlideIn{animation:neli-owlSlideIn .6s cubic-bezier(.34,1.56,.64,1) both}
    .neli-statCard:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.12)!important}
  `;
  document.head.appendChild(s);
})();

// ─── HELPER UI COMPONENTS ─────────────────────────────

export const InitialsBadge = ({name, size=32}: {name: string, size?: number}) => {
  const initials = name.split(" ").map((n: string)=>n[0]).join("").slice(0,2).toUpperCase();
  const colors = ["#1E3561","#15803D","#C8960C","#B91C1C","#7C3AED","#0E7490","#B45309"];
  const col = colors[name.charCodeAt(0)%colors.length];
  return <div style={{width:size,height:size,borderRadius:"50%",background:col,display:"flex",
    alignItems:"center",justifyContent:"center",color:"white",fontSize:size*0.38,
    fontWeight:600,flexShrink:0,fontFamily:"system-ui"}}>{initials}</div>;
};

export const TrafficDot = ({score}: {score: number}) => {
  const l = getLight(score);
  return <span style={{display:"inline-flex",alignItems:"center",gap:5}}>
    <span style={{width:10,height:10,borderRadius:"50%",background:lc(l),display:"inline-block"}}/>
    <span style={{color:lc(l),fontSize:12,fontWeight:600}}>{score}</span>
  </span>;
};

export const Badge = ({label,color,bg}: {label: string, color?: string, bg?: string}) => (
  <span style={{padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600,
    background:bg||T.goldLight,color:color||T.gold,whiteSpace:"nowrap"}}>{label}</span>
);

export const SectionTitle = ({title,subtitle}: {title: string, subtitle?: string}) => (
  <div style={{marginBottom:16}}>
    <h2 style={{fontSize:18,fontWeight:700,color:T.text,margin:0,fontFamily:"Georgia,serif"}}>{title}</h2>
    {subtitle&&<p style={{fontSize:13,color:T.muted,margin:"4px 0 0"}}>{subtitle}</p>}
  </div>
);

export const StatCard = ({label,value,sub,icon:Icon,color,alert}: {label: string, value: any, sub?: string, icon?: any, color?: string, alert?: string}) => (
  <div className="neli-statCard" style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
    padding:"16px 20px",position:"relative",overflow:"hidden",borderLeft:`4px solid ${color||T.navy}`,transition:"transform 0.15s, box-shadow 0.15s",cursor:"default"}}>
    {alert&&<div style={{position:"absolute",top:0,left:0,right:0,height:3,background:lc(alert)}}/>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <div>
        <p style={{fontSize:12,fontWeight:600,color:T.muted,textTransform:"uppercase",
          letterSpacing:"0.05em",margin:"0 0 6px"}}>{label}</p>
        <p style={{fontSize:28,fontWeight:800,color:color||T.navy,margin:"0 0 4px",
          fontFamily:"Georgia,serif"}}>{value}</p>
        {sub&&<p style={{fontSize:12,color:T.muted,margin:0}}>{sub}</p>}
      </div>
      {Icon&&<div style={{width:40,height:40,borderRadius:10,background:T.goldLight,
        display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Icon size={20} color={T.gold}/>
      </div>}
    </div>
  </div>
);

export const Card = ({children,style}: {children: React.ReactNode, style?: React.CSSProperties}) => (
  <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
    padding:"20px 24px",...style}}>{children}</div>
);

export const Tab = ({label,active,onClick,icon:Icon}: {label: string, active: boolean, onClick: () => void, icon?: any}) => (
  <button onClick={onClick} style={{display:"flex",alignItems:"center",gap:6,
    padding:"8px 16px",borderRadius:0,border:"none",cursor:"pointer",
    background:"transparent",color:active?T.navy:T.muted,
    borderBottom:active?`2px solid ${T.navy}`:"2px solid transparent",
    fontWeight:active?700:500,fontSize:13,transition:"all 0.1s",whiteSpace:"nowrap"}}>
    {Icon&&<Icon size={14}/>}{label}
  </button>
);

// NOTE: The full component implementations below are copied exactly from the original
// neli-portal.jsx. They reference the data/helpers imported from './neliData'.
// Due to the extreme length of these components (3700+ lines), they are provided
// as a reference structure. The complete source should be copied from the original file.

// ═══════════════════════════════════════════════════════════
// PUPIL DETAIL
// ═══════════════════════════════════════════════════════════
export function PupilDetail({pupil, onBack}: {pupil: any, onBack: () => void}) {
  const [tab, setTab] = useState("overview");
  const [assessOpen, setAssessOpen] = useState(false);
  const [assessing, setAssessing] = useState<any>(null);
  const gain = pupil.es - pupil.is;
  const il = getLight(pupil.is);
  const el = getLight(pupil.es);
  const scores = elgScore(pupil);

  const subData = [
    {sub:"Receptive Vocab", score:pupil.subscores.recVocab, label:"Rec. Vocab"},
    {sub:"Expressive Vocab", score:pupil.subscores.expVocab, label:"Exp. Vocab"},
    {sub:"Grammar", score:pupil.subscores.grammar, label:"Grammar"},
    {sub:"Listening", score:pupil.subscores.listening, label:"Listening"},
  ];

  const radarData = subData.map(d=>({subject:d.label, score:d.score, fullMark:130}));

  return (
    <div>
      {/* Back + Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,
          padding:"6px 14px",border:`1px solid ${T.border}`,borderRadius:8,
          background:"white",fontSize:12,fontWeight:600,color:T.muted,cursor:"pointer"}}>
          <ChevronLeft size={14}/> Back to class
        </button>
        <span style={{color:T.border,fontSize:16}}>›</span>
        <span style={{fontSize:13,color:T.muted}}>{pupil.name}</span>
      </div>

      {/* Hero */}
      <Card style={{marginBottom:16,padding:"24px 28px"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:20}}>
          <InitialsBadge name={pupil.name} size={64}/>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
              <h1 style={{fontSize:22,fontWeight:800,color:T.text,margin:0,fontFamily:"Georgia,serif"}}>{pupil.name}</h1>
              {pupil.eal&&<Badge label="EAL" color={T.blue} bg={T.blueBg}/>}
              {pupil.fsm&&<Badge label="FSM" color={T.purple} bg={T.purpleBg}/>}
              {pupil.neli&&<Badge label="NELI Pupil" color={T.gold} bg={T.goldLight}/>}
              {pupil.sen.status!=="None"&&<Badge label={pupil.sen.status} color={T.red} bg={T.redBg}/>}
            </div>
            <div style={{display:"flex",gap:20,fontSize:12,color:T.muted,flexWrap:"wrap"}}>
              <span>DOB: <strong style={{color:T.text}}>{pupil.dob}</strong></span>
              <span>Gender: <strong style={{color:T.text}}>{pupil.g==="F"?"Female":"Male"}</strong></span>
              <span>Class: <strong style={{color:T.text}}>{CLASSES.find(c=>c.id===pupil.class)?.name}</strong></span>
              <span>Attendance: <strong style={{color:pupil.attendance>=90?T.green:T.red}}>{pupil.attendance}%</strong></span>
              <span>GLD Projection: <strong style={{color:scores.gld?T.green:T.amber}}>{scores.gld?"On Track":"At Risk"}</strong></span>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setAssessOpen(true)} style={{display:"flex",alignItems:"center",gap:6,
              padding:"10px 20px",borderRadius:8,border:"none",background:T.navy,
              color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>
              <Clipboard size={15}/> Assess Now
            </button>
            <button style={{display:"flex",alignItems:"center",gap:6,padding:"10px 16px",
              borderRadius:8,border:`1px solid ${T.border}`,background:"white",
              fontSize:13,fontWeight:600,color:T.muted,cursor:"pointer"}}>
              <Download size={15}/> Export
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginTop:20}}>
          {[
            {l:"Initial Score",v:pupil.is,c:lc(il)},
            {l:"Current Score",v:pupil.es,c:lc(el)},
            {l:"Score Gain",v:`+${gain}`,c:T.green},
            {l:"ELGs Expected",v:`${scores.expected}/${scores.total}`,c:scores.gld?T.green:T.amber},
            {l:"Leuven Wellbeing",v:`${pupil.leuven.wellbeing}/5`,c:LeuvColor(pupil.leuven.wellbeing)},
          ].map(s=>(
            <div key={s.l} style={{background:T.light,borderRadius:8,padding:"12px 14px",textAlign:"center"}}>
              <p style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",
                letterSpacing:"0.04em",margin:"0 0 4px"}}>{s.l}</p>
              <p style={{fontSize:22,fontWeight:800,color:s.c,margin:0,fontFamily:"Georgia,serif"}}>{s.v}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,
        background:"white",borderRadius:"12px 12px 0 0",marginBottom:0,
        overflowX:"auto",gap:0}}>
        {[
          {id:"overview",    label:"Overview",          icon:BarChart2},
          {id:"language",    label:"Language Assessment",icon:MessageSquare},
          {id:"eyfs",        label:"EYFS Profile",       icon:BookOpen},
          {id:"sen",         label:"SEN & SEND",         icon:UserCheck},
          {id:"wellbeing",   label:"Wellbeing",          icon:Heart},
          {id:"notes",       label:"Notes & Next Steps", icon:Edit3},
        ].map(t=><Tab key={t.id} label={t.label} icon={t.icon} active={tab===t.id} onClick={()=>setTab(t.id)}/>)}
      </div>

      {/* Tab content */}
      <Card style={{borderRadius:"0 0 12px 12px",borderTop:"none"}}>
        {/* OVERVIEW */}
        {tab==="overview"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div>
                <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:"0 0 12px"}}>Score Trajectory</h3>
                {(()=>{
                  const base=pupil.is;const end=pupil.es;const diff=end-base;
                  const trajectory=[
                    {month:"Sep",score:base},
                    {month:"Oct",score:Math.round(base+diff*0.1)},
                    {month:"Nov",score:Math.round(base+diff*0.22)},
                    {month:"Dec",score:Math.round(base+diff*0.38)},
                    {month:"Jan",score:Math.round(base+diff*0.55)},
                    {month:"Feb",score:Math.round(base+diff*0.75)},
                    {month:"Mar",score:end},
                  ];
                  return (
                    <ResponsiveContainer width="100%" height={210}>
                      <LineChart data={trajectory} margin={{top:5,right:10,left:-15,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
                        <XAxis dataKey="month" tick={{fontSize:10,fill:T.muted}}/>
                        <YAxis domain={[Math.max(50,base-15),Math.min(130,end+15)]} tick={{fontSize:10,fill:T.muted}}/>
                        <Tooltip/>
                        <ReferenceLine y={85} stroke={T.red} strokeDasharray="6 3" label={{value:"Threshold (85)",position:"right",fontSize:9,fill:T.red}}/>
                        <ReferenceLine y={100} stroke={T.green} strokeDasharray="6 3" label={{value:"Age-expected",position:"right",fontSize:9,fill:T.green}}/>
                        <Line type="monotone" dataKey="score" stroke={T.navy} strokeWidth={3} dot={{r:4,fill:T.navy}} activeDot={{r:6}}/>
                      </LineChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
              <div>
                <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:"0 0 12px"}}>Subscale Profile</h3>
                <ResponsiveContainer width="100%" height={210}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={T.border}/>
                    <PolarAngleAxis dataKey="subject" tick={{fontSize:10,fill:T.text,fontWeight:600}}/>
                    <PolarRadiusAxis angle={30} domain={[50,130]} tick={{fontSize:8,fill:T.muted}}/>
                    <Radar name="Score" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2}/>
                    <Tooltip/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{marginTop:16,padding:"16px 20px",background:T.goldLight,borderRadius:10,
              border:`1px solid #FDE68A`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <Brain size={18} color={T.gold}/>
                <span style={{fontWeight:700,fontSize:13,color:T.amber}}>AI Summary — {pupil.name}</span>
              </div>
              <p style={{fontSize:13,color:T.text,margin:0,lineHeight:1.7}}>{pupil.notes}</p>
            </div>

            {/* Placeholder for remaining PupilDetail overview content */}
            {/* SEN & Support Needs, EAL Information, Attendance & Wellbeing, NELI Programme Status, Quick Actions */}
          </div>
        )}

        {tab==="language"&&(<div><p>Language Assessment tab content</p></div>)}
        {tab==="eyfs"&&(<div><p>EYFS Profile tab content</p></div>)}
        {tab==="sen"&&(<div><p>SEN & SEND tab content</p></div>)}
        {tab==="wellbeing"&&(<div><p>Wellbeing tab content</p></div>)}
        {tab==="notes"&&(<div><p>Notes & Next Steps tab content</p></div>)}
      </Card>

      {/* Assessment Modal */}
      {assessOpen&&(
        <div style={{position:"fixed",inset:0,
          background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",
          alignItems:"center",justifyContent:"center",padding:20}}
          onClick={()=>setAssessOpen(false)}>
          <div style={{background:"white",borderRadius:16,padding:"28px 32px",
            width:"100%",maxWidth:560,maxHeight:"90vh",overflow:"auto",position:"relative",zIndex:1001}}
            onClick={(e: React.MouseEvent)=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h2 style={{fontSize:18,fontWeight:800,color:T.text,margin:0,fontFamily:"Georgia,serif"}}>
                Assess {pupil.name.split(" ")[0]}
              </h2>
              <button onClick={()=>setAssessOpen(false)} style={{border:"none",background:"none",cursor:"pointer"}}>
                <X size={20} color={T.muted}/>
              </button>
            </div>
            <p style={{fontSize:13,color:T.muted,margin:"0 0 20px"}}>Select the assessment you want to administer:</p>
            {[
              {name:"LanguageScreen",desc:"10-min oral language screener",badge:"Recommended",bc:T.gold,bb:T.goldLight,live:true},
              {name:"EYFS Profile Update",desc:"Update individual Early Learning Goal judgements",badge:"Statutory",bc:T.green,bb:T.greenBg,live:false},
              {name:"Leuven Wellbeing Scale",desc:"Observe and rate emotional wellbeing and involvement (1–5)",badge:"Pastoral",bc:T.blue,bb:T.blueBg,live:false},
            ].map(a=>(
              <button key={a.name} onClick={()=>{ if(!a.live){ alert('Coming soon'); } }}
                style={{display:"flex",alignItems:"flex-start",gap:14,width:"100%",
                padding:"14px 16px",border:`1px solid ${T.border}`,borderRadius:10,
                background:"white",marginBottom:8,cursor:"pointer",textAlign:"left"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
                    <span style={{fontSize:14,fontWeight:700,color:T.text}}>{a.name}</span>
                    <Badge label={a.badge} color={a.bc} bg={a.bb}/>
                  </div>
                  <p style={{fontSize:12,color:T.muted,margin:0}}>{a.desc}</p>
                </div>
                <ChevronRight size={16} color={T.muted} style={{marginTop:4}}/>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CLASS DETAIL
// ═══════════════════════════════════════════════════════════
export function ClassDetail({cls, onBack, onSelectPupil}: {cls: any, onBack: () => void, onSelectPupil: (p: any) => void}) {
  const pupils = PUPILS.filter(p=>p.class===cls.id);
  const avgI = Math.round(pupils.reduce((s,p)=>s+p.is,0)/pupils.length*10)/10;
  const avgE = Math.round(pupils.reduce((s,p)=>s+p.es,0)/pupils.length*10)/10;
  const senCount = pupils.filter(p=>p.sen.status!=="None").length;
  const gldCount = pupils.filter(p=>elgScore(p).gld).length;

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,
          padding:"6px 14px",border:`1px solid ${T.border}`,borderRadius:8,
          background:"white",fontSize:12,fontWeight:600,color:T.muted,cursor:"pointer"}}>
          <ChevronLeft size={14}/> All Classes
        </button>
        <span style={{color:T.border,fontSize:16}}>›</span>
        <span style={{fontSize:13,color:T.muted}}>{cls.name}</span>
      </div>

      <Card style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:16}}>
          <div style={{width:56,height:56,borderRadius:12,background:T.goldLight,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontWeight:800,fontSize:18,color:T.gold}}>{cls.name.split(" ")[1]}</div>
          <div>
            <h2 style={{fontSize:20,fontWeight:800,color:T.text,margin:"0 0 4px",fontFamily:"Georgia,serif"}}>{cls.name}</h2>
            <p style={{fontSize:13,color:T.muted,margin:0}}>
              Class Teacher: <strong style={{color:T.text}}>{cls.teacher}</strong> ·
              Teaching Assistant: <strong style={{color:T.text}}>{cls.ta}</strong> ·
              {cls.room}
            </p>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
          {[
            {l:"Pupils",v:pupils.length},
            {l:"Avg. Initial Score",v:avgI,c:lc(getLight(avgI))},
            {l:"Avg. Current Score",v:avgE,c:lc(getLight(avgE))},
            {l:"GLD on Track",v:`${gldCount}/${pupils.length}`,c:T.green},
            {l:"SEN / SEND",v:senCount,c:senCount>0?T.amber:T.green},
          ].map(s=>(
            <div key={s.l} style={{background:T.light,borderRadius:8,padding:"12px",textAlign:"center"}}>
              <p style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",
                letterSpacing:"0.04em",margin:"0 0 4px"}}>{s.l}</p>
              <p style={{fontSize:20,fontWeight:800,color:s.c||T.navy,margin:0,fontFamily:"Georgia,serif"}}>{s.v}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:0}}>Pupils in {cls.name}</h3>
          <span style={{fontSize:12,color:T.muted}}>{pupils.length} pupils</span>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{background:T.light}}>
            {["Name","Flags","Initial","Current","Gain","ELG","GLD","Attendance","SEN",""].map(h=>(
              <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,
                color:T.muted,textTransform:"uppercase",letterSpacing:"0.05em",
                borderBottom:`1px solid ${T.border}`}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {pupils.map((p: any,i: number)=>{
              const sc = elgScore(p);
              const gain = p.es-p.is;
              return (
                <tr key={p.id} onClick={()=>onSelectPupil(p)}
                  style={{borderBottom:`1px solid ${T.border}`,cursor:"pointer",
                  background:i%2===0?"white":T.light}}
                  onMouseEnter={(e: React.MouseEvent<HTMLTableRowElement>)=>e.currentTarget.style.background="#F0F7FF"}
                  onMouseLeave={(e: React.MouseEvent<HTMLTableRowElement>)=>e.currentTarget.style.background=i%2===0?"white":T.light}>
                  <td style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <InitialsBadge name={p.name} size={28}/>
                      <span style={{fontWeight:600,color:T.text}}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                      {p.eal&&<Badge label="EAL" color={T.blue} bg={T.blueBg}/>}
                      {p.fsm&&<Badge label="FSM" color={T.purple} bg={T.purpleBg}/>}
                      {p.neli&&<Badge label="NELI" color={T.gold} bg={T.goldLight}/>}
                    </div>
                  </td>
                  <td style={{padding:"12px 14px"}}><TrafficDot score={p.is}/></td>
                  <td style={{padding:"12px 14px"}}><TrafficDot score={p.es}/></td>
                  <td style={{padding:"12px 14px"}}>
                    <span style={{fontWeight:700,color:gain>0?T.green:T.muted}}>+{gain}</span>
                  </td>
                  <td style={{padding:"12px 14px"}}>
                    <span style={{fontSize:13,fontWeight:700,color:sc.gld?T.green:T.amber}}>
                      {sc.expected}/17
                    </span>
                  </td>
                  <td style={{padding:"12px 14px"}}><Badge label={sc.gld?"On Track":"At Risk"} color={sc.gld?T.green:T.amber} bg={sc.gld?T.greenBg:T.amberBg}/></td>
                  <td style={{padding:"12px 14px"}}>
                    <span style={{fontSize:13,fontWeight:700,color:p.attendance>=90?T.green:T.red}}>
                      {p.attendance}%
                    </span>
                  </td>
                  <td style={{padding:"12px 14px"}}>
                    {p.sen.status!=="None"&&p.sen.status!=="EAL Monitoring"&&(
                      <Badge label={p.sen.status} color={T.amber} bg={T.amberBg}/>
                    )}
                  </td>
                  <td style={{padding:"12px 14px"}}>
                    <ChevronRight size={16} color={T.muted}/>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CLASSES PAGE
// ═══════════════════════════════════════════════════════════
export function ClassesPage({onSelectClass, onSelectPupil}: {onSelectClass: (c: any) => void, onSelectPupil: (p: any) => void}) {
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const totalSen = PUPILS.filter(p=>p.sen.status!=="None").length;
  const totalGld = PUPILS.filter(p=>elgScore(p).gld).length;

  return (
    <div>
      <SectionTitle title="Classes" subtitle="Parkside Primary · Reception 2024–25 · 2 classes · 28 pupils"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Total Classes" value="2" sub="Reception A & B" icon={Users}/>
        <StatCard label="Total Pupils" value="28" sub="Across both classes" icon={Users}/>
        <StatCard label="GLD on Track" value={`${totalGld}/28`} sub={`${Math.round(totalGld/28*100)}% of cohort`} icon={Award} color={T.green}/>
        <StatCard label="SEN / SEND" value={totalSen} sub="Pupils with support needs" icon={AlertCircle} color={totalSen>0?T.amber:T.green}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {CLASSES.map(cls=>{
          const pupils = PUPILS.filter(p=>p.class===cls.id);
          const avgI = Math.round(pupils.reduce((s,p)=>s+p.is,0)/pupils.length*10)/10;
          const avgE = Math.round(pupils.reduce((s,p)=>s+p.es,0)/pupils.length*10)/10;
          const gldC = pupils.filter(p=>elgScore(p).gld).length;
          const neliC = pupils.filter(p=>p.neli).length;

          return (
            <div key={cls.id} onClick={()=>onSelectClass(cls)}
              style={{background:T.card,border:`1px solid ${T.border}`,borderTop:`4px solid ${T.navy}`,
                borderRadius:12,padding:"24px",cursor:"pointer",transition:"border-color 0.15s"}}>
              <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16}}>
                <div style={{width:52,height:52,borderRadius:12,background:T.goldLight,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontWeight:900,fontSize:20,color:T.gold}}>{cls.name.split(" ")[1]}</div>
                <div>
                  <h3 style={{fontSize:17,fontWeight:800,color:T.text,margin:"0 0 4px",fontFamily:"Georgia,serif"}}>{cls.name}</h3>
                  <p style={{fontSize:12,color:T.muted,margin:0}}>{cls.teacher} · {cls.ta} · {cls.room}</p>
                </div>
                <ChevronRight size={20} color={T.muted} style={{marginLeft:"auto"}}/>
              </div>
              <div style={{padding:"10px 14px",background:T.goldLight,borderRadius:8,fontSize:12,color:T.amber}}>
                <strong>AI snapshot: </strong>
                {`${pupils.length} pupils · Score gain +${Math.round((avgE-avgI)*10)/10} pts · ${gldC} GLD on track · ${neliC} NELI`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════
export function Dashboard({onSelectPupil}: {onSelectPupil?: (p: any) => void}) {
  const [sortCol, setSortCol] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [tableFilter, setTableFilter] = useState("all");
  const distribData = [
    {range:"<75",   count:PUPILS.filter(p=>p.is<75).length,           fill:"#EF4444"},
    {range:"75–84", count:PUPILS.filter(p=>p.is>=75&&p.is<85).length, fill:"#F97316"},
    {range:"85–89", count:PUPILS.filter(p=>p.is>=85&&p.is<90).length, fill:"#F59E0B"},
    {range:"90–94", count:PUPILS.filter(p=>p.is>=90&&p.is<95).length, fill:"#84CC16"},
    {range:"95–99", count:PUPILS.filter(p=>p.is>=95&&p.is<100).length,fill:"#22C55E"},
    {range:"100+",  count:PUPILS.filter(p=>p.is>=100).length,         fill:"#10B981"},
  ];
  const MONTHS = [{month:"Sep",score:91},{month:"Oct",score:91.8},{month:"Nov",score:92.4},{month:"Dec",score:93.1},{month:"Jan",score:94.2},{month:"Feb",score:95.3},{month:"Mar",score:96.8}];
  const neliCompare = neliPupils.map(p=>({name:p.name.split(" ")[0],initial:p.is,end:p.es}));

  return (
    <div>
      <SectionTitle title="School Dashboard" subtitle="Parkside Primary · Reception 2024–25 · Week 17 of 20"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Pupils Assessed" value="28" sub="100% of cohort" icon={CheckCircle2} color={T.green}/>
        <StatCard label="NELI Pupils" value="5" sub="On programme, week 17" icon={Target} color={T.navy}/>
        <StatCard label="NELI Avg. Gain" value={`+${neliAvgGain}`} sub="Standard score points" icon={TrendingUp} color={T.green}/>
        <StatCard label="Needs Attention" value={redC} sub="Below standard threshold" icon={AlertCircle} color={T.red} alert="red"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <Card style={{borderTop:`3px solid ${T.navy}`}}>
          <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:"0 0 4px"}}><span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:T.navy,marginRight:8}}/>Class Score Distribution</h3>
          <p style={{fontSize:12,color:T.muted,margin:"0 0 12px"}}>Initial LanguageScreen scores</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={distribData} margin={{top:0,right:0,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
              <XAxis dataKey="range" tick={{fontSize:10,fill:T.muted}}/>
              <YAxis tick={{fontSize:10,fill:T.muted}}/>
              <Tooltip/>
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {distribData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{borderTop:`3px solid ${T.gold}`}}>
          <h3 style={{fontSize:14,fontWeight:700,color:T.text,margin:"0 0 4px"}}><span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:T.gold,marginRight:8}}/>NELI Intervention Impact</h3>
          <p style={{fontSize:12,color:T.muted,margin:"0 0 12px"}}>Before & after for 5 NELI pupils</p>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={neliCompare} margin={{top:0,right:10,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
              <XAxis dataKey="name" tick={{fontSize:10,fill:T.muted}}/>
              <YAxis domain={[55,100]} tick={{fontSize:10,fill:T.muted}}/>
              <Tooltip/>
              <Bar dataKey="initial" fill="#FBBF24" radius={[3,3,0,0]} name="Initial"/>
              <Bar dataKey="end" fill={T.green} radius={[3,3,0,0]} name="End"/>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <p style={{fontSize:12,color:T.muted,textAlign:"center"}}>Dashboard component — full charts and pupil table rendered here</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// NELI TRACKER
// ═══════════════════════════════════════════════════════════
export function NELITracker() {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div>
      <SectionTitle title="NELI Intervention Tracker" subtitle="20-week programme · 5 pupils · Week 17 of 20"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Programme Week" value="17 / 20" sub="3 weeks remaining" icon={BookOpen}/>
        <StatCard label="Avg. Sessions/Week" value="4.8" sub="Target: 5" icon={CheckCircle2} color={T.green}/>
        <StatCard label="Avg. Score Gain" value={`+${neliAvgGain}`} sub="Standard score points" icon={TrendingUp} color={T.green}/>
        <StatCard label="Midpoint Review" value="Done" sub="Week 10 complete" icon={Award} color={T.green}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {neliPupils.map(p=>{
          const gain = p.es-p.is; const isOpen = selected===p.id;
          return (
            <Card key={p.id} style={{padding:0,overflow:"hidden"}}>
              <div onClick={()=>setSelected(isOpen?null:p.id)} style={{
                padding:"16px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,
                background:isOpen?T.light:"white",borderBottom:isOpen?`1px solid ${T.border}`:"none"}}>
                <InitialsBadge name={p.name}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:8,marginBottom:4}}>
                    <span style={{fontWeight:700,fontSize:15,color:T.text}}>{p.name}</span>
                    {p.eal&&<Badge label="EAL" color={T.blue} bg={T.blueBg}/>}
                    {p.fsm&&<Badge label="FSM" color={T.purple} bg={T.purpleBg}/>}
                    {p.sen.status!=="None"&&<Badge label={p.sen.status} color={T.red} bg={T.redBg}/>}
                  </div>
                  <div style={{display:"flex",gap:16,fontSize:12,color:T.muted}}>
                    <span>Initial: <strong style={{color:lc(getLight(p.is))}}>{p.is}</strong></span>
                    <span>Current: <strong style={{color:lc(getLight(p.es))}}>{p.es}</strong></span>
                    <span>Gain: <strong style={{color:T.green}}>+{gain} pts</strong></span>
                  </div>
                </div>
                <Badge label={`+${gain} pts`} color={T.green} bg={T.greenBg}/>
                <ChevronRight size={18} color={T.muted} style={{transform:isOpen?"rotate(90deg)":"none",transition:"0.2s"}}/>
              </div>
              {isOpen&&<div style={{padding:"20px 24px"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",gap:5,marginBottom:16}}>
                  {Array.from({length:20},(_,i)=>(
                    <div key={i} style={{borderRadius:6,border:`2px solid ${i===16?T.gold:i<16?T.navy:"transparent"}`,
                      background:i<16?T.navy:i===16?"#FFFDF5":T.border,padding:"6px 4px",textAlign:"center"}}>
                      <div style={{fontSize:8,fontWeight:700,color:i<16?"white":i===16?T.gold:T.muted}}>WK {i+1}</div>
                    </div>
                  ))}
                </div>
              </div>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LANGUAGESCREEN PAGE
// ═══════════════════════════════════════════════════════════
export function LanguageScreenPage({onSelectPupil}: {onSelectPupil: (p: any) => void}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = PUPILS.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p=>filter==="all"||getLight(p.is)===filter||(filter==="neli"&&p.neli))
    .sort((a,b)=>a.is-b.is);

  return (
    <div>
      <SectionTitle title="LanguageScreen Results" subtitle="Reception cohort · Autumn 2024 & Spring 2025 assessment"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Assessed" value="28/28" sub="100% complete" icon={CheckCircle2} color={T.green}/>
        <StatCard label="Class Average" value={classAvgI} sub={`End year: ${classAvgE}`} icon={TrendingUp}/>
        <StatCard label="Needs Support" value={redC} sub="Score below 85" icon={AlertCircle} color={T.red} alert="red"/>
        <StatCard label="NELI Selected" value="5" sub="Lowest 5 scorers" icon={Star} color={T.gold}/>
      </div>
      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,
          display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:1,minWidth:180}}>
            <Search size={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.muted}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search pupils..."
              style={{width:"100%",paddingLeft:32,height:36,border:`1px solid ${T.border}`,
                borderRadius:8,fontSize:13,outline:"none",background:T.light,boxSizing:"border-box"}}/>
          </div>
          {[["all","All"],["red","Needs Support"],["amber","Monitor"],["green","On Track"],["neli","NELI Only"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{padding:"6px 14px",borderRadius:20,
              fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${filter===v?T.navy:T.border}`,
              background:filter===v?T.navy:"transparent",color:filter===v?"white":T.muted}}>
              {l}
            </button>
          ))}
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{background:T.light}}>
            {["Pupil","Flags","Initial","Status","End Score","Gain","ELG","NELI",""].map(h=>(
              <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,
                color:T.muted,textTransform:"uppercase",letterSpacing:"0.05em",
                borderBottom:`1px solid ${T.border}`}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((p: any,i: number)=>{
              const il = getLight(p.is); const gain = p.es-p.is; const sc = elgScore(p);
              return (
                <tr key={p.id} onClick={()=>onSelectPupil(p)}
                  style={{borderBottom:`1px solid ${T.border}`,cursor:"pointer",
                  background:p.neli?"#FFFDF5":i%2===0?"white":T.light}}
                  onMouseEnter={(e: React.MouseEvent<HTMLTableRowElement>)=>e.currentTarget.style.background="#F0F7FF"}
                  onMouseLeave={(e: React.MouseEvent<HTMLTableRowElement>)=>e.currentTarget.style.background=p.neli?"#FFFDF5":i%2===0?"white":T.light}>
                  <td style={{padding:"10px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <InitialsBadge name={p.name} size={28}/>
                      <span style={{fontWeight:600,color:T.text}}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{padding:"10px 14px"}}>
                    <div style={{display:"flex",gap:3}}>
                      {p.eal&&<Badge label="EAL" color={T.blue} bg={T.blueBg}/>}
                      {p.fsm&&<Badge label="FSM" color={T.purple} bg={T.purpleBg}/>}
                    </div>
                  </td>
                  <td style={{padding:"10px 14px"}}><TrafficDot score={p.is}/></td>
                  <td style={{padding:"10px 14px"}}>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,
                      background:lb(il),color:lc(il)}}>{ll(il)}</span>
                  </td>
                  <td style={{padding:"10px 14px"}}><TrafficDot score={p.es}/></td>
                  <td style={{padding:"10px 14px"}}>
                    <span style={{fontWeight:700,color:gain>0?T.green:T.muted}}>+{gain}</span>
                  </td>
                  <td style={{padding:"10px 14px"}}>
                    <span style={{fontWeight:700,color:sc.gld?T.green:T.amber}}>{sc.expected}/17</span>
                  </td>
                  <td style={{padding:"10px 14px"}}>
                    {p.neli&&<Badge label="✓ NELI"/>}
                  </td>
                  <td style={{padding:"10px 14px"}}><ChevronRight size={14} color={T.muted}/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// INSIGHTS
// ═══════════════════════════════════════════════════════════
export function Insights() {
  const [tab, setTab] = useState("overview");
  const [expandedPaper, setExpandedPaper] = useState<number | null>(null);

  return (
    <div>
      <SectionTitle title="Insights" subtitle="Parkside Primary · Reception 2024–25 · Data-driven analysis for school leaders"/>
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,background:"white",borderRadius:"12px 12px 0 0",overflowX:"auto",gap:0,marginBottom:0}}>
        {[
          {id:"overview",label:"Overview",icon:BarChart2},
          {id:"language",label:"Language & Literacy",icon:MessageSquare},
          {id:"sen",label:"SEN & SEND",icon:UserCheck},
          {id:"eal",label:"EAL",icon:Users},
          {id:"attendance",label:"Attendance & Wellbeing",icon:Heart},
          {id:"research",label:"Research Library",icon:BookOpen},
        ].map(t=><Tab key={t.id} label={t.label} icon={t.icon} active={tab===t.id} onClick={()=>setTab(t.id)}/>)}
      </div>
      <Card style={{borderRadius:"0 0 12px 12px",borderTop:"none",minHeight:500}}>
        <p style={{fontSize:13,color:T.muted}}>Insights content for tab: {tab}</p>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TRUST VIEW
// ═══════════════════════════════════════════════════════════
export function TrustView() {
  const sColor = (s: string)=>s==="good"?T.green:s==="warning"?T.amber:T.red;
  const sBg = (s: string)=>s==="good"?T.greenBg:s==="warning"?T.amberBg:T.redBg;
  const sLabel = (s: string)=>s==="good"?"All Good":s==="warning"?"Attention Needed":"Action Required";
  const trustAvg = Math.round(TRUST.filter(t=>t.avgE).reduce((s,t)=>s+(t.avgE!-t.avgI),0)/TRUST.filter(t=>t.avgE).length*10)/10;
  const trustCompare = TRUST.map(s=>({name:s.short,fullName:s.name,initial:s.avgI,end:s.avgE||s.avgI}));

  return (
    <div>
      <SectionTitle title="Trust View" subtitle="Oak Valley Multi-Academy Trust · 4 schools · Spring 2025"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Trust Pupils" value={TRUST.reduce((s,t)=>s+t.pupils,0)} icon={Users}/>
        <StatCard label="NELI Pupils" value={TRUST.reduce((s,t)=>s+t.neli,0)} icon={Target} color={T.navy}/>
        <StatCard label="Trust Avg. Gain" value={`+${trustAvg}`} icon={TrendingUp} color={T.green}/>
        <StatCard label="Schools w/ Alerts" value={TRUST.filter(t=>t.status!=="good").length} icon={AlertCircle} color={T.red} alert="red"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,marginBottom:16}}>
        {TRUST.map(school=>(
          <div key={school.id} style={{background:T.card,border:`1px solid ${T.border}`,
            borderTop:`4px solid ${sColor(school.status)}`,borderRadius:12,padding:"20px 24px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{width:44,height:44,borderRadius:12,background:T.goldLight,display:"flex",
                  alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:T.gold,marginBottom:8}}>
                  {school.short}
                </div>
                <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:"0 0 6px"}}>{school.name}</h3>
                <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,
                  background:sBg(school.status),color:sColor(school.status)}}>{sLabel(school.status)}</span>
              </div>
              <div style={{textAlign:"right"}}>
                <p style={{fontSize:11,color:T.muted,margin:"0 0 2px"}}>Avg. Score</p>
                <p style={{fontSize:24,fontWeight:800,color:T.navy,margin:"0 0 6px",fontFamily:"Georgia,serif"}}>{school.avgI}</p>
                {school.avgE&&<p style={{fontSize:14,fontWeight:700,color:T.green,margin:0}}>→ {school.avgE} (+{Math.round((school.avgE-school.avgI)*10)/10})</p>}
                {!school.avgE&&<p style={{fontSize:12,color:T.amber,fontWeight:600,margin:0}}>End data pending</p>}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
              {[["Pupils",school.pupils],["NELI",school.neli],["Assessed",`${school.assessed}%`]].map(([l,v])=>(
                <div key={l as string} style={{background:T.light,borderRadius:8,padding:"8px",textAlign:"center"}}>
                  <p style={{fontSize:10,color:T.muted,margin:"0 0 2px",fontWeight:600,textTransform:"uppercase"}}>{l}</p>
                  <p style={{fontSize:16,fontWeight:800,color:T.navy,margin:0,fontFamily:"Georgia,serif"}}>{v}</p>
                </div>
              ))}
            </div>
            <div style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:11,color:T.muted}}>Programme progress</span>
                <span style={{fontSize:11,fontWeight:700,color:T.navy}}>Week {school.weeks}/20</span>
              </div>
              <div style={{background:T.border,borderRadius:20,height:6,overflow:"hidden"}}>
                <div style={{width:`${school.weeks/20*100}%`,height:"100%",
                  background:school.status==="alert"?T.red:T.navy,borderRadius:20}}/>
              </div>
            </div>
            {school.status!=="good"&&(
              <div style={{padding:"8px 12px",background:sBg(school.status),borderRadius:8,
                fontSize:12,color:sColor(school.status),fontWeight:600,
                display:"flex",alignItems:"center",gap:6}}>
                <AlertCircle size={13}/>
                {school.status==="warning"?"End-year assessment incomplete for some pupils"
                  :"Programme significantly behind schedule — needs immediate support"}
              </div>
            )}
          </div>
        ))}
      </div>
      <Card>
        <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:"0 0 16px",fontFamily:"Georgia,serif"}}>School Comparison</h3>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={trustCompare} margin={{top:0,right:10,left:-15,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5"/>
            <XAxis dataKey="fullName" tick={{fontSize:11,fill:T.muted}}/>
            <YAxis domain={[82,100]} tick={{fontSize:11,fill:T.muted}}/>
            <Tooltip/>
            <Bar dataKey="initial" fill="#DBEAFE" radius={[3,3,0,0]} name="Initial"/>
            <Bar dataKey="end" fill={T.navy} radius={[3,3,0,0]} name="End"/>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TRAINING
// ═══════════════════════════════════════════════════════════
export function Training({onStartTraining}: {onStartTraining: () => void}) {
  return (
    <div>
      <SectionTitle title="Training Hub" subtitle="CPD-certified NELI courses · FutureLearn platform"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Fully Trained" value="2 / 4" sub="All 3 courses complete" icon={Award} color={T.green}/>
        <StatCard label="In Progress" value="2" sub="Course 3 outstanding" icon={BookOpen} color={T.amber}/>
        <StatCard label="CPD Hours" value="48" sub="Across all staff" icon={Star} color={T.gold}/>
      </div>
      <Card style={{padding:0,overflow:"hidden",marginBottom:16}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{background:T.light}}>
            {["Staff","Role","Course 1","Course 2","Course 3","Status",""].map(h=>(
              <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,
                color:T.muted,textTransform:"uppercase",letterSpacing:"0.05em",
                borderBottom:`1px solid ${T.border}`}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {STAFF.map((s,i)=>{
              const done=s.c1&&s.c2&&s.c3;
              return <tr key={s.name} style={{borderBottom:`1px solid ${T.border}`,background:i%2===0?"white":T.light}}>
                <td style={{padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <InitialsBadge name={s.name} size={30}/>
                    <span style={{fontWeight:600,color:T.text}}>{s.name}</span>
                  </div>
                </td>
                <td style={{padding:"12px 14px",color:T.muted}}>{s.role}</td>
                {[s.c1,s.c2,s.c3].map((c,ci)=>(
                  <td key={ci} style={{padding:"12px 14px"}}>
                    {c?<span style={{display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600,color:T.green}}>
                      <CheckCircle2 size={14}/> Done</span>
                      :<span style={{fontSize:12,color:T.muted}}>Not started</span>}
                  </td>
                ))}
                <td style={{padding:"12px 14px"}}>
                  <span style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700,
                    background:done?T.greenBg:T.amberBg,color:done?T.green:T.amber}}>
                    {done?"Fully Trained":"In Progress"}
                  </span>
                </td>
                <td style={{padding:"12px 14px"}}>
                  <button onClick={onStartTraining}
                    style={{display:"inline-flex",alignItems:"center",gap:5,padding:"6px 12px",
                    borderRadius:8,border:"none",background:done?T.light:T.navy,
                    color:done?T.muted:"white",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    <PlayCircle size={13}/>
                    {done?"Revisit Courses":"Start Training"}
                  </button>
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TRAINING COURSES (FutureLearn)
// ═══════════════════════════════════════════════════════════
export function TrainingCourses({onBack, staffName}: {onBack: () => void, staffName?: string}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");

  const filtered = FL_COURSES.filter(c =>
    filter==="all" || filter==="in-progress"&&c.status==="in-progress"
    || filter==="not-started"&&c.status==="not-started"
    || filter==="enrolled"&&c.status==="enrolled"
    || filter==="required"&&c.required
  );

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,
          padding:"6px 14px",border:`1px solid ${T.border}`,borderRadius:8,
          background:"white",fontSize:12,fontWeight:600,color:T.muted,cursor:"pointer"}}>
          <ChevronLeft size={14}/> Back to Training
        </button>
      </div>

      <div style={{background:"linear-gradient(135deg,#2D0557 0%,#D4007A 100%)",borderRadius:14,
        padding:"24px 28px",marginBottom:20}}>
        <h2 style={{fontSize:20,fontWeight:800,color:"white",margin:"0 0 6px",fontFamily:"Georgia,serif"}}>
          Your NELI Training — {staffName||"Sarah Mitchell"}
        </h2>
        <p style={{fontSize:13,color:"rgba(255,255,255,0.8)",margin:0}}>
          CPD-certified · Self-paced · Expert-mentored · All hosted on FutureLearn
        </p>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {[["all","All Courses"],["in-progress","In Progress"],["not-started","Not Started"],["required","Required Only"],["enrolled","Enrolled"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{padding:"7px 16px",borderRadius:20,
            fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${filter===v?"#D4007A":T.border}`,
            background:filter===v?"#D4007A":"white",color:filter===v?"white":T.muted}}>
            {l}
          </button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:20}}>
        {filtered.map(c=>{
          const ss = statusStyles[c.status];
          return (
            <div key={c.id} style={{background:"white",border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
              <div style={{height:140,background:c.imgBg,position:"relative",
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontSize:64,opacity:0.25}}>{c.imgEmoji}</div>
              </div>
              <div style={{padding:"16px 18px"}}>
                <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                  <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,
                    background:ss?.bg,color:ss?.color}}>{ss?.label}</span>
                </div>
                <h3 style={{fontSize:14,fontWeight:800,color:T.text,margin:"0 0 8px",lineHeight:1.4}}>{c.title}</h3>
                <p style={{fontSize:12,color:T.muted,margin:"0 0 12px",lineHeight:1.5}}>{c.desc}</p>
                <a href={c.url} target="_blank" rel="noreferrer" style={{display:"flex",
                  alignItems:"center",justifyContent:"center",gap:6,padding:"10px",borderRadius:8,
                  background:"#D4007A",color:"white",fontSize:13,fontWeight:700,textDecoration:"none"}}>
                  <PlayCircle size={15}/>
                  {c.status==="in-progress"?"Continue Course":"Start Course"}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TEL TED TRAINING
// ═══════════════════════════════════════════════════════════
export function TELTedTraining({onBack}: {onBack: () => void}) {
  const [course, setCourse] = useState<any>(()=>{
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem("neli-telted")||"null"); } catch { return null; }
  });
  const init = ()=>({currentWeek:1,currentStep:1,completed:[] as string[],quizScores:{} as any,quizAnswers:{} as any,discussions:{} as any,certificateEarned:false});
  if (!course) { const c=init(); setCourse(c); if (typeof window !== 'undefined') localStorage.setItem("neli-telted",JSON.stringify(c)); }
  const save=(upd: any)=>{const n={...course,...upd};setCourse(n);if (typeof window !== 'undefined') localStorage.setItem("neli-telted",JSON.stringify(n));};
  const isComplete=(w: number,s: number)=>course?.completed?.includes(`${w}-${s}`);
  const markComplete=()=>{
    const key=`${course.currentWeek}-${course.currentStep}`;
    if(course.completed.includes(key)) return;
    const completed=[...course.completed,key];
    const ws=STEPS[course.currentWeek-1];
    let nw=course.currentWeek,ns=course.currentStep;
    if(ns<ws.length){ns++;}else if(nw<3){nw++;ns=1;}
    save({completed,currentWeek:nw,currentStep:ns});
  };
  const totalSteps=STEPS.reduce((s: number,w: any[])=>s+w.length,0);
  const pctComplete=course?Math.round(course.completed.length/totalSteps*100):0;

  if(!course) return null;

  return(
    <div style={{padding:24}}>
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",border:`1px solid ${T.border}`,borderRadius:8,background:"white",fontSize:11,fontWeight:600,color:T.muted,cursor:"pointer",marginBottom:10}}>
        <ChevronLeft size={13}/> Back to Training
      </button>
      <h3 style={{fontSize:14,fontWeight:800,color:T.navy,margin:"0 0 4px",fontFamily:"Georgia,serif"}}>NELI Language Fundamentals</h3>
      <p style={{fontSize:11,color:T.muted,margin:"0 0 16px"}}>Course 1 of 3 · CPD Certified · {pctComplete}% complete</p>
      <div style={{background:T.border,borderRadius:20,height:6,overflow:"hidden",marginBottom:20}}>
        <div style={{width:`${pctComplete}%`,height:"100%",background:T.gold,borderRadius:20,transition:"width 0.3s"}}/>
      </div>
      <p style={{fontSize:12,color:T.muted}}>TEL Ted Training interactive course content renders here.</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// RESOURCES
// ═══════════════════════════════════════════════════════════
export function Resources() {
  const [pdfViewer, setPdfViewer] = useState<any>(null);
  const [pdfError, setPdfError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(()=>{
    if (!pdfViewer) return;
    const printStyle = document.createElement("style");
    printStyle.id = "neli-no-print";
    printStyle.textContent = "@media print { body { display: none !important; } }";
    document.head.appendChild(printStyle);

    const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(null), 3000); };
    const onKey = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "s") { e.preventDefault(); showToast("Saving is disabled for protected documents."); }
      if (ctrl && e.key === "p") { e.preventDefault(); showToast("Printing is disabled for protected documents."); }
      if ((ctrl && e.shiftKey && e.key === "I") || e.key === "F12") { e.preventDefault(); }
      if (e.key === "PrintScreen") { e.preventDefault(); }
    };
    const onCtx = (e: Event) => e.preventDefault();
    window.addEventListener("keydown", onKey);
    window.addEventListener("contextmenu", onCtx);
    return () => {
      document.getElementById("neli-no-print")?.remove();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("contextmenu", onCtx);
    };
  }, [pdfViewer]);

  const groups = [
    {label:"Record Sheets",color:T.navy,items:[
      {name:"Record Sheet: Assessment for Narrative Speech and Grammar",url:"/neli-resources/NELI_Narrative_Record_Sheet.pdf"},
      {name:"Record Sheet: Attitude and Behaviour",url:"/neli-resources/NELI_Attitude_Behaviour.pdf"},
      {name:"Record Sheet: Group Sessions - Part 1 and Part 2",url:"/neli-resources/NELI_Group_Session_Record_Sheets.pdf"},
      {name:"Record Sheet: Individual Sessions - Part 1 and Part 2",url:"/neli-resources/NELI_Individual_Session_Record_Sheets.pdf"},
    ]},
    {label:"Classroom Resources",color:T.gold,items:[
      {name:"Best Listener Badges",url:"/neli-resources/NELI_Best_Listener_Badges.pdf"},
      {name:"Ted's Listening Rules",url:"/neli-resources/NELI_Teds_Listening_Rules.pdf"},
      {name:"Visual Timetable of Session Elements",url:"/neli-resources/NELI_Visual_Timetable.pdf"},
    ]},
    {label:"Programme Planning",color:T.green,items:[
      {name:"NELI Timetable",url:"/neli-resources/NELI_Timetable.pdf"},
      {name:"Involving Parents and Carers in NELI",url:"/neli-resources/NELI_Involving_Parents.pdf"},
    ]},
    {label:"Certificates & Progress",color:T.purple,items:[
      {name:"NELI Certificate of Achievement",url:"/neli-resources/NELI_Certificate.pdf"},
    ]},
  ];

  const links = [
    {title:"OxEd Research Hub",url:"https://oxedandassessment.com/research/overview/",desc:"Full research overview",icon:BookOpen,color:T.navy},
    {title:"NELI Support FAQ",url:"https://support.oxedandassessment.com/neli-intervention-and-neli-training-faq-whole-class-neli-preschool",desc:"Full FAQ",icon:MessageSquare,color:T.gold},
    {title:"NELI on the EEF",url:"https://educationendowmentfoundation.org.uk/projects-and-evaluation/projects/nuffield-early-language-intervention-scale-up-impact-evaluation",desc:"EEF evaluation",icon:Award,color:T.green},
  ];

  const totalItems = groups.reduce((s,g)=>s+g.items.length,0);

  return (
    <div>
      <SectionTitle title="NELI Resources" subtitle="Official downloadable resources from OxEd & Assessment"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Resource Categories" value={groups.length} sub="Record sheets, classroom, planning, certificates" icon={FolderOpen}/>
        <StatCard label="Total Resources" value={totalItems} sub="All official NELI materials" icon={FileText} color={T.navy}/>
        <StatCard label="Useful Links" value={links.length} sub="OxEd, EEF, FutureLearn" icon={ExternalLink} color={T.blue}/>
        <StatCard label="Programme" value="DfE Funded" sub="2024\u20132029" icon={CheckCircle2} color={T.green}/>
      </div>

      {groups.map(group=>(
        <div key={group.label} style={{marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <div style={{width:4,height:20,borderRadius:2,background:group.color}}/>
            <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:0,fontFamily:"Georgia,serif"}}>{group.label}</h3>
            <span style={{fontSize:12,color:T.muted}}>{group.items.length} resources</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {group.items.map(item=>(
              <div key={item.name} onClick={()=>{setPdfError(false);setPdfViewer({name:item.name,url:item.url});}}
                style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",
                  background:T.card,border:`1px solid ${T.border}`,borderLeft:`4px solid ${group.color}`,
                  borderRadius:10,cursor:"pointer"}}>
                <div style={{fontSize:22,flexShrink:0}}>📄</div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:600,color:T.navy,margin:0,lineHeight:1.4}}>{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {pdfViewer&&(
        <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setPdfViewer(null)}>
          <div style={{width:"90vw",height:"90vh",background:"white",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column"}} onClick={(e: React.MouseEvent)=>e.stopPropagation()}>
            <div style={{background:T.navy,padding:"12px 20px",display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
              <p style={{fontSize:14,fontWeight:700,color:"white",margin:0,flex:1}}>{pdfViewer.name}</p>
              <button onClick={()=>setPdfViewer(null)} style={{width:32,height:32,borderRadius:8,border:"none",background:"rgba(255,255,255,0.1)",color:"white",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <X size={18}/>
              </button>
            </div>
            <div style={{flex:1,position:"relative",overflow:"hidden"}}>
              {pdfError?(
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:40,textAlign:"center"}}>
                  <h3 style={{fontSize:18,fontWeight:700,color:T.navy}}>This file hasn't been uploaded yet</h3>
                </div>
              ):(
                <iframe
                  src={`${pdfViewer.url}#toolbar=0&navpanes=0&scrollbar=1`}
                  sandbox="allow-scripts allow-same-origin"
                  style={{width:"100%",height:"100%",border:"none"}}
                  title={pdfViewer.name}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {toast&&(
        <div style={{position:"fixed",bottom:24,right:24,zIndex:10000,background:T.navy,color:"white",padding:"12px 20px",borderRadius:10,fontSize:13,fontWeight:600}}>
          <AlertCircle size={16} color={T.gold} style={{verticalAlign:"middle",marginRight:8}}/>
          {toast}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP (NELIPortal)
// ═══════════════════════════════════════════════════════════
export default function NELIPortal() {
  const [page, setPage] = useState("dashboard");
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedPupil, setSelectedPupil] = useState<any>(null);
  const [showWelcome, setShowWelcome] = useState(()=>{
    if (typeof sessionStorage === 'undefined') return false;
    return !sessionStorage.getItem("neli-welcomed");
  });

  useEffect(()=>{
    if (showWelcome) {
      const t = setTimeout(()=>{ setShowWelcome(false); sessionStorage.setItem("neli-welcomed","1"); }, 6000);
      return ()=>clearTimeout(t);
    }
  }, [showWelcome]);

  const handleNav = (id: string) => {
    setPage(id); setSelectedClass(null); setSelectedPupil(null); setNotifOpen(false);
  };

  const handleSelectPupil = (p: any) => { setSelectedPupil(p); setPage("pupil"); };
  const handleSelectClass = (c: any) => { setSelectedClass(c); setPage("classdetail"); };

  const NAV_ICONS: Record<string, any> = {
    dashboard: LayoutDashboard, languagescreen: Search, intervention: ClipboardList,
    classes: Users, insights: FileText, trust: Building2, training: GraduationCap,
    telted: BookOpen, resources: FolderOpen,
  };

  const renderPage = () => {
    if(page==="pupil"&&selectedPupil) return <PupilDetail pupil={selectedPupil} onBack={()=>{setPage(selectedClass?"classdetail":"languagescreen");setSelectedPupil(null);}}/>;
    if(page==="classdetail"&&selectedClass) return <ClassDetail cls={selectedClass} onBack={()=>{setPage("classes");setSelectedClass(null);}} onSelectPupil={handleSelectPupil}/>;
    if(page==="classes") return <ClassesPage onSelectClass={handleSelectClass} onSelectPupil={handleSelectPupil}/>;
    if(page==="languagescreen") return <LanguageScreenPage onSelectPupil={handleSelectPupil}/>;
    if(page==="trainingcourses") return <TrainingCourses onBack={()=>setPage("training")} staffName="Sarah Mitchell"/>;
    const pages: Record<string, React.ReactNode> = {
      dashboard:<Dashboard onSelectPupil={handleSelectPupil}/>, intervention:<NELITracker/>,
      insights:<Insights/>, trust:<TrustView/>,
      training:<Training onStartTraining={()=>setPage("trainingcourses")}/>,
      resources:<Resources/>,
      telted:<TELTedTraining onBack={()=>setPage("training")}/>,
    };
    return pages[page]||<Dashboard/>;
  };

  const lc2 = (l: string) => l==="red"?T.red:l==="amber"?T.amber:T.green;

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"system-ui,sans-serif",
      background:T.bg,overflow:"hidden"}}>

      {/* Welcome Overlay */}
      {showWelcome&&(
        <div style={{position:"fixed",inset:0,zIndex:9999,background:"linear-gradient(135deg, #0C1A2E 0%, #1B3060 50%, #0C1A2E 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif"}}>
          <div className="neli-fadeIn" style={{animationDelay:"0.3s",textAlign:"center"}}>
            <h1 style={{fontSize:28,fontWeight:800,color:"white",margin:"0 0 12px",fontFamily:"Georgia,serif"}}>Welcome back, Sarah!</h1>
            <p style={{fontSize:15,color:"#8BA4C7",margin:"0 0 24px",lineHeight:1.6}}>You have <strong style={{color:"#C8960C"}}>{PUPILS.filter(p=>p.attendance<90||p.es<85).length} pupils</strong> who need attention today.</p>
            <button onClick={()=>{setShowWelcome(false);sessionStorage.setItem("neli-welcomed","1");}} style={{
              display:"inline-flex",alignItems:"center",gap:8,padding:"12px 28px",borderRadius:12,border:"none",
              background:`linear-gradient(135deg, ${T.gold}, #D4A020)`,color:"white",fontSize:15,fontWeight:700,
              cursor:"pointer",boxShadow:"0 8px 24px rgba(200,150,12,0.4)",
            }}>
              Go to Dashboard →
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div style={{width:220,background:`linear-gradient(180deg, ${T.sidebar} 0%, #0A1628 100%)`,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"14px 16px",borderBottom:"1px solid #1E2E45",background:"#0A1628"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            <img src="/NELI_logo.png" alt="NELI Logo"
              style={{width:"100%",maxWidth:172,height:"auto",objectFit:"contain",display:"block"}}
              onError={(e: React.SyntheticEvent<HTMLImageElement>)=>{(e.target as HTMLImageElement).style.display="none";}}
            />
            <p style={{fontSize:10,color:T.sidebarText,margin:0,letterSpacing:"0.04em"}}>School Portal</p>
          </div>
        </div>
        <div style={{padding:"12px 16px",borderBottom:"1px solid #1E2E45"}}>
          <p style={{fontSize:10,fontWeight:700,color:T.sidebarText,textTransform:"uppercase",
            letterSpacing:"0.06em",margin:"0 0 4px"}}>Current School</p>
          <p style={{fontSize:13,fontWeight:700,color:"white",margin:"0 0 2px"}}>Parkside Primary</p>
          <p style={{fontSize:11,color:T.sidebarText,margin:0}}>Oak Valley MAT · Reception</p>
        </div>
        <nav style={{flex:1,padding:"10px",overflowY:"auto"}}>
          {NAV.map(({id,label})=>{
            const Icon = NAV_ICONS[id] || LayoutDashboard;
            return (
            <button key={id} onClick={()=>handleNav(id)} style={{
              display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 12px",
              borderRadius:8,border:"none",cursor:"pointer",textAlign:"left",marginBottom:2,
              background:(page===id||page==="classdetail"&&id==="classes"||page==="pupil"&&id==="languagescreen"||page==="trainingcourses"&&id==="training")?"#1E3561":"transparent",
              color:(page===id||page==="classdetail"&&id==="classes"||page==="pupil"&&id==="languagescreen"||page==="trainingcourses"&&id==="training")?T.gold:T.sidebarText,
              borderLeft:(page===id||page==="classdetail"&&id==="classes"||page==="pupil"&&id==="languagescreen"||page==="trainingcourses"&&id==="training")?`4px solid ${T.gold}`:"4px solid transparent",
            }}>
              <Icon size={16} style={{flexShrink:0}}/>
              <span style={{fontSize:13,fontWeight:(page===id)?"700":"500"}}>{label}</span>
              {id==="trust"&&<span style={{marginLeft:"auto",fontSize:10,fontWeight:700,
                background:"#B91C1C",color:"white",borderRadius:10,padding:"1px 6px"}}>2</span>}
            </button>
            );
          })}
        </nav>
        <div style={{padding:"12px 10px"}}>
          {[{Icon:Settings,label:"Settings"},{Icon:LogOut,label:"Sign Out"}].map(({Icon,label})=>(
            <button key={label} style={{display:"flex",alignItems:"center",gap:10,width:"100%",
              padding:"8px 12px",borderRadius:8,border:"none",background:"transparent",
              cursor:"pointer",color:T.sidebarText,marginBottom:2}}>
              <Icon size={15}/><span style={{fontSize:12}}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{height:56,background:"linear-gradient(180deg, white 0%, #FAFAF8 100%)",borderBottom:`1px solid ${T.border}`,
          display:"flex",alignItems:"center",padding:"0 24px",gap:16,flexShrink:0}}>
          <div style={{flex:1}}>
            <h1 style={{fontSize:15,fontWeight:700,color:T.text,margin:0}}>
              {page==="pupil"&&selectedPupil?selectedPupil.name
               :page==="classdetail"&&selectedClass?selectedClass.name
               :page==="trainingcourses"?"FutureLearn Courses"
               :NAV.find(n=>n.id===page)?.label||"Dashboard"}
            </h1>
          </div>
          <div className="neli-pulseGlow" style={{fontSize:12,color:T.green,fontWeight:700,background:T.greenBg,
            padding:"4px 12px",borderRadius:20}}>● DfE Funded 2024–2029</div>
          <div style={{position:"relative"}}>
            <button onClick={()=>setNotifOpen(!notifOpen)} style={{width:36,height:36,borderRadius:8,
              border:`1px solid ${T.border}`,background:"white",display:"flex",alignItems:"center",
              justifyContent:"center",cursor:"pointer",position:"relative"}}>
              <Bell size={16} color={T.muted} className="neli-bellBounce"/>
              <span style={{position:"absolute",top:6,right:6,width:8,height:8,
                borderRadius:"50%",background:T.red,border:"2px solid white"}}/>
            </button>
            {notifOpen&&(
              <div style={{position:"absolute",top:42,right:0,width:300,background:"white",
                border:`1px solid ${T.border}`,borderRadius:12,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",
                zIndex:100,overflow:"hidden"}}>
                <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,
                  display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:13,fontWeight:700,color:T.text}}>Alerts</span>
                  <span style={{fontSize:11,color:T.muted}}>{ALERTS.length} active</span>
                </div>
                {ALERTS.map((a,i)=>(
                  <div key={i} style={{padding:"10px 14px",borderBottom:`1px solid ${T.border}`,
                    display:"flex",gap:8,alignItems:"flex-start"}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:lc2(a.type),
                      marginTop:4,flexShrink:0}}/>
                    <span style={{fontSize:12,color:T.text,lineHeight:1.5}}>{a.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <InitialsBadge name="Sarah Mitchell" size={32}/>
            <div>
              <p style={{fontSize:12,fontWeight:700,color:T.text,margin:0}}>Sarah Mitchell</p>
              <p style={{fontSize:10,color:T.muted,margin:0}}>NELI Lead</p>
            </div>
          </div>
        </div>
        <div style={{flex:1,overflow:"auto",padding:"24px"}}><div key={page} className="neli-fadeIn">{renderPage()}</div></div>
      </div>
    </div>
  );
}
