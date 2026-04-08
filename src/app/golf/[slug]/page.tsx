'use client';

import { useState, useEffect } from 'react';
import { Clipboard, Activity, Heart, BarChart, Map, DollarSign, Handshake, Star, TrendingUp } from 'lucide-react';

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
  { id: 'settings',      label: 'Settings',             icon: '⚙️', group: 'OPERATIONS' },
  { id: 'arccos',        label: 'Arccos Integration',   icon: '📡', group: 'INTEGRATIONS' },
  { id: 'datagolf',      label: 'DataGolf Integration', icon: '🌐', group: 'INTEGRATIONS' },
  { id: 'trackman',      label: 'TrackMan Integration', icon: '🎯', group: 'INTEGRATIONS' },
  { id: 'shotlink',      label: 'ShotLink (Phase 3)',   icon: '🔗', group: 'INTEGRATIONS' },
  { id: 'lpga',          label: 'LPGA / LET Mode',      icon: '🏆', group: 'INTEGRATIONS' },
  { id: 'mobileapp',     label: 'Mobile App',           icon: '📲', group: 'INTEGRATIONS' },
];

// ─── DEMO PLAYER ─────────────────────────────────────────────────────────────
const DEMO_PLAYER: GolfPlayer = {
  id: 'golfer-demo-001',
  name: 'James Harrington',
  slug: 'james-harrington',
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
      <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-gray-400 mt-1 ml-7">{subtitle}</p>}
  </div>
);

const TourBadge = ({ tier }: { tier: string }) => {
  const colors: Record<string, string> = {
    'Major': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    'Rolex Series': 'bg-purple-600/20 text-purple-400 border border-purple-600/30',
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
  const cats = [{ label: 'Majors', val: 45, color: '#EAB308' }, { label: 'Rolex Series', val: 78, color: '#6C3FC5' }, { label: 'DP World Tour', val: 124, color: '#0D9488' }, { label: 'Pro-Ams', val: 38, color: '#3B82F6' }];
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
const PlayerCard = ({ player, setActiveSection = () => {} }: { player: GolfPlayer; setActiveSection?: (s: string) => void }) => (
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
          <div className="text-3xl font-black text-white leading-none">{player.owgr}</div>
          <div className="text-[10px] text-green-400 font-medium uppercase tracking-wider">OWGR</div>
        </button>
        <div className="text-2xl">{player.flag}</div>
      </div>
      <div className="w-full h-28 rounded-lg mb-3 flex items-center justify-center text-6xl"
        style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.15) 0%, rgba(13,148,136,0.15) 100%)', border: '1px solid rgba(22,163,74,0.2)' }}>
        ⛳
      </div>
      <div className="text-white font-black text-sm uppercase tracking-wide text-center leading-tight mb-0.5">{player.name.split(' ')[0]}</div>
      <div className="text-green-400 font-bold text-xs uppercase tracking-widest text-center mb-3">{player.name.split(' ').slice(1).join(' ')}</div>
      <div className="grid grid-cols-3 gap-1 mb-2">
        {[
          { val: player.owgr_points.toFixed(1), label: 'PTS AVG' },
          { val: `#${player.race_to_dubai_pos}`, label: 'DUBAI' },
          { val: `#${player.career_high_owgr}`, label: 'CAREER' },
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
);

// ─── VIEWS ────────────────────────────────────────────────────────────────────

const POINTS_EXPIRY = [
  { event: 'Genesis Scottish Open', pos: 'T6', points: 330, expires: 'Jul 12 2026', urgency: 'high' },
  { event: 'KLM Open', pos: 'T3', points: 480, expires: 'Jun 7 2026', urgency: 'medium' },
  { event: 'BMW PGA Championship', pos: 'T14', points: 88, expires: 'Sep 6 2026', urgency: 'low' },
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

function DashboardView({ player, setActiveSection }: { player: GolfPlayer; setActiveSection: (s: string) => void }) {
  const recentForm = [
    { event: 'BMW PGA', pos: '14', points: 88, prize: '£42k' },
    { event: 'Scottish Open', pos: '6', points: 330, prize: '£198k' },
    { event: 'US Open', pos: 'MC', points: 0, prize: '£0' },
    { event: 'KLM Open', pos: '3', points: 480, prize: '£124k' },
    { event: 'Austrian Alpine', pos: '31', points: 42, prize: '£18k' },
  ];
  const tasks = [
    { time: '07:30', task: 'AI Morning Briefing', done: true },
    { time: '08:30', task: 'Pete — practice session: putting from 8–15ft (120 min)', done: true },
    { time: '11:00', task: 'Short game: bunker practice with Dave (45 min)', done: false },
    { time: '13:00', task: 'Physio — lower back treatment with Tom', done: false },
    { time: '14:30', task: 'Pro-Am briefing: BMW International — partners confirmed', done: false },
    { time: '16:00', task: 'TaylorMade equipment review call (45 min)', done: false },
    { time: 'By 18:00', task: 'Callaway Instagram post due — Sarah has drafted caption', done: false },
    { time: '20:00', task: 'Dr. Reed — mental performance check-in (video call)', done: false },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="🏠" title={`Good morning, ${player.name.split(' ')[0]}.`} subtitle="Here's your overview for today — BMW International Open, Munich." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="OWGR" value={`#${player.owgr}`} sub="▲3 this week" color="green" />
        <StatCard label="Race to Dubai" value={`#${player.race_to_dubai_pos}`} sub="Top 50 = card secured" color="teal" />
        <StatCard label="OWGR Pts Avg" value={player.owgr_points.toFixed(2)} sub="Rolling 104 weeks" color="purple" />
        <StatCard label="Career High" value={`#${player.career_high_owgr}`} sub="May 2025" color="orange" />
      </div>
      {/* This week's event */}
      <div className="bg-gradient-to-r from-green-900/30 to-teal-900/20 border border-green-600/30 rounded-xl p-5">
        <div className="text-xs text-green-400 font-semibold uppercase tracking-wider mb-3">THIS WEEK — BMW INTERNATIONAL OPEN · MUNICH · DP WORLD TOUR</div>
        <div className="grid grid-cols-3 gap-4">
          <div><div className="text-xs text-gray-500 mb-1">Tee Time — R1</div><div className="text-white font-bold text-lg">09:42</div><div className="text-xs text-gray-400">Thursday · Hole 1</div></div>
          <div><div className="text-xs text-gray-500 mb-1">Course Fit Score</div><div className="text-teal-400 font-bold text-lg">8.1 / 10</div><div className="text-xs text-gray-400">3rd best fit on tour</div></div>
          <div><div className="text-xs text-gray-500 mb-1">Prize Fund</div><div className="text-white font-bold text-lg">$4.5M</div><div className="text-xs text-gray-400">Win = £1.32M</div></div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-400">
          SG Putting alert: <span className="text-yellow-400 font-medium">losing 1.18 strokes/round</span> from 8–15ft over last 6 events · Focus of today's session
        </div>
      </div>
      {/* Quick Actions Bar */}
      <div className="flex items-center gap-3 border-b border-t border-gray-800/50 bg-[#0a0c14]">
        <span className="text-xs text-gray-500 font-medium px-4 whitespace-nowrap">Quick Actions</span>
        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[
            { icon: <Clipboard size={12} />, label: 'Caddie Sheet', target: 'caddie' },
            { icon: <Activity size={12} />, label: 'Log Practice', target: 'practicelog' },
            { icon: <Heart size={12} />, label: 'Log Injury', target: 'physio' },
            { icon: <BarChart size={12} />, label: 'SG Analysis', target: 'strokes' },
            { icon: <Map size={12} />, label: 'Course Fit', target: 'coursefit' },
            { icon: <DollarSign size={12} />, label: 'Prize Money', target: 'financial' },
            { icon: <Handshake size={12} />, label: 'Sponsor Check', target: 'sponsorship' },
            { icon: <Star size={12} />, label: 'Pro-Am Prep', target: 'proam' },
            { icon: <TrendingUp size={12} />, label: 'OWGR Tracker', target: 'owgr' },
          ].map((a, i) => (
            <button key={i} onClick={() => setActiveSection(a.target)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap shrink-0 bg-green-700 text-gray-50">
              {a.icon}{a.label}
            </button>
          ))}
        </div>
      </div>
      {/* Recent form */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Recent Form — Last 5 Events</div>
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
      {/* Alerts */}
      <div className="grid grid-cols-3 gap-4">
        {(() => {
          const now = new Date();
          const upcoming = POINTS_EXPIRY.filter(e => new Date(e.expires) >= now);
          if (upcoming.length === 0) {
            return (
              <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-4">
                <div className="text-gray-300 text-sm font-semibold mb-1">✅ Points Expiring</div>
                <div className="text-white font-bold text-lg">All clear</div>
                <div className="text-xs text-gray-500">No upcoming expiries in the next 104 weeks.</div>
              </div>
            );
          }
          const sorted = [...upcoming].sort((a, b) => new Date(a.expires).getTime() - new Date(b.expires).getTime());
          const primary = sorted[0];
          const secondary = sorted[1];
          const urg = getExpiryUrgency(primary.expires);
          const palette: Record<string, { bg: string; border: string; text: string; badgeBg: string }> = {
            red:    { bg: 'bg-red-500/10',    border: 'border-red-500/40',    text: 'text-red-400',    badgeBg: 'bg-red-500/20' },
            yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', badgeBg: 'bg-yellow-500/20' },
            gray:   { bg: 'bg-gray-800/40',   border: 'border-gray-700/40',   text: 'text-gray-300',   badgeBg: 'bg-gray-700/40' },
          };
          const c = palette[urg.color];
          const secondaryUrg = secondary ? getExpiryUrgency(secondary.expires) : null;
          const showSecondary = secondaryUrg && secondaryUrg.daysLeft <= 60;
          return (
            <div className={`${c.bg} border ${c.border} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-1">
                <div className={`${c.text} text-sm font-semibold`}>⚠️ Points Expiring</div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${c.badgeBg} ${c.text} uppercase tracking-wider`}>{urg.label}</span>
              </div>
              <div className="text-white font-bold text-lg">{primary.points} pts · {urg.daysLeft < 0 ? 'EXPIRED' : `${urg.daysLeft} days`}</div>
              <div className="text-xs text-gray-400">{primary.event} {primary.pos} — expires {primary.expires}</div>
              {showSecondary && (
                <div className="text-[11px] text-gray-500 mt-1.5 pt-1.5 border-t border-white/5">
                  Next: {secondary.points} pts · {secondary.event} {secondary.pos} ({secondaryUrg!.daysLeft} days)
                </div>
              )}
            </div>
          );
        })()}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="text-blue-400 text-sm font-semibold mb-1">📋 Obligation Today</div>
          <div className="text-white font-bold text-lg">Callaway Post</div>
          <div className="text-xs text-gray-400">Caption drafted by Sarah — review in Sponsorship tab</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="text-green-400 text-sm font-semibold mb-1">💰 Prize This Week</div>
          <div className="text-white font-bold text-lg">Win = £1.32M</div>
          <div className="text-xs text-gray-400">T10 = £142k · MC = £0 + travel costs</div>
        </div>
      </div>
      {/* Today schedule */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">TODAY'S SCHEDULE</div>
        <div className="space-y-2">
          {tasks.map((t, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${t.done ? 'bg-gray-900/30 border-gray-800/50 opacity-50' : 'bg-[#0d0f1a] border-gray-800'}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${t.done ? 'border-teal-500 bg-teal-500/20' : 'border-gray-600'}`}>
                {t.done && <span className="text-teal-400 text-xs">✓</span>}
              </div>
              <div className="text-xs text-gray-500 w-16 flex-shrink-0">{t.time}</div>
              <div className={`text-sm ${t.done ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{t.task}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Season Intelligence Strip */}
      <SeasonIntelligenceStrip />
    </div>
  );
}

// ─── Round Prep (with AI post-round debrief) ─────────────────────────────────
function RoundPrepView() {
  const [tab, setTab] = useState<'prep'|'debrief'|'scorecard'>('prep');
  const [form, setForm] = useState({
    tournament: 'BMW International Open',
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

  async function generateDebrief() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          system: 'You are Lumio AI, golf performance analyst for James Harrington (#87 OWGR, DP World Tour). Be direct, data-driven, and specific. 2-3 sentences per section.',
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
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-8 text-center">
          <div className="text-5xl mb-3">🎯</div>
          <h2 className="text-lg font-bold text-white mb-2">Round Prep</h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto">Hole-by-hole strategy, playing conditions, and pre-round routine — see Caddie Workflow for the full yardage book.</p>
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

function MorningBriefingView({ player }: { player: GolfPlayer }) {
  const [recipient, setRecipient] = useState<'player'|'caddie'|'coach'|'agent'>('player');
  const [briefings, setBriefings] = useState<Record<string, string>>({ player: '', caddie: '', coach: '', agent: '' });
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateBriefings() {
    setLoading(true);
    setError(null);
    try {
      const prompt = `You are Lumio AI, the golf performance assistant for ${player.name}. Generate four morning briefings (player, caddie, coach, agent) for today. Context: OWGR #${player.owgr}, Race to Dubai #${player.race_to_dubai_pos}, current event BMW International Open Munich, tee time 09:42 Thursday, SG Putting -1.18 (critical weakness from 8-15ft), Callaway post due today, TaylorMade call 16:00, sponsor renewal in 18 days. Respond ONLY with valid JSON: { "player": "...", "caddie": "...", "coach": "...", "agent": "..." } — each value is a 2-3 sentence briefing, no markdown.`;
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
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

function OWGRView({ player }: { player: GolfPlayer }) {
  const scenarios = [
    { result: 'Win', event: 'BMW International', newOWGR: 71, change: '+16', rtd: 'T35' },
    { result: 'T2–T5', event: 'BMW International', newOWGR: 79, change: '+8', rtd: 'T41' },
    { result: 'T6–T10', event: 'BMW International', newOWGR: 83, change: '+4', rtd: 'T42' },
    { result: 'T11–T20', event: 'BMW International', newOWGR: 86, change: '+1', rtd: 'T43' },
    { result: 'T21–T40', event: 'BMW International', newOWGR: 88, change: '-1', rtd: 'T44' },
    { result: 'MC', event: 'BMW International', newOWGR: 92, change: '-5', rtd: 'T46' },
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
            { pos: 1, name: 'R. McIlroy', country: '🇮🇪', pts: 4280, safe: true },
            { pos: 2, name: 'T. Fleetwood', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', pts: 3840, safe: true },
            { pos: 3, name: 'R. MacIntyre', country: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', pts: 3210, safe: true },
            { pos: 10, name: 'V. Hovland', country: '🇳🇴', pts: 2140, safe: true },
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
        <div className="text-sm font-semibold text-white mb-4">🎯 Scenario Modelling — BMW International Open</div>
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
    </div>
  );
}

type OptimiserResult = {
  must_play: { event: string; reason: string }[];
  consider_skipping: { event: string; reason: string }[];
  season_strategy: string;
};

function ScheduleOptimiser() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimiserResult | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: 'You are Lumio AI, strategic golf career analyst. Be direct and specific — this player takes your recommendations seriously.',
          messages: [{
            role: 'user',
            content: 'Optimise the tournament schedule for James Harrington. His profile: OWGR #87 (target #61 career high, #50 for Major invitations), Race to Dubai #43 (needs top 50, currently +260 pts behind cut), SG profile: OTT +0.41, ATG -0.28, Putting -1.18 (critical weakness). Course fit scores: BMW International 8.1, BMW PGA 9.0, Scottish Open 7.2, The Open 6.8, Omega European Masters 8.8, Dunhill Links 7.0. Current season prize money £367k. He is entered in: BMW International (this week), Scottish Open, The Open, British Masters, Omega Euro Masters. Which 5 remaining events should he absolutely prioritise, and which 2 should he consider skipping if fatigued? Respond ONLY in JSON: { "must_play": [{"event": "...", "reason": "..."}, ...], "consider_skipping": [{"event": "...", "reason": "..."}], "season_strategy": "2 sentence overall advice" }',
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

function ScheduleView() {
  const [tab, setTab] = useState<'calendar' | 'competitors'>('calendar');
  const calendar = [
    { date: '3–6 Jul',   event: 'BMW International Open',         tier: 'DP World Tour',  venue: 'Golfclub München Eichenried, Munich',    status: 'active',   entered: true, prize: '$4.5M' },
    { date: '10–13 Jul', event: 'Estrella Damm N.A. Challenge',   tier: 'DP World Tour',  venue: 'Club de Golf Terramar, Barcelona',         status: 'upcoming', entered: true, prize: '$2M' },
    { date: '10–13 Jul', event: 'Genesis Scottish Open',           tier: 'Rolex Series',   venue: 'The Renaissance Club, North Berwick',     status: 'upcoming', entered: true, prize: '$9M' },
    { date: '17–20 Jul', event: 'The 154th Open Championship',     tier: 'Major',          venue: 'Royal Birkdale, Southport',               status: 'upcoming', entered: true, prize: '£17M' },
    { date: '14–17 Aug', event: 'Danish Golf Championship',        tier: 'DP World Tour',  venue: 'Great Northern, Funen, Denmark',          status: 'upcoming', entered: false, prize: '$2M' },
    { date: '28–31 Aug', event: 'British Masters (Belfry)',        tier: 'DP World Tour',  venue: 'The Belfry, Sutton Coldfield',            status: 'upcoming', entered: true, prize: '$2.5M' },
    { date: '4–7 Sep',   event: 'Omega European Masters',          tier: 'DP World Tour',  venue: 'Crans-sur-Sierre, Switzerland',           status: 'upcoming', entered: true, prize: '$3M' },
    { date: '17–20 Sep', event: 'BMW PGA Championship',            tier: 'Rolex Series',   venue: 'Wentworth Club, Surrey',                  status: 'upcoming', entered: true, prize: '$9M' },
    { date: '1–4 Oct',   event: 'Alfred Dunhill Links Championship', tier: 'DP World Tour', venue: 'St Andrews / Carnoustie / Kingsbarns',  status: 'upcoming', entered: true, prize: '$5M' },
    { date: '6–9 Nov',   event: 'Abu Dhabi Championship',          tier: 'Rolex Series',   venue: 'Yas Links, Abu Dhabi',                    status: 'upcoming', entered: false, prize: '$9M' },
    { date: '19–22 Nov', event: 'DP World Tour Championship',      tier: 'Rolex Series',   venue: 'Jumeirah Golf Estates, Dubai',            status: 'upcoming', entered: false, prize: '$10M+' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="🗓️" title="Tournament Schedule" subtitle="2026 season calendar — DP World Tour, Majors, Rolex Series, and co-sanctioned events." />
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
        Connect Arccos to auto-populate from real round data.
      </div>
    </div>
  );
}

function StrokesGainedView() {
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
    </div>
  );
}

function CourseFitView() {
  const courses = [
    { event: 'BMW International Open', venue: 'Golfclub München Eichenried', fit: 8.1, ott: 9.2, atg: 7.4, putting: 6.8, prevResult: 'T14 (2024)', note: 'Approach from 150–175 is elite. Putting surface suits right-to-left readers.' },
    { event: 'BMW PGA Championship', venue: 'Wentworth', fit: 9.0, ott: 8.8, atg: 9.1, putting: 7.2, prevResult: 'T6 (2024)', note: 'Best course fit on tour. Long course favours his driving distance.' },
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
    </div>
  );
}

function CaddieView() {
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
<div class="sub">James Harrington · Round 1 · Thu 09:42 &nbsp;|&nbsp; ${today}</div>
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
    </div>
  );
}

function TeamHubView({ player }: { player: GolfPlayer }) {
  const team = [
    { role: 'Lead Coach', name: 'Pete Larsen', flag: '🇸🇪', status: 'On-site Munich', statusColor: 'green', lastNote: 'Practice session notes uploaded · 08:30', desc: 'Full swing, course management, practice structure' },
    { role: 'Short Game Coach', name: 'Dave Pelz Jr.', flag: '🇺🇸', status: 'Remote (video)', statusColor: 'blue', lastNote: 'Putting drill programme sent · Yesterday', desc: 'Putting, chipping, bunker play, wedge game' },
    { role: 'Caddie', name: 'Mick O\'Brien', flag: '🇮🇪', status: 'On-site Munich', statusColor: 'green', lastNote: 'Strategy notes updated · 07:45', desc: 'Shot selection, yardage book, on-course support' },
    { role: 'Physio', name: 'Tom Walsh', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', status: 'Treatment at 13:00', statusColor: 'yellow', lastNote: 'Lower back flagged mild · Cleared to play', desc: 'Treatment, injury management, recovery protocols' },
    { role: 'Fitness Trainer', name: 'Jake Portman', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', status: 'London (remote)', statusColor: 'blue', lastNote: 'Weekly conditioning plan sent', desc: 'Strength, power, mobility, periodisation' },
    { role: 'Agent', name: 'Sarah Mitchell', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', status: 'TaylorMade renewal!', statusColor: 'red', lastNote: 'Callaway caption drafted — awaiting approval', desc: 'Sponsorship, appearances, schedule, commercial' },
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
    </div>
  );
}

function PhysioView() {
  const recovery = [
    { day: 'Today', score: 78, hrv: 62, rhr: 52, sleep: 7.0 },
    { day: 'Yesterday', score: 84, hrv: 68, rhr: 50, sleep: 7.8 },
    { day: '2 days ago', score: 71, hrv: 58, rhr: 55, sleep: 6.4 },
    { day: '3 days ago', score: 88, hrv: 72, rhr: 48, sleep: 8.1 },
    { day: '4 days ago', score: 81, hrv: 65, rhr: 51, sleep: 7.5 },
    { day: '5 days ago', score: 76, hrv: 60, rhr: 53, sleep: 6.8 },
    { day: '6 days ago', score: 82, hrv: 67, rhr: 50, sleep: 7.6 },
  ];
  const injuries = [
    { area: 'Lower Back', severity: 'Mild', status: 'Managed', date: 'Ongoing', notes: 'Chronic stiffness. Daily treatment. Cleared for all activity. Watch 4th round fatigue.', cleared: false },
    { area: 'Left Wrist', severity: 'Resolved', status: 'Clear', date: '14 Apr', notes: 'Tendinopathy. Fully resolved after 3 weeks rest.', cleared: true },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="⚕️" title="Physio & Recovery" subtitle="Injury log, medical clearance, WHOOP recovery scores, and treatment protocols." />
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Recovery Score" value="78/100" sub="Today (WHOOP)" color="teal" />
        <StatCard label="HRV" value="62ms" sub="▼6ms vs yesterday" color="orange" />
        <StatCard label="Resting HR" value="52 bpm" sub="Travel fatigue flag" color="blue" />
        <StatCard label="Sleep" value="7.0 hrs" sub="Below 7.5 target" color="yellow" />
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Recovery Trend — 7 Days (WHOOP)</div>
        <div className="space-y-2">
          {recovery.map((r, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="text-xs text-gray-500 w-20 flex-shrink-0">{r.day}</div>
              <div className="flex-1 bg-gray-800 rounded-full h-2">
                <div className={`h-2 rounded-full ${r.score >= 80 ? 'bg-teal-500' : r.score >= 65 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${r.score}%` }}></div>
              </div>
              <div className={`text-sm font-bold w-10 text-right ${r.score >= 80 ? 'text-teal-400' : r.score >= 65 ? 'text-yellow-400' : 'text-red-400'}`}>{r.score}</div>
              <div className="text-xs text-gray-500 w-16">HRV {r.hrv}ms</div>
              <div className="text-xs text-gray-500 w-14">{r.sleep}h sleep</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Injury Log</div>
        {injuries.map((inj, i) => (
          <div key={i} className={`p-4 rounded-lg border mb-2 ${inj.cleared ? 'border-gray-800 bg-gray-900/20' : 'border-yellow-600/30 bg-yellow-600/5'}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{inj.area}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${inj.cleared ? 'bg-teal-600/20 text-teal-400' : 'bg-yellow-600/20 text-yellow-400'}`}>{inj.severity}</span>
              </div>
              <div className="text-xs text-gray-500">{inj.date}</div>
            </div>
            <div className="text-xs text-gray-400">{inj.notes}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EquipmentView() {
  const bag = [
    { club: 'Driver', brand: 'TaylorMade Qi10 Max', loft: '9.5°', shaft: 'Graphite Design Tour AD XC', flex: 'X', notes: 'Main gaming driver — 3 available' },
    { club: '3-Wood', brand: 'TaylorMade Qi10', loft: '15°', shaft: 'Mitsubishi Diamana Blue', flex: 'X', notes: 'Used for tight tee shots and second shots' },
    { club: '5-Wood', brand: 'TaylorMade Qi10', loft: '19°', shaft: 'Mitsubishi Diamana Blue', flex: 'X', notes: 'Used on long par-5 second shots' },
    { club: '4-Iron', brand: 'TaylorMade P·790', loft: '23°', shaft: 'Dynamic Gold X100', flex: 'X', notes: 'Punchy iron in driving conditions' },
    { club: '5–PW', brand: 'TaylorMade P·770', loft: 'Standard', shaft: 'Dynamic Gold X100', flex: 'X', notes: 'Core irons — stock specs' },
    { club: '50° GW', brand: 'Callaway Jaws Raw', loft: '50°', shaft: 'Dynamic Gold Spinner', flex: 'S', notes: 'Callaway endorsement — gap wedge' },
    { club: '54° SW', brand: 'Callaway Jaws Raw', loft: '54°', shaft: 'Dynamic Gold Spinner', flex: 'S', notes: 'Sand & rough — most used wedge' },
    { club: '60° LW', brand: 'Callaway Jaws Raw', loft: '60°', shaft: 'Dynamic Gold Spinner', flex: 'S', notes: 'Flop and bunker shots' },
    { club: 'Putter', brand: 'Scotty Cameron X5.5', loft: '3°', shaft: 'Stock', flex: 'N/A', notes: 'Tournament putter — has backup' },
    { club: 'Ball', brand: 'Callaway Chrome Tour X', loft: '—', shaft: '—', flex: '—', notes: 'Callaway endorsement — 2 dozen per round' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="🛍️" title="Equipment & Bag" subtitle="Full bag setup, club specifications, and ball contract details." />
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4"><div className="text-white font-bold">TaylorMade</div><div className="text-xs text-gray-400 mt-1">Clubs (irons, woods)</div><div className="text-xs text-teal-400 mt-1">Active — expires Dec 2026</div></div>
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4"><div className="text-white font-bold">Callaway</div><div className="text-xs text-gray-400 mt-1">Wedges + Ball</div><div className="text-xs text-teal-400 mt-1">Active — 18 days to renewal</div></div>
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
    </div>
  );
}

function MentalView() {
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
    </div>
  );
}

function SponsorshipView() {
  const deals = [
    { sponsor: 'TaylorMade', cat: 'Clubs', value: '£80k/yr + bonuses', status: 'Active', expiry: 'Dec 2026', days: 275, obligations: ['Use TaylorMade driver, woods, irons in all events', 'Social: 1 post/month minimum', 'Attend 1 TaylorMade event/yr'], bonuses: ['Win bonus: +£15k', 'Top 50 OWGR: +£10k'] },
    { sponsor: 'Callaway', cat: 'Wedges + Ball', value: '£55k/yr', status: 'Renewal due', expiry: 'Jul 26 2026', days: 18, obligations: ['Callaway wedges in all events', 'Chrome Tour X ball mandatory', 'Social: 2 posts/month', 'Appear in 1 campaign/yr'], bonuses: ['Top 10 this week: +£8.5k'] },
    { sponsor: 'Rolex', cat: 'Watch / Luxury', value: '£45k/yr', status: 'Active', expiry: 'Jan 2027', days: 292, obligations: ['Wear Rolex in all press conferences', 'Ranking report monthly to Rolex brand team'], bonuses: [] },
    { sponsor: 'BMW', cat: 'Vehicle / Title Sponsor', value: 'Vehicle + £30k/yr', status: 'Active', expiry: 'Dec 2026', days: 275, obligations: ['Pro-am partner appearances at BMW events', 'Logo on bag', 'Post-win interview mention'], bonuses: [] },
    { sponsor: 'Puma Golf', cat: 'Apparel', value: '£40k/yr', status: 'Active', expiry: 'Jun 2027', days: 450, obligations: ['Full Puma apparel on course', '2 social posts/month', 'Style shoot once/yr'], bonuses: [] },
    { sponsor: 'Hublot', cat: 'Watch (Alt.)', value: 'Product only', status: 'Under review', expiry: '—', days: 0, obligations: ['Agent in negotiation — no current obligations'], bonuses: [] },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="🤝" title="Sponsorship Manager" subtitle="Every deal, every obligation, every deadline — tracked automatically." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Annual Value" value="£250k+" sub="Confirmed contracts" color="yellow" />
        <StatCard label="Active Deals" value="5" sub="1 renewal critical" color="green" />
        <StatCard label="Callaway Renewal" value="18 days" sub="⚠️ Action required" color="red" />
        <StatCard label="Obligations Today" value="1" sub="Callaway post due" color="orange" />
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
    </div>
  );
}

function FinancialView() {
  const prizeMoney = [
    { event: 'KLM Open', pos: 'T3', amount_eur: 124000, amount_gbp: 104000, tour: 'DP World Tour' },
    { event: 'Austrian Alpine Open', pos: 'T31', amount_eur: 18000, amount_gbp: 15000, tour: 'DP World Tour' },
    { event: 'BMW PGA Championship', pos: 'T14', amount_eur: 42000, amount_gbp: 35000, tour: 'Rolex Series' },
    { event: 'US Open (MC)', pos: 'MC', amount_eur: 0, amount_gbp: 0, tour: 'Major' },
    { event: 'Genesis Scottish Open', pos: 'T6', amount_eur: 198000, amount_gbp: 166000, tour: 'Rolex Series' },
    { event: 'Soudal Open', pos: 'T8', amount_eur: 56000, amount_gbp: 47000, tour: 'DP World Tour' },
  ];
  const totalGBP = prizeMoney.reduce((a, b) => a + b.amount_gbp, 0);
  const taxJurisdictions = [
    { country: '🇬🇧 UK', amount: '£201,000', events: '6 events', status: 'Filed' },
    { country: '🇩🇪 Germany', amount: '€42,000', events: '1 event (BMW)', status: 'Pending' },
    { country: '🇺🇸 USA', amount: '$0', events: 'MC — no liability', status: 'N/A' },
    { country: '🇳🇱 Netherlands', amount: '€124,000', events: '1 event (KLM)', status: 'Open' },
    { country: '🇦🇹 Austria', amount: '€18,000', events: '1 event (Alpine)', status: 'Open' },
  ];
  const earningsBars = [
    { cat: 'Majors',          amount: 45000 },
    { cat: 'Rolex Series',    amount: 78000 },
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
    w.document.write(`<!doctype html><html><head><title>Financial Summary — James Harrington</title><style>
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
            { country: '🇩🇪 Germany', income: '€42,000', events: '1 event (BMW)', status: 'Pending', rate: '25%' },
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
    </div>
  );
}

function CareerView() {
  const [planTab, setPlanTab] = useState<'1yr'|'3yr'|'5yr'|'10yr'>('1yr');
  const plans: Record<string, { title: string; goals: string[]; financial: string[]; milestones: string[] }> = {
    '1yr': {
      title: '2026 Season Targets',
      goals: ['Break into OWGR Top 50 by year-end', 'Win on DP World Tour (first title)', 'Qualify for all 4 Majors 2027 via OWGR', 'Race to Dubai top 30 — qualify for Play-Offs', 'Make cut at The Open Championship (minimum)'],
      financial: ['Prize money target: £450k+', 'Total income (incl. endorsements): £700k', 'Negotiate Callaway renewal: target £65k/yr', 'Explore new financial services or watch partner'],
      milestones: ['Wentworth top 10 (BMW PGA — best course fit)', 'Crans-Montana podium (Omega European Masters)', 'Ryder Cup conversation begins if OWGR hits top 50'],
    },
    '3yr': {
      title: '2026–2028 Career Arc',
      goals: ['Establish OWGR top 30 by end of 2028', 'Win a Rolex Series event', 'Win a Major Championship (stretch target)', 'PGA Tour co-sanction starts — build FedEx Cup presence'],
      financial: ['Annual income target: £1.5M+ (prize + endorsements)', 'Extend TaylorMade to 2030 or find elite upgrade', 'Explore PGA Tour elite tier pricing (£600–800k/yr value)'],
      milestones: ['Race to Dubai winner contention by 2028', 'Ryder Cup selection (if OWGR holds)', 'First PGA Tour card via world ranking'],
    },
    '5yr': {
      title: '2026–2031 Peak Window',
      goals: ['Sustained OWGR top 20', 'Multiple Rolex Series wins', 'Grand Slam appearance in final round', 'Ryder Cup selection at minimum one cycle', 'Consideration for DP World Tour Captaincy later in career'],
      financial: ['Annual income target: £2M+ at peak', 'Explore global non-endemic deals (lifestyle, finance)', 'Property portfolio active — career earnings invested'],
      milestones: ['Age 34 at season end 2031 — peak career window', 'LIV Golf decision point by 2029', 'Media presence growing — broadcast / content plans'],
    },
    '10yr': {
      title: '2026–2036 Long Game',
      goals: ['Transition plan from full-time tour to selective schedule by 35', 'Legacy events: Masters and Open invites into senior career', 'Begin senior / Champions Tour eligibility planning'],
      financial: ['Career earnings target: £15–20M total', 'Coaching, commentary, or academy venture', 'Brand and IP — "James Harrington Golf" academies'],
      milestones: ['Content creation and media career begins post-peak', 'UK golf development ambassador / LTA equivalent role', 'Retirement from full tour: target age 37–40'],
    },
  };
  const plan = plans[planTab];
  return (
    <div className="space-y-6">
      <SectionHeader icon="🚀" title="Career Planning" subtitle="1 / 3 / 5 / 10 year plan — ranking targets, financial milestones, and long-game strategy." />
      <div className="grid grid-cols-4 gap-3">
        {(['1yr','3yr','5yr','10yr'] as const).map(t => (
          <button key={t} onClick={() => setPlanTab(t)}
            className={`p-3 rounded-xl border text-center transition-all ${planTab === t ? 'bg-green-600/20 border-green-500/50' : 'bg-[#0d0f1a] border-gray-800 hover:border-gray-600'}`}>
            <div className="text-sm font-bold text-white">{t}</div>
            <div className="text-xs text-gray-500">Plan</div>
          </button>
        ))}
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-base font-bold text-white mb-5">{plan.title}</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-xs text-green-400 font-semibold uppercase tracking-wider mb-3">🎯 Sporting Goals</div>
            <div className="space-y-2">{plan.goals.map((g, i) => <div key={i} className="flex items-start gap-2 text-sm text-gray-300"><span className="text-green-500 mt-0.5">•</span><span>{g}</span></div>)}</div>
          </div>
          <div>
            <div className="text-xs text-yellow-400 font-semibold uppercase tracking-wider mb-3">💰 Financial Targets</div>
            <div className="space-y-2">{plan.financial.map((f, i) => <div key={i} className="flex items-start gap-2 text-sm text-gray-300"><span className="text-yellow-500 mt-0.5">•</span><span>{f}</span></div>)}</div>
          </div>
          <div>
            <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-3">🏆 Key Milestones</div>
            <div className="space-y-2">{plan.milestones.map((m, i) => <div key={i} className="flex items-start gap-2 text-sm text-gray-300"><span className="text-purple-500 mt-0.5">•</span><span>{m}</span></div>)}</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Current OWGR" value={`#${DEMO_PLAYER.owgr}`} sub="Apr 2026" color="green" />
        <StatCard label="Career High" value={`#${DEMO_PLAYER.career_high_owgr}`} sub="May 2025" color="teal" />
        <StatCard label="Turned Pro" value={DEMO_PLAYER.turned_pro.toString()} sub={`${2026 - DEMO_PLAYER.turned_pro} years on tour`} color="blue" />
        <StatCard label="Age" value={DEMO_PLAYER.age} sub="Peak window now" color="orange" />
      </div>
    </div>
  );
}

function ExemptionsView() {
  const statusCats = [
    { category: 'DP World Tour Card Status', value: '2026 Card holder (Race to Dubai #43)', status: 'Secure', note: 'Top 115 retained cards for 2027. Currently safe.' },
    { category: 'OWGR World Top 50', value: '#87 — not currently top 50', status: 'Watch', note: 'Top 50 earn Masters, Players, and all 4 Majors invitations. #61 career high needed to reactivate.' },
    { category: 'The Open Championship', value: 'Top 100 OWGR — exempt', status: 'Qualified', note: 'Royal Birkdale 2026 — entry confirmed.' },
    { category: 'US Open 2026', value: 'Did not qualify (MC in sectional)', status: 'Not entered', note: 'Shinnecock Hills — missed via OWGR and sectional qualifying.' },
    { category: 'The Masters 2027', value: 'Requires OWGR Top 50 by end of 2026', status: 'Borderline', note: 'Push into Top 50 this year critical for Augusta invitation.' },
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
    </div>
  );
}

function ProAmView() {
  const appearances = [
    { event: 'BMW International Open Pro-Am', date: 'Wed 2 Jul', type: 'Title Sponsor', fee: 'Included (BMW deal)', partners: 'BMW AG executives — briefed', status: 'Tomorrow' },
    { event: 'Callaway Golf Day (Wentworth)', date: '15 Sep', type: 'Equipment partner', fee: '£5,000', partners: 'TBC — agent to confirm', status: 'Confirmed' },
    { event: 'Charity Pro-Am (LTA)', date: '12 Aug', type: 'Charity — LTA', fee: 'No fee (LTA obligation)', partners: 'Mixed celebrity and LTA sponsors', status: 'Confirmed' },
    { event: 'Corporate Day — Barclays', date: '8 Oct', type: 'Corporate appearance', fee: '£22,000', partners: 'Barclays senior management', status: 'Pending contract' },
    { event: 'Abu Dhabi HSBC Pro-Am', date: '4 Nov', type: 'Tournament (Rolex)', fee: 'Included', partners: 'TBC — Abu Dhabi hospitality', status: 'Not yet confirmed' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="⭐" title="Pro-Am & Appearances" subtitle="Pro-am commitments, corporate appearances, charity days, and appearance fee tracker." />
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Appearance Fee Income" value="£38k" sub="YTD 2026" color="green" />
        <StatCard label="Events Committed" value="5" sub="2026 remaining" color="teal" />
        <StatCard label="Next Commitment" value="Tomorrow" sub="BMW International Pro-Am" color="orange" />
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

function PracticeLogView() {
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
    </div>
  );
}

// Generic placeholder for remaining views
function PlaceholderView({ title, icon, description }: { title: string; icon: string; description: string }) {
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
    </div>
  );
}

// ─── ARCCOS INTEGRATION VIEW ──────────────────────────────────────────────────
function ArccosView() {
  const [connected, setConnected] = useState(false);
  const sgFeed = [
    { date: 'Jul 5 — R2 BMW International', ott: 0.6, atg: 0.8, arg: 0.2, putt: -1.4, total: 0.2, rounds: 1 },
    { date: 'Jul 4 — R1 BMW International', ott: 0.4, atg: 1.1, arg: -0.1, putt: -0.9, total: 0.5, rounds: 1 },
    { date: 'Jul 2 — Practice (Eichenried)', ott: null, atg: null, arg: null, putt: -1.2, total: null, rounds: 0 },
    { date: 'Jun 29 — R4 KLM Open', ott: 0.9, atg: 1.3, arg: 0.4, putt: -0.8, total: 1.8, rounds: 1 },
    { date: 'Jun 28 — R3 KLM Open', ott: 0.3, atg: 0.7, arg: 0.2, putt: -1.6, total: -0.4, rounds: 1 },
  ];
  const tourUsers = [
    { name: 'Matt Fitzpatrick', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', tour: 'PGA / DP World', note: 'Used Arccos Pro to win US Open 2022 & DP World Championship 2025' },
    { name: 'Viktor Hovland', flag: '🇳🇴', tour: 'PGA Tour', note: 'SG Approach analytics for course-specific prep' },
    { name: 'Nelly Korda', flag: '🇺🇸', tour: 'LPGA', note: 'Full Arccos Pro suite for competitive analytics' },
    { name: 'Kristoffer Reitan', flag: '🇳🇴', tour: 'DP World Tour', note: '2× DP World Tour winner in 2025 using Arccos Pro Insights' },
    { name: 'Rasmus Neergaard-Petersen', flag: '🇩🇰', tour: 'DP World Tour', note: 'First title at Crown Australian Open 2025 — Arccos Pro user' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="📡" title="Arccos Integration" subtitle="Connect your Arccos sensors to pipe real on-course SG data directly into Lumio Tour." />
      {/* Status Banner */}
      <div className={`rounded-xl p-5 border ${connected ? 'bg-teal-900/20 border-teal-600/40' : 'bg-gray-900/30 border-gray-700'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 ${connected ? 'border-teal-500 bg-teal-500/20' : 'border-gray-600 bg-gray-800'}`}>📡</div>
            <div>
              <div className="text-white font-semibold">Arccos Pro Insights</div>
              <div className="text-xs text-gray-400">Built by Edoardo Molinari · 35+ PGA / DP World / LPGA players</div>
            </div>
          </div>
          <button onClick={() => setConnected(!connected)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${connected ? 'bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30' : 'bg-green-600 text-white hover:bg-green-700'}`}>
            {connected ? 'Disconnect' : 'Connect Arccos'}
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
          <div className="text-sm text-gray-400">Connect your Arccos account to automatically sync on-course SG data from every competitive round — no manual entry required.</div>
        )}
      </div>
      {/* What Arccos unlocks */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">What Arccos Integration Unlocks</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: '📈', title: 'Automatic SG data', desc: 'Every competitive round syncs to your Strokes Gained dashboard without manual entry. Shot-by-shot data from all 14 sensors.' },
            { icon: '🎯', title: 'AI Strategy on-course', desc: 'Tour-proven club recommendations for every hole, powered by 1.5 billion shots and your own dispersion profile.' },
            { icon: '🗺️', title: 'Course fit refinement', desc: 'Your Arccos shot history at a course updates your Course Fit score automatically — no estimate, real data.' },
            { icon: '📋', title: 'Practice session import', desc: 'Arccos tracks practice sessions too. Putting sessions, approach drills, and range work all flow into your Practice Log.' },
            { icon: '📉', title: 'Trend alerts', desc: 'Arccos detects SG deterioration patterns before they become crises. Lumio\'s morning briefing flags them before Pete does.' },
            { icon: '🤝', title: 'Caddie data share', desc: 'Your Arccos dispersion data populates the Caddie Workflow hole strategy notes automatically — sharing becomes instant.' },
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
            <div className="text-sm font-semibold text-white">Live SG Feed — Arccos Data</div>
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
        <div className="text-sm font-semibold text-white mb-4">Tour Players Using Arccos Pro Insights</div>
        <div className="space-y-3">
          {tourUsers.map((u, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-800/50">
              <span className="text-xl">{u.flag}</span>
              <div className="flex-1"><div className="text-sm font-medium text-white">{u.name}</div><div className="text-xs text-gray-400">{u.tour}</div></div>
              <div className="text-xs text-gray-500 max-w-xs text-right">{u.note}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-600">35+ players total across PGA Tour, DP World Tour, and LPGA. Arccos Pro Insights led by Edoardo Molinari (Arccos Chief Data Strategist).</div>
      </div>
      {/* Pricing note */}
      <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
        <div className="text-sm font-semibold text-blue-400 mb-1">ℹ️ Arccos Pro Insights — Access Model</div>
        <div className="text-xs text-gray-400">Arccos Pro Insights is invitation-only for touring professionals — not purchased like the consumer app ($155/yr). Molinari's team recruits players directly. Lumio Tour's integration works with both: Arccos Pro data flows in for invited tour players, consumer Arccos data flows in for all others. The integration requires an Arccos account (consumer or Pro).</div>
      </div>
    </div>
  );
}

// ─── DATAGOLF INTEGRATION VIEW ────────────────────────────────────────────────
function DataGolfView() {
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
      <SectionHeader icon="🌐" title="DataGolf Integration" subtitle="Real OWGR data, SG benchmarks, and course history from the world's best golf analytics API." />
      {/* Status */}
      <div className={`rounded-xl p-5 border ${connected ? 'bg-teal-900/20 border-teal-600/40' : 'bg-gray-900/30 border-gray-700'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 ${connected ? 'border-teal-500 bg-teal-500/20' : 'border-gray-600 bg-gray-800'}`}>🌐</div>
            <div>
              <div className="text-white font-semibold">DataGolf API</div>
              <div className="text-xs text-gray-400">PGA Tour ShotLink partnership · DP World, Korn Ferry, LIV, Asian Tour coverage</div>
            </div>
          </div>
          <button onClick={() => setConnected(!connected)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${connected ? 'bg-red-600/20 text-red-400 border border-red-600/30' : 'bg-green-600 text-white hover:bg-green-700'}`}>
            {connected ? 'Disconnect' : 'Connect DataGolf'}
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
          <div className="text-sm text-gray-400">DataGolf is the most important single integration for Lumio Tour. It powers the live OWGR tracker, the 104-week points expiry calendar, course fit scores, and SG benchmarks with real competition data — not estimates.</div>
        )}
      </div>
      {/* Why this matters */}
      <div className="bg-[#0d0f1a] border border-green-600/30 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Why DataGolf Is the Highest-Priority Integration</div>
        <div className="text-sm text-gray-300 leading-relaxed">Without DataGolf, Lumio Tour's OWGR tracker relies on user-entered data. With it, every Monday morning the platform automatically pulls the updated ranking, calculates which historical points are now in their 13th week (no longer at full value), flags points entering the final quarter of their 104-week window, and updates the scenario model for the current week's event. The difference between "manually checked" and "automatically updated" is the difference between a tool and an operating system.</div>
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
        <div className="p-4 border-b border-gray-800"><div className="text-sm font-semibold text-white">Tour Coverage — DataGolf API</div></div>
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
        <div className="text-xs text-gray-400">DataGolf offers a free tier for public data. The paid API tier (needed for SG categories, course history, and real-time data) starts at approximately $150–$500/month depending on call volume and data depth. For Lumio Tour, this is a backend cost — not charged to players — absorbed as product infrastructure.</div>
      </div>
    </div>
  );
}

// ─── TRACKMAN INTEGRATION VIEW ────────────────────────────────────────────────
function TrackManView() {
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
      <SectionHeader icon="🎯" title="TrackMan Integration" subtitle="Import practice session data from TrackMan into the practice log — bridging range work to on-course SG." />
      {/* Status */}
      <div className={`rounded-xl p-5 border ${connected ? 'bg-teal-900/20 border-teal-600/40' : 'bg-gray-900/30 border-gray-700'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 ${connected ? 'border-teal-500 bg-teal-500/20' : 'border-gray-600 bg-gray-800'}`}>🎯</div>
            <div>
              <div className="text-white font-semibold">TrackMan 4 / TrackMan iO</div>
              <div className="text-xs text-gray-400">Pete Larsen's unit · Serial: TM4-2847 · NTC London + on-site at events</div>
            </div>
          </div>
          <button onClick={() => setConnected(!connected)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${connected ? 'bg-red-600/20 text-red-400 border border-red-600/30' : 'bg-green-600 text-white hover:bg-green-700'}`}>
            {connected ? 'Disconnect' : 'Connect TrackMan'}
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
          <div className="text-sm text-gray-400">Connect Pete's TrackMan unit to automatically import every practice session. Ball speed, launch angle, spin rate, carry distance, and dispersion all flow into your Practice Log — and link to your on-course SG trends.</div>
        )}
      </div>
      {/* Why it matters */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">The Practice ↔ Competition Bridge</div>
        <div className="text-sm text-gray-300 leading-relaxed">Most touring professionals have excellent TrackMan data from practice — and no way to connect it to their on-course performance. Pete knows your ball speed has dropped 2mph on 7-iron. He doesn't know whether that's causing the -0.28 SG:Approach on-course, or whether it's a different problem. Lumio Tour connects these: when your TrackMan carry distance changes, the system flags whether it correlates with a shift in your competition SG:Approach. That's a genuine marginal gain.</div>
      </div>
      {/* Sessions */}
      {connected && (
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800"><div className="text-sm font-semibold text-white">Recent TrackMan Sessions</div></div>
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
        <div className="text-sm font-semibold text-white mb-4">📊 TrackMan Insights — Pete's Flagged Findings</div>
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
        <div className="text-xs font-semibold text-blue-400 mb-1">ℹ️ TrackMan API — Phase 2</div>
        <div className="text-xs text-gray-400">TrackMan has a developer API for authorised integrations. Connection requires the coach or player to authorise Lumio Tour as a connected app within their TrackMan Performance Studio account. Data shared: session metadata, club averages, ball flight parameters, and dispersion charts. No video data transferred. This is scoped as a Phase 2 integration.</div>
      </div>
    </div>
  );
}

// ─── SHOTLINK VIEW ────────────────────────────────────────────────────────────
function ShotLinkView() {
  const phases = [
    { phase: 'Phase 1 (Now)', label: 'DP World Tour — Arccos + DataGolf', desc: 'Arccos sensors provide on-course shot data. DataGolf API provides round-level SG benchmarks. No ShotLink required — DP World Tour doesn\'t use it.', status: 'active', icon: '✓' },
    { phase: 'Phase 2 (2027)', label: 'PGA Tour co-sanctions — DataGolf SG', desc: 'Scottish Open, BMW International, and other co-sanctioned events have PGA Tour fields. DataGolf\'s PGA Tour ShotLink partnership covers these rounds at shot level.', status: 'planned', icon: '⚡' },
    { phase: 'Phase 3 (2027+)', label: 'PGA Tour Elite — Full ShotLink Integration', desc: 'Direct ShotLink partnership for PGA Tour Elite tier (£699/mo). Every shot tracked at every PGA Tour event. 256,000 data points per tournament week. Full hole strategy intelligence.', status: 'future', icon: '🔗' },
  ];
  const shotlinkData = [
    { metric: 'Shot location (x, y coordinates)', frequency: 'Every shot', accuracy: 'Sub-metre', notes: 'Powered by laser rangefinders + handheld operators at every PGA Tour event' },
    { metric: 'Ball speed at impact', frequency: 'Measured holes', accuracy: 'High', notes: 'Available where radar equipment deployed (not all holes)' },
    { metric: 'Carry distance by lie type', frequency: 'Fairway, rough, bunker', accuracy: 'High', notes: 'Allows SG:Approach breakdown by lie condition' },
    { metric: 'Putt location + length', frequency: 'Every putt', accuracy: 'High', notes: 'Powers SG:Putting from all distances and break directions' },
    { metric: 'Miss direction (left/right)', frequency: 'Every approach', accuracy: 'High', notes: 'Used for hole strategy: where misses cost most on each hole' },
    { metric: 'Historical hole mean scores', frequency: 'Per event, 5yr avg', accuracy: 'Exact', notes: 'Foundation of hole strategy intelligence in TourIQ and DataGolf models' },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader icon="🔗" title="ShotLink Access (Phase 3)" subtitle="PGA Tour's proprietary shot-tracking system. Irrelevant for DP World Tour — essential for the PGA Tour Elite tier." />
      {/* Critical context box */}
      <div className="bg-[#0d0f1a] border border-green-600/30 rounded-xl p-5">
        <div className="text-sm font-semibold text-green-400 mb-2">The Most Important Context for DP World Tour</div>
        <div className="text-sm text-gray-300 leading-relaxed">ShotLink does not exist on the DP World Tour. It is a PGA Tour system. Every DP World Tour player (Lumio Tour's primary market) competes without ShotLink coverage at non-co-sanctioned events. This means TourIQ — which is ShotLink-dependent — simply doesn't work for these players. Lumio Tour uses DataGolf (round-level SG) and Arccos (shot-level SG) as its data layer, which covers DP World Tour completely. ShotLink is only relevant when Lumio Tour expands to a PGA Tour Elite tier.</div>
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
            { step: '1', action: 'Establish DataGolf API integration (Phase 1) — DataGolf already has PGA Tour ShotLink access via existing partnership' },
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
    </div>
  );
}

// ─── LPGA / LET MODE VIEW ─────────────────────────────────────────────────────
function LPGAView() {
  const [activeTab, setActiveTab] = useState<'overview'|'rankings'|'schedule'|'roadmap'>('overview');
  const lpgaTours = [
    { tour: 'LPGA Tour', players: '~170 active', rankings: 'Rolex Women\'s World Golf Rankings (RWGR)', analytic: 'No dedicated analytics platform', platform: 'Nothing beyond LPGA.com portal' },
    { tour: 'Ladies European Tour (LET)', players: '~200 active', rankings: 'RWGR + LET Order of Merit', analytic: 'No analytics platform', platform: 'Nothing beyond LET portal' },
    { tour: 'LPGA Epson Tour (Dev)', players: '~120 active', rankings: 'RWGR', analytic: 'No analytics platform', platform: 'Spreadsheets and email' },
    { tour: 'Symetra Tour', players: 'Merged into Epson', rankings: 'Historical', analytic: 'No analytics platform', platform: 'Dissolved' },
  ];
  const rwgrSchedule = [
    { event: 'AIG Women\'s Open', cat: 'Major', venue: 'Lytham & St Annes', date: 'Aug 2026', rwgr: '100 pts (winner)', prize: '$10M' },
    { event: 'Chevron Championship', cat: 'Major', venue: 'The Club at Carlton Woods', date: 'Apr 2026', rwgr: '100 pts', prize: '$10M' },
    { event: 'US Women\'s Open', cat: 'Major', venue: 'Quaker Ridge GC', date: 'Jun 2026', rwgr: '100 pts', prize: '$12M' },
    { event: 'The Annika (Rolex Series)', cat: 'LPGA Rolex', venue: 'Pelican GC, Florida', date: 'Nov 2026', rwgr: '65 pts', prize: '$4M' },
    { event: 'BMW Ladies Championship', cat: 'LET Rolex', venue: 'Seomjin River CC, Korea', date: 'Oct 2026', rwgr: '60 pts', prize: '$3.25M' },
  ];
  const arccosWomen = [
    { name: 'Nelly Korda', flag: '🇺🇸', rank: '#1 RWGR', note: 'Full Arccos Pro analytics suite' },
    { name: 'Lydia Ko', flag: '🇳🇿', rank: 'Top 10 RWGR', note: 'SG tracking across LPGA season' },
    { name: 'Brooke Henderson', flag: '🇨🇦', rank: 'Top 15 RWGR', note: 'Arccos course strategy tools' },
    { name: 'Georgia Hall', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', rank: 'Top 40 RWGR', note: 'LET + LPGA Arccos user' },
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
            <div className="text-sm text-gray-300 leading-relaxed">For women's professional golfers, the gap is not partial — it is total. There is no dedicated analytics platform for LPGA or LET players. No performance OS. No RWGR tracker. No sponsorship manager. No caddie workflow module. Nothing beyond the tour portal for entries and rankings. Arccos Pro Insights has 35+ women (Nelly Korda, etc.) getting on-course analytics — but nothing commercial. Lumio Tour would be the first technology platform ever built specifically for the women's professional golf career. The WTA gap in tennis is identical, and it's exactly Lumio Tour's strongest entry point in tennis. The same play is available in golf.</div>
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
            <div className="text-sm font-semibold text-white mb-4">Women Using Arccos Pro (Confirmation the Market Exists)</div>
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
            <div className="text-sm font-semibold text-white mb-3">Rolex Women's World Golf Rankings (RWGR)</div>
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
                { effort: 'Low', item: 'RWGR tracker replaces OWGR tracker', desc: 'Same rolling 104-week formula, different data source. DataGolf API covers RWGR.' },
                { effort: 'Low', item: 'Race to the CME Globe replaces Race to Dubai', desc: 'Season-long points race. Identical UI — just different data feed.' },
                { effort: 'Low', item: 'LPGA / LET tournament calendar', desc: 'Replace DP World Tour schedule with LPGA / LET events. DataGolf covers the full LPGA calendar.' },
                { effort: 'Med', item: 'Female player profile and team structure', desc: 'Same team roles but caddie dynamics differ slightly. Player card adapted.' },
                { effort: 'Med', item: 'Solheim Cup / Olympic qualification tracker', desc: 'Replaces Davis Cup / Ryder Cup module. Solheim Cup uses RWGR + LET Order of Merit.' },
                { effort: 'High', item: 'LPGA ShotLink equivalent data', desc: 'LPGA has introduced more advanced shot tracking but not at PGA Tour ShotLink level. Use Arccos + DataGolf initially.' },
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
            <div className="text-xs text-gray-400">The LPGA route in is via player agents (IMG, Hambric, Excel also manage women's players). Approaching Arccos directly — Edoardo Molinari already works with 35+ women — could fast-track access to the warmest leads. One well-known LPGA player on Lumio Tour is the equivalent of Kristoffer Reitan on the DP World Tour side.</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MOBILE APP VIEW ──────────────────────────────────────────────────────────
function MobileAppView() {
  const features = [
    { section: 'OVERVIEW', items: ['Morning Briefing (voice playback)', 'Dashboard — today\'s schedule and alerts', 'Notification centre'] },
    { section: 'ON COURSE', items: ['Caddie Workflow — hole strategy + carry sheet', 'In-round stat logging (fairways, GIR, putts, sand saves)', 'Post-round debrief voice note', 'WHOOP recovery check-in'] },
    { section: 'PERFORMANCE', items: ['OWGR position and Race to Dubai standing', 'SG dashboard — last 5 rounds', 'Points expiry alert view', 'Arccos SG sync status'] },
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
            { opt: 'React Native (Expo)', pros: 'Single codebase for iOS + Android. Shares component logic with Next.js web portal. Fastest time to market.', cons: 'Some native features need bridging. Performance slightly below fully native.' },
            { opt: 'Progressive Web App (PWA)', pros: 'Zero extra codebase. Installable from browser. Service workers enable offline.', cons: 'iOS PWA limitations (push notifications restricted). App Store visibility limited.' },
            { opt: 'Native Swift + Kotlin', pros: 'Best performance and OS integration. Full App Store presence.', cons: 'Two separate codebases. Significantly slower to build and maintain.' },
          ].map((o, i) => (
            <div key={i} className="p-3 bg-black/20 rounded-lg">
              <div className="text-sm font-medium text-white mb-1">{o.opt}</div>
              <div className="text-xs text-teal-400 mb-0.5">✓ {o.pros}</div>
              <div className="text-xs text-red-400">✗ {o.cons}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-500">Recommendation: React Native (Expo) for Phase 1 mobile — fastest path to full iOS + Android coverage with shared logic from the existing Next.js codebase. Upgrade to fully native components where performance demands it in Phase 2.</div>
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
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function GolfTourPage() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState<{ message: string; sponsor: string } | null>(null);
  const [toastDismissed, setToastDismissed] = useState(false);
  const player = DEMO_PLAYER;
  const groups = ['OVERVIEW', 'PERFORMANCE', 'TEAM', 'COMMERCIAL', 'OPERATIONS', 'INTEGRATIONS'];

  // Sponsor obligation toast — fires once on mount if it's past 09:00 and not dismissed.
  useEffect(() => {
    if (toastDismissed) return;
    const hour = new Date().getHours();
    // Demo deals — the most urgent is Callaway (renewal due, content obligation today).
    const deals = [
      { sponsor: 'Callaway', status: 'Renewal due', days: 18, dailyObligation: true },
      { sponsor: 'Titleist', status: 'Active', days: 82, dailyObligation: false },
      { sponsor: 'Rolex', status: 'Active', days: 146, dailyObligation: false },
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
    switch (activeSection) {
      case 'dashboard':   return <DashboardView player={player} setActiveSection={setActiveSection} />;
      case 'morning':     return <MorningBriefingView player={player} />;
      case 'owgr':        return <OWGRView player={player} />;
      case 'schedule':    return <ScheduleView />;
      case 'strokes':     return <StrokesGainedView />;
      case 'coursefit':   return <CourseFitView />;
      case 'caddie':      return <CaddieView />;
      case 'team':        return <TeamHubView player={player} />;
      case 'physio':      return <PhysioView />;
      case 'equipment':   return <EquipmentView />;
      case 'mental':      return <MentalView />;
      case 'sponsorship': return <SponsorshipView />;
      case 'financial':   return <FinancialView />;
      case 'career':      return <CareerView />;
      case 'proam':       return <ProAmView />;
      case 'practicelog': return <PracticeLogView />;
      case 'exemptions':  return <ExemptionsView />;
      case 'matchprep':   return <RoundPrepView />;
      case 'media':       return <PlaceholderView icon="📱" title="Media & Content" description="Social media calendar, sponsor content obligations, press log, and interview management." />;
      case 'agent':       return <PlaceholderView icon="📬" title="Agent Pipeline" description="Deals in negotiation, sponsor pipeline, renewal timelines, and commercial opportunity tracking." />;
      case 'travel':      return <PlaceholderView icon="✈️" title="Travel & Logistics" description="Event-by-event travel planning, hotel contacts, per-diem tracker, and caddie movement planning." />;
      case 'qualifying':  return <PlaceholderView icon="🎓" title="Q-School & Qualifying" description="Monday qualifier management, Q-School countdown, sectional qualifying entries, and status tracker." />;
      case 'video':       return <PlaceholderView icon="🎬" title="Video Library" description="Swing session recordings, competition footage, post-round debriefs, and coach clip library." />;
      case 'settings':    return <PlaceholderView icon="⚙️" title="Settings" description="Profile, notifications, team access, data integrations (Arccos, WHOOP, TrackMan), and billing." />;
      case 'arccos':      return <ArccosView />;
      case 'datagolf':    return <DataGolfView />;
      case 'trackman':    return <TrackManView />;
      case 'shotlink':    return <ShotLinkView />;
      case 'lpga':        return <LPGAView />;
      case 'mobileapp':   return <MobileAppView />;
      default:            return <DashboardView player={player} setActiveSection={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#07080F', fontFamily: 'DM Sans, sans-serif', color: '#e5e7eb' }}>
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

      {/* Sidebar */}
      <div className={`flex-shrink-0 transition-all duration-200 flex flex-col border-r border-gray-800 ${sidebarCollapsed ? 'w-14' : 'w-56'}`} style={{ background: '#0a0c14' }}>
        <div className="p-3 border-b border-gray-800 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ background: 'linear-gradient(90deg, #16a34a, #0D9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LUMIO TOUR</div>
              <div className="text-[10px] text-gray-600">⛳ Golf</div>
            </div>
          )}
          {sidebarCollapsed && <span className="text-lg mx-auto">⛳</span>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-gray-600 hover:text-gray-400 text-xs ml-auto flex-shrink-0">{sidebarCollapsed ? '→' : '←'}</button>
        </div>
        {!sidebarCollapsed && (
          <div className="p-3 border-b border-gray-800">
            <button
              onClick={() => setActiveSection('owgr')}
              className="w-full text-left hover:bg-gray-800/50 rounded-lg p-1 -m-1 transition-all cursor-pointer flex items-center gap-2"
              title="Go to OWGR & Race to Dubai"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm border border-green-500/40" style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.3), rgba(13,148,136,0.3))' }}>{player.flag}</div>
              <div><div className="text-xs font-semibold text-white">{player.name}</div><div className="text-[10px] text-gray-500">#{player.owgr} OWGR · {player.nationality}</div></div>
            </button>
          </div>
        )}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {groups.map(group => {
            const items = SIDEBAR_ITEMS.filter(i => i.group === group);
            return (
              <div key={group} className="mb-3">
                {!sidebarCollapsed && <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-2 mb-1">{group}</div>}
                {items.map(item => (
                  <button key={item.id} onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg mb-0.5 transition-all text-left ${activeSection === item.id ? 'bg-green-600/20 text-green-300 border border-green-600/30' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}
                    title={sidebarCollapsed ? item.label : undefined}>
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    {!sidebarCollapsed && <span className="text-xs font-medium truncate">{item.label}</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-gray-800">
            <div className="text-[9px] text-gray-700 uppercase tracking-wider font-medium">Plan</div>
            <div className="text-xs text-green-400 font-semibold mt-0.5">Pro+ · £349/mo</div>
          </div>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex-shrink-0 border-b border-gray-800 px-6 py-3 flex items-center justify-between" style={{ background: '#0a0c14' }}>
          <div className="text-xs text-gray-500 font-medium capitalize">
            {SIDEBAR_ITEMS.find(i => i.id === activeSection)?.icon} {SIDEBAR_ITEMS.find(i => i.id === activeSection)?.label}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-600">BMW International Open · Munich · DP World Tour</div>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <div className="text-xs text-gray-500">Week 28 · 2026</div>
          </div>
        </div>

        {/* Content + card */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">{renderView()}</div>
          {/* Right column */}
          <div className="hidden lg:flex flex-col items-center gap-4 p-4 border-l border-gray-800 flex-shrink-0" style={{ width: '220px' }}>
            <PlayerCard player={player} setActiveSection={setActiveSection} />
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">This Week</div>
              <div className="text-xs text-green-400 font-medium">● In Progress</div>
              <div className="text-xs text-gray-300 mt-1">BMW International Open</div>
              <div className="text-xs text-gray-500">Munich · R1 Thu 09:42</div>
              <div className="mt-2 text-xs text-yellow-400">Win = £1.32M · 1,335 pts</div>
            </div>
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Next Events</div>
              {['Scottish Open (Rolex)', 'The Open (Major)', 'British Masters', 'Omega Euro Masters'].map((t, i) => (
                <div key={i} className="text-xs text-gray-400 py-1 border-b border-gray-800/50 last:border-0">{t}</div>
              ))}
            </div>
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Alerts</div>
              <div className="space-y-1.5">
                <div className="text-xs text-red-400">🔴 Callaway renewal: 18d</div>
                <div className="text-xs text-yellow-400">⚠️ 330 pts expire Jul 12</div>
                <div className="text-xs text-yellow-400">⚠️ Callaway post due today</div>
                <div className="text-xs text-blue-400">📞 TaylorMade call: 16:00</div>
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
          </div>
        </div>
      </div>
    </div>
  );
}

