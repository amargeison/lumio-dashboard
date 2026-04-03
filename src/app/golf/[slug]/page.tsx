'use client';

import { useState } from 'react';

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
const PlayerCard = ({ player }: { player: GolfPlayer }) => (
  <div className="relative w-52 rounded-xl overflow-hidden border-2 border-green-600/40 shadow-2xl shadow-green-900/30 flex-shrink-0"
    style={{ background: 'linear-gradient(135deg, #0a1a0a 0%, #0d1929 50%, #0a1a12 100%)' }}>
    <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #16a34a, #0D9488, #6C3FC5)' }}></div>
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="text-center">
          <div className="text-3xl font-black text-white leading-none">{player.owgr}</div>
          <div className="text-[10px] text-green-400 font-medium uppercase tracking-wider">OWGR</div>
        </div>
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

function DashboardView({ player }: { player: GolfPlayer }) {
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
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="text-yellow-400 text-sm font-semibold mb-1">⚠️ Points Expiring</div>
          <div className="text-white font-bold text-lg">330 pts</div>
          <div className="text-xs text-gray-400">Scottish Open T6 (Jul 25) — need T10 or better this week to replace</div>
        </div>
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
    </div>
  );
}

function MorningBriefingView({ player }: { player: GolfPlayer }) {
  const [recipient, setRecipient] = useState<'player'|'caddie'|'coach'|'agent'>('player');
  const briefings = {
    player: `Good morning, ${player.name.split(' ')[0]}. OWGR: 87th, up three places. Race to Dubai: 43rd — you need a top-12 finish this week to break into the top 40. This week at Golfclub München Eichenried is your third-best course fit on tour based on your approach stats from 150–175 yards. Your SG Putting is losing 1.18 strokes per round from 8–15 feet over the last six events — Pete has set this as the practice priority this morning. Tee time Thursday at 09:42 alongside Rory McIlroy and Tyrrell Hatton. TaylorMade equipment review call at 4pm — deal renewal is 18 days out. Your Callaway post is due today — Sarah has the caption ready for your review. Make it count.`,
    caddie: `Morning briefing for Mick O'Brien. Course conditions: heavy dew, soft greens, 12mph wind from the south-west — club up on approaches. Player readiness score: 78/100, lower back flagged mild — watch his tempo. Hole strategy notes: Hole 7 and 15 are the scoring holes based on last year's data; play conservatively into 9 and 16. James wants to attack the par-5s in two — wind should allow on 4 and 12. Putting has been poor from 8–15ft — encourage aggressive reads early to find rhythm. Carry sheet updated in the app.`,
    coach: `Morning briefing for Pete Larsen. James's SG Putting has deteriorated to -1.18 over the last 6 events. Practice focus today: 120 balls from 8–15ft, left-to-right reads on fast grain. His SG Approach is holding at +0.41 — distance control from 150–175 yards remains elite. His SG Off the Tee has dropped -0.28 — three fairways missed right in each of the last two rounds, possible early extension. Track his tempo in morning session. Course fit for this week: 8.1 out of 10 — excellent. He should be confident.`,
    agent: `Morning briefing for Sarah Mitchell. TaylorMade deal renewal is 18 days out — agenda confirmed for 4pm call. Callaway post is due today — draft is in the sponsorship tab awaiting James's approval. Performance bonus trigger: top 10 this week activates the Callaway performance clause — £8,500 bonus. Race to Dubai position is 43rd — update report due to all sponsors end of month. Next pro-am commitment: BMW International partners briefing today at 2:30pm. Media obligation: one press conference post-round Thursday.`,
  };
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
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm text-green-400 font-medium">Today's briefing — {recs.find(r => r.key === recipient)?.label}</span>
          </div>
          <button className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            ▶ Play Briefing
          </button>
        </div>
        <div className="text-gray-300 text-sm leading-relaxed border-l-2 border-green-600/50 pl-4">
          "{briefings[recipient]}"
        </div>
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

function OWGRView({ player }: { player: GolfPlayer }) {
  const scenarios = [
    { result: 'Win', event: 'BMW International', newOWGR: 71, change: '+16', rtd: 'T35' },
    { result: 'T2–T5', event: 'BMW International', newOWGR: 79, change: '+8', rtd: 'T41' },
    { result: 'T6–T10', event: 'BMW International', newOWGR: 83, change: '+4', rtd: 'T42' },
    { result: 'T11–T20', event: 'BMW International', newOWGR: 86, change: '+1', rtd: 'T43' },
    { result: 'T21–T40', event: 'BMW International', newOWGR: 88, change: '-1', rtd: 'T44' },
    { result: 'MC', event: 'BMW International', newOWGR: 92, change: '-5', rtd: 'T46' },
  ];
  const pointsExpiry = [
    { event: 'Genesis Scottish Open', pos: 'T6', points: 330, expires: 'Jul 12 2026', urgency: 'high' },
    { event: 'KLM Open', pos: 'T3', points: 480, expires: 'Jun 7 2026', urgency: 'medium' },
    { event: 'BMW PGA Championship', pos: 'T14', points: 88, expires: 'Sep 6 2026', urgency: 'low' },
    { event: 'Austrian Alpine Open', pos: 'T31', points: 42, expires: 'May 31 2026', urgency: 'medium' },
    { event: 'Hero Indian Open', pos: 'T22', points: 38, expires: 'Mar 29 2026', urgency: 'high' },
  ];
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
            <tbody>{pointsExpiry.map((p, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="py-2 text-gray-300">{p.event}</td>
                <td className="py-2 text-gray-400">{p.pos}</td>
                <td className={`py-2 font-medium ${p.urgency === 'high' ? 'text-red-400' : p.urgency === 'medium' ? 'text-yellow-400' : 'text-gray-400'}`}>{p.points}</td>
                <td className="py-2 text-gray-500">{p.expires}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ScheduleView() {
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
  return (
    <div className="space-y-6">
      <SectionHeader icon="🏌️" title="Caddie Workflow" subtitle="Digital yardage book, hole strategy notes, in-round stat log, and pre-round checklist." />
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
          <button className="text-xs text-green-400 hover:text-green-300">Export for accountant →</button>
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

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function GolfTourPage() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const player = DEMO_PLAYER;
  const groups = ['OVERVIEW', 'PERFORMANCE', 'TEAM', 'COMMERCIAL', 'OPERATIONS'];

  const renderView = () => {
    switch (activeSection) {
      case 'dashboard':   return <DashboardView player={player} />;
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
      case 'matchprep':   return <PlaceholderView icon="🎯" title="Round Prep" description="Hole-by-hole strategy, opponent/playing partner analysis, weather briefing, and pre-round routine builder." />;
      case 'media':       return <PlaceholderView icon="📱" title="Media & Content" description="Social media calendar, sponsor content obligations, press log, and interview management." />;
      case 'agent':       return <PlaceholderView icon="📬" title="Agent Pipeline" description="Deals in negotiation, sponsor pipeline, renewal timelines, and commercial opportunity tracking." />;
      case 'travel':      return <PlaceholderView icon="✈️" title="Travel & Logistics" description="Event-by-event travel planning, hotel contacts, per-diem tracker, and caddie movement planning." />;
      case 'qualifying':  return <PlaceholderView icon="🎓" title="Q-School & Qualifying" description="Monday qualifier management, Q-School countdown, sectional qualifying entries, and status tracker." />;
      case 'video':       return <PlaceholderView icon="🎬" title="Video Library" description="Swing session recordings, competition footage, post-round debriefs, and coach clip library." />;
      case 'settings':    return <PlaceholderView icon="⚙️" title="Settings" description="Profile, notifications, team access, data integrations (Arccos, WHOOP, TrackMan), and billing." />;
      default:            return <DashboardView player={player} />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#07080F', fontFamily: 'DM Sans, sans-serif', color: '#e5e7eb' }}>
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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm border border-green-500/40" style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.3), rgba(13,148,136,0.3))' }}>{player.flag}</div>
              <div><div className="text-xs font-semibold text-white">{player.name}</div><div className="text-[10px] text-gray-500">#{player.owgr} OWGR · {player.nationality}</div></div>
            </div>
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
            <PlayerCard player={player} />
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
