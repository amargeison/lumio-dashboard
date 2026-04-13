'use client';
// TODO: Scope localStorage keys by user ID when auth is implemented// e.g. `sport_schedule_checked` → `sport_${userId}_schedule_checked`

import React, { useState, useEffect, useRef } from 'react';
import SportsDemoGate, { type SportsDemoSession } from '@/components/sports-demo/SportsDemoGate'
import RoleSwitcher from '@/components/sports-demo/RoleSwitcher'
import { generateSmartBriefing, buildRoundupSummary, buildScheduleItems, getUserTimezone } from '@/lib/sports/smartBriefing'
import SportsSettings from '@/components/sports/SportsSettings'
import { getDailyQuote, BOXING_QUOTES } from '@/lib/sports-quotes'

// ─── PROFILE SYNC HOOKS — re-read on 'lumio-profile-updated' events ──────────
function useBoxingProfileName(): string | null {
  const [name, setName] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('lumio_boxing_name')
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setName(localStorage.getItem('lumio_boxing_name'))
    window.addEventListener('lumio-profile-updated', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('lumio-profile-updated', sync); window.removeEventListener('storage', sync) }
  }, [])
  return name
}
function useBoxingProfilePhoto(): string | null {
  const [photo, setPhoto] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('lumio_boxing_profile_photo')
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setPhoto(localStorage.getItem('lumio_boxing_profile_photo'))
    window.addEventListener('lumio-profile-updated', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('lumio-profile-updated', sync); window.removeEventListener('storage', sync) }
  }, [])
  return photo
}
function useBoxingBrandName(): string {
  const [name, setName] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('lumio_boxing_brand_name') || ''
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setName(localStorage.getItem('lumio_boxing_brand_name') || '')
    window.addEventListener('lumio-profile-updated', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('lumio-profile-updated', sync); window.removeEventListener('storage', sync) }
  }, [])
  return name
}
function useBoxingBrandLogo(): string {
  const [logo, setLogo] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('lumio_boxing_brand_logo') || ''
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setLogo(localStorage.getItem('lumio_boxing_brand_logo') || '')
    window.addEventListener('lumio-profile-updated', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('lumio-profile-updated', sync); window.removeEventListener('storage', sync) }
  }, [])
  return logo
}

// ─── CLEAN RESPONSE ──────────────────────────────────────────────────────────
const cleanResponse = (text: string) => text
  .replace(/#{1,6}\s*/g, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
  .replace(/^\s*[-•·–—]\s*/gm, '').replace(/^\s*[\u2022\u2023\u25E6\u2043\u2219]\s*/gm, '')
  .replace(/^\s*\d+\.\s*/gm, '').replace(/\n{3,}/g, '\n\n').trim()

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface BoxingFighter {
  id: string;
  name: string;
  nickname: string;
  slug: string;
  nationality: string;
  flag: string;
  dateOfBirth: string;
  age: number;
  height: string;
  reach: string;
  stance: 'Orthodox' | 'Southpaw' | 'Switch';
  weight_class: string;
  current_weight: number;
  target_weight: number;
  record: { wins: number; losses: number; draws: number; ko: number };
  rankings: { wbc: number; wba: number; wbo: number; ibf: number };
  promoter: string;
  broadcast: string;
  manager: string;
  trainer: string;
  cutman: string;
  strength_coach: string;
  nutritionist: string;
  physio: string;
  camp_day: number;
  camp_total: number;
  next_fight: {
    opponent: string;
    opponent_nationality: string;
    opponent_flag: string;
    opponent_record: string;
    opponent_ranking: string;
    date: string;
    days_away: number;
    venue: string;
    broadcast: string;
  };
  plan: 'pro' | 'pro_plus' | 'elite';
}

// ─── BOXING ROLES ─────────────────────────────────────────────────────────────
const BOXING_ROLES = [
  { id: 'fighter',  label: 'Fighter',          icon: '🥊', description: 'Full access — camp, performance & career' },
  { id: 'trainer',  label: 'Trainer / Coach',   icon: '🎽', description: 'Training, sparring & camp preparation' },
  { id: 'manager',  label: 'Manager',           icon: '💼', description: 'Fights, contracts & commercial' },
  { id: 'promoter', label: 'Promoter',          icon: '🏟️', description: 'Events, purse bids & broadcast' },
  { id: 'sponsor',  label: 'Sponsor / Partner', icon: '🤝', description: 'Brand presence, obligations & ROI' },
]

// ─── SIDEBAR ITEMS ────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'camp',             label: 'Camp Dashboard',      icon: '🏕️', group: 'FIGHT CAMP' },
  { id: 'training',        label: 'Training Log',        icon: '🥊', group: 'FIGHT CAMP' },
  { id: 'sparring',        label: 'Sparring Planner',    icon: '🤼', group: 'FIGHT CAMP' },
  { id: 'opposition',      label: 'Opposition Analysis', icon: '🔍', group: 'FIGHT CAMP' },
  { id: 'fight-night',     label: 'Fight Night Ops',     icon: '🥊', group: 'FIGHT CAMP' },
  { id: 'punchanalytics',  label: 'Punch Analytics',     icon: '🥊', group: 'FIGHT CAMP' },
  { id: 'gpsringheatmap',  label: 'GPS & Ring Heatmap',  icon: '🛰️', group: 'FIGHT CAMP' },
  { id: 'fightcamp',       label: 'Fight Camp',          icon: '🥊', group: 'FIGHT CAMP' },
  { id: 'weight',          label: 'Weight Tracker',      icon: '⚖️', group: 'WEIGHT & HEALTH' },
  { id: 'cut',             label: 'Cut Planner',         icon: '📉', group: 'WEIGHT & HEALTH' },
  { id: 'recovery',        label: 'Recovery & HRV',      icon: '💚', group: 'WEIGHT & HEALTH' },
  { id: 'medical',         label: 'Medical Record',      icon: '🏥', group: 'WEIGHT & HEALTH' },
  { id: 'rankings',        label: 'World Rankings',      icon: '🌍', group: 'RANKINGS' },
  { id: 'mandatory',       label: 'Mandatory Tracker',   icon: '📋', group: 'RANKINGS' },
  { id: 'pathtotitle',     label: 'Path to Title',       icon: '🏆', group: 'RANKINGS' },
  { id: 'pursebid',        label: 'Purse Bid Alerts',    icon: '🔔', group: 'RANKINGS' },
  { id: 'career',          label: 'Career Planning',     icon: '🚀', group: 'RANKINGS' },
  { id: 'pursesim',        label: 'Purse Simulator',     icon: '💷', group: 'FINANCIALS' },
  { id: 'earnings',        label: 'Fight Earnings',      icon: '💰', group: 'FINANCIALS' },
  { id: 'campcosts',       label: 'Camp Costs',          icon: '🧾', group: 'FINANCIALS' },
  { id: 'tax',             label: 'Tax Tracker',         icon: '📊', group: 'FINANCIALS' },
  { id: 'teamoverview',    label: 'Team Overview',       icon: '👥', group: 'TEAM HUB' },
  { id: 'briefing',        label: 'Fighter Briefing',    icon: '📄', group: 'TEAM HUB' },
  { id: 'trainernotes',    label: 'Trainer Notes',       icon: '📝', group: 'TEAM HUB' },
  { id: 'managerdash',     label: 'Manager Dashboard',   icon: '💼', group: 'TEAM HUB' },
  { id: 'sponsorships',    label: 'Sponsorships',        icon: '🤝', group: 'COMMERCIAL' },
  { id: 'media',           label: 'Media Obligations',   icon: '📱', group: 'COMMERCIAL' },
  { id: 'appearances',     label: 'Appearance Fees',     icon: '🎤', group: 'COMMERCIAL' },
  { id: 'contracts',       label: 'Contract Tracker',    icon: '📑', group: 'COMMERCIAL' },
  { id: 'fightrecord',     label: 'Fight Record',        icon: '📜', group: 'CAREER' },
  { id: 'careerstats',     label: 'Career Stats',        icon: '📈', group: 'CAREER' },
  { id: 'promoterpipeline',label: 'Promoter Pipeline',   icon: '🗂️', group: 'CAREER' },
  { id: 'agentintel',      label: 'Agent Intel',         icon: '🕵️', group: 'CAREER' },
  { id: 'aibriefing',      label: 'AI Morning Briefing', icon: '🌅', group: 'INTEL' },
  { id: 'opscout',         label: 'Opposition Scout',    icon: '🎯', group: 'INTEL' },
  { id: 'broadcast',       label: 'Broadcast Tracker',   icon: '📺', group: 'INTEL' },
  { id: 'news',            label: 'Industry News',       icon: '📰', group: 'INTEL' },
  { id: 'gps',             label: 'GPS Load Monitor',    icon: '📡', group: 'INTEGRATIONS' },
  { id: 'gpsvest',         label: 'GPS Vest Dashboard',  icon: '🦺', group: 'INTEGRATIONS' },
  { id: 'findpro',         label: 'Find a Pro',          icon: '🔍', group: 'INTEGRATIONS' },
  { id: 'settings',        label: 'Settings',            icon: '⚙️', group: 'INTEL' },
];

// ─── DEMO FIGHTER DATA ────────────────────────────────────────────────────────
const DEMO_FIGHTER: BoxingFighter = {
  id: 'fighter-demo-001',
  name: 'Marcus Cole',
  nickname: 'The Machine',
  slug: 'marcus-cole',
  nationality: 'British',
  flag: '🇬🇧',
  dateOfBirth: '1999-01-17',
  age: 27,
  height: '6\'4" / 193cm',
  reach: '82" / 208cm',
  stance: 'Orthodox',
  weight_class: 'Heavyweight',
  current_weight: 97.8,
  target_weight: 92.7,
  record: { wins: 22, losses: 1, draws: 0, ko: 18 },
  rankings: { wbc: 6, wba: 9, wbo: 5, ibf: 12 },
  promoter: 'Matchroom Boxing',
  broadcast: 'DAZN',
  manager: 'Danny Walsh',
  trainer: 'Jim Bevan',
  cutman: 'Mick Williamson',
  strength_coach: 'Greg Mayfield',
  nutritionist: 'Dr. Priya Kapoor',
  physio: 'Liam Brennan',
  camp_day: 22,
  camp_total: 70,
  next_fight: {
    opponent: 'Viktor Petrov',
    opponent_nationality: 'Russian',
    opponent_flag: '🇷🇺',
    opponent_record: '28-2 (24 KO)',
    opponent_ranking: 'WBC #3',
    date: '2026-05-22',
    days_away: 48,
    venue: 'The O2 Arena, London',
    broadcast: 'DAZN PPV',
  },
  plan: 'elite',
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = 'red' }: { label: string; value: string | number; sub?: string; color?: string }) => {
  const colorMap: Record<string, string> = {
    red:    'from-red-600/20 to-red-900/10 border-red-600/20',
    teal:   'from-teal-600/20 to-teal-900/10 border-teal-600/20',
    orange: 'from-orange-600/20 to-orange-900/10 border-orange-600/20',
    blue:   'from-blue-600/20 to-blue-900/10 border-blue-600/20',
    green:  'from-green-600/20 to-green-900/10 border-green-600/20',
    yellow: 'from-yellow-600/20 to-yellow-900/10 border-yellow-600/20',
    purple: 'from-purple-600/20 to-purple-900/10 border-purple-600/20',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color] || colorMap.red} border rounded-xl p-4`}>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
};

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: string }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2">
      {icon && <span className="text-xl">{icon}</span>}
      <h2 className="text-xl font-bold text-white" style={{  }}>{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-gray-400 mt-1 ml-7">{subtitle}</p>}
  </div>
);

// ─── QUICK ACTIONS BAR ────────────────────────────────────────────────────────
const QuickActionsBar = () => {
  const actions = [
    'Log Session', 'Book Sparring', 'Log Weight', 'Injury Report',
    'Review Film', 'Camp Notes', 'Add Expense', 'Team Brief',
    'Media Request', 'Press Statement', 'Fight Offer', 'Purse Calc',
  ];
  return (
    <div className="mb-6 overflow-x-auto pb-2 -mx-1">
      <div className="flex gap-2 px-1 min-w-max">
        {actions.map((action, i) => (
          <button
            key={i}
            className="bg-[#0d0f1a] border border-gray-800 hover:border-red-500/50 rounded-full px-4 py-2 text-xs text-gray-400 hover:text-white transition-all whitespace-nowrap"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── WAVE BANNER ──────────────────────────────────────────────────────────────
const WaveBanner = ({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) => (
  <div className="bg-gradient-to-r from-red-900/60 via-[#07080F] to-orange-900/40 rounded-xl px-5 py-3 mb-5">
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button className="w-8 h-8 rounded-full bg-red-600/30 border border-red-500/40 flex items-center justify-center text-sm hover:bg-red-600/50 transition-colors">
          🥊
        </button>
        <div>
          <div className="text-xs text-gray-400">Next fight</div>
          <div className="text-sm text-white font-medium">vs {fighter.next_fight.opponent} {fighter.next_fight.opponent_flag} — {fighter.next_fight.days_away} days</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-xs text-gray-500">Camp Day {fighter.camp_day}/{fighter.camp_total}</div>
          <div className="text-xs text-gray-400">{fighter.next_fight.venue}</div>
        </div>
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
      </div>
    </div>
    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
      <div className="text-xs text-gray-400">
        ⚖️ Weight cut: <span className="text-white font-medium">{fighter.current_weight}kg</span>
        <span className="text-gray-500 mx-2">→</span>
        <span className="text-teal-400 font-medium">{fighter.target_weight}kg</span>
        <span className="text-gray-500 mx-2">·</span>
        <span className="text-red-400">{(fighter.current_weight - fighter.target_weight).toFixed(1)}kg to go</span>
      </div>
      <div className="text-xs">
        {(fighter.current_weight - fighter.target_weight) > 3 ? (
          <span className="text-yellow-400 font-medium">⚠ Daily target: -{((fighter.current_weight - fighter.target_weight) / (fighter.next_fight.days_away / 7) / 7).toFixed(2)}kg</span>
        ) : (
          <span className="text-green-400 font-medium">✓ On track for fight weight</span>
        )}
      </div>
    </div>
  </div>
);

// ─── FIGHTER CARD ─────────────────────────────────────────────────────────────
const FighterCard = ({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) => {
  const isPlayerRole = !session.role || session.role === 'fighter'
  const liveName = isPlayerRole ? (typeof window !== 'undefined' ? localStorage.getItem('lumio_boxing_name') : null) || session.userName || fighter.name : fighter.name
  const liveNickname = isPlayerRole ? (typeof window !== 'undefined' ? localStorage.getItem('lumio_boxing_nickname') : null) || '' : fighter.nickname
  const livePhoto = isPlayerRole ? (typeof window !== 'undefined' ? localStorage.getItem('lumio_boxing_profile_photo') : null) || session.photoDataUrl : null
  return (
  <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
    <div className="flex flex-col items-center text-center mb-3">
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 border-2 border-red-500/40 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(234,88,12,0.3))' }}>
        {livePhoto ? <img src={livePhoto} alt={liveName} className="w-full h-full object-cover object-center" /> : fighter.flag}
      </div>
      <div className="text-sm font-bold text-white">{liveName}</div>
      {liveNickname ? <div className="text-[10px] text-red-400 font-semibold">&ldquo;{liveNickname}&rdquo;</div> : null}
      <div className="text-xs text-gray-400 mt-1">{fighter.record.wins}-{fighter.record.losses} ({fighter.record.ko} KO)</div>
    </div>
    <div className="space-y-1.5 text-xs">
      <div className="flex justify-between"><span className="text-gray-500">Weight Class</span><span className="text-gray-300">{fighter.weight_class}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">Stance</span><span className="text-gray-300">{fighter.stance}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">Height</span><span className="text-gray-300">{fighter.height}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">Reach</span><span className="text-gray-300">{fighter.reach}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">Age</span><span className="text-gray-300">{fighter.age}</span></div>
      <div className="border-t border-gray-800 my-2"></div>
      <div className="flex justify-between"><span className="text-gray-500">WBC</span><span className="text-red-400 font-semibold">#{fighter.rankings.wbc}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">WBA</span><span className="text-red-400 font-semibold">#{fighter.rankings.wba}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">WBO</span><span className="text-red-400 font-semibold">#{fighter.rankings.wbo}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">IBF</span><span className="text-red-400 font-semibold">#{fighter.rankings.ibf}</span></div>
      <div className="border-t border-gray-800 my-2"></div>
      <div className="flex justify-between"><span className="text-gray-500">Promoter</span><span className="text-gray-300">{fighter.promoter}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">Trainer</span><span className="text-gray-300">{fighter.trainer}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">Manager</span><span className="text-gray-300">{fighter.manager}</span></div>
    </div>
  </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── GPS DEMO DATA & RING COMPONENTS ──────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const GPS_SESSIONS = [
  { day: 15, date: '2026-03-28', type: 'Sparring', duration: 65, distance: 4.2, load: 312, acr_acute: 1.02, acr_chronic: 0.88, acwr: 1.16,
    ring: { centre: 38, ropes: 34, corners: 28 },
    heatmap: [{x:200,y:200,r:45,o:0.7},{x:185,y:210,r:35,o:0.55},{x:215,y:195,r:30,o:0.45},{x:80,y:200,r:28,o:0.5},{x:320,y:200,r:25,o:0.45},{x:200,y:80,r:22,o:0.4},{x:200,y:320,r:20,o:0.35}] },
  { day: 16, date: '2026-03-29', type: 'Roadwork', duration: 52, distance: 8.4, load: 198, acr_acute: 0.94, acr_chronic: 0.88, acwr: 1.07,
    ring: { centre: 0, ropes: 0, corners: 0 },
    heatmap: [] },
  { day: 17, date: '2026-03-30', type: 'Strength', duration: 70, distance: 2.1, load: 241, acr_acute: 0.97, acr_chronic: 0.89, acwr: 1.09,
    ring: { centre: 0, ropes: 0, corners: 0 },
    heatmap: [] },
  { day: 18, date: '2026-03-31', type: 'Sparring', duration: 80, distance: 5.1, load: 389, acr_acute: 1.14, acr_chronic: 0.91, acwr: 1.25,
    ring: { centre: 42, ropes: 31, corners: 27 },
    heatmap: [{x:200,y:200,r:50,o:0.75},{x:195,y:205,r:38,o:0.6},{x:80,y:200,r:30,o:0.5},{x:320,y:200,r:28,o:0.48},{x:200,y:80,r:25,o:0.42},{x:200,y:320,r:22,o:0.38},{x:80,y:80,r:18,o:0.3}] },
  { day: 19, date: '2026-04-01', type: 'Rest', duration: 0, distance: 0, load: 0, acr_acute: 0.98, acr_chronic: 0.90, acwr: 1.09,
    ring: { centre: 0, ropes: 0, corners: 0 },
    heatmap: [] },
  { day: 20, date: '2026-04-02', type: 'Sparring', duration: 90, distance: 5.8, load: 421, acr_acute: 1.22, acr_chronic: 0.93, acwr: 1.31,
    ring: { centre: 35, ropes: 38, corners: 27 },
    heatmap: [{x:200,y:200,r:40,o:0.6},{x:80,y:200,r:38,o:0.65},{x:320,y:200,r:35,o:0.6},{x:200,y:80,r:30,o:0.5},{x:200,y:320,r:28,o:0.48},{x:80,y:80,r:20,o:0.35},{x:320,y:80,r:18,o:0.3}] },
  { day: 21, date: '2026-04-03', type: 'Pads', duration: 45, distance: 3.4, load: 267, acr_acute: 1.18, acr_chronic: 0.94, acwr: 1.26,
    ring: { centre: 55, ropes: 28, corners: 17 },
    heatmap: [{x:200,y:200,r:55,o:0.8},{x:195,y:198,r:42,o:0.65},{x:210,y:205,r:35,o:0.5},{x:80,y:200,r:20,o:0.35},{x:320,y:200,r:18,o:0.3}] },
  { day: 22, date: '2026-04-04', type: 'Sparring', duration: 75, distance: 4.9, load: 358, acr_acute: 1.19, acr_chronic: 0.95, acwr: 1.25,
    ring: { centre: 40, ropes: 35, corners: 25 },
    heatmap: [{x:200,y:200,r:48,o:0.72},{x:190,y:205,r:36,o:0.58},{x:80,y:200,r:32,o:0.52},{x:320,y:200,r:30,o:0.5},{x:200,y:80,r:24,o:0.42},{x:200,y:320,r:22,o:0.38}] },
];

const ROADWORK_ROUTES = [
  { day: 16, date: '2026-03-29', distance: 8.4, duration: 52, avgPace: '6:11/km',
    points: [{x:200,y:180},{x:240,y:150},{x:280,y:140},{x:310,y:160},{x:320,y:200},{x:300,y:240},{x:260,y:260},{x:220,y:280},{x:190,y:260},{x:170,y:220},{x:175,y:190},{x:200,y:180}],
    paceZones: [{label:'Easy',km:2.1,color:'#22C55E'},{label:'Steady',km:4.2,color:'#F59E0B'},{label:'Tempo',km:2.1,color:'#EF4444'}] },
];

function RingHeatmap({ session, size = 300 }: { session: typeof GPS_SESSIONS[0]; size?: number }) {
  const s = size;
  const cx = s / 2; const cy = s / 2;
  const scale = s / 400;

  return (
    <svg viewBox={`0 0 ${s} ${s}`} width={s} height={s} style={{display:'block'}}>
      <rect x={s*0.05} y={s*0.05} width={s*0.9} height={s*0.9} rx={s*0.02} fill="#1a1a0a" stroke="#555" strokeWidth="1"/>
      {[0.92, 0.84, 0.76].map((f, i) => (
        <rect key={i} x={s*0.05+(s*0.9*(1-f)/2)} y={s*0.05+(s*0.9*(1-f)/2)} width={s*0.9*f} height={s*0.9*f} rx={s*0.01} fill="none" stroke="#8B4513" strokeWidth="1.5" opacity="0.6"/>
      ))}
      {[[0.06,0.06],[0.88,0.06],[0.06,0.88],[0.88,0.88]].map(([px,py],i) => (
        <rect key={i} x={s*px} y={s*py} width={s*0.06} height={s*0.06} rx="2" fill="#8B4513" opacity="0.5"/>
      ))}
      <line x1={s*0.05} y1={cy} x2={s*0.95} y2={cy} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4,4"/>
      {session.heatmap.map((z, i) => (
        <circle key={i} cx={z.x*scale} cy={z.y*scale} r={z.r*scale} fill="#EF4444" opacity={z.o} style={{filter:'blur(8px)'}}/>
      ))}
      {session.ring.centre > 0 && <text x={cx} y={cy+4} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={s*0.038} fontWeight="600">{session.ring.centre}%</text>}
      <text x={s*0.5} y={s*0.96} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={s*0.028}>CENTRE · ROPES · CORNERS</text>
    </svg>
  );
}

function RingZoneBar({ session }: { session: typeof GPS_SESSIONS[0] }) {
  const { centre, ropes, corners } = session.ring;
  if (!centre && !ropes && !corners) return <div className="text-xs text-gray-500 italic">No ring data — non-sparring session</div>;
  return (
    <div className="space-y-2">
      {[{label:'Centre',value:centre,color:'bg-red-500'},{label:'Ropes',value:ropes,color:'bg-orange-500'},{label:'Corners',value:corners,color:'bg-yellow-500'}].map(z => (
        <div key={z.label} className="flex items-center gap-3">
          <div className="w-16 text-xs text-gray-400">{z.label}</div>
          <div className="flex-1 bg-gray-800 rounded-full h-2">
            <div className={`${z.color} h-2 rounded-full transition-all`} style={{width:`${z.value}%`}}/>
          </div>
          <div className="w-8 text-xs text-gray-300 text-right">{z.value}%</div>
        </div>
      ))}
    </div>
  );
}

// ─── AI DEPARTMENT INTELLIGENCE SECTION ──────────────────────────────────────
interface BoxingAISectionProps {
  context: string
  fighter: BoxingFighter
  session: SportsDemoSession
}

function BoxingAISection({ context, fighter, session }: BoxingAISectionProps) {
  const [summary, setSummary]     = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [generated, setGenerated] = useState(false)
  const hasGenerated = useRef(false)

  const HIGHLIGHTS: Record<string, string[]> = {
    dashboard:    [`Fight Night in ${fighter.next_fight.days_away} days — ${fighter.next_fight.opponent} (${fighter.next_fight.opponent_ranking})`, `Weight on track: ${fighter.current_weight}kg — cut to ${fighter.target_weight}kg manageable`, 'Sparring this week: 8 rounds logged — no incidents', 'Purse bid deadline: IBF mandatory — 30 Apr', 'GPS load: ACWR 1.25 — manage carefully, near upper limit'],
    training:     ['Session load this week: 4,820 AU — on plan', 'Sparring quality: coach rated 8.2/10 last session', 'Jab speed improving: +0.04s vs last camp avg', 'Right hand power: 94% of peak — near fight-ready', 'Conditioning: VO2 max 58.4 — top 5% for weight class'],
    weight:       [`Current: ${fighter.current_weight}kg → target ${fighter.target_weight}kg at weigh-in`, `${(fighter.current_weight - fighter.target_weight).toFixed(1)}kg to cut — ${fighter.next_fight.days_away} days — on schedule`, 'Water cut phase starts 5 days before — plan confirmed with nutritionist', 'Nutrition plan updated for cut phase: -400 cal/day from next week', 'Last camp cut was comparable — no concerns'],
    rankings:     [`WBC #${fighter.rankings.wbc} — up 1 this month`, `IBF #${fighter.rankings.ibf} — mandatory position approaching`, `Win vs ${fighter.next_fight.opponent}: projected WBC #${Math.max(1, fighter.rankings.wbc - 2)} / IBF mandatory confirmed`, 'Top-5 all major belts = world title shot by end of year', 'Promoter pipeline: 2 world title offers pending fight result'],
    sponsorship:  ['Under Armour: camp partnership — 2 posts due this month', 'DAZN: fight night promo shoot confirmed', 'New inquiry: sports nutrition brand — £45k/yr offer', 'Manager reviewing Under Armour camp partnership', 'Prize money media allocation: confirm with promoter'],
    travel:       [`Fight venue: ${fighter.next_fight.venue}`, 'Camp departs: 14 days before fight — logistics in progress', 'Corner team flights: 4 booked, 1 pending (cutman)', 'Media day — arrivals press conference scheduled', `Broadcast: ${fighter.next_fight.broadcast}`],
    financial:    ['Purse (guaranteed): £380,000', 'PPV upside: estimated £120k–£280k additional', 'Camp costs this cycle: £42,800 — on budget', 'Agent commission: 15% of gross purse', 'Tax instalment due Jul — accountant briefed'],
    mental:       ['Mindset: coach rates 9.1/10 this camp — best in career', 'Visualisation sessions: daily at 07:00 — 14 completed', `${fighter.next_fight.opponent} mental game: known to intimidate pre-fight — stay composed`, 'Cut stress protocol: start breathing practice at final weight cut', 'Post-fight plan confirmed — reduces anxiety about outcome'],
    opponent:     [`${fighter.next_fight.opponent} — ${fighter.next_fight.opponent_ranking} — southpaw, aggressive style`, 'Last 5 fights: 4W-1L — loss by SD to ranked contender', 'Known weakness: struggles against movers who use the jab', 'Tends to fade after round 8 — conditioning concern', 'Corner team change: new trainer since last fight — watch for tactical shifts'],
    medical:      ['Pre-fight medical: BBBofC clearance on track', 'MRI scan valid — within 12-month window', 'Blood work due: submit by fight week deadline', 'Right shoulder: monitored — physio reports improving', 'No suspensions or medical flags on record'],
    default:      [`Fight Night in ${fighter.next_fight.days_away} days — ${fighter.next_fight.opponent} (${fighter.next_fight.opponent_ranking})`, `Weight on track: ${fighter.current_weight}kg — cut manageable`, 'Purse bid deadline: 30 Apr — agent actioning', 'GPS load: ACWR 1.25 — manage carefully', 'Sparring: 8 rounds this week — good sessions'],
  }

  const highlights = HIGHLIGHTS[context] ?? HIGHLIGHTS.default

  const generateSummary = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/boxing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are the AI performance analyst for ${session.userName || fighter.name}, a ${fighter.weight_class} professional boxer nicknamed "${fighter.nickname}".

Generate a concise AI department summary for the "${context}" section.

Fighter context:
- WBC Ranking: #${fighter.rankings.wbc}
- IBF Ranking: #${fighter.rankings.ibf}
- Record: ${fighter.record.wins}-${fighter.record.losses} (${fighter.record.ko} KO)
- Next fight: ${fighter.next_fight.opponent} (${fighter.next_fight.opponent_ranking}) in ${fighter.next_fight.days_away} days
- Weight: ${fighter.current_weight}kg → ${fighter.target_weight}kg
- Camp Day: ${fighter.camp_day}/${fighter.camp_total}

Cover the four or five most important insights for the ${context} section in one flowing paragraph. Be specific. Around 120–160 words. Plain prose only — no bullet points, no dashes, no numbered lists, no emoji at the start of lines, no bold, no headers, no markdown.`
          }]
        })
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        const errMsg = typeof data.error === 'string' ? data.error : (data.error?.message || `HTTP ${res.status}`)
        console.error('[BoxingAISection] API error:', errMsg, data)
        setSummary(`⚠️ AI service error: ${errMsg}. Check ANTHROPIC_API_KEY in Settings → Developer Tools.`)
        setGenerated(true)
        setLoading(false)
        return
      }
      const raw = data.content?.map((b: {type:string;text?:string}) =>
        b.type === 'text' ? b.text : '').join('') || ''
      if (!raw.trim()) {
        console.warn('[BoxingAISection] Empty response from API:', data)
        setSummary('⚠️ AI returned an empty response. Try again or check API key configuration.')
      } else {
        setSummary(cleanResponse(raw) || raw)
      }
      setGenerated(true)
    } catch (err) {
      console.error('[BoxingAISection] Fetch failed:', err)
      setSummary('⚠️ Unable to reach AI service. Check your network connection.')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (hasGenerated.current) return
    hasGenerated.current = true
    generateSummary()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderSummary = (text: string) =>
    text.split('\n').filter(l => l.trim()).map((line, i) => (
      <div key={i} className="flex gap-2 text-xs text-gray-300 py-1 border-b border-gray-800/40 last:border-0">
        <span>{line}</span>
      </div>
    ))

  return (
    <div className="mt-8 pt-6 border-t border-gray-800/60">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">🤖 AI Department Intelligence</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span>✨</span>
              <span className="text-sm font-bold text-white">AI Summary</span>
            </div>
            <div className="flex items-center gap-2">
              {generated && <span className="text-[10px] text-gray-600">Generated just now</span>}
              <button onClick={generateSummary} disabled={loading} className="text-gray-600 hover:text-gray-400 text-sm">{loading ? '⟳' : '↺'}</button>
            </div>
          </div>
          {!summary && !loading && (
            <button onClick={generateSummary}
              className="w-full py-3 rounded-xl text-xs font-semibold border border-gray-800 text-gray-500 hover:border-red-500/40 hover:text-red-400 transition-all">
              Generate AI summary for this section →
            </button>
          )}
          {loading && (
            <div>
              <div className="text-[10px] text-gray-600 mb-2">Generating AI summary…</div>
              <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-3 bg-gray-800 rounded animate-pulse" style={{width:`${70+i*7}%`}} />)}</div>
            </div>
          )}
          {summary && !loading && <div>{renderSummary(summary)}</div>}
        </div>
        <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><span>⚡</span><span className="text-sm font-bold text-white">AI Key Highlights</span></div>
            <span className="text-[10px] text-red-400 cursor-pointer">Performance</span>
          </div>
          <div className="space-y-2">
            {highlights.map((h, i) => (
              <div key={i} className="flex gap-3 py-1.5 border-b border-gray-800/40 last:border-0">
                <span className="text-xs text-red-400 font-bold flex-shrink-0 w-4">{i+1}</span>
                <span className="text-xs text-gray-300">{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── SEND MESSAGE MODAL ───────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function BoxingSendMessage({ onClose, fighter, session }: { onClose: () => void; fighter: BoxingFighter; session: SportsDemoSession }) {
  const [step, setStep] = useState<'who'|'how'|'message'|'preview'|'sent'>('who')
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [customPerson, setCustomPerson] = useState('')
  const [channels, setChannels] = useState<string[]>(['email'])
  const [messageText, setMessageText] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [aiDraft, setAiDraft] = useState('')
  const [loading, setLoading] = useState(false)

  const TEAM = [
    { name: fighter.trainer || 'Jim Bevan', role: 'Trainer', icon: '🥊' },
    { name: fighter.manager || 'Danny Walsh', role: 'Manager', icon: '💼' },
    { name: fighter.cutman || 'Paul Carter', role: 'Cutman', icon: '✂️' },
    { name: fighter.physio || 'Dr Mike Patel', role: 'Physio', icon: '⚕️' },
    { name: 'James Wright', role: 'Agent', icon: '💼' },
    { name: fighter.strength_coach || 'Tom Barnes', role: 'S&C Coach', icon: '💪' },
  ]

  const CHANNELS = [
    { id: 'sms', label: 'Text / SMS', icon: '💬' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '🟢' },
    { id: 'email', label: 'Email', icon: '📧' },
    { id: 'internal', label: 'Internal Message', icon: '🔔' },
  ]

  const togglePerson = (name: string) => setSelectedPeople(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  const toggleChannel = (id: string) => setChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  const allRecipients = [...selectedPeople, ...(customPerson.trim() ? [customPerson.trim()] : [])]

  const handleSend = async (urgent: boolean) => {
    setIsUrgent(urgent)
    setLoading(true)
    try {
      const usedChannels = urgent ? CHANNELS.map(c => c.label) : channels.map(id => CHANNELS.find(c => c.id === id)?.label || id)
      const rankInfo = [fighter.rankings.wbc && `WBC #${fighter.rankings.wbc}`, fighter.rankings.wba && `WBA #${fighter.rankings.wba}`, fighter.rankings.wbo && `WBO #${fighter.rankings.wbo}`, fighter.rankings.ibf && `IBF #${fighter.rankings.ibf}`].filter(Boolean).join(', ')
      const res = await fetch('/api/ai/boxing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, messages: [{ role: 'user',
          content: `Draft a professional but direct message on behalf of ${session.userName || fighter.name}, a professional boxer (${fighter.weight_class}, ${rankInfo}). Recipients: ${allRecipients.join(', ')}. Channel: ${usedChannels.join(', ')}. Message: ${messageText}. ${urgent ? 'This is marked URGENT — prepend with [URGENT] and make the tone immediate.' : ''} Return only the final message text, no preamble. Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.`
        }] })
      })
      const data = await res.json()
      setAiDraft(cleanResponse(data.content?.[0]?.text || messageText))
    } catch { setAiDraft(urgent ? `[URGENT] ${messageText}` : messageText) }
    setLoading(false)
    setStep('preview')
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #1F2937' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">📨</span>
          <div>
            <div className="text-base font-bold text-white">Send Message</div>
            <div className="text-xs" style={{ color: '#6B7280' }}>
              {step === 'who' ? 'Step 1 — Who are you messaging?' : step === 'how' ? 'Step 2 — How do you want to send it?' : step === 'message' ? 'Step 3 — Write your message' : step === 'preview' ? 'Preview — Confirm & send' : 'Sent!'}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">✕</button>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 px-6 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
        {['Who', 'How', 'Message', 'Preview'].map((s, i) => {
          const stepIdx = ['who','how','message','preview'].indexOf(step)
          return (
            <React.Fragment key={s}>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: i < stepIdx ? '#22C55E' : i === stepIdx ? '#dc2626' : 'rgba(255,255,255,0.05)', color: i <= stepIdx ? '#fff' : '#4B5563' }}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <span className="text-xs font-semibold" style={{ color: i === stepIdx ? '#dc2626' : i < stepIdx ? '#22C55E' : '#4B5563' }}>{s}</span>
              </div>
              {i < 3 && <div className="flex-1 h-px" style={{ backgroundColor: i < stepIdx ? '#22C55E' : '#1F2937' }} />}
            </React.Fragment>
          )
        })}
      </div>

      <div className="p-6">
        {/* STEP 1: Who */}
        {step === 'who' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {TEAM.map(m => (
                <button key={m.name} onClick={() => togglePerson(m.name)}
                  className="flex items-center gap-3 rounded-xl p-3 text-left transition-all"
                  style={{ backgroundColor: selectedPeople.includes(m.name) ? 'rgba(220,38,38,0.15)' : '#111318', border: selectedPeople.includes(m.name) ? '1px solid rgba(220,38,38,0.5)' : '1px solid #1F2937' }}>
                  <span className="text-lg">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{m.name}</div>
                    <div className="text-[10px]" style={{ color: '#6B7280' }}>{m.role}</div>
                  </div>
                  {selectedPeople.includes(m.name) && <span style={{ color: '#dc2626' }}>✓</span>}
                </button>
              ))}
            </div>
            <div>
              <input value={customPerson} onChange={e => setCustomPerson(e.target.value)} placeholder="Someone else — type name..."
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} />
            </div>
            {allRecipients.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {allRecipients.map(n => (
                  <span key={n} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: 'rgba(220,38,38,0.2)', color: '#FCA5A5' }}>{n}</span>
                ))}
              </div>
            )}
            <button onClick={() => setStep('how')} disabled={allRecipients.length === 0}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
              style={{ backgroundColor: allRecipients.length > 0 ? '#dc2626' : '#374151' }}>
              Next — choose channels →
            </button>
          </div>
        )}

        {/* STEP 2: How */}
        {step === 'how' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {CHANNELS.map(ch => (
                <button key={ch.id} onClick={() => toggleChannel(ch.id)}
                  className="flex items-center gap-3 rounded-xl p-4 text-left transition-all"
                  style={{ backgroundColor: channels.includes(ch.id) ? 'rgba(220,38,38,0.15)' : '#111318', border: channels.includes(ch.id) ? '1px solid rgba(220,38,38,0.5)' : '1px solid #1F2937' }}>
                  <span className="text-2xl">{ch.icon}</span>
                  <span className="text-sm font-semibold text-white">{ch.label}</span>
                  {channels.includes(ch.id) && <span className="ml-auto" style={{ color: '#dc2626' }}>✓</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('who')} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Back</button>
              <button onClick={() => setStep('message')} disabled={channels.length === 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: channels.length > 0 ? '#dc2626' : '#374151' }}>
                Next — write message →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Message */}
        {step === 'message' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="text-xs" style={{ color: '#6B7280' }}>To:</span>
              {allRecipients.map(n => <span key={n} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(220,38,38,0.15)', color: '#FCA5A5' }}>{n}</span>)}
              <span className="text-xs" style={{ color: '#6B7280' }}>via</span>
              {channels.map(id => <span key={id} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{CHANNELS.find(c => c.id === id)?.label}</span>)}
            </div>
            <textarea value={messageText} onChange={e => setMessageText(e.target.value)} rows={5} placeholder="Type your message..."
              className="w-full px-4 py-3 rounded-xl text-sm text-white resize-none" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setStep('how')} className="py-2.5 px-4 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Back</button>
              <button onClick={() => handleSend(false)} disabled={!messageText.trim() || loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: messageText.trim() ? '#dc2626' : '#374151' }}>
                {loading ? '⏳ Drafting...' : 'Send →'}
              </button>
              <button onClick={() => handleSend(true)} disabled={!messageText.trim() || loading}
                className="py-2.5 px-4 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: messageText.trim() ? '#EF4444' : '#374151' }}>
                🚨 URGENT
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            {isUrgent && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <span>🚨</span>
                <span className="text-xs font-bold" style={{ color: '#EF4444' }}>URGENT — sending to ALL channels simultaneously</span>
              </div>
            )}
            <div className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB' }}>
              {aiDraft}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setStep('message'); setAiDraft('') }} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Edit</button>
              <button onClick={() => setStep('sent')}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: isUrgent ? '#EF4444' : '#dc2626' }}>
                ✓ Confirm Send
              </button>
            </div>
          </div>
        )}

        {/* SENT */}
        {step === 'sent' && (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">✅</div>
            <div className="text-base font-bold text-white mb-2">Message sent!</div>
            <div className="text-sm mb-4" style={{ color: '#6B7280' }}>
              Sent via {isUrgent ? 'all channels' : channels.map(id => CHANNELS.find(c => c.id === id)?.label).join(', ')} to {allRecipients.join(', ')}
            </div>
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Done</button>
          </div>
        )}
      </div>
    </>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── CAMP DASHBOARD VIEW ──────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function CampDashboardView({ fighter, session, onOpenModal }: { fighter: BoxingFighter; session: SportsDemoSession; onOpenModal?: (id: string) => void }) {
  const [dashTab, setDashTab] = useState<'gettingstarted'|'today'|'quickwins'|'dailytasks'|'insights'|'dontmiss'|'team'>(() => {
    try { const seen = typeof window !== 'undefined' ? localStorage.getItem('boxing_getting_started_seen') : null; return seen ? 'today' : 'gettingstarted' } catch { return 'gettingstarted' }
  })
  const [teamSub, setTeamSub] = useState<'today'|'org'|'info'|'record'>('today')
  // Getting Started checklist state — must be at component top level, not inside conditional
  const [gsChecked, setGsChecked] = useState<Record<string, boolean>>(() => {
    try { const s = typeof window !== 'undefined' ? localStorage.getItem('boxing_getting_started') : null; return s ? JSON.parse(s) : {} } catch { return {} }
  })
  const liveProfileName = useBoxingProfileName()
  const liveProfilePhoto = useBoxingProfilePhoto()
  const isPlayerRole = !session.role || session.role === 'fighter'
  const displayPlayerName = isPlayerRole
    ? (liveProfileName || session.userName || fighter.name)
    : fighter.name
  const displayPlayerNickname = isPlayerRole
    ? ((typeof window !== 'undefined' ? localStorage.getItem('lumio_boxing_nickname') : null) || '')
    : `"${fighter.nickname}"`
  const displayPlayerPhoto = isPlayerRole ? (liveProfilePhoto || session.photoDataUrl || '/marcus_reid.jpg') : null
  const firstName = displayPlayerName.split(' ')[0] || 'Marcus'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const aiSummaryLabel = hour < 12 ? 'AI Morning Summary' : hour < 17 ? 'AI Afternoon Summary' : 'AI Evening Summary'
  const recoveryScore = 81;
  const campProgress = Math.round((fighter.camp_day / fighter.camp_total) * 100);
  const [isSpeaking, setIsSpeaking] = useState(false)

  // TTS with async voice loading
  const getVoicesReady = (): Promise<SpeechSynthesisVoice[]> => new Promise((resolve) => {
    if (typeof window === 'undefined') { resolve([]); return }
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) { resolve(voices); return }
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices())
  })
  const voiceMap: Record<string, { pitch: number; rate: number }> = {
    'Sarah': { pitch: 1.05, rate: 0.92 },
    'Charlotte': { pitch: 1.1, rate: 0.9 },
    'George': { pitch: 0.9, rate: 0.95 },
  }
  const speakBriefing = async (text?: string) => {
    if (typeof window === 'undefined') return
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return }
    const voices = await getVoicesReady()
    const scheduleForBriefing = DEFAULT_TASKS.map(t => ({ id: t.id, time: t.time, label: t.task, highlight: !!t.highlight }))
    const script = text || generateSmartBriefing({
      now: new Date(),
      playerName: displayPlayerName || fighter.name,
      schedule: buildScheduleItems(scheduleForBriefing, tasksChecked, {}),
      match: null,
      roundupSummary: buildRoundupSummary(ROUNDUP_ITEMS),
      sport: 'boxing',
      timezone: getUserTimezone(),
      extra: `Fight camp day ${fighter.camp_day}. ${fighter.next_fight.days_away} days to fight night against ${fighter.next_fight.opponent}.`,
    })
    const u = new SpeechSynthesisUtterance(script)
    const savedVoiceName = localStorage.getItem('lumio_boxing_voice_name') || 'Sarah'
    const browserVoiceMap: Record<string, string[]> = {
      'Sarah': ['Google UK English Female', 'Microsoft Libby', 'Karen', 'Veena'],
      'Charlotte': ['Microsoft Hazel', 'Fiona', 'Samantha', 'Google UK English Female'],
      'George': ['Google UK English Male', 'Microsoft George', 'Daniel', 'Alex'],
    }
    const preferred = browserVoiceMap[savedVoiceName] || browserVoiceMap['Sarah']
    const match = voices.find(v => preferred.some(p => v.name.includes(p)))
      || voices.find(v => savedVoiceName === 'George'
        ? v.lang.startsWith('en') && v.name.toLowerCase().includes('male')
        : v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'))
    if (match) u.voice = match
    u.pitch = savedVoiceName === 'George' ? 0.75 : savedVoiceName === 'Charlotte' ? 1.25 : 1.1
    u.rate = savedVoiceName === 'George' ? 0.92 : 0.95
    u.onstart = () => setIsSpeaking(true); u.onend = () => setIsSpeaking(false); u.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(u)
  }
  useEffect(() => { return () => { if (typeof window !== 'undefined') window.speechSynthesis.cancel() } }, [])

  const [photoFit, setPhotoFit] = useState<'cover'|'contain'>(() => {
    try { return (typeof window !== 'undefined' && localStorage.getItem('lumio_boxing_photo_fit') as 'cover'|'contain') || 'cover' } catch { return 'cover' }
  })
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [photoSrc, setPhotoSrc] = useState<string | null>(null)

  // Morning Roundup state
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [roundupOrder, setRoundupOrder] = useState<string[]>(() => {
    try { const saved = typeof window !== 'undefined' ? localStorage.getItem('lumio_boxing_roundup_order') : null; return saved ? JSON.parse(saved) : [] } catch { return [] }
  })
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [repliedTo, setRepliedTo] = useState<string[]>([])
  const [replyToast, setReplyToast] = useState(false)

  // Getting Started step-tour state
  const [tourStep, setTourStep] = useState(0)

  // Today's Schedule live state
  const scheduleKey = `boxing_schedule_${fighter.slug}`
  const [scheduleChecked, setScheduleChecked] = useState<Record<string,boolean>>(() => {
    try { return JSON.parse((typeof window !== 'undefined' ? localStorage.getItem(scheduleKey) : null) || '{}') } catch { return {} }
  })
  const [scheduleCancelled, setScheduleCancelled] = useState<Record<string,boolean>>(() => {
    try { return JSON.parse((typeof window !== 'undefined' ? localStorage.getItem(scheduleKey + '_cancelled') : null) || '{}') } catch { return {} }
  })
  const toggleScheduleItem = (id: string) => {
    setScheduleChecked(prev => {
      const next = { ...prev, [id]: !prev[id] }
      try { localStorage.setItem(scheduleKey, JSON.stringify(next)) } catch {}
      return next
    })
  }
  const cancelScheduleItem = (id: string) => {
    setScheduleCancelled(prev => {
      const next = { ...prev, [id]: true }
      try { localStorage.setItem(scheduleKey + '_cancelled', JSON.stringify(next)) } catch {}
      return next
    })
  }

  // Daily Tasks live state (+ Add Task support)
  const tasksKey = `boxing_tasks_${fighter.slug}`
  type BoxingTask = { id: string; time: string; task: string; cat: string; priority: 'critical'|'high'|'medium'|'low'; highlight?: boolean; modal?: string; custom?: boolean }
  const DEFAULT_TASKS: BoxingTask[] = [
    { id:'t1', time:'07:00', task:'Morning weight log — daily camp requirement',     cat:'Weight',     priority:'high',     modal:'weight' },
    { id:'t2', time:'09:30', task:'Gym session — Jim Bevan',                         cat:'Training',   priority:'high' },
    { id:'t3', time:'09:00', task:'Right hand rewrap — tightness flagged yesterday', cat:'Medical',    priority:'critical', highlight:true, modal:'injury' },
    { id:'t4', time:'14:00', task:'DAZN interview prep — talking points',             cat:'Media',      priority:'medium',   modal:'socialmedia' },
    { id:'t5', time:'15:00', task:'Review Petrov southpaw footage — 2 hours',         cat:'Prep',       priority:'high',     modal:'matchprep' },
    { id:'t6', time:'EOD',   task:'Nutrition log — camp diet compliance',             cat:'Health',     priority:'medium' },
    { id:'t7', time:'16:00', task:'Danny Walsh call — purse split discussion',        cat:'Commercial', priority:'medium' },
  ]
  const [customTasks, setCustomTasks] = useState<BoxingTask[]>(() => {
    try { return JSON.parse((typeof window !== 'undefined' ? localStorage.getItem(tasksKey + '_custom') : null) || '[]') } catch { return [] }
  })
  const [tasksChecked, setTasksChecked] = useState<Record<string,boolean>>(() => {
    try { return JSON.parse((typeof window !== 'undefined' ? localStorage.getItem(tasksKey + '_checked') : null) || '{}') } catch { return {} }
  })
  const [newTaskText, setNewTaskText] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)
  const toggleTaskItem = (id: string) => {
    setTasksChecked(prev => {
      const next = { ...prev, [id]: !prev[id] }
      try { localStorage.setItem(tasksKey + '_checked', JSON.stringify(next)) } catch {}
      return next
    })
  }
  const addTask = () => {
    const text = newTaskText.trim()
    if (!text) return
    const t: BoxingTask = { id: `tc_${Date.now()}`, time: 'Today', task: text, cat: 'Custom', priority: 'medium', custom: true }
    setCustomTasks(prev => {
      const next = [...prev, t]
      try { localStorage.setItem(tasksKey + '_custom', JSON.stringify(next)) } catch {}
      return next
    })
    setNewTaskText('')
    setShowAddTask(false)
  }

  const ROUNDUP_ITEMS: { id: string; label: string; icon: string; count: number; urgent: boolean; color: string; messages: { id: string; from: string; text: string; time: string }[] }[] = [
    { id:'manager', label:'Manager', icon:'💼', count:2, urgent:true, color:'#dc2626', messages:[
      { id:'m1', from:'Danny Walsh', text:'Purse split negotiation update — Matchroom offering 70/30. Need your call at 16:00.', time:'8:14am' },
      { id:'m2', from:'Danny Walsh', text:'Under Armour camp deal — £85k for fight week branding. Worth taking?', time:'7:52am' },
    ]},
    { id:'promoter', label:'Promoter Desk', icon:'🏟️', count:1, urgent:true, color:'#F97316', messages:[
      { id:'p1', from:'Matchroom Boxing', text:'URGENT: Press conference moved to Thursday 2pm. Eddie needs 20min interview slot.', time:'9:01am' },
    ]},
    { id:'sponsor', label:'Media & Sponsor', icon:'🤝', count:2, urgent:false, color:'#F59E0B', messages:[
      { id:'s1', from:'DAZN', text:'Pre-fight documentary crew arriving Monday. 3 days filming access needed.', time:'8:30am' },
      { id:'s2', from:'Under Armour', text:'Camp training video — 2 posts outstanding from March obligation.', time:'Yesterday' },
    ]},
    { id:'medical', label:'Physio & Medical', icon:'🏥', count:1, urgent:true, color:'#EC4899', messages:[
      { id:'md1', from:'Dr Sarah Mitchell', text:'URGENT: Right hand X-ray needed — knuckle swelling flagged by Jim. Book today.', time:'9:15am' },
    ]},
    { id:'weight', label:'Weight Check', icon:'⚖️', count:1, urgent:false, color:'#22C55E', messages:[
      { id:'w1', from:'Weight Tracker', text:'Morning weigh-in: 97.8kg. Target: 92.7kg. On track — daily cut target: -0.11kg.', time:'7:00am' },
    ]},
    { id:'travel', label:'Travel & Camp', icon:'✈️', count:2, urgent:false, color:'#06B6D4', messages:[
      { id:'tr1', from:'Travel desk', text:'O2 Arena fight week hotel confirmed — Canary Wharf Marriott, 4 nights.', time:'8:00am' },
      { id:'tr2', from:'Travel desk', text:'Corner team flights booked — Jim, Tony, Ricky. BA LHR→LCY.', time:'Yesterday' },
    ]},
    { id:'fan', label:'Fan Mail', icon:'💌', count:4, urgent:false, color:'#8B5CF6', messages:[
      { id:'f1', from:'@BoxingFan92', text:'Marcus you\'re going to destroy Petrov! The Machine! 🥊', time:'Today' },
      { id:'f2', from:'@HeavyweightWatch', text:'Can you sign a glove for my son? He\'s your biggest fan.', time:'Yesterday' },
    ]},
  ]

  return (
    <div className="space-y-6">

      {/* ── PERSONAL BANNER — matching tennis pattern exactly ── */}
      <div className="relative rounded-2xl overflow-hidden mb-4 p-6"
        style={{ background: 'linear-gradient(135deg, #450a0a 0%, #0f172a 60%, #0c1321 100%)', border: '1px solid rgba(220,38,38,0.2)' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">{greeting}, {firstName} 🥊</h1>
              <button onClick={() => speakBriefing()} title={isSpeaking ? 'Stop reading' : 'Text-to-Speech'}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
                style={{ background: isSpeaking ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.08)', border: isSpeaking ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(255,255,255,0.12)', color: isSpeaking ? '#F97316' : '#9CA3AF' }}>
                <span className="text-sm">{isSpeaking ? '⏸' : '🔊'}</span>
              </button>
            </div>
            <p className="text-sm mb-2" style={{ color: '#9CA3AF' }}>
              {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </p>
            <p className="text-xs italic" style={{ color: '#facc15' }}>
              &ldquo;{getDailyQuote(BOXING_QUOTES).text}&rdquo; &mdash; {getDailyQuote(BOXING_QUOTES).author}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 ml-4">
            {[
              { icon:'🥊', value:`#${fighter.rankings.wbc}`, label:'WBC', color:'#dc2626' },
              { icon:'🏆', value:`#${fighter.rankings.ibf}`, label:'IBF', color:'#F97316' },
              { icon:'⚖️', value:`${fighter.current_weight}kg`, label:'Weight', color:'#0ea5e9' },
              { icon:'📅', value:`${fighter.next_fight.days_away}d`, label:'Fight', color:'#EF4444' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center px-3 py-2 rounded-xl border min-w-[70px] cursor-pointer transition-all hover:scale-105"
                style={{ backgroundColor: `${s.color}20`, borderColor: `${s.color}4d` }}>
                <span className="text-base">{s.icon}</span>
                <span className="text-lg font-black text-white">{s.value}</span>
                <span className="text-xs opacity-70">{s.label}</span>
              </div>
            ))}
            <div className="flex flex-col items-center px-3 py-2 rounded-xl border min-w-[70px]"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <span className="text-base">🌤️</span>
              <span className="text-lg font-black text-white">18°C</span>
              <span className="text-xs opacity-70">London</span>
            </div>
            <div className="flex flex-col justify-center px-3 h-[72px] rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minWidth: '120px' }}>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                {[{ city:'London', tz:'Europe/London', isUser:true },{ city:'New York', tz:'America/New_York', isUser:false },{ city:'Las Vegas', tz:'America/Los_Angeles', isUser:false },{ city:'Dubai', tz:'Asia/Dubai', isUser:false }].map(({ city, tz, isUser }) => (
                  <div key={city} className="flex items-center gap-1.5">
                    <span className="text-xs font-bold tabular-nums" style={{ color: isUser ? '#facc15' : '#e2e8f0' }}>{new Date().toLocaleTimeString('en-GB', { timeZone: tz, hour:'2-digit', minute:'2-digit' })}</span>
                    <span className="text-[10px]" style={{ color: isUser ? '#facc15' : '#6B7280' }}>{city}</span>
                  </div>
                ))}
              </div>
              <div className="text-[9px] mt-1" style={{ color: '#4B5563' }}>World Clock</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-gray-800" style={{ overflowX: 'hidden' }}>
        <button onClick={() => setDashTab('gettingstarted')}
          className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap"
          style={{ borderBottomColor: dashTab === 'gettingstarted' ? '#dc2626' : 'transparent', color: dashTab === 'gettingstarted' ? '#f87171' : '#6B7280', backgroundColor: dashTab === 'gettingstarted' ? '#dc26260d' : 'transparent' }}>
          <span className="text-base">🚀</span>Getting Started
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: '#dc2626' }}>10</span>
        </button>
        {([
          { id:'today' as const,      label:'Today',       icon:'🏠' },
          { id:'quickwins' as const,  label:'Quick Wins',  icon:'⚡' },
          { id:'dailytasks' as const, label:'Daily Tasks', icon:'✅' },
          { id:'insights' as const,   label:'Insights',    icon:'📊' },
          { id:'dontmiss' as const,   label:"Don't Miss",  icon:'🔴' },
          { id:'team' as const,       label:'Team',        icon:'👥' },
        ]).map(t => (
          <button key={t.id} onClick={() => setDashTab(t.id)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap"
            style={{ borderBottomColor: dashTab === t.id ? '#dc2626' : 'transparent', color: dashTab === t.id ? '#f87171' : '#6B7280', backgroundColor: dashTab === t.id ? '#dc26260d' : 'transparent' }}>
            <span className="text-base">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Quick Actions — below tab bar (Today only) */}
      {dashTab === 'today' && <div className="mb-5 mt-4">
        <div className="text-xs font-bold uppercase tracking-wider mb-2.5 px-1" style={{ color: '#4B5563' }}>Quick actions</div>
        <div className="flex flex-wrap gap-2">
          {[
            { id:'sendmessage', label:'Send Message', icon:'📨', hot:false },
            { id:'flights', label:'Smart Flights', icon:'✈️', color:'#0ea5e9', hot:true },
            { id:'hotel', label:'Find Hotel', icon:'🏨', color:'#0ea5e9', hot:true },
            { id:'matchprep', label:'Fight Prep AI', icon:'🧠', color:'#22C55E', hot:true },
            { id:'weight', label:'Weight Tracker', icon:'⚖️', color:'#F59E0B', hot:false },
            { id:'sparring', label:'Sparring Log', icon:'🥊', color:'#dc2626', hot:false },
            { id:'ranking', label:'Ranking Sim', icon:'📊', color:'#dc2626', hot:true },
            { id:'sponsor', label:'Sponsor Post', icon:'📱', color:'#F59E0B', hot:true },
            { id:'opponent', label:'Opponent Study', icon:'🔍', color:'#8B5CF6', hot:true },
            { id:'injury', label:'Medical Log', icon:'🏥', color:'#EF4444', hot:false },
            { id:'mental', label:'Mental Prep', icon:'🧘', color:'#8B5CF6', hot:true },
            { id:'expense', label:'Add Expense', icon:'💰', color:'#6B7280', hot:false },
            { id:'visa', label:'Visa Check', icon:'🌍', color:'#6B7280', hot:true },
            { id:'socialmedia', label:'Social Media AI', icon:'📲', color:'#8B5CF6', hot:true },
            { id:'weightcut', label:'Weight Cut AI', icon:'⚖️', color:'#F59E0B', hot:true },
            { id:'opponentscout', label:'Opponent Scout', icon:'🥊', color:'#8B5CF6', hot:true },
            { id:'vadacheck', label:'VADA/UKAD Check', icon:'💊', color:'#EF4444', hot:true },
            { id:'pursebreakdown', label:'Purse Breakdown', icon:'📋', color:'#22C55E', hot:false },
            { id:'rankingstracker', label:'Rankings Tracker', icon:'🏆', color:'#F59E0B', hot:true },
            { id:'campcontent', label:'Camp Content AI', icon:'🎬', color:'#8B5CF6', hot:true },
          ].map(a => (
            <button key={a.id} onClick={() => onOpenModal?.(a.id)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap shrink-0 relative"
              style={{ backgroundColor: '#DC2626', color: '#FFFFFF' }}>
              <span>{a.icon}</span>{a.label}
              {a.hot && <span className="absolute -top-1 -right-1 text-[8px] px-1 py-0.5 rounded-full font-black leading-none" style={{ backgroundColor: '#fff', color: '#DC2626' }}>AI</span>}
            </button>
          ))}
        </div>
      </div>}

      {/* GETTING STARTED */}
      {dashTab === 'gettingstarted' && (() => {
        const TOUR_STEPS = [
          { n:1, label:'Your boxing OS, fully connected', icon:'🥊', preview:'dashboard' },
          { n:2, label:'Start every fight week knowing everything', icon:'🌅', preview:'briefing' },
          { n:3, label:'Every action, one click away', icon:'⚡', preview:'actions' },
          { n:4, label:'Fight travel sorted in 60 seconds', icon:'✈️', preview:'travel' },
          { n:5, label:'Weight camp managed to the gram', icon:'⚖️', preview:'weight' },
          { n:6, label:'Your team, always in the loop', icon:'👥', preview:'team' },
          { n:7, label:'AI that analyses your opponent', icon:'🤖', preview:'ai' },
          { n:8, label:'Sponsors managed automatically', icon:'🤝', preview:'sponsor' },
          { n:9, label:'Nothing falls through the cracks', icon:'🔔', preview:'dontmiss' },
          { n:10, label:'Run your boxing career like a business', icon:'🏆', preview:'cta' },
        ]
        const step = TOUR_STEPS[tourStep]
        const goLive = () => { try { localStorage.setItem('boxing_getting_started_seen', 'true') } catch {} setDashTab('today') }
        return (
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 mr-4">
                <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#dc2626' }}>STEP {tourStep + 1} OF {TOUR_STEPS.length}</div>
                <div className="w-full bg-gray-800 rounded-full h-1"><div className="h-1 rounded-full transition-all duration-500" style={{ width: `${((tourStep + 1) / TOUR_STEPS.length) * 100}%`, backgroundColor: '#dc2626' }} /></div>
              </div>
              <button onClick={goLive} className="text-sm flex-shrink-0" style={{ color: '#4B5563' }}>Skip tour →</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                {TOUR_STEPS.map((s, i) => (
                  <button key={s.n} onClick={() => setTourStep(i)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{ backgroundColor: tourStep === i ? 'rgba(220,38,38,0.1)' : 'transparent', border: tourStep === i ? '1px solid rgba(220,38,38,0.3)' : '1px solid transparent' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: i < tourStep ? '#22C55E' : tourStep === i ? '#dc2626' : 'rgba(255,255,255,0.05)', color: i <= tourStep ? '#fff' : '#4B5563' }}>
                      {i < tourStep ? '✓' : s.n}
                    </div>
                    <span className="text-sm" style={{ color: tourStep === i ? '#F9FAFB' : '#6B7280' }}>{s.label}</span>
                  </button>
                ))}
              </div>
              <div className="lg:col-span-2">
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minHeight: 420 }}>
                  <div className="p-6">
                    <div className="text-4xl mb-3">{step.icon}</div>
                    {step.preview === 'dashboard' && (<><h2 className="text-xl font-black text-white mb-2">Your boxing OS, fully connected.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>One portal replaces the 6 tools you probably use right now. Rankings, fight camp, weight tracking, sponsors, travel, your team — all connected.</p><div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}><div className="text-xs text-gray-400 mb-3">Your dashboard — live right now</div><div className="grid grid-cols-4 gap-2">{[{ icon:'🥊', v:`#${fighter.rankings.wbc}`, label:'WBC', c:'#dc2626' },{ icon:'🏆', v:`${fighter.record.wins}-${fighter.record.losses}`, label:'Record', c:'#F97316' },{ icon:'⚖️', v:`${fighter.current_weight}kg`, label:'Weight', c:'#F59E0B' },{ icon:'📅', v:`${fighter.next_fight.days_away}d`, label:'Fight', c:'#22C55E' }].map((s, i) => (<div key={i} className="rounded-lg p-2 text-center" style={{ backgroundColor: '#0a0c14' }}><div className="text-lg">{s.icon}</div><div className="text-xs font-black mt-0.5" style={{ color: s.c }}>{s.v}</div><div className="text-[9px] mt-0.5" style={{ color: '#4B5563' }}>{s.label}</div></div>))}</div><div className="mt-3 grid grid-cols-2 gap-2 text-[10px]"><div className="rounded-lg p-2" style={{ backgroundColor: '#0a0c14' }}><span className="text-gray-500">Next fight:</span> <span className="text-white font-semibold">vs {fighter.next_fight.opponent} — {fighter.next_fight.venue}</span></div><div className="rounded-lg p-2" style={{ backgroundColor: '#0a0c14' }}><span className="text-gray-500">Camp day:</span> <span className="text-white font-semibold">Day {fighter.camp_day}/70 — On track</span></div></div></div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}><span style={{ color: '#dc2626' }}>🥊</span> <span style={{ color: '#9CA3AF' }}>Used by professional fighters to manage everything from training camp to fight night.</span></div></>)}
                    {step.preview === 'briefing' && (<><h2 className="text-xl font-black text-white mb-2">Start every fight week knowing everything.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Your AI morning briefing covers weight status, camp progress, opponent intel, sponsor deadlines and travel — all in 60 seconds.</p><div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid rgba(220,38,38,0.2)' }}><div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid #1F2937', background: 'rgba(220,38,38,0.06)' }}><span>✨</span><span className="text-sm font-semibold text-white">{aiSummaryLabel}</span><span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(220,38,38,0.12)', color: '#dc2626' }}>Today</span></div><div className="p-4 space-y-2.5" style={{ backgroundColor: '#0a0c14' }}>{[{ icon:'⚖️', text:`Weight on track — ${fighter.current_weight}kg → ${fighter.target_weight}kg target. Cut projection: 3 days before weigh-in.` },{ icon:'🥊', text:'Petrov scouting report ready — body shot breakdown and late-round fade analysis.' },{ icon:'🤝', text:'Under Armour camp shoot tomorrow 10:00 — penalty clause. Kit prepped.' },{ icon:'📬', text:'DAZN promotion confirmed. Danny Walsh purse split: 70/30 Matchroom offer.' }].map((item, i) => (<div key={i} className="flex gap-2.5 text-[11px]"><span className="flex-shrink-0">{item.icon}</span><span style={{ color: '#D1D5DB' }}>{item.text}</span></div>))}</div></div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}><span>🔊</span> <span style={{ color: '#9CA3AF' }}>Press the speaker button every morning. Sarah reads it while you warm up.</span></div></>)}
                    {step.preview === 'actions' && (<><h2 className="text-xl font-black text-white mb-2">Every action, one click away.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>14 quick actions — log a sparring session, track weight, file a physio report, generate a sponsor post, check your visa. All in under 60 seconds.</p><div className="flex flex-wrap gap-2 mb-4">{[{ label:'Smart Flights', icon:'✈️', hot:true },{ label:'Find Hotel', icon:'🏨', hot:true },{ label:'Fight Prep AI', icon:'🥊', hot:true },{ label:'Weight Tracker', icon:'⚖️', hot:false },{ label:'Sparring Log', icon:'📋', hot:false },{ label:'Opponent Study', icon:'🔍', hot:true }].map((a, i) => (<span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold relative" style={{ backgroundColor: a.hot ? '#dc2626' : '#1F2937', color: a.hot ? '#fff' : '#9CA3AF' }}><span>{a.icon}</span>{a.label}{a.hot && <span className="absolute -top-1 -right-1 text-[7px] px-1 py-0.5 rounded-full font-black" style={{ backgroundColor: '#fff', color: '#dc2626' }}>AI</span>}</span>))}</div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)' }}><span>🥊</span> <span style={{ color: '#0ea5e9' }}>Fight Prep AI generates a full opponent breakdown — punch stats, weaknesses, game plan — in 8 seconds.</span></div></>)}
                    {step.preview === 'travel' && (<><h2 className="text-xl font-black text-white mb-2">Fight travel sorted in 60 seconds.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Smart Flights finds the cheapest flights to every fight venue. Smart Hotel finds gyms and hotels near the arena. Pre-filled with your home airport and weight class preferences.</p><div className="space-y-2 mb-4"><div className="rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid rgba(14,165,233,0.3)' }}><div className="flex items-center justify-between mb-1"><span className="text-xs font-bold text-white">Virgin Atlantic · VS 3</span><span className="text-xs font-black" style={{ color: '#22C55E' }}>£387 return</span></div><div className="text-[10px] text-gray-400">London LHR → New York JFK · 7h 20m · Direct</div><div className="mt-1"><span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(14,165,233,0.15)', color: '#0ea5e9' }}>BEST VALUE</span></div></div><div className="rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}><div className="flex items-center justify-between mb-1"><span className="text-xs font-bold text-white">🏨 Manhattan Marriott</span><span className="text-xs font-bold" style={{ color: '#F59E0B' }}>£142/night</span></div><div className="text-[10px] text-gray-400">0.8km from Madison Square Garden · Gym ✅ · 8.6 rating</div></div></div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}><span style={{ color: '#F59E0B' }}>💰</span> <span style={{ color: '#F59E0B' }}>Fighters using Smart Flights save an average of £520 per fight on travel vs booking through a promoter.</span></div></>)}
                    {step.preview === 'weight' && (<><h2 className="text-xl font-black text-white mb-2">Weight camp managed to the gram.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Daily weight logs, cut timeline, ACWR load monitoring, rehydration plan — all tracked automatically. Get alerted if you&apos;re behind schedule before it becomes a crisis.</p><div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#0a0c14', border: '1px solid rgba(220,38,38,0.3)' }}><div className="flex items-center justify-between mb-3"><span className="text-xs font-bold text-white">Weight Camp Tracker</span><span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>ON TRACK ✅</span></div><div className="grid grid-cols-3 gap-2 text-center mb-3">{[{ label:'Camp Day', v:`${fighter.camp_day}/70`, c:'#dc2626' },{ label:'Current', v:`${fighter.current_weight}kg`, c:'#F97316' },{ label:'Target', v:`${fighter.target_weight}kg`, c:'#22C55E' }].map((s,i) => (<div key={i} className="rounded-lg p-2" style={{ backgroundColor: '#111318' }}><div className="text-[10px] text-gray-500">{s.label}</div><div className="text-sm font-black" style={{ color: s.c }}>{s.v}</div></div>))}</div><div className="space-y-1 text-[10px]"><div className="flex justify-between text-gray-400"><span>Cut prediction:</span><span className="text-white font-semibold">3 days before weigh-in</span></div><div className="flex justify-between text-gray-400"><span>ACWR:</span><span className="text-green-400 font-semibold">1.12 (optimal zone)</span></div></div></div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}><span style={{ color: '#dc2626' }}>⚖️</span> <span style={{ color: '#dc2626' }}>Missing weight costs purse deductions and can cancel fights. Lumio flags weight risk 14 days out.</span></div></>)}
                    {step.preview === 'team' && (<><h2 className="text-xl font-black text-white mb-2">Your team. Always in the loop.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Trainer, manager, cutman, physio, nutritionist, promoter — all connected. Message your whole team in one tap.</p><div className="space-y-2 mb-4">{[{ name:fighter.trainer || 'Jim Bevan', role:'Trainer', status:'Sparring review at 16:00', color:'#dc2626' },{ name:fighter.manager || 'Danny Walsh', role:'Manager', status:'DAZN contract confirmed', color:'#F97316' },{ name:fighter.physio || 'Dr Amir Patel', role:'Physio', status:'Shoulder check tomorrow', color:'#F59E0B' },{ name:'James Wright', role:'Agent', status:'Under Armour deal — £85k', color:'#0ea5e9' }].map((m, i) => (<div key={i} className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}><div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: `${m.color}20`, color: m.color }}>{m.name.split(' ').map(w => w[0]).join('')}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-xs font-bold text-white">{m.name}</span><span className="text-[9px]" style={{ color: m.color }}>{m.role}</span></div><div className="text-[10px] text-gray-500">{m.status}</div></div><div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" /></div>))}</div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}><span>📨</span> <span style={{ color: '#9CA3AF' }}>Your manager gets auto-briefed every Monday. Promoter updates go out after each camp milestone.</span></div></>)}
                    {step.preview === 'ai' && (<><h2 className="text-xl font-black text-white mb-2">AI that analyses your opponent so you don&apos;t have to.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Opponent Study AI breaks down punch stats, jab frequency, weakness on the body, late-round fade. Fight Prep AI builds your game plan.</p><div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#0a0c14', border: '1px solid rgba(139,92,246,0.3)' }}><div className="flex items-center gap-2 mb-2"><span>🤖</span><span className="text-xs font-bold" style={{ color: '#A78BFA' }}>Opponent Study AI — {fighter.next_fight.opponent}</span></div><div className="space-y-2 text-[11px]" style={{ color: '#D1D5DB' }}><p>{fighter.next_fight.opponent} (WBC #3): Jab output 42/round — highest in the division. Body shots: 23% of total punches.</p><p>Right hand on the counter is his KO weapon. He fades rounds 8-10 — output drops 34%.</p><p>Strategy: work body early, avoid the right counter, look for late stoppage rounds 9-10.</p></div><div className="text-[9px] mt-3" style={{ color: '#6B7280' }}>Generated using live fight record data · Claude AI</div></div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}><span style={{ color: '#A78BFA' }}>🤖</span> <span style={{ color: '#A78BFA' }}>Powered by Claude AI · Anthropic · The same AI trusted by Fortune 500 companies.</span></div></>)}
                    {step.preview === 'sponsor' && (<><h2 className="text-xl font-black text-white mb-2">Never miss a sponsor obligation again.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Content shoots, social posts, appearance fees, contract renewals — all tracked. Social Media AI writes the post, you approve it, one click posts it.</p><div className="space-y-2 mb-4">{[{ name:'Under Armour', status:'Kit shoot Tuesday 10:00', badge:'DUE NOW', badgeColor:'#EF4444', value:'£85k/yr' },{ name:'DAZN', status:'Post-fight interview confirmed', badge:'CONFIRMED', badgeColor:'#22C55E', value:'PPV deal' },{ name:'Paddy Power', status:'Ambassador inquiry — respond by Apr 25', badge:'NEW DEAL', badgeColor:'#22C55E', value:'£85k/yr' }].map((s, i) => (<div key={i} className="flex items-center justify-between rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-xs font-bold text-white">{s.name}</span><span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${s.badgeColor}20`, color: s.badgeColor }}>{s.badge}</span></div><div className="text-[10px] text-gray-500 mt-0.5">{s.status}</div></div><span className="text-xs font-bold" style={{ color: '#F59E0B' }}>{s.value}</span></div>))}</div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}><span>📱</span> <span style={{ color: '#9CA3AF' }}>Sponsor Post AI generates the caption in your voice. Takes 8 seconds.</span></div></>)}
                    {step.preview === 'dontmiss' && (<><h2 className="text-xl font-black text-white mb-2">Nothing falls through the cracks.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Don&apos;t Miss catches everything urgent — purse deadlines, visa expiry, medical licence renewal, sanctioning body requirements, weight check alerts.</p><div className="space-y-2 mb-4">{[{ badge:'IN 48 DAYS', bg:'rgba(220,38,38,0.15)', color:'#EF4444', text:`Fight vs ${fighter.next_fight.opponent} — ${fighter.next_fight.venue}. DAZN PPV.`, sub:`Miss = lose £340k purse + WBC ranking` },{ badge:'34 DAYS', bg:'rgba(245,158,11,0.15)', color:'#F59E0B', text:'Medical licence expires. Renewal takes 10 working days.', sub:'Fight cannot proceed without valid BBBofC licence' },{ badge:'THIS WK', bg:'rgba(245,158,11,0.15)', color:'#F59E0B', text:'Under Armour camp shoot — penalty clause applies.', sub:'Content obligation breach risk' }].map((d, i) => (<div key={i} className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: '#0a0c14' }}><span className="text-[9px] px-2 py-1 rounded font-black flex-shrink-0 mt-0.5" style={{ background: d.bg, color: d.color }}>{d.badge}</span><div><div className="text-[11px] text-white">{d.text}</div><div className="text-[10px] italic mt-0.5" style={{ color: '#EF4444' }}>{d.sub}</div></div></div>))}</div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}><span>⚕️</span> <span style={{ color: '#9CA3AF' }}>Medical licence expires in 34 days. Renewal takes 10 working days — Lumio flagged this 60 days out.</span></div></>)}
                    {step.preview === 'cta' && (<><h2 className="text-xl font-black text-white mb-2">Run your boxing career like a business.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Rankings, fight camp, weight, sponsors, travel, AI analysis — all in one place. Built for professional fighters.</p><div className="grid grid-cols-3 gap-2 mb-4">{[{ icon:'🥊', label:'Rankings', desc:'WBC/WBA/WBO/IBF' },{ icon:'✈️', label:'Smart Travel', desc:'Flights + hotels' },{ icon:'🤖', label:'AI Analysis', desc:'Opponent study' },{ icon:'🤝', label:'Sponsors', desc:'Obligations tracked' },{ icon:'👥', label:'Team Hub', desc:'Everyone connected' },{ icon:'⚖️', label:'Weight Camp', desc:'Cut management' }].map((f, i) => (<div key={i} className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}><div className="text-xl mb-1">{f.icon}</div><div className="text-[10px] font-bold text-white">{f.label}</div><div className="text-[9px] text-gray-500">{f.desc}</div></div>))}</div><div className="rounded-xl p-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(220,38,38,0.25)' }}><div className="text-sm font-bold text-white mb-1">3-month free trial — no card required</div><div className="text-[11px] mb-3" style={{ color: '#9CA3AF' }}>Connect your real data in under 10 minutes. Cancel anytime.</div><div className="flex justify-center gap-2"><button onClick={goLive} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Go to my dashboard →</button><button className="px-4 py-2 rounded-xl text-xs font-bold" style={{ border: '1px solid #374151', color: '#9CA3AF' }}>Invite my team →</button></div></div><div className="rounded-lg p-3 mt-4 text-[11px]" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}><span style={{ color: '#F59E0B' }}>🏆</span> <span style={{ color: '#F59E0B' }}>You&apos;re one of our first 20 founding members. We&apos;ll build what you ask for.</span></div></>)}
                  </div>
                  <div className="flex items-center justify-between px-6 pb-6 pt-2" style={{ borderTop: '1px solid #1F2937' }}>
                    <button onClick={() => setTourStep(Math.max(0, tourStep - 1))} disabled={tourStep === 0} className="px-4 py-2 rounded-xl text-sm" style={{ backgroundColor: tourStep === 0 ? 'transparent' : '#1F2937', color: tourStep === 0 ? '#374151' : '#9CA3AF' }}>← Back</button>
                    <span className="text-xs" style={{ color: '#4B5563' }}>{tourStep + 1} / {TOUR_STEPS.length}</span>
                    {tourStep < TOUR_STEPS.length - 1 ? (
                      <button onClick={() => setTourStep(tourStep + 1)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Next →</button>
                    ) : (
                      <button onClick={goLive} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#22C55E' }}>Let&apos;s go 🥊</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* TODAY */}
      {dashTab === 'today' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Morning Roundup — expandable like tennis */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
              <div className="flex items-center gap-2"><span>🌅</span><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Morning Roundup</p></div>
              <span className="text-xs" style={{ color: '#6B7280' }}>Since you were last here</span>
            </div>
            <div>
              {(roundupOrder.length > 0 ? [...ROUNDUP_ITEMS].sort((a, b) => { const ai = roundupOrder.indexOf(a.id); const bi = roundupOrder.indexOf(b.id); return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) }) : ROUNDUP_ITEMS).map((ch, idx) => {
                const isOpen = expandedChannel === ch.id
                return (
                  <div key={ch.id} draggable
                    onDragStart={() => setDragIdx(idx)}
                    onDragEnter={() => setDragOverIdx(idx)}
                    onDragOver={e => e.preventDefault()}
                    onDragEnd={() => {
                      if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
                        const currentSorted = roundupOrder.length > 0 ? [...ROUNDUP_ITEMS].sort((a, b) => { const ai = roundupOrder.indexOf(a.id); const bi = roundupOrder.indexOf(b.id); return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) }) : [...ROUNDUP_ITEMS]
                        const reordered = [...currentSorted]; const [moved] = reordered.splice(dragIdx, 1); reordered.splice(dragOverIdx, 0, moved)
                        const newOrder = reordered.map(c => c.id); setRoundupOrder(newOrder); localStorage.setItem('lumio_boxing_roundup_order', JSON.stringify(newOrder))
                      }
                      setDragIdx(null); setDragOverIdx(null)
                    }}
                    style={{ borderLeft: `4px solid ${ch.color}`, backgroundColor: `${ch.color}22`, borderRadius: '8px', marginBottom: '6px', borderTop: dragOverIdx === idx ? '2px solid #0ea5e9' : 'none', opacity: dragIdx === idx ? 0.5 : 1, cursor: 'grab' }}>
                    <button onClick={() => setExpandedChannel(isOpen ? null : ch.id)}
                      className="w-full flex items-center justify-between px-5 py-3 text-left transition-all hover:bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <span className="text-base" style={{ filter: `drop-shadow(0 0 4px ${ch.color})` }}>{ch.icon}</span>
                        <span style={{ color: ch.color, fontWeight: 600, fontSize: '15px' }}>{ch.label}</span>
                        {ch.urgent && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>Urgent</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ color: ch.color, fontWeight: 700 }}>{ch.count}</span>
                        <span className="text-xs" style={{ color: '#6B7280' }}>{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-3 space-y-2">
                        {ch.messages.map(msg => (
                          <div key={msg.id} className="rounded-lg p-3" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: ch.color + '22', color: ch.color }}>{msg.from.split(' ').map(w => w[0]).join('').slice(0,2)}</div>
                                <span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{msg.from}</span>
                              </div>
                              <span className="text-[10px] flex-shrink-0" style={{ color: '#6B7280' }}>{msg.time}</span>
                            </div>
                            <p className="text-xs leading-relaxed mb-2" style={{ color: '#9CA3AF' }}>{msg.text}</p>
                            {repliedTo.includes(msg.id) ? (
                              <span className="text-[10px]" style={{ color: '#dc2626' }}>Replied ✓</span>
                            ) : replyingTo === msg.id ? (
                              <div className="mt-2">
                                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write your reply..." rows={2}
                                  className="w-full text-xs rounded-lg p-2 resize-none" style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB', outline: 'none' }} />
                                <div className="flex gap-2 mt-1.5">
                                  <button onClick={() => { setRepliedTo(prev => [...prev, msg.id]); setReplyingTo(null); setReplyText(''); setReplyToast(true); setTimeout(() => setReplyToast(false), 2000) }}
                                    className="text-[10px] px-3 py-1 rounded-lg font-semibold" style={{ backgroundColor: '#dc2626', color: '#fff' }}>Send</button>
                                  <button onClick={() => { setReplyingTo(null); setReplyText('') }}
                                    className="text-[10px] px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF' }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button onClick={() => setReplyingTo(msg.id)} className="text-[10px] px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(220,38,38,0.15)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.3)' }}>Reply</button>
                                <button className="text-[10px] px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.1)' }}>Forward</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {replyToast && <div className="px-5 py-2 text-[10px] font-medium" style={{ color: '#22C55E' }}>Reply sent ✓</div>}
          </div>

          {/* MIDDLE: Fight Camp Status + schedule */}
          <div className="space-y-4">
            <div className="bg-[#0d1117] border border-red-600/30 rounded-2xl p-5">
              <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-3">FIGHT CAMP STATUS</div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-600/40 flex items-center justify-center text-sm font-bold text-white mx-auto mb-1 overflow-hidden">
                    {session.photoDataUrl ? <img src={session.photoDataUrl} alt="" className="w-full h-full object-cover" /> : firstName.slice(0,2).toUpperCase()}
                  </div>
                  <div className="text-xs font-bold text-white">{session.userName || fighter.name}</div>
                  <div className="text-[10px] text-red-400">WBC #{fighter.rankings.wbc}</div>
                </div>
                <div className="text-center px-4">
                  <div className="text-2xl font-black text-gray-600">VS</div>
                  <div className="text-[10px] text-gray-500 mt-1">{fighter.next_fight.days_away} days · {fighter.next_fight.venue.split(',')[1]?.trim() || fighter.next_fight.venue}</div>
                  <div className="text-[10px] text-green-400 mt-0.5">ACWR: 1.12 (optimal)</div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-white mx-auto mb-1">{fighter.next_fight.opponent_flag}</div>
                  <div className="text-xs font-bold text-white">{fighter.next_fight.opponent}</div>
                  <div className="text-[10px] text-gray-500">{fighter.next_fight.opponent_ranking}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-2 gap-2 text-[10px]">
                <div className="text-gray-400">Weight: <span className="text-white font-bold">{fighter.current_weight}kg</span> → <span className="text-teal-400">{fighter.target_weight}kg</span></div>
                <div className="text-gray-400 text-right">Camp: <span className="text-white font-bold">Day {fighter.camp_day}/{fighter.camp_total}</span> ({campProgress}%)</div>
              </div>
            </div>
            <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-5">
              <div className="text-sm font-bold text-white mb-3">Today&apos;s Schedule</div>
              <div className="space-y-2">
                {[
                  { id:'bs1', time:'06:00', label:'Roadwork — 8km + hill sprints',         highlight:false },
                  { id:'bs2', time:'11:00', label:'Sparring 8rds — Darnell Hughes',        highlight:true  },
                  { id:'bs3', time:'15:00', label:'Strength — upper body power',           highlight:false },
                  { id:'bs4', time:'16:30', label:'Film study — Petrov last 3 fights',     highlight:false },
                  { id:'bs5', time:'18:00', label:'Physio — shoulder mobility + ice bath', highlight:false },
                ].filter(s => !scheduleCancelled[s.id]).map((s) => {
                  const done = !!scheduleChecked[s.id]
                  return (
                    <div key={s.id} className={`group flex items-center gap-3 py-1.5 border-b border-gray-800/40 last:border-0 ${done ? 'opacity-50' : ''}`}>
                      <button onClick={() => toggleScheduleItem(s.id)}
                        className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ backgroundColor: done ? '#22C55E' : 'transparent', borderColor: done ? '#22C55E' : s.highlight ? '#EF4444' : '#4B5563' }}>
                        {done && <span className="text-white text-[8px]">✓</span>}
                      </button>
                      <span className="text-[10px] text-gray-500 w-10 flex-shrink-0">{s.time}</span>
                      <span className={`text-xs flex-1 ${done ? 'line-through text-gray-600' : s.highlight ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>{s.label}</span>
                      {!done && (
                        <button onClick={() => cancelScheduleItem(s.id)}
                          className="text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 flex-shrink-0">
                          Cancel →
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            {/* Tonight's Venue */}
            <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tonight&apos;s Venue</div>
              <div className="text-sm font-bold text-white">{fighter.next_fight.venue}</div>
              <div className="text-xs text-gray-500 mt-1">16°C · Clear · Doors open 18:00</div>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between text-gray-400"><span>Walk-on:</span><span className="text-white">22:00</span></div>
                <div className="flex justify-between text-gray-400"><span>Prize (W):</span><span className="text-green-400 font-bold">£1.2M</span></div>
                <div className="flex justify-between text-gray-400"><span>Prize (L):</span><span className="text-gray-300">£360,000</span></div>
                <div className="flex justify-between text-gray-400"><span>TV:</span><span className="text-white">{fighter.next_fight.broadcast}</span></div>
              </div>
            </div>
          </div>

          {/* RIGHT: Photo frame + AI Morning Summary + Performance Intelligence */}
          <div className="space-y-4">
            <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white">🖼️ Personal Photo Frame</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => { const next = photoFit === 'cover' ? 'contain' : 'cover'; setPhotoFit(next); localStorage.setItem('lumio_boxing_photo_fit', next) }} className="text-[10px] text-gray-600 hover:text-gray-400">{photoFit === 'cover' ? '⊡ Fit' : '⊞ Fill'}</button>
                  {photoSrc && <button onClick={() => setPhotoSrc(null)} className="text-[10px] text-gray-600 hover:text-gray-400">✕ Remove</button>}
                  <button onClick={() => photoInputRef.current?.click()} className="text-[10px] text-red-400 hover:text-red-300">+ Add</button>
                  <input ref={photoInputRef} key={photoSrc ? 'has' : 'no'} type="file" accept="image/*" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]; if (!file) return
                    const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 400
                    const ctx = canvas.getContext('2d')!; const img = new Image()
                    img.onload = () => { const size = Math.min(img.width, img.height); ctx.drawImage(img, (img.width-size)/2, (img.height-size)/2, size, size, 0, 0, 400, 400); const dataUrl = canvas.toDataURL('image/jpeg', 0.7); setPhotoSrc(dataUrl) }
                    img.src = URL.createObjectURL(file)
                  }} />
                </div>
              </div>
              <div className="rounded-xl overflow-hidden bg-gradient-to-br from-red-900/20 to-gray-900 h-48 flex items-center justify-center">
                {photoSrc
                  ? <img src={photoSrc} alt="" className={`w-full h-full object-${photoFit}`} />
                  : <div className="text-center"><div className="text-4xl mb-2">🖼️</div><div className="text-xs text-gray-600">Family · Holidays · Inspiration</div></div>}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {['3s','5s','10s','30s'].map(s => (
                  <button key={s} className={`text-[10px] px-2 py-0.5 rounded ${s==='5s'?'bg-red-600/20 text-red-400':'text-gray-600 hover:text-gray-400'}`}>{s}</button>
                ))}
              </div>
            </div>

            {/* AI Morning Summary — matches tennis */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
                <div className="flex items-center gap-2">
                  <span style={{ color: '#8B5CF6' }}>✨</span>
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{aiSummaryLabel}</p>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(220,38,38,0.12)', color: '#dc2626' }}>
                  {new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}
                </span>
              </div>
              <div className="px-5 py-4 space-y-3">
                {[
                  { type:'fight',    icon:'🥊', text:`Fight ${fighter.next_fight.days_away} days away — ${fighter.next_fight.opponent} (${fighter.next_fight.opponent_ranking}) at ${fighter.next_fight.venue}. Camp day ${fighter.camp_day}/${fighter.camp_total}. On track for power peak.` },
                  { type:'weight',   icon:'⚖️', text:`Weight ${fighter.current_weight}kg → ${fighter.target_weight}kg target. Daily cut: ${((fighter.current_weight - fighter.target_weight) / fighter.next_fight.days_away).toFixed(2)}kg/day. Log today before 09:00.` },
                  { type:'camp',     icon:'🏕️', text:'Sparring 8 rds vs Darnell Hughes at 11:00 — southpaw rounds to prep for Petrov. Jim Bevan flagged right hand rewrap — book Dr Mitchell 09:00.' },
                  { type:'sponsor',  icon:'🤝', text:'DAZN interview prep today — talking points needed by 14:00. Under Armour camp video content outstanding from March obligation.' },
                  { type:'travel',   icon:'✈️', text:'O2 Arena fight week hotel confirmed — Canary Wharf Marriott, 4 nights. Corner team flights (Jim, Tony, Ricky) booked BA LHR→LCY.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    <span style={{ color: '#D1D5DB' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Intelligence — matches tennis */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
                <div className="flex items-center gap-2">
                  <span>⚡</span>
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Performance Intelligence</p>
                </div>
                <span className="text-[10px] font-medium" style={{ color: '#dc2626' }}>Performance</span>
              </div>
              <div className="px-5 py-4 space-y-2.5">
                {[
                  { n:1, trend:'↑', color:'#22C55E', text:'Sparring power output up 8% — last 5 sessions vs season avg. Right hand velocity and body shot compression both trending up. Keep the current pad routine.' },
                  { n:2, trend:'⚠', color:'#EF4444', text:`${(fighter.current_weight - fighter.target_weight).toFixed(1)}kg left to cut in ${fighter.next_fight.days_away} days — on track but one missed daily log risks a rapid fight week cut.` },
                  { n:3, trend:'↑', color:'#22C55E', text:'ACWR 1.12 — optimal zone. Load ramping correctly. Jim flagged sharpness on pads this week as "best camp yet".' },
                  { n:4, trend:'→', color:'#dc2626', text:`WBC #${fighter.rankings.wbc} / IBF #${fighter.rankings.ibf} — win tonight and the mandatory shot opens up next quarter. First top-10 WBC fight — media interest is high.` },
                  { n:5, trend:'↓', color:'#F59E0B', text:'Round 9-12 work rate dipped 4% vs earlier camps — conditioning focus this week. Ricky Dunn adding 2nd interval block on Thursday.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <div className="flex items-center gap-1 flex-shrink-0 w-8">
                      <span className="font-bold" style={{ color: '#dc2626' }}>{item.n}</span>
                      <span className="text-[10px] font-bold" style={{ color: item.color }}>{item.trend}</span>
                    </div>
                    <span style={{ color: '#D1D5DB' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK WINS */}
      {dashTab === 'quickwins' && (
        <div className="pt-4 space-y-3">
          {[
            { p:1, title:'Log today\'s weight — behind daily target by 0.08kg',            impact:'Critical', cat:'Weight',     icon:'⚖️', cta:'Log weight', effort:'2min', description:'Camp requirement — daily weight tracking keeps cut on schedule.' },
            { p:2, title:'DAZN pre-fight interview — confirm attendance',                   impact:'Critical', cat:'Media',      icon:'📺', cta:'Confirm', effort:'2min', description:'Press tour begins today. Contractual obligation — confirm now.' },
            { p:3, title:'Sparring session vs southpaw booked — 10:00',                     impact:'High',     cat:'Camp',       icon:'🥊', cta:'Log sparring', effort:'5min', description:'Southpaw rounds to prepare for Petrov\'s stance. Jim Bevan supervising.' },
            { p:4, title:'Petrov\'s last 3 fights uploaded — review footage',                impact:'High',     cat:'Prep',       icon:'🎬', cta:'Open scout', effort:'15min', description:'3 recent fights available — study patterns and defensive tendencies.' },
            { p:5, title:'Matchroom contract addendum — sign by Friday',                     impact:'High',     cat:'Commercial', icon:'📋', cta:'Review', effort:'5min', description:'Addendum to existing deal — Danny Walsh flagged urgency.' },
          ].map((w, i) => (
            <div key={i} className="rounded-2xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: w.impact==='Critical'?'rgba(239,68,68,0.12)':'rgba(245,158,11,0.12)', color: w.impact==='Critical'?'#EF4444':'#F59E0B' }}>{w.impact === 'Critical' ? 'HIGH IMPACT' : 'MEDIUM IMPACT'}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#dc26261a', color: '#f87171' }}>⏱ {w.effort}</span>
                    <span className="text-xs" style={{ color: '#6B7280' }}>{w.cat}</span>
                  </div>
                  <h3 className="font-bold mb-1" style={{ color: '#F9FAFB' }}>{w.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{w.description}</p>
                  <p className="text-xs mt-2" style={{ color: '#374151' }}>Source: AI + Camp data</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{ backgroundColor: '#dc2626' }}>{w.cta} →</button>
                  <button className="px-4 py-2 text-xs rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>Mark done</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DAILY TASKS */}
      {dashTab === 'dailytasks' && (
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>Daily Tasks</div>
            <button onClick={() => setShowAddTask(v => !v)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: '#dc2626' }}>
              + Add Task
            </button>
          </div>
          {showAddTask && (
            <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
              <input autoFocus value={newTaskText} onChange={e => setNewTaskText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') { setShowAddTask(false); setNewTaskText('') } }}
                placeholder="New task…" className="flex-1 bg-transparent text-sm text-white outline-none px-2 py-1.5" />
              <button onClick={addTask} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: '#22C55E' }}>Add</button>
              <button onClick={() => { setShowAddTask(false); setNewTaskText('') }} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF' }}>Cancel</button>
            </div>
          )}
          {[...DEFAULT_TASKS, ...customTasks].map((t) => {
            const done = !!tasksChecked[t.id]
            return (
              <div key={t.id} className="rounded-xl p-4 flex items-start gap-4"
                style={{ backgroundColor: t.highlight ? 'rgba(220,38,38,0.06)' : done ? 'rgba(255,255,255,0.01)' : '#111318', border: `1px solid ${t.highlight ? 'rgba(220,38,38,0.3)' : '#1F2937'}`, opacity: done ? 0.6 : 1 }}>
                <button onClick={() => toggleTaskItem(t.id)}
                  className="w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all"
                  style={{ borderColor: done ? '#22C55E' : '#4B5563', background: done ? 'rgba(34,197,94,0.15)' : 'transparent' }}>
                  {done && <span className="text-[9px] font-bold" style={{ color: '#22C55E' }}>✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: t.priority==='critical'?'rgba(239,68,68,0.12)':t.priority==='high'?'rgba(249,115,22,0.12)':t.priority==='medium'?'rgba(245,158,11,0.12)':'rgba(107,114,128,0.12)', color: t.priority==='critical'?'#EF4444':t.priority==='high'?'#F97316':t.priority==='medium'?'#F59E0B':'#6B7280' }}>{t.priority}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{t.cat}</span>
                    <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>{t.time}</span>
                  </div>
                  <h4 className="font-semibold text-sm" style={{ color: done ? '#4B5563' : t.highlight ? '#f87171' : '#E5E7EB', textDecoration: done ? 'line-through' : 'none' }}>{t.task}</h4>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {t.modal && !done && (
                    <button onClick={() => onOpenModal?.(t.modal!)}
                      className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{ backgroundColor: '#dc2626' }}>
                      Open →
                    </button>
                  )}
                  {!done && (
                    <button onClick={() => toggleTaskItem(t.id)}
                      className="px-4 py-2 text-xs rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>
                      Mark done
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* INSIGHTS */}
      {dashTab === 'insights' && (
        <div className="pt-4 space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label:'WBC Rank',       value:`#${fighter.rankings.wbc}`, sub:'Up 1 this month',                  color:'#dc2626', icon:'🥊' },
              { label:'IBF Rank',       value:`#${fighter.rankings.ibf}`, sub:'Mandatory approaching',            color:'#EF4444', icon:'🏆' },
              { label:'Record',         value:`${fighter.record.wins}-${fighter.record.losses}`, sub:`${fighter.record.ko} KOs`, color:'#F97316', icon:'📋' },
              { label:'Season Earnings',value:'£2.4m',                    sub:'+18% vs projection',               color:'#F59E0B', icon:'💰' },
              { label:'Days to Fight',  value:`${fighter.next_fight.days_away}d`, sub:`vs ${fighter.next_fight.opponent}`, color:'#22C55E', icon:'📅' },
            ].map((kpi, i) => (
              <div key={i} className="rounded-xl p-4 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="text-lg mb-1">{kpi.icon}</div>
                <div className="text-[10px] mb-0.5" style={{ color: '#6B7280' }}>{kpi.label}</div>
                <div className="text-xl font-black" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="text-[10px] mt-0.5" style={{ color: '#4B5563' }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Insight Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { type:'ALERT',       icon:'⚠️', color:'#EF4444', bg:'rgba(239,68,68,0.08)',  border:'rgba(239,68,68,0.2)',  title:`${(fighter.current_weight - fighter.target_weight).toFixed(1)}kg to cut in ${fighter.next_fight.days_away} days`, desc:`Current ${fighter.current_weight}kg, target ${fighter.target_weight}kg. Daily cut required: ${((fighter.current_weight - fighter.target_weight) / fighter.next_fight.days_away).toFixed(2)}kg/day. On track if you log daily.`, action:'Log weight →', modal:'weight' },
              { type:'OPPORTUNITY', icon:'💡', color:'#F59E0B', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)', title:'Under Armour camp extension offer', desc:'New approach via Danny Walsh — £85k for fight week branding and post-fight content. No competing sponsor in the pipeline. Decision needed by end of week.', action:'Open sponsor brief →', modal:'sponsor' },
              { type:'TREND',       icon:'📈', color:'#22C55E', bg:'rgba(34,197,94,0.08)',  border:'rgba(34,197,94,0.2)',  title:'Sparring power output up 8%', desc:'Last 5 sessions vs season avg. Right hand velocity and body shot compression both trending up. Jim Bevan flagged this in camp notes — keep the current pad routine.', action:'View training log →', modal:'matchprep' },
              { type:'ACHIEVEMENT', icon:'🏆', color:'#8B5CF6', bg:'rgba(139,92,246,0.08)', border:'rgba(139,92,246,0.2)', title:`Record now ${fighter.record.wins}-${fighter.record.losses} (${fighter.record.ko} KOs)`, desc:'Last fight: 12-round points win. Promoter Matchroom locking in O2 Arena headline slot. First top-10 WBC fight — media interest is high.', action:'View fight record →', modal:'matchprep' },
            ].map((tile, i) => (
              <div key={i} className="rounded-xl p-5" style={{ backgroundColor: tile.bg, border: `1px solid ${tile.border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{tile.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: tile.color }}>{tile.type}</span>
                </div>
                <p className="text-sm font-semibold text-white mb-1">{tile.title}</p>
                <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>{tile.desc}</p>
                <button onClick={() => onOpenModal?.(tile.modal)}
                  className="text-[11px] font-semibold transition-all" style={{ color: tile.color }}>
                  {tile.action}
                </button>
              </div>
            ))}
          </div>

          {/* Key Metrics Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>Key Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label:'Camp progress',       value:`${campProgress}%`, trend:`Day ${fighter.camp_day}/${fighter.camp_total}`, trendColor:'#F59E0B' },
                { label:'ACWR',                value:'1.12',             trend:'Optimal',                                        trendColor:'#22C55E' },
                { label:'Sparring rounds',     value:'84',               trend:'↑ 12 this week',                                trendColor:'#22C55E' },
                { label:'Power punches / rd',  value:'32',               trend:'↑ 4',                                           trendColor:'#22C55E' },
                { label:'Recovery score',      value:`${recoveryScore}%`,trend:'Green zone',                                    trendColor:'#22C55E' },
                { label:'Camp days remaining', value:`${fighter.camp_total - fighter.camp_day}`, trend:'On schedule',            trendColor:'#0ea5e9' },
                { label:'Sponsor obligations', value:'2 due',            trend:'UA + DAZN',                                     trendColor:'#EC4899' },
                { label:'Purse (projected)',   value:'£1.2m',            trend:'70/30 split',                                   trendColor:'#F97316' },
              ].map((m, i) => (
                <div key={i} className="rounded-lg p-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="text-[10px] mb-1" style={{ color: '#6B7280' }}>{m.label}</div>
                  <div className="text-lg font-black text-white">{m.value}</div>
                  <div className="text-[10px] font-semibold" style={{ color: m.trendColor }}>{m.trend}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DON'T MISS */}
      {dashTab === 'dontmiss' && (
        <div className="pt-4 space-y-3">
          {[
            { urgency:'CRITICAL', item:'Weight cut — 5.1kg to target in 48 days. If missed: dangerous rapid cut fight week.', action:'Log weight →', color:'#dc2626' },
            { urgency:'CRITICAL', item:'Right hand X-ray — Jim flagged knuckle swelling. If missed: risk fighting injured.', action:'Book appointment →', color:'#EF4444' },
            { urgency:'TODAY',    item:'DAZN interview — press tour begins today. If missed: contractual breach.', action:'Prep talking points →', color:'#F59E0B' },
            { urgency:'THIS WEEK',item:'Matchroom contract addendum signature. If missed: fight postponed.', action:'Review contract →', color:'#F59E0B' },
            { urgency:'THIS WEEK',item:'Mandatory rest day Saturday — physio assessment. If missed: overtraining risk.', action:'Log recovery →', color:'#6B7280' },
          ].map((d, i) => (
            <div key={i} className="flex items-start gap-4 rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <span className="text-[10px] px-2 py-1 rounded font-black flex-shrink-0 mt-0.5"
                style={{ background: d.urgency==='CRITICAL' ? 'rgba(239,68,68,0.12)' : d.urgency==='TODAY' ? 'rgba(245,158,11,0.12)' : 'rgba(107,114,128,0.12)', color: d.urgency==='CRITICAL' ? '#EF4444' : d.urgency==='TODAY' ? '#F59E0B' : '#6B7280' }}>{d.urgency}</span>
              <div className="flex-1">
                <p className="text-sm mb-1" style={{ color: '#E5E7EB' }}>{d.item}</p>
                <button className="text-[10px] font-semibold" style={{ color: d.color }}>{d.action}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TEAM — 4 sub-tabs */}
      {dashTab === 'team' && (() => {
        const demoStaffPhotos: Record<string, string> = {
          'Jim Bevan': '/Carlos_Mendez.jpg',
          'Danny Walsh': '/Marcus_Webb.jpg',
          'Dr Sarah Mitchell': '/Sarah_Lee.jpg',
          'Ricky Dunn': '/James_Okafor.jpg',
          'Tony Malone': '/Rick_Dalton.jpg',
          'DAZN': '/Elena_Russo.jpg',
        }
        const [teamSubTab, setTeamSubTab] = [teamSub, setTeamSub]
        return (
        <div className="pt-4 space-y-4">
          <div className="flex gap-2">
            {([{id:'today' as const,label:'👥 Team Today'},{id:'org' as const,label:'🏢 Org Chart'},{id:'info' as const,label:'🃏 Team Info'},{id:'record' as const,label:'🏆 Fight Record'}]).map(t=>(
              <button key={t.id} onClick={()=>setTeamSubTab(t.id)} className="px-4 py-2 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: teamSubTab===t.id ? '#dc2626' : '#111318', color: teamSubTab===t.id ? '#F9FAFB' : '#6B7280', border: teamSubTab===t.id ? 'none' : '1px solid #1F2937' }}>{t.label}</button>
            ))}
          </div>
          {teamSubTab === 'today' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name:'Jim Bevan',       role:'Head Trainer',    status:'Gym session 09:30, pad work focus', available:true,  initials:'JB', color:'#22C55E' },
                { name:'Danny Walsh',     role:'Manager',         status:'Purse split call 16:00',           available:true,  initials:'DW', color:'#F59E0B' },
                { name:'Dr Sarah Mitchell',role:'Fight Doctor',   status:'Hand assessment 11:00',            available:true,  initials:'SM', color:'#EF4444' },
                { name:'Ricky Dunn',      role:'Conditioning',    status:'Morning run completed',            available:true,  initials:'RD', color:'#0ea5e9' },
                { name:'Tony Malone',     role:'Cutman',          status:'Kit check pre-sparring',           available:true,  initials:'TM', color:'#8B5CF6' },
                { name:'DAZN',            role:'Broadcast',       status:'Interview 14:00 — press tour',     available:true,  initials:'DZ', color:'#F97316' },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden" style={{ background: `${m.color}20`, border: `1px solid ${m.color}40`, color: m.color }}>
                    {demoStaffPhotos[m.name] ? <img src={demoStaffPhotos[m.name]} alt={m.name} className="w-full h-full object-cover object-center" /> : m.initials}
                  </div>
                  <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-white">{m.name}</div><div className="text-[10px]" style={{ color: m.color }}>{m.role}</div><div className="text-[10px] truncate" style={{ color: '#6B7280' }}>{m.status}</div></div>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.available ? '#22C55E' : '#374151' }} />
                </div>
              ))}
            </div>
          )}
          {teamSubTab === 'org' && (
            <div className="rounded-xl p-6 text-center space-y-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="text-sm font-bold text-white mb-4">Team Organisation</div>
              <div className="flex justify-center gap-8">
                {[{name:'Danny Walsh',role:'Manager'},{name:'Matchroom',role:'Promoter'}].map((p,i)=>(<div key={i} className="text-center"><div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold" style={{background:'rgba(220,38,38,0.2)',border:'1px solid rgba(220,38,38,0.4)',color:'#dc2626'}}>{p.name.split(' ').map(w=>w[0]).join('')}</div><div className="text-xs text-white">{p.name}</div><div className="text-[10px]" style={{color:'#6B7280'}}>{p.role}</div></div>))}
              </div>
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-lg font-bold overflow-hidden"
                style={{background:'rgba(220,38,38,0.2)',border:'2px solid #dc2626',color:'#dc2626'}}>
                {liveProfilePhoto ? <img src={liveProfilePhoto} alt="" className="w-full h-full object-cover" /> : 'MC'}
              </div>
              <div className="text-lg font-black text-white">{liveProfileName || session.userName || fighter.name}</div>
              <div className="text-[10px] text-gray-500 italic">&quot;The Machine&quot;</div>
              <div className="text-xs" style={{color:'#dc2626'}}>Fighter — WBC #{fighter.rankings.wbc} Heavyweight</div>
              <div className="flex justify-center gap-6 flex-wrap">
                {[{name:'Jim Bevan',role:'Trainer'},{name:'Dr Mitchell',role:'Doctor'},{name:'Ricky Dunn',role:'Conditioning'},{name:'Tony Malone',role:'Cutman'},{name:'Marcos Silva',role:'Psych'}].map((p,i)=>(<div key={i} className="text-center"><div className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold" style={{background:'rgba(255,255,255,0.05)',border:'1px solid #1F2937',color:'#6B7280'}}>{p.name.split(' ').map(w=>w[0]).join('')}</div><div className="text-[10px] text-white">{p.name}</div><div className="text-[9px]" style={{color:'#6B7280'}}>{p.role}</div></div>))}
              </div>
            </div>
          )}
          {teamSubTab === 'info' && (
            <div>
              <h2 className="text-sm font-black mb-3" style={{ color: '#F9FAFB' }}>Team Info</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {[
                  { initials:'JB', name:'Jim Bevan', role:'Head Trainer', dept:'Training', rating:95, deptColor:'#22C55E', ref:'LUM-001', stats:{TAC:96,MOT:94,EXP:97,COM:93,STR:91,PRE:95}, speciality:'Boxing tactical coach', location:'London', available:true },
                  { initials:'DW', name:'Danny Walsh', role:'Manager', dept:'Commercial', rating:92, deptColor:'#F59E0B', ref:'LUM-002', stats:{NEG:95,NET:93,EXP:94,COM:91,DEA:96,REL:90}, speciality:'Fight negotiations', location:'London', available:true },
                  { initials:'SM', name:'Dr Sarah Mitchell', role:'Fight Doctor', dept:'Medical', rating:96, deptColor:'#EF4444', ref:'LUM-003', stats:{DIA:97,TRT:96,PRE:94,CON:95,EXP:93,KNO:97}, speciality:'Sports medicine', location:'London', available:true },
                  { initials:'RD', name:'Ricky Dunn', role:'Conditioning', dept:'Fitness', rating:90, deptColor:'#0ea5e9', ref:'LUM-004', stats:{FIT:93,STR:91,SPD:92,END:94,REC:89,PRE:88}, speciality:'Strength & conditioning', location:'London', available:true },
                  { initials:'TM', name:'Tony Malone', role:'Cutman', dept:'Corner', rating:93, deptColor:'#8B5CF6', ref:'LUM-005', stats:{SWF:95,PRE:94,CLM:92,EXP:96,TEC:91,REA:93}, speciality:'Fight night corner', location:'London', available:true },
                  { initials:'DZ', name:'DAZN', role:'Broadcast', dept:'Media', rating:88, deptColor:'#F97316', ref:'LUM-006', stats:{REA:90,PRO:88,NET:92,EXP:87,COM:89,COV:91}, speciality:'Live broadcast', location:'London', available:true },
                ].map((m, i) => (
                  <div key={i} className="rounded-xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${m.deptColor}18 0%, rgba(0,0,0,0.6) 100%)`, border: `1px solid ${m.deptColor}35` }}>
                    <div className="flex items-start justify-between px-2 pt-2 pb-1">
                      <div><div className="text-base font-black leading-none" style={{ color: '#F9FAFB' }}>{m.rating}</div><div className="text-[7px] font-bold uppercase tracking-widest mt-0.5" style={{ color: m.deptColor }}>{m.role.split(' ')[0].toUpperCase()}</div></div>
                      <span className="text-[7px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${m.deptColor}25`, color: m.deptColor }}>{m.dept}</span>
                    </div>
                    <div className="flex justify-center pb-1">
                      {demoStaffPhotos[m.name] ? (<div className="w-8 h-8 rounded-full overflow-hidden border flex-shrink-0" style={{ borderColor: `${m.deptColor}60` }}><img src={demoStaffPhotos[m.name]} alt={m.name} className="w-full h-full object-cover object-center" /></div>) : (<div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border" style={{ backgroundColor: `${m.deptColor}20`, borderColor: `${m.deptColor}60`, color: m.deptColor }}>{m.initials}</div>)}
                    </div>
                    <div className="text-center px-2 pb-1"><div className="text-[10px] font-black text-white leading-tight">{m.name}</div><div className="text-[8px] mt-0.5" style={{ color: m.deptColor }}>{m.role}</div></div>
                    <div className="grid grid-cols-3 gap-x-0 px-1.5 pb-1" style={{ borderTop: `1px solid ${m.deptColor}20`, borderBottom: `1px solid ${m.deptColor}20` }}>
                      {Object.entries(m.stats).map(([k, v], si) => (<div key={k} className="flex items-center justify-center gap-0.5 py-0.5 text-[8px]" style={{ borderRight: (si+1)%3!==0?`1px solid ${m.deptColor}15`:'none', borderBottom: si<3?`1px solid ${m.deptColor}15`:'none' }}><span className="font-black text-white">{v}</span><span style={{ color: m.deptColor }}>{k}</span></div>))}
                    </div>
                    <div className="px-2 py-1 space-y-0.5 text-[8px]">
                      {[['Speciality',m.speciality],['Location',m.location]].map(([l,v]) => (<div key={l} className="flex justify-between"><span style={{ color: '#6B7280' }}>{l}</span><span className="text-white text-right truncate ml-1">{v}</span></div>))}
                      <div className="flex justify-between"><span style={{ color: '#6B7280' }}>Available</span><span className="font-bold" style={{ color: m.available?'#22C55E':'#EF4444' }}>{m.available?'Yes':'No'}</span></div>
                    </div>
                    <div className="px-2 pb-2 pt-0.5 flex items-center justify-between"><span className="text-[7px]" style={{ color: '#374151' }}>{m.ref}</span><button className="flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${m.deptColor}20`, color: m.deptColor, border: `1px solid ${m.deptColor}30` }}>👤 Profile</button></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {teamSubTab === 'record' && (
            <div className="rounded-xl p-5 space-y-3" style={{backgroundColor:'#111318',border:'1px solid #1F2937'}}>
              <div className="text-sm font-bold text-white mb-3">Fight Record</div>
              {[
                {l:'Professional Record',v:'22-1 (18 KOs)'},{l:'WBC Ranking',v:`#${fighter.rankings.wbc}`},{l:'WBA Ranking',v:`#${fighter.rankings.wba}`},{l:'WBO Ranking',v:`#${fighter.rankings.wbo}`},{l:'IBF Ranking',v:`#${fighter.rankings.ibf}`},{l:'Weight Class',v:'Heavyweight (max 200lb / 90.7kg)'},{l:'Promoter',v:'Matchroom Boxing'},{l:'Broadcast',v:'DAZN'},{l:'Trainer',v:'Jim Bevan (since 2021)'},{l:'Pro debut',v:'March 2018'},{l:'Last fight',v:'W — points — 12 rounds'},
              ].map((r,i)=>(<div key={i} className="flex items-center justify-between py-2 text-xs" style={{borderBottom:i<10?'1px solid #1F2937':'none'}}><span style={{color:'#6B7280'}}>{r.l}</span><span className="font-bold text-white">{r.v}</span></div>))}
            </div>
          )}
        </div>
        )
      })()}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── TRAINING LOG VIEW ────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TrainingLogView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const weekLog = [
    { date: '2026-03-30', am: 'Roadwork 8km + sprints', pm: 'Pads — Jim Bevan (10 rds)', evening: 'Core & stretching', load: 8, notes: 'Sharp on pads. Left hook timing improved.' },
    { date: '2026-03-31', am: 'Rest / Recovery swim', pm: 'Sparring 8 rds (Hughes)', evening: 'Ice bath + massage', load: 9, notes: 'Good body work. Need to tighten guard after throwing.' },
    { date: '2026-04-01', am: 'Roadwork 6km (easy)', pm: 'Bag work 6 rds + skipping 20min', evening: 'Yoga / mobility', load: 6, notes: 'Active recovery day. Shoulder slightly tight.' },
    { date: '2026-04-02', am: 'Strength — lower body', pm: 'Pads — Jim Bevan (12 rds)', evening: 'Physio — shoulder', load: 8, notes: 'Power session. Explosive movements good.' },
    { date: '2026-04-03', am: 'Roadwork 10km', pm: 'Sparring 10 rds (Morrison)', evening: 'Film review + stretch', load: 10, notes: 'Hard sparring. Simulated late rounds. Good composure.' },
    { date: '2026-04-04', am: 'Roadwork 8km + hills', pm: 'Sparring 8 rds (Hughes)', evening: 'Physio / ice bath', load: 9, notes: 'Today — Afternoon session upcoming.' },
  ];

  const weeklyTotals = {
    totalSessions: 18,
    sparringRounds: 26,
    padRounds: 22,
    roadworkKm: 40,
    avgLoad: 8.3,
    restDays: 1,
  };

  const exerciseLog = [
    { exercise: 'Heavy Bag', sets: 6, duration: '3 min/rd', intensity: 'High', notes: 'Focus on body-head combinations' },
    { exercise: 'Speed Bag', sets: 4, duration: '3 min/rd', intensity: 'Medium', notes: 'Rhythm work and hand speed' },
    { exercise: 'Double-End Bag', sets: 4, duration: '3 min/rd', intensity: 'Medium', notes: 'Timing and accuracy drill' },
    { exercise: 'Shadow Boxing', sets: 3, duration: '3 min/rd', intensity: 'Low', notes: 'Footwork patterns and angles' },
    { exercise: 'Skipping', sets: 1, duration: '20 min', intensity: 'Medium', notes: 'Mixed tempo with crossovers' },
    { exercise: 'Medicine Ball', sets: 5, duration: '12 reps', intensity: 'High', notes: 'Rotational throws for power' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🥊" title="Training Log" subtitle="Session-by-session camp log with load tracking and trainer notes." />

      {/* Weekly Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Sessions" value={weeklyTotals.totalSessions} sub="This week" color="red" />
        <StatCard label="Sparring Rounds" value={weeklyTotals.sparringRounds} sub="26 / 30 target" color="orange" />
        <StatCard label="Pad Rounds" value={weeklyTotals.padRounds} sub="With Jim Bevan" color="yellow" />
        <StatCard label="Roadwork" value={`${weeklyTotals.roadworkKm}km`} sub="Target: 45km" color="green" />
        <StatCard label="Avg Load" value={weeklyTotals.avgLoad} sub="Out of 10" color="blue" />
        <StatCard label="Rest Days" value={weeklyTotals.restDays} sub="Recommended: 1-2" color="teal" />
      </div>

      {/* Daily Log Table */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Daily Training Log — Week 4</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-3">Date</th>
                <th className="text-left py-2 pr-3">AM Session</th>
                <th className="text-left py-2 pr-3">PM Session</th>
                <th className="text-left py-2 pr-3">Evening</th>
                <th className="text-center py-2 pr-3">Load</th>
                <th className="text-left py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {weekLog.map((day, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="py-2.5 pr-3 text-gray-300 font-mono">{day.date}</td>
                  <td className="py-2.5 pr-3 text-gray-300">{day.am}</td>
                  <td className="py-2.5 pr-3 text-white font-medium">{day.pm}</td>
                  <td className="py-2.5 pr-3 text-gray-400">{day.evening}</td>
                  <td className="py-2.5 pr-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      day.load >= 9 ? 'bg-red-600/20 text-red-400' :
                      day.load >= 7 ? 'bg-yellow-600/20 text-yellow-400' :
                      'bg-green-600/20 text-green-400'
                    }`}>{day.load}/10</span>
                  </td>
                  <td className="py-2.5 text-gray-500 max-w-xs">{day.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exercise Library */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Exercise Library — Today&apos;s Options</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {exerciseLog.map((ex, i) => (
            <div key={i} className="p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="flex justify-between items-start mb-1">
                <div className="text-sm text-white font-medium">{ex.exercise}</div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  ex.intensity === 'High' ? 'bg-red-600/20 text-red-400' :
                  ex.intensity === 'Medium' ? 'bg-yellow-600/20 text-yellow-400' :
                  'bg-green-600/20 text-green-400'
                }`}>{ex.intensity}</span>
              </div>
              <div className="text-xs text-gray-400">{ex.sets} sets x {ex.duration}</div>
              <div className="text-xs text-gray-500 mt-1">{ex.notes}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trainer Feedback */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Trainer Feedback — Jim Bevan</div>
        <div className="space-y-3">
          <div className="p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">April 4, 2026</div>
            <div className="text-sm text-gray-300">Marcus is moving well and his timing on the counter shots is sharp. We need to drill more clinch exits — Petrov will try to smother him inside. Left hook to the body is landing clean in sparring. Keep pushing the pace work in rounds 7-10 this coming week.</div>
          </div>
          <div className="p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">April 2, 2026</div>
            <div className="text-sm text-gray-300">Good power session today. Marcus generated excellent force on the uppercut off the back foot. Footwork needs tightening when circling right — leaving the back door open. Added extra rounds of pivot drills to tomorrow&apos;s pad work.</div>
          </div>
        </div>
      </div>
      <BoxingAISection context="training" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── SPARRING PLANNER VIEW ────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SparringPlannerView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const sparringPartners = [
    { name: 'Darnell "Tank" Hughes', weight: '96.2kg', stance: 'Southpaw', style: 'Pressure fighter', record: '14-2 (10 KO)', available: true, rate: '£400/day', notes: 'Best Petrov mimic — similar jab, walks forward' },
    { name: 'Chris Adebayo', weight: '100.5kg', stance: 'Orthodox', style: 'Counter puncher', record: '11-0 (7 KO)', available: true, rate: '£350/day', notes: 'Fast hands, good for working behind the jab' },
    { name: 'Jake Morrison', weight: '108.3kg', stance: 'Orthodox', style: 'Brawler', record: '18-5 (15 KO)', available: true, rate: '£450/day', notes: 'Biggest guy in camp. Simulates size and clinch' },
    { name: 'Andre Williams', weight: '95.1kg', stance: 'Switch', style: 'Slick mover', record: '9-1 (4 KO)', available: false, rate: '£300/day', notes: 'Technical work. Good for movement and angles' },
    { name: 'Tyrone Bennett', weight: '99.7kg', stance: 'Orthodox', style: 'Volume puncher', record: '16-3 (8 KO)', available: true, rate: '£375/day', notes: 'High work rate. Simulates late-round pressure' },
  ];

  const weekPlan = [
    { week: 'Week 4 (Current)', focus: 'Specific — Opponent patterns', totalRounds: 30, partners: 'Hughes, Adebayo, Morrison', intensity: 'High' },
    { week: 'Week 5', focus: 'Specific — Championship rounds', totalRounds: 36, partners: 'Hughes, Morrison, Bennett', intensity: 'Very High' },
    { week: 'Week 6', focus: 'Peak — Full fight simulation', totalRounds: 40, partners: 'All available', intensity: 'Maximum' },
    { week: 'Week 7', focus: 'Peak — 12-round simulations', totalRounds: 36, partners: 'Hughes, Morrison', intensity: 'Very High' },
    { week: 'Week 8', focus: 'Taper — Controlled rounds', totalRounds: 18, partners: 'Hughes only', intensity: 'Moderate' },
    { week: 'Week 9', focus: 'Taper — Light touch sparring', totalRounds: 8, partners: 'TBD', intensity: 'Low' },
    { week: 'Week 10', focus: 'Fight week — No sparring', totalRounds: 0, partners: 'N/A', intensity: 'Rest' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🤼" title="Sparring Planner" subtitle="Manage sparring partners, weekly round targets, and camp sparring strategy." />

      {/* Sparring Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Camp Rounds" value="84" sub="Target: 200" color="red" />
        <StatCard label="This Week" value="26 rds" sub="Target: 30" color="orange" />
        <StatCard label="Partners Available" value="4/5" sub="Andre unavailable" color="teal" />
        <StatCard label="Avg Partner Cost" value="£375" sub="Per day" color="blue" />
      </div>

      {/* Sparring Partners */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Sparring Partners — Camp Roster</div>
        <div className="space-y-3">
          {sparringPartners.map((partner, i) => (
            <div key={i} className={`p-4 bg-[#0a0c14] border rounded-lg ${partner.available ? 'border-gray-800' : 'border-gray-800/50 opacity-50'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm text-white font-medium">{partner.name}</div>
                  <div className="text-xs text-gray-400">{partner.record} — {partner.stance} — {partner.style}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{partner.rate}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${partner.available ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                    {partner.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-gray-500">Weight: <span className="text-gray-300">{partner.weight}</span></span>
                <span className="text-gray-500">Purpose: <span className="text-gray-300">{partner.notes}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Sparring Plan */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Weekly Sparring Plan — Remaining Camp</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-4">Week</th>
                <th className="text-left py-2 pr-4">Focus</th>
                <th className="text-center py-2 pr-4">Rounds</th>
                <th className="text-left py-2 pr-4">Partners</th>
                <th className="text-left py-2">Intensity</th>
              </tr>
            </thead>
            <tbody>
              {weekPlan.map((week, i) => (
                <tr key={i} className={`border-b border-gray-800/50 ${i === 0 ? 'bg-red-900/10' : ''}`}>
                  <td className="py-2.5 pr-4 text-gray-300 font-medium">{week.week}</td>
                  <td className="py-2.5 pr-4 text-white">{week.focus}</td>
                  <td className="py-2.5 pr-4 text-center text-gray-300">{week.totalRounds}</td>
                  <td className="py-2.5 pr-4 text-gray-400">{week.partners}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      week.intensity === 'Maximum' ? 'bg-red-600/20 text-red-400' :
                      week.intensity === 'Very High' ? 'bg-orange-600/20 text-orange-400' :
                      week.intensity === 'High' ? 'bg-yellow-600/20 text-yellow-400' :
                      week.intensity === 'Moderate' ? 'bg-blue-600/20 text-blue-400' :
                      week.intensity === 'Low' ? 'bg-green-600/20 text-green-400' :
                      'bg-gray-600/20 text-gray-400'
                    }`}>{week.intensity}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sparring Notes */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Sparring Notes — Key Observations</div>
        <div className="space-y-3">
          <div className="p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
            <div className="flex justify-between mb-1"><span className="text-xs text-white font-medium">vs Hughes (8 rds) — April 3</span><span className="text-xs text-yellow-400">Hard rounds</span></div>
            <div className="text-xs text-gray-400">Darnell caught Marcus with a straight left in round 5 — same angle Petrov uses. Marcus recovered well and adjusted guard. Good body work in rounds 6-8. Need to keep hands higher when circling left.</div>
          </div>
          <div className="p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
            <div className="flex justify-between mb-1"><span className="text-xs text-white font-medium">vs Morrison (10 rds) — April 1</span><span className="text-xs text-red-400">Championship sim</span></div>
            <div className="text-xs text-gray-400">Full 10-round simulation at championship pace. Marcus showed excellent cardio and maintained power through the late rounds. Inside fighting improved — good uppercuts from the clinch. Jake tested his chin in round 8, handled it well.</div>
          </div>
        </div>
      </div>
      <BoxingAISection context="training" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── OPPOSITION ANALYSIS VIEW ─────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function OppositionAnalysisView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const tendencies = [
    { area: 'Jab', rating: 78, notes: 'Pawing jab to set up the right hand. Rarely doubles up.' },
    { area: 'Right Hand', rating: 92, notes: 'Devastating power. Loads up from distance. Telegraphs slightly.' },
    { area: 'Body Work', rating: 55, notes: 'Neglects the body. Primarily a head hunter.' },
    { area: 'Clinch', rating: 70, notes: 'Uses clinch to smother and reset. Dirty on the inside.' },
    { area: 'Footwork', rating: 45, notes: 'Flat-footed. Struggles with lateral movement. Plods forward.' },
    { area: 'Stamina', rating: 60, notes: 'Fades noticeably after round 8. Dropped 2 of last 3 late-round sessions.' },
  ];

  const fightHistory = [
    { date: '2026-01-18', opponent: 'Carlos Mendez', record: '22-3', result: 'W', method: 'TKO R4', venue: 'T-Mobile Arena, Las Vegas' },
    { date: '2025-09-12', opponent: 'Oleksandr Boyko', record: '19-1', result: 'W', method: 'UD', venue: 'Moscow, Russia' },
    { date: '2025-05-03', opponent: 'James Thompson', record: '25-2', result: 'W', method: 'KO R2', venue: 'Wembley Arena, London' },
    { date: '2025-01-25', opponent: 'Daniel Dubrov', record: '18-0', result: 'W', method: 'SD', venue: 'Dubai' },
    { date: '2024-09-14', opponent: 'Frank Sanchez', record: '24-1', result: 'L', method: 'UD', venue: 'New York, USA' },
    { date: '2024-05-11', opponent: 'Otto Wallin', record: '26-3', result: 'W', method: 'TKO R7', venue: 'Stockholm, Sweden' },
  ];

  const tacticalNotes = [
    { title: 'Ring Generalship', content: 'Petrov wants to control centre ring. He walks forward constantly and tries to bully opponents to the ropes. Strategy: Use lateral movement and angles. Don\'t let him pin you.' },
    { title: 'Counter Opportunities', content: 'When Petrov loads up his right hand, he drops his left shoulder and plants his feet. This is a 0.3-second window for a counter left hook or pull counter right hand.' },
    { title: 'Body Attack Strategy', content: 'Petrov has shown vulnerability to body shots. Only 2 of his 30 fights have gone past round 10 — and he lost one of them on points. Systematic body work from round 1 will pay dividends in the championship rounds.' },
    { title: 'Clinch Management', content: 'Expect Petrov to clinch aggressively when hurt or tired. He uses his head position inside. Work the uppercut on entry, and be first to establish head position. Referee: expected to be Marcus McDonnell — tends to break quickly.' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🔍" title="Opposition Analysis" subtitle={`Detailed breakdown of ${fighter.next_fight.opponent} — ${fighter.next_fight.opponent_ranking}`} />

      {/* Opponent Profile Card */}
      <div className="bg-gradient-to-r from-red-900/30 via-[#0D1117] to-gray-900 border border-red-600/20 rounded-xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-red-900/40 border-2 border-red-500/30 flex items-center justify-center text-2xl">
            {fighter.next_fight.opponent_flag}
          </div>
          <div>
            <div className="text-xl font-bold text-white">{fighter.next_fight.opponent}</div>
            <div className="text-sm text-gray-400">{fighter.next_fight.opponent_nationality} — {fighter.next_fight.opponent_ranking}</div>
            <div className="text-sm text-red-400 font-semibold mt-1">{fighter.next_fight.opponent_record}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-2 bg-[#0a0c14] rounded border border-gray-800">
            <div className="text-gray-500">Age</div><div className="text-white font-medium">31</div>
          </div>
          <div className="p-2 bg-[#0a0c14] rounded border border-gray-800">
            <div className="text-gray-500">Height</div><div className="text-white font-medium">6&apos;3&quot; / 191cm</div>
          </div>
          <div className="p-2 bg-[#0a0c14] rounded border border-gray-800">
            <div className="text-gray-500">Reach</div><div className="text-white font-medium">80&quot; / 203cm</div>
          </div>
          <div className="p-2 bg-[#0a0c14] rounded border border-gray-800">
            <div className="text-gray-500">Stance</div><div className="text-white font-medium">Orthodox</div>
          </div>
          <div className="p-2 bg-[#0a0c14] rounded border border-gray-800">
            <div className="text-gray-500">KO %</div><div className="text-red-400 font-medium">86%</div>
          </div>
          <div className="p-2 bg-[#0a0c14] rounded border border-gray-800">
            <div className="text-gray-500">Rounds Boxed</div><div className="text-white font-medium">127</div>
          </div>
          <div className="p-2 bg-[#0a0c14] rounded border border-gray-800">
            <div className="text-gray-500">Last Loss</div><div className="text-white font-medium">Sep 2024 (UD)</div>
          </div>
          <div className="p-2 bg-[#0a0c14] rounded border border-gray-800">
            <div className="text-gray-500">Promoter</div><div className="text-white font-medium">Top Rank</div>
          </div>
        </div>
      </div>

      {/* Tendencies */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Tendencies & Ratings</div>
        <div className="space-y-4">
          {tendencies.map((t, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-white font-medium">{t.area}</span>
                <span className="text-sm text-gray-400">{t.rating}/100</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 mb-1">
                <div
                  className={`h-2 rounded-full ${t.rating >= 80 ? 'bg-red-500' : t.rating >= 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${t.rating}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">{t.notes}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Fight History */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Recent Fight History</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-4">Date</th>
                <th className="text-left py-2 pr-4">Opponent</th>
                <th className="text-left py-2 pr-4">Record</th>
                <th className="text-center py-2 pr-4">Result</th>
                <th className="text-left py-2 pr-4">Method</th>
                <th className="text-left py-2">Venue</th>
              </tr>
            </thead>
            <tbody>
              {fightHistory.map((fight, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="py-2.5 pr-4 text-gray-400 font-mono">{fight.date}</td>
                  <td className="py-2.5 pr-4 text-white">{fight.opponent}</td>
                  <td className="py-2.5 pr-4 text-gray-400">{fight.record}</td>
                  <td className="py-2.5 pr-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${fight.result === 'W' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>{fight.result}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-300">{fight.method}</td>
                  <td className="py-2.5 text-gray-500">{fight.venue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tactical Notes */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Tactical Game Plan Notes</div>
        <div className="space-y-3">
          {tacticalNotes.map((note, i) => (
            <div key={i} className="p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="text-sm text-red-400 font-medium mb-1">{note.title}</div>
              <div className="text-xs text-gray-300">{note.content}</div>
            </div>
          ))}
        </div>
      </div>
      <BoxingAISection context="opponent" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── WEIGHT TRACKER VIEW ──────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function WeightTrackerView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const dailyWeights = [
    { day: 1, date: '2026-03-14', weight: 101.2, notes: 'Camp start — baseline weigh-in' },
    { day: 2, date: '2026-03-15', weight: 101.0, notes: '' },
    { day: 3, date: '2026-03-16', weight: 100.8, notes: 'Dropped carbs from evening meal' },
    { day: 4, date: '2026-03-17', weight: 100.5, notes: '' },
    { day: 5, date: '2026-03-18', weight: 100.3, notes: '' },
    { day: 6, date: '2026-03-19', weight: 100.1, notes: 'Good early trend' },
    { day: 7, date: '2026-03-20', weight: 100.4, notes: 'Water retention — rest day' },
    { day: 8, date: '2026-03-21', weight: 100.0, notes: '' },
    { day: 9, date: '2026-03-22', weight: 99.8, notes: '' },
    { day: 10, date: '2026-03-23', weight: 99.5, notes: 'Breaking under 100kg' },
    { day: 11, date: '2026-03-24', weight: 99.3, notes: '' },
    { day: 12, date: '2026-03-25', weight: 99.1, notes: '' },
    { day: 13, date: '2026-03-26', weight: 99.0, notes: '' },
    { day: 14, date: '2026-03-27', weight: 98.8, notes: 'Two week mark — on schedule' },
    { day: 15, date: '2026-03-28', weight: 98.9, notes: 'Slight uptick — sodium' },
    { day: 16, date: '2026-03-29', weight: 98.7, notes: '' },
    { day: 17, date: '2026-03-30', weight: 98.5, notes: '' },
    { day: 18, date: '2026-03-31', weight: 98.4, notes: '' },
    { day: 19, date: '2026-04-01', weight: 98.1, notes: '' },
    { day: 20, date: '2026-04-02', weight: 97.9, notes: '' },
    { day: 21, date: '2026-04-03', weight: 98.0, notes: 'Slight rebound after hard sparring' },
    { day: 22, date: '2026-04-04', weight: 97.8, notes: 'Today — on track' },
  ];

  const remaining = fighter.current_weight - fighter.target_weight;
  const daysLeft = fighter.next_fight.days_away;
  const rateNeeded = remaining / (daysLeft / 7);
  const startWeight = 101.2;
  const totalLoss = startWeight - fighter.current_weight;

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="⚖️" title="Weight Tracker" subtitle="Daily weigh-ins, trajectory analysis, and cut planning." />

      {/* Hero Weight Card */}
      <div className="bg-gradient-to-r from-teal-900/40 via-[#0D1117] to-blue-900/30 border border-teal-600/20 rounded-xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm text-gray-400">Current Weight</div>
            <div className="text-4xl font-bold text-white">{fighter.current_weight}<span className="text-lg text-gray-400">kg</span></div>
            <div className="text-sm text-gray-500 mt-1">Target: {fighter.target_weight}kg — <span className="text-red-400">{remaining.toFixed(1)}kg remaining</span></div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">-{totalLoss.toFixed(1)}</div>
              <div className="text-xs text-gray-500">Total Lost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{remaining.toFixed(1)}</div>
              <div className="text-xs text-gray-500">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-400">{rateNeeded.toFixed(2)}</div>
              <div className="text-xs text-gray-500">kg/week needed</div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Weight Cut Progress</span>
            <span>{Math.round((totalLoss / (startWeight - fighter.target_weight)) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-gradient-to-r from-teal-500 to-green-500 h-2 rounded-full" style={{ width: `${Math.round((totalLoss / (startWeight - fighter.target_weight)) * 100)}%` }}></div>
          </div>
        </div>
        <div className="mt-3 text-xs text-green-400 font-medium">Status: ON TRACK — Current rate of loss is sustainable</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Start Weight" value="101.2kg" sub="Camp day 1" color="blue" />
        <StatCard label="Current Weight" value={`${fighter.current_weight}kg`} sub={`Day ${fighter.camp_day}`} color="teal" />
        <StatCard label="Target Weight" value={`${fighter.target_weight}kg`} sub="Fight night target" color="green" />
        <StatCard label="Rate of Loss" value="0.24kg/d" sub={`${rateNeeded.toFixed(2)}kg/wk needed`} color="yellow" />
      </div>

      {/* Daily Weight Log */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Daily Weight Log — Camp Days 1-22</div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#0D1117]">
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-center py-2 pr-3">Day</th>
                <th className="text-left py-2 pr-3">Date</th>
                <th className="text-center py-2 pr-3">Weight</th>
                <th className="text-center py-2 pr-3">Change</th>
                <th className="text-left py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {dailyWeights.map((entry, i) => {
                const prev = i > 0 ? dailyWeights[i - 1].weight : entry.weight;
                const change = entry.weight - prev;
                return (
                  <tr key={i} className={`border-b border-gray-800/50 ${i === dailyWeights.length - 1 ? 'bg-teal-900/10' : ''}`}>
                    <td className="py-2 pr-3 text-center text-gray-400">{entry.day}</td>
                    <td className="py-2 pr-3 text-gray-300 font-mono">{entry.date}</td>
                    <td className="py-2 pr-3 text-center text-white font-medium">{entry.weight}kg</td>
                    <td className="py-2 pr-3 text-center">
                      <span className={`${change < 0 ? 'text-green-400' : change > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                        {change === 0 ? '—' : `${change > 0 ? '+' : ''}${change.toFixed(1)}`}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500">{entry.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nutritionist Notes */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Nutritionist Notes — Dr. Priya Kapoor</div>
        <div className="space-y-3">
          <div className="p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">April 4, 2026</div>
            <div className="text-sm text-gray-300">Marcus is on a solid trajectory. Current caloric intake is 3,200kcal with a 55/25/20 macro split (carb/protein/fat). We can maintain this through the specific phase. Once we enter taper, we will drop to 2,800kcal and begin water manipulation 5 days out. No need for aggressive cutting — the weight is coming off naturally.</div>
          </div>
          <div className="p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Daily Macros</div>
            <div className="grid grid-cols-4 gap-3 mt-2 text-xs">
              <div className="text-center p-2 bg-[#0D1117] rounded"><div className="text-white font-medium">3,200</div><div className="text-gray-500">kcal</div></div>
              <div className="text-center p-2 bg-[#0D1117] rounded"><div className="text-blue-400 font-medium">440g</div><div className="text-gray-500">Carbs</div></div>
              <div className="text-center p-2 bg-[#0D1117] rounded"><div className="text-red-400 font-medium">200g</div><div className="text-gray-500">Protein</div></div>
              <div className="text-center p-2 bg-[#0D1117] rounded"><div className="text-yellow-400 font-medium">71g</div><div className="text-gray-500">Fat</div></div>
            </div>
          </div>
        </div>
      </div>
      <BoxingAISection context="weight" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── CUT PLANNER VIEW ─────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function CutPlannerView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const [cutAiLoading, setCutAiLoading] = useState(false);
  const [cutAiResult, setCutAiResult] = useState<{assessment: string; daily_target: string; gps_adjustment: string; risk_flags: string[]; recommendation: string} | null>(null);

  const generateCutAdvice = async () => {
    setCutAiLoading(true);
    try {
      const recentLoad = GPS_SESSIONS.slice(-4).reduce((a,s)=>a+s.load,0)/4;
      const currentACWR = GPS_SESSIONS[GPS_SESSIONS.length-1].acwr;
      const response = await fetch('/api/ai/boxing', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Boxing weight cut analysis for Marcus Cole (Heavyweight, 27yo). Current: ${fighter.current_weight}kg. Target: ${fighter.target_weight}kg. Days to weigh-in: ${fighter.next_fight.days_away}. Camp GPS data: avg 4-session load ${recentLoad.toFixed(0)} AU, current ACWR ${currentACWR.toFixed(2)}. Hard sparring 3x/week. Nutritionist already has him on 3200kcal/day. Factor in GPS load when advising safe cut rate. Respond ONLY in JSON: {"assessment":"2 sentence overview","daily_target":"e.g. -0.18kg/day","gps_adjustment":"how GPS load affects the cut advice","risk_flags":["risk1","risk2"],"recommendation":"2 sentence final recommendation"}`
          }]
        })
      });
      const data = await response.json();
      setCutAiResult(JSON.parse(data.content[0].text));
    } catch { console.error('Cut advice failed'); }
    finally { setCutAiLoading(false); }
  };

  const cutSchedule = [
    { phase: 'Current — Steady Reduction', weeks: 'Weeks 1-6', method: 'Natural weight loss via training + nutrition', targetRate: '0.3-0.5kg/week', status: 'active' },
    { phase: 'Pre-Cut Prep', weeks: 'Week 7 (Day 43-49)', method: 'Increase water intake to 8L/day, sodium loading', targetRate: 'Maintain weight', status: 'upcoming' },
    { phase: 'Water Load Phase', weeks: 'Day 50-54', method: 'Water 8L→6L→4L→2L→1L over 5 days', targetRate: '1-2kg via water', status: 'upcoming' },
    { phase: 'Weigh-In Day', weeks: 'Day 55', method: 'Final dehydration + hot bath if needed', targetRate: 'Hit 92.7kg', status: 'upcoming' },
    { phase: 'Rehydration', weeks: 'Day 55 (post)', method: 'IV drip + oral rehydration + light meals', targetRate: 'Regain 3-4kg', status: 'upcoming' },
    { phase: 'Fight Day', weeks: 'Day 56', method: 'Walk around at 96-97kg, fully hydrated', targetRate: '96-97kg', status: 'upcoming' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📉" title="Cut Planner" subtitle="Structured weight cut protocol for fight week and beyond." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Current Weight" value={`${fighter.current_weight}kg`} sub="Morning weigh-in" color="teal" />
        <StatCard label="Target (Weigh-in)" value={`${fighter.target_weight}kg`} sub="Must hit on day 55" color="red" />
        <StatCard label="Remaining Cut" value={`${(fighter.current_weight - fighter.target_weight).toFixed(1)}kg`} sub="Natural + water" color="yellow" />
        <StatCard label="Fight Day Weight" value="~96kg" sub="Post-rehydration" color="green" />
      </div>

      {/* Cut Schedule */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Cut Schedule — Phase Breakdown</div>
        <div className="space-y-3">
          {cutSchedule.map((phase, i) => (
            <div key={i} className={`p-4 bg-[#0a0c14] border rounded-lg ${phase.status === 'active' ? 'border-teal-600/30 bg-teal-900/10' : 'border-gray-800'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm text-white font-medium">{phase.phase}</div>
                  <div className="text-xs text-gray-400">{phase.weeks}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${phase.status === 'active' ? 'bg-teal-600/20 text-teal-400' : 'bg-gray-600/20 text-gray-400'}`}>
                  {phase.status}
                </span>
              </div>
              <div className="text-xs text-gray-300">{phase.method}</div>
              <div className="text-xs text-gray-500 mt-1">Target: {phase.targetRate}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hydration Protocol */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Fight Week Water Protocol</div>
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { day: 'Mon', water: '8L', color: 'text-blue-400' },
            { day: 'Tue', water: '6L', color: 'text-blue-400' },
            { day: 'Wed', water: '4L', color: 'text-yellow-400' },
            { day: 'Thu', water: '2L', color: 'text-orange-400' },
            { day: 'Fri', water: '1L', color: 'text-red-400' },
          ].map((d, i) => (
            <div key={i} className="p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="text-xs text-gray-500">{d.day}</div>
              <div className={`text-lg font-bold ${d.color}`}>{d.water}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-500">Saturday = Weigh-in (AM). Post-weigh-in: immediate rehydration protocol begins with IV and oral electrolytes.</div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Cut Risk Assessment</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-[#0a0c14] border border-green-800/30 rounded-lg">
            <div className="text-xs text-green-400 font-medium mb-1">Low Risk Factors</div>
            <div className="text-xs text-gray-400">Weight is coming off steadily and naturally. Only 5.1kg total cut required, with 3.4kg expected to come from natural loss and 1.7kg from water manipulation. Well within safe limits for a heavyweight.</div>
          </div>
          <div className="p-3 bg-[#0a0c14] border border-yellow-800/30 rounded-lg">
            <div className="text-xs text-yellow-400 font-medium mb-1">Watch Points</div>
            <div className="text-xs text-gray-400">Monitor mood and energy levels during the final water cut. Marcus has historically experienced mild headaches during dehydration. Ensure rehydration plan includes magnesium and potassium supplementation.</div>
          </div>
        </div>
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-white">🤖 AI Weight Cut Advisor</div>
            <div className="text-xs text-gray-400">GPS load-adjusted daily calorie deficit calculator</div>
          </div>
          <button onClick={generateCutAdvice} disabled={cutAiLoading}
            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
            {cutAiLoading ? 'Calculating...' : 'Generate Advice'}
          </button>
        </div>
        {cutAiResult && (
          <div className="space-y-3">
            <div className="text-xs text-teal-400 border-l-2 border-teal-500 pl-3">{cutAiResult.assessment}</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0a0c14] border border-gray-800 rounded p-3">
                <div className="text-xs text-gray-500 mb-1">Daily Cut Target</div>
                <div className="text-white font-bold">{cutAiResult.daily_target}</div>
              </div>
              <div className="bg-[#0a0c14] border border-gray-800 rounded p-3">
                <div className="text-xs text-gray-500 mb-1">GPS Adjustment</div>
                <div className="text-yellow-400 font-medium text-xs">{cutAiResult.gps_adjustment}</div>
              </div>
            </div>
            {cutAiResult.risk_flags.length > 0 && (
              <div className="space-y-1">
                {cutAiResult.risk_flags.map((flag, i) => (
                  <div key={i} className="text-xs text-red-400 flex gap-2"><span>⚠</span><span>{flag}</span></div>
                ))}
              </div>
            )}
            <div className="text-xs text-gray-300 bg-[#0a0c14] border border-gray-800 rounded p-3">{cutAiResult.recommendation}</div>
          </div>
        )}
      </div>
      <BoxingAISection context="weight" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── RECOVERY & HRV VIEW ──────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function RecoveryHRVView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const weeklyHRV = [
    { day: 'Mon', hrv: 58, rhr: 52, sleep: 7.2, recovery: 75, notes: 'Post hard sparring, lower than baseline' },
    { day: 'Tue', hrv: 64, rhr: 50, sleep: 8.1, recovery: 83, notes: 'Good recovery after rest day' },
    { day: 'Wed', hrv: 61, rhr: 51, sleep: 7.5, recovery: 79, notes: 'Moderate session day' },
    { day: 'Thu', hrv: 55, rhr: 54, sleep: 6.8, recovery: 71, notes: 'Heavy sparring day — expect low' },
    { day: 'Fri', hrv: 62, rhr: 50, sleep: 7.9, recovery: 81, notes: 'Recovered well overnight' },
    { day: 'Sat', hrv: 66, rhr: 49, sleep: 8.5, recovery: 87, notes: 'Best recovery day this week' },
    { day: 'Sun', hrv: 62, rhr: 50, sleep: 7.8, recovery: 81, notes: 'Current / today' },
  ];

  const recoveryProtocols = [
    { name: 'Ice Bath', frequency: 'Daily (post-PM session)', duration: '10 min at 10°C', benefit: 'Reduces inflammation, accelerates muscle recovery', status: 'Completed today' },
    { name: 'Sports Massage', frequency: '3x/week', duration: '60 min', benefit: 'Deep tissue work, injury prevention', status: 'Tomorrow AM' },
    { name: 'Compression Boots', frequency: 'Daily (evening)', duration: '30 min', benefit: 'Lymphatic drainage, reduce DOMS', status: 'Completed today' },
    { name: 'Sleep Protocol', frequency: 'Daily', duration: '8hrs target', benefit: 'Peak recovery, hormone optimisation', status: '7.8hrs last night' },
    { name: 'Yoga/Mobility', frequency: '4x/week', duration: '30 min', benefit: 'Flexibility, injury prevention, mental reset', status: 'Scheduled PM' },
    { name: 'Sauna', frequency: '2x/week', duration: '15 min at 85°C', benefit: 'Heat adaptation, circulation', status: 'Tomorrow' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="💚" title="Recovery & HRV" subtitle="Track heart rate variability, sleep quality, and recovery protocols." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="HRV Today" value="62ms" sub="Baseline: 65ms" color="green" />
        <StatCard label="Resting HR" value="50 bpm" sub="Normal range" color="teal" />
        <StatCard label="Sleep" value="7.8hrs" sub="Target: 8hrs" color="blue" />
        <StatCard label="Recovery Score" value="81%" sub="Good — clear to train" color="green" />
      </div>

      {/* Weekly HRV Table */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Weekly HRV & Recovery Log</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-3">Day</th>
                <th className="text-center py-2 pr-3">HRV (ms)</th>
                <th className="text-center py-2 pr-3">RHR (bpm)</th>
                <th className="text-center py-2 pr-3">Sleep (hrs)</th>
                <th className="text-center py-2 pr-3">Recovery %</th>
                <th className="text-left py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {weeklyHRV.map((day, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="py-2 pr-3 text-gray-300 font-medium">{day.day}</td>
                  <td className="py-2 pr-3 text-center">
                    <span className={`font-medium ${day.hrv >= 63 ? 'text-green-400' : day.hrv >= 58 ? 'text-yellow-400' : 'text-red-400'}`}>{day.hrv}</span>
                  </td>
                  <td className="py-2 pr-3 text-center text-gray-300">{day.rhr}</td>
                  <td className="py-2 pr-3 text-center text-gray-300">{day.sleep}</td>
                  <td className="py-2 pr-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      day.recovery >= 80 ? 'bg-green-600/20 text-green-400' :
                      day.recovery >= 70 ? 'bg-yellow-600/20 text-yellow-400' :
                      'bg-red-600/20 text-red-400'
                    }`}>{day.recovery}%</span>
                  </td>
                  <td className="py-2 text-gray-500">{day.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recovery Protocols */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Recovery Protocols</div>
        <div className="space-y-3">
          {recoveryProtocols.map((proto, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="flex-1">
                <div className="text-sm text-white font-medium">{proto.name}</div>
                <div className="text-xs text-gray-400">{proto.frequency} — {proto.duration}</div>
                <div className="text-xs text-gray-500 mt-0.5">{proto.benefit}</div>
              </div>
              <span className="text-xs text-teal-400 ml-4">{proto.status}</span>
            </div>
          ))}
        </div>
      </div>
      <BoxingAISection context="training" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── MEDICAL RECORD VIEW ──────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function MedicalRecordView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const medicalHistory = [
    { date: '2026-03-14', type: 'Pre-Camp Physical', provider: 'Dr. Sarah Mitchell', result: 'PASS', notes: 'Full clearance for camp. All bloods normal. ECG normal sinus rhythm.' },
    { date: '2026-02-28', type: 'MRI — Right Hand', provider: 'London Imaging Centre', result: 'CLEAR', notes: 'No fracture. Mild soft tissue inflammation resolved. Cleared for full training.' },
    { date: '2026-02-15', type: 'Eye Exam', provider: 'Mr. Patel (Ophthalmologist)', result: 'PASS', notes: 'Retinal exam clear. No detachment. Visual acuity 20/20 both eyes.' },
    { date: '2025-12-10', type: 'BBBofC Annual Medical', provider: 'BBBofC Panel', result: 'PASS', notes: 'Full licence renewal. Brain MRI, bloods, cardiac screen — all clear.' },
    { date: '2025-09-20', type: 'Post-Fight Medical', provider: 'Dr. Ringside (after Williams fight)', result: 'CLEAR', notes: 'Minor nasal bridge swelling. 14-day suspension. Cleared on review.' },
  ];

  const currentInjuries = [
    { area: 'Right Shoulder', severity: 'Minor', status: 'Managing', notes: 'Mild rotator cuff tightness. Physio treatment ongoing. Does not limit training.' },
    { area: 'Left Knee', severity: 'Resolved', status: 'Cleared', notes: 'Patellar tendinitis from earlier in camp. Resolved with load management.' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🏥" title="Medical Record" subtitle="Injury history, medical clearances, and BBBofC documentation." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Licence Status" value="Active" sub="BBBofC — expires Dec 2026" color="green" />
        <StatCard label="Last Medical" value="Mar 14" sub="Pre-camp physical" color="blue" />
        <StatCard label="Current Injuries" value="1 minor" sub="Right shoulder — managed" color="yellow" />
        <StatCard label="Suspensions" value="0" sub="No active suspensions" color="teal" />
      </div>

      {/* Medical History */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Medical History</div>
        <div className="space-y-3">
          {medicalHistory.map((record, i) => (
            <div key={i} className="p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <div className="text-sm text-white font-medium">{record.type}</div>
                  <div className="text-xs text-gray-400">{record.date} — {record.provider}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${record.result === 'PASS' || record.result === 'CLEAR' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>{record.result}</span>
              </div>
              <div className="text-xs text-gray-500">{record.notes}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Injuries */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Current Injury Status</div>
        <div className="space-y-3">
          {currentInjuries.map((injury, i) => (
            <div key={i} className="p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-white font-medium">{injury.area}</div>
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${injury.severity === 'Minor' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-green-600/20 text-green-400'}`}>{injury.severity}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${injury.status === 'Cleared' ? 'bg-green-600/20 text-green-400' : 'bg-blue-600/20 text-blue-400'}`}>{injury.status}</span>
                </div>
              </div>
              <div className="text-xs text-gray-400">{injury.notes}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Required Documents */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Required Documents — Fight Clearance</div>
        <div className="space-y-2">
          {[
            { doc: 'BBBofC Licence (Active)', status: 'Valid', expiry: 'Dec 2026' },
            { doc: 'Annual Brain MRI', status: 'Valid', expiry: 'Dec 2026' },
            { doc: 'Pre-Fight Blood Work', status: 'Pending', expiry: 'Due May 2026' },
            { doc: 'Eye Examination', status: 'Valid', expiry: 'Feb 2027' },
            { doc: 'ECG / Cardiac Screen', status: 'Valid', expiry: 'Dec 2026' },
            { doc: 'Insurance Certificate', status: 'Valid', expiry: 'Aug 2026' },
          ].map((d, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50">
              <div className="text-xs text-gray-300">{d.doc}</div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{d.expiry}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${d.status === 'Valid' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>{d.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">🏛️ BBBofC Compliance Tracker</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Boxer Licence', value: 'Valid — expires Dec 2026', status: 'green' },
            { label: 'Annual Medical', value: 'Completed Feb 2026', status: 'green' },
            { label: 'Brain Scan (MRI)', value: 'Nov 2025 — clear', status: 'green' },
            { label: 'Eye Test', value: 'Jan 2026 — passed', status: 'green' },
            { label: 'Cardiac Screen', value: 'Due Jun 2026', status: 'amber' },
            { label: 'Blood Work', value: 'Required pre-fight', status: 'amber' },
          ].map(item => (
            <div key={item.label} className={`p-3 rounded-lg border ${item.status==='green'?'bg-green-900/10 border-green-600/20':'bg-yellow-900/10 border-yellow-600/20'}`}>
              <div className="text-[10px] text-gray-500 mb-1">{item.label}</div>
              <div className={`text-xs font-medium ${item.status==='green'?'text-green-400':'text-yellow-400'}`}>{item.value}</div>
            </div>
          ))}
        </div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Suspension &amp; Injury Log</div>
        <div className="space-y-2">
          {[
            { date: 'Nov 2025', event: 'Post-fight medical — vs White', detail: 'Mandatory 28-day suspension served. Medical clearance granted Dec 2025.', status: 'resolved' },
            { date: 'Mar 2025', event: 'Post-fight medical — vs Gorman', detail: 'Standard 28-day suspension. No injuries noted.', status: 'resolved' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2.5 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="w-1 bg-green-500 rounded-full flex-shrink-0"/>
              <div>
                <div className="text-xs text-white font-medium">{item.event}</div>
                <div className="text-[10px] text-gray-500">{item.date} · {item.detail}</div>
              </div>
              <span className="ml-auto text-[10px] text-green-400 font-medium flex-shrink-0">{item.status}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600/20 rounded-lg">
          <div className="text-xs text-blue-400 font-medium mb-1">Pre-Fight Requirements — Cole vs Petrov (May 22)</div>
          <div className="space-y-1 text-[10px] text-gray-400">
            <div>□ Blood work — submit to BBBofC by May 15</div>
            <div>□ MRI scan — valid (Nov 2025, within 12 months ✓)</div>
            <div>□ Pre-fight medical — BBBofC doctor, May 21 (venue)</div>
            <div>□ Weigh-in — May 21, official BBBofC scales</div>
          </div>
        </div>
      </div>
      <BoxingAISection context="medical" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── WORLD RANKINGS VIEW ──────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function WorldRankingsView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const rankings: Record<string, { name: string; country: string; record: string; isMarcus?: boolean }[]> = {
    WBC: [
      { name: 'Tyson Fury', country: '🇬🇧', record: '34-1-1 (24 KO)' },
      { name: 'Zhilei Zhang', country: '🇨🇳', record: '27-2-1 (22 KO)' },
      { name: 'Viktor Petrov', country: '🇷🇺', record: '28-2 (24 KO)' },
      { name: 'Martin Bakole', country: '🇨🇩', record: '21-1 (16 KO)' },
      { name: 'Filip Hrgovic', country: '🇭🇷', record: '17-1 (14 KO)' },
      { name: 'Marcus Cole', country: '🇬🇧', record: '22-1 (18 KO)', isMarcus: true },
      { name: 'Daniel Dubois', country: '🇬🇧', record: '22-2 (21 KO)' },
      { name: 'Joe Joyce', country: '🇬🇧', record: '16-3 (15 KO)' },
    ],
    WBA: [
      { name: 'Oleksandr Usyk', country: '🇺🇦', record: '22-0 (14 KO)' },
      { name: 'Daniel Dubois', country: '🇬🇧', record: '22-2 (21 KO)' },
      { name: 'Zhilei Zhang', country: '🇨🇳', record: '27-2-1 (22 KO)' },
      { name: 'Agit Kabayel', country: '🇩🇪', record: '24-0 (17 KO)' },
      { name: 'Frank Sanchez', country: '🇨🇺', record: '24-1 (17 KO)' },
      { name: 'Martin Bakole', country: '🇨🇩', record: '21-1 (16 KO)' },
      { name: 'Jared Anderson', country: '🇺🇸', record: '17-0 (15 KO)' },
      { name: 'Filip Hrgovic', country: '🇭🇷', record: '17-1 (14 KO)' },
      { name: 'Marcus Cole', country: '🇬🇧', record: '22-1 (18 KO)', isMarcus: true },
    ],
    WBO: [
      { name: 'Oleksandr Usyk', country: '🇺🇦', record: '22-0 (14 KO)' },
      { name: 'Tyson Fury', country: '🇬🇧', record: '34-1-1 (24 KO)' },
      { name: 'Zhilei Zhang', country: '🇨🇳', record: '27-2-1 (22 KO)' },
      { name: 'Jared Anderson', country: '🇺🇸', record: '17-0 (15 KO)' },
      { name: 'Marcus Cole', country: '🇬🇧', record: '22-1 (18 KO)', isMarcus: true },
      { name: 'Martin Bakole', country: '🇨🇩', record: '21-1 (16 KO)' },
      { name: 'Joseph Parker', country: '🇳🇿', record: '35-3 (23 KO)' },
      { name: 'Daniel Dubois', country: '🇬🇧', record: '22-2 (21 KO)' },
    ],
    IBF: [
      { name: 'Daniel Dubois', country: '🇬🇧', record: '22-2 (21 KO)' },
      { name: 'Filip Hrgovic', country: '🇭🇷', record: '17-1 (14 KO)' },
      { name: 'Agit Kabayel', country: '🇩🇪', record: '24-0 (17 KO)' },
      { name: 'Martin Bakole', country: '🇨🇩', record: '21-1 (16 KO)' },
      { name: 'Zhilei Zhang', country: '🇨🇳', record: '27-2-1 (22 KO)' },
      { name: 'Viktor Petrov', country: '🇷🇺', record: '28-2 (24 KO)' },
      { name: 'Jared Anderson', country: '🇺🇸', record: '17-0 (15 KO)' },
      { name: 'Demsey McKean', country: '🇦🇺', record: '24-1 (14 KO)' },
      { name: 'Frank Sanchez', country: '🇨🇺', record: '24-1 (17 KO)' },
      { name: 'Joe Joyce', country: '🇬🇧', record: '16-3 (15 KO)' },
      { name: 'Efe Ajagba', country: '🇳🇬', record: '18-2 (14 KO)' },
      { name: 'Marcus Cole', country: '🇬🇧', record: '22-1 (18 KO)', isMarcus: true },
    ],
  };

  const movements = [
    { body: 'WBC', direction: 'up', positions: 2, note: 'Rose from #8 after KO win over Dillian White (Nov 2025)' },
    { body: 'WBA', direction: 'same', positions: 0, note: 'Held at #9 — needs top-10 win to climb' },
    { body: 'WBO', direction: 'up', positions: 3, note: 'Jumped from #8 — benefited from Parker loss' },
    { body: 'IBF', direction: 'down', positions: 1, note: 'Slipped from #11 after inactivity penalty' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🌍" title="World Rankings" subtitle="WBC, WBA, WBO, IBF heavyweight rankings with Marcus highlighted." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="WBC" value={`#${fighter.rankings.wbc}`} sub="Heavyweight" color="green" />
        <StatCard label="WBA" value={`#${fighter.rankings.wba}`} sub="Heavyweight" color="red" />
        <StatCard label="WBO" value={`#${fighter.rankings.wbo}`} sub="Heavyweight" color="blue" />
        <StatCard label="IBF" value={`#${fighter.rankings.ibf}`} sub="Heavyweight" color="orange" />
      </div>

      {/* 5-Column Rankings (incl. Zuffa) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {Object.entries(rankings).map(([body, fighters]) => (
          <div key={body} className="bg-[#0D1117] border border-gray-800 rounded-xl p-4">
            <div className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${body === 'WBC' ? 'bg-green-500' : body === 'WBA' ? 'bg-red-500' : body === 'WBO' ? 'bg-blue-500' : 'bg-orange-500'}`}></span>
              {body} Heavyweight
            </div>
            <div className="space-y-1">
              {fighters.slice(0, 8).map((f, i) => (
                <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${f.isMarcus ? 'bg-red-900/20 border border-red-600/30' : 'hover:bg-gray-800/50'}`}>
                  <span className="text-gray-500 w-4 text-right font-mono">{i + 1}</span>
                  <span className="text-sm">{f.country}</span>
                  <span className={`flex-1 truncate ${f.isMarcus ? 'text-red-400 font-bold' : 'text-gray-300'}`}>{f.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Zuffa Boxing Column */}
        <div className="bg-[#0D1117] border border-yellow-600/50 rounded-xl p-4" style={{ background: 'linear-gradient(160deg, rgba(17,13,0,0.9), #0D1117)' }}>
          <div className="text-sm font-bold mb-1 flex items-center gap-2" style={{ color: '#FBBF24' }}>
            ⚡ ZUFFA BOXING
          </div>
          <div className="text-[10px] text-gray-500 mb-3">Promotional rankings</div>

          {/* Champion */}
          <div className="px-2 py-2 rounded text-xs bg-yellow-900/20 border border-yellow-700/30 mb-3">
            <div className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider mb-1">HW Champion</div>
            <div className="text-yellow-300 font-bold">VACANT</div>
            <div className="text-[10px] text-gray-500">No HW title established yet</div>
          </div>

          {/* Signed fighters */}
          <div className="text-[10px] text-gray-500 font-semibold mb-2 uppercase tracking-wider">Signed Fighters</div>
          <div className="space-y-1 mb-4">
            {[
              { name: 'Conor Benn', country: '🇬🇧' },
              { name: 'Jai Opetaia', country: '🇦🇺' },
              { name: 'Efe Ajagba', country: '🇳🇬' },
              { name: 'Callum Walsh', country: '🇺🇸' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-gray-800/50">
                <span className="text-gray-500 w-4 text-right font-mono">{i + 1}</span>
                <span className="text-sm">{f.country}</span>
                <span className="flex-1 truncate text-gray-300">{f.name}</span>
              </div>
            ))}
          </div>

          {/* Marcus status */}
          <div className="px-2 py-2 rounded text-xs bg-gray-800/50 border border-gray-700/50 mb-3">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Marcus Cole</div>
            <div className="text-gray-500 font-bold">NOT RANKED</div>
            <div className="text-[10px] text-gray-600">Not signed with Zuffa</div>
          </div>

          <div className="text-[10px] text-yellow-400/70 text-center cursor-pointer hover:text-yellow-300 transition-colors">
            ⚡ One-fight offer — see Contract Tracker
          </div>
        </div>
      </div>

      {/* Ranking Movements */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Recent Ranking Movements</div>
        <div className="space-y-2">
          {movements.map((m, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50">
              <div className="flex items-center gap-3">
                <span className={`text-sm ${m.direction === 'up' ? 'text-green-400' : m.direction === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
                  {m.direction === 'up' ? '▲' : m.direction === 'down' ? '▼' : '—'}
                </span>
                <span className="text-xs text-white font-medium">{m.body}</span>
                {m.positions > 0 && <span className={`text-xs ${m.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>{m.positions} position{m.positions > 1 ? 's' : ''}</span>}
              </div>
              <span className="text-xs text-gray-500">{m.note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Zuffa Boxing Explainer */}
      <div className="bg-[#0D1117] border border-yellow-600/40 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <span className="text-2xl">⚡</span>
          <div>
            <div className="text-sm font-bold text-yellow-300 mb-2">What Zuffa Boxing means for Marcus's career</div>
            <div className="text-xs text-gray-400 leading-relaxed mb-4">
              Zuffa Boxing — the boxing division backed by TKO Group Holdings (UFC parent) — operates on a one-fight deal model rather than traditional multi-fight exclusive contracts. This means fighters retain freedom but receive no guaranteed fight pipeline. Zuffa has signed marquee names including Conor Benn and Jai Opetaia, and broadcasts on ESPN+ and ESPN.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-green-900/10 border border-green-800/30 rounded-lg p-3">
                <div className="text-green-400 font-bold mb-1">Upside for Marcus</div>
                <div className="text-gray-400">Highest single-fight fee available. No long-term lock-in. Access to US market and ESPN audience.</div>
              </div>
              <div className="bg-red-900/10 border border-red-800/30 rounded-lg p-3">
                <div className="text-red-400 font-bold mb-1">Risk for Marcus</div>
                <div className="text-gray-400">No ranking within Zuffa (no titles yet). Could jeopardise WBC/WBA mandatory position. Matchroom first-option clause complication.</div>
              </div>
              <div className="bg-yellow-900/10 border border-yellow-800/30 rounded-lg p-3">
                <div className="text-yellow-400 font-bold mb-1">Current Status</div>
                <div className="text-gray-400">NOT SIGNED. One-fight approach received (~£2.1M offer). Under review by Danny Walsh. Response due within 30 days.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0D1117] border border-yellow-600/20 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-1">🏆 Undisputed Tracker — Heavyweight Division</div>
        <div className="text-xs text-gray-400 mb-4">4 belts needed — current holder status and mandatory timelines</div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { belt: 'WBC', champion: 'Tyson Fury', flag: '🇬🇧', record: '34-1-1', mandatoryNext: 'Zhang (ordered)', marcusRanking: '#5', timelineTo: '~24 months', color: 'border-green-600/30 bg-green-900/10' },
            { belt: 'WBA', champion: 'Oleksandr Usyk', flag: '🇺🇦', record: '22-0', mandatoryNext: 'Vacant (Super)', marcusRanking: '#9', timelineTo: '~30 months', color: 'border-purple-600/30 bg-purple-900/10' },
            { belt: 'WBO', champion: 'Oleksandr Usyk', flag: '🇺🇦', record: '22-0', mandatoryNext: 'Dubois or Anderson', marcusRanking: '#5', timelineTo: '~18 months', color: 'border-blue-600/30 bg-blue-900/10' },
            { belt: 'IBF', champion: 'Daniel Dubois', flag: '🇬🇧', record: '22-2', mandatoryNext: 'Hrgovic (Jun 2026)', marcusRanking: '#12', timelineTo: '~36 months', color: 'border-red-600/30 bg-red-900/10' },
          ].map(b => (
            <div key={b.belt} className={`border ${b.color} rounded-xl p-4`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-yellow-400">{b.belt}</span>
                <span className="text-xs text-gray-500">Marcus: {b.marcusRanking}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{b.flag}</span>
                <div>
                  <div className="text-sm text-white font-medium">{b.champion}</div>
                  <div className="text-xs text-gray-400">{b.record}</div>
                </div>
              </div>
              <div className="text-[10px] text-gray-500">Mandatory: {b.mandatoryNext}</div>
              <div className="text-[10px] text-teal-400 mt-1">Est. path: {b.timelineTo}</div>
            </div>
          ))}
        </div>
        <div className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">Marcus Cole&apos;s Fastest Path to Undisputed</div>
        <div className="space-y-2">
          {[
            { step: 1, action: 'Beat Petrov (WBC #3)', timeline: 'May 2026', result: 'Move to WBC #3 / WBO #2', status: 'upcoming' },
            { step: 2, action: 'WBC Eliminator vs Zhang or #4', timeline: 'Q4 2026', result: 'WBC Mandatory contender', status: 'future' },
            { step: 3, action: 'WBO Title shot (Usyk or successor)', timeline: '2027', result: 'First belt — WBO Champion', status: 'future' },
            { step: 4, action: 'Unification — WBC/WBO', timeline: '2027-28', result: 'Two-belt holder', status: 'future' },
            { step: 5, action: 'Undisputed — all 4 belts', timeline: '2028-29', result: '🏆 Undisputed Heavyweight Champion', status: 'goal' },
          ].map(s => (
            <div key={s.step} className={`flex items-center gap-3 p-2.5 rounded-lg ${s.status==='upcoming'?'bg-red-900/20 border border-red-600/20':s.status==='goal'?'bg-yellow-900/20 border border-yellow-600/20':'bg-[#0a0c14] border border-gray-800'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.status==='upcoming'?'bg-red-600 text-white':s.status==='goal'?'bg-yellow-600 text-black':'bg-gray-700 text-gray-400'}`}>{s.step}</div>
              <div className="flex-1">
                <div className="text-xs text-white font-medium">{s.action}</div>
                <div className="text-[10px] text-gray-500">{s.result}</div>
              </div>
              <div className="text-[10px] text-gray-500 flex-shrink-0">{s.timeline}</div>
            </div>
          ))}
        </div>
      </div>
      <BoxingAISection context="rankings" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── MANDATORY TRACKER VIEW ───────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function MandatoryTrackerView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const mandatories = [
    { body: 'WBC', champion: 'Tyson Fury', mandatory: 'Zhilei Zhang (#2)', status: 'Ordered', deadline: 'Sep 2026', relevance: 'If Zhang wins, creates opening at #2. If Fury vacates, #1 vs #2 for vacant.' },
    { body: 'WBA', champion: 'Oleksandr Usyk', mandatory: 'Daniel Dubois (#2)', status: 'Negotiations', deadline: 'Jul 2026', relevance: 'Dubois rematch clause active. Marcus needs to be #5 or higher to enter eliminators.' },
    { body: 'WBO', champion: 'Oleksandr Usyk', mandatory: 'Tyson Fury (#2)', status: 'Rematch clause', deadline: 'Aug 2026', relevance: 'If Fury loses again, Marcus at #5 could enter eliminator for mandatory spot.' },
    { body: 'IBF', champion: 'Daniel Dubois', mandatory: 'Filip Hrgovic (#2)', status: 'Purse bid', deadline: 'Jun 2026', relevance: 'Long path — Marcus at #12 needs 2-3 top wins to reach mandatory position.' },
  ];

  const eliminators = [
    { body: 'WBC', fight: '#4 Bakole vs #5 Hrgovic', date: 'May 10, 2026', significance: 'Winner likely gets mandatory shot. If both ranked fighters lose stock, opens door for Marcus.' },
    { body: 'WBO', fight: '#3 Zhang vs #4 Anderson', date: 'Jun 2026 (TBD)', significance: 'Winner enters mandatory queue. Marcus at #5 could be called for eliminator if one withdraws.' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📋" title="Mandatory Tracker" subtitle="Track mandatory obligations, eliminators, and sanctioning body deadlines." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="WBC Status" value={`#${fighter.rankings.wbc}`} sub="2 wins from mandatory" color="green" />
        <StatCard label="WBA Status" value={`#${fighter.rankings.wba}`} sub="Needs top-5 finish" color="red" />
        <StatCard label="WBO Status" value={`#${fighter.rankings.wbo}`} sub="Closest to shot" color="blue" />
        <StatCard label="IBF Status" value={`#${fighter.rankings.ibf}`} sub="Long-term project" color="orange" />
      </div>

      {/* Mandatory Status */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Current Mandatory Obligations</div>
        <div className="space-y-3">
          {mandatories.map((m, i) => (
            <div key={i} className="p-4 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm text-white font-medium">{m.body} — Champion: {m.champion}</div>
                  <div className="text-xs text-gray-400">Mandatory Challenger: {m.mandatory}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  m.status === 'Ordered' ? 'bg-red-600/20 text-red-400' :
                  m.status === 'Negotiations' ? 'bg-yellow-600/20 text-yellow-400' :
                  'bg-blue-600/20 text-blue-400'
                }`}>{m.status}</span>
              </div>
              <div className="text-xs text-gray-500">Deadline: {m.deadline}</div>
              <div className="text-xs text-gray-400 mt-1"><span className="text-teal-400 font-medium">Marcus relevance:</span> {m.relevance}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Eliminators */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Upcoming Eliminators</div>
        <div className="space-y-3">
          {eliminators.map((e, i) => (
            <div key={i} className="p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-white font-medium">{e.body}: {e.fight}</div>
                <span className="text-xs text-gray-400">{e.date}</span>
              </div>
              <div className="text-xs text-gray-400">{e.significance}</div>
            </div>
          ))}
        </div>
      </div>
      <BoxingAISection context="rankings" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── PATH TO TITLE VIEW ──────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PathToTitleView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const pathSteps = [
    { step: 1, fight: 'Viktor Petrov (WBC #3)', date: 'May 22, 2026', importance: 'Must-win to crack top 3 across all bodies', outcome: 'Win → WBC #3, WBO #3 projected', status: 'scheduled' },
    { step: 2, fight: 'WBC Eliminator (vs #2 or #4)', date: 'Oct/Nov 2026', importance: 'Official eliminator for mandatory position', outcome: 'Win → WBC mandatory challenger', status: 'projected' },
    { step: 3, fight: 'WBC Mandatory Title Shot', date: 'Q1 2027', importance: 'First world title fight', outcome: 'Win → WBC Heavyweight Champion', status: 'projected' },
  ];

  const alternativePaths = [
    { body: 'WBO', path: 'Beat Petrov → Enter WBO eliminator vs Anderson (#4) → WBO mandatory', timeline: '12-18 months', likelihood: 'High' },
    { body: 'WBA', path: 'Beat Petrov → Top-5 win → WBA eliminator → mandatory', timeline: '18-24 months', likelihood: 'Medium' },
    { body: 'IBF', path: 'Beat Petrov → 2 more top-10 wins → IBF eliminator', timeline: '24+ months', likelihood: 'Low' },
    { body: 'Shortcut', path: 'Voluntary defence offer from any champion wanting a "winnable" fight', timeline: 'Could happen anytime', likelihood: 'Possible' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🏆" title="Path to Title" subtitle="Mapped route to a world heavyweight championship fight." />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Fights to Title" value="2-3" sub="Best case scenario" color="red" />
        <StatCard label="Fastest Route" value="WBC" sub="Currently #6 — need top 3" color="green" />
        <StatCard label="Timeline" value="10-14mo" sub="If everything goes to plan" color="blue" />
      </div>

      {/* Primary Path */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Primary Path — WBC Route</div>
        <div className="space-y-4">
          {pathSteps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step.status === 'scheduled' ? 'bg-red-600/30 border border-red-500 text-red-400' : 'bg-gray-800 border border-gray-700 text-gray-400'}`}>{step.step}</div>
                {i < pathSteps.length - 1 && <div className="w-0.5 h-8 bg-gray-800 mt-1"></div>}
              </div>
              <div className="flex-1 pb-4">
                <div className="text-sm text-white font-medium">{step.fight}</div>
                <div className="text-xs text-gray-400">{step.date} — {step.importance}</div>
                <div className="text-xs text-teal-400 mt-1">{step.outcome}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alternative Paths */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Alternative Title Paths</div>
        <div className="space-y-3">
          {alternativePaths.map((path, i) => (
            <div key={i} className="p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-white font-medium">{path.body}</div>
                <div className="flex gap-2">
                  <span className="text-xs text-gray-400">{path.timeline}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    path.likelihood === 'High' ? 'bg-green-600/20 text-green-400' :
                    path.likelihood === 'Medium' ? 'bg-yellow-600/20 text-yellow-400' :
                    path.likelihood === 'Possible' ? 'bg-blue-600/20 text-blue-400' :
                    'bg-gray-600/20 text-gray-400'
                  }`}>{path.likelihood}</span>
                </div>
              </div>
              <div className="text-xs text-gray-400">{path.path}</div>
            </div>
          ))}
        </div>
      </div>
      <BoxingAISection context="rankings" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── PURSE BID ALERTS VIEW ────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PurseBidAlertsView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const [purseBid, setPurseBid] = useState(3000000);
  const [isChampion, setIsChampion] = useState(false);

  const challengerShare = isChampion ? 0.75 : 0.25;
  const marcusGross = purseBid * challengerShare;
  const agentCut = marcusGross * 0.15;
  const trainerCut = marcusGross * 0.10;
  const campcosts = 120000;
  const netEstimate = marcusGross - agentCut - trainerCut - campcosts;

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🔔" title="Purse Bid Tracker" subtitle="WBC/WBA/WBO/IBF mandatory proceedings and real-time purse split calculator" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="WBC Mandatory" value="Ordered" sub="#3 vs #5 by Q4 2026" color="green" />
        <StatCard label="WBO Mandatory" value="Upcoming" sub="Dubois eliminator Jun" color="yellow" />
        <StatCard label="Floor %" value="25%" sub="Challenger minimum" color="orange" />
        <StatCard label="Current Best" value="WBO #5" sub="Best route to mandatory" color="teal" />
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">💷 Purse Bid Simulator</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-500 mb-2">Total Purse (£)</div>
              <input type="range" min={500000} max={20000000} step={250000} value={purseBid}
                onChange={e => setPurseBid(Number(e.target.value))}
                className="w-full accent-red-500"/>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>£500k</span>
                <span className="text-white font-bold text-sm">£{(purseBid/1000000).toFixed(2)}M</span>
                <span>£20M</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-2">Marcus&apos;s Role</div>
              <div className="flex gap-2">
                <button onClick={() => setIsChampion(false)} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${!isChampion ? 'bg-red-600 text-white' : 'border border-gray-700 text-gray-400'}`}>Challenger (25% floor)</button>
                <button onClick={() => setIsChampion(true)} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${isChampion ? 'bg-red-600 text-white' : 'border border-gray-700 text-gray-400'}`}>Champion (75% floor)</button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Marcus Gross', value: marcusGross, color: 'text-white', bold: false },
              { label: 'Agent (15%)', value: -agentCut, color: 'text-red-400', bold: false },
              { label: 'Trainer (10%)', value: -trainerCut, color: 'text-red-400', bold: false },
              { label: 'Est. Camp Costs', value: -campcosts, color: 'text-red-400', bold: false },
              { label: 'NET ESTIMATE', value: netEstimate, color: 'text-green-400', bold: true },
            ].map(row => (
              <div key={row.label} className={`flex justify-between py-2 ${row.bold ? 'border-t border-gray-700 pt-3' : 'border-b border-gray-800/50'}`}>
                <span className="text-xs text-gray-400">{row.label}</span>
                <span className={`text-sm ${row.bold ? 'font-bold' : 'font-medium'} ${row.color}`}>
                  {row.value < 0 ? '-' : ''}£{Math.abs(row.value).toLocaleString('en-GB', {maximumFractionDigits:0})}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Active Mandatory Proceedings</div>
        <div className="space-y-3">
          {[
            { belt: 'WBC', matchup: 'Cole (#5) vs Zhang (#2)', status: 'Ordered', deadline: 'Q4 2026', notes: 'WBC executive committee voted May 2026. 60 days to negotiate, then purse bid.', urgent: false },
            { belt: 'WBO', matchup: 'Cole (#5) vs Anderson (#4)', status: 'Possible', deadline: 'Dubois must defend first', notes: 'If Dubois beats Hrgovic in June, eliminator between #4 and #5 likely ordered Q3 2026.', urgent: false },
          ].map((p, i) => (
            <div key={i} className={`p-4 rounded-xl border ${p.urgent ? 'border-red-600/30 bg-red-900/10' : 'border-gray-700 bg-[#0a0c14]'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded">{p.belt}</span>
                  <span className="text-sm text-white font-medium">{p.matchup}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${p.status==='Ordered'?'bg-green-600/20 text-green-400':'bg-gray-600/20 text-gray-400'}`}>{p.status}</span>
              </div>
              <div className="text-xs text-gray-400 mb-1">Deadline: {p.deadline}</div>
              <div className="text-xs text-gray-500">{p.notes}</div>
            </div>
          ))}
        </div>
      </div>
      <BoxingAISection context="financial" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── CAREER PLANNING VIEW ─────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function BoxingCareerPlanningView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const [horizon, setHorizon] = useState<'1'|'3'|'5'|'10'>('1')
  const STATS = [{ value: `#${fighter.rankings.wbo}`, label: 'WBO Ranking', sub: 'Super Middleweight' },{ value: '#4', label: 'Career High', sub: 'WBC — Oct 2025' },{ value: '2018', label: 'Turned Pro', sub: '8 years in the game' },{ value: `${fighter.record.wins}-${fighter.record.losses}`, label: 'Pro Record', sub: `${fighter.record.ko} KOs` }]
  const GOALS: Record<string, { goal: string; target: string; status: string; progress: number; color: string }[]> = {
    '1': [{ goal: 'Win WBO Super Middleweight title', target: 'Nov 2026', status: 'Mandatory challenger', progress: 75, color: '#ef4444' },{ goal: 'Mandatory WBC challenger status', target: 'Dec 2026', status: 'Currently #7', progress: 65, color: '#a855f7' },{ goal: 'DAZN PPV headliner — 500k buys', target: 'Nov 2026', status: 'In negotiations', progress: 55, color: '#f59e0b' },{ goal: 'Reach 500k social followers', target: 'Dec 2026', status: '312k now', progress: 62, color: '#0ea5e9' },{ goal: 'Secure £300k+ fight purse', target: 'Nov 2026', status: '£180k last fight', progress: 60, color: '#22c55e' }],
    '3': [{ goal: 'Win two of four major world titles', target: 'Dec 2028', status: 'On track', progress: 40, color: '#ef4444' },{ goal: 'Undisputed contender', target: 'Dec 2028', status: 'In progress', progress: 35, color: '#facc15' },{ goal: '£2M career earnings', target: 'Dec 2028', status: '£740k to date', progress: 37, color: '#22c55e' },{ goal: 'Headline O2 Arena', target: 'Dec 2027', status: 'Target confirmed', progress: 45, color: '#a855f7' },{ goal: '£500k sponsorship/yr', target: 'Dec 2028', status: 'UA £120k/yr', progress: 24, color: '#0ea5e9' }],
    '5': [{ goal: 'Undisputed champion', target: 'Dec 2030', status: 'Career target', progress: 20, color: '#ef4444' },{ goal: '£5M career earnings', target: 'Dec 2030', status: '£740k to date', progress: 15, color: '#22c55e' },{ goal: 'Legacy fight — Vegas or Saudi', target: 'Dec 2030', status: 'Long-term', progress: 10, color: '#f59e0b' },{ goal: 'Launch boxing academy', target: 'Dec 2029', status: 'Planning', progress: 12, color: '#a855f7' },{ goal: '2M social followers', target: 'Dec 2030', status: '312k now', progress: 16, color: '#0ea5e9' }],
    '10': [{ goal: 'Hall of fame — 3+ world titles', target: 'Dec 2035', status: 'Life goal', progress: 8, color: '#facc15' },{ goal: 'Move up to Light Heavy', target: 'Dec 2033', status: 'Future plan', progress: 5, color: '#ef4444' },{ goal: '£20M career earnings', target: 'Dec 2035', status: 'Long-term', progress: 4, color: '#22c55e' },{ goal: 'Promote own shows', target: 'Dec 2035', status: 'Future ambition', progress: 5, color: '#a855f7' },{ goal: 'Media / commentary career', target: 'Dec 2035', status: 'Long-term', progress: 3, color: '#0ea5e9' }],
  }
  const SEASON = [{ goal: 'Win WBO mandatory vs Petrov', detail: 'Fight confirmed — May 2026', progress: 75, color: '#ef4444' },{ goal: 'Improve WBC ranking to top 5', detail: 'Currently #7 WBO, #6 WBC', progress: 60, color: '#a855f7' },{ goal: 'Land £250k+ sponsorship deal', detail: 'UA renewal + new partner', progress: 40, color: '#f59e0b' },{ goal: 'Camp discipline — no weight issues', detail: 'Cut protocol in place', progress: 80, color: '#22c55e' },{ goal: 'Grow DAZN audience 40%', detail: '2.1M last PPV — target 3M', progress: 35, color: '#0ea5e9' }]
  const TIMELINE = [{ year: '2018', event: 'Turned pro — first 4-rounder, TKO2' },{ year: '2019', event: 'Unbeaten run — 8-0, signed by Danny Walsh' },{ year: '2020', event: 'First 10-rounder — UD win, national TV debut' },{ year: '2021', event: 'First loss — SD defeat, valuable learning' },{ year: '2022', event: 'Comeback — 6 straight wins, all by stoppage' },{ year: '2023', event: 'International debut — won WBO European title' },{ year: '2024', event: 'Career high WBC #4 — DAZN deal signed' },{ year: '2025', event: 'WBO mandatory challenger confirmed' }]
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white mb-1">🚀 Career Planning</h1><p className="text-xs text-gray-500">1-year, 3-year, 5-year and 10-year goals with progress tracking.</p></div>
      <div className="grid grid-cols-4 gap-3">{STATS.map((s, i) => (<div key={i} className="rounded-xl p-4 text-center" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}><div className="text-xl font-black" style={{ color: '#dc2626' }}>{s.value}</div><div className="text-[11px] text-white font-semibold mt-1">{s.label}</div><div className="text-[10px] text-gray-500">{s.sub}</div></div>))}</div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
        <div className="flex border-b border-gray-800">{(['1','3','5','10'] as const).map(h => (<button key={h} onClick={() => setHorizon(h)} className="flex-1 py-3 text-sm font-semibold transition-all" style={{ borderBottom: horizon === h ? '2px solid #dc2626' : '2px solid transparent', color: horizon === h ? '#fff' : '#6B7280', background: horizon === h ? 'rgba(220,38,38,0.06)' : 'transparent' }}>{h} Year</button>))}</div>
        <div className="p-5 space-y-4">{GOALS[horizon].map((g, i) => (<div key={i}><div className="flex items-center justify-between mb-1"><span className="text-sm text-white font-semibold">{g.goal}</span><div className="flex items-center gap-2"><span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${g.color}20`, color: g.color }}>{g.status}</span><span className="text-[10px] text-gray-500">{g.target}</span></div></div><div className="w-full bg-gray-800 rounded-full h-2"><div className="h-2 rounded-full transition-all" style={{ width: `${g.progress}%`, backgroundColor: g.color }} /></div></div>))}</div>
      </div>
      <div className="rounded-xl p-5" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}><div className="text-sm font-bold text-white mb-4">2026 Season Goals</div><div className="space-y-3">{SEASON.map((s, i) => (<div key={i}><div className="flex items-center justify-between mb-1"><span className="text-xs text-white">{s.goal}</span><span className="text-[10px] text-gray-500">{s.detail}</span></div><div className="w-full bg-gray-800 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width: `${s.progress}%`, backgroundColor: s.color }} /></div></div>))}</div></div>
      <div className="rounded-xl p-5" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}><div className="text-sm font-bold text-white mb-4">Career Timeline</div><div className="relative pl-6"><div className="absolute left-2 top-0 bottom-0 w-px" style={{ backgroundColor: '#dc262640' }} />{TIMELINE.map((t, i) => (<div key={i} className="relative mb-4 last:mb-0"><div className="absolute -left-4 top-1 w-2 h-2 rounded-full" style={{ backgroundColor: '#dc2626' }} /><div className="flex items-baseline gap-3"><span className="text-xs font-bold" style={{ color: '#dc2626' }}>{t.year}</span><span className="text-sm text-gray-300">{t.event}</span></div></div>))}</div></div>
      <BoxingAISection context="rankings" fighter={fighter} session={session} />
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── PURSE SIMULATOR VIEW ─────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PurseSimulatorView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const [headlinePurse, setHeadlinePurse] = useState(800000);
  const [managerFee, setManagerFee] = useState(25);
  const [trainerFee, setTrainerFee] = useState(12);
  const [cutmanFee, setCutmanFee] = useState(2.5);
  const [sanctioningFee, setSanctioningFee] = useState(3.5);
  const [campCosts, setCampCosts] = useState(35500);
  const [taxRate, setTaxRate] = useState(45);
  const [jurisdiction, setJurisdiction] = useState('uk');

  const JURISDICTIONS: { id: string; label: string; flag: string; rate: number; note?: string }[] = [
    { id: 'uk',      label: 'UK',           flag: '🇬🇧', rate: 45 },
    { id: 'usa',     label: 'USA',          flag: '🇺🇸', rate: 30, note: '30% federal withholding + state tax may apply' },
    { id: 'saudi',   label: 'Saudi Arabia', flag: '🇸🇦', rate: 0,  note: 'KSA: 0% local tax — but UK residents pay worldwide income tax. HMRC will still assess this.' },
    { id: 'germany', label: 'Germany',      flag: '🇩🇪', rate: 42 },
    { id: 'uae',     label: 'UAE',          flag: '🇦🇪', rate: 0,  note: 'UAE: 0% local tax — UK residents remain liable for worldwide income under HMRC rules.' },
  ];

  const selectedJurisdiction = JURISDICTIONS.find(j => j.id === jurisdiction) ?? JURISDICTIONS[0];
  const effectiveTaxRate = selectedJurisdiction.rate;

  const managerAmount = headlinePurse * (managerFee / 100);
  const trainerAmount = headlinePurse * (trainerFee / 100);
  const cutmanAmount = headlinePurse * (cutmanFee / 100);
  const sanctioningAmount = headlinePurse * (sanctioningFee / 100);
  const totalDeductions = managerAmount + trainerAmount + cutmanAmount + sanctioningAmount + campCosts;
  const preProfit = headlinePurse - totalDeductions;
  const activeTaxRate = (jurisdiction === 'saudi' || jurisdiction === 'uae') ? 45 : (jurisdiction === 'uk' ? taxRate : effectiveTaxRate);
  const taxAmount = preProfit * (activeTaxRate / 100);
  const estimatedBank = preProfit - taxAmount;
  const keepPercentage = ((estimatedBank / headlinePurse) * 100).toFixed(1);

  const formatCurrency = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="💷" title="Purse Simulator" subtitle="Interactive fight purse calculator — see exactly what lands in your bank account." />

      {/* Jurisdiction Selector */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-400 mb-3">Fight Jurisdiction</div>
        <div className="flex flex-wrap gap-2">
          {JURISDICTIONS.map(j => (
            <button
              key={j.id}
              onClick={() => setJurisdiction(j.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${jurisdiction === j.id ? 'bg-red-600/20 border border-red-600/50 text-red-300' : 'bg-gray-800/50 border border-gray-700 text-gray-400 hover:border-gray-600'}`}
            >
              <span>{j.flag}</span>
              <span>{j.label}</span>
              <span className={`text-[10px] ${jurisdiction === j.id ? 'text-red-400' : 'text-gray-600'}`}>{j.rate}% tax</span>
            </button>
          ))}
        </div>
        {selectedJurisdiction.note && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-yellow-900/10 border border-yellow-700/30">
            <span className="text-yellow-400 text-sm shrink-0">⚠</span>
            <span className="text-xs text-yellow-300/80">{selectedJurisdiction.note}</span>
          </div>
        )}
      </div>

      {/* Saudi/UAE comparison card */}
      {(jurisdiction === 'saudi' || jurisdiction === 'uae') && (
        <div className="bg-[#0D1117] border border-yellow-700/40 rounded-xl p-5">
          <div className="text-sm font-bold text-yellow-300 mb-4">Same £5M fight — different locations</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { location: '🇬🇧 UK Fight', tax: 45, note: 'Home crowd, DAZN broadcast' },
              { location: jurisdiction === 'saudi' ? '🇸🇦 Riyadh Season' : '🇦🇪 UAE Fight', tax: 45, note: 'UK resident — HMRC worldwide income applies' },
              { location: '🌍 If domiciled abroad', tax: 0, note: 'Only if Marcus genuinely relocates — complex planning' },
            ].map((loc, i) => {
              const purse5m = 5000000;
              const mgr5 = purse5m * (managerFee / 100);
              const trn5 = purse5m * (trainerFee / 100);
              const cut5 = purse5m * (cutmanFee / 100);
              const san5 = purse5m * (sanctioningFee / 100);
              const pre5 = purse5m - mgr5 - trn5 - cut5 - san5 - campCosts;
              const tax5 = pre5 * (loc.tax / 100);
              const net5 = pre5 - tax5;
              return (
                <div key={i} className={`rounded-lg p-4 ${i === 2 ? 'bg-green-900/10 border border-green-800/30' : 'bg-gray-800/30 border border-gray-700/50'}`}>
                  <div className="text-xs font-bold text-white mb-1">{loc.location}</div>
                  <div className="text-xs text-gray-500 mb-3">{loc.note}</div>
                  <div className="text-lg font-black text-green-400">{formatCurrency(Math.max(0, net5))}</div>
                  <div className="text-[10px] text-gray-500">net from £5M purse</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Headline Result */}
      <div className="bg-gradient-to-r from-red-900/40 via-[#0D1117] to-green-900/30 border border-red-600/20 rounded-xl p-6 text-center">
        <div className="text-sm text-gray-400 mb-1">Estimated Bank Deposit</div>
        <div className="text-5xl font-bold text-white mb-2">{formatCurrency(Math.max(0, estimatedBank))}</div>
        <div className="text-sm text-gray-500">
          You keep <span className="text-red-400 font-bold">{keepPercentage}%</span> of your {formatCurrency(headlinePurse)} headline purse
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-4">Adjust Parameters</div>
          <div className="space-y-5">
            {/* Headline Purse */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Headline Purse</span>
                <span className="text-white font-bold">{formatCurrency(headlinePurse)}</span>
              </div>
              <input type="range" min={50000} max={5000000} step={50000} value={headlinePurse} onChange={e => setHeadlinePurse(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-red-500" />
              <div className="flex justify-between text-[10px] text-gray-600"><span>£50k</span><span>£5m</span></div>
            </div>
            {/* Manager Fee */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Manager Fee ({fighter.manager})</span>
                <span className="text-white font-bold">{managerFee}% = {formatCurrency(managerAmount)}</span>
              </div>
              <input type="range" min={0} max={35} step={0.5} value={managerFee} onChange={e => setManagerFee(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-red-500" />
            </div>
            {/* Trainer Fee */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Trainer Fee ({fighter.trainer})</span>
                <span className="text-white font-bold">{trainerFee}% = {formatCurrency(trainerAmount)}</span>
              </div>
              <input type="range" min={0} max={20} step={0.5} value={trainerFee} onChange={e => setTrainerFee(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-red-500" />
            </div>
            {/* Cutman Fee */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Cutman Fee ({fighter.cutman})</span>
                <span className="text-white font-bold">{cutmanFee}% = {formatCurrency(cutmanAmount)}</span>
              </div>
              <input type="range" min={0} max={5} step={0.5} value={cutmanFee} onChange={e => setCutmanFee(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-red-500" />
            </div>
            {/* Sanctioning Fee */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Sanctioning Fee</span>
                <span className="text-white font-bold">{sanctioningFee}% = {formatCurrency(sanctioningAmount)}</span>
              </div>
              <input type="range" min={0} max={10} step={0.5} value={sanctioningFee} onChange={e => setSanctioningFee(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-red-500" />
            </div>
            {/* Camp Costs */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Camp Costs Total</span>
                <span className="text-white font-bold">{formatCurrency(campCosts)}</span>
              </div>
              <input type="range" min={5000} max={200000} step={500} value={campCosts} onChange={e => setCampCosts(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-red-500" />
            </div>
            {/* Tax Rate */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Tax Rate {jurisdiction !== 'uk' && <span className="text-yellow-400">({selectedJurisdiction.flag} {selectedJurisdiction.label})</span>}</span>
                <span className="text-white font-bold">{activeTaxRate}% = {formatCurrency(taxAmount)}</span>
              </div>
              {jurisdiction === 'uk' ? (
                <input type="range" min={0} max={55} step={1} value={taxRate} onChange={e => setTaxRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-red-500" />
              ) : (
                <div className="text-[10px] text-gray-500 mt-1">Rate locked by jurisdiction selector — change above to override</div>
              )}
            </div>
          </div>
        </div>

        {/* Deduction Breakdown */}
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-4">Deduction Breakdown</div>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-sm text-white font-bold">Headline Purse</span>
              <span className="text-sm text-white font-bold">{formatCurrency(headlinePurse)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-xs text-gray-400">Manager Fee ({managerFee}%)</span>
              <span className="text-xs text-red-400">-{formatCurrency(managerAmount)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-xs text-gray-400">Trainer Fee ({trainerFee}%)</span>
              <span className="text-xs text-red-400">-{formatCurrency(trainerAmount)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-xs text-gray-400">Cutman Fee ({cutmanFee}%)</span>
              <span className="text-xs text-red-400">-{formatCurrency(cutmanAmount)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-xs text-gray-400">Sanctioning Fee ({sanctioningFee}%)</span>
              <span className="text-xs text-red-400">-{formatCurrency(sanctioningAmount)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-xs text-gray-400">Camp Costs</span>
              <span className="text-xs text-red-400">-{formatCurrency(campCosts)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-800">
              <span className="text-xs text-gray-300 font-medium">Pre-Tax Profit</span>
              <span className="text-xs text-white font-medium">{formatCurrency(preProfit)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-xs text-gray-400">Tax ({activeTaxRate}% — {selectedJurisdiction.flag} {selectedJurisdiction.label})</span>
              <span className="text-xs text-red-400">-{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-red-600/30 bg-red-900/10 rounded-lg px-3 mt-2">
              <span className="text-sm text-white font-bold">ESTIMATED BANK DEPOSIT</span>
              <span className="text-sm text-green-400 font-bold">{formatCurrency(Math.max(0, estimatedBank))}</span>
            </div>
          </div>

          {/* Quick Compare */}
          <div className="mt-6">
            <div className="text-xs font-semibold text-gray-400 mb-3">Quick Compare — Other Purse Levels</div>
            <div className="space-y-1">
              {[200000, 500000, 800000, 1500000, 3000000].map(purse => {
                const mgr = purse * (managerFee / 100);
                const trn = purse * (trainerFee / 100);
                const cut = purse * (cutmanFee / 100);
                const san = purse * (sanctioningFee / 100);
                const pre = purse - mgr - trn - cut - san - campCosts;
                const tax = pre * (taxRate / 100);
                const net = pre - tax;
                return (
                  <div key={purse} className={`flex justify-between py-1.5 text-xs ${purse === headlinePurse ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                    <span>{formatCurrency(purse)} purse</span>
                    <span>{formatCurrency(Math.max(0, net))} net ({((net / purse) * 100).toFixed(0)}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <BoxingAISection context="financial" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── FIGHT EARNINGS VIEW ──────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function FightEarningsView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const earnings = [
    { fight: 'vs Dillian White', date: 'Nov 2025', purse: 450000, bonuses: 25000, ppv: 0, net: 148500, venue: 'AO Arena, Manchester' },
    { fight: 'vs Derek Chisora', date: 'Jul 2025', purse: 200000, bonuses: 10000, ppv: 0, net: 68250, venue: 'Copper Box, London' },
    { fight: 'vs Nathan Gorman', date: 'Mar 2025', purse: 120000, bonuses: 5000, ppv: 0, net: 42750, venue: 'Utilita Arena, Sheffield' },
    { fight: 'vs Tom Little', date: 'Dec 2024', purse: 75000, bonuses: 0, ppv: 0, net: 28500, venue: 'York Hall, London' },
    { fight: 'vs David Allen', date: 'Sep 2024', purse: 60000, bonuses: 5000, ppv: 0, net: 23250, venue: 'Motorpoint Arena, Cardiff' },
    { fight: 'vs Sam Jones (L)', date: 'Jun 2024', purse: 50000, bonuses: 0, ppv: 0, net: 18000, venue: 'SSE Arena, Wembley' },
  ];

  const totalPurse = earnings.reduce((a, e) => a + e.purse, 0);
  const totalNet = earnings.reduce((a, e) => a + e.net, 0);

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="💰" title="Fight Earnings" subtitle="Historical purse breakdown and career earnings tracker." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Career Gross" value={`£${(totalPurse / 1000).toFixed(0)}k`} sub="Total purses" color="red" />
        <StatCard label="Career Net" value={`£${(totalNet / 1000).toFixed(0)}k`} sub="After all deductions" color="green" />
        <StatCard label="Last Fight" value="£450k" sub="vs White — Nov 2025" color="blue" />
        <StatCard label="Next Projected" value="£800k" sub="vs Petrov — May 2026" color="yellow" />
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Fight Earnings History</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-3">Fight</th>
                <th className="text-left py-2 pr-3">Date</th>
                <th className="text-right py-2 pr-3">Purse</th>
                <th className="text-right py-2 pr-3">Bonuses</th>
                <th className="text-right py-2 pr-3">Net (Est)</th>
                <th className="text-left py-2">Venue</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((e, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="py-2.5 pr-3 text-white font-medium">{e.fight}</td>
                  <td className="py-2.5 pr-3 text-gray-400">{e.date}</td>
                  <td className="py-2.5 pr-3 text-right text-gray-300">£{e.purse.toLocaleString()}</td>
                  <td className="py-2.5 pr-3 text-right text-gray-400">£{e.bonuses.toLocaleString()}</td>
                  <td className="py-2.5 pr-3 text-right text-green-400 font-medium">£{e.net.toLocaleString()}</td>
                  <td className="py-2.5 text-gray-500">{e.venue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Earnings Trend */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Purse Growth Trajectory</div>
        <div className="flex items-end gap-3 h-40">
          {earnings.slice().reverse().map((e, i) => {
            const max = 450000;
            const h = (e.purse / max) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[9px] text-gray-400">£{(e.purse / 1000).toFixed(0)}k</div>
                <div className={`w-full rounded-t ${e.purse === 50000 ? 'bg-red-500/60' : 'bg-red-500/40'}`} style={{ height: `${h}%` }}></div>
                <div className="text-[9px] text-gray-600 truncate w-full text-center">{e.date}</div>
              </div>
            );
          })}
        </div>
      </div>
      <BoxingAISection context="financial" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── CAMP COSTS VIEW ──────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function CampCostsView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const costs = [
    { category: 'Sparring Partners', budget: 12000, spent: 5200, remaining: 6800, notes: '4 partners, various rates' },
    { category: 'Gym Rental', budget: 3500, spent: 1600, remaining: 1900, notes: 'Private gym — 10 weeks' },
    { category: 'Trainer (Jim Bevan)', budget: 6000, spent: 2600, remaining: 3400, notes: 'Fixed camp fee' },
    { category: 'Strength & Conditioning', budget: 2500, spent: 1100, remaining: 1400, notes: 'Greg Mayfield' },
    { category: 'Nutritionist', budget: 2000, spent: 900, remaining: 1100, notes: 'Dr. Priya Kapoor' },
    { category: 'Physio', budget: 3000, spent: 1300, remaining: 1700, notes: 'Liam Brennan — 3x/week' },
    { category: 'Accommodation', budget: 2500, spent: 1100, remaining: 1400, notes: 'Camp base — Sheffield' },
    { category: 'Food & Supplements', budget: 2000, spent: 900, remaining: 1100, notes: 'Meal prep service + supps' },
    { category: 'Travel', budget: 1000, spent: 400, remaining: 600, notes: 'London ↔ Sheffield' },
    { category: 'Miscellaneous', budget: 1000, spent: 300, remaining: 700, notes: 'Equipment, tape, etc.' },
  ];

  const totalBudget = costs.reduce((a, c) => a + c.budget, 0);
  const totalSpent = costs.reduce((a, c) => a + c.spent, 0);

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🧾" title="Camp Costs" subtitle="Line-by-line camp expenditure tracking and budget management." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Budget" value={`£${(totalBudget / 1000).toFixed(1)}k`} sub="10-week camp" color="blue" />
        <StatCard label="Spent to Date" value={`£${(totalSpent / 1000).toFixed(1)}k`} sub={`Day ${fighter.camp_day} of ${fighter.camp_total}`} color="red" />
        <StatCard label="Remaining" value={`£${((totalBudget - totalSpent) / 1000).toFixed(1)}k`} sub={`${Math.round((totalSpent / totalBudget) * 100)}% used`} color="green" />
        <StatCard label="Daily Burn Rate" value={`£${Math.round(totalSpent / fighter.camp_day)}`} sub="Average per camp day" color="yellow" />
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Camp Cost Breakdown</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-3">Category</th>
                <th className="text-right py-2 pr-3">Budget</th>
                <th className="text-right py-2 pr-3">Spent</th>
                <th className="text-right py-2 pr-3">Remaining</th>
                <th className="text-center py-2 pr-3">%</th>
                <th className="text-left py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {costs.map((c, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="py-2.5 pr-3 text-white font-medium">{c.category}</td>
                  <td className="py-2.5 pr-3 text-right text-gray-300">£{c.budget.toLocaleString()}</td>
                  <td className="py-2.5 pr-3 text-right text-red-400">£{c.spent.toLocaleString()}</td>
                  <td className="py-2.5 pr-3 text-right text-green-400">£{c.remaining.toLocaleString()}</td>
                  <td className="py-2.5 pr-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      (c.spent / c.budget) > 0.6 ? 'bg-yellow-600/20 text-yellow-400' : 'bg-green-600/20 text-green-400'
                    }`}>{Math.round((c.spent / c.budget) * 100)}%</span>
                  </td>
                  <td className="py-2.5 text-gray-500">{c.notes}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-700">
                <td className="py-2.5 pr-3 text-white font-bold">TOTAL</td>
                <td className="py-2.5 pr-3 text-right text-white font-bold">£{totalBudget.toLocaleString()}</td>
                <td className="py-2.5 pr-3 text-right text-red-400 font-bold">£{totalSpent.toLocaleString()}</td>
                <td className="py-2.5 pr-3 text-right text-green-400 font-bold">£{(totalBudget - totalSpent).toLocaleString()}</td>
                <td className="py-2.5 pr-3 text-center text-white font-bold">{Math.round((totalSpent / totalBudget) * 100)}%</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <BoxingAISection context="financial" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── TAX TRACKER VIEW ─────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TaxTrackerView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const taxYear = {
    year: '2025/26',
    grossIncome: 685000,
    allowableDeductions: 95500,
    taxableIncome: 589500,
    taxDue: 239025,
    paidToDate: 180000,
    outstanding: 59025,
    deadline: 'Jan 31, 2027',
  };

  const deductions = [
    { item: 'Camp costs (2 camps)', amount: 62000 },
    { item: 'Travel & accommodation', amount: 12500 },
    { item: 'Equipment & gear', amount: 3500 },
    { item: 'Insurance premiums', amount: 8500 },
    { item: 'Professional memberships', amount: 1500 },
    { item: 'Accountant fees', amount: 4500 },
    { item: 'Medical expenses', amount: 3000 },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📊" title="Tax Tracker" subtitle="Self-assessment tracker, deductions log, and payment schedule." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Gross Income" value={`£${(taxYear.grossIncome / 1000).toFixed(0)}k`} sub={taxYear.year} color="blue" />
        <StatCard label="Tax Due" value={`£${(taxYear.taxDue / 1000).toFixed(0)}k`} sub="Estimated" color="red" />
        <StatCard label="Paid" value={`£${(taxYear.paidToDate / 1000).toFixed(0)}k`} sub="Payments on account" color="green" />
        <StatCard label="Outstanding" value={`£${(taxYear.outstanding / 1000).toFixed(0)}k`} sub={`Due ${taxYear.deadline}`} color="yellow" />
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Tax Calculation — {taxYear.year}</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-2 border-b border-gray-800">
            <span className="text-gray-300">Gross Income</span><span className="text-white font-bold">£{taxYear.grossIncome.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-400">Less: Allowable Deductions</span><span className="text-red-400">-£{taxYear.allowableDeductions.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2 border-t border-gray-800">
            <span className="text-gray-300 font-medium">Taxable Income</span><span className="text-white font-medium">£{taxYear.taxableIncome.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-400">Income Tax + NI</span><span className="text-red-400">-£{taxYear.taxDue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-400">Paid on Account</span><span className="text-green-400">£{taxYear.paidToDate.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-3 border-t-2 border-red-600/30 bg-red-900/10 rounded-lg px-3">
            <span className="text-white font-bold">Outstanding Balance</span><span className="text-yellow-400 font-bold">£{taxYear.outstanding.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Allowable Deductions Claimed</div>
        <div className="space-y-2">
          {deductions.map((d, i) => (
            <div key={i} className="flex justify-between py-1.5 border-b border-gray-800/50 text-xs">
              <span className="text-gray-300">{d.item}</span>
              <span className="text-gray-400">£{d.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <BoxingAISection context="financial" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── TEAM OVERVIEW VIEW ───────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TeamOverviewView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const team = [
    { name: 'Jim Bevan', role: 'Head Trainer', phone: '+44 7700 900123', email: 'jim.bevan@boxingcoach.co.uk', responsibilities: 'All technical training, pad work, fight strategy, corner management, sparring oversight', since: '2021' },
    { name: 'Danny Walsh', role: 'Manager', phone: '+44 7700 900456', email: 'danny@walshmanagement.com', responsibilities: 'Fight negotiations, career planning, contract management, media deals, TV negotiations', since: '2020' },
    { name: 'Mick Williamson', role: 'Cutman', phone: '+44 7700 900789', email: 'mick.cuts@gmail.com', responsibilities: 'Corner work (cuts/swelling), pre-fight wrapping, vaseline application, fight night support', since: '2022' },
    { name: 'Greg Mayfield', role: 'Strength & Conditioning', phone: '+44 7700 900234', email: 'greg@mayfieldfitness.com', responsibilities: 'Strength programming, power development, conditioning, camp periodisation', since: '2022' },
    { name: 'Dr. Priya Kapoor', role: 'Nutritionist', phone: '+44 7700 900567', email: 'priya@sportsnutrition.co.uk', responsibilities: 'Meal planning, weight management, supplement protocol, fight week nutrition, rehydration strategy', since: '2023' },
    { name: 'Liam Brennan', role: 'Physiotherapist', phone: '+44 7700 900890', email: 'liam.brennan@physio.uk', responsibilities: 'Injury prevention, soft tissue therapy, rehabilitation, mobility work, recovery protocols', since: '2022' },
    { name: 'Sarah Chen', role: 'PR & Media Manager', phone: '+44 7700 900345', email: 'sarah@chenmedia.com', responsibilities: 'Press conferences, social media strategy, interview scheduling, brand partnerships, crisis comms', since: '2024' },
    { name: 'David Park', role: 'Accountant', phone: '+44 7700 900678', email: 'david@parkcpa.co.uk', responsibilities: 'Tax returns, financial planning, purse accounting, expense management, company structure', since: '2021' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="👥" title="Team Overview" subtitle={`${team.length} team members supporting Marcus "The Machine" Cole.`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Team Size" value={team.length} sub="Active members" color="red" />
        <StatCard label="Head Trainer" value="Jim Bevan" sub="Since 2021" color="orange" />
        <StatCard label="Manager" value="Danny Walsh" sub="Since 2020" color="blue" />
        <StatCard label="Monthly Cost" value="~£8.5k" sub="Team retainers" color="yellow" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.map((member, i) => (
          <div key={i} className="bg-[#0D1117] border border-gray-800 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-sm text-white font-bold">{member.name}</div>
                <div className="text-xs text-red-400 font-medium">{member.role}</div>
              </div>
              <span className="text-[10px] text-gray-500">Since {member.since}</span>
            </div>
            <div className="text-xs text-gray-400 mb-3">{member.responsibilities}</div>
            <div className="flex gap-4 text-[10px]">
              <span className="text-gray-500">{member.phone}</span>
              <span className="text-teal-400">{member.email}</span>
            </div>
          </div>
        ))}
      </div>
      <BoxingAISection context="default" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── FIGHTER BRIEFING VIEW ────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function FighterBriefingView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const briefingItems = [
    { section: 'Camp Status', content: `Day ${fighter.camp_day} of ${fighter.camp_total}. Entering specific phase. All systems on track. Weight at ${fighter.current_weight}kg (target ${fighter.target_weight}kg). Recovery score 81%. No injuries of concern.` },
    { section: 'This Week\'s Focus', content: 'Transition to opponent-specific sparring. Increase sparring rounds from 26 to 30. Focus on body-head combinations and lateral movement. Drill clinch exits and uppercut counters.' },
    { section: 'Key Numbers', content: 'Weight: 97.8kg (on target). Body fat: 11.2%. VO2 Max: 54.2. Power output: 612 PSI avg. HRV: 62ms (good). Sleep: 7.8hrs avg.' },
    { section: 'Opposition Update', content: 'Petrov confirmed training camp in Big Bear, California. Working with new conditioning coach. Recent sparring footage shows he\'s working on body shots — unusual for him. His team are confident.' },
    { section: 'Commercial Obligations', content: 'DAZN promo shoot — April 12. Sky Sports interview — April 15. Social media content day — April 18. Press conference (London) — May 8. Weigh-in — May 21.' },
    { section: 'Flag', content: 'Right shoulder tightness has improved with treatment but monitoring closely. Liam (physio) recommends reducing overhead strength work for next 7 days.' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📄" title="Fighter Briefing" subtitle="Structured daily briefing document for Marcus and the team." />

      <div className="bg-gradient-to-r from-red-900/30 via-[#0D1117] to-gray-900 border border-red-600/20 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-bold text-white">Daily Fighter Briefing</div>
            <div className="text-xs text-gray-400">April 4, 2026 — Camp Day {fighter.camp_day} — {fighter.next_fight.days_away} days to fight</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Prepared by: Team Cole</div>
            <div className="text-xs text-gray-600">Classification: Team Only</div>
          </div>
        </div>

        <div className="space-y-4">
          {briefingItems.map((item, i) => (
            <div key={i} className="p-4 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="text-sm text-red-400 font-semibold mb-2">{item.section}</div>
              <div className="text-sm text-gray-300 leading-relaxed">{item.content}</div>
            </div>
          ))}
        </div>
      </div>
      <BoxingAISection context="dashboard" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── TRAINER NOTES VIEW ───────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TrainerNotesView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const notes = [
    { date: 'April 4, 2026', category: 'Sparring', content: 'Excellent session with Hughes today. Marcus is reading the jab better and slipping right effectively. The body-head combination we drilled on pads is now translating to live sparring. Need to keep hands higher after throwing the right hand — leaving himself open for the counter. This is something Petrov will exploit.' },
    { date: 'April 3, 2026', category: 'Pads', content: 'Power session on pads. 12 rounds focused on counter punching off the back foot. Left hook to the body is landing with real venom. Introduced a new pull counter right hand — Marcus picked it up quickly. Will need 2-3 more sessions before it becomes instinctive.' },
    { date: 'April 2, 2026', category: 'Technical', content: 'Worked on clinch exits for 4 rounds. Marcus is getting better at establishing head position first, but still needs to work on the uppercut on entry. Added feint patterns — double jab, feint right, left hook body — this combination will be money against Petrov.' },
    { date: 'April 1, 2026', category: 'Strategy', content: 'Film session reviewing Petrov vs Sanchez (his only loss). Key takeaway: Sanchez used lateral movement and body shots to tire Petrov. By round 8, Petrov was flat-footed and easy to hit. Our game plan should mirror this approach — make him miss, make him pay, and invest in the body early.' },
    { date: 'March 31, 2026', category: 'Assessment', content: 'Mid-camp assessment. Marcus is in the best shape of his career. Power: 9/10. Speed: 8/10. Cardio: 8/10. Defence: 7.5/10. Ring IQ: 8.5/10. Areas to improve in remaining camp: Defensive responsibility after combinations. Clinch work. Championship round intensity.' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📝" title="Trainer Notes" subtitle={`Jim Bevan's training diary and technical observations.`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Camp Assessment" value="8.2/10" sub="Mid-camp average" color="green" />
        <StatCard label="Power Rating" value="9/10" sub="Excellent" color="red" />
        <StatCard label="Key Focus" value="Defence" sub="After combinations" color="yellow" />
        <StatCard label="Notes This Week" value={notes.length} sub="Detailed entries" color="blue" />
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Training Diary — Jim Bevan</div>
        <div className="space-y-4">
          {notes.map((note, i) => (
            <div key={i} className="p-4 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-mono">{note.date}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    note.category === 'Sparring' ? 'bg-red-600/20 text-red-400' :
                    note.category === 'Pads' ? 'bg-orange-600/20 text-orange-400' :
                    note.category === 'Technical' ? 'bg-blue-600/20 text-blue-400' :
                    note.category === 'Strategy' ? 'bg-purple-600/20 text-purple-400' :
                    'bg-teal-600/20 text-teal-400'
                  }`}>{note.category}</span>
                </div>
              </div>
              <div className="text-sm text-gray-300 leading-relaxed">{note.content}</div>
            </div>
          ))}
        </div>
      </div>
      <BoxingAISection context="training" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── MANAGER DASHBOARD VIEW ───────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ManagerDashboardView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const fightOffers = [
    { opponent: 'Viktor Petrov', purse: '£800,000', broadcast: 'DAZN PPV', venue: 'O2 Arena, London', status: 'SIGNED', date: 'May 22, 2026', notes: 'WBC eliminator implications' },
    { opponent: 'Zhilei Zhang', purse: '£1,200,000 (projected)', broadcast: 'DAZN / ESPN', venue: 'TBD', status: 'Informal enquiry', date: 'Q4 2026', notes: 'If Marcus beats Petrov — massive fight' },
    { opponent: 'Jared Anderson', purse: '£500,000', broadcast: 'DAZN', venue: 'USA (MSG or Barclays)', status: 'Declined', date: 'N/A', notes: 'Timing wrong — mid Petrov camp' },
  ];

  const commercialPipeline = [
    { brand: 'Under Armour', deal: 'Kit sponsorship renewal', value: '£75,000/yr', status: 'Negotiating', deadline: 'May 2026' },
    { brand: 'Bulk Powders', deal: 'Supplement endorsement', value: '£25,000/yr', status: 'Signed', deadline: 'Active' },
    { brand: 'Sky Sports', deal: 'Pundit appearances (off-season)', value: '£2,500/appearance', status: 'Open offer', deadline: 'Ongoing' },
    { brand: 'Betfair', deal: 'Ambassador role', value: '£40,000/yr', status: 'In discussions', deadline: 'Jun 2026' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="💼" title="Manager Dashboard" subtitle={`Danny Walsh's management overview for Marcus Cole.`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Next Fight Purse" value="£800k" sub="vs Petrov — signed" color="red" />
        <StatCard label="Annual Earnings (proj)" value="£1.2m" sub="Fight purses + commercial" color="green" />
        <StatCard label="Fight Offers" value="3" sub="1 signed, 1 enquiry, 1 declined" color="blue" />
        <StatCard label="Sponsor Pipeline" value="4 deals" sub="£140k+ annual value" color="yellow" />
      </div>

      {/* Fight Offers */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Fight Offers & Negotiations</div>
        <div className="space-y-3">
          {fightOffers.map((offer, i) => (
            <div key={i} className={`p-4 bg-[#0a0c14] border rounded-lg ${offer.status === 'SIGNED' ? 'border-green-600/30' : offer.status === 'Declined' ? 'border-gray-800 opacity-50' : 'border-gray-800'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm text-white font-medium">vs {offer.opponent}</div>
                  <div className="text-xs text-gray-400">{offer.venue} — {offer.broadcast}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300 font-medium">{offer.purse}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    offer.status === 'SIGNED' ? 'bg-green-600/20 text-green-400' :
                    offer.status === 'Declined' ? 'bg-red-600/20 text-red-400' :
                    'bg-yellow-600/20 text-yellow-400'
                  }`}>{offer.status}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500">{offer.date} — {offer.notes}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Commercial Pipeline */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Commercial Pipeline</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-3">Brand</th>
                <th className="text-left py-2 pr-3">Deal</th>
                <th className="text-right py-2 pr-3">Value</th>
                <th className="text-center py-2 pr-3">Status</th>
                <th className="text-left py-2">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {commercialPipeline.map((deal, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="py-2.5 pr-3 text-white font-medium">{deal.brand}</td>
                  <td className="py-2.5 pr-3 text-gray-300">{deal.deal}</td>
                  <td className="py-2.5 pr-3 text-right text-green-400">{deal.value}</td>
                  <td className="py-2.5 pr-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      deal.status === 'Signed' ? 'bg-green-600/20 text-green-400' :
                      deal.status === 'Negotiating' ? 'bg-yellow-600/20 text-yellow-400' :
                      'bg-blue-600/20 text-blue-400'
                    }`}>{deal.status}</span>
                  </td>
                  <td className="py-2.5 text-gray-500">{deal.deadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <BoxingAISection context="financial" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── SPONSORSHIPS VIEW ────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SponsorshipsView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const sponsors = [
    { brand: 'Under Armour', type: 'Kit & Apparel', value: '£65,000/yr', start: 'Jan 2024', end: 'Dec 2026', deliverables: '4 social posts/month, ring walk kit, photoshoot x2/yr', status: 'Active' },
    { brand: 'Bulk Powders', type: 'Supplement Partner', value: '£25,000/yr', start: 'Mar 2025', end: 'Feb 2027', deliverables: '2 social posts/month, product use in camp content', status: 'Active' },
    { brand: 'DAZN', type: 'Broadcast Partner', value: 'Included in fight deal', start: 'N/A', end: 'Per fight', deliverables: 'Embedded content, training camp access, behind-the-scenes', status: 'Active' },
    { brand: 'Betfair', type: 'Betting Ambassador', value: '£40,000/yr (pending)', start: 'TBD', end: 'TBD', deliverables: 'Social media, press day appearances, branded content', status: 'Negotiating' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🤝" title="Sponsorships" subtitle="Active and pipeline brand partnerships." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Sponsors" value="3" sub="Under Armour, Bulk, DAZN" color="red" />
        <StatCard label="Annual Value" value="£90k+" sub="Confirmed deals" color="green" />
        <StatCard label="Pipeline" value="1" sub="Betfair — in talks" color="yellow" />
        <StatCard label="Social Following" value="245k" sub="Instagram primary" color="blue" />
      </div>

      <div className="space-y-4">
        {sponsors.map((s, i) => (
          <div key={i} className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm text-white font-bold">{s.brand}</div>
                <div className="text-xs text-red-400">{s.type}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-400 font-medium">{s.value}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${s.status === 'Active' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>{s.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div><span className="text-gray-500">Start:</span> <span className="text-gray-300">{s.start}</span></div>
              <div><span className="text-gray-500">End:</span> <span className="text-gray-300">{s.end}</span></div>
              <div><span className="text-gray-500">Deliverables:</span> <span className="text-gray-300">{s.deliverables}</span></div>
            </div>
          </div>
        ))}
      </div>
      <BoxingAISection context="sponsorship" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── MEDIA OBLIGATIONS VIEW ───────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function MediaObligationsView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const obligations = [
    { date: 'Apr 12', event: 'DAZN Promo Shoot', location: 'DAZN Studios, London', duration: '3 hours', type: 'Broadcast', notes: 'Fight promo package, 30-sec trailer, social clips', status: 'Confirmed' },
    { date: 'Apr 15', event: 'Sky Sports Interview', location: 'Sky Studios, Isleworth', duration: '45 min', type: 'TV', notes: 'Pre-fight feature for Sky Sports Boxing show', status: 'Confirmed' },
    { date: 'Apr 18', event: 'Social Media Content Day', location: 'Training camp (Sheffield)', duration: '2 hours', type: 'Social', notes: 'Behind-the-scenes content, training clips, Q&A', status: 'Confirmed' },
    { date: 'Apr 25', event: 'Boxing News Interview', location: 'Phone/Zoom', duration: '30 min', type: 'Print', notes: 'Cover story feature for May edition', status: 'Pending' },
    { date: 'May 1', event: 'IFL TV Interview', location: 'Matchroom HQ', duration: '20 min', type: 'YouTube', notes: 'Fight preview, prediction discussion', status: 'Pending' },
    { date: 'May 8', event: 'Press Conference', location: 'Hilton Park Lane, London', duration: 'Half day', type: 'Major Event', notes: 'Official fight press conference with face-off', status: 'Confirmed' },
    { date: 'May 19', event: 'Open Workout', location: 'Boxpark, Wembley', duration: '2 hours', type: 'Public', notes: 'Public workout, fan meet & greet, media access', status: 'Confirmed' },
    { date: 'May 21', event: 'Weigh-In', location: 'O2 Arena', duration: 'Full day', type: 'Major Event', notes: 'Official weigh-in, face-off, last press duties', status: 'Confirmed' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📱" title="Media Obligations" subtitle="Scheduled press, interviews, and promotional commitments." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Obligations" value={obligations.length} sub="Pre-fight schedule" color="red" />
        <StatCard label="Confirmed" value={obligations.filter(o => o.status === 'Confirmed').length} sub="Locked in" color="green" />
        <StatCard label="Pending" value={obligations.filter(o => o.status === 'Pending').length} sub="Awaiting confirmation" color="yellow" />
        <StatCard label="Next Up" value="Apr 12" sub="DAZN Promo Shoot" color="blue" />
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Media Schedule — Fight Camp</div>
        <div className="space-y-3">
          {obligations.map((ob, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="text-xs font-mono text-gray-500 w-14">{ob.date}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-white font-medium">{ob.event}</div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    ob.type === 'Major Event' ? 'bg-red-600/20 text-red-400' :
                    ob.type === 'Broadcast' ? 'bg-purple-600/20 text-purple-400' :
                    ob.type === 'TV' ? 'bg-blue-600/20 text-blue-400' :
                    'bg-gray-600/20 text-gray-400'
                  }`}>{ob.type}</span>
                </div>
                <div className="text-xs text-gray-400">{ob.location} — {ob.duration}</div>
                <div className="text-xs text-gray-500 mt-0.5">{ob.notes}</div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${ob.status === 'Confirmed' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>{ob.status}</span>
            </div>
          ))}
        </div>
      </div>
      <BoxingAISection context="sponsorship" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── APPEARANCE FEES VIEW ─────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AppearanceFeesView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const appearances = [
    { event: 'Charity Gala — Help for Heroes', date: 'Feb 8, 2026', fee: '£3,500', type: 'Charity', notes: 'After-dinner speech, photo ops, auction item signing', status: 'Completed' },
    { event: 'Betfair Launch Event', date: 'Jan 22, 2026', fee: '£5,000', type: 'Corporate', notes: 'Brand ambassador appearance, 2-hour commitment', status: 'Completed' },
    { event: 'Fitness Expo (NEC)', date: 'Mar 1, 2026', fee: '£4,000', type: 'Expo', notes: 'Meet & greet, signing session, panel discussion', status: 'Completed' },
    { event: 'Matchroom Boxing Awards', date: 'Jun 15, 2026', fee: '£0 (promotional)', type: 'Industry', notes: 'Networking, table appearance, promotional value', status: 'Confirmed' },
    { event: 'Under Armour Store Opening', date: 'Jul 2026', fee: '£6,000', type: 'Sponsor', notes: 'Store appearance, signing, social content', status: 'Pending' },
  ];

  const totalEarned = 12500;
  const totalPipeline = 6000;

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🎤" title="Appearance Fees" subtitle="Paid appearances, corporate events, and personal bookings." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Earned (YTD)" value={`£${(totalEarned / 1000).toFixed(1)}k`} sub="3 completed" color="green" />
        <StatCard label="Pipeline" value={`£${(totalPipeline / 1000).toFixed(0)}k`} sub="2 upcoming" color="yellow" />
        <StatCard label="Standard Rate" value="£4-6k" sub="Per appearance" color="blue" />
        <StatCard label="This Year" value="5" sub="Appearances booked" color="red" />
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Appearance Log</div>
        <div className="space-y-3">
          {appearances.map((a, i) => (
            <div key={i} className="p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <div className="text-sm text-white font-medium">{a.event}</div>
                  <div className="text-xs text-gray-400">{a.date}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-400 font-medium">{a.fee}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    a.status === 'Completed' ? 'bg-green-600/20 text-green-400' :
                    a.status === 'Confirmed' ? 'bg-blue-600/20 text-blue-400' :
                    'bg-yellow-600/20 text-yellow-400'
                  }`}>{a.status}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500">{a.type} — {a.notes}</div>
            </div>
          ))}
        </div>
      </div>
      <BoxingAISection context="sponsorship" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── CONTRACT TRACKER VIEW ────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ContractTrackerView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const contracts = [
    { title: 'Matchroom Promotional Agreement', counterparty: 'Matchroom Sport', type: 'Promotional', start: 'Jan 2024', end: 'Dec 2027', fights: '6-fight deal (3 remaining)', value: 'Per-fight basis', status: 'Active', keyTerms: '3 fights remaining. Matchroom has first option on all UK fights. DAZN broadcast rights included.' },
    { title: 'Management Agreement', counterparty: 'Danny Walsh / Walsh Management', type: 'Management', start: 'Jun 2020', end: 'Jun 2028', fights: 'All fights', value: '25% of purse', status: 'Active', keyTerms: '8-year deal with 2-year renewal option. Covers all fight purses, commercial income split negotiable.' },
    { title: 'Training Agreement', counterparty: 'Jim Bevan', type: 'Trainer', start: 'Mar 2021', end: 'Rolling', fights: 'Per-camp basis', value: '12% of purse + camp retainer', status: 'Active', keyTerms: 'Rolling agreement. Either party can terminate with 30-day notice. Camp retainer £6,000 regardless of purse %.' },
    { title: 'Under Armour Sponsorship', counterparty: 'Under Armour UK', type: 'Sponsorship', start: 'Jan 2024', end: 'Dec 2026', fights: 'N/A', value: '£65,000/yr', status: 'Renewal due', keyTerms: 'Exclusive kit deal. Must wear UA for all training content and ring walks. Renewal discussions opening.' },
    { title: 'BBBofC Licence', counterparty: 'British Boxing Board of Control', type: 'Licence', start: 'Jan 2026', end: 'Dec 2026', fights: 'All UK fights', value: '£800/yr', status: 'Active', keyTerms: 'Annual professional boxing licence. Requires annual medical and brain scan.' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📑" title="Contract Tracker" subtitle="All active agreements, expiry dates, and key terms." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Contracts" value={contracts.filter(c => c.status === 'Active').length} sub="Currently binding" color="green" />
        <StatCard label="Renewals Due" value={contracts.filter(c => c.status === 'Renewal due').length} sub="Action required" color="yellow" />
        <StatCard label="Matchroom Deal" value="3 fights" sub="Remaining on deal" color="red" />
        <StatCard label="Mgmt Contract" value="Jun 2028" sub="Danny Walsh" color="blue" />
      </div>

      <div className="space-y-4">
        {contracts.map((c, i) => (
          <div key={i} className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm text-white font-bold">{c.title}</div>
                <div className="text-xs text-gray-400">{c.counterparty} — {c.type}</div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${c.status === 'Active' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>{c.status}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
              <div><span className="text-gray-500">Start:</span> <span className="text-gray-300">{c.start}</span></div>
              <div><span className="text-gray-500">End:</span> <span className="text-gray-300">{c.end}</span></div>
              <div><span className="text-gray-500">Fights:</span> <span className="text-gray-300">{c.fights}</span></div>
              <div><span className="text-gray-500">Value:</span> <span className="text-green-400">{c.value}</span></div>
            </div>
            <div className="text-xs text-gray-500 p-2 bg-[#0a0c14] rounded border border-gray-800">{c.keyTerms}</div>
          </div>
        ))}
      </div>

      {/* Contract Type Guide */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Contract Type Guide</div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { type: 'Multi-Fight Exclusive', example: "Marcus's deal", desc: 'Traditional model. Promoter controls next 4-10 fights.', color: 'text-blue-400', bg: 'bg-blue-900/10 border-blue-800/40' },
            { type: 'One-Fight Deal', example: 'Zuffa approach', desc: 'Single fight, massive upfront fee, no ongoing obligation.', color: 'text-yellow-400', bg: 'bg-yellow-900/10 border-yellow-800/40' },
            { type: 'Co-Promotion', example: 'World title unifications', desc: 'Two promoters share a fight. Common for world title unification.', color: 'text-purple-400', bg: 'bg-purple-900/10 border-purple-800/40' },
            { type: 'Riyadh Season Direct', example: 'Saudi GEA', desc: 'Saudi GEA direct commission. Highest single-fight fees.', color: 'text-green-400', bg: 'bg-green-900/10 border-green-800/40' },
          ].map((ct, i) => (
            <div key={i} className={`rounded-lg p-4 border ${ct.bg}`}>
              <div className={`text-xs font-bold mb-1 ${ct.color}`}>{ct.type}</div>
              <div className="text-[10px] text-gray-500 mb-2 italic">{ct.example}</div>
              <div className="text-xs text-gray-400">{ct.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Zuffa Offer Alert */}
      <div className="bg-yellow-900/10 border border-yellow-600/40 rounded-xl p-5 flex items-start gap-4">
        <span className="text-2xl">⚡</span>
        <div>
          <div className="text-sm font-bold text-yellow-300 mb-1">Zuffa Boxing Approach — Action Required</div>
          <div className="text-xs text-yellow-200/70">Danny Walsh has flagged a Zuffa Boxing approach — one-fight offer estimated at £2.1M. This is a one-fight deal with no ongoing promotional obligation. Decision required before current Matchroom contract window closes.</div>
        </div>
      </div>

      {/* Matchroom vs Zuffa Comparison */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Matchroom vs Zuffa Boxing — Side-by-Side Comparison</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-2 pr-4 text-gray-500 font-medium">Factor</th>
                <th className="text-left py-2 pr-4 text-gray-300 font-bold">Matchroom</th>
                <th className="text-left py-2 text-yellow-300 font-bold">⚡ Zuffa Boxing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {[
                { factor: 'Purse', matchroom: '£450k–£800k per fight', zuffa: '£2.1M one-fight fee' },
                { factor: 'Take-Home (est.)', matchroom: '~£148k–£260k net', zuffa: '~£690k net (45% tax)' },
                { factor: 'Ranking Benefits', matchroom: 'DAZN exposure, UK market leader', zuffa: 'Global reach, UFC fanbase crossover' },
                { factor: 'Career Pathway', matchroom: 'Structured route to world title shot', zuffa: 'No guaranteed next fight' },
                { factor: 'Breach Risk', matchroom: 'Low — existing relationship', zuffa: 'HIGH — may breach Matchroom first option clause' },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="py-2 pr-4 text-gray-500">{row.factor}</td>
                  <td className="py-2 pr-4 text-gray-300">{row.matchroom}</td>
                  <td className="py-2 text-yellow-200">{row.zuffa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manager Note */}
      <div className="bg-[#0D1117] border border-gray-700 rounded-xl p-5 flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm shrink-0">DW</div>
        <div>
          <div className="text-xs font-bold text-white mb-0.5">Danny Walsh — Manager Note</div>
          <div className="text-xs text-gray-400 italic">"The money is real but the contract risk is very real too. If we take this Zuffa fight without Matchroom sign-off we could be looking at an injunction. We need to read the first-option clause very carefully before we respond."</div>
        </div>
      </div>

      {/* Contract Expiry Countdown */}
      <div className="bg-[#0D1117] border border-red-800/40 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-white mb-1">Matchroom Contract Expiry</div>
            <div className="text-xs text-gray-400">Estimated contract end: December 2027 — 3 fights remaining</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-red-400">~21</div>
            <div className="text-[10px] text-gray-500">months remaining</div>
          </div>
        </div>
        <div className="mt-3 w-full bg-gray-800 rounded-full h-2">
          <div className="bg-red-500 h-2 rounded-full" style={{ width: '50%' }}></div>
        </div>
        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
          <span>Jan 2024 (signed)</span>
          <span>Dec 2027 (expires)</span>
        </div>
      </div>
      <BoxingAISection context="financial" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── FIGHT RECORD VIEW ────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function FightRecordView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const [debrief, setDebrief] = useState<{performance_rating: string; strengths: string; weaknesses: string; gps_insight: string; next_camp_focus: string} | null>(null);
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [selectedFight, setSelectedFight] = useState('vs White (Nov 2025)');

  const generateDebrief = async () => {
    setDebriefLoading(true);
    try {
      const response = await fetch('/api/ai/boxing', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:600,
          messages:[{role:'user',content:`Post-fight debrief for Marcus Cole (22-1 Heavyweight). Fight: ${selectedFight}. CompuBox: 224/498 (45%) jabs 82/188 power 142/310. Notes: Strong body work, managed southpaw, slight wobble R6. Camp GPS data showed 40% centre ring time (target 45%), ACWR peaked 1.31. Generate analytical debrief. Respond ONLY in JSON: {"performance_rating":"X/10 — brief label","strengths":"2 sentences","weaknesses":"2 sentences","gps_insight":"1 sentence on what GPS ring data suggests about the performance","next_camp_focus":"1 sentence priority for next camp"}`}]
        })
      });
      const data = await response.json();
      setDebrief(JSON.parse(data.content[0].text));
    } catch { console.error('Debrief failed'); }
    finally { setDebriefLoading(false); }
  };

  const record = [
    { no: 23, date: '2025-11-15', opponent: 'Dillian White', oppRecord: '29-4', result: 'W', method: 'KO R6', rounds: '6/12', title: '', venue: 'AO Arena, Manchester' },
    { no: 22, date: '2025-07-19', opponent: 'Derek Chisora', oppRecord: '35-13', result: 'W', method: 'UD', rounds: '10/10', title: '', venue: 'Copper Box, London' },
    { no: 21, date: '2025-03-08', opponent: 'Nathan Gorman', oppRecord: '21-2', result: 'W', method: 'TKO R8', rounds: '8/10', title: '', venue: 'Utilita Arena, Sheffield' },
    { no: 20, date: '2024-12-07', opponent: 'Tom Little', oppRecord: '12-10', result: 'W', method: 'KO R3', rounds: '3/8', title: '', venue: 'York Hall, London' },
    { no: 19, date: '2024-09-21', opponent: 'David Allen', oppRecord: '23-6', result: 'W', method: 'TKO R5', rounds: '5/10', title: '', venue: 'Motorpoint Arena, Cardiff' },
    { no: 18, date: '2024-06-01', opponent: 'Sam Jones', oppRecord: '18-2', result: 'L', method: 'SD', rounds: '10/10', title: '', venue: 'SSE Arena, Wembley' },
    { no: 17, date: '2024-03-16', opponent: 'Fabio Wardley', oppRecord: '16-0', result: 'W', method: 'KO R9', rounds: '9/12', title: 'British Title', venue: 'O2 Arena, London' },
    { no: 16, date: '2023-12-09', opponent: 'Alen Babic', oppRecord: '12-1', result: 'W', method: 'TKO R4', rounds: '4/10', title: '', venue: 'Wembley Arena, London' },
    { no: 15, date: '2023-09-23', opponent: 'David Adeleye', oppRecord: '10-0', result: 'W', method: 'KO R7', rounds: '7/10', title: '', venue: 'OVO Arena, London' },
    { no: 14, date: '2023-06-10', opponent: 'Kash Ali', oppRecord: '20-3', result: 'W', method: 'UD', rounds: '10/10', title: '', venue: 'Arena Birmingham' },
    { no: 13, date: '2023-03-04', opponent: 'Kamil Sokolowski', oppRecord: '14-3', result: 'W', method: 'KO R2', rounds: '2/8', title: '', venue: 'York Hall, London' },
    { no: 12, date: '2022-12-10', opponent: 'Nick Webb', oppRecord: '18-4', result: 'W', method: 'TKO R6', rounds: '6/10', title: '', venue: 'Copper Box, London' },
    { no: 11, date: '2022-09-17', opponent: 'Matt Sherwood', oppRecord: '11-2', result: 'W', method: 'KO R1', rounds: '1/6', title: '', venue: 'York Hall, London' },
    { no: 10, date: '2022-07-02', opponent: 'Danny Sheridan', oppRecord: '8-3', result: 'W', method: 'UD', rounds: '6/6', title: '', venue: 'Indigo at the O2' },
    { no: 9, date: '2022-04-16', opponent: 'Phil Jackson', oppRecord: '6-5', result: 'W', method: 'TKO R4', rounds: '4/6', title: '', venue: 'York Hall, London' },
    { no: 8, date: '2022-02-12', opponent: 'Kevin Sherwood', oppRecord: '5-4', result: 'W', method: 'KO R3', rounds: '3/6', title: '', venue: 'Brentwood Centre' },
    { no: 7, date: '2021-11-20', opponent: 'Mark Sheridan', oppRecord: '9-6', result: 'W', method: 'UD', rounds: '6/6', title: '', venue: 'York Hall, London' },
    { no: 6, date: '2021-09-11', opponent: 'Craig Phillips', oppRecord: '4-3', result: 'W', method: 'KO R2', rounds: '2/4', title: '', venue: 'Copper Box, London' },
    { no: 5, date: '2021-06-26', opponent: 'Peter Dunn', oppRecord: '3-5', result: 'W', method: 'TKO R3', rounds: '3/4', title: '', venue: 'York Hall, London' },
    { no: 4, date: '2021-03-13', opponent: 'Mickey Smith', oppRecord: '5-7', result: 'W', method: 'KO R1', rounds: '1/4', title: '', venue: 'York Hall, London' },
    { no: 3, date: '2020-12-05', opponent: 'Tom Harrison', oppRecord: '2-4', result: 'W', method: 'PTS', rounds: '4/4', title: '', venue: 'BT Sport Studios (bubble)' },
    { no: 2, date: '2020-10-10', opponent: 'Dave Clark', oppRecord: '1-3', result: 'W', method: 'TKO R2', rounds: '2/4', title: '', venue: 'BT Sport Studios (bubble)' },
    { no: 1, date: '2020-07-25', opponent: 'Ryan Johnson', oppRecord: '0-2', result: 'W', method: 'KO R1', rounds: '1/4', title: '', venue: 'BT Sport Studios (bubble)' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📜" title="Fight Record" subtitle={`Professional record: ${fighter.record.wins}-${fighter.record.losses}-${fighter.record.draws} (${fighter.record.ko} KO)`} />

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <div className="text-sm font-semibold text-white mb-4">🤖 AI Post-Fight Debrief Generator</div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Fight</div>
            <select value={selectedFight} onChange={e => setSelectedFight(e.target.value)}
              className="w-full bg-[#0a0c14] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white">
              <option>vs White (Nov 2025)</option>
              <option>vs Chisora (Jul 2025)</option>
              <option>vs Gorman (Mar 2025)</option>
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Result</div>
            <input defaultValue="W TKO9 — stopped in corner" className="w-full bg-[#0a0c14] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white" placeholder="Result and method"/>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">CompuBox — Landed / Thrown</div>
            <input defaultValue="224/498 (45%) jabs 82/188, power 142/310" className="w-full bg-[#0a0c14] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white"/>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Notes</div>
            <input defaultValue="Strong body work, managed southpaw well, slight chin wobble R6" className="w-full bg-[#0a0c14] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white"/>
          </div>
        </div>
        <button onClick={generateDebrief} disabled={debriefLoading}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2 rounded-lg transition-colors">
          {debriefLoading ? 'Generating...' : 'Generate Debrief'}
        </button>
        {debrief && (
          <div className="mt-4 space-y-3 border-t border-gray-800 pt-4">
            <div className="flex items-center gap-2"><span className="text-xs text-gray-500">Performance Rating</span><span className="text-white font-bold">{debrief.performance_rating}</span></div>
            {[{label:'Strengths',value:debrief.strengths,color:'text-green-400'},{label:'Weaknesses',value:debrief.weaknesses,color:'text-red-400'},{label:'GPS Insight',value:debrief.gps_insight,color:'text-orange-400'},{label:'Next Camp Focus',value:debrief.next_camp_focus,color:'text-teal-400'}].map(item=>(
              <div key={item.label} className="bg-[#0a0c14] border border-gray-800 rounded p-3">
                <div className={`text-xs font-medium mb-1 ${item.color}`}>{item.label}</div>
                <div className="text-xs text-gray-300">{item.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Fights" value={fighter.record.wins + fighter.record.losses + fighter.record.draws} sub="Professional career" color="red" />
        <StatCard label="Wins" value={fighter.record.wins} sub={`${Math.round((fighter.record.wins / 23) * 100)}% win rate`} color="green" />
        <StatCard label="Knockouts" value={fighter.record.ko} sub={`${Math.round((fighter.record.ko / fighter.record.wins) * 100)}% KO rate`} color="orange" />
        <StatCard label="Losses" value={fighter.record.losses} sub="1 split decision" color="blue" />
        <StatCard label="Rounds Boxed" value="108" sub="Avg 4.7 rds/fight" color="teal" />
      </div>

      {/* Full Record Table */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Full Professional Record — BoxRec Style</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-center py-2 pr-2">#</th>
                <th className="text-left py-2 pr-3">Date</th>
                <th className="text-left py-2 pr-3">Opponent</th>
                <th className="text-left py-2 pr-3">Record</th>
                <th className="text-center py-2 pr-3">Res</th>
                <th className="text-left py-2 pr-3">Method</th>
                <th className="text-center py-2 pr-3">Rds</th>
                <th className="text-left py-2 pr-3">Title</th>
                <th className="text-left py-2">Venue</th>
              </tr>
            </thead>
            <tbody>
              {record.map((fight, i) => (
                <tr key={i} className={`border-b border-gray-800/50 ${fight.result === 'L' ? 'bg-red-900/10' : ''}`}>
                  <td className="py-2 pr-2 text-center text-gray-500">{fight.no}</td>
                  <td className="py-2 pr-3 text-gray-400 font-mono">{fight.date}</td>
                  <td className="py-2 pr-3 text-white font-medium">{fight.opponent}</td>
                  <td className="py-2 pr-3 text-gray-400">{fight.oppRecord}</td>
                  <td className="py-2 pr-3 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${fight.result === 'W' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>{fight.result}</span>
                  </td>
                  <td className="py-2 pr-3 text-gray-300">{fight.method}</td>
                  <td className="py-2 pr-3 text-center text-gray-400">{fight.rounds}</td>
                  <td className="py-2 pr-3 text-yellow-400 text-[10px]">{fight.title}</td>
                  <td className="py-2 text-gray-500">{fight.venue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <BoxingAISection context="default" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── CAREER STATS VIEW ────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function CareerStatsView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const stats = [
    { label: 'Win Rate', value: '95.7%', detail: '22 wins from 23 fights' },
    { label: 'KO Rate', value: '81.8%', detail: '18 KOs from 22 wins' },
    { label: 'First Round KOs', value: '4', detail: 'Johnson, Smith, Sherwood, Craig Phillips' },
    { label: 'Average Fight Length', value: '4.7 rds', detail: '108 total rounds boxed' },
    { label: 'Rounds per Stoppage', value: '3.8 rds', detail: 'For KO/TKO wins only' },
    { label: 'Decision Wins', value: '4', detail: 'Chisora, Ali, Sheridan, Harrison' },
    { label: 'Total Rounds Boxed', value: '108', detail: 'Across 23 professional fights' },
    { label: 'Scheduled 12-Rounders', value: '2', detail: 'British Title + White fight' },
    { label: 'Career Earnings (Gross)', value: '£955,000', detail: 'Total fight purses' },
    { label: 'Highest Purse', value: '£450,000', detail: 'vs Dillian White (Nov 2025)' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📈" title="Career Stats" subtitle="Comprehensive statistical breakdown of Marcus Cole's professional career." />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Win Rate" value="95.7%" color="green" />
        <StatCard label="KO Rate" value="81.8%" color="red" />
        <StatCard label="Avg Fight" value="4.7 rds" color="blue" />
        <StatCard label="Career Earnings" value="£955k" color="yellow" />
        <StatCard label="Titles" value="1" sub="British HW" color="orange" />
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Detailed Career Statistics</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div>
                <div className="text-sm text-white font-medium">{stat.label}</div>
                <div className="text-xs text-gray-500">{stat.detail}</div>
              </div>
              <div className="text-lg font-bold text-red-400">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Win Method Breakdown */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Win Method Breakdown</div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { method: 'KO', count: 10, pct: 45, color: 'bg-red-500' },
            { method: 'TKO', count: 8, pct: 36, color: 'bg-orange-500' },
            { method: 'UD', count: 3, pct: 14, color: 'bg-blue-500' },
            { method: 'PTS/SD', count: 1, pct: 5, color: 'bg-teal-500' },
          ].map((m, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-bold text-white">{m.count}</div>
              <div className="text-xs text-gray-400">{m.method}</div>
              <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                <div className={`${m.color} h-2 rounded-full`} style={{ width: `${m.pct}%` }}></div>
              </div>
              <div className="text-[10px] text-gray-500 mt-1">{m.pct}%</div>
            </div>
          ))}
        </div>
      </div>
      <BoxingAISection context="default" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── PROMOTER PIPELINE VIEW ───────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PromoterPipelineView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const pipeline = [
    { opponent: 'Viktor Petrov', promoter: 'Matchroom/Top Rank co-promote', purse: '£800,000', date: 'May 22, 2026', stage: 'Signed', broadcast: 'DAZN PPV', notes: 'Fight contracts exchanged. Camp underway.' },
    { opponent: 'Zhilei Zhang', promoter: 'Matchroom/Queensberry co-promote', purse: '£1.2m-1.5m', date: 'Q4 2026', stage: 'Discussions', broadcast: 'DAZN / TNT Sports', notes: 'Conditional on Petrov win. Eddie Hearn has opened dialogue with Frank Warren\'s team.' },
    { opponent: 'WBC Eliminator TBD', promoter: 'Matchroom', purse: '£1.5m+', date: 'Q1 2027', stage: 'Projected', broadcast: 'DAZN', notes: 'If Marcus beats Petrov and enters top 3. Eliminator likely ordered Q4 2026.' },
    { opponent: 'Title Shot', promoter: 'TBD', purse: '£3m+ (projected)', date: '2027', stage: 'Long-term target', broadcast: 'PPV', notes: 'Depends on route. WBC or WBO most likely first title opportunity.' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🗂️" title="Promoter Pipeline" subtitle="Fight pipeline and promotional strategy with Matchroom Boxing." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Current Promoter" value="Matchroom" sub="Eddie Hearn" color="red" />
        <StatCard label="Fights Left" value="3" sub="On current deal" color="blue" />
        <StatCard label="Next Fight" value="£800k" sub="vs Petrov — signed" color="green" />
        <StatCard label="Title Shot" value="2027" sub="Projected timeline" color="yellow" />
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Fight Pipeline</div>
        <div className="space-y-4">
          {pipeline.map((fight, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  fight.stage === 'Signed' ? 'bg-green-600/30 border border-green-500 text-green-400' :
                  fight.stage === 'Discussions' ? 'bg-yellow-600/30 border border-yellow-500 text-yellow-400' :
                  'bg-gray-800 border border-gray-700 text-gray-400'
                }`}>{i + 1}</div>
                {i < pipeline.length - 1 && <div className="w-0.5 h-8 bg-gray-800 mt-1"></div>}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-white font-medium">{fight.opponent}</div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    fight.stage === 'Signed' ? 'bg-green-600/20 text-green-400' :
                    fight.stage === 'Discussions' ? 'bg-yellow-600/20 text-yellow-400' :
                    'bg-gray-600/20 text-gray-400'
                  }`}>{fight.stage}</span>
                </div>
                <div className="text-xs text-gray-400">{fight.promoter} — {fight.broadcast} — {fight.date}</div>
                <div className="text-xs text-green-400 mt-0.5">{fight.purse}</div>
                <div className="text-xs text-gray-500 mt-0.5">{fight.notes}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BoxingAISection context="financial" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── AGENT INTEL VIEW ─────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AgentIntelView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const intel = [
    { source: 'Industry contact (Top Rank)', date: 'Apr 3, 2026', content: 'Petrov\'s team are very confident heading into this fight. They believe Marcus is hittable and have been studying the Sam Jones loss closely. Petrov has been sparring with Efe Ajagba to simulate a taller, more technical opponent.' },
    { source: 'Boxing Scene report', date: 'Apr 2, 2026', content: 'WBC expected to order eliminator between #3 and #5 if Petrov loses. This means a Marcus win could skip the eliminator stage entirely and go straight to mandatory position, depending on how WBC executive committee votes.' },
    { source: 'Matchroom insider', date: 'Apr 1, 2026', content: 'Eddie Hearn has privately indicated that a Marcus victory over Petrov would trigger immediate discussions with Queensberry for a co-promoted fight with Zhang (WBC #2). Potential venue: Tottenham Hotspur Stadium, summer 2026.' },
    { source: 'DAZN analytics team', date: 'Mar 28, 2026', content: 'Marcus Cole fight content is trending 34% higher engagement than this time last year. DAZN very keen on building toward a PPV headliner — willing to increase marketing spend if Petrov fight delivers.' },
    { source: 'BBBofC source', date: 'Mar 25, 2026', content: 'Referee for Petrov fight expected to be Marcus McDonnell. He tends to let fighters work inside and breaks clinches quickly — advantages Marcus\'s boxing ability over Petrov\'s mauling style.' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🕵️" title="Agent Intel" subtitle="Confidential intelligence from industry sources and contacts." />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Intel Reports" value={intel.length} sub="This week" color="red" />
        <StatCard label="Classification" value="Team Only" sub="Confidential" color="orange" />
        <StatCard label="Key Insight" value="WBC Path" sub="Could skip eliminator" color="green" />
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Intelligence Briefings</div>
        <div className="space-y-4">
          {intel.map((item, i) => (
            <div key={i} className="p-4 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-red-400 font-medium">{item.source}</span>
                <span className="text-xs text-gray-500">{item.date}</span>
              </div>
              <div className="text-sm text-gray-300 leading-relaxed">{item.content}</div>
            </div>
          ))}
        </div>
      </div>
      <BoxingAISection context="opponent" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── AI MORNING BRIEFING VIEW ─────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AIMorningBriefingView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateBriefing = async () => {
    setLoading(true);
    try {
      const todayGPS = GPS_SESSIONS[GPS_SESSIONS.length - 1];
      const response = await fetch('/api/ai/boxing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: `Generate a structured morning briefing for professional boxer Marcus Cole. Today is Camp Day ${fighter.camp_day} of ${fighter.camp_total}. Fight vs ${fighter.next_fight.opponent} (${fighter.next_fight.opponent_record}) in ${fighter.next_fight.days_away} days at ${fighter.next_fight.venue} on ${fighter.next_fight.broadcast}.

GPS DATA (yesterday's session): Type: ${todayGPS.type}, Load: ${todayGPS.load} AU, Distance: ${todayGPS.distance}km, ACWR: ${todayGPS.acwr.toFixed(2)}, Ring time — Centre: ${todayGPS.ring.centre}%, Ropes: ${todayGPS.ring.ropes}%, Corners: ${todayGPS.ring.corners}%.

Weight: ${fighter.current_weight}kg (target: ${fighter.target_weight}kg — ${(fighter.current_weight - fighter.target_weight).toFixed(1)}kg remaining).
Recovery: 81% HRV: 62ms. Right shoulder monitoring.
Today's schedule: 11:00 Sparring (8 rounds vs Darnell Hughes), 15:00 Strength (upper body power), 18:00 Physio.
Trainer: ${fighter.trainer}. Nutritionist: ${fighter.nutritionist}. Physio: ${fighter.physio}.

Write a concise, focused morning briefing covering: TRAINING (today's sessions), NUMBERS (weight and recovery status), GPS SUMMARY (yesterday's load and ring zone notes), SPARRING FOCUS (one tactical drill to prioritise), FLAGS (any concerns), OBLIGATIONS (media/sponsor commitments). End with a motivational closer. Use headers. Be direct and specific. No filler.`
          }]
        })
      });
      const data = await response.json();
      setBriefing(data.content[0].text);
    } catch {
      setBriefing('Error generating briefing. Check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const printBriefing = () => {
    if (!briefing) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Morning Briefing — Marcus Cole</title>
    <style>
      body{font-family:Georgia,serif;max-width:720px;margin:32px auto;color:#1a1a2e;font-size:13px;line-height:1.7;padding:0 24px}
      h1{font-size:22px;border-bottom:3px solid #EF4444;padding-bottom:8px;margin-bottom:4px}
      .meta{font-size:11px;color:#666;margin-bottom:24px}
      pre{white-space:pre-wrap;font-family:Georgia,serif;font-size:13px}
      footer{margin-top:32px;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:10px}
      @media print{body{margin:16px}}
    </style></head><body>
    <h1>🌅 Morning Briefing — Marcus Cole</h1>
    <div class="meta">Camp Day ${fighter.camp_day} of ${fighter.camp_total} · ${fighter.next_fight.days_away} days to ${fighter.next_fight.opponent} · ${new Date().toLocaleDateString('en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
    <pre>${briefing.replace(/</g,'&lt;')}</pre>
    <footer>Generated by Lumio Fight · CONFIDENTIAL — Team Only</footer>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🌅" title="AI Morning Briefing" subtitle="AI-generated structured daily briefing for Marcus and team." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Camp Day" value={fighter.camp_day} sub={`of ${fighter.camp_total}`} color="red" />
        <StatCard label="Days to Fight" value={fighter.next_fight.days_away} color="orange" />
        <StatCard label="Weight" value={`${fighter.current_weight}kg`} sub={`Target: ${fighter.target_weight}kg`} color="teal" />
        <StatCard label="Recovery" value="81%" sub="Green light" color="green" />
      </div>

      {/* Generate Button */}
      {!briefing && (
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-8 text-center">
          <div className="text-lg font-bold text-white mb-2">Generate Today&apos;s Briefing</div>
          <div className="text-sm text-gray-400 mb-6">AI will compile training, numbers, sparring focus, flags, and obligations into a structured morning briefing.</div>
          <button
            onClick={generateBriefing}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating briefing...' : 'Generate Morning Briefing'}
          </button>
        </div>
      )}

      {/* Briefing Display */}
      {briefing && (
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-white">AI Morning Briefing</div>
            <div className="flex items-center gap-3">
              <button onClick={printBriefing} className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">📄 Print Briefing</button>
              <button onClick={() => setBriefing(null)} className="text-xs text-gray-500 hover:text-gray-300">Regenerate</button>
            </div>
          </div>
          <div className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed font-mono bg-[#0a0c14] p-5 rounded-lg border border-gray-800">
            {briefing}
          </div>
        </div>
      )}
      <BoxingAISection context="dashboard" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── OPPOSITION SCOUT VIEW ────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function OppositionScoutView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const [scoutTarget, setScoutTarget] = useState('Viktor Petrov');
  const [scoutLoading, setScoutLoading] = useState(false);
  const [scoutResult, setScoutResult] = useState<{style_analysis: string; key_threat: string; weakness: string; ring_strategy: string; gps_target_zones: string} | null>(null);

  const generateScoutReport = async () => {
    setScoutLoading(true);
    try {
      const response = await fetch('/api/ai/boxing', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:500,
          messages:[{role:'user',content:`Generate a boxing scout report on ${scoutTarget} for Marcus Cole (22-1 HW, Orthodox, 6'4" 82" reach, strong jab and body work). Marcus's GPS ring data shows he averages 40% centre, 35% ropes, 25% corners. Include GPS ring zone strategy specifically. Respond ONLY in JSON: {"style_analysis":"2 sentences on opponent style and tendencies","key_threat":"biggest danger to Marcus in 1 sentence","weakness":"main exploitable weakness in 1 sentence","ring_strategy":"2 sentence tactical plan","gps_target_zones":"where Marcus should target positioning based on his GPS profile vs this opponent's style"}`}]
        })
      });
      const data = await response.json();
      const text: string = data?.content?.[0]?.text || '';
      const s = text.indexOf('{'); const e = text.lastIndexOf('}');
      setScoutResult(JSON.parse(text.slice(s, e + 1)));
    } catch { console.error('Scout failed'); }
    finally { setScoutLoading(false); }
  };

  const scoutedFighters = [
    { name: 'Viktor Petrov', flag: '🇷🇺', record: '28-2 (24 KO)', ranking: 'WBC #3', threat: 'High', notes: 'Next opponent. Currently in Big Bear camp. New conditioning coach. Working body shots more than usual.' },
    { name: 'Zhilei Zhang', flag: '🇨🇳', record: '27-2-1 (22 KO)', ranking: 'WBC #2', threat: 'High', notes: 'Potential future opponent if Petrov win secured. Massive power. Slow feet. Age a factor (43).' },
    { name: 'Jared Anderson', flag: '🇺🇸', record: '17-0 (15 KO)', ranking: 'WBO #4', threat: 'Medium', notes: 'Rising American prospect. Fast hands but untested at elite level. Possible WBO eliminator opponent.' },
    { name: 'Martin Bakole', flag: '🇨🇩', record: '21-1 (16 KO)', ranking: 'WBC #4', threat: 'Medium', notes: 'Physical and relentless. Awkward style. Possible WBC eliminator if Marcus beats Petrov.' },
    { name: 'Daniel Dubois', flag: '🇬🇧', record: '22-2 (21 KO)', ranking: 'IBF Champion', threat: 'High', notes: 'IBF champion. Massive puncher but questionable chin. Big domestic fight possibility.' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🎯" title="Opposition Scout" subtitle="Active scouting reports on current and potential future opponents." />

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <div className="text-sm font-semibold text-white mb-1">🤖 AI Scout + GPS Ring Strategy</div>
            <select value={scoutTarget} onChange={e => setScoutTarget(e.target.value)}
              className="w-full bg-[#0a0c14] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white">
              {['Viktor Petrov','Zhilei Zhang','Jared Anderson','Martin Bakole','Daniel Dubois'].map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
          <button onClick={generateScoutReport} disabled={scoutLoading}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors self-end whitespace-nowrap">
            {scoutLoading ? 'Scouting...' : 'Generate Report'}
          </button>
        </div>
        {scoutResult && (
          <div className="space-y-3 border-t border-gray-800 pt-4">
            {[
              {label:'Style Analysis',value:scoutResult.style_analysis,icon:'🥊'},
              {label:'Key Threat',value:scoutResult.key_threat,icon:'⚠️',color:'text-red-400'},
              {label:'Exploitable Weakness',value:scoutResult.weakness,icon:'🎯',color:'text-green-400'},
              {label:'Ring Movement Strategy',value:scoutResult.ring_strategy,icon:'📡'},
              {label:'GPS Target Zones',value:scoutResult.gps_target_zones,icon:'🗺️',color:'text-orange-400'},
            ].map(item => (
              <div key={item.label} className="flex gap-3 items-start">
                <span>{item.icon}</span>
                <div>
                  <div className={`text-xs font-medium mb-0.5 ${item.color || 'text-gray-400'}`}>{item.label}</div>
                  <div className="text-xs text-gray-300">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Fighters Scouted" value={scoutedFighters.length} sub="Active reports" color="red" />
        <StatCard label="Primary Target" value="Petrov" sub="Next fight — 48 days" color="orange" />
        <StatCard label="High Threats" value="3" sub="Petrov, Zhang, Dubois" color="yellow" />
      </div>

      <div className="space-y-4">
        {scoutedFighters.map((f, i) => (
          <div key={i} className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{f.flag}</span>
                <div>
                  <div className="text-sm text-white font-bold">{f.name}</div>
                  <div className="text-xs text-gray-400">{f.record} — {f.ranking}</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                f.threat === 'High' ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'
              }`}>{f.threat} Threat</span>
            </div>
            <div className="text-xs text-gray-300">{f.notes}</div>
          </div>
        ))}
      </div>
      <BoxingAISection context="opponent" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── BROADCAST TRACKER VIEW ───────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function BroadcastTrackerView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const broadcasts = [
    { fight: 'Cole vs Petrov', date: 'May 22, 2026', broadcaster: 'DAZN PPV', territory: 'Global', estimated_viewers: '800k-1.2m', card_position: 'Main Event', notes: 'First PPV headliner. DAZN investing heavily in promotion.' },
    { fight: 'Fury vs Zhang', date: 'TBD 2026', broadcaster: 'TNT Sports / ESPN+', territory: 'UK & US', estimated_viewers: '2-3m', card_position: 'N/A', notes: 'Key fight to watch — impacts WBC rankings.' },
    { fight: 'Dubois vs Hrgovic', date: 'Jun 2026', broadcaster: 'DAZN', territory: 'Global', estimated_viewers: '500k', card_position: 'N/A', notes: 'IBF mandatory — could reshape IBF rankings.' },
    { fight: 'Usyk vs TBD', date: 'Q3 2026', broadcaster: 'TBD', territory: 'TBD', estimated_viewers: 'TBD', card_position: 'N/A', notes: 'Undisputed champion defence — all belts at stake.' },
  ];

  const viewerHistory = [
    { fight: 'vs White (Nov 2025)', viewers: '620,000', platform: 'DAZN', growth: '+45%' },
    { fight: 'vs Chisora (Jul 2025)', viewers: '430,000', platform: 'DAZN', growth: '+22%' },
    { fight: 'vs Gorman (Mar 2025)', viewers: '350,000', platform: 'DAZN', growth: '+15%' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📺" title="Broadcast Tracker" subtitle="Fight broadcasts, viewership data, and platform analytics." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Next Broadcast" value="DAZN PPV" sub="Cole vs Petrov — May 22" color="red" />
        <StatCard label="Est. Viewers" value="800k-1.2m" sub="First PPV headliner" color="blue" />
        <StatCard label="Growth Trend" value="+45%" sub="vs last fight" color="green" />
        <StatCard label="Platform" value="DAZN" sub="Exclusive broadcast" color="orange" />
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Upcoming Key Broadcasts</div>
        <div className="space-y-3">
          {broadcasts.map((b, i) => (
            <div key={i} className="p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="flex items-start justify-between mb-1">
                <div className="text-sm text-white font-medium">{b.fight}</div>
                <span className="text-xs text-gray-400">{b.date}</span>
              </div>
              <div className="flex gap-4 text-xs text-gray-400 mb-1">
                <span>{b.broadcaster}</span>
                <span>{b.territory}</span>
                <span>Est: {b.estimated_viewers}</span>
              </div>
              <div className="text-xs text-gray-500">{b.notes}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Marcus Cole — Viewership History</div>
        <div className="space-y-2">
          {viewerHistory.map((v, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50">
              <span className="text-xs text-white">{v.fight}</span>
              <div className="flex gap-4">
                <span className="text-xs text-gray-400">{v.platform}</span>
                <span className="text-xs text-gray-300">{v.viewers}</span>
                <span className="text-xs text-green-400">{v.growth}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BoxingAISection context="sponsorship" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── INDUSTRY NEWS VIEW ───────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function IndustryNewsView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const news = [
    { date: 'Apr 4, 2026', headline: 'WBC to order eliminator between #3 and #5 by end of summer', source: 'Boxing Scene', relevance: 'Direct', summary: 'If Marcus beats Petrov and takes the #3 spot, he could be in line for a mandatory eliminator by Q4 2026. The WBC executive committee will vote at their May convention.' },
    { date: 'Apr 3, 2026', headline: 'Fury considering retirement after Zhang fight', source: 'ESPN', relevance: 'High', summary: 'If Fury retires, the WBC title could become vacant, significantly accelerating the path to a title shot for top contenders including Marcus.' },
    { date: 'Apr 2, 2026', headline: 'DAZN signs new multi-year deal with Matchroom Boxing', source: 'Variety', relevance: 'Medium', summary: 'Extended partnership ensures Marcus\'s fights will continue to be broadcast on DAZN. The deal includes increased investment in fighter promotion and marketing.' },
    { date: 'Apr 1, 2026', headline: 'Saudi Arabia PIF exploring heavyweight boxing investments', source: 'Financial Times', relevance: 'Medium', summary: 'Saudi PIF reportedly looking to host major heavyweight fights in 2026-2027. Could create lucrative site fee opportunities for top contenders.' },
    { date: 'Mar 30, 2026', headline: 'IBF mandates Dubois vs Hrgovic by June 2026', source: 'Ring Magazine', relevance: 'Low', summary: 'IBF forces mandatory defence. While Marcus is IBF #12, this fight could reshuffle the top 10 and create movement opportunities.' },
    { date: 'Mar 28, 2026', headline: 'UK boxing viewership up 28% year-over-year on DAZN', source: 'Broadcasting Journal', relevance: 'Medium', summary: 'Growing audience for UK boxing benefits Marcus\'s commercial profile. Increased viewership strengthens negotiating position for future PPV events.' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📰" title="Industry News" subtitle="Boxing industry news filtered for relevance to Marcus Cole's career." />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Stories This Week" value={news.length} sub="Filtered and analysed" color="red" />
        <StatCard label="Direct Relevance" value="1" sub="WBC eliminator order" color="orange" />
        <StatCard label="High Relevance" value="1" sub="Fury retirement" color="yellow" />
      </div>

      <div className="space-y-4">
        {news.map((item, i) => (
          <div key={i} className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="text-sm text-white font-bold">{item.headline}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.source} — {item.date}</div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ml-4 flex-shrink-0 ${
                item.relevance === 'Direct' ? 'bg-red-600/20 text-red-400' :
                item.relevance === 'High' ? 'bg-orange-600/20 text-orange-400' :
                item.relevance === 'Medium' ? 'bg-yellow-600/20 text-yellow-400' :
                'bg-gray-600/20 text-gray-400'
              }`}>{item.relevance}</span>
            </div>
            <div className="text-sm text-gray-300 leading-relaxed">{item.summary}</div>
          </div>
        ))}
      </div>
      <BoxingAISection context="default" fighter={fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── GPS LOAD MONITOR VIEW ────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function GPSLoadMonitorView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const [selectedDay, setSelectedDay] = useState(GPS_SESSIONS.length - 1);
  const [footworkLoading, setFootworkLoading] = useState(false);
  const [footworkResult, setFootworkResult] = useState<{drills: {name: string; description: string; reason: string}[]; summary: string} | null>(null);
  const [compareA, setCompareA] = useState(0);
  const [compareB, setCompareB] = useState(GPS_SESSIONS.length - 1);
  const gpsSession = GPS_SESSIONS[selectedDay];

  const generateFootworkAnalysis = async () => {
    setFootworkLoading(true);
    try {
      const ringData = GPS_SESSIONS.filter(s => s.ring.centre > 0);
      const avgCentre = Math.round(ringData.reduce((a,s)=>a+s.ring.centre,0)/ringData.length);
      const avgRopes = Math.round(ringData.reduce((a,s)=>a+s.ring.ropes,0)/ringData.length);
      const avgCorners = Math.round(ringData.reduce((a,s)=>a+s.ring.corners,0)/ringData.length);
      const response = await fetch('/api/ai/boxing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          messages: [{
            role: 'user',
            content: `You are a boxing GPS analyst for Marcus Cole (22-1, Heavyweight, Orthodox, 6'4"). His ring zone data from camp shows: Centre ${avgCentre}%, Ropes ${avgRopes}%, Corners ${avgCorners}%. Next opponent Viktor Petrov is WBC #3, southpaw, 28-2 with 24 KOs, known for controlling the centre ring. Generate 3 specific footwork drills to address the weaknesses shown in this zone data. Respond ONLY in JSON (no markdown): { "summary": "2 sentence overall footwork assessment", "drills": [{"name": "drill name", "description": "how to execute — 2 sentences", "reason": "why this addresses the zone data"}, ...3 items] }`
          }]
        })
      });
      const data = await response.json();
      setFootworkResult(JSON.parse(data.content[0].text));
    } catch {
      console.error('Footwork analysis failed');
    } finally {
      setFootworkLoading(false);
    }
  };

  const acwrData = GPS_SESSIONS.map(s => ({ day: s.day, acwr: s.acwr, load: s.load, type: s.type }));
  const latestACWR = GPS_SESSIONS[GPS_SESSIONS.length - 1].acwr;
  const acwrStatus = latestACWR > 1.3 ? { label: 'High Risk', color: 'text-red-400', bg: 'bg-red-600/20' }
    : latestACWR > 1.15 ? { label: 'Manage Carefully', color: 'text-yellow-400', bg: 'bg-yellow-600/20' }
    : { label: 'Safe Zone', color: 'text-green-400', bg: 'bg-green-600/20' };

  const totalDistanceCamp = GPS_SESSIONS.reduce((a, s) => a + s.distance, 0);
  const totalLoadCamp = GPS_SESSIONS.reduce((a, s) => a + s.load, 0);
  const sparringSessions = GPS_SESSIONS.filter(s => s.ring.centre > 0).length;

  const generateCampReport = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const totalDist = GPS_SESSIONS.reduce((a,s)=>a+s.distance,0).toFixed(1);
    const totalLoad = GPS_SESSIONS.reduce((a,s)=>a+s.load,0);
    const peakACWR = Math.max(...GPS_SESSIONS.map(s=>s.acwr)).toFixed(2);
    const sparringSess = GPS_SESSIONS.filter(s=>s.ring.centre>0);
    const avgCentreTime = sparringSess.length ? Math.round(sparringSess.reduce((a,s)=>a+s.ring.centre,0)/sparringSess.length) : 0;
    w.document.write(`<!DOCTYPE html><html><head><title>Camp Load Report — Marcus Cole vs Viktor Petrov</title>
    <style>
      body{font-family:Georgia,serif;max-width:780px;margin:32px auto;color:#1a1a2e;font-size:12px;line-height:1.6}
      h1{font-size:22px;margin-bottom:4px;border-bottom:3px solid #EF4444;padding-bottom:8px}
      .meta{font-size:10px;color:#666;margin-bottom:24px}
      .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
      .kpi{border:1px solid #ddd;border-radius:6px;padding:12px;text-align:center}
      .kpi-val{font-size:22px;font-weight:700;color:#EF4444}
      .kpi-label{font-size:10px;color:#666;text-transform:uppercase;letter-spacing:0.05em}
      h2{font-size:13px;text-transform:uppercase;letter-spacing:0.06em;color:#888;border-bottom:1px solid #eee;padding-bottom:4px;margin:20px 0 10px}
      table{width:100%;border-collapse:collapse;font-size:11px}
      th{background:#f5f5f5;padding:6px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.04em;color:#666}
      td{padding:7px 10px;border-bottom:1px solid #eee}
      .zone-row{display:flex;gap:12px;margin-bottom:8px;align-items:center}
      .zone-bar{flex:1;height:8px;background:#eee;border-radius:4px;overflow:hidden}
      .zone-fill{height:100%;border-radius:4px}
      .badge-red{color:#EF4444;font-weight:700} .badge-amber{color:#F59E0B;font-weight:700} .badge-green{color:#22C55E;font-weight:700}
      footer{margin-top:32px;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:10px}
      @media print{body{margin:16px}}
    </style></head><body>
    <h1>🥊 Camp Load Report — Marcus Cole</h1>
    <div class="meta">vs Viktor Petrov · Camp Days 15–${fighter.camp_day} of ${fighter.camp_total} · Generated ${new Date().toLocaleDateString('en-GB')} · CONFIDENTIAL — Team Only</div>
    <div class="kpis">
      <div class="kpi"><div class="kpi-val">${totalDist}km</div><div class="kpi-label">Total Distance</div></div>
      <div class="kpi"><div class="kpi-val">${totalLoad}</div><div class="kpi-label">Total Load (AU)</div></div>
      <div class="kpi"><div class="kpi-val">${peakACWR}</div><div class="kpi-label">Peak ACWR</div></div>
      <div class="kpi"><div class="kpi-val">${sparringSess.length}</div><div class="kpi-label">Ring Sessions</div></div>
      <div class="kpi"><div class="kpi-val">${avgCentreTime}%</div><div class="kpi-label">Avg Centre Time</div></div>
      <div class="kpi"><div class="kpi-val">${fighter.next_fight.days_away}d</div><div class="kpi-label">Days to Fight</div></div>
    </div>
    <h2>Daily Session Log</h2>
    <table><thead><tr><th>Day</th><th>Date</th><th>Type</th><th>Duration</th><th>Distance</th><th>Load (AU)</th><th>ACWR</th><th>Status</th></tr></thead><tbody>
    ${GPS_SESSIONS.map(s=>`<tr>
      <td>${s.day}</td><td>${s.date}</td><td>${s.type}</td><td>${s.duration>0?s.duration+'m':'—'}</td>
      <td>${s.distance>0?s.distance+'km':'—'}</td><td>${s.load>0?s.load:'—'}</td>
      <td class="${s.acwr>1.3?'badge-red':s.acwr>1.15?'badge-amber':'badge-green'}">${s.acwr.toFixed(2)}</td>
      <td class="${s.acwr>1.3?'badge-red':s.acwr>1.15?'badge-amber':'badge-green'}">${s.acwr>1.3?'⚠ High Risk':s.acwr>1.15?'Monitor':'Safe'}</td>
    </tr>`).join('')}
    </tbody></table>
    <h2>Ring Zone Analysis — Sparring Sessions</h2>
    ${sparringSess.map(s=>`<div style="margin-bottom:12px">
      <div style="font-size:11px;font-weight:600;margin-bottom:6px">Day ${s.day} · ${s.date} · ${s.duration}min</div>
      <div class="zone-row"><span style="width:60px;font-size:10px;color:#666">Centre</span><div class="zone-bar"><div class="zone-fill" style="width:${s.ring.centre}%;background:#EF4444"></div></div><span style="font-size:10px;width:30px;text-align:right">${s.ring.centre}%</span></div>
      <div class="zone-row"><span style="width:60px;font-size:10px;color:#666">Ropes</span><div class="zone-bar"><div class="zone-fill" style="width:${s.ring.ropes}%;background:#F97316"></div></div><span style="font-size:10px;width:30px;text-align:right">${s.ring.ropes}%</span></div>
      <div class="zone-row"><span style="width:60px;font-size:10px;color:#666">Corners</span><div class="zone-bar"><div class="zone-fill" style="width:${s.ring.corners}%;background:#EAB308"></div></div><span style="font-size:10px;width:30px;text-align:right">${s.ring.corners}%</span></div>
    </div>`).join('')}
    <h2>Trainer Notes — Jim Bevan</h2>
    <p style="font-style:italic;color:#444">Marcus is tracking well through the specific phase. ACWR peaked at ${peakACWR} — within acceptable range for this stage of camp. Ring zone data shows good centre-ring presence in early sparring sessions. Week 7 onward, we target ≥40% centre time as we build confidence working inside Petrov's jab range.</p>
    <footer>Generated by Lumio Fight GPS · lumiofight.com · ${new Date().toLocaleDateString('en-GB')} · CONFIDENTIAL</footer>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📡" title="GPS Load Monitor" subtitle={`Camp Days 15–${fighter.camp_day} · Lumio Fight Vest · UWB Ring Tracking Active`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Camp Distance" value={`${totalDistanceCamp.toFixed(1)}km`} sub="Total GPS tracked" color="teal" />
        <StatCard label="Total Camp Load" value={totalLoadCamp} sub="Composite AU" color="blue" />
        <StatCard label="ACWR Today" value={latestACWR.toFixed(2)} sub={acwrStatus.label} color={latestACWR > 1.3 ? 'red' : latestACWR > 1.15 ? 'yellow' : 'green'} />
        <StatCard label="Ring Sessions" value={sparringSessions} sub="With heatmap data" color="orange" />
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-white">ACWR — Acute:Chronic Workload Ratio</div>
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${acwrStatus.bg} ${acwrStatus.color}`}>{acwrStatus.label}</span>
        </div>
        <div className="relative h-40">
          <svg viewBox="0 0 600 140" className="w-full h-full" preserveAspectRatio="none">
            <rect x="0" y="26" width="600" height="70" fill="rgba(34,197,94,0.06)" rx="0"/>
            <line x1="0" y1="26" x2="600" y2="26" stroke="#22C55E" strokeWidth="1" strokeDasharray="4,4" opacity="0.4"/>
            <line x1="0" y1="96" x2="600" y2="96" stroke="#EF4444" strokeWidth="1" strokeDasharray="4,4" opacity="0.4"/>
            <text x="4" y="23" fill="#22C55E" fontSize="8" opacity="0.6">0.8</text>
            <text x="4" y="93" fill="#EF4444" fontSize="8" opacity="0.6">1.3</text>
            <polyline fill="none" stroke="#F97316" strokeWidth="2"
              points={acwrData.map((d, i) => {
                const x = (i / (acwrData.length - 1)) * 590 + 5;
                const y = 140 - ((d.acwr - 0.6) / 1.0) * 130;
                return `${x},${y}`;
              }).join(' ')} />
            {acwrData.map((d, i) => {
              const x = (i / (acwrData.length - 1)) * 590 + 5;
              const y = 140 - ((d.acwr - 0.6) / 1.0) * 130;
              return <circle key={i} cx={x} cy={y} r="3" fill={d.acwr > 1.3 ? '#EF4444' : '#F97316'} />;
            })}
            {acwrData.map((d, i) => {
              const x = (i / (acwrData.length - 1)) * 590 + 5;
              return <text key={i} x={x} y="138" textAnchor="middle" fill="#4B5563" fontSize="7">D{d.day}</text>;
            })}
          </svg>
        </div>
        <div className="flex gap-4 text-xs mt-2">
          <span className="text-green-400">── Safe zone (0.8–1.3)</span>
          <span className="text-orange-400">── Your ACWR</span>
          <span className="text-red-400">● High risk (&gt;1.3)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-4">Session Selector</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {GPS_SESSIONS.map((s, i) => (
              <button key={i} onClick={() => setSelectedDay(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${selectedDay === i ? 'bg-red-600/20 border-red-600/30 text-red-300' : 'border-gray-700 text-gray-400 hover:text-gray-200'}`}>
                D{s.day} · {s.type}
              </button>
            ))}
          </div>
          <div className="space-y-2 text-xs border-t border-gray-800 pt-4">
            <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="text-white">{gpsSession.type}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="text-white">{gpsSession.duration} min</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Distance</span><span className="text-teal-400">{gpsSession.distance} km</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Session Load</span><span className="text-orange-400">{gpsSession.load} AU</span></div>
            <div className="flex justify-between"><span className="text-gray-500">ACWR</span><span className={gpsSession.acwr > 1.3 ? 'text-red-400' : gpsSession.acwr > 1.15 ? 'text-yellow-400' : 'text-green-400'}>{gpsSession.acwr.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-4">Ring Heatmap — {gpsSession.date}</div>
          <div className="flex justify-center mb-4">
            <RingHeatmap session={gpsSession} size={240} />
          </div>
          <RingZoneBar session={gpsSession} />
        </div>
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Daily Load — Camp Days 15–{fighter.camp_day}</div>
        <div className="flex items-end gap-1 h-28">
          {GPS_SESSIONS.map((s, i) => {
            const maxLoad = Math.max(...GPS_SESSIONS.map(x => x.load), 1);
            const h = s.load > 0 ? Math.max(8, (s.load / maxLoad) * 100) : 4;
            const color = s.load > 380 ? '#EF4444' : s.load > 260 ? '#F97316' : s.load > 0 ? '#14B8A6' : '#374151';
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => setSelectedDay(i)}>
                {s.load > 0 && <div className="text-[9px] text-gray-500">{s.load}</div>}
                <div className="w-full rounded-t transition-all" style={{height:`${h}%`, background:color, opacity: selectedDay===i ? 1 : 0.7}}/>
                <div className="text-[9px] text-gray-600">D{s.day}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-white">Camp Load Report PDF</div>
            <div className="text-xs text-gray-400 mt-1">Jim&apos;s most-requested feature — total distance, load by day, ACWR chart, ring zone summary</div>
          </div>
          <button onClick={generateCampReport} className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
            📄 Generate Report
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          {[
            {label:'Total Distance',value:`${GPS_SESSIONS.reduce((a,s)=>a+s.distance,0).toFixed(1)} km`},
            {label:'Total Load',value:`${GPS_SESSIONS.reduce((a,s)=>a+s.load,0)} AU`},
            {label:'Peak ACWR',value:Math.max(...GPS_SESSIONS.map(s=>s.acwr)).toFixed(2)},
            {label:'Sparring Sessions',value:GPS_SESSIONS.filter(s=>s.ring.centre>0).length},
            {label:'Avg Daily Load',value:Math.round(GPS_SESSIONS.filter(s=>s.load>0).reduce((a,s)=>a+s.load,0)/GPS_SESSIONS.filter(s=>s.load>0).length)},
            {label:'Days Tracked',value:GPS_SESSIONS.length},
          ].map(stat => (
            <div key={stat.label} className="bg-[#0a0c14] border border-gray-800 rounded p-2 text-center">
              <div className="text-white font-medium">{stat.value}</div>
              <div className="text-gray-500 text-[10px] mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-white">🤖 AI Footwork Analyst</div>
            <div className="text-xs text-gray-400 mt-0.5">Analyses ring zone data and generates targeted footwork drills</div>
          </div>
          <button onClick={generateFootworkAnalysis} disabled={footworkLoading}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
            {footworkLoading ? 'Analysing...' : 'Analyse Footwork'}
          </button>
        </div>
        {footworkResult && (
          <div className="space-y-4">
            <div className="text-xs text-gray-300 border-l-2 border-red-500 pl-3 italic">{footworkResult.summary}</div>
            <div className="space-y-3">
              {footworkResult.drills.map((drill, i) => (
                <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-red-600/30 text-red-400 text-xs flex items-center justify-center font-bold">{i+1}</span>
                    <span className="text-sm text-white font-medium">{drill.name}</span>
                  </div>
                  <div className="text-xs text-gray-300 mb-1">{drill.description}</div>
                  <div className="text-xs text-yellow-400">Why: {drill.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-1">Multi-Session Heatmap Overlay</div>
        <div className="text-xs text-gray-400 mb-4">Compare ring positioning across camp weeks — visual proof of footwork improvement</div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Session A (Earlier camp)</div>
            <select value={compareA} onChange={e => setCompareA(Number(e.target.value))}
              className="w-full bg-[#0a0c14] border border-gray-700 rounded px-2 py-1.5 text-xs text-white">
              {GPS_SESSIONS.filter(s=>s.ring.centre>0).map(s => {
                const idx = GPS_SESSIONS.indexOf(s);
                return <option key={idx} value={idx}>Day {s.day} — {s.type} ({s.date})</option>;
              })}
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Session B (Later camp)</div>
            <select value={compareB} onChange={e => setCompareB(Number(e.target.value))}
              className="w-full bg-[#0a0c14] border border-gray-700 rounded px-2 py-1.5 text-xs text-white">
              {GPS_SESSIONS.filter(s=>s.ring.centre>0).map(s => {
                const idx = GPS_SESSIONS.indexOf(s);
                return <option key={idx} value={idx}>Day {s.day} — {s.type} ({s.date})</option>;
              })}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[GPS_SESSIONS[compareA], GPS_SESSIONS[compareB]].map((s, i) => (
            <div key={i} className="space-y-3">
              <div className="text-xs font-medium text-gray-400 text-center">Session {i===0?'A':'B'} — Day {s.day}</div>
              <div className="flex justify-center">
                <RingHeatmap session={s} size={200} />
              </div>
              <RingZoneBar session={s} />
            </div>
          ))}
        </div>
        {GPS_SESSIONS[compareA].ring.centre > 0 && GPS_SESSIONS[compareB].ring.centre > 0 && (() => {
          const deltaC = GPS_SESSIONS[compareB].ring.centre - GPS_SESSIONS[compareA].ring.centre;
          const deltaR = GPS_SESSIONS[compareB].ring.ropes - GPS_SESSIONS[compareA].ring.ropes;
          return (
            <div className={`mt-4 p-3 rounded-lg border text-xs ${deltaC > 0 ? 'bg-green-900/20 border-green-600/20 text-green-400' : 'bg-yellow-900/20 border-yellow-600/20 text-yellow-400'}`}>
              <span className="font-medium">Footwork Trend: </span>
              Centre time {deltaC > 0 ? `+${deltaC}%` : `${deltaC}%`} · Ropes time {deltaR > 0 ? `+${deltaR}%` : `${deltaR}%`} between sessions.
              {deltaC > 3 ? ' ✓ Centre ring control improving — Jim\'s drills are working.' : deltaC < -3 ? ' ⚠ Drifting from centre — review footwork focus in next session.' : ' → Footwork pattern stable.'}
            </div>
          );
        })()}
      </div>
      <BoxingAISection context="training" fighter={fighter} session={session} />
    </div>
  );
}

function GPSVestDashboardView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const vests = [
    { id: 'LF-001', assigned: 'Marcus Cole', status: 'Active', battery: 94, lastSync: '08:14 today', sessions: 22, firmware: 'v2.4.1' },
    { id: 'LF-002', assigned: 'Darnell Hughes (Sparring)', status: 'Active', battery: 67, lastSync: '08:14 today', sessions: 14, firmware: 'v2.4.1' },
    { id: 'LF-003', assigned: 'Unassigned', status: 'Standby', battery: 100, lastSync: '3 days ago', sessions: 0, firmware: 'v2.4.0' },
  ];
  const beacons = [
    { id: 'UWB-NW', position: 'North West Corner', signal: 98 },
    { id: 'UWB-NE', position: 'North East Corner', signal: 96 },
    { id: 'UWB-SW', position: 'South West Corner', signal: 99 },
    { id: 'UWB-SE', position: 'South East Corner', signal: 72 },
  ];
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🦺" title="GPS Vest Dashboard" subtitle="Lumio Fight Vest hardware management — vests, UWB beacons, sync status" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Vests Active" value="2" sub="of 3 registered" color="green" />
        <StatCard label="UWB Beacons" value="4" sub="Ring tracking system" color="teal" />
        <StatCard label="Last Sync" value="08:14" sub="All data current" color="blue" />
        <StatCard label="Camp Sessions" value={fighter.camp_day} sub="GPS logged" color="orange" />
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Registered Vests</div>
        <div className="space-y-3">
          {vests.map((v, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-600/30 flex items-center justify-center text-lg">🦺</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{v.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${v.status === 'Active' ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'}`}>{v.status}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{v.assigned} · {v.sessions} sessions · Firmware {v.firmware}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">Battery</div>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-800 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${v.battery > 50 ? 'bg-green-500' : v.battery > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width:`${v.battery}%`}}/>
                  </div>
                  <span className="text-xs text-gray-300">{v.battery}%</span>
                </div>
                <div className="text-[10px] text-gray-600 mt-1">{v.lastSync}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">UWB Beacon Network — Ring Layout</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="relative">
            <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto">
              <rect x="20" y="20" width="260" height="260" rx="8" fill="#0a0c14" stroke="#555" strokeWidth="1.5"/>
              {beacons.map((beacon, i) => {
                const px = [20,260,20,260][i]; const py = [20,20,260,260][i];
                const col = beacon.signal > 90 ? '#22C55E' : beacon.signal > 75 ? '#F59E0B' : '#EF4444';
                return (
                  <g key={beacon.id}>
                    <circle cx={px} cy={py} r="14" fill={col} opacity="0.2"/>
                    <circle cx={px} cy={py} r="8" fill={col} opacity="0.7"/>
                    <text x={px} y={py+4} textAnchor="middle" fill="white" fontSize="7" fontWeight="600">UWB</text>
                    <text x={px+(i%2===0?-22:22)} y={py+(i<2?-6:6)} textAnchor="middle" fill={col} fontSize="7">{beacon.signal}%</text>
                  </g>
                );
              })}
              <text x="150" y="155" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10">RING</text>
              <text x="150" y="168" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8">UWB Active</text>
            </svg>
          </div>
          <div className="space-y-2">
            {beacons.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-2 bg-[#0a0c14] border border-gray-800 rounded">
                <div>
                  <div className="text-xs font-medium text-white">{b.id}</div>
                  <div className="text-[10px] text-gray-500">{b.position}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 bg-gray-800 rounded-full h-1">
                    <div className={`h-1 rounded-full ${b.signal > 90 ? 'bg-green-500' : b.signal > 75 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width:`${b.signal}%`}}/>
                  </div>
                  <span className={`text-xs ${b.signal > 90 ? 'text-green-400' : b.signal > 75 ? 'text-yellow-400' : 'text-red-400'}`}>{b.signal}%</span>
                </div>
              </div>
            ))}
            <div className="text-xs text-yellow-400 p-2 bg-yellow-900/20 border border-yellow-600/20 rounded">⚠ UWB-SE signal weak — reposition beacon or check for interference</div>
          </div>
        </div>
      </div>
      <BoxingAISection context="training" fighter={fighter} session={session} />
    </div>
  );
}

const COMPUBOX_DATA = [
  { round: 1, jabsLanded: 12, jabsThrown: 28, powerLanded: 8, powerThrown: 18, received: 9, ringZone: { centre: 60, ropes: 25, corners: 15 } },
  { round: 2, jabsLanded: 14, jabsThrown: 30, powerLanded: 11, powerThrown: 22, received: 7, ringZone: { centre: 55, ropes: 30, corners: 15 } },
  { round: 3, jabsLanded: 10, jabsThrown: 26, powerLanded: 9, powerThrown: 20, received: 12, ringZone: { centre: 45, ropes: 38, corners: 17 } },
  { round: 4, jabsLanded: 15, jabsThrown: 32, powerLanded: 13, powerThrown: 24, received: 6, ringZone: { centre: 62, ropes: 24, corners: 14 } },
  { round: 5, jabsLanded: 11, jabsThrown: 27, powerLanded: 10, powerThrown: 21, received: 11, ringZone: { centre: 50, ropes: 33, corners: 17 } },
];

// ─── FIND A PRO VIEW ──────────────────────────────────────────────────────────
function FindProView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const [tab, setTab] = useState<'trainer'|'gym'|'sparring'>('trainer')
  const [location, setLocation] = useState('')
  const [style, setStyle] = useState('')
  const [weightClass, setWeightClass] = useState('')
  const [budget, setBudget] = useState('')
  const [results, setResults] = useState('')
  const [loading, setLoading] = useState(false)
  const TABS = [{ id: 'trainer' as const, label: 'Find Trainer', emoji: '🥊' },{ id: 'gym' as const, label: 'Find Gym', emoji: '🏋️' },{ id: 'sparring' as const, label: 'Find Sparring', emoji: '🤜' }]
  const search = async () => {
    setLoading(true); setResults('')
    const prompts: Record<string, string> = {
      trainer: `You are a boxing career consultant. Find a trainer for a professional boxer. Weight class: ${weightClass || fighter.weight_class || 'heavyweight'}. Location: ${location || 'flexible'}. Style: ${style || 'any'}. Budget: ${budget || 'flexible'}. Search for and recommend 4 real professional boxing trainers currently active. For each write a paragraph covering: full name, gym base, career highlights, notable fighters trained, training style, contact/booking info if available, and why they suit this fighter. Respond in plain prose paragraphs. No bullet points, no markdown, no headers.`,
      gym: `You are a boxing career consultant. Find a professional boxing gym. Location: ${location || 'UK/flexible'}. Weight class: ${weightClass || fighter.weight_class || 'heavyweight'}. Budget: ${budget || 'flexible'}. Search for and recommend 4 real professional boxing gyms currently operating. For each write a paragraph covering: gym name, location, facilities, notable trainers based there, fighters who train there, membership/access info, and why it suits a travelling professional. Respond in plain prose paragraphs. No bullet points, no markdown, no headers.`,
      sparring: `You are a boxing career consultant. Find sparring partners. Weight class: ${weightClass || fighter.weight_class || 'heavyweight'}. Location: ${location || 'flexible'}. Style: ${style || 'any'}. Search for sparring services, boxing agencies, and gyms that facilitate sparring for professionals. Recommend 4 real options. For each write a paragraph covering who they are, where based, weight classes covered, how to arrange, and approximate cost. Respond in plain prose paragraphs. No bullet points, no markdown, no headers.`,
    }
    try {
      const res = await fetch('/api/ai/boxing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, tools: [{ type: 'web_search_20250305', name: 'web_search' }], messages: [{ role: 'user', content: prompts[tab] }] }) })
      const data = await res.json()
      const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text || ''
      setResults(text)
    } catch { setResults('Search failed — please try again.') }
    setLoading(false)
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-1"><span className="text-2xl">🔍</span><div><div className="text-lg font-bold text-white">Find a Pro</div><div className="text-xs" style={{ color: '#6B7280' }}>AI-powered live search for trainers, gyms and sparring partners</div></div></div>
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: '#0d1117' }}>
        {TABS.map(t => (<button key={t.id} onClick={() => { setTab(t.id); setResults('') }} className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all" style={{ background: tab === t.id ? '#ef4444' : 'transparent', color: tab === t.id ? '#fff' : '#6B7280' }}>{t.emoji} {t.label}</button>))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-semibold text-gray-400 mb-1 block">Location</label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. London, Las Vegas" className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#0d1117', border: '1px solid #1F2937' }} /></div>
        <div><label className="text-xs font-semibold text-gray-400 mb-1 block">Weight Class</label><input value={weightClass} onChange={e => setWeightClass(e.target.value)} placeholder="e.g. Middleweight" className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#0d1117', border: '1px solid #1F2937' }} /></div>
        <div><label className="text-xs font-semibold text-gray-400 mb-1 block">Style Preference</label><input value={style} onChange={e => setStyle(e.target.value)} placeholder="e.g. Technical, pressure fighter" className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#0d1117', border: '1px solid #1F2937' }} /></div>
        <div><label className="text-xs font-semibold text-gray-400 mb-1 block">Budget</label><input value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. £500/week" className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#0d1117', border: '1px solid #1F2937' }} /></div>
      </div>
      <button onClick={search} disabled={loading} className="w-full py-3 rounded-xl font-bold text-white transition-all" style={{ background: loading ? '#374151' : '#ef4444' }}>{loading ? '🔍 Searching live...' : `Search for ${TABS.find(t => t.id === tab)?.label}`}</button>
      {results && (<div className="rounded-xl p-4 space-y-3" style={{ background: '#0d1117', border: '1px solid #1F2937' }}><div className="text-xs font-bold" style={{ color: '#ef4444' }}>LIVE RESULTS · Powered by AI web search</div><div className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{results.split('\n\n').map((para, i) => (<p key={i} className="mb-3">{para}</p>))}</div><div className="text-xs" style={{ color: '#4B5563' }}>Results are AI-generated from live web search · Always verify contact details directly</div></div>)}
      <BoxingAISection context="default" fighter={fighter} session={session} />
    </div>
  )
}

// ─── PUNCH ANALYTICS VIEW ─────────────────────────────────────────────────────
function PunchAnalyticsView({ fighter: _fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const totalJabsLanded = COMPUBOX_DATA.reduce((a,r)=>a+r.jabsLanded,0);
  const totalJabsThrown = COMPUBOX_DATA.reduce((a,r)=>a+r.jabsThrown,0);
  const totalPowerLanded = COMPUBOX_DATA.reduce((a,r)=>a+r.powerLanded,0);
  const totalPowerThrown = COMPUBOX_DATA.reduce((a,r)=>a+r.powerThrown,0);
  const totalLanded = totalJabsLanded + totalPowerLanded;
  const totalThrown = totalJabsThrown + totalPowerThrown;
  const avgCentre = Math.round(COMPUBOX_DATA.reduce((a,r)=>a+r.ringZone.centre,0)/COMPUBOX_DATA.length);
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🥊" title="Punch Analytics + GPS Fusion" subtitle="World's first combined CompuBox punch stats + Lumio ring movement data — sparring session analysis" />
      <div className="flex items-center gap-2.5 rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid #ef444430' }}>
        <span>🛰️</span>
        <span className="text-xs" style={{ color: '#94a3b8' }}>GPS ring movement data fused with punch metrics. <button onClick={() => { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('lumio-navigate', { detail: 'gpsringheatmap' })) }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>View Ring Heatmap →</button></span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Connect %" value={`${Math.round((totalLanded/totalThrown)*100)}%`} sub={`${totalLanded} of ${totalThrown} thrown`} color="red" />
        <StatCard label="Jab Accuracy" value={`${Math.round((totalJabsLanded/totalJabsThrown)*100)}%`} sub={`${totalJabsLanded}/${totalJabsThrown}`} color="orange" />
        <StatCard label="Power Connect" value={`${Math.round((totalPowerLanded/totalPowerThrown)*100)}%`} sub={`${totalPowerLanded}/${totalPowerThrown}`} color="yellow" />
        <StatCard label="Avg Centre Time" value={`${avgCentre}%`} sub="GPS zone average" color="teal" />
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800"><div className="text-sm font-semibold text-white">Round-by-Round Fusion Data</div></div>
        <table className="w-full text-xs">
          <thead><tr className="text-gray-500 border-b border-gray-800 bg-[#0a0c14]">
            {['Round','Jabs L/T','Power L/T','Received','Connect %','Centre%','Ropes%','Corners%'].map(h=><th key={h} className="px-4 py-2 text-left font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {COMPUBOX_DATA.map((r, i) => {
              const conn = Math.round(((r.jabsLanded+r.powerLanded)/(r.jabsThrown+r.powerThrown))*100);
              return (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="px-4 py-2.5 text-white font-bold">R{r.round}</td>
                  <td className="px-4 py-2.5 text-gray-300">{r.jabsLanded}/{r.jabsThrown}</td>
                  <td className="px-4 py-2.5 text-gray-300">{r.powerLanded}/{r.powerThrown}</td>
                  <td className="px-4 py-2.5 text-red-400">{r.received}</td>
                  <td className="px-4 py-2.5"><span className={`font-medium ${conn>45?'text-green-400':conn>35?'text-yellow-400':'text-red-400'}`}>{conn}%</span></td>
                  <td className="px-4 py-2.5 text-teal-400">{r.ringZone.centre}%</td>
                  <td className="px-4 py-2.5 text-orange-400">{r.ringZone.ropes}%</td>
                  <td className="px-4 py-2.5 text-yellow-400">{r.ringZone.corners}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-600/20 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-2">GPS + Punch Correlation Insight</div>
        <div className="text-xs text-gray-300 leading-relaxed">
          Rounds where Marcus spent &gt;55% in the centre ring (R1, R2, R4) averaged <span className="text-green-400 font-medium">49% connect rate</span>. Rounds where he drifted to the ropes (&gt;35%) dropped to <span className="text-red-400 font-medium">37% connect rate</span>. This confirms the centre-ring strategy is directly linked to punch output efficiency. Jim&apos;s instruction: &quot;work the jab to keep centre position&quot; is statistically validated.
        </div>
      </div>
      <BoxingAISection context="training" fighter={_fighter} session={session} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── FIGHT NIGHT OPS VIEW ─────────────────────────────────────────────────────
const FIGHT_NIGHT_TIMELINE = [
  { time: '17:00', title: 'Arrive at venue',             detail: 'Dressing Room 14, Level 3' },
  { time: '17:30', title: 'Medicals — commission doctor', detail: 'Dr. Sarah Hughes, BBBofC' },
  { time: '18:00', title: 'Glove check with officials',   detail: '10oz Reyes, pre-approved' },
  { time: '18:30', title: 'Wrapping begins',              detail: 'Head cutman Mike Torres' },
  { time: '19:00', title: 'Undercard begins',             detail: '5-bout card' },
  { time: '20:30', title: 'Begin warm-up',                detail: 'Pad work with Ray Mitchell' },
  { time: '21:30', title: 'Final stretch & focus time',   detail: 'Hydration, mental reset' },
  { time: '22:00', title: 'RINGWALK',                     detail: '"Eye of the Tiger" — confirmed' },
  { time: '22:10', title: 'FIRST BELL',                   detail: 'Show time.' },
]

function FightNightOpsView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const [roundTab, setRoundTab] = useState<'early' | 'mid' | 'late'>('early')

  const generateCornerSheet = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const latestGPS = GPS_SESSIONS.filter(s=>s.ring.centre>0).slice(-1)[0];
    w.document.write(`<!DOCTYPE html><html><head><title>Corner Sheet — Cole vs Petrov</title>
    <style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#111;margin:0;padding:16px}
      h1{font-size:18px;margin:0 0 2px;color:#c0392b}h2{font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#666;margin:12px 0 6px;border-bottom:1px solid #ddd;padding-bottom:3px}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;border-bottom:3px solid #c0392b;padding-bottom:8px}
      .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
      .box{border:1px solid #ddd;border-radius:4px;padding:8px}.box-label{font-size:9px;color:#888;text-transform:uppercase;margin-bottom:2px}.box-val{font-size:14px;font-weight:700}
      .round-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:2px;margin-bottom:8px}
      .round-box{border:1px solid #ccc;border-radius:2px;padding:6px 2px;text-align:center;font-size:9px}
      .round-num{font-weight:700;margin-bottom:2px}.round-notes{height:32px;border-top:1px solid #eee;margin-top:4px}
      .game-plan{background:#fff8dc;border:1px solid #f0c040;border-radius:4px;padding:8px;margin-bottom:8px}
      .zone-row{display:flex;align-items:center;gap:8px;margin-bottom:4px}
      .zone-bar{flex:1;height:6px;background:#eee;border-radius:3px;overflow:hidden}
      .zone-fill{height:100%;border-radius:3px}
      footer{margin-top:16px;font-size:8px;color:#aaa;border-top:1px solid #eee;padding-top:6px;display:flex;justify-content:space-between}
      @media print{body{padding:8px}@page{size:A4;margin:8mm}}
    </style></head><body>
    <div class="header">
      <div>
        <h1>🥊 CORNER SHEET</h1>
        <div style="font-size:13px;font-weight:700">Marcus Cole vs Viktor Petrov</div>
        <div style="font-size:10px;color:#666">The O2 Arena, London · May 22, 2026 · DAZN PPV · Heavyweight</div>
      </div>
      <div style="text-align:right;font-size:10px;color:#666">
        <div style="font-weight:700;font-size:12px">TEAM COLE</div>
        <div>Trainer: Jim Bevan</div><div>Cutman: Mick Williamson</div><div>Corner: Danny Walsh</div>
      </div>
    </div>
    <div class="grid2" style="margin-bottom:12px">
      <div>
        <h2>Marcus Cole</h2>
        <div class="grid3">
          <div class="box"><div class="box-label">Record</div><div class="box-val">22-1</div></div>
          <div class="box"><div class="box-label">Stance</div><div class="box-val">Orthodox</div></div>
          <div class="box"><div class="box-label">Reach</div><div class="box-val">82"</div></div>
        </div>
      </div>
      <div>
        <h2>Viktor Petrov</h2>
        <div class="grid3">
          <div class="box"><div class="box-label">Record</div><div class="box-val" style="color:#c0392b">28-2</div></div>
          <div class="box"><div class="box-label">Stance</div><div class="box-val">Southpaw</div></div>
          <div class="box"><div class="box-label">Ranking</div><div class="box-val">WBC #3</div></div>
        </div>
      </div>
    </div>
    <h2>GPS Ring Zone Targets (from camp data)</h2>
    ${latestGPS ? `
    <div style="margin-bottom:10px">
      <div class="zone-row"><span style="width:60px;font-size:10px;color:#666">Centre</span><div class="zone-bar"><div class="zone-fill" style="width:${latestGPS.ring.centre}%;background:#c0392b"></div></div><span style="font-size:10px;font-weight:700">${latestGPS.ring.centre}%</span><span style="font-size:9px;color:#888;margin-left:8px">Target: ≥45% — control the centre against Petrov's southpaw jab</span></div>
      <div class="zone-row"><span style="width:60px;font-size:10px;color:#666">Ropes</span><div class="zone-bar"><div class="zone-fill" style="width:${latestGPS.ring.ropes}%;background:#e67e22"></div></div><span style="font-size:10px;font-weight:700">${latestGPS.ring.ropes}%</span><span style="font-size:9px;color:#888;margin-left:8px">Max 30% — don't let Petrov trap you</span></div>
      <div class="zone-row"><span style="width:60px;font-size:10px;color:#666">Corners</span><div class="zone-bar"><div class="zone-fill" style="width:${latestGPS.ring.corners}%;background:#f1c40f"></div></div><span style="font-size:10px;font-weight:700">${latestGPS.ring.corners}%</span><span style="font-size:9px;color:#888;margin-left:8px">Max 20% — exit immediately when trapped</span></div>
    </div>` : '<div style="color:#888;font-size:10px">No GPS data — session not tracked</div>'}
    <div class="game-plan"><div style="font-size:10px;font-weight:700;margin-bottom:4px">⚡ Game Plan — Jim Bevan</div><div style="font-size:10px">Jab to centre position. Pull counter right hand when Petrov throws his jab. Body shots from the clinch — left hook to body on the break. Do NOT let him work on the ropes. Rounds 1-4: establish jab, feel him out. R5-8: increase pressure, body work. R9+: take over.</div></div>
    <h2>Round-by-Round Notes</h2>
    <div class="round-grid">
      ${Array.from({length:12},(_,i)=>`<div class="round-box"><div class="round-num">R${i+1}</div><div class="round-notes"></div></div>`).join('')}
    </div>
    <div class="grid2">
      <div><h2>Cutman Notes</h2><div style="height:60px;border:1px solid #ddd;border-radius:4px;padding:6px;font-size:10px;color:#aaa">Cuts / swelling notes here...</div></div>
      <div><h2>Between Rounds — Key Reminders</h2><div style="font-size:10px;line-height:1.8">□ Breathe through nose between rounds<br/>□ Stay off the ropes in R1<br/>□ Work the body when in close<br/>□ Protect the chin against right hands<br/>□ Take water every round</div></div>
    </div>
    <footer><span>Lumio Fight · ${new Date().toLocaleDateString('en-GB')} · CONFIDENTIAL — Team Only</span><span>Cole vs Petrov · May 22, 2026 · The O2</span></footer>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const roundText: Record<'early' | 'mid' | 'late', string> = {
    early: 'Establish jab, gauge distance, respect his right hand. No risks. Win on points.',
    mid:   'If jab working — start throwing the right behind it. Body work in close.',
    late:  'If ahead — stay disciplined. If behind — open up, take risks from R10.',
  }
  const roundLabel: Record<'early' | 'mid' | 'late', string> = {
    early: 'Early rounds (R1–4)',
    mid:   'Middle rounds (R5–8)',
    late:  'Late rounds (R9–12)',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2"><span className="text-xl">🥊</span><h2 className="text-xl font-bold text-white">Fight Night Ops</h2></div>
          <p className="text-sm text-gray-400 mt-1 ml-7">Tonight&apos;s command centre — timeline, corner, strategy, broadcast, medical.</p>
        </div>
        <button onClick={generateCornerSheet} className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
          📋 Print Corner Sheet
        </button>
      </div>

      {/* 1. EVENT HEADER */}
      <div className="bg-gradient-to-br from-red-600/20 to-red-900/10 border border-red-600/30 rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs text-red-300 font-semibold uppercase tracking-widest mb-1">Main event</div>
            <div className="text-2xl font-bold text-white mb-1">{fighter.name} &ldquo;{fighter.nickname}&rdquo; vs Viktor Petrov</div>
            <div className="text-sm text-gray-300">{fighter.next_fight.venue}  ·  Saturday 15 June 2026  ·  22:00 Ringwalk</div>
          </div>
          <div className="bg-red-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-lg flex-shrink-0">
            FIGHT NIGHT — T-4 hours
          </div>
        </div>
      </div>

      {/* 2. TIMELINE */}
      <div className="bg-gray-950 border border-red-600/20 rounded-xl p-5">
        <div className="text-sm font-bold text-red-400 mb-4 uppercase tracking-wider">Timeline</div>
        <div className="space-y-3">
          {FIGHT_NIGHT_TIMELINE.map((t, i) => (
            <div key={i} className="flex items-start gap-4 border-l-2 border-red-600/40 pl-4 pb-2">
              <div className="text-xs font-mono font-bold text-red-400 w-12 flex-shrink-0">{t.time}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-semibold">{t.title}</div>
                <div className="text-xs text-gray-400">{t.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. CORNER TEAM CARD */}
      <div className="bg-gray-950 border border-red-600/20 rounded-xl p-5">
        <div className="text-sm font-bold text-red-400 mb-4 uppercase tracking-wider">Corner team</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { role: 'Head Trainer', name: 'Ray Mitchell', note: 'Tactics: pressure jab, cut off ring' },
            { role: 'Cutman',       name: 'Mike Torres',  note: 'Vaseline pre-loaded, adrenaline ready' },
            { role: 'Second',       name: 'Danny Cole (brother)', note: 'Water, mouthguard, stool' },
            { role: 'Manager',      name: 'Tommy Walsh',  note: 'At ringside, promoter liaison' },
          ].map((m, i) => (
            <div key={i} className="bg-black/40 border border-gray-800 rounded-lg p-3">
              <div className="text-[10px] uppercase tracking-widest text-red-400 font-semibold">{m.role}</div>
              <div className="text-sm text-white font-semibold mt-0.5">{m.name}</div>
              <div className="text-xs text-gray-400 mt-1">{m.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. ROUND-BY-ROUND STRATEGY */}
      <div className="bg-gray-950 border border-red-600/20 rounded-xl p-5">
        <div className="text-sm font-bold text-red-400 mb-4 uppercase tracking-wider">Round-by-round strategy</div>
        <div className="flex items-center gap-2 mb-4">
          {(['early', 'mid', 'late'] as const).map(t => (
            <button
              key={t}
              onClick={() => setRoundTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${roundTab === t ? 'border-red-500 bg-red-600/20 text-red-300' : 'border-gray-800 bg-black/40 text-gray-400 hover:border-gray-700'}`}
            >
              {roundLabel[t]}
            </button>
          ))}
        </div>
        <div className="bg-black/40 border border-gray-800 rounded-lg p-4 text-sm text-gray-200 italic mb-4">
          &ldquo;{roundText[roundTab]}&rdquo;
        </div>
        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2">Corner instruction — between rounds</div>
        <textarea
          defaultValue="Eyes on me. Breathe. Keep that jab high, pivot off the right foot. You're winning this round — same again."
          className="w-full bg-black/40 border border-gray-800 rounded-lg p-3 text-xs text-gray-200 min-h-[70px] focus:border-red-500/60 focus:outline-none"
        />
      </div>

      {/* 5. BROADCAST CHECKLIST */}
      <div className="bg-gray-950 border border-red-600/20 rounded-xl p-5">
        <div className="text-sm font-bold text-red-400 mb-4 uppercase tracking-wider">Broadcast checklist</div>
        <div className="space-y-2">
          {[
            { done: true,  text: 'Sky Sports producer briefed (3-minute feature pre-fight)' },
            { done: true,  text: 'DAZN stream active — 180 countries' },
            { done: false, text: 'Post-fight interview confirmed (ring or backstage?)' },
            { done: false, text: 'Social media team ready for result graphic' },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/60">
              <span className={`text-base ${c.done ? 'text-green-400' : 'text-gray-600'}`}>{c.done ? '☑' : '☐'}</span>
              <span className={`text-xs ${c.done ? 'text-white' : 'text-gray-400'}`}>{c.text}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-3">Press contact: Sarah James, Matchroom — 07xxx</div>
      </div>

      {/* 6. MEDICAL & SAFETY */}
      <div className="bg-gray-950 border border-red-600/20 rounded-xl p-5">
        <div className="text-sm font-bold text-red-400 mb-4 uppercase tracking-wider">Medical &amp; safety</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-black/40 border border-gray-800 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Commission doctor</div>
            <div className="text-sm text-white mt-0.5">Dr. Sarah Hughes, BBBofC</div>
            <div className="text-xs text-gray-400 mt-1">Ringside throughout</div>
          </div>
          <div className="bg-black/40 border border-gray-800 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Ambulance</div>
            <div className="text-sm text-green-400 mt-0.5">Confirmed — Bay 3</div>
            <div className="text-xs text-gray-400 mt-1">On standby</div>
          </div>
          <div className="bg-black/40 border border-gray-800 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Hospital</div>
            <div className="text-sm text-white mt-0.5">King&apos;s College Hospital</div>
            <div className="text-xs text-gray-400 mt-1">2.4 miles · trauma team alerted</div>
          </div>
          <div className="bg-black/40 border border-gray-800 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Suspension status</div>
            <div className="text-sm text-green-400 mt-0.5">Clean</div>
            <div className="text-xs text-gray-400 mt-1">Last test 14 May — passed</div>
          </div>
          <div className="bg-black/40 border border-gray-800 rounded-lg p-3 md:col-span-2">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Brain scan</div>
            <div className="text-sm text-green-400 mt-0.5">MRI completed 1 June — cleared</div>
          </div>
        </div>
      </div>

      {/* 7. WEIGH-IN CONFIRMATION */}
      <div className="bg-gray-950 border border-red-600/20 rounded-xl p-5">
        <div className="text-sm font-bold text-red-400 mb-4 uppercase tracking-wider">Weigh-in confirmation</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/40 border border-gray-800 rounded-lg p-4 text-center">
            <div className="text-[10px] uppercase tracking-widest text-gray-500">Petrov</div>
            <div className="text-2xl font-bold text-white mt-1">201.4 <span className="text-sm text-gray-400">lbs</span></div>
            <div className="text-xs text-green-400 mt-1">✅ Inside limit</div>
          </div>
          <div className="bg-black/40 border border-gray-800 rounded-lg p-4 text-center">
            <div className="text-[10px] uppercase tracking-widest text-gray-500">{fighter.name.split(' ')[1] || 'Cole'}</div>
            <div className="text-2xl font-bold text-white mt-1">199.8 <span className="text-sm text-gray-400">lbs</span></div>
            <div className="text-xs text-green-400 mt-1">✅ Inside limit</div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-3 text-center">Heavyweight division — no upper limit</div>
      </div>
      <BoxingAISection context="default" fighter={fighter} session={session} />
    </div>
  )
}

// ─── ROLE CONFIG ─────────────────────────────────────────────────────────────
const BOXING_ROLE_CONFIG: Record<string, { label: string; icon: string; accent: string; sidebar: 'all' | string[]; hiddenTabs: string[]; roundupChannels: 'all' | string[]; message: string | null }> = {
  fighter: { label: 'Fighter', icon: '🥊', accent: '#dc2626', sidebar: 'all', hiddenTabs: [], roundupChannels: 'all', message: null },
  trainer: { label: 'Trainer', icon: '🎽', accent: '#22C55E', sidebar: ['camp','training','sparring','opposition','gps','gpsvest','weight','recovery','medical','teamoverview','trainernotes','briefing'], hiddenTabs: ['quickwins','dontmiss'], roundupChannels: ['trainer','medical'], message: 'Training and preparation view.' },
  manager: { label: 'Manager', icon: '💼', accent: '#F59E0B', sidebar: ['camp','rankings','mandatory','pathtotitle','pursebid','pursesim','earnings','campcosts','tax','contracts','sponsorships','media','appearances','managerdash','agentintel','promoterpipeline'], hiddenTabs: ['dailytasks'], roundupChannels: ['manager','promoter','sponsor'], message: 'Fights, contracts and commercial view.' },
  promoter: { label: 'Promoter', icon: '🏟️', accent: '#8B5CF6', sidebar: ['camp','rankings','pursebid','pursesim','earnings','broadcast','news','promoterpipeline','fight-night'], hiddenTabs: ['dailytasks','team'], roundupChannels: ['promoter','broadcast'], message: 'Events and purse bids view.' },
  sponsor: { label: 'Sponsor', icon: '🤝', accent: '#F59E0B', sidebar: ['camp','sponsorships','media'], hiddenTabs: ['quickwins','dailytasks','dontmiss','team'], roundupChannels: ['sponsor'], message: null },
}

// ─── MODAL HELPER COMPONENTS ──────────────────────────────────────────────────

function ModalHeader({ icon, title, subtitle, onClose }: { icon: string; title: string; subtitle: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #1F2937' }}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="text-base font-bold text-white">{title}</div>
          <div className="text-xs" style={{ color: '#6B7280' }}>{subtitle}</div>
        </div>
      </div>
      <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">✕</button>
    </div>
  )
}

function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-2 px-6 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: i < current ? '#22C55E' : i === current ? '#dc2626' : 'rgba(255,255,255,0.05)', color: i <= current ? '#fff' : '#4B5563' }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className="text-xs font-semibold" style={{ color: i === current ? '#dc2626' : i < current ? '#22C55E' : '#4B5563' }}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className="flex-1 h-px" style={{ backgroundColor: i < current ? '#22C55E' : '#1F2937' }} />}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── MODAL COMPONENTS ─────────────────────────────────────────────────────────

function BoxingFlightFinder({ onClose, session, fighter }: { onClose: () => void; session: SportsDemoSession; fighter: BoxingFighter }) {
  const [step, setStep] = useState<'configure'|'searching'|'results'|'book'>('configure')
  const [from, setFrom] = useState('London Heathrow (LHR)')
  const [to, setTo] = useState('London City (LCY) — O2 Arena')
  const [depart, setDepart] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [cabinClass, setCabinClass] = useState('Business')
  const [passengers, setPassengers] = useState(4)
  const [results, setResults] = useState<Array<{airline:string;flightNo:string;departs:string;arrives:string;duration:string;stops:string;price:number;currency:string;score:number;badge?:string}>>([])
  const [selectedFlight, setSelectedFlight] = useState<typeof results[0] | null>(null)

  const UPCOMING = [
    { label: `vs ${fighter.next_fight.opponent} — ${fighter.next_fight.date}`, to: `${fighter.next_fight.venue.split(',')[1]?.trim() || 'London'}`, date: fighter.next_fight.date },
    { label: 'WBC Convention — Jun 15', to: 'Cancun (CUN)', date: '2026-06-14' },
    { label: 'Sparring Camp — Jul', to: 'Las Vegas (LAS)', date: '2026-07-01' },
  ]

  const FALLBACK_RESULTS = [
    { airline:'British Airways', flightNo:'BA2760', departs:'07:20', arrives:'10:35', duration:'2h15m', stops:'Direct', price:312, currency:'GBP', score:96, badge:'Best value' },
    { airline:'easyJet', flightNo:'EZY8832', departs:'06:05', arrives:'09:20', duration:'2h15m', stops:'Direct', price:187, currency:'GBP', score:88, badge:'Cheapest' },
    { airline:'Virgin Atlantic', flightNo:'VS402', departs:'09:45', arrives:'13:10', duration:'3h25m', stops:'1 stop', price:298, currency:'GBP', score:82, badge:'Best schedule' },
    { airline:'Ryanair', flightNo:'FR7803', departs:'11:30', arrives:'14:45', duration:'2h15m', stops:'Direct', price:124, currency:'GBP', score:75 },
  ]

  const searchFlights = async () => {
    setStep('searching')
    try {
      const res = await fetch('/api/ai/boxing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          messages: [{ role: 'user', content: `Find 4 ${cabinClass} class flights from ${from} to ${to} departing ${depart || 'next week'} for ${passengers} passengers. Return ONLY a JSON array: [{"airline":"","flightNo":"","departs":"","arrives":"","duration":"","stops":"","price":0,"currency":"GBP","score":0,"badge":""}]. Score 0-100 for value. Badge: "Best value", "Cheapest", "Best schedule", or null. Realistic prices.` }]
        })
      })
      const data = await res.json()
      const text = data.content?.filter((b:{type:string}) => b.type === 'text').map((b:{text:string}) => b.text).join('') || ''
      const match = text.match(/\[[\s\S]*\]/)
      setResults(match ? JSON.parse(match[0]) : FALLBACK_RESULTS)
    } catch { setResults(FALLBACK_RESULTS) }
    setStep('results')
  }

  return (
    <>
      <ModalHeader icon="✈️" title="Smart Flight Finder" subtitle="AI searches multiple airlines for the best deal" onClose={onClose} />
      {step !== 'searching' && <StepIndicator steps={['Configure','Search','Results','Book']} current={['configure','searching','results','book'].indexOf(step)} />}
      <div className="p-6">
        {step === 'configure' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: '#6B7280' }}>Upcoming fights &amp; events</label>
              <div className="flex flex-wrap gap-2">
                {UPCOMING.map(t => (
                  <button key={t.label} onClick={() => { setTo(t.to); setDepart(t.date) }}
                    className="text-xs px-3 py-1.5 rounded-full transition-all"
                    style={{ backgroundColor: to === t.to ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.05)', border: to === t.to ? '1px solid #dc2626' : '1px solid #1F2937', color: to === t.to ? '#dc2626' : '#9CA3AF' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-500 mb-1 block">From</label><input value={from} onChange={e => setFrom(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">To</label><input value={to} onChange={e => setTo(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Depart</label><input type="date" value={depart} onChange={e => setDepart(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Return</label><input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-500 mb-1 block">Cabin</label><select value={cabinClass} onChange={e => setCabinClass(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}><option>Economy</option><option>Premium Economy</option><option>Business</option><option>First</option></select></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Passengers (corner team)</label><div className="flex items-center gap-3 pt-1"><button onClick={() => setPassengers(Math.max(1,passengers-1))} className="w-8 h-8 rounded-lg font-bold text-white" style={{backgroundColor:'#1F2937'}}>−</button><span className="text-sm font-bold text-white w-4 text-center">{passengers}</span><button onClick={() => setPassengers(Math.min(10,passengers+1))} className="w-8 h-8 rounded-lg font-bold text-white" style={{backgroundColor:'#1F2937'}}>+</button></div></div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
              <span className="text-base flex-shrink-0">🤖</span>
              <p className="text-xs" style={{ color: '#FCA5A5' }}>Lumio AI searches BA, easyJet, Ryanair, Virgin, Emirates and more — scoring on price, duration, and quality for the full corner team.</p>
            </div>
            <button onClick={searchFlights} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Search Flights →</button>
          </div>
        )}
        {step === 'searching' && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4 animate-bounce">✈️</div>
            <div className="text-base font-bold text-white mb-2">Searching all airlines...</div>
            <div className="text-xs mb-6" style={{ color: '#6B7280' }}>Checking BA, easyJet, Ryanair, Virgin, Emirates + more</div>
          </div>
        )}
        {step === 'results' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2"><div className="text-sm font-bold text-white">{results.length} flights found</div><div className="text-xs" style={{ color: '#6B7280' }}>{from} → {to} · {cabinClass} · {passengers} pax</div></div>
            {results.map((f, i) => (
              <div key={i} onClick={() => setSelectedFlight(f)} className="rounded-xl p-4 cursor-pointer transition-all"
                style={{ backgroundColor: selectedFlight?.flightNo === f.flightNo ? 'rgba(220,38,38,0.1)' : '#111318', border: selectedFlight?.flightNo === f.flightNo ? '1px solid #dc2626' : '1px solid #1F2937' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{f.airline}</span>
                      <span className="text-xs" style={{ color: '#4B5563' }}>{f.flightNo}</span>
                      {f.badge && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: f.badge === 'Best value' ? '#dc2626' : f.badge === 'Cheapest' ? '#22C55E' : '#8B5CF6' }}>{f.badge}</span>}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{f.departs} → {f.arrives} · {f.duration} · {f.stops}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-white">{f.currency} {(f.price*passengers).toLocaleString()}</div>
                    <div className="text-[10px]" style={{ color: '#22C55E' }}>Score: {f.score}/100</div>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep('configure')} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Search again</button>
              <button onClick={() => selectedFlight && setStep('book')} disabled={!selectedFlight} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: selectedFlight ? '#dc2626' : '#374151' }}>Book selected →</button>
            </div>
          </div>
        )}
        {step === 'book' && selectedFlight && (
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
              <div className="text-sm font-bold text-white mb-2">Booking summary</div>
              <div className="space-y-1 text-xs" style={{ color: '#9CA3AF' }}>
                {[['Route',`${from} → ${to}`],['Flight',`${selectedFlight.airline} ${selectedFlight.flightNo}`],['Departs',`${depart} at ${selectedFlight.departs}`],['Class',cabinClass],['Passengers',String(passengers)],['Total',`${selectedFlight.currency} ${(selectedFlight.price*passengers).toLocaleString()}`]].map(([l,v]) => (
                  <div key={l} className="flex justify-between"><span>{l}</span><span className="text-white">{v}</span></div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('results')} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Back</button>
              <button onClick={() => { const s = encodeURIComponent(`Flight booking — ${from} to ${to}`); const b = encodeURIComponent(`Please book: ${selectedFlight.airline} ${selectedFlight.flightNo}, ${depart}, ${cabinClass}, ${passengers} pax, ${selectedFlight.currency} ${(selectedFlight.price*passengers).toLocaleString()}\n\nThanks, ${session.userName || 'Marcus'}`); window.open(`mailto:danny.walsh@manager.com?subject=${s}&body=${b}`) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>📧 Send to manager →</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function BoxingMatchPrepAI({ onClose, session, fighter }: { onClose: () => void; session: SportsDemoSession; fighter: BoxingFighter }) {
  const [opponent, setOpponent] = useState(fighter.next_fight.opponent)
  const [venue, setVenue] = useState(fighter.next_fight.venue)
  const [loading, setLoading] = useState(false)
  const [brief, setBrief] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/boxing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          messages: [{ role: 'user', content: `You are an elite boxing analyst. Generate a tactical fight prep brief for ${session.userName || fighter.name} "${fighter.nickname}" (${fighter.record.wins}-${fighter.record.losses}, ${fighter.record.ko} KO, ${fighter.stance}, WBC #${fighter.rankings.wbc}) vs ${opponent} (${fighter.next_fight.opponent_record}, ${fighter.next_fight.opponent_ranking}) at ${venue}. Cover: OPPONENT PROFILE, OFFENSIVE THREATS, DEFENSIVE WEAKNESSES, TACTICAL GAME PLAN (4-5 specific round-by-round strategies), CLINCH & INSIDE WORK, CONDITIONING TARGET, MENTAL EDGE. Use emoji headers. Max 400 words.` }]
        })
      })
      const data = await res.json()
      setBrief(data.content?.[0]?.text || 'Unable to generate brief.')
    } catch { setBrief('Unable to generate brief.') }
    setLoading(false)
  }

  return (
    <>
      <ModalHeader icon="🥊" title="Fight Prep AI" subtitle="AI tactical brief for your next opponent" onClose={onClose} />
      <div className="p-6 space-y-4">
        {!brief ? (<>
          <div className="grid grid-cols-1 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Opponent</label><input value={opponent} onChange={e => setOpponent(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Venue</label><input value={venue} onChange={e => setVenue(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          </div>
          <button onClick={generate} disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>{loading ? '⏳ Generating...' : '🧠 Generate Fight Prep Brief →'}</button>
        </>) : (<>
          <div className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB', maxHeight: 400, overflowY: 'auto' }}>{brief}</div>
          <div className="flex gap-3">
            <button onClick={() => setBrief(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Regenerate</button>
            <button onClick={() => navigator.clipboard.writeText(brief)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>📋 Copy brief</button>
          </div>
        </>)}
      </div>
    </>
  )
}

function BoxingSponsorPost({ onClose, session, fighter }: { onClose: () => void; session: SportsDemoSession; fighter: BoxingFighter }) {
  const [sponsor, setSponsor] = useState('Under Armour')
  const [platform, setPlatform] = useState('Instagram')
  const [context, setContext] = useState(`Camp day ${fighter.camp_day} — fight prep`)
  const [tone, setTone] = useState('Professional')
  const [loading, setLoading] = useState(false)
  const [post, setPost] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/boxing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500, messages: [{ role: 'user', content: `Write a ${platform} sponsor post for ${session.userName || fighter.name} "${fighter.nickname}" (${fighter.weight_class} boxer, ${fighter.record.wins}-${fighter.record.losses}) featuring ${sponsor}. Context: ${context}. Next fight: vs ${fighter.next_fight.opponent} in ${fighter.next_fight.days_away} days. Tone: ${tone}. Natural, not salesy. Include hashtags. Write ONLY the caption.` }] })
      })
      const data = await res.json()
      setPost(data.content?.[0]?.text || 'Unable to generate.')
    } catch { setPost('Unable to generate.') }
    setLoading(false)
  }

  return (
    <>
      <ModalHeader icon="📱" title="Sponsor Post Generator" subtitle="AI writes authentic sponsor content" onClose={onClose} />
      <div className="p-6 space-y-4">
        {!post ? (<>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Sponsor</label><select value={sponsor} onChange={e => setSponsor(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}>{['Under Armour','DAZN','Everlast','Huel','Sky Sports','BoXer'].map(s => <option key={s}>{s}</option>)}</select></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Platform</label><select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}>{['Instagram','Twitter/X','Facebook','LinkedIn','TikTok'].map(p => <option key={p}>{p}</option>)}</select></div>
          </div>
          <div><label className="text-xs text-gray-500 mb-1 block">Context</label><textarea value={context} onChange={e => setContext(e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm text-white resize-none" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <div><label className="text-xs text-gray-500 mb-2 block">Tone</label><div className="flex flex-wrap gap-2">{['Professional','Casual','Motivational','Humorous','Grateful'].map(t => (<button key={t} onClick={() => setTone(t)} className="text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: tone===t?'rgba(220,38,38,0.2)':'rgba(255,255,255,0.05)', border: tone===t?'1px solid #dc2626':'1px solid #1F2937', color: tone===t?'#dc2626':'#9CA3AF' }}>{t}</button>))}</div></div>
          <button onClick={generate} disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>{loading ? '⏳ Writing...' : '✍️ Generate Post →'}</button>
        </>) : (<>
          <div className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB' }}>{post}</div>
          <div className="flex gap-3"><button onClick={() => setPost(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Regenerate</button><button onClick={() => navigator.clipboard.writeText(post)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>📋 Copy post</button></div>
        </>)}
      </div>
    </>
  )
}

function BoxingRankingSimulator({ onClose, fighter }: { onClose: () => void; fighter: BoxingFighter }) {
  return (
    <>
      <ModalHeader icon="📊" title="Ranking Simulator" subtitle="WBC/IBF what-if ranking calculator" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div><div className="text-2xl font-black" style={{ color: '#dc2626' }}>#{fighter.rankings.wbc}</div><div className="text-xs" style={{ color: '#6B7280' }}>WBC</div></div>
            <div><div className="text-2xl font-black" style={{ color: '#EF4444' }}>#{fighter.rankings.wba}</div><div className="text-xs" style={{ color: '#6B7280' }}>WBA</div></div>
            <div><div className="text-2xl font-black" style={{ color: '#F59E0B' }}>#{fighter.rankings.wbo}</div><div className="text-xs" style={{ color: '#6B7280' }}>WBO</div></div>
            <div><div className="text-2xl font-black text-white">#{fighter.rankings.ibf}</div><div className="text-xs" style={{ color: '#6B7280' }}>IBF</div></div>
          </div>
        </div>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">If you beat {fighter.next_fight.opponent} ({fighter.next_fight.opponent_ranking}):</div>
        {[
          { label:'🥊 KO/TKO Win', wcbDelta:-2, ibfDelta:-3, color:'#22C55E' },
          { label:'📋 Unanimous Decision', wcbDelta:-1, ibfDelta:-2, color:'#0ea5e9' },
          { label:'🤝 Split Decision', wcbDelta:-1, ibfDelta:-1, color:'#F59E0B' },
          { label:'❌ Loss (any method)', wcbDelta:+2, ibfDelta:+1, color:'#EF4444' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div><div className="text-sm font-bold text-white">{s.label}</div><div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>vs {fighter.next_fight.opponent} at {fighter.next_fight.venue}</div></div>
            <div className="text-right">
              <div className="text-lg font-black" style={{ color: s.color }}>WBC #{Math.max(1,fighter.rankings.wbc+s.wcbDelta)}</div>
              <div className="text-xs" style={{ color: s.color }}>IBF #{Math.max(1,fighter.rankings.ibf+s.ibfDelta)}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function BoxingInjuryLogger({ onClose }: { onClose: () => void }) {
  const [bodyPart, setBodyPart] = useState('')
  const [severity, setSeverity] = useState<'mild'|'moderate'|'severe'>('mild')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const PARTS = ['Right Hand','Left Hand','Right Shoulder','Left Shoulder','Ribs','Nose','Eye (cut)','Knee','Back','Ankle','Other']
  return (<>
    <ModalHeader icon="🏥" title="Log Injury" subtitle="Log and auto-notify your medical team" onClose={onClose} />
    <div className="p-6 space-y-4">
      {!submitted ? (<>
        <div><label className="text-xs text-gray-500 mb-1 block">Body part</label><div className="flex flex-wrap gap-2">{PARTS.map(p => (<button key={p} onClick={() => setBodyPart(p)} className="text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: bodyPart===p?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.05)', border: bodyPart===p?'1px solid #EF4444':'1px solid #1F2937', color: bodyPart===p?'#EF4444':'#9CA3AF' }}>{p}</button>))}</div></div>
        <div><label className="text-xs text-gray-500 mb-1 block">Severity</label><div className="flex gap-2">{(['mild','moderate','severe'] as const).map(s => (<button key={s} onClick={() => setSeverity(s)} className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: severity===s?(s==='mild'?'#22C55E':s==='moderate'?'#F59E0B':'#EF4444'):'rgba(255,255,255,0.05)', color: severity===s?'#fff':'#9CA3AF' }}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>))}</div></div>
        <div><label className="text-xs text-gray-500 mb-1 block">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="When did it happen? During sparring?" className="w-full px-3 py-2.5 rounded-xl text-sm text-white resize-none" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
        <button onClick={() => setSubmitted(true)} disabled={!bodyPart} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: bodyPart?'#EF4444':'#374151' }}>Log Injury & Notify Team →</button>
      </>) : (
        <div className="text-center py-8"><div className="text-5xl mb-3">✅</div><div className="text-base font-bold text-white mb-2">Injury logged</div><div className="text-sm mb-4" style={{ color: '#6B7280' }}>Dr. Sarah Mitchell and physio Liam Brennan notified.</div><button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Done</button></div>
      )}
    </div>
  </>)
}

function BoxingExpenseLogger({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('GBP')
  const [category, setCategory] = useState('Travel')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const CATS = ['Travel','Hotel','Equipment','Sparring Partners','Medical','Nutrition','Camp Rent','Cornerman','Other']
  return (<>
    <ModalHeader icon="🧾" title="Log Camp Expense" subtitle="Quick expense logging" onClose={onClose} />
    <div className="p-6 space-y-4">
      {!submitted ? (<>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">Amount</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Currency</label><select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}>{['GBP','EUR','USD','AED'].map(c => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div><label className="text-xs text-gray-500 mb-2 block">Category</label><div className="flex flex-wrap gap-2">{CATS.map(c => (<button key={c} onClick={() => setCategory(c)} className="text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: category===c?'rgba(220,38,38,0.2)':'rgba(255,255,255,0.05)', border: category===c?'1px solid #dc2626':'1px solid #1F2937', color: category===c?'#dc2626':'#9CA3AF' }}>{c}</button>))}</div></div>
        <div><label className="text-xs text-gray-500 mb-1 block">Description</label><input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Sparring partner day rate — Darnell Hughes" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
        <button onClick={() => setSubmitted(true)} disabled={!amount} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: amount?'#dc2626':'#374151' }}>Log Expense →</button>
      </>) : (
        <div className="text-center py-8"><div className="text-5xl mb-3">✅</div><div className="text-base font-bold text-white mb-2">{currency} {amount} logged</div><div className="text-sm mb-4" style={{ color: '#6B7280' }}>{category} — forwarded to accountant.</div><button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Done</button></div>
      )}
    </div>
  </>)
}

function BoxingWeightCheck({ onClose, fighter }: { onClose: () => void; fighter: BoxingFighter }) {
  const [weight, setWeight] = useState('')
  const [time, setTime] = useState<'morning'|'post-training'|'evening'>('morning')
  const [submitted, setSubmitted] = useState(false)
  return (<>
    <ModalHeader icon="⚖️" title="Quick Weight Log" subtitle="Record weight and sync to tracker" onClose={onClose} />
    <div className="p-6 space-y-4">
      {!submitted ? (<>
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="text-xs" style={{ color: '#6B7280' }}>Current</div>
          <div className="text-3xl font-black text-white">{fighter.current_weight}kg</div>
          <div className="text-xs mt-1" style={{ color: '#6B7280' }}>Target: {fighter.target_weight}kg · {(fighter.current_weight - fighter.target_weight).toFixed(1)}kg to go</div>
        </div>
        <div><label className="text-xs text-gray-500 mb-1 block">New weight (kg)</label><input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder={String(fighter.current_weight)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white text-center text-2xl font-bold" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
        <div><label className="text-xs text-gray-500 mb-1 block">Time of weigh-in</label><div className="flex gap-2">{(['morning','post-training','evening'] as const).map(t => (<button key={t} onClick={() => setTime(t)} className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: time===t?'rgba(220,38,38,0.2)':'rgba(255,255,255,0.05)', border: time===t?'1px solid #dc2626':'1px solid #1F2937', color: time===t?'#dc2626':'#9CA3AF' }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>))}</div></div>
        <button onClick={() => setSubmitted(true)} disabled={!weight} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: weight?'#dc2626':'#374151' }}>Log Weight →</button>
      </>) : (
        <div className="text-center py-8"><div className="text-5xl mb-3">⚖️</div><div className="text-base font-bold text-white mb-2">{weight}kg logged</div><div className="text-sm mb-4" style={{ color: '#6B7280' }}>{time} weigh-in · Synced to weight tracker · Nutritionist notified.</div><button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Done</button></div>
      )}
    </div>
  </>)
}

function BoxingVisaCheck({ onClose, fighter }: { onClose: () => void; fighter: BoxingFighter }) {
  const venueCountry = fighter.next_fight.venue.split(',').pop()?.trim() || 'UK'
  const UPCOMING = [
    { event:`vs ${fighter.next_fight.opponent}`, country: venueCountry, flag:'🇬🇧', date: fighter.next_fight.date, visa:'✅ Home nation', detail:'No requirements' },
    { event:'WBC Convention', country:'Mexico', flag:'🇲🇽', date:'Jun 2026', visa:'✅ No visa required', detail:'Tourist visa waiver for UK citizens' },
    { event:'Potential fight — Las Vegas', country:'USA', flag:'🇺🇸', date:'Sep 2026', visa:'⚠️ P-1 Visa required', detail:'Athlete visa — apply 60 days in advance. Manager to action.' },
    { event:'Training camp — Dubai', country:'UAE', flag:'🇦🇪', date:'Oct 2026', visa:'✅ Visa on arrival', detail:'30-day tourist visa for UK citizens' },
  ]
  return (<>
    <ModalHeader icon="🌍" title="Visa Check" subtitle="Requirements for upcoming fight locations" onClose={onClose} />
    <div className="p-6 space-y-3">
      {UPCOMING.map(t => (
        <div key={t.event} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: `1px solid ${t.visa.includes('⚠️')?'rgba(245,158,11,0.3)':'#1F2937'}` }}>
          <div className="flex items-start justify-between"><div className="flex items-center gap-3"><span className="text-2xl">{t.flag}</span><div><div className="text-sm font-bold text-white">{t.event}</div><div className="text-xs" style={{ color: '#6B7280' }}>{t.country} · {t.date}</div></div></div><div className="text-xs font-bold">{t.visa}</div></div>
          <div className="text-xs mt-2" style={{ color: '#6B7280' }}>{t.detail}</div>
        </div>
      ))}
    </div>
  </>)
}

// ─── SPONSOR DASHBOARD ────────────────────────────────────────────────────────

function BoxingSponsorDashboard({ session, fighter }: { session: SportsDemoSession; fighter: BoxingFighter }) {
  const [activeTab, setActiveTab] = useState<'overview'|'obligations'|'content'|'events'|'roi'>('overview')
  const sponsorName = session.clubName || 'Under Armour'
  const sponsorColor = '#D4AF37'
  const sponsorLogo = session.logoDataUrl

  const OBLIGATIONS = [
    { id:'o1', title:'Instagram post — camp kit photo', due:'Today', status:'pending', platform:'Instagram', reach:'180k' },
    { id:'o2', title:'DAZN promo shoot — confirm logistics', due:'Today', status:'pending', platform:'Multi', reach:'2.4M' },
    { id:'o3', title:'Pre-fight press conference — wear sponsor kit', due:`${fighter.next_fight.days_away - 2}d`, status:'scheduled', platform:'TV/Press', reach:'3.2M' },
    { id:'o4', title:'Fight night walkout — branded robe', due:`${fighter.next_fight.days_away}d`, status:'upcoming', platform:'PPV', reach:'4.8M' },
    { id:'o5', title:'Post-fight interview — branded cap', due:`${fighter.next_fight.days_away}d`, status:'upcoming', platform:'TV/Social', reach:'6.1M' },
    { id:'o6', title:'Victory celebration social post', due:`${fighter.next_fight.days_away + 1}d`, status:'upcoming', platform:'Instagram', reach:'280k' },
  ]

  const CONTENT = [
    { title:'Camp training montage — Under Armour kit', date:'2 Apr', type:'Video', platform:'Instagram', likes:'12.4k', reach:'340k' },
    { title:'Weigh-in countdown — DAZN promo', date:'28 Mar', type:'Story', platform:'Instagram', likes:'8.1k', reach:'210k' },
    { title:'Sparring highlight reel', date:'25 Mar', type:'Video', platform:'TikTok', likes:'24.7k', reach:'680k' },
  ]

  const EVENTS = [
    { event:`vs ${fighter.next_fight.opponent} — ${fighter.next_fight.venue}`, date:fighter.next_fight.date, venue:fighter.next_fight.venue, broadcast:`${fighter.next_fight.broadcast}`, exposure:'Est. 4.8M PPV buys' },
    { event:'Weigh-in — Press Conference', date:`${fighter.next_fight.days_away - 1}d`, venue:fighter.next_fight.venue, broadcast:'DAZN, Sky Sports News', exposure:'Est. 1.2M viewers' },
    { event:'Pre-fight press tour', date:`${fighter.next_fight.days_away - 7}d`, venue:'Multiple cities', broadcast:'Social / YouTube', exposure:'Est. 2.1M impressions' },
    { event:'Post-fight media obligations', date:`${fighter.next_fight.days_away + 1}d`, venue:fighter.next_fight.venue, broadcast:'DAZN, BBC', exposure:'Est. 3.5M viewers' },
  ]

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      {/* Hero banner */}
      <div className="relative px-8 py-6" style={{ background: `linear-gradient(135deg, ${sponsorColor}25 0%, rgba(0,0,0,0.8) 60%, #0d1117 100%)`, borderBottom: `1px solid ${sponsorColor}30` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: `${sponsorColor}20`, border: `2px solid ${sponsorColor}40` }}>
              {sponsorLogo ? <img src={sponsorLogo} alt={sponsorName} className="w-full h-full object-contain p-1" /> : <span className="text-2xl font-black" style={{ color: sponsorColor }}>{sponsorName.slice(0,2).toUpperCase()}</span>}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: sponsorColor }}>Partner Portal</div>
              <h1 className="text-2xl font-black text-white">{sponsorName}</h1>
              <div className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Official partner of {session.userName || fighter.name} &quot;{fighter.nickname}&quot; · WBC #{fighter.rankings.wbc}</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {[{ label:'Obligations', value:'6 total', sub:'2 due today', color:'#EF4444' }, { label:'PPV exposure', value:'4.8M', sub:'fight night est.', color:sponsorColor }, { label:'Deal value', value:'£180k/yr', sub:'renewal 90d', color:'#22C55E' }, { label:'WBC ranking', value:`#${fighter.rankings.wbc}`, sub:'current', color:'#dc2626' }].map((s,i) => (
              <div key={i} className="text-center px-4 py-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] text-white font-semibold">{s.label}</div>
                <div className="text-[9px] mt-0.5" style={{ color: '#4B5563' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b px-6 overflow-x-auto" style={{ borderColor: '#1F2937', backgroundColor: '#0d1117' }}>
        {([{ id:'overview' as const, label:'Overview', icon:'🏠' }, { id:'obligations' as const, label:'Obligations', icon:'📋' }, { id:'content' as const, label:'Content', icon:'📸' }, { id:'events' as const, label:'Events', icon:'🥊' }, { id:'roi' as const, label:'ROI & Reach', icon:'📊' }]).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className="flex items-center gap-1.5 px-5 py-3 text-xs font-semibold border-b-2 transition-all -mb-px whitespace-nowrap" style={{ borderColor: activeTab === t.id ? sponsorColor : 'transparent', color: activeTab === t.id ? '#F1C40F' : '#6B7280' }}><span>{t.icon}</span>{t.label}</button>
        ))}
      </div>

      <div className="p-6">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {OBLIGATIONS.filter(o => o.status === 'pending').length > 0 && (
              <div className="rounded-xl p-5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <div className="flex items-center gap-2 mb-3"><span>🔴</span><span className="text-sm font-bold text-white">{OBLIGATIONS.filter(o => o.status === 'pending').length} obligations due today</span></div>
                {OBLIGATIONS.filter(o => o.status === 'pending').map(o => (
                  <div key={o.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
                    <div><div className="text-sm text-white">{o.title}</div><div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{o.platform} · Est. reach {o.reach}</div></div>
                    <span className="text-xs px-2 py-1 rounded font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#EF4444' }}>Due {o.due}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-bold text-white">Brand visibility — next fight</p><p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{fighter.name} vs {fighter.next_fight.opponent} at {fighter.next_fight.venue} — {fighter.next_fight.broadcast}</p></div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[{ label:'Expected PPV viewers', value:'4.8M', icon:'📺', color:sponsorColor }, { label:'Social following', value:'1.2M', icon:'📱', color:'#dc2626' }, { label:'Press accredited', value:'200+', icon:'📰', color:'#8B5CF6' }].map((s,i) => (
                  <div key={i} className="text-center p-4 rounded-xl" style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}><div className="text-2xl mb-1">{s.icon}</div><div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div><div className="text-xs mt-1" style={{ color: '#6B7280' }}>{s.label}</div></div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <p className="text-sm font-bold text-white mb-3">Season obligations</p>
                <div className="flex items-center gap-3 mb-2"><div className="flex-1 bg-gray-800 rounded-full h-2"><div className="h-2 rounded-full" style={{ width:'0%', backgroundColor: sponsorColor }} /></div><span className="text-xs font-bold" style={{ color: sponsorColor }}>0/{OBLIGATIONS.length}</span></div>
                <div className="space-y-1 text-xs">
                  {[['Pending',OBLIGATIONS.filter(o=>o.status==='pending').length,'#EF4444'],['Scheduled',OBLIGATIONS.filter(o=>o.status==='scheduled').length,'#0ea5e9'],['Upcoming',OBLIGATIONS.filter(o=>o.status==='upcoming').length,'#6B7280']].map(([l,v,c]) => (
                    <div key={l as string} className="flex justify-between" style={{ color: '#6B7280' }}><span>{l as string}</span><span style={{ color: c as string }}>{v as number}</span></div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <p className="text-sm font-bold text-white mb-3">Deal summary</p>
                {[['Partner since','January 2025'],['Deal value','£180,000/yr'],['Renewal date','July 2026 (90d)'],['Obligations','6 activations / fight cycle'],['Events','Walkout + press conference']].map(([l,v]) => (
                  <div key={l} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid #1F2937' }}><span className="text-xs" style={{ color: '#6B7280' }}>{l}</span><span className="text-xs font-bold text-white">{v}</span></div>
                ))}
                <div className="mt-3 pt-2"><button className="w-full py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: sponsorColor }}>Discuss renewal →</button></div>
              </div>
            </div>
          </div>
        )}

        {/* OBLIGATIONS */}
        {activeTab === 'obligations' && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-xl font-black text-white">Content Obligations</h2>
            {OBLIGATIONS.map(o => (
              <div key={o.id} className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: `1px solid ${o.status==='pending'?'rgba(239,68,68,0.3)':'#1F2937'}` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1"><span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: o.status==='pending'?'rgba(239,68,68,0.15)':o.status==='scheduled'?'rgba(14,165,233,0.15)':'rgba(107,114,128,0.15)', color: o.status==='pending'?'#EF4444':o.status==='scheduled'?'#0ea5e9':'#6B7280' }}>{o.status==='pending'?'⏰ Due today':o.status==='scheduled'?'📅 Scheduled':'⏳ Upcoming'}</span><span className="text-xs" style={{ color: '#6B7280' }}>{o.platform}</span></div>
                    <h3 className="font-bold text-sm text-white mb-1">{o.title}</h3>
                    <div className="text-xs" style={{ color: '#6B7280' }}>Due: {o.due} · Est. reach: {o.reach}</div>
                  </div>
                  {o.status === 'pending' && <button className="text-xs px-3 py-1.5 rounded-lg font-bold text-white flex-shrink-0" style={{ backgroundColor: '#EF4444' }}>Chase fighter →</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONTENT */}
        {activeTab === 'content' && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-xl font-black text-white">Content Gallery</h2>
            {CONTENT.map((c,i) => (
              <div key={i} className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${sponsorColor}15`, border: `1px solid ${sponsorColor}30` }}>{c.type==='Photo'?'📸':c.type==='Story'?'📱':'🎬'}</div>
                    <div><div className="text-sm font-bold text-white">{c.title}</div><div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{c.platform} · {c.date} · {c.type}</div></div>
                  </div>
                  <div className="text-right"><div className="text-sm font-bold" style={{ color: sponsorColor }}>{c.reach} reach</div><div className="text-xs" style={{ color: '#6B7280' }}>{c.likes} likes</div></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EVENTS */}
        {activeTab === 'events' && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-xl font-black text-white">Fight Calendar &amp; Exposure</h2>
            {EVENTS.map((e,i) => (
              <div key={i} className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">{i===0 && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: '#EF4444' }}>NEXT FIGHT</span>}<span className="text-xs" style={{ color: '#6B7280' }}>{e.date}</span></div>
                    <h3 className="font-bold text-sm text-white mb-1">{e.event}</h3>
                    <div className="text-xs" style={{ color: '#6B7280' }}>📍 {e.venue}</div>
                    <div className="text-xs mt-1" style={{ color: '#6B7280' }}>📺 {e.broadcast}</div>
                  </div>
                  <div className="text-right flex-shrink-0"><div className="text-sm font-bold" style={{ color: sponsorColor }}>{e.exposure}</div></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ROI */}
        {activeTab === 'roi' && (
          <div className="space-y-5 max-w-3xl">
            <h2 className="text-xl font-black text-white">ROI &amp; Reach</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[{ label:'Total reach YTD', value:'18.4M', color:sponsorColor }, { label:'PPV impressions', value:'4.8M', color:'#dc2626' }, { label:'Social engagements', value:'342k', color:'#22C55E' }, { label:'Press mentions', value:'87', color:'#8B5CF6' }].map((s,i) => (
                <div key={i} className="rounded-xl p-4 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div><div className="text-xs mt-1" style={{ color: '#6B7280' }}>{s.label}</div></div>
              ))}
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-sm font-bold text-white mb-4">Estimated brand value breakdown</p>
              {[{ label:'PPV / broadcast exposure', value:'£120,000', pct:67, color:sponsorColor }, { label:'Walkout robe & kit', value:'£28,000', pct:16, color:'#dc2626' }, { label:'Social media reach', value:'£18,000', pct:10, color:'#0ea5e9' }, { label:'Press conference branding', value:'£14,000', pct:7, color:'#8B5CF6' }].map((r,i) => (
                <div key={i} className="mb-4"><div className="flex justify-between mb-1.5"><span className="text-xs" style={{ color: '#9CA3AF' }}>{r.label}</span><span className="text-xs font-bold" style={{ color: r.color }}>{r.value}</span></div><div className="w-full bg-gray-800 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width: `${r.pct}%`, backgroundColor: r.color }} /></div></div>
              ))}
              <div className="flex justify-between pt-3 mt-2" style={{ borderTop: '1px solid #1F2937' }}><span className="text-sm font-bold text-white">Total estimated value</span><span className="text-sm font-black" style={{ color: sponsorColor }}>£180,000</span></div>
            </div>
            <div className="rounded-xl p-5 text-center" style={{ background: `linear-gradient(135deg, ${sponsorColor}20, rgba(0,0,0,0.4))`, border: `1px solid ${sponsorColor}40` }}>
              <div className="text-2xl mb-2">🤝</div>
              <div className="text-base font-bold text-white mb-1">Renewal in 90 days</div>
              <div className="text-xs mb-4" style={{ color: '#6B7280' }}>Current deal expires July 2026. ROI tracking positively.</div>
              <button className="px-8 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: sponsorColor }}>Start renewal discussion →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── SETTINGS VIEW ───────────────────────────────────────────────────────────
// ─── MODAL: SOCIAL MEDIA AI ─────────────────────────────────────────────────
function BoxingSocialMediaAI({ onClose, fighter }: { onClose: () => void; fighter: BoxingFighter }) {
  const [topic, setTopic] = useState('')
  const [platforms, setPlatforms] = useState<Record<string, boolean>>({ Twitter: true, Instagram: true, LinkedIn: false, Facebook: false, TikTok: false })
  const [tone, setTone] = useState('Motivational')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const selectedPlatforms = Object.entries(platforms).filter(([,v]) => v).map(([k]) => k).join(', ')
      const res = await fetch('/api/ai/boxing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, messages: [{ role: 'user', content: `You are a social media manager for ${fighter.name}, professional boxer (${fighter.weight_class}, WBC #${fighter.rankings.wbc}), nicknamed "${fighter.nickname}". Next fight: vs ${fighter.next_fight.opponent} in ${fighter.next_fight.days_away} days at ${fighter.next_fight.venue}. Generate social media posts for: ${selectedPlatforms}. Topic: ${topic || 'fight camp update'}. Tone: ${tone}. Write one post per platform, labelled. Include relevant hashtags. Keep each post under 280 chars for Twitter, slightly longer for others. Plain text only. No markdown. No bullet points.` }] })
      })
      const data = await res.json()
      const raw = data.content?.map((b:{type:string;text?:string}) => b.type === 'text' ? b.text : '').join('') || 'Unable to generate.'
      setResult(cleanResponse(raw))
    } catch { setResult('Unable to generate posts.') }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <div className="flex items-center gap-3"><span className="text-xl">📲</span><div><div className="text-sm font-bold text-white">Social Media AI</div><div className="text-xs text-gray-500">Generate platform-specific posts</div></div></div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg">✕</button>
      </div>
      <div className="p-6 space-y-4">
        <div><label className="text-xs text-gray-400 block mb-1">Topic / Context</label><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Fight camp update, sponsor shoutout, weigh-in" className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600" /></div>
        <div><label className="text-xs text-gray-400 block mb-1">Platforms</label><div className="flex flex-wrap gap-2">{Object.keys(platforms).map(p => (<button key={p} onClick={() => setPlatforms(prev => ({...prev, [p]: !prev[p]}))} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${platforms[p] ? 'bg-red-600/20 text-red-400 border border-red-600/40' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>{p}</button>))}</div></div>
        <div><label className="text-xs text-gray-400 block mb-1">Tone</label><select value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"><option>Motivational</option><option>Professional</option><option>Casual</option><option>Hype</option><option>Grateful</option></select></div>
        <button onClick={generate} disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>{loading ? 'Generating...' : 'Generate Posts'}</button>
        {result && (<div className="bg-[#0a0c14] border border-gray-800 rounded-xl p-4"><p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{result}</p><button onClick={() => navigator.clipboard.writeText(result)} className="mt-3 text-xs text-red-400 hover:underline">Copy to clipboard</button></div>)}
      </div>
    </div>
  )
}

// ─── MODAL: HOTEL FINDER ────────────────────────────────────────────────────
function BoxingHotelFinder({ onClose, fighter }: { onClose: () => void; fighter: BoxingFighter }) {
  const [step, setStep] = useState<1|2|3|4>(1)
  const [destination, setDestination] = useState('London')
  const [checkin, setCheckin] = useState('')
  const [checkout, setCheckout] = useState('')
  const [budget, setBudget] = useState('mid')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{name:string;price:string;rating:string;distance:string}[]>([])
  const [selectedHotel, setSelectedHotel] = useState<string|null>(null)
  const preferences = ['Near venue', 'Gym', 'Late checkout', 'Quiet room', 'Restaurant', 'Room service']
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(['Near venue', 'Gym'])
  const tournamentChips = [
    { label: `${fighter.next_fight.venue.split(',')[0]}`, dest: fighter.next_fight.venue },
    { label: 'MGM Grand, Las Vegas', dest: 'Las Vegas' },
    { label: 'O2 Arena, London', dest: 'London' },
    { label: 'Madison Square Garden', dest: 'New York' },
  ]

  const search = async () => {
    setLoading(true); setStep(2)
    try {
      const res = await fetch('/api/ai/boxing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, messages: [{ role: 'user', content: `Suggest 4 hotels in ${destination} for a professional boxer on fight week. Budget: ${budget}. Preferences: ${selectedPrefs.join(', ')}. Return JSON array: name, price (per night GBP), rating (stars), distance (to venue). No explanation. Plain text only. No markdown.` }] })
      })
      const data = await res.json()
      const text = data.content?.map((b:{type:string;text?:string}) => b.type === 'text' ? b.text : '').join('') || ''
      try { setResults(JSON.parse(text)) } catch { setResults([{ name:'Canary Wharf Marriott', price:'£189/night', rating:'4*', distance:'2.1km' },{ name:'InterContinental O2', price:'£245/night', rating:'5*', distance:'0.3km' },{ name:'Premier Inn Greenwich', price:'£89/night', rating:'3*', distance:'1.8km' },{ name:'Hilton London Canary Wharf', price:'£210/night', rating:'4*', distance:'2.4km' }]) }
    } catch { setResults([{ name:'Canary Wharf Marriott', price:'£189/night', rating:'4*', distance:'2.1km' },{ name:'InterContinental O2', price:'£245/night', rating:'5*', distance:'0.3km' },{ name:'Premier Inn Greenwich', price:'£89/night', rating:'3*', distance:'1.8km' },{ name:'Hilton London Canary Wharf', price:'£210/night', rating:'4*', distance:'2.4km' }]) }
    setLoading(false); setStep(3)
  }

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <div className="flex items-center gap-3"><span className="text-xl">🏨</span><div><div className="text-sm font-bold text-white">Smart Hotel Finder</div><div className="text-xs text-gray-500">4-step wizard for fight week accommodation</div></div></div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg">✕</button>
      </div>
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-4">
          {(['Configure','Search','Results','Book'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step > i+1 ? 'bg-green-600 text-white' : step === i+1 ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-500'}`}>{step > i+1 ? '✓' : i+1}</div>
              <span className={`text-[10px] ${step === i+1 ? 'text-white font-semibold' : 'text-gray-600'}`}>{s}</span>
              {i < 3 && <div className="w-6 h-px bg-gray-700 mx-1" />}
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 pt-0 space-y-4">
        {step === 1 && (<>
          <div><label className="text-xs text-gray-400 block mb-1">Fight Venue Quick Select</label><div className="flex flex-wrap gap-2">{tournamentChips.map(t => (<button key={t.label} onClick={() => setDestination(t.dest)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${destination === t.dest ? 'bg-red-600/20 text-red-400 border border-red-600/40' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>{t.label}</button>))}</div></div>
          <div><label className="text-xs text-gray-400 block mb-1">Destination</label><input value={destination} onChange={e => setDestination(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 block mb-1">Check-in</label><input type="date" value={checkin} onChange={e => setCheckin(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white" /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Check-out</label><input type="date" value={checkout} onChange={e => setCheckout(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white" /></div>
          </div>
          <div><label className="text-xs text-gray-400 block mb-1">Budget</label><select value={budget} onChange={e => setBudget(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"><option value="budget">Budget (under £100)</option><option value="mid">Mid-range (£100-£200)</option><option value="premium">Premium (£200+)</option></select></div>
          <div><label className="text-xs text-gray-400 block mb-1">Preferences</label><div className="flex flex-wrap gap-2">{preferences.map(p => (<button key={p} onClick={() => setSelectedPrefs(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedPrefs.includes(p) ? 'bg-red-600/20 text-red-400 border border-red-600/40' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>{p}</button>))}</div></div>
          <button onClick={search} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Search Hotels →</button>
        </>)}
        {step === 2 && (<div className="flex flex-col items-center justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mb-4" /><p className="text-sm text-gray-400">Searching hotels in {destination}...</p></div>)}
        {step === 3 && (<>
          <div className="text-xs text-gray-500 mb-2">{results.length} hotels found in {destination}</div>
          <div className="space-y-3">{results.map((r, i) => (<div key={i} onClick={() => setSelectedHotel(r.name)} className={`flex items-center justify-between bg-[#0a0c14] border rounded-xl p-4 cursor-pointer transition-all ${selectedHotel === r.name ? 'border-red-500' : 'border-gray-800 hover:border-gray-700'}`}><div><div className="text-sm font-semibold text-white">{r.name}</div><div className="text-[10px] text-gray-500">{r.rating} · {r.distance} from venue</div></div><div className="text-right"><div className="text-lg font-bold text-red-400">{r.price}</div></div></div>))}</div>
          <div className="flex gap-3"><button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 border border-gray-700">← Back</button><button onClick={() => { if (selectedHotel) setStep(4) }} disabled={!selectedHotel} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40" style={{ backgroundColor: '#dc2626' }}>Select & Book →</button></div>
        </>)}
        {step === 4 && (<div className="text-center py-8"><div className="text-4xl mb-3">✅</div><div className="text-lg font-bold text-white mb-1">{selectedHotel}</div><div className="text-sm text-gray-400 mb-1">{destination}{checkin && checkout ? ` · ${checkin} → ${checkout}` : ''}</div><div className="text-xs text-gray-500 mb-6">Budget: {budget} · Prefs: {selectedPrefs.join(', ')}</div><button onClick={onClose} className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Done</button></div>)}
      </div>
    </div>
  )
}


// ─── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function BoxingPortalPage() {
  return (
    <SportsDemoGate
      sport="boxing"
      defaultClubName="Marcus Cole Boxing"
      accentColor="#dc2626"
      accentColorLight="#ef4444"
      sportEmoji="🥊"
      sportLabel="Lumio Boxing"
      roles={BOXING_ROLES}
    >
      {(session) => <BoxingPortalInner session={session} />}
    </SportsDemoGate>
  )
}

// ─── FIGHT CAMP VIEW ──────────────────────────────────────────────────────────
function FightCampView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const CAMP_ACCENT = '#F59E0B'

  // Camp activation
  const [campActive, setCampActive] = useState(false)
  const [showActivateModal, setShowActivateModal] = useState(false)
  const [campConfig, setCampConfig] = useState<{fightDate:string;opponent:string;location:string;targetWeight:number;activatedAt:string}|null>(null)

  // Activation form
  const [fightDate, setFightDate] = useState('')
  const [opponent, setOpponent] = useState('')
  const [fightLocation, setFightLocation] = useState('')
  const [targetWeight, setTargetWeight] = useState(72.6)

  // Active camp state
  const [dailyChecklist, setDailyChecklist] = useState<Record<string,boolean>>({})
  const [opponentStudy, setOpponentStudy] = useState<Record<string,boolean>>({})
  const [readinessScore, setReadinessScore] = useState(62)
  const [sparringRounds, setSparringRounds] = useState(24)
  const [currentWeight, setCurrentWeight] = useState(76.8)

  // AI
  const [aiSummary, setAiSummary] = useState<string|null>(null)
  const [aiHighlights, setAiHighlights] = useState<string|null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const hasGenerated = useRef(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lumio_boxing_fight_camp')
      if (stored) {
        const config = JSON.parse(stored)
        setCampConfig(config)
        setCampActive(true)
        setCurrentWeight(config.targetWeight + 4.2)
        const cl = localStorage.getItem('lumio_boxing_camp_checklist')
        if (cl) setDailyChecklist(JSON.parse(cl))
        const os = localStorage.getItem('lumio_boxing_opponent_study')
        if (os) setOpponentStudy(JSON.parse(os))
        const rs = localStorage.getItem('lumio_boxing_camp_readiness')
        if (rs) setReadinessScore(parseInt(rs))
        const sr = localStorage.getItem('lumio_boxing_sparring_rounds')
        if (sr) setSparringRounds(parseInt(sr))
      }
    } catch {}
  }, [])

  // Derived values
  const daysToFight = campConfig ? Math.max(0, Math.ceil((new Date(campConfig.fightDate).getTime() - Date.now()) / 86400000)) : 0
  const campLength = campConfig ? Math.max(1, Math.ceil((new Date(campConfig.fightDate).getTime() - new Date(campConfig.activatedAt).getTime()) / 86400000)) : 1
  const campProgress = campConfig ? Math.round(((campLength - daysToFight) / campLength) * 100) : 0
  const phase = campProgress < 33 ? 'Foundation' : campProgress < 66 ? 'Build' : 'Peak & Taper'
  const phaseColor = phase === 'Foundation' ? '#3B82F6' : phase === 'Build' ? '#F59E0B' : '#EF4444'
  const weightDiff = currentWeight - (campConfig?.targetWeight ?? 72.6)
  const weightStatus = weightDiff <= 2 ? 'On Track' : weightDiff <= 5 ? 'Attention Needed' : 'Critical'
  const weightStatusColor = weightDiff <= 2 ? '#22C55E' : weightDiff <= 5 ? '#F59E0B' : '#EF4444'
  const campWeeks = Math.ceil(campLength / 7)
  const sparringTarget = campWeeks * 12

  // AI generation on camp active
  useEffect(() => {
    if (!campActive || !campConfig || hasGenerated.current) return
    hasGenerated.current = true
    setAiLoading(true)
    fetch('/api/ai/boxing', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, messages: [{ role: 'user', content: `Generate a fight camp AI summary for a boxer. Camp details: vs ${campConfig.opponent}, ${daysToFight} days remaining, currently in ${phase} phase at ${campConfig.location}. Format as 6 numbered bullet points covering: overall readiness, strongest areas, areas needing work, weight cut status, sparring progress, one watch-out. Be specific and motivating. Max 200 words.` }] })
    }).then(r => r.json()).then(d => { const t = d.content?.[0]?.text; setAiSummary(t ? cleanResponse(t) : 'Unable to generate.') }).catch(() => setAiSummary('Unable to generate.')).finally(() => setAiLoading(false))
    fetch('/api/ai/boxing', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, messages: [{ role: 'user', content: `Generate 5 urgent fight camp action items for a boxer preparing to fight ${campConfig.opponent} in ${daysToFight} days during ${phase} phase. Each item should be one line, specific and actionable. Cover: weight trajectory, sparring gaps, conditioning flags, opponent patterns to drill, recovery priority. Start each with an emoji. Plain text only. No markdown. No bullet points.` }] })
    }).then(r => r.json()).then(d => { const t = d.content?.[0]?.text; setAiHighlights(t ? cleanResponse(t) : 'Unable to generate.') }).catch(() => setAiHighlights('Unable to generate.'))
  }, [campActive])

  // Daily checklist items
  const DAILY_ITEMS = [
    { id: 'morning_run', label: 'Morning roadwork / cardio' },
    { id: 'technique', label: 'Technical session (pads / bags)' },
    { id: 'sparring', label: 'Sparring round completed' },
    { id: 'strength', label: 'Strength & conditioning' },
    { id: 'film_study', label: 'Opponent film study (15 min)' },
    { id: 'nutrition', label: 'Nutrition plan followed' },
    { id: 'recovery', label: 'Recovery session (ice / stretch)' },
    { id: 'sleep', label: '8+ hours sleep logged' },
  ]

  const OPPONENT_ITEMS = [
    { id: 'stance_movement', label: 'Stance & movement patterns' },
    { id: 'jab_tendencies', label: 'Jab tendencies & timing' },
    { id: 'power_combos', label: 'Power combination sequences' },
    { id: 'defensive_habits', label: 'Defensive habits & openings' },
    { id: 'body_work', label: 'Body work tendencies' },
    { id: 'late_round', label: 'Late-round behaviour & gas tank' },
  ]

  const checkedCount = Object.values(dailyChecklist).filter(Boolean).length

  const toggleDaily = (id: string) => {
    const next = { ...dailyChecklist, [id]: !dailyChecklist[id] }
    setDailyChecklist(next)
    localStorage.setItem('lumio_boxing_camp_checklist', JSON.stringify(next))
    // Bump readiness
    const completed = Object.values(next).filter(Boolean).length
    const newReadiness = Math.min(99, 50 + Math.round((completed / DAILY_ITEMS.length) * 40))
    setReadinessScore(newReadiness)
    localStorage.setItem('lumio_boxing_camp_readiness', String(newReadiness))
  }

  const toggleOpponentStudy = (id: string) => {
    const next = { ...opponentStudy, [id]: !opponentStudy[id] }
    setOpponentStudy(next)
    localStorage.setItem('lumio_boxing_opponent_study', JSON.stringify(next))
  }

  const adjustSparring = (delta: number) => {
    const next = Math.max(0, sparringRounds + delta)
    setSparringRounds(next)
    localStorage.setItem('lumio_boxing_sparring_rounds', String(next))
  }

  const deactivateCamp = () => {
    localStorage.removeItem('lumio_boxing_fight_camp')
    localStorage.removeItem('lumio_boxing_camp_checklist')
    localStorage.removeItem('lumio_boxing_opponent_study')
    localStorage.removeItem('lumio_boxing_camp_readiness')
    localStorage.removeItem('lumio_boxing_sparring_rounds')
    setCampActive(false)
    setCampConfig(null)
    setDailyChecklist({})
    setOpponentStudy({})
    setReadinessScore(62)
    setSparringRounds(24)
    hasGenerated.current = false
    setAiSummary(null)
    setAiHighlights(null)
  }

  // INACTIVE STATE
  if (!campActive) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="text-6xl mb-4">🥊</div>
      <h1 className="text-3xl font-black text-white mb-2">Fight Camp Mode</h1>
      <p className="text-lg font-semibold mb-2" style={{ color: '#F59E0B' }}>Lock in. Block out. Win.</p>
      <p className="text-sm max-w-md mb-8" style={{ color: '#6B7280' }}>
        Activate fight camp and Lumio will track every session, your weight cut, sparring rounds, opponent study and readiness score — all the way to fight night.
      </p>
      <button onClick={() => setShowActivateModal(true)}
        className="px-8 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#F59E0B' }}>
        Activate Fight Camp →
      </button>
      {showActivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowActivateModal(false) }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
            <h2 className="text-lg font-bold text-white mb-4">Activate Fight Camp</h2>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-500 mb-1 block">Fight date</label><input type="date" value={fightDate} onChange={e => setFightDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Opponent</label><input value={opponent} onChange={e => setOpponent(e.target.value)} placeholder="e.g. Demetrius Johnson" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Fight location</label><input value={fightLocation} onChange={e => setFightLocation(e.target.value)} placeholder="e.g. MGM Grand, Las Vegas" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Target weight (kg)</label><input type="number" step="0.1" value={targetWeight} onChange={e => setTargetWeight(parseFloat(e.target.value) || 72.6)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
              {fightDate && <div className="text-xs p-3 rounded-xl" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>Camp length: {Math.max(1,Math.ceil((new Date(fightDate).getTime()-Date.now())/86400000))} days</div>}
              <button onClick={() => {
                if (!fightDate || !opponent) return
                const config = { fightDate, opponent, location: fightLocation, targetWeight, activatedAt: new Date().toISOString() }
                localStorage.setItem('lumio_boxing_fight_camp', JSON.stringify(config))
                setCampConfig(config); setCampActive(true); setCurrentWeight(targetWeight + 4.2)
                setShowActivateModal(false)
              }} disabled={!fightDate || !opponent}
                className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: fightDate && opponent ? '#F59E0B' : '#374151' }}>
                Activate Fight Camp →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ACTIVE STATE — Camp Dashboard
  const READINESS_CATEGORIES = [
    { label: 'Fitness', value: Math.min(99, readinessScore + 5), color: '#22C55E' },
    { label: 'Technique', value: Math.min(99, readinessScore + 2), color: '#3B82F6' },
    { label: 'Sparring', value: Math.min(99, Math.round((sparringRounds / Math.max(1, sparringTarget)) * 100)), color: '#F59E0B' },
    { label: 'Weight', value: weightDiff <= 2 ? 90 : weightDiff <= 5 ? 65 : 35, color: weightStatusColor },
    { label: 'Recovery', value: Math.min(99, readinessScore - 3), color: '#8B5CF6' },
    { label: 'Mental', value: Math.min(99, readinessScore + 8), color: '#EC4899' },
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            🥊 Fight Camp Mode
            <span className="text-sm px-3 py-1 rounded-full font-bold text-white" style={{ backgroundColor: phaseColor }}>{phase}</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            vs {campConfig?.opponent} · {daysToFight} days to fight night · {campConfig?.location}
          </p>
        </div>
        <button onClick={deactivateCamp}
          className="text-xs px-4 py-2 rounded-lg font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#6B7280', border: '1px solid #374151' }}>
          Deactivate Camp
        </button>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between text-xs mb-2">
          <span style={{ color: '#6B7280' }}>Camp Progress</span>
          <span className="font-bold" style={{ color: CAMP_ACCENT }}>{campProgress}%</span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#1F2937' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, campProgress)}%`, backgroundColor: CAMP_ACCENT }} />
        </div>
        <div className="flex justify-between text-[10px] mt-1" style={{ color: '#4B5563' }}>
          <span>Day {campLength - daysToFight}</span>
          <span>{campLength} days total</span>
        </div>
      </div>

      {/* AI Section — Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">🤖</span>
            <span className="text-xs font-bold text-white">AI Camp Summary</span>
            {aiLoading && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: CAMP_ACCENT }}>Generating...</span>}
          </div>
          <div className="text-xs leading-relaxed whitespace-pre-line" style={{ color: '#9CA3AF' }}>
            {aiSummary || 'Generating camp analysis...'}
          </div>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">⚡</span>
            <span className="text-xs font-bold text-white">Action Items</span>
          </div>
          <div className="text-xs leading-relaxed whitespace-pre-line" style={{ color: '#9CA3AF' }}>
            {aiHighlights || 'Generating action items...'}
          </div>
        </div>
      </div>

      {/* Camp Readiness Score */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-white">Camp Readiness Score</span>
          <div className="text-3xl font-black" style={{ color: readinessScore >= 75 ? '#22C55E' : readinessScore >= 50 ? CAMP_ACCENT : '#EF4444' }}>{readinessScore}<span className="text-sm text-gray-500">/100</span></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {READINESS_CATEGORIES.map(cat => (
            <div key={cat.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}>
              <div className="text-lg font-black" style={{ color: cat.color }}>{cat.value}</div>
              <div className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{cat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Checklist */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-white">Daily Checklist</span>
          <span className="text-xs font-bold" style={{ color: checkedCount === DAILY_ITEMS.length ? '#22C55E' : CAMP_ACCENT }}>{checkedCount}/{DAILY_ITEMS.length} complete</span>
        </div>
        <div className="space-y-2">
          {DAILY_ITEMS.map(item => (
            <button key={item.id} onClick={() => toggleDaily(item.id)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all"
              style={{ backgroundColor: dailyChecklist[item.id] ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${dailyChecklist[item.id] ? 'rgba(34,197,94,0.2)' : '#1F2937'}` }}>
              <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-xs"
                style={{ backgroundColor: dailyChecklist[item.id] ? '#22C55E' : 'transparent', border: dailyChecklist[item.id] ? 'none' : '1px solid #374151', color: '#fff' }}>
                {dailyChecklist[item.id] ? '✓' : ''}
              </div>
              <span className="text-xs" style={{ color: dailyChecklist[item.id] ? '#22C55E' : '#9CA3AF', textDecoration: dailyChecklist[item.id] ? 'line-through' : 'none' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Weight Tracker */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-white">Weight Cut Tracker</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${weightStatusColor}15`, color: weightStatusColor }}>{weightStatus}</span>
        </div>
        <div className="flex items-end gap-4 mb-3">
          <div>
            <div className="text-[10px]" style={{ color: '#6B7280' }}>Current</div>
            <div className="text-xl font-black text-white">{currentWeight.toFixed(1)} kg</div>
          </div>
          <div className="text-lg" style={{ color: '#4B5563' }}>→</div>
          <div>
            <div className="text-[10px]" style={{ color: '#6B7280' }}>Target</div>
            <div className="text-xl font-black" style={{ color: '#22C55E' }}>{campConfig?.targetWeight?.toFixed(1) ?? '72.6'} kg</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[10px]" style={{ color: '#6B7280' }}>To cut</div>
            <div className="text-xl font-black" style={{ color: weightStatusColor }}>{weightDiff.toFixed(1)} kg</div>
          </div>
        </div>
        <div className="w-full h-3 rounded-full" style={{ backgroundColor: '#1F2937' }}>
          <div className="h-full rounded-full transition-all" style={{
            width: `${Math.min(100, Math.max(0, ((1 - weightDiff / 10) * 100)))}%`,
            backgroundColor: weightStatusColor
          }} />
        </div>
      </div>

      {/* Sparring Log */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-white">Sparring Log</span>
          <span className="text-xs" style={{ color: '#6B7280' }}>Target: {sparringTarget} rounds</span>
        </div>
        <div className="flex items-center gap-4 mb-3">
          <button onClick={() => adjustSparring(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#1F2937' }}>−</button>
          <div className="text-3xl font-black" style={{ color: CAMP_ACCENT }}>{sparringRounds}</div>
          <button onClick={() => adjustSparring(1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: CAMP_ACCENT }}>+</button>
          <span className="text-xs" style={{ color: '#6B7280' }}>rounds completed</span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#1F2937' }}>
          <div className="h-full rounded-full transition-all" style={{
            width: `${Math.min(100, Math.round((sparringRounds / Math.max(1, sparringTarget)) * 100))}%`,
            backgroundColor: CAMP_ACCENT
          }} />
        </div>
        <div className="flex justify-between text-[10px] mt-1" style={{ color: '#4B5563' }}>
          <span>{sparringRounds} done</span>
          <span>{Math.max(0, sparringTarget - sparringRounds)} remaining</span>
        </div>
      </div>

      {/* Opponent Study Checklist */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-white">Opponent Study — {campConfig?.opponent}</span>
          <span className="text-xs font-bold" style={{ color: CAMP_ACCENT }}>
            {Object.values(opponentStudy).filter(Boolean).length}/{OPPONENT_ITEMS.length} reviewed
          </span>
        </div>
        <div className="space-y-2">
          {OPPONENT_ITEMS.map(item => (
            <button key={item.id} onClick={() => toggleOpponentStudy(item.id)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all"
              style={{ backgroundColor: opponentStudy[item.id] ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${opponentStudy[item.id] ? 'rgba(245,158,11,0.2)' : '#1F2937'}` }}>
              <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-xs"
                style={{ backgroundColor: opponentStudy[item.id] ? CAMP_ACCENT : 'transparent', border: opponentStudy[item.id] ? 'none' : '1px solid #374151', color: '#fff' }}>
                {opponentStudy[item.id] ? '✓' : ''}
              </div>
              <span className="text-xs" style={{ color: opponentStudy[item.id] ? CAMP_ACCENT : '#9CA3AF', textDecoration: opponentStudy[item.id] ? 'line-through' : 'none' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── NEW QUICK ACTION MODALS (6) ──────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── WEIGHT CUT AI ───────────────────────────────────────────────────────────
function BoxingWeightCutAI({ onClose, fighter }: { onClose: () => void; fighter: BoxingFighter }) {
  const [currentWeight, setCurrentWeight] = useState<string>(() => {
    try { return (typeof window !== 'undefined' ? localStorage.getItem('lumio_boxing_current_weight') : null) || String(fighter.current_weight) } catch { return String(fighter.current_weight) }
  })
  const [fightWeight, setFightWeight] = useState<string>(String(fighter.target_weight))
  const [days, setDays] = useState<string>(String(fighter.next_fight.days_away))
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<string | null>(null)

  const curr = parseFloat(currentWeight) || 0
  const target = parseFloat(fightWeight) || 0
  const daysN = parseInt(days) || 0
  const totalCut = Math.max(0, curr - target)
  const dailyCut = daysN > 0 ? totalCut / daysN : 0
  const pctOfBody = curr > 0 ? (totalCut / curr) * 100 : 0
  const progressPct = curr > 0 && target > 0 ? Math.min(100, Math.max(0, ((curr - target) / Math.max(1, curr - target + 5)) * 100)) : 0
  const barColour = daysN > 10 ? '#22C55E' : daysN >= 4 ? '#F59E0B' : '#EF4444'
  const dangerous = pctOfBody > 5 && daysN < 7

  const generate = async () => {
    setLoading(true)
    try { localStorage.setItem('lumio_boxing_current_weight', currentWeight) } catch {}
    try {
      const res = await fetch('/api/ai/boxing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 900,
          messages: [{ role: 'user', content: `Professional boxer. Current weight: ${curr}kg. Fight limit: ${target}kg. Days to weigh-in: ${daysN}. Total cut required: ${totalCut.toFixed(1)}kg. Daily deficit needed: ${dailyCut.toFixed(2)}kg/day (${pctOfBody.toFixed(1)}% of body mass over ${daysN} days).

Create a safe weight cut protocol covering: daily weight targets from today to weigh-in, water and sodium manipulation timeline, when to start sweat sessions (sauna / bath), final 24-hour water cut, and rehydration plan for the 24 hours after weigh-in before the fight. ${dangerous ? 'FLAG CLEARLY that this cut is medically dangerous — over 5% body weight in under 7 days carries real risk of kidney damage, seizures and impaired fight-night performance. Strongly recommend consultation with a sports medicine doctor.' : ''}

Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.` }]
        })
      })
      const data = await res.json()
      if (data.error) { setPlan(`⚠️ AI service error. Check ANTHROPIC_API_KEY in Settings.`); setLoading(false); return }
      const raw = data.content?.filter((b: {type:string}) => b.type === 'text').map((b: {text:string}) => b.text).join('\n') || ''
      setPlan(cleanResponse(raw) || '⚠️ No response from AI.')
    } catch (err) { console.error('[BoxingWeightCutAI] fetch error:', err); setPlan('⚠️ Unable to reach AI service.') }
    setLoading(false)
  }

  return (
    <>
      <ModalHeader icon="⚖️" title="Weight Cut AI" subtitle="Daily tracker with AI-generated cut plan" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Current (kg)</label><input type="number" step="0.1" value={currentWeight} onChange={e => setCurrentWeight(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Fight limit (kg)</label><input type="number" step="0.1" value={fightWeight} onChange={e => setFightWeight(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Days to weigh-in</label><input type="number" value={days} onChange={e => setDays(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Cut progress</span>
            <span className="text-xs font-bold" style={{ color: barColour }}>{totalCut.toFixed(1)}kg to cut · {dailyCut.toFixed(2)}kg/day</span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#1F2937' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: barColour }} />
          </div>
          <div className="flex justify-between text-[10px] mt-1" style={{ color: '#4B5563' }}>
            <span>{curr}kg today</span>
            <span>{target}kg fight limit</span>
          </div>
          {dangerous && <div className="mt-3 text-[11px] p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171' }}>⚠️ Over 5% body weight in under 7 days is medically dangerous. Consult your team doctor before proceeding.</div>}
        </div>
        {!plan ? (
          <button onClick={generate} disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>{loading ? '⏳ Generating cut plan...' : '🧠 Generate AI cut plan →'}</button>
        ) : (
          <>
            <div className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB', maxHeight: 400, overflowY: 'auto' }}>{plan}</div>
            <div className="flex gap-3">
              <button onClick={() => setPlan(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Regenerate</button>
              <button onClick={() => navigator.clipboard.writeText(plan)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>📋 Copy plan</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ─── OPPONENT SCOUT AI (web search) ──────────────────────────────────────────
function BoxingOpponentScout({ onClose, fighter }: { onClose: () => void; fighter: BoxingFighter }) {
  const [opponent, setOpponent] = useState(fighter.next_fight.opponent || '')
  const [weightClass, setWeightClass] = useState(fighter.weight_class || 'Heavyweight')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<string | null>(null)

  const generate = async () => {
    if (!opponent.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/ai/boxing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1200,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: `Search for professional boxer ${opponent} in the ${weightClass} division. Provide a scouting report covering professional record (wins-losses-KO), fighting style (orthodox or southpaw), dominant hand, KO ratio, average rounds per fight, recent form over the last three fights, known weaknesses based on their fight history, and three specific tactical recommendations for beating them. Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.` }]
        })
      })
      const data = await res.json()
      if (data.error) { setReport(`⚠️ AI service error. Check ANTHROPIC_API_KEY in Settings.`); setLoading(false); return }
      const raw = data.content?.filter((b: {type:string}) => b.type === 'text').map((b: {text:string}) => b.text).join('\n') || ''
      setReport(cleanResponse(raw) || '⚠️ No response from AI.')
    } catch (err) { console.error('[BoxingOpponentScout] fetch error:', err); setReport('⚠️ Unable to reach AI service.') }
    setLoading(false)
  }

  const WEIGHT_CLASSES = ['Heavyweight','Cruiserweight','Light Heavyweight','Super Middleweight','Middleweight','Super Welterweight','Welterweight','Super Lightweight','Lightweight','Super Featherweight','Featherweight','Super Bantamweight','Bantamweight','Super Flyweight','Flyweight','Light Flyweight','Minimumweight']

  return (
    <>
      <ModalHeader icon="🥊" title="Opponent Scout" subtitle="AI scouting report with live web search" onClose={onClose} />
      <div className="p-6 space-y-4">
        {!report ? (
          <>
            <div><label className="text-xs text-gray-500 mb-1 block">Opponent name</label><input value={opponent} onChange={e => setOpponent(e.target.value)} placeholder="e.g. Viktor Petrov" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Weight class</label><select value={weightClass} onChange={e => setWeightClass(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}>{WEIGHT_CLASSES.map(w => <option key={w}>{w}</option>)}</select></div>
            <button onClick={generate} disabled={loading || !opponent.trim()} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>{loading ? '⏳ Searching & generating...' : '🔍 Scout opponent →'}</button>
          </>
        ) : (
          <>
            <div className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB', maxHeight: 420, overflowY: 'auto' }}>{report}</div>
            <div className="flex gap-3">
              <button onClick={() => setReport(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← New search</button>
              <button onClick={() => navigator.clipboard.writeText(report)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>📋 Copy report</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ─── VADA/UKAD CHECK ─────────────────────────────────────────────────────────
function BoxingVADACheck({ onClose }: { onClose: () => void }) {
  const [supplement, setSupplement] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const generate = async () => {
    if (!supplement.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/ai/boxing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 900,
          messages: [{ role: 'user', content: `Anti-doping compliance check for a professional boxer registered with VADA, UKAD and WADA. Check the following supplement or ingredient list: ${supplement}.

State clearly whether it is on the WADA 2024 or 2025 prohibited list, either in-competition or out-of-competition. Note any known contamination risk from this supplement category (for example pre-workouts historically contaminated with higenamine or 1,3-DMAA). Give a clear recommendation: safe, use with caution, or avoid entirely.

Always add a disclaimer that the boxer should verify with their anti-doping organisation directly before taking any new supplement, and that this tool is a guidance layer, not a medical or legal authority.

Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.` }]
        })
      })
      const data = await res.json()
      if (data.error) { setResult(`⚠️ AI service error. Check ANTHROPIC_API_KEY in Settings.`); setLoading(false); return }
      const raw = data.content?.filter((b: {type:string}) => b.type === 'text').map((b: {text:string}) => b.text).join('\n') || ''
      setResult(cleanResponse(raw) || '⚠️ No response from AI.')
    } catch (err) { console.error('[BoxingVADACheck] fetch error:', err); setResult('⚠️ Unable to reach AI service.') }
    setLoading(false)
  }

  return (
    <>
      <ModalHeader icon="💊" title="VADA / UKAD Check" subtitle="Screen supplements against the WADA prohibited list" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div className="rounded-xl p-3 text-[11px]" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }}>
          ⚠️ Always verify with VADA, UKAD or your national anti-doping organisation directly before taking any supplement. This tool is guidance only — not a medical or legal authority.
        </div>
        {!result ? (
          <>
            <div><label className="text-xs text-gray-500 mb-1 block">Supplement name or full ingredient list</label><textarea value={supplement} onChange={e => setSupplement(e.target.value)} rows={4} placeholder="e.g. 'Cellucor C4 Original' or paste the full ingredients panel" className="w-full px-3 py-2.5 rounded-xl text-sm text-white resize-none" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
            <button onClick={generate} disabled={loading || !supplement.trim()} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>{loading ? '⏳ Checking WADA list...' : '💊 Run compliance check →'}</button>
          </>
        ) : (
          <>
            <div className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB', maxHeight: 360, overflowY: 'auto' }}>{result}</div>
            <div className="flex gap-3">
              <button onClick={() => setResult(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← New check</button>
              <button onClick={() => navigator.clipboard.writeText(result)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>📋 Copy result</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ─── PURSE BREAKDOWN (pure maths) ────────────────────────────────────────────
function BoxingPurseBreakdown({ onClose }: { onClose: () => void }) {
  const [grossPurse, setGrossPurse] = useState('500000')
  const [managerPct, setManagerPct] = useState('20')
  const [trainerPct, setTrainerPct] = useState('10')
  const [promoterPct, setPromoterPct] = useState('0')
  const [taxBand, setTaxBand] = useState<'basic'|'higher'|'additional'>('higher')

  const TAX = { basic: 20, higher: 40, additional: 45 }
  const purse = parseFloat(grossPurse) || 0
  const mgr = purse * ((parseFloat(managerPct) || 0) / 100)
  const trn = purse * ((parseFloat(trainerPct) || 0) / 100)
  const pro = purse * ((parseFloat(promoterPct) || 0) / 100)
  const afterCuts = purse - mgr - trn - pro
  const taxPct = TAX[taxBand]
  const tax = afterCuts * (taxPct / 100)
  const takeHome = afterCuts - tax

  const fmt = (n: number) => '£' + Math.round(n).toLocaleString()

  return (
    <>
      <ModalHeader icon="📋" title="Purse Breakdown" subtitle="Real take-home after cuts and tax" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Gross purse (£)</label>
          <input type="number" value={grossPurse} onChange={e => setGrossPurse(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Manager %</label><input type="number" value={managerPct} onChange={e => setManagerPct(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Trainer %</label><input type="number" value={trainerPct} onChange={e => setTrainerPct(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Promoter %</label><input type="number" value={promoterPct} onChange={e => setPromoterPct(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-2 block">UK tax band</label>
          <div className="flex gap-2">
            {(['basic','higher','additional'] as const).map(b => (
              <button key={b} onClick={() => setTaxBand(b)} className="flex-1 py-2 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: taxBand === b ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.05)', border: taxBand === b ? '1px solid #dc2626' : '1px solid #1F2937', color: taxBand === b ? '#dc2626' : '#9CA3AF' }}>
                {b === 'basic' ? 'Basic (20%)' : b === 'higher' ? 'Higher (40%)' : 'Additional (45%)'}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex justify-between text-xs"><span style={{ color: '#9CA3AF' }}>Gross purse</span><span className="font-bold text-white">{fmt(purse)}</span></div>
          <div className="flex justify-between text-xs"><span style={{ color: '#F59E0B' }}>− Manager ({managerPct}%)</span><span className="font-bold" style={{ color: '#F59E0B' }}>{fmt(mgr)}</span></div>
          <div className="flex justify-between text-xs"><span style={{ color: '#F59E0B' }}>− Trainer ({trainerPct}%)</span><span className="font-bold" style={{ color: '#F59E0B' }}>{fmt(trn)}</span></div>
          <div className="flex justify-between text-xs"><span style={{ color: '#F59E0B' }}>− Promoter ({promoterPct}%)</span><span className="font-bold" style={{ color: '#F59E0B' }}>{fmt(pro)}</span></div>
          <div className="flex justify-between text-xs pt-2" style={{ borderTop: '1px solid #1F2937' }}><span style={{ color: '#D1D5DB' }}>After cuts</span><span className="font-bold text-white">{fmt(afterCuts)}</span></div>
          <div className="flex justify-between text-xs"><span style={{ color: '#EF4444' }}>− UK tax ({taxPct}%)</span><span className="font-bold" style={{ color: '#EF4444' }}>{fmt(tax)}</span></div>
          <div className="flex justify-between text-sm pt-3" style={{ borderTop: '1px solid #374151' }}>
            <span className="font-bold text-white">Take-home</span>
            <span className="text-lg font-black" style={{ color: '#22C55E' }}>{fmt(takeHome)}</span>
          </div>
        </div>
        <div className="text-[11px]" style={{ color: '#6B7280' }}>💡 This excludes PPV bonuses, ticket commissions, appearance fees and travel/camp reimbursements. Speak to your accountant before making any decisions.</div>
      </div>
    </>
  )
}

// ─── RANKINGS TRACKER (web search) ───────────────────────────────────────────
function BoxingRankingsTracker({ onClose, session, fighter }: { onClose: () => void; session: SportsDemoSession; fighter: BoxingFighter }) {
  const nameFromStorage = typeof window !== 'undefined' ? localStorage.getItem('lumio_boxing_name') : null
  const [fighterName, setFighterName] = useState(nameFromStorage || session.userName || fighter.name)
  const [weightClass, setWeightClass] = useState(fighter.weight_class || 'Heavyweight')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<string | null>(null)

  const generate = async () => {
    if (!fighterName.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/ai/boxing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1200,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: `Search for the current WBO, WBC, IBF and WBA rankings for the ${weightClass} division in professional boxing as of today. Find the position of ${fighterName} if they are listed. Report their position in each of the four major sanctioning bodies, how many wins or positions away from mandatory challenger status they are in any of the belts, the current champions in that division, and the next logical fight that would improve their ranking position most efficiently. Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.` }]
        })
      })
      const data = await res.json()
      if (data.error) { setReport(`⚠️ AI service error. Check ANTHROPIC_API_KEY in Settings.`); setLoading(false); return }
      const raw = data.content?.filter((b: {type:string}) => b.type === 'text').map((b: {text:string}) => b.text).join('\n') || ''
      setReport(cleanResponse(raw) || '⚠️ No response from AI.')
    } catch (err) { console.error('[BoxingRankingsTracker] fetch error:', err); setReport('⚠️ Unable to reach AI service.') }
    setLoading(false)
  }

  const WEIGHT_CLASSES = ['Heavyweight','Cruiserweight','Light Heavyweight','Super Middleweight','Middleweight','Super Welterweight','Welterweight','Super Lightweight','Lightweight','Super Featherweight','Featherweight','Super Bantamweight','Bantamweight','Super Flyweight','Flyweight','Light Flyweight','Minimumweight']

  return (
    <>
      <ModalHeader icon="🏆" title="Rankings Tracker" subtitle="Live WBO / WBC / IBF / WBA positions" onClose={onClose} />
      <div className="p-6 space-y-4">
        {!report ? (
          <>
            <div><label className="text-xs text-gray-500 mb-1 block">Fighter name</label><input value={fighterName} onChange={e => setFighterName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Weight class</label><select value={weightClass} onChange={e => setWeightClass(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}>{WEIGHT_CLASSES.map(w => <option key={w}>{w}</option>)}</select></div>
            <button onClick={generate} disabled={loading || !fighterName.trim()} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>{loading ? '⏳ Searching rankings...' : '🏆 Check all 4 belts →'}</button>
          </>
        ) : (
          <>
            <div className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB', maxHeight: 420, overflowY: 'auto' }}>{report}</div>
            <div className="flex gap-3">
              <button onClick={() => setReport(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← New search</button>
              <button onClick={() => navigator.clipboard.writeText(report)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>📋 Copy report</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ─── CAMP CONTENT AI ─────────────────────────────────────────────────────────
function BoxingCampContent({ onClose, session, fighter }: { onClose: () => void; session: SportsDemoSession; fighter: BoxingFighter }) {
  const nameFromStorage = typeof window !== 'undefined' ? localStorage.getItem('lumio_boxing_name') : null
  const boxerName = nameFromStorage || session.userName || fighter.name
  const weeksOut = Math.max(1, Math.round(fighter.next_fight.days_away / 7))
  const [training, setTraining] = useState('sparring, pad work, conditioning')
  const [platform, setPlatform] = useState<'Instagram'|'TikTok'|'Twitter/X'|'All'>('Instagram')
  const [tone, setTone] = useState<'Fired up'|'Professional'|'Humble'>('Fired up')
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    try {
      const toneLine = tone === 'Fired up' ? 'Fired up and intense (🔥 energy)' : tone === 'Professional' ? 'Calm, professional and measured' : 'Humble and grateful, respectful of the opponent'
      const res = await fetch('/api/ai/boxing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 800,
          messages: [{ role: 'user', content: `Generate authentic social media content for a professional boxer named ${boxerName} who is ${weeksOut} weeks away from their next fight against ${fighter.next_fight.opponent}. Today's training: ${training}. Platform: ${platform}. Tone: ${toneLine}.

Generate a post caption with relevant hashtags at the end, a story or reel hook line where the first three words have to grab attention, and one engagement question to ask followers. Keep it authentic — boxers don't talk like corporations.

Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.` }]
        })
      })
      const data = await res.json()
      if (data.error) { setContent(`⚠️ AI service error. Check ANTHROPIC_API_KEY in Settings.`); setLoading(false); return }
      const raw = data.content?.filter((b: {type:string}) => b.type === 'text').map((b: {text:string}) => b.text).join('\n') || ''
      setContent(cleanResponse(raw) || '⚠️ No response from AI.')
    } catch (err) { console.error('[BoxingCampContent] fetch error:', err); setContent('⚠️ Unable to reach AI service.') }
    setLoading(false)
  }

  return (
    <>
      <ModalHeader icon="🎬" title="Camp Content AI" subtitle="Daily social content generator" onClose={onClose} />
      <div className="p-6 space-y-4">
        {!content ? (
          <>
            <div><label className="text-xs text-gray-500 mb-1 block">Today&apos;s training focus</label><input value={training} onChange={e => setTraining(e.target.value)} placeholder="e.g. sparring, pad work, conditioning" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Platform</label>
              <div className="flex flex-wrap gap-2">
                {(['Instagram','TikTok','Twitter/X','All'] as const).map(p => (
                  <button key={p} onClick={() => setPlatform(p)} className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: platform === p ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.05)', border: platform === p ? '1px solid #dc2626' : '1px solid #1F2937', color: platform === p ? '#dc2626' : '#9CA3AF' }}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Tone</label>
              <div className="flex flex-wrap gap-2">
                {([['Fired up','🔥'],['Professional','💼'],['Humble','🙏']] as const).map(([t, e]) => (
                  <button key={t} onClick={() => setTone(t)} className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: tone === t ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.05)', border: tone === t ? '1px solid #dc2626' : '1px solid #1F2937', color: tone === t ? '#dc2626' : '#9CA3AF' }}>{e} {t}</button>
                ))}
              </div>
            </div>
            <button onClick={generate} disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>{loading ? '⏳ Writing content...' : '🎬 Generate content →'}</button>
          </>
        ) : (
          <>
            <div className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB', maxHeight: 400, overflowY: 'auto' }}>{content}</div>
            <div className="flex gap-3">
              <button onClick={() => setContent(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Regenerate</button>
              <button onClick={() => navigator.clipboard.writeText(content)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>📋 Copy content</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── GPS & RING HEATMAP VIEW ──────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function GpsRingHeatmapView() {
  const [activeRound, setActiveRound] = useState(1)
  const [activeTab, setActiveTab] = useState<'heatmap'|'load'|'roadwork'>('heatmap')

  const ROUND_DATA = [
    { round:1, centre:61, ropes:18, corners:4, moving:17, distance:124, note:'Strong start — controls centre well' },
    { round:2, centre:54, ropes:24, corners:6, moving:16, distance:138, note:'Petrov pressure beginning — gives ground' },
    { round:3, centre:48, ropes:31, corners:8, moving:13, distance:142, note:'Ropes % rising — fatigue or tactical?' },
    { round:4, centre:52, ropes:22, corners:5, moving:21, distance:131, note:'Recovery round — Jim adjusts between' },
    { round:5, centre:58, ropes:17, corners:3, moving:22, distance:126, note:'Best round — game plan working' },
    { round:6, centre:49, ropes:27, corners:9, moving:15, distance:147, note:'Tired — corner time spikes — flag physio' },
  ]
  const round = ROUND_DATA[activeRound - 1]

  const KPI_CARDS = [
    { label:'Roadwork Distance', value:'8.4km', sub:'Morning run', color:'#22c55e', icon:'🏃' },
    { label:'Max Speed', value:'6.8 m/s', sub:'24.5 km/h — vs PB 7.1', color:'#0ea5e9', icon:'⚡' },
    { label:'Sprint Efforts', value:'12', sub:'Target: 8–15/session', color:'#a855f7', icon:'💨' },
    { label:'Gym Session Load', value:'312 AU', sub:'Green: under 350', color:'#22c55e', icon:'🏋️' },
    { label:'Accel Events', value:'48', sub:'Footwork intensity', color:'#f59e0b', icon:'📈' },
    { label:'Weekly ACWR', value:'1.18', sub:'Red at > 1.5', color:'#22c55e', icon:'🛰️' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🛰️</span>
          <div>
            <h2 className="text-xl font-black text-white">GPS & Ring Heatmap</h2>
            <p className="text-xs font-semibold" style={{ color: '#ef4444' }}>WORLD FIRST — Punch analytics fused with GPS ring movement data</p>
          </div>
        </div>
        <p className="text-xs" style={{ color: '#94a3b8' }}>UWB beacons at ring corners track position at 10Hz. Combined with CompuBox punch data to reveal footwork-performance correlation.</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPI_CARDS.map(k => (
          <div key={k.label} className="rounded-xl p-3" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
            <div className="text-lg mb-1">{k.icon}</div>
            <div className="text-xl font-black" style={{ color: k.color }}>{k.value}</div>
            <div className="text-[11px] font-semibold text-white mt-0.5">{k.label}</div>
            <div className="text-[10px]" style={{ color: '#475569' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['heatmap','load','roadwork'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: activeTab === t ? '#ef4444' : '#1F2937', color: activeTab === t ? '#fff' : '#94a3b8' }}>
            {t === 'heatmap' ? '🥊 Ring Heatmap' : t === 'load' ? '📊 Session Load' : '🏃 Roadwork GPS'}
          </button>
        ))}
      </div>

      {activeTab === 'heatmap' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* SVG Ring Heatmap */}
          <div className="rounded-xl p-5" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Ring Position Map</h3>
              <div className="flex gap-1.5">
                {ROUND_DATA.map((_, i) => (
                  <button key={i} onClick={() => setActiveRound(i + 1)}
                    className="w-7 h-7 rounded-full text-[11px] font-bold"
                    style={{ background: activeRound === i + 1 ? '#ef4444' : '#1F2937', color: activeRound === i + 1 ? '#fff' : '#94a3b8', border: 'none', cursor: 'pointer' }}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
            <svg viewBox="0 0 300 300" className="w-full max-w-[280px] mx-auto block">
              <rect x="10" y="10" width="280" height="280" rx="8" fill="#1a1a2e" stroke="#374151" strokeWidth="2"/>
              {[[20,20],[280,20],[20,280],[280,280]].map(([cx,cy],i) => (
                <circle key={i} cx={cx} cy={cy} r="8" fill="#374151" stroke="#6B7280" strokeWidth="1"/>
              ))}
              <rect x="20" y="20" width="260" height="260" fill="none" stroke="#4B5563" strokeWidth="1.5" strokeDasharray="4,4"/>
              <ellipse cx="150" cy="150" rx="65" ry="65" fill={`rgba(250,204,21,${round.centre / 100 * 0.7 + 0.1})`}/>
              <rect x="10" y="10" width="280" height="35" rx="4" fill={`rgba(239,68,68,${round.ropes / 100 * 0.8})`}/>
              <rect x="10" y="255" width="280" height="35" rx="4" fill={`rgba(239,68,68,${round.ropes / 100 * 0.6})`}/>
              <rect x="10" y="10" width="35" height="280" rx="4" fill={`rgba(239,68,68,${round.ropes / 100 * 0.5})`}/>
              <rect x="255" y="10" width="35" height="280" rx="4" fill={`rgba(239,68,68,${round.ropes / 100 * 0.5})`}/>
              {[[10,10],[265,10],[10,265],[265,265]].map(([x,y],i) => (
                <rect key={i} x={x} y={y} width="30" height="30" fill={`rgba(245,158,11,${round.corners / 100 * 1.5})`}/>
              ))}
              <text x="150" y="154" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="13" fontWeight="bold">{round.centre}%</text>
              <text x="150" y="168" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="9">Centre</text>
            </svg>
            <div className="flex gap-3 justify-center mt-3">
              {[['#facc15','Centre'],['#ef4444','Ropes'],['#f59e0b','Corners'],['#3b82f6','Moving']].map(([c,l]) => (
                <div key={l} className="flex items-center gap-1">
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                  <span className="text-[10px]" style={{ color: '#94a3b8' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Round stats + AI insight */}
          <div className="space-y-3">
            <div className="rounded-xl p-4" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
              <h3 className="text-sm font-bold text-white mb-3">Round {activeRound} Breakdown</h3>
              {[
                { label:'Centre Control', value:round.centre, target:55, color:'#facc15' },
                { label:'Ropes Time', value:round.ropes, target:15, color:'#ef4444', invert:true },
                { label:'Corner Time', value:round.corners, target:5, color:'#f59e0b', invert:true },
                { label:'Active Movement', value:round.moving, target:20, color:'#3b82f6' },
              ].map(stat => (
                <div key={stat.label} className="mb-2.5">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{ color: '#94a3b8' }}>{stat.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: stat.color }}>{stat.value}%</span>
                      <span className="text-[10px]" style={{ color: '#475569' }}>target: {stat.target}%</span>
                      <span className="text-[10px]">{stat.invert ? stat.value <= stat.target : stat.value >= stat.target ? '✅' : '⚠️'}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: '#1F2937' }}>
                    <div className="h-full rounded-full transition-all" style={{ background: stat.color, width: `${Math.min(stat.value, 100)}%` }} />
                  </div>
                </div>
              ))}
              <p className="text-xs italic mt-3" style={{ color: '#94a3b8' }}>{round.note}</p>
              <p className="text-[11px]" style={{ color: '#6B7280' }}>Distance covered: <span className="text-white font-semibold">{round.distance}m</span></p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: '#0d1117', border: '1px solid #ef444430' }}>
              <div className="flex items-center gap-2 mb-2"><span>✨</span><span className="text-xs font-bold" style={{ color: '#ef4444' }}>AI Ring Intelligence</span></div>
              <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
                Marcus&apos;s ropes % increases by 8 percentage points in rounds 3 and 6 — a consistent fatigue signature. Centre control in rounds 1–2 is strong at 60%+ but drops sharply under sustained pressure. Drill priority: lateral ring escape when on ropes, and maintaining foot speed in rounds 5–8 of sparring.
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
              <h3 className="text-xs font-bold text-white mb-2">Session Averages (All Rounds)</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label:'Avg Centre', value:`${Math.round(ROUND_DATA.reduce((s,r)=>s+r.centre,0)/ROUND_DATA.length)}%`, color:'#facc15' },
                  { label:'Avg Ropes', value:`${Math.round(ROUND_DATA.reduce((s,r)=>s+r.ropes,0)/ROUND_DATA.length)}%`, color:'#ef4444' },
                  { label:'Total Distance', value:`${ROUND_DATA.reduce((s,r)=>s+r.distance,0)}m`, color:'#22c55e' },
                  { label:'Best Round', value:`Rd ${ROUND_DATA.reduce((best,r,i)=>r.centre>ROUND_DATA[best].centre?i:best,0)+1}`, color:'#a855f7' },
                ].map(s => (
                  <div key={s.label} className="rounded-lg p-2.5" style={{ background: '#1F2937' }}>
                    <div className="text-base font-black" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[10px]" style={{ color: '#6B7280' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'load' && (
        <div className="rounded-xl p-5" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
          <h3 className="text-sm font-bold text-white mb-4">📊 Session Load Monitor</h3>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1F2937' }}>
                  {['Round','Centre %','Ropes %','Corners %','Distance','Status'].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold uppercase" style={{ padding: '8px 12px', color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROUND_DATA.map(r => (
                  <tr key={r.round} style={{ borderBottom: '1px solid #0d1117' }}>
                    <td className="font-semibold text-white" style={{ padding: '10px 12px' }}>Rd {r.round}</td>
                    <td className="font-bold" style={{ padding: '10px 12px', color: '#facc15' }}>{r.centre}%</td>
                    <td style={{ padding: '10px 12px', color: r.ropes > 25 ? '#ef4444' : '#94a3b8' }}>{r.ropes}%</td>
                    <td style={{ padding: '10px 12px', color: r.corners > 7 ? '#f59e0b' : '#94a3b8' }}>{r.corners}%</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{r.distance}m</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                        style={{ background: r.centre >= 55 ? 'rgba(34,197,94,0.15)' : r.centre >= 48 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', color: r.centre >= 55 ? '#22c55e' : r.centre >= 48 ? '#f59e0b' : '#ef4444' }}>
                        {r.centre >= 55 ? '✓ On target' : r.centre >= 48 ? '⚠ Marginal' : '✗ Off target'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'roadwork' && (
        <div className="rounded-xl p-5" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
          <h3 className="text-sm font-bold text-white mb-4">🏃 Roadwork GPS — Morning Run</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
            {[
              { label:'Total Distance', value:'8.4 km', color:'#22c55e' },
              { label:'Avg Pace', value:'4:52 /km', color:'#0ea5e9' },
              { label:'Max Speed', value:'6.8 m/s', color:'#a855f7' },
              { label:'Sprint Efforts', value:'12', color:'#ef4444' },
              { label:'Elevation', value:'+142m', color:'#f59e0b' },
              { label:'Duration', value:'40:52', color:'#94a3b8' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3" style={{ background: '#1F2937' }}>
                <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[11px]" style={{ color: '#6B7280' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>7-Day Distance Trend</h4>
          <div className="flex gap-2 items-end" style={{ height: 80 }}>
            {[6.2,8.1,7.4,9.0,6.8,8.4,0].map((d,i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t" style={{ background: d === 0 ? '#1F2937' : '#ef4444', height: `${(d / 9.0) * 64}px`, opacity: d === 0 ? 0.3 : 1 }} />
                <span className="text-[10px]" style={{ color: '#475569' }}>{['M','T','W','T','F','S','S'][i]}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] mt-3" style={{ color: '#475569' }}>ACWR: <span className="font-bold" style={{ color: '#22c55e' }}>1.18</span> — Optimal load zone. Camp load trending correctly for peak phase.</p>
        </div>
      )}
    </div>
  )
}

export function BoxingPortalInner({ session, onSignOut }: { session: SportsDemoSession; onSignOut?: () => void }) {
  const [activeSection, setActiveSection] = useState('camp');
  const [toast, setToast] = useState<{message: string; sponsor: string} | null>(null);
  const [toastDismissed, setToastDismissed] = useState(false);
  const fighter = DEMO_FIGHTER;
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(() => { try { return typeof window !== 'undefined' ? localStorage.getItem('lumio_boxing_profile_photo') : null } catch { return null } })
  // Profile sync — keeps the bottom RoleSwitcher avatar/name in step with Settings edits
  const liveProfileNameOuter = useBoxingProfileName()
  const liveProfilePhotoOuter = useBoxingProfilePhoto()
  const liveBrandName = useBoxingBrandName()
  const liveBrandLogo = useBoxingBrandLogo()
  const liveSession = { ...session, userName: liveProfileNameOuter || session.userName, photoDataUrl: liveProfilePhotoOuter || session.photoDataUrl }
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setCurrentPhoto(localStorage.getItem('lumio_boxing_profile_photo'))
    window.addEventListener('lumio-profile-updated', sync)
    return () => window.removeEventListener('lumio-profile-updated', sync)
  }, [])

  // Sidebar pin
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const sidebarLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sidebarExpanded = sidebarPinned || sidebarHovered
  useEffect(() => { setSidebarPinned(typeof window !== 'undefined' && localStorage.getItem('lumio_boxing_sidebar_pinned') === 'true') }, [])
  const togglePin = () => setSidebarPinned(p => { const next = !p; localStorage.setItem('lumio_boxing_sidebar_pinned', String(next)); return next })
  function handleSidebarEnter() { if (sidebarLeaveTimer.current) { clearTimeout(sidebarLeaveTimer.current); sidebarLeaveTimer.current = null }; setSidebarHovered(true) }
  function handleSidebarLeave() { sidebarLeaveTimer.current = setTimeout(() => setSidebarHovered(false), 400) }

  // Modal state
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const closeModal = () => setActiveModal(null)

  // Customise Portal — hidden items
  const [hiddenItems, setHiddenItems] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try { const saved = localStorage.getItem('lumio_boxing_hidden_items'); return saved ? JSON.parse(saved) : [] } catch { return [] }
  })
  useEffect(() => {
    const handler = (e: Event) => { const ce = e as CustomEvent; if (ce.detail?.storagePrefix === 'lumio_boxing_') setHiddenItems(ce.detail.hiddenItems) }
    window.addEventListener('lumio-visibility-changed', handler)
    return () => window.removeEventListener('lumio-visibility-changed', handler)
  }, [])
  useEffect(() => {
    const nav = (e: Event) => { const section = (e as CustomEvent).detail; if (typeof section === 'string') setActiveSection(section) }
    window.addEventListener('lumio-navigate', nav)
    return () => window.removeEventListener('lumio-navigate', nav)
  }, [])
  const isHidden = (key: string) => hiddenItems.includes(key)

  // Role config
  const [roleOverride, setRoleOverride] = useState(session.role || 'fighter')
  const currentRole = (roleOverride || 'fighter') as keyof typeof BOXING_ROLE_CONFIG
  const roleConfig = BOXING_ROLE_CONFIG[currentRole] ?? BOXING_ROLE_CONFIG.fighter
  const isFighter = currentRole === 'fighter'
  const isSponsor = currentRole === 'sponsor'
  const visibleSidebarItems = (roleConfig.sidebar === 'all' ? SIDEBAR_ITEMS : SIDEBAR_ITEMS.filter(item => (roleConfig.sidebar as string[]).includes(item.id))).filter(item => !isHidden(item.id))

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 9 && !toastDismissed) {
      const obligations = [
        { condition: true, message: 'DAZN promo shoot — confirm logistics with Sarah Chen today', sponsor: 'DAZN' },
        { condition: true, message: 'Under Armour post due — kit photo needed this week', sponsor: 'Under Armour' },
      ];
      const due = obligations.find(o => o.condition);
      if (due) setToast(due);
    }
  }, [toastDismissed]);

  const groups = ['FIGHT CAMP', 'WEIGHT & HEALTH', 'RANKINGS', 'FINANCIALS', 'TEAM HUB', 'COMMERCIAL', 'CAREER', 'INTEL', 'INTEGRATIONS'];

  const renderView = () => {
    switch (activeSection) {
      case 'camp':             return <CampDashboardView fighter={fighter} session={session} onOpenModal={setActiveModal} />;
      case 'training':        return <TrainingLogView fighter={fighter} session={session} />;
      case 'sparring':        return <SparringPlannerView fighter={fighter} session={session} />;
      case 'opposition':      return <OppositionAnalysisView fighter={fighter} session={session} />;
      case 'fight-night':     return <FightNightOpsView fighter={fighter} session={session} />;
      case 'punchanalytics':  return <PunchAnalyticsView fighter={fighter} session={session} />;
      case 'gpsringheatmap':  return <GpsRingHeatmapView />;
      case 'fightcamp':       return <FightCampView fighter={fighter} session={session} />;
      case 'weight':          return <WeightTrackerView fighter={fighter} session={session} />;
      case 'cut':             return <CutPlannerView fighter={fighter} session={session} />;
      case 'recovery':        return <RecoveryHRVView fighter={fighter} session={session} />;
      case 'medical':         return <MedicalRecordView fighter={fighter} session={session} />;
      case 'rankings':        return <WorldRankingsView fighter={fighter} session={session} />;
      case 'mandatory':       return <MandatoryTrackerView fighter={fighter} session={session} />;
      case 'pathtotitle':     return <PathToTitleView fighter={fighter} session={session} />;
      case 'pursebid':        return <PurseBidAlertsView fighter={fighter} session={session} />;
      case 'career':          return <BoxingCareerPlanningView fighter={fighter} session={session} />;
      case 'pursesim':        return <PurseSimulatorView fighter={fighter} session={session} />;
      case 'earnings':        return <FightEarningsView fighter={fighter} session={session} />;
      case 'campcosts':       return <CampCostsView fighter={fighter} session={session} />;
      case 'tax':             return <TaxTrackerView fighter={fighter} session={session} />;
      case 'teamoverview':    return <TeamOverviewView fighter={fighter} session={session} />;
      case 'briefing':        return <FighterBriefingView fighter={fighter} session={session} />;
      case 'trainernotes':    return <TrainerNotesView fighter={fighter} session={session} />;
      case 'managerdash':     return <ManagerDashboardView fighter={fighter} session={session} />;
      case 'sponsorships':    return <SponsorshipsView fighter={fighter} session={session} />;
      case 'media':           return <MediaObligationsView fighter={fighter} session={session} />;
      case 'appearances':     return <AppearanceFeesView fighter={fighter} session={session} />;
      case 'contracts':       return <ContractTrackerView fighter={fighter} session={session} />;
      case 'fightrecord':     return <FightRecordView fighter={fighter} session={session} />;
      case 'careerstats':     return <CareerStatsView fighter={fighter} session={session} />;
      case 'promoterpipeline':return <PromoterPipelineView fighter={fighter} session={session} />;
      case 'agentintel':      return <AgentIntelView fighter={fighter} session={session} />;
      case 'aibriefing':      return <AIMorningBriefingView fighter={fighter} session={session} />;
      case 'opscout':         return <OppositionScoutView fighter={fighter} session={session} />;
      case 'broadcast':       return <BroadcastTrackerView fighter={fighter} session={session} />;
      case 'news':            return <IndustryNewsView fighter={fighter} session={session} />;
      case 'gps':             return <GPSLoadMonitorView fighter={fighter} session={session} />;
      case 'gpsvest':         return <GPSVestDashboardView fighter={fighter} session={session} />;
      case 'findpro':         return <FindProView fighter={fighter} session={session} />;
      case 'settings':        return (
        <SportsSettings
          sport="boxing"
          slug={fighter.slug}
          sportLabel="Boxing"
          entity="player"
          accentColour="#dc2626"
          accentLight="#ef4444"
          session={{ userName: session?.userName, photoDataUrl: session?.photoDataUrl, email: session?.email }}
          storagePrefix="lumio_boxing_"
          brandNameValue={liveBrandName}
          brandLogoUrl={liveBrandLogo}
          profile={{
            name: 'Full Name',
            tour: 'Tour',
            tourValue: 'Professional Boxing',
            ranking: 'Ranking',
            rankingValue: `WBC #${fighter.rankings.wbc} / WBA #${fighter.rankings.wba} / WBO #${fighter.rankings.wbo} / IBF #${fighter.rankings.ibf}`,
            coach: 'Trainer',
            coachValue: fighter.trainer,
            agent: 'Manager',
            agentValue: fighter.manager,
            playerIdLabel: 'BoxRec Fighter ID',
            staffInviteRoles: ['Trainer','Cutman','Strength Coach','Nutritionist','Physio','Manager'],
          }}
          configFields={[
            { id: 'boxrecId', label: 'BoxRec Fighter ID', description: 'For live ranking and fight history', kind: 'text', placeholder: 'e.g. BR-000001' },
            { id: 'weightClass', label: 'Weight Class', kind: 'select', options: ['Heavyweight','Cruiserweight','Light Heavyweight','Super Middleweight','Middleweight','Super Welterweight','Welterweight','Super Lightweight','Lightweight','Super Featherweight','Featherweight','Super Bantamweight','Bantamweight','Super Flyweight','Flyweight','Minimumweight'], defaultValue: fighter.weight_class },
            { id: 'sanctioning', label: 'Sanctioning Body Preference', kind: 'checkboxGroup', options: ['WBC','WBA','WBO','IBF'], defaultValue: ['WBC','WBA','WBO','IBF'] },
          ]}
          integrationGroups={[
            {
              title: 'DATA PROVIDERS',
              items: [
                { name: 'BoxRec', desc: 'Fight history & records', connected: true },
                { name: 'WBC Rankings', desc: 'World Boxing Council ratings', connected: true },
                { name: 'WBA Rankings', desc: 'World Boxing Association ratings', connected: true },
                { name: 'WBO Rankings', desc: 'World Boxing Organization ratings' },
                { name: 'IBF Rankings', desc: 'International Boxing Federation ratings' },
                { name: 'STATSports', desc: 'Movement & load tracking' },
                { name: 'Veo', desc: 'Sparring video capture & analysis' },
                { name: 'Compubox', desc: 'Live punch stats', connected: true },
              ],
            },
            {
              title: 'COMMUNICATION',
              items: [
                { name: 'Slack', desc: 'Team messaging & alerts', connected: true },
                { name: 'Microsoft Teams', desc: 'Chat & video conferencing' },
                { name: 'Google Workspace', desc: 'Calendar, Drive & email' },
                { name: 'WhatsApp Business', desc: 'Fighter & manager messaging' },
              ],
            },
          ]}
          voiceOptions={[
            { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', desc: 'Warm, confident British female — ideal for morning briefings' },
            { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', desc: 'Calm, authoritative British female — clear and composed' },
            { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', desc: 'Professional British male — steady fight-night narration' },
          ]}
          teamInvite={{
            enabled: true,
            staffCount: 1,
            pendingInvites: 0,
            roleOptions: ['Trainer','Cutman','Strength Coach','Nutritionist','Physio','Manager'],
            members: [
              { name: fighter.trainer, role: 'Trainer', access: 'Full' },
              { name: fighter.manager, role: 'Manager', access: 'Commercial' },
              { name: fighter.cutman, role: 'Cutman', access: 'Limited' },
              { name: fighter.strength_coach, role: 'Strength & Conditioning', access: 'Limited' },
              { name: fighter.nutritionist, role: 'Nutritionist', access: 'Limited' },
              { name: fighter.physio, role: 'Physio', access: 'Limited' },
            ],
          }}
          navItems={[
            { key: 'training', label: 'Training Log', emoji: '🥊' },
            { key: 'sparring', label: 'Sparring Planner', emoji: '🤼' },
            { key: 'opposition', label: 'Opposition Analysis', emoji: '🔍' },
            { key: 'weight', label: 'Weight Tracker', emoji: '⚖️' },
            { key: 'cut', label: 'Cut Planner', emoji: '📉' },
            { key: 'medical', label: 'Medical Record', emoji: '🏥' },
            { key: 'rankings', label: 'World Rankings', emoji: '🌍' },
            { key: 'sponsorships', label: 'Sponsorships', emoji: '🤝' },
            { key: 'media', label: 'Media Obligations', emoji: '📱' },
            { key: 'earnings', label: 'Fight Earnings', emoji: '💰' },
          ]}
          featureItems={[
            { key: 'morning-briefing', label: 'Morning Briefing', emoji: '🌅', description: 'AI summary at top of dashboard' },
            { key: 'quick-actions', label: 'Quick Actions bar', emoji: '⚡', description: 'Action buttons below tab bar' },
            { key: 'ai-section', label: 'AI Department Intelligence', emoji: '✨', description: 'AI Summary + Key Highlights' },
            { key: 'world-clock', label: 'World Clock', emoji: '🕐', description: 'Multi-timezone clock in banner' },
            { key: 'player-card', label: 'Fighter Card', emoji: '🃏', description: 'Stats card in right sidebar' },
          ]}
          onVisibilityChange={(items) => setHiddenItems(items)}
          showWorldClock
          showAppearance
          showDeveloperTools
          devApiRouteOptions={['/api/ai/boxing']}
        />
      );
      default:                return <CampDashboardView fighter={fighter} session={session} onOpenModal={setActiveModal} />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#07080F', color: '#F9FAFB' }}>
      {toast && !toastDismissed && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-[#0d0f1a] border border-yellow-500/40 rounded-xl p-4 shadow-2xl" style={{animation:'slideUp 0.26s ease'}}>
          <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div className="text-xs font-bold text-yellow-400 uppercase tracking-wide mb-1">🤝 {toast.sponsor}</div>
          <div className="text-xs text-gray-300 mb-3">{toast.message}</div>
          <div className="flex gap-2">
            <button onClick={() => { setActiveSection('sponsorships'); setToast(null); }} className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors">Review →</button>
            <button onClick={() => { setToastDismissed(true); setToast(null); }} className="flex-1 text-xs border border-gray-700 text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg transition-colors">Dismiss</button>
          </div>
        </div>
      )}
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col overflow-hidden"
        style={{
          width: sidebarExpanded ? 220 : 72,
          backgroundColor: '#0a0c14',
          borderRight: '1px solid #1F2937',
          transition: 'width 250ms ease',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 40,
        }}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}>

        {/* Sidebar Header */}
        <div className="flex items-center shrink-0" style={{ borderBottom: '1px solid #1F2937', minHeight: 56, padding: sidebarExpanded ? '12px 10px' : '12px 4px', gap: sidebarExpanded ? 8 : 0 }}>
          <div className="flex items-center gap-2 flex-1 min-w-0" style={{ justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? 4 : 0 }}>
            {liveBrandLogo
              ? <img src={liveBrandLogo} alt="" className="w-8 h-8 rounded-lg object-contain flex-shrink-0" style={{ background: '#ffffff08', padding: 2 }} />
              : session.logoDataUrl
                ? <img src={session.logoDataUrl} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}>
                    🥊
                  </div>
            }
            {sidebarExpanded && (
              liveBrandName
                ? <span className="text-xs font-bold uppercase tracking-widest truncate" style={{ color: '#F9FAFB' }}>{liveBrandName}</span>
                : <span className="text-xs font-bold uppercase tracking-widest truncate" style={{ background: 'linear-gradient(90deg, #EF4444, #F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Lumio Fight
                  </span>
            )}
          </div>
          {sidebarExpanded && (
            <button onClick={togglePin} className="shrink-0 p-1 rounded" style={{ color: sidebarPinned ? '#dc2626' : '#4B5563', transform: sidebarPinned ? 'rotate(0deg)' : 'rotate(45deg)', transition: 'transform 200ms, color 200ms' }} title={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar open'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z"/></svg>
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-2 px-1.5">
          {groups.map(group => {
            const items = visibleSidebarItems
              .filter(i => i.group === group)
              .sort((a, b) => (a.id === 'settings' ? 1 : b.id === 'settings' ? -1 : 0));
            if (items.length === 0) return null;
            return (
              <div key={group} className="mb-3">
                {sidebarExpanded && (
                  <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-2 mb-1">{group}</div>
                )}
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveSection(item.id); if (!sidebarPinned) setSidebarHovered(false) }}
                    className="w-full flex items-center gap-2.5 py-2 rounded-lg mb-0.5 transition-all text-left"
                    style={{
                      backgroundColor: activeSection === item.id ? 'rgba(220,38,38,0.12)' : 'transparent',
                      color: activeSection === item.id ? '#FCA5A5' : '#6B7280',
                      borderLeft: activeSection === item.id ? '2px solid #dc2626' : '2px solid transparent',
                      paddingLeft: sidebarExpanded ? 10 : 0,
                      justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                    }}
                    title={sidebarExpanded ? undefined : item.label}
                  >
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    {sidebarExpanded && <span className="text-xs font-medium truncate">{item.label}</span>}
                    {item.id === 'fightcamp' && sidebarExpanded && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold text-white ml-auto" style={{ backgroundColor: '#F59E0B' }}>NEW</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Role Switcher */}
        <RoleSwitcher
          session={liveSession}
          roles={BOXING_ROLES}
          accentColor="#dc2626"
          onRoleChange={(role) => {
            setRoleOverride(role)
            const key = 'lumio_boxing_demo_session'
            const stored = localStorage.getItem(key)
            if (stored) {
              const parsed = JSON.parse(stored)
              localStorage.setItem(key, JSON.stringify({ ...parsed, role }))
            }
          }}
          sidebarCollapsed={!sidebarExpanded}
        />

        {/* Sidebar Footer */}
        {onSignOut && (
          <button onClick={onSignOut} className="flex items-center gap-2 w-full px-4 py-2.5 text-xs transition-all hover:bg-red-600/10" style={{ borderTop: '1px solid #1F2937', color: '#6B7280', justifyContent: sidebarExpanded ? 'flex-start' : 'center' }} title="Sign out">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {sidebarExpanded && <span>Sign out</span>}
          </button>
        )}
        {sidebarExpanded && (
          <div className="p-3 border-t border-gray-800 flex items-center justify-center">
            <img src="/boxing_logo.png" alt="Lumio Boxing" style={{ maxHeight: 32, objectFit: 'contain' }} />
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0" style={{ marginLeft: sidebarPinned ? 220 : 72, transition: 'margin-left 250ms ease' }}>
        {/* Demo workspace banner — hidden when rendered inside /boxing/app for a real signed-in user */}
        {session.isDemoShell !== false && (
          <div className="flex items-center justify-between px-6 py-2 text-xs font-medium flex-shrink-0"
            style={{ backgroundColor: '#dc2626', color: '#ffffff' }}>
            <span>This is a demo · sample data</span>
            <a href="/sports-signup" className="flex items-center gap-1 hover:underline font-semibold" style={{ color: '#ffffff' }}>
              Get founding access →
            </a>
          </div>
        )}
        {(() => {
          try {
            const stored = localStorage.getItem('lumio_boxing_fight_camp')
            if (!stored) return null
            const config = JSON.parse(stored)
            const days = Math.max(0, Math.ceil((new Date(config.fightDate).getTime() - Date.now()) / 86400000))
            const len = Math.max(1, Math.ceil((new Date(config.fightDate).getTime() - new Date(config.activatedAt).getTime()) / 86400000))
            const prog = Math.round(((len - days) / len) * 100)
            const ph = prog < 33 ? 'Foundation' : prog < 66 ? 'Build' : 'Peak & Taper'
            const phC = ph === 'Foundation' ? '#3B82F6' : ph === 'Build' ? '#F59E0B' : '#EF4444'
            return (
              <div className="flex items-center justify-between px-6 py-2 text-xs font-medium flex-shrink-0"
                style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderBottom: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
                <div className="flex items-center gap-3">
                  <span>🥊</span>
                  <span>Fight Camp Active — vs {config.opponent} · {days} days to fight night</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: phC }}>{ph}</span>
                </div>
                <button onClick={() => { localStorage.removeItem('lumio_boxing_fight_camp'); window.location.reload() }}
                  className="text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#6B7280' }}>Deactivate</button>
              </div>
            )
          } catch { return null }
        })()}
        {!isFighter && !isSponsor && (
          <div className="flex items-center justify-between px-6 py-2 text-xs flex-shrink-0"
            style={{ backgroundColor: `${roleConfig.accent}12`, borderBottom: `1px solid ${roleConfig.accent}25` }}>
            <div className="flex items-center gap-2">
              <span>{roleConfig.icon}</span>
              <span style={{ color: roleConfig.accent }}>Viewing as <strong>{roleConfig.label}</strong>{roleConfig.message ? ` — ${roleConfig.message}` : ''}</span>
            </div>
            <span style={{ color: `${roleConfig.accent}80` }}>Fighter controls full access →</span>
          </div>
        )}
        {/* Content + Card Row */}
        {isSponsor ? (
          <BoxingSponsorDashboard session={session} fighter={fighter} />
        ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderView()}
          </div>

          {/* Fighter Card Column */}
          <div className="hidden lg:flex flex-col items-center gap-4 p-4 border-l border-gray-800 flex-shrink-0"
            style={{ width: '220px' }}>
            <FighterCard fighter={fighter} session={session} />
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Next Fight</div>
              <div className="text-xs text-red-400 font-medium">{fighter.next_fight.opponent} {fighter.next_fight.opponent_flag}</div>
              <div className="text-xs text-gray-300 mt-1">{fighter.next_fight.opponent_record}</div>
              <div className="text-xs text-gray-500">{fighter.next_fight.venue}</div>
              <div className="mt-2 text-xs text-yellow-400">{fighter.next_fight.days_away} days — {fighter.next_fight.broadcast}</div>
            </div>
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Weight</div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Current</span>
                <span className="text-white font-medium">{fighter.current_weight}kg</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-400">Target</span>
                <span className="text-teal-400 font-medium">{fighter.target_weight}kg</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-400">To cut</span>
                <span className="text-red-400 font-medium">{(fighter.current_weight - fighter.target_weight).toFixed(1)}kg</span>
              </div>
            </div>
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Alerts</div>
              <div className="space-y-1.5">
                <div className="text-xs text-yellow-400">DAZN shoot: 8 days</div>
                <div className="text-xs text-yellow-400">UA renewal: May 2026</div>
                <div className="text-xs text-red-400">Shoulder: monitoring</div>
                <div className="text-xs text-teal-400">Weight: on track</div>
              </div>
            </div>
          </div>
        </div>
        )}

      </div>
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
            {activeModal === 'sendmessage' && <BoxingSendMessage onClose={closeModal} fighter={fighter} session={session} />}
            {activeModal === 'flights' && <BoxingFlightFinder onClose={closeModal} session={session} fighter={fighter} />}
            {activeModal === 'matchprep' && <BoxingMatchPrepAI onClose={closeModal} session={session} fighter={fighter} />}
            {activeModal === 'sponsor' && <BoxingSponsorPost onClose={closeModal} session={session} fighter={fighter} />}
            {activeModal === 'ranking' && <BoxingRankingSimulator onClose={closeModal} fighter={fighter} />}
            {activeModal === 'injury' && <BoxingInjuryLogger onClose={closeModal} />}
            {activeModal === 'expense' && <BoxingExpenseLogger onClose={closeModal} />}
            {activeModal === 'weight' && <BoxingWeightCheck onClose={closeModal} fighter={fighter} />}
            {activeModal === 'visa' && <BoxingVisaCheck onClose={closeModal} fighter={fighter} />}
            {activeModal === 'socialmedia' && <BoxingSocialMediaAI onClose={closeModal} fighter={fighter} />}
            {activeModal === 'hotel' && <BoxingHotelFinder onClose={closeModal} fighter={fighter} />}
            {activeModal === 'weightcut' && <BoxingWeightCutAI onClose={closeModal} fighter={fighter} />}
            {activeModal === 'opponentscout' && <BoxingOpponentScout onClose={closeModal} fighter={fighter} />}
            {activeModal === 'vadacheck' && <BoxingVADACheck onClose={closeModal} />}
            {activeModal === 'pursebreakdown' && <BoxingPurseBreakdown onClose={closeModal} />}
            {activeModal === 'rankingstracker' && <BoxingRankingsTracker onClose={closeModal} session={session} fighter={fighter} />}
            {activeModal === 'campcontent' && <BoxingCampContent onClose={closeModal} session={session} fighter={fighter} />}
          </div>
        </div>
      )}
    </div>
  );
}
