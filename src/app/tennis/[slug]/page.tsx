'use client';

import { useState, useEffect, useRef } from 'react';

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

// ─── SIDEBAR ITEMS ────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',           icon: '🏠', group: 'OVERVIEW' },
  { id: 'morning',      label: 'Morning Briefing',    icon: '🌅', group: 'OVERVIEW' },
  { id: 'rankings',     label: 'Rankings & Race',     icon: '📊', group: 'PERFORMANCE' },
  { id: 'forecaster',   label: 'Points Forecaster',   icon: '🔮', group: 'PERFORMANCE' },
  { id: 'entries',       label: 'Entry Manager',       icon: '📋', group: 'PERFORMANCE' },
  { id: 'schedule',     label: 'Tournament Sched',    icon: '🗓️', group: 'PERFORMANCE' },
  { id: 'livescores',  label: 'Live Scores',         icon: '🔴', group: 'PERFORMANCE' },
  { id: 'scout',       label: 'Opponent Scout',      icon: '🔍', group: 'PERFORMANCE' },
  { id: 'surface',     label: 'Surface Analysis',    icon: '🏟️', group: 'PERFORMANCE' },
  { id: 'draw',        label: 'Draw & Bracket',      icon: '🏆', group: 'PERFORMANCE' },
  { id: 'performance',  label: 'Performance Stats',   icon: '📈', group: 'PERFORMANCE' },
  { id: 'matchprep',    label: 'Match Prep',          icon: '🎯', group: 'PERFORMANCE' },
  { id: 'practice',     label: 'Practice Log',        icon: '📝', group: 'PERFORMANCE' },
  { id: 'video',        label: 'Video Library',       icon: '🎬', group: 'PERFORMANCE' },
  { id: 'team',         label: 'Team Hub',            icon: '👥', group: 'TEAM' },
  { id: 'physio',       label: 'Physio & Recovery',   icon: '⚕️', group: 'TEAM' },
  { id: 'racket',       label: 'Racket & Strings',    icon: '🎾', group: 'TEAM' },
  { id: 'partners',     label: 'Playing Partners',    icon: '🤜', group: 'TEAM' },
  { id: 'doubles',      label: 'Doubles',             icon: '🎭', group: 'TEAM' },
  { id: 'sponsorship',  label: 'Sponsorship',         icon: '🤝', group: 'COMMERCIAL' },
  { id: 'media',        label: 'Media & Content',     icon: '📱', group: 'COMMERCIAL' },
  { id: 'financial',    label: 'Financial Dash',      icon: '💰', group: 'COMMERCIAL' },
  { id: 'exhibition',   label: 'Exhibitions',         icon: '🎪', group: 'COMMERCIAL' },
  { id: 'pipeline',     label: 'Agent Pipeline',      icon: '📋', group: 'COMMERCIAL' },
  { id: 'travel',       label: 'Travel & Logistics',  icon: '✈️', group: 'OPERATIONS' },
  { id: 'federation',   label: 'Federation',          icon: '🏛️', group: 'OPERATIONS' },
  { id: 'career',       label: 'Career Planning',     icon: '🚀', group: 'OPERATIONS' },
  { id: 'academy',      label: 'Academy & Dev',       icon: '🎓', group: 'OPERATIONS' },
  { id: 'mental',       label: 'Mental Performance',  icon: '🧠', group: 'OPERATIONS' },
  { id: 'courtbooking', label: 'Court Booking',        icon: '🏟️', group: 'OPERATIONS' },
  { id: 'teamcomms',    label: 'Team Comms',           icon: '💬', group: 'OPERATIONS' },
  { id: 'accreditations',label: 'Accreditations',      icon: '🪪', group: 'OPERATIONS' },
  { id: 'settings',     label: 'Settings',            icon: '⚙️', group: 'OPERATIONS' },
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

// ─── SECTION HEADER ────────────────────────────────────────────────────────────
const SectionHeader = ({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: string }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2">
      {icon && <span className="text-xl">{icon}</span>}
      <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-gray-400 mt-1 ml-7">{subtitle}</p>}
  </div>
);

// ─── QUICK ACTIONS BAR ─────────────────────────────────────────────────────────
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
        <div className="text-sm text-white font-medium">vs Martinez, 13:00, Court 4</div>
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
              <text x="0" y={y + barHeight / 2 + 4} fill="#9ca3af" fontSize="11" fontFamily="DM Sans, sans-serif">{d.surface}</text>
              <rect x={labelWidth} y={y} width={maxBarWidth} height={barHeight} rx="4" fill="#1f2937" />
              <rect x={labelWidth} y={y} width={barWidth} height={barHeight} rx="4" fill={d.color} opacity="0.8" />
              <text x={labelWidth + barWidth + 8} y={y + barHeight / 2 + 4} fill="#e5e7eb" fontSize="12" fontWeight="bold" fontFamily="DM Sans, sans-serif">{d.pct}%</text>
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
              <text x={padX - 8} y={y + 4} fill="#6b7280" fontSize="9" textAnchor="end" fontFamily="DM Sans, sans-serif">{v}%</text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#winGrad)" />
        <path d={linePath} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#8B5CF6" stroke="#07080F" strokeWidth="1.5" />
        ))}
        {months.map((m, i) => (
          <text key={i} x={padX + i * xStep} y={h - 6} fill="#6b7280" fontSize="9" textAnchor="middle" fontFamily="DM Sans, sans-serif">{m}</text>
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
              <text x={cx} y={h - 10} fill="#9ca3af" fontSize="10" textAnchor="middle" fontFamily="DM Sans, sans-serif">{year}</text>
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
          <text key={i} x={padX + i * xStep} y={h - 5} fill="#6b7280" fontSize="9" textAnchor="middle" fontFamily="DM Sans, sans-serif">{d}</text>
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
        <text x={w - padX + 5} y={chY + 3} fill="#eab308" fontSize="9" fontFamily="DM Sans, sans-serif">#{careerHigh} CH</text>
        <path d={linePath} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill="#8B5CF6" stroke="#07080F" strokeWidth="1" />
        ))}
        <text x={padX - 5} y={padY + 4} fill="#6b7280" fontSize="9" textAnchor="end" fontFamily="DM Sans, sans-serif">#30</text>
        <text x={padX - 5} y={padY + chartH + 4} fill="#6b7280" fontSize="9" textAnchor="end" fontFamily="DM Sans, sans-serif">#100</text>
        <text x={padX} y={h - 5} fill="#6b7280" fontSize="9" textAnchor="middle" fontFamily="DM Sans, sans-serif">-24m</text>
        <text x={w - padX} y={h - 5} fill="#6b7280" fontSize="9" textAnchor="middle" fontFamily="DM Sans, sans-serif">Now</text>
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
              <text x={cx} y={h - 10} fill="#9ca3af" fontSize="10" textAnchor="middle" fontFamily="DM Sans, sans-serif">{year}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ─── DASHBOARD VIEW ────────────────────────────────────────────────────────────
function DashboardView({ player }: { player: TennisPlayer }) {
  const [aiTab, setAiTab] = useState<'quickwins' | 'daily' | 'insights' | 'dontmiss' | 'team'>('quickwins');

  const nextMatch = { opponent: 'C. Martinez', nationality: '🇪🇸', ranking: 34, time: '13:00', court: 'Court 4', tournament: 'Monte-Carlo Masters', surface: 'Clay' };
  const todayTasks = [
    { time: '07:30', task: 'AI Morning Briefing', done: true },
    { time: '08:30', task: 'Physio treatment — right shoulder', done: true },
    { time: '10:00', task: 'Practice session — serve patterns (90 min)', done: false },
    { time: '11:45', task: 'Stringing with Carlos — clay tensions (2x Wilson Luxilon ALU)', done: false },
    { time: '12:30', task: 'Pre-match meal + rest', done: false },
    { time: '13:00', task: 'Match vs C. Martinez — Court 4', done: false },
    { time: '15:30', task: 'Post-match debrief with Marco', done: false },
    { time: 'By 18:00', task: 'Lululemon Instagram post due — agent has drafted caption', done: false },
  ];

  const aiTabs = [
    { id: 'quickwins' as const, label: 'Quick Wins' },
    { id: 'daily' as const, label: 'Daily Tasks' },
    { id: 'insights' as const, label: 'Insights' },
    { id: 'dontmiss' as const, label: "Don't Miss" },
    { id: 'team' as const, label: 'Team' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🏠" title={`Good morning, ${player.name.split(' ')[0]}.`} subtitle="Here's your overview for today." />

      {/* World Clock Strip */}
      <div className="flex items-center gap-6 bg-[#0d0f1a] border border-gray-800 rounded-xl px-5 py-3">
        <div className="text-xs text-gray-500 font-medium">WORLD CLOCK</div>
        {[
          { city: 'London', time: '12:00 BST' },
          { city: 'New York', time: '07:00 EDT' },
          { city: 'Melbourne', time: '21:00 AEST' },
          { city: 'Dubai', time: '15:00 GST' },
        ].map((c, i) => (
          <div key={i} className="text-center">
            <div className="text-xs text-gray-500">{c.city}</div>
            <div className="text-sm text-white font-medium">{c.time}</div>
          </div>
        ))}
        <div className="ml-auto">
          <div className="text-xs text-gray-500">Tournament Location</div>
          <div className="text-sm text-white font-medium">Monaco — 22C, Wind: 8km/h SW</div>
        </div>
      </div>

      {/* Key Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="ATP Ranking" value={`#${player.ranking}`} sub="^2 this week" color="purple" />
        <StatCard label="Race Standing" value={`#${player.race_ranking}`} sub="Race to Turin" color="teal" />
        <StatCard label="Ranking Points" value={player.ranking_points.toLocaleString()} sub="Rolling 52 weeks" color="blue" />
        <StatCard label="Career High" value={`#${player.career_high}`} sub={player.career_high_date} color="orange" />
      </div>

      {/* Today's Match */}
      <div className="bg-gradient-to-r from-purple-900/40 to-teal-900/20 border border-purple-600/30 rounded-xl p-5">
        <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-3">TODAY'S MATCH — {nextMatch.tournament}</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-600/30 border-2 border-purple-500/50 flex items-center justify-center text-xl">{player.flag}</div>
            <div>
              <div className="text-white font-bold text-lg">{player.name}</div>
              <div className="text-gray-400 text-sm">#{player.ranking} ATP</div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">VS</div>
            <div className="text-xs text-gray-500">{nextMatch.time} . {nextMatch.court}</div>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-white font-bold text-lg">{nextMatch.opponent}</div>
              <div className="text-gray-400 text-sm">#{nextMatch.ranking} ATP</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-600/20 border-2 border-red-500/30 flex items-center justify-center text-xl">{nextMatch.nationality}</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-4 text-sm text-gray-400">
          <SurfaceBadge surface={nextMatch.surface} />
          <span>H2H: <span className="text-white font-medium">3 - 1</span> in your favour</span>
          <span>Clay serve avg: <span className="text-yellow-400 font-medium">61%</span> (4% below season avg)</span>
          <span className="ml-auto text-teal-400 text-xs">Coach notes ready</span>
        </div>
      </div>

      {/* Today's Schedule */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">TODAY'S SCHEDULE</div>
        <div className="space-y-2">
          {todayTasks.map((t, i) => (
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

      {/* Quick Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="text-yellow-400 text-sm font-semibold mb-1">Points Expiring This Week</div>
          <div className="text-white font-bold text-lg">125 pts</div>
          <div className="text-xs text-gray-400">Monte-Carlo QF last year — need SF to maintain</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="text-blue-400 text-sm font-semibold mb-1">Sponsor Obligation Today</div>
          <div className="text-white font-bold text-lg">Lululemon Post</div>
          <div className="text-xs text-gray-400">Caption drafted by James — review in Sponsorship tab</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="text-green-400 text-sm font-semibold mb-1">Prize Money This Week</div>
          <div className="text-white font-bold text-lg">EUR 47,500 (QF)</div>
          <div className="text-xs text-gray-400">SF would add EUR 92,000 . Final EUR 197,000</div>
        </div>
      </div>

      {/* AI Overview Tabs */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-800">
          {aiTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setAiTab(tab.id)}
              className={`flex-1 py-3 text-xs font-medium transition-all ${aiTab === tab.id ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-600/5' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-5">
          {aiTab === 'quickwins' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Review stringing order', desc: 'Carlos has your clay setup ready — confirm 24kg mains or adjust for humidity.', action: 'Go to Racket & Strings', urgency: 'medium' },
                { title: 'Approve Lululemon post', desc: 'James drafted your match-day caption. Review and approve before 18:00.', action: 'Go to Sponsorship', urgency: 'high' },
                { title: 'Confirm Barcelona hotel', desc: 'Hotel Arts Barcelona — 3 rooms, check-in 20 Apr. Agent needs your sign-off.', action: 'Go to Travel', urgency: 'low' },
              ].map((item, i) => (
                <div key={i} className={`p-4 rounded-lg border ${item.urgency === 'high' ? 'border-yellow-600/30 bg-yellow-600/5' : item.urgency === 'medium' ? 'border-blue-600/30 bg-blue-600/5' : 'border-gray-800 bg-gray-900/20'}`}>
                  <div className="text-sm font-semibold text-white mb-1">{item.title}</div>
                  <div className="text-xs text-gray-400 mb-3">{item.desc}</div>
                  <button className="text-xs text-purple-400 hover:text-purple-300">{item.action} &rarr;</button>
                </div>
              ))}
            </div>
          )}
          {aiTab === 'daily' && (
            <div className="space-y-2">
              {todayTasks.map((t, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                  <span className={`w-2 h-2 rounded-full ${t.done ? 'bg-teal-500' : 'bg-gray-600'}`}></span>
                  <span className="text-gray-500 w-16 text-xs">{t.time}</span>
                  <span className={t.done ? 'line-through text-gray-500' : ''}>{t.task}</span>
                </div>
              ))}
            </div>
          )}
          {aiTab === 'insights' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-purple-600/5 border border-purple-600/20">
                <div className="text-sm text-white font-medium">Ranking trajectory on track</div>
                <div className="text-xs text-gray-400 mt-1">Current trajectory puts you at #52 by year-end. A strong clay swing (SF at Roland-Garros) could push you to #38.</div>
              </div>
              <div className="p-3 rounded-lg bg-teal-600/5 border border-teal-600/20">
                <div className="text-sm text-white font-medium">Season stats above 2025 baseline</div>
                <div className="text-xs text-gray-400 mt-1">Win rate: 68% (vs 62% same period last year). Aces/match up 0.4. First serve % stable.</div>
              </div>
              <div className="p-3 rounded-lg bg-yellow-600/5 border border-yellow-600/20">
                <div className="text-sm text-white font-medium">450 points expiring in next 12 weeks</div>
                <div className="text-xs text-gray-400 mt-1">Monte-Carlo QF (125), Barcelona R2 (45), Roland-Garros R3 (45), Wimbledon R2 (45), US Open QF (180). Defend aggressively.</div>
              </div>
            </div>
          )}
          {aiTab === 'dontmiss' && (
            <div className="space-y-3">
              {[
                { label: 'Rolex contract renewal', detail: '47 days remaining. James has scheduled Friday call.', color: 'red' },
                { label: 'Lululemon post due today', detail: 'Caption drafted. Approve by 18:00.', color: 'yellow' },
                { label: 'Barcelona entry deadline', detail: 'Already entered — confirmed.', color: 'teal' },
                { label: "Queen's Club wildcard", detail: 'LTA request submitted. Decision expected 1 May.', color: 'blue' },
                { label: 'Davis Cup finals selection', detail: 'Sep 2026. Captain reviewing squad.', color: 'purple' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border border-${item.color}-600/30 bg-${item.color}-600/5`}>
                  <div className={`w-2 h-2 rounded-full bg-${item.color}-500`}></div>
                  <div>
                    <div className="text-sm text-white font-medium">{item.label}</div>
                    <div className="text-xs text-gray-400">{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {aiTab === 'team' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Marco Bianchi', role: 'Coach', status: 'Match prep uploaded 08:15', icon: '📋', statusColor: 'teal' },
                { name: 'Sarah Okafor', role: 'Physio', status: 'Shoulder treatment complete. Cleared.', icon: '⚕️', statusColor: 'green' },
                { name: 'James Whitfield', role: 'Agent', status: 'Lululemon draft ready for review.', icon: '🤝', statusColor: 'yellow' },
              ].map((m, i) => (
                <div key={i} className="p-4 rounded-lg bg-gray-900/30 border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{m.icon}</span>
                    <div>
                      <div className="text-sm text-white font-medium">{m.name}</div>
                      <div className="text-xs text-purple-400">{m.role}</div>
                    </div>
                  </div>
                  <div className={`text-xs text-${m.statusColor}-400`}>{m.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MORNING BRIEFING VIEW ─────────────────────────────────────────────────────
function MorningBriefingView({ player }: { player: TennisPlayer }) {
  const [playing, setPlaying] = useState(false);
  const [recipient, setRecipient] = useState<'player' | 'coach' | 'agent' | 'physio'>('player');

  const briefings = {
    player: `Good morning, ${player.name.split(' ')[0]}. You're ranked ${player.ranking}th in the ATP rankings, up two places this week. Your serve percentage on clay is 61% over the last 10 matches — 4 points below your season average of 65%. Today you're facing Carlos Martinez, ranked 34th. He favours the inside-out forehand on break points on clay — Marco has left a full breakdown in your match prep. Stringing is at 11:45 with Carlos at your usual clay tensions — Luxilon ALU at 24kg mains, 23kg crosses. Your Lululemon Instagram post is due today — James has drafted a caption for your review. First match is at 13:00 on Court 4. You've beaten Martinez 3 times on clay. Everything is ready.`,
    coach: `Morning briefing for Marco Bianchi. Alex's recovery score is 82 out of 100 — shoulder flagged as mild yesterday by Sarah. Practice plan for 10am: 45 minutes serve patterns focusing on body serve percentages, then 45 minutes return drill — Carlos Martinez's second serve sits wide on the deuce side 68% of the time. H2H against Martinez: Alex leads 3-1 overall, 3-0 on clay. Main tactical note: Martinez breaks down mentally after losing the first set. Apply pressure early. Stringing confirmed 11:45. Alex's meal plan from Luis is in the system.`,
    agent: `Morning briefing for James Whitfield. Lululemon Instagram post is due today — draft is in the sponsorship tab awaiting Alex's approval. The Rolex deal renewal is 47 days out — agenda item for Friday's call. Performance bonus trigger: if Alex reaches the semi-final this week, the Wilson performance clause activates — GBP 8,500 bonus. Race standing is 54th — 312 points behind the cut-off for the 8-man Turin field. Next ranking report to Rolex is due end of month. No press obligations today.`,
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
      <QuickActionsBar />
      <SectionHeader icon="🌅" title="AI Morning Briefing" subtitle="Voice-powered daily briefings for the player and full team — delivered before first session." />

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
    </div>
  );
}

// ─── RANKINGS VIEW ─────────────────────────────────────────────────────────────
function RankingsView({ player }: { player: TennisPlayer }) {
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
      <QuickActionsBar />
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
            { rank: 1, name: 'J. Sinner', pts: 9240, flag: '🇮🇹', qualified: true },
            { rank: 2, name: 'C. Alcaraz', pts: 7850, flag: '🇪🇸', qualified: true },
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
    </div>
  );
}

// ─── SCHEDULE VIEW ─────────────────────────────────────────────────────────────
function ScheduleView() {
  const calendar = [
    { date: '6-12 Apr',   tournament: 'Monte-Carlo Masters',              cat: 'Masters 1000',  surface: 'Clay',        location: '🇲🇨 Monaco',    status: 'active',   points: 215, entered: true },
    { date: '13-19 Apr',  tournament: 'Barcelona Open',                   cat: 'ATP 500',       surface: 'Clay',        location: '🇪🇸 Barcelona', status: 'upcoming', points: 0,   entered: true },
    { date: '13-19 Apr',  tournament: 'BMW Open Munich',                  cat: 'ATP 500',       surface: 'Clay',        location: '🇩🇪 Munich',    status: 'upcoming', points: 0,   entered: false },
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
      <QuickActionsBar />
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
    </div>
  );
}

// ─── PERFORMANCE VIEW ──────────────────────────────────────────────────────────
function PerformanceView({ player }: { player: TennisPlayer }) {
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
    { tournament: 'Australian Open', cat: 'Grand Slam', surface: 'Hard', result: 'R4', opponent: 'Sinner', score: '3-6, 4-6, 7-5, 2-6', wl: 'L' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📈" title="Performance Stats" subtitle={`${player.name} . 2026 season statistics by surface, match patterns, and form tracker.`} />

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
    </div>
  );
}

// ─── MATCH PREP VIEW ───────────────────────────────────────────────────────────
function MatchPrepView() {
  const opponent = {
    name: 'Carlos Martinez',
    flag: '🇪🇸',
    ranking: 34,
    age: 26,
    height: '6\'1"',
    plays: 'Right-handed',
    backhand: 'One-handed',
    coach: 'Toni Nadal Jr.',
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
      <QuickActionsBar />
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
          <p>Martinez is beatable on clay if you control the centre. His inside-out forehand is dangerous but he telegraphs it — if you step left early on break points, you can redirect down the line and he has no time.</p>
          <p>Target his backhand in long rallies. Above 8 shots, his win rate drops significantly. Avoid short-ball patterns — he punishes anything above the knee on the forehand side.</p>
          <p>Second serve out wide in the deuce court is the play. He returns crosscourt almost every time. Set up the next ball inside-in forehand. We have drilled this 40 times this week.</p>
          <p className="text-teal-400">Key: win the first set. He mentally disengages if he loses it.</p>
        </div>
      </div>
    </div>
  );
}

// ─── PRACTICE LOG VIEW ─────────────────────────────────────────────────────────
function PracticeLogView() {
  const sessions = [
    { date: '9 Apr', type: 'On-court', partner: 'J. Draper', duration: '90 min', coachNotes: 'Serve patterns: body serve % improved to 68%. Good session.' },
    { date: '8 Apr', type: 'On-court', partner: 'Hitting partner (Lucas)', duration: '75 min', coachNotes: 'Return drills — focusing on Martinez deuce court patterns.' },
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

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📝" title="Practice Log" subtitle="Session tracking, drill targets, ball machine logs, and weekly practice hours." />

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
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Partner</th>
              <th className="text-left p-3">Duration</th>
              <th className="text-left p-3">Coach Notes</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="p-3 text-gray-400 text-xs">{s.date}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${s.type === 'On-court' ? 'bg-teal-600/20 text-teal-400' : s.type === 'Ball Machine' ? 'bg-blue-600/20 text-blue-400' : 'bg-orange-600/20 text-orange-400'}`}>{s.type}</span>
                </td>
                <td className="p-3 text-gray-300">{s.partner}</td>
                <td className="p-3 text-gray-400">{s.duration}</td>
                <td className="p-3 text-gray-400 text-xs">{s.coachNotes}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
    </div>
  );
}

// ─── VIDEO LIBRARY VIEW ────────────────────────────────────────────────────────
function VideoLibraryView() {
  const videos = [
    { title: 'Monte-Carlo R2 vs Hurkacz', category: 'Match Footage', date: '8 Apr 2026', duration: '1h 42m', tags: ['clay', 'win', 'M1000'] },
    { title: 'Monte-Carlo R1 vs Cerundolo', category: 'Match Footage', date: '7 Apr 2026', duration: '1h 18m', tags: ['clay', 'win', 'M1000'] },
    { title: 'Serve Pattern Drill — Body %', category: 'Practice Clips', date: '9 Apr 2026', duration: '12m', tags: ['serve', 'drill'] },
    { title: 'Rotterdam Final Highlights', category: 'Highlight Reels', date: '18 Feb 2026', duration: '8m', tags: ['indoor', 'title', 'ATP500'] },
    { title: 'Post-Match Debrief — Indian Wells QF', category: 'Post-match Debrief', date: '15 Mar 2026', duration: '22m', tags: ['hard', 'loss', 'debrief'] },
    { title: 'Martinez Clay Footage (2025)', category: 'Opponent Analysis', date: '5 Apr 2026', duration: '34m', tags: ['opponent', 'clay'] },
    { title: 'Australian Open R4 vs Sinner', category: 'Match Footage', date: '22 Jan 2026', duration: '2h 48m', tags: ['hard', 'loss', 'GS'] },
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
      <QuickActionsBar />
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
    </div>
  );
}

// ─── TEAM HUB VIEW ────────────────────────────────────────────────────────────
function TeamHubView({ player }: { player: TennisPlayer }) {
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
      location: 'London (remote)', status: 'Lululemon post pending', statusColor: 'yellow',
      lastNote: 'Caption drafted for Lululemon post',
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
      <QuickActionsBar />
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
    </div>
  );
}

// ─── PHYSIO VIEW ──────────────────────────────────────────────────────────────
function PhysioView() {
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
      <QuickActionsBar />
      <SectionHeader icon="⚕️" title="Physio & Recovery" subtitle="Injury log, medical clearance, WHOOP recovery scores, and treatment protocols." />

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
    </div>
  );
}

// ─── RACKET & STRINGS VIEW ────────────────────────────────────────────────────
function RacketView() {
  const setupSheet = [
    { tournament: 'Monte-Carlo 2026 (current)', surface: 'Clay', string: 'Luxilon ALU Power 125', mains: '24 kg', crosses: '23 kg', grips: '2 overgrips', tension: 'Mains loose — high humidity', alt: '24.5/23.5 if dry day' },
    { tournament: 'Madrid Open 2026', surface: 'Clay', string: 'Luxilon ALU Power 125', mains: '24 kg', crosses: '23 kg', grips: '2 overgrips', tension: 'Standard clay', alt: '' },
    { tournament: 'Roland-Garros 2026', surface: 'Clay', string: 'Luxilon ALU Power Rough 125', mains: '23.5 kg', crosses: '23 kg', grips: '2 overgrips', tension: 'Extra bite for topspin', alt: '' },
    { tournament: 'Wimbledon 2026', surface: 'Grass', string: 'Babolat VS Natural Gut 130 (M) / Luxilon ALU 130 (X)', mains: '27 kg', crosses: '26 kg', grips: '1 overgrip', tension: 'Higher for control on grass', alt: '' },
    { tournament: 'US Open 2026', surface: 'Hard', string: 'Luxilon ALU Power 125', mains: '25 kg', crosses: '24 kg', grips: '2 overgrips', tension: 'Standard hard', alt: '' },
  ];

  const inventory = [
    { id: 'Frame A', model: 'Wilson Blade 98 v9', weight: '305g strung', balance: '32cm', grip: 'L3', status: 'Match', location: 'On-site bag' },
    { id: 'Frame B', model: 'Wilson Blade 98 v9', weight: '306g strung', balance: '32cm', grip: 'L3', status: 'Match', location: 'On-site bag' },
    { id: 'Frame C', model: 'Wilson Blade 98 v9', weight: '304g strung', balance: '31.5cm', grip: 'L3', status: 'Practice', location: 'On-site bag' },
    { id: 'Frame D', model: 'Wilson Blade 98 v9', weight: '305g strung', balance: '32cm', grip: 'L3', status: 'Spare', location: 'Hotel room' },
    { id: 'Frame E', model: 'Wilson Blade 98 v9', weight: '303g strung', balance: '31cm', grip: 'L3', status: 'Transit', location: 'En route Barcelona' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
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
    </div>
  );
}

// ─── PLAYING PARTNERS VIEW ─────────────────────────────────────────────────────
function PlayingPartnersView() {
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
      <QuickActionsBar />
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
    </div>
  );
}

// ─── DOUBLES VIEW ──────────────────────────────────────────────────────────────
function DoublesView({ player }: { player: TennisPlayer }) {
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
      <QuickActionsBar />
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
    </div>
  );
}

// ─── SPONSORSHIP VIEW ─────────────────────────────────────────────────────────
function SponsorshipView() {
  const deals = [
    {
      sponsor: 'Wilson', category: 'Racket & Equipment', type: 'Equipment + Bonus', value: 'GBP 45,000/yr + bonuses', status: 'Active', expiry: 'Dec 2027', daysLeft: 638,
      obligations: ['Use Wilson frames in all ATP/WTA matches', 'Wear Wilson bag', 'Social media mentions: 2/month'],
      bonuses: ['Top 50 year-end: +GBP 10,000', 'Grand Slam QF: +GBP 5,000', 'Top 30: +GBP 20,000'],
    },
    {
      sponsor: 'Lululemon', category: 'Apparel', type: 'Kit + Fee', value: 'GBP 65,000/yr', status: 'Active', expiry: 'Jun 2027', daysLeft: 455,
      obligations: ['Wear Lululemon on court (all events)', 'Instagram post: 2/month minimum', 'Attend 1 brand event/yr'],
      bonuses: [],
    },
    {
      sponsor: 'Rolex', category: 'Watch / Luxury', type: 'Cash + Watch allocation', value: 'GBP 120,000/yr', status: 'Renewal due', expiry: 'May 2026', daysLeft: 47,
      obligations: ['Wear Rolex in all press conferences', 'Appear in 1 Rolex campaign/yr', 'Ranking report monthly to brand team'],
      bonuses: [],
    },
    {
      sponsor: 'HSBC', category: 'Financial Services', type: 'Platform partnership', value: 'GBP 30,000/yr', status: 'Active', expiry: 'Jan 2027', daysLeft: 295,
      obligations: ['Logo on hat (left side)', 'Post-tournament quote for HSBC social: 4/yr', '1 commercial appearance/yr'],
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
    { date: 'Today', platform: 'Instagram', brand: 'Lululemon', type: 'Match-day post', status: 'Due', draft: true },
    { date: 'This week', platform: 'Instagram', brand: 'HSBC', type: 'Post-match quote graphic', status: 'Upcoming', draft: false },
    { date: '21 Apr', platform: 'Instagram', brand: 'Lululemon', type: 'Monthly content post', status: 'Upcoming', draft: false },
    { date: '30 Apr', platform: 'Various', brand: 'Rolex', type: 'Monthly ranking report', status: 'Upcoming', draft: false },
    { date: 'Jun 2026', platform: 'TBD', brand: 'Rolex', type: 'Annual campaign shoot', status: 'Renewal pending', draft: false },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🤝" title="Sponsorship Manager" subtitle="Every deal, every obligation, every deadline — tracked automatically." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Annual Value" value="GBP 285k+" sub="Confirmed contracts" color="yellow" />
        <StatCard label="Active Deals" value="6" sub="1 renewal due" color="green" />
        <StatCard label="Rolex Renewal" value="47 days" sub="Action required" color="red" />
        <StatCard label="Obligations Due" value="1 today" sub="Lululemon post" color="orange" />
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
    </div>
  );
}

// ─── FINANCIAL VIEW ───────────────────────────────────────────────────────────
function FinancialView() {
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
      <QuickActionsBar />
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
    </div>
  );
}

// ─── EXHIBITION VIEW ───────────────────────────────────────────────────────────
function ExhibitionView() {
  const exhibitions = [
    { date: '13 Apr 2026', event: 'Monte-Carlo Exhibition Night', location: '🇲🇨 Monaco', fee: 'GBP 25,000', status: 'Confirmed', opponent: 'G. Monfils' },
    { date: '28 Jun 2026', event: 'Giorgio Armani Tennis Classic', location: '🇬🇧 London (Hurlingham)', fee: 'GBP 15,000', status: 'Confirmed', opponent: 'TBD' },
    { date: '15 Nov 2026', event: 'World Tennis League', location: '🇦🇪 Dubai', fee: 'GBP 40,000', status: 'Negotiating', opponent: 'Various (team event)' },
    { date: '22 Dec 2026', event: 'Tennis Christmas Charity Event', location: '🇬🇧 London O2', fee: 'GBP 8,000', status: 'Invited', opponent: 'TBD' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
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
    </div>
  );
}

// ─── AGENT PIPELINE VIEW ───────────────────────────────────────────────────────
function AgentPipelineView() {
  const deals = [
    { sponsor: 'Nike', value: 'GBP 150k/yr', stage: 'Negotiating', nextStep: 'Counter-offer due 15 Apr', category: 'Apparel (potential switch)' },
    { sponsor: 'Porsche', value: 'GBP 80k/yr', stage: 'Contacted', nextStep: 'Intro meeting scheduled 22 Apr', category: 'Automotive' },
    { sponsor: 'Therabody', value: 'GBP 25k/yr', stage: 'Prospect', nextStep: 'Agent to reach out', category: 'Recovery / Wellness' },
    { sponsor: 'Hublot', value: 'GBP 200k/yr', stage: 'Legal', nextStep: 'Contract review by 20 Apr', category: 'Watch (Rolex replacement option)' },
  ];

  const stages = ['Prospect', 'Contacted', 'Negotiating', 'Legal', 'Signed'];

  const watchlist = [
    { brand: 'Under Armour', sector: 'Apparel', potential: 'GBP 90k', notes: 'Expanding tennis portfolio' },
    { brand: 'Technogym', sector: 'Fitness', potential: 'GBP 20k', notes: 'Product + small fee' },
    { brand: 'Bose', sector: 'Audio', potential: 'GBP 35k', notes: 'Athlete programme open' },
    { brand: 'Red Bull', sector: 'Energy', potential: 'GBP 100k', notes: 'Need top 50 for consideration' },
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
      <QuickActionsBar />
      <SectionHeader icon="📋" title="Agent Pipeline" subtitle="Deals in negotiation, sponsor watchlist, and pipeline stages." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Negotiations" value="4" sub="In pipeline" color="purple" />
        <StatCard label="Pipeline Value" value="GBP 455k" sub="Total potential annual" color="yellow" />
        <StatCard label="Watchlist" value="4" sub="Potential sponsors" color="blue" />
        <StatCard label="Next Action" value="15 Apr" sub="Nike counter-offer" color="orange" />
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
    </div>
  );
}

// ─── MEDIA & CONTENT VIEW ─────────────────────────────────────────────────────
function MediaView() {
  const pressLog = [
    { event: 'Monte-Carlo R2 post-match', type: 'Press conference', status: 'Done', date: '8 Apr', notes: 'ATP mandatory — completed' },
    { event: 'Monte-Carlo QF post-match', type: 'Press conference', status: 'Upcoming', date: 'Today (post-match)', notes: 'ATP mandatory' },
    { event: 'Sky Sports UK (live)', type: 'Broadcast interview', status: 'Confirmed', date: 'Tomorrow 09:00', notes: '10-minute live slot — James briefing beforehand' },
    { event: 'Evening Standard feature', type: 'Print interview', status: 'TBC', date: 'Late April', notes: 'Agent to confirm scheduling' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📱" title="Media & Content" subtitle="Social calendar, sponsor content obligations, press log, and media schedule." />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Instagram Followers" value="184k" sub="^2.1k this month" color="purple" />
        <StatCard label="Avg Engagement" value="4.2%" sub="Above tour avg (2.8%)" color="teal" />
        <StatCard label="Posts This Month" value="3/4" sub="Lululemon: 2/2" color="blue" />
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
            { brand: 'Lululemon', rule: 'On-court: full Lululemon kit. No competitor logos visible. Training wear must also be Lululemon when filmed.' },
            { brand: 'Rolex', rule: 'Must wear Rolex Submariner in all press conferences and official ATP player events. Not required on court.' },
            { brand: 'Wilson', rule: 'Wilson bag visible at all ATP/WTA events. Wilson racket in all match play.' },
            { brand: 'HSBC', rule: 'HSBC logo on hat left panel. Must appear in all official ATP tournament photos.' },
          ].map((b, i) => (
            <div key={i} className="py-2 border-b border-gray-800/50">
              <div className="text-yellow-400 text-xs font-semibold mb-0.5">{b.brand}</div>
              <div className="text-gray-400 text-xs">{b.rule}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TRAVEL VIEW ─────────────────────────────────────────────────────────────
function TravelView() {
  const upcoming = [
    { event: 'Depart Monte-Carlo to Barcelona', date: '20 Apr', details: 'Flight EasyJet U2-4871 . 11:30 MCM to BCN . Team: Alex + Marco + Sarah', status: 'Booked' },
    { event: 'Arrive Barcelona — Hotel Arts', date: '20 Apr', details: 'Check-in 15:00 . 3 rooms booked (Alex suite, team rooms)', status: 'Confirmed' },
    { event: 'Practice courts — Real Club de Tenis Barcelona', date: '21 Apr', details: '09:00-11:30 . Court 2 reserved . Luis joining remotely for conditioning review', status: 'Confirmed' },
    { event: 'Barcelona ATP 500 — First round', date: '14-15 Apr (TBC)', details: 'Draw TBC . Transport from hotel arranged by tournament', status: 'TBC' },
    { event: 'Barcelona to Madrid (transfer)', date: '20 Apr', details: 'High-speed rail AVE . 2h journey . All 3 team members', status: 'Not booked' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="✈️" title="Travel & Logistics" subtitle="Event-by-event travel planning, hotel, court access, and team movement." />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Weeks on Tour (YTD)" value="14" sub="30+ planned 2026" color="blue" />
        <StatCard label="Flights Booked" value="8" sub="12 upcoming events" color="teal" />
        <StatCard label="Next Departure" value="20 Apr" sub="MCM to Barcelona" color="purple" />
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Upcoming Travel — Clay Swing</div>
        <div className="space-y-3">
          {upcoming.map((t, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-800/50">
              <div className={`text-xs px-2 py-0.5 rounded mt-0.5 flex-shrink-0 ${t.status === 'Confirmed' || t.status === 'Booked' ? 'bg-teal-600/20 text-teal-400' : t.status === 'Not booked' ? 'bg-red-600/20 text-red-400' : 'bg-gray-700 text-gray-400'}`}>{t.status}</div>
              <div>
                <div className="text-sm text-gray-200 font-medium">{t.event}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t.date} . {t.details}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Tournament Hotel Contacts</div>
        <div className="space-y-2 text-xs text-gray-400">
          {[
            { venue: 'Monte-Carlo Country Club', hotel: 'Hotel de Paris Monte-Carlo', contact: '+377 98 06 30 00', perDiem: 'EUR 200/night subsidised (ATP M1000)' },
            { venue: 'Real Club de Tenis Barcelona', hotel: 'Hotel Arts Barcelona', contact: '+34 93 221 10 00', perDiem: 'EUR 150/night (ATP 500)' },
            { venue: 'Caja Magica, Madrid', hotel: 'Eurostars Tower Hotel', contact: '+34 91 212 50 00', perDiem: 'EUR 150/night (ATP M1000)' },
            { venue: 'Foro Italico, Rome', hotel: 'Rome Cavalieri', contact: '+39 06 35091', perDiem: 'EUR 180/night (ATP M1000)' },
          ].map((h, i) => (
            <div key={i} className="py-2 border-b border-gray-800/50">
              <div className="text-gray-200 font-medium text-sm">{h.venue}</div>
              <div>{h.hotel} . {h.contact}</div>
              <div className="text-teal-400/70">{h.perDiem}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FEDERATION VIEW ─────────────────────────────────────────────────────────
function FederationView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
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
    </div>
  );
}

// ─── CAREER PLANNING VIEW ─────────────────────────────────────────────────────
function CareerView({ player }: { player: TennisPlayer }) {
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
      <QuickActionsBar />
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
    </div>
  );
}

// ─── ACADEMY VIEW ──────────────────────────────────────────────────────────────
function AcademyView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
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
            { name: 'Cameron Norrie', ranking: '#42', note: 'Active ATP tour' },
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
    </div>
  );
}

// ─── MENTAL PERFORMANCE VIEW ───────────────────────────────────────────────────
function MentalPerformanceView() {
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
      <QuickActionsBar />
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
    </div>
  );
}

// ─── SETTINGS VIEW ─────────────────────────────────────────────────────────────
function SettingsView({ player }: { player: TennisPlayer }) {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="⚙️" title="Settings" subtitle="Profile, notifications, team access, integrations, and billing." />

      {/* Profile Settings */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Profile Settings</div>
        <div className="space-y-4">
          {[
            { label: 'Full Name', value: player.name },
            { label: 'Email', value: 'alex.rivera@gmail.com' },
            { label: 'Timezone', value: 'Europe/London (BST)' },
            { label: 'Nationality', value: player.nationality },
            { label: 'Tour', value: player.tour },
            { label: 'Coach', value: player.coach },
          ].map((field, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50">
              <div className="text-sm text-gray-400">{field.label}</div>
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white min-w-[200px] text-right">{field.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Notification Preferences</div>
        <div className="space-y-3">
          {[
            { label: 'Morning Briefing', desc: 'Daily AI briefing at configured time', enabled: true },
            { label: 'Match Alerts', desc: 'Draw updates, court assignments, schedule changes', enabled: true },
            { label: 'Sponsor Obligations', desc: 'Content deadlines, appearance reminders', enabled: true },
            { label: 'Points Expiry Warnings', desc: '7-day advance warning on expiring points', enabled: true },
            { label: 'Travel Reminders', desc: 'Flight, hotel, and court booking notifications', enabled: false },
            { label: 'Team Messages', desc: 'Notes from coach, physio, agent', enabled: true },
            { label: 'Financial Alerts', desc: 'Prize money received, expense thresholds', enabled: false },
          ].map((n, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50">
              <div>
                <div className="text-sm text-gray-200">{n.label}</div>
                <div className="text-xs text-gray-500">{n.desc}</div>
              </div>
              <div className={`w-10 h-5 rounded-full cursor-pointer transition-colors ${n.enabled ? 'bg-purple-600' : 'bg-gray-700'}`}>
                <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${n.enabled ? 'ml-5.5' : 'ml-0.5'}`} style={{ marginLeft: n.enabled ? '22px' : '2px', marginTop: '2px' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Access */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Team Access Permissions</div>
        <div className="space-y-2">
          {[
            { name: 'Marco Bianchi (Coach)', access: 'Full', sections: 'All sections' },
            { name: 'Sarah Okafor (Physio)', access: 'Limited', sections: 'Physio, Schedule, Team Hub' },
            { name: 'James Whitfield (Agent)', access: 'Commercial', sections: 'Sponsorship, Media, Financial, Pipeline' },
            { name: 'Luis Santos (Fitness)', access: 'Limited', sections: 'Physio, Practice Log, Schedule' },
            { name: 'Dr. Kate Sterling (Mental)', access: 'Limited', sections: 'Mental Performance, Schedule' },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-800/50 text-sm">
              <div className="flex-1 text-gray-200">{t.name}</div>
              <span className={`text-xs px-2 py-0.5 rounded ${t.access === 'Full' ? 'bg-teal-600/20 text-teal-400' : t.access === 'Commercial' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-blue-600/20 text-blue-400'}`}>{t.access}</span>
              <div className="text-xs text-gray-500">{t.sections}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Integrations */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Data Integrations</div>
        <div className="space-y-3">
          {[
            { name: 'WHOOP', desc: 'Recovery, HRV, sleep data', status: 'Connected', icon: '⌚' },
            { name: 'Hawkeye / ATP Stats', desc: 'Match stats, serve data, rally length', status: 'Connected', icon: '📊' },
            { name: 'ElevenLabs', desc: 'AI voice for morning briefings', status: 'Connected', icon: '🎙️' },
            { name: 'Google Calendar', desc: 'Tournament & travel sync', status: 'Connected', icon: '📅' },
            { name: 'Xero (Accounting)', desc: 'Financial data export', status: 'Not connected', icon: '💰' },
          ].map((int, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800/50">
              <span className="text-lg">{int.icon}</span>
              <div className="flex-1">
                <div className="text-sm text-gray-200">{int.name}</div>
                <div className="text-xs text-gray-500">{int.desc}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${int.status === 'Connected' ? 'bg-teal-600/20 text-teal-400' : 'bg-gray-700 text-gray-400'}`}>{int.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Billing */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Billing</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
            <div className="text-sm text-gray-200">Current Plan</div>
            <div className="text-sm text-purple-400 font-semibold">Pro+ (GBP 299/mo)</div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
            <div className="text-sm text-gray-200">Next Payment</div>
            <div className="text-sm text-gray-300">1 May 2026</div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
            <div className="text-sm text-gray-200">Payment Method</div>
            <div className="text-sm text-gray-300">Visa ending 4821</div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="text-sm text-gray-200">Annual Cost</div>
            <div className="text-sm text-gray-300">GBP 3,588 (GBP 299 x 12)</div>
          </div>
        </div>
        <button className="mt-4 text-xs text-purple-400 hover:text-purple-300">Upgrade to Elite plan &rarr;</button>
      </div>
    </div>
  );
}

// ─── PLAYER PROFILE CARD (ENHANCED) ──────────────────────────────────────────
function PlayerCard({ player }: { player: TennisPlayer }) {
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
        {/* Player photo placeholder */}
        <div className="w-full h-28 rounded-lg mb-3 flex items-center justify-center text-5xl"
          style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.2) 0%, rgba(13,148,136,0.2) 100%)', border: '1px solid rgba(108,63,197,0.3)' }}>
          {player.flag}
        </div>
        {/* Name */}
        <div className="text-white font-black text-sm uppercase tracking-wide text-center leading-tight mb-0.5">
          {player.name.split(' ')[0]}
        </div>
        <div className="text-purple-300 font-bold text-xs uppercase tracking-widest text-center mb-2">
          {player.name.split(' ').slice(1).join(' ')}
        </div>

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
const LiveScoresView = ({ liveScores, fixtures }: { liveScores: any[]; fixtures: any[] }) => {
  const DEMO_MATCHES = [
    { p1: 'J. Sinner [1]', p2: 'C. Alcaraz [2]', score: '6-4 3-6 6-3', tournament: 'Monte Carlo Masters', surface: 'Clay', round: 'Final', status: 'Live', set: '3rd set' },
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
    </div>
  );
};

// ─── OPPONENT SCOUT VIEW ────────────────────────────────────────────────────────
const OpponentScoutView = ({ h2hData }: { h2hData: any[] }) => {
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
    </div>
  );
};

// ─── SURFACE ANALYSIS VIEW ──────────────────────────────────────────────────────
const SurfaceAnalysisView = ({ player }: { player: TennisPlayer }) => {
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
    </div>
  );
};

// ─── DRAW & BRACKET VIEW ────────────────────────────────────────────────────────
const DrawBracketView = () => {
  const [drawTab, setDrawTab] = useState<'draw'|'schedule'|'prize'|'points'>('draw');
  const rounds = ['R16', 'QF', 'SF', 'Final'];
  const bracket = [
    // R16 matchups (8 matches)
    [
      { p1: 'T. Nakashima [1]', p2: 'Qualifier', score: '6-3 6-4', winner: 1 },
      { p1: 'L. Musetti [8]', p2: 'M. Cressy', score: '7-6 6-4', winner: 1 },
      { p1: 'J. Draper [3]', p2: 'D. Shapovalov', score: '6-2 7-5', winner: 1 },
      { p1: 'B. Shelton [5]', p2: 'F. Cerundolo', score: '4-6 6-3 7-6', winner: 1 },
      { p1: 'A. Fils [4]', p2: 'L. Djere', score: '6-1 6-3', winner: 1 },
      { p1: 'A. Rivera [6]', p2: 'R. Carballes', score: '6-4 6-2', winner: 1 },
      { p1: 'C. Ferreira [7]', p2: 'J. Munar', score: '7-5 6-7 6-4', winner: 1 },
      { p1: 'U. Humbert [2]', p2: 'M. Arnaldi', score: '6-3 6-4', winner: 1 },
    ],
    // QF (4 matches)
    [
      { p1: 'T. Nakashima [1]', p2: 'L. Musetti [8]', score: '', winner: 0 },
      { p1: 'J. Draper [3]', p2: 'B. Shelton [5]', score: '', winner: 0 },
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
    </div>
  );
};

// ─── TEAM COMMS VIEW ────────────────────────────────────────────────────────────
const TeamCommsView = () => {
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
    </div>
  );
};

// ─── ACCREDITATIONS VIEW ────────────────────────────────────────────────────────
const AccreditationsView = () => {
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
    </div>
  );
};

// ─── POINTS FORECASTER VIEW ──────────────────────────────────────────────────
const PointsForecasterView = ({ player }: { player: TennisPlayer }) => {
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
    </div>
  );
};

// ─── ENTRY MANAGER VIEW ─────────────────────────────────────────────────────────
const EntryManagerView = () => {
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
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function TennisTourPage() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const player = DEMO_PLAYER;
  const [liveScores, setLiveScores] = useState<any[]>([]);
  const [h2hData, setH2hData] = useState<any[]>([]);
  const [fixtures, setFixtures] = useState<any[]>([]);

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

  const groups = ['OVERVIEW', 'PERFORMANCE', 'TEAM', 'COMMERCIAL', 'OPERATIONS'];

  const renderView = () => {
    switch (activeSection) {
      case 'dashboard':    return <DashboardView player={player} />;
      case 'morning':      return <MorningBriefingView player={player} />;
      case 'rankings':     return <RankingsView player={player} />;
      case 'forecaster':   return <PointsForecasterView player={player} />;
      case 'entries':      return <EntryManagerView />;
      case 'schedule':     return <ScheduleView />;
      case 'performance':  return <PerformanceView player={player} />;
      case 'matchprep':    return <MatchPrepView />;
      case 'practice':     return <PracticeLogView />;
      case 'video':        return <VideoLibraryView />;
      case 'team':         return <TeamHubView player={player} />;
      case 'physio':       return <PhysioView />;
      case 'racket':       return <RacketView />;
      case 'partners':     return <PlayingPartnersView />;
      case 'doubles':      return <DoublesView player={player} />;
      case 'sponsorship':  return <SponsorshipView />;
      case 'media':        return <MediaView />;
      case 'financial':    return <FinancialView />;
      case 'exhibition':   return <ExhibitionView />;
      case 'pipeline':     return <AgentPipelineView />;
      case 'travel':       return <TravelView />;
      case 'federation':   return <FederationView />;
      case 'career':       return <CareerView player={player} />;
      case 'academy':      return <AcademyView />;
      case 'mental':       return <MentalPerformanceView />;
      case 'courtbooking': return <CourtBookingView />;
      case 'teamcomms':    return <TeamCommsView />;
      case 'accreditations': return <AccreditationsView />;
      case 'settings':     return <SettingsView player={player} />;
      case 'livescores':  return <LiveScoresView liveScores={liveScores} fixtures={fixtures} />;
      case 'scout':       return <OpponentScoutView h2hData={h2hData} />;
      case 'surface':     return <SurfaceAnalysisView player={player} />;
      case 'draw':        return <DrawBracketView />;
      default:             return <DashboardView player={player} />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#07080F', fontFamily: 'DM Sans, sans-serif', color: '#e5e7eb' }}>
      {/* Sidebar */}
      <div className={`flex-shrink-0 transition-all duration-200 flex flex-col border-r border-gray-800 ${sidebarCollapsed ? 'w-14' : 'w-56'}`}
        style={{ background: '#0a0c14' }}>
        {/* Sidebar Header */}
        <div className="p-3 border-b border-gray-800 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ background: 'linear-gradient(90deg, #8B5CF6, #22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                LUMIO TOUR
              </div>
              <div className="text-[10px] text-gray-600">Tennis</div>
            </div>
          )}
          {sidebarCollapsed && <span className="text-lg mx-auto">🎾</span>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-gray-600 hover:text-gray-400 text-xs ml-auto flex-shrink-0">
            {sidebarCollapsed ? '>' : '<'}
          </button>
        </div>

        {/* Player Mini Card */}
        {!sidebarCollapsed && (
          <div className="p-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm border border-purple-500/40"
                style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.3), rgba(13,148,136,0.3))' }}>
                {player.flag}
              </div>
              <div>
                <div className="text-xs font-semibold text-white">{player.name}</div>
                <div className="text-[10px] text-gray-500">#{player.ranking} ATP . {player.nationality}</div>
              </div>
            </div>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {groups.map(group => {
            const items = SIDEBAR_ITEMS.filter(i => i.group === group);
            return (
              <div key={group} className="mb-3">
                {!sidebarCollapsed && (
                  <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-2 mb-1">{group}</div>
                )}
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg mb-0.5 transition-all text-left ${
                      activeSection === item.id
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-600/30'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    {!sidebarCollapsed && <span className="text-xs font-medium truncate">{item.label}</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-gray-800">
            <div className="text-[9px] text-gray-700 uppercase tracking-wider font-medium">Plan</div>
            <div className="text-xs text-purple-400 font-semibold mt-0.5">Pro+ . GBP 299/mo</div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex-shrink-0 border-b border-gray-800 px-6 py-3 flex items-center justify-between"
          style={{ background: '#0a0c14' }}>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500 font-medium capitalize">
              {SIDEBAR_ITEMS.find(i => i.id === activeSection)?.icon} {SIDEBAR_ITEMS.find(i => i.id === activeSection)?.label}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-600">Monte-Carlo . Clay . Live</div>
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
            <div className="text-xs text-gray-500">ATP Monte-Carlo Masters</div>
          </div>
        </div>

        {/* Content + Card Row */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <WaveBanner player={player} />
            {renderView()}
          </div>

          {/* Player Card Column */}
          <div className="hidden lg:flex flex-col items-center gap-4 p-4 border-l border-gray-800 flex-shrink-0"
            style={{ width: '220px' }}>
            <PlayerCard player={player} />
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Live Match</div>
              <div className="text-xs text-teal-400 font-medium">In Progress</div>
              <div className="text-xs text-gray-300 mt-1">vs C. Martinez</div>
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
                <div className="text-xs text-yellow-400">Rolex renewal: 47d</div>
                <div className="text-xs text-yellow-400">Lululemon post due</div>
                <div className="text-xs text-red-400">125 pts expire today</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
