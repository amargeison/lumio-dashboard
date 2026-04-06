'use client';

import { useState } from 'react';

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

// ─── SIDEBAR ITEMS ────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'camp',             label: 'Camp Dashboard',      icon: '🏕️', group: 'FIGHT CAMP' },
  { id: 'training',        label: 'Training Log',        icon: '🥊', group: 'FIGHT CAMP' },
  { id: 'sparring',        label: 'Sparring Planner',    icon: '🤼', group: 'FIGHT CAMP' },
  { id: 'opposition',      label: 'Opposition Analysis', icon: '🔍', group: 'FIGHT CAMP' },
  { id: 'weight',          label: 'Weight Tracker',      icon: '⚖️', group: 'WEIGHT & HEALTH' },
  { id: 'cut',             label: 'Cut Planner',         icon: '📉', group: 'WEIGHT & HEALTH' },
  { id: 'recovery',        label: 'Recovery & HRV',      icon: '💚', group: 'WEIGHT & HEALTH' },
  { id: 'medical',         label: 'Medical Record',      icon: '🏥', group: 'WEIGHT & HEALTH' },
  { id: 'rankings',        label: 'World Rankings',      icon: '🌍', group: 'RANKINGS' },
  { id: 'mandatory',       label: 'Mandatory Tracker',   icon: '📋', group: 'RANKINGS' },
  { id: 'pathtotitle',     label: 'Path to Title',       icon: '🏆', group: 'RANKINGS' },
  { id: 'pursebid',        label: 'Purse Bid Alerts',    icon: '🔔', group: 'RANKINGS' },
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
      <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</h2>
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
const WaveBanner = ({ fighter }: { fighter: BoxingFighter }) => (
  <div className="bg-gradient-to-r from-red-900/60 via-[#07080F] to-orange-900/40 rounded-xl px-5 py-3 mb-5 flex items-center justify-between gap-4">
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
);

// ─── FIGHTER CARD ─────────────────────────────────────────────────────────────
const FighterCard = ({ fighter }: { fighter: BoxingFighter }) => (
  <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
    <div className="flex flex-col items-center text-center mb-3">
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 border-2 border-red-500/40"
        style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(234,88,12,0.3))' }}>
        {fighter.flag}
      </div>
      <div className="text-sm font-bold text-white">{fighter.name}</div>
      <div className="text-[10px] text-red-400 font-semibold">&ldquo;{fighter.nickname}&rdquo;</div>
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
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── CAMP DASHBOARD VIEW ──────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function CampDashboardView({ fighter }: { fighter: BoxingFighter }) {
  const campPhases = [
    { name: 'General', start: 1, end: 21, color: 'bg-blue-500' },
    { name: 'Specific', start: 22, end: 42, color: 'bg-yellow-500' },
    { name: 'Peak', start: 43, end: 60, color: 'bg-red-500' },
    { name: 'Taper', start: 61, end: 70, color: 'bg-green-500' },
  ];

  const todaySessions = [
    { time: '06:00', type: 'Roadwork', detail: '8km steady state run + hill sprints x6', status: 'completed', statusColor: 'text-green-400' },
    { time: '11:00', type: 'Sparring', detail: '8 rounds w/ Darnell "Tank" Hughes (southpaw)', status: 'upcoming', statusColor: 'text-yellow-400' },
    { time: '15:00', type: 'Strength', detail: 'Upper body power — bench press, med ball throws', status: 'upcoming', statusColor: 'text-yellow-400' },
    { time: '18:00', type: 'Physio', detail: 'Soft tissue work, shoulder mobility, ice bath', status: 'scheduled', statusColor: 'text-gray-400' },
  ];

  const sparringWeek = [
    { day: 'Mon', partner: 'Darnell Hughes', rounds: 8, style: 'Southpaw pressure', notes: 'Mirror Petrov jab patterns' },
    { day: 'Tue', partner: 'Rest Day', rounds: 0, style: '—', notes: 'Recovery / film study' },
    { day: 'Wed', partner: 'Chris Adebayo', rounds: 6, style: 'Orthodox counter', notes: 'Work behind the jab' },
    { day: 'Thu', partner: 'Jake Morrison', rounds: 10, style: 'Big heavyweight', notes: 'Clinch work & inside fighting' },
    { day: 'Fri', partner: 'Darnell Hughes', rounds: 8, style: 'Southpaw pressure', notes: 'Simulate championship rounds' },
    { day: 'Sat', partner: 'Open sparring', rounds: 6, style: 'Mixed', notes: 'Controlled rounds, speed focus' },
  ];

  const weightLog = [
    { day: 18, weight: 98.4 }, { day: 19, weight: 98.1 }, { day: 20, weight: 97.9 },
    { day: 21, weight: 98.0 }, { day: 22, weight: 97.8 },
  ];

  const recoveryScore = 81;
  const campProgress = Math.round((fighter.camp_day / fighter.camp_total) * 100);

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🏕️" title="Camp Dashboard" subtitle={`Day ${fighter.camp_day} of ${fighter.camp_total} — ${fighter.next_fight.opponent} fight camp`} />

      {/* Camp Banner */}
      <div className="bg-gradient-to-r from-red-900/40 via-[#0D1117] to-orange-900/30 border border-red-600/20 rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-lg font-bold text-white">Camp Day {fighter.camp_day} / {fighter.camp_total}</div>
            <div className="text-sm text-gray-400 mt-1">vs {fighter.next_fight.opponent} {fighter.next_fight.opponent_flag} — {fighter.next_fight.opponent_record} — {fighter.next_fight.opponent_ranking}</div>
            <div className="text-xs text-gray-500 mt-0.5">{fighter.next_fight.venue} — {fighter.next_fight.broadcast}</div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{fighter.next_fight.days_away}</div>
              <div className="text-xs text-gray-500">Days to Fight</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{fighter.current_weight}kg</div>
              <div className="text-xs text-gray-500">Current Weight</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{recoveryScore}%</div>
              <div className="text-xs text-gray-500">Recovery</div>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Camp Progress</span>
            <span>{campProgress}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all" style={{ width: `${campProgress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Days to Fight" value={fighter.next_fight.days_away} sub={fighter.next_fight.date} color="red" />
        <StatCard label="Camp Day" value={`${fighter.camp_day}/${fighter.camp_total}`} sub="Specific phase begins" color="yellow" />
        <StatCard label="Weight vs Target" value={`${fighter.current_weight}kg`} sub={`Target: ${fighter.target_weight}kg (-${(fighter.current_weight - fighter.target_weight).toFixed(1)}kg)`} color="teal" />
        <StatCard label="Recovery Score" value={`${recoveryScore}%`} sub="HRV: 62ms — Good" color="green" />
      </div>

      {/* Camp Phase Timeline */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Camp Phase Timeline</div>
        <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
          {campPhases.map((phase) => {
            const width = ((phase.end - phase.start + 1) / fighter.camp_total) * 100;
            const isActive = fighter.camp_day >= phase.start && fighter.camp_day <= phase.end;
            return (
              <div
                key={phase.name}
                className={`${phase.color} ${isActive ? 'opacity-100 ring-2 ring-white/30' : 'opacity-30'} flex items-center justify-center relative`}
                style={{ width: `${width}%` }}
              >
                <span className="text-[10px] font-bold text-white/90 drop-shadow">{phase.name}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 mt-2">
          <span>Day 1</span>
          <span>Day 21</span>
          <span>Day 42</span>
          <span>Day 60</span>
          <span>Day 70</span>
        </div>
        <div className="mt-3 text-xs text-yellow-400">Currently in: Specific Phase — Transitioning to fight-specific drills and opponent-patterned sparring</div>
      </div>

      {/* Today's Sessions */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Today&apos;s Sessions</div>
        <div className="space-y-3">
          {todaySessions.map((session, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="text-xs font-mono text-gray-500 w-12">{session.time}</div>
              <div className="flex-1">
                <div className="text-sm text-white font-medium">{session.type}</div>
                <div className="text-xs text-gray-400">{session.detail}</div>
              </div>
              <span className={`text-xs font-medium ${session.statusColor}`}>{session.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Trajectory */}
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-4">Weight Trajectory (Last 5 Days)</div>
          <div className="flex items-end gap-2 h-32">
            {weightLog.map((entry, i) => {
              const min = 96;
              const max = 99;
              const height = ((entry.weight - min) / (max - min)) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[10px] text-gray-400">{entry.weight}</div>
                  <div className="w-full bg-red-500/60 rounded-t" style={{ height: `${height}%` }}></div>
                  <div className="text-[10px] text-gray-600">D{entry.day}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex justify-between text-xs">
            <span className="text-gray-500">Target: {fighter.target_weight}kg</span>
            <span className="text-teal-400">On track — {(fighter.current_weight - fighter.target_weight).toFixed(1)}kg to go</span>
          </div>
        </div>

        {/* Opposition Notes */}
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-4">Opposition Quick Notes</div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-900/30 border border-red-500/30 flex items-center justify-center text-lg">{fighter.next_fight.opponent_flag}</div>
            <div>
              <div className="text-sm text-white font-medium">{fighter.next_fight.opponent}</div>
              <div className="text-xs text-gray-400">{fighter.next_fight.opponent_record} — {fighter.next_fight.opponent_ranking}</div>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2 bg-[#0a0c14] rounded border border-gray-800"><span className="text-red-400 font-medium">Danger:</span> <span className="text-gray-300">Heavy right hand, 86% KO rate. Loads up from distance.</span></div>
            <div className="p-2 bg-[#0a0c14] rounded border border-gray-800"><span className="text-yellow-400 font-medium">Weakness:</span> <span className="text-gray-300">Slow feet after round 6. Fades in championship rounds.</span></div>
            <div className="p-2 bg-[#0a0c14] rounded border border-gray-800"><span className="text-green-400 font-medium">Exploit:</span> <span className="text-gray-300">Body shots to the right side. Pull counters when he lunges.</span></div>
            <div className="p-2 bg-[#0a0c14] rounded border border-gray-800"><span className="text-blue-400 font-medium">Style:</span> <span className="text-gray-300">Orthodox pressure fighter. Likes to walk forward behind a pawing jab.</span></div>
          </div>
        </div>
      </div>

      {/* Sparring Schedule */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Sparring Schedule — This Week</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-4">Day</th>
                <th className="text-left py-2 pr-4">Partner</th>
                <th className="text-center py-2 pr-4">Rounds</th>
                <th className="text-left py-2 pr-4">Style</th>
                <th className="text-left py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {sparringWeek.map((day, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="py-2 pr-4 text-gray-300 font-medium">{day.day}</td>
                  <td className="py-2 pr-4 text-white">{day.partner}</td>
                  <td className="py-2 pr-4 text-center text-gray-300">{day.rounds || '—'}</td>
                  <td className="py-2 pr-4 text-gray-400">{day.style}</td>
                  <td className="py-2 text-gray-500">{day.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── TRAINING LOG VIEW ────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TrainingLogView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── SPARRING PLANNER VIEW ────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SparringPlannerView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── OPPOSITION ANALYSIS VIEW ─────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function OppositionAnalysisView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── WEIGHT TRACKER VIEW ──────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function WeightTrackerView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── CUT PLANNER VIEW ─────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function CutPlannerView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── RECOVERY & HRV VIEW ──────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function RecoveryHRVView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── MEDICAL RECORD VIEW ──────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function MedicalRecordView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── WORLD RANKINGS VIEW ──────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function WorldRankingsView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── MANDATORY TRACKER VIEW ───────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function MandatoryTrackerView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── PATH TO TITLE VIEW ──────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PathToTitleView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── PURSE BID ALERTS VIEW ────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PurseBidAlertsView() {
  const purseBids = [
    { body: 'IBF', fight: 'Dubois vs Hrgovic', bidDate: 'Apr 18, 2026', minBid: '$4,200,000', status: 'Open', bidders: 'Matchroom, Queensberry, Top Rank', relevance: 'If Dubois vacates, IBF rankings shift upward' },
    { body: 'WBC', fight: 'Fury vs Zhang (Eliminator)', bidDate: 'May 2, 2026', minBid: '$6,500,000', status: 'Negotiations first', bidders: 'Queensberry (Fury side), Top Rank (Zhang side)', relevance: 'Winner gets mandatory. Loser drops — could open spot for Marcus.' },
    { body: 'WBO', fight: 'Anderson vs TBD (#4 vs #5)', bidDate: 'TBD', minBid: 'TBD', status: 'Not yet ordered', bidders: 'TBD', relevance: 'Marcus is #5 — could be called for this eliminator.' },
  ];

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🔔" title="Purse Bid Alerts" subtitle="Track upcoming purse bids, negotiations, and sanctioning body auctions." />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Active Bids" value="1" sub="IBF — Dubois vs Hrgovic" color="red" />
        <StatCard label="Upcoming" value="2" sub="WBC & WBO" color="yellow" />
        <StatCard label="Marcus Relevance" value="Medium" sub="Watch WBO closely" color="blue" />
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Current & Upcoming Purse Bids</div>
        <div className="space-y-3">
          {purseBids.map((bid, i) => (
            <div key={i} className="p-4 bg-[#0a0c14] border border-gray-800 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm text-white font-medium">{bid.body}: {bid.fight}</div>
                  <div className="text-xs text-gray-400">Bid date: {bid.bidDate} — Minimum: {bid.minBid}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${bid.status === 'Open' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>{bid.status}</span>
              </div>
              <div className="text-xs text-gray-500">Bidders: {bid.bidders}</div>
              <div className="text-xs text-teal-400 mt-1">{bid.relevance}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── PURSE SIMULATOR VIEW ─────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PurseSimulatorView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── FIGHT EARNINGS VIEW ──────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function FightEarningsView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── CAMP COSTS VIEW ──────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function CampCostsView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── TAX TRACKER VIEW ─────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TaxTrackerView() {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── TEAM OVERVIEW VIEW ───────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TeamOverviewView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── FIGHTER BRIEFING VIEW ────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function FighterBriefingView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── TRAINER NOTES VIEW ───────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TrainerNotesView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── MANAGER DASHBOARD VIEW ───────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ManagerDashboardView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── SPONSORSHIPS VIEW ────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SponsorshipsView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── MEDIA OBLIGATIONS VIEW ───────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function MediaObligationsView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── APPEARANCE FEES VIEW ─────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AppearanceFeesView() {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── CONTRACT TRACKER VIEW ────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ContractTrackerView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── FIGHT RECORD VIEW ────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function FightRecordView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── CAREER STATS VIEW ────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function CareerStatsView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── PROMOTER PIPELINE VIEW ───────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PromoterPipelineView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── AGENT INTEL VIEW ─────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AgentIntelView() {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── AI MORNING BRIEFING VIEW ─────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AIMorningBriefingView({ fighter }: { fighter: BoxingFighter }) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateBriefing = () => {
    setLoading(true);
    setTimeout(() => {
      setBriefing(`MORNING BRIEFING — ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Camp Day ${fighter.camp_day} of ${fighter.camp_total} | ${fighter.next_fight.days_away} days to fight | vs ${fighter.next_fight.opponent}

---

TRAINING
Today is a heavy sparring day. 8 rounds scheduled with Darnell Hughes (southpaw) to simulate Petrov's movement patterns. Afternoon strength session — upper body power focus with Greg Mayfield. Evening physio with Liam for shoulder maintenance work.

NUMBERS
Weight: ${fighter.current_weight}kg (target ${fighter.target_weight}kg — ${(fighter.current_weight - fighter.target_weight).toFixed(1)}kg to go, on track)
HRV: 62ms (baseline 65ms — acceptable, green light for hard session)
Sleep: 7.8 hours (target 8hrs — marginal, aim for earlier bedtime tonight)
Recovery: 81% (good — cleared for full training load)

SPARRING FOCUS
Drill the pull counter right hand that Jim introduced on Wednesday. When Hughes throws the jab, slip right and counter. This is the money shot against Petrov. Also work on body shots from the clinch — uppercut followed by left hook to the body on the break.

FLAGS
Right shoulder tightness — Liam has recommended reduced overhead pressing for 7 days. Greg will adjust the afternoon strength program accordingly. Monitor and report any increase in discomfort.

OBLIGATIONS
No media today. Next obligation: DAZN promo shoot April 12 (London — travel day April 11). Sarah Chen will confirm logistics.

INTEL
Petrov filmed doing open workout in Big Bear. New conditioning coach observed. Working more body shots than usual in pad work — unusual for him, may be adjusting game plan.

Stay focused, stay disciplined, 48 days to go.`);
      setLoading(false);
    }, 2000);
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
            <button onClick={() => setBriefing(null)} className="text-xs text-gray-500 hover:text-gray-300">Regenerate</button>
          </div>
          <div className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed font-mono bg-[#0a0c14] p-5 rounded-lg border border-gray-800">
            {briefing}
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── OPPOSITION SCOUT VIEW ────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function OppositionScoutView({ fighter }: { fighter: BoxingFighter }) {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── BROADCAST TRACKER VIEW ───────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function BroadcastTrackerView() {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── INDUSTRY NEWS VIEW ───────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function IndustryNewsView() {
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function BoxingPortalPage() {
  const [activeSection, setActiveSection] = useState('camp');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const fighter = DEMO_FIGHTER;

  const groups = ['FIGHT CAMP', 'WEIGHT & HEALTH', 'RANKINGS', 'FINANCIALS', 'TEAM HUB', 'COMMERCIAL', 'CAREER', 'INTEL'];

  const renderView = () => {
    switch (activeSection) {
      case 'camp':             return <CampDashboardView fighter={fighter} />;
      case 'training':        return <TrainingLogView fighter={fighter} />;
      case 'sparring':        return <SparringPlannerView fighter={fighter} />;
      case 'opposition':      return <OppositionAnalysisView fighter={fighter} />;
      case 'weight':          return <WeightTrackerView fighter={fighter} />;
      case 'cut':             return <CutPlannerView fighter={fighter} />;
      case 'recovery':        return <RecoveryHRVView fighter={fighter} />;
      case 'medical':         return <MedicalRecordView fighter={fighter} />;
      case 'rankings':        return <WorldRankingsView fighter={fighter} />;
      case 'mandatory':       return <MandatoryTrackerView fighter={fighter} />;
      case 'pathtotitle':     return <PathToTitleView fighter={fighter} />;
      case 'pursebid':        return <PurseBidAlertsView />;
      case 'pursesim':        return <PurseSimulatorView fighter={fighter} />;
      case 'earnings':        return <FightEarningsView fighter={fighter} />;
      case 'campcosts':       return <CampCostsView fighter={fighter} />;
      case 'tax':             return <TaxTrackerView />;
      case 'teamoverview':    return <TeamOverviewView fighter={fighter} />;
      case 'briefing':        return <FighterBriefingView fighter={fighter} />;
      case 'trainernotes':    return <TrainerNotesView fighter={fighter} />;
      case 'managerdash':     return <ManagerDashboardView fighter={fighter} />;
      case 'sponsorships':    return <SponsorshipsView fighter={fighter} />;
      case 'media':           return <MediaObligationsView fighter={fighter} />;
      case 'appearances':     return <AppearanceFeesView />;
      case 'contracts':       return <ContractTrackerView fighter={fighter} />;
      case 'fightrecord':     return <FightRecordView fighter={fighter} />;
      case 'careerstats':     return <CareerStatsView fighter={fighter} />;
      case 'promoterpipeline':return <PromoterPipelineView fighter={fighter} />;
      case 'agentintel':      return <AgentIntelView />;
      case 'aibriefing':      return <AIMorningBriefingView fighter={fighter} />;
      case 'opscout':         return <OppositionScoutView fighter={fighter} />;
      case 'broadcast':       return <BroadcastTrackerView />;
      case 'news':            return <IndustryNewsView />;
      default:                return <CampDashboardView fighter={fighter} />;
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
              <div className="text-xs font-bold uppercase tracking-widest" style={{ background: 'linear-gradient(90deg, #EF4444, #F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                LUMIO FIGHT
              </div>
              <div className="text-[10px] text-gray-600">Boxing</div>
            </div>
          )}
          {sidebarCollapsed && <span className="text-lg mx-auto">🥊</span>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-gray-600 hover:text-gray-400 text-xs ml-auto flex-shrink-0">
            {sidebarCollapsed ? '>' : '<'}
          </button>
        </div>

        {/* Fighter Mini Card */}
        {!sidebarCollapsed && (
          <div className="p-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm border border-red-500/40"
                style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(234,88,12,0.3))' }}>
                {fighter.flag}
              </div>
              <div>
                <div className="text-xs font-semibold text-white">{fighter.name}</div>
                <div className="text-[10px] text-gray-500">{fighter.record.wins}-{fighter.record.losses} ({fighter.record.ko} KO) . {fighter.nationality}</div>
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
                        ? 'bg-red-600/20 text-red-300 border border-red-600/30'
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
            <div className="text-xs text-red-400 font-semibold mt-0.5">Elite . GBP 499/mo</div>
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
            <div className="text-xs text-gray-600">Camp Day {fighter.camp_day}/{fighter.camp_total} . {fighter.next_fight.days_away}d to fight</div>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <div className="text-xs text-gray-500">vs {fighter.next_fight.opponent}</div>
          </div>
        </div>

        {/* Content + Card Row */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <WaveBanner fighter={fighter} />
            {renderView()}
          </div>

          {/* Fighter Card Column */}
          <div className="hidden lg:flex flex-col items-center gap-4 p-4 border-l border-gray-800 flex-shrink-0"
            style={{ width: '220px' }}>
            <FighterCard fighter={fighter} />
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
      </div>
    </div>
  );
}
