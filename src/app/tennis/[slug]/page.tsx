'use client';
// TODO: Scope localStorage keys by user ID when auth is implemented// e.g. `sport_schedule_checked` → `sport_${userId}_schedule_checked`

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronUp, Volume2 } from 'lucide-react';
import { SportsDemoGate, RoleSwitcher } from '@/components/sports-demo'
import type { SportsDemoSession } from '@/components/sports-demo'
import { generateSmartBriefing, buildRoundupSummary, buildScheduleItems, getUserTimezone } from '@/lib/sports/smartBriefing'
import SportsSettings from '@/components/sports/SportsSettings'
import { getDailyQuote, TENNIS_QUOTES } from '@/lib/sports-quotes'
import { getDemoAISummary } from '@/lib/demo-content/ai-summaries'
import MediaContentModule from '@/components/sports/media-content/MediaContentModule'

// ─── PROFILE SYNC HOOKS — re-read on 'lumio-profile-updated' events ──────────
function useTennisProfileName(): string | null {
  const [name, setName] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('lumio_tennis_name')
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setName(localStorage.getItem('lumio_tennis_name'))
    window.addEventListener('lumio-profile-updated', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('lumio-profile-updated', sync); window.removeEventListener('storage', sync) }
  }, [])
  return name
}
function useTennisProfilePhoto(): string | null {
  const [photo, setPhoto] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('lumio_tennis_profile_photo')
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setPhoto(localStorage.getItem('lumio_tennis_profile_photo'))
    window.addEventListener('lumio-profile-updated', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('lumio-profile-updated', sync); window.removeEventListener('storage', sync) }
  }, [])
  return photo
}
function useTennisBrandName(): string {
  const [name, setName] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('lumio_tennis_brand_name') || ''
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setName(localStorage.getItem('lumio_tennis_brand_name') || '')
    window.addEventListener('lumio-profile-updated', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('lumio-profile-updated', sync); window.removeEventListener('storage', sync) }
  }, [])
  return name
}
function useTennisBrandLogo(): string {
  const [logo, setLogo] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('lumio_tennis_brand_logo') || ''
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setLogo(localStorage.getItem('lumio_tennis_brand_logo') || '')
    window.addEventListener('lumio-profile-updated', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('lumio-profile-updated', sync); window.removeEventListener('storage', sync) }
  }, [])
  return logo
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────
const cleanResponse = (text: string) => text
  .replace(/#{1,6}\s*/g, '')
  .replace(/\*\*(.*?)\*\*/g, '$1')
  .replace(/\*(.*?)\*/g, '$1')
  .replace(/__(.*?)__/g, '$1')
  .replace(/`([^`]+)`/g, '$1')
  .replace(/^\s*>\s?/gm, '')
  .replace(/^\s*[-•·–—*+]\s+/gm, '')
  .replace(/^\s*[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25CF\u2013\u2014]\s*/gm, '')
  .replace(/^\s*\d+[.)]\s*/gm, '')
  .replace(/^\s*[a-zA-Z][.)]\s*/gm, '')
  .replace(/^\s*\p{Extended_Pictographic}+\s*/gmu, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim()

// ─── TENNIS API ──────────────────────────────────────────────────────────────
const TENNIS_API_KEY = process.env.NEXT_PUBLIC_TENNIS_API_KEY ?? '';
const TENNIS_BASE = 'https://api.api-tennis.com/tennis/';

async function tennisAPI(method: string, params: Record<string, string> = {}) {
  if (!TENNIS_API_KEY) return null;
  const qs = new URLSearchParams({ method, APIkey: TENNIS_API_KEY, ...params });
  try {
    const res = await fetch(`${TENNIS_BASE}?${qs}`);
    const data = await res.json();
    return data.success ? data.result : null;
  } catch { return null; }
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface TennisPlayer {
  id: string;
  name: string;
  slug: string;
  nationality: string;
  flag: string;
  dateOfBirth: string;
  age: number;
  height: string;
  weight: string;
  plays: 'Right-handed' | 'Left-handed';
  backhand: 'One-handed' | 'Two-handed';
  turned_pro: number;
  photo_url?: string;
  tour: 'ATP' | 'WTA';
  ranking: number;
  doubles_ranking: number;
  race_ranking: number;
  ranking_points: number;
  career_high: number;
  career_high_date: string;
  coach: string;
  physio: string;
  agent: string;
  fitness_trainer: string;
  academy: string;
  plan: 'pro' | 'pro_plus' | 'elite';
  season_wins: number;
  season_losses: number;
  career_titles: number;
}

// ─── DASHBOARD TAB TYPES ──────────────────────────────────────────────────────
interface TennisTask {
  id: string
  title: string
  description?: string
  due: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: string
  source: 'lumio' | 'manual' | 'workflow' | 'atp'
  done: boolean
  overdue: boolean
  linkedWorkflow?: string
  action?: string
  actionSection?: string
  actionModal?: string
}

interface TennisQuickWin {
  id: string
  title: string
  description: string
  impact: 'high' | 'medium'
  effort: '2min' | '5min' | '10min' | '15min'
  category: string
  action: string
  actionSection?: string
  actionUrl?: string
  source: string
}

const PRIORITY_STYLES: Record<string, { dot: string; bg: string; color: string; label: string }> = {
  critical: { dot: '#EF4444', bg: 'rgba(239,68,68,0.12)',   color: '#F87171', label: 'Critical' },
  high:     { dot: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  color: '#FBBF24', label: 'High'     },
  medium:   { dot: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  color: '#60A5FA', label: 'Medium'   },
  low:      { dot: '#6B7280', bg: 'rgba(107,114,128,0.12)', color: '#9CA3AF', label: 'Low'      },
}

const SOURCE_ICON: Record<string, string> = {
  lumio: '⚡', manual: '✏️', workflow: '🔄', atp: '🎾'
}

const TENNIS_QUICK_WINS: TennisQuickWin[] = [
  { id: 'tqw-1', title: 'Book Madrid flights — prices rising daily', description: 'Departing 26 Apr. Business class now £340 vs £280 last week.', impact: 'high', effort: '2min', category: 'Travel', action: 'Search flights →', actionSection: 'travel', source: 'Travel Desk' },
  { id: 'tqw-2', title: 'Reply to Meridian Watches renewal inquiry', description: 'Agent James Wright sent the renewal brief 3 days ago. Decision needed this week.', impact: 'high', effort: '5min', category: 'Commercial', action: 'Open sponsorship →', actionSection: 'sponsorship', source: 'Agent' },
  { id: 'tqw-3', title: 'Apex Performance post overdue today', description: 'Carlos needs kit photo before 12:00 for today\'s obligation.', impact: 'high', effort: '2min', category: 'Sponsor', action: 'View obligation →', actionSection: 'sponsorship', source: 'Apex Performance' },
  { id: 'tqw-4', title: 'Hamburg 500 wildcard — deadline today', description: 'Tournament director needs answer by 5pm. Clashes with Eastbourne.', impact: 'high', effort: '5min', category: 'Entries', action: 'Manage entries →', actionSection: 'entries', source: 'ATP Entry' },
  { id: 'tqw-5', title: 'Review Vega serve patterns', description: 'Match today at 13:00. Analysis team uploaded 3 tagged clips.', impact: 'medium', effort: '10min', category: 'Match Prep', action: 'View match prep →', actionSection: 'matchprep', source: 'Analysis' },
  { id: 'tqw-6', title: 'Roland-Garros hotel deposit due 1 May', description: 'Apartment owner requesting €800 deposit. Travel desk waiting.', impact: 'medium', effort: '5min', category: 'Travel', action: 'Search hotels →', actionSection: 'travel', source: 'Travel Desk' },
  { id: 'tqw-7', title: '2 Apex Performance posts outstanding — March obligation', description: 'Apex Performance partnership requires 4 posts per season. 2 overdue since March.', impact: 'medium', effort: '5min', category: 'Commercial', action: 'View obligation →', actionSection: 'sponsorship', source: 'Apex Performance' },
]

const TENNIS_TASKS: TennisTask[] = [
  { id: 't1', title: 'Reply to Tournament Desk — court time moved 30 min', description: 'URGENT: Confirm receipt of court schedule change. Court 4 now 13:30.', due: '10:00', priority: 'critical', category: 'Match', source: 'atp', done: false, overdue: false, action: 'Reply now', actionSection: 'morning' },
  { id: 't2', title: 'See Dr Lee for shoulder — pre-match', description: 'Physio flagged inflammation. Ice 20 min + treatment before warm-up.', due: '12:30', priority: 'high', category: 'Medical', source: 'lumio', done: false, overdue: false, action: 'View physio', actionSection: 'physio-recovery' },
  { id: 't3', title: 'Practice session — serve patterns', description: 'Focus: kick serve to backhand on deuce court. 90 min max.', due: '10:00', priority: 'high', category: 'Training', source: 'lumio', done: false, overdue: false, action: 'Log practice', actionModal: 'notes' },
  { id: 't4', title: 'Stringing with Carlos — 2x Vanta Sports Luxe Pro', description: 'Clay tensions confirmed. Pick up from string room at 11:30.', due: '11:45', priority: 'medium', category: 'Equipment', source: 'lumio', done: false, overdue: false, action: 'String order', actionModal: 'strings' },
  { id: 't5', title: 'Apex Performance kit photo — send to Carlos before 12:00', description: 'Sponsor obligation. Carlos has the brief.', due: '11:30', priority: 'high', category: 'Commercial', source: 'workflow', linkedWorkflow: 'SP-03', done: false, overdue: false, action: 'View obligation', actionSection: 'sponsorship' },
  { id: 't6', title: 'Respond to Hamburg 500 wildcard offer', description: 'Deadline 5pm today. Clashes with Eastbourne.', due: '17:00', priority: 'high', category: 'Entries', source: 'atp', done: false, overdue: false, action: 'Entry manager', actionModal: 'entries' },
  { id: 't7', title: 'Match vs C. Vega — Court 4', description: 'Monte-Carlo Masters QF. H2H 3–1.', due: '13:30', priority: 'critical', category: 'Match', source: 'atp', done: false, overdue: false, action: 'Match prep', actionModal: 'matchprep' },
]

// ─── SIDEBAR ITEMS ────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',          icon: '🏠', group: 'OVERVIEW'     },
  { id: 'morning',     label: 'Morning Briefing',    icon: '🌅', group: 'OVERVIEW'     },
  { id: 'performance', label: 'Performance',         icon: '📊', group: 'PERFORMANCE'  },
  { id: 'gpsvideo',    label: 'GPS & Video',         icon: '🛰️', group: 'PERFORMANCE'  },
  { id: 'schedule',    label: 'Tournament Schedule', icon: '🗓️', group: 'MATCH'        },
  { id: 'livescores',  label: 'Live Scores',         icon: '🔴', group: 'MATCH'        },
  { id: 'matchprep',   label: 'Match Prep',          icon: '🎯', group: 'MATCH'        },
  { id: 'scout',       label: 'Opponent Scout',      icon: '🔍', group: 'MATCH'        },
  { id: 'draw',        label: 'Draw & Bracket',      icon: '🏆', group: 'MATCH'        },
  { id: 'team',        label: 'Team Hub',            icon: '👥', group: 'TEAM'         },
  { id: 'physio',      label: 'Physio & Recovery',   icon: '⚕️', group: 'TEAM'         },
  { id: 'nutrition',   label: 'Nutrition',           icon: '🥗', group: 'TEAM'         },
  { id: 'racket',      label: 'Racket & Strings',    icon: '🎾', group: 'TEAM'         },
  { id: 'mental',      label: 'Mental Performance',  icon: '🧠', group: 'TEAM'         },
  { id: 'travel',      label: 'Travel & Logistics',  icon: '✈️', group: 'TEAM'         },
  { id: 'partners',    label: 'Playing Partners',    icon: '🤜', group: 'TEAM'         },
  { id: 'doubles',     label: 'Doubles',             icon: '🎭', group: 'TEAM'         },
  { id: 'teamcomms',   label: 'Team Comms',          icon: '💬', group: 'TEAM'         },
  { id: 'sponsorship', label: 'Sponsorship',         icon: '🤝', group: 'COMMERCIAL'   },
  { id: 'financial',   label: 'Financial',           icon: '💰', group: 'COMMERCIAL'   },
  { id: 'media',       label: 'Media & Content',     icon: '📱', group: 'COMMERCIAL'   },
  { id: 'exhibition',  label: 'Exhibitions',         icon: '🎪', group: 'COMMERCIAL'   },
  { id: 'pipeline',    label: 'Agent Pipeline',      icon: '📋', group: 'COMMERCIAL'   },
  { id: 'prizeforecast', label: 'Prize Forecaster',  icon: '💵', group: 'COMMERCIAL'   },
  { id: 'entries',     label: 'Entry Manager',       icon: '📋', group: 'TOOLS'        },
  { id: 'career',      label: 'Career Planning',     icon: '🚀', group: 'TOOLS'        },
  { id: 'academy',     label: 'Academy & Dev',       icon: '🎓', group: 'TOOLS'        },
  { id: 'datahub',     label: 'Data Hub',            icon: '🔌', group: 'TOOLS'        },
  { id: 'courtbooking', label: 'Court Booking',       icon: '🏟️', group: 'TOOLS'        },
  { id: 'federation',  label: 'Federation',          icon: '🏛️', group: 'TOOLS'        },
  { id: 'accreditations', label: 'Accreditations',   icon: '🪪', group: 'TOOLS'        },
  { id: 'playerdirectory', label: 'Player Directory', icon: '👥', group: 'TOOLS'       },
  { id: 'coachfinder', label: 'Coach Finder',        icon: '🎓', group: 'TOOLS'       },
  { id: 'settings',    label: 'Settings',            icon: '⚙️', group: 'TOOLS'        },
];

// ─── DEMO PLAYER DATA ─────────────────────────────────────────────────────────
const DEMO_PLAYER: TennisPlayer = {
  id: 'player-demo-001',
  name: 'Alex Rivera',
  slug: 'alex-rivera',
  nationality: 'British',
  flag: '🇬🇧',
  dateOfBirth: '1998-03-14',
  age: 28,
  height: '6\'2" / 188cm',
  weight: '82kg / 181lbs',
  plays: 'Right-handed',
  backhand: 'Two-handed',
  turned_pro: 2018,
  tour: 'ATP',
  ranking: 67,
  doubles_ranking: 189,
  race_ranking: 54,
  ranking_points: 1847,
  career_high: 44,
  career_high_date: 'June 2024',
  coach: 'Marco Bianchi',
  physio: 'Sarah Okafor',
  agent: 'James Whitfield (IMG)',
  fitness_trainer: 'Luis Santos',
  academy: 'National Tennis Centre, London',
  plan: 'pro_plus',
  season_wins: 24,
  season_losses: 11,
  career_titles: 2,
};

// ─── MATCH LOAD DEMO ──────────────────────────────────────────────────────────
const MATCH_LOAD_DATA = [
  { week: 'Jan W1', matches: 2, hours: 3.4, surface: 'Hard' },
  { week: 'Jan W2', matches: 3, hours: 5.8, surface: 'Hard' },
  { week: 'Jan W3', matches: 4, hours: 7.2, surface: 'Hard' },
  { week: 'Jan W4', matches: 2, hours: 3.6, surface: 'Hard' },
  { week: 'Feb W1', matches: 1, hours: 2.1, surface: 'Hard' },
  { week: 'Feb W2', matches: 3, hours: 5.4, surface: 'Indoor' },
  { week: 'Feb W3', matches: 4, hours: 7.8, surface: 'Indoor' },
  { week: 'Feb W4', matches: 2, hours: 4.1, surface: 'Hard' },
  { week: 'Mar W1', matches: 3, hours: 5.6, surface: 'Hard' },
  { week: 'Mar W2', matches: 4, hours: 8.2, surface: 'Hard' },
  { week: 'Mar W3', matches: 2, hours: 3.8, surface: 'Hard' },
  { week: 'Mar W4', matches: 3, hours: 5.9, surface: 'Clay' },
  { week: 'Apr W1', matches: 3, hours: 6.4, surface: 'Clay' },
];

// ─── GPS DEMO DATA ─────────────────────────────────────────────────────────────
const GPS_SESSIONS_TENNIS = [
  { day: 1, date: '2026-04-01', type: 'Practice', surface: 'Clay', duration: 95, distance: 7.2, load: 312, acr_acute: 0.88, acr_chronic: 0.90, acwr: 0.98,
    court: [{x:200,y:320,r:40,o:0.7},{x:200,y:300,r:35,o:0.6},{x:195,y:330,r:28,o:0.5},{x:160,y:310,r:22,o:0.4},{x:240,y:315,r:20,o:0.38},{x:200,y:180,r:18,o:0.3},{x:200,y:160,r:14,o:0.25}] },
  { day: 2, date: '2026-04-02', type: 'Match', surface: 'Clay', duration: 118, distance: 9.4, load: 421, acr_acute: 0.96, acr_chronic: 0.91, acwr: 1.05,
    court: [{x:200,y:315,r:45,o:0.72},{x:200,y:295,r:38,o:0.62},{x:155,y:310,r:28,o:0.48},{x:245,y:310,r:25,o:0.45},{x:200,y:170,r:22,o:0.38},{x:160,y:180,r:16,o:0.28},{x:240,y:175,r:14,o:0.25}] },
  { day: 3, date: '2026-04-03', type: 'Rest', surface: 'Clay', duration: 0, distance: 0, load: 0, acr_acute: 0.88, acr_chronic: 0.91, acwr: 0.97, court: [] },
  { day: 4, date: '2026-04-04', type: 'Practice', surface: 'Clay', duration: 105, distance: 8.1, load: 368, acr_acute: 0.99, acr_chronic: 0.92, acwr: 1.08,
    court: [{x:200,y:320,r:42,o:0.68},{x:200,y:298,r:36,o:0.58},{x:158,y:315,r:26,o:0.46},{x:242,y:318,r:24,o:0.43},{x:200,y:165,r:20,o:0.35},{x:165,y:170,r:15,o:0.26}] },
  { day: 5, date: '2026-04-05', type: 'Match', surface: 'Clay', duration: 142, distance: 11.2, load: 498, acr_acute: 1.09, acr_chronic: 0.93, acwr: 1.17,
    court: [{x:200,y:320,r:48,o:0.75},{x:200,y:295,r:40,o:0.65},{x:150,y:310,r:30,o:0.52},{x:250,y:312,r:28,o:0.48},{x:200,y:168,r:24,o:0.40},{x:155,y:175,r:18,o:0.32},{x:245,y:172,r:16,o:0.28},{x:200,y:350,r:14,o:0.24}] },
  { day: 6, date: '2026-04-06', type: 'Practice', surface: 'Clay', duration: 80, distance: 6.4, load: 274, acr_acute: 1.04, acr_chronic: 0.94, acwr: 1.11,
    court: [{x:200,y:318,r:38,o:0.64},{x:200,y:300,r:30,o:0.54},{x:200,y:160,r:22,o:0.38},{x:162,y:170,r:16,o:0.28}] },
  { day: 7, date: '2026-04-07', type: 'Match', surface: 'Clay', duration: 98, distance: 8.8, load: 394, acr_acute: 1.06, acr_chronic: 0.95, acwr: 1.12,
    court: [{x:200,y:315,r:44,o:0.70},{x:200,y:292,r:36,o:0.60},{x:152,y:308,r:28,o:0.50},{x:248,y:310,r:26,o:0.46},{x:200,y:166,r:22,o:0.36},{x:200,y:350,r:16,o:0.26}] },
];

function TennisCourtHeatmap({ session, size = 300 }: { session: typeof GPS_SESSIONS_TENNIS[0]; size?: number }) {
  const w = size; const h = size * 1.4;
  const scale = size / 400;
  const cx = w / 2;
  const courtL = w * 0.08; const courtR = w * 0.92;
  const courtT = h * 0.04; const courtB = h * 0.96;
  const netY = (courtT + courtB) / 2;
  const serviceL = cx - w * 0.21; const serviceR = cx + w * 0.21;
  const serviceNear = netY + h * 0.18; const serviceFar = netY - h * 0.18;
  const lines: [number, number, number, number][] = [
    [courtL,courtT,courtR,courtT],[courtL,courtB,courtR,courtB],
    [courtL,courtT,courtL,courtB],[courtR,courtT,courtR,courtB],
    [courtL,netY,courtR,netY],
    [cx,courtT,cx,courtB],
    [serviceL,netY,serviceL,serviceFar],[serviceR,netY,serviceR,serviceFar],
    [serviceL,netY,serviceL,serviceNear],[serviceR,netY,serviceR,serviceNear],
    [serviceL,serviceFar,serviceR,serviceFar],[serviceL,serviceNear,serviceR,serviceNear],
  ];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{display:'block'}}>
      <rect x={0} y={0} width={w} height={h} fill="#1a0a00"/>
      <rect x={courtL} y={courtT} width={courtR-courtL} height={courtB-courtT} fill="#8B4513" opacity="0.3"/>
      {lines.map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
      ))}
      <rect x={courtL} y={netY-2} width={courtR-courtL} height={4} fill="white" opacity="0.8"/>
      <text x={cx} y={courtB-8} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize={w*0.028}>BASELINE</text>
      <text x={cx} y={courtT+14} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize={w*0.028}>OPPONENT</text>
      {session.court.map((z,i)=>(
        <circle key={i} cx={z.x*scale} cy={z.y*scale*1.4} r={z.r*scale} fill="#8B5CF6" opacity={z.o} style={{filter:'blur(8px)'}}/>
      ))}
    </svg>
  );
}

// ─── SURFACE BADGE ─────────────────────────────────────────────────────────────
const SurfaceBadge = ({ surface }: { surface: string }) => {
  const colors: Record<string, string> = {
    'Clay': 'bg-orange-600/20 text-orange-400 border border-orange-600/30',
    'Hard': 'bg-blue-600/20 text-blue-400 border border-blue-600/30',
    'Grass': 'bg-green-600/20 text-green-400 border border-green-600/30',
    'Indoor Hard': 'bg-purple-600/20 text-purple-400 border border-purple-600/30',
    'Indoor': 'bg-purple-600/20 text-purple-400 border border-purple-600/30',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[surface] || 'bg-gray-700 text-gray-400'}`}>
      {surface}
    </span>
  );
};

// ─── CATEGORY BADGE ────────────────────────────────────────────────────────────
const CategoryBadge = ({ category }: { category: string }) => {
  const colors: Record<string, string> = {
    'Grand Slam': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    'Masters 1000': 'bg-purple-600/20 text-purple-400 border border-purple-600/30',
    'WTA 1000': 'bg-purple-600/20 text-purple-400 border border-purple-600/30',
    'ATP 500': 'bg-blue-600/20 text-blue-400 border border-blue-600/30',
    'WTA 500': 'bg-blue-600/20 text-blue-400 border border-blue-600/30',
    'ATP 250': 'bg-teal-600/20 text-teal-400 border border-teal-600/30',
    'WTA 250': 'bg-teal-600/20 text-teal-400 border border-teal-600/30',
    'Challenger 125': 'bg-gray-600/20 text-gray-400 border border-gray-600/30',
    'WTA 125': 'bg-gray-600/20 text-gray-400 border border-gray-600/30',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[category] || 'bg-gray-700 text-gray-400'}`}>
      {category}
    </span>
  );
};

// ─── STAT CARD ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = 'purple' }: { label: string; value: string | number; sub?: string; color?: string }) => {
  const colorMap: Record<string, string> = {
    purple: 'from-purple-600/20 to-purple-900/10 border-purple-600/20',
    teal:   'from-teal-600/20 to-teal-900/10 border-teal-600/20',
    orange: 'from-orange-600/20 to-orange-900/10 border-orange-600/20',
    blue:   'from-blue-600/20 to-blue-900/10 border-blue-600/20',
    green:  'from-green-600/20 to-green-900/10 border-green-600/20',
    yellow: 'from-yellow-600/20 to-yellow-900/10 border-yellow-600/20',
    red:    'from-red-600/20 to-red-900/10 border-red-600/20',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-4`}>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
};

// ─── AI DEPARTMENT INTELLIGENCE SECTION ──────────────────────────────────────
interface TennisAISectionProps {
  context: string
  player: TennisPlayer
  session: SportsDemoSession
}

function TennisAISection({ context, player, session }: TennisAISectionProps) {
  if (context !== 'insights') return null
  const isDemoShell = session.isDemoShell !== false
  const demoContent = isDemoShell ? getDemoAISummary('tennis', context) : null
  const [summary, setSummary]   = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [generated, setGenerated] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const HIGHLIGHTS: Record<string, string[]> = {
    dashboard: ['ATP Ranking: #67 — up 4 this clay swing', 'Clay win rate: 68% — above ATP tour avg (61%)', 'Serve %: 64% last 5 matches — up 6% from season avg', '312 ranking points expiring after Monte-Carlo', 'Race to Turin: #54 — top 8 qualifies'],
    performance: ['First serve %: 64% (last 5) — best run of season', 'Double faults per match: 2.1 — down from 3.4 in March', 'Return points won: 44% — above tour avg (42%)', 'Winners-to-errors ratio: 1.8 on clay — strong', 'Average rally length: 6.2 shots — up 1.1 this month'],
    rankings: ['ATP Ranking: #67 — up 4 places this clay swing', 'Race to Turin: #54 — 3 places outside qualification zone', 'Career high: #44 ATP — achievable by Wimbledon', 'Points defending Roland-Garros: 45pts — minimal pressure', 'Prize money YTD: £387,420 — 12% ahead of last year'],
    forecaster: ['Win title: projected #58 (+9 places)', 'QF exit: holds at #67 (0 change)', 'R1 loss: drops to #71 (−4 places)', 'Points available at Madrid M1000: 500', 'Roland-Garros points available: 2000 (Grand Slam)'],
    physiorecovery: ['Shoulder inflammation flagged — see Dr Lee 12:30 today', 'GPS load this week: 4,820 AU — within optimal range', 'ACWR: 1.12 — green zone (ideal 0.8–1.3)', 'Recovery score today: 81/100 — good baseline for match', 'Last deep tissue session: Tuesday — 5 days ago'],
    mental: ['Pre-match routine: 45 min protocol confirmed with Marcos', 'Pressure darts score last session: 8.4/10 — improving', 'Deciding-set win rate: 67% on clay this season', 'Average between-point routine: 22 seconds — on target', 'Visualisation sessions this week: 4 of 5 completed'],
    matchprep: ['Vega H2H: 3–1 in your favour — last 3 on clay all won', 'Vega first serve wide on deuce: 68% tendency', 'His BH breakdown rate under pressure: 61%', 'Your winning shot vs Vega: inside-out FH (42% of winners)', 'His double fault rate on clay: 3.1/match — above average'],
    opponentintel: ['Vega first serve: 68% wide on deuce court (clay)', 'Vega return: 71% forehand-dominant — exploit BH side', 'H2H: 3–1 in your favour — last 3 on clay all won', 'Vega break point conversion: 41% — below average', 'Vega ATP ranking: #34 — career high #28'],
    practicelog: ['Sessions this week: 4 of 5 planned — on track', 'Serve speed peak in practice: 124mph — 3mph above match avg', 'Average practice 3DA: 99.4 — above match average', 'Footwork drills completed this month: 18 of 20 target', 'Forehand cross-court consistency: +8% last week'],
    sponsorship: ['Meridian Watches deal value: £240,000/yr — renewal in 47 days', 'Apex Performance: 2 posts outstanding (March + today)', 'Apex Performance: 0/2 posts completed this month', 'Estimated sponsor reach YTD: 14.2M across all platforms', 'Total commercial income YTD: £84,200'],
    financial: ['Prize money YTD: £387,420', 'Season expenses to date: £42,800', 'Net earnings YTD: £344,620 (before tax/agent)', 'Agent commission (15%): £58,113 YTD', 'Tax instalment due: 31 Jul — accountant briefed'],
    travel: ['Flights booked: 4 of 7 remaining tournaments', 'Travel budget used: £18,400 of £36,000 season allocation', 'Hotels confirmed: Monte-Carlo, Madrid, Paris', 'Roland-Garros apartment deposit outstanding: €800', 'Next unbooked: Halle Open — depart 13 Jun'],
    agent: ['Crown Wagers ambassador inquiry: £85k/yr offer pending', 'Hamburg wildcard: decision deadline today 5pm', 'Meridian Watches renewal: 47 days — agent has draft terms', 'Madrid wild card: accepted (no action needed)', 'Wimbledon entry: not yet submitted — deadline 26 May'],
    teamhub: ['Team today: 5 of 6 confirmed present in Monte-Carlo', 'Marcos Silva (psychologist): remote — call at 15:00', 'Coach session: 10:00 serve patterns — 90 min', 'Dr Lee: 12:30 shoulder treatment — confirmed', 'Tom Ellis (stringer): 11:45 — Vanta Sports Luxe Pro ready'],
    schedule: ['Next 5: MC QF today, Madrid, Roland-Garros, Halle, Wimbledon', 'Points available next 4 weeks: 1,800 pts (SF+) across all', 'Hard deadline next: Roland-Garros entries — 3 May', 'Hamburg vs Eastbourne clash: decision needed today', 'Race to Turin impact: need 2 SF results to break top-20'],
    video: ['Unreviewed match clips this week: 3', 'Vega clay footage: 2 matches tagged and ready', 'Coach added 4 tactical notes to Barcelona SF clip', 'Serve analysis session: booked Thursday with Carlos', 'Season highlight reel: 67% complete'],
    media: ['Press conference today: post-match (win or lose)', 'L\'Equipe interview request: 15 min — awaiting response', 'Social following: 207k total (IG: 142k, TW: 65k)', 'Engagement rate this week: 4.2% — above 3.1% avg', 'Press mentions this month: 23 articles'],
    default: ['ATP Ranking: #67 — up 4 this clay swing', 'Clay win rate: 68% — above tour avg (61%)', 'Serve %: 64% (last 5 matches)', 'Prize money YTD: £387,420', 'Race to Turin: #54 of 8 qualification spots'],
  }

  const highlights = HIGHLIGHTS[context] ?? HIGHLIGHTS.default

  const generateSummary = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/tennis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are a personal assistant for ${session.userName || player.name}, ATP #${player.ranking ?? 67} professional tennis player.

Generate an AI OPERATIONAL SUMMARY for the "${context}" section.

IMPORTANT: This summary must be specifically about "${context}".
Do NOT give generic tennis advice. Be specific to this section.

Context guide:
- "physiorecovery" → shoulder status, GPS load, ACWR, recovery protocols, injury flags
- "mental" → mindset, pressure handling, pre-match routine, recent mental performance
- "matchprep" → opponent tactics, serve patterns, H2H stats, court conditions
- "sponsorship" → obligations due, content deadlines, renewal status, commercial actions
- "financial" → prize money, expenses, tax, agent fees, budget status
- "travel" → upcoming flights, hotels, logistics, visa status
- "teamhub" → team availability, appointments today, who is where
- "schedule" → upcoming tournaments, entry deadlines, ranking implications
- "performance" → recent match stats, serve %, return data, trends
- "video" → footage to review, analyst notes, session bookings
- "agent" → deals pending, wildcard decisions, contract renewals
- "media" → press obligations, interview requests, social media
- "dashboard" → today's schedule, urgent messages, key priorities

Write 4-5 specific points covering actions, context, and operational detail.
Do NOT repeat what is in the Performance Intelligence panel.
Performance Intelligence shows numbers/stats.
This panel shows actions, context, and operational detail.
Max 200 words.

Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.`
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
        b.type === 'text' ? b.text : ''
      ).join('') || ''
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
    console.warn(`[TennisAISection] No demo content for tennis/${context}`)
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
                className="w-full py-3 rounded-xl text-xs font-semibold border border-gray-800 text-gray-500 hover:border-[#0ea5e9]/40 hover:text-[#0ea5e9] transition-all">
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
            <div className="flex items-center gap-2"><span>⚡</span><span className="text-sm font-bold text-white">Performance Intelligence</span></div>
            <span className="text-[10px] text-[#0ea5e9] cursor-pointer hover:underline">Data</span>
          </div>
          <div className="space-y-2">
            {displayHighlights.map((h, i) => (
              <div key={i} className="flex gap-3 py-1.5 border-b border-gray-800/40 last:border-0">
                <span className="text-xs text-[#0ea5e9] font-bold flex-shrink-0 w-4">{i+1}</span>
                <span className="text-xs text-gray-300">{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SECTION HEADER ────────────────────────────────────────────────────────────
const SectionHeader = ({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: string }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2">
      {icon && <span className="text-xl">{icon}</span>}
      <h2 className="text-xl font-bold text-white" style={{  }}>{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-gray-400 mt-1 ml-7">{subtitle}</p>}
  </div>
);

// ─── QUICK ACTIONS BAR ─────────────────────────────────────────────────────────
function generateQuickMatchPDF(playerName = 'Alex Rivera', ranking = 67, points = 1847) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>Match Report — ${playerName}</title>
  <style>
    body{font-family:Georgia,serif;max-width:780px;margin:32px auto;color:#1a1a2e;font-size:12px;line-height:1.7}
    h1{font-size:22px;margin-bottom:4px;border-bottom:3px solid #8B5CF6;padding-bottom:8px;color:#1a1a2e}
    .meta{font-size:10px;color:#666;margin-bottom:20px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
    .box{border:1px solid #ddd;border-radius:6px;padding:12px}
    .box-label{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px}
    .box-val{font-size:18px;font-weight:700;color:#8B5CF6}
    h2{font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#888;border-bottom:1px solid #eee;padding-bottom:3px;margin:16px 0 8px}
    .section{background:#f9f9ff;border-left:3px solid #8B5CF6;padding:10px 14px;border-radius:0 4px 4px 0;margin-bottom:10px}
    .serve-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}
    .serve-box{border:1px solid #ddd;border-radius:4px;padding:8px;text-align:center}
    .round-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px}
    .round-box{border:1px solid #ddd;border-radius:4px;padding:8px}
    .round-num{font-weight:700;font-size:13px;margin-bottom:4px}
    .round-notes{height:40px;border-top:1px solid #f0f0f0;margin-top:4px}
    footer{margin-top:24px;font-size:9px;color:#aaa;border-top:1px solid #eee;padding-top:8px;display:flex;justify-content:space-between}
    @media print{body{margin:16px}@page{size:A4;margin:8mm}}
  </style></head><body>
  <h1>🎾 Match Report</h1>
  <div class="meta">${playerName} · ATP #${ranking} · ${points.toLocaleString()} pts · ${new Date().toLocaleDateString('en-GB')} · CONFIDENTIAL — Team Only</div>
  <div class="grid2">
    <div class="box"><div class="box-label">Match</div><input style="border:none;font-size:14px;font-weight:600;width:100%;outline:none" placeholder="e.g. vs Caballero · Monte-Carlo R2"/></div>
    <div class="box"><div class="box-label">Result</div><input style="border:none;font-size:14px;font-weight:600;width:100%;outline:none" placeholder="e.g. Won 6-4 4-6 7-5"/></div>
  </div>
  <h2>Serve Statistics</h2>
  <div class="serve-grid">
    <div class="serve-box"><div style="font-size:9px;color:#888">1st Serve %</div><div style="font-size:20px;font-weight:700">___%</div></div>
    <div class="serve-box"><div style="font-size:9px;color:#888">1st Serve Won</div><div style="font-size:20px;font-weight:700">___%</div></div>
    <div class="serve-box"><div style="font-size:9px;color:#888">Aces</div><div style="font-size:20px;font-weight:700">___</div></div>
    <div class="serve-box"><div style="font-size:9px;color:#888">Double Faults</div><div style="font-size:20px;font-weight:700">___</div></div>
  </div>
  <h2>GPS Load Summary</h2>
  <div class="grid2">
    <div class="box"><div class="box-label">Distance</div><div class="box-val">___ km</div></div>
    <div class="box"><div class="box-label">ACWR</div><div class="box-val">___</div></div>
  </div>
  <h2>Set-by-Set Notes</h2>
  <div class="round-grid">
    ${[1,2,3].map(s=>`<div class="round-box"><div class="round-num">Set ${s}</div><div class="round-notes"></div></div>`).join('')}
  </div>
  <h2>Tactical Assessment — Marco Bianchi</h2>
  <div class="section" contenteditable="true" style="min-height:60px">Click to add tactical notes...</div>
  <h2>Next Session Priority</h2>
  <div class="section" contenteditable="true" style="min-height:40px">Click to add training focus...</div>
  <footer><span>Lumio Tour · lumiosports.com · ${new Date().toLocaleDateString('en-GB')}</span><span>CONFIDENTIAL — Team Only</span></footer>
  </body></html>`);
  w.document.close();
  setTimeout(()=>w.print(),400);
}

const QuickActionsBar = () => {
  const actions = [
    'Log Practice', 'Book Stringing', 'Log Injury', 'Add Sponsor Post',
    'View Draw', 'Match Notes', 'Add Expense', 'Team Briefing',
    'Flight Search', 'Press Statement', 'Wildcard Request', 'Video Upload',
  ];
  return (
    <div className="mb-6 overflow-x-auto pb-2 -mx-1">
      <div className="flex gap-2 px-1 min-w-max">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action === 'Match Notes' ? () => generateQuickMatchPDF() : undefined}
            className="bg-[#0d0f1a] border border-gray-800 hover:border-purple-500/50 rounded-full px-4 py-2 text-xs text-gray-400 hover:text-white transition-all whitespace-nowrap"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── WAVE BANNER ───────────────────────────────────────────────────────────────
const WaveBanner = ({ player }: { player: TennisPlayer }) => (
  <div className="bg-gradient-to-r from-purple-900/60 via-[#07080F] to-teal-900/40 rounded-xl px-5 py-3 mb-5 flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <button className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-sm hover:bg-purple-600/50 transition-colors">
        ▶
      </button>
      <div>
        <div className="text-xs text-gray-400">Today's match</div>
        <div className="text-sm text-white font-medium">vs Vega, 13:00, Court 4</div>
      </div>
    </div>
    <div className="flex items-center gap-5 text-xs text-gray-400">
      <div className="text-center"><div className="text-gray-500">London</div><div className="text-white font-medium">12:00</div></div>
      <div className="text-center"><div className="text-gray-500">New York</div><div className="text-white font-medium">07:00</div></div>
      <div className="text-center"><div className="text-gray-500">Melbourne</div><div className="text-white font-medium">21:00</div></div>
      <div className="text-center"><div className="text-gray-500">Dubai</div><div className="text-white font-medium">15:00</div></div>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold text-white">{player.name}</span>
      <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full font-medium">#{player.ranking} ATP</span>
    </div>
  </div>
);

// ─── SVG CHARTS ────────────────────────────────────────────────────────────────

const ServePercentChart = () => {
  const data = [
    { surface: 'Clay', pct: 61, color: '#ea580c' },
    { surface: 'Hard', pct: 68, color: '#3b82f6' },
    { surface: 'Grass', pct: 72, color: '#22c55e' },
    { surface: 'Indoor', pct: 65, color: '#a855f7' },
  ];
  const barHeight = 24;
  const gap = 12;
  const labelWidth = 60;
  const maxBarWidth = 240;
  return (
    <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
      <div className="text-sm font-semibold text-white mb-4">1st Serve % by Surface</div>
      <svg width="340" height={data.length * (barHeight + gap)} viewBox={`0 0 340 ${data.length * (barHeight + gap)}`}>
        {data.map((d, i) => {
          const y = i * (barHeight + gap);
          const barWidth = (d.pct / 100) * maxBarWidth;
          return (
            <g key={i}>
              <text x="0" y={y + barHeight / 2 + 4} fill="#9ca3af" fontSize="11">{d.surface}</text>
              <rect x={labelWidth} y={y} width={maxBarWidth} height={barHeight} rx="4" fill="#1f2937" />
              <rect x={labelWidth} y={y} width={barWidth} height={barHeight} rx="4" fill={d.color} opacity="0.8" />
              <text x={labelWidth + barWidth + 8} y={y + barHeight / 2 + 4} fill="#e5e7eb" fontSize="12" fontWeight="bold">{d.pct}%</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const WinRateTrendChart = () => {
  const data = [55, 60, 58, 65, 62, 70, 68, 72, 66, 71, 74, 69];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const w = 400;
  const h = 180;
  const padX = 40;
  const padY = 20;
  const padBottom = 30;
  const chartW = w - padX * 2;
  const chartH = h - padY - padBottom;
  const minVal = 0;
  const maxVal = 100;
  const xStep = chartW / (data.length - 1);
  const points = data.map((v, i) => ({
    x: padX + i * xStep,
    y: padY + chartH - ((v - minVal) / (maxVal - minVal)) * chartH,
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = linePath + ` L${points[points.length - 1].x},${padY + chartH} L${points[0].x},${padY + chartH} Z`;
  return (
    <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
      <div className="text-sm font-semibold text-white mb-4">Win Rate Trend (12 Months)</div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <linearGradient id="winGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map(v => {
          const y = padY + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;
          return (
            <g key={v}>
              <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="#1f2937" strokeWidth="1" />
              <text x={padX - 8} y={y + 4} fill="#6b7280" fontSize="9" textAnchor="end">{v}%</text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#winGrad)" />
        <path d={linePath} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#8B5CF6" stroke="#07080F" strokeWidth="1.5" />
        ))}
        {months.map((m, i) => (
          <text key={i} x={padX + i * xStep} y={h - 6} fill="#6b7280" fontSize="9" textAnchor="middle">{m}</text>
        ))}
      </svg>
    </div>
  );
};

const PrizeMoneyChart = () => {
  const years = ['2024', '2025', '2026'];
  const categories = [
    { label: 'Slams', color: '#eab308' },
    { label: 'M1000', color: '#a855f7' },
    { label: '500', color: '#3b82f6' },
    { label: '250', color: '#14b8a6' },
  ];
  const data = [
    [40, 30, 20, 10],
    [60, 45, 25, 15],
    [80, 50, 35, 20],
  ];
  const w = 400;
  const h = 200;
  const padX = 50;
  const padY = 20;
  const padBottom = 30;
  const chartH = h - padY - padBottom;
  const barGroupWidth = 70;
  const barWidth = barGroupWidth - 10;
  const maxStack = 200;
  return (
    <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
      <div className="text-sm font-semibold text-white mb-2">Prize Money by Category (k GBP)</div>
      <div className="flex gap-3 mb-3">
        {categories.map((c, i) => (
          <div key={i} className="flex items-center gap-1 text-xs text-gray-400">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }}></div>
            {c.label}
          </div>
        ))}
      </div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1={padX} y1={padY} x2={padX} y2={h - padBottom} stroke="#374151" strokeWidth="1" />
        <line x1={padX} y1={h - padBottom} x2={w - 20} y2={h - padBottom} stroke="#374151" strokeWidth="1" />
        {years.map((year, yi) => {
          const cx = padX + 40 + yi * (barGroupWidth + 30);
          let cumY = 0;
          return (
            <g key={yi}>
              {data[yi].map((val, ci) => {
                const segH = (val / maxStack) * chartH;
                const yPos = h - padBottom - cumY - segH;
                cumY += segH;
                return <rect key={ci} x={cx - barWidth / 2} y={yPos} width={barWidth} height={segH} fill={categories[ci].color} rx="2" opacity="0.85" />;
              })}
              <text x={cx} y={h - 10} fill="#9ca3af" fontSize="10" textAnchor="middle">{year}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const RecoveryChart = () => {
  const data = [72, 78, 82, 75, 88, 82, 85];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const w = 360;
  const h = 150;
  const padX = 35;
  const padY = 15;
  const padBottom = 25;
  const chartW = w - padX * 2;
  const chartH = h - padY - padBottom;
  const xStep = chartW / (data.length - 1);
  const minV = 50;
  const maxV = 100;
  const points = data.map((v, i) => ({
    x: padX + i * xStep,
    y: padY + chartH - ((v - minV) / (maxV - minV)) * chartH,
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = linePath + ` L${points[points.length - 1].x},${padY + chartH} L${points[0].x},${padY + chartH} Z`;
  return (
    <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
      <div className="text-sm font-semibold text-white mb-4">WHOOP Recovery (7-Day Trend)</div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <linearGradient id="recovGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#recovGrad)" />
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
};

const RankingTrajectoryChart = () => {
  const data = [90, 88, 85, 82, 80, 78, 76, 74, 72, 71, 70, 68, 72, 74, 69, 65, 60, 55, 50, 44, 52, 58, 62, 67];
  const careerHigh = 44;
  const w = 420;
  const h = 200;
  const padX = 40;
  const padY = 20;
  const padBottom = 30;
  const chartW = w - padX * 2;
  const chartH = h - padY - padBottom;
  const xStep = chartW / (data.length - 1);
  const minV = 30;
  const maxV = 100;
  const points = data.map((v, i) => ({
    x: padX + i * xStep,
    y: padY + ((v - minV) / (maxV - minV)) * chartH,
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const chY = padY + ((careerHigh - minV) / (maxV - minV)) * chartH;
  return (
    <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
      <div className="text-sm font-semibold text-white mb-4">Ranking Trajectory (24 Months)</div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1={padX} y1={chY} x2={w - padX} y2={chY} stroke="#eab308" strokeWidth="1" strokeDasharray="5,5" opacity="0.5" />
        <text x={w - padX + 5} y={chY + 3} fill="#eab308" fontSize="9">#{careerHigh} CH</text>
        <path d={linePath} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill="#8B5CF6" stroke="#07080F" strokeWidth="1" />
        ))}
        <text x={padX - 5} y={padY + 4} fill="#6b7280" fontSize="9" textAnchor="end">#30</text>
        <text x={padX - 5} y={padY + chartH + 4} fill="#6b7280" fontSize="9" textAnchor="end">#100</text>
        <text x={padX} y={h - 5} fill="#6b7280" fontSize="9" textAnchor="middle">-24m</text>
        <text x={w - padX} y={h - 5} fill="#6b7280" fontSize="9" textAnchor="middle">Now</text>
      </svg>
    </div>
  );
};

const IncomeExpenseChart = () => {
  const years = ['2024', '2025', '2026'];
  const income = [180, 320, 540];
  const expenses = [160, 240, 280];
  const w = 400;
  const h = 200;
  const padX = 50;
  const padY = 20;
  const padBottom = 30;
  const chartH = h - padY - padBottom;
  const maxVal = 600;
  const groupSpacing = 90;
  const barW = 28;
  return (
    <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
      <div className="text-sm font-semibold text-white mb-2">Income vs Expenses (k GBP)</div>
      <div className="flex gap-3 mb-3">
        <div className="flex items-center gap-1 text-xs text-gray-400"><div className="w-2.5 h-2.5 rounded-sm bg-green-500"></div>Income</div>
        <div className="flex items-center gap-1 text-xs text-gray-400"><div className="w-2.5 h-2.5 rounded-sm bg-red-500"></div>Expenses</div>
      </div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1={padX} y1={padY} x2={padX} y2={h - padBottom} stroke="#374151" strokeWidth="1" />
        <line x1={padX} y1={h - padBottom} x2={w - 20} y2={h - padBottom} stroke="#374151" strokeWidth="1" />
        {years.map((year, yi) => {
          const cx = padX + 50 + yi * groupSpacing;
          const incH = (income[yi] / maxVal) * chartH;
          const expH = (expenses[yi] / maxVal) * chartH;
          return (
            <g key={yi}>
              <rect x={cx - barW - 2} y={h - padBottom - incH} width={barW} height={incH} fill="#22c55e" rx="3" opacity="0.8" />
              <rect x={cx + 2} y={h - padBottom - expH} width={barW} height={expH} fill="#ef4444" rx="3" opacity="0.8" />
              <text x={cx} y={h - 10} fill="#9ca3af" fontSize="10" textAnchor="middle">{year}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ─── DASHBOARD VIEW ────────────────────────────────────────────────────────────
function DashboardView({ player, session, photos, setPhotos, dismissedWins, onDismissWin, tasks, taskChecked, onToggleTask, newTaskText, setNewTaskText, showAddTask, setShowAddTask, onAddTask, dismissedAlerts, onDismissAlert, teamSubTab, setTeamSubTab, onNavigate, activeModal, onOpenModal, onCloseModal, roleConfig, currentRole }: { player: TennisPlayer; session: SportsDemoSession; photos: string[]; setPhotos: (fn: string[] | ((prev: string[]) => string[])) => void; dismissedWins: Set<string>; onDismissWin: (id: string) => void; tasks: TennisTask[]; taskChecked: Record<string, boolean>; onToggleTask: (id: string) => void; newTaskText: string; setNewTaskText: (v: string) => void; showAddTask: boolean; setShowAddTask: (v: boolean) => void; onAddTask: () => void; dismissedAlerts: Set<string>; onDismissAlert: (id: string) => void; teamSubTab: 'today'|'org'|'info'|'club'; setTeamSubTab: (v: 'today'|'org'|'info'|'club') => void; onNavigate: (section: string) => void; activeModal: string | null; onOpenModal: (id: string) => void; onCloseModal: () => void; roleConfig: typeof TENNIS_ROLE_CONFIG[keyof typeof TENNIS_ROLE_CONFIG]; currentRole: string }) {
  const [dashTab, setDashTab] = useState<'gettingstarted'|'today'|'quickwins'|'dailytasks'|'insights'|'dontmiss'|'team'>(() => {
    try { const seen = typeof window !== 'undefined' ? localStorage.getItem('tennis_getting_started_seen') : null; return seen ? 'today' : 'gettingstarted' } catch { return 'gettingstarted' }
  })
  const [brandPrimary, setBrandPrimary] = useState(() => {
    try { return localStorage.getItem('lumio_tennis_brand_primary') || '#7C3AED' } catch { return '#7C3AED' }
  })
  const [brandSecondary, setBrandSecondary] = useState(() => {
    try { return localStorage.getItem('lumio_tennis_brand_secondary') || '#FFFFFF' } catch { return '#FFFFFF' }
  })
  const [taskFilter, setTaskFilter] = useState<'all'|'critical'|'high'|'medium'|'low'>('all')
  const [tourStep, setTourStep] = useState(0)
  const [showGpsModal, setShowGpsModal] = useState(false)
  const [gpsRequested, setGpsRequested] = useState(false)
  const profileNameLive = useTennisProfileName()
  const profilePhotoLive = useTennisProfilePhoto()
  const isPlayerRole = currentRole === 'player'
  const displayPlayerName = isPlayerRole
    ? (profileNameLive || session.userName || player.name)
    : player.name
  const displayPlayerNickname = isPlayerRole
    ? ((typeof window !== 'undefined' ? localStorage.getItem('lumio_tennis_nickname') : null) || '')
    : ''
  const displayPlayerPhoto = isPlayerRole ? (profilePhotoLive || session.photoDataUrl || '/alex_thompson.jpg') : null
  const firstName = displayPlayerName.split(' ')[0] || 'Alex'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const aiSummaryLabel = hour < 12 ? 'AI Morning Summary' : hour < 17 ? 'AI Afternoon Summary' : 'AI Evening Summary'

  // Speech state
  const [isSpeaking, setIsSpeaking] = useState(false)

  const getVoicesReady = (): Promise<SpeechSynthesisVoice[]> => new Promise(resolve => {
    const v = window.speechSynthesis.getVoices()
    if (v.length > 0) return resolve(v)
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices())
  })

  const speakBriefing = async () => {
    if (typeof window === 'undefined') return
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return }
    window.speechSynthesis.cancel()
    const scheduleRaw = [
      { id:'s1', time:'07:30', label:'AI Morning Briefing',        highlight:false },
      { id:'s2', time:'08:30', label:'Physio — right shoulder',    highlight:false },
      { id:'s3', time:'10:00', label:'Practice — serve patterns',  highlight:false },
      { id:'s4', time:'11:45', label:'Stringing with Carlos',      highlight:false },
      { id:'s5', time:'13:00', label:'Match vs C. Vega',       highlight:true  },
      { id:'s6', time:'15:30', label:'Post-match physio',          highlight:false },
      { id:'s7', time:'17:00', label:'Coach debrief',              highlight:false },
    ]
    const briefingText = generateSmartBriefing({
      now: new Date(),
      playerName: displayPlayerName,
      schedule: buildScheduleItems(scheduleRaw, completedItems, cancelledItems),
      match: { opponent: 'C. Vega', time: '13:00', result: null },
      roundupSummary: buildRoundupSummary(ROUNDUP_ITEMS),
      sport: 'tennis',
      timezone: getUserTimezone(),
      extra: `You're ranked ${player.ranking ?? 67} on the ATP tour with ${(player.ranking_points ?? 1847).toLocaleString()} points.`,
    })
    const allVoices = await getVoicesReady()
    const savedVoiceName = localStorage.getItem('lumio_tts_voice_name') || 'Sarah'
    const voiceMap: Record<string, string[]> = {
      'Sarah': ['Google UK English Female', 'Microsoft Libby', 'Karen', 'Veena'],
      'Charlotte': ['Microsoft Hazel', 'Fiona', 'Samantha', 'Google UK English Female'],
      'George': ['Google UK English Male', 'Microsoft George', 'Daniel', 'Alex'],
    }
    const preferred = voiceMap[savedVoiceName] || voiceMap['Sarah']
    const match = allVoices.find(v => preferred.some(p => v.name.includes(p)))
      || allVoices.find(v => savedVoiceName === 'George'
        ? v.lang.startsWith('en') && v.name.toLowerCase().includes('male')
        : v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'))
    const utterance = new SpeechSynthesisUtterance(briefingText)
    if (match) utterance.voice = match
    utterance.pitch = savedVoiceName === 'George' ? 0.75 : savedVoiceName === 'Charlotte' ? 1.25 : 1.1
    utterance.rate = savedVoiceName === 'George' ? 0.92 : 0.95
    utterance.volume = 1.0
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => { return () => { if (typeof window !== 'undefined') window.speechSynthesis.cancel() } }, [])

  // Schedule state
  const [completedItems, setCompletedItems] = useState<Set<string>>(() => {
    try { const saved = typeof window !== 'undefined' ? localStorage.getItem('lumio_tennis_schedule_done') : null; return saved ? new Set(JSON.parse(saved)) : new Set() } catch { return new Set() }
  })
  const [cancelledItems, setCancelledItems] = useState<Set<string>>(new Set())
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null)
  const toggleScheduleItem = (id: string) => {
    setCompletedItems(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); localStorage.setItem('lumio_tennis_schedule_done', JSON.stringify([...next])); return next })
  }
  const cancelScheduleItem = (id: string, label: string) => {
    const person = label.includes('with ') ? label.split('with ')[1] : label.includes('—') ? label.split('—')[0].trim() : label
    navigator.clipboard.writeText(`Hi ${person} — I need to cancel my ${label.toLowerCase()} scheduled for today. Apologies for short notice. — ${firstName}`)
    setCancelledItems(prev => new Set(prev).add(id)); setCancelConfirm(null)
  }

  // Photo frame state
  const [photoIndex, setPhotoIndex] = useState(0)
  const [photoFit, setPhotoFit] = useState<'cover' | 'contain'>(() => {
    try { return (typeof window !== 'undefined' ? localStorage.getItem('lumio_tennis_photo_fit') as 'cover' | 'contain' : null) || 'cover' } catch { return 'cover' }
  })
  const [isPaused, setIsPaused] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isPaused || photos.length <= 1) return
    const t = setInterval(() => setPhotoIndex(i => (i + 1) % photos.length), 5000)
    return () => clearInterval(t)
  }, [isPaused, photos.length])

  const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || photos.length >= 3) return
    try {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const img = new window.Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX = 400
          let w = img.width, h = img.height
          if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX } }
          else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX } }
          canvas.width = w; canvas.height = h
          const ctx = canvas.getContext('2d')
          if (!ctx) return
          ctx.drawImage(img, 0, 0, w, h)
          const compressed = canvas.toDataURL('image/jpeg', 0.7)
          setPhotos(prev => [...prev, compressed])
        }
        img.src = ev.target?.result as string
      }
      reader.readAsDataURL(file)
    } catch (err) { console.error('Photo upload error:', err) }
    e.target.value = ''
  }

  // Morning Roundup state
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [roundupOrder, setRoundupOrder] = useState<string[]>(() => {
    try { const saved = typeof window !== 'undefined' ? localStorage.getItem('lumio_tennis_roundup_order') : null; return saved ? JSON.parse(saved) : [] } catch { return [] }
  })
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [repliedTo, setRepliedTo] = useState<string[]>([])
  const [replyToast, setReplyToast] = useState(false)

  const ROUNDUP_ITEMS: { id: string; label: string; icon: string; count: number; urgent: boolean; color: string; messages: { id: string; from: string; text: string; time: string }[] }[] = [
    { id:'agent', label:'Agent Messages', icon:'📞', count:2, urgent:false, color:'#a855f7', messages: [
      { id:'a1', from:'James Wright', text:'Meridian Watches renewal — they want a response by end of week. Call me.', time:'8:14am' },
      { id:'a2', from:'James Wright', text:'Crown Wagers inquiry — new ambassador deal. £85k/yr. Interested?', time:'7:52am' },
    ]},
    { id:'tournament', label:'Tournament Desk', icon:'🏆', count:3, urgent:true, color:'#f59e0b', messages: [
      { id:'t1', from:'Monte-Carlo Masters', text:'URGENT: Court 4 time moved to 13:30 (30 min delay). Confirm receipt.', time:'9:01am' },
      { id:'t2', from:'Monte-Carlo Masters', text:'Media accreditation for your coach confirmed — collect at gate B.', time:'8:45am' },
      { id:'t3', from:'Hamburg 500', text:'Wildcard confirmation for Hamburg 500 — deadline today 5pm.', time:'7:30am' },
    ]},
    { id:'sponsor', label:'Media & Sponsor', icon:'📱', count:4, urgent:false, color:'#3b82f6', messages: [
      { id:'s1', from:'Apex Performance', text:'Apex Performance post due TODAY — Carlos needs kit photo before 12:00.', time:'8:30am' },
      { id:'s2', from:'Apex Performance', text:'Apex Performance obligation: 1 post outstanding from March. Please prioritise.', time:'Yesterday' },
      { id:'s3', from:"L'Equipe", text:'Interview request: L\'Equipe — 15 min post-match. Yes/no?', time:'8:05am' },
      { id:'s4', from:'Meridian Watches', text:'Meridian Watches content calendar attached — next shoot: Paris May 20.', time:'7:48am' },
    ]},
    { id:'physio', label:'Physio & Medical', icon:'⚕️', count:1, urgent:true, color:'#ef4444', messages: [
      { id:'p1', from:'Dr Sarah Lee', text:'URGENT: Shoulder inflammation — recommend ice 20 min pre-match. See me at 12:30.', time:'9:15am' },
    ]},
    { id:'coach', label:'Coach Messages', icon:'🎾', count:2, urgent:false, color:'#10b981', messages: [
      { id:'c1', from:'Carlos', text:'Match notes ready on the app. Key: kick serve to his backhand on deuce court.', time:'8:55am' },
      { id:'c2', from:'Carlos', text:'Warm-up plan updated — 45 min. See you at 11:45 for stringing check.', time:'8:20am' },
    ]},
    { id:'prize', label:'Prize Money', icon:'💰', count:1, urgent:false, color:'#f97316', messages: [
      { id:'pm1', from:'ATP Tour Finance', text:'QF prize of EUR 47,500 banked — confirmation attached.', time:'Yesterday' },
    ]},
    { id:'travel', label:'Travel & Logistics', icon:'✈️', count:3, urgent:false, color:'#06b6d4', messages: [
      { id:'tr1', from:'Travel desk', text:'Madrid hotel confirmed — NH Eurobuilding, arriving Mon 26 Apr.', time:'8:00am' },
      { id:'tr2', from:'Travel desk', text:'Halle camp flights — Tue 10 Jun, LHR→HAJ. Confirm passenger details.', time:'Yesterday' },
      { id:'tr3', from:'Travel desk', text:'Roland-Garros apartment: owner requests deposit by 1 May.', time:'2 days ago' },
    ]},
    { id:'wildcard', label:'Wildcard & Entries', icon:'📋', count:2, urgent:false, color:'#ec4899', messages: [
      { id:'w1', from:'ATP Entry', text:'Hamburg 500 wildcard — tournament director needs answer today.', time:'7:30am' },
      { id:'w2', from:'ATP Entry', text:'Winston-Salem: application submitted. Decision by 15 Aug.', time:'3 days ago' },
    ]},
  ]

  const STAT_BOXES = [
    { label:'ATP Rank',    value:`#${player.ranking ?? 67}`,                       icon:'📊', color:'#8B5CF6' },
    { label:'Race',        value:`#${player.race_ranking ?? 54}`,                  icon:'✅', color:'#22C55E' },
    { label:'Points',      value:(player.ranking_points ?? 1847).toLocaleString(), icon:'🔴', color:'#EF4444' },
    { label:'Career High', value:`#${player.career_high ?? 44}`,                   icon:'📧', color:'#0ea5e9' },
  ]

  // Detect user timezone
  const userTimezone = typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Europe/London'
  const TZ_CITY: Record<string,string> = {
    'Europe/London':'London','Europe/Paris':'Paris','Europe/Berlin':'Berlin','Europe/Madrid':'Madrid','Europe/Rome':'Rome','Europe/Amsterdam':'Amsterdam','Europe/Stockholm':'Stockholm','Europe/Zurich':'Zurich','Europe/Moscow':'Moscow',
    'America/New_York':'New York','America/Chicago':'Chicago','America/Denver':'Denver','America/Los_Angeles':'Los Angeles','America/Toronto':'Toronto','America/Vancouver':'Vancouver','America/Sao_Paulo':'São Paulo',
    'Asia/Dubai':'Dubai','Asia/Tokyo':'Tokyo','Asia/Shanghai':'Shanghai','Asia/Singapore':'Singapore','Asia/Hong_Kong':'Hong Kong','Asia/Seoul':'Seoul','Asia/Mumbai':'Mumbai',
    'Australia/Sydney':'Sydney','Australia/Melbourne':'Melbourne','Pacific/Auckland':'Auckland',
  }
  const userCity = TZ_CITY[userTimezone] || userTimezone.split('/').pop()?.replace(/_/g,' ') || 'Your location'
  const clockCities = [
    { city: userCity, tz: userTimezone, isUser: true },
    ...([
      { city:'London',tz:'Europe/London' },{ city:'New York',tz:'America/New_York' },{ city:'Melbourne',tz:'Australia/Melbourne' },{ city:'Dubai',tz:'Asia/Dubai' },
    ].filter(c => c.tz !== userTimezone).slice(0, 3).map(c => ({ ...c, isUser: false }))),
  ]

  // Live weather via Open-Meteo — derived from timezone (no permission popup)
  const [weather, setWeather] = useState<{ temp:number; condition:string; icon:string; city:string } | null>(null)
  useEffect(() => {
    const TZ_COORDS: Record<string,{lat:number;lon:number;city:string}> = {
      'Europe/London':{lat:51.51,lon:-0.13,city:'London'},'Europe/Paris':{lat:48.85,lon:2.35,city:'Paris'},'Europe/Berlin':{lat:52.52,lon:13.41,city:'Berlin'},'Europe/Madrid':{lat:40.42,lon:-3.70,city:'Madrid'},'Europe/Rome':{lat:41.90,lon:12.50,city:'Rome'},'Europe/Amsterdam':{lat:52.37,lon:4.90,city:'Amsterdam'},'Europe/Stockholm':{lat:59.33,lon:18.07,city:'Stockholm'},'Europe/Zurich':{lat:47.38,lon:8.54,city:'Zurich'},'Europe/Moscow':{lat:55.75,lon:37.62,city:'Moscow'},
      'America/New_York':{lat:40.71,lon:-74.01,city:'New York'},'America/Chicago':{lat:41.88,lon:-87.63,city:'Chicago'},'America/Los_Angeles':{lat:34.05,lon:-118.24,city:'Los Angeles'},'America/Toronto':{lat:43.65,lon:-79.38,city:'Toronto'},'America/Vancouver':{lat:49.25,lon:-123.12,city:'Vancouver'},'America/Sao_Paulo':{lat:-23.55,lon:-46.63,city:'São Paulo'},
      'Asia/Dubai':{lat:25.20,lon:55.27,city:'Dubai'},'Asia/Tokyo':{lat:35.68,lon:139.69,city:'Tokyo'},'Asia/Shanghai':{lat:31.23,lon:121.47,city:'Shanghai'},'Asia/Singapore':{lat:1.35,lon:103.82,city:'Singapore'},'Asia/Hong_Kong':{lat:22.32,lon:114.17,city:'Hong Kong'},'Asia/Seoul':{lat:37.57,lon:126.98,city:'Seoul'},'Asia/Mumbai':{lat:19.08,lon:72.88,city:'Mumbai'},
      'Australia/Sydney':{lat:-33.87,lon:151.21,city:'Sydney'},'Australia/Melbourne':{lat:-37.81,lon:144.96,city:'Melbourne'},'Pacific/Auckland':{lat:-36.85,lon:174.76,city:'Auckland'},
    }
    const coords = TZ_COORDS[userTimezone] || {lat:51.51,lon:-0.13,city:'London'}
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code&timezone=auto`)
      .then(r => r.json())
      .then(data => {
        const temp = Math.round(data.current?.temperature_2m ?? 10)
        const wc = data.current?.weather_code ?? 0
        const getC = (c:number) => { if(c===0) return {label:'Clear',icon:'☀️'}; if(c<=2) return {label:'Partly cloudy',icon:'⛅'}; if(c===3) return {label:'Overcast',icon:'☁️'}; if(c<=49) return {label:'Foggy',icon:'🌫️'}; if(c<=59) return {label:'Drizzle',icon:'🌦️'}; if(c<=69) return {label:'Rainy',icon:'🌧️'}; if(c<=79) return {label:'Snowy',icon:'❄️'}; return {label:'Stormy',icon:'⛈️'} }
        const {label,icon} = getC(wc)
        setWeather({temp,condition:label,icon,city:coords.city})
      })
      .catch(() => setWeather({temp:10,condition:'Partly cloudy',icon:'⛅',city:coords.city}))
  }, [])

  return (
    <div className="space-y-0">

      {/* ── PERSONAL BANNER ── */}
      <div className={`relative bg-gradient-to-r from-indigo-900/80 via-slate-900 to-cyan-900/40 overflow-hidden rounded-2xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] mx-1`}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)', pointerEvents: 'none', borderRadius: 'inherit' }} />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyan-400 rounded-full opacity-10 blur-3xl" />
        <div className="relative z-10 px-6 py-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-white tracking-tight">{greeting}, {firstName} 🎾</h1>
                <button onClick={speakBriefing} title={isSpeaking ? 'Stop reading' : 'Text-to-Speech — Lumio Tennis will read your morning headlines, match schedule and urgent items aloud. Upgrade for 20 human-sounding voices.'} className="flex items-center justify-center rounded-lg transition-all"
                  style={{ width: 32, height: 32, flexShrink: 0, backgroundColor: isSpeaking ? 'rgba(14,165,233,0.25)' : 'rgba(255,255,255,0.08)', border: isSpeaking ? '1px solid rgba(14,165,233,0.5)' : '1px solid rgba(255,255,255,0.12)', color: isSpeaking ? '#0ea5e9' : '#9CA3AF' }}>
                  <Volume2 size={15} strokeWidth={1.75} />
                </button>
              </div>
              <p className="text-sm mb-2" style={{ color: '#0ea5e9' }}>{new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
              <p style={{ color: '#F59E0B' }} className="text-sm italic">&ldquo;{getDailyQuote(TENNIS_QUOTES).text}&rdquo; &mdash; {getDailyQuote(TENNIS_QUOTES).author}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {[
                { label:'ATP Rank', value:`#${player.ranking ?? 67}`, color:'bg-purple-500/20 text-purple-300 border-purple-500/30', icon:'📊' },
                { label:'Race', value:`#${player.race_ranking ?? 54}`, color:'bg-green-500/20 text-green-300 border-green-500/30', icon:'✅' },
                { label:'Points', value:(player.ranking_points ?? 1847).toLocaleString(), color:'bg-red-500/20 text-red-300 border-red-500/30', icon:'🔴' },
                { label:'Career High', value:`#${player.career_high ?? 44}`, color:'bg-blue-500/20 text-blue-300 border-blue-500/30', icon:'📧' },
              ].map(item => (
                <div key={item.label} className={`flex flex-col items-center px-3 py-2 rounded-xl border ${item.color} min-w-[70px]`}>
                  <span className="text-base">{item.icon}</span>
                  <span className="text-lg font-black text-white">{item.value}</span>
                  <span className="text-xs opacity-70">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3 flex-shrink-0">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <span className="text-3xl">{weather ? weather.icon : '🌤️'}</span>
                <div>
                  <div className="text-xl font-black text-white">{weather ? `${weather.temp}°C` : '--°C'}</div>
                  <div className="text-xs" style={{ color: '#0ea5e9' }}>{weather ? weather.condition : 'Loading...'}</div>
                </div>
              </div>
              <div className="flex flex-col justify-center px-3 h-[72px] rounded-xl bg-white/5 border border-white/10" style={{ minWidth: '120px' }}>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                  {clockCities.map(({ city, tz, isUser }) => {
                    const time = new Date().toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' })
                    return (
                      <div key={city} className="flex items-center gap-1.5">
                        <span className="text-xs font-bold tabular-nums" style={{ color: isUser ? '#F59E0B' : '#FFFFFF' }}>{time}</span>
                        <span className="text-[10px]" style={{ color: isUser ? '#F59E0B' : '#6B7280' }}>{city}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="text-[9px] mt-1" style={{ color: '#4B5563' }}>World Clock</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div className="border-b overflow-x-auto scrollbar-none" style={{ backgroundColor: '#0D0E14', borderColor: '#1F2937' }}>
        <div className="flex items-center gap-0 min-w-max px-2">
          {/* Getting Started tab with badge */}
          <button onClick={() => setDashTab('gettingstarted')}
            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap"
            style={{ borderBottomColor: dashTab === 'gettingstarted' ? '#7C3AED' : 'transparent', color: dashTab === 'gettingstarted' ? '#7C3AED' : '#6B7280', backgroundColor: dashTab === 'gettingstarted' ? 'rgba(124,58,237,0.05)' : 'transparent' }}>
            <span className="text-base">🚀</span>Getting Started
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#EF4444', color: '#fff' }}>11</span>
          </button>
          {([
            { id:'today' as const,      label:'Today',       icon:'🏠' },
            { id:'quickwins' as const,  label:'Quick Wins',  icon:'⚡' },
            { id:'dailytasks' as const, label:'Daily Tasks', icon:'✅' },
            { id:'insights' as const,   label:'Insights',    icon:'📊' },
            { id:'dontmiss' as const,   label:"Don't Miss",  icon:'🔴' },
            { id:'team' as const,       label:'Team',        icon:'👥' },
          ]).filter(t => !roleConfig.hiddenTabs.includes(t.id)).map(t => (
            <button key={t.id} onClick={() => setDashTab(t.id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap"
              style={{ borderBottomColor: dashTab === t.id ? '#7C3AED' : 'transparent', color: dashTab === t.id ? '#7C3AED' : '#6B7280', backgroundColor: dashTab === t.id ? 'rgba(124,58,237,0.05)' : 'transparent' }}>
              <span className="text-base">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── GETTING STARTED TAB — Interactive 10-step tour ── */}
      {dashTab === 'gettingstarted' && (() => {
        const TOUR_STEPS = [
          { n:1, label:'Your tennis OS, fully connected', icon:'🎾', title:'Your tennis OS, fully connected', description:'One portal that replaces the 6 tools you probably use right now. Rankings, GPS, sponsors, travel, match prep, and your team — all here, all connected, all talking to each other.', preview:'dashboard_overview' },
          { n:2, label:'Start every day knowing everything', icon:'🌅', title:'Start every day knowing everything', description:'Your AI morning briefing reads your headlines aloud — messages, schedule, match prep, sponsor deadlines, ranking updates. Ready in 60 seconds. Press play.', preview:'morning_briefing' },
          { n:3, label:'Every action, one click away', icon:'⚡', title:'Every action, one click away', description:'16 quick actions on your dashboard — book a flight, order strings, file an injury, generate a press statement, send your agent a weekly brief. All in under 60 seconds.', preview:'quick_actions' },
          { n:4, label:'GPS, rankings, and performance', icon:'📊', title:'Data that actually makes sense', description:'Your ATP ranking, Race to Turin, serve percentages, break point conversion, clay win rate — all in one place. Connect Catapult or STATSports for live GPS load data.', preview:'performance' },
          { n:5, label:'Your team, front and centre', icon:'👥', title:'Your team, front and centre', description:"Coach, physio, agent, nutritionist, stringer — all in one hub. See who's available today, what they're working on, and contact them directly.", preview:'team' },
          { n:6, label:'AI that actually helps you win', icon:'🤖', title:'AI that actually helps you win', description:"Match Prep AI searches the web for your opponent's recent stats, tendencies and weaknesses — then generates a tactical brief in 30 seconds. Real data, real insights.", preview:'match_prep' },
          { n:7, label:'Travel sorted in 60 seconds', icon:'✈️', title:'Travel sorted in 60 seconds', description:'Smart Flight Finder searches BA, easyJet, Ryanair, Air France and more simultaneously — scores each flight and sends a booking email to your agent in one tap.', preview:'travel' },
          { n:8, label:'Sponsors managed automatically', icon:'🤝', title:'Sponsors managed automatically', description:"AI generates authentic sponsor posts in your voice — right tone, right platform, right hashtags. Tracks obligations, content calendar and renewal dates so nothing slips.", preview:'sponsor' },
          { n:9, label:'Nothing falls through the cracks', icon:'🔴', title:'Nothing falls through the cracks', description:"Don't Miss flags your most critical items — wildcard deadlines, medical flags, contract renewals, sponsor obligations. Sorted by urgency. Dismissable when done.", preview:'dontmiss' },
          { n:10, label:'Unlock GPS & Video Intelligence', icon:'🛰️', title:'Unlock GPS & Video Intelligence', description:'Connect SwingVision for shot tracking and AI video clips. Pair with your Lumio GPS Tracker to get court heatmaps, movement load scores and an AI coaching brief generated automatically at the end of every session and set.', preview:'gps_video' },
          { n:11, label:"You've seen enough — let's go", icon:'🚀', title:"You've seen enough. Let's go.", description:'Your portal is ready. Every section is live with demo data. Explore freely — or sign up for your 3-month free trial to connect your real ATP data, Gmail, calendar and GPS.', preview:'cta' },
        ]
        const step = TOUR_STEPS[tourStep]
        return (
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 mr-4">
              <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: brandPrimary }}>STEP {tourStep + 1} OF {TOUR_STEPS.length}</div>
              <div className="w-full bg-gray-800 rounded-full h-1"><div className="h-1 rounded-full transition-all duration-500" style={{ width: `${((tourStep + 1) / TOUR_STEPS.length) * 100}%`, backgroundColor: brandPrimary }} /></div>
            </div>
            <button onClick={() => { localStorage.setItem('tennis_getting_started_seen', 'true'); setDashTab('today') }} className="text-sm flex-shrink-0" style={{ color: '#4B5563' }}>Skip tour →</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              {TOUR_STEPS.map((s, i) => (
                <button key={s.n} onClick={() => setTourStep(i)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all" style={{ backgroundColor: tourStep === i ? 'rgba(14,165,233,0.1)' : 'transparent', border: tourStep === i ? '1px solid rgba(14,165,233,0.3)' : '1px solid transparent' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: i < tourStep ? '#22C55E' : tourStep === i ? '#0ea5e9' : 'rgba(255,255,255,0.05)', color: i <= tourStep ? '#fff' : '#4B5563' }}>{i < tourStep ? '✓' : s.n}</div>
                  <span className="text-sm" style={{ color: tourStep === i ? '#F9FAFB' : '#6B7280' }}>{s.label}</span>
                </button>
              ))}
            </div>
            <div className="lg:col-span-2">
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minHeight: 480 }}>
                <div className="p-6">
                  <div className="text-4xl mb-3">{step.icon}</div>
                  <h2 className="text-xl font-black text-white mb-2">{step.title}</h2>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>{step.description}</p>

                  {step.preview === 'dashboard_overview' && (<><div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)' }}><div><div className="text-xs font-bold text-white">Good morning, {firstName} 👋</div><div className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>Today: Match vs Vega · 13:30 Court 4 · Monte-Carlo</div></div><div className="grid grid-cols-4 gap-2">{[{ icon:'📊', v:`#${player.ranking ?? 67}`, label:'ATP Rank', c:'#0ea5e9' },{ icon:'✅', v:'Match Today', label:'Schedule', c:'#22C55E' },{ icon:'🔴', v:'2 Urgent', label:'Messages', c:'#EF4444' },{ icon:'💰', v:'£387k', label:'Prize YTD', c:'#F59E0B' }].map((s, i) => (<div key={i} className="rounded-lg p-2 text-center" style={{ backgroundColor: '#0a0c14' }}><div className="text-lg">{s.icon}</div><div className="text-xs font-black mt-0.5" style={{ color: s.c }}>{s.v}</div><div className="text-[9px] mt-0.5" style={{ color: '#4B5563' }}>{s.label}</div></div>))}</div><div className="text-[10px] text-center" style={{ color: '#374151' }}>Powered by ATP API · Gmail · Google Calendar · Catapult GPS</div></div>
                  {/* Brand Colours — only in step 1 detail */}
                  <div className="mt-4 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>Brand Colours</div>
                    <p className="text-xs" style={{ color: '#6B7280' }}>Use your club or personal brand colours. Primary fills buttons and accents, secondary is your text colour.</p>
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="text-xs block mb-1" style={{ color: '#9CA3AF' }}>Primary</label>
                        <input type="color" value={brandPrimary} onChange={e => { setBrandPrimary(e.target.value); localStorage.setItem('lumio_tennis_brand_primary', e.target.value) }}
                          className="w-12 h-8 rounded cursor-pointer" style={{ border: '1px solid #374151' }} />
                      </div>
                      <div>
                        <label className="text-xs block mb-1" style={{ color: '#9CA3AF' }}>Secondary</label>
                        <input type="color" value={brandSecondary} onChange={e => { setBrandSecondary(e.target.value); localStorage.setItem('lumio_tennis_brand_secondary', e.target.value) }}
                          className="w-12 h-8 rounded cursor-pointer" style={{ border: '1px solid #374151' }} />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs block mb-1" style={{ color: '#9CA3AF' }}>Preview</label>
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg px-4 py-1.5 text-xs font-semibold" style={{ backgroundColor: brandPrimary, color: brandSecondary }}>Button preview</div>
                          <div className="rounded-lg px-4 py-1.5 text-xs font-semibold" style={{ backgroundColor: `${brandPrimary}26`, color: brandPrimary, border: `1px solid ${brandPrimary}4d` }}>Outline preview</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </>)}

                  {step.preview === 'morning_briefing' && (<div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}><div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#0a0c14', borderBottom: '1px solid #1F2937' }}><div className="flex items-center gap-2"><span>🌅</span><span className="text-sm font-bold text-white">Morning Roundup</span></div><span className="text-[10px]" style={{ color: '#6B7280' }}>Since you were last here</span></div>{[{ icon:'📞', label:'Agent Messages', count:2, urgent:false, color:'#8B5CF6' },{ icon:'🏆', label:'Tournament Desk', count:3, urgent:true, color:'#0ea5e9' },{ icon:'📱', label:'Media & Sponsor', count:4, urgent:false, color:'#F59E0B' },{ icon:'⚕️', label:'Physio & Medical', count:1, urgent:true, color:'#EF4444' }].map((ch, i) => (<div key={i} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid #1F2937', backgroundColor: '#111318' }}><div className="flex items-center gap-2"><span>{ch.icon}</span><span className="text-xs text-white">{ch.label}</span>{ch.urgent && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>Urgent</span>}</div><span className="text-sm font-bold" style={{ color: ch.color }}>{ch.count}</span></div>))}</div>)}

                  {step.preview === 'quick_actions' && (<div className="space-y-3"><div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4B5563' }}>Quick actions</div><div className="flex flex-wrap gap-2">{[{ icon:'✈️', label:'Smart Flights', color:'#0ea5e9', hot:true },{ icon:'🎾', label:'Match Prep AI', color:'#22C55E', hot:true },{ icon:'📱', label:'Sponsor Post', color:'#F59E0B', hot:false },{ icon:'📣', label:'Press Statement', color:'#8B5CF6', hot:false },{ icon:'💼', label:'Agent Brief', color:'#F59E0B', hot:true },{ icon:'🎯', label:'Wildcard Request', color:'#EF4444', hot:false },{ icon:'💊', label:'Log Injury', color:'#EF4444', hot:false },{ icon:'⏱️', label:'Warm-up Timer', color:'#F59E0B', hot:false }].map((a, i) => (<div key={i} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold relative" style={{ background: a.hot ? `${a.color}18` : '#111318', border: a.hot ? `1px solid ${a.color}50` : '1px solid #1F2937', color: a.hot ? a.color : '#9CA3AF' }}><span>{a.icon}</span>{a.label}{a.hot && <span className="absolute -top-1 -right-1 text-[8px] px-1 rounded-full font-black" style={{ backgroundColor: a.color, color: '#fff' }}>AI</span>}</div>))}</div><div className="text-xs p-3 rounded-xl" style={{ backgroundColor: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)', color: '#93C5FD' }}>💡 Smart Flights searches 8+ airlines simultaneously — you shouldn&apos;t be able to find cheaper on Google.</div></div>)}

                  {step.preview === 'performance' && (<div className="space-y-3"><div className="grid grid-cols-2 gap-3">{[{ label:'ATP Ranking', value:`#${player.ranking ?? 67}`, sub:'↑2 this week', color:'#0ea5e9' },{ label:'Race to Turin', value:`#${player.race_ranking ?? 54}`, sub:'Top 8 qualifies', color:'#22C55E' },{ label:'Clay win rate', value:'68%', sub:'Above ATP avg', color:'#15803D' },{ label:'First serve %', value:'64%', sub:'↑6% last 5 matches', color:'#F59E0B' }].map((s, i) => (<div key={i} className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}><div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div><div><div className="text-xs font-bold text-white">{s.label}</div><div className="text-[10px]" style={{ color: '#6B7280' }}>{s.sub}</div></div></div>))}</div><div className="rounded-xl p-3 text-xs" style={{ backgroundColor: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', color: '#93C5FD' }}>🔌 Connect Catapult OpenField or STATSports Sonra in Settings for live GPS load, ACWR and heatmaps.</div></div>)}

                  {step.preview === 'team' && (<div className="grid grid-cols-2 gap-3">{[{ initials:'CM', name:'Carlos Mendez', role:'Head Coach', status:'Match notes ready', color:'#22C55E' },{ initials:'SL', name:'Dr Sarah Lee', role:'Physiotherapist', status:'12:30 treatment', color:'#EF4444' },{ initials:'JW', name:'James Wright', role:'Agent', status:'3 inquiries pending', color:'#F59E0B' },{ initials:'TE', name:'Tom Ellis', role:'Stringer', status:'11:45 confirmed', color:'#0ea5e9' }].map((m, i) => (<div key={i} className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}><div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${m.color}20`, border: `1px solid ${m.color}40`, color: m.color }}>{m.initials}</div><div className="min-w-0"><div className="text-xs font-bold text-white truncate">{m.name}</div><div className="text-[10px]" style={{ color: m.color }}>{m.role}</div><div className="text-[10px] truncate" style={{ color: '#4B5563' }}>{m.status}</div></div><div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#22C55E' }} /></div>))}</div>)}

                  {step.preview === 'match_prep' && (<div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(34,197,94,0.3)' }}><div className="px-4 py-3" style={{ backgroundColor: 'rgba(34,197,94,0.08)', borderBottom: '1px solid rgba(34,197,94,0.2)' }}><div className="text-xs font-bold" style={{ color: '#22C55E' }}>🎾 Match Prep AI — C. Vega · Clay</div></div><div className="p-4 text-xs space-y-2" style={{ backgroundColor: '#111318', color: '#D1D5DB' }}>{['🎯 SERVE PATTERNS: 68% wide on deuce court, 71% body on ad court. Second serve: kick to backhand.','🔄 RETURN GAME: Positions 2 steps left of centre. Strong forehand return — attack his BH side.','⚡ TACTICAL: Lead with inside-out FH. Force him wide, attack with DTL BH. Avoid extended rallies.','📊 H2H: 3–1 in your favour. Won last 3 on clay. He struggles when behind early.'].map((line, i) => (<div key={i} className="py-1.5" style={{ borderBottom: i < 3 ? '1px solid #1F2937' : 'none' }}>{line}</div>))}</div><div className="px-4 py-2 text-[10px]" style={{ backgroundColor: '#0a0c14', color: '#4B5563' }}>Generated using web_search · ATP data · real-time opponent stats</div></div>)}

                  {step.preview === 'travel' && (<div className="space-y-2"><div className="text-xs font-bold mb-2" style={{ color: '#4B5563' }}>✈️ LHR → MAD · 26 Apr · Business · 2 pax</div>{[{ airline:'British Airways', dep:'07:20', arr:'10:35', dur:'2h15m', stops:'Direct', price:312, score:96, badge:'Best value', badgeColor:'#0ea5e9' },{ airline:'easyJet', dep:'06:05', arr:'09:20', dur:'2h15m', stops:'Direct', price:187, score:88, badge:'Cheapest', badgeColor:'#22C55E' },{ airline:'Vueling', dep:'11:30', arr:'14:45', dur:'2h15m', stops:'Direct', price:224, score:85, badge:null, badgeColor:'' }].map((f, i) => (<div key={i} className="rounded-xl p-3 flex items-center justify-between" style={{ backgroundColor: i === 0 ? 'rgba(14,165,233,0.08)' : '#111318', border: i === 0 ? '1px solid rgba(14,165,233,0.3)' : '1px solid #1F2937' }}><div><div className="flex items-center gap-2"><span className="text-xs font-bold text-white">{f.airline}</span>{f.badge && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: f.badgeColor }}>{f.badge}</span>}</div><div className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{f.dep} → {f.arr} · {f.dur} · {f.stops}</div></div><div className="text-right"><div className="text-sm font-black text-white">£{f.price * 2}</div><div className="text-[10px]" style={{ color: '#22C55E' }}>Score {f.score}/100</div></div></div>))}<div className="text-[10px] text-center mt-1" style={{ color: '#374151' }}>AI searched BA, easyJet, Ryanair, Vueling, Air France + more</div></div>)}

                  {step.preview === 'sponsor' && (<div className="space-y-3"><div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid rgba(245,158,11,0.3)' }}><div className="text-xs font-bold mb-2" style={{ color: '#F59E0B' }}>📱 AI-generated · Meridian Watches · Instagram · Professional</div><div className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>&ldquo;Court 4, Monte-Carlo. Match day. ⌚ When every second matters — so does the detail. Grateful for the support @Meridian Watches. Let&apos;s go. 🎾&rdquo;<br /><br /><span style={{ color: '#4B5563' }}>#Meridian WatchesAmbassador #MonteCarlo #ATPTour #Tennis #LumioTennis</span></div></div><div className="grid grid-cols-3 gap-2">{[{ label:'Meridian Watches', due:'Renewal 47d', status:'⚠️ Due', color:'#F59E0B' },{ label:'Apex Performance', due:'Post today', status:'🔴 Urgent', color:'#EF4444' },{ label:'Apex Performance', due:'2 posts', status:'⏳ Pending', color:'#6B7280' }].map((s, i) => (<div key={i} className="rounded-xl p-2.5 text-center" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}><div className="text-xs font-bold text-white">{s.label}</div><div className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{s.due}</div><div className="text-[9px] mt-1 font-bold" style={{ color: s.color }}>{s.status}</div></div>))}</div></div>)}

                  {step.preview === 'dontmiss' && (<div className="space-y-2">{[{ urgency:'CRITICAL', item:'Match vs C. Vega — 13:30 Court 4. Confirm court change.', color:'#EF4444', bg:'rgba(239,68,68,0.15)' },{ urgency:'TODAY', item:'Apex Performance kit photo due before 12:00. Carlos waiting.', color:'#F59E0B', bg:'rgba(245,158,11,0.1)' },{ urgency:'TODAY', item:'Hamburg wildcard decision — deadline 5pm. Call agent first.', color:'#F59E0B', bg:'rgba(245,158,11,0.1)' },{ urgency:'47 DAYS', item:'Meridian Watches sponsorship renewal. £240k deal on table.', color:'#6B7280', bg:'rgba(107,114,128,0.08)' }].map((d, i) => (<div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ backgroundColor: '#111318', border: `1px solid ${d.bg}` }}><span className="text-[10px] font-black px-2 py-0.5 rounded flex-shrink-0 mt-0.5" style={{ backgroundColor: d.bg, color: d.color }}>{d.urgency}</span><span className="text-xs" style={{ color: '#D1D5DB' }}>{d.item}</span></div>))}</div>)}

                  {step.preview === 'gps_video' && (<div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl p-4" style={{ backgroundColor: '#0a0c14', border: '1px solid rgba(14,165,233,0.2)' }}>
                        <div className="text-2xl mb-2">🎾</div>
                        <div className="text-sm font-bold text-white mb-1">SwingVision</div>
                        <div className="text-[10px] mb-3" style={{ color: '#6B7280' }}>AI shot tracking · video clips · serve analysis</div>
                        <button className="w-full py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(14,165,233,0.15)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.3)' }}>Connect SwingVision</button>
                      </div>
                      <div className="rounded-xl p-4" style={{ backgroundColor: '#0a0c14', border: '1px solid rgba(14,165,233,0.2)' }}>
                        <div className="text-2xl mb-2">📡</div>
                        <div className="text-sm font-bold text-white mb-1">Lumio GPS Tracker</div>
                        <div className="text-[10px] mb-3" style={{ color: '#6B7280' }}>Court heatmaps · sprint load · AI coaching brief</div>
                        <button onClick={() => setShowGpsModal(true)} className="w-full py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#0ea5e9', color: '#fff' }}>Order Lumio GPS Tracker →</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[{ icon:'🗺️', label:'Court heatmaps' },{ icon:'🏃', label:'Sprint load data' },{ icon:'🤖', label:'AI session brief' },{ icon:'📹', label:'Shot-by-shot clips' },{ icon:'📊', label:'Serve speed tracking' },{ icon:'💚', label:'Recovery scores' }].map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px] rounded-lg p-2" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                          <span>{f.icon}</span><span style={{ color: '#9CA3AF' }}>{f.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>)}

                  {step.preview === 'cta' && (<div className="space-y-4"><div className="grid grid-cols-2 gap-3">{[{ icon:'🎾', label:'Live ATP rankings', color:'#0ea5e9' },{ icon:'📬', label:'Gmail + Outlook sync', color:'#22C55E' },{ icon:'📡', label:'GPS load tracking', color:'#F59E0B' },{ icon:'🤖', label:'AI for every workflow', color:'#8B5CF6' },{ icon:'✈️', label:'Smart travel booking', color:'#0ea5e9' },{ icon:'🤝', label:'Sponsor management', color:'#F59E0B' }].map((f, i) => (<div key={i} className="flex items-center gap-2 text-xs rounded-xl p-2.5" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}><span className="text-base">{f.icon}</span><span style={{ color: f.color }}>{f.label}</span></div>))}</div><div className="rounded-xl p-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(0,0,0,0.4))', border: '1px solid rgba(14,165,233,0.4)' }}><div className="text-sm font-bold text-white mb-1">3-month free trial — no card required</div><div className="text-xs mb-3" style={{ color: '#6B7280' }}>Connect your real data in under 10 minutes. Cancel anytime.</div><a href="/pricing-sports" className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#0ea5e9' }}>Start free trial →</a></div></div>)}
                </div>

                <div className="flex items-center justify-between px-6 pb-6 pt-2" style={{ borderTop: '1px solid #1F2937' }}>
                  <button onClick={() => setTourStep(Math.max(0, tourStep - 1))} disabled={tourStep === 0} className="px-4 py-2 rounded-xl text-sm transition-all" style={{ backgroundColor: tourStep === 0 ? 'transparent' : '#1F2937', color: tourStep === 0 ? '#374151' : '#9CA3AF' }}>← Back</button>
                  <span className="text-xs" style={{ color: '#4B5563' }}>{tourStep + 1} / {TOUR_STEPS.length}</span>
                  {tourStep < TOUR_STEPS.length - 1 ? (
                    <button onClick={() => setTourStep(tourStep + 1)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#0ea5e9' }}>Next →</button>
                  ) : (
                    <button onClick={() => { localStorage.setItem('tennis_getting_started_seen', 'true'); setDashTab('today') }} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#22C55E' }}>Let&apos;s go 🚀</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        )
      })()}

      {/* ── TODAY TAB ── */}
      {dashTab === 'today' && (
        <div className="pt-4 space-y-6">
          {/* Quick Actions — football pro bar style */}
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 mb-3" style={{ backgroundColor: '#0D0E14' }}>
            <span className="text-xs font-semibold shrink-0 mr-1 w-full mb-1" style={{ color: '#4B5563' }}>Quick actions</span>
            {[
              { id:'sendmessage',   label:'Send Message',       icon:'📨', hot:false },
              { id:'socialmedia',   label:'Social Media',       icon:'📱', hot:true  },
              { id:'flights',       label:'Smart Flights',      icon:'✈️', hot:true  },
              { id:'hotel',         label:'Find Hotel',         icon:'🏨', hot:false },
              { id:'matchprep',     label:'Match Prep AI',      icon:'🎾', hot:true  },
              { id:'practicecourt', label:'Book Practice Court',icon:'🏟️', hot:false },
              { id:'warmup',        label:'Warm-up Timer',      icon:'⏱️', hot:false },
              { id:'sponsor',       label:'Sponsor Post',       icon:'📱', hot:false },
              { id:'press',         label:'Press Statement',    icon:'📣', hot:false },
              { id:'ranking',       label:'Ranking Simulator',  icon:'📊', hot:false },
              { id:'wildcard',      label:'Wildcard Request',   icon:'🎯', hot:false },
              { id:'agentbrief',    label:'Agent Brief',        icon:'💼', hot:true  },
              { id:'entries',       label:'Entry Manager',      icon:'🏆', hot:false },
              { id:'injury',        label:'Log Injury',         icon:'💊', hot:false },
              { id:'expense',       label:'Log Expense',        icon:'🧾', hot:false },
              { id:'strings',       label:'String Order',       icon:'🎵', hot:false },
              { id:'visa',          label:'Visa Check',         icon:'🌍', hot:false },
              { id:'notes',         label:'Match Notes',        icon:'📝', hot:false },
            ].map((a) => (
              <button key={a.id}
                onClick={() => onOpenModal(a.id)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap shrink-0"
                style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }}>
                <span>{a.icon}</span>
                {a.label}
                {a.hot && <span className="text-[9px] font-black px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>AI</span>}
              </button>
            ))}
          </div>

          {/* 3-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* LEFT: Morning Roundup — expandable like football */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
                <div className="flex items-center gap-2">
                  <span>🌅</span>
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Morning Roundup</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => { setRoundupOrder([]); localStorage.removeItem('lumio_tennis_roundup_order') }} className="text-[10px] hover:underline" style={{ color: '#4B5563' }}>Reset order</button>
                  <span className="text-xs" style={{ color: '#6B7280' }}>Since you were last here</span>
                </div>
              </div>
              <div>
                {(() => {
                  const filtered = roleConfig.roundupChannels === 'all' ? ROUNDUP_ITEMS : ROUNDUP_ITEMS.filter(ch => (roleConfig.roundupChannels as string[]).includes(ch.id))
                  const sorted = roundupOrder.length > 0 ? [...filtered].sort((a, b) => { const ai = roundupOrder.indexOf(a.id); const bi = roundupOrder.indexOf(b.id); return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) }) : filtered
                  return sorted.map((ch, idx) => {
                  const isOpen = expandedChannel === ch.id
                  return (
                    <div key={ch.id}
                      draggable
                      onDragStart={() => setDragIdx(idx)}
                      onDragEnter={() => setDragOverIdx(idx)}
                      onDragOver={e => e.preventDefault()}
                      onDragEnd={() => {
                        if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
                          const reordered = [...sorted]; const [moved] = reordered.splice(dragIdx, 1); reordered.splice(dragOverIdx, 0, moved)
                          const newOrder = reordered.map(c => c.id); setRoundupOrder(newOrder); localStorage.setItem('lumio_tennis_roundup_order', JSON.stringify(newOrder))
                        }
                        setDragIdx(null); setDragOverIdx(null)
                      }}
                      style={{ borderBottom: '1px solid #1F2937', borderTop: dragOverIdx === idx ? '2px solid #0ea5e9' : 'none', borderLeft: `4px solid ${ch.color}`, backgroundColor: `${ch.color}22`, borderRadius: '8px', marginBottom: '6px', opacity: dragIdx === idx ? 0.5 : 1, cursor: 'grab' }}>
                      <button onClick={() => setExpandedChannel(isOpen ? null : ch.id)}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-all hover:bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 text-sm cursor-grab opacity-0 group-hover:opacity-40 hover:opacity-100 transition-opacity" style={{ opacity: 0.3 }}>⠿</span>
                          <span className="text-base" style={{ filter: `drop-shadow(0 0 4px ${ch.color})` }}>{ch.icon}</span>
                          <span className="text-sm" style={{ color: ch.color, fontWeight: 600, fontSize: '15px' }}>{ch.label}</span>
                          {ch.urgent && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>Urgent</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm" style={{ color: ch.color, fontWeight: 700 }}>{ch.count}</span>
                          <span className="text-xs" style={{ color: '#6B7280' }}>{isOpen ? '▲' : '▼'}</span>
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-3 space-y-2">
                          {ch.messages.map(msg => (
                            <div key={msg.id} className="rounded-lg p-3" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: ch.color + '22', color: ch.color }}>
                                    {msg.from.split(' ').map(w => w[0]).join('').slice(0,2)}
                                  </div>
                                  <span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{msg.from}</span>
                                </div>
                                <span className="text-[10px] flex-shrink-0" style={{ color: '#6B7280' }}>{msg.time}</span>
                              </div>
                              <p className="text-xs leading-relaxed mb-2" style={{ color: '#9CA3AF' }}>{msg.text}</p>
                              {repliedTo.includes(msg.id) ? (
                                <span className="text-[10px]" style={{ color: '#0ea5e9' }}>Replied ✓</span>
                              ) : replyingTo === msg.id ? (
                                <div className="mt-2">
                                  <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write your reply..." rows={2}
                                    className="w-full text-xs rounded-lg p-2 resize-none" style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB', outline: 'none' }} />
                                  <div className="flex gap-2 mt-1.5">
                                    <button onClick={() => { setRepliedTo(prev => [...prev, msg.id]); setReplyingTo(null); setReplyText(''); setReplyToast(true); setTimeout(() => setReplyToast(false), 2000) }}
                                      className="text-[10px] px-3 py-1 rounded-lg font-semibold" style={{ backgroundColor: '#0ea5e9', color: '#fff' }}>Send</button>
                                    <button onClick={() => { setReplyingTo(null); setReplyText('') }}
                                      className="text-[10px] px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF' }}>Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button onClick={() => setReplyingTo(msg.id)} className="text-[10px] px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(14,165,233,0.15)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.3)' }}>Reply</button>
                                  <button className="text-[10px] px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.1)' }}>Forward</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })})()}
              </div>
              {replyToast && <div className="px-5 py-2 text-[10px] font-medium" style={{ color: '#22C55E' }}>Reply sent ✓</div>}
            </div>

            {/* MIDDLE: Today's match + schedule */}
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid rgba(14,165,233,0.3)' }}>
                <div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#0ea5e9' }}>TODAY&apos;S MATCH &mdash; ATP MONTE-CARLO MASTERS</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 mx-auto mb-1 flex items-center justify-center font-bold text-sm"
                        style={{ borderColor: '#0ea5e9', background: 'rgba(14,165,233,0.15)', color: '#0ea5e9' }}>
                        {(profilePhotoLive || session.photoDataUrl) ? <img src={profilePhotoLive || session.photoDataUrl || ''} alt="" className="w-full h-full object-cover" /> : firstName.slice(0,2).toUpperCase()}
                      </div>
                      <div className="text-xs font-bold text-white">{profileNameLive || session.userName || player.name}</div>
                      <div className="text-[10px]" style={{ color: '#0ea5e9' }}>#{player.ranking ?? 67} ATP</div>
                    </div>
                    <div className="text-center px-3">
                      <div className="text-xl font-black" style={{ color: '#374151' }}>VS</div>
                      <div className="text-[10px] mt-1" style={{ color: '#6B7280' }}>13:00 · Court 4</div>
                      <div className="text-[10px]" style={{ color: '#0ea5e9' }}>Clay · H2H: 3–1</div>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-1" style={{ background: '#1F2937', color: '#9CA3AF' }}>CM</div>
                      <div className="text-xs font-bold text-white">C. Vega</div>
                      <div className="text-[10px]" style={{ color: '#6B7280' }}>#34 ATP</div>
                    </div>
                  </div>
                  <div className="rounded-lg px-3 py-2 text-[10px]" style={{ background: 'rgba(245,158,11,0.08)', color: '#F59E0B' }}>
                    Clay serve avg: 61% (4% below season avg) — focus on kick serve to backhand
                  </div>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Today&apos;s Schedule</p>
                </div>
                <div className="px-5 py-3 space-y-1">
                  {[
                    { id:'s1', time:'07:30', label:'AI Morning Briefing',        highlight:false },
                    { id:'s2', time:'08:30', label:'Physio — right shoulder',    highlight:false },
                    { id:'s3', time:'10:00', label:'Practice — serve patterns',  highlight:false },
                    { id:'s4', time:'11:45', label:'Stringing with Carlos',      highlight:false },
                    { id:'s5', time:'13:00', label:'Match vs C. Vega',       highlight:true  },
                    { id:'s6', time:'15:30', label:'Post-match physio',          highlight:false },
                    { id:'s7', time:'17:00', label:'Coach debrief',              highlight:false },
                  ].map((s) => {
                    const done = completedItems.has(s.id)
                    const cancelled = cancelledItems.has(s.id)
                    return (
                    <div key={s.id} className="group flex items-center gap-3 py-1.5 rounded-lg px-1 -mx-1 transition-colors hover:bg-white/[0.02]">
                      <button onClick={() => !cancelled && toggleScheduleItem(s.id)} className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          borderColor: cancelled ? '#EF4444' : done ? '#22C55E' : s.highlight ? '#0ea5e9' : '#374151',
                          background: cancelled ? 'rgba(239,68,68,0.15)' : done ? 'rgba(34,197,94,0.15)' : s.highlight ? 'rgba(14,165,233,0.1)' : 'transparent',
                        }}>
                        {cancelled ? <span className="text-[8px]" style={{ color: '#EF4444' }}>✕</span> : done ? <span className="text-[8px]" style={{ color: '#22C55E' }}>✓</span> : null}
                      </button>
                      <span className="text-[10px] w-9 flex-shrink-0" style={{ color: '#6B7280' }}>{s.time}</span>
                      <span className="text-xs flex-1" style={{
                        color: cancelled ? '#EF4444' : done ? '#4B5563' : s.highlight ? '#0ea5e9' : '#D1D5DB',
                        textDecoration: cancelled || done ? 'line-through' : 'none',
                        fontWeight: s.highlight ? 600 : 400,
                      }}>{s.label}</span>
                      {!s.highlight && !done && !cancelled && cancelConfirm !== s.id && (
                        <button onClick={() => setCancelConfirm(s.id)} className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#6B7280' }}>Cancel →</button>
                      )}
                      {cancelConfirm === s.id && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px]" style={{ color: '#6B7280' }}>Cancel?</span>
                          <button onClick={() => cancelScheduleItem(s.id, s.label)} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>Send</button>
                          <button onClick={() => setCancelConfirm(null)} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>Dismiss</button>
                        </div>
                      )}
                    </div>
                    )
                  })}
                </div>
              </div>

              {/* Today's Venue */}
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>TODAY&apos;S VENUE</span>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Monte-Carlo Country Club</p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>18&deg;C &middot; Sunny &middot; Court 4 open 10:00</p>
                  </div>
                  <div className="space-y-1.5 pt-1" style={{ borderTop: '1px solid #1F2937' }}>
                    <div className="flex items-center justify-between text-[11px] pt-2">
                      <span style={{ color: '#6B7280' }}>Match time</span>
                      <span className="font-semibold" style={{ color: '#D1D5DB' }}>13:00</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span style={{ color: '#6B7280' }}>Court</span>
                      <span className="font-semibold" style={{ color: '#D1D5DB' }}>Court 4 &middot; Clay</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span style={{ color: '#6B7280' }}>Prize (W)</span>
                      <span className="font-semibold" style={{ color: '#22C55E' }}>&pound;342,000</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span style={{ color: '#6B7280' }}>Prize (L)</span>
                      <span className="font-semibold" style={{ color: '#D1D5DB' }}>&pound;57,000</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span style={{ color: '#6B7280' }}>TV</span>
                      <span className="font-semibold" style={{ color: '#D1D5DB' }}>Apex Tennis Network / Amazon Prime</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Photo frame + AI Morning Summary + AI Key Highlights */}
            <div className="space-y-3">
              {/* Photo frame — live localStorage slideshow */}
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
                  <div className="flex items-center gap-2">
                    <span>📸</span>
                    <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Personal Photo Frame</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {photos.length > 1 && <button onClick={() => setIsPaused(!isPaused)} className="text-[10px]" style={{ color: '#6B7280' }}>{isPaused ? '▶ Play' : '⏸ Pause'}</button>}
                    {photos.length > 0 && <button onClick={() => { setPhotos(prev => prev.filter((_, i) => i !== photoIndex)); setPhotoIndex(0) }} className="text-[10px]" style={{ color: '#6B7280' }}>✕ Remove</button>}
                    {photos.length > 0 && <button onClick={() => { const v = photoFit === 'cover' ? 'contain' : 'cover'; setPhotoFit(v); localStorage.setItem('lumio_tennis_photo_fit', v) }} style={{ background: 'transparent', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', border: 'none' }}>⤢ Fit</button>}
                    <button onClick={() => photoInputRef.current?.click()} disabled={photos.length >= 3} className="text-[10px] font-semibold" style={{ color: photos.length >= 3 ? '#374151' : '#0ea5e9' }} title={photos.length >= 3 ? '3 max' : 'Add photo'}>+ Add</button>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={addPhoto} />
                  </div>
                </div>
                <div className="relative h-40 overflow-hidden" style={{ background: '#0a0c14' }}>
                  {photos.length > 0 ? (
                    <>
                      <img src={photos[photoIndex]} alt="Photo frame" draggable={false} style={{ width: '100%', height: '100%', objectFit: photoFit, objectPosition: 'center' }} />
                      {photos.length > 1 && (
                        <>
                          <button onClick={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center">‹</button>
                          <button onClick={() => setPhotoIndex(i => (i + 1) % photos.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center">›</button>
                        </>
                      )}
                      <div className="absolute bottom-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-black/50 text-white">{photoIndex + 1}/{photos.length}</div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center flex-col gap-1">
                      <div className="text-2xl">🎾</div>
                      <div className="text-[10px]" style={{ color: '#4B5563' }}>Family · Holidays · Inspiration</div>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Morning Summary */}
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} style={{ color: '#8B5CF6' }} />
                    <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{aiSummaryLabel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}>
                      {new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}
                    </span>
                    <ChevronUp size={14} style={{ color: '#6B7280' }} />
                  </div>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {[
                    { type: 'match',    icon: '🎾', text: 'Match today vs C. Vega — 13:00 Court 4. Clay. H2H 3–1 in your favour. Kick serve to his backhand on deuce court.' },
                    { type: 'messages', icon: '📬', text: '2 urgent messages: Tournament Desk moved your court time 30 min (confirm receipt) + Physio flagged shoulder inflammation — see Dr Lee at 12:30.' },
                    { type: 'schedule', icon: '📅', text: 'Today: Practice 10:00 (serve patterns) → Stringing 11:45 → Match 13:00 → Physio 15:30 → Coach debrief 17:00.' },
                    { type: 'sponsor',  icon: '🤝', text: 'Apex Performance post due today — Carlos needs kit photo before 12:00. Reply to agent about Meridian Watches renewal this week.' },
                    { type: 'travel',   icon: '✈️', text: 'Madrid hotel confirmed (NH Eurobuilding, 26 Apr). Roland-Garros apartment deposit due 1 May — travel desk waiting.' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <span className="text-base flex-shrink-0">{item.icon}</span>
                      <span style={{ color: '#D1D5DB' }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Key Highlights */}
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
                  <div className="flex items-center gap-2">
                    <span>⚡</span>
                    <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Performance Intelligence</p>
                  </div>
                  <span className="text-[10px] font-medium cursor-pointer hover:underline" style={{ color: '#0ea5e9' }}>Performance</span>
                </div>
                <div className="px-5 py-4 space-y-2.5">
                  {[
                    { n:1, trend:'↑', color:'#22C55E', text:'Serve % up to 64% in last 5 matches — above season avg (58%). Clay kick serve working.' },
                    { n:2, trend:'⚠', color:'#EF4444', text:'312 ranking points drop off after Monte-Carlo. Win tonight = hold #67. Loss = risk dropping to #71.' },
                    { n:3, trend:'↑', color:'#22C55E', text:'Clay win rate 68% this season — above ATP tour avg (61%). Best surface by 7%.' },
                    { n:4, trend:'→', color:'#0ea5e9', text:'Race to Turin: #54 — top 8 qualifies. Madrid and Roland-Garros are the key points events.' },
                    { n:5, trend:'↓', color:'#F59E0B', text:'Break point conversion 38% — below top-50 avg (44%). Converting break chances is the difference maker.' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <div className="flex items-center gap-1 flex-shrink-0 w-8">
                        <span className="font-bold" style={{ color: '#0ea5e9' }}>{item.n}</span>
                        <span className="text-[10px] font-bold" style={{ color: item.color }}>{item.trend}</span>
                      </div>
                      <span style={{ color: '#D1D5DB' }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK WINS TAB */}
      {dashTab === 'quickwins' && (
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Quick Wins</h3>
              <p className="text-[11px]" style={{ color: '#6B7280' }}>{TENNIS_QUICK_WINS.filter(w => !dismissedWins.has(w.id)).length} actions remaining</p>
            </div>
            {dismissedWins.size > 0 && (
              <span className="text-[10px] px-2 py-1 rounded-full font-bold" style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
                {dismissedWins.size} completed
              </span>
            )}
          </div>
          {TENNIS_QUICK_WINS.filter(w => !dismissedWins.has(w.id)).length === 0 ? (
            <div className="text-center py-12 rounded-xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="text-3xl mb-3">🎉</div>
              <div className="text-sm font-semibold text-white mb-1">All done!</div>
              <div className="text-xs" style={{ color: '#6B7280' }}>You have cleared all your quick wins for today.</div>
            </div>
          ) : (
            TENNIS_QUICK_WINS.filter(w => !dismissedWins.has(w.id)).map((win) => (
              <div key={win.id}
                className="rounded-2xl p-5 transition-all"
                style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: win.impact === 'high' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                          color: win.impact === 'high' ? '#EF4444' : '#F59E0B',
                        }}>{win.impact === 'high' ? 'HIGH IMPACT' : 'MEDIUM IMPACT'}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#0ea5e91a', color: '#38bdf8' }}>⏱ {win.effort}</span>
                      <span className="text-xs" style={{ color: '#6B7280' }}>{win.category}</span>
                    </div>
                    <h3 className="font-bold mb-1" style={{ color: '#F9FAFB' }}>{win.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{win.description}</p>
                    <p className="text-xs mt-2" style={{ color: '#374151' }}>Source: {win.source}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {win.actionSection && (
                      <button onClick={() => onNavigate(win.actionSection!)}
                        className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap"
                        style={{ backgroundColor: '#0ea5e9' }}>
                        {win.action} →
                      </button>
                    )}
                    <button onClick={() => onDismissWin(win.id)}
                      className="px-4 py-2 text-xs rounded-xl"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>
                      Mark done
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          {/* Show completed items */}
          {TENNIS_QUICK_WINS.filter(w => dismissedWins.has(w.id)).length > 0 && (
            <div className="pt-2 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#374151' }}>Completed</div>
              {TENNIS_QUICK_WINS.filter(w => dismissedWins.has(w.id)).map(win => (
                <div key={win.id} className="flex items-center gap-3 rounded-lg px-4 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-xs" style={{ color: '#22C55E' }}>✓</span>
                  <span className="text-xs" style={{ color: '#4B5563', textDecoration: 'line-through' }}>{win.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DAILY TASKS TAB */}
      {dashTab === 'dailytasks' && (
        <div className="pt-4 space-y-3">
          {/* Header + Add Task */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Daily Tasks</h3>
              <p className="text-[11px]" style={{ color: '#6B7280' }}>
                {tasks.filter(t => !taskChecked[t.id]).length} remaining &middot; {Object.values(taskChecked).filter(Boolean).length} done
              </p>
            </div>
            <button onClick={() => setShowAddTask(!showAddTask)}
              className="text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all"
              style={{ backgroundColor: showAddTask ? 'rgba(239,68,68,0.15)' : 'rgba(14,165,233,0.15)', color: showAddTask ? '#EF4444' : '#0ea5e9', border: showAddTask ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(14,165,233,0.3)' }}>
              {showAddTask ? 'Cancel' : '+ Add task'}
            </button>
          </div>
          {/* Add task input */}
          {showAddTask && (
            <div className="flex gap-2 rounded-xl p-3" style={{ backgroundColor: '#111318', border: '1px solid rgba(14,165,233,0.3)' }}>
              <input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder="What needs doing?"
                className="flex-1 text-xs bg-transparent outline-none" style={{ color: '#F9FAFB' }}
                onKeyDown={e => { if (e.key === 'Enter') onAddTask() }} />
              <button onClick={onAddTask} className="text-[11px] px-3 py-1 rounded-lg font-semibold"
                style={{ backgroundColor: '#0ea5e9', color: '#fff' }}>Add</button>
            </div>
          )}
          {/* Filter pills */}
          <div className="flex gap-1.5 pb-1" style={{ overflowX: 'hidden' }}>
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map(f => (
              <button key={f} onClick={() => setTaskFilter(f)}
                className="text-[10px] px-3 py-1 rounded-full font-semibold transition-all whitespace-nowrap"
                style={{
                  background: taskFilter === f ? (f === 'all' ? 'rgba(14,165,233,0.15)' : PRIORITY_STYLES[f]?.bg || 'rgba(14,165,233,0.15)') : 'rgba(255,255,255,0.04)',
                  color: taskFilter === f ? (f === 'all' ? '#0ea5e9' : PRIORITY_STYLES[f]?.color || '#0ea5e9') : '#6B7280',
                  border: taskFilter === f ? `1px solid ${f === 'all' ? 'rgba(14,165,233,0.3)' : PRIORITY_STYLES[f]?.dot + '44' || 'rgba(14,165,233,0.3)'}` : '1px solid transparent',
                }}>
                {f === 'all' ? 'All' : PRIORITY_STYLES[f]?.label || f}
              </button>
            ))}
          </div>
          {/* Task list */}
          {tasks.filter(t => taskFilter === 'all' || t.priority === taskFilter).map(t => {
            const checked = taskChecked[t.id] || false
            const ps = PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.medium
            return (
              <div key={t.id}
                className="rounded-xl p-4 flex items-start gap-4 border transition-all"
                style={{
                  backgroundColor: checked ? 'rgba(255,255,255,0.01)' : '#111318',
                  borderColor: t.priority === 'critical' && !checked ? 'rgba(239,68,68,0.3)' : '#1F2937',
                  opacity: checked ? 0.55 : 1,
                }}>
                <button onClick={() => onToggleTask(t.id)}
                  className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                  style={{
                    borderColor: checked ? '#22C55E' : '#4B5563',
                    background: checked ? 'rgba(34,197,94,0.15)' : 'transparent',
                  }}>
                  {checked && <span className="text-[9px] font-bold" style={{ color: '#22C55E' }}>✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: ps.bg, color: ps.color }}>
                      {ps.label}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{t.category}</span>
                    {t.linkedWorkflow && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(108,63,197,0.1)', color: '#A78BFA' }}>🔄 {t.linkedWorkflow}</span>
                    )}
                    <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>{t.overdue ? '⚠️ Overdue' : t.due}</span>
                  </div>
                  <h4 className="font-semibold text-sm" style={{ color: checked ? '#4B5563' : '#E5E7EB', textDecoration: checked ? 'line-through' : 'none' }}>{t.title}</h4>
                  {!checked && t.description && (
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: '#6B7280' }}>{t.description}</p>
                  )}
                  {t.overdue && !checked && (
                    <span className="inline-block text-xs mt-2 px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>OVERDUE</span>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {!checked && t.action && (
                    <>
                      <button
                        onClick={() => {
                          if (t.actionModal) onOpenModal(t.actionModal)
                          else if (t.actionSection) onNavigate(t.actionSection)
                        }}
                        className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap"
                        style={{ backgroundColor: '#0ea5e9' }}>
                        {t.action} →
                      </button>
                      <button
                        onClick={() => onToggleTask(t.id)}
                        className="px-4 py-2 text-xs rounded-xl whitespace-nowrap"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>
                        Mark done
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* INSIGHTS TAB */}
      {dashTab === 'insights' && (
        <div className="pt-4 space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'ATP Ranking', value: `#${player.ranking}`, sub: `Career high: #${player.career_high}`, color: '#8B5CF6', icon: '📊' },
              { label: 'Race Standing', value: `#${player.race_ranking}`, sub: `${player.ranking_points.toLocaleString()} pts`, color: '#0ea5e9', icon: '🏁' },
              { label: 'Clay Win Rate', value: '68%', sub: 'Above ATP avg (61%)', color: '#22C55E', icon: '🏟️' },
              { label: 'Season Earnings', value: '£387k', sub: '+12% vs projection', color: '#F59E0B', icon: '💰' },
              { label: 'Form', value: `${player.season_wins}W-${player.season_losses}L`, sub: `${Math.round(player.season_wins/(player.season_wins+player.season_losses)*100)}% win rate`, color: '#EC4899', icon: '🔥' },
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
              { type: 'ALERT', icon: '⚠️', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', title: '312 ranking points expiring', desc: 'After Monte-Carlo this week. A QF exit loses 180 pts from last year. Win tonight to defend and push to #58.', action: 'View ranking forecast →', section: 'performance' },
              { type: 'OPPORTUNITY', icon: '💡', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', title: 'Crown Wagers ambassador offer', desc: 'New approach via James Wright — £85k/yr. No competing betting sponsor. Decision needed by end of month.', action: 'View pipeline →', section: 'pipeline' },
              { type: 'TREND', icon: '📈', color: '#22C55E', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', title: 'First serve % up 6 points', desc: 'Last 5 matches: 64% vs 58% season average. Kick serve improvement on clay is working — continue focus in practice.', action: 'View serve stats →', section: 'performance' },
              { type: 'ACHIEVEMENT', icon: '🏆', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', title: 'Monte-Carlo QF — best clay result', desc: 'First Masters QF on clay. Beating Sutton (#14) in R3 was a statement win. Media interest is high.', action: 'View match report →', section: 'performance' },
            ].map((tile, i) => (
              <div key={i} className="rounded-xl p-5" style={{ backgroundColor: tile.bg, border: `1px solid ${tile.border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{tile.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: tile.color }}>{tile.type}</span>
                </div>
                <p className="text-sm font-semibold text-white mb-1">{tile.title}</p>
                <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>{tile.desc}</p>
                <button onClick={() => onNavigate(tile.section)}
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
                { label: '1st Serve %', value: '64%', trend: '↑ 6%', trendColor: '#22C55E' },
                { label: 'Break Points Saved', value: '71%', trend: '↑ 3%', trendColor: '#22C55E' },
                { label: 'Aces / Match', value: '8.4', trend: '↑ 1.2', trendColor: '#22C55E' },
                { label: 'Double Faults', value: '2.1', trend: '↓ 0.8', trendColor: '#22C55E' },
                { label: 'Return Points Won', value: '42%', trend: '→ 0%', trendColor: '#6B7280' },
                { label: 'Net Points Won', value: '68%', trend: '↑ 5%', trendColor: '#22C55E' },
                { label: 'Avg Match Duration', value: '1h42m', trend: '↓ 8min', trendColor: '#22C55E' },
                { label: 'Tiebreak Record', value: '4-1', trend: '80%', trendColor: '#0ea5e9' },
              ].map((m, i) => (
                <div key={i} className="rounded-lg p-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="text-[10px] mb-1" style={{ color: '#6B7280' }}>{m.label}</div>
                  <div className="text-lg font-black text-white">{m.value}</div>
                  <div className="text-[10px] font-semibold" style={{ color: m.trendColor }}>{m.trend}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Section */}
          <TennisAISection context="insights" player={player} session={session} />
        </div>
      )}

      {/* DON'T MISS TAB */}
      {dashTab === 'dontmiss' && (() => {
        const DONT_MISS_ITEMS = [
          { id: 'dm-1', urgency: 'CRITICAL', urgencyColor: '#EF4444', urgencyBg: 'rgba(239,68,68,0.12)', category: 'Match', deadline: 'Today 13:30', title: 'Match vs C. Vega — Court 4', desc: 'Monte-Carlo Masters QF. H2H 3-1. Clay court. Your best Masters result on clay.', consequence: 'Miss this and you drop 180 ranking points.', action: 'View match prep →', section: 'matchprep' },
          { id: 'dm-2', urgency: 'TODAY', urgencyColor: '#EF4444', urgencyBg: 'rgba(239,68,68,0.12)', category: 'Sponsor', deadline: 'Before 12:00', title: 'Apex Performance kit photo due', desc: 'Carlos needs the photo for today\'s contractual obligation post.', consequence: 'Breach of sponsor contract — penalty clause.', action: 'Open brief →', section: 'sponsorship' },
          { id: 'dm-3', urgency: 'TODAY', urgencyColor: '#EF4444', urgencyBg: 'rgba(239,68,68,0.12)', category: 'Entries', deadline: 'By 17:00', title: 'Hamburg 500 wildcard — respond today', desc: 'Tournament director needs answer. Clashes with Eastbourne prep week.', consequence: 'Wildcard offer expires. Next opportunity: Winston-Salem (Aug).', action: 'Manage entries →', section: 'entries' },
          { id: 'dm-4', urgency: '47 DAYS', urgencyColor: '#F59E0B', urgencyBg: 'rgba(245,158,11,0.12)', category: 'Commercial', deadline: '25 May', title: 'Meridian Watches sponsorship renewal deadline', desc: 'Agent James Wright has the brief. 3-year deal worth 120k/yr. Competitor interest from TAG Heuer.', consequence: 'Auto-renewal at current terms if not renegotiated.', action: 'View contract →', section: 'sponsorship' },
          { id: 'dm-5', urgency: '1 MAY', urgencyColor: '#6B7280', urgencyBg: 'rgba(107,114,128,0.12)', category: 'Travel', deadline: '1 May', title: 'Roland-Garros apartment deposit', desc: 'Owner requesting deposit. Travel desk has the details. 3-bed apartment near Porte d\'Auteuil.', consequence: 'Apartment released to next tenant. Hotel costs 3x more.', action: 'View travel →', section: 'travel' },
          { id: 'dm-6', urgency: '1 MAY', urgencyColor: '#6B7280', urgencyBg: 'rgba(107,114,128,0.12)', category: 'Commercial', deadline: 'This month', title: '2 Apex Performance posts outstanding from March', desc: 'Apex Performance partnership requires 4 posts per season. 2 overdue. Agent flagged yesterday.', consequence: 'Sponsor satisfaction score drops. Renewal at risk.', action: 'View obligation →', section: 'sponsorship' },
        ]
        const visible = DONT_MISS_ITEMS.filter(d => !dismissedAlerts.has(d.id))
        return (
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-white">Don&apos;t Miss</h3>
                <p className="text-[11px]" style={{ color: '#6B7280' }}>{visible.length} items need attention</p>
              </div>
            </div>
            {visible.length === 0 ? (
              <div className="text-center py-12 rounded-xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="text-3xl mb-3">✅</div>
                <div className="text-sm font-semibold text-white mb-1">All clear</div>
                <div className="text-xs" style={{ color: '#6B7280' }}>No urgent items remaining. Check back later.</div>
              </div>
            ) : (
              visible.map(d => (
                <div key={d.id} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="flex items-start gap-3">
                    <span className="text-[10px] px-2 py-1 rounded font-black flex-shrink-0 mt-0.5"
                      style={{ background: d.urgencyBg, color: d.urgencyColor }}>{d.urgency}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#1F2937', color: '#6B7280' }}>{d.category}</span>
                        <span className="text-[10px]" style={{ color: '#6B7280' }}>Due: {d.deadline}</span>
                      </div>
                      <p className="text-sm font-semibold text-white mb-1">{d.title}</p>
                      <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>{d.desc}</p>
                      <p className="text-[11px] italic mb-3" style={{ color: '#EF4444' }}>If missed: {d.consequence}</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => onNavigate(d.section)}
                          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                          style={{ backgroundColor: '#0ea5e9', color: '#fff' }}>
                          {d.action}
                        </button>
                        <button onClick={() => onDismissAlert(d.id)}
                          className="text-[11px] px-3 py-1.5 rounded-lg transition-all"
                          style={{ border: '1px solid #374151', color: '#6B7280' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#9CA3AF' }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#6B7280' }}>
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )
      })()}

      {/* TEAM TAB */}
      {dashTab === 'team' && (() => {
        const demoStaffPhotos: Record<string, string> = {
          'Carlos Mendez': '/Carlos_Mendez.jpg',
          'Dr Sarah Lee': '/Sarah_Lee.jpg',
          'James Wright': '/Marcus_Webb.jpg',
          'Petra Novak': '/Elena_Russo.jpg',
          'Marcos Silva': '/James_Okafor.jpg',
          'Tom Ellis': '/Rick_Dalton.jpg',
        }
        const TEAM_MEMBERS = [
          { name: 'Carlos Mendez', role: 'Head Coach', initials: 'CM', status: 'Debrief requested — 17:00 today', available: true, location: 'Monte-Carlo', phone: '+34 612 xxx xxx', speciality: 'Tactical & match strategy', rating: 92 },
          { name: 'Dr Sarah Lee', role: 'Physiotherapist', initials: 'SL', status: 'Treatment complete — shoulder OK', available: true, location: 'Monte-Carlo', phone: '+44 7700 xxx xxx', speciality: 'Sports rehabilitation', rating: 95 },
          { name: 'James Wright', role: 'Agent (IMG)', initials: 'JW', status: '3 sponsor inquiries pending', available: true, location: 'London (remote)', phone: '+44 207 xxx xxxx', speciality: 'Commercial & endorsements', rating: 88 },
          { name: 'Petra Novak', role: 'Nutritionist', initials: 'PN', status: 'Clay season plan updated', available: true, location: 'Monte-Carlo', phone: '+385 91 xxx xxxx', speciality: 'Sports nutrition & hydration', rating: 90 },
          { name: 'Marcos Silva', role: 'Sports Psychologist', initials: 'MS', status: 'Session Thursday 14:00', available: false, location: 'Madrid (remote)', phone: '+34 911 xxx xxx', speciality: 'Mental conditioning', rating: 87 },
          { name: 'Tom Ellis', role: 'Stringer', initials: 'TE', status: '11:45 appointment confirmed', available: true, location: 'Monte-Carlo', phone: '+44 7800 xxx xxx', speciality: 'Racket customisation', rating: 91 },
        ]
        return (
          <div className="pt-4 space-y-4">
            {/* Sub-tabs */}
            <div className="flex gap-1 border-b pb-0" style={{ borderColor: '#1F2937', overflowX: 'hidden' }}>
              {([
                { id: 'today' as const, label: 'Team Today', icon: '📍' },
                { id: 'org' as const, label: 'Org Chart', icon: '🏗️' },
                { id: 'info' as const, label: 'Team Info', icon: '📋' },
                { id: 'club' as const, label: 'Club Info', icon: '🏛️' },
              ]).map(t => (
                <button key={t.id} onClick={() => setTeamSubTab(t.id)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap"
                  style={{
                    borderBottomColor: teamSubTab === t.id ? '#0ea5e9' : 'transparent',
                    color: teamSubTab === t.id ? '#38bdf8' : '#6B7280',
                    backgroundColor: teamSubTab === t.id ? '#0ea5e90d' : 'transparent',
                  }}>
                  <span className="text-base">{t.icon}</span>{t.label}
                </button>
              ))}
            </div>

            {/* Team Today */}
            {teamSubTab === 'today' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TEAM_MEMBERS.map((m, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                    {demoStaffPhotos[m.name] ? (
                      <img src={demoStaffPhotos[m.name]} alt={m.name} className="w-10 h-10 rounded-full object-cover object-center flex-shrink-0 border" style={{ borderColor: 'rgba(14,165,233,0.3)' }} />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', color: '#0ea5e9' }}>
                        {m.initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{m.name}</span>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.available ? '#22C55E' : '#374151' }} />
                      </div>
                      <div className="text-[10px]" style={{ color: '#0ea5e9' }}>{m.role}</div>
                      <div className="text-[10px] truncate" style={{ color: '#6B7280' }}>{m.status}</div>
                      <div className="text-[10px]" style={{ color: '#4B5563' }}>📍 {m.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Org Chart */}
            {teamSubTab === 'org' && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#111318', border: '1px solid rgba(14,165,233,0.4)', minWidth: 180 }}>
                    <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-sm font-bold mb-2 overflow-hidden"
                      style={{ background: 'rgba(14,165,233,0.2)', border: '2px solid #0ea5e9', color: '#0ea5e9' }}>
                      {(profilePhotoLive || session.photoDataUrl) ? <img src={profilePhotoLive || session.photoDataUrl || ''} alt="" className="w-full h-full object-cover" /> : (session.userName || firstName || 'AL').slice(0,2).toUpperCase()}
                    </div>
                    <div className="text-sm font-semibold text-white">{profileNameLive || session.userName || player.name}</div>
                    {(() => { const nn = typeof window !== 'undefined' ? localStorage.getItem('lumio_tennis_nickname') : null; return nn ? <div style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic', marginTop: 2 }}>&quot;{nn}&quot;</div> : null })()}
                    <div className="text-[10px]" style={{ color: '#0ea5e9' }}>Player — ATP #{player.ranking}</div>
                  </div>
                </div>
                <div className="flex justify-center"><div className="w-px h-6" style={{ background: '#374151' }} /></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {TEAM_MEMBERS.map((m, i) => (
                    <div key={i} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                      {demoStaffPhotos[m.name] ? (
                        <div className="w-10 h-10 mx-auto rounded-full overflow-hidden border border-slate-500 flex-shrink-0 mb-1.5">
                          <img src={demoStaffPhotos[m.name]} alt={m.name} className="w-full h-full object-cover object-center" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold mb-1.5"
                          style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', color: '#0ea5e9' }}>
                          {m.initials}
                        </div>
                      )}
                      <div className="text-xs font-semibold text-white">{m.name}</div>
                      <div className="text-[10px]" style={{ color: '#0ea5e9' }}>{m.role}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Info */}
            {teamSubTab === 'info' && (
              <div>
                <h2 className="text-sm font-black mb-3" style={{ color: '#F9FAFB' }}>Team Info</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {[
                    { initials:'CM', name:'Carlos Mendez', role:'Head Coach', dept:'Coaching', rating:92, deptColor:'#22C55E', ref:'LUM-001', stats:{TAC:92,MOT:95,STR:88,EXP:97,COM:91,PRE:89}, speciality:'Tactical & match strategy', location:'Monte-Carlo', contact:'+34 612 xxx xxx', available:true },
                    { initials:'SL', name:'Dr Sarah Lee', role:'Physiotherapist', dept:'Medical', rating:95, deptColor:'#EF4444', ref:'LUM-002', stats:{DIA:94,TRT:93,REC:90,PRE:88,CON:92,SPT:86}, speciality:'Sports rehabilitation', location:'Monte-Carlo', contact:'+44 7700 xxx xxx', available:true },
                    { initials:'JW', name:'James Wright', role:'Agent (IMG)', dept:'Commercial', rating:88, deptColor:'#F59E0B', ref:'LUM-003', stats:{NEG:91,NET:89,DEL:88,STR:87,COM:90,INS:85}, speciality:'Commercial & endorsements', location:'London (remote)', contact:'+44 207 xxx xxxx', available:true },
                    { initials:'PN', name:'Petra Novak', role:'Nutritionist', dept:'Support', rating:90, deptColor:'#10B981', ref:'LUM-004', stats:{NUT:92,FUE:88,WGT:85,PER:87,REC:84,SUP:82}, speciality:'Sports nutrition & hydration', location:'Monte-Carlo', contact:'+385 91 xxx xxxx', available:true },
                    { initials:'MS', name:'Marcos Silva', role:'Sports Psychologist', dept:'Support', rating:87, deptColor:'#8B5CF6', ref:'LUM-005', stats:{FOC:93,PRE:91,MND:88,CNF:90,RES:87,CLR:85}, speciality:'Mental conditioning', location:'Madrid (remote)', contact:'+34 911 xxx xxx', available:false },
                    { initials:'TE', name:'Tom Ellis', role:'Stringer', dept:'Equipment', rating:91, deptColor:'#0ea5e9', ref:'LUM-006', stats:{TEN:90,PRE:88,STR:92,CON:83,SPD:80,REL:91}, speciality:'Racket customisation', location:'Monte-Carlo', contact:'+44 7800 xxx xxx', available:true },
                  ].map((m, i) => (
                    <div key={i} className="rounded-xl overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${m.deptColor}18 0%, rgba(0,0,0,0.6) 100%)`, border: `1px solid ${m.deptColor}35` }}>
                      <div className="flex items-start justify-between px-2 pt-2 pb-1">
                        <div>
                          <div className="text-base font-black leading-none" style={{ color: '#F9FAFB' }}>{m.rating}</div>
                          <div className="text-[7px] font-bold uppercase tracking-widest mt-0.5" style={{ color: m.deptColor }}>{m.role.split(' ')[0].toUpperCase()}</div>
                        </div>
                        <span className="text-[7px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${m.deptColor}25`, color: m.deptColor }}>{m.dept}</span>
                      </div>
                      <div className="flex justify-center pb-1">
                        {demoStaffPhotos[m.name] ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden border flex-shrink-0" style={{ borderColor: `${m.deptColor}60` }}>
                            <img src={demoStaffPhotos[m.name]} alt={m.name} className="w-full h-full object-cover object-center" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border" style={{ backgroundColor: `${m.deptColor}20`, borderColor: `${m.deptColor}60`, color: m.deptColor }}>{m.initials}</div>
                        )}
                      </div>
                      <div className="text-center px-2 pb-1">
                        <div className="text-[10px] font-black text-white leading-tight">{m.name}</div>
                        <div className="text-[8px] mt-0.5" style={{ color: m.deptColor }}>{m.role}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-x-0 px-1.5 pb-1" style={{ borderTop: `1px solid ${m.deptColor}20`, borderBottom: `1px solid ${m.deptColor}20` }}>
                        {Object.entries(m.stats).map(([k, v], si) => (
                          <div key={k} className="flex items-center justify-center gap-0.5 py-0.5 text-[8px]" style={{ borderRight: (si+1)%3!==0?`1px solid ${m.deptColor}15`:'none', borderBottom: si<3?`1px solid ${m.deptColor}15`:'none' }}>
                            <span className="font-black text-white">{v}</span>
                            <span style={{ color: m.deptColor }}>{k}</span>
                          </div>
                        ))}
                      </div>
                      <div className="px-2 py-1 space-y-0.5 text-[8px]">
                        {[['Speciality',m.speciality],['Location',m.location]].map(([l,v]) => (
                          <div key={l} className="flex justify-between"><span style={{ color: '#6B7280' }}>{l}</span><span className="text-white text-right truncate ml-1">{v}</span></div>
                        ))}
                        <div className="flex justify-between"><span style={{ color: '#6B7280' }}>Available</span><span className="font-bold" style={{ color: m.available?'#22C55E':'#EF4444' }}>{m.available?'Yes':'No'}</span></div>
                      </div>
                      <div className="px-2 pb-2 pt-0.5 flex items-center justify-between">
                        <span className="text-[7px]" style={{ color: '#374151' }}>{m.ref}</span>
                        <button className="flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${m.deptColor}20`, color: m.deptColor, border: `1px solid ${m.deptColor}30` }}>👤 Profile</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Club Info */}
            {teamSubTab === 'club' && (
              <div className="space-y-4">
                <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>Documents</h4>
                  <div className="space-y-2">
                    {['Player Contract 2024-2027', 'Insurance Certificate', 'Anti-Doping Compliance', 'Visa & Work Permits', 'Tax Residency Certificate'].map((doc, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <span className="text-xs">📄</span>
                        <span className="text-xs flex-1" style={{ color: '#D1D5DB' }}>{doc}</span>
                        <span className="text-[10px]" style={{ color: '#0ea5e9', cursor: 'pointer' }}>View</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>Player Details</h4>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[11px]">
                    {[
                      ['Full Name', profileNameLive || session.userName || player.name], ['Nationality', `${player.flag} ${player.nationality}`],
                      ['DOB', player.dateOfBirth], ['Age', `${player.age}`],
                      ['Height', player.height], ['Weight', player.weight],
                      ['Plays', player.plays], ['Backhand', player.backhand],
                      ['Turned Pro', `${player.turned_pro}`], ['Academy', player.academy],
                      ['Coach', player.coach], ['Agent', player.agent],
                    ].map(([label, val], i) => (
                      <div key={i} className="flex justify-between py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ color: '#6B7280' }}>{label}</span>
                        <span style={{ color: '#D1D5DB' }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>Key Contacts</h4>
                  <div className="space-y-2 text-[11px]">
                    {[
                      { name: 'LTA Performance', role: 'Federation Liaison', contact: 'performance@lta.org.uk' },
                      { name: 'ATP Tour Office', role: 'Player Relations', contact: 'players@atptour.com' },
                      { name: 'IMG London', role: 'Agency HQ', contact: '+44 207 535 xxxx' },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div>
                          <span style={{ color: '#D1D5DB' }}>{c.name}</span>
                          <span className="ml-2" style={{ color: '#6B7280' }}>{c.role}</span>
                        </div>
                        <span style={{ color: '#0ea5e9' }}>{c.contact}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>Upcoming Events</h4>
                  <div className="space-y-2">
                    {[
                      { date: 'Apr 9', event: 'Monte-Carlo Masters QF', surface: 'Clay' },
                      { date: 'Apr 26', event: 'Madrid Open', surface: 'Clay' },
                      { date: 'May 11', event: 'Rome Masters', surface: 'Clay' },
                      { date: 'May 25', event: 'Roland-Garros', surface: 'Clay' },
                    ].map((ev, i) => (
                      <div key={i} className="flex items-center gap-3 py-1.5">
                        <span className="text-[10px] font-bold w-12" style={{ color: '#0ea5e9' }}>{ev.date}</span>
                        <span className="text-xs flex-1" style={{ color: '#D1D5DB' }}>{ev.event}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(249,115,22,0.12)', color: '#F97316' }}>{ev.surface}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* GPS Tracker Modal */}
      {showGpsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowGpsModal(false) }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛰️</span>
                <div className="text-base font-bold text-white">Lumio GPS Tracker</div>
              </div>
              <button onClick={() => setShowGpsModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10">✕</button>
            </div>
            <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>The only GPS tracker built specifically for tennis players. Lightweight vest or clip-on. Real-time court coverage, sprint load, and recovery data — all inside your Lumio portal.</p>
            <div className="space-y-2 mb-5">
              {[
                { icon: '📦', text: '£299 one-off hardware + included in your plan' },
                { icon: '📡', text: 'Pairs automatically with your portal' },
                { icon: '🎾', text: 'Combines with SwingVision for AI post-session briefs' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs" style={{ color: '#D1D5DB' }}><span>{f.icon}</span>{f.text}</div>
              ))}
            </div>
            {gpsRequested ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-sm font-bold text-white mb-1">You&apos;re on the list!</div>
                <div className="text-xs" style={{ color: '#6B7280' }}>We&apos;ll be in touch shortly.</div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setGpsRequested(true)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#7C3AED' }}>
                  Request Early Access
                </button>
                <button onClick={() => setShowGpsModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
                  Learn More
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

// ─── MORNING BRIEFING VIEW ─────────────────────────────────────────────────────
function MorningBriefingView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const [playing, setPlaying] = useState(false);
  const [recipient, setRecipient] = useState<'player' | 'coach' | 'agent' | 'physio'>('player');
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateBriefing = async () => {
    setLoading(true);
    try {
      const todayGPS = GPS_SESSIONS_TENNIS[GPS_SESSIONS_TENNIS.length - 1];
      const res = await fetch('/api/ai/tennis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: `Generate a structured morning briefing for professional tennis player Alex Rivera (ATP #${player.ranking}, ranking points: ${player.ranking_points}, Race to Dubai #${player.race_ranking}, British, right-handed).

Today: Monte-Carlo Masters 2026 — clay court tournament. Coach: ${player.coach}. Physio: ${player.physio}.

Yesterday's GPS session: Type: ${todayGPS.type}, Duration: ${todayGPS.duration} min, Distance: ${todayGPS.distance} km, Load: ${todayGPS.load} AU, ACWR: ${todayGPS.acwr.toFixed(2)}.
Serve stats: 1st serve %: 64%, aces: 4, double faults: 2, first serve won: 74%.
Surface win rate: Clay 58%, Grass 72%, Hard 61%.
Points expiring: 125 pts in 7 days (2025 Monte-Carlo result).

Cover: match prep (today's opponent intel), GPS status (load and recovery recommendation), serve (one specific technical focus), ranking (points situation), obligations (sponsor/media). End with a one-line motivational closer from Marco.

Be direct, specific, professional. Around 250 words.

Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.`
          }]
        })
      });
      const data = await res.json();
      setBriefing(cleanResponse(data.content?.[0]?.text || 'Error generating briefing.'));
    } catch {
      setBriefing('Connection error — check API configuration.');
    } finally {
      setLoading(false);
    }
  };

  const printBriefing = () => {
    if (!briefing) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Morning Briefing — ${player.name}</title>
    <style>body{font-family:Georgia,serif;max-width:720px;margin:40px auto;color:#1a1a2e;font-size:13px;line-height:1.7}
    h1{font-size:20px;border-bottom:2px solid #8B5CF6;padding-bottom:8px}
    .meta{font-size:11px;color:#666;margin-bottom:20px}
    pre{white-space:pre-wrap;font-family:Georgia,serif}
    footer{margin-top:32px;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:12px}
    @media print{body{margin:20px}}</style></head><body>
    <h1>Lumio Tennis — Morning Briefing</h1>
    <div class="meta">${player.name} · ATP #${player.ranking} · ${new Date().toLocaleDateString('en-GB')}</div>
    <pre>${briefing.replace(/</g,'&lt;')}</pre>
    <footer>Generated by Lumio Tennis · lumiocms.com · CONFIDENTIAL</footer>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const briefings = {
    player: `Good morning, ${player.name.split(' ')[0]}. You're ranked ${player.ranking}th in the ATP rankings, up two places this week. Your serve percentage on clay is 61% over the last 10 matches — 4 points below your season average of 65%. Today you're facing Carlos Vega, ranked 34th. He favours the inside-out forehand on break points on clay — Marco has left a full breakdown in your match prep. Stringing is at 11:45 with Carlos at your usual clay tensions — Luxilon ALU at 24kg mains, 23kg crosses. Your Apex Performance Instagram post is due today — James has drafted a caption for your review. First match is at 13:00 on Court 4. You've beaten Vega 3 times on clay. Everything is ready.`,
    coach: `Morning briefing for Marco Bianchi. Alex's recovery score is 82 out of 100 — shoulder flagged as mild yesterday by Sarah. Practice plan for 10am: 45 minutes serve patterns focusing on body serve percentages, then 45 minutes return drill — Carlos Vega's second serve sits wide on the deuce side 68% of the time. H2H against Vega: Alex leads 3-1 overall, 3-0 on clay. Main tactical note: Vega breaks down mentally after losing the first set. Apply pressure early. Stringing confirmed 11:45. Alex's meal plan from Luis is in the system.`,
    agent: `Morning briefing for James Whitfield. Apex Performance Instagram post is due today — draft is in the sponsorship tab awaiting Alex's approval. The Meridian Watches deal renewal is 47 days out — agenda item for Friday's call. Performance bonus trigger: if Alex reaches the semi-final this week, the Vanta Sports performance clause activates — GBP 8,500 bonus. Race standing is 54th — 312 points behind the cut-off for the 8-man Turin field. Next ranking report to Meridian Watches is due end of month. No press obligations today.`,
    physio: `Morning briefing for Sarah Okafor. Alex's WHOOP recovery score is 82. Right shoulder flagged mild yesterday — completed 20-minute treatment this morning, strapping applied, cleared for full practice. Pre-match treatment window is 12:00-12:30 before the 13:00 match. Watch for serve load during warm-up — cap at 40 serves in practice. Travel departs Saturday — next event is Barcelona ATP 500, clay, 13-19 April. No new injury flags from the training log.`,
  };

  const recipients = [
    { key: 'player', label: 'Player', icon: '🎾', time: '7:30am' },
    { key: 'coach', label: 'Coach', icon: '📋', time: '8:00am' },
    { key: 'agent', label: 'Agent', icon: '🤝', time: '8:30am' },
    { key: 'physio', label: 'Physio', icon: '⚕️', time: '8:00am' },
  ];

  return (
    <div className="space-y-6">

      <SectionHeader icon="🌅" title="AI Morning Briefing" subtitle="Voice-powered daily briefings for the player and full team — delivered before first session." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Ranking', v: `#${player.ranking}`, s: `${player.ranking_points} pts` },
          { l: 'ACWR', v: GPS_SESSIONS_TENNIS[GPS_SESSIONS_TENNIS.length-1].acwr.toFixed(2), s: 'Latest session' },
          { l: 'Pts Expiring', v: '125', s: 'in 7 days' },
          { l: 'Next Match', v: 'vs Vega', s: '13:00 · Court 4' },
        ].map(k => (
          <div key={k.l} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-500">{k.l}</div>
            <div className="text-xl font-bold text-white">{k.v}</div>
            <div className="text-xs text-gray-500 mt-0.5">{k.s}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-white">🤖 AI-Generated Morning Briefing</div>
          {briefing && (
            <div className="flex gap-2">
              <button onClick={generateBriefing} disabled={loading} className="text-xs text-gray-400 hover:text-white border border-gray-700 rounded px-3 py-1">{loading ? 'Regenerating…' : 'Regenerate'}</button>
              <button onClick={printBriefing} className="text-xs bg-purple-600 hover:bg-purple-700 text-white rounded px-3 py-1">📄 Print</button>
            </div>
          )}
        </div>
        {!briefing && !loading && (
          <button onClick={generateBriefing} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold py-3 rounded-lg transition-colors">Generate Today&apos;s Briefing</button>
        )}
        {loading && (
          <div className="space-y-2">
            {[0,1,2,3].map(i => <div key={i} className="h-4 bg-[#0a0c14] rounded animate-pulse"/>) }
          </div>
        )}
        {briefing && !loading && (
          <pre className="text-xs text-gray-300 bg-[#0a0c14] border border-gray-800 rounded p-4 whitespace-pre-wrap font-mono leading-relaxed">{briefing}</pre>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {recipients.map(r => (
          <button
            key={r.key}
            onClick={() => setRecipient(r.key as typeof recipient)}
            className={`p-3 rounded-xl border text-left transition-all ${recipient === r.key ? 'bg-purple-600/20 border-purple-500/50' : 'bg-[#0d0f1a] border-gray-800 hover:border-gray-600'}`}
          >
            <div className="text-xl mb-1">{r.icon}</div>
            <div className="text-sm font-medium text-white">{r.label}</div>
            <div className="text-xs text-gray-500">{r.time}</div>
          </button>
        ))}
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
            <span className="text-sm text-teal-400 font-medium">Today's briefing — {recipients.find(r => r.key === recipient)?.label}</span>
          </div>
          <button
            onClick={() => setPlaying(!playing)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {playing ? 'Stop' : 'Play Briefing'}
          </button>
        </div>
        <div className="text-gray-300 text-sm leading-relaxed border-l-2 border-purple-600/50 pl-4">
          &quot;{briefings[recipient]}&quot;
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Briefing Time', value: '2m 14s', sub: 'Average read time' },
          { label: 'Voice', value: 'Rachel', sub: 'ElevenLabs TTS' },
          { label: 'Delivery', value: '07:30', sub: 'Auto-send daily' },
        ].map((s, i) => (
          <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-white font-bold text-lg">{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
            <div className="text-xs text-gray-600 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Briefing Settings</div>
        <div className="space-y-3">
          {[
            { label: "Player briefing time", value: "07:30", icon: "🎾" },
            { label: "Coach briefing time", value: "08:00", icon: "📋" },
            { label: "Agent briefing time", value: "08:30", icon: "🤝" },
            { label: "Physio briefing time", value: "08:00", icon: "⚕️" },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>{s.icon}</span><span>{s.label}</span>
              </div>
              <div className="text-sm text-purple-400 font-medium">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
      <TennisAISection context="morning" player={player} session={session} />
    </div>
  );
}

// ─── RANKINGS VIEW ─────────────────────────────────────────────────────────────
function RankingsView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [rankScenarios, setRankScenarios] = useState<{event: string; result: string; pts: number}[]>([
    { event: 'Rome Masters 1000', result: 'Quarterfinal', pts: 180 },
    { event: 'Roland-Garros Grand Slam', result: 'Round of 16', pts: 120 },
    { event: 'Halle ATP 500', result: 'Final', pts: 300 },
    { event: "Queen's ATP 500", result: 'Semifinal', pts: 200 },
    { event: 'Wimbledon Grand Slam', result: 'Quarterfinal', pts: 360 },
  ]);
  const [rankScenarioResult, setRankScenarioResult] = useState<{projected_ranking: string; projected_points: string; race_projection: string; analysis: string} | null>(null);

  const runScenario = async () => {
    setScenarioLoading(true);
    try {
      const totalNewPts = rankScenarios.reduce((a,s)=>a+s.pts,0);
      const projectedPts = player.ranking_points + totalNewPts;
      const res = await fetch('/api/ai/tennis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          messages: [{ role: 'user', content: `ATP ranking scenario for Alex Rivera. Current: #${player.ranking} with ${player.ranking_points} pts. Upcoming results scenario: ${rankScenarios.map(s=>`${s.event}: ${s.result} (+${s.pts}pts)`).join(', ')}. Total new points: ${totalNewPts}. Projected total: ${projectedPts} pts. Estimate: projected ATP ranking, Race to Turin position, and whether this secures top-50 / top-30 / top-20. Respond ONLY in JSON: {"projected_ranking":"e.g. #52","projected_points":"${projectedPts}","race_projection":"e.g. #38 Race","analysis":"2 sentences on what this means for season goals and which result matters most"}` }]
        })
      });
      const data = await res.json();
      const text: string = data?.content?.[0]?.text || '';
      const s = text.indexOf('{'); const e = text.lastIndexOf('}');
      setRankScenarioResult(JSON.parse(text.slice(s, e + 1)));
    } catch { console.error('Scenario modelling failed'); }
    finally { setScenarioLoading(false); }
  };

  const pointsExpiry = [
    { week: 'This week', tournament: 'Monte-Carlo Masters', round: 'QF last year', points: 125, expires: '14 Apr' },
    { week: 'Week 16', tournament: 'Barcelona Open ATP 500', round: 'R2 last year', points: 45, expires: '21 Apr' },
    { week: 'Week 20', tournament: 'Roland-Garros', round: 'R3 last year', points: 45, expires: '2 Jun' },
    { week: 'Week 28', tournament: 'Wimbledon', round: 'R2 last year', points: 45, expires: '7 Jul' },
    { week: 'Week 38', tournament: 'US Open', round: 'QF last year', points: 180, expires: '7 Sep' },
    { week: 'Week 40', tournament: 'Laver Cup', round: 'N/A', points: 0, expires: '21 Sep' },
    { week: 'Week 43', tournament: 'Shanghai Masters', round: 'R1 last year', points: 10, expires: '12 Oct' },
  ];

  const scenarios = [
    { result: 'W (Win)', tournament: 'Monte-Carlo', points: 1000, newRanking: 51, change: '+16' },
    { result: 'F (Final)', tournament: 'Monte-Carlo', points: 650, newRanking: 56, change: '+11' },
    { result: 'SF (Semifinal)', tournament: 'Monte-Carlo', points: 390, newRanking: 61, change: '+6' },
    { result: 'QF (Quarterfinal)', tournament: 'Monte-Carlo', points: 215, newRanking: 66, change: '+1' },
    { result: 'R2 (2nd Round)', tournament: 'Monte-Carlo', points: 65, newRanking: 71, change: '-4' },
    { result: 'R1 (1st Round)', tournament: 'Monte-Carlo', points: 10, newRanking: 77, change: '-10' },
  ];

  return (
    <div className="space-y-6">

      <SectionHeader icon="📊" title="Rankings & Race Intelligence" subtitle="Live ranking position, points tracker, race standings, and scenario modelling." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="ATP Ranking" value={`#${player.ranking}`} sub="^2 this week" color="purple" />
        <StatCard label="Race to Turin" value={`#${player.race_ranking}`} sub="312 pts behind cut" color="teal" />
        <StatCard label="Total Points" value={player.ranking_points.toLocaleString()} sub="52-week rolling" color="blue" />
        <StatCard label="Career High" value={`#${player.career_high}`} sub={player.career_high_date} color="orange" />
      </div>

      {/* Ranking Trajectory Chart */}
      <RankingTrajectoryChart />

      {/* Race to Finals */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Race to Turin — Current Standing</div>
        <div className="space-y-2">
          {[
            { rank: 1, name: 'L. Brenner', pts: 9240, flag: '🇮🇹', qualified: true },
            { rank: 2, name: 'C. Valdez', pts: 7850, flag: '🇪🇸', qualified: true },
            { rank: 3, name: 'A. Zverev', pts: 6120, flag: '🇩🇪', qualified: false },
            { rank: 4, name: 'H. Rune', pts: 5480, flag: '🇩🇰', qualified: false },
            { rank: 5, name: 'J. Draper', pts: 4930, flag: '🇬🇧', qualified: false },
            { rank: 6, name: 'T. Fritz', pts: 4410, flag: '🇺🇸', qualified: false },
            { rank: 7, name: 'C. Ruud', pts: 4180, flag: '🇳🇴', qualified: false },
            { rank: 8, name: 'K. Mensik', pts: 3820, flag: '🇨🇿', qualified: false },
            { rank: 54, name: player.name, pts: player.ranking_points, flag: player.flag, qualified: false, isPlayer: true },
          ].map((p: { rank: number; name: string; pts: number; flag: string; qualified: boolean; isPlayer?: boolean }, i) => (
            <div key={i} className={`flex items-center gap-3 py-2 px-3 rounded-lg ${p.isPlayer ? 'bg-purple-600/20 border border-purple-500/30' : 'bg-gray-900/20'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${p.qualified ? 'bg-teal-600/30 text-teal-400' : 'bg-gray-800 text-gray-400'}`}>
                {p.rank}
              </div>
              <span className="text-sm">{p.flag}</span>
              <span className={`text-sm flex-1 ${p.isPlayer ? 'text-purple-400 font-semibold' : 'text-gray-300'}`}>{p.name}{p.isPlayer ? ' <-- YOU' : ''}</span>
              <span className={`text-sm font-medium ${p.qualified ? 'text-teal-400' : 'text-gray-400'}`}>{p.pts.toLocaleString()} pts</span>
              {p.qualified && <span className="text-xs text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded">Qualified</span>}
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-500">Top 8 qualify. You need <span className="text-yellow-400 font-medium">+1,973 pts</span> to reach the cut-off line at this stage.</div>
      </div>

      {/* Points Expiry */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Points Expiry Calendar (Rolling 52 Weeks)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-800">
                <th className="text-left pb-2">Tournament</th>
                <th className="text-left pb-2">Round Last Year</th>
                <th className="text-left pb-2">Points</th>
                <th className="text-left pb-2">Expires</th>
              </tr>
            </thead>
            <tbody>
              {pointsExpiry.map((p, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="py-2 text-gray-300">{p.tournament}</td>
                  <td className="py-2 text-gray-400">{p.round}</td>
                  <td className={`py-2 font-medium ${p.points > 100 ? 'text-orange-400' : 'text-gray-400'}`}>{p.points}</td>
                  <td className="py-2 text-gray-500">{p.expires}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scenario Modelling */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Scenario Modelling — Monte-Carlo</div>
        <div className="space-y-2">
          {scenarios.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${s.result.startsWith('W') ? 'bg-teal-600/10 border-teal-600/30' : s.result.startsWith('F') ? 'bg-blue-600/10 border-blue-600/30' : s.result.startsWith('SF') ? 'bg-purple-600/10 border-purple-600/30' : 'bg-gray-900/20 border-gray-800'}`}>
              <span className="text-xs font-bold text-gray-400 w-20">{s.result}</span>
              <span className="text-sm text-gray-300 flex-1">Ranking points: <span className="text-white font-medium">{s.points}</span></span>
              <span className="text-sm text-gray-400">New ranking: <span className="text-white font-bold">#{s.newRanking}</span></span>
              <span className={`text-sm font-bold w-10 text-right ${s.change.startsWith('+') ? 'text-teal-400' : 'text-red-400'}`}>{s.change}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">🤖 AI Ranking Scenario Modeller</div>
        <div className="text-xs text-gray-400 mb-4">Adjust results for upcoming events — AI projects your year-end ranking</div>
        <div className="space-y-2 mb-4">
          {rankScenarios.map((s,i)=>(
            <div key={i} className="flex items-center gap-3 p-2.5 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="flex-1">
                <div className="text-xs font-medium text-white">{s.event}</div>
                <div className="text-[10px] text-gray-500">{s.pts} pts for this result</div>
              </div>
              <select
                value={s.result}
                onChange={e => {
                  const pts: Record<string,number> = { 'Winner':500,'Final':300,'Semifinal':200,'Quarterfinal':180,'Round of 16':120,'Round of 32':60,'Round of 64':30,'First Round':0 };
                  const grandSlam: Record<string,number> = { 'Winner':2000,'Final':1200,'Semifinal':720,'Quarterfinal':360,'Round of 16':180,'Round of 32':90,'Round of 64':45,'First Round':10 };
                  const isGS = s.event.includes('Grand Slam');
                  const newPts = (isGS ? grandSlam : pts)[e.target.value] || 0;
                  setRankScenarios(prev => prev.map((x,j) => j===i ? {...x, result:e.target.value, pts:newPts} : x));
                }}
                className="bg-[#0d0f1a] border border-gray-700 rounded px-2 py-1 text-xs text-white"
              >
                {['Winner','Final','Semifinal','Quarterfinal','Round of 16','Round of 32','First Round'].map(r=><option key={r}>{r}</option>)}
              </select>
            </div>
          ))}
        </div>
        <button onClick={runScenario} disabled={scenarioLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors mb-4">
          {scenarioLoading ? 'Modelling...' : 'Project My Ranking →'}
        </button>
        {rankScenarioResult && (
          <div className="space-y-3 border-t border-gray-800 pt-4">
            <div className="grid grid-cols-3 gap-2">
              {[{l:'Projected Ranking',v:rankScenarioResult.projected_ranking,c:'text-purple-400'},{l:'Projected Points',v:rankScenarioResult.projected_points,c:'text-white'},{l:'Race Position',v:rankScenarioResult.race_projection,c:'text-teal-400'}].map(x=>(
                <div key={x.l} className="bg-[#0a0c14] border border-gray-800 rounded p-3 text-center">
                  <div className={`text-lg font-bold ${x.c}`}>{x.v}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{x.l}</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-300 bg-[#0a0c14] border border-gray-800 rounded p-3 leading-relaxed">{rankScenarioResult.analysis}</div>
          </div>
        )}
      </div>

      {(() => {
        const rankingSecurityData = [
          { threshold: 'Top 100', pointsNeeded: 0, safe: true, buffer: 312, note: '#100 cutoff ~1535 pts this week' },
          { threshold: 'Top 75', pointsNeeded: 184, safe: false, buffer: -184, note: '#75 cutoff ~2031 pts — need 184 more' },
          { threshold: 'Top 50', pointsNeeded: 580, safe: false, buffer: -580, note: '#50 cutoff ~2427 pts — need 580 more' },
          { threshold: 'Top 32 (slam seed)', pointsNeeded: 1420, safe: false, buffer: -1420, note: '#32 cutoff ~3267 pts' },
        ];
        const rowBg = (r: typeof rankingSecurityData[0]) => r.safe ? 'bg-green-900/10 border-green-600/20' : r.buffer > -200 ? 'bg-yellow-900/10 border-yellow-600/20' : 'bg-red-900/10 border-red-600/20';
        const badgeCls = (r: typeof rankingSecurityData[0]) => r.safe ? 'bg-green-600/20 text-green-400' : r.buffer > -200 ? 'bg-yellow-600/20 text-yellow-400' : 'bg-red-600/20 text-red-400';
        const barCls = (r: typeof rankingSecurityData[0]) => r.safe ? 'bg-green-500' : r.buffer > -200 ? 'bg-yellow-500' : 'bg-red-500';
        const icon = (r: typeof rankingSecurityData[0]) => r.safe ? '✅' : r.buffer > -200 ? '⚠️' : '🔴';
        const label = (r: typeof rankingSecurityData[0]) => r.safe ? 'SAFE' : r.buffer > -200 ? 'MARGINAL' : 'AT RISK';
        return (
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-1">🛡️ Ranking Security Calculator</div>
            <div className="text-xs text-gray-400 mb-4">Current points: {player.ranking_points.toLocaleString()} — how safe is Alex&apos;s ranking threshold?</div>
            <div className="space-y-3">
              {rankingSecurityData.map((r,i)=>(
                <div key={i} className={`p-3 rounded-lg border ${rowBg(r)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>{icon(r)}</span>
                      <span className="text-sm font-medium text-white">{r.threshold}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${badgeCls(r)}`}>{label(r)}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">{r.note}</span>
                    <span className={r.safe ? 'text-green-400' : 'text-red-400'}>{r.safe ? `+${r.buffer} buffer` : `${r.buffer} pts needed`}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${barCls(r)}`}
                      style={{width:`${Math.min(100,(player.ranking_points/(player.ranking_points+Math.abs(r.buffer||1)))*100)}%`}}/>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-purple-900/20 border border-purple-600/20 rounded-lg text-xs text-gray-300">
              <strong className="text-purple-400">Key insight:</strong> Alex&apos;s top-100 position is safe with a 312-point buffer. The priority is reaching top-75 (needs 184 pts) — achievable with a SF run at Rome or Roland-Garros. Top-50 requires a breakthrough result.
            </div>
          </div>
        );
      })()}
      <TennisAISection context="rankings" player={player} session={session} />
    </div>
  );
}

// ─── SCHEDULE VIEW ─────────────────────────────────────────────────────────────
function ScheduleView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const calendar = [
    { date: '6-12 Apr',   tournament: 'Monte-Carlo Masters',              cat: 'Masters 1000',  surface: 'Clay',        location: '🇲🇨 Monaco',    status: 'active',   points: 215, entered: true },
    { date: '13-19 Apr',  tournament: 'Barcelona Open',                   cat: 'ATP 500',       surface: 'Clay',        location: '🇪🇸 Barcelona', status: 'upcoming', points: 0,   entered: true },
    { date: '13-19 Apr',  tournament: 'Halden Motors Open Munich',                  cat: 'ATP 500',       surface: 'Clay',        location: '🇩🇪 Munich',    status: 'upcoming', points: 0,   entered: false },
    { date: '22 Apr-3 May',tournament: 'Madrid Open',                     cat: 'Masters 1000',  surface: 'Clay',        location: '🇪🇸 Madrid',    status: 'upcoming', points: 0,   entered: true },
    { date: '6-17 May',   tournament: 'Rome Masters',                     cat: 'Masters 1000',  surface: 'Clay',        location: '🇮🇹 Rome',      status: 'upcoming', points: 0,   entered: true },
    { date: '18-24 May',  tournament: 'Hamburg Open',                     cat: 'ATP 500',       surface: 'Clay',        location: '🇩🇪 Hamburg',   status: 'upcoming', points: 0,   entered: false },
    { date: '24 May-7 Jun',tournament: 'Roland-Garros',                   cat: 'Grand Slam',    surface: 'Clay',        location: '🇫🇷 Paris',     status: 'upcoming', points: 0,   entered: true },
    { date: '15-21 Jun',  tournament: 'Halle Open',                       cat: 'ATP 500',       surface: 'Grass',       location: '🇩🇪 Halle',     status: 'upcoming', points: 0,   entered: true },
    { date: '15-21 Jun',  tournament: "Queen's Club",                     cat: 'ATP 500',       surface: 'Grass',       location: '🇬🇧 London',    status: 'upcoming', points: 0,   entered: false },
    { date: '30 Jun-13 Jul',tournament: 'Wimbledon',                      cat: 'Grand Slam',    surface: 'Grass',       location: '🇬🇧 London',    status: 'upcoming', points: 0,   entered: true },
    { date: '28 Jul-3 Aug',tournament: 'Washington DC Open',              cat: 'ATP 500',       surface: 'Hard',        location: '🇺🇸 Washington',status: 'upcoming', points: 0,   entered: true },
    { date: '10-23 Aug',  tournament: 'Canadian Open (Montreal)',         cat: 'Masters 1000',  surface: 'Hard',        location: '🇨🇦 Montreal',  status: 'upcoming', points: 0,   entered: true },
    { date: '25 Aug-7 Sep',tournament: 'US Open',                         cat: 'Grand Slam',    surface: 'Hard',        location: '🇺🇸 New York',  status: 'upcoming', points: 0,   entered: true },
  ];

  const commitmentCheck = [
    { req: 'ATP 500 appearances (min 4 per season)', done: 0, needed: 4, tooltip: 'Barcelona, Hamburg, Halle, Washington planned' },
    { req: 'Masters 1000 entries (all 9 mandatory)', done: 1, needed: 9, tooltip: 'Monte-Carlo underway' },
    { req: 'Grand Slam appearances', done: 0, needed: 4, tooltip: 'All 4 entered' },
  ];

  return (
    <div className="space-y-6">

      <SectionHeader icon="🗓️" title="Tournament Schedule" subtitle="Full season calendar with entry status, surface splits, and category commitment tracker." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {commitmentCheck.map((c, i) => (
          <div key={i} className={`bg-[#0d0f1a] border rounded-xl p-4 ${c.done >= c.needed ? 'border-teal-600/30' : 'border-yellow-600/30'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">{c.req}</span>
              <span className={`text-xs font-bold ${c.done >= c.needed ? 'text-teal-400' : 'text-yellow-400'}`}>{c.done}/{c.needed}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (c.done / c.needed) * 100)}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Dates</th>
              <th className="text-left p-3">Tournament</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Surface</th>
              <th className="text-left p-3">Location</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Points</th>
            </tr>
          </thead>
          <tbody>
            {calendar.map((t, i) => (
              <tr key={i} className={`border-b border-gray-800/50 hover:bg-gray-900/30 ${t.status === 'active' ? 'bg-purple-900/10' : ''}`}>
                <td className="p-3 text-gray-400 text-xs">{t.date}</td>
                <td className="p-3 text-gray-200 font-medium">{t.tournament}</td>
                <td className="p-3"><CategoryBadge category={t.cat} /></td>
                <td className="p-3"><SurfaceBadge surface={t.surface} /></td>
                <td className="p-3 text-gray-400 text-xs">{t.location}</td>
                <td className="p-3">
                  {t.status === 'active' && <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">In Progress</span>}
                  {t.status === 'upcoming' && t.entered && <span className="text-xs text-blue-400">Entered</span>}
                  {t.status === 'upcoming' && !t.entered && <span className="text-xs text-gray-600">Not entered</span>}
                </td>
                <td className="p-3 text-gray-400">{t.points > 0 ? <span className="text-teal-400 font-medium">{t.points}</span> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TennisAISection context="schedule" player={player} session={session} />
    </div>
  );
}

// ─── PERFORMANCE VIEW ──────────────────────────────────────────────────────────
function PerformanceView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const [perfTab, setPerfTab] = useState<'overview' | 'serve' | 'return' | 'pressure'>('overview');

  const surfaces = [
    { name: 'Clay', matches: 12, wins: 8, winPct: 67, serve1: 61, serve1Pts: 74, returnPtsWon: 42, aces: 4.2, dfaults: 2.1, rallyAvg: 7.8 },
    { name: 'Hard', matches: 24, wins: 17, winPct: 71, serve1: 65, serve1Pts: 79, returnPtsWon: 39, aces: 6.8, dfaults: 2.8, rallyAvg: 5.2 },
    { name: 'Grass', matches: 8, wins: 5, winPct: 63, serve1: 67, serve1Pts: 81, returnPtsWon: 36, aces: 9.4, dfaults: 3.2, rallyAvg: 3.9 },
    { name: 'Indoor', matches: 6, wins: 4, winPct: 67, serve1: 64, serve1Pts: 78, returnPtsWon: 40, aces: 5.5, dfaults: 2.4, rallyAvg: 4.6 },
  ];

  const recentForm = [
    { tournament: 'Indian Wells', cat: 'Masters 1000', surface: 'Hard', result: 'QF', opponent: 'Rune', score: '6-4, 4-6, 2-6', wl: 'L' },
    { tournament: 'Miami Open', cat: 'Masters 1000', surface: 'Hard', result: 'R3', opponent: 'Mensik', score: '4-6, 6-3, 2-6', wl: 'L' },
    { tournament: 'Dubai ATP 500', cat: 'ATP 500', surface: 'Hard', result: 'SF', opponent: 'Tsitsipas', score: '6-7, 3-6', wl: 'L' },
    { tournament: 'Rotterdam ATP 500', cat: 'ATP 500', surface: 'Indoor', result: 'W', opponent: 'Paul', score: '6-4, 7-6', wl: 'W' },
    { tournament: 'Australian Open', cat: 'Grand Slam', surface: 'Hard', result: 'R4', opponent: 'Brenner', score: '3-6, 4-6, 7-5, 2-6', wl: 'L' },
  ];

  return (
    <div className="space-y-6">

      <SectionHeader icon="📈" title="Performance Stats" subtitle={`${player.name} . 2026 season statistics by surface, match patterns, and form tracker.`} />

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0d0f1a] border border-gray-800 rounded-lg p-1 w-fit">
        {([['overview', 'Overview'], ['serve', 'Serve Analysis'], ['return', 'Return'], ['pressure', 'Under Pressure']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setPerfTab(id)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${perfTab === id ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {perfTab === 'overview' && (
        <>
          {/* Season Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Matches', value: '50', sub: '34W / 16L' },
              { label: 'Win Rate', value: '68%', sub: '2026 season' },
              { label: 'Aces/match', value: '6.1', sub: '^0.4 vs 2025' },
              { label: 'Serve % (1st)', value: '63%', sub: 'Season avg' },
              { label: 'Break pts conv.', value: '41%', sub: 'On return' },
            ].map((s, i) => (
              <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                <div className="text-xs text-gray-600 mt-1">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ServePercentChart />
            <WinRateTrendChart />
          </div>

          {/* Surface Split */}
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <div className="text-sm font-semibold text-white">Performance by Surface — 2026 Season</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
                    <th className="text-left p-3">Surface</th>
                    <th className="text-left p-3">W/L</th>
                    <th className="text-left p-3">Win%</th>
                    <th className="text-left p-3">1st Serve%</th>
                    <th className="text-left p-3">1st Serve Pts Won</th>
                    <th className="text-left p-3">Return Pts Won</th>
                    <th className="text-left p-3">Aces/match</th>
                    <th className="text-left p-3">Avg Rally</th>
                  </tr>
                </thead>
                <tbody>
                  {surfaces.map((s, i) => (
                    <tr key={i} className="border-b border-gray-800/50">
                      <td className="p-3"><SurfaceBadge surface={s.name} /></td>
                      <td className="p-3 text-gray-300">{s.wins}/{s.matches - s.wins}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-800 rounded-full h-1.5">
                            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${s.winPct}%` }}></div>
                          </div>
                          <span className="text-gray-300 text-xs">{s.winPct}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-gray-300">{s.serve1}%</td>
                      <td className="p-3 text-gray-300">{s.serve1Pts}%</td>
                      <td className="p-3 text-gray-300">{s.returnPtsWon}%</td>
                      <td className="p-3 text-gray-300">{s.aces}</td>
                      <td className="p-3 text-gray-300">{s.rallyAvg} shots</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Form */}
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-4">Recent Form — Last 5 Matches</div>
            <div className="space-y-3">
              {recentForm.map((m, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800/50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${m.wl === 'W' ? 'bg-teal-600/20 text-teal-400' : 'bg-red-600/20 text-red-400'}`}>
                    {m.wl}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-200">{m.tournament} <span className="text-gray-500 text-xs">({m.result})</span></div>
                    <div className="text-xs text-gray-500">vs {m.opponent} . {m.score}</div>
                  </div>
                  <SurfaceBadge surface={m.surface} />
                  <CategoryBadge category={m.cat} />
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              {['L', 'L', 'L', 'W', 'L'].reverse().map((r, i) => (
                <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${r === 'W' ? 'bg-teal-600/30 text-teal-400' : 'bg-red-600/20 text-red-400'}`}>{r}</div>
              ))}
              <span className="ml-2 text-xs text-gray-500 self-center">most recent</span>
            </div>
          </div>
        </>
      )}

      {perfTab === 'serve' && (
        <>
          {/* 1st Serve Direction Breakdown */}
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-4">1st Serve — Direction Breakdown</div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { dir: 'T', pct: '42%', winPct: '78%', color: 'teal' },
                { dir: 'Wide', pct: '38%', winPct: '71%', color: 'purple' },
                { dir: 'Body', pct: '20%', winPct: '69%', color: 'orange' },
              ].map((d, i) => (
                <div key={i} className={`bg-gradient-to-br from-${d.color}-600/20 to-${d.color}-900/10 border border-${d.color}-600/20 rounded-xl p-4 text-center`}>
                  <div className="text-lg font-bold text-white">{d.dir}</div>
                  <div className="text-2xl font-bold text-white mt-1">{d.pct}</div>
                  <div className="text-xs text-gray-400 mt-1">Win rate: <span className="text-teal-400 font-medium">{d.winPct}</span></div>
                </div>
              ))}
            </div>
          </div>

          {/* 2nd Serve Direction Breakdown */}
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-4">2nd Serve — Direction Breakdown</div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { dir: 'T', pct: '31%', winPct: '61%' },
                { dir: 'Wide', pct: '28%', winPct: '58%' },
                { dir: 'Body', pct: '41%', winPct: '63%' },
              ].map((d, i) => (
                <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-xl p-4 text-center">
                  <div className="text-lg font-bold text-white">{d.dir}</div>
                  <div className="text-2xl font-bold text-white mt-1">{d.pct}</div>
                  <div className="text-xs text-gray-400 mt-1">Win rate: <span className="text-amber-400 font-medium">{d.winPct}</span></div>
                </div>
              ))}
            </div>
          </div>

          {/* Serve Speed Distribution */}
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-4">Serve Speed Distribution (km/h)</div>
            <svg viewBox="0 0 400 160" className="w-full">
              {[
                { label: '<170', pct: 2, x: 20 },
                { label: '170-185', pct: 8, x: 85 },
                { label: '185-200', pct: 22, x: 150 },
                { label: '200-215', pct: 41, x: 215 },
                { label: '215-230', pct: 21, x: 280 },
                { label: '230+', pct: 6, x: 345 },
              ].map((bin, i) => (
                <g key={i}>
                  <rect x={bin.x - 20} y={130 - bin.pct * 2.8} width={40} height={bin.pct * 2.8} rx={4} fill="#8B5CF6" opacity={0.6} />
                  <text x={bin.x} y={145} textAnchor="middle" fill="#6b7280" fontSize="9">{bin.label}</text>
                  <text x={bin.x} y={125 - bin.pct * 2.8} textAnchor="middle" fill="#e5e7eb" fontSize="10" fontWeight="bold">{bin.pct}%</text>
                </g>
              ))}
            </svg>
          </div>

          {/* Aces & DFs by Surface */}
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-4">Aces & Double Faults by Surface</div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { surface: 'Clay', aces: 4.2, dfs: 2.1 },
                { surface: 'Hard', aces: 6.8, dfs: 3.4 },
                { surface: 'Grass', aces: 8.1, dfs: 2.9 },
              ].map((s, i) => (
                <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3 text-center">
                  <SurfaceBadge surface={s.surface} />
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-teal-400 font-bold text-lg">{s.aces}</div>
                      <div className="text-gray-500">aces/match</div>
                    </div>
                    <div>
                      <div className="text-red-400 font-bold text-lg">{s.dfs}</div>
                      <div className="text-gray-500">DFs/match</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Serve +1 */}
          <div className="bg-gradient-to-r from-teal-900/30 to-blue-900/20 border border-teal-600/30 rounded-xl p-5">
            <div className="text-xs text-teal-400 font-semibold uppercase tracking-wider mb-2">Serve +1 Pattern Efficiency</div>
            <div className="text-white text-sm">After a first serve winner, win rate on next point: <span className="text-teal-400 font-bold text-lg ml-1">67%</span></div>
            <div className="text-xs text-gray-500 mt-1">Indicates strong momentum carry-over from big serves</div>
          </div>
        </>
      )}

      {perfTab === 'return' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[{ label:'Return Pts Won', value:'44%', color:'#22C55E' },{ label:'BPs Converted', value:'38%', color:'#F59E0B' },{ label:'Return Rating', value:'71', color:'#0ea5e9' },{ label:'Avg Return Depth', value:'0.82m', color:'#8B5CF6' }].map((s,i) => (
              <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4"><div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div><div className="text-xs text-gray-400 mt-0.5">{s.label}</div></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Return by Serve Type</div>
              {[{ type:'First Serve Return', pct:'31%', avg:'28%', status:'🟢' },{ type:'Second Serve Return', pct:'58%', avg:'54%', status:'🟢' },{ type:'Body Serve Return', pct:'49%', avg:'47%', status:'🟢' }].map((r,i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                  <span className="text-xs text-gray-300">{r.type}</span>
                  <div className="flex items-center gap-2"><span className="text-xs font-bold text-white">Won {r.pct}</span><span className="text-[10px] text-gray-500">(tour avg {r.avg})</span><span>{r.status}</span></div>
                </div>
              ))}
            </div>
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Return Direction</div>
              {[{ dir:'Down the line', pct:'34%', note:'' },{ dir:'Crosscourt', pct:'51%', note:'← dominant' },{ dir:'Lob/defensive', pct:'15%', note:'' }].map((r,i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                  <span className="text-xs text-gray-300">{r.dir}</span>
                  <div className="flex items-center gap-2"><span className="text-xs font-bold text-white">{r.pct}</span>{r.note && <span className="text-[10px] text-purple-400">{r.note}</span>}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Surface Breakdown</div>
            <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-gray-800"><th className="text-left p-2 text-gray-500"></th><th className="text-center p-2 text-orange-400">Clay</th><th className="text-center p-2 text-blue-400">Hard</th><th className="text-center p-2 text-green-400">Grass</th></tr></thead><tbody><tr className="border-b border-gray-800/50"><td className="p-2 text-gray-400">Return %</td><td className="text-center p-2 text-white font-bold">48%</td><td className="text-center p-2 text-white font-bold">41%</td><td className="text-center p-2 text-white font-bold">38%</td></tr><tr><td className="p-2 text-gray-400">BPs Conv</td><td className="text-center p-2 text-white font-bold">42%</td><td className="text-center p-2 text-white font-bold">35%</td><td className="text-center p-2 text-white font-bold">31%</td></tr></tbody></table></div>
          </div>
          <div className="bg-[#0d0f1a] border border-purple-600/20 rounded-xl p-4 flex items-start gap-3">
            <span className="text-lg flex-shrink-0">💡</span>
            <p className="text-xs text-gray-300 leading-relaxed">Your crosscourt return is a weapon on clay — opponents are avoiding your backhand return side. On hard courts, second serve return aggression drops — consider stepping in earlier.</p>
          </div>
        </div>
      )}

      {perfTab === 'pressure' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[{ label:'BPs Saved', value:'67%', color:'#22C55E' },{ label:'Tiebreaks Won', value:'71%', color:'#0ea5e9' },{ label:'3rd Set Record', value:'W8 L3', color:'#8B5CF6' },{ label:'Pressure Rating', value:'78', color:'#F59E0B' }].map((s,i) => (
              <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4"><div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div><div className="text-xs text-gray-400 mt-0.5">{s.label}</div></div>
            ))}
          </div>
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Pressure Moment Breakdown</div>
            {[{ n:1, label:'30-40 points won', pct:'54%', status:'🟢', note:'(tour avg 48%)' },{ n:2, label:'Deuce points won', pct:'61%', status:'🟢', note:'' },{ n:3, label:'Ad-out conversion', pct:'58%', status:'🟡', note:'' },{ n:4, label:'1st serve % in pressure', pct:'59%', status:'🟡', note:'(drops 9% vs normal)' },{ n:5, label:'Double faults under pressure', pct:'1.8/match', status:'🔴', note:'(needs work)' }].map(p => (
              <div key={p.n} className="flex items-center justify-between py-2.5 border-b border-gray-800/50 last:border-0">
                <div className="flex items-center gap-3"><span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400">{p.n}</span><span className="text-xs text-gray-300">{p.label}</span></div>
                <div className="flex items-center gap-2"><span className="text-xs font-bold text-white">{p.pct}</span><span>{p.status}</span>{p.note && <span className="text-[10px] text-gray-500">{p.note}</span>}</div>
              </div>
            ))}
          </div>
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Tiebreak History — Last 7</div>
            <div className="flex items-center justify-center gap-2">
              {['W','W','L','W','W','L','W'].map((r,i) => (
                <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${r === 'W' ? 'bg-teal-600/30 text-teal-400' : 'bg-red-600/30 text-red-400'}`}>{r}</div>
              ))}
            </div>
            <div className="text-center text-[10px] text-gray-500 mt-2">71% win rate — top 20 on tour</div>
          </div>
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Mental Performance Radar</div>
            <div className="flex justify-center">
              <svg viewBox="0 0 200 200" className="w-48 h-48">
                {/* Background pentagons */}
                {[1, 0.75, 0.5, 0.25].map((scale, si) => {
                  const pts = [0,1,2,3,4].map(i => { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; return `${100 + Math.cos(a) * 80 * scale},${100 + Math.sin(a) * 80 * scale}` }).join(' ')
                  return <polygon key={si} points={pts} fill="none" stroke="#374151" strokeWidth="0.5" />
                })}
                {[0,1,2,3,4].map(i => { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; return <line key={i} x1="100" y1="100" x2={100 + Math.cos(a) * 80} y2={100 + Math.sin(a) * 80} stroke="#374151" strokeWidth="0.5" /> })}
                {/* Data polygon */}
                {(() => {
                  const scores = [82, 74, 79, 71, 76]
                  const pts = scores.map((s, i) => { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; const r = (s / 100) * 80; return `${100 + Math.cos(a) * r},${100 + Math.sin(a) * r}` }).join(' ')
                  return <polygon points={pts} fill="rgba(139,92,246,0.2)" stroke="#8B5CF6" strokeWidth="1.5" />
                })()}
                {/* Labels */}
                {['Composure','Aggression','Consistency','Recovery','Clutch'].map((label, i) => {
                  const a = (i / 5) * Math.PI * 2 - Math.PI / 2
                  const scores = [82, 74, 79, 71, 76]
                  return <g key={i}><text x={100 + Math.cos(a) * 95} y={100 + Math.sin(a) * 95} textAnchor="middle" fill="#9CA3AF" fontSize="8">{label}</text><text x={100 + Math.cos(a) * 95} y={100 + Math.sin(a) * 95 + 10} textAnchor="middle" fill="#8B5CF6" fontSize="8" fontWeight="bold">{scores[i]}</text></g>
                })}
              </svg>
            </div>
          </div>
          <div className="bg-[#0d0f1a] border border-purple-600/20 rounded-xl p-4 flex items-start gap-3">
            <span className="text-lg flex-shrink-0">💡</span>
            <p className="text-xs text-gray-300 leading-relaxed">Your tiebreak record is elite — 71% is top 20 on tour. Biggest pressure leak is first serve percentage dropping under pressure. Coach Bianchi has flagged a pre-serve routine reset for next session.</p>
          </div>
        </div>
      )}
      <TennisAISection context="performance" player={player} session={session} />
    </div>
  );
}

// ─── MATCH PREP VIEW ───────────────────────────────────────────────────────────

// ─── SHOT HEATMAPS VIEW ──────────────────────────────────────────────────────
function ShotHeatmapsView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const [heatmapTab, setHeatmapTab] = useState<'serve' | 'return' | 'groundstroke' | 'net'>('serve');
  const [handFilter, setHandFilter] = useState<string>('all');
  const [surfaceFilter, setSurfaceFilter] = useState<string>('all');
  const [showTourAvg, setShowTourAvg] = useState(false);
  const [dfTab, setDfTab] = useState<'all' | 'pressure'>('pressure');
  const doubleFaultData = {
    all: [
      { zone: 'Wide (Deuce)', count: 28, pct: 32, description: 'Misses wide on T serve', pressure: false },
      { zone: 'Long (Deuce)', count: 24, pct: 27, description: 'Goes long under pressure', pressure: true },
      { zone: 'Net (Ad)', count: 19, pct: 22, description: 'Nets on wide serve to ad court', pressure: false },
      { zone: 'Long (Ad)', count: 17, pct: 19, description: 'Body serve goes long', pressure: true },
    ],
    pressure: [
      { zone: 'Long (Deuce)', count: 18, pct: 52, description: '30-40 pressure — goes long to deuce', pressure: true },
      { zone: 'Long (Ad)', count: 9, pct: 26, description: 'Advantage point — body serve long', pressure: true },
      { zone: 'Wide (Ad)', count: 5, pct: 14, description: 'Ad court wide miss under pressure', pressure: true },
      { zone: 'Net (Deuce)', count: 3, pct: 9, description: 'Nets kicker to deuce — rare', pressure: false },
    ],
  };
  const currentDFData = dfTab === 'pressure' ? doubleFaultData.pressure : doubleFaultData.all;

  const CourtSVG = ({ children }: { children?: React.ReactNode }) => (
    <svg viewBox="0 0 300 540" className="w-full max-w-[300px] mx-auto" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>
      {/* Court surface */}
      <rect x="0" y="0" width="300" height="540" rx="4" fill="#1a6b3c" />
      {/* Doubles sidelines */}
      <line x1="10" y1="10" x2="10" y2="530" stroke="white" strokeWidth="1.5" />
      <line x1="290" y1="10" x2="290" y2="530" stroke="white" strokeWidth="1.5" />
      {/* Singles sidelines */}
      <line x1="40" y1="10" x2="40" y2="530" stroke="white" strokeWidth="1" />
      <line x1="260" y1="10" x2="260" y2="530" stroke="white" strokeWidth="1" />
      {/* Baselines */}
      <line x1="10" y1="10" x2="290" y2="10" stroke="white" strokeWidth="2" />
      <line x1="10" y1="530" x2="290" y2="530" stroke="white" strokeWidth="2" />
      {/* Net */}
      <line x1="0" y1="270" x2="300" y2="270" stroke="white" strokeWidth="3" />
      {/* Service lines */}
      <line x1="40" y1="140" x2="260" y2="140" stroke="white" strokeWidth="1" />
      <line x1="40" y1="400" x2="260" y2="400" stroke="white" strokeWidth="1" />
      {/* Centre service lines */}
      <line x1="150" y1="140" x2="150" y2="270" stroke="white" strokeWidth="1" />
      <line x1="150" y1="270" x2="150" y2="400" stroke="white" strokeWidth="1" />
      {/* Centre marks */}
      <line x1="150" y1="10" x2="150" y2="20" stroke="white" strokeWidth="1" />
      <line x1="150" y1="520" x2="150" y2="530" stroke="white" strokeWidth="1" />
      {children}
    </svg>
  );

  const serveHeatmap = (
    <CourtSVG>
      {/* 1st serve - T serve deuce court (high frequency) */}
      <ellipse cx="140" cy="170" rx="28" ry="22" fill="#1D9E75" opacity="0.6" />
      <ellipse cx="140" cy="170" rx="18" ry="14" fill="#1D9E75" opacity="0.4" />
      {/* 1st serve - Wide serve ad court (high frequency) */}
      <ellipse cx="245" cy="360" rx="28" ry="22" fill="#1D9E75" opacity="0.6" />
      <ellipse cx="245" cy="360" rx="18" ry="14" fill="#1D9E75" opacity="0.4" />
      {/* Body serve both courts (medium frequency) */}
      <ellipse cx="150" cy="180" rx="18" ry="15" fill="#EF9F27" opacity="0.45" />
      <ellipse cx="150" cy="370" rx="18" ry="15" fill="#EF9F27" opacity="0.45" />
      {/* 2nd serve kick - near T both sides */}
      <ellipse cx="145" cy="200" rx="15" ry="12" fill="#EF9F27" opacity="0.35" />
      <ellipse cx="155" cy="350" rx="15" ry="12" fill="#EF9F27" opacity="0.35" />
      {showTourAvg && (
        <>
          <ellipse cx="140" cy="175" rx="32" ry="26" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 3" opacity="0.3" />
          <ellipse cx="240" cy="365" rx="32" ry="26" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 3" opacity="0.3" />
        </>
      )}
    </CourtSVG>
  );

  const returnHeatmap = (
    <CourtSVG>
      {/* Crosscourt forehand return (high frequency) */}
      <ellipse cx="80" cy="50" rx="30" ry="20" fill="#1D9E75" opacity="0.55" />
      <ellipse cx="80" cy="50" rx="18" ry="12" fill="#1D9E75" opacity="0.35" />
      {/* Down-the-line backhand (medium frequency) */}
      <ellipse cx="230" cy="55" rx="22" ry="16" fill="#EF9F27" opacity="0.45" />
      {/* Chip-and-charge return (low frequency near net) */}
      <ellipse cx="150" cy="240" rx="16" ry="12" fill="#EF9F27" opacity="0.25" />
      {showTourAvg && (
        <>
          <ellipse cx="85" cy="55" rx="34" ry="24" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 3" opacity="0.3" />
          <ellipse cx="225" cy="60" rx="26" ry="20" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 3" opacity="0.3" />
        </>
      )}
    </CourtSVG>
  );

  const groundstrokeHeatmap = (
    <CourtSVG>
      {/* Forehand: behind baseline on backhand side (offensive) */}
      <ellipse cx="200" cy="500" rx="40" ry="20" fill="#1D9E75" opacity="0.4" />
      {/* Backhand: near centre mark (neutral) */}
      <ellipse cx="140" cy="510" rx="35" ry="18" fill="#6b7280" opacity="0.35" />
      {/* Defensive zone: deep corners */}
      <ellipse cx="60" cy="520" rx="25" ry="14" fill="#f87171" opacity="0.3" />
      <ellipse cx="250" cy="520" rx="25" ry="14" fill="#f87171" opacity="0.25" />
      {/* Legend markers */}
      {showTourAvg && (
        <>
          <ellipse cx="195" cy="505" rx="44" ry="24" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 3" opacity="0.3" />
        </>
      )}
    </CourtSVG>
  );

  const netHeatmap = (
    <CourtSVG>
      {/* Net approach zones */}
      <ellipse cx="100" cy="290" rx="25" ry="18" fill="#1D9E75" opacity="0.45" />
      <ellipse cx="200" cy="290" rx="20" ry="15" fill="#EF9F27" opacity="0.35" />
      <ellipse cx="150" cy="285" rx="18" ry="14" fill="#EF9F27" opacity="0.3" />
      {showTourAvg && (
        <>
          <ellipse cx="150" cy="290" rx="50" ry="22" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 3" opacity="0.3" />
        </>
      )}
    </CourtSVG>
  );

  const heatmaps: Record<string, React.ReactNode> = { serve: serveHeatmap, return: returnHeatmap, groundstroke: groundstrokeHeatmap, net: netHeatmap };

  const statsStrips: Record<string, Array<{ label: string; value: string }>> = {
    serve: [
      { label: 'T', value: '42%' }, { label: 'Wide', value: '38%' }, { label: 'Body', value: '20%' },
      { label: '1st Serve %', value: '61%' }, { label: '2nd Serve Win%', value: '53%' },
      { label: 'Avg Speed', value: '201 km/h' }, { label: 'Max Speed', value: '226 km/h' },
    ],
    return: [
      { label: 'Crosscourt FH', value: '52%' }, { label: 'DTL BH', value: '28%' }, { label: 'Chip & Charge', value: '8%' },
      { label: 'Return Win%', value: '42%' }, { label: 'Break Pts Conv', value: '41%' },
    ],
    groundstroke: [
      { label: 'FH Winner Rate', value: '12%' }, { label: 'BH Winner Rate', value: '6%' },
      { label: 'Offensive %', value: '34%' }, { label: 'Neutral %', value: '48%' }, { label: 'Defensive %', value: '18%' },
    ],
    net: [
      { label: 'Net Approaches', value: '8.2/match' }, { label: 'Net Pts Won', value: '65%' },
      { label: 'Pass Against', value: '28%' }, { label: 'Volley Winner', value: '42%' },
    ],
  };

  return (
    <div className="space-y-6">

      <SectionHeader icon="🔥" title="Court Shot Heatmaps" subtitle="Visual shot placement analysis across serve, return, groundstrokes, and net play." />

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-[#0d0f1a] border border-gray-800 rounded-lg p-1 w-fit">
        {([['serve', 'Serve placement'], ['return', 'Return placement'], ['groundstroke', 'Groundstroke zones'], ['net', 'Net approaches']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setHeatmapTab(id)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${heatmapTab === id ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Court Diagram */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="flex justify-center">
          {heatmaps[heatmapTab]}
        </div>
        {heatmapTab === 'groundstroke' && (
          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-800 justify-center">
            {[
              { label: 'Offensive', color: 'bg-teal-500' },
              { label: 'Neutral', color: 'bg-gray-500' },
              { label: 'Defensive', color: 'bg-red-400' },
            ].map((l, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${l.color} opacity-50`}></div>
                <span className="text-[10px] text-gray-500">{l.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Strip */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
          {(statsStrips[heatmapTab] || []).map((s, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2 text-center">
              <div className="text-white font-bold text-sm">{s.value}</div>
              <div className="text-gray-500 text-[10px] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Toggles */}
      <div className="flex flex-wrap gap-2">
        {['vs Right-handed', 'vs Left-handed', 'On Clay', 'On Hard', 'On Grass'].map(f => (
          <button
            key={f}
            onClick={() => setSurfaceFilter(surfaceFilter === f ? 'all' : f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${surfaceFilter === f ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30' : 'bg-[#0d0f1a] border border-gray-800 text-gray-500 hover:text-gray-300'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tour Average Comparison */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowTourAvg(!showTourAvg)}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${showTourAvg ? 'border-teal-500 bg-teal-500/20' : 'border-gray-600'}`}
        >
          {showTourAvg && <span className="text-teal-400 text-xs">+</span>}
        </button>
        <span className="text-xs text-gray-400">vs Tour average (dotted outlines)</span>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-white">Double Fault Heatmap</div>
            <div className="text-xs text-gray-400 mt-0.5">Where Alex misses serves — overall vs pressure situations (30-40, AD)</div>
          </div>
          <div className="flex gap-1 bg-[#0a0c14] border border-gray-800 rounded-lg p-1">
            {([['all','All DFs'],['pressure','Under Pressure']] as const).map(([id,label])=>(
              <button key={id} onClick={()=>setDfTab(id)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${dfTab===id?'bg-red-600/20 text-red-400 border border-red-600/30':'text-gray-500 hover:text-gray-300'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <svg viewBox="0 0 300 180" className="w-full max-w-xs mx-auto">
              <rect x="20" y="20" width="260" height="140" fill="#0a0c14" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
              <rect x="20" y="77" width="260" height="3" fill="white" opacity="0.6"/>
              <line x1="150" y1="77" x2="150" y2="160" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
              <line x1="20" y1="77" x2="150" y2="77" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
              {[
                {x:30,y:20,w:120,h:57,opacity:0.15,color:'#EF4444'},
                {x:155,y:20,w:120,h:57,opacity:0.12,color:'#F97316'},
                {x:30,y:82,w:55,h:75,opacity:0.1,color:'#EF4444'},
                {x:90,y:82,w:55,h:75,opacity:0.08,color:'#F97316'},
              ].map((z,i)=>(
                <rect key={i} x={z.x} y={z.y} width={z.w} height={z.h} fill={z.color} opacity={z.opacity} rx="2"/>
              ))}
              <text x="150" y="175" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8">BASELINE (server)</text>
              <text x="150" y="14" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8">SERVICE BOX</text>
            </svg>
          </div>
          <div className="space-y-2">
            {currentDFData.map((z,i)=>(
              <div key={i} className={`p-3 rounded-lg border ${z.pressure?'border-red-600/20 bg-red-900/10':'border-gray-700 bg-[#0a0c14]'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-white">{z.zone}</span>
                  <span className="text-sm font-bold text-red-400">{z.pct}%</span>
                </div>
                <div className="text-[10px] text-gray-400 mb-1">{z.description} · {z.count} DFs</div>
                <div className="w-full bg-gray-800 rounded-full h-1">
                  <div className="bg-red-500 h-1 rounded-full" style={{width:`${z.pct}%`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 p-3 bg-orange-900/20 border border-orange-600/20 rounded-lg">
          <div className="text-xs text-orange-400 font-medium mb-1">Marco&apos;s Serve Fix — Pressure Situations</div>
          <div className="text-xs text-gray-300">Under pressure (30-40), 73% of double faults go long to deuce court — a specific pattern triggered by going for too much. Fix: at 30-40, default to kick serve to the body, 165km/h, not the flat T serve. Percentage play eliminates the long miss.</div>
        </div>
      </div>
      <TennisAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── PERFORMANCE RATING VIEW ─────────────────────────────────────────────────
function PerformanceRatingView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const matchData = [
    { opp: 'Alc', rating: 61 }, { opp: 'Med', rating: 73 }, { opp: 'Rub', rating: 58 },
    { opp: 'Fri', rating: 79 }, { opp: 'Nda', rating: 44 }, { opp: 'Zve', rating: 68 },
    { opp: 'Ber', rating: 72 }, { opp: 'Cas', rating: 55 }, { opp: 'Muz', rating: 66 }, { opp: 'Rub2', rating: 71 },
  ];
  const seasonAvg = 64.1;
  const tourAvg = 62.0;

  const winningPatterns = [
    { pattern: 'Serve wide + forehand winner', occurrences: 31, winRate: '79%', insight: 'Your signature pattern' },
    { pattern: 'Short ball attack → approach + volley', occurrences: 18, winRate: '72%', insight: 'Highly effective' },
    { pattern: 'Return crosscourt + inside-out forehand', occurrences: 24, winRate: '68%', insight: 'Strong' },
  ];

  const losingPatterns = [
    { pattern: 'Extended baseline rally >8 shots on clay', occurrences: 47, winRate: '38%', insight: 'Avoid long exchanges' },
    { pattern: 'Second serve + backhand return', occurrences: 38, winRate: '41%', insight: 'Vulnerable spot' },
    { pattern: 'Net approach off weak ball', occurrences: 12, winRate: '33%', insight: 'Timing needs work' },
  ];

  // SVG chart dimensions
  const chartW = 500, chartH = 180, padL = 30, padR = 80, padT = 15, padB = 30;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  return (
    <div className="space-y-6">

      <SectionHeader icon="⭐" title="Performance Rating" subtitle="TennisViz-style performance metric combining shot quality, attack rate, and conversion efficiency." />

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
        <div className="text-xs text-gray-500">TennisViz-style performance metric combining shot quality, attack rate, and conversion efficiency. Updated after each match.</div>
      </div>

      {/* Current Rating */}
      <div className="bg-gradient-to-r from-purple-900/30 to-teal-900/20 border border-purple-600/30 rounded-xl p-6 text-center">
        <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-2">Performance Rating</div>
        <div className="text-5xl font-bold text-white">68.4</div>
        <div className="text-lg text-gray-400">/ 100</div>
        <div className="flex justify-center gap-6 mt-3 text-xs">
          <div><span className="text-gray-500">Season avg:</span> <span className="text-amber-400 font-medium">64.1</span></div>
          <div><span className="text-gray-500">Career high:</span> <span className="text-teal-400 font-medium">79.2</span> <span className="text-gray-600">(Wimbledon 2023 SF)</span></div>
          <div><span className="text-gray-500">Trend:</span> <span className="text-teal-400 font-medium">+4.3</span> <span className="text-gray-600">vs last 4 weeks</span></div>
        </div>
      </div>

      {/* Component Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Attack Rate', value: '54%', tourAvg: '48%', badge: 'Above average' },
          { label: 'Conversion Score', value: '61%', tourAvg: '58%', badge: 'Above average' },
          { label: 'Steal Score', value: '34%', tourAvg: '31%', badge: 'Above average' },
        ].map((c, i) => (
          <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">{c.label}</div>
            <div className="text-2xl font-bold text-white">{c.value}</div>
            <div className="text-xs text-gray-500 mt-1">Tour avg: {c.tourAvg}</div>
            <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-teal-600/20 text-teal-400 border border-teal-600/30">{c.badge}</span>
          </div>
        ))}
      </div>

      {/* Match-by-Match Line Chart */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Match-by-Match Performance Rating</div>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
          {/* Y-axis grid lines */}
          {[0, 25, 50, 75, 100].map(v => {
            const y = padT + plotH - (v / 100) * plotH;
            return (
              <g key={v}>
                <line x1={padL} y1={y} x2={padL + plotW} y2={y} stroke="#1f2937" strokeWidth="0.5" />
                <text x={padL - 5} y={y + 3} textAnchor="end" fill="#6b7280" fontSize="8">{v}</text>
              </g>
            );
          })}
          {/* Season average dashed line */}
          <line x1={padL} y1={padT + plotH - (seasonAvg / 100) * plotH} x2={padL + plotW} y2={padT + plotH - (seasonAvg / 100) * plotH} stroke="#EF9F27" strokeWidth="1" strokeDasharray="6 3" />
          <text x={padL + plotW + 5} y={padT + plotH - (seasonAvg / 100) * plotH + 3} fill="#EF9F27" fontSize="8">Season avg ({seasonAvg})</text>
          {/* Tour average dashed line */}
          <line x1={padL} y1={padT + plotH - (tourAvg / 100) * plotH} x2={padL + plotW} y2={padT + plotH - (tourAvg / 100) * plotH} stroke="#4b5563" strokeWidth="1" strokeDasharray="4 3" />
          <text x={padL + plotW + 5} y={padT + plotH - (tourAvg / 100) * plotH + 3} fill="#6b7280" fontSize="8">Tour avg ({tourAvg})</text>
          {/* Data polyline */}
          <polyline
            fill="none"
            stroke="#1D9E75"
            strokeWidth="2"
            strokeLinejoin="round"
            points={matchData.map((d, i) => `${padL + (i / (matchData.length - 1)) * plotW},${padT + plotH - (d.rating / 100) * plotH}`).join(' ')}
          />
          {/* Data dots and labels */}
          {matchData.map((d, i) => {
            const x = padL + (i / (matchData.length - 1)) * plotW;
            const y = padT + plotH - (d.rating / 100) * plotH;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="3.5" fill="#1D9E75" stroke="#0d0f1a" strokeWidth="1.5" />
                <text x={x} y={padT + plotH + 15} textAnchor="middle" fill="#6b7280" fontSize="7">{d.opp}</text>
              </g>
            );
          })}
          {/* Rating label at end */}
          <text x={padL + plotW + 5} y={padT + plotH - (matchData[matchData.length - 1].rating / 100) * plotH + 3} fill="#1D9E75" fontSize="8" fontWeight="bold">Current ({matchData[matchData.length - 1].rating})</text>
        </svg>
      </div>

      {/* Winning & Losing Plays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Winning Patterns */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-white">Winning Patterns</div>
          {winningPatterns.map((p, i) => (
            <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4 border-l-4 border-l-teal-500">
              <div className="text-sm text-white font-medium mb-1">{p.pattern}</div>
              <div className="flex gap-3 text-xs text-gray-400">
                <span>{p.occurrences} occurrences</span>
                <span className="text-teal-400 font-medium">{p.winRate} win rate</span>
              </div>
              <div className="text-xs text-gray-500 mt-1 italic">{p.insight}</div>
            </div>
          ))}
        </div>

        {/* Losing Patterns */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-white">Losing Patterns</div>
          {losingPatterns.map((p, i) => (
            <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4 border-l-4 border-l-red-400">
              <div className="text-sm text-white font-medium mb-1">{p.pattern}</div>
              <div className="flex gap-3 text-xs text-gray-400">
                <span>{p.occurrences} occurrences</span>
                <span className="text-red-400 font-medium">{p.winRate} win rate</span>
              </div>
              <div className="text-xs text-gray-500 mt-1 italic">{p.insight}</div>
            </div>
          ))}
        </div>
      </div>
      <TennisAISection context="default" player={player} session={session} />
    </div>
  );
}
function MatchPrepView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const opponent = {
    name: 'Carlos Vega',
    flag: '🇪🇸',
    ranking: 34,
    age: 26,
    height: '6\'1"',
    plays: 'Right-handed',
    backhand: 'One-handed',
    coach: 'Luis Castaño',
    careerHigh: 18,
    surface: 'Clay',
    h2h: { overall: '3-1', clay: '3-0', hard: '0-1', grass: '0-0' },
  };

  const patterns = [
    { situation: 'Second serve reception', tendency: 'Attacks crosscourt backhand 73% of the time', threat: 'High' },
    { situation: 'Break point scenarios', tendency: 'Inside-out forehand to deuce side 65%', threat: 'High' },
    { situation: 'Net approach', tendency: 'Rarely approaches — baseline first (92%)', threat: 'Low' },
    { situation: 'Long rallies (8+ shots)', tendency: 'Win rate drops to 38% on clay — press rallies', threat: 'Opportunity' },
    { situation: 'Wide serve (deuce court)', tendency: 'Return tends to go back crosscourt — move early', threat: 'Medium' },
    { situation: 'Pressure points (30-30)', tendency: 'Goes for winner first ball — increases errors', threat: 'Opportunity' },
  ];

  return (
    <div className="space-y-6">

      <SectionHeader icon="🎯" title="Match Prep" subtitle="Opponent analysis, tactical briefing, H2H history, and coach notes." />

      {/* Opponent Card */}
      <div className="bg-gradient-to-r from-red-900/20 to-orange-900/10 border border-red-600/20 rounded-xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-red-600/20 border-2 border-red-500/30 flex items-center justify-center text-2xl">{opponent.flag}</div>
          <div>
            <div className="text-white font-bold text-xl">{opponent.name}</div>
            <div className="text-gray-400 text-sm">#{opponent.ranking} ATP . {opponent.height} . {opponent.plays} . {opponent.backhand} BH</div>
            <div className="text-gray-500 text-xs">Coach: {opponent.coach} . Career High: #{opponent.careerHigh}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-gray-500 mb-1">H2H Overall</div>
            <div className="text-2xl font-bold text-white">{opponent.h2h.overall}</div>
            <div className="text-xs text-teal-400">in your favour</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { surface: 'Clay', record: opponent.h2h.clay, color: 'orange' },
            { surface: 'Hard', record: opponent.h2h.hard, color: 'blue' },
            { surface: 'Grass', record: opponent.h2h.grass, color: 'green' },
          ].map((s, i) => (
            <div key={i} className="bg-black/20 rounded-lg p-3 text-center">
              <SurfaceBadge surface={s.surface} />
              <div className="text-white font-bold text-lg mt-2">{s.record}</div>
              <div className="text-xs text-gray-500">H2H</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tactical Patterns */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Opponent Patterns — Clay</div>
        <div className="space-y-3">
          {patterns.map((p, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-800/50">
              <div className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 mt-0.5 ${
                p.threat === 'High' ? 'bg-red-600/20 text-red-400' :
                p.threat === 'Medium' ? 'bg-yellow-600/20 text-yellow-400' :
                p.threat === 'Opportunity' ? 'bg-teal-600/20 text-teal-400' :
                'bg-gray-700 text-gray-400'
              }`}>{p.threat}</div>
              <div>
                <div className="text-sm text-white font-medium">{p.situation}</div>
                <div className="text-xs text-gray-400 mt-0.5">{p.tendency}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coach Notes */}
      <div className="bg-[#0d0f1a] border border-purple-600/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-purple-400 text-sm font-semibold">Coach Notes — Marco Bianchi</span>
          <span className="text-xs text-gray-600">Updated today 08:15</span>
        </div>
        <div className="text-gray-300 text-sm leading-relaxed space-y-3">
          <p>Vega is beatable on clay if you control the centre. His inside-out forehand is dangerous but he telegraphs it — if you step left early on break points, you can redirect down the line and he has no time.</p>
          <p>Target his backhand in long rallies. Above 8 shots, his win rate drops significantly. Avoid short-ball patterns — he punishes anything above the knee on the forehand side.</p>
          <p>Second serve out wide in the deuce court is the play. He returns crosscourt almost every time. Set up the next ball inside-in forehand. We have drilled this 40 times this week.</p>
          <p className="text-teal-400">Key: win the first set. He mentally disengages if he loses it.</p>
        </div>
      </div>
      <TennisAISection context="matchprep" player={player} session={session} />
    </div>
  );
}

// ─── PRACTICE LOG VIEW ─────────────────────────────────────────────────────────
function PracticeLogView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const [practiceTab, setPracticeTab] = useState<'log' | 'aiinsights' | 'progress'>('log');
  const [aiAnalysis, setAiAnalysis] = useState<Record<number, { loading: boolean; result: string | null }>>({});

  const sessions = [
    { date: '9 Apr', type: 'On-court', partner: 'J. Draper', duration: '90 min', coachNotes: 'Serve patterns: body serve % improved to 68%. Good session.' },
    { date: '8 Apr', type: 'On-court', partner: 'Hitting partner (Lucas)', duration: '75 min', coachNotes: 'Return drills — focusing on Vega deuce court patterns.' },
    { date: '7 Apr', type: 'Ball Machine', partner: '—', duration: '45 min', coachNotes: 'Forehand inside-in drill. 200 balls at match intensity.' },
    { date: '6 Apr', type: 'On-court', partner: 'C. Ruud', duration: '90 min', coachNotes: 'Match-play set. Won 6-4. Good clay movement.' },
    { date: '5 Apr', type: 'Movement', partner: '—', duration: '60 min', coachNotes: 'Movement patterns with Luis. Lateral agility focus.' },
    { date: '4 Apr', type: 'On-court', partner: 'T. Fritz', duration: '60 min', coachNotes: 'Short hit. Serve warm-up pre-Monte-Carlo.' },
    { date: '3 Apr', type: 'Ball Machine', partner: '—', duration: '30 min', coachNotes: 'Crosscourt backhand drills. Consistency above 85%.' },
  ];

  const drillTargets = [
    { drill: '1st Serve Accuracy', target: '68%', current: '63%', progress: 63 / 68 * 100 },
    { drill: 'Return % (deuce)', target: '55%', current: '51%', progress: 51 / 55 * 100 },
    { drill: 'Body Serve Rate', target: '30%', current: '28%', progress: 28 / 30 * 100 },
    { drill: 'Net Points Won', target: '72%', current: '65%', progress: 65 / 72 * 100 },
  ];

  const handleAiAnalysis = async (sessionIdx: number) => {
    setAiAnalysis(prev => ({ ...prev, [sessionIdx]: { loading: true, result: null } }));
    const practiceSession = sessions[sessionIdx];
    try {
      const response = await fetch('/api/ai/tennis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Analyse this tennis practice session for player Alex Rivera (ATP #67, right-handed, two-handed backhand). Session details: Date: ${practiceSession.date}, Type: ${practiceSession.type}, Duration: ${practiceSession.duration}, Partner: ${practiceSession.partner}, Coach notes: ${practiceSession.coachNotes}. Cover three specific technical observations, two areas to focus on next session, and one tactical pattern to develop. Be concise and specific to tennis. Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.`
          }],
        }),
      });
      const data = await response.json();
      const text = cleanResponse(data.content?.[0]?.text || 'Analysis unavailable.');
      setAiAnalysis(prev => ({ ...prev, [sessionIdx]: { loading: false, result: text } }));
    } catch {
      setAiAnalysis(prev => ({ ...prev, [sessionIdx]: { loading: false, result: 'Failed to generate analysis. Check API key configuration.' } }));
    }
  };

  return (
    <div className="space-y-6">

      <SectionHeader icon="📝" title="Practice Log" subtitle="Session tracking, drill targets, ball machine logs, and weekly practice hours." />

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0d0f1a] border border-gray-800 rounded-lg p-1 w-fit">
        {([['log', 'Log'], ['aiinsights', 'AI Insights'], ['progress', 'Progress']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setPracticeTab(id)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${practiceTab === id ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {practiceTab === 'log' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Sessions This Week" value="5" sub="12.5 hours total" color="purple" />
            <StatCard label="On-Court Hours" value="8.5h" sub="Target: 10h" color="teal" />
            <StatCard label="Ball Machine" value="1.25h" sub="275 balls" color="blue" />
            <StatCard label="Movement / Fitness" value="1h" sub="Luis programme" color="orange" />
          </div>

          {/* Session Log */}
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <div className="text-sm font-semibold text-white">Session Log — Last 7 Days</div>
            </div>
            <div className="divide-y divide-gray-800/50">
              {sessions.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center gap-3 p-3">
                    <div className="text-xs text-gray-400 w-14 flex-shrink-0">{s.date}</div>
                    <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${s.type === 'On-court' ? 'bg-teal-600/20 text-teal-400' : s.type === 'Ball Machine' ? 'bg-blue-600/20 text-blue-400' : 'bg-orange-600/20 text-orange-400'}`}>{s.type}</span>
                    <div className="text-sm text-gray-300 flex-shrink-0">{s.partner}</div>
                    <div className="text-xs text-gray-400 flex-shrink-0">{s.duration}</div>
                    <div className="text-xs text-gray-400 flex-1 truncate">{s.coachNotes}</div>
                    <button
                      onClick={() => handleAiAnalysis(i)}
                      disabled={aiAnalysis[i]?.loading}
                      className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30 hover:bg-purple-600/30 transition-colors disabled:opacity-50"
                    >
                      {aiAnalysis[i]?.loading ? 'Analysing...' : aiAnalysis[i]?.result ? 'Re-analyse' : 'AI Analysis'}
                    </button>
                  </div>
                  {aiAnalysis[i]?.loading && (
                    <div className="px-3 pb-3">
                      <div className="bg-purple-600/5 border border-purple-600/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs text-purple-400">
                          <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                          Analysing session...
                        </div>
                      </div>
                    </div>
                  )}
                  {aiAnalysis[i]?.result && !aiAnalysis[i]?.loading && (
                    <div className="px-3 pb-3">
                      <div className="bg-purple-600/5 border border-purple-600/20 rounded-lg p-3">
                        <div className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider mb-2">AI Analysis</div>
                        <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{aiAnalysis[i].result}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Drill Targets */}
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-4">Drill Targets — Current Season</div>
            <div className="space-y-4">
              {drillTargets.map((d, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm text-gray-200">{d.drill}</div>
                    <div className="text-xs text-gray-500">Current: <span className="text-white">{d.current}</span> / Target: <span className="text-teal-400">{d.target}</span></div>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="h-2 rounded-full bg-purple-500" style={{ width: `${Math.min(100, d.progress)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Practice Hours */}
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-4">Weekly Practice Hours (Last 6 Weeks)</div>
            <div className="flex items-end gap-3 h-32">
              {[8, 12, 10, 14, 11, 12.5].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs text-gray-400">{h}h</div>
                  <div className="w-full bg-purple-600/40 rounded-t" style={{ height: `${(h / 14) * 80}px` }}></div>
                  <div className="text-xs text-gray-600">W{i + 1}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {practiceTab === 'aiinsights' && (
        <>
          {/* Training Patterns This Month */}
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/20 border border-purple-600/30 rounded-xl p-5">
            <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-3">Training Patterns This Month</div>
            <div className="text-sm text-gray-300 leading-relaxed mb-3">
              Alex has focused predominantly on serve accuracy drills (38% of sessions), followed by return of serve patterns (24%) and clay court movement (18%). Ball machine sessions have targeted the forehand inside-in and crosscourt backhand. There has been increased emphasis on body serve percentage ahead of Monte-Carlo, with improvement from 22% to 28% — trending toward the 30% target.
            </div>
            <div className="grid grid-cols-4 gap-3 text-xs">
              {[
                { label: 'Serve Drills', pct: '38%', color: 'text-purple-400' },
                { label: 'Return Work', pct: '24%', color: 'text-teal-400' },
                { label: 'Movement', pct: '18%', color: 'text-orange-400' },
                { label: 'Match Play', pct: '20%', color: 'text-blue-400' },
              ].map((p, i) => (
                <div key={i} className="bg-black/20 rounded-lg p-2 text-center">
                  <div className={`font-bold text-lg ${p.color}`}>{p.pct}</div>
                  <div className="text-gray-500 mt-0.5">{p.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Readiness Score */}
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-4">Readiness Score</div>
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#1f2937" strokeWidth="8" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#1D9E75" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(74 / 100) * 314} 314`}
                    transform="rotate(-90 60 60)" />
                  <text x="60" y="55" textAnchor="middle" className="text-2xl font-bold" fill="white" fontSize="28">74</text>
                  <text x="60" y="72" textAnchor="middle" fill="#6b7280" fontSize="10">/100</text>
                </svg>
              </div>
              <div className="space-y-2 flex-1">
                <div className="text-sm text-gray-300">Based on session intensity, recovery days, and training load this week.</div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <div className="text-teal-400 font-bold">Good</div>
                    <div className="text-gray-500">Training Load</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <div className="text-amber-400 font-bold">Moderate</div>
                    <div className="text-gray-500">Recovery</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <div className="text-teal-400 font-bold">High</div>
                    <div className="text-gray-500">Match Ready</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coach Recommendations */}
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-4">Coach Recommendations — Based on Upcoming Clay Court Schedule</div>
            <div className="space-y-3">
              {[
                { rec: 'Increase clay-specific slide drills to 3 sessions/week ahead of Barcelona and Madrid swing', priority: 'High', icon: '🏟️' },
                { rec: 'Add 15 minutes of second-serve kick practice per on-court session — current 2nd serve win% of 53% needs to improve for clay', priority: 'High', icon: '🎾' },
                { rec: 'Schedule one practice set per week against a left-hander to prepare for potential left-handed matchup in Madrid', priority: 'Medium', icon: '🎯' },
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-800 bg-[#0a0c14]">
                  <span className="text-lg flex-shrink-0">{r.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm text-gray-200">{r.rec}</div>
                    <span className={`text-[10px] mt-1 inline-block px-2 py-0.5 rounded ${r.priority === 'High' ? 'bg-red-600/20 text-red-400' : 'bg-amber-600/20 text-amber-400'}`}>{r.priority} priority</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {practiceTab === 'progress' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Sessions This Week" value="5" sub="12.5 hours total" color="purple" />
            <StatCard label="On-Court Hours" value="8.5h" sub="Target: 10h" color="teal" />
            <StatCard label="Ball Machine" value="1.25h" sub="275 balls" color="blue" />
            <StatCard label="Movement / Fitness" value="1h" sub="Luis programme" color="orange" />
          </div>

          {/* Drill Targets */}
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-4">Drill Targets — Current Season</div>
            <div className="space-y-4">
              {drillTargets.map((d, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm text-gray-200">{d.drill}</div>
                    <div className="text-xs text-gray-500">Current: <span className="text-white">{d.current}</span> / Target: <span className="text-teal-400">{d.target}</span></div>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="h-2 rounded-full bg-purple-500" style={{ width: `${Math.min(100, d.progress)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Practice Hours */}
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-4">Weekly Practice Hours (Last 6 Weeks)</div>
            <div className="flex items-end gap-3 h-32">
              {[8, 12, 10, 14, 11, 12.5].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs text-gray-400">{h}h</div>
                  <div className="w-full bg-purple-600/40 rounded-t" style={{ height: `${(h / 14) * 80}px` }}></div>
                  <div className="text-xs text-gray-600">W{i + 1}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── VIDEO LIBRARY VIEW ────────────────────────────────────────────────────────

// ─── SWINGVISION CARDS ────────────────────────────────────────────────────────
function SwingVisionCards() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const svVideos = [
    {
      title: 'Match vs. Ferreira — Roland Garros',
      source: 'Imported from SwingVision',
      duration: '2h 14m',
      stats: { shots: 187, firstServe: '72%', aces: 3 },
      breakdown: [
        { label: 'Total Shots Tracked', value: '187' },
        { label: '1st Serve %', value: '72%' },
        { label: 'Aces', value: '3' },
        { label: 'Winners', value: '31' },
        { label: 'Unforced Errors', value: '24' },
        { label: 'Net Points Won', value: '68%' },
      ],
    },
    {
      title: 'Serve Practice Session — 45 min',
      source: 'SwingVision Auto-Track',
      duration: '45m',
      stats: { shots: 234, firstServe: '68% in', aces: null, avgSpeed: '201 km/h' },
      breakdown: [
        { label: 'Serves Tracked', value: '234' },
        { label: 'In %', value: '68%' },
        { label: 'Avg Speed', value: '201 km/h' },
        { label: 'Max Speed', value: '224 km/h' },
        { label: 'T Accuracy', value: '41%' },
        { label: 'Wide Accuracy', value: '37%' },
      ],
    },
    {
      title: 'Baseline Drill — Cross Court Forehands',
      source: 'SwingVision Auto-Track',
      duration: '30m',
      stats: { shots: 89, accuracy: '81%' },
      breakdown: [
        { label: 'Shot Sequences', value: '89' },
        { label: 'Accuracy', value: '81%' },
        { label: 'Avg Spin (RPM)', value: '2,450' },
        { label: 'Avg Speed', value: '118 km/h' },
        { label: 'Deep Ball %', value: '64%' },
        { label: 'Error Rate', value: '19%' },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {svVideos.map((v, i) => (
        <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
          <div className="h-28 flex items-center justify-center text-4xl relative" style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.15) 0%, rgba(13,148,136,0.1) 100%)' }}>
            🎬
            <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded bg-purple-600/30 text-purple-300 border border-purple-500/30 font-medium">SwingVision</span>
          </div>
          <div className="p-4">
            <div className="text-sm text-white font-medium mb-1">{v.title}</div>
            <div className="text-xs text-gray-500 mb-2">{v.source} — {v.duration}</div>
            <div className="flex gap-3 text-xs text-gray-400 mb-3">
              {v.stats.shots && <span>{v.stats.shots} shots tracked</span>}
              {v.stats.firstServe && <span>{v.stats.firstServe} first serve</span>}
              {v.stats.aces !== undefined && v.stats.aces !== null && <span>{v.stats.aces} aces</span>}
              {v.stats.accuracy && <span>{v.stats.accuracy} accuracy</span>}
              {v.stats.avgSpeed && <span>avg {v.stats.avgSpeed}</span>}
            </div>
            <button
              onClick={() => setExpandedCard(expandedCard === i ? null : i)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-600/20 text-teal-400 border border-teal-600/30 hover:bg-teal-600/30 transition-colors"
            >
              {expandedCard === i ? 'Hide Analysis' : 'View Analysis'}
            </button>
            {expandedCard === i && (
              <div className="mt-3 pt-3 border-t border-gray-800">
                <div className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider mb-2">Shot Breakdown</div>
                <div className="grid grid-cols-3 gap-2">
                  {v.breakdown.map((b, j) => (
                    <div key={j} className="bg-black/20 rounded-lg p-2 text-center">
                      <div className="text-white font-bold text-sm">{b.value}</div>
                      <div className="text-gray-500 text-[10px] mt-0.5">{b.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
function VideoLibraryView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const videos = [
    { title: 'Monte-Carlo R2 vs Hurkacz', category: 'Match Footage', date: '8 Apr 2026', duration: '1h 42m', tags: ['clay', 'win', 'M1000'] },
    { title: 'Monte-Carlo R1 vs Caballero', category: 'Match Footage', date: '7 Apr 2026', duration: '1h 18m', tags: ['clay', 'win', 'M1000'] },
    { title: 'Serve Pattern Drill — Body %', category: 'Practice Clips', date: '9 Apr 2026', duration: '12m', tags: ['serve', 'drill'] },
    { title: 'Rotterdam Final Highlights', category: 'Highlight Reels', date: '18 Feb 2026', duration: '8m', tags: ['indoor', 'title', 'ATP500'] },
    { title: 'Post-Match Debrief — Indian Wells QF', category: 'Post-match Debrief', date: '15 Mar 2026', duration: '22m', tags: ['hard', 'loss', 'debrief'] },
    { title: 'Vega Clay Footage (2025)', category: 'Opponent Analysis', date: '5 Apr 2026', duration: '34m', tags: ['opponent', 'clay'] },
    { title: 'Australian Open R4 vs Brenner', category: 'Match Footage', date: '22 Jan 2026', duration: '2h 48m', tags: ['hard', 'loss', 'GS'] },
    { title: 'Movement Patterns — Luis Session', category: 'Practice Clips', date: '5 Apr 2026', duration: '15m', tags: ['fitness', 'movement'] },
  ];

  const categoryColors: Record<string, string> = {
    'Match Footage': 'bg-purple-600/20 text-purple-400',
    'Practice Clips': 'bg-teal-600/20 text-teal-400',
    'Highlight Reels': 'bg-yellow-600/20 text-yellow-400',
    'Post-match Debrief': 'bg-blue-600/20 text-blue-400',
    'Opponent Analysis': 'bg-red-600/20 text-red-400',
  };

  return (
    <div className="space-y-6">

      <SectionHeader icon="🎬" title="Video Library" subtitle="Match footage, practice clips, highlight reels, and post-match debriefs." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Videos" value="47" sub="2026 season" color="purple" />
        <StatCard label="Match Footage" value="24" sub="Full matches" color="blue" />
        <StatCard label="Practice Clips" value="15" sub="Drill footage" color="teal" />
        <StatCard label="Debriefs" value="8" sub="Post-match analysis" color="orange" />
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-white">All Videos</div>
        <button className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-2 rounded-lg transition-colors">
          Upload Video
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map((v, i) => (
          <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
            <div className="h-28 flex items-center justify-center text-4xl" style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.15) 0%, rgba(13,148,136,0.1) 100%)' }}>
              🎬
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[v.category] || 'bg-gray-700 text-gray-400'}`}>{v.category}</span>
              </div>
              <div className="text-sm text-white font-medium mb-1">{v.title}</div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{v.date}</span>
                <span>{v.duration}</span>
              </div>
              <div className="flex gap-1 mt-2">
                {v.tags.map((tag, j) => (
                  <span key={j} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SwingVision Integration */}
      <div className="mt-8 space-y-4">
        <div className="text-sm font-semibold text-white">SwingVision Integration</div>

        {/* Connection Card */}
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/20 border border-purple-600/30 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center">
                <span className="text-xs font-bold text-purple-400">SV</span>
              </div>
              <div>
                <div className="text-white font-bold">SwingVision</div>
                <div className="text-xs text-gray-400">AI-powered shot tracking & analysis</div>
                <div className="text-xs text-red-400 mt-0.5">Not connected</div>
              </div>
            </div>
            <button className="px-4 py-2 rounded-lg text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30 hover:bg-purple-600/30 transition-colors">
              Connect SwingVision
            </button>
          </div>
        </div>

        {/* SwingVision Video Cards */}
        <SwingVisionCards />
      </div>
      <TennisAISection context="video" player={player} session={session} />
    </div>
  );
}

// ─── TEAM HUB VIEW ────────────────────────────────────────────────────────────
function TeamHubView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const team = [
    {
      role: 'Lead Coach', name: 'Marco Bianchi', flag: '🇮🇹',
      location: 'Travelling with player', status: 'On-site Monte-Carlo', statusColor: 'green',
      lastNote: 'Match prep uploaded . 08:15 today',
      responsibilities: ['Match tactics & opponent prep', 'Practice structure & drill design', 'In-match coaching (during changeovers)', 'Post-match debrief'],
    },
    {
      role: 'Physio', name: 'Sarah Okafor', flag: '🇬🇧',
      location: 'Travelling with player', status: 'Cleared for play', statusColor: 'green',
      lastNote: 'Shoulder treatment complete . 08:30',
      responsibilities: ['Pre & post-match treatment', 'Injury management & clearance', 'Strapping & on-court emergency cover', 'Recovery protocols'],
    },
    {
      role: 'Fitness Trainer', name: 'Luis Santos', flag: '🇧🇷',
      location: 'London (remote this event)', status: 'Remote', statusColor: 'blue',
      lastNote: 'Weekly conditioning plan uploaded',
      responsibilities: ['Physical conditioning & periodisation', 'Recovery protocols off-tour', 'Nutrition plan & meal structure', 'Pre-season fitness testing'],
    },
    {
      role: 'Agent', name: 'James Whitfield', flag: '🇬🇧',
      location: 'London (remote)', status: 'Apex Performance post pending', statusColor: 'yellow',
      lastNote: 'Caption drafted for Apex Performance post',
      responsibilities: ['Sponsorship negotiation & management', 'Schedule & appearance advice', 'Media & press coordination', 'Team assembly & contracts'],
    },
    {
      role: 'Stringer', name: 'Carlos Mendez', flag: '🇲🇨',
      location: 'Monte-Carlo stringing room', status: 'Confirmed 11:45', statusColor: 'green',
      lastNote: 'Clay setup sheet received',
      responsibilities: ['Racket tension management', 'Pre-match stringing (24/23kg clay)', 'Racket inventory on-site', 'Spare string stock management'],
    },
    {
      role: 'Mental Performance Coach', name: 'Dr. Aisha Patel', flag: '🇮🇳',
      location: 'Remote (call at 21:00)', status: 'Session tonight', statusColor: 'purple',
      lastNote: 'Post-match session booked',
      responsibilities: ['Competition psychology & routine', 'Pressure management protocols', 'Pre-match mindset preparation', 'Long-term mental conditioning'],
    },
  ];

  const statusColors: Record<string, string> = {
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  return (
    <div className="space-y-6">

      <SectionHeader icon="👥" title="Team Hub" subtitle="Full player team — role-specific feeds, shared data, and communication in one place." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.map((member, i) => (
          <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-lg">{member.flag}</div>
                <div>
                  <div className="text-white font-semibold">{member.name}</div>
                  <div className="text-xs text-purple-400">{member.role}</div>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[member.statusColor]}`}>{member.status}</span>
            </div>
            <div className="text-xs text-gray-500 mb-3">{member.location}</div>
            <div className="bg-black/20 rounded-lg p-2 mb-3">
              <div className="text-xs text-gray-400">{member.lastNote}</div>
            </div>
            <div className="space-y-1">
              {member.responsibilities.slice(0, 2).map((r, j) => (
                <div key={j} className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-gray-600 flex-shrink-0"></span>
                  {r}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <TennisAISection context="teamhub" player={player} session={session} />
    </div>
  );
}

// ─── PHYSIO VIEW ──────────────────────────────────────────────────────────────
function PhysioView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const totalMatches90d = MATCH_LOAD_DATA.reduce((a,w)=>a+w.matches,0);
  const totalHours90d = MATCH_LOAD_DATA.reduce((a,w)=>a+w.hours,0);
  const fatigueRisk = totalMatches90d > 20;
  const maxMatchesInWeek = Math.max(...MATCH_LOAD_DATA.map(w=>w.matches));
  const injuries = [
    { area: 'Right Shoulder', severity: 'Mild', status: 'Managed', date: '2 Apr', notes: 'Rotator cuff strain. Treated daily. Cleared for match play.', cleared: true },
    { area: 'Left Ankle', severity: 'Resolved', status: 'Clear', date: '15 Feb', notes: 'Sprain from Miami practice. Fully resolved.', cleared: true },
    { area: 'Lower Back', severity: 'Monitoring', status: 'Watch', date: 'Ongoing', notes: 'Chronic stiffness. Daily treatment, exercise programme active.', cleared: false },
  ];

  const recovery = [
    { date: 'Today', score: 82, hrv: 68, rhr: 48, sleep: 7.2, sleepScore: 76 },
    { date: 'Yesterday', score: 74, hrv: 61, rhr: 51, sleep: 6.8, sleepScore: 68 },
    { date: '2 days ago', score: 88, hrv: 74, rhr: 46, sleep: 8.1, sleepScore: 88 },
    { date: '3 days ago', score: 71, hrv: 58, rhr: 54, sleep: 6.4, sleepScore: 62 },
    { date: '4 days ago', score: 79, hrv: 65, rhr: 50, sleep: 7.0, sleepScore: 72 },
  ];

  return (
    <div className="space-y-6">

      <SectionHeader icon="⚕️" title="Physio & Recovery" subtitle="Injury log, medical clearance, WHOOP recovery scores, and treatment protocols." />

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-white">📊 Three-Month Match Load</div>
            <div className="text-xs text-gray-400 mt-0.5">Last 90 days — fatigue risk assessment per ATP Sports Science guidelines</div>
          </div>
          {fatigueRisk && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-600/30">⚠ HIGH LOAD</span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className={`p-3 rounded-lg border text-center ${fatigueRisk?'bg-red-900/10 border-red-600/20':'bg-green-900/10 border-green-600/20'}`}>
            <div className={`text-2xl font-bold ${fatigueRisk?'text-red-400':'text-green-400'}`}>{totalMatches90d}</div>
            <div className="text-xs text-gray-500">Matches (90d)</div>
            <div className={`text-[10px] mt-0.5 ${fatigueRisk?'text-red-400':'text-green-400'}`}>{fatigueRisk?'⚠ Over 20 — fatigue threshold':'✓ Under 20 — safe'}</div>
          </div>
          <div className="p-3 rounded-lg border bg-[#0a0c14] border-gray-800 text-center">
            <div className="text-2xl font-bold text-teal-400">{totalHours90d.toFixed(1)}h</div>
            <div className="text-xs text-gray-500">Match hours (90d)</div>
          </div>
          <div className="p-3 rounded-lg border bg-[#0a0c14] border-gray-800 text-center">
            <div className="text-2xl font-bold text-orange-400">{maxMatchesInWeek}</div>
            <div className="text-xs text-gray-500">Peak week matches</div>
          </div>
        </div>
        <div className="flex items-end gap-1 h-20 mb-2">
          {MATCH_LOAD_DATA.map((w,i)=>{
            const h=(w.matches/maxMatchesInWeek)*100;
            const col=w.matches>=4?'#EF4444':w.matches>=3?'#F97316':'#8B5CF6';
            return(
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full rounded-t" style={{height:`${h}%`,background:col,opacity:0.8}}/>
                <div className="text-[7px] text-gray-600" style={{fontSize:'6px'}}>{w.week}</div>
              </div>
            );
          })}
        </div>
        {fatigueRisk && (
          <div className="mt-3 p-3 bg-red-900/20 border border-red-600/20 rounded-lg text-xs text-red-300">
            <strong>Sarah Okafor recommendation:</strong> {totalMatches90d} matches in 90 days exceeds the 20-match fatigue threshold identified in ATP sports science research. Recommend voluntary withdrawal from a 250 event in the next 4 weeks to allow recovery. Target: reduce to ≤18 matches before Roland-Garros.
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Recovery Score" value="82/100" sub="Today (WHOOP)" color="green" />
        <StatCard label="HRV" value="68ms" sub="^7ms vs yesterday" color="teal" />
        <StatCard label="Resting HR" value="48 bpm" sub="Match day normal" color="blue" />
        <StatCard label="Sleep" value="7.2 hrs" sub="76 sleep score" color="purple" />
      </div>

      {/* WHOOP Recovery Chart */}
      <RecoveryChart />

      {/* Recovery Trend */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Recovery Trend — Last 5 Days</div>
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

      {/* Injury Log */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Injury Log</div>
        <div className="space-y-3">
          {injuries.map((inj, i) => (
            <div key={i} className={`p-4 rounded-lg border ${inj.cleared ? 'border-gray-800 bg-gray-900/20' : 'border-yellow-600/30 bg-yellow-600/5'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{inj.area}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${inj.severity === 'Resolved' ? 'bg-teal-600/20 text-teal-400' : inj.severity === 'Mild' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-blue-600/20 text-blue-400'}`}>{inj.severity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{inj.date}</span>
                  {inj.cleared && <span className="text-xs text-teal-400">Cleared</span>}
                </div>
              </div>
              <div className="text-xs text-gray-400">{inj.notes}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pre-Match Protocol */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Today's Pre-Match Protocol</div>
        <div className="space-y-2">
          {[
            { time: '12:00', task: 'Physio treatment — right shoulder' },
            { time: '12:15', task: 'Strapping application (right shoulder, both ankles)' },
            { time: '12:30', task: 'Dynamic warm-up — 15 min with Luis protocol' },
            { time: '12:50', task: 'Hitting warm-up on practice court — 10 min' },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
              <span className="text-gray-600 w-12">{t.time}</span>
              <span>{t.task}</span>
            </div>
          ))}
        </div>
      </div>
      <TennisAISection context="physiorecovery" player={player} session={session} />
    </div>
  );
}

// ─── NUTRITION & CONDITIONING VIEW ────────────────────────────────────────────
function NutritionView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const matchDayPlan = [
    { time: '07:00', meal: 'Breakfast', detail: 'Oats with banana + honey, 2 eggs, orange juice', kcal: 680, carbs: 95, protein: 28, fat: 14 },
    { time: '10:30', meal: 'Pre-match snack', detail: 'Rice cakes with peanut butter, energy gel, 500ml water + electrolytes', kcal: 340, carbs: 52, protein: 8, fat: 10 },
    { time: '13:00', meal: 'Match (on-court)', detail: 'Banana at changeover, energy gel every 45 min, 1L Precision Hydration 1000mg/hr', kcal: 320, carbs: 78, protein: 4, fat: 2 },
    { time: '16:30', meal: 'Post-match recovery', detail: 'Protein shake (40g whey), 750ml recovery drink, soreen malt loaf', kcal: 580, carbs: 72, protein: 46, fat: 10 },
    { time: '19:30', meal: 'Dinner', detail: 'Grilled chicken 200g, white rice 300g, roasted veg, olive oil', kcal: 820, carbs: 88, protein: 58, fat: 22 },
  ];
  const supplements = [
    { name: 'Vitamin D3', dose: '4000 IU', timing: 'Morning', status: 'taken', reason: 'Indoor season deficiency risk' },
    { name: 'Omega-3', dose: '3g EPA/DHA', timing: 'Morning', status: 'taken', reason: 'Anti-inflammatory' },
    { name: 'Creatine', dose: '5g', timing: 'Post-training', status: 'missed', reason: 'Power output maintenance' },
    { name: 'Magnesium Glycinate', dose: '400mg', timing: 'Evening', status: 'taken', reason: 'Sleep quality' },
    { name: 'Precision Hydration 1000', dose: '1 sachet/hr', timing: 'During match', status: 'taken', reason: 'Sodium replacement' },
    { name: 'Caffeine', dose: '200mg', timing: '60min pre-match', status: 'taken', reason: 'Performance + alertness' },
  ];
  const gpsCalories = GPS_SESSIONS_TENNIS[GPS_SESSIONS_TENNIS.length-1].load * 0.8;
  return (
    <div className="space-y-6">

      <SectionHeader icon="🥗" title="Nutrition & Conditioning" subtitle="Match-day plan, hydration, supplement tracker — Luis Santos programme" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Match Day Calories" value="2,740" sub="Target for today" color="orange" />
        <StatCard label="GPS Expenditure" value={`~${Math.round(gpsCalories)} kcal`} sub="Yesterday's session" color="teal" />
        <StatCard label="Hydration Target" value="5.2L" sub="Match day total" color="blue" />
        <StatCard label="Supplements" value={`${supplements.filter(s=>s.status==='taken').length}/${supplements.length}`} sub="Taken today" color="green" />
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800"><div className="text-sm font-semibold text-white">Match Day Nutrition Plan</div></div>
        <table className="w-full text-xs">
          <thead><tr className="text-gray-500 border-b border-gray-800 bg-[#0a0c14]">
            {['Time','Meal','Detail','kcal','Carbs','Protein','Fat'].map(h=><th key={h} className="px-4 py-2 text-left font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {matchDayPlan.map((m,i)=>(
              <tr key={i} className="border-b border-gray-800/50">
                <td className="px-4 py-2.5 text-purple-400 font-mono">{m.time}</td>
                <td className="px-4 py-2.5 text-white font-medium">{m.meal}</td>
                <td className="px-4 py-2.5 text-gray-400 max-w-xs">{m.detail}</td>
                <td className="px-4 py-2.5 text-yellow-400">{m.kcal}</td>
                <td className="px-4 py-2.5 text-blue-400">{m.carbs}g</td>
                <td className="px-4 py-2.5 text-red-400">{m.protein}g</td>
                <td className="px-4 py-2.5 text-gray-400">{m.fat}g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Supplement Compliance — Today</div>
        <div className="space-y-2">
          {supplements.map((s,i)=>(
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${s.status==='taken'?'bg-green-900/10 border-green-600/20':'bg-red-900/10 border-red-600/20'}`}>
              <span className="text-lg">{s.status==='taken'?'✅':'❌'}</span>
              <div className="flex-1">
                <div className="text-xs font-medium text-white">{s.name} · {s.dose}</div>
                <div className="text-[10px] text-gray-500">{s.timing} · {s.reason}</div>
              </div>
              <span className={`text-[10px] font-medium ${s.status==='taken'?'text-green-400':'text-red-400'}`}>{s.status==='taken'?'Taken':'Missed'}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Hydration Tracker</div>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-400 mb-2"><span>Today&apos;s intake</span><span className="text-teal-400 font-medium">3.1L / 5.2L target</span></div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div className="bg-gradient-to-r from-teal-500 to-blue-500 h-3 rounded-full" style={{width:'60%'}}/>
            </div>
            <div className="text-xs text-gray-500 mt-2">Precision Hydration 1000 during match — 1 sachet per hour</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-400">3.1L</div>
            <div className="text-xs text-gray-500">So far</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PRESSURE ANALYSIS VIEW ───────────────────────────────────────────────────
function PressureAnalysisView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const pressureStats = [
    { scenario: '30-40 (break point down)', winPct: 38, total: 89, won: 34, trend: 'down' },
    { scenario: 'Tiebreak games', winPct: 61, total: 46, won: 28, trend: 'up' },
    { scenario: 'Deciding set (3rd/5th)', winPct: 54, total: 35, won: 19, trend: 'neutral' },
    { scenario: 'Break point conversion', winPct: 44, total: 112, won: 49, trend: 'up' },
    { scenario: 'Set point saved', winPct: 42, total: 26, won: 11, trend: 'down' },
    { scenario: 'Match point saved', winPct: 33, total: 9, won: 3, trend: 'neutral' },
  ];
  const surfacePressure = [
    { surface: 'Clay', tiebreaks: 58, deciders: 51, breakPts: 41 },
    { surface: 'Hard', tiebreaks: 64, deciders: 57, breakPts: 46 },
    { surface: 'Grass', tiebreaks: 71, deciders: 63, breakPts: 52 },
  ];
  return (
    <div className="space-y-6">

      <SectionHeader icon="🔥" title="Pressure Analysis" subtitle="Performance at critical moments — break points, tiebreaks, deciding sets" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Tiebreak Win %" value="61%" sub="Above tour avg (54%)" color="green" />
        <StatCard label="Deciding Set W%" value="54%" sub="35 deciding sets played" color="teal" />
        <StatCard label="BP Conversion" value="44%" sub="112 break points" color="purple" />
        <StatCard label="30-40 Win %" value="38%" sub="⚠ Below avg — key area" color="red" />
        <StatCard label="BP Saved %" value="62%" sub="Serving under pressure" color="blue" />
        <StatCard label="Mental Rating" value="7.2/10" sub="Marco's assessment" color="orange" />
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800"><div className="text-sm font-semibold text-white">Critical Moment Win Rates — 2026 Season</div></div>
        <table className="w-full text-xs">
          <thead><tr className="text-gray-500 border-b border-gray-800 bg-[#0a0c14]">
            {['Scenario','Won','Total','Win %','Trend','Assessment'].map(h=><th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {pressureStats.map((s,i)=>(
              <tr key={i} className="border-b border-gray-800/50">
                <td className="px-4 py-2.5 text-white font-medium">{s.scenario}</td>
                <td className="px-4 py-2.5 text-gray-300">{s.won}</td>
                <td className="px-4 py-2.5 text-gray-400">{s.total}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-800 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${s.winPct>55?'bg-green-500':s.winPct>40?'bg-yellow-500':'bg-red-500'}`} style={{width:`${s.winPct}%`}}/>
                    </div>
                    <span className={`font-medium ${s.winPct>55?'text-green-400':s.winPct>40?'text-yellow-400':'text-red-400'}`}>{s.winPct}%</span>
                  </div>
                </td>
                <td className="px-4 py-2.5">{s.trend==='up'?'↑ ':s.trend==='down'?'↓ ':'→ '}<span className={s.trend==='up'?'text-green-400':s.trend==='down'?'text-red-400':'text-gray-400'}>{s.trend}</span></td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{s.winPct>55?'Strong — maintain':s.winPct>40?'Average — work on':'Priority — practice under pressure'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Pressure Performance by Surface</div>
        <div className="grid grid-cols-3 gap-4">
          {surfacePressure.map(s=>(
            <div key={s.surface} className="space-y-3">
              <div className="text-sm font-medium text-white text-center"><SurfaceBadge surface={s.surface}/></div>
              {[{l:'Tiebreaks',v:s.tiebreaks},{l:'Deciding Sets',v:s.deciders},{l:'Break Pts',v:s.breakPts}].map(stat=>(
                <div key={stat.l}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">{stat.l}</span><span className={stat.v>55?'text-green-400':stat.v>45?'text-yellow-400':'text-red-400'}>{stat.v}%</span></div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${stat.v>55?'bg-green-500':stat.v>45?'bg-yellow-500':'bg-red-500'}`} style={{width:`${stat.v}%`}}/></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-purple-900/20 border border-purple-600/30 rounded-xl p-5">
        <div className="text-sm font-semibold text-purple-400 mb-2">Marco&apos;s Pressure Assessment</div>
        <div className="text-xs text-gray-300 leading-relaxed">Alex&apos;s tiebreak record (61%) is above tour average and is a genuine weapon — especially on grass (71%). The main vulnerability is at 30-40 when serving: only 38% of these points are won. Mental trigger: at 30-40, default to kick serve to the body.</div>
      </div>
      <TennisAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── ACE TRACKER VIEW ─────────────────────────────────────────────────────────
const ACE_MILESTONES: { milestone: number; label: string; achieved: boolean; date: string | null; tournament: string | null }[] = [
  { milestone: 100, label: 'Century', achieved: true, date: 'Aug 2024', tournament: 'Cincinnati Masters' },
  { milestone: 200, label: 'Double Century', achieved: true, date: 'Mar 2026', tournament: 'Indian Wells' },
  { milestone: 250, label: '250 Club', achieved: false, date: null, tournament: null },
  { milestone: 300, label: '300 Career Aces', achieved: false, date: null, tournament: null },
  { milestone: 500, label: 'Elite 500', achieved: false, date: null, tournament: null },
];

const SIGNATURE_SHOTS = [
  { shot: 'T Serve (Deuce Court)', count: 847, winPct: 84, surface: 'All', description: 'Flat wide serve to T on deuce court — unreturnable at 220km/h+' },
  { shot: 'Inside-Out Forehand Winner', count: 312, winPct: 78, surface: 'Clay/Hard', description: 'Running forehand from backhand corner, inside-out to deuce court' },
  { shot: 'Drop Shot (Clay)', count: 156, winPct: 71, surface: 'Clay', description: 'Disguised backhand drop from baseline — triggers net battles' },
  { shot: 'Body Serve Return Winner', count: 89, winPct: 66, surface: 'All', description: 'Aggressive return off body serve — forehand block winner' },
];

function AceTrackerView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const careerAces = 214;
  const seasonAces = 87;
  const nextMilestone = ACE_MILESTONES.find(m=>!m.achieved);
  const acesToNext = nextMilestone ? nextMilestone.milestone - careerAces : 0;
  return (
    <div className="space-y-6">

      <SectionHeader icon="🎯" title="Ace & Signature Shot Tracker" subtitle="Career ace count, milestone tracking, and signature shot analytics" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Career Aces" value={careerAces} sub="All surfaces" color="purple" />
        <StatCard label="2026 Season" value={seasonAces} sub="This season" color="teal" />
        <StatCard label="Next Milestone" value={nextMilestone?.milestone || '—'} sub={`${acesToNext} aces away`} color="yellow" />
        <StatCard label="Ace Rate" value="7.2%" sub="Per service game" color="orange" />
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Career Ace Milestones</div>
        <div className="space-y-3">
          {ACE_MILESTONES.map((m,i)=>(
            <div key={i} className={`flex items-center gap-4 p-3 rounded-lg border ${m.achieved?'bg-green-900/10 border-green-600/20':'bg-[#0a0c14] border-gray-800'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${m.achieved?'bg-green-600 text-white':'bg-gray-800 text-gray-500'}`}>
                {m.achieved?'✓':m.milestone}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{m.label} — {m.milestone} aces</div>
                {m.achieved && <div className="text-xs text-green-400">{m.date} · {m.tournament}</div>}
                {!m.achieved && <div className="text-xs text-gray-500">{m === nextMilestone ? `${acesToNext} aces remaining` : 'Future milestone'}</div>}
              </div>
              {m === nextMilestone && (
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">Progress</div>
                  <div className="w-24 bg-gray-800 rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{width:`${(careerAces/m.milestone)*100}%`}}/>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{careerAces}/{m.milestone}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Signature Shots — Career Tracker</div>
        <div className="space-y-3">
          {SIGNATURE_SHOTS.map((s,i)=>(
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-medium text-white">{s.shot}</div>
                  <div className="text-xs text-gray-500">{s.surface}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-400">{s.count}</div>
                  <div className="text-[10px] text-gray-500">career count</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 mb-2">{s.description}</div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-gray-500">Point win rate</div>
                <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${s.winPct>75?'bg-green-500':s.winPct>60?'bg-yellow-500':'bg-red-500'}`} style={{width:`${s.winPct}%`}}/>
                </div>
                <div className={`text-xs font-medium ${s.winPct>75?'text-green-400':s.winPct>60?'text-yellow-400':'text-red-400'}`}>{s.winPct}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <TennisAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── RACKET & STRINGS VIEW ────────────────────────────────────────────────────
function RacketView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const [humidity, setHumidity] = useState(65);
  const tensionHistory = [
    { tournament: 'Monte-Carlo 2026', surface: 'Clay', humidity: 72, mains: 24, crosses: 23, result: 'QF', note: 'Good feel — Luxilon ALU 125' },
    { tournament: 'Indian Wells 2026', surface: 'Hard', humidity: 38, mains: 25, crosses: 24, result: 'R16', note: 'Dry conditions — extra 1kg for control' },
    { tournament: 'Australian Open 2026', surface: 'Hard', humidity: 55, mains: 24.5, crosses: 23.5, result: 'R32', note: 'Standard hard court setup' },
    { tournament: 'Wimbledon 2025', surface: 'Grass', humidity: 81, mains: 27, crosses: 26, result: 'QF', note: 'High tension for grass control — natural gut' },
    { tournament: 'US Open 2025', surface: 'Hard', humidity: 60, mains: 25, crosses: 24, result: 'R16', note: 'Humid NY conditions — slight reduction worked' },
  ];
  const getRec = (hum: number) => {
    if (hum > 80) return { mains: 27, crosses: 26, note: 'High humidity — max tension for control' };
    if (hum > 70) return { mains: 25.5, crosses: 24.5, note: 'Humid — increase 1kg over baseline' };
    if (hum > 55) return { mains: 24.5, crosses: 23.5, note: 'Moderate — standard setup' };
    if (hum > 40) return { mains: 24, crosses: 23, note: 'Dry — baseline clay setup' };
    return { mains: 25, crosses: 24, note: 'Very dry — harder court feel, increase tension' };
  };
  const rec = getRec(humidity);

  const setupSheet = [
    { tournament: 'Monte-Carlo 2026 (current)', surface: 'Clay', string: 'Luxilon ALU Power 125', mains: '24 kg', crosses: '23 kg', grips: '2 overgrips', tension: 'Mains loose — high humidity', alt: '24.5/23.5 if dry day' },
    { tournament: 'Madrid Open 2026', surface: 'Clay', string: 'Luxilon ALU Power 125', mains: '24 kg', crosses: '23 kg', grips: '2 overgrips', tension: 'Standard clay', alt: '' },
    { tournament: 'Roland-Garros 2026', surface: 'Clay', string: 'Luxilon ALU Power Rough 125', mains: '23.5 kg', crosses: '23 kg', grips: '2 overgrips', tension: 'Extra bite for topspin', alt: '' },
    { tournament: 'Wimbledon 2026', surface: 'Grass', string: 'Babolat VS Natural Gut 130 (M) / Luxilon ALU 130 (X)', mains: '27 kg', crosses: '26 kg', grips: '1 overgrip', tension: 'Higher for control on grass', alt: '' },
    { tournament: 'US Open 2026', surface: 'Hard', string: 'Luxilon ALU Power 125', mains: '25 kg', crosses: '24 kg', grips: '2 overgrips', tension: 'Standard hard', alt: '' },
  ];

  const inventory = [
    { id: 'Frame A', model: 'Vanta Sports Blade 98 v9', weight: '305g strung', balance: '32cm', grip: 'L3', status: 'Match', location: 'On-site bag' },
    { id: 'Frame B', model: 'Vanta Sports Blade 98 v9', weight: '306g strung', balance: '32cm', grip: 'L3', status: 'Match', location: 'On-site bag' },
    { id: 'Frame C', model: 'Vanta Sports Blade 98 v9', weight: '304g strung', balance: '31.5cm', grip: 'L3', status: 'Practice', location: 'On-site bag' },
    { id: 'Frame D', model: 'Vanta Sports Blade 98 v9', weight: '305g strung', balance: '32cm', grip: 'L3', status: 'Spare', location: 'Hotel room' },
    { id: 'Frame E', model: 'Vanta Sports Blade 98 v9', weight: '303g strung', balance: '31cm', grip: 'L3', status: 'Transit', location: 'En route Barcelona' },
  ];

  return (
    <div className="space-y-6">

      <SectionHeader icon="🎾" title="Racket & String Management" subtitle="Digital setup sheet, tension log by tournament, stringer contacts, and racket inventory." />

      {/* Current Setup */}
      <div className="bg-gradient-to-r from-teal-900/30 to-teal-800/10 border border-teal-600/30 rounded-xl p-5">
        <div className="text-xs text-teal-400 font-semibold uppercase tracking-wider mb-2">CURRENT SETUP — MONTE-CARLO (CLAY)</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
          <StatCard label="String" value="ALU Power 125" color="teal" />
          <StatCard label="Mains Tension" value="24 kg" sub="53 lbs" color="teal" />
          <StatCard label="Crosses" value="23 kg" sub="51 lbs" color="teal" />
          <StatCard label="Stringing Time" value="11:45 today" sub="Carlos Mendez" color="teal" />
        </div>
        <div className="mt-3 text-xs text-gray-400">High humidity today — mains set at 24kg (1kg lower than usual for extra bite). If conditions change to dry, revert to 24.5kg.</div>
      </div>

      {/* Setup Sheet */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <div className="text-sm font-semibold text-white">Setup Sheet — 2026 Season</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
                <th className="text-left p-3">Tournament</th>
                <th className="text-left p-3">String</th>
                <th className="text-left p-3">Mains</th>
                <th className="text-left p-3">Crosses</th>
                <th className="text-left p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {setupSheet.map((s, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="p-3">
                    <div className="text-gray-300">{s.tournament}</div>
                    <SurfaceBadge surface={s.surface} />
                  </td>
                  <td className="p-3 text-gray-400">{s.string}</td>
                  <td className="p-3 text-white font-medium">{s.mains}</td>
                  <td className="p-3 text-white font-medium">{s.crosses}</td>
                  <td className="p-3 text-gray-500">{s.tension}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Racket Inventory */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Racket Inventory</div>
        <div className="space-y-2">
          {inventory.map((r, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800/50 text-sm">
              <div className="w-16 text-gray-400 font-mono text-xs">{r.id}</div>
              <div className="flex-1">
                <div className="text-gray-200">{r.model}</div>
                <div className="text-xs text-gray-500">{r.weight} . {r.balance} . Grip {r.grip}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${r.status === 'Match' ? 'bg-teal-600/20 text-teal-400' : r.status === 'Practice' ? 'bg-blue-600/20 text-blue-400' : r.status === 'Transit' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>{r.status}</span>
              <div className="text-xs text-gray-500 w-28 text-right">{r.location}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          <span>String budget YTD: <span className="text-white">GBP 1,240</span></span>
          <span>Avg strings/event: <span className="text-white">4</span></span>
          <span>Annual estimate: <span className="text-white">GBP 8,400</span></span>
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">🌡️ Humidity → Tension Advisor</div>
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Today&apos;s humidity</span>
            <span className="text-white font-medium">{humidity}%</span>
          </div>
          <input type="range" min={20} max={95} value={humidity} onChange={e=>setHumidity(Number(e.target.value))}
            className="w-full accent-purple-500"/>
          <div className="flex justify-between text-[10px] text-gray-600 mt-1"><span>20% (very dry)</span><span>95% (tropical)</span></div>
        </div>
        <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-4 mb-4">
          <div className="text-xs text-purple-400 font-semibold mb-2">Carlos&apos;s Recommendation — {humidity}% humidity</div>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="text-center"><div className="text-xl font-bold text-white">{rec.mains}kg</div><div className="text-[10px] text-gray-500">Mains tension</div></div>
            <div className="text-center"><div className="text-xl font-bold text-white">{rec.crosses}kg</div><div className="text-[10px] text-gray-500">Crosses tension</div></div>
          </div>
          <div className="text-xs text-gray-300">{rec.note}</div>
        </div>
        <div className="text-sm font-medium text-white mb-3">Historical: Humidity vs Tension Results</div>
        <div className="space-y-2">
          {tensionHistory.map((t,i)=>(
            <div key={i} className="flex items-center gap-3 text-xs p-2.5 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <SurfaceBadge surface={t.surface}/>
              <div className="flex-1">
                <div className="text-white">{t.tournament}</div>
                <div className="text-gray-500">{t.humidity}% humidity · {t.note}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-300">{t.mains}/{t.crosses}kg</div>
              </div>
              <div className={`text-[10px] font-medium px-2 py-0.5 rounded ${t.result==='QF'?'bg-green-600/20 text-green-400':'bg-gray-700 text-gray-400'}`}>{t.result}</div>
            </div>
          ))}
        </div>
      </div>
      <TennisAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── PLAYING PARTNERS VIEW ─────────────────────────────────────────────────────
function PlayingPartnersView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const hittingPartners = [
    { name: 'Lucas Moreau', ranking: 245, nationality: '🇫🇷', available: true, notes: 'Reliable clay hitter. Good baseline rallies. Available Monte-Carlo through Madrid.' },
    { name: 'Tom Henning', ranking: 312, nationality: '🇩🇪', available: true, notes: 'Strong serve. Good grass practice partner. Halle/Wimbledon stretch.' },
    { name: 'James Cooper', ranking: 178, nationality: '🇬🇧', available: false, notes: 'Based at NTC London. Pre-season and off-week hitting partner.' },
    { name: 'Alejandro Ruiz', ranking: 420, nationality: '🇪🇸', available: true, notes: 'Barcelona-based. Available for clay swing. Lefty — good variety.' },
  ];

  const sparringLog = [
    { date: '9 Apr', partner: 'Lucas Moreau', type: 'Full practice', notes: 'Serve pattern + crosscourt rally drill. 90 min.' },
    { date: '6 Apr', partner: 'C. Ruud', type: 'Match-play set', notes: 'Won 6-4. Good clay intensity.' },
    { date: '4 Apr', partner: 'T. Fritz', type: 'Short hit', notes: '60 min warm-up. Serve loosener.' },
    { date: '1 Apr', partner: 'Lucas Moreau', type: 'Full practice', notes: 'Return drills + point play. 75 min.' },
  ];

  const stringerContacts = [
    { venue: 'Monte-Carlo', stringer: 'Carlos Mendez', phone: '+377 612 345', notes: 'Preferred. Knows setup well.' },
    { venue: 'Barcelona', stringer: 'Miguel Herrero', phone: '+34 654 321', notes: 'Tournament stringer. Good quality.' },
    { venue: 'Roland-Garros', stringer: 'FFT Stringing Team', phone: '+33 1 4743 4800', notes: 'Tournament provided. Book 24h ahead.' },
    { venue: 'Wimbledon', stringer: 'Babolat UK Team', phone: '+44 20 7946 0958', notes: 'AELTC stringing room. Priority booking.' },
  ];

  return (
    <div className="space-y-6">

      <SectionHeader icon="🤜" title="Playing Partners" subtitle="Hitting partners, sparring logs, and stringer contact database." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Partners" value="4" sub="On rotation" color="purple" />
        <StatCard label="Sessions This Month" value="12" sub="Avg 3/week" color="teal" />
        <StatCard label="Stringer Contacts" value="8" sub="4 key venues" color="blue" />
        <StatCard label="Next Session" value="Today 10:00" sub="Lucas Moreau" color="orange" />
      </div>

      {/* Hitting Partner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hittingPartners.map((p, i) => (
          <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-xl">{p.nationality}</span>
                <div>
                  <div className="text-sm text-white font-medium">{p.name}</div>
                  <div className="text-xs text-gray-500">ATP #{p.ranking}</div>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.available ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                {p.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <div className="text-xs text-gray-400">{p.notes}</div>
          </div>
        ))}
      </div>

      {/* Sparring Log */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <div className="text-sm font-semibold text-white">Practice Sparring Log</div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Partner</th>
              <th className="text-left p-3">Session Type</th>
              <th className="text-left p-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {sparringLog.map((s, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="p-3 text-gray-400 text-xs">{s.date}</td>
                <td className="p-3 text-gray-200">{s.partner}</td>
                <td className="p-3 text-gray-400">{s.type}</td>
                <td className="p-3 text-gray-400 text-xs">{s.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stringer Contacts */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Stringer Contacts Database</div>
        <div className="space-y-3">
          {stringerContacts.map((c, i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-800/50 text-sm">
              <div className="w-28 text-gray-400 font-medium">{c.venue}</div>
              <div className="flex-1 text-gray-200">{c.stringer}</div>
              <div className="text-gray-500 text-xs">{c.phone}</div>
              <div className="text-gray-500 text-xs">{c.notes}</div>
            </div>
          ))}
        </div>
      </div>
      <TennisAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── DOUBLES VIEW ──────────────────────────────────────────────────────────────
function DoublesView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const doublesH2H = [
    { opponents: 'Mektic / Pavic', result: 'L', score: '4-6, 3-6', tournament: 'Australian Open 2026' },
    { opponents: 'Salisbury / Ram', result: 'W', score: '6-3, 7-6', tournament: 'Rotterdam 2026' },
    { opponents: 'Gonzalez / Roger-Vasselin', result: 'W', score: '7-5, 6-4', tournament: 'Dubai 2026' },
    { opponents: 'Arevalo / Rojer', result: 'L', score: '3-6, 6-7', tournament: 'Indian Wells 2026' },
  ];

  const doublesSchedule = [
    { tournament: 'Monte-Carlo', date: '6-12 Apr', partner: 'J. Draper', status: 'Active', round: 'QF' },
    { tournament: 'Barcelona', date: '13-19 Apr', partner: 'J. Draper', status: 'Entered', round: '—' },
    { tournament: 'Roland-Garros', date: '24 May-7 Jun', partner: 'TBD', status: 'Pending', round: '—' },
    { tournament: 'Wimbledon', date: '30 Jun-13 Jul', partner: 'J. Draper', status: 'Planned', round: '—' },
  ];

  return (
    <div className="space-y-6">

      <SectionHeader icon="🎭" title="Doubles" subtitle="Doubles ranking, partner info, schedule, and head-to-head stats." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Doubles Ranking" value={`#${player.doubles_ranking}`} sub="ATP Doubles" color="purple" />
        <StatCard label="Current Partner" value="J. Draper" sub="🇬🇧 Jack Draper" color="teal" />
        <StatCard label="Season Record" value="6W-3L" sub="67% win rate" color="blue" />
        <StatCard label="Doubles Titles" value="0" sub="Best: SF Rotterdam" color="orange" />
      </div>

      {/* Partner Card */}
      <div className="bg-gradient-to-r from-purple-900/30 to-teal-900/20 border border-purple-600/30 rounded-xl p-5">
        <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-3">CURRENT DOUBLES PARTNER</div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-purple-600/20 border-2 border-purple-500/40 flex items-center justify-center text-2xl">🇬🇧</div>
          <div>
            <div className="text-white font-bold text-lg">Jack Draper</div>
            <div className="text-gray-400 text-sm">#15 ATP Singles . #92 Doubles . Left-handed</div>
            <div className="text-gray-500 text-xs">Partnership since: January 2026</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-gray-500">Team Record</div>
            <div className="text-xl font-bold text-white">6-3</div>
            <div className="text-xs text-teal-400">67% win rate</div>
          </div>
        </div>
      </div>

      {/* Doubles Schedule */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <div className="text-sm font-semibold text-white">Doubles Schedule — 2026</div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Tournament</th>
              <th className="text-left p-3">Dates</th>
              <th className="text-left p-3">Partner</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Round</th>
            </tr>
          </thead>
          <tbody>
            {doublesSchedule.map((d, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="p-3 text-gray-200">{d.tournament}</td>
                <td className="p-3 text-gray-400 text-xs">{d.date}</td>
                <td className="p-3 text-gray-300">{d.partner}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${d.status === 'Active' ? 'bg-green-600/20 text-green-400' : d.status === 'Entered' ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>{d.status}</span>
                </td>
                <td className="p-3 text-gray-400">{d.round}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Doubles H2H */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Doubles H2H Stats — 2026</div>
        <div className="space-y-2">
          {doublesH2H.map((m, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800/50">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${m.result === 'W' ? 'bg-teal-600/20 text-teal-400' : 'bg-red-600/20 text-red-400'}`}>{m.result}</div>
              <div className="flex-1 text-sm text-gray-200">vs {m.opponents}</div>
              <div className="text-sm text-gray-400">{m.score}</div>
              <div className="text-xs text-gray-500">{m.tournament}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Grand Slam Doubles Entry */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Grand Slam Doubles Entry Status</div>
        <div className="space-y-2">
          {[
            { slam: 'Australian Open', status: 'Played — R2', partner: 'J. Draper' },
            { slam: 'Roland-Garros', status: 'Entry pending', partner: 'TBD' },
            { slam: 'Wimbledon', status: 'Planned entry', partner: 'J. Draper' },
            { slam: 'US Open', status: 'TBD', partner: 'TBD' },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 text-sm">
              <div className="text-gray-200">{s.slam}</div>
              <div className="text-gray-400">{s.partner}</div>
              <div className="text-xs text-gray-500">{s.status}</div>
            </div>
          ))}
        </div>
      </div>
      <TennisAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── SPONSORSHIP VIEW ─────────────────────────────────────────────────────────
function SponsorshipView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const deals = [
    {
      sponsor: 'Vanta Sports', category: 'Racket & Equipment', type: 'Equipment + Bonus', value: 'GBP 45,000/yr + bonuses', status: 'Active', expiry: 'Dec 2027', daysLeft: 638,
      obligations: ['Use Vanta Sports frames in all ATP/WTA matches', 'Wear Vanta Sports bag', 'Social media mentions: 2/month'],
      bonuses: ['Top 50 year-end: +GBP 10,000', 'Grand Slam QF: +GBP 5,000', 'Top 30: +GBP 20,000'],
    },
    {
      sponsor: 'Apex Performance', category: 'Apparel', type: 'Kit + Fee', value: 'GBP 65,000/yr', status: 'Active', expiry: 'Jun 2027', daysLeft: 455,
      obligations: ['Wear Apex Performance on court (all events)', 'Instagram post: 2/month minimum', 'Attend 1 brand event/yr'],
      bonuses: [],
    },
    {
      sponsor: 'Meridian Watches', category: 'Watch / Luxury', type: 'Cash + Watch allocation', value: 'GBP 120,000/yr', status: 'Renewal due', expiry: 'May 2026', daysLeft: 47,
      obligations: ['Wear Meridian Watches in all press conferences', 'Appear in 1 Meridian Watches campaign/yr', 'Ranking report monthly to brand team'],
      bonuses: [],
    },
    {
      sponsor: 'Northbridge Financial', category: 'Financial Services', type: 'Platform partnership', value: 'GBP 30,000/yr', status: 'Active', expiry: 'Jan 2027', daysLeft: 295,
      obligations: ['Logo on hat (left side)', 'Post-tournament quote for Northbridge Financial social: 4/yr', '1 commercial appearance/yr'],
      bonuses: [],
    },
    {
      sponsor: 'Head Pennzoil', category: 'Strings & Accessories', type: 'Product only', value: 'Product supply', status: 'Active', expiry: 'Dec 2026', daysLeft: 275,
      obligations: ['Use Head strings in practice only', 'Mention in 2 social posts/yr'],
      bonuses: [],
    },
    {
      sponsor: 'Babolat Appear.', category: 'Exhibition / Appearance', type: 'Appearance fee', value: 'GBP 25,000 (one-off)', status: 'Confirmed', expiry: 'June 2026', daysLeft: 80,
      obligations: ['Monte-Carlo exhibition night (post-tournament)'],
      bonuses: [],
    },
  ];

  const contentCalendar = [
    { date: 'Today', platform: 'Instagram', brand: 'Apex Performance', type: 'Match-day post', status: 'Due', draft: true },
    { date: 'This week', platform: 'Instagram', brand: 'Northbridge Financial', type: 'Post-match quote graphic', status: 'Upcoming', draft: false },
    { date: '21 Apr', platform: 'Instagram', brand: 'Apex Performance', type: 'Monthly content post', status: 'Upcoming', draft: false },
    { date: '30 Apr', platform: 'Various', brand: 'Meridian Watches', type: 'Monthly ranking report', status: 'Upcoming', draft: false },
    { date: 'Jun 2026', platform: 'TBD', brand: 'Meridian Watches', type: 'Annual campaign shoot', status: 'Renewal pending', draft: false },
  ];

  return (
    <div className="space-y-6">

      <SectionHeader icon="🤝" title="Sponsorship Manager" subtitle="Every deal, every obligation, every deadline — tracked automatically." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Annual Value" value="GBP 285k+" sub="Confirmed contracts" color="yellow" />
        <StatCard label="Active Deals" value="6" sub="1 renewal due" color="green" />
        <StatCard label="Meridian Watches Renewal" value="47 days" sub="Action required" color="red" />
        <StatCard label="Obligations Due" value="1 today" sub="Apex Performance post" color="orange" />
      </div>

      {/* Deal Tracker */}
      <div className="space-y-3">
        {deals.map((deal, i) => (
          <div key={i} className={`bg-[#0d0f1a] border rounded-xl p-4 ${deal.status === 'Renewal due' ? 'border-red-600/40' : 'border-gray-800'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{deal.sponsor}</span>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{deal.category}</span>
                </div>
                <div className="text-sm text-gray-400 mt-0.5">{deal.type} . {deal.value}</div>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded-full ${deal.status === 'Active' ? 'bg-teal-600/20 text-teal-400' : deal.status === 'Renewal due' ? 'bg-red-600/20 text-red-400' : 'bg-blue-600/20 text-blue-400'}`}>{deal.status}</span>
                <div className="text-xs text-gray-500 mt-1">Expires: {deal.expiry} ({deal.daysLeft}d)</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 space-y-0.5">
              {deal.obligations.map((o, j) => (
                <div key={j} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                  {o}
                </div>
              ))}
            </div>
            {deal.bonuses.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-800/50">
                <div className="text-xs text-yellow-500/80 font-medium mb-1">Performance bonuses:</div>
                {deal.bonuses.map((b, j) => <div key={j} className="text-xs text-gray-500">{b}</div>)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Content Calendar */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Content & Obligations Calendar</div>
        <div className="space-y-2">
          {contentCalendar.map((c, i) => (
            <div key={i} className={`flex items-center gap-3 py-2 border-b border-gray-800/50 ${c.status === 'Due' ? 'bg-yellow-500/5 rounded-lg px-2' : ''}`}>
              <div className={`text-xs font-semibold w-20 ${c.status === 'Due' ? 'text-yellow-400' : 'text-gray-500'}`}>{c.date}</div>
              <div className="flex-1 text-sm text-gray-300">{c.brand} — {c.type}</div>
              <div className="text-xs text-gray-500">{c.platform}</div>
              {c.draft && <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">Draft ready</span>}
              <span className={`text-xs px-2 py-0.5 rounded ${c.status === 'Due' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>{c.status}</span>
            </div>
          ))}
        </div>
      </div>
      <TennisAISection context="sponsorship" player={player} session={session} />
    </div>
  );
}

// ─── FINANCIAL VIEW ───────────────────────────────────────────────────────────
function FinancialView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const prizeMoneyLog = [
    { tournament: 'Australian Open', round: 'R4', prize_usd: 332000, prize_gbp: 262000, currency: 'AUD', surface: 'Hard', cat: 'Grand Slam' },
    { tournament: 'Rotterdam ATP 500', round: 'W', prize_usd: 118000, prize_gbp: 93000, currency: 'EUR', surface: 'Indoor', cat: 'ATP 500' },
    { tournament: 'Dubai ATP 500', round: 'SF', prize_usd: 86500, prize_gbp: 68000, currency: 'USD', surface: 'Hard', cat: 'ATP 500' },
    { tournament: 'Indian Wells', round: 'QF', prize_usd: 68500, prize_gbp: 54000, currency: 'USD', surface: 'Hard', cat: 'Masters 1000' },
    { tournament: 'Miami Open', round: 'R3', prize_usd: 23760, prize_gbp: 18700, currency: 'USD', surface: 'Hard', cat: 'Masters 1000' },
    { tournament: 'Monte-Carlo (live)', round: 'QF', prize_usd: 47500, prize_gbp: 37500, currency: 'EUR', surface: 'Clay', cat: 'Masters 1000' },
  ];

  const expenses = [
    { category: 'Coach (Marco Bianchi)', amount: '~GBP 62,000', notes: '12% of prize money + travel', type: 'Team' },
    { category: 'Physio (Sarah Okafor)', amount: '~GBP 45,000', notes: 'Retainer + event travel', type: 'Team' },
    { category: 'Fitness Trainer', amount: '~GBP 18,000', notes: 'Part-time retainer', type: 'Team' },
    { category: 'Mental Performance Coach', amount: '~GBP 8,000', notes: 'Monthly sessions', type: 'Team' },
    { category: 'Travel & Accommodation', amount: '~GBP 94,000', notes: '30+ weeks . 3-4 person team', type: 'Travel' },
    { category: 'Racket Stringing', amount: '~GBP 8,400', notes: '4 strings/event x 50+ events', type: 'Equipment' },
    { category: 'Agent Commission', amount: '~GBP 28,000', notes: '10% of endorsement income', type: 'Commercial' },
    { category: 'Accountant (multi-jurisdiction)', amount: '~GBP 8,000', notes: '20+ tax jurisdictions', type: 'Commercial' },
    { category: 'Insurance & Medical', amount: '~GBP 6,500', notes: 'Global cover + physio equipment', type: 'Other' },
  ];

  const taxJurisdictions = [
    { country: '🇦🇺 Australia', income: 'AU$332,000', status: 'Filed', rate: '45%' },
    { country: '🇦🇪 UAE / Dubai', income: '$86,500', status: 'Filed', rate: '0%' },
    { country: '🇺🇸 USA', income: '$92,260', status: 'Pending', rate: '30%' },
    { country: '🇫🇷 France (Monaco)', income: 'EUR 47,500', status: 'Open', rate: '30%' },
    { country: '🇳🇱 Netherlands', income: 'EUR 118,000', status: 'Filed', rate: '25%' },
  ];

  const totalPrize = prizeMoneyLog.reduce((a, b) => a + b.prize_gbp, 0);
  const totalExpenses = 278900;
  const endorsements = 285000;

  return (
    <div className="space-y-6">

      <SectionHeader icon="💰" title="Financial Dashboard" subtitle="Prize money, endorsements, expenses, and multi-jurisdiction tax tracker — exportable for your accountant." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Prize Money YTD" value={`GBP ${(totalPrize/1000).toFixed(0)}k`} sub="2026 season" color="green" />
        <StatCard label="Endorsements" value="GBP 285k" sub="Annual contracted" color="yellow" />
        <StatCard label="Total Expenses" value={`GBP ${(totalExpenses/1000).toFixed(0)}k`} sub="Estimated annual" color="red" />
        <StatCard label="Net Position" value={`GBP ${((totalPrize + endorsements - totalExpenses)/1000).toFixed(0)}k`} sub="YTD estimate" color="teal" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PrizeMoneyChart />
        <IncomeExpenseChart />
      </div>

      {/* Prize Money Ledger */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Prize Money Ledger — 2026</div>
          <button className="text-xs text-purple-400 hover:text-purple-300">Export for accountant &rarr;</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Tournament</th>
              <th className="text-left p-3">Round</th>
              <th className="text-left p-3">Surface</th>
              <th className="text-right p-3">Prize (USD)</th>
              <th className="text-right p-3">Prize (GBP)</th>
            </tr>
          </thead>
          <tbody>
            {prizeMoneyLog.map((p, i) => (
              <tr key={i} className={`border-b border-gray-800/50 ${p.tournament.includes('live') ? 'bg-teal-900/10' : ''}`}>
                <td className="p-3 text-gray-200">{p.tournament}</td>
                <td className="p-3 text-gray-400">{p.round}</td>
                <td className="p-3"><SurfaceBadge surface={p.surface} /></td>
                <td className="p-3 text-right text-gray-300">${p.prize_usd.toLocaleString()}</td>
                <td className="p-3 text-right text-white font-medium">GBP {p.prize_gbp.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-gray-900/50">
              <td colSpan={4} className="p-3 text-right text-sm text-gray-400 font-semibold">Total YTD (GBP)</td>
              <td className="p-3 text-right text-teal-400 font-bold">GBP {totalPrize.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Expenses */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Annual Expense Breakdown</div>
        <div className="space-y-2">
          {expenses.map((e, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50">
              <div>
                <div className="text-sm text-gray-200">{e.category}</div>
                <div className="text-xs text-gray-500">{e.notes}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">{e.amount}</div>
                <div className="text-xs text-gray-600">{e.type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tax Jurisdictions */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Tax Jurisdiction Tracker</div>
        <div className="space-y-2">
          {taxJurisdictions.map((t, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800/50 text-sm">
              <div className="flex-1 text-gray-300">{t.country}</div>
              <div className="text-gray-400">{t.income}</div>
              <div className="text-gray-500">Rate: {t.rate}</div>
              <span className={`text-xs px-2 py-0.5 rounded ${t.status === 'Filed' ? 'bg-teal-600/20 text-teal-400' : t.status === 'Pending' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-blue-600/20 text-blue-400'}`}>{t.status}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-500">Export structured data by jurisdiction for your accountant. 20+ jurisdictions tracked annually.</div>
      </div>
      <TennisAISection context="financial" player={player} session={session} />
    </div>
  );
}

// ─── EXHIBITION VIEW ───────────────────────────────────────────────────────────
function ExhibitionView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const exhibitions = [
    { date: '13 Apr 2026', event: 'Monte-Carlo Exhibition Night', location: '🇲🇨 Monaco', fee: 'GBP 25,000', status: 'Confirmed', opponent: 'G. Monfils' },
    { date: '28 Jun 2026', event: 'Giorgio Armani Tennis Classic', location: '🇬🇧 London (Hurlingham)', fee: 'GBP 15,000', status: 'Confirmed', opponent: 'TBD' },
    { date: '15 Nov 2026', event: 'World Tennis League', location: '🇦🇪 Dubai', fee: 'GBP 40,000', status: 'Negotiating', opponent: 'Various (team event)' },
    { date: '22 Dec 2026', event: 'Tennis Christmas Charity Event', location: '🇬🇧 London O2', fee: 'GBP 8,000', status: 'Invited', opponent: 'TBD' },
  ];

  return (
    <div className="space-y-6">

      <SectionHeader icon="🎪" title="Exhibitions & Appearances" subtitle="Exhibition match schedule, appearance fees, and total exhibition income." />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total Exhibition Income" value="GBP 88k" sub="2026 (confirmed + pending)" color="yellow" />
        <StatCard label="Exhibitions Booked" value="4" sub="2 confirmed, 2 pending" color="purple" />
        <StatCard label="Next Exhibition" value="13 Apr" sub="Monte-Carlo Exhibition" color="teal" />
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <div className="text-sm font-semibold text-white">Exhibition Schedule — 2026</div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Event</th>
              <th className="text-left p-3">Location</th>
              <th className="text-left p-3">Opponent</th>
              <th className="text-left p-3">Fee</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {exhibitions.map((e, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="p-3 text-gray-400 text-xs">{e.date}</td>
                <td className="p-3 text-gray-200 font-medium">{e.event}</td>
                <td className="p-3 text-gray-400 text-xs">{e.location}</td>
                <td className="p-3 text-gray-300">{e.opponent}</td>
                <td className="p-3 text-white font-medium">{e.fee}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${e.status === 'Confirmed' ? 'bg-teal-600/20 text-teal-400' : e.status === 'Negotiating' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-blue-600/20 text-blue-400'}`}>{e.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Appearance Fee Tracker</div>
        <div className="space-y-2">
          {[
            { label: 'Confirmed fees', amount: 'GBP 40,000', note: 'Monte-Carlo + Hurlingham' },
            { label: 'Pending fees', amount: 'GBP 48,000', note: 'Dubai WTL + O2 Charity' },
            { label: 'Total potential', amount: 'GBP 88,000', note: 'All 2026 exhibitions' },
          ].map((f, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50">
              <div className="text-sm text-gray-300">{f.label}</div>
              <div className="text-right">
                <div className="text-sm text-white font-medium">{f.amount}</div>
                <div className="text-xs text-gray-500">{f.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <TennisAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── AGENT PIPELINE VIEW ───────────────────────────────────────────────────────
function AgentPipelineView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const deals = [
    { sponsor: 'Apex Performance', value: 'GBP 150k/yr', stage: 'Negotiating', nextStep: 'Counter-offer due 15 Apr', category: 'Apparel (potential switch)' },
    { sponsor: 'Porsche', value: 'GBP 80k/yr', stage: 'Contacted', nextStep: 'Intro meeting scheduled 22 Apr', category: 'Automotive' },
    { sponsor: 'Therabody', value: 'GBP 25k/yr', stage: 'Prospect', nextStep: 'Agent to reach out', category: 'Recovery / Wellness' },
    { sponsor: 'Hublot', value: 'GBP 200k/yr', stage: 'Legal', nextStep: 'Contract review by 20 Apr', category: 'Watch (Meridian Watches replacement option)' },
  ];

  const stages = ['Prospect', 'Contacted', 'Negotiating', 'Legal', 'Signed'];

  const watchlist = [
    { brand: 'Apex Performance', sector: 'Apparel', potential: 'GBP 90k', notes: 'Expanding tennis portfolio' },
    { brand: 'Technivus Equipment', sector: 'Fitness', potential: 'GBP 20k', notes: 'Product + small fee' },
    { brand: 'Linea Systems', sector: 'Audio', potential: 'GBP 35k', notes: 'Athlete programme open' },
    { brand: 'Kinetix Hydration', sector: 'Energy', potential: 'GBP 100k', notes: 'Need top 50 for consideration' },
  ];

  const stageColors: Record<string, string> = {
    'Prospect': 'bg-gray-600/20 text-gray-400',
    'Contacted': 'bg-blue-600/20 text-blue-400',
    'Negotiating': 'bg-yellow-600/20 text-yellow-400',
    'Legal': 'bg-purple-600/20 text-purple-400',
    'Signed': 'bg-teal-600/20 text-teal-400',
  };

  return (
    <div className="space-y-6">

      <SectionHeader icon="📋" title="Agent Pipeline" subtitle="Deals in negotiation, sponsor watchlist, and pipeline stages." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Negotiations" value="4" sub="In pipeline" color="purple" />
        <StatCard label="Pipeline Value" value="GBP 455k" sub="Total potential annual" color="yellow" />
        <StatCard label="Watchlist" value="4" sub="Potential sponsors" color="blue" />
        <StatCard label="Next Action" value="15 Apr" sub="Apex Performance counter-offer" color="orange" />
      </div>

      {/* Pipeline Stages */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Pipeline Stages</div>
        <div className="flex gap-2 mb-5">
          {stages.map((s, i) => {
            const count = deals.filter(d => d.stage === s).length;
            return (
              <div key={i} className="flex-1 text-center">
                <div className={`py-2 rounded-lg ${stageColors[s]} text-xs font-medium`}>{s}</div>
                <div className="text-xs text-gray-500 mt-1">{count} {count === 1 ? 'deal' : 'deals'}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deals in Negotiation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deals.map((d, i) => (
          <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white font-semibold">{d.sponsor}</div>
              <span className={`text-xs px-2 py-0.5 rounded ${stageColors[d.stage]}`}>{d.stage}</span>
            </div>
            <div className="text-sm text-gray-400 mb-1">{d.category}</div>
            <div className="text-lg text-white font-bold mb-2">{d.value}</div>
            <div className="text-xs text-gray-500">Next: {d.nextStep}</div>
          </div>
        ))}
      </div>

      {/* Watchlist */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Potential Sponsor Watchlist</div>
        <div className="space-y-2">
          {watchlist.map((w, i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-800/50 text-sm">
              <div className="text-gray-200 font-medium w-32">{w.brand}</div>
              <div className="text-gray-500 w-20">{w.sector}</div>
              <div className="text-white font-medium">{w.potential}</div>
              <div className="flex-1 text-gray-400 text-xs">{w.notes}</div>
            </div>
          ))}
        </div>
      </div>
      <TennisAISection context="agent" player={player} session={session} />
    </div>
  );
}

// ─── MEDIA & CONTENT VIEW ─────────────────────────────────────────────────────
function MediaView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const [pressLoading, setPressLoading] = useState(false);
  const [pressResult, setPressResult] = useState<{press_quote: string; social_instagram: string; social_x: string} | null>(null);
  const [matchResult, setMatchResult] = useState('Won 6-4 4-6 7-5 vs Caballero');
  const [moment1, setMoment1] = useState('Broke serve 3 times in deciding set');
  const [moment2, setMoment2] = useState('Saved 4 break points in set 2');
  const [moment3, setMoment3] = useState('First career win over a top-20 player on clay');

  const generatePress = async () => {
    setPressLoading(true);
    try {
      const res = await fetch('/api/ai/tennis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 500,
          messages: [{ role: 'user', content: `Generate post-match quotes for Alex Rivera, British ATP tennis player ranked #67. Result: ${matchResult}. Key moments: 1) ${moment1} 2) ${moment2} 3) ${moment3}. Alex is professional, humble, determined, with dry British wit. Generate platform-specific content. Respond ONLY in JSON: {"press_quote":"150 word formal press conference quote, 3rd person refs acceptable","social_instagram":"engaging 80-word instagram caption with 3 hashtags","social_x":"punchy 240-character max X/Twitter post"}` }]
        })
      });
      const data = await res.json();
      setPressResult(JSON.parse(data.content[0].text));
    } catch { console.error('Press gen failed'); }
    finally { setPressLoading(false); }
  };

  const pressLog = [
    { event: 'Monte-Carlo R2 post-match', type: 'Press conference', status: 'Done', date: '8 Apr', notes: 'ATP mandatory — completed' },
    { event: 'Monte-Carlo QF post-match', type: 'Press conference', status: 'Upcoming', date: 'Today (post-match)', notes: 'ATP mandatory' },
    { event: 'Northbridge Sport UK (live)', type: 'Broadcast interview', status: 'Confirmed', date: 'Tomorrow 09:00', notes: '10-minute live slot — James briefing beforehand' },
    { event: 'Capital Herald feature', type: 'Print interview', status: 'TBC', date: 'Late April', notes: 'Agent to confirm scheduling' },
  ];

  return (
    <div className="space-y-6">

      <SectionHeader icon="📱" title="Media & Content" subtitle="Social calendar, sponsor content obligations, press log, and media schedule." />

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5 mb-6">
        <div className="text-sm font-semibold text-white mb-4">🎙️ AI Press Statement Generator</div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="col-span-2">
            <div className="text-xs text-gray-500 mb-1">Match result</div>
            <input value={matchResult} onChange={e=>setMatchResult(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white"/>
          </div>
          {[{label:'Key moment 1',val:moment1,set:setMoment1},{label:'Key moment 2',val:moment2,set:setMoment2},{label:'Key moment 3',val:moment3,set:setMoment3}].map(f=>(
            <div key={f.label}>
              <div className="text-xs text-gray-500 mb-1">{f.label}</div>
              <input value={f.val} onChange={e=>f.set(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white"/>
            </div>
          ))}
        </div>
        <button onClick={generatePress} disabled={pressLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg transition-colors mb-4">
          {pressLoading ? 'Generating...' : 'Generate 3 Platform Quotes'}
        </button>
        {pressResult && (
          <div className="space-y-3 border-t border-gray-800 pt-4">
            {[{label:'📰 Press Conference Quote',value:pressResult.press_quote},{label:'📸 Instagram Caption',value:pressResult.social_instagram},{label:'✕ Post',value:pressResult.social_x}].map(item=>(
              <div key={item.label} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-[10px] font-semibold text-purple-400">{item.label}</div>
                  <button onClick={()=>navigator.clipboard.writeText(item.value)} className="text-[10px] text-gray-500 hover:text-gray-300">Copy</button>
                </div>
                <div className="text-xs text-gray-300 leading-relaxed italic">&ldquo;{item.value}&rdquo;</div>
              </div>
            ))}
            <div className="text-[10px] text-gray-600 text-center">Marco approves before posting</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Instagram Followers" value="184k" sub="^2.1k this month" color="purple" />
        <StatCard label="Avg Engagement" value="4.2%" sub="Above tour avg (2.8%)" color="teal" />
        <StatCard label="Posts This Month" value="3/4" sub="Apex Performance: 2/2" color="blue" />
      </div>

      {/* Press Log */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Press & Media Log</div>
        <div className="space-y-3">
          {pressLog.map((p, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-800/50">
              <span className={`text-xs px-2 py-0.5 rounded mt-0.5 ${p.status === 'Done' ? 'bg-teal-600/20 text-teal-400' : p.status === 'Upcoming' ? 'bg-yellow-600/20 text-yellow-400' : p.status === 'Confirmed' ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>{p.status}</span>
              <div>
                <div className="text-sm text-gray-200">{p.event}</div>
                <div className="text-xs text-gray-500">{p.type} . {p.date} . {p.notes}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Brand Usage Guidelines</div>
        <div className="space-y-2 text-sm">
          {[
            { brand: 'Apex Performance', rule: 'On-court: full Apex Performance kit. No competitor logos visible. Training wear must also be Apex Performance when filmed.' },
            { brand: 'Meridian Watches', rule: 'Must wear Meridian Watches Submariner in all press conferences and official ATP player events. Not required on court.' },
            { brand: 'Vanta Sports', rule: 'Vanta Sports bag visible at all ATP/WTA events. Vanta Sports racket in all match play.' },
            { brand: 'Northbridge Financial', rule: 'Northbridge Financial logo on hat left panel. Must appear in all official ATP tournament photos.' },
          ].map((b, i) => (
            <div key={i} className="py-2 border-b border-gray-800/50">
              <div className="text-yellow-400 text-xs font-semibold mb-0.5">{b.brand}</div>
              <div className="text-gray-400 text-xs">{b.rule}</div>
            </div>
          ))}
        </div>
      </div>
      <TennisAISection context="media" player={player} session={session} />
    </div>
  );
}

// ─── TRAVEL RESEARCHER VIEW ──────────────────────────────────────────────────
interface FlightResult{airline:string;flightNo:string;departure:string;arrival:string;duration:string;stops:string;price:number;class:string;bookingUrl?:string;score:number}
interface HotelResult{name:string;stars:number;area:string;distanceToVenue:string;pricePerNight:number;totalPrice:number;rating:number;amenities:string[];bookingUrl?:string;score:number}

function TravelView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const [tStep,setTStep]=useState<1|2|3|4>(1)
  const [searching,setSearching]=useState(false)
  const [searchPhase,setSearchPhase]=useState('')
  const [flightResults,setFlightResults]=useState<FlightResult[]>([])
  const [hotelResults,setHotelResults]=useState<HotelResult[]>([])
  const [selectedFlight,setSelectedFlight]=useState<FlightResult|null>(null)
  const [selectedHotel,setSelectedHotel]=useState<HotelResult|null>(null)
  const [bookingEmail,setBookingEmail]=useState('')
  const [emailSent,setEmailSent]=useState(false)
  const [aiNarrative,setAiNarrative]=useState('')
  const [trOrigin,setTrOrigin]=useState('London (LHR)')
  const [trDest,setTrDest]=useState('')
  const [trTourney,setTrTourney]=useState('')
  const [trDepart,setTrDepart]=useState('')
  const [trReturn,setTrReturn]=useState('')
  const [trCabin,setTrCabin]=useState<'economy'|'premium_economy'|'business'>('economy')
  const [trMaxFlight,setTrMaxFlight]=useState('')
  const [trHotelBudget,setTrHotelBudget]=useState('')
  const trNights=7,trPax=1
  const [trGym,setTrGym]=useState(true)
  const [trCourts,setTrCourts]=useState(false)
  const [trEarly,setTrEarly]=useState(false)

  const UPCOMING=[{name:'Madrid Open',dest:'Madrid (MAD)',dates:'26 Apr – 4 May'},{name:'Roland-Garros',dest:'Paris (CDG)',dates:'25 May – 8 Jun'},{name:'Halle Open',dest:'Hanover (HAJ)',dates:'9–15 Jun'},{name:'Wimbledon',dest:'London (LHR)',dates:'30 Jun – 13 Jul'},{name:'US Open',dest:'New York (JFK)',dates:'25 Aug – 7 Sep'},{name:'Bahrain Masters',dest:'Bahrain (BAH)',dates:'12–18 Oct'}]

  const runSearch=async()=>{
    setSearching(true);setTStep(2);setFlightResults([]);setHotelResults([]);setAiNarrative('')
    try{
      setSearchPhase('✈️ Searching flights from '+trOrigin+' to '+trDest+'...')
      await new Promise(r=>setTimeout(r,800))
      setSearchPhase('💰 Comparing fares...')
      const fr=await fetch('/api/ai/tennis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`Find 5 flights ${trOrigin} to ${trDest}, depart ${trDepart}, return ${trReturn}, ${trCabin}${trMaxFlight?' max £'+trMaxFlight:''}. JSON array only: [{"airline":"","flightNo":"","departure":"","arrival":"","duration":"","stops":"","price":0,"class":"${trCabin}","bookingUrl":"https://www.skyscanner.net","score":0}]. Realistic. Sort by score desc.`}]})})
      const fd=await fr.json();const ft=fd.content?.filter((b:{type:string})=>b.type==='text')?.map((b:{text:string})=>b.text)?.join('')||''
      try{setFlightResults(JSON.parse(ft.replace(/```json|```/g,'').trim()))}
      catch{setFlightResults([{airline:'British Airways',flightNo:'BA0459',departure:'07:15 LHR',arrival:'10:30 MAD',duration:'2h 15m',stops:'Direct',price:189,class:trCabin,bookingUrl:'https://www.britishairways.com',score:94},{airline:'Iberia',flightNo:'IB3167',departure:'06:45 LHR',arrival:'10:05 MAD',duration:'2h 20m',stops:'Direct',price:142,class:trCabin,bookingUrl:'https://www.iberia.com',score:88},{airline:'Vueling',flightNo:'VY7822',departure:'11:30 LHR',arrival:'14:55 MAD',duration:'2h 25m',stops:'Direct',price:98,class:trCabin,bookingUrl:'https://www.vueling.com',score:81},{airline:'easyJet',flightNo:'EZY8821',departure:'13:00 LGW',arrival:'16:20 MAD',duration:'2h 20m',stops:'Direct',price:74,class:trCabin,bookingUrl:'https://www.easyjet.com',score:72},{airline:'Ryanair',flightNo:'FR1234',departure:'06:00 STN',arrival:'09:25 MAD',duration:'2h 25m',stops:'Direct',price:52,class:trCabin,bookingUrl:'https://www.ryanair.com',score:61}])}
      setSearchPhase('🏨 Searching hotels...')
      await new Promise(r=>setTimeout(r,700))
      const hr=await fetch('/api/ai/tennis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`Find 4 hotels near ${trTourney||trDest}, ${trNights} nights from ${trDepart}. ${trHotelBudget?'Max £'+trHotelBudget+'/night.':'Best value.'} Need: ${[trGym&&'Gym',trCourts&&'Courts',trEarly&&'Early check-in'].filter(Boolean).join(', ')||'Standard'}. JSON array: [{"name":"","stars":4,"area":"","distanceToVenue":"","pricePerNight":0,"totalPrice":0,"rating":8.5,"amenities":[],"bookingUrl":"https://www.booking.com","score":0}]. Sort by score.`}]})})
      const hd=await hr.json();const ht=hd.content?.filter((b:{type:string})=>b.type==='text')?.map((b:{text:string})=>b.text)?.join('')||''
      try{setHotelResults(JSON.parse(ht.replace(/```json|```/g,'').trim()))}
      catch{setHotelResults([{name:'AC Hotel Cuzco',stars:4,area:'Cuzco/IFEMA',distanceToVenue:'8 min taxi',pricePerNight:189,totalPrice:1323,rating:8.6,amenities:['Gym','Restaurant','Bar','WiFi'],bookingUrl:'https://www.booking.com',score:91},{name:'Eurostars Madrid Tower',stars:5,area:'IFEMA',distanceToVenue:'5 min taxi',pricePerNight:240,totalPrice:1680,rating:9.1,amenities:['Gym','Pool','Spa','Restaurant'],bookingUrl:'https://www.booking.com',score:88},{name:'Hotel Puerta de América',stars:5,area:'Av. de América',distanceToVenue:'12 min taxi',pricePerNight:210,totalPrice:1470,rating:8.9,amenities:['Gym','Pool','Tennis courts'],bookingUrl:'https://www.booking.com',score:85},{name:'Ibis Madrid Alcalá',stars:3,area:'East Madrid',distanceToVenue:'15 min taxi',pricePerNight:89,totalPrice:623,rating:8.1,amenities:['WiFi','Restaurant'],bookingUrl:'https://www.booking.com',score:71}])}
      setAiNarrative(`Best: ${flightResults[0]?.airline??'Iberia'} £${flightResults[0]?.price??142} + ${hotelResults[0]?.name??'AC Hotel Cuzco'} £${hotelResults[0]?.pricePerNight??189}/night. Total est: £${((flightResults[0]?.price??142)*trPax+(hotelResults[0]?.totalPrice??1323)).toLocaleString()}.`)
      setTStep(3)
    }catch(e){console.error(e)}
    setSearching(false);setSearchPhase('')
  }

  const genEmail=()=>{if(!selectedFlight&&!selectedHotel)return;setBookingEmail([`Subject: Travel — ${trTourney||trDest} — ${session.userName||player.name}`,'',`Hi,`,'',`Please book for ${session.userName||player.name} (ATP #${player.ranking}):`,selectedFlight?`\n✈️ ${selectedFlight.airline} (${selectedFlight.flightNo})\n${trOrigin} → ${trDest}\nDepart: ${trDepart}\nClass: ${selectedFlight.class}\nPrice: £${selectedFlight.price*trPax}\nBook: ${selectedFlight.bookingUrl}`:'',selectedHotel?`\n🏨 ${selectedHotel.name} (${selectedHotel.stars}★)\nCheck-in: ${trDepart}\nNights: ${trNights}\nPrice: £${selectedHotel.totalPrice}\nBook: ${selectedHotel.bookingUrl}${trEarly?'\nEarly check-in requested.':''}`:'',`\nTotal: £${((selectedFlight?.price??0)*trPax+(selectedHotel?.totalPrice??0)).toLocaleString()}`,'','Thanks',session.userName||player.name].filter(Boolean).join('\n'));setTStep(4)}

  const ScBadge=({s}:{s:number})=><div className={`text-[10px] px-2 py-1 rounded-full font-bold ${s>=90?'bg-green-600/20 text-green-400':s>=75?'bg-purple-600/20 text-purple-400':s>=60?'bg-amber-600/20 text-amber-400':'bg-gray-800 text-gray-500'}`}>{s} Lumio</div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div><div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest bg-gray-800 px-2 py-0.5 rounded">TR-FLIGHTS-01</span><span className="text-[10px] font-bold text-purple-400 bg-purple-600/10 px-2 py-0.5 rounded border border-purple-600/30">AI Research Agent</span></div><h2 className="text-xl font-black text-white">Travel Researcher</h2><p className="text-sm text-gray-400">Flights, hotels, and a booking email in under 60 seconds.</p></div>
      <div className="flex items-center gap-2 mb-4">{[{n:1,l:'Configure'},{n:2,l:'Research'},{n:3,l:'Results'},{n:4,l:'Book'}].map((s,i)=><div key={s.n} className="flex items-center gap-2"><div className="flex flex-col items-center gap-1"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${tStep===s.n?'bg-purple-600 text-white':tStep>s.n?'bg-green-500 text-white':'bg-gray-800 text-gray-500'}`}>{tStep>s.n?'✓':s.n}</div><span className={`text-[10px] ${tStep===s.n?'text-purple-400 font-semibold':'text-gray-600'}`}>{s.l}</span></div>{i<3&&<div className={`h-px w-12 mb-4 ${tStep>s.n?'bg-green-500':'bg-gray-800'}`}/>}</div>)}</div>
      {tStep===1&&(<div className="space-y-6"><div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-6"><h3 className="text-sm font-bold text-white mb-1">Which tournament?</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">{UPCOMING.map(t=><button key={t.name} onClick={()=>{setTrTourney(t.name);setTrDest(t.dest)}} className={`px-4 py-3 rounded-xl text-left text-xs border ${trTourney===t.name?'border-purple-500 bg-purple-600/10 text-white':'border-gray-800 text-gray-400 hover:text-white'}`}><div className="font-semibold">{t.name}</div><div className="text-[10px] text-gray-600 mt-0.5">{t.dates}</div></button>)}</div></div><div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-6"><h3 className="text-sm font-bold text-white mb-4">Route & dates</h3><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] text-gray-500 uppercase mb-1 block">From</label><input defaultValue={trOrigin} onBlur={e=>setTrOrigin(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white"/></div><div><label className="text-[10px] text-gray-500 uppercase mb-1 block">To</label><input value={trDest} onChange={e=>setTrDest(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white"/></div><div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Depart</label><input type="date" value={trDepart} onChange={e=>setTrDepart(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white"/></div><div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Return</label><input type="date" value={trReturn} onChange={e=>setTrReturn(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white"/></div></div></div><div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-6"><h3 className="text-sm font-bold text-white mb-4">Preferences</h3><div className="grid grid-cols-3 gap-4"><div><label className="text-[10px] text-gray-500 uppercase mb-2 block">Cabin</label>{([{id:'economy' as const,l:'Economy'},{id:'premium_economy' as const,l:'Premium Econ'},{id:'business' as const,l:'Business'}]).map(c=><button key={c.id} onClick={()=>setTrCabin(c.id)} className={`w-full mb-1.5 px-3 py-2 rounded-xl text-xs text-left border ${trCabin===c.id?'border-purple-500 bg-purple-600/10 text-white':'border-gray-800 text-gray-400'}`}>{c.l}</button>)}</div><div><label className="text-[10px] text-gray-500 uppercase mb-2 block">Flight max (£)</label><input type="number" defaultValue={trMaxFlight} onBlur={e=>setTrMaxFlight(e.target.value)} placeholder="300" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white mb-3"/><label className="text-[10px] text-gray-500 uppercase mb-2 block">Hotel (£/night)</label><input type="number" defaultValue={trHotelBudget} onBlur={e=>setTrHotelBudget(e.target.value)} placeholder="200" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white"/></div><div><label className="text-[10px] text-gray-500 uppercase mb-2 block">Hotel needs</label>{[{v:trGym,s:setTrGym,l:'Gym'},{v:trCourts,s:setTrCourts,l:'Courts'},{v:trEarly,s:setTrEarly,l:'Early check-in'}].map(r=><button key={r.l} onClick={()=>r.s(!r.v)} className={`w-full mb-1.5 flex items-center gap-2 px-3 py-2 rounded-xl text-xs border text-left ${r.v?'border-purple-500 bg-purple-600/10 text-white':'border-gray-800 text-gray-500'}`}><span>{r.v?'✓':'○'}</span>{r.l}</button>)}</div></div></div><button onClick={runSearch} disabled={!trDest||!trDepart} className="w-full py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-40" style={{background:(!trDest||!trDepart)?'#374151':'linear-gradient(135deg, #8B5CF6, #7C3AED)'}}>🔍 Search flights & hotels →</button></div>)}
      {tStep===2&&searching&&(<div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-12 text-center"><div className="text-4xl mb-6 animate-bounce">✈️</div><h3 className="text-lg font-bold text-white mb-2">Searching...</h3><p className="text-sm text-purple-400 mb-4">{searchPhase}</p></div>)}
      {tStep===3&&(<div className="space-y-6">{aiNarrative&&<div className="bg-purple-600/10 border border-purple-600/30 rounded-xl p-4 flex items-start gap-3"><span>🤖</span><div><div className="text-xs font-bold text-purple-400 mb-1">AI Recommendation</div><p className="text-xs text-gray-300">{aiNarrative}</p></div></div>}<div><h3 className="text-sm font-bold text-white mb-3">✈️ Flights — {trOrigin} → {trDest}</h3><div className="space-y-2">{flightResults.map((f,i)=><button key={i} onClick={()=>setSelectedFlight(selectedFlight?.flightNo===f.flightNo?null:f)} className={`w-full text-left rounded-xl border p-4 ${selectedFlight?.flightNo===f.flightNo?'border-purple-500 bg-purple-600/10':'border-gray-800 bg-[#0d1117] hover:border-gray-700'}`}><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className={`w-4 h-4 rounded-full border ${selectedFlight?.flightNo===f.flightNo?'bg-purple-500 border-purple-500':'border-gray-600'}`}/><div><div className="text-xs font-bold text-white">{f.airline}</div><div className="text-[10px] text-gray-500">{f.flightNo} · {f.stops}</div></div><div className="text-xs text-gray-300">{f.departure}→{f.arrival}</div><div className="text-xs text-gray-500">{f.duration}</div></div><div className="flex items-center gap-3"><ScBadge s={f.score}/><div className="text-sm font-black text-white">£{f.price}</div>{i===0&&<span className="text-[9px] px-2 py-0.5 rounded-full bg-green-600/20 text-green-400 font-bold">Best</span>}</div></div></button>)}</div></div><div><h3 className="text-sm font-bold text-white mb-3">🏨 Hotels — {trDest}</h3><div className="grid grid-cols-2 gap-3">{hotelResults.map((h,i)=><button key={i} onClick={()=>setSelectedHotel(selectedHotel?.name===h.name?null:h)} className={`text-left rounded-xl border p-4 ${selectedHotel?.name===h.name?'border-purple-500 bg-purple-600/10':'border-gray-800 bg-[#0d1117] hover:border-gray-700'}`}><div className="flex items-start justify-between mb-2"><div className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full border mt-0.5 ${selectedHotel?.name===h.name?'bg-purple-500 border-purple-500':'border-gray-600'}`}/><div><div className="text-xs font-bold text-white">{h.name}</div><div className="text-[10px] text-gray-500">{'★'.repeat(h.stars)} · {h.area}</div></div></div><ScBadge s={h.score}/></div><div className="text-[10px] text-gray-500 ml-6 mb-2">📍 {h.distanceToVenue} · ⭐ {h.rating}</div><div className="flex flex-wrap gap-1 ml-6 mb-2">{h.amenities.map((a,j)=><span key={j} className={`text-[9px] px-1.5 py-0.5 rounded ${a==='Gym'||a==='Tennis courts'?'bg-green-600/20 text-green-400':'bg-gray-800 text-gray-500'}`}>{a}</span>)}</div><div className="flex justify-between ml-6"><span className="text-[10px] text-gray-500">£{h.pricePerNight}/night</span><span className="text-sm font-black text-white">£{h.totalPrice.toLocaleString()}</span></div>{i===0&&<div className="mt-2 ml-6 text-[9px] text-green-400 font-bold">✓ Recommended</div>}</button>)}</div></div>{(selectedFlight||selectedHotel)&&<div className="bg-[#0d1117] border border-purple-600/30 rounded-xl p-4 flex items-center justify-between"><div><div className="text-xs font-bold text-white">Selected</div><div className="text-[10px] text-gray-500">{selectedFlight&&`✈️ ${selectedFlight.airline} £${selectedFlight.price*trPax}`}{selectedFlight&&selectedHotel&&' + '}{selectedHotel&&`🏨 ${selectedHotel.name} £${selectedHotel.totalPrice}`}</div></div><div className="text-2xl font-black text-white">£{((selectedFlight?.price??0)*trPax+(selectedHotel?.totalPrice??0)).toLocaleString()}</div></div>}<div className="flex gap-3"><button onClick={genEmail} disabled={!selectedFlight&&!selectedHotel} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40" style={{background:(!selectedFlight&&!selectedHotel)?'#374151':'#8B5CF6'}}>📧 Booking email →</button><button onClick={()=>{setTStep(1);setFlightResults([]);setHotelResults([]);setSelectedFlight(null);setSelectedHotel(null)}} className="px-4 py-3 rounded-xl text-xs border border-gray-700 text-gray-400 hover:text-white">↺ New</button></div></div>)}
      {tStep===4&&(<div className="space-y-5"><div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-6"><h3 className="text-sm font-bold text-white mb-4">📧 Booking email</h3><textarea value={bookingEmail} onChange={e=>setBookingEmail(e.target.value)} rows={16} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-xs text-gray-300 font-mono resize-none"/></div>{emailSent?<div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4 text-center"><span className="text-2xl">✅</span><div className="text-sm font-bold text-green-400 mt-2">Email opened</div></div>:<div className="flex gap-3"><button onClick={()=>{window.open(`mailto:travel@lumiocms.com?subject=${encodeURIComponent(`Travel — ${trTourney||trDest}`)}&body=${encodeURIComponent(bookingEmail)}`);setEmailSent(true)}} className="flex-1 py-4 rounded-xl text-sm font-bold text-white" style={{background:'#8B5CF6'}}>📧 Send →</button><button onClick={()=>navigator.clipboard?.writeText(bookingEmail)} className="px-4 py-4 rounded-xl text-xs border border-gray-700 text-gray-400">📋 Copy</button></div>}<button onClick={()=>{setTStep(1);setFlightResults([]);setHotelResults([]);setSelectedFlight(null);setSelectedHotel(null);setBookingEmail('');setEmailSent(false)}} className="text-xs text-gray-600 hover:text-gray-400 block mx-auto">← New search</button></div>)}

      {/* Old itinerary view removed — replaced by Travel Researcher above */}

      {/* Old itinerary + hotel contacts removed — Travel Researcher replaces them */}
      <TennisAISection context="travel" player={player} session={session} />
    </div>
  );
}

// ─── FEDERATION VIEW ─────────────────────────────────────────────────────────
function FederationView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  return (
    <div className="space-y-6">

      <SectionHeader icon="🏛️" title="Federation & National Obligations" subtitle="Davis Cup schedule, national federation commitments, wildcard entries, and ITF obligations." />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Davis Cup Group" value="Finals" sub="GB — Qualifier stage" color="blue" />
        <StatCard label="Ranking for Wild Cards" value="#67" sub="Top 100 qualifies" color="teal" />
        <StatCard label="LTA Support Status" value="Active" sub="Level 2 programme" color="green" />
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Davis Cup 2026 — Great Britain</div>
        <div className="space-y-3">
          {[
            { round: 'Qualifier', date: 'Feb 2026', opponent: 'vs Sweden', result: 'GB won 3-2', status: 'Complete', selected: true, matches: '2 singles wins' },
            { round: 'Finals — Group Stage', date: 'Sep 2026', opponent: 'TBD (Malaga)', result: 'TBC', status: 'Upcoming', selected: false, matches: 'Selection TBC' },
          ].map((d, i) => (
            <div key={i} className={`p-4 rounded-lg border ${d.status === 'Complete' ? 'border-gray-800 bg-gray-900/20' : 'border-blue-600/30 bg-blue-600/5'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-white">{d.round} — {d.opponent}</div>
                <span className={`text-xs px-2 py-0.5 rounded ${d.status === 'Complete' ? 'bg-teal-600/20 text-teal-400' : 'bg-blue-600/20 text-blue-400'}`}>{d.status}</span>
              </div>
              <div className="text-xs text-gray-400">{d.date} . {d.result} . {d.matches}</div>
              {d.selected && <div className="text-xs text-purple-400 mt-1">Selected for this tie</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">LTA Player Support — Level 2 Programme</div>
        <div className="space-y-2 text-sm text-gray-400">
          {[
            'Annual funding contribution: GBP 15,000',
            'NTC court access: Unlimited (when UK-based)',
            'Physiotherapy support: LTA physio network access',
            'Performance science: Biomechanics screen annually',
            'Travel support: Partially subsidised for early-career events',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-800/50">
              <span className="text-teal-400">+</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Wild Card & Entry Deadlines</div>
        <div className="space-y-2">
          {[
            { tournament: 'Wimbledon 2026', deadline: '19 May', status: 'Direct entry (ranked 67)', action: 'Auto-entered' },
            { tournament: "Queen's Club 2026", deadline: '1 May', status: 'LTA wild card eligible', action: 'Request submitted' },
            { tournament: 'Eastbourne International', deadline: '8 May', status: 'Direct entry', action: 'Enter by deadline' },
            { tournament: 'Nottingham Open', deadline: '3 May', status: 'Optional', action: 'Discuss with agent' },
          ].map((e, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800/50 text-sm">
              <div className="flex-1 text-gray-200">{e.tournament}</div>
              <div className="text-xs text-gray-500">Deadline: {e.deadline}</div>
              <div className="text-xs text-teal-400">{e.action}</div>
            </div>
          ))}
        </div>
      </div>
      <TennisAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── CAREER PLANNING VIEW ─────────────────────────────────────────────────────
function CareerView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const [careerTab, setCareerTab] = useState<'1year' | '3year' | '5year' | '10year'>('1year');

  const goals = [
    { goal: 'Break into Top 50 by year-end', progress: 58, target: 100, status: '67 to 50 needed', color: 'purple' },
    { goal: 'Qualify for ATP Finals (Turin)', progress: 28, target: 100, status: '1,847 / ~6,500 pts needed', color: 'teal' },
    { goal: 'Reach first ATP Masters SF', progress: 40, target: 100, status: 'QF achieved (Indian Wells)', color: 'blue' },
    { goal: 'Grand Slam R3 or deeper', progress: 100, target: 100, status: 'Australian Open R4', color: 'green' },
    { goal: 'Win an ATP 500 title', progress: 80, target: 100, status: '1 title (Rotterdam 2026)', color: 'orange' },
  ];

  const projections = [
    { scenario: 'Current trajectory', endYearRanking: 52, pointsEOY: 2800, tourFinals: false },
    { scenario: 'Strong clay swing (SF at Roland Garros)', endYearRanking: 38, pointsEOY: 3900, tourFinals: false },
    { scenario: 'Exceptional year (GS QF + Masters win)', endYearRanking: 24, pointsEOY: 5800, tourFinals: true },
  ];

  const careerTabs = [
    { id: '1year' as const, label: '1 Year' },
    { id: '3year' as const, label: '3 Year' },
    { id: '5year' as const, label: '5 Year' },
    { id: '10year' as const, label: '10 Year' },
  ];

  const planData: Record<string, Array<{ goal: string; target: string; status: string; progress: number }>> = {
    '1year': [
      { goal: 'Break Top 50', target: 'Dec 2026', status: 'In progress', progress: 58 },
      { goal: 'Win ATP 500 title', target: 'Dec 2026', status: 'Achieved (Rotterdam)', progress: 100 },
      { goal: 'Grand Slam QF', target: 'Dec 2026', status: 'R4 best so far', progress: 60 },
      { goal: 'GBP 500k endorsement total', target: 'Dec 2026', status: 'GBP 285k contracted', progress: 57 },
      { goal: 'Masters 1000 SF or better', target: 'Dec 2026', status: 'QF best so far', progress: 40 },
    ],
    '3year': [
      { goal: 'Reach Top 20', target: 'Dec 2028', status: 'Currently #67', progress: 30 },
      { goal: 'ATP Finals qualification', target: 'Dec 2028', status: 'Race #54 currently', progress: 20 },
      { goal: 'Grand Slam SF', target: 'Dec 2028', status: 'Best: R4', progress: 25 },
      { goal: '5+ career titles', target: 'Dec 2028', status: '2 titles', progress: 40 },
      { goal: 'GBP 1M+ endorsements/yr', target: 'Dec 2028', status: 'GBP 285k current', progress: 28 },
    ],
    '5year': [
      { goal: 'Top 10 ranking', target: 'Dec 2030', status: 'Long-term target', progress: 15 },
      { goal: 'Grand Slam Final', target: 'Dec 2030', status: 'Development phase', progress: 10 },
      { goal: '10+ career titles', target: 'Dec 2030', status: '2 titles', progress: 20 },
      { goal: 'Olympic medal', target: 'LA 2028', status: 'Qualify through ranking', progress: 15 },
      { goal: 'Establish personal brand', target: 'Dec 2030', status: 'Building', progress: 25 },
    ],
    '10year': [
      { goal: 'Retirement planning (age 36-38)', target: '2034-2036', status: 'Early stage', progress: 5 },
      { goal: 'Coaching/commentary career', target: '2035+', status: 'Exploring interest', progress: 5 },
      { goal: 'Tennis academy foundation', target: '2032+', status: 'Concept phase', progress: 10 },
      { goal: 'Business investments portfolio', target: 'Ongoing', status: 'Adviser appointed', progress: 15 },
      { goal: 'Charitable foundation launch', target: '2030', status: 'Planning', progress: 8 },
    ],
  };

  return (
    <div className="space-y-6">

      <SectionHeader icon="🚀" title="Career Planning" subtitle="Season goals, ranking projections, development milestones, and long-term planning." />

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Current Ranking" value={`#${player.ranking}`} sub="ATP Singles" color="purple" />
        <StatCard label="Career High" value={`#${player.career_high}`} sub={player.career_high_date} color="teal" />
        <StatCard label="Turned Pro" value={player.turned_pro.toString()} sub={`${2026 - player.turned_pro} years on tour`} color="blue" />
        <StatCard label="YTD Titles" value="1" sub="Rotterdam ATP 500" color="orange" />
      </div>

      {/* Career Plan Tabs */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-800">
          {careerTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setCareerTab(tab.id)}
              className={`flex-1 py-3 text-xs font-medium transition-all ${careerTab === tab.id ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-600/5' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-5 space-y-4">
          {planData[careerTab]?.map((item, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-gray-200">{item.goal}</div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{item.target}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${item.progress >= 100 ? 'bg-teal-600/20 text-teal-400' : item.progress >= 50 ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="h-2 rounded-full bg-purple-500" style={{ width: `${Math.min(100, item.progress)}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Season Goals */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">2026 Season Goals</div>
        <div className="space-y-4">
          {goals.map((g, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-gray-200">{g.goal}</div>
                <div className="text-xs text-gray-500">{g.status}</div>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className={`h-2 rounded-full bg-${g.color}-500`} style={{ width: `${g.progress}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Year-End Projections */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Year-End Ranking Projections</div>
        <div className="space-y-3">
          {projections.map((p, i) => (
            <div key={i} className={`p-4 rounded-lg border ${i === 0 ? 'border-gray-700 bg-gray-900/30' : i === 1 ? 'border-blue-600/30 bg-blue-600/5' : 'border-teal-600/30 bg-teal-600/5'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-200">{p.scenario}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{p.pointsEOY.toLocaleString()} points . Ranking #{p.endYearRanking}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">#{p.endYearRanking}</div>
                  {p.tourFinals && <div className="text-xs text-yellow-400">Turin qualified</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grand Slam Points Breakdown */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Grand Slam Ranking Points — 2026</div>
        <div className="space-y-2 text-sm">
          {[
            { slam: 'Australian Open', round: 'R4', points: 180, colour: 'blue' },
            { slam: 'Roland-Garros', round: 'Not yet played', points: 0, colour: 'orange' },
            { slam: 'Wimbledon', round: 'Not yet played', points: 0, colour: 'green' },
            { slam: 'US Open', round: 'Not yet played', points: 0, colour: 'blue' },
          ].map((g, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50">
              <div className="text-gray-200">{g.slam}</div>
              <div className="text-gray-400">{g.round}</div>
              <div className={`font-bold ${g.points > 0 ? 'text-teal-400' : 'text-gray-600'}`}>{g.points > 0 ? `+${g.points} pts` : '—'}</div>
            </div>
          ))}
        </div>
      </div>
      <TennisAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── ACADEMY VIEW ──────────────────────────────────────────────────────────────
function AcademyView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  return (
    <div className="space-y-6">

      <SectionHeader icon="🎓" title="Academy & Development" subtitle="Academy affiliation, national programme details, and development pathway." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Academy" value="NTC" sub="National Tennis Centre" color="purple" />
        <StatCard label="Location" value="London" sub="Roehampton" color="teal" />
        <StatCard label="LTA Level" value="Level 2" sub="Pro Support Programme" color="blue" />
        <StatCard label="Annual Funding" value="GBP 15k" sub="LTA contribution" color="green" />
      </div>

      {/* Academy Affiliation */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/20 border border-purple-600/30 rounded-xl p-5">
        <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-3">PRIMARY ACADEMY AFFILIATION</div>
        <div className="text-white font-bold text-lg mb-1">National Tennis Centre, London</div>
        <div className="text-gray-400 text-sm mb-3">Roehampton, London SW15 . LTA flagship facility</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { label: 'Indoor Courts', value: '6' },
            { label: 'Outdoor Courts', value: '16' },
            { label: 'Gym Access', value: 'Full' },
            { label: 'Sports Science', value: 'On-site' },
          ].map((f, i) => (
            <div key={i} className="bg-black/20 rounded-lg p-2 text-center">
              <div className="text-white font-bold">{f.value}</div>
              <div className="text-gray-500 mt-0.5">{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* LTA Programme Details */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">LTA Pro Scholarship Programme — Level 2</div>
        <div className="space-y-2 text-sm text-gray-400">
          {[
            'Annual funding: GBP 15,000 (direct to player)',
            'Full NTC court access when UK-based',
            'Access to LTA physio network worldwide',
            'Annual biomechanics screening',
            'Sports psychology support (4 sessions/year)',
            'Strength & conditioning consultation',
            'Travel subsidies for Challenger events',
            'Media training workshops (2x/year)',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-800/50">
              <span className="text-teal-400">+</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Development Pathway */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Development Pathway Stages</div>
        <div className="space-y-3">
          {[
            { stage: 'Junior Programme', age: '10-16', status: 'Complete', desc: 'LTA Regional & National Junior programme' },
            { stage: 'Pro Scholarship — Level 3', age: '16-18', status: 'Complete', desc: 'Initial pro funding, Futures/Challengers' },
            { stage: 'Pro Scholarship — Level 2', age: '18-28', status: 'Current', desc: 'Full ATP tour support, NTC access' },
            { stage: 'Pro Scholarship — Level 1', age: 'Top 30', status: 'Target', desc: 'Premium funding, dedicated support team' },
          ].map((s, i) => (
            <div key={i} className={`p-3 rounded-lg border ${s.status === 'Current' ? 'border-purple-600/30 bg-purple-600/5' : s.status === 'Complete' ? 'border-gray-800 bg-gray-900/20' : 'border-blue-600/30 bg-blue-600/5'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-white font-medium">{s.stage}</div>
                <span className={`text-xs px-2 py-0.5 rounded ${s.status === 'Current' ? 'bg-purple-600/20 text-purple-400' : s.status === 'Complete' ? 'bg-teal-600/20 text-teal-400' : 'bg-blue-600/20 text-blue-400'}`}>{s.status}</span>
              </div>
              <div className="text-xs text-gray-400">Age range: {s.age} . {s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Junior Programme Alumni */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Notable NTC Alumni</div>
        <div className="space-y-2">
          {[
            { name: 'Jack Draper', ranking: '#15', note: 'Active ATP tour' },
            { name: 'Emma Raducanu', ranking: '#28', note: 'Active WTA tour' },
            { name: 'Cameron Hadley', ranking: '#42', note: 'Active ATP tour' },
            { name: 'Dan Evans', ranking: '#78', note: 'Active ATP tour' },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800/50 text-sm">
              <span className="text-gray-200 flex-1">{a.name}</span>
              <span className="text-purple-400 font-medium">{a.ranking}</span>
              <span className="text-xs text-gray-500">{a.note}</span>
            </div>
          ))}
        </div>
      </div>
      <TennisAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── MENTAL PERFORMANCE VIEW ───────────────────────────────────────────────────
function MentalPerformanceView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const debriefLog = [
    { date: '9 Apr', match: 'Monte-Carlo R2 vs Hurkacz', topic: 'Pressure serve at 5-4', outcome: 'Held serve. Positive close-out.', rating: 8 },
    { date: '15 Mar', match: 'Indian Wells QF vs Rune', topic: 'Third set collapse', outcome: 'Lost composure after losing 2nd set. Need reset routine.', rating: 4 },
    { date: '12 Mar', match: 'Indian Wells R3 vs Berrettini', topic: 'Tight tiebreak performance', outcome: 'Won 7-5 in TB. Breathing protocol worked.', rating: 7 },
    { date: '18 Feb', match: 'Rotterdam Final vs Paul', topic: 'Title pressure handling', outcome: 'Managed final nerves. Best mental performance of season.', rating: 9 },
  ];

  const weeklyRatings = [
    { week: 'W1 (Jan)', focus: 7, composure: 6, confidence: 7, resilience: 6 },
    { week: 'W8 (Feb)', focus: 8, composure: 7, confidence: 8, resilience: 7 },
    { week: 'W12 (Mar)', focus: 7, composure: 5, confidence: 6, resilience: 5 },
    { week: 'W15 (Apr)', focus: 8, composure: 7, confidence: 7, resilience: 7 },
  ];

  return (
    <div className="space-y-6">

      <SectionHeader icon="🧠" title="Mental Performance" subtitle="Mental coach, pre-match routines, pressure debriefs, and mindset tracking." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Mental Coach" value="Dr. Sterling" sub="Dr. Kate Sterling" color="purple" />
        <StatCard label="Sessions This Month" value="3" sub="Weekly schedule" color="teal" />
        <StatCard label="Avg Mental Rating" value="7.2/10" sub="Last 4 weeks" color="blue" />
        <StatCard label="Next Session" value="Tonight" sub="21:00 (post-match)" color="orange" />
      </div>

      {/* Mental Coach Card */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/20 border border-purple-600/30 rounded-xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-purple-600/20 border-2 border-purple-500/40 flex items-center justify-center text-2xl">🧠</div>
          <div>
            <div className="text-white font-bold text-lg">Dr. Kate Sterling</div>
            <div className="text-gray-400 text-sm">Sports Psychologist . PhD Applied Psychology</div>
            <div className="text-gray-500 text-xs">Remote sessions . Weekly calls . Match-day availability</div>
          </div>
        </div>
      </div>

      {/* Pre-Match Routine Checklist */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Pre-Match Routine Checklist</div>
        <div className="space-y-2">
          {[
            { time: 'T-90 min', task: 'Breathing exercise (4-7-8 pattern, 5 cycles)', done: true },
            { time: 'T-60 min', task: 'Visualisation: first 3 games of each set', done: true },
            { time: 'T-45 min', task: 'Physical warm-up (Luis protocol)', done: false },
            { time: 'T-30 min', task: 'Review match plan — 3 key tactical points', done: false },
            { time: 'T-15 min', task: 'Activation music playlist (10 min)', done: false },
            { time: 'T-5 min', task: 'Power pose + affirmation statement', done: false },
            { time: 'Walk-on', task: 'Focus word: "CONTROL"', done: false },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${item.done ? 'bg-gray-900/30 opacity-60' : 'bg-[#0d0f1a]'}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${item.done ? 'border-teal-500 bg-teal-500/20' : 'border-gray-600'}`}>
                {item.done && <span className="text-teal-400 text-xs">+</span>}
              </div>
              <span className="text-xs text-gray-500 w-16">{item.time}</span>
              <span className={`text-sm ${item.done ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{item.task}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pressure Situations Debrief Log */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <div className="text-sm font-semibold text-white">Pressure Situations Debrief Log</div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Match</th>
              <th className="text-left p-3">Situation</th>
              <th className="text-left p-3">Outcome</th>
              <th className="text-left p-3">Rating</th>
            </tr>
          </thead>
          <tbody>
            {debriefLog.map((d, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="p-3 text-gray-400 text-xs">{d.date}</td>
                <td className="p-3 text-gray-200">{d.match}</td>
                <td className="p-3 text-gray-400 text-xs">{d.topic}</td>
                <td className="p-3 text-gray-400 text-xs">{d.outcome}</td>
                <td className="p-3">
                  <span className={`text-xs font-bold ${d.rating >= 7 ? 'text-teal-400' : d.rating >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>{d.rating}/10</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mindset Tracker */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Mindset Tracker — Weekly Ratings</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-800">
                <th className="text-left pb-2">Week</th>
                <th className="text-left pb-2">Focus</th>
                <th className="text-left pb-2">Composure</th>
                <th className="text-left pb-2">Confidence</th>
                <th className="text-left pb-2">Resilience</th>
              </tr>
            </thead>
            <tbody>
              {weeklyRatings.map((r, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="py-2 text-gray-400">{r.week}</td>
                  {[r.focus, r.composure, r.confidence, r.resilience].map((v, j) => (
                    <td key={j} className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-800 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${v >= 7 ? 'bg-teal-500' : v >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${v * 10}%` }}></div>
                        </div>
                        <span className={`text-xs font-medium ${v >= 7 ? 'text-teal-400' : v >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>{v}/10</span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <TennisAISection context="mental" player={player} session={session} />
    </div>
  );
}

// ─── SETTINGS VIEW ─────────────────────────────────────────────────────────────

// ─── COURT BOOKING VIEW ───────────────────────────────────────────────────────
function CourtBookingView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const [bookings, setBookings] = useState<Array<{id:string, date:string, time:string, court:string, type:string, partner:string, notes:string, status:'confirmed'|'pending'|'cancelled'}>>([
    { id:'1', date:'2025-04-07', time:'09:00', court:'Court 3 (Clay)', type:'Practice', partner:'Marco Bianchi (Coach)', notes:'Serve practice + baseline drills', status:'confirmed' },
    { id:'2', date:'2025-04-07', time:'14:00', court:'Court 1 (Hard)', type:'Match Play', partner:'Training Partner', notes:'Simulated match conditions', status:'confirmed' },
    { id:'3', date:'2025-04-08', time:'10:30', court:'Court 2 (Clay)', type:'Fitness', partner:'Sarah Okafor (Physio)', notes:'Footwork + conditioning', status:'pending' },
  ]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [newBooking, setNewBooking] = useState({ date:'', time:'', court:'', type:'Practice', partner:'', notes:'' });

  const typeColors: Record<string, string> = {
    'Practice': 'bg-teal-600/20 text-teal-400 border-teal-600/30',
    'Match Play': 'bg-purple-600/20 text-purple-400 border-purple-600/30',
    'Fitness': 'bg-amber-600/20 text-amber-400 border-amber-600/30',
    'Recovery': 'bg-gray-600/20 text-gray-400 border-gray-600/30',
  };

  const statusColors: Record<string, string> = {
    'confirmed': 'bg-green-600/20 text-green-400 border-green-600/30',
    'pending': 'bg-amber-600/20 text-amber-400 border-amber-600/30',
    'cancelled': 'bg-red-600/20 text-red-400 border-red-600/30',
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekDates = ['07 Apr', '08 Apr', '09 Apr', '10 Apr', '11 Apr', '12 Apr', '13 Apr'];
  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  const calendarSlots: Array<{ day: number; timeIdx: number; type: string; label: string }> = [
    { day: 0, timeIdx: 1, type: 'Practice', label: '09:00 Practice' },
    { day: 0, timeIdx: 6, type: 'Match Play', label: '14:00 Match Play' },
    { day: 1, timeIdx: 2, type: 'Fitness', label: '10:30 Fitness' },
    { day: 2, timeIdx: 1, type: 'Practice', label: '09:00 Practice' },
    { day: 3, timeIdx: 3, type: 'Recovery', label: '11:00 Recovery' },
  ];

  const calendarBlockColors: Record<string, string> = {
    'Practice': 'bg-teal-600/30 border-teal-500/40 text-teal-300',
    'Match Play': 'bg-purple-600/30 border-purple-500/40 text-purple-300',
    'Fitness': 'bg-amber-600/30 border-amber-500/40 text-amber-300',
    'Recovery': 'bg-gray-600/30 border-gray-500/40 text-gray-300',
  };

  const courts = [
    { name: 'Court 1', surface: 'Hard', status: 'Available Now', statusColor: 'text-teal-400' },
    { name: 'Court 2', surface: 'Clay', status: 'Booked Until 14:00', statusColor: 'text-amber-400' },
    { name: 'Court 3', surface: 'Clay', status: 'Available Now', statusColor: 'text-teal-400' },
    { name: 'Indoor Court', surface: 'Hard', status: 'Maintenance', statusColor: 'text-red-400' },
  ];

  const handleConfirmBooking = () => {
    if (!newBooking.date || !newBooking.time || !newBooking.court) return;
    setBookings(prev => [...prev, { id: String(Date.now()), ...newBooking, status: 'pending' }]);
    setNewBooking({ date:'', time:'', court:'', type:'Practice', partner:'', notes:'' });
    setShowBookingForm(false);
  };

  const handleCancelBooking = (id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b));
  };

  return (
    <div className="space-y-6">

      <SectionHeader icon="🏟️" title="Court Booking — Practice Facilities" subtitle="Book courts, manage sessions, and view facility availability." />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="This Week" value="5 sessions" sub="Mon–Sun bookings" color="purple" />
        <StatCard label="Hours Booked" value="12.5h" sub="Total court time" color="teal" />
        <StatCard label="Next Session" value="Tomorrow 09:00" sub="Court 3 (Clay)" color="orange" />
      </div>

      {/* Weekly Calendar Grid */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Weekly Court Schedule</div>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-8 gap-px min-w-[640px]">
            <div className="text-xs text-gray-600 p-2"></div>
            {weekDays.map((day, i) => (
              <div key={day} className="text-xs text-gray-400 font-medium text-center p-2 border-b border-gray-800">
                <div>{day}</div>
                <div className="text-gray-600 text-[10px]">{weekDates[i]}</div>
              </div>
            ))}
            {timeSlots.map((time, tIdx) => (
              <div key={`row-${time}`} className="contents">
                <div className="text-[10px] text-gray-600 p-2 text-right border-r border-gray-800/50">{time}</div>
                {weekDays.map((_, dIdx) => {
                  const slot = calendarSlots.find(s => s.day === dIdx && s.timeIdx === tIdx);
                  return (
                    <div key={`${dIdx}-${tIdx}`} className="h-8 border-b border-gray-800/30 relative">
                      {slot && (
                        <div className={`absolute inset-0.5 rounded border text-[9px] font-medium px-1 flex items-center truncate ${calendarBlockColors[slot.type] || ''}`}>
                          {slot.label}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-800">
          {Object.entries(calendarBlockColors).map(([type, cls]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded border ${cls}`}></div>
              <span className="text-[10px] text-gray-500">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-white">Bookings</div>
          <button onClick={() => setShowBookingForm(!showBookingForm)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30 hover:bg-purple-600/30 transition-colors">
            {showBookingForm ? 'Close' : '+ Book Court'}
          </button>
        </div>

        {showBookingForm && (
          <div className="bg-[#0a0c14] border border-purple-600/30 rounded-xl p-4 mb-4 space-y-3">
            <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">New Court Booking</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Date</label>
                <input type="date" value={newBooking.date} onChange={e => setNewBooking(prev => ({ ...prev, date: e.target.value }))} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Time</label>
                <input type="time" value={newBooking.time} onChange={e => setNewBooking(prev => ({ ...prev, time: e.target.value }))} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Court</label>
                <select value={newBooking.court} onChange={e => setNewBooking(prev => ({ ...prev, court: e.target.value }))} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-purple-500 focus:outline-none">
                  <option value="">Select court...</option>
                  <option value="Court 1 (Hard)">Court 1 — Hard</option>
                  <option value="Court 2 (Clay)">Court 2 — Clay</option>
                  <option value="Court 3 (Clay)">Court 3 — Clay</option>
                  <option value="Indoor Court (Hard)">Indoor Court — Hard</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Session Type</label>
                <select value={newBooking.type} onChange={e => setNewBooking(prev => ({ ...prev, type: e.target.value }))} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-purple-500 focus:outline-none">
                  <option value="Practice">Practice</option>
                  <option value="Match Play">Match Play</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Recovery">Recovery</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Partner</label>
                <input type="text" value={newBooking.partner} onChange={e => setNewBooking(prev => ({ ...prev, partner: e.target.value }))} placeholder="Partner name..." className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Notes</label>
                <input type="text" value={newBooking.notes} onChange={e => setNewBooking(prev => ({ ...prev, notes: e.target.value }))} placeholder="Session notes..." className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:border-purple-500 focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleConfirmBooking} className="px-4 py-2 rounded-lg text-xs font-medium bg-teal-600/20 text-teal-400 border border-teal-600/30 hover:bg-teal-600/30 transition-colors">Confirm Booking</button>
              <button onClick={() => setShowBookingForm(false)} className="px-4 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {bookings.map(booking => (
            <div key={booking.id} className={`p-4 rounded-lg border ${booking.status === 'cancelled' ? 'border-gray-800/50 bg-gray-900/20 opacity-50' : 'border-gray-800 bg-[#0a0c14]'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className={`text-sm font-medium ${booking.status === 'cancelled' ? 'text-gray-600 line-through' : 'text-white'}`}>{booking.date} — {booking.time}</div>
                  <div className={`text-xs ${booking.status === 'cancelled' ? 'text-gray-700 line-through' : 'text-gray-400'}`}>{booking.court}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${typeColors[booking.type] || 'bg-gray-700 text-gray-400'}`}>{booking.type}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusColors[booking.status]}`}>{booking.status}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  {booking.partner && <div className={`text-xs ${booking.status === 'cancelled' ? 'text-gray-700 line-through' : 'text-gray-300'}`}>Partner: {booking.partner}</div>}
                  {booking.notes && <div className={`text-xs mt-1 ${booking.status === 'cancelled' ? 'text-gray-700 line-through' : 'text-gray-500'}`}>{booking.notes}</div>}
                </div>
                {booking.status !== 'cancelled' && (
                  <button onClick={() => handleCancelBooking(booking.id)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Academy Courts Available */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Academy Courts Available</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {courts.map((court, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
              <div className="text-sm text-white font-medium mb-1">{court.name}</div>
              <div className="text-xs text-gray-500 mb-2">{court.surface}</div>
              <div className={`text-xs font-medium ${court.statusColor}`}>{court.status}</div>
            </div>
          ))}
        </div>
      </div>
      <TennisAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── PLAYER PROFILE CARD (ENHANCED) ──────────────────────────────────────────
function PlayerCard({ player, session }: { player: TennisPlayer; session?: SportsDemoSession }) {
  const profileNameLive = useTennisProfileName()
  const profilePhotoLive = useTennisProfilePhoto()
  const surfaceWinPct = [
    { surface: 'Clay', pct: 58, color: 'bg-orange-500' },
    { surface: 'Hard', pct: 65, color: 'bg-blue-500' },
    { surface: 'Grass', pct: 72, color: 'bg-green-500' },
    { surface: 'Indoor', pct: 60, color: 'bg-purple-500' },
  ];

  const recentForm = ['W', 'W', 'L', 'W', 'L'];

  return (
    <div className="relative w-52 rounded-xl overflow-hidden border-2 border-purple-500/40 shadow-2xl shadow-purple-900/50 flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #0d1929 50%, #0a2218 100%)' }}>
      {/* Header stripe */}
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #6C3FC5, #0D9488)' }}></div>
      <div className="p-4">
        {/* Ranking badges */}
        <div className="flex items-start justify-between mb-3">
          <div className="text-center">
            <div className="text-3xl font-black text-white leading-none">{player.ranking}</div>
            <div className="text-[10px] text-purple-300 font-medium uppercase tracking-wider">ATP Rank</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-gray-400 leading-none">{player.doubles_ranking}</div>
            <div className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">Doubles</div>
          </div>
        </div>
        {/* Player photo */}
        <div className="w-full h-28 rounded-lg mb-3 flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.2) 0%, rgba(13,148,136,0.2) 100%)', border: '1px solid rgba(108,63,197,0.3)' }}>
          {(profilePhotoLive || session?.photoDataUrl) ? <img src={profilePhotoLive || session?.photoDataUrl || ''} alt={session?.userName || 'Player'} className="w-full h-full object-cover" style={{ borderRadius: 'inherit' }} /> : <div className="text-2xl font-black" style={{ color: '#0ea5e9' }}>{(session?.userName || player.name || 'AL').slice(0,2).toUpperCase()}</div>}
        </div>
        {/* Name */}
        {(() => { const fullName = profileNameLive || session?.userName || player.name; return (<>
        <div className="text-white font-black text-sm uppercase tracking-wide text-center leading-tight mb-0.5">{fullName.split(' ')[0]}</div>
        <div className="text-purple-300 font-bold text-xs uppercase tracking-widest text-center">{fullName.split(' ').slice(1).join(' ')}</div>
        </>)})()}
        {(() => { const nn = typeof window !== 'undefined' ? localStorage.getItem('lumio_tennis_nickname') : null; return nn ? <div className="text-center mb-2" style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>&quot;{nn}&quot;</div> : <div className="mb-2" /> })()}

        {/* Surface Win % bars */}
        <div className="space-y-1.5 mb-2">
          {surfaceWinPct.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="text-[8px] text-gray-500 w-10">{s.surface}</div>
              <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                <div className={`${s.color} h-1.5 rounded-full`} style={{ width: `${s.pct}%` }}></div>
              </div>
              <div className="text-[9px] text-gray-400 w-7 text-right">{s.pct}%</div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-1 mb-2">
          {[
            { val: '63', label: 'SRV%' },
            { val: '41', label: 'BRK%' },
            { val: '68', label: 'WIN%' },
          ].map((s, i) => (
            <div key={i} className="text-center bg-black/20 rounded p-1.5">
              <div className="text-white font-black text-base leading-none">{s.val}</div>
              <div className="text-[9px] text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Career titles + season record */}
        <div className="flex items-center justify-between text-[9px] text-gray-500 mb-2">
          <span>Titles: <span className="text-white font-bold">{player.career_titles}</span></span>
          <span>Season: <span className="text-white font-bold">{player.season_wins}W-{player.season_losses}L</span></span>
        </div>

        {/* Current form dots */}
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <span className="text-[8px] text-gray-600 mr-1">FORM:</span>
          {recentForm.map((r, i) => (
            <div key={i} className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${r === 'W' ? 'bg-teal-600/40 text-teal-400' : 'bg-red-600/30 text-red-400'}`}>{r}</div>
          ))}
        </div>

        {/* Tour badge */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-gray-500">{player.nationality}</span>
          <span className="text-[9px] font-bold text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">{player.tour} TOUR</span>
        </div>
      </div>
      {/* Footer */}
      <div className="px-3 py-1.5 text-center border-t border-white/5"
        style={{ background: 'linear-gradient(90deg, rgba(108,63,197,0.3), rgba(13,148,136,0.3))' }}>
        <div className="text-[9px] font-bold text-white/80 uppercase tracking-widest">LUMIO TOUR</div>
      </div>
    </div>
  );
}

// ─── LIVE SCORES VIEW ──────────────────────────────────────────────────────────
const LiveScoresView = ({ liveScores, fixtures, player, session }: { liveScores: any[]; fixtures: any[]; player: TennisPlayer; session: SportsDemoSession }) => {
  const DEMO_MATCHES = [
    { p1: 'L. Brenner [1]', p2: 'C. Valdez [2]', score: '6-4 3-6 6-3', tournament: 'Monte Carlo Masters', surface: 'Clay', round: 'Final', status: 'Live', set: '3rd set' },
    { p1: 'N. Djokovic [3]', p2: 'D. Medvedev [4]', score: '7-6(5) 4-6 2-1', tournament: 'Monte Carlo Masters', surface: 'Clay', round: 'SF', status: 'Live', set: '3rd set' },
    { p1: 'A. Rivera [67]', p2: 'C. Ferreira [54]', score: '6-4 6-7(3)', tournament: 'Brighton ATP 250', surface: 'Hard', round: 'QF', status: 'Live', set: '3rd set' },
    { p1: 'C. Ruud [7]', p2: 'S. Tsitsipas [9]', score: '', tournament: 'Monte Carlo Masters', surface: 'Clay', round: 'SF', status: '14:00', set: '' },
    { p1: 'T. Fritz [5]', p2: 'A. Rublev [6]', score: '', tournament: 'Monte Carlo Masters', surface: 'Clay', round: 'QF', status: '16:30', set: '' },
    { p1: 'H. Rune [12]', p2: 'A. De Minaur [8]', score: '6-3 6-4', tournament: 'Brighton ATP 250', surface: 'Hard', round: 'QF', status: 'Finished', set: '' },
  ];
  const matches = liveScores.length > 0 ? liveScores : DEMO_MATCHES;
  const isDemo = liveScores.length === 0;
  return (
    <div>
      <SectionHeader title="Live Scores — ATP Tour" subtitle={isDemo ? 'Demo data — add NEXT_PUBLIC_TENNIS_API_KEY for live scores' : `${matches.length} matches today`} icon="🔴" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {matches.map((m: any, i: number) => (
          <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SurfaceBadge surface={m.surface} />
                <span className="text-xs text-gray-500">{m.tournament}</span>
              </div>
              <div className="flex items-center gap-2">
                {m.status === 'Live' && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                <span className={`text-xs font-semibold ${m.status === 'Live' ? 'text-green-400' : m.status === 'Finished' ? 'text-gray-500' : 'text-gray-400'}`}>{m.status}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{m.p1}</span>
                {m.score && <span className="text-sm font-bold text-white">{m.score.split(' ')[0] || ''}</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-300">{m.p2}</span>
                {m.score && <span className="text-sm text-gray-400">{m.score.split(' ').slice(1).join(' ')}</span>}
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-800">
              <span className="text-xs text-gray-500">{m.round}</span>
              {m.set && <span className="text-xs text-purple-400">{m.set}</span>}
            </div>
          </div>
        ))}
      </div>
      {isDemo && <p className="text-xs text-gray-600 text-center">Powered by API-Tennis — add NEXT_PUBLIC_TENNIS_API_KEY to enable live data</p>}
      <TennisAISection context="default" player={player} session={session} />
    </div>
  );
};

// ─── OPPONENT SCOUT VIEW ────────────────────────────────────────────────────────
const OpponentScoutView = ({ h2hData, player, session }: { h2hData: any[]; player: TennisPlayer; session: SportsDemoSession }) => {
  const opponent = { name: 'Carlos Ferreira', ranking: 54, flag: '🇧🇷', nationality: 'Brazilian', age: 26, height: "6'0\" / 183cm", plays: 'Left-handed', backhand: 'Two-handed', coach: 'Ricardo Souza' };
  return (
    <div>
      <SectionHeader title="Opponent Intelligence" subtitle={`Next: ${opponent.name} (${opponent.flag} #${opponent.ranking})`} icon="🔍" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="H2H Record" value="3-1" sub="Alex leads" color="green" />
        <StatCard label="Last Meeting" value="Alex W" sub="7-5 6-3 — Roland Garros 2024" color="purple" />
        <StatCard label="Clay Win %" value="61%" sub="Ferreira on clay" color="orange" />
        <StatCard label="1st Serve Speed" value="198 km/h" sub="Average" color="blue" />
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-4">Surface Breakdown — Ferreira</h3>
        <div className="grid grid-cols-4 gap-4 text-center text-sm">
          <div className="text-gray-500 font-semibold text-left">Surface</div>
          <div className="text-gray-500 font-semibold">Win %</div>
          <div className="text-gray-500 font-semibold">Matches</div>
          <div className="text-gray-500 font-semibold">Avg Duration</div>
          {[
            { s: 'Clay', w: '61%', m: '48', d: '1h 52m' },
            { s: 'Hard', w: '54%', m: '62', d: '1h 41m' },
            { s: 'Grass', w: '42%', m: '12', d: '1h 28m' },
          ].map(r => (<>
            <div key={r.s} className="text-left"><SurfaceBadge surface={r.s} /></div>
            <div className="text-white font-semibold">{r.w}</div>
            <div className="text-gray-400">{r.m}</div>
            <div className="text-gray-400">{r.d}</div>
          </>))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { title: '2nd Serve Return', desc: 'Exploitable — only 54% win rate on 2nd serve return points. Attack wide on deuce side.', color: 'border-red-600/30' },
          { title: 'Tiebreak Record', desc: 'Weak — 38% tiebreak win rate this season. Push sets to tiebreaks when possible.', color: 'border-amber-600/30' },
          { title: 'Under Pressure', desc: 'Breaks down in deciding sets — 3-7 record in 3rd sets this year. Apply early pressure.', color: 'border-red-600/30' },
        ].map(w => (
          <div key={w.title} className={`bg-[#0d0f1a] border ${w.color} rounded-xl p-4`}>
            <h4 className="text-sm font-bold text-white mb-2">⚠️ {w.title}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">{w.desc}</p>
          </div>
        ))}
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">🎯 Tactical Notes — Coach</h3>
        <ul className="space-y-2">
          {['Target Ferreira\'s backhand side early — his two-handed backhand under pressure has a 23% error rate in rallies over 8 shots.',
            'Serve wide on the ad side — Ferreira moves poorly to his left. 68% of his return errors come from wide serves.',
            'Stay aggressive in the 3rd set — historical data shows his level drops significantly. Win the first 3 games and the set is yours.',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-purple-400 font-bold mt-0.5">{i + 1}.</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
      <TennisAISection context="opponentintel" player={player} session={session} />
    </div>
  );
};

// ─── SURFACE ANALYSIS VIEW ──────────────────────────────────────────────────────
const SurfaceAnalysisView = ({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) => {
  const surfaces = [
    { name: 'Clay', emoji: '🟤', win: 68, matches: 50, titles: 1, wl: '34-16', best: 'QF Roland Garros', color: 'orange' },
    { name: 'Hard', emoji: '🔵', win: 61, matches: 72, titles: 1, wl: '44-28', best: 'R16 US Open', color: 'blue' },
    { name: 'Grass', emoji: '🟢', win: 55, matches: 20, titles: 0, wl: '11-9', best: 'R32 Wimbledon', color: 'green' },
  ];
  const levels = [
    { level: 'Grand Slams', played: 14, w: 22, l: 14, best: 'QF', pts: '2000' },
    { level: 'Masters 1000', played: 18, w: 28, l: 18, best: 'SF', pts: '1000' },
    { level: 'ATP 500', played: 12, w: 19, l: 8, best: 'W', pts: '500' },
    { level: 'ATP 250', played: 16, w: 18, l: 7, best: 'W', pts: '250' },
    { level: 'Challengers', played: 8, w: 14, l: 4, best: 'W', pts: '125' },
  ];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthData = [3,4,2,5,3,4,2,3,0,0,0,0]; // wins per month
  const monthLoss = [1,2,1,1,2,1,1,2,0,0,0,0];
  return (
    <div>
      <SectionHeader title="Surface & Tournament Breakdown" subtitle={`${player.name} — 2026 Season`} icon="🏟️" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {surfaces.map(s => (
          <div key={s.name} className={`bg-[#0d0f1a] border border-gray-800 rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{s.emoji}</span>
                <div>
                  <h3 className="text-lg font-bold text-white">{s.name}</h3>
                  <p className="text-xs text-gray-500">{s.wl} · {s.titles} title{s.titles !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{s.win}%</div>
                <p className="text-xs text-gray-500">win rate</p>
              </div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
              <div className="h-2 rounded-full" style={{ width: `${s.win}%`, background: s.color === 'orange' ? '#ea580c' : s.color === 'blue' ? '#3b82f6' : '#22c55e' }} />
            </div>
            <p className="text-xs text-gray-500">Best result: {s.best}</p>
          </div>
        ))}
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-4">Tournament Level Breakdown</h3>
        <div className="grid grid-cols-6 gap-2 text-xs text-center mb-2">
          <div className="text-gray-500 font-semibold text-left">Level</div>
          <div className="text-gray-500 font-semibold">Events</div>
          <div className="text-gray-500 font-semibold">W</div>
          <div className="text-gray-500 font-semibold">L</div>
          <div className="text-gray-500 font-semibold">Best</div>
          <div className="text-gray-500 font-semibold">Pts</div>
        </div>
        {levels.map(l => (
          <div key={l.level} className="grid grid-cols-6 gap-2 text-sm text-center py-2 border-t border-gray-800">
            <div className="text-left text-gray-300 text-xs">{l.level}</div>
            <div className="text-white font-semibold">{l.played}</div>
            <div className="text-green-400">{l.w}</div>
            <div className="text-red-400">{l.l}</div>
            <div className="text-purple-400">{l.best}</div>
            <div className="text-gray-400">{l.pts}</div>
          </div>
        ))}
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-4">12-Month Form — Wins & Losses</h3>
        <div className="flex items-end gap-1 h-24">
          {months.map((m, i) => (
            <div key={m} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex flex-col items-center">
                {monthData[i] > 0 && <div className="w-full rounded-t" style={{ height: monthData[i] * 12, background: '#22c55e', opacity: 0.8 }} />}
                {monthLoss[i] > 0 && <div className="w-full rounded-b" style={{ height: monthLoss[i] * 12, background: '#ef4444', opacity: 0.5 }} />}
              </div>
              <span className="text-[10px] text-gray-600">{m}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Break Pts Saved" value="67%" sub="148/221" color="green" />
        <StatCard label="Tiebreaks Won" value="58%" sub="11/19" color="purple" />
        <StatCard label="Deciding Sets" value="64%" sub="9/14" color="blue" />
        <StatCard label="5-Set Record" value="3-1" sub="75% win rate" color="teal" />
      </div>
      <TennisAISection context="surface" player={player} session={session} />
    </div>
  );
};

// ─── DRAW & BRACKET VIEW ────────────────────────────────────────────────────────
const DrawBracketView = ({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) => {
  const [drawTab, setDrawTab] = useState<'draw'|'schedule'|'prize'|'points'>('draw');
  const rounds = ['R16', 'QF', 'SF', 'Final'];
  const bracket = [
    // R16 matchups (8 matches)
    [
      { p1: 'T. Nakashima [1]', p2: 'Qualifier', score: '6-3 6-4', winner: 1 },
      { p1: 'L. Musetti [8]', p2: 'M. Cressy', score: '7-6 6-4', winner: 1 },
      { p1: 'J. Draper [3]', p2: 'D. Shapovalov', score: '6-2 7-5', winner: 1 },
      { p1: 'B. Sutton [5]', p2: 'F. Caballero', score: '4-6 6-3 7-6', winner: 1 },
      { p1: 'A. Fils [4]', p2: 'L. Djere', score: '6-1 6-3', winner: 1 },
      { p1: 'A. Rivera [6]', p2: 'R. Carballes', score: '6-4 6-2', winner: 1 },
      { p1: 'C. Ferreira [7]', p2: 'J. Munar', score: '7-5 6-7 6-4', winner: 1 },
      { p1: 'U. Humbert [2]', p2: 'M. Arnaldi', score: '6-3 6-4', winner: 1 },
    ],
    // QF (4 matches)
    [
      { p1: 'T. Nakashima [1]', p2: 'L. Musetti [8]', score: '', winner: 0 },
      { p1: 'J. Draper [3]', p2: 'B. Sutton [5]', score: '', winner: 0 },
      { p1: 'A. Fils [4]', p2: 'A. Rivera [6]', score: '', winner: 0 },
      { p1: 'C. Ferreira [7]', p2: 'U. Humbert [2]', score: '', winner: 0 },
    ],
    // SF
    [{ p1: 'TBD', p2: 'TBD', score: '', winner: 0 }, { p1: 'TBD', p2: 'TBD', score: '', winner: 0 }],
    // Final
    [{ p1: 'TBD', p2: 'TBD', score: '', winner: 0 }],
  ];
  const prizes = [
    { round: 'Winner', prize: '€81,310', points: 250 },
    { round: 'Final', prize: '€46,390', points: 150 },
    { round: 'SF', prize: '€26,440', points: 90 },
    { round: 'QF', prize: '€15,200', points: 45 },
    { round: 'R16', prize: '€9,435', points: 20 },
    { round: 'R32', prize: '€5,900', points: 0 },
  ];
  return (
    <div>
      <SectionHeader title="Tournament Draw — Brighton Open ATP 250" subtitle="Hard Court · Brighton, UK · 7-13 April 2026" icon="🏆" />
      <div className="flex gap-2 mb-6">
        {(['draw','schedule','prize','points'] as const).map(t => (
          <button key={t} onClick={() => setDrawTab(t)} className={`px-4 py-2 rounded-lg text-xs font-semibold ${drawTab === t ? 'bg-purple-600 text-white' : 'bg-[#0d0f1a] border border-gray-800 text-gray-400 hover:text-white'}`}>
            {t === 'draw' ? 'Draw' : t === 'schedule' ? 'Schedule' : t === 'prize' ? 'Prize Money' : 'Points'}
          </button>
        ))}
      </div>
      {drawTab === 'draw' && (
        <div className="overflow-x-auto">
          <div className="flex gap-6 min-w-[800px]">
            {bracket.map((round, ri) => (
              <div key={ri} className="flex-1">
                <div className="text-xs font-semibold text-gray-500 mb-3 text-center">{rounds[ri]}</div>
                <div className="space-y-3" style={{ marginTop: ri * 24 }}>
                  {round.map((match: any, mi: number) => {
                    const isAlex = match.p1.includes('Rivera') || match.p2.includes('Rivera');
                    const isFerreira = match.p1.includes('Ferreira') || match.p2.includes('Ferreira');
                    return (
                      <div key={mi} className={`bg-[#0d0f1a] border rounded-lg p-2.5 text-xs ${isAlex ? 'border-purple-600/50' : isFerreira ? 'border-amber-600/30' : 'border-gray-800'}`}>
                        <div className={`flex justify-between ${match.winner === 1 ? 'font-bold text-white' : 'text-gray-400'}`}>
                          <span className="truncate">{match.p1}</span>
                          {match.score && <span className="ml-2 text-gray-500 whitespace-nowrap">{match.score.split(' ')[0]}</span>}
                        </div>
                        <div className={`flex justify-between mt-1 ${match.winner === 2 ? 'font-bold text-white' : 'text-gray-400'}`}>
                          <span className="truncate">{match.p2}</span>
                          {match.score && <span className="ml-2 text-gray-500 whitespace-nowrap">{match.score.split(' ').slice(1).join(' ')}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {drawTab === 'prize' && (
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="grid grid-cols-3 gap-2 text-xs text-center mb-2">
            <div className="text-gray-500 font-semibold text-left">Round</div>
            <div className="text-gray-500 font-semibold">Prize Money</div>
            <div className="text-gray-500 font-semibold">Ranking Points</div>
          </div>
          {prizes.map(p => (
            <div key={p.round} className="grid grid-cols-3 gap-2 text-sm text-center py-2.5 border-t border-gray-800">
              <div className="text-left text-gray-300">{p.round}</div>
              <div className="text-green-400 font-semibold">{p.prize}</div>
              <div className="text-purple-400 font-semibold">{p.points}</div>
            </div>
          ))}
        </div>
      )}
      {(drawTab === 'schedule' || drawTab === 'points') && (
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">{drawTab === 'schedule' ? 'Order of Play — updated daily by tournament' : 'Points breakdown by round'}</p>
        </div>
      )}
      <TennisAISection context="default" player={player} session={session} />
    </div>
  );
};

// ─── TEAM COMMS VIEW ────────────────────────────────────────────────────────────
const TeamCommsView = ({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) => {
  const [recipient, setRecipient] = useState('All Team');
  const [msgType, setMsgType] = useState('Update');
  const [msgText, setMsgText] = useState('');
  const RECIPIENTS = ['All Team', 'Coach', 'Physio', 'Agent', 'Stringer', 'Doubles Partner'];
  const MSG_TYPES = ['Update', 'Urgent', 'Schedule Change', 'Match Report'];
  const MESSAGES = [
    { id: 1, from: 'Alex Rivera', role: 'Player', to: 'All Team', initial: 'AR', color: '#7c3aed', text: 'Match report from Brighton: Won 7-5 6-3. Serve felt strong, backhand needs work on clay. Full video review tomorrow.', time: '2h ago', read: true },
    { id: 2, from: 'Alex Rivera', role: 'Player', to: 'Coach', initial: 'AR', color: '#7c3aed', text: 'Can we move Tuesday\'s session to 8am? Physio slot at 10.', time: '5h ago', read: true },
    { id: 3, from: 'Alex Rivera', role: 'Player', to: 'Coach + Physio', initial: 'AR', color: '#7c3aed', text: 'Recovery score this morning: 84. Good to train full intensity today.', time: 'Yesterday', read: true },
    { id: 4, from: 'James Whitfield', role: 'Agent', to: 'Alex Rivera', initial: 'JW', color: '#0d9488', text: 'IMG confirmed exhibition slot in Dubai, Dec 12–15. Check diary.', time: 'Yesterday', read: false },
    { id: 5, from: 'Tom Bradley', role: 'Stringer', to: 'Alex Rivera', initial: 'TB', color: '#3b82f6', text: 'String tension adjusted to 54lbs for clay swing. Let me know if you want further tweaks.', time: '2d ago', read: true },
  ];
  return (
    <div>
      <SectionHeader title="Team Communications" subtitle="Messages between you and your support team" icon="💬" />
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Recipient</label>
            <select value={recipient} onChange={e => setRecipient(e.target.value)} className="w-full bg-[#07080F] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              {RECIPIENTS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Type</label>
            <select value={msgType} onChange={e => setMsgType(e.target.value)} className="w-full bg-[#07080F] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              {MSG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <textarea value={msgText} onChange={e => setMsgText(e.target.value)} rows={3} placeholder="Write a message to your team..." className="w-full bg-[#07080F] border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 mb-3" />
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-semibold">Send Message</button>
      </div>
      <div className="space-y-3">
        {MESSAGES.map(m => (
          <div key={m.id} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: m.color }}>{m.initial}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-semibold text-white">{m.from}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{m.role}</span>
                <span className="text-xs text-gray-600">→ {m.to}</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{m.text}</p>
            </div>
            <div className="flex flex-col items-end shrink-0 gap-1">
              <span className="text-xs text-gray-600">{m.time}</span>
              {m.read && <span className="text-xs text-blue-400">✓✓</span>}
              {!m.read && <span className="w-2 h-2 rounded-full bg-purple-500" />}
            </div>
          </div>
        ))}
      </div>
      <TennisAISection context="default" player={player} session={session} />
    </div>
  );
};

// ─── ACCREDITATIONS VIEW ────────────────────────────────────────────────────────
const AccreditationsView = ({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) => {
  const accreditations = [
    { name: 'ATP Tour Card', status: 'Active', org: 'ATP', expires: 'Dec 2026', daysLeft: 270 },
    { name: 'ITF Registration', status: 'Active', org: 'ITF', expires: 'Dec 2026', daysLeft: 270 },
    { name: 'LTA Licence', status: 'Active', org: 'LTA (British)', expires: 'Mar 2027', daysLeft: 360 },
    { name: 'Wimbledon Accreditation', status: 'Seasonal', org: 'AELTC', expires: 'Jun 2026', daysLeft: 87 },
    { name: 'US Open Accreditation', status: 'Applied', org: 'USTA', expires: 'Aug 2026', daysLeft: 148 },
    { name: 'Roland Garros', status: 'Active', org: 'FFT', expires: 'May 2026', daysLeft: 56 },
    { name: 'Australian Open', status: 'Active', org: 'Tennis Australia', expires: 'Jan 2027', daysLeft: 300 },
  ];
  const documents = [
    { name: 'Passport Copy', uploaded: '12 Jan 2026', type: 'ID' },
    { name: 'Medical Certificate', uploaded: '3 Mar 2026', type: 'Medical' },
    { name: 'Anti-Doping Registration', uploaded: '1 Jan 2026', type: 'WADA' },
    { name: 'ATP Player Agreement', uploaded: '15 Nov 2025', type: 'Contract' },
    { name: 'ITF Code of Conduct', uploaded: '1 Jan 2026', type: 'Compliance' },
  ];
  const contacts = [
    { org: 'ATP Player Services', name: 'Michael Torres', email: 'players@atptour.com', phone: '+1 561 330 5000' },
    { org: 'LTA Player Services', name: 'Rebecca Clarke', email: 'players@lta.org.uk', phone: '+44 20 8487 7000' },
    { org: 'ITF', name: 'Player Support', email: 'players@itftennis.com', phone: '+44 20 8878 6464' },
  ];
  const statusColor = (s: string) => s === 'Active' ? 'bg-green-600/20 text-green-400 border-green-600/30' : s === 'Applied' || s === 'Seasonal' ? 'bg-amber-600/20 text-amber-400 border-amber-600/30' : 'bg-red-600/20 text-red-400 border-red-600/30';
  return (
    <div>
      <SectionHeader title="Accreditations & Licences" subtitle="Tour cards, federation licences and tournament access" icon="🪪" />
      {/* Player ID Card */}
      <div className="bg-gradient-to-br from-purple-900/30 to-purple-600/10 border border-purple-600/30 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-24 bg-gray-800 rounded-lg flex items-center justify-center text-3xl">🎾</div>
          <div>
            <div className="text-xs text-purple-400 font-semibold mb-1">ATP TOUR MEMBER</div>
            <div className="text-xl font-bold text-white">Alex Rivera</div>
            <div className="text-sm text-gray-400">🇬🇧 British · Right-handed · #67</div>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span>Member ID: ATP-2018-0847</span>
              <span>ITF Reg: ITF-UK-29814</span>
              <span>Expires: Dec 2026</span>
            </div>
          </div>
        </div>
      </div>
      {/* Renewal alert */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6 bg-amber-600/10 border border-amber-600/30">
        <span className="text-amber-400 text-sm">⚠️</span>
        <span className="text-sm text-amber-300">Roland Garros accreditation expires in 56 days — renew before April deadline</span>
      </div>
      {/* Accreditations table */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-4">All Accreditations</h3>
        <div className="grid grid-cols-5 gap-2 text-xs text-center mb-2">
          <div className="text-gray-500 font-semibold text-left">Accreditation</div>
          <div className="text-gray-500 font-semibold">Organisation</div>
          <div className="text-gray-500 font-semibold">Status</div>
          <div className="text-gray-500 font-semibold">Expires</div>
          <div className="text-gray-500 font-semibold">Days Left</div>
        </div>
        {accreditations.map(a => (
          <div key={a.name} className="grid grid-cols-5 gap-2 text-sm text-center py-2.5 border-t border-gray-800 items-center">
            <div className="text-left text-gray-300 text-xs">{a.name}</div>
            <div className="text-gray-400 text-xs">{a.org}</div>
            <div><span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusColor(a.status)}`}>{a.status}</span></div>
            <div className="text-gray-400 text-xs">{a.expires}</div>
            <div className={`text-xs font-semibold ${a.daysLeft < 90 ? 'text-amber-400' : 'text-gray-400'}`}>{a.daysLeft}d</div>
          </div>
        ))}
      </div>
      {/* Documents */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-4">Documents</h3>
        {documents.map(d => (
          <div key={d.name} className="flex items-center justify-between py-2.5 border-t border-gray-800">
            <div>
              <div className="text-sm text-white">{d.name}</div>
              <div className="text-xs text-gray-500">{d.type} · Uploaded {d.uploaded}</div>
            </div>
            <button className="text-xs text-purple-400 hover:text-purple-300 font-semibold">View →</button>
          </div>
        ))}
      </div>
      {/* Federation contacts */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Federation Contacts</h3>
        {contacts.map(c => (
          <div key={c.org} className="flex items-center justify-between py-2.5 border-t border-gray-800">
            <div>
              <div className="text-sm text-white">{c.org}</div>
              <div className="text-xs text-gray-500">{c.name} · {c.email} · {c.phone}</div>
            </div>
          </div>
        ))}
      </div>
      <TennisAISection context="default" player={player} session={session} />
    </div>
  );
};

// ─── POINTS FORECASTER VIEW ──────────────────────────────────────────────────
const PointsForecasterView = ({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) => {
  const [selectedRound, setSelectedRound] = useState(1);
  const scenarios = [
    { round: 'R32', points: 10, rankingImpact: -80 },
    { round: 'R16', points: 45, rankingImpact: -45 },
    { round: 'QF', points: 180, rankingImpact: -12 },
    { round: 'SF', points: 360, rankingImpact: +8 },
    { round: 'Final', points: 600, rankingImpact: +19 },
    { round: 'Winner', points: 1000, rankingImpact: +34 },
  ];
  const defending = [
    { month: 'Apr', pts: 90, label: 'Madrid QF' },
    { month: 'May', pts: 0, label: '' },
    { month: 'Jun', pts: 45, label: "Queen's R2" },
    { month: 'Jul', pts: 180, label: 'Wimbledon R16' },
    { month: 'Aug', pts: 0, label: '' },
    { month: 'Sep', pts: 45, label: 'US Open R2' },
    { month: 'Oct', pts: 250, label: 'Tokyo F' },
    { month: 'Nov', pts: 0, label: '' },
    { month: 'Dec', pts: 0, label: '' },
    { month: 'Jan', pts: 0, label: '' },
    { month: 'Feb', pts: 90, label: 'Marseille SF' },
    { month: 'Mar', pts: 45, label: 'Indian Wells R2' },
  ];
  const s = scenarios[selectedRound];
  const projectedRank = player.ranking - s.rankingImpact;
  const racePoints = 1420;
  const raceTarget = 3000;
  return (
    <div>
      <SectionHeader title="Ranking Points Forecaster" subtitle="Madrid Open — Masters 1000 · Clay" icon="🔮" />
      {/* Current position strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Current Ranking" value={`#${player.ranking}`} sub={`${player.ranking_points} pts`} color="purple" />
        <StatCard label="Race to Turin" value="#18" sub="1,420 pts" color="teal" />
        <StatCard label="Defending (Madrid)" value="90 pts" sub="QF last year — expires Apr" color="orange" />
      </div>
      {/* Round selector */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-4">If Alex reaches…</h3>
        <div className="flex gap-2 mb-5">
          {scenarios.map((sc, i) => (
            <button key={sc.round} onClick={() => setSelectedRound(i)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${selectedRound === i ? 'bg-purple-600 text-white' : 'bg-[#07080F] border border-gray-700 text-gray-400 hover:text-white'}`}>
              {sc.round}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#07080F] border border-gray-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{s.points}</div>
            <div className="text-xs text-gray-500 mt-1">Points earned</div>
          </div>
          <div className="bg-[#07080F] border border-gray-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">#{projectedRank > 0 ? projectedRank : 1}</div>
            <div className="text-xs text-gray-500 mt-1">Projected ranking</div>
            <div className={`text-xs mt-1 font-semibold ${s.rankingImpact > 0 ? 'text-green-400' : 'text-red-400'}`}>{s.rankingImpact > 0 ? '↑' : '↓'} {Math.abs(s.rankingImpact)} places</div>
          </div>
          <div className="bg-[#07080F] border border-gray-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">90</div>
            <div className="text-xs text-gray-500 mt-1">Points expiring</div>
            <div className="text-xs text-gray-600 mt-1">Net: {s.points > 90 ? '+' : ''}{s.points - 90}</div>
          </div>
        </div>
      </div>
      {/* Points to defend calendar */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-4">Points to Defend — Next 12 Months</h3>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {defending.map(d => (
            <div key={d.month} className={`rounded-lg p-3 text-center border ${d.pts > 100 ? 'bg-red-600/10 border-red-600/30' : d.pts >= 45 ? 'bg-amber-600/10 border-amber-600/30' : 'bg-gray-800/50 border-gray-800'}`}>
              <div className="text-xs font-semibold text-gray-400">{d.month}</div>
              <div className={`text-lg font-bold ${d.pts > 100 ? 'text-red-400' : d.pts >= 45 ? 'text-amber-400' : 'text-gray-600'}`}>{d.pts}</div>
              {d.label && <div className="text-[10px] text-gray-500 mt-0.5">{d.label}</div>}
            </div>
          ))}
        </div>
      </div>
      {/* Race to Turin */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">ATP Race to Turin — Top 8 Qualification</h3>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm text-gray-400">18th</span>
          <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
            <div className="h-3 rounded-full bg-gradient-to-r from-purple-600 to-teal-500" style={{ width: `${(racePoints / raceTarget) * 100}%` }} />
          </div>
          <span className="text-sm text-gray-400">Top 8</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{racePoints.toLocaleString()} pts</span>
          <span>Need +{(raceTarget - racePoints).toLocaleString()} pts for qualification ({raceTarget.toLocaleString()} threshold)</span>
        </div>
      </div>
      <TennisAISection context="forecaster" player={player} session={session} />
    </div>
  );
};

// ─── ENTRY MANAGER VIEW ─────────────────────────────────────────────────────────
const EntryManagerView = ({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) => {
  const entries = [
    { tournament: 'Madrid Open', level: 'Masters 1000', surface: 'Clay', date: '28 Apr', deadline: 'CLOSED', signin: '26 Apr', status: 'Entered', daysLeft: 0 },
    { tournament: 'Rome Masters', level: 'Masters 1000', surface: 'Clay', date: '12 May', deadline: '14 Apr', signin: '10 May', status: 'Entered', daysLeft: 9 },
    { tournament: 'Geneva Open', level: 'ATP 250', surface: 'Clay', date: '19 May', deadline: '21 Apr', signin: '17 May', status: 'Enter now', daysLeft: 6 },
    { tournament: 'Lyon Open', level: 'ATP 250', surface: 'Clay', date: '19 May', deadline: '21 Apr', signin: '17 May', status: 'Decide', daysLeft: 6 },
    { tournament: 'Roland Garros', level: 'Grand Slam', surface: 'Clay', date: '26 May', deadline: '28 Apr', signin: '25 May', status: 'Entered', daysLeft: 23 },
    { tournament: 'Halle Open', level: 'ATP 500', surface: 'Grass', date: '16 Jun', deadline: '19 May', signin: '14 Jun', status: 'Not yet open', daysLeft: 44 },
    { tournament: 'Wimbledon', level: 'Grand Slam', surface: 'Grass', date: '30 Jun', deadline: '3 Jun', signin: '27 Jun', status: 'Not yet open', daysLeft: 59 },
    { tournament: 'Bastad', level: 'ATP 250', surface: 'Clay', date: '14 Jul', deadline: '16 Jun', signin: '12 Jul', status: 'Not yet open', daysLeft: 72 },
  ];
  const statusColor = (s: string) => s === 'Entered' ? 'bg-green-600/20 text-green-400 border-green-600/30' : s === 'Enter now' ? 'bg-red-600/20 text-red-400 border-red-600/30' : s === 'Decide' ? 'bg-amber-600/20 text-amber-400 border-amber-600/30' : 'bg-gray-700/30 text-gray-500 border-gray-700';
  const withdrawals = [
    { tournament: 'Rome Masters', deadline: '9 May', note: '1 day before sign-in. Late withdrawal fine: $1,500' },
    { tournament: 'Geneva Open', deadline: '16 Apr', note: 'No fine if withdrawn before deadline' },
  ];
  return (
    <div>
      <SectionHeader title="Tournament Entry Manager" subtitle="Manage entries, deadlines and withdrawals" icon="📋" />
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6 bg-red-600/10 border border-red-600/30">
        <span className="text-red-400 text-sm">⚠️</span>
        <span className="text-sm text-red-300">3 entry deadlines in the next 14 days</span>
      </div>
      {/* Entry table */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5 mb-6 overflow-x-auto">
        <h3 className="text-sm font-bold text-white mb-4">Upcoming Entry Deadlines</h3>
        <div className="grid grid-cols-7 gap-2 text-xs text-center mb-2 min-w-[700px]">
          <div className="text-gray-500 font-semibold text-left">Tournament</div>
          <div className="text-gray-500 font-semibold">Level</div>
          <div className="text-gray-500 font-semibold">Surface</div>
          <div className="text-gray-500 font-semibold">Date</div>
          <div className="text-gray-500 font-semibold">Entry Deadline</div>
          <div className="text-gray-500 font-semibold">Sign-in</div>
          <div className="text-gray-500 font-semibold">Status</div>
        </div>
        {entries.map(e => (
          <div key={e.tournament} className="grid grid-cols-7 gap-2 text-sm text-center py-2.5 border-t border-gray-800 items-center min-w-[700px]">
            <div className="text-left text-white text-xs font-semibold">{e.tournament}</div>
            <div><CategoryBadge category={e.level} /></div>
            <div><SurfaceBadge surface={e.surface} /></div>
            <div className="text-gray-400 text-xs">{e.date}</div>
            <div className="text-xs">
              <span className={e.daysLeft > 0 && e.daysLeft <= 7 ? 'text-red-400 font-semibold' : 'text-gray-400'}>{e.deadline}</span>
              {e.daysLeft > 0 && e.daysLeft <= 7 && <span className="text-red-400 text-[10px] ml-1">← {e.daysLeft}d</span>}
            </div>
            <div className="text-gray-400 text-xs">{e.signin}</div>
            <div><span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusColor(e.status)}`}>{e.status}</span></div>
          </div>
        ))}
      </div>
      {/* Withdrawal tracker */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-4">Withdrawal Windows</h3>
        {withdrawals.map(w => (
          <div key={w.tournament} className="flex items-center justify-between py-3 border-t border-gray-800">
            <div>
              <div className="text-sm text-white font-semibold">{w.tournament}</div>
              <div className="text-xs text-gray-500">Withdrawal deadline: {w.deadline}</div>
            </div>
            <div className="text-xs text-gray-400 max-w-xs text-right">{w.note}</div>
          </div>
        ))}
      </div>
      {/* Season summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Entered" value="18" sub="tournaments" color="purple" />
        <StatCard label="Completed" value="7" sub="this season" color="green" />
        <StatCard label="Upcoming" value="11" sub="remaining" color="blue" />
        <StatCard label="Wildcards" value="1" sub="used" color="orange" />
        <StatCard label="Protected Ranking" value="0" sub="entries used" color="teal" />
      </div>
      <TennisAISection context="entries" player={player} session={session} />
    </div>
  );
};

// ─── MATCH REPORTS VIEW ──────────────────────────────────────────────────────
const MatchReportsView = ({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) => {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<Record<string, string>>({});
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const matches = [
    { id: 'm1', opponent: 'C. Valdez', oppRank: 3, tournament: 'Madrid Open', round: 'QF', score: '4-6 6-3 7-6(5)', surface: 'Clay', result: 'W', date: '14 Apr' },
    { id: 'm2', opponent: 'T. Paul', oppRank: 32, tournament: 'Madrid Open', round: 'R16', score: '6-4 6-2', surface: 'Clay', result: 'W', date: '11 Apr' },
    { id: 'm3', opponent: 'F. Caballero', oppRank: 29, tournament: 'Madrid Open', round: 'R32', score: '7-5 6-4', surface: 'Clay', result: 'W', date: '9 Apr' },
    { id: 'm4', opponent: 'L. Brenner', oppRank: 1, tournament: 'Monte Carlo Masters', round: 'SF', score: '3-6 4-6', surface: 'Clay', result: 'L', date: '5 Apr' },
    { id: 'm5', opponent: 'B. Sutton', oppRank: 14, tournament: 'Monte Carlo QF', round: 'QF', score: '6-3 7-5', surface: 'Clay', result: 'W', date: '3 Apr' },
    { id: 'm6', opponent: 'C. Hadley', oppRank: 45, tournament: 'Barcelona Open', round: 'R32', score: '6-7(4) 4-6', surface: 'Clay', result: 'L', date: '22 Mar' },
  ];

  async function generateReport(m: typeof matches[0]) {
    setGeneratingReport(m.id);
    const won = m.result === 'W';
    try {
      const res = await fetch('/api/ai/football-search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'player', query: `You are a professional tennis analyst writing a concise post-match report. Write in a professional coach/analyst voice. Be specific and tactical.\n\nWrite a post-match analysis report for Alex Rivera (ATP #67) who ${won ? 'won' : 'lost'} against ${m.opponent} (#${m.oppRank}) at ${m.tournament} ${m.round}, score ${m.score} on ${m.surface}. Cover a brief match summary, three key tactical moments, what worked well, areas to improve, and a one-sentence look ahead. Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.` }),
      });
      const data = await res.json();
      const text = typeof data.result === 'string' ? data.result : data.result?.summary || 'Report generated.';
      setReportContent(prev => ({ ...prev, [m.id]: text }));
      setActiveReport(m.id);
    } catch {
      const fallback = won
        ? `Match Summary: Alex Rivera secured a ${m.score} victory over ${m.opponent} at the ${m.tournament} ${m.round}. A composed performance on clay showed growing confidence at the highest level.\n\nKey Tactical Moments:\n• Break of serve in the opening game of the deciding set shifted momentum decisively\n• Successfully targeted the opponent's backhand wing, forcing 14 unforced errors\n• Clutch serving at 5-4 in the third set — 3 aces in the final game\n\nWhat Worked Well:\n• First serve percentage above 68% throughout — consistent weapon\n• Net approaches converted at 75% — aggressive play rewarded\n\nAreas to Improve:\n• Second serve return needs work — won only 38% of return points on second serve\n• Court positioning on clay could be deeper to give more time on the baseline\n\nLooking ahead: Confidence is building — carry this form into the next round.`
        : `Match Summary: Alex Rivera fell ${m.score} to ${m.opponent} at the ${m.tournament} ${m.round}. Despite moments of quality, the opponent's consistency proved decisive.\n\nKey Tactical Moments:\n• Lost serve at 4-4 in the first set after a long rally — critical moment\n• Failed to convert 3 break point opportunities in the second set\n• Opponent's forehand down the line was a constant threat\n\nWhat Worked Well:\n• Serve held firm through the middle sets — 5 aces total\n• Backhand cross-court rally length improved from previous matches\n\nAreas to Improve:\n• Break point conversion at 0/3 is a pattern — needs mental work\n• Fitness in the third set — movement slowed visibly\n\nLooking ahead: Key learnings to apply in practice this week.`;
      setReportContent(prev => ({ ...prev, [m.id]: fallback }));
      setActiveReport(m.id);
    }
    setGeneratingReport(null);
  }

  return (
    <div>
      <SectionHeader title="Match Reports & AI Summaries" subtitle="Recent match log with AI-generated analysis" icon="📄" />
      <div className="space-y-3">
        {matches.map(m => (
          <div key={m.id}>
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${m.result === 'W' ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-red-600/20 text-red-400 border border-red-600/30'}`}>{m.result}</span>
                  <span className="text-sm font-semibold text-white">vs. {m.opponent}</span>
                  <span className="text-xs text-gray-500">#{m.oppRank}</span>
                </div>
                <span className="text-xs text-gray-500">{m.date}</span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-bold text-white">{m.score}</span>
                <SurfaceBadge surface={m.surface} />
                <span className="text-xs text-gray-500">{m.tournament} · {m.round}</span>
              </div>
              <div className="flex items-center gap-2">
                {reportContent[m.id] ? (
                  <button onClick={() => setActiveReport(activeReport === m.id ? null : m.id)} className="text-xs text-purple-400 hover:text-purple-300 font-semibold">{activeReport === m.id ? 'Hide report ↑' : 'View report ↓'}</button>
                ) : (
                  <button onClick={() => generateReport(m)} disabled={!!generatingReport} className="text-xs text-purple-400 hover:text-purple-300 font-semibold disabled:opacity-50">
                    {generatingReport === m.id ? 'Generating...' : '✨ Generate AI summary'}
                  </button>
                )}
              </div>
            </div>
            {generatingReport === m.id && (
              <div className="bg-[#0d0f1a] border border-purple-600/30 rounded-xl p-4 mt-1" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
                <p className="text-sm text-purple-300">Generating match analysis...</p>
              </div>
            )}
            {activeReport === m.id && reportContent[m.id] && (
              <div className="bg-[#0d0f1a] border border-purple-600/20 rounded-xl p-5 mt-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">AI Match Analysis</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-600/30">Generated by Claude</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigator.clipboard.writeText(reportContent[m.id])} className="text-xs text-gray-400 hover:text-white">Copy report</button>
                    <button onClick={() => {}} className="text-xs text-teal-400 hover:text-teal-300">Share with team</button>
                  </div>
                </div>
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{reportContent[m.id]}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <TennisAISection context="matchreports" player={player} session={session} />
    </div>
  );
};

// ─── DATA HUB VIEW ──────────────────────────────────────────────────────────────
const DataHubView = ({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) => {
  const hasApiKey = !!TENNIS_API_KEY;
  const [toastMsg, setToastMsg] = useState('');
  const sources = [
    { name: 'ATP Tennis IQ', status: 'External — visit to access', statusColor: 'bg-blue-600/20 text-blue-400 border-blue-600/30', desc: 'Official ATP analytics. Shot quality, live in-match data, wearables. Free for ATP members.', features: ['Shot Quality AI', 'In Attack score', 'Live coaching data', 'Wearables sync'], badge: 'Free for ATP members', badgeColor: 'bg-green-600/20 text-green-400', button: 'Open ATP Tennis IQ →', url: 'https://www.atptour.com', connected: true },
    { name: 'TennisRatio', status: 'Connected — public data', statusColor: 'bg-green-600/20 text-green-400 border-green-600/30', desc: 'Public analytics dashboard. H2H records, surface splits, pressure point data for all ATP/WTA players.', features: ['H2H heatmaps', 'Surface win%', 'Pressure stats', 'Dominance ratios'], badge: 'Free', badgeColor: 'bg-green-600/20 text-green-400', button: 'Browse TennisRatio →', url: 'https://tennisratio.com', connected: true },
    { name: 'Tennis ComStat', status: 'Not connected', statusColor: 'bg-gray-700/30 text-gray-500 border-gray-700', desc: 'Professional video + stats analysis. Upload match footage and receive shot maps, serve heatmaps, and rally analysis within 24 hours.', features: ['Video-synced stats', 'Shot maps', 'Serve/return heatmaps', 'Opponent patterns'], badge: 'Per-match pricing', badgeColor: 'bg-amber-600/20 text-amber-400', button: 'Connect ComStat ↗', url: '', connected: false },
    { name: 'API-Tennis', status: hasApiKey ? 'Connected — live data active' : 'Not connected', statusColor: hasApiKey ? 'bg-green-600/20 text-green-400 border-green-600/30' : 'bg-gray-700/30 text-gray-500 border-gray-700', desc: 'Real-time ATP/WTA fixtures, live scores, rankings, H2H records, and odds.', features: ['Live scores', 'Fixtures', 'H2H', 'Rankings', 'Odds'], badge: 'From $40/mo', badgeColor: 'bg-purple-600/20 text-purple-400', button: hasApiKey ? 'Live data active' : 'Add API key in .env.local', url: '', connected: hasApiKey },
  ];
  const dataSources = [
    { section: 'Live Scores', source: 'API-Tennis (live)' },
    { section: 'Rankings & Race', source: 'API-Tennis + hardcoded' },
    { section: 'Surface Analysis', source: 'API-Tennis + Lumio' },
    { section: 'H2H / Opponent Scout', source: 'API-Tennis' },
    { section: 'Shot Heatmaps', source: 'Lumio analytics engine' },
    { section: 'Performance Rating', source: 'Lumio analytics engine' },
    { section: 'Video Library', source: 'SwingVision + manual upload' },
    { section: 'Match Reports', source: 'Claude AI (Anthropic)' },
  ];
  return (
    <div>
      <SectionHeader title="Data & Analytics Hub" subtitle="Your connected analytics ecosystem — Lumio pulls from these sources to power your portal." icon="🔌" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {sources.map(s => (
          <div key={s.name} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">{s.name}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded border ${s.statusColor}`}>{s.status}</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-3">{s.desc}</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {s.features.map(f => (
                <span key={f} className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400">{f}</span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] px-2 py-0.5 rounded ${s.badgeColor}`}>{s.badge}</span>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:text-purple-300 font-semibold">{s.button}</a>
              ) : s.connected ? (
                <span className="text-xs text-green-400 font-semibold">{s.button}</span>
              ) : (
                <button onClick={() => { setToastMsg('Request sent — they\'ll email you within 24h'); setTimeout(() => setToastMsg(''), 3000) }} className="text-xs text-purple-400 hover:text-purple-300 font-semibold">{s.button}</button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Data Sources Powering Your Portal</h3>
        <div className="space-y-2">
          {dataSources.map(d => (
            <div key={d.section} className="flex items-center justify-between py-2 border-t border-gray-800">
              <span className="text-sm text-gray-300">{d.section}</span>
              <span className="text-xs text-gray-500">{d.source}</span>
            </div>
          ))}
        </div>
      </div>
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#1A1D27', border: '1px solid #374151', color: '#F9FAFB' }}>
          {toastMsg}
        </div>
      )}
      <TennisAISection context="default" player={player} session={session} />
    </div>
  );
};

// ─── GPS & COURT HEATMAP VIEW ─────────────────────────────────────────────────
function GPSCourtView({ player, session: demoSession }: { player: TennisPlayer; session: SportsDemoSession }) {
  const [selectedDay, setSelectedDay] = useState(GPS_SESSIONS_TENNIS.length - 1);
  const gpsSession = GPS_SESSIONS_TENNIS[selectedDay];
  const latestACWR = GPS_SESSIONS_TENNIS[GPS_SESSIONS_TENNIS.length - 1].acwr;
  const acwrStatus = latestACWR > 1.3 ? { label: 'High Risk', color: 'text-red-400', bg: 'bg-red-600/20' }
    : latestACWR > 1.15 ? { label: 'Monitor', color: 'text-yellow-400', bg: 'bg-yellow-600/20' }
    : { label: 'Safe Zone', color: 'text-green-400', bg: 'bg-green-600/20' };
  const totalDist = GPS_SESSIONS_TENNIS.reduce((a,s)=>a+s.distance,0);
  const matchSessions = GPS_SESSIONS_TENNIS.filter(s=>s.type==='Match').length;
  const peakLoad = Math.max(...GPS_SESSIONS_TENNIS.map(s=>s.load));

  return (
    <div className="space-y-6">

      <SectionHeader icon="📡" title="GPS & Court Heatmap" subtitle={`Monte-Carlo 2026 · Lumio GPS Vest · Clay Court Tracking · ${GPS_SESSIONS_TENNIS.length} sessions logged`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Distance" value={`${totalDist.toFixed(1)}km`} sub="This tournament" color="teal" />
        <StatCard label="ACWR Today" value={latestACWR.toFixed(2)} sub={acwrStatus.label} color={latestACWR > 1.15 ? 'yellow' : 'green'} />
        <StatCard label="Match Sessions" value={matchSessions} sub="With court tracking" color="purple" />
        <StatCard label="Peak Load" value={peakLoad} sub="Session AU" color="orange" />
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-white">ACWR — Acute:Chronic Workload Ratio</div>
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${acwrStatus.bg} ${acwrStatus.color}`}>{acwrStatus.label} · {latestACWR.toFixed(2)}</span>
        </div>
        <div className="relative h-36">
          <svg viewBox="0 0 600 130" className="w-full h-full" preserveAspectRatio="none">
            <rect x="0" y="22" width="600" height="65" fill="rgba(139,92,246,0.05)"/>
            <line x1="0" y1="22" x2="600" y2="22" stroke="#22C55E" strokeWidth="1" strokeDasharray="4,4" opacity="0.5"/>
            <line x1="0" y1="87" x2="600" y2="87" stroke="#EF4444" strokeWidth="1" strokeDasharray="4,4" opacity="0.5"/>
            <text x="4" y="19" fill="#22C55E" fontSize="8" opacity="0.7">0.8</text>
            <text x="4" y="84" fill="#EF4444" fontSize="8" opacity="0.7">1.3</text>
            <polyline fill="none" stroke="#8B5CF6" strokeWidth="2"
              points={GPS_SESSIONS_TENNIS.map((d,i)=>{
                const x=(i/(GPS_SESSIONS_TENNIS.length-1))*585+5;
                const y=130-((d.acwr-0.6)/1.0)*120;
                return `${x},${y}`;
              }).join(' ')}/>
            {GPS_SESSIONS_TENNIS.map((d,i)=>{
              const x=(i/(GPS_SESSIONS_TENNIS.length-1))*585+5;
              const y=130-((d.acwr-0.6)/1.0)*120;
              return <circle key={i} cx={x} cy={y} r="3.5" fill={d.acwr>1.3?'#EF4444':'#8B5CF6'} onClick={()=>setSelectedDay(i)} style={{cursor:'pointer'}}/>;
            })}
            {GPS_SESSIONS_TENNIS.map((d,i)=>{
              const x=(i/(GPS_SESSIONS_TENNIS.length-1))*585+5;
              return <text key={i} x={x} y="128" textAnchor="middle" fill="#4B5563" fontSize="7">D{d.day}</text>;
            })}
          </svg>
        </div>
        <div className="flex gap-4 text-xs mt-1">
          <span className="text-green-400">── Safe zone (0.8–1.3)</span>
          <span className="text-purple-400">── Your ACWR</span>
          <span className="text-yellow-400">Sarah Okafor alert threshold: 1.15</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-4">Session Selector</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {GPS_SESSIONS_TENNIS.map((s,i)=>(
              <button key={i} onClick={()=>setSelectedDay(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedDay===i?'bg-purple-600/20 border-purple-600/30 text-purple-300':'border-gray-700 text-gray-400 hover:text-gray-200'}`}>
                D{s.day} · {s.type}
              </button>
            ))}
          </div>
          <div className="space-y-2 text-xs border-t border-gray-800 pt-4">
            {([['Type',gpsSession.type],['Surface',gpsSession.surface],['Duration',gpsSession.duration>0?`${gpsSession.duration} min`:'Rest day'],['Distance',gpsSession.distance>0?`${gpsSession.distance} km`:'—'],['Load',gpsSession.load>0?`${gpsSession.load} AU`:'—'],['ACWR',gpsSession.acwr.toFixed(2)]] as [string,string][]).map(([l,v])=>(
              <div key={l} className="flex justify-between">
                <span className="text-gray-500">{l}</span>
                <span className="text-white">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-white">Court Heatmap — {gpsSession.date}</div>
            {gpsSession.court.length === 0 && <span className="text-xs text-gray-500 italic">No court data</span>}
          </div>
          <div className="flex justify-center">
            <TennisCourtHeatmap session={gpsSession} size={220} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <div className="text-center text-purple-400">Baseline heavy</div>
            <div className="text-center text-yellow-400">Mid-court</div>
            <div className="text-center text-green-400">Net approach</div>
          </div>
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Daily Load — Tournament Week</div>
        <div className="flex items-end gap-2 h-24">
          {GPS_SESSIONS_TENNIS.map((s,i)=>{
            const maxLoad=Math.max(...GPS_SESSIONS_TENNIS.map(x=>x.load),1);
            const h=s.load>0?Math.max(8,(s.load/maxLoad)*100):4;
            const col=s.load>450?'#EF4444':s.load>350?'#F97316':s.load>0?'#8B5CF6':'#374151';
            return(
              <div key={i} className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={()=>setSelectedDay(i)}>
                {s.load>0&&<div className="text-[9px] text-gray-500">{s.load}</div>}
                <div className="w-full rounded-t transition-all" style={{height:`${h}%`,background:col,opacity:selectedDay===i?1:0.65}}/>
                <div className="text-[9px] text-gray-600">{s.type[0]}{s.day}</div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 text-xs mt-3">
          <span className="text-purple-400">■ Practice</span>
          <span className="text-orange-400">■ Match</span>
          <span className="text-red-400">■ High load</span>
        </div>
      </div>
      {/* Lumio GPS Tracker Dashboard */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2">
            <span>🛰️</span>
            <span className="text-sm font-semibold text-white">Lumio GPS — {gpsSession.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400">Connected</span>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-0 border-b border-gray-800">
          {[
            { label:'Court Coverage', value:'4.2 km', color:'#0ea5e9' },
            { label:'Sprint Distance', value:'1.8 km', color:'#8B5CF6' },
            { label:'Top Speed', value:'28.4 km/h', color:'#F59E0B' },
            { label:'Load Score', value:'74 / 100', color: 74 > 80 ? '#EF4444' : 74 > 60 ? '#F59E0B' : '#22C55E' },
            { label:'Recovery Index', value:'Good', color:'#22C55E' },
          ].map((s, i) => (
            <div key={i} className="px-4 py-3 text-center" style={{ borderRight: i < 4 ? '1px solid #1F2937' : 'none' }}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px]" style={{ color: '#6B7280' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div className="p-5">
          <div className="text-xs font-semibold text-white mb-3">Session Timeline</div>
          <div className="grid grid-cols-3 gap-4">
            {[{ set:'Set 1', km:'2.1km', load:38 },{ set:'Set 2', km:'1.4km', load:26 },{ set:'Set 3', km:'0.7km', load:10 }].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-xs font-bold text-white mb-1">{s.set}</div>
                <div className="mx-auto rounded bg-cyan-500/30 mb-1" style={{ height: `${Math.max(16, (s.load / 40) * 48)}px`, width: '100%', background: `linear-gradient(to top, rgba(6,182,212,0.6), rgba(6,182,212,0.2))` }} />
                <div className="text-xs text-cyan-400 font-bold">{s.km}</div>
                <div className="text-[10px] text-gray-500">Load: {s.load}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 py-3 space-y-2" style={{ borderTop: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2"><span>🛰️</span><span className="text-white">Lumio GPS Tracker</span></div>
            <div className="flex items-center gap-3"><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-green-400">Connected</span></span><span className="text-gray-500">Battery: 87%</span><span className="text-gray-500">Sync: 2 min ago</span></div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2"><span>🎾</span><span className="text-white">SwingVision</span></div>
            <div className="flex items-center gap-3"><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-green-400">Connected</span></span><span className="text-gray-500">127 shots logged</span></div>
          </div>
        </div>
      </div>

      <TennisAISection context="default" player={player} session={demoSession} />
    </div>
  );
}

// ─── PRIZE FORECASTER VIEW ────────────────────────────────────────────────────
function PrizeForecasterView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const prizeTables: Record<string, Record<string, number>> = {
    'Grand Slam': { 'Winner': 3000000, 'Final': 1700000, 'Semifinal': 900000, 'Quarterfinal': 560000, 'Round of 16': 218000, 'Round of 32': 118000, 'First Round': 60000 },
    'Masters 1000': { 'Winner': 1000000, 'Final': 550000, 'Semifinal': 280000, 'Quarterfinal': 148000, 'Round of 16': 72000, 'Round of 32': 36000, 'First Round': 15000 },
    'ATP 500': { 'Winner': 500000, 'Final': 250000, 'Semifinal': 120000, 'Quarterfinal': 58000, 'Round of 16': 28000, 'First Round': 8000 },
    'ATP 250': { 'Winner': 250000, 'Final': 120000, 'Semifinal': 58000, 'Quarterfinal': 28000, 'Round of 32': 12000, 'First Round': 4000 },
  };
  const [scenarios, setScenarios] = useState([
    { event: 'Rome Masters 1000', category: 'Masters 1000', surface: 'Clay', result: 'Quarterfinal', prize: 148000 },
    { event: 'Roland-Garros', category: 'Grand Slam', surface: 'Clay', result: 'Round of 16', prize: 218000 },
    { event: 'Halle ATP 500', category: 'ATP 500', surface: 'Grass', result: 'Final', prize: 175000 },
    { event: "Queen's ATP 500", category: 'ATP 500', surface: 'Grass', result: 'Semifinal', prize: 95000 },
    { event: 'Wimbledon', category: 'Grand Slam', surface: 'Grass', result: 'Quarterfinal', prize: 560000 },
    { event: 'US Open', category: 'Grand Slam', surface: 'Hard', result: 'Round of 32', prize: 98000 },
  ]);

  const seasonPrize = 487000;
  const projectedTotal = seasonPrize + scenarios.reduce((a,s)=>a+s.prize,0);
  const agentFee = projectedTotal * 0.1;
  const netEstimate = projectedTotal - agentFee;
  const results = ['Winner','Final','Semifinal','Quarterfinal','Round of 16','Round of 32','First Round'];

  return (
    <div className="space-y-6">

      <SectionHeader icon="💵" title="Prize Money Forecaster" subtitle="Model year-end earnings across 5 scenarios simultaneously — adjust results to project prize money" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="YTD Prize Money" value="£487k" sub="Confirmed earnings" color="green" />
        <StatCard label="Projected Remaining" value={`£${Math.round(scenarios.reduce((a,s)=>a+s.prize,0)/1000)}k`} sub="Based on scenarios" color="teal" />
        <StatCard label="Projected Season Total" value={`£${Math.round(projectedTotal/1000)}k`} sub="inc. YTD" color="purple" />
        <StatCard label="Net (after agent)" value={`£${Math.round(netEstimate/1000)}k`} sub="Agent 10% deducted" color="yellow" />
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Scenario Builder — Adjust Results</div>
        <div className="space-y-2">
          {scenarios.map((s,i)=>(
            <div key={i} className="flex items-center gap-3 p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="flex-1">
                <div className="text-xs font-medium text-white">{s.event}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-500">{s.category}</span>
                  <SurfaceBadge surface={s.surface}/>
                </div>
              </div>
              <select
                value={s.result}
                onChange={e=>{
                  const newPrize = (prizeTables[s.category]||{})[e.target.value] || 0;
                  setScenarios(prev=>prev.map((x,j)=>j===i?{...x,result:e.target.value,prize:newPrize}:x));
                }}
                className="bg-[#0d0f1a] border border-gray-700 rounded px-2 py-1.5 text-xs text-white"
              >
                {results.map(r=><option key={r}>{r}</option>)}
              </select>
              <div className="text-sm font-bold text-green-400 w-24 text-right">
                £{s.prize.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Year-End Projection Breakdown</div>
        <div className="space-y-2">
          {[
            { label: 'YTD Prize (confirmed)', value: seasonPrize, color: 'text-gray-300', bold: false },
            { label: 'Projected remaining (scenario)', value: scenarios.reduce((a,s)=>a+s.prize,0), color: 'text-teal-400', bold: false },
            { label: 'Gross Season Total', value: projectedTotal, color: 'text-white', bold: true },
            { label: 'Agent commission (10%)', value: -agentFee, color: 'text-red-400', bold: false },
            { label: 'Net Year-End Earnings', value: netEstimate, color: 'text-green-400', bold: true },
          ].map(row=>(
            <div key={row.label} className={`flex justify-between py-2 ${row.bold?'border-t border-gray-700 pt-3 mt-1':''}`}>
              <span className="text-xs text-gray-400">{row.label}</span>
              <span className={`text-sm ${row.bold?'font-bold':'font-medium'} ${row.color}`}>
                {row.value < 0 ? '-' : ''}£{Math.abs(row.value).toLocaleString('en-GB',{maximumFractionDigits:0})}
              </span>
            </div>
          ))}
        </div>
      </div>
      <TennisAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
// ─── TENNIS ROLES ─────────────────────────────────────────────────────────────
const TENNIS_ROLES = [
  { id: 'player',  label: 'Player',            icon: '🎾', description: 'Full access — your complete tennis OS' },
  { id: 'agent',   label: 'Agent / Manager',   icon: '💼', description: 'Commercial, schedule and financial view' },
  { id: 'coach',   label: 'Coach',             icon: '📋', description: 'Performance, tactics and training view' },
  { id: 'physio',  label: 'Physio',            icon: '⚕️', description: 'Medical, GPS load and recovery view' },
  { id: 'sponsor', label: 'Sponsor / Partner', icon: '🤝', description: 'Brand presence, obligations and ROI view' },
]

// ─── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────
export default function TennisTourPage() {
  return (
    <SportsDemoGate
      sport="tennis"
      defaultClubName="Lumio Tennis Club"
      accentColor="#0ea5e9"
      accentColorLight="#38bdf8"
      sportEmoji="🎾"
      sportLabel="Lumio Tennis"
      roles={TENNIS_ROLES}
    >
      {(session) => <TennisPortalInner session={session} />}
    </SportsDemoGate>
  )
}

// ─── GPS & VIDEO VIEW ────────────────────────────────────────────────────────
function GPSVideoView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const [gpsAiBrief, setGpsAiBrief] = useState<string | null>(null)
  const [gpsAiLoading, setGpsAiLoading] = useState(false)
  const gpsGenerated = useRef(false)

  useEffect(() => {
    if (gpsGenerated.current) return
    gpsGenerated.current = true
    setGpsAiLoading(true)
    fetch('/api/ai/tennis', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, messages: [{ role: 'user',
        content: `You are an elite ATP tennis coaching analyst. Session data: GPS: Court coverage 4.2km, sprint distance 1.8km, top speed 28.4km/h, load score 74/100, recovery index Good, heaviest movement baseline deuce side. SwingVision: 68% first serve in, 14 winners, 8 unforced errors, avg rally 4.2 shots, net points won 71%. Generate a post-session coaching brief in a professional ATP coaching tone. Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.`
      }] })
    }).then(r => r.json()).then(d => setGpsAiBrief(cleanResponse(d.content?.[0]?.text || 'Unable to generate brief.'))).catch(() => setGpsAiBrief('Unable to generate brief.')).finally(() => setGpsAiLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><span className="text-lg">🛰️</span><span className="text-sm font-semibold text-white">Lumio GPS Tracker</span><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} /><span className="text-xs" style={{ color: '#22C55E' }}>Connected</span><span className="text-xs" style={{ color: '#6B7280' }}>Battery: 87%</span><span className="text-xs" style={{ color: '#6B7280' }}>Last sync: 2 mins ago</span><button className="ml-auto text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>Settings</button></div>
        <div className="flex-1 flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><span className="text-lg">🎾</span><span className="text-sm font-semibold text-white">SwingVision</span><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} /><span className="text-xs" style={{ color: '#22C55E' }}>Connected</span><span className="text-xs" style={{ color: '#6B7280' }}>Session: 127 shots logged</span><button className="ml-auto text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>View Clips</button></div>
      </div>
      <div className="grid grid-cols-5 gap-3">{[{ label:'Court Coverage', value:'4.2 km', color:'#06b6d4' },{ label:'Sprint Distance', value:'1.8 km', color:'#06b6d4' },{ label:'Top Speed', value:'28.4 km/h', color:'#06b6d4' },{ label:'Load Score', value:'74 / 100', color:'#F59E0B' },{ label:'Recovery Index', value:'Good', color:'#22C55E' }].map(s => (<div key={s.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div><div className="text-xs mt-1" style={{ color: '#6B7280' }}>{s.label}</div></div>))}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="text-sm font-bold text-white mb-3">Court Movement Heatmap</div>
          <svg viewBox="0 0 300 540" className="w-full max-w-[280px] mx-auto" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}><rect x="0" y="0" width="300" height="540" rx="4" fill="#1a6b3c" /><line x1="10" y1="10" x2="10" y2="530" stroke="white" strokeWidth="1.5" /><line x1="290" y1="10" x2="290" y2="530" stroke="white" strokeWidth="1.5" /><line x1="40" y1="10" x2="40" y2="530" stroke="white" strokeWidth="1" /><line x1="260" y1="10" x2="260" y2="530" stroke="white" strokeWidth="1" /><line x1="10" y1="10" x2="290" y2="10" stroke="white" strokeWidth="2" /><line x1="10" y1="530" x2="290" y2="530" stroke="white" strokeWidth="2" /><line x1="0" y1="270" x2="300" y2="270" stroke="white" strokeWidth="3" /><line x1="40" y1="140" x2="260" y2="140" stroke="white" strokeWidth="1" /><line x1="40" y1="400" x2="260" y2="400" stroke="white" strokeWidth="1" /><line x1="150" y1="140" x2="150" y2="270" stroke="white" strokeWidth="1" /><line x1="150" y1="270" x2="150" y2="400" stroke="white" strokeWidth="1" /><line x1="150" y1="10" x2="150" y2="20" stroke="white" strokeWidth="1" /><line x1="150" y1="520" x2="150" y2="530" stroke="white" strokeWidth="1" /><ellipse cx="150" cy="500" rx="60" ry="25" fill="#ef4444" opacity="0.5" /><ellipse cx="80" cy="490" rx="40" ry="20" fill="#ef4444" opacity="0.4" /><ellipse cx="220" cy="480" rx="35" ry="18" fill="#f59e0b" opacity="0.35" /><ellipse cx="150" cy="450" rx="45" ry="22" fill="#f59e0b" opacity="0.3" /><ellipse cx="100" cy="300" rx="30" ry="20" fill="#3b82f6" opacity="0.2" /><ellipse cx="200" cy="310" rx="25" ry="18" fill="#3b82f6" opacity="0.15" /></svg>
          <div className="flex items-center justify-center gap-2 mt-3"><span className="text-[10px]" style={{ color: '#3b82f6' }}>Low</span><div className="w-24 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg, #3b82f6, #f59e0b, #ef4444)' }} /><span className="text-[10px]" style={{ color: '#ef4444' }}>High</span></div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><div className="text-sm font-bold text-white mb-3">Distance by Set</div><div className="flex items-end gap-4 h-24">{[{ set:'Set 1', km:2.1, load:38 },{ set:'Set 2', km:1.4, load:26 },{ set:'Set 3', km:0.7, load:10 }].map(s => (<div key={s.set} className="flex-1 flex flex-col items-center gap-1"><div className="text-xs font-bold" style={{ color: '#06b6d4' }}>{s.km}km</div><div className="w-full rounded-t" style={{ height: `${(s.km/2.1)*100}%`, backgroundColor: '#06b6d4', minHeight: 8 }} /><div className="text-[10px]" style={{ color: '#6B7280' }}>{s.set}</div><div className="text-[10px]" style={{ color: '#4B5563' }}>Load: {s.load}</div></div>))}</div></div>
          <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><div className="text-sm font-bold text-white mb-3">Speed Zones</div><div className="space-y-2">{[{ zone:'Walking', pct:45 },{ zone:'Jogging', pct:28 },{ zone:'Running', pct:19 },{ zone:'Sprinting', pct:8 }].map(z => (<div key={z.zone} className="flex items-center gap-3"><span className="text-xs w-16" style={{ color: '#9CA3AF' }}>{z.zone}</span><div className="flex-1 bg-gray-800 rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${z.pct}%`, backgroundColor: '#06b6d4' }} /></div><span className="text-xs w-8 text-right font-bold" style={{ color: '#06b6d4' }}>{z.pct}%</span></div>))}</div></div>
          <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><div className="flex items-center justify-between"><span className="text-xs" style={{ color: '#9CA3AF' }}>Avg recovery between points</span><span className="text-sm font-bold" style={{ color: '#06b6d4' }}>18.3 sec</span></div><div className="text-[10px] mt-1" style={{ color: '#22C55E' }}>Optimal zone (target: 15-25 sec)</div></div>
        </div>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><div className="text-sm font-bold text-white">SwingVision — Shot Analysis</div></div><div className="p-5"><div className="grid grid-cols-5 gap-3 mb-5">{[{ l:'1st Serve %', v:'68%' },{ l:'Winners', v:'14' },{ l:'Unforced Errors', v:'8' },{ l:'Avg Rally', v:'4.2' },{ l:'Net Pts Won', v:'71%' }].map(s => (<div key={s.l} className="text-center p-2 rounded-lg" style={{ backgroundColor: '#0a0c14' }}><div className="text-base font-black" style={{ color: '#06b6d4' }}>{s.v}</div><div className="text-[10px]" style={{ color: '#6B7280' }}>{s.l}</div></div>))}</div><div className="text-xs font-bold text-white mb-2">Shot Type Breakdown</div><div className="space-y-1.5">{[{ type:'Forehand Winner', count:6, color:'#22C55E' },{ type:'Backhand Winner', count:4, color:'#22C55E' },{ type:'Serve Winner', count:4, color:'#22C55E' },{ type:'Volley Winner', count:2, color:'#22C55E' },{ type:'Forehand Error', count:5, color:'#EF4444' },{ type:'Backhand Error', count:3, color:'#EF4444' }].map(s => (<div key={s.type} className="flex items-center gap-3"><span className="text-xs w-28" style={{ color: '#9CA3AF' }}>{s.type}</span><div className="flex-1 bg-gray-800 rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${(s.count/6)*100}%`, backgroundColor: s.color }} /></div><span className="text-xs w-6 text-right font-bold" style={{ color: s.color }}>{s.count}</span></div>))}</div></div></div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', borderLeft: '4px solid #06b6d4', border: '1px solid #1F2937' }}><div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}><div className="flex items-center gap-2"><span>🤖</span><span className="text-sm font-bold text-white">AI Coaching Brief — GPS + SwingVision Combined</span></div><span className="text-[10px]" style={{ color: '#6B7280' }}>Generated: just now</span></div><div className="px-5 py-4">{gpsAiLoading && <div className="text-sm" style={{ color: '#06b6d4' }}>Analysing your session data...</div>}{gpsAiBrief && !gpsAiLoading && <div className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{gpsAiBrief}</div>}</div></div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><div className="text-sm font-bold text-white">Session History</div></div><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-gray-500 border-b border-gray-800"><th className="text-left px-5 py-2">Date</th><th className="text-left py-2">Surface</th><th className="text-right py-2">Coverage</th><th className="text-right py-2">Load</th><th className="text-right py-2">Top Speed</th><th className="text-right px-5 py-2">Outcome</th></tr></thead><tbody>{[{ date:'09 Apr', surface:'Clay', coverage:'3.8km', load:68, speed:'27.1km/h', outcome:'W vs Lindqvist', win:true },{ date:'07 Apr', surface:'Clay', coverage:'4.1km', load:79, speed:'29.2km/h', outcome:'W vs Kellner', win:true },{ date:'05 Apr', surface:'Clay', coverage:'2.9km', load:51, speed:'25.8km/h', outcome:'Practice', win:null },{ date:'03 Apr', surface:'Hard', coverage:'4.4km', load:82, speed:'30.1km/h', outcome:'L vs Brenner', win:false },{ date:'01 Apr', surface:'Hard', coverage:'3.2km', load:61, speed:'26.4km/h', outcome:'Practice', win:null }].map((r,i) => (<tr key={i} className="border-b border-gray-800/50" style={{ backgroundColor: r.win===true?'rgba(34,197,94,0.04)':r.win===false?'rgba(239,68,68,0.04)':'transparent' }}><td className="px-5 py-2.5 text-gray-300">{r.date}</td><td className="py-2.5 text-gray-400">{r.surface}</td><td className="py-2.5 text-right text-white font-medium">{r.coverage}</td><td className="py-2.5 text-right"><span style={{ color: r.load>80?'#EF4444':r.load>60?'#F59E0B':'#22C55E' }}>{r.load}</span></td><td className="py-2.5 text-right text-gray-300">{r.speed}</td><td className="px-5 py-2.5 text-right"><span style={{ color: r.win===true?'#22C55E':r.win===false?'#EF4444':'#6B7280' }}>{r.outcome}</span></td></tr>))}</tbody></table></div></div>
      <TennisAISection context="default" player={player} session={session} />
    </div>
  )
}

// ─── SEND MESSAGE MODAL ──────────────────────────────────────────────────────

function TennisSendMessage({ onClose, session, player }: { onClose: () => void; session: SportsDemoSession; player: TennisPlayer }) {
  const [step, setStep] = useState<'who'|'how'|'message'|'preview'|'sent'>('who')
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [customPerson, setCustomPerson] = useState('')
  const [channels, setChannels] = useState<string[]>(['email'])
  const [messageText, setMessageText] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [aiDraft, setAiDraft] = useState('')
  const [loading, setLoading] = useState(false)

  const TEAM = [
    { name: 'Carlos Mendez', role: 'Head Coach', icon: '📋' },
    { name: 'Dr Sarah Lee', role: 'Physiotherapist', icon: '⚕️' },
    { name: 'James Wright', role: 'Agent (IMG)', icon: '💼' },
    { name: 'Petra Novak', role: 'Nutritionist', icon: '🥗' },
    { name: 'Marcos Silva', role: 'Sports Psychologist', icon: '🧠' },
    { name: 'Tom Ellis', role: 'Stringer', icon: '🎵' },
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
      const res = await fetch('/api/ai/tennis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, messages: [{ role: 'user',
          content: `Draft a professional but direct message on behalf of ${session.userName || player.name}, a professional tennis player (ATP #${player.ranking ?? 67}). Recipients: ${allRecipients.join(', ')}. Channel: ${usedChannels.join(', ')}. Message: ${messageText}. ${urgent ? 'This is marked URGENT — prepend with [URGENT] and make the tone immediate.' : ''} Return only the final message text, no preamble. Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.`
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
                  style={{ backgroundColor: i < stepIdx ? '#22C55E' : i === stepIdx ? '#7C3AED' : 'rgba(255,255,255,0.05)', color: i <= stepIdx ? '#fff' : '#4B5563' }}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <span className="text-xs font-semibold" style={{ color: i === stepIdx ? '#7C3AED' : i < stepIdx ? '#22C55E' : '#4B5563' }}>{s}</span>
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
                  style={{ backgroundColor: selectedPeople.includes(m.name) ? 'rgba(124,58,237,0.15)' : '#111318', border: selectedPeople.includes(m.name) ? '1px solid rgba(124,58,237,0.5)' : '1px solid #1F2937' }}>
                  <span className="text-lg">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{m.name}</div>
                    <div className="text-[10px]" style={{ color: '#6B7280' }}>{m.role}</div>
                  </div>
                  {selectedPeople.includes(m.name) && <span style={{ color: '#7C3AED' }}>✓</span>}
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
                  <span key={n} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: 'rgba(124,58,237,0.2)', color: '#A78BFA' }}>{n}</span>
                ))}
              </div>
            )}
            <button onClick={() => setStep('how')} disabled={allRecipients.length === 0}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
              style={{ backgroundColor: allRecipients.length > 0 ? '#7C3AED' : '#374151' }}>
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
                  style={{ backgroundColor: channels.includes(ch.id) ? 'rgba(124,58,237,0.15)' : '#111318', border: channels.includes(ch.id) ? '1px solid rgba(124,58,237,0.5)' : '1px solid #1F2937' }}>
                  <span className="text-2xl">{ch.icon}</span>
                  <span className="text-sm font-semibold text-white">{ch.label}</span>
                  {channels.includes(ch.id) && <span className="ml-auto" style={{ color: '#7C3AED' }}>✓</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('who')} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Back</button>
              <button onClick={() => setStep('message')} disabled={channels.length === 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: channels.length > 0 ? '#7C3AED' : '#374151' }}>
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
              {allRecipients.map(n => <span key={n} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}>{n}</span>)}
              <span className="text-xs" style={{ color: '#6B7280' }}>via</span>
              {channels.map(id => <span key={id} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{CHANNELS.find(c => c.id === id)?.label}</span>)}
            </div>
            <textarea value={messageText} onChange={e => setMessageText(e.target.value)} rows={5} placeholder="Type your message..."
              className="w-full px-4 py-3 rounded-xl text-sm text-white resize-none" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setStep('how')} className="py-2.5 px-4 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Back</button>
              <button onClick={() => handleSend(false)} disabled={!messageText.trim() || loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: messageText.trim() ? '#7C3AED' : '#374151' }}>
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
                style={{ backgroundColor: isUrgent ? '#EF4444' : '#7C3AED' }}>
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
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#7C3AED' }}>Done</button>
          </div>
        )}
      </div>
    </>
  )
}

// ─── SOCIAL MEDIA MODAL ──────────────────────────────────────────────────────
function TennisSocialMedia({ onClose, session, player }: { onClose: () => void; session: SportsDemoSession; player: TennisPlayer }) {
  const [step, setStep] = useState(1)
  const [topic, setTopic] = useState('')
  const [details, setDetails] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [tone, setTone] = useState('')
  const [loading, setLoading] = useState(false)
  const [posts, setPosts] = useState<Record<string, string>>({})
  const [activePreview, setActivePreview] = useState('')
  const [posted, setPosted] = useState(false)

  const TOPICS = [
    { id:'match', label:'🎾 Match Result', example:'Won 6-4, 7-5 vs Vega in Monte-Carlo QF. Great match on clay.' },
    { id:'training', label:'🏋️ Training Day', example:'Solid session today — serve practice and movement drills on clay.' },
    { id:'travel', label:'✈️ Tournament Travel', example:'Heading to Madrid for the next Masters event. Clay season continues.' },
    { id:'achievement', label:'🏆 Achievement', example:'Career-high ranking reached — climbing the ATP ladder.' },
    { id:'sponsor', label:'🙏 Sponsor Shoutout', example:'Grateful for the support from my sponsors this season.' },
    { id:'personal', label:'💬 Personal Note', example:'Rest day today. Grateful for the team and the journey so far.' },
  ]
  const PLATFORMS = [
    { id:'twitter', label:'𝕏 Twitter/X', icon:'𝕏' },
    { id:'instagram', label:'📸 Instagram', icon:'📸' },
    { id:'linkedin', label:'💼 LinkedIn', icon:'💼' },
    { id:'facebook', label:'📘 Facebook', icon:'📘' },
    { id:'tiktok', label:'🎵 TikTok Caption', icon:'🎵' },
  ]
  const TONES = [
    { id:'fired', label:'🔥 Fired Up' },{ id:'casual', label:'😎 Casual' },{ id:'grateful', label:'🙏 Grateful' },
    { id:'professional', label:'💼 Professional' },{ id:'humorous', label:'😂 Humorous' },{ id:'motivational', label:'💪 Motivational' },
  ]

  const togglePlatform = (id: string) => setPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  const generate = async () => {
    setLoading(true)
    try {
      const platNames = platforms.map(p => PLATFORMS.find(pl => pl.id === p)?.label || p).join(', ')
      const toneLabel = TONES.find(t => t.id === tone)?.label || tone
      const res = await fetch('/api/ai/tennis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 800,
        messages: [{ role: 'user', content: `You are a social media manager for ${session.userName || 'Alex Rivera'}, a professional ATP tennis player ranked #${player.ranking ?? 67}. Create social media posts about: ${topic} — ${details}. Tone: ${toneLabel}. Generate a tailored version for each selected platform: ${platNames}. Label each platform's post with the platform name in capitals followed by a colon, then the caption on the next line. ${platforms.includes('twitter') ? 'Twitter: max 280 chars, include relevant hashtags. ' : ''}${platforms.includes('instagram') ? 'Instagram: engaging caption with 3-5 hashtags at the end. ' : ''}${platforms.includes('linkedin') ? 'LinkedIn: professional, 2-3 short paragraphs. ' : ''}${platforms.includes('facebook') ? 'Facebook: conversational, shareable. ' : ''}${platforms.includes('tiktok') ? 'TikTok: punchy caption, trending hashtag style. ' : ''}Only include platforms that were selected. Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.` }]
      }) })
      const data = await res.json()
      const raw = cleanResponse(data.content?.[0]?.text || '')
      const parsed: Record<string, string> = {}
      const sections = raw.split(/\n(?=TWITTER:|INSTAGRAM:|LINKEDIN:|FACEBOOK:|TIKTOK:)/i)
      for (const sec of sections) {
        const m = sec.match(/^(TWITTER|INSTAGRAM|LINKEDIN|FACEBOOK|TIKTOK):\s*([\s\S]*)/i)
        if (m) parsed[m[1].toLowerCase()] = m[2].trim()
      }
      setPosts(parsed)
      setActivePreview(platforms[0] || '')
      setStep(4)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const postAll = () => {
    const connected = ['twitter', 'instagram']
    const results: string[] = []
    for (const p of platforms) {
      if (connected.includes(p) && posts[p]) results.push(`✅ ${PLATFORMS.find(pl => pl.id === p)?.label} — Posted`)
      else if (posts[p]) { navigator.clipboard.writeText(posts[p]); results.push(`📋 ${PLATFORMS.find(pl => pl.id === p)?.label} — Copied to clipboard`) }
    }
    setPosted(true)
  }

  const progress = (step / 5) * 100

  return (
    <>
      <ModalHeader icon="📱" title="Social Media" subtitle="AI-powered multi-platform content engine" onClose={onClose} />
      <div className="px-5 py-2"><div className="w-full bg-gray-800 rounded-full h-1"><div className="h-1 rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: '#0ea5e9' }} /></div><div className="text-[10px] mt-1" style={{ color: '#6B7280' }}>Step {step} of 5</div></div>

      <div className="p-5">
        {/* STEP 1: Content */}
        {step === 1 && (<div className="space-y-4">
          <p className="text-sm font-semibold text-white">What do you want to post about?</p>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map(t => (
              <button key={t.id} onClick={() => { setTopic(t.label); setDetails(t.example) }}
                className="text-xs px-3 py-2 rounded-xl transition-all"
                style={{ backgroundColor: topic === t.label ? 'rgba(14,165,233,0.2)' : '#111318', border: topic === t.label ? '1px solid #0ea5e9' : '1px solid #1F2937', color: topic === t.label ? '#0ea5e9' : '#9CA3AF' }}>{t.label}</button>
            ))}
          </div>
          <textarea value={details} onChange={e => setDetails(e.target.value)} rows={3} placeholder="Add any extra details or paste a result, stat, or moment..."
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white resize-none" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} />
          <button onClick={() => setStep(2)} disabled={!topic || !details}
            className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: topic && details ? '#0ea5e9' : '#374151' }}>Next →</button>
        </div>)}

        {/* STEP 2: Platforms */}
        {step === 2 && (<div className="space-y-4">
          <p className="text-sm font-semibold text-white">Which platforms? <span className="text-xs font-normal" style={{ color: '#6B7280' }}>(multi-select)</span></p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button key={p.id} onClick={() => togglePlatform(p.id)}
                className="text-xs px-4 py-2.5 rounded-xl transition-all"
                style={{ backgroundColor: platforms.includes(p.id) ? 'rgba(14,165,233,0.2)' : '#111318', border: platforms.includes(p.id) ? '1px solid #0ea5e9' : '1px solid #1F2937', color: platforms.includes(p.id) ? '#0ea5e9' : '#9CA3AF' }}>{p.label}</button>
            ))}
          </div>
          <p className="text-[10px]" style={{ color: '#6B7280' }}>Each platform gets a tailored version of the post</p>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Back</button>
            <button onClick={() => setStep(3)} disabled={platforms.length === 0}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: platforms.length > 0 ? '#0ea5e9' : '#374151' }}>Next →</button>
          </div>
        </div>)}

        {/* STEP 3: Tone */}
        {step === 3 && (<div className="space-y-4">
          <p className="text-sm font-semibold text-white">What&apos;s the tone?</p>
          <div className="flex flex-wrap gap-2">
            {TONES.map(t => (
              <button key={t.id} onClick={() => setTone(t.id)}
                className="text-xs px-4 py-2.5 rounded-xl transition-all"
                style={{ backgroundColor: tone === t.id ? 'rgba(14,165,233,0.2)' : '#111318', border: tone === t.id ? '1px solid #0ea5e9' : '1px solid #1F2937', color: tone === t.id ? '#0ea5e9' : '#9CA3AF' }}>{t.label}</button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Back</button>
            <button onClick={generate} disabled={!tone || loading}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: tone && !loading ? '#0ea5e9' : '#374151' }}>{loading ? '⏳ Generating...' : '✨ Generate Posts →'}</button>
          </div>
        </div>)}

        {/* STEP 4: Preview */}
        {step === 4 && (<div className="space-y-4">
          <div className="flex gap-1 border-b" style={{ borderColor: '#1F2937' }}>
            {platforms.map(p => {
              const pl = PLATFORMS.find(x => x.id === p)
              return (<button key={p} onClick={() => setActivePreview(p)}
                className="px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-all"
                style={{ borderColor: activePreview === p ? '#0ea5e9' : 'transparent', color: activePreview === p ? '#0ea5e9' : '#6B7280' }}>{pl?.icon} {pl?.label.split(' ')[1]}</button>)
            })}
          </div>
          <textarea value={posts[activePreview] || ''} onChange={e => setPosts(prev => ({ ...prev, [activePreview]: e.target.value }))} rows={6}
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white resize-none" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} />
          {activePreview === 'twitter' && <div className="text-[10px] text-right" style={{ color: (posts.twitter?.length || 0) > 280 ? '#EF4444' : '#6B7280' }}>{posts.twitter?.length || 0}/280</div>}
          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="py-2.5 px-4 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Back</button>
            <button onClick={() => { setStep(3); setPosts({}) }} className="py-2.5 px-4 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>↻ Regenerate</button>
            <button onClick={() => setStep(5)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#0ea5e9' }}>Approve &amp; Next →</button>
          </div>
        </div>)}

        {/* STEP 5: Post */}
        {step === 5 && !posted && (<div className="space-y-4">
          <p className="text-sm font-semibold text-white">Ready to post to:</p>
          <div className="space-y-2">
            {platforms.map(p => {
              const pl = PLATFORMS.find(x => x.id === p)
              const connected = ['twitter', 'instagram'].includes(p)
              return (<div key={p} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <span className="text-sm text-white">{pl?.label}</span>
                {connected ? <span className="text-xs text-green-400">✅ Connected</span> : <span className="text-xs text-amber-400">⚠️ Not connected</span>}
              </div>)
            })}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(4)} className="py-2.5 px-4 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Back</button>
            <button onClick={postAll} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#0ea5e9' }}>🚀 Post Now</button>
          </div>
        </div>)}

        {step === 5 && posted && (<div className="text-center py-6 space-y-3">
          <div className="text-4xl mb-2">✅</div>
          <div className="text-base font-bold text-white">Posts sent!</div>
          {platforms.map(p => {
            const pl = PLATFORMS.find(x => x.id === p)
            const connected = ['twitter', 'instagram'].includes(p)
            return <div key={p} className="text-xs" style={{ color: connected ? '#22C55E' : '#F59E0B' }}>{connected ? '✅' : '📋'} {pl?.label} — {connected ? 'Posted' : 'Copied to clipboard'}</div>
          })}
          <button onClick={onClose} className="mt-4 px-8 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#0ea5e9' }}>Done</button>
        </div>)}
      </div>
    </>
  )
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
              style={{ backgroundColor: i < current ? '#22C55E' : i === current ? '#0ea5e9' : 'rgba(255,255,255,0.05)', color: i <= current ? '#fff' : '#4B5563' }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className="text-xs font-semibold" style={{ color: i === current ? '#0ea5e9' : i < current ? '#22C55E' : '#4B5563' }}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className="flex-1 h-px" style={{ backgroundColor: i < current ? '#22C55E' : '#1F2937' }} />}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── MODAL COMPONENTS ─────────────────────────────────────────────────────────

function TennisFlightFinder({ onClose, session, player }: { onClose: () => void; session: SportsDemoSession; player: TennisPlayer }) {
  const [step, setStep] = useState<'configure'|'searching'|'results'|'book'>('configure')
  const [from, setFrom] = useState('London Heathrow (LHR)')
  const [to, setTo] = useState('Nice (NCE) — Monte-Carlo')
  const [depart, setDepart] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [cabinClass, setCabinClass] = useState('Business')
  const [passengers, setPassengers] = useState(2)
  const [results, setResults] = useState<Array<{airline:string;flightNo:string;departs:string;arrives:string;duration:string;stops:string;price:number;currency:string;score:number;badge?:string}>>([])
  const [selectedFlight, setSelectedFlight] = useState<typeof results[0] | null>(null)

  const UPCOMING = [
    { label: 'Madrid Open — 26 Apr', to: 'Madrid (MAD)', date: '2026-04-25' },
    { label: 'Roland-Garros — 25 May', to: 'Paris CDG (CDG)', date: '2026-05-24' },
    { label: 'Halle Open — 14 Jun', to: 'Hanover (HAJ)', date: '2026-06-13' },
    { label: 'Wimbledon — 29 Jun', to: 'London (LHR)', date: '2026-06-28' },
    { label: 'US Open — 24 Aug', to: 'New York JFK (JFK)', date: '2026-08-22' },
  ]

  const FALLBACK_RESULTS = [
    { airline:'British Airways', flightNo:'BA2760', departs:'07:20', arrives:'10:35', duration:'2h15m', stops:'Direct', price:312, currency:'GBP', score:96, badge:'Best value' },
    { airline:'easyJet', flightNo:'EZY8832', departs:'06:05', arrives:'09:20', duration:'2h15m', stops:'Direct', price:187, currency:'GBP', score:88, badge:'Cheapest' },
    { airline:'Air France', flightNo:'AF1680', departs:'09:45', arrives:'13:10', duration:'3h25m', stops:'1 stop', price:298, currency:'GBP', score:82, badge:'Fastest' },
    { airline:'Vueling', flightNo:'VY7803', departs:'11:30', arrives:'14:45', duration:'2h15m', stops:'Direct', price:224, currency:'GBP', score:85 },
  ]

  const searchFlights = async () => {
    setStep('searching')
    try {
      const res = await fetch('/api/ai/tennis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          messages: [{ role: 'user', content: `Find 4 ${cabinClass} class flights from ${from} to ${to} departing ${depart || 'next week'} for ${passengers} passengers. Return ONLY a JSON array: [{"airline":"","flightNo":"","departs":"","arrives":"","duration":"","stops":"","price":0,"currency":"GBP","score":0,"badge":""}]. Score 0-100 for value. Badge: "Best value", "Cheapest", "Fastest", or null. Realistic prices.` }]
        })
      })
      const data = await res.json()
      const text = cleanResponse(data.content?.filter((b:{type:string}) => b.type === 'text').map((b:{text:string}) => b.text).join('') || '')
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
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: '#6B7280' }}>Upcoming tournaments</label>
              <div className="flex flex-wrap gap-2">
                {UPCOMING.map(t => (
                  <button key={t.label} onClick={() => { setTo(t.to); setDepart(t.date) }}
                    className="text-xs px-3 py-1.5 rounded-full transition-all"
                    style={{ backgroundColor: to === t.to ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.05)', border: to === t.to ? '1px solid #0ea5e9' : '1px solid #1F2937', color: to === t.to ? '#0ea5e9' : '#9CA3AF' }}>
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
              <div><label className="text-xs text-gray-500 mb-1 block">Passengers</label><div className="flex items-center gap-3 pt-1"><button onClick={() => setPassengers(Math.max(1,passengers-1))} className="w-8 h-8 rounded-lg font-bold text-white" style={{backgroundColor:'#1F2937'}}>−</button><span className="text-sm font-bold text-white w-4 text-center">{passengers}</span><button onClick={() => setPassengers(Math.min(6,passengers+1))} className="w-8 h-8 rounded-lg font-bold text-white" style={{backgroundColor:'#1F2937'}}>+</button></div></div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
              <span className="text-base flex-shrink-0">🤖</span>
              <p className="text-xs" style={{ color: '#93C5FD' }}>Lumio AI searches BA, easyJet, Ryanair, Vueling, Iberia, Air France and more — scoring on price, duration, and quality.</p>
            </div>
            <button onClick={searchFlights} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#0ea5e9' }}>Search Flights →</button>
          </div>
        )}
        {step === 'searching' && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4 animate-bounce">✈️</div>
            <div className="text-base font-bold text-white mb-2">Searching all airlines...</div>
            <div className="text-xs mb-6" style={{ color: '#6B7280' }}>Checking BA, easyJet, Ryanair, Vueling, Air France + more</div>
          </div>
        )}
        {step === 'results' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2"><div className="text-sm font-bold text-white">{results.length} flights found</div><div className="text-xs" style={{ color: '#6B7280' }}>{from} → {to} · {cabinClass} · {passengers} pax</div></div>
            {results.map((f, i) => (
              <div key={i} onClick={() => setSelectedFlight(f)} className="rounded-xl p-4 cursor-pointer transition-all"
                style={{ backgroundColor: selectedFlight?.flightNo === f.flightNo ? 'rgba(14,165,233,0.1)' : '#111318', border: selectedFlight?.flightNo === f.flightNo ? '1px solid #0ea5e9' : '1px solid #1F2937' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{f.airline}</span>
                      <span className="text-xs" style={{ color: '#4B5563' }}>{f.flightNo}</span>
                      {f.badge && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: f.badge === 'Best value' ? '#0ea5e9' : f.badge === 'Cheapest' ? '#22C55E' : '#8B5CF6' }}>{f.badge}</span>}
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
              <button onClick={() => selectedFlight && setStep('book')} disabled={!selectedFlight} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: selectedFlight ? '#0ea5e9' : '#374151' }}>Book selected →</button>
            </div>
          </div>
        )}
        {step === 'book' && selectedFlight && (
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
              <div className="text-sm font-bold text-white mb-2">Booking summary</div>
              <div className="space-y-1 text-xs" style={{ color: '#9CA3AF' }}>
                {[['Route',`${from} → ${to}`],['Flight',`${selectedFlight.airline} ${selectedFlight.flightNo}`],['Departs',`${depart} at ${selectedFlight.departs}`],['Class',cabinClass],['Passengers',String(passengers)],['Total',`${selectedFlight.currency} ${(selectedFlight.price*passengers).toLocaleString()}`]].map(([l,v]) => (
                  <div key={l} className="flex justify-between"><span>{l}</span><span className="text-white">{v}</span></div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('results')} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Back</button>
              <button onClick={() => { const s = encodeURIComponent(`Flight booking — ${from} to ${to}`); const b = encodeURIComponent(`Please book: ${selectedFlight.airline} ${selectedFlight.flightNo}, ${depart}, ${cabinClass}, ${passengers} pax, ${selectedFlight.currency} ${(selectedFlight.price*passengers).toLocaleString()}\n\nThanks, ${session.userName || 'Alex'}`); window.open(`mailto:james.wright@agent.com?subject=${s}&body=${b}`) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#0ea5e9' }}>📧 Send to agent →</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function TennisMatchPrepAI({ onClose, session, player }: { onClose: () => void; session: SportsDemoSession; player: TennisPlayer }) {
  const [opponent, setOpponent] = useState('C. Vega')
  const [surface, setSurface] = useState('Clay')
  const [tournament, setTournament] = useState('Monte-Carlo Masters')
  const [loading, setLoading] = useState(false)
  const [brief, setBrief] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/tennis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          messages: [{ role: 'user', content: `You are a top tennis analyst. Generate a tactical match prep brief for ${session.userName || 'Alex Rivera'} (ATP #${player.ranking ?? 67}) vs ${opponent} at ${tournament} on ${surface}. Cover opponent profile, serve patterns, return game, three to four specific tactical recommendations, head-to-head context, and mental edge. Max 400 words. Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.` }]
        })
      })
      const data = await res.json()
      setBrief(cleanResponse(data.content?.[0]?.text || 'Unable to generate brief.'))
    } catch { setBrief('Unable to generate brief.') }
    setLoading(false)
  }

  return (
    <>
      <ModalHeader icon="🎾" title="Match Prep AI" subtitle="AI tactical brief for your next opponent" onClose={onClose} />
      <div className="p-6 space-y-4">
        {!brief ? (<>
          <div className="grid grid-cols-1 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Opponent</label><input value={opponent} onChange={e => setOpponent(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-500 mb-1 block">Surface</label><select value={surface} onChange={e => setSurface(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}><option>Clay</option><option>Hard</option><option>Grass</option><option>Indoor</option></select></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Tournament</label><input value={tournament} onChange={e => setTournament(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
            </div>
          </div>
          <button onClick={generate} disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#22C55E' }}>{loading ? '⏳ Generating...' : '🧠 Generate Match Prep Brief →'}</button>
        </>) : (<>
          <div className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB', maxHeight: 400, overflowY: 'auto' }}>{brief}</div>
          <div className="flex gap-3">
            <button onClick={() => setBrief(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Regenerate</button>
            <button onClick={() => navigator.clipboard.writeText(brief)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#22C55E' }}>📋 Copy brief</button>
          </div>
        </>)}
      </div>
    </>
  )
}

function TennisSponsorPost({ onClose, session, player }: { onClose: () => void; session: SportsDemoSession; player: TennisPlayer }) {
  const [sponsor, setSponsor] = useState('Meridian Watches')
  const [platform, setPlatform] = useState('Instagram')
  const [context, setContext] = useState('Monte-Carlo Masters QF day')
  const [tone, setTone] = useState('Professional')
  const [loading, setLoading] = useState(false)
  const [post, setPost] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/tennis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500, messages: [{ role: 'user', content: `Write a ${platform} sponsor post for ${session.userName || 'Alex Rivera'} (ATP #${player.ranking ?? 67}) featuring ${sponsor}. Context: ${context}. Tone: ${tone}. Natural, not salesy. Include hashtags at the end. Write ONLY the caption. Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.` }] })
      })
      const data = await res.json()
      setPost(cleanResponse(data.content?.[0]?.text || 'Unable to generate.'))
    } catch { setPost('Unable to generate.') }
    setLoading(false)
  }

  return (
    <>
      <ModalHeader icon="📱" title="Sponsor Post Generator" subtitle="AI writes authentic sponsor content" onClose={onClose} />
      <div className="p-6 space-y-4">
        {!post ? (<>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Sponsor</label><select value={sponsor} onChange={e => setSponsor(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}>{['Meridian Watches','Apex Performance','Apex Performance','Vanta Sports','Kinetix Hydration'].map(s => <option key={s}>{s}</option>)}</select></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Platform</label><select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}>{['Instagram','Twitter/X','Facebook','LinkedIn','TikTok'].map(p => <option key={p}>{p}</option>)}</select></div>
          </div>
          <div><label className="text-xs text-gray-500 mb-1 block">Context</label><textarea value={context} onChange={e => setContext(e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm text-white resize-none" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <div><label className="text-xs text-gray-500 mb-2 block">Tone</label><div className="flex flex-wrap gap-2">{['Professional','Casual','Motivational','Humorous','Grateful'].map(t => (<button key={t} onClick={() => setTone(t)} className="text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: tone===t?'rgba(245,158,11,0.2)':'rgba(255,255,255,0.05)', border: tone===t?'1px solid #F59E0B':'1px solid #1F2937', color: tone===t?'#F59E0B':'#9CA3AF' }}>{t}</button>))}</div></div>
          <button onClick={generate} disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#F59E0B' }}>{loading ? '⏳ Writing...' : '✍️ Generate Post →'}</button>
        </>) : (<>
          <div className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB' }}>{post}</div>
          <div className="flex gap-3"><button onClick={() => setPost(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Regenerate</button><button onClick={() => navigator.clipboard.writeText(post)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#F59E0B' }}>📋 Copy post</button></div>
        </>)}
      </div>
    </>
  )
}

function TennisPressStatement({ onClose, session, player }: { onClose: () => void; session: SportsDemoSession; player: TennisPlayer }) {
  const [result, setResult] = useState<'win'|'loss'>('win')
  const [opponent, setOpponent] = useState('C. Vega')
  const [score, setScore] = useState('6-4, 6-3')
  const [ctx, setCtx] = useState('Monte-Carlo Masters QF')
  const [loading, setLoading] = useState(false)
  const [statement, setStatement] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/tennis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500, messages: [{ role: 'user', content: `Write a press statement for ${session.userName || 'Alex Rivera'} (ATP #${player.ranking ?? 67}) after a ${result} against ${opponent} (${score}) at ${ctx}. Cover four to five talking points woven naturally into the statement. Genuine, not corporate. Around 150 words. Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.` }] })
      })
      const data = await res.json()
      setStatement(cleanResponse(data.content?.[0]?.text || 'Unable to generate.'))
    } catch { setStatement('Unable to generate.') }
    setLoading(false)
  }

  return (
    <>
      <ModalHeader icon="📣" title="Press Statement" subtitle="Post-match talking points in your voice" onClose={onClose} />
      <div className="p-6 space-y-4">
        {!statement ? (<>
          <div className="flex gap-2">{(['win','loss'] as const).map(r => (<button key={r} onClick={() => setResult(r)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: result===r?(r==='win'?'#22C55E':'#EF4444'):'rgba(255,255,255,0.05)', color: result===r?'#fff':'#9CA3AF' }}>{r==='win'?'🏆 Win':'❌ Loss'}</button>))}</div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Opponent</label><input value={opponent} onChange={e => setOpponent(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Score</label><input value={score} onChange={e => setScore(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          </div>
          <div><label className="text-xs text-gray-500 mb-1 block">Tournament / Round</label><input value={ctx} onChange={e => setCtx(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <button onClick={generate} disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#8B5CF6' }}>{loading ? '⏳ Writing...' : '🎤 Generate Statement →'}</button>
        </>) : (<>
          <div className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB' }}>{statement}</div>
          <div className="flex gap-3"><button onClick={() => setStatement(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Regenerate</button><button onClick={() => navigator.clipboard.writeText(statement)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#8B5CF6' }}>📋 Copy</button></div>
        </>)}
      </div>
    </>
  )
}

function TennisRankingSimulator({ onClose, player }: { onClose: () => void; player: TennisPlayer }) {
  const currentPts = player.ranking_points ?? 1847
  const ptsAtRisk = 312
  const currentRank = player.ranking ?? 67

  return (
    <>
      <ModalHeader icon="📊" title="Ranking Simulator" subtitle="What-if ranking calculator" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><div className="text-2xl font-black" style={{ color: '#0ea5e9' }}>#{currentRank}</div><div className="text-xs" style={{ color: '#6B7280' }}>Current</div></div>
            <div><div className="text-2xl font-black text-white">{currentPts.toLocaleString()}</div><div className="text-xs" style={{ color: '#6B7280' }}>Points</div></div>
            <div><div className="text-2xl font-black" style={{ color: '#EF4444' }}>−{ptsAtRisk}</div><div className="text-xs" style={{ color: '#6B7280' }}>At risk</div></div>
          </div>
        </div>
        {[
          { label:'🏆 Win the title', pts:360, color:'#22C55E', rankDelta:-4 },
          { label:'🥈 Runner-up', pts:180, color:'#0ea5e9', rankDelta:-2 },
          { label:'✅ SF exit', pts:90, color:'#F59E0B', rankDelta:0 },
          { label:'❌ QF exit (today)', pts:45, color:'#EF4444', rankDelta:+4 },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div><div className="text-sm font-bold text-white">{s.label}</div><div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>+{s.pts} pts · net {(currentPts-ptsAtRisk+s.pts).toLocaleString()}</div></div>
            <div className="text-right"><div className="text-xl font-black" style={{ color: s.color }}>#{currentRank+s.rankDelta}</div><div className="text-xs" style={{ color: s.rankDelta<0?'#22C55E':s.rankDelta>0?'#EF4444':'#6B7280' }}>{s.rankDelta<0?`↑${Math.abs(s.rankDelta)}`:s.rankDelta>0?`↓${s.rankDelta}`:'→ holds'}</div></div>
          </div>
        ))}
      </div>
    </>
  )
}

function TennisInjuryLogger({ onClose }: { onClose: () => void }) {
  const [bodyPart, setBodyPart] = useState('')
  const [severity, setSeverity] = useState<'mild'|'moderate'|'severe'>('mild')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const PARTS = ['Shoulder (right)','Elbow (right)','Knee (right)','Knee (left)','Wrist','Back','Ankle','Hip','Other']
  return (<>
    <ModalHeader icon="💊" title="Log Injury" subtitle="Log and auto-notify your physio" onClose={onClose} />
    <div className="p-6 space-y-4">
      {!submitted ? (<>
        <div><label className="text-xs text-gray-500 mb-1 block">Body part</label><div className="flex flex-wrap gap-2">{PARTS.map(p => (<button key={p} onClick={() => setBodyPart(p)} className="text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: bodyPart===p?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.05)', border: bodyPart===p?'1px solid #EF4444':'1px solid #1F2937', color: bodyPart===p?'#EF4444':'#9CA3AF' }}>{p}</button>))}</div></div>
        <div><label className="text-xs text-gray-500 mb-1 block">Severity</label><div className="flex gap-2">{(['mild','moderate','severe'] as const).map(s => (<button key={s} onClick={() => setSeverity(s)} className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: severity===s?(s==='mild'?'#22C55E':s==='moderate'?'#F59E0B':'#EF4444'):'rgba(255,255,255,0.05)', color: severity===s?'#fff':'#9CA3AF' }}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>))}</div></div>
        <div><label className="text-xs text-gray-500 mb-1 block">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="When did it start?" className="w-full px-3 py-2.5 rounded-xl text-sm text-white resize-none" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
        <button onClick={() => setSubmitted(true)} disabled={!bodyPart} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: bodyPart?'#EF4444':'#374151' }}>Log Injury & Notify Team →</button>
      </>) : (
        <div className="text-center py-8"><div className="text-5xl mb-3">✅</div><div className="text-base font-bold text-white mb-2">Injury logged</div><div className="text-sm mb-4" style={{ color: '#6B7280' }}>Dr Sarah Lee notified.</div><button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#0ea5e9' }}>Done</button></div>
      )}
    </div>
  </>)
}

function TennisExpenseLogger({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('GBP')
  const [category, setCategory] = useState('Travel')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const CATS = ['Travel','Hotel','Equipment','Coaching','Medical','Food','Sponsor','Other']
  return (<>
    <ModalHeader icon="🧾" title="Log Expense" subtitle="Quick expense logging" onClose={onClose} />
    <div className="p-6 space-y-4">
      {!submitted ? (<>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">Amount</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Currency</label><select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}>{['GBP','EUR','USD','AUD'].map(c => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div><label className="text-xs text-gray-500 mb-2 block">Category</label><div className="flex flex-wrap gap-2">{CATS.map(c => (<button key={c} onClick={() => setCategory(c)} className="text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: category===c?'rgba(14,165,233,0.2)':'rgba(255,255,255,0.05)', border: category===c?'1px solid #0ea5e9':'1px solid #1F2937', color: category===c?'#0ea5e9':'#9CA3AF' }}>{c}</button>))}</div></div>
        <div><label className="text-xs text-gray-500 mb-1 block">Description</label><input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Flight LHR-NCE" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
        <button onClick={() => setSubmitted(true)} disabled={!amount} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: amount?'#0ea5e9':'#374151' }}>Log Expense →</button>
      </>) : (
        <div className="text-center py-8"><div className="text-5xl mb-3">✅</div><div className="text-base font-bold text-white mb-2">{currency} {amount} logged</div><div className="text-sm mb-4" style={{ color: '#6B7280' }}>{category} — forwarded to accountant.</div><button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#0ea5e9' }}>Done</button></div>
      )}
    </div>
  </>)
}

function TennisStringOrder({ onClose }: { onClose: () => void }) {
  const [stringType, setStringType] = useState('Vanta Sports Luxe Pro')
  const [tension, setTension] = useState('24kg')
  const [quantity, setQuantity] = useState(4)
  const [submitted, setSubmitted] = useState(false)
  return (<>
    <ModalHeader icon="🎵" title="String Order" subtitle="Order strings for your next tournament" onClose={onClose} />
    <div className="p-6 space-y-4">
      {!submitted ? (<>
        <div><label className="text-xs text-gray-500 mb-1 block">String</label><select value={stringType} onChange={e => setStringType(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}>{['Vanta Sports Luxe Pro','Babolat RPM Blast','Head Hawk Touch','Tecnifibre Black Code'].map(s => <option key={s}>{s}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Tension</label><input value={tension} onChange={e => setTension(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Packs</label><div className="flex items-center gap-3 pt-1"><button onClick={() => setQuantity(Math.max(1,quantity-1))} className="w-8 h-8 rounded-lg font-bold text-white" style={{backgroundColor:'#1F2937'}}>−</button><span className="text-sm font-bold text-white">{quantity}</span><button onClick={() => setQuantity(quantity+1)} className="w-8 h-8 rounded-lg font-bold text-white" style={{backgroundColor:'#1F2937'}}>+</button></div></div>
        </div>
        <button onClick={() => setSubmitted(true)} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#10B981' }}>Send Order to Tom Ellis →</button>
      </>) : (
        <div className="text-center py-8"><div className="text-5xl mb-3">✅</div><div className="text-base font-bold text-white mb-2">Order sent</div><div className="text-sm mb-4" style={{ color: '#6B7280' }}>{quantity}x {stringType} at {tension}</div><button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#10B981' }}>Done</button></div>
      )}
    </div>
  </>)
}

function TennisVisaCheck({ onClose }: { onClose: () => void }) {
  const UPCOMING = [
    { tournament:'Madrid Open', country:'Spain', flag:'🇪🇸', date:'26 Apr', visa:'✅ No visa required', detail:'Schengen area' },
    { tournament:'Roland-Garros', country:'France', flag:'🇫🇷', date:'25 May', visa:'✅ No visa required', detail:'Schengen area' },
    { tournament:'Wimbledon', country:'UK', flag:'🇬🇧', date:'29 Jun', visa:'✅ Home nation', detail:'No requirements' },
    { tournament:'US Open', country:'USA', flag:'🇺🇸', date:'24 Aug', visa:'⚠️ ESTA required', detail:'Apply 72hrs before — $21 USD' },
  ]
  return (<>
    <ModalHeader icon="🌍" title="Visa Check" subtitle="Requirements for upcoming tournaments" onClose={onClose} />
    <div className="p-6 space-y-3">
      {UPCOMING.map(t => (
        <div key={t.tournament} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: `1px solid ${t.visa.includes('⚠️')?'rgba(245,158,11,0.3)':'#1F2937'}` }}>
          <div className="flex items-start justify-between"><div className="flex items-center gap-3"><span className="text-2xl">{t.flag}</span><div><div className="text-sm font-bold text-white">{t.tournament}</div><div className="text-xs" style={{ color: '#6B7280' }}>{t.country} · {t.date}</div></div></div><div className="text-xs font-bold">{t.visa}</div></div>
          <div className="text-xs mt-2" style={{ color: '#6B7280' }}>{t.detail}</div>
        </div>
      ))}
    </div>
  </>)
}

function TennisMatchNotes({ onClose, session, player }: { onClose: () => void; session: SportsDemoSession; player: TennisPlayer }) {
  const [note, setNote] = useState('')
  const [opponent, setOpponent] = useState('C. Vega')
  const [saved, setSaved] = useState(false)
  return (<>
    <ModalHeader icon="📝" title="Match Notes" subtitle="Quick notes saved to your match log" onClose={onClose} />
    <div className="p-6 space-y-4">
      {!saved ? (<>
        <div><label className="text-xs text-gray-500 mb-1 block">Opponent</label><input value={opponent} onChange={e => setOpponent(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
        <div><label className="text-xs text-gray-500 mb-1 block">Note</label><textarea value={note} onChange={e => setNote(e.target.value)} rows={5} placeholder="His second serve to BH is attackable..." className="w-full px-3 py-2.5 rounded-xl text-sm text-white resize-none" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} autoFocus /></div>
        <button onClick={() => { try { const prev = JSON.parse(localStorage.getItem('tennis_match_notes') || '[]'); localStorage.setItem('tennis_match_notes', JSON.stringify([`[${opponent}] ${note}`, ...prev].slice(0,20))) } catch {} setSaved(true) }} disabled={!note.trim()} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: note.trim()?'#0ea5e9':'#374151' }}>💾 Save Note →</button>
      </>) : (
        <div className="text-center py-8"><div className="text-5xl mb-3">✅</div><div className="text-base font-bold text-white mb-2">Note saved</div><div className="text-sm mb-4" style={{ color: '#6B7280' }}>Added to match log for {opponent}.</div><button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#0ea5e9' }}>Done</button></div>
      )}
    </div>
  </>)
}

function TennisEntryManager({ onClose }: { onClose: () => void }) {
  const ENTRIES = [
    { tournament:'Hamburg Open 500', deadline:'TODAY 5pm', status:'⚠️ Decision needed', urgent:true },
    { tournament:'Roland-Garros', deadline:'3 May', status:'✅ Accepted', urgent:false },
    { tournament:'Halle Open', deadline:'2 May', status:'⏳ Pending', urgent:false },
    { tournament:'Wimbledon', deadline:'26 May', status:'📋 Not submitted', urgent:false },
    { tournament:'Eastbourne 250', deadline:'20 May', status:'⚠️ Clashes Hamburg', urgent:true },
  ]
  return (<>
    <ModalHeader icon="🏆" title="Entry Manager" subtitle="Tournament entries and deadlines" onClose={onClose} />
    <div className="p-6 space-y-3">
      {ENTRIES.map(e => (
        <div key={e.tournament} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: `1px solid ${e.urgent?'rgba(245,158,11,0.3)':'#1F2937'}` }}>
          <div className="flex items-center justify-between"><div><div className="text-sm font-bold text-white">{e.tournament}</div><div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Deadline: {e.deadline}</div><div className="text-xs mt-1" style={{ color: e.urgent?'#F59E0B':'#6B7280' }}>{e.status}</div></div>
          {e.urgent && <span className="text-[10px] px-2 py-1 rounded font-bold" style={{ backgroundColor: 'rgba(245,158,11,0.2)', color: '#F59E0B' }}>ACTION</span>}</div>
        </div>
      ))}
    </div>
  </>)
}

function TennisHotelFinder({ onClose, session }: { onClose: () => void; session: SportsDemoSession }) {
  const [step, setStep] = useState<'configure'|'searching'|'results'|'book'>('configure')
  const [destination, setDestination] = useState('Monte-Carlo, Monaco')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [roomType, setRoomType] = useState('Double')
  const [guests, setGuests] = useState(1)
  const [results, setResults] = useState<Array<{name:string;stars:number;price:number;distance:string;feature:string;badge?:string}>>([])
  const [selected, setSelected] = useState<typeof results[0] | null>(null)

  const TOURNAMENTS = [
    { label: 'Monte-Carlo — 13 Apr', dest: 'Monte-Carlo, Monaco', cin: '2026-04-12', cout: '2026-04-14' },
    { label: 'Madrid Open — 26 Apr', dest: 'Madrid, Spain', cin: '2026-04-25', cout: '2026-05-04' },
    { label: 'Roland-Garros — 25 May', dest: 'Paris, France', cin: '2026-05-24', cout: '2026-06-08' },
    { label: 'Halle Open — 14 Jun', dest: 'Halle, Germany', cin: '2026-06-13', cout: '2026-06-20' },
    { label: 'Wimbledon — 29 Jun', dest: 'London, UK', cin: '2026-06-28', cout: '2026-07-13' },
    { label: 'US Open — 24 Aug', dest: 'New York, USA', cin: '2026-08-23', cout: '2026-09-07' },
  ]

  const FALLBACK = [
    { name: 'Hôtel Hermitage Monte-Carlo', stars: 5, price: 380, distance: '0.3km from venue', feature: 'In-house physio · pool · gym', badge: 'Best overall' },
    { name: 'Novotel Monte-Carlo', stars: 4, price: 195, distance: '0.8km from venue', feature: 'Gym · free cancellation', badge: 'Best value' },
    { name: 'Columbus Monte-Carlo', stars: 4, price: 220, distance: '0.6km from venue', feature: 'Pool · restaurant · quiet' },
    { name: 'Port Palace', stars: 4, price: 260, distance: '0.5km from venue', feature: 'Harbour view · spa access' },
  ]

  const searchHotels = async () => {
    setStep('searching')
    try {
      const res = await fetch('/api/ai/tennis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 800,
          messages: [{ role: 'user', content: `Search for the best hotels near ${destination} for a professional tennis player checking in ${checkIn || 'next week'} checking out ${checkOut || '5 days later'}. Room type: ${roomType}. Prioritise proximity to the tournament venue, player-friendly amenities (gym, pool, physio services), and value. Return exactly 4 hotel options as a JSON array: [{"name":"","stars":4,"price":200,"distance":"0.5km from venue","feature":"key amenity","badge":"Best overall or Best value or null"}]. Realistic prices in GBP.` }]
        })
      })
      const data = await res.json()
      const text = data.content?.filter((b:{type:string})=>b.type==='text').map((b:{text:string})=>b.text).join('') || ''
      const match = text.match(/\[[\s\S]*\]/)
      setResults(match ? JSON.parse(match[0]) : FALLBACK)
    } catch { setResults(FALLBACK) }
    setStep('results')
  }

  return (<>
    <ModalHeader icon="🏨" title="Smart Hotel Finder" subtitle="AI searches top booking sites for the best player-friendly hotels" onClose={onClose} />
    {step !== 'searching' && (
      <StepIndicator steps={['Configure','Search','Results','Book']} current={['configure','searching','results','book'].indexOf(step)} />
    )}
    <div className="p-6">
      {/* CONFIGURE */}
      {step === 'configure' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: '#6B7280' }}>Upcoming tournaments</label>
            <div className="flex flex-wrap gap-2">
              {TOURNAMENTS.map(t => (
                <button key={t.label} onClick={() => { setDestination(t.dest); setCheckIn(t.cin); setCheckOut(t.cout) }}
                  className="text-xs px-3 py-1.5 rounded-full transition-all"
                  style={{ backgroundColor: destination === t.dest ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.05)', border: destination === t.dest ? '1px solid #0ea5e9' : '1px solid #1F2937', color: destination === t.dest ? '#0ea5e9' : '#9CA3AF' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div><label className="text-xs text-gray-500 mb-1 block">Destination</label><input value={destination} onChange={e => setDestination(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Check-in</label><input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Check-out</label><input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Room type</label><select value={roomType} onChange={e => setRoomType(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}><option>Single</option><option>Double</option><option>Suite</option><option>Presidential Suite</option></select></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Guests</label><div className="flex items-center gap-3 pt-1"><button onClick={() => setGuests(Math.max(1,guests-1))} className="w-8 h-8 rounded-lg font-bold text-white" style={{backgroundColor:'#1F2937'}}>−</button><span className="text-sm font-bold text-white w-4 text-center">{guests}</span><button onClick={() => setGuests(Math.min(4,guests+1))} className="w-8 h-8 rounded-lg font-bold text-white" style={{backgroundColor:'#1F2937'}}>+</button></div></div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
            <span className="text-base flex-shrink-0">🏨</span>
            <p className="text-xs" style={{ color: '#93C5FD' }}>Lumio AI searches Booking.com, Hotels.com, Marriott, Four Seasons and more — scoring on distance to venue, price, and player reviews.</p>
          </div>
          <button onClick={searchHotels} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#0ea5e9' }}>Search Hotels →</button>
        </div>
      )}

      {/* SEARCHING */}
      {step === 'searching' && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4 animate-bounce">🏨</div>
          <div className="text-base font-bold text-white mb-2">Searching hotels near {destination}...</div>
          <div className="text-xs mb-6" style={{ color: '#6B7280' }}>Checking availability for {checkIn || 'your dates'}...</div>
          <div className="space-y-2 max-w-xs mx-auto">
            {['Checking Booking.com...', 'Checking Hotels.com...', 'Scoring by distance to venue...', 'Finding best value...'].map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-xs" style={{ color: '#4B5563' }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#0ea5e9' }} />{t}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESULTS */}
      {step === 'results' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold text-white">{results.length} hotels found</div>
            <div className="text-xs" style={{ color: '#6B7280' }}>{destination} · {roomType} · {guests} guest{guests > 1 ? 's' : ''}</div>
          </div>
          {results.map((h, i) => (
            <div key={i} onClick={() => setSelected(h)}
              className="rounded-xl p-4 cursor-pointer transition-all"
              style={{ backgroundColor: selected?.name === h.name ? 'rgba(14,165,233,0.1)' : '#111318', border: selected?.name === h.name ? '1px solid #0ea5e9' : '1px solid #1F2937' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{h.name}</span>
                    {h.badge && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: h.badge === 'Best overall' ? '#0ea5e9' : '#22C55E' }}>{h.badge}</span>}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{'⭐'.repeat(h.stars)} · {h.distance}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#4B5563' }}>{h.feature}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-white">£{h.price}</div>
                  <div className="text-[10px]" style={{ color: '#6B7280' }}>per night</div>
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-3 mt-4">
            <button onClick={() => setStep('configure')} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Search again</button>
            <button onClick={() => selected && setStep('book')} disabled={!selected} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: selected ? '#0ea5e9' : '#374151' }}>Book selected →</button>
          </div>
        </div>
      )}

      {/* BOOK */}
      {step === 'book' && selected && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
            <div className="text-sm font-bold text-white mb-2">Booking summary</div>
            <div className="space-y-1 text-xs" style={{ color: '#9CA3AF' }}>
              {[['Hotel', selected.name], ['Location', destination], ['Check-in', checkIn], ['Check-out', checkOut], ['Room', roomType], ['Guests', String(guests)], ['Price', `£${selected.price}/night`]].map(([l,v]) => (
                <div key={l} className="flex justify-between"><span>{l}</span><span className="text-white">{v}</span></div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('results')} className="py-2.5 px-4 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Back</button>
            <button onClick={() => window.open(`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(selected.name + ' ' + destination)}`, '_blank')}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#0ea5e9' }}>Open Booking.com →</button>
            <button onClick={() => navigator.clipboard.writeText(`${selected.name}\n${destination}\n${checkIn} to ${checkOut}\n${roomType} · ${guests} guest(s)\n£${selected.price}/night`)}
              className="py-2.5 px-4 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>📋 Copy</button>
          </div>
        </div>
      )}
    </div>
  </>)
}

const TENNIS_ROLE_CONFIG: Record<string, { label: string; icon: string; accent: string; sidebar: 'all' | string[]; hiddenTabs: string[]; roundupChannels: 'all' | string[]; message: string | null }> = {
  player: { label: 'Player', icon: '🎾', accent: '#0ea5e9', sidebar: 'all', hiddenTabs: [], roundupChannels: 'all', message: null },
  agent: { label: 'Agent / Manager', icon: '💼', accent: '#F59E0B', sidebar: ['dashboard','morning','sponsorship','financial','agent','travel','tourcard','entries','schedule','live-scores','media','exhibitions','settings'], hiddenTabs: ['team','dailytasks'], roundupChannels: ['agent','tournament','sponsor','prize','travel','wildcard'], message: 'Commercial and schedule view — player controls full access.' },
  coach: { label: 'Coach', icon: '📋', accent: '#22C55E', sidebar: ['dashboard','morning','performance','schedule','live-scores','matchprep','opponentintel','practicelog','video','teamhub','physio-recovery','mental','draw-bracket','settings'], hiddenTabs: ['quickwins','dontmiss'], roundupChannels: ['coach','tournament','physio'], message: 'Performance and tactical view.' },
  physio: { label: 'Physio', icon: '⚕️', accent: '#EF4444', sidebar: ['dashboard','morning','physio-recovery','mental','settings'], hiddenTabs: ['quickwins','dontmiss','team'], roundupChannels: ['physio','coach'], message: 'Medical, load and recovery view.' },
  sponsor: { label: 'Sponsor / Partner', icon: '🤝', accent: '#F59E0B', sidebar: ['dashboard','sponsorship','media','settings'], hiddenTabs: ['quickwins','dailytasks','dontmiss','team'], roundupChannels: ['sponsor'], message: null },
}

function TennisSponsorDashboard({ session, player }: { session: SportsDemoSession; player: TennisPlayer }) {
  const [activeTab, setActiveTab] = useState<'overview'|'obligations'|'content'|'events'|'roi'>('overview')
  const sponsorName = session.clubName || 'Meridian Watches'
  const sponsorColor = '#D4AF37'
  const sponsorLogo = session.logoDataUrl

  const OBLIGATIONS = [
    { id:'o1', title:'Instagram post — Monte-Carlo kit', due:'Today', status:'pending', platform:'Instagram', reach:'120k' },
    { id:'o2', title:'Twitter match day mention', due:'Today', status:'pending', platform:'Twitter', reach:'87k' },
    { id:'o3', title:'Roland-Garros pre-tournament post', due:'24 May', status:'scheduled', platform:'Instagram', reach:'120k' },
    { id:'o4', title:'Wimbledon kit photoshoot', due:'20 Jun', status:'upcoming', platform:'Multi', reach:'250k' },
    { id:'o5', title:'US Open brand activation', due:'22 Aug', status:'upcoming', platform:'Multi', reach:'400k' },
    { id:'o6', title:'Year-end campaign content', due:'30 Nov', status:'upcoming', platform:'Multi', reach:'180k' },
  ]

  const CONTENT = [
    { title:'Monte-Carlo practice session', date:'8 Apr', type:'Photo', platform:'Instagram', likes:'4.2k', reach:'94k' },
    { title:'Madrid hotel check-in', date:'26 Apr', type:'Story', platform:'Instagram', likes:'2.1k', reach:'67k' },
    { title:'Pre-match warmup', date:'Today', type:'Video', platform:'TikTok', likes:'8.7k', reach:'220k' },
  ]

  const EVENTS = [
    { event:'Monte-Carlo Masters QF', date:'Today', venue:'Monte-Carlo CC', broadcast:'Continental Sport, Northbridge Sport', exposure:'Est. 2.4M viewers' },
    { event:'Madrid Open', date:'26 Apr', venue:'Caja Mágica', broadcast:'Continental Sport, Apex Tennis Network', exposure:'Est. 3.1M viewers' },
    { event:'Roland-Garros', date:'25 May', venue:'Stade Roland-Garros', broadcast:'Crown TV, Continental Sport', exposure:'Est. 8.2M viewers' },
    { event:'Wimbledon', date:'29 Jun', venue:'All England Club', broadcast:'Crown Broadcasting, Apex Sports Network', exposure:'Est. 14.5M viewers' },
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
              <div className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Official partner of {session.userName || player.name || 'Alex Rivera'} · ATP #{player.ranking ?? 67}</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {[{ label:'Obligations', value:'6 total', sub:'2 due today', color:'#EF4444' }, { label:'Est. reach', value:'14.2M', sub:'this season', color:sponsorColor }, { label:'Deal value', value:'£240k/yr', sub:'renewal 47d', color:'#22C55E' }, { label:'ATP ranking', value:`#${player.ranking ?? 67}`, sub:'current', color:'#0ea5e9' }].map((s,i) => (
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
      <div className="flex gap-0 border-b px-6" style={{ borderColor: '#1F2937', backgroundColor: '#0d1117', overflowX: 'hidden' }}>
        {([{ id:'overview' as const, label:'Overview', icon:'🏠' }, { id:'obligations' as const, label:'Obligations', icon:'📋' }, { id:'content' as const, label:'Content', icon:'📸' }, { id:'events' as const, label:'Events', icon:'🎾' }, { id:'roi' as const, label:'ROI & Reach', icon:'📊' }]).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap" style={{ borderBottomColor: activeTab === t.id ? sponsorColor : 'transparent', color: activeTab === t.id ? '#38bdf8' : '#6B7280', backgroundColor: activeTab === t.id ? `${sponsorColor}0d` : 'transparent' }}><span className="text-base">{t.icon}</span>{t.label}</button>
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
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-bold text-white">Brand visibility today</p><p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{session.userName || 'Alex Rivera'} is competing at Monte-Carlo Masters QF</p></div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[{ label:'Expected TV viewers', value:'2.4M', icon:'📺', color:sponsorColor }, { label:'Social following', value:'207k', icon:'📱', color:'#0ea5e9' }, { label:'Press accredited', value:'94', icon:'📰', color:'#8B5CF6' }].map((s,i) => (
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
                {[['Partner since','January 2023'],['Deal value','£240,000/yr'],['Renewal date','27 May 2026 (47d)'],['Obligations','6 posts / season'],['Events','3 appearances/yr']].map(([l,v]) => (
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
                  {o.status === 'pending' && <button className="text-xs px-3 py-1.5 rounded-lg font-bold text-white flex-shrink-0" style={{ backgroundColor: '#EF4444' }}>Chase player →</button>}
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
            <h2 className="text-xl font-black text-white">Tournament Calendar</h2>
            {EVENTS.map((e,i) => (
              <div key={i} className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">{i===0 && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: '#EF4444' }}>LIVE TODAY</span>}<span className="text-xs" style={{ color: '#6B7280' }}>{e.date}</span></div>
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
              {[{ label:'Total reach YTD', value:'14.2M', color:sponsorColor }, { label:'Media impressions', value:'3.8M', color:'#0ea5e9' }, { label:'Social engagements', value:'127k', color:'#22C55E' }, { label:'Press mentions', value:'43', color:'#8B5CF6' }].map((s,i) => (
                <div key={i} className="rounded-xl p-4 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div><div className="text-xs mt-1" style={{ color: '#6B7280' }}>{s.label}</div></div>
              ))}
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-sm font-bold text-white mb-4">Estimated brand value breakdown</p>
              {[{ label:'TV / broadcast exposure', value:'£180,000', pct:75, color:sponsorColor }, { label:'Social media reach', value:'£32,000', pct:13, color:'#0ea5e9' }, { label:'Press & editorial', value:'£18,000', pct:7, color:'#8B5CF6' }, { label:'On-court branding', value:'£12,000', pct:5, color:'#22C55E' }].map((r,i) => (
                <div key={i} className="mb-4"><div className="flex justify-between mb-1.5"><span className="text-xs" style={{ color: '#9CA3AF' }}>{r.label}</span><span className="text-xs font-bold" style={{ color: r.color }}>{r.value}</span></div><div className="w-full bg-gray-800 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width: `${r.pct}%`, backgroundColor: r.color }} /></div></div>
              ))}
              <div className="flex justify-between pt-3 mt-2" style={{ borderTop: '1px solid #1F2937' }}><span className="text-sm font-bold text-white">Total estimated value</span><span className="text-sm font-black" style={{ color: sponsorColor }}>£242,000</span></div>
            </div>
            <div className="rounded-xl p-5 text-center" style={{ background: `linear-gradient(135deg, ${sponsorColor}20, rgba(0,0,0,0.4))`, border: `1px solid ${sponsorColor}40` }}>
              <div className="text-2xl mb-2">🤝</div>
              <div className="text-base font-bold text-white mb-1">Renewal in 47 days</div>
              <div className="text-xs mb-4" style={{ color: '#6B7280' }}>Current deal expires 27 May 2026. ROI tracking positively.</div>
              <button className="px-8 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: sponsorColor }}>Start renewal discussion →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PRACTICE COURT BOOKING ────────────────────────────────────────────────────
function TennisPracticeCourt({ onClose, session }: { onClose: () => void; session: SportsDemoSession }) {
  const [date, setDate] = useState(''); const [time, setTime] = useState('09:00'); const [surface, setSurface] = useState('Clay'); const [duration, setDuration] = useState('90 min'); const [partner, setPartner] = useState(''); const [submitted, setSubmitted] = useState(false)
  const TIMES = ['07:00','08:00','09:00','10:00','11:00','14:00','15:00','16:00','17:00']
  const SURFACES = ['Clay','Hard','Grass','Indoor']
  const DURATIONS = ['60 min','90 min','2 hours']
  const submit = () => { const subject = encodeURIComponent(`Practice court request — ${date} ${time}`); const body = encodeURIComponent(`Dear Tournament Practice Court Coordinator,\n\nPlease reserve a practice court for the following:\n\nPlayer: ${session.userName || 'Alex Rivera'}\nDate: ${date}\nTime: ${time}\nSurface preference: ${surface}\nDuration: ${duration}\n${partner ? `Practice partner: ${partner}\n` : ''}\nPlease confirm availability.\n\nKind regards,\n${session.userName || 'Alex Rivera'}`); window.open(`mailto:courts@montecarlomasters.com?subject=${subject}&body=${body}`); setSubmitted(true) }
  return (
    <>
      <ModalHeader icon="🏟️" title="Book Practice Court" subtitle="Request a practice court at the tournament" onClose={onClose} />
      <div className="p-6 space-y-4">
        {!submitted ? (<>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Preferred time</label><select value={time} onChange={e => setTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}>{TIMES.map(t => <option key={t}>{t}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 mb-2 block">Surface</label><div className="flex flex-wrap gap-2">{SURFACES.map(s => (<button key={s} onClick={() => setSurface(s)} className="text-xs px-3 py-1.5 rounded-full transition-all" style={{ backgroundColor: surface === s ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)', border: surface === s ? '1px solid #22C55E' : '1px solid #1F2937', color: surface === s ? '#22C55E' : '#9CA3AF' }}>{s}</button>))}</div></div>
            <div><label className="text-xs text-gray-500 mb-2 block">Duration</label><div className="flex flex-wrap gap-2">{DURATIONS.map(d => (<button key={d} onClick={() => setDuration(d)} className="text-xs px-3 py-1.5 rounded-full transition-all" style={{ backgroundColor: duration === d ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)', border: duration === d ? '1px solid #22C55E' : '1px solid #1F2937', color: duration === d ? '#22C55E' : '#9CA3AF' }}>{d}</button>))}</div></div>
          </div>
          <div><label className="text-xs text-gray-500 mb-1 block">Practice partner (optional)</label><input value={partner} onChange={e => setPartner(e.target.value)} placeholder="e.g. Carlos Valdez, hitting partner..." className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <button onClick={submit} disabled={!date} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: date ? '#22C55E' : '#374151' }}>📧 Send court request →</button>
        </>) : (
          <div className="text-center py-8"><div className="text-5xl mb-3">✅</div><div className="text-base font-bold text-white mb-2">Request sent</div><div className="text-sm mb-4" style={{ color: '#6B7280' }}>Court request for {date} at {time} sent to tournament desk. They&apos;ll confirm within the hour.</div><button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#22C55E' }}>Done</button></div>
        )}
      </div>
    </>
  )
}

// ─── WARM-UP TIMER ─────────────────────────────────────────────────────────────
function TennisWarmupTimer({ onClose }: { onClose: () => void }) {
  const PROTOCOL = [
    { id:'w1', label:'Dynamic stretch',       duration:300, instruction:'Leg swings, hip circles, shoulder rotations — full body activation' },
    { id:'w2', label:'Shadow footwork',        duration:180, instruction:'Lateral splits, split steps, recovery movements — no ball' },
    { id:'w3', label:'Mini tennis',           duration:300, instruction:'Short court, soft hands, feel the ball — build rhythm' },
    { id:'w4', label:'Baseline rally',        duration:300, instruction:'Crosscourt only — forehand then backhand — build pace gradually' },
    { id:'w5', label:'Serve warm-up',         duration:240, instruction:'Start slow — first serves only. Build to 75% pace. Check ball toss.' },
    { id:'w6', label:'Return practice',       duration:180, instruction:'Both sides. Focus on split step timing and early takeback.' },
    { id:'w7', label:'Match intensity rally', duration:120, instruction:'Full pace — simulate match rallies. You are ready.' },
  ]
  const [currentStep, setCurrentStep] = useState(0); const [timeLeft, setTimeLeft] = useState(PROTOCOL[0].duration); const [running, setRunning] = useState(false); const [completed, setCompleted] = useState(false)
  useEffect(() => {
    if (!running) return
    if (timeLeft <= 0) { if (currentStep < PROTOCOL.length - 1) { setCurrentStep(prev => prev + 1); setTimeLeft(PROTOCOL[currentStep + 1].duration) } else { setRunning(false); setCompleted(true) }; return }
    const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000); return () => clearInterval(t)
  }, [running, timeLeft, currentStep])
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const totalDuration = PROTOCOL.reduce((a, p) => a + p.duration, 0)
  const elapsed = PROTOCOL.slice(0, currentStep).reduce((a, p) => a + p.duration, 0) + (PROTOCOL[currentStep].duration - timeLeft)
  const progress = (elapsed / totalDuration) * 100
  return (
    <>
      <ModalHeader icon="⏱️" title="Pre-Match Warm-up" subtitle={`${Math.round(totalDuration / 60)} min structured protocol`} onClose={onClose} />
      <div className="p-6">
        {!completed ? (<div className="space-y-4">
          <div className="w-full bg-gray-800 rounded-full h-1.5"><div className="h-1.5 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: '#F59E0B' }} /></div>
          <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#F59E0B' }}>Step {currentStep + 1} of {PROTOCOL.length}</div>
            <div className="text-xl font-black text-white mb-2">{PROTOCOL[currentStep].label}</div>
            <div className="text-5xl font-black mb-3" style={{ color: timeLeft <= 30 ? '#EF4444' : '#F59E0B' }}>{formatTime(timeLeft)}</div>
            <div className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{PROTOCOL[currentStep].instruction}</div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRunning(!running)} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: running ? '#374151' : '#F59E0B' }}>{running ? '⏸ Pause' : currentStep === 0 && timeLeft === PROTOCOL[0].duration ? '▶ Start warm-up' : '▶ Resume'}</button>
            {currentStep > 0 && <button onClick={() => { setCurrentStep(0); setTimeLeft(PROTOCOL[0].duration); setRunning(false) }} className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>↺ Reset</button>}
          </div>
          <div className="space-y-1.5">{PROTOCOL.map((step, i) => (<div key={step.id} className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: i === currentStep ? 'rgba(245,158,11,0.08)' : 'transparent', color: i < currentStep ? '#22C55E' : i === currentStep ? '#F9FAFB' : '#4B5563' }}><span className="w-5 flex-shrink-0 font-bold">{i < currentStep ? '✓' : i === currentStep ? '▶' : `${i + 1}`}</span><span className="flex-1">{step.label}</span><span style={{ color: '#6B7280' }}>{Math.round(step.duration / 60)}min</span></div>))}</div>
        </div>) : (
          <div className="text-center py-8"><div className="text-5xl mb-3">🎾</div><div className="text-xl font-black text-white mb-2">You&apos;re ready.</div><div className="text-sm mb-6" style={{ color: '#6B7280' }}>Full warm-up complete. Go out there and win.</div><button onClick={onClose} className="px-8 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#22C55E' }}>Let&apos;s go 🎾</button></div>
        )}
      </div>
    </>
  )
}

// ─── WILDCARD REQUEST ──────────────────────────────────────────────────────────
function TennisWildcardRequest({ onClose, session, player }: { onClose: () => void; session: SportsDemoSession; player: TennisPlayer }) {
  const [tournament, setTournament] = useState(''); const [director, setDirector] = useState(''); const [reason, setReason] = useState('ranking'); const [loading, setLoading] = useState(false); const [letter, setLetter] = useState<string | null>(null)
  const TOURNAMENTS = ['Hamburg Open 500','Eastbourne International','Stuttgart Open','Queen\'s Club Championships','Winston-Salem Open','Metz Open']
  const REASONS = [{ id:'ranking', label:'Current ranking' },{ id:'form', label:'Recent form / results' },{ id:'history', label:'Tournament history' },{ id:'crowd', label:'British/local player appeal' }]
  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/tennis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, messages: [{ role: 'user', content: `Write a professional wildcard request letter for ${session.userName || 'Alex Rivera'} (ATP #${player.ranking ?? 67}) to the tournament director of ${tournament}.\n\nReason for request: ${reason}\nPlayer nationality: British\nCurrent ranking: #${player.ranking ?? 67}\nCareer high: #${player.career_high ?? 44}\nRecent results: Monte-Carlo QF (this week), solid clay season\n\nWrite a concise, professional letter (150-200 words) that opens addressing the tournament director, clearly states the wildcard request, gives 2-3 compelling reasons woven into the prose, mentions British market appeal if relevant, and closes professionally.\n\nWrite ONLY the letter, no commentary.\n\nRespond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.` }] }) })
      const data = await res.json(); setLetter(cleanResponse(data.content?.[0]?.text || 'Unable to generate letter.'))
    } catch { setLetter('Unable to generate letter.') }
    setLoading(false)
  }
  const sendLetter = () => { if (!letter) return; const subject = encodeURIComponent(`Wildcard Request — ${session.userName || 'Alex Rivera'} — ${tournament}`); const body = encodeURIComponent(letter); window.open(`mailto:${director || 'director@tournament.com'}?subject=${subject}&body=${body}`) }
  return (
    <>
      <ModalHeader icon="🎯" title="Wildcard Request" subtitle="AI drafts a professional wildcard application letter" onClose={onClose} />
      <div className="p-6 space-y-4">
        {!letter ? (<>
          <div><label className="text-xs text-gray-500 mb-1 block">Tournament</label><select value={tournament} onChange={e => setTournament(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}><option value="">Select tournament...</option>{TOURNAMENTS.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Director email (optional)</label><input value={director} onChange={e => setDirector(e.target.value)} placeholder="director@tournament.com" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <div><label className="text-xs text-gray-500 mb-2 block">Key reason</label><div className="grid grid-cols-2 gap-2">{REASONS.map(r => (<button key={r.id} onClick={() => setReason(r.id)} className="text-xs px-3 py-2 rounded-xl transition-all text-left" style={{ backgroundColor: reason === r.id ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)', border: reason === r.id ? '1px solid #EF4444' : '1px solid #1F2937', color: reason === r.id ? '#EF4444' : '#9CA3AF' }}>{r.label}</button>))}</div></div>
          <button onClick={generate} disabled={!tournament || loading} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: tournament && !loading ? '#EF4444' : '#374151' }}>{loading ? '⏳ Drafting letter...' : '✍️ Generate Letter →'}</button>
        </>) : (<>
          <div className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB', maxHeight: 300, overflowY: 'auto' }}>{letter}</div>
          <div className="flex gap-3">
            <button onClick={() => setLetter(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Regenerate</button>
            <button onClick={() => navigator.clipboard.writeText(letter)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: '#374151', color: '#9CA3AF' }}>📋 Copy</button>
            <button onClick={sendLetter} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#EF4444' }}>📧 Send →</button>
          </div>
        </>)}
      </div>
    </>
  )
}

// ─── AGENT BRIEF ───────────────────────────────────────────────────────────────
function TennisAgentBrief({ onClose, session, player }: { onClose: () => void; session: SportsDemoSession; player: TennisPlayer }) {
  const [loading, setLoading] = useState(false); const [brief, setBrief] = useState<string | null>(null)
  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/tennis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 700, messages: [{ role: 'user', content: `Generate a weekly agent briefing for ${session.userName || 'Alex Rivera'} (ATP #${player.ranking ?? 67}).\n\nWrite a concise weekly brief covering ranking update (current position, points at risk, trajectory), this week (tournament result/status, prize money earned), upcoming (next 3 tournaments, entry status, travel confirmed), sponsor status (obligations due, any outstanding content), financial (prize money YTD, expenses flag if any), and action items (three things agent needs to action this week).\n\nTone: professional, direct, information-dense. Max 300 words.\nWrite ONLY the brief, addressed to "James" (agent name).\n\nRespond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.` }] }) })
      const data = await res.json(); setBrief(cleanResponse(data.content?.[0]?.text || 'Unable to generate brief.'))
    } catch { setBrief('Unable to generate brief.') }
    setLoading(false)
  }
  const sendToAgent = () => { if (!brief) return; const subject = encodeURIComponent(`Weekly Brief — ${session.userName || 'Alex'} — w/c ${new Date().toLocaleDateString('en-GB')}`); const body = encodeURIComponent(brief); window.open(`mailto:james.wright@agent.com?subject=${subject}&body=${body}`) }
  return (
    <>
      <ModalHeader icon="💼" title="Agent Weekly Brief" subtitle="AI generates your weekly brief to send to your agent" onClose={onClose} />
      <div className="p-6 space-y-4">
        {!brief && !loading && (<>
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="text-xs font-bold text-white mb-2">Brief will cover:</div>
            {['📊 Ranking update — points, trajectory, risks','🎾 This week\'s results + prize money','📅 Next 3 tournaments + entry status','🤝 Sponsor obligations outstanding','💰 Financial snapshot YTD','✅ 3 action items for your agent'].map((item, i) => (<div key={i} className="text-xs py-1" style={{ color: '#9CA3AF' }}>{item}</div>))}
          </div>
          <button onClick={generate} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#F59E0B' }}>⚡ Generate Weekly Brief →</button>
        </>)}
        {loading && (<div className="text-center py-10"><div className="text-4xl mb-3 animate-pulse">💼</div><div className="text-sm font-bold text-white">Generating brief...</div></div>)}
        {brief && (<>
          <div className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB', maxHeight: 350, overflowY: 'auto' }}>{brief}</div>
          <div className="flex gap-3">
            <button onClick={() => setBrief(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Regenerate</button>
            <button onClick={() => navigator.clipboard.writeText(brief)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: '#374151', color: '#9CA3AF' }}>📋 Copy</button>
            <button onClick={sendToAgent} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#F59E0B' }}>📧 Send to James →</button>
          </div>
        </>)}
      </div>
    </>
  )
}

function PlayerDirectoryView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const [dirTab, setDirTab] = useState<'rankings'|'partners'|'contacts'>('rankings')
  const [searchQuery, setSearchQuery] = useState('')
  const [tourFilter, setTourFilter] = useState('all')
  const [searchResults, setSearchResults] = useState<string | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [profileModal, setProfileModal] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [partnerResults, setPartnerResults] = useState<string | null>(null)
  const [partnerLoading, setPartnerLoading] = useState(false)
  const [contacts, setContacts] = useState<Array<{name:string;ranking:string;nationality:string;addedAt:string}>>(() => {
    try { return JSON.parse(localStorage.getItem('lumio_tennis_contacts') || '[]') } catch { return [] }
  })

  const searchPlayers = async () => {
    setSearchLoading(true)
    try {
      const res = await fetch('/api/ai/tennis', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: `Search for current ${tourFilter === 'wta' ? 'WTA' : tourFilter === 'atp' ? 'ATP' : 'ATP and WTA'} tennis player rankings. Query: "${searchQuery || 'top 20 current ranking'}". For each player return: name, current ranking number, nationality, age, plays hand, coach name, last 3 tournament results, best surface, career high ranking. Format each player on one line separated by pipes: NAME | RANKING | NATIONALITY | AGE | HAND | COACH | RECENT_RESULTS | BEST_SURFACE | CAREER_HIGH. Return up to 10 players. No other text.` }] })
      })
      const data = await res.json()
      console.log('[Player Directory] API response:', JSON.stringify(data).slice(0, 500))
      if (data.error || data.type === 'error') {
        const msg = typeof data.error === 'string' ? data.error : data.error?.message || data.message || JSON.stringify(data.error || data)
        setSearchResults(`⚠️ ${msg}`); setSearchLoading(false); return
      }
      const text = data.content?.filter((b:{type:string}) => b.type === 'text').map((b:{text:string}) => b.text).join('\n') || ''
      console.log('[Player Directory] Parsed text:', text.slice(0, 300))
      setSearchResults(cleanResponse(text) || '⚠️ No results. Try a different search.')
    } catch { setSearchResults('⚠️ Search failed. Check connection.') }
    setSearchLoading(false)
  }

  const searchProfile = async (name: string) => {
    setProfileModal(name); setProfileLoading(true); setProfileData(null)
    try {
      const res = await fetch('/api/ai/tennis', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: `Search for detailed profile of tennis player ${name}. Cover playing style, strengths and weaknesses, head-to-head vs top 10, serve and return stats, current coach and team, and social media presence. Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.` }] })
      })
      const data = await res.json()
      if (data.error) { setProfileData(`⚠️ ${typeof data.error === 'string' ? data.error : data.error?.message || JSON.stringify(data.error)}`); setProfileLoading(false); return }
      setProfileData(cleanResponse(data.content?.filter((b:{type:string}) => b.type === 'text').map((b:{text:string}) => b.text).join('\n') || '') || '⚠️ No profile data found.')
    } catch { setProfileData('⚠️ Unable to load profile.') }
    setProfileLoading(false)
  }

  const searchPartners = async () => {
    setPartnerLoading(true)
    try {
      const res = await fetch('/api/ai/tennis', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: `Search for professional tennis hitting partners available for hire. The player is ranked ATP #${player.ranking ?? 67}, based in Europe. Find 4-5 hitting partners who are former professionals or high-level players available for practice sessions. For each, write a paragraph covering name, background, speciality, approximate day rate, and how to contact. Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.` }] })
      })
      const data = await res.json()
      if (data.error) { setPartnerResults(`⚠️ ${typeof data.error === 'string' ? data.error : data.error?.message || JSON.stringify(data.error)}`); setPartnerLoading(false); return }
      setPartnerResults(cleanResponse(data.content?.filter((b:{type:string}) => b.type === 'text').map((b:{text:string}) => b.text).join('\n') || '') || '⚠️ No results found.')
    } catch { setPartnerResults('⚠️ Search failed.') }
    setPartnerLoading(false)
  }

  const addContact = (name: string, ranking: string, nationality: string) => {
    const updated = [...contacts, { name, ranking, nationality, addedAt: new Date().toISOString() }]
    setContacts(updated)
    localStorage.setItem('lumio_tennis_contacts', JSON.stringify(updated))
  }

  const removeContact = (name: string) => {
    const updated = contacts.filter(c => c.name !== name)
    setContacts(updated)
    localStorage.setItem('lumio_tennis_contacts', JSON.stringify(updated))
  }

  // Parse pipe-separated results into cards
  const parseResults = (text: string) => {
    return text.split('\n').filter(l => l.includes('|')).map(line => {
      const parts = line.split('|').map(p => p.trim())
      return { name: parts[0]||'', ranking: parts[1]||'', nationality: parts[2]||'', age: parts[3]||'', hand: parts[4]||'', coach: parts[5]||'', results: parts[6]||'', surface: parts[7]||'', careerHigh: parts[8]||'' }
    })
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: '#1F2937' }}>
        {([{ id:'rankings' as const, label:'🏆 ATP/WTA Rankings' },{ id:'partners' as const, label:'🎾 Hitting Partners' },{ id:'contacts' as const, label:'📋 My Contacts' }]).map(t => (
          <button key={t.id} onClick={() => setDirTab(t.id)} className="px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap"
            style={{ borderBottomColor: dirTab === t.id ? '#7C3AED' : 'transparent', color: dirTab === t.id ? '#7C3AED' : '#6B7280', backgroundColor: dirTab === t.id ? 'rgba(124,58,237,0.05)' : 'transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* RANKINGS TAB */}
      {dirTab === 'rankings' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchPlayers()}
              placeholder="Search player name, nationality, ranking..."
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} />
            <button onClick={searchPlayers} disabled={searchLoading} className="px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#7C3AED' }}>
              {searchLoading ? '🔍 Searching...' : '🔍 Search'}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all','atp','wta','challenger'].map(f => (
              <button key={f} onClick={() => setTourFilter(f)} className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: tourFilter === f ? '#7C3AED' : 'rgba(255,255,255,0.05)', color: tourFilter === f ? '#fff' : '#6B7280' }}>
                {f === 'all' ? 'All Tours' : f.toUpperCase()}
              </button>
            ))}
          </div>
          {searchLoading && <div className="text-center py-8"><div className="text-3xl mb-2 animate-bounce">🔍</div><div className="text-sm text-white">Searching live rankings...</div></div>}
          {searchResults && !searchLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {parseResults(searchResults).map((p, i) => (
                <div key={i} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: '#a855f720', color: '#a855f7' }}>
                      {p.name.split(' ').map(w => w[0]).join('').slice(0,2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{p.name}</div>
                      <div className="text-xs" style={{ color: '#6B7280' }}>{p.nationality} · {p.age} · {p.hand}</div>
                    </div>
                    {p.ranking && <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: '#a855f718', border: '1px solid #a855f740', color: '#a855f7' }}>#{p.ranking}</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div><div className="text-[10px]" style={{ color: '#6B7280' }}>SURFACE</div><div className="text-xs font-semibold text-white">{p.surface || '—'}</div></div>
                    <div><div className="text-[10px]" style={{ color: '#6B7280' }}>CAREER HIGH</div><div className="text-xs font-semibold text-white">#{p.careerHigh || '—'}</div></div>
                    <div><div className="text-[10px]" style={{ color: '#6B7280' }}>COACH</div><div className="text-xs font-semibold text-white truncate">{p.coach || '—'}</div></div>
                  </div>
                  {p.results && <div className="text-xs mt-2" style={{ color: '#6B7280' }}>{p.results}</div>}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => searchProfile(p.name)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ background: '#a855f718', border: '1px solid #a855f740', color: '#a855f7' }}>👁️ Full Profile</button>
                    <button onClick={() => addContact(p.name, p.ranking, p.nationality)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ background: '#3b82f618', border: '1px solid #3b82f640', color: '#3b82f6' }}>➕ Add to Contacts</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!searchResults && !searchLoading && <div className="text-center py-12"><div className="text-4xl mb-3">🏆</div><div className="text-sm text-white mb-1">Search ATP/WTA Rankings</div><div className="text-xs" style={{ color: '#6B7280' }}>Powered by Lumio AI — searches live ranking data from public sources</div></div>}
        </div>
      )}

      {/* HITTING PARTNERS TAB */}
      {dirTab === 'partners' && (
        <div className="space-y-4">
          {!partnerResults && !partnerLoading && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🎾</div>
              <div className="text-sm text-white mb-4">Find hitting partners and sparring pros near you</div>
              <button onClick={searchPartners} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#7C3AED' }}>🔍 Find Hitting Partners Near Me</button>
            </div>
          )}
          {partnerLoading && <div className="text-center py-8"><div className="text-3xl mb-2 animate-bounce">🎾</div><div className="text-sm text-white">Searching for partners...</div></div>}
          {partnerResults && !partnerLoading && (
            <div className="rounded-xl p-5 text-sm leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB' }}>{partnerResults}</div>
          )}
        </div>
      )}

      {/* MY CONTACTS TAB */}
      {dirTab === 'contacts' && (
        <div className="space-y-4">
          {contacts.length === 0 ? (
            <div className="text-center py-12"><div className="text-4xl mb-3">📋</div><div className="text-sm text-white">No contacts saved yet</div><div className="text-xs" style={{ color: '#6B7280' }}>Search players and click "Add to Contacts"</div></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {contacts.map((c, i) => (
                <div key={i} className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#a855f720', color: '#a855f7' }}>{c.name.split(' ').map(w => w[0]).join('').slice(0,2)}</div>
                  <div className="flex-1"><div className="text-sm font-bold text-white">{c.name}</div><div className="text-xs" style={{ color: '#6B7280' }}>{c.nationality} · #{c.ranking}</div></div>
                  <button onClick={() => removeContact(c.name)} className="text-xs px-2 py-1 rounded" style={{ color: '#EF4444' }}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile modal */}
      {profileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={e => { if (e.target === e.currentTarget) setProfileModal(null) }}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl p-6" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-white">{profileModal}</div>
              <button onClick={() => setProfileModal(null)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            {profileLoading && <div className="text-sm" style={{ color: '#7C3AED' }}>🔍 Searching for detailed profile...</div>}
            {profileData && <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#D1D5DB' }}>{profileData}</div>}
          </div>
        </div>
      )}

      <TennisAISection context="default" player={player} session={session} />
    </div>
  )
}

function CoachFinderView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const [step, setStep] = useState<'goals'|'prefs'|'search'|'results'>('goals')
  const [goals, setGoals] = useState<string[]>([])
  const [freeText, setFreeText] = useState('')
  const [experience, setExperience] = useState('')
  const [location, setLocation] = useState('')
  const [budget, setBudget] = useState('')
  const [style, setStyle] = useState('')
  const [results, setResults] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [shortlist, setShortlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('lumio_tennis_coach_shortlist') || '[]') } catch { return [] }
  })
  const [deepSearch, setDeepSearch] = useState<{name:string;data:string|null;loading:boolean}|null>(null)

  const GOALS = ['🎯 Serve technique','↩️ Return of serve','🧠 Mental game','🏃 Movement & fitness','⚡ Net game/volleys','📊 Tactical awareness','🎾 Backhand','🤜 Forehand','🏆 Tournament preparation','💰 Career management','🌍 Tour scheduling','📱 Media & brand']
  const toggleGoal = (g: string) => setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])

  const search = async () => {
    setStep('search'); setLoading(true)
    try {
      const res = await fetch('/api/ai/tennis', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: `You are a tennis career consultant. Help find the right coach. Player: ATP #${player.ranking ?? 67}. Goals: ${goals.join(', ')}. Specific issues: ${freeText || 'general improvement'}. Preferences: experience ${experience || 'any'}, location ${location || 'flexible'}, budget ${budget || 'flexible'}, style ${style || 'any'}. Search and recommend 4 tennis coaches. Write each as a paragraph covering full name, background, coaching philosophy, notable players coached, availability, fee range, and why they match. Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.` }] })
      })
      const data = await res.json()
      if (data.error) { setResults(`⚠️ ${typeof data.error === 'string' ? data.error : data.error?.message || JSON.stringify(data.error)}`); setLoading(false); return }
      setResults(cleanResponse(data.content?.filter((b:{type:string}) => b.type === 'text').map((b:{text:string}) => b.text).join('\n') || '') || '⚠️ No coaches found. Try adjusting preferences.')
    } catch { setResults('Unable to search. Check connection.') }
    setLoading(false); setStep('results')
  }

  const researchCoach = async (name: string) => {
    setDeepSearch({ name, data: null, loading: true })
    try {
      const res = await fetch('/api/ai/tennis', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: `Search for detailed information about tennis coach ${name}. Cover their full coaching history, playing career, philosophy, current availability, fee structure, and contact methods. Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.` }] })
      })
      const data = await res.json()
      setDeepSearch({ name, data: cleanResponse(data.content?.filter((b:{type:string}) => b.type === 'text').map((b:{text:string}) => b.text).join('\n') || ''), loading: false })
    } catch { setDeepSearch({ name, data: 'Unable to search.', loading: false }) }
  }

  const saveToShortlist = (name: string) => {
    const updated = [...shortlist, name]
    setShortlist(updated)
    localStorage.setItem('lumio_tennis_coach_shortlist', JSON.stringify(updated))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-1"><span className="text-2xl">🎓</span><div><div className="text-lg font-bold text-white">Coach Finder</div><div className="text-xs" style={{ color: '#6B7280' }}>AI-powered coach matching based on your goals and preferences</div></div></div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {['Goals','Preferences','Search','Shortlist'].map((s, i) => {
          const idx = ['goals','prefs','search','results'].indexOf(step)
          return (<React.Fragment key={s}><div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: i < idx ? '#22C55E' : i === idx ? '#7C3AED' : '#1F2937', color: i <= idx ? '#fff' : '#4B5563' }}>{i < idx ? '✓' : i+1}</div><span className="text-xs font-semibold" style={{ color: i === idx ? '#7C3AED' : i < idx ? '#22C55E' : '#4B5563' }}>{s}</span></div>{i < 3 && <div className="flex-1 h-px" style={{ backgroundColor: i < idx ? '#22C55E' : '#1F2937' }} />}</React.Fragment>)
        })}
      </div>

      {/* STEP 1: Goals */}
      {step === 'goals' && (
        <div className="space-y-4">
          <div className="text-sm font-bold text-white">What do you want to work on?</div>
          <div className="flex flex-wrap gap-2">
            {GOALS.map(g => (<button key={g} onClick={() => toggleGoal(g)} className="px-3 py-2 rounded-xl text-xs font-semibold transition-all" style={{ backgroundColor: goals.includes(g) ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)', border: goals.includes(g) ? '1px solid #7C3AED' : '1px solid #1F2937', color: goals.includes(g) ? '#a855f7' : '#9CA3AF' }}>{g}</button>))}
          </div>
          <div><label className="text-xs text-gray-500 mb-1 block">Anything specific?</label><textarea value={freeText} onChange={e => setFreeText(e.target.value)} rows={3} placeholder="e.g. I drop my shoulder on the backhand, I struggle in tiebreaks..." className="w-full px-4 py-2.5 rounded-xl text-sm text-white resize-none" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <button onClick={() => setStep('prefs')} disabled={goals.length === 0} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: goals.length > 0 ? '#7C3AED' : '#374151' }}>Next — Preferences →</button>
        </div>
      )}

      {/* STEP 2: Preferences */}
      {step === 'prefs' && (
        <div className="space-y-4">
          {[
            { label: 'Experience level', options: ['🏆 Former ATP Top 10','🎾 Former ATP Top 100','🎓 Elite Academy','📋 Certified Pro'], state: experience, set: setExperience },
            { label: 'Location', options: ['📍 Near me','🌍 Travel/tour','💻 Remote/online','🏠 Residential camp'], state: location, set: setLocation },
            { label: 'Budget (per week)', options: ['£500-1k','£1k-2.5k','£2.5k-5k','£5k+'], state: budget, set: setBudget },
            { label: 'Working style', options: ['🔥 Intense','🤝 Collaborative','📊 Data-driven','🧘 Holistic'], state: style, set: setStyle },
          ].map(section => (
            <div key={section.label}>
              <div className="text-xs font-bold mb-2" style={{ color: '#6B7280' }}>{section.label}</div>
              <div className="flex flex-wrap gap-2">{section.options.map(o => (<button key={o} onClick={() => section.set(o)} className="px-3 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: section.state === o ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)', border: section.state === o ? '1px solid #7C3AED' : '1px solid #1F2937', color: section.state === o ? '#a855f7' : '#9CA3AF' }}>{o}</button>))}</div>
            </div>
          ))}
          <div className="flex gap-3">
            <button onClick={() => setStep('goals')} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Back</button>
            <button onClick={search} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#7C3AED' }}>🔍 Find Coaches →</button>
          </div>
        </div>
      )}

      {/* STEP 3: Searching */}
      {step === 'search' && loading && (
        <div className="text-center py-12"><div className="text-4xl mb-3 animate-bounce">🎓</div><div className="text-sm font-bold text-white mb-2">Searching for coaches...</div><div className="text-xs" style={{ color: '#6B7280' }}>Analysing your goals and preferences</div></div>
      )}

      {/* STEP 4: Results */}
      {step === 'results' && results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-white">Recommended Coaches</div>
            {shortlist.length > 0 && <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#22C55E18', color: '#22C55E' }}>💾 {shortlist.length} shortlisted</span>}
          </div>
          <div className="rounded-xl p-5 text-sm leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', borderLeft: '4px solid #7C3AED', border: '1px solid #1F2937', color: '#D1D5DB' }}>{results}</div>
          <div className="flex gap-3">
            <button onClick={() => setStep('goals')} className="py-2.5 px-4 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Start over</button>
            <button onClick={search} className="py-2.5 px-4 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>🔄 Search again</button>
          </div>
        </div>
      )}

      {/* Deep search modal */}
      {deepSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={e => { if (e.target === e.currentTarget) setDeepSearch(null) }}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl p-6" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between mb-4"><div className="text-lg font-bold text-white">{deepSearch.name}</div><button onClick={() => setDeepSearch(null)} className="text-gray-500 hover:text-white">✕</button></div>
            {deepSearch.loading && <div className="text-sm" style={{ color: '#7C3AED' }}>🔍 Researching...</div>}
            {deepSearch.data && <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#D1D5DB' }}>{deepSearch.data}</div>}
          </div>
        </div>
      )}

      <TennisAISection context="default" player={player} session={session} />
    </div>
  )
}

export function TennisPortalInner({ session, onSignOut }: { session: SportsDemoSession; onSignOut?: () => void }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const sidebarLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sidebarExpanded = sidebarPinned || sidebarHovered;
  const sidebarRef = useRef<HTMLElement | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(72);
  // Profile sync — keeps the bottom RoleSwitcher avatar/name in step with Settings edits
  const liveProfileName = useTennisProfileName();
  const liveProfilePhoto = useTennisProfilePhoto();
  const liveBrandName = useTennisBrandName();
  const liveBrandLogo = useTennisBrandLogo();
  const liveSession = { ...session, userName: liveProfileName || session.userName, photoDataUrl: liveProfilePhoto || session.photoDataUrl };

  useEffect(() => {
    setSidebarPinned(typeof window !== 'undefined' && localStorage.getItem('lumio_tennis_sidebar_pinned') === 'true')
  }, [])

  useEffect(() => {
    if (!sidebarRef.current || typeof ResizeObserver === 'undefined') return;
    const el = sidebarRef.current;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setSidebarWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [])

  function toggleSidebarPin() {
    setSidebarPinned(p => { const next = !p; localStorage.setItem('lumio_tennis_sidebar_pinned', String(next)); return next })
  }
  function handleSidebarEnter() { if (sidebarLeaveTimer.current) { clearTimeout(sidebarLeaveTimer.current); sidebarLeaveTimer.current = null }; setSidebarHovered(true) }
  function handleSidebarLeave() { sidebarLeaveTimer.current = setTimeout(() => setSidebarHovered(false), 400) }

  const [activeModal, setActiveModal] = useState<string | null>(null)
  const closeModal = () => setActiveModal(null)

  const [hiddenItems, setHiddenItems] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try { const saved = localStorage.getItem('lumio_tennis_hidden_items'); return saved ? JSON.parse(saved) : [] } catch { return [] }
  })
  useEffect(() => {
    const handler = (e: Event) => { const ce = e as CustomEvent; if (ce.detail?.storagePrefix === 'lumio_tennis_') setHiddenItems(ce.detail.hiddenItems) }
    window.addEventListener('lumio-visibility-changed', handler)
    return () => window.removeEventListener('lumio-visibility-changed', handler)
  }, [])
  const isHidden = (key: string) => hiddenItems.includes(key)

  const player = DEMO_PLAYER;
  const [liveScores, setLiveScores] = useState<any[]>([]);
  const [h2hData, setH2hData] = useState<any[]>([]);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [sponsorToast, setSponsorToast] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [roleOverride, setRoleOverride] = useState(session.role || 'player');
  const activeRole = roleOverride;
  const currentRole = (roleOverride || 'player') as keyof typeof TENNIS_ROLE_CONFIG
  const roleConfig = TENNIS_ROLE_CONFIG[currentRole] ?? TENNIS_ROLE_CONFIG.player
  const isPlayer = currentRole === 'player'
  const isSponsor = currentRole === 'sponsor'

  const visibleSidebarItems = roleConfig.sidebar === 'all'
    ? SIDEBAR_ITEMS
    : SIDEBAR_ITEMS.filter(item => (roleConfig.sidebar as string[]).includes(item.id))

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 9) {
      const obligations = [
        'Meridian Watches content post due today — Carlos needs kit photo before 12:00',
        'Halden Motors post-match content — story required within 6 hours of match end',
      ];
      setSponsorToast(obligations[0]);
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'livescores') {
      tennisAPI('get_livescore').then(d => { if (d) setLiveScores(d); });
    }
    if (activeSection === 'scout') {
      const today = new Date().toISOString().split('T')[0];
      const next = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      tennisAPI('get_fixtures', { date_start: today, date_stop: next }).then(d => { if (d) setFixtures(d); });
    }
  }, [activeSection]);

  const groups = ['OVERVIEW', 'PERFORMANCE', 'MATCH', 'TEAM', 'COMMERCIAL', 'TOOLS'];

  // Quick Wins dismissed state
  const [dismissedWins, setDismissedWins] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem('tennis_dismissed_wins'); return s ? new Set(JSON.parse(s)) : new Set() } catch { return new Set() }
  })
  const dismissWin = (id: string) => {
    setDismissedWins(prev => { const next = new Set(prev); next.add(id); try { localStorage.setItem('tennis_dismissed_wins', JSON.stringify([...next])) } catch {} return next })
  }

  // Daily Tasks state
  const [tasks, setTasks] = useState<TennisTask[]>(() => TENNIS_TASKS)
  const [taskChecked, setTaskChecked] = useState<Record<string, boolean>>(() => {
    try { const s = localStorage.getItem('tennis_tasks_checked'); return s ? JSON.parse(s) : {} } catch { return {} }
  })
  const [newTaskText, setNewTaskText] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)
  const toggleTask = (id: string) => {
    setTaskChecked(prev => { const next = { ...prev, [id]: !prev[id] }; try { localStorage.setItem('tennis_tasks_checked', JSON.stringify(next)) } catch {} return next })
  }
  const addTask = () => {
    if (!newTaskText.trim()) return
    setTasks(prev => [{ id: `manual-${Date.now()}`, title: newTaskText.trim(), due: 'Today', priority: 'medium' as const, category: 'Manual', source: 'manual' as const, done: false, overdue: false }, ...prev])
    setNewTaskText(''); setShowAddTask(false)
  }

  // Don't Miss dismissed state
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem('tennis_dismissed_alerts'); return s ? new Set(JSON.parse(s)) : new Set() } catch { return new Set() }
  })
  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => { const next = new Set(prev); next.add(id); try { localStorage.setItem('tennis_dismissed_alerts', JSON.stringify([...next])) } catch {} return next })
  }

  // Team sub-tab
  const [teamSubTab, setTeamSubTab] = useState<'today'|'org'|'info'|'club'>('today')

// ─── MATCH REPORTS VIEW ───────────────────────────────────────────────────────
function MatchReportsView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<Record<string, string>>({});
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [debrief, setDebrief] = useState<{headline: string; serve_analysis: string; return_analysis: string; gps_fatigue: string; pattern_insight: string; next_week: string} | null>(null);
  const [selectedMatch, setSelectedMatch] = useState('Monte-Carlo R2 vs Caballero');

  const generateDebrief = async () => {
    setDebriefLoading(true);
    try {
      const res = await fetch('/api/ai/tennis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 700,
          messages: [{ role: 'user', content: `Post-match debrief for Alex Rivera (ATP #67, clay specialist, right-handed, two-handed backhand). Match: ${selectedMatch}. GPS: 11.2km / 142min / ACWR 1.17. Serve: 62% 1st serve, 6 aces, 3 DFs. Court heatmap shows heavy baseline positioning (65%), limited net approaches. Analyse the match from data perspective. Respond ONLY in JSON: {"headline":"one sentence performance summary","serve_analysis":"2 sentences","return_analysis":"2 sentences","gps_fatigue":"1 sentence on what GPS load tells us about performance in 3rd set","pattern_insight":"1 sentence on tactical pattern from court positioning data","next_week":"1 sentence on what to prioritise in practice"}` }]
        })
      });
      const data = await res.json();
      setDebrief(JSON.parse(data.content[0].text));
    } catch { console.error('Debrief failed'); }
    finally { setDebriefLoading(false); }
  };

  const generateMatchPDF = () => {
    if (!debrief) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Match Report — ${selectedMatch}</title><style>body{font-family:Georgia,serif;max-width:720px;margin:32px auto;font-size:12px;color:#1a1a2e;line-height:1.7}h1{font-size:20px;border-bottom:3px solid #8B5CF6;padding-bottom:6px}h2{font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#666;border-bottom:1px solid #eee;padding-bottom:3px;margin:16px 0 8px}.section{background:#f9f9ff;border-left:3px solid #8B5CF6;padding:10px 14px;margin-bottom:10px;border-radius:0 4px 4px 0}footer{margin-top:24px;font-size:9px;color:#aaa;border-top:1px solid #eee;padding-top:8px}@media print{body{margin:16px}}</style></head><body><h1>Match Report — ${selectedMatch}</h1><p style="color:#666;font-size:11px">Alex Rivera · ATP #${DEMO_PLAYER.ranking} · ${new Date().toLocaleDateString('en-GB')} · CONFIDENTIAL — Team Only</p><div style="font-weight:700;font-size:14px;color:#8B5CF6;margin-bottom:16px">${debrief.headline}</div><h2>Serve Analysis</h2><div class="section">${debrief.serve_analysis}</div><h2>Return Analysis</h2><div class="section">${debrief.return_analysis}</div><h2>GPS &amp; Fatigue</h2><div class="section">${debrief.gps_fatigue}</div><h2>Pattern Insight</h2><div class="section">${debrief.pattern_insight}</div><h2>Next Week Focus</h2><div class="section">${debrief.next_week}</div><footer>Generated by Lumio Tour · lumiosports.com · ${new Date().toLocaleDateString('en-GB')}</footer></body></html>`);
    w.document.close();
    setTimeout(()=>w.print(),400);
  };

  const matches = [
    { id: 'm1', opponent: 'C. Valdez', oppRank: 3, tournament: 'Madrid Open', round: 'Quarter-Final', score: '4-6 6-3 7-6', surface: 'Clay', result: 'W', date: '14 Apr 2025' },
    { id: 'm2', opponent: 'T. Paul', oppRank: 32, tournament: 'Madrid Open', round: 'Round of 16', score: '6-4 6-2', surface: 'Clay', result: 'W', date: '11 Apr 2025' },
    { id: 'm3', opponent: 'F. Caballero', oppRank: 29, tournament: 'Madrid Open', round: 'Round of 32', score: '7-5 6-4', surface: 'Clay', result: 'W', date: '9 Apr 2025' },
    { id: 'm4', opponent: 'L. Brenner', oppRank: 1, tournament: 'Monte Carlo', round: 'Semi-Final', score: '3-6 4-6', surface: 'Clay', result: 'L', date: '5 Apr 2025' },
    { id: 'm5', opponent: 'B. Sutton', oppRank: 14, tournament: 'Monte Carlo', round: 'Quarter-Final', score: '6-3 7-5', surface: 'Clay', result: 'W', date: '3 Apr 2025' },
    { id: 'm6', opponent: 'C. Hadley', oppRank: 45, tournament: 'Barcelona Open', round: 'Round of 32', score: '6-7 4-6', surface: 'Clay', result: 'L', date: '22 Mar 2025' },
  ];

  const handleGenerateReport = async (match: typeof matches[0]) => {
    setGeneratingReport(match.id);
    try {
      const res = await fetch('/api/ai/tennis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Write a post-match analysis report for Alex Rivera (ATP #67) who ${match.result === 'W' ? 'won' : 'lost'} against ${match.opponent} (ranked ${match.oppRank}) at the ${match.tournament} ${match.round}, score ${match.score} on ${match.surface}. Cover a brief match summary, three key tactical moments, what worked well, areas to improve, and a one-sentence look ahead. Write in a professional coach/analyst voice. Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.`
          }]
        }),
      });
      const data = await res.json();
      const text = cleanResponse(data.content?.[0]?.text ?? 'No response');
      setReportContent(prev => ({ ...prev, [match.id]: text }));
      setActiveReport(match.id);
    } catch {
      setReportContent(prev => ({ ...prev, [match.id]: 'Error generating report. Please try again.' }));
      setActiveReport(match.id);
    }
    setGeneratingReport(null);
  };

  return (
    <div className="space-y-6">

      <SectionHeader icon="📄" title="Match Reports & AI Summaries" subtitle="Post-match analysis, AI-generated reports, and team sharing." />

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5 mb-6">
        <div className="text-sm font-semibold text-white mb-4">🤖 AI Post-Match Debrief Generator</div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Match</div>
            <select value={selectedMatch} onChange={e=>setSelectedMatch(e.target.value)}
              className="w-full bg-[#0a0c14] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white">
              {['Monte-Carlo R2 vs Caballero','Monte-Carlo R1 vs Qualifier','Barcelona R2 vs Alvarez Romero'].map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Result</div>
            <input defaultValue="Won 6-4 4-6 7-5" className="w-full bg-[#0a0c14] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white"/>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Serve stats (1st% / aces / DFs)</div>
            <input defaultValue="62% / 6 aces / 3 double faults" className="w-full bg-[#0a0c14] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white"/>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">GPS summary</div>
            <input defaultValue="11.2km / 142min / ACWR 1.17" className="w-full bg-[#0a0c14] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white"/>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={generateDebrief} disabled={debriefLoading}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
            {debriefLoading ? 'Generating...' : '🤖 Generate Debrief'}
          </button>
          {debrief && <button onClick={generateMatchPDF} className="px-4 bg-[#0a0c14] border border-gray-700 text-gray-300 hover:text-white text-xs py-2 rounded-lg transition-colors">📄 PDF</button>}
        </div>
        {debrief && (
          <div className="mt-4 space-y-3 border-t border-gray-800 pt-4">
            <div className="text-sm font-semibold text-purple-400">{debrief.headline}</div>
            {[{l:'Serve Analysis',v:debrief.serve_analysis},{l:'Return Analysis',v:debrief.return_analysis},{l:'GPS & Fatigue',v:debrief.gps_fatigue},{l:'Pattern Insight',v:debrief.pattern_insight},{l:'Next Week Focus',v:debrief.next_week}].map(item=>(
              <div key={item.l} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{item.l}</div>
                <div className="text-xs text-gray-300 leading-relaxed">{item.v}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Recent Matches" value={String(matches.length)} sub="Last 4 weeks" color="purple" />
        <StatCard label="Win Rate" value={`${Math.round((matches.filter(m => m.result === 'W').length / matches.length) * 100)}%`} sub={`${matches.filter(m => m.result === 'W').length}W / ${matches.filter(m => m.result === 'L').length}L`} color="teal" />
        <StatCard label="Reports Generated" value={String(Object.keys(reportContent).length)} sub="AI summaries" color="blue" />
        <StatCard label="Clay Season" value="Active" sub="Spring clay swing" color="orange" />
      </div>

      <div className="space-y-3">
        {matches.map(match => (
          <div key={match.id}>
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${match.result === 'W' ? 'bg-teal-600/20 text-teal-400' : 'bg-red-600/20 text-red-400'}`}>
                    {match.result}
                  </div>
                  <div>
                    <div className="text-sm text-white font-medium">
                      vs {match.opponent} <span className="text-gray-500 text-xs">#{match.oppRank}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {match.tournament} — {match.round}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-300 font-medium">{match.score}</span>
                      <SurfaceBadge surface={match.surface} />
                      <span className="text-xs text-gray-600">{match.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {reportContent[match.id] && (
                    <button
                      onClick={() => setActiveReport(activeReport === match.id ? null : match.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-600/20 text-teal-400 border border-teal-600/30 hover:bg-teal-600/30 transition-colors"
                    >
                      {activeReport === match.id ? 'Hide report' : 'View report'}
                    </button>
                  )}
                  <button
                    onClick={() => handleGenerateReport(match)}
                    disabled={generatingReport === match.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30 hover:bg-purple-600/30 transition-colors disabled:opacity-50"
                  >
                    {generatingReport === match.id ? 'Generating...' : reportContent[match.id] ? 'Regenerate' : 'Generate AI summary'}
                  </button>
                </div>
              </div>
            </div>

            {generatingReport === match.id && (
              <div className="mt-2 bg-purple-600/5 border border-purple-600/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs text-purple-400" style={{ animation: 'pulse 2s ease-in-out infinite' }}>
                  <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  Generating match analysis...
                </div>
              </div>
            )}

            {activeReport === match.id && reportContent[match.id] && !generatingReport && (
              <div className="mt-2 bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-white">AI Match Analysis</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">Generated by Claude</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(reportContent[match.id])}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => alert('Sent to coach & physio ✓')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-600/20 text-teal-400 border border-teal-600/30 hover:bg-teal-600/30 transition-colors"
                    >
                      Share with team
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{reportContent[match.id]}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <TennisAISection context="matchreports" player={player} session={session} />
    </div>
  );
}

// ─── DATA HUB VIEW ��───────────────────────────────────────────────────────────
function DataHubView({ player, session }: { player: TennisPlayer; session: SportsDemoSession }) {
  const [showComStatConfirm, setShowComStatConfirm] = useState(false);

  const hasApiKey = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_TENNIS_API_KEY;

  const dataSources = [
    { section: 'Live Scores', source: 'API-Tennis (live)' },
    { section: 'Rankings & Race', source: 'API-Tennis + Lumio' },
    { section: 'Opponent Scout', source: 'API-Tennis' },
    { section: 'Surface Analysis', source: 'API-Tennis + Lumio' },
    { section: 'Shot Heatmaps', source: 'Lumio analytics engine' },
    { section: 'Performance Rating', source: 'Lumio analytics engine' },
    { section: 'Video Library', source: 'SwingVision + manual upload' },
    { section: 'Match Reports', source: 'Claude AI (Anthropic)' },
  ];

  return (
    <div className="space-y-6">

      <SectionHeader icon="🗄️" title="Data & Analytics Hub" subtitle="Your connected analytics ecosystem — Lumio pulls from these sources to power your portal." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ATP Tennis IQ */}
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm text-white font-semibold">ATP Tennis IQ</div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-600/20 text-green-400 border border-green-600/30">Free for ATP members</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">External — visit to access</span>
          <div className="text-xs text-gray-400 mt-3 mb-3">Official ATP analytics platform. Shot quality AI, live in-match data, wearables insights. Built with TennisViz.</div>
          <div className="flex flex-wrap gap-1 mb-3">
            {['Shot Quality AI', 'In Attack Score', 'Live Coaching', 'Wearables'].map(tag => (
              <span key={tag} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{tag}</span>
            ))}
          </div>
          <button
            onClick={() => window.open('https://www.atptour.com', '_blank')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30 hover:bg-purple-600/30 transition-colors"
          >
            Open ATP Tennis IQ →
          </button>
        </div>

        {/* TennisRatio */}
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm text-white font-semibold">TennisRatio</div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-600/20 text-green-400 border border-green-600/30">Free</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-600/20 text-teal-400 border border-teal-600/30">Connected — public data</span>
          <div className="text-xs text-gray-400 mt-3 mb-3">Public analytics dashboard. H2H records, surface splits, pressure point data updated after every match.</div>
          <div className="flex flex-wrap gap-1 mb-3">
            {['H2H Heatmaps', 'Surface Win%', 'Pressure Stats', 'Dominance Ratios'].map(tag => (
              <span key={tag} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{tag}</span>
            ))}
          </div>
          <button
            onClick={() => window.open('https://www.tennisratio.com', '_blank')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30 hover:bg-purple-600/30 transition-colors"
          >
            Browse TennisRatio →
          </button>
        </div>

        {/* Tennis ComStat */}
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm text-white font-semibold">Tennis ComStat</div>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">Not connected</span>
          <div className="text-xs text-gray-400 mt-3 mb-3">Professional video + stats analysis. Upload match footage and receive shot maps, heatmaps, and rally analysis within 24 hours.</div>
          <div className="flex flex-wrap gap-1 mb-3">
            {['Video-Synced Stats', 'Shot Maps', 'Serve Heatmaps', 'Opponent Patterns'].map(tag => (
              <span key={tag} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{tag}</span>
            ))}
          </div>
          {showComStatConfirm ? (
            <div className="text-xs text-teal-400 font-medium">Request sent ��� check your email within 24h ✓</div>
          ) : (
            <button
              onClick={() => setShowComStatConfirm(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30 hover:bg-purple-600/30 transition-colors"
            >
              Request Access ↗
            </button>
          )}
        </div>

        {/* API-Tennis */}
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm text-white font-semibold">API-Tennis</div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">From $40/mo</span>
          </div>
          {hasApiKey ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-600/20 text-teal-400 border border-teal-600/30">Connected</span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">Not connected</span>
          )}
          <div className="text-xs text-gray-400 mt-3 mb-3">Real-time ATP/WTA fixtures, live scores, rankings, H2H records, and tournament data.</div>
          <div className="flex flex-wrap gap-1 mb-3">
            {['Live Scores', 'Fixtures', 'H2H', 'Rankings'].map(tag => (
              <span key={tag} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{tag}</span>
            ))}
          </div>
          <button
            disabled
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed"
          >
            {hasApiKey ? 'Live data active' : 'Add API key to .env.local'}
          </button>
        </div>
      </div>

      {/* Data Sources Mapping */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Data Sources</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {dataSources.map((ds, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <div className="text-xs text-gray-500">{ds.section}</div>
              <div className="text-xs text-purple-400 font-medium">{ds.source}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

  // ── Consolidated Performance Tabs ──
  const PerformanceTabsView = () => {
    const [perfTab, setPerfTab] = useState('rankings')
    const perfTabs = [
      { id: 'rankings',    label: 'Rankings & Race',    icon: '📊' },
      { id: 'forecaster',  label: 'Points Forecaster',  icon: '🔮' },
      { id: 'surface',     label: 'Surface Analysis',   icon: '🏟️' },
      { id: 'stats',       label: 'Match Stats',        icon: '📈' },
      { id: 'matchreports',label: 'Match Reports',      icon: '📄' },
      { id: 'practice',    label: 'Practice Log',       icon: '📝' },
      { id: 'video',       label: 'Video Library',      icon: '🎬' },
      { id: 'heatmaps',    label: 'Shot Heatmaps',      icon: '🔥' },
      { id: 'rating',      label: 'Performance Rating', icon: '⭐' },
      { id: 'pressure',    label: 'Pressure Analysis',  icon: '💥' },
      { id: 'ace',         label: 'Ace Tracker',        icon: '🎯' },
      { id: 'gps',         label: 'GPS & Court',        icon: '📡' },
    ]
    const renderPerfTab = () => {
      switch (perfTab) {
        case 'rankings':     return <RankingsView player={player} session={session} />
        case 'forecaster':   return <PointsForecasterView player={player} session={session} />
        case 'surface':      return <SurfaceAnalysisView player={player} session={session} />
        case 'stats':        return <PerformanceView player={player} session={session} />
        case 'matchreports': return <MatchReportsView player={player} session={session} />
        case 'practice':     return <PracticeLogView player={player} session={session} />
        case 'video':        return <VideoLibraryView player={player} session={session} />
        case 'heatmaps':     return <ShotHeatmapsView player={player} session={session} />
        case 'rating':       return <PerformanceRatingView player={player} session={session} />
        case 'pressure':     return <PressureAnalysisView player={player} session={session} />
        case 'ace':          return <AceTrackerView player={player} session={session} />
        case 'gps':          return <GPSCourtView player={player} session={session} />
        default:             return <RankingsView player={player} session={session} />
      }
    }
    return (
      <div className="space-y-6">
        <div className="flex gap-1 border-b border-gray-800 pb-0" style={{ overflowX: 'hidden' }}>
          {perfTabs.map(t => (
            <button key={t.id} onClick={() => setPerfTab(t.id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap"
              style={{ borderBottomColor: perfTab === t.id ? '#0ea5e9' : 'transparent', color: perfTab === t.id ? '#38bdf8' : '#6B7280', backgroundColor: perfTab === t.id ? '#0ea5e90d' : 'transparent' }}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
        {renderPerfTab()}
      </div>
    )
  }

  const renderView = () => {
    switch (activeSection) {
      case 'dashboard':    return <DashboardView player={player} session={session} photos={photos} setPhotos={setPhotos} dismissedWins={dismissedWins} onDismissWin={dismissWin} tasks={tasks} taskChecked={taskChecked} onToggleTask={toggleTask} newTaskText={newTaskText} setNewTaskText={setNewTaskText} showAddTask={showAddTask} setShowAddTask={setShowAddTask} onAddTask={addTask} dismissedAlerts={dismissedAlerts} onDismissAlert={dismissAlert} teamSubTab={teamSubTab} setTeamSubTab={setTeamSubTab} onNavigate={setActiveSection} activeModal={activeModal} onOpenModal={setActiveModal} onCloseModal={closeModal} roleConfig={roleConfig} currentRole={currentRole} />;
      case 'morning':      return <MorningBriefingView player={player} session={session} />;
      case 'rankings':     return <RankingsView player={player} session={session} />;
      case 'forecaster':   return <PointsForecasterView player={player} session={session} />;
      case 'entries':      return <EntryManagerView player={player} session={session} />;
      case 'schedule':     return <ScheduleView player={player} session={session} />;
      case 'performance':  return <PerformanceView player={player} session={session} />;
      case 'matchprep':    return <MatchPrepView player={player} session={session} />;
      case 'matchreports': return <MatchReportsView player={player} session={session} />;
      case 'practice':     return <PracticeLogView player={player} session={session} />;
      case 'video':        return <VideoLibraryView player={player} session={session} />;
      case 'shotheatmaps': return <ShotHeatmapsView player={player} session={session} />;
      case 'perfrating':   return <PerformanceRatingView player={player} session={session} />;
      case 'team':         return <TeamHubView player={player} session={session} />;
      case 'physio':       return <PhysioView player={player} session={session} />;
      case 'nutrition':    return <NutritionView player={player} session={session} />;
      case 'pressure':     return <PressureAnalysisView player={player} session={session} />;
      case 'acetracker':   return <AceTrackerView player={player} session={session} />;
      case 'racket':       return <RacketView player={player} session={session} />;
      case 'partners':     return <PlayingPartnersView player={player} session={session} />;
      case 'doubles':      return <DoublesView player={player} session={session} />;
      case 'sponsorship':  return <SponsorshipView player={player} session={session} />;
      case 'media':        return session.isDemoShell !== false
        ? <MediaContentModule
            sport="tennis"
            accentColor="#a855f7"
            existingContentLabel="Tennis — Statement Generator, Press Log & Brand Guidelines"
            existingContent={<MediaView player={player} session={session} />}
            isDemoShell={true}
          />
        : <MediaView player={player} session={session} />;
      case 'financial':    return <FinancialView player={player} session={session} />;
      case 'prizeforecast': return <PrizeForecasterView player={player} session={session} />;
      case 'exhibition':   return <ExhibitionView player={player} session={session} />;
      case 'pipeline':     return <AgentPipelineView player={player} session={session} />;
      case 'travel':       return <TravelView player={player} session={session} />;
      case 'federation':   return <FederationView player={player} session={session} />;
      case 'datahub':      return <DataHubView player={player} session={session} />;
      case 'career':       return <CareerView player={player} session={session} />;
      case 'academy':      return <AcademyView player={player} session={session} />;
      case 'mental':       return <MentalPerformanceView player={player} session={session} />;
      case 'courtbooking': return <CourtBookingView player={player} session={session} />;
      case 'teamcomms':    return <TeamCommsView player={player} session={session} />;
      case 'accreditations': return <AccreditationsView player={player} session={session} />;
      case 'settings':     return (
        <SportsSettings
          sport="tennis"
          slug={player.slug}
          sportLabel="Tennis"
          entity="player"
          accentColour="#0ea5e9"
          accentLight="#38bdf8"
          session={{ userName: session?.userName, photoDataUrl: session?.photoDataUrl, email: session?.email }}
          storagePrefix="lumio_tennis_"
          brandNameValue={liveBrandName}
          brandLogoUrl={liveBrandLogo}
          profile={{
            name: 'Full Name',
            tour: 'Tour / Circuit',
            tourValue: `${player.tour} Tour`,
            ranking: 'Ranking',
            rankingValue: `#${player.ranking}`,
            coach: 'Coach',
            coachValue: player.coach,
            agent: 'Agent',
            agentValue: player.agent,
            playerIdLabel: 'ATP/WTA Player ID',
            staffInviteRoles: ['Coach','Physio','Agent','Fitness Trainer','Mental Coach','Admin'],
          }}
          configFields={[
            { id: 'atpwtaId', label: 'ATP/WTA Player ID', description: 'For live ranking and draw data', kind: 'text', placeholder: 'e.g. atpR123' },
            { id: 'gpsProvider', label: 'GPS Hardware Provider', description: 'Player tracking system', kind: 'select', options: ['None','PlayerData EDGE Air (recommended)','PlayerData EDGE Pro (with live data)','STATSports APEX (legacy — manual sync)','Catapult One (legacy — manual sync)','CSV Upload (manual)'], defaultValue: 'None' },
          ]}
          integrationGroups={[
            {
              title: 'DATA PROVIDERS',
              items: [
                { name: 'ATP/WTA Profile', desc: 'Rankings, results & draw data' },
                { name: 'Hawk-Eye', desc: 'Ball tracking & court analytics' },
                { name: 'TrackMan Tennis', desc: 'Serve speed, spin & shot data' },
                { name: 'Tennis Abstract', desc: 'Historical stats & match records' },
                { name: 'IBM SlamTracker', desc: 'Grand Slam live analytics' },
              ],
            },
            {
              title: 'VIDEO & TRACKING',
              items: [
                { name: 'SwingVision', desc: 'Shot tracking, video clips & AI coaching' },
                { name: 'STATSports GPS', desc: 'Movement load & court coverage data' },
                { name: 'Catapult', desc: 'Elite GPS & athlete monitoring' },
                { name: 'PlayerTek', desc: 'GPS vest tracking for training sessions' },
              ],
            },
            {
              title: 'COMMUNICATION',
              items: [
                { name: 'Slack', desc: 'Team messaging & alerts' },
                { name: 'Microsoft Teams', desc: 'Chat & video conferencing' },
                { name: 'Google Workspace', desc: 'Calendar, Drive & email' },
                { name: 'WhatsApp Business', desc: 'Player & agent messaging' },
              ],
            },
          ]}
          voiceOptions={[
            { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', desc: 'Warm, confident British female — ideal for morning briefings' },
            { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', desc: 'Calm, authoritative British female — clear and composed' },
            { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', desc: 'Professional British male — steady matchday narration' },
          ]}
          teamInvite={{
            enabled: true,
            staffCount: 1,
            pendingInvites: 0,
            roleOptions: ['Coach','Physio','Agent','Fitness Trainer','Mental Coach','Admin'],
          }}
          navItems={[
            { key: 'morning', label: 'Morning Briefing', emoji: '🌅' },
            { key: 'performance', label: 'Performance', emoji: '📊' },
            { key: 'gpsvideo', label: 'GPS & Video', emoji: '🛰️' },
            { key: 'schedule', label: 'Tournament Schedule', emoji: '🗓️' },
            { key: 'matchprep', label: 'Match Prep', emoji: '🎯' },
            { key: 'team', label: 'Team Hub', emoji: '👥' },
            { key: 'sponsorship', label: 'Sponsorship', emoji: '🤝' },
            { key: 'financial', label: 'Financial', emoji: '💰' },
            { key: 'media', label: 'Media & Content', emoji: '📱' },
            { key: 'travel', label: 'Travel & Logistics', emoji: '✈️' },
            { key: 'career', label: 'Career Planning', emoji: '🚀' },
          ]}
          featureItems={[
            { key: 'morning-briefing', label: 'Morning Briefing', emoji: '🌅', description: 'AI summary at top of dashboard' },
            { key: 'quick-actions', label: 'Quick Actions bar', emoji: '⚡', description: 'Action buttons below tab bar' },
            { key: 'ai-section', label: 'AI Department Intelligence', emoji: '✨', description: 'AI Summary + Key Highlights' },
            { key: 'world-clock', label: 'World Clock', emoji: '🕐', description: 'Multi-timezone clock in banner' },
            { key: 'weather', label: 'Weather widget', emoji: '🌤️', description: 'Current location weather' },
            { key: 'player-card', label: 'Player Card', emoji: '🃏', description: 'Stats card in right sidebar' },
          ]}
          onVisibilityChange={(items) => setHiddenItems(items)}
          showWorldClock
          showAppearance
          showDeveloperTools
          devApiRouteOptions={['/api/ai/tennis']}
        />
      );
      case 'livescores':  return <LiveScoresView liveScores={liveScores} fixtures={fixtures} player={player} session={session} />;
      case 'scout':       return <OpponentScoutView h2hData={h2hData} player={player} session={session} />;
      case 'surface':     return <SurfaceAnalysisView player={player} session={session} />;
      case 'gps':         return <GPSCourtView player={player} session={session} />;
      case 'gpsvideo':    return <GPSVideoView player={player} session={session} />;
      case 'draw':        return <DrawBracketView player={player} session={session} />;
      case 'playerdirectory': return <PlayerDirectoryView player={player} session={session} />;
      case 'coachfinder': return <CoachFinderView player={player} session={session} />;
      default:             return <DashboardView player={player} session={session} photos={photos} setPhotos={setPhotos} dismissedWins={dismissedWins} onDismissWin={dismissWin} tasks={tasks} taskChecked={taskChecked} onToggleTask={toggleTask} newTaskText={newTaskText} setNewTaskText={setNewTaskText} showAddTask={showAddTask} setShowAddTask={setShowAddTask} onAddTask={addTask} dismissedAlerts={dismissedAlerts} onDismissAlert={dismissAlert} teamSubTab={teamSubTab} setTeamSubTab={setTeamSubTab} onNavigate={setActiveSection} activeModal={activeModal} onOpenModal={setActiveModal} onCloseModal={closeModal} roleConfig={roleConfig} currentRole={currentRole} />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#07080F', color: '#F9FAFB' }}>
      {sponsorToast && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-[#0d0f1a] border border-yellow-500/40 rounded-xl p-4 shadow-2xl" style={{animation:'slideUp 0.26s ease'}}>
          <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div className="text-xs font-bold text-yellow-400 uppercase tracking-wide mb-1">🤝 Sponsor Obligation</div>
          <div className="text-xs text-gray-300 mb-3">{sponsorToast}</div>
          <div className="flex gap-2">
            <button onClick={() => { setActiveSection('sponsorship'); setSponsorToast(''); }} className="flex-1 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors">Review →</button>
            <button onClick={() => setSponsorToast('')} className="flex-1 text-xs border border-gray-700 text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg transition-colors">Dismiss</button>
          </div>
        </div>
      )}
      {/* Sidebar — floating when unpinned, pushes content when pinned */}
      <aside
        ref={sidebarRef}
        className="hidden md:flex flex-col overflow-hidden"
        style={{
          width: sidebarExpanded ? 'fit-content' : 72,
          minWidth: sidebarExpanded ? 180 : 72,
          maxWidth: 220,
          backgroundColor: '#0a0c14',
          borderRight: '1px solid #1F2937',
          transition: 'min-width 250ms ease, width 250ms ease',
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
                    style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)' }}>
                    🎾
                  </div>
            }
            {sidebarExpanded && (
              <span className="text-xs font-bold uppercase tracking-widest truncate" style={{ color: '#4B5563' }}>
                {liveBrandName || 'Lumio Tennis'}
              </span>
            )}
          </div>
          {sidebarExpanded && (
            <button onClick={toggleSidebarPin} className="shrink-0 p-1 rounded" style={{ color: sidebarPinned ? '#0ea5e9' : '#4B5563', transform: sidebarPinned ? 'rotate(0deg)' : 'rotate(45deg)', transition: 'transform 200ms, color 200ms' }} title={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar open'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z"/></svg>
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-0.5 px-1.5">
          {groups.map(group => {
            const items = visibleSidebarItems
              .filter(item => !isHidden(item.id))
              .filter(i => i.group === group)
              .sort((a, b) => (a.id === 'settings' ? 1 : b.id === 'settings' ? -1 : 0));
            return (
              <div key={group} className="mb-0.5">
                {sidebarExpanded && (
                  <div className="font-bold text-gray-600 uppercase tracking-widest px-2" style={{ fontSize: 9, marginTop: 8, marginBottom: 2, lineHeight: '1.2' }}>{group}</div>
                )}
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveSection(item.id); if (!sidebarPinned) setSidebarHovered(false) }}
                    className="w-full flex items-center rounded-md transition-all text-left"
                    style={{
                      backgroundColor: activeSection === item.id ? 'rgba(139,92,246,0.12)' : 'transparent',
                      color: activeSection === item.id ? '#c084fc' : '#6B7280',
                      borderLeft: activeSection === item.id ? '2px solid #a855f7' : '2px solid transparent',
                      paddingLeft: sidebarExpanded ? 10 : 0,
                      paddingTop: 5,
                      paddingBottom: 5,
                      paddingRight: 12,
                      justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                      fontSize: 12,
                      lineHeight: '1.2',
                      gap: 8,
                      marginBottom: 1,
                    }}
                    title={sidebarExpanded ? undefined : item.label}
                  >
                    <span style={{ fontSize: 14 }} className="flex-shrink-0">{item.icon}</span>
                    {sidebarExpanded && <span className="font-medium truncate" style={{ fontSize: 12 }}>{item.label}</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        <RoleSwitcher
          session={liveSession}
          roles={TENNIS_ROLES}
          accentColor="#0ea5e9"
          onRoleChange={(role) => {
            setRoleOverride(role)
            const key = 'lumio_tennis_demo_session'
            const stored = localStorage.getItem(key)
            if (stored) {
              const parsed = JSON.parse(stored)
              localStorage.setItem(key, JSON.stringify({ ...parsed, role }))
            }
          }}
          sidebarCollapsed={!sidebarExpanded}
        />

        {/* Sidebar Footer */}
        {sidebarExpanded && (
          <div className="px-3 py-2 border-t border-gray-800">
            <div className="text-[9px] text-gray-700 uppercase tracking-wider font-medium">Plan</div>
            <div className="text-[10px] text-purple-400 font-semibold mt-0.5">Pro+ . GBP 299/mo</div>
          </div>
        )}
        {onSignOut && (
          <button onClick={onSignOut} className="flex items-center gap-2 w-full px-4 py-2.5 text-xs transition-all hover:bg-red-600/10" style={{ borderTop: '1px solid #1F2937', color: '#6B7280', justifyContent: sidebarExpanded ? 'flex-start' : 'center' }} title="Sign out">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {sidebarExpanded && <span>Sign out</span>}
          </button>
        )}
        <div className="border-t flex items-center justify-center" style={{ borderColor: '#1F2937', padding: '8px 12px', width: '100%' }}>
          {sidebarExpanded ? (
            <>
              <img src="/tennis_logo.png" alt="Lumio Tennis" style={{ width: 100, height: 'auto', display: 'block', margin: '0 auto' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement)?.removeAttribute('style') }} />
              <span style={{ display: 'none', color: '#4B5563', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em' }}>LUMIO TENNIS</span>
            </>
          ) : (
            <span className="text-lg">🎾</span>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0" style={{ marginLeft: sidebarPinned ? sidebarWidth : 72, transition: 'margin-left 250ms ease' }}>
        {/* Demo workspace banner — hidden when rendered inside /tennis/app for a real signed-in user */}
        {session.isDemoShell !== false && (
          <div className="flex items-center justify-between px-6 py-2 text-xs font-medium flex-shrink-0"
            style={{ backgroundColor: '#0D9488', color: '#ffffff' }}>
            <span>This is a demo · sample data</span>
            <a href="/sports-signup" className="flex items-center gap-1 hover:underline font-semibold" style={{ color: '#ffffff' }}>
              Get founding access →
            </a>
          </div>
        )}
        {!isPlayer && !isSponsor && (
          <div className="flex items-center justify-between px-6 py-2 text-xs flex-shrink-0"
            style={{ backgroundColor: `${roleConfig.accent}12`, borderBottom: `1px solid ${roleConfig.accent}25` }}>
            <div className="flex items-center gap-2">
              <span>{roleConfig.icon}</span>
              <span style={{ color: roleConfig.accent }}>Viewing as <strong>{roleConfig.label}</strong>{roleConfig.message ? ` — ${roleConfig.message}` : ''}</span>
            </div>
            <span style={{ color: `${roleConfig.accent}80` }}>Player controls full access →</span>
          </div>
        )}
        {/* Content + Card Row */}
        {isSponsor ? (
          <TennisSponsorDashboard session={session} player={player} />
        ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderView()}
          </div>

          {/* Player Card Column */}
          <div className="hidden lg:flex flex-col items-center gap-4 p-4 border-l border-gray-800 flex-shrink-0"
            style={{ width: '220px' }}>
            <PlayerCard player={player} session={session} />
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Live Match</div>
              <div className="text-xs text-teal-400 font-medium">In Progress</div>
              <div className="text-xs text-gray-300 mt-1">vs C. Vega</div>
              <div className="text-xs text-gray-500">Court 4 . 13:00</div>
              <div className="mt-2 text-xs text-yellow-400">QF — EUR 47,500</div>
            </div>
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Upcoming</div>
              {['Barcelona (ATP 500)', 'Madrid (M1000)', 'Rome (M1000)', 'Roland-Garros (GS)'].map((t, i) => (
                <div key={i} className="text-xs text-gray-400 py-1 border-b border-gray-800/50 last:border-0">{t}</div>
              ))}
            </div>
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Alerts</div>
              <div className="space-y-1.5">
                <div className="text-xs text-yellow-400">Meridian Watches renewal: 47d</div>
                <div className="text-xs text-yellow-400">Apex Performance post due</div>
                <div className="text-xs text-red-400">125 pts expire today</div>
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
            {activeModal === 'sendmessage' && <TennisSendMessage onClose={closeModal} session={session} player={player} />}
            {activeModal === 'socialmedia' && <TennisSocialMedia onClose={closeModal} session={session} player={player} />}
            {activeModal === 'flights' && <TennisFlightFinder onClose={closeModal} session={session} player={player} />}
            {activeModal === 'hotel' && <TennisHotelFinder onClose={closeModal} session={session} />}
            {activeModal === 'matchprep' && <TennisMatchPrepAI onClose={closeModal} session={session} player={player} />}
            {activeModal === 'sponsor' && <TennisSponsorPost onClose={closeModal} session={session} player={player} />}
            {activeModal === 'press' && <TennisPressStatement onClose={closeModal} session={session} player={player} />}
            {activeModal === 'ranking' && <TennisRankingSimulator onClose={closeModal} player={player} />}
            {activeModal === 'entries' && <TennisEntryManager onClose={closeModal} />}
            {activeModal === 'injury' && <TennisInjuryLogger onClose={closeModal} />}
            {activeModal === 'expense' && <TennisExpenseLogger onClose={closeModal} />}
            {activeModal === 'strings' && <TennisStringOrder onClose={closeModal} />}
            {activeModal === 'visa' && <TennisVisaCheck onClose={closeModal} />}
            {activeModal === 'notes' && <TennisMatchNotes onClose={closeModal} session={session} player={player} />}
            {activeModal === 'practicecourt' && <TennisPracticeCourt onClose={closeModal} session={session} />}
            {activeModal === 'warmup' && <TennisWarmupTimer onClose={closeModal} />}
            {activeModal === 'wildcard' && <TennisWildcardRequest onClose={closeModal} session={session} player={player} />}
            {activeModal === 'agentbrief' && <TennisAgentBrief onClose={closeModal} session={session} player={player} />}
          </div>
        </div>
      )}
    </div>
  );
}



