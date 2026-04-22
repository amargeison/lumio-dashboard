'use client';
// TODO: Scope localStorage keys by user ID when auth is implemented// e.g. `sport_schedule_checked` → `sport_${userId}_schedule_checked`
//
// ─── INVENTED GOLF ROSTER ───────────────────────────────────────────────────
// All real-world PGA / DP World / LIV player references in this portal have
// been replaced with invented personas to keep the demo content brand-coherent
// (matches the Meridian Watches / Halden Motors universe). The founder
// persona was renamed from "James Harrington" → "James Halton" to avoid
// surname collision with a real DP World Tour major champion.
//
// Roster (32 invented pros — mix of PGA / DP World / LIV flavour):
//   PGA Tour:       Beau Carstairs, Quinn Marlowe, Davis Hadlow,
//                   Cameron Whitlock, Wesley Cardoza, Jack Maxwell,
//                   Bryce Trent, Connor Halverson, Adrián Salinas,
//                   Lucas Mendel, Dane Hartwell, Andre Pollock
//   DP World Tour:  Owen Alderton (ENG), Ross Kilbride (IRL),
//                   Toby Linscott (ENG), Theo Lemaire (FRA),
//                   Mateusz Kowal (POL), Pieter Verlinden (NED),
//                   Pascal Renault (FRA), Jaden Pemberton (ENG),
//                   Ronan Driscoll (IRL)
//   Scandinavian:   Henrik Tellander (SWE), Niklas Brandt (GER),
//                   Lars Borg (NOR), Sven Eklund (SWE)
//   LIV / global:   Felipe Cardenal (ESP), Mateo Vega (ARG),
//                   Hiroto Yamaguchi (JPN), Kentaro Saito (JPN),
//                   Marko Vasilev (BUL), Tarik Boushra (MAR),
//                   Damon Voller (AUS)
//
// Broadcaster: Golf Channel / Sky Sports Golf / ESPN are all swapped to
// "Meridian Sports" (matching the boxing portal's same swap).

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation'
import { Clipboard, Activity, Heart, BarChart, Map, DollarSign, Handshake, Star, TrendingUp, Volume2 } from 'lucide-react';
import { SportsDemoGate, RoleSwitcher } from '@/components/sports-demo'
import type { SportsDemoSession } from '@/components/sports-demo'
import { createBrowserClient } from '@supabase/ssr'
import { isDemoSlug } from '@/lib/config/demo-slugs'
import { generateSmartBriefing, buildRoundupSummary, buildScheduleItems, getUserTimezone } from '@/lib/sports/smartBriefing'
import SportsSettings from '@/components/sports/SportsSettings'
import { getDailyQuote, GOLF_QUOTES } from '@/lib/sports-quotes'
import { getDemoAISummary } from '@/lib/demo-content/ai-summaries'
import MediaContentModule from '@/components/sports/media-content/MediaContentModule'
import { clearDemoSession } from '@/lib/demo-session/clear'
import { useLiveBrandColours } from '@/lib/hooks/useLiveBrandColours'
import { CADDIES_ROSTER, COURSES_ROSTER, DRIVING_RANGES_ROSTER } from '@/lib/demo-content/golf-pros'
import { IntegrationsHub, type HubEntry } from '@/lib/sports-integrations/integrations-hub'
import { GOLF_INTEGRATIONS } from '@/lib/sports-integrations/golf-integrations'
import { PwaInstaller } from '@/components/PwaInstaller'
import { useIsMobile } from '@/hooks/useIsMobile'
import { MobileSportLayout } from '@/components/mobile/MobileSportLayout'
import { MobileSportHome } from '@/components/mobile/MobileSportHome'
import { MobileSportTraining } from '@/components/mobile/MobileSportTraining'
import { golfMobileConfig } from '@/lib/mobile/configs/golf'

// ─── PROFILE SYNC HOOKS — re-read on 'lumio-profile-updated' events ──────────
function useGolfProfileName(): string | null {
  const [name, setName] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('lumio_golf_name')
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setName(localStorage.getItem('lumio_golf_name'))
    window.addEventListener('lumio-profile-updated', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('lumio-profile-updated', sync); window.removeEventListener('storage', sync) }
  }, [])
  return name
}
function useGolfProfilePhoto(): string | null {
  const [photo, setPhoto] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('lumio_golf_profile_photo')
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setPhoto(localStorage.getItem('lumio_golf_profile_photo'))
    window.addEventListener('lumio-profile-updated', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('lumio-profile-updated', sync); window.removeEventListener('storage', sync) }
  }, [])
  return photo
}
function useGolfBrandName(): string {
  const [name, setName] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('lumio_golf_brand_name') || ''
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setName(localStorage.getItem('lumio_golf_brand_name') || '')
    window.addEventListener('lumio-profile-updated', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('lumio-profile-updated', sync); window.removeEventListener('storage', sync) }
  }, [])
  return name
}
function useGolfBrandLogo(): string {
  const [logo, setLogo] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('lumio_golf_brand_logo') || ''
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setLogo(localStorage.getItem('lumio_golf_brand_logo') || '')
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

// ─── UTILITIES ───────────────────────────────────────────────────────────────
const cleanResponse = (text: string) => text
  .replace(/#{1,6}\s*/g, '')
  .replace(/\*\*(.*?)\*\*/g, '$1')
  .replace(/\*(.*?)\*/g, '$1')
  .replace(/^\s*[-•·–—]\s*/gm, '')
  .replace(/^\s*[\u2022\u2023\u25E6\u2043\u2219]\s*/gm, '')
  .replace(/^\s*\d+\.\s*/gm, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim()

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface GolfPlayer {
  id: string;
  name: string;
  slug: string;
  nationality: string;
  flag: string;
  age: number;
  height: string;
  weight: string;
  turned_pro: number;
  tour: 'DP World Tour' | 'PGA Tour' | 'Korn Ferry' | 'Challenge Tour' | 'Asian Tour';
  owgr: number;
  owgr_points: number;
  race_to_dubai_pos: number;
  race_to_dubai_points: number;
  career_high_owgr: number;
  coach: string;
  short_game_coach: string;
  caddie: string;
  physio: string;
  agent: string;
  fitness_trainer: string;
  mental_coach: string;
  plan: 'pro' | 'pro_plus' | 'elite';
}

// ─── SIDEBAR ITEMS ────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',            icon: '🏠', group: 'OVERVIEW' },
  { id: 'morning',       label: 'Morning Briefing',     icon: '🌅', group: 'OVERVIEW' },
  { id: 'owgr',          label: 'OWGR & Race to Dubai', icon: '📊', group: 'PERFORMANCE' },
  { id: 'schedule',      label: 'Tournament Schedule',  icon: '🗓️', group: 'PERFORMANCE' },
  { id: 'strokes',       label: 'Strokes Gained',       icon: '📈', group: 'PERFORMANCE' },
  { id: 'coursefit',     label: 'Course Fit & Strategy',icon: '🗺️', group: 'PERFORMANCE' },
  { id: 'matchprep',     label: 'Round Prep',           icon: '🎯', group: 'PERFORMANCE' },
  { id: 'practicelog',   label: 'Practice Log',         icon: '📋', group: 'PERFORMANCE' },
  { id: 'team',          label: 'Team Hub',             icon: '👥', group: 'TEAM' },
  { id: 'caddie',        label: 'Caddie Workflow',      icon: '🏌️', group: 'TEAM' },
  { id: 'physio',        label: 'Physio & Recovery',    icon: '⚕️', group: 'TEAM' },
  { id: 'equipment',     label: 'Equipment & Bag',      icon: '🛍️', group: 'TEAM' },
  { id: 'mental',        label: 'Mental Performance',   icon: '🧠', group: 'TEAM' },
  { id: 'sponsorship',   label: 'Sponsorship',          icon: '🤝', group: 'COMMERCIAL' },
  { id: 'media',         label: 'Media & Content',      icon: '📱', group: 'COMMERCIAL' },
  { id: 'financial',     label: 'Financial Dashboard',  icon: '💰', group: 'COMMERCIAL' },
  { id: 'proam',         label: 'Pro-Am & Appearances', icon: '⭐', group: 'COMMERCIAL' },
  { id: 'agent',         label: 'Agent Pipeline',       icon: '📬', group: 'COMMERCIAL' },
  { id: 'travel',        label: 'Travel & Logistics',   icon: '✈️', group: 'OPERATIONS' },
  { id: 'exemptions',    label: 'Exemptions & Status',  icon: '🏛️', group: 'OPERATIONS' },
  { id: 'qualifying',    label: 'Q-School & Qualifying',icon: '🎓', group: 'OPERATIONS' },
  { id: 'career',        label: 'Career Planning',      icon: '🚀', group: 'OPERATIONS' },
  { id: 'video',         label: 'Video Library',        icon: '🎬', group: 'OPERATIONS' },
  { id: 'findpro',       label: 'Find a Pro',           icon: '🔍', group: 'OPERATIONS' },
  { id: 'integrations',  label: 'Integrations',         icon: '🔌', group: 'SETTINGS' },
  { id: 'settings',      label: 'Settings',             icon: '⚙️', group: 'SETTINGS' },
];

// ─── DEMO PLAYER ─────────────────────────────────────────────────────────────
const DEMO_PLAYER: GolfPlayer = {
  id: 'golfer-demo-001',
  name: 'James Halton',
  slug: 'james-halton',
  nationality: 'English',
  flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  age: 29,
  height: '6\'1"',
  weight: '84kg',
  turned_pro: 2018,
  tour: 'DP World Tour',
  owgr: 87,
  owgr_points: 4.82,
  race_to_dubai_pos: 43,
  race_to_dubai_points: 1240,
  career_high_owgr: 61,
  coach: 'Pete Larsen',
  short_game_coach: 'Dave Pelz Jr.',
  caddie: 'Mick O\'Brien',
  physio: 'Tom Walsh',
  agent: 'Sarah Mitchell (ISM)',
  fitness_trainer: 'Jake Portman',
  mental_coach: 'Dr. Alison Reed',
  plan: 'pro_plus',
};

const PRIORITY_STYLES: Record<string, { dot: string; bg: string; color: string; label: string }> = {
  critical: { dot: '#EF4444', bg: 'rgba(239,68,68,0.12)',   color: '#F87171', label: 'Critical' },
  high:     { dot: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  color: '#FBBF24', label: 'High'     },
  medium:   { dot: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  color: '#60A5FA', label: 'Medium'   },
  low:      { dot: '#6B7280', bg: 'rgba(107,114,128,0.12)', color: '#9CA3AF', label: 'Low'      },
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
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

const SectionHeader = ({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: string }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2">
      {icon && <span className="text-xl">{icon}</span>}
      <h2 className="text-xl font-bold text-white" style={{  }}>{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-gray-400 mt-1 ml-7">{subtitle}</p>}
  </div>
);

const TourBadge = ({ tier }: { tier: string }) => {
  const colors: Record<string, string> = {
    'Major': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    'Meridian Series': 'bg-purple-600/20 text-purple-400 border border-purple-600/30',
    'DP World Tour': 'bg-blue-600/20 text-blue-400 border border-blue-600/30',
    'Co-sanctioned': 'bg-teal-600/20 text-teal-400 border border-teal-600/30',
    'Challenge Tour': 'bg-gray-600/20 text-gray-400 border border-gray-600/30',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[tier] || 'bg-gray-700 text-gray-400'}`}>{tier}</span>;
};

const SGBar = ({ label, value, max = 2 }: { label: string; value: number; max?: number }) => {
  const pct = Math.min(100, Math.max(0, ((value + max) / (max * 2)) * 100));
  const isPositive = value >= 0;
  return (
    <div className="flex items-center gap-3">
      <div className="text-xs text-gray-400 w-28 flex-shrink-0">{label}</div>
      <div className="flex-1 bg-gray-800 rounded-full h-2 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-px h-3 bg-gray-600 mx-auto"></div>
        </div>
        <div
          className={`h-2 rounded-full ${isPositive ? 'bg-teal-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        ></div>
      </div>
      <div className={`text-sm font-bold w-12 text-right ${isPositive ? 'text-teal-400' : 'text-red-400'}`}>
        {value > 0 ? '+' : ''}{value.toFixed(2)}
      </div>
    </div>
  );
};

// ─── SVG CHARTS ───────────────────────────────────────────────────────────────
const OWGRChart = () => {
  const data = [98, 94, 91, 88, 84, 89, 87, 83, 79, 87, 84, 87];
  const months = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
  const max = 110; const min = 60; const h = 100; const w = 300;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((max - v) / (max - min)) * h;
    return `${x},${y}`;
  }).join(' ');
  const careerHigh = h - ((max - 61) / (max - min)) * h;
  return (
    <svg viewBox={`0 -10 ${w} ${h + 30}`} className="w-full">
      <line x1="0" y1={careerHigh} x2={w} y2={careerHigh} stroke="#6C3FC5" strokeWidth="1" strokeDasharray="4,4" opacity="0.5"/>
      <text x={w - 2} y={careerHigh - 4} fill="#6C3FC5" fontSize="7" textAnchor="end">Career high #61</text>
      <polyline fill="none" stroke="#0D9488" strokeWidth="2" points={pts}/>
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((max - v) / (max - min)) * h;
        return <circle key={i} cx={x} cy={y} r="3" fill={i === data.length - 1 ? '#0D9488' : '#0a2218'} stroke="#0D9488" strokeWidth="1.5"/>;
      })}
      {months.map((m, i) => (
        <text key={i} x={(i / (data.length - 1)) * w} y={h + 16} fill="#666" fontSize="7" textAnchor="middle">{m}</text>
      ))}
    </svg>
  );
};

const SGRadar = () => {
  const cats = ['Off Tee', 'Approach', 'Around Green', 'Putting', 'T-to-G'];
  const vals = [0.41, -0.28, 0.15, -1.18, 0.13];
  const cx = 90; const cy = 90; const r = 70;
  const points = cats.map((_, i) => {
    const angle = (i / cats.length) * Math.PI * 2 - Math.PI / 2;
    const norm = Math.min(1, Math.max(0, (vals[i] + 2) / 4));
    return { x: cx + Math.cos(angle) * r * norm, y: cy + Math.sin(angle) * r * norm, lx: cx + Math.cos(angle) * (r + 18), ly: cy + Math.sin(angle) * (r + 18), val: vals[i] };
  });
  const polyPts = points.map(p => `${p.x},${p.y}`).join(' ');
  const bgPts = cats.map((_, i) => { const angle = (i / cats.length) * Math.PI * 2 - Math.PI / 2; return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`; }).join(' ');
  return (
    <svg viewBox="0 0 180 180" className="w-full max-w-xs mx-auto">
      <polygon points={bgPts} fill="none" stroke="#333" strokeWidth="1"/>
      {cats.map((_, i) => { const angle = (i / cats.length) * Math.PI * 2 - Math.PI / 2; return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(angle) * r} y2={cy + Math.sin(angle) * r} stroke="#333" strokeWidth="1"/>; })}
      <polygon points={polyPts} fill="rgba(13,148,136,0.2)" stroke="#0D9488" strokeWidth="1.5"/>
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#0D9488"/>
          <text x={p.lx} y={p.ly} fill={p.val >= 0 ? '#0D9488' : '#ef4444'} fontSize="7" textAnchor="middle" dominantBaseline="middle">{cats[i]}</text>
          <text x={p.lx} y={p.ly + 8} fill={p.val >= 0 ? '#5eead4' : '#fca5a5'} fontSize="6" textAnchor="middle" dominantBaseline="middle">{p.val > 0 ? '+' : ''}{p.val}</text>
        </g>
      ))}
    </svg>
  );
};

const PrizeMoneyChart = () => {
  const cats = [{ label: 'Majors', val: 45, color: '#EAB308' }, { label: 'Meridian Series', val: 78, color: '#6C3FC5' }, { label: 'DP World Tour', val: 124, color: '#0D9488' }, { label: 'Pro-Ams', val: 38, color: '#3B82F6' }];
  const total = cats.reduce((a, b) => a + b.val, 0);
  let offset = 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-8 rounded-lg overflow-hidden w-full">
        {cats.map((c, i) => (
          <div key={i} style={{ width: `${(c.val / total) * 100}%`, background: c.color }} className="relative group" title={`${c.label}: £${c.val}k`}></div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {cats.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: c.color }}></div>
            <span className="text-xs text-gray-400">{c.label}</span>
            <span className="text-xs font-medium text-white ml-auto">£{c.val}k</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const FormTracker = ({ results }: { results: Array<{event: string; pos: string; points: number; prize: string}> }) => (
  <div className="flex gap-2 flex-wrap">
    {results.map((r, i) => {
      const isCut = r.pos === 'MC' || r.pos === 'WD';
      const isTop10 = !isCut && parseInt(r.pos) <= 10;
      const isWin = r.pos === '1';
      return (
        <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 ${isWin ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : isTop10 ? 'bg-teal-600/20 border-teal-500 text-teal-400' : isCut ? 'bg-red-600/20 border-red-600 text-red-400' : 'bg-gray-800 border-gray-600 text-gray-400'}`} title={`${r.event} — T${r.pos}`}>
          {r.pos}
        </div>
      );
    })}
  </div>
);

// ─── PLAYER CARD ─────────────────────────────────────────────────────────────
const PlayerCard = ({ player, session, setActiveSection = () => {} }: { player: GolfPlayer; session?: { userName?: string; photoDataUrl?: string | null; role?: string; isDemoShell?: boolean }; setActiveSection?: (s: string) => void }) => {
  const isPlayerRole = !session?.role || session.role === 'player'
  const isFoundingMember = session?.isDemoShell === false
  // Founders read session only — never lumio_golf_* survivor keys — to avoid
  // leakage from a prior demo visit on the same browser.
  const liveName = isPlayerRole
    ? (isFoundingMember
        ? (session?.userName || player.name)
        : ((typeof window !== 'undefined' ? localStorage.getItem('lumio_golf_name') : null) || session?.userName || player.name))
    : player.name
  const livePhoto = isPlayerRole
    ? (isFoundingMember
        ? (session?.photoDataUrl || null)
        : ((typeof window !== 'undefined' ? localStorage.getItem('lumio_golf_profile_photo') : null) || session?.photoDataUrl || '/james_halton.jpg'))
    : null
  return (
  <div className="relative w-52 rounded-xl overflow-hidden border-2 border-green-600/40 shadow-2xl shadow-green-900/30 flex-shrink-0"
    style={{ background: 'linear-gradient(135deg, #0a1a0a 0%, #0d1929 50%, #0a1a12 100%)' }}>
    <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #16a34a, #0D9488, #6C3FC5)' }}></div>
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <button
          onClick={() => setActiveSection('owgr')}
          className="text-center hover:bg-white/5 rounded-lg p-1 -m-1 transition-all cursor-pointer"
          title="Go to OWGR & Race to Dubai"
        >
          <div className="text-3xl font-black text-white leading-none">{isFoundingMember ? '—' : player.owgr}</div>
          <div className="text-[10px] text-green-400 font-medium uppercase tracking-wider">OWGR</div>
        </button>
        <div className="text-2xl">{player.flag}</div>
      </div>
      <div className="w-full h-28 rounded-lg mb-3 flex items-center justify-center text-6xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.15) 0%, rgba(13,148,136,0.15) 100%)', border: '1px solid rgba(22,163,74,0.2)' }}>
        {livePhoto ? <img src={livePhoto} alt={liveName} className="w-full h-full object-cover" style={{ borderRadius: 'inherit' }} /> : '⛳'}
      </div>
      <div className="text-white font-black text-sm uppercase tracking-wide text-center leading-tight mb-0.5">{liveName.split(' ')[0]}</div>
      <div className="text-green-400 font-bold text-xs uppercase tracking-widest text-center mb-3">{liveName.split(' ').slice(1).join(' ')}</div>
      <div className="grid grid-cols-3 gap-1 mb-2">
        {[
          { val: isFoundingMember ? '—' : player.owgr_points.toFixed(1), label: 'PTS AVG' },
          { val: isFoundingMember ? '—' : `#${player.race_to_dubai_pos}`, label: 'DUBAI' },
          { val: isFoundingMember ? '—' : `#${player.career_high_owgr}`, label: 'CAREER' },
        ].map((s, i) => (
          <div key={i} className="text-center bg-black/20 rounded p-1.5">
            <div className="text-white font-black text-xs leading-none">{s.val}</div>
            <div className="text-[8px] text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-gray-500">{player.nationality}</span>
        <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">{player.tour.toUpperCase()}</span>
      </div>
    </div>
    <div className="px-3 py-1.5 text-center border-t border-white/5"
      style={{ background: 'linear-gradient(90deg, rgba(22,163,74,0.3), rgba(13,148,136,0.3))' }}>
      <div className="text-[9px] font-bold text-white/80 uppercase tracking-widest">LUMIO TOUR · GOLF</div>
    </div>
  </div>
  )
}

// ─── AI SECTION COMPONENT ────────────────────────────────────────────────────
interface GolfAISectionProps {
  context: string
  player: GolfPlayer
  session: SportsDemoSession
}

function GolfAISection({ context, player, session }: GolfAISectionProps) {
  if (context !== 'dashboard') return null
  const isDemoShell = session.isDemoShell !== false
  const demoContent = isDemoShell ? getDemoAISummary('golf', context) : null
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const SECTION_PROMPTS: Record<string, string> = {
    dashboard: 'Overview of today\'s priorities: tee time, OWGR movement, key obligations, and any alerts.',
    owgr: 'OWGR ranking analysis: current position, points defending, trajectory to top 50, and Race to Dubai status.',
    strokes: 'Strokes Gained breakdown: identify strengths and weaknesses, compare to tour average, and recommend practice focus.',
    coursefit: 'Course fit analysis: how the player\'s SG profile matches the current event course demands.',
    practicelog: 'Practice session review: recent focus areas, Lumio Range data trends, and recommended next session.',
    sponsorship: 'Sponsorship overview: upcoming obligations, renewal deadlines, and commercial opportunities.',
    travel: 'Travel logistics: upcoming flights, hotel bookings, caddie arrangements, and visa requirements.',
    financial: 'Financial summary: prize money YTD, expense tracking, tax jurisdiction updates, and budget status.',
    mental: 'Mental performance: pre-round routine adherence, pressure management, and Dr. Reed\'s recommendations.',
  }

  const HIGHLIGHTS: Record<string, string[]> = {
    dashboard:    [`Tee time: 09:42 tomorrow — Halden Motors International, Hole 1`, `OWGR #${player.owgr} — ${player.owgr_points} pts avg, 285pts defending this week`, `SG: Putting -1.18 — critical focus for today's session`, `Caddie Mick confirmed: course strategy notes updated`, `Vanta Sports renewal due in 18 days — agent Sarah has proposal`],
    owgr:         [`Current OWGR: #${player.owgr} — up 3 this week`, `285 pts defending this week — need T20+ to hold position`, `Career high #${player.career_high_owgr} achievable with strong summer swing`, `Top-50 OWGR locks Masters 2027 invitation`, `Race to Dubai #${player.race_to_dubai_pos} — need +260pts to reach cut line`],
    strokes:      [`SG: Off the Tee +0.41 — consistent strength this season`, `SG: Putting -1.18 — critical weakness from 8-15ft`, `SG: Approach -0.28 — 7-iron carry 4yd shorter than assumed`, `SG: Around Green +0.15 — bunker technique improving`, `Tee-to-green strong (+0.28) but putting cancels gains`],
    coursefit:     [`Eichenried: 8.1/10 course fit — approach game suits layout`, `Wentworth: 9.0/10 — best course fit on tour for this profile`, `Royal Birkdale: 6.8/10 — links putting historically weak`, `Crans-sur-Sierre: 8.8/10 — altitude approach play is elite`, `Course fit weighted by SG profile vs historical demands`],
    practicelog:  [`Today: 120 min putting session — 8-15ft focus with Pete`, `Short game with Dave yesterday: bunker technique improved`, `Lumio Range: 7-iron carry 168yd — corrected to 6-iron from 172yd`, `Course walk with Mick: holes 7 and 15 identified as scoring holes`, `Pre-round routine: 45 min confirmed for tomorrow AM`],
    sponsorship:  [`Vanta Sports renewal: 18-day deadline — Sarah has proposal ready`, `Vanta Sports content: 2 posts this month (0 done) — post due today`, `Halden Motors Pro-Am: hospitality partner confirmed for tomorrow`, `Vanta Sports call at 16:00 — equipment review discussion`, `Apex Performance apparel obligation confirmed for this event`],
    travel:       [`Munich hotel: confirmed 3 nights (Mon-Thu)`, `Next event: Scottish Open — Edinburgh, 10-13 Jul`, `Caddie Mick: flights confirmed and reimbursed`, `European leg: 4 events confirmed Jul-Sep`, `Halden Motors Championship: Wentworth accommodation via Halden Motors partner deal`],
    financial:    [`Prize money YTD: £367,000`, `This week's purse: $4.5M — cut = £18k, win = £1.32M`, `Agent commission: 10% of endorsement income`, `Multi-jurisdiction tax: 20+ countries, accountant briefed`, `Equipment: Vanta Sports + Vanta Sports cover most costs`],
    mental:       [`Pre-round routine: focus word "committed" — Dr. Reed`, `Putting anxiety cycle identified — tension is the problem, not the putts`, `Last 3 final rounds: 67, 72, 69 — solid closing ability`, `3-breath reset between shots — part of on-course protocol`, `Video call with Dr. Reed tonight at 20:00 — pre-tournament check-in`],
    default:      [`Halden Motors International Open — Munich — R1 tomorrow 09:42`, `OWGR #${player.owgr} — 285pts defending this week`, `SG: Putting -1.18 — today's primary practice focus`, `Vanta Sports renewal due in 18 days`, `Caddie course notes ready for review`],
  }

  const highlights = HIGHLIGHTS[context] ?? HIGHLIGHTS.default

  const generateSummary = async () => {
    setLoading(true)
    try {
      const sectionContext = SECTION_PROMPTS[context] || 'General overview of the player\'s current status.'
      const res = await fetch('/api/ai/golf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are the AI performance analyst for ${session.userName || player.name}, a professional golfer on the ${player.tour}.

Generate a concise AI department summary for the "${context}" section. Focus: ${sectionContext}

Player context: OWGR #${player.owgr}, OWGR points avg ${player.owgr_points}, Race to Dubai #${player.race_to_dubai_pos} (${player.race_to_dubai_points} pts), career high #${player.career_high_owgr}, SG profile: OTT +0.41, ATG -0.28, ARG +0.15, Putting -1.18. Current event: Halden Motors International Open, Munich. Coach: ${player.coach}, Caddie: ${player.caddie}.

Cover the four or five most important insights for this section in one flowing paragraph. Around 120–160 words. Plain prose only — no bullet points, no dashes, no numbered lists, no emoji at the start of lines, no bold, no headers, no markdown.`
          }]
        })
      })
      if (!res.ok) {
        if (res.status === 529) throw new Error('BUSY')
        if (res.status === 401) throw new Error('AUTH')
        throw new Error('GENERIC')
      }
      const data = await res.json()
      const raw = data.content?.map((b: {type:string;text?:string}) => b.type === 'text' ? b.text : '').join('') || ''
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
      <div key={i} className="flex gap-2 text-xs text-gray-300 py-1 border-b border-gray-800/40 last:border-0"><span>{line}</span></div>
    ))

  // Demo shell: static content, no API calls
  const displaySummary = isDemoShell ? (demoContent?.summary || null) : summary
  const displayHighlights = isDemoShell ? (demoContent?.highlights || highlights) : highlights

  if (isDemoShell && !demoContent) {
    console.warn(`[GolfAISection] No demo content for golf/${context}`)
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-800/60">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">🤖 AI Department Intelligence</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><span>✨</span><span className="text-sm font-bold text-white">AI Summary</span></div>
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
              <button onClick={generateSummary} className="w-full py-3 rounded-xl text-xs font-semibold border border-gray-800 text-gray-500 hover:border-green-600/40 hover:text-green-500 transition-all">
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
            <span className="text-[10px] text-green-500 cursor-pointer">Performance</span>
          </div>
          <div className="space-y-2">
            {displayHighlights.map((h, i) => (
              <div key={i} className="flex gap-3 py-1.5 border-b border-gray-800/40 last:border-0">
                <span className="text-xs text-green-500 font-bold flex-shrink-0 w-4">{i+1}</span>
                <span className="text-xs text-gray-300">{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── VIEWS ────────────────────────────────────────────────────────────────────

const POINTS_EXPIRY = [
  { event: 'Genesis Scottish Open', pos: 'T6', points: 330, expires: 'Jul 12 2026', urgency: 'high' },
  { event: 'KLM Open', pos: 'T3', points: 480, expires: 'Jun 7 2026', urgency: 'medium' },
  { event: 'Halden Motors Championship', pos: 'T14', points: 88, expires: 'Sep 6 2026', urgency: 'low' },
  { event: 'Austrian Alpine Open', pos: 'T31', points: 42, expires: 'May 31 2026', urgency: 'medium' },
  { event: 'Hero Indian Open', pos: 'T22', points: 38, expires: 'Mar 29 2026', urgency: 'high' },
]

function getExpiryUrgency(expiresStr: string): { daysLeft: number; color: string; label: string } {
  const expiry = new Date(expiresStr)
  const today = new Date()
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 14) return { daysLeft, color: 'red', label: 'CRITICAL' }
  if (daysLeft <= 30) return { daysLeft, color: 'yellow', label: 'EXPIRING SOON' }
  return { daysLeft, color: 'gray', label: 'Upcoming' }
}

function SeasonIntelligenceStrip() {
  // Results: T14, T6, MC, T3, T31, T8 (most-recent last)
  const results: Array<{ label: string; cutMade: boolean }> = [
    { label: 'T14', cutMade: true },
    { label: 'T6',  cutMade: true },
    { label: 'MC',  cutMade: false },
    { label: 'T3',  cutMade: true },
    { label: 'T31', cutMade: true },
    { label: 'T8',  cutMade: true },
  ];
  const cutsMade = results.filter(r => r.cutMade).length;
  const cutPct = Math.round((cutsMade / results.length) * 100);
  // Consecutive cuts since last MC (working backwards from most recent)
  let streak = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i].cutMade) streak++;
    else break;
  }
  const prize = 367000;
  const cost = 289000;
  const ratio = Math.round((prize / cost) * 100);
  return (
    <div>
      <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">📊 Season Intelligence</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Cut-Made % */}
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Cut-Made %</div>
          <div className="text-2xl font-black text-yellow-400">{cutPct}%</div>
          <div className="text-xs text-gray-500 mb-2">{cutsMade} of last {results.length} events</div>
          <div className="flex items-center gap-1.5">
            {results.map((r, i) => (
              <span key={i} className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${r.cutMade ? 'bg-green-600/20 text-green-300 border border-green-500/30' : 'bg-red-600/20 text-red-300 border border-red-500/30'}`}>
                {r.label}
              </span>
            ))}
          </div>
        </div>

        {/* Consecutive Cuts */}
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Consecutive Cuts</div>
          <div className="text-2xl font-black text-teal-400">{streak}</div>
          <div className="text-xs text-gray-500 mb-2">streak since US Open MC</div>
          <div className="flex items-center gap-1">
            {results.map((r, i) => (
              <span key={i} className={`w-2.5 h-2.5 rounded-full ${r.cutMade ? 'bg-green-500' : 'bg-red-500'}`} />
            ))}
          </div>
        </div>

        {/* Back Nine Avg */}
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Back Nine Avg</div>
          <div className="text-2xl font-black text-orange-400">34.2</div>
          <div className="text-xs text-gray-500 mb-2">vs 33.8 front · +0.4 deficit</div>
          <div className="text-[10px] text-gray-600 leading-tight">Back nine scoring weakness — review 9th, 12th, 15th hole strategies</div>
        </div>

        {/* Prize / Cost ratio */}
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Prize / Cost Ratio</div>
          <div className="text-2xl font-black text-green-400">{ratio}%</div>
          <div className="text-xs text-gray-500 mb-2">£{(prize/1000).toFixed(0)}k earned vs £{(cost/1000).toFixed(0)}k costs</div>
          <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden mb-1">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${Math.min(100, ratio / 2)}%` }} />
          </div>
          <div className="text-[10px] text-gray-600 leading-tight">Above 100% = self-sustaining. Target 200%+</div>
        </div>
      </div>
    </div>
  );
}

function GolfSendMessage({ onClose, player, session }: { onClose: () => void; player: GolfPlayer; session: SportsDemoSession }) {
  const [step, setStep] = useState<'who'|'how'|'message'|'preview'|'sent'>('who')
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [customPerson, setCustomPerson] = useState('')
  const [channels, setChannels] = useState<string[]>(['email'])
  const [messageText, setMessageText] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [aiDraft, setAiDraft] = useState('')
  const [loading, setLoading] = useState(false)

  const TEAM = [
    { name: 'Mick Sullivan', role: 'Caddie', icon: '⛳' },
    { name: 'Carlos Mendez', role: 'Head Coach', icon: '📋' },
    { name: 'Dr Sarah Lee', role: 'Physiotherapist', icon: '⚕️' },
    { name: 'James Wright', role: 'Agent', icon: '💼' },
    { name: 'Petra Novak', role: 'Nutritionist', icon: '🥗' },
    { name: 'Vanta Sports', role: 'Equipment Sponsor', icon: '🏌️' },
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
      const res = await fetch('/api/ai/golf', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, messages: [{ role: 'user',
          content: `Draft a professional but direct message on behalf of ${session.userName || player.name}, a professional golfer (OWGR #${player.owgr}). Recipients: ${allRecipients.join(', ')}. Channel: ${usedChannels.join(', ')}. Message: ${messageText}. ${urgent ? 'This is marked URGENT — prepend with [URGENT] and make the tone immediate.' : ''} Return only the final message text, no preamble. Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.`
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
                  style={{ backgroundColor: i < stepIdx ? '#22C55E' : i === stepIdx ? '#15803D' : 'rgba(255,255,255,0.05)', color: i <= stepIdx ? '#fff' : '#4B5563' }}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <span className="text-xs font-semibold" style={{ color: i === stepIdx ? '#15803D' : i < stepIdx ? '#22C55E' : '#4B5563' }}>{s}</span>
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
                  style={{ backgroundColor: selectedPeople.includes(m.name) ? 'rgba(21,128,61,0.15)' : '#111318', border: selectedPeople.includes(m.name) ? '1px solid rgba(21,128,61,0.5)' : '1px solid #1F2937' }}>
                  <span className="text-lg">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{m.name}</div>
                    <div className="text-[10px]" style={{ color: '#6B7280' }}>{m.role}</div>
                  </div>
                  {selectedPeople.includes(m.name) && <span style={{ color: '#15803D' }}>✓</span>}
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
                  <span key={n} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: 'rgba(21,128,61,0.2)', color: '#4ADE80' }}>{n}</span>
                ))}
              </div>
            )}
            <button onClick={() => setStep('how')} disabled={allRecipients.length === 0}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
              style={{ backgroundColor: allRecipients.length > 0 ? '#15803D' : '#374151' }}>
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
                  style={{ backgroundColor: channels.includes(ch.id) ? 'rgba(21,128,61,0.15)' : '#111318', border: channels.includes(ch.id) ? '1px solid rgba(21,128,61,0.5)' : '1px solid #1F2937' }}>
                  <span className="text-2xl">{ch.icon}</span>
                  <span className="text-sm font-semibold text-white">{ch.label}</span>
                  {channels.includes(ch.id) && <span className="ml-auto" style={{ color: '#15803D' }}>✓</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('who')} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Back</button>
              <button onClick={() => setStep('message')} disabled={channels.length === 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: channels.length > 0 ? '#15803D' : '#374151' }}>
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
              {allRecipients.map(n => <span key={n} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(21,128,61,0.15)', color: '#4ADE80' }}>{n}</span>)}
              <span className="text-xs" style={{ color: '#6B7280' }}>via</span>
              {channels.map(id => <span key={id} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{CHANNELS.find(c => c.id === id)?.label}</span>)}
            </div>
            <textarea value={messageText} onChange={e => setMessageText(e.target.value)} rows={5} placeholder="Type your message..."
              className="w-full px-4 py-3 rounded-xl text-sm text-white resize-none" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setStep('how')} className="py-2.5 px-4 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Back</button>
              <button onClick={() => handleSend(false)} disabled={!messageText.trim() || loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: messageText.trim() ? '#15803D' : '#374151' }}>
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
                style={{ backgroundColor: isUrgent ? '#EF4444' : '#15803D' }}>
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
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>Done</button>
          </div>
        )}
      </div>
    </>
  )
}

// Shared demo-only photo mapping for staff cards across Team sub-tabs (today,
// info, org). Vanta Sports is a sponsor not a person — falls back to initials
// "VS" since /vanta_sports_logo.svg doesn't exist. Mick Sullivan uses
// Dave_Askew.jpg as a substitute (Marcus_Webb.jpg not in /public).
const DEMO_STAFF_PHOTOS: Record<string, string> = {
  'Carlos Mendez': '/Carlos_Mendez.jpg',
  'Mick Sullivan': '/Dave_Askew.jpg',
  'James Crawford': '/Rick_Dalton.jpg',
  'Dr Anna Price': '/Sarah_Lee.jpg',
  'Sarah Chen': '/Elena_Russo.jpg',
  'Dave Morton': '/James_Okafor.jpg',
}

function DashboardView({ player, session, setActiveSection, onOpenModal }: { player: GolfPlayer; session: SportsDemoSession; setActiveSection: (s: string) => void; onOpenModal: (m: string) => void }) {
  const liveProfileName = useGolfProfileName()
  const liveProfilePhoto = useGolfProfilePhoto()
  const isDemoShellDash = session.isDemoShell !== false
  const isPlayerRole = !session.role || session.role === 'player'
  // Founder mode (live) reads Supabase profile values ONLY — never the
  // lumio_golf_* localStorage survivor keys, which are a demo-mode ergonomic.
  // A founder who previously visited the demo shell must not see demo photo
  // / name leaking into their founder view.
  const displayPlayerName = isPlayerRole
    ? (isDemoShellDash
        ? (liveProfileName || session.userName || player.name)
        : (session.userName || player.name))
    : player.name
  const displayPlayerPhoto = isPlayerRole
    ? (isDemoShellDash
        ? (liveProfilePhoto || session.photoDataUrl || '/james_hargreaves.jpg')
        : (session.photoDataUrl?.trim() || null))
    : null
  const firstName = displayPlayerName.split(' ')[0] || 'You'
  const aiSummaryLabel = (() => { const h = new Date().getHours(); return h < 12 ? 'AI Morning Summary' : h < 17 ? 'AI Afternoon Summary' : 'AI Evening Summary' })()
  // Speech state — morning briefing TTS
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [dashTab, setDashTab] = useState<'gettingstarted'|'today'|'quickwins'|'tasks'|'insights'|'dontmiss'|'team'>(() => {
    try { const seen = typeof window !== 'undefined' ? localStorage.getItem('golf_getting_started_seen') : null; return seen ? 'today' : 'gettingstarted' } catch { return 'gettingstarted' }
  });
  const [brandPrimary, setBrandPrimary] = useState(() => {
    try { return typeof window !== 'undefined' ? (localStorage.getItem('lumio_golf_brand_primary') || '#15803d') : '#15803d' } catch { return '#15803d' }
  });
  const [brandSecondary, setBrandSecondary] = useState(() => {
    try { return typeof window !== 'undefined' ? (localStorage.getItem('lumio_golf_brand_secondary') || '#ffffff') : '#ffffff' } catch { return '#ffffff' }
  });
  const [tourStep, setTourStep] = useState(0);
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [roundupOrder, setRoundupOrder] = useState<string[]>(() => {
    try { const saved = typeof window !== 'undefined' ? localStorage.getItem('lumio_golf_roundup_order_v2') : null; return saved ? JSON.parse(saved) : [] } catch { return [] }
  });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [repliedTo, setRepliedTo] = useState<string[]>([]);
  const [replyToast, setReplyToast] = useState(false);
  const [teamSubTab, setTeamSubTab] = useState<'today'|'org'|'info'|'tour'>('today');
  const [scheduleChecked, setScheduleChecked] = useState<Record<string,boolean>>(() => {
    try { return JSON.parse((typeof window !== 'undefined' ? localStorage.getItem('golf_schedule_checked') : null) || '{}') } catch { return {} }
  });
  const [scheduleCancelled, setScheduleCancelled] = useState<Record<string,boolean>>(() => {
    try { return JSON.parse((typeof window !== 'undefined' ? localStorage.getItem('golf_schedule_cancelled') : null) || '{}') } catch { return {} }
  });
  const toggleScheduleItem = (id: string) => {
    setScheduleChecked(prev => {
      const next = { ...prev, [id]: !prev[id] }
      try { localStorage.setItem('golf_schedule_checked', JSON.stringify(next)) } catch {}
      return next
    })
  };
  const cancelScheduleItem = (id: string) => {
    setScheduleCancelled(prev => {
      const next = { ...prev, [id]: true }
      try { localStorage.setItem('golf_schedule_cancelled', JSON.stringify(next)) } catch {}
      return next
    })
  };
  const [dashTasks, setDashTasks] = useState<Array<{ id: string; time: string; title: string; priority: 'critical'|'high'|'medium'|'low'; category: string; action: string; modal: string; custom?: boolean }>>(() => {
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem('golf_custom_tasks') : null
      return s ? JSON.parse(s) : []
    } catch { return [] }
  });
  const [dashTasksChecked, setDashTasksChecked] = useState<Record<string,boolean>>(() => {
    try { return JSON.parse((typeof window !== 'undefined' ? localStorage.getItem('golf_tasks_checked') : null) || '{}') } catch { return {} }
  });
  const toggleDashTaskItem = (id: string) => {
    setDashTasksChecked(prev => {
      const next = { ...prev, [id]: !prev[id] }
      try { localStorage.setItem('golf_tasks_checked', JSON.stringify(next)) } catch {}
      return next
    })
  };
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const dashPhotoInputRef = useRef<HTMLInputElement>(null);
  const [dashPhotoSrc, setDashPhotoSrc] = useState<string | null>(null);
  const [dashPhotoFit, setDashPhotoFit] = useState<'cover'|'contain'>(() => {
    try { return (typeof window !== 'undefined' && localStorage.getItem('lumio_golf_dash_photo_fit') as 'cover'|'contain') || 'cover' } catch { return 'cover' }
  });
  const addCustomTask = () => {
    if (!newTaskTitle.trim()) return
    const id = `custom_${Date.now()}`
    const t: { id: string; time: string; title: string; priority: 'critical'|'high'|'medium'|'low'; category: string; action: string; modal: string; custom?: boolean } = { id, time: 'EOD', title: newTaskTitle.trim(), priority: 'medium', category: 'Custom', action: 'Open', modal: '', custom: true }
    setDashTasks(prev => {
      const next = [...prev, t]
      try { localStorage.setItem('golf_custom_tasks', JSON.stringify(next)) } catch {}
      return next
    })
    setNewTaskTitle('')
    setShowAddTask(false)
  };
  const recentForm = [
    { event: 'Halden Motors Championship', pos: '14', points: 88, prize: '£42k' },
    { event: 'Scottish Open', pos: '6', points: 330, prize: '£198k' },
    { event: 'US Open', pos: 'MC', points: 0, prize: '£0' },
    { event: 'KLM Open', pos: '3', points: 480, prize: '£124k' },
    { event: 'Austrian Alpine', pos: '31', points: 42, prize: '£18k' },
  ];

  // ─── MORNING ROUNDUP DATA ──────────────────────────────────────────────────
  const ROUNDUP_ITEMS: { id: string; label: string; icon: string; count: number; urgent: boolean; color: string; messages: { id: string; from: string; text: string; time: string }[] }[] = [
    { id: 'sms', label: 'SMS', icon: '📲', count: 2, urgent: false, color: '#0EA5E9', messages: [
      { id: 'sms1', from: 'Mick Sullivan', text: 'Back on the range at 07:45 — bring the 3-wood, I want to check the face angle from yesterday.', time: '06:55' },
      { id: 'sms2', from: 'James Crawford', text: 'Vanta reply needed today. Call me when you\'re off the range — 5 min, no more.', time: '08:18' },
    ]},
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬', count: 4, urgent: false, color: '#25D366', messages: [
      { id: 'wa1', from: 'Team chat', text: 'Mick: yardage book updated with R2 pin sheet. Attached.', time: '08:40' },
      { id: 'wa2', from: 'Dr Anna Price', text: 'Heat pack on before breakfast — 10 min lower back. See you 13:00.', time: '07:15' },
      { id: 'wa3', from: 'Sarah Chen', text: 'Caption draft for Vanta post — check the tone. Needs to go live before 18:00.', time: '09:05' },
      { id: 'wa4', from: 'Home 💙', text: 'Kids up early watching the stream. Go get it dad ⛳', time: '06:30' },
    ]},
    { id: 'email', label: 'Email', icon: '✉️', count: 9, urgent: false, color: '#6366F1', messages: [
      { id: 'em1', from: 'DP World Tour Admin', text: 'R2 tee times official release attached. Draw for R3 posted by 20:00 local.', time: '07:20' },
      { id: 'em2', from: 'Vanta Sports Partnerships', text: 'Extension term sheet + brand obligations doc attached. James has the summary.', time: '07:48' },
      { id: 'em3', from: 'Accountant', text: 'Q1 tax residency memo — sign and return before the Scottish Open swing.', time: '08:02' },
      { id: 'em4', from: 'Range Coach', text: 'Lumio Range session data + launch-monitor notes attached. 7-iron carry +1.3 yards on average.', time: '08:15' },
      { id: 'em5', from: 'Marine North Berwick', text: 'Scottish Open reservation confirmed — 4 nights, partial release window 30 Jun.', time: '08:30' },
      { id: 'em6', from: 'Entry Desk', text: 'Scottish Open entry submitted. Exemption confirmed. Confirmation email attached.', time: '08:45' },
      { id: 'em7', from: 'Halden Motors', text: 'Pro-Am pairing memo attached — your partner is a Halden board member.', time: 'Yesterday' },
      { id: 'em8', from: 'Tour Weekly', text: 'Feature request: 5-minute interview after R2 if top-10. Reply yes/no.', time: 'Yesterday' },
      { id: 'em9', from: 'Fan-club', text: 'May mailout — 50 signed caps promised. Courier booked for Monday pickup.', time: '2 days ago' },
    ]},
    { id: 'agent', label: 'Agent Messages', icon: '📞', count: 2, urgent: true, color: '#8B5CF6', messages: [
      { id: 'ag1', from: 'James Crawford', text: 'Vanta Sports want to extend the deal — new terms attached. £65k/yr + equipment. Need your sign-off by Friday.', time: '08:12' },
      { id: 'ag2', from: 'James Crawford', text: 'Halden Motors Pro-Am appearance fee confirmed: £12,000 + travel. Hospitality tent tomorrow 14:30.', time: '07:45' },
    ]},
    { id: 'tournament', label: 'Tournament Desk', icon: '🏆', count: 3, urgent: true, color: '#D97706', messages: [
      { id: 'td1', from: 'DP World Tour', text: 'R2 tee time confirmed: 09:24, Hole 1, with R. Hartwell & S. Donovan.', time: '06:30' },
      { id: 'td2', from: 'Entry Desk', text: 'Scottish Open entry deadline closes TODAY at 17:00. Your entry is pending.', time: '07:00' },
      { id: 'td3', from: 'Halden Motors International', text: 'Practice range opens 06:00 tomorrow. Pin positions for R2 posted to caddie app.', time: '08:00' },
    ]},
    { id: 'caddie', label: 'Caddie Notes', icon: '🏌️', count: 2, urgent: false, color: '#15803D', messages: [
      { id: 'cn1', from: 'Mick Sullivan', text: 'Updated hole 7 strategy — 9-iron not 8 from the new tee. Pin back-left, aim 15ft right.', time: '08:30' },
      { id: 'cn2', from: 'Mick Sullivan', text: 'Yardage book corrections for holes 12 and 15. Wind forecast changed — switching to low ball flight plan.', time: '07:15' },
    ]},
    { id: 'sponsor', label: 'Media & Sponsor', icon: '📱', count: 3, urgent: false, color: '#EA580C', messages: [
      { id: 'sp1', from: 'Sarah Chen', text: 'Vanta Sports post due before 18:00 — caption drafted and attached. Just need your photo from the range.', time: '09:00' },
      { id: 'sp2', from: 'Sarah Chen', text: 'Northbridge Sport interview request for post-round — 5 min, greenside. Confirmed tentatively.', time: '08:45' },
      { id: 'sp3', from: 'Carlos Mendez', text: 'Range session notes sent — focus on 7-iron carry distance today. Lumio Range data attached.', time: '07:30' },
    ]},
    { id: 'physio', label: 'Physio & Medical', icon: '⚕️', count: 1, urgent: true, color: '#EF4444', messages: [
      { id: 'ph1', from: 'Dr Anna Price', text: 'Lower back — mild stiffness. Cleared for play. Treatment booked 13:00. Ice 15 min post-round.', time: '07:00' },
    ]},
    { id: 'travel', label: 'Travel & Hotels', icon: '✈️', count: 2, urgent: false, color: '#06B6D4', messages: [
      { id: 'tr1', from: 'James Crawford', text: 'Scottish Open hotel — prices rising fast. Best option: Marine North Berwick, £280/night. Book today?', time: '08:20' },
      { id: 'tr2', from: 'Mick Sullivan', text: 'My Edinburgh flights confirmed for Scottish Open. Arriving Wed evening.', time: '07:50' },
    ]},
    { id: 'financial', label: 'Financial', icon: '💰', count: 1, urgent: false, color: '#EAB308', messages: [
      { id: 'fi1', from: 'Accountant', text: 'Prize money YTD: £367,000. Season target: £450k. Munich expenses need submitting by EOD Friday.', time: '09:10' },
    ]},
  ];

  const WorldClock = ({ city, offset }: { city: string; offset: number }) => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const cityTime = new Date(utc + offset * 3600000);
    const h = cityTime.getHours().toString().padStart(2, '0');
    const m = cityTime.getMinutes().toString().padStart(2, '0');
    return (
      <div className="text-center">
        <div className="text-xs text-gray-500">{city}</div>
        <div className="text-sm font-bold text-white">{h}:{m}</div>
      </div>
    );
  };

  // ── Smart briefing TTS — matches tennis/darts/boxing ──────────────────
  const getVoicesReady = (): Promise<SpeechSynthesisVoice[]> => new Promise(resolve => {
    if (typeof window === 'undefined') return resolve([])
    const v = window.speechSynthesis.getVoices()
    if (v.length > 0) return resolve(v)
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices())
  })
  const speakBriefing = async () => {
    if (typeof window === 'undefined') return
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return }
    window.speechSynthesis.cancel()
    const scheduleRaw = [
      { id:'gs1', time:'07:00', label:'Range session — 90 min',              highlight:false },
      { id:'gs2', time:'08:30', label:'Caddie brief with Mick — hole plans', highlight:false },
      { id:'gs3', time:'09:24', label:'R2 tee time — with Hartwell, Donovan', highlight:true },
      { id:'gs4', time:'13:00', label:'Physio — lower back treatment',       highlight:false },
      { id:'gs5', time:'15:00', label:'Lumio Range session review',             highlight:false },
      { id:'gs6', time:'17:00', label:'Scottish Open entry deadline',        highlight:true },
      { id:'gs7', time:'18:00', label:'Vanta Sports sponsor post — caption due', highlight:false },
      { id:'gs8', time:'20:00', label:'Post-round media & debrief',          highlight:false },
    ]
    const scheduleForBriefing = buildScheduleItems(
      scheduleRaw,
      new Set(Object.entries(scheduleChecked).filter(([, v]) => v).map(([k]) => k)),
      new Set(Object.entries(scheduleCancelled).filter(([, v]) => v).map(([k]) => k)),
    )
    const briefingText = generateSmartBriefing({
      now: new Date(),
      playerName: displayPlayerName,
      schedule: scheduleForBriefing,
      match: { opponent: 'R2 at Golfclub München Eichenried', time: '09:24', result: null },
      roundupSummary: buildRoundupSummary(ROUNDUP_ITEMS),
      sport: 'golf',
      timezone: getUserTimezone(),
      extra: `You're ranked #${player.owgr} in the OWGR with ${player.owgr_points.toLocaleString()} points, #${player.race_to_dubai_pos} on the Race to Dubai.`,
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

  return (
    <div className="space-y-6">
      {/* ── PERSONAL BANNER — matching tennis pattern exactly ── */}
      <div className="relative rounded-2xl overflow-hidden mb-4 p-6"
        style={{ background: 'linear-gradient(135deg, #052e16 0%, #0f172a 60%, #0c1321 100%)', border: '1px solid rgba(21,128,61,0.2)' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">Good morning, {firstName} ⛳</h1>
              <button onClick={speakBriefing} title={isSpeaking ? 'Stop reading' : 'Text-to-Speech — Lumio Golf will read your morning headlines, round schedule and urgent items aloud. Upgrade for 20 human-sounding voices.'} className="flex items-center justify-center rounded-lg transition-all"
                style={{ width: 32, height: 32, flexShrink: 0, backgroundColor: isSpeaking ? 'rgba(21,128,61,0.25)' : 'rgba(255,255,255,0.08)', border: isSpeaking ? '1px solid rgba(21,128,61,0.5)' : '1px solid rgba(255,255,255,0.12)', color: isSpeaking ? '#4ade80' : '#9CA3AF' }}>
                <Volume2 size={15} strokeWidth={1.75} />
              </button>
            </div>
            <p className="text-sm mb-2" style={{ color: '#9CA3AF' }}>
              {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </p>
            <p className="text-xs italic" style={{ color: '#facc15' }}>
              &ldquo;{getDailyQuote(GOLF_QUOTES).text}&rdquo; &mdash; {getDailyQuote(GOLF_QUOTES).author}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 ml-4">
            {[
              { icon:'📊', value: isDemoShellDash ? `#${player.owgr}` : '—', label:'OWGR', color:'#15803D' },
              { icon:'🏆', value: isDemoShellDash ? `#${player.race_to_dubai_pos}` : '—', label:'Race', color:'#0D9488' },
              { icon:'💰', value: isDemoShellDash ? '£367k' : '—', label:'Earnings', color:'#F59E0B' },
              { icon:'🎯', value: isDemoShellDash ? '70.2' : '—', label:'Scoring', color:'#8B5CF6' },
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
              <span className="text-lg font-black text-white">22°C</span>
              <span className="text-xs opacity-70">Munich</span>
            </div>
            <div className="flex flex-col justify-center px-3 h-[72px] rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minWidth: '120px' }}>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                {[{ city:'London', tz:'Europe/London', isUser:true },{ city:'New York', tz:'America/New_York', isUser:false },{ city:'Ashbourne', tz:'America/New_York', isUser:false },{ city:'Dubai', tz:'Asia/Dubai', isUser:false }].map(({ city, tz, isUser }) => (
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

      {/* Tab Bar */}
      <div className="flex items-center gap-0 border-b border-gray-800/50" style={{ overflowX: 'hidden' }}>
        <button onClick={() => setDashTab('gettingstarted')}
          className="flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all -mb-px"
          style={{ borderBottomColor: dashTab === 'gettingstarted' ? '#15803D' : 'transparent', color: dashTab === 'gettingstarted' ? '#4ade80' : '#6B7280', backgroundColor: dashTab === 'gettingstarted' ? '#15803D0d' : 'transparent' }}>
          <span className="text-base">🚀</span>Getting Started
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: '#15803D' }}>10</span>
        </button>
        {([
          { id: 'today' as const, label: 'Today', icon: '🏠' },
          { id: 'quickwins' as const, label: 'Quick Wins', icon: '⚡' },
          { id: 'tasks' as const, label: 'Daily Tasks', icon: '✅' },
          { id: 'insights' as const, label: 'Insights', icon: '📊' },
          { id: 'dontmiss' as const, label: "Don't Miss", icon: '🔴' },
          { id: 'team' as const, label: 'Team', icon: '👥' },
        ]).map(t => (
          <button key={t.id} onClick={() => setDashTab(t.id)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all -mb-px"
            style={{ borderBottomColor: dashTab === t.id ? '#15803D' : 'transparent', color: dashTab === t.id ? '#4ade80' : '#6B7280', backgroundColor: dashTab === t.id ? '#15803D0d' : 'transparent' }}>
            <span className="text-base">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Quick Actions — below tab bar (Today only) */}
      {dashTab === 'today' && <div className="mb-5 mt-4">
        <div className="text-xs font-bold uppercase tracking-wider mb-2.5 px-1" style={{ color: '#4B5563' }}>Quick actions</div>
        <div className="flex flex-wrap gap-2">
          {[
            { id:'sendmessage', label:'Send Message', icon:'📨', color:'#15803D', hot:false },
            { id:'flight', label:'Smart Flights', icon:'✈️', color:'#0ea5e9', hot:true },
            { id:'hotel', label:'Find Hotel', icon:'🏨', color:'#0ea5e9', hot:true },
            { id:'coursestrategy', label:'Course Notes AI', icon:'🗺️', color:'#15803D', hot:true },
            { id:'loground', label:'Log Round', icon:'📋', color:'#15803D', hot:false },
            { id:'trackman', label:'Lumio Range Session', icon:'📡', color:'#0ea5e9', hot:true },
            { id:'caddiebriefai', label:'Caddie Brief', icon:'🏌️', color:'#F59E0B', hot:true },
            { id:'sponsorpost', label:'Sponsor Post', icon:'📱', color:'#F59E0B', hot:true },
            { id:'ranking', label:'Ranking Sim', icon:'📊', color:'#0ea5e9', hot:true },
            { id:'injury', label:'Log Injury', icon:'💊', color:'#EF4444', hot:false },
            { id:'expense', label:'Add Expense', icon:'💰', color:'#6B7280', hot:false },
            { id:'mentalprep', label:'Mental Prep', icon:'🧠', color:'#8B5CF6', hot:true },
            { id:'socialmedia', label:'Social Media AI', icon:'📲', color:'#8B5CF6', hot:true },
            { id:'visa', label:'Visa Check', icon:'🌍', color:'#6B7280', hot:true },
          ].map(a => (
            <button key={a.id} onClick={() => onOpenModal(a.id)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap shrink-0 relative"
              style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-secondary)' }}>
              <span>{a.icon}</span>{a.label}
              {a.hot && <span className="absolute -top-1 -right-1 text-[8px] px-1 py-0.5 rounded-full font-black leading-none" style={{ backgroundColor: 'var(--brand-secondary)', color: 'var(--brand-primary)' }}>AI</span>}
            </button>
          ))}
        </div>
      </div>}

      {/* Getting Started */}
      {dashTab === 'gettingstarted' && (() => {
        const TOUR_STEPS = [
          { n:1, label:'Your golf OS, fully connected', icon:'⛳', preview:'dashboard' },
          { n:2, label:'Start every tournament week knowing everything', icon:'🌅', preview:'briefing' },
          { n:3, label:'Every action, one click away', icon:'⚡', preview:'actions' },
          { n:4, label:'Tour travel sorted in 60 seconds', icon:'✈️', preview:'travel' },
          { n:5, label:'Every shot tracked, every ranking point counted', icon:'📊', preview:'performance' },
          { n:6, label:'Your team, always in the loop', icon:'👥', preview:'team' },
          { n:7, label:'AI that actually improves your game', icon:'🤖', preview:'ai' },
          { n:8, label:'Sponsors managed automatically', icon:'🤝', preview:'sponsor' },
          { n:9, label:'Nothing falls through the cracks', icon:'🔔', preview:'dontmiss' },
          { n:10, label:'Run your golf career like a business', icon:'🏆', preview:'cta' },
        ]
        const step = TOUR_STEPS[tourStep]
        const goLive = () => { localStorage.setItem('golf_getting_started_seen', 'true'); setDashTab('today') }
        return (
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 mr-4">
                <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#15803D' }}>STEP {tourStep + 1} OF {TOUR_STEPS.length}</div>
                <div className="w-full bg-gray-800 rounded-full h-1"><div className="h-1 rounded-full transition-all duration-500" style={{ width: `${((tourStep + 1) / TOUR_STEPS.length) * 100}%`, backgroundColor: '#15803D' }} /></div>
              </div>
              <button onClick={goLive} className="text-sm flex-shrink-0" style={{ color: '#4B5563' }}>Skip tour →</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                {TOUR_STEPS.map((s, i) => (
                  <button key={s.n} onClick={() => setTourStep(i)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{ backgroundColor: tourStep === i ? 'rgba(21,128,61,0.1)' : 'transparent', border: tourStep === i ? '1px solid rgba(21,128,61,0.3)' : '1px solid transparent' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: i < tourStep ? '#22C55E' : tourStep === i ? '#15803D' : 'rgba(255,255,255,0.05)', color: i <= tourStep ? '#fff' : '#4B5563' }}>
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
                    {step.preview === 'dashboard' && (<><h2 className="text-xl font-black text-white mb-2">Your golf OS, fully connected.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>One portal replaces the 6 tools you probably use right now. World rankings, tournament schedule, Lumio Range data, sponsors, travel, your team — all connected.</p><div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(21,128,61,0.06)', border: '1px solid rgba(21,128,61,0.2)' }}><div className="text-xs text-gray-400 mb-3">Your dashboard — live right now</div><div className="grid grid-cols-4 gap-2">{[{ icon:'📊', v:`#${player.owgr}`, label:'OWGR', c:'#15803D' },{ icon:'🏆', v:`#${player.race_to_dubai_pos}`, label:'Race', c:'#0D9488' },{ icon:'💰', v:'£367k', label:'Season', c:'#F59E0B' },{ icon:'🎯', v:'70.2', label:'Scoring', c:'#8B5CF6' }].map((s, i) => (<div key={i} className="rounded-lg p-2 text-center" style={{ backgroundColor: '#0a0c14' }}><div className="text-lg">{s.icon}</div><div className="text-xs font-black mt-0.5" style={{ color: s.c }}>{s.v}</div><div className="text-[9px] mt-0.5" style={{ color: '#4B5563' }}>{s.label}</div></div>))}</div><div className="mt-3 grid grid-cols-2 gap-2 text-[10px]"><div className="rounded-lg p-2" style={{ backgroundColor: '#0a0c14' }}><span className="text-gray-500">Next event:</span> <span className="text-white font-semibold">Masters — Ashbourne National</span></div><div className="rounded-lg p-2" style={{ backgroundColor: '#0a0c14' }}><span className="text-gray-500">Tee time:</span> <span className="text-white font-semibold">09:24 R2 — Hole 1</span></div></div></div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}><span style={{ color: '#15803D' }}>⛳</span> <span style={{ color: '#9CA3AF' }}>Used by DP World Tour and PGA Tour players to manage their season end to end.</span></div>{/* Brand Colours — only in step 1 detail */}<div className="mt-4 space-y-3"><div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>Brand Colours</div><p className="text-xs" style={{ color: '#6B7280' }}>Use your club or personal brand colours. Primary fills buttons and accents, secondary is your text colour.</p><div className="flex items-center gap-4"><div><label className="text-xs block mb-1" style={{ color: '#9CA3AF' }}>Primary</label><input type="color" value={brandPrimary} onChange={e => { setBrandPrimary(e.target.value); localStorage.setItem('lumio_golf_brand_primary', e.target.value); window.dispatchEvent(new Event('lumio-profile-updated')) }} className="w-12 h-8 rounded cursor-pointer" style={{ border: '1px solid #374151' }} /></div><div><label className="text-xs block mb-1" style={{ color: '#9CA3AF' }}>Secondary</label><input type="color" value={brandSecondary} onChange={e => { setBrandSecondary(e.target.value); localStorage.setItem('lumio_golf_brand_secondary', e.target.value); window.dispatchEvent(new Event('lumio-profile-updated')) }} className="w-12 h-8 rounded cursor-pointer" style={{ border: '1px solid #374151' }} /></div><div className="flex-1"><label className="text-xs block mb-1" style={{ color: '#9CA3AF' }}>Preview</label><div className="flex items-center gap-2"><div className="rounded-lg px-4 py-1.5 text-xs font-semibold" style={{ backgroundColor: brandPrimary, color: brandSecondary }}>Button preview</div><div className="rounded-lg px-4 py-1.5 text-xs font-semibold" style={{ backgroundColor: `${brandPrimary}26`, color: brandPrimary, border: `1px solid ${brandPrimary}4d` }}>Outline preview</div></div></div></div></div></>)}
                    {step.preview === 'briefing' && (<><h2 className="text-xl font-black text-white mb-2">Start every tournament week knowing everything.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Your AI morning briefing covers today&apos;s tee time, course conditions, caddie notes, sponsor obligations and travel — all in 60 seconds.</p><div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid rgba(21,128,61,0.2)' }}><div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid #1F2937', background: 'rgba(21,128,61,0.06)' }}><span>✨</span><span className="text-sm font-semibold text-white">{aiSummaryLabel}</span><span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(21,128,61,0.12)', color: '#15803D' }}>Today</span></div><div className="p-4 space-y-2.5" style={{ backgroundColor: '#0a0c14' }}>{[{ icon:'⛳', text:'Tee time 09:24 R2 Ashbourne National. Wind 14mph SW — affects Valley Turn significantly.' },{ icon:'🤝', text:'Vanta Sports content post due by 12:00 — Instagram photo needed. Penalty clause.' },{ icon:'✈️', text:'Madrid hotel confirmed for next week. Transfer from airport arranged.' },{ icon:'📊', text:'Cut line projected +2. You are -3 after R1. GIR% yesterday: 72% — above season avg.' }].map((item, i) => (<div key={i} className="flex gap-2.5 text-[11px]"><span className="flex-shrink-0">{item.icon}</span><span style={{ color: '#D1D5DB' }}>{item.text}</span></div>))}</div></div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}><span>🔊</span> <span style={{ color: '#9CA3AF' }}>Press the speaker button every morning. Sarah reads it while you warm up on the range.</span></div></>)}
                    {step.preview === 'actions' && (<><h2 className="text-xl font-black text-white mb-2">Every action, one click away.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>14 quick actions — book the cheapest flights, log a Lumio Range session, get caddie notes AI-generated, file a physio report, post sponsor content.</p><div className="flex flex-wrap gap-2 mb-4">{[{ label:'Smart Flights', icon:'✈️', hot:true },{ label:'Find Hotel', icon:'🏨', hot:true },{ label:'Course Notes AI', icon:'🗺️', hot:true },{ label:'Log Round', icon:'📋', hot:false },{ label:'Lumio Range Session', icon:'📡', hot:true },{ label:'Caddie Brief', icon:'⛳', hot:true }].map((a, i) => (<span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold relative" style={{ backgroundColor: a.hot ? '#16A34A' : '#1F2937', color: a.hot ? '#fff' : '#9CA3AF' }}><span>{a.icon}</span>{a.label}{a.hot && <span className="absolute -top-1 -right-1 text-[7px] px-1 py-0.5 rounded-full font-black" style={{ backgroundColor: '#fff', color: '#16A34A' }}>AI</span>}</span>))}</div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)' }}><span>🗺️</span> <span style={{ color: '#0ea5e9' }}>Course Notes AI pulls the latest course data, pin positions and weather forecast and briefs your caddie in 10 seconds.</span></div></>)}
                    {step.preview === 'travel' && (<><h2 className="text-xl font-black text-white mb-2">Tour travel sorted in 60 seconds.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Smart Flights finds the cheapest flights to every DP World Tour and PGA Tour venue. Smart Hotel finds the best course-adjacent hotels.</p><div className="space-y-2 mb-4"><div className="rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid rgba(14,165,233,0.3)' }}><div className="flex items-center justify-between mb-1"><span className="text-xs font-bold text-white">Delta · DL 417</span><span className="text-xs font-black" style={{ color: '#22C55E' }}>£687 return</span></div><div className="text-[10px] text-gray-400">London LHR → Ashbourne Regional · 9h 45m · 1 stop ATL</div><div className="mt-1"><span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(14,165,233,0.15)', color: '#0ea5e9' }}>BEST VALUE</span></div></div><div className="rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}><div className="flex items-center justify-between mb-1"><span className="text-xs font-bold text-white">🏨 Ashbourne Marriott</span><span className="text-xs font-bold" style={{ color: '#F59E0B' }}>£189/night</span></div><div className="text-[10px] text-gray-400">1.2km from Ashbourne National · Driving range ✅ · 8.7 rating</div></div></div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}><span style={{ color: '#F59E0B' }}>💰</span> <span style={{ color: '#F59E0B' }}>Tour players using Smart Flights save an average of £890 per tournament. That&apos;s £18k over a 20-event season.</span></div></>)}
                    {step.preview === 'performance' && (<><h2 className="text-xl font-black text-white mb-2">Every shot tracked. Every ranking point counted.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>OWGR ranking, Race to Dubai standing, scoring average, GIR%, driving distance, putting average — all updated after every round.</p><div className="grid grid-cols-2 gap-3 mb-4">{[{ label:'OWGR', value:`#${player.owgr}`, sub:'↑ 4 this month', color:'#15803D' },{ label:'Race to Dubai', value:`#${player.race_to_dubai_pos}`, sub:`${player.owgr_points.toFixed(0)} pts`, color:'#0D9488' },{ label:'Scoring Avg', value:'70.2', sub:'Tour avg: 71.1', color:'#F97316' },{ label:'Form (last 5)', value:'MC-6-3-1-MC', sub:'2 top-10s', color:'#8B5CF6' }].map((s, i) => (<div key={i} className="rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}><div className="text-[10px] text-gray-500 mb-1">{s.label}</div><div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div><div className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{s.sub}</div></div>))}</div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}><span>📈</span> <span style={{ color: '#9CA3AF' }}>The Ranking Simulator shows you exactly what you need to finish this week to break into the top 50.</span></div></>)}
                    {step.preview === 'team' && (<><h2 className="text-xl font-black text-white mb-2">Your team. Everyone sees their own view.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Your whole team connected — but each role gets their own tailored view. Your coach, physio, sponsor and agent see only what&apos;s relevant to them. You control what each role can see.</p><div className="space-y-2 mb-4">{[{ name:'Mick Sullivan', role:'Caddie', status:'Course notes sent for R2', color:'#15803D' },{ name:'Carlos Mendez', role:'Coach', status:'Swing review at 17:00', color:'#0D9488' },{ name:'James Wright', role:'Agent', status:'Vanta Sports renewal pending', color:'#F59E0B' },{ name:'Dr Sarah Lee', role:'Physio', status:'Back treatment 18:00', color:'#0ea5e9' }].map((m, i) => (<div key={i} className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}><div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: `${m.color}20`, color: m.color }}>{m.name.split(' ').map(w => w[0]).join('')}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-xs font-bold text-white">{m.name}</span><span className="text-[9px]" style={{ color: m.color }}>{m.role}</span></div><div className="text-[10px] text-gray-500">{m.status}</div></div><div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" /></div>))}</div><div className="mt-4 mb-3"><div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Everyone gets their own view</div><p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>Your coach sees training & tactical data. Your physio sees medical & recovery only. Your sponsor sees brand activation & ROI. Your agent sees contracts & commercials. You stay in control — switch role any time from the bottom of the sidebar.</p><div className="grid grid-cols-2 gap-2">{[{ icon:'🎯', role:'Player view', desc:'Full access — everything', color:'#15803d' },{ icon:'📋', role:'Coach view', desc:'Training, tactics, performance', color:'#22C55E' },{ icon:'⚕️', role:'Medical / Physio', desc:'Injury log, load, recovery only', color:'#EF4444' },{ icon:'🤝', role:'Sponsor / Partner', desc:'Brand visibility, obligations, ROI', color:'#F59E0B' },{ icon:'💼', role:'Agent / Manager', desc:'Contracts, commercials, schedule', color:'#0ea5e9' }].map((v, i) => (<div key={i} className="flex items-center gap-2 rounded-lg p-2.5" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}><span className="text-base flex-shrink-0">{v.icon}</span><div className="min-w-0"><div className="text-xs font-bold text-white truncate">{v.role}</div><div className="text-[10px] truncate" style={{ color: v.color }}>{v.desc}</div></div></div>))}</div></div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}><span>📨</span> <span style={{ color: '#9CA3AF' }}>Your caddie book syncs automatically with the course notes AI. No more WhatsApp chains the night before.</span></div></>)}
                    {step.preview === 'ai' && (<><h2 className="text-xl font-black text-white mb-2">AI analysis that actually improves your game.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Course Notes AI pulls pin positions, wind history and green speed. Lumio Range AI spots patterns. Caddie Brief AI writes the full hole-by-hole strategy.</p><div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#0a0c14', border: '1px solid rgba(139,92,246,0.3)' }}><div className="flex items-center gap-2 mb-2"><span>🤖</span><span className="text-xs font-bold" style={{ color: '#A78BFA' }}>Course Notes AI — Ashbourne National R2</span></div><div className="space-y-2 text-[11px]" style={{ color: '#D1D5DB' }}><p>Back 9 playing 2.1 shots harder than front. Wind 14mph SW — affects 11, 12, 13 significantly.</p><p>Your GIR% on par 5s this season: 89%. Attack 15 in 2 — you&apos;re 4 for 5 this season.</p><p>Avoid short-left on 12. Pin is back-right today — bail-out centre is the play.</p></div><div className="text-[9px] mt-3" style={{ color: '#6B7280' }}>Generated using course data, weather API and Lumio Range history · Claude AI</div></div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}><span style={{ color: '#A78BFA' }}>🤖</span> <span style={{ color: '#A78BFA' }}>Powered by Claude AI · Anthropic · The same AI trusted by Fortune 500 companies.</span></div></>)}
                    {step.preview === 'sponsor' && (<><h2 className="text-xl font-black text-white mb-2">Never miss a sponsor obligation again.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Content shoots, Instagram posts, appearance fees, equipment contracts — all tracked. Social Media AI writes the post, you approve it, one click posts it.</p><div className="space-y-2 mb-4">{[{ name:'Vanta Sports', status:'Instagram post due today — photo needed before 12:00', badge:'DUE NOW', badgeColor:'#EF4444', value:'£120k/yr' },{ name:'Meridian Watches', status:'Renewal meeting Apr 25 — agent handling', badge:'RENEWAL', badgeColor:'#F59E0B', value:'£85k/yr' },{ name:'Dubai Tourism', status:'Appearance inquiry — £45k — respond by Apr 30', badge:'NEW DEAL', badgeColor:'#22C55E', value:'£45k' }].map((s, i) => (<div key={i} className="flex items-center justify-between rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-xs font-bold text-white">{s.name}</span><span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${s.badgeColor}20`, color: s.badgeColor }}>{s.badge}</span></div><div className="text-[10px] text-gray-500 mt-0.5">{s.status}</div></div><span className="text-xs font-bold" style={{ color: '#F59E0B' }}>{s.value}</span></div>))}</div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}><span>📱</span> <span style={{ color: '#9CA3AF' }}>Sponsor Post AI generates the Instagram caption in your voice. Takes 8 seconds.</span></div></>)}
                    {step.preview === 'dontmiss' && (<><h2 className="text-xl font-black text-white mb-2">Nothing falls through the cracks.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Don&apos;t Miss catches everything — entry deadlines, world ranking points dropping off, visa expiry, sponsor deadlines.</p><div className="space-y-2 mb-4">{[{ badge:'ALERT', bg:'rgba(220,38,38,0.15)', color:'#EF4444', text:'180 OWGR points drop off after this event. Finish T20 or better to hold #87.', sub:'Miss = drop to #94 — lose exemptions' },{ badge:'8 DAYS', bg:'rgba(245,158,11,0.15)', color:'#F59E0B', text:'The Open Championship entry deadline closes.', sub:'Lumio flagged this 30 days out' },{ badge:'TODAY', bg:'rgba(220,38,38,0.15)', color:'#EF4444', text:'Vanta Sports Instagram post due by 12:00. Penalty clause.', sub:'Content obligation — contractual' }].map((d, i) => (<div key={i} className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: '#0a0c14' }}><span className="text-[9px] px-2 py-1 rounded font-black flex-shrink-0 mt-0.5" style={{ background: d.bg, color: d.color }}>{d.badge}</span><div><div className="text-[11px] text-white">{d.text}</div><div className="text-[10px] italic mt-0.5" style={{ color: '#EF4444' }}>{d.sub}</div></div></div>))}</div><div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}><span>📋</span> <span style={{ color: '#9CA3AF' }}>Entry deadline for The Open Championship closes in 8 days. Lumio flagged this 30 days out.</span></div></>)}
                    {step.preview === 'cta' && (<><h2 className="text-xl font-black text-white mb-2">Run your golf career like a business.</h2><p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Rankings, travel, Lumio Range data, sponsors, team, AI analysis — all in one place. Built for DP World Tour and PGA Tour professionals.</p><div className="grid grid-cols-3 gap-2 mb-4">{[{ icon:'📊', label:'OWGR Rankings', desc:'Live tracking' },{ icon:'✈️', label:'Smart Travel', desc:'Flights + hotels' },{ icon:'🤖', label:'AI Analysis', desc:'Course + caddie' },{ icon:'🤝', label:'Sponsors', desc:'Obligations tracked' },{ icon:'👥', label:'Team Hub', desc:'Everyone connected' },{ icon:'📡', label:'Lumio Range', desc:'Session data' }].map((f, i) => (<div key={i} className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}><div className="text-xl mb-1">{f.icon}</div><div className="text-[10px] font-bold text-white">{f.label}</div><div className="text-[9px] text-gray-500">{f.desc}</div></div>))}</div><div className="rounded-xl p-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(21,128,61,0.1), rgba(13,148,136,0.1))', border: '1px solid rgba(21,128,61,0.25)' }}><div className="text-sm font-bold text-white mb-1">3-month free trial — no card required</div><div className="text-[11px] mb-3" style={{ color: '#9CA3AF' }}>Connect your real data in under 10 minutes. Cancel anytime.</div><div className="flex justify-center gap-2"><button onClick={goLive} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: '#15803D' }}>Go to my dashboard →</button><button className="px-4 py-2 rounded-xl text-xs font-bold" style={{ border: '1px solid #374151', color: '#9CA3AF' }}>Invite my caddie →</button></div></div><div className="rounded-lg p-3 mt-4 text-[11px]" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}><span style={{ color: '#F59E0B' }}>🏆</span> <span style={{ color: '#F59E0B' }}>You&apos;re one of our first 20 founding members. We&apos;ll build what you ask for.</span></div></>)}
                  </div>
                  <div className="flex items-center justify-between px-6 pb-6 pt-2" style={{ borderTop: '1px solid #1F2937' }}>
                    <button onClick={() => setTourStep(Math.max(0, tourStep - 1))} disabled={tourStep === 0} className="px-4 py-2 rounded-xl text-sm" style={{ backgroundColor: tourStep === 0 ? 'transparent' : '#1F2937', color: tourStep === 0 ? '#374151' : '#9CA3AF' }}>← Back</button>
                    <span className="text-xs" style={{ color: '#4B5563' }}>{tourStep + 1} / {TOUR_STEPS.length}</span>
                    {tourStep < TOUR_STEPS.length - 1 ? (
                      <button onClick={() => setTourStep(tourStep + 1)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>Next →</button>
                    ) : (
                      <button onClick={goLive} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#22C55E' }}>Let&apos;s go ⛳</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Tab Content */}
      {dashTab === 'today' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Col 1: Morning Roundup — expandable channels */}
          {session.isDemoShell === false
            ? <EmptyState icon="📬" title="No messages yet" sub="Connect your agent, caddie and tour accounts to unlock" />
            : <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
              <div className="flex items-center gap-2">
                <span>🌅</span>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Morning Roundup</p>
              </div>
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
                        const newOrder = reordered.map(c => c.id); setRoundupOrder(newOrder); localStorage.setItem('lumio_golf_roundup_order_v2', JSON.stringify(newOrder))
                      }
                      setDragIdx(null); setDragOverIdx(null)
                    }}
                    style={{ borderLeft: `4px solid ${ch.color}`, backgroundColor: `${ch.color}22`, borderRadius: 8, marginBottom: 6, borderTop: dragOverIdx === idx ? '2px solid #0ea5e9' : 'none', opacity: dragIdx === idx ? 0.5 : 1, cursor: 'grab' }}>
                    <button onClick={() => setExpandedChannel(isOpen ? null : ch.id)}
                      className="w-full flex items-center justify-between px-5 py-3 text-left transition-all hover:bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <span className="text-base" style={{ filter: `drop-shadow(0 0 4px ${ch.color})` }}>{ch.icon}</span>
                        <span className="text-sm" style={{ color: ch.color, fontWeight: 600, fontSize: 15 }}>{ch.label}</span>
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
                              <span className="text-[10px]" style={{ color: '#15803D' }}>Replied ✓</span>
                            ) : replyingTo === msg.id ? (
                              <div className="mt-2">
                                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write your reply..." rows={2}
                                  className="w-full text-xs rounded-lg p-2 resize-none" style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB', outline: 'none' }} />
                                <div className="flex gap-2 mt-1.5">
                                  <button onClick={() => { setRepliedTo(prev => [...prev, msg.id]); setReplyingTo(null); setReplyText(''); setReplyToast(true); setTimeout(() => setReplyToast(false), 2000) }}
                                    className="text-[10px] px-3 py-1 rounded-lg font-semibold" style={{ backgroundColor: '#15803D', color: '#fff' }}>Send</button>
                                  <button onClick={() => { setReplyingTo(null); setReplyText('') }}
                                    className="text-[10px] px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF' }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button onClick={() => setReplyingTo(msg.id)} className="text-[10px] px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(21,128,61,0.15)', color: '#15803D', border: '1px solid rgba(21,128,61,0.3)' }}>Reply</button>
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
          </div>}
          {/* Col 2: Today's Round */}
          <div className="space-y-4">
            {session.isDemoShell === false ? (<>
              <EmptyState icon="⛳" title="No tee time today" sub="Round data will appear here once your tour feed is connected" />
              <EmptyState icon="📅" title="No schedule loaded" sub="Your tournament schedule will appear here once connected" />
            </>) : (<>
            <div className="bg-gradient-to-br from-[#15803D]/15 to-teal-900/10 border border-[#15803D]/30 rounded-xl p-5">
              <div className="text-xs text-green-400 font-semibold uppercase tracking-wider mb-3">TODAY'S ROUND</div>
              <div className="text-white font-bold text-lg mb-1">Ashbourne National Golf Club</div>
              <div className="text-sm text-gray-400 mb-4">Round 2 · Hole 1 · 09:24 tee time</div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-black/20 rounded-lg p-3 text-center">
                  <div className="text-white font-bold">09:24</div>
                  <div className="text-[10px] text-gray-500">Tee Time</div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 text-center">
                  <div className="text-white font-bold">R2</div>
                  <div className="text-[10px] text-gray-500">Round</div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 text-center">
                  <div className="text-white font-bold">7,545</div>
                  <div className="text-[10px] text-gray-500">Yards</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mb-2">Playing With</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                  <span className="text-sm">🇪🇺</span>
                  <span className="text-xs text-gray-300 font-medium">R. Hartwell</span>
                </div>
                <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                  <span className="text-sm">🇺🇸</span>
                  <span className="text-xs text-gray-300 font-medium">S. Donovan</span>
                </div>
              </div>
            </div>
            {/* Recent Form */}
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
              <div className="text-sm font-semibold text-white mb-3">Recent Form — Last 5</div>
              <FormTracker results={recentForm} />
              <div className="grid grid-cols-5 gap-2 mt-3 text-center">
                {recentForm.map((r, i) => (
                  <div key={i}>
                    <div className="text-xs text-gray-500 truncate">{r.event}</div>
                    <div className="text-xs text-gray-400">{r.prize}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Today's Schedule */}
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
              <div className="text-sm font-bold text-white mb-3">Today&apos;s Schedule</div>
              <div className="space-y-2">
                {[
                  { id:'gs1', time:'07:00', label:'Range session — 90 min',              highlight:false },
                  { id:'gs2', time:'08:30', label:'Caddie brief with Mick — hole plans', highlight:false },
                  { id:'gs3', time:'09:24', label:'R2 tee time — with Hartwell, Donovan', highlight:true },
                  { id:'gs4', time:'13:00', label:'Physio — lower back treatment',       highlight:false },
                  { id:'gs5', time:'15:00', label:'Lumio Range session review',             highlight:false },
                  { id:'gs6', time:'17:00', label:'Scottish Open entry deadline',        highlight:true },
                  { id:'gs7', time:'18:00', label:'Vanta Sports sponsor post — caption due', highlight:false },
                  { id:'gs8', time:'20:00', label:'Post-round media & debrief',          highlight:false },
                ].filter(s => !scheduleCancelled[s.id]).map((s) => (
                  <div key={s.id} className={`group flex items-center gap-3 py-1.5 border-b border-gray-800/40 last:border-0 ${scheduleChecked[s.id] ? 'opacity-50' : ''} ${s.highlight ? 'text-green-400' : ''}`}>
                    <button onClick={() => toggleScheduleItem(s.id)} className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: scheduleChecked[s.id] ? '#22C55E' : 'transparent', borderColor: scheduleChecked[s.id] ? '#22C55E' : s.highlight ? '#15803D' : '#4B5563' }}>
                      {scheduleChecked[s.id] && <span className="text-white text-[8px]">✓</span>}
                    </button>
                    <span className="text-[10px] text-gray-500 w-10 flex-shrink-0">{s.time}</span>
                    <span className={`text-xs flex-1 ${scheduleChecked[s.id] ? 'line-through text-gray-600' : s.highlight ? 'text-green-400 font-semibold' : 'text-gray-300'}`}>{s.label}</span>
                    <button onClick={() => cancelScheduleItem(s.id)} className="text-[9px] text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">Cancel →</button>
                  </div>
                ))}
              </div>
            </div>
            {/* Today's Venue */}
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Today&apos;s Venue</div>
              <div className="text-sm font-bold text-white">Golfclub München Eichenried</div>
              <div className="text-xs text-gray-500 mt-1">22°C · 8mph W · Course open 06:30</div>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between text-gray-400"><span>Tee time:</span><span className="text-white">09:24 (R2)</span></div>
                <div className="flex justify-between text-gray-400"><span>Yardage:</span><span className="text-white">7,545 yd · Par 72</span></div>
                <div className="flex justify-between text-gray-400"><span>Prize (W):</span><span className="text-green-400 font-bold">£1.32M</span></div>
                <div className="flex justify-between text-gray-400"><span>Prize (L):</span><span className="text-gray-300">Cut line · £0</span></div>
                <div className="flex justify-between text-gray-400"><span>TV:</span><span className="text-white">Northbridge Sport</span></div>
              </div>
            </div>
            </>)}
          </div>
          {/* Col 3: Photo Frame + AI Morning Summary + Performance Intelligence */}
          <div className="space-y-4">
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white">📸 Personal Photo Frame</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => { const next = dashPhotoFit === 'cover' ? 'contain' : 'cover'; setDashPhotoFit(next); try { localStorage.setItem('lumio_golf_dash_photo_fit', next) } catch {} }} className="text-[10px] text-gray-600 hover:text-gray-400">{dashPhotoFit === 'cover' ? '⊡ Fit' : '⊞ Fill'}</button>
                  {dashPhotoSrc && <button onClick={() => setDashPhotoSrc(null)} className="text-[10px] text-gray-600 hover:text-gray-400">✕ Remove</button>}
                  <button onClick={() => dashPhotoInputRef.current?.click()} className="text-[10px] text-green-400 hover:text-green-300">+ Add</button>
                  <input type="file" accept="image/*" style={{display:'none'}} ref={dashPhotoInputRef} onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => { const img = new window.Image(); img.onload = () => { const c = document.createElement('canvas'); const M = 400; let w = img.width, h = img.height; if (w > h) { if (w > M) { h = Math.round(h*M/w); w = M } } else { if (h > M) { w = Math.round(w*M/h); h = M } } c.width = w; c.height = h; const ctx = c.getContext('2d'); if (!ctx) return; ctx.drawImage(img, 0, 0, w, h); const compressed = c.toDataURL('image/jpeg', 0.7); setDashPhotoSrc(compressed) }; img.src = ev.target?.result as string }; r.readAsDataURL(f); e.target.value = '' }} />
                </div>
              </div>
              <div className="rounded-xl overflow-hidden h-48 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(21,128,61,0.15) 0%, rgba(13,148,136,0.15) 100%)' }}>
                {dashPhotoSrc
                  ? <img src={dashPhotoSrc} alt="" className={`w-full h-full object-${dashPhotoFit}`} />
                  : session.photoDataUrl
                    ? <img src={session.photoDataUrl} alt="" className={`w-full h-full object-${dashPhotoFit}`} />
                    : <div className="text-center"><div className="text-4xl mb-2">⛳</div><div className="text-xs text-gray-600">Add a photo — family, holidays, inspiration</div></div>}
              </div>
              <div className="mt-3">
                <div className="text-white font-semibold text-sm">{player.name}</div>
                <div className="text-xs text-gray-500 mt-1">#{player.owgr} OWGR · {player.nationality} {player.flag}</div>
                <div className="text-xs text-gray-500 mt-1">{player.tour} · Age {player.age}</div>
              </div>
            </div>
            {/* AI Morning Summary — matches tennis */}
            {session.isDemoShell === false
              ? <EmptyState icon="✨" title="No AI briefing yet" sub="Connect your golf data to unlock your morning briefing" />
              : <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
                <div className="flex items-center gap-2">
                  <span style={{ color: '#8B5CF6' }}>✨</span>
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{aiSummaryLabel}</p>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(21,128,61,0.15)', color: '#4ade80' }}>
                  {new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}
                </span>
              </div>
              <div className="px-5 py-4 space-y-3">
                {[
                  { type:'round',    icon:'⛳', text:'R2 today at Golfclub München Eichenried — 09:24 tee with Hartwell & Donovan. Course fit 8.1/10. Pin positions favour draw off the tee on 1, 7 and 14.' },
                  { type:'caddie',   icon:'📋', text:'Mick updated hole 7 strategy — new wind data and pin position means 9-iron from the repositioned tee. Review caddie brief before warm-up.' },
                  { type:'sponsor',  icon:'🤝', text:'Vanta Sports post due 18:00 today — Carlos needs caption and round-day kit photo. Penalty clause applies if missed.' },
                  { type:'travel',   icon:'✈️', text:'Scottish Open hotel prices rising — preferred rooms filling fast. Book today to lock in Renfield Hotel rate before it goes.' },
                  { type:'ranking',  icon:'📊', text:`OWGR #${player.owgr} — 285 points defending this week. T20+ needed to hold. Race to Dubai #${player.race_to_dubai_pos} with ${player.race_to_dubai_points.toLocaleString()} pts.` },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    <span style={{ color: '#D1D5DB' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>}

            {/* Performance Intelligence — matches tennis */}
            {session.isDemoShell === false
              ? <EmptyState icon="📊" title="No performance data yet" sub="Connect your round data to see trends" />
              : <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
                <div className="flex items-center gap-2">
                  <span>⚡</span>
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Performance Intelligence</p>
                </div>
                <span className="text-[10px] font-medium" style={{ color: '#4ade80' }}>Performance</span>
              </div>
              <div className="px-5 py-4 space-y-2.5">
                {[
                  { n:1, trend:'↑', color:'#22C55E', text:`SG: Approach +0.72 this season — well above tour avg. Iron play is the strength, keep working the set-up with Mick.` },
                  { n:2, trend:'⚠', color:'#EF4444', text:'Putting SG -1.18 — 8-15ft the weakest range. 15 minutes on the short putting green before warm-up, focus on pace not line.' },
                  { n:3, trend:'↑', color:'#22C55E', text:`Course fit 8.1/10 — best of the season so far. Historic play here: 2 top 10s in 3 starts. Trust the game plan.` },
                  { n:4, trend:'→', color:'#4ade80', text:`Race to Dubai: #${player.race_to_dubai_pos}. Top 50 needed for Tour Championship — Halden Motors and Scottish Open are the key points events left.` },
                  { n:5, trend:'↓', color:'#F59E0B', text:'Driving accuracy down to 58% on last 4 starts — below season avg. Fairways first off the tee today, especially on doglegs 3 and 12.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <div className="flex items-center gap-1 flex-shrink-0 w-8">
                      <span className="font-bold" style={{ color: '#4ade80' }}>{item.n}</span>
                      <span className="text-[10px] font-bold" style={{ color: item.color }}>{item.trend}</span>
                    </div>
                    <span style={{ color: '#D1D5DB' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>}
          </div>
        </div>
      )}

      {dashTab === 'quickwins' && (session.isDemoShell === false
        ? <EmptyState icon="⚡" title="No quick wins yet" sub="Connect your data to unlock personalised quick wins" />
        : <div className="space-y-3">
          {[
            { id:'qw1', title:'Log R2 round score before leaderboard closes', priority:'critical' as const, category:'Performance', action:'Log round', modal:'loground', effort:'2min', description:'Leaderboard closes at 18:00 — log your R2 score to maintain live tracking.' },
            { id:'qw2', title:'Vanta Sports post due — Carlos needs caption by 18:00', priority:'high' as const, category:'Sponsor', action:'Generate post', modal:'sponsorpost', effort:'5min', description:'Contractual sponsor post obligation. AI can generate caption in your voice.' },
            { id:'qw3', title:'Book Scottish Open hotel — prices rising', priority:'high' as const, category:'Travel', action:'Find hotel', modal:'hotel', effort:'2min', description:'Preferred hotels filling up fast. Book now to save.' },
            { id:'qw4', title:'Mick updated hole 7 strategy — review before R3', priority:'high' as const, category:'Prep', action:'Open caddie brief', modal:'caddiebriefai', effort:'5min', description:'Caddie notes updated with new wind data and pin positions.' },
            { id:'qw5', title:'OWGR points update — check ranking movement', priority:'medium' as const, category:'Rankings', action:'Simulate', modal:'ranking', effort:'2min', description:'Points recalculated after this week — check projected movement.' },
          ].map(qw => {
            const ps = PRIORITY_STYLES[qw.priority]
            return (
              <div key={qw.id} className="rounded-2xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: ps.bg, color: ps.color }}>{ps.label.toUpperCase()}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#15803D1a', color: '#4ade80' }}>⏱ {qw.effort}</span>
                      <span className="text-xs" style={{ color: '#6B7280' }}>{qw.category}</span>
                    </div>
                    <h3 className="font-bold mb-1" style={{ color: '#F9FAFB' }}>{qw.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{qw.description}</p>
                    <p className="text-xs mt-2" style={{ color: '#374151' }}>Source: AI + Live data</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => onOpenModal(qw.modal)} className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{ backgroundColor: '#15803D' }}>{qw.action} →</button>
                    <button className="px-4 py-2 text-xs rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>Mark done</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {dashTab === 'tasks' && (session.isDemoShell === false
        ? <EmptyState icon="✅" title="No tasks for today" sub="Add your first task to unlock this" />
        : (() => {
        const BASE_TASKS: Array<{ id: string; time: string; title: string; priority: 'critical'|'high'|'medium'|'low'; category: string; action: string; modal: string; custom?: boolean }> = [
          { id:'dt1', time:'07:00', title:'Range session — driving focus, 90 min', priority:'high', category:'Training', action:'Log session', modal:'loground' },
          { id:'dt2', time:'09:24', title:'Tee time R2 — with Hartwell, Donovan', priority:'critical', category:'Match', action:'Open caddie brief', modal:'caddiebriefai' },
          { id:'dt3', time:'13:00', title:'Physio — lower back treatment', priority:'high', category:'Medical', action:'Log medical', modal:'injury' },
          { id:'dt4', time:'15:00', title:'Lumio Range session analysis — review numbers', priority:'medium', category:'Performance', action:'Open Lumio Range', modal:'trackman' },
          { id:'dt5', time:'17:00', title:'Scottish Open entry deadline — closes today', priority:'critical', category:'Entries', action:'Enter now', modal:'' },
          { id:'dt6', time:'18:00', title:'Vanta Sports sponsor post — due before 18:00', priority:'high', category:'Sponsor', action:'Generate post', modal:'sponsorpost' },
          { id:'dt7', time:'EOD', title:'Submit Munich expenses', priority:'medium', category:'Finance', action:'Log expense', modal:'expense' },
        ]
        const ALL_TASKS = [...BASE_TASKS, ...dashTasks]
        return (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Daily Tasks</div>
            <button onClick={() => setShowAddTask(v => !v)} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ backgroundColor: 'rgba(21,128,61,0.12)', color: '#4ade80', border: '1px solid rgba(21,128,61,0.3)' }}>+ Add Task</button>
          </div>
          {showAddTask && (
            <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: '#111318', border: '1px solid rgba(21,128,61,0.3)' }}>
              <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addCustomTask() }} placeholder="New task title..." className="flex-1 bg-transparent text-xs text-gray-200 placeholder-gray-600 outline-none" autoFocus />
              <button onClick={addCustomTask} className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white" style={{ backgroundColor: '#15803D' }}>Add</button>
              <button onClick={() => { setShowAddTask(false); setNewTaskTitle('') }} className="text-xs px-3 py-1.5 rounded-lg text-gray-500">Cancel</button>
            </div>
          )}
          {ALL_TASKS.map(dt => {
            const ps = PRIORITY_STYLES[dt.priority]
            const done = dashTasksChecked[dt.id] || false
            return (
              <div key={dt.id} className="rounded-xl p-4 flex items-start gap-4" style={{ backgroundColor: done ? 'rgba(255,255,255,0.01)' : '#111318', border: '1px solid #1F2937', opacity: done ? 0.6 : 1 }}>
                <button onClick={() => toggleDashTaskItem(dt.id)} className="w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center" style={{ borderColor: done ? '#22C55E' : '#4B5563', background: done ? 'rgba(34,197,94,0.15)' : 'transparent' }}>
                  {done && <span className="text-[9px] font-bold" style={{ color: '#22C55E' }}>✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: ps.bg, color: ps.color }}>{ps.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{dt.category}</span>
                    <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>{dt.time}</span>
                  </div>
                  <h4 className="font-semibold text-sm" style={{ color: done ? '#4B5563' : '#E5E7EB', textDecoration: done ? 'line-through' : 'none' }}>{dt.title}</h4>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {dt.modal && !done && <button onClick={() => onOpenModal(dt.modal)} className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{ backgroundColor: '#15803D' }}>Open →</button>}
                  {!done && <button onClick={() => toggleDashTaskItem(dt.id)} className="px-4 py-2 text-xs rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>Mark done</button>}
                </div>
              </div>
            )
          })}
        </div>
        )
      })())}

      {dashTab === 'insights' && (session.isDemoShell === false
        ? <EmptyState icon="📊" title="No insights yet" sub="Connect your data to unlock performance insights" />
        : <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label:'OWGR Rank',       value:`#${player.owgr}`,                sub:'Up 3 this week',        color:'#15803D', icon:'📊' },
              { label:'Race Standing',   value:`#${player.race_to_dubai_pos}`,   sub:`${player.race_to_dubai_points.toLocaleString()} pts`, color:'#0D9488', icon:'🏆' },
              { label:'Scoring Avg',     value:'70.2',                            sub:'Tour avg: 71.1',        color:'#8B5CF6', icon:'🎯' },
              { label:'Season Earnings', value:'£367k',                           sub:'Target £450k',          color:'#F59E0B', icon:'💰' },
              { label:'Form',            value:'T14·T6·MC·T3·T31',                sub:'Last 5 events',         color:'#22C55E', icon:'📈' },
            ].map((kpi, i) => (
              <div key={i} className="bg-[#0d1117] border border-gray-800 rounded-xl p-4 text-center">
                <div className="text-lg mb-1">{kpi.icon}</div>
                <div className="text-xl font-black" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{kpi.label}</div>
                <div className="text-[9px] text-gray-600 mt-0.5">{kpi.sub}</div>
              </div>
            ))}
          </div>
          {/* Insight Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { type:'ALERT',       value:'285 pts at risk',  title:'Ranking points expiring',     description:'You are defending 285 OWGR points from this event last year. T20+ this week holds your #87 spot. Miss the cut and you drop to ~#104.', action:'View OWGR breakdown', color:'#EF4444' },
              { type:'OPPORTUNITY', value:'£65k/yr',          title:'Vanta Sports renewal terms',      description:'Your agent James has new Vanta Sports terms — £65k/yr + equipment for 2 more years. Renewal decision due Friday. Competitor interest from Vanta Sports.', action:'View offer details', color:'#22C55E' },
              { type:'TREND',       value:'-0.6 avg',         title:'Scoring average improving',   description:'Your scoring average has dropped from 70.8 to 70.2 over the last 6 events. SG: Putting still the drag (-1.18) — fix this and you break 70.', action:'View trend chart',    color:'#3B82F6' },
              { type:'ACHIEVEMENT', value:'T3 finish',        title:'KLM Open top-3',              description:'Your T3 at the KLM Open was your best finish of the season — 480 points and £124k. Confirms the tee-to-green work with Carlos is paying off.', action:'View event stats',    color:'#F59E0B' },
            ].map((tile, i) => (
              <div key={i} className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: `${tile.color}15`, color: tile.color, border: `1px solid ${tile.color}40` }}>{tile.type}</span>
                  <span className="text-sm font-bold" style={{ color: tile.color }}>{tile.value}</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{tile.title}</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed mb-3">{tile.description}</p>
                <button className="text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-all" style={{ backgroundColor: `${tile.color}10`, color: tile.color, border: `1px solid ${tile.color}30` }}>{tile.action} →</button>
              </div>
            ))}
          </div>
          <SeasonIntelligenceStrip />
        </div>
      )}

      {dashTab === 'dontmiss' && (session.isDemoShell === false
        ? <EmptyState icon="🔴" title="Nothing to flag" sub="Alerts will appear here once your data is connected" />
        : <div className="space-y-3">
          {[
            { id:'dm1', urgency:'CRITICAL', urgencyColor:'#EF4444', category:'Match', when:'09:24 today', title:'R2 tee time — Hartwell & Donovan group', consequence:'If missed: disqualified', action:'Open caddie brief →', modal:'caddiebriefai' },
            { id:'dm2', urgency:'TODAY', urgencyColor:'#F59E0B', category:'Sponsor', when:'Before 18:00', title:'Vanta Sports post — contractual obligation', consequence:'If missed: contract penalty clause', action:'Generate post →', modal:'sponsorpost' },
            { id:'dm3', urgency:'TODAY', urgencyColor:'#F59E0B', category:'Entries', when:'17:00', title:'Scottish Open entry closes today', consequence:'If missed: miss Meridian Series event', action:'Enter now →', modal:'' },
            { id:'dm4', urgency:'THIS WEEK', urgencyColor:'#3B82F6', category:'Travel', when:'Friday', title:'The Open hotel — book now or lose allocation', consequence:'If missed: St Andrews no rooms within 30 miles', action:'Find hotel →', modal:'hotel' },
            { id:'dm5', urgency:'THIS WEEK', urgencyColor:'#3B82F6', category:'Rankings', when:'Sunday', title:'Race to Dubai — 3 events left for top 50', consequence:'If missed: lose Tour card', action:'Check ranking →', modal:'ranking' },
          ].map(dm => (
            <div key={dm.id} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: `1px solid ${dm.urgencyColor}30` }}>
              <div className="flex items-start gap-3">
                <span className="text-[10px] font-black px-2 py-0.5 rounded flex-shrink-0 mt-0.5" style={{ backgroundColor: `${dm.urgencyColor}20`, color: dm.urgencyColor }}>{dm.urgency}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold" style={{ color: '#6B7280' }}>{dm.category}</span>
                    <span className="text-[10px]" style={{ color: '#4B5563' }}>{dm.when}</span>
                  </div>
                  <div className="text-sm text-white font-medium mb-1">{dm.title}</div>
                  <div className="text-xs italic" style={{ color: '#EF4444' }}>{dm.consequence}</div>
                </div>
                {dm.modal && <button onClick={() => onOpenModal(dm.modal)} className="text-xs px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap flex-shrink-0" style={{ backgroundColor: 'rgba(21,128,61,0.15)', color: '#15803D', border: '1px solid rgba(21,128,61,0.3)' }}>{dm.action}</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {dashTab === 'team' && (session.isDemoShell === false
        ? <EmptyState icon="👥" title="No team members yet" sub="Add your coach, caddie, agent and support staff to unlock this" />
        : <div className="space-y-4">
          <div className="flex gap-1 border-b border-gray-800">
            {([
              { id: 'today' as const, label: 'Team Today', icon: '👥' },
              { id: 'org' as const, label: 'Org Chart', icon: '🏗️' },
              { id: 'info' as const, label: 'Team Info', icon: '🃏' },
              { id: 'tour' as const, label: 'Tour Info', icon: '⛳' },
            ]).map(t => (
              <button key={t.id} onClick={() => setTeamSubTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all -mb-px whitespace-nowrap ${
                  teamSubTab === t.id ? 'border-[#15803D] text-green-400' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          {teamSubTab === 'today' && (
            <div className="space-y-2">
              {[
                { name: 'Mick Sullivan', role: 'Caddie', status: 'Updated hole 7 yardage — 9-iron not 8', dot: '#22C55E' },
                { name: 'James Crawford', role: 'Agent', status: 'Scottish Open sponsor call 14:00', dot: '#F59E0B' },
                { name: 'Dr Anna Price', role: 'Physiotherapist', status: 'Back treatment 13:00 confirmed', dot: '#22C55E' },
                { name: 'Carlos Mendez', role: 'Head Coach', status: 'Range session notes sent', dot: '#22C55E' },
                { name: 'Sarah Chen', role: 'Sponsor Manager', status: 'Vanta Sports post due 18:00 — caption ready', dot: '#F59E0B' },
                { name: 'Dave Morton', role: 'Mental Coach', status: 'Pre-round call 08:30', dot: '#22C55E' },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  {(isDemoShellDash && DEMO_STAFF_PHOTOS[m.name]) ? (
                    <img src={DEMO_STAFF_PHOTOS[m.name]} alt={m.name} className="w-9 h-9 rounded-full object-cover object-center flex-shrink-0 border" style={{ borderColor: `${m.dot}40` }} />
                  ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${m.dot}20`, border: `1px solid ${m.dot}40`, color: m.dot }}>
                    {m.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white">{m.name}</div>
                    <div className="text-[10px]" style={{ color: '#15803D' }}>{m.role}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{m.status}</div>
                  </div>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.dot }} />
                </div>
              ))}
            </div>
          )}

          {teamSubTab === 'org' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(21,128,61,0.1)', border: '1px solid rgba(21,128,61,0.3)', minWidth: 200 }}>
                <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-sm font-bold mb-2 overflow-hidden"
                  style={{ background: 'rgba(21,128,61,0.2)', border: '2px solid #15803D', color: '#15803D' }}>
                  {displayPlayerPhoto ? <img src={displayPlayerPhoto} alt="" className="w-full h-full object-cover" /> : 'JH'}
                </div>
                <div className="text-sm font-bold text-white">{displayPlayerName}</div>
                <div className="text-[10px]" style={{ color: '#15803D' }}>Player · OWGR #{player.owgr}</div>
              </div>
              <div className="w-px h-4 bg-gray-700" />
              <div className="flex gap-4">
                {[{ name: 'James Crawford', role: 'Agent', color: '#F59E0B' }, { name: 'Vanta Sports', role: 'Equipment Sponsor', color: '#8B5CF6' }].map((p, i) => (
                  <div key={i} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minWidth: 160 }}>
                    <div className="w-10 h-10 mx-auto rounded-full overflow-hidden mb-2 flex items-center justify-center" style={{ background: `${p.color}20`, border: `2px solid ${p.color}40` }}>
                      {(isDemoShellDash && DEMO_STAFF_PHOTOS[p.name])
                        ? <img src={DEMO_STAFF_PHOTOS[p.name]} alt={p.name} className="w-full h-full object-cover" />
                        : <span className="text-xs font-bold" style={{ color: p.color }}>{p.name.split(' ').map(w => w[0]).join('')}</span>}
                    </div>
                    <div className="text-xs font-bold text-white">{p.name}</div>
                    <div className="text-[10px]" style={{ color: p.color }}>{p.role}</div>
                  </div>
                ))}
              </div>
              <div className="w-px h-4 bg-gray-700" />
              <div className="flex gap-4">
                {[{ name: 'Carlos Mendez', role: 'Head Coach', color: '#22C55E' }, { name: 'Mick Sullivan', role: 'Caddie', color: '#15803D' }].map((p, i) => (
                  <div key={i} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minWidth: 160 }}>
                    <div className="w-10 h-10 mx-auto rounded-full overflow-hidden mb-2 flex items-center justify-center" style={{ background: `${p.color}20`, border: `2px solid ${p.color}40` }}>
                      {(isDemoShellDash && DEMO_STAFF_PHOTOS[p.name])
                        ? <img src={DEMO_STAFF_PHOTOS[p.name]} alt={p.name} className="w-full h-full object-cover" />
                        : <span className="text-xs font-bold" style={{ color: p.color }}>{p.name.split(' ').map(w => w[0]).join('')}</span>}
                    </div>
                    <div className="text-xs font-bold text-white">{p.name}</div>
                    <div className="text-[10px]" style={{ color: p.color }}>{p.role}</div>
                  </div>
                ))}
              </div>
              <div className="w-px h-4 bg-gray-700" />
              <div className="flex flex-wrap justify-center gap-3">
                {[{ name: 'Dr Anna Price', role: 'Physio', color: '#EF4444' }, { name: 'Dave Morton', role: 'Mental Coach', color: '#8B5CF6' }, { name: 'Sarah Chen', role: 'Sponsor Mgr', color: '#F59E0B' }].map((p, i) => (
                  <div key={i} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minWidth: 140 }}>
                    <div className="w-10 h-10 mx-auto rounded-full overflow-hidden mb-2 flex items-center justify-center" style={{ background: `${p.color}20`, border: `2px solid ${p.color}40` }}>
                      {(isDemoShellDash && DEMO_STAFF_PHOTOS[p.name])
                        ? <img src={DEMO_STAFF_PHOTOS[p.name]} alt={p.name} className="w-full h-full object-cover" />
                        : <span className="text-xs font-bold" style={{ color: p.color }}>{p.name.split(' ').map(w => w[0]).join('')}</span>}
                    </div>
                    <div className="text-xs font-bold text-white">{p.name}</div>
                    <div className="text-[10px]" style={{ color: p.color }}>{p.role}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {teamSubTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Carlos Mendez', role: 'Head Coach', overall: 93, stats: [{ k: 'TAC', v: 94 }, { k: 'MOT', v: 91 }, { k: 'TCH', v: 95 }, { k: 'ANA', v: 92 }, { k: 'EXP', v: 90 }, { k: 'COM', v: 93 }], color: '#22C55E' },
                { name: 'Mick Sullivan', role: 'Caddie', overall: 91, stats: [{ k: 'KNO', v: 94 }, { k: 'CAL', v: 92 }, { k: 'COM', v: 95 }, { k: 'EXP', v: 91 }, { k: 'PRE', v: 89 }, { k: 'LOY', v: 96 }], color: '#15803D' },
                { name: 'James Crawford', role: 'Agent', overall: 90, stats: [{ k: 'NEG', v: 93 }, { k: 'NET', v: 91 }, { k: 'DEA', v: 94 }, { k: 'COM', v: 89 }, { k: 'EXP', v: 92 }, { k: 'REL', v: 88 }], color: '#F59E0B' },
                { name: 'Dr Anna Price', role: 'Physio', overall: 94, stats: [{ k: 'DIA', v: 95 }, { k: 'TRT', v: 96 }, { k: 'PRE', v: 93 }, { k: 'CON', v: 92 }, { k: 'EXP', v: 94 }, { k: 'KNO', v: 95 }], color: '#EF4444' },
              ].map((card, i) => (
                <div key={i} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid #1F2937' }}>
                    {(isDemoShellDash && DEMO_STAFF_PHOTOS[card.name]) ? (
                      <img src={DEMO_STAFF_PHOTOS[card.name]} alt={card.name} className="w-12 h-12 rounded-xl object-cover object-center" style={{ border: `2px solid ${card.color}40` }} />
                    ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black" style={{ background: `${card.color}20`, border: `2px solid ${card.color}40`, color: card.color }}>{card.overall}</div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-white">{card.name}</div>
                      <div className="text-[10px]" style={{ color: card.color }}>{card.role}</div>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-2">
                    {card.stats.map(s => (
                      <div key={s.k} className="text-center">
                        <div className="text-sm font-black" style={{ color: s.v >= 93 ? '#22C55E' : s.v >= 90 ? '#F59E0B' : '#6B7280' }}>{s.v}</div>
                        <div className="text-[9px] text-gray-500 uppercase">{s.k}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {teamSubTab === 'tour' && (
            <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              {[
                ['DP World Tour card', 'Active ✅'],
                ['OWGR', `#${player.owgr}`],
                ['Race to Dubai', `#${player.race_to_dubai_pos} (${player.race_to_dubai_points.toLocaleString()} pts)`],
                ['Season earnings', '£367,000 (target £450k)'],
                ['Wins this season', '0 (2 top 5s)'],
                ['Majors played', '3 (best: T22 The Open 2024)'],
                ['Equipment', 'Vanta Sports (full bag)'],
                ['Coach', 'Carlos Mendez (since 2022)'],
                ['Caddie', 'Mick Sullivan (since 2020)'],
                ['Home club', 'Wentworth Golf Club'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{label}</span>
                  <span className="text-xs font-bold text-white">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Round Prep (with AI post-round debrief) ─────────────────────────────────
function RoundPrepView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const [tab, setTab] = useState<'prep'|'debrief'|'scorecard'>('prep');
  const [form, setForm] = useState({
    tournament: 'Halden Motors International Open',
    round: 'R1',
    score: '',
    fairways: '',
    gir: '',
    putts: '',
    sgPutt: '',
    sgOtt: '',
    sgApp: '',
    notes: '',
  });
  const [debrief, setDebrief] = useState<{ headline: string; what_worked: string; what_didnt: string; practice_focus: string; mindset_note: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function upd<K extends keyof typeof form>(key: K, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function generateDebrief() {
    setLoading(true);
    setError(null);
    // Static debrief — instant-feel UX via a brief timeout, no network call.
    setTimeout(() => {
      setDebrief({
        headline: 'Solid round on scoring, putts let you down on the back 9 — consistent with season pattern.',
        what_worked: 'Driver shape held under pressure — 11/14 fairways with zero right misses. Approach wedges inside 130y averaged 14ft — best in 6 rounds.',
        what_didnt: 'Putts inside 10ft at 64% — below tour average and 8pp below your season mark. Three 3-putts from outside 40ft. Lag distance control on fast greens still an issue.',
        practice_focus: '20 min ladder drill on the practice green: 6 balls from 5ft, then 6 from 10ft, must hole 5 consecutive before leaving each distance.',
        mindset_note: 'Trust the stroke on short putts — session with Dave Morton tomorrow on tempo and commitment routine.',
      });
      setLoading(false);
    }, 400);
    return;
  }
  // Legacy network path retained below (unreachable, kept for reference):
  async function _generateDebriefLiveUnused() {
    try {
      const res = await fetch('/api/ai/golf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          system: 'You are Lumio AI, golf performance analyst for James Halton (#87 OWGR, DP World Tour). Be direct, data-driven, and specific. 2-3 sentences per section.',
          messages: [{
            role: 'user',
            content: `Generate a post-round debrief. Round data: ${JSON.stringify(form)}. Player's season SG profile: OTT +0.41, ATG -0.28, ARG +0.15, Putting -1.18. Respond ONLY in JSON: { "headline": "one sentence summary", "what_worked": "...", "what_didnt": "...", "practice_focus": "one specific drill or focus for next session", "mindset_note": "one sentence for mental coach" }`,
          }],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const text: string = data?.content?.[0]?.text || '';
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('No JSON in response');
      const parsed = JSON.parse(text.slice(start, end + 1));
      setDebrief({
        headline: parsed.headline || '',
        what_worked: parsed.what_worked || '',
        what_didnt: parsed.what_didnt || '',
        practice_focus: parsed.practice_focus || '',
        mindset_note: parsed.mindset_note || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate debrief');
    } finally {
      setLoading(false);
    }
  }

  const inp = 'w-full bg-[#0d0f1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-green-600';
  const lbl = 'block text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1';

  return (
    <div className="space-y-6">
      <SectionHeader icon="🎯" title="Round Prep" subtitle="Pre-round game plan and post-round AI debrief." />

      <div className="flex gap-2 border-b border-gray-800">
        {(['prep', 'debrief', 'scorecard'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'text-green-300 border-green-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
            {t === 'prep' ? 'Round Prep' : t === 'debrief' ? 'Post-Round Debrief' : 'Scorecard Entry'}
          </button>
        ))}
      </div>

      {tab === 'prep' && (
        <div className="space-y-4">
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Round Info</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><div className="text-gray-500 text-xs">Tournament</div><div className="text-white font-semibold">Halden Motors International Open</div></div>
              <div><div className="text-gray-500 text-xs">Course</div><div className="text-white font-semibold">BMW Golf Club München-Eichenried</div></div>
              <div><div className="text-gray-500 text-xs">Yardage / Par</div><div className="text-white font-semibold">7,126 yards · Par 72</div></div>
              <div><div className="text-gray-500 text-xs">Tee time</div><div className="text-white font-semibold">09:24 R1 · Hole 1</div></div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="rounded-lg p-3 bg-[#0a0c14] border border-gray-800"><div className="text-[10px] text-gray-500 uppercase">Weather</div><div className="text-white font-bold mt-1">16°C · Sunny</div><div className="text-[11px] text-gray-400">Dew lifted by 08:00</div></div>
              <div className="rounded-lg p-3 bg-[#0a0c14] border border-gray-800"><div className="text-[10px] text-gray-500 uppercase">Wind</div><div className="text-white font-bold mt-1">14 mph SW</div><div className="text-[11px] text-amber-400">Affects 11/12/13 significantly</div></div>
              <div className="rounded-lg p-3 bg-[#0a0c14] border border-gray-800"><div className="text-[10px] text-gray-500 uppercase">Rain chance</div><div className="text-white font-bold mt-1">12%</div><div className="text-[11px] text-gray-400">Clearer from noon onward</div></div>
            </div>
          </div>
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3"><div className="text-sm font-bold text-white">Pin Positions — Round 1</div><div className="text-[10px] text-gray-500">Day 1 · Centre-front bias</div></div>
            <div className="grid grid-cols-6 md:grid-cols-9 gap-2 text-center text-[11px]">
              {[
                { hole: 1, pin: 'Front-L',  note: '' }, { hole: 2, pin: 'Middle',   note: '' }, { hole: 3, pin: 'Front-R',  note: 'Tucked' },
                { hole: 4, pin: 'Middle',   note: '' }, { hole: 5, pin: 'Back-L',   note: '' }, { hole: 6, pin: 'Middle',   note: '' },
                { hole: 7, pin: 'Front',    note: 'Short par-3' }, { hole: 8, pin: 'Back-R',   note: '' }, { hole: 9, pin: 'Middle',   note: '' },
                { hole: 10, pin: 'Back-L',  note: '' }, { hole: 11, pin: 'Middle',  note: 'Wind' }, { hole: 12, pin: 'Back-R',  note: 'Avoid short-left' },
                { hole: 13, pin: 'Front-R', note: '' }, { hole: 14, pin: 'Middle',  note: '' }, { hole: 15, pin: 'Front',   note: 'Attack in 2' },
                { hole: 16, pin: 'Back-L',  note: '' }, { hole: 17, pin: 'Middle',  note: 'Par-3' }, { hole: 18, pin: 'Front-R', note: 'Finish' },
              ].map(p => (
                <div key={p.hole} className="rounded-lg p-2 bg-[#0a0c14] border border-gray-800/70">
                  <div className="text-gray-500 text-[10px]">Hole {p.hole}</div><div className="text-white font-bold mt-0.5">{p.pin}</div>
                  {p.note && <div className="text-amber-400 text-[9px] mt-0.5 truncate">{p.note}</div>}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
              <div className="text-sm font-bold text-white mb-3">Wind by Hour — Round Window</div>
              <div className="space-y-2">
                {[{ t: '09:00', dir: 'SW', mph: 10 },{ t: '10:00', dir: 'SW', mph: 12 },{ t: '11:00', dir: 'SW', mph: 14 },{ t: '12:00', dir: 'SW', mph: 15 },{ t: '13:00', dir: 'W',  mph: 14 },{ t: '14:00', dir: 'W',  mph: 12 }].map((w, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <div className="text-gray-500 w-12">{w.t}</div>
                    <div className="flex-1 bg-gray-800 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${(w.mph / 20) * 100}%` }} /></div>
                    <div className="text-white font-medium w-20 text-right">{w.dir} · {w.mph} mph</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
              <div className="text-sm font-bold text-white mb-3">Key Holes — Risk / Reward</div>
              <div className="space-y-3">
                {[
                  { hole: '2',  par: 5, note: 'Reachable par-5. GIR% on par-5s this season: 89%. Attack in 2.' },
                  { hole: '12', par: 4, note: "Wind-affected. Back-right pin. Bail-out centre is the play — don't chase short-left." },
                  { hole: '15', par: 5, note: 'Scoring hole. 4 of 5 career eagles on this hole — stay aggressive.' },
                ].map((h, i) => (
                  <div key={i} className="rounded-lg p-3 bg-[#0a0c14] border border-gray-800">
                    <div className="flex items-center gap-2 mb-1"><span className="text-[10px] bg-green-600/20 text-green-400 px-1.5 py-0.5 rounded">Hole {h.hole}</span><span className="text-[10px] text-gray-500">Par {h.par}</span></div>
                    <div className="text-xs text-gray-300">{h.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-bold text-white mb-3">Club Off Every Tee — Wind-Adjusted</div>
            <div className="grid grid-cols-6 md:grid-cols-9 gap-2 text-[11px]">
              {['Driver','3-wood','Driver','5-iron','Driver','3-iron','7-iron','3-wood','Driver','Driver','Driver','5-iron','3-wood','Driver','3-wood','Driver','6-iron','Driver'].map((c, i) => (
                <div key={i} className="rounded-lg p-2 bg-[#0a0c14] border border-gray-800/70 text-center"><div className="text-gray-500 text-[10px]">H{i+1}</div><div className="text-white font-bold mt-0.5">{c}</div></div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
              <div className="text-sm font-bold text-white mb-3">Post-Round Targets</div>
              <div className="space-y-2 text-sm">
                {[
                  { stat: 'SG Putting',   target: '> -0.5', current: '-1.18 season' },
                  { stat: 'Fairway %',    target: '> 62%',  current: '58% season' },
                  { stat: 'GIR',          target: '> 12',   current: '11.2 avg' },
                  { stat: 'Scrambling',   target: '> 60%',  current: '55% season' },
                  { stat: '3-putt count', target: '0',      current: '2.1 avg' },
                ].map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
                    <span className="text-gray-300">{t.stat}</span>
                    <div className="flex items-center gap-3 text-[11px]"><span className="text-teal-400 font-semibold">Target {t.target}</span><span className="text-gray-500">({t.current})</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
              <div className="text-sm font-bold text-white mb-3">45-min Pre-Round Warm-up</div>
              <div className="space-y-1.5">
                {[
                  { time: '08:00', drill: 'Dynamic stretching + band work — 10 min' },
                  { time: '08:10', drill: 'Short-game area — bunker 5, chip 10, pitch 10' },
                  { time: '08:25', drill: 'Range — wedges to full swing, ladder up' },
                  { time: '08:50', drill: 'Putting — 5ft gates, lag 30/40/50ft' },
                  { time: '09:10', drill: 'First-tee routine + commit word: "committed"' },
                ].map((w, i) => (
                  <div key={i} className="flex gap-3 text-[11px]"><span className="text-gray-500 w-14 flex-shrink-0">{w.time}</span><span className="text-gray-300">{w.drill}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'debrief' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scorecard entry */}
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Scorecard</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Tournament</label>
                <input value={form.tournament} onChange={e => upd('tournament', e.target.value)} className={inp} />
              </div>
              <div>
                <label className={lbl}>Round</label>
                <select value={form.round} onChange={e => upd('round', e.target.value)} className={inp}>
                  {['R1','R2','R3','R4'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Score</label>
                <input type="number" value={form.score} onChange={e => upd('score', e.target.value)} placeholder="68" className={inp} />
              </div>
              <div>
                <label className={lbl}>Putts</label>
                <input type="number" value={form.putts} onChange={e => upd('putts', e.target.value)} placeholder="29" className={inp} />
              </div>
              <div>
                <label className={lbl}>Fairways hit</label>
                <input value={form.fairways} onChange={e => upd('fairways', e.target.value)} placeholder="10/14" className={inp} />
              </div>
              <div>
                <label className={lbl}>GIR</label>
                <input value={form.gir} onChange={e => upd('gir', e.target.value)} placeholder="11/18" className={inp} />
              </div>
              <div>
                <label className={lbl}>SG Putting (optional)</label>
                <input type="number" step="0.01" value={form.sgPutt} onChange={e => upd('sgPutt', e.target.value)} placeholder="-0.8" className={inp} />
              </div>
              <div>
                <label className={lbl}>SG Off Tee (optional)</label>
                <input type="number" step="0.01" value={form.sgOtt} onChange={e => upd('sgOtt', e.target.value)} placeholder="+0.4" className={inp} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>SG Approach (optional)</label>
                <input type="number" step="0.01" value={form.sgApp} onChange={e => upd('sgApp', e.target.value)} placeholder="+0.6" className={inp} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Any notes? (3-putts, missed short ones, driving issues...)</label>
                <textarea value={form.notes} onChange={e => upd('notes', e.target.value)} rows={4} className={inp} />
              </div>
            </div>
            <button onClick={generateDebrief} disabled={loading} className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg transition-colors">
              {loading ? '✨ Generating debrief...' : '✨ Generate Debrief'}
            </button>
          </div>

          {/* Debrief output */}
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">AI Debrief</h3>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-24 rounded bg-gray-800 animate-pulse" />
                    <div className="h-3 rounded bg-gray-800 animate-pulse" style={{ width: `${80 + (i % 3) * 5}%` }} />
                    <div className="h-3 rounded bg-gray-800 animate-pulse" style={{ width: `${60 + (i % 4) * 5}%` }} />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-red-400 text-sm">⚠️ {error} — try again in a moment.</div>
            ) : debrief ? (
              <div className="space-y-4">
                <div className="border-l-2 border-green-500 pl-3">
                  <div className="text-[10px] uppercase tracking-wider text-green-400 font-semibold mb-1">Headline</div>
                  <div className="text-white text-sm font-medium">{debrief.headline}</div>
                </div>
                <div className="border-l-2 border-teal-500 pl-3">
                  <div className="text-[10px] uppercase tracking-wider text-teal-400 font-semibold mb-1">What worked</div>
                  <div className="text-gray-300 text-sm leading-relaxed">{debrief.what_worked}</div>
                </div>
                <div className="border-l-2 border-red-500 pl-3">
                  <div className="text-[10px] uppercase tracking-wider text-red-400 font-semibold mb-1">What didn&apos;t</div>
                  <div className="text-gray-300 text-sm leading-relaxed">{debrief.what_didnt}</div>
                </div>
                <div className="border-l-2 border-amber-500 pl-3">
                  <div className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold mb-1">Practice focus</div>
                  <div className="text-gray-300 text-sm leading-relaxed">{debrief.practice_focus}</div>
                </div>
                <div className="border-l-2 border-purple-500 pl-3">
                  <div className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold mb-1">Mindset note</div>
                  <div className="text-gray-300 text-sm leading-relaxed">{debrief.mindset_note}</div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm italic">Fill in your round data and hit Generate Debrief.</div>
            )}
          </div>
        </div>
      )}

      {tab === 'scorecard' && <ScorecardEntry />}
      <GolfAISection context="dashboard" player={player} session={session} />
    </div>
  );
}

type ScoreRow = { par: number; yards: number; score: number; fairway: 'Y' | 'N' | 'N-A'; gir: 'Y' | 'N'; putts: number; notes: string };
type SavedRound = { date: string; rows: ScoreRow[]; totals: { total: number; vsPar: number } };

function ScorecardEntry() {
  const initialPars = [4,5,4,3,4,4,3,5,4,4,4,3,5,4,4,5,3,4];
  const initialYards = [412, 556, 398, 184, 428, 445, 162, 545, 434, 408, 440, 198, 588, 432, 441, 565, 172, 436];
  const buildInitial = (): ScoreRow[] => initialPars.map((par, i) => ({
    par,
    yards: initialYards[i],
    score: 0,
    fairway: par === 3 ? 'N-A' : 'N',
    gir: 'N',
    putts: 0,
    notes: '',
  }));
  const [rows, setRows] = useState<ScoreRow[]>(buildInitial);
  const [toast, setToast] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedRound[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lumio_golf_scorecards');
      if (raw) setSaved(JSON.parse(raw) as SavedRound[]);
    } catch {
      // ignore
    }
  }, []);

  function update<K extends keyof ScoreRow>(idx: number, key: K, val: ScoreRow[K]) {
    setRows(rs => rs.map((r, i) => i === idx ? { ...r, [key]: val } : r));
  }

  const front9 = rows.slice(0, 9).reduce((s, r) => s + (r.score || 0), 0);
  const back9 = rows.slice(9).reduce((s, r) => s + (r.score || 0), 0);
  const total = front9 + back9;
  const vsPar = total - 72;
  const vsParStr = total === 0 ? '–' : vsPar === 0 ? 'E' : vsPar > 0 ? `+${vsPar}` : `${vsPar}`;
  const fairwayOpps = rows.filter(r => r.fairway !== 'N-A').length;
  const fairwaysHit = rows.filter(r => r.fairway === 'Y').length;
  const girCount = rows.filter(r => r.gir === 'Y').length;
  const totalPutts = rows.reduce((s, r) => s + (r.putts || 0), 0);
  const avgPuttsPerGir = girCount > 0 ? (totalPutts / girCount).toFixed(1) : '–';

  function saveRound() {
    const round: SavedRound = {
      date: new Date().toISOString(),
      rows,
      totals: { total, vsPar },
    };
    try {
      const raw = localStorage.getItem('lumio_golf_scorecards');
      const existing: SavedRound[] = raw ? JSON.parse(raw) : [];
      const next = [...existing, round];
      localStorage.setItem('lumio_golf_scorecards', JSON.stringify(next));
      setSaved(next);
      setToast('✓ Round saved to local storage');
      setTimeout(() => setToast(null), 2000);
    } catch {
      setToast('⚠️ Failed to save');
      setTimeout(() => setToast(null), 2000);
    }
  }

  function loadRound(idx: number) {
    if (idx < 0 || idx >= saved.length) return;
    setRows(saved[idx].rows);
  }

  const cellInp = 'w-full bg-[#0d0f1a] border border-gray-800 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-green-600';

  return (
    <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-sm font-bold text-white">Hole-by-Hole Scorecard</h3>
        <div className="flex items-center gap-2">
          <select
            onChange={e => loadRound(parseInt(e.target.value, 10))}
            defaultValue=""
            className="bg-[#0d0f1a] border border-gray-800 rounded px-2 py-1 text-xs text-gray-300"
          >
            <option value="" disabled>Load previous…</option>
            {saved.map((r, i) => (
              <option key={i} value={i}>
                {new Date(r.date).toLocaleDateString()} — {r.totals.vsPar === 0 ? 'E' : r.totals.vsPar > 0 ? `+${r.totals.vsPar}` : r.totals.vsPar}
              </option>
            ))}
          </select>
          <button onClick={saveRound} className="bg-green-600/20 border border-green-500/40 text-green-300 text-xs font-semibold px-3 py-1.5 rounded hover:bg-green-600/30 transition-colors">
            Save Round
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-800">
              <th className="text-left py-1 px-2">Hole</th>
              <th className="text-left py-1 px-2">Par</th>
              <th className="text-left py-1 px-2">Yards</th>
              <th className="text-left py-1 px-2">Score</th>
              <th className="text-left py-1 px-2">Fairway</th>
              <th className="text-left py-1 px-2">GIR</th>
              <th className="text-left py-1 px-2">Putts</th>
              <th className="text-left py-1 px-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="text-sm py-1 px-2 text-gray-400">{i + 1}</td>
                <td className="text-sm py-1 px-2"><input type="number" value={r.par} onChange={e => update(i, 'par', parseInt(e.target.value, 10) || 0)} className={`${cellInp} w-14`} /></td>
                <td className="text-sm py-1 px-2"><input type="number" value={r.yards} onChange={e => update(i, 'yards', parseInt(e.target.value, 10) || 0)} className={`${cellInp} w-20`} /></td>
                <td className="text-sm py-1 px-2"><input type="number" value={r.score || ''} onChange={e => update(i, 'score', parseInt(e.target.value, 10) || 0)} className={`${cellInp} w-14`} /></td>
                <td className="text-sm py-1 px-2">
                  <div className="flex gap-1">
                    {(['Y','N','N-A'] as const).map(opt => (
                      <button key={opt} onClick={() => update(i, 'fairway', opt)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${r.fairway === opt ? 'bg-green-600/20 border-green-500/40 text-green-300' : 'border-gray-800 text-gray-500'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="text-sm py-1 px-2">
                  <div className="flex gap-1">
                    {(['Y','N'] as const).map(opt => (
                      <button key={opt} onClick={() => update(i, 'gir', opt)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${r.gir === opt ? 'bg-green-600/20 border-green-500/40 text-green-300' : 'border-gray-800 text-gray-500'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="text-sm py-1 px-2"><input type="number" min={1} max={4} value={r.putts || ''} onChange={e => update(i, 'putts', parseInt(e.target.value, 10) || 0)} className={`${cellInp} w-14`} /></td>
                <td className="text-sm py-1 px-2"><input type="text" value={r.notes} onChange={e => update(i, 'notes', e.target.value)} className={`${cellInp} min-w-[140px]`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-800">
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Front / Back / Total</div>
          <div className="text-sm text-white font-medium">{front9} / {back9} / {total}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">vs Par</div>
          <div className="text-sm text-green-300 font-medium">{vsParStr}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Fairways</div>
          <div className="text-sm text-white font-medium">{fairwaysHit}/{fairwayOpps}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">GIR</div>
          <div className="text-sm text-white font-medium">{girCount}/18</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Total Putts</div>
          <div className="text-sm text-white font-medium">{totalPutts}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Avg Putts / GIR</div>
          <div className="text-sm text-white font-medium">{avgPuttsPerGir}</div>
        </div>
      </div>

      <div className="text-[11px] text-gray-500 italic">Saved rounds feed into your SG calculations and Practice Log.</div>
      {toast && <div className="text-xs text-green-300">{toast}</div>}
    </div>
  );
}

function MorningBriefingView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const [recipient, setRecipient] = useState<'player'|'caddie'|'coach'|'agent'>('player');
  const [briefings, setBriefings] = useState<Record<string, string>>({ player: '', caddie: '', coach: '', agent: '' });
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateBriefings() {
    setLoading(true);
    setError(null);
    try {
      const prompt = `You are Lumio AI, the golf performance assistant for ${player.name}. Generate four morning briefings (player, caddie, coach, agent) for today. Context: OWGR #${player.owgr}, Race to Dubai #${player.race_to_dubai_pos}, current event Halden Motors International Open Munich, tee time 09:42 Thursday, SG Putting -1.18 (critical weakness from 8-15ft), Vanta Sports post due today, Vanta Sports call 16:00, sponsor renewal in 18 days. Respond ONLY with valid JSON: { "player": "...", "caddie": "...", "coach": "...", "agent": "..." } — each value is a 2-3 sentence briefing, no markdown.`;
      const res = await fetch('/api/ai/golf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const text: string = data?.content?.[0]?.text || '';
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON in response');
      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
      setBriefings({
        player: parsed.player || '', caddie: parsed.caddie || '',
        coach: parsed.coach || '',   agent: parsed.agent || '',
      });
      setGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate briefing');
    } finally {
      setLoading(false);
    }
  }

  const recs = [
    { key: 'player', label: 'Player', icon: '⛳', time: '7:30am' },
    { key: 'caddie', label: 'Caddie', icon: '🏌️', time: '8:00am' },
    { key: 'coach', label: 'Coach', icon: '📋', time: '8:00am' },
    { key: 'agent', label: 'Agent', icon: '🤝', time: '8:30am' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="🌅" title="AI Morning Briefing" subtitle="Voice-powered daily briefings for the player and full team — delivered before first tee." />
      <div className="grid grid-cols-4 gap-3">
        {recs.map(r => (
          <button key={r.key} onClick={() => setRecipient(r.key as typeof recipient)}
            className={`p-3 rounded-xl border text-left transition-all ${recipient === r.key ? 'bg-green-600/20 border-green-500/50' : 'bg-[#0d0f1a] border-gray-800 hover:border-gray-600'}`}>
            <div className="text-xl mb-1">{r.icon}</div>
            <div className="text-sm font-medium text-white">{r.label}</div>
            <div className="text-xs text-gray-500">{r.time}</div>
          </button>
        ))}
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${generated ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
            <span className="text-sm text-green-400 font-medium">Today&apos;s briefing — {recs.find(r => r.key === recipient)?.label}</span>
          </div>
          {!generated ? (
            <button onClick={generateBriefings} disabled={loading} className="flex items-center gap-2 bg-green-700 hover:bg-green-800 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg transition-colors">
              {loading ? '✨ Generating...' : '✨ Generate Briefing'}
            </button>
          ) : (
            <button onClick={() => { setGenerated(false); generateBriefings(); }} disabled={loading} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:cursor-not-allowed text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors border border-gray-700">
              {loading ? '✨ Regenerating...' : '↻ Regenerate'}
            </button>
          )}
        </div>
        {loading ? (
          <div className="space-y-2 pl-4 border-l-2 border-green-600/50">
            <div className="h-3 rounded bg-gray-800 animate-pulse" style={{ width: '95%' }} />
            <div className="h-3 rounded bg-gray-800 animate-pulse" style={{ width: '88%' }} />
            <div className="h-3 rounded bg-gray-800 animate-pulse" style={{ width: '72%' }} />
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm pl-4 border-l-2 border-red-600/50">
            ⚠️ {error} — try again in a moment.
          </div>
        ) : generated ? (
          <div className="text-gray-300 text-sm leading-relaxed border-l-2 border-green-600/50 pl-4">
            &ldquo;{briefings[recipient]}&rdquo;
          </div>
        ) : (
          <div className="text-gray-500 text-sm italic pl-4 border-l-2 border-gray-700">
            Click Generate Briefing to get today&apos;s personalised intel from Lumio AI.
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Briefing Time', value: '2m 38s', sub: 'Average' }, { label: 'Voice', value: 'Marcus', sub: 'ElevenLabs TTS' }, { label: 'Delivery', value: '07:30', sub: 'Auto-send daily' }].map((s, i) => (
          <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-white font-bold text-lg">{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
            <div className="text-xs text-gray-600 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>
      <GolfAISection context="dashboard" player={player} session={session} />
    </div>
  );
}

type ExpiryEntry = { event: string; pos: string; points: number; expires: string; urgency: string };

function RollingExpiryCalendar({ points }: { points: ExpiryEntry[] }) {
  const now = new Date();
  const months: { key: string; label: string; date: Date }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('en-GB', { month: 'short' }),
      date: d,
    });
  }

  // Bucket entries by month (first of the month containing the expiry date).
  // Exclude entries whose expiry date is already in the past — they're history, not forecast.
  const bucket: Record<string, ExpiryEntry[]> = {};
  for (const p of points) {
    const d = new Date(p.expires);
    if (Number.isNaN(d.getTime())) continue;
    if (d < now) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!bucket[key]) bucket[key] = [];
    bucket[key].push(p);
  }

  // Short tournament label for pills.
  const abbrev = (event: string) => {
    const words = event.split(/\s+/);
    return words.length === 1 ? words[0].slice(0, 6) : words.map(w => w[0]).join('').slice(0, 4).toUpperCase();
  };

  // Pill urgency by days from month start.
  const pillClass = (d: Date) => {
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 30) return 'bg-red-600/20 border border-red-500/40 text-red-300';
    if (diff <= 90) return 'bg-yellow-600/20 border border-yellow-500/40 text-yellow-300';
    return 'bg-gray-700/40 border border-gray-600/40 text-gray-400';
  };

  // Total points at risk in next 6 months.
  const sixMonthCutoff = new Date(now.getFullYear(), now.getMonth() + 6, 0);
  const pointsAtRisk = points
    .filter(p => {
      const d = new Date(p.expires);
      return !Number.isNaN(d.getTime()) && d <= sixMonthCutoff;
    })
    .reduce((sum, p) => sum + p.points, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-gray-500 uppercase tracking-wider">Next 12 months</div>
        <div className="text-sm text-yellow-400 font-semibold">
          {pointsAtRisk.toLocaleString()} pts expiring in next 6 months
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="grid grid-cols-12 gap-1 min-w-[720px]">
          {months.map(m => {
            const entries = bucket[m.key] || [];
            const monthTotal = entries.reduce((s, e) => s + e.points, 0);
            return (
              <div key={m.key} className="bg-gray-900/40 border border-gray-800 rounded-lg p-2 flex flex-col gap-1.5">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center border-b border-gray-800 pb-1">
                  {m.label}
                </div>
                <div className="flex flex-col gap-1 min-h-[42px]">
                  {entries.length === 0 ? (
                    <div className="text-[9px] text-gray-700 text-center mt-2">—</div>
                  ) : (
                    entries.map((e, i) => {
                      const d = new Date(e.expires);
                      return (
                        <div
                          key={i}
                          title={`${e.event} (${e.pos}) — ${e.expires}`}
                          className={`text-[9px] font-medium px-1.5 py-0.5 rounded truncate ${pillClass(d)}`}
                        >
                          {e.points} · {abbrev(e.event)}
                        </div>
                      );
                    })
                  )}
                </div>
                {monthTotal > 0 && (
                  <div className="text-[9px] text-gray-500 text-center border-t border-gray-800 pt-1">
                    {monthTotal} at risk
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-500">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red-500/60" /><span>≤30 days</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-yellow-500/60" /><span>31–90 days</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-gray-600/60" /><span>&gt;90 days</span></div>
      </div>
    </div>
  );
}

function OWGRView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const scenarios = [
    { result: 'Win', event: 'Halden Motors International', newOWGR: 71, change: '+16', rtd: 'T35' },
    { result: 'T2–T5', event: 'Halden Motors International', newOWGR: 79, change: '+8', rtd: 'T41' },
    { result: 'T6–T10', event: 'Halden Motors International', newOWGR: 83, change: '+4', rtd: 'T42' },
    { result: 'T11–T20', event: 'Halden Motors International', newOWGR: 86, change: '+1', rtd: 'T43' },
    { result: 'T21–T40', event: 'Halden Motors International', newOWGR: 88, change: '-1', rtd: 'T44' },
    { result: 'MC', event: 'Halden Motors International', newOWGR: 92, change: '-5', rtd: 'T46' },
  ];
  const pointsExpiry = POINTS_EXPIRY;
  return (
    <div className="space-y-6">
      <SectionHeader icon="📊" title="OWGR & Race to Dubai" subtitle="Live world ranking, points tracker, Race to Dubai standings, and scenario modelling." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="OWGR" value={`#${player.owgr}`} sub="▲3 this week" color="green" />
        <StatCard label="Pts Average" value={player.owgr_points.toFixed(2)} sub="Rolling 104 weeks" color="teal" />
        <StatCard label="Race to Dubai" value={`#${player.race_to_dubai_pos}`} sub={`${player.race_to_dubai_points} pts`} color="purple" />
        <StatCard label="Career High" value={`#${player.career_high_owgr}`} sub="May 2025" color="orange" />
      </div>
      {/* OWGR Chart */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">OWGR Trajectory — 12 Months</div>
        <OWGRChart />
      </div>
      {/* Race to Dubai */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Race to Dubai — Current Standings (Top 50 earns card)</div>
        <div className="space-y-2">
          {[
            { pos: 1, name: 'R. Hartwell', country: '🇮🇪', pts: 4280, safe: true },
            { pos: 2, name: 'R. Kilbride', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', pts: 3840, safe: true },
            { pos: 3, name: 'R. MacIntyre', country: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', pts: 3210, safe: true },
            { pos: 10, name: 'H. Tellander', country: '🇳🇴', pts: 2140, safe: true },
            { pos: 43, name: player.name, country: player.flag, pts: player.race_to_dubai_points, safe: false, isPlayer: true },
            { pos: 50, name: 'G. Migliozzi', country: '🇮🇹', pts: 980, safe: false, isCutoff: true },
            { pos: 51, name: 'J. Smith', country: '🇦🇺', pts: 940, safe: false },
          ].map((p: any, i) => (
            <div key={i} className={`flex items-center gap-3 py-2 px-3 rounded-lg ${p.isPlayer ? 'bg-green-600/20 border border-green-500/30' : p.isCutoff ? 'bg-gray-800/50 border border-yellow-600/30' : 'bg-gray-900/20'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${p.safe ? 'bg-teal-600/30 text-teal-400' : 'bg-gray-800 text-gray-400'}`}>{p.pos}</div>
              <span className="text-sm">{p.country}</span>
              <span className={`text-sm flex-1 ${p.isPlayer ? 'text-green-400 font-semibold' : 'text-gray-300'}`}>{p.name}{p.isPlayer ? ' ← YOU' : ''}{p.isCutoff ? ' (Cut line)' : ''}</span>
              <span className={`text-sm font-medium ${p.safe ? 'text-teal-400' : p.isPlayer ? 'text-green-400' : 'text-gray-400'}`}>{p.pts.toLocaleString()} pts</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-500">Top 50 qualify for DP World Tour Play-Offs (Abu Dhabi + Dubai). You need <span className="text-yellow-400">+260 pts</span> to reach the cut-off.</div>
      </div>
      {/* Scenario modelling */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">🎯 Scenario Modelling — Halden Motors International Open</div>
        <div className="space-y-2">
          {scenarios.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${s.result === 'Win' ? 'bg-yellow-600/10 border-yellow-600/30' : s.result.includes('T2') ? 'bg-teal-600/10 border-teal-600/30' : s.result === 'MC' ? 'bg-red-600/10 border-red-600/30' : 'bg-gray-900/20 border-gray-800'}`}>
              <span className="text-xs font-bold text-gray-400 w-20">{s.result}</span>
              <span className="text-sm text-gray-300 flex-1">New OWGR: <span className="text-white font-bold">#{s.newOWGR}</span></span>
              <span className="text-sm text-gray-400">Race to Dubai: <span className="text-white font-bold">{s.rtd}</span></span>
              <span className={`text-sm font-bold w-10 text-right ${s.change.startsWith('+') ? 'text-teal-400' : 'text-red-400'}`}>{s.change}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Points expiry */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">⚠️ OWGR Points Expiry — Rolling 104 Weeks</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-xs border-b border-gray-800">
              <th className="text-left pb-2">Tournament</th>
              <th className="text-left pb-2">Position</th>
              <th className="text-left pb-2">Points</th>
              <th className="text-left pb-2">Expires</th>
            </tr></thead>
            <tbody>{pointsExpiry.map((p, i) => {
              const expired = getExpiryUrgency(p.expires).daysLeft < 0;
              return (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className={`py-2 ${expired ? 'text-gray-600' : 'text-gray-300'}`}>{p.event}</td>
                  <td className={`py-2 ${expired ? 'text-gray-600' : 'text-gray-400'}`}>{p.pos}</td>
                  <td className={`py-2 font-medium ${expired ? 'text-gray-600 line-through' : p.urgency === 'high' ? 'text-red-400' : p.urgency === 'medium' ? 'text-yellow-400' : 'text-gray-400'}`}>{p.points}</td>
                  <td className={`py-2 ${expired ? 'text-gray-600 line-through' : 'text-gray-500'}`}>{p.expires}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>
      {/* Rolling 104-week expiry calendar */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">📅 Rolling 104-Week Expiry Calendar</div>
        <RollingExpiryCalendar points={pointsExpiry} />
      </div>
      <GolfAISection context="owgr" player={player} session={session} />
    </div>
  );
}

type OptimiserResult = {
  must_play: { event: string; reason: string }[];
  consider_skipping: { event: string; reason: string }[];
  season_strategy: string;
};

function ScheduleOptimiser() {
  // Static recommendations — no AI call, rendered on mount.
  const STATIC_RESULT: OptimiserResult = {
    season_strategy: 'Protect Race to Dubai cut (#43 → target top 50). The Open + Halden Motors Championship are the OWGR shift events — don\'t arrive tired. Skip fillers after a major if fatigued.',
    must_play: [
      { event: 'The 154th Open Championship',            reason: 'Major — biggest OWGR + exemption swing on the season. Entry confirmed, Birkdale fits the ball flight. Full taper week.' },
      { event: 'Halden Motors Championship — Wentworth', reason: 'Course fit 9.0 — highest of the year. Meridian Series prize fund, big OWGR multiplier, home-soil crowd edge.' },
      { event: 'Omega European Masters',                  reason: 'Course fit 8.8. Two previous top-15s at Crans. Altitude + short game suits the wedge work.' },
      { event: 'Genesis Scottish Open',                   reason: 'Meridian Series, Open warm-up, strong peer comparison. Cannot miss the links-season rhythm.' },
      { event: 'DP World Tour Championship — Dubai',      reason: 'Only qualifies if you hold top 50 Race to Dubai. Chase this — £9M bonus pool.' },
    ],
    consider_skipping: [
      { event: 'Danish Golf Championship',        reason: 'Course fit 6.4, mid-tier purse, awkward travel between Scottish Open run. Recovery week better served at home.' },
      { event: 'Abu Dhabi Championship (if tired)', reason: 'Meridian Series but sits after DP World Championship — only play if fit. Skip protects Q1 2027 form.' },
    ],
  };
  return (
    <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <span className="text-sm font-bold text-white">🤖 AI Schedule Optimiser</span>
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Pre-computed</span>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-xs text-gray-400">Lumio AI weighs course fit, current form, Race to Dubai cut math, and fatigue load to recommend which events James should prioritise — and which to skip.</p>
        <div className="bg-gradient-to-r from-teal-900/30 to-green-900/20 border border-teal-600/30 rounded-lg p-3 italic text-sm text-teal-100">
          &quot;{STATIC_RESULT.season_strategy}&quot;
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Must Play</div>
          <div className="space-y-2">
            {STATIC_RESULT.must_play.map((m, i) => (
              <div key={i} className="bg-teal-900/15 border border-teal-600/30 rounded-lg p-3">
                <div className="text-sm font-semibold text-white">{m.event}</div>
                <div className="text-xs text-gray-400 mt-1">{m.reason}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Consider Skipping</div>
          <div className="space-y-2">
            {STATIC_RESULT.consider_skipping.map((m, i) => (
              <div key={i} className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-3">
                <div className="text-sm font-semibold text-white">{m.event}</div>
                <div className="text-xs text-gray-500 mt-1">{m.reason}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function _ScheduleOptimiserLiveUnused() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimiserResult | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/golf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: 'You are Lumio AI, strategic golf career analyst. Be direct and specific — this player takes your recommendations seriously.',
          messages: [{
            role: 'user',
            content: 'Optimise the tournament schedule for James Halton. His profile: OWGR #87 (target #61 career high, #50 for Major invitations), Race to Dubai #43 (needs top 50, currently +260 pts behind cut), SG profile: OTT +0.41, ATG -0.28, Putting -1.18 (critical weakness). Course fit scores: Halden Motors International 8.1, Halden Motors Championship 9.0, Scottish Open 7.2, The Open 6.8, Omega European Masters 8.8, Dunhill Links 7.0. Current season prize money £367k. He is entered in: Halden Motors International (this week), Scottish Open, The Open, British Masters, Omega Euro Masters. Which 5 remaining events should he absolutely prioritise, and which 2 should he consider skipping if fatigued? Respond ONLY in JSON: { "must_play": [{"event": "...", "reason": "..."}, ...], "consider_skipping": [{"event": "...", "reason": "..."}], "season_strategy": "2 sentence overall advice" }',
          }],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const text: string = data?.content?.[0]?.text || '';
      const s = text.indexOf('{');
      const e = text.lastIndexOf('}');
      if (s === -1 || e === -1) throw new Error('No JSON in response');
      const parsed = JSON.parse(text.slice(s, e + 1)) as OptimiserResult;
      setResult(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-4">
        <span className="text-sm font-bold text-white">🤖 AI Schedule Optimiser</span>
        <span className="text-gray-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-800 pt-4">
          <p className="text-xs text-gray-400">Lumio AI weighs course fit, current form, Race to Dubai cut math, and fatigue load to recommend which events James should prioritise — and which to skip.</p>
          <button onClick={generate} disabled={loading} className="bg-green-600/20 border border-green-500/40 text-green-300 text-xs font-semibold px-3 py-2 rounded hover:bg-green-600/30 disabled:opacity-50 transition-colors">
            {loading ? 'Generating…' : 'Generate Recommendations'}
          </button>
          {error && <div className="text-red-400 text-xs">⚠️ {error}</div>}
          {result && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-teal-900/30 to-green-900/20 border border-teal-600/30 rounded-lg p-3 italic text-sm text-teal-100">
                &quot;{result.season_strategy}&quot;
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Must Play</div>
                <div className="space-y-2">
                  {result.must_play.map((m, i) => (
                    <div key={i} className="bg-teal-900/15 border border-teal-600/30 rounded-lg p-3">
                      <div className="text-sm font-semibold text-white">{m.event}</div>
                      <div className="text-xs text-gray-400 mt-1">{m.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Consider Skipping</div>
                <div className="space-y-2">
                  {result.consider_skipping.map((m, i) => (
                    <div key={i} className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-3">
                      <div className="text-sm font-semibold text-white">{m.event}</div>
                      <div className="text-xs text-gray-500 mt-1">{m.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type Peer = {
  name: string;
  flag: string;
  owgr: number;
  r2d_pos: number;
  r2d_pts: number;
  last5: string[];
  trend: 'up' | 'down' | 'flat';
};

const PEERS: Peer[] = [
  { name: 'A. Rozner',           flag: '🇫🇷', owgr: 82, r2d_pos: 38, r2d_pts: 1380, last5: ['T8','T22','MC','T15','T4'], trend: 'up' },
  { name: 'M. Schmid',           flag: '🇩🇪', owgr: 84, r2d_pos: 40, r2d_pts: 1310, last5: ['MC','T18','T6','T29','MC'], trend: 'flat' },
  { name: 'H. Porteous',         flag: '🇿🇦', owgr: 89, r2d_pos: 46, r2d_pts: 1090, last5: ['T12','MC','T8','T33','T11'], trend: 'up' },
  { name: 'J. Janewattananond',  flag: '🇹🇭', owgr: 91, r2d_pos: 47, r2d_pts: 1050, last5: ['T5','T19','T8','MC','T14'], trend: 'down' },
  { name: 'J. Tarres',           flag: '🇪🇸', owgr: 93, r2d_pos: 49, r2d_pts: 990,  last5: ['T30','T11','MC','T8','T22'], trend: 'flat' },
  { name: 'R. Ramsay',           flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', owgr: 95, r2d_pos: 51, r2d_pts: 930, last5: ['MC','MC','T14','T6','T28'], trend: 'down' },
];

const JAMES_OWGR = 87;
const JAMES_R2D_PTS = 1250;

function CompetitorTracker() {
  function chipClass(r: string): string {
    if (r === 'MC') return 'bg-red-900/30 border-red-700/40 text-red-300';
    if (r.startsWith('T')) {
      const n = parseInt(r.slice(1), 10);
      return n <= 10 ? 'bg-green-900/30 border-green-700/40 text-green-300' : 'bg-yellow-900/30 border-yellow-700/40 text-yellow-300';
    }
    return 'bg-gray-800 border-gray-700 text-gray-400';
  }
  function trendArrow(t: 'up' | 'down' | 'flat'): { sym: string; cls: string } {
    if (t === 'up')   return { sym: '↑', cls: 'text-green-400' };
    if (t === 'down') return { sym: '↓', cls: 'text-red-400' };
    return { sym: '→', cls: 'text-gray-500' };
  }
  return (
    <div className="space-y-4">
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
        <div className="text-sm text-gray-300">You are <span className="text-green-300 font-semibold">#43</span> in Race to Dubai. <span className="text-white">3 peers</span> are ahead of you in the standings. <span className="text-yellow-300">Tarres is 7 pts behind the cut line</span> — worth watching.</div>
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Player</th>
              <th className="text-left p-3">OWGR</th>
              <th className="text-left p-3">R2D Pos</th>
              <th className="text-left p-3">R2D Pts</th>
              <th className="text-left p-3">Gap</th>
              <th className="text-left p-3">Last 5</th>
              <th className="text-left p-3">Trend</th>
            </tr>
          </thead>
          <tbody>
            {PEERS.map(p => {
              const owgrCls = p.owgr < JAMES_OWGR ? 'text-green-400' : 'text-red-400';
              const gap = p.r2d_pts - JAMES_R2D_PTS;
              const gapStr = gap >= 0 ? `+${gap} pts above` : `${gap} pts below`;
              const gapCls = gap >= 0 ? 'text-green-400' : 'text-red-400';
              const tr = trendArrow(p.trend);
              return (
                <tr key={p.name} className="border-b border-gray-800/50 hover:bg-gray-900/30">
                  <td className="p-3 text-gray-200"><span className="mr-2">{p.flag}</span>{p.name}</td>
                  <td className={`p-3 font-medium ${owgrCls}`}>#{p.owgr}</td>
                  <td className="p-3 text-gray-300">#{p.r2d_pos}</td>
                  <td className="p-3 text-gray-400">{p.r2d_pts}</td>
                  <td className={`p-3 text-xs font-medium ${gapCls}`}>{gapStr}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {p.last5.map((r, i) => (
                        <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded border ${chipClass(r)}`}>{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className={`p-3 text-base ${tr.cls}`}>{tr.sym}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScheduleView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const [tab, setTab] = useState<'calendar' | 'competitors'>('calendar');
  const calendar = [
    { date: '3–6 Jul',   event: 'Halden Motors International Open',         tier: 'DP World Tour',  venue: 'Golfclub München Eichenried, Munich',    status: 'active',   entered: true, prize: '$4.5M' },
    { date: '10–13 Jul', event: 'Estrella Damm N.A. Challenge',   tier: 'DP World Tour',  venue: 'Club de Golf Terramar, Barcelona',         status: 'upcoming', entered: true, prize: '$2M' },
    { date: '10–13 Jul', event: 'Genesis Scottish Open',           tier: 'Meridian Series',   venue: 'The Renaissance Club, North Berwick',     status: 'upcoming', entered: true, prize: '$9M' },
    { date: '17–20 Jul', event: 'The 154th Open Championship',     tier: 'Major',          venue: 'Royal Birkdale, Southport',               status: 'upcoming', entered: true, prize: '£17M' },
    { date: '14–17 Aug', event: 'Danish Golf Championship',        tier: 'DP World Tour',  venue: 'Great Northern, Funen, Denmark',          status: 'upcoming', entered: false, prize: '$2M' },
    { date: '28–31 Aug', event: 'British Masters (Belfry)',        tier: 'DP World Tour',  venue: 'The Belfry, Sutton Coldfield',            status: 'upcoming', entered: true, prize: '$2.5M' },
    { date: '4–7 Sep',   event: 'Omega European Masters',          tier: 'DP World Tour',  venue: 'Crans-sur-Sierre, Switzerland',           status: 'upcoming', entered: true, prize: '$3M' },
    { date: '17–20 Sep', event: 'Halden Motors Championship',            tier: 'Meridian Series',   venue: 'Wentworth Club, Surrey',                  status: 'upcoming', entered: true, prize: '$9M' },
    { date: '1–4 Oct',   event: 'Alfred Dunhill Links Championship', tier: 'DP World Tour', venue: 'St Andrews / Carnoustie / Kingsbarns',  status: 'upcoming', entered: true, prize: '$5M' },
    { date: '6–9 Nov',   event: 'Abu Dhabi Championship',          tier: 'Meridian Series',   venue: 'Yas Links, Abu Dhabi',                    status: 'upcoming', entered: false, prize: '$9M' },
    { date: '19–22 Nov', event: 'DP World Tour Championship',      tier: 'Meridian Series',   venue: 'Jumeirah Golf Estates, Dubai',            status: 'upcoming', entered: false, prize: '$10M+' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="🗓️" title="Tournament Schedule" subtitle="2026 season calendar — DP World Tour, Majors, Meridian Series, and co-sanctioned events." />
      <div className="flex gap-2 border-b border-gray-800">
        {(['calendar', 'competitors'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'text-green-300 border-green-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
            {t === 'calendar' ? 'Season Calendar' : 'Competitor Watch'}
          </button>
        ))}
      </div>
      {tab === 'competitors' && <CompetitorTracker />}
      {tab === 'calendar' && <>
      <ScheduleOptimiser />
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Events Played" value="18" sub="2026 season" color="blue" />
        <StatCard label="Cuts Made" value="13" sub="72% cut rate" color="teal" />
        <StatCard label="Prize Money YTD" value="£285k" sub="Excl. pro-ams" color="green" />
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
            <th className="text-left p-3">Dates</th>
            <th className="text-left p-3">Tournament</th>
            <th className="text-left p-3">Category</th>
            <th className="text-left p-3">Venue</th>
            <th className="text-left p-3">Prize Fund</th>
            <th className="text-left p-3">Status</th>
          </tr></thead>
          <tbody>{calendar.map((t, i) => (
            <tr key={i} className={`border-b border-gray-800/50 hover:bg-gray-900/30 ${t.status === 'active' ? 'bg-green-900/10' : ''}`}>
              <td className="p-3 text-gray-400 text-xs">{t.date}</td>
              <td className="p-3 text-gray-200 font-medium">{t.event}</td>
              <td className="p-3"><TourBadge tier={t.tier} /></td>
              <td className="p-3 text-gray-500 text-xs">{t.venue}</td>
              <td className="p-3 text-gray-400 text-xs">{t.prize}</td>
              <td className="p-3">
                {t.status === 'active' && <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">● In Progress</span>}
                {t.status === 'upcoming' && t.entered && <span className="text-xs text-blue-400">Entered</span>}
                {t.status === 'upcoming' && !t.entered && <span className="text-xs text-gray-600">Not entered</span>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      </>}
      <GolfAISection context="owgr" player={player} session={session} />
    </div>
  );
}

// ─── Putting Heat Map ─────────────────────────────────────────────────────────
type Putt = { distance: number; made: boolean; direction: 'left' | 'centre' | 'right' };
const DEMO_PUTTS: Putt[] = [
  { distance: 3,  made: true,  direction: 'centre' },
  { distance: 4,  made: true,  direction: 'centre' },
  { distance: 5,  made: true,  direction: 'centre' },
  { distance: 6,  made: true,  direction: 'centre' },
  { distance: 7,  made: false, direction: 'left'   },
  { distance: 9,  made: false, direction: 'left'   },
  { distance: 10, made: false, direction: 'right'  },
  { distance: 11, made: true,  direction: 'centre' },
  { distance: 12, made: false, direction: 'left'   },
  { distance: 13, made: false, direction: 'right'  },
  { distance: 14, made: false, direction: 'left'   },
  { distance: 15, made: false, direction: 'right'  },
  { distance: 17, made: false, direction: 'left'   },
  { distance: 18, made: true,  direction: 'centre' },
  { distance: 22, made: false, direction: 'right'  },
];

function PuttingHeatMap() {
  const [putts, setPutts] = useState<Putt[]>(DEMO_PUTTS);
  const [dist, setDist] = useState('');
  const [res, setRes] = useState<'made'|'missed'>('made');
  const [dir, setDir] = useState<'left'|'centre'|'right'>('centre');

  const bands: Array<{ label: string; min: number; max: number }> = [
    { label: '3-5ft',   min: 3,   max: 5.99 },
    { label: '5-8ft',   min: 6,   max: 8.99 },
    { label: '8-12ft',  min: 9,   max: 12.99 },
    { label: '12-15ft', min: 13,  max: 15.99 },
    { label: '15-20ft', min: 16,  max: 20.99 },
    { label: '20ft+',   min: 21,  max: 9999 },
  ];
  const dirs: Array<'left'|'centre'|'right'> = ['left', 'centre', 'right'];

  function cellStat(band: {min: number; max: number}, direction: 'left'|'centre'|'right') {
    const inCell = putts.filter(p => p.distance >= band.min && p.distance <= band.max && p.direction === direction);
    if (inCell.length === 0) return { pct: null as number | null, count: 0 };
    const made = inCell.filter(p => p.made).length;
    return { pct: Math.round((made / inCell.length) * 100), count: inCell.length };
  }

  function cellBg(pct: number | null): string {
    if (pct === null) return 'bg-gray-900/40 border border-gray-800';
    if (pct > 70)     return 'bg-green-600/20 border border-green-500/40';
    if (pct >= 40)    return 'bg-yellow-600/20 border border-yellow-500/40';
    return 'bg-red-600/20 border border-red-500/40';
  }
  function cellText(pct: number | null): string {
    if (pct === null) return 'text-gray-600';
    if (pct > 70)     return 'text-green-300';
    if (pct >= 40)    return 'text-yellow-300';
    return 'text-red-300';
  }

  // Summary stats
  const inside5 = putts.filter(p => p.distance <= 5);
  const inside5Pct = inside5.length ? Math.round((inside5.filter(p => p.made).length / inside5.length) * 100) : 0;
  const band8_15 = putts.filter(p => p.distance >= 8 && p.distance <= 15);
  const band8_15Pct = band8_15.length ? Math.round((band8_15.filter(p => p.made).length / band8_15.length) * 100) : 0;
  const avgPuttsRound = (putts.length / 1 * (31.2 / 15)).toFixed(1); // rough scaling from 15-putt demo

  function addPutt() {
    const d = parseFloat(dist);
    if (!Number.isFinite(d) || d <= 0) return;
    setPutts(prev => [...prev, { distance: d, made: res === 'made', direction: dir }]);
    setDist('');
  }
  function clearSession() {
    setPutts(DEMO_PUTTS);
    setDist('');
    setRes('made');
    setDir('centre');
  }

  return (
    <div>
      <div className="grid mb-3" style={{ gridTemplateColumns: '100px repeat(3, 1fr)' }}>
        <div></div>
        {dirs.map(d => (
          <div key={d} className="text-xs text-gray-500 uppercase tracking-wider font-semibold text-center pb-2">{d}</div>
        ))}
      </div>
      <div className="space-y-1.5">
        {bands.map(band => (
          <div key={band.label} className="grid items-center gap-1.5" style={{ gridTemplateColumns: '100px repeat(3, 1fr)' }}>
            <div className="text-xs text-gray-400 font-medium">{band.label}</div>
            {dirs.map(direction => {
              const { pct, count } = cellStat(band, direction);
              return (
                <div key={direction} className={`rounded-lg ${cellBg(pct)} px-3 py-4 text-center`}>
                  <div className={`text-lg font-black ${cellText(pct)}`}>{pct === null ? '—' : `${pct}%`}</div>
                  <div className="text-[9px] text-gray-500 mt-0.5">{count} putt{count === 1 ? '' : 's'}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Stat pills */}
      <div className="flex items-center gap-2 flex-wrap mt-4">
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${band8_15Pct < 40 ? 'bg-red-600/20 border-red-500/40 text-red-300' : band8_15Pct < 70 ? 'bg-yellow-600/20 border-yellow-500/40 text-yellow-300' : 'bg-green-600/20 border-green-500/40 text-green-300'}`}>
          Make % 8–15ft: {band8_15Pct}%
        </span>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${inside5Pct >= 90 ? 'bg-green-600/20 border-green-500/40 text-green-300' : inside5Pct >= 70 ? 'bg-yellow-600/20 border-yellow-500/40 text-yellow-300' : 'bg-red-600/20 border-red-500/40 text-red-300'}`}>
          Make % inside 5ft: {inside5Pct}%
        </span>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-gray-800/60 border-gray-700 text-gray-300">
          Average putts/round: {avgPuttsRound}
        </span>
      </div>

      {/* Log a putt form */}
      <div className="mt-5 pt-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Log a putt</div>
        <div className="flex items-end gap-2 flex-wrap">
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Distance (ft)</label>
            <input type="number" value={dist} onChange={e => setDist(e.target.value)} placeholder="12"
              className="w-24 bg-[#0a0b12] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-green-600" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Result</label>
            <div className="flex rounded-lg border border-gray-800 overflow-hidden">
              {(['made', 'missed'] as const).map(r => (
                <button key={r} onClick={() => setRes(r)}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${res === r ? (r === 'made' ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300') : 'bg-[#0a0b12] text-gray-500 hover:text-gray-300'}`}>
                  {r === 'made' ? '✓ Made' : '✗ Missed'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Direction</label>
            <div className="flex rounded-lg border border-gray-800 overflow-hidden">
              {(['left', 'centre', 'right'] as const).map(d => (
                <button key={d} onClick={() => setDir(d)}
                  className={`px-3 py-2 text-xs font-medium capitalize transition-colors ${dir === d ? 'bg-green-600/30 text-green-300' : 'bg-[#0a0b12] text-gray-500 hover:text-gray-300'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <button onClick={addPutt} disabled={!dist}
            className="px-4 py-2 bg-green-700 hover:bg-green-800 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors">
            Add
          </button>
          <button onClick={clearSession} className="text-xs text-gray-500 hover:text-gray-300 underline ml-auto">
            Clear session
          </button>
        </div>
      </div>

      <div className="mt-4 text-[10px] text-gray-600 italic">
        Connect Lumio Range to auto-populate from real round data.
      </div>
    </div>
  );
}

function StrokesGainedView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const roundData = [
    { round: 'R4 KLM Open', ott: 0.8, atg: 1.2, arg: 0.4, putt: -0.8, ttg: 2.0, total: 1.6, score: '67' },
    { round: 'R3 KLM Open', ott: 0.4, atg: 0.9, arg: -0.2, putt: -1.4, ttg: 1.1, total: -0.3, score: '71' },
    { round: 'R2 KLM Open', ott: 1.1, atg: 0.7, arg: 0.6, putt: -1.8, ttg: 2.4, total: 0.6, score: '69' },
    { round: 'R1 KLM Open', ott: -0.2, atg: 1.4, arg: 0.3, putt: -0.9, ttg: 1.5, total: 0.6, score: '68' },
    { round: 'R4 Austrian', ott: 0.6, atg: 0.3, arg: -0.4, putt: -1.6, ttg: 0.5, total: -1.1, score: '72' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="📈" title="Strokes Gained Analysis" subtitle={`${DEMO_PLAYER.name} · 2026 season · SG breakdown vs. DP World Tour field average`} />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'SG: Off the Tee', val: 0.41, color: 'teal' },
          { label: 'SG: Approach', val: -0.28, color: 'orange' },
          { label: 'SG: Around Green', val: 0.15, color: 'teal' },
          { label: 'SG: Putting', val: -1.18, color: 'red' },
          { label: 'SG: Total', val: -0.90, color: 'orange' },
        ].map((s, i) => (
          <div key={i} className={`bg-[#0d0f1a] border border-gray-800 rounded-xl p-4 text-center`}>
            <div className={`text-xl font-bold ${s.val >= 0 ? 'text-teal-400' : 'text-red-400'}`}>{s.val > 0 ? '+' : ''}{s.val.toFixed(2)}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      {/* Radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-4">SG Profile — Spider Chart (Season Average)</div>
          <SGRadar />
        </div>
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-4">SG Breakdown vs Tour Average</div>
          <div className="space-y-4 mt-6">
            <SGBar label="Off the Tee" value={0.41} />
            <SGBar label="Approach" value={-0.28} />
            <SGBar label="Around Green" value={0.15} />
            <SGBar label="Putting" value={-1.18} />
            <SGBar label="Tee-to-Green" value={0.28} />
            <SGBar label="Total" value={-0.90} />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500">
            🔴 Putting is the clear weakness. At -1.18 from 8–15ft, fixing this alone could add 1+ shot per round.
          </div>
        </div>
      </div>
      {/* Putting Heat Map */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">🎯 Putting Heat Map</div>
        <PuttingHeatMap />
      </div>
      {/* Round by round */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800"><div className="text-sm font-semibold text-white">Round-by-Round SG Log — Last 5 Rounds</div></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Round</th>
              <th className="text-right p-3">Score</th>
              <th className="text-right p-3">SG: OTT</th>
              <th className="text-right p-3">SG: ATG</th>
              <th className="text-right p-3">SG: ARG</th>
              <th className="text-right p-3">SG: Putt</th>
              <th className="text-right p-3">SG: Total</th>
            </tr></thead>
            <tbody>{roundData.map((r, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="p-3 text-gray-300">{r.round}</td>
                <td className="p-3 text-right text-white font-bold">{r.score}</td>
                {[r.ott, r.atg, r.arg, r.putt, r.total].map((v, j) => (
                  <td key={j} className={`p-3 text-right font-medium ${v >= 0 ? 'text-teal-400' : 'text-red-400'}`}>{v > 0 ? '+' : ''}{v.toFixed(1)}</td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <GolfAISection context="strokes" player={player} session={session} />
    </div>
  );
}

function CourseFitView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const courses = [
    { event: 'Halden Motors International Open', venue: 'Golfclub München Eichenried', fit: 8.1, ott: 9.2, atg: 7.4, putting: 6.8, prevResult: 'T14 (2024)', note: 'Approach from 150–175 is elite. Putting surface suits right-to-left readers.' },
    { event: 'Halden Motors Championship', venue: 'Wentworth', fit: 9.0, ott: 8.8, atg: 9.1, putting: 7.2, prevResult: 'T6 (2024)', note: 'Best course fit on tour. Long course favours his driving distance.' },
    { event: 'Genesis Scottish Open', venue: 'The Renaissance Club', fit: 7.2, ott: 8.1, atg: 7.8, putting: 5.8, prevResult: 'T6 (2025)', note: 'Links putting has been inconsistent. Approach game excels in firm conditions.' },
    { event: 'The Open Championship', venue: 'Royal Birkdale', fit: 6.8, ott: 8.4, atg: 6.2, putting: 5.5, prevResult: 'MC (2024)', note: 'Major championship stress often affects putting. Focus on ball-striking and manage expectations.' },
    { event: 'Omega European Masters', venue: 'Crans-sur-Sierre', fit: 8.8, ott: 7.6, atg: 9.4, putting: 7.9, prevResult: 'T3 (2023)', note: 'High-altitude approach play suits his 150–175 game. Second-best fit on tour.' },
    { event: 'Alfred Dunhill Links', venue: 'St Andrews / Carnoustie', fit: 7.0, ott: 9.0, atg: 6.8, putting: 5.9, prevResult: 'T19 (2024)', note: 'Multi-course format works well — Carnoustie (hard) is a weakness, St Andrews is strong.' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="🗺️" title="Course Fit & Strategy" subtitle="SG-profile vs. course demand scoring — ranked best-fit events for the season." />
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-2">How Course Fit is Calculated</div>
        <div className="text-xs text-gray-400">Your SG profile (Off Tee, Approach, Around Green, Putting) is weighted against each course's historical demands. A short, twisty track rewards SG Approach and Putting. A bombers' course rewards SG Off Tee. The higher the fit score, the more your game matches the course requirements.</div>
      </div>
      <div className="space-y-3">
        {courses.map((c, i) => (
          <div key={i} className={`bg-[#0d0f1a] border rounded-xl p-5 ${c.fit >= 8.5 ? 'border-teal-600/40' : c.fit >= 7.5 ? 'border-blue-600/30' : 'border-gray-800'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-white font-semibold">{c.event}</div>
                <div className="text-xs text-gray-500">{c.venue}</div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-black ${c.fit >= 8.5 ? 'text-teal-400' : c.fit >= 7.5 ? 'text-blue-400' : 'text-gray-400'}`}>{c.fit}</div>
                <div className="text-xs text-gray-500">/ 10 fit</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[{ label: 'Off Tee', val: c.ott }, { label: 'Approach', val: c.atg }, { label: 'Putting', val: c.putting }].map((s, j) => (
                <div key={j} className="bg-black/20 rounded-lg p-2 text-center">
                  <div className={`text-sm font-bold ${s.val >= 8 ? 'text-teal-400' : s.val >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>{s.val}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-400 border-t border-gray-800/50 pt-3">
              <span className="text-gray-500">Last year: </span>{c.prevResult} · {c.note}
            </div>
          </div>
        ))}
      </div>
      <GolfAISection context="coursefit" player={player} session={session} />
    </div>
  );
}

function CaddieView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const strategy = [
    { hole: 1, par: 4, yards: 432, wind: 'Into', strategy: 'Driver, leave 150–160 to flag. Miss short and right — bunkers left are punishing.', risk: 'Low' },
    { hole: 2, par: 5, yards: 556, wind: 'Down', strategy: 'Driver, 3-wood into green in two. Pin back-left — land middle, take 2 putts.', risk: 'Med' },
    { hole: 3, par: 3, yards: 198, wind: 'Left', strategy: 'Into-left wind — one extra club. Aim body of green. Never pin on left side.', risk: 'Low' },
    { hole: 4, par: 4, yards: 465, wind: 'Down', strategy: 'Driver down right side. 7-iron in. Birdie opportunity — commit.', risk: 'Med' },
    { hole: 7, par: 4, yards: 388, wind: 'Cross', strategy: 'SCORING HOLE. 3-wood for position. Gap wedge in — this is where rounds are made.', risk: 'Attack' },
    { hole: 9, par: 4, yards: 445, wind: 'Into', strategy: 'Playing long. Lay up with 3-iron, 9-iron in. Bogey is fine — halftime hole.', risk: 'Low' },
    { hole: 15, par: 5, yards: 578, wind: 'Down', strategy: 'SCORING HOLE. Eagle putt opportunity. Driver, hybrid, short wedge. Be aggressive.', risk: 'Attack' },
    { hole: 18, par: 4, yards: 468, wind: 'Into', strategy: 'Into wind. Driver, take 6-iron. Two-putt par to close. Do not go for broke.', risk: 'Low' },
  ];
  const checklist = [
    { task: 'Yardage book updated', done: true },
    { task: 'Pin sheet collected', done: true },
    { task: 'Carry distances loaded', done: true },
    { task: 'Weather checked', done: true },
    { task: 'Ball supply (12) packed', done: false },
    { task: 'Gloves (3 pairs) packed', done: false },
    { task: 'Wet weather gear', done: false },
    { task: 'Snacks / hydration', done: false },
  ];
  function printCaddieSheet() {
    const w = window.open('', '_blank', 'width=900,height=1200');
    if (!w) return;
    const rows = strategy.map(s => `<tr><td style="font-weight:700">${s.hole}</td><td>Par ${s.par}</td><td>${s.yards}y</td><td>${s.wind}</td><td>${s.strategy}</td><td>${s.risk}</td></tr>`).join('');
    const check = checklist.map(c => `<label><input type="checkbox" ${c.done ? 'checked' : ''} disabled> ${c.task}</label>`).join('');
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    w.document.write(`<!doctype html><html><head><title>Caddie Sheet</title><style>
@media print { body { margin: 0 } }
body { font-family: -apple-system, system-ui, sans-serif; font-size: 11px; color: #111; background: #fff; padding: 16px; line-height: 1.35 }
h1 { font-size: 16px; margin: 0 0 2px; letter-spacing: 0.02em }
h2 { font-size: 12px; margin: 14px 0 6px; text-transform: uppercase; letter-spacing: 0.06em; color: #333; border-bottom: 1px solid #333; padding-bottom: 2px }
.sub { font-size: 10px; color: #555; margin-bottom: 4px }
.conditions { border: 1px solid #000; padding: 6px 10px; margin: 10px 0; font-weight: 700; font-size: 11px }
table { width: 100%; border-collapse: collapse; font-size: 10px }
th, td { border: 1px solid #333; padding: 4px 6px; text-align: left; vertical-align: top }
th { background: #eee; text-transform: uppercase; font-size: 9px; letter-spacing: 0.04em }
.checklist { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; font-size: 10px }
.notes { margin-top: 12px; padding: 8px; border: 1px solid #333; background: #f8f8f8 }
.notes li { margin: 2px 0 }
</style></head><body>
<h1>CADDIE SHEET — Golfclub München Eichenried</h1>
<div class="sub">James Halton · Round 1 · Thu 09:42 &nbsp;|&nbsp; ${today}</div>
<div class="conditions">12mph SW · Soft greens · +1 club adjustments</div>
<h2>Hole Strategy</h2>
<table><thead><tr><th>Hole</th><th>Par</th><th>Yardage</th><th>Wind</th><th>Strategy</th><th>Risk</th></tr></thead><tbody>${rows}</tbody></table>
<h2>Pre-Round Checklist</h2>
<div class="checklist">${check}</div>
<h2>Key Notes</h2>
<div class="notes"><ul>
<li>Putting weakness 8&ndash;15ft &mdash; commit to reads</li>
<li>Scoring holes: 7 and 15 &mdash; be aggressive</li>
<li>Lower back &mdash; watch tempo in rounds 3&ndash;4</li>
</ul></div>
</body></html>`);
    w.document.close();
    setTimeout(() => { try { w.print(); } catch {} }, 300);
  }
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader icon="🏌️" title="Caddie Workflow" subtitle="Digital yardage book, hole strategy notes, in-round stat log, and pre-round checklist." />
        <button onClick={printCaddieSheet} className="bg-green-700 hover:bg-green-800 text-white text-xs px-4 py-2 rounded-lg flex-shrink-0 whitespace-nowrap mt-1">🖨️ Print Caddie Sheet</button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4"><div className="text-white font-bold">Mick O'Brien</div><div className="text-xs text-gray-400 mt-1">Lead caddie · 8 years</div><div className="text-xs text-teal-400 mt-1">Synced to today's round</div></div>
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4"><div className="text-white font-bold">09:42 Tee</div><div className="text-xs text-gray-400 mt-1">Thursday · Hole 1 · Munich</div><div className="text-xs text-green-400 mt-1">Carry sheet loaded</div></div>
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4"><div className="text-white font-bold">12mph SW</div><div className="text-xs text-gray-400 mt-1">Wind forecast · Soft greens</div><div className="text-xs text-yellow-400 mt-1">+1 club adjustments noted</div></div>
      </div>
      {/* Pre-round checklist */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Pre-Round Checklist</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { task: 'Yardage book updated', done: true },
            { task: 'Pin sheet collected', done: true },
            { task: 'Carry distances loaded', done: true },
            { task: 'Weather checked', done: true },
            { task: 'Ball supply (12) packed', done: false },
            { task: 'Gloves (3 pairs) packed', done: false },
            { task: 'Wet weather gear', done: false },
            { task: 'Snacks / hydration', done: false },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div className={`w-4 h-4 rounded flex items-center justify-center text-xs ${item.done ? 'bg-teal-600/30 text-teal-400' : 'border border-gray-600'}`}>{item.done ? '✓' : ''}</div>
              <span className={item.done ? 'text-gray-400 line-through' : 'text-gray-200'}>{item.task}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Hole strategy */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800"><div className="text-sm font-semibold text-white">Hole Strategy Notes — Golfclub München Eichenried</div></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Hole</th><th className="text-left p-3">Par</th><th className="text-left p-3">Yardage</th><th className="text-left p-3">Wind</th><th className="text-left p-3">Strategy</th><th className="text-left p-3">Risk</th>
            </tr></thead>
            <tbody>{strategy.map((s, i) => (
              <tr key={i} className={`border-b border-gray-800/50 ${s.risk === 'Attack' ? 'bg-green-900/10' : ''}`}>
                <td className="p-3 text-white font-bold">{s.hole}</td>
                <td className="p-3 text-gray-400">Par {s.par}</td>
                <td className="p-3 text-gray-400">{s.yards}y</td>
                <td className="p-3 text-gray-400 text-xs">{s.wind}</td>
                <td className="p-3 text-gray-300 text-xs">{s.strategy}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded font-medium ${s.risk === 'Attack' ? 'bg-green-600/20 text-green-400' : s.risk === 'Med' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>{s.risk}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <GolfAISection context="coursefit" player={player} session={session} />
    </div>
  );
}

function TeamHubView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const team = [
    { role: 'Lead Coach', name: 'Pete Larsen', flag: '🇸🇪', status: 'On-site Munich', statusColor: 'green', lastNote: 'Practice session notes uploaded · 08:30', desc: 'Full swing, course management, practice structure' },
    { role: 'Short Game Coach', name: 'Dave Pelz Jr.', flag: '🇺🇸', status: 'Remote (video)', statusColor: 'blue', lastNote: 'Putting drill programme sent · Yesterday', desc: 'Putting, chipping, bunker play, wedge game' },
    { role: 'Caddie', name: 'Mick O\'Brien', flag: '🇮🇪', status: 'On-site Munich', statusColor: 'green', lastNote: 'Strategy notes updated · 07:45', desc: 'Shot selection, yardage book, on-course support' },
    { role: 'Physio', name: 'Tom Walsh', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', status: 'Treatment at 13:00', statusColor: 'yellow', lastNote: 'Lower back flagged mild · Cleared to play', desc: 'Treatment, injury management, recovery protocols' },
    { role: 'Fitness Trainer', name: 'Jake Portman', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', status: 'London (remote)', statusColor: 'blue', lastNote: 'Weekly conditioning plan sent', desc: 'Strength, power, mobility, periodisation' },
    { role: 'Agent', name: 'Sarah Mitchell', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', status: 'Vanta Sports renewal!', statusColor: 'red', lastNote: 'Vanta Sports caption drafted — awaiting approval', desc: 'Sponsorship, appearances, schedule, commercial' },
    { role: 'Mental Coach', name: 'Dr. Alison Reed', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', status: 'Video call 20:00', statusColor: 'purple', lastNote: 'Pre-round routine shared · 09:00', desc: 'Pressure management, focus, routine, mindset' },
    { role: 'Accountant', name: 'Chris Davies (PwC)', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', status: 'Q2 filing due', statusColor: 'yellow', lastNote: 'Jurisdiction report requested for June earnings', desc: 'Multi-jurisdiction tax, prize money, financial planning' },
  ];
  const colors: Record<string, string> = { green: 'bg-green-500/10 text-green-400 border-green-500/30', blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30', yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', red: 'bg-red-500/10 text-red-400 border-red-500/30', purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
  return (
    <div className="space-y-6">
      <SectionHeader icon="👥" title="Team Hub" subtitle="Full player team — role-specific feeds, shared data, and communications in one place." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.map((m, i) => (
          <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-600/20 border border-green-500/30 flex items-center justify-center text-lg">{m.flag}</div>
                <div><div className="text-white font-semibold">{m.name}</div><div className="text-xs text-green-400">{m.role}</div></div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[m.statusColor]}`}>{m.status}</span>
            </div>
            <div className="bg-black/20 rounded-lg p-2 mb-2"><div className="text-xs text-gray-400">💬 {m.lastNote}</div></div>
            <div className="text-xs text-gray-600">{m.desc}</div>
          </div>
        ))}
      </div>
      <GolfAISection context="default" player={player} session={session} />
    </div>
  );
}

const GOLF_ROUND_LOAD = [
  { week: 'Jan W1', matches: 2, hours: 9.2 },
  { week: 'Jan W2', matches: 1, hours: 4.6 },
  { week: 'Jan W3', matches: 2, hours: 9.1 },
  { week: 'Feb W1', matches: 1, hours: 4.4 },
  { week: 'Feb W2', matches: 2, hours: 8.8 },
  { week: 'Feb W3', matches: 2, hours: 9.3 },
  { week: 'Mar W1', matches: 1, hours: 4.1 },
  { week: 'Mar W2', matches: 2, hours: 9.0 },
  { week: 'Mar W3', matches: 2, hours: 9.2 },
  { week: 'Mar W4', matches: 1, hours: 4.5 },
  { week: 'Apr W1', matches: 2, hours: 8.7 },
  { week: 'Apr W2', matches: 2, hours: 9.4 },
  { week: 'Apr W3', matches: 1, hours: 4.2 },
];

function GolfRecoveryChart() {
  const data = [74, 80, 78, 81, 76, 82, 78];
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
          <linearGradient id="golfRecovGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#golfRecovGrad)" />
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

function PhysioView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const isDemoShellGolf = session.isDemoShell !== false;
  const totalRounds90d = GOLF_ROUND_LOAD.reduce((a,w)=>a+w.matches,0);
  const totalHours90d = GOLF_ROUND_LOAD.reduce((a,w)=>a+w.hours,0);
  const maxRoundsInWeek = Math.max(...GOLF_ROUND_LOAD.map(w=>w.matches));
  const fatigueRisk = totalRounds90d > 12;
  const recovery = [
    { date: 'Today',       score: 78, hrv: 62, rhr: 52, sleep: 7.0 },
    { date: 'Yesterday',   score: 84, hrv: 68, rhr: 50, sleep: 7.8 },
    { date: '2 days ago',  score: 71, hrv: 58, rhr: 55, sleep: 6.4 },
    { date: '3 days ago',  score: 88, hrv: 72, rhr: 48, sleep: 8.1 },
    { date: '4 days ago',  score: 81, hrv: 65, rhr: 51, sleep: 7.5 },
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
    { id: 'back',     x: 100, y: 110, severity: 'moderate',   label: 'Lower back',       note: 'L4/L5 rotation load — daily mobility + core routine' },
    { id: 'lwrist',   x: 48,  y: 150, severity: 'minor',      label: 'Left wrist',       note: 'Lead hand mild strain — taping + Voltaren on practice days' },
    { id: 'rshoulder',x: 132, y: 66,  severity: 'minor',      label: 'Right shoulder',   note: 'Follow-through mobility work — 2x/week band programme' },
    { id: 'lhip',     x: 82,  y: 156, severity: 'monitoring', label: 'Left hip',         note: 'Rotation range — weekly osteopath check' },
    { id: 'neck',     x: 100, y: 45,  severity: 'monitoring', label: 'Neck',             note: 'Post-round release routine' },
  ];
  const selectedMarker = bodyMarkers.find(m => m.id === selectedBodyPart) ?? null;

  return (
    <div className="space-y-6">
      <SectionHeader icon="⚕️" title="Physio & Recovery" subtitle="Injury log, medical clearance, Lumio Wear recovery scores, and treatment protocols." />

      {/* Section 2 — 4 StatCards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Recovery Score" value="78/100" sub="Today (Lumio Wear)" color="teal" />
        <StatCard label="HRV" value="62ms" sub="▼6ms vs yesterday" color="orange" />
        <StatCard label="Resting HR" value="52 bpm" sub="Travel fatigue flag" color="blue" />
        <StatCard label="Sleep" value="7.0 hrs" sub="Below 7.5 target" color="yellow" />
      </div>

      {/* Section 3 — Cleared-for-round banner */}
      {isDemoShellGolf ? (
        <div className="bg-gradient-to-r from-green-900/30 to-green-900/10 border border-green-600/30 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <div className="text-white font-medium">Cleared for tournament play</div>
              <div className="text-xs text-gray-400 mt-0.5">Lower back mobility 2/10 · No restrictions · Watch 4th-round fatigue</div>
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

      {/* Section 4 — Three-Month Round Load */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-white">📊 Three-Month Round Load</div>
            <div className="text-xs text-gray-400 mt-0.5">Last 90 days — round count + travel fatigue tracking</div>
          </div>
          {fatigueRisk && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-600/30">⚠ HIGH LOAD</span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className={`p-3 rounded-lg border text-center ${fatigueRisk?'bg-amber-900/10 border-amber-600/20':'bg-green-900/10 border-green-600/20'}`}>
            <div className={`text-2xl font-bold ${fatigueRisk?'text-amber-400':'text-green-400'}`}>{totalRounds90d}</div>
            <div className="text-xs text-gray-500">Rounds (90d)</div>
            <div className={`text-[10px] mt-0.5 ${fatigueRisk?'text-amber-400':'text-green-400'}`}>{fatigueRisk?'⚠ Over 12 — fatigue threshold':'✓ Under 12 — target'}</div>
          </div>
          <div className="p-3 rounded-lg border bg-[#0a0c14] border-gray-800 text-center">
            <div className="text-2xl font-bold text-teal-400">{totalHours90d.toFixed(1)}h</div>
            <div className="text-xs text-gray-500">Round hours (90d)</div>
          </div>
          <div className="p-3 rounded-lg border bg-[#0a0c14] border-gray-800 text-center">
            <div className="text-2xl font-bold text-orange-400">{maxRoundsInWeek}</div>
            <div className="text-xs text-gray-500">Peak week rounds</div>
          </div>
        </div>
        <div className="flex items-end gap-1 h-20 mb-2">
          {GOLF_ROUND_LOAD.map((w,i)=>{
            const h=(w.matches/Math.max(maxRoundsInWeek,1))*100;
            const col=w.matches>=4?'#EF4444':w.matches>=3?'#F97316':'#15803D';
            return(
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full rounded-t" style={{height:`${h}%`,background:col,opacity:0.8}}/>
                <div className="text-[7px] text-gray-600" style={{fontSize:'6px'}}>{w.week}</div>
              </div>
            );
          })}
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
                <filter id="lumioMarkerGlowGolf" x="-50%" y="-50%" width="200%" height="200%">
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
              {isDemoShellGolf && bodyMarkers.map(m => {
                const cfg = SEVERITY_CONFIG[m.severity];
                const isCritical = m.severity === 'critical';
                const isSelected = selectedBodyPart === m.id;
                return (
                  <g key={m.id} className={isCritical ? 'lumio-pulse-critical' : ''} style={{ cursor: 'pointer' }} onClick={() => setSelectedBodyPart(m.id)}>
                    <circle cx={m.x} cy={m.y} r={cfg.r + 2} fill={cfg.fill} opacity="0.35" filter="url(#lumioMarkerGlowGolf)" />
                    <circle cx={m.x} cy={m.y} r={cfg.r} fill={cfg.fill} stroke="#fff" strokeWidth={isSelected ? 2.5 : 1.5} />
                    <circle cx={m.x} cy={m.y} r={cfg.r * 0.35} fill="#fff" opacity="0.9" />
                  </g>
                );
              })}
            </svg>
          </div>
          {isDemoShellGolf ? (
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
          {isDemoShellGolf ? (
            <div className="space-y-2">
              {[
                { date: '2024-08', site: 'Left wrist tendinopathy', severity: 'Moderate', days: 21 },
                { date: '2024-05', site: 'L4/L5 disc spasm',        severity: 'Moderate', days: 14 },
                { date: '2024-01', site: 'Right shoulder impingement', severity: 'Mild',  days: 9  },
                { date: '2023-10', site: 'Left hip flexor strain',  severity: 'Mild',     days: 7  },
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
          ) : (
            <p className="text-xs text-gray-500">Nothing logged yet.</p>
          )}
        </div>
      </div>

      {/* Section 6 — Lumio Wear Recovery Chart */}
      <GolfRecoveryChart />

      {/* Section 7 — Recovery Trend — Last 5 Days */}
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

      {/* Section 8 — Treatment log */}
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-3">Treatment log — last 5 sessions</h2>
        {isDemoShellGolf ? (
          <div className="rounded-lg border border-white/5 overflow-hidden">
            <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-black/40 text-[11px] text-gray-500 uppercase tracking-wide">
              <span>Date</span><span>Therapist</span><span>Focus</span><span>Duration</span>
            </div>
            {[
              { date: '15 Apr', therapist: 'Dr Helen Marsh',  focus: 'Lower back mobility + soft tissue',   time: '45 min' },
              { date: '12 Apr', therapist: 'M. Lawrence',     focus: 'Full body sports massage',            time: '60 min' },
              { date: '9 Apr',  therapist: 'Dr Helen Marsh',  focus: 'Wrist ultrasound + ice',              time: '30 min' },
              { date: '5 Apr',  therapist: 'Thomas Nyberg',   focus: 'Dry needling — back + hips',          time: '45 min' },
              { date: '2 Apr',  therapist: 'Dr Helen Marsh',  focus: 'Post-round ROM assessment',           time: '30 min' },
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
        {isDemoShellGolf ? (
          <div className="space-y-2">
            {[
              'TRX core circuit — 15 min',
              'Hip mobility flow',
              'Thoracic rotation drills',
              'Forearm extensor stretches',
              'Hydration — 3L water + electrolytes',
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
        {isDemoShellGolf ? (
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'Dr Helen Marsh',  role: 'Golf Physio',        phone: '07700 900201' },
              { name: 'Thomas Nyberg',   role: 'Osteopath',          phone: '07700 900202' },
              { name: 'Marco Lawrence',  role: 'Massage Therapist',  phone: '07700 900203' },
            ].map((p, i) => (
              <div key={i} className="bg-gray-900/60 border border-white/5 rounded-xl p-3">
                <div className="text-white font-medium text-sm">{p.name}</div>
                <div className="text-xs text-gray-500">{p.role}</div>
                <div className="text-xs text-green-400 mt-1">{p.phone}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
            <p className="text-xs text-gray-500">Nothing logged yet.</p>
          </div>
        )}
      </div>

      <GolfAISection context="default" player={player} session={session} />
    </div>
  );
}

function EquipmentView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const bag = [
    { club: 'Driver', brand: 'Vanta Sports Qi10 Max', loft: '9.5°', shaft: 'Graphite Design Tour AD XC', flex: 'X', notes: 'Main gaming driver — 3 available' },
    { club: '3-Wood', brand: 'Vanta Sports Qi10', loft: '15°', shaft: 'Mitsubishi Diamana Blue', flex: 'X', notes: 'Used for tight tee shots and second shots' },
    { club: '5-Wood', brand: 'Vanta Sports Qi10', loft: '19°', shaft: 'Mitsubishi Diamana Blue', flex: 'X', notes: 'Used on long par-5 second shots' },
    { club: '4-Iron', brand: 'Vanta Sports P·790', loft: '23°', shaft: 'Dynamic Gold X100', flex: 'X', notes: 'Punchy iron in driving conditions' },
    { club: '5–PW', brand: 'Vanta Sports P·770', loft: 'Standard', shaft: 'Dynamic Gold X100', flex: 'X', notes: 'Core irons — stock specs' },
    { club: '50° GW', brand: 'Vanta Sports Jaws Raw', loft: '50°', shaft: 'Dynamic Gold Spinner', flex: 'S', notes: 'Vanta Sports endorsement — gap wedge' },
    { club: '54° SW', brand: 'Vanta Sports Jaws Raw', loft: '54°', shaft: 'Dynamic Gold Spinner', flex: 'S', notes: 'Sand & rough — most used wedge' },
    { club: '60° LW', brand: 'Vanta Sports Jaws Raw', loft: '60°', shaft: 'Dynamic Gold Spinner', flex: 'S', notes: 'Flop and bunker shots' },
    { club: 'Putter', brand: 'Scotty Cameron X5.5', loft: '3°', shaft: 'Stock', flex: 'N/A', notes: 'Tournament putter — has backup' },
    { club: 'Ball', brand: 'Vanta Sports Chrome Tour X', loft: '—', shaft: '—', flex: '—', notes: 'Vanta Sports endorsement — 2 dozen per round' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="🛍️" title="Equipment & Bag" subtitle="Full bag setup, club specifications, and ball contract details." />
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4"><div className="text-white font-bold">Vanta Sports</div><div className="text-xs text-gray-400 mt-1">Clubs (irons, woods)</div><div className="text-xs text-teal-400 mt-1">Active — expires Dec 2026</div></div>
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4"><div className="text-white font-bold">Vanta Sports</div><div className="text-xs text-gray-400 mt-1">Wedges + Ball</div><div className="text-xs text-teal-400 mt-1">Active — 18 days to renewal</div></div>
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4"><div className="text-white font-bold">Scotty Cameron</div><div className="text-xs text-gray-400 mt-1">Putter (personal)</div><div className="text-xs text-gray-500 mt-1">Not sponsored — personal</div></div>
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800"><div className="text-sm font-semibold text-white">Current Bag Setup</div></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Club</th><th className="text-left p-3">Brand / Model</th><th className="text-left p-3">Loft</th><th className="text-left p-3">Shaft</th><th className="text-left p-3">Notes</th>
            </tr></thead>
            <tbody>{bag.map((c, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="p-3 text-white font-medium">{c.club}</td>
                <td className="p-3 text-gray-300">{c.brand}</td>
                <td className="p-3 text-gray-400">{c.loft}</td>
                <td className="p-3 text-gray-400">{c.shaft}</td>
                <td className="p-3 text-gray-500">{c.notes}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <GolfAISection context="default" player={player} session={session} />
    </div>
  );
}

function MentalView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const routines = [
    { phase: 'Night Before', steps: ['Review hole strategy notes with Mick', 'Visualise first 3 holes', 'Read pre-round mindset note from Dr. Reed', 'No social media after 9pm', 'Lights out by 10:30pm'] },
    { phase: 'Morning of Round', steps: ['Morning briefing at 07:30', 'Light breakfast — no new foods', 'Practice putting for 20 minutes', 'Swing warmup 45 min before tee', 'Focus word: "committed"'] },
    { phase: 'On Course', steps: ['Walk-in routine: 2 deep breaths before every shot', 'Accept the bad shot in 10 seconds, move on', 'Talk to Mick between shots — stay social', 'No score tracking until 14th hole', 'Celebrate birdies — brief, genuine, move on'] },
    { phase: 'Post-Round', steps: ['3-minute debrief with Pete: what went well', 'Log any specific focus issues for Dr. Reed', 'Avoid social media score comparison', 'Dinner with team — decompress', 'Brief video call with Dr. Reed if needed'] },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="🧠" title="Mental Performance" subtitle="Pre-shot routines, pressure management, mindset tracker, and Dr. Reed's programme." />
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Mindset Score" value="7.8/10" sub="Self-rated this week" color="purple" />
        <StatCard label="Focus Events" value="3" sub="This month (logged)" color="teal" />
        <StatCard label="Next Session" value="Tonight 20:00" sub="Dr. Alison Reed" color="blue" />
      </div>
      <div className="space-y-4">
        {routines.map((r, i) => (
          <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-purple-400 mb-3">{r.phase}</div>
            <div className="space-y-1.5">
              {r.steps.map((s, j) => (
                <div key={j} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-purple-500 mt-0.5">•</span><span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-[#0d0f1a] border border-purple-600/30 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">📝 Dr. Reed's Pre-Round Note — Today</div>
        <div className="text-sm text-gray-300 leading-relaxed">
          "James — today is a course you know well and one where your game profile fits. The putting anxiety from recent rounds is understandable, but it's created a cycle of tension that's the real problem — not the putts themselves. Today: make your reads, commit fully, and accept the outcome. The routine we practised controls the controllables. Whatever the line does after you hit it is not yours to manage. Play shot to shot. You've done the work."
        </div>
      </div>
      <GolfAISection context="mental" player={player} session={session} />
    </div>
  );
}

function SponsorshipView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const deals = [
    { sponsor: 'Vanta Sports', cat: 'Clubs', value: '£80k/yr + bonuses', status: 'Active', expiry: 'Dec 2026', days: 275, obligations: ['Use Vanta Sports driver, woods, irons in all events', 'Social: 1 post/month minimum', 'Attend 1 Vanta Sports event/yr'], bonuses: ['Win bonus: +£15k', 'Top 50 OWGR: +£10k'] },
    { sponsor: 'Vanta Sports', cat: 'Wedges + Ball', value: '£55k/yr', status: 'Renewal due', expiry: 'Jul 26 2026', days: 18, obligations: ['Vanta Sports wedges in all events', 'Chrome Tour X ball mandatory', 'Social: 2 posts/month', 'Appear in 1 campaign/yr'], bonuses: ['Top 10 this week: +£8.5k'] },
    { sponsor: 'Meridian Watches', cat: 'Watch / Luxury', value: '£45k/yr', status: 'Active', expiry: 'Jan 2027', days: 292, obligations: ['Wear Meridian Watches in all press conferences', 'Ranking report monthly to Meridian Watches brand team'], bonuses: [] },
    { sponsor: 'Halden Motors', cat: 'Vehicle / Title Sponsor', value: 'Vehicle + £30k/yr', status: 'Active', expiry: 'Dec 2026', days: 275, obligations: ['Pro-am partner appearances at Halden Motors events', 'Logo on bag', 'Post-win interview mention'], bonuses: [] },
    { sponsor: 'Apex Performance', cat: 'Apparel', value: '£40k/yr', status: 'Active', expiry: 'Jun 2027', days: 450, obligations: ['Full Apex Performance apparel on course', '2 social posts/month', 'Style shoot once/yr'], bonuses: [] },
    { sponsor: 'Hublot', cat: 'Watch (Alt.)', value: 'Product only', status: 'Under review', expiry: '—', days: 0, obligations: ['Agent in negotiation — no current obligations'], bonuses: [] },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="🤝" title="Sponsorship Manager" subtitle="Every deal, every obligation, every deadline — tracked automatically." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Annual Value" value="£250k+" sub="Confirmed contracts" color="yellow" />
        <StatCard label="Active Deals" value="5" sub="1 renewal critical" color="green" />
        <StatCard label="Vanta Sports Renewal" value="18 days" sub="⚠️ Action required" color="red" />
        <StatCard label="Obligations Today" value="1" sub="Vanta Sports post due" color="orange" />
      </div>
      <div className="space-y-3">
        {deals.map((deal, i) => (
          <div key={i} className={`bg-[#0d0f1a] border rounded-xl p-4 ${deal.status === 'Renewal due' ? 'border-red-600/40' : deal.status === 'Under review' ? 'border-yellow-600/30' : 'border-gray-800'}`}>
            <div className="flex items-start justify-between mb-3">
              <div><div className="flex items-center gap-2"><span className="text-white font-semibold">{deal.sponsor}</span><span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{deal.cat}</span></div><div className="text-sm text-gray-400 mt-0.5">{deal.value}</div></div>
              <div className="text-right"><span className={`text-xs px-2 py-0.5 rounded-full ${deal.status === 'Active' ? 'bg-teal-600/20 text-teal-400' : deal.status === 'Renewal due' ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'}`}>{deal.status}</span>{deal.days > 0 && <div className="text-xs text-gray-500 mt-1">Expires {deal.expiry} ({deal.days}d)</div>}</div>
            </div>
            <div className="text-xs text-gray-500 space-y-0.5">{deal.obligations.map((o, j) => <div key={j} className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-gray-600"></span>{o}</div>)}</div>
            {deal.bonuses.length > 0 && <div className="mt-2 pt-2 border-t border-gray-800/50"><div className="text-xs text-yellow-500/80 font-medium mb-1">Performance bonuses:</div>{deal.bonuses.map((b, j) => <div key={j} className="text-xs text-gray-500">{b}</div>)}</div>}
          </div>
        ))}
      </div>
      <GolfAISection context="sponsorship" player={player} session={session} />
    </div>
  );
}

function FinancialView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const prizeMoney = [
    { event: 'KLM Open', pos: 'T3', amount_eur: 124000, amount_gbp: 104000, tour: 'DP World Tour' },
    { event: 'Austrian Alpine Open', pos: 'T31', amount_eur: 18000, amount_gbp: 15000, tour: 'DP World Tour' },
    { event: 'Halden Motors Championship', pos: 'T14', amount_eur: 42000, amount_gbp: 35000, tour: 'Meridian Series' },
    { event: 'US Open (MC)', pos: 'MC', amount_eur: 0, amount_gbp: 0, tour: 'Major' },
    { event: 'Genesis Scottish Open', pos: 'T6', amount_eur: 198000, amount_gbp: 166000, tour: 'Meridian Series' },
    { event: 'Soudal Open', pos: 'T8', amount_eur: 56000, amount_gbp: 47000, tour: 'DP World Tour' },
  ];
  const totalGBP = prizeMoney.reduce((a, b) => a + b.amount_gbp, 0);
  const taxJurisdictions = [
    { country: '🇬🇧 UK', amount: '£201,000', events: '6 events', status: 'Filed' },
    { country: '🇩🇪 Germany', amount: '€42,000', events: '1 event (Halden Motors)', status: 'Pending' },
    { country: '🇺🇸 USA', amount: '$0', events: 'MC — no liability', status: 'N/A' },
    { country: '🇳🇱 Netherlands', amount: '€124,000', events: '1 event (KLM)', status: 'Open' },
    { country: '🇦🇹 Austria', amount: '€18,000', events: '1 event (Alpine)', status: 'Open' },
  ];
  const earningsBars = [
    { cat: 'Majors',          amount: 45000 },
    { cat: 'Meridian Series',    amount: 78000 },
    { cat: 'DP World Tour',   amount: 124000 },
    { cat: 'Pro-Ams',         amount: 38000 },
  ];
  function exportFinancialPDF() {
    const w = window.open('', '_blank', 'width=900,height=1200');
    if (!w) return;
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const prizeRows = prizeMoney.map(p => `<tr><td>${p.event}</td><td>${p.pos}</td><td>${p.tour}</td><td class="r">&euro;${p.amount_eur.toLocaleString()}</td><td class="r">&pound;${p.amount_gbp.toLocaleString()}</td></tr>`).join('');
    const expenseRows = expenses.map(e => `<tr><td>${e.cat}</td><td>${e.notes}</td><td class="r">${e.amount}</td></tr>`).join('');
    const taxRows = taxJurisdictions.map(t => `<tr><td>${t.country}</td><td class="r">${t.amount}</td><td>${t.events}</td><td>${t.status}</td></tr>`).join('');
    const maxBar = Math.max(...earningsBars.map(b => b.amount));
    const barHtml = earningsBars.map(b => `
      <div class="bar-row">
        <div class="bar-label">${b.cat}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(b.amount / maxBar) * 100}%"></div></div>
        <div class="bar-val">&pound;${(b.amount / 1000).toFixed(0)}k</div>
      </div>`).join('');
    w.document.write(`<!doctype html><html><head><title>Financial Summary — James Halton</title><style>
@media print { body { margin: 0 } .pb { page-break-before: always } }
body { font-family: -apple-system, system-ui, sans-serif; font-size: 11px; color: #111; background: #fff; padding: 20px; line-height: 1.4 }
h1 { font-size: 18px; margin: 0 0 2px; letter-spacing: 0.02em }
h2 { font-size: 12px; margin: 18px 0 8px; text-transform: uppercase; letter-spacing: 0.06em; color: #333; border-bottom: 1px solid #333; padding-bottom: 3px }
.sub { font-size: 10px; color: #555; margin-bottom: 14px }
.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 4px }
.kpi { border: 1px solid #ccc; background: #f8f8f8; padding: 10px; text-align: center }
.kpi .lbl { font-size: 9px; text-transform: uppercase; color: #666; letter-spacing: 0.05em }
.kpi .val { font-size: 16px; font-weight: 800; color: #000; margin-top: 2px }
table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 4px }
th, td { border: 1px solid #ccc; padding: 5px 7px; text-align: left }
th { background: #eee; text-transform: uppercase; font-size: 9px; letter-spacing: 0.04em }
td.r, th.r { text-align: right }
tr.total td { background: #f0f0f0; font-weight: 700 }
.bar-row { display: grid; grid-template-columns: 130px 1fr 80px; gap: 10px; align-items: center; margin: 5px 0; font-size: 10px }
.bar-label { color: #333 }
.bar-track { height: 14px; background: #eee; border: 1px solid #ccc; position: relative }
.bar-fill { height: 100%; background: #16a34a }
.bar-val { text-align: right; font-weight: 700 }
.footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 9px; color: #666; text-align: center }
</style></head><body>
<h1>FINANCIAL SUMMARY &mdash; JAMES HARRINGTON</h1>
<div class="sub">Prepared by Lumio Tour &middot; ${today} &middot; <strong>CONFIDENTIAL</strong></div>
<div class="kpis">
  <div class="kpi"><div class="lbl">Prize Money YTD</div><div class="val">&pound;${(totalGBP / 1000).toFixed(0)}k</div></div>
  <div class="kpi"><div class="lbl">Endorsements</div><div class="val">&pound;250k</div></div>
  <div class="kpi"><div class="lbl">Est. Annual Costs</div><div class="val">&pound;289k</div></div>
  <div class="kpi"><div class="lbl">Net Position</div><div class="val">&pound;${((totalGBP + 250000 - 289000) / 1000).toFixed(0)}k</div></div>
</div>
<h2>Prize Money Ledger &mdash; 2026</h2>
<table>
<thead><tr><th>Tournament</th><th>Position</th><th>Category</th><th class="r">EUR</th><th class="r">GBP</th></tr></thead>
<tbody>${prizeRows}<tr class="total"><td colspan="4" class="r">Total YTD (GBP)</td><td class="r">&pound;${totalGBP.toLocaleString()}</td></tr></tbody>
</table>
<h2>Earnings by Category</h2>
${barHtml}
<h2>Annual Expense Breakdown</h2>
<table>
<thead><tr><th>Category</th><th>Structure</th><th class="r">Estimate</th></tr></thead>
<tbody>${expenseRows}<tr class="total"><td colspan="2" class="r">Total (annual)</td><td class="r">~&pound;289k</td></tr></tbody>
</table>
<h2>Tax Jurisdiction Tracker</h2>
<table>
<thead><tr><th>Country</th><th class="r">Amount</th><th>Events</th><th>Status</th></tr></thead>
<tbody>${taxRows}</tbody>
</table>
<div class="footer">Generated by Lumio Tour &middot; lumiosports.com/golf &middot; For accountant use only</div>
</body></html>`);
    w.document.close();
    setTimeout(() => { try { w.print(); } catch {} }, 400);
  }
  const expenses = [
    { cat: 'Swing Coach (Pete Larsen)', amount: '~£48k', notes: '12% of prize money + travel' },
    { cat: 'Caddie (Mick O\'Brien)', amount: '~£52k', notes: '10% of prize money + weekly fee + travel' },
    { cat: 'Physio (Tom Walsh)', amount: '~£35k', notes: 'Retainer + event travel' },
    { cat: 'Fitness Trainer', amount: '~£18k', notes: 'Part-time retainer' },
    { cat: 'Mental Coach (Dr. Reed)', amount: '~£12k', notes: 'Monthly sessions + pre-major' },
    { cat: 'Travel & Accommodation', amount: '~£88k', notes: '30+ weeks · 3-person team · Europe + Asia + US' },
    { cat: 'Agent Commission (ISM)', amount: '~£25k', notes: '10% of endorsement income' },
    { cat: 'Accountant (multi-jurisdiction)', amount: '~£7k', notes: '20+ tax jurisdictions' },
    { cat: 'Equipment (non-sponsored)', amount: '~£4k', notes: 'Balls, tees, gloves, misc.' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="💰" title="Financial Dashboard" subtitle="Prize money, endorsements, expenses, and multi-jurisdiction tax tracker — exportable for your accountant." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Prize Money YTD" value={`£${(totalGBP/1000).toFixed(0)}k`} sub="2026 season" color="green" />
        <StatCard label="Endorsements" value="£250k" sub="Annual contracted" color="yellow" />
        <StatCard label="Est. Annual Costs" value="£289k" sub="Full team + travel" color="red" />
        <StatCard label="Net Position" value={`£${((totalGBP + 250000 - 289000)/1000).toFixed(0)}k`} sub="YTD estimate" color="teal" />
      </div>
      {/* Prize chart */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Earnings by Category (YTD)</div>
        <PrizeMoneyChart />
      </div>
      {/* Prize ledger */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Prize Money Ledger — 2026</div>
          <button onClick={exportFinancialPDF} className="text-xs text-green-400 hover:text-green-300">Export for accountant →</button>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
            <th className="text-left p-3">Tournament</th><th className="text-left p-3">Position</th><th className="text-left p-3">Category</th><th className="text-right p-3">EUR</th><th className="text-right p-3">GBP</th>
          </tr></thead>
          <tbody>{prizeMoney.map((p, i) => (
            <tr key={i} className="border-b border-gray-800/50">
              <td className="p-3 text-gray-200">{p.event}</td>
              <td className="p-3 text-gray-400">{p.pos}</td>
              <td className="p-3"><TourBadge tier={p.tour} /></td>
              <td className="p-3 text-right text-gray-300">€{p.amount_eur.toLocaleString()}</td>
              <td className="p-3 text-right text-white font-medium">£{p.amount_gbp.toLocaleString()}</td>
            </tr>
          ))}
          <tr className="bg-gray-900/50"><td colSpan={4} className="p-3 text-right text-sm text-gray-400 font-semibold">Total YTD (GBP)</td><td className="p-3 text-right text-teal-400 font-bold">£{totalGBP.toLocaleString()}</td></tr>
          </tbody>
        </table>
      </div>
      {/* Expenses */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Annual Expense Breakdown</div>
        <div className="space-y-2">
          {expenses.map((e, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50">
              <div><div className="text-sm text-gray-200">{e.cat}</div><div className="text-xs text-gray-500">{e.notes}</div></div>
              <div className="text-sm font-medium text-white">{e.amount}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Tax jurisdictions */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">🌍 Tax Jurisdiction Tracker (2026 Events)</div>
        <div className="space-y-2">
          {[
            { country: '🇬🇧 UK', income: '£201,000', events: '6 events', status: 'Filed', rate: '45% (additional)' },
            { country: '🇩🇪 Germany', income: '€42,000', events: '1 event (Halden Motors)', status: 'Pending', rate: '25%' },
            { country: '🇺🇸 USA', income: '$0', events: 'MC — no liability', status: 'N/A', rate: '—' },
            { country: '🇳🇱 Netherlands', income: '€124,000', events: '1 event (KLM)', status: 'Open', rate: '25%' },
            { country: '🇦🇹 Austria', income: '€18,000', events: '1 event (Alpine)', status: 'Open', rate: '25%' },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800/50 text-sm">
              <div className="flex-1 text-gray-300">{t.country}</div>
              <div className="text-gray-400">{t.income}</div>
              <div className="text-gray-500 text-xs">{t.events}</div>
              <span className={`text-xs px-2 py-0.5 rounded ${t.status === 'Filed' ? 'bg-teal-600/20 text-teal-400' : t.status === 'N/A' ? 'bg-gray-700 text-gray-500' : 'bg-yellow-600/20 text-yellow-400'}`}>{t.status}</span>
            </div>
          ))}
        </div>
      </div>
      <GolfAISection context="financial" player={player} session={session} />
    </div>
  );
}

function CareerView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const [horizon, setHorizon] = useState<'1'|'3'|'5'|'10'>('1');
  const STATS = [
    { value: `#${DEMO_PLAYER.owgr}`,              label: 'OWGR',           sub: 'Apr 2026' },
    { value: `#${DEMO_PLAYER.race_to_dubai_pos}`,  label: 'Race to Dubai', sub: `${DEMO_PLAYER.race_to_dubai_points} pts` },
    { value: DEMO_PLAYER.turned_pro.toString(),    label: 'Turned Pro',    sub: `${2026 - DEMO_PLAYER.turned_pro} years on tour` },
    { value: '2 top 5s',                            label: 'Season',         sub: 'YTD 2026' },
  ];
  const GOALS: Record<string, { goal: string; target: string; status: string; progress: number; color: string }[]> = {
    '1':  [
      { goal: 'Win first DP World Tour event',            target: 'Nov 2026',                                   status: 'Mandate',           progress: 30, color: '#15803D' },
      { goal: 'OWGR top 50 breakthrough',                  target: `#${DEMO_PLAYER.owgr} → #49 target`,          status: 'On track',          progress: 44, color: '#0ea5e9' },
      { goal: 'Secure PGA Tour card via DP World points',  target: 'Dec 2026',                                   status: '#43 Race to Dubai',  progress: 52, color: '#a855f7' },
      { goal: 'Land £250k+ sponsorship deal',               target: 'Q4 2026',                                    status: 'In discussions',     progress: 35, color: '#f59e0b' },
      { goal: 'Make Open Championship cut',                 target: 'Jul 2026',                                   status: 'Entry confirmed',    progress: 60, color: '#22c55e' },
    ],
    '3':  [
      { goal: 'OWGR top 30',                                target: 'Dec 2028',                                   status: 'On track',          progress: 32, color: '#15803D' },
      { goal: '2 DP World Tour wins',                        target: 'Dec 2028',                                   status: '0 of 2',             progress: 0,  color: '#0ea5e9' },
      { goal: "Ryder Cup captain's pick consideration",      target: 'Sep 2027',                                   status: 'Building points',   progress: 22, color: '#a855f7' },
      { goal: 'Secure multi-year title sponsor',             target: 'Dec 2027',                                   status: 'Prospecting',        progress: 25, color: '#f59e0b' },
      { goal: 'Major championship top 10',                   target: 'Dec 2028',                                   status: 'Target — The Open',  progress: 18, color: '#facc15' },
    ],
    '5':  [
      { goal: 'OWGR top 15',                                target: 'Dec 2030',                                   status: 'Career target',      progress: 12, color: '#15803D' },
      { goal: 'First major championship top 3',              target: 'Dec 2030',                                   status: 'Life goal',          progress: 8,  color: '#facc15' },
      { goal: 'Ryder Cup selection',                         target: 'Sep 2029',                                   status: 'Building',           progress: 15, color: '#a855f7' },
      { goal: 'Build academy / charity foundation',           target: 'Dec 2030',                                   status: 'Planning',           progress: 10, color: '#0ea5e9' },
      { goal: '£5M career earnings mark',                    target: 'Dec 2030',                                   status: '£1.2M to date',      progress: 24, color: '#22c55e' },
    ],
    '10': [
      { goal: 'Legacy: major championship winner',           target: 'Dec 2036',                                   status: 'Life goal',          progress: 5,  color: '#facc15' },
      { goal: 'Ryder Cup multiple appearances',              target: 'Dec 2035',                                   status: 'Long-term',          progress: 6,  color: '#a855f7' },
      { goal: 'Academy established',                         target: 'Dec 2033',                                   status: 'Planning',           progress: 8,  color: '#0ea5e9' },
      { goal: '£15M career earnings',                        target: 'Dec 2036',                                   status: '£1.2M to date',      progress: 8,  color: '#22c55e' },
      { goal: 'Transition to senior / commentary / coaching', target: 'Dec 2036',                                   status: 'Future plan',        progress: 4,  color: '#6B7280' },
    ],
  };
  const SEASON = [
    { goal: 'Win first DP World Tour event',          detail: 'Confirmed target: Halden Motors International',  progress: 30, color: '#15803D' },
    { goal: 'OWGR top 50 by December',                 detail: `#${DEMO_PLAYER.owgr} now — need 37 spots`,       progress: 44, color: '#0ea5e9' },
    { goal: 'Make 20+ cuts across season',             detail: '14 cuts made YTD',                                progress: 70, color: '#22c55e' },
    { goal: 'Race to Dubai top 20 finish',             detail: `#${DEMO_PLAYER.race_to_dubai_pos} now`,          progress: 54, color: '#a855f7' },
    { goal: 'Grow Instagram audience 50%',             detail: '84k followers → 126k target',                     progress: 22, color: '#f59e0b' },
  ];
  const TIMELINE = [
    { year: '2020', event: 'Turned pro at Wentworth Open' },
    { year: '2021', event: 'Won European Challenge Tour Order of Merit' },
    { year: '2022', event: 'DP World Tour debut season' },
    { year: '2023', event: 'First top-10 finish (Dunhill Links)' },
    { year: '2024', event: 'T22 The Open' },
    { year: '2025', event: 'Consistent top-30 form, £540k season earnings' },
    { year: '2026', event: 'Currently at Halden Motors International Open' },
  ];
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white mb-1">🚀 Career Planning</h1><p className="text-xs text-gray-500">1-year, 3-year, 5-year and 10-year goals with progress tracking.</p></div>
      <div className="grid grid-cols-4 gap-3">
        {STATS.map((s, i) => (
          <div key={i} className="rounded-xl p-4 text-center" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
            <div className="text-xl font-black" style={{ color: '#15803D' }}>{s.value}</div>
            <div className="text-[11px] text-white font-semibold mt-1">{s.label}</div>
            <div className="text-[10px] text-gray-500">{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
        <div className="flex border-b border-gray-800">
          {(['1','3','5','10'] as const).map(h => (
            <button key={h} onClick={() => setHorizon(h)} className="flex-1 py-3 text-sm font-semibold transition-all" style={{ borderBottom: horizon === h ? '2px solid #15803D' : '2px solid transparent', color: horizon === h ? '#fff' : '#6B7280', background: horizon === h ? 'rgba(21,128,61,0.06)' : 'transparent' }}>{h} Year</button>
          ))}
        </div>
        <div className="p-5 space-y-4">
          {GOALS[horizon].map((g, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white font-semibold">{g.goal}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${g.color}20`, color: g.color }}>{g.status}</span>
                  <span className="text-[10px] text-gray-500">{g.target}</span>
                </div>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2"><div className="h-2 rounded-full transition-all" style={{ width: `${g.progress}%`, backgroundColor: g.color }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl p-5" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
        <div className="text-sm font-bold text-white mb-4">2026 Season Goals</div>
        <div className="space-y-3">
          {SEASON.map((s, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1"><span className="text-xs text-white">{s.goal}</span><span className="text-[10px] text-gray-500">{s.detail}</span></div>
              <div className="w-full bg-gray-800 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width: `${s.progress}%`, backgroundColor: s.color }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl p-5" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
        <div className="text-sm font-bold text-white mb-4">Career Timeline</div>
        <div className="relative pl-6">
          <div className="absolute left-2 top-0 bottom-0 w-px" style={{ backgroundColor: '#15803D40' }} />
          {TIMELINE.map((t, i) => (
            <div key={i} className="relative mb-4 last:mb-0">
              <div className="absolute -left-4 top-1 w-2 h-2 rounded-full" style={{ backgroundColor: '#15803D' }} />
              <div className="flex items-baseline gap-3"><span className="text-xs font-bold" style={{ color: '#15803D' }}>{t.year}</span><span className="text-sm text-gray-300">{t.event}</span></div>
            </div>
          ))}
        </div>
      </div>
      <GolfAISection context="owgr" player={player} session={session} />
    </div>
  );
}

function ExemptionsView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const statusCats = [
    { category: 'DP World Tour Card Status', value: '2026 Card holder (Race to Dubai #43)', status: 'Secure', note: 'Top 115 retained cards for 2027. Currently safe.' },
    { category: 'OWGR World Top 50', value: '#87 — not currently top 50', status: 'Watch', note: 'Top 50 earn Masters, Players, and all 4 Majors invitations. #61 career high needed to reactivate.' },
    { category: 'The Open Championship', value: 'Top 100 OWGR — exempt', status: 'Qualified', note: 'Royal Birkdale 2026 — entry confirmed.' },
    { category: 'US Open 2026', value: 'Did not qualify (MC in sectional)', status: 'Not entered', note: 'Shinnecock Hills — missed via OWGR and sectional qualifying.' },
    { category: 'The Ashbourne Invitational 2027', value: 'Requires OWGR Top 50 by end of 2026', status: 'Borderline', note: 'Push into Top 50 this year critical for Ashbourne invitation.' },
    { category: 'PGA Championship 2027', value: 'Top 100 OWGR at time of event', status: 'Likely', note: 'Maintaining current trajectory keeps this secure.' },
    { category: 'WGC / Invitational Events', value: 'Top 50 OWGR required', status: 'Watch', note: 'Various invitationals require top-50 status — upgrade target.' },
    { category: 'Ryder Cup 2028', value: 'European points accumulation underway', status: 'Building', note: 'Currently accumulating European Ryder Cup points. Need top 15 auto-qualifying or captain\'s pick.' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="🏛️" title="Exemptions & Tour Status" subtitle="DP World Tour card, Major qualification, and invitation tracker." />
      <div className="space-y-3">
        {statusCats.map((s, i) => (
          <div key={i} className={`bg-[#0d0f1a] border rounded-xl p-4 ${s.status === 'Qualified' ? 'border-teal-600/30' : s.status === 'Watch' || s.status === 'Borderline' ? 'border-yellow-600/30' : s.status === 'Not entered' ? 'border-red-600/30' : 'border-gray-800'}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-semibold text-white">{s.category}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'Qualified' || s.status === 'Secure' ? 'bg-teal-600/20 text-teal-400' : s.status === 'Watch' || s.status === 'Borderline' ? 'bg-yellow-600/20 text-yellow-400' : s.status === 'Building' ? 'bg-blue-600/20 text-blue-400' : s.status === 'Likely' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>{s.status}</span>
            </div>
            <div className="text-xs text-gray-400 mb-1">{s.value}</div>
            <div className="text-xs text-gray-500">{s.note}</div>
          </div>
        ))}
      </div>
      <GolfAISection context="owgr" player={player} session={session} />
    </div>
  );
}

function ProAmView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const appearances = [
    { event: 'Halden Motors International Open Pro-Am', date: 'Wed 2 Jul', type: 'Title Sponsor', fee: 'Included (Halden Motors deal)', partners: 'Halden Motors AG executives — briefed', status: 'Tomorrow' },
    { event: 'Vanta Sports Golf Day (Wentworth)', date: '15 Sep', type: 'Equipment partner', fee: '£5,000', partners: 'TBC — agent to confirm', status: 'Confirmed' },
    { event: 'Charity Pro-Am (LTA)', date: '12 Aug', type: 'Charity — LTA', fee: 'No fee (LTA obligation)', partners: 'Mixed celebrity and LTA sponsors', status: 'Confirmed' },
    { event: 'Corporate Day — Barclays', date: '8 Oct', type: 'Corporate appearance', fee: '£22,000', partners: 'Barclays senior management', status: 'Pending contract' },
    { event: 'Abu Dhabi Northbridge Pro-Am', date: '4 Nov', type: 'Tournament (Meridian)', fee: 'Included', partners: 'TBC — Abu Dhabi hospitality', status: 'Not yet confirmed' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="⭐" title="Pro-Am & Appearances" subtitle="Pro-am commitments, corporate appearances, charity days, and appearance fee tracker." />
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Appearance Fee Income" value="£38k" sub="YTD 2026" color="green" />
        <StatCard label="Events Committed" value="5" sub="2026 remaining" color="teal" />
        <StatCard label="Next Commitment" value="Tomorrow" sub="Halden Motors International Pro-Am" color="orange" />
      </div>
      <div className="space-y-3">
        {appearances.map((a, i) => (
          <div key={i} className={`bg-[#0d0f1a] border rounded-xl p-4 ${a.status === 'Tomorrow' ? 'border-green-600/40' : a.status === 'Pending contract' ? 'border-yellow-600/30' : 'border-gray-800'}`}>
            <div className="flex items-start justify-between mb-2">
              <div><div className="text-white font-semibold">{a.event}</div><div className="text-xs text-gray-500 mt-0.5">{a.date} · {a.type}</div></div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'Confirmed' || a.status === 'Tomorrow' ? 'bg-teal-600/20 text-teal-400' : a.status === 'Pending contract' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>{a.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
              <div><span className="text-gray-600">Appearance fee: </span>{a.fee}</div>
              <div><span className="text-gray-600">Partners: </span>{a.partners}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PracticeLogView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const sessions = [
    { date: 'Today 08:30', type: 'Putting', duration: '120 min', coach: 'Pete Larsen', focus: '8–15ft putts · Left-to-right reads · 120 balls from each position', notes: 'SG Putting has been -1.18 over 6 rounds — priority session before R1', outcome: '' },
    { date: 'Yesterday', type: 'Short Game', duration: '60 min', coach: 'Dave Pelz Jr.', focus: 'Bunker play · Flop shots · 50yd pitch shots', notes: 'Around Green has been +0.15 — maintaining. 3 failed bunker saves last week flagged.', outcome: 'Good session — bunker technique improved' },
    { date: 'Jul 1', type: 'Full Range', duration: '90 min', coach: 'Pete Larsen', focus: 'Driver shape control · 3-wood off tee · 5-iron pre-event check', notes: 'Slightly early-extending on driver — monitor under pressure', outcome: 'Swing feels clean. Carry distances checked.' },
    { date: 'Jun 29', type: 'Course Walk', duration: '180 min', coach: 'Mick O\'Brien', focus: 'Golfclub München Eichenried recon · Yardages · Wind lines', notes: 'Holes 7, 15 identified as birdie targets. Hole 9 play safe.', outcome: 'Strategy notes uploaded to Caddie Workflow' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="📋" title="Practice Log" subtitle="Session notes, drill targets, coach assignments, and practice programme tracker." />
      <div className="space-y-4">
        {sessions.map((s, i) => (
          <div key={i} className={`bg-[#0d0f1a] border rounded-xl p-5 ${i === 0 ? 'border-green-600/30' : 'border-gray-800'}`}>
            <div className="flex items-start justify-between mb-3">
              <div><div className="text-white font-semibold">{s.type} Session</div><div className="text-xs text-gray-500">{s.date} · {s.duration} · {s.coach}</div></div>
              {i === 0 && <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">● In Progress</span>}
            </div>
            <div className="bg-black/20 rounded-lg p-3 mb-2">
              <div className="text-xs text-teal-400 font-medium mb-1">Focus</div>
              <div className="text-sm text-gray-300">{s.focus}</div>
            </div>
            <div className="text-xs text-gray-500">{s.notes}</div>
            {s.outcome && <div className="mt-2 text-xs text-green-400">✓ {s.outcome}</div>}
          </div>
        ))}
      </div>
      <GolfAISection context="practicelog" player={player} session={session} />
    </div>
  );
}

// ─── FIND A PRO VIEW ──────────────────────────────────────────────────────────
function GolfFindProView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const [tab, setTab] = useState<'caddy'|'course'|'range'>('caddy')
  const [location, setLocation] = useState('')
  const [tourLevel, setTourLevel] = useState('')
  const [budget, setBudget] = useState('')
  const [courseType, setCourseType] = useState('')
  const [shortlist, setShortlist] = useState<string[]>(() => {
    try { const s = typeof window !== 'undefined' ? localStorage.getItem('lumio_golf_findpro_shortlist') : null; return s ? JSON.parse(s) : [] } catch { return [] }
  })
  const toggleShortlist = (id: string) => setShortlist(prev => {
    const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    try { localStorage.setItem('lumio_golf_findpro_shortlist', JSON.stringify(next)) } catch {}
    return next
  })
  const TABS = [{ id: 'caddy' as const, label: 'Find a Caddy', emoji: '🎒' },{ id: 'course' as const, label: 'Find a Course', emoji: '⛳' },{ id: 'range' as const, label: 'Driving Range', emoji: '🏌️' }]

  const q = (location + ' ' + tourLevel + ' ' + budget + ' ' + courseType).toLowerCase().trim()
  const match = (item: object) => !q || JSON.stringify(item).toLowerCase().includes(q)
  const filteredCaddies = CADDIES_ROSTER.filter(match)
  const filteredCourses = COURSES_ROSTER.filter(match)
  const filteredRanges  = DRIVING_RANGES_ROSTER.filter(match)

  const mailto = (to: string, subj: string, body: string) =>
    `mailto:${to}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`
  const signoff = session.userName || player.name || 'James'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-1"><span className="text-2xl">🔍</span><div><div className="text-lg font-bold text-white">Find a Pro</div><div className="text-xs" style={{ color: '#6B7280' }}>Caddies, courses, and driving ranges — instant static demo roster</div></div></div>
      <div className="flex gap-2 p-1 rounded-xl" style={{ background: '#0d1117' }}>
        {TABS.map(t => (<button key={t.id} onClick={() => setTab(t.id)} className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all" style={{ background: tab === t.id ? '#16a34a' : 'transparent', color: tab === t.id ? '#fff' : '#6B7280' }}>{t.emoji} {t.label}</button>))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-semibold text-gray-400 mb-1 block">Location</label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Scotland, Florida" className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#0d1117', border: '1px solid #1F2937' }} /></div>
        <div><label className="text-xs font-semibold text-gray-400 mb-1 block">Tour Level</label><input value={tourLevel} onChange={e => setTourLevel(e.target.value)} placeholder="e.g. DP World Tour" className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#0d1117', border: '1px solid #1F2937' }} /></div>
        {tab === 'course' && <div><label className="text-xs font-semibold text-gray-400 mb-1 block">Course Type</label><input value={courseType} onChange={e => setCourseType(e.target.value)} placeholder="e.g. Links, Parkland" className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#0d1117', border: '1px solid #1F2937' }} /></div>}
        <div><label className="text-xs font-semibold text-gray-400 mb-1 block">Budget</label><input value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. £200/round" className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#0d1117', border: '1px solid #1F2937' }} /></div>
      </div>
      <div className="rounded-lg px-3 py-2 text-[11px]" style={{ background: '#0d1117', border: '1px solid #1F2937', color: '#6B7280' }}>
        Demo data — wired to live search in full build. {shortlist.length > 0 && <span className="text-teal-400 ml-2">{shortlist.length} saved to shortlist</span>}
      </div>

      {tab === 'caddy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCaddies.map(c => {
            const saved = shortlist.includes(c.id)
            const initials = c.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
            return (
              <div key={c.id} className="rounded-xl p-4" style={{ background: '#0d1117', border: '1px solid #1F2937' }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff' }}>{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{c.name}</div>
                    <div className="text-[11px] text-gray-500">{c.homeBase} · {c.yearsExperience}y exp</div>
                  </div>
                </div>
                <div className="space-y-1 text-[11px] text-gray-400 mb-3">
                  <div><span className="text-gray-500">Speciality:</span> {c.speciality}</div>
                  <div><span className="text-gray-500">Tour level:</span> {c.tourLevel}</div>
                  <div><span className="text-gray-500">Day rate:</span> {c.dayRate}</div>
                  {c.notablePlayer && <div className="text-teal-400/80">★ {c.notablePlayer}</div>}
                  <div><span className="text-gray-500">Availability:</span> {c.availability}</div>
                </div>
                <div className="flex gap-2">
                  <a href={mailto(c.contactEmail, `Caddying enquiry — ${c.name}`, `Hi ${c.name.split(' ')[0]},\n\nI'm ${signoff}, currently on the ${player.tour || 'DP World Tour'}. Looking for a caddy — your profile matches what I'm after.\n\nCould we talk this week?\n\nBest,\n${signoff}`)} className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#16a34a', color: '#fff' }}>Contact</a>
                  <button onClick={() => toggleShortlist(c.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: saved ? '#14b8a6' : '#1F2937', color: saved ? '#0a0c14' : '#9CA3AF' }}>{saved ? '★ Saved' : '☆ Save'}</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'course' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCourses.map(c => {
            const saved = shortlist.includes(c.id)
            return (
              <div key={c.id} className="rounded-xl p-4" style={{ background: '#0d1117', border: '1px solid #1F2937' }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white">{c.name}</div>
                    <div className="text-[11px] text-gray-500">{c.location}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(22,163,74,0.15)', color: '#22c55e' }}>{c.design}</span>
                </div>
                <p className="text-[11px] text-gray-400 mb-2">{c.description}</p>
                <div className="space-y-1 text-[11px] text-gray-400 mb-3">
                  <div><span className="text-gray-500">Green fee:</span> {c.greenFee}</div>
                  <div><span className="text-gray-500">Access:</span> {c.access}</div>
                  <div><span className="text-gray-500">Rating / Slope:</span> {c.courseRating} / {c.slopeRating}</div>
                  <div className="text-gray-500">Amenities: <span className="text-gray-300">{c.amenities.join(' · ')}</span></div>
                </div>
                <div className="flex gap-2">
                  <a href={mailto('bookings@' + c.name.toLowerCase().replace(/[^a-z]+/g,'') + '.co.uk', `Tee-time enquiry — ${c.name}`, `Hi,\n\nI'm ${signoff} (${player.tour || 'DP World Tour'} pro). Looking to book a practice round at ${c.name} in the coming weeks.\n\nCan you confirm tour-pro rates + available tee times?\n\nThanks,\n${signoff}`)} className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#16a34a', color: '#fff' }}>Contact</a>
                  <button onClick={() => toggleShortlist(c.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: saved ? '#14b8a6' : '#1F2937', color: saved ? '#0a0c14' : '#9CA3AF' }}>{saved ? '★ Saved' : '☆ Save'}</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'range' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredRanges.map(r => {
            const saved = shortlist.includes(r.id)
            return (
              <div key={r.id} className="rounded-xl p-4" style={{ background: '#0d1117', border: '1px solid #1F2937' }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white">{r.name}</div>
                    <div className="text-[11px] text-gray-500">{r.location}</div>
                  </div>
                  {r.coachOnSite && <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(14,165,233,0.15)', color: '#0ea5e9' }}>Coach on-site</span>}
                </div>
                <p className="text-[11px] text-gray-400 mb-2">{r.description}</p>
                <div className="space-y-1 text-[11px] text-gray-400 mb-3">
                  <div><span className="text-gray-500">Trackman bays:</span> {r.trackmanBays}</div>
                  <div><span className="text-gray-500">Hourly rate:</span> {r.hourlyRate}</div>
                  <div><span className="text-gray-500">Access:</span> {r.access}</div>
                  <div className="text-gray-500">Facilities: <span className="text-gray-300">{r.facilities.join(' · ')}</span></div>
                </div>
                <div className="flex gap-2">
                  <a href={mailto('info@' + r.name.toLowerCase().replace(/[^a-z]+/g,'') + '.com', `Range booking — ${r.name}`, `Hi,\n\nI'm ${signoff} (${player.tour || 'DP World Tour'} pro). Looking for practice bay availability at ${r.name} this week.\n\nThanks,\n${signoff}`)} className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#16a34a', color: '#fff' }}>Contact</a>
                  <button onClick={() => toggleShortlist(r.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: saved ? '#14b8a6' : '#1F2937', color: saved ? '#0a0c14' : '#9CA3AF' }}>{saved ? '★ Saved' : '☆ Save'}</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <GolfAISection context="default" player={player} session={session} />
    </div>
  )
}

// ─── TRAVEL & LOGISTICS ──────────────────────────────────────────────────────
// Inline types for the Travel Researcher (mirrors the tennis pattern).
interface GolfFlightResult { airline: string; flightNo: string; departure: string; arrival: string; duration: string; stops: string; price: number; class: string; bookingUrl?: string; score: number }
interface GolfHotelResult  { name: string; stars: number; area: string; distanceToVenue: string; pricePerNight: number; totalPrice: number; rating: number; amenities: string[]; bookingUrl?: string; score: number }

function GolfTravelView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const [travelTabMode, setTravelTabMode] = useState<'overview' | 'researcher'>('overview')
  const [tStep,setTStep]=useState<1|2|3|4>(1)
  const [searching,setSearching]=useState(false)
  const [searchPhase,setSearchPhase]=useState('')
  const [flightResults,setFlightResults]=useState<GolfFlightResult[]>([])
  const [hotelResults,setHotelResults]=useState<GolfHotelResult[]>([])
  const [selectedFlight,setSelectedFlight]=useState<GolfFlightResult|null>(null)
  const [selectedHotel,setSelectedHotel]=useState<GolfHotelResult|null>(null)
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
  const [trCourse,setTrCourse]=useState(true)
  const [trEarly,setTrEarly]=useState(false)
  const [travelMode,setTravelMode]=useState<'full'|'flights'|'rooms'>('full')
  const [trBudgetTier,setTrBudgetTier]=useState<'budget'|'mid'|'luxe'>('mid')
  const [trKitchen,setTrKitchen]=useState(false)
  const [trShared,setTrShared]=useState(false)
  const [trSpa,setTrSpa]=useState(false)

  const UPCOMING=[
    {name:'Halden Motors International Open', dest:'Munich (MUC)',  dates:'This week · BMW Golf Club Munich-Eichenried'},
    {name:'Genesis Scottish Open',            dest:'Edinburgh (EDI)',dates:'10–13 Jul · Renaissance Club'},
    {name:'The Open Championship',            dest:'Belfast (BFS)',  dates:'17–20 Jul · Royal Portrush'},
    {name:'British Masters',                  dest:'Manchester (MAN)',dates:'24–27 Jul · The Belfry'},
    {name:'Omega European Masters',           dest:'Geneva (GVA)',   dates:'28–31 Aug · Crans-sur-Sierre'},
    {name:'FedEx St. Jude Championship',      dest:'Memphis (MEM)',  dates:'7–10 Aug · TPC Southwind'},
  ]

  const FLIGHT_FALLBACK:GolfFlightResult[]=[
    {airline:'British Airways',flightNo:'BA0958',departure:'09:25 LHR',arrival:'12:15 MUC',duration:'1h 50m',stops:'Direct',price:189,class:trCabin,bookingUrl:'https://www.britishairways.com',score:93},
    {airline:'Lufthansa',      flightNo:'LH2475',departure:'07:00 LHR',arrival:'09:55 MUC',duration:'1h 55m',stops:'Direct',price:175,class:trCabin,bookingUrl:'https://www.lufthansa.com',score:90},
    {airline:'easyJet',        flightNo:'EZY2113',departure:'14:50 LGW',arrival:'17:55 MUC',duration:'2h 05m',stops:'Direct',price:89,class:trCabin,bookingUrl:'https://www.easyjet.com',score:82},
    {airline:'Eurowings',      flightNo:'EW7445',departure:'12:30 LHR',arrival:'15:25 MUC',duration:'1h 55m',stops:'Direct',price:124,class:trCabin,bookingUrl:'https://www.eurowings.com',score:76},
    {airline:'Ryanair',        flightNo:'FR8512',departure:'06:15 STN',arrival:'09:15 MUC',duration:'2h 00m',stops:'Direct',price:62,class:trCabin,bookingUrl:'https://www.ryanair.com',score:64},
  ]
  const HOTEL_FALLBACKS:Record<'budget'|'mid'|'luxe',GolfHotelResult[]>={
    budget:[
      {name:'Motel One Munich Hauptbahnhof',  stars:3,area:'City Centre',           distanceToVenue:'35 min taxi',pricePerNight:68, totalPrice:476, rating:8.4,amenities:['WiFi','Bar','Breakfast'],            bookingUrl:'https://www.motel-one.com',  score:84},
      {name:'Airbnb private room — Schwabing',stars:0,area:'Schwabing',             distanceToVenue:'25 min taxi',pricePerNight:55, totalPrice:385, rating:4.7,amenities:['Kitchen','WiFi','Self check-in'], bookingUrl:'https://www.airbnb.com',     score:81},
      {name:'B&B Hotel Munich-Putzbrunn',     stars:2,area:'Putzbrunn',             distanceToVenue:'18 min taxi',pricePerNight:58, totalPrice:406, rating:8.0,amenities:['WiFi','Breakfast','Parking'],     bookingUrl:'https://www.booking.com',    score:78},
      {name:'Premier Inn München City',       stars:3,area:'City Centre',           distanceToVenue:'32 min taxi',pricePerNight:78, totalPrice:546, rating:8.3,amenities:['WiFi','Restaurant','Gym'],       bookingUrl:'https://www.premierinn.com', score:75},
    ],
    mid:[
      {name:'Sheraton Munich Westpark',       stars:4,area:'Westpark',              distanceToVenue:'22 min taxi',pricePerNight:165,totalPrice:1155,rating:8.6,amenities:['Gym','Pool','Course shuttle','WiFi'],bookingUrl:'https://www.marriott.com',   score:92},
      {name:'Hilton Munich Park',             stars:5,area:'Englischer Garten',     distanceToVenue:'28 min taxi',pricePerNight:215,totalPrice:1505,rating:8.9,amenities:['Gym','Pool','Spa','Restaurant'], bookingUrl:'https://www.hilton.com',     score:89},
      {name:'Marriott Munich',                stars:4,area:'Schwabing',             distanceToVenue:'24 min taxi',pricePerNight:178,totalPrice:1246,rating:8.7,amenities:['Gym','Driving range nearby','Bar'],bookingUrl:'https://www.marriott.com',   score:87},
      {name:'NH Collection München Bavaria',  stars:4,area:'Hauptbahnhof',          distanceToVenue:'35 min taxi',pricePerNight:135,totalPrice:945, rating:8.4,amenities:['Gym','Restaurant','WiFi'],         bookingUrl:'https://www.booking.com',    score:78},
    ],
    luxe:[
      {name:'Mandarin Oriental Munich',       stars:5,area:'Altstadt',              distanceToVenue:'34 min taxi',pricePerNight:625,totalPrice:4375,rating:9.5,amenities:['Spa','Pool','Concierge','Suite'], bookingUrl:'https://www.mandarinoriental.com',score:95},
      {name:'Bayerischer Hof',                stars:5,area:'Altstadt',              distanceToVenue:'32 min taxi',pricePerNight:540,totalPrice:3780,rating:9.4,amenities:['Spa','Pool','Concierge','Restaurant'],bookingUrl:'https://www.bayerischerhof.de',score:93},
      {name:'Charles Hotel — Rocco Forte',    stars:5,area:'Maxvorstadt',           distanceToVenue:'30 min taxi',pricePerNight:485,totalPrice:3395,rating:9.3,amenities:['Spa','Pool','Suite'],              bookingUrl:'https://www.roccofortehotels.com',score:91},
      {name:'The Westin Grand Munich',        stars:5,area:'Arabellapark',          distanceToVenue:'18 min taxi',pricePerNight:325,totalPrice:2275,rating:9.0,amenities:['Pool','Spa','Restaurant'],         bookingUrl:'https://www.marriott.com',    score:88},
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
            const fr=await fetch('/api/ai/golf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`Find 5 flights ${trOrigin} to ${trDest}, depart ${trDepart}, return ${trReturn}, ${trCabin}${trMaxFlight?' max £'+trMaxFlight:''}. JSON array only matching: [{"airline":"","flightNo":"","departure":"","arrival":"","duration":"","stops":"","price":0,"class":"${trCabin}","bookingUrl":"https://www.skyscanner.net","score":0}]. Realistic for a DP World Tour event. Sort by score desc.`}]})})
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
            const hr=await fetch('/api/ai/golf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`Find 4 hotels near ${trTourney||trDest}, ${trNights} nights from ${trDepart}. ${trHotelBudget?'Max £'+trHotelBudget+'/night.':'Best value, course-adjacent.'} Need: ${[trGym&&'Gym',trCourse&&'Course-adjacent',trEarly&&'Early check-in'].filter(Boolean).join(', ')||'Standard'}. JSON array: [{"name":"","stars":4,"area":"","distanceToVenue":"","pricePerNight":0,"totalPrice":0,"rating":8.5,"amenities":[],"bookingUrl":"https://www.booking.com","score":0}]. Sort by score.`}]})})
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

  const genEmail=()=>{if(!selectedFlight&&!selectedHotel)return;setBookingEmail([`Subject: Travel — ${trTourney||trDest} — ${session.userName||player.name}`,'',`Hi Sarah,`,'',`Please book the following for ${session.userName||player.name} (OWGR #${player.owgr ?? 87}):`,selectedFlight?`\n✈️ ${selectedFlight.airline} (${selectedFlight.flightNo})\n${trOrigin} → ${trDest}\nDepart: ${trDepart}\nClass: ${selectedFlight.class}\nPrice: £${selectedFlight.price*trPax}\nBook: ${selectedFlight.bookingUrl}`:'',selectedHotel?`\n🏨 ${selectedHotel.name} (${selectedHotel.stars>0?selectedHotel.stars+'★':'Airbnb'})\nCheck-in: ${trDepart}\nNights: ${trNights}\nPrice: £${selectedHotel.totalPrice}\nBook: ${selectedHotel.bookingUrl}${trEarly?'\nEarly check-in requested.':''}`:'',`\nTotal: £${((selectedFlight?.price??0)*trPax+(selectedHotel?.totalPrice??0)).toLocaleString()}`,'','Thanks',session.userName||player.name].filter(Boolean).join('\n'));setTStep(4)}

  const ScBadge=({s}:{s:number})=><div className={`text-[10px] px-2 py-1 rounded-full font-bold ${s>=90?'bg-green-600/20 text-green-400':s>=75?'bg-emerald-600/20 text-emerald-400':s>=60?'bg-amber-600/20 text-amber-400':'bg-gray-800 text-gray-500'}`}>{s} Lumio</div>

  const bookingComUrl = `https://www.booking.com/search.html?ss=${encodeURIComponent(trDest)}${trDepart?`&checkin=${trDepart}`:''}${trReturn?`&checkout=${trReturn}`:''}`
  const airbnbUrl     = `https://www.airbnb.com/s/${encodeURIComponent(trDest)}/homes${trDepart?`?checkin=${trDepart}`:''}${trReturn?`${trDepart?'&':'?'}checkout=${trReturn}`:''}`

  const ROOM_DEST_CHIPS = ['Munich','Edinburgh','Belfast','Geneva','Memphis','Dubai','Abu Dhabi','New York']

  const cta = travelMode === 'flights' ? '🔍 Search flights →' : travelMode === 'rooms' ? '🔍 Search rooms →' : '🔍 Search flights & hotels →'
  const searchDisabled = !trDest || !trDepart

  // ─── OVERVIEW (landing) ───────────────────────────────────────────────────
  if (travelTabMode === 'overview') {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-black text-white">Travel &amp; Logistics</h2>
            <p className="text-sm text-gray-400 mt-1">Tour-week travel, hotels, and DP World Tour itinerary planning.</p>
          </div>
          <button
            onClick={() => setTravelTabMode('researcher')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:opacity-90"
            style={{ background: '#15803D', boxShadow: '0 4px 14px rgba(21,128,61,0.35)' }}
          >
            <span>✈️</span><span>Plan new trip</span>
          </button>
        </div>

        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/20 border border-green-600/30 rounded-xl p-5">
          <div className="text-xs text-green-400 font-semibold uppercase tracking-wider mb-2">TODAY&apos;S TRAVEL</div>
          <div className="text-white font-bold text-lg">In Munich for Halden Motors International Open</div>
          <div className="text-sm text-gray-400 mt-1">Inbound: <span className="text-green-300 font-semibold">BA0731 LHR → MUC (Sun, completed)</span> · Hotel: Sheraton Munich Westpark · 7 nights.</div>
          <div className="text-sm text-gray-400 mt-1">Course transport: Tournament courtesy car from hotel — pickup 06:15 for Thu R1 (08:42 tee).</div>
          <div className="text-sm text-gray-400 mt-1">Return: BA0729 MUC → LHR Sun 18:50 (post-final, contingent on cut/finish).</div>
        </div>

        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-3">This Month&rsquo;s Travel</div>
          <div className="space-y-2">
            {[
              { date: 'Apr 13', route: 'London → Munich (LHR → MUC)',     reason: 'Halden Motors International Open' },
              { date: 'Apr 20', route: 'Munich → London',                  reason: 'Post-event reset' },
              { date: 'May 1',  route: 'London → Edinburgh (LHR → EDI)',   reason: 'Genesis Scottish Open build' },
              { date: 'May 8',  route: 'Edinburgh → Belfast (EDI → BFS)',  reason: 'The Open practice (Portrush)' },
              { date: 'May 14', route: 'Belfast → London',                 reason: 'Reset week' },
              { date: 'May 28', route: 'London → New York (LHR → JFK)',    reason: 'FedEx Cup build (US swing)' },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50 last:border-0">
                <span className="text-xs text-green-400 font-medium w-14">{t.date}</span>
                <span className="text-sm text-gray-200 flex-1">{t.route}</span>
                <span className="text-xs text-gray-500">{t.reason}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl p-4 text-center bg-[#0d0f1a] border border-gray-800"><div className="text-xl font-black text-green-400">38</div><div className="text-xs text-gray-300 font-semibold mt-1">Flights</div><div className="text-[10px] text-gray-600 mt-0.5">This season</div></div>
          <div className="rounded-xl p-4 text-center bg-[#0d0f1a] border border-gray-800"><div className="text-xl font-black text-teal-400">11</div><div className="text-xs text-gray-300 font-semibold mt-1">Countries</div><div className="text-[10px] text-gray-600 mt-0.5">Visited</div></div>
          <div className="rounded-xl p-4 text-center bg-[#0d0f1a] border border-gray-800"><div className="text-xl font-black text-orange-400">128</div><div className="text-xs text-gray-300 font-semibold mt-1">Hotel Nights</div><div className="text-[10px] text-gray-600 mt-0.5">YTD</div></div>
        </div>

        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-3">Visa &amp; Entry Requirements</div>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="py-1.5 border-b border-gray-800/50">Schengen events (Munich, Geneva, Madrid, Paris): GBR passport — no visa, 90/180 day rule applies. Track cumulative days carefully across the European swing.</div>
            <div className="py-1.5 border-b border-gray-800/50">USA — FedEx Cup swing (Aug-Sep, Memphis / Atlanta): ESTA active until 2027 · Fee $21 · No action needed.</div>
            <div className="py-1.5 border-b border-gray-800/50">Australia — ISPS Handa Open (Dec, Perth): ETA required — apply 6 weeks before departure. £15.</div>
            <div className="py-1.5">UAE — Race to Dubai Championship (Nov): GBR passport — visa on arrival, free, 30 days. No action needed.</div>
          </div>
        </div>

        <GolfAISection context="default" player={player} session={session} />
      </div>
    )
  }

  // ─── RESEARCHER (4-step wizard, 3-mode switcher) ──────────────────────────
  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => setTravelTabMode('overview')} className="text-xs text-gray-500 hover:text-green-400 flex items-center gap-1.5 transition-colors">
        <span>&larr;</span><span>Back to travel overview</span>
      </button>
      <div><div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest bg-gray-800 px-2 py-0.5 rounded">TR-FLIGHTS-01</span><span className="text-[10px] font-bold text-green-400 bg-green-600/10 px-2 py-0.5 rounded border border-green-600/30">AI Research Agent</span></div><h2 className="text-xl font-black text-white">Travel Researcher</h2><p className="text-sm text-gray-400">Flights, hotels, and a booking email in under 60 seconds.</p></div>
      <div className="flex items-center gap-2 mb-4">{[{n:1,l:'Configure'},{n:2,l:'Research'},{n:3,l:'Results'},{n:4,l:'Book'}].map((s,i)=><div key={s.n} className="flex items-center gap-2"><div className="flex flex-col items-center gap-1"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${tStep===s.n?'bg-green-600 text-white':tStep>s.n?'bg-emerald-500 text-white':'bg-gray-800 text-gray-500'}`}>{tStep>s.n?'✓':s.n}</div><span className={`text-[10px] ${tStep===s.n?'text-green-400 font-semibold':'text-gray-600'}`}>{s.l}</span></div>{i<3&&<div className={`h-px w-12 mb-4 ${tStep>s.n?'bg-emerald-500':'bg-gray-800'}`}/>}</div>)}</div>

      {tStep===1 && (
        <div className="space-y-6">
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-2 grid grid-cols-3 gap-1">
            {([
              { id:'full' as const,    icon:'✈️🏨', label:'Full trip',    sub:'Flights + hotel' },
              { id:'flights' as const, icon:'✈️',   label:'Flights only', sub:'Skip the hotel' },
              { id:'rooms' as const,   icon:'🏨',   label:'Room only',    sub:'Hotel / Airbnb only' },
            ]).map(m => (
              <button key={m.id} onClick={() => setTravelMode(m.id)}
                className={`px-3 py-3 rounded-xl text-xs text-center border transition-all ${travelMode===m.id ? 'border-green-500 bg-green-600/10 text-white' : 'border-transparent text-gray-500 hover:text-white'}`}>
                <div className="text-base mb-0.5">{m.icon}</div>
                <div className="font-bold">{m.label}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{m.sub}</div>
              </button>
            ))}
          </div>

          {travelMode !== 'rooms' && (
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-6"><h3 className="text-sm font-bold text-white mb-1">Which tournament?</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">{UPCOMING.map(t=><button key={t.name} onClick={()=>{setTrTourney(t.name);setTrDest(t.dest)}} className={`px-4 py-3 rounded-xl text-left text-xs border ${trTourney===t.name?'border-green-500 bg-green-600/10 text-white':'border-gray-800 text-gray-400 hover:text-white'}`}><div className="font-semibold">{t.name}</div><div className="text-[10px] text-gray-600 mt-0.5">{t.dates}</div></button>)}</div></div>
          )}

          {travelMode !== 'rooms' && (
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-6"><h3 className="text-sm font-bold text-white mb-4">Route &amp; dates</h3><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] text-gray-500 uppercase mb-1 block">From</label><input defaultValue={trOrigin} onBlur={e=>setTrOrigin(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white"/></div><div><label className="text-[10px] text-gray-500 uppercase mb-1 block">To</label><input value={trDest} onChange={e=>setTrDest(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white"/></div><div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Depart</label><input type="date" value={trDepart} onChange={e=>setTrDepart(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white"/></div><div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Return</label><input type="date" value={trReturn} onChange={e=>setTrReturn(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white"/></div></div></div>
          )}

          {travelMode === 'rooms' && (
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Destination &amp; dates</h3>
                <p className="text-[11px] text-gray-500 mb-3">City or course area. No tournament needed.</p>
                <div className="flex flex-wrap gap-2 mb-3">{ROOM_DEST_CHIPS.map(c => <button key={c} onClick={()=>setTrDest(c)} className={`px-3 py-1.5 rounded-lg text-xs border ${trDest===c?'border-green-500 bg-green-600/10 text-white':'border-gray-800 text-gray-500 hover:text-white'}`}>{c}</button>)}</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Where</label><input value={trDest} onChange={e=>setTrDest(e.target.value)} placeholder="City or course" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white"/></div>
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
                    <button key={t.id} onClick={()=>setTrBudgetTier(t.id)} className={`px-3 py-3 rounded-xl text-left border text-xs ${trBudgetTier===t.id?'border-green-500 bg-green-600/10 text-white':'border-gray-800 text-gray-500 hover:text-white'}`}>
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
                    ? [{v:trShared,s:setTrShared,l:'Shared room OK'},{v:trKitchen,s:setTrKitchen,l:'Kitchen access'},{v:trEarly,s:setTrEarly,l:'Early check-in'},{v:trCourse,s:setTrCourse,l:'Course-adjacent (bonus)'}]
                    : trBudgetTier==='luxe'
                      ? [{v:trSpa,s:setTrSpa,l:'Spa'},{v:trCourse,s:setTrCourse,l:'Course-adjacent'},{v:trGym,s:setTrGym,l:'Gym'},{v:trEarly,s:setTrEarly,l:'Suite preferred'}]
                      : [{v:trGym,s:setTrGym,l:'Gym'},{v:trCourse,s:setTrCourse,l:'Course-adjacent'},{v:trEarly,s:setTrEarly,l:'Late check-out'},{v:trKitchen,s:setTrKitchen,l:'Workspace'}]
                  ).map(r=>
                    <button key={r.l} onClick={()=>r.s(!r.v)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border text-left ${r.v?'border-green-500 bg-green-600/10 text-white':'border-gray-800 text-gray-500'}`}><span>{r.v?'✓':'○'}</span>{r.l}</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {travelMode !== 'rooms' && (
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-6"><h3 className="text-sm font-bold text-white mb-4">Preferences</h3><div className={`grid ${travelMode==='full' ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}><div><label className="text-[10px] text-gray-500 uppercase mb-2 block">Cabin</label>{([{id:'economy' as const,l:'Economy'},{id:'premium_economy' as const,l:'Premium Econ'},{id:'business' as const,l:'Business'}]).map(c=><button key={c.id} onClick={()=>setTrCabin(c.id)} className={`w-full mb-1.5 px-3 py-2 rounded-xl text-xs text-left border ${trCabin===c.id?'border-green-500 bg-green-600/10 text-white':'border-gray-800 text-gray-400'}`}>{c.l}</button>)}</div><div><label className="text-[10px] text-gray-500 uppercase mb-2 block">Flight max (£)</label><input type="number" defaultValue={trMaxFlight} onBlur={e=>setTrMaxFlight(e.target.value)} placeholder="300" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white mb-3"/>{travelMode==='full' && <><label className="text-[10px] text-gray-500 uppercase mb-2 block">Hotel (£/night)</label><input type="number" defaultValue={trHotelBudget} onBlur={e=>setTrHotelBudget(e.target.value)} placeholder="200" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white"/></>}</div>{travelMode==='full' && <div><label className="text-[10px] text-gray-500 uppercase mb-2 block">Hotel needs</label>{[{v:trCourse,s:setTrCourse,l:'Course-adjacent'},{v:trGym,s:setTrGym,l:'Gym'},{v:trEarly,s:setTrEarly,l:'Early check-in'}].map(r=><button key={r.l} onClick={()=>r.s(!r.v)} className={`w-full mb-1.5 flex items-center gap-2 px-3 py-2 rounded-xl text-xs border text-left ${r.v?'border-green-500 bg-green-600/10 text-white':'border-gray-800 text-gray-500'}`}><span>{r.v?'✓':'○'}</span>{r.l}</button>)}</div>}</div></div>
          )}

          <button onClick={runSearch} disabled={searchDisabled} className="w-full py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-40" style={{background:searchDisabled?'#374151':'linear-gradient(135deg, #15803D, #166534)'}}>{cta}</button>
        </div>
      )}

      {tStep===2&&searching&&(<div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-12 text-center"><div className="text-4xl mb-6 animate-bounce">{travelMode==='rooms'?'🏨':'✈️'}</div><h3 className="text-lg font-bold text-white mb-2">Searching...</h3><p className="text-sm text-green-400 mb-4">{searchPhase}</p></div>)}

      {tStep===3 && (
        <div className="space-y-6">
          {aiNarrative && <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4 flex items-start gap-3"><span>🤖</span><div><div className="text-xs font-bold text-green-400 mb-1">AI Recommendation</div><p className="text-xs text-gray-300">{aiNarrative}</p></div></div>}
          {includeFlights && (
            <div><h3 className="text-sm font-bold text-white mb-3">✈️ Flights — {trOrigin} → {trDest}</h3><div className="space-y-2">{flightResults.map((f,i)=><button key={i} onClick={()=>setSelectedFlight(selectedFlight?.flightNo===f.flightNo?null:f)} className={`w-full text-left rounded-xl border p-4 ${selectedFlight?.flightNo===f.flightNo?'border-green-500 bg-green-600/10':'border-gray-800 bg-[#0d1117] hover:border-gray-700'}`}><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className={`w-4 h-4 rounded-full border ${selectedFlight?.flightNo===f.flightNo?'bg-green-500 border-green-500':'border-gray-600'}`}/><div><div className="text-xs font-bold text-white">{f.airline}</div><div className="text-[10px] text-gray-500">{f.flightNo} · {f.stops}</div></div><div className="text-xs text-gray-300">{f.departure}→{f.arrival}</div><div className="text-xs text-gray-500">{f.duration}</div></div><div className="flex items-center gap-3"><ScBadge s={f.score}/><div className="text-sm font-black text-white">£{f.price}</div>{i===0&&<span className="text-[9px] px-2 py-0.5 rounded-full bg-green-600/20 text-green-400 font-bold">Best</span>}</div></div></button>)}</div></div>
          )}
          {includeHotels && (
            <div>
              <h3 className="text-sm font-bold text-white mb-3">🏨 {travelMode==='rooms' ? (trBudgetTier==='budget' ? 'Budget rooms' : trBudgetTier==='luxe' ? 'Flagship hotels' : 'Hotels') : 'Hotels'} — {trDest}</h3>
              <div className="grid grid-cols-2 gap-3">{hotelResults.map((h,i)=><button key={i} onClick={()=>setSelectedHotel(selectedHotel?.name===h.name?null:h)} className={`text-left rounded-xl border p-4 ${selectedHotel?.name===h.name?'border-green-500 bg-green-600/10':'border-gray-800 bg-[#0d1117] hover:border-gray-700'}`}><div className="flex items-start justify-between mb-2"><div className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full border mt-0.5 ${selectedHotel?.name===h.name?'bg-green-500 border-green-500':'border-gray-600'}`}/><div><div className="text-xs font-bold text-white">{h.name}</div><div className="text-[10px] text-gray-500">{h.stars>0?'★'.repeat(h.stars):'Airbnb'} · {h.area}</div></div></div><ScBadge s={h.score}/></div><div className="text-[10px] text-gray-500 ml-6 mb-2">📍 {h.distanceToVenue} · ⭐ {h.rating}</div><div className="flex flex-wrap gap-1 ml-6 mb-2">{h.amenities.map((a,j)=><span key={j} className={`text-[9px] px-1.5 py-0.5 rounded ${a==='Gym'||a==='Spa'||a==='Course shuttle'||a==='Concierge'?'bg-green-600/20 text-green-400':'bg-gray-800 text-gray-500'}`}>{a}</span>)}</div><div className="flex justify-between ml-6"><span className="text-[10px] text-gray-500">£{h.pricePerNight}/night</span><span className="text-sm font-black text-white">£{h.totalPrice.toLocaleString()}</span></div>{i===0&&<div className="mt-2 ml-6 text-[9px] text-green-400 font-bold">✓ Recommended</div>}</button>)}</div>
              {travelMode === 'rooms' && (
                <div className="mt-4 bg-[#0d0f1a] border border-green-600/30 rounded-xl p-4">
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
          {(selectedFlight||selectedHotel) && <div className="bg-[#0d1117] border border-green-600/30 rounded-xl p-4 flex items-center justify-between"><div><div className="text-xs font-bold text-white">Selected</div><div className="text-[10px] text-gray-500">{selectedFlight&&`✈️ ${selectedFlight.airline} £${selectedFlight.price*trPax}`}{selectedFlight&&selectedHotel&&' + '}{selectedHotel&&`🏨 ${selectedHotel.name} £${selectedHotel.totalPrice}`}</div></div><div className="text-2xl font-black text-white">£{((selectedFlight?.price??0)*trPax+(selectedHotel?.totalPrice??0)).toLocaleString()}</div></div>}
          <div className="flex gap-3"><button onClick={genEmail} disabled={!selectedFlight&&!selectedHotel} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40" style={{background:(!selectedFlight&&!selectedHotel)?'#374151':'#15803D'}}>📧 Booking email →</button><button onClick={()=>{setTStep(1);setFlightResults([]);setHotelResults([]);setSelectedFlight(null);setSelectedHotel(null)}} className="px-4 py-3 rounded-xl text-xs border border-gray-700 text-gray-400 hover:text-white">↺ New</button></div>
        </div>
      )}

      {tStep===4&&(<div className="space-y-5"><div className="bg-[#0d0f1a] border border-gray-800 rounded-2xl p-6"><h3 className="text-sm font-bold text-white mb-4">📧 Booking email</h3><textarea value={bookingEmail} onChange={e=>setBookingEmail(e.target.value)} rows={16} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-xs text-gray-300 font-mono resize-none"/></div>{emailSent?<div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4 text-center"><span className="text-2xl">✅</span><div className="text-sm font-bold text-green-400 mt-2">Email opened</div></div>:<div className="flex gap-3"><button onClick={()=>{window.open(`mailto:sarah.mitchell@ism.com?subject=${encodeURIComponent(`Travel — ${trTourney||trDest}`)}&body=${encodeURIComponent(bookingEmail)}`);setEmailSent(true)}} className="flex-1 py-4 rounded-xl text-sm font-bold text-white" style={{background:'#15803D'}}>📧 Send →</button><button onClick={()=>navigator.clipboard?.writeText(bookingEmail)} className="px-4 py-4 rounded-xl text-xs border border-gray-700 text-gray-400">📋 Copy</button></div>}<button onClick={()=>{setTStep(1);setFlightResults([]);setHotelResults([]);setSelectedFlight(null);setSelectedHotel(null);setBookingEmail('');setEmailSent(false)}} className="text-xs text-gray-600 hover:text-gray-400 block mx-auto">← New search</button></div>)}

      <GolfAISection context="default" player={player} session={session} />
    </div>
  )
}

// Generic placeholder for remaining views

// ─── Q-SCHOOL & QUALIFYING VIEW ───────────────────────────────────────────────
function GolfQSchoolView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const QSCHOOL_FINAL_START = '11 Nov 2026';
  const daysToFinal = 206;
  const mondayQualifiers = [
    { date: '21 Apr', event: 'Spanish Open MQ',  course: 'Valderrama',       entries: 112, spots: 4, status: 'Entered',      statusColour: 'bg-green-600/20 text-green-300 border-green-600/40' },
    { date: '12 May', event: 'Dutch Open MQ',     course: 'Bernardus',        entries: 98,  spots: 4, status: 'Eligible',     statusColour: 'bg-blue-600/20 text-blue-300 border-blue-600/40' },
    { date: '2 Jun',  event: 'Italian Open MQ',   course: 'Marco Simone',     entries: 128, spots: 4, status: 'Entered',      statusColour: 'bg-green-600/20 text-green-300 border-green-600/40' },
    { date: '30 Jun', event: 'BMW Int. Open MQ',  course: 'Golfclub München', entries: 108, spots: 4, status: 'Waitlist',     statusColour: 'bg-amber-600/20 text-amber-300 border-amber-600/40' },
    { date: '4 Aug',  event: 'Danish Open MQ',    course: 'Great Northern',   entries: 94,  spots: 4, status: 'Eligible',     statusColour: 'bg-blue-600/20 text-blue-300 border-blue-600/40' },
    { date: '1 Sep',  event: 'Irish Open MQ',     course: 'Mount Juliet',     entries: 118, spots: 4, status: 'Too far down', statusColour: 'bg-gray-700 text-gray-400 border-gray-700' },
  ];
  const sectionalEntries = [
    { event: 'The Open Regional Qualifier', date: '23 Jun',            location: 'West Lancashire GC',     deadline: '5 May',  status: 'Entered (via OWGR exemption)' },
    { event: 'US Open International Q',     date: '11 May',            location: 'Walton Heath',            deadline: '22 Apr', status: 'Not entered — outside OWGR window' },
    { event: 'European Q-School Stage 2',   date: '8 Oct',             location: 'El Saler, Spain',         deadline: '1 Sep',  status: 'Conditional — only if DP World card lost' },
    { event: 'Korn Ferry Q-School Stage 1', date: '3 Sep',             location: "TPC Sawgrass Dye's",      deadline: '15 Aug', status: 'Backup route — under review' },
    { event: 'European Q-School Final',     date: QSCHOOL_FINAL_START,  location: 'Lumine Golf Club, Spain', deadline: '20 Oct', status: 'Only required if cards lost' },
  ];
  const history = [
    { year: 2022, stage: 'Final Stage', result: 'Tied 18th — earned DP World Tour card' },
    { year: 2021, stage: 'Stage 2',     result: 'Advanced via T9 — eliminated at Final' },
    { year: 2020, stage: 'Stage 1',     result: 'Top 30 — advanced to Stage 2' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="🎓" title="Q-School & Qualifying" subtitle="Monday qualifiers, sectional entries, Q-School countdown, and status tracker." />

      <div className="bg-gradient-to-r from-green-900/30 to-[#0d0f1a] border border-green-600/30 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="text-4xl">⏳</div>
          <div className="flex-1">
            <div className="text-white font-bold text-lg">Final Stage Q-School — {QSCHOOL_FINAL_START}</div>
            <div className="text-xs text-gray-400 mt-1">Lumine Golf Club, Tarragona, Spain · Target: secure 2027 DP World Tour card</div>
            <div className="mt-3 flex items-center gap-4">
              <div><div className="text-3xl font-black text-green-400">{daysToFinal}</div><div className="text-[10px] text-gray-500">days to go</div></div>
              <div className="text-xs text-gray-400 flex-1">Most likely unused — currently #43 Race to Dubai, on track to retain card via points. Q-School is the backup route.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4 bg-[#0d0f1a] border border-gray-800">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Current Status</div>
          <div className="text-white font-bold text-sm mt-1">DP World Tour card holder</div>
          <div className="text-[11px] text-green-400 mt-0.5">Via Race to Dubai points</div>
        </div>
        <div className="rounded-xl p-4 bg-[#0d0f1a] border border-gray-800">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Points to Retain</div>
          <div className="text-white font-bold text-sm mt-1">+1,250 pts needed</div>
          <div className="text-[11px] text-amber-400 mt-0.5">Race to Dubai top 115 holds card</div>
        </div>
        <div className="rounded-xl p-4 bg-[#0d0f1a] border border-gray-800">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Q-School Priority</div>
          <div className="text-white font-bold text-sm mt-1">Cat. 16 (Final Stage)</div>
          <div className="text-[11px] text-gray-400 mt-0.5">If cards lost — top 20 seeded</div>
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-bold text-white mb-4">Upcoming Monday Qualifiers</div>
        <div className="space-y-2">
          {mondayQualifiers.map((q, i) => (
            <div key={i} className="grid grid-cols-6 items-center gap-3 py-2 border-b border-gray-800/60 last:border-0 text-[11px]">
              <div className="text-gray-500">{q.date}</div>
              <div className="col-span-2 text-white font-medium text-xs">{q.event}</div>
              <div className="text-gray-400">{q.course}</div>
              <div className="text-gray-500">{q.entries} entries · {q.spots} spots</div>
              <div className="flex items-center justify-end gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded border ${q.statusColour}`}>{q.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800"><div className="text-sm font-bold text-white">Sectional Qualifying Entries</div></div>
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-800 bg-gray-900/30"><th className="text-left p-3">Event</th><th className="text-left p-3">Date</th><th className="text-left p-3">Location</th><th className="text-left p-3">Entry Deadline</th><th className="text-left p-3">Status</th></tr></thead>
          <tbody>
            {sectionalEntries.map((s, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="p-3 text-white font-medium text-xs">{s.event}</td>
                <td className="p-3 text-gray-300 text-xs">{s.date}</td>
                <td className="p-3 text-gray-400 text-xs">{s.location}</td>
                <td className="p-3 text-gray-400 text-xs">{s.deadline}</td>
                <td className="p-3 text-gray-300 text-xs">{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-bold text-white mb-3">Historical Q-School Performance</div>
        <div className="space-y-2">
          {history.map((h, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/60 last:border-0 text-sm">
              <div><span className="text-green-400 font-bold">{h.year}</span> <span className="text-gray-500 ml-2">{h.stage}</span></div>
              <div className="text-gray-300 text-xs">{h.result}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-bold text-white mb-3">Key Dates — 2026 Q-School</div>
        <div className="space-y-2 text-xs">
          {[
            { label: 'First Stage',  date: '15 Sep 2026', countdown: '148 days' },
            { label: 'Second Stage', date: '6 Oct 2026',  countdown: '170 days' },
            { label: 'Final Stage',  date: '11 Nov 2026', countdown: '206 days' },
          ].map((d, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/60 last:border-0">
              <span className="text-white font-medium">{d.label}</span>
              <div className="flex items-center gap-3"><span className="text-gray-400">{d.date}</span><span className="text-[10px] text-green-400 font-semibold">{d.countdown}</span></div>
            </div>
          ))}
        </div>
      </div>

      <GolfAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── VIDEO LIBRARY ─────────────────────────────────────────────────────────
function GolfVideoLibraryView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const isFounder = session.isDemoShell === false
  type VideoCategory = 'swing' | 'competition' | 'debrief' | 'coach' | 'drill'
  type FilterId = 'all' | VideoCategory
  const [category, setCategory] = useState<FilterId>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'newest' | 'oldest' | 'views'>('newest')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const GBUCKET = 'https://storage.googleapis.com/gtv-videos-bucket/sample'
  const VIDEOS: {
    id: string; title: string; category: VideoCategory; duration: string;
    date: string; dateSort: number; views: number; src: string; thumbnail: string;
    coach: string; description: string; tags: string[];
  }[] = [
    { id: 'v01', title: 'R1 Range Session — Halden Motors',                  category: 'swing',       duration: '2:14',  date: 'Apr 16', dateSort: 116, views: 420,  src: `${GBUCKET}/BigBuckBunny.mp4`,                 thumbnail: 'https://picsum.photos/seed/golf-v01/640/360', coach: 'Carlos Mendez', description: 'Pre-round 45-minute range block. Driver → 4i → wedges. Working on the trail-hip clearance flagged in last debrief.',              tags: ['range','driver','warm-up'] },
    { id: 'v02', title: 'Carlos Mendez debrief — Tees at Munich',            category: 'debrief',     duration: '8:45',  date: 'Apr 14', dateSort: 114, views: 178,  src: `${GBUCKET}/ElephantsDream.mp4`,               thumbnail: 'https://picsum.photos/seed/golf-v02/640/360', coach: 'Carlos Mendez', description: 'Full post-round walk-through after R3. Strokes-gained breakdown plus three focus areas for R4.',                                  tags: ['debrief','strategy'] },
    { id: 'v03', title: 'Slow-mo swing analysis — driver setup',             category: 'swing',       duration: '3:22',  date: 'Apr 12', dateSort: 112, views: 645,  src: `${GBUCKET}/ForBiggerBlazes.mp4`,              thumbnail: 'https://picsum.photos/seed/golf-v03/640/360', coach: 'Carlos Mendez', description: '240fps capture of the driver setup sequence. Ball position, grip pressure, and spine tilt checks.',                              tags: ['slow-mo','driver'] },
    { id: 'v04', title: 'Dunhill Links T8 — back 9 highlights',              category: 'competition', duration: '6:18',  date: 'Apr 08', dateSort: 108, views: 1243, src: `${GBUCKET}/ForBiggerEscapes.mp4`,             thumbnail: 'https://picsum.photos/seed/golf-v04/640/360', coach: 'Broadcast feed', description: 'Sunday back-nine highlights from the Alfred Dunhill Links — T8 finish at the Old Course.',                                      tags: ['competition','highlights'] },
    { id: 'v05', title: 'Lag putting drill — 30-40ft',                       category: 'drill',       duration: '4:10',  date: 'Apr 05', dateSort: 105, views: 389,  src: `${GBUCKET}/ForBiggerFun.mp4`,                 thumbnail: 'https://picsum.photos/seed/golf-v05/640/360', coach: 'Tommy Delgado', description: 'Speed-control ladder drill. 10 balls at 30ft, then 35, then 40 — target: all inside 3ft.',                                      tags: ['putting','drill'] },
    { id: 'v06', title: 'Bunker technique — splash vs lift',                 category: 'coach',       duration: '5:32',  date: 'Apr 02', dateSort: 102, views: 712,  src: `${GBUCKET}/ForBiggerJoyrides.mp4`,            thumbnail: 'https://picsum.photos/seed/golf-v06/640/360', coach: 'Carlos Mendez', description: 'Coach-library clip: when to splash out vs pick-and-lift. Sand conditions, lie, and distance decision tree.',                    tags: ['short-game','bunker'] },
    { id: 'v07', title: 'Tempo work — weighted club routine',                category: 'drill',       duration: '2:50',  date: 'Mar 29', dateSort: 98,  views: 256,  src: `${GBUCKET}/ForBiggerMeltdowns.mp4`,           thumbnail: 'https://picsum.photos/seed/golf-v07/640/360', coach: 'Carlos Mendez', description: 'Three-swing tempo routine with a weighted training club. 3:1 backswing-to-downswing cadence.',                                   tags: ['tempo','routine'] },
    { id: 'v08', title: 'R2 post-round chat — KLM Open',                     category: 'debrief',     duration: '12:04', date: 'Mar 25', dateSort: 94,  views: 94,   src: `${GBUCKET}/Sintel.mp4`,                       thumbnail: 'https://picsum.photos/seed/golf-v08/640/360', coach: 'Carlos Mendez', description: 'Long-form post-round with Carlos after KLM Open R2. Course-strategy errors plus mental-game notes.',                             tags: ['debrief','mental'] },
    { id: 'v09', title: 'Wind play — low stinger setup',                     category: 'coach',       duration: '4:55',  date: 'Mar 22', dateSort: 91,  views: 512,  src: `${GBUCKET}/SubaruOutbackOnStreetAndDirt.mp4`, thumbnail: 'https://picsum.photos/seed/golf-v09/640/360', coach: 'Mia Rodriguez', description: 'Links conditions — how to hit a low stinger under 12ft trajectory. Ball position and hand height adjustments.',                 tags: ['links','stinger'] },
    { id: 'v10', title: 'Pressure putts — 6ft gauntlet',                     category: 'drill',       duration: '3:15',  date: 'Mar 18', dateSort: 87,  views: 421,  src: `${GBUCKET}/TearsOfSteel.mp4`,                 thumbnail: 'https://picsum.photos/seed/golf-v10/640/360', coach: 'Tommy Delgado', description: '20-putt gauntlet from 6ft with scoring pressure. Session ends only when 10 consecutive are made.',                               tags: ['putting','pressure'] },
    { id: 'v11', title: 'Crown Park final round — approach highlights',      category: 'competition', duration: '7:40',  date: 'Mar 12', dateSort: 81,  views: 892,  src: `${GBUCKET}/VolkswagenGTIReview.mp4`,          thumbnail: 'https://picsum.photos/seed/golf-v11/640/360', coach: 'Broadcast feed', description: 'Final-round approach highlights at Crown Park. Six approaches inside 12ft including the 5-iron on 17.',                           tags: ['competition','approach'] },
    { id: 'v12', title: 'Driver cover gallery — shot shapes',                category: 'swing',       duration: '5:10',  date: 'Mar 08', dateSort: 77,  views: 334,  src: `${GBUCKET}/WeAreGoingOnBullrun.mp4`,          thumbnail: 'https://picsum.photos/seed/golf-v12/640/360', coach: 'Carlos Mendez', description: "Six different shot shapes off the tee — fade, draw, power draw, knockdown, high cut, stinger. Session from Carlos' training bay.", tags: ['driver','shot-shapes'] },
  ]

  const CATEGORIES: { id: FilterId; label: string }[] = [
    { id: 'all',         label: 'All' },
    { id: 'swing',       label: 'My Swings' },
    { id: 'competition', label: 'Competition' },
    { id: 'debrief',     label: 'Debriefs' },
    { id: 'coach',       label: 'Coach Library' },
    { id: 'drill',       label: 'Drills' },
  ]
  const categoryLabel: Record<VideoCategory, string> = { swing: 'Swing', competition: 'Competition', debrief: 'Debrief', coach: 'Coach Library', drill: 'Drill' }
  const categoryColor: Record<VideoCategory, string> = { swing: '#16a34a', competition: '#8b5cf6', debrief: '#0ea5e9', coach: '#f59e0b', drill: '#ec4899' }

  const q = query.trim().toLowerCase()
  const filtered = VIDEOS
    .filter(v => category === 'all' || v.category === category)
    .filter(v => !q || v.title.toLowerCase().includes(q) || v.tags.some(t => t.toLowerCase().includes(q)))
    .sort((a, b) => sort === 'newest' ? b.dateSort - a.dateSort : sort === 'oldest' ? a.dateSort - b.dateSort : b.views - a.views)

  const selectedIdx = selectedId ? filtered.findIndex(v => v.id === selectedId) : -1
  const selected = selectedIdx >= 0 ? filtered[selectedIdx] : null
  const goto = (offset: number) => {
    if (selectedIdx < 0 || filtered.length === 0) return
    const next = (selectedIdx + offset + filtered.length) % filtered.length
    setSelectedId(filtered[next].id)
  }

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedId(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  const formatViews = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

  if (isFounder) {
    return (
      <div className="space-y-6">
        <SectionHeader icon="🎬" title="Video Library" subtitle="Swing recordings, competition footage, debriefs, and coach clip library — upload or auto-import." />
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <div className="text-5xl mb-4">🎬</div>
          <div className="text-white font-semibold text-lg mb-2">No videos yet</div>
          <div className="text-gray-400 text-sm max-w-sm mb-5">Connect your range camera or upload footage to start building your video library. Swing clips, competition footage, and coach debriefs all land here.</div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: '#16a34a', color: '#fff' }}>Connect Lumio Vision</button>
            <button className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: '#1F2937', color: '#9CA3AF' }}>Upload Footage</button>
          </div>
        </div>
        <GolfAISection context="default" player={player} session={session} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader icon="🎬" title="Video Library" subtitle="Swing recordings, competition footage, debriefs, and coach clip library — 340 videos indexed." />

      <div className="rounded-lg px-3 py-2 text-[11px]" style={{ background: '#0d1117', border: '1px solid #1F2937', color: '#6B7280' }}>
        Demo placeholder footage — real swing clips stream from your Lumio Vision + range camera in the full build.
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex gap-1 flex-wrap flex-1">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={{ background: category === c.id ? '#16a34a' : '#0d1117', color: category === c.id ? '#fff' : '#9CA3AF', border: '1px solid ' + (category === c.id ? '#16a34a' : '#1F2937') }}>
              {c.label}
            </button>
          ))}
        </div>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search title or tag…" className="px-3 py-2 rounded-lg text-sm text-white md:w-56" style={{ background: '#0d1117', border: '1px solid #1F2937' }} />
        <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className="px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#0d1117', border: '1px solid #1F2937' }}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="views">Most Viewed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl p-8 text-center text-sm" style={{ background: '#0d1117', border: '1px solid #1F2937', color: '#6B7280' }}>
          No videos match that search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(v => (
            <button key={v.id} onClick={() => setSelectedId(v.id)} className="text-left rounded-xl overflow-hidden group transition-all hover:scale-[1.01]" style={{ background: '#0d1117', border: '1px solid #1F2937' }}>
              <div className="relative aspect-video overflow-hidden">
                <img src={v.thumbnail} alt={v.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)' }} />
                <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: categoryColor[v.category], color: '#fff' }}>
                  {categoryLabel[v.category]}
                </span>
                <span className="absolute bottom-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.75)', color: '#fff' }}>
                  {v.duration}
                </span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-transform group-hover:scale-110" style={{ background: 'rgba(22,163,74,0.9)', color: '#fff' }}>
                    ▶
                  </div>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                  <span>{v.date}</span>
                  <span>{formatViews(v.views)} views</span>
                </div>
                <div className="text-sm font-semibold text-white truncate" title={v.title}>{v.title}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{v.coach}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={() => setSelectedId(null)}>
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl" style={{ background: '#0d1117', border: '1px solid #1F2937' }} onClick={e => e.stopPropagation()}>
            <div className="relative">
              <video controls autoPlay src={selected.src} poster={selected.thumbnail} className="w-full aspect-video bg-black" />
              <button onClick={() => setSelectedId(null)} className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-white text-lg font-bold" style={{ background: 'rgba(0,0,0,0.75)' }} aria-label="Close">×</button>
              {filtered.length > 1 && (
                <>
                  <button onClick={() => goto(-1)} className="absolute top-1/2 left-3 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white text-xl" style={{ background: 'rgba(0,0,0,0.6)' }} aria-label="Previous video">‹</button>
                  <button onClick={() => goto(1)} className="absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white text-xl" style={{ background: 'rgba(0,0,0,0.6)' }} aria-label="Next video">›</button>
                </>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: categoryColor[selected.category], color: '#fff' }}>
                  {categoryLabel[selected.category]}
                </span>
                <span className="text-xs text-gray-500">{selected.date} · {formatViews(selected.views)} views · {selected.duration}</span>
              </div>
              <div className="text-lg font-bold text-white mb-1">{selected.title}</div>
              <div className="text-xs text-gray-400 mb-3">{selected.coach}</div>
              <p className="text-sm text-gray-300 leading-relaxed">{selected.description}</p>
              {selected.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-3">
                  {selected.tags.map(t => (
                    <span key={t} className="text-[10px] text-gray-400 px-2 py-0.5 rounded" style={{ background: '#161b22' }}>#{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <GolfAISection context="default" player={player} session={session} />
    </div>
  )
}

function PlaceholderView({ title, icon, description, player, session }: { title: string; icon: string; description: string; player: GolfPlayer; session: SportsDemoSession }) {
  return (
    <div className="space-y-6">
      <SectionHeader icon={icon} title={title} />
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4">{icon}</div>
        <div className="text-white font-semibold text-lg mb-2">{title}</div>
        <div className="text-gray-400 text-sm max-w-sm">{description}</div>
        <div className="mt-6 bg-green-600/10 border border-green-600/30 rounded-lg p-4 text-left w-full max-w-md">
          <div className="text-xs text-green-400 font-semibold mb-2">COMING IN FULL BUILD</div>
          <div className="text-xs text-gray-400">{description} Full module with demo data available once connected to the Lumio Supabase backend.</div>
        </div>
      </div>
      <GolfAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── ARCCOS INTEGRATION VIEW ──────────────────────────────────────────────────
function GolfShotTrackingLegacyView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const [connected, setConnected] = useState(false);
  const sgFeed = [
    { date: 'Jul 5 — R2 Halden Motors International', ott: 0.6, atg: 0.8, arg: 0.2, putt: -1.4, total: 0.2, rounds: 1 },
    { date: 'Jul 4 — R1 Halden Motors International', ott: 0.4, atg: 1.1, arg: -0.1, putt: -0.9, total: 0.5, rounds: 1 },
    { date: 'Jul 2 — Practice (Eichenried)', ott: null, atg: null, arg: null, putt: -1.2, total: null, rounds: 0 },
    { date: 'Jun 29 — R4 KLM Open', ott: 0.9, atg: 1.3, arg: 0.4, putt: -0.8, total: 1.8, rounds: 1 },
    { date: 'Jun 28 — R3 KLM Open', ott: 0.3, atg: 0.7, arg: 0.2, putt: -1.6, total: -0.4, rounds: 1 },
  ];
  const tourUsers = [
    { name: 'Owen Alderton', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', tour: 'PGA / DP World', note: 'Lumio Range Pro suite — SG tracking + shot-by-shot history' },
    { name: 'Henrik Tellander', flag: '🇳🇴', tour: 'PGA Tour', note: 'SG Approach analytics for course-specific prep' },
    { name: 'Emma Lindgren', flag: '🇸🇪', tour: 'LPGA', note: 'Lumio Range Pro Insights — full competitive analytics' },
    { name: 'Erik Sandberg', flag: '🇳🇴', tour: 'DP World Tour', note: 'Lumio Range Pro — driving + approach SG tracking' },
    { name: 'Jens Kjaer', flag: '🇩🇰', tour: 'DP World Tour', note: 'Lumio Range Pro — putting metrics + course fit' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="📡" title="Lumio Range Integration" subtitle="Connect your Lumio Range sensors to pipe real on-course SG data directly into Lumio Tour." />
      {/* Status Banner */}
      <div className={`rounded-xl p-5 border ${connected ? 'bg-teal-900/20 border-teal-600/40' : 'bg-gray-900/30 border-gray-700'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 ${connected ? 'border-teal-500 bg-teal-500/20' : 'border-gray-600 bg-gray-800'}`}>📡</div>
            <div>
              <div className="text-white font-semibold">Lumio Range Pro Insights</div>
              <div className="text-xs text-gray-400">Built by Edoardo Molinari · 35+ PGA / DP World / LPGA players</div>
            </div>
          </div>
          <button onClick={() => setConnected(!connected)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${connected ? 'bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30' : 'bg-green-600 text-white hover:bg-green-700'}`}>
            {connected ? 'Disconnect' : 'Connect Lumio Range'}
          </button>
        </div>
        {connected ? (
          <div className="grid grid-cols-4 gap-3">
            {[{ label: 'Last Sync', value: '8 min ago' }, { label: 'Rounds Synced', value: '147' }, { label: 'Shots Tracked', value: '12,483' }, { label: 'Sensors', value: '14 active' }].map((s, i) => (
              <div key={i} className="bg-black/20 rounded-lg p-3 text-center">
                <div className="text-white font-bold text-sm">{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400">Connect your Lumio Range account to automatically sync on-course SG data from every competitive round — no manual entry required.</div>
        )}
      </div>
      {/* What Lumio Range unlocks */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">What Lumio Range Integration Unlocks</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: '📈', title: 'Automatic SG data', desc: 'Every competitive round syncs to your Strokes Gained dashboard without manual entry. Shot-by-shot data from all 14 sensors.' },
            { icon: '🎯', title: 'AI Strategy on-course', desc: 'Tour-proven club recommendations for every hole, powered by 1.5 billion shots and your own dispersion profile.' },
            { icon: '🗺️', title: 'Course fit refinement', desc: 'Your Lumio Range shot history at a course updates your Course Fit score automatically — no estimate, real data.' },
            { icon: '📋', title: 'Practice session import', desc: 'Lumio Range tracks practice sessions too. Putting sessions, approach drills, and range work all flow into your Practice Log.' },
            { icon: '📉', title: 'Trend alerts', desc: 'Lumio Range detects SG deterioration patterns before they become crises. Lumio\'s morning briefing flags them before Pete does.' },
            { icon: '🤝', title: 'Caddie data share', desc: 'Your Lumio Range dispersion data populates the Caddie Workflow hole strategy notes automatically — sharing becomes instant.' },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg">
              <span className="text-xl">{f.icon}</span>
              <div><div className="text-sm font-medium text-white">{f.title}</div><div className="text-xs text-gray-400 mt-0.5">{f.desc}</div></div>
            </div>
          ))}
        </div>
      </div>
      {/* Live SG feed */}
      {connected && (
        <div className="bg-[#0d0f1a] border border-teal-600/30 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="text-sm font-semibold text-white">Live SG Feed — Lumio Range Data</div>
            <span className="text-xs text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full">● Auto-syncing</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-gray-500 border-b border-gray-800 bg-gray-900/30">
                <th className="text-left p-3">Session</th>
                <th className="text-right p-3">OTT</th><th className="text-right p-3">ATG</th>
                <th className="text-right p-3">ARG</th><th className="text-right p-3">PUTT</th>
                <th className="text-right p-3">TOTAL</th>
              </tr></thead>
              <tbody>{sgFeed.map((r, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="p-3 text-gray-300">{r.date}</td>
                  {[r.ott, r.atg, r.arg, r.putt, r.total].map((v, j) => (
                    <td key={j} className={`p-3 text-right font-medium ${v === null ? 'text-gray-700' : v! >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                      {v === null ? '—' : `${v! > 0 ? '+' : ''}${v!.toFixed(1)}`}
                    </td>
                  ))}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
      {/* Tour players using it */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Tour Players Using Lumio Range Pro Insights</div>
        <div className="space-y-3">
          {tourUsers.map((u, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-800/50">
              <span className="text-xl">{u.flag}</span>
              <div className="flex-1"><div className="text-sm font-medium text-white">{u.name}</div><div className="text-xs text-gray-400">{u.tour}</div></div>
              <div className="text-xs text-gray-500 max-w-xs text-right">{u.note}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-600">35+ players total across PGA Tour, DP World Tour, and LPGA. Lumio Range Pro Insights led by Edoardo Molinari (Lumio Range Chief Data Strategist).</div>
      </div>
      {/* Pricing note */}
      <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
        <div className="text-sm font-semibold text-blue-400 mb-1">ℹ️ Lumio Range Pro Insights — Access Model</div>
        <div className="text-xs text-gray-400">Lumio Range Pro Insights is invitation-only for touring professionals — not purchased like the consumer app ($155/yr). Molinari's team recruits players directly. Lumio Tour's integration works with both: Lumio Range Pro data flows in for invited tour players, consumer Lumio Range data flows in for all others. The integration requires an Lumio Range account (consumer or Pro).</div>
      </div>
      <GolfAISection context="strokes" player={player} session={session} />
    </div>
  );
}

// ─── DATAGOLF INTEGRATION VIEW ────────────────────────────────────────────────
function GolfDataFeedLegacyView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const [connected, setConnected] = useState(false);
  const coverage = [
    { tour: 'DP World Tour', events: '42+', sg: '✓ Round-level', owgr: '✓ Full', courseHistory: '✓', odds: '✓' },
    { tour: 'PGA Tour', events: '47+', sg: '✓ Shot-level (ShotLink)', owgr: '✓ Full', courseHistory: '✓', odds: '✓' },
    { tour: 'Korn Ferry Tour', events: '25+', sg: '✓ Round-level', owgr: '✓ Full', courseHistory: '✓', odds: 'Partial' },
    { tour: 'LIV Golf', events: '14', sg: '✓ Shot-level (2024+)', owgr: 'N/A', courseHistory: '✓', odds: '✓' },
    { tour: 'Asian Tour', events: '20+', sg: '✓ Round-level', owgr: '✓ Full', courseHistory: 'Partial', odds: 'Partial' },
    { tour: 'Challenge Tour', events: '30+', sg: 'Round-level', owgr: '✓ Full', courseHistory: 'Partial', odds: '—' },
  ];
  const owgrEndpoints = [
    { endpoint: 'Live Rankings', desc: 'Real-time OWGR position updated every Monday', status: 'Live' },
    { endpoint: 'Points Decay Calculator', desc: 'Rolling 104-week decay — powers expiry calendar', status: 'Live' },
    { endpoint: 'Course History & Fit', desc: 'Player SG history per course, fit score calculation', status: 'Live' },
    { endpoint: 'Field Ratings', desc: 'Strength-of-field data for every DP World Tour event', status: 'Live' },
    { endpoint: 'Skill Ratings', desc: 'Adjusted SG vs tour average — driving, approach, around green, putting', status: 'Live' },
    { endpoint: 'Tournament Schedule', desc: 'Season schedule with event IDs, course names, and coordinates', status: 'Live' },
    { endpoint: 'Historical Results', desc: 'All past results with SG data for scenario modelling', status: 'Live' },
    { endpoint: 'Win Probability', desc: 'Live win probability during rounds — tournament tracker feed', status: 'Beta' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="🌐" title="Lumio Data Integration" subtitle="Real OWGR data, SG benchmarks, and course history from the world's best golf analytics API." />
      {/* Status */}
      <div className={`rounded-xl p-5 border ${connected ? 'bg-teal-900/20 border-teal-600/40' : 'bg-gray-900/30 border-gray-700'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 ${connected ? 'border-teal-500 bg-teal-500/20' : 'border-gray-600 bg-gray-800'}`}>🌐</div>
            <div>
              <div className="text-white font-semibold">Lumio Data API</div>
              <div className="text-xs text-gray-400">PGA Tour ShotLink partnership · DP World, Korn Ferry, LIV, Asian Tour coverage</div>
            </div>
          </div>
          <button onClick={() => setConnected(!connected)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${connected ? 'bg-red-600/20 text-red-400 border border-red-600/30' : 'bg-green-600 text-white hover:bg-green-700'}`}>
            {connected ? 'Disconnect' : 'Connect Lumio Data'}
          </button>
        </div>
        {connected ? (
          <div className="grid grid-cols-4 gap-3">
            {[{ label: 'API Status', value: '✓ Connected' }, { label: 'OWGR Updated', value: 'Mon 06:00 GMT' }, { label: 'Tours Covered', value: '6 tours' }, { label: 'Events in DB', value: '2,800+' }].map((s, i) => (
              <div key={i} className="bg-black/20 rounded-lg p-3 text-center">
                <div className="text-white font-bold text-sm">{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400">Lumio Data is the most important single integration for Lumio Tour. It powers the live OWGR tracker, the 104-week points expiry calendar, course fit scores, and SG benchmarks with real competition data — not estimates.</div>
        )}
      </div>
      {/* Why this matters */}
      <div className="bg-[#0d0f1a] border border-green-600/30 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Why Lumio Data Is the Highest-Priority Integration</div>
        <div className="text-sm text-gray-300 leading-relaxed">Without Lumio Data, Lumio Tour's OWGR tracker relies on user-entered data. With it, every Monday morning the platform automatically pulls the updated ranking, calculates which historical points are now in their 13th week (no longer at full value), flags points entering the final quarter of their 104-week window, and updates the scenario model for the current week's event. The difference between "manually checked" and "automatically updated" is the difference between a tool and an operating system.</div>
      </div>
      {/* API endpoints */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800"><div className="text-sm font-semibold text-white">API Endpoints Used by Lumio Tour</div></div>
        <div className="divide-y divide-gray-800/50">
          {owgrEndpoints.map((e, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${e.status === 'Live' ? 'bg-teal-500' : 'bg-yellow-500'}`}></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{e.endpoint}</div>
                <div className="text-xs text-gray-500">{e.desc}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${e.status === 'Live' ? 'bg-teal-600/20 text-teal-400' : 'bg-yellow-600/20 text-yellow-400'}`}>{e.status}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Tour coverage */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800"><div className="text-sm font-semibold text-white">Tour Coverage — Lumio Data API</div></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-gray-500 border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Tour</th><th className="text-left p-3">Events</th><th className="text-left p-3">SG Data</th><th className="text-left p-3">OWGR</th><th className="text-left p-3">Course History</th><th className="text-left p-3">Odds</th>
            </tr></thead>
            <tbody>{coverage.map((c, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="p-3 text-white font-medium">{c.tour}</td>
                <td className="p-3 text-gray-400">{c.events}</td>
                {[c.sg, c.owgr, c.courseHistory, c.odds].map((v, j) => (
                  <td key={j} className={`p-3 ${v.startsWith('✓') ? 'text-teal-400' : v === 'N/A' || v === '—' ? 'text-gray-600' : 'text-yellow-400'}`}>{v}</td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
        <div className="text-xs font-semibold text-blue-400 mb-1">ℹ️ Pricing & Access</div>
        <div className="text-xs text-gray-400">Lumio Data offers a free tier for public data. The paid API tier (needed for SG categories, course history, and real-time data) starts at approximately $150–$500/month depending on call volume and data depth. For Lumio Tour, this is a backend cost — not charged to players — absorbed as product infrastructure.</div>
      </div>
      <GolfAISection context="strokes" player={player} session={session} />
    </div>
  );
}

// ─── TRACKMAN INTEGRATION VIEW ────────────────────────────────────────────────
function GolfLaunchMonitorLegacyView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const [connected, setConnected] = useState(false);
  const sessions = [
    { date: 'Jul 2 — Pre-tournament range (Eichenried)', club: '7-Iron', balls: 48, ballSpeed: 118, launchAngle: 17.2, spinRate: 7140, carry: 168, dispersion: '±8yd', smash: 1.34 },
    { date: 'Jun 25 — Short game (NTC London)', club: 'SW (54°)', balls: 60, ballSpeed: 76, launchAngle: 24.8, spinRate: 9800, carry: 84, dispersion: '±6yd', smash: 1.19 },
    { date: 'Jun 18 — Full bag fitting review', club: 'Driver', balls: 30, ballSpeed: 164, launchAngle: 10.4, spinRate: 2280, carry: 284, dispersion: '±18yd', smash: 1.48 },
  ];
  const insights = [
    { finding: '7-iron carry averages 168yd — 4yd less than assumed', impact: 'Corrects club selection at 170–175yd range. Directly linked to -0.28 SG:Approach.', action: 'Pete flagged: commit to 6-iron from 172yd. Note added to caddie book.' },
    { finding: 'Driver spin rate 2,280rpm — optimal for current ball speed', impact: 'Ball flight is efficient. No change needed. Carry consistent.', action: 'No action. Maintain current shaft and loft.' },
    { finding: 'SW face angle: 1.2° open at impact (most sessions)', impact: 'Causes slightly right ball flight on wedge approaches — explains occasional short-siding right.', action: 'Pete: grip check before next practice. Note in swing log.' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="🎯" title="Lumio Range Integration" subtitle="Import practice session data from Lumio Range into the practice log — bridging range work to on-course SG." />
      {/* Status */}
      <div className={`rounded-xl p-5 border ${connected ? 'bg-teal-900/20 border-teal-600/40' : 'bg-gray-900/30 border-gray-700'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 ${connected ? 'border-teal-500 bg-teal-500/20' : 'border-gray-600 bg-gray-800'}`}>🎯</div>
            <div>
              <div className="text-white font-semibold">Lumio Range 4 / Lumio Range iO</div>
              <div className="text-xs text-gray-400">Pete Larsen's unit · Serial: TM4-2847 · NTC London + on-site at events</div>
            </div>
          </div>
          <button onClick={() => setConnected(!connected)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${connected ? 'bg-red-600/20 text-red-400 border border-red-600/30' : 'bg-green-600 text-white hover:bg-green-700'}`}>
            {connected ? 'Disconnect' : 'Connect Lumio Range'}
          </button>
        </div>
        {connected ? (
          <div className="grid grid-cols-4 gap-3">
            {[{ label: 'Last Session', value: 'Jul 2, 2026' }, { label: 'Sessions Synced', value: '34' }, { label: 'Balls Tracked', value: '4,820' }, { label: 'Unit', value: 'TM4 (outdoor)' }].map((s, i) => (
              <div key={i} className="bg-black/20 rounded-lg p-3 text-center">
                <div className="text-white font-bold text-sm">{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400">Connect Pete's Lumio Range unit to automatically import every practice session. Ball speed, launch angle, spin rate, carry distance, and dispersion all flow into your Practice Log — and link to your on-course SG trends.</div>
        )}
      </div>
      {/* Why it matters */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">The Practice ↔ Competition Bridge</div>
        <div className="text-sm text-gray-300 leading-relaxed">Most touring professionals have excellent Lumio Range data from practice — and no way to connect it to their on-course performance. Pete knows your ball speed has dropped 2mph on 7-iron. He doesn't know whether that's causing the -0.28 SG:Approach on-course, or whether it's a different problem. Lumio Tour connects these: when your Lumio Range carry distance changes, the system flags whether it correlates with a shift in your competition SG:Approach. That's a genuine marginal gain.</div>
      </div>
      {/* Sessions */}
      {connected && (
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800"><div className="text-sm font-semibold text-white">Recent Lumio Range Sessions</div></div>
          <div className="divide-y divide-gray-800/50">
            {sessions.map((s, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-white">{s.date}</div>
                  <div className="text-xs text-gray-500">{s.balls} balls · {s.club}</div>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {[{ label: 'Ball Speed', val: `${s.ballSpeed}mph` }, { label: 'Launch Angle', val: `${s.launchAngle}°` }, { label: 'Spin Rate', val: `${s.spinRate}rpm` }, { label: 'Carry', val: `${s.carry}yd` }, { label: 'Dispersion', val: s.dispersion }].map((m, j) => (
                    <div key={j} className="bg-black/20 rounded p-2 text-center">
                      <div className="text-white font-bold text-sm">{m.val}</div>
                      <div className="text-xs text-gray-600">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Insights */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">📊 Lumio Range Insights — Pete's Flagged Findings</div>
        <div className="space-y-4">
          {insights.map((ins, i) => (
            <div key={i} className="p-4 bg-black/20 rounded-lg border border-gray-800">
              <div className="text-sm font-medium text-white mb-1">🔍 {ins.finding}</div>
              <div className="text-xs text-gray-400 mb-2">Impact: {ins.impact}</div>
              <div className="text-xs text-teal-400">→ {ins.action}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
        <div className="text-xs font-semibold text-blue-400 mb-1">ℹ️ Lumio Range API — Phase 2</div>
        <div className="text-xs text-gray-400">Lumio Range has a developer API for authorised integrations. Connection requires the coach or player to authorise Lumio Tour as a connected app within their Lumio Range Performance Studio account. Data shared: session metadata, club averages, ball flight parameters, and dispersion charts. No video data transferred. This is scoped as a Phase 2 integration.</div>
      </div>
      <GolfAISection context="practicelog" player={player} session={session} />
    </div>
  );
}

// ─── SHOTLINK VIEW ────────────────────────────────────────────────────────────
function ShotLinkView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const phases = [
    { phase: 'Phase 1 (Now)', label: 'DP World Tour — Lumio Range + Lumio Data', desc: 'Lumio Range sensors provide on-course shot data. Lumio Data API provides round-level SG benchmarks. No ShotLink required — DP World Tour doesn\'t use it.', status: 'active', icon: '✓' },
    { phase: 'Phase 2 (2027)', label: 'PGA Tour co-sanctions — Lumio Data SG', desc: 'Scottish Open, Halden Motors International, and other co-sanctioned events have PGA Tour fields. Lumio Data\'s PGA Tour ShotLink partnership covers these rounds at shot level.', status: 'planned', icon: '⚡' },
    { phase: 'Phase 3 (2027+)', label: 'PGA Tour Elite — Full ShotLink Integration', desc: 'Direct ShotLink partnership for PGA Tour Elite tier (£699/mo). Every shot tracked at every PGA Tour event. 256,000 data points per tournament week. Full hole strategy intelligence.', status: 'future', icon: '🔗' },
  ];
  const shotlinkData = [
    { metric: 'Shot location (x, y coordinates)', frequency: 'Every shot', accuracy: 'Sub-metre', notes: 'Powered by laser rangefinders + handheld operators at every PGA Tour event' },
    { metric: 'Ball speed at impact', frequency: 'Measured holes', accuracy: 'High', notes: 'Available where radar equipment deployed (not all holes)' },
    { metric: 'Carry distance by lie type', frequency: 'Fairway, rough, bunker', accuracy: 'High', notes: 'Allows SG:Approach breakdown by lie condition' },
    { metric: 'Putt location + length', frequency: 'Every putt', accuracy: 'High', notes: 'Powers SG:Putting from all distances and break directions' },
    { metric: 'Miss direction (left/right)', frequency: 'Every approach', accuracy: 'High', notes: 'Used for hole strategy: where misses cost most on each hole' },
    { metric: 'Historical hole mean scores', frequency: 'Per event, 5yr avg', accuracy: 'Exact', notes: 'Foundation of hole strategy intelligence in TourIQ and Lumio Data models' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="🔗" title="ShotLink Access (Phase 3)" subtitle="PGA Tour's proprietary shot-tracking system. Irrelevant for DP World Tour — essential for the PGA Tour Elite tier." />
      {/* Critical context box */}
      <div className="bg-[#0d0f1a] border border-green-600/30 rounded-xl p-5">
        <div className="text-sm font-semibold text-green-400 mb-2">The Most Important Context for DP World Tour</div>
        <div className="text-sm text-gray-300 leading-relaxed">ShotLink does not exist on the DP World Tour. It is a PGA Tour system. Every DP World Tour player (Lumio Tour's primary market) competes without ShotLink coverage at non-co-sanctioned events. This means TourIQ — which is ShotLink-dependent — simply doesn't work for these players. Lumio Tour uses Lumio Data (round-level SG) and Lumio Range (shot-level SG) as its data layer, which covers DP World Tour completely. ShotLink is only relevant when Lumio Tour expands to a PGA Tour Elite tier.</div>
      </div>
      {/* Phase roadmap */}
      <div className="space-y-3">
        {phases.map((p, i) => (
          <div key={i} className={`border rounded-xl p-5 ${p.status === 'active' ? 'bg-teal-900/20 border-teal-600/40' : p.status === 'planned' ? 'bg-blue-900/10 border-blue-600/30' : 'bg-gray-900/20 border-gray-700'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${p.status === 'active' ? 'bg-teal-600/30 text-teal-400' : p.status === 'planned' ? 'bg-blue-600/30 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>{p.icon}</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold">{p.phase}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-teal-600/20 text-teal-400' : p.status === 'planned' ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>{p.label}</span>
                </div>
                <div className="text-sm text-gray-400">{p.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* What ShotLink actually tracks */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800"><div className="text-sm font-semibold text-white">What ShotLink Captures — PGA Tour Data Layer</div></div>
        <div className="divide-y divide-gray-800/50">
          {shotlinkData.map((s, i) => (
            <div key={i} className="p-3 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1.5"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{s.metric}</div>
                <div className="text-xs text-gray-500">{s.notes}</div>
              </div>
              <div className="text-xs text-gray-600 text-right w-24">{s.frequency}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Partnership path */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Path to ShotLink Partnership</div>
        <div className="space-y-2">
          {[
            { step: '1', action: 'Establish Lumio Data API integration (Phase 1) — Lumio Data already has PGA Tour ShotLink access via existing partnership' },
            { step: '2', action: 'Build DP World Tour player base to 100+ (Phase 1–2) — credibility for PGA Tour conversations' },
            { step: '3', action: 'Approach PGA Tour Innovation team (Phase 2) — position as the career OS layer above ShotLink, not a competitor' },
            { step: '4', action: 'Formalise ShotLink data agreement at the Elite tier pricing level (£699/mo) — cost of ShotLink access built into tier margin' },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-gray-400">
              <span className="w-6 h-6 rounded-full bg-green-600/20 text-green-400 text-xs font-bold flex items-center justify-center flex-shrink-0">{s.step}</span>
              <span>{s.action}</span>
            </div>
          ))}
        </div>
      </div>
      <GolfAISection context="strokes" player={player} session={session} />
    </div>
  );
}

// ─── LPGA / LET MODE VIEW ─────────────────────────────────────────────────────
function LPGAView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const [activeTab, setActiveTab] = useState<'overview'|'rankings'|'schedule'|'roadmap'>('overview');
  const lpgaTours = [
    { tour: 'LPGA Tour', players: '~170 active', rankings: 'Meridian Women\'s World Golf Rankings (RWGR)', analytic: 'No dedicated analytics platform', platform: 'Nothing beyond LPGA.com portal' },
    { tour: 'Ladies European Tour (LET)', players: '~200 active', rankings: 'RWGR + LET Order of Merit', analytic: 'No analytics platform', platform: 'Nothing beyond LET portal' },
    { tour: 'LPGA Epson Tour (Dev)', players: '~120 active', rankings: 'RWGR', analytic: 'No analytics platform', platform: 'Spreadsheets and email' },
    { tour: 'Symetra Tour', players: 'Merged into Epson', rankings: 'Historical', analytic: 'No analytics platform', platform: 'Dissolved' },
  ];
  const rwgrSchedule = [
    { event: 'AIG Women\'s Open', cat: 'Major', venue: 'Lytham & St Annes', date: 'Aug 2026', rwgr: '100 pts (winner)', prize: '$10M' },
    { event: 'Chevron Championship', cat: 'Major', venue: 'The Club at Carlton Woods', date: 'Apr 2026', rwgr: '100 pts', prize: '$10M' },
    { event: 'US Women\'s Open', cat: 'Major', venue: 'Quaker Ridge GC', date: 'Jun 2026', rwgr: '100 pts', prize: '$12M' },
    { event: 'The Annika (Meridian Series)', cat: 'LPGA Meridian', venue: 'Pelican GC, Florida', date: 'Nov 2026', rwgr: '65 pts', prize: '$4M' },
    { event: 'Halden Motors Ladies Championship', cat: 'LET Meridian', venue: 'Seomjin River CC, Korea', date: 'Oct 2026', rwgr: '60 pts', prize: '$3.25M' },
  ];
  const arccosWomen = [
    { name: 'Emma Lindgren', flag: '🇸🇪', rank: '#1 RWGR', note: 'Full Lumio Range Pro analytics suite' },
    { name: 'Mia Harrington', flag: '🇳🇿', rank: 'Top 10 RWGR', note: 'SG tracking across LPGA season' },
    { name: 'Sofia Lindqvist', flag: '🇨🇦', rank: 'Top 15 RWGR', note: 'Lumio Range course strategy tools' },
    { name: 'Charlotte Ainsworth', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', rank: 'Top 40 RWGR', note: 'LET + LPGA Lumio Range user' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="🏆" title="LPGA / LET Mode" subtitle="The women's golf gap is total — no analytics platform, no career OS, nothing beyond the tour portal. Lumio Tour is first." />
      <div className="flex gap-2 flex-wrap">
        {(['overview','rankings','schedule','roadmap'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === t ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-[#0d0f1a] border border-gray-800 text-gray-400 hover:text-white'}`}>
            {t === 'overview' ? 'Market Overview' : t === 'rankings' ? 'RWGR System' : t === 'schedule' ? 'Schedule & Points' : 'Build Roadmap'}
          </button>
        ))}
      </div>
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-[#0d0f1a] border border-red-600/30 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-3">The Women's Golf Technology Gap — Total</div>
            <div className="text-sm text-gray-300 leading-relaxed">For women's professional golfers, the gap is not partial — it is total. There is no dedicated analytics platform for LPGA or LET players. No performance OS. No RWGR tracker. No sponsorship manager. No caddie workflow module. Nothing beyond the tour portal for entries and rankings. Lumio Range Pro Insights has 35+ women on tour getting on-course analytics — but nothing commercial. Lumio Tour would be the first technology platform ever built specifically for the women's professional golf career. The WTA gap in tennis is identical, and it's exactly Lumio Tour's strongest entry point in tennis. The same play is available in golf.</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
              <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
                <th className="text-left p-3">Tour</th><th className="text-left p-3">Players</th><th className="text-left p-3">Analytics</th><th className="text-left p-3">Career OS</th>
              </tr></thead>
              <tbody>{lpgaTours.map((t, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="p-3 text-white font-medium">{t.tour}</td>
                  <td className="p-3 text-gray-400 text-xs">{t.players}</td>
                  <td className="p-3 text-red-400 text-xs">{t.analytic}</td>
                  <td className="p-3 text-red-400 text-xs">{t.platform}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-4">Women Using Lumio Range Pro (Confirmation the Market Exists)</div>
            {arccosWomen.map((p, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800/50">
                <span className="text-xl">{p.flag}</span>
                <div className="flex-1"><div className="text-sm text-white">{p.name}</div><div className="text-xs text-gray-500">{p.rank}</div></div>
                <div className="text-xs text-gray-400">{p.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'rankings' && (
        <div className="space-y-4">
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-3">Meridian Women's World Golf Rankings (RWGR)</div>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span><span>Updated weekly (Monday). Same 104-week rolling average system as OWGR — identical calculation framework.</span></div>
              <div className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span><span>Points awarded based on field strength and finishing position. Major winners earn 100 points. LET wins earn proportionally less.</span></div>
              <div className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span><span>Top 50 RWGR qualify for LPGA Majors. Olympic qualification uses RWGR top 15 (max 4 per country).</span></div>
              <div className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span><span>Race to the CME Globe (LPGA) runs parallel — season-long points race ending at the CME Group Tour Championship in November.</span></div>
              <div className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span><span>LET Order of Merit runs separately — determines LET category for following season and Solheim Cup qualification.</span></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'How it differs from OWGR', val: 'Same 104-week rolling average formula. Different field strength multipliers for LPGA vs LET events.' },
              { label: 'Points decay', val: 'Identical 13-week full value then 91-week linear decay — 1/92 lost per week from week 14 to 104.' },
              { label: 'Minimum events', val: '35 minimum (vs 40 for OWGR). Maximum divisor 50 (vs 52 for OWGR).' },
              { label: 'Race to the CME Globe', val: 'Season-long LPGA points race. £1.5M winner\'s bonus at CME Group Championship to top-8 qualified.' },
            ].map((s, i) => (
              <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
                <div className="text-xs text-green-400 font-semibold mb-1">{s.label}</div>
                <div className="text-sm text-gray-300">{s.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800"><div className="text-sm font-semibold text-white">LPGA / LET Key Events 2026</div></div>
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
                <th className="text-left p-3">Event</th><th className="text-left p-3">Category</th><th className="text-left p-3">Date</th><th className="text-left p-3">RWGR Points</th><th className="text-left p-3">Prize Fund</th>
              </tr></thead>
              <tbody>{rwgrSchedule.map((e, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="p-3 text-white font-medium">{e.event}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${e.cat === 'Major' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-purple-600/20 text-purple-400'}`}>{e.cat}</span></td>
                  <td className="p-3 text-gray-400 text-xs">{e.date}</td>
                  <td className="p-3 text-teal-400 font-medium text-xs">{e.rwgr}</td>
                  <td className="p-3 text-gray-400 text-xs">{e.prize}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === 'roadmap' && (
        <div className="space-y-4">
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-4">What Adapting Lumio Tour for LPGA / LET Requires</div>
            <div className="space-y-3">
              {[
                { effort: 'Low', item: 'RWGR tracker replaces OWGR tracker', desc: 'Same rolling 104-week formula, different data source. Lumio Data API covers RWGR.' },
                { effort: 'Low', item: 'Race to the CME Globe replaces Race to Dubai', desc: 'Season-long points race. Identical UI — just different data feed.' },
                { effort: 'Low', item: 'LPGA / LET tournament calendar', desc: 'Replace DP World Tour schedule with LPGA / LET events. Lumio Data covers the full LPGA calendar.' },
                { effort: 'Med', item: 'Female player profile and team structure', desc: 'Same team roles but caddie dynamics differ slightly. Player card adapted.' },
                { effort: 'Med', item: 'Solheim Cup / Olympic qualification tracker', desc: 'Replaces Davis Cup / Ryder Cup module. Solheim Cup uses RWGR + LET Order of Merit.' },
                { effort: 'High', item: 'LPGA ShotLink equivalent data', desc: 'LPGA has introduced more advanced shot tracking but not at PGA Tour ShotLink level. Use Lumio Range + Lumio Data initially.' },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg">
                  <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 mt-0.5 ${s.effort === 'Low' ? 'bg-teal-600/20 text-teal-400' : s.effort === 'Med' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-orange-600/20 text-orange-400'}`}>{s.effort}</span>
                  <div><div className="text-sm font-medium text-white">{s.item}</div><div className="text-xs text-gray-400 mt-0.5">{s.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4">
            <div className="text-sm font-semibold text-green-400 mb-2">Route In</div>
            <div className="text-xs text-gray-400">The LPGA route in is via player agents (IMG, Hambric, Excel also manage women's players). Approaching Lumio Range directly — Edoardo Molinari already works with 35+ women — could fast-track access to the warmest leads. One well-known LPGA player on Lumio Tour is the equivalent of Erik Sandberg on the DP World Tour side.</div>
          </div>
        </div>
      )}
      <GolfAISection context="owgr" player={player} session={session} />
    </div>
  );
}

// ─── MOBILE APP VIEW ──────────────────────────────────────────────────────────
function MobileAppView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const features = [
    { section: 'OVERVIEW', items: ['Morning Briefing (voice playback)', 'Dashboard — today\'s schedule and alerts', 'Notification centre'] },
    { section: 'ON COURSE', items: ['Caddie Workflow — hole strategy + carry sheet', 'In-round stat logging (fairways, GIR, putts, sand saves)', 'Post-round debrief voice note', 'Lumio Wear recovery check-in'] },
    { section: 'PERFORMANCE', items: ['OWGR position and Race to Dubai standing', 'SG dashboard — last 5 rounds', 'Points expiry alert view', 'Lumio Range SG sync status'] },
    { section: 'COMMERCIAL', items: ['Sponsor obligation due today', 'Contract expiry alerts', 'Prize money + quick financial summary', 'Agent pipeline quick view'] },
    { section: 'TEAM', items: ['Team message feed (coach notes, physio log)', 'Practice session log (quick entry)', 'Recovery score and injury status', 'Stringer contact card (direct call)'] },
  ];
  const mobileFirst = [
    { why: 'Caddie needs carry sheet at first tee', solution: 'Caddie Workflow fully functional on mobile — loads offline if signal lost on course' },
    { why: 'Morning briefing plays before player leaves hotel', solution: 'Audio briefing auto-plays at set time. Player sees bullet summary on lock screen notification.' },
    { why: 'Physio logs treatment at 7am before range session', solution: 'Quick injury log entry — one screen, 30 seconds. Clearance status updates player view instantly.' },
    { why: 'Agent needs sponsor obligation reminder on event day', solution: 'Agent mobile view shows obligations due today. Deadline alerts push-notified 48h, 24h, and 2h before.' },
    { why: 'Player enters post-round SG on the drive back', solution: 'Quick round entry: score + SG categories in under 2 minutes. Voice-to-text for coach notes.' },
    { why: 'No reliable WiFi in caddie lounge at many venues', solution: 'Core data cached offline. Caddie yardage book, carry sheet, and hole strategy work without connectivity.' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="📲" title="Mobile App" subtitle="A hard launch requirement, not a roadmap item. Touring professionals travel 30+ weeks per year." />
      {/* Critical context */}
      <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-5">
        <div className="text-sm font-semibold text-red-400 mb-2">🚨 Non-Negotiable Launch Requirement</div>
        <div className="text-sm text-gray-300 leading-relaxed">The caddie needs hole strategy notes on their phone at the first tee at 9:42am Thursday. The player needs the morning briefing before they step into the car. The physio needs to log treatment at 7am on the physio table. None of this happens on a desktop. Lumio Tour must be fully functional on iOS and Android from day one — not a stripped-down version, not "coming soon", not a mobile-optimised web view without offline support. Full feature parity with offline capability is the bar.</div>
      </div>
      {/* Feature parity matrix */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Mobile Feature Scope — Day One</div>
        <div className="space-y-4">
          {features.map((sec, i) => (
            <div key={i}>
              <div className="text-xs text-green-400 font-semibold uppercase tracking-wider mb-2">{sec.section}</div>
              <div className="space-y-1">
                {sec.items.map((item, j) => (
                  <div key={j} className="flex items-center gap-2 text-sm text-gray-300">
                    <div className="w-4 h-4 rounded flex items-center justify-center bg-teal-600/20 flex-shrink-0">
                      <span className="text-teal-400 text-xs">✓</span>
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
              <div className="text-xs text-teal-400">→ {m.solution}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Tech approach */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Recommended Technical Approach</div>
        <div className="space-y-2">
          {[
            { opt: 'Progressive Web App (Phase 1)', pros: 'Zero new codebase. Installable from browser. Service workers enable offline caching of caddie yardage book + morning briefing audio. Fastest path to validating sport-specific traction.', cons: 'iOS PWA push notifications limited pre-16.4. No App Store listing. No native sensor APIs (Bluetooth pairing for Lumio Range / launch monitors).' },
            { opt: 'Capacitor.js Wrap (Phase 2)', pros: 'Wraps the existing Next.js PWA in a native iOS + Android shell. Full App Store / Play Store distribution. Native push, Bluetooth, background sync. Single codebase still.', cons: 'Some performance trade-off vs fully native. Native plugin work needed for advanced sensor flows.' },
            { opt: 'React Native or Native (Phase 3)', pros: 'Best performance + deepest hardware integration. Justified once a sport hits sustained pro adoption.', cons: 'Separate codebase from web portal. Significantly more dev/maintenance cost.' },
          ].map((o, i) => (
            <div key={i} className="p-3 bg-black/20 rounded-lg">
              <div className="text-sm font-medium text-white mb-1">{o.opt}</div>
              <div className="text-xs text-teal-400 mb-0.5">✓ {o.pros}</div>
              <div className="text-xs text-red-400">✗ {o.cons}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-500">Recommendation: PWA for Phase 1 demo + early access. Capacitor wrap for Phase 2 when App Store presence and sensor integration matter. Reserve full native for the sport with the strongest pro adoption signal.</div>
      </div>
      {/* Download placeholder */}
      <div className="bg-[#0d0f1a] border border-green-600/30 rounded-xl p-6 flex flex-col items-center text-center">
        <div className="text-4xl mb-3">📲</div>
        <div className="text-white font-semibold mb-1">Lumio Tour — Mobile App</div>
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
        <div className="mt-4 text-xs text-gray-600">Register your interest at lumiotour.com — early access for pilot players from Month 5</div>
      </div>
      <GolfAISection context="default" player={player} session={session} />
    </div>
  );
}

type PitchResponse = {
  subject: string;
  opening: string;
  fit: string;
  deliverables: string;
  closing: string;
};

type PipelineCard = { brand: string; category: string; value: string; next: string };
type PipelineColumn = { key: string; title: string; cards: PipelineCard[] };

const PIPELINE: PipelineColumn[] = [
  { key: 'prospect', title: 'Prospect', cards: [
    { brand: 'Ridgeline Optics', category: 'Eyewear', value: '£35k/yr', next: 'Intro email — draft ready' },
  ]},
  { key: 'discussion', title: 'In Discussion', cards: [
    { brand: 'Hublot', category: 'Watch', value: '£180k/yr', next: 'Follow-up call Thu 15:00' },
  ]},
  { key: 'offer', title: 'Offer Made', cards: [
    { brand: 'Bentley', category: 'Vehicle', value: '£95k/yr + car', next: 'Awaiting counter-offer' },
  ]},
  { key: 'agreed', title: 'Agreed', cards: [
    { brand: 'Mizuno', category: 'Equipment', value: '£22k/yr', next: 'Contract signing Monday' },
  ]},
];

// ─── INTEGRATIONS HUB ────────────────────────────────────────────────────────
function GolfIntegrationsHub({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const entries: HubEntry[] = [
    { id: 'datagolf',  icon: '🌐', label: 'Lumio Data',             category: 'Data Feeds',       kind: 'custom',  render: () => <GolfDataFeedLegacyView player={player} session={session} /> },
    { id: 'lpga',      icon: '🏆', label: 'LPGA / LET Mode',      category: 'Data Feeds',       kind: 'custom',  render: () => <LPGAView player={player} session={session} /> },
    { id: 'shotlink',  icon: '🔗', label: 'ShotLink',             category: 'Data Feeds',       kind: 'custom',  render: () => <ShotLinkView player={player} session={session} /> },
    { id: 'arccos',    icon: '📡', label: 'Lumio Range',               category: 'Hardware Sensors', kind: 'custom',  render: () => <GolfShotTrackingLegacyView player={player} session={session} /> },
    { id: 'trackman',  icon: '🎯', label: 'Lumio Range',             category: 'Hardware Sensors', kind: 'custom',  render: () => <GolfLaunchMonitorLegacyView player={player} session={session} /> },
    { id: 'v1golf',    icon: '🎥', label: 'V1 Golf Video',        category: 'Hardware Sensors', kind: 'generic', config: GOLF_INTEGRATIONS.v1golf },
    { id: 'whoop',     icon: '💚', label: 'Lumio Wear / Oura',         category: 'Wearables',        kind: 'generic', config: GOLF_INTEGRATIONS.whoop },
    { id: 'catapult',  icon: '🛰️', label: 'Lumio GPS / Lumio GPS', category: 'Wearables',        kind: 'generic', config: GOLF_INTEGRATIONS.catapult },
    { id: 'workspace', icon: '📧', label: 'Gmail + Calendar',     category: 'Team Tools',       kind: 'generic', config: GOLF_INTEGRATIONS.workspace },
    { id: 'slack',     icon: '💬', label: 'Slack',                category: 'Team Tools',       kind: 'generic', config: GOLF_INTEGRATIONS.slack },
    { id: 'broadcast', icon: '📺', label: 'Meridian Sports',      category: 'Distribution',     kind: 'generic', config: GOLF_INTEGRATIONS.broadcast },
    { id: 'mobileapp', icon: '📲', label: 'Mobile App',           category: 'Distribution',     kind: 'custom',  render: () => <MobileAppView player={player} session={session} /> },
  ]
  return <IntegrationsHub entries={entries} accent="var(--brand-primary, #16a34a)" />
}

function AgentPipelineView({ player, session }: { player: GolfPlayer; session: SportsDemoSession }) {
  const [tab, setTab] = useState<'pipeline' | 'pitch'>('pipeline');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Clubs');
  const [value, setValue] = useState('');
  const [brandWants, setBrandWants] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pitch, setPitch] = useState<PitchResponse | null>(null);
  const [copied, setCopied] = useState(false);

  async function generatePitch() {
    setLoading(true);
    setError(null);
    try {
      const userPrompt = `Write a sponsorship pitch for ${brand} (${category}) for James Halton. Proposed value: ${value}. Brand wants: ${brandWants}. Player profile: OWGR #87 (career high #61, targeting top 50), Race to Dubai #43, English, 29 years old, DP World Tour. Prize money 2026: £367k. Current sponsors: Vanta Sports (clubs), Vanta Sports (wedges/ball), Meridian Watches (watch), Halden Motors (vehicle), Apex Performance (apparel). Social following: growing European tour presence. Notes: ${notes}. Generate: (1) subject line, (2) opening paragraph, (3) why James is a great fit, (4) proposed deliverables aligned with their ask, (5) closing line. Respond ONLY in JSON: { "subject": "...", "opening": "...", "fit": "...", "deliverables": "...", "closing": "..." }`;
      const res = await fetch('/api/ai/golf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: 'You are Sarah Mitchell, ISM sports agent, writing a sponsorship pitch on behalf of your client. Write in professional but warm agent voice. Be specific with stats.',
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const text: string = data?.content?.[0]?.text || '';
      const s = text.indexOf('{');
      const e = text.lastIndexOf('}');
      if (s === -1 || e === -1) throw new Error('No JSON in response');
      const parsed = JSON.parse(text.slice(s, e + 1)) as PitchResponse;
      setPitch(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate pitch');
    } finally {
      setLoading(false);
    }
  }

  function copyEmail() {
    if (!pitch) return;
    const body = `Subject: ${pitch.subject}\n\n${pitch.opening}\n\n${pitch.fit}\n\n${pitch.deliverables}\n\n${pitch.closing}\n\n— Sarah Mitchell\nISM Sports Management`;
    navigator.clipboard.writeText(body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const inp = 'w-full bg-[#0d0f1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-green-600';
  const lbl = 'block text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1';

  return (
    <div className="space-y-6">
      <SectionHeader icon="📬" title="Agent Pipeline" subtitle="Deal pipeline and AI-generated sponsorship pitches." />
      <div className="flex gap-2 border-b border-gray-800">
        {(['pipeline', 'pitch'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'text-green-300 border-green-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
            {t === 'pipeline' ? 'Deal Pipeline' : 'Pitch Generator'}
          </button>
        ))}
      </div>

      {tab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {PIPELINE.map(col => (
            <div key={col.key} className="space-y-2">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{col.title}</div>
              {col.cards.map((c, i) => (
                <div key={i} className="bg-gray-900/40 border border-gray-800 rounded-lg p-3">
                  <div className="text-sm font-semibold text-white">{c.brand}</div>
                  <div className="text-[10px] text-gray-500">{c.category}</div>
                  <div className="text-xs text-green-400 font-medium mt-1">{c.value}</div>
                  <div className="text-[10px] text-gray-500 border-t border-gray-800 pt-2 mt-2">{c.next}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === 'pitch' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Pitch Brief</h3>
            <div>
              <label className={lbl}>Brand</label>
              <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Ridgeline Optics" className={inp} />
            </div>
            <div>
              <label className={lbl}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={inp}>
                {['Clubs','Apparel','Watch','Vehicle','Equipment','Nutrition','Finance','Other'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Proposed annual value</label>
              <input value={value} onChange={e => setValue(e.target.value)} placeholder="£35k/yr" className={inp} />
            </div>
            <div>
              <label className={lbl}>What they want</label>
              <textarea value={brandWants} onChange={e => setBrandWants(e.target.value)} rows={3} className={inp} />
            </div>
            <div>
              <label className={lbl}>Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={inp} />
            </div>
            <button onClick={generatePitch} disabled={!brand.trim() || loading}
              className="w-full bg-green-600/20 border border-green-500/40 text-green-300 text-sm font-semibold py-2.5 rounded hover:bg-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? 'Generating…' : 'Generate Pitch'}
            </button>
            {error && <div className="text-red-400 text-xs">⚠️ {error}</div>}
          </div>

          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
            {pitch ? (
              <div>
                <div className="flex items-center justify-between bg-gray-900/50 border-b border-gray-800 px-4 py-2">
                  <div className="text-[11px] text-gray-400">📧 From: Sarah Mitchell · ISM Sports Management</div>
                  <button onClick={copyEmail} className="text-[11px] text-green-300 hover:text-green-200">
                    {copied ? '✓ Copied!' : 'Copy as email'}
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  <div className="border-b border-gray-800 pb-2">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Subject</div>
                    <div className="text-sm font-semibold text-white">{pitch.subject}</div>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{pitch.opening}</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{pitch.fit}</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{pitch.deliverables}</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{pitch.closing}</p>
                  <div className="text-xs text-gray-500 pt-3 border-t border-gray-800">— Sarah Mitchell / ISM Sports Management</div>
                </div>
              </div>
            ) : (
              <div className="p-5 text-gray-500 text-sm italic">Fill in the brief and hit Generate Pitch.</div>
            )}
          </div>
        </div>
      )}
      <GolfAISection context="sponsorship" player={player} session={session} />
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
// ─── GOLF ROLES ───────────────────────────────────────────────────────────────
const GOLF_ROLES = [
  { id: 'player',  label: 'Player',          icon: '⛳', description: 'Full access — your complete golf OS' },
  { id: 'agent',   label: 'Agent / Manager', icon: '💼', description: 'Commercial, schedule and financial view' },
  { id: 'coach',   label: 'Coach',           icon: '📋', description: 'Performance, swing and course strategy' },
  { id: 'caddie',  label: 'Caddie',          icon: '🏌️', description: 'Course notes, yardages and round prep' },
  { id: 'sponsor', label: 'Sponsor / Partner', icon: '🤝', description: 'Brand presence, obligations and ROI' },
]

// ─── ROLE CONFIG ─────────────────────────────────────────────────────────────
const GOLF_ROLE_CONFIG: Record<string, { label: string; icon: string; accent: string; sidebar: 'all' | string[]; hiddenTabs: string[]; roundupChannels: 'all' | string[]; message: string | null }> = {
  player: { label: 'Player', icon: '⛳', accent: '#15803D', sidebar: 'all', hiddenTabs: [], roundupChannels: 'all', message: null },
  agent: { label: 'Agent / Manager', icon: '💼', accent: '#F59E0B', sidebar: ['dashboard','morning','sponsorship','financial','agent','travel','schedule','media','settings'], hiddenTabs: ['team','dailytasks'], roundupChannels: ['agent','tournament','sponsor','prize','travel'], message: 'Commercial and schedule view.' },
  coach: { label: 'Coach', icon: '📋', accent: '#22C55E', sidebar: ['dashboard','morning','owgr','schedule','strokes','coursefit','practicelog','video','team','physio','mental','settings'], hiddenTabs: ['quickwins','dontmiss'], roundupChannels: ['coach','tournament','physio'], message: 'Performance and strategy view.' },
  caddie: { label: 'Caddie', icon: '🏌️', accent: '#0ea5e9', sidebar: ['dashboard','morning','caddie','coursefit','matchprep','schedule','equipment','settings'], hiddenTabs: ['quickwins','dontmiss','team'], roundupChannels: ['caddie','coach'], message: 'Course notes and round prep view.' },
  sponsor: { label: 'Sponsor / Partner', icon: '🤝', accent: '#F59E0B', sidebar: ['dashboard','sponsorship','media','settings'], hiddenTabs: ['quickwins','dailytasks','dontmiss','team'], roundupChannels: ['sponsor'], message: null },
}

// ─── MODAL HELPERS ───────────────────────────────────────────────────────────
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
              style={{ backgroundColor: i < current ? '#22C55E' : i === current ? '#15803D' : 'rgba(255,255,255,0.05)', color: i <= current ? '#fff' : '#4B5563' }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className="text-xs font-semibold" style={{ color: i === current ? '#15803D' : i < current ? '#22C55E' : '#4B5563' }}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className="flex-1 h-px" style={{ backgroundColor: i < current ? '#22C55E' : '#1F2937' }} />}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── GOLF MODAL COMPONENTS ───────────────────────────────────────────────────
function GolfFlightFinder({ onClose, session, player }: { onClose: () => void; session: SportsDemoSession; player: GolfPlayer }) {
  const [step, setStep] = useState<'configure'|'searching'|'results'|'book'>('configure')
  const [from, setFrom] = useState('London Heathrow (LHR)')
  const [to, setTo] = useState('Munich (MUC) — Halden Motors International')
  const [depart, setDepart] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [cabinClass, setCabinClass] = useState('Business')
  const [passengers, setPassengers] = useState(2)
  const [results, setResults] = useState<Array<{airline:string;flightNo:string;departs:string;arrives:string;duration:string;stops:string;price:number;currency:string;score:number;badge?:string}>>([])
  const [selectedFlight, setSelectedFlight] = useState<typeof results[0] | null>(null)

  const UPCOMING = [
    { label: 'Halden Motors International — 3 Jul', to: 'Munich (MUC)', date: '2026-07-02' },
    { label: 'Scottish Open — 10 Jul', to: 'Edinburgh (EDI)', date: '2026-07-09' },
    { label: 'The Open — 17 Jul', to: 'Liverpool (LPL)', date: '2026-07-16' },
    { label: 'British Masters — 28 Aug', to: 'Birmingham (BHX)', date: '2026-08-27' },
    { label: 'Halden Motors Championship — 17 Sep', to: 'London Heathrow (LHR)', date: '2026-09-16' },
  ]

  const FALLBACK_RESULTS = [
    { airline:'British Airways', flightNo:'BA960', departs:'07:20', arrives:'10:35', duration:'2h15m', stops:'Direct', price:312, currency:'GBP', score:96, badge:'Best value' },
    { airline:'easyJet', flightNo:'EZY7832', departs:'06:05', arrives:'09:20', duration:'2h15m', stops:'Direct', price:187, currency:'GBP', score:88, badge:'Cheapest' },
    { airline:'Lufthansa', flightNo:'LH2487', departs:'09:45', arrives:'12:50', duration:'2h05m', stops:'Direct', price:298, currency:'GBP', score:92, badge:'Fastest' },
    { airline:'Eurowings', flightNo:'EW9803', departs:'11:30', arrives:'14:45', duration:'2h15m', stops:'Direct', price:224, currency:'GBP', score:85 },
  ]

  const searchFlights = async () => {
    setStep('searching')
    try {
      const res = await fetch('/api/ai/golf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          messages: [{ role: 'user', content: `Find 4 ${cabinClass} class flights from ${from} to ${to} departing ${depart || 'next week'} for ${passengers} passengers. Return ONLY a JSON array: [{"airline":"","flightNo":"","departs":"","arrives":"","duration":"","stops":"","price":0,"currency":"GBP","score":0,"badge":""}]. Score 0-100 for value. Badge: "Best value", "Cheapest", "Fastest", or null. Realistic prices.` }]
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
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: '#6B7280' }}>Upcoming tournaments</label>
              <div className="flex flex-wrap gap-2">
                {UPCOMING.map(t => (
                  <button key={t.label} onClick={() => { setTo(t.to); setDepart(t.date) }}
                    className="text-xs px-3 py-1.5 rounded-full transition-all"
                    style={{ backgroundColor: to === t.to ? 'rgba(21,128,61,0.2)' : 'rgba(255,255,255,0.05)', border: to === t.to ? '1px solid #15803D' : '1px solid #1F2937', color: to === t.to ? '#15803D' : '#9CA3AF' }}>
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
            <button onClick={searchFlights} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>Search Flights →</button>
          </div>
        )}
        {step === 'searching' && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4 animate-bounce">✈️</div>
            <div className="text-base font-bold text-white mb-2">Searching all airlines...</div>
            <div className="text-xs mb-6" style={{ color: '#6B7280' }}>Checking BA, easyJet, Lufthansa, Ryanair + more</div>
          </div>
        )}
        {step === 'results' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2"><div className="text-sm font-bold text-white">{results.length} flights found</div><div className="text-xs" style={{ color: '#6B7280' }}>{from} → {to} · {cabinClass} · {passengers} pax</div></div>
            {results.map((f, i) => (
              <div key={i} onClick={() => setSelectedFlight(f)} className="rounded-xl p-4 cursor-pointer transition-all"
                style={{ backgroundColor: selectedFlight?.flightNo === f.flightNo ? 'rgba(21,128,61,0.1)' : '#111318', border: selectedFlight?.flightNo === f.flightNo ? '1px solid #15803D' : '1px solid #1F2937' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{f.airline}</span>
                      <span className="text-xs" style={{ color: '#4B5563' }}>{f.flightNo}</span>
                      {f.badge && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: f.badge === 'Best value' ? '#15803D' : f.badge === 'Cheapest' ? '#22C55E' : '#8B5CF6' }}>{f.badge}</span>}
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
              <button onClick={() => selectedFlight && setStep('book')} disabled={!selectedFlight} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: selectedFlight ? '#15803D' : '#374151' }}>Book selected →</button>
            </div>
          </div>
        )}
        {step === 'book' && selectedFlight && (
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(21,128,61,0.08)', border: '1px solid rgba(21,128,61,0.2)' }}>
              <div className="text-sm font-bold text-white mb-2">Booking summary</div>
              <div className="space-y-1 text-xs" style={{ color: '#9CA3AF' }}>
                {[['Route',`${from} → ${to}`],['Flight',`${selectedFlight.airline} ${selectedFlight.flightNo}`],['Departs',`${depart} at ${selectedFlight.departs}`],['Class',cabinClass],['Passengers',String(passengers)],['Total',`${selectedFlight.currency} ${(selectedFlight.price*passengers).toLocaleString()}`]].map(([l,v]) => (
                  <div key={l} className="flex justify-between"><span>{l}</span><span className="text-white">{v}</span></div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('results')} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Back</button>
              <button onClick={() => { const s = encodeURIComponent(`Flight booking — ${from} to ${to}`); const b = encodeURIComponent(`Please book: ${selectedFlight.airline} ${selectedFlight.flightNo}, ${depart}, ${cabinClass}, ${passengers} pax, ${selectedFlight.currency} ${(selectedFlight.price*passengers).toLocaleString()}\n\nThanks, ${session.userName || 'James'}`); window.open(`mailto:sarah.mitchell@ism.com?subject=${s}&body=${b}`) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>📧 Send to agent →</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function GolfMatchPrepAI({ onClose, session, player }: { onClose: () => void; session: SportsDemoSession; player: GolfPlayer }) {
  const [course, setCourse] = useState('Golfclub München Eichenried')
  const [round, setRound] = useState('R1')
  const [conditions, setConditions] = useState('22°C, 8mph W, Soft greens')
  const [loading, setLoading] = useState(false)
  const [brief, setBrief] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/golf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          messages: [{ role: 'user', content: `You are a tour caddie and performance analyst. Generate a round prep brief for ${session.userName || player.name} (OWGR #${player.owgr}, SG Putting -1.18, SG OTT +0.41) playing ${round} at ${course}. Conditions: ${conditions}. Cover: COURSE OVERVIEW, KEY HOLES (3-4 specific), SCORING STRATEGY, WEATHER ADJUSTMENTS, PUTTING FOCUS, MENTAL NOTE. Use emoji headers. Max 400 words.` }]
        })
      })
      const data = await res.json()
      setBrief(data.content?.[0]?.text || 'Unable to generate brief.')
    } catch { setBrief('Unable to generate brief.') }
    setLoading(false)
  }

  return (
    <>
      <ModalHeader icon="🎯" title="Round Prep AI" subtitle="AI tactical brief for your next round" onClose={onClose} />
      <div className="p-6 space-y-4">
        {!brief && !loading && (<>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Course</label><input value={course} onChange={e => setCourse(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Round</label><select value={round} onChange={e => setRound(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}>{['R1','R2','R3','R4'].map(r => <option key={r}>{r}</option>)}</select></div>
          </div>
          <div><label className="text-xs text-gray-500 mb-1 block">Conditions</label><input value={conditions} onChange={e => setConditions(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <button onClick={generate} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>Generate Round Prep →</button>
        </>)}
        {loading && (<div className="text-center py-10"><div className="text-4xl mb-3 animate-pulse">🎯</div><div className="text-sm font-bold text-white">Generating round prep...</div></div>)}
        {brief && (<>
          <div className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB', maxHeight: 350, overflowY: 'auto' }}>{brief}</div>
          <div className="flex gap-3">
            <button onClick={() => setBrief(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Regenerate</button>
            <button onClick={() => navigator.clipboard.writeText(brief)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: '#374151', color: '#9CA3AF' }}>📋 Copy</button>
          </div>
        </>)}
      </div>
    </>
  )
}

function GolfSponsorPost({ onClose, session, player }: { onClose: () => void; session: SportsDemoSession; player: GolfPlayer }) {
  const [sponsor, setSponsor] = useState('Vanta Sports')
  const [postType, setPostType] = useState('Tournament arrival')
  const [platform, setPlatform] = useState('Instagram')
  const [scorePos, setScorePos] = useState('')
  const [loading, setLoading] = useState(false)
  const [post, setPost] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/golf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 500,
          messages: [{ role: 'user', content: `Generate a social media post for James Halton (#87 OWGR, DP World Tour, English) for ${sponsor} on ${platform}. Type: ${postType}. Currently at Halden Motors International Open${scorePos ? `, ${scorePos}` : ''}. Tone: professional golfer, authentic, not corporate. Include relevant hashtags and golf emoji. Max 200 words.` }]
        })
      })
      const data = await res.json()
      setPost(data.content?.[0]?.text || 'Unable to generate post.')
    } catch { setPost('Unable to generate post.') }
    setLoading(false)
  }

  return (
    <>
      <ModalHeader icon="🤝" title="Sponsor Content Generator" subtitle="AI writes authentic sponsor content" onClose={onClose} />
      <div className="p-6 space-y-4">
        {!post && !loading && (<>
          <div><label className="text-xs text-gray-500 mb-2 block">Sponsor</label>
            <div className="flex flex-wrap gap-2">{['Vanta Sports','Meridian Watches','Other'].map(s => (
              <button key={s} onClick={() => setSponsor(s)} className="text-xs px-3 py-1.5 rounded-full transition-all" style={{ backgroundColor: sponsor === s ? 'rgba(21,128,61,0.2)' : 'rgba(255,255,255,0.05)', border: sponsor === s ? '1px solid #15803D' : '1px solid #1F2937', color: sponsor === s ? '#15803D' : '#9CA3AF' }}>{s}</button>
            ))}</div>
          </div>
          <div><label className="text-xs text-gray-500 mb-2 block">Post type</label>
            <div className="flex flex-wrap gap-2">{['Tournament arrival','Post-round','Sponsor product feature','Course photo','Leaderboard update'].map(t => (
              <button key={t} onClick={() => setPostType(t)} className="text-xs px-3 py-1.5 rounded-full transition-all" style={{ backgroundColor: postType === t ? 'rgba(21,128,61,0.2)' : 'rgba(255,255,255,0.05)', border: postType === t ? '1px solid #15803D' : '1px solid #1F2937', color: postType === t ? '#15803D' : '#9CA3AF' }}>{t}</button>
            ))}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Platform</label><select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}><option>Instagram</option><option>Twitter/X</option><option>TikTok</option></select></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Score/position (optional)</label><input value={scorePos} onChange={e => setScorePos(e.target.value)} placeholder="T8, -4" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          </div>
          <button onClick={generate} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>Generate →</button>
        </>)}
        {loading && (<div className="text-center py-10"><div className="text-4xl mb-3 animate-pulse">📱</div><div className="text-sm font-bold text-white">Generating post...</div></div>)}
        {post && (<>
          <div className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB' }}>{post}</div>
          <div className="flex gap-3">
            <button onClick={() => setPost(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Regenerate</button>
            <button onClick={() => navigator.clipboard.writeText(post)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>📋 Copy post</button>
          </div>
        </>)}
      </div>
    </>
  )
}

function GolfRankingSimulator({ onClose, player }: { onClose: () => void; player: GolfPlayer }) {
  const [result, setResult] = useState('Win')
  const [event, setEvent] = useState('Halden Motors International Open')
  const [loading, setLoading] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const scenarios: Record<string, { owgr: number; change: string; r2d: number; r2dPts: number; prize: string }> = {
    'Win':     { owgr: 71, change: '+16', r2d: 28, r2dPts: 2575, prize: '£1,320,000' },
    'Top 5':   { owgr: 79, change: '+8',  r2d: 35, r2dPts: 1840, prize: '£380,000' },
    'Top 10':  { owgr: 83, change: '+4',  r2d: 39, r2dPts: 1540, prize: '£142,000' },
    'Top 20':  { owgr: 86, change: '+1',  r2d: 42, r2dPts: 1340, prize: '£62,000' },
    'Miss Cut': { owgr: 92, change: '-5', r2d: 47, r2dPts: 1240, prize: '£0' },
  }
  const sc = scenarios[result] || scenarios['Win']

  const simulate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/golf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 600,
          messages: [{ role: 'user', content: `Simulate the OWGR and Race to Dubai ranking impact for James Halton (OWGR #${player.owgr}, Race to Dubai #${player.race_to_dubai_pos} with ${player.race_to_dubai_points}pts) if he ${result} at the ${event} (DP World Tour event). Explain: new projected OWGR, new Race to Dubai position and points, prize money earned, impact on season target (£450k), Ryder Cup points implications if relevant. Max 200 words. Be specific with numbers.` }]
        })
      })
      const data = await res.json()
      setAiAnalysis(data.content?.[0]?.text || null)
    } catch { /* fallback to static */ }
    setLoading(false)
  }

  return (
    <>
      <ModalHeader icon="📊" title="OWGR & Race to Dubai Simulator" subtitle="What-if ranking calculator with AI analysis" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="text-xs"><span className="text-gray-500">Current:</span> <span className="text-white font-bold">OWGR #{player.owgr}</span> · <span className="text-white font-bold">Race to Dubai #{player.race_to_dubai_pos}</span> <span className="text-gray-500">({player.race_to_dubai_points} pts)</span></div>
        </div>
        <div><label className="text-xs text-gray-500 mb-1 block">Event</label><input value={event} onChange={e => setEvent(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
        <div><label className="text-xs text-gray-500 mb-2 block">Scenario</label>
          <div className="flex flex-wrap gap-2">{Object.keys(scenarios).map(r => (
            <button key={r} onClick={() => { setResult(r); setAiAnalysis(null) }} className="text-xs px-3 py-1.5 rounded-full transition-all" style={{ backgroundColor: result === r ? 'rgba(21,128,61,0.2)' : 'rgba(255,255,255,0.05)', border: result === r ? '1px solid #15803D' : '1px solid #1F2937', color: result === r ? '#15803D' : '#9CA3AF' }}>{r}</button>
          ))}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="text-xs text-gray-500 mb-1">Projected OWGR</div>
            <div className="text-3xl font-black text-white">#{sc.owgr}</div>
            <div className="text-xs font-bold mt-1" style={{ color: sc.change.startsWith('+') ? '#22C55E' : '#EF4444' }}>{sc.change} places</div>
          </div>
          <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="text-xs text-gray-500 mb-1">Race to Dubai</div>
            <div className="text-3xl font-black text-white">#{sc.r2d}</div>
            <div className="text-xs font-bold mt-1" style={{ color: '#0ea5e9' }}>{sc.r2dPts.toLocaleString()} pts</div>
          </div>
        </div>
        <div className="text-xs text-center" style={{ color: '#6B7280' }}>Prize money: <span className="text-white font-bold">{sc.prize}</span></div>
        {!aiAnalysis && <button onClick={simulate} disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>{loading ? '⏳ Simulating...' : 'Simulate with AI →'}</button>}
        {aiAnalysis && (
          <div className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid rgba(21,128,61,0.3)', color: '#D1D5DB' }}>{aiAnalysis}</div>
        )}
      </div>
    </>
  )
}

function GolfInjuryLogger({ onClose, session }: { onClose: () => void; session: SportsDemoSession }) {
  const [area, setArea] = useState('Lower Back')
  const [painLevel, setPainLevel] = useState(3)
  const [type, setType] = useState('Stiffness')
  const [affectsSwing, setAffectsSwing] = useState('Slightly')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  return (
    <>
      <ModalHeader icon="💊" title="Injury & Medical Log" subtitle="Log and auto-notify your physio" onClose={onClose} />
      <div className="p-6 space-y-4">
        {!submitted ? (<>
          <div><label className="text-xs text-gray-500 mb-2 block">Area</label><div className="flex flex-wrap gap-2">{['Lower Back','Left Wrist','Right Wrist','Left Elbow','Right Elbow','Shoulder','Hip','Knee'].map(a => (<button key={a} onClick={() => setArea(a)} className="text-xs px-3 py-1.5 rounded-full transition-all" style={{ backgroundColor: area === a ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)', border: area === a ? '1px solid #EF4444' : '1px solid #1F2937', color: area === a ? '#EF4444' : '#9CA3AF' }}>{a}</button>))}</div></div>
          <div><label className="text-xs text-gray-500 mb-2 block">Pain level ({painLevel}/10)</label><input type="range" min="1" max="10" value={painLevel} onChange={e => setPainLevel(parseInt(e.target.value))} className="w-full" /><div className="flex justify-between text-[10px] text-gray-600"><span>Mild</span><span>Severe</span></div></div>
          <div><label className="text-xs text-gray-500 mb-2 block">Type</label><div className="flex flex-wrap gap-2">{['Stiffness','Soreness','Strain','Sharp pain','Swelling'].map(t => (<button key={t} onClick={() => setType(t)} className="text-xs px-3 py-1.5 rounded-full transition-all" style={{ backgroundColor: type === t ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)', border: type === t ? '1px solid #EF4444' : '1px solid #1F2937', color: type === t ? '#EF4444' : '#9CA3AF' }}>{t}</button>))}</div></div>
          <div><label className="text-xs text-gray-500 mb-2 block">Affecting swing?</label><div className="flex gap-2">{['Yes','No','Slightly'].map(s => (<button key={s} onClick={() => setAffectsSwing(s)} className="text-xs px-3 py-1.5 rounded-full transition-all" style={{ backgroundColor: affectsSwing === s ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)', border: affectsSwing === s ? '1px solid #EF4444' : '1px solid #1F2937', color: affectsSwing === s ? '#EF4444' : '#9CA3AF' }}>{s}</button>))}</div></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="text-xs text-gray-400">Current flag: <span className="text-red-400 font-bold">Lower back — mild — cleared for play, treatment 13:00</span></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { try { const prev = JSON.parse(localStorage.getItem('lumio_golf_injuries') || '[]'); localStorage.setItem('lumio_golf_injuries', JSON.stringify([{ area, painLevel, type, affectsSwing, notes, date: new Date().toISOString() }, ...prev].slice(0, 20))) } catch {} setSubmitted(true) }} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#EF4444' }}>Log & notify Dr Anna Price →</button>
          </div>
        </>) : (
          <div className="text-center py-8"><div className="text-5xl mb-3">✅</div><div className="text-base font-bold text-white mb-2">Logged</div><div className="text-sm mb-4" style={{ color: '#6B7280' }}>{area} — {type} (pain {painLevel}/10, swing: {affectsSwing}). Dr Anna Price notified.</div><button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>Done</button></div>
        )}
      </div>
    </>
  )
}

function GolfExpenseLogger({ onClose, session }: { onClose: () => void; session: SportsDemoSession }) {
  const [category, setCategory] = useState('Flights')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [monthTotal, setMonthTotal] = useState(4820)

  return (
    <>
      <ModalHeader icon="🧾" title="Log Expense" subtitle="Quick expense logging with tax tracking" onClose={onClose} />
      <div className="p-6 space-y-4">
        {!submitted ? (<>
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="text-xs text-gray-500">This month</div>
            <div className="text-sm font-bold text-white">£{monthTotal.toLocaleString()}</div>
          </div>
          {monthTotal + (parseFloat(amount) || 0) > 50000 && (
            <div className="p-2 rounded-lg text-xs font-bold" style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }}>⚠ Approaching £50k tax milestone — notify accountant</div>
          )}
          <div><label className="text-xs text-gray-500 mb-2 block">Category</label><div className="flex flex-wrap gap-2">{['Flights','Hotel','Caddie fees','Entry fees','Equipment','Meals','Ground transport','Other'].map(c => (<button key={c} onClick={() => setCategory(c)} className="text-xs px-3 py-1.5 rounded-full transition-all" style={{ backgroundColor: category === c ? 'rgba(21,128,61,0.2)' : 'rgba(255,255,255,0.05)', border: category === c ? '1px solid #15803D' : '1px solid #1F2937', color: category === c ? '#15803D' : '#9CA3AF' }}>{c}</button>))}</div></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Amount (£)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Note</label><input value={note} onChange={e => setNote(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          </div>
          <button onClick={() => setSubmitted(true)} disabled={!amount} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: amount ? '#15803D' : '#374151' }}>Log expense →</button>
        </>) : (
          <div className="text-center py-8"><div className="text-5xl mb-3">✅</div><div className="text-base font-bold text-white mb-2">Expense logged</div><div className="text-sm mb-4" style={{ color: '#6B7280' }}>£{amount} ({category}) saved to your financial dashboard.</div><button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>Done</button></div>
        )}
      </div>
    </>
  )
}

function GolfCourseNotes({ onClose, session }: { onClose: () => void; session: SportsDemoSession }) {
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  return (
    <>
      <ModalHeader icon="🗺️" title="Course Notes" subtitle="Quick notes saved to your caddie workflow" onClose={onClose} />
      <div className="p-6 space-y-4">
        {!submitted ? (<>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={6} placeholder="e.g. Hole 7 — aim left of pin, bunker right is punishing..." className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} />
          <button onClick={() => setSubmitted(true)} disabled={!notes.trim()} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: notes.trim() ? '#15803D' : '#374151' }}>Save notes →</button>
        </>) : (
          <div className="text-center py-8"><div className="text-5xl mb-3">✅</div><div className="text-base font-bold text-white mb-2">Notes saved</div><div className="text-sm mb-4" style={{ color: '#6B7280' }}>Course notes saved to your Caddie Workflow.</div><button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>Done</button></div>
        )}
      </div>
    </>
  )
}

function GolfSocialMediaAI({ onClose, session, player }: { onClose: () => void; session: SportsDemoSession; player: GolfPlayer }) {
  const [topic, setTopic] = useState('')
  const [platforms, setPlatforms] = useState<string[]>(['Instagram'])
  const [tone, setTone] = useState('Professional')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const togglePlatform = (p: string) => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/golf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 800,
          messages: [{ role: 'user', content: `You are the social media manager for ${session.userName || player.name}, a professional golfer on the ${player.tour} (OWGR #${player.owgr}). Current event: Halden Motors International Open, Munich. Generate social media content about: "${topic || 'tournament prep day'}". Platforms: ${platforms.join(', ')}. Tone: ${tone}. Include hashtags, emojis, and platform-specific formatting. For Instagram include a caption. For Twitter/X keep under 280 chars. For LinkedIn be more professional. Respond in plain text only — no markdown formatting.` }]
        })
      })
      const data = await res.json()
      setResult(cleanResponse(data.content?.map((b: {type:string;text?:string}) => b.type === 'text' ? b.text : '').join('') || ''))
    } catch { setResult('Unable to generate. Try again.') }
    setLoading(false)
  }

  return (<>
    <ModalHeader icon="📲" title="Social Media AI" subtitle="Generate golf-specific social media content" onClose={onClose} />
    <div className="p-6 space-y-4">
      {!result && !loading && (<>
        <div><label className="text-xs text-gray-500 mb-1 block">Topic / Context</label><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Range session, tournament prep, sponsor shoutout..." className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
        <div><label className="text-xs text-gray-500 mb-2 block">Platforms</label>
          <div className="flex flex-wrap gap-2">{['Instagram', 'Twitter/X', 'LinkedIn', 'TikTok'].map(p => (
            <button key={p} onClick={() => togglePlatform(p)} className="text-xs px-3 py-1.5 rounded-full transition-all" style={{ backgroundColor: platforms.includes(p) ? 'rgba(21,128,61,0.2)' : 'rgba(255,255,255,0.05)', border: platforms.includes(p) ? '1px solid #15803D' : '1px solid #1F2937', color: platforms.includes(p) ? '#15803D' : '#9CA3AF' }}>{p}</button>
          ))}</div>
        </div>
        <div><label className="text-xs text-gray-500 mb-2 block">Tone</label>
          <div className="flex flex-wrap gap-2">{['Professional', 'Casual', 'Motivational', 'Behind-the-scenes', 'Sponsor-friendly'].map(t => (
            <button key={t} onClick={() => setTone(t)} className="text-xs px-3 py-1.5 rounded-full transition-all" style={{ backgroundColor: tone === t ? 'rgba(21,128,61,0.2)' : 'rgba(255,255,255,0.05)', border: tone === t ? '1px solid #15803D' : '1px solid #1F2937', color: tone === t ? '#15803D' : '#9CA3AF' }}>{t}</button>
          ))}</div>
        </div>
        <button onClick={generate} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>Generate Content →</button>
      </>)}
      {loading && <div className="text-center py-12"><div className="text-5xl mb-4 animate-pulse">📲</div><div className="text-sm font-bold text-white">Generating social media content...</div></div>}
      {result && (<>
        <div className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB', maxHeight: 400, overflowY: 'auto' }}>{result}</div>
        <div className="flex gap-3">
          <button onClick={() => setResult(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Regenerate</button>
          <button onClick={() => navigator.clipboard.writeText(result)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>📋 Copy</button>
        </div>
      </>)}
    </div>
  </>)
}

function GolfVisaCheck({ onClose }: { onClose: () => void }) {
  const COUNTRIES = [
    { country: '🇩🇪 Germany (Halden Motors International)', visa: 'Not required', note: 'UK passport — Schengen zone, 90-day tourist visa-free', urgent: false },
    { country: '🇬🇧 UK (British Masters, Halden Motors Championship)', visa: 'Home', note: 'No requirements — home country', urgent: false },
    { country: '🇨🇭 Switzerland (Omega Euro Masters)', visa: 'Not required', note: 'Schengen zone — 90-day visa-free', urgent: false },
    { country: '🇦🇪 UAE (Abu Dhabi, Dubai)', visa: 'Visa on arrival', note: '30-day tourist visa on arrival for UK passport holders', urgent: false },
    { country: '🇺🇸 USA (US Open, Masters)', visa: '⚠️ ESTA required', note: 'Apply 72h before travel — $21 fee, valid 2 years', urgent: true },
    { country: '🇯🇵 Japan (Zozo Championship)', visa: '⚠️ eVisa required', note: 'Online application, processing 5 business days, $25 fee', urgent: true },
    { country: '🇰🇷 South Korea (Korean Open)', visa: 'K-ETA required', note: 'Apply 72h before — $10 fee. Exempt if transit only.', urgent: false },
    { country: '🇦🇺 Australia (Australian Open)', visa: '⚠️ ETA required', note: 'Apply online, usually instant — AUD $20', urgent: true },
  ]
  return (
    <>
      <ModalHeader icon="🌍" title="Visa Check" subtitle="Requirements for upcoming golf destinations" onClose={onClose} />
      <div className="p-6 space-y-3">
        {COUNTRIES.map((c, i) => (
          <div key={i} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: `1px solid ${c.urgent ? 'rgba(245,158,11,0.3)' : '#1F2937'}` }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-white">{c.country}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: c.visa.includes('Home') || c.visa === 'Not required' ? 'rgba(34,197,94,0.15)' : c.visa.includes('⚠️') ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)', color: c.visa.includes('Home') || c.visa === 'Not required' ? '#22C55E' : c.visa.includes('⚠️') ? '#F59E0B' : '#60A5FA' }}>{c.visa}</span>
            </div>
            <div className="text-xs" style={{ color: '#6B7280' }}>{c.note}</div>
          </div>
        ))}
      </div>
    </>
  )
}

// ─── NEW MODAL COMPONENTS ────────────────────────────────────────────────────

function GolfHotelFinder({ onClose, session }: { onClose: () => void; session: SportsDemoSession }) {
  const [step, setStep] = useState(1)
  const [destination, setDestination] = useState('Munich, Germany')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<null | Array<{name:string;stars:number;price:number;distance:string;score:number;badge?:string}>>(null)
  const [prefs, setPrefs] = useState<string[]>([])
  const togglePref = (p: string) => setPrefs(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])

  const TOURNAMENT_CHIPS: Array<{label: string; destination: string}> = [
    { label: 'Masters (Ashbourne)', destination: 'Ashbourne, Georgia, USA' },
    { label: 'The Open (Royal Liverpool)', destination: 'Royal Liverpool, Hoylake, UK' },
    { label: 'US Open (Pinehurst)', destination: 'Pinehurst, North Carolina, USA' },
    { label: 'Ryder Cup (Bethpage)', destination: 'Bethpage, New York, USA' },
    { label: 'Halden Motors International (Munich)', destination: 'Munich, Germany' },
  ]

  const search = async () => {
    setLoading(true)
    setStep(4)
    try {
      const res = await fetch('/api/ai/golf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 800,
          tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
          messages: [{ role: 'user', content: `Find best hotels near ${destination} for a touring golf professional, ${checkIn || 'next week'} to ${checkOut || 'next week + 3 days'}. Priority: ${prefs.length ? prefs.join(', ') : 'proximity to course, quality gym'}. Top 3 with name, distance to course, price, facilities, booking URL. Return ONLY JSON array: [{"name":"","stars":5,"price":0,"distance":"","score":0,"badge":""}]. Score 0-100. Badge: "Best overall", "Best value", or null. Respond in plain text only — no markdown.` }]
        })
      })
      const data = await res.json()
      const text = data.content?.filter((b:{type:string}) => b.type === 'text').map((b:{text:string}) => b.text).join('') || ''
      const match = text.match(/\[[\s\S]*\]/)
      setResults(match ? JSON.parse(match[0]) : [
        {name:'Marriott München',stars:4,price:195,distance:'3.2km to course',score:92,badge:'Best value'},
        {name:'Hotel Kranzbach',stars:5,price:320,distance:'8km to course',score:88,badge:'Best overall'},
        {name:'NH München Ost',stars:4,price:145,distance:'5.1km to course',score:84},
      ])
    } catch {
      setResults([
        {name:'Marriott München',stars:4,price:195,distance:'3.2km to course',score:92,badge:'Best value'},
        {name:'Hotel Kranzbach',stars:5,price:320,distance:'8km to course',score:88,badge:'Best overall'},
        {name:'NH München Ost',stars:4,price:145,distance:'5.1km to course',score:84},
      ])
    }
    setLoading(false)
  }

  return (<>
    <ModalHeader icon="🏨" title="Smart Hotel Finder" subtitle="4-step AI hotel search for touring golf professionals" onClose={onClose} />
    <div className="p-6 space-y-4">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-2">
        {[1,2,3,4].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: step >= s ? '#15803D' : '#1F2937', color: step >= s ? '#fff' : '#6B7280' }}>{s}</div>
            {s < 4 && <div className="w-6 h-0.5 rounded" style={{ backgroundColor: step > s ? '#15803D' : '#1F2937' }} />}
          </div>
        ))}
        <span className="text-xs text-gray-500 ml-2">{step === 1 ? 'Tournament' : step === 2 ? 'Dates' : step === 3 ? 'Preferences' : 'Results'}</span>
      </div>

      {/* Step 1: Tournament / Destination */}
      {step === 1 && (<>
        <div><label className="text-xs text-gray-500 mb-2 block">Quick pick — tournament</label>
          <div className="flex flex-wrap gap-2">{TOURNAMENT_CHIPS.map(t => (
            <button key={t.label} onClick={() => { setDestination(t.destination); setStep(2) }} className="text-xs px-3 py-2 rounded-xl transition-all" style={{ backgroundColor: destination === t.destination ? 'rgba(21,128,61,0.2)' : 'rgba(255,255,255,0.05)', border: destination === t.destination ? '1px solid #15803D' : '1px solid #1F2937', color: destination === t.destination ? '#15803D' : '#9CA3AF' }}>{t.label}</button>
          ))}</div>
        </div>
        <div><label className="text-xs text-gray-500 mb-1 block">Or enter destination</label><input value={destination} onChange={e => setDestination(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
        <button onClick={() => setStep(2)} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>Next: Dates →</button>
      </>)}

      {/* Step 2: Dates */}
      {step === 2 && (<>
        <div className="text-xs text-gray-400 mb-1">Destination: <span className="text-white font-medium">{destination}</span></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Check-in</label><input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Check-out</label><input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Back</button>
          <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>Next: Preferences →</button>
        </div>
      </>)}

      {/* Step 3: Preferences */}
      {step === 3 && (<>
        <div className="text-xs text-gray-400 mb-1">{destination} · {checkIn || 'TBD'} to {checkOut || 'TBD'}</div>
        <div><label className="text-xs text-gray-500 mb-2 block">Preferences (select any)</label>
          <div className="flex flex-wrap gap-2">{['Near course','Quiet for sleep/prep','Gym','Course views','Airport transfer','Restaurant on-site','Spa/recovery'].map(p => (
            <button key={p} onClick={() => togglePref(p)} className="text-xs px-3 py-1.5 rounded-full transition-all" style={{ backgroundColor: prefs.includes(p) ? 'rgba(21,128,61,0.2)' : 'rgba(255,255,255,0.05)', border: prefs.includes(p) ? '1px solid #15803D' : '1px solid #1F2937', color: prefs.includes(p) ? '#15803D' : '#9CA3AF' }}>{p}</button>
          ))}</div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Back</button>
          <button onClick={search} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>Search Hotels →</button>
        </div>
      </>)}

      {/* Step 4: Results */}
      {step === 4 && loading && <div className="text-center py-12"><div className="text-5xl mb-4 animate-bounce">🏨</div><div className="text-sm font-bold text-white">Finding best hotels...</div></div>}
      {step === 4 && results && (<div className="space-y-3">
        {results.map((h,i) => (
          <div key={i} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between"><div><div className="flex items-center gap-2"><span className="text-sm font-bold text-white">{h.name}</span>{h.badge && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: '#15803D' }}>{h.badge}</span>}</div><div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{'⭐'.repeat(h.stars)} · {h.distance}</div></div><div className="text-right"><div className="text-lg font-black text-white">£{h.price}</div><div className="text-[10px]" style={{ color: '#6B7280' }}>per night</div></div></div>
          </div>
        ))}
        <div className="flex gap-3">
          <button onClick={() => { setResults(null); setStep(1) }} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Start over</button>
          <button onClick={() => { const h=results[0]; window.open(`mailto:james.crawford@agent.com?subject=${encodeURIComponent(`Hotel — ${h.name}`)}&body=${encodeURIComponent(`Book ${h.name}, ${destination}. ${checkIn} to ${checkOut}. ~£${h.price}/night.\n\nThanks, ${session.userName || 'James'}`)}`) }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>Send to agent →</button>
        </div>
      </div>)}
    </div>
  </>)
}

function GolfCourseStrategyAI({ onClose, session }: { onClose: () => void; session: SportsDemoSession }) {
  const [course, setCourse] = useState('Golfclub München Eichenried')
  const [round, setRound] = useState('R1')
  const [weather, setWeather] = useState('Calm')
  const [yardage, setYardage] = useState('7,545')
  const [loading, setLoading] = useState(false)
  const [strategy, setStrategy] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/golf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1200,
          tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
          messages: [{ role: 'user', content: `Search for course information about ${course} and generate a hole-by-hole strategy guide for a touring professional golfer (OWGR #87, scoring average 70.2). Round: ${round}. Conditions: ${weather}. Yardage: ${yardage}. Cover: tee shot strategy, approach play, scoring holes, danger holes, putting notes, caddie briefing points. Format with hole numbers as headers.` }]
        })
      })
      const data = await res.json()
      setStrategy(cleanResponse(data.content?.filter((b:{type:string}) => b.type === 'text').map((b:{text:string}) => b.text).join('') || 'Unable to generate strategy.'))
    } catch { setStrategy('Unable to generate strategy. Try again.') }
    setLoading(false)
  }

  return (<>
    <ModalHeader icon="🗺️" title="Course Strategy AI" subtitle="AI hole-by-hole strategy with web search" onClose={onClose} />
    <div className="p-6 space-y-4">
      {!strategy && !loading && (<>
        <div><label className="text-xs text-gray-500 mb-1 block">Course</label><input value={course} onChange={e => setCourse(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Round</label><select value={round} onChange={e => setRound(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}>{['R1','R2','R3','R4'].map(r => <option key={r}>{r}</option>)}</select></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Weather</label><select value={weather} onChange={e => setWeather(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}><option>Calm</option><option>Windy</option><option>Wet</option><option>Mixed</option></select></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Yardage</label><input value={yardage} onChange={e => setYardage(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
        </div>
        <button onClick={generate} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>Generate Strategy →</button>
      </>)}
      {loading && (<div className="text-center py-10"><div className="text-4xl mb-3 animate-pulse">🗺️</div><div className="text-sm font-bold text-white">Generating hole-by-hole strategy...</div><div className="text-xs mt-2" style={{ color: '#6B7280' }}>Searching course data with AI...</div></div>)}
      {strategy && (<>
        <div className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB', maxHeight: 400, overflowY: 'auto' }}>{strategy}</div>
        <div className="flex gap-3">
          <button onClick={() => setStrategy(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Regenerate</button>
          <button onClick={() => navigator.clipboard.writeText(strategy)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>📋 Copy strategy</button>
        </div>
      </>)}
    </div>
  </>)
}

function GolfRoundLogger({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ tournament: 'Halden Motors International Open', round: 'R2', course: 'Golfclub München Eichenried', score: '', fairways: '', gir: '', putts: '', drivingDist: '', sgOtt: '', sgApp: '', sgArg: '', sgPutt: '', bestHole: '', worstHole: '', notes: '' })
  const [saved, setSaved] = useState(false)
  const [rounds, setRounds] = useState<Array<{tournament:string;round:string;score:string;putts:string;date:string}>>([])
  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => { try { const s = localStorage.getItem('lumio_golf_rounds'); if (s) setRounds(JSON.parse(s).slice(0, 5)) } catch {} }, [])

  const save = () => {
    const entry = { ...form, date: new Date().toLocaleDateString('en-GB') }
    try { const prev = JSON.parse(localStorage.getItem('lumio_golf_rounds') || '[]'); localStorage.setItem('lumio_golf_rounds', JSON.stringify([entry, ...prev].slice(0, 20))) } catch {}
    setRounds(prev => [{ tournament: form.tournament, round: form.round, score: form.score, putts: form.putts, date: entry.date }, ...prev].slice(0, 5))
    setSaved(true)
  }

  const inp = 'w-full px-3 py-2.5 rounded-xl text-sm text-white'
  const sty = { backgroundColor: '#111318', border: '1px solid #374151' }

  return (<>
    <ModalHeader icon="📋" title="Round Logger" subtitle="Log your round stats and strokes gained" onClose={onClose} />
    <div className="p-6 space-y-4">
      {!saved ? (<>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Tournament</label><input value={form.tournament} onChange={e => upd('tournament', e.target.value)} className={inp} style={sty} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Round</label><select value={form.round} onChange={e => upd('round', e.target.value)} className={inp} style={sty}>{['R1','R2','R3','R4'].map(r => <option key={r}>{r}</option>)}</select></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Score (par 72)</label><input type="number" value={form.score} onChange={e => upd('score', e.target.value)} placeholder="68" className={inp} style={sty} /></div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Fairways</label><input value={form.fairways} onChange={e => upd('fairways', e.target.value)} placeholder="10/14" className={inp} style={sty} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">GIR</label><input value={form.gir} onChange={e => upd('gir', e.target.value)} placeholder="12/18" className={inp} style={sty} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Putts</label><input type="number" value={form.putts} onChange={e => upd('putts', e.target.value)} placeholder="28" className={inp} style={sty} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Driving (yds)</label><input type="number" value={form.drivingDist} onChange={e => upd('drivingDist', e.target.value)} placeholder="298" className={inp} style={sty} /></div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">SG: OTT</label><input type="number" step="0.01" value={form.sgOtt} onChange={e => upd('sgOtt', e.target.value)} placeholder="+0.4" className={inp} style={sty} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">SG: APP</label><input type="number" step="0.01" value={form.sgApp} onChange={e => upd('sgApp', e.target.value)} placeholder="-0.3" className={inp} style={sty} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">SG: ARG</label><input type="number" step="0.01" value={form.sgArg} onChange={e => upd('sgArg', e.target.value)} placeholder="+0.2" className={inp} style={sty} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">SG: PUTT</label><input type="number" step="0.01" value={form.sgPutt} onChange={e => upd('sgPutt', e.target.value)} placeholder="-1.2" className={inp} style={sty} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Best hole</label><input value={form.bestHole} onChange={e => upd('bestHole', e.target.value)} placeholder="e.g. Eagle on 15" className={inp} style={sty} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Worst hole</label><input value={form.worstHole} onChange={e => upd('worstHole', e.target.value)} placeholder="e.g. Double on 7" className={inp} style={sty} /></div>
        </div>
        <div><label className="text-xs text-gray-500 mb-1 block">Notes</label><textarea value={form.notes} onChange={e => upd('notes', e.target.value)} rows={2} placeholder="Key takeaways..." className={inp} style={sty} /></div>
        <button onClick={save} disabled={!form.score} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: form.score ? '#15803D' : '#374151' }}>Save Round →</button>
        {rounds.length > 0 && (
          <div className="mt-4"><div className="text-xs text-gray-500 font-bold uppercase mb-2">Last {rounds.length} rounds</div>
            <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-gray-500">{['Date','Event','Rnd','Score','Putts'].map(h => <th key={h} className="text-left py-1 pr-3 font-medium">{h}</th>)}</tr></thead><tbody>{rounds.map((r,i) => <tr key={i} className="text-gray-300 border-t border-gray-800/40"><td className="py-1.5 pr-3">{r.date}</td><td className="pr-3">{r.tournament}</td><td className="pr-3">{r.round}</td><td className="pr-3 font-bold">{r.score}</td><td>{r.putts}</td></tr>)}</tbody></table></div>
          </div>
        )}
      </>) : (
        <div className="text-center py-8"><div className="text-5xl mb-3">✅</div><div className="text-base font-bold text-white mb-2">Round saved</div><div className="text-sm mb-4" style={{ color: '#6B7280' }}>{form.round} — {form.score} at {form.tournament}</div><button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>Done</button></div>
      )}
    </div>
  </>)
}

function GolfLaunchMonitorAnalysis({ onClose, session, player }: { onClose: () => void; session: SportsDemoSession; player: GolfPlayer }) {
  const [club, setClub] = useState('7i')
  const [ballSpeed, setBallSpeed] = useState('')
  const [launchAngle, setLaunchAngle] = useState('')
  const [spinRate, setSpinRate] = useState('')
  const [carry, setCarry] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)

  const smash = ballSpeed && carry ? (parseFloat(carry) / parseFloat(ballSpeed) * 1.5).toFixed(2) : '—'

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/golf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 800,
          messages: [{ role: 'user', content: `Analyse these Lumio Range numbers for a touring professional golfer: Club ${club}, Ball speed ${ballSpeed}mph, Launch ${launchAngle}°, Spin ${spinRate}rpm, Carry ${carry}yds. Compare to PGA Tour averages for this club. Identify: what's working, what needs adjustment, specific drill or setup change to improve. Technical, coaching tone. Max 300 words.` }]
        })
      })
      const data = await res.json()
      setAnalysis(data.content?.[0]?.text || 'Unable to generate analysis.')
    } catch { setAnalysis('Unable to generate analysis.') }
    setLoading(false)
  }

  return (<>
    <ModalHeader icon="📡" title="Lumio Range Analysis" subtitle="AI analysis of your launch monitor data" onClose={onClose} />
    <div className="p-6 space-y-4">
      {!analysis && !loading && (<>
        <div><label className="text-xs text-gray-500 mb-2 block">Club</label>
          <div className="flex flex-wrap gap-2">{['Driver','3W','5i','7i','PW','SW'].map(c => (
            <button key={c} onClick={() => setClub(c)} className="text-xs px-3 py-1.5 rounded-full transition-all" style={{ backgroundColor: club === c ? 'rgba(21,128,61,0.2)' : 'rgba(255,255,255,0.05)', border: club === c ? '1px solid #15803D' : '1px solid #1F2937', color: club === c ? '#15803D' : '#9CA3AF' }}>{c}</button>
          ))}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Ball speed (mph)</label><input type="number" value={ballSpeed} onChange={e => setBallSpeed(e.target.value)} placeholder="152" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Launch angle (°)</label><input type="number" step="0.1" value={launchAngle} onChange={e => setLaunchAngle(e.target.value)} placeholder="16.3" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Spin rate (rpm)</label><input type="number" value={spinRate} onChange={e => setSpinRate(e.target.value)} placeholder="6800" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Carry (yards)</label><input type="number" value={carry} onChange={e => setCarry(e.target.value)} placeholder="172" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
        </div>
        {ballSpeed && carry && <div className="text-xs text-center" style={{ color: '#15803D' }}>Smash factor: {smash}</div>}
        <button onClick={generate} disabled={!ballSpeed || !carry} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: ballSpeed && carry ? '#15803D' : '#374151' }}>Analyse →</button>
      </>)}
      {loading && (<div className="text-center py-10"><div className="text-4xl mb-3 animate-pulse">📡</div><div className="text-sm font-bold text-white">Analysing Lumio Range data...</div></div>)}
      {analysis && (<>
        <div className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB', maxHeight: 350, overflowY: 'auto' }}>{analysis}</div>
        <div className="flex gap-3">
          <button onClick={() => setAnalysis(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← New data</button>
          <button onClick={() => navigator.clipboard.writeText(analysis)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>📋 Copy analysis</button>
        </div>
      </>)}
    </div>
  </>)
}

function GolfCaddieBriefAI({ onClose, session, player }: { onClose: () => void; session: SportsDemoSession; player: GolfPlayer }) {
  const [tournament, setTournament] = useState('Halden Motors International Open')
  const [round, setRound] = useState('R2')
  const [teeTime, setTeeTime] = useState('09:24')
  const [partners, setPartners] = useState('R. Hartwell, S. Donovan')
  const [weather, setWeather] = useState('22°C, 8mph W, partly cloudy')
  const [loading, setLoading] = useState(false)
  const [brief, setBrief] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/golf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          messages: [{ role: 'user', content: `Generate a pre-round caddie briefing for James Halton (#87 OWGR, scoring avg 70.2) for ${tournament} Round ${round}, tee time ${teeTime}, playing with ${partners}. Weather: ${weather}. Cover: course management priorities for today, club selection notes, pin positions to target/avoid, playing partner awareness, focus cues, one key stat to beat today. Max 400 words. Use emoji headers.` }]
        })
      })
      const data = await res.json()
      setBrief(data.content?.[0]?.text || 'Unable to generate brief.')
    } catch { setBrief('Unable to generate brief.') }
    setLoading(false)
  }

  return (<>
    <ModalHeader icon="🏌️" title="Caddie Briefing Generator" subtitle="AI pre-round brief for you and your caddie" onClose={onClose} />
    <div className="p-6 space-y-4">
      {!brief && !loading && (<>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Tournament</label><input value={tournament} onChange={e => setTournament(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Round</label><select value={round} onChange={e => setRound(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}>{['R1','R2','R3','R4'].map(r => <option key={r}>{r}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Tee time</label><input value={teeTime} onChange={e => setTeeTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Playing partners</label><input value={partners} onChange={e => setPartners(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
        </div>
        <div><label className="text-xs text-gray-500 mb-1 block">Weather</label><input value={weather} onChange={e => setWeather(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
        <button onClick={generate} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>Generate Brief →</button>
      </>)}
      {loading && (<div className="text-center py-10"><div className="text-4xl mb-3 animate-pulse">🏌️</div><div className="text-sm font-bold text-white">Generating caddie briefing...</div></div>)}
      {brief && (<>
        <div className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB', maxHeight: 400, overflowY: 'auto' }}>{brief}</div>
        <div className="flex gap-3">
          <button onClick={() => setBrief(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Regenerate</button>
          <button onClick={() => navigator.clipboard.writeText(brief)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#15803D' }}>📋 Copy brief</button>
          <button onClick={async () => {
            if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
            window.speechSynthesis.cancel()
            const getVoicesReady = (): Promise<SpeechSynthesisVoice[]> => new Promise(resolve => {
              const v = window.speechSynthesis.getVoices()
              if (v.length > 0) return resolve(v)
              window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices())
            })
            const allVoices = await getVoicesReady()
            const savedVoiceName = localStorage.getItem('lumio_golf_voice_name') || 'Sarah'
            const voiceMap: Record<string, string[]> = {
              'Sarah': ['Google UK English Female', 'Microsoft Libby', 'Karen', 'Veena'],
              'Charlotte': ['Microsoft Hazel', 'Fiona', 'Samantha', 'Google UK English Female'],
              'George': ['Google UK English Male', 'Microsoft George', 'Daniel', 'Alex'],
            }
            const preferred = voiceMap[savedVoiceName] || voiceMap['Sarah']
            const match = allVoices.find(v => preferred.some(p => v.name.includes(p)))
              || allVoices.find(v => savedVoiceName === 'George' ? v.lang.startsWith('en') && v.name.toLowerCase().includes('male') : v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'))
            let speechText = brief
            if (!speechText) {
              const scheduleRaw = [
                { id:'gs1', time:'07:00', label:'Range session — 90 min',              highlight:false },
                { id:'gs2', time:'08:30', label:'Caddie brief with Mick — hole plans', highlight:false },
                { id:'gs3', time:'09:24', label:'R2 tee time — with Hartwell, Donovan', highlight:true },
                { id:'gs4', time:'13:00', label:'Physio — lower back treatment',       highlight:false },
                { id:'gs5', time:'15:00', label:'Lumio Range session review',             highlight:false },
                { id:'gs6', time:'17:00', label:'Scottish Open entry deadline',        highlight:true },
                { id:'gs7', time:'18:00', label:'Vanta Sports sponsor post — caption due', highlight:false },
                { id:'gs8', time:'20:00', label:'Post-round media & debrief',          highlight:false },
              ]
              const checkedState: Record<string,boolean> = JSON.parse(localStorage.getItem('golf_schedule_checked') || '{}')
              const cancelledState: Record<string,boolean> = JSON.parse(localStorage.getItem('golf_schedule_cancelled') || '{}')
              const schedItems = buildScheduleItems(scheduleRaw, checkedState, cancelledState)
              const roundupChannels = [
                { label: 'Agent Messages', count: 2, urgent: true },
                { label: 'Tournament Desk', count: 3, urgent: true },
                { label: 'Caddie Notes', count: 2, urgent: false },
                { label: 'Media & Sponsor', count: 3, urgent: false },
                { label: 'Physio & Medical', count: 1, urgent: true },
                { label: 'Travel & Hotels', count: 2, urgent: false },
                { label: 'Financial', count: 1, urgent: false },
              ]
              const isPlayerRole = !session.role || session.role === 'player'
              const smartPlayerName = isPlayerRole
                ? ((typeof window !== 'undefined' ? localStorage.getItem('lumio_golf_name') : null) || session.userName || player.name)
                : player.name
              speechText = generateSmartBriefing({
                now: new Date(),
                playerName: smartPlayerName,
                schedule: schedItems,
                match: null,
                roundupSummary: buildRoundupSummary(roundupChannels),
                sport: 'golf',
                timezone: getUserTimezone(),
                extra: `OWGR number ${player.owgr}. Halden Motors International Open, Munich.`,
              })
            }
            const utterance = new SpeechSynthesisUtterance(speechText)
            if (match) utterance.voice = match
            utterance.pitch = savedVoiceName === 'George' ? 0.75 : savedVoiceName === 'Charlotte' ? 1.25 : 1.1
            utterance.rate = savedVoiceName === 'George' ? 0.92 : 0.95
            window.speechSynthesis.speak(utterance)
          }} className="py-2.5 px-4 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>🔊</button>
        </div>
      </>)}
    </div>
  </>)
}

function GolfMentalPrepAI({ onClose, session, player }: { onClose: () => void; session: SportsDemoSession; player: GolfPlayer }) {
  const [tournament, setTournament] = useState('Halden Motors International Open')
  const [round, setRound] = useState('R2')
  const [teeTime, setTeeTime] = useState('09:24')
  const [position, setPosition] = useState('')
  const [feeling, setFeeling] = useState(7)
  const [concern, setConcern] = useState('Putting')
  const [loading, setLoading] = useState(false)
  const [routine, setRoutine] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/golf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 800,
          messages: [{ role: 'user', content: `Generate a pre-round mental preparation routine for James Halton, DP World Tour professional golfer. Round ${round} of ${tournament}, tee time ${teeTime}, currently ${position || 'T12'} on leaderboard. Feeling: ${feeling}/10. Main concern: ${concern}. Include: warm-up range routine, putting green focus, first tee ritual, between-shot process, bogey recovery mindset. Practical, 4-5 minutes to read. Max 400 words. Use emoji headers.` }]
        })
      })
      const data = await res.json()
      setRoutine(data.content?.[0]?.text || 'Unable to generate routine.')
    } catch { setRoutine('Unable to generate routine.') }
    setLoading(false)
  }

  return (<>
    <ModalHeader icon="🧠" title="Pre-Round Mental Prep" subtitle="AI mental preparation routine" onClose={onClose} />
    <div className="p-6 space-y-4">
      {!routine && !loading && (<>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Round</label><select value={round} onChange={e => setRound(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}>{['R1','R2','R3','R4'].map(r => <option key={r}>{r}</option>)}</select></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Tee time</label><input value={teeTime} onChange={e => setTeeTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Position</label><input value={position} onChange={e => setPosition(e.target.value)} placeholder="T12" className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>
        </div>
        <div><label className="text-xs text-gray-500 mb-2 block">Feeling ({feeling}/10)</label>
          <input type="range" min="1" max="10" value={feeling} onChange={e => setFeeling(parseInt(e.target.value))} className="w-full" />
          <div className="flex justify-between text-[10px] text-gray-600"><span>Low</span><span>Great</span></div>
        </div>
        <div><label className="text-xs text-gray-500 mb-2 block">Main concern</label>
          <div className="flex flex-wrap gap-2">{['Putting','Driver','Nerves','Leaderboard pressure','Playing partners','Weather'].map(c => (
            <button key={c} onClick={() => setConcern(c)} className="text-xs px-3 py-1.5 rounded-full transition-all" style={{ backgroundColor: concern === c ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)', border: concern === c ? '1px solid #8B5CF6' : '1px solid #1F2937', color: concern === c ? '#8B5CF6' : '#9CA3AF' }}>{c}</button>
          ))}</div>
        </div>
        <button onClick={generate} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#8B5CF6' }}>Generate Routine →</button>
      </>)}
      {loading && (<div className="text-center py-10"><div className="text-4xl mb-3 animate-pulse">🧠</div><div className="text-sm font-bold text-white">Generating mental prep routine...</div></div>)}
      {routine && (<>
        <div className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB', maxHeight: 400, overflowY: 'auto' }}>{routine}</div>
        <div className="flex gap-3">
          <button onClick={() => setRoutine(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Regenerate</button>
          <button onClick={() => navigator.clipboard.writeText(routine)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#8B5CF6' }}>📋 Copy routine</button>
        </div>
      </>)}
    </div>
  </>)
}

// ─── GOLF SPONSOR DASHBOARD ─────────────────────────────────────────────────
function GolfSponsorDashboard({ session, player }: { session: SportsDemoSession; player: GolfPlayer }) {
  const [activeTab, setActiveTab] = useState<'overview'|'obligations'|'content'|'events'|'roi'>('overview')
  const sponsorName = session.clubName || 'Vanta Sports'
  const sponsorColor = '#D4AF37'
  const sponsorLogo = session.logoDataUrl

  const OBLIGATIONS = [
    { id:'o1', title:'Instagram post — Vanta Sports Chrome Tour X', due:'Today', status:'pending', platform:'Instagram', reach:'95k' },
    { id:'o2', title:'Twitter round recap with equipment mention', due:'Today', status:'pending', platform:'Twitter', reach:'62k' },
    { id:'o3', title:'The Open pre-tournament Vanta Sports post', due:'14 Jul', status:'scheduled', platform:'Instagram', reach:'120k' },
    { id:'o4', title:'Halden Motors Championship brand activation shoot', due:'15 Sep', status:'upcoming', platform:'Multi', reach:'200k' },
    { id:'o5', title:'Ryder Cup selection campaign content', due:'Oct', status:'upcoming', platform:'Multi', reach:'350k' },
    { id:'o6', title:'Year-end highlights reel', due:'30 Nov', status:'upcoming', platform:'Multi', reach:'180k' },
  ]

  const CONTENT = [
    { title:'Practice range session with Jaws Raw wedges', date:'1 Jul', type:'Photo', platform:'Instagram', likes:'3.8k', reach:'88k' },
    { title:'Halden Motors International Pro-Am hospitality', date:'2 Jul', type:'Story', platform:'Instagram', likes:'1.9k', reach:'52k' },
    { title:'Pre-round warm-up with Chrome Tour X', date:'Today', type:'Video', platform:'TikTok', likes:'6.2k', reach:'180k' },
  ]

  const EVENTS = [
    { event:'Halden Motors International Open R1', date:'Today', venue:'Golfclub München Eichenried', broadcast:'Northbridge Sport, DP World Tour+', exposure:'Est. 1.8M viewers' },
    { event:'Genesis Scottish Open', date:'10 Jul', venue:'The Renaissance Club', broadcast:'Northbridge Sport, NBC', exposure:'Est. 3.2M viewers' },
    { event:'The 154th Open Championship', date:'17 Jul', venue:'Royal Birkdale', broadcast:'Northbridge Sport, Crown Broadcasting, NBC', exposure:'Est. 12.4M viewers' },
    { event:'Halden Motors Championship', date:'17 Sep', venue:'Wentworth Club', broadcast:'Northbridge Sport, DP World Tour+', exposure:'Est. 4.8M viewers' },
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
              <div className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Official partner of {session.userName || player.name} · OWGR #{player.owgr}</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {[{ label:'Obligations', value:'6 total', sub:'2 due today', color:'#EF4444' }, { label:'Est. reach', value:'8.4M', sub:'this season', color:sponsorColor }, { label:'Deal value', value:'£55k/yr', sub:'renewal 18d', color:'#22C55E' }, { label:'OWGR', value:`#${player.owgr}`, sub:'current', color:'#15803D' }].map((s,i) => (
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
        {([{ id:'overview' as const, label:'Overview', icon:'🏠' }, { id:'obligations' as const, label:'Obligations', icon:'📋' }, { id:'content' as const, label:'Content', icon:'📸' }, { id:'events' as const, label:'Events', icon:'⛳' }, { id:'roi' as const, label:'ROI & Reach', icon:'📊' }]).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap" style={{ borderBottomColor: activeTab === t.id ? sponsorColor : 'transparent', color: activeTab === t.id ? '#4ade80' : '#6B7280', backgroundColor: activeTab === t.id ? `${sponsorColor}0d` : 'transparent' }}><span className="text-base">{t.icon}</span>{t.label}</button>
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
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-bold text-white">Brand visibility today</p><p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{session.userName || player.name} is competing at Halden Motors International Open R1</p></div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[{ label:'Expected TV viewers', value:'1.8M', icon:'📺', color:sponsorColor }, { label:'Social following', value:'142k', icon:'📱', color:'#15803D' }, { label:'Press accredited', value:'68', icon:'📰', color:'#8B5CF6' }].map((s,i) => (
                  <div key={i} className="text-center p-4 rounded-xl" style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}><div className="text-2xl mb-1">{s.icon}</div><div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div><div className="text-xs mt-1" style={{ color: '#6B7280' }}>{s.label}</div></div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <p className="text-sm font-bold text-white mb-3">Season obligations</p>
                <div className="flex items-center gap-3 mb-2"><div className="flex-1 bg-gray-800 rounded-full h-2"><div className="h-2 rounded-full" style={{ width:'0%', backgroundColor: sponsorColor }} /></div><span className="text-xs font-bold" style={{ color: sponsorColor }}>0/{OBLIGATIONS.length}</span></div>
                <div className="space-y-1 text-xs">
                  {[['Pending',OBLIGATIONS.filter(o=>o.status==='pending').length,'#EF4444'],['Scheduled',OBLIGATIONS.filter(o=>o.status==='scheduled').length,'#15803D'],['Upcoming',OBLIGATIONS.filter(o=>o.status==='upcoming').length,'#6B7280']].map(([l,v,c]) => (
                    <div key={l as string} className="flex justify-between" style={{ color: '#6B7280' }}><span>{l as string}</span><span style={{ color: c as string }}>{v as number}</span></div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <p className="text-sm font-bold text-white mb-3">Deal summary</p>
                {[['Partner since','January 2024'],['Deal value','£55,000/yr'],['Renewal date','Jul 26 2026 (18d)'],['Obligations','6 posts / season'],['Events','2 appearances/yr']].map(([l,v]) => (
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
                    <div className="flex items-center gap-2 mb-1"><span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: o.status==='pending'?'rgba(239,68,68,0.15)':o.status==='scheduled'?'rgba(21,128,61,0.15)':'rgba(107,114,128,0.15)', color: o.status==='pending'?'#EF4444':o.status==='scheduled'?'#15803D':'#6B7280' }}>{o.status==='pending'?'⏰ Due today':o.status==='scheduled'?'📅 Scheduled':'⏳ Upcoming'}</span><span className="text-xs" style={{ color: '#6B7280' }}>{o.platform}</span></div>
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
              {[{ label:'Total reach YTD', value:'8.4M', color:sponsorColor }, { label:'Media impressions', value:'2.1M', color:'#15803D' }, { label:'Social engagements', value:'89k', color:'#22C55E' }, { label:'Press mentions', value:'31', color:'#8B5CF6' }].map((s,i) => (
                <div key={i} className="rounded-xl p-4 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div><div className="text-xs mt-1" style={{ color: '#6B7280' }}>{s.label}</div></div>
              ))}
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-sm font-bold text-white mb-4">Estimated brand value breakdown</p>
              {[{ label:'TV / broadcast exposure', value:'£92,000', pct:72, color:sponsorColor }, { label:'Social media reach', value:'£22,000', pct:17, color:'#15803D' }, { label:'Press & editorial', value:'£8,000', pct:6, color:'#8B5CF6' }, { label:'On-course branding', value:'£6,000', pct:5, color:'#22C55E' }].map((r,i) => (
                <div key={i} className="mb-4"><div className="flex justify-between mb-1.5"><span className="text-xs" style={{ color: '#9CA3AF' }}>{r.label}</span><span className="text-xs font-bold" style={{ color: r.color }}>{r.value}</span></div><div className="w-full bg-gray-800 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width: `${r.pct}%`, backgroundColor: r.color }} /></div></div>
              ))}
              <div className="flex justify-between pt-3 mt-2" style={{ borderTop: '1px solid #1F2937' }}><span className="text-sm font-bold text-white">Total estimated value</span><span className="text-sm font-black" style={{ color: sponsorColor }}>£128,000</span></div>
            </div>
            <div className="rounded-xl p-5 text-center" style={{ background: `linear-gradient(135deg, ${sponsorColor}20, rgba(0,0,0,0.4))`, border: `1px solid ${sponsorColor}40` }}>
              <div className="text-2xl mb-2">🤝</div>
              <div className="text-base font-bold text-white mb-1">Renewal in 18 days</div>
              <div className="text-xs mb-4" style={{ color: '#6B7280' }}>Current deal expires Jul 26 2026. ROI tracking positively — value exceeds deal cost.</div>
              <button className="px-8 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: sponsorColor }}>Start renewal discussion →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────
export default function GolfTourPage() {
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
          if (profile && profile.sport === 'golf') {
            if (!profile.onboarding_complete) { window.location.href = '/golf/app'; return }
            setAuthSession({
              email: user.email ?? '',
              userName: profile.display_name ?? '',
              clubName: profile.brand_name ?? '',
              role: 'player',
              photoDataUrl: profile.avatar_url ?? null,
              logoDataUrl: profile.brand_logo_url ?? null,
              sport: 'golf',
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
    return <GolfPortalInner session={authSession} onSignOut={handleSignOut} />
  }
  return (
    <SportsDemoGate
      sport="golf"
      defaultClubName="Lumio Golf Club"
      accentColor="#15803D"
      accentColorLight="#16a34a"
      sportEmoji="⛳"
      sportLabel="Lumio Golf"
      roles={GOLF_ROLES}
    >
      {(session) => <GolfPortalInner session={session} />}
    </SportsDemoGate>
  )
}

export function GolfPortalInner({ session, onSignOut }: { session: SportsDemoSession; onSignOut?: () => void }) {
  // URL decides demo-vs-founder. Session-driven gating fails for anonymous
  // visitors (undefined === false is false, so founder URLs fell through to
  // demo content in incognito). See src/lib/config/demo-slugs.ts.
  const params = useParams<{ slug: string }>()
  const slug = typeof params?.slug === 'string' ? params.slug : ''
  const showDemoData = isDemoSlug(slug, 'golf')
  session = { ...session, isDemoShell: showDemoData }
  const [activeSection, setActiveSection] = useState('dashboard');
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [roleOverride, setRoleOverride] = useState(session.role || 'player');
  const activeRole = roleOverride;
  const [toast, setToast] = useState<{ message: string; sponsor: string } | null>(null);
  const [toastDismissed, setToastDismissed] = useState(false);
  const groups = ['OVERVIEW', 'PERFORMANCE', 'TEAM', 'COMMERCIAL', 'OPERATIONS', 'SETTINGS'];
  const isFoundingMember = session.isDemoShell === false
  // Mirror Settings brand colours onto CSS vars — see tennis/[slug]/page.tsx
  useLiveBrandColours('golf', { primary: '#15803d', secondary: '#ffffff' })
  // Profile sync — keeps the bottom RoleSwitcher avatar/name in step with Settings edits.
  // Founders bypass these survivor-key reads to prevent leakage from a prior demo
  // visit on the same browser.
  const _liveProfileNameOuterRaw = useGolfProfileName()
  const _liveProfilePhotoOuterRaw = useGolfProfilePhoto()
  const _liveBrandNameRaw = useGolfBrandName()
  const _liveBrandLogoRaw = useGolfBrandLogo()
  const liveProfileNameOuter = isFoundingMember ? null : _liveProfileNameOuterRaw
  const liveProfilePhotoOuter = isFoundingMember ? null : _liveProfilePhotoOuterRaw
  const liveBrandName = isFoundingMember ? '' : _liveBrandNameRaw
  const liveBrandLogo = isFoundingMember ? '' : _liveBrandLogoRaw
  // liveSession reflects the LIVE role override (not the original session.role
  // captured at mount). RoleSwitcher uses session.role to highlight the
  // "Current view" — without this, the label stays glued to the original role
  // even after the user switches.
  const liveSession = { ...session, role: roleOverride, userName: liveProfileNameOuter || session.userName, photoDataUrl: liveProfilePhotoOuter || session.photoDataUrl }

  // Founding members (live mode) get their wizard-entered name on the player
  // card. Demo mode is unchanged — the James Halton persona is intentional.
  const player: GolfPlayer = isFoundingMember
    ? { ...DEMO_PLAYER, name: session.userName || DEMO_PLAYER.name }
    : DEMO_PLAYER;

  // Sidebar pin state
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const sidebarLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sidebarExpanded = sidebarPinned || sidebarHovered
  useEffect(() => { setSidebarPinned(typeof window !== 'undefined' && localStorage.getItem('lumio_golf_sidebar_pinned') === 'true') }, [])
  function togglePin() { setSidebarPinned(p => { const next = !p; localStorage.setItem('lumio_golf_sidebar_pinned', String(next)); return next }) }
  function handleSidebarEnter() { if (sidebarLeaveTimer.current) { clearTimeout(sidebarLeaveTimer.current); sidebarLeaveTimer.current = null }; setSidebarHovered(true) }
  function handleSidebarLeave() { sidebarLeaveTimer.current = setTimeout(() => setSidebarHovered(false), 400) }

  // Modal state
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const closeModal = () => setActiveModal(null)

  // Customise Portal — hidden items
  const [hiddenItems, setHiddenItems] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try { const saved = localStorage.getItem('lumio_golf_hidden_items'); return saved ? JSON.parse(saved) : [] } catch { return [] }
  })
  useEffect(() => {
    const handler = (e: Event) => { const ce = e as CustomEvent; if (ce.detail?.storagePrefix === 'lumio_golf_') setHiddenItems(ce.detail.hiddenItems) }
    window.addEventListener('lumio-visibility-changed', handler)
    return () => window.removeEventListener('lumio-visibility-changed', handler)
  }, [])
  const isHidden = (key: string) => hiddenItems.includes(key)

  // Role config
  const currentRole = (roleOverride || 'player') as keyof typeof GOLF_ROLE_CONFIG
  const roleConfig = GOLF_ROLE_CONFIG[currentRole] ?? GOLF_ROLE_CONFIG.player
  const isPlayer = currentRole === 'player'
  const isSponsor = currentRole === 'sponsor'
  const visibleSidebarItems = (roleConfig.sidebar === 'all' ? SIDEBAR_ITEMS : SIDEBAR_ITEMS.filter(item => (roleConfig.sidebar as string[]).includes(item.id))).filter(item => !isHidden(item.id))

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

  // Quick Wins dismissed state
  const [dismissedWins, setDismissedWins] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem('golf_dismissed_wins'); return s ? new Set(JSON.parse(s)) : new Set() } catch { return new Set() }
  })
  const dismissWin = (id: string) => {
    setDismissedWins(prev => { const next = new Set(prev); next.add(id); try { localStorage.setItem('golf_dismissed_wins', JSON.stringify([...next])) } catch {} return next })
  }

  // Daily Tasks state
  const [taskChecked, setTaskChecked] = useState<Record<string, boolean>>(() => {
    try { const s = localStorage.getItem('golf_tasks_checked'); return s ? JSON.parse(s) : {} } catch { return {} }
  })
  const toggleTask = (id: string) => {
    setTaskChecked(prev => { const next = { ...prev, [id]: !prev[id] }; try { localStorage.setItem('golf_tasks_checked', JSON.stringify(next)) } catch {} return next })
  }

  // Don't Miss dismissed state
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem('golf_dismissed_alerts'); return s ? new Set(JSON.parse(s)) : new Set() } catch { return new Set() }
  })
  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => { const next = new Set(prev); next.add(id); try { localStorage.setItem('golf_dismissed_alerts', JSON.stringify([...next])) } catch {} return next })
  }

  // Team sub-tab
  const [teamSubTab, setTeamSubTab] = useState<'today'|'org'>('today')

  // Sponsor obligation toast — fires once on mount if it's past 09:00 and not dismissed.
  useEffect(() => {
    if (toastDismissed) return;
    const hour = new Date().getHours();
    // Demo deals — the most urgent is Vanta Sports (renewal due, content obligation today).
    const deals = [
      { sponsor: 'Vanta Sports', status: 'Renewal due', days: 18, dailyObligation: true },
      { sponsor: 'Vanta Sports', status: 'Active', days: 82, dailyObligation: false },
      { sponsor: 'Meridian Watches', status: 'Active', days: 146, dailyObligation: false },
    ];
    const dailyDue = deals.find(d => d.dailyObligation);
    const renewalSoon = deals.find(d => d.days <= 18);
    if (hour >= 9 && dailyDue) {
      setToast({ sponsor: dailyDue.sponsor, message: 'Instagram post due today — Sarah has the caption ready' });
    } else if (renewalSoon) {
      setToast({ sponsor: renewalSoon.sponsor, message: `Contract renewal in ${renewalSoon.days} days — agent needs sign-off` });
    }
  }, [toastDismissed]);

  const renderView = () => {
    // Founder (non-demo slug) sees EmptyState instead of demo content. Dashboard
    // keeps its own internal branching; Settings stays accessible for founders.
    const isFounder = session.isDemoShell === false
    const gate = (icon: string, title: string, sub: string, el: React.ReactNode) =>
      isFounder ? <EmptyState icon={icon} title={title} sub={sub} /> : el
    switch (activeSection) {
      case 'dashboard':   return <DashboardView player={player} session={session} setActiveSection={setActiveSection} onOpenModal={setActiveModal} />;
      case 'morning':     return gate('🌅', 'No briefing data yet', 'Connect your data to unlock this', <MorningBriefingView player={player} session={session} />);
      case 'owgr':        return gate('📊', 'No OWGR data', 'Connect your tour feed to unlock this', <OWGRView player={player} session={session} />);
      case 'schedule':    return gate('🗓️', 'No tournaments loaded', 'Connect your tour feed to unlock this', <ScheduleView player={player} session={session} />);
      case 'strokes':     return gate('📈', 'No Strokes Gained data', 'Connect your round data to unlock this', <StrokesGainedView player={player} session={session} />);
      case 'coursefit':   return gate('🎯', 'No course fit data', 'Connect your data to unlock this', <CourseFitView player={player} session={session} />);
      case 'caddie':      return gate('👥', 'No caddie notes yet', 'Add your caddie to unlock this', <CaddieView player={player} session={session} />);
      case 'team':        return gate('👥', 'No team members yet', 'Add your coach, caddie, agent and support staff to unlock this', <TeamHubView player={player} session={session} />);
      case 'physio':      return gate('🏥', 'No physio data', 'Connect your data to unlock this', <PhysioView player={player} session={session} />);
      case 'equipment':   return gate('⛳', 'No equipment logged', 'Add your clubs and setup to unlock this', <EquipmentView player={player} session={session} />);
      case 'mental':      return gate('🧘', 'No sessions logged', 'Connect your data to unlock this', <MentalView player={player} session={session} />);
      case 'sponsorship': return gate('💼', 'No sponsors added', 'Add your sponsors to unlock this', <SponsorshipView player={player} session={session} />);
      case 'financial':   return gate('💰', 'No financial data', 'Connect your data to unlock this', <FinancialView player={player} session={session} />);
      case 'career':      return gate('🚀', 'No career plan yet', 'Add your career goals to unlock this', <CareerView player={player} session={session} />);
      case 'proam':       return gate('🎪', 'No Pro-Am enquiries yet', "We'll surface them here when they come in.", <ProAmView player={player} session={session} />);
      case 'practicelog': return gate('⛳', 'No practice sessions logged', 'Connect your data to unlock this', <PracticeLogView player={player} session={session} />);
      case 'exemptions':  return gate('🏛️', 'No exemption data', 'Connect your tour feed to unlock this', <ExemptionsView player={player} session={session} />);
      case 'matchprep':   return gate('🎯', 'No round prep yet', 'Connect your data to unlock this', <RoundPrepView player={player} session={session} />);
      case 'media':       return session.isDemoShell !== false
        ? <MediaContentModule sport="golf" accentColor="#16a34a" isDemoShell={true} />
        : <PlaceholderView icon="📱" title="Media & Content" description="Social media calendar, sponsor content obligations, press log, and interview management." player={player} session={session} />;
      case 'agent':       return gate('🤝', 'No agent pipeline', 'Connect your data to unlock this', <AgentPipelineView player={player} session={session} />);
      case 'travel':      return gate('✈️', 'No travel booked', 'Connect your data to unlock this', <GolfTravelView player={player} session={session} />);
      case 'qualifying':  return gate('🃏', 'No Q-School data', 'Connect your tour feed to unlock this', <GolfQSchoolView player={player} session={session} />);
      case 'video':       return gate('🎥', 'No video library yet', 'Upload your round footage to unlock this', <GolfVideoLibraryView player={player} session={session} />);
      case 'findpro':     return gate('🎯', 'No directory data', 'Connect your location to unlock this', <GolfFindProView player={player} session={session} />);
      case 'settings':    return (
        <SportsSettings
          sport="golf"
          slug={player.slug}
          sportLabel="Golf"
          entity="player"
          accentColour="#15803D"
          accentLight="#16a34a"
          session={{
            userName: session?.userName,
            photoDataUrl: session?.photoDataUrl,
            email: session?.email,
            nickname: session?.nickname,
            clubName: session?.clubName,
            logoDataUrl: session?.logoDataUrl,
            isDemoShell: session?.isDemoShell,
          }}
          storagePrefix="lumio_golf_"
          brandNameValue={liveBrandName}
          brandLogoUrl={liveBrandLogo}
          profile={{
            name: 'Full Name',
            tour: 'Tour / Circuit',
            tourValue: isFoundingMember ? undefined : player.tour,
            ranking: 'Ranking',
            rankingValue: isFoundingMember ? undefined : `OWGR #${player.owgr}`,
            coach: 'Coach',
            coachValue: isFoundingMember ? undefined : player.coach,
            agent: 'Agent',
            agentValue: isFoundingMember ? undefined : player.agent,
            playerIdLabel: 'OWGR Player ID',
            staffInviteRoles: ['Coach','Short Game Coach','Caddie','Physio','Agent','Fitness Trainer','Mental Coach','Admin'],
          }}
          configFields={[
            { id: 'owgrId', label: 'OWGR Player ID', description: 'For live ranking and tournament data', kind: 'text', placeholder: 'e.g. 12345' },
            { id: 'gpsProvider', label: 'GPS Hardware Provider', description: 'Shot tracking system', kind: 'select', options: ['None','Lumio Range','Lumio Range','Lumio Wear','Lumio Range','Lumio GPS','CSV Upload (manual)'], defaultValue: isFoundingMember ? '' : 'None' },
          ]}
          integrationGroups={[
            {
              title: 'DATA PROVIDERS',
              items: [
                { name: 'OWGR Profile', desc: 'World ranking & points data' },
                { name: 'Lumio Range', desc: 'Launch monitor & ball flight data' },
                { name: 'Lumio Range', desc: 'Shot tracking & strokes gained' },
                { name: 'PGA/DP World Tour', desc: 'Tournament stats & leaderboards' },
                { name: 'Lumio Vision', desc: 'Video capture & swing analysis' },
                { name: 'Lumio GPS', desc: 'GPS load & movement data' },
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
            { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', desc: 'Professional British male — steady round narration' },
          ]}
          teamInvite={{
            enabled: true,
            staffCount: 1,
            pendingInvites: 0,
            roleOptions: ['Coach','Short Game Coach','Caddie','Physio','Agent','Fitness Trainer','Mental Coach','Admin'],
          }}
          navItems={[
            { key: 'morning', label: 'Morning Briefing', emoji: '🌅' },
            { key: 'owgr', label: 'OWGR & Race to Dubai', emoji: '📊' },
            { key: 'strokes', label: 'Strokes Gained', emoji: '📈' },
            { key: 'coursefit', label: 'Course Fit & Strategy', emoji: '🗺️' },
            { key: 'practicelog', label: 'Practice Log', emoji: '📋' },
            { key: 'team', label: 'Team Hub', emoji: '👥' },
            { key: 'caddie', label: 'Caddie Workflow', emoji: '🏌️' },
            { key: 'sponsorship', label: 'Sponsorship', emoji: '🤝' },
            { key: 'financial', label: 'Financial Dashboard', emoji: '💰' },
            { key: 'travel', label: 'Travel & Logistics', emoji: '✈️' },
          ]}
          featureItems={[
            { key: 'morning-briefing', label: 'Morning Briefing', emoji: '🌅', description: 'AI summary at top of dashboard' },
            { key: 'quick-actions', label: 'Quick Actions bar', emoji: '⚡', description: 'Action buttons below tab bar' },
            { key: 'ai-section', label: 'AI Department Intelligence', emoji: '✨', description: 'AI Summary + Key Highlights' },
            { key: 'world-clock', label: 'World Clock', emoji: '🕐', description: 'Multi-timezone clock in banner' },
            { key: 'player-card', label: 'Player Card', emoji: '🃏', description: 'Stats card in right sidebar' },
          ]}
          onVisibilityChange={(items) => setHiddenItems(items)}
          showWorldClock
          showAppearance
          showDeveloperTools
          devApiRouteOptions={['/api/ai/golf']}
        />
      );
      case 'integrations': return <GolfIntegrationsHub player={player} session={session} />;
      default:            return <DashboardView player={player} session={session} setActiveSection={setActiveSection} onOpenModal={setActiveModal} />;
    }
  };

  // NOTE: previously an early return here rendered <GolfSponsorDashboard>
  // without the sidebar — which trapped sponsor users with no way to switch
  // back to player. Sponsor view is now rendered inline in the main content
  // area below (matches the boxing/darts pattern), so the sidebar +
  // RoleSwitcher remain accessible.

  // Mobile shell — short-circuit the desktop chrome so the mobile home
  // renders edge-to-edge with the bottom nav. Mirrors tennis/[slug]/page.tsx.
  if (isMobile) {
    return (
      <MobileSportLayout
        sport="golf"
        activeSection={activeSection}
        onNavigate={setActiveSection}
        sidebarItems={SIDEBAR_ITEMS}
        groupOrder={['OVERVIEW', 'PERFORMANCE', 'TEAM', 'COMMERCIAL', 'OPERATIONS', 'SETTINGS']}
      >
        <PwaInstaller sport="golf" />
        {activeSection === 'dashboard'
          ? <MobileSportHome session={session} config={golfMobileConfig} onNavigate={setActiveSection} />
          : activeSection === 'training'
            ? <MobileSportTraining session={session} config={golfMobileConfig} onNavigate={setActiveSection} />
            : <div className="px-4 py-4">{renderView()}</div>
        }
      </MobileSportLayout>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#07080F', color: '#F9FAFB' }}>
      <PwaInstaller sport="golf" />
      {/* Modal overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeModal}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }} onClick={e => e.stopPropagation()}>
            {activeModal === 'flight' && <GolfFlightFinder onClose={closeModal} session={session} player={player} />}
            {activeModal === 'hotel' && <GolfHotelFinder onClose={closeModal} session={session} />}
            {activeModal === 'coursestrategy' && <GolfCourseStrategyAI onClose={closeModal} session={session} />}
            {activeModal === 'loground' && <GolfRoundLogger onClose={closeModal} />}
            {activeModal === 'trackman' && <GolfLaunchMonitorAnalysis onClose={closeModal} session={session} player={player} />}
            {activeModal === 'caddiebriefai' && <GolfCaddieBriefAI onClose={closeModal} session={session} player={player} />}
            {activeModal === 'matchprep' && <GolfMatchPrepAI onClose={closeModal} session={session} player={player} />}
            {activeModal === 'sponsorpost' && <GolfSponsorPost onClose={closeModal} session={session} player={player} />}
            {activeModal === 'ranking' && <GolfRankingSimulator onClose={closeModal} player={player} />}
            {activeModal === 'injury' && <GolfInjuryLogger onClose={closeModal} session={session} />}
            {activeModal === 'expense' && <GolfExpenseLogger onClose={closeModal} session={session} />}
            {activeModal === 'coursenotes' && <GolfCourseNotes onClose={closeModal} session={session} />}
            {activeModal === 'mentalprep' && <GolfMentalPrepAI onClose={closeModal} session={session} player={player} />}
            {activeModal === 'visa' && <GolfVisaCheck onClose={closeModal} />}
            {activeModal === 'socialmedia' && <GolfSocialMediaAI onClose={closeModal} session={session} player={player} />}
            {activeModal === 'sendmessage' && <GolfSendMessage onClose={closeModal} player={player} session={session} />}
          </div>
        </div>
      )}

      {/* Sponsor obligation toast */}
      {toast && !toastDismissed && (
        <div
          className="fixed bottom-6 right-6 z-50 bg-[#0d0f1a] border border-yellow-500/40 rounded-xl p-4 shadow-2xl w-80"
          style={{ animation: 'golf-toast-in 260ms cubic-bezier(0.2, 0, 0, 1)' }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
@keyframes golf-toast-in {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
          ` }} />
          <div className="flex items-start gap-2 mb-2">
            <span className="text-yellow-400 text-base leading-none">🤝</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider">{toast.sponsor}</div>
              <div className="text-sm text-gray-200 mt-0.5">{toast.message}</div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { setActiveSection('sponsorship'); setToast(null); }}
              className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30 transition-colors"
            >
              Review now
            </button>
            <button
              onClick={() => { setToastDismissed(true); setToast(null); }}
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-gray-800/60 border border-white/5 text-gray-400 hover:text-gray-200 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Role indicator banner for non-player roles */}
      {!isPlayer && !isSponsor && roleConfig.message && (
        <div className="fixed top-0 left-0 right-0 z-30 text-center py-1.5 text-xs font-semibold" style={{ backgroundColor: roleConfig.accent + '20', borderBottom: `1px solid ${roleConfig.accent}40`, color: roleConfig.accent }}>
          {roleConfig.icon} {roleConfig.label} view — {roleConfig.message}
        </div>
      )}

      {/* Sidebar — floating when unpinned, pushes content when pinned */}
      <aside
        className="hidden md:flex flex-col overflow-hidden"
        style={{
          width: sidebarExpanded ? 220 : 72,
          backgroundColor: '#0a0c14',
          borderRight: '1px solid #1F2937',
          transition: 'width 250ms ease',
          position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 40,
        }}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}>
        <div className="flex items-center shrink-0" style={{ borderBottom: '1px solid #1F2937', minHeight: 56, padding: sidebarExpanded ? '12px 10px' : '12px 4px', gap: sidebarExpanded ? 8 : 0 }}>
          <div className="flex items-center gap-2 flex-1 min-w-0" style={{ justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? 4 : 0 }}>
            {liveBrandLogo
              ? <img src={liveBrandLogo} alt="" className="w-8 h-8 rounded-lg object-contain flex-shrink-0" style={{ background: '#ffffff08', padding: 2 }} />
              : session.logoDataUrl
                ? <img src={session.logoDataUrl} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                : !isFoundingMember
                  ? <img src="/lumio_golf_club_crest.svg" alt="" className="w-8 h-8 rounded-lg object-contain flex-shrink-0" style={{ background: '#ffffff08', padding: 2 }} />
                  : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(21,128,61,0.15)', border: '1px solid rgba(21,128,61,0.3)' }}>⛳</div>
            }
            {sidebarExpanded && <span className="text-xs font-bold uppercase tracking-widest truncate" style={{ color: '#4B5563' }}>{liveBrandName || (!isFoundingMember ? 'LUMIO GOLF CLUB' : 'Lumio Golf')}</span>}
          </div>
          {sidebarExpanded && (
            <button onClick={togglePin} className="shrink-0 p-1 rounded" style={{ color: sidebarPinned ? '#15803D' : '#4B5563', transform: sidebarPinned ? 'rotate(0deg)' : 'rotate(45deg)', transition: 'transform 200ms, color 200ms' }} title={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar open'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z"/></svg>
            </button>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-1.5">
          {groups.map(group => {
            const items = visibleSidebarItems
              .filter(i => i.group === group)
              .sort((a, b) => (a.id === 'settings' ? 1 : b.id === 'settings' ? -1 : 0));
            if (items.length === 0) return null;
            return (
              <div key={group} className="mb-3">
                {sidebarExpanded && <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-2 mb-1">{group}</div>}
                {items.map(item => (
                  <button key={item.id}
                    onClick={() => { setActiveSection(item.id); if (!sidebarPinned) setSidebarHovered(false) }}
                    className="w-full flex items-center gap-2.5 py-2 rounded-lg mb-0.5 transition-all text-left"
                    style={{
                      backgroundColor: activeSection === item.id ? 'rgba(21,128,61,0.12)' : 'transparent',
                      color: activeSection === item.id ? '#86efac' : '#6B7280',
                      borderLeft: activeSection === item.id ? '2px solid #15803D' : '2px solid transparent',
                      paddingLeft: sidebarExpanded ? 10 : 0,
                      justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                    }}
                    title={sidebarExpanded ? undefined : item.label}>
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    {sidebarExpanded && <span className="text-xs font-medium truncate">{item.label}</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
        <RoleSwitcher
          session={liveSession}
          roles={GOLF_ROLES}
          accentColor="#15803D"
          onRoleChange={(role) => {
            setRoleOverride(role)
            // Reset activeSection to the new role's first allowed tab so we
            // never render player content under a sponsor view (or vice versa).
            const newConfig = GOLF_ROLE_CONFIG[role as keyof typeof GOLF_ROLE_CONFIG]
            if (newConfig) {
              const firstAllowed = newConfig.sidebar === 'all'
                ? SIDEBAR_ITEMS[0]?.id
                : newConfig.sidebar[0]
              if (firstAllowed) setActiveSection(firstAllowed)
            }
            const key = 'lumio_golf_demo_session'
            const stored = localStorage.getItem(key)
            if (stored) { const parsed = JSON.parse(stored); localStorage.setItem(key, JSON.stringify({ ...parsed, role })) }
          }}
          sidebarCollapsed={!sidebarExpanded}
        />
        {sidebarExpanded && (
          <div className="p-3 border-t border-gray-800">
            <div className="text-[9px] text-gray-700 uppercase tracking-wider font-medium">Plan</div>
            <div className="text-xs text-green-400 font-semibold mt-0.5">Pro+ · £349/mo</div>
          </div>
        )}
        <button onClick={() => {
          if (onSignOut) { onSignOut(); return }
          clearDemoSession('golf')
          window.location.href = '/golf/demo'
        }} className="flex items-center gap-2 w-full px-4 py-2.5 text-xs transition-all hover:bg-red-600/10" style={{ borderTop: '1px solid #1F2937', color: '#6B7280', justifyContent: sidebarExpanded ? 'flex-start' : 'center' }} title="Sign out">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          {sidebarExpanded && <span>Sign out</span>}
        </button>
        <div className="p-4 border-t flex items-center justify-center" style={{ borderColor: '#1F2937' }}>
          {sidebarExpanded ? <img src="/golf_logo.png" alt="Lumio Golf" className="h-8 object-contain opacity-70 hover:opacity-100 transition-opacity" /> : <span className="text-lg">⛳</span>}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0" style={{ marginLeft: sidebarPinned ? 220 : 72, transition: 'margin-left 250ms ease', marginTop: !isPlayer && !isSponsor && roleConfig.message ? '32px' : 0 }}>
        {/* Demo workspace banner — hidden when rendered inside /golf/app for a real signed-in user */}
        {session.isDemoShell !== false && (
          <div className="flex items-center justify-between px-6 py-2 text-xs font-medium flex-shrink-0"
            style={{ backgroundColor: '#15803D', color: '#ffffff' }}>
            <span>This is a demo · sample data</span>
            <a href="/sports-signup" className="flex items-center gap-1 hover:underline font-semibold" style={{ color: '#ffffff' }}>
              Get founding access →
            </a>
          </div>
        )}

        {/* Content + card. Sponsor view renders the sponsor dashboard inline
            (no right column); other roles render the normal view + right column. */}
        <div className="flex-1 flex overflow-hidden">
          {isSponsor ? (
            <div className="flex-1 overflow-y-auto"><GolfSponsorDashboard session={session} player={player} /></div>
          ) : (<>
          <div className="flex-1 overflow-y-auto p-6">{renderView()}</div>
          {/* Right column */}
          <div className="hidden lg:flex flex-col items-center gap-4 p-4 border-l border-gray-800 flex-shrink-0" style={{ width: '220px' }}>
            <PlayerCard player={player} session={session} setActiveSection={setActiveSection} />
            {session.isDemoShell !== false && (<>
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">This Week</div>
              <div className="text-xs text-green-400 font-medium">● In Progress</div>
              <div className="text-xs text-gray-300 mt-1">Halden Motors International Open</div>
              <div className="text-xs text-gray-500">Munich · R1 Thu 09:42</div>
              <div className="mt-2 text-xs text-yellow-400">Win = £1.32M · 1,335 pts</div>
            </div>
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Next Events</div>
              {['Scottish Open (Meridian Series)', 'The Open (Major)', 'British Masters', 'Omega Euro Masters'].map((t, i) => (
                <div key={i} className="text-xs text-gray-400 py-1 border-b border-gray-800/50 last:border-0">{t}</div>
              ))}
            </div>
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Alerts</div>
              <div className="space-y-1.5">
                <div className="text-xs text-red-400">🔴 Vanta Sports renewal: 18d</div>
                <div className="text-xs text-yellow-400">⚠️ 330 pts expire Jul 12</div>
                <div className="text-xs text-yellow-400">⚠️ Vanta Sports post due today</div>
                <div className="text-xs text-blue-400">📞 Vanta Sports call: 16:00</div>
              </div>
            </div>
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">SG Alerts</div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-xs text-red-400">Putting: -1.18</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-500"></span><span className="text-xs text-teal-400">Off Tee: +0.41</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span><span className="text-xs text-orange-400">Approach: -0.28</span></div>
              </div>
            </div>
            </>)}
          </div>
          </>)}
        </div>
      </div>
    </div>
  );
}


