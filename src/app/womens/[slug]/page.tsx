'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import SportsDemoGate, { type SportsDemoSession } from '@/components/sports-demo/SportsDemoGate'
import RoleSwitcher from '@/components/sports-demo/RoleSwitcher'
import {
  ArrowRight, Check, Shield, Users, Heart, TrendingUp, Scale, BarChart2,
  Target, Zap, Calendar, FileText, DollarSign, Award,
  Home, Sunrise, BarChart3, Activity, Flower2, Baby, Brain,
  RefreshCw, CircleDot, ArrowLeftRight, TrendingDown, Telescope,
  GraduationCap, Bot, Handshake, Construction, Landmark,
  Smartphone, Share2, HeartHandshake, ClipboardList, Radio, Flame,
  Cross, Settings, type LucideIcon,
} from 'lucide-react'

// ─── SIDEBAR ICON MAP — Lucide icons keyed by nav item id ─────────────────────
const NAV_ICON_MAP: Record<string, LucideIcon> = {
  dashboard: Home, briefing: Sunrise, insights: BarChart3,
  fsr: BarChart2, salary: DollarSign, revenue: TrendingUp,
  welfare: Heart, acl: Activity, cycle: Flower2, maternity: Baby, mental: Brain,
  squad: Users, dualreg: RefreshCw, tactics: Target, match: CircleDot,
  transfers: ArrowLeftRight, analytics: TrendingDown, scouting: Telescope,
  academy: GraduationCap, halftime: Bot,
  sponsorship: Handshake, standalone: Construction, board: Landmark,
  financial: DollarSign, media: Smartphone, social: Share2, fanhub: HeartHandshake,
  team: ClipboardList, 'gps-load': Radio, 'gps-heatmaps': Flame,
  medical: Cross, preseason: Calendar, settings: Settings,
  'player-welfare': Heart, 'club-operations': Landmark,
}
import { generateSmartBriefing, getUserTimezone } from '@/lib/sports/smartBriefing'
import MediaContentModule from '@/components/sports/media-content/MediaContentModule'
import PlayerWelfareHub from '@/components/football/PlayerWelfareHub'
import { GPSHeatmapsView, type HMPlayer } from '@/components/sports/GPSHeatmapsBlocks'
// ─── Women's FC v2 dashboard imports ──────────────────────────────────────
import { THEMES, DENSITY, FONT as V2_FONT, getGreeting as v2GetGreeting } from '@/app/cricket/[slug]/v2/_lib/theme'
import {
  CommandPalette as V2CommandPalette,
  AskLumio as V2AskLumio,
  FixtureDrawer as V2FixtureDrawer,
  Toast as V2Toast,
  useToast as useV2Toast,
  useKey as useV2Key,
} from '@/app/cricket/[slug]/v2/_components/Overlays'
import { Icon as V2Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import {
  HeroToday as WfHeroToday,
  TodaySchedule as WfTodaySchedule,
  StatTiles as WfStatTiles,
  AIBrief as WfAIBrief,
  Squad as WfSquadModule,
  Fixtures as WfFixturesModule,
  Perf as WfPerf,
  Recents as WfRecents,
  Season as WfSeason,
} from './_components/WomensDashboardModules'
import { WOMENS_INBOX, WOMENS_ACCENT } from './_lib/womens-dashboard-data'
import type { WfFixture } from './_lib/womens-dashboard-data'

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface WomensClub {
  name: string
  slug: string
  league: 'WSL' | 'WSL2' | 'National League'
  tier: 'pro' | 'championship' | 'grassroots'
  accent: string
  stadium: string
  capacity: number
  manager: string
  director: string
  fsrHeadroom: number | null
  salarySpend: number | null
  relevantRevenue: number
  kitSponsor: string | null
  founded: number
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',           icon: '🏠', group: 'OVERVIEW' },
  { id: 'briefing',     label: 'Morning Briefing',    icon: '🌅', group: 'OVERVIEW' },
  { id: 'insights',     label: 'Insights',            icon: '📊', group: 'OVERVIEW' },
  { id: 'fsr',          label: 'FSR Dashboard',       icon: '📊', group: 'COMPLIANCE' },
  { id: 'salary',       label: 'Salary Compliance',   icon: '💰', group: 'COMPLIANCE' },
  { id: 'revenue',      label: 'Revenue Attribution', icon: '📈', group: 'COMPLIANCE' },
  { id: 'welfare',      label: 'Player Welfare',      icon: '❤️', group: 'WELFARE' },
  { id: 'acl',          label: 'ACL Risk Monitor',    icon: '🦵', group: 'WELFARE' },
  { id: 'cycle',        label: 'Cycle Tracking',      icon: '🌸', group: 'WELFARE' },
  { id: 'maternity',    label: 'Maternity Tracker',   icon: '👶', group: 'WELFARE' },
  { id: 'mental',       label: 'Mental Health',       icon: '🧠', group: 'WELFARE' },
  { id: 'player-welfare', label: 'Player Welfare Hub', icon: '🌍', group: 'WELFARE' },
  { id: 'club-operations', label: 'Club Operations',   icon: '🏟️', group: 'OPERATIONS' },
  { id: 'squad',        label: 'Squad Management',    icon: '👥', group: 'FOOTBALL' },
  { id: 'dualreg',      label: 'Dual Registration',   icon: '🔄', group: 'FOOTBALL' },
  { id: 'tactics',      label: 'Tactics & Set Pieces', icon: '🎯', group: 'FOOTBALL' },
  { id: 'match',        label: 'Match Preparation',   icon: '⚽', group: 'FOOTBALL' },
  { id: 'transfers',   label: 'Transfers',           icon: '🔁', group: 'FOOTBALL' },
  { id: 'analytics',   label: 'Analytics',           icon: '📉', group: 'FOOTBALL' },
  { id: 'scouting',    label: 'Scouting',            icon: '🔭', group: 'FOOTBALL' },
  { id: 'academy',     label: 'Academy',             icon: '🎓', group: 'FOOTBALL' },
  { id: 'halftime',    label: 'AI Halftime Brief',   icon: '🤖', group: 'FOOTBALL' },
  { id: 'sponsorship',  label: 'Sponsorship Pipeline',icon: '🤝', group: 'COMMERCIAL' },
  { id: 'standalone',   label: 'Standalone Tracker',  icon: '🏗️', group: 'COMMERCIAL' },
  { id: 'club-vision',  label: 'Club Vision',         icon: '🗺️', group: 'COMMERCIAL' },
  { id: 'board',        label: 'Board Suite',         icon: '🏛️', group: 'COMMERCIAL' },
  { id: 'financial',    label: 'Financial Planning',  icon: '💷', group: 'COMMERCIAL' },
  { id: 'media',        label: 'Media & Content',     icon: '📱', group: 'COMMERCIAL' },
  { id: 'social',       label: 'Social Media',        icon: '📱', group: 'COMMERCIAL' },
  { id: 'fanhub',       label: 'Fan Hub',             icon: '💜', group: 'COMMERCIAL' },
  { id: 'team',         label: 'Staff Directory',     icon: '📋', group: 'OPERATIONS' },
  { id: 'gps-load',     label: 'GPS & Load',          icon: '📡', group: 'GPS & LOAD' },
  { id: 'gps-heatmaps', label: 'Heatmaps',            icon: '🔥', group: 'GPS & LOAD' },
  { id: 'medical',      label: 'Medical Records',     icon: '🏥', group: 'OPERATIONS' },
  { id: 'preseason',    label: 'Pre-Season',           icon: '⚽', group: 'OPERATIONS' },
  { id: 'settings',     label: 'Settings',            icon: '⚙️', group: 'OPERATIONS' },
]

// ─── DEMO CLUBS ───────────────────────────────────────────────────────────────
const DEMO_CLUBS: Record<string, WomensClub> = {
  'oakridge-women': {
    name: 'Oakridge Women FC', slug: 'oakridge-women', league: 'WSL',
    tier: 'pro', accent: '#EC4899', stadium: 'Oakridge Stadium', capacity: 6500,
    manager: 'Sarah Frost', director: 'Kate Brennan',
    fsrHeadroom: 180000, salarySpend: 74, relevantRevenue: 2800000,
    kitSponsor: 'Kestrel Finance', founded: 1989,
  },
  'harfield-women': {
    name: 'Harfield FC Women', slug: 'harfield-women', league: 'WSL2',
    tier: 'championship', accent: '#F59E0B', stadium: 'Harfield Community Ground', capacity: 1800,
    manager: 'Claire Dobson', director: 'Rachel Parr',
    fsrHeadroom: 42000, salarySpend: 68, relevantRevenue: 680000,
    kitSponsor: null, founded: 2003,
  },
  'sunday-rovers-women': {
    name: 'Sunday Rovers FC Women', slug: 'sunday-rovers-women', league: 'National League',
    tier: 'grassroots', accent: '#22C55E', stadium: 'Rovers Park', capacity: 400,
    manager: 'Bev Hartley', director: 'Bev Hartley',
    fsrHeadroom: null, salarySpend: null, relevantRevenue: 85000,
    kitSponsor: null, founded: 2011,
  },
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = 'pink' }: { label: string; value: string | number; sub?: string; color?: string }) => {
  const colorMap: Record<string, string> = {
    pink: 'from-pink-600/20 to-pink-900/10 border-pink-600/20',
    teal: 'from-teal-600/20 to-teal-900/10 border-teal-600/20',
    green: 'from-green-600/20 to-green-900/10 border-green-600/20',
    red: 'from-red-600/20 to-red-900/10 border-red-600/20',
    amber: 'from-amber-600/20 to-amber-900/10 border-amber-600/20',
    blue: 'from-blue-600/20 to-blue-900/10 border-blue-600/20',
    purple: 'from-purple-600/20 to-purple-900/10 border-purple-600/20',
  }
  return (
    <div className={`bg-gradient-to-br ${colorMap[color] || colorMap.pink} border rounded-xl p-4`}>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}

const SectionHeader = ({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: string }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2">
      {icon && <span className="text-xl">{icon}</span>}
      <h2 className="text-xl font-bold text-white">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-gray-400 mt-1 ml-7">{subtitle}</p>}
  </div>
)

// ─── INSIGHTS VIEW ───────────────────────────────────────────────────────────
const InsightsView = ({ club, defaultRole }: { club: WomensClub; defaultRole?: string }) => {
  const [activeRole, setActiveRole] = useState(defaultRole ?? 'coach');
  const roles = [
    { id: 'coach', label: 'Head Coach', icon: '🎽' },
    { id: 'dof', label: 'Director of Football', icon: '📋' },
    { id: 'welfare', label: 'Welfare Lead', icon: '❤️' },
    { id: 'doctor', label: 'Club Doctor', icon: '🏥' },
    { id: 'commercial', label: 'Commercial Director', icon: '💼' },
    { id: 'academy', label: 'Academy Director', icon: '🎓' },
    { id: 'board', label: 'Board', icon: '🏛️' },
    { id: 'media', label: 'Media & Comms', icon: '📣' },
  ];
  const ICard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-[#0D1117] border border-gray-800 rounded-xl p-5 ${className}`}>{children}</div>
  );
  const IH3 = ({ children }: { children: React.ReactNode }) => <h3 className="text-sm font-bold text-white mb-3">{children}</h3>;
  const thd = "text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30";
  const ttd = "p-3 text-gray-400 text-xs";

  const coachContent = () => (
    <div className="space-y-6">
      <SectionHeader title="Head Coach View" subtitle="Performance, cycle overlay, and squad readiness" icon="🎽" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Squad Available" value="19/24" sub="5 unavailable (injury/cycle load cap)" color="pink" />
        <StatCard label="Today's ACL Flags" value="2" sub="Emily Zhang · Priya Nair" color="red" />
        <StatCard label="xG Last Match" value="0.31" sub="vs Brighton (L 0–1)" color="amber" />
        <StatCard label="Next Match" value="Sat 12 Apr" sub="vs Bristol City (A)" color="blue" />
      </div>
      <ICard>
        <IH3>Squad Readiness — Cycle Phase Overlay</IH3>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className={thd}>
          <th className="text-left p-3">Player</th><th className="text-left p-3">Pos</th><th className="text-left p-3">Fitness</th><th className="text-left p-3">Cycle</th><th className="text-left p-3">Load Cap</th><th className="text-left p-3">ACL</th><th className="text-left p-3">Available</th>
        </tr></thead><tbody>
          {[
            {n:'Emma Clarke',p:'GK',f:'100%',c:'Follicular',lc:'100%',acl:'—',av:'✓',avC:'green'},
            {n:'Priya Nair',p:'FW',f:'92%',c:'Ovulatory',lc:'95%',acl:'⚠ Laxity',av:'✓',avC:'amber'},
            {n:'Emily Zhang',p:'CM',f:'88%',c:'Luteal',lc:'60%',acl:'🔴 High risk',av:'Limited',avC:'red'},
            {n:'Charlotte Reed',p:'CB',f:'95%',c:'Menstrual',lc:'65%',acl:'—',av:'Limited',avC:'amber'},
            {n:'Jade Osei',p:'LB',f:'100%',c:'Follicular',lc:'100%',acl:'—',av:'✓',avC:'green'},
            {n:'Abbi Walsh',p:'RM',f:'97%',c:'Luteal',lc:'80%',acl:'⚠ Luteal',av:'✓',avC:'amber'},
            {n:'Lucy Whitmore',p:'CM',f:'100%',c:'Follicular',lc:'100%',acl:'—',av:'✓',avC:'green'},
            {n:'Sophie Turner',p:'CB',f:'40%',c:'—',lc:'RTP P3',acl:'—',av:'No — injured',avC:'red'},
          ].map((r,i)=>{
            const lcN=parseInt(r.lc);const lcC=isNaN(lcN)?'text-blue-400':lcN<=65?'text-red-400':lcN<=85?'text-amber-400':'text-green-400';
            const avB=r.avC==='green'?'bg-green-600/20 text-green-400':r.avC==='amber'?'bg-amber-600/20 text-amber-400':'bg-red-600/20 text-red-400';
            return<tr key={i} className="border-b border-gray-800/50">
              <td className="p-3 text-gray-200 font-medium">{r.n}</td><td className={ttd}>{r.p}</td><td className={ttd}>{r.f}</td><td className={ttd}>{r.c}</td>
              <td className="p-3"><span className={`text-xs font-bold ${lcC}`}>{r.lc}</span></td>
              <td className="p-3">{r.acl.startsWith('🔴')?<span className="text-[10px] px-2 py-0.5 rounded bg-red-600/20 text-red-400">{r.acl}</span>:r.acl.startsWith('⚠')?<span className="text-[10px] px-2 py-0.5 rounded bg-amber-600/20 text-amber-400">{r.acl}</span>:<span className="text-gray-600">—</span>}</td>
              <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${avB}`}>{r.av}</span></td>
            </tr>;
          })}
        </tbody></table></div>
      </ICard>
      <ICard>
        <IH3>Form &amp; Momentum</IH3>
        <div className="flex gap-2 mb-4">{['L','W','W','D','W'].map((r,i)=><span key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${r==='W'?'bg-green-600/20 text-green-400':r==='L'?'bg-red-600/20 text-red-400':'bg-amber-600/20 text-amber-400'}`}>{r}</span>)}</div>
        <div className="text-xs text-gray-500 mb-2">xG trend last 5:</div>
        <svg viewBox="0 0 200 40" className="w-full max-w-xs" style={{height:40}}>
          {[0.31,1.42,0.98,0.67,1.21].map((v,i,a)=>{const x=i*50;const y=40-(v/1.5)*36;return i<a.length-1?<line key={i} x1={x} y1={y} x2={(i+1)*50} y2={40-(a[i+1]/1.5)*36} stroke="#EC4899" strokeWidth="2"/>:null;})}
          {[0.31,1.42,0.98,0.67,1.21].map((v,i)=><circle key={i} cx={i*50} cy={40-(v/1.5)*36} r="3" fill="#EC4899"/>)}
          {[0.31,1.42,0.98,0.67,1.21].map((v,i)=><text key={`t${i}`} x={i*50} y={40-(v/1.5)*36-6} textAnchor="middle" fill="#9CA3AF" fontSize="7">{v}</text>)}
        </svg>
      </ICard>
      <ICard>
        <IH3>Tactical Notes — Next Opponent (Bristol City Women)</IH3>
        <div className="space-y-2">{['Press trigger: Bristol play out from back. High press in first 10 minutes effective.','Set piece threat: Bristol score 38% of goals from corners. Zonal or man-mark decision required.','Cycle consideration: 3 players in high-load-cap phases. Conserve energy in transitions.'].map((t,i)=><div key={i} className="p-3 bg-[#0a0c14] border border-gray-800 rounded-lg text-xs text-gray-300">• {t}</div>)}</div>
      </ICard>
    </div>
  );

  const dofContent = () => (
    <div className="space-y-6">
      <SectionHeader title="Director of Football View" subtitle="FSR headroom, transfers, and squad planning" icon="📋" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="FSR Headroom" value="£380k" sub="Before 80% cap breach" color="green" />
        <StatCard label="Contract Expiries" value="4" sub="End of season 2026" color="amber" />
        <StatCard label="Transfer Window" value="12 days" sub="Summer window opens" color="blue" />
        <StatCard label="Squad Age (avg)" value="24.3" sub="Median 23 — good curve" color="pink" />
      </div>
      <ICard>
        <IH3>FSR Headroom Tracker</IH3>
        <div className="flex justify-between text-xs mb-2"><span className="text-gray-400">£2.18M spent</span><span className="text-gray-400">£2.56M cap</span></div>
        <div className="h-4 bg-gray-800 rounded-full overflow-hidden mb-2"><div className="h-full rounded-full bg-pink-500" style={{width:'85%'}}/></div>
        <div className="text-xs text-teal-400 mb-4">Headroom: £380k</div>
        <IH3>Proposed Signings Impact</IH3>
        <div className="space-y-2">{[{t:'LB — Lena Müller (Hoffenheim)',s:'£62k',h:'£318k',c:'green'},{t:'FW — Chloe Dubois (D1 Arkema)',s:'£78k',h:'£240k',c:'green'},{t:'CM — Unknown',s:'£120k',h:'£120k',c:'amber'}].map((r,i)=><div key={i} className="flex items-center justify-between p-3 bg-[#0a0c14] border border-gray-800 rounded-lg"><div className="text-xs text-gray-200">{r.t}</div><div className="flex items-center gap-4 text-xs"><span className="text-gray-500">{r.s}</span><span className={`font-bold ${r.c==='green'?'text-green-400':'text-amber-400'}`}>→ {r.h}</span></div></div>)}</div>
      </ICard>
      <ICard>
        <IH3>Contract Expiry Pipeline</IH3>
        <table className="w-full text-sm"><thead><tr className={thd}><th className="text-left p-3">Player</th><th className="text-left p-3">Pos</th><th className="text-left p-3">Ends</th><th className="text-left p-3">Value</th><th className="text-left p-3">Action</th></tr></thead><tbody>
          {[{n:'Lucy Whitmore',p:'CM',e:'Jun 2026',v:'£55k/yr',a:'Renewal offer sent'},{n:'Jade Osei',p:'LB',e:'Jun 2026',v:'£48k/yr',a:'Negotiating'},{n:'Tilly Brooks',p:'FW',e:'Jun 2026',v:'£38k/yr',a:'Below WSL min — review'},{n:'Megan Hughes',p:'CM',e:'Dec 2026',v:'£52k/yr',a:'Monitor'}].map((r,i)=><tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200">{r.n}</td><td className={ttd}>{r.p}</td><td className={ttd}>{r.e}</td><td className={ttd}>{r.v}</td><td className="p-3 text-xs text-pink-400">{r.a}</td></tr>)}
        </tbody></table>
      </ICard>
      <ICard>
        <IH3>Squad Age Distribution</IH3>
        <svg viewBox="0 0 200 80" className="w-full max-w-xs" style={{height:80}}>
          {[{l:'U21',v:4},{l:'21–24',v:8},{l:'25–28',v:7},{l:'29+',v:5}].map((b,i)=>{const x=i*50+5;const h=(b.v/8)*55;return<g key={i}><rect x={x} y={70-h} width={35} height={h} fill="#EC4899" rx="3" opacity="0.8"/><text x={x+17.5} y={78} textAnchor="middle" fill="#9CA3AF" fontSize="8">{b.l}</text><text x={x+17.5} y={66-h} textAnchor="middle" fill="#F9FAFB" fontSize="9" fontWeight="700">{b.v}</text></g>;})}
        </svg>
      </ICard>
    </div>
  );

  const welfareContent = () => (
    <div className="space-y-6">
      <SectionHeader title="Welfare Lead View" subtitle="Cycle flags, ACL risk, mental health, and compliance" icon="❤️" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Welfare Cases" value="3" sub="ACL · MH · Maternity" color="amber" />
        <StatCard label="Cycle Opt-in Rate" value="64%" sub="14 of 22 eligible" color="pink" />
        <StatCard label="Check-ins Overdue" value="2" sub="Action required" color="red" />
        <StatCard label="Carney Compliance" value="91%" sub="2 criteria below threshold" color="green" />
      </div>
      <ICard><IH3>Priority Actions Today</IH3><div className="space-y-2">{[{t:'Emily Zhang — ACL composite 87/100. Immediate load reduction to 60% and physio consultation.',c:'red'},{t:'Priya Nair — Ovulatory phase + yellow card risk. Substitution recommended before 60 min.',c:'amber'},{t:'Ava Mitchell — Maternity leave starts May 2026. Pre-leave medical due by 30 Apr.',c:'blue'}].map((a,i)=><div key={i} className={`p-3 border rounded-lg text-xs text-gray-300 ${a.c==='red'?'border-red-600/30 bg-red-900/10':a.c==='amber'?'border-amber-600/30 bg-amber-900/10':'border-blue-600/30 bg-blue-900/10'}`}>{a.t}</div>)}</div></ICard>
      <ICard><IH3>Cycle Phase Summary — Squad Today</IH3><div className="space-y-2">{[{l:'Menstrual',v:3,c:'bg-red-500'},{l:'Follicular',v:8,c:'bg-pink-500'},{l:'Ovulatory',v:3,c:'bg-purple-500'},{l:'Luteal',v:8,c:'bg-amber-500'}].map(p=><div key={p.l} className="flex items-center gap-3"><div className="w-20 text-xs text-gray-400">{p.l}</div><div className="flex-1 bg-gray-800 rounded-full h-3"><div className={`${p.c} h-3 rounded-full`} style={{width:`${(p.v/22)*100}%`}}/></div><span className="text-xs text-gray-300 w-8 text-right">{p.v}</span></div>)}</div></ICard>
      <ICard><IH3>Karen Carney Review — Welfare Criteria</IH3><div className="space-y-1.5">{[{t:'Licensed performance psychologist available',s:'✓'},{t:'Monthly wellbeing check-ins logged',s:'✓'},{t:'Maternity policy documented and enacted',s:'✓'},{t:'Mental health first aider on staff',s:'✓'},{t:'PFA referral pathway in place',s:'✓'},{t:'No selection pressure during recovery',s:'✓'},{t:'Independent welfare officer appointed (in progress)',s:'⚠'},{t:'Annual welfare audit completed (due Jun 2026)',s:'⚠'}].map((c,i)=><div key={i} className="flex items-center gap-2 text-xs"><span className={c.s==='✓'?'text-green-400':'text-amber-400'}>{c.s}</span><span className="text-gray-300">{c.t}</span></div>)}</div></ICard>
    </div>
  );

  const doctorContent = () => (
    <div className="space-y-6">
      <SectionHeader title="Club Doctor View" subtitle="Medical records, ACL composite scores, and injury risk" icon="🏥" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Injuries" value="3" sub="1 severe · 1 moderate · 1 minor" color="red" />
        <StatCard label="ACL Red Flags" value="2" sub="Immediate action required" color="red" />
        <StatCard label="Screenings Overdue" value="4" sub="Schedule this week" color="amber" />
        <StatCard label="RTP Players" value="1" sub="Sophie Turner — Phase 3" color="blue" />
      </div>
      <ICard><IH3>ACL Composite Score — Medical View</IH3><div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{[{n:'Emily Zhang',p:'CM',t:98,l:'red' as const,a:'Contact physio NOW. No training today.'},{n:'Priya Nair',p:'FW',t:53,l:'amber' as const,a:'Avoid cutting drills. Review post-training.'},{n:'Sophie Turner',p:'CB',t:57,l:'amber' as const,a:'Continue RTP Phase 3. ACL physio Thu.'},{n:'Jade Osei',p:'LB',t:15,l:'green' as const,a:'Clear for full training.'},{n:'Emma Clarke',p:'GK',t:18,l:'green' as const,a:'Schedule overdue ACL screening.'}].map(p=><div key={p.n} className={`border rounded-xl p-3 ${p.l==='red'?'bg-red-600/10 border-red-600/30':p.l==='amber'?'bg-amber-600/10 border-amber-600/30':'bg-green-600/10 border-green-600/30'}`}><div className="flex items-center gap-2 mb-2"><div className={`w-5 h-5 rounded-full ${p.l==='red'?'bg-red-500':p.l==='amber'?'bg-amber-500':'bg-green-500'}`}/><div><div className="text-xs font-bold text-white">{p.n}</div><div className="text-[10px] text-gray-500">{p.p} · {p.t}/100</div></div></div><div className="text-[10px] text-gray-400">{p.a}</div></div>)}</div></ICard>
      <ICard><IH3>Injury Register</IH3><table className="w-full text-sm"><thead><tr className={thd}><th className="text-left p-3">Player</th><th className="text-left p-3">Injury</th><th className="text-left p-3">Severity</th><th className="text-left p-3">RTP</th></tr></thead><tbody>{[{n:'Sophie Turner',i:'ACL',s:'Severe',r:'Aug 2026'},{n:'Megan Hughes',i:'Hamstring',s:'Moderate',r:'May 2026'},{n:'Tilly Brooks',i:'Concussion',s:'Minor',r:'14 Apr 2026'}].map((r,i)=><tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200">{r.n}</td><td className={ttd}>{r.i}</td><td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${r.s==='Severe'?'bg-red-600/20 text-red-400':r.s==='Moderate'?'bg-amber-600/20 text-amber-400':'bg-blue-600/20 text-blue-400'}`}>{r.s}</span></td><td className={ttd}>{r.r}</td></tr>)}</tbody></table></ICard>
      <ICard><IH3>Upcoming Medical Appointments</IH3><div className="space-y-2">{['Thu 10 Apr — Emily Zhang physio consultation (ACL flag)','Fri 11 Apr — Tilly Brooks concussion clearance','Mon 14 Apr — Sophie Turner RTP Phase 3 assessment','Wed 16 Apr — Squad ACL screening block (4 players)'].map((a,i)=><div key={i} className="p-2.5 bg-[#0a0c14] border border-gray-800 rounded-lg text-xs text-gray-300">{a}</div>)}</div></ICard>
    </div>
  );

  const commercialContent = () => (
    <div className="space-y-6">
      <SectionHeader title="Commercial Director View" subtitle="Sponsorship, revenue, and standalone attribution" icon="💼" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Commercial Revenue" value="£1.42M" sub="Women-attributed" color="pink" />
        <StatCard label="Active Sponsors" value="6" sub="3 renewal due" color="green" />
        <StatCard label="Pipeline Value" value="£285k" sub="3 live opportunities" color="blue" />
        <StatCard label="Standalone Revenue %" value="31%" sub="vs parent club benchmark" color="teal" />
      </div>
      <ICard><IH3>Sponsorship Portfolio</IH3><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className={thd}><th className="text-left p-3">Sponsor</th><th className="text-left p-3">Type</th><th className="text-left p-3">Value</th><th className="text-left p-3">Attr</th><th className="text-left p-3">Renewal</th><th className="text-left p-3">Status</th></tr></thead><tbody>{[{n:'Kestrel Finance',t:'Kit',v:'£420k',a:'100%',r:'Jun 2027',s:'Active',c:'green'},{n:'Barclays (WSL)',t:'League',v:'£85k',a:'100%',r:'League',s:'Active',c:'green'},{n:'NovaTech UK',t:'Sleeve',v:'£40k',a:'100%',r:'Dec 2026',s:'Active',c:'green'},{n:'Meridian Insurance',t:'Shared',v:'£95k',a:'11.9%',r:'Mar 2026',s:'Review',c:'amber'},{n:'Local Energy Co',t:"Women's",v:'£35k',a:'100%',r:'Apr 2026',s:'Renewal',c:'red'},{n:'Oakridge Council',t:'Community',v:'£18k',a:'100%',r:'Jun 2026',s:'Active',c:'green'}].map((r,i)=><tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200">{r.n}</td><td className={ttd}>{r.t}</td><td className={ttd}>{r.v}</td><td className={ttd}>{r.a}</td><td className={ttd}>{r.r}</td><td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${r.c==='green'?'bg-green-600/20 text-green-400':r.c==='amber'?'bg-amber-600/20 text-amber-400':'bg-red-600/20 text-red-400'}`}>{r.s}</span></td></tr>)}</tbody></table></div></ICard>
      <ICard><IH3>Pipeline Opportunities</IH3><div className="space-y-2">{['Cycle tracking app partnership — Lumio Cycle data product. Est. £60–120k/yr. In discussion.','Women\'s kit sleeve — post-Carney opportunity. Est. £25–40k/yr. Proposal stage.','GPS vest bundle — Lumio Health co-sell. Est. £85k one-off. Scoping.'].map((o,i)=><div key={i} className="p-3 bg-[#0a0c14] border border-gray-800 rounded-lg text-xs text-gray-300">• {o}</div>)}</div></ICard>
      <ICard><IH3>Revenue YoY Trend</IH3><svg viewBox="0 0 200 80" className="w-full max-w-xs" style={{height:80}}>{[{l:'23/24',v:1.06},{l:'24/25',v:1.27},{l:'25/26',v:1.42}].map((b,i)=>{const x=i*65+10;const h=(b.v/1.5)*55;return<g key={i}><rect x={x} y={70-h} width={45} height={h} fill="#EC4899" rx="3" opacity="0.8"/><text x={x+22.5} y={78} textAnchor="middle" fill="#9CA3AF" fontSize="8">{b.l}</text><text x={x+22.5} y={66-h} textAnchor="middle" fill="#F9FAFB" fontSize="9" fontWeight="700">£{b.v}M</text></g>;})}</svg></ICard>
    </div>
  );

  const academyContent = () => (
    <div className="space-y-6">
      <SectionHeader title="Academy Director View" subtitle="FA Girls' Centre of Excellence · U21/U18" icon="🎓" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Academy Players" value="34" sub="U18: 18 · U21: 16" color="pink" />
        <StatCard label="First Team Promotions" value="2" sub="This season" color="green" />
        <StatCard label="CoE Compliance" value="87%" sub="3 criteria outstanding" color="amber" />
        <StatCard label="Development Contracts" value="8" sub="Scholarship agreements" color="blue" />
      </div>
      <ICard><IH3>FA Girls&apos; Centre of Excellence Compliance</IH3><div className="space-y-1.5">{[{t:'Qualified coaching staff ratio met (1:15)',s:'✓'},{t:'Safeguarding DBS checks up to date',s:'✓'},{t:'Education welfare officer in post',s:'✓'},{t:'Player development plans filed (all U18)',s:'✓'},{t:'Medical screening completed (all academy)',s:'✓'},{t:'Physiotherapy provision (shared — standalone required by Aug 2026)',s:'⚠'},{t:'S&C coach (U18 — recruitment underway)',s:'⚠'},{t:'Mental health practitioner for academy (Required Jun 2026 — urgent)',s:'✗'}].map((c,i)=><div key={i} className="flex items-center gap-2 text-xs"><span className={c.s==='✓'?'text-green-400':c.s==='⚠'?'text-amber-400':'text-red-400'}>{c.s}</span><span className="text-gray-300">{c.t}</span></div>)}</div></ICard>
      <ICard><IH3>U18 Squad — GPS Development Profiles</IH3><table className="w-full text-sm"><thead><tr className={thd}><th className="text-left p-3">Player</th><th className="text-left p-3">Age</th><th className="text-left p-3">Pos</th><th className="text-left p-3">GPS</th><th className="text-left p-3">Rating</th><th className="text-left p-3">Potential</th></tr></thead><tbody>{[{n:'Isla Pearce',a:17,p:'FW',g:'64 AU',d:'★★★★☆',po:'High'},{n:'Freya Watts',a:16,p:'CM',g:'58 AU',d:'★★★☆☆',po:'Medium'},{n:"Niamh O'Brien",a:17,p:'CB',g:'71 AU',d:'★★★★★',po:'Elite'},{n:'Becca Lane',a:15,p:'GK',g:'55 AU',d:'★★★☆☆',po:'Monitor'},{n:'Simone Ashby',a:17,p:'LB',g:'62 AU',d:'★★★★☆',po:'High'}].map((r,i)=><tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200">{r.n}</td><td className={ttd}>{r.a}</td><td className={ttd}>{r.p}</td><td className={ttd}>{r.g}</td><td className="p-3 text-pink-400 text-xs">{r.d}</td><td className="p-3 text-xs text-teal-400">{r.po}</td></tr>)}</tbody></table></ICard>
      <ICard><IH3>Dual Pathway — First Team Bridge</IH3><div className="space-y-2">{["Niamh O'Brien — nominated for dual registration from May 2026. Pending DoF sign-off.","Isla Pearce — training with first team Fridays. No formal registration yet."].map((t,i)=><div key={i} className="p-3 bg-[#0a0c14] border border-pink-600/20 rounded-lg text-xs text-gray-300">{t}</div>)}</div></ICard>
    </div>
  );

  const boardContent = () => (
    <div className="space-y-6">
      <SectionHeader title="Board View" subtitle="Financial performance, FSR compliance, and strategic KPIs" icon="🏛️" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Season P&L" value="-£420k" sub="Operating loss (budgeted)" color="amber" />
        <StatCard label="FSR Status" value="SAFE" sub="68% of relevant revenue" color="green" />
        <StatCard label="3-Year Revenue Target" value="£4.2M" sub="By 2027/28" color="blue" />
        <StatCard label="Karen Carney Score" value="91/100" sub="2 criteria outstanding" color="pink" />
      </div>
      <ICard><IH3>Financial Summary</IH3><table className="w-full text-sm"><thead><tr className={thd}><th className="text-left p-3">Category</th><th className="text-left p-3">Budget</th><th className="text-left p-3">Actual</th><th className="text-left p-3">Variance</th></tr></thead><tbody>{[{c:'Revenue',b:'£3.4M',a:'£3.2M',v:'-£200k',vc:'amber'},{c:'Salary',b:'£2.3M',a:'£2.18M',v:'+£120k',vc:'green'},{c:'Operations',b:'£800k',a:'£840k',v:'-£40k',vc:'amber'},{c:'Commercial',b:'£180k',a:'£165k',v:'-£15k',vc:'amber'},{c:'Net',b:'—',a:'-£420k',v:'On budget',vc:'green'}].map((r,i)=><tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200 font-medium">{r.c}</td><td className={ttd}>{r.b}</td><td className={ttd}>{r.a}</td><td className="p-3"><span className={`text-xs font-bold ${r.vc==='green'?'text-green-400':'text-amber-400'}`}>{r.v}</span></td></tr>)}</tbody></table></ICard>
      <ICard><IH3>Strategic KPIs — 3-Year Plan</IH3><div className="space-y-3">{[{l:'Revenue growth to £4.2M',v:76,c:'£3.2M'},{l:'Avg attendance to 4,500',v:62,c:'2,800'},{l:'WSL top 6 finish',v:100,c:'5th — On track'}].map(k=><div key={k.l}><div className="flex justify-between text-xs mb-1"><span className="text-gray-400">{k.l}</span><span className="text-gray-300">{k.c} ({k.v}%)</span></div><div className="h-2 bg-gray-800 rounded-full"><div className="h-2 rounded-full bg-pink-500" style={{width:`${k.v}%`}}/></div></div>)}</div></ICard>
      <ICard><IH3>Board Actions Required</IH3><div className="space-y-2">{[{t:'Academy mental health practitioner — recruitment sign-off by 30 Apr.',c:'red'},{t:'Local Energy Co renewal — £35k deal expiring. Uplift to £45k approval.',c:'amber'},{t:'Lumio Cycle data product — Board presentation Mon 14 Apr.',c:'blue'}].map((a,i)=><div key={i} className={`p-3 border rounded-lg text-xs text-gray-300 ${a.c==='red'?'border-red-600/30 bg-red-900/10':a.c==='amber'?'border-amber-600/30 bg-amber-900/10':'border-blue-600/30 bg-blue-900/10'}`}>{a.t}</div>)}</div></ICard>
    </div>
  );

  const mediaContent = () => (
    <div className="space-y-6">
      <SectionHeader title="Media & Comms View" subtitle="Audience growth, social media, and fan engagement" icon="📣" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Social Followers" value="42.8k" sub="+18% this season" color="pink" />
        <StatCard label="Match Attendance" value="2,800 avg" sub="+340 vs last season" color="green" />
        <StatCard label="Media Requests" value="3 pending" sub="2 interview · 1 feature" color="amber" />
        <StatCard label="Fan Hub Members" value="1,240" sub="Launched Jan 2026" color="blue" />
      </div>
      <ICard><IH3>Social Media Performance</IH3><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className={thd}><th className="text-left p-3">Platform</th><th className="text-left p-3">Followers</th><th className="text-left p-3">Growth</th><th className="text-left p-3">Best Post</th><th className="text-left p-3">Eng.</th></tr></thead><tbody>{[{p:'Instagram',f:'18.4k',g:'+22%',b:'48k (WSL goal)',e:'6.8%'},{p:'TikTok',f:'14.2k',g:'+41%',b:'112k (BTS reel)',e:'9.2%'},{p:'X',f:'7.6k',g:'+8%',b:'22k (match thread)',e:'3.1%'},{p:'YouTube',f:'2.6k',g:'+14%',b:'8.4k (profile)',e:'4.7%'}].map((r,i)=><tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200">{r.p}</td><td className={ttd}>{r.f}</td><td className="p-3 text-green-400 text-xs">{r.g}</td><td className={ttd}>{r.b}</td><td className={ttd}>{r.e}</td></tr>)}</tbody></table></div></ICard>
      <ICard><IH3>Content Calendar — This Week</IH3><div className="space-y-2">{['Thu 10 Apr — Match preview (vs Bristol City) — IG + X','Fri 11 Apr — Player spotlight: Emma Clarke — TikTok','Sat 12 Apr — Live match thread + post-match reel — All','Mon 14 Apr — Behind the season ep 7 — YouTube'].map((c,i)=><div key={i} className="p-2.5 bg-[#0a0c14] border border-gray-800 rounded-lg text-xs text-gray-300">{c}</div>)}</div></ICard>
      <ICard><IH3>Pending Media Requests</IH3><div className="space-y-2">{[{t:'Crown Broadcasting — feature on Lumio Cycle welfare integration. Deadline: 15 Apr.',u:false},{t:'The Chronicle — interview: Sarah Frost on WSL season. Deadline: 18 Apr.',u:false},{t:'Northbridge Sport — matchday access vs Bristol City (Sat). Confirm by Thu.',u:true}].map((m,i)=><div key={i} className={`p-3 border rounded-lg text-xs text-gray-300 flex items-start justify-between gap-2 ${m.u?'border-red-600/30 bg-red-900/10':'border-amber-600/30 bg-amber-900/10'}`}><span>{m.t}</span>{m.u&&<span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 flex-shrink-0">URGENT</span>}</div>)}</div></ICard>
      <ICard><IH3>Fan Hub Highlights</IH3><div className="grid grid-cols-3 gap-3">{[{l:'Members',v:'1,240'},{l:'Match Overlap',v:'68%'},{l:'Top Topic',v:'Player welfare'}].map(s=><div key={s.l} className="text-center p-3 bg-[#0a0c14] border border-gray-800 rounded-lg"><div className="text-lg font-bold text-pink-400">{s.v}</div><div className="text-[10px] text-gray-500 mt-0.5">{s.l}</div></div>)}</div></ICard>
    </div>
  );

  const renderRole = () => {
    switch (activeRole) {
      case 'coach': return coachContent();
      case 'dof': return dofContent();
      case 'welfare': return welfareContent();
      case 'doctor': return doctorContent();
      case 'commercial': return commercialContent();
      case 'academy': return academyContent();
      case 'board': return boardContent();
      case 'media': return mediaContent();
      default: return coachContent();
    }
  };

  return (
    <div>
      <SectionHeader title={`${club.name} — Insights`} subtitle="Role-based dashboards — 8 views for 8 roles across the club" icon="📊" />
      <div className="overflow-x-auto pb-2 mb-6">
        <div className="flex gap-1 min-w-max">
          {roles.map(r => (
            <button key={r.id} onClick={() => setActiveRole(r.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-all ${activeRole===r.id?'bg-pink-600/20 text-pink-400 border-b-2 border-pink-500':'text-gray-500 hover:text-gray-300'}`}>
              <span>{r.icon}</span>{r.label}
            </button>
          ))}
        </div>
      </div>
      {renderRole()}
    </div>
  );
};

// ─── DASHBOARD VIEW ───────────────────────────────────────────────────────────
const DashboardView = ({ club }: { club: WomensClub }) => (
  <div>
    <SectionHeader title={`${club.name} — Club Dashboard`} subtitle="FSR compliant · Karen Carney Review standards" icon="🏠" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="FSR Status" value="SAFE" sub="Salary 68% of Relevant Revenue" color="green" />
      <StatCard label="Squad" value="24" sub={`${club.league} registered`} color="pink" />
      <StatCard label="Welfare Flags" value="2" sub="1 ACL monitoring, 1 mental health" color="amber" />
      <StatCard label="Next Match" value="Sat 12 Apr" sub="vs Brighton Women (H)" color="blue" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">FSR Compliance Summary</h3>
        <div className="space-y-2">
          {[
            { label: 'Relevant Revenue (women-only)', value: '£3.2M', status: 'green' },
            { label: 'Total salary spend', value: '£2.18M', status: 'green' },
            { label: 'Salary % of revenue', value: '68%', status: 'green' },
            { label: 'FSR cap (80%)', value: '£2.56M', status: 'green' },
            { label: 'Headroom', value: '£380k', status: 'green' },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-gray-800">
              <span className="text-xs text-gray-400">{r.label}</span>
              <span className={`text-sm font-semibold ${r.status === 'green' ? 'text-green-400' : r.status === 'amber' ? 'text-amber-400' : 'text-red-400'}`}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Player Welfare Dashboard</h3>
        <div className="space-y-3">
          {[
            { player: 'Emily Zhang', flag: 'ACL', detail: 'Previous ACL — 6-month screening due', severity: 'amber' },
            { player: 'Charlotte Reed', flag: 'Mental Health', detail: 'Weekly check-in with performance psychologist', severity: 'amber' },
            { player: 'Ava Mitchell', flag: 'Maternity', detail: 'Leave starts May 2026 — return plan logged', severity: 'blue' },
          ].map(w => (
            <div key={w.player} className={`rounded-lg p-3 border ${w.severity === 'amber' ? 'border-amber-600/30 bg-amber-600/5' : 'border-blue-600/30 bg-blue-600/5'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-white">{w.player}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${w.severity === 'amber' ? 'bg-amber-600/20 text-amber-400' : 'bg-blue-600/20 text-blue-400'}`}>{w.flag}</span>
              </div>
              <p className="text-xs text-gray-400">{w.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Sponsorship Pipeline</h3>
        <div className="space-y-2">
          {[
            { name: 'Apex Performance (Kit)', value: '£420k/yr', status: 'Active' },
            { name: 'Barclays (WSL)', value: '£85k/yr', status: 'Active' },
            { name: 'Local Energy Co', value: '£35k/yr', status: 'Renewal due' },
          ].map(s => (
            <div key={s.name} className="flex items-center justify-between py-1.5 border-b border-gray-800">
              <span className="text-xs text-gray-300">{s.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{s.value}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.status === 'Active' ? 'bg-green-600/20 text-green-400' : 'bg-amber-600/20 text-amber-400'}`}>{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Dual Registration</h3>
        <div className="space-y-2">
          {[
            { player: 'Lucy Whitmore', from: 'Oakridge W', to: 'Bristol City W', expires: '30 Apr' },
            { player: 'Jade Hopkins', from: 'Oakridge W', to: 'Crystal Palace W', expires: '15 May' },
          ].map(d => (
            <div key={d.player} className="flex items-center justify-between py-1.5 border-b border-gray-800">
              <div><span className="text-xs text-white">{d.player}</span><span className="text-[10px] text-gray-500 ml-2">→ {d.to}</span></div>
              <span className="text-xs text-amber-400">Expires {d.expires}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Upcoming</h3>
        <div className="space-y-2">
          {[
            { item: 'Brighton Women (H)', date: 'Sat 12 Apr', type: 'WSL' },
            { item: 'Board meeting', date: 'Mon 14 Apr', type: 'Internal' },
            { item: 'Apex Performance kit review', date: 'Wed 16 Apr', type: 'Commercial' },
            { item: 'Registration window closes', date: '30 Apr', type: 'FA' },
          ].map(u => (
            <div key={u.item} className="flex items-center justify-between py-1.5 border-b border-gray-800">
              <span className="text-xs text-gray-300">{u.item}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">{u.date}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{u.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

// ─── FSR VIEW ─────────────────────────────────────────────────────────────────
const FSRDashboardView = ({ club }: { club: WomensClub }) => (
  <div>
    <SectionHeader title="FSR Compliance Dashboard" subtitle="Financial Sustainability Regulations — 2025/26 Season" icon="📊" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="FSR Status" value="SAFE" sub="Within 80% cap" color="green" />
      <StatCard label="Relevant Revenue" value="£3.2M" sub="Women-only revenue" color="pink" />
      <StatCard label="Salary Spend" value="£2.18M" sub="68% of revenue" color="blue" />
      <StatCard label="Headroom" value="£380k" sub="Before cap breach" color="teal" />
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-4">Revenue Attribution — Relevant Revenue Breakdown</h3>
      <div className="space-y-2">
        {[
          { category: 'Matchday revenue (women-only)', value: '£680k', pct: 21 },
          { category: 'Commercial (women-attributed)', value: '£1.42M', pct: 44 },
          { category: 'Broadcast (WSL allocation)', value: '£820k', pct: 26 },
          { category: 'Prize money & FA distributions', value: '£280k', pct: 9 },
        ].map(r => (
          <div key={r.category}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">{r.category}</span>
              <span className="text-sm font-semibold text-white">{r.value}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div className="h-1.5 rounded-full" style={{ width: `${r.pct}%`, backgroundColor: '#EC4899' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-4">Bundled Sponsorship Attribution</h3>
      <p className="text-xs text-gray-400 mb-3">Sponsors shared with men's parent club must be correctly attributed. FSR counts only the women's share.</p>
      <div className="space-y-2">
        {[
          { sponsor: 'Skyward Atlantic (Shared — parent club)', total: '£12M', womens: '£180k', pct: '1.5%', flag: false },
          { sponsor: 'Apex Performance (Kit — standalone women\'s deal)', total: '£420k', womens: '£420k', pct: '100%', flag: false },
          { sponsor: 'Local Energy Co (Women-only)', total: '£35k', womens: '£35k', pct: '100%', flag: false },
        ].map(s => (
          <div key={s.sponsor} className="flex items-center justify-between py-2 border-b border-gray-800">
            <span className="text-xs text-gray-300">{s.sponsor}</span>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">Total: {s.total}</span>
              <span className="text-xs text-pink-400 font-semibold">Women&apos;s: {s.womens} ({s.pct})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4">
      <p className="text-sm text-amber-300"><strong>FSR Rule:</strong> Total salary spend must not exceed 80% of Relevant Revenue. Relevant Revenue = only revenue directly attributable to women&apos;s football activities.</p>
    </div>
  </div>
)

// ─── WELFARE VIEW ─────────────────────────────────────────────────────────────
const WelfareView = () => (
  <div>
    <SectionHeader title="Player Welfare Hub" subtitle="Karen Carney Review — mandatory welfare standards" icon="❤️" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Active Flags" value="3" sub="2 monitoring, 1 leave" color="amber" />
      <StatCard label="ACL History" value="4 players" sub="Screening programme active" color="red" />
      <StatCard label="Maternity" value="1 active" sub="Ava Mitchell — May 2026" color="blue" />
      <StatCard label="PFA Referrals" value="0" sub="This season" color="green" />
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-4">Active Welfare Cases</h3>
      <div className="space-y-3">
        {[
          { player: 'Emily Zhang', category: 'ACL Risk', detail: 'Previous bilateral ACL (2023, 2024). 6-month screening protocol active. Next screening: 18 Apr.', severity: 'High', actions: 'Lumio Health monitoring, reduced sprint load, quarterly MRI' },
          { player: 'Charlotte Reed', category: 'Mental Health', detail: 'Weekly sessions with Dr. Alison Carey (performance psychologist). Progress positive.', severity: 'Medium', actions: 'Weekly check-in, welfare lead notified, PFA support offered' },
          { player: 'Ava Mitchell', category: 'Maternity', detail: 'Maternity leave commencing May 2026. Return plan: January 2027. Contract protected.', severity: 'Info', actions: 'Leave plan filed, salary protected, return-to-play programme scheduled' },
          { player: 'Sophie Turner', category: 'ACL Risk', detail: 'ACL reconstruction Dec 2024. Currently in final return-to-play phase.', severity: 'Medium', actions: 'Graduated return protocol, no competitive match until medical clearance' },
        ].map(c => (
          <div key={c.player} className={`rounded-lg p-4 border ${c.severity === 'High' ? 'border-red-600/30 bg-red-600/5' : c.severity === 'Medium' ? 'border-amber-600/30 bg-amber-600/5' : 'border-blue-600/30 bg-blue-600/5'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{c.player}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${c.severity === 'High' ? 'bg-red-600/20 text-red-400' : c.severity === 'Medium' ? 'bg-amber-600/20 text-amber-400' : 'bg-blue-600/20 text-blue-400'}`}>{c.category}</span>
              </div>
              <span className={`text-xs font-semibold ${c.severity === 'High' ? 'text-red-400' : c.severity === 'Medium' ? 'text-amber-400' : 'text-blue-400'}`}>{c.severity}</span>
            </div>
            <p className="text-xs text-gray-400 mb-2">{c.detail}</p>
            <p className="text-xs text-gray-500">Actions: {c.actions}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// ─── MORNING BRIEFING VIEW ────────────────────────────────────────────────────
const MorningBriefingView = ({ club }: { club: WomensClub }) => {
  const fmt = (n: number): string => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const fsrStatus = club.salarySpend === null ? null : club.salarySpend > 80 ? 'At Risk' : club.salarySpend > 70 ? 'Review' : 'Safe'
  const fsrColor = fsrStatus === 'Safe' ? 'green' : fsrStatus === 'Review' ? 'amber' : fsrStatus === 'At Risk' ? 'red' : 'green'

  if (club.tier === 'grassroots') {
    return (
      <div>
        <SectionHeader title={`Good morning, ${club.director}`} subtitle={today} icon="🌅" />
        <div className="bg-gradient-to-r from-green-900/30 to-teal-900/20 border border-green-600/30 rounded-xl p-5 mb-6">
          <div className="text-xs text-green-400 font-semibold uppercase tracking-wider mb-2">TODAY&apos;S BRIEFING — {club.name}</div>
          <div className="text-sm text-gray-300">Grassroots programme overview for {today}.</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard label="Training Tonight" value="7:00pm" sub="Rovers Park — 16 confirmed" color="green" />
          <StatCard label="Next Fixture" value="Sun 13 Apr" sub="vs Riverside Women (A)" color="blue" />
          <StatCard label="Welfare" value="0 flags" sub="All players cleared" color="green" />
        </div>
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">Today&apos;s Priorities</h3>
          <div className="space-y-2">
            {['Confirm training numbers — 3 players haven\'t responded', 'DBS renewal due: coach volunteer (expires 20 Apr)', 'Kit wash from Sunday\'s match — confirm collection', 'Outstanding subs: 4 players — automated reminders sent'].map((item: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-300"><span className="text-green-400 mt-0.5">●</span>{item}</div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader title={`Good morning, ${club.director}`} subtitle={today} icon="🌅" />

      {/* Gradient Banner */}
      <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/20 border border-pink-600/30 rounded-xl p-5 mb-6">
        <div className="text-xs text-pink-400 font-semibold uppercase tracking-wider mb-2">MORNING BRIEFING — {club.name}</div>
        <div className="text-sm text-gray-300">{club.league} · Match Week · {today}</div>
      </div>

      {/* FSR Status Card */}
      {fsrStatus && (
        <div className="mb-6">
          <div className={`bg-gradient-to-br ${fsrColor === 'green' ? 'from-green-600/20 to-green-900/10 border-green-600/20' : fsrColor === 'amber' ? 'from-amber-600/20 to-amber-900/10 border-amber-600/20' : 'from-red-600/20 to-red-900/10 border-red-600/20'} border rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-white">FSR Compliance</div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${fsrColor === 'green' ? 'bg-green-600/20 text-green-400' : fsrColor === 'amber' ? 'bg-amber-600/20 text-amber-400' : 'bg-red-600/20 text-red-400'}`}>{fsrStatus}</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{club.salarySpend}% <span className="text-sm font-normal text-gray-400">of permitted cap</span></div>
            {club.fsrHeadroom !== null && <div className="text-xs text-gray-400">{fmt(club.fsrHeadroom)} headroom remaining</div>}
          </div>
        </div>
      )}

      {/* Three Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><span className="text-sm">❤️</span><span className="text-xs font-semibold text-white">Squad Welfare</span></div>
          <p className="text-xs text-gray-400">1 player on maternity leave · 1 in return-to-play protocol · ACL screening overdue for 3 players</p>
        </div>
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><span className="text-sm">🤝</span><span className="text-xs font-semibold text-white">Sponsorship</span></div>
          <p className="text-xs text-gray-400">2 renewals due this month: {club.kitSponsor || 'Kit sponsor'} (kit, £85k) · NovaTech UK (sleeve, £40k)</p>
        </div>
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><span className="text-sm">📋</span><span className="text-xs font-semibold text-white">Compliance</span></div>
          <p className="text-xs text-gray-400">Dual registration: 1 temporary transfer expires Friday · Registration window closes in 8 days</p>
        </div>
      </div>

      {/* Board Pack Countdown */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-white">Board Pack Deadline</span>
          <span className="text-xs text-pink-400 font-semibold">11 days</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div className="h-2 rounded-full" style={{ width: '65%', backgroundColor: '#EC4899' }} />
        </div>
        <div className="text-xs text-gray-500 mt-1">65% complete — financials and welfare sections outstanding</div>
      </div>

      {/* Today's Priorities */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Today&apos;s Priorities</h3>
        <div className="space-y-2">
          {[
            'FSR bundled attribution review — Meridian Insurance deal requires women\'s share confirmation',
            `Chase ${club.kitSponsor || 'kit sponsor'} renewal — kit deal expires 30 days`,
            'ACL screening overdue — 3 high-risk players flagged to welfare lead',
            'Dual reg expiry — Emma Clarke temporary transfer to Harfield ends Friday',
            'Transfer window modelling — confirm budget impact of new signing on FSR headroom',
          ].map((item: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-pink-400 mt-0.5">●</span>{item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── CYCLE TRACKING VIEW ─────────────────────────────────────────────────────
const CycleTrackingView = () => {
  const squad = [
    { name: 'Emma Clarke', phase: 'Follicular', day: 8, loadTarget: 100, aclFlag: '', gpsLoad: 82, adjustment: 'None' },
    { name: 'Priya Nair', phase: 'Ovulatory', day: 14, loadTarget: 95, aclFlag: '⚠ Ligament laxity peak', gpsLoad: 77, adjustment: '-5% intensity' },
    { name: 'Emily Zhang', phase: 'Luteal', day: 21, loadTarget: 75, aclFlag: '🔴 ACL elevated (prev ACL + luteal)', gpsLoad: 91, adjustment: '-25% load cap' },
    { name: 'Charlotte Reed', phase: 'Menstrual', day: 2, loadTarget: 60, aclFlag: '', gpsLoad: 68, adjustment: 'Rest day recommended' },
    { name: 'Jade Osei', phase: 'Follicular', day: 10, loadTarget: 100, aclFlag: '', gpsLoad: 88, adjustment: 'None' },
    { name: 'Abbi Walsh', phase: 'Luteal', day: 19, loadTarget: 80, aclFlag: '⚠ Luteal phase', gpsLoad: 84, adjustment: '-20% intensity' },
    { name: 'Lucy Whitmore', phase: 'Ovulatory', day: 13, loadTarget: 95, aclFlag: '⚠ Ligament laxity peak', gpsLoad: 79, adjustment: '-5% intensity' },
    { name: 'Megan Hughes', phase: 'Follicular', day: 6, loadTarget: 100, aclFlag: '', gpsLoad: 71, adjustment: 'None' },
  ];
  const loadColor = (t: number) => t <= 75 ? 'text-red-400' : t <= 85 ? 'text-amber-400' : 'text-green-400';
  const flagBadge = (f: string) => {
    if (f.startsWith('🔴')) return <span className="text-[10px] px-2 py-0.5 rounded bg-red-600/20 text-red-400 font-medium">{f}</span>;
    if (f.startsWith('⚠')) return <span className="text-[10px] px-2 py-0.5 rounded bg-amber-600/20 text-amber-400 font-medium">{f}</span>;
    return <span className="text-gray-600">—</span>;
  };
  const phases = [
    { name: 'Menstrual', days: 'Days 1–5', desc: 'Low energy. Prioritise recovery, flexibility, technique. Reduced intensity.', color: 'border-red-600/30 bg-red-900/10' },
    { name: 'Follicular', days: 'Days 6–13', desc: 'Rising oestrogen. Peak strength and power window. Full load appropriate.', color: 'border-green-600/30 bg-green-900/10' },
    { name: 'Ovulatory', days: 'Days 13–15', desc: 'Ligament laxity increases. Reduce cutting/pivoting drills. ACL caution.', color: 'border-amber-600/30 bg-amber-900/10' },
    { name: 'Luteal', days: 'Days 16–28', desc: 'Fatigue, reduced reaction time. Lower intensity. Highest ACL risk window.', color: 'border-pink-600/30 bg-pink-900/10' },
  ];
  const adjustedPlayers = squad.filter(p => p.adjustment !== 'None');
  const composites = [
    { name: 'Emily Zhang', prevAcl: 40, cycle: 30, gps: 20, biomech: 8, total: 98, light: 'red' as const, action: 'Reduce to 60% load today. No cutting drills.' },
    { name: 'Priya Nair', prevAcl: 0, cycle: 30, gps: 15, biomech: 8, total: 53, light: 'amber' as const, action: 'Avoid sharp pivots. Monitor closely.' },
  ];
  const lightColor = (l: string) => l === 'red' ? 'bg-red-500' : l === 'amber' ? 'bg-amber-500' : 'bg-green-500';
  const lightBg = (l: string) => l === 'red' ? 'bg-red-600/10 border-red-600/30' : l === 'amber' ? 'bg-amber-600/10 border-amber-600/30' : 'bg-green-600/10 border-green-600/30';

  return (
    <div>
      <SectionHeader title="Cycle Tracking & GPS Integration" subtitle="Opt-in · Private · Role-gated to Medical and Welfare Lead only" icon="🌸" />
      <div className="bg-pink-600/10 border border-pink-600/30 rounded-xl p-4 mb-6 text-xs text-pink-300">
        🔒 All cycle data is opt-in, encrypted, and accessible only to the player, Club Doctor, and Welfare Lead. Never visible to coaching staff without player consent.
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Opt-in Rate', value: '14/22', sub: '64% of eligible squad', color: 'text-pink-400' },
          { label: 'High-Risk Phase Today', value: '3 players', sub: 'Luteal — reduced load', color: 'text-amber-400' },
          { label: 'ACL Flags Today', value: '2', sub: 'Cycle × GPS composite', color: 'text-red-400' },
          { label: 'Training Adjustments', value: '7', sub: 'Auto-applied today', color: 'text-teal-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#0D1117] border border-gray-800 rounded-xl p-4">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            <div className="text-[10px] text-gray-600 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
            <th className="text-left p-3">Player</th><th className="text-left p-3">Phase</th><th className="text-left p-3">Day</th><th className="text-left p-3">Load Target</th><th className="text-left p-3">ACL Flag</th><th className="text-left p-3">GPS Load</th><th className="text-left p-3">Adjustment</th>
          </tr></thead>
          <tbody>
            {squad.map((p, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="p-3 text-gray-200 font-medium">{p.name}</td>
                <td className="p-3 text-gray-400 text-xs">{p.phase}</td>
                <td className="p-3 text-gray-400 text-xs">{p.day}</td>
                <td className="p-3"><span className={`text-sm font-bold ${loadColor(p.loadTarget)}`}>{p.loadTarget}%</span></td>
                <td className="p-3">{flagBadge(p.aclFlag)}</td>
                <td className="p-3 text-gray-400 text-xs">{p.gpsLoad} AU</td>
                <td className="p-3 text-xs text-gray-300">{p.adjustment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">Phase Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {phases.map(p => (
            <div key={p.name} className={`border rounded-lg p-3 ${p.color}`}>
              <div className="text-sm font-bold text-white">{p.name} <span className="text-[10px] text-gray-400 font-normal ml-1">{p.days}</span></div>
              <div className="text-xs text-gray-300 mt-1">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">Auto-Generated Today&apos;s Training Adjustments</h3>
        <div className="space-y-2">
          {adjustedPlayers.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div>
                <div className="text-sm text-white font-medium">{p.name}</div>
                <div className="text-[10px] text-gray-500">{p.phase} · Day {p.day}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-amber-400 font-bold">{p.adjustment}</div>
                <div className="text-[10px] text-gray-500">{p.aclFlag || 'Phase-based adjustment'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">Cycle × ACL Composite Score</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {composites.map(c => (
            <div key={c.name} className={`border rounded-xl p-4 ${lightBg(c.light)}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full ${lightColor(c.light)} flex items-center justify-center text-lg`}>
                  {c.light === 'red' ? '🔴' : '🟡'}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{c.name}</div>
                  <div className="text-xs text-gray-400">Composite: {c.total}/100</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1 text-center text-[10px] mb-3">
                {[{l:'Prev ACL',v:c.prevAcl},{l:'Cycle',v:c.cycle},{l:'GPS',v:c.gps},{l:'Biomech',v:c.biomech}].map(s=>(
                  <div key={s.l} className="bg-[#0a0c14] rounded p-1.5">
                    <div className="text-gray-400">{s.l}</div>
                    <div className="text-white font-bold text-sm">{s.v}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-300">{c.action}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[10px] text-gray-600">Data source: Opt-in app (Lumio Cycle) · Lumio Health GPS integration · Updated 06:30 today</div>
    </div>
  );
};

// ─── ACL RISK MONITOR VIEW ────────────────────────────────────────────────────
const ACLRiskMonitorView = () => {
  const aclPlayers: Array<{name:string;pos:string;history:string;lastScreening:string;nextDue:string;overdue:boolean;risk:'High'|'Medium'|'Low'}> = [
    {name:'Emma Clarke',     pos:'CB',history:'Previous ACL (right, 2022)',lastScreening:'Oct 2024',nextDue:'Jan 2025',overdue:true, risk:'High'},
    {name:'Priya Nair',      pos:'CM',history:'None',                       lastScreening:'Jan 2025',nextDue:'Apr 2025',overdue:true, risk:'Medium'},
    {name:'Jade Osei',       pos:'ST',history:'None',                       lastScreening:'Feb 2025',nextDue:'May 2025',overdue:true, risk:'Medium'},
    {name:'Abbi Walsh',      pos:'RW',history:'Previous ACL (left, 2021)',  lastScreening:'Nov 2024',nextDue:'Feb 2025',overdue:true, risk:'High'},
    {name:'Charlotte Reed',  pos:'GK',history:'None',                       lastScreening:'Mar 2026',nextDue:'Jun 2026',overdue:false,risk:'Low'},
    {name:'Sophie Turner',   pos:'LB',history:'ACL reconstruction Dec 2024',lastScreening:'Mar 2026',nextDue:'Jun 2026',overdue:false,risk:'Low'},
    {name:'Fatima Al-Said',  pos:'AM',history:'None',                       lastScreening:'Mar 2026',nextDue:'Jun 2026',overdue:false,risk:'Low'},
    {name:'Megan Hughes',    pos:'DM',history:'None',                       lastScreening:'Mar 2026',nextDue:'Jun 2026',overdue:false,risk:'Low'},
    {name:'Sophie Lawson',   pos:'RB',history:'None',                       lastScreening:'Feb 2026',nextDue:'May 2026',overdue:false,risk:'Low'},
    {name:'Tilly Brooks',    pos:'LW',history:'None',                       lastScreening:'Feb 2026',nextDue:'May 2026',overdue:false,risk:'Low'},
  ]
  const overdueCount = aclPlayers.filter(p => p.overdue).length
  // Demo screening scheduler — next 6 weeks
  const scheduler: Array<{date:string;day:string;player:string;type:string}> = [
    {date:'10 Apr',day:'Wed',player:'Emma Clarke',  type:'Catch-up screening'},
    {date:'11 Apr',day:'Thu',player:'Abbi Walsh',   type:'Catch-up screening'},
    {date:'14 Apr',day:'Mon',player:'Priya Nair',   type:'Catch-up screening'},
    {date:'17 Apr',day:'Thu',player:'Jade Osei',    type:'Catch-up screening'},
    {date:'24 Apr',day:'Thu',player:'Sophie Turner',type:'RTP follow-up'},
    {date:'02 May',day:'Fri',player:'Charlotte Reed',type:'Routine'},
  ]
  return (
    <div>
      <SectionHeader title="ACL Risk Monitor" subtitle="Women face ACL injury rates 3–6× higher than men. Active monitoring is mandated under Karen Carney Review standards." icon="🦵" />

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-1">ACL Composite Risk Score — Daily Traffic Light</h3>
        <p className="text-xs text-gray-500 mb-4">Previous ACL (40%) + Cycle Phase (30%) + GPS Load (20%) + Biomechanical (10%)</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          {[
            { name: 'Emily Zhang', pos: 'CM', prevAcl: 40, cycle: 30, gps: 20, biomech: 8, total: 98, light: 'red' as const, action: 'Reduce to 60% load today. No cutting drills.' },
            { name: 'Priya Nair', pos: 'FW', prevAcl: 0, cycle: 30, gps: 15, biomech: 8, total: 53, light: 'amber' as const, action: 'Avoid sharp pivots. Monitor closely.' },
            { name: 'Sophie Turner', pos: 'CB', prevAcl: 40, cycle: 0, gps: 5, biomech: 12, total: 57, light: 'amber' as const, action: 'Continue RTP Phase 3 protocol.' },
            { name: 'Jade Osei', pos: 'LB', prevAcl: 0, cycle: 0, gps: 10, biomech: 5, total: 15, light: 'green' as const, action: 'Full training cleared.' },
            { name: 'Emma Clarke', pos: 'GK', prevAcl: 0, cycle: 0, gps: 12, biomech: 6, total: 18, light: 'green' as const, action: 'Full training cleared.' },
          ].map(p => (
            <div key={p.name} className={`border rounded-xl p-3 ${p.light === 'red' ? 'bg-red-600/10 border-red-600/30' : p.light === 'amber' ? 'bg-amber-600/10 border-amber-600/30' : 'bg-green-600/10 border-green-600/30'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${p.light === 'red' ? 'bg-red-500' : p.light === 'amber' ? 'bg-amber-500' : 'bg-green-500'}`}>
                  {p.light === 'red' ? '🔴' : p.light === 'amber' ? '🟡' : '🟢'}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{p.name}</div>
                  <div className="text-[10px] text-gray-500">{p.pos}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[9px] mb-2">
                {[{l:'Prev ACL',v:p.prevAcl},{l:'Cycle',v:p.cycle},{l:'GPS',v:p.gps},{l:'Biomech',v:p.biomech}].map(s=>(
                  <div key={s.l} className="bg-[#0a0c14] rounded px-1.5 py-1 text-center">
                    <span className="text-gray-500">{s.l}: </span><span className="text-white font-bold">{s.v}</span>
                  </div>
                ))}
              </div>
              <div className={`text-[10px] font-bold mb-1 ${p.light === 'red' ? 'text-red-400' : p.light === 'amber' ? 'text-amber-400' : 'text-green-400'}`}>Score: {p.total}/100</div>
              <div className="text-[10px] text-gray-400">{p.action}</div>
            </div>
          ))}
        </div>
        <div className="bg-amber-600/10 border border-amber-600/30 rounded-lg p-3 text-xs text-amber-400">
          Composite score is updated daily at 06:30 using GPS data from Lumio Health, cycle phase from opt-in Lumio Cycle app, and biomechanical assessments from the last 30 days.
        </div>
      </div>

      <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-3 mb-6 text-xs text-red-400 font-medium">⚠ {overdueCount} players have overdue ACL screenings — welfare lead notified</div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
            <th className="text-left p-3">Player</th><th className="text-left p-3">Position</th><th className="text-left p-3">ACL History</th><th className="text-left p-3">Last Screening</th><th className="text-left p-3">Next Due</th><th className="text-left p-3">Risk</th>
          </tr></thead>
          <tbody>
            {aclPlayers.map((p, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="p-3 text-gray-200 font-medium">{p.name}</td>
                <td className="p-3 text-gray-400">{p.pos}</td>
                <td className="p-3 text-gray-400 text-xs">{p.history}</td>
                <td className="p-3 text-gray-400 text-xs">{p.lastScreening}</td>
                <td className="p-3 text-xs">
                  <div className={p.overdue ? 'text-gray-400' : 'text-gray-400'}>{p.nextDue}</div>
                  {p.overdue && <div className="text-[10px] font-bold text-red-400 mt-0.5">OVERDUE</div>}
                </td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${p.risk === 'High' ? 'bg-red-600/20 text-red-400' : p.risk === 'Medium' ? 'bg-amber-600/20 text-amber-400' : 'bg-green-600/20 text-green-400'}`}>{p.risk}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">Return-to-Play Tracker</h3>
        <div className="space-y-2">
          {[{phase:'1. Rest',done:true},{phase:'2. Rehab',done:true},{phase:'3. Non-contact',done:true},{phase:'4. Contact',done:false},{phase:'5. Match cleared',done:false}].map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs"><span className={s.done ? 'text-green-400' : 'text-gray-600'}>{s.done ? '✓' : '○'}</span><span className={s.done ? 'text-gray-400 line-through' : 'text-gray-300'}>{s.phase}</span></div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-2">Sophie Turner — ACL reconstruction Dec 2024 — Phase 3 (non-contact)</div>
      </div>

      {/* Screening scheduler — next 6 weeks */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">📅 Screening Scheduler — Next 6 weeks</h3>
          <span className="text-[10px] text-gray-500">{scheduler.length} appointments</span>
        </div>
        <div className="space-y-2">
          {scheduler.map((s, i) => {
            const isCatchup = s.type === 'Catch-up screening'
            return (
              <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-[#0a0c14] border border-gray-800/50">
                <div className="text-center w-12 flex-shrink-0">
                  <div className="text-[10px] font-bold text-gray-500 uppercase">{s.day}</div>
                  <div className={`text-sm font-bold ${isCatchup ? 'text-red-400' : 'text-gray-200'}`}>{s.date}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200">{s.player}</div>
                  <div className="text-[10px] text-gray-500">{s.type}</div>
                </div>
                {isCatchup && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 flex-shrink-0">CATCH-UP</span>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="text-xs text-gray-500">→ Link to Medical Records for full player history</div>
    </div>
  )
}

// ─── MATERNITY TRACKER VIEW ───────────────────────────────────────────────────
const MaternityTrackerView = () => (
  <div>
    <SectionHeader title="Maternity Tracker" subtitle="Karen Carney Review Compliance" icon="👶" />
    <div className="bg-pink-600/10 border border-pink-600/30 rounded-xl p-4 mb-6">
      <p className="text-xs text-pink-300"><strong>WSL Policy:</strong> 26 weeks full pay, statutory rights protected, dedicated return-to-play programme, no selection pressure during recovery.</p>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden mb-6">
      <table className="w-full text-sm">
        <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
          <th className="text-left p-3">Player</th><th className="text-left p-3">Leave Start</th><th className="text-left p-3">Expected Return</th><th className="text-left p-3">Weeks Remaining</th><th className="text-left p-3">Status</th>
        </tr></thead>
        <tbody>
          <tr className="border-b border-gray-800/50">
            <td className="p-3 text-gray-200 font-medium">Sophie Lawson</td>
            <td className="p-3 text-gray-400 text-xs">14 Jan 2025</td>
            <td className="p-3 text-gray-400 text-xs">Sep 2025</td>
            <td className="p-3 text-gray-400 text-xs">22</td>
            <td className="p-3"><span className="text-xs px-2 py-0.5 rounded bg-pink-600/20 text-pink-400">On Leave</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-3">Return-to-Play Protocol (Post-Maternity)</h3>
      <div className="space-y-2">
        {['1. Medical clearance','2. Fitness baseline assessment','3. Light training (non-contact)','4. Full training','5. Match selection available','6. Fully returned'].map((phase: string, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs"><span className="text-gray-600">○</span><span className="text-gray-300">{phase}</span></div>
        ))}
      </div>
      <div className="text-xs text-gray-500 mt-2">Sophie Lawson — not yet started (on leave)</div>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-3">Contractual Rights Log</h3>
      <div className="space-y-2">
        {[{right:'Full pay maintained (26 weeks)',actioned:true},{right:'Role protection on return',actioned:true},{right:'Training access on return',actioned:true},{right:'No selection pressure during recovery',actioned:true},{right:'PFA support offered',actioned:true}].map((r: {right:string;actioned:boolean}, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs"><span className={r.actioned ? 'text-green-400' : 'text-red-400'}>{r.actioned ? '✓' : '✗'}</span><span className="text-gray-300">{r.right}</span></div>
        ))}
      </div>
    </div>
    <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 mb-4 text-xs text-amber-400">🔒 This record is restricted to Welfare Lead, Club Doctor, and Club Director only.</div>
    <button className="px-4 py-2 rounded-lg text-xs font-medium bg-pink-600/20 text-pink-400 border border-pink-600/30">PFA Referral Workflow →</button>
  </div>
)

// ─── MENTAL HEALTH VIEW ───────────────────────────────────────────────────────
const MentalHealthView = () => (
  <div>
    <SectionHeader title="Mental Health & Wellbeing" subtitle="Karen Carney Review Standards" icon="🧠" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Squad Size" value="24" color="pink" />
      <StatCard label="Check-ins (month)" value="18" sub="Of 24 players" color="teal" />
      <StatCard label="Flags Raised" value="1" sub="Performance anxiety" color="amber" />
      <StatCard label="Referrals Made" value="0" sub="This season" color="green" />
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden mb-6">
      <div className="p-4 border-b border-gray-800"><h3 className="text-sm font-bold text-white">Monthly Check-In Log</h3></div>
      <table className="w-full text-sm">
        <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
          <th className="text-left p-3">Player</th><th className="text-left p-3">Date</th><th className="text-left p-3">Score</th><th className="text-left p-3">Flags</th><th className="text-left p-3">Follow-up</th>
        </tr></thead>
        <tbody>
          {[
            {player:'Emma Clarke',date:'2 Apr',score:8,flag:'—',followup:'No'},
            {player:'Priya Nair',date:'2 Apr',score:7,flag:'—',followup:'No'},
            {player:'Charlotte Reed',date:'1 Apr',score:6,flag:'Performance anxiety — pre-match',followup:'Yes'},
            {player:'Jade Osei',date:'28 Mar',score:9,flag:'—',followup:'No'},
            {player:'Abbi Walsh',date:'28 Mar',score:7,flag:'—',followup:'No'},
          ].map((r: {player:string;date:string;score:number;flag:string;followup:string}, i: number) => (
            <tr key={i} className="border-b border-gray-800/50">
              <td className="p-3 text-gray-200">{r.player}</td>
              <td className="p-3 text-gray-400 text-xs">{r.date}</td>
              <td className="p-3"><span className={`text-sm font-bold ${r.score >= 7 ? 'text-green-400' : r.score >= 5 ? 'text-amber-400' : 'text-red-400'}`}>{r.score}/10</span></td>
              <td className={`p-3 text-xs ${r.flag !== '—' ? 'text-amber-400' : 'text-gray-500'}`}>{r.flag}</td>
              <td className="p-3"><span className={`text-xs ${r.followup === 'Yes' ? 'text-amber-400 font-medium' : 'text-gray-500'}`}>{r.followup}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-3">Support Services</h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          {name:'Dr Anna Reid',role:'Performance Psychologist',type:'In-house'},
          {name:'PFA Wellbeing Service',role:'Player support',type:'External'},
          {name:'Mind Charity',role:'Referral pathway',type:'External'},
          {name:'EFL Heads Up',role:'Mental health programme',type:'External'},
        ].map((s: {name:string;role:string;type:string}, i: number) => (
          <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
            <div className="text-xs text-white font-medium">{s.name}</div>
            <div className="text-[10px] text-gray-500">{s.role} · {s.type}</div>
          </div>
        ))}
      </div>
    </div>
    {/* Seasonal workload vs wellbeing chart */}
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">Seasonal Workload vs Wellbeing</h3>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 inline-block" style={{ backgroundColor: '#EC4899' }} /><span className="text-gray-400">Workload</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 inline-block" style={{ backgroundColor: '#0D9488' }} /><span className="text-gray-400">Wellbeing</span></span>
        </div>
      </div>
      {(() => {
        const months = ['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May']
        const workload = [40, 55, 65, 70, 60, 50, 65, 78, 85, 75]
        const wellbeing = [8.4, 8.1, 7.8, 7.5, 7.9, 8.2, 7.6, 7.0, 6.6, 6.9]
        const W = 600, H = 180, padL = 32, padR = 12, padT = 16, padB = 28
        const innerW = W - padL - padR
        const innerH = H - padT - padB
        const stepX = innerW / (months.length - 1)
        // Workload axis 0..100, Wellbeing axis 0..10
        const wlPath = workload.map((v, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * stepX} ${padT + innerH - (v / 100) * innerH}`).join(' ')
        const wbPath = wellbeing.map((v, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * stepX} ${padT + innerH - (v / 10) * innerH}`).join(' ')
        return (
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Seasonal workload vs wellbeing line chart">
            {/* Y gridlines (4 lines) */}
            {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
              <line key={i} x1={padL} x2={W - padR} y1={padT + innerH - t * innerH} y2={padT + innerH - t * innerH} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            ))}
            {/* Y axis labels — workload (left, pink) */}
            {[0, 25, 50, 75, 100].map((v, i) => (
              <text key={i} x={padL - 6} y={padT + innerH - (v / 100) * innerH + 3} fontSize="9" fill="#9CA3AF" textAnchor="end">{v}</text>
            ))}
            {/* X axis labels */}
            {months.map((m, i) => (
              <text key={m} x={padL + i * stepX} y={H - 8} fontSize="9" fill="#6B7280" textAnchor="middle">{m}</text>
            ))}
            {/* Workload line + dots */}
            <path d={wlPath} fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {workload.map((v, i) => (
              <circle key={`w${i}`} cx={padL + i * stepX} cy={padT + innerH - (v / 100) * innerH} r="2.5" fill="#EC4899" />
            ))}
            {/* Wellbeing line + dots */}
            <path d={wbPath} fill="none" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {wellbeing.map((v, i) => (
              <circle key={`b${i}`} cx={padL + i * stepX} cy={padT + innerH - (v / 10) * innerH} r="2.5" fill="#0D9488" />
            ))}
          </svg>
        )
      })()}
      <p className="text-[11px] text-gray-500 mt-2">Inverse correlation noted in Mar–Apr — workload spike of 78–85 hrs/wk coincides with average wellbeing dropping from 7.6 to 6.6. Welfare lead reviewed at last staff meeting.</p>
    </div>

    <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 mb-4 text-xs text-amber-400">🔒 Mental health records are strictly confidential — role-based access only.</div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-bold text-white mb-3">WSL Minimum Standards (Karen Carney Review)</h3>
      <div className="space-y-2">
        {['Licensed performance psychologist available to squad','Monthly wellbeing check-ins for all players','Confidential reporting pathway documented','PFA referral process in place','Mental health first aider on staff','Pre-match anxiety support protocol'].map((item: string, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs"><span className="text-green-400">✓</span><span className="text-gray-300">{item}</span></div>
        ))}
      </div>
    </div>
  </div>
)

// ─── MEDICAL RECORDS VIEW ─────────────────────────────────────────────────────
const MedicalRecordsView = () => (
  <div>
    <SectionHeader title="Medical Records" subtitle="Role-gated access — Club Doctor and Welfare Lead only" icon="🏥" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-[#0D1117] border border-pink-600/30 rounded-xl p-4 cursor-pointer hover:border-pink-500/50 transition-colors">
        <div className="text-sm font-bold text-white mb-1">🦵 ACL Risk Monitor</div>
        <div className="text-xs text-gray-400">4 players with overdue screenings</div>
      </div>
      <div className="bg-[#0D1117] border border-pink-600/30 rounded-xl p-4 cursor-pointer hover:border-pink-500/50 transition-colors">
        <div className="text-sm font-bold text-white mb-1">👶 Maternity Tracker</div>
        <div className="text-xs text-gray-400">1 player on maternity leave</div>
      </div>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden mb-6">
      <div className="p-4 border-b border-gray-800"><h3 className="text-sm font-bold text-white">Squad Medical Summary</h3></div>
      <table className="w-full text-sm">
        <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
          <th className="text-left p-3">Player</th><th className="text-left p-3">Injuries (Season)</th><th className="text-left p-3">Status</th><th className="text-left p-3">Physio Notes</th>
        </tr></thead>
        <tbody>
          {[
            {player:'Emma Clarke',injuries:0,status:'Fit',notes:'ACL screening overdue — schedule this week'},
            {player:'Sophie Turner',injuries:1,status:'RTP Phase 3',notes:'ACL reconstruction Dec 2024 — progressing well'},
            {player:'Ava Mitchell',injuries:0,status:'Fit (maternity May)',notes:'Pre-leave medical complete'},
            {player:'Charlotte Reed',injuries:0,status:'Fit',notes:'Mental health support active — no physical concerns'},
            {player:'Priya Nair',injuries:1,status:'Fit',notes:'Minor ankle — resolved. ACL screening due.'},
          ].map((r: {player:string;injuries:number;status:string;notes:string}, i: number) => (
            <tr key={i} className="border-b border-gray-800/50">
              <td className="p-3 text-gray-200">{r.player}</td>
              <td className="p-3 text-gray-400">{r.injuries}</td>
              <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${r.status === 'Fit' || r.status.includes('Fit') ? 'bg-green-600/20 text-green-400' : 'bg-amber-600/20 text-amber-400'}`}>{r.status}</span></td>
              <td className="p-3 text-gray-400 text-xs">{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {/* Current injury list */}
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden mb-6">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Current Injury List</h3>
        <span className="text-[10px] text-gray-500">3 active</span>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
          <th className="text-left p-3">Player</th><th className="text-left p-3">Injury</th><th className="text-left p-3">Severity</th><th className="text-left p-3">Date Sustained</th><th className="text-left p-3">Expected Return</th>
        </tr></thead>
        <tbody>
          {[
            {player:'Sophie Turner',injury:'ACL reconstruction (right knee)',severity:'Severe', sustained:'12 Dec 2024',ret:'Aug 2026'},
            {player:'Megan Hughes', injury:'Grade 2 hamstring strain',         severity:'Moderate',sustained:'24 Mar 2026',ret:'May 2026'},
            {player:'Tilly Brooks', injury:'Mild concussion',                   severity:'Minor',   sustained:'30 Mar 2026',ret:'14 Apr 2026'},
          ].map((r, i) => {
            const sevColor = r.severity === 'Severe' ? 'bg-red-600/20 text-red-400' : r.severity === 'Moderate' ? 'bg-amber-600/20 text-amber-400' : 'bg-green-600/20 text-green-400'
            return (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="p-3 text-gray-200 font-medium">{r.player}</td>
                <td className="p-3 text-gray-300 text-xs">{r.injury}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${sevColor}`}>{r.severity}</span></td>
                <td className="p-3 text-gray-400 text-xs">{r.sustained}</td>
                <td className="p-3 text-gray-400 text-xs">{r.ret}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>

    <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 mb-4 text-xs text-amber-400">🔒 GDPR: Medical records are strictly role-gated. Access restricted to Club Doctor, Welfare Lead, and Club Director.</div>
    <button disabled className="px-4 py-2 rounded-lg text-xs font-medium bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed">Export for WSL Football & Insurance — Phase 2</button>
  </div>
)

// ─── SALARY COMPLIANCE VIEW ──────────────────────────────────────────────────
const SalaryComplianceView = () => {
  const [newSalary, setNewSalary] = useState(0)
  const players: Array<{name:string;pos:string;salary:number;flag:boolean}> = [
    {name:'Emma Clarke',pos:'CB',salary:62000,flag:false},
    {name:'Priya Nair',pos:'CM',salary:58000,flag:false},
    {name:'Jade Osei',pos:'ST',salary:71000,flag:false},
    {name:'Abbi Walsh',pos:'RW',salary:54000,flag:false},
    {name:'Charlotte Reed',pos:'GK',salary:48000,flag:false},
    {name:'Sophie Turner',pos:'LB',salary:45000,flag:false},
    {name:'Fatima Al-Said',pos:'AM',salary:67000,flag:false},
    {name:'Megan Hughes',pos:'DM',salary:52000,flag:false},
    {name:'Sophie Lawson',pos:'RB',salary:46000,flag:false},
    {name:'Tilly Brooks',pos:'LW',salary:35000,flag:true},
  ]
  const totalSalary = players.reduce((sum: number, p: typeof players[0]) => sum + p.salary, 0)
  const cap = 2560000
  const headroom = cap - totalSalary - newSalary
  const fmt = (n: number): string => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)

  return (
    <div>
      <SectionHeader title="Salary Compliance" subtitle="FSR salary cap monitoring — 80% of Relevant Revenue" icon="💰" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Salary Spend" value={fmt(totalSalary)} sub="10 registered players" color="pink" />
        <StatCard label="FSR Cap (80%)" value={fmt(cap)} sub="Of £3.2M relevant revenue" color="blue" />
        <StatCard label="Headroom" value={fmt(headroom)} sub={newSalary > 0 ? 'After modelled signing' : 'Before new signings'} color={headroom > 100000 ? 'green' : headroom > 0 ? 'amber' : 'red'} />
        <StatCard label="Flags" value="1" sub="Tilly Brooks below £40k min" color="red" />
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
            <th className="text-left p-3">Player</th><th className="text-left p-3">Position</th><th className="text-right p-3">Annual Salary</th><th className="text-left p-3">Status</th>
          </tr></thead>
          <tbody>
            {players.map((p: typeof players[0], i: number) => (
              <tr key={i} className={`border-b border-gray-800/50 ${p.flag ? 'bg-red-600/5' : ''}`}>
                <td className="p-3 text-gray-200 font-medium">{p.name}</td>
                <td className="p-3 text-gray-400">{p.pos}</td>
                <td className="p-3 text-right text-gray-200">{fmt(p.salary)}</td>
                <td className="p-3">
                  {p.flag
                    ? <span className="text-xs px-2 py-0.5 rounded bg-red-600/20 text-red-400">Below £40k minimum</span>
                    : <span className="text-xs px-2 py-0.5 rounded bg-green-600/20 text-green-400">Compliant</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">New Signing Salary Modeller</h3>
        <p className="text-xs text-gray-400 mb-3">Enter a proposed salary to see the impact on FSR headroom.</p>
        <div className="flex items-center gap-4 mb-3">
          <input
            type="number"
            value={newSalary || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSalary(Number(e.target.value))}
            placeholder="e.g. 55000"
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-48 focus:outline-none focus:border-pink-500"
          />
          <span className="text-xs text-gray-400">Annual salary (£)</span>
        </div>
        {newSalary > 0 && (
          <div className={`rounded-lg p-3 border ${headroom > 0 ? 'border-green-600/30 bg-green-600/5' : 'border-red-600/30 bg-red-600/5'}`}>
            <div className="text-sm font-semibold text-white mb-1">Updated headroom: {fmt(headroom)}</div>
            <div className={`text-xs ${headroom > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {headroom > 0 ? 'Signing is within FSR cap.' : 'WARNING: This signing would breach the FSR salary cap.'}
            </div>
          </div>
        )}
      </div>
      <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 text-xs text-amber-400">
        ⚠ Tilly Brooks (£35,000) is below the recommended £40,000 WSL minimum salary. Review required.
      </div>
    </div>
  )
}

// ─── REVENUE ATTRIBUTION VIEW ────────────────────────────────────────────────
const RevenueAttributionView = () => {
  const categories: Array<{name:string;value:number;pct:number;color:string}> = [
    {name:'Matchday Revenue',value:420000,pct:18,color:'#EC4899'},
    {name:'Commercial (Women-attributed)',value:680000,pct:30,color:'#8B5CF6'},
    {name:'Broadcast (WSL Allocation)',value:520000,pct:23,color:'#3B82F6'},
    {name:'Prize Money & FA Distributions',value:280000,pct:12,color:'#22C55E'},
    {name:'Sponsorship (Standalone)',value:310000,pct:13,color:'#F59E0B'},
    {name:'Other Income',value:90000,pct:4,color:'#6B7280'},
  ]
  const totalRevenue = 2300000
  const fmt = (n: number): string => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)

  return (
    <div>
      <SectionHeader title="Revenue Attribution" subtitle="Women-only Relevant Revenue for FSR compliance" icon="📈" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Relevant Revenue" value="£2.3M" sub="6 categories" color="pink" />
        <StatCard label="YoY Growth" value="+12%" sub="vs 2024/25 season" color="green" />
        <StatCard label="Permitted Spend (80%)" value="£1.84M" sub="FSR salary cap" color="blue" />
        <StatCard label="Bundled Flags" value="1" sub="Meridian Insurance" color="amber" />
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-4">Revenue Breakdown</h3>
        <div className="space-y-3">
          {categories.map((c: typeof categories[0]) => (
            <div key={c.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">{c.name}</span>
                <span className="text-sm font-semibold text-white">{fmt(c.value)}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div className="h-1.5 rounded-full" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
          <span className="text-sm font-bold text-white">Total</span>
          <span className="text-sm font-bold text-pink-400">{fmt(totalRevenue)}</span>
        </div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">Bundled Deal Attribution</h3>
        <p className="text-xs text-gray-400 mb-3">Sponsors shared with men&apos;s parent club must show women&apos;s share separately.</p>
        <div className="space-y-2">
          {[
            {sponsor:'Kestrel Finance (Kit)',total:'£420k',womens:'£420k',pct:'100%',flag:false},
            {sponsor:'Meridian Insurance (Shared)',total:'£800k',womens:'£95k',pct:'11.9%',flag:true},
            {sponsor:'NovaTech UK (Sleeve)',total:'£40k',womens:'£40k',pct:'100%',flag:false},
          ].map((s: {sponsor:string;total:string;womens:string;pct:string;flag:boolean}) => (
            <div key={s.sponsor} className={`flex items-center justify-between py-2 border-b border-gray-800 ${s.flag ? 'bg-amber-600/5 rounded px-2' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-300">{s.sponsor}</span>
                {s.flag && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-600/20 text-amber-400">Review</span>}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">Total: {s.total}</span>
                <span className="text-xs text-pink-400 font-semibold">Women&apos;s: {s.womens} ({s.pct})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">Season Comparison</h3>
        <div className="space-y-3">
          {[
            {season:'2024/25',value:2050000,bar:89},
            {season:'2025/26',value:2300000,bar:100},
          ].map((s: {season:string;value:number;bar:number}) => (
            <div key={s.season}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">{s.season}</span>
                <span className="text-sm font-semibold text-white">{fmt(s.value)}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="h-2 rounded-full bg-pink-500" style={{ width: `${s.bar}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Permitted Spend Calculation</h3>
        <div className="space-y-2">
          {[
            {label:'Total Relevant Revenue',value:'£2,300,000'},
            {label:'FSR Cap (80%)',value:'£1,840,000'},
            {label:'Current Salary Spend',value:'£1,538,000'},
            {label:'Remaining Headroom',value:'£302,000'},
          ].map((r: {label:string;value:string}) => (
            <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-gray-800">
              <span className="text-xs text-gray-400">{r.label}</span>
              <span className="text-sm font-semibold text-white">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SQUAD MANAGEMENT VIEW ───────────────────────────────────────────────────
const SquadManagementView = ({ club }: { club: WomensClub }) => {
  type Employment = 'Full-time' | 'Part-time'
  type DualReg = 'None' | 'On loan' | 'Hosting'
  type Welfare = 'Available' | 'Maternity' | 'RTP' | 'ITC Pending'
  const players: Array<{
    name: string; pos: string; employment: Employment; dualReg: DualReg; dualRegNote?: string;
    ageBand: string; nationality: string; international: boolean; contract: string; welfare: Welfare;
  }> = [
    {name:'Emma Clarke',    pos:'CB',employment:'Full-time',dualReg:'On loan',dualRegNote:'Harfield Women',ageBand:'Senior (24+)',nationality:'🇬🇧 England',international:false,contract:'Jun 2027',welfare:'Available'},
    {name:'Priya Nair',     pos:'CM',employment:'Full-time',dualReg:'None',                                 ageBand:'Senior (24+)',nationality:'🇬🇧 England',international:false,contract:'Jun 2026',welfare:'Available'},
    {name:'Jade Osei',      pos:'ST',employment:'Full-time',dualReg:'None',                                 ageBand:'U24',         nationality:'🇬🇧 England',international:false,contract:'Jun 2028',welfare:'Available'},
    {name:'Abbi Walsh',     pos:'RW',employment:'Full-time',dualReg:'None',                                 ageBand:'Senior (24+)',nationality:'🇬🇧 England',international:false,contract:'Jun 2026',welfare:'Available'},
    {name:'Charlotte Reed', pos:'GK',employment:'Full-time',dualReg:'None',                                 ageBand:'Senior (24+)',nationality:'🇬🇧 England',international:false,contract:'Jun 2027',welfare:'Available'},
    {name:'Sophie Turner',  pos:'LB',employment:'Full-time',dualReg:'None',                                 ageBand:'U24',         nationality:'🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland',international:false,contract:'Jun 2027',welfare:'RTP'},
    {name:'Fatima Al-Said', pos:'AM',employment:'Full-time',dualReg:'None',                                 ageBand:'U24',         nationality:'🇪🇬 Egypt',  international:true, contract:'Jun 2028',welfare:'ITC Pending'},
    {name:'Megan Hughes',   pos:'DM',employment:'Full-time',dualReg:'None',                                 ageBand:'Senior (24+)',nationality:'🏴󠁧󠁢󠁷󠁬󠁳󠁿 Wales', international:false,contract:'Jun 2026',welfare:'Available'},
    {name:'Sophie Lawson',  pos:'RB',employment:'Full-time',dualReg:'None',                                 ageBand:'Senior (24+)',nationality:'🇬🇧 England',international:false,contract:'Jun 2027',welfare:'Maternity'},
    {name:'Tilly Brooks',   pos:'LW',employment:'Part-time',dualReg:'None',                                 ageBand:'U24',         nationality:'🇮🇪 Ireland',international:true, contract:'Jun 2028',welfare:'Available'},
  ]

  const [filter, setFilter] = useState<'all' | 'fulltime' | 'parttime' | 'dualreg' | 'leave' | 'international'>('all')
  const filtered = players.filter(p => {
    if (filter === 'all') return true
    if (filter === 'fulltime') return p.employment === 'Full-time'
    if (filter === 'parttime') return p.employment === 'Part-time'
    if (filter === 'dualreg') return p.dualReg !== 'None'
    if (filter === 'leave') return p.welfare === 'Maternity' || p.welfare === 'RTP'
    if (filter === 'international') return p.international
    return true
  })

  const totalCount = players.length
  const fullTimeCount = players.filter(p => p.employment === 'Full-time').length
  const partTimeCount = players.filter(p => p.employment === 'Part-time').length
  const dualRegCount = players.filter(p => p.dualReg !== 'None').length
  const onLeaveCount = players.filter(p => p.welfare === 'Maternity' || p.welfare === 'RTP').length

  const welfareBadge = (w: Welfare): { label: string; cls: string } => {
    if (w === 'Available') return { label: 'Available', cls: 'bg-green-600/20 text-green-400' }
    if (w === 'Maternity') return { label: 'Maternity', cls: 'bg-pink-600/20 text-pink-400' }
    if (w === 'RTP')       return { label: 'RTP',       cls: 'bg-amber-600/20 text-amber-400' }
    return { label: 'ITC Pending', cls: 'bg-amber-600/20 text-amber-400' }
  }

  const filters: Array<{ id: typeof filter; label: string }> = [
    { id: 'all',           label: 'All' },
    { id: 'fulltime',      label: 'Full-time' },
    { id: 'parttime',      label: 'Part-time' },
    { id: 'dualreg',       label: 'Dual Reg' },
    { id: 'leave',         label: 'On Leave' },
    { id: 'international', label: 'International' },
  ]

  return (
    <div>
      <SectionHeader title={`Squad Management — ${club.name}`} subtitle="WSL registered squad — 2025/26 season" icon="👥" />

      {/* 5-card stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total"           value={totalCount}    sub="Registered players"  color="pink" />
        <StatCard label="Full-Time"       value={fullTimeCount} sub="Full contracts"      color="teal" />
        <StatCard label="Part-Time"       value={partTimeCount} sub="Part-time contracts" color="blue" />
        <StatCard label="Dual Registered" value={dualRegCount}  sub="On loan / hosting"   color="purple" />
        <StatCard label="On Leave"        value={onLeaveCount}  sub="Maternity / RTP"     color="amber" />
      </div>

      {/* Filter bar + Add/Export buttons */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.id ? 'bg-pink-600/20 text-pink-400 border border-pink-600/30' : 'bg-gray-800/50 text-gray-400 border border-gray-800 hover:text-white'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button disabled className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed">+ Add Player</button>
          <button disabled className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed">⬇ Export</button>
        </div>
      </div>

      {/* Player table — 8 columns */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
            <th className="text-left p-3">Player</th>
            <th className="text-left p-3">Position</th>
            <th className="text-left p-3">Employment</th>
            <th className="text-left p-3">Dual Reg</th>
            <th className="text-left p-3">Age Band</th>
            <th className="text-left p-3">Nationality</th>
            <th className="text-left p-3">Contract End</th>
            <th className="text-left p-3">Welfare</th>
          </tr></thead>
          <tbody>
            {filtered.map(p => {
              const wb = welfareBadge(p.welfare)
              return (
                <tr key={p.name} className="border-b border-gray-800/50">
                  <td className="p-3 text-gray-200 font-medium">{p.name}</td>
                  <td className="p-3 text-gray-400">{p.pos}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${p.employment === 'Full-time' ? 'bg-teal-600/20 text-teal-400' : 'bg-blue-600/20 text-blue-400'}`}>{p.employment}</span>
                  </td>
                  <td className="p-3 text-xs">
                    {p.dualReg === 'None'
                      ? <span className="text-gray-600">—</span>
                      : (
                        <div className="flex flex-col">
                          <span className="text-purple-400 font-semibold">{p.dualReg}</span>
                          {p.dualRegNote && <span className="text-[10px] text-gray-500">{p.dualRegNote}</span>}
                        </div>
                      )
                    }
                  </td>
                  <td className="p-3 text-gray-400 text-xs">{p.ageBand}</td>
                  <td className="p-3 text-gray-300 text-xs">{p.nationality}</td>
                  <td className="p-3 text-gray-400 text-xs">{p.contract}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${wb.cls}`}>{wb.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 text-xs text-amber-400">
        ⚠ Fatima Al-Said — ITC (International Transfer Certificate) pending. Cannot be registered until clearance received from FIFA TMS.
      </div>
    </div>
  )
}

// ─── DUAL REGISTRATION VIEW ─────────────────────────────────────────────────
const DualRegistrationView = () => {
  const registrations: Array<{player:string;pos:string;parentClub:string;loanClub:string;type:'Temporary'|'Permanent';start:string;end:string;window:string;daysLeft:number}> = [
    {player:'Emma Clarke', pos:'CB',parentClub:'Oakridge Women',loanClub:'Harfield FC Women',type:'Temporary',start:'15 Jan 2026',end:'30 May 2026',window:'Winter',daysLeft:4},
    {player:'Chloe Tanner',pos:'CM',parentClub:'Oakridge Women',loanClub:'Sunday Rovers Women',type:'Permanent',start:'12 Aug 2025',end:'31 Jul 2026',window:'Summer 2025',daysLeft:115},
  ]

  return (
    <div>
      <SectionHeader title="Dual Registration Tracker" subtitle="FA Women's dual registration agreements" icon="🔄" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Dual-Regs" value="2" sub="Players currently loaned" color="pink" />
        <StatCard label="Expiring Soon" value="1" sub="Emma Clarke — 4 days" color="red" />
        <StatCard label="Window Status" value="Open" sub="Closes 30 Apr 2026" color="green" />
        <StatCard label="Max Permitted" value="4" sub="WSL dual-reg limit" color="blue" />
      </div>
      {/* Current registrations table */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
            <th className="text-left p-3">Player</th><th className="text-left p-3">Home Club</th><th className="text-left p-3">Host Club</th><th className="text-left p-3">Type</th><th className="text-left p-3">Start</th><th className="text-left p-3">End</th><th className="text-left p-3">Window</th><th className="text-left p-3">Status</th>
          </tr></thead>
          <tbody>
            {registrations.map(r => {
              const expiringSoon = r.daysLeft <= 7
              return (
                <tr key={r.player} className="border-b border-gray-800/50">
                  <td className="p-3 text-gray-200 font-medium">{r.player} <span className="text-[10px] text-gray-500">({r.pos})</span></td>
                  <td className="p-3 text-gray-400 text-xs">{r.parentClub}</td>
                  <td className="p-3 text-gray-400 text-xs">{r.loanClub}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${r.type === 'Permanent' ? 'bg-blue-600/20 text-blue-400' : 'bg-purple-600/20 text-purple-400'}`}>{r.type}</span></td>
                  <td className="p-3 text-gray-400 text-xs">{r.start}</td>
                  <td className="p-3 text-gray-400 text-xs">{r.end}</td>
                  <td className="p-3 text-gray-400 text-xs">{r.window}</td>
                  <td className="p-3">
                    {expiringSoon
                      ? <span className="text-xs px-2 py-0.5 rounded bg-red-600/20 text-red-400 font-semibold">EXPIRES FRIDAY</span>
                      : <span className="text-xs px-2 py-0.5 rounded bg-green-600/20 text-green-400">Active</span>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Expiry alert */}
      <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-3 mb-6 text-xs text-red-400 font-medium">⚠ Emma Clarke&apos;s dual registration expires in 4 days — decide extend, recall, or let lapse before 8 Apr 2026.</div>

      {/* Age-band salary check */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-1">Age-Band Salary Check (per FA Women&apos;s rules)</h3>
        <p className="text-[11px] text-gray-500 mb-4">Dual-registered players must remain inside their age-band salary cap at the host club. Auto-checked on each registration submission.</p>
        <div className="space-y-3">
          {[
            {player:'Emma Clarke',  age:27, band:'Senior (24+)',  cap:75000, salary:62000, ok:true},
            {player:'Chloe Tanner', age:19, band:'U21',           cap:42000, salary:38000, ok:true},
          ].map(c => {
            const pct = Math.round((c.salary / c.cap) * 100)
            return (
              <div key={c.player} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-semibold text-gray-200">{c.player}</span>
                    <span className="text-[10px] text-gray-500 ml-2">Age {c.age} · {c.band}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.ok ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>{c.ok ? '✓ Within cap' : '✗ Over cap'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                  <span>£{c.salary.toLocaleString()} / £{c.cap.toLocaleString()}</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
                  <div className="h-full" style={{ width: `${pct}%`, backgroundColor: c.ok ? '#0D9488' : '#EF4444' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">Registration Window Calendar</h3>
        <div className="space-y-2">
          {[
            {event:'WSL Winter Window Opened',date:'1 Jan 2026',status:'past'},
            {event:'Emma Clarke dual-reg expires',date:'8 Apr 2026',status:'urgent'},
            {event:'Chloe Tanner dual-reg expires',date:'31 Jul 2026',status:'future'},
            {event:'WSL Registration Window Closes',date:'30 Apr 2026',status:'upcoming'},
            {event:'Summer Window Opens',date:'1 Jun 2026',status:'future'},
          ].map((e: {event:string;date:string;status:string}) => (
            <div key={e.event} className="flex items-center justify-between py-1.5 border-b border-gray-800">
              <span className={`text-xs ${e.status === 'urgent' ? 'text-red-400 font-semibold' : e.status === 'past' ? 'text-gray-600' : 'text-gray-300'}`}>{e.event}</span>
              <span className={`text-xs ${e.status === 'urgent' ? 'text-red-400' : 'text-gray-500'}`}>{e.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── TACTICS & SET PIECES VIEW ───────────────────────────────────────────────
const TacticsSetPiecesView = () => (
  <div>
    <SectionHeader title="Tactics & Set Pieces" subtitle="Match preparation — tactical overview" icon="🎯" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Formation" value="4-3-3" sub="Primary system" color="pink" />
      <StatCard label="Set Pieces" value="4" sub="Trained routines" color="blue" />
      <StatCard label="Possession %" value="58%" sub="Season average" color="teal" />
      <StatCard label="Goals from Set Pieces" value="7" sub="28% of total goals" color="green" />
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-4">Formation — 4-3-3</h3>
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="flex gap-8">
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-pink-600/30 border border-pink-500/50 flex items-center justify-center text-[10px] text-white font-bold">LW</div><div className="text-[10px] text-gray-500 mt-1">Brooks</div></div>
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-pink-600/30 border border-pink-500/50 flex items-center justify-center text-[10px] text-white font-bold">ST</div><div className="text-[10px] text-gray-500 mt-1">Osei</div></div>
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-pink-600/30 border border-pink-500/50 flex items-center justify-center text-[10px] text-white font-bold">RW</div><div className="text-[10px] text-gray-500 mt-1">Walsh</div></div>
        </div>
        <div className="flex gap-6">
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-[10px] text-white font-bold">CM</div><div className="text-[10px] text-gray-500 mt-1">Nair</div></div>
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-[10px] text-white font-bold">DM</div><div className="text-[10px] text-gray-500 mt-1">Hughes</div></div>
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-[10px] text-white font-bold">AM</div><div className="text-[10px] text-gray-500 mt-1">Al-Said</div></div>
        </div>
        <div className="flex gap-4">
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-[10px] text-white font-bold">LB</div><div className="text-[10px] text-gray-500 mt-1">Turner</div></div>
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-[10px] text-white font-bold">CB</div><div className="text-[10px] text-gray-500 mt-1">Clarke</div></div>
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-[10px] text-white font-bold">CB</div><div className="text-[10px] text-gray-500 mt-1">TBC</div></div>
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-[10px] text-white font-bold">RB</div><div className="text-[10px] text-gray-500 mt-1">Lawson</div></div>
        </div>
        <div className="text-center"><div className="w-8 h-8 rounded-full bg-green-600/30 border border-green-500/50 flex items-center justify-center text-[10px] text-white font-bold">GK</div><div className="text-[10px] text-gray-500 mt-1">Reed</div></div>
      </div>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-3">Set Piece Routines</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          {name:'Corner — Near Post Flick',type:'Attacking',success:'42%',description:'Short corner to Nair, flick-on by Osei at near post. Clarke/Hughes as secondary targets.'},
          {name:'Free Kick — Direct Strike',type:'Attacking',success:'18%',description:'Direct attempt from Walsh when within 25 yards. Decoy run from Brooks.'},
          {name:'Throw-in — Long to Target',type:'Attacking',success:'35%',description:'Long throw from Turner to Osei in channel. Second ball runners: Walsh, Brooks.'},
          {name:'Goal Kick — Build Out',type:'Defensive',success:'72% retention',description:'Reed plays short to Clarke or Hughes. Triangle build through Nair, full-backs push wide. Long option to Osei if pressed.'},
        ].map((r: {name:string;type:string;success:string;description:string}) => (
          <div key={r.name} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-white">{r.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${r.type === 'Attacking' ? 'bg-pink-600/20 text-pink-400' : 'bg-blue-600/20 text-blue-400'}`}>{r.type}</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-1">{r.description}</p>
            <span className="text-[10px] text-gray-500">Success rate: {r.success}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-bold text-white mb-3">Team Talk — Coach Notes</h3>
      <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-300 italic">&ldquo;We press high from the front three. Nair dictates tempo. Full-backs push up — we want width. Set pieces are our edge — we&apos;ve drilled them all week. Trust the system, trust each other.&rdquo;</p>
        <p className="text-xs text-gray-500 mt-2">— Sarah Frost, Head Coach</p>
      </div>
    </div>
  </div>
)

// ─── MEDIA & PR VIEW ────────────────────────────────────────────────────────
const MediaPRView = ({ club: _club }: { club: WomensClub }) => {
  const [activeTab, setActiveTab] = useState<'requests'|'calendar'|'coverage'|'guidelines'>('requests');
  const requests = [
    {id:1,outlet:"Crown Broadcasting Women's Football",type:'Feature',contact:'Sarah Davies',subject:'Lumio Cycle — welfare integration in women\'s football',deadline:'15 Apr 2026',urgency:'high',status:'Pending approval',notes:'National exposure. Welfare Lead and Head Coach required. Opportunity to position Oakridge as welfare-leading club.',recommended:'Accept — high-profile welfare story aligns with Karen Carney mission.'},
    {id:2,outlet:'The Chronicle',type:'Interview',contact:'James Pearce',subject:'Sarah Frost — mid-season manager interview',deadline:'18 Apr 2026',urgency:'medium',status:'Pending approval',notes:'Subscriber-only piece. Positive profile opportunity ahead of final-third push.',recommended:'Accept — strong readership among WSL audience.'},
    {id:3,outlet:'Northbridge Sport',type:'Matchday Access',contact:'Emma Holt (Production)',subject:'Broadcast access — Bristol City W (Sat 12 Apr)',deadline:'Thu 10 Apr',urgency:'urgent',status:'Confirm by Thu',notes:'Pre-match tunnel access, post-match mixed zone, manager interview. Live WSL broadcast.',recommended:'Accept immediately — live broadcast reaches 400k+ viewers.'},
    {id:4,outlet:"Women's Football Weekly (Podcast)",type:'Podcast',contact:'Chloe Grant',subject:'Player guest — Emma Clarke',deadline:'25 Apr 2026',urgency:'low',status:'Under review',notes:'45-minute episode. Emma Clarke proposed. Good platform for player brand-building.',recommended:'Accept — low commitment, high player welfare value.'},
    {id:5,outlet:'The Chronicle Sport',type:'Comment piece',contact:'Anya Singh',subject:'FSR impact on WSL clubs — DoF comment requested',deadline:'20 Apr 2026',urgency:'medium',status:'Declined — refer to FA',notes:'Sensitive regulatory topic. Referred to FA communications team.',recommended:'Already declined — correct decision.'},
  ];
  const coverage = [
    {date:'5 Apr',outlet:'Crown Broadcasting',headline:'Oakridge Women climb to 5th with Nair brace',reach:'1.2M',sentiment:'positive'},
    {date:'2 Apr',outlet:'The Chronicle',headline:'How Oakridge are redefining welfare in women\'s football',reach:'85k',sentiment:'positive'},
    {date:'29 Mar',outlet:'Northbridge Sport',headline:'Oakridge Women vs Arsenal: Match Report',reach:'420k',sentiment:'neutral'},
    {date:'22 Mar',outlet:"Women's Football Wkly",headline:'Player profile: Priya Nair — the WSL\'s in-form striker',reach:'32k',sentiment:'positive'},
    {date:'15 Mar',outlet:'The Dispatch Sport',headline:'Oakridge Women in transfer talks over NWSL forward',reach:'2.1M',sentiment:'neutral'},
    {date:'8 Mar',outlet:'The Chronicle Sport',headline:'IWD: Oakridge Women on cycle-tracking welfare pilot',reach:'340k',sentiment:'positive'},
  ];
  const guidelines = [
    {topic:'Player welfare & medical',rule:'No comment without Welfare Lead approval. Refer to club statement template.',restricted:true},
    {topic:'Transfer speculation',rule:'"We do not comment on speculation regarding player movements."',restricted:true},
    {topic:'FSR and financial matters',rule:'Refer all financial regulatory questions to the FA communications team.',restricted:true},
    {topic:'Match results & tactics',rule:'Manager or assistant manager only. No tactical detail beyond what was visible publicly.',restricted:false},
    {topic:'Player personal life',rule:'No comment without explicit player consent. Privacy policy applies.',restricted:true},
    {topic:'Sponsorship deals',rule:'Commercial Director approval required. No figures disclosed without Board sign-off.',restricted:true},
    {topic:'Karen Carney / welfare criteria',rule:'Welfare Lead must approve all public statements referencing specific criteria scores.',restricted:false},
    {topic:'Injuries and availability',rule:'General fitness updates only (fit / doubtful / ruled out). No diagnosis or timeline.',restricted:false},
  ];
  const urgencyStyle = (u:string) => u==='urgent'?'bg-red-600/20 text-red-400 border border-red-600/30':u==='high'?'bg-amber-600/20 text-amber-400 border border-amber-600/30':u==='medium'?'bg-blue-600/20 text-blue-400 border border-blue-600/30':'bg-gray-800 text-gray-500';
  const sentimentStyle = (s:string) => s==='positive'?'text-green-400':s==='negative'?'text-red-400':'text-gray-400';

  return (
    <div>
      <SectionHeader title="Media & PR" subtitle="Requests · Calendar · Coverage log · PR guidelines" icon="📣"/>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Open Requests" value="3" sub="1 urgent · 2 pending" color="amber"/>
        <StatCard label="Coverage (month)" value="6" sub="5 positive · 1 neutral" color="green"/>
        <StatCard label="Total Reach" value="4.2M" sub="Cumulative this month" color="pink"/>
        <StatCard label="Next Press Day" value="Sat" sub="Northbridge Sport — Bristol City (H)" color="blue"/>
      </div>
      <div className="flex gap-1 mb-6 border-b border-gray-800 overflow-x-auto">
        {[{id:'requests',label:'Media Requests',icon:'📬'},{id:'calendar',label:'PR Calendar',icon:'📅'},{id:'coverage',label:'Coverage Log',icon:'📰'},{id:'guidelines',label:'PR Guidelines',icon:'📋'}].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id as typeof activeTab)} className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab===t.id?'border-pink-500 text-pink-400':'border-transparent text-gray-500 hover:text-gray-300'}`}>
            <span>{t.icon}</span>{t.label}
            {t.id==='requests'&&<span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-red-600/20 text-red-400">{requests.filter(r=>r.urgency==='urgent'||r.urgency==='high').length}</span>}
          </button>
        ))}
      </div>
      {activeTab==='requests'&&<div className="space-y-4">{requests.map(r=>(
        <div key={r.id} className={`bg-[#0D1117] border rounded-xl p-5 ${r.urgency==='urgent'?'border-red-600/40':r.urgency==='high'?'border-amber-600/30':'border-gray-800'}`}>
          <div className="flex items-start justify-between mb-3"><div><div className="flex items-center gap-2 mb-1"><span className="text-sm font-bold text-white">{r.outlet}</span><span className={`text-[10px] px-2 py-0.5 rounded ${urgencyStyle(r.urgency)}`}>{r.urgency==='urgent'?'🔴 URGENT':r.urgency==='high'?'🟡 High':r.urgency==='medium'?'Medium':'Low'}</span><span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400">{r.type}</span></div><p className="text-xs text-gray-300 font-medium">{r.subject}</p><p className="text-[10px] text-gray-600">Contact: {r.contact} · Deadline: {r.deadline}</p></div><span className={`text-[10px] px-2 py-1 rounded font-medium flex-shrink-0 ml-4 ${r.status.includes('Declined')?'bg-gray-800 text-gray-500':r.status==='Confirm by Thu'?'bg-green-600/20 text-green-400':'bg-amber-600/20 text-amber-400'}`}>{r.status}</span></div>
          <p className="text-xs text-gray-400 mb-2">{r.notes}</p>
          <div className="flex items-center justify-between pt-2 border-t border-gray-800"><p className="text-[10px] text-pink-400">💡 {r.recommended}</p>{!r.status.includes('Declined')&&<div className="flex gap-2"><button className="px-3 py-1 rounded-lg text-[10px] bg-gray-800 text-gray-400 hover:text-white">Decline</button><button className="px-3 py-1 rounded-lg text-[10px] font-bold bg-pink-600 hover:bg-pink-500 text-white">Accept →</button></div>}</div>
        </div>
      ))}</div>}
      {activeTab==='calendar'&&<div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden"><div className="p-4 border-b border-gray-800"><h3 className="text-sm font-bold text-white">PR & Media Calendar — April / May 2026</h3></div><div className="divide-y divide-gray-800">
        {[{date:'Thu 10 Apr',items:[{time:'10:00',type:'Press conf',label:'Pre-match presser — Bristol City W',urgency:'high'},{time:'14:00',type:'Deadline',label:'Northbridge Sport access confirmation',urgency:'urgent'}]},{date:'Fri 11 Apr',items:[{time:'11:00',type:'Content',label:'Player spotlight: Emma Clarke — TikTok',urgency:'low'}]},{date:'Sat 12 Apr',items:[{time:'12:00',type:'Matchday',label:'Northbridge Sport tunnel access',urgency:'high'},{time:'14:30',type:'Matchday',label:'KO vs Bristol City W',urgency:'high'},{time:'16:30',type:'Post-match',label:'Mixed zone + manager interview',urgency:'high'}]},{date:'Mon 14 Apr',items:[{time:'09:00',type:'Internal',label:'Weekly comms meeting',urgency:'low'},{time:'15:00',type:'Interview',label:'Crown Broadcasting — welfare feature filming',urgency:'high'}]},{date:'Wed 16 Apr',items:[{time:'11:00',type:'Deadline',label:'Crown Broadcasting feature deadline',urgency:'medium'}]},{date:'Fri 18 Apr',items:[{time:'13:00',type:'Interview',label:'The Chronicle — Sarah Frost',urgency:'medium'}]},{date:'25 Apr',items:[{time:'10:00',type:'Podcast',label:"Women's Football Weekly — Emma Clarke",urgency:'low'}]}].map((day,i)=>(
          <div key={i} className="flex gap-4 p-4"><div className="w-20 flex-shrink-0"><div className="text-xs font-bold text-white">{day.date.split(' ').slice(-2).join(' ')}</div><div className="text-[10px] text-gray-600">{day.date.split(' ')[0]}</div></div><div className="flex-1 space-y-2">{day.items.map((item,j)=><div key={j} className={`flex items-center gap-3 py-1.5 px-3 rounded-lg ${item.urgency==='urgent'?'bg-red-600/10 border border-red-600/20':item.urgency==='high'?'bg-amber-600/5 border border-amber-600/10':'bg-gray-900/50 border border-gray-800/50'}`}><span className="text-[10px] text-gray-600 w-10 flex-shrink-0">{item.time}</span><span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${item.type==='Matchday'?'bg-pink-600/20 text-pink-400':item.type==='Press conf'?'bg-purple-600/20 text-purple-400':item.type==='Interview'?'bg-blue-600/20 text-blue-400':item.type==='Deadline'?'bg-red-600/20 text-red-400':item.type==='Podcast'?'bg-teal-600/20 text-teal-400':item.type==='Content'?'bg-green-600/20 text-green-400':'bg-gray-800 text-gray-500'}`}>{item.type}</span><span className="text-xs text-gray-300">{item.label}</span></div>)}</div></div>
        ))}
      </div></div>}
      {activeTab==='coverage'&&<div className="space-y-4"><div className="grid grid-cols-3 gap-4 mb-2"><StatCard label="Positive" value="5/6" sub="This month" color="green"/><StatCard label="Total reach" value="4.2M" sub="Cumulative" color="pink"/><StatCard label="Top outlet" value="The Dispatch" sub="2.1M reach" color="blue"/></div><div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden"><table className="w-full text-sm"><thead><tr className="text-gray-500 text-[10px] border-b border-gray-800 bg-gray-900/30 uppercase tracking-wider"><th className="text-left p-3">Date</th><th className="text-left p-3">Outlet</th><th className="text-left p-3">Headline</th><th className="text-center p-3">Reach</th><th className="text-center p-3">Sentiment</th></tr></thead><tbody>{coverage.map((c,i)=><tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-500 text-xs">{c.date}</td><td className="p-3 text-gray-300 text-xs font-medium">{c.outlet}</td><td className="p-3 text-gray-400 text-xs">{c.headline}</td><td className="p-3 text-center text-xs text-pink-400 font-medium">{c.reach}</td><td className="p-3 text-center"><span className={`text-xs font-medium ${sentimentStyle(c.sentiment)}`}>{c.sentiment==='positive'?'↑ Positive':'→ Neutral'}</span></td></tr>)}</tbody></table></div></div>}
      {activeTab==='guidelines'&&<div className="space-y-4"><div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4"><p className="text-xs text-amber-300"><strong>Policy:</strong> All media requests must be approved by the Communications Director. Restricted topics require additional sign-off.</p></div><div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden"><div className="p-4 border-b border-gray-800"><h3 className="text-sm font-bold text-white">Media Response Guidelines — Oakridge Women FC</h3></div><div className="divide-y divide-gray-800">{guidelines.map((g,i)=><div key={i} className={`p-4 ${g.restricted?'bg-red-600/5':''}`}><div className="flex items-center gap-2 mb-1.5"><span className="text-xs font-bold text-white">{g.topic}</span>{g.restricted&&<span className="text-[9px] px-1.5 py-0.5 rounded bg-red-600/20 text-red-400">🔒 Restricted</span>}</div><p className="text-xs text-gray-400">{g.rule}</p></div>)}</div></div>
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5"><h3 className="text-sm font-bold text-white mb-3">Standard Response Templates</h3><div className="space-y-3">{[{s:'Transfer speculation',r:'Oakridge Women FC does not comment on speculation regarding player movements.'},{s:'Player injury details',r:'[Player name] is currently being assessed by our medical team.'},{s:'Financial / FSR queries',r:'All financial matters are handled in conjunction with the FA.'},{s:'Welfare / cycle tracking',r:'Player welfare is at the core of everything we do. Specific protocols are confidential.'}].map((t,i)=><div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3"><div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t.s}</div><p className="text-xs text-gray-300 italic">&ldquo;{t.r}&rdquo;</p></div>)}</div></div>
      </div>}
    </div>
  );
};

// ─── SOCIAL MEDIA VIEW ──────────────────────────────────────────────────────
const SocialMediaView = ({ club: _club }: { club: WomensClub }) => {
  const [activeTab, setActiveTab] = useState<'dashboard'|'calendar'|'posts'|'performance'>('dashboard');
  const platforms = [
    {name:'Instagram',icon:'📸',followers:18400,growth:22,engRate:6.8,bestReach:48000,bestPost:'WSL goal vs Chelsea'},
    {name:'TikTok',icon:'🎵',followers:14200,growth:41,engRate:9.2,bestReach:112000,bestPost:'Behind scenes reel'},
    {name:'X',icon:'𝕏',followers:7600,growth:8,engRate:3.1,bestReach:22000,bestPost:'Matchday thread'},
    {name:'YouTube',icon:'▶️',followers:2600,growth:14,engRate:4.7,bestReach:8400,bestPost:'Player profile ep4'},
  ];
  const scheduledPosts = [
    {date:'Thu 10 Apr',time:'18:00',platform:'Instagram',type:'Match preview',caption:'Saturday. Oakridge. Bristol City. 🏟️ #WSL',status:'Scheduled',reach:'~12k'},
    {date:'Thu 10 Apr',time:'18:30',platform:'X',type:'Match preview',caption:'Three points on the line. 💪',status:'Scheduled',reach:'~3k'},
    {date:'Fri 11 Apr',time:'12:00',platform:'TikTok',type:'Player spotlight',caption:'Meet our GK Emma Clarke 🧤',status:'Draft',reach:'~18k'},
    {date:'Sat 12 Apr',time:'11:30',platform:'Instagram',type:'Matchday hype',caption:'Game day. 🌸 Come on Oakridge!',status:'Scheduled',reach:'~20k'},
    {date:'Sat 12 Apr',time:'14:31',platform:'X',type:'Live thread',caption:'KO: Live match updates 🔴',status:'Scheduled',reach:'~6k'},
    {date:'Sat 12 Apr',time:'17:00',platform:'TikTok',type:'Post-match reel',caption:'Highlights + player reactions 🎬',status:'Needs approval',reach:'~35k'},
    {date:'Mon 14 Apr',time:'10:00',platform:'YouTube',type:'Behind the season',caption:'Episode 7 — The April push 🎙️',status:'In edit',reach:'~4k'},
    {date:'Wed 16 Apr',time:'14:00',platform:'Instagram',type:'Welfare story',caption:'How we\'re leading on player welfare 💜',status:'Draft',reach:'~22k'},
  ];
  const platformColor = (p:string) => p==='Instagram'?'bg-pink-600/20 text-pink-400':p==='TikTok'?'bg-gray-700 text-gray-300':p==='X'?'bg-blue-600/20 text-blue-400':'bg-red-600/20 text-red-400';
  const statusColor = (s:string) => s==='Scheduled'?'text-green-400':s==='Needs approval'?'text-red-400':s==='Draft'?'text-gray-500':'text-amber-400';
  const monthlyData = {labels:['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'],followers:[31200,33100,35400,36200,36800,38100,39400,41200,42800],engagement:[4.2,4.8,5.1,4.9,5.8,6.2,6.8,7.1,7.4]};

  return (
    <div>
      <SectionHeader title="Social Media" subtitle="Instagram · TikTok · X · YouTube · Content calendar" icon="📱"/>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Followers" value="42.8k" sub="+18% this season" color="pink"/>
        <StatCard label="Best platform" value="TikTok" sub="9.2% engagement" color="purple"/>
        <StatCard label="Posts this month" value="14" sub="4 pending approval" color="amber"/>
        <StatCard label="Best reach" value="112k" sub="TikTok BTS" color="blue"/>
      </div>
      <div className="flex gap-1 mb-6 border-b border-gray-800 overflow-x-auto">
        {[{id:'dashboard',label:'Dashboard',icon:'📊'},{id:'calendar',label:'Content Cal',icon:'📅'},{id:'posts',label:'Scheduled',icon:'📤'},{id:'performance',label:'Performance',icon:'📈'}].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id as typeof activeTab)} className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab===t.id?'border-pink-500 text-pink-400':'border-transparent text-gray-500 hover:text-gray-300'}`}><span>{t.icon}</span>{t.label}</button>
        ))}
      </div>
      {activeTab==='dashboard'&&<div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{platforms.map(p=><div key={p.name} className="bg-[#0D1117] border border-gray-800 rounded-xl p-4"><div className="flex items-center justify-between mb-3"><span className="text-lg">{p.icon}</span><span className="text-[10px] text-green-400 font-bold">+{p.growth}%</span></div><div className="text-xl font-bold text-white mb-0.5">{(p.followers/1000).toFixed(1)}k</div><div className="text-[10px] text-gray-500 mb-2">{p.name}</div><div className="w-full bg-gray-800 rounded-full h-1 mb-2"><div className="h-1 rounded-full" style={{width:`${Math.min((p.followers/20000)*100,100)}%`,backgroundColor:'#EC4899'}}/></div><div className="text-[10px] text-gray-500">{p.engRate}% eng</div></div>)}</div>
        {(()=>{const W=600,H=160,pL=48,pR=16,pT=16,pB=32,iW=W-pL-pR,iH=H-pT-pB,mn=30000,mx=44000,sX=iW/(monthlyData.labels.length-1);const path=monthlyData.followers.map((f,i)=>`${i===0?'M':'L'} ${pL+i*sX} ${pT+iH-((f-mn)/(mx-mn))*iH}`).join(' ');const area=`${path} L ${pL+(monthlyData.labels.length-1)*sX} ${pT+iH} L ${pL} ${pT+iH} Z`;return<div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5"><h3 className="text-sm font-bold text-white mb-1">Total Follower Growth</h3><p className="text-xs text-gray-500 mb-4">31.2k Aug → 42.8k Apr (+37%)</p><svg viewBox={`0 0 ${W} ${H}`} width="100%"><path d={area} fill="#EC4899" opacity="0.07"/><path d={path} fill="none" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>{monthlyData.followers.map((f,i)=><circle key={i} cx={pL+i*sX} cy={pT+iH-((f-mn)/(mx-mn))*iH} r="3" fill="#EC4899"/>)}{monthlyData.labels.map((l,i)=><text key={l} x={pL+i*sX} y={H-4} fontSize="9" fill="#6B7280" textAnchor="middle">{l}</text>)}</svg></div>;})()}
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5"><h3 className="text-sm font-bold text-white mb-4">Best Performing Posts</h3><div className="space-y-3">{[{platform:'TikTok',reach:'112k',eng:'9.4%',desc:'Behind the scenes — matchday prep',date:'18 Feb'},{platform:'Instagram',reach:'48k',eng:'8.1%',desc:'Goal vs Chelsea — Priya Nair brace',date:'5 Apr'},{platform:'X',reach:'22k',eng:'4.2%',desc:'Live thread — Tottenham W (4–0)',date:'22 Mar'},{platform:'TikTok',reach:'21k',eng:'11.2%',desc:'Karen Carney welfare pledge',date:'8 Mar'},{platform:'YouTube',reach:'8.4k',eng:'5.1%',desc:'Player profile — Emma Clarke ep3',date:'1 Mar'}].map((post,i)=><div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0"><div className="flex items-center gap-3"><span className={`text-[10px] px-2 py-0.5 rounded ${platformColor(post.platform)}`}>{post.platform}</span><span className="text-xs text-gray-300">{post.desc}</span></div><div className="flex items-center gap-4 flex-shrink-0"><span className="text-xs text-pink-400 font-bold">{post.reach}</span><span className="text-[10px] text-green-400">{post.eng}</span><span className="text-[10px] text-gray-600">{post.date}</span></div></div>)}</div></div>
      </div>}
      {activeTab==='calendar'&&<div className="space-y-4">
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5"><h3 className="text-sm font-bold text-white mb-4">Weekly Pillars</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[{day:'Mon',theme:'Training insights',icon:'⚽',pl:'TikTok · Stories'},{day:'Wed',theme:'Player spotlight',icon:'⭐',pl:'TikTok · IG'},{day:'Fri',theme:'Match preview',icon:'🎯',pl:'All platforms'},{day:'Sat',theme:'Match day',icon:'🔴',pl:'Live — all'}].map(c=><div key={c.day} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold text-pink-400">{c.day}</span><span>{c.icon}</span></div><div className="text-xs font-semibold text-white mb-1">{c.theme}</div><div className="text-[10px] text-gray-500">{c.pl}</div></div>)}</div></div>
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5"><h3 className="text-sm font-bold text-white mb-4">Upcoming — April</h3><div className="space-y-2">{scheduledPosts.map((p,i)=><div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800/50 last:border-0"><div className="w-20 flex-shrink-0"><div className="text-[10px] text-gray-400">{p.date}</div><div className="text-[10px] text-gray-600">{p.time}</div></div><span className={`text-[10px] px-2 py-0.5 rounded flex-shrink-0 ${platformColor(p.platform)}`}>{p.platform}</span><span className="text-[10px] text-gray-500 flex-shrink-0">{p.type}</span><span className="text-xs text-gray-300 flex-1 truncate">{p.caption}</span><span className={`text-[10px] flex-shrink-0 font-medium ${statusColor(p.status)}`}>{p.status}</span></div>)}</div></div>
      </div>}
      {activeTab==='posts'&&<div className="space-y-3"><div className="flex items-center justify-between mb-2"><p className="text-xs text-gray-500">{scheduledPosts.length} posts</p><button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-pink-600/20 text-pink-400 border border-pink-600/30">+ Schedule</button></div>{scheduledPosts.map((p,i)=><div key={i} className={`bg-[#0D1117] border rounded-xl p-4 ${p.status==='Needs approval'?'border-red-600/40':p.status==='Scheduled'?'border-green-600/20':'border-gray-800'}`}><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className={`text-[10px] px-2 py-0.5 rounded ${platformColor(p.platform)}`}>{p.platform}</span><span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{p.type}</span><span className="text-[10px] text-gray-600">{p.date} · {p.time}</span></div><div className="flex items-center gap-2"><span className="text-[10px] text-gray-500">{p.reach}</span><span className={`text-[10px] font-bold ${statusColor(p.status)}`}>{p.status}</span></div></div><p className="text-xs text-gray-300 mb-2">{p.caption}</p>{p.status==='Needs approval'&&<div className="flex gap-2 pt-2 border-t border-gray-800"><button className="px-3 py-1 rounded text-[10px] bg-gray-800 text-gray-400">Edit</button><button className="px-3 py-1 rounded text-[10px] font-bold bg-green-600/20 text-green-400 border border-green-600/30">Approve ✓</button></div>}</div>)}</div>}
      {activeTab==='performance'&&<div className="space-y-6">
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden"><div className="p-4 border-b border-gray-800"><h3 className="text-sm font-bold text-white">Platform Breakdown</h3></div><table className="w-full text-sm"><thead><tr className="text-gray-500 text-[10px] border-b border-gray-800 bg-gray-900/30 uppercase tracking-wider"><th className="text-left p-3">Platform</th><th className="text-center p-3">Followers</th><th className="text-center p-3">Growth</th><th className="text-center p-3">Eng %</th><th className="text-center p-3">Best reach</th><th className="text-left p-3">Best post</th></tr></thead><tbody>{platforms.map((p,i)=><tr key={i} className="border-b border-gray-800/50"><td className="p-3"><div className="flex items-center gap-2"><span>{p.icon}</span><span className="text-xs text-gray-200 font-medium">{p.name}</span></div></td><td className="p-3 text-center text-xs text-white font-bold">{(p.followers/1000).toFixed(1)}k</td><td className="p-3 text-center text-xs text-green-400 font-bold">+{p.growth}%</td><td className="p-3 text-center text-xs text-pink-400 font-bold">{p.engRate}%</td><td className="p-3 text-center text-xs text-purple-400 font-bold">{(p.bestReach/1000).toFixed(0)}k</td><td className="p-3 text-xs text-gray-400">{p.bestPost}</td></tr>)}</tbody></table></div>
        {(()=>{const W=600,H=160,pL=36,pR=16,pT=16,pB=32,iW=W-pL-pR,iH=H-pT-pB,mn=3.5,mx=8.5,sX=iW/(monthlyData.labels.length-1);const path=monthlyData.engagement.map((e,i)=>`${i===0?'M':'L'} ${pL+i*sX} ${pT+iH-((e-mn)/(mx-mn))*iH}`).join(' ');return<div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5"><h3 className="text-sm font-bold text-white mb-1">Engagement Rate — Season Trend</h3><p className="text-xs text-gray-500 mb-4">Welfare content driving highest engagement.</p><svg viewBox={`0 0 ${W} ${H}`} width="100%"><path d={path} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>{monthlyData.engagement.map((e,i)=><circle key={i} cx={pL+i*sX} cy={pT+iH-((e-mn)/(mx-mn))*iH} r="3" fill="#8B5CF6"/>)}{monthlyData.labels.map((l,i)=><text key={l} x={pL+i*sX} y={H-4} fontSize="9" fill="#6B7280" textAnchor="middle">{l}</text>)}</svg></div>;})()}
      </div>}
    </div>
  );
};

// ─── FAN HUB VIEW ───────────────────────────────────────────────────────────
const FanHubView = ({ club: _club }: { club: WomensClub }) => {
  const [activeTab, setActiveTab] = useState<'overview'|'forum'|'events'|'memberships'>('overview');
  const forumTopics = [
    {id:1,category:'Match Discussion',title:'Brighton W (H) — Post match thread 🟢',posts:84,views:1240,lastActive:'2h ago',hot:true},
    {id:2,category:'Player Welfare',title:'Lumio Cycle tracking — what do you think?',posts:67,views:890,lastActive:'4h ago',hot:true},
    {id:3,category:'Transfers',title:'Summer window wishlist — who should we sign?',posts:112,views:2100,lastActive:'1h ago',hot:true},
    {id:4,category:'Match Discussion',title:'Bristol City W (A) — Preview thread',posts:31,views:540,lastActive:'6h ago',hot:false},
    {id:5,category:'General',title:'Season tickets 2026/27 — thoughts on pricing?',posts:48,views:710,lastActive:'12h ago',hot:false},
    {id:6,category:'Academy',title:'U18 talent watch — who to look out for?',posts:29,views:480,lastActive:'1d ago',hot:false},
    {id:7,category:'Commercial',title:'New kit launch reaction — love it or leave it?',posts:95,views:1680,lastActive:'3h ago',hot:true},
    {id:8,category:'Player Welfare',title:'Karen Carney standards — club update appreciated',posts:22,views:340,lastActive:'2d ago',hot:false},
  ];
  const categoryColor = (c:string) => c==='Match Discussion'?'bg-green-600/20 text-green-400':c==='Player Welfare'?'bg-pink-600/20 text-pink-400':c==='Transfers'?'bg-blue-600/20 text-blue-400':c==='Academy'?'bg-purple-600/20 text-purple-400':c==='Commercial'?'bg-amber-600/20 text-amber-400':'bg-gray-800 text-gray-400';
  const membershipTiers = [
    {name:'Fan Hub Free',price:'£0/yr',color:'border-gray-700',badge:'bg-gray-800 text-gray-400',features:['Access to Fan Hub forum','Monthly club newsletter','Match result notifications','Public match highlights'],members:842},
    {name:'Supporter',price:'£25/yr',color:'border-pink-600/40',badge:'bg-pink-600/20 text-pink-400',features:['Everything in Free','Early ticket access (24hr)','Monthly Q&A with players','Exclusive BTS content','Digital matchday programme'],members:312},
    {name:'Club Member',price:'£60/yr',color:'border-purple-600/40',badge:'bg-purple-600/20 text-purple-300',features:['Everything in Supporter','Training session guest pass','Annual meet-the-manager event','Priority season ticket','Member kit discount (15%)','Welfare newsletter'],members:86},
  ];
  const upcomingEvents = [
    {date:'Sat 12 Apr',event:'Fan Zone — Bristol City W (H)',location:'Oakridge Stadium',type:'Matchday',tickets:'Free entry'},
    {date:'Sun 20 Apr',event:'Player Q&A — Supporter exclusive',location:'Club Lounge',type:'Supporter',tickets:'Members only'},
    {date:'Sat 3 May',event:'Season Finale Fan Day',location:'Oakridge Stadium',type:'All fans',tickets:'RSVP required'},
    {date:'Sun 11 May',event:'End of Season Awards Night',location:'Oakridge Conference',type:'Club Mbr',tickets:'Club members only'},
    {date:'Sat 7 Jun',event:'Meet the Manager — 2026/27 Preview',location:'Oakridge Stadium',type:'Club Mbr',tickets:'Club members only'},
    {date:'Sat 28 Jun',event:'New Kit Launch — Fan Hub first',location:'Oakridge Stadium',type:'All fans',tickets:'Free entry'},
  ];

  return (
    <div>
      <SectionHeader title="Fan Hub" subtitle="Community · Forum · Events · Memberships" icon="💜"/>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Hub Members" value="1,240" sub="842 free · 398 paid" color="pink"/>
        <StatCard label="Forum Posts" value="488" sub="This month" color="purple"/>
        <StatCard label="Match overlap" value="68%" sub="Members who attend" color="teal"/>
        <StatCard label="Events" value="2" sub="1 matchday · 1 members" color="blue"/>
      </div>
      <div className="flex gap-1 mb-6 border-b border-gray-800 overflow-x-auto">
        {[{id:'overview',label:'Overview',icon:'📊'},{id:'forum',label:'Forum',icon:'💬'},{id:'events',label:'Events',icon:'🎟️'},{id:'memberships',label:'Memberships',icon:'🏅'}].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id as typeof activeTab)} className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab===t.id?'border-pink-500 text-pink-400':'border-transparent text-gray-500 hover:text-gray-300'}`}><span>{t.icon}</span>{t.label}</button>
        ))}
      </div>
      {activeTab==='overview'&&<div className="space-y-6">
        {(()=>{const W=600,H=160,pL=40,pR=16,pT=16,pB=32,iW=W-pL-pR,iH=H-pT-pB,ms=['Jan','Feb','Mar','Apr'],mv=[820,960,1110,1240],mn=700,mx=1400,sX=iW/(ms.length-1);const path=mv.map((m,i)=>`${i===0?'M':'L'} ${pL+i*sX} ${pT+iH-((m-mn)/(mx-mn))*iH}`).join(' ');const area=`${path} L ${pL+(ms.length-1)*sX} ${pT+iH} L ${pL} ${pT+iH} Z`;return<div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5"><h3 className="text-sm font-bold text-white mb-1">Fan Hub Member Growth</h3><p className="text-xs text-gray-500 mb-4">Launched Jan 2026 — 1,240 members in 4 months.</p><svg viewBox={`0 0 ${W} ${H}`} width="100%"><path d={area} fill="#EC4899" opacity="0.08"/><path d={path} fill="none" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>{mv.map((m,i)=><g key={i}><circle cx={pL+i*sX} cy={pT+iH-((m-mn)/(mx-mn))*iH} r="4" fill="#EC4899"/><text x={pL+i*sX} y={pT+iH-((m-mn)/(mx-mn))*iH-8} fontSize="9" fill="#EC4899" textAnchor="middle" fontWeight="bold">{m.toLocaleString()}</text></g>)}{ms.map((l,i)=><text key={l} x={pL+i*sX} y={H-4} fontSize="9" fill="#6B7280" textAnchor="middle">{l}</text>)}</svg></div>;})()}
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5"><h3 className="text-sm font-bold text-white mb-4">Trending Topics</h3><div className="space-y-2">{forumTopics.filter(t=>t.hot).map((t,i)=><div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0"><div className="flex items-center gap-3"><span className="text-[10px] text-orange-400">🔥</span><div><div className="text-xs text-gray-200">{t.title}</div><div className="flex items-center gap-2 mt-0.5"><span className={`text-[9px] px-1.5 py-0.5 rounded ${categoryColor(t.category)}`}>{t.category}</span><span className="text-[10px] text-gray-600">{t.lastActive}</span></div></div></div><div className="text-right flex-shrink-0 ml-4"><div className="text-xs text-pink-400 font-bold">{t.posts} posts</div><div className="text-[10px] text-gray-600">{t.views.toLocaleString()} views</div></div></div>)}</div></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Top topic" value="Transfers" sub="112 posts" color="blue"/><StatCard label="New members" value="+130" sub="This month" color="green"/><StatCard label="Paid conversions" value="32%" sub="Free → paid" color="pink"/><StatCard label="Fan revenue" value="£9.8k" sub="Memberships YTD" color="teal"/></div>
      </div>}
      {activeTab==='forum'&&<div className="space-y-4"><div className="flex items-center justify-between mb-2"><p className="text-xs text-gray-500">{forumTopics.length} topics · {forumTopics.reduce((s,t)=>s+t.posts,0)} posts</p><button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-pink-600/20 text-pink-400 border border-pink-600/30">+ New topic</button></div><div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden"><table className="w-full text-sm"><thead><tr className="text-gray-500 text-[10px] border-b border-gray-800 bg-gray-900/30 uppercase tracking-wider"><th className="text-left p-3">Topic</th><th className="text-left p-3">Category</th><th className="text-center p-3">Posts</th><th className="text-center p-3">Views</th><th className="text-center p-3">Active</th></tr></thead><tbody>{forumTopics.map((t,i)=><tr key={i} className="border-b border-gray-800/50 hover:bg-white/[0.02] cursor-pointer"><td className="p-3"><div className="flex items-center gap-2">{t.hot&&<span className="text-orange-400 text-xs">🔥</span>}<span className="text-xs text-gray-200">{t.title}</span></div></td><td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded ${categoryColor(t.category)}`}>{t.category}</span></td><td className="p-3 text-center text-xs text-pink-400 font-bold">{t.posts}</td><td className="p-3 text-center text-xs text-gray-400">{t.views.toLocaleString()}</td><td className="p-3 text-center text-[10px] text-gray-500">{t.lastActive}</td></tr>)}</tbody></table></div></div>}
      {activeTab==='events'&&<div className="space-y-4"><div className="flex items-center justify-between mb-2"><p className="text-xs text-gray-500">{upcomingEvents.length} events · Apr–Jun 2026</p><button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-pink-600/20 text-pink-400 border border-pink-600/30">+ Add event</button></div>{upcomingEvents.map((e,i)=><div key={i} className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 hover:border-pink-600/20 transition-colors"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2 mb-1"><span className="text-sm font-bold text-white">{e.event}</span><span className={`text-[10px] px-2 py-0.5 rounded ${e.type==='Matchday'?'bg-green-600/20 text-green-400':e.type==='Supporter'?'bg-pink-600/20 text-pink-400':e.type==='Club Mbr'?'bg-purple-600/20 text-purple-400':'bg-blue-600/20 text-blue-400'}`}>{e.type}</span></div><div className="flex items-center gap-3 text-[10px] text-gray-500"><span>📅 {e.date}</span><span>📍 {e.location}</span><span>🎟️ {e.tickets}</span></div></div><button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-pink-600/20 text-pink-400 border border-pink-600/30 flex-shrink-0 ml-4">Manage →</button></div></div>)}</div>}
      {activeTab==='memberships'&&<div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">{membershipTiers.map((tier,i)=><div key={i} className={`bg-[#0D1117] border-2 rounded-xl p-5 ${tier.color}`}><div className="flex items-center justify-between mb-3"><div><span className={`text-[10px] px-2 py-0.5 rounded font-bold ${tier.badge}`}>{tier.name}</span><div className="text-xl font-bold text-white mt-2">{tier.price}</div></div><div className="text-right"><div className="text-lg font-bold text-pink-400">{tier.members}</div><div className="text-[10px] text-gray-600">members</div></div></div><div className="space-y-1.5">{tier.features.map((f,j)=><div key={j} className="flex items-start gap-1.5 text-xs text-gray-300"><span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>{f}</div>)}</div><div className="mt-4 pt-3 border-t border-gray-800"><div className="w-full bg-gray-800 rounded-full h-1.5 mb-1"><div className="h-1.5 rounded-full bg-pink-500" style={{width:`${(tier.members/1240)*100}%`}}/></div><div className="text-[10px] text-gray-600">{((tier.members/1240)*100).toFixed(0)}% of total</div></div></div>)}</div>
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5"><h3 className="text-sm font-bold text-white mb-4">Membership Revenue — YTD</h3><div className="space-y-3">{[{tier:'Fan Hub Free',members:842,revenue:0,color:'#6B7280'},{tier:'Supporter',members:312,revenue:7800,color:'#EC4899'},{tier:'Club Member',members:86,revenue:5160,color:'#8B5CF6'}].map(r=><div key={r.tier}><div className="flex justify-between text-xs mb-1"><span className="text-gray-400">{r.tier} ({r.members})</span><span className="text-white font-bold">{r.revenue===0?'Free':`£${r.revenue.toLocaleString()}`}</span></div><div className="w-full bg-gray-800 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{width:`${(r.revenue/12960)*100}%`,backgroundColor:r.color}}/></div></div>)}<div className="pt-3 border-t border-gray-800 flex justify-between text-sm"><span className="text-gray-400">Total YTD</span><span className="text-pink-400 font-bold">£12,960</span></div></div></div>
      </div>}
    </div>
  );
};

// ─── ACADEMY VIEW ───────────────────────────────────────────────────────────
const AcademyView = ({ club: _club }: { club: WomensClub }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'u18' | 'u21' | 'pathway'>('overview')
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null)

  const u18Players = [
    { id: 1,  name: "Niamh O'Brien",  age: 17, pos: 'CB',  gpsAvg: 71, devRating: 5, potential: 'Elite',  scholarshipYr: 2, appearances: 14, goals: 1,  assists: 2,  notes: 'Fast-track candidate. Composure on ball exceptional for age. Nominated for dual reg May 2026.' },
    { id: 2,  name: 'Isla Pearce',     age: 17, pos: 'FW',  gpsAvg: 64, devRating: 4, potential: 'High',   scholarshipYr: 2, appearances: 12, goals: 7,  assists: 3,  notes: 'Training with first team Fridays. Clinical finisher. Needs work on press contribution.' },
    { id: 3,  name: 'Freya Watts',     age: 16, pos: 'CM',  gpsAvg: 58, devRating: 3, potential: 'Medium', scholarshipYr: 1, appearances: 9,  goals: 1,  assists: 4,  notes: 'Good technical base. Decision-making in tight spaces developing well.' },
    { id: 4,  name: 'Becca Lane',      age: 15, pos: 'GK',  gpsAvg: 55, devRating: 3, potential: 'Medium', scholarshipYr: 1, appearances: 11, goals: 0,  assists: 0,  notes: 'Strong shot-stopper. Distribution improving. Youngest GK in U18s.' },
    { id: 5,  name: 'Simone Ashby',    age: 17, pos: 'LB',  gpsAvg: 62, devRating: 4, potential: 'High',   scholarshipYr: 2, appearances: 13, goals: 0,  assists: 6,  notes: 'Best delivery from wide areas in academy. CoE licence player.' },
    { id: 6,  name: 'Raya Obi',        age: 16, pos: 'DM',  gpsAvg: 60, devRating: 3, potential: 'Medium', scholarshipYr: 1, appearances: 8,  goals: 0,  assists: 1,  notes: 'Reads the game well. Physical development needed before first-team consideration.' },
    { id: 7,  name: 'Caitlin Duff',    age: 17, pos: 'RW',  gpsAvg: 67, devRating: 4, potential: 'High',   scholarshipYr: 2, appearances: 10, goals: 4,  assists: 5,  notes: "Explosive in transition. Lumio Scout flagged as one of top U18 wingers in Women's Champ region." },
    { id: 8,  name: 'Aoife Regan',     age: 15, pos: 'CB',  gpsAvg: 52, devRating: 2, potential: 'Develop',scholarshipYr: 1, appearances: 5,  goals: 0,  assists: 0,  notes: 'Early-stage development. Good attitude. Needs full season of U18 exposure.' },
    { id: 9,  name: 'Zara Mensah',     age: 16, pos: 'AM',  gpsAvg: 63, devRating: 4, potential: 'High',   scholarshipYr: 1, appearances: 11, goals: 3,  assists: 7,  notes: 'Creative. Sets Academy U18 assists record this season. Eye for a pass beyond her years.' },
    { id: 10, name: 'Lucy Holt',       age: 17, pos: 'FW',  gpsAvg: 59, devRating: 3, potential: 'Medium', scholarshipYr: 2, appearances: 10, goals: 5,  assists: 1,  notes: 'Hard-working press forward. Goals-to-shot ratio good. Needs to add pace.' },
  ]

  const u21Players = [
    { id: 11, name: 'Dani Cross',      age: 20, pos: 'CM',  gpsAvg: 78, devRating: 4, potential: 'High',   contract: 'Scholar → Pro offer pending', appearances: 18, goals: 3,  assists: 9,  firstTeamSessions: 12, notes: 'Training with first team regularly. DoF view: ready for dual reg next window.' },
    { id: 12, name: 'Priya Sadhu',     age: 19, pos: 'LB',  gpsAvg: 74, devRating: 4, potential: 'High',   contract: 'Scholar — Year 2',            appearances: 16, goals: 1,  assists: 8,  firstTeamSessions: 6,  notes: "Technically outstanding. Overlapping full-back — fits Frost's system perfectly." },
    { id: 13, name: 'Ellie Moran',     age: 21, pos: 'GK',  gpsAvg: 70, devRating: 3, potential: 'Medium', contract: 'Pro contract — Year 1',        appearances: 20, goals: 0,  assists: 0,  firstTeamSessions: 4,  notes: "3rd-choice GK. Loan move to Women's Champ club recommended for regular minutes." },
    { id: 14, name: 'Sasha Kone',      age: 20, pos: 'FW',  gpsAvg: 82, devRating: 5, potential: 'Elite',  contract: 'Scholar → Pro contract offer',  appearances: 17, goals: 14, assists: 4,  firstTeamSessions: 18, notes: 'Top scorer in U21 WSL. First-team debut made Feb 2026. Elite potential — protect from external interest.' },
    { id: 15, name: 'Abby Thornton',   age: 19, pos: 'CB',  gpsAvg: 72, devRating: 3, potential: 'Medium', contract: 'Scholar — Year 1',            appearances: 15, goals: 1,  assists: 2,  firstTeamSessions: 2,  notes: 'Solid defensively. Aerial strength above average for age. Needs more first-team exposure.' },
    { id: 16, name: 'Meg Farr',        age: 21, pos: 'RW',  gpsAvg: 76, devRating: 4, potential: 'High',   contract: 'Pro contract — Year 1',        appearances: 19, goals: 6,  assists: 10, firstTeamSessions: 8,  notes: 'Winger with excellent delivery. Pushing for first-team squad place next season.' },
    { id: 17, name: 'Tara Flynn',      age: 20, pos: 'DM',  gpsAvg: 69, devRating: 3, potential: 'Medium', contract: 'Scholar — Year 2',            appearances: 14, goals: 0,  assists: 3,  firstTeamSessions: 3,  notes: 'Reads the game well. Lacks top-end pace. Potential loan candidate Summer 2026.' },
  ]

  const potentialColor = (p: string) =>
    p === 'Elite'  ? 'bg-pink-600/20 text-pink-300 border border-pink-500/40' :
    p === 'High'   ? 'bg-purple-600/20 text-purple-300' :
    p === 'Medium' ? 'bg-blue-600/20 text-blue-300' :
                     'bg-gray-800 text-gray-500'

  const devStars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

  const allPlayers = [...u18Players, ...u21Players]
  const selectedP  = selectedPlayer !== null ? allPlayers.find(p => p.id === selectedPlayer) : null

  const pathwaySteps = [
    { stage: 'U14–U16 CoE',      label: "Girls' Centre of Excellence Entry",    desc: 'FA-licensed CoE. Education welfare officer. Safeguarding. Parent consent.' },
    { stage: 'U16 Scholar',      label: 'Scholarship Agreement',                 desc: 'Two-year scholarship. Weekly stipend. Education programme. Development plan filed.' },
    { stage: 'U18 Academy',      label: 'U18 Academy Registration',              desc: "FA Girls' U18 league. GPS profiling begins. Monthly development reviews." },
    { stage: 'U21 Development',  label: 'U21 Squad / Dual Registration',         desc: 'Professional development contract or dual reg with lower-league club for minutes.' },
    { stage: 'First Team Bridge',label: 'First Team Training Integration',       desc: 'Named in first-team matchday squad. Senior contract offer triggered at this stage.' },
    { stage: 'First Team',       label: 'WSL First Team Contract',              desc: 'Full professional contract. FSR-compliant salary. Karen Carney welfare protections apply.' },
  ]

  return (
    <div>
      <SectionHeader title="Academy & Player Pathway" subtitle="FA Girls' Centre of Excellence · U18 · U21 · First Team Bridge" icon="🎓" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Academy Players" value="34"   sub="U18: 10 · U21: 7 · Scholars: 27" color="pink"  />
        <StatCard label="Elite Potential" value="2"    sub="Niamh O'Brien · Sasha Kone"       color="purple" />
        <StatCard label="First Team Ready" value="3"   sub="Dual reg candidates this window"  color="green"  />
        <StatCard label="CoE Compliance"  value="87%"  sub="3 criteria outstanding"           color="amber"  />
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-800 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview',   icon: '📊' },
          { id: 'u18',      label: 'U18 Squad',  icon: '🌱' },
          { id: 'u21',      label: 'U21 Squad',  icon: '⬆️' },
          { id: 'pathway',  label: 'Pathway',    icon: '🛤️' },
        ].map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id as typeof activeTab); setSelectedPlayer(null) }}
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab === t.id ? 'border-pink-500 text-pink-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">FA Girls&apos; Centre of Excellence — Compliance</h3>
              <span className="text-xs px-2 py-1 rounded bg-pink-600/20 text-pink-400 border border-pink-600/30">87% compliant</span>
            </div>
            <div className="space-y-2">
              {[
                { item: 'Qualified coaching staff ratio met (1:15)',                         status: 'green' },
                { item: 'Safeguarding DBS checks up to date (all staff)',                    status: 'green' },
                { item: 'Education welfare officer in post',                                 status: 'green' },
                { item: 'Player development plans filed (all registered players)',           status: 'green' },
                { item: 'Medical screening completed (all academy players)',                  status: 'green' },
                { item: 'Parent/guardian consent and registration forms complete',           status: 'green' },
                { item: 'Safeguarding policy reviewed and published (within 12 months)',     status: 'green' },
                { item: 'GPS profiling in place (U18 and above)',                            status: 'green' },
                { item: 'Physiotherapy provision dedicated to academy (not shared)',          status: 'amber', note: 'Currently shared with first team — standalone required by Aug 2026' },
                { item: 'Strength & conditioning coach dedicated to U18',                    status: 'amber', note: 'Recruitment underway — target start Jun 2026' },
                { item: 'Mental health practitioner dedicated to academy',                    status: 'red',   note: 'URGENT — required by Jun 2026. Board sign-off needed by 30 Apr.' },
              ].map((r, i) => (
                <div key={i} className={`flex items-start gap-2.5 py-2 border-b border-gray-800/50 last:border-0 ${r.status === 'red' ? 'bg-red-600/5 rounded px-2 -mx-2' : ''}`}>
                  <span className={`mt-0.5 flex-shrink-0 text-sm ${r.status === 'green' ? 'text-green-400' : r.status === 'amber' ? 'text-amber-400' : 'text-red-400'}`}>
                    {r.status === 'green' ? '✓' : r.status === 'amber' ? '⚠' : '✗'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-gray-300">{r.item}</span>
                    {r.note && <p className={`text-[10px] mt-0.5 ${r.status === 'red' ? 'text-red-400' : 'text-amber-400'}`}>{r.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-1">GPS Load Profile — Academy vs First Team</h3>
            <p className="text-xs text-gray-500 mb-4">Average daily GPS load (AU) by squad. First team benchmark shown as dashed line.</p>
            {(() => {
              const W = 560, H = 160, padL = 40, padR = 16, padT = 16, padB = 36
              const innerW = W - padL - padR, innerH = H - padT - padB, maxGPS = 100, firstTeamAvg = 84
              const groups = [
                { label: 'U15', avg: 48, color: '#6B7280' }, { label: 'U16', avg: 56, color: '#8B5CF6' },
                { label: 'U17', avg: 63, color: '#3B82F6' }, { label: 'U18', avg: 62, color: '#0D9488' },
                { label: 'U21', avg: 75, color: '#EC4899' }, { label: '1st', avg: 84, color: '#22C55E' },
              ]
              const barW = (innerW / groups.length) * 0.55, barGap = innerW / groups.length
              const ftY = padT + innerH - (firstTeamAvg / maxGPS) * innerH
              return (
                <svg viewBox={`0 0 ${W} ${H}`} width="100%">
                  {[0, 0.25, 0.5, 0.75, 1].map((t, i) => <line key={i} x1={padL} x2={W - padR} y1={padT + innerH - t * innerH} y2={padT + innerH - t * innerH} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />)}
                  {[0, 25, 50, 75, 100].map((v, i) => <text key={i} x={padL - 6} y={padT + innerH - (v / maxGPS) * innerH + 3} fontSize="9" fill="#6B7280" textAnchor="end">{v}</text>)}
                  <line x1={padL} x2={W - padR} y1={ftY} y2={ftY} stroke="#22C55E" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.6" />
                  <text x={W - padR + 2} y={ftY + 3} fontSize="8" fill="#22C55E">1st avg</text>
                  {groups.map((g, i) => {
                    const barH = (g.avg / maxGPS) * innerH, x = padL + i * barGap + (barGap - barW) / 2
                    return (
                      <g key={g.label}>
                        <rect x={x} y={padT + innerH - barH} width={barW} height={barH} fill={g.color} opacity="0.8" rx="2" />
                        <text x={x + barW / 2} y={padT + innerH - barH - 4} fontSize="9" fill={g.color} textAnchor="middle" fontWeight="bold">{g.avg}</text>
                        <text x={x + barW / 2} y={H - 4} fontSize="9" fill="#6B7280" textAnchor="middle">{g.label}</text>
                      </g>
                    )
                  })}
                </svg>
              )
            })()}
            <p className="text-[10px] text-gray-600 mt-2">GPS load increases progressively through age groups. U21 squad operating at 89% of first-team avg — transition gap closing well.</p>
          </div>

          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Promotion Pipeline — This Season</h3>
            <div className="space-y-3">
              {[
                { name: "Sasha Kone",     from: 'U21', to: 'First Team',       status: 'Debut made Feb 2026',              timing: 'Now',         color: 'green' },
                { name: "Niamh O'Brien", from: 'U18', to: 'U21 / Dual Reg',   status: 'Dual reg nominated — pending DoF', timing: 'May 2026',    color: 'pink' },
                { name: 'Dani Cross',     from: 'U21', to: 'First Team Squad', status: 'Pro offer pending — DoF decision', timing: 'Summer 2026', color: 'pink' },
                { name: 'Isla Pearce',    from: 'U18', to: 'U21 / Friday train',status: 'Informal — no registration yet',  timing: 'Assess May',  color: 'amber' },
                { name: 'Ellie Moran',    from: 'U21', to: "Loan — Women's Ch",status: 'Loan recommended for minutes',     timing: 'Summer 2026', color: 'blue' },
              ].map((p, i) => (
                <div key={i} className={`flex items-center justify-between py-2.5 px-3 rounded-lg border ${p.color === 'green' ? 'border-green-600/30 bg-green-600/5' : p.color === 'pink' ? 'border-pink-600/30 bg-pink-600/5' : p.color === 'amber' ? 'border-amber-600/30 bg-amber-600/5' : 'border-blue-600/30 bg-blue-600/5'}`}>
                  <div>
                    <div className="text-xs font-bold text-white">{p.name}</div>
                    <div className="text-[10px] text-gray-500">{p.from} → {p.to}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-medium ${p.color === 'green' ? 'text-green-400' : p.color === 'pink' ? 'text-pink-400' : p.color === 'amber' ? 'text-amber-400' : 'text-blue-400'}`}>{p.status}</div>
                    <div className="text-[10px] text-gray-600">{p.timing}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Academy Goals (season)" value="44"  sub="U18: 21 · U21: 23"    color="pink"  />
            <StatCard label="Avg GPS Load — U21"     value="75"  sub="AU/session"            color="teal"  />
            <StatCard label="First Team Sessions"    value="53"  sub="Academy players in FT" color="purple"/>
            <StatCard label="Scholar Contracts"      value="8"   sub="Active scholarships"   color="blue"  />
          </div>
        </div>
      )}

      {activeTab === 'u18' && (
        <div>
          {selectedP && selectedP.id <= 10 && (
            <div className="bg-[#0D1117] border border-pink-600/40 rounded-xl p-5 mb-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white">{selectedP.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${potentialColor((selectedP as typeof u18Players[0]).potential)}`}>{(selectedP as typeof u18Players[0]).potential}</span>
                  </div>
                  <p className="text-xs text-gray-400">{selectedP.pos} · Age {selectedP.age} · Scholar Year {(selectedP as typeof u18Players[0]).scholarshipYr}</p>
                </div>
                <button onClick={() => setSelectedPlayer(null)} className="text-gray-600 hover:text-gray-400 text-lg">✕</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                {[
                  { v: selectedP.gpsAvg, l: 'GPS avg (AU)', c: 'text-pink-400' },
                  { v: devStars((selectedP as typeof u18Players[0]).devRating), l: 'Dev rating', c: 'text-amber-400' },
                  { v: selectedP.appearances, l: 'Appearances', c: 'text-white' },
                  { v: selectedP.goals, l: 'Goals', c: 'text-green-400' },
                  { v: selectedP.assists, l: 'Assists', c: 'text-blue-400' },
                ].map(s => (
                  <div key={s.l} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2.5 text-center">
                    <div className={`text-lg font-bold ${s.c}`}>{s.v}</div>
                    <div className="text-[10px] text-gray-500">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>GPS load vs first-team benchmark (84 AU)</span><span className={selectedP.gpsAvg >= 75 ? 'text-green-400' : selectedP.gpsAvg >= 60 ? 'text-amber-400' : 'text-gray-500'}>{selectedP.gpsAvg} AU — {((selectedP.gpsAvg / 84) * 100).toFixed(0)}% of 1st team</span></div>
                <div className="w-full bg-gray-800 rounded-full h-2"><div className="h-2 rounded-full bg-pink-500" style={{ width: `${Math.min((selectedP.gpsAvg / 84) * 100, 100)}%` }} /></div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{selectedP.notes}</p>
            </div>
          )}
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">U18 Academy Squad</h3>
              <span className="text-[10px] text-gray-500">{u18Players.length} players · FA Girls&apos; CoE registered</span>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500 text-[10px] border-b border-gray-800 bg-gray-900/30 uppercase tracking-wider">
                <th className="text-left p-3">Player</th><th className="text-center p-3">Age</th><th className="text-center p-3">Pos</th><th className="text-center p-3">Scholar Yr</th><th className="text-center p-3">GPS avg</th><th className="text-center p-3">Dev rating</th><th className="text-center p-3">Apps</th><th className="text-center p-3">G</th><th className="text-center p-3">A</th><th className="text-left p-3">Potential</th><th className="p-3"></th>
              </tr></thead>
              <tbody>
                {u18Players.map(p => (
                  <tr key={p.id} onClick={() => setSelectedPlayer(selectedPlayer === p.id ? null : p.id)} className={`border-b border-gray-800/50 cursor-pointer transition-colors ${selectedPlayer === p.id ? 'bg-pink-600/5' : 'hover:bg-white/[0.02]'}`}>
                    <td className="p-3 text-gray-200 font-medium text-xs">{p.name}</td>
                    <td className="p-3 text-center text-xs text-gray-400">{p.age}</td>
                    <td className="p-3 text-center"><span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">{p.pos}</span></td>
                    <td className="p-3 text-center text-xs text-gray-400">Yr {p.scholarshipYr}</td>
                    <td className="p-3 text-center"><span className={`text-xs font-bold ${p.gpsAvg >= 68 ? 'text-green-400' : p.gpsAvg >= 58 ? 'text-amber-400' : 'text-gray-500'}`}>{p.gpsAvg}</span></td>
                    <td className="p-3 text-center text-xs text-amber-400">{devStars(p.devRating)}</td>
                    <td className="p-3 text-center text-xs text-gray-300">{p.appearances}</td>
                    <td className="p-3 text-center text-xs text-green-400 font-bold">{p.goals}</td>
                    <td className="p-3 text-center text-xs text-blue-400 font-bold">{p.assists}</td>
                    <td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded font-bold ${potentialColor(p.potential)}`}>{p.potential}</span></td>
                    <td className="p-3 text-gray-600 text-xs">→</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 border-t border-gray-800 text-[10px] text-gray-600">Click any player to expand GPS and development profile</div>
          </div>
        </div>
      )}

      {activeTab === 'u21' && (
        <div>
          {selectedP && selectedP.id >= 11 && (
            <div className="bg-[#0D1117] border border-pink-600/40 rounded-xl p-5 mb-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white">{selectedP.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${potentialColor((selectedP as typeof u21Players[0]).potential)}`}>{(selectedP as typeof u21Players[0]).potential}</span>
                  </div>
                  <p className="text-xs text-gray-400">{selectedP.pos} · Age {selectedP.age} · {(selectedP as typeof u21Players[0]).contract}</p>
                </div>
                <button onClick={() => setSelectedPlayer(null)} className="text-gray-600 hover:text-gray-400 text-lg">✕</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                {[
                  { v: selectedP.gpsAvg, l: 'GPS avg (AU)', c: 'text-pink-400' },
                  { v: selectedP.appearances, l: 'Appearances', c: 'text-white' },
                  { v: selectedP.goals, l: 'Goals', c: 'text-green-400' },
                  { v: selectedP.assists, l: 'Assists', c: 'text-blue-400' },
                  { v: (selectedP as typeof u21Players[0]).firstTeamSessions, l: '1st team sessions', c: 'text-purple-400' },
                ].map(s => (
                  <div key={s.l} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2.5 text-center">
                    <div className={`text-lg font-bold ${s.c}`}>{s.v}</div>
                    <div className="text-[10px] text-gray-500">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>GPS load vs first-team benchmark (84 AU)</span><span className={selectedP.gpsAvg >= 78 ? 'text-green-400' : 'text-amber-400'}>{selectedP.gpsAvg} AU — {((selectedP.gpsAvg / 84) * 100).toFixed(0)}% of 1st team</span></div>
                <div className="w-full bg-gray-800 rounded-full h-2"><div className="h-2 rounded-full bg-pink-500" style={{ width: `${Math.min((selectedP.gpsAvg / 84) * 100, 100)}%` }} /></div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{selectedP.notes}</p>
            </div>
          )}
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">U21 Development Squad</h3>
              <span className="text-[10px] text-gray-500">{u21Players.length} players</span>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500 text-[10px] border-b border-gray-800 bg-gray-900/30 uppercase tracking-wider">
                <th className="text-left p-3">Player</th><th className="text-center p-3">Age</th><th className="text-center p-3">Pos</th><th className="text-center p-3">GPS avg</th><th className="text-center p-3">Apps</th><th className="text-center p-3">G</th><th className="text-center p-3">A</th><th className="text-center p-3">1st Team</th><th className="text-left p-3">Contract</th><th className="text-left p-3">Potential</th><th className="p-3"></th>
              </tr></thead>
              <tbody>
                {u21Players.map(p => (
                  <tr key={p.id} onClick={() => setSelectedPlayer(selectedPlayer === p.id ? null : p.id)} className={`border-b border-gray-800/50 cursor-pointer transition-colors ${selectedPlayer === p.id ? 'bg-pink-600/5' : 'hover:bg-white/[0.02]'}`}>
                    <td className="p-3 text-gray-200 font-medium text-xs">{p.name}</td>
                    <td className="p-3 text-center text-xs text-gray-400">{p.age}</td>
                    <td className="p-3 text-center"><span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">{p.pos}</span></td>
                    <td className="p-3 text-center"><span className={`text-xs font-bold ${p.gpsAvg >= 78 ? 'text-green-400' : p.gpsAvg >= 68 ? 'text-amber-400' : 'text-gray-500'}`}>{p.gpsAvg}</span></td>
                    <td className="p-3 text-center text-xs text-gray-300">{p.appearances}</td>
                    <td className="p-3 text-center text-xs text-green-400 font-bold">{p.goals}</td>
                    <td className="p-3 text-center text-xs text-blue-400 font-bold">{p.assists}</td>
                    <td className="p-3 text-center text-xs text-purple-400 font-medium">{p.firstTeamSessions}</td>
                    <td className="p-3 text-[10px] text-gray-400">{p.contract}</td>
                    <td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded font-bold ${potentialColor(p.potential)}`}>{p.potential}</span></td>
                    <td className="p-3 text-gray-600 text-xs">→</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 border-t border-gray-800 text-[10px] text-gray-600">Click any player to expand GPS and development profile</div>
          </div>
        </div>
      )}

      {activeTab === 'pathway' && (
        <div className="space-y-6">
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-5">Player Development Pathway — Oakridge Women FC</h3>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-800" />
              {pathwaySteps.map((step, i) => {
                const isActive = i >= 2 && i <= 4
                const colors = ['border-gray-600 bg-gray-800','border-gray-600 bg-gray-800','border-teal-500 bg-teal-500/20','border-blue-500 bg-blue-500/20','border-pink-500 bg-pink-500/20','border-green-500 bg-green-500/20']
                const labelColors = ['text-gray-400','text-gray-400','text-teal-400','text-blue-400','text-pink-400','text-green-400']
                return (
                  <div key={i} className="flex gap-5 mb-6 pl-12 relative">
                    <div className={`absolute left-3 top-0.5 w-5 h-5 rounded-full border-2 ${colors[i]}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-bold ${labelColors[i]}`}>{step.stage}</span>
                        {isActive && <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-600/20 text-pink-400">Active</span>}
                      </div>
                      <div className="text-sm font-semibold text-white mb-1">{step.label}</div>
                      <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">FA Dual Registration Rules — Women&apos;s Football</h3>
            <div className="space-y-2">
              {[
                "Players can be dual registered between WSL and Women's Championship clubs only",
                'Maximum of 5 dual-registered players per club per registration window',
                "Player must be eligible for both clubs' league (age, nationality, contract)",
                'Dual registration period: minimum 28 days, maximum end of season',
                "Parent club retains registration rights and can recall with 7 days' notice",
                'Player cannot play for both clubs in the same matchweek',
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs py-1.5 border-b border-gray-800/50 last:border-0">
                  <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-gray-300">{r}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Current Dual Reg Candidates</h3>
            <div className="space-y-3">
              {[
                { name: "Niamh O'Brien", squad: 'U18 → U21/Dual reg', status: 'Nominated', detail: "CB · Age 17 · GPS 71 AU · Elite potential. Dual reg to Women's Champ club recommended from May 2026.", action: 'DoF approval needed', color: 'pink' },
                { name: 'Ellie Moran', squad: 'U21 → Loan', status: 'Recommended', detail: "GK · Age 21 · 3rd-choice. Loan to Women's Champ recommended for 2026/27 for regular minutes.", action: 'Summer window — target clubs identified', color: 'blue' },
                { name: 'Tara Flynn', squad: 'U21 → Loan', status: 'Under review', detail: 'DM · Age 20 · Lacks top-end pace for WSL but technically sound. Loan candidate Summer 2026.', action: 'Review post-season', color: 'amber' },
              ].map((c, i) => (
                <div key={i} className={`rounded-xl p-4 border ${c.color === 'pink' ? 'border-pink-600/30 bg-pink-600/5' : c.color === 'blue' ? 'border-blue-600/30 bg-blue-600/5' : 'border-amber-600/30 bg-amber-600/5'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{c.name}</span>
                      <span className="text-[10px] text-gray-500">{c.squad}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${c.color === 'pink' ? 'bg-pink-600/20 text-pink-400' : c.color === 'blue' ? 'bg-blue-600/20 text-blue-400' : 'bg-amber-600/20 text-amber-400'}`}>{c.status}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{c.detail}</p>
                  <p className={`text-[10px] font-medium ${c.color === 'pink' ? 'text-pink-400' : c.color === 'blue' ? 'text-blue-400' : 'text-amber-400'}`}>→ {c.action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SCOUTING VIEW ──────────────────────────────────────────────────────────
const ScoutingView = ({ club }: { club: WomensClub }) => {
  const [scoutTab, setScoutTab] = useState<'database'|'watchlist'|'reports'>('database');
  const [filterPosition, setFilterPosition] = useState('All');
  const [filterLeague, setFilterLeague] = useState('All');
  const [filterAvail, setFilterAvail] = useState('All');
  const [maxSalaryFilter, setMaxSalaryFilter] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<number|null>(null);
  const FSR_HEADROOM = club.fsrHeadroom ?? 380000;
  const fmtS = (n: number) => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n);

  const players = [
    {id:1,name:'Freya Johansson',age:24,nat:'🇸🇪',pos:'CM',league:'WSL',club:'Leicester W',salary:52000,avail:'Contract expires Jun 2026',wyscout:7.8,xG:0.14,xA:0.31,progPasses:42,aerials:58,tackles:3.2,rating:'A',tags:['Ball-playing','High press','Technical']},
    {id:2,name:'Amara Diallo',age:22,nat:'🇫🇷',pos:'FW',league:'D1 Arkema',club:'Bordeaux W',salary:44000,avail:'Free agent',wyscout:7.4,xG:0.38,xA:0.12,progPasses:18,aerials:62,tackles:1.1,rating:'A',tags:['Pace','In behind','Clinical']},
    {id:3,name:'Lena Müller',age:26,nat:'🇩🇪',pos:'LB',league:'Frauen-Bundesliga',club:'Hoffenheim W',salary:62000,avail:'Approach made',wyscout:7.6,xG:0.06,xA:0.28,progPasses:38,aerials:44,tackles:4.8,rating:'A',tags:['Overlapping','Delivery','Defensive']},
    {id:4,name:'Niamh Gallagher',age:28,nat:'🇮🇪',pos:'CB',league:'WSL',club:'Everton W',salary:58000,avail:'Contract expires Jun 2026',wyscout:7.2,xG:0.04,xA:0.08,progPasses:22,aerials:78,tackles:5.1,rating:'B',tags:['Aerial','Leadership','Positional']},
    {id:5,name:'Chloe Dubois',age:23,nat:'🇫🇷',pos:'FW',league:'D1 Arkema',club:'Montpellier W',salary:48000,avail:'Scouting only',wyscout:7.5,xG:0.44,xA:0.19,progPasses:14,aerials:51,tackles:0.9,rating:'A',tags:['Pace','Dribbling','Pressing']},
    {id:6,name:'Rosa Lindqvist',age:25,nat:'🇸🇪',pos:'CB',league:'WSL',club:'Brighton W',salary:54000,avail:'Watchlist',wyscout:6.9,xG:0.03,xA:0.06,progPasses:19,aerials:82,tackles:4.4,rating:'B',tags:['Positional','Ball-playing']},
    {id:7,name:'Kezia Okafor',age:27,nat:'🇳🇬',pos:'FW',league:'NWSL',club:'Portland Thorns',salary:88000,avail:'Fee required (est. £45k)',wyscout:8.1,xG:0.51,xA:0.22,progPasses:20,aerials:66,tackles:1.4,rating:'A+',tags:['Physical','Aerial','Clinical','Leadership']},
    {id:8,name:'Yuki Tanaka',age:21,nat:'🇯🇵',pos:'AM',league:'NWSL',club:'San Diego Wave',salary:46000,avail:'Loan available',wyscout:7.3,xG:0.22,xA:0.38,progPasses:48,aerials:29,tackles:2.1,rating:'A',tags:['Creative','Final third','Technical']},
    {id:9,name:'Isla Brennan',age:30,nat:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',pos:'DM',league:'WSL',club:'Aston Villa W',salary:61000,avail:'Watchlist',wyscout:7.1,xG:0.05,xA:0.14,progPasses:31,aerials:55,tackles:6.2,rating:'B',tags:['Defensive','Positional','Leadership']},
    {id:10,name:'Marta Sousa',age:24,nat:'🇵🇹',pos:'LW',league:'D1 Arkema',club:'PSG Féminines',salary:72000,avail:'Scouting only',wyscout:7.9,xG:0.28,xA:0.41,progPasses:36,aerials:33,tackles:2.8,rating:'A',tags:['Pace','Delivery','Creative','Dribbling']},
    {id:11,name:'Bex Calder',age:22,nat:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',pos:'RB',league:"Women's Champ",club:'Crystal Palace W',salary:32000,avail:'Free agent',wyscout:6.8,xG:0.04,xA:0.18,progPasses:28,aerials:41,tackles:3.9,rating:'B',tags:['Overlapping','Energy','High press']},
    {id:12,name:'Sofía Reyes',age:26,nat:'🇲🇽',pos:'GK',league:'NWSL',club:'Kansas City',salary:55000,avail:'Contract expires Dec 2026',wyscout:7.4,xG:null,xA:null,progPasses:null,aerials:null,tackles:null,rating:'A',tags:['Shot-stopping','Distribution','Leadership'],saves:4.2,savePct:74},
    {id:13,name:'Hana Novak',age:25,nat:'🇨🇿',pos:'CM',league:'Frauen-Bundesliga',club:'Bayern Munich W',salary:68000,avail:'Scouting only',wyscout:7.7,xG:0.11,xA:0.29,progPasses:44,aerials:48,tackles:4.1,rating:'A',tags:['Box-to-box','High press','Technical']},
    {id:14,name:'Precious Nwosu',age:20,nat:'🇳🇬',pos:'FW',league:"Women's Champ",club:'Sheffield Utd W',salary:28000,avail:'Fee required (est. £12k)',wyscout:7.0,xG:0.41,xA:0.08,progPasses:12,aerials:58,tackles:1.2,rating:'B',tags:['Pace','Physical','Potential']},
    {id:15,name:'Elin Ström',age:27,nat:'🇸🇪',pos:'RW',league:'WSL',club:'Liverpool W',salary:74000,avail:'Watchlist',wyscout:7.8,xG:0.32,xA:0.44,progPasses:34,aerials:38,tackles:2.6,rating:'A',tags:['Delivery','Dribbling','Set piece']},
  ];

  const positions = ['All','GK','CB','LB','RB','DM','CM','AM','LW','RW','FW'];
  const leagues = ['All','WSL',"Women's Champ",'NWSL','D1 Arkema','Frauen-Bundesliga'];
  const availOpts = ['All','Free agent','Contract expires Jun 2026','Loan available','Fee required'];

  const filtered = players.filter(p => {
    const pm = filterPosition==='All'||p.pos===filterPosition;
    const lm = filterLeague==='All'||p.league===filterLeague;
    const sm = !maxSalaryFilter||p.salary<=Number(maxSalaryFilter);
    const am = filterAvail==='All'||p.avail.toLowerCase().includes(filterAvail.toLowerCase());
    return pm&&lm&&sm&&am;
  });

  const ratingColor = (r: string) => r==='A+'?'bg-pink-600/30 text-pink-300 border border-pink-600/40':r==='A'?'bg-purple-600/20 text-purple-300':'bg-gray-800 text-gray-400';
  const selectedP = selectedPlayer!==null?players.find(p=>p.id===selectedPlayer):null;
  const watchlist = players.filter(p=>[1,2,3,7,8].includes(p.id));

  return (
    <div>
      <SectionHeader title="Scouting" subtitle="Lumio Scout · WSL · Women's Championship · NWSL · D1 Arkema · Frauen-Bundesliga" icon="🔭"/>
      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {[{id:'database',label:'Player Database',icon:'🔍'},{id:'watchlist',label:'Watchlist',icon:'⭐'},{id:'reports',label:'Scout Reports',icon:'📝'}].map(t=>(
          <button key={t.id} onClick={()=>{setScoutTab(t.id as typeof scoutTab);setSelectedPlayer(null)}}
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px ${scoutTab===t.id?'border-pink-500 text-pink-400':'border-transparent text-gray-500 hover:text-gray-300'}`}>
            <span>{t.icon}</span>{t.label}
            {t.id==='watchlist'&&<span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-pink-600/20 text-pink-400">{watchlist.length}</span>}
          </button>
        ))}
      </div>

      {scoutTab==='database'&&(
        <div>
          {selectedP&&(
            <div className="bg-[#0D1117] border border-pink-600/40 rounded-xl p-5 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1"><span className="text-lg">{selectedP.nat}</span><h3 className="text-base font-bold text-white">{selectedP.name}</h3><span className={`text-[10px] px-2 py-0.5 rounded font-bold ${ratingColor(selectedP.rating)}`}>{selectedP.rating}</span></div>
                  <p className="text-xs text-gray-400">{selectedP.pos} · {selectedP.club} · {selectedP.league} · Age {selectedP.age}</p>
                </div>
                <button onClick={()=>setSelectedPlayer(null)} className="text-gray-600 hover:text-gray-400 text-lg">✕</button>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2.5 text-center"><div className="text-lg font-bold text-pink-400">{selectedP.wyscout}</div><div className="text-[10px] text-gray-500">Lumio Scout</div></div>
                {selectedP.pos!=='GK'?<>
                  <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2.5 text-center"><div className="text-lg font-bold text-purple-400">{selectedP.xG?.toFixed(2)??'—'}</div><div className="text-[10px] text-gray-500">xG/90</div></div>
                  <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2.5 text-center"><div className="text-lg font-bold text-blue-400">{selectedP.xA?.toFixed(2)??'—'}</div><div className="text-[10px] text-gray-500">xA/90</div></div>
                  <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2.5 text-center"><div className="text-lg font-bold text-teal-400">{selectedP.progPasses??'—'}</div><div className="text-[10px] text-gray-500">Prog. passes</div></div>
                  <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2.5 text-center"><div className="text-lg font-bold text-amber-400">{selectedP.aerials??'—'}%</div><div className="text-[10px] text-gray-500">Aerial %</div></div>
                  <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2.5 text-center"><div className="text-lg font-bold text-green-400">{selectedP.tackles??'—'}</div><div className="text-[10px] text-gray-500">Tackles pg</div></div>
                </>:<>
                  <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2.5 text-center"><div className="text-lg font-bold text-purple-400">{(selectedP as typeof selectedP & {saves?:number}).saves??'—'}</div><div className="text-[10px] text-gray-500">Saves pg</div></div>
                  <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2.5 text-center"><div className="text-lg font-bold text-blue-400">{(selectedP as typeof selectedP & {savePct?:number}).savePct??'—'}%</div><div className="text-[10px] text-gray-500">Save %</div></div>
                </>}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">{selectedP.tags.map(tag=><span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-pink-600/10 text-pink-400 border border-pink-600/20">{tag}</span>)}</div>
              <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-white">FSR Impact</span><span className={`text-xs font-bold ${FSR_HEADROOM-selectedP.salary>0?'text-green-400':'text-red-400'}`}>{FSR_HEADROOM-selectedP.salary>0?'✓ Within cap':'✗ Exceeds cap'}</span></div>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex justify-between"><span>Headroom</span><span className="text-white">{fmtS(FSR_HEADROOM)}</span></div>
                  <div className="flex justify-between"><span>Salary est.</span><span className="text-pink-400">{fmtS(selectedP.salary)}/yr</span></div>
                  <div className="flex justify-between border-t border-gray-800 pt-1 mt-1"><span>After signing</span><span className={FSR_HEADROOM-selectedP.salary>100000?'text-green-400 font-bold':FSR_HEADROOM-selectedP.salary>0?'text-amber-400 font-bold':'text-red-400 font-bold'}>{fmtS(FSR_HEADROOM-selectedP.salary)}</span></div>
                </div>
              </div>
              <div className="flex items-center justify-between"><div><span className="text-[10px] text-gray-500">Availability: </span><span className="text-xs text-amber-400">{selectedP.avail}</span></div><div className="flex gap-2"><button className="px-3 py-1.5 rounded-lg text-xs bg-gray-800 text-gray-300 hover:text-white">Add to watchlist</button><button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white">Request report →</button></div></div>
            </div>
          )}
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><label className="text-[10px] text-gray-500 mb-1.5 block uppercase tracking-wider">Position</label><div className="flex flex-wrap gap-1">{positions.map(p=><button key={p} onClick={()=>setFilterPosition(p)} className={`px-2 py-0.5 rounded text-[10px] font-medium ${filterPosition===p?'bg-pink-600 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>{p}</button>)}</div></div>
              <div><label className="text-[10px] text-gray-500 mb-1.5 block uppercase tracking-wider">League</label><div className="flex flex-wrap gap-1">{leagues.map(l=><button key={l} onClick={()=>setFilterLeague(l)} className={`px-2 py-0.5 rounded text-[10px] font-medium ${filterLeague===l?'bg-pink-600 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>{l}</button>)}</div></div>
              <div><label className="text-[10px] text-gray-500 mb-1.5 block uppercase tracking-wider">Availability</label><div className="flex flex-wrap gap-1">{availOpts.map(a=><button key={a} onClick={()=>setFilterAvail(a)} className={`px-2 py-0.5 rounded text-[10px] font-medium ${filterAvail===a?'bg-pink-600 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>{a.length>18?a.slice(0,18)+'…':a}</button>)}</div></div>
              <div><label className="text-[10px] text-gray-500 mb-1.5 block uppercase tracking-wider">Max Salary (FSR: {fmtS(FSR_HEADROOM)})</label><input type="number" value={maxSalaryFilter} onChange={e=>setMaxSalaryFilter(e.target.value)} placeholder="e.g. 65000" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white w-full focus:outline-none focus:border-pink-500"/></div>
            </div>
            <div className="mt-3 flex items-center justify-between"><span className="text-[10px] text-gray-500">{filtered.length} players matching</span><button onClick={()=>{setFilterPosition('All');setFilterLeague('All');setFilterAvail('All');setMaxSalaryFilter('')}} className="text-[10px] text-gray-600 hover:text-gray-400">Clear ✕</button></div>
          </div>
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-gray-500 text-[10px] border-b border-gray-800 bg-gray-900/30 uppercase tracking-wider">
              <th className="text-left p-3">Player</th><th className="text-left p-3">Club / League</th><th className="text-center p-3">Pos</th><th className="text-center p-3">Age</th><th className="text-center p-3">Rating</th><th className="text-center p-3">Lumio Scout</th><th className="text-center p-3">xG</th><th className="text-center p-3">xA</th><th className="text-left p-3">Salary</th><th className="text-left p-3">FSR after</th><th className="text-left p-3">Availability</th><th className="p-3"></th>
            </tr></thead><tbody>
              {filtered.length===0?<tr><td colSpan={12} className="p-8 text-center text-gray-600 text-sm">No players match filters.</td></tr>:filtered.map(p=>{
                const ha=FSR_HEADROOM-p.salary;const hc=ha>200000?'text-green-400':ha>80000?'text-amber-400':'text-red-400';
                const ac=p.avail==='Free agent'?'text-green-400':p.avail.includes('expires')?'text-amber-400':p.avail==='Loan available'?'text-blue-400':p.avail.includes('Fee')?'text-orange-400':'text-gray-500';
                return<tr key={p.id} onClick={()=>setSelectedPlayer(selectedPlayer===p.id?null:p.id)} className={`border-b border-gray-800/50 cursor-pointer transition-colors ${selectedPlayer===p.id?'bg-pink-600/5 border-pink-600/20':'hover:bg-white/[0.02]'}`}>
                  <td className="p-3"><div className="flex items-center gap-2"><span className="text-sm">{p.nat}</span><span className="text-gray-200 font-medium text-xs">{p.name}</span></div><div className="flex flex-wrap gap-1 mt-1">{p.tags.slice(0,2).map(t=><span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-500">{t}</span>)}</div></td>
                  <td className="p-3"><div className="text-xs text-gray-300">{p.club}</div><div className="text-[10px] text-gray-600">{p.league}</div></td>
                  <td className="p-3 text-center"><span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">{p.pos}</span></td>
                  <td className="p-3 text-center text-xs text-gray-400">{p.age}</td>
                  <td className="p-3 text-center"><span className={`text-[10px] px-2 py-0.5 rounded font-bold ${ratingColor(p.rating)}`}>{p.rating}</span></td>
                  <td className="p-3 text-center text-xs font-bold text-pink-400">{p.wyscout}</td>
                  <td className="p-3 text-center text-xs text-purple-400">{p.xG?.toFixed(2)??'—'}</td>
                  <td className="p-3 text-center text-xs text-blue-400">{p.xA?.toFixed(2)??'—'}</td>
                  <td className="p-3 text-xs text-gray-300">{fmtS(p.salary)}/yr</td>
                  <td className={`p-3 text-xs font-medium ${hc}`}>{fmtS(ha)}</td>
                  <td className={`p-3 text-[10px] font-medium ${ac}`}>{p.avail}</td>
                  <td className="p-3 text-gray-600 text-xs">→</td>
                </tr>;
              })}
            </tbody></table></div>
            <div className="p-3 border-t border-gray-800 text-[10px] text-gray-600">Lumio Scout Women&apos;s database · Salaries estimated · FSR based on {club.league} headroom</div>
          </div>
        </div>
      )}

      {scoutTab==='watchlist'&&(
        <div className="space-y-4">
          <div className="flex items-center justify-between"><p className="text-xs text-gray-500">{watchlist.length} players on watchlist</p><button className="text-xs text-pink-400 hover:text-pink-300">Export watchlist →</button></div>
          {watchlist.map(p=>{
            const ha=FSR_HEADROOM-p.salary;const hc=ha>200000?'text-green-400':ha>80000?'text-amber-400':'text-red-400';
            return<div key={p.id} className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 hover:border-pink-600/30 transition-colors">
              <div className="flex items-start justify-between mb-3"><div className="flex items-center gap-3"><span className="text-xl">{p.nat}</span><div><div className="flex items-center gap-2"><span className="text-sm font-bold text-white">{p.name}</span><span className={`text-[10px] px-2 py-0.5 rounded font-bold ${ratingColor(p.rating)}`}>{p.rating}</span></div><p className="text-xs text-gray-500">{p.pos} · {p.club} · {p.league} · Age {p.age}</p></div></div><div className="text-right"><div className="text-sm font-bold text-pink-400">{p.wyscout}</div><div className="text-[10px] text-gray-600">Lumio Scout</div></div></div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {p.pos!=='GK'?<><div className="text-center"><div className="text-xs font-bold text-purple-400">{p.xG?.toFixed(2)}</div><div className="text-[9px] text-gray-600">xG/90</div></div><div className="text-center"><div className="text-xs font-bold text-blue-400">{p.xA?.toFixed(2)}</div><div className="text-[9px] text-gray-600">xA/90</div></div><div className="text-center"><div className="text-xs font-bold text-teal-400">{p.progPasses}</div><div className="text-[9px] text-gray-600">Prog</div></div><div className="text-center"><div className="text-xs font-bold text-amber-400">{p.tackles}</div><div className="text-[9px] text-gray-600">Tackles</div></div></>:<><div className="text-center"><div className="text-xs font-bold text-purple-400">{(p as typeof p&{saves?:number}).saves??'—'}</div><div className="text-[9px] text-gray-600">Saves</div></div><div className="text-center"><div className="text-xs font-bold text-blue-400">{(p as typeof p&{savePct?:number}).savePct??'—'}%</div><div className="text-[9px] text-gray-600">Save%</div></div></>}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">{p.tags.map(tag=><span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-pink-600/10 text-pink-400 border border-pink-600/20">{tag}</span>)}</div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-800"><div className="space-y-0.5"><div className="text-xs text-gray-400">Salary: <span className="text-white font-medium">{fmtS(p.salary)}/yr</span></div><div className={`text-xs font-medium ${hc}`}>FSR after: {fmtS(ha)}</div><div className="text-xs text-amber-400">{p.avail}</div></div><div className="flex gap-2"><button className="px-3 py-1.5 rounded-lg text-xs bg-gray-800 text-gray-400 hover:text-white">Remove ✕</button><button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white">Full report →</button></div></div>
            </div>;
          })}
        </div>
      )}

      {scoutTab==='reports'&&(
        <div className="space-y-5">
          <div className="flex items-center justify-between"><p className="text-xs text-gray-500">3 scout reports filed</p><button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-pink-600/20 text-pink-400 border border-pink-600/30">+ New Report</button></div>
          {[
            {player:'Kezia Okafor',pos:'FW',club:'Portland Thorns (NWSL)',nat:'🇳🇬',scout:'Mark Hendry',date:'4 Apr 2026',match:'Portland vs San Diego',rating:'A+',rec:'Sign — priority target',summary:'Dominant aerial presence. Clinical finish — brace. Showed leadership organising front line.',strengths:['Aerial dominance — 7/9 duels won','Clinical finishing (2 goals)','High press — 8 defensive actions','Leadership — directed press triggers'],concerns:['Salary est. £88k — near FSR ceiling','Transfer fee likely £40–50k','NWSL contract runs to Dec 2026'],score:{technique:8,athleticism:9,pressing:9,finishing:8,leadership:9}},
            {player:'Freya Johansson',pos:'CM',club:'Leicester W (WSL)',nat:'🇸🇪',scout:'Lisa Park',date:'29 Mar 2026',match:'Leicester W vs Bristol City W',rating:'A',rec:'Approach — contract expiring',summary:'Composed in possession. Dictated tempo. 11 forward passes into final third. Defensively disciplined.',strengths:['Progressive passing — 11 into final third','Positional discipline','Comfortable both feet','Technical under press'],concerns:['Not aerial threat','Recovery pace vs physical FW','May attract WSL top-6 interest'],score:{technique:9,athleticism:7,pressing:8,finishing:6,leadership:7}},
            {player:'Amara Diallo',pos:'FW',club:'Bordeaux W (D1 Arkema)',nat:'🇫🇷',scout:'Mark Hendry',date:'22 Mar 2026',match:'Bordeaux vs Montpellier',rating:'A',rec:'Sign immediately — free agent',summary:'Electric pace on the left. Ran in behind 6 times. Pressing from front effective. Free agent — exceptional value.',strengths:['Blistering pace — consistent threat','Pressing from front (3 ball recoveries)','Free agent — no fee, £44k salary','Young (22) with significant upside'],concerns:['Decision-making inconsistent','Aerial minimal — 2/8 duels','D1→WSL adaptation 3–4 months'],score:{technique:7,athleticism:9,pressing:8,finishing:7,leadership:6}},
          ].map((r,i)=>(
            <div key={i} className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4"><div className="flex items-center gap-3"><span className="text-2xl">{r.nat}</span><div><div className="flex items-center gap-2 mb-0.5"><span className="text-sm font-bold text-white">{r.player}</span><span className={`text-[10px] px-2 py-0.5 rounded font-bold ${ratingColor(r.rating)}`}>{r.rating}</span></div><p className="text-xs text-gray-500">{r.pos} · {r.club} · {r.match}</p><p className="text-[10px] text-gray-600">Scout: {r.scout} · {r.date}</p></div></div><div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${r.rec.startsWith('Sign')?'bg-green-600/20 text-green-400 border border-green-600/30':'bg-pink-600/20 text-pink-400 border border-pink-600/30'}`}>{r.rec}</div></div>
              <p className="text-xs text-gray-300 mb-4 leading-relaxed">{r.summary}</p>
              <div className="mb-4"><h4 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Attribute Scores</h4><div className="space-y-1.5">{Object.entries(r.score).map(([attr,val])=><div key={attr} className="flex items-center gap-3"><span className="text-[10px] text-gray-500 w-20 capitalize">{attr}</span><div className="flex-1 bg-gray-800 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-pink-500" style={{width:`${(val/10)*100}%`}}/></div><span className="text-[10px] font-bold text-pink-400 w-6 text-right">{val}</span></div>)}</div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="bg-green-600/5 border border-green-600/20 rounded-lg p-3"><h4 className="text-[10px] font-bold text-green-400 mb-2">Strengths</h4><div className="space-y-1">{r.strengths.map((s,j)=><div key={j} className="flex items-start gap-1.5 text-xs text-gray-300"><span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>{s}</div>)}</div></div>
                <div className="bg-amber-600/5 border border-amber-600/20 rounded-lg p-3"><h4 className="text-[10px] font-bold text-amber-400 mb-2">Concerns</h4><div className="space-y-1">{r.concerns.map((c,j)=><div key={j} className="flex items-start gap-1.5 text-xs text-gray-300"><span className="text-amber-400 mt-0.5 flex-shrink-0">⚠</span>{c}</div>)}</div></div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-800"><button className="px-3 py-1.5 rounded-lg text-xs bg-gray-800 text-gray-400 hover:text-white">Share with DoF</button><button className="px-3 py-1.5 rounded-lg text-xs bg-gray-800 text-gray-400 hover:text-white">Add to watchlist</button><button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white">Initiate approach →</button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── ANALYTICS VIEW ─────────────────────────────────────────────────────────
const AnalyticsView = ({ club: _club }: { club: WomensClub }) => {
  const [activeChart, setActiveChart] = useState<'xg' | 'pressing' | 'progressive' | 'shotmap'>('xg')

  const WSL_AVG_XG = 1.24
  const WSL_AVG_XGA = 1.31
  const WSL_AVG_PPDA = 9.8

  const matchData = [
    { match: 'Man City W',    venue: 'H', result: 'L', score: '1–2', xG: 0.98, xGA: 1.87, ppda: 12.1, progPasses: 28 },
    { match: 'Chelsea W',     venue: 'A', result: 'L', score: '0–3', xG: 0.22, xGA: 2.94, ppda: 16.4, progPasses: 14 },
    { match: 'Arsenal W',     venue: 'H', result: 'D', score: '1–1', xG: 0.91, xGA: 0.88, ppda: 11.2, progPasses: 22 },
    { match: 'Liverpool W',   venue: 'A', result: 'W', score: '2–1', xG: 1.62, xGA: 0.74, ppda: 7.8,  progPasses: 36 },
    { match: 'Brighton W',    venue: 'H', result: 'L', score: '0–1', xG: 0.31, xGA: 0.87, ppda: 14.2, progPasses: 18 },
    { match: 'Aston Villa W', venue: 'A', result: 'W', score: '3–1', xG: 2.14, xGA: 0.62, ppda: 6.9,  progPasses: 41 },
    { match: 'Everton W',     venue: 'H', result: 'W', score: '2–0', xG: 1.74, xGA: 0.28, ppda: 8.1,  progPasses: 38 },
    { match: 'Leicester W',   venue: 'A', result: 'D', score: '2–2', xG: 1.38, xGA: 1.41, ppda: 9.4,  progPasses: 31 },
    { match: 'Tottenham W',   venue: 'H', result: 'W', score: '4–0', xG: 2.88, xGA: 0.14, ppda: 5.2,  progPasses: 52 },
    { match: 'West Ham W',    venue: 'A', result: 'W', score: '1–0', xG: 1.12, xGA: 0.44, ppda: 8.8,  progPasses: 33 },
  ]

  const avgXG  = matchData.reduce((s, m) => s + m.xG,  0) / matchData.length
  const avgXGA = matchData.reduce((s, m) => s + m.xGA, 0) / matchData.length
  const avgPPDA = matchData.reduce((s, m) => s + m.ppda, 0) / matchData.length
  const avgProg = matchData.reduce((s, m) => s + m.progPasses, 0) / matchData.length

  return (
    <div>
      <SectionHeader title="Analytics" subtitle="Lumio Data Women's API · xG · Pressing Intensity · Progressive Passes" icon="📉" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="xG per 90 (season)" value={avgXG.toFixed(2)} sub={`WSL avg: ${WSL_AVG_XG} — ${avgXG >= WSL_AVG_XG ? '↑ above avg' : '↓ below avg'}`} color={avgXG >= WSL_AVG_XG ? 'green' : 'amber'} />
        <StatCard label="xGA per 90 (season)" value={avgXGA.toFixed(2)} sub={`WSL avg: ${WSL_AVG_XGA} — ${avgXGA <= WSL_AVG_XGA ? '↑ better than avg' : '↓ worse than avg'}`} color={avgXGA <= WSL_AVG_XGA ? 'green' : 'red'} />
        <StatCard label="PPDA (pressing)" value={avgPPDA.toFixed(1)} sub={`WSL avg: ${WSL_AVG_PPDA} — lower = more pressing`} color={avgPPDA <= WSL_AVG_PPDA ? 'green' : 'amber'} />
        <StatCard label="Progressive Passes" value={Math.round(avgProg)} sub="Per match average" color="blue" />
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-800 overflow-x-auto">
        {[
          { id: 'xg',          label: 'xG Timeline',          icon: '⚽' },
          { id: 'pressing',    label: 'Pressing Intensity',    icon: '🔥' },
          { id: 'progressive', label: 'Progressive Passes',    icon: '➡️' },
          { id: 'shotmap',     label: 'Shot Map',              icon: '🎯' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveChart(t.id as typeof activeChart)}
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px whitespace-nowrap ${activeChart === t.id ? 'border-pink-500 text-pink-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {activeChart === 'xg' && (() => {
        const W = 640, H = 220, padL = 36, padR = 16, padT = 20, padB = 40
        const innerW = W - padL - padR, innerH = H - padT - padB, maxVal = 3.2
        const stepX = innerW / (matchData.length - 1)
        const xGPath  = matchData.map((m, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * stepX} ${padT + innerH - (m.xG  / maxVal) * innerH}`).join(' ')
        const xGAPath = matchData.map((m, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * stepX} ${padT + innerH - (m.xGA / maxVal) * innerH}`).join(' ')
        const wslY = padT + innerH - (WSL_AVG_XG / maxVal) * innerH
        const wslYA = padT + innerH - (WSL_AVG_XGA / maxVal) * innerH
        return (
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">xG Per Match — Oakridge Women vs WSL Average</h3>
                <p className="text-xs text-gray-500 mt-0.5">Expected goals for (pink) and against (purple). Dashed = WSL average.</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] flex-shrink-0">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block bg-pink-500 rounded" />xG For</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block bg-purple-500 rounded" />xG Against</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-px inline-block border-t border-dashed border-teal-500" />WSL Avg</span>
              </div>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="overflow-visible">
              {[0, 0.25, 0.5, 0.75, 1].map((t, i) => <line key={i} x1={padL} x2={W - padR} y1={padT + innerH - t * innerH} y2={padT + innerH - t * innerH} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />)}
              {[0, 0.8, 1.6, 2.4, 3.2].map((v, i) => <text key={i} x={padL - 6} y={padT + innerH - (v / maxVal) * innerH + 3} fontSize="9" fill="#6B7280" textAnchor="end">{v.toFixed(1)}</text>)}
              <line x1={padL} x2={W - padR} y1={wslY} y2={wslY} stroke="#0D9488" strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
              <line x1={padL} x2={W - padR} y1={wslYA} y2={wslYA} stroke="#0D9488" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />
              <path d={xGPath} fill="none" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {matchData.map((m, i) => <circle key={`f${i}`} cx={padL + i * stepX} cy={padT + innerH - (m.xG / maxVal) * innerH} r="3.5" fill="#EC4899" />)}
              <path d={xGAPath} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {matchData.map((m, i) => <circle key={`a${i}`} cx={padL + i * stepX} cy={padT + innerH - (m.xGA / maxVal) * innerH} r="3.5" fill="#8B5CF6" />)}
              {matchData.map((m, i) => <text key={m.match} x={padL + i * stepX} y={H - 6} fontSize="8" fill="#6B7280" textAnchor="middle">{m.match.replace(' W', '').slice(0, 8)}</text>)}
              {matchData.map((m, i) => <text key={`r${i}`} x={padL + i * stepX} y={padT - 6} fontSize="8" fill={m.result === 'W' ? '#22C55E' : m.result === 'D' ? '#F59E0B' : '#EF4444'} textAnchor="middle" fontWeight="bold">{m.result}</text>)}
            </svg>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-gray-600 border-b border-gray-800">
                  <th className="text-left pb-2">Match</th><th className="text-center pb-2">H/A</th><th className="text-center pb-2">Result</th><th className="text-center pb-2">xG</th><th className="text-center pb-2">xGA</th><th className="text-center pb-2">xG Diff</th>
                </tr></thead>
                <tbody>
                  {matchData.map((m, i) => {
                    const diff = m.xG - m.xGA
                    return (
                      <tr key={i} className="border-b border-gray-800/40">
                        <td className="py-1.5 text-gray-300">{m.match}</td>
                        <td className="py-1.5 text-center text-gray-500">{m.venue}</td>
                        <td className="py-1.5 text-center"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${m.result === 'W' ? 'bg-green-600/20 text-green-400' : m.result === 'D' ? 'bg-amber-600/20 text-amber-400' : 'bg-red-600/20 text-red-400'}`}>{m.result} {m.score}</span></td>
                        <td className="py-1.5 text-center text-pink-400 font-medium">{m.xG.toFixed(2)}</td>
                        <td className="py-1.5 text-center text-purple-400 font-medium">{m.xGA.toFixed(2)}</td>
                        <td className={`py-1.5 text-center font-bold ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-400'}`}>{diff > 0 ? '+' : ''}{diff.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-800 text-[10px] text-gray-600">Data source: Lumio Data Women&apos;s API · 2025/26 WSL Season</div>
          </div>
        )
      })()}

      {activeChart === 'pressing' && (() => {
        const W = 640, H = 200, padL = 40, padR = 16, padT = 20, padB = 40
        const innerW = W - padL - padR, innerH = H - padT - padB, maxPPDA = 18
        const barW = (innerW / matchData.length) * 0.6, barGap = innerW / matchData.length
        return (
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
            <div className="mb-2">
              <h3 className="text-sm font-bold text-white">Pressing Intensity — PPDA Per Match</h3>
              <p className="text-xs text-gray-500 mt-0.5">PPDA = Passes Allowed Per Defensive Action. Lower = more intense press. WSL avg: {WSL_AVG_PPDA}. Oakridge avg: {avgPPDA.toFixed(1)}.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Oakridge (season avg)', value: avgPPDA.toFixed(1), color: '#EC4899', note: avgPPDA < WSL_AVG_PPDA ? '↑ More pressing than avg' : '↓ Less pressing than avg' },
                { label: 'WSL Average', value: String(WSL_AVG_PPDA), color: '#0D9488', note: 'Benchmark' },
                { label: 'WSL Top 3 avg', value: '7.2', color: '#8B5CF6', note: 'Chelsea, Arsenal, Man City' },
              ].map(c => (
                <div key={c.label} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold mb-0.5" style={{ color: c.color }}>{c.value}</div>
                  <div className="text-[10px] text-gray-500">{c.label}</div>
                  <div className="text-[9px] text-gray-600 mt-0.5">{c.note}</div>
                </div>
              ))}
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="overflow-visible">
              {[0, 0.25, 0.5, 0.75, 1].map((t, i) => <line key={i} x1={padL} x2={W - padR} y1={padT + t * innerH} y2={padT + t * innerH} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />)}
              {[0, 6, 9, 12, 18].map((v, i) => <text key={i} x={padL - 6} y={padT + (v / maxPPDA) * innerH + 3} fontSize="9" fill="#6B7280" textAnchor="end">{v}</text>)}
              <line x1={padL} x2={W - padR} y1={padT + (WSL_AVG_PPDA / maxPPDA) * innerH} y2={padT + (WSL_AVG_PPDA / maxPPDA) * innerH} stroke="#0D9488" strokeWidth="1.5" strokeDasharray="5 3" />
              <text x={W - padR + 2} y={padT + (WSL_AVG_PPDA / maxPPDA) * innerH + 3} fontSize="8" fill="#0D9488">avg</text>
              {matchData.map((m, i) => {
                const barH = (m.ppda / maxPPDA) * innerH
                const x = padL + i * barGap + (barGap - barW) / 2
                const color = m.ppda <= 8 ? '#22C55E' : m.ppda <= 11 ? '#EC4899' : m.ppda <= 14 ? '#F59E0B' : '#EF4444'
                return (
                  <g key={i}>
                    <rect x={x} y={padT + innerH - barH} width={barW} height={barH} fill={color} opacity="0.8" rx="2" />
                    <text x={x + barW / 2} y={padT + innerH - barH - 4} fontSize="8" fill={color} textAnchor="middle" fontWeight="bold">{m.ppda}</text>
                    <text x={x + barW / 2} y={H - 6} fontSize="7.5" fill="#6B7280" textAnchor="middle">{m.match.replace(' W', '').slice(0, 7)}</text>
                    <text x={x + barW / 2} y={H - 16} fontSize="7" fill={m.result === 'W' ? '#22C55E' : m.result === 'D' ? '#F59E0B' : '#EF4444'} textAnchor="middle" fontWeight="bold">{m.result}</text>
                  </g>
                )
              })}
            </svg>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-3">
                <div className="text-xs font-bold text-green-400 mb-1">Best pressing performances</div>
                <div className="text-xs text-gray-400">Tottenham W (PPDA 5.2) and Aston Villa W (6.9) — both resulted in wins with high xG.</div>
              </div>
              <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-3">
                <div className="text-xs font-bold text-red-400 mb-1">Worst pressing performances</div>
                <div className="text-xs text-gray-400">Chelsea A (PPDA 16.4) and Brighton H (14.2) — both losses. Low press allowed opposition to build freely.</div>
              </div>
            </div>
            <div className="mt-3 text-[10px] text-gray-600">Color: 🟢 Elite (&lt;8) · 🩷 Good (8–11) · 🟡 Average (11–14) · 🔴 Low (&gt;14)</div>
          </div>
        )
      })()}

      {activeChart === 'progressive' && (() => {
        const W = 640, H = 200, padL = 36, padR = 16, padT = 20, padB = 40
        const innerW = W - padL - padR, innerH = H - padT - padB, maxProg = 56
        const stepX = innerW / (matchData.length - 1)
        const progPath = matchData.map((m, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * stepX} ${padT + innerH - (m.progPasses / maxProg) * innerH}`).join(' ')
        const areaPath = `${progPath} L ${padL + (matchData.length - 1) * stepX} ${padT + innerH} L ${padL} ${padT + innerH} Z`
        return (
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Progressive Passes Per Match</h3>
                <p className="text-xs text-gray-500 mt-0.5">Passes that move the ball ≥10 yards toward goal. Season avg: {Math.round(avgProg)}/match. WSL avg: 29.</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-pink-400">{Math.round(avgProg)}</div>
                <div className="text-[10px] text-gray-500">season avg</div>
              </div>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="overflow-visible">
              {[0, 0.25, 0.5, 0.75, 1].map((t, i) => <line key={i} x1={padL} x2={W - padR} y1={padT + innerH - t * innerH} y2={padT + innerH - t * innerH} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />)}
              {[0, 14, 28, 42, 56].map((v, i) => <text key={i} x={padL - 6} y={padT + innerH - (v / maxProg) * innerH + 3} fontSize="9" fill="#6B7280" textAnchor="end">{v}</text>)}
              <line x1={padL} x2={W - padR} y1={padT + innerH - (29 / maxProg) * innerH} y2={padT + innerH - (29 / maxProg) * innerH} stroke="#0D9488" strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
              <path d={areaPath} fill="#EC4899" opacity="0.07" />
              <path d={progPath} fill="none" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {matchData.map((m, i) => {
                const cx = padL + i * stepX, cy = padT + innerH - (m.progPasses / maxProg) * innerH
                return (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r="3.5" fill="#EC4899" />
                    <text x={cx} y={cy - 8} fontSize="8" fill="#EC4899" textAnchor="middle">{m.progPasses}</text>
                    <text x={cx} y={H - 6} fontSize="8" fill="#6B7280" textAnchor="middle">{m.match.replace(' W', '').slice(0, 7)}</text>
                    <text x={cx} y={H - 16} fontSize="7" fill={m.result === 'W' ? '#22C55E' : m.result === 'D' ? '#F59E0B' : '#EF4444'} textAnchor="middle" fontWeight="bold">{m.result}</text>
                  </g>
                )
              })}
            </svg>
            <div className="mt-4 bg-[#0a0c14] border border-gray-800 rounded-lg p-4">
              <h4 className="text-xs font-bold text-white mb-2">Key Insight — Progressive Passes vs Result</h4>
              <div className="space-y-1.5">
                {[
                  { threshold: '35+ progressive passes', record: '3W 0D 0L', color: 'green' },
                  { threshold: '25–34 progressive passes', record: '1W 2D 0L', color: 'amber' },
                  { threshold: 'Under 25 progressive passes', record: '0W 0D 4L', color: 'red' },
                ].map(r => (
                  <div key={r.threshold} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{r.threshold}</span>
                    <span className={`text-xs font-bold ${r.color === 'green' ? 'text-green-400' : r.color === 'amber' ? 'text-amber-400' : 'text-red-400'}`}>{r.record}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Strong correlation: 35+ progressive passes = 100% win rate. Below 25 = 0 wins this season.</p>
            </div>
            <div className="mt-3 text-[10px] text-gray-600">Data source: Lumio Data Women&apos;s API · Progressive pass = ≥10 yards toward goal</div>
          </div>
        )
      })()}

      {activeChart === 'shotmap' && (() => {
        const shots = [
          { x: 50, y: 8,  xg: 0.42, result: 'goal',  player: 'E. Zhang' },
          { x: 44, y: 14, xg: 0.18, result: 'saved',  player: 'P. Nair' },
          { x: 56, y: 14, xg: 0.22, result: 'saved',  player: 'A. Walsh' },
          { x: 38, y: 20, xg: 0.08, result: 'off target', player: 'L. Whitmore' },
          { x: 62, y: 22, xg: 0.06, result: 'off target', player: 'J. Osei' },
          { x: 50, y: 11, xg: 0.35, result: 'goal',   player: 'P. Nair' },
          { x: 47, y: 18, xg: 0.14, result: 'blocked', player: 'E. Zhang' },
          { x: 53, y: 16, xg: 0.19, result: 'saved',  player: 'A. Walsh' },
          { x: 72, y: 28, xg: 0.04, result: 'off target', player: 'L. Whitmore' },
          { x: 29, y: 30, xg: 0.03, result: 'blocked', player: 'C. Reed' },
          { x: 50, y: 6,  xg: 0.61, result: 'goal',   player: 'P. Nair' },
          { x: 58, y: 9,  xg: 0.38, result: 'saved',  player: 'E. Zhang' },
          { x: 43, y: 24, xg: 0.09, result: 'blocked', player: 'J. Osei' },
          { x: 65, y: 18, xg: 0.11, result: 'off target', player: 'A. Walsh' },
          { x: 50, y: 13, xg: 0.28, result: 'goal',   player: 'E. Zhang' },
        ]
        const PW = 500, PH = 340
        const lineColor = 'rgba(255,255,255,0.15)'
        const sx = (xPct: number) => (xPct / 100) * PW
        const sy = (yPct: number) => PH - (yPct / 50) * PH
        const dotColor = (result: string) => result === 'goal' ? '#22C55E' : result === 'saved' ? '#EC4899' : result === 'blocked' ? '#F59E0B' : '#6B7280'
        const totalXG = shots.reduce((s, sh) => s + sh.xg, 0)
        const goals = shots.filter(s => s.result === 'goal').length
        return (
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Shot Map — Season Aggregate</h3>
                <p className="text-xs text-gray-500 mt-0.5">{shots.length} shots · {goals} goals · Total xG: {totalXG.toFixed(2)} · Conversion: {((goals / shots.length) * 100).toFixed(0)}%</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] flex-shrink-0">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block bg-green-500" />Goal</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block bg-pink-500" />Saved</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block bg-amber-500" />Blocked</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block bg-gray-500" />Off target</span>
              </div>
            </div>
            <svg viewBox={`0 0 ${PW} ${PH}`} width="100%" style={{ maxHeight: 300 }}>
              <rect width={PW} height={PH} fill="#0a1a0a" rx="4" />
              <line x1={0} y1={0} x2={PW} y2={0} stroke={lineColor} strokeWidth="1.5" />
              <line x1={0} y1={0} x2={0} y2={PH} stroke={lineColor} strokeWidth="1.5" />
              <line x1={PW} y1={0} x2={PW} y2={PH} stroke={lineColor} strokeWidth="1.5" />
              <line x1={0} y1={PH} x2={PW} y2={PH} stroke={lineColor} strokeWidth="1.5" />
              {(() => {
                const paLeft = PW * 0.203, paRight = PW * 0.797, paTop = PH * 0.314
                return (
                  <>
                    <rect x={paLeft} y={paTop} width={paRight - paLeft} height={PH - paTop} fill="none" stroke={lineColor} strokeWidth="1.5" />
                    <rect x={PW * 0.368} y={PH * 0.882} width={PW * 0.264} height={PH * 0.118} fill="none" stroke={lineColor} strokeWidth="1" />
                    <rect x={PW * 0.424} y={PH - 8} width={PW * 0.152} height={10} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                    <circle cx={PW * 0.5} cy={PH * 0.765} r="2" fill={lineColor} />
                    <path d={`M ${PW*0.316} ${paTop} A ${PW*0.184} ${PW*0.184} 0 0 1 ${PW*0.684} ${paTop}`} fill="none" stroke={lineColor} strokeWidth="1" />
                  </>
                )
              })()}
              {shots.map((s, i) => {
                const r = Math.max(5, s.xg * 22)
                return <circle key={i} cx={sx(s.x)} cy={sy(s.y)} r={r} fill={dotColor(s.result)} opacity={s.result === 'goal' ? 0.9 : 0.55} stroke={s.result === 'goal' ? '#fff' : 'none'} strokeWidth="1.5" />
              })}
              <text x={8} y={PH - 8} fontSize="10" fill="rgba(255,255,255,0.3)">← Attacking direction</text>
            </svg>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { player: 'P. Nair', shots: 4, goals: 2, xg: 1.03 },
                { player: 'E. Zhang', shots: 4, goals: 2, xg: 0.94 },
                { player: 'A. Walsh', shots: 3, goals: 0, xg: 0.46 },
                { player: 'L. Whitmore', shots: 2, goals: 0, xg: 0.12 },
              ].map(p => (
                <div key={p.player} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
                  <div className="text-xs font-bold text-white mb-1">{p.player}</div>
                  <div className="text-[10px] text-gray-500">{p.shots} shots · {p.goals} goals</div>
                  <div className="text-[10px] text-pink-400 mt-0.5">xG: {p.xg.toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[10px] text-gray-600">Data source: Lumio Data Women&apos;s API · Bubble size = xG value</div>
          </div>
        )
      })()}
    </div>
  )
}

// ─── TRANSFERS VIEW ──────────────────────────────────────────────────────────
const TransfersView = ({ club }: { club: WomensClub }) => {
  const [activeTab, setActiveTab] = useState<'tracker' | 'researcher'>('tracker');
  const [step, setStep] = useState<1|2|3|4>(1);
  const [position, setPosition] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [style, setStyle] = useState('');
  const [league, setLeague] = useState('WSL');
  const [results, setResults] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const FSR_HEADROOM = club.fsrHeadroom ?? 380000;
  const fmt2 = (n: number) => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n);

  const runSearch = async () => {
    setLoading(true); setResults(null);
    try {
      const response = await fetch('/api/ai/womens', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          messages: [{ role: 'user', content: `You are a women's football transfer analyst for ${club.name}, a ${club.league} club.
Search criteria: Position: ${position}. Max salary: £${maxSalary}/yr. Style: ${style}. Target leagues: ${league}. FSR headroom: ${fmt2(FSR_HEADROOM)}.
Generate 5 player profiles. For each: **[Name]** — [Club], [Nationality]. Age, position, est salary, FSR impact, style match (2 sentences), key stats, availability, Lumio Scout rating (6.8–8.4), recommended action.
After profiles add **## FSR IMPACT SUMMARY** table and **## RECOMMENDED SIGNING** paragraph.
Use plausible fictional names — no real WSL players. WSL salary range £28k–£120k. Format with markdown.` }]
        })
      });
      const data = await response.json();
      setResults(data.content?.map((b:{type:string;text?:string})=>b.type==='text'?b.text:'').join('')||'No results.');
      setStep(4);
    } catch { setResults('Error connecting to AI.'); }
    setLoading(false);
  };

  const renderMd = (text: string) => text.split('\n').map((line,i) => {
    if (line.startsWith('## ')||line.startsWith('**## ')) return <h3 key={i} className="text-sm font-bold text-white mt-6 mb-2 border-b border-gray-800 pb-1">{line.replace(/\*\*?##\s?/g,'')}</h3>;
    if (line.startsWith('**')&&line.endsWith('**')) return <p key={i} className="text-sm font-bold text-pink-400 mt-4 mb-1">{line.replace(/\*\*/g,'')}</p>;
    if (line.startsWith('- ')) return <div key={i} className="flex items-start gap-2 text-xs text-gray-300 mb-1 ml-2"><span className="text-pink-500 mt-0.5 flex-shrink-0">•</span><span>{line.replace('- ','')}</span></div>;
    if (line.trim()==='') return <div key={i} className="h-1"/>;
    return <p key={i} className="text-xs text-gray-300 mb-1 leading-relaxed">{line}</p>;
  });

  return (
    <div>
      <SectionHeader title="Transfers" subtitle="WSL market · FSR-gated · AI Transfer Researcher" icon="🔁" />
      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {[{id:'tracker',label:'Transfer Tracker',icon:'📋'},{id:'researcher',label:'AI Transfer Researcher',icon:'🤖'}].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id as 'tracker'|'researcher')}
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px ${activeTab===t.id?'border-pink-500 text-pink-400':'border-transparent text-gray-500 hover:text-gray-300'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {activeTab==='tracker'&&(
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="FSR Headroom" value={fmt2(FSR_HEADROOM)} sub="Available for new signings" color="green" />
            <StatCard label="Window Status" value="Open" sub="Summer — closes 31 Aug" color="blue" />
            <StatCard label="Targets Identified" value="6" sub="3 priority · 3 watchlist" color="pink" />
            <StatCard label="Outgoing Risk" value="2" sub="Contract expiries this window" color="amber" />
          </div>
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between"><h3 className="text-sm font-bold text-white">Incoming Targets</h3><span className="text-[10px] text-gray-500">Summer 2026</span></div>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Player</th><th className="text-left p-3">Club</th><th className="text-left p-3">Pos</th><th className="text-left p-3">Est. Salary</th><th className="text-left p-3">FSR Impact</th><th className="text-left p-3">Priority</th><th className="text-left p-3">Status</th>
            </tr></thead><tbody>
              {[
                {player:'Lena Müller',club:'Hoffenheim',pos:'LB',salary:62000,priority:'High',status:'Approach made',sc:'pink'},
                {player:'Chloe Dubois',club:'D1 Arkema',pos:'FW',salary:78000,priority:'High',status:'Scouting',sc:'blue'},
                {player:'Amara Diallo',club:'Free agent',pos:'CM',salary:45000,priority:'High',status:'Contract talks',sc:'green'},
                {player:'Rosa Lindqvist',club:'Rosengård (SWE)',pos:'CB',salary:55000,priority:'Medium',status:'Watchlist',sc:'gray'},
                {player:'Yuki Tanaka',club:'INAC Kobe',pos:'AM',salary:48000,priority:'Medium',status:'Watchlist',sc:'gray'},
                {player:'Kezia Okafor',club:'NWSL Portland',pos:'FW',salary:92000,priority:'Low',status:'Monitor',sc:'gray'},
              ].map((r,i)=>{
                const ha=FSR_HEADROOM-r.salary;const hc=ha>200000?'text-green-400':ha>80000?'text-amber-400':'text-red-400';
                const pc=r.priority==='High'?'bg-pink-600/20 text-pink-400':r.priority==='Medium'?'bg-amber-600/20 text-amber-400':'bg-gray-800 text-gray-400';
                const stc=r.sc==='pink'?'bg-pink-600/20 text-pink-400':r.sc==='green'?'bg-green-600/20 text-green-400':r.sc==='blue'?'bg-blue-600/20 text-blue-400':'bg-gray-800 text-gray-500';
                return<tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200 font-medium">{r.player}</td><td className="p-3 text-gray-400 text-xs">{r.club}</td><td className="p-3"><span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">{r.pos}</span></td><td className="p-3 text-gray-300 text-xs">{fmt2(r.salary)}/yr</td><td className={`p-3 text-xs font-medium ${hc}`}>{fmt2(ha)} left</td><td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded ${pc}`}>{r.priority}</span></td><td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded ${stc}`}>{r.status}</span></td></tr>;
              })}
            </tbody></table></div>
          </div>
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800"><h3 className="text-sm font-bold text-white">Outgoing Risk — Contract Expiries</h3></div>
            <table className="w-full text-sm"><thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30"><th className="text-left p-3">Player</th><th className="text-left p-3">Pos</th><th className="text-left p-3">Ends</th><th className="text-left p-3">Salary</th><th className="text-left p-3">Status</th><th className="text-left p-3">Risk</th></tr></thead><tbody>
              {[{n:'Lucy Whitmore',p:'CM',e:'Jun 2026',s:'£55k',st:'Offer sent — awaiting',r:'Medium'},{n:'Jade Osei',p:'LB',e:'Jun 2026',s:'£48k',st:'Negotiating — agent involved',r:'High'},{n:'Tilly Brooks',p:'FW',e:'Jun 2026',s:'£38k',st:'Below WSL min — review',r:'Low'}].map((r,i)=>{
                const rc=r.r==='High'?'bg-red-600/20 text-red-400':r.r==='Medium'?'bg-amber-600/20 text-amber-400':'bg-green-600/20 text-green-400';
                return<tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200 font-medium">{r.n}</td><td className="p-3"><span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">{r.p}</span></td><td className="p-3 text-gray-400 text-xs">{r.e}</td><td className="p-3 text-gray-300 text-xs">{r.s}/yr</td><td className="p-3 text-gray-400 text-xs">{r.st}</td><td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded ${rc}`}>{r.r}</span></td></tr>;
              })}
            </tbody></table>
          </div>
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Window Timeline</h3>
            <div className="relative"><div className="absolute left-3 top-0 bottom-0 w-px bg-gray-800"/>
              {[{d:'1 Jun 2026',l:'Summer window opens',c:'blue'},{d:'30 Jun 2026',l:'Whitmore + Osei contracts end',c:'amber'},{d:'15 Jul 2026',l:'Pre-season begins — squad must be set',c:'pink'},{d:'31 Aug 2026',l:'Window closes — deadline day',c:'red'}].map((t,i)=>(
                <div key={i} className="flex items-start gap-4 mb-4 pl-8 relative">
                  <div className={`absolute left-1.5 top-1 w-3 h-3 rounded-full border-2 ${t.c==='blue'?'border-blue-500 bg-blue-500/20':t.c==='amber'?'border-amber-500 bg-amber-500/20':t.c==='red'?'border-red-500 bg-red-500/20':'border-pink-500 bg-pink-500/20'}`}/>
                  <div><div className="text-xs font-semibold text-white">{t.l}</div><div className="text-[10px] text-gray-500 mt-0.5">{t.d}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab==='researcher'&&(
        <div className="space-y-6">
          <div className="bg-pink-600/10 border border-pink-600/30 rounded-xl p-4 flex items-center justify-between">
            <div><p className="text-sm font-bold text-pink-400">FSR Headroom: {fmt2(FSR_HEADROOM)}</p><p className="text-xs text-gray-400 mt-0.5">All AI recommendations filtered to your FSR salary cap.</p></div>
            <span className="text-2xl">🤖</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            {[1,2,3,4].map(s=><div key={s} className="flex items-center gap-2"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step>=s?'bg-pink-600 text-white':'bg-gray-800 text-gray-600'}`}>{s}</div>{s<4&&<div className={`h-px w-8 ${step>s?'bg-pink-600':'bg-gray-800'}`}/>}</div>)}
            <span className="text-xs text-gray-500 ml-2">{step===1?'Position':step===2?'Budget & League':step===3?'Playing Style':'Results'}</span>
          </div>
          {step===1&&(
            <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-1">Step 1 — Position</h3><p className="text-xs text-gray-500 mb-4">Select the primary position.</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">{['GK','CB','LB','RB','CM','DM','AM','LW','RW','FW','SS','Any'].map(p=><button key={p} onClick={()=>setPosition(p)} className={`py-2 rounded-lg text-xs font-semibold ${position===p?'bg-pink-600 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>{p}</button>)}</div>
              <button onClick={()=>{if(position)setStep(2)}} disabled={!position} className="px-5 py-2 rounded-lg text-xs font-bold bg-pink-600 hover:bg-pink-500 disabled:bg-gray-800 disabled:text-gray-600 text-white">Next →</button>
            </div>
          )}
          {step===2&&(
            <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-1">Step 2 — Budget &amp; League</h3><p className="text-xs text-gray-500 mb-4">FSR headroom: {fmt2(FSR_HEADROOM)}</p>
              <div className="space-y-4">
                <div><label className="text-xs text-gray-400 mb-1 block">Max annual salary (£)</label><input type="number" value={maxSalary} onChange={e=>setMaxSalary(e.target.value)} placeholder="e.g. 65000" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-48 focus:outline-none focus:border-pink-500"/>{maxSalary&&Number(maxSalary)>FSR_HEADROOM&&<p className="text-xs text-red-400 mt-1">⚠ Exceeds FSR headroom</p>}</div>
                <div><label className="text-xs text-gray-400 mb-2 block">Target league(s)</label><div className="flex flex-wrap gap-2">{['WSL',"Women's Championship",'NWSL','D1 Arkema','Frauen-Bundesliga','Free agents only','Any'].map(lg=><button key={lg} onClick={()=>setLeague(lg)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${league===lg?'bg-pink-600 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>{lg}</button>)}</div></div>
              </div>
              <div className="flex gap-2 mt-5"><button onClick={()=>setStep(1)} className="px-4 py-2 rounded-lg text-xs bg-gray-800 text-gray-400 hover:text-white">← Back</button><button onClick={()=>{if(maxSalary&&league)setStep(3)}} disabled={!maxSalary||!league} className="px-5 py-2 rounded-lg text-xs font-bold bg-pink-600 hover:bg-pink-500 disabled:bg-gray-800 disabled:text-gray-600 text-white">Next →</button></div>
            </div>
          )}
          {step===3&&(
            <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-1">Step 3 — Playing Style</h3><p className="text-xs text-gray-500 mb-4">Claude will match this against available players.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">{['High press — engine','Ball-playing — technical','Physical — aerial','Pace — in behind','Creative — final third','Defensive — positional','Box-to-box — hybrid','Set piece specialist','Leadership — experienced'].map(s2=><button key={s2} onClick={()=>setStyle(s2)} className={`py-2 px-3 rounded-lg text-xs text-left font-medium ${style===s2?'bg-pink-600 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>{s2}</button>)}</div>
              <div className="mb-4"><label className="text-xs text-gray-400 mb-1 block">Or describe in your own words</label><input type="text" value={style} onChange={e=>setStyle(e.target.value)} placeholder="e.g. Left-footed CB who can carry ball" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white w-full focus:outline-none focus:border-pink-500"/></div>
              <div className="flex gap-2"><button onClick={()=>setStep(2)} className="px-4 py-2 rounded-lg text-xs bg-gray-800 text-gray-400 hover:text-white">← Back</button><button onClick={runSearch} disabled={!style||loading} className="px-6 py-2 rounded-lg text-xs font-bold bg-pink-600 hover:bg-pink-500 disabled:bg-gray-800 disabled:text-gray-600 text-white flex items-center gap-2">{loading?<><span className="animate-spin inline-block">⟳</span> Searching...</>:'🤖 Find Players →'}</button></div>
            </div>
          )}
          {step===4&&results&&(
            <div className="space-y-4">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-sm font-bold text-white">AI Results</span><span className="text-[10px] px-2 py-0.5 rounded bg-pink-600/20 text-pink-400 border border-pink-600/30">{position} · {fmt2(Number(maxSalary))}/yr max · {league}</span></div><button onClick={()=>{setStep(1);setPosition('');setMaxSalary('');setStyle('');setLeague('WSL');setResults(null)}} className="text-xs text-gray-500 hover:text-gray-300">↺ New search</button></div>
              <div className="bg-[#0D1117] border border-pink-600/30 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4"><span className="text-pink-400 font-bold text-xs">🤖 Lumio AI Transfer Researcher</span><span className="text-[10px] text-gray-600">· FSR-filtered · {club.league}</span></div>
                <div>{renderMd(results)}</div>
                <div className="mt-5 pt-4 border-t border-gray-800 flex items-center justify-between"><span className="text-[10px] text-gray-600">Powered by Claude · WSL database · FSR headroom: {fmt2(FSR_HEADROOM)}</span><button className="text-xs text-pink-400 hover:text-pink-300">Export shortlist →</button></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── AI HALFTIME BRIEF VIEW ─────────────────────────────────────────────────
const AIHalftimeBriefView = () => {
  const [brief, setBrief] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const matchContext = { opponent: 'Brighton Women', score: '0–1', minute: 45, venue: 'Home', formation: '4-3-3' }

  const generateBrief = async () => {
    setLoading(true)
    setBrief(null)
    try {
      const prompt = `You are the AI performance analyst for Oakridge Women FC women's football club. Generate a structured halftime brief for the coaching staff.

Match context:
- Opponent: ${matchContext.opponent}
- Score: ${matchContext.score} (we are trailing)
- Venue: ${matchContext.venue}
- Formation: ${matchContext.formation}

GPS Data (first half):
- High intensity runs: Us 38 vs Them 52
- Avg speed: Us 6.8 km/h vs Them 7.2 km/h
- Distance covered: Us 42.1km vs Them 45.3km
- Sprint count: Us 14 vs Them 22

Lumio Data xG:
- xG: Us 0.31 vs Them 0.87
- Shots: Us 2 vs Them 6
- Progressive passes: Us 18 vs Them 31
- PPDA (pressing intensity): Us 14.2 vs Them 8.1 (lower = more pressing)

WELFARE FLAGS (confidential — coaching staff only):
- Cycle flags: Emily Zhang (Luteal, load cap 60%), Priya Nair (Ovulatory, ligament laxity)
- ACL event detection: Emily Zhang exceeded high-deceleration threshold 3 times
- Mental health: Charlotte Reed flagged pre-match anxiety

Available substitutes: Lucy Whitmore, Jade Osei, Abbi Walsh, Tilly Brooks, Mia Ford
Yellow cards: Priya Nair

Generate the brief in exactly this structure:

## 🔴 SITUATION
One paragraph summary of match state and urgency.

## ⚡ PHYSICAL
Bullet points on GPS findings and what they mean tactically. Flag Emily Zhang's ACL deceleration events clearly.

## 🎯 TACTICAL
3–4 specific adjustments based on xG and pressing data. Be direct and actionable.

## ❤️ WELFARE (Confidential)
List the cycle and mental health flags with specific recommended actions. Be clinical and respectful.

## 🔄 SUBSTITUTION RECOMMENDATIONS
Recommend 1–2 substitutions with reasoning, factoring in welfare flags and yellow cards.

## 💬 TEAM TALK
One short, direct motivational paragraph for the manager to adapt.

Keep the tone professional, concise, and match-ready. This will be read in a 15-minute halftime window.`

      const response = await fetch('/api/ai/womens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await response.json()
      const text = data.content?.map((b: { type: string; text?: string }) => b.type === 'text' ? b.text : '').join('') || ''
      setBrief(text)
    } catch {
      setBrief('Error generating brief. Check API connection.')
    }
    setLoading(false)
  }

  const renderBrief = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return <h3 key={i} className="text-sm font-bold text-white mt-5 mb-2 flex items-center gap-2">{line.replace('## ', '')}</h3>
      }
      if (line.startsWith('- ')) {
        return <div key={i} className="flex items-start gap-2 text-xs text-gray-300 mb-1"><span className="text-pink-500 mt-0.5 flex-shrink-0">•</span><span>{line.replace('- ', '')}</span></div>
      }
      if (line.trim() === '') return <div key={i} className="h-1" />
      return <p key={i} className="text-xs text-gray-300 mb-2 leading-relaxed">{line}</p>
    })
  }

  return (
    <div>
      <SectionHeader title="AI Halftime Brief" subtitle="GPS + Lumio Data xG + ACL Detection + Cycle Welfare — Unique to Lumio Women's FC" icon="🤖" />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard label="Opponent" value="Brighton W" color="blue" />
        <StatCard label="Score" value="0 – 1" sub="Trailing" color="red" />
        <StatCard label="xG" value="0.31 – 0.87" sub="Us vs Them" color="amber" />
        <StatCard label="ACL Events" value="3" sub="Emily Zhang" color="red" />
        <StatCard label="Welfare Flags" value="3" sub="Cycle + MH" color="pink" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-4">
          <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">GPS — First Half</h3>
          {[
            { label: 'High intensity runs', us: 38, them: 52 },
            { label: 'Sprint count', us: 14, them: 22 },
            { label: 'Distance (km)', us: 42.1, them: 45.3 },
          ].map(r => (
            <div key={r.label} className="mb-2">
              <div className="flex justify-between text-[10px] text-gray-500 mb-0.5"><span>{r.label}</span><span className={r.us < r.them ? 'text-red-400' : 'text-green-400'}>{r.us} vs {r.them}</span></div>
              <div className="w-full bg-gray-800 rounded-full h-1"><div className="h-1 rounded-full bg-pink-500" style={{ width: `${(r.us / (r.us + r.them)) * 100}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-4">
          <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Lumio Data xG</h3>
          {[
            { label: 'xG', us: 0.31, them: 0.87 },
            { label: 'Shots', us: 2, them: 6 },
            { label: 'Prog. passes', us: 18, them: 31 },
          ].map(r => (
            <div key={r.label} className="mb-2">
              <div className="flex justify-between text-[10px] text-gray-500 mb-0.5"><span>{r.label}</span><span className={r.us < r.them ? 'text-red-400' : 'text-green-400'}>{r.us} vs {r.them}</span></div>
              <div className="w-full bg-gray-800 rounded-full h-1"><div className="h-1 rounded-full bg-purple-500" style={{ width: `${(r.us / (r.us + r.them)) * 100}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="bg-[#0D1117] border border-red-600/30 rounded-xl p-4">
          <h3 className="text-xs font-bold text-red-400 mb-3 uppercase tracking-wider">🔴 Welfare Flags</h3>
          <div className="space-y-2">
            <div className="rounded p-2 bg-red-600/10 border border-red-600/20"><div className="text-[10px] font-bold text-red-400">ACL EVENT DETECTED</div><div className="text-[10px] text-gray-400 mt-0.5">Emily Zhang — 3× high-decel threshold exceeded</div></div>
            <div className="rounded p-2 bg-amber-600/10 border border-amber-600/20"><div className="text-[10px] font-bold text-amber-400">CYCLE FLAG</div><div className="text-[10px] text-gray-400 mt-0.5">Luteal (Zhang) + Ovulatory (Nair)</div></div>
            <div className="rounded p-2 bg-blue-600/10 border border-blue-600/20"><div className="text-[10px] font-bold text-blue-400">MENTAL HEALTH</div><div className="text-[10px] text-gray-400 mt-0.5">Charlotte Reed — pre-match anxiety</div></div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={generateBrief}
          disabled={loading}
          className="px-6 py-3 rounded-xl text-sm font-bold bg-pink-600 hover:bg-pink-500 disabled:bg-pink-900/40 disabled:text-pink-800 text-white transition-all flex items-center gap-2"
        >
          {loading ? (
            <><span className="animate-spin">⟳</span> Generating Halftime Brief...</>
          ) : (
            <><span>🤖</span> Generate AI Halftime Brief</>
          )}
        </button>
        {!brief && !loading && (
          <p className="text-xs text-gray-500 mt-2">Combines GPS + xG + ACL events + cycle welfare flags → structured coaching brief in seconds.</p>
        )}
      </div>

      {brief && (
        <div className="bg-[#0D1117] border border-pink-600/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-pink-400 font-bold text-sm">🤖 Lumio AI Brief</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-pink-600/20 text-pink-400 border border-pink-600/30">CONFIDENTIAL — Coaching Staff Only</span>
            </div>
            <button onClick={generateBrief} className="text-xs text-gray-500 hover:text-gray-300">↺ Regenerate</button>
          </div>
          <div className="divide-y divide-gray-800/50">
            {renderBrief(brief)}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
            <span className="text-[10px] text-gray-600">Generated by Claude · Lumio Women&apos;s FC · Halftime {matchContext.minute}&apos;</span>
            <button className="text-xs text-pink-400 hover:text-pink-300">Print for dressing room →</button>
          </div>
        </div>
      )}

      <div className="mt-6 bg-pink-600/10 border border-pink-600/30 rounded-xl p-4">
        <p className="text-xs text-pink-300"><strong>Why this is world-leading:</strong> No other women&apos;s football platform combines GPS load data, Lumio Data xG, real-time ACL deceleration event detection, and menstrual cycle phase welfare flags into a single AI-generated coaching brief. This is unique to Lumio Women&apos;s FC.</p>
      </div>
    </div>
  )
}

// ─── MATCH PREPARATION VIEW ─────────────────────────────────────────────────
const MatchPreparationView = () => {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    teamSheet: false,
    kitConfirmed: false,
    travelBooked: false,
    medicalBag: false,
    gpsDevices: false,
    matchBalls: false,
  })

  const toggleItem = (key: string): void => {
    setChecklist((prev: Record<string, boolean>) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div>
      <SectionHeader title="Match Preparation" subtitle="Next fixture planning and readiness" icon="⚽" />
      <div className="bg-gradient-to-br from-pink-600/20 to-purple-900/10 border border-pink-600/20 rounded-xl p-5 mb-6">
        <div className="text-xs text-pink-400 font-semibold uppercase tracking-wider mb-2">Next Match</div>
        <div className="text-2xl font-bold text-white mb-1">Oakridge Women vs Manchester City Women</div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>Saturday 12 April 2026</span>
          <span>KO 14:00</span>
          <span>Oakridge Stadium (H)</span>
          <span className="text-xs px-2 py-0.5 rounded bg-blue-600/20 text-blue-400">WSL</span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Available" value="8" sub="Of 10 squad players" color="green" />
        <StatCard label="Injured" value="1" sub="Sophie Turner (RTP)" color="red" />
        <StatCard label="Unavailable" value="1" sub="Sophie Lawson (maternity)" color="amber" />
        <StatCard label="Days Until Match" value="8" sub="Saturday 12 Apr" color="blue" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">Availability Summary</h3>
          <div className="space-y-2">
            {[
              {player:'Emma Clarke',status:'Available',note:'Dual-reg recalled for this match'},
              {player:'Priya Nair',status:'Available',note:''},
              {player:'Jade Osei',status:'Available',note:''},
              {player:'Abbi Walsh',status:'Available',note:''},
              {player:'Charlotte Reed',status:'Available',note:''},
              {player:'Sophie Turner',status:'Injured',note:'RTP Phase 3 — no match clearance'},
              {player:'Fatima Al-Said',status:'Available',note:'ITC cleared — eligible'},
              {player:'Megan Hughes',status:'Available',note:''},
              {player:'Sophie Lawson',status:'Unavailable',note:'Maternity leave'},
              {player:'Tilly Brooks',status:'Available',note:'Part-time — confirmed available'},
            ].map((p: {player:string;status:string;note:string}) => (
              <div key={p.player} className="flex items-center justify-between py-1.5 border-b border-gray-800">
                <span className="text-xs text-gray-300">{p.player}</span>
                <div className="flex items-center gap-2">
                  {p.note && <span className="text-[10px] text-gray-500">{p.note}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    p.status === 'Available' ? 'bg-green-600/20 text-green-400'
                    : p.status === 'Injured' ? 'bg-red-600/20 text-red-400'
                    : 'bg-amber-600/20 text-amber-400'
                  }`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">Opposition Notes — Manchester City Women</h3>
          <div className="space-y-3">
            {[
              {label:'Formation',value:'4-3-3 (high line)'},
              {label:'Style',value:'High press, possession-dominant, quick transitions'},
              {label:'Danger Player',value:'#9 Khadija Shaw — 14 goals this season'},
              {label:'Weakness',value:'Vulnerable to direct balls in behind the high line'},
              {label:'Last Meeting',value:'2-2 draw (Nov 2025)'},
              {label:'League Position',value:'2nd (W14 D5 L1)'},
            ].map((n: {label:string;value:string}) => (
              <div key={n.label}>
                <div className="text-[10px] text-gray-500 uppercase">{n.label}</div>
                <div className="text-xs text-gray-300">{n.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">Pre-Match Checklist</h3>
        <div className="space-y-2">
          {[
            {key:'teamSheet',label:'Team sheet submitted to FA'},
            {key:'kitConfirmed',label:'Kit confirmed (home pink)'},
            {key:'travelBooked',label:'Travel arrangements confirmed'},
            {key:'medicalBag',label:'Medical bag packed and checked'},
            {key:'gpsDevices',label:'GPS devices charged and allocated'},
            {key:'matchBalls',label:'Match balls and equipment ready'},
          ].map((item: {key:string;label:string}) => (
            <button key={item.key} onClick={() => toggleItem(item.key)}
              className="flex items-center gap-2 text-xs w-full text-left py-1.5">
              <span className={checklist[item.key] ? 'text-green-400' : 'text-gray-600'}>{checklist[item.key] ? '✓' : '○'}</span>
              <span className={checklist[item.key] ? 'text-gray-400 line-through' : 'text-gray-300'}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Team sheet builder — static demo */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">📋 Team Sheet Builder</h3>
          <span className="text-[10px] text-gray-500">Submitted to FA · 11 starters · 7 subs</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-pink-400 font-bold mb-2">Starting XI</div>
            <div className="space-y-1">
              {[
                {n:1, name:'Charlotte Reed',  pos:'GK'},
                {n:2, name:'Sophie Lawson',   pos:'RB', greyed:true,  note:'Maternity'},
                {n:4, name:'Emma Clarke',     pos:'CB'},
                {n:5, name:'TBC',             pos:'CB', tbc:true},
                {n:3, name:'Sophie Turner',   pos:'LB', greyed:true, note:'RTP'},
                {n:6, name:'Megan Hughes',    pos:'DM'},
                {n:8, name:'Priya Nair',      pos:'CM'},
                {n:10,name:'Fatima Al-Said',  pos:'AM'},
                {n:7, name:'Abbi Walsh',      pos:'RW'},
                {n:9, name:'Jade Osei',       pos:'ST'},
                {n:11,name:'Tilly Brooks',    pos:'LW'},
              ].map(p => (
                <div key={p.n} className={`flex items-center gap-2 py-1 px-2 rounded ${p.greyed ? 'opacity-40' : ''}`}>
                  <span className="text-[10px] font-bold w-5 text-gray-500">#{p.n}</span>
                  <span className={`text-xs flex-1 ${p.tbc ? 'text-amber-400 italic' : 'text-gray-200'}`}>{p.name}</span>
                  <span className="text-[10px] text-gray-500">{p.pos}</span>
                  {p.note && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-600/20 text-amber-400">{p.note}</span>}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-blue-400 font-bold mb-2">Substitutes</div>
            <div className="space-y-1">
              {[
                {n:12,name:'Ellie Markham',  pos:'GK'},
                {n:14,name:'Hannah Pettit',  pos:'CB'},
                {n:15,name:'Maya Donaldson', pos:'FB'},
                {n:16,name:'Sara Whittle',   pos:'CM'},
                {n:17,name:'Lara Vaughan',   pos:'WG'},
                {n:18,name:'Bea Sutherland', pos:'ST'},
                {n:19,name:'Imogen Ross',    pos:'AM'},
              ].map(p => (
                <div key={p.n} className="flex items-center gap-2 py-1 px-2 rounded">
                  <span className="text-[10px] font-bold w-5 text-gray-500">#{p.n}</span>
                  <span className="text-xs flex-1 text-gray-300">{p.name}</span>
                  <span className="text-[10px] text-gray-500">{p.pos}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-800">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">Captains</div>
              <div className="text-xs text-gray-300">Captain: <span className="text-pink-400 font-semibold">Priya Nair (#8)</span></div>
              <div className="text-xs text-gray-300">Vice: <span className="text-pink-400 font-semibold">Charlotte Reed (#1)</span></div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button disabled className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed">Edit team sheet</button>
          <button disabled className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed">Resubmit to FA</button>
          <span className="text-[10px] text-gray-500">Locks 1 hour before kick-off</span>
        </div>
      </div>
    </div>
  )
}

// ─── GPS HEATMAPS VIEW (wraps shared component with women's config) ─────────
// Includes the optional welfare section (Section 6) — Karen Carney Review
// compliance context, with weekly load cap flags + rest-day tracking.
const WOMENS_HEATMAP_PLAYERS: HMPlayer[] = [
  { name: 'Charlotte Reed', position: 'GK',  group: 'Goalkeeper'  },
  { name: 'Sophie Turner',  position: 'CB',  group: 'Defenders'   },
  { name: 'Emma Clarke',    position: 'CB',  group: 'Defenders'   },
  { name: 'Jade Osei',      position: 'LB',  group: 'Defenders'   },
  { name: 'Abbi Walsh',     position: 'RB',  group: 'Defenders'   },
  { name: 'Megan Hughes',   position: 'CDM', group: 'Midfielders' },
  { name: 'Priya Nair',     position: 'CM',  group: 'Midfielders' },
  { name: 'Lucy Whitmore',  position: 'CM',  group: 'Midfielders' },
  { name: 'Fatima Al-Said', position: 'CAM', group: 'Midfielders' },
  { name: 'Emily Zhang',    position: 'LW',  group: 'Forwards'    },
  { name: 'Niamh O\'Brien', position: 'RW',  group: 'Forwards'    },
  { name: 'Sasha Kone',     position: 'ST',  group: 'Forwards'    },
]

const WOMENS_HEATMAP_MATCHES = [
  'Manchester City Women (H) — WSL, 2-2 D',
  'Tottenham Hotspur Women (A) — WSL, 1-0 W',
  'Manchester United Women (H) — FA Cup R5, 0-1 L',
  'Brighton Women (A) — WSL, 3-1 W',
  'Chelsea Women (H) — WSL, 1-3 L',
]

const WOMENS_HEATMAP_TRAINING = [
  'Tue — Tactical (90min)',
  'Wed — High Intensity (75min)',
  'Thu — S&C + Cycle-Adjusted (60min)',
  "Fri — Captain's Run (45min)",
]

function WomensGPSHeatmapsView({ club }: { club: WomensClub }) {
  return (
    <GPSHeatmapsView
      sportLabel={`${club.name} · ${club.league}`}
      brandPrimaryKey="lumio_womens_brand_primary"
      brandSecondaryKey="lumio_womens_brand_secondary"
      defaultPrimary={club.accent}
      defaultSecondary="#F472B6"
      players={WOMENS_HEATMAP_PLAYERS}
      matches={WOMENS_HEATMAP_MATCHES}
      trainingSessions={WOMENS_HEATMAP_TRAINING}
      matchDayLabel="MATCH"
      comparisonMode="four"
      includeWelfareSection
      welfareLabel="Welfare & Load Monitoring (Karen Carney Review)"
    />
  )
}

// ─── GPS & LOAD VIEW ─────────────────────────────────────────────────────────
type GPSPlayer = {
  name: string; pos: string; distance: number; hsr: number; sprints: number; topSpeed: number;
  load: number; acwr: number; status: 'On' | 'High' | 'Restricted' | 'On Leave';
  zones: { walk: number; jog: number; run: number; sprint: number };
  accels: number; decels: number;
}

const GPS_PLAYERS: GPSPlayer[] = [
  { name: 'Emma Clarke',     pos: 'GK', distance: 5.4,  hsr: 120, sprints: 4,  topSpeed: 18.2, load: 410,  acwr: 0.94, status: 'On',         zones: { walk: 3.4, jog: 1.4, run: 0.5, sprint: 0.1 }, accels: 6,  decels: 5  },
  { name: 'Priya Nair',      pos: 'CM', distance: 11.4, hsr: 890, sprints: 22, topSpeed: 29.3, load: 880,  acwr: 1.08, status: 'On',         zones: { walk: 4.8, jog: 3.6, run: 2.1, sprint: 0.9 }, accels: 38, decels: 41 },
  { name: 'Jade Osei',       pos: 'ST', distance: 10.1, hsr: 780, sprints: 26, topSpeed: 31.2, load: 790,  acwr: 1.12, status: 'On',         zones: { walk: 4.2, jog: 3.0, run: 1.8, sprint: 1.1 }, accels: 44, decels: 48 },
  { name: 'Abbi Walsh',      pos: 'RW', distance: 10.8, hsr: 850, sprints: 28, topSpeed: 30.5, load: 1080, acwr: 1.42, status: 'High',       zones: { walk: 4.0, jog: 3.2, run: 2.4, sprint: 1.2 }, accels: 49, decels: 52 },
  { name: 'Charlotte Reed',  pos: 'CB', distance: 9.2,  hsr: 620, sprints: 14, topSpeed: 28.1, load: 720,  acwr: 1.05, status: 'On',         zones: { walk: 4.5, jog: 2.8, run: 1.4, sprint: 0.5 }, accels: 28, decels: 32 },
  { name: 'Sophie Turner',   pos: 'CB', distance: 7.1,  hsr: 340, sprints: 8,  topSpeed: 24.0, load: 540,  acwr: 0.62, status: 'Restricted', zones: { walk: 3.8, jog: 2.2, run: 0.8, sprint: 0.3 }, accels: 14, decels: 16 },
  { name: 'Fatima Al-Said',  pos: 'AM', distance: 10.6, hsr: 810, sprints: 20, topSpeed: 29.8, load: 830,  acwr: 1.04, status: 'On',         zones: { walk: 4.4, jog: 3.4, run: 1.9, sprint: 0.9 }, accels: 36, decels: 39 },
  { name: 'Megan Hughes',    pos: 'DM', distance: 10.9, hsr: 720, sprints: 18, topSpeed: 27.6, load: 770,  acwr: 1.01, status: 'On',         zones: { walk: 4.6, jog: 3.5, run: 1.9, sprint: 0.9 }, accels: 31, decels: 34 },
  { name: 'Sophie Lawson',   pos: 'RB', distance: 0,    hsr: 0,   sprints: 0,  topSpeed: 0,    load: 0,    acwr: 0,    status: 'On Leave',   zones: { walk: 0,   jog: 0,   run: 0,   sprint: 0   }, accels: 0,  decels: 0  },
  { name: 'Tilly Brooks',    pos: 'LW', distance: 9.8,  hsr: 760, sprints: 24, topSpeed: 30.1, load: 1010, acwr: 1.38, status: 'High',       zones: { walk: 3.9, jog: 3.0, run: 1.9, sprint: 1.0 }, accels: 41, decels: 45 },
]

const GPSLoadView = ({ club }: { club: WomensClub }) => {
  const [activeTab, setActiveTab] = useState('session')
  const tabs = [
    { id: 'session',   label: 'Session Overview',         icon: '📋' },
    { id: 'welfare',   label: 'Welfare & Load Monitoring', icon: '❤️' },
    { id: 'trends',    label: 'Load Trends & ACWR',       icon: '📈' },
    { id: 'matchvtr',  label: 'Match vs Training',        icon: '⚽' },
    { id: 'sprint',    label: 'Sprint Analysis',          icon: '⚡' },
    { id: 'connect',   label: 'Connect GPS',              icon: '📡' },
  ]
  const phaseBadge = club.tier === 'pro'
    ? { label: club.league || 'WSL', cls: 'bg-pink-600/20 text-pink-300 border-pink-600/30' }
    : club.tier === 'championship'
    ? { label: 'Championship', cls: 'bg-amber-600/20 text-amber-300 border-amber-600/30' }
    : { label: 'Grassroots', cls: 'bg-green-600/20 text-green-300 border-green-600/30' }

  const active = GPS_PLAYERS.filter(p => p.status !== 'On Leave')
  const avgLoad     = Math.round(active.reduce((s,p)=>s+p.load,0)/active.length)
  const avgDistance = (active.reduce((s,p)=>s+p.distance,0)/active.length).toFixed(1)
  const avgHsr      = Math.round(active.reduce((s,p)=>s+p.hsr,0)/active.length)
  const maxSpeed    = Math.max(...active.map(p=>p.topSpeed)).toFixed(1)
  const sprintCount = active.reduce((s,p)=>s+p.sprints,0)
  const highLoad    = active.filter(p=>p.status==='High').length
  const restricted  = active.filter(p=>p.status==='Restricted').length + GPS_PLAYERS.filter(p=>p.status==='On Leave').length

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <SectionHeader title="GPS & Load" subtitle="Training and match load monitoring · JOHAN Sports" icon="📡" />
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${phaseBadge.cls}`}>{phaseBadge.label}</span>
      </div>

      {/* TOP STRIP — 8 KPI cards (2 rows of 4) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Avg Player Load"    value={avgLoad}            sub="AU · session"            color="pink"   />
        <StatCard label="Avg Distance"       value={`${avgDistance} km`} sub="Per outfield player"    color="teal"   />
        <StatCard label="Avg HSR"            value={`${avgHsr} m`}      sub=">19.8 km/h"              color="purple" />
        <StatCard label="Max Speed"          value={`${maxSpeed} km/h`}  sub="Osei · 38' sprint"      color="blue"   />
        <StatCard label="Sprint Count"       value={sprintCount}        sub="Squad total · session"   color="amber"  />
        <StatCard label="High Load Count"    value={highLoad}           sub="ACWR > 1.3"              color="amber"  />
        <StatCard label="Restricted Players" value={restricted}         sub="RTP + on leave"          color="red"    />
        <StatCard label="Devices Active"     value="9 / 10"             sub="JOHAN vests · 1 charging" color="green"  />
      </div>

      {/* TABS */}
      <div className="overflow-x-auto pb-2 mb-6 border-b border-gray-800">
        <div className="flex gap-1 min-w-max">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-all ${activeTab===t.id?'bg-pink-600/20 text-pink-400 border-b-2 border-pink-500 -mb-[1px]':'text-gray-500 hover:text-gray-300'}`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'session'  && <GPSSessionOverview players={GPS_PLAYERS} phase={phaseBadge} />}
      {activeTab === 'welfare'  && <GPSWelfareLoad players={GPS_PLAYERS} />}
      {activeTab === 'trends'   && <GPSLoadTrends players={GPS_PLAYERS} />}
      {activeTab === 'matchvtr' && <GPSMatchVsTraining />}
      {activeTab === 'sprint'   && <GPSSprintAnalysis players={GPS_PLAYERS} />}
      {activeTab === 'connect'  && <GPSConnectTab />}
    </div>
  )
}

// ─── SESSION OVERVIEW ────────────────────────────────────────────────────────
const GPSSessionOverview = ({ players, phase }: { players: GPSPlayer[]; phase: { label: string; cls: string } }) => {
  const statusBadge = (s: GPSPlayer['status']) => s === 'On' ? 'bg-green-600/20 text-green-400'
    : s === 'High' ? 'bg-amber-600/20 text-amber-400'
    : s === 'Restricted' ? 'bg-red-600/20 text-red-400'
    : 'bg-blue-600/20 text-blue-400'
  return (
    <div className="space-y-6">
      {/* Session header */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Today's Session — Tue 28 Apr 2026 · 09:00–11:30</div>
            <h3 className="text-base font-bold text-white">MD-3 Tactical + Conditioning Block</h3>
            <p className="text-xs text-gray-400 mt-1">Possession 6v6 → SSG 8v8 → Set-piece walk-through · Pitch 2 (3G)</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${phase.cls}`}>{phase.label}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border bg-gray-800 text-gray-400 border-gray-700">MD-3</span>
          </div>
        </div>
      </div>

      {/* Player table */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Squad — Session Output</h3>
          <span className="text-[10px] text-gray-500">10 players · 9 outfield active · 1 on leave</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Player</th>
              <th className="text-left p-3">Pos</th>
              <th className="text-right p-3">Distance (km)</th>
              <th className="text-right p-3">HSR (m)</th>
              <th className="text-right p-3">Sprints</th>
              <th className="text-right p-3">Top Speed</th>
              <th className="text-right p-3">Load (AU)</th>
              <th className="text-right p-3">ACWR</th>
              <th className="text-left p-3">Status</th>
            </tr></thead>
            <tbody>
              {players.map((p, i) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-900/20">
                  <td className="p-3 text-gray-200 font-medium">{p.name}</td>
                  <td className="p-3 text-gray-400">{p.pos}</td>
                  <td className="p-3 text-right text-gray-300">{p.distance > 0 ? p.distance.toFixed(1) : '—'}</td>
                  <td className="p-3 text-right text-gray-300">{p.hsr > 0 ? p.hsr : '—'}</td>
                  <td className="p-3 text-right text-gray-300">{p.sprints > 0 ? p.sprints : '—'}</td>
                  <td className="p-3 text-right text-gray-300">{p.topSpeed > 0 ? `${p.topSpeed.toFixed(1)} km/h` : '—'}</td>
                  <td className="p-3 text-right text-gray-300">{p.load > 0 ? p.load : '—'}</td>
                  <td className="p-3 text-right">
                    {p.acwr > 0 ? <span className={`text-xs font-bold ${p.acwr > 1.3 ? 'text-amber-400' : p.acwr < 0.8 ? 'text-blue-400' : 'text-green-400'}`}>{p.acwr.toFixed(2)}</span> : <span className="text-gray-500">—</span>}
                  </td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${statusBadge(p.status)}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distance by intensity zone */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-sm font-bold text-white">Distance by Intensity Zone</h3>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#3F3F46' }} /><span className="text-gray-400">Walk</span></span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#0D9488' }} /><span className="text-gray-400">Jog</span></span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#A78BFA' }} /><span className="text-gray-400">Run</span></span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#EC4899' }} /><span className="text-gray-400">Sprint</span></span>
          </div>
        </div>
        {(() => {
          const outfield = players.filter(p => p.pos !== 'GK' && p.distance > 0)
          const W = 600, rowH = 26, padL = 110, padR = 60, padT = 8
          const H = padT + outfield.length * rowH + 8
          const innerW = W - padL - padR
          const maxKm = Math.max(...outfield.map(p => p.distance)) + 0.5
          return (
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Distance by intensity zone per player">
              {outfield.map((p, i) => {
                const y = padT + i * rowH
                const total = p.zones.walk + p.zones.jog + p.zones.run + p.zones.sprint
                const segW = (v: number) => (v / maxKm) * innerW
                const wW = segW(p.zones.walk)
                const jW = segW(p.zones.jog)
                const rW = segW(p.zones.run)
                const sW = segW(p.zones.sprint)
                return (
                  <g key={p.name}>
                    <text x={padL - 8} y={y + 14} fontSize="10" fill="#9CA3AF" textAnchor="end">{p.name}</text>
                    <rect x={padL}                    y={y + 6} width={wW} height="14" fill="#3F3F46" />
                    <rect x={padL + wW}               y={y + 6} width={jW} height="14" fill="#0D9488" />
                    <rect x={padL + wW + jW}          y={y + 6} width={rW} height="14" fill="#A78BFA" />
                    <rect x={padL + wW + jW + rW}     y={y + 6} width={sW} height="14" fill="#EC4899" />
                    <text x={padL + segW(total) + 6} y={y + 16} fontSize="10" fill="#D1D5DB">{total.toFixed(1)} km</text>
                  </g>
                )
              })}
            </svg>
          )
        })()}
        <p className="text-[11px] text-gray-500 mt-2">Sprint distance shown in pink — Osei &amp; Walsh both clear 1 km of sprint volume in this MD-3 block.</p>
      </div>

      {/* Sprint frequency line chart */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-1">Sprint Frequency Across Session</h3>
        <p className="text-[11px] text-gray-500 mb-4">Squad sprint count per 10-minute block · 09:00–11:30 (MD-3 tactical)</p>
        {(() => {
          const blocks = ['09:00','09:10','09:20','09:30','09:40','09:50','10:00','10:10','10:20','10:30','10:40','10:50','11:00','11:10','11:20']
          const sprints = [4, 8, 14, 22, 28, 34, 30, 24, 18, 26, 31, 38, 32, 18, 9]
          const W = 600, H = 180, padL = 30, padR = 12, padT = 12, padB = 30
          const innerW = W - padL - padR, innerH = H - padT - padB
          const stepX = innerW / (blocks.length - 1)
          const yMax = 45
          const path = sprints.map((v, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * stepX} ${padT + innerH - (v / yMax) * innerH}`).join(' ')
          const area = `${path} L ${padL + (blocks.length - 1) * stepX} ${padT + innerH} L ${padL} ${padT + innerH} Z`
          return (
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Sprint frequency across session">
              {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                <line key={i} x1={padL} x2={W - padR} y1={padT + innerH - t * innerH} y2={padT + innerH - t * innerH} stroke="rgba(255,255,255,0.06)" />
              ))}
              {[0, 15, 30, 45].map((v, i) => (
                <text key={i} x={padL - 6} y={padT + innerH - (v / yMax) * innerH + 3} fontSize="9" fill="#9CA3AF" textAnchor="end">{v}</text>
              ))}
              <path d={area} fill="rgba(236,72,153,0.12)" />
              <path d={path} fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {sprints.map((v, i) => <circle key={i} cx={padL + i * stepX} cy={padT + innerH - (v / yMax) * innerH} r="2.5" fill="#EC4899" />)}
              {blocks.map((b, i) => i % 2 === 0 ? <text key={b} x={padL + i * stepX} y={H - 12} fontSize="9" fill="#6B7280" textAnchor="middle">{b}</text> : null)}
              {/* SSG markers */}
              <line x1={padL + 5 * stepX} x2={padL + 5 * stepX} y1={padT} y2={padT + innerH} stroke="rgba(167,139,250,0.4)" strokeDasharray="2 2" />
              <text x={padL + 5 * stepX + 4} y={padT + 10} fontSize="9" fill="#A78BFA">Possession</text>
              <line x1={padL + 11 * stepX} x2={padL + 11 * stepX} y1={padT} y2={padT + innerH} stroke="rgba(167,139,250,0.4)" strokeDasharray="2 2" />
              <text x={padL + 11 * stepX + 4} y={padT + 10} fontSize="9" fill="#A78BFA">SSG 8v8</text>
            </svg>
          )
        })()}
      </div>

      {/* AI Summary + Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-pink-600/10 to-pink-900/5 border border-pink-600/30 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🤖</span>
            <h3 className="text-sm font-bold text-white">AI Session Summary</h3>
            <span className="text-[9px] uppercase tracking-wider text-pink-300 bg-pink-600/20 px-1.5 py-0.5 rounded">Lumio Brief</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed mb-3">
            Session output landed in the planned MD-3 envelope (avg load {Math.round(GPS_PLAYERS.filter(p=>p.distance>0).reduce((s,p)=>s+p.load,0)/9)} AU vs target 750–850). The 8v8 SSG drove peak sprint frequency at 11:00 — Osei and Walsh combined for 54 sprints across the block.
          </p>
          <p className="text-xs text-gray-300 leading-relaxed mb-3">
            <strong className="text-amber-300">Watch list:</strong> Walsh's ACWR has crossed 1.4 — load needs tapering Wed/Thu. Brooks also trending high (1.38). Both flagged for S&amp;C review pre-MD-1.
          </p>
          <p className="text-xs text-gray-300 leading-relaxed">
            <strong className="text-blue-300">RTP:</strong> Turner cleared for 60% volume MD-3 — completed planned 7.1 km without aggravation. Cleared to progress to 75% Thursday subject to medical sign-off.
          </p>
        </div>
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">Session Highlights</h3>
          <div className="space-y-2">
            {[
              { l: 'Top sprinter', v: 'Osei · 26 sprints', c: 'text-pink-400' },
              { l: 'Top speed',    v: 'Osei · 31.2 km/h',  c: 'text-blue-400' },
              { l: 'Most HSR',     v: 'Nair · 890 m',      c: 'text-purple-400' },
              { l: 'Best ACWR',    v: 'Hughes · 1.01',     c: 'text-green-400' },
              { l: 'Most accels',  v: 'Walsh · 49',        c: 'text-amber-400' },
            ].map(h => (
              <div key={h.l} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-800 last:border-0">
                <span className="text-gray-400">{h.l}</span>
                <span className={`font-bold ${h.c}`}>{h.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── WELFARE & LOAD MONITORING ───────────────────────────────────────────────
const GPSWelfareLoad = ({ players }: { players: GPSPlayer[] }) => {
  // 28-day rolling load heatmap — generate deterministic-ish data
  const days = Array.from({ length: 28 }, (_, i) => i + 1)
  const cyclePhases: Record<string, Array<'M' | 'F' | 'O' | 'L' | ''>> = {
    'Priya Nair':     Array(28).fill('').map((_, d) => (d % 28 < 5 ? 'M' : d % 28 < 13 ? 'F' : d % 28 < 16 ? 'O' : 'L')),
    'Charlotte Reed': Array(28).fill('').map((_, d) => (d % 28 < 4 ? 'M' : d % 28 < 12 ? 'F' : d % 28 < 15 ? 'O' : 'L')),
    'Jade Osei':      Array(28).fill('').map((_, d) => (d % 28 < 5 ? 'M' : d % 28 < 13 ? 'F' : d % 28 < 16 ? 'O' : 'L')),
  }
  const rng = (seed: number) => {
    let x = seed
    return () => { x = (x * 9301 + 49297) % 233280; return x / 233280 }
  }
  const buildLoad = (player: GPSPlayer, idx: number) => {
    const r = rng(idx + 7)
    return days.map(d => {
      // every 7th day is rest day, every 6th is match
      const restDay = d % 7 === 0
      const matchDay = d % 7 === 6
      if (player.status === 'On Leave') return { v: 0, rest: restDay, trainedOnRest: false, match: false, restMissed: false }
      if (restDay) {
        const trainedOnRest = r() < 0.08
        return { v: trainedOnRest ? 320 + Math.floor(r() * 200) : 0, rest: true, trainedOnRest, match: false, restMissed: trainedOnRest }
      }
      if (matchDay) return { v: 1100 + Math.floor(r() * 200), rest: false, trainedOnRest: false, match: true, restMissed: false }
      const base = player.status === 'Restricted' ? 360 : player.status === 'High' ? 880 : 700
      return { v: Math.round(base + (r() - 0.5) * 360), rest: false, trainedOnRest: false, match: false, restMissed: false }
    })
  }
  const heat = players.map((p, i) => ({ player: p, cells: buildLoad(p, i) }))
  const colourFor = (v: number) => {
    if (v === 0) return '#1F2937'
    if (v < 500)  return '#14532D'
    if (v < 750)  return '#15803D'
    if (v < 950)  return '#CA8A04'
    if (v < 1100) return '#D97706'
    return '#B91C1C'
  }
  const phaseColour = (ph: 'M' | 'F' | 'O' | 'L' | '') =>
    ph === 'M' ? '#EC4899' : ph === 'F' ? '#3B82F6' : ph === 'O' ? '#A78BFA' : ph === 'L' ? '#F59E0B' : 'transparent'

  const restricted = players.filter(p => p.status === 'Restricted' || p.status === 'On Leave')
  const safeSessions = 87 // %

  return (
    <div className="space-y-6">
      {/* Karen Carney compliance banner */}
      <div className="bg-pink-600/10 border border-pink-600/30 rounded-xl p-4 flex items-start gap-3">
        <span className="text-base">🌸</span>
        <div className="flex-1">
          <div className="text-xs font-bold text-pink-300 mb-1">Karen Carney Review — Welfare Compliance</div>
          <p className="text-[11px] text-pink-200/80">28-day rolling load monitoring with cycle-phase overlay, rest-day enforcement and RTP tracking. All metrics auditable against FA &amp; Carney recommendations on player welfare.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Sessions in safe band" value={`${safeSessions}%`} sub="All players within load threshold" color="green" />
        <StatCard label="Rest-day breaches"     value="2"                   sub="Last 28 days · investigated"   color="amber" />
        <StatCard label="Players in RTP"        value={String(restricted.length)} sub="Tracked daily"          color="red" />
        <StatCard label="Cycle data opt-in"     value="3 / 9"               sub="Voluntary · medical role-gated" color="pink" />
      </div>

      {/* 28-day rolling load heatmap */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">28-Day Rolling Load Heatmap</h3>
            <p className="text-[11px] text-gray-500">Rows = players · Columns = days · Hover any cell for daily detail</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: '#14532D' }} />Low</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: '#CA8A04' }} />Optimal</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: '#D97706' }} />High</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: '#B91C1C' }} />Over</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="text-[10px] border-separate" style={{ borderSpacing: '2px' }}>
            <thead>
              <tr>
                <th className="text-left pr-2 text-gray-500 font-normal">Player</th>
                {days.map(d => <th key={d} className="text-gray-600 font-normal w-5">{d % 7 === 6 ? 'M' : d}</th>)}
              </tr>
            </thead>
            <tbody>
              {heat.map(row => {
                const cyc = cyclePhases[row.player.name]
                return (
                  <tr key={row.player.name}>
                    <td className="pr-2 text-gray-300 whitespace-nowrap">{row.player.name}</td>
                    {row.cells.map((c, di) => {
                      const tooltip = c.rest
                        ? (c.trainedOnRest ? `Day ${di+1} · Trained on rest day (${c.v} AU) — flagged` : `Day ${di+1} · Rest day (compliant)`)
                        : c.match ? `Day ${di+1} · Match · ${c.v} AU`
                        : `Day ${di+1} · Training · ${c.v} AU${c.v >= 950 ? ' — exceeds threshold' : ''}`
                      return (
                        <td key={di} className="relative" title={tooltip}>
                          {c.rest && !c.trainedOnRest ? (
                            <div className="w-5 h-5 rounded-sm flex items-center justify-center" style={{ background: '#0a0c14', border: '1px solid #1F2937' }}>
                              <span className="block w-1.5 h-1.5 rounded-full bg-green-500" />
                            </div>
                          ) : c.trainedOnRest ? (
                            <div className="w-5 h-5 rounded-sm flex items-center justify-center" style={{ background: '#7F1D1D' }}>
                              <span className="block w-1.5 h-1.5 rounded-full bg-red-300" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-sm relative" style={{ background: colourFor(c.v) }}>
                              {c.match && <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">M</span>}
                              {!c.match && c.v >= 950 && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-300 rounded-full border border-[#0D1117]" />}
                              {cyc && cyc[di] && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: phaseColour(cyc[di]) }} />
                              )}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-800 text-[10px] text-gray-400 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> Rest day (compliant)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-300" /> Trained on rest day</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-amber-300 rounded-full" /> Load threshold exceeded</span>
          <span className="flex items-center gap-1.5 ml-auto">
            <span>Cycle phase:</span>
            <span className="flex items-center gap-1"><span className="w-2 h-1 rounded-sm" style={{ background: '#EC4899' }} />Menstrual</span>
            <span className="flex items-center gap-1"><span className="w-2 h-1 rounded-sm" style={{ background: '#3B82F6' }} />Follicular</span>
            <span className="flex items-center gap-1"><span className="w-2 h-1 rounded-sm" style={{ background: '#A78BFA' }} />Ovulatory</span>
            <span className="flex items-center gap-1"><span className="w-2 h-1 rounded-sm" style={{ background: '#F59E0B' }} />Luteal</span>
          </span>
        </div>
        <p className="text-[10px] text-gray-600 mt-2">Cycle-phase overlay shown only for players who have opted into Lumio Cycle. Data is role-gated to medical &amp; welfare staff. Phase markers do not affect tactical visibility.</p>
      </div>

      {/* Return to Play tracker */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Return-to-Play Tracker</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Player</th>
              <th className="text-left p-3">Stage</th>
              <th className="text-left p-3">Issue</th>
              <th className="text-right p-3">Days remaining</th>
              <th className="text-left p-3">Clearance</th>
            </tr></thead>
            <tbody>
              {[
                { p: 'Sophie Turner', s: 'RTP Phase 3 — full training (60%)', i: 'Calf strain · grade 2',     d: '4',  c: 'Cleared 60% volume', cls: 'text-amber-400' },
                { p: 'Sophie Lawson', s: 'On leave · maternity',              i: 'Maternity leave (private)', d: '—',  c: 'Welfare lead only',   cls: 'text-blue-400' },
                { p: 'Emily Zhang',   s: 'RTP Phase 4 — return-to-match',     i: 'ACL post-op · 9 months',    d: '12', c: 'Match-fit decision',  cls: 'text-green-400' },
              ].map((r, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="p-3 text-gray-200 font-medium">{r.p}</td>
                  <td className="p-3 text-gray-300 text-xs">{r.s}</td>
                  <td className="p-3 text-gray-400 text-xs">{r.i}</td>
                  <td className="p-3 text-right text-gray-300">{r.d}</td>
                  <td className={`p-3 text-xs font-bold ${r.cls}`}>{r.c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── LOAD TRENDS & ACWR ──────────────────────────────────────────────────────
const GPSLoadTrends = ({ players }: { players: GPSPlayer[] }) => {
  const teamLoad30 = [780, 820, 760, 740, 880, 1180, 410, 720, 760, 820, 800, 760, 1120, 380, 740, 800, 820, 840, 880, 1140, 400, 760, 820, 860, 880, 900, 1180, 380, 780, 820]
  return (
    <div className="space-y-6">
      {/* 30-day team load */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">30-Day Team Load</h3>
            <p className="text-[11px] text-gray-500">Squad average daily load (AU) · Match days marked</p>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 inline-block bg-pink-500" /><span className="text-gray-400">Daily load</span></span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /><span className="text-gray-400">Match day</span></span>
          </div>
        </div>
        {(() => {
          const W = 700, H = 200, padL = 36, padR = 12, padT = 16, padB = 28
          const innerW = W - padL - padR, innerH = H - padT - padB
          const stepX = innerW / (teamLoad30.length - 1)
          const yMax = 1300
          const path = teamLoad30.map((v, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * stepX} ${padT + innerH - (v / yMax) * innerH}`).join(' ')
          return (
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="30-day team load">
              {[0, 0.25, 0.5, 0.75, 1].map((t, i) => <line key={i} x1={padL} x2={W - padR} y1={padT + innerH - t * innerH} y2={padT + innerH - t * innerH} stroke="rgba(255,255,255,0.06)" />)}
              {[0, 400, 800, 1200].map((v, i) => <text key={i} x={padL - 6} y={padT + innerH - (v / yMax) * innerH + 3} fontSize="9" fill="#9CA3AF" textAnchor="end">{v}</text>)}
              <line x1={padL} x2={W - padR} y1={padT + innerH - (1000 / yMax) * innerH} y2={padT + innerH - (1000 / yMax) * innerH} stroke="rgba(245,158,11,0.4)" strokeDasharray="3 3" />
              <text x={W - padR - 4} y={padT + innerH - (1000 / yMax) * innerH - 4} fontSize="9" fill="#F59E0B" textAnchor="end">High-load 1000 AU</text>
              <path d={path} fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {teamLoad30.map((v, i) => v > 1050 ? <circle key={i} cx={padL + i * stepX} cy={padT + innerH - (v / yMax) * innerH} r="3" fill="#F59E0B" /> : null)}
              {[0, 7, 14, 21, 28].map(d => <text key={d} x={padL + d * stepX} y={H - 8} fontSize="9" fill="#6B7280" textAnchor="middle">D{d + 1}</text>)}
            </svg>
          )
        })()}
      </div>

      {/* Full squad ACWR table */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Full Squad — ACWR</h3>
          <span className="text-[10px] text-gray-500">7-day acute · 28-day chronic · Updated 06:30</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Player</th>
              <th className="text-right p-3">Acute (7d)</th>
              <th className="text-right p-3">Chronic (28d)</th>
              <th className="text-right p-3">Ratio</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Trend (4w)</th>
            </tr></thead>
            <tbody>
              {players.filter(p => p.status !== 'On Leave').map((p, i) => {
                const chronic = Math.max(450, Math.round(p.load * (0.85 + (i % 4) * 0.04)))
                const acute = Math.round(chronic * p.acwr)
                const status = p.acwr > 1.4 ? { l: 'Spike risk', cls: 'bg-red-600/20 text-red-400' }
                  : p.acwr > 1.3 ? { l: 'High',         cls: 'bg-amber-600/20 text-amber-400' }
                  : p.acwr < 0.8 ? { l: 'Under-loaded', cls: 'bg-blue-600/20 text-blue-400' }
                  : { l: 'Optimal', cls: 'bg-green-600/20 text-green-400' }
                // micro sparkline
                const seed = (p.name.charCodeAt(0) + i) * 13
                const pts = Array.from({ length: 8 }, (_, k) => 0.4 + ((seed + k * 7) % 50) / 100 + p.acwr * 0.2)
                const sw = 80, sh = 20
                const path = pts.map((v, k) => `${k === 0 ? 'M' : 'L'} ${(k / (pts.length - 1)) * sw} ${sh - v * sh}`).join(' ')
                return (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className="p-3 text-gray-200 font-medium">{p.name} <span className="text-[10px] text-gray-500 ml-1">{p.pos}</span></td>
                    <td className="p-3 text-right text-gray-300">{acute}</td>
                    <td className="p-3 text-right text-gray-300">{chronic}</td>
                    <td className="p-3 text-right"><span className={`text-xs font-bold ${p.acwr > 1.3 ? 'text-amber-400' : p.acwr < 0.8 ? 'text-blue-400' : 'text-green-400'}`}>{p.acwr.toFixed(2)}</span></td>
                    <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${status.cls}`}>{status.l}</span></td>
                    <td className="p-3"><svg viewBox={`0 0 ${sw} ${sh}`} width={sw} height={sh}><path d={path} fill="none" stroke={p.acwr > 1.3 ? '#F59E0B' : p.acwr < 0.8 ? '#3B82F6' : '#22C55E'} strokeWidth="1.5" /></svg></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4-week ACWR chart for flagged players */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">4-Week ACWR — Flagged Players</h3>
            <p className="text-[11px] text-gray-500">Weekly acute:chronic ratio · Sweet spot 0.8–1.3</p>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 inline-block bg-pink-500" /><span className="text-gray-400">Walsh</span></span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 inline-block bg-amber-400" /><span className="text-gray-400">Brooks</span></span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 inline-block bg-blue-400" /><span className="text-gray-400">Turner</span></span>
          </div>
        </div>
        {(() => {
          const wks = ['W-3','W-2','W-1','This wk']
          const walsh  = [1.05, 1.18, 1.31, 1.42]
          const brooks = [1.02, 1.14, 1.26, 1.38]
          const turner = [0.42, 0.51, 0.58, 0.62]
          const W = 600, H = 200, padL = 36, padR = 12, padT = 16, padB = 28
          const innerW = W - padL - padR, innerH = H - padT - padB
          const stepX = innerW / (wks.length - 1), yMax = 1.6
          const buildPath = (d: number[]) => d.map((v, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * stepX} ${padT + innerH - (v / yMax) * innerH}`).join(' ')
          return (
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="4-week ACWR for flagged players">
              {/* sweet spot band */}
              <rect x={padL} y={padT + innerH - (1.3 / yMax) * innerH} width={innerW} height={(1.3 - 0.8) / yMax * innerH} fill="rgba(34,197,94,0.06)" />
              <line x1={padL} x2={W - padR} y1={padT + innerH - (0.8 / yMax) * innerH} y2={padT + innerH - (0.8 / yMax) * innerH} stroke="rgba(34,197,94,0.3)" strokeDasharray="3 3" />
              <line x1={padL} x2={W - padR} y1={padT + innerH - (1.3 / yMax) * innerH} y2={padT + innerH - (1.3 / yMax) * innerH} stroke="rgba(245,158,11,0.4)" strokeDasharray="3 3" />
              {[0, 0.4, 0.8, 1.2, 1.6].map((v, i) => <text key={i} x={padL - 6} y={padT + innerH - (v / yMax) * innerH + 3} fontSize="9" fill="#9CA3AF" textAnchor="end">{v.toFixed(1)}</text>)}
              {wks.map((w, i) => <text key={w} x={padL + i * stepX} y={H - 8} fontSize="9" fill="#6B7280" textAnchor="middle">{w}</text>)}
              <path d={buildPath(walsh)} fill="none" stroke="#EC4899" strokeWidth="2" />
              {walsh.map((v, i) => <circle key={`wa${i}`} cx={padL + i * stepX} cy={padT + innerH - (v / yMax) * innerH} r="2.5" fill="#EC4899" />)}
              <path d={buildPath(brooks)} fill="none" stroke="#F59E0B" strokeWidth="2" />
              {brooks.map((v, i) => <circle key={`br${i}`} cx={padL + i * stepX} cy={padT + innerH - (v / yMax) * innerH} r="2.5" fill="#F59E0B" />)}
              <path d={buildPath(turner)} fill="none" stroke="#3B82F6" strokeWidth="2" strokeDasharray="3 3" />
              {turner.map((v, i) => <circle key={`tu${i}`} cx={padL + i * stepX} cy={padT + innerH - (v / yMax) * innerH} r="2.5" fill="#3B82F6" />)}
            </svg>
          )
        })()}
        <p className="text-[11px] text-gray-500 mt-2">Walsh and Brooks both crossed 1.3 this week — taper Wed/Thu before Sat fixture. Turner under-loaded by design (RTP phase 3).</p>
      </div>

      {/* Monotony score */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-1">Training Monotony Score</h3>
        <p className="text-[11px] text-gray-500 mb-4">Daily load mean ÷ standard deviation across 7 days · &lt;1.5 healthy · &gt;2.0 elevated injury risk</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {players.filter(p => p.status !== 'On Leave').map((p, i) => {
            const mono = +(0.9 + ((p.name.charCodeAt(1) + i) % 14) * 0.1).toFixed(2)
            const cls = mono > 2.0 ? 'text-red-400' : mono > 1.5 ? 'text-amber-400' : 'text-green-400'
            return (
              <div key={p.name} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 truncate">{p.name}</div>
                <div className={`text-xl font-black ${cls}`}>{mono.toFixed(2)}</div>
                <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (mono / 2.5) * 100)}%`, background: mono > 2.0 ? '#EF4444' : mono > 1.5 ? '#F59E0B' : '#22C55E' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── MATCH vs TRAINING ───────────────────────────────────────────────────────
const GPSMatchVsTraining = () => {
  const data = [
    { name: 'Priya Nair',     mDist: 11.8, tDist: 9.4,  mHsr: 980,  tHsr: 720, mSpr: 28, tSpr: 18 },
    { name: 'Jade Osei',      mDist: 11.2, tDist: 8.8,  mHsr: 920,  tHsr: 640, mSpr: 32, tSpr: 22 },
    { name: 'Abbi Walsh',     mDist: 11.5, tDist: 9.2,  mHsr: 1020, tHsr: 740, mSpr: 34, tSpr: 24 },
    { name: 'Charlotte Reed', mDist: 10.4, tDist: 8.6,  mHsr: 720,  tHsr: 540, mSpr: 16, tSpr: 12 },
    { name: 'Fatima Al-Said', mDist: 11.2, tDist: 9.0,  mHsr: 920,  tHsr: 700, mSpr: 24, tSpr: 18 },
    { name: 'Megan Hughes',   mDist: 11.6, tDist: 9.4,  mHsr: 820,  tHsr: 620, mSpr: 22, tSpr: 16 },
    { name: 'Tilly Brooks',   mDist: 10.6, tDist: 8.4,  mHsr: 880,  tHsr: 660, mSpr: 28, tSpr: 20 },
  ]
  const Bars = ({ field1, field2, max, label }: { field1: keyof typeof data[0]; field2: keyof typeof data[0]; max: number; label: string }) => {
    const W = 600, rowH = 30, padL = 110, padR = 30, padT = 8
    const H = padT + data.length * rowH + 8
    const innerW = W - padL - padR
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={label}>
        {data.map((d, i) => {
          const y = padT + i * rowH
          const m = d[field1] as number, t = d[field2] as number
          const mw = (m / max) * innerW
          const tw = (t / max) * innerW
          return (
            <g key={d.name}>
              <text x={padL - 8} y={y + 14} fontSize="10" fill="#9CA3AF" textAnchor="end">{d.name}</text>
              <rect x={padL} y={y + 2}  width={mw} height="10" fill="#EC4899" />
              <text  x={padL + mw + 4}  y={y + 11} fontSize="9" fill="#EC4899">{typeof m === 'number' ? (m % 1 ? m.toFixed(1) : m) : m}</text>
              <rect x={padL} y={y + 14} width={tw} height="10" fill="#0D9488" />
              <text  x={padL + tw + 4}  y={y + 23} fontSize="9" fill="#0D9488">{typeof t === 'number' ? (t % 1 ? t.toFixed(1) : t) : t}</text>
            </g>
          )
        })}
      </svg>
    )
  }
  return (
    <div className="space-y-6">
      <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-3 text-xs text-blue-300">
        ⚽ Comparing last <strong>WSL match output</strong> vs average <strong>training output</strong> for the same player. Helps surface players whose training under-prepares them for match intensity.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-1">Distance — Match vs Training</h3>
          <p className="text-[11px] text-gray-500 mb-3">Pink = match · Teal = training (km)</p>
          <Bars field1="mDist" field2="tDist" max={13} label="Distance match vs training" />
        </div>
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-1">HSR — Match vs Training</h3>
          <p className="text-[11px] text-gray-500 mb-3">High-speed running (m, &gt;19.8 km/h)</p>
          <Bars field1="mHsr" field2="tHsr" max={1100} label="HSR match vs training" />
        </div>
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-white mb-1">Sprint Count — Match vs Training</h3>
          <p className="text-[11px] text-gray-500 mb-3">Number of sprint actions (&gt;25 km/h)</p>
          <Bars field1="mSpr" field2="tSpr" max={40} label="Sprint count match vs training" />
        </div>
      </div>

      {/* Players with concerning gap */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Concerning Match-to-Training Gaps</h3>
        <p className="text-[11px] text-gray-500 mb-4">Players whose training output sits &gt;25% below match output — indicates prep intensity may be insufficient.</p>
        <div className="space-y-2">
          {data.map(d => {
            const gapPct = Math.round(((d.mHsr - d.tHsr) / d.mHsr) * 100)
            const flagged = gapPct > 25
            return flagged ? (
              <div key={d.name} className="flex items-center justify-between p-3 bg-amber-900/10 border border-amber-600/30 rounded-lg text-xs">
                <div>
                  <span className="text-gray-200 font-medium">{d.name}</span>
                  <span className="text-gray-500 ml-2">match HSR {d.mHsr}m · training HSR {d.tHsr}m</span>
                </div>
                <span className="text-amber-400 font-bold">−{gapPct}%</span>
              </div>
            ) : null
          })}
        </div>
      </div>
    </div>
  )
}

// ─── SPRINT ANALYSIS ─────────────────────────────────────────────────────────
const GPSSprintAnalysis = ({ players }: { players: GPSPlayer[] }) => {
  const active = players.filter(p => p.distance > 0 && p.pos !== 'GK')
  const sprintBands: Record<string, { b1: number; b2: number; b3: number; b4: number }> = {
    'Emma Clarke':    { b1: 3, b2: 1, b3: 0, b4: 0 },
    'Priya Nair':     { b1: 8, b2: 8, b3: 4, b4: 2 },
    'Jade Osei':      { b1: 6, b2: 8, b3: 8, b4: 4 },
    'Abbi Walsh':     { b1: 8, b2: 9, b3: 7, b4: 4 },
    'Charlotte Reed': { b1: 5, b2: 5, b3: 3, b4: 1 },
    'Sophie Turner':  { b1: 4, b2: 3, b3: 1, b4: 0 },
    'Fatima Al-Said': { b1: 6, b2: 7, b3: 5, b4: 2 },
    'Megan Hughes':   { b1: 6, b2: 6, b3: 4, b4: 2 },
    'Tilly Brooks':   { b1: 7, b2: 8, b3: 6, b4: 3 },
  }
  const fatigue: Record<string, { h1: number; h2: number }> = {
    'Priya Nair':     { h1: 13, h2: 9 },
    'Jade Osei':      { h1: 16, h2: 10 },
    'Abbi Walsh':     { h1: 18, h2: 10 },
    'Charlotte Reed': { h1: 9,  h2: 5 },
    'Fatima Al-Said': { h1: 13, h2: 7 },
    'Megan Hughes':   { h1: 11, h2: 7 },
    'Tilly Brooks':   { h1: 15, h2: 9 },
  }
  return (
    <div className="space-y-6">
      {/* Sprint count by distance band */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Sprint Count by Distance Band</h3>
            <p className="text-[11px] text-gray-500">Number of sprint actions per band (m)</p>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /><span className="text-gray-400">5–10 m</span></span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-teal-500" /><span className="text-gray-400">10–20 m</span></span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-purple-500" /><span className="text-gray-400">20–30 m</span></span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-pink-500" /><span className="text-gray-400">30 m+</span></span>
          </div>
        </div>
        {(() => {
          const W = 600, rowH = 24, padL = 110, padR = 30, padT = 8
          const H = padT + active.length * rowH + 8
          const innerW = W - padL - padR
          const maxSprints = Math.max(...active.map(p => {
            const sb = sprintBands[p.name]
            return (sb?.b1 || 0) + (sb?.b2 || 0) + (sb?.b3 || 0) + (sb?.b4 || 0)
          })) + 2
          return (
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Sprint count by distance band">
              {active.map((p, i) => {
                const sb = sprintBands[p.name] || { b1: 0, b2: 0, b3: 0, b4: 0 }
                const total = sb.b1 + sb.b2 + sb.b3 + sb.b4
                const y = padT + i * rowH
                const seg = (v: number) => (v / maxSprints) * innerW
                const w1 = seg(sb.b1), w2 = seg(sb.b2), w3 = seg(sb.b3), w4 = seg(sb.b4)
                return (
                  <g key={p.name}>
                    <text x={padL - 8} y={y + 14} fontSize="10" fill="#9CA3AF" textAnchor="end">{p.name}</text>
                    <rect x={padL}                    y={y + 6} width={w1} height="14" fill="#3B82F6" />
                    <rect x={padL + w1}               y={y + 6} width={w2} height="14" fill="#0D9488" />
                    <rect x={padL + w1 + w2}          y={y + 6} width={w3} height="14" fill="#A78BFA" />
                    <rect x={padL + w1 + w2 + w3}     y={y + 6} width={w4} height="14" fill="#EC4899" />
                    <text x={padL + seg(total) + 6} y={y + 16} fontSize="10" fill="#D1D5DB">{total}</text>
                  </g>
                )
              })}
            </svg>
          )
        })()}
      </div>

      {/* Top speed leaderboard + Accel/decel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">Top Speed Leaderboard</h3>
          <div className="space-y-2">
            {[...active].sort((a, b) => b.topSpeed - a.topSpeed).map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className={`w-6 text-center text-xs font-bold ${i === 0 ? 'text-pink-400' : i === 1 ? 'text-purple-400' : i === 2 ? 'text-blue-400' : 'text-gray-500'}`}>{i + 1}</span>
                <span className="text-xs text-gray-300 w-32">{p.name}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div className="h-2 rounded-full bg-pink-500" style={{ width: `${(p.topSpeed / 32) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-white w-16 text-right">{p.topSpeed.toFixed(1)} km/h</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 mt-3">Squad benchmark · 30 km/h. WSL average · 28.5 km/h.</p>
        </div>

        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">Acceleration / Deceleration Efforts</h3>
          <p className="text-[11px] text-gray-500 mb-3">Efforts &gt;3 m/s² — high mechanical load.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500 text-xs border-b border-gray-800">
                <th className="text-left p-2">Player</th>
                <th className="text-right p-2">Accels</th>
                <th className="text-right p-2">Decels</th>
                <th className="text-right p-2">Total</th>
              </tr></thead>
              <tbody>
                {active.sort((a, b) => (b.accels + b.decels) - (a.accels + a.decels)).map((p, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className="p-2 text-gray-300">{p.name}</td>
                    <td className="p-2 text-right text-gray-300">{p.accels}</td>
                    <td className="p-2 text-right text-gray-300">{p.decels}</td>
                    <td className="p-2 text-right text-pink-400 font-bold">{p.accels + p.decels}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sprint fatigue index */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-1">Sprint Fatigue Index — H1 vs H2</h3>
        <p className="text-[11px] text-gray-500 mb-4">Sprint count first half vs second half of session. Drop &gt;30% suggests undercooked conditioning.</p>
        <div className="space-y-2">
          {Object.entries(fatigue).map(([name, f]) => {
            const drop = Math.round(((f.h1 - f.h2) / f.h1) * 100)
            const concerning = drop > 30
            return (
              <div key={name} className="grid grid-cols-12 items-center gap-2 text-xs">
                <span className="col-span-3 text-gray-300">{name}</span>
                <div className="col-span-3 flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 w-6">H1</span>
                  <div className="flex-1 bg-gray-800 rounded h-2"><div className="h-2 rounded bg-pink-500" style={{ width: `${(f.h1 / 20) * 100}%` }} /></div>
                  <span className="text-gray-300 w-6 text-right">{f.h1}</span>
                </div>
                <div className="col-span-3 flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 w-6">H2</span>
                  <div className="flex-1 bg-gray-800 rounded h-2"><div className="h-2 rounded bg-teal-500" style={{ width: `${(f.h2 / 20) * 100}%` }} /></div>
                  <span className="text-gray-300 w-6 text-right">{f.h2}</span>
                </div>
                <span className={`col-span-3 text-right font-bold ${concerning ? 'text-amber-400' : 'text-gray-400'}`}>−{drop}% {concerning && '⚠'}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── CONNECT GPS ─────────────────────────────────────────────────────────────
const GPSConnectTab = () => (
  <div className="space-y-6">
    {/* JOHAN Sports featured partner */}
    <div className="bg-gradient-to-br from-pink-600/15 via-purple-600/10 to-blue-600/10 border border-pink-600/30 rounded-xl p-6">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl">📡</div>
        <div className="flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] uppercase tracking-wider font-bold text-pink-300 bg-pink-600/20 px-1.5 py-0.5 rounded">Featured Partner</span>
            <span className="text-[9px] uppercase tracking-wider text-gray-400">GPS Hardware</span>
          </div>
          <h3 className="text-base font-bold text-white">JOHAN Sports — Women's Football GPS</h3>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            Lightweight chest-strap and vest GPS designed for women's football. 10 Hz GPS, IMU, heart rate, and live broadcast. Default integration for Women's FC across WSL, Championship and grassroots tiers.
          </p>
        </div>
        <button disabled className="px-4 py-2 rounded-lg text-xs font-medium bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed self-start">+ Pair new device</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        {[
          { l: 'Devices allocated', v: '10' },
          { l: 'Active today',      v: '9' },
          { l: 'Charging dock',     v: '1 unit' },
          { l: 'Firmware',          v: 'v4.12.1 ✓' },
        ].map(s => (
          <div key={s.l} className="bg-[#0a0c14]/70 border border-gray-800 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">{s.l}</div>
            <div className="text-sm font-bold text-white mt-0.5">{s.v}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Integration status panel */}
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-bold text-white mb-3">Integration Status</h3>
      <div className="space-y-2">
        {[
          { system: 'JOHAN Sports GPS',         status: 'Connected', detail: '10 vests allocated · 9 active · last sync 09:14',       hub: 'Hardware'    },
          { system: 'Lumio Health (ACL model)', status: 'Connected', detail: 'ACL composite score syncing daily · 3 flagged players', hub: 'Risk model'  },
          { system: 'FA Player Registration',   status: 'Connected', detail: 'Squad list synced daily 06:00 · last sync 06:02',       hub: 'Compliance'  },
          { system: 'Lumio Cycle (opt-in)',     status: 'Connected', detail: '3 of 9 players opted in · medical role-gated',           hub: 'Welfare'     },
          { system: 'Second Spectrum',          status: 'Pending',   detail: 'Video tracking integration scheduled for Phase 2',      hub: 'Tactical'    },
          { system: 'PolarPro HRM bridge',      status: 'Available', detail: 'Heart-rate variability cross-check — not yet enabled',  hub: 'Optional'    },
        ].map(s => (
          <div key={s.system} className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0 gap-3 flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-200 font-medium">{s.system}</span>
                <span className="text-[9px] uppercase tracking-wider text-gray-500 bg-gray-800/60 px-1.5 py-0.5 rounded">{s.hub}</span>
              </div>
              <span className="text-[10px] text-gray-500">{s.detail}</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded ${s.status === 'Connected' ? 'bg-green-600/20 text-green-400' : s.status === 'Pending' ? 'bg-amber-600/20 text-amber-400' : 'bg-gray-700/50 text-gray-400'}`}>{s.status}</span>
          </div>
        ))}
      </div>
    </div>

    {/* FA Player Registration sync + Last sync */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">FA Player Registration Sync</h3>
          <span className="text-xs px-2 py-0.5 rounded bg-green-600/20 text-green-400">Connected</span>
        </div>
        <div className="space-y-2 text-xs">
          {[
            { l: 'Last sync',         v: 'Today 06:02', c: 'text-gray-300' },
            { l: 'Players in scope',  v: '24 (full squad)', c: 'text-gray-300' },
            { l: 'Reg. mismatches',   v: '0', c: 'text-green-400' },
            { l: 'Eligibility flags', v: '1 — Lawson (maternity, FA notified)', c: 'text-amber-400' },
          ].map(r => (
            <div key={r.l} className="flex justify-between py-1.5 border-b border-gray-800 last:border-0">
              <span className="text-gray-500">{r.l}</span>
              <span className={`font-medium ${r.c}`}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">Last Sync · Activity</h3>
          <span className="text-[10px] text-gray-500">UTC+1</span>
        </div>
        <div className="space-y-2 text-xs">
          {[
            { t: '09:14', a: 'GPS upload from JOHAN bridge', d: '9 vests · MD-3 session' },
            { t: '06:30', a: 'ACL composite score recompute', d: 'Lumio Health · 3 flags' },
            { t: '06:02', a: 'FA registration pull',         d: '24 players · 0 mismatches' },
            { t: '05:45', a: 'Cycle phase update',           d: 'Lumio Cycle · 3 opt-in players' },
          ].map(r => (
            <div key={r.t} className="flex items-start gap-3 py-1.5 border-b border-gray-800 last:border-0">
              <span className="text-gray-500 font-mono w-12 flex-shrink-0">{r.t}</span>
              <div className="flex-1">
                <div className="text-gray-300">{r.a}</div>
                <div className="text-[10px] text-gray-500">{r.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <button disabled className="px-4 py-2 rounded-lg text-xs font-medium bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed">+ Connect new integration</button>
      <button disabled className="px-4 py-2 rounded-lg text-xs font-medium bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed">⌨ Manual data entry</button>
      <span className="text-[10px] text-gray-500">Available in live portal</span>
    </div>
  </div>
)

// ─── PLACEHOLDER VIEW ─────────────────────────────────────────────────────────

// ─── SPONSORSHIP PIPELINE VIEW ─────────────────────────────────────────────────
const SponsorshipPipelineView = ({ club }: { club: WomensClub }) => {
  const fmt = (n: number): string => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)
  const deals: Array<{partner:string;type:string;value:number;attribution:string;end:string;status:string;flag:string}> = [
    {partner:'Kestrel Finance',type:'Kit',value:85000,attribution:'Standalone (100%)',end:'30 Apr 2025',status:'RENEWAL DUE',flag:''},
    {partner:'NovaTech UK',type:'Sleeve',value:40000,attribution:'Standalone (100%)',end:'30 Apr 2025',status:'RENEWAL DUE',flag:''},
    {partner:'Meridian Insurance',type:'Back of shirt',value:95000,attribution:'Bundled (64%)',end:'Dec 2025',status:'Active',flag:'FSR REVIEW'},
    {partner:'Lumio Tech',type:'Training kit',value:18000,attribution:'Standalone',end:'Mar 2026',status:'Active',flag:''},
  ]
  return (
    <div>
      <SectionHeader title="Sponsorship Pipeline — Standalone Commercial" subtitle="FSR-aware commercial CRM with bundled deal attribution" icon="🤝" />
      {!club.kitSponsor && <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 mb-6 text-xs text-amber-400">⚠ No kit sponsor active — flagged in FSR revenue dashboard.</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Deals" value="4" color="pink" />
        <StatCard label="Annual Value" value={fmt(238000)} color="teal" />
        <StatCard label="In Negotiation" value="2" color="amber" />
        <StatCard label="Renewals (30d)" value="2" sub="Kestrel + NovaTech" color="red" />
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
            <th className="text-left p-3">Partner</th><th className="text-left p-3">Type</th><th className="text-left p-3">Value</th><th className="text-left p-3">FSR Attribution</th><th className="text-left p-3">End</th><th className="text-left p-3">Status</th>
          </tr></thead>
          <tbody>
            {deals.map((d: typeof deals[0], i: number) => (
              <tr key={i} className={`border-b border-gray-800/50 ${d.flag === 'FSR REVIEW' ? 'bg-red-600/5' : ''}`}>
                <td className="p-3 text-gray-200 font-medium">{d.partner}</td>
                <td className="p-3 text-gray-400 text-xs">{d.type}</td>
                <td className="p-3 text-gray-300">{fmt(d.value)}</td>
                <td className="p-3 text-xs">{d.attribution.includes('Bundled') ? <span className="text-red-400 font-medium">{d.attribution}</span> : <span className="text-green-400">{d.attribution}</span>}</td>
                <td className="p-3 text-gray-400 text-xs">{d.end}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${d.status === 'RENEWAL DUE' ? 'bg-amber-600/20 text-amber-400' : 'bg-green-600/20 text-green-400'}`}>{d.status}</span>{d.flag && <span className="text-xs px-2 py-0.5 rounded bg-red-600/20 text-red-400 ml-1">{d.flag}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-red-600/5 border border-red-600/30 rounded-xl p-4 mb-6">
        <div className="text-xs text-red-400 font-medium mb-1">⚠ Bundled Attribution Review Required</div>
        <div className="text-xs text-gray-400">Meridian Insurance — bundled attribution 64% of £450k group deal. Women&apos;s share: £95k. Review recommended.</div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">Brand Values Alignment</h3>
        <div className="space-y-2">
          {deals.map((d: typeof deals[0], i: number) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-gray-300">{d.partner}</span>
              <div className="flex gap-3 text-xs text-gray-400">
                <span>Empowerment {'★'.repeat(4)}{'☆'.repeat(1)}</span>
                <span>Equality {'★'.repeat(i < 2 ? 5 : 3)}{'☆'.repeat(i < 2 ? 0 : 2)}</span>
                <span>Community {'★'.repeat(i < 3 ? 4 : 3)}{'☆'.repeat(i < 3 ? 1 : 2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Prospect Pipeline</h3>
        <div className="space-y-2">
          {['Aurora Fitness (sleeve — est. £30k)','West Country Energy (stand naming — £15k)','Hartfield Building Society (community — £12k)','TechNow Digital (back of shirt — £45k)','GreenLeaf Nutrition (training kit — £20k)'].map((p: string, i: number) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 text-xs"><span className="text-gray-400">{p}</span><span className="text-gray-600">Prospect</span></div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── STANDALONE TRACKER VIEW ──────────────────────────────────────────────────
const StandaloneTrackerView = ({ club }: { club: WomensClub }) => (
  <div>
    <SectionHeader title="Standalone Identity Tracker" subtitle="Building standalone commercial identity — FSR incentivised" icon="🏗️" />
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <p className="text-xs text-gray-400 mb-4">Revenue attributed directly to women&apos;s football increases your permitted salary cap under FSR.</p>
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 120 120" className="w-28 h-28 flex-shrink-0">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#1f2937" strokeWidth="10" />
          <circle cx="60" cy="60" r="50" fill="none" stroke="#EC4899" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${0.68 * 314} 314`} transform="rotate(-90 60 60)" />
          <text x="60" y="55" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">68%</text>
          <text x="60" y="72" textAnchor="middle" fill="#6b7280" fontSize="9">Standalone</text>
        </svg>
        <div className="text-xs text-gray-400 space-y-1">
          <div><span className="text-pink-400 font-medium">68%</span> standalone revenue</div>
          <div><span className="text-gray-500">32%</span> affiliated/bundled</div>
        </div>
      </div>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-3">Demerger Readiness Checklist</h3>
      <div className="space-y-2">
        {[{item:'Separate legal entity registered',done:true},{item:'Brand assets independently owned',done:true},{item:'Stadium/facility agreement',done:false,note:'In progress'},{item:'TUPE staff transfers',done:false,note:'Not started'},{item:'Bank account separation',done:true},{item:'Independent commercial deals',done:false,note:'2 bundled'}].map((c: {item:string;done:boolean;note?:string}, i: number) => (
          <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-800/50 text-sm">
            <span className={c.done ? 'text-green-400' : 'text-red-400'}>{c.done ? '✓' : '✗'}</span>
            <span className={c.done ? 'text-gray-400' : 'text-gray-300'}>{c.item}</span>
            {c.note && <span className="text-xs text-amber-400 ml-auto">{c.note}</span>}
          </div>
        ))}
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4 mb-6">
      <StatCard label="Indicative Valuation" value={new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(club.relevantRevenue * 2.5)} sub="Revenue × 2.5x" color="pink" />
      <StatCard label="Dependency Score" value="32%" sub="Lower is better ↓" color="amber" />
      <StatCard label="Standalone Readiness" value="58%" sub="Target: 85%" color="blue" />
    </div>
    <div className="w-full bg-gray-800 rounded-full h-3"><div className="h-3 rounded-full" style={{width:'58%',backgroundColor:'#EC4899'}} /></div>
    <div className="text-xs text-gray-500 mt-1">Standalone readiness: 58%</div>
  </div>
)

// ─── BOARD SUITE VIEW ─────────────────────────────────────────────────────────
const BoardSuiteView = ({ club }: { club: WomensClub }) => (
  <div>
    <SectionHeader title={`Board Suite — ${club.name}`} subtitle="Executive dashboard for board and investors" icon="🏛️" />
    <div className="bg-pink-600/10 border border-pink-600/30 rounded-xl p-4 mb-6 flex items-center justify-between">
      <div><div className="text-sm text-pink-300 font-medium">Next board meeting: 15 Apr 2025</div><div className="text-xs text-gray-400">Pack due in 11 days</div></div>
      <button disabled className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed">Generate Pack — Phase 2</button>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="FSR Status" value={`Safe (${club.salarySpend ?? 0}%)`} color="green" />
      <StatCard label="Headroom" value={club.fsrHeadroom ? `£${(club.fsrHeadroom/1000).toFixed(0)}k` : 'N/A'} color="teal" />
      <StatCard label="Revenue vs Budget" value="87%" color="blue" />
      <StatCard label="Pipeline" value="£238k" color="pink" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Squad" value="20" color="purple" />
      <StatCard label="Welfare Flags" value="2" color="amber" />
      <StatCard label="Attendance" value="2,847" color="blue" />
      <StatCard label="Points" value="34" color="green" />
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-3">Commercial Growth (Season-on-Season)</h3>
      <svg viewBox="0 0 400 140" className="w-full">
        {[{year:'22-23',md:180,com:120,bc:80},{year:'23-24',md:220,com:180,bc:120},{year:'24-25',md:280,com:240,bc:160},{year:'25-26',md:320,com:310,bc:200}].map((y: {year:string;md:number;com:number;bc:number}, i: number) => {
          const x = 40 + i * 90; const scale = 100 / 350;
          return (<g key={i}><rect x={x} y={120 - y.md * scale} width={20} height={y.md * scale} rx={2} fill="#EC4899" opacity={0.7} /><rect x={x + 22} y={120 - y.com * scale} width={20} height={y.com * scale} rx={2} fill="#8B5CF6" opacity={0.7} /><rect x={x + 44} y={120 - y.bc * scale} width={20} height={y.bc * scale} rx={2} fill="#38BDF8" opacity={0.7} /><text x={x + 32} y={135} textAnchor="middle" fill="#6b7280" fontSize="9">{y.year}</text></g>)
        })}
      </svg>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-bold text-white mb-3">WSL Compliance</h3>
      <div className="space-y-2">
        {[{item:'FSR salary cap',ok:true},{item:'Age-band minimums',ok:false,note:'1 player'},{item:'Welfare standards',ok:true},{item:'Registration',ok:true},{item:'Dual reg records',ok:true}].map((c: {item:string;ok:boolean;note?:string}, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-gray-800/50"><span className={c.ok ? 'text-green-400' : 'text-red-400'}>{c.ok ? '✓' : '✗'}</span><span className="text-gray-300">{c.item}</span>{c.note && <span className="text-amber-400 ml-auto">{c.note}</span>}</div>
        ))}
      </div>
    </div>
  </div>
)

// ─── FINANCIAL PLANNING VIEW ──────────────────────────────────────────────────
const WomensClubVisionView = ({ club }: { club: WomensClub }) => {
  const [planTab, setPlanTab] = useState<'1yr'|'3yr'|'5yr'|'10yr'>('1yr')
  const fmtC = (n: number): string => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)
  const permitted = club.relevantRevenue * 0.8
  const headroom = club.fsrHeadroom ?? 0
  return (
    <div>
      <SectionHeader title="Club Planner — FSR-Constrained" subtitle="Multi-horizon planning with FSR compliance modelling" icon="💷" />
      <div className="flex gap-1 bg-[#0D1117] border border-gray-800 rounded-lg p-1 w-fit mb-6">
        {(['1yr','3yr','5yr','10yr'] as const).map((t: typeof planTab) => (
          <button key={t} onClick={() => setPlanTab(t)} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${planTab === t ? 'bg-pink-600/20 text-pink-400 border border-pink-600/30' : 'text-gray-500 hover:text-gray-300'}`}>{t === '1yr' ? '1 Year' : t === '3yr' ? '3 Year' : t === '5yr' ? '5 Year' : '10 Year'}</button>
        ))}
      </div>
      {planTab === '1yr' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Revenue" value={fmtC(club.relevantRevenue)} color="pink" />
            <StatCard label="Permitted (80%)" value={fmtC(permitted)} color="teal" />
            <StatCard label="Current Spend" value={fmtC(permitted - headroom)} color="blue" />
            <StatCard label="Headroom" value={fmtC(headroom)} color="green" />
          </div>
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5"><h3 className="text-sm font-bold text-white mb-2">Matchday Target</h3><div className="text-xs text-gray-400">2,847 avg × 22 games × £18 ticket = <span className="text-pink-400 font-bold">£1.13M</span></div></div>
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5"><h3 className="text-sm font-bold text-white mb-2">Transfer Budget</h3><div className="text-xs text-gray-400">{fmtC(headroom)} FSR headroom for signings</div></div>
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5"><h3 className="text-sm font-bold text-white mb-2">Cash Funding</h3><div className="text-xs text-gray-400">Owner contribution max: <span className="text-pink-400 font-bold">£500k</span>/season</div></div>
        </div>
      )}
      {planTab === '3yr' && (<div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 space-y-2">{['+12% attendance growth/yr','2 new commercial deals/yr','Broadcast renegotiation 2027','Revenue target Y3: £3.2M → spend £2.56M','WSL 14-club expansion: extra broadcast'].map((s: string, i: number) => (<div key={i} className="text-xs text-gray-400 py-1 border-b border-gray-800/50">→ {s}</div>))}</div>)}
      {planTab === '5yr' && (<div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 space-y-2">{['Stadium: 6,500 → 9,000 by Y4','Eliminate bundled deals by Y3','Full portfolio: kit + title + 6 partners','Self-sustaining model'].map((s: string, i: number) => (<div key={i} className="text-xs text-gray-400 py-1 border-b border-gray-800/50">→ {s}</div>))}</div>)}
      {planTab === '10yr' && (<div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 space-y-2">{['Full commercial independence','UWCL revenue modelling','Academy ROI over decade','Decade P&L with FSR at each milestone'].map((s: string, i: number) => (<div key={i} className="text-xs text-gray-400 py-1 border-b border-gray-800/50">→ {s}</div>))}</div>)}
    </div>
  )
}

// ─── STAFF DIRECTORY VIEW ─────────────────────────────────────────────────────
const StaffDirectoryView = () => (
  <div>
    <SectionHeader title="Staff Directory" subtitle="Club personnel and contacts" icon="📋" />
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
          <th className="text-left p-3">Name</th><th className="text-left p-3">Role</th><th className="text-left p-3">Dept</th><th className="text-left p-3">Email</th><th className="text-left p-3">Start</th>
        </tr></thead>
        <tbody>
          {[{n:'Sarah Frost',r:'Head Coach',d:'Football',e:'s.frost@oakridge.com',s:'Aug 2022'},{n:'Kate Brennan',r:'Club Director',d:'Executive',e:'k.brennan@oakridge.com',s:'Jan 2020'},{n:'Dr Anna Reid',r:'Psychologist',d:'Welfare',e:'a.reid@oakridge.com',s:'Sep 2023'},{n:'Mel Hooper',r:'Head Physio',d:'Medical',e:'m.hooper@oakridge.com',s:'Mar 2021'},{n:'Jordan Clarke',r:'Commercial Dir',d:'Commercial',e:'j.clarke@oakridge.com',s:'Jun 2023'},{n:'Nina Walsh',r:'Welfare Coord',d:'Welfare',e:'n.walsh@oakridge.com',s:'Jan 2024'},{n:'Tom Reed',r:'Analyst',d:'Football',e:'t.reed@oakridge.com',s:'Aug 2024'}].map((s: {n:string;r:string;d:string;e:string;s:string}, i: number) => (
            <tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200 font-medium">{s.n}</td><td className="p-3 text-gray-400 text-xs">{s.r}</td><td className="p-3"><span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">{s.d}</span></td><td className="p-3 text-gray-500 text-xs">{s.e}</td><td className="p-3 text-gray-500 text-xs">{s.s}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

// ─── SETTINGS VIEW ────────────────────────────────────────────────────────────
const SettingsViewFull = ({ club }: { club: WomensClub }) => (
  <div>
    <SectionHeader title="Settings" subtitle="Club profile, notifications, integrations" icon="⚙️" />
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-3">Club Profile</h3>
      <div className="grid grid-cols-2 gap-3 text-xs">
        {[{l:'Club',v:club.name},{l:'League',v:club.league},{l:'Stadium',v:club.stadium},{l:'Accent',v:club.accent},{l:'Founded',v:String(club.founded)},{l:'Director',v:club.director}].map((f: {l:string;v:string}, i: number) => (
          <div key={i} className="py-2 border-b border-gray-800/50"><div className="text-gray-500 text-[10px] uppercase">{f.l}</div><div className="text-gray-200 mt-0.5">{f.v}</div></div>
        ))}
      </div>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-3">Notifications</h3>
      <div className="space-y-3">
        {['FSR compliance alerts','Welfare flags','Sponsorship renewals','Dual reg expiries','Board meetings'].map((n: string, i: number) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50"><span className="text-sm text-gray-300">{n}</span><div className="w-10 h-5 bg-pink-600/30 rounded-full relative"><div className="w-4 h-4 bg-pink-400 rounded-full absolute top-0.5 right-0.5" /></div></div>
        ))}
      </div>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-3">Integrations</h3>
      {['Lumio Health','FA Registration System'].map((ig: string, i: number) => (
        <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50"><span className="text-sm text-gray-300">{ig}</span><button className="px-3 py-1 rounded-lg text-xs font-medium bg-pink-600/20 text-pink-400 border border-pink-600/30">Connect</button></div>
      ))}
    </div>
    <div className="flex gap-3">
      <button disabled className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed">Roles & Permissions — Demo</button>
      <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-pink-600/20 text-pink-400 border border-pink-600/30">Export Data (GDPR)</button>
    </div>
  </div>
)

const PlaceholderView = ({ title, icon }: { title: string; icon: string }) => (
  <div>
    <SectionHeader title={title} icon={icon} />
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-8 text-center">
      <p className="text-gray-500 text-sm">This module is being built. Full content coming soon.</p>
    </div>
  </div>
)

// ─── WOMENS ROLE CONFIG ──────────────────────────────────────────────────────
const WOMENS_ROLE_CONFIG: Record<string, { label: string; icon: string; accent: string; sidebar: 'all' | string[]; hiddenTabs: string[]; message: string | null }> = {
  director: { label: 'Director', icon: '⚽', accent: '#BE185D', sidebar: 'all', hiddenTabs: [], message: null },
  head_coach: { label: 'Head Coach', icon: '📋', accent: '#22C55E', sidebar: 'all', hiddenTabs: ['quickwins','dontmiss'], message: 'Performance and squad view.' },
  welfare: { label: 'Welfare Officer', icon: '🛡️', accent: '#EF4444', sidebar: 'all', hiddenTabs: ['quickwins'], message: 'Welfare and safeguarding view.' },
  commercial: { label: 'Commercial', icon: '💼', accent: '#F59E0B', sidebar: 'all', hiddenTabs: ['dailytasks','team'], message: 'Commercial and sponsorship view.' },
  sponsor: { label: 'Sponsor', icon: '🤝', accent: '#F59E0B', sidebar: 'all', hiddenTabs: ['quickwins','dailytasks','dontmiss','team'], message: null },
}

// ─── WOMENS SPONSOR DASHBOARD ────────────────────────────────────────────────
const WomensSponsorDashboard = ({ club, session }: { club: WomensClub; session: SportsDemoSession }) => {
  const [tab, setTab] = useState<'overview'|'obligations'|'content'|'events'|'roi'>('overview')
  const gold = '#D4AF37'
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '📊' },
    { id: 'obligations' as const, label: 'Obligations', icon: '📋' },
    { id: 'content' as const, label: 'Content', icon: '📱' },
    { id: 'events' as const, label: 'Events', icon: '🎪' },
    { id: 'roi' as const, label: 'ROI', icon: '💰' },
  ]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🤝</span>
        <div>
          <h2 className="text-lg font-bold text-white">Sponsor Portal — {session.clubName}</h2>
          <p className="text-xs text-gray-500">Partnership dashboard · {club.league}</p>
        </div>
      </div>
      <div className="flex gap-1 border-b border-gray-800 mb-4">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-xs font-semibold transition-all relative"
            style={{ color: tab === t.id ? gold : '#6B7280', borderBottom: tab === t.id ? `2px solid ${gold}` : '2px solid transparent' }}>
            <span className="mr-1.5">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-4"><div className="text-2xl font-bold" style={{ color: gold }}>£420k</div><div className="text-xs text-gray-400">Annual Value</div></div>
            <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-4"><div className="text-2xl font-bold text-green-400">92%</div><div className="text-xs text-gray-400">Obligations Met</div></div>
            <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-4"><div className="text-2xl font-bold text-blue-400">3.2M</div><div className="text-xs text-gray-400">Brand Impressions</div></div>
            <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-4"><div className="text-2xl font-bold text-pink-400">4.1x</div><div className="text-xs text-gray-400">ROI Multiplier</div></div>
          </div>
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Partnership Summary</h3>
            <div className="space-y-2 text-xs text-gray-400">
              <p>Kit sponsor partnership with {club.name}. Includes front-of-shirt branding, digital content rights, and matchday hospitality.</p>
              <p>Contract period: Jul 2025 - Jun 2028. Annual review in January.</p>
            </div>
          </div>
        </div>
      )}
      {tab === 'obligations' && (
        <div className="space-y-3">
          {[
            { t: 'Front-of-shirt logo placement', s: 'Complete', c: 'green' },
            { t: 'Social media mentions (8/month)', s: '6 of 8', c: 'amber' },
            { t: 'Matchday LED boards (all home)', s: 'Complete', c: 'green' },
            { t: 'Player appearance (2/quarter)', s: '1 of 2', c: 'amber' },
            { t: 'Press conference backdrop', s: 'Complete', c: 'green' },
          ].map((o, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-[#0D1117] border border-gray-800 rounded-lg">
              <span className="text-xs text-gray-300">{o.t}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${o.c === 'green' ? 'bg-green-600/20 text-green-400' : 'bg-amber-600/20 text-amber-400'}`}>{o.s}</span>
            </div>
          ))}
        </div>
      )}
      {tab === 'content' && (
        <div className="space-y-3">
          {['Matchday graphic — vs Brighton (scheduled Fri)', 'Player interview — Emma Clarke (filmed, pending edit)', 'Kit reveal teaser — Summer 2026 (concept stage)', 'Training ground BTS — Monthly series (next: 15 Apr)'].map((c, i) => (
            <div key={i} className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg text-xs text-gray-300">{c}</div>
          ))}
        </div>
      )}
      {tab === 'events' && (
        <div className="space-y-3">
          {[
            { e: 'Matchday Hospitality — vs Brighton', d: 'Sat 12 Apr', s: '12 of 20 seats' },
            { e: 'End of Season Awards', d: 'Sun 25 May', s: 'Table confirmed' },
            { e: 'Pre-Season Launch Event', d: 'Jul 2026', s: 'Planning' },
          ].map((ev, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-[#0D1117] border border-gray-800 rounded-lg">
              <div><div className="text-xs text-gray-200">{ev.e}</div><div className="text-[10px] text-gray-500">{ev.d}</div></div>
              <span className="text-xs text-gray-400">{ev.s}</span>
            </div>
          ))}
        </div>
      )}
      {tab === 'roi' && (
        <div className="space-y-4">
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">ROI Summary</h3>
            <div className="space-y-2">
              {[
                { l: 'Brand impressions', v: '3.2M', g: '+18% YoY' },
                { l: 'Social reach', v: '1.8M', g: '+24% YoY' },
                { l: 'Matchday exposure (mins)', v: '540', g: '18 home matches' },
                { l: 'Estimated media value', v: '£1.72M', g: '4.1x ROI' },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800">
                  <span className="text-xs text-gray-400">{r.l}</span>
                  <div className="text-right"><span className="text-xs font-bold text-white mr-2">{r.v}</span><span className="text-[10px] text-green-400">{r.g}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ROLES FOR DEMO GATE ─────────────────────────────────────────────────────
const WOMENS_ROLES = [
  { id: 'ceo', label: 'CEO / Chairman', icon: '🏛️' },
  { id: 'dof', label: 'Director of Football', icon: '📋' },
  { id: 'coach', label: 'Head Coach', icon: '🎽' },
  { id: 'welfare', label: 'Welfare Lead', icon: '❤️' },
  { id: 'medical', label: 'Club Doctor', icon: '🏥' },
  { id: 'commercial', label: 'Commercial Director', icon: '💼' },
]

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function WomensFootballPortal({ params }: { params: { slug: string } }) {
  const club = DEMO_CLUBS[params.slug] ?? DEMO_CLUBS['oakridge-women']

  return (
    <SportsDemoGate
      sport="womens"
      defaultClubName={club.name}
      defaultSlug={params.slug}
      accentColor="#EC4899"
      accentColorLight="#F472B6"
      sportEmoji="⚽"
      sportLabel="Lumio Women's FC"
      roles={WOMENS_ROLES}
    >
      {(session) => <WomensFootballPortalInner club={club} session={session} />}
    </SportsDemoGate>
  )
}

// ─── PRE-SEASON CAMP VIEW ─────────────────────────────────────────────────────
function PreSeasonCampView({ storageKey, accent, aiRoute }: { storageKey: string; accent: string; aiRoute: string }) {
  const [camp, setCamp] = useState<{ opener: string; opposition: string; squad: number; formation: string } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ opener: '', opposition: '', squad: '22', formation: '4-3-3' })
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiHighlights, setAiHighlights] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Daily checklist
  const today = new Date().toISOString().split('T')[0]
  const checklistKey = `${storageKey}_checklist_${today}`
  const [checklist, setChecklist] = useState<boolean[]>(() => {
    try { const s = typeof window !== 'undefined' ? localStorage.getItem(checklistKey) : null; return s ? JSON.parse(s) : Array(8).fill(false) } catch { return Array(8).fill(false) }
  })
  useEffect(() => { localStorage.setItem(checklistKey, JSON.stringify(checklist)) }, [checklist, checklistKey])

  // Fitness tests
  const [fitnessTests, setFitnessTests] = useState<string[]>(() => {
    try { const s = typeof window !== 'undefined' ? localStorage.getItem(`${storageKey}_fitness`) : null; return s ? JSON.parse(s) : ['progress','pass','warn','pass','progress'] } catch { return ['progress','pass','warn','pass','progress'] }
  })
  useEffect(() => { localStorage.setItem(`${storageKey}_fitness`, JSON.stringify(fitnessTests)) }, [fitnessTests, storageKey])

  // GPS load
  const [gpsLoad, setGpsLoad] = useState(41)

  // Tactical checklist
  const [tactical, setTactical] = useState<boolean[]>(() => {
    try { const s = typeof window !== 'undefined' ? localStorage.getItem(`${storageKey}_tactical`) : null; return s ? JSON.parse(s) : Array(5).fill(false) } catch { return Array(5).fill(false) }
  })
  useEffect(() => { localStorage.setItem(`${storageKey}_tactical`, JSON.stringify(tactical)) }, [tactical, storageKey])

  // ── TRAINING CAMP STATE ──
  const CAMP_KEY = 'lumio_womens_training_camp'
  const [showCampModal, setShowCampModal] = useState(false)
  const [trainingCamp, setTrainingCamp] = useState<{name:string;departure:string;returnDate:string;destination:string;squadSize:number;budget:number;activatedAt:string}|null>(() => {
    try { const s = localStorage.getItem(CAMP_KEY); return s ? JSON.parse(s) : null } catch { return null }
  })
  const [campSchedule, setCampSchedule] = useState<Array<{day:number;date:string;am:string;pm:string;eve:string}>>(() => {
    try { const s = localStorage.getItem(CAMP_KEY + '_schedule'); return s ? JSON.parse(s) : [] } catch { return [] }
  })
  const [kitChecklist, setKitChecklist] = useState<Record<string,boolean>>(() => {
    try { const s = localStorage.getItem(CAMP_KEY + '_kit'); return s ? JSON.parse(s) : {} } catch { return {} }
  })
  const [campBudget, setCampBudget] = useState<Record<string,number>>(() => {
    try { const s = localStorage.getItem(CAMP_KEY + '_budget'); return s ? JSON.parse(s) : {flights:0,accommodation:0,meals:0,facility:0,misc:0} } catch { return {flights:0,accommodation:0,meals:0,facility:0,misc:0} }
  })
  const [campContent, setCampContent] = useState<Record<string,boolean>>(() => {
    try { const s = localStorage.getItem(CAMP_KEY + '_content'); return s ? JSON.parse(s) : {} } catch { return {} }
  })
  const [venueResults, setVenueResults] = useState<string|null>(null)
  const [venueLoading, setVenueLoading] = useState(false)
  const [contentIdeas, setContentIdeas] = useState<string|null>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string,boolean>>({venue:true,schedule:true,kit:false,budget:false,content:false})
  const [campForm, setCampForm] = useState({name:'',departure:'',returnDate:'',destination:'',squadSize:22,budget:20000})

  const toggleSection = (id: string) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }))

  const activateTrainingCamp = () => {
    if (!campForm.name || !campForm.departure || !campForm.returnDate || !campForm.destination) return
    const c = { ...campForm, activatedAt: new Date().toISOString() }
    localStorage.setItem(CAMP_KEY, JSON.stringify(c))
    setTrainingCamp(c)
    setShowCampModal(false)
    const dep = new Date(campForm.departure)
    const ret = new Date(campForm.returnDate)
    const days = Math.max(1, Math.ceil((ret.getTime() - dep.getTime()) / 86400000)) + 1
    const amDefaults = ["Fitness testing", "Tactical shape", "Set pieces", "Double session", "Match simulation"]
    const pmDefaults = ["Recovery & gym", "Video analysis", "Small-sided games", "Rest", "Friendly match"]
    const sched = Array.from({length: days}, (_, i) => {
      const d = new Date(dep); d.setDate(d.getDate() + i)
      return { day: i+1, date: d.toISOString().split('T')[0], am: amDefaults[i % amDefaults.length], pm: pmDefaults[i % pmDefaults.length], eve: i === 0 ? 'Team dinner' : i === days-1 ? 'Awards night' : 'Free time' }
    })
    setCampSchedule(sched)
    localStorage.setItem(CAMP_KEY + '_schedule', JSON.stringify(sched))
  }

  const findVenues = () => {
    if (!trainingCamp) return
    setVenueLoading(true)
    fetch(aiRoute, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, messages: [{ role: 'user', content: `Suggest 3 football training camp venues near ${trainingCamp.destination} for a squad of ${trainingCamp.squadSize}. Requirements: Full size grass pitch, gym, pool, 2 meeting rooms. For each venue give: name, location, facilities, estimated cost per night, and a one-line verdict. Format as numbered list.` }] })
    }).then(r => r.json()).then(d => setVenueResults(d.content?.[0]?.text || 'Unable to generate.')).catch(() => setVenueResults('Unable to generate.')).finally(() => setVenueLoading(false))
  }

  const generateContentIdeas = () => {
    if (!trainingCamp) return
    setContentLoading(true)
    fetch(aiRoute, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, messages: [{ role: 'user', content: `Generate 5 social media content ideas for a women's football team's training camp in ${trainingCamp.destination}. Include: behind-the-scenes, player challenges, sponsor integration opportunities, fan engagement, and match-day build-up. One line each with emoji.` }] })
    }).then(r => r.json()).then(d => setContentIdeas(d.content?.[0]?.text || 'Unable to generate.')).catch(() => setContentIdeas('Unable to generate.')).finally(() => setContentLoading(false))
  }

  // Friendlies
  const [friendlies, setFriendlies] = useState<{opp:string; score:string; notes:string; result:'W'|'D'|'L'}[]>(() => {
    try { const s = typeof window !== 'undefined' ? localStorage.getItem(`${storageKey}_friendlies`) : null; return s ? JSON.parse(s) : [{ opp:'Bromley Reserves', score:'3-1', notes:'Good defensive shape', result:'W' }] } catch { return [{ opp:'Bromley Reserves', score:'3-1', notes:'Good defensive shape', result:'W' }] }
  })
  useEffect(() => { localStorage.setItem(`${storageKey}_friendlies`, JSON.stringify(friendlies)) }, [friendlies, storageKey])

  useEffect(() => {
    try { const s = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null; if (s) setCamp(JSON.parse(s)) } catch { /* */ }
  }, [storageKey])

  const activate = () => {
    const c = { opener: form.opener, opposition: form.opposition, squad: parseInt(form.squad), formation: form.formation }
    setCamp(c); localStorage.setItem(storageKey, JSON.stringify(c)); setShowModal(false)
  }
  const deactivate = () => { setCamp(null); localStorage.removeItem(storageKey) }

  const daysTo = camp ? Math.max(0, Math.ceil((new Date(camp.opener).getTime() - Date.now()) / 86400000)) : 0
  const totalDays = camp ? Math.max(1, Math.ceil((new Date(camp.opener).getTime() - new Date().getTime()) / 86400000 + 30)) : 30
  const pctRemaining = camp ? daysTo / totalDays : 1
  const phase = pctRemaining > 0.66 ? 'Fitness Block' : pctRemaining > 0.33 ? 'Tactical Block' : 'Match Sharpness'
  const phaseColor = pctRemaining > 0.66 ? '#3B82F6' : pctRemaining > 0.33 ? '#F59E0B' : '#22C55E'

  // AI generation
  useEffect(() => {
    if (!camp) return
    setAiLoading(true)
    Promise.all([
      fetch(aiRoute, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500, messages: [{ role: 'user', content: `Generate a football pre-season AI summary. Opening fixture vs ${camp.opposition}, ${daysTo} days remaining, currently in ${phase} phase, squad of ${camp.squad}, target formation ${camp.formation}. 6 numbered bullet points: overall squad readiness, fitness levels, tactical shape progress, key players to watch, injury concerns, one watch-out for the opener. Be specific and coaching-focused. No intro, just the 6 points.` }] }) }).then(r => r.json()).then(d => setAiSummary(d.content?.[0]?.text || null)).catch(() => {}),
      fetch(aiRoute, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 300, messages: [{ role: 'user', content: `Generate 5 urgent pre-season action items for opening fixture vs ${camp.opposition} in ${daysTo} days, ${phase} phase. Each item one line, specific and actionable. Cover: fitness test gaps, tactical shape issues, set piece readiness, player form concerns, squad balance. No intro.` }] }) }).then(r => r.json()).then(d => setAiHighlights(d.content?.[0]?.text || null)).catch(() => {}),
    ]).finally(() => setAiLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camp?.opener])

  const readinessScores = [
    { label:'Fitness Base', score:71 },{ label:'Tactical Shape', score:58 },{ label:'Set Pieces', score:63 },
    { label:'Squad Depth', score:74 },{ label:'Match Sharpness', score:49 },{ label:'Injury Status', score:82 },
  ]
  const overallScore = Math.round(readinessScores.reduce((a,s)=>a+s.score,0)/readinessScores.length)
  const checklistItems = ['Morning fitness/GPS session','Technical drills','Tactical shape work','Set piece practice','Small-sided games','Recovery/cool down','Video analysis session','Nutrition & hydration logged']
  const completedChecklist = checklist.filter(Boolean).length
  const fitnessTestData = [
    { label:'Bleep Test (VO2 Max)', target:'Level 13' },{ label:'Sprint 40m', target:'<5.2s' },
    { label:'GPS Load (km/session)', target:'11km' },{ label:'Strength Test', target:'1.5x BW' },{ label:'Recovery Score', target:'>80 HRV' },
  ]
  const tacticalItems = ['Defensive shape drilled','Pressing triggers agreed','Attacking patterns rehearsed','Set piece routines locked','Transition play drilled']

  const scoreColor = (s: number) => s >= 80 ? '#22C55E' : s >= 60 ? '#F59E0B' : '#EF4444'

  // ─── NOT ACTIVE ─────────
  if (!camp) return (
    <div className="space-y-6">
      <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="text-6xl mb-4">⚽</div>
        <h2 className="text-2xl font-black text-white mb-2">Pre-Season Camp Mode</h2>
        <p className="text-lg mb-2" style={{ color: accent }}>Build the base. Set the shape. Hit the ground running.</p>
        <p className="text-sm max-w-lg mx-auto mb-8" style={{ color: '#9CA3AF' }}>Activate pre-season and Lumio tracks every session, fitness test, GPS load, tactical shape and squad readiness — all the way to your opening fixture.</p>
        <button onClick={() => setShowModal(true)} className="px-8 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: accent }}>Activate Pre-Season →</button>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
            <h3 className="text-lg font-bold text-white">Activate Pre-Season</h3>
            <div><label className="text-xs text-gray-500 mb-1 block">Season opener date</label><input type="date" value={form.opener} onChange={e=>setForm(f=>({...f,opener:e.target.value}))} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor:'#111318', border:'1px solid #374151' }} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Opposition (opening fixture)</label><input value={form.opposition} onChange={e=>setForm(f=>({...f,opposition:e.target.value}))} placeholder="e.g. Manchester City" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor:'#111318', border:'1px solid #374151' }} /></div>
            {form.opener && <div className="text-xs" style={{ color: '#6B7280' }}>Camp length: {Math.max(0,Math.ceil((new Date(form.opener).getTime()-Date.now())/86400000))} days</div>}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-500 mb-1 block">Squad size</label><input type="number" value={form.squad} onChange={e=>setForm(f=>({...f,squad:e.target.value}))} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor:'#111318', border:'1px solid #374151' }} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Formation target</label><select value={form.formation} onChange={e=>setForm(f=>({...f,formation:e.target.value}))} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor:'#111318', border:'1px solid #374151' }}>{['4-3-3','4-4-2','4-2-3-1','3-5-2','5-3-2'].map(f=><option key={f}>{f}</option>)}</select></div>
            </div>
            <button onClick={activate} disabled={!form.opener||!form.opposition} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: form.opener&&form.opposition ? accent : '#374151' }}>Activate Pre-Season ⚽</button>
          </div>
        </div>
      )}
    </div>
  )

  // ─── ACTIVE ─────────
  return (
    <div className="space-y-6">
      {/* Pre-Season Banner */}
      <div className="flex items-center justify-between px-5 py-3 rounded-xl" style={{ backgroundColor: '#F59E0B20', border: '1px solid #F59E0B40' }}>
        <div className="flex items-center gap-3">
          <span>⚽</span>
          <span className="text-sm font-bold text-white">Pre-Season Active</span>
          <span className="text-sm" style={{ color: '#F59E0B' }}>Opening Fixture: {camp.opposition} · {daysTo} days to go</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: phaseColor }}>{phase}</span>
        </div>
        <button onClick={deactivate} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>Deactivate</button>
      </div>

      {/* AI Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: accent }}>AI Pre-Season Summary</div>
          {aiLoading ? <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-3 rounded bg-gray-800 animate-pulse" style={{width:`${80+i*5}%`}}/>)}</div>
           : aiSummary ? <div className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: '#D1D5DB' }}>{aiSummary}</div>
           : <div className="text-xs" style={{ color: '#6B7280' }}>AI summary will generate when camp is active.</div>}
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#F59E0B' }}>AI Key Highlights</div>
          {aiLoading ? <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-3 rounded bg-gray-800 animate-pulse" style={{width:`${70+i*8}%`}}/>)}</div>
           : aiHighlights ? <div className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: '#D1D5DB' }}>{aiHighlights}</div>
           : <div className="text-xs" style={{ color: '#6B7280' }}>Highlights will generate when camp is active.</div>}
        </div>
      </div>

      {/* Squad Readiness Score */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-white">Squad Readiness Score</div>
          <div className="text-3xl font-black" style={{ color: scoreColor(overallScore) }}>{overallScore}<span className="text-sm text-gray-500">/100</span></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {readinessScores.map(s => (
            <div key={s.label} className="rounded-lg p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}>
              <div className="flex items-center justify-between mb-1"><span className="text-xs text-white">{s.label}</span><span className="text-sm font-black" style={{ color: scoreColor(s.score) }}>{s.score}</span></div>
              <div className="w-full bg-gray-800 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width:`${s.score}%`, backgroundColor: scoreColor(s.score) }}/></div>
              {s.score < 60 && <div className="text-[9px] mt-1" style={{ color: '#EF4444' }}>Needs attention</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Daily Training Checklist */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between mb-3"><div className="text-sm font-bold text-white">Today&apos;s Session Checklist</div><div className="text-xs" style={{ color: scoreColor(completedChecklist >= 6 ? 80 : completedChecklist >= 4 ? 65 : 40) }}>{completedChecklist}/8 completed</div></div>
        <div className="space-y-2">
          {checklistItems.map((item, i) => (
            <button key={i} onClick={() => setChecklist(c => c.map((v,j)=>j===i?!v:v))} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all" style={{ backgroundColor: checklist[i] ? 'rgba(34,197,94,0.08)' : 'transparent', border: checklist[i] ? '1px solid rgba(34,197,94,0.2)' : '1px solid #1F2937' }}>
              <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: checklist[i] ? '#22C55E' : '#374151', backgroundColor: checklist[i] ? 'rgba(34,197,94,0.2)' : 'transparent' }}>{checklist[i] && <span className="text-[10px]" style={{ color: '#22C55E' }}>✓</span>}</div>
              <span className="text-xs" style={{ color: checklist[i] ? '#22C55E' : '#D1D5DB', textDecoration: checklist[i] ? 'line-through' : 'none' }}>{item}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fitness Testing + GPS Load */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="text-sm font-bold text-white mb-3">Fitness Test Results</div>
          <div className="space-y-2">
            {fitnessTestData.map((t, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}>
                <div><div className="text-xs text-white">{t.label}</div><div className="text-[10px]" style={{ color: '#6B7280' }}>Target: {t.target}</div></div>
                <select value={fitnessTests[i]} onChange={e => setFitnessTests(f => f.map((v,j)=>j===i?e.target.value:v))} className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: '#1F2937', color: fitnessTests[i]==='pass'?'#22C55E':fitnessTests[i]==='warn'?'#F59E0B':'#6B7280', border: 'none' }}>
                  <option value="progress">In Progress</option><option value="pass">✅ Passed</option><option value="warn">⚠️ Below target</option><option value="fail">❌ Failed</option>
                </select>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="text-sm font-bold text-white mb-3">GPS Load Tracker</div>
          <div className="text-center mb-4">
            <div className="text-4xl font-black" style={{ color: gpsLoad >= 55 ? '#22C55E' : gpsLoad >= 40 ? '#F59E0B' : '#EF4444' }}>{gpsLoad}<span className="text-sm text-gray-500">km</span></div>
            <div className="text-xs" style={{ color: '#6B7280' }}>of 65km weekly target</div>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 mb-3"><div className="h-2 rounded-full" style={{ width: `${Math.min(100, (gpsLoad/65)*100)}%`, backgroundColor: gpsLoad >= 55 ? '#22C55E' : gpsLoad >= 40 ? '#F59E0B' : '#EF4444' }}/></div>
          <div className="flex justify-center gap-3 mb-3">
            <button onClick={() => setGpsLoad(g=>Math.max(0,g-5))} className="px-4 py-1.5 rounded-lg text-xs" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>- 5km</button>
            <button onClick={() => setGpsLoad(g=>g+5)} className="px-4 py-1.5 rounded-lg text-xs" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>+ 5km</button>
          </div>
          <div className="text-[10px] text-center" style={{ color: '#6B7280' }}>Increase load by max 10% per week to avoid injury spike</div>
        </div>
      </div>

      {/* Friendly Matches */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between mb-3"><div className="text-sm font-bold text-white">Friendly Matches</div><div className="text-xs" style={{ color: '#6B7280' }}>{friendlies.length} of 4 planned</div></div>
        <div className="space-y-2">
          {friendlies.map((f, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}>
              <div className="flex items-center gap-3">
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold text-white" style={{ backgroundColor: f.result==='W'?'#22C55E':f.result==='D'?'#F59E0B':'#EF4444' }}>{f.result}</span>
                <div><div className="text-xs text-white">{f.opp}</div><div className="text-[10px]" style={{ color: '#6B7280' }}>{f.notes}</div></div>
              </div>
              <span className="text-xs font-bold text-white">{f.score}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setFriendlies(f => [...f, { opp:'TBC', score:'0-0', notes:'', result:'D' }])} className="mt-3 w-full py-2 rounded-lg text-xs font-bold" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>+ Add Result</button>
      </div>

      {/* Formation Board */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between mb-3"><div className="text-sm font-bold text-white">Formation Board</div><span className="text-sm font-bold" style={{ color: accent }}>{camp.formation}</span></div>
        <div className="space-y-2">
          {tacticalItems.map((item, i) => (
            <button key={i} onClick={() => setTactical(t => t.map((v,j)=>j===i?!v:v))} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all" style={{ backgroundColor: tactical[i] ? 'rgba(34,197,94,0.08)' : 'transparent', border: tactical[i] ? '1px solid rgba(34,197,94,0.2)' : '1px solid #1F2937' }}>
              <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: tactical[i] ? '#22C55E' : '#374151', backgroundColor: tactical[i] ? 'rgba(34,197,94,0.2)' : 'transparent' }}>{tactical[i] && <span className="text-[10px]" style={{ color: '#22C55E' }}>✓</span>}</div>
              <span className="text-xs" style={{ color: tactical[i] ? '#22C55E' : '#D1D5DB', textDecoration: tactical[i] ? 'line-through' : 'none' }}>{item}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Training Camp */}
      {!trainingCamp ? (
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#0F1015', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏕️</span>
              <span className="text-sm font-bold text-white">Training Camp</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: '#F59E0B' }}>NEW</span>
            </div>
          </div>
          <p className="text-xs mb-4" style={{ color: '#6B7280' }}>Plan your squad&apos;s away camp — venue, schedule, budget and content all in one place.</p>
          <button onClick={() => setShowCampModal(true)} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: '#F59E0B' }}>Schedule Training Camp →</button>
        </div>
      ) : (
        <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: '#0F1015', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏕️</span>
              <span className="text-sm font-bold text-white">Training Camp — {trainingCamp.name}</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: '#22C55E' }}>ACTIVE</span>
            </div>
            <button onClick={() => { localStorage.removeItem(CAMP_KEY); localStorage.removeItem(CAMP_KEY+'_schedule'); localStorage.removeItem(CAMP_KEY+'_kit'); localStorage.removeItem(CAMP_KEY+'_budget'); localStorage.removeItem(CAMP_KEY+'_content'); setTrainingCamp(null); setCampSchedule([]); setKitChecklist({}); setCampBudget({flights:0,accommodation:0,meals:0,facility:0,misc:0}); setCampContent({}); setVenueResults(null); setContentIdeas(null) }}
              className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>Cancel Camp</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><div className="text-[10px]" style={{ color: '#6B7280' }}>Destination</div><div className="text-xs font-bold text-white">{trainingCamp.destination}</div></div>
            <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><div className="text-[10px]" style={{ color: '#6B7280' }}>Departure</div><div className="text-xs font-bold text-white">{trainingCamp.departure}</div></div>
            <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><div className="text-[10px]" style={{ color: '#6B7280' }}>Return</div><div className="text-xs font-bold text-white">{trainingCamp.returnDate}</div></div>
            <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><div className="text-[10px]" style={{ color: '#6B7280' }}>Budget</div><div className="text-xs font-bold text-white">£{trainingCamp.budget.toLocaleString()}</div></div>
          </div>

          {/* Section 1 — Venue Finder AI */}
          <div style={{ borderTop: '1px solid #1F2937' }}>
            <button onClick={() => toggleSection('venue')} className="flex items-center justify-between w-full py-3">
              <span className="text-sm font-bold text-white">🤖 Venue Finder AI</span>
              <span className="text-xs" style={{ color: '#6B7280' }}>{expandedSections.venue ? '▾' : '▸'}</span>
            </button>
            {expandedSections.venue && (
              <div className="space-y-3 pb-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="text-[10px] mb-1" style={{ color: '#6B7280' }}>Destination</div><input readOnly value={trainingCamp.destination} className="w-full px-3 py-2 rounded-lg text-xs text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
                  <div><div className="text-[10px] mb-1" style={{ color: '#6B7280' }}>Squad Size</div><input readOnly value={trainingCamp.squadSize} className="w-full px-3 py-2 rounded-lg text-xs text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
                </div>
                <div><div className="text-[10px] mb-1" style={{ color: '#6B7280' }}>Requirements</div><input readOnly value="Full size grass pitch, gym, pool, 2 meeting rooms" className="w-full px-3 py-2 rounded-lg text-xs text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
                <button onClick={findVenues} disabled={venueLoading} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: '#3B82F6' }}>{venueLoading ? 'Searching...' : 'Find Venues →'}</button>
                {venueResults && <div className="rounded-lg p-3 text-xs leading-relaxed whitespace-pre-line" style={{ backgroundColor: '#111318', color: '#D1D5DB', border: '1px solid #1F2937' }}>{venueResults}</div>}
              </div>
            )}
          </div>

          {/* Section 2 — Camp Schedule */}
          <div style={{ borderTop: '1px solid #1F2937' }}>
            <button onClick={() => toggleSection('schedule')} className="flex items-center justify-between w-full py-3">
              <span className="text-sm font-bold text-white">📅 Camp Schedule</span>
              <span className="text-xs" style={{ color: '#6B7280' }}>{expandedSections.schedule ? '▾' : '▸'}</span>
            </button>
            {expandedSections.schedule && (
              <div className="space-y-2 pb-3">
                {campSchedule.map((day, i) => (
                  <div key={i} className="rounded-lg p-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">Day {day.day}</span>
                      <span className="text-[10px]" style={{ color: '#6B7280' }}>{day.date}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div><div className="text-[9px] mb-1" style={{ color: '#6B7280' }}>AM</div><input value={day.am} onChange={e => { const next = [...campSchedule]; next[i] = {...next[i], am: e.target.value}; setCampSchedule(next); localStorage.setItem(CAMP_KEY+'_schedule', JSON.stringify(next)) }} className="w-full px-2 py-1.5 rounded text-[10px] text-white" style={{ backgroundColor: '#0D0F17', border: '1px solid #374151' }} /></div>
                      <div><div className="text-[9px] mb-1" style={{ color: '#6B7280' }}>PM</div><input value={day.pm} onChange={e => { const next = [...campSchedule]; next[i] = {...next[i], pm: e.target.value}; setCampSchedule(next); localStorage.setItem(CAMP_KEY+'_schedule', JSON.stringify(next)) }} className="w-full px-2 py-1.5 rounded text-[10px] text-white" style={{ backgroundColor: '#0D0F17', border: '1px solid #374151' }} /></div>
                      <div><div className="text-[9px] mb-1" style={{ color: '#6B7280' }}>Evening</div><input value={day.eve} onChange={e => { const next = [...campSchedule]; next[i] = {...next[i], eve: e.target.value}; setCampSchedule(next); localStorage.setItem(CAMP_KEY+'_schedule', JSON.stringify(next)) }} className="w-full px-2 py-1.5 rounded text-[10px] text-white" style={{ backgroundColor: '#0D0F17', border: '1px solid #374151' }} /></div>
                    </div>
                  </div>
                ))}
                {campSchedule.length === 0 && <p className="text-xs" style={{ color: '#6B7280' }}>No schedule generated yet.</p>}
              </div>
            )}
          </div>

          {/* Section 3 — Kit & Equipment Checklist */}
          <div style={{ borderTop: '1px solid #1F2937' }}>
            <button onClick={() => toggleSection('kit')} className="flex items-center justify-between w-full py-3">
              <span className="text-sm font-bold text-white">🎒 Kit & Equipment Checklist</span>
              <span className="text-xs" style={{ color: '#6B7280' }}>{expandedSections.kit ? '▾' : '▸'}</span>
            </button>
            {expandedSections.kit && (() => {
              const kitItems = ['Training jerseys','Shorts & socks','Boots (FG + SG)','GPS vests','Contact pads','Tackle shields','Cones & poles','Water bottles']
              const medItems = ['First aid kit','Ice machine','Strapping tape','Physio table','Resistance bands','Foam rollers','AED','Medication box']
              const allItems = [...kitItems, ...medItems]
              const checked = allItems.filter(item => kitChecklist[item]).length
              return (
                <div className="space-y-3 pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: '#1F2937' }}><div className="h-2 rounded-full transition-all" style={{ width: `${(checked/16)*100}%`, backgroundColor: checked === 16 ? '#22C55E' : '#F59E0B' }} /></div>
                    <span className="text-xs font-bold" style={{ color: checked === 16 ? '#22C55E' : '#F59E0B' }}>{checked}/16</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-bold mb-2" style={{ color: '#9CA3AF' }}>KIT</div>
                      {kitItems.map(item => (
                        <button key={item} onClick={() => { const next = {...kitChecklist, [item]: !kitChecklist[item]}; setKitChecklist(next); localStorage.setItem(CAMP_KEY+'_kit', JSON.stringify(next)) }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-[10px] mb-1" style={{ color: kitChecklist[item] ? '#22C55E' : '#9CA3AF' }}>
                          <span>{kitChecklist[item] ? '✅' : '⬜'}</span><span style={{ textDecoration: kitChecklist[item] ? 'line-through' : 'none' }}>{item}</span>
                        </button>
                      ))}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold mb-2" style={{ color: '#9CA3AF' }}>MEDICAL</div>
                      {medItems.map(item => (
                        <button key={item} onClick={() => { const next = {...kitChecklist, [item]: !kitChecklist[item]}; setKitChecklist(next); localStorage.setItem(CAMP_KEY+'_kit', JSON.stringify(next)) }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-[10px] mb-1" style={{ color: kitChecklist[item] ? '#22C55E' : '#9CA3AF' }}>
                          <span>{kitChecklist[item] ? '✅' : '⬜'}</span><span style={{ textDecoration: kitChecklist[item] ? 'line-through' : 'none' }}>{item}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Section 4 — Camp Budget */}
          <div style={{ borderTop: '1px solid #1F2937' }}>
            <button onClick={() => toggleSection('budget')} className="flex items-center justify-between w-full py-3">
              <span className="text-sm font-bold text-white">💰 Camp Budget</span>
              <span className="text-xs" style={{ color: '#6B7280' }}>{expandedSections.budget ? '▾' : '▸'}</span>
            </button>
            {expandedSections.budget && (() => {
              const items = [{key:'flights',label:'Flights'},{key:'accommodation',label:'Accommodation'},{key:'meals',label:'Meals'},{key:'facility',label:'Facility hire'},{key:'misc',label:'Misc'}]
              const total = Object.values(campBudget).reduce((a,b) => a+b, 0)
              const overBudget = total > trainingCamp.budget
              return (
                <div className="space-y-3 pb-3">
                  {items.map(item => (
                    <div key={item.key} className="flex items-center gap-3">
                      <span className="text-xs w-28" style={{ color: '#9CA3AF' }}>{item.label}</span>
                      <input type="number" value={campBudget[item.key] || 0} onChange={e => { const next = {...campBudget, [item.key]: Number(e.target.value)}; setCampBudget(next); localStorage.setItem(CAMP_KEY+'_budget', JSON.stringify(next)) }}
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs text-white text-right" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #1F2937' }}>
                    <span className="text-xs font-bold text-white">Total</span>
                    <span className="text-sm font-black" style={{ color: overBudget ? '#EF4444' : '#22C55E' }}>£{total.toLocaleString()} <span className="text-[10px] font-normal" style={{ color: '#6B7280' }}>/ £{trainingCamp.budget.toLocaleString()}</span></span>
                  </div>
                  {overBudget && <div className="text-[10px] px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>Over budget by £{(total - trainingCamp.budget).toLocaleString()}</div>}
                </div>
              )
            })()}
          </div>

          {/* Section 5 — Content & Sponsor Planner */}
          <div style={{ borderTop: '1px solid #1F2937' }}>
            <button onClick={() => toggleSection('content')} className="flex items-center justify-between w-full py-3">
              <span className="text-sm font-bold text-white">📸 Content & Sponsor Planner</span>
              <span className="text-xs" style={{ color: '#6B7280' }}>{expandedSections.content ? '▾' : '▸'}</span>
            </button>
            {expandedSections.content && (() => {
              const contentSlots = ['Behind-the-scenes training reel','Player challenge video','Sponsor integration post','Fan Q&A / live session','Match-day build-up content']
              return (
                <div className="space-y-3 pb-3">
                  {contentSlots.map(slot => (
                    <button key={slot} onClick={() => { const next = {...campContent, [slot]: !campContent[slot]}; setCampContent(next); localStorage.setItem(CAMP_KEY+'_content', JSON.stringify(next)) }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left" style={{ backgroundColor: campContent[slot] ? 'rgba(34,197,94,0.08)' : '#111318', border: `1px solid ${campContent[slot] ? 'rgba(34,197,94,0.2)' : '#1F2937'}` }}>
                      <span className="text-sm">{campContent[slot] ? '✅' : '⬜'}</span>
                      <span className="text-xs" style={{ color: campContent[slot] ? '#22C55E' : '#9CA3AF', textDecoration: campContent[slot] ? 'line-through' : 'none' }}>{slot}</span>
                    </button>
                  ))}
                  <button onClick={generateContentIdeas} disabled={contentLoading} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: '#8B5CF6' }}>{contentLoading ? 'Generating...' : 'Generate Content Ideas AI →'}</button>
                  {contentIdeas && <div className="rounded-lg p-3 text-xs leading-relaxed whitespace-pre-line" style={{ backgroundColor: '#111318', color: '#D1D5DB', border: '1px solid #1F2937' }}>{contentIdeas}</div>}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Training Camp Activation Modal */}
      {showCampModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCampModal(false) }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
            <h2 className="text-lg font-bold text-white mb-4">🏕️ Schedule Training Camp</h2>
            <div className="space-y-3">
              <div><label className="text-[10px] mb-1 block" style={{ color: '#6B7280' }}>Camp Name</label><input value={campForm.name} onChange={e => setCampForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Spain Training Camp" className="w-full px-3 py-2 rounded-lg text-xs text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] mb-1 block" style={{ color: '#6B7280' }}>Departure</label><input type="date" value={campForm.departure} onChange={e => setCampForm(f => ({...f, departure: e.target.value}))} className="w-full px-3 py-2 rounded-lg text-xs text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
                <div><label className="text-[10px] mb-1 block" style={{ color: '#6B7280' }}>Return</label><input type="date" value={campForm.returnDate} onChange={e => setCampForm(f => ({...f, returnDate: e.target.value}))} className="w-full px-3 py-2 rounded-lg text-xs text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
              </div>
              <div><label className="text-[10px] mb-1 block" style={{ color: '#6B7280' }}>Destination</label><input value={campForm.destination} onChange={e => setCampForm(f => ({...f, destination: e.target.value}))} placeholder="e.g. Marbella, Spain" className="w-full px-3 py-2 rounded-lg text-xs text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] mb-1 block" style={{ color: '#6B7280' }}>Squad Size</label><input type="number" value={campForm.squadSize} onChange={e => setCampForm(f => ({...f, squadSize: Number(e.target.value)}))} className="w-full px-3 py-2 rounded-lg text-xs text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
                <div><label className="text-[10px] mb-1 block" style={{ color: '#6B7280' }}>Budget (£)</label><input type="number" value={campForm.budget} onChange={e => setCampForm(f => ({...f, budget: Number(e.target.value)}))} className="w-full px-3 py-2 rounded-lg text-xs text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
              </div>
              <button onClick={activateTrainingCamp} disabled={!campForm.name || !campForm.departure || !campForm.returnDate || !campForm.destination} className="w-full py-2.5 rounded-xl text-xs font-bold text-white mt-2" style={{ backgroundColor: campForm.name && campForm.departure && campForm.returnDate && campForm.destination ? '#F59E0B' : '#374151' }}>Activate Training Camp 🏕️</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function WomensFootballPortalInner({ club, session }: { club: WomensClub; session: SportsDemoSession }) {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeRole, setActiveRole] = useState(session.role)

  // Role config
  const [roleOverride, setRoleOverride] = useState<string | null>(null)
  const currentRole = (roleOverride || session.role || 'director') as keyof typeof WOMENS_ROLE_CONFIG
  const roleConfig = WOMENS_ROLE_CONFIG[currentRole] ?? WOMENS_ROLE_CONFIG.director
  const isSponsor = currentRole === 'sponsor'

  // Dashboard tabs
  const [dashTab, setDashTab] = useState<'gettingstarted'|'today'|'quickwins'|'dailytasks'|'insights'|'dontmiss'|'team'>(() => {
    try { return localStorage.getItem('womens_getting_started_seen') ? 'today' : 'gettingstarted' } catch { return 'gettingstarted' }
  })

  // ── v2 dashboard state (hero + overlays) ───────────────────────────
  const v2T       = THEMES.dark
  const v2Accent  = WOMENS_ACCENT
  const v2Density = DENSITY.regular
  const v2Greeting = v2GetGreeting('matchday')
  const [v2OpenFixture, setV2OpenFixture] = useState<WfFixture | null>(null)
  const [v2CmdOpen, setV2CmdOpen]         = useState(false)
  const [v2AskOpen, setV2AskOpen]         = useState(false)
  const [v2BriefOpen, setV2BriefOpen]     = useState(false)
  const [v2DashToast, showV2DashToast]    = useV2Toast()
  useV2Key('cmdk', () => setV2CmdOpen(o => !o))
  // Map dashTab IDs to v2 Lucide icons for the restyled tab bar.
  const v2TabIcon = (id: typeof dashTab): string => ({
    gettingstarted: 'sparkles', today: 'home', quickwins: 'lightning',
    dailytasks: 'check', insights: 'bars', dontmiss: 'flag', team: 'people',
  } as const)[id]

  // Morning banner quotes
  const [quoteIdx, setQuoteIdx] = useState(0)
  const womenQuotes = [
    '"The future is female football." — Sarina Wiegman',
    '"We are not just playing for ourselves. We are playing for every girl watching." — Lucy Bronze',
    '"Equal play, equal pay, every single day." — Megan Rapinoe',
    '"Football has no gender." — Ada Hegerberg',
  ]
  useEffect(() => {
    const iv = setInterval(() => setQuoteIdx(p => (p + 1) % womenQuotes.length), 8000)
    return () => clearInterval(iv)
  }, [])

  // Weather
  const [weather, setWeather] = useState<{ temp: number; desc: string } | null>(null)
  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current_weather=true')
      .then(r => r.json())
      .then(d => {
        if (d.current_weather) {
          const code = d.current_weather.weathercode
          const desc = code <= 3 ? 'Clear' : code <= 48 ? 'Cloudy' : code <= 67 ? 'Rain' : code <= 77 ? 'Snow' : 'Storm'
          setWeather({ temp: Math.round(d.current_weather.temperature), desc })
        }
      })
      .catch(() => {})
  }, [])

  // TTS
  const [speaking, setSpeaking] = useState(false)
  const handleTTS = () => {
    if (speaking) { window.speechSynthesis?.cancel(); setSpeaking(false); return }
    const text = generateSmartBriefing({
      now: new Date(),
      playerName: session?.userName || club?.director || 'Director',
      schedule: [],
      match: null,
      roundupSummary: { totalMessages: 0, urgentCount: 0, urgentLabels: [] },
      sport: "women's football",
      timezone: getUserTimezone(),
      extra: `FSR salary spend at ${club?.salarySpend || 74}% of cap. Next fixture this weekend.`,
    })
    const u = new SpeechSynthesisUtterance(text)
    u.onend = () => setSpeaking(false)
    window.speechSynthesis?.speak(u)
    setSpeaking(true)
  }

  // World clock
  const getTime = (tz: string) => {
    try { return new Date().toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' }) } catch { return '--:--' }
  }
  const [clockTick, setClockTick] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setClockTick(p => p + 1), 60000)
    return () => clearInterval(iv)
  }, [])

  // Getting started
  const [onboarding, setOnboarding] = useState<boolean[]>(() => {
    try { const s = localStorage.getItem('lumio_womens_onboarding'); return s ? JSON.parse(s) : Array(10).fill(false) } catch { return Array(10).fill(false) }
  })
  const toggleOnboarding = (idx: number) => {
    const next = [...onboarding]; next[idx] = !next[idx]; setOnboarding(next)
    try { localStorage.setItem('lumio_womens_onboarding', JSON.stringify(next)); if (next.every(Boolean)) localStorage.setItem('womens_getting_started_seen', '1') } catch {}
  }

  // AI morning summary
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const aiSummaryFetched = useRef(false)
  useEffect(() => {
    if (dashTab === 'today' && !aiSummaryFetched.current && !aiSummary) {
      aiSummaryFetched.current = true
      setAiLoading(true)
      fetch('/api/ai/womens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Generate a brief morning summary for ${club.name} director. Include: FSR status (68% salary ratio, safe), 2 welfare flags, next match Sat 12 Apr vs Brighton, and one actionable insight. Keep it under 100 words.` })
      }).then(r => r.json()).then(d => { setAiSummary(d.response || d.text || 'AI summary unavailable.'); setAiLoading(false) })
        .catch(() => { setAiSummary('AI summary could not be loaded.'); setAiLoading(false) })
    }
  }, [dashTab])

  // Team tab sub-tabs
  const [teamSubTab, setTeamSubTab] = useState<'today'|'org'|'info'|'club'>('today')

  const groups = ['OVERVIEW', 'COMPLIANCE', 'WELFARE', 'FOOTBALL', 'GPS & LOAD', 'COMMERCIAL', 'OPERATIONS']

  const hiddenForGrassroots = new Set(['fsr', 'salary', 'revenue', 'standalone', 'board', 'financial', 'dualreg', 'sponsorship', 'gps-load', 'gps-heatmaps'])
  const filteredItems = club.tier === 'grassroots'
    ? SIDEBAR_ITEMS.filter((i: { id: string }) => !hiddenForGrassroots.has(i.id))
    : SIDEBAR_ITEMS

  const renderView = () => {
    switch (activeSection) {
      case 'dashboard':   return null // handled inline
      case 'fsr':         return <FSRDashboardView club={club} />
      case 'welfare':     return <WelfareView />
      case 'briefing':    return <MorningBriefingView club={club} />
      case 'insights':    return <InsightsView club={club} defaultRole={activeRole} />
      case 'salary':      return <SalaryComplianceView />
      case 'revenue':     return <RevenueAttributionView />
      case 'acl':         return <ACLRiskMonitorView />
      case 'cycle':       return <CycleTrackingView />
      case 'maternity':   return <MaternityTrackerView />
      case 'mental':      return <MentalHealthView />
      case 'squad':       return <SquadManagementView club={club} />
      case 'dualreg':     return <DualRegistrationView />
      case 'tactics':     return <TacticsSetPiecesView />
      case 'match':       return <MatchPreparationView />
      case 'transfers':   return <TransfersView club={club} />
      case 'analytics':   return <AnalyticsView club={club} />
      case 'scouting':    return <ScoutingView club={club} />
      case 'academy':     return <AcademyView club={club} />
      case 'halftime':    return <AIHalftimeBriefView />
      case 'sponsorship': return <SponsorshipPipelineView club={club} />
      case 'standalone':  return <StandaloneTrackerView club={club} />
      case 'board':       return <BoardSuiteView club={club} />
      case 'club-vision': return <WomensClubVisionView club={club} />
      case 'financial':   return <WomensClubVisionView club={club} />
      case 'media':       return <MediaContentModule sport="womens" accentColor="#BE185D" existingContentLabel="Women's FC — Media & PR (existing)" existingContent={<MediaPRView club={club} />} isDemoShell={session.isDemoShell !== false} />
      case 'social':      return <SocialMediaView club={club} />
      case 'fanhub':      return <FanHubView club={club} />
      case 'team':        return <StaffDirectoryView />
      case 'gps-load':    return <GPSLoadView club={club} />
      case 'gps-heatmaps': return <WomensGPSHeatmapsView club={club} />
      case 'medical':     return <MedicalRecordsView />
      case 'preseason':   return <PreSeasonCampView storageKey="lumio_womens_preseason" accent="#BE185D" aiRoute="/api/ai/womens" />
      case 'player-welfare':  return <PlayerWelfareHub accent="#BE185D" variant="womens" defaultTab="overview" title="Player Welfare Hub" subtitle="Foreign player integration · maternity · cycle · women's-specific safeguarding" />
      case 'club-operations': return <PlayerWelfareHub accent="#BE185D" variant="womens" defaultTab="travel"   title="Club Operations" subtitle="Travel logistics · matchday ops · compliance · insurance" />
      case 'settings':    return <SettingsViewFull club={club} />
      default:            return null
    }
  }

  // ── Tab definitions ──
  const allTabs = [
    { id: 'gettingstarted' as const, label: 'Getting Started', icon: '🚀' },
    { id: 'today' as const, label: 'Today', icon: '🏠' },
    { id: 'quickwins' as const, label: 'Quick Wins', icon: '⚡' },
    { id: 'dailytasks' as const, label: 'Daily Tasks', icon: '✅' },
    { id: 'insights' as const, label: 'Insights', icon: '📊' },
    { id: 'dontmiss' as const, label: "Don't Miss", icon: '🔴' },
    { id: 'team' as const, label: 'Team', icon: '👥' },
  ]
  const visibleTabs = allTabs.filter(t => !roleConfig.hiddenTabs.includes(t.id))

  // ── Getting Started items ──
  const onboardingItems = [
    'Connect WSL/Championship profile',
    'Set up FSR compliance dashboard',
    'Add squad (24 players)',
    'Configure welfare monitoring',
    'Upload sponsor agreements',
    'Set dual registration agreements',
    'Add coaching and medical team',
    'Configure Karen Carney Review compliance',
    'Set fixture schedule',
    'Ready — let\'s make history ⚽',
  ]

  // ── Quick actions ──
  const quickActions = [
    { id:'flights',    label:'Book Flight',      icon:'✈️', hot:true,  color:'#BE185D' },
    { id:'matchprep',  label:'Match Prep AI',    icon:'🎯', hot:true,  color:'#22C55E' },
    { id:'fsr',        label:'FSR Check',        icon:'📊', hot:false, color:'#6B7280' },
    { id:'welfare',    label:'Welfare Alert',    icon:'🛡️', hot:false, color:'#EF4444' },
    { id:'sponsor',    label:'Sponsor Post AI',  icon:'📱', hot:true,  color:'#F59E0B' },
    { id:'ranking',    label:'Ranking Sim',      icon:'📈', hot:true,  color:'#BE185D' },
    { id:'injury',     label:'Log Injury',       icon:'💊', hot:false, color:'#EF4444' },
    { id:'expense',    label:'Add Expense',      icon:'🧾', hot:false, color:'#6B7280' },
    { id:'dualreg',    label:'Dual Registration',icon:'🔄', hot:false, color:'#6B7280' },
    { id:'ofsted',     label:'Ofsted Mode',      icon:'📋', hot:false, color:'#6B7280' },
    { id:'preseason',  label:'Pre-Season',       icon:'🏕️', hot:false, color:'#6B7280' },
  ]

  // ── Quick Wins items ──
  const quickWinsItems = [
    { t: 'Review FSR headroom — £380k available before cap breach', p: 'High', c: '#EF4444' },
    { t: 'Renew Local Energy Co sponsorship — £35k/yr expiring Apr', p: 'High', c: '#EF4444' },
    { t: 'Schedule ACL screening block — 4 players overdue', p: 'Medium', c: '#F59E0B' },
    { t: 'Send contract renewal offer to Lucy Whitmore (CM)', p: 'Medium', c: '#F59E0B' },
    { t: 'Update Karen Carney compliance — 2 criteria outstanding', p: 'Low', c: '#22C55E' },
  ]

  // ── Daily Tasks items ──
  const dailyTaskItems = [
    { t: 'Morning welfare check-in — 2 flags active', p: 'Urgent', cat: 'Welfare', c: '#EF4444' },
    { t: 'Confirm squad list for Brighton (Sat 12 Apr)', p: 'High', cat: 'Football', c: '#BE185D' },
    { t: 'Review GPS load data — training session analysis', p: 'Medium', cat: 'Performance', c: '#F59E0B' },
    { t: 'Approve social media matchday content', p: 'Medium', cat: 'Commercial', c: '#F59E0B' },
    { t: 'Board meeting prep — financial summary pack', p: 'Low', cat: 'Operations', c: '#22C55E' },
  ]

  // ── Don't Miss items ──
  const dontMissItems = [
    { t: 'Emily Zhang ACL composite score 87/100 — immediate load reduction required', u: 'Critical', con: 'Risk of ACL injury if not addressed today', c: '#EF4444' },
    { t: 'Registration window closes 30 Apr — dual reg agreements pending', u: 'Urgent', con: 'Players ineligible if not registered', c: '#EF4444' },
    { t: 'Ava Mitchell maternity leave starts May — return plan not filed', u: 'High', con: 'Non-compliant with FA welfare standards', c: '#F59E0B' },
    { t: 'Independent welfare officer appointment overdue', u: 'High', con: 'Karen Carney Review criterion failing', c: '#F59E0B' },
    { t: 'Apex Performance kit review meeting Wed 16 Apr — samples not received', u: 'Medium', con: 'Delay to 2026/27 kit launch timeline', c: '#F59E0B' },
  ]

  return (
    <div className="min-h-screen flex" style={{ background: '#07080F', color: '#F9FAFB', zoom: 0.9 }}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col border-r border-gray-800 shrink-0 transition-all" style={{ width: sidebarCollapsed ? 64 : 220, background: '#0A0B12', position: 'sticky', top: 0, height: 'calc(100vh / 0.9)', alignSelf: 'flex-start' }}>
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-800">
          {session.logoDataUrl
            ? <img src={session.logoDataUrl} className="w-7 h-7 rounded object-cover flex-shrink-0" alt="" />
            : <img src="/badges/oakridge_fc_crest.svg" className="w-7 h-7 rounded object-contain flex-shrink-0" alt="Oakridge Women FC" />}
          {!sidebarCollapsed && <span className="text-sm font-bold text-white truncate">{session.clubName}</span>}
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {groups.map((group: string) => {
            const items = filteredItems
              .filter((i: { group: string }) => i.group === group)
              .sort((a: { id: string }, b: { id: string }) => (a.id === 'settings' ? 1 : b.id === 'settings' ? -1 : 0))
            if (items.length === 0) return null
            return (
            <div key={group}>
              {!sidebarCollapsed && <div className="text-[10px] text-gray-600 font-semibold tracking-wider px-4 pt-3 pb-1">{group}</div>}
              {items.map((item: { id: string; label: string; icon: string }) => {
                const NavIcon = NAV_ICON_MAP[item.id] ?? CircleDot
                return (
                <button key={item.id} onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-all ${
                    activeSection === item.id ? 'bg-pink-600/10 text-pink-400 font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                  <NavIcon size={14} strokeWidth={1.75} className="flex-shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  {!sidebarCollapsed && (item.id === 'preseason' || item.id === 'player-welfare' || item.id === 'club-operations') && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: '#BE185D' }}>NEW</span>}
                </button>
                )
              })}
            </div>
            )
          })}
        </nav>
        <div className="px-2 py-2 border-t border-gray-800">
          <RoleSwitcher
            session={session}
            roles={WOMENS_ROLES}
            accentColor="#EC4899"
            onRoleChange={(newRole) => { setActiveRole(newRole); setActiveSection('insights') }}
            sidebarCollapsed={sidebarCollapsed}
          />
        </div>
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-3 text-gray-600 hover:text-gray-400 border-t border-gray-800 text-xs">
          {sidebarCollapsed ? '→' : '← Collapse'}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col" style={{ minHeight: '100vh' }}>
        {/* Demo workspace banner */}
        <div className="flex items-center justify-between px-6 py-2 text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#BE185D', color: '#ffffff' }}>
          <span>This is a demo · sample data</span>
          <a href="/sports-signup" className="hover:underline font-semibold" style={{ color: '#ffffff' }}>Apply for your free founding access → lumiosports.com/sports-signup</a>
        </div>

        {/* FSR button bar */}
        <div className="border-b border-gray-800 px-6 py-3 flex items-center justify-between" style={{ background: '#0A0B12' }}>
          <div className="flex items-center gap-3">
            {session.logoDataUrl
              ? <img src={session.logoDataUrl} alt="" className="w-5 h-5 rounded object-cover" />
              : <span className="text-lg">⚽</span>}
            <div>
              <h1 className="text-sm font-bold text-white">{session.clubName}</h1>
              <p className="text-[10px] text-gray-500">
                {club.tier === 'grassroots' ? `${club.league} Women's Football` : `${club.league} · FSR Compliant · Karen Carney Review Standards`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session.photoDataUrl && (
              <img src={session.photoDataUrl} alt="" className="w-6 h-6 rounded-full object-cover border border-pink-600/40" />
            )}
            {club.tier !== 'grassroots' && (
              <span className={`text-xs px-2 py-1 rounded ${
                club.salarySpend !== null && club.salarySpend > 80 ? 'bg-red-600/20 text-red-400 border border-red-600/30' :
                club.salarySpend !== null && club.salarySpend > 70 ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30' :
                'bg-green-600/20 text-green-400 border border-green-600/30'
              }`}>
                FSR: {club.salarySpend !== null && club.salarySpend > 80 ? 'AT RISK' : club.salarySpend !== null && club.salarySpend > 70 ? 'REVIEW' : 'SAFE'}
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded ${
              club.tier === 'pro' ? 'bg-pink-600/20 text-pink-400 border border-pink-600/30' :
              club.tier === 'championship' ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30' :
              'bg-green-600/20 text-green-400 border border-green-600/30'
            }`}>{club.league}</span>
          </div>
        </div>

        {/* Role banner */}
        {currentRole !== 'director' && !isSponsor && roleConfig.message && (
          <div className="flex items-center justify-between px-6 py-2 text-xs flex-shrink-0"
            style={{ backgroundColor: `${roleConfig.accent}12`, borderBottom: `1px solid ${roleConfig.accent}25` }}>
            <div className="flex items-center gap-2">
              <span>{roleConfig.icon}</span>
              <span style={{ color: roleConfig.accent }}>Viewing as <strong>{roleConfig.label}</strong> — {roleConfig.message}</span>
            </div>
          </div>
        )}

        {/* Sponsor dashboard override */}
        {isSponsor && activeSection === 'dashboard' ? (
          <div className="p-6 flex-1">
            <WomensSponsorDashboard club={club} session={session} />
          </div>
        ) : activeSection !== 'dashboard' ? (
          <div className="p-6 flex-1">
            {renderView()}
          </div>
        ) : (
          <div className="flex-1 flex flex-col">

            {/* Hero — match-day banner FIRST, persistent across tabs */}
            <div style={{ background: v2T.bg, color: v2T.text, fontFamily: V2_FONT, padding: v2Density.gap, margin: '16px 16px 0 16px', borderRadius: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: v2Density.gap }}>
                <WfHeroToday
                  T={v2T} accent={v2Accent} density={v2Density} greeting={v2Greeting}
                  onConfirm={() => showV2DashToast('Starting XI confirmed · squad notified')}
                  onAsk={() => setV2AskOpen(true)}
                  onMatchBrief={() => setV2BriefOpen(true)}
                />
                <WfTodaySchedule T={v2T} accent={v2Accent} density={v2Density} />
              </div>
            </div>

            {/* Tab bar — Lucide icons + accent underline (matches rugby v2) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderBottom: `1px solid ${v2T.border}`, overflowX: 'auto', margin: '14px 24px 0' }}>
              {visibleTabs.map(t => {
                const active = dashTab === t.id
                return (
                  <button key={t.id} onClick={() => setDashTab(t.id)}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = v2T.text2 }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = v2T.text3 }}
                    style={{
                      appearance: 'none', border: 0, background: 'transparent',
                      padding: '10px 14px',
                      fontFamily: V2_FONT, fontSize: 12.5, fontWeight: active ? 600 : 500,
                      color: active ? '#fff' : v2T.text3,
                      borderBottom: `2px solid ${active ? v2Accent.hex : 'transparent'}`,
                      marginBottom: -1,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      transition: 'color .12s, border-color .12s',
                    }}>
                    <V2Icon name={v2TabIcon(t.id)} size={12} stroke={1.6} />
                    {t.label}
                  </button>
                )
              })}
            </div>

            {/* Quick Actions — rectangular desaturated (matches rugby v2) */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '12px 24px 0' }}>
              {quickActions.map(a => (
                <button key={a.id}
                  onClick={() => { if (['fsr','welfare','dualreg','preseason'].includes(a.id)) setActiveSection(a.id); else if (a.id === 'matchprep') setActiveSection('match') }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = v2Accent.hex; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2d3139'; e.currentTarget.style.color = '#9CA3AF' }}
                  style={{
                    appearance: 'none', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', borderRadius: 8,
                    background: 'transparent', border: '1px solid #2d3139',
                    color: '#9CA3AF', fontSize: 12, fontFamily: V2_FONT, cursor: 'pointer',
                    transition: 'border-color .12s, color .12s',
                  }}>
                  <span style={{ fontSize: 13 }}>{a.icon}</span>
                  <span>{a.label}</span>
                  {a.hot && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#1F2937', color: '#6B7280', fontWeight: 700, letterSpacing: '0.04em' }}>AI</span>}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6 flex-1 w-full">
              {/* Getting Started tab */}
              {dashTab === 'gettingstarted' && (
                <div className="space-y-4">
                  <SectionHeader title="Getting Started" subtitle="Complete these 10 steps to set up your club" icon="🚀" />
                  <div className="space-y-2">
                    {onboardingItems.map((item, idx) => (
                      <button key={idx} onClick={() => toggleOnboarding(idx)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                        style={{ backgroundColor: onboarding[idx] ? '#111318' : '#0D1117', border: onboarding[idx] ? '1px solid #22C55E30' : '1px solid #1F2937' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: onboarding[idx] ? '#22C55E20' : '#1F2937', border: onboarding[idx] ? '1px solid #22C55E50' : '1px solid #374151' }}>
                          {onboarding[idx] ? <span className="text-green-400 text-xs">✓</span> : <span className="text-gray-500 text-xs">{idx + 1}</span>}
                        </div>
                        <span className={`text-xs ${onboarding[idx] ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{item}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 p-3 rounded-xl text-xs" style={{ backgroundColor: '#BE185D15', border: '1px solid #BE185D30' }}>
                    <span style={{ color: '#BE185D' }} className="font-semibold">{onboarding.filter(Boolean).length}/10 complete</span>
                    <span className="text-gray-500 ml-2">— {onboarding.every(Boolean) ? 'All done! Switch to Today tab.' : 'Keep going, you\'re doing great!'}</span>
                  </div>
                </div>
              )}

              {/* Today tab — v2 modular grid */}
              {dashTab === 'today' && (
                <div style={{ background: v2T.bg, color: v2T.text, fontFamily: V2_FONT, padding: v2Density.gap, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: v2Density.gap }}>
                  <WfStatTiles T={v2T} accent={v2Accent} density={v2Density} />

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: v2Density.gap }}>
                    <WfAIBrief T={v2T} accent={v2Accent} density={v2Density} onAsk={() => setV2AskOpen(true)} />
                    <InteractiveWomensInbox T={v2T} accent={v2Accent} density={v2Density} />
                    <WfSquadModule T={v2T} accent={v2Accent} density={v2Density} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: v2Density.gap }}>
                    <WfFixturesModule T={v2T} accent={v2Accent} density={v2Density} onPick={f => setV2OpenFixture(f)} />
                    <WfPerf            T={v2T} accent={v2Accent} density={v2Density} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: v2Density.gap }}>
                    <WfRecents T={v2T} accent={v2Accent} density={v2Density} />
                    <WfSeason  T={v2T} accent={v2Accent} density={v2Density} />
                  </div>
                </div>
              )}

              {/* Quick Wins tab */}
              {dashTab === 'quickwins' && (
                <div className="space-y-4">
                  <SectionHeader title="Quick Wins" subtitle="High-impact actions you can take right now" icon="⚡" />
                  {quickWinsItems.map((item, idx) => (
                    <div key={idx} className="rounded-2xl p-5 transition-all" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${item.c}1e`, color: item.c }}>{item.p.toUpperCase()} IMPACT</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#BE185D1e', color: '#BE185D' }}>⏱ 5min</span>
                          </div>
                          <h3 className="font-bold mb-1" style={{ color: '#F9FAFB' }}>{item.t}</h3>
                          <p className="text-xs mt-2" style={{ color: '#374151' }}>Source: Lumio AI</p>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{ backgroundColor: '#BE185D' }}>Action →</button>
                          <button className="px-4 py-2 text-xs rounded-xl transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>Mark done</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Daily Tasks tab */}
              {dashTab === 'dailytasks' && (
                <div className="space-y-4">
                  <SectionHeader title="Daily Tasks" subtitle="Your operational checklist for today" icon="✅" />
                  {dailyTaskItems.map((item, idx) => (
                    <div key={idx} className="rounded-xl p-4 transition-all" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer" style={{ borderColor: '#374151' }}>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold mb-1" style={{ color: '#F9FAFB' }}>{item.t}</h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${item.c}1e`, color: item.c }}>{item.p}</span>
                              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{item.cat}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#BE185D1e', color: '#BE185D' }}>Lumio</span>
                              <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>Today</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{ backgroundColor: '#BE185D' }}>Action →</button>
                          <button className="px-4 py-2 text-xs rounded-xl transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>Mark done</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Insights tab */}
              {dashTab === 'insights' && (
                <InsightsView club={club} defaultRole={activeRole} />
              )}

              {/* Don't Miss tab */}
              {dashTab === 'dontmiss' && (
                <div className="space-y-4">
                  <SectionHeader title="Don't Miss" subtitle="Critical items that need your attention" icon="🔴" />
                  {dontMissItems.map((item, idx) => (
                    <div key={idx} className="p-4 bg-[#0D1117] rounded-xl" style={{ border: `1px solid ${item.c}30` }}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-xs text-gray-200 font-medium">{item.t}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ backgroundColor: `${item.c}20`, color: item.c }}>{item.u}</span>
                      </div>
                      <p className="text-[10px] text-gray-500">Consequence: {item.con}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Team tab */}
              {dashTab === 'team' && (
                <div className="space-y-4">
                  <SectionHeader title="Team" subtitle="Staff, structure, and club information" icon="👥" />
                  <div className="flex gap-1 border-b border-gray-800 mb-4">
                    {[
                      { id: 'today' as const, label: 'Today' },
                      { id: 'org' as const, label: 'Org Chart' },
                      { id: 'info' as const, label: 'Team Info' },
                      { id: 'club' as const, label: 'Club Info' },
                    ].map(t => (
                      <button key={t.id} onClick={() => setTeamSubTab(t.id)}
                        className="px-4 py-2 text-xs font-semibold transition-all"
                        style={{ color: teamSubTab === t.id ? '#BE185D' : '#6B7280', borderBottom: teamSubTab === t.id ? '2px solid #BE185D' : '2px solid transparent' }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  {teamSubTab === 'today' && (
                    <div className="space-y-2">
                      {[
                        { name: club.manager, role: 'Head Coach', status: 'In office', icon: '🎽' },
                        { name: 'Dr Sarah Patel', role: 'Club Doctor', status: 'Matchday prep', icon: '🏥' },
                        { name: 'James Kerr', role: 'Performance Analyst', status: 'GPS review', icon: '📡' },
                        { name: 'Lisa Okonkwo', role: 'Welfare Officer', status: '2 check-ins today', icon: '❤️' },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-[#0D1117] border border-gray-800 rounded-xl">
                          <span className="text-lg">{s.icon}</span>
                          <div className="flex-1"><div className="text-xs font-semibold text-white">{s.name}</div><div className="text-[10px] text-gray-500">{s.role}</div></div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-green-600/20 text-green-400">{s.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {teamSubTab === 'org' && (
                    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
                      <h3 className="text-sm font-bold text-white mb-4">Organisation Chart</h3>
                      <div className="space-y-3 text-xs">
                        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: '#BE185D20', border: '1px solid #BE185D40' }}>
                          <div className="font-bold text-white">{club.director}</div><div className="text-gray-400">Director</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[{ n: club.manager, r: 'Head Coach' }, { n: 'Commercial Dir.', r: 'Commercial' }, { n: 'Lisa Okonkwo', r: 'Welfare' }].map((p, i) => (
                            <div key={i} className="text-center p-2 rounded-lg bg-gray-800/50 border border-gray-700">
                              <div className="font-semibold text-white">{p.n}</div><div className="text-gray-500">{p.r}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {teamSubTab === 'info' && (
                    <div className="space-y-2">
                      {[
                        { l: 'Squad size', v: '24 registered' },
                        { l: 'Coaching staff', v: '6 (Head Coach + 5)' },
                        { l: 'Medical team', v: '3 (Doctor, Physio, S&C)' },
                        { l: 'Welfare', v: '1 Welfare Officer' },
                        { l: 'Analytics', v: '2 (Performance + Scout)' },
                      ].map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-[#0D1117] border border-gray-800 rounded-lg">
                          <span className="text-xs text-gray-400">{r.l}</span>
                          <span className="text-xs text-gray-200">{r.v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {teamSubTab === 'club' && (
                    <div className="space-y-2">
                      {[
                        { l: 'Club', v: club.name },
                        { l: 'League', v: club.league },
                        { l: 'Stadium', v: `${club.stadium} (${club.capacity.toLocaleString()})` },
                        { l: 'Founded', v: String(club.founded) },
                        { l: 'Kit Sponsor', v: club.kitSponsor || 'None' },
                      ].map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-[#0D1117] border border-gray-800 rounded-lg">
                          <span className="text-xs text-gray-400">{r.l}</span>
                          <span className="text-xs text-gray-200">{r.v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* v2 overlays — command palette, ask Lumio, fixture drawer, toast, match brief */}
      <V2CommandPalette T={v2T} accent={v2Accent} open={v2CmdOpen} onClose={() => setV2CmdOpen(false)} onAskLumio={() => { setV2CmdOpen(false); setV2AskOpen(true) }} />
      <V2AskLumio       T={v2T} accent={v2Accent} open={v2AskOpen} onClose={() => setV2AskOpen(false)} />
      <V2FixtureDrawer  T={v2T} accent={v2Accent} fixture={v2OpenFixture as unknown as never} onClose={() => setV2OpenFixture(null)} />
      <V2Toast          T={v2T} accent={v2Accent} msg={v2DashToast} />
      <WomensMatchBriefPanel T={v2T} accent={v2Accent} open={v2BriefOpen} onClose={() => setV2BriefOpen(false)} />
    </div>
  )
}

// ─── Women's FC v2 dashboard helpers (interactive inbox + match brief) ──

const WOMENS_INBOX_BODIES: Record<string, string> = {
  'SMS · Coaches':     'Frost: confirm Sunday XI please. Carter cleared, Davies out 2-3 weeks. Need team sheet by 12:30 for league submission.',
  'WhatsApp · Squad':  'Captain: morale really high after Tuesday session. Pitch walk done — surface firm, no concerns. Good vibe in group chat.',
  'Email · Selectors': 'WSL Championship — Hartwell fixture amended to 14:00 KO due to broadcast schedule. League office confirmed 10:42 today.',
  'Agent messages':    'Williams contract extension — agent wants 2-year deal at WSL Championship benchmark wage. Deadline end of month. Comparable offer on the table.',
  'Board messages':    'Kate: quarterly review Thursday 14:00. Agenda — FSR position, sponsorship pipeline (Apex), commercial Q3 vs plan, welfare audit findings.',
  'Medical Hub':       'Dr Patel: Davies MRI back — Grade 1 MCL. 2-3 weeks recovery, available cup match if managed. Okafor concussion protocol Day 3 going well.',
  'Media & Press':     "Northbridge Sport requesting feature on women's game growth — manager + 2 senior players. Friday 14:00. Talking points coming through.",
  'Player Welfare':    'Lisa: quarterly wellbeing survey at 87% completion. 2 players amber on sleep quality (Brennan, Tilley) — recommend 1-to-1s this week.',
  'Sponsorship':       'Apex Performance content shoot Friday confirmed — 4 players needed (kit launch). Check training schedule. Activation worth £35k bonus.',
}

function wfBtnGhost(): React.CSSProperties {
  return { fontSize: 11, padding: '5px 10px', background: 'transparent', color: '#9CA3AF', border: '1px solid #2d3139', borderRadius: 6, cursor: 'pointer', transition: 'border-color .12s, color .12s' }
}
function wfBtnPrimary(accentHex: string): React.CSSProperties {
  return { fontSize: 11.5, padding: '5px 12px', background: accentHex, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }
}

function InteractiveWomensInbox({ T, accent, density }: { T: typeof THEMES.dark; accent: typeof WOMENS_ACCENT; density: typeof DENSITY.regular }) {
  type RowState = { expanded: boolean; mode: 'idle' | 'replying' | 'forwarding'; reply: string; forwardTo: string; sentLabel: string | null; dismissed: boolean }
  const init = (): Record<string, RowState> => Object.fromEntries(WOMENS_INBOX.map(c => [c.ch, { expanded: false, mode: 'idle' as const, reply: '', forwardTo: 'Head Coach', sentLabel: null, dismissed: false }]))
  const [state, setState] = useState<Record<string, RowState>>(init)
  const update = (ch: string, patch: Partial<RowState>) => setState(s => ({ ...s, [ch]: { ...s[ch], ...patch } }))
  const items = WOMENS_INBOX.filter(c => !state[c.ch]?.dismissed)
  return (
    <div style={{ gridColumn: '6 / span 4', position: 'relative', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad }}>
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10, gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Inbox</div>
        <div style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3, fontFamily: 'monospace' }}>{items.length} · click to expand</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 420, overflow: 'auto' }}>
        {items.map((c, i) => {
          const s = state[c.ch] ?? { expanded: false, mode: 'idle' as const, reply: '', forwardTo: 'Head Coach', sentLabel: null, dismissed: false }
          const body = WOMENS_INBOX_BODIES[c.ch] ?? c.last
          return (
            <div key={c.ch} style={{ borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <div onClick={() => update(c.ch, { expanded: !s.expanded, mode: 'idle' })}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', cursor: 'pointer' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.urgent ? T.bad : T.text4 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: T.text, fontWeight: 500 }}>{c.ch}</div>
                  <div style={{ fontSize: 11, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.last}</div>
                </div>
                <div className="tnum" style={{ fontSize: 11, color: T.text3, fontFamily: 'monospace' }}>{c.time}</div>
                <div className="tnum" style={{ minWidth: 22, height: 18, padding: '0 6px', borderRadius: 9, display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 600, background: c.urgent ? 'rgba(199,90,90,0.12)' : T.hover, color: c.urgent ? T.bad : T.text2 }}>{c.count}</div>
              </div>
              {s.expanded && (
                <div style={{ padding: '6px 6px 12px 22px' }}>
                  <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.55, padding: 10, background: T.panel2, borderRadius: 6, border: `1px solid ${T.border}` }}>{body}</div>
                  {s.sentLabel && <div style={{ marginTop: 6, fontSize: 11, color: T.good, fontFamily: 'monospace' }}>{s.sentLabel}</div>}
                  {s.mode === 'idle' && !s.sentLabel && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button onClick={() => update(c.ch, { mode: 'replying' })}   style={wfBtnGhost()}>Reply</button>
                      <button onClick={() => update(c.ch, { mode: 'forwarding' })} style={wfBtnGhost()}>Forward</button>
                      <button onClick={() => update(c.ch, { dismissed: true })}    style={wfBtnGhost()}>Dismiss</button>
                    </div>
                  )}
                  {s.mode === 'replying' && (
                    <div style={{ marginTop: 8 }}>
                      <textarea value={s.reply} onChange={e => update(c.ch, { reply: e.target.value })}
                        placeholder="Type your reply…" rows={3}
                        style={{ width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 12, fontFamily: V2_FONT, resize: 'vertical' }} />
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button onClick={() => update(c.ch, { mode: 'idle', reply: '', sentLabel: 'Sent ✓' })} style={wfBtnPrimary(accent.hex)}>Send</button>
                        <button onClick={() => update(c.ch, { mode: 'idle', reply: '' })} style={wfBtnGhost()}>Cancel</button>
                      </div>
                    </div>
                  )}
                  {s.mode === 'forwarding' && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: T.text3 }}>Forward to:</span>
                      <select value={s.forwardTo} onChange={e => update(c.ch, { forwardTo: e.target.value })}
                        style={{ background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 11.5, fontFamily: V2_FONT }}>
                        <option>Head Coach</option><option>Assistant Manager</option><option>Director of Football</option>
                        <option>Welfare Officer</option><option>Medical Lead</option><option>Commercial Director</option><option>CEO</option>
                      </select>
                      <button onClick={() => update(c.ch, { mode: 'idle', sentLabel: `Forwarded to ${s.forwardTo} ✓` })} style={wfBtnPrimary(accent.hex)}>Forward</button>
                      <button onClick={() => update(c.ch, { mode: 'idle' })} style={wfBtnGhost()}>Cancel</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {items.length === 0 && <div style={{ fontSize: 12, color: T.text3, fontStyle: 'italic', padding: '14px 0' }}>Inbox cleared.</div>}
      </div>
    </div>
  )
}

function WomensMatchBriefPanel({ T, accent, open, onClose }: { T: typeof THEMES.dark; accent: typeof WOMENS_ACCENT; open: boolean; onClose: () => void }) {
  if (!open) return null
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, color: accent.hex, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>{title}</div>
      <div style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.7 }}>{children}</div>
    </div>
  )
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 80, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '100%', maxWidth: 760, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 28, fontFamily: V2_FONT, color: T.text }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10, color: accent.hex, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 4 }}>Match Brief</div>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: T.text }}>Oakridge Women FC <span style={{ color: T.text3, fontWeight: 400 }}>vs</span> Hartwell Women</h2>
            <div style={{ fontSize: 11.5, color: T.text2, marginTop: 4 }}>WSL Championship · MD-19</div>
            <div style={{ fontSize: 11.5, color: T.text3, marginTop: 1 }}>Sun 03 May 2026 · Oakridge Stadium · Kick-off 14:00</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text2, cursor: 'pointer', padding: '6px 12px', fontSize: 11 }}>Close</button>
        </div>

        <Section title="01 · Conditions">
          <div><strong style={{ color: T.text }}>Weather:</strong> 13°C light cloud, 9 mph SW wind.</div>
          <div><strong style={{ color: T.text }}>Pitch:</strong> Natural grass, firm surface, well-drained — moulded studs.</div>
          <div><strong style={{ color: T.text }}>Wind factor:</strong> Slight tailwind attacking the south end first half — favour direct running.</div>
          <div><strong style={{ color: T.text }}>Referee:</strong> A. Sterling — average 22 fouls/match, strict on shirt-pulls in box. Two yellows trigger ban.</div>
        </Section>

        <Section title="02 · Opposition Analysis · Hartwell Women">
          <div><strong style={{ color: T.text }}>Position:</strong> 9th in WSL Championship. <strong style={{ color: T.text }}>Last 5:</strong> L D W L D — slipping form.</div>
          <div style={{ marginTop: 8, color: T.text }}>Key threats:</div>
          <ul style={{ marginTop: 4, paddingLeft: 22 }}>
            <li>Striker <strong>K. Bell</strong> — 11 league goals, deadly in the air, weak left foot.</li>
            <li>Winger <strong>S. Idoko</strong> — 1v1 dangerous, takes corners short routine.</li>
            <li>Midfielder <strong>R. Park</strong> — sets tempo, leads tackles + interceptions.</li>
          </ul>
          <div style={{ marginTop: 8 }}><strong style={{ color: T.text }}>Weakness:</strong> Sit deep in 5-4-1 block, GK weak on high balls. Wide overloads + early crosses to back post are the route in.</div>
        </Section>

        <Section title="03 · Our Team News">
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li><strong style={{ color: T.text }}>Carter:</strong> cleared after scan — returns to starting XI. Decision: partner with Davies or Williams in midfield.</li>
            <li><strong style={{ color: T.text }}>Davies:</strong> MCL Grade 1 — 2-3 weeks. Out Sunday, available cup match if managed.</li>
            <li><strong style={{ color: T.text }}>Okafor:</strong> Concussion protocol Day 3 — likely available next week.</li>
            <li><strong style={{ color: T.text }}>Welfare note:</strong> Brennan + Tilley flagged amber on sleep — monitor warm-up sharpness, prioritise rotation second half.</li>
          </ul>
        </Section>

        <Section title="04 · Tactical Priorities">
          <ol style={{ paddingLeft: 22, margin: 0, listStyle: 'decimal' }}>
            <li>Wide overloads vs their 5-4-1 — fullbacks high, third-man runs from 8.</li>
            <li>Early crosses, target back post and edge of area for second-ball.</li>
            <li>Aerial discipline — Bell first contact, double up on second ball.</li>
            <li>Press their CB on goal kicks — force long ball, win second ball through 6.</li>
            <li>Set pieces target near post — three rehearsed routines.</li>
          </ol>
        </Section>

        <Section title="05 · Logistics">
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li>Kit van: confirmed 09:00, all GPS vests charged.</li>
            <li>Warm-up: 13:15 on main pitch, set-piece runs 13:35.</li>
            <li>Media: Northbridge Sport pitchside from 13:00, manager + captain post-match.</li>
            <li>Sponsor activation: Apex Performance content shoot Friday — confirm 4 players Thursday.</li>
            <li>Medical: Dr Patel pitchside, ambulance confirmed, away medics briefed.</li>
            <li>Welfare: Lisa Okonkwo on call, supporter-relations rep at supporter forum 16:30.</li>
          </ul>
        </Section>

        <div style={{ paddingTop: 14, borderTop: `1px solid ${T.border}`, fontSize: 10, color: T.text3, fontFamily: 'monospace', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' }}>
          Generated by Lumio · Match intelligence · Confidential
        </div>
      </div>
    </div>
  )
}
