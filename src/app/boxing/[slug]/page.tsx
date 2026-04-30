'use client';
// TODO: Scope localStorage keys by user ID when auth is implemented// e.g. `sport_schedule_checked` → `sport_${userId}_schedule_checked`
//
// ─── INVENTED BOXING ROSTER ─────────────────────────────────────────────────
// All real-world boxer names have been replaced with invented personas to
// keep the demo content brand-coherent (matches the Meridian Sports
// broadcaster universe). The founder persona "Marcus Cole" stays as-is.
//
// Heavyweight contenders (top 14 + Marcus Cole):
//   1. Yarko Levchenko   "The Iron Wall"  🇺🇦 22-0 (14 KO)  Unified champion
//   2. Callum Brennan    "Big Cal"        🏴󠁧󠁢󠁥󠁮󠁧󠁿 34-1-1 (24 KO) WBC champion
//   3. Yang Zhi Wei      "The Dragon"     🇨🇳 27-2-1 (22 KO)
//   4. Maks Stoyan       "Iron Tooth"     🇧🇬 28-2 (24 KO)  Marcus's next opponent
//   5. Etienne Ngoma     "The Mountain"   🇨🇩 21-1 (16 KO)
//   6. Bruno Babic       "The Surgeon"    🇭🇷 17-1 (14 KO)
//   7. Kallum Wright     "The Hammer"     🏴󠁧󠁢󠁥󠁮󠁧󠁿 22-2 (21 KO)  IBF champion
//   8. Reece Halloran    "Old Iron"       🏴󠁧󠁢󠁥󠁮󠁧󠁿 16-3 (15 KO)
//   9. Yusuf Çelik       "The Sultan"     🇩🇪 24-0 (17 KO)
//  10. Yoel Bermudez     "El Toro"        🇨🇺 24-1 (17 KO)  Marcus's only loss (2024)
//  11. Trevon Walsh      "Young Lion"     🇺🇸 17-0 (15 KO)
//  12. Hone Tahere       "Maori Warrior"  🇳🇿 35-3 (23 KO)
//  13. Bryce Holcombe    "The Bushman"    🇦🇺 24-1 (14 KO)
//  14. Ezekiel Onyeka    "African Lion"   🇳🇬 18-2 (14 KO)
//  15. Marcus Cole       "The Machine"    🏴󠁧󠁢󠁥󠁮󠁧󠁿 22-1 (18 KO)  KEEP — founder persona
//
// Sparring / camp / past opponents (already invented or replaced):
//   • Darnell "Tank" Hughes (in-camp sparring partner, 14-2)
//   • Wesley Dunne (early-career journeyman opponent, 5-7)
//
// Broadcaster: all real-world boxing-network references (DAZN, ESPN, Sky
// Sports Box Office, Showtime) have been replaced with the invented
// "Meridian Sports" broadcast brand.

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation'
import SportsDemoGate, { type SportsDemoSession } from '@/components/sports-demo/SportsDemoGate'
import RoleSwitcher from '@/components/sports-demo/RoleSwitcher'
import { createBrowserClient } from '@supabase/ssr'
import { isDemoSlug } from '@/lib/config/demo-slugs'
import { generateSmartBriefing, buildRoundupSummary, buildScheduleItems, getUserTimezone } from '@/lib/sports/smartBriefing'
import SportsSettings from '@/components/sports/SportsSettings'
import { getDailyQuote, BOXING_QUOTES } from '@/lib/sports-quotes'
import { getDemoAISummary } from '@/lib/demo-content/ai-summaries'
import { CANNED } from '@/lib/ai/canned-demo-responses'
import MediaContentModule from '@/components/sports/media-content/MediaContentModule'
import { clearDemoSession } from '@/lib/demo-session/clear'
import { useLiveBrandColours } from '@/lib/hooks/useLiveBrandColours'
import { TRAINERS_ROSTER, GYMS_ROSTER, SPARRING_ROSTER } from '@/lib/demo-content/boxing-pros'
import { IntegrationsHub, type HubEntry } from '@/lib/sports-integrations/integrations-hub'
import { BOXING_INTEGRATIONS } from '@/lib/sports-integrations/boxing-integrations'
import { PwaInstaller } from '@/components/PwaInstaller'
import { useIsMobile } from '@/hooks/useIsMobile'
import { MobileSportLayout } from '@/components/mobile/MobileSportLayout'
import { MobileSportHome } from '@/components/mobile/MobileSportHome'
import { MobileSportTraining } from '@/components/mobile/MobileSportTraining'
import { boxingMobileConfig } from '@/lib/mobile/configs/boxing'
// ─── Boxing v2 dashboard imports ──────────────────────────────────────────────
import { THEMES, DENSITY, FONT as V2_FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon as V2Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import {
  HeroToday as BoxingHeroToday,
  FightCampStatus as BoxingFightCampStatus,
  TodaySchedule as BoxingTodaySchedule,
  StatTiles as BoxingStatTiles,
  AIBrief as BoxingAIBrief,
  MyTeam as BoxingMyTeam,
  Perf as BoxingPerf,
  Recents as BoxingRecents,
  PhotoFrame as BoxingPhotoFrame,
  FightBriefPanel as BoxingFightBriefPanel,
} from './_components/BoxingDashboardModules'
import { BoxingSidebar } from './_components/BoxingShell'
import {
  BOXING_NAV_GROUPS, BOXING_ACCENT, BOXING_INBOX,
} from './_lib/boxing-dashboard-data'

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

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
// Mirrors darts/[slug]/page.tsx — rendered whenever session.isDemoShell === false
// (a live founder without connected data) in place of demo content.
function EmptyState({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', textAlign: 'center', border: '1px dashed #1F2937', borderRadius: 12, background: '#0a0c14' }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <div style={{ color: '#6B7280', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ color: '#374151', fontSize: 12 }}>{sub}</div>}
    </div>
  )
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
    date_iso?: string;
    date_short?: string;
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
  { id: 'camp',             label: 'Dashboard',           icon: '🏕️', group: 'OVERVIEW' },
  { id: 'training',        label: 'Training Log',        icon: '🥊', group: 'OVERVIEW' },
  { id: 'sparring',        label: 'Sparring Planner',    icon: '🤼', group: 'OVERVIEW' },
  { id: 'punchanalytics',  label: 'Punch Analytics',     icon: '🥊', group: 'OVERVIEW' },
  { id: 'gps',             label: 'GPS',                 icon: '🛰️', group: 'OVERVIEW' },
  { id: 'gps-heatmaps',    label: 'Heatmaps',            icon: '🔥', group: 'OVERVIEW' },
  { id: 'fightcamp',       label: 'Fight Camp',          icon: '🥊', group: 'FIGHT CAMP' },
  { id: 'fight-night',     label: 'Fight Night Ops',     icon: '🥊', group: 'FIGHT CAMP' },
  { id: 'campcosts',       label: 'Camp Costs',          icon: '🧾', group: 'FIGHT CAMP' },
  { id: 'opposition',      label: 'Opposition Analysis', icon: '🔍', group: 'FIGHT CAMP' },
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
  { id: 'tax',             label: 'Tax Tracker',         icon: '📊', group: 'FINANCIALS' },
  { id: 'physio-recovery', label: 'Physio & Recovery',   icon: '⚕️', group: 'TEAM HUB' },
  { id: 'teamoverview',    label: 'Team Overview',       icon: '👥', group: 'TEAM HUB' },
  { id: 'briefing',        label: 'Fighter Briefing',    icon: '📄', group: 'TEAM HUB' },
  { id: 'trainernotes',    label: 'Trainer Notes',       icon: '📝', group: 'TEAM HUB' },
  { id: 'managerdash',     label: 'Manager Dashboard',   icon: '💼', group: 'TEAM HUB' },
  { id: 'sponsorships',    label: 'Sponsorships',        icon: '🤝', group: 'COMMERCIAL' },
  { id: 'media',           label: 'Media & Content',     icon: '📱', group: 'COMMERCIAL' },
  { id: 'appearances',     label: 'Appearance Fees',     icon: '🎤', group: 'COMMERCIAL' },
  { id: 'contracts',       label: 'Contract Tracker',    icon: '📑', group: 'COMMERCIAL' },
  { id: 'fightrecord',     label: 'Fight Record',        icon: '📜', group: 'CAREER' },
  { id: 'careerstats',     label: 'Career Stats',        icon: '📈', group: 'CAREER' },
  { id: 'promoterpipeline',label: 'Promoter Pipeline',   icon: '🗂️', group: 'CAREER' },
  { id: 'agentintel',      label: 'Agent Intel',         icon: '🕵️', group: 'CAREER' },
  { id: 'aibriefing',      label: 'AI Morning Briefing', icon: '🌅', group: 'INTEL' },
  { id: 'opscout',         label: 'Opposition Scout',    icon: '🎯', group: 'INTEL' },
  { id: 'broadcasttracker',label: 'Broadcast Tracker',   icon: '📺', group: 'INTEL' },
  { id: 'news',            label: 'Industry News',       icon: '📰', group: 'INTEL' },
  { id: 'findpro',         label: 'Find a Pro',          icon: '🔍', group: 'TEAM HUB' },
  { id: 'travel',          label: 'Travel & Logistics',  icon: '✈️', group: 'TEAM HUB' },
  { id: 'integrations',    label: 'Integrations',        icon: '🔌', group: 'SETTINGS' },
  { id: 'settings',        label: 'Settings',            icon: '⚙️', group: 'SETTINGS' },
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
  promoter: 'Titan Promotions',
  broadcast: 'Meridian Sports',
  manager: 'Danny Walsh',
  trainer: 'Jim Bevan',
  cutman: 'Mick Williamson',
  strength_coach: 'Greg Mayfield',
  nutritionist: 'Dr. Priya Kapoor',
  physio: 'Liam Brennan',
  camp_day: 22,
  camp_total: 70,
  next_fight: {
    opponent: 'Maks Stoyan',
    opponent_nationality: 'Russian',
    opponent_flag: '🇷🇺',
    opponent_record: '28-2 (24 KO)',
    opponent_ranking: 'WBC #3',
    // Single source of truth for fight timing. days_away is anchored to
    // 2026-04-19 (today) → Sat 6 Jun 2026.
    date: 'Sat 6 Jun 2026',
    date_iso: '2026-06-06',
    date_short: 'Jun 6',
    days_away: 48,
    venue: 'The Millennium Dome, London',
    broadcast: 'Meridian Sports PPV',
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
  const isFoundingMember = session.isDemoShell === false
  // Founders read session (hydrated from sports_profiles) only — never the
  // lumio_boxing_* survivor keys, which may carry leaked values from a prior
  // demo visit on this browser.
  const liveName = isPlayerRole
    ? (isFoundingMember
        ? (session.userName || fighter.name)
        : ((typeof window !== 'undefined' ? localStorage.getItem('lumio_boxing_name') : null) || session.userName || fighter.name))
    : fighter.name
  const liveNickname = isPlayerRole
    ? (isFoundingMember
        ? (session.nickname?.trim() || '')
        : ((typeof window !== 'undefined' ? localStorage.getItem('lumio_boxing_nickname') : null) || ''))
    : fighter.nickname
  const livePhoto = isPlayerRole
    ? (isFoundingMember
        ? (session.photoDataUrl || null)
        : ((typeof window !== 'undefined' ? localStorage.getItem('lumio_boxing_profile_photo') : null) || session.photoDataUrl || '/marcus_cole.jpg'))
    : null
  return (
  <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
    <div className="flex flex-col items-center text-center mb-3">
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 border-2 border-red-500/40 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(234,88,12,0.3))' }}>
        {livePhoto ? <img src={livePhoto} alt={liveName} className="w-full h-full object-cover object-center" /> : fighter.flag}
      </div>
      <div className="text-sm font-bold text-white">{liveName}</div>
      {liveNickname ? <div className="text-[10px] text-red-400 font-semibold">&ldquo;{liveNickname}&rdquo;</div> : null}
      <div className="text-xs text-gray-400 mt-1">{isFoundingMember ? '—' : `${fighter.record.wins}-${fighter.record.losses} (${fighter.record.ko} KO)`}</div>
    </div>
    <div className="space-y-1.5 text-xs">
      <div className="flex justify-between"><span className="text-gray-500">Weight Class</span><span className="text-gray-300">{isFoundingMember ? '—' : fighter.weight_class}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">Stance</span><span className="text-gray-300">{isFoundingMember ? '—' : fighter.stance}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">Height</span><span className="text-gray-300">{isFoundingMember ? '—' : fighter.height}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">Reach</span><span className="text-gray-300">{isFoundingMember ? '—' : fighter.reach}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">Age</span><span className="text-gray-300">{isFoundingMember ? '—' : fighter.age}</span></div>
      <div className="border-t border-gray-800 my-2"></div>
      <div className="flex justify-between"><span className="text-gray-500">WBC</span><span className="text-red-400 font-semibold">{isFoundingMember ? '—' : `#${fighter.rankings.wbc}`}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">WBA</span><span className="text-red-400 font-semibold">{isFoundingMember ? '—' : `#${fighter.rankings.wba}`}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">WBO</span><span className="text-red-400 font-semibold">{isFoundingMember ? '—' : `#${fighter.rankings.wbo}`}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">IBF</span><span className="text-red-400 font-semibold">{isFoundingMember ? '—' : `#${fighter.rankings.ibf}`}</span></div>
      <div className="border-t border-gray-800 my-2"></div>
      <div className="flex justify-between"><span className="text-gray-500">Promoter</span><span className="text-gray-300">{isFoundingMember ? '—' : fighter.promoter}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">Trainer</span><span className="text-gray-300">{isFoundingMember ? '—' : fighter.trainer}</span></div>
      <div className="flex justify-between"><span className="text-gray-500">Manager</span><span className="text-gray-300">{isFoundingMember ? '—' : fighter.manager}</span></div>
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
  if (context !== 'dashboard') return null
  const isDemoShell = session.isDemoShell !== false
  const demoContent = isDemoShell ? getDemoAISummary('boxing', context) : null
  const [summary, setSummary]     = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [generated, setGenerated] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const HIGHLIGHTS: Record<string, string[]> = {
    dashboard:    [`Fight Night in ${fighter.next_fight.days_away} days — ${fighter.next_fight.opponent} (${fighter.next_fight.opponent_ranking})`, `Weight on track: ${fighter.current_weight}kg — cut to ${fighter.target_weight}kg manageable`, 'Sparring this week: 8 rounds logged — no incidents', 'Purse bid deadline: IBF mandatory — 30 Apr', 'GPS load: ACWR 1.25 — manage carefully, near upper limit'],
    training:     ['Session load this week: 4,820 AU — on plan', 'Sparring quality: coach rated 8.2/10 last session', 'Jab speed improving: +0.04s vs last camp avg', 'Right hand power: 94% of peak — near fight-ready', 'Conditioning: VO2 max 58.4 — top 5% for weight class'],
    weight:       [`Current: ${fighter.current_weight}kg → target ${fighter.target_weight}kg at weigh-in`, `${(fighter.current_weight - fighter.target_weight).toFixed(1)}kg to cut — ${fighter.next_fight.days_away} days — on schedule`, 'Water cut phase starts 5 days before — plan confirmed with nutritionist', 'Nutrition plan updated for cut phase: -400 cal/day from next week', 'Last camp cut was comparable — no concerns'],
    rankings:     [`WBC #${fighter.rankings.wbc} — up 1 this month`, `IBF #${fighter.rankings.ibf} — mandatory position approaching`, `Win vs ${fighter.next_fight.opponent}: projected WBC #${Math.max(1, fighter.rankings.wbc - 2)} / IBF mandatory confirmed`, 'Top-5 all major belts = world title shot by end of year', 'Promoter pipeline: 2 world title offers pending fight result'],
    sponsorship:  ['Apex Performance: camp partnership — 2 posts due this month', 'Meridian Sports: fight night promo shoot confirmed', 'New inquiry: sports nutrition brand — £45k/yr offer', 'Manager reviewing Apex Performance camp partnership', 'Prize money media allocation: confirm with promoter'],
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
    if (session?.isDemoShell !== false) {
      setSummary(cleanResponse(CANNED.boxing.dashboardSummary ?? ''))
      setGenerated(true)
      setError(null)
      setLoading(false)
      return
    }
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
      if (!res.ok) {
        if (res.status === 529) throw new Error('BUSY')
        if (res.status === 401) throw new Error('AUTH')
        throw new Error('GENERIC')
      }
      const data = await res.json()
      const raw = data.content?.map((b: {type:string;text?:string}) =>
        b.type === 'text' ? b.text : '').join('') || ''
      setSummary(cleanResponse(raw))
      setGenerated(true)
      setError(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'BUSY') setError('AI is briefly busy — try again in a moment.')
      else if (msg === 'AUTH') setError('AI service unavailable. Please contact support.')
      else setError('Could not generate summary. Try again.')
    }
    setLoading(false)
  }

  // No auto-fire — demo uses static content, real users click Generate

  const renderSummary = (text: string) =>
    text.split('\n').filter(l => l.trim()).map((line, i) => (
      <div key={i} className="flex gap-2 text-xs text-gray-300 py-1 border-b border-gray-800/40 last:border-0">
        <span>{line}</span>
      </div>
    ))

  // Demo shell: static content, no API calls
  const displaySummary = isDemoShell ? (demoContent?.summary || null) : summary
  const displayHighlights = isDemoShell ? (demoContent?.highlights || highlights) : highlights

  if (isDemoShell && !demoContent) {
    console.warn(`[BoxingAISection] No demo content for boxing/${context}`)
  }

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
            {isDemoShell ? (
              <span className="text-[10px] text-gray-600">Generated just now</span>
            ) : (
              <div className="flex items-center gap-2">
                {generated && <span className="text-[10px] text-gray-600">Generated just now</span>}
                {generated && <button onClick={generateSummary} disabled={loading} className="text-gray-600 hover:text-gray-400 text-sm">{loading ? '⟳' : '↺'}</button>}
              </div>
            )}
          </div>
          {isDemoShell ? (
            displaySummary ? <div>{renderSummary(displaySummary)}</div> : <div className="text-xs text-gray-500">AI Summary</div>
          ) : (<>
            {!summary && !loading && !error && (
              <button onClick={generateSummary}
                className="w-full py-3 rounded-xl text-xs font-semibold border border-gray-800 text-gray-500 hover:border-red-500/40 hover:text-red-400 transition-all">
                Generate AI summary for this section →
              </button>
            )}
            {loading && <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-3 bg-gray-800 rounded animate-pulse" style={{width:`${70+i*7}%`}} />)}</div>}
            {error && <div className="text-xs text-red-400 mb-2">{error} <button onClick={generateSummary} className="underline ml-1">Retry</button></div>}
            {summary && !loading && <div>{renderSummary(summary)}</div>}
          </>)}
        </div>
        <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><span>⚡</span><span className="text-sm font-bold text-white">AI Key Highlights</span></div>
            <span className="text-[10px] text-red-400 cursor-pointer">Performance</span>
          </div>
          <div className="space-y-2">
            {displayHighlights.map((h, i) => (
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
// ─── INTERACTIVE BOXING INBOX (v2 dashboard) ─────────────────────────────────
// Inline interactive inbox for the v2 today tab — expand a channel to read
// the full message, then reply / forward / dismiss. Mirrors rugby's
// InteractiveRugbyInbox so the dashboard inbox feels consistent across sports.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const BOXING_INBOX_BODIES: Record<string, { body: string }> = {
  'Manager · Danny Walsh':  { body: 'DAZN PPV deal confirmed — paperwork in your email. Purse: 65/35 Marcus, plus PPV upside trigger at 250k buys. Need a yes by 16:00 for Petrov undercard slot.' },
  'Promoter Desk':          { body: 'Crown Park venue locked. Hotel block: 4 nights Marriott Canary Wharf, 12 corner-team rooms reserved. Press conf. Thursday 14:00 — Petrov camp confirmed attendance.' },
  'Physio & Medical':       { body: 'Jim flagged the right hand rewrap last night — knuckle swelling on heavy bag. Booked Dr Mitchell 09:00 for x-ray + soft-tissue check. Likely tape adjustment, not a layoff.' },
  'Media & Sponsor':        { body: 'Apex Performance camp video — 2 posts still outstanding from March deliverable. Crew can shoot Mon morning before sparring. DAZN talking-points doc for the interview is in your inbox.' },
  'Weight Check':            { body: 'Daily weigh-in: 97.8kg. Target 92.7kg by weigh-in day (D-1). Cut velocity 0.11kg/day = bang on plan. Log before 09:00 today, full glycogen reset Sunday.' },
  'Travel & Camp':          { body: 'Corner team flights: BA LHR→LCY confirmed for Jim, Tony, Ricky · Mon 9 dep 14:25 arr 15:05. Equipment van booked for fight-week move-in. Nothing further actioned by you.' },
  'Agent · James Wright':   { body: 'Apex Performance ambassador deal — £85k for camp coverage + 4 fight-week posts. Auto-renewing. Counter-offer from Crown Wagers at £92k landed last night for comparison.' },
  'Fan Mail':               { body: '4 new messages including 2 signed-glove requests for terminally-ill kids (charity team has details). Mum sent a fight-week pic — kept that one.' },
}

function InteractiveBoxingInbox({ T, accent, density }: { T: typeof THEMES.dark; accent: typeof BOXING_ACCENT; density: typeof DENSITY.regular }) {
  type RowState = { expanded: boolean; mode: 'idle' | 'replying' | 'forwarding'; reply: string; forwardTo: string; sentLabel: string | null; dismissed: boolean }
  const init = (): Record<string, RowState> => Object.fromEntries(BOXING_INBOX.map(c => [c.ch, { expanded: false, mode: 'idle' as const, reply: '', forwardTo: 'Trainer', sentLabel: null, dismissed: false }]))
  const [state, setState] = useState<Record<string, RowState>>(init)
  const update = (ch: string, patch: Partial<RowState>) => setState(s => ({ ...s, [ch]: { ...s[ch], ...patch } }))

  const items = BOXING_INBOX.filter(c => !state[c.ch]?.dismissed)
  const btnGhost: React.CSSProperties   = { fontSize: 11, padding: '5px 10px', background: 'transparent', color: '#9CA3AF', border: '1px solid #2d3139', borderRadius: 6, cursor: 'pointer', transition: 'border-color .12s, color .12s' }
  const btnPrimary: React.CSSProperties = { fontSize: 11.5, padding: '5px 12px', background: accent.hex, color: T.btnText, border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }

  return (
    <div style={{ gridColumn: '6 / span 7', position: 'relative', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad }}>
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10, gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Inbox</div>
        <div style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3, fontFamily: 'var(--font-geist-mono, monospace)' }}>{items.length} channels · click to expand</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 360, overflow: 'auto' }}>
        {items.map((c, i) => {
          const s = state[c.ch] ?? { expanded: false, mode: 'idle', reply: '', forwardTo: 'Trainer', sentLabel: null, dismissed: false }
          const body = BOXING_INBOX_BODIES[c.ch]?.body ?? c.last
          return (
            <div key={c.ch} style={{ borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <div onClick={() => update(c.ch, { expanded: !s.expanded, mode: 'idle' })}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', cursor: 'pointer' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.urgent ? T.bad : T.text4 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: T.text, fontWeight: 500 }}>{c.ch}</div>
                  <div style={{ fontSize: 11, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.last}</div>
                </div>
                <div className="tnum" style={{ fontSize: 11, color: T.text3, fontFamily: 'var(--font-geist-mono, monospace)' }}>{c.time}</div>
                <div className="tnum" style={{ minWidth: 22, height: 18, padding: '0 6px', borderRadius: 9, display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 600, background: c.urgent ? 'rgba(239,68,68,0.12)' : T.hover, color: c.urgent ? T.bad : T.text2 }}>{c.count}</div>
              </div>
              {s.expanded && (
                <div style={{ padding: '6px 6px 12px 22px' }}>
                  <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.55, padding: 10, background: T.panel2, borderRadius: 6, border: `1px solid ${T.border}` }}>
                    {body}
                  </div>
                  {s.sentLabel && <div style={{ marginTop: 6, fontSize: 11, color: T.good, fontFamily: 'var(--font-geist-mono, monospace)' }}>{s.sentLabel}</div>}
                  {s.mode === 'idle' && !s.sentLabel && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button onClick={() => update(c.ch, { mode: 'replying' })}   style={btnGhost}>Reply</button>
                      <button onClick={() => update(c.ch, { mode: 'forwarding' })} style={btnGhost}>Forward</button>
                      <button onClick={() => update(c.ch, { dismissed: true })}    style={btnGhost}>Dismiss</button>
                    </div>
                  )}
                  {s.mode === 'replying' && (
                    <div style={{ marginTop: 8 }}>
                      <textarea value={s.reply} onChange={e => update(c.ch, { reply: e.target.value })}
                        placeholder="Type your reply…" rows={3}
                        style={{ width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 12, fontFamily: V2_FONT, resize: 'vertical' }} />
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button onClick={() => update(c.ch, { mode: 'idle', reply: '', sentLabel: 'Sent ✓' })} style={btnPrimary}>Send</button>
                        <button onClick={() => update(c.ch, { mode: 'idle', reply: '' })}                       style={btnGhost}>Cancel</button>
                      </div>
                    </div>
                  )}
                  {s.mode === 'forwarding' && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: T.text3 }}>Forward to:</span>
                      <select value={s.forwardTo} onChange={e => update(c.ch, { forwardTo: e.target.value })}
                        style={{ background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 11.5, fontFamily: V2_FONT }}>
                        <option>Trainer</option>
                        <option>Manager</option>
                        <option>Physio</option>
                        <option>Agent</option>
                        <option>S&C Coach</option>
                        <option>Promoter</option>
                      </select>
                      <button onClick={() => update(c.ch, { mode: 'idle', sentLabel: `Forwarded to ${s.forwardTo} ✓` })} style={btnPrimary}>Forward</button>
                      <button onClick={() => update(c.ch, { mode: 'idle' })} style={btnGhost}>Cancel</button>
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── CAMP DASHBOARD VIEW ──────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function CampDashboardView({ fighter, session, onOpenModal }: { fighter: BoxingFighter; session: SportsDemoSession; onOpenModal?: (id: string) => void }) {
  const [dashTab, setDashTab] = useState<'gettingstarted'|'today'|'quickwins'|'dailytasks'|'insights'|'dontmiss'|'team'>(() => {
    try { const seen = typeof window !== 'undefined' ? localStorage.getItem('boxing_getting_started_seen') : null; return seen ? 'today' : 'gettingstarted' } catch { return 'gettingstarted' }
  })
  const [brandPrimary, setBrandPrimary] = useState(() => {
    try { return typeof window !== 'undefined' ? (localStorage.getItem('lumio_boxing_brand_primary') || '#1e3a8a') : '#1e3a8a' } catch { return '#1e3a8a' }
  })
  const [brandSecondary, setBrandSecondary] = useState(() => {
    try { return typeof window !== 'undefined' ? (localStorage.getItem('lumio_boxing_brand_secondary') || '#ffffff') : '#ffffff' } catch { return '#ffffff' }
  })
  const [teamSub, setTeamSub] = useState<'today'|'org'|'info'|'record'>('today')
  // Getting Started checklist state — must be at component top level, not inside conditional
  const [gsChecked, setGsChecked] = useState<Record<string, boolean>>(() => {
    try { const s = typeof window !== 'undefined' ? localStorage.getItem('boxing_getting_started') : null; return s ? JSON.parse(s) : {} } catch { return {} }
  })
  const liveProfileName = useBoxingProfileName()
  const liveProfilePhoto = useBoxingProfilePhoto()
  const isDemoShellDash = session.isDemoShell !== false
  const isPlayerRole = !session.role || session.role === 'fighter'
  // Founder mode (live) reads Supabase profile values ONLY — never the
  // lumio_boxing_* localStorage survivor keys, which are a demo-mode ergonomic.
  // A founder who previously visited the demo shell must not see demo photo /
  // name / nickname leaking into their founder view.
  const displayPlayerName = isPlayerRole
    ? (isDemoShellDash
        ? (liveProfileName || session.userName || fighter.name)
        : (session.userName || fighter.name))
    : fighter.name
  const displayPlayerNickname = isPlayerRole
    ? (isDemoShellDash
        ? ((typeof window !== 'undefined' ? localStorage.getItem('lumio_boxing_nickname') : null) || '')
        : (session.nickname?.trim() || ''))
    : `"${fighter.nickname}"`
  const displayPlayerPhoto = isPlayerRole
    ? (isDemoShellDash
        ? (liveProfilePhoto || session.photoDataUrl || '/marcus_cole.jpg')
        : (session.photoDataUrl?.trim() || null))
    : null
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

  // V2 dashboard state
  const [fightBriefOpen, setFightBriefOpen] = useState(false)
  // V2 theme tokens — shared with cricket/rugby v2 so all sport portals look the same.
  const v2T       = THEMES.dark
  const v2Accent  = BOXING_ACCENT
  const v2Density = DENSITY.regular

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
    try { const saved = typeof window !== 'undefined' ? localStorage.getItem('lumio_boxing_roundup_order_v2') : null; return saved ? JSON.parse(saved) : [] } catch { return [] }
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
    { id:'t4', time:'14:00', task:'Meridian Sports interview prep — talking points',             cat:'Media',      priority:'medium',   modal:'socialmedia' },
    { id:'t5', time:'15:00', task:'Review Stoyan southpaw footage — 2 hours',         cat:'Prep',       priority:'high',     modal:'matchprep' },
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
    { id:'sms', label:'SMS', icon:'📲', count:4, urgent:false, color:'#0EA5E9', messages:[
      { id:'sms1', from:'Jim', text:'Pads 10:30 sharp. Bring the heavy gloves — we\'re going long today.', time:'7:25am' },
      { id:'sms2', from:'Danny Walsh', text:'Titan on a call at 16:00. Keep the line clear. This is the purse call.', time:'8:18am' },
      { id:'sms3', from:'Tony', text:'Wraps ready in the gym. Ricky will be there from 10:15.', time:'8:02am' },
      { id:'sms4', from:'Travel desk', text:'Corner team flights confirmed Mon 9. Itinerary in your email.', time:'9:10am' },
    ]},
    { id:'whatsapp', label:'WhatsApp', icon:'💬', count:5, urgent:false, color:'#25D366', messages:[
      { id:'wa1', from:'Corner chat', text:'Jim: open-workout order of play — shadow 5, bag 3, pads 6. Media in at round 4.', time:'9:20am' },
      { id:'wa2', from:'Dr Sarah Mitchell', text:'Hand X-ray booked 14:30 Harley. I\'ll bring Jim\'s flagged notes.', time:'9:00am' },
      { id:'wa3', from:'Danny Walsh', text:'Print-ready tale of the tape attached — Titan needs a yes by lunch.', time:'8:40am' },
      { id:'wa4', from:'Family ❤️', text:'Mum: we\'re all coming down for fight week. Dad\'s got the flag ready 🥊', time:'7:15am' },
      { id:'wa5', from:'Sparring chat', text:'Ricky: new southpaw in tomorrow — taller than Stoyan, good feet. Good look for you.', time:'6:50am' },
    ]},
    { id:'email', label:'Email', icon:'✉️', count:6, urgent:false, color:'#6366F1', messages:[
      { id:'em1', from:'Titan Promotions', text:'Purse split revision + undercard confirmation attached. Signed copy due Friday.', time:'8:55am' },
      { id:'em2', from:'BBBofC', text:'Medical pack reminder — annual MRI and pre-fight bloods expire 1 May.', time:'8:20am' },
      { id:'em3', from:'Meridian Sports', text:'Documentary crew schedule attached. Day 1 access begins Monday 06:00.', time:'8:00am' },
      { id:'em4', from:'Accountant', text:'Purse tax allocation memo + agent fees schedule. Need your sign-off before wire.', time:'7:40am' },
      { id:'em5', from:'Canary Wharf Marriott', text:'Fight-week hotel reservation confirmed — 4 nights, corner-team suites.', time:'Yesterday' },
      { id:'em6', from:'Nutritionist', text:'Weight-cut plan for week 3 attached. Target: -0.12kg/day from Monday.', time:'Yesterday' },
    ]},
    { id:'manager', label:'Manager', icon:'💼', count:2, urgent:true, color:'#dc2626', messages:[
      { id:'m1', from:'Danny Walsh', text:'Purse split negotiation update — Titan offering 70/30. Need your call at 16:00.', time:'8:14am' },
      { id:'m2', from:'Danny Walsh', text:'Apex Performance camp deal — £85k for fight week branding. Worth taking?', time:'7:52am' },
    ]},
    { id:'promoter', label:'Promoter Desk', icon:'🏟️', count:1, urgent:true, color:'#F97316', messages:[
      { id:'p1', from:'Titan Promotions', text:'URGENT: Press conference moved to Thursday 2pm. Jack needs 20min interview slot.', time:'9:01am' },
    ]},
    { id:'sponsor', label:'Media & Sponsor', icon:'🤝', count:2, urgent:false, color:'#F59E0B', messages:[
      { id:'s1', from:'Meridian Sports', text:'Pre-fight documentary crew arriving Monday. 3 days filming access needed.', time:'8:30am' },
      { id:'s2', from:'Apex Performance', text:'Camp training video — 2 posts outstanding from March obligation.', time:'Yesterday' },
    ]},
    { id:'medical', label:'Physio & Medical', icon:'🏥', count:1, urgent:true, color:'#EC4899', messages:[
      { id:'md1', from:'Dr Sarah Mitchell', text:'URGENT: Right hand X-ray needed — knuckle swelling flagged by Jim. Book today.', time:'9:15am' },
    ]},
    { id:'weight', label:'Weight Check', icon:'⚖️', count:1, urgent:false, color:'#22C55E', messages:[
      { id:'w1', from:'Weight Tracker', text:'Morning weigh-in: 97.8kg. Target: 92.7kg. On track — daily cut target: -0.11kg.', time:'7:00am' },
    ]},
    { id:'travel', label:'Travel & Camp', icon:'✈️', count:2, urgent:false, color:'#06B6D4', messages:[
      { id:'tr1', from:'Travel desk', text:'Millennium Dome fight week hotel confirmed — Canary Wharf Marriott, 4 nights.', time:'8:00am' },
      { id:'tr2', from:'Travel desk', text:'Corner team flights booked — Jim, Tony, Ricky. BA LHR→LCY.', time:'Yesterday' },
    ]},
    { id:'fan', label:'Fan Mail', icon:'💌', count:4, urgent:false, color:'#8B5CF6', messages:[
      { id:'f1', from:'@BoxingFan92', text:'Marcus you\'re going to destroy Stoyan! The Machine! 🥊', time:'Today' },
      { id:'f2', from:'@HeavyweightWatch', text:'Can you sign a glove for my son? He\'s your biggest fan.', time:'Yesterday' },
    ]},
  ]

  return (
    <div className="space-y-6">

      {/* ── V2 HERO — fight camp focus, matches cricket/rugby v2 sizing ── */}
      <style jsx global>{`
        .tnum { font-variant-numeric: tabular-nums; }
      `}</style>
      <div style={{ background: v2T.bg, color: v2T.text, fontFamily: V2_FONT, padding: v2Density.gap, borderRadius: 12, marginBottom: v2Density.gap }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: v2Density.gap }}>
          <BoxingHeroToday
            T={v2T} accent={v2Accent} density={v2Density}
            greeting={`${greeting}, ${firstName}`}
            quote={getDailyQuote(BOXING_QUOTES)}
            onFightPrep={() => setFightBriefOpen(true)}
            onAsk={() => onOpenModal?.('sendmessage')}
          />
          <BoxingTodaySchedule T={v2T} accent={v2Accent} density={v2Density} />
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

      {/* Quick Actions — desaturated rectangular (matches rugby v2) */}
      {dashTab === 'today' && <div className="mb-5 mt-4">
        <div className="text-xs font-bold uppercase tracking-wider mb-2.5 px-1" style={{ color: '#4B5563' }}>Quick actions</div>
        <div className="flex flex-wrap gap-2">
          {[
            { id:'sendmessage', label:'Send Message', icon:'📨', hot:false },
            { id:'flights', label:'Smart Flights', icon:'✈️', hot:true },
            { id:'hotel', label:'Find Hotel', icon:'🏨', hot:true },
            { id:'weight', label:'Weight Tracker', icon:'⚖️', hot:false },
            { id:'sparring', label:'Sparring Log', icon:'🥊', hot:false },
            { id:'ranking', label:'Ranking Sim', icon:'📊', hot:true },
            { id:'sponsor', label:'Sponsor Post', icon:'📱', hot:true },
            { id:'opponent', label:'Opponent Study', icon:'🔍', hot:true },
            { id:'injury', label:'Medical Log', icon:'🏥', hot:false },
            { id:'mental', label:'Mental Prep', icon:'🧘', hot:true },
            { id:'expense', label:'Add Expense', icon:'💰', hot:false },
            { id:'visa', label:'Visa Check', icon:'🌍', hot:true },
            { id:'socialmedia', label:'Social Media AI', icon:'📲', hot:true },
            { id:'weightcut', label:'Weight Cut AI', icon:'⚖️', hot:true },
            { id:'opponentscout', label:'Opponent Scout', icon:'🥊', hot:true },
            { id:'vadacheck', label:'VADA/UKAD Check', icon:'💊', hot:true },
            { id:'pursebreakdown', label:'Purse Breakdown', icon:'📋', hot:false },
            { id:'rankingstracker', label:'Rankings Tracker', icon:'🏆', hot:true },
            { id:'campcontent', label:'Camp Content AI', icon:'🎬', hot:true },
          ].map(a => (
            <button key={a.id} onClick={() => onOpenModal?.(a.id)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2d3139'; e.currentTarget.style.color = '#9CA3AF' }}
              style={{
                appearance: 'none', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 8,
                background: 'transparent', border: '1px solid #2d3139',
                color: '#9CA3AF', fontSize: 12, cursor: 'pointer',
                transition: 'border-color .12s, color .12s',
                position: 'relative', whiteSpace: 'nowrap',
              }}>
              <span>{a.icon}</span>{a.label}
              {a.hot && <span style={{ position: 'absolute', top: -6, right: -6, fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 999, background: '#1F2937', color: '#9CA3AF', border: '1px solid #374151', lineHeight: 1 }}>AI</span>}
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
                    {step.preview === 'dashboard' && (<><h2 className="text-xl font-black text-white mb-2">Your boxing OS, fully connected.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>One portal replaces the 6 tools you probably use right now. Rankings, fight camp, weight tracking, sponsors, travel, your team — all connected.</p><div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}><div className="text-xs text-gray-400 mb-3">Your dashboard — live right now</div><div className="grid grid-cols-4 gap-2">{[{ icon:'🥊', v:`#${fighter.rankings.wbc}`, label:'WBC', c:'#dc2626' },{ icon:'🏆', v:`${fighter.record.wins}-${fighter.record.losses}`, label:'Record', c:'#F97316' },{ icon:'⚖️', v:`${fighter.current_weight}kg`, label:'Weight', c:'#F59E0B' },{ icon:'📅', v:`${fighter.next_fight.days_away}d`, label:'Fight', c:'#22C55E' }].map((s, i) => (<div key={i} className="rounded-lg p-2 text-center" style={{ backgroundColor: '#0a0c14' }}><div className="text-lg">{s.icon}</div><div className="text-xs font-black mt-0.5" style={{ color: s.c }}>{s.v}</div><div className="text-[9px] mt-0.5" style={{ color: '#4B5563' }}>{s.label}</div></div>))}</div><div className="mt-3 grid grid-cols-2 gap-2 text-[10px]"><div className="rounded-lg p-2" style={{ backgroundColor: '#0a0c14' }}><span className="text-gray-500">Next fight:</span> <span className="text-white font-semibold">vs {fighter.next_fight.opponent} — {fighter.next_fight.venue}</span></div><div className="rounded-lg p-2" style={{ backgroundColor: '#0a0c14' }}><span className="text-gray-500">Camp day:</span> <span className="text-white font-semibold">Day {fighter.camp_day}/70 — On track</span></div></div></div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}><span style={{ color: '#dc2626' }}>🥊</span> <span style={{ color: '#9CA3AF' }}>Used by professional fighters to manage everything from training camp to fight night.</span></div>{/* Brand Colours — only in step 1 detail */}<div className="mt-4 space-y-3"><div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>Brand Colours</div><p className="text-xs" style={{ color: '#6B7280' }}>Use your club or personal brand colours. Primary fills buttons and accents, secondary is your text colour.</p><div className="flex items-center gap-4"><div><label className="text-xs block mb-1" style={{ color: '#9CA3AF' }}>Primary</label><input type="color" value={brandPrimary} onChange={e => { setBrandPrimary(e.target.value); localStorage.setItem('lumio_boxing_brand_primary', e.target.value); window.dispatchEvent(new Event('lumio-profile-updated')) }} className="w-12 h-8 rounded cursor-pointer" style={{ border: '1px solid #374151' }} /></div><div><label className="text-xs block mb-1" style={{ color: '#9CA3AF' }}>Secondary</label><input type="color" value={brandSecondary} onChange={e => { setBrandSecondary(e.target.value); localStorage.setItem('lumio_boxing_brand_secondary', e.target.value); window.dispatchEvent(new Event('lumio-profile-updated')) }} className="w-12 h-8 rounded cursor-pointer" style={{ border: '1px solid #374151' }} /></div><div className="flex-1"><label className="text-xs block mb-1" style={{ color: '#9CA3AF' }}>Preview</label><div className="flex items-center gap-2"><div className="rounded-lg px-4 py-1.5 text-xs font-semibold" style={{ backgroundColor: brandPrimary, color: brandSecondary }}>Button preview</div><div className="rounded-lg px-4 py-1.5 text-xs font-semibold" style={{ backgroundColor: `${brandPrimary}26`, color: brandPrimary, border: `1px solid ${brandPrimary}4d` }}>Outline preview</div></div></div></div></div></>)}
                    {step.preview === 'briefing' && (<><h2 className="text-xl font-black text-white mb-2">Start every fight week knowing everything.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Your AI morning briefing covers weight status, camp progress, opponent intel, sponsor deadlines and travel — all in 60 seconds.</p><div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid rgba(220,38,38,0.2)' }}><div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid #1F2937', background: 'rgba(220,38,38,0.06)' }}><span>✨</span><span className="text-sm font-semibold text-white">{aiSummaryLabel}</span><span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(220,38,38,0.12)', color: '#dc2626' }}>Today</span></div><div className="p-4 space-y-2.5" style={{ backgroundColor: '#0a0c14' }}>{[{ icon:'⚖️', text:`Weight on track — ${fighter.current_weight}kg → ${fighter.target_weight}kg target. Cut projection: 3 days before weigh-in.` },{ icon:'🥊', text:'Stoyan scouting report ready — body shot breakdown and late-round fade analysis.' },{ icon:'🤝', text:'Apex Performance camp shoot tomorrow 10:00 — penalty clause. Kit prepped.' },{ icon:'📬', text:'Meridian Sports promotion confirmed. Danny Walsh purse split: 70/30 Titan offer.' }].map((item, i) => (<div key={i} className="flex gap-2.5 text-[11px]"><span className="flex-shrink-0">{item.icon}</span><span style={{ color: '#D1D5DB' }}>{item.text}</span></div>))}</div></div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}><span>🔊</span> <span style={{ color: '#9CA3AF' }}>Press the speaker button every morning. Sarah reads it while you warm up.</span></div></>)}
                    {step.preview === 'actions' && (<><h2 className="text-xl font-black text-white mb-2">Every action, one click away.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>14 quick actions — log a sparring session, track weight, file a physio report, generate a sponsor post, check your visa. All in under 60 seconds.</p><div className="flex flex-wrap gap-2 mb-4">{[{ label:'Smart Flights', icon:'✈️', hot:true },{ label:'Find Hotel', icon:'🏨', hot:true },{ label:'Fight Prep AI', icon:'🥊', hot:true },{ label:'Weight Tracker', icon:'⚖️', hot:false },{ label:'Sparring Log', icon:'📋', hot:false },{ label:'Opponent Study', icon:'🔍', hot:true }].map((a, i) => (<span key={i} className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold" style={{ backgroundColor: a.hot ? 'rgba(220,38,38,0.12)' : 'transparent', border: a.hot ? '1px solid rgba(220,38,38,0.32)' : '1px solid #1F2937', color: a.hot ? '#dc2626' : '#9CA3AF' }}><span>{a.icon}</span>{a.label}{a.hot && <span className="absolute -top-1 -right-1 text-[8px] px-1 py-0.5 rounded-full font-black leading-none" style={{ backgroundColor: '#1F2937', color: '#9CA3AF', border: '1px solid #374151' }}>AI</span>}</span>))}</div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)' }}><span>🥊</span> <span style={{ color: '#0ea5e9' }}>Fight Prep AI generates a full opponent breakdown — punch stats, weaknesses, game plan — in 8 seconds.</span></div></>)}
                    {step.preview === 'travel' && (<><h2 className="text-xl font-black text-white mb-2">Fight travel sorted in 60 seconds.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Smart Flights finds the cheapest flights to every fight venue. Smart Hotel finds gyms and hotels near the arena. Pre-filled with your home airport and weight class preferences.</p><div className="space-y-2 mb-4"><div className="rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid rgba(14,165,233,0.3)' }}><div className="flex items-center justify-between mb-1"><span className="text-xs font-bold text-white">Virgin Atlantic · VS 3</span><span className="text-xs font-black" style={{ color: '#22C55E' }}>£387 return</span></div><div className="text-[10px] text-gray-400">London LHR → New York JFK · 7h 20m · Direct</div><div className="mt-1"><span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(14,165,233,0.15)', color: '#0ea5e9' }}>BEST VALUE</span></div></div><div className="rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}><div className="flex items-center justify-between mb-1"><span className="text-xs font-bold text-white">🏨 Manhattan Marriott</span><span className="text-xs font-bold" style={{ color: '#F59E0B' }}>£142/night</span></div><div className="text-[10px] text-gray-400">0.8km from Madison Square Garden · Gym ✅ · 8.6 rating</div></div></div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}><span style={{ color: '#F59E0B' }}>💰</span> <span style={{ color: '#F59E0B' }}>Fighters using Smart Flights save an average of £520 per fight on travel vs booking through a promoter.</span></div></>)}
                    {step.preview === 'weight' && (<><h2 className="text-xl font-black text-white mb-2">Weight camp managed to the gram.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Daily weight logs, cut timeline, ACWR load monitoring, rehydration plan — all tracked automatically. Get alerted if you&apos;re behind schedule before it becomes a crisis.</p><div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#0a0c14', border: '1px solid rgba(220,38,38,0.3)' }}><div className="flex items-center justify-between mb-3"><span className="text-xs font-bold text-white">Weight Camp Tracker</span><span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>ON TRACK ✅</span></div><div className="grid grid-cols-3 gap-2 text-center mb-3">{[{ label:'Camp Day', v:`${fighter.camp_day}/70`, c:'#dc2626' },{ label:'Current', v:`${fighter.current_weight}kg`, c:'#F97316' },{ label:'Target', v:`${fighter.target_weight}kg`, c:'#22C55E' }].map((s,i) => (<div key={i} className="rounded-lg p-2" style={{ backgroundColor: '#111318' }}><div className="text-[10px] text-gray-500">{s.label}</div><div className="text-sm font-black" style={{ color: s.c }}>{s.v}</div></div>))}</div><div className="space-y-1 text-[10px]"><div className="flex justify-between text-gray-400"><span>Cut prediction:</span><span className="text-white font-semibold">3 days before weigh-in</span></div><div className="flex justify-between text-gray-400"><span>ACWR:</span><span className="text-green-400 font-semibold">1.12 (optimal zone)</span></div></div></div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}><span style={{ color: '#dc2626' }}>⚖️</span> <span style={{ color: '#dc2626' }}>Missing weight costs purse deductions and can cancel fights. Lumio flags weight risk 14 days out.</span></div></>)}
                    {step.preview === 'team' && (<><h2 className="text-xl font-black text-white mb-2">Your team. Everyone sees their own view.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Your whole team connected — but each role gets their own tailored view. Your trainer, physio, sponsor and manager see only what&apos;s relevant to them. You control what each role can see.</p><div className="space-y-2 mb-4">{[{ name:fighter.trainer || 'Jim Bevan', role:'Trainer', status:'Sparring review at 16:00', color:'#dc2626' },{ name:fighter.manager || 'Danny Walsh', role:'Manager', status:'Meridian Sports contract confirmed', color:'#F97316' },{ name:fighter.physio || 'Dr Amir Patel', role:'Physio', status:'Shoulder check tomorrow', color:'#F59E0B' },{ name:'James Wright', role:'Agent', status:'Apex Performance deal — £85k', color:'#0ea5e9' }].map((m, i) => (<div key={i} className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}><div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: `${m.color}20`, color: m.color }}>{m.name.split(' ').map(w => w[0]).join('')}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-xs font-bold text-white">{m.name}</span><span className="text-[9px]" style={{ color: m.color }}>{m.role}</span></div><div className="text-[10px] text-gray-500">{m.status}</div></div><div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" /></div>))}</div><div className="mt-4 mb-3"><div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Everyone gets their own view</div><p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>Your trainer sees training & tactical data. Your physio sees medical & recovery only. Your sponsor sees brand activation & ROI. Your manager sees contracts & commercials. You stay in control — switch role any time from the bottom of the sidebar.</p><div className="grid grid-cols-2 gap-2">{[{ icon:'🥊', role:'Fighter view', desc:'Full access — everything', color:'#dc2626' },{ icon:'📋', role:'Trainer view', desc:'Training, tactics, performance', color:'#22C55E' },{ icon:'⚕️', role:'Medical / Physio', desc:'Injury log, load, recovery only', color:'#EF4444' },{ icon:'🤝', role:'Sponsor / Partner', desc:'Brand visibility, obligations, ROI', color:'#F59E0B' },{ icon:'💼', role:'Manager / Promoter', desc:'Contracts, commercials, schedule', color:'#0ea5e9' }].map((v, i) => (<div key={i} className="flex items-center gap-2 rounded-lg p-2.5" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}><span className="text-base flex-shrink-0">{v.icon}</span><div className="min-w-0"><div className="text-xs font-bold text-white truncate">{v.role}</div><div className="text-[10px] truncate" style={{ color: v.color }}>{v.desc}</div></div></div>))}</div></div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}><span>📨</span> <span style={{ color: '#9CA3AF' }}>Your manager gets auto-briefed every Monday. Promoter updates go out after each camp milestone.</span></div></>)}
                    {step.preview === 'ai' && (<><h2 className="text-xl font-black text-white mb-2">AI that analyses your opponent so you don&apos;t have to.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Opponent Study AI breaks down punch stats, jab frequency, weakness on the body, late-round fade. Fight Prep AI builds your game plan.</p><div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#0a0c14', border: '1px solid rgba(139,92,246,0.3)' }}><div className="flex items-center gap-2 mb-2"><span>🤖</span><span className="text-xs font-bold" style={{ color: '#A78BFA' }}>Opponent Study AI — {fighter.next_fight.opponent}</span></div><div className="space-y-2 text-[11px]" style={{ color: '#D1D5DB' }}><p>{fighter.next_fight.opponent} (WBC #3): Jab output 42/round — highest in the division. Body shots: 23% of total punches.</p><p>Right hand on the counter is his KO weapon. He fades rounds 8-10 — output drops 34%.</p><p>Strategy: work body early, avoid the right counter, look for late stoppage rounds 9-10.</p></div><div className="text-[9px] mt-3" style={{ color: '#6B7280' }}>Generated using live fight record data · Claude AI</div></div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}><span style={{ color: '#A78BFA' }}>🤖</span> <span style={{ color: '#A78BFA' }}>Powered by Claude AI · Anthropic · The same AI trusted by Fortune 500 companies.</span></div></>)}
                    {step.preview === 'sponsor' && (<><h2 className="text-xl font-black text-white mb-2">Never miss a sponsor obligation again.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Content shoots, social posts, appearance fees, contract renewals — all tracked. Social Media AI writes the post, you approve it, one click posts it.</p><div className="space-y-2 mb-4">{[{ name:'Apex Performance', status:'Kit shoot Tuesday 10:00', badge:'DUE NOW', badgeColor:'#EF4444', value:'£85k/yr' },{ name:'Meridian Sports', status:'Post-fight interview confirmed', badge:'CONFIRMED', badgeColor:'#22C55E', value:'PPV deal' },{ name:'Crown Wagers', status:'Ambassador inquiry — respond by Apr 25', badge:'NEW DEAL', badgeColor:'#22C55E', value:'£85k/yr' }].map((s, i) => (<div key={i} className="flex items-center justify-between rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-xs font-bold text-white">{s.name}</span><span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${s.badgeColor}20`, color: s.badgeColor }}>{s.badge}</span></div><div className="text-[10px] text-gray-500 mt-0.5">{s.status}</div></div><span className="text-xs font-bold" style={{ color: '#F59E0B' }}>{s.value}</span></div>))}</div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}><span>📱</span> <span style={{ color: '#9CA3AF' }}>Sponsor Post AI generates the caption in your voice. Takes 8 seconds.</span></div></>)}
                    {step.preview === 'dontmiss' && (<><h2 className="text-xl font-black text-white mb-2">Nothing falls through the cracks.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Don&apos;t Miss catches everything urgent — purse deadlines, visa expiry, medical licence renewal, sanctioning body requirements, weight check alerts.</p><div className="space-y-2 mb-4">{[{ badge:'IN 48 DAYS', bg:'rgba(220,38,38,0.15)', color:'#EF4444', text:`Fight vs ${fighter.next_fight.opponent} — ${fighter.next_fight.venue}. Meridian Sports PPV.`, sub:`Miss = lose £340k purse + WBC ranking` },{ badge:'34 DAYS', bg:'rgba(245,158,11,0.15)', color:'#F59E0B', text:'Medical licence expires. Renewal takes 10 working days.', sub:'Fight cannot proceed without valid BBBofC licence' },{ badge:'THIS WK', bg:'rgba(245,158,11,0.15)', color:'#F59E0B', text:'Apex Performance camp shoot — penalty clause applies.', sub:'Content obligation breach risk' }].map((d, i) => (<div key={i} className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: '#0a0c14' }}><span className="text-[9px] px-2 py-1 rounded font-black flex-shrink-0 mt-0.5" style={{ background: d.bg, color: d.color }}>{d.badge}</span><div><div className="text-[11px] text-white">{d.text}</div><div className="text-[10px] italic mt-0.5" style={{ color: '#EF4444' }}>{d.sub}</div></div></div>))}</div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}><span>⚕️</span> <span style={{ color: '#9CA3AF' }}>Medical licence expires in 34 days. Renewal takes 10 working days — Lumio flagged this 60 days out.</span></div></>)}
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

      {/* TODAY — v2 dashboard grid (FightCampStatus, StatTiles, AIBrief +
          interactive Inbox, Recents + PhotoFrame, MyTeam, Perf signals) */}
      {dashTab === 'today' && (session.isDemoShell === false
        ? <div className="space-y-3"><EmptyState icon="📬" title="No messages yet" sub="Connect your manager, promoter and camp to unlock" /></div>
        : (
        <div style={{ background: v2T.bg, color: v2T.text, fontFamily: V2_FONT, padding: v2Density.gap, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: v2Density.gap }}>
          {/* Row 1 — Fight Camp Status (VS card) + corner team list */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: v2Density.gap }}>
            <BoxingFightCampStatus T={v2T} accent={v2Accent} density={v2Density} column="1 / span 8" />
            <BoxingMyTeam          T={v2T} accent={v2Accent} density={v2Density} column="9 / span 4" />
          </div>
          {/* Row 2 — Stat tiles */}
          <BoxingStatTiles T={v2T} accent={v2Accent} density={v2Density} />
          {/* Row 3 — AI brief + interactive inbox */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: v2Density.gap }}>
            <BoxingAIBrief
              T={v2T} accent={v2Accent} density={v2Density}
              label={aiSummaryLabel}
              onAsk={() => onOpenModal?.('sendmessage')}
              column="1 / span 5"
            />
            <InteractiveBoxingInbox T={v2T} accent={v2Accent} density={v2Density} />
          </div>
          {/* Row 4 — Recent fights + Personal photo frame */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: v2Density.gap }}>
            <BoxingRecents    T={v2T} accent={v2Accent} density={v2Density} column="1 / span 7" />
            <BoxingPhotoFrame T={v2T} accent={v2Accent} density={v2Density} column="8 / span 5" />
          </div>
          {/* Row 5 — Performance signals (full width) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: v2Density.gap }}>
            <BoxingPerf T={v2T} accent={v2Accent} density={v2Density} column="1 / span 12" />
          </div>
        </div>
      ))}


      {/* QUICK WINS */}
      {dashTab === 'quickwins' && (session.isDemoShell === false
        ? <EmptyState icon="⚡" title="No quick wins yet" sub="Connect your data to unlock personalised quick wins" />
        : <div className="pt-4 space-y-3">
          {[
            { p:1, title:'Log today\'s weight — behind daily target by 0.08kg',            impact:'Critical', cat:'Weight',     icon:'⚖️', cta:'Log weight', effort:'2min', description:'Camp requirement — daily weight tracking keeps cut on schedule.' },
            { p:2, title:'Meridian Sports pre-fight interview — confirm attendance',                   impact:'Critical', cat:'Media',      icon:'📺', cta:'Confirm', effort:'2min', description:'Press tour begins today. Contractual obligation — confirm now.' },
            { p:3, title:'Sparring session vs southpaw booked — 10:00',                     impact:'High',     cat:'Camp',       icon:'🥊', cta:'Log sparring', effort:'5min', description:'Southpaw rounds to prepare for Stoyan\'s stance. Jim Bevan supervising.' },
            { p:4, title:'Stoyan\'s last 3 fights uploaded — review footage',                impact:'High',     cat:'Prep',       icon:'🎬', cta:'Open scout', effort:'15min', description:'3 recent fights available — study patterns and defensive tendencies.' },
            { p:5, title:'Titan contract addendum — sign by Friday',                     impact:'High',     cat:'Commercial', icon:'📋', cta:'Review', effort:'5min', description:'Addendum to existing deal — Danny Walsh flagged urgency.' },
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
      {dashTab === 'dailytasks' && (session.isDemoShell === false
        ? <EmptyState icon="✅" title="No tasks for today" sub="Add your first task to unlock this" />
        : <div className="pt-4 space-y-3">
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
      {dashTab === 'insights' && (session.isDemoShell === false
        ? <EmptyState icon="📊" title="No insights yet" sub="Connect your data to unlock performance insights" />
        : <div className="pt-4 space-y-6">
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
              { type:'OPPORTUNITY', icon:'💡', color:'#F59E0B', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)', title:'Apex Performance camp extension offer', desc:'New approach via Danny Walsh — £85k for fight week branding and post-fight content. No competing sponsor in the pipeline. Decision needed by end of week.', action:'Open sponsor brief →', modal:'sponsor' },
              { type:'TREND',       icon:'📈', color:'#22C55E', bg:'rgba(34,197,94,0.08)',  border:'rgba(34,197,94,0.2)',  title:'Sparring power output up 8%', desc:'Last 5 sessions vs season avg. Right hand velocity and body shot compression both trending up. Jim Bevan flagged this in camp notes — keep the current pad routine.', action:'View training log →', modal:'matchprep' },
              { type:'ACHIEVEMENT', icon:'🏆', color:'#8B5CF6', bg:'rgba(139,92,246,0.08)', border:'rgba(139,92,246,0.2)', title:`Record now ${fighter.record.wins}-${fighter.record.losses} (${fighter.record.ko} KOs)`, desc:'Last fight: 12-round points win. Promoter Titan locking in Millennium Dome headline slot. First top-10 WBC fight — media interest is high.', action:'View fight record →', modal:'matchprep' },
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
                { label:'Sponsor obligations', value:'2 due',            trend:'UA + Meridian Sports',                                     trendColor:'#EC4899' },
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
      {dashTab === 'dontmiss' && (session.isDemoShell === false
        ? <EmptyState icon="🔴" title="Nothing to flag" sub="Alerts will appear here once your data is connected" />
        : <div className="pt-4 space-y-3">
          {[
            { urgency:'CRITICAL', item:'Weight cut — 5.1kg to target in 48 days. If missed: dangerous rapid cut fight week.', action:'Log weight →', color:'#dc2626' },
            { urgency:'CRITICAL', item:'Right hand X-ray — Jim flagged knuckle swelling. If missed: risk fighting injured.', action:'Book appointment →', color:'#EF4444' },
            { urgency:'TODAY',    item:'Meridian Sports interview — press tour begins today. If missed: contractual breach.', action:'Prep talking points →', color:'#F59E0B' },
            { urgency:'THIS WEEK',item:'Titan contract addendum signature. If missed: fight postponed.', action:'Review contract →', color:'#F59E0B' },
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
      {dashTab === 'team' && (session.isDemoShell === false
        ? <EmptyState icon="👥" title="No team members yet" sub="Add your trainer, manager, promoter and camp to unlock this" />
        : (() => {
        const demoStaffPhotos: Record<string, string> = {
          'Jim Bevan': '/Carlos_Mendez.jpg',
          'Danny Walsh': '/Marcus_Webb.jpg',
          'Dr Sarah Mitchell': '/Sarah_Lee.jpg',
          'Ricky Dunn': '/James_Okafor.jpg',
          'Tony Malone': '/Rick_Dalton.jpg',
          'Meridian Sports': '/Elena_Russo.jpg',
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
                { name:'Meridian Sports',            role:'Broadcast',       status:'Interview 14:00 — press tour',     available:true,  initials:'DZ', color:'#F97316' },
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
                {[{name:'Danny Walsh',role:'Manager'},{name:'Titan',role:'Promoter'}].map((p,i)=>(<div key={i} className="text-center"><div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold" style={{background:'rgba(220,38,38,0.2)',border:'1px solid rgba(220,38,38,0.4)',color:'#dc2626'}}>{p.name.split(' ').map(w=>w[0]).join('')}</div><div className="text-xs text-white">{p.name}</div><div className="text-[10px]" style={{color:'#6B7280'}}>{p.role}</div></div>))}
              </div>
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-lg font-bold overflow-hidden"
                style={{background:'rgba(220,38,38,0.2)',border:'2px solid #dc2626',color:'#dc2626'}}>
                {displayPlayerPhoto ? <img src={displayPlayerPhoto} alt="" className="w-full h-full object-cover" /> : 'MC'}
              </div>
              <div className="text-lg font-black text-white">{displayPlayerName}</div>
              {fighter.nickname && <div className="text-[10px] text-gray-500 italic">&quot;{fighter.nickname}&quot;</div>}
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
                  { initials:'DZ', name:'Meridian Sports', role:'Broadcast', dept:'Media', rating:88, deptColor:'#F97316', ref:'LUM-006', stats:{REA:90,PRO:88,NET:92,EXP:87,COM:89,COV:91}, speciality:'Live broadcast', location:'London', available:true },
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
                {l:'Professional Record',v:'22-1 (18 KOs)'},{l:'WBC Ranking',v:`#${fighter.rankings.wbc}`},{l:'WBA Ranking',v:`#${fighter.rankings.wba}`},{l:'WBO Ranking',v:`#${fighter.rankings.wbo}`},{l:'IBF Ranking',v:`#${fighter.rankings.ibf}`},{l:'Weight Class',v:'Heavyweight (max 200lb / 90.7kg)'},{l:'Promoter',v:'Titan Promotions'},{l:'Broadcast',v:'Meridian Sports'},{l:'Trainer',v:'Jim Bevan (since 2021)'},{l:'Pro debut',v:'March 2018'},{l:'Last fight',v:'W — points — 12 rounds'},
              ].map((r,i)=>(<div key={i} className="flex items-center justify-between py-2 text-xs" style={{borderBottom:i<10?'1px solid #1F2937':'none'}}><span style={{color:'#6B7280'}}>{r.l}</span><span className="font-bold text-white">{r.v}</span></div>))}
            </div>
          )}
        </div>
        )
      })())}

      {/* V2 fight brief slide-over — opened from the hero "Fight prep" button */}
      <BoxingFightBriefPanel T={v2T} accent={v2Accent} open={fightBriefOpen} onClose={() => setFightBriefOpen(false)} />
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
            <div className="text-sm text-gray-300">Marcus is moving well and his timing on the counter shots is sharp. We need to drill more clinch exits — Stoyan will try to smother him inside. Left hook to the body is landing clean in sparring. Keep pushing the pace work in rounds 7-10 this coming week.</div>
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
    { name: 'Darnell "Tank" Hughes', weight: '96.2kg', stance: 'Southpaw', style: 'Pressure fighter', record: '14-2 (10 KO)', available: true, rate: '£400/day', notes: 'Best Stoyan mimic — similar jab, walks forward' },
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
            <div className="text-xs text-gray-400">Darnell caught Marcus with a straight left in round 5 — same angle Stoyan uses. Marcus recovered well and adjusted guard. Good body work in rounds 6-8. Need to keep hands higher when circling left.</div>
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
    { date: '2024-09-14', opponent: 'Yoel Bermudez', record: '24-1', result: 'L', method: 'UD', venue: 'New York, USA' },
    { date: '2024-05-11', opponent: 'Otto Wallin', record: '26-3', result: 'W', method: 'TKO R7', venue: 'Stockholm, Sweden' },
  ];

  const tacticalNotes = [
    { title: 'Ring Generalship', content: 'Stoyan wants to control centre ring. He walks forward constantly and tries to bully opponents to the ropes. Strategy: Use lateral movement and angles. Don\'t let him pin you.' },
    { title: 'Counter Opportunities', content: 'When Stoyan loads up his right hand, he drops his left shoulder and plants his feet. This is a 0.3-second window for a counter left hook or pull counter right hand.' },
    { title: 'Body Attack Strategy', content: 'Stoyan has shown vulnerability to body shots. Only 2 of his 30 fights have gone past round 10 — and he lost one of them on points. Systematic body work from round 1 will pay dividends in the championship rounds.' },
    { title: 'Clinch Management', content: 'Expect Stoyan to clinch aggressively when hurt or tired. He uses his head position inside. Work the uppercut on entry, and be first to establish head position. Referee: expected to be Marcus McDonnell — tends to break quickly.' },
  ];

  return (
    <div className="space-y-6">
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
            <div className="text-gray-500">Promoter</div><div className="text-white font-medium">Crown Promotions</div>
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
// ─── PHYSIO & RECOVERY (SUMMARY) ──────────────────────────────────────────────
// Tennis-parity summary view. Sits alongside Recovery & HRV + Medical Record
// as a single landing page that surfaces the top-line health data and links
// through to the deep-dive tools.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const BOXING_CAMP_LOAD = [
  { week: 'Jan W1', rounds: 32, hours: 12 },
  { week: 'Jan W2', rounds: 44, hours: 15 },
  { week: 'Jan W3', rounds: 48, hours: 16 },
  { week: 'Feb W1', rounds: 36, hours: 13 },
  { week: 'Feb W2', rounds: 52, hours: 17 },
  { week: 'Feb W3', rounds: 56, hours: 18 },
  { week: 'Mar W1', rounds: 42, hours: 14 },
  { week: 'Mar W2', rounds: 58, hours: 18 },
  { week: 'Mar W3', rounds: 60, hours: 19 },
  { week: 'Mar W4', rounds: 46, hours: 15 },
  { week: 'Apr W1', rounds: 54, hours: 17 },
  { week: 'Apr W2', rounds: 58, hours: 18 },
  { week: 'Apr W3', rounds: 38, hours: 13 },
];

function BoxingRecoveryChartInline() {
  const data = [68, 74, 72, 80, 76, 82, 78];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const w = 360, h = 150, padX = 35, padY = 15, padBottom = 25;
  const chartW = w - padX * 2, chartH = h - padY - padBottom;
  const xStep = chartW / (data.length - 1);
  const minV = 50, maxV = 100;
  const points = data.map((v, i) => ({
    x: padX + i * xStep,
    y: padY + chartH - ((v - minV) / (maxV - minV)) * chartH,
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = linePath + ` L${points[points.length - 1].x},${padY + chartH} L${points[0].x},${padY + chartH} Z`;
  return (
    <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
      <div className="text-sm font-semibold text-white mb-4">Lumio Wear Recovery (7-Day Trend)</div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <linearGradient id="boxingRecovGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#boxingRecovGrad)" />
        <path d={linePath} fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#14b8a6" stroke="#07080F" strokeWidth="1.5" />
        ))}
        {days.map((d, i) => (
          <text key={i} x={padX + i * xStep} y={h - 5} fill="#6b7280" fontSize="9" textAnchor="middle">{d}</text>
        ))}
      </svg>
    </div>
  );
}

function BoxingPhysioRecoveryView({ fighter, session, onNavigate }: { fighter: BoxingFighter; session: SportsDemoSession; onNavigate: (id: string) => void }) {
  const isDemoShellBoxing = session.isDemoShell !== false;
  const totalRounds90d = BOXING_CAMP_LOAD.reduce((a,w)=>a+w.rounds,0);
  const totalHours90d = BOXING_CAMP_LOAD.reduce((a,w)=>a+w.hours,0);
  const maxRoundsInWeek = Math.max(...BOXING_CAMP_LOAD.map(w=>w.rounds));
  const campOverload = maxRoundsInWeek > 55;

  const recovery = [
    { date: 'Today',       score: 74, hrv: 58, rhr: 54, sleep: 6.9 },
    { date: 'Yesterday',   score: 68, hrv: 52, rhr: 57, sleep: 6.2 },
    { date: '2 days ago',  score: 82, hrv: 68, rhr: 50, sleep: 7.8 },
    { date: '3 days ago',  score: 71, hrv: 56, rhr: 55, sleep: 6.5 },
    { date: '4 days ago',  score: 78, hrv: 64, rhr: 52, sleep: 7.3 },
  ];

  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const SEVERITY_CONFIG = {
    critical:   { fill: '#dc2626', r: 12, label: 'Critical',   textClass: 'text-red-400' },
    moderate:   { fill: '#f59e0b', r: 9,  label: 'Moderate',   textClass: 'text-amber-400' },
    minor:      { fill: '#eab308', r: 7,  label: 'Minor',      textClass: 'text-yellow-400' },
    monitoring: { fill: '#10b981', r: 5,  label: 'Monitoring', textClass: 'text-green-400' },
  } as const;
  type Severity = keyof typeof SEVERITY_CONFIG;
  const bodyMarkers: { id: string; x: number; y: number; severity: Severity; label: string; note: string }[] = [
    { id: 'rshoulder', x: 132, y: 66,  severity: 'moderate',   label: 'Right shoulder', note: 'Rotator cuff load from heavy bag work — strapping + ice post-session' },
    { id: 'rknuckles', x: 152, y: 148, severity: 'minor',      label: 'Right knuckles', note: 'Boxer\'s knuckle mild inflammation — extra wrap padding on sparring days' },
    { id: 'lwrist',    x: 48,  y: 150, severity: 'monitoring', label: 'Left wrist',     note: 'No active issue — mobility work maintained' },
    { id: 'ribs',      x: 110, y: 115, severity: 'minor',      label: 'Lower ribs',     note: 'Sparring contact bruising — taping, no restrictions' },
    { id: 'neck',      x: 100, y: 45,  severity: 'monitoring', label: 'Neck',           note: 'Daily isometric holds — whiplash prevention' },
  ];
  const selectedMarker = bodyMarkers.find(m => m.id === selectedBodyPart) ?? null;

  return (
    <div className="space-y-6">
      <SectionHeader icon="⚕️" title="Physio & Recovery" subtitle="Camp load, clearance, injury map, and treatment log — the one-page health summary." />

      {/* Section 2 — 4 StatCards (inline tile style to match boxing) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Recovery Score', value: '74/100', sub: 'Today (Lumio Wear)',          accent: '#14b8a6' },
          { label: 'HRV',            value: '58ms',   sub: '+6ms vs yesterday',       accent: '#0ea5e9' },
          { label: 'Resting HR',     value: '54 bpm', sub: 'Camp-day elevated',       accent: '#6366f1' },
          { label: 'Sleep',          value: '6.9 hrs', sub: 'Below 7.5 target',       accent: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="text-xs uppercase tracking-wide" style={{ color: '#6B7280' }}>{s.label}</div>
            <div className="text-xl font-black mt-1" style={{ color: s.accent }}>{s.value}</div>
            <div className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-end -mt-2">
        <button onClick={() => onNavigate('recovery')} className="text-[11px] text-cyan-400 hover:text-cyan-300">View full detail →</button>
      </div>

      {/* Section 3 — Cleared-for-fight banner */}
      {isDemoShellBoxing ? (
        <div className="bg-gradient-to-r from-green-900/30 to-green-900/10 border border-green-600/30 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <div className="text-white font-medium">Cleared for camp / fight night</div>
              <div className="text-xs text-gray-400 mt-0.5">Right shoulder tightness 3/10 · No restrictions · All bloods + eye exam current</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🩺</span>
            <div>
              <div className="text-white font-medium">No physio data yet</div>
              <div className="text-xs text-gray-500 mt-0.5">Connect your Lumio Medical feed to see clearance status.</div>
            </div>
          </div>
        </div>
      )}

      {/* Section 4 — Three-Month Camp Load */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-white">📊 Three-Month Camp Load</div>
            <div className="text-xs text-gray-400 mt-0.5">Last 90 days — sparring rounds + camp hours</div>
          </div>
          {campOverload && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-600/30">⚠ PEAK WEEK HIGH</span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg border bg-[#0a0c14] border-gray-800 text-center">
            <div className="text-2xl font-bold text-red-400">{totalRounds90d}</div>
            <div className="text-xs text-gray-500">Sparring rounds (90d)</div>
          </div>
          <div className="p-3 rounded-lg border bg-[#0a0c14] border-gray-800 text-center">
            <div className="text-2xl font-bold text-teal-400">{totalHours90d}h</div>
            <div className="text-xs text-gray-500">Camp hours (90d)</div>
          </div>
          <div className={`p-3 rounded-lg border text-center ${campOverload?'bg-amber-900/10 border-amber-600/20':'bg-green-900/10 border-green-600/20'}`}>
            <div className={`text-2xl font-bold ${campOverload?'text-amber-400':'text-green-400'}`}>{maxRoundsInWeek}</div>
            <div className="text-xs text-gray-500">Peak week rounds</div>
            <div className={`text-[10px] mt-0.5 ${campOverload?'text-amber-400':'text-green-400'}`}>{campOverload?'⚠ Over 55 — tapering due':'✓ Under 55 — safe'}</div>
          </div>
        </div>
        <div className="flex items-end gap-1 h-20 mb-2">
          {BOXING_CAMP_LOAD.map((w,i)=>{
            const h=(w.rounds/Math.max(maxRoundsInWeek,1))*100;
            const col=w.rounds>=55?'#EF4444':w.rounds>=45?'#F97316':'#dc2626';
            return(
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full rounded-t" style={{height:`${h}%`,background:col,opacity:0.8}}/>
                <div className="text-[7px] text-gray-600" style={{fontSize:'6px'}}>{w.week}</div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end">
          <button onClick={() => onNavigate('recovery')} className="text-[11px] text-cyan-400 hover:text-cyan-300">View full detail →</button>
        </div>
      </div>

      {/* Section 5 — Body map + Injury history */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
          <h2 className="text-white font-medium mb-3">Body map</h2>
          <div className="flex justify-center">
            <svg width="200" height="280" viewBox="0 0 200 280" aria-label="Body map — severity-coded markers">
              <style>{`
                .lumio-pulse-critical { transform-box: fill-box; transform-origin: center; animation: lumioPulseCritical 1.6s ease-in-out infinite; }
                @keyframes lumioPulseCritical { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
              `}</style>
              <defs>
                <filter id="lumioMarkerGlowBoxing" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" />
                </filter>
              </defs>
              <g fill="rgba(255,255,255,0.02)" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
                <ellipse cx="100" cy="30" rx="18" ry="22" />
                <path d="M92,50 C92,56 92,58 92,60 L108,60 C108,58 108,56 108,50" fill="none" />
                <path d="M74,62 C78,60 84,60 90,60 L110,60 C116,60 122,60 126,62 L134,92 L138,140 C138,150 130,156 120,156 L80,156 C70,156 62,150 62,140 L66,92 Z" />
                <circle cx="68" cy="66" r="7" />
                <circle cx="132" cy="66" r="7" />
                <path d="M62,70 L52,108" fill="none" strokeWidth="6" />
                <path d="M52,108 L48,148" fill="none" strokeWidth="5" />
                <circle cx="48" cy="150" r="4" />
                <path d="M138,70 L148,108" fill="none" strokeWidth="6" />
                <path d="M148,108 L152,148" fill="none" strokeWidth="5" />
                <circle cx="152" cy="150" r="4" />
                <circle cx="82" cy="156" r="5" />
                <circle cx="118" cy="156" r="5" />
                <path d="M82,160 L78,212" fill="none" strokeWidth="9" />
                <path d="M78,212 L74,262" fill="none" strokeWidth="7" />
                <path d="M118,160 L122,212" fill="none" strokeWidth="9" />
                <path d="M122,212 L126,262" fill="none" strokeWidth="7" />
              </g>
              {isDemoShellBoxing && bodyMarkers.map(m => {
                const cfg = SEVERITY_CONFIG[m.severity];
                const isCritical = m.severity === 'critical';
                const isSelected = selectedBodyPart === m.id;
                return (
                  <g key={m.id} className={isCritical ? 'lumio-pulse-critical' : ''} style={{ cursor: 'pointer' }} onClick={() => setSelectedBodyPart(m.id)}>
                    <circle cx={m.x} cy={m.y} r={cfg.r + 2} fill={cfg.fill} opacity="0.35" filter="url(#lumioMarkerGlowBoxing)" />
                    <circle cx={m.x} cy={m.y} r={cfg.r} fill={cfg.fill} stroke="#fff" strokeWidth={isSelected ? 2.5 : 1.5} />
                    <circle cx={m.x} cy={m.y} r={cfg.r * 0.35} fill="#fff" opacity="0.9" />
                  </g>
                );
              })}
            </svg>
          </div>
          {isDemoShellBoxing ? (
            <>
              <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2 mt-3 text-[11px] text-gray-400">
                {(['critical','moderate','minor','monitoring'] as Severity[]).map(s => {
                  const cfg = SEVERITY_CONFIG[s];
                  return (
                    <div key={s} className="flex items-center gap-1.5">
                      <span style={{ width: cfg.r*2, height: cfg.r*2, borderRadius:'50%', background: cfg.fill, border:'1.5px solid #fff', display:'inline-block', flexShrink:0 }} />
                      <span>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
              {selectedMarker && (
                <div className="mt-3 bg-black/40 border border-white/10 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium text-sm">{selectedMarker.label}</span>
                    <span className={`text-xs ${SEVERITY_CONFIG[selectedMarker.severity].textClass}`}>
                      {SEVERITY_CONFIG[selectedMarker.severity].label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{selectedMarker.note}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-500 text-center mt-3">Connect your medical feed to see injury markers.</p>
          )}
        </div>
        <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
          <h2 className="text-white font-medium mb-3">Injury history</h2>
          {isDemoShellBoxing ? (
            <>
              <div className="space-y-2">
                {[
                  { date: '2025-11', site: 'Right hand — boxer\'s fracture', severity: 'Moderate', days: 28 },
                  { date: '2025-06', site: 'Left shoulder impingement',     severity: 'Moderate', days: 18 },
                  { date: '2024-12', site: 'Orbital bruising (sparring)',   severity: 'Mild',     days: 5  },
                  { date: '2024-08', site: 'Right wrist sprain',            severity: 'Mild',     days: 7  },
                ].map((inj, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
                    <div>
                      <div className="text-gray-200">{inj.site}</div>
                      <div className="text-xs text-gray-500">{inj.date} · {inj.severity}</div>
                    </div>
                    <span className="text-xs text-gray-400">{inj.days}d out</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-3">
                <button onClick={() => onNavigate('medical')} className="text-[11px] text-cyan-400 hover:text-cyan-300">View full medical record →</button>
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-500">Nothing logged yet.</p>
          )}
        </div>
      </div>

      {/* Section 6 — Lumio Wear Recovery Chart */}
      <BoxingRecoveryChartInline />

      {/* Section 7 — Recovery Trend — Last 5 Days */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-white">Recovery Trend — Last 5 Days</div>
          <button onClick={() => onNavigate('recovery')} className="text-[11px] text-cyan-400 hover:text-cyan-300">View full detail →</button>
        </div>
        <div className="space-y-3">
          {recovery.map((r, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="text-xs text-gray-500 w-20 flex-shrink-0">{r.date}</div>
              <div className="flex-1 bg-gray-800 rounded-full h-2">
                <div className={`h-2 rounded-full ${r.score >= 80 ? 'bg-teal-500' : r.score >= 65 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${r.score}%` }}></div>
              </div>
              <div className={`text-sm font-bold w-10 text-right ${r.score >= 80 ? 'text-teal-400' : r.score >= 65 ? 'text-yellow-400' : 'text-red-400'}`}>{r.score}</div>
              <div className="text-xs text-gray-500 w-16">HRV {r.hrv}ms</div>
              <div className="text-xs text-gray-500 w-16">{r.sleep}h sleep</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 8 — Treatment log */}
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-3">Treatment log — last 5 sessions</h2>
        {isDemoShellBoxing ? (
          <div className="rounded-lg border border-white/5 overflow-hidden">
            <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-black/40 text-[11px] text-gray-500 uppercase tracking-wide">
              <span>Date</span><span>Therapist</span><span>Focus</span><span>Duration</span>
            </div>
            {[
              { date: '15 Apr', therapist: 'Dr Sarah Mitchell', focus: 'Shoulder soft tissue + strap check', time: '45 min' },
              { date: '13 Apr', therapist: 'Tyrone Baker',      focus: 'Deep tissue — back + lats',          time: '60 min' },
              { date: '11 Apr', therapist: 'Dr Sarah Mitchell', focus: 'Knuckle/wrist check + wrap review',  time: '30 min' },
              { date: '8 Apr',  therapist: 'Dr Amir Patel',     focus: 'Ice bath + contrast therapy',        time: '25 min' },
              { date: '5 Apr',  therapist: 'Tyrone Baker',      focus: 'Full upper body sports massage',     time: '75 min' },
            ].map((s, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 px-4 py-2.5 border-t border-white/5 text-sm">
                <span className="text-gray-400">{s.date}</span>
                <span className="text-white">{s.therapist}</span>
                <span className="text-gray-400 text-xs">{s.focus}</span>
                <span className="text-gray-400">{s.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">Nothing logged yet.</p>
        )}
      </div>

      {/* Section 9 — Prevention — daily routine */}
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-3">Prevention — daily routine</h2>
        {isDemoShellBoxing ? (
          <div className="space-y-2">
            {[
              'Ice bath — 10 min post-session',
              'Hand care + knuckle inspection',
              'Neck isometric holds — 5 min',
              'Foam roll — 15 min',
              'Hydration — 4L water + electrolytes',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                <div className="w-4 h-4 rounded border border-white/20 flex-shrink-0" />
                <span className="text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">Nothing logged yet.</p>
        )}
      </div>

      {/* Section 10 — Physio contacts */}
      <div>
        <h2 className="text-white font-medium mb-3">Physio contacts</h2>
        {isDemoShellBoxing ? (
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'Dr Sarah Mitchell', role: 'Head Physio',        phone: '07700 900301' },
              { name: 'Tyrone Baker',      role: 'Soft Tissue / Massage', phone: '07700 900302' },
              { name: 'Dr Amir Patel',     role: 'Ring Doctor',        phone: '07700 900303' },
            ].map((p, i) => (
              <div key={i} className="bg-gray-900/60 border border-white/5 rounded-xl p-3">
                <div className="text-white font-medium text-sm">{p.name}</div>
                <div className="text-xs text-gray-500">{p.role}</div>
                <div className="text-xs text-red-400 mt-1">{p.phone}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
            <p className="text-xs text-gray-500">Nothing logged yet.</p>
          </div>
        )}
      </div>

      <BoxingAISection context="default" fighter={fighter} session={session} />
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
          <div className="text-xs text-blue-400 font-medium mb-1">Pre-Fight Requirements — {fighter.name.split(' ').slice(-1)[0]} vs {fighter.next_fight.opponent.split(' ').slice(-1)[0]} ({fighter.next_fight.date_short})</div>
          <div className="space-y-1 text-[10px] text-gray-400">
            <div>□ Blood work — submit to BBBofC by May 23</div>
            <div>□ MRI scan — valid (Nov 2025, within 12 months ✓)</div>
            <div>□ Pre-fight medical — BBBofC doctor, Jun 5 (venue)</div>
            <div>□ Weigh-in — Jun 5, official BBBofC scales</div>
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
  const rankings: Record<string, { name: string; country: string; record: string; isYou?: boolean }[]> = {
    WBC: [
      { name: 'Callum Brennan', country: '🇬🇧', record: '34-1-1 (24 KO)' },
      { name: 'Yang Zhi Wei', country: '🇨🇳', record: '27-2-1 (22 KO)' },
      { name: 'Maks Stoyan', country: '🇷🇺', record: '28-2 (24 KO)' },
      { name: 'Etienne Ngoma', country: '🇨🇩', record: '21-1 (16 KO)' },
      { name: 'Bruno Babic', country: '🇭🇷', record: '17-1 (14 KO)' },
      { name: fighter.name, country: '🇬🇧', record: '22-1 (18 KO)', isYou: true },
      { name: 'Kallum Wright', country: '🇬🇧', record: '22-2 (21 KO)' },
      { name: 'Reece Halloran', country: '🇬🇧', record: '16-3 (15 KO)' },
    ],
    WBA: [
      { name: 'Yarko Levchenko', country: '🇺🇦', record: '22-0 (14 KO)' },
      { name: 'Kallum Wright', country: '🇬🇧', record: '22-2 (21 KO)' },
      { name: 'Yang Zhi Wei', country: '🇨🇳', record: '27-2-1 (22 KO)' },
      { name: 'Yusuf Çelik', country: '🇩🇪', record: '24-0 (17 KO)' },
      { name: 'Yoel Bermudez', country: '🇨🇺', record: '24-1 (17 KO)' },
      { name: 'Etienne Ngoma', country: '🇨🇩', record: '21-1 (16 KO)' },
      { name: 'Trevon Walsh', country: '🇺🇸', record: '17-0 (15 KO)' },
      { name: 'Bruno Babic', country: '🇭🇷', record: '17-1 (14 KO)' },
      { name: fighter.name, country: '🇬🇧', record: '22-1 (18 KO)', isYou: true },
    ],
    WBO: [
      { name: 'Yarko Levchenko', country: '🇺🇦', record: '22-0 (14 KO)' },
      { name: 'Callum Brennan', country: '🇬🇧', record: '34-1-1 (24 KO)' },
      { name: 'Yang Zhi Wei', country: '🇨🇳', record: '27-2-1 (22 KO)' },
      { name: 'Trevon Walsh', country: '🇺🇸', record: '17-0 (15 KO)' },
      { name: fighter.name, country: '🇬🇧', record: '22-1 (18 KO)', isYou: true },
      { name: 'Etienne Ngoma', country: '🇨🇩', record: '21-1 (16 KO)' },
      { name: 'Hone Tahere', country: '🇳🇿', record: '35-3 (23 KO)' },
      { name: 'Kallum Wright', country: '🇬🇧', record: '22-2 (21 KO)' },
    ],
    IBF: [
      { name: 'Kallum Wright', country: '🇬🇧', record: '22-2 (21 KO)' },
      { name: 'Bruno Babic', country: '🇭🇷', record: '17-1 (14 KO)' },
      { name: 'Yusuf Çelik', country: '🇩🇪', record: '24-0 (17 KO)' },
      { name: 'Etienne Ngoma', country: '🇨🇩', record: '21-1 (16 KO)' },
      { name: 'Yang Zhi Wei', country: '🇨🇳', record: '27-2-1 (22 KO)' },
      { name: 'Maks Stoyan', country: '🇷🇺', record: '28-2 (24 KO)' },
      { name: 'Trevon Walsh', country: '🇺🇸', record: '17-0 (15 KO)' },
      { name: 'Bryce Holcombe', country: '🇦🇺', record: '24-1 (14 KO)' },
      { name: 'Yoel Bermudez', country: '🇨🇺', record: '24-1 (17 KO)' },
      { name: 'Reece Halloran', country: '🇬🇧', record: '16-3 (15 KO)' },
      { name: 'Ezekiel Onyeka', country: '🇳🇬', record: '18-2 (14 KO)' },
      { name: fighter.name, country: '🇬🇧', record: '22-1 (18 KO)', isYou: true },
    ],
  };

  const movements = [
    { body: 'WBC', direction: 'up', positions: 2, note: 'Rose from #8 after KO win over Dillian White (Nov 2025)' },
    { body: 'WBA', direction: 'same', positions: 0, note: 'Held at #9 — needs top-10 win to climb' },
    { body: 'WBO', direction: 'up', positions: 3, note: 'Jumped from #8 — benefited from Tahere loss' },
    { body: 'IBF', direction: 'down', positions: 1, note: 'Slipped from #11 after inactivity penalty' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon="🌍" title="World Rankings" subtitle="WBC, WBA, WBO, IBF heavyweight rankings with Marcus highlighted." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="WBC" value={`#${fighter.rankings.wbc}`} sub="Heavyweight" color="green" />
        <StatCard label="WBA" value={`#${fighter.rankings.wba}`} sub="Heavyweight" color="red" />
        <StatCard label="WBO" value={`#${fighter.rankings.wbo}`} sub="Heavyweight" color="blue" />
        <StatCard label="IBF" value={`#${fighter.rankings.ibf}`} sub="Heavyweight" color="orange" />
      </div>

      {/* 5-Column Rankings (incl. Northbridge) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {Object.entries(rankings).map(([body, fighters]) => (
          <div key={body} className="bg-[#0D1117] border border-gray-800 rounded-xl p-4">
            <div className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${body === 'WBC' ? 'bg-green-500' : body === 'WBA' ? 'bg-red-500' : body === 'WBO' ? 'bg-blue-500' : 'bg-orange-500'}`}></span>
              {body} Heavyweight
            </div>
            <div className="space-y-1">
              {fighters.slice(0, 8).map((f, i) => (
                <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${f.isYou ? 'bg-red-900/20 border border-red-600/30' : 'hover:bg-gray-800/50'}`}>
                  <span className="text-gray-500 w-4 text-right font-mono">{i + 1}</span>
                  <span className="text-sm">{f.country}</span>
                  <span className={`flex-1 truncate ${f.isYou ? 'text-red-400 font-bold' : 'text-gray-300'}`}>{f.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Northbridge Fight Night Column */}
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
              { name: 'Callum Brennan', country: '🇬🇧' },
              { name: 'Hone Tahere', country: '🇳🇿' },
              { name: 'Ezekiel Onyeka', country: '🇳🇬' },
              { name: 'Trevon Walsh', country: '🇺🇸' },
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
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{fighter.name}</div>
            <div className="text-gray-500 font-bold">NOT RANKED</div>
            <div className="text-[10px] text-gray-600">Not signed with Northbridge</div>
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

      {/* Northbridge Fight Night Explainer */}
      <div className="bg-[#0D1117] border border-yellow-600/40 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <span className="text-2xl">⚡</span>
          <div>
            <div className="text-sm font-bold text-yellow-300 mb-2">What Northbridge Fight Night means for Marcus's career</div>
            <div className="text-xs text-gray-400 leading-relaxed mb-4">
              Northbridge Fight Night — a US-backed boxing venture launched 2025 — operates on a one-fight deal model rather than traditional multi-fight exclusive contracts. This means fighters retain freedom but receive no guaranteed fight pipeline. Northbridge has signed several marquee names from the UK and Commonwealth scenes and broadcasts on Apex Sports Network+ and Apex Sports Network.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-green-900/10 border border-green-800/30 rounded-lg p-3">
                <div className="text-green-400 font-bold mb-1">Upside for Marcus</div>
                <div className="text-gray-400">Highest single-fight fee available. No long-term lock-in. Access to US market and Apex Sports Network audience.</div>
              </div>
              <div className="bg-red-900/10 border border-red-800/30 rounded-lg p-3">
                <div className="text-red-400 font-bold mb-1">Risk for Marcus</div>
                <div className="text-gray-400">No ranking within Northbridge (no titles yet). Could jeopardise WBC/WBA mandatory position. Titan first-option clause complication.</div>
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
            { belt: 'WBC', champion: 'Callum Brennan', flag: '🇬🇧', record: '34-1-1', mandatoryNext: 'Yang (ordered)', marcusRanking: '#5', timelineTo: '~24 months', color: 'border-green-600/30 bg-green-900/10' },
            { belt: 'WBA', champion: 'Yarko Levchenko', flag: '🇺🇦', record: '22-0', mandatoryNext: 'Vacant (Super)', marcusRanking: '#9', timelineTo: '~30 months', color: 'border-purple-600/30 bg-purple-900/10' },
            { belt: 'WBO', champion: 'Yarko Levchenko', flag: '🇺🇦', record: '22-0', mandatoryNext: 'Wright or Walsh', marcusRanking: '#5', timelineTo: '~18 months', color: 'border-blue-600/30 bg-blue-900/10' },
            { belt: 'IBF', champion: 'Kallum Wright', flag: '🇬🇧', record: '22-2', mandatoryNext: 'Babic (Jun 2026)', marcusRanking: '#12', timelineTo: '~36 months', color: 'border-red-600/30 bg-red-900/10' },
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
        <div className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">{fighter.name}&apos;s Fastest Path to Undisputed</div>
        <div className="space-y-2">
          {[
            { step: 1, action: 'Beat Stoyan (WBC #3)', timeline: 'May 2026', result: 'Move to WBC #3 / WBO #2', status: 'upcoming' },
            { step: 2, action: 'WBC Eliminator vs Yang or #4', timeline: 'Q4 2026', result: 'WBC Mandatory contender', status: 'future' },
            { step: 3, action: 'WBO Title shot (Levchenko or successor)', timeline: '2027', result: 'First belt — WBO Champion', status: 'future' },
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
    { body: 'WBC', champion: 'Callum Brennan', mandatory: 'Yang Zhi Wei (#2)', status: 'Ordered', deadline: 'Sep 2026', relevance: 'If Yang wins, creates opening at #2. If Brennan vacates, #1 vs #2 for vacant.' },
    { body: 'WBA', champion: 'Yarko Levchenko', mandatory: 'Kallum Wright (#2)', status: 'Negotiations', deadline: 'Jul 2026', relevance: 'Wright rematch clause active. Marcus needs to be #5 or higher to enter eliminators.' },
    { body: 'WBO', champion: 'Yarko Levchenko', mandatory: 'Callum Brennan (#2)', status: 'Rematch clause', deadline: 'Aug 2026', relevance: 'If Brennan loses again, Marcus at #5 could enter eliminator for mandatory spot.' },
    { body: 'IBF', champion: 'Kallum Wright', mandatory: 'Bruno Babic (#2)', status: 'Purse bid', deadline: 'Jun 2026', relevance: 'Long path — Marcus at #12 needs 2-3 top wins to reach mandatory position.' },
  ];

  const eliminators = [
    { body: 'WBC', fight: '#4 Ngoma vs #5 Babic', date: 'May 10, 2026', significance: 'Winner likely gets mandatory shot. If both ranked fighters lose stock, opens door for Marcus.' },
    { body: 'WBO', fight: '#3 Yang vs #4 Walsh', date: 'Jun 2026 (TBD)', significance: 'Winner enters mandatory queue. Marcus at #5 could be called for eliminator if one withdraws.' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon="📋" title="Mandatory Tracker" subtitle="Monitor mandatory obligations, eliminators, and sanctioning body deadlines." />

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
    { step: 1, fight: `${fighter.next_fight.opponent} (${fighter.next_fight.opponent_ranking})`, date: fighter.next_fight.date, importance: 'Must-win to crack top 3 across all bodies', outcome: 'Win → WBC #3, WBO #3 projected', status: 'scheduled' },
    { step: 2, fight: 'WBC Eliminator (vs #2 or #4)', date: 'Oct/Nov 2026', importance: 'Official eliminator for mandatory position', outcome: 'Win → WBC mandatory challenger', status: 'projected' },
    { step: 3, fight: 'WBC Mandatory Title Shot', date: 'Q1 2027', importance: 'First world title fight', outcome: 'Win → WBC Heavyweight Champion', status: 'projected' },
  ];

  const alternativePaths = [
    { body: 'WBO', path: 'Beat Stoyan → Enter WBO eliminator vs Walsh (#4) → WBO mandatory', timeline: '12-18 months', likelihood: 'High' },
    { body: 'WBA', path: 'Beat Stoyan → Top-5 win → WBA eliminator → mandatory', timeline: '18-24 months', likelihood: 'Medium' },
    { body: 'IBF', path: 'Beat Stoyan → 2 more top-10 wins → IBF eliminator', timeline: '24+ months', likelihood: 'Low' },
    { body: 'Shortcut', path: 'Voluntary defence offer from any champion wanting a "winnable" fight', timeline: 'Could happen anytime', likelihood: 'Possible' },
  ];

  return (
    <div className="space-y-6">
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
      <SectionHeader icon="🔔" title="Purse Bid Tracker" subtitle="WBC/WBA/WBO/IBF mandatory proceedings and real-time purse split calculator" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="WBC Mandatory" value="Ordered" sub="#3 vs #5 by Q4 2026" color="green" />
        <StatCard label="WBO Mandatory" value="Upcoming" sub="Wright eliminator Jun" color="yellow" />
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
            { belt: 'WBC', matchup: 'Cole (#5) vs Yang (#2)', status: 'Ordered', deadline: 'Q4 2026', notes: 'WBC executive committee voted May 2026. 60 days to negotiate, then purse bid.', urgent: false },
            { belt: 'WBO', matchup: 'Cole (#5) vs Walsh (#4)', status: 'Possible', deadline: 'Wright must defend first', notes: 'If Wright beats Babic in June, eliminator between #4 and #5 likely ordered Q3 2026.', urgent: false },
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
    '1': [{ goal: 'Win WBO Super Middleweight title', target: 'Nov 2026', status: 'Mandatory challenger', progress: 75, color: '#ef4444' },{ goal: 'Mandatory WBC challenger status', target: 'Dec 2026', status: 'Currently #7', progress: 65, color: '#a855f7' },{ goal: 'Meridian Sports PPV headliner — 500k buys', target: 'Nov 2026', status: 'In negotiations', progress: 55, color: '#f59e0b' },{ goal: 'Reach 500k social followers', target: 'Dec 2026', status: '312k now', progress: 62, color: '#0ea5e9' },{ goal: 'Secure £300k+ fight purse', target: 'Nov 2026', status: '£180k last fight', progress: 60, color: '#22c55e' }],
    '3': [{ goal: 'Win two of four major world titles', target: 'Dec 2028', status: 'On track', progress: 40, color: '#ef4444' },{ goal: 'Undisputed contender', target: 'Dec 2028', status: 'In progress', progress: 35, color: '#facc15' },{ goal: '£2M career earnings', target: 'Dec 2028', status: '£740k to date', progress: 37, color: '#22c55e' },{ goal: 'Headline Millennium Dome', target: 'Dec 2027', status: 'Target confirmed', progress: 45, color: '#a855f7' },{ goal: '£500k sponsorship/yr', target: 'Dec 2028', status: 'UA £120k/yr', progress: 24, color: '#0ea5e9' }],
    '5': [{ goal: 'Undisputed champion', target: 'Dec 2030', status: 'Career target', progress: 20, color: '#ef4444' },{ goal: '£5M career earnings', target: 'Dec 2030', status: '£740k to date', progress: 15, color: '#22c55e' },{ goal: 'Legacy fight — Vegas or Saudi', target: 'Dec 2030', status: 'Long-term', progress: 10, color: '#f59e0b' },{ goal: 'Launch boxing academy', target: 'Dec 2029', status: 'Planning', progress: 12, color: '#a855f7' },{ goal: '2M social followers', target: 'Dec 2030', status: '312k now', progress: 16, color: '#0ea5e9' }],
    '10': [{ goal: 'Hall of fame — 3+ world titles', target: 'Dec 2035', status: 'Life goal', progress: 8, color: '#facc15' },{ goal: 'Move up to Light Heavy', target: 'Dec 2033', status: 'Future plan', progress: 5, color: '#ef4444' },{ goal: '£20M career earnings', target: 'Dec 2035', status: 'Long-term', progress: 4, color: '#22c55e' },{ goal: 'Promote own shows', target: 'Dec 2035', status: 'Future ambition', progress: 5, color: '#a855f7' },{ goal: 'Media / commentary career', target: 'Dec 2035', status: 'Long-term', progress: 3, color: '#0ea5e9' }],
  }
  const SEASON = [{ goal: 'Win WBO mandatory vs Stoyan', detail: 'Fight confirmed — May 2026', progress: 75, color: '#ef4444' },{ goal: 'Improve WBC ranking to top 5', detail: 'Currently #7 WBO, #6 WBC', progress: 60, color: '#a855f7' },{ goal: 'Land £250k+ sponsorship deal', detail: 'UA renewal + new partner', progress: 40, color: '#f59e0b' },{ goal: 'Camp discipline — no weight issues', detail: 'Cut protocol in place', progress: 80, color: '#22c55e' },{ goal: 'Grow Meridian Sports audience 40%', detail: '2.1M last PPV — target 3M', progress: 35, color: '#0ea5e9' }]
  const TIMELINE = [{ year: '2018', event: 'Turned pro — first 4-rounder, TKO2' },{ year: '2019', event: 'Unbeaten run — 8-0, signed by Danny Walsh' },{ year: '2020', event: 'First 10-rounder — UD win, national TV debut' },{ year: '2021', event: 'First loss — SD defeat, valuable learning' },{ year: '2022', event: 'Comeback — 6 straight wins, all by stoppage' },{ year: '2023', event: 'International debut — won WBO European title' },{ year: '2024', event: 'Career high WBC #4 — Meridian Sports deal signed' },{ year: '2025', event: 'WBO mandatory challenger confirmed' }]
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
              { location: '🇬🇧 UK Fight', tax: 45, note: 'Home crowd, Meridian Sports broadcast' },
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
    { fight: 'vs Yoel Bermudez (L)', date: 'Jun 2024', purse: 50000, bonuses: 0, ppv: 0, net: 18000, venue: 'SSE Arena, Wembley' },
  ];

  const totalPurse = earnings.reduce((a, e) => a + e.purse, 0);
  const totalNet = earnings.reduce((a, e) => a + e.net, 0);

  return (
    <div className="space-y-6">
      <SectionHeader icon="💰" title="Fight Earnings" subtitle="Historical purse breakdown and career earnings tracker." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Career Gross" value={`£${(totalPurse / 1000).toFixed(0)}k`} sub="Total purses" color="red" />
        <StatCard label="Career Net" value={`£${(totalNet / 1000).toFixed(0)}k`} sub="After all deductions" color="green" />
        <StatCard label="Last Fight" value="£450k" sub="vs White — Nov 2025" color="blue" />
        <StatCard label="Next Projected" value="£800k" sub="vs Stoyan — May 2026" color="yellow" />
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
    { name: 'Sarah Whitlock', role: 'PR & Media Manager', phone: '+44 7700 900345', email: 'sarah@whitlockmedia.com', responsibilities: 'Press conferences, social media strategy, interview scheduling, brand partnerships, crisis comms', since: '2024' },
    { name: 'David Park', role: 'Accountant', phone: '+44 7700 900678', email: 'david@parkcpa.co.uk', responsibilities: 'Tax returns, financial planning, purse accounting, expense management, company structure', since: '2021' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon="👥" title="Team Overview" subtitle={`${team.length} team members supporting ${fighter.name}${fighter.nickname ? ' "' + fighter.nickname + '"' : ''}.`} />

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
    { section: 'Opposition Update', content: 'Stoyan confirmed training camp in Big Bear, California. Working with new conditioning coach. Recent sparring footage shows he\'s working on body shots — unusual for him. His team are confident.' },
    { section: 'Commercial Obligations', content: 'Meridian Sports promo shoot — April 12. Northbridge Sport interview — April 15. Social media content day — April 18. Press conference (London) — May 23. Weigh-in — Jun 5.' },
    { section: 'Flag', content: 'Right shoulder tightness has improved with treatment but monitoring closely. Liam (physio) recommends reducing overhead strength work for next 7 days.' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon="📄" title="Fighter Briefing" subtitle="Structured daily briefing document for Marcus and the team." />

      <div className="bg-gradient-to-r from-red-900/30 via-[#0D1117] to-gray-900 border border-red-600/20 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-bold text-white">Daily Fighter Briefing</div>
            <div className="text-xs text-gray-400">April 19, 2026 — Camp Day {fighter.camp_day} — {fighter.next_fight.days_away} days to fight</div>
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
    { date: 'April 4, 2026', category: 'Sparring', content: 'Excellent session with Hughes today. Marcus is reading the jab better and slipping right effectively. The body-head combination we drilled on pads is now translating to live sparring. Need to keep hands higher after throwing the right hand — leaving himself open for the counter. This is something Stoyan will exploit.' },
    { date: 'April 3, 2026', category: 'Pads', content: 'Power session on pads. 12 rounds focused on counter punching off the back foot. Left hook to the body is landing with real venom. Introduced a new pull counter right hand — Marcus picked it up quickly. Will need 2-3 more sessions before it becomes instinctive.' },
    { date: 'April 2, 2026', category: 'Technical', content: 'Worked on clinch exits for 4 rounds. Marcus is getting better at establishing head position first, but still needs to work on the uppercut on entry. Added feint patterns — double jab, feint right, left hook body — this combination will be money against Stoyan.' },
    { date: 'April 1, 2026', category: 'Strategy', content: 'Film session reviewing Stoyan vs Bermudez (his only loss). Key takeaway: Bermudez used lateral movement and body shots to tire Stoyan. By round 8, Stoyan was flat-footed and easy to hit. Our game plan should mirror this approach — make him miss, make him pay, and invest in the body early.' },
    { date: 'March 31, 2026', category: 'Assessment', content: 'Mid-camp assessment. Marcus is in the best shape of his career. Power: 9/10. Speed: 8/10. Cardio: 8/10. Defence: 7.5/10. Ring IQ: 8.5/10. Areas to improve in remaining camp: Defensive responsibility after combinations. Clinch work. Championship round intensity.' },
  ];

  return (
    <div className="space-y-6">
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
    { opponent: fighter.next_fight.opponent, purse: '£800,000', broadcast: fighter.next_fight.broadcast, venue: fighter.next_fight.venue.replace(/^The\s+/, ''), status: 'SIGNED', date: fighter.next_fight.date, notes: 'WBC eliminator implications' },
    { opponent: 'Yang Zhi Wei', purse: '£1,200,000 (projected)', broadcast: 'Meridian Sports / Apex Sports Network', venue: 'TBD', status: 'Informal enquiry', date: 'Q4 2026', notes: 'If Marcus beats Stoyan — massive fight' },
    { opponent: 'Trevon Walsh', purse: '£500,000', broadcast: 'Meridian Sports', venue: 'USA (MSG or Barclays)', status: 'Declined', date: 'N/A', notes: 'Timing wrong — mid Stoyan camp' },
  ];

  const commercialPipeline = [
    { brand: 'Apex Performance', deal: 'Kit sponsorship renewal', value: '£75,000/yr', status: 'Negotiating', deadline: 'May 2026' },
    { brand: 'Bulk Powders', deal: 'Supplement endorsement', value: '£25,000/yr', status: 'Signed', deadline: 'Active' },
    { brand: 'Northbridge Sport', deal: 'Pundit appearances (off-season)', value: '£2,500/appearance', status: 'Open offer', deadline: 'Ongoing' },
    { brand: 'Betfair', deal: 'Ambassador role', value: '£40,000/yr', status: 'In discussions', deadline: 'Jun 2026' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon="💼" title="Manager Dashboard" subtitle={`Danny Walsh's management overview for ${fighter.name}.`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Next Fight Purse" value="£800k" sub="vs Stoyan — signed" color="red" />
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
    { brand: 'Apex Performance', type: 'Kit & Apparel', value: '£65,000/yr', start: 'Jan 2024', end: 'Dec 2026', deliverables: '4 social posts/month, ring walk kit, photoshoot x2/yr', status: 'Active' },
    { brand: 'Bulk Powders', type: 'Supplement Partner', value: '£25,000/yr', start: 'Mar 2025', end: 'Feb 2027', deliverables: '2 social posts/month, product use in camp content', status: 'Active' },
    { brand: 'Meridian Sports', type: 'Broadcast Partner', value: 'Included in fight deal', start: 'N/A', end: 'Per fight', deliverables: 'Embedded content, training camp access, behind-the-scenes', status: 'Active' },
    { brand: 'Betfair', type: 'Betting Ambassador', value: '£40,000/yr (pending)', start: 'TBD', end: 'TBD', deliverables: 'Social media, press day appearances, branded content', status: 'Negotiating' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon="🤝" title="Sponsorships" subtitle="Active and pipeline brand partnerships." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Sponsors" value="3" sub="Apex Performance, Bulk, Meridian Sports" color="red" />
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
    { date: 'Apr 12', event: 'Meridian Sports Promo Shoot', location: 'Meridian Sports Studios, London', duration: '3 hours', type: 'Broadcast', notes: 'Fight promo package, 30-sec trailer, social clips', status: 'Confirmed' },
    { date: 'Apr 15', event: 'Northbridge Sport Interview', location: 'Sky Studios, Isleworth', duration: '45 min', type: 'TV', notes: 'Pre-fight feature for Northbridge Sport Boxing show', status: 'Confirmed' },
    { date: 'Apr 18', event: 'Social Media Content Day', location: 'Training camp (Sheffield)', duration: '2 hours', type: 'Social', notes: 'Behind-the-scenes content, training clips, Q&A', status: 'Confirmed' },
    { date: 'Apr 25', event: 'Boxing News Interview', location: 'Phone/Zoom', duration: '30 min', type: 'Print', notes: 'Cover story feature for May edition', status: 'Pending' },
    { date: 'May 1', event: 'IFL TV Interview', location: 'Titan HQ', duration: '20 min', type: 'YouTube', notes: 'Fight preview, prediction discussion', status: 'Pending' },
    { date: 'May 23', event: 'Press Conference', location: 'Hilton Park Lane, London', duration: 'Half day', type: 'Major Event', notes: 'Official fight press conference with face-off', status: 'Confirmed' },
    { date: 'Jun 3', event: 'Open Workout', location: 'Boxpark, Wembley', duration: '2 hours', type: 'Public', notes: 'Public workout, fan meet & greet, media access', status: 'Confirmed' },
    { date: 'Jun 5', event: 'Weigh-In', location: 'Millennium Dome', duration: 'Full day', type: 'Major Event', notes: 'Official weigh-in, face-off, last press duties', status: 'Confirmed' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon="📱" title="Media Obligations" subtitle="Scheduled press, interviews, and promotional commitments." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Obligations" value={obligations.length} sub="Pre-fight schedule" color="red" />
        <StatCard label="Confirmed" value={obligations.filter(o => o.status === 'Confirmed').length} sub="Locked in" color="green" />
        <StatCard label="Pending" value={obligations.filter(o => o.status === 'Pending').length} sub="Awaiting confirmation" color="yellow" />
        <StatCard label="Next Up" value="Apr 25" sub="Boxing News Interview" color="blue" />
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
    { event: 'Titan Promotions Awards', date: 'Jun 15, 2026', fee: '£0 (promotional)', type: 'Industry', notes: 'Networking, table appearance, promotional value', status: 'Confirmed' },
    { event: 'Apex Performance Store Opening', date: 'Jul 2026', fee: '£6,000', type: 'Sponsor', notes: 'Store appearance, signing, social content', status: 'Pending' },
  ];

  const totalEarned = 12500;
  const totalPipeline = 6000;

  return (
    <div className="space-y-6">
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
    { title: 'Titan Promotional Agreement', counterparty: 'Titan Promotions', type: 'Promotional', start: 'Jan 2024', end: 'Dec 2027', fights: '6-fight deal (3 remaining)', value: 'Per-fight basis', status: 'Active', keyTerms: '3 fights remaining. Titan has first option on all UK fights. Meridian Sports broadcast rights included.' },
    { title: 'Management Agreement', counterparty: 'Danny Walsh / Walsh Management', type: 'Management', start: 'Jun 2020', end: 'Jun 2028', fights: 'All fights', value: '25% of purse', status: 'Active', keyTerms: '8-year deal with 2-year renewal option. Covers all fight purses, commercial income split negotiable.' },
    { title: 'Training Agreement', counterparty: 'Jim Bevan', type: 'Trainer', start: 'Mar 2021', end: 'Rolling', fights: 'Per-camp basis', value: '12% of purse + camp retainer', status: 'Active', keyTerms: 'Rolling agreement. Either party can terminate with 30-day notice. Camp retainer £6,000 regardless of purse %.' },
    { title: 'Apex Performance Sponsorship', counterparty: 'Apex Performance UK', type: 'Sponsorship', start: 'Jan 2024', end: 'Dec 2026', fights: 'N/A', value: '£65,000/yr', status: 'Renewal due', keyTerms: 'Exclusive kit deal. Must wear UA for all training content and ring walks. Renewal discussions opening.' },
    { title: 'BBBofC Licence', counterparty: 'British Boxing Board of Control', type: 'Licence', start: 'Jan 2026', end: 'Dec 2026', fights: 'All UK fights', value: '£800/yr', status: 'Active', keyTerms: 'Annual professional boxing licence. Requires annual medical and brain scan.' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon="📑" title="Contract Tracker" subtitle="All active agreements, expiry dates, and key terms." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Contracts" value={contracts.filter(c => c.status === 'Active').length} sub="Currently binding" color="green" />
        <StatCard label="Renewals Due" value={contracts.filter(c => c.status === 'Renewal due').length} sub="Action required" color="yellow" />
        <StatCard label="Titan Deal" value="3 fights" sub="Remaining on deal" color="red" />
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
            { type: 'One-Fight Deal', example: 'Northbridge approach', desc: 'Single fight, massive upfront fee, no ongoing obligation.', color: 'text-yellow-400', bg: 'bg-yellow-900/10 border-yellow-800/40' },
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

      {/* Northbridge Offer Alert */}
      <div className="bg-yellow-900/10 border border-yellow-600/40 rounded-xl p-5 flex items-start gap-4">
        <span className="text-2xl">⚡</span>
        <div>
          <div className="text-sm font-bold text-yellow-300 mb-1">Northbridge Fight Night Approach — Action Required</div>
          <div className="text-xs text-yellow-200/70">Danny Walsh has flagged a Northbridge Fight Night approach — one-fight offer estimated at £2.1M. This is a one-fight deal with no ongoing promotional obligation. Decision required before current Titan contract window closes.</div>
        </div>
      </div>

      {/* Titan vs Northbridge Comparison */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Titan vs Northbridge Fight Night — Side-by-Side Comparison</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-2 pr-4 text-gray-500 font-medium">Factor</th>
                <th className="text-left py-2 pr-4 text-gray-300 font-bold">Titan</th>
                <th className="text-left py-2 text-yellow-300 font-bold">⚡ Northbridge Fight Night</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {[
                { factor: 'Purse', titan: '£450k–£800k per fight', northbridge: '£2.1M one-fight fee' },
                { factor: 'Take-Home (est.)', titan: '~£148k–£260k net', northbridge: '~£690k net (45% tax)' },
                { factor: 'Ranking Benefits', titan: 'Meridian Sports exposure, UK market leader', northbridge: 'Global reach, UFC fanbase crossover' },
                { factor: 'Career Pathway', titan: 'Structured route to world title shot', northbridge: 'No guaranteed next fight' },
                { factor: 'Breach Risk', titan: 'Low — existing relationship', northbridge: 'HIGH — may breach Titan first option clause' },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="py-2 pr-4 text-gray-500">{row.factor}</td>
                  <td className="py-2 pr-4 text-gray-300">{row.titan}</td>
                  <td className="py-2 text-yellow-200">{row.northbridge}</td>
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
          <div className="text-xs text-gray-400 italic">"The money is real but the contract risk is very real too. If we take this Northbridge fight without Titan sign-off we could be looking at an injunction. We need to read the first-option clause very carefully before we respond."</div>
        </div>
      </div>

      {/* Contract Expiry Countdown */}
      <div className="bg-[#0D1117] border border-red-800/40 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-white mb-1">Titan Contract Expiry</div>
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
    if (session?.isDemoShell !== false) {
      setDebrief({
        performance_rating: '8.5/10 — championship-level composure',
        strengths: 'The jab-step pattern from camp did exactly what we built it for — 41 jabs landed in rounds 1-4 set the rhythm of the whole fight. Championship rounds 10-12 were outscored 46 to 21 in landed punches.',
        weaknesses: 'Round 8 drifted to the ropes twice after clinch breaks and took three clean counters. The pivot-out drill was in camp but absent on the night — first priority for the next review.',
        gps_insight: 'Centre-ring time sat at 52% through rounds 9-12 — above the 45% target, which matched the late-fight control we saw on tape.',
        next_camp_focus: 'Rebuild the pivot-out drill into every sparring session; hold everything else the same.',
      });
      setDebriefLoading(false);
      return;
    }
    try {
      const response = await fetch('/api/ai/boxing', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:600,
          messages:[{role:'user',content:`Post-fight debrief for Marcus Cole (22-1 Heavyweight). Fight: ${selectedFight}. Punch stats: 224/498 (45%) jabs 82/188 power 142/310. Notes: Strong body work, managed southpaw, slight wobble R6. Camp GPS data showed 40% centre ring time (target 45%), ACWR peaked 1.31. Generate analytical debrief. Respond ONLY in JSON: {"performance_rating":"X/10 — brief label","strengths":"2 sentences","weaknesses":"2 sentences","gps_insight":"1 sentence on what GPS ring data suggests about the performance","next_camp_focus":"1 sentence priority for next camp"}`}]
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
    { no: 18, date: '2024-06-01', opponent: 'Yoel Bermudez', oppRecord: '18-2', result: 'L', method: 'SD', rounds: '10/10', title: '', venue: 'SSE Arena, Wembley' },
    { no: 17, date: '2024-03-16', opponent: 'Fabio Wardley', oppRecord: '16-0', result: 'W', method: 'KO R9', rounds: '9/12', title: 'British Title', venue: 'Millennium Dome, London' },
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
    { no: 4, date: '2021-03-13', opponent: 'Wesley Dunne', oppRecord: '5-7', result: 'W', method: 'KO R1', rounds: '1/4', title: '', venue: 'York Hall, London' },
    { no: 3, date: '2020-12-05', opponent: 'Tom Harrison', oppRecord: '2-4', result: 'W', method: 'PTS', rounds: '4/4', title: '', venue: 'BT Sport Studios (bubble)' },
    { no: 2, date: '2020-10-10', opponent: 'Dave Clark', oppRecord: '1-3', result: 'W', method: 'TKO R2', rounds: '2/4', title: '', venue: 'BT Sport Studios (bubble)' },
    { no: 1, date: '2020-07-25', opponent: 'Ryan Johnson', oppRecord: '0-2', result: 'W', method: 'KO R1', rounds: '1/4', title: '', venue: 'BT Sport Studios (bubble)' },
  ];

  return (
    <div className="space-y-6">
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
            <div className="text-xs text-gray-500 mb-1">Punch stats — Landed / Thrown</div>
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
    { opponent: fighter.next_fight.opponent, promoter: 'Titan/Crown co-promote', purse: '£800,000', date: fighter.next_fight.date, stage: 'Signed', broadcast: fighter.next_fight.broadcast, notes: 'Fight contracts exchanged. Camp underway.' },
    { opponent: 'Yang Zhi Wei', promoter: 'Titan/Crown co-promote', purse: '£1.2m-1.5m', date: 'Q4 2026', stage: 'Discussions', broadcast: 'Meridian Sports / Continental Sport', notes: 'Conditional on Stoyan win. Jack Sterling has opened dialogue with Crown\'s camp.' },
    { opponent: 'WBC Eliminator TBD', promoter: 'Titan', purse: '£1.5m+', date: 'Q1 2027', stage: 'Projected', broadcast: 'Meridian Sports', notes: 'If Marcus beats Stoyan and enters top 3. Eliminator likely ordered Q4 2026.' },
    { opponent: 'Title Shot', promoter: 'TBD', purse: '£3m+ (projected)', date: '2027', stage: 'Long-term target', broadcast: 'PPV', notes: 'Depends on route. WBC or WBO most likely first title opportunity.' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon="🗂️" title="Promoter Pipeline" subtitle="Fight pipeline and promotional strategy with Titan Promotions." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Current Promoter" value="Titan" sub="Jack Sterling" color="red" />
        <StatCard label="Fights Left" value="3" sub="On current deal" color="blue" />
        <StatCard label="Next Fight" value="£800k" sub="vs Stoyan — signed" color="green" />
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
    { source: 'Industry contact (Crown)', date: 'Apr 3, 2026', content: 'Stoyan\'s team are very confident heading into this fight. They believe Marcus is hittable and have been studying the Yoel Bermudez loss closely. Stoyan has been sparring with Ezekiel Onyeka to simulate a taller, more technical opponent.' },
    { source: 'Boxing Scene report', date: 'Apr 2, 2026', content: 'WBC expected to order eliminator between #3 and #5 if Stoyan loses. This means a Marcus win could skip the eliminator stage entirely and go straight to mandatory position, depending on how WBC executive committee votes.' },
    { source: 'Titan insider', date: 'Apr 1, 2026', content: 'Jack Sterling has privately indicated that a Marcus victory over Stoyan would trigger immediate discussions with Crown Promotions for a co-promoted fight with Yang (WBC #2). Potential venue: Crown Park Stadium, summer 2026.' },
    { source: 'Meridian Sports analytics team', date: 'Mar 28, 2026', content: 'Marcus Cole fight content is trending 34% higher engagement than this time last year. Meridian Sports very keen on building toward a PPV headliner — willing to increase marketing spend if Stoyan fight delivers.' },
    { source: 'BBBofC source', date: 'Mar 25, 2026', content: 'Referee for Stoyan fight expected to be Marcus McDonnell. He tends to let fighters work inside and breaks clinches quickly — advantages Marcus\'s boxing ability over Stoyan\'s mauling style.' },
  ];

  return (
    <div className="space-y-6">
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
  const [scoutTarget, setScoutTarget] = useState('Maks Stoyan');
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
    { name: 'Maks Stoyan', flag: '🇷🇺', record: '28-2 (24 KO)', ranking: 'WBC #3', threat: 'High', notes: 'Next opponent. Currently in Big Bear camp. New conditioning coach. Working body shots more than usual.' },
    { name: 'Yang Zhi Wei', flag: '🇨🇳', record: '27-2-1 (22 KO)', ranking: 'WBC #2', threat: 'High', notes: 'Potential future opponent if Stoyan win secured. Massive power. Slow feet. Age a factor (43).' },
    { name: 'Trevon Walsh', flag: '🇺🇸', record: '17-0 (15 KO)', ranking: 'WBO #4', threat: 'Medium', notes: 'Rising American prospect. Fast hands but untested at elite level. Possible WBO eliminator opponent.' },
    { name: 'Etienne Ngoma', flag: '🇨🇩', record: '21-1 (16 KO)', ranking: 'WBC #4', threat: 'Medium', notes: 'Physical and relentless. Awkward style. Possible WBC eliminator if Marcus beats Stoyan.' },
    { name: 'Kallum Wright', flag: '🇬🇧', record: '22-2 (21 KO)', ranking: 'IBF Champion', threat: 'High', notes: 'IBF champion. Massive puncher but questionable chin. Big domestic fight possibility.' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon="🎯" title="Opposition Scout" subtitle="Active scouting reports on current and potential future opponents." />

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <div className="text-sm font-semibold text-white mb-1">🤖 AI Scout + GPS Ring Strategy</div>
            <select value={scoutTarget} onChange={e => setScoutTarget(e.target.value)}
              className="w-full bg-[#0a0c14] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white">
              {['Maks Stoyan','Yang Zhi Wei','Trevon Walsh','Etienne Ngoma','Kallum Wright'].map(f=><option key={f}>{f}</option>)}
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
        <StatCard label="Primary Target" value="Stoyan" sub="Next fight — 48 days" color="orange" />
        <StatCard label="High Threats" value="3" sub="Stoyan, Yang, Wright" color="yellow" />
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
    { fight: `${fighter.name.split(' ').slice(-1)[0]} vs ${fighter.next_fight.opponent.split(' ').slice(-1)[0]}`, date: fighter.next_fight.date, broadcaster: fighter.next_fight.broadcast, territory: 'Global', estimated_viewers: '800k-1.2m', card_position: 'Main Event', notes: 'First PPV headliner. Meridian Sports investing heavily in promotion.' },
    { fight: 'Brennan vs Yang', date: 'TBD 2026', broadcaster: 'Continental Sport / Apex Sports Network+', territory: 'UK & US', estimated_viewers: '2-3m', card_position: 'N/A', notes: 'Key fight to watch — impacts WBC rankings.' },
    { fight: 'Wright vs Babic', date: 'Jun 2026', broadcaster: 'Meridian Sports', territory: 'Global', estimated_viewers: '500k', card_position: 'N/A', notes: 'IBF mandatory — could reshape IBF rankings.' },
    { fight: 'Levchenko vs TBD', date: 'Q3 2026', broadcaster: 'TBD', territory: 'TBD', estimated_viewers: 'TBD', card_position: 'N/A', notes: 'Undisputed champion defence — all belts at stake.' },
  ];

  const viewerHistory = [
    { fight: 'vs White (Nov 2025)', viewers: '620,000', platform: 'Meridian Sports', growth: '+45%' },
    { fight: 'vs Chisora (Jul 2025)', viewers: '430,000', platform: 'Meridian Sports', growth: '+22%' },
    { fight: 'vs Gorman (Mar 2025)', viewers: '350,000', platform: 'Meridian Sports', growth: '+15%' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon="📺" title="Broadcast Tracker" subtitle="Fight broadcasts, viewership data, and platform analytics." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Next Broadcast" value={fighter.next_fight.broadcast} sub={`${fighter.name.split(' ').slice(-1)[0]} vs ${fighter.next_fight.opponent.split(' ').slice(-1)[0]} — ${fighter.next_fight.date_short}`} color="red" />
        <StatCard label="Est. Viewers" value="800k-1.2m" sub="First PPV headliner" color="blue" />
        <StatCard label="Growth Trend" value="+45%" sub="vs last fight" color="green" />
        <StatCard label="Platform" value="Meridian Sports" sub="Exclusive broadcast" color="orange" />
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
        <div className="text-sm font-semibold text-white mb-4">{fighter.name} — Viewership History</div>
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
    { date: 'Apr 4, 2026', headline: 'WBC to order eliminator between #3 and #5 by end of summer', source: 'Boxing Scene', relevance: 'Direct', summary: 'If Marcus beats Stoyan and takes the #3 spot, he could be in line for a mandatory eliminator by Q4 2026. The WBC executive committee will vote at their May convention.' },
    { date: 'Apr 3, 2026', headline: 'Brennan considering retirement after Yang fight', source: 'Apex Sports Network', relevance: 'High', summary: 'If Brennan retires, the WBC title could become vacant, significantly accelerating the path to a title shot for top contenders including Marcus.' },
    { date: 'Apr 2, 2026', headline: 'Meridian Sports signs new multi-year deal with Titan Promotions', source: 'Variety', relevance: 'Medium', summary: 'Extended partnership ensures Marcus\'s fights will continue to be broadcast on Meridian Sports. The deal includes increased investment in fighter promotion and marketing.' },
    { date: 'Apr 1, 2026', headline: 'Saudi Arabia PIF exploring heavyweight boxing investments', source: 'Financial Times', relevance: 'Medium', summary: 'Saudi PIF reportedly looking to host major heavyweight fights in 2026-2027. Could create lucrative site fee opportunities for top contenders.' },
    { date: 'Mar 30, 2026', headline: 'IBF mandates Wright vs Babic by June 2026', source: 'Ring Magazine', relevance: 'Low', summary: 'IBF forces mandatory defence. While Marcus is IBF #12, this fight could reshuffle the top 10 and create movement opportunities.' },
    { date: 'Mar 28, 2026', headline: 'UK boxing viewership up 28% year-over-year on Meridian Sports', source: 'Broadcasting Journal', relevance: 'Medium', summary: 'Growing audience for UK boxing benefits Marcus\'s commercial profile. Increased viewership strengthens negotiating position for future PPV events.' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon="📰" title="Industry News" subtitle="Boxing industry news filtered for relevance to Marcus Cole's career." />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Stories This Week" value={news.length} sub="Filtered and analysed" color="red" />
        <StatCard label="Direct Relevance" value="1" sub="WBC eliminator order" color="orange" />
        <StatCard label="High Relevance" value="1" sub="Brennan retirement" color="yellow" />
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
            content: `You are a boxing GPS analyst for Marcus Cole (22-1, Heavyweight, Orthodox, 6'4"). His ring zone data from camp shows: Centre ${avgCentre}%, Ropes ${avgRopes}%, Corners ${avgCorners}%. Next opponent Maks Stoyan is WBC #3, southpaw, 28-2 with 24 KOs, known for controlling the centre ring. Generate 3 specific footwork drills to address the weaknesses shown in this zone data. Respond ONLY in JSON (no markdown): { "summary": "2 sentence overall footwork assessment", "drills": [{"name": "drill name", "description": "how to execute — 2 sentences", "reason": "why this addresses the zone data"}, ...3 items] }`
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
    w.document.write(`<!DOCTYPE html><html><head><title>Camp Load Report — Marcus Cole vs Maks Stoyan</title>
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
    <div class="meta">vs Maks Stoyan · Camp Days 15–${fighter.camp_day} of ${fighter.camp_total} · Generated ${new Date().toLocaleDateString('en-GB')} · CONFIDENTIAL — Team Only</div>
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
    <p style="font-style:italic;color:#444">Marcus is tracking well through the specific phase. ACWR peaked at ${peakACWR} — within acceptable range for this stage of camp. Ring zone data shows good centre-ring presence in early sparring sessions. Week 7 onward, we target ≥40% centre time as we build confidence working inside Stoyan's jab range.</p>
    <footer>Generated by Lumio Fight GPS · lumiofight.com · ${new Date().toLocaleDateString('en-GB')} · CONFIDENTIAL</footer>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  return (
    <div className="space-y-6">
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

const PUNCH_DATA = [
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
  const [shortlist, setShortlist] = useState<string[]>(() => {
    try { const s = typeof window !== 'undefined' ? localStorage.getItem('lumio_boxing_findpro_shortlist') : null; return s ? JSON.parse(s) : [] } catch { return [] }
  })
  const toggleShortlist = (id: string) => setShortlist(prev => {
    const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    try { localStorage.setItem('lumio_boxing_findpro_shortlist', JSON.stringify(next)) } catch {}
    return next
  })
  const TABS = [{ id: 'trainer' as const, label: 'Find Trainer', emoji: '🥊' },{ id: 'gym' as const, label: 'Find Gym', emoji: '🏋️' },{ id: 'sparring' as const, label: 'Find Sparring', emoji: '🤜' }]

  const q = (location + ' ' + style + ' ' + weightClass + ' ' + budget).toLowerCase().trim()
  const match = (item: object) => !q || JSON.stringify(item).toLowerCase().includes(q)
  const filteredTrainers = TRAINERS_ROSTER.filter(match)
  const filteredGyms     = GYMS_ROSTER.filter(match)
  const filteredSparring = SPARRING_ROSTER.filter(match)

  const mailto = (to: string, subj: string, body: string) =>
    `mailto:${to}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`
  const signoff = session.userName || fighter.name || 'Marcus'
  const weightLine = fighter.weight_class || 'Heavyweight'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-1"><span className="text-2xl">🔍</span><div><div className="text-lg font-bold text-white">Find a Pro</div><div className="text-xs" style={{ color: '#6B7280' }}>Trainers, gyms, and sparring partners — instant static demo roster</div></div></div>
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: '#0d1117' }}>
        {TABS.map(t => (<button key={t.id} onClick={() => setTab(t.id)} className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all" style={{ background: tab === t.id ? '#ef4444' : 'transparent', color: tab === t.id ? '#fff' : '#6B7280' }}>{t.emoji} {t.label}</button>))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-semibold text-gray-400 mb-1 block">Location</label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. London, Las Vegas" className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#0d1117', border: '1px solid #1F2937' }} /></div>
        <div><label className="text-xs font-semibold text-gray-400 mb-1 block">Weight Class</label><input value={weightClass} onChange={e => setWeightClass(e.target.value)} placeholder="e.g. Middleweight" className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#0d1117', border: '1px solid #1F2937' }} /></div>
        <div><label className="text-xs font-semibold text-gray-400 mb-1 block">Style Preference</label><input value={style} onChange={e => setStyle(e.target.value)} placeholder="e.g. Technical, pressure fighter" className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#0d1117', border: '1px solid #1F2937' }} /></div>
        <div><label className="text-xs font-semibold text-gray-400 mb-1 block">Budget</label><input value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. £500/week" className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#0d1117', border: '1px solid #1F2937' }} /></div>
      </div>
      <div className="rounded-lg px-3 py-2 text-[11px]" style={{ background: '#0d1117', border: '1px solid #1F2937', color: '#6B7280' }}>
        Demo data — wired to live search in full build. {shortlist.length > 0 && <span className="text-teal-400 ml-2">{shortlist.length} saved to shortlist</span>}
      </div>

      {tab === 'trainer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTrainers.map(t => {
            const saved = shortlist.includes(t.id)
            const initials = t.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
            return (
              <div key={t.id} className="rounded-xl p-4" style={{ background: '#0d1117', border: '1px solid #1F2937' }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#ef4444,#b91c1c)', color: '#fff' }}>{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{t.name}{t.nickname ? <span className="text-red-400 font-normal"> — &quot;{t.nickname}&quot;</span> : null}</div>
                    <div className="text-[11px] text-gray-500">{t.homeGym} · {t.location}</div>
                  </div>
                </div>
                <div className="space-y-1 text-[11px] text-gray-400 mb-3">
                  <div><span className="text-gray-500">Style:</span> {t.styles.join(' · ')}</div>
                  <div><span className="text-gray-500">Experience:</span> {t.yearsExperience} years</div>
                  <div><span className="text-gray-500">Rate:</span> {t.weekRate}</div>
                  {t.notableFighter && <div className="text-red-400/80">★ {t.notableFighter}</div>}
                  <div><span className="text-gray-500">Availability:</span> {t.availability}</div>
                </div>
                <div className="flex gap-2">
                  <a href={mailto(t.contact, `Camp enquiry — ${t.name}`, `Hi ${t.name.split(' ')[0]},\n\nI'm ${signoff} (${weightLine}). Looking for a trainer for my next camp — your ${t.style.toLowerCase()} style lines up with what I want to work on.\n\nCould we set up a call this week?\n\nBest,\n${signoff}`)} className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#ef4444', color: '#fff' }}>Contact</a>
                  <button onClick={() => toggleShortlist(t.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: saved ? '#14b8a6' : '#1F2937', color: saved ? '#0a0c14' : '#9CA3AF' }}>{saved ? '★ Saved' : '☆ Save'}</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'gym' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredGyms.map(g => {
            const saved = shortlist.includes(g.id)
            return (
              <div key={g.id} className="rounded-xl p-4" style={{ background: '#0d1117', border: '1px solid #1F2937' }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white">{g.name}</div>
                    <div className="text-[11px] text-gray-500">{g.location}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: g.access === 'Invite-only' ? 'rgba(245,158,11,0.15)' : g.access === 'Members' ? 'rgba(14,165,233,0.15)' : 'rgba(22,163,74,0.15)', color: g.access === 'Invite-only' ? '#f59e0b' : g.access === 'Members' ? '#0ea5e9' : '#22c55e' }}>{g.access}</span>
                </div>
                <p className="text-[11px] text-gray-400 mb-2">{g.description}</p>
                <div className="space-y-1 text-[11px] text-gray-400 mb-3">
                  <div><span className="text-gray-500">Trainers in-house:</span> {g.trainersInHouse}</div>
                  <div><span className="text-gray-500">Weekly rate:</span> {g.weeklyRate}</div>
                  <div className="text-gray-500">Facilities: <span className="text-gray-300">{g.facilities.join(' · ')}</span></div>
                  {g.notableFighters.length > 0 && <div className="text-red-400/80">★ {g.notableFighters.join(', ')}</div>}
                </div>
                <div className="flex gap-2">
                  <a href={mailto('bookings@' + g.name.toLowerCase().replace(/[^a-z]+/g,'') + '.com', `Camp enquiry — ${g.name}`, `Hi,\n\nI'm ${signoff} (${weightLine}). Looking for a gym base for my next camp. Interested in ${g.name} — ${g.access.toLowerCase()} access.\n\nCan you confirm availability + pro rate?\n\nThanks,\n${signoff}`)} className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#ef4444', color: '#fff' }}>Contact</a>
                  <button onClick={() => toggleShortlist(g.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: saved ? '#14b8a6' : '#1F2937', color: saved ? '#0a0c14' : '#9CA3AF' }}>{saved ? '★ Saved' : '☆ Save'}</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'sparring' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredSparring.map(s => {
            const saved = shortlist.includes(s.id)
            return (
              <div key={s.id} className="rounded-xl p-4" style={{ background: '#0d1117', border: '1px solid #1F2937' }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white">{s.name}</div>
                    <div className="text-[11px] text-gray-500">{s.weightClass} · {s.record}</div>
                  </div>
                </div>
                <div className="space-y-1 text-[11px] text-gray-400 mb-3">
                  <div><span className="text-gray-500">Style:</span> {s.style}</div>
                  <div><span className="text-gray-500">Best shot:</span> {s.bestShot}</div>
                  <div><span className="text-gray-500">Session rate:</span> {s.sessionRate}</div>
                  <div><span className="text-gray-500">Location:</span> {s.location}</div>
                  <div><span className="text-gray-500">Availability:</span> {s.availability.join(' · ')}</div>
                </div>
                <div className="flex gap-2">
                  <a href={mailto(s.contact, `Sparring enquiry — ${s.name}`, `Hi ${s.name.split(' ')[0]},\n\nI'm ${signoff} (${weightLine}). Looking for sparring work in the coming weeks.\n\nWhen are you next available?\n\nBest,\n${signoff}`)} className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#ef4444', color: '#fff' }}>Contact</a>
                  <button onClick={() => toggleShortlist(s.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: saved ? '#14b8a6' : '#1F2937', color: saved ? '#0a0c14' : '#9CA3AF' }}>{saved ? '★ Saved' : '☆ Save'}</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <BoxingAISection context="default" fighter={fighter} session={session} />
    </div>
  )
}

// ─── PUNCH ANALYTICS VIEW ─────────────────────────────────────────────────────
function PunchAnalyticsView({ fighter: _fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const totalJabsLanded = PUNCH_DATA.reduce((a,r)=>a+r.jabsLanded,0);
  const totalJabsThrown = PUNCH_DATA.reduce((a,r)=>a+r.jabsThrown,0);
  const totalPowerLanded = PUNCH_DATA.reduce((a,r)=>a+r.powerLanded,0);
  const totalPowerThrown = PUNCH_DATA.reduce((a,r)=>a+r.powerThrown,0);
  const totalLanded = totalJabsLanded + totalPowerLanded;
  const totalThrown = totalJabsThrown + totalPowerThrown;
  const avgCentre = Math.round(PUNCH_DATA.reduce((a,r)=>a+r.ringZone.centre,0)/PUNCH_DATA.length);
  return (
    <div className="space-y-6">
      <SectionHeader icon="🥊" title="Punch Analytics + GPS Fusion" subtitle="World's first combined Lumio Punch Analytics + Lumio ring movement data — sparring session analysis" />
      <div className="flex items-center gap-2.5 rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid #ef444430' }}>
        <span>🛰️</span>
        <span className="text-xs" style={{ color: '#94a3b8' }}>GPS ring movement data fused with punch metrics. <button onClick={() => { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('lumio-navigate', { detail: 'gps-heatmaps' })) }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>View Ring Heatmap →</button></span>
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
            {PUNCH_DATA.map((r, i) => {
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

  const daysUntilFight = fighter.next_fight.days_away
  const countdownLabel = daysUntilFight > 1
    ? `FIGHT NIGHT — T-${daysUntilFight} DAYS`
    : daysUntilFight === 1
      ? 'FIGHT NIGHT — TOMORROW'
      : daysUntilFight === 0
        ? 'FIGHT NIGHT — TODAY'
        : 'FIGHT NIGHT — COMPLETE'
  const isFightWeek = daysUntilFight <= 7 && daysUntilFight >= 0
  const subtitleCopy = isFightWeek
    ? 'Tonight\u2019s command centre — timeline, corner, strategy, broadcast, medical.'
    : `Fight night command centre (${daysUntilFight} days out) — timeline, corner, strategy, broadcast, medical.`

  const generateCornerSheet = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const latestGPS = GPS_SESSIONS.filter(s=>s.ring.centre>0).slice(-1)[0];
    w.document.write(`<!DOCTYPE html><html><head><title>Corner Sheet — ${fighter.name.split(' ').slice(-1)[0]} vs ${fighter.next_fight.opponent.split(' ').slice(-1)[0]}</title>
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
        <div style="font-size:13px;font-weight:700">${fighter.name} vs ${fighter.next_fight.opponent}</div>
        <div style="font-size:10px;color:#666">${fighter.next_fight.venue} · ${fighter.next_fight.date} · ${fighter.next_fight.broadcast} · ${fighter.weight_class}</div>
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
        <h2>Maks Stoyan</h2>
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
      <div class="zone-row"><span style="width:60px;font-size:10px;color:#666">Centre</span><div class="zone-bar"><div class="zone-fill" style="width:${latestGPS.ring.centre}%;background:#c0392b"></div></div><span style="font-size:10px;font-weight:700">${latestGPS.ring.centre}%</span><span style="font-size:9px;color:#888;margin-left:8px">Target: ≥45% — control the centre against Stoyan's southpaw jab</span></div>
      <div class="zone-row"><span style="width:60px;font-size:10px;color:#666">Ropes</span><div class="zone-bar"><div class="zone-fill" style="width:${latestGPS.ring.ropes}%;background:#e67e22"></div></div><span style="font-size:10px;font-weight:700">${latestGPS.ring.ropes}%</span><span style="font-size:9px;color:#888;margin-left:8px">Max 30% — don't let Stoyan trap you</span></div>
      <div class="zone-row"><span style="width:60px;font-size:10px;color:#666">Corners</span><div class="zone-bar"><div class="zone-fill" style="width:${latestGPS.ring.corners}%;background:#f1c40f"></div></div><span style="font-size:10px;font-weight:700">${latestGPS.ring.corners}%</span><span style="font-size:9px;color:#888;margin-left:8px">Max 20% — exit immediately when trapped</span></div>
    </div>` : '<div style="color:#888;font-size:10px">No GPS data — session not tracked</div>'}
    <div class="game-plan"><div style="font-size:10px;font-weight:700;margin-bottom:4px">⚡ Game Plan — Jim Bevan</div><div style="font-size:10px">Jab to centre position. Pull counter right hand when Stoyan throws his jab. Body shots from the clinch — left hook to body on the break. Do NOT let him work on the ropes. Rounds 1-4: establish jab, feel him out. R5-8: increase pressure, body work. R9+: take over.</div></div>
    <h2>Round-by-Round Notes</h2>
    <div class="round-grid">
      ${Array.from({length:12},(_,i)=>`<div class="round-box"><div class="round-num">R${i+1}</div><div class="round-notes"></div></div>`).join('')}
    </div>
    <div class="grid2">
      <div><h2>Cutman Notes</h2><div style="height:60px;border:1px solid #ddd;border-radius:4px;padding:6px;font-size:10px;color:#aaa">Cuts / swelling notes here...</div></div>
      <div><h2>Between Rounds — Key Reminders</h2><div style="font-size:10px;line-height:1.8">□ Breathe through nose between rounds<br/>□ Stay off the ropes in R1<br/>□ Work the body when in close<br/>□ Protect the chin against right hands<br/>□ Take water every round</div></div>
    </div>
    <footer><span>Lumio Fight · ${new Date().toLocaleDateString('en-GB')} · CONFIDENTIAL — Team Only</span><span>${fighter.name.split(' ').slice(-1)[0]} vs ${fighter.next_fight.opponent.split(' ').slice(-1)[0]} · ${fighter.next_fight.date} · ${fighter.next_fight.venue.split(',')[0]}</span></footer>
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
          <p className="text-sm text-gray-400 mt-1 ml-7">{subtitleCopy}</p>
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
            <div className="text-2xl font-bold text-white mb-1">{fighter.name} &ldquo;{fighter.nickname}&rdquo; vs {fighter.next_fight.opponent}</div>
            <div className="text-sm text-gray-300">{fighter.next_fight.venue}  ·  {fighter.next_fight.date}  ·  22:00 Ringwalk</div>
          </div>
          <div className="bg-red-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-lg flex-shrink-0">
            {countdownLabel}
          </div>
        </div>
      </div>

      {/* 2. TIMELINE */}
      <div className="bg-gray-950 border border-red-600/20 rounded-xl p-5">
        <div className="text-sm font-bold text-red-400 mb-4 uppercase tracking-wider">{isFightWeek ? 'Timeline' : `Fight night schedule — ${daysUntilFight} days away`}</div>
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
            { done: true,  text: 'Northbridge Sport producer briefed (3-minute feature pre-fight)' },
            { done: true,  text: 'Meridian Sports stream active — 180 countries' },
            { done: false, text: 'Post-fight interview confirmed (ring or backstage?)' },
            { done: false, text: 'Social media team ready for result graphic' },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/60">
              <span className={`text-base ${c.done ? 'text-green-400' : 'text-gray-600'}`}>{c.done ? '☑' : '☐'}</span>
              <span className={`text-xs ${c.done ? 'text-white' : 'text-gray-400'}`}>{c.text}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-3">Press contact: Sarah James, Titan — 07xxx</div>
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
            <div className="text-xs text-gray-400 mt-1">Last test 14 Apr — passed</div>
          </div>
          <div className="bg-black/40 border border-gray-800 rounded-lg p-3 md:col-span-2">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Brain scan</div>
            <div className="text-sm text-green-400 mt-0.5">MRI completed 14 Apr — cleared</div>
          </div>
        </div>
      </div>

      {/* 7. WEIGH-IN CONFIRMATION */}
      <div className="bg-gray-950 border border-red-600/20 rounded-xl p-5">
        <div className="text-sm font-bold text-red-400 mb-4 uppercase tracking-wider">Weigh-in confirmation</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/40 border border-gray-800 rounded-lg p-4 text-center">
            <div className="text-[10px] uppercase tracking-widest text-gray-500">Stoyan</div>
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
  trainer: { label: 'Trainer', icon: '🎽', accent: '#22C55E', sidebar: ['camp','training','sparring','opposition','gps','gps-heatmaps','weight','recovery','medical','teamoverview','trainernotes','briefing'], hiddenTabs: ['quickwins','dontmiss'], roundupChannels: ['trainer','medical'], message: 'Training and preparation view.' },
  manager: { label: 'Manager', icon: '💼', accent: '#F59E0B', sidebar: ['camp','rankings','mandatory','pathtotitle','pursebid','pursesim','earnings','campcosts','tax','contracts','sponsorships','media','appearances','managerdash','agentintel','promoterpipeline'], hiddenTabs: ['dailytasks'], roundupChannels: ['manager','promoter','sponsor'], message: 'Fights, contracts and commercial view.' },
  promoter: { label: 'Promoter', icon: '🏟️', accent: '#8B5CF6', sidebar: ['camp','rankings','pursebid','pursesim','earnings','broadcasttracker','news','promoterpipeline','fight-night'], hiddenTabs: ['dailytasks','team'], roundupChannels: ['promoter','broadcast'], message: 'Events and purse bids view.' },
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
  const [to, setTo] = useState('London City (LCY) — Millennium Dome')
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
    if (session?.isDemoShell !== false) {
      setBrief(CANNED.boxing.fightWeekBrief ?? '')
      setLoading(false)
      return
    }
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
  const [sponsor, setSponsor] = useState('Apex Performance')
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
            <div><label className="text-xs text-gray-500 mb-1 block">Sponsor</label><select value={sponsor} onChange={e => setSponsor(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}>{['Apex Performance','Meridian Sports','Vanta Sports','Kinetix Hydration','Northbridge Sport','BoXer'].map(s => <option key={s}>{s}</option>)}</select></div>
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
  const sponsorName = session.clubName || 'Apex Performance'
  const sponsorColor = '#D4AF37'
  const sponsorLogo = session.logoDataUrl

  const OBLIGATIONS = [
    { id:'o1', title:'Instagram post — camp kit photo', due:'Today', status:'pending', platform:'Instagram', reach:'180k' },
    { id:'o2', title:'Meridian Sports promo shoot — confirm logistics', due:'Today', status:'pending', platform:'Multi', reach:'2.4M' },
    { id:'o3', title:'Pre-fight press conference — wear sponsor kit', due:`${fighter.next_fight.days_away - 2}d`, status:'scheduled', platform:'TV/Press', reach:'3.2M' },
    { id:'o4', title:'Fight night walkout — branded robe', due:`${fighter.next_fight.days_away}d`, status:'upcoming', platform:'PPV', reach:'4.8M' },
    { id:'o5', title:'Post-fight interview — branded cap', due:`${fighter.next_fight.days_away}d`, status:'upcoming', platform:'TV/Social', reach:'6.1M' },
    { id:'o6', title:'Victory celebration social post', due:`${fighter.next_fight.days_away + 1}d`, status:'upcoming', platform:'Instagram', reach:'280k' },
  ]

  const CONTENT = [
    { title:'Camp training montage — Apex Performance kit', date:'2 Apr', type:'Video', platform:'Instagram', likes:'12.4k', reach:'340k' },
    { title:'Weigh-in countdown — Meridian Sports promo', date:'28 Mar', type:'Story', platform:'Instagram', likes:'8.1k', reach:'210k' },
    { title:'Sparring highlight reel', date:'25 Mar', type:'Video', platform:'TikTok', likes:'24.7k', reach:'680k' },
  ]

  const EVENTS = [
    { event:`vs ${fighter.next_fight.opponent} — ${fighter.next_fight.venue}`, date:fighter.next_fight.date, venue:fighter.next_fight.venue, broadcast:`${fighter.next_fight.broadcast}`, exposure:'Est. 4.8M PPV buys' },
    { event:'Weigh-in — Press Conference', date:`${fighter.next_fight.days_away - 1}d`, venue:fighter.next_fight.venue, broadcast:'Meridian Sports, Northbridge Sport News', exposure:'Est. 1.2M viewers' },
    { event:'Pre-fight press tour', date:`${fighter.next_fight.days_away - 7}d`, venue:'Multiple cities', broadcast:'Social / YouTube', exposure:'Est. 2.1M impressions' },
    { event:'Post-fight media obligations', date:`${fighter.next_fight.days_away + 1}d`, venue:fighter.next_fight.venue, broadcast:'Meridian Sports, Crown Broadcasting', exposure:'Est. 3.5M viewers' },
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
function BoxingSocialMediaAI({ onClose, fighter, isDemoShell }: { onClose: () => void; fighter: BoxingFighter; isDemoShell: boolean }) {
  const [topic, setTopic] = useState('')
  const [platforms, setPlatforms] = useState<Record<string, boolean>>({ Twitter: true, Instagram: true, LinkedIn: false, Facebook: false, TikTok: false })
  const [tone, setTone] = useState('Motivational')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    if (isDemoShell) {
      setResult(cleanResponse(CANNED.boxing.contentPlanner ?? ''))
      setLoading(false)
      return
    }
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
    { label: 'Millennium Dome, London', dest: 'London' },
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


// ─── TRAVEL & LOGISTICS ──────────────────────────────────────────────────────
// Inline types for the Travel Researcher (mirrors the tennis pattern).
interface BoxingFlightResult { airline: string; flightNo: string; departure: string; arrival: string; duration: string; stops: string; price: number; class: string; bookingUrl?: string; score: number }
interface BoxingHotelResult  { name: string; stars: number; area: string; distanceToVenue: string; pricePerNight: number; totalPrice: number; rating: number; amenities: string[]; bookingUrl?: string; score: number }

function BoxingTravelView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const [travelTabMode, setTravelTabMode] = useState<'overview' | 'researcher'>('overview')
  const [tStep,setTStep]=useState<1|2|3|4>(1)
  const [searching,setSearching]=useState(false)
  const [searchPhase,setSearchPhase]=useState('')
  const [flightResults,setFlightResults]=useState<BoxingFlightResult[]>([])
  const [hotelResults,setHotelResults]=useState<BoxingHotelResult[]>([])
  const [selectedFlight,setSelectedFlight]=useState<BoxingFlightResult|null>(null)
  const [selectedHotel,setSelectedHotel]=useState<BoxingHotelResult|null>(null)
  const [bookingEmail,setBookingEmail]=useState('')
  const [emailSent,setEmailSent]=useState(false)
  const [aiNarrative,setAiNarrative]=useState('')
  const [trOrigin,setTrOrigin]=useState('Sheffield (DSA)')
  const [trDest,setTrDest]=useState('')
  const [trTourney,setTrTourney]=useState('')
  const [trDepart,setTrDepart]=useState('')
  const [trReturn,setTrReturn]=useState('')
  const [trCabin,setTrCabin]=useState<'economy'|'premium_economy'|'business'>('economy')
  const [trMaxFlight,setTrMaxFlight]=useState('')
  const [trHotelBudget,setTrHotelBudget]=useState('')
  const trNights=4,trPax=1
  const [trGym,setTrGym]=useState(true)
  const [trVenue,setTrVenue]=useState(true)
  const [trEarly,setTrEarly]=useState(false)
  const [travelMode,setTravelMode]=useState<'full'|'flights'|'rooms'>('full')
  const [trBudgetTier,setTrBudgetTier]=useState<'budget'|'mid'|'luxe'>('mid')
  const [trKitchen,setTrKitchen]=useState(false)
  const [trShared,setTrShared]=useState(false)
  const [trSpa,setTrSpa]=useState(false)

  const UPCOMING=[
    {name:'vs Stoyan — fight night',           dest:'London (LCY)',     dates:'Sat 22 May · Millennium Dome'},
    {name:'Pre-fight press conference',         dest:'London (LCY)',     dates:'Thu 8 May · Hilton Park Lane'},
    {name:'Meridian Sports promo / open workout',          dest:'London (LCY)',     dates:'Mon 19 May · Boxpark Wembley'},
    {name:'Post-fight media tour (US)',         dest:'New York (JFK)',   dates:'Tentative · 27–30 May (TBC)'},
    {name:'Post-fight Meridian Sports interview',    dest:'Manchester (MAN)', dates:'Wed 27 May (drive)'},
    {name:'Mexico training camp (post-Stoyan)', dest:'Mexico City (MEX)',dates:'Tentative · Jul 2026'},
  ]

  const FLIGHT_FALLBACK:BoxingFlightResult[]=[
    {airline:'British Airways',flightNo:'BA1331',departure:'08:30 MAN',arrival:'09:45 LCY',duration:'1h 15m',stops:'Direct',price:118,class:trCabin,bookingUrl:'https://www.britishairways.com',score:91},
    {airline:'Loganair',       flightNo:'LM442', departure:'10:20 DSA',arrival:'11:35 LCY',duration:'1h 15m',stops:'Direct',price:142,class:trCabin,bookingUrl:'https://www.loganair.co.uk',     score:86},
    {airline:'easyJet',        flightNo:'EZY731',departure:'13:15 MAN',arrival:'14:30 LGW',duration:'1h 15m',stops:'Direct',price:62, class:trCabin,bookingUrl:'https://www.easyjet.com',       score:78},
    {airline:'Virgin Atlantic',flightNo:'VS3',   departure:'11:00 LHR',arrival:'13:50 JFK',duration:'7h 50m',stops:'Direct',price:387,class:trCabin,bookingUrl:'https://www.virginatlantic.com',score:74},
    {airline:'British Airways',flightNo:'BA0117',departure:'09:30 LHR',arrival:'12:25 JFK',duration:'7h 55m',stops:'Direct',price:412,class:trCabin,bookingUrl:'https://www.britishairways.com',score:71},
  ]
  const HOTEL_FALLBACKS:Record<'budget'|'mid'|'luxe',BoxingHotelResult[]>={
    budget:[
      {name:'Premier Inn London Greenwich',         stars:3,area:'Greenwich',                  distanceToVenue:'8 min taxi',  pricePerNight:78, totalPrice:312, rating:8.3,amenities:['WiFi','Restaurant','Gym'],         bookingUrl:'https://www.premierinn.com',   score:85},
      {name:'Travelodge London Excel',              stars:3,area:'Royal Docks',                distanceToVenue:'11 min taxi',pricePerNight:64, totalPrice:256, rating:8.0,amenities:['WiFi','Restaurant'],              bookingUrl:'https://www.travelodge.co.uk', score:81},
      {name:'Airbnb private room — Canary Wharf',   stars:0,area:'Canary Wharf',               distanceToVenue:'14 min taxi',pricePerNight:55, totalPrice:220, rating:4.7,amenities:['Kitchen','WiFi','Self check-in'],bookingUrl:'https://www.airbnb.com',       score:79},
      {name:'Holiday Inn Express Greenwich',        stars:3,area:'Greenwich',                  distanceToVenue:'9 min taxi',  pricePerNight:88, totalPrice:352, rating:8.2,amenities:['Breakfast','WiFi','Gym'],         bookingUrl:'https://www.ihg.com',          score:76},
    ],
    mid:[
      {name:'Canary Wharf Marriott',                stars:4,area:'Canary Wharf',               distanceToVenue:'4 min taxi',  pricePerNight:189,totalPrice:756, rating:8.6,amenities:['Gym','Spa','Restaurant','WiFi'], bookingUrl:'https://www.marriott.com',      score:92},
      {name:'InterContinental London — The O2',     stars:5,area:'O2 Arena',                   distanceToVenue:'2 min walk',  pricePerNight:265,totalPrice:1060,rating:9.0,amenities:['Gym','Pool','Spa','Restaurant'], bookingUrl:'https://www.ihg.com',           score:90},
      {name:'Hilton London Canary Wharf',           stars:4,area:'Canary Wharf',               distanceToVenue:'6 min taxi',  pricePerNight:178,totalPrice:712, rating:8.5,amenities:['Gym','Restaurant','Bar'],         bookingUrl:'https://www.hilton.com',        score:87},
      {name:'Novotel London Excel',                 stars:4,area:'Royal Docks',                distanceToVenue:'10 min taxi',pricePerNight:142,totalPrice:568, rating:8.3,amenities:['Gym','Pool','Restaurant'],        bookingUrl:'https://www.accor.com',         score:80},
    ],
    luxe:[
      {name:'The Savoy',                            stars:5,area:'Strand',                     distanceToVenue:'30 min taxi',pricePerNight:680,totalPrice:2720,rating:9.4,amenities:['Spa','Pool','Concierge','Suite'],bookingUrl:'https://www.thesavoylondon.com',score:94},
      {name:'Four Seasons Park Lane',               stars:5,area:'Mayfair',                    distanceToVenue:'35 min taxi',pricePerNight:725,totalPrice:2900,rating:9.5,amenities:['Spa','Pool','Concierge','Suite'],bookingUrl:'https://www.fourseasons.com',   score:93},
      {name:'The Berkeley',                         stars:5,area:'Knightsbridge',              distanceToVenue:'38 min taxi',pricePerNight:610,totalPrice:2440,rating:9.3,amenities:['Spa','Pool','Suite'],            bookingUrl:'https://www.the-berkeley.co.uk',score:90},
      {name:'Mandarin Oriental Hyde Park',          stars:5,area:'Knightsbridge',              distanceToVenue:'37 min taxi',pricePerNight:585,totalPrice:2340,rating:9.4,amenities:['Spa','Pool','Concierge'],        bookingUrl:'https://www.mandarinoriental.com',score:88},
    ],
  }

  const includeFlights = travelMode !== 'rooms'
  const includeHotels  = travelMode !== 'flights'

  const runSearch=async()=>{
    setSearching(true);setTStep(2);setFlightResults([]);setHotelResults([]);setAiNarrative('')
    try{
      if(includeFlights){
        setSearchPhase('✈️ Searching flights from '+trOrigin+' to '+trDest+'...')
        await new Promise(r=>setTimeout(r,800))
        setSearchPhase('💰 Comparing fares...')
        if(session.isDemoShell !== false){
          setFlightResults(FLIGHT_FALLBACK)
        } else {
          try{
            const fr=await fetch('/api/ai/boxing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`Find 5 flights ${trOrigin} to ${trDest}, depart ${trDepart}, return ${trReturn}, ${trCabin}${trMaxFlight?' max £'+trMaxFlight:''}. JSON array only matching: [{"airline":"","flightNo":"","departure":"","arrival":"","duration":"","stops":"","price":0,"class":"${trCabin}","bookingUrl":"https://www.skyscanner.net","score":0}]. Realistic for boxer fight-week travel. Sort by score desc.`}]})})
            const fd=await fr.json();const ft=fd.content?.filter((b:{type:string})=>b.type==='text')?.map((b:{text:string})=>b.text)?.join('')||''
            setFlightResults(JSON.parse(ft.replace(/```json|```/g,'').trim()))
          }catch{setFlightResults(FLIGHT_FALLBACK)}
        }
      }
      if(includeHotels){
        setSearchPhase('🏨 Searching hotels...')
        await new Promise(r=>setTimeout(r,700))
        if(travelMode==='rooms'){
          setHotelResults(HOTEL_FALLBACKS[trBudgetTier])
        } else if(session.isDemoShell !== false){
          setHotelResults(HOTEL_FALLBACKS.mid)
        } else {
          try{
            const hr=await fetch('/api/ai/boxing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`Find 4 hotels near ${trTourney||trDest}, ${trNights} nights from ${trDepart}. ${trHotelBudget?'Max £'+trHotelBudget+'/night.':'Best value, near venue.'} Need: ${[trGym&&'Gym',trVenue&&'Venue-adjacent',trEarly&&'Early check-in'].filter(Boolean).join(', ')||'Standard'}. JSON array: [{"name":"","stars":4,"area":"","distanceToVenue":"","pricePerNight":0,"totalPrice":0,"rating":8.5,"amenities":[],"bookingUrl":"https://www.booking.com","score":0}]. Sort by score.`}]})})
            const hd=await hr.json();const ht=hd.content?.filter((b:{type:string})=>b.type==='text')?.map((b:{text:string})=>b.text)?.join('')||''
            setHotelResults(JSON.parse(ht.replace(/```json|```/g,'').trim()))
          }catch{setHotelResults(HOTEL_FALLBACKS.mid)}
        }
      }
      const f0 = includeFlights ? (flightResults[0] ?? FLIGHT_FALLBACK[0]) : null
      const h0 = includeHotels ? (hotelResults[0] ?? (travelMode==='rooms' ? HOTEL_FALLBACKS[trBudgetTier][0] : HOTEL_FALLBACKS.mid[0])) : null
      if(f0 && h0)      setAiNarrative(`Best: ${f0.airline} £${f0.price} + ${h0.name} £${h0.pricePerNight}/night. Total est: £${(f0.price*trPax+h0.totalPrice).toLocaleString()}.`)
      else if(f0)       setAiNarrative(`Best flight: ${f0.airline} £${f0.price}. Direct ${f0.duration} ${f0.departure}→${f0.arrival}.`)
      else if(h0)       setAiNarrative(`Best ${trBudgetTier === 'budget' ? 'budget room' : trBudgetTier === 'luxe' ? 'flagship hotel' : 'hotel'}: ${h0.name} £${h0.pricePerNight}/night. Total ${trNights} nights: £${h0.totalPrice.toLocaleString()}.`)
      setTStep(3)
    }catch(e){console.error(e)}
    setSearching(false);setSearchPhase('')
  }

  const genEmail=()=>{if(!selectedFlight&&!selectedHotel)return;setBookingEmail([`Subject: Travel — ${trTourney||trDest} — ${session.userName||fighter.name}`,'',`Hi Danny,`,'',`Please book the following for ${session.userName||fighter.name} (WBC #${fighter.rankings?.wbc ?? 6}):`,selectedFlight?`\n✈️ ${selectedFlight.airline} (${selectedFlight.flightNo})\n${trOrigin} → ${trDest}\nDepart: ${trDepart}\nClass: ${selectedFlight.class}\nPrice: £${selectedFlight.price*trPax}\nBook: ${selectedFlight.bookingUrl}`:'',selectedHotel?`\n🏨 ${selectedHotel.name} (${selectedHotel.stars>0?selectedHotel.stars+'★':'Airbnb'})\nCheck-in: ${trDepart}\nNights: ${trNights}\nPrice: £${selectedHotel.totalPrice}\nBook: ${selectedHotel.bookingUrl}${trEarly?'\nEarly check-in requested.':''}`:'',`\nTotal: £${((selectedFlight?.price??0)*trPax+(selectedHotel?.totalPrice??0)).toLocaleString()}`,'','Thanks',session.userName||fighter.name].filter(Boolean).join('\n'));setTStep(4)}

  const ScBadge=({s}:{s:number})=><div className={`text-[10px] px-2 py-1 rounded-full font-bold ${s>=90?'bg-green-600/20 text-green-400':s>=75?'bg-red-600/20 text-red-400':s>=60?'bg-amber-600/20 text-amber-400':'bg-gray-800 text-gray-500'}`}>{s} Lumio</div>

  const bookingComUrl = `https://www.booking.com/search.html?ss=${encodeURIComponent(trDest)}${trDepart?`&checkin=${trDepart}`:''}${trReturn?`&checkout=${trReturn}`:''}`
  const airbnbUrl     = `https://www.airbnb.com/s/${encodeURIComponent(trDest)}/homes${trDepart?`?checkin=${trDepart}`:''}${trReturn?`${trDepart?'&':'?'}checkout=${trReturn}`:''}`

  const ROOM_DEST_CHIPS = ['London','Manchester','Sheffield','New York','Las Vegas','Mexico City','Dublin','Manama']

  const cta = travelMode === 'flights' ? '🔍 Search flights →' : travelMode === 'rooms' ? '🔍 Search rooms →' : '🔍 Search flights & hotels →'
  const searchDisabled = !trDest || !trDepart

  // ─── OVERVIEW (landing) ───────────────────────────────────────────────────
  if (travelTabMode === 'overview') {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-black text-white">Travel &amp; Logistics</h2>
            <p className="text-sm text-gray-400 mt-1">Camp transit, fight-week travel, and post-fight media tours.</p>
          </div>
          <button
            onClick={() => setTravelTabMode('researcher')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:opacity-90"
            style={{ background: '#dc2626', boxShadow: '0 4px 14px rgba(220,38,38,0.35)' }}
          >
            <span>✈️</span><span>Plan new trip</span>
          </button>
        </div>

        <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-600/30 rounded-xl p-5">
          <div className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">TODAY&apos;S TRAVEL</div>
          <div className="text-white font-bold text-lg">In camp — Sheffield. No travel this week.</div>
          <div className="text-sm text-gray-400 mt-1">Next journey: <span className="text-red-300 font-semibold">Thu 21 May Sheffield → London</span> for fight-week press at Hilton Park Lane.</div>
          <div className="text-sm text-gray-400 mt-1">Fight-week hotel: Canary Wharf Marriott (4 nights, gym + spa) — corner team flights booked BA LHR→LCY.</div>
          <div className="text-sm text-gray-400 mt-1">Halden Motors courtesy car for camp-to-London transport — Danny coordinating pickup.</div>
        </div>

        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-3">This Month&rsquo;s Travel</div>
          <div className="space-y-2">
            {[
              { date: 'May 23', route: 'Sheffield → London (drive)',    reason: 'Pre-fight press conference (Hilton Park Lane)' },
              { date: 'Jun 3',  route: 'Sheffield → London (drive)',    reason: 'Meridian Sports open workout (Boxpark Wembley)' },
              { date: 'Jun 5',  route: 'Sheffield → London (drive)',    reason: 'Fight-week hotel check-in' },
              { date: fighter.next_fight.date_short || 'Jun 6', route: 'In London',           reason: `Fight night vs ${fighter.next_fight.opponent.split(' ').slice(-1)[0]} · ${fighter.next_fight.venue.split(',')[0].replace(/^The\s+/, '')}` },
              { date: 'Jun 7',  route: 'London → Sheffield',             reason: 'Post-fight return' },
              { date: 'Jun 11', route: 'Sheffield → Manchester (drive)', reason: 'Meridian Sports post-fight interview' },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50 last:border-0">
                <span className="text-xs text-red-400 font-medium w-14">{t.date}</span>
                <span className="text-sm text-gray-200 flex-1">{t.route}</span>
                <span className="text-xs text-gray-500">{t.reason}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl p-4 text-center bg-[#0d0f1a] border border-gray-800"><div className="text-xl font-black text-red-400">11</div><div className="text-xs text-gray-300 font-semibold mt-1">Flights</div><div className="text-[10px] text-gray-600 mt-0.5">This season</div></div>
          <div className="rounded-xl p-4 text-center bg-[#0d0f1a] border border-gray-800"><div className="text-xl font-black text-teal-400">3</div><div className="text-xs text-gray-300 font-semibold mt-1">Countries</div><div className="text-[10px] text-gray-600 mt-0.5">Visited</div></div>
          <div className="rounded-xl p-4 text-center bg-[#0d0f1a] border border-gray-800"><div className="text-xl font-black text-orange-400">24</div><div className="text-xs text-gray-300 font-semibold mt-1">Hotel Nights</div><div className="text-[10px] text-gray-600 mt-0.5">Season</div></div>
        </div>

        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-3">Visa &amp; Entry Requirements</div>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="py-1.5 border-b border-gray-800/50">USA — potential post-fight media tour (May 27–30): ESTA active until 2027 · No action needed.</div>
            <div className="py-1.5 border-b border-gray-800/50">Ireland — Dec 2026 title defence rumour (Dublin 3Arena): GBR passport — common travel area, no visa.</div>
            <div className="py-1.5">Mexico — possible 2027 fight (Mexico City Arena): GBR passport — visa on arrival, 180 days, free.</div>
          </div>
        </div>
      </div>
    )
  }

  // ─── RESEARCHER (4-step wizard, 3-mode switcher) ──────────────────────────
  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => setTravelTabMode('overview')} className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1.5 transition-colors">
        <span>&larr;</span><span>Back to travel overview</span>
      </button>
      <div><div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest bg-gray-800 px-2 py-0.5 rounded">TR-FLIGHTS-01</span><span className="text-[10px] font-bold text-red-400 bg-red-600/10 px-2 py-0.5 rounded border border-red-600/30">AI Research Agent</span></div><h2 className="text-xl font-black text-white">Travel Researcher</h2><p className="text-sm text-gray-400">Flights, hotels, and a booking email in under 60 seconds.</p></div>
      <div className="flex items-center gap-2 mb-4">{[{n:1,l:'Configure'},{n:2,l:'Research'},{n:3,l:'Results'},{n:4,l:'Book'}].map((s,i)=><div key={s.n} className="flex items-center gap-2"><div className="flex flex-col items-center gap-1"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${tStep===s.n?'bg-red-600 text-white':tStep>s.n?'bg-green-500 text-white':'bg-gray-800 text-gray-500'}`}>{tStep>s.n?'✓':s.n}</div><span className={`text-[10px] ${tStep===s.n?'text-red-400 font-semibold':'text-gray-600'}`}>{s.l}</span></div>{i<3&&<div className={`h-px w-12 mb-4 ${tStep>s.n?'bg-green-500':'bg-gray-800'}`}/>}</div>)}</div>

      {tStep===1 && (
        <div className="space-y-6">
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-2 grid grid-cols-3 gap-1">
            {([
              { id:'full' as const,    icon:'✈️🏨', label:'Full trip',    sub:'Flights + hotel' },
              { id:'flights' as const, icon:'✈️',   label:'Flights only', sub:'Skip the hotel' },
              { id:'rooms' as const,   icon:'🏨',   label:'Room only',    sub:'Hotel / Airbnb only' },
            ]).map(m => (
              <button key={m.id} onClick={() => setTravelMode(m.id)}
                className={`px-3 py-3 rounded-xl text-xs text-center border transition-all ${travelMode===m.id ? 'border-red-500 bg-red-600/10 text-white' : 'border-transparent text-gray-500 hover:text-white'}`}>
                <div className="text-base mb-0.5">{m.icon}</div>
                <div className="font-bold">{m.label}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{m.sub}</div>
              </button>
            ))}
          </div>

          {travelMode !== 'rooms' && (
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-6"><h3 className="text-sm font-bold text-white mb-1">Which fight / event?</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">{UPCOMING.map(t=><button key={t.name} onClick={()=>{setTrTourney(t.name);setTrDest(t.dest)}} className={`px-4 py-3 rounded-xl text-left text-xs border ${trTourney===t.name?'border-red-500 bg-red-600/10 text-white':'border-gray-800 text-gray-400 hover:text-white'}`}><div className="font-semibold">{t.name}</div><div className="text-[10px] text-gray-600 mt-0.5">{t.dates}</div></button>)}</div></div>
          )}

          {travelMode !== 'rooms' && (
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-6"><h3 className="text-sm font-bold text-white mb-4">Route &amp; dates</h3><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] text-gray-500 uppercase mb-1 block">From</label><input defaultValue={trOrigin} onBlur={e=>setTrOrigin(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white"/></div><div><label className="text-[10px] text-gray-500 uppercase mb-1 block">To</label><input value={trDest} onChange={e=>setTrDest(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white"/></div><div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Depart</label><input type="date" value={trDepart} onChange={e=>setTrDepart(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white"/></div><div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Return</label><input type="date" value={trReturn} onChange={e=>setTrReturn(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white"/></div></div></div>
          )}

          {travelMode === 'rooms' && (
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Destination &amp; dates</h3>
                <p className="text-[11px] text-gray-500 mb-3">City or arena area. No fight needed.</p>
                <div className="flex flex-wrap gap-2 mb-3">{ROOM_DEST_CHIPS.map(c => <button key={c} onClick={()=>setTrDest(c)} className={`px-3 py-1.5 rounded-lg text-xs border ${trDest===c?'border-red-500 bg-red-600/10 text-white':'border-gray-800 text-gray-500 hover:text-white'}`}>{c}</button>)}</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Where</label><input value={trDest} onChange={e=>setTrDest(e.target.value)} placeholder="City or venue" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white"/></div>
                  <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Check-in</label><input type="date" value={trDepart} onChange={e=>setTrDepart(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white"/></div>
                  <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Check-out</label><input type="date" value={trReturn} onChange={e=>setTrReturn(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white"/></div>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase mb-2 block">Budget tier</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id:'budget' as const, label:'Budget',  sub:'£30-£60/night',  hint:'Hostels, Airbnb private rooms, budget chains' },
                    { id:'mid' as const,    label:'Mid',     sub:'£90-£180/night', hint:'Standard 3-4★ hotels' },
                    { id:'luxe' as const,   label:'Luxe',    sub:'£250+/night',    hint:'Flagship hotels, suites' },
                  ]).map(t => (
                    <button key={t.id} onClick={()=>setTrBudgetTier(t.id)} className={`px-3 py-3 rounded-xl text-left border text-xs ${trBudgetTier===t.id?'border-red-500 bg-red-600/10 text-white':'border-gray-800 text-gray-500 hover:text-white'}`}>
                      <div className="font-bold">{t.label}</div>
                      <div className="text-[10px] mt-0.5 opacity-70">{t.sub}</div>
                      <div className="text-[10px] mt-1 opacity-50">{t.hint}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase mb-2 block">Preferences</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(trBudgetTier==='budget'
                    ? [{v:trShared,s:setTrShared,l:'Shared room OK'},{v:trKitchen,s:setTrKitchen,l:'Kitchen access'},{v:trEarly,s:setTrEarly,l:'Early check-in'},{v:trVenue,s:setTrVenue,l:'Near venue'}]
                    : trBudgetTier==='luxe'
                      ? [{v:trSpa,s:setTrSpa,l:'Spa'},{v:trVenue,s:setTrVenue,l:'Near venue'},{v:trGym,s:setTrGym,l:'Gym'},{v:trEarly,s:setTrEarly,l:'Suite preferred'}]
                      : [{v:trGym,s:setTrGym,l:'Gym'},{v:trVenue,s:setTrVenue,l:'Near venue'},{v:trEarly,s:setTrEarly,l:'Late check-out'},{v:trKitchen,s:setTrKitchen,l:'Workspace'}]
                  ).map(r=>
                    <button key={r.l} onClick={()=>r.s(!r.v)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border text-left ${r.v?'border-red-500 bg-red-600/10 text-white':'border-gray-800 text-gray-500'}`}><span>{r.v?'✓':'○'}</span>{r.l}</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {travelMode !== 'rooms' && (
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-6"><h3 className="text-sm font-bold text-white mb-4">Preferences</h3><div className={`grid ${travelMode==='full' ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}><div><label className="text-[10px] text-gray-500 uppercase mb-2 block">Cabin</label>{([{id:'economy' as const,l:'Economy'},{id:'premium_economy' as const,l:'Premium Econ'},{id:'business' as const,l:'Business'}]).map(c=><button key={c.id} onClick={()=>setTrCabin(c.id)} className={`w-full mb-1.5 px-3 py-2 rounded-xl text-xs text-left border ${trCabin===c.id?'border-red-500 bg-red-600/10 text-white':'border-gray-800 text-gray-400'}`}>{c.l}</button>)}</div><div><label className="text-[10px] text-gray-500 uppercase mb-2 block">Flight max (£)</label><input type="number" defaultValue={trMaxFlight} onBlur={e=>setTrMaxFlight(e.target.value)} placeholder="200" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white mb-3"/>{travelMode==='full' && <><label className="text-[10px] text-gray-500 uppercase mb-2 block">Hotel (£/night)</label><input type="number" defaultValue={trHotelBudget} onBlur={e=>setTrHotelBudget(e.target.value)} placeholder="200" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white"/></>}</div>{travelMode==='full' && <div><label className="text-[10px] text-gray-500 uppercase mb-2 block">Hotel needs</label>{[{v:trVenue,s:setTrVenue,l:'Near venue'},{v:trGym,s:setTrGym,l:'Gym'},{v:trEarly,s:setTrEarly,l:'Early check-in'}].map(r=><button key={r.l} onClick={()=>r.s(!r.v)} className={`w-full mb-1.5 flex items-center gap-2 px-3 py-2 rounded-xl text-xs border text-left ${r.v?'border-red-500 bg-red-600/10 text-white':'border-gray-800 text-gray-500'}`}><span>{r.v?'✓':'○'}</span>{r.l}</button>)}</div>}</div></div>
          )}

          <button onClick={runSearch} disabled={searchDisabled} className="w-full py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-40" style={{background:searchDisabled?'#374151':'linear-gradient(135deg, #dc2626, #b91c1c)'}}>{cta}</button>
        </div>
      )}

      {tStep===2&&searching&&(<div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-12 text-center"><div className="text-4xl mb-6 animate-bounce">{travelMode==='rooms'?'🏨':'✈️'}</div><h3 className="text-lg font-bold text-white mb-2">Searching...</h3><p className="text-sm text-red-400 mb-4">{searchPhase}</p></div>)}

      {tStep===3 && (
        <div className="space-y-6">
          {aiNarrative && <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4 flex items-start gap-3"><span>🤖</span><div><div className="text-xs font-bold text-red-400 mb-1">AI Recommendation</div><p className="text-xs text-gray-300">{aiNarrative}</p></div></div>}
          {includeFlights && (
            <div><h3 className="text-sm font-bold text-white mb-3">✈️ Flights — {trOrigin} → {trDest}</h3><div className="space-y-2">{flightResults.map((f,i)=><button key={i} onClick={()=>setSelectedFlight(selectedFlight?.flightNo===f.flightNo?null:f)} className={`w-full text-left rounded-xl border p-4 ${selectedFlight?.flightNo===f.flightNo?'border-red-500 bg-red-600/10':'border-gray-800 bg-[#0d1117] hover:border-gray-700'}`}><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className={`w-4 h-4 rounded-full border ${selectedFlight?.flightNo===f.flightNo?'bg-red-500 border-red-500':'border-gray-600'}`}/><div><div className="text-xs font-bold text-white">{f.airline}</div><div className="text-[10px] text-gray-500">{f.flightNo} · {f.stops}</div></div><div className="text-xs text-gray-300">{f.departure}→{f.arrival}</div><div className="text-xs text-gray-500">{f.duration}</div></div><div className="flex items-center gap-3"><ScBadge s={f.score}/><div className="text-sm font-black text-white">£{f.price}</div>{i===0&&<span className="text-[9px] px-2 py-0.5 rounded-full bg-green-600/20 text-green-400 font-bold">Best</span>}</div></div></button>)}</div></div>
          )}
          {includeHotels && (
            <div>
              <h3 className="text-sm font-bold text-white mb-3">🏨 {travelMode==='rooms' ? (trBudgetTier==='budget' ? 'Budget rooms' : trBudgetTier==='luxe' ? 'Flagship hotels' : 'Hotels') : 'Hotels'} — {trDest}</h3>
              <div className="grid grid-cols-2 gap-3">{hotelResults.map((h,i)=><button key={i} onClick={()=>setSelectedHotel(selectedHotel?.name===h.name?null:h)} className={`text-left rounded-xl border p-4 ${selectedHotel?.name===h.name?'border-red-500 bg-red-600/10':'border-gray-800 bg-[#0d1117] hover:border-gray-700'}`}><div className="flex items-start justify-between mb-2"><div className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full border mt-0.5 ${selectedHotel?.name===h.name?'bg-red-500 border-red-500':'border-gray-600'}`}/><div><div className="text-xs font-bold text-white">{h.name}</div><div className="text-[10px] text-gray-500">{h.stars>0?'★'.repeat(h.stars):'Airbnb'} · {h.area}</div></div></div><ScBadge s={h.score}/></div><div className="text-[10px] text-gray-500 ml-6 mb-2">📍 {h.distanceToVenue} · ⭐ {h.rating}</div><div className="flex flex-wrap gap-1 ml-6 mb-2">{h.amenities.map((a,j)=><span key={j} className={`text-[9px] px-1.5 py-0.5 rounded ${a==='Gym'||a==='Spa'||a==='Concierge'?'bg-green-600/20 text-green-400':'bg-gray-800 text-gray-500'}`}>{a}</span>)}</div><div className="flex justify-between ml-6"><span className="text-[10px] text-gray-500">£{h.pricePerNight}/night</span><span className="text-sm font-black text-white">£{h.totalPrice.toLocaleString()}</span></div>{i===0&&<div className="mt-2 ml-6 text-[9px] text-green-400 font-bold">✓ Recommended</div>}</button>)}</div>
              {travelMode === 'rooms' && (
                <div className="mt-4 bg-[#0d0f1a] border border-red-600/30 rounded-xl p-4">
                  <div className="text-xs font-bold text-white mb-3">Or browse direct</div>
                  <div className="grid grid-cols-2 gap-3">
                    <a href={bookingComUrl} target="_blank" rel="noreferrer" className="text-center py-3 rounded-xl border border-blue-600/30 bg-blue-600/5 text-blue-400 hover:bg-blue-600/10 hover:text-blue-300 text-xs font-semibold">🔍 Search on booking.com →</a>
                    <a href={airbnbUrl}     target="_blank" rel="noreferrer" className="text-center py-3 rounded-xl border border-pink-600/30 bg-pink-600/5 text-pink-400 hover:bg-pink-600/10 hover:text-pink-300 text-xs font-semibold">🔍 Search on Airbnb →</a>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-2">Pre-populated with your destination{trDepart && ' + check-in'}{trReturn && ' + check-out'}.</div>
                </div>
              )}
            </div>
          )}
          {(selectedFlight||selectedHotel) && <div className="bg-[#0d1117] border border-red-600/30 rounded-xl p-4 flex items-center justify-between"><div><div className="text-xs font-bold text-white">Selected</div><div className="text-[10px] text-gray-500">{selectedFlight&&`✈️ ${selectedFlight.airline} £${selectedFlight.price*trPax}`}{selectedFlight&&selectedHotel&&' + '}{selectedHotel&&`🏨 ${selectedHotel.name} £${selectedHotel.totalPrice}`}</div></div><div className="text-2xl font-black text-white">£{((selectedFlight?.price??0)*trPax+(selectedHotel?.totalPrice??0)).toLocaleString()}</div></div>}
          <div className="flex gap-3"><button onClick={genEmail} disabled={!selectedFlight&&!selectedHotel} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40" style={{background:(!selectedFlight&&!selectedHotel)?'#374151':'#dc2626'}}>📧 Booking email →</button><button onClick={()=>{setTStep(1);setFlightResults([]);setHotelResults([]);setSelectedFlight(null);setSelectedHotel(null)}} className="px-4 py-3 rounded-xl text-xs border border-gray-700 text-gray-400 hover:text-white">↺ New</button></div>
        </div>
      )}

      {tStep===4&&(<div className="space-y-5"><div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-6"><h3 className="text-sm font-bold text-white mb-4">📧 Booking email</h3><textarea value={bookingEmail} onChange={e=>setBookingEmail(e.target.value)} rows={16} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-xs text-gray-300 font-mono resize-none"/></div>{emailSent?<div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4 text-center"><span className="text-2xl">✅</span><div className="text-sm font-bold text-green-400 mt-2">Email opened</div></div>:<div className="flex gap-3"><button onClick={()=>{window.open(`mailto:danny@walshmanagement.co.uk?subject=${encodeURIComponent(`Travel — ${trTourney||trDest}`)}&body=${encodeURIComponent(bookingEmail)}`);setEmailSent(true)}} className="flex-1 py-4 rounded-xl text-sm font-bold text-white" style={{background:'#dc2626'}}>📧 Send →</button><button onClick={()=>navigator.clipboard?.writeText(bookingEmail)} className="px-4 py-4 rounded-xl text-xs border border-gray-700 text-gray-400">📋 Copy</button></div>}<button onClick={()=>{setTStep(1);setFlightResults([]);setHotelResults([]);setSelectedFlight(null);setSelectedHotel(null);setBookingEmail('');setEmailSent(false)}} className="text-xs text-gray-600 hover:text-gray-400 block mx-auto">← New search</button></div>)}
    </div>
  )
}

// ─── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function BoxingPortalPage() {
  const [authChecked, setAuthChecked] = useState(false)
  const [authSession, setAuthSession] = useState<SportsDemoSession | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('sports_profiles')
            .select('sport, display_name, nickname, avatar_url, brand_name, brand_logo_url, enabled_features, onboarding_complete, portal_slug, invites')
            .eq('id', user.id)
            .maybeSingle()
          if (profile && profile.sport === 'boxing') {
            if (!profile.onboarding_complete) { window.location.href = '/boxing/app'; return }
            setAuthSession({
              email: user.email ?? '',
              userName: profile.display_name ?? '',
              clubName: profile.brand_name ?? '',
              role: 'player',
              photoDataUrl: profile.avatar_url ?? null,
              logoDataUrl: profile.brand_logo_url ?? null,
              sport: 'boxing',
              verifiedAt: new Date().toISOString(),
              isDemoShell: false,
              enabledFeatures: profile.enabled_features || [],
              invites: profile.invites || [],
              nickname: profile.nickname ?? null,
            })
          }
        }
      } catch {} finally { setAuthChecked(true) }
    })()
  }, [])

  if (!authChecked) return (
    <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 11, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading…</div>
    </div>
  )
  if (authSession) {
    const handleSignOut = async () => {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      await supabase.auth.signOut()
      window.location.href = '/sports-login'
    }
    return <BoxingPortalInner session={authSession} onSignOut={handleSignOut} />
  }
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

// Static fight-camp AI content used in demo shells to avoid two live
// /api/ai/boxing hits when camp is activated. Persona: Marcus Cole vs Viktor
// Stoyan fight camp, Sheffield.
const DEMO_BOXING_CAMP_SUMMARY = `1. Overall readiness — 68% at 35 days out, on track for peak at 5-day taper, sparring workload where it needs to be.
2. Strongest areas — right-hand speed up 8% over the last five sparring sessions; body-work compression trending up. Jim has the counter-left hook drill locked in.
3. Needs work — closing the two-step jab gap Stoyan exploits; 6 more dedicated pad rounds this week.
4. Weight cut — 76.8kg vs 72.6 target, 4.2kg to go across 35 days, fully on plan with the Kinetix nutrition team.
5. Sparring — 24 rounds logged vs 72-round camp target (33% complete); back on pace after last week's shoulder precaution.
6. Watch-out — right shoulder flagged one session last Thursday. Monitor closely through the live-contact block; physio review Monday.`

const DEMO_BOXING_CAMP_HIGHLIGHTS = `🥊 Jab-gap closing pad drill — 6 rounds with Jim Monday and Wednesday.
⚖️ Weight-cut check-in with Kinetix Tuesday — 4.2kg across 35 days, re-baseline the plan.
🎬 Stoyan film study: right-hand tell analysis — 15 min today, cross-check with Jim's Tuesday notes.
💪 Shoulder mobility with Dr Mitchell Monday morning before sparring — 30-min pre-hab.
🛏️ Sleep logging all week — 8 hours minimum, phone out of the room from Monday.`

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

  // AI generation on camp active — gated on demo shells (static fallback)
  useEffect(() => {
    if (!campActive || !campConfig || hasGenerated.current) return
    hasGenerated.current = true
    if (session?.isDemoShell !== false) {
      setAiSummary(DEMO_BOXING_CAMP_SUMMARY)
      setAiHighlights(DEMO_BOXING_CAMP_HIGHLIGHTS)
      return
    }
    setAiLoading(true)
    fetch('/api/ai/boxing', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, messages: [{ role: 'user', content: `Generate a fight camp AI summary for a boxer. Camp details: vs ${campConfig.opponent}, ${daysToFight} days remaining, currently in ${phase} phase at ${campConfig.location}. Format as 6 numbered bullet points covering: overall readiness, strongest areas, areas needing work, weight cut status, sparring progress, one watch-out. Be specific and motivating. Max 200 words.` }] })
    }).then(r => r.json()).then(d => { const t = d.content?.[0]?.text; setAiSummary(t ? cleanResponse(t) : 'Unable to generate.') }).catch(() => setAiSummary('Unable to generate.')).finally(() => setAiLoading(false))
    fetch('/api/ai/boxing', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, messages: [{ role: 'user', content: `Generate 5 urgent fight camp action items for a boxer preparing to fight ${campConfig.opponent} in ${daysToFight} days during ${phase} phase. Each item should be one line, specific and actionable. Cover: weight trajectory, sparring gaps, conditioning flags, opponent patterns to drill, recovery priority. Start each with an emoji. Plain text only. No markdown. No bullet points.` }] })
    }).then(r => r.json()).then(d => { const t = d.content?.[0]?.text; setAiHighlights(t ? cleanResponse(t) : 'Unable to generate.') }).catch(() => setAiHighlights('Unable to generate.'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (data.error) { setPlan(`⚠️ AI service temporarily unavailable. Try again.`); setLoading(false); return }
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
      if (data.error) { setReport(`⚠️ AI service temporarily unavailable. Try again.`); setLoading(false); return }
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
            <div><label className="text-xs text-gray-500 mb-1 block">Opponent name</label><input value={opponent} onChange={e => setOpponent(e.target.value)} placeholder="e.g. Maks Stoyan" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
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
      if (data.error) { setResult(`⚠️ AI service temporarily unavailable. Try again.`); setLoading(false); return }
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
      if (data.error) { setReport(`⚠️ AI service temporarily unavailable. Try again.`); setLoading(false); return }
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
      if (data.error) { setContent(`⚠️ AI service temporarily unavailable. Try again.`); setLoading(false); return }
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
// ─── GPS (CONSOLIDATED) ──────────────────────────────────────────────────────
// Single sidebar entry with three tabs: Ring Heatmap / Load Monitor / Vest
// Dashboard. Each tab defers to the existing standalone view component so
// the underlying data + JSX stays colocated with the original implementation.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── BOXING GPS — EXPANDED (6 tabs + 6-KPI strip) ─────────────────────────────
// Tabs: Ring Heatmap · Load Monitor · Fight Camp Load (hero) · Roadwork &
// Conditioning · Vest Dashboard · Connect GPS. Same red-accent boxing theme.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type BoxingGpsTab = 'ring' | 'load' | 'camp' | 'roadwork' | 'vest' | 'connect'

function BoxingGpsView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const [gpsTab, setGpsTab] = useState<BoxingGpsTab>('camp')
  const tabs: ReadonlyArray<readonly [BoxingGpsTab, string, string]> = [
    ['ring',     'Ring Heatmap',           '🥊'],
    ['load',     'Load Monitor',           '📊'],
    ['camp',     'Fight Camp Load',        '🏕️'],
    ['roadwork', 'Roadwork & Conditioning','🏃'],
    ['vest',     'Vest Dashboard',         '🛰️'],
    ['connect',  'Connect GPS',            '🔌'],
  ]
  return (
    <div className="space-y-6">
      <SectionHeader icon="🛰️" title="GPS" subtitle="Ring heatmap, load, fight camp, roadwork, vest telemetry and integrations." />

      {/* 6-KPI top strip — present on every tab */}
      <BoxingGpsKpiStrip />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800 overflow-x-auto">
        {tabs.map(([id, label, icon]) => (
          <button key={id} onClick={() => setGpsTab(id)}
            className={`px-3 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 -mb-px whitespace-nowrap transition-all ${gpsTab === id ? 'border-red-500 text-red-300' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            <span>{icon}</span>{label}
          </button>
        ))}
      </div>

      {gpsTab === 'ring'     && <BoxingGpsRingTab     fighter={fighter} />}
      {gpsTab === 'load'     && <BoxingGpsLoadTab     fighter={fighter} />}
      {gpsTab === 'camp'     && <BoxingGpsCampTab     fighter={fighter} />}
      {gpsTab === 'roadwork' && <BoxingGpsRoadworkTab fighter={fighter} />}
      {gpsTab === 'vest'     && <GPSVestDashboardView fighter={fighter} session={session} />}
      {gpsTab === 'connect'  && <BoxingGpsConnectTab  fighter={fighter} />}
    </div>
  )
}

// ─── 6-KPI top strip ─────────────────────────────────────────────────────────

function BoxingGpsKpiStrip() {
  const KPIS: Array<{ label:string; value:string; sub:string; accent:string }> = [
    { label:'Session Distance', value:'8.4 km',    sub:'Roadwork · today',   accent:'#22c55e' },
    { label:'Top Speed',        value:'6.8 m/s',   sub:'24.5 km/h · vs PB 7.1', accent:'#0ea5e9' },
    { label:'Sprint Count',     value:'12',        sub:'Target 8–15',        accent:'#a855f7' },
    { label:'Heart Rate Peak',  value:'182 bpm',   sub:'93% of max',         accent:'#ef4444' },
    { label:'Session Load',     value:'312 AU',    sub:'Green · under 350',  accent:'#22c55e' },
    { label:'ACWR Ratio',       value:'1.18',      sub:'Optimal · 0.8–1.3',  accent:'#22c55e' },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {KPIS.map(k => (
        <div key={k.label} className="rounded-xl p-3" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
          <div className="text-[10px] uppercase tracking-wider text-gray-500">{k.label}</div>
          <div className="text-xl font-black mt-1 tabular-nums" style={{ color: k.accent }}>{k.value}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">{k.sub}</div>
        </div>
      ))}
    </div>
  )
}

// ─── 1. Ring Heatmap tab ─────────────────────────────────────────────────────

function BoxingGpsRingTab({ fighter }: { fighter: BoxingFighter }) {
  const [round, setRound] = useState<number | 'full'>('full')
  const ROUND_DATA = [
    { round:1, distance:124, punches:42, headMov:38, ringControl:61, advance:38, retreat:18, lateral:24, stationary:20, ropes:18, corners:4, centre:78, note:'Strong start — controls centre well' },
    { round:2, distance:138, punches:48, headMov:42, ringControl:54, advance:34, retreat:22, lateral:28, stationary:16, ropes:24, corners:6, centre:70, note:'Stoyan pressure beginning — gives ground' },
    { round:3, distance:142, punches:44, headMov:36, ringControl:48, advance:28, retreat:32, lateral:24, stationary:16, ropes:31, corners:8, centre:61, note:'Ropes % rising — fatigue or tactical?' },
    { round:4, distance:131, punches:46, headMov:40, ringControl:52, advance:32, retreat:24, lateral:28, stationary:16, ropes:22, corners:5, centre:73, note:'Recovery round — Jim adjusts between' },
    { round:5, distance:126, punches:52, headMov:46, ringControl:58, advance:36, retreat:18, lateral:32, stationary:14, ropes:17, corners:3, centre:80, note:'Best round — game plan working' },
    { round:6, distance:147, punches:50, headMov:38, ringControl:49, advance:28, retreat:30, lateral:26, stationary:16, ropes:27, corners:9, centre:64, note:'Tired — corner time spikes — flag physio' },
    { round:7, distance:135, punches:44, headMov:36, ringControl:46, advance:26, retreat:32, lateral:26, stationary:16, ropes:30, corners:8, centre:62, note:'Mid-fight pressure phase' },
    { round:8, distance:130, punches:48, headMov:42, ringControl:52, advance:32, retreat:24, lateral:28, stationary:16, ropes:25, corners:6, centre:69, note:'Corner adjustments help' },
    { round:9, distance:128, punches:50, headMov:44, ringControl:55, advance:36, retreat:20, lateral:28, stationary:16, ropes:22, corners:5, centre:73, note:'Re-asserting centre' },
    { round:10,distance:133, punches:46, headMov:40, ringControl:50, advance:30, retreat:26, lateral:28, stationary:16, ropes:26, corners:7, centre:67, note:'Trading on the move' },
    { round:11,distance:139, punches:42, headMov:36, ringControl:47, advance:26, retreat:30, lateral:28, stationary:16, ropes:29, corners:8, centre:63, note:'Late fatigue — still landing' },
    { round:12,distance:131, punches:54, headMov:48, ringControl:53, advance:34, retreat:22, lateral:28, stationary:16, ropes:23, corners:6, centre:71, note:'Closing strong — title round' },
  ]
  const fightAvg = {
    distance:    Math.round(ROUND_DATA.reduce((s,r) => s + r.distance, 0)),
    punches:     Math.round(ROUND_DATA.reduce((s,r) => s + r.punches, 0)),
    headMov:     Math.round(ROUND_DATA.reduce((s,r) => s + r.headMov, 0) / ROUND_DATA.length),
    ringControl: Math.round(ROUND_DATA.reduce((s,r) => s + r.ringControl, 0) / ROUND_DATA.length),
    advance:     Math.round(ROUND_DATA.reduce((s,r) => s + r.advance, 0) / ROUND_DATA.length),
    retreat:     Math.round(ROUND_DATA.reduce((s,r) => s + r.retreat, 0) / ROUND_DATA.length),
    lateral:     Math.round(ROUND_DATA.reduce((s,r) => s + r.lateral, 0) / ROUND_DATA.length),
    stationary:  Math.round(ROUND_DATA.reduce((s,r) => s + r.stationary, 0) / ROUND_DATA.length),
    ropes:       Math.round(ROUND_DATA.reduce((s,r) => s + r.ropes, 0) / ROUND_DATA.length),
    corners:     Math.round(ROUND_DATA.reduce((s,r) => s + r.corners, 0) / ROUND_DATA.length),
    centre:      Math.round(ROUND_DATA.reduce((s,r) => s + r.centre, 0) / ROUND_DATA.length),
  }
  const v = round === 'full' ? fightAvg : ROUND_DATA[round - 1]
  const efficiency = v.distance / Math.max(1, v.punches + v.headMov)

  // Donut helper.
  const donut = (data: Array<{ k:string; v:number; c:string }>) => {
    const total = data.reduce((s, d) => s + d.v, 0)
    let acc = 0
    return data.map(d => {
      const frac = total === 0 ? 0 : d.v / total
      const a0 = (acc * 360 - 90) * Math.PI / 180
      const a1 = ((acc + frac) * 360 - 90) * Math.PI / 180
      acc += frac
      const x0 = 80 + 60 * Math.cos(a0), y0 = 80 + 60 * Math.sin(a0)
      const x1 = 80 + 60 * Math.cos(a1), y1 = 80 + 60 * Math.sin(a1)
      const large = frac > 0.5 ? 1 : 0
      return { ...d, path: `M 80 80 L ${x0} ${y0} A 60 60 0 ${large} 1 ${x1} ${y1} Z`, pct: Math.round(frac * 100) }
    })
  }
  const moveDonut = donut([
    { k:'Advance',    v:v.advance,    c:'#22c55e' },
    { k:'Retreat',    v:v.retreat,    c:'#ef4444' },
    { k:'Lateral',    v:v.lateral,    c:'#0ea5e9' },
    { k:'Stationary', v:v.stationary, c:'#475569' },
  ])
  const positionPie = donut([
    { k:'Centre',  v:v.centre,  c:'#facc15' },
    { k:'Ropes',   v:v.ropes,   c:'#ef4444' },
    { k:'Corners', v:v.corners, c:'#f59e0b' },
  ])

  return (
    <div className="space-y-5">
      {/* Round selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Round</span>
        {ROUND_DATA.map((_, i) => (
          <button key={i} onClick={() => setRound(i + 1)}
            className="rounded-md text-[11px] font-bold transition-colors"
            style={{
              width: 30, height: 30,
              background: round === i + 1 ? '#ef4444' : '#1F2937',
              color: round === i + 1 ? '#fff' : '#94a3b8',
              border:'none', cursor:'pointer',
            }}>R{i + 1}</button>
        ))}
        <button onClick={() => setRound('full')}
          className="text-[11px] font-semibold px-3 py-1.5 rounded-md ml-2"
          style={{
            background: round === 'full' ? '#ef4444' : 'transparent',
            color: round === 'full' ? '#fff' : '#fca5a5',
            border: `1px solid ${round === 'full' ? '#ef4444' : '#ef444466'}`,
            cursor:'pointer',
          }}>{round === 'full' ? '✓ Full fight' : 'Full fight'}</button>
      </div>

      {/* KPI strip per round */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Distance',         value:`${v.distance}${round === 'full' ? ' m total' : ' m'}`, accent:'#22c55e' },
          { label:'Punches Thrown',   value:`${v.punches}`,        accent:'#ef4444' },
          { label:'Head Movement',    value:`${v.headMov}`,        accent:'#a855f7' },
          { label:'Ring Control',     value:`${v.ringControl}%`,   accent:'#facc15' },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-3" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
            <div className="text-[10px] uppercase tracking-wider text-gray-500">{k.label}</div>
            <div className="text-2xl font-black mt-1 tabular-nums" style={{ color: k.accent }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Hero Ring SVG + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
        <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
          <h3 className="text-sm font-bold text-white mb-3">Ring Position Map · {round === 'full' ? 'Full fight' : `Round ${round}`}</h3>
          <svg viewBox="0 0 360 360" className="w-full block">
            <defs>
              <radialGradient id="bx-ring2-canvas" cx="50%" cy="50%" r="65%">
                <stop offset="0%" stopColor="#1f1a14" />
                <stop offset="100%" stopColor="#0a0805" />
              </radialGradient>
              <filter id="bx-ring2-blur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="14" />
              </filter>
            </defs>
            <rect x="36" y="36" width="288" height="288" rx="6" fill="url(#bx-ring2-canvas)" />
            <rect x="30" y="30" width="300" height="300" rx="8" fill="none" stroke="#3a2a14" strokeWidth="3" />
            <rect x="36" y="36" width="288" height="288" rx="6" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
            {/* Ropes */}
            {[0,1,2,3].map(i => {
              const off = 8 + i * 7
              const colors = ['#dc2626','#fafafa','#1d4ed8','#facc15']
              return (
                <g key={i} stroke={colors[i]} strokeWidth="1.6" opacity="0.8" fill="none">
                  <line x1={36 - off} y1="36" x2={36 - off} y2="324" />
                  <line x1={324 + off} y1="36" x2={324 + off} y2="324" />
                  <line x1="36" y1={36 - off} x2="324" y2={36 - off} />
                  <line x1="36" y1={324 + off} x2="324" y2={324 + off} />
                </g>
              )
            })}
            {/* Corner posts */}
            {[
              { x:16,  y:16,  c:'#dc2626' },
              { x:324, y:16,  c:'#1d4ed8' },
              { x:16,  y:324, c:'#fafafa' },
              { x:324, y:324, c:'#fafafa' },
            ].map((p, i) => (
              <rect key={i} x={p.x} y={p.y} width="20" height="20" rx="3" fill={p.c} stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
            ))}
            {/* Heat blobs based on centre/ropes/corners */}
            <g filter="url(#bx-ring2-blur)">
              {/* Centre */}
              <circle cx="180" cy="180" r={50 + (v.centre / 100) * 40}
                fill={`hsl(${130 - (v.centre / 100) * 130}, 70%, 50%)`}
                fillOpacity={0.18 + (v.centre / 100) * 0.4} />
              {/* Ropes */}
              <rect x="36" y="36"   width="288" height="40" fill="#ef4444" fillOpacity={(v.ropes / 100) * 0.6} />
              <rect x="36" y="284"  width="288" height="40" fill="#ef4444" fillOpacity={(v.ropes / 100) * 0.5} />
              <rect x="36" y="36"   width="40" height="288"  fill="#ef4444" fillOpacity={(v.ropes / 100) * 0.5} />
              <rect x="284" y="36"  width="40" height="288"  fill="#ef4444" fillOpacity={(v.ropes / 100) * 0.5} />
              {/* Corners */}
              {[[36,36],[284,36],[36,284],[284,284]].map(([x,y], i) => (
                <rect key={i} x={x} y={y} width="40" height="40" fill="#f59e0b" fillOpacity={(v.corners / 100) * 1.4} />
              ))}
            </g>
            {/* Centre line */}
            <line x1="36" y1="180" x2="324" y2="180" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 4" />
            <line x1="180" y1="36" x2="180" y2="324" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 4" />
            <text x="180" y="184" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">{v.centre}%</text>
            <text x="180" y="200" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="9">CENTRE</text>
          </svg>
          <div className="flex gap-3 justify-center mt-3 flex-wrap">
            {[['#facc15','Centre'],['#ef4444','Ropes'],['#f59e0b','Corners']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5 text-[10px]" style={{ color:'#94a3b8' }}>
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: c }} />{l}
              </div>
            ))}
          </div>
        </div>

        {/* Movement donut + corner pie + footwork efficiency */}
        <div className="space-y-3">
          <div className="rounded-xl p-4" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Movement Pattern</div>
            <div className="flex gap-3 items-center">
              <svg viewBox="0 0 160 160" width="160" height="160">
                {moveDonut.map((s, i) => <path key={i} d={s.path} fill={s.c} opacity="0.9" stroke="#0a0c14" strokeWidth="0.8" />)}
                <circle cx="80" cy="80" r="32" fill="#0d1117" stroke="rgba(255,255,255,0.08)" />
                <text x="80" y="78" fontSize="9" fill="#94a3b8" textAnchor="middle">Pattern</text>
                <text x="80" y="92" fontSize="11" fill="#fff" textAnchor="middle" fontWeight="700">{v.advance + v.lateral}% active</text>
              </svg>
              <div className="flex-1 text-[11px] space-y-1.5">
                {moveDonut.map(s => (
                  <div key={s.k} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ background: s.c }} />
                    <span className="text-gray-300">{s.k}</span>
                    <span className="ml-auto text-white font-semibold tabular-nums">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Corner Time</div>
            <div className="flex gap-3 items-center">
              <svg viewBox="0 0 160 160" width="140" height="140">
                {positionPie.map((s, i) => <path key={i} d={s.path} fill={s.c} opacity="0.9" stroke="#0a0c14" strokeWidth="0.8" />)}
              </svg>
              <div className="flex-1 text-[11px] space-y-1.5">
                {positionPie.map(s => (
                  <div key={s.k} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ background: s.c }} />
                    <span className="text-gray-300">{s.k}</span>
                    <span className="ml-auto text-white font-semibold tabular-nums">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background:'#0d1117', border:'1px solid #ef444430' }}>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Footwork Efficiency</div>
            <div className="text-3xl font-black" style={{ color:'#ef4444' }}>{efficiency.toFixed(2)}</div>
            <div className="text-[11px] text-gray-400">m of distance per meaningful action (punch + head movement)</div>
            <div className="text-[10px] text-gray-600 mt-1">Lower = tighter, more efficient ring craft.</div>
          </div>
        </div>
      </div>

      {/* Round-by-round distance bar chart */}
      <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
        <h3 className="text-sm font-bold text-white mb-3">Round-by-Round Distance · Activity Curve</h3>
        <svg viewBox="0 0 600 180" width="100%">
          {[0,0.25,0.5,0.75,1].map((t, i) => <line key={i} x1={36} x2={580} y1={20 + (1 - t) * 130} y2={20 + (1 - t) * 130} stroke="rgba(255,255,255,0.05)" />)}
          {ROUND_DATA.map((r, i) => {
            const max = Math.max(...ROUND_DATA.map(x => x.distance))
            const x = 50 + i * 44
            const h = (r.distance / max) * 130
            const c = i >= 9 ? '#facc15' : i >= 5 ? '#ef4444' : '#22c55e'
            return (
              <g key={i}>
                <rect x={x} y={150 - h} width="32" height={h} fill={c} opacity="0.85" rx="2" />
                <text x={x + 16} y={150 - h - 4} fontSize="9" fill={c} textAnchor="middle" fontWeight="700">{r.distance}</text>
                <text x={x + 16} y={166} fontSize="9" fill="#94a3b8" textAnchor="middle">R{r.round}</text>
              </g>
            )
          })}
        </svg>
        <div className="flex gap-4 mt-2 text-[10px] text-gray-500">
          <span><span className="inline-block w-3 h-3 bg-green-500 rounded-sm align-middle mr-1.5" />Early rounds (1–5)</span>
          <span><span className="inline-block w-3 h-3 bg-red-500 rounded-sm align-middle mr-1.5" />Mid rounds (6–9)</span>
          <span><span className="inline-block w-3 h-3 bg-yellow-500 rounded-sm align-middle mr-1.5" />Championship rounds (10–12)</span>
        </div>
        <p className="text-[11px] mt-3 text-gray-400 italic">Round 6 spike (147 m) before championship rounds compress — fatigue signature.</p>
      </div>
    </div>
  )
}

// ─── 2. Load Monitor tab ─────────────────────────────────────────────────────

function BoxingGpsLoadTab({ fighter }: { fighter: BoxingFighter }) {
  const SESSION_TYPES = ['Sparring', 'Pads', 'Bag', 'S&C', 'Roadwork'] as const
  const SESSION_COLOR: Record<typeof SESSION_TYPES[number], string> = {
    'Sparring':'#ef4444', 'Pads':'#f59e0b', 'Bag':'#facc15', 'S&C':'#a855f7', 'Roadwork':'#22c55e',
  }
  const SESSION: { type: typeof SESSION_TYPES[number]; date: string; duration: string; load: number } = { type:'Sparring', date:'Tue 8 Apr 2026', duration:'72 min', load:312 }

  // Last 4 weeks of load by session type — stacked bar.
  const WEEKS = ['W-3', 'W-2', 'W-1', 'Now'] as const
  const LOAD_BY_TYPE: Record<typeof SESSION_TYPES[number], number[]> = {
    'Sparring':[280, 360, 420, 320],
    'Pads':    [180, 220, 240, 200],
    'Bag':     [140, 160, 180, 160],
    'S&C':     [320, 340, 360, 320],
    'Roadwork':[260, 280, 320, 280],
  }
  const totals = WEEKS.map((_, i) => SESSION_TYPES.reduce((s, t) => s + LOAD_BY_TYPE[t][i], 0))
  const maxTotal = Math.max(...totals)

  // 28-day calendar — colour by load.
  const DAILY_LOAD = Array.from({ length: 28 }).map((_, i) => {
    const base = 180 + Math.sin(i / 3) * 80 + (i / 28) * 40
    const matchSpike = (i % 7 === 5) ? 120 : 0
    const wobble = ((i * 13) % 7) * 12
    return Math.round(base + matchSpike + wobble + ((i === 21 || i === 24) ? 80 : 0))
  })
  const maxDaily = Math.max(...DAILY_LOAD)

  // ACWR table
  const ACWR_ROWS = [
    { type:'Total Load',  acute:1820, chronic:1640, ratio:1.11, status:'optimal',   next:'Sparring (planned)' },
    { type:'Sparring',    acute: 760, chronic: 640, ratio:1.19, status:'optimal',   next:'Sparring · 8 rounds' },
    { type:'Roadwork',    acute: 320, chronic: 360, ratio:0.89, status:'optimal',   next:'Tempo run · 8 km' },
    { type:'S&C',         acute: 480, chronic: 360, ratio:1.33, status:'manage',    next:'Light circuits' },
    { type:'Head contact',acute:  72, chronic:  48, ratio:1.50, status:'overload',  next:'No contact 48h' },
  ] as const
  const sBg    = (s: string) => s === 'optimal' ? 'bg-green-600/15 text-green-400 border-green-600/30'
                          : s === 'manage'  ? 'bg-amber-600/15 text-amber-400 border-amber-600/30'
                          : s === 'overload'? 'bg-red-600/15 text-red-400 border-red-600/30'
                                            : 'bg-blue-600/15 text-blue-400 border-blue-600/30'

  // Recovery score — 0-10 with factors
  const RECOVERY = { score: 7.6, sleep: 8.2, soreness: 7.4, hrv: 6.8 }

  // Sparring rolling 4-week
  const SPARRING_ROUNDS = [42, 48, 56, 36] // last 4 weeks
  const ceiling = 60

  return (
    <div className="space-y-5">
      {/* Session overview */}
      <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500">Today's session</div>
            <div className="text-base font-bold text-white">{SESSION.date} · {SESSION.type}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">{SESSION.duration} · 8 rounds + 4 pads · last week of build phase</div>
          </div>
          <div className="flex gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-gray-500">Session load</div>
              <div className="text-2xl font-black tabular-nums" style={{ color: SESSION.load > 350 ? '#ef4444' : '#22c55e' }}>{SESSION.load} AU</div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md self-center" style={{ background:`${SESSION_COLOR[SESSION.type]}26`, color: SESSION_COLOR[SESSION.type], border:`1px solid ${SESSION_COLOR[SESSION.type]}55` }}>{SESSION.type}</span>
          </div>
        </div>
      </div>

      {/* Load by session type — stacked bars */}
      <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
        <h3 className="text-sm font-bold text-white mb-3">Load by Session Type · Last 4 weeks</h3>
        <svg viewBox="0 0 600 200" width="100%">
          {[0,0.25,0.5,0.75,1].map((t, i) => <line key={i} x1={36} x2={580} y1={20 + (1 - t) * 140} y2={20 + (1 - t) * 140} stroke="rgba(255,255,255,0.05)" />)}
          {WEEKS.map((wk, wi) => {
            const x = 80 + wi * 130
            let yOff = 160
            const blocks = SESSION_TYPES.map(t => {
              const v = LOAD_BY_TYPE[t][wi]
              const h = (v / maxTotal) * 140
              yOff -= h
              return { y: yOff + h, h, c: SESSION_COLOR[t], v, t }
            })
            return (
              <g key={wk}>
                {blocks.map((b, bi) => (
                  <rect key={bi} x={x} y={b.y - b.h} width="80" height={b.h} fill={b.c} opacity="0.85" />
                ))}
                <text x={x + 40} y={178} fontSize="10" fill="#94a3b8" textAnchor="middle">{wk}</text>
                <text x={x + 40} y={blocks[blocks.length - 1].y - blocks[blocks.length - 1].h - 6} fontSize="11" fill="#fff" textAnchor="middle" fontWeight="700">{totals[wi]}</text>
              </g>
            )
          })}
        </svg>
        <div className="flex gap-3 flex-wrap mt-3 text-[10px]">
          {SESSION_TYPES.map(t => (
            <div key={t} className="flex items-center gap-1.5 text-gray-400">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: SESSION_COLOR[t] }} />{t}
            </div>
          ))}
        </div>
      </div>

      {/* Daily load calendar */}
      <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
        <h3 className="text-sm font-bold text-white mb-3">Daily Load · 28-day Calendar</h3>
        <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-2">
          <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
        </div>
        <div className="grid gap-1.5" style={{ gridTemplateColumns:'repeat(7, 1fr)' }}>
          {DAILY_LOAD.map((au, i) => {
            const c = au / maxDaily
            const hue = 130 - c * 130
            return (
              <div key={i} title={`Day ${i + 1} · ${au} AU`} className="aspect-square rounded-md p-1.5 flex flex-col justify-between"
                style={{ background:`hsl(${hue}, 65%, ${48 - c * 4}%)`, opacity: 0.18 + c * 0.82, boxShadow: c > 0.85 ? `0 0 8px hsla(${hue}, 80%, 55%, 0.6)` : 'none' }}>
                <span className="text-[9px]" style={{ color:'rgba(255,255,255,0.55)' }}>{i + 1}</span>
                <span className="text-[10px] tabular-nums font-black text-white" style={{ textShadow:'0 1px 2px rgba(0,0,0,0.6)' }}>{au}</span>
              </div>
            )
          })}
        </div>
        <p className="text-[11px] mt-3 text-gray-500">Two big spikes day 22 and day 25 — peak sparring weekend.</p>
      </div>

      {/* ACWR table */}
      <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
        <h3 className="text-sm font-bold text-white mb-3">ACWR · Acute (7d) vs Chronic (28d)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800 text-[10px] uppercase tracking-wider">
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-right py-2">Acute (7d)</th>
                <th className="text-right py-2">Chronic (28d)</th>
                <th className="text-right py-2">Ratio</th>
                <th className="text-center py-2">Status</th>
                <th className="text-left py-2 px-2">Recommended next</th>
              </tr>
            </thead>
            <tbody>
              {ACWR_ROWS.map(r => (
                <tr key={r.type} className="border-b border-gray-800/40">
                  <td className="py-2 px-2 text-white font-medium">{r.type}</td>
                  <td className="py-2 text-right tabular-nums text-gray-200">{r.acute}</td>
                  <td className="py-2 text-right tabular-nums text-gray-200">{r.chronic}</td>
                  <td className="py-2 text-right tabular-nums font-bold" style={{ color: r.status === 'optimal' ? '#22c55e' : r.status === 'manage' ? '#f59e0b' : '#ef4444' }}>{r.ratio.toFixed(2)}</td>
                  <td className="py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${sBg(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="py-2 px-2 text-gray-300">{r.next}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recovery score */}
        <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
          <h3 className="text-sm font-bold text-white mb-3">Recovery Score</h3>
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 120 120" width="120" height="120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#1F2937" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke={RECOVERY.score >= 7 ? '#22c55e' : RECOVERY.score >= 5 ? '#f59e0b' : '#ef4444'}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(RECOVERY.score / 10) * 314} 314`}
                transform="rotate(-90 60 60)" />
              <text x="60" y="58" fontSize="22" fill="#fff" textAnchor="middle" fontWeight="900">{RECOVERY.score}</text>
              <text x="60" y="76" fontSize="9" fill="#94a3b8" textAnchor="middle">/ 10</text>
            </svg>
            <div className="flex-1 space-y-2">
              {[
                { k:'Sleep',    v:RECOVERY.sleep,    c:'#0ea5e9' },
                { k:'Soreness', v:RECOVERY.soreness, c:'#a855f7' },
                { k:'HRV proxy',v:RECOVERY.hrv,      c:'#22c55e' },
              ].map(f => (
                <div key={f.k}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-gray-300">{f.k}</span>
                    <span className="font-bold tabular-nums" style={{ color: f.c }}>{f.v.toFixed(1)} / 10</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-gray-800">
                    <div className="h-full" style={{ width:`${f.v * 10}%`, background: f.c }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sparring rounds rolling 4 weeks */}
        <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
          <h3 className="text-sm font-bold text-white mb-3">Sparring Rounds · 4-week rolling</h3>
          <p className="text-[11px] text-gray-500 mb-3">Head contact load proxy. Ceiling: {ceiling} rounds / 4-week block.</p>
          <svg viewBox="0 0 320 160" width="100%">
            {[0,0.25,0.5,0.75,1].map((t, i) => <line key={i} x1={32} x2={310} y1={16 + (1 - t) * 110} y2={16 + (1 - t) * 110} stroke="rgba(255,255,255,0.05)" />)}
            <line x1={32} x2={310} y1={16 + (1 - ceiling / 80) * 110} y2={16 + (1 - ceiling / 80) * 110} stroke="#ef4444" strokeWidth="1.2" strokeDasharray="4 3" />
            <text x={310} y={16 + (1 - ceiling / 80) * 110 - 2} fontSize="9" fill="#ef4444" textAnchor="end">Ceiling {ceiling}</text>
            {SPARRING_ROUNDS.map((v, i) => {
              const x = 60 + i * 70
              const h = (v / 80) * 110
              const c = v > ceiling ? '#ef4444' : v > ceiling * 0.85 ? '#f59e0b' : '#22c55e'
              return (
                <g key={i}>
                  <rect x={x} y={126 - h} width="44" height={h} fill={c} opacity="0.85" rx="2" />
                  <text x={x + 22} y={126 - h - 4} fontSize="11" fill={c} textAnchor="middle" fontWeight="700">{v}</text>
                  <text x={x + 22} y={142} fontSize="9" fill="#94a3b8" textAnchor="middle">{WEEKS[i]}</text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </div>
  )
}

// ─── 3. Fight Camp Load tab (HERO for JOHAN pitch) ──────────────────────────

function BoxingGpsCampTab({ fighter }: { fighter: BoxingFighter }) {
  const CAMP_TOTAL_WEEKS = 8
  const CAMP_CURRENT_WEEK = 5
  const PHASES = [
    { id:'foundation', label:'Foundation', weeks:[1,2], color:'#0ea5e9' },
    { id:'build',      label:'Build',      weeks:[3,4,5], color:'#22c55e' },
    { id:'peak',       label:'Peak',       weeks:[6,7], color:'#ef4444' },
    { id:'taper',      label:'Taper',      weeks:[8], color:'#facc15' },
  ]
  const phaseFor = (wk: number) => PHASES.find(p => p.weeks.includes(wk))!

  const TRAINING_TYPES = ['Roadwork','Pads','Sparring','S&C','Rest'] as const
  type TrainType = typeof TRAINING_TYPES[number]
  const TYPE_COLOR: Record<TrainType, string> = {
    Roadwork:'#22c55e', Pads:'#f59e0b', Sparring:'#ef4444', 'S&C':'#a855f7', Rest:'#475569',
  }
  // 5 rows × (8 weeks * 7 days = 56 days) — but keep grid manageable: 5 × 56 dots
  // Build per-day load (0–1) by training type; dominant type per day for cell colour band on the calendar.
  const DAILY: Array<{ day:number; week:number; type:TrainType; load:number }> = []
  for (let i = 0; i < CAMP_TOTAL_WEEKS * 7; i++) {
    const week = Math.floor(i / 7) + 1
    const dow = i % 7
    let type: TrainType = 'Rest'
    if (dow === 0) type = 'Roadwork'
    else if (dow === 1) type = 'S&C'
    else if (dow === 2) type = 'Sparring'
    else if (dow === 3) type = 'Roadwork'
    else if (dow === 4) type = 'S&C'
    else if (dow === 5) type = 'Sparring'
    else if (dow === 6) type = 'Rest'
    // Phase intensity multiplier
    const phase = phaseFor(week).id
    const base = phase === 'foundation' ? 0.45 : phase === 'build' ? 0.65 : phase === 'peak' ? 0.95 : 0.32
    const wobble = ((i * 17) % 9) / 30
    const load = type === 'Rest' ? 0.08 : Math.max(0.1, Math.min(1, base + wobble))
    DAILY.push({ day:i, week, type, load })
  }

  // Daily load heatmap: rows = training type, columns = day index, intensity per cell.
  const HEATMAP: Record<TrainType, number[]> = { Roadwork:[], Pads:[], Sparring:[], 'S&C':[], Rest:[] }
  for (let i = 0; i < CAMP_TOTAL_WEEKS * 7; i++) {
    TRAINING_TYPES.forEach(t => HEATMAP[t].push(0))
  }
  DAILY.forEach((d) => { HEATMAP[d.type][d.day] = d.load })
  // Add some cross-type variety: Pads + Sparring overlap.
  for (let w = 0; w < CAMP_TOTAL_WEEKS; w++) {
    HEATMAP['Pads'][w * 7 + 4] = phaseFor(w + 1).id === 'peak' ? 0.85 : 0.55
    HEATMAP['Pads'][w * 7 + 1] = 0.45
  }

  // Load curves — planned vs actual (8 weeks)
  const PLANNED = [620, 760, 880, 940, 1020, 1100, 1080, 720]
  const ACTUAL  = [600, 740, 900, 980, 1060,  860,    0,   0] // weeks 6 onwards = future / current at W5
  const maxLoad = Math.max(...PLANNED, ...ACTUAL.filter(v => v > 0))

  // Sparring rounds per week + ceiling line
  const SPAR_PER_WEEK = [12, 18, 24, 28, 32, 26, 18, 8]
  const SPAR_CEILING  = 32

  // Weight tracking
  const WEIGHT_BY_WEEK = [
    { wk:1, current:97.4, target:92.7, start:97.8 },
    { wk:2, current:96.8, target:92.7, start:97.8 },
    { wk:3, current:96.0, target:92.7, start:97.8 },
    { wk:4, current:95.2, target:92.7, start:97.8 },
    { wk:5, current:94.4, target:92.7, start:97.8 },
    { wk:6, current:93.8, target:92.7, start:97.8 },
    { wk:7, current:93.2, target:92.7, start:97.8 },
    { wk:8, current:92.7, target:92.7, start:97.8 },
  ]

  // Taper compliance — last 2 weeks
  const taperWeeks = WEIGHT_BY_WEEK.slice(-2)
  const taperCompliance: 'green'|'amber'|'red' = ACTUAL[6] > 0 && ACTUAL[6] > PLANNED[6] * 1.05 ? 'red'
    : ACTUAL[6] > 0 && ACTUAL[6] > PLANNED[6] ? 'amber'
    : 'green'

  // KPI rollups
  const totalTrainingDays = DAILY.filter(d => d.type !== 'Rest').length
  const totalSparringRounds = SPAR_PER_WEEK.reduce((s, v) => s + v, 0)
  const peakWeek = ACTUAL.indexOf(Math.max(...ACTUAL.filter(v => v > 0))) + 1
  const currentACWR = 1.18

  return (
    <div className="space-y-5">
      {/* Camp timeline */}
      <div className="rounded-xl p-5" style={{ background:'linear-gradient(180deg,#0d1117 0%,#0a0d13 100%)', border:'1px solid #ef444430' }}>
        <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color:'#ef4444' }}>Hero · Fight Camp Load</div>
            <h2 className="text-2xl font-black text-white mt-1">Camp Day {fighter.camp_day} of {fighter.camp_total} · Week {CAMP_CURRENT_WEEK} of {CAMP_TOTAL_WEEKS}</h2>
            <p className="text-[12px] text-gray-400 mt-1">{fighter.next_fight.opponent} · {fighter.next_fight.date} · {fighter.next_fight.days_away} days out</p>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md" style={{ background: `${phaseFor(CAMP_CURRENT_WEEK).color}26`, color: phaseFor(CAMP_CURRENT_WEEK).color, border:`1px solid ${phaseFor(CAMP_CURRENT_WEEK).color}55` }}>
            Current phase: {phaseFor(CAMP_CURRENT_WEEK).label}
          </span>
        </div>
        {/* Phase bar */}
        <div className="flex h-9 rounded-md overflow-hidden mt-3" style={{ background:'#1F2937' }}>
          {Array.from({ length: CAMP_TOTAL_WEEKS }).map((_, i) => {
            const week = i + 1
            const phase = phaseFor(week)
            const isCurrent = week === CAMP_CURRENT_WEEK
            const isPast    = week < CAMP_CURRENT_WEEK
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-center text-[10px] font-bold transition-all relative"
                style={{
                  background: phase.color,
                  opacity: isPast ? 0.5 : isCurrent ? 1 : 0.7,
                  borderRight: i < CAMP_TOTAL_WEEKS - 1 ? '1px solid rgba(0,0,0,0.4)' : 'none',
                  color: '#0a0805',
                  textShadow: 'none',
                }}>
                <span>W{week}</span>
                {isCurrent && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[#ef4444] text-base">▼</span>}
              </div>
            )
          })}
        </div>
        <div className="flex gap-3 mt-4 flex-wrap text-[10px]">
          {PHASES.map(p => (
            <div key={p.id} className="flex items-center gap-1.5" style={{ color:'#94a3b8' }}>
              <span className="w-3 h-3 rounded-sm" style={{ background: p.color }} />
              {p.label} <span className="text-gray-600">(W{p.weeks.join('·')})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Camp summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Training days',    value:`${totalTrainingDays}`, sub:`/ ${CAMP_TOTAL_WEEKS * 7} days`, accent:'#22c55e' },
          { label:'Sparring rounds',  value:`${totalSparringRounds}`, sub:'across full camp',           accent:'#ef4444' },
          { label:'Peak load week',   value:`W${peakWeek}`,         sub:`${Math.max(...ACTUAL.filter(v => v > 0))} AU`,    accent:'#facc15' },
          { label:'Current ACWR',     value:`${currentACWR}`,        sub: currentACWR > 1.5 ? 'Overload' : currentACWR > 1.3 ? 'Manage' : 'Optimal', accent: currentACWR > 1.5 ? '#ef4444' : currentACWR > 1.3 ? '#f59e0b' : '#22c55e' },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-3" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
            <div className="text-[10px] uppercase tracking-wider text-gray-500">{k.label}</div>
            <div className="text-2xl font-black mt-1 tabular-nums" style={{ color: k.accent }}>{k.value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Daily load heatmap — rows = training type */}
      <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
        <h3 className="text-sm font-bold text-white mb-3">Daily Load Heatmap · Rows = training type, columns = days</h3>
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Day index header */}
            <div className="flex items-center gap-0.5 mb-1 ml-[88px]">
              {Array.from({ length: CAMP_TOTAL_WEEKS }).map((_, w) => (
                <div key={w} className="flex-1 flex gap-0.5">
                  {Array.from({ length: 7 }).map((_, d) => (
                    <div key={d} className="flex-1 text-center text-[8px] text-gray-600" style={{ minWidth: 12 }}>
                      {d === 0 ? `W${w + 1}` : ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {TRAINING_TYPES.map(t => (
              <div key={t} className="flex items-center gap-0.5 mb-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ width:80, color: TYPE_COLOR[t] }}>{t}</div>
                {HEATMAP[t].map((v, di) => {
                  const c = v
                  return (
                    <div key={di} className="flex-1 rounded-sm aspect-square" title={`Day ${di + 1} · ${t} · load ${(v * 100).toFixed(0)}`}
                      style={{
                        background: TYPE_COLOR[t],
                        opacity: 0.08 + c * 0.92,
                        boxShadow: c > 0.85 ? `0 0 6px ${TYPE_COLOR[t]}88` : 'none',
                        minWidth: 12,
                        minHeight: 12,
                      }} />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Load curve + sparring accumulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
          <h3 className="text-sm font-bold text-white mb-3">Planned vs Actual Load (AU/week)</h3>
          <svg viewBox="0 0 360 200" width="100%">
            {[0,0.25,0.5,0.75,1].map((t, i) => <line key={i} x1={36} x2={350} y1={20 + (1 - t) * 140} y2={20 + (1 - t) * 140} stroke="rgba(255,255,255,0.05)" />)}
            {[0,300,600,900].map((v, i) => <text key={i} x={32} y={20 + (1 - v / maxLoad) * 140 + 3} fontSize="9" fill="#6B7280" textAnchor="end">{v}</text>)}
            {/* Phase shading */}
            {PHASES.map(p => {
              const x0 = 36 + ((p.weeks[0] - 1) / 7) * 314
              const x1 = 36 + ((p.weeks[p.weeks.length - 1]) / 7) * 314
              return <rect key={p.id} x={x0} y={20} width={x1 - x0} height={140} fill={p.color} fillOpacity="0.04" />
            })}
            {/* Planned line (dashed) */}
            <path d={PLANNED.map((v, i) => `${i === 0 ? 'M' : 'L'} ${36 + (i / (PLANNED.length - 1)) * 314} ${20 + (1 - v / maxLoad) * 140}`).join(' ')}
              fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="5 3" />
            {/* Actual line (solid, only where actual > 0) */}
            {(() => {
              const pts = ACTUAL.map((v, i) => v > 0 ? { x: 36 + (i / (ACTUAL.length - 1)) * 314, y: 20 + (1 - v / maxLoad) * 140 } : null).filter((p): p is {x:number;y:number} => p !== null)
              const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
              return <path d={path} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            })()}
            {/* Markers */}
            {ACTUAL.map((v, i) => v > 0 && (
              <g key={i}>
                <circle cx={36 + (i / (ACTUAL.length - 1)) * 314} cy={20 + (1 - v / maxLoad) * 140} r="3.5" fill="#ef4444" />
              </g>
            ))}
            {/* X labels */}
            {PLANNED.map((_, i) => (
              <text key={i} x={36 + (i / (PLANNED.length - 1)) * 314} y={178} fontSize="9" fill="#94a3b8" textAnchor="middle">W{i + 1}</text>
            ))}
            {/* Now line */}
            <line x1={36 + ((CAMP_CURRENT_WEEK - 1) / 7) * 314} x2={36 + ((CAMP_CURRENT_WEEK - 1) / 7) * 314} y1={20} y2={160} stroke="#facc15" strokeWidth="1" strokeDasharray="3 3" />
            <text x={36 + ((CAMP_CURRENT_WEEK - 1) / 7) * 314} y={14} fontSize="9" fill="#facc15" textAnchor="middle" fontWeight="700">NOW</text>
          </svg>
          <div className="flex gap-4 mt-2 text-[10px]">
            <span className="text-gray-400"><span className="inline-block w-3 h-px border-t border-dashed border-purple-400 align-middle mr-1.5" />Planned</span>
            <span className="text-gray-400"><span className="inline-block w-3 h-0.5 bg-red-500 align-middle mr-1.5" />Actual</span>
          </div>
        </div>

        <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
          <h3 className="text-sm font-bold text-white mb-3">Sparring Rounds per Week · ceiling {SPAR_CEILING}</h3>
          <svg viewBox="0 0 360 200" width="100%">
            {[0,0.25,0.5,0.75,1].map((t, i) => <line key={i} x1={36} x2={350} y1={20 + (1 - t) * 140} y2={20 + (1 - t) * 140} stroke="rgba(255,255,255,0.05)" />)}
            <line x1={36} x2={350} y1={20 + (1 - SPAR_CEILING / 36) * 140} y2={20 + (1 - SPAR_CEILING / 36) * 140} stroke="#ef4444" strokeWidth="1.4" strokeDasharray="4 3" />
            <text x={350} y={20 + (1 - SPAR_CEILING / 36) * 140 - 2} fontSize="9" fill="#ef4444" textAnchor="end">Ceiling {SPAR_CEILING}</text>
            {SPAR_PER_WEEK.map((v, i) => {
              const max = 36
              const x = 60 + (i * 38)
              const h = (v / max) * 140
              const c = v > SPAR_CEILING ? '#ef4444' : v > SPAR_CEILING * 0.85 ? '#f59e0b' : '#22c55e'
              return (
                <g key={i}>
                  <rect x={x} y={160 - h} width="26" height={h} fill={c} opacity="0.85" rx="2" />
                  <text x={x + 13} y={160 - h - 4} fontSize="10" fill={c} textAnchor="middle" fontWeight="700">{v}</text>
                  <text x={x + 13} y={178} fontSize="9" fill="#94a3b8" textAnchor="middle">W{i + 1}</text>
                </g>
              )
            })}
          </svg>
          <p className="text-[11px] mt-2 text-gray-500">Peak sparring at W5 (32 rounds) — ceiling held. Taper drops to 8 rounds W8.</p>
        </div>
      </div>

      {/* Weight tracking */}
      <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
        <h3 className="text-sm font-bold text-white mb-3">Weight Tracking · {fighter.weight_class} · target {fighter.target_weight}kg</h3>
        <svg viewBox="0 0 600 200" width="100%">
          {[0,0.25,0.5,0.75,1].map((t, i) => <line key={i} x1={48} x2={580} y1={20 + (1 - t) * 140} y2={20 + (1 - t) * 140} stroke="rgba(255,255,255,0.05)" />)}
          {[92,94,96,98].map((v, i) => <text key={i} x={44} y={20 + ((98 - v) / 6) * 140 + 3} fontSize="9" fill="#6B7280" textAnchor="end">{v}</text>)}
          {/* Target line */}
          <line x1={48} x2={580} y1={20 + ((98 - fighter.target_weight) / 6) * 140} y2={20 + ((98 - fighter.target_weight) / 6) * 140} stroke="#ef4444" strokeDasharray="5 3" strokeWidth="1.2" />
          <text x={580} y={20 + ((98 - fighter.target_weight) / 6) * 140 - 4} fontSize="9" fill="#ef4444" textAnchor="end">Fight weight {fighter.target_weight}kg</text>
          {/* Start line */}
          <line x1={48} x2={580} y1={20 + ((98 - 97.8) / 6) * 140} y2={20 + ((98 - 97.8) / 6) * 140} stroke="#475569" strokeDasharray="2 4" strokeWidth="1" />
          {/* Curve */}
          <path d={WEIGHT_BY_WEEK.map((d, i) => `${i === 0 ? 'M' : 'L'} ${48 + (i / (WEIGHT_BY_WEEK.length - 1)) * 532} ${20 + ((98 - d.current) / 6) * 140}`).join(' ')}
            fill="none" stroke="#0ea5e9" strokeWidth="2.5" />
          {WEIGHT_BY_WEEK.map((d, i) => (
            <g key={i}>
              <circle cx={48 + (i / (WEIGHT_BY_WEEK.length - 1)) * 532} cy={20 + ((98 - d.current) / 6) * 140} r="3.5" fill="#0ea5e9" />
              <text x={48 + (i / (WEIGHT_BY_WEEK.length - 1)) * 532} y={20 + ((98 - d.current) / 6) * 140 - 8} fontSize="9" fill="#0ea5e9" textAnchor="middle" fontWeight="700">{d.current}</text>
              <text x={48 + (i / (WEIGHT_BY_WEEK.length - 1)) * 532} y={178} fontSize="9" fill="#94a3b8" textAnchor="middle">W{d.wk}</text>
            </g>
          ))}
        </svg>
        <div className="grid grid-cols-3 gap-3 mt-3">
          {[
            { k:'Camp start', v:`${WEIGHT_BY_WEEK[0].start} kg`, c:'#475569' },
            { k:'Current',    v:`${WEIGHT_BY_WEEK[CAMP_CURRENT_WEEK - 1].current} kg`, c:'#0ea5e9' },
            { k:'Fight target',v:`${fighter.target_weight} kg`, c:'#ef4444' },
          ].map(s => (
            <div key={s.k} className="rounded-lg p-3" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
              <div className="text-[10px] uppercase tracking-wider text-gray-500">{s.k}</div>
              <div className="text-xl font-black tabular-nums" style={{ color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Taper compliance */}
      <div className="rounded-xl p-5" style={{ background:'#0d1117', border:`1px solid ${taperCompliance === 'green' ? '#22c55e44' : taperCompliance === 'amber' ? '#f59e0b44' : '#ef444444'}` }}>
        <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-white">Taper Compliance · final 2 weeks</h3>
          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-md"
            style={{
              background: taperCompliance === 'green' ? 'rgba(34,197,94,0.16)' : taperCompliance === 'amber' ? 'rgba(245,158,11,0.16)' : 'rgba(239,68,68,0.16)',
              color: taperCompliance === 'green' ? '#22c55e' : taperCompliance === 'amber' ? '#f59e0b' : '#ef4444',
              border: `1px solid ${taperCompliance === 'green' ? '#22c55e55' : taperCompliance === 'amber' ? '#f59e0b55' : '#ef444455'}`,
            }}>
            {taperCompliance === 'green' ? '✓ On plan' : taperCompliance === 'amber' ? '⚠ Slightly over' : '⚠ Off plan'}
          </span>
        </div>
        <p className="text-[12px] text-gray-400">Target reduction: 30% W7, 50% W8 vs peak. Current trajectory shows planned drop to {PLANNED[6]} AU (W7) and {PLANNED[7]} AU (W8).</p>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {taperWeeks.map((w, i) => (
            <div key={w.wk} className="rounded-lg p-3" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
              <div className="text-[10px] uppercase tracking-wider text-gray-500">Week {w.wk} ({i === 0 ? 'pre-fight' : 'fight week'})</div>
              <div className="text-base font-bold text-white mt-1">{PLANNED[w.wk - 1]} AU planned · {w.current} kg</div>
              <div className="text-[11px] text-gray-500">{i === 0 ? '50% sparring volume reduction' : 'No sparring · pads + roadwork only'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── 4. Roadwork & Conditioning tab ─────────────────────────────────────────

function BoxingGpsRoadworkTab({ fighter }: { fighter: BoxingFighter }) {
  const RUNS = [
    { date:'Wed 9 Apr',  km:8.4, dur:'40:52', pace:'4:52', max:6.8, load:198 },
    { date:'Mon 7 Apr',  km:9.0, dur:'44:30', pace:'4:56', max:6.6, load:212 },
    { date:'Sat 5 Apr',  km:6.8, dur:'34:18', pace:'5:02', max:6.2, load:158 },
    { date:'Fri 4 Apr',  km:8.4, dur:'41:18', pace:'4:55', max:6.7, load:198 },
    { date:'Wed 2 Apr',  km:7.4, dur:'37:02', pace:'5:00', max:6.4, load:174 },
    { date:'Mon 31 Mar', km:8.1, dur:'40:30', pace:'5:00', max:6.5, load:188 },
    { date:'Sat 29 Mar', km:6.2, dur:'31:12', pace:'5:02', max:6.0, load:142 },
    { date:'Fri 28 Mar', km:7.2, dur:'36:12', pace:'5:02', max:6.3, load:170 },
    { date:'Wed 26 Mar', km:7.8, dur:'39:18', pace:'5:02', max:6.4, load:182 },
    { date:'Mon 24 Mar', km:6.8, dur:'34:12', pace:'5:01', max:6.2, load:160 },
  ]

  const WEEKLY_KM = [
    { wk:1, km:24, target:25 },
    { wk:2, km:30, target:30 },
    { wk:3, km:34, target:34 },
    { wk:4, km:36, target:36 },
    { wk:5, km:32, target:34 },
    { wk:6, km:28, target:30 },
    { wk:7, km:20, target:22 },
    { wk:8, km:12, target:14 },
  ]
  const maxKm = Math.max(...WEEKLY_KM.map(w => Math.max(w.km, w.target)))

  const PACE_ZONES = [
    { z:'Easy',      min:'5:30+',     time:24, c:'#22c55e' },
    { z:'Steady',    min:'5:00–5:30', time:42, c:'#0ea5e9' },
    { z:'Tempo',     min:'4:30–5:00', time:18, c:'#f59e0b' },
    { z:'Threshold', min:'<4:30',     time: 6, c:'#ef4444' },
  ]
  const totalTime = PACE_ZONES.reduce((s, z) => s + z.time, 0)

  const SC_SESSIONS = [
    { date:'Tue 8 Apr', focus:'Lower body', volume:'4×8 squat / 3×10 RDL / 3×12 lunge', load:280, recovery:'High' },
    { date:'Sat 5 Apr', focus:'Upper body', volume:'4×6 bench / 4×6 row / 3×10 OHP',     load:240, recovery:'Medium' },
    { date:'Thu 3 Apr', focus:'Core/anti-rotation', volume:'4 circuits, 30s on/off',   load:160, recovery:'Low' },
    { date:'Tue 1 Apr', focus:'Lower power',  volume:'5×3 box jump / 4×4 trap bar DL',  load:300, recovery:'High' },
  ]

  const FITNESS_TREND = [
    { wk:1, paceAtHR150:'5:18' },
    { wk:2, paceAtHR150:'5:14' },
    { wk:3, paceAtHR150:'5:08' },
    { wk:4, paceAtHR150:'5:04' },
    { wk:5, paceAtHR150:'5:00' },
    { wk:6, paceAtHR150:'4:56' },
  ]
  const paceToSec = (s: string) => {
    const [m, sec] = s.split(':').map(Number)
    return m * 60 + sec
  }

  const thisWeek = WEEKLY_KM[4]
  const progressPct = Math.round((thisWeek.km / thisWeek.target) * 100)

  return (
    <div className="space-y-5">
      {/* Roadwork log */}
      <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
        <h3 className="text-sm font-bold text-white mb-3">Roadwork Session Log · last 10</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800 text-[10px] uppercase tracking-wider">
                <th className="text-left py-2 px-2">Date</th>
                <th className="text-right py-2">Distance</th>
                <th className="text-right py-2">Duration</th>
                <th className="text-right py-2">Avg Pace</th>
                <th className="text-right py-2">Max Speed</th>
                <th className="text-right py-2">Load</th>
              </tr>
            </thead>
            <tbody>
              {RUNS.map((r, i) => (
                <tr key={i} className="border-b border-gray-800/40 hover:bg-white/[0.01]">
                  <td className="py-2 px-2 text-white">{r.date}</td>
                  <td className="py-2 text-right tabular-nums text-gray-200">{r.km.toFixed(1)} km</td>
                  <td className="py-2 text-right tabular-nums text-gray-200">{r.dur}</td>
                  <td className="py-2 text-right tabular-nums text-gray-200">{r.pace} /km</td>
                  <td className="py-2 text-right tabular-nums" style={{ color: r.max > 6.5 ? '#ef4444' : '#94a3b8' }}>{r.max.toFixed(1)} m/s</td>
                  <td className="py-2 text-right tabular-nums text-gray-200">{r.load} AU</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly volume */}
        <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
          <h3 className="text-sm font-bold text-white mb-3">Weekly Roadwork Volume · km</h3>
          <svg viewBox="0 0 360 200" width="100%">
            {[0,0.25,0.5,0.75,1].map((t, i) => <line key={i} x1={36} x2={350} y1={20 + (1 - t) * 140} y2={20 + (1 - t) * 140} stroke="rgba(255,255,255,0.05)" />)}
            {WEEKLY_KM.map((w, i) => {
              const x = 60 + i * 38
              const h = (w.km / maxKm) * 140
              const tH = (w.target / maxKm) * 140
              const c = w.km >= w.target ? '#22c55e' : '#f59e0b'
              return (
                <g key={i}>
                  <rect x={x} y={160 - tH} width="26" height={tH} fill="#475569" fillOpacity="0.3" rx="2" />
                  <rect x={x} y={160 - h}  width="26" height={h}  fill={c} opacity="0.9" rx="2" />
                  <text x={x + 13} y={160 - h - 4} fontSize="10" fill={c} textAnchor="middle" fontWeight="700">{w.km}</text>
                  <text x={x + 13} y={178} fontSize="9" fill="#94a3b8" textAnchor="middle">W{w.wk}</text>
                </g>
              )
            })}
          </svg>
          <div className="flex gap-4 mt-2 text-[10px] text-gray-500">
            <span><span className="inline-block w-3 h-3 bg-gray-600 rounded-sm align-middle mr-1.5" />Target</span>
            <span><span className="inline-block w-3 h-3 bg-green-500 rounded-sm align-middle mr-1.5" />Actual</span>
          </div>
        </div>

        {/* This week vs target */}
        <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
          <h3 className="text-sm font-bold text-white mb-3">This Week · {thisWeek.km}/{thisWeek.target} km</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-3xl font-black tabular-nums" style={{ color: progressPct >= 100 ? '#22c55e' : progressPct >= 85 ? '#f59e0b' : '#ef4444' }}>{progressPct}%</div>
            <div className="flex-1">
              <div className="h-3 rounded-full overflow-hidden" style={{ background:'#1F2937' }}>
                <div className="h-full" style={{ width:`${Math.min(100, progressPct)}%`, background: progressPct >= 100 ? '#22c55e' : progressPct >= 85 ? '#f59e0b' : '#ef4444' }} />
              </div>
              <div className="text-[11px] text-gray-500 mt-1">{thisWeek.km} km logged · {Math.max(0, thisWeek.target - thisWeek.km).toFixed(1)} km to plan</div>
            </div>
          </div>
          <div className="text-[11px] text-gray-400 leading-relaxed">Behind schedule by 2 km. Plan a tempo session Thursday plus a steady 8 km Friday to hit the 34 km target before peak.</div>
        </div>
      </div>

      {/* Pace by effort zone */}
      <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
        <h3 className="text-sm font-bold text-white mb-3">Pace by Effort Zone · time-in-zone</h3>
        <div className="space-y-2">
          {PACE_ZONES.map(z => {
            const pct = (z.time / totalTime) * 100
            return (
              <div key={z.z} className="flex items-center gap-3">
                <span className="text-[11px] text-gray-300" style={{ width:90 }}>{z.z}</span>
                <span className="text-[10px] tabular-nums text-gray-500" style={{ width:90 }}>{z.min}</span>
                <div className="flex-1 h-3 rounded-md overflow-hidden bg-gray-800">
                  <div className="h-full" style={{ width:`${pct}%`, background: z.c, boxShadow: z.c === '#ef4444' ? `0 0 6px ${z.c}66` : 'none' }} />
                </div>
                <span className="text-[11px] tabular-nums font-bold" style={{ width:60, color: z.c }}>{z.time} min</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* S&C sessions */}
      <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
        <h3 className="text-sm font-bold text-white mb-3">S&amp;C Sessions · last 4</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800 text-[10px] uppercase tracking-wider">
                <th className="text-left py-2 px-2">Date</th>
                <th className="text-left py-2">Focus</th>
                <th className="text-left py-2">Volume</th>
                <th className="text-right py-2">Load</th>
                <th className="text-center py-2">Recovery impact</th>
              </tr>
            </thead>
            <tbody>
              {SC_SESSIONS.map((s, i) => (
                <tr key={i} className="border-b border-gray-800/40">
                  <td className="py-2 px-2 text-white">{s.date}</td>
                  <td className="py-2 text-gray-300">{s.focus}</td>
                  <td className="py-2 text-gray-400 text-[11px]">{s.volume}</td>
                  <td className="py-2 text-right tabular-nums text-gray-200">{s.load} AU</td>
                  <td className="py-2 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                      style={{
                        background: s.recovery === 'High' ? 'rgba(239,68,68,0.16)' : s.recovery === 'Medium' ? 'rgba(245,158,11,0.16)' : 'rgba(34,197,94,0.16)',
                        color:      s.recovery === 'High' ? '#ef4444' : s.recovery === 'Medium' ? '#f59e0b' : '#22c55e',
                      }}>{s.recovery}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conditioning trend */}
      <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
        <h3 className="text-sm font-bold text-white mb-3">Conditioning Trend · pace at HR 150 (lower = fitter)</h3>
        <svg viewBox="0 0 360 180" width="100%">
          {[0,0.25,0.5,0.75,1].map((t, i) => <line key={i} x1={48} x2={350} y1={16 + (1 - t) * 130} y2={16 + (1 - t) * 130} stroke="rgba(255,255,255,0.05)" />)}
          {(() => {
            const seconds = FITNESS_TREND.map(f => paceToSec(f.paceAtHR150))
            const min = Math.min(...seconds), max = Math.max(...seconds)
            const norm = (s: number) => (s - min) / (max - min || 1)
            const path = FITNESS_TREND.map((f, i) => `${i === 0 ? 'M' : 'L'} ${48 + (i / (FITNESS_TREND.length - 1)) * 302} ${16 + norm(seconds[i]) * 130}`).join(' ')
            return (
              <g>
                <path d={path} fill="none" stroke="#0ea5e9" strokeWidth="2.5" />
                {FITNESS_TREND.map((f, i) => (
                  <g key={i}>
                    <circle cx={48 + (i / (FITNESS_TREND.length - 1)) * 302} cy={16 + norm(seconds[i]) * 130} r="3.5" fill="#0ea5e9" />
                    <text x={48 + (i / (FITNESS_TREND.length - 1)) * 302} y={16 + norm(seconds[i]) * 130 - 8} fontSize="9" fill="#0ea5e9" textAnchor="middle" fontWeight="700">{f.paceAtHR150}</text>
                    <text x={48 + (i / (FITNESS_TREND.length - 1)) * 302} y={166} fontSize="9" fill="#94a3b8" textAnchor="middle">W{f.wk}</text>
                  </g>
                ))}
              </g>
            )
          })()}
        </svg>
        <p className="text-[11px] mt-2 text-gray-400">Pace at HR 150 has dropped 22 seconds over 6 weeks — strong aerobic adaptation as camp builds.</p>
      </div>
    </div>
  )
}

// ─── 6. Connect GPS tab ─────────────────────────────────────────────────────

function BoxingGpsConnectTab({ fighter }: { fighter: BoxingFighter }) {
  const OTHER = [
    { name: 'Johan Sports',       sub:'10Hz GPS + IMU · OAuth or CSV import' },
    { name: 'CSV Upload',         sub:'Generic GPS export · any vendor · drag and drop' },
    { name: 'Polar Team Pro',     sub:'HR + GPS · Bluetooth sync' },
    { name: 'Whoop 4.0',          sub:'Strain + recovery score · personal device' },
    { name: 'Lumio Punch Analytics',sub:'Live punch tagging · sparring + fights' },
  ]
  return (
    <div className="space-y-5">
      {/* JOHAN featured partner card */}
      <div className="rounded-2xl p-6" style={{ background:'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(255,87,87,0.06) 70%, transparent 100%)', border:'1px solid #ef444466' }}>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background:'#ef4444', color:'#fff', boxShadow:'0 0 24px rgba(239,68,68,0.4)' }}>
            🥊
          </div>
          <div className="flex-1 min-w-[260px]">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color:'#fca5a5' }}>Featured Partner</div>
            <h2 className="text-2xl font-black text-white mt-1">JOHAN Sports</h2>
            <p className="text-[12px] text-gray-300 mt-1 leading-relaxed">The only GPS platform purpose-built for combat sports — UWB ring tracking, sparring telemetry, roadwork GPS and camp load automation in one feed. Lumio Boxing is JOHAN's official combat-sport surface.</p>
            <div className="mt-4 flex gap-2 flex-wrap">
              <button className="px-5 py-2 rounded-lg text-sm font-bold text-white" style={{ background:'#ef4444', cursor:'pointer', border:'none', boxShadow:'0 0 16px rgba(239,68,68,0.4)' }}>Connect JOHAN GPS →</button>
              <button className="px-5 py-2 rounded-lg text-sm font-medium" style={{ background:'transparent', color:'#fca5a5', border:'1px solid #ef444466', cursor:'pointer' }}>Read setup guide</button>
            </div>
          </div>
        </div>

        {/* What JOHAN unlocks */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon:'🏃',  k:'Roadwork GPS tracking',     v:'10Hz GPS · pace zones · sprint-effort detection · automatic upload to Lumio.' },
            { icon:'🛰️', k:'Ring movement real data',   v:'UWB beacons at corners · centre/ropes/corner % live · per-round position map.' },
            { icon:'🗓️', k:'Camp load automation',      v:'Daily load auto-aggregated · ACWR · taper compliance · weight tracking overlay.' },
          ].map(c => (
            <div key={c.k} className="rounded-xl p-4" style={{ background:'rgba(13,17,23,0.6)', border:'1px solid #1F2937' }}>
              <div className="text-2xl mb-2">{c.icon}</div>
              <div className="text-sm font-bold text-white">{c.k}</div>
              <div className="text-[11px] text-gray-400 mt-1 leading-relaxed">{c.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Other devices */}
      <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
        <h3 className="text-sm font-bold text-white mb-3">Other Compatible Devices</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {OTHER.map(d => (
            <div key={d.name} className="flex items-center justify-between p-3 rounded-lg" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
              <div>
                <div className="text-sm font-semibold text-white">{d.name}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{d.sub}</div>
              </div>
              <button className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md" style={{ background:'#1F2937', color:'#94a3b8', border:'1px solid #1F2937', cursor:'pointer' }}>Connect</button>
            </div>
          ))}
        </div>
      </div>

      {/* Sync status */}
      <div className="rounded-xl p-5" style={{ background:'#0d1117', border:'1px solid #1F2937' }}>
        <h3 className="text-sm font-bold text-white mb-3">Sync Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
          <div className="p-3 rounded-lg" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
            <div className="text-[10px] uppercase tracking-wider text-gray-500">Active devices</div>
            <div className="text-xl font-black text-green-400">2</div>
            <div className="text-gray-500">JOHAN vest · Whoop band</div>
          </div>
          <div className="p-3 rounded-lg" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
            <div className="text-[10px] uppercase tracking-wider text-gray-500">Last sync</div>
            <div className="text-xl font-black text-purple-400">Today 09:14</div>
            <div className="text-gray-500">After morning roadwork</div>
          </div>
          <div className="p-3 rounded-lg" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
            <div className="text-[10px] uppercase tracking-wider text-gray-500">Backlog</div>
            <div className="text-xl font-black text-green-400">0 MB</div>
            <div className="text-gray-500">All sessions ingested</div>
          </div>
        </div>
      </div>
    </div>
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── GPS HEATMAPS VIEW (multi-section) ────────────────────────────────────────
// Hero: Ring Movement. Plus Punch Zone, Footwork, Camp Load, Session GPS,
// Opponent Comparison. Pulls existing GPS_SESSIONS + RingHeatmap as the
// foundation for section 1 then layers boxing-specific overlays on top.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Red→amber→green heat scale (boxing aesthetic — high intensity = red).
function bxHeat(v: number): string {
  const c = Math.max(0, Math.min(1, v))
  const hue = 130 - c * 130
  const sat = 65 + c * 15
  const lig = 48 - c * 4
  return `hsl(${hue}, ${sat}%, ${lig}%)`
}
function bxGlow(v: number): string {
  const c = Math.max(0, Math.min(1, v))
  const hue = 130 - c * 130
  return `hsla(${hue}, 80%, 55%, ${0.2 + c * 0.5})`
}

function BoxingGpsHeatmapsView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  // ── Section 1 state — Ring Movement ─────────────────────────────────────
  const [activeRound, setActiveRound] = useState<number>(1)
  const [fullFight, setFullFight]     = useState(false)
  const [fightId, setFightId]         = useState('m5')
  const [activeFighter, setActiveFighter] = useState<'self'|'orthodox-pressure'|'southpaw-counter'>('self')

  // Round-by-round drawn from the prior heatmap tab content (kept verbatim).
  const ROUND_DATA = [
    { round:1, centre:61, ropes:18, corners:4, moving:17, distance:124, note:'Strong start — controls centre well' },
    { round:2, centre:54, ropes:24, corners:6, moving:16, distance:138, note:'Stoyan pressure beginning — gives ground' },
    { round:3, centre:48, ropes:31, corners:8, moving:13, distance:142, note:'Ropes % rising — fatigue or tactical?' },
    { round:4, centre:52, ropes:22, corners:5, moving:21, distance:131, note:'Recovery round — Jim adjusts between' },
    { round:5, centre:58, ropes:17, corners:3, moving:22, distance:126, note:'Best round — game plan working' },
    { round:6, centre:49, ropes:27, corners:9, moving:15, distance:147, note:'Tired — corner time spikes — flag physio' },
    { round:7, centre:46, ropes:30, corners:8, moving:16, distance:135, note:'Mid-fight pressure phase' },
    { round:8, centre:52, ropes:25, corners:6, moving:17, distance:130, note:'Corner adjustments help' },
    { round:9, centre:55, ropes:22, corners:5, moving:18, distance:128, note:'Re-asserting centre' },
    { round:10,centre:50, ropes:26, corners:7, moving:17, distance:133, note:'Trading on the move' },
    { round:11,centre:47, ropes:29, corners:8, moving:16, distance:139, note:'Late fatigue — still landing' },
    { round:12,centre:53, ropes:23, corners:6, moving:18, distance:131, note:'Closing strong — title round' },
  ]
  const round = ROUND_DATA[activeRound - 1] || ROUND_DATA[0]
  const fightAvg = {
    centre:  Math.round(ROUND_DATA.reduce((s,r)=>s+r.centre,0)/ROUND_DATA.length),
    ropes:   Math.round(ROUND_DATA.reduce((s,r)=>s+r.ropes,0)/ROUND_DATA.length),
    corners: Math.round(ROUND_DATA.reduce((s,r)=>s+r.corners,0)/ROUND_DATA.length),
    moving:  Math.round(ROUND_DATA.reduce((s,r)=>s+r.moving,0)/ROUND_DATA.length),
    distance:ROUND_DATA.reduce((s,r)=>s+r.distance,0),
  }
  const view = fullFight ? fightAvg : round

  const FIGHTS = [
    { id:'m5', vs:'Maks Stoyan',     date:'Jun 6',   state:'upcoming' },
    { id:'m4', vs:'Vasil Demirov',   date:'14 Feb',  state:'recent'   },
    { id:'m3', vs:'Tane Lealofi',    date:'18 Oct',  state:'recent'   },
    { id:'m2', vs:'Ben Hoffman',     date:'02 Aug',  state:'recent'   },
    { id:'m1', vs:'Jordan Markham',  date:'12 May',  state:'recent'   },
  ] as const

  // 9-zone ring heat (3×3) — used by the hero SVG. Higher = more time spent.
  const RING_ZONES = useMemo(() => {
    if (fullFight) {
      return [
        [0.18, 0.45, 0.18],
        [0.62, 1.00, 0.55],
        [0.20, 0.50, 0.22],
      ]
    }
    // Round-specific drift derived from centre/ropes ratio.
    const c = view.centre / 100
    const r = view.ropes / 100
    return [
      [r * 0.4, r * 0.9, r * 0.4],
      [c * 0.7, c * 1.0, c * 0.7],
      [r * 0.4, r * 0.8, r * 0.4],
    ]
  }, [fullFight, view.centre, view.ropes])

  // ── Section 2 state — Punch Zones ───────────────────────────────────────
  const [punchDir, setPunchDir]   = useState<'thrown'|'received'>('thrown')
  const [punchType, setPunchType] = useState<'all'|'jab'|'cross'|'hook'|'uppercut'>('all')

  // Body target zones (front-facing fighter). Heat values per punch type.
  type BodyZone = { id:string; label:string; cx:number; cy:number; jab:number; cross:number; hook:number; uppercut:number }
  const TARGETS_THROWN: BodyZone[] = [
    { id:'head-top',   label:'Head',           cx:100, cy:55,  jab:0.95, cross:0.85, hook:0.55, uppercut:0.30 },
    { id:'temple-l',   label:'Temple L',       cx:78,  cy:60,  jab:0.40, cross:0.30, hook:0.92, uppercut:0.10 },
    { id:'temple-r',   label:'Temple R',       cx:122, cy:60,  jab:0.30, cross:0.42, hook:0.78, uppercut:0.10 },
    { id:'chin',       label:'Chin',           cx:100, cy:80,  jab:0.55, cross:0.62, hook:0.35, uppercut:1.00 },
    { id:'body-l',     label:'Body (liver)',   cx:80,  cy:160, jab:0.10, cross:0.18, hook:0.95, uppercut:0.42 },
    { id:'body-r',     label:'Body (rib)',     cx:120, cy:160, jab:0.12, cross:0.22, hook:0.70, uppercut:0.38 },
    { id:'solar',      label:'Solar plexus',   cx:100, cy:165, jab:0.20, cross:0.55, hook:0.30, uppercut:0.65 },
  ]
  const TARGETS_RECEIVED: BodyZone[] = [
    { id:'head-top',   label:'Head',           cx:100, cy:55,  jab:0.62, cross:0.40, hook:0.28, uppercut:0.20 },
    { id:'temple-l',   label:'Temple L',       cx:78,  cy:60,  jab:0.18, cross:0.20, hook:0.55, uppercut:0.05 },
    { id:'temple-r',   label:'Temple R',       cx:122, cy:60,  jab:0.42, cross:0.55, hook:0.78, uppercut:0.10 },
    { id:'chin',       label:'Chin',           cx:100, cy:80,  jab:0.32, cross:0.45, hook:0.20, uppercut:0.42 },
    { id:'body-l',     label:'Body (liver)',   cx:80,  cy:160, jab:0.05, cross:0.10, hook:0.45, uppercut:0.18 },
    { id:'body-r',     label:'Body (rib)',     cx:120, cy:160, jab:0.08, cross:0.16, hook:0.40, uppercut:0.20 },
    { id:'solar',      label:'Solar plexus',   cx:100, cy:165, jab:0.10, cross:0.28, hook:0.18, uppercut:0.30 },
  ]
  const targets = punchDir === 'thrown' ? TARGETS_THROWN : TARGETS_RECEIVED
  const zoneVal = (z: BodyZone) => punchType === 'all'
    ? Math.max(0, Math.min(1, (z.jab + z.cross + z.hook + z.uppercut) / 4 * 1.6))
    : (z as any)[punchType] as number

  // Power-vs-jab counts per punch type.
  const PUNCH_BREAKDOWN = punchDir === 'thrown'
    ? [{ k:'Jab', v:182, c:0.22 }, { k:'Cross', v:96, c:0.62 }, { k:'Hook', v:74, c:0.85 }, { k:'Uppercut', v:38, c:0.95 }]
    : [{ k:'Jab', v:88,  c:0.22 }, { k:'Cross', v:42, c:0.62 }, { k:'Hook', v:36, c:0.85 }, { k:'Uppercut', v:14, c:0.95 }]
  const totalPunches = PUNCH_BREAKDOWN.reduce((s, x) => s + x.v, 0)
  const powerPunches = PUNCH_BREAKDOWN.filter(p => p.k !== 'Jab').reduce((s, x) => s + x.v, 0)
  const jabs = totalPunches - powerPunches

  // ── Section 3 — Footwork & Movement ─────────────────────────────────────
  const FOOTWORK_PATH: { x:number; y:number }[] = [
    { x:150, y:150 }, { x:160, y:130 }, { x:175, y:118 }, { x:200, y:115 },
    { x:225, y:130 }, { x:235, y:155 }, { x:225, y:185 }, { x:200, y:200 },
    { x:170, y:195 }, { x:150, y:175 }, { x:140, y:150 }, { x:160, y:130 },
  ]
  const ADVANCE_RETREAT = [
    { zone:'Centre',         adv:62, ret:18, neu:20 },
    { zone:'Ropes (front)',  adv:28, ret:48, neu:24 },
    { zone:'Ropes (back)',   adv:18, ret:62, neu:20 },
    { zone:'Corners',        adv:12, ret:74, neu:14 },
  ]
  const LATERAL_PREF = { left:58, right:42 }
  const CORNER_TRAPS = [
    { round:1, traps:0 }, { round:2, traps:1 }, { round:3, traps:3 }, { round:4, traps:1 },
    { round:5, traps:0 }, { round:6, traps:4 }, { round:7, traps:2 }, { round:8, traps:1 },
    { round:9, traps:1 }, { round:10,traps:2 }, { round:11,traps:3 }, { round:12,traps:1 },
  ]
  const DISTANCE_BY_ROUND = ROUND_DATA.map(r => ({ round:r.round, distance:r.distance }))

  // ── Section 4 — Fight Camp Load ─────────────────────────────────────────
  // 8-week × 7-day calendar. Each cell = load 0–1 + training type.
  type CampDay = { load:number; type:'roadwork'|'sparring'|'sandc'|'pads'|'rest' }
  const TRAINING_TYPES = {
    roadwork: { color:'#22c55e', label:'Roadwork' },
    sparring: { color:'#ef4444', label:'Sparring' },
    sandc:    { color:'#a855f7', label:'S&C' },
    pads:     { color:'#f59e0b', label:'Pads' },
    rest:     { color:'#475569', label:'Rest' },
  } as const
  const CAMP_GRID: CampDay[][] = [
    // W1 (foundation)
    [{load:0.45,type:'roadwork'},{load:0.50,type:'sandc'},{load:0.55,type:'pads'},{load:0.40,type:'roadwork'},{load:0.55,type:'sandc'},{load:0.60,type:'sparring'},{load:0.10,type:'rest'}],
    [{load:0.55,type:'roadwork'},{load:0.62,type:'sandc'},{load:0.72,type:'sparring'},{load:0.45,type:'roadwork'},{load:0.60,type:'sandc'},{load:0.78,type:'sparring'},{load:0.10,type:'rest'}],
    [{load:0.60,type:'roadwork'},{load:0.70,type:'sandc'},{load:0.82,type:'sparring'},{load:0.50,type:'roadwork'},{load:0.65,type:'sandc'},{load:0.85,type:'sparring'},{load:0.10,type:'rest'}],
    [{load:0.65,type:'roadwork'},{load:0.78,type:'sandc'},{load:0.92,type:'sparring'},{load:0.55,type:'pads'},{load:0.72,type:'sandc'},{load:0.95,type:'sparring'},{load:0.10,type:'rest'}],
    // W5 (peak load)
    [{load:0.72,type:'roadwork'},{load:0.85,type:'sandc'},{load:0.98,type:'sparring'},{load:0.60,type:'pads'},{load:0.80,type:'sandc'},{load:1.00,type:'sparring'},{load:0.10,type:'rest'}],
    [{load:0.70,type:'roadwork'},{load:0.78,type:'sandc'},{load:0.92,type:'sparring'},{load:0.55,type:'pads'},{load:0.72,type:'sandc'},{load:0.88,type:'sparring'},{load:0.10,type:'rest'}],
    // W7-8 (taper)
    [{load:0.55,type:'roadwork'},{load:0.50,type:'pads'},{load:0.62,type:'sparring'},{load:0.40,type:'pads'},{load:0.45,type:'sandc'},{load:0.50,type:'sparring'},{load:0.10,type:'rest'}],
    [{load:0.40,type:'roadwork'},{load:0.32,type:'pads'},{load:0.30,type:'pads'},{load:0.20,type:'rest'},{load:0.18,type:'pads'},{load:0.15,type:'rest'},{load:0.05,type:'rest'}],
  ]
  // Sparring rounds cumulative (head contact load proxy).
  const SPARRING_CUM = CAMP_GRID.map((wk,i) => wk.filter(d => d.type === 'sparring').reduce((s,d) => s + Math.round(d.load * 8), 0))
  const SPARRING_TOTALS = SPARRING_CUM.reduce<number[]>((acc, v, i) => { acc.push((acc[i-1] ?? 0) + v); return acc }, [])
  // Weight cut tracking — kg over target per week.
  const WEIGHT_OVER = [9.8, 8.6, 7.2, 6.1, 5.0, 4.0, 2.4, 0.4]

  // ── Section 5 — Session GPS ─────────────────────────────────────────────
  const SESSION_ZONES = [
    { label:'Roadwork', zones:[
      { z:'Walk',    m:420,  c:0.10 },
      { z:'Jog',     m:3200, c:0.35 },
      { z:'Tempo',   m:3100, c:0.62 },
      { z:'Sprint',  m:1480, c:0.95 },
      { z:'Recovery',m:200,  c:0.05 },
    ]},
    { label:'Pad work', zones:[
      { z:'Stand',   m:240,  c:0.08 },
      { z:'Step',    m:880,  c:0.32 },
      { z:'Bounce',  m:1640, c:0.55 },
      { z:'Burst',   m:540,  c:0.92 },
    ]},
    { label:'Sparring', zones:[
      { z:'Stand',   m:160,  c:0.08 },
      { z:'Move',    m:2240, c:0.45 },
      { z:'Pursue',  m:1120, c:0.70 },
      { z:'Burst',   m:380,  c:0.95 },
    ]},
  ]
  const ROADWORK_ACCEL = [
    { x:18, y:32, v:0.45 }, { x:30, y:28, v:0.55 }, { x:42, y:34, v:0.62 }, { x:55, y:30, v:0.78 },
    { x:68, y:36, v:0.92 }, { x:75, y:42, v:0.85 }, { x:82, y:50, v:0.55 }, { x:88, y:58, v:0.42 },
  ]
  const WEEKLY_LOAD = [
    { lbl:'This week',    val:1850, c:0.78 },
    { lbl:'Last week',    val:1620, c:0.62 },
    { lbl:'Camp average', val:1580, c:0.50 },
  ]

  // ── Section 6 — Opponent Comparison ─────────────────────────────────────
  const OPP_ZONES = [
    [0.30, 0.65, 0.30], // pressure fighter — works front/middle ropes
    [0.42, 0.78, 0.40],
    [0.10, 0.30, 0.10],
  ]
  const COMPARISON = [
    { zone:'Centre',  self: fightAvg.centre,  opp: 35 },
    { zone:'Ropes',   self: fightAvg.ropes,   opp: 48 },
    { zone:'Corners', self: fightAvg.corners, opp: 12 },
    { zone:'Moving',  self: fightAvg.moving,  opp:  5 },
  ]

  // ── Render helpers ──────────────────────────────────────────────────────
  const heatStops = Array.from({ length: 24 }).map((_, i) => bxHeat(i / 23))

  const Pill = ({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) => (
    <button onClick={onClick}
      className="text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors"
      style={{
        border: `1px solid ${active ? '#ef4444' : '#1F2937'}`,
        background: active ? 'rgba(239,68,68,0.16)' : 'transparent',
        color: active ? '#fca5a5' : '#94a3b8',
        cursor: 'pointer',
      }}>
      {children}
    </button>
  )

  const SectionTitle = ({ k, t, sub }: { k:string; t:string; sub?:string }) => (
    <div className="mb-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#ef4444' }}>{k}</div>
      <h3 className="text-base font-bold text-white mt-1">{t}</h3>
      {sub && <p className="text-[11px]" style={{ color: '#94a3b8' }}>{sub}</p>}
    </div>
  )

  return (
    <div className="space-y-6">
      <SectionHeader icon="🔥" title="GPS Heatmaps" subtitle="Ring movement, punch zones, footwork, camp load and opponent comparison — all from Lumio GPS + Lumio Punch Analytics feeds." />

      {/* ─── 1. RING MOVEMENT HEATMAP (HERO) ─────────────────────────── */}
      <div className="rounded-xl p-6" style={{ background: 'linear-gradient(180deg,#0d1117 0%,#0a0d13 100%)', border: '1px solid #1F2937' }}>
        <div className="flex items-start gap-4 mb-4 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#ef4444' }}>Hero · Ring Movement Heatmap</div>
            <h2 className="text-2xl font-black text-white mt-1">Where {fighter.name.split(' ')[0]} fought</h2>
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>Position density across {fullFight ? 'the full fight' : `Round ${activeRound}`} — UWB beacons at the corners track at 10 Hz.</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.06em]" style={{ color: '#475569' }}>HEAT</span>
              <span className="text-[10px]" style={{ color: '#475569' }}>rare</span>
              <div className="flex h-1.5 w-32 overflow-hidden rounded-sm" style={{ border: '1px solid #1F2937' }}>
                {heatStops.map((s, i) => <div key={i} className="flex-1" style={{ background: s }} />)}
              </div>
              <span className="text-[10px]" style={{ color: '#475569' }}>primary</span>
            </div>
            <div className="text-[11px] flex gap-3" style={{ color: '#475569' }}>
              <span>DIST <span className="text-white font-semibold">{(fightAvg.distance/1000).toFixed(2)} km</span></span>
              <span>·</span>
              <span>ROUNDS <span className="text-white font-semibold">{ROUND_DATA.length}</span></span>
            </div>
          </div>
        </div>

        {/* Fighter selector */}
        <div className="flex gap-1.5 flex-wrap mb-2">
          {[
            { id:'self' as const,              label:`${fighter.name} (You)` },
            { id:'orthodox-pressure' as const, label:'Orthodox / pressure' },
            { id:'southpaw-counter' as const,  label:'Southpaw / counter' },
          ].map(f => <Pill key={f.id} active={f.id === activeFighter} onClick={() => setActiveFighter(f.id)}>{f.label}</Pill>)}
        </div>

        {/* Fight selector */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {FIGHTS.map(f => (
            <Pill key={f.id} active={f.id === fightId} onClick={() => setFightId(f.id)}>
              <span className="opacity-70 mr-1.5">{f.date}</span>
              vs {f.vs}
              {f.state === 'upcoming' && <span className="ml-1.5 text-[9px] font-bold px-1 py-0.5 rounded-sm" style={{ background:'#ef4444', color:'#fff' }}>NEXT</span>}
            </Pill>
          ))}
        </div>

        {/* Round selector + full-fight toggle */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>Round</span>
          {ROUND_DATA.map((_, i) => (
            <button key={i} onClick={() => { setFullFight(false); setActiveRound(i + 1) }}
              className="rounded-md text-[11px] font-bold transition-colors"
              style={{
                width: 28, height: 28,
                background: !fullFight && activeRound === i + 1 ? '#ef4444' : '#1F2937',
                color: !fullFight && activeRound === i + 1 ? '#fff' : '#94a3b8',
                border: 'none', cursor: 'pointer',
              }}>R{i + 1}</button>
          ))}
          <button onClick={() => setFullFight(f => !f)}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-md ml-2"
            style={{
              background: fullFight ? '#ef4444' : 'transparent',
              color: fullFight ? '#fff' : '#fca5a5',
              border: `1px solid ${fullFight ? '#ef4444' : '#ef444466'}`,
              cursor: 'pointer',
            }}>
            {fullFight ? '✓ Full fight' : 'Full fight'}
          </button>
        </div>

        {/* Hero ring SVG */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
          <div className="rounded-xl overflow-hidden" style={{ background: '#07090f', border: '1px solid #1F2937' }}>
            <svg viewBox="0 0 400 400" className="w-full h-full block">
              <defs>
                <radialGradient id="bx-canvas" cx="50%" cy="50%" r="65%">
                  <stop offset="0%"  stopColor="#1f1a14" />
                  <stop offset="100%" stopColor="#0a0805" />
                </radialGradient>
                <pattern id="bx-canvas-tex" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
                  <path d="M0 6 L6 0" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                </pattern>
                <filter id="bx-blur" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="14" />
                </filter>
                {/* Per-cell radial gradients */}
                {RING_ZONES.map((row, ri) => row.map((v, ci) => (
                  <radialGradient key={`${ri}-${ci}`} id={`bx-cell-${ri}-${ci}`} cx="50%" cy="50%" r="60%">
                    <stop offset="0%"  stopColor={bxHeat(v)} stopOpacity={0.7 + v * 0.3} />
                    <stop offset="55%" stopColor={bxHeat(v)} stopOpacity={0.18 + v * 0.3} />
                    <stop offset="100%" stopColor={bxHeat(v)} stopOpacity={0} />
                  </radialGradient>
                )))}
              </defs>

              {/* Canvas */}
              <rect x="40" y="40" width="320" height="320" rx="6" fill="url(#bx-canvas)" />
              <rect x="40" y="40" width="320" height="320" rx="6" fill="url(#bx-canvas-tex)" />

              {/* Apron border */}
              <rect x="34" y="34" width="332" height="332" rx="8" fill="none" stroke="#3a2a14" strokeWidth="3" />
              <rect x="40" y="40" width="320" height="320" rx="6" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />

              {/* Ropes (4 strands per side) */}
              {[0, 1, 2, 3].map(i => {
                const off = 8 + i * 7
                const colors = ['#dc2626','#fafafa','#1d4ed8','#facc15']
                return (
                  <g key={`ropes-${i}`} stroke={colors[i]} strokeWidth="1.6" opacity="0.8" fill="none">
                    <line x1={40 - off} y1="40" x2={40 - off} y2="360" />
                    <line x1={360 + off} y1="40" x2={360 + off} y2="360" />
                    <line x1="40" y1={40 - off} x2="360" y2={40 - off} />
                    <line x1="40" y1={360 + off} x2="360" y2={360 + off} />
                  </g>
                )
              })}

              {/* Corner posts (red / blue / neutral / neutral) */}
              {[
                { x:20,  y:20,  c:'#dc2626' },
                { x:360, y:20,  c:'#1d4ed8' },
                { x:20,  y:360, c:'#fafafa' },
                { x:360, y:360, c:'#fafafa' },
              ].map((p, i) => (
                <g key={`post-${i}`}>
                  <rect x={p.x} y={p.y} width="20" height="20" rx="3" fill={p.c} stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
                  <rect x={p.x + 4} y={p.y + 4} width="12" height="12" rx="1.5" fill="rgba(0,0,0,0.25)" />
                </g>
              ))}

              {/* Centre lines */}
              <line x1="200" y1="40" x2="200" y2="360" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 4" />
              <line x1="40" y1="200" x2="360" y2="200" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 4" />

              {/* Heat blobs (3×3 cells) */}
              <g filter="url(#bx-blur)">
                {RING_ZONES.map((row, ri) => row.map((v, ci) => (
                  v > 0.05 && (
                    <circle key={`blob-${ri}-${ci}`}
                      cx={70 + ci * 130} cy={70 + ri * 130}
                      r={48 + v * 36}
                      fill={`url(#bx-cell-${ri}-${ci})`} />
                  )
                )))}
              </g>

              {/* Per-cell labels */}
              {RING_ZONES.map((row, ri) => row.map((v, ci) => (
                <g key={`lbl-${ri}-${ci}`}>
                  <text x={70 + ci * 130} y={70 + ri * 130 + 3} textAnchor="middle"
                    fontSize="11" fontWeight="700"
                    fill={v > 0.5 ? '#fff' : 'rgba(255,255,255,0.4)'}>
                    {Math.round(v * 100)}%
                  </text>
                </g>
              )))}

              {/* Centre primary marker */}
              {RING_ZONES[1][1] > 0.55 && (
                <circle cx="200" cy="200" r="14" fill="none" stroke={bxHeat(RING_ZONES[1][1])} strokeWidth="1.6" opacity="0.9">
                  <animate attributeName="r"       values="12;22;12" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0.15;0.9" dur="2.4s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Zone labels (subtle) */}
              {[
                { t:'NW', x:70,  y:55  }, { t:'N', x:200, y:55  }, { t:'NE', x:330, y:55  },
                { t:'W',  x:55,  y:200 }, { t:'CENTRE', x:200, y:182 }, { t:'E', x:345, y:200 },
                { t:'SW', x:70,  y:355 }, { t:'S', x:200, y:355 }, { t:'SE', x:330, y:355 },
              ].map((l, i) => (
                <text key={i} x={l.x} y={l.y} textAnchor="middle" fontSize="7.5"
                  fill="rgba(255,255,255,0.32)" letterSpacing="0.12em">{l.t}</text>
              ))}
            </svg>
          </div>

          {/* Round breakdown */}
          <div className="space-y-3">
            <div className="rounded-xl p-4" style={{ background: '#0d1117', border: '1px solid #1F2937' }}>
              <div className="flex items-baseline gap-2 mb-3">
                <h3 className="text-sm font-bold text-white">{fullFight ? 'Fight Average' : `Round ${activeRound}`}</h3>
                <span className="text-[10px]" style={{ color:'#475569' }}>vs {FIGHTS.find(f=>f.id===fightId)?.vs}</span>
              </div>
              {[
                { label:'Centre Control', value:view.centre,  target:55, color:'#22c55e' },
                { label:'Ropes Time',     value:view.ropes,    target:25, color:'#ef4444', invert:true },
                { label:'Corner Time',    value:view.corners,  target:7,  color:'#f59e0b', invert:true },
                { label:'Active Movement',value:view.moving,   target:18, color:'#0ea5e9' },
              ].map(stat => (
                <div key={stat.label} className="mb-2.5">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{ color: '#94a3b8' }}>{stat.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: stat.color }}>{stat.value}%</span>
                      <span className="text-[10px]" style={{ color: '#475569' }}>target {stat.target}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: '#1F2937' }}>
                    <div className="h-full rounded-full transition-all" style={{ background: stat.color, width: `${Math.min(stat.value, 100)}%` }} />
                  </div>
                </div>
              ))}
              {!fullFight && <p className="text-xs italic mt-3" style={{ color: '#94a3b8' }}>{round.note}</p>}
              <p className="text-[11px] mt-2" style={{ color: '#6B7280' }}>Distance: <span className="text-white font-semibold">{view.distance}m</span></p>
            </div>
            <div className="rounded-xl p-4" style={{ background: '#0d1117', border: '1px solid #ef444430' }}>
              <div className="flex items-center gap-2 mb-2"><span>✨</span><span className="text-xs font-bold" style={{ color:'#ef4444' }}>AI Ring Intelligence</span></div>
              <p className="text-xs leading-relaxed" style={{ color:'#94a3b8' }}>
                Marcus&apos;s ropes % rises 8 pp in rounds 3 and 6 — a fatigue signature. Centre control is strong rounds 1–2 but compresses under sustained pressure. Drill priority: lateral ring escape on ropes and foot-speed maintenance rounds 5–8 of sparring.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. PUNCH ZONE HEATMAP ────────────────────────────────────── */}
      <div className="rounded-xl p-6" style={{ background: '#0d1117', border: '1px solid #1F2937' }}>
        <SectionTitle k="Section 02" t="Punch Zone Heatmap" sub="Where punches landed (or were absorbed). Punch-analytics-fused per round." />

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="flex gap-1 rounded-lg p-1" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
            <button onClick={() => setPunchDir('thrown')}   className="px-3 py-1 rounded text-[11px] font-medium" style={{ background: punchDir==='thrown' ? '#ef4444' : 'transparent', color: punchDir==='thrown' ? '#fff' : '#94a3b8', border:'none', cursor:'pointer' }}>Thrown to →</button>
            <button onClick={() => setPunchDir('received')} className="px-3 py-1 rounded text-[11px] font-medium" style={{ background: punchDir==='received' ? '#ef4444' : 'transparent', color: punchDir==='received' ? '#fff' : '#94a3b8', border:'none', cursor:'pointer' }}>← Received from</button>
          </div>
          <span style={{ color:'#475569' }} className="text-[10px] uppercase tracking-wider mx-2">Filter</span>
          {(['all','jab','cross','hook','uppercut'] as const).map(t => (
            <Pill key={t} active={punchType === t} onClick={() => setPunchType(t)}>{t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}</Pill>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5">
          {/* Body silhouette SVG */}
          <div className="rounded-xl p-4 flex justify-center" style={{ background: '#07090f', border: '1px solid #1F2937' }}>
            <svg viewBox="0 0 200 280" className="w-full max-w-[280px] block">
              <defs>
                <radialGradient id="bx-body-bg" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#11151d" />
                  <stop offset="100%" stopColor="#07090f" />
                </radialGradient>
                <filter id="bx-body-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" />
                </filter>
                {targets.map(z => {
                  const v = zoneVal(z)
                  return (
                    <radialGradient key={`bg-${z.id}`} id={`bx-bz-${z.id}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%"  stopColor={bxHeat(v)} stopOpacity={0.7 + v * 0.3} />
                      <stop offset="55%" stopColor={bxHeat(v)} stopOpacity={0.2 + v * 0.25} />
                      <stop offset="100%" stopColor={bxHeat(v)} stopOpacity={0} />
                    </radialGradient>
                  )
                })}
              </defs>
              <rect width="200" height="280" fill="url(#bx-body-bg)" />

              {/* Silhouette */}
              <g fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" strokeWidth="1">
                {/* Head */}
                <ellipse cx="100" cy="50" rx="22" ry="26" />
                {/* Neck */}
                <rect x="92" y="73" width="16" height="10" />
                {/* Torso */}
                <path d="M 68 84 L 132 84 L 138 130 L 130 200 L 70 200 L 62 130 Z" />
                {/* Arms */}
                <path d="M 68 86 L 50 110 L 44 160 L 50 200 L 60 198 L 58 160 L 64 120 Z" />
                <path d="M 132 86 L 150 110 L 156 160 L 150 200 L 140 198 L 142 160 L 136 120 Z" />
                {/* Gloves */}
                <ellipse cx="48" cy="208" rx="14" ry="16" fill="#dc2626" stroke="#7f1d1d" />
                <ellipse cx="152" cy="208" rx="14" ry="16" fill="#dc2626" stroke="#7f1d1d" />
                {/* Trunks */}
                <path d="M 70 200 L 130 200 L 132 240 L 100 248 L 68 240 Z" fill="rgba(220,38,38,0.18)" stroke="rgba(220,38,38,0.4)" />
                {/* Legs */}
                <path d="M 78 248 L 86 280 L 96 280 L 98 248 Z" />
                <path d="M 102 248 L 104 280 L 114 280 L 122 248 Z" />
                {/* Shoulders / muscle hint */}
                <line x1="80" y1="100" x2="120" y2="100" stroke="rgba(255,255,255,0.05)" />
                <line x1="100" y1="84" x2="100" y2="200" stroke="rgba(255,255,255,0.05)" />
              </g>

              {/* Heat blobs */}
              <g filter="url(#bx-body-glow)">
                {targets.map(z => {
                  const v = zoneVal(z)
                  return v > 0.04 && (
                    <circle key={`blob-${z.id}`} cx={z.cx} cy={z.cy} r={14 + v * 22} fill={`url(#bx-bz-${z.id})`} />
                  )
                })}
              </g>

              {/* Markers + labels */}
              {targets.map(z => {
                const v = zoneVal(z)
                return (
                  <g key={`m-${z.id}`}>
                    <circle cx={z.cx} cy={z.cy} r={v > 0.05 ? 3.5 + v * 2 : 2}
                      fill={v > 0.05 ? bxHeat(v) : 'rgba(255,255,255,0.25)'}
                      stroke="rgba(0,0,0,0.6)" strokeWidth="0.8" />
                    {v > 0.4 && (
                      <text x={z.cx} y={z.cy + 3} textAnchor="middle" fontSize="7" fontWeight="700" fill="#fff">
                        {Math.round(v * 100)}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Punch breakdown */}
          <div className="space-y-3">
            <div className="rounded-xl p-4" style={{ background: '#0a0d13', border: '1px solid #1F2937' }}>
              <div className="flex items-baseline gap-2 mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>{punchDir === 'thrown' ? 'Punches thrown' : 'Punches received'}</h4>
                <span className="ml-auto text-[10px]" style={{ color:'#475569' }}>last fight · 12 rounds</span>
              </div>
              {PUNCH_BREAKDOWN.map(p => {
                const pct = (p.v / Math.max(...PUNCH_BREAKDOWN.map(x => x.v))) * 100
                return (
                  <div key={p.k} className="mb-2.5">
                    <div className="flex justify-between mb-1 text-[11px]">
                      <span className="text-white font-medium">{p.k}</span>
                      <span style={{ color: bxHeat(p.c) }} className="font-bold">{p.v}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background:'#1F2937' }}>
                      <div className="h-full" style={{ background: bxHeat(p.c), width: `${pct}%`, boxShadow: p.c > 0.7 ? `0 0 8px ${bxGlow(p.c)}` : 'none' }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
                <div className="text-[10px] uppercase tracking-wider" style={{ color:'#475569' }}>Power punches</div>
                <div className="text-2xl font-black mt-1" style={{ color: '#ef4444' }}>{powerPunches}</div>
                <div className="text-[11px]" style={{ color:'#94a3b8' }}>{Math.round(powerPunches / totalPunches * 100)}% of total · cross+hook+uppercut</div>
              </div>
              <div className="rounded-xl p-4" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
                <div className="text-[10px] uppercase tracking-wider" style={{ color:'#475569' }}>Jabs</div>
                <div className="text-2xl font-black mt-1" style={{ color: '#22c55e' }}>{jabs}</div>
                <div className="text-[11px]" style={{ color:'#94a3b8' }}>{Math.round(jabs / totalPunches * 100)}% of total · range setting</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. FOOTWORK & MOVEMENT ──────────────────────────────────── */}
      <div className="rounded-xl p-6" style={{ background: '#0d1117', border: '1px solid #1F2937' }}>
        <SectionTitle k="Section 03" t="Footwork & Movement Heatmap" sub="Path, advance/retreat ratios and corner-trap frequency." />

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
          {/* Movement path SVG */}
          <div className="rounded-xl p-4" style={{ background:'#07090f', border:'1px solid #1F2937' }}>
            <div className="text-[10px] uppercase tracking-wider mb-3" style={{ color:'#475569' }}>Round {activeRound} movement path</div>
            <svg viewBox="0 0 320 320" className="w-full block">
              <defs>
                <marker id="bx-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>
              </defs>
              <rect x="20" y="20" width="280" height="280" rx="6" fill="#1a1408" stroke="#3a2a14" strokeWidth="2" />
              <rect x="20" y="20" width="280" height="280" rx="6" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
              {/* Heat circles along path */}
              {FOOTWORK_PATH.map((p, i) => {
                const v = 0.3 + (Math.sin(i / 1.5) + 1) / 4
                return <circle key={i} cx={p.x} cy={p.y} r={6 + v * 10} fill={bxHeat(v)} fillOpacity={0.18 + v * 0.3} style={{ filter:'blur(6px)' }} />
              })}
              {/* Path */}
              <path d={FOOTWORK_PATH.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                fill="none" stroke="#ef4444" strokeWidth="1.6" strokeOpacity="0.85" markerEnd="url(#bx-arrow)" />
              {/* Path nodes */}
              {FOOTWORK_PATH.map((p, i) => (
                <circle key={`n-${i}`} cx={p.x} cy={p.y} r="2.5" fill="#fca5a5" stroke="#7f1d1d" strokeWidth="0.6" />
              ))}
              {/* Corner posts */}
              {[[8,8],[300,8],[8,300],[300,300]].map(([x,y],i) => {
                const colors = ['#dc2626','#1d4ed8','#fafafa','#fafafa']
                return <rect key={i} x={x} y={y} width="14" height="14" rx="2" fill={colors[i]} opacity="0.6" />
              })}
            </svg>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-lg p-3" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
                <div className="text-[10px] uppercase tracking-wider" style={{ color:'#475569' }}>Lateral preference</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 flex-1 rounded-full overflow-hidden flex" style={{ background:'#1F2937' }}>
                    <div style={{ width: `${LATERAL_PREF.left}%`,  background: '#0ea5e9' }} />
                    <div style={{ width: `${LATERAL_PREF.right}%`, background: '#a855f7' }} />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] mt-1">
                  <span style={{ color:'#0ea5e9' }}>← Left {LATERAL_PREF.left}%</span>
                  <span style={{ color:'#a855f7' }}>Right {LATERAL_PREF.right}% →</span>
                </div>
              </div>
              <div className="rounded-lg p-3" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
                <div className="text-[10px] uppercase tracking-wider" style={{ color:'#475569' }}>Corner traps · per round</div>
                <div className="flex items-end gap-1 h-10 mt-1">
                  {CORNER_TRAPS.map(c => {
                    const max = Math.max(...CORNER_TRAPS.map(x => x.traps))
                    const h = max > 0 ? (c.traps / max) * 100 : 0
                    return <div key={c.round} className="flex-1 rounded-t" style={{ height:`${h}%`, background: bxHeat(c.traps / max), boxShadow: c.traps >= 3 ? `0 0 6px ${bxGlow(0.9)}` : 'none' }} title={`R${c.round}: ${c.traps}`} />
                  })}
                </div>
                <div className="text-[10px] mt-1" style={{ color:'#94a3b8' }}>Total traps <span className="text-white font-bold">{CORNER_TRAPS.reduce((s,c) => s + c.traps, 0)}</span></div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-3">
            <div className="rounded-xl p-4" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color:'#94a3b8' }}>Advance vs retreat by zone</h4>
              {ADVANCE_RETREAT.map(r => (
                <div key={r.zone} className="mb-2.5">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-white font-medium">{r.zone}</span>
                    <span style={{ color:'#475569' }}><span style={{ color:'#22c55e' }}>{r.adv}</span> · <span style={{ color:'#ef4444' }}>{r.ret}</span> · <span style={{ color:'#94a3b8' }}>{r.neu}</span></span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden" style={{ background:'#1F2937' }}>
                    <div style={{ width:`${r.adv}%`, background:'#22c55e' }} />
                    <div style={{ width:`${r.neu}%`, background:'#475569' }} />
                    <div style={{ width:`${r.ret}%`, background:'#ef4444' }} />
                  </div>
                </div>
              ))}
              <div className="flex gap-3 mt-2 text-[10px]" style={{ color:'#94a3b8' }}>
                <span>● <span style={{ color:'#22c55e' }}>Advance</span></span>
                <span>● <span style={{ color:'#475569' }}>Neutral</span></span>
                <span>● <span style={{ color:'#ef4444' }}>Retreat</span></span>
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color:'#94a3b8' }}>Distance covered per round</h4>
              <div className="flex items-end gap-1.5" style={{ height:80 }}>
                {DISTANCE_BY_ROUND.map(r => {
                  const max = Math.max(...DISTANCE_BY_ROUND.map(x => x.distance))
                  const v = r.distance / max
                  return (
                    <div key={r.round} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t" style={{ height:`${v * 64}px`, background: bxHeat(v), boxShadow: v > 0.85 ? `0 0 6px ${bxGlow(v)}` : 'none' }} title={`R${r.round}: ${r.distance}m`} />
                      <span className="text-[9px]" style={{ color:'#475569' }}>{r.round}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. FIGHT CAMP LOAD HEATMAP ──────────────────────────────── */}
      <div className="rounded-xl p-6" style={{ background: '#0d1117', border: '1px solid #1F2937' }}>
        <SectionTitle k="Section 04" t="Fight Camp Load Heatmap" sub="8-week camp · training type, sparring contact load, taper and weight cut overlay." />

        {/* Calendar grid */}
        <div className="rounded-xl p-4 mb-4" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {(Object.keys(TRAINING_TYPES) as Array<keyof typeof TRAINING_TYPES>).map(k => (
              <div key={k} className="flex items-center gap-1.5 text-[10px]" style={{ color:'#94a3b8' }}>
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: TRAINING_TYPES[k].color }} />
                {TRAINING_TYPES[k].label}
              </div>
            ))}
            <div className="ml-auto text-[10px]" style={{ color:'#475569' }}>cell brightness = intensity · ring = sparring · last 2 weeks = taper</div>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
            <div />
            {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d => <div key={d} className="text-[10px]" style={{ color:'#475569' }}>{d}</div>)}
            {CAMP_GRID.map((week, wi) => {
              const isTaper = wi >= CAMP_GRID.length - 2
              return (
                <React.Fragment key={wi}>
                  <div className="text-[10px] flex items-center gap-1" style={{ color: isTaper ? '#facc15' : '#94a3b8' }}>
                    W{wi + 1}{isTaper && <span className="text-[8px] uppercase tracking-wider px-1 py-0.5 rounded-sm" style={{ background:'rgba(250,204,21,0.16)', color:'#facc15' }}>TAPER</span>}
                  </div>
                  {week.map((d, di) => {
                    const meta = TRAINING_TYPES[d.type]
                    const isSparring = d.type === 'sparring'
                    return (
                      <div key={di} className="aspect-square rounded-md p-1 relative flex flex-col justify-between"
                        title={`W${wi+1} ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][di]} · ${meta.label} · load ${(d.load * 100).toFixed(0)}`}
                        style={{
                          background: meta.color,
                          opacity: 0.15 + d.load * 0.85,
                          border: isSparring ? `1px solid ${meta.color}` : `1px solid transparent`,
                          boxShadow: isSparring && d.load > 0.85 ? `0 0 8px ${bxGlow(d.load)}` : 'none',
                          outline: isTaper ? '1px dashed rgba(250,204,21,0.4)' : 'none',
                          outlineOffset: '-2px',
                        }}>
                        <div className="text-[8px] font-bold" style={{ color:'rgba(255,255,255,0.85)' }}>{['M','T','W','T','F','S','S'][di]}</div>
                        <div className="text-[10px] font-black tabular-nums" style={{ color:'#fff', textShadow:'0 1px 2px rgba(0,0,0,0.6)' }}>{Math.round(d.load * 100)}</div>
                      </div>
                    )
                  })}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Sparring rounds cumulative */}
          <div className="rounded-xl p-4" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color:'#94a3b8' }}>Cumulative sparring rounds · head contact load proxy</h4>
            <svg viewBox="0 0 320 100" className="w-full block">
              <defs>
                <linearGradient id="bx-spar" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%"  stopColor="#ef4444" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>
              {(() => {
                const max = Math.max(...SPARRING_TOTALS)
                const pts = SPARRING_TOTALS.map((v, i) => ({ x: 20 + i * 40, y: 90 - (v / max) * 70 }))
                const area = `M 20 90 ${pts.map(p => `L ${p.x} ${p.y}`).join(' ')} L ${pts[pts.length-1].x} 90 Z`
                const line = `M ${pts[0].x} ${pts[0].y} ${pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}`
                return (
                  <g>
                    <path d={area} fill="url(#bx-spar)" />
                    <path d={line} fill="none" stroke="#ef4444" strokeWidth="2" />
                    {pts.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="3" fill="#ef4444" />
                        <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize="9" fill="#fca5a5" fontWeight="700">{SPARRING_TOTALS[i]}</text>
                        <text x={p.x} y={97} textAnchor="middle" fontSize="9" fill="#475569">W{i + 1}</text>
                      </g>
                    ))}
                  </g>
                )
              })()}
            </svg>
            <p className="text-[11px] mt-1" style={{ color:'#94a3b8' }}>Total sparring rounds across camp: <span className="text-white font-bold">{SPARRING_TOTALS[SPARRING_TOTALS.length - 1]}</span></p>
          </div>

          {/* Weight cut overlay */}
          <div className="rounded-xl p-4" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color:'#94a3b8' }}>Weight cut tracker · kg over target</h4>
            <div className="space-y-2">
              {WEIGHT_OVER.map((kg, i) => {
                const max = WEIGHT_OVER[0]
                const pct = (kg / max) * 100
                const c = kg > 5 ? 0.85 : kg > 2 ? 0.55 : 0.15
                const isTaper = i >= WEIGHT_OVER.length - 2
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] w-10" style={{ color: isTaper ? '#facc15' : '#94a3b8' }}>W{i + 1}{isTaper && ' ★'}</span>
                    <div className="flex-1 h-3 rounded-md overflow-hidden" style={{ background:'#1F2937' }}>
                      <div className="h-full rounded-md" style={{ width:`${pct}%`, background: bxHeat(c), boxShadow: c > 0.7 ? `0 0 6px ${bxGlow(c)}` : 'none' }} />
                    </div>
                    <span className="text-[11px] tabular-nums w-14 text-right" style={{ color:'#fff', fontWeight:600 }}>+{kg.toFixed(1)} kg</span>
                  </div>
                )
              })}
            </div>
            <p className="text-[11px] mt-3" style={{ color:'#94a3b8' }}>Cut trajectory matches plan — sub-2 kg over by W7 means a smooth final week.</p>
          </div>
        </div>
      </div>

      {/* ─── 5. SESSION GPS HEATMAP ──────────────────────────────────── */}
      <div className="rounded-xl p-6" style={{ background: '#0d1117', border: '1px solid #1F2937' }}>
        <SectionTitle k="Section 05" t="Session GPS Heatmap" sub="Distance by intensity zone, roadwork acceleration map and weekly load comparison." />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {SESSION_ZONES.map(s => (
            <div key={s.label} className="rounded-xl p-4" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
              <h4 className="text-xs font-semibold text-white mb-3">{s.label}</h4>
              {s.zones.map(z => {
                const max = Math.max(...s.zones.map(x => x.m))
                const pct = (z.m / max) * 100
                return (
                  <div key={z.z} className="mb-2">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-white">{z.z}</span>
                      <span style={{ color: bxHeat(z.c) }} className="font-bold">{z.m.toLocaleString()} m</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background:'#1F2937' }}>
                      <div className="h-full" style={{ width:`${pct}%`, background: bxHeat(z.c), boxShadow: z.c > 0.8 ? `0 0 6px ${bxGlow(z.c)}` : 'none' }} />
                    </div>
                  </div>
                )
              })}
              <div className="text-[10px] mt-2 pt-2 border-t" style={{ color:'#475569', borderColor:'#1F2937' }}>
                Total <span className="text-white font-bold">{s.zones.reduce((sum, z) => sum + z.m, 0).toLocaleString()} m</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          {/* Roadwork accel map */}
          <div className="rounded-xl p-4" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color:'#94a3b8' }}>Roadwork · sprint &amp; acceleration map</h4>
            <svg viewBox="0 0 100 80" className="w-full block">
              <defs>
                <pattern id="bx-route-grid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" />
                </pattern>
                <filter id="bx-route-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" />
                </filter>
              </defs>
              <rect width="100" height="80" fill="#07090f" />
              <rect width="100" height="80" fill="url(#bx-route-grid)" />
              {/* Route path (loop) */}
              <path d="M 8 70 Q 18 30 35 25 T 70 18 Q 90 25 92 50 T 75 72 Q 50 78 25 75 Z"
                fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" strokeDasharray="1.5 1.5" />
              {/* Heat dots along route */}
              <g filter="url(#bx-route-glow)">
                {ROADWORK_ACCEL.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={2 + p.v * 5} fill={bxHeat(p.v)} fillOpacity={0.45 + p.v * 0.4} />
                ))}
              </g>
              {ROADWORK_ACCEL.map((p, i) => (
                <g key={`a-${i}`}>
                  <circle cx={p.x} cy={p.y} r="0.8" fill="#fff" />
                  {p.v > 0.85 && <text x={p.x} y={p.y - 3} textAnchor="middle" fontSize="2.5" fill="#fca5a5" fontWeight="700">SPRINT</text>}
                </g>
              ))}
            </svg>
            <p className="text-[11px] mt-2" style={{ color:'#94a3b8' }}>8.4 km loop · 12 sprint efforts · max 6.8 m/s</p>
          </div>
          {/* Weekly load comparison */}
          <div className="rounded-xl p-4" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color:'#94a3b8' }}>Weekly load · AU</h4>
            {WEEKLY_LOAD.map(w => {
              const max = Math.max(...WEEKLY_LOAD.map(x => x.val))
              const pct = (w.val / max) * 100
              return (
                <div key={w.lbl} className="mb-3">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-white">{w.lbl}</span>
                    <span style={{ color: bxHeat(w.c) }} className="font-bold tabular-nums">{w.val.toLocaleString()}</span>
                  </div>
                  <div className="h-2.5 rounded-md overflow-hidden" style={{ background:'#1F2937' }}>
                    <div className="h-full rounded-md" style={{ width:`${pct}%`, background: bxHeat(w.c), boxShadow: w.c > 0.7 ? `0 0 8px ${bxGlow(w.c)}` : 'none' }} />
                  </div>
                </div>
              )
            })}
            <div className="text-[11px] mt-2 pt-3 border-t" style={{ color:'#94a3b8', borderColor:'#1F2937' }}>
              ACWR: <span className="font-bold" style={{ color:'#22c55e' }}>1.18</span> · optimal load zone
            </div>
          </div>
        </div>
      </div>

      {/* ─── 6. OPPONENT COMPARISON ──────────────────────────────────── */}
      <div className="rounded-xl p-6" style={{ background: '#0d1117', border: '1px solid #1F2937' }}>
        <SectionTitle k="Section 06" t="Opponent Comparison · Fight Prep"
          sub={`${fighter.name} ring profile vs scouted ${fighter.next_fight.opponent} (${fighter.next_fight.opponent_record}).`} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {[
            { who:fighter.name,                  zones: RING_ZONES, label:'Your average', accent:'#ef4444' },
            { who:fighter.next_fight.opponent,   zones: OPP_ZONES,  label:'Opponent style', accent:'#1d4ed8' },
          ].map(side => (
            <div key={side.who} className="rounded-xl p-4" style={{ background:'#07090f', border:`1px solid ${side.accent}33` }}>
              <div className="flex items-baseline gap-2 mb-2">
                <h4 className="text-sm font-bold text-white">{side.who}</h4>
                <span className="text-[10px]" style={{ color:'#475569' }}>{side.label}</span>
              </div>
              <svg viewBox="0 0 320 320" className="w-full block">
                <defs>
                  <radialGradient id={`bx-cmp-bg-${side.accent}`} cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="#1f1a14" />
                    <stop offset="100%" stopColor="#0a0805" />
                  </radialGradient>
                  <filter id={`bx-cmp-blur-${side.accent}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="10" />
                  </filter>
                  {side.zones.map((row, ri) => row.map((v, ci) => (
                    <radialGradient key={`g-${side.accent}-${ri}-${ci}`} id={`bx-cmp-${side.accent}-${ri}-${ci}`} cx="50%" cy="50%" r="60%">
                      <stop offset="0%"  stopColor={bxHeat(v)} stopOpacity={0.7 + v * 0.3} />
                      <stop offset="55%" stopColor={bxHeat(v)} stopOpacity={0.18 + v * 0.3} />
                      <stop offset="100%" stopColor={bxHeat(v)} stopOpacity={0} />
                    </radialGradient>
                  )))}
                </defs>
                <rect x="20" y="20" width="280" height="280" rx="6" fill={`url(#bx-cmp-bg-${side.accent})`} />
                <rect x="20" y="20" width="280" height="280" rx="6" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
                {[20,140,300].map((y, i) => (
                  <line key={`h-${i}`} x1="20" y1={y} x2="300" y2={y} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                ))}
                {[20,140,300].map((x, i) => (
                  <line key={`v-${i}`} x1={x} y1="20" x2={x} y2="300" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                ))}
                {[[8,8],[298,8],[8,298],[298,298]].map(([x,y], i) => (
                  <rect key={i} x={x} y={y} width="14" height="14" rx="2" fill={side.accent} opacity="0.7" />
                ))}
                <g filter={`url(#bx-cmp-blur-${side.accent})`}>
                  {side.zones.map((row, ri) => row.map((v, ci) => (
                    v > 0.05 && <circle key={`b-${ri}-${ci}`} cx={60 + ci * 110} cy={60 + ri * 110} r={42 + v * 28} fill={`url(#bx-cmp-${side.accent}-${ri}-${ci})`} />
                  )))}
                </g>
                {side.zones.map((row, ri) => row.map((v, ci) => (
                  <text key={`t-${ri}-${ci}`} x={60 + ci * 110} y={60 + ri * 110 + 3}
                    textAnchor="middle" fontSize="10" fontWeight="700"
                    fill={v > 0.5 ? '#fff' : 'rgba(255,255,255,0.4)'}>
                    {Math.round(v * 100)}%
                  </text>
                )))}
              </svg>
            </div>
          ))}
        </div>

        {/* Zone dominance comparison */}
        <div className="rounded-xl p-4" style={{ background:'#0a0d13', border:'1px solid #1F2937' }}>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color:'#94a3b8' }}>Zone dominance · {fighter.name.split(' ')[0]} vs {fighter.next_fight.opponent.split(' ')[0]}</h4>
          {COMPARISON.map(c => {
            const total = c.self + c.opp
            const selfPct = total > 0 ? (c.self / total) * 100 : 50
            const oppPct  = 100 - selfPct
            const winner = c.self > c.opp ? 'self' : 'opp'
            return (
              <div key={c.zone} className="mb-3">
                <div className="flex justify-between text-[11px] mb-1">
                  <span style={{ color: winner === 'self' ? '#ef4444' : '#94a3b8' }} className="font-bold">{c.self}%</span>
                  <span className="text-white font-medium">{c.zone}</span>
                  <span style={{ color: winner === 'opp'  ? '#1d4ed8' : '#94a3b8' }} className="font-bold">{c.opp}%</span>
                </div>
                <div className="flex h-2 rounded-md overflow-hidden" style={{ background:'#1F2937' }}>
                  <div style={{ width:`${selfPct}%`, background:'#ef4444' }} />
                  <div style={{ width:`${oppPct}%`,  background:'#1d4ed8' }} />
                </div>
              </div>
            )
          })}
          <div className="text-[11px] mt-3 pt-3 border-t" style={{ color:'#94a3b8', borderColor:'#1F2937' }}>
            <span className="font-bold" style={{ color:'#fff' }}>Tactical read:</span> Stoyan&apos;s pressure-on-front-ropes profile means R3, R6 and R11 are the rope-time risk windows. Drill ring escapes off the front ropes and reset to centre by mid-round.
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MOBILE APP VIEW ─────────────────────────────────────────────────────────
function BoxingMobileAppView({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const features = [
    { section: 'OVERVIEW', items: ['Morning briefing voice playback', 'Fight camp day status', 'Weight check-in'] },
    { section: 'FIGHT CAMP', items: ['Sparring log entry', 'GPS vest sync status', 'Recovery + HRV check-in', 'Cut-week daily weigh-in'] },
    { section: 'PERFORMANCE', items: ['WBC / WBA / WBO / IBF ranking position', 'Mandatory tracker', 'Punch analytics summary', 'Opposition film cue'] },
    { section: 'COMMERCIAL', items: ['Sponsor activation due today', 'Purse bid alerts', 'Contract addendum signatures', 'Media obligation reminder'] },
    { section: 'TEAM', items: ['Trainer notes', 'Manager + promoter messages', 'Doctor clearance log', 'Cutman pre-fight checklist'] },
  ];
  const mobileFirst = [
    { why: 'Daily weigh-in logged on the bathroom scales at 6am', solution: 'One-tap weight + body comp entry — cut trajectory updates instantly across team views.' },
    { why: 'Cutman needs corner sheet on his phone in the changing room before walk-on', solution: 'Offline-cached corner sheet with timeline, round-by-round notes, cut-protocol — works without venue WiFi.' },
    { why: 'Sparring partner cancellation 3 hours before session', solution: 'Re-book flow on phone — tap to ping the next two fallback partners, trainer notified automatically.' },
    { why: 'Manager negotiating purse bid in 3-way call from airport', solution: 'Live deal terms + counter-offer log on phone — every revision audited in real time.' },
    { why: 'Doctor logs sparring head impact event for medical record', solution: 'One-tap incident log + auto BBBofC compliance entry — clean paper trail without leaving the gym floor.' },
    { why: 'Walk-on cue 60 seconds out — check ringwalk music + corner ready', solution: 'Fight-night ops checklist on lock screen — music cued, corner team confirmed, doctor clearance green.' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="📲" title="Mobile App" subtitle="A hard launch requirement, not a roadmap item. Fight camp runs on the gym floor, not at a desk." />
      {/* Critical context */}
      <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-5">
        <div className="text-sm font-semibold text-red-400 mb-2">🚨 Non-Negotiable Launch Requirement</div>
        <div className="text-sm text-gray-300 leading-relaxed">The 6am weigh-in is logged on the bathroom scales. The corner sheet is on the cutman\u2019s phone in the changing room before the walk-on. The doctor logs a sparring head-impact event from the gym floor. Manager works the purse bid from a 3-way airport call. None of this happens on a desktop. Lumio Fight must be fully functional on iOS and Android from day one — full feature parity, offline support, push notifications.</div>
      </div>
      {/* Feature parity matrix */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Mobile Feature Scope — Day One</div>
        <div className="space-y-4">
          {features.map((sec, i) => (
            <div key={i}>
              <div className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">{sec.section}</div>
              <div className="space-y-1">
                {sec.items.map((item, j) => (
                  <div key={j} className="flex items-center gap-2 text-sm text-gray-300">
                    <div className="w-4 h-4 rounded flex items-center justify-center bg-red-600/20 flex-shrink-0">
                      <span className="text-red-400 text-xs">✓</span>
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Why mobile-first */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">The Mobile Use Cases — Why Each One Matters</div>
        <div className="space-y-3">
          {mobileFirst.map((m, i) => (
            <div key={i} className="p-3 bg-black/20 rounded-lg border border-gray-800">
              <div className="text-xs text-yellow-400 font-medium mb-1">👤 {m.why}</div>
              <div className="text-xs text-orange-400">→ {m.solution}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Tech approach */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Recommended Technical Approach</div>
        <div className="space-y-2">
          {[
            { opt: 'Progressive Web App (Phase 1)', pros: 'Zero new codebase. Installable from browser. Service workers enable offline caching of corner sheet + opposition film cue. Fastest path to validating boxing traction.', cons: 'iOS PWA push notifications limited pre-16.4. No App Store listing. No native sensor APIs (Bluetooth pairing for GPS vest / Lumio Wear / smart scales).' },
            { opt: 'Capacitor.js Wrap (Phase 2)', pros: 'Wraps the existing Next.js PWA in a native iOS + Android shell. Full App Store / Play Store distribution. Native push, Bluetooth, background sync. Single codebase still.', cons: 'Some performance trade-off vs fully native. Native plugin work needed for advanced sensor flows.' },
            { opt: 'React Native or Native (Phase 3)', pros: 'Best performance + deepest hardware integration. Justified once a sport hits sustained pro adoption.', cons: 'Separate codebase from web portal. Significantly more dev/maintenance cost.' },
          ].map((o, i) => (
            <div key={i} className="p-3 bg-black/20 rounded-lg">
              <div className="text-sm font-medium text-white mb-1">{o.opt}</div>
              <div className="text-xs text-orange-400 mb-0.5">✓ {o.pros}</div>
              <div className="text-xs text-red-400">✗ {o.cons}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-500">Recommendation: PWA for Phase 1 demo + early access. Capacitor wrap for Phase 2 when App Store presence and sensor integration matter. Reserve full native for the sport with the strongest pro adoption signal.</div>
      </div>
      {/* Download placeholder */}
      <div className="bg-[#0d0f1a] border border-red-600/30 rounded-xl p-6 flex flex-col items-center text-center">
        <div className="text-4xl mb-3">📲</div>
        <div className="text-white font-semibold mb-1">Lumio Fight — Mobile App</div>
        <div className="text-sm text-gray-400 mb-4">Coming in Phase 1B · iOS + Android</div>
        <div className="flex gap-3">
          <div className="bg-black border border-gray-700 rounded-xl px-5 py-2.5 flex items-center gap-2">
            <span className="text-xl"></span>
            <div className="text-left"><div className="text-xs text-gray-500">Download on the</div><div className="text-sm font-semibold text-white">App Store</div></div>
          </div>
          <div className="bg-black border border-gray-700 rounded-xl px-5 py-2.5 flex items-center gap-2">
            <span className="text-xl">▶</span>
            <div className="text-left"><div className="text-xs text-gray-500">Get it on</div><div className="text-sm font-semibold text-white">Google Play</div></div>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-600">Register your interest at lumiofight.com — early access for pilot fighters from Month 5</div>
      </div>
      <BoxingAISection context="default" fighter={fighter} session={session} />
    </div>
  );
}

// ─── INTEGRATIONS HUB ────────────────────────────────────────────────────────
function BoxingIntegrationsHub({ fighter, session }: { fighter: BoxingFighter; session: SportsDemoSession }) {
  const entries: HubEntry[] = [
    { id: 'boxrec',      icon: '📊', label: 'BoxRec Database',      category: 'Data Feeds',       kind: 'generic', config: BOXING_INTEGRATIONS.boxrec },
    { id: 'lumiopunchanalytics', icon: '🥊', label: 'Lumio Punch Analytics', category: 'Hardware Sensors', kind: 'generic', config: BOXING_INTEGRATIONS.lumiopunchanalytics },
    { id: 'striketec',   icon: '📡', label: 'Punch Sensors',        category: 'Hardware Sensors', kind: 'generic', config: BOXING_INTEGRATIONS.striketec },
    { id: 'whoop',       icon: '💚', label: 'Lumio Wear / Oura',         category: 'Wearables',        kind: 'generic', config: BOXING_INTEGRATIONS.whoop },
    { id: 'gps-vest',    icon: '🛰️', label: 'Lumio GPS Vest',       category: 'Wearables',        kind: 'generic', config: BOXING_INTEGRATIONS['gps-vest'] },
    { id: 'sanctioning', icon: '🏆', label: 'WBC / WBA / WBO / IBF', category: 'Compliance',       kind: 'generic', config: BOXING_INTEGRATIONS.sanctioning },
    { id: 'bbbofc',      icon: '📋', label: 'BBBofC Licensing',     category: 'Compliance',       kind: 'generic', config: BOXING_INTEGRATIONS.bbbofc },
    { id: 'vada',        icon: '💊', label: 'VADA / UKAD',          category: 'Compliance',       kind: 'generic', config: BOXING_INTEGRATIONS.vada },
    { id: 'workspace',   icon: '📧', label: 'Gmail + Calendar',     category: 'Team Tools',       kind: 'generic', config: BOXING_INTEGRATIONS.workspace },
    { id: 'slack',       icon: '💬', label: 'Slack',                category: 'Team Tools',       kind: 'generic', config: BOXING_INTEGRATIONS.slack },
    { id: 'broadcast',   icon: '📺', label: 'Meridian Sports',      category: 'Distribution',     kind: 'generic', config: BOXING_INTEGRATIONS.broadcast },
    { id: 'mobileapp',   icon: '📲', label: 'Mobile App',           category: 'Distribution',     kind: 'custom',  render: () => <BoxingMobileAppView fighter={fighter} session={session} /> },
  ]
  return <IntegrationsHub entries={entries} accent="var(--brand-primary, #1e3a8a)" />
}

export function BoxingPortalInner({ session, onSignOut }: { session: SportsDemoSession; onSignOut?: () => void }) {
  // URL decides demo-vs-founder. Session-driven gating fails for anonymous
  // visitors (undefined === false is false, so founder URLs fell through to
  // demo content in incognito). See src/lib/config/demo-slugs.ts.
  const params = useParams<{ slug: string }>()
  const slug = typeof params?.slug === 'string' ? params.slug : ''
  const showDemoData = isDemoSlug(slug, 'boxing')
  session = { ...session, isDemoShell: showDemoData }
  const [activeSection, setActiveSection] = useState('camp');
  const isMobile = useIsMobile();
  const [toast, setToast] = useState<{message: string; sponsor: string} | null>(null);
  const [toastDismissed, setToastDismissed] = useState(false);
  const isFoundingMember = session.isDemoShell === false
  // Mirror Settings brand colours onto CSS vars — see tennis/[slug]/page.tsx
  useLiveBrandColours('boxing', { primary: '#1e3a8a', secondary: '#ffffff' })
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(() => {
    try {
      if (typeof window === 'undefined') return null
      if (isFoundingMember) return session.photoDataUrl || null
      return localStorage.getItem('lumio_boxing_profile_photo')
    } catch { return null }
  })
  // Profile sync — keeps the bottom RoleSwitcher avatar/name in step with Settings edits.
  // Founders bypass these survivor-key reads to prevent leakage from a prior demo
  // visit on the same browser.
  const _liveProfileNameOuterRaw = useBoxingProfileName()
  const _liveProfilePhotoOuterRaw = useBoxingProfilePhoto()
  const _liveBrandNameRaw = useBoxingBrandName()
  const _liveBrandLogoRaw = useBoxingBrandLogo()
  const liveProfileNameOuter = isFoundingMember ? null : _liveProfileNameOuterRaw
  const liveProfilePhotoOuter = isFoundingMember ? null : _liveProfilePhotoOuterRaw
  const liveBrandName = isFoundingMember ? '' : _liveBrandNameRaw
  const liveBrandLogo = isFoundingMember ? '' : _liveBrandLogoRaw
  // Note: liveSession is rebuilt below with `role: roleOverride` once
  // roleOverride is in scope, so RoleSwitcher's "Current view" highlight
  // tracks the live override (not the original session.role at mount).

  // Founding members (live mode) get their wizard-entered name + nickname on
  // the fighter card. Demo mode is unchanged — Marcus Cole / "The Machine" is
  // the intentional persona. Nickname falls all the way through to '' if the
  // founder left it blank in the wizard — never to "The Machine".
  const liveBoxingNickname = !isFoundingMember && typeof window !== 'undefined' ? localStorage.getItem('lumio_boxing_nickname') : null
  const fighter: BoxingFighter = isFoundingMember
    ? {
        ...DEMO_FIGHTER,
        name: session.userName || DEMO_FIGHTER.name,
        nickname: session.nickname || '',
      }
    : DEMO_FIGHTER;
  useEffect(() => {
    if (typeof window === 'undefined' || isFoundingMember) return
    const sync = () => setCurrentPhoto(localStorage.getItem('lumio_boxing_profile_photo'))
    window.addEventListener('lumio-profile-updated', sync)
    return () => window.removeEventListener('lumio-profile-updated', sync)
  }, [isFoundingMember])

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

  const liveSession = { ...session, role: roleOverride, userName: liveProfileNameOuter || session.userName, photoDataUrl: liveProfilePhotoOuter || session.photoDataUrl }

  // Render guard against role-leakage: snap activeSection back to the role's
  // first allowed tab if it's no longer in scope (e.g. user switched roles
  // while on a tab the new role can't see).
  const allowedSections: string[] = roleConfig.sidebar === 'all'
    ? SIDEBAR_ITEMS.map(i => i.id)
    : roleConfig.sidebar
  useEffect(() => {
    if (allowedSections.length > 0 && !allowedSections.includes(activeSection)) {
      setActiveSection(allowedSections[0])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleOverride])

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 9 && !toastDismissed) {
      const obligations = [
        { condition: true, message: 'Meridian Sports promo shoot — confirm logistics with Sarah Whitlock today', sponsor: 'Meridian Sports' },
        { condition: true, message: 'Apex Performance post due — kit photo needed this week', sponsor: 'Apex Performance' },
      ];
      const due = obligations.find(o => o.condition);
      if (due) setToast(due);
    }
  }, [toastDismissed]);

  const groups = ['OVERVIEW', 'FIGHT CAMP', 'WEIGHT & HEALTH', 'RANKINGS', 'FINANCIALS', 'TEAM HUB', 'COMMERCIAL', 'CAREER', 'INTEL', 'SETTINGS'];

  const renderView = () => {
    // Founder (non-demo slug) sees EmptyState instead of demo content. Camp
    // dashboard keeps its own internal branching; Settings stays accessible
    // for founders.
    const isFounder = session.isDemoShell === false
    const gate = (icon: string, title: string, sub: string, el: React.ReactNode) =>
      isFounder ? <EmptyState icon={icon} title={title} sub={sub} /> : el
    switch (activeSection) {
      case 'camp':             return <CampDashboardView fighter={fighter} session={session} onOpenModal={setActiveModal} />;
      case 'training':        return gate('🏋️', 'No training sessions logged', 'Connect your data to unlock this', <TrainingLogView fighter={fighter} session={session} />);
      case 'sparring':        return gate('🥊', 'No sparring planned', 'Add your sparring calendar to unlock this', <SparringPlannerView fighter={fighter} session={session} />);
      case 'opposition':      return gate('🔍', 'No opposition data', 'Connect your data to unlock this', <OppositionAnalysisView fighter={fighter} session={session} />);
      case 'fight-night':     return gate('🥊', 'No fight scheduled', 'Connect your camp calendar to unlock this', <FightNightOpsView fighter={fighter} session={session} />);
      case 'punchanalytics':  return gate('👊', 'No punch data', 'Connect your sensor data to unlock this', <PunchAnalyticsView fighter={fighter} session={session} />);
      case 'fightcamp':       return gate('🏕️', 'No camp planned', 'Add your fight camp to unlock this', <FightCampView fighter={fighter} session={session} />);
      case 'weight':          return gate('⚖️', 'No weight logged yet', 'Log your daily weight to unlock this', <WeightTrackerView fighter={fighter} session={session} />);
      case 'cut':             return gate('⚖️', 'No cut plan yet', 'Connect your fight date to unlock this', <CutPlannerView fighter={fighter} session={session} />);
      case 'recovery':        return gate('💤', 'No recovery data', 'Connect your HRV device to unlock this', <RecoveryHRVView fighter={fighter} session={session} />);
      case 'medical':         return gate('🏥', 'No medical records', 'Add your licence and medicals to unlock this', <MedicalRecordView fighter={fighter} session={session} />);
      case 'physio-recovery': return gate('🏥', 'No physio data', 'Connect your data to unlock this', <BoxingPhysioRecoveryView fighter={fighter} session={session} onNavigate={setActiveSection} />);
      case 'rankings':        return gate('🏆', 'No ranking data', 'Connect your sanctioning body feeds to unlock this', <WorldRankingsView fighter={fighter} session={session} />);
      case 'mandatory':       return gate('📋', 'No mandatory data', 'Connect your data to unlock this', <MandatoryTrackerView fighter={fighter} session={session} />);
      case 'pathtotitle':     return gate('🥇', 'No title pathway yet', 'Connect your ranking data to unlock this', <PathToTitleView fighter={fighter} session={session} />);
      case 'pursebid':        return gate('💰', 'No purse-bid alerts', 'Connect your data to unlock this', <PurseBidAlertsView fighter={fighter} session={session} />);
      case 'career':          return gate('🚀', 'No career plan yet', 'Add your career goals to unlock this', <BoxingCareerPlanningView fighter={fighter} session={session} />);
      case 'pursesim':        return gate('💰', 'No purse data', 'Add your next fight to unlock this', <PurseSimulatorView fighter={fighter} session={session} />);
      case 'earnings':        return gate('💵', 'No earnings logged', 'Connect your data to unlock this', <FightEarningsView fighter={fighter} session={session} />);
      case 'campcosts':       return gate('💰', 'No camp costs logged', 'Connect your data to unlock this', <CampCostsView fighter={fighter} session={session} />);
      case 'tax':             return gate('🧾', 'No tax data', 'Connect your data to unlock this', <TaxTrackerView fighter={fighter} session={session} />);
      case 'teamoverview':    return gate('👥', 'No team added yet', 'Add your trainer, manager, promoter and camp to unlock this', <TeamOverviewView fighter={fighter} session={session} />);
      case 'briefing':        return gate('🌅', 'No briefing data yet', 'Connect your data to unlock this', <FighterBriefingView fighter={fighter} session={session} />);
      case 'trainernotes':    return gate('📝', 'No trainer notes', 'Add your trainer to unlock this', <TrainerNotesView fighter={fighter} session={session} />);
      case 'managerdash':     return gate('💼', 'No manager data', 'Add your manager to unlock this', <ManagerDashboardView fighter={fighter} session={session} />);
      case 'sponsorships':    return gate('💼', 'No sponsors added', 'Add your sponsors to unlock this', <SponsorshipsView fighter={fighter} session={session} />);
      case 'media':           return session.isDemoShell !== false
        ? <MediaContentModule
            sport="boxing"
            accentColor="#ef4444"
            existingContentIn="sponsors"
            existingContentLabel="Boxing — Fight-Camp Media Obligations"
            existingContent={<MediaObligationsView fighter={fighter} session={session} />}
            isDemoShell={true}
          />
        : <MediaObligationsView fighter={fighter} session={session} />;
      case 'appearances':     return gate('🎤', 'No appearance data', 'Connect your data to unlock this', <AppearanceFeesView fighter={fighter} session={session} />);
      case 'contracts':       return gate('📋', 'No contracts tracked', 'Add your contracts to unlock this', <ContractTrackerView fighter={fighter} session={session} />);
      case 'fightrecord':     return gate('🥊', 'No fight record', 'Add your fight history to unlock this', <FightRecordView fighter={fighter} session={session} />);
      case 'careerstats':     return gate('📈', 'No career stats', 'Add your fight history to unlock this', <CareerStatsView fighter={fighter} session={session} />);
      case 'promoterpipeline':return gate('🤝', 'No promoter pipeline', 'Connect your data to unlock this', <PromoterPipelineView fighter={fighter} session={session} />);
      case 'agentintel':      return gate('💼', 'No agent intel', 'Add your agent to unlock this', <AgentIntelView fighter={fighter} session={session} />);
      case 'aibriefing':      return gate('✨', 'No AI briefing yet', 'Connect your data to unlock your morning briefing', <AIMorningBriefingView fighter={fighter} session={session} />);
      case 'opscout':         return gate('🔍', 'No opposition scout', 'Connect your data to unlock this', <OppositionScoutView fighter={fighter} session={session} />);
      case 'broadcasttracker': return gate('📺', 'No broadcast data', 'Connect your data to unlock this', <BroadcastTrackerView fighter={fighter} session={session} />);
      case 'news':            return gate('📰', 'No news feed', 'Connect your data to unlock this', <IndustryNewsView fighter={fighter} session={session} />);
      case 'gps':             return gate('🛰️', 'No GPS data', 'Connect your Lumio GPS to unlock this', <BoxingGpsView fighter={fighter} session={session} />);
      case 'gps-heatmaps':    return gate('🔥', 'No heatmap data', 'Connect your Lumio GPS to unlock this', <BoxingGpsHeatmapsView fighter={fighter} session={session} />);
      case 'findpro':         return gate('🎯', 'No directory data', 'Connect your location to unlock this', <FindProView fighter={fighter} session={session} />);
      case 'travel':          return gate('✈️', 'No travel booked', 'Connect your data to unlock this', <BoxingTravelView fighter={fighter} session={session} />);
      case 'integrations':    return <BoxingIntegrationsHub fighter={fighter} session={session} />;
      case 'settings':        return (
        <SportsSettings
          sport="boxing"
          slug={fighter.slug}
          sportLabel="Boxing"
          entity="player"
          accentColour="#dc2626"
          accentLight="#ef4444"
          session={{
            userName: session?.userName,
            photoDataUrl: session?.photoDataUrl,
            email: session?.email,
            nickname: session?.nickname,
            clubName: session?.clubName,
            logoDataUrl: session?.logoDataUrl,
            isDemoShell: session?.isDemoShell,
          }}
          storagePrefix="lumio_boxing_"
          brandNameValue={liveBrandName}
          brandLogoUrl={liveBrandLogo}
          profile={{
            name: 'Full Name',
            tour: 'Tour',
            tourValue: isFoundingMember ? undefined : 'Professional Boxing',
            ranking: 'Ranking',
            rankingValue: isFoundingMember ? undefined : `WBC #${fighter.rankings.wbc} / WBA #${fighter.rankings.wba} / WBO #${fighter.rankings.wbo} / IBF #${fighter.rankings.ibf}`,
            coach: 'Trainer',
            coachValue: isFoundingMember ? undefined : fighter.trainer,
            agent: 'Manager',
            agentValue: isFoundingMember ? undefined : fighter.manager,
            playerIdLabel: 'BoxRec Fighter ID',
            staffInviteRoles: ['Trainer','Cutman','Strength Coach','Nutritionist','Physio','Manager'],
          }}
          configFields={[
            { id: 'boxrecId', label: 'BoxRec Fighter ID', description: 'For live ranking and fight history', kind: 'text', placeholder: 'e.g. BR-000001' },
            { id: 'weightClass', label: 'Weight Class', kind: 'select', options: ['Heavyweight','Cruiserweight','Light Heavyweight','Super Middleweight','Middleweight','Super Welterweight','Welterweight','Super Lightweight','Lightweight','Super Featherweight','Featherweight','Super Bantamweight','Bantamweight','Super Flyweight','Flyweight','Minimumweight'], defaultValue: isFoundingMember ? '' : fighter.weight_class },
            { id: 'sanctioning', label: 'Sanctioning Body Preference', kind: 'checkboxGroup', options: ['WBC','WBA','WBO','IBF'], defaultValue: isFoundingMember ? [] : ['WBC','WBA','WBO','IBF'] },
          ]}
          integrationGroups={[
            {
              title: 'DATA PROVIDERS',
              items: [
                { name: 'BoxRec', desc: 'Fight history & records', connected: !isFoundingMember },
                { name: 'WBC Rankings', desc: 'World Boxing Council ratings', connected: !isFoundingMember },
                { name: 'WBA Rankings', desc: 'World Boxing Association ratings', connected: !isFoundingMember },
                { name: 'WBO Rankings', desc: 'World Boxing Organization ratings' },
                { name: 'IBF Rankings', desc: 'International Boxing Federation ratings' },
                { name: 'Lumio GPS', desc: 'Movement & load tracking' },
                { name: 'Lumio Vision', desc: 'Sparring video capture & analysis' },
                { name: 'Lumio Punch Analytics', desc: 'Live punch stats', connected: !isFoundingMember },
              ],
            },
            {
              title: 'COMMUNICATION',
              items: [
                { name: 'Slack', desc: 'Team messaging & alerts', connected: !isFoundingMember },
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
            members: isFoundingMember
              ? []
              : [
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
            { key: 'media', label: 'Media & Content', emoji: '📱' },
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

  // Mobile shell — short-circuit the desktop chrome so the mobile home
  // renders edge-to-edge with the bottom nav. Mirrors tennis/[slug]/page.tsx.
  // Boxing's "dashboard" lives at activeSection === 'camp'; navMap maps
  // bottom-nav home → camp so the highlight tracks correctly.
  if (isMobile) {
    return (
      <MobileSportLayout
        sport="boxing"
        activeSection={activeSection}
        onNavigate={setActiveSection}
        sidebarItems={SIDEBAR_ITEMS}
        groupOrder={['OVERVIEW', 'FIGHT CAMP', 'WEIGHT & HEALTH', 'RANKINGS', 'FINANCIALS', 'COMMERCIAL', 'TOOLS', 'SETTINGS']}
        // Boxing's dashboard slug is 'camp'. Match nav routes to Fight Night
        // Ops; Team nav routes to Team Overview. Without these overrides,
        // tapping Match or Team fell through to the desktop Getting Started
        // tour because the default 'matchprep' / 'team' IDs don't exist in
        // the boxing renderView switch.
        navMap={{ home: 'camp', match: 'fight-night', team: 'teamoverview' }}
        hiddenNavIds={new Set(['camp', 'fight-night', 'training', 'teamoverview'])}
      >
        <PwaInstaller sport="boxing" />
        {activeSection === 'camp'
          ? <MobileSportHome session={session} config={boxingMobileConfig} onNavigate={setActiveSection} />
          : activeSection === 'training'
            ? <MobileSportTraining session={session} config={boxingMobileConfig} onNavigate={setActiveSection} />
            : <div className="px-4 py-4">{renderView()}</div>
        }
      </MobileSportLayout>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#07080F', color: '#F9FAFB', zoom: 0.9 }}>
      <PwaInstaller sport="boxing" />
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
      {/* V2 Sidebar — Lucide icons + section headers + boxing red accent.
          Role + customise filter (kept from v1) is applied to BOXING_NAV_GROUPS
          here so the v2 visuals don't change which destinations are shown. */}
      {(() => {
        const allowed = roleConfig.sidebar === 'all' ? null : (roleConfig.sidebar as string[])
        const filteredGroups = BOXING_NAV_GROUPS
          .map(g => ({ g: g.g, items: g.items.filter(it => (!allowed || allowed.includes(it.id)) && !isHidden(it.id)) }))
          .filter(g => g.items.length > 0)
        const v2T_outer      = THEMES.dark
        const v2Accent_outer = BOXING_ACCENT
        return (
          <BoxingSidebar
            T={v2T_outer}
            accent={v2Accent_outer}
            active={activeSection}
            onNav={(id) => { setActiveSection(id); if (!sidebarPinned) setSidebarHovered(false) }}
            expanded={sidebarExpanded}
            pinned={sidebarPinned}
            onMouseEnter={handleSidebarEnter}
            onMouseLeave={handleSidebarLeave}
            onTogglePin={togglePin}
            groups={filteredGroups}
            logoUrl={liveBrandLogo || session.logoDataUrl || (!isFoundingMember ? '/cole_boxing_camp_crest.svg' : null)}
            brandLabel={liveBrandName || (!isFoundingMember ? 'Cole Boxing Camp' : 'Lumio Fight')}
            footer={
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <RoleSwitcher
                  session={liveSession}
                  roles={BOXING_ROLES}
                  accentColor={v2Accent_outer.hex}
                  onRoleChange={(role) => {
                    setRoleOverride(role)
                    const newConfig = BOXING_ROLE_CONFIG[role as keyof typeof BOXING_ROLE_CONFIG]
                    if (newConfig) {
                      const firstAllowed = newConfig.sidebar === 'all'
                        ? SIDEBAR_ITEMS[0]?.id
                        : newConfig.sidebar[0]
                      if (firstAllowed) setActiveSection(firstAllowed)
                    }
                    const key = 'lumio_boxing_demo_session'
                    const stored = localStorage.getItem(key)
                    if (stored) {
                      const parsed = JSON.parse(stored)
                      localStorage.setItem(key, JSON.stringify({ ...parsed, role }))
                    }
                  }}
                  sidebarCollapsed={!sidebarExpanded}
                />
                <button onClick={() => {
                  if (onSignOut) { onSignOut(); return }
                  clearDemoSession('boxing')
                  window.location.href = '/boxing/demo'
                }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-xs transition-all hover:bg-red-600/10"
                  style={{ borderTop: `1px solid ${v2T_outer.border}`, color: v2T_outer.text3, justifyContent: sidebarExpanded ? 'flex-start' : 'center' }}
                  title="Sign out">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  {sidebarExpanded && <span>Sign out</span>}
                </button>
                {sidebarExpanded && (
                  <div style={{ padding: 12, borderTop: `1px solid ${v2T_outer.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/boxing_logo.png" alt="Lumio Boxing" style={{ maxHeight: 32, objectFit: 'contain' }} />
                  </div>
                )}
              </div>
            }
          />
        )
      })()}

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
            {session.isDemoShell !== false && (<>
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
                <div className="text-xs text-yellow-400">Meridian Sports shoot: 8 days</div>
                <div className="text-xs text-yellow-400">UA renewal: May 2026</div>
                <div className="text-xs text-red-400">Shoulder: monitoring</div>
                <div className="text-xs text-teal-400">Weight: on track</div>
              </div>
            </div>
            </>)}
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
            {activeModal === 'socialmedia' && <BoxingSocialMediaAI onClose={closeModal} fighter={fighter} isDemoShell={session?.isDemoShell !== false} />}
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
