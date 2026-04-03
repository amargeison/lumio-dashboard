'use client';

import { useState, useEffect, useRef } from 'react';

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
}

// ─── SIDEBAR ITEMS ────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',         icon: '🏠', group: 'OVERVIEW' },
  { id: 'morning',      label: 'Morning Briefing',  icon: '🌅', group: 'OVERVIEW' },
  { id: 'rankings',     label: 'Rankings & Race',   icon: '📊', group: 'PERFORMANCE' },
  { id: 'schedule',     label: 'Tournament Schedule',icon: '🗓️', group: 'PERFORMANCE' },
  { id: 'performance',  label: 'Performance Stats', icon: '📈', group: 'PERFORMANCE' },
  { id: 'matchprep',    label: 'Match Prep',        icon: '🎯', group: 'PERFORMANCE' },
  { id: 'team',         label: 'Team Hub',          icon: '👥', group: 'TEAM' },
  { id: 'physio',       label: 'Physio & Recovery', icon: '⚕️', group: 'TEAM' },
  { id: 'racket',       label: 'Racket & Strings',  icon: '🎾', group: 'TEAM' },
  { id: 'sponsorship',  label: 'Sponsorship',       icon: '🤝', group: 'COMMERCIAL' },
  { id: 'media',        label: 'Media & Content',   icon: '📱', group: 'COMMERCIAL' },
  { id: 'financial',    label: 'Financial Dashboard',icon: '💰', group: 'COMMERCIAL' },
  { id: 'travel',       label: 'Travel & Logistics',icon: '✈️', group: 'OPERATIONS' },
  { id: 'federation',   label: 'Federation',        icon: '🏛️', group: 'OPERATIONS' },
  { id: 'career',       label: 'Career Planning',   icon: '🚀', group: 'OPERATIONS' },
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
};

// ─── SURFACE BADGE ─────────────────────────────────────────────────────────────
const SurfaceBadge = ({ surface }: { surface: string }) => {
  const colors: Record<string, string> = {
    'Clay': 'bg-orange-600/20 text-orange-400 border border-orange-600/30',
    'Hard': 'bg-blue-600/20 text-blue-400 border border-blue-600/30',
    'Grass': 'bg-green-600/20 text-green-400 border border-green-600/30',
    'Indoor Hard': 'bg-purple-600/20 text-purple-400 border border-purple-600/30',
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

// ─── DASHBOARD VIEW ────────────────────────────────────────────────────────────
function DashboardView({ player }: { player: TennisPlayer }) {
  const nextMatch = { opponent: 'C. Martinez', nationality: '🇪🇸', ranking: 34, time: '13:00', court: 'Court 4', tournament: 'Monte-Carlo Masters', surface: 'Clay' };
  const todayTasks = [
    { time: '07:30', task: 'AI Morning Briefing', done: true },
    { time: '08:30', task: 'Physio treatment — right shoulder', done: true },
    { time: '10:00', task: 'Practice session — serve patterns (90 min)', done: false },
    { time: '11:45', task: 'Stringing with Carlos — clay tensions (2× Wilson Luxilon ALU)', done: false },
    { time: '12:30', task: 'Pre-match meal + rest', done: false },
    { time: '13:00', task: 'Match vs C. Martinez — Court 4', done: false },
    { time: '15:30', task: 'Post-match debrief with Marco', done: false },
    { time: 'By 18:00', task: 'Lululemon Instagram post due — agent has drafted caption', done: false },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon="🏠" title={`Good morning, ${player.name.split(' ')[0]}.`} subtitle="Here's your overview for today." />

      {/* Key Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="ATP Ranking" value={`#${player.ranking}`} sub="▲2 this week" color="purple" />
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
            <div className="text-xs text-gray-500">{nextMatch.time} · {nextMatch.court}</div>
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
          <span>H2H: <span className="text-white font-medium">3 – 1</span> in your favour</span>
          <span>Clay serve avg: <span className="text-yellow-400 font-medium">61%</span> (4% below season avg)</span>
          <span className="ml-auto text-teal-400 text-xs">Coach notes ready ↗</span>
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
          <div className="text-yellow-400 text-sm font-semibold mb-1">⚠️ Points Expiring This Week</div>
          <div className="text-white font-bold text-lg">125 pts</div>
          <div className="text-xs text-gray-400">Monte-Carlo QF last year — need SF to maintain</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="text-blue-400 text-sm font-semibold mb-1">📋 Sponsor Obligation Today</div>
          <div className="text-white font-bold text-lg">Lululemon Post</div>
          <div className="text-xs text-gray-400">Caption drafted by James — review in Sponsorship tab</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="text-green-400 text-sm font-semibold mb-1">💰 Prize Money This Week</div>
          <div className="text-white font-bold text-lg">€47,500 (QF)</div>
          <div className="text-xs text-gray-400">SF would add €92,000 · Final €197,000</div>
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
    agent: `Morning briefing for James Whitfield. Lululemon Instagram post is due today — draft is in the sponsorship tab awaiting Alex's approval. The Rolex deal renewal is 47 days out — agenda item for Friday's call. Performance bonus trigger: if Alex reaches the semi-final this week, the Wilson performance clause activates — £8,500 bonus. Race standing is 54th — 312 points behind the cut-off for the 8-man Turin field. Next ranking report to Rolex is due end of month. No press obligations today.`,
    physio: `Morning briefing for Sarah Okafor. Alex's WHOOP recovery score is 82. Right shoulder flagged mild yesterday — completed 20-minute treatment this morning, strapping applied, cleared for full practice. Pre-match treatment window is 12:00–12:30 before the 13:00 match. Watch for serve load during warm-up — cap at 40 serves in practice. Travel departs Saturday — next event is Barcelona ATP 500, clay, 13–19 April. No new injury flags from the training log.`,
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
            {playing ? '⏹ Stop' : '▶ Play Briefing'}
          </button>
        </div>
        <div className="text-gray-300 text-sm leading-relaxed border-l-2 border-purple-600/50 pl-4">
          "{briefings[recipient]}"
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
      <SectionHeader icon="📊" title="Rankings & Race Intelligence" subtitle="Live ranking position, points tracker, race standings, and scenario modelling." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="ATP Ranking" value={`#${player.ranking}`} sub="▲2 this week" color="purple" />
        <StatCard label="Race to Turin" value={`#${player.race_ranking}`} sub="312 pts behind cut" color="teal" />
        <StatCard label="Total Points" value={player.ranking_points.toLocaleString()} sub="52-week rolling" color="blue" />
        <StatCard label="Career High" value={`#${player.career_high}`} sub={player.career_high_date} color="orange" />
      </div>

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
            { rank: 8, name: 'K. Menšík', pts: 3820, flag: '🇨🇿', qualified: false },
            { rank: 54, name: player.name, pts: player.ranking_points, flag: player.flag, qualified: false, isPlayer: true },
          ].map((p: { rank: number; name: string; pts: number; flag: string; qualified: boolean; isPlayer?: boolean }, i) => (
            <div key={i} className={`flex items-center gap-3 py-2 px-3 rounded-lg ${p.isPlayer ? 'bg-purple-600/20 border border-purple-500/30' : 'bg-gray-900/20'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${p.qualified ? 'bg-teal-600/30 text-teal-400' : 'bg-gray-800 text-gray-400'}`}>
                {p.rank}
              </div>
              <span className="text-sm">{p.flag}</span>
              <span className={`text-sm flex-1 ${p.isPlayer ? 'text-purple-400 font-semibold' : 'text-gray-300'}`}>{p.name}{p.isPlayer ? ' ← YOU' : ''}</span>
              <span className={`text-sm font-medium ${p.qualified ? 'text-teal-400' : 'text-gray-400'}`}>{p.pts.toLocaleString()} pts</span>
              {p.qualified && <span className="text-xs text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded">Qualified</span>}
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-500">Top 8 qualify. You need <span className="text-yellow-400 font-medium">+1,973 pts</span> to reach the cut-off line at this stage.</div>
      </div>

      {/* Points Expiry */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">⚠️ Points Expiry Calendar (Rolling 52 Weeks)</div>
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
        <div className="text-sm font-semibold text-white mb-4">🎯 Scenario Modelling — Monte-Carlo</div>
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
    { date: '6–12 Apr',   tournament: 'Monte-Carlo Masters',              cat: 'Masters 1000',  surface: 'Clay',        location: '🇲🇨 Monaco',    status: 'active',   points: 215, entered: true },
    { date: '13–19 Apr',  tournament: 'Barcelona Open',                   cat: 'ATP 500',       surface: 'Clay',        location: '🇪🇸 Barcelona', status: 'upcoming', points: 0,   entered: true },
    { date: '13–19 Apr',  tournament: 'BMW Open Munich',                  cat: 'ATP 500',       surface: 'Clay',        location: '🇩🇪 Munich',    status: 'upcoming', points: 0,   entered: false },
    { date: '22 Apr–3 May',tournament: 'Madrid Open',                     cat: 'Masters 1000',  surface: 'Clay',        location: '🇪🇸 Madrid',    status: 'upcoming', points: 0,   entered: true },
    { date: '6–17 May',   tournament: 'Rome Masters',                     cat: 'Masters 1000',  surface: 'Clay',        location: '🇮🇹 Rome',      status: 'upcoming', points: 0,   entered: true },
    { date: '18–24 May',  tournament: 'Hamburg Open',                     cat: 'ATP 500',       surface: 'Clay',        location: '🇩🇪 Hamburg',   status: 'upcoming', points: 0,   entered: false },
    { date: '24 May–7 Jun',tournament: 'Roland-Garros',                   cat: 'Grand Slam',    surface: 'Clay',        location: '🇫🇷 Paris',     status: 'upcoming', points: 0,   entered: true },
    { date: '15–21 Jun',  tournament: 'Halle Open',                       cat: 'ATP 500',       surface: 'Grass',       location: '🇩🇪 Halle',     status: 'upcoming', points: 0,   entered: true },
    { date: '15–21 Jun',  tournament: "Queen's Club",                     cat: 'ATP 500',       surface: 'Grass',       location: '🇬🇧 London',    status: 'upcoming', points: 0,   entered: false },
    { date: '30 Jun–13 Jul',tournament: 'Wimbledon',                      cat: 'Grand Slam',    surface: 'Grass',       location: '🇬🇧 London',    status: 'upcoming', points: 0,   entered: true },
    { date: '28 Jul–3 Aug',tournament: 'Washington DC Open',              cat: 'ATP 500',       surface: 'Hard',        location: '🇺🇸 Washington',status: 'upcoming', points: 0,   entered: true },
    { date: '10–23 Aug',  tournament: 'Canadian Open (Montreal)',         cat: 'Masters 1000',  surface: 'Hard',        location: '🇨🇦 Montreal',  status: 'upcoming', points: 0,   entered: true },
    { date: '25 Aug–7 Sep',tournament: 'US Open',                         cat: 'Grand Slam',    surface: 'Hard',        location: '🇺🇸 New York',  status: 'upcoming', points: 0,   entered: true },
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
                  {t.status === 'active' && <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">● In Progress</span>}
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
    { tournament: 'Miami Open', cat: 'Masters 1000', surface: 'Hard', result: 'R3', opponent: 'Menšík', score: '4-6, 6-3, 2-6', wl: 'L' },
    { tournament: 'Dubai ATP 500', cat: 'ATP 500', surface: 'Hard', result: 'SF', opponent: 'Tsitsipas', score: '6-7, 3-6', wl: 'L' },
    { tournament: 'Rotterdam ATP 500', cat: 'ATP 500', surface: 'Indoor', result: 'W', opponent: 'Paul', score: '6-4, 7-6', wl: 'W' },
    { tournament: 'Australian Open', cat: 'Grand Slam', surface: 'Hard', result: 'R4', opponent: 'Sinner', score: '3-6, 4-6, 7-5, 2-6', wl: 'L' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon="📈" title="Performance Stats" subtitle={`${player.name} · 2026 season statistics by surface, match patterns, and form tracker.`} />

      {/* Season Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Matches', value: '50', sub: '34W / 16L' },
          { label: 'Win Rate', value: '68%', sub: '2026 season' },
          { label: 'Aces/match', value: '6.1', sub: '▲0.4 vs 2025' },
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
                <div className="text-xs text-gray-500">vs {m.opponent} · {m.score}</div>
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
          <span className="ml-2 text-xs text-gray-500 self-center">← most recent</span>
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
      <SectionHeader icon="🎯" title="Match Prep" subtitle="Opponent analysis, tactical briefing, H2H history, and coach notes." />

      {/* Opponent Card */}
      <div className="bg-gradient-to-r from-red-900/20 to-orange-900/10 border border-red-600/20 rounded-xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-red-600/20 border-2 border-red-500/30 flex items-center justify-center text-2xl">{opponent.flag}</div>
          <div>
            <div className="text-white font-bold text-xl">{opponent.name}</div>
            <div className="text-gray-400 text-sm">#{opponent.ranking} ATP · {opponent.height} · {opponent.plays} · {opponent.backhand} BH</div>
            <div className="text-gray-500 text-xs">Coach: {opponent.coach} · Career High: #{opponent.careerHigh}</div>
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
        <div className="text-sm font-semibold text-white mb-4">📋 Opponent Patterns — Clay</div>
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
          <span className="text-purple-400 text-sm font-semibold">📝 Coach Notes — Marco Bianchi</span>
          <span className="text-xs text-gray-600">Updated today 08:15</span>
        </div>
        <div className="text-gray-300 text-sm leading-relaxed space-y-3">
          <p>Martinez is beatable on clay if you control the centre. His inside-out forehand is dangerous but he telegraphs it — if you step left early on break points, you can redirect down the line and he has no time.</p>
          <p>Target his backhand in long rallies. Above 8 shots, his win rate drops significantly. Avoid short-ball patterns — he punishes anything above the knee on the forehand side.</p>
          <p>Second serve out wide in the deuce court is the play. He returns crosscourt almost every time. Set up the next ball inside-in forehand. We've drilled this 40 times this week.</p>
          <p className="text-teal-400">Key: win the first set. He mentally disengages if he loses it.</p>
        </div>
      </div>
    </div>
  );
}

// ─── TEAM HUB VIEW ────────────────────────────────────────────────────────────
function TeamHubView({ player }: { player: TennisPlayer }) {
  const team = [
    {
      role: 'Lead Coach',
      name: 'Marco Bianchi',
      flag: '🇮🇹',
      location: 'Travelling with player',
      status: 'On-site Monte-Carlo',
      statusColor: 'green',
      lastNote: 'Match prep uploaded · 08:15 today',
      responsibilities: ['Match tactics & opponent prep', 'Practice structure & drill design', 'In-match coaching (during changeovers)', 'Post-match debrief'],
    },
    {
      role: 'Physio',
      name: 'Sarah Okafor',
      flag: '🇬🇧',
      location: 'Travelling with player',
      status: 'Cleared for play',
      statusColor: 'green',
      lastNote: 'Shoulder treatment complete · 08:30',
      responsibilities: ['Pre & post-match treatment', 'Injury management & clearance', 'Strapping & on-court emergency cover', 'Recovery protocols'],
    },
    {
      role: 'Fitness Trainer',
      name: 'Luis Santos',
      flag: '🇧🇷',
      location: 'London (remote this event)',
      status: 'Remote',
      statusColor: 'blue',
      lastNote: 'Weekly conditioning plan uploaded',
      responsibilities: ['Physical conditioning & periodisation', 'Recovery protocols off-tour', 'Nutrition plan & meal structure', 'Pre-season fitness testing'],
    },
    {
      role: 'Agent',
      name: 'James Whitfield',
      flag: '🇬🇧',
      location: 'London (remote)',
      status: 'Lululemon post pending',
      statusColor: 'yellow',
      lastNote: 'Caption drafted for Lululemon post',
      responsibilities: ['Sponsorship negotiation & management', 'Schedule & appearance advice', 'Media & press coordination', 'Team assembly & contracts'],
    },
    {
      role: 'Stringer',
      name: 'Carlos Méndez',
      flag: '🇲🇨',
      location: 'Monte-Carlo stringing room',
      status: 'Confirmed 11:45',
      statusColor: 'green',
      lastNote: 'Clay setup sheet received',
      responsibilities: ['Racket tension management', 'Pre-match stringing (24/23kg clay)', 'Racket inventory on-site', 'Spare string stock management'],
    },
    {
      role: 'Mental Performance Coach',
      name: 'Dr. Aisha Patel',
      flag: '🇮🇳',
      location: 'Remote (call at 21:00)',
      status: 'Session tonight',
      statusColor: 'purple',
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
            <div className="text-xs text-gray-500 mb-3">📍 {member.location}</div>
            <div className="bg-black/20 rounded-lg p-2 mb-3">
              <div className="text-xs text-gray-400">💬 {member.lastNote}</div>
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
      <SectionHeader icon="⚕️" title="Physio & Recovery" subtitle="Injury log, medical clearance, WHOOP recovery scores, and treatment protocols." />

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Recovery Score" value="82/100" sub="Today (WHOOP)" color="green" />
        <StatCard label="HRV" value="68ms" sub="▲7ms vs yesterday" color="teal" />
        <StatCard label="Resting HR" value="48 bpm" sub="Match day normal" color="blue" />
        <StatCard label="Sleep" value="7.2 hrs" sub="76 sleep score" color="purple" />
      </div>

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
                  {inj.cleared && <span className="text-xs text-teal-400">✓ Cleared</span>}
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
            { time: '12:00', task: 'Physio treatment — right shoulder', done: false },
            { time: '12:15', task: 'Strapping application (right shoulder, both ankles)', done: false },
            { time: '12:30', task: 'Dynamic warm-up — 15 min with Luis protocol', done: false },
            { time: '12:50', task: 'Hitting warm-up on practice court — 10 min', done: false },
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
      <SectionHeader icon="🎾" title="Racket & String Management" subtitle="Digital setup sheet, tension log by tournament, stringer contacts, and racket inventory." />

      {/* Current Setup */}
      <div className="bg-gradient-to-r from-teal-900/30 to-teal-800/10 border border-teal-600/30 rounded-xl p-5">
        <div className="text-xs text-teal-400 font-semibold uppercase tracking-wider mb-2">CURRENT SETUP — MONTE-CARLO (CLAY)</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
          <StatCard label="String" value="ALU Power 125" color="teal" />
          <StatCard label="Mains Tension" value="24 kg" sub="53 lbs" color="teal" />
          <StatCard label="Crosses" value="23 kg" sub="51 lbs" color="teal" />
          <StatCard label="Stringing Time" value="11:45 today" sub="Carlos Méndez" color="teal" />
        </div>
        <div className="mt-3 text-xs text-gray-400">⚠️ High humidity today — mains set at 24kg (1kg lower than usual for extra bite). If conditions change to dry, revert to 24.5kg.</div>
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
                <div className="text-xs text-gray-500">{r.weight} · {r.balance} · Grip {r.grip}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${r.status === 'Match' ? 'bg-teal-600/20 text-teal-400' : r.status === 'Practice' ? 'bg-blue-600/20 text-blue-400' : r.status === 'Transit' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>{r.status}</span>
              <div className="text-xs text-gray-500 w-28 text-right">{r.location}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          <span>String budget YTD: <span className="text-white">£1,240</span></span>
          <span>Avg strings/event: <span className="text-white">4</span></span>
          <span>Annual estimate: <span className="text-white">£8,400</span></span>
        </div>
      </div>
    </div>
  );
}

// ─── SPONSORSHIP VIEW ─────────────────────────────────────────────────────────
function SponsorshipView() {
  const deals = [
    {
      sponsor: 'Wilson',
      category: 'Racket & Equipment',
      type: 'Equipment + Bonus',
      value: '£45,000/yr + bonuses',
      status: 'Active',
      expiry: 'Dec 2027',
      daysLeft: 638,
      obligations: ['Use Wilson frames in all ATP/WTA matches', 'Wear Wilson bag', 'Social media mentions: 2/month'],
      bonuses: ['Top 50 year-end: +£10,000', 'Grand Slam QF: +£5,000', 'Top 30: +£20,000'],
    },
    {
      sponsor: 'Lululemon',
      category: 'Apparel',
      type: 'Kit + Fee',
      value: '£65,000/yr',
      status: 'Active',
      expiry: 'Jun 2027',
      daysLeft: 455,
      obligations: ['Wear Lululemon on court (all events)', 'Instagram post: 2/month minimum', 'Attend 1 brand event/yr'],
      bonuses: [],
    },
    {
      sponsor: 'Rolex',
      category: 'Watch / Luxury',
      type: 'Cash + Watch allocation',
      value: '£120,000/yr',
      status: 'Renewal due',
      expiry: 'May 2026',
      daysLeft: 47,
      obligations: ['Wear Rolex in all press conferences', 'Appear in 1 Rolex campaign/yr', 'Ranking report monthly to brand team'],
      bonuses: [],
    },
    {
      sponsor: 'HSBC',
      category: 'Financial Services',
      type: 'Platform partnership',
      value: '£30,000/yr',
      status: 'Active',
      expiry: 'Jan 2027',
      daysLeft: 295,
      obligations: ['Logo on hat (left side)', 'Post-tournament quote for HSBC social: 4/yr', '1 commercial appearance/yr'],
      bonuses: [],
    },
    {
      sponsor: 'Head Pennzoil',
      category: 'Strings & Accessories',
      type: 'Product only',
      value: 'Product supply',
      status: 'Active',
      expiry: 'Dec 2026',
      daysLeft: 275,
      obligations: ['Use Head strings in practice only', 'Mention in 2 social posts/yr'],
      bonuses: [],
    },
    {
      sponsor: 'Babolat Appear.',
      category: 'Exhibition / Appearance',
      type: 'Appearance fee',
      value: '£25,000 (one-off)',
      status: 'Confirmed',
      expiry: 'June 2026',
      daysLeft: 80,
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
      <SectionHeader icon="🤝" title="Sponsorship Manager" subtitle="Every deal, every obligation, every deadline — tracked automatically." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Annual Value" value="£285k+" sub="Confirmed contracts" color="yellow" />
        <StatCard label="Active Deals" value="6" sub="1 renewal due" color="green" />
        <StatCard label="Rolex Renewal" value="47 days" sub="⚠️ Action required" color="red" />
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
                <div className="text-sm text-gray-400 mt-0.5">{deal.type} · {deal.value}</div>
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
        <div className="text-sm font-semibold text-white mb-4">📅 Content & Obligations Calendar</div>
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
    { category: 'Coach (Marco Bianchi)', amount: '~£62,000', notes: '12% of prize money + travel', type: 'Team' },
    { category: 'Physio (Sarah Okafor)', amount: '~£45,000', notes: 'Retainer + event travel', type: 'Team' },
    { category: 'Fitness Trainer', amount: '~£18,000', notes: 'Part-time retainer', type: 'Team' },
    { category: 'Mental Performance Coach', amount: '~£8,000', notes: 'Monthly sessions', type: 'Team' },
    { category: 'Travel & Accommodation', amount: '~£94,000', notes: '30+ weeks · 3-4 person team', type: 'Travel' },
    { category: 'Racket Stringing', amount: '~£8,400', notes: '4 strings/event × 50+ events', type: 'Equipment' },
    { category: 'Agent Commission', amount: '~£28,000', notes: '10% of endorsement income', type: 'Commercial' },
    { category: 'Accountant (multi-jurisdiction)', amount: '~£8,000', notes: '20+ tax jurisdictions', type: 'Commercial' },
    { category: 'Insurance & Medical', amount: '~£6,500', notes: 'Global cover + physio equipment', type: 'Other' },
  ];

  const taxJurisdictions = [
    { country: '🇦🇺 Australia', income: 'AU$332,000', status: 'Filed', rate: '45%' },
    { country: '🇦🇪 UAE / Dubai', income: '$86,500', status: 'Filed', rate: '0%' },
    { country: '🇺🇸 USA', income: '$92,260', status: 'Pending', rate: '30%' },
    { country: '🇫🇷 France (Monaco)', income: '€47,500', status: 'Open', rate: '30%' },
    { country: '🇳🇱 Netherlands', income: '€118,000', status: 'Filed', rate: '25%' },
  ];

  const totalPrize = prizeMoneyLog.reduce((a, b) => a + b.prize_gbp, 0);
  const totalExpenses = 278900;
  const endorsements = 285000;

  return (
    <div className="space-y-6">
      <SectionHeader icon="💰" title="Financial Dashboard" subtitle="Prize money, endorsements, expenses, and multi-jurisdiction tax tracker — exportable for your accountant." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Prize Money YTD" value={`£${(totalPrize/1000).toFixed(0)}k`} sub="2026 season" color="green" />
        <StatCard label="Endorsements" value="£285k" sub="Annual contracted" color="yellow" />
        <StatCard label="Total Expenses" value={`£${(totalExpenses/1000).toFixed(0)}k`} sub="Estimated annual" color="red" />
        <StatCard label="Net Position" value={`£${((totalPrize + endorsements - totalExpenses)/1000).toFixed(0)}k`} sub="YTD estimate" color="teal" />
      </div>

      {/* Prize Money Ledger */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Prize Money Ledger — 2026</div>
          <button className="text-xs text-purple-400 hover:text-purple-300">Export for accountant →</button>
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
                <td className="p-3 text-right text-white font-medium">£{p.prize_gbp.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-gray-900/50">
              <td colSpan={4} className="p-3 text-right text-sm text-gray-400 font-semibold">Total YTD (GBP)</td>
              <td className="p-3 text-right text-teal-400 font-bold">£{totalPrize.toLocaleString()}</td>
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
        <div className="text-sm font-semibold text-white mb-4">🌍 Tax Jurisdiction Tracker</div>
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
      <SectionHeader icon="📱" title="Media & Content" subtitle="Social calendar, sponsor content obligations, press log, and media schedule." />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Instagram Followers" value="184k" sub="▲2.1k this month" color="purple" />
        <StatCard label="Avg Engagement" value="4.2%" sub="Above tour avg (2.8%)" color="teal" />
        <StatCard label="Posts This Month" value="3/4" sub="Lululemon: 2/2 ✓" color="blue" />
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
                <div className="text-xs text-gray-500">{p.type} · {p.date} · {p.notes}</div>
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
    { event: 'Depart Monte-Carlo → Barcelona', date: '20 Apr', details: 'Flight EasyJet U2-4871 · 11:30 MCM → BCN · Team: Alex + Marco + Sarah', status: 'Booked' },
    { event: 'Arrive Barcelona — Hotel Arts', date: '20 Apr', details: 'Check-in 15:00 · 3 rooms booked (Alex suite, team rooms)', status: 'Confirmed' },
    { event: 'Practice courts — Real Club de Tenis Barcelona', date: '21 Apr', details: '09:00–11:30 · Court 2 reserved · Luis joining remotely for conditioning review', status: 'Confirmed' },
    { event: 'Barcelona ATP 500 — First round', date: '14-15 Apr (TBC)', details: 'Draw TBC · Transport from hotel arranged by tournament', status: 'TBC' },
    { event: 'Barcelona → Madrid (transfer)', date: '20 Apr', details: 'High-speed rail AVE · 2h journey · All 3 team members', status: 'Not booked' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon="✈️" title="Travel & Logistics" subtitle="Event-by-event travel planning, hotel, court access, and team movement." />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Weeks on Tour (YTD)" value="14" sub="30+ planned 2026" color="blue" />
        <StatCard label="Flights Booked" value="8" sub="12 upcoming events" color="teal" />
        <StatCard label="Next Departure" value="20 Apr" sub="MCM → Barcelona" color="purple" />
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Upcoming Travel — Clay Swing</div>
        <div className="space-y-3">
          {upcoming.map((t, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-800/50">
              <div className={`text-xs px-2 py-0.5 rounded mt-0.5 flex-shrink-0 ${t.status === 'Confirmed' || t.status === 'Booked' ? 'bg-teal-600/20 text-teal-400' : t.status === 'Not booked' ? 'bg-red-600/20 text-red-400' : 'bg-gray-700 text-gray-400'}`}>{t.status}</div>
              <div>
                <div className="text-sm text-gray-200 font-medium">{t.event}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t.date} · {t.details}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Tournament Hotel Contacts</div>
        <div className="space-y-2 text-xs text-gray-400">
          {[
            { venue: 'Monte-Carlo Country Club', hotel: 'Hôtel de Paris Monte-Carlo', contact: '+377 98 06 30 00', perDiem: '€200/night subsidised (ATP M1000)' },
            { venue: 'Real Club de Tenis Barcelona', hotel: 'Hotel Arts Barcelona', contact: '+34 93 221 10 00', perDiem: '€150/night (ATP 500)' },
            { venue: 'Caja Mágica, Madrid', hotel: 'Eurostars Tower Hotel', contact: '+34 91 212 50 00', perDiem: '€150/night (ATP M1000)' },
            { venue: 'Foro Italico, Rome', hotel: 'Rome Cavalieri', contact: '+39 06 35091', perDiem: '€180/night (ATP M1000)' },
          ].map((h, i) => (
            <div key={i} className="py-2 border-b border-gray-800/50">
              <div className="text-gray-200 font-medium text-sm">{h.venue}</div>
              <div>{h.hotel} · {h.contact}</div>
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
            { round: 'Finals — Group Stage', date: 'Sep 2026', opponent: 'TBD (Málaga)', result: 'TBC', status: 'Upcoming', selected: false, matches: 'Selection TBC' },
          ].map((d, i) => (
            <div key={i} className={`p-4 rounded-lg border ${d.status === 'Complete' ? 'border-gray-800 bg-gray-900/20' : 'border-blue-600/30 bg-blue-600/5'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-white">{d.round} — {d.opponent}</div>
                <span className={`text-xs px-2 py-0.5 rounded ${d.status === 'Complete' ? 'bg-teal-600/20 text-teal-400' : 'bg-blue-600/20 text-blue-400'}`}>{d.status}</span>
              </div>
              <div className="text-xs text-gray-400">{d.date} · {d.result} · {d.matches}</div>
              {d.selected && <div className="text-xs text-purple-400 mt-1">✓ Selected for this tie</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">LTA Player Support — Level 2 Programme</div>
        <div className="space-y-2 text-sm text-gray-400">
          {[
            'Annual funding contribution: £15,000',
            'NTC court access: Unlimited (when UK-based)',
            'Physiotherapy support: LTA physio network access',
            'Performance science: Biomechanics screen annually',
            'Travel support: Partially subsidised for early-career events',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-800/50">
              <span className="text-teal-400">✓</span>
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
            { tournament: 'Queen\'s Club 2026', deadline: '1 May', status: 'LTA wild card eligible', action: 'Request submitted' },
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
  const goals = [
    { goal: 'Break into Top 50 by year-end', progress: 58, target: 100, status: '67 → 50 needed', color: 'purple' },
    { goal: 'Qualify for ATP Finals (Turin)', progress: 28, target: 100, status: '1,847 / ~6,500 pts needed', color: 'teal' },
    { goal: 'Reach first ATP Masters SF', progress: 40, target: 100, status: 'QF achieved (Indian Wells)', color: 'blue' },
    { goal: 'Grand Slam R3 or deeper', progress: 100, target: 100, status: '✓ Australian Open R4', color: 'green' },
    { goal: 'Win an ATP 500 title', progress: 80, target: 100, status: '1 title (Rotterdam 2026)', color: 'orange' },
  ];

  const projections = [
    { scenario: 'Current trajectory', endYearRanking: 52, pointsEOY: 2800, tourFinals: false },
    { scenario: 'Strong clay swing (SF at Roland Garros)', endYearRanking: 38, pointsEOY: 3900, tourFinals: false },
    { scenario: 'Exceptional year (GS QF + Masters win)', endYearRanking: 24, pointsEOY: 5800, tourFinals: true },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon="🚀" title="Career Planning" subtitle="Season goals, ranking projections, development milestones, and long-term planning." />

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Current Ranking" value={`#${player.ranking}`} sub="ATP Singles" color="purple" />
        <StatCard label="Career High" value={`#${player.career_high}`} sub={player.career_high_date} color="teal" />
        <StatCard label="Turned Pro" value={player.turned_pro.toString()} sub={`${2026 - player.turned_pro} years on tour`} color="blue" />
        <StatCard label="YTD Titles" value="1" sub="Rotterdam ATP 500" color="orange" />
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
                  <div className="text-xs text-gray-500 mt-0.5">{p.pointsEOY.toLocaleString()} points · Ranking #{p.endYearRanking}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">#{p.endYearRanking}</div>
                  {p.tourFinals && <div className="text-xs text-yellow-400">🏆 Turin qualified</div>}
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

// ─── PLAYER PROFILE CARD ──────────────────────────────────────────────────────
function PlayerCard({ player }: { player: TennisPlayer }) {
  return (
    <div className="relative w-52 rounded-xl overflow-hidden border-2 border-purple-500/40 shadow-2xl shadow-purple-900/50 flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #0d1929 50%, #0a2218 100%)' }}>
      {/* Header stripe */}
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #6C3FC5, #0D9488)' }}></div>
      <div className="p-4">
        {/* Ranking badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="text-center">
            <div className="text-3xl font-black text-white leading-none">{player.ranking}</div>
            <div className="text-[10px] text-purple-300 font-medium uppercase tracking-wider">ATP Rank</div>
          </div>
          <div className="text-3xl">{player.flag}</div>
        </div>
        {/* Player photo placeholder */}
        <div className="w-full h-32 rounded-lg mb-3 flex items-center justify-center text-6xl"
          style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.2) 0%, rgba(13,148,136,0.2) 100%)', border: '1px solid rgba(108,63,197,0.3)' }}>
          🎾
        </div>
        {/* Name */}
        <div className="text-white font-black text-sm uppercase tracking-wide text-center leading-tight mb-1">
          {player.name.split(' ')[0]}
        </div>
        <div className="text-purple-300 font-bold text-xs uppercase tracking-widest text-center mb-3">
          {player.name.split(' ').slice(1).join(' ')}
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

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function TennisTourPage() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const player = DEMO_PLAYER;

  const groups = ['OVERVIEW', 'PERFORMANCE', 'TEAM', 'COMMERCIAL', 'OPERATIONS'];

  const renderView = () => {
    switch (activeSection) {
      case 'dashboard':    return <DashboardView player={player} />;
      case 'morning':      return <MorningBriefingView player={player} />;
      case 'rankings':     return <RankingsView player={player} />;
      case 'schedule':     return <ScheduleView />;
      case 'performance':  return <PerformanceView player={player} />;
      case 'matchprep':    return <MatchPrepView />;
      case 'team':         return <TeamHubView player={player} />;
      case 'physio':       return <PhysioView />;
      case 'racket':       return <RacketView />;
      case 'sponsorship':  return <SponsorshipView />;
      case 'media':        return <MediaView />;
      case 'financial':    return <FinancialView />;
      case 'travel':       return <TravelView />;
      case 'federation':   return <FederationView />;
      case 'career':       return <CareerView player={player} />;
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
              <div className="text-[10px] text-gray-600">🎾 Tennis</div>
            </div>
          )}
          {sidebarCollapsed && <span className="text-lg mx-auto">🎾</span>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-gray-600 hover:text-gray-400 text-xs ml-auto flex-shrink-0">
            {sidebarCollapsed ? '→' : '←'}
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
                <div className="text-[10px] text-gray-500">#{player.ranking} ATP · {player.nationality}</div>
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
            <div className="text-xs text-purple-400 font-semibold mt-0.5">Pro+ · £299/mo</div>
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
            <div className="text-xs text-gray-600">Monte-Carlo · Clay · Live</div>
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
            <div className="text-xs text-gray-500">ATP Monte-Carlo Masters</div>
          </div>
        </div>

        {/* Content + Card Row */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderView()}
          </div>

          {/* Player Card Column */}
          <div className="hidden lg:flex flex-col items-center gap-4 p-4 border-l border-gray-800 flex-shrink-0"
            style={{ width: '220px' }}>
            <PlayerCard player={player} />
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Live Match</div>
              <div className="text-xs text-teal-400 font-medium">● In Progress</div>
              <div className="text-xs text-gray-300 mt-1">vs C. Martinez</div>
              <div className="text-xs text-gray-500">Court 4 · 13:00</div>
              <div className="mt-2 text-xs text-yellow-400">QF — €47,500</div>
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
                <div className="text-xs text-yellow-400">⚠️ Rolex renewal: 47d</div>
                <div className="text-xs text-yellow-400">⚠️ Lululemon post due</div>
                <div className="text-xs text-red-400">🔴 125 pts expire today</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
