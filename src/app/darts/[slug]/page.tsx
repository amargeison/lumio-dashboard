'use client';

import { use, useState, useEffect } from 'react';
import { Target, Trophy, TrendingUp, Calendar, Users, DollarSign, Plane, Settings, Star, Award, BarChart2, Clock, MapPin, Phone, Mail, ChevronRight, FileText, Video, Brain, Zap, AlertCircle, CheckCircle, Package, Mic, Globe, Shield, Activity, Hash, ClipboardList } from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface DartsPlayer {
  name: string;
  nickname: string;
  nationality: string;
  nationalityFlag: string;
  pdcRank: number;
  orderOfMeritRank: number;
  threeDartAverage: number;
  checkoutPercent: number;
  oneEightiesPerLeg: number;
  firstNineAverage: number;
  highestCheckout: number;
  tourCard: string;
  plan: string;
  manager: string;
  coach: string;
  sponsor1: string;
  sponsor2: string;
  walkOnMusic: string;
  dartSetup: { barrelWeight: string; flightShape: string; shaftLength: string; boardSetup: string };
  careerEarnings: number;
  thisYearEarnings: number;
  careerTitles: number;
  majorTitles: number;
}

// ─── FEATURE GATING ───────────────────────────────────────────────────────────
// Pro plan unlocks advanced views. Essentials users see a locked CTA.
const PRO_FEATURES = [
  'tour-card-monitor', 'pressure-analysis', 'dartboard-heatmap',
  'merit-forecaster', 'walk-on-music', 'dartconnect', 'pdclive',
  'performance-rating', 'prize-forecaster', 'nine-dart-tracker',
];
const isPro = (plan: string) =>
  plan.toLowerCase().includes('premier')
  || plan.toLowerCase().includes('pro')
  || plan.toLowerCase().includes('279');

// ─── SIDEBAR ITEMS ────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'dashboard',         label: 'Dashboard',             icon: '🏠', group: 'OVERVIEW' },
  { id: 'morning',           label: 'Morning Briefing',      icon: '🌅', group: 'OVERVIEW' },
  { id: 'orderofmerit',      label: 'Order of Merit & Race', icon: '📊', group: 'PERFORMANCE' },
  { id: 'merit-forecaster',  label: 'Merit Forecaster',      icon: '📈', group: 'PERFORMANCE' },
  { id: 'entry-manager',     label: 'Entry Manager',         icon: '🗒️', group: 'PERFORMANCE' },
  { id: 'schedule',          label: 'Tournament Schedule',   icon: '🗓️', group: 'PERFORMANCE' },
  { id: 'live-scores',       label: 'Live Scores',           icon: '🔴', group: 'PERFORMANCE' },
  { id: 'draw-bracket',      label: 'Draw & Bracket',        icon: '🏆', group: 'PERFORMANCE' },
  { id: 'averages',          label: 'Three-Dart Average',    icon: '🎯', group: 'PERFORMANCE' },
  { id: 'advanced-stats',    label: 'Advanced Stats',        icon: '📊', group: 'PERFORMANCE' },
  { id: 'dartboard-heatmap', label: 'Dartboard Heatmap',     icon: '🎯', group: 'PERFORMANCE' },
  { id: 'checkout',          label: 'Checkout Analysis',     icon: '✅', group: 'PERFORMANCE' },
  { id: 'opponentintel',     label: 'Opponent Intel',        icon: '🔍', group: 'PERFORMANCE' },
  { id: 'pressure-analysis', label: 'Pressure Analysis',     icon: '🧠', group: 'PERFORMANCE' },
  { id: 'match-prep',        label: 'Match Prep',            icon: '⚡', group: 'PERFORMANCE' },
  { id: 'practicelog',       label: 'Practice Log',          icon: '📋', group: 'PERFORMANCE' },
  { id: 'matchreports',      label: 'Match Reports',         icon: '📄', group: 'PERFORMANCE' },
  { id: 'video',             label: 'Video Library',         icon: '🎬', group: 'PERFORMANCE' },
  { id: 'performance-rating',label: 'Performance Rating',    icon: '⭐', group: 'PERFORMANCE' },
  { id: 'nine-dart-tracker', label: 'Nine-Dart Tracker',     icon: '⚡', group: 'PERFORMANCE' },
  { id: 'premier-league',    label: 'Premier League',        icon: '🏆', group: 'PERFORMANCE' },
  { id: 'world-series',      label: 'World Series',          icon: '🌍', group: 'PERFORMANCE' },
  { id: 'teamhub',           label: 'Team Hub',              icon: '👥', group: 'TEAM' },
  { id: 'physio-recovery',   label: 'Physio & Recovery',     icon: '⚕️', group: 'TEAM' },
  { id: 'mental',            label: 'Mental Performance',    icon: '🧠', group: 'TEAM' },
  { id: 'walk-on-music',     label: 'Walk-on Music',         icon: '🎤', group: 'TEAM' },
  { id: 'pairs-events',      label: 'Pairs & Team Events',   icon: '👥', group: 'TEAM' },
  { id: 'team-comms',        label: 'Team Comms',            icon: '💬', group: 'TEAM' },
  { id: 'fan-engagement',    label: 'Fan Engagement',        icon: '📣', group: 'TEAM' },
  { id: 'nutrition-log',     label: 'Nutrition & Conditioning', icon: '🥗', group: 'TEAM' },
  { id: 'sponsorship',       label: 'Sponsorship',           icon: '🤝', group: 'COMMERCIAL' },
  { id: 'exhibitions',       label: 'Exhibition Manager',    icon: '🎪', group: 'COMMERCIAL' },
  { id: 'media',             label: 'Media & Content',       icon: '📱', group: 'COMMERCIAL' },
  { id: 'financial',         label: 'Financial Dashboard',   icon: '💰', group: 'COMMERCIAL' },
  { id: 'agent',             label: 'Agent Pipeline',        icon: '📬', group: 'COMMERCIAL' },
  { id: 'travel',            label: 'Travel & Logistics',    icon: '✈️', group: 'OPERATIONS' },
  { id: 'tourcard',          label: 'Tour Card & Q-School',  icon: '🏛️', group: 'OPERATIONS' },
  { id: 'tour-card-monitor', label: 'Tour Card Monitor',     icon: '🛡️', group: 'OPERATIONS' },
  { id: 'prize-forecaster',  label: 'Prize Money Forecaster',icon: '💷', group: 'OPERATIONS' },
  { id: 'equipment',         label: 'Equipment Setup',       icon: '📦', group: 'OPERATIONS' },
  { id: 'academy-dev',       label: 'Academy & Dev',         icon: '🏅', group: 'OPERATIONS' },
  { id: 'practice-games',    label: 'Practice Games',        icon: '#️⃣', group: 'OPERATIONS' },
  { id: 'board-booking',     label: 'Practice Board Booking',icon: '📍', group: 'OPERATIONS' },
  { id: 'accreditations',    label: 'Accreditations',        icon: '🛡️', group: 'OPERATIONS' },
  { id: 'county-darts',      label: 'County Darts',          icon: '🥇', group: 'OPERATIONS' },
  { id: 'career',            label: 'Career Planning',       icon: '🚀', group: 'OPERATIONS' },
  { id: 'datahub',           label: 'Data Hub',              icon: '📡', group: 'OPERATIONS' },
  { id: 'settings',          label: 'Settings',              icon: '⚙️', group: 'OPERATIONS' },
  { id: 'dartconnect',       label: 'DartConnect',           icon: '🔌', group: 'INTEGRATIONS' },
  { id: 'pdclive',           label: 'PDC Live Data',         icon: '📡', group: 'INTEGRATIONS' },
  { id: 'womens-darts',      label: "Women's Darts",         icon: '⭐', group: 'INTEGRATIONS' },
];

// ─── DEMO PLAYER ──────────────────────────────────────────────────────────────
const DEMO_PLAYER: DartsPlayer = {
  name: 'Jake Morrison',
  nickname: 'The Hammer',
  nationality: 'English',
  nationalityFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  pdcRank: 19,
  orderOfMeritRank: 19,
  threeDartAverage: 97.8,
  checkoutPercent: 42.3,
  oneEightiesPerLeg: 0.84,
  firstNineAverage: 101.4,
  highestCheckout: 164,
  tourCard: 'Secured — top 32',
  plan: 'Premier League · £279/mo',
  manager: 'Dave Harris (DH Sports Management)',
  coach: 'Phil "The Power" Coaching Academy',
  sponsor1: 'Red Dragon Darts',
  sponsor2: 'Ladbrokes',
  walkOnMusic: 'Enter Sandman — Metallica',
  dartSetup: { barrelWeight: '24g', flightShape: 'Standard', shaftLength: 'Medium', boardSetup: 'Winmau Blade 6 — 9ft oche' },
  careerEarnings: 687420,
  thisYearEarnings: 124800,
  careerTitles: 8,
  majorTitles: 1,
};

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = 'red' }: { label: string; value: string | number; sub?: string; color?: string }) => {
  const colorMap: Record<string, string> = {
    red:    'from-red-600/20 to-red-900/10 border-red-600/20',
    purple: 'from-purple-600/20 to-purple-900/10 border-purple-600/20',
    teal:   'from-teal-600/20 to-teal-900/10 border-teal-600/20',
    orange: 'from-orange-600/20 to-orange-900/10 border-orange-600/20',
    blue:   'from-blue-600/20 to-blue-900/10 border-blue-600/20',
    green:  'from-green-600/20 to-green-900/10 border-green-600/20',
    yellow: 'from-yellow-600/20 to-yellow-900/10 border-yellow-600/20',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color] || colorMap.red} border rounded-xl p-4`}>
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

const LevelBadge = ({ level }: { level: string }) => {
  const colors: Record<string, string> = {
    'Major TV': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    'Premier League': 'bg-purple-600/20 text-purple-400 border border-purple-600/30',
    'European Tour': 'bg-blue-600/20 text-blue-400 border border-blue-600/30',
    'Pro Tour': 'bg-teal-600/20 text-teal-400 border border-teal-600/30',
    'World Series': 'bg-orange-600/20 text-orange-400 border border-orange-600/30',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[level] || 'bg-gray-700 text-gray-400'}`}>{level}</span>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    'Playing': 'bg-green-600/20 text-green-400 border border-green-600/30',
    'Confirmed': 'bg-teal-600/20 text-teal-400 border border-teal-600/30',
    'Enter Now': 'bg-red-600/20 text-red-400 border border-red-600/30',
    'Not open': 'bg-gray-600/20 text-gray-400 border border-gray-600/30',
    'Invited': 'bg-purple-600/20 text-purple-400 border border-purple-600/30',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || 'bg-gray-700 text-gray-400'}`}>{status}</span>;
};

const QuickActionsBar = ({ onNavigate }: { onNavigate: (id: string) => void }) => {
  const actions = [
    { label: 'Log Practice', icon: <ClipboardList className="w-3.5 h-3.5" />, target: 'practicelog' },
    { label: 'Match Report', icon: <FileText className="w-3.5 h-3.5" />, target: 'matchreports' },
    { label: 'Equipment Check', icon: <Package className="w-3.5 h-3.5" />, target: 'equipment' },
    { label: 'Sponsor Post', icon: <Mic className="w-3.5 h-3.5" />, target: 'media' },
    { label: 'Exhibition Book', icon: <Star className="w-3.5 h-3.5" />, target: 'exhibitions' },
    { label: 'Order of Merit', icon: <BarChart2 className="w-3.5 h-3.5" />, target: 'orderofmerit' },
    { label: 'Checkout Trainer', icon: <Target className="w-3.5 h-3.5" />, target: 'checkout' },
    { label: 'Travel Info', icon: <Plane className="w-3.5 h-3.5" />, target: 'travel' },
  ];
  return (
    <div className="flex items-center gap-3 border-b border-t border-gray-800/50 bg-[#0a0c14]">
      <span className="text-xs text-gray-500 font-medium px-4 whitespace-nowrap">Quick Actions</span>
      <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {actions.map((a, i) => (
          <button key={i} onClick={() => onNavigate(a.target)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap shrink-0 bg-red-700 text-gray-50">
            {a.icon}{a.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── DASHBOARD VIEW ───────────────────────────────────────────────────────────
function DashboardView({ player, onNavigate }: { player: DartsPlayer; onNavigate: (id: string) => void }) {
  const [dashTab, setDashTab] = useState<'tasks'|'insights'|'dontmiss'|'team'>('tasks');
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />

      {/* World clock strip */}
      <div className="flex items-center gap-6 px-1 mb-4 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">🇬🇧</span>
          <span className="text-white font-medium">London</span>
          <span>12:00 BST</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">🇩🇪</span>
          <span className="text-white font-medium">Dortmund</span>
          <span>13:00 CET</span>
          <span className="ml-1 text-red-400 text-[10px] font-medium">TONIGHT</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">🇦🇺</span>
          <span className="text-white font-medium">Melbourne</span>
          <span>21:00 AEST</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">🇺🇸</span>
          <span className="text-white font-medium">Las Vegas</span>
          <span>04:00 PDT</span>
        </div>
        <div className="ml-auto text-gray-500">Dortmund · 14°C · Overcast</div>
      </div>

      <SectionHeader icon="🏠" title={`Good morning, ${player.name.split(' ')[0]}.`} subtitle="Here's your overview — PDC European Championship week." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="PDC Rank" value={`#${player.pdcRank}`} sub="▲2 this week" color="red" />
        <StatCard label="Order of Merit" value={`#${player.orderOfMeritRank}`} sub="£687,420" color="orange" />
        <StatCard label="3-Dart Avg" value={player.threeDartAverage} sub="2025 season" color="teal" />
        <StatCard label="Career High" value="#12" sub="Mar 2024" color="purple" />
      </div>

      {/* OoM expiry warning strip */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-950/40 border border-amber-800/30 text-sm mb-4">
        <span className="text-amber-400 text-base">⏰</span>
        <span className="text-amber-200">
          <span className="font-medium">£12,400 drops off your Order of Merit this week</span>
          <span className="text-amber-400/70"> — Players Ch. 8 (Apr 2023). Win your match tonight to stay at #19.</span>
        </span>
        <button onClick={() => onNavigate('merit-forecaster')} className="ml-auto text-amber-400 text-xs hover:text-amber-300 whitespace-nowrap">
          Merit Forecaster →
        </button>
      </div>

      {/* Quick Win tabs */}
      <div className="rounded-xl bg-gray-900/60 border border-white/5 mb-4">
        <div className="flex border-b border-white/5">
          {(['tasks','insights','dontmiss','team'] as const).map(t => (
            <button
              key={t}
              onClick={() => setDashTab(t)}
              className={`px-4 py-2.5 text-xs font-medium transition-colors ${dashTab === t ? 'text-red-400 border-b-2 border-red-500 -mb-px' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {t === 'tasks' ? 'Daily Tasks' : t === 'insights' ? 'Insights' : t === 'dontmiss' ? "Don't Miss" : 'Team'}
            </button>
          ))}
        </div>

        <div className="p-4">
          {dashTab === 'tasks' && (
            <div className="space-y-2.5">
              {[
                { done: false, text: 'Confirm practice session time with venue (10:00)' },
                { done: false, text: 'Review Red Dragon barrel options before content shoot' },
                { done: true,  text: 'Check PDC entry system — Prague Open confirmed' },
                { done: false, text: 'Reply to Paddy Power ambassador inquiry' },
                { done: false, text: 'Sign off travel insurance for Bahrain Masters' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm">
                  <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center ${item.done ? 'bg-green-500/20 border-green-500/40' : 'border-white/10'}`}>
                    {item.done && <span className="text-green-400 text-[10px]">✓</span>}
                  </div>
                  <span className={item.done ? 'text-gray-500 line-through' : 'text-gray-300'}>{item.text}</span>
                </div>
              ))}
            </div>
          )}

          {dashTab === 'insights' && (
            <div className="space-y-2.5">
              {[
                { icon: '📉', text: 'Doubles conversion 38.2% — 4.1% below your 2025 season average' },
                { icon: '✅', text: '2-0 vs left-handed opponents in 2025' },
                { icon: '⚠️', text: 'Average drops 3.1 pts in deciding legs — focus for mental coach' },
                { icon: '🏆', text: 'Best average this season: 104.7 (Players Championship 12)' },
                { icon: '📈', text: 'Last 8 weeks: 6 wins 2 losses — strongest run of 2025' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <span className="text-base leading-5 flex-shrink-0">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          )}

          {dashTab === 'dontmiss' && (
            <div className="space-y-2.5">
              {[
                { icon: '🔴', text: 'Red Dragon contract renewal: 23 days', view: 'sponsorship', cta: '→ Sponsorship' },
                { icon: '⚠️', text: 'Prague Open entry window closes: 6 days', view: 'entry-manager', cta: '→ Entry Manager' },
                { icon: '⚠️', text: '£4,200 prize payment pending — Players Championship 19', view: 'prize-forecaster', cta: '→ Prize Forecaster' },
                { icon: '📅', text: 'Q-School reserve list update: Friday', view: 'tour-card-monitor', cta: '→ Tour Card Monitor' },
                { icon: '🎵', text: 'Walk-on music approval needed for Grand Slam submission', view: 'walk-on-music', cta: '→ Walk-on Music' },
              ].map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-3 text-sm">
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="text-gray-300">{item.text}</span>
                  </div>
                  <button onClick={() => onNavigate(item.view)} className="text-red-400 text-xs hover:text-red-300 whitespace-nowrap flex-shrink-0">
                    {item.cta}
                  </button>
                </div>
              ))}
            </div>
          )}

          {dashTab === 'team' && (
            <div className="space-y-3">
              {[
                { name: 'Marco',    role: 'Coach',        msg: 'Focus on T20 cluster tightness — pulling left under pressure' },
                { name: 'James',    role: 'Agent',        msg: 'Red Dragon renewal call scheduled Thursday 14:00' },
                { name: 'Dr. Singh',role: 'Physio',       msg: 'Shoulder treatment confirmed 08:30 tomorrow' },
                { name: 'Sarah',    role: 'Mental coach', msg: 'Pre-match routine updated — check Match Prep before tonight' },
              ].map((item, i) => (
                <div key={i} className="text-sm">
                  <span className="text-white font-medium">{item.name}</span>
                  <span className="text-gray-500 text-xs ml-1.5">{item.role}</span>
                  <p className="text-gray-400 mt-0.5">{item.msg}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sponsor obligation strip */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900/40 border border-white/5 text-sm mb-4">
        <span className="text-base">🤝</span>
        <span className="text-gray-300">
          <span className="font-medium">Red Dragon</span>
          <span className="text-gray-500"> · Content shoot today 16:00 · Barrel review video · 2 posts due this week</span>
        </span>
        <button onClick={() => onNavigate('sponsorship')} className="ml-auto text-red-400 text-xs hover:text-red-300 whitespace-nowrap">
          → Sponsorship
        </button>
      </div>

      {/* This Week */}
      <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-600/30 rounded-xl p-5">
        <div className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-3">THIS WEEK</div>
        <div className="text-white font-bold text-lg mb-1">PDC European Championship · Dortmund</div>
        <div className="text-gray-400 text-sm mb-3">20:00 · Tonight · First round · Prize fund: £500,000 · Win = £110,000</div>
        <div className="bg-black/20 rounded-lg p-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">TONIGHT&apos;S OPPONENT</div>
          <div className="text-white font-medium">Gerwyn Price (#7) — &quot;The Iceman&quot;</div>
          <div className="text-xs text-gray-400 mt-1">Average: 96.2 · Checkout: 40.1% · 180s/leg: 0.79</div>
        </div>
      </div>

      {/* Recent Form */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Recent Form — Last 5</div>
        <div className="space-y-2">
          {[
            { r: 'W', score: '6-2', avg: '101.4', prize: '£8,000' },
            { r: 'W', score: '6-4', avg: '98.7', prize: '£6,000' },
            { r: 'L', score: '3-6', avg: '94.1', prize: '£0' },
            { r: 'W', score: '6-3', avg: '99.2', prize: '£12,000' },
            { r: 'W', score: '6-1', avg: '103.8', prize: '£16,000' },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${m.r === 'W' ? 'bg-teal-600/20 text-teal-400' : 'bg-red-600/20 text-red-400'}`}>{m.r}</div>
              <span className="text-sm text-gray-200 w-12">{m.score}</span>
              <span className="text-xs text-gray-400">avg {m.avg}</span>
              <span className="text-xs text-gray-500 ml-auto">{m.prize}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Alerts</div>
        <div className="space-y-2">
          {[
            { icon: '🔴', text: 'Red Dragon contract renewal: 23 days', color: 'text-red-400' },
            { icon: '⚠️', text: 'European Tour entry deadline: 6 days (Prague Open)', color: 'text-amber-400' },
            { icon: '⚠️', text: '£4,200 prize money payment pending (Players Championship)', color: 'text-amber-400' },
          ].map((a, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs ${a.color} py-1.5 border-b border-gray-800/50`}>
              <span>{a.icon}</span><span>{a.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Today&apos;s Schedule</div>
        <div className="space-y-2">
          {[
            { time: '10:00', event: 'Practice session: doubles finishing (90 min)' },
            { time: '12:30', event: 'Physio: shoulder treatment' },
            { time: '14:00', event: 'Red Dragon content shoot — barrel review video' },
            { time: '16:00', event: 'Travel to Dortmund (flight BA1234)' },
            { time: '20:00', event: 'PDC European Championship R1 vs G. Price' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-red-400 font-medium w-12">{s.time}</span>
              <span className="text-sm text-gray-300">{s.event}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MORNING BRIEFING VIEW ────────────────────────────────────────────────────
function MorningBriefingView({ player: _player }: { player: DartsPlayer }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const briefingItems = [
    { id: 'match', icon: '🎯', title: "Tonight's match", urgent: true,
      summary: 'European Championship R1 vs Gerwyn Price (#7) · 20:00 · Dortmund · Board 4',
      detail: "H2H: Jake leads 8–3. Price averages 96.2 this season, starts slowly. Jake's avg vs Price: 99.4. Win probability: 62%. Prize if win: £11,000. → Match Prep has full briefing ready." },
    { id: 'oom', icon: '📊', title: 'Order of Merit', urgent: false,
      summary: '#19 PDC · £687,420 · £12,400 drops off this week',
      detail: 'You need to earn £12,400 this week to hold #19. A R1 win tonight (£11,000) plus any PC earnings will cover the drop. Buffer above 64th place: £189,420 — you are safe.' },
    { id: 'messages', icon: '💬', title: 'Team messages', urgent: false,
      summary: '4 messages — Marco, James, Dr. Singh, Sarah',
      detail: 'Marco: "Focus on T20 cluster tightness — pulling left under pressure." James: "Red Dragon renewal call Thursday 14:00." Dr. Singh: "Shoulder treatment confirmed 08:30 tomorrow." Sarah: "Pre-match routine updated — check Match Prep."' },
    { id: 'weather', icon: '🌤️', title: 'Dortmund weather', urgent: false,
      summary: '14°C · Overcast · Wind 8km/h SW',
      detail: 'Venue: Westfalenhallen, Dortmund. Indoor event — weather does not affect play. Travel tip: light jacket for evening travel to venue.' },
    { id: 'sponsors', icon: '🤝', title: 'Sponsor obligations', urgent: true,
      summary: 'Red Dragon content shoot today 16:00',
      detail: 'Barrel review video required before travel to Dortmund. 2 posts due this week total. Contract renewal in 23 days — James to call Thursday. Paddy Power ambassador post due Friday.' },
    { id: 'entries', icon: '📋', title: 'Entry deadlines', urgent: true,
      summary: 'Prague Open closes Apr 19 — 6 days',
      detail: 'You are auto-qualified via OoM #19. Entry is recommended — Prague has been good for you historically (avg 99.2 in 2024). German Masters deadline Apr 26. Both require manual confirmation in Entry Manager.' },
  ];
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white">Morning Briefing</h1>
          <p className="text-gray-400 text-sm mt-1">Tuesday, April 8 2025 · PDC European Championship week</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-500" />Briefing ready · 06:30
        </div>
      </div>
      <div className="bg-gradient-to-r from-red-950/40 to-gray-900/40 rounded-xl border border-red-500/20 p-5">
        <p className="text-xs text-red-400 font-medium uppercase tracking-wide mb-3">✦ AI Morning Summary</p>
        <p className="text-gray-200 text-sm leading-relaxed">Big night ahead, Jake. You play Gerwyn Price at 20:00 in Dortmund — your H2H is 8–3 in your favour and you average 99.4 against him. Price starts slowly so applying pressure in the first three legs is key. Watch your doubles under pressure — your checkout % drops 7.4 points in deciding legs. The Red Dragon content shoot at 16:00 means you need to leave for the venue by 17:30 at the latest. Prague Open entry closes in 6 days — confirm with James today.</p>
      </div>
      <div className="space-y-2">
        {briefingItems.map(item => (
          <div key={item.id} className={`rounded-xl border transition-all ${expanded === item.id ? 'bg-gray-900/80 border-white/10' : 'bg-gray-900/40 border-white/5'}`}>
            <button onClick={() => setExpanded(expanded === item.id ? null : item.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">{item.title}</span>
                  {item.urgent && <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded">Action</span>}
                </div>
                <p className="text-gray-500 text-xs mt-0.5 truncate">{item.summary}</p>
              </div>
              <ChevronRight className={`w-4 h-4 text-gray-600 flex-shrink-0 transition-transform ${expanded === item.id ? 'rotate-90' : ''}`} />
            </button>
            {expanded === item.id && (
              <div className="px-4 pb-4 pt-0">
                <div className="border-t border-white/5 pt-3">
                  <p className="text-gray-300 text-sm leading-relaxed">{item.detail}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Today at a glance</h2>
        <div className="space-y-1">
          {[
            { time: '10:00', event: 'Practice session — doubles finishing (90 min)', urgent: false },
            { time: '12:30', event: 'Physio: shoulder treatment (Dr. Singh)', urgent: false },
            { time: '14:00', event: 'Red Dragon content shoot — barrel review video', urgent: true },
            { time: '16:00', event: 'Travel to Dortmund (flight BA1234)', urgent: false },
            { time: '20:00', event: 'PDC European Championship R1 vs G. Price', urgent: true },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${item.urgent ? 'bg-red-950/20' : ''}`}>
              <span className="text-gray-500 w-10 flex-shrink-0 text-xs">{item.time}</span>
              <span className={item.urgent ? 'text-red-300' : 'text-gray-300'}>{item.event}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-600 text-center">Briefing generated at 06:30 · Connect Claude API for AI-personalised audio briefing</p>
    </div>
  );
}

// ─── ORDER OF MERIT VIEW ──────────────────────────────────────────────────────
function OrderOfMeritView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const expiryMonths = [
    { month: 'Jan', amount: 0 }, { month: 'Feb', amount: 8000 }, { month: 'Mar', amount: 0 },
    { month: 'Apr', amount: 12000 }, { month: 'May', amount: 0 }, { month: 'Jun', amount: 24000 },
    { month: 'Jul', amount: 0 }, { month: 'Aug', amount: 6000 }, { month: 'Sep', amount: 16000 },
    { month: 'Oct', amount: 0 }, { month: 'Nov', amount: 8500 }, { month: 'Dec', amount: 0 },
  ];
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="📊" title="PDC Order of Merit & Race to Grand Champions" subtitle="Rolling 2-year prize money rankings and race standings." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Current Rank" value="#19" sub="Order of Merit" color="red" />
        <StatCard label="Rolling 2-Year" value="£687,420" sub="Prize money total" color="orange" />
        <StatCard label="To Top 16" value="+£94,580" sub="Premier League place" color="purple" />
        <StatCard label="To Top 8" value="+£412,000" sub="World Ch. seeding" color="blue" />
      </div>

      {/* Prize Money Expiry */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Prize Money Expiry Calendar (Rolling Off)</div>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
          {expiryMonths.map((m, i) => (
            <div key={i} className={`rounded-lg p-2 text-center border ${m.amount > 15000 ? 'bg-red-600/10 border-red-600/30' : m.amount >= 5000 ? 'bg-amber-600/10 border-amber-600/30' : 'bg-green-600/10 border-green-600/30'}`}>
              <div className="text-[10px] text-gray-500">{m.month}</div>
              <div className={`text-xs font-bold ${m.amount > 15000 ? 'text-red-400' : m.amount >= 5000 ? 'text-amber-400' : 'text-green-400'}`}>
                {m.amount > 0 ? `£${(m.amount / 1000).toFixed(0)}k` : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Race to Grand Champions */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Race to Grand Champions</div>
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>Current: #23 · Need £38,000 more</span><span>Threshold: Top 32</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3">
          <div className="h-3 rounded-full bg-gradient-to-r from-red-500 to-orange-500" style={{ width: '68%' }}></div>
        </div>
      </div>

      {/* Top 5 + Jake */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800"><div className="text-sm font-semibold text-white">Order of Merit Standings</div></div>
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30"><th className="text-left p-3">#</th><th className="text-left p-3">Player</th><th className="text-left p-3">Prize Money</th></tr></thead>
          <tbody>
            {[
              { rank: 1, name: 'Luke Humphries', money: '£2,847,200' },
              { rank: 2, name: 'Luke Littler', money: '£2,641,800' },
              { rank: 3, name: 'Michael van Gerwen', money: '£2,198,400' },
              { rank: 4, name: 'Gerwyn Price', money: '£1,847,600' },
              { rank: 5, name: 'Jonny Clayton', money: '£1,623,400' },
              { rank: 19, name: 'Jake Morrison ←', money: '£687,420' },
            ].map((p, i) => (
              <tr key={i} className={`border-b border-gray-800/50 ${p.rank === 19 ? 'bg-red-600/5' : ''}`}>
                <td className="p-3 text-gray-400">{p.rank}</td>
                <td className={`p-3 ${p.rank === 19 ? 'text-red-400 font-medium' : 'text-gray-200'}`}>{p.name}</td>
                <td className="p-3 text-gray-300">{p.money}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Season Prize Breakdown */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">2025 Season Prize Breakdown</div>
        <div className="space-y-2">
          {[
            { event: 'PDC World Championship R2', amount: '£35,000' },
            { event: 'Premier League (6 nights)', amount: '£42,000' },
            { event: 'UK Open QF', amount: '£24,000' },
            { event: 'World Matchplay QF', amount: '£16,000' },
            { event: 'Players Championship events', amount: '£44,800' },
            { event: 'European Tour events', amount: '£28,420' },
            { event: 'Pro Tour events', amount: '£18,200' },
          ].map((e, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-sm text-gray-300">{e.event}</span>
              <span className="text-sm text-gray-200 font-medium">{e.amount}</span>
            </div>
          ))}
          <div className="flex items-center justify-between py-2 mt-1">
            <span className="text-sm text-white font-bold">Total 2025</span>
            <span className="text-sm text-red-400 font-bold">£124,800</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TOURNAMENT SCHEDULE VIEW ─────────────────────────────────────────────────
function TournamentScheduleView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const events = [
    { event: 'PDC European Championship', level: 'Major TV', prize: '£500k', date: 'This week', deadline: 'Entered', status: 'Playing' },
    { event: 'Prague Open', level: 'European Tour', prize: '£120k', date: 'Apr 28', deadline: 'Apr 22 ← 6d', status: 'Enter Now' },
    { event: 'Players Championship 9', level: 'Pro Tour', prize: '£100k', date: 'May 3', deadline: 'Apr 27', status: 'Not open' },
    { event: 'Players Championship 10', level: 'Pro Tour', prize: '£100k', date: 'May 4', deadline: 'Apr 27', status: 'Not open' },
    { event: 'German Masters', level: 'Major TV', prize: '£300k', date: 'May 12', deadline: 'May 5', status: 'Not open' },
    { event: 'Bahrain Darts Masters', level: 'World Series', prize: '£200k', date: 'May 18', deadline: 'May 10', status: 'Not open' },
    { event: 'UK Open', level: 'Major TV', prize: '£500k', date: 'Jun 1', deadline: 'May 20', status: 'Not open' },
    { event: 'Premier League (Night 12)', level: 'Premier League', prize: '£10k/night', date: 'Jun 6', deadline: 'Invited', status: 'Confirmed' },
    { event: 'World Matchplay', level: 'Major TV', prize: '£700k', date: 'Jul 18', deadline: 'Jun 30', status: 'Not open' },
    { event: 'World Grand Prix', level: 'Major TV', prize: '£600k', date: 'Oct 5', deadline: 'Sep 15', status: 'Not open' },
  ];
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="🗓️" title="Tournament Schedule 2025" subtitle="PDC calendar with entry status, prize funds, and deadlines." />

      <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-3 text-xs text-red-400 font-medium">
        <AlertCircle className="w-3.5 h-3.5 inline mr-1" /> 2 entry deadlines in next 7 days
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Events Entered" value="24" sub="This season" color="red" />
        <StatCard label="Completed" value="8" color="teal" />
        <StatCard label="Upcoming" value="16" color="orange" />
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
            <th className="text-left p-3">Event</th><th className="text-left p-3">Level</th><th className="text-left p-3">Prize</th><th className="text-left p-3">Date</th><th className="text-left p-3">Entry Deadline</th><th className="text-left p-3">Status</th>
          </tr></thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="p-3 text-gray-200">{e.event}</td>
                <td className="p-3"><LevelBadge level={e.level} /></td>
                <td className="p-3 text-gray-300">{e.prize}</td>
                <td className="p-3 text-gray-400 text-xs">{e.date}</td>
                <td className={`p-3 text-xs ${e.deadline.includes('←') ? 'text-red-400 font-medium' : 'text-gray-400'}`}>{e.deadline}</td>
                <td className="p-3"><StatusBadge status={e.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Withdrawal Tracker</div>
        <div className="space-y-2 text-xs text-gray-400">
          <div className="py-1.5 border-b border-gray-800/50">Prague Open — withdrawal deadline Apr 20. No fine if before deadline.</div>
          <div className="py-1.5 border-b border-gray-800/50">Players Ch 9/10 — withdrawal deadline Apr 25.</div>
        </div>
      </div>
    </div>
  );
}

// ─── THREE-DART AVERAGE VIEW ──────────────────────────────────────────────────
function ThreeDartAverageView({ player, onNavigate }: { player: DartsPlayer; onNavigate: (id: string) => void }) {
  const matchAvgs = [
    { opp: 'Hump', avg: 94.2 }, { opp: 'Lit', avg: 99.8 }, { opp: 'MvG', avg: 96.1 },
    { opp: 'Price', avg: 101.4 }, { opp: 'Clay', avg: 98.7 }, { opp: 'Rock', avg: 103.2 },
    { opp: 'Bunt', avg: 95.4 }, { opp: 'Nopb', avg: 97.8 }, { opp: 'Smi', avg: 100.1 }, { opp: 'Wrig', avg: 96.8 },
  ];
  const chartW = 500, chartH = 180, padL = 35, padR = 100, padT = 15, padB = 30;
  const plotW = chartW - padL - padR, plotH = chartH - padT - padB;
  const yMin = 85, yMax = 110;

  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="🎯" title="Three-Dart Average Analysis" subtitle="Career averages, event breakdowns, and match-by-match trends." />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Career Avg" value={player.threeDartAverage} color="red" />
        <StatCard label="Best Tournament" value="103.4" sub="Players Ch. Feb 2025" color="teal" />
        <StatCard label="First-9 Avg" value={player.firstNineAverage} color="orange" />
        <StatCard label="180s/Leg" value={player.oneEightiesPerLeg} color="purple" />
        <StatCard label="Highest Checkout" value={player.highestCheckout} sub="D12" color="blue" />
      </div>

      {/* Average by Event Type */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800"><div className="text-sm font-semibold text-white">Average by Event Type</div></div>
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30"><th className="text-left p-3">Event Type</th><th className="text-left p-3">Avg</th><th className="text-left p-3">180s/Leg</th></tr></thead>
          <tbody>
            {[
              { type: 'Major TV events', avg: '98.6', e: '0.91' },
              { type: 'European Tour', avg: '97.1', e: '0.79' },
              { type: 'Pro Tour', avg: '96.8', e: '0.82' },
              { type: 'Premier League', avg: '99.2', e: '0.88' },
            ].map((r, i) => (
              <tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200">{r.type}</td><td className="p-3 text-gray-300">{r.avg}</td><td className="p-3 text-gray-300">{r.e}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Line Chart */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Last 10 Match Averages</div>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
          {[85, 90, 95, 100, 105, 110].map(v => {
            const y = padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
            return (<g key={v}><line x1={padL} y1={y} x2={padL + plotW} y2={y} stroke="#1f2937" strokeWidth="0.5" /><text x={padL - 5} y={y + 3} textAnchor="end" fill="#6b7280" fontSize="8">{v}</text></g>);
          })}
          <line x1={padL} y1={padT + plotH - ((97.8 - yMin) / (yMax - yMin)) * plotH} x2={padL + plotW} y2={padT + plotH - ((97.8 - yMin) / (yMax - yMin)) * plotH} stroke="#EF9F27" strokeWidth="1" strokeDasharray="6 3" />
          <text x={padL + plotW + 5} y={padT + plotH - ((97.8 - yMin) / (yMax - yMin)) * plotH + 3} fill="#EF9F27" fontSize="8">Career avg (97.8)</text>
          <line x1={padL} y1={padT + plotH - ((94.1 - yMin) / (yMax - yMin)) * plotH} x2={padL + plotW} y2={padT + plotH - ((94.1 - yMin) / (yMax - yMin)) * plotH} stroke="#4b5563" strokeWidth="1" strokeDasharray="4 3" />
          <text x={padL + plotW + 5} y={padT + plotH - ((94.1 - yMin) / (yMax - yMin)) * plotH + 3} fill="#6b7280" fontSize="8">Tour avg (94.1)</text>
          <polyline fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinejoin="round"
            points={matchAvgs.map((d, i) => `${padL + (i / (matchAvgs.length - 1)) * plotW},${padT + plotH - ((d.avg - yMin) / (yMax - yMin)) * plotH}`).join(' ')} />
          {matchAvgs.map((d, i) => {
            const x = padL + (i / (matchAvgs.length - 1)) * plotW;
            const y = padT + plotH - ((d.avg - yMin) / (yMax - yMin)) * plotH;
            return (<g key={i}><circle cx={x} cy={y} r="3.5" fill="#1D9E75" stroke="#0d0f1a" strokeWidth="1.5" /><text x={x} y={padT + plotH + 15} textAnchor="middle" fill="#6b7280" fontSize="7">{d.opp}</text></g>);
          })}
        </svg>
      </div>

      {/* Leg Scoring Breakdown */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Leg Scoring Breakdown</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '100+ scoring legs', value: '34%' }, { label: '140+ scoring legs', value: '18%' },
            { label: '180s', value: '12%' }, { label: 'Sub-60 legs', value: '8%' },
          ].map((s, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3 text-center">
              <div className="text-white font-bold text-lg">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CHECKOUT ANALYSIS VIEW ───────────────────────────────────────────────────
function CheckoutAnalysisView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const doubles = [
    { double: 'D20', rate: 47, attempts: 234, primary: true }, { double: 'D16', rate: 51, attempts: 198 },
    { double: 'D8', rate: 44, attempts: 156 }, { double: 'D4', rate: 43, attempts: 89 },
    { double: 'D18', rate: 39, attempts: 72 }, { double: 'D12', rate: 41, attempts: 68 },
    { double: 'Bull', rate: 28, attempts: 54 }, { double: 'D1', rate: 38, attempts: 31 },
  ];
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="✅" title="Checkout & Finishing Analysis" subtitle="Double hit rates, checkout routes, and pressure finishing data." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Checkout %" value="42.3%" sub="Season average" color="red" />
        <StatCard label="Tour Average" value="40.8%" sub="Above average" color="teal" />
        <StatCard label="Darts at Double" value="1.84" sub="Per attempt" color="orange" />
        <StatCard label="Highest Checkout" value="164" sub="D12" color="purple" />
      </div>

      {/* Doubles Bar Chart */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Favourite Doubles — Hit Rate</div>
        <div className="space-y-3">
          {doubles.map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 text-xs text-gray-400 text-right font-medium">{d.double}</div>
              <div className="flex-1 relative">
                <div className="w-full bg-gray-800 rounded-full h-5">
                  <div className="h-5 rounded-full bg-teal-600/60 flex items-center justify-end pr-2" style={{ width: `${d.rate}%` }}>
                    <span className="text-[10px] text-white font-bold">{d.rate}%</span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-gray-500 w-24 text-right">
                {d.attempts} attempts {d.primary && <span className="text-red-400 ml-1">primary</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-gray-600 mt-3">Dashed line: tour average 40.8%</div>
      </div>

      {/* Common Checkout Routes */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Common Checkout Routes</div>
        <div className="space-y-2">
          {[
            { co: '170', detail: 'Hit 3 times this season', route: 'T20-T20-Bull' },
            { co: '167', detail: 'Hit 1 time', route: 'T20-T19-Bull' },
            { co: '164', detail: 'Hit 2 times — season best', route: 'T20-T18-D14' },
            { co: '121', detail: '68% success', route: 'T17-D20 preferred route' },
            { co: '81', detail: '71% success', route: 'T19-D12 preferred route' },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800/50">
              <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-600/30 flex items-center justify-center text-sm font-bold text-red-400">{c.co}</div>
              <div className="flex-1"><div className="text-sm text-gray-200">{c.route}</div><div className="text-xs text-gray-500">{c.detail}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Under Pressure */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Under Pressure Stats</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Match darts hit %', value: '38.4%' }, { label: '1st dart at double', value: '61% D20/D16' },
            { label: 'Leg 5 (deciding) CO%', value: '44.1%' }, { label: '1 dart: 29%', value: '2 darts: 41%' },
          ].map((s, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3 text-center">
              <div className="text-white font-bold">{s.value}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 180s */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">180s Analysis</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total 180s (season)', value: '142' }, { label: 'Per match', value: '3.2' },
            { label: 'Best match', value: '8' }, { label: 'PDC ranking', value: '#14' },
          ].map((s, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3 text-center">
              <div className="text-white font-bold text-lg">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── OPPONENT INTEL VIEW ──────────────────────────────────────────────────────
function OpponentIntelView({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="🔍" title="Opponent Intelligence" subtitle="Scouting, H2H records, and tactical briefings." />

      {/* Tonight's Opponent */}
      <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-600/30 rounded-xl p-5">
        <div className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">TONIGHT&apos;S OPPONENT</div>
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-full bg-red-600/20 border-2 border-red-500/40 flex items-center justify-center text-2xl">🏴󠁧󠁢󠁷󠁬󠁳󠁿</div>
          <div>
            <div className="text-white font-bold text-lg">Gerwyn Price (#7 PDC)</div>
            <div className="text-gray-400 text-sm">&quot;The Iceman&quot; — Welsh</div>
          </div>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-xs">
          {[
            { label: '3-Dart Avg', value: '96.2' }, { label: 'Checkout %', value: '40.1%' },
            { label: '180s/Leg', value: '0.79' }, { label: 'First-9 Avg', value: '70.8' },
            { label: 'Pref Double', value: 'D16 (52%)' }, { label: 'Weakness', value: 'CO drops set 3+' },
          ].map((s, i) => (
            <div key={i} className="bg-black/20 rounded-lg p-2 text-center">
              <div className="text-white font-bold">{s.value}</div><div className="text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* H2H */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">H2H — Jake vs Price (Last 7)</div>
        <div className="text-lg text-white font-bold mb-2">Jake leads 4-3</div>
        <div className="space-y-1 text-xs text-gray-400">
          <div className="py-1 border-b border-gray-800/50">Last: Price won 6-4 · Players Championship · Oct 2024</div>
          <div className="py-1 border-b border-gray-800/50">Jake won 6-5 · European Tour · Sep 2024</div>
          <div className="py-1 border-b border-gray-800/50">Price won 6-3 · World Matchplay · Jul 2024</div>
        </div>
      </div>

      {/* Tactical Briefing */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Tactical Briefing</div>
        <div className="space-y-3">
          {[
            { title: 'Attack early', detail: 'Price\'s average in legs 1-3 of a set drops when opponent leads. Win the first 2 legs of each set aggressively.' },
            { title: 'Target D16 in checkout', detail: 'Price leaves this double poorly when under pressure. Force him to a double he\'s uncomfortable with by leaving 32s.' },
            { title: 'Maintain your own pace', detail: 'Price uses slow deliberate throws to disrupt rhythm. Stick to your 18-second routine regardless of his tempo.' },
          ].map((t, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-4">
              <div className="text-sm text-white font-medium mb-1">{t.title}</div>
              <div className="text-xs text-gray-400">{t.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Draw Analysis */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Draw Analysis — If Jake Wins Tonight</div>
        <div className="space-y-2">
          {[
            { round: 'QF potential', opp: 'Luke Littler (#2)', avg: '104.1', h2h: 'Jake 1-5' },
            { round: 'SF potential', opp: 'Michael van Gerwen (#3)', avg: '98.7', h2h: 'Jake 2-6' },
            { round: 'Final potential', opp: 'Luke Humphries (#1)', avg: '97.4', h2h: 'Jake 3-3' },
          ].map((d, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50">
              <span className="text-xs text-gray-500 w-24">{d.round}</span>
              <span className="text-sm text-gray-200 flex-1">{d.opp}</span>
              <span className="text-xs text-gray-400">avg {d.avg}</span>
              <span className="text-xs text-gray-500 ml-3">H2H: {d.h2h}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Player Database</div>
        <input type="text" placeholder="Search PDC player..." className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:border-red-500 focus:outline-none mb-3" />
        <div className="flex gap-2">
          {['MvG', 'Humphries', 'Bunting', 'Rock'].map(p => (
            <span key={p} className="text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded cursor-pointer hover:text-white">{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PRACTICE LOG VIEW ────────────────────────────────────────────────────────
function PracticeLogView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [practiceTab, setPracticeTab] = useState<'log' | 'stats' | 'goals'>('log');
  const [aiAnalysis, setAiAnalysis] = useState<Record<number, { loading: boolean; result: string | null }>>({});

  const sessions = [
    { date: 'Apr 14', type: 'Doubles Finishing', duration: '90 min', avg: '98.4', doubles: '44%', e180: '12', notes: 'Good session, D20 feeling reliable. D8 still inconsistent under pressure.' },
    { date: 'Apr 13', type: 'Scoring Practice', duration: '60 min', avg: '101.2', doubles: '—', e180: '—', notes: 'Excellent scoring session. Ready for European Championship.' },
    { date: 'Apr 12', type: 'Full match sim', duration: '120 min', avg: '96.8', doubles: '—', e180: '—', notes: 'Solid preparation. Keep first-9 above 72 consistently.' },
    { date: 'Apr 11', type: 'Mental prep', duration: '30 min', avg: '—', doubles: '—', e180: '—', notes: 'Session with Dr. Reed — focused on Price match mental prep.' },
    { date: 'Apr 10', type: 'Checkout clinic', duration: '75 min', avg: '—', doubles: '51%', e180: '—', notes: 'Best checkout session in 3 weeks. D16 clicking well.' },
  ];

  const handleAiAnalysis = async (idx: number) => {
    setAiAnalysis(prev => ({ ...prev, [idx]: { loading: true, result: null } }));
    const s = sessions[idx];
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500, messages: [{ role: 'user', content: `Analyse this darts practice session for Jake Morrison (PDC #19, 97.8 avg). Session: ${s.date}, Type: ${s.type}, Duration: ${s.duration}, Avg: ${s.avg}, Doubles hit: ${s.doubles}, 180s: ${s.e180}. Notes: ${s.notes}. Give 3 technical observations, 2 focus areas for next session, 1 tactical pattern to develop. Be concise.` }] }),
      });
      const data = await res.json();
      setAiAnalysis(prev => ({ ...prev, [idx]: { loading: false, result: data.content?.[0]?.text || 'No response.' } }));
    } catch { setAiAnalysis(prev => ({ ...prev, [idx]: { loading: false, result: 'Error generating analysis.' } })); }
  };

  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="📋" title="Practice Log" subtitle="Session tracking, metrics, and training goals." />

      <div className="flex gap-1 bg-[#0d0f1a] border border-gray-800 rounded-lg p-1 w-fit">
        {(['log', 'stats', 'goals'] as const).map(t => (
          <button key={t} onClick={() => setPracticeTab(t)} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${practiceTab === t ? 'bg-red-600/20 text-red-400 border border-red-600/30' : 'text-gray-500 hover:text-gray-300'}`}>{t}</button>
        ))}
      </div>

      {practiceTab === 'log' && (
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <div key={i}>
              <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div><div className="text-sm text-white font-medium">{s.date} — {s.type}</div><div className="text-xs text-gray-500">{s.duration}</div></div>
                  <button onClick={() => handleAiAnalysis(i)} disabled={aiAnalysis[i]?.loading} className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors disabled:opacity-50">
                    {aiAnalysis[i]?.loading ? 'Analysing...' : aiAnalysis[i]?.result ? 'Re-analyse' : 'AI Analysis'}
                  </button>
                </div>
                <div className="flex gap-4 text-xs text-gray-400 mb-2">
                  {s.avg !== '—' && <span>Avg: {s.avg}</span>}
                  {s.doubles !== '—' && <span>Doubles: {s.doubles}</span>}
                  {s.e180 !== '—' && <span>180s: {s.e180}</span>}
                </div>
                <div className="text-xs text-gray-500">{s.notes}</div>
              </div>
              {aiAnalysis[i]?.loading && (
                <div className="mt-2 bg-red-600/5 border border-red-600/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs text-red-400"><div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>Analysing session...</div>
                </div>
              )}
              {aiAnalysis[i]?.result && !aiAnalysis[i]?.loading && (
                <div className="mt-2 bg-red-600/5 border border-red-600/20 rounded-xl p-3">
                  <div className="text-[10px] text-red-400 font-semibold uppercase tracking-wider mb-1">AI Analysis</div>
                  <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{aiAnalysis[i].result}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {practiceTab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Last 7 Days" value="5 sessions" sub="7.5 hours" color="red" />
            <StatCard label="Monthly" value="18 sessions" sub="28 hours" color="teal" />
            <StatCard label="Best Streak" value="9 days" sub="Consecutive" color="orange" />
            <StatCard label="Practice vs Match" value="+1.4" sub="Avg lift after heavy week" color="purple" />
          </div>
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-2">Practice Average This Week</div>
            <div className="text-3xl font-bold text-white">99.2</div>
            <div className="text-xs text-gray-500 mt-1">vs match average of 97.8 — good correlation</div>
          </div>
        </div>
      )}

      {practiceTab === 'goals' && (
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-4">Training Goals</div>
          <div className="space-y-3">
            {[
              { goal: 'Checkout % above 44%', current: '42.3%', done: false },
              { goal: 'First-9 average above 73', current: '72.4', done: false },
              { goal: '180s per leg above 0.80', current: '0.84', done: true },
              { goal: 'Win European Tour event this season', current: 'Prague — entered', done: true },
              { goal: 'Reach top 16 Order of Merit by year end', current: '#19 currently', done: false },
            ].map((g, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${g.done ? 'border-teal-600/30 bg-teal-600/5' : 'border-gray-800 bg-[#0a0c14]'}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${g.done ? 'border-teal-500 bg-teal-500/20' : 'border-gray-600'}`}>
                  {g.done && <CheckCircle className="w-3 h-3 text-teal-400" />}
                </div>
                <div className="flex-1"><div className={`text-sm ${g.done ? 'text-gray-400 line-through' : 'text-gray-200'}`}>{g.goal}</div><div className="text-xs text-gray-500">{g.current}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MATCH REPORTS VIEW ───────────────────────────────────────────────────────
function MatchReportsView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<Record<string, string>>({});
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  const matches = [
    { id: 'dm1', opp: 'Jonny Clayton', rank: 10, event: 'Euro Championship QF', score: '6-3', avg: '101.4', result: 'W', date: '10 Apr' },
    { id: 'dm2', opp: 'Josh Rock', rank: 12, event: 'Euro Championship R2', score: '6-4', avg: '98.7', result: 'W', date: '9 Apr' },
    { id: 'dm3', opp: 'Stephen Bunting', rank: 15, event: 'Euro Championship R1', score: '6-2', avg: '99.2', result: 'W', date: '8 Apr' },
    { id: 'dm4', opp: 'Luke Littler', rank: 2, event: 'German Masters SF', score: '3-6', avg: '94.1', result: 'L', date: '3 Apr' },
    { id: 'dm5', opp: 'Callan Rydz', rank: 28, event: 'German Masters QF', score: '6-1', avg: '103.8', result: 'W', date: '2 Apr' },
    { id: 'dm6', opp: 'Gerwyn Price', rank: 7, event: 'Players Ch.', score: '4-6', avg: '96.2', result: 'L', date: '28 Mar' },
  ];

  const handleGenerate = async (m: typeof matches[0]) => {
    setGeneratingReport(m.id);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: `Write a post-match analysis for Jake 'The Hammer' Morrison (PDC #19) who ${m.result === 'W' ? 'won' : 'lost'} against ${m.opp} (#${m.rank}) at the ${m.event}, score ${m.score}, 3-dart average ${m.avg}. Include: 1) Match summary (2 sentences), 2) Key moments (3 bullet points), 3) What worked (2 bullet points), 4) Areas to improve (2 bullet points), 5) One tactical note for the rematch. Write in a professional darts analyst voice.` }] }),
      });
      const data = await res.json();
      setReportContent(prev => ({ ...prev, [m.id]: data.content?.[0]?.text ?? 'No response' }));
      setActiveReport(m.id);
    } catch { setReportContent(prev => ({ ...prev, [m.id]: 'Error generating report. Please try again.' })); setActiveReport(m.id); }
    setGeneratingReport(null);
  };

  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="📄" title="Match Reports & AI Summaries" subtitle="Post-match analysis and AI-generated reports." />
      <div className="space-y-3">
        {matches.map(m => (
          <div key={m.id}>
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${m.result === 'W' ? 'bg-teal-600/20 text-teal-400' : 'bg-red-600/20 text-red-400'}`}>{m.result}</div>
                  <div>
                    <div className="text-sm text-white font-medium">{m.score} vs {m.opp} <span className="text-gray-500 text-xs">#{m.rank}</span></div>
                    <div className="text-xs text-gray-500">{m.event} · avg {m.avg} · {m.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {reportContent[m.id] && <button onClick={() => setActiveReport(activeReport === m.id ? null : m.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-600/20 text-teal-400 border border-teal-600/30 hover:bg-teal-600/30 transition-colors">{activeReport === m.id ? 'Hide' : 'View report'}</button>}
                  <button onClick={() => handleGenerate(m)} disabled={generatingReport === m.id} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors disabled:opacity-50">{generatingReport === m.id ? 'Generating...' : reportContent[m.id] ? 'Regenerate' : 'Generate AI summary'}</button>
                </div>
              </div>
            </div>
            {generatingReport === m.id && <div className="mt-2 bg-red-600/5 border border-red-600/20 rounded-xl p-4"><div className="flex items-center gap-2 text-xs text-red-400"><div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>Generating match analysis...</div></div>}
            {activeReport === m.id && reportContent[m.id] && !generatingReport && (
              <div className="mt-2 bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><div className="text-sm font-semibold text-white">AI Match Analysis</div><span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">Generated by Claude</span></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigator.clipboard.writeText(reportContent[m.id])} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors">Copy</button>
                    <button onClick={() => alert('Sent to coach & manager ✓')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-600/20 text-teal-400 border border-teal-600/30 hover:bg-teal-600/30 transition-colors">Share with team</button>
                  </div>
                </div>
                <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{reportContent[m.id]}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── VIDEO LIBRARY VIEW ───────────────────────────────────────────────────────
function VideoLibraryView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [videoTab, setVideoTab] = useState<'match' | 'practice' | 'analysis' | 'walkons'>('match');
  const [expandedAnalysis, setExpandedAnalysis] = useState<number | null>(null);
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="🎬" title="Video Library" subtitle="Match footage, practice clips, analysis, and walk-ons." />

      <div className="flex gap-1 bg-[#0d0f1a] border border-gray-800 rounded-lg p-1 w-fit">
        {([['match', 'Match footage'], ['practice', 'Practice'], ['analysis', 'Analysis'], ['walkons', 'Walk-ons']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setVideoTab(id)} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${videoTab === id ? 'bg-red-600/20 text-red-400 border border-red-600/30' : 'text-gray-500 hover:text-gray-300'}`}>{label}</button>
        ))}
      </div>

      {videoTab === 'match' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Euro Ch. QF vs Clayton', date: 'Apr 10', dur: '38 min', note: 'Avg 101.4 · 6-3 win' },
            { title: 'German Masters SF vs Littler', date: 'Apr 3', dur: '52 min', note: 'Avg 94.1 · 3-6 loss' },
            { title: 'World Ch. R2 vs Smith', date: 'Jan 8', dur: '44 min', note: 'Avg 97.8 · 6-4 loss' },
            { title: 'Players Ch. vs Price', date: 'Mar 28', dur: '31 min', note: 'Avg 96.2 · 4-6 loss' },
          ].map((v, i) => (
            <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
              <div className="h-28 flex items-center justify-center text-4xl" style={{ background: 'linear-gradient(135deg, rgba(185,28,28,0.15) 0%, rgba(234,88,12,0.1) 100%)' }}>🎬</div>
              <div className="p-4">
                <div className="text-sm text-white font-medium mb-1">{v.title}</div>
                <div className="flex items-center gap-3 text-xs text-gray-500"><span>{v.date}</span><span>{v.dur}</span></div>
                <div className="text-xs text-gray-400 mt-1">{v.note}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {videoTab === 'practice' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Doubles clinic Apr 13', dur: '22 min' },
            { title: 'Checkout practice Apr 10', dur: '18 min' },
          ].map((v, i) => (
            <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
              <div className="h-28 flex items-center justify-center text-4xl" style={{ background: 'linear-gradient(135deg, rgba(185,28,28,0.15) 0%, rgba(234,88,12,0.1) 100%)' }}>📋</div>
              <div className="p-4"><div className="text-sm text-white font-medium mb-1">{v.title}</div><div className="text-xs text-gray-500">{v.dur}</div></div>
            </div>
          ))}
        </div>
      )}

      {videoTab === 'analysis' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-600/30 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center"><span className="text-xs font-bold text-red-400">DC</span></div>
                <div><div className="text-white font-bold">Dartboard Camera Analysis</div><div className="text-xs text-gray-400">AI-powered throwing analysis</div><div className="text-xs text-red-400 mt-0.5">Not connected</div></div>
              </div>
              <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30">Connect Camera</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'vs Clayton QF: Throwing arc analysis', stat: '94% consistent release angle' },
              { title: 'Doubles routine: D20 dwell time', stat: 'avg 16.2 seconds (optimal range)' },
              { title: 'Practice session Apr 13: Stance drift detected', stat: 'left foot moving 2cm' },
            ].map((a, i) => (
              <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
                <div className="h-20 flex items-center justify-center text-3xl relative" style={{ background: 'linear-gradient(135deg, rgba(185,28,28,0.15) 0%, rgba(234,88,12,0.1) 100%)' }}>
                  🎯<span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded bg-red-600/30 text-red-300 border border-red-500/30 font-medium">Camera AI</span>
                </div>
                <div className="p-4">
                  <div className="text-sm text-white font-medium mb-1">{a.title}</div>
                  <div className="text-xs text-gray-400">{a.stat}</div>
                  <button onClick={() => setExpandedAnalysis(expandedAnalysis === i ? null : i)} className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-600/20 text-teal-400 border border-teal-600/30 hover:bg-teal-600/30 transition-colors">{expandedAnalysis === i ? 'Hide' : 'View Analysis'}</button>
                  {expandedAnalysis === i && <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-400">Detailed analysis would appear here when camera system is connected.</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {videoTab === 'walkons' && (
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-3">Walk-On Music</div>
          <div className="text-lg text-white font-bold mb-1">Enter Sandman — Metallica</div>
          <div className="text-xs text-gray-500">Used since PDC debut (2019). Crowd favourite at Ally Pally.</div>
        </div>
      )}
    </div>
  );
}

// ─── TEAM HUB VIEW ────────────────────────────────────────────────────────────
function TeamHubView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const team = [
    { name: 'Jake Morrison', role: 'Player', contact: 'jake@jakemorrison.com', detail: 'Tour player since 2019' },
    { name: 'Dave Harris', role: 'Manager', contact: 'dave@dhsports.com', detail: 'DH Sports Management' },
    { name: 'Phil "The Coach"', role: 'Practice Coach', contact: 'Freelance', detail: '3x sessions/week' },
    { name: 'Dr. Sarah Reed', role: 'Sports Psychologist', contact: 'dreed@mindgolf.com', detail: 'Monthly sessions' },
    { name: 'Tom Wilkins', role: 'Physio', contact: 'tom@sportsphysio.com', detail: 'On-call' },
  ];
  const comms = [
    { msg: 'Match prep complete — Price analysis sent to Jake. Good luck tonight!', from: 'Dave', time: '2h ago' },
    { msg: 'Shoulder feeling much better after this morning\'s session.', from: 'Jake', time: '4h ago' },
    { msg: 'Red Dragon confirmed the barrel review shoot at 14:00 today.', from: 'Dave', time: '5h ago' },
    { msg: 'Mental prep session scheduled for 11:30 before travel.', from: 'Dr. Reed', time: 'Yesterday' },
    { msg: 'New 24g barrels arrived — try them in practice today.', from: 'Tom', time: 'Yesterday' },
  ];
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="👥" title="Team Hub" subtitle="Team members and communication feed." />
      <div className="space-y-3">
        {team.map((t, i) => (
          <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-lg">👤</div>
            <div className="flex-1"><div className="text-sm text-white font-medium">{t.name}</div><div className="text-xs text-gray-500">{t.role} · {t.detail}</div></div>
            <div className="text-xs text-gray-500">{t.contact}</div>
          </div>
        ))}
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Team Feed</div>
        <div className="space-y-3">
          {comms.map((c, i) => (
            <div key={i} className="py-2 border-b border-gray-800/50">
              <div className="text-sm text-gray-300">{c.msg}</div>
              <div className="text-xs text-gray-600 mt-1">— {c.from}, {c.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MENTAL PERFORMANCE VIEW ──────────────────────────────────────────────────
function MentalPerformanceView({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="🧠" title="Mental Performance" subtitle="Pre-match routines, pressure data, and psychology sessions." />

      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/20 border border-purple-600/30 rounded-xl p-5 text-center">
        <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-1">Readiness Score Today</div>
        <div className="text-4xl font-bold text-white">82<span className="text-lg text-gray-400">/100</span></div>
        <div className="text-xs text-teal-400 mt-1">Good — optimal for competition</div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Pre-Match Routine</div>
        <div className="space-y-2">
          {[
            { time: '60 min before', task: 'Arrive, find quiet space' },
            { time: '45 min before', task: 'Warm-up throws (not competitive, just feel)' },
            { time: '30 min before', task: 'Dr. Reed breathing protocol' },
            { time: '15 min before', task: 'Walk-on music, visualisation' },
            { time: 'Walk-on', task: 'Enter Sandman — full crowd immersion' },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-red-400 font-medium w-24">{r.time}</span>
              <span className="text-sm text-gray-300">{r.task}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Pressure Situations Tracker</div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Match darts hit', value: '38.4%' },
            { label: 'Break of throw', value: '52.1%' },
            { label: 'Leg-5 deciding', value: '61%' },
          ].map((s, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3 text-center">
              <div className="text-white font-bold text-lg">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Dr. Reed — Recent Sessions</div>
        <div className="space-y-2">
          {[
            { date: 'Apr 11', note: 'Pre-match visualisation for Price. Focus on own process, not scoreboard.' },
            { date: 'Mar 20', note: 'Reviewed German Masters loss vs Littler. Reset confidence after 3-6.' },
            { date: 'Feb 14', note: 'Performance anxiety under lights — crowd management techniques.' },
          ].map((s, i) => (
            <div key={i} className="py-2 border-b border-gray-800/50">
              <div className="text-xs text-red-400 font-medium">{s.date}</div>
              <div className="text-sm text-gray-400 mt-0.5">{s.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SPONSORSHIP VIEW ─────────────────────────────────────────────────────────
function SponsorshipView({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="🤝" title="Sponsorship & Commercial" subtitle="Active deals, obligations, pipeline, and content calendar." />

      {/* Active Sponsors */}
      {[
        { name: 'Red Dragon Darts', value: '£48,000/yr', renewal: '23 days remaining', renewalUrgent: true, obligations: 'Barrel use (required), 2 social posts/month, 4 content videos/yr', contentDue: 'Barrel review video (today 14:00) — SCHEDULED', nextPayment: 'May 1 (£4,000)', contact: 'Sarah Mills — sarah@reddragon.com' },
        { name: 'Ladbrokes', value: '£24,000/yr', renewal: '8 months', renewalUrgent: false, obligations: 'Odds graphic shares (PDC events), 1 interview/quarter', contentDue: 'Post-match interview tonight (if Jake wins)', nextPayment: 'Jun 1 (£6,000)', contact: 'Ben Clarke — ben@ladbrokes.com' },
      ].map((s, i) => (
        <div key={i} className={`bg-[#0d0f1a] border ${s.renewalUrgent ? 'border-red-600/30' : 'border-gray-800'} rounded-xl p-5`}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-white font-bold">{s.name}</div>
            <div className="text-sm text-gray-300">{s.value}</div>
          </div>
          <div className={`text-xs mb-3 ${s.renewalUrgent ? 'text-red-400 font-medium' : 'text-gray-500'}`}>Renewal: {s.renewal} {s.renewalUrgent && '— RED ALERT'}</div>
          <div className="space-y-1 text-xs text-gray-400">
            <div>Obligations: {s.obligations}</div>
            <div>Content due: {s.contentDue}</div>
            <div>Next payment: {s.nextPayment}</div>
            <div className="text-gray-500">Contact: {s.contact}</div>
          </div>
        </div>
      ))}

      {/* Pipeline */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Pipeline</div>
        <div className="space-y-3">
          {[
            { name: 'Unicorn Darts', detail: 'Approached Jake\'s manager in March. Offer pending: £35k/yr barrel + accessories deal' },
            { name: 'Flutter/Betfair', detail: 'Pre-match stats partnership — £8k/event for 4 major TV events. Under review.' },
          ].map((p, i) => (
            <div key={i} className="py-2 border-b border-gray-800/50">
              <div className="text-sm text-white font-medium">{p.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{p.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Calendar */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Content Calendar This Month</div>
        <div className="space-y-2">
          {[
            { week: 'Week 1', content: 'Red Dragon barrel review', status: 'TODAY ✓ scheduled' },
            { week: 'Week 2', content: 'Behind-the-scenes European Championship', status: 'pending' },
            { week: 'Week 3', content: 'Practice routine walkthrough — YouTube', status: 'planned' },
            { week: 'Week 4', content: 'Ladbrokes odds reaction video', status: 'planned' },
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-gray-500 w-16">{c.week}</span>
              <span className="text-sm text-gray-300 flex-1">{c.content}</span>
              <span className={`text-xs ${c.status.includes('TODAY') ? 'text-teal-400' : 'text-gray-500'}`}>{c.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── EXHIBITION MANAGER VIEW ──────────────────────────────────────────────────
function ExhibitionManagerView({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="🎪" title="Exhibition Manager" subtitle="Bookings, fees, and exhibition performance." />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="This Season" value="34" sub="Exhibitions" color="red" />
        <StatCard label="Earned" value="£68,400" sub="Exhibition income" color="teal" />
        <StatCard label="Avg Fee" value="£2,012" color="orange" />
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Upcoming Exhibitions</div>
        <div className="space-y-3">
          {[
            { date: 'Apr 22', venue: 'Preston Social Club', loc: 'Preston', fee: '£1,800', status: 'Enquiry', note: 'Respond by Apr 18' },
            { date: 'Apr 28', venue: 'Sheffield Sports Bar', loc: 'Sheffield', fee: '£2,200', status: 'Confirmed' },
            { date: 'May 3', venue: 'Edinburgh Darts Festival', loc: 'Edinburgh', fee: '£3,500', status: 'Confirmed' },
            { date: 'May 10', venue: 'Manchester Corporate Event', loc: 'Manchester', fee: '£4,000', status: 'Confirmed' },
            { date: 'May 18', venue: 'Dublin Darts Night', loc: 'Dublin', fee: '£2,800', status: 'Pending contract' },
          ].map((e, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div><div className="text-sm text-white font-medium">{e.venue}</div><div className="text-xs text-gray-500">{e.loc} · {e.date}</div></div>
                <div className="text-right"><div className="text-sm text-white font-medium">{e.fee}</div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${e.status === 'Confirmed' ? 'bg-teal-600/20 text-teal-400' : e.status === 'Enquiry' ? 'bg-amber-600/20 text-amber-400' : 'bg-gray-600/20 text-gray-400'}`}>{e.status}</span>
                </div>
              </div>
              {e.note && <div className="text-xs text-amber-400">{e.note}</div>}
              <div className="flex gap-2 mt-2">
                <button className="px-3 py-1 rounded text-xs bg-teal-600/20 text-teal-400 border border-teal-600/30">Confirm</button>
                <button className="px-3 py-1 rounded text-xs bg-red-600/20 text-red-400 border border-red-600/30">Decline</button>
                <button className="px-3 py-1 rounded text-xs text-gray-500 hover:text-gray-300">More Info</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fee Guide */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Fee Calculator Guide</div>
        <div className="space-y-1">
          {[
            { type: 'Standard league club (local)', fee: '£1,500' },
            { type: 'Social club (100+ miles)', fee: '£2,000–£2,500' },
            { type: 'Corporate event', fee: '£3,500–£6,000' },
            { type: 'Festival/major venue', fee: '£4,000–£8,000' },
            { type: 'International', fee: '£5,000+ + flights + hotel' },
          ].map((f, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 text-xs">
              <span className="text-gray-400">{f.type}</span><span className="text-gray-200 font-medium">{f.fee}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Past Exhibitions */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Past Exhibitions — 2025</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { month: 'Jan', count: 6, earned: '£11,400' }, { month: 'Feb', count: 8, earned: '£16,200' },
            { month: 'Mar', count: 11, earned: '£23,400' }, { month: 'Apr', count: 9, earned: '£17,400' },
          ].map((m, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500">{m.month}</div>
              <div className="text-white font-bold">{m.count}</div>
              <div className="text-xs text-teal-400">{m.earned}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MEDIA CONTENT VIEW ───────────────────────────────────────────────────────
function MediaContentView({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="📱" title="Media & Content" subtitle="Obligations, social stats, content pipeline, and press coverage." />

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Upcoming Media Obligations</div>
        <div className="space-y-2">
          {[
            { date: 'TODAY', item: 'Red Dragon barrel review video (14:00) — YouTube' },
            { date: 'Tonight', item: 'Ladbrokes post-match interview (if wins)' },
            { date: 'Apr 18', item: 'Sky Sports preview piece submission' },
            { date: 'Apr 22', item: 'PDC player profile update' },
            { date: 'Apr 28', item: 'Red Dragon social post (Prague Open week)' },
          ].map((o, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50">
              <span className={`text-xs font-medium w-16 ${o.date === 'TODAY' || o.date === 'Tonight' ? 'text-red-400' : 'text-gray-500'}`}>{o.date}</span>
              <span className="text-sm text-gray-300">{o.item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Twitter/X" value="84K" sub="Followers" color="blue" />
        <StatCard label="Instagram" value="62K" sub="Followers" color="purple" />
        <StatCard label="TikTok" value="31K" sub="Followers" color="red" />
        <StatCard label="YouTube" value="18K" sub="Subscribers" color="orange" />
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Content Pipeline</div>
        <div className="space-y-3">
          {[
            { title: 'Behind the scenes: European Championship', status: 'In progress', due: 'Apr 26' },
            { title: 'My dart setup explained — Red Dragon collab', status: 'Scheduled', due: 'TODAY 14:00' },
            { title: 'Practice routine walkthrough', status: 'Planned', due: 'May 1' },
            { title: 'Tournament life vlog — Dortmund', status: 'Filming tonight', due: '' },
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50">
              <div className="flex-1"><div className="text-sm text-gray-200">{c.title}</div></div>
              <span className={`text-xs px-2 py-0.5 rounded ${c.status === 'Scheduled' || c.status === 'Filming tonight' ? 'bg-teal-600/20 text-teal-400' : c.status === 'In progress' ? 'bg-amber-600/20 text-amber-400' : 'bg-gray-600/20 text-gray-400'}`}>{c.status}</span>
              {c.due && <span className="text-xs text-gray-500 ml-3">{c.due}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Press Coverage</div>
        <div className="space-y-2">
          {[
            { headline: 'Morrison targets top 16 with strong European Tour form', source: 'DartsNews.com', date: 'Apr 12' },
            { headline: 'The Hammer\'s rise: How Jake Morrison became a PDC contender', source: 'Sky Sports', date: 'Mar 28' },
            { headline: 'Morrison signs extended Red Dragon deal amid Premier League push', source: 'DartsWorld', date: 'Feb 15' },
          ].map((a, i) => (
            <div key={i} className="py-2 border-b border-gray-800/50">
              <div className="text-sm text-gray-200">{a.headline}</div>
              <div className="text-xs text-gray-500 mt-0.5">{a.source} · {a.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FINANCIAL DASHBOARD VIEW ─────────────────────────────────────────────────
function FinancialDashboardView({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="💰" title="Financial Dashboard" subtitle="Earnings, expenses, and career financial summary." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Prize Money" value="£124,800" sub="YTD" color="red" />
        <StatCard label="Sponsorship" value="£36,000" sub="Q1 payments" color="purple" />
        <StatCard label="Exhibitions" value="£68,400" sub="34 events" color="teal" />
        <StatCard label="Total Gross" value="£229,200" sub="2025 YTD" color="orange" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-3">Income Breakdown</div>
          <div className="space-y-2">
            {[
              { label: 'Prize money', value: '£124,800' }, { label: 'Sponsorship', value: '£36,000' },
              { label: 'Exhibitions', value: '£68,400' }, { label: 'Total gross', value: '£229,200' },
              { label: 'Tax (40%)', value: '-£91,680' }, { label: 'Net', value: '£137,520' },
            ].map((r, i) => (
              <div key={i} className={`flex items-center justify-between py-1.5 ${i < 5 ? 'border-b border-gray-800/50' : ''}`}>
                <span className={`text-sm ${i === 5 ? 'text-white font-bold' : i === 4 ? 'text-red-400' : 'text-gray-400'}`}>{r.label}</span>
                <span className={`text-sm ${i === 5 ? 'text-teal-400 font-bold' : i === 4 ? 'text-red-400' : 'text-gray-200'}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-3">Expenses</div>
          <div className="space-y-2">
            {[
              { label: 'Travel & accommodation', value: '£28,400' }, { label: 'Physio & medical', value: '£4,200' },
              { label: 'Coaching fees', value: '£6,000' }, { label: 'Equipment', value: '£1,800' },
              { label: 'Manager commission (15%)', value: '£34,380' }, { label: 'Total expenses', value: '£74,780' },
            ].map((r, i) => (
              <div key={i} className={`flex items-center justify-between py-1.5 ${i < 5 ? 'border-b border-gray-800/50' : ''}`}>
                <span className={`text-sm ${i === 5 ? 'text-white font-bold' : 'text-gray-400'}`}>{r.label}</span>
                <span className={`text-sm ${i === 5 ? 'text-red-400 font-bold' : 'text-gray-200'}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Prize Money Pending</div>
        <div className="space-y-1 text-xs text-gray-400">
          <div className="py-1.5 border-b border-gray-800/50">Players Ch. April event: £4,200 — <span className="text-amber-400">PDC payment pending 30 days</span></div>
          <div className="py-1.5">European Tour Prague: TBC — based on result</div>
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Career Earnings by Year</div>
        <div className="flex items-end gap-3 h-32">
          {[
            { year: '2021', amount: 48200 }, { year: '2022', amount: 89400 }, { year: '2023', amount: 142800 },
            { year: '2024', amount: 183200 }, { year: '2025', amount: 229200 },
          ].map((y, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-xs text-gray-400">£{(y.amount / 1000).toFixed(0)}k</div>
              <div className="w-full bg-red-600/40 rounded-t" style={{ height: `${(y.amount / 230000) * 80}px` }}></div>
              <div className="text-xs text-gray-600">{y.year}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AGENT PIPELINE VIEW ──────────────────────────────────────────────────────
function AgentPipelineView({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="📬" title="Agent Pipeline" subtitle="Deal flow, negotiations, and agent activity." />

      <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-600/30 rounded-xl p-5">
        <div className="text-white font-bold">Dave Harris — DH Sports Management</div>
        <div className="text-xs text-gray-400 mt-1">15% commission · Active deals: Red Dragon (£48k), Ladbrokes (£24k)</div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Pipeline Deals</div>
        <div className="space-y-3">
          {[
            { name: 'Unicorn Darts', stage: 'Offer stage', value: '£35k/yr', note: 'Counter-offer sent Apr 10' },
            { name: 'Flutter/Betfair', stage: 'Negotiation', value: '£8k/event', note: 'Legal review in progress' },
            { name: 'Beer brand (unnamed)', stage: 'Initial contact', value: 'TBC', note: 'Dave meeting reps Apr 20' },
            { name: 'Gym/fitness brand', stage: 'Prospecting', value: 'TBC', note: 'Approached via Instagram DM' },
          ].map((d, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-white font-medium">{d.name}</div>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-600/20 text-amber-400 border border-amber-600/30">{d.stage}</span>
              </div>
              <div className="text-xs text-gray-400">{d.value} · {d.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Recent Agent Activity</div>
        <div className="space-y-2">
          {[
            { date: 'Apr 14', activity: 'Dave submitted counter-offer to Unicorn — awaiting response' },
            { date: 'Apr 12', activity: 'Jake approved Flutter NDA for signing' },
            { date: 'Apr 10', activity: 'Dave confirmed Edinburgh exhibition fee (£3,500)' },
            { date: 'Apr 8', activity: 'Red Dragon renewal meeting scheduled for May 2' },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-red-400 font-medium w-14">{a.date}</span>
              <span className="text-xs text-gray-400">{a.activity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TRAVEL LOGISTICS VIEW ────────────────────────────────────────────────────
function TravelLogisticsView({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="✈️" title="Travel & Logistics" subtitle="Flights, hotels, and travel planning." />

      <div className="bg-gradient-to-r from-blue-900/30 to-teal-900/20 border border-blue-600/30 rounded-xl p-5">
        <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-2">TODAY&apos;S TRAVEL</div>
        <div className="text-white font-bold text-lg">BA1234 · London Heathrow → Dortmund</div>
        <div className="text-sm text-gray-400">16:30 departure · Terminal 5 · Gate TBC (check 3h before)</div>
        <div className="text-sm text-gray-400 mt-1">Hotel: Pullman Dortmund · Confirmation: PDC2025-JAK19</div>
        <div className="text-sm text-gray-400 mt-1">PDC tournament transport: Coach pickup from hotel 18:00</div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">This Month&apos;s Travel</div>
        <div className="space-y-2">
          {[
            { date: 'Apr 14', route: 'London → Dortmund', reason: 'European Ch.' },
            { date: 'Apr 17', route: 'Dortmund → London', reason: 'After European Ch.' },
            { date: 'Apr 22', route: 'London → Preston', reason: 'Exhibition (drive)' },
            { date: 'Apr 28', route: 'London → Prague', reason: 'European Tour' },
            { date: 'May 1', route: 'Prague → London', reason: '' },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-blue-400 font-medium w-14">{t.date}</span>
              <span className="text-sm text-gray-200 flex-1">{t.route}</span>
              <span className="text-xs text-gray-500">{t.reason}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Flights" value="18" sub="This season" color="blue" />
        <StatCard label="Countries" value="9" sub="Visited" color="teal" />
        <StatCard label="Hotel Nights" value="47" color="orange" />
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Visa & Entry Requirements</div>
        <div className="space-y-2 text-xs text-gray-400">
          <div className="py-1.5 border-b border-gray-800/50">EU events: No visa required (GBR passport)</div>
          <div className="py-1.5 border-b border-gray-800/50">Australia (World Series, Nov): ETA required — apply 6 weeks before</div>
          <div className="py-1.5">USA (Las Vegas, Dec): ESTA required — apply 72h before</div>
        </div>
      </div>
    </div>
  );
}

// ─── TOUR CARD & Q-SCHOOL VIEW ────────────────────────────────────────────────
function TourCardQSchoolView({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="🏛️" title="Tour Card & Q-School Status" subtitle="PDC Tour Card, Q-School history, and European Tour status." />

      <div className="bg-gradient-to-r from-teal-900/30 to-green-900/20 border border-teal-600/30 rounded-xl p-5">
        <div className="text-xs text-teal-400 font-semibold uppercase tracking-wider mb-2">TOUR CARD STATUS</div>
        <div className="text-white font-bold text-lg">PDC Tour Card — Secured via Order of Merit (top 64)</div>
        <div className="text-sm text-gray-400 mt-1">Valid through Dec 2026 · Current: #19 — SECURE (45 places above cut)</div>
        <div className="text-xs text-gray-500 mt-1">Projected year-end: #17–22 (based on current form)</div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Tour Card History</div>
        <div className="space-y-2">
          {[
            { year: '2019', note: 'Q-School — won card on Day 3' },
            { year: '2020', note: 'Retained — #41 Order of Merit' },
            { year: '2021', note: 'Retained — #33 Order of Merit' },
            { year: '2022', note: 'Retained — #28 Order of Merit' },
            { year: '2023', note: 'Retained — #21 Order of Merit' },
            { year: '2024', note: 'Retained — #19 Order of Merit (career best)' },
          ].map((h, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-red-400 font-medium w-10">{h.year}</span>
              <span className="text-sm text-gray-300">{h.note}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Q-School Info (Reference)</div>
        <div className="text-xs text-gray-400 space-y-1">
          <div>Next Q-School: January 2026 · Wigan (UK) / Hildesheim (EU)</div>
          <div>Format: 4 days, last 2 days are PDC Challenge Tour events</div>
          <div>Cards awarded: 32 (16 UK + 16 EU tour)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-2">European Tour Card</div>
          <div className="text-xs text-teal-400 mb-1">Retained — #18 European Tour ranking</div>
          <div className="text-xs text-gray-500">Must finish top 24 to retain</div>
        </div>
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-2">Challenge Tour Performance</div>
          <div className="text-xs text-gray-400">CT9: R2 (£500) · CT10: QF (£1,000) · CT11: DNP · CT12: SF (£2,000)</div>
        </div>
      </div>
    </div>
  );
}

// ─── EQUIPMENT SETUP VIEW ─────────────────────────────────────────────────────
function EquipmentSetupView({ player: _player }: { player: DartsPlayer }) {
  const [activeSetup, setActiveSetup] = useState(0);
  const [tab, setTab] = useState<'specs' | 'performance' | 'changes' | 'compare'>('specs');

  const setups = [
    {
      id: 'tournament',
      name: 'Tournament — The Hammer SE',
      isActive: true,
      isTournament: true,
      isSponsored: true,
      sponsorName: 'Red Dragon Darts',
      contentRequired: true,
      playerRating: 9,
      matchesPlayed: 47,
      avgWithSetup: 97.8,
      checkoutPct: 42.3,
      dateIntroduced: 'Mar 2024',
      notes: 'Primary tournament setup. All PDC televised events and Euro Tour.',
      barrel: { brand: 'Red Dragon', model: 'Morrison "The Hammer" SE', weight: 24.0, material: '97% Tungsten', shape: 'Torpedo', grip: 'Micro', lengthMm: 52.0, diameterMm: 6.4, productCode: 'RD3879' as string | null },
      shaft: { brand: 'Red Dragon', model: 'Nitrotech Titanium', length: 'Medium', lengthMm: 41.0, material: 'Titanium', angle: 'Straight', colour: 'Gunmetal' },
      flight: { brand: 'Red Dragon', shape: 'Standard', material: 'Heavy duty', thicknessMicron: 150, colour: 'Black/Red', design: 'The Hammer signature' },
      point: { type: 'Steel tip', length: 'Medium (36mm)', style: 'Smooth' },
    },
    {
      id: 'practice',
      name: 'Practice setup',
      isActive: true,
      isTournament: false,
      isSponsored: true,
      sponsorName: 'Red Dragon Darts',
      contentRequired: false,
      playerRating: 8,
      matchesPlayed: 0,
      avgWithSetup: 99.3,
      checkoutPct: 44.1,
      dateIntroduced: 'Jan 2024',
      notes: '2g lighter than tournament setup. Slim flights for tighter T20 grouping. Doubles practice only.',
      barrel: { brand: 'Red Dragon', model: 'Morrison Practice Edition', weight: 22.0, material: '90% Tungsten', shape: 'Straight', grip: 'Ringed', lengthMm: 48.0, diameterMm: 6.2, productCode: null as string | null },
      shaft: { brand: 'Condor', model: 'Standard', length: 'Short', lengthMm: 34.0, material: 'Polycarbonate', angle: 'Straight', colour: 'Black' },
      flight: { brand: 'Winmau', shape: 'Slim', material: 'Standard polyester', thicknessMicron: 100, colour: 'Black', design: 'Plain' },
      point: { type: 'Steel tip', length: 'Medium (36mm)', style: 'Smooth' },
    },
    {
      id: 'backup',
      name: 'Backup v1 (retired)',
      isActive: false,
      isTournament: true,
      isSponsored: true,
      sponsorName: 'Red Dragon Darts',
      contentRequired: false,
      playerRating: 7,
      matchesPlayed: 32,
      avgWithSetup: 96.1,
      checkoutPct: 40.8,
      dateIntroduced: 'Sep 2023',
      notes: 'Retired Mar 2024. Knurled grip caused T20 pull-left under pressure. Kept as emergency backup.',
      barrel: { brand: 'Red Dragon', model: 'Morrison "The Hammer" v1', weight: 24.0, material: '95% Tungsten', shape: 'Torpedo', grip: 'Knurled', lengthMm: 51.0, diameterMm: 6.5, productCode: 'RD3712' as string | null },
      shaft: { brand: 'Red Dragon', model: 'Standard', length: 'Medium', lengthMm: 41.0, material: 'Nylon', angle: 'Straight', colour: 'Black' },
      flight: { brand: 'Red Dragon', shape: 'Standard', material: 'Heavy duty', thicknessMicron: 150, colour: 'Black', design: 'Plain' },
      point: { type: 'Steel tip', length: 'Medium (36mm)', style: 'Smooth' },
    },
  ];

  const changes = [
    { date: 'Mar 2024', description: 'Switched from v1 (knurled) to SE (micro grip) barrel', avgBefore: 96.1, avgAfter: 97.8, reason: 'Micro grip reduces T20 pull-left under pressure. Recommended by Marco after pressure analysis.' },
    { date: 'Jun 2024', description: 'Switched shaft from nylon to titanium (Nitrotech)', avgBefore: 97.1, avgAfter: 97.8, reason: 'Titanium eliminated shaft breakage at floor events. More consistent feel across long PC weekends.' },
  ];

  const current = setups[activeSetup];

  const specRow = (label: string, value: string | number | null | undefined) =>
    value != null ? (
      <div key={label} className="flex justify-between py-2 border-b border-white/5 last:border-0 text-sm">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-200 font-medium">{String(value)}</span>
      </div>
    ) : null;

  type Setup = typeof setups[0];
  const comparedSetups: Setup[] = [setups[0], setups[1]];
  const compareFields: [string, (s: Setup) => string][] = [
    ['Brand', s => s.barrel.brand],
    ['Model', s => s.barrel.model],
    ['Weight', s => `${s.barrel.weight}g`],
    ['Barrel shape', s => s.barrel.shape],
    ['Barrel grip', s => s.barrel.grip],
    ['Shaft material', s => s.shaft.material],
    ['Shaft length', s => `${s.shaft.length} (${s.shaft.lengthMm}mm)`],
    ['Flight shape', s => s.flight.shape],
    ['Flight thickness', s => `${s.flight.thicknessMicron}μm`],
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white">Equipment Setup</h1>
          <p className="text-gray-400 text-sm mt-1">Barrel · Shaft · Flight · Point · Performance tracking</p>
        </div>
        {current.isSponsored && (
          <div className="flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-gray-400">Sponsored by {current.sponsorName}</span>
            {current.contentRequired && (
              <span className="px-2 py-0.5 bg-amber-950/30 border border-amber-700/30 text-amber-400 rounded text-[10px]">Content due</span>
            )}
          </div>
        )}
      </div>

      {/* Setup selector */}
      <div className="flex gap-2 flex-wrap">
        {setups.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActiveSetup(i)}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${activeSetup === i ? 'bg-red-600/20 border-red-500/40 text-red-300' : 'bg-gray-900/40 border-white/5 text-gray-500 hover:text-gray-300'}`}
          >
            {s.name}
            {!s.isActive && <span className="ml-2 text-[10px] text-gray-600">retired</span>}
          </button>
        ))}
        <button className="px-4 py-2 rounded-xl border border-dashed border-white/10 text-gray-600 text-sm hover:text-gray-400 transition-colors">
          + Add setup
        </button>
      </div>

      {/* Performance strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Avg with setup', value: String(current.avgWithSetup), sub: `Since ${current.dateIntroduced}`, color: 'text-white' },
          { label: 'Checkout %', value: `${current.checkoutPct}%`, sub: '', color: 'text-white' },
          { label: 'Matches', value: current.matchesPlayed > 0 ? String(current.matchesPlayed) : 'Practice only', sub: '', color: 'text-white' },
          { label: 'Player rating', value: `${current.playerRating}/10`, sub: '', color: current.playerRating >= 9 ? 'text-green-400' : current.playerRating >= 7 ? 'text-amber-400' : 'text-red-400' },
        ].map((k, i) => (
          <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className={`text-2xl font-medium ${k.color}`}>{k.value}</p>
            {k.sub && <p className="text-xs text-gray-600 mt-1">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border border-white/5 overflow-hidden w-fit">
        {(['specs', 'performance', 'changes', 'compare'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-xs font-medium transition-colors border-r border-white/5 last:border-r-0 capitalize ${tab === t ? 'bg-red-600/20 text-red-300' : 'bg-gray-900/40 text-gray-500 hover:text-gray-300'}`}>
            {t === 'changes' ? 'Change log' : t}
          </button>
        ))}
      </div>

      {/* SPECS */}
      {tab === 'specs' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-red-400 uppercase tracking-wide bg-red-500/10 px-2 py-0.5 rounded">Barrel</span>
              <span className="text-xs text-gray-600">{current.barrel.weight}g · {current.barrel.lengthMm}mm</span>
            </div>
            {specRow('Brand', current.barrel.brand)}
            {specRow('Model', current.barrel.model)}
            {specRow('Weight', `${current.barrel.weight}g`)}
            {specRow('Material', current.barrel.material)}
            {specRow('Shape', current.barrel.shape)}
            {specRow('Grip', current.barrel.grip)}
            {specRow('Length', `${current.barrel.lengthMm}mm`)}
            {specRow('Diameter', `${current.barrel.diameterMm}mm`)}
            {current.barrel.productCode && specRow('Product code', current.barrel.productCode)}
          </div>

          <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-blue-400 uppercase tracking-wide bg-blue-500/10 px-2 py-0.5 rounded">Shaft</span>
              <span className="text-xs text-gray-600">{current.shaft.material} · {current.shaft.length}</span>
            </div>
            {specRow('Brand', current.shaft.brand)}
            {specRow('Model', current.shaft.model)}
            {specRow('Length', current.shaft.length)}
            {specRow('Length (mm)', `${current.shaft.lengthMm}mm`)}
            {specRow('Material', current.shaft.material)}
            {specRow('Angle', current.shaft.angle)}
            {specRow('Colour', current.shaft.colour)}
          </div>

          <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-amber-400 uppercase tracking-wide bg-amber-500/10 px-2 py-0.5 rounded">Flight</span>
              <span className="text-xs text-gray-600">{current.flight.shape} · {current.flight.thicknessMicron}μm</span>
            </div>
            {specRow('Brand', current.flight.brand)}
            {specRow('Shape', current.flight.shape)}
            {specRow('Material', current.flight.material)}
            {specRow('Thickness', `${current.flight.thicknessMicron} micron`)}
            {specRow('Colour', current.flight.colour)}
            {specRow('Design', current.flight.design)}
          </div>

          <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-green-400 uppercase tracking-wide bg-green-500/10 px-2 py-0.5 rounded">Point</span>
              <span className="text-xs text-gray-600">{current.point.type}</span>
            </div>
            {specRow('Type', current.point.type)}
            {specRow('Length', current.point.length)}
            {specRow('Style', current.point.style)}
            <div className="mt-4 pt-3 border-t border-white/5">
              <p className="text-xs text-gray-600 leading-relaxed">{current.notes}</p>
            </div>
          </div>
        </div>
      )}

      {/* PERFORMANCE */}
      {tab === 'performance' && (
        <div className="space-y-4">
          <h2 className="text-white font-medium">Performance comparison across setups</h2>
          <div className="rounded-xl border border-white/5 overflow-hidden">
            <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
              <span className="col-span-2">Setup</span>
              <span>Matches</span>
              <span>Average</span>
              <span>Checkout %</span>
            </div>
            {setups.map((s, i) => (
              <div key={i} className={`grid grid-cols-5 gap-2 px-4 py-3 border-t border-white/5 text-sm ${i === activeSetup ? 'bg-red-950/10' : ''}`}>
                <span className={`col-span-2 ${i === activeSetup ? 'text-red-300 font-medium' : 'text-gray-400'}`}>
                  {s.name}
                  {!s.isActive && <span className="text-gray-600 ml-1">(retired)</span>}
                </span>
                <span className="text-gray-400">{s.matchesPlayed || '—'}</span>
                <span className={i === activeSetup ? 'text-white font-medium' : 'text-gray-400'}>{s.avgWithSetup}</span>
                <span className={i === activeSetup ? 'text-white font-medium' : 'text-gray-400'}>{s.checkoutPct}%</span>
              </div>
            ))}
          </div>
          <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Coach notes</p>
            <p className="text-sm text-gray-300">
              &ldquo;The micro grip on the SE barrel has been the biggest positive change — Jake&apos;s T20 cluster tightened immediately after switching in March 2024. The titanium shaft gives a more consistent release point than nylon. Would not recommend changing anything before a major event.&rdquo;
            </p>
            <p className="text-xs text-gray-600 mt-2">— Marco · April 2025</p>
          </div>
        </div>
      )}

      {/* CHANGE LOG */}
      {tab === 'changes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-medium">Equipment change log</h2>
            <button className="px-3 py-1.5 bg-gray-800/60 border border-white/5 text-gray-400 text-xs rounded-lg hover:text-gray-200">+ Log change</button>
          </div>
          <div className="space-y-3">
            {changes.map((c, i) => (
              <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white text-sm font-medium">{c.description}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{c.date}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs flex-shrink-0 ml-4">
                    <span className="text-gray-500">{c.avgBefore}</span>
                    <span className="text-gray-600">→</span>
                    <span className={c.avgAfter > c.avgBefore ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                      {c.avgAfter} ({c.avgAfter > c.avgBefore ? '+' : ''}{(c.avgAfter - c.avgBefore).toFixed(1)})
                    </span>
                  </div>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">{c.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPARE */}
      {tab === 'compare' && (
        <div className="space-y-4">
          <h2 className="text-white font-medium">Tournament vs Practice — side by side</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide mb-3">Spec</p>
              {compareFields.map(([label]) => (
                <div key={label} className="py-2.5 border-b border-white/5 last:border-0 text-xs text-gray-500">{label}</div>
              ))}
            </div>
            {comparedSetups.map((s, si) => (
              <div key={si}>
                <p className={`text-xs uppercase tracking-wide mb-3 font-medium ${si === 0 ? 'text-red-400' : 'text-blue-400'}`}>
                  {si === 0 ? 'Tournament' : 'Practice'}
                </p>
                {compareFields.map(([label, getter]) => {
                  const val = getter(s);
                  const otherVal = getter(comparedSetups[si === 0 ? 1 : 0]);
                  const isDiff = val !== otherVal;
                  return (
                    <div key={label} className={`py-2.5 border-b border-white/5 last:border-0 text-xs ${isDiff ? (si === 0 ? 'text-red-300 font-medium' : 'text-blue-300 font-medium') : 'text-gray-400'}`}>
                      {val}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600">Highlighted values differ between setups · Red = tournament · Blue = practice</p>
        </div>
      )}

      {/* Sponsor content obligation strip */}
      {current.contentRequired && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-950/20 border border-amber-700/20 rounded-xl text-sm">
          <span className="text-amber-400">🤝</span>
          <span className="text-gray-300">
            <span className="font-medium">Red Dragon</span>
            <span className="text-gray-500"> requires content for this setup — barrel review video due today 16:00.</span>
          </span>
          <button className="ml-auto text-red-400 text-xs hover:text-red-300 whitespace-nowrap">→ Sponsorship</button>
        </div>
      )}
    </div>
  );
}

// ─── CAREER PLANNING VIEW ─────────────────────────────────────────────────────
function CareerPlanningView({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="🚀" title="Career Planning" subtitle="Short-term goals, medium-term strategy, and career timeline." />

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Short-Term Goals (This Season)</div>
        <div className="space-y-2">
          {[
            'Break into top 16 Order of Merit (target: +£94k)',
            'Win at least one major TV event (semi-finalist last year)',
            'Qualify for Premier League full season (currently night player)',
            'Retain European Tour card (top 24)',
          ].map((g, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-800/50 text-sm text-gray-300">
              <Target className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />{g}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Medium-Term (2–3 Years)</div>
        <div className="space-y-2">
          {[
            'Consistent top 10 PDC ranking',
            'PDC World Championship quarter-finalist or better',
            'Build exhibition network to 60+ events/year',
            'Grow social following to 150k combined',
          ].map((g, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-800/50 text-sm text-gray-300">
              <TrendingUp className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />{g}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Career Timeline</div>
        <div className="space-y-2">
          {[
            { year: '2019', event: 'Turned pro — won tour card at Q-School' },
            { year: '2020', event: 'Pro Tour breakthrough — first £50k season' },
            { year: '2021', event: 'First European Tour win (Prague)' },
            { year: '2022', event: 'World Championship debut — R2 loss vs MvG' },
            { year: '2023', event: 'Premier League debut (night player × 6)' },
            { year: '2024', event: 'Career high #12 ranking — World Matchplay QF' },
            { year: '2025', event: 'Targeting top 16 + Premier League full season' },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-red-400 font-bold w-10">{t.year}</span>
              <span className="text-sm text-gray-300">{t.event}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Post-Playing Career Options</div>
        <div className="space-y-2 text-sm text-gray-400">
          {[
            'PDC commentary / analysis (building media profile now)',
            'Darts academy / coaching (Phil coaching relationship)',
            'Red Dragon ambassador role (negotiate into contract)',
            'Exhibition circuit (already established — £68k this season)',
          ].map((o, i) => (
            <div key={i} className="py-1.5 border-b border-gray-800/50"><ChevronRight className="w-3 h-3 inline mr-1 text-gray-600" />{o}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DATA HUB VIEW ────────────────────────────────────────────────────────────
function DataHubView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [showDCConfirm, setShowDCConfirm] = useState(false);
  const [showIDConfirm, setShowIDConfirm] = useState(false);

  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="📡" title="Data & Analytics Hub" subtitle="Your connected data sources — powering your performance insights." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><div className="text-sm text-white font-semibold">PDC Official</div></div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-600/20 text-teal-400 border border-teal-600/30">Connected — live rankings</span>
          <div className="text-xs text-gray-400 mt-3 mb-3">Official PDC Order of Merit, tournament results, entry systems, and player profiles.</div>
          <div className="flex flex-wrap gap-1 mb-3">{['Order of Merit', 'Results', 'Entry deadlines', 'Player profiles'].map(t => <span key={t} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{t}</span>)}</div>
          <button onClick={() => window.open('https://www.pdc.tv', '_blank')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors">Open PDC.tv →</button>
        </div>
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><div className="text-sm text-white font-semibold">Darts Database</div></div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-600/20 text-teal-400 border border-teal-600/30">Connected — stats archive</span>
          <div className="text-xs text-gray-400 mt-3 mb-3">Comprehensive PDC/WDF results archive. H2H records, career statistics, and tournament history going back to 1994.</div>
          <div className="flex flex-wrap gap-1 mb-3">{['H2H Records', 'Career stats', 'Tournament history', 'Rankings archive'].map(t => <span key={t} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{t}</span>)}</div>
          <button onClick={() => window.open('https://www.dartsdatabase.co.uk', '_blank')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors">Browse Darts Database →</button>
        </div>
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><div className="text-sm text-white font-semibold">DartConnect</div></div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">Not connected</span>
          <div className="text-xs text-gray-400 mt-3 mb-3">Official PDC scoring platform. Connect to sync your live match scores and career statistics automatically.</div>
          <div className="flex flex-wrap gap-1 mb-3">{['Live match sync', 'Career stats', 'PDC event scoring'].map(t => <span key={t} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{t}</span>)}</div>
          {showDCConfirm ? <div className="text-xs text-teal-400 font-medium">Connection request sent to DartConnect ✓</div> : <button onClick={() => setShowDCConfirm(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors">Connect DartConnect ↗</button>}
        </div>
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><div className="text-sm text-white font-semibold">iDarts Stats</div></div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">Not connected</span>
          <div className="text-xs text-gray-400 mt-3 mb-3">The world&apos;s most comprehensive darts statistics database. Used by PDC commentators and analysts worldwide.</div>
          <div className="flex flex-wrap gap-1 mb-3">{['Deep player stats', 'Tournament data', 'API access'].map(t => <span key={t} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{t}</span>)}</div>
          {showIDConfirm ? <div className="text-xs text-teal-400 font-medium">Request sent — iDarts will contact you ✓</div> : <button onClick={() => setShowIDConfirm(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors">Request Access ↗</button>}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Data Sources</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { section: 'Order of Merit & Race', source: 'PDC Official' },
            { section: 'Tournament Schedule', source: 'PDC Official + Lumio' },
            { section: 'Three-Dart Average', source: 'Lumio analytics engine' },
            { section: 'Checkout Analysis', source: 'Lumio analytics engine' },
            { section: 'Opponent Intel', source: 'Darts Database + Lumio' },
            { section: 'Practice Log', source: 'Lumio (manual entry)' },
            { section: 'Match Reports', source: 'Claude AI (Anthropic)' },
            { section: 'Exhibition Manager', source: 'Lumio' },
            { section: 'Financial Dashboard', source: 'Lumio' },
          ].map((d, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-gray-500">{d.section}</span>
              <span className="text-xs text-red-400 font-medium">{d.source}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS VIEW ────────────────────────────────────────────────────────────
function SettingsView({ player, onNavigate }: { player: DartsPlayer; onNavigate: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="⚙️" title="Settings" subtitle="Profile, notifications, and preferences." />

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-white">Player Profile</div>
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30">Edit</button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {[
            { label: 'Name', value: player.name }, { label: 'Nickname', value: player.nickname },
            { label: 'PDC Rank', value: `#${player.pdcRank}` }, { label: 'Tour', value: 'PDC Professional' },
            { label: 'Plan', value: player.plan }, { label: 'Manager', value: player.manager },
            { label: 'Sponsor 1', value: player.sponsor1 }, { label: 'Sponsor 2', value: player.sponsor2 },
          ].map((f, i) => (
            <div key={i} className="py-2 border-b border-gray-800/50">
              <div className="text-gray-500 text-[10px] uppercase tracking-wider">{f.label}</div>
              <div className="text-gray-200 mt-0.5">{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Notification Preferences</div>
        <div className="space-y-3">
          {['Exhibition enquiries', 'Entry deadlines', 'Ranking changes', 'Match draws', 'Sponsor obligations'].map((n, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-sm text-gray-300">{n}</span>
              <div className="w-10 h-5 bg-teal-600/30 rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-teal-400 rounded-full absolute top-0.5 right-0.5"></div></div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-5">
        <div className="text-sm font-semibold text-red-400 mb-2">Danger Zone</div>
        <button className="px-4 py-2 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30">Reset to demo data</button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────
// ─── DartConnect Integration ──────────────────────────────────────────────────
function DartConnectView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [apiKey, setApiKey] = useState('');
  const [connected, setConnected] = useState(false);
  const sessions = [
    { date: '2025-04-06', type: 'Match', avg: 96.8, checkout: 44 },
    { date: '2025-04-05', type: 'Practice', avg: 99.1, checkout: 51 },
    { date: '2025-04-04', type: 'Practice', avg: 98.4, checkout: 49 },
    { date: '2025-04-03', type: 'Match', avg: 95.2, checkout: 38 },
    { date: '2025-04-02', type: 'Practice', avg: 100.3, checkout: 55 },
  ];
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">🔌 DartConnect</h1>
        <p className="text-xs text-gray-500">Sync match averages, checkout data and practice sessions automatically.</p>
      </div>

      {!connected && (
        <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-700/30 rounded-xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="text-2xl">🔌</div>
            <div>
              <div className="text-sm font-bold text-white mb-1">Connect your DartConnect account</div>
              <div className="text-xs text-gray-400">Sync match averages, checkout data and practice sessions automatically. Pulls every session from your DartConnect history into Lumio overnight.</div>
            </div>
          </div>
          <div className="flex gap-2">
            <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Paste your DartConnect API key" className="flex-1 bg-black/40 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-600/60" />
            <button onClick={() => apiKey && setConnected(true)} disabled={!apiKey} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${apiKey ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>Connect</button>
          </div>
        </div>
      )}

      {connected && (
        <>
          <div className="bg-teal-900/20 border border-teal-600/30 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle size={16} className="text-teal-400" />
            <div className="text-xs text-teal-300"><span className="font-semibold">Connected.</span> Last sync 3 minutes ago · 28 sessions imported this month.</div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Practice Avg" value="99.3" sub="Last 14 days" color="teal" />
            <StatCard label="Match Avg" value="97.0" sub="Last 14 days" color="red" />
            <StatCard label="Gap" value="+2.3" sub="Practice over match" color="orange" />
            <StatCard label="Sessions" value="28" sub="This month" color="purple" />
          </div>

          <div className="bg-gradient-to-r from-purple-900/30 to-red-900/20 border border-purple-700/30 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Brain size={20} className="text-purple-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-white mb-1">AI Insight — Practice vs Match Gap</div>
                <div className="text-xs text-gray-300 leading-relaxed">Your practice average is <span className="font-bold text-purple-300">2.3 points above</span> your match average. That&apos;s a meaningful gap — it&apos;s either nerves on the walk-on or a consistency issue in second-session legs. Suggestion: schedule a pressure-simulation session with your sports psychologist.</div>
              </div>
            </div>
          </div>

          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">Last 5 Sessions</div>
            <table className="w-full text-xs">
              <thead className="bg-black/30 text-gray-500">
                <tr><th className="text-left px-4 py-2 font-medium">Date</th><th className="text-left px-4 py-2 font-medium">Type</th><th className="text-right px-4 py-2 font-medium">3-Dart Avg</th><th className="text-right px-4 py-2 font-medium">Checkout %</th></tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={i} className="border-t border-gray-800/60">
                    <td className="px-4 py-2.5 text-gray-400">{s.date}</td>
                    <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${s.type === 'Match' ? 'bg-red-600/20 text-red-300' : 'bg-teal-600/20 text-teal-300'}`}>{s.type}</span></td>
                    <td className="px-4 py-2.5 text-right font-semibold text-white">{s.avg}</td>
                    <td className="px-4 py-2.5 text-right text-gray-300">{s.checkout}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── PDC Live Data ────────────────────────────────────────────────────────────
function PDCLiveView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const events = [
    { name: 'Players Ch. 23 (Wigan)',     date: '14 Apr', status: 'Entered',    earned: 2500,  hold: 2500,  gain: 5000 },
    { name: 'Players Ch. 24 (Wigan)',     date: '15 Apr', status: 'Entered',    earned: 10000, hold: 10000, gain: 12000 },
    { name: 'European Tour 5 (Hildesheim)', date: '18 Apr', status: 'Entered',    earned: 6000,  hold: 6000,  gain: 9000 },
    { name: 'Players Ch. 25 (Leicester)', date: '28 Apr', status: 'Entered',    earned: 4000,  hold: 4000,  gain: 7000 },
    { name: 'Players Ch. 26 (Leicester)', date: '29 Apr', status: 'Not entered', earned: 0,     hold: 1000,  gain: 2000 },
    { name: 'Premier League (Night 12)',  date: '01 May', status: 'Entered',    earned: 25000, hold: 25000, gain: 35000 },
    { name: 'Players Ch. 27 (Barnsley)',  date: '05 May', status: 'Entered',    earned: 15000, hold: 15000, gain: 25000 },
    { name: 'Players Ch. 28 (Barnsley)',  date: '06 May', status: 'Withdrew',    earned: 5000,  hold: 5000,  gain: 8000 },
  ];
  const totalDefending = events.reduce((s, e) => s + e.earned, 0);
  const next4Weeks = events.slice(0, 4).reduce((s, e) => s + e.earned, 0);
  const somGraph = [
    { period: '24mo ago', amount: 42000 }, { period: '20mo ago', amount: 68000 }, { period: '16mo ago', amount: 124000 },
    { period: '12mo ago', amount: 95000 }, { period: '8mo ago', amount: 142000 }, { period: '4mo ago', amount: 108000 },
    { period: 'Current',  amount: 108420 },
  ];
  const maxAmount = Math.max(...somGraph.map(g => g.amount));
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">📡 PDC Live Data</h1>
        <p className="text-xs text-gray-500">Live tournament ticker, defending money calculator and Order of Merit tracker.</p>
      </div>

      {/* Live ticker */}
      <div className="bg-gradient-to-r from-red-900/40 to-black border border-red-700/40 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Live Now</div>
          <div className="text-xs text-gray-400">PDC European Championship · Westfalenhalle, Dortmund</div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="bg-black/40 rounded-lg px-3 py-2"><span className="text-gray-500">R1 · </span><span className="text-white font-semibold">L. Humphries 6-3 R. Smith</span></div>
          <div className="bg-black/40 rounded-lg px-3 py-2"><span className="text-gray-500">R1 · </span><span className="text-white font-semibold">M. van Gerwen vs J. Henderson</span><span className="text-red-400 ml-2">LIVE 4-2</span></div>
          <div className="bg-black/40 rounded-lg px-3 py-2"><span className="text-gray-500">R1 · </span><span className="text-white font-semibold">G. Price vs J. Morrison</span><span className="text-gray-600 ml-2">20:00</span></div>
        </div>
      </div>

      {/* Defending money calculator — KEY FEATURE */}
      <div className="bg-[#0d0f1a] border border-orange-700/30 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 bg-gradient-to-r from-orange-900/30 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold text-white">💰 Defending Money Calculator</div>
            <div className="text-xs text-orange-400">Next 8 weeks</div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div><span className="text-gray-500">Total defending: </span><span className="text-orange-300 font-bold">£{totalDefending.toLocaleString()}</span></div>
            <div><span className="text-gray-500">Next 4 weeks: </span><span className="text-red-300 font-bold">£{next4Weeks.toLocaleString()}</span></div>
          </div>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-black/40 text-gray-500">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Event</th>
              <th className="text-left px-4 py-2 font-medium">Date</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-right px-4 py-2 font-medium">Earned Last Year</th>
              <th className="text-right px-4 py-2 font-medium">To Hold #19</th>
              <th className="text-right px-4 py-2 font-medium">To Gain 1 Place</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i} className="border-t border-gray-800/60">
                <td className="px-4 py-2.5 text-gray-300">{e.name}</td>
                <td className="px-4 py-2.5 text-gray-500">{e.date}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${e.status === 'Entered' ? 'bg-teal-600/20 text-teal-300' : e.status === 'Not entered' ? 'bg-gray-700/40 text-gray-400' : 'bg-red-600/20 text-red-300'}`}>{e.status}</span>
                </td>
                <td className="px-4 py-2.5 text-right text-orange-300 font-semibold">£{e.earned.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right text-red-300">£{e.hold.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right text-purple-300">£{e.gain.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 bg-gradient-to-r from-purple-900/30 to-transparent border-t border-gray-800">
          <div className="flex items-start gap-2">
            <Brain size={14} className="text-purple-400 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-300">You are defending <span className="text-orange-300 font-bold">£18,400</span> over the next 4 weeks. A <span className="text-teal-300 font-semibold">QF finish at PC27</span> would protect your current <span className="text-red-300 font-semibold">#19 ranking</span>.</div>
          </div>
        </div>
      </div>

      {/* Order of Merit tracker */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-bold text-white">Order of Merit</div>
            <div className="text-xs text-gray-500">Rolling 24-month prize money</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-orange-400">£687,420</div>
            <div className="text-[10px] text-gray-500">Current total · #19</div>
          </div>
        </div>
        <div className="flex items-end gap-2 h-28">
          {somGraph.map((g, i) => {
            const height = (g.amount / maxAmount) * 100;
            const isBig = g.amount > 120000;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[9px] text-gray-500 font-semibold">£{(g.amount / 1000).toFixed(0)}k</div>
                <div className="w-full rounded-t transition-all" style={{ height: `${height}%`, background: isBig ? 'linear-gradient(180deg, #DC2626, #7F1D1D)' : 'linear-gradient(180deg, #F97316, #9A3412)' }} />
                <div className="text-[9px] text-gray-600">{g.period}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-[10px] text-gray-500 italic">The red bars are big earnings that drop off the rolling 24-month window — plan your defence around them.</div>
      </div>

      {/* Tour Card security */}
      <div className="bg-gradient-to-r from-teal-900/30 to-black border border-teal-700/30 rounded-xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-teal-600/20 border border-teal-500/40 flex items-center justify-center shrink-0"><Shield size={22} className="text-teal-400" /></div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-sm font-bold text-white">Tour Card</div>
            <span className="px-2 py-0.5 bg-teal-600/20 text-teal-300 text-[10px] font-bold rounded uppercase">SECURE</span>
          </div>
          <div className="text-xs text-gray-400">You are <span className="text-teal-300 font-bold">£142,000 above</span> the #64 Tour Card cutoff. Q-School not required next January.</div>
        </div>
      </div>
    </div>
  );
}

// ─── Women's Darts ────────────────────────────────────────────────────────────
function WomensDartsView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const oom = [
    { rank: 1, name: 'Beau Greaves',    country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earnings: 68420, avg: 90.4 },
    { rank: 2, name: 'Fallon Sherrock', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earnings: 52800, avg: 86.2 },
    { rank: 3, name: 'Deta Hedman',     country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earnings: 38200, avg: 82.8 },
    { rank: 4, name: 'Lisa Ashton',     country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earnings: 34600, avg: 84.1 },
    { rank: 5, name: 'Mikuru Suzuki',   country: '🇯🇵',          earnings: 28400, avg: 81.9 },
    { rank: 6, name: 'Aileen de Graaf', country: '🇳🇱',          earnings: 24800, avg: 80.3 },
    { rank: 7, name: 'Noa-Lynn van Leuven', country: '🇳🇱',      earnings: 22100, avg: 83.0 },
    { rank: 8, name: 'Rhian Edwards',   country: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', earnings: 19600, avg: 79.5 },
    { rank: 9, name: 'Lorraine Winstanley', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earnings: 17200, avg: 78.8 },
    { rank: 10, name: 'Kirsty Hutchinson', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earnings: 14800, avg: 79.1 },
  ];
  const schedule = [
    { weekend: 'Weekend 1', dates: '12-13 Apr', venue: 'Wigan', events: 4, status: 'Completed' },
    { weekend: 'Weekend 2', dates: '17-18 May', venue: 'Gibraltar', events: 4, status: 'Upcoming' },
    { weekend: 'Weekend 3', dates: '14-15 Jun', venue: 'Hildesheim', events: 4, status: 'Upcoming' },
    { weekend: 'Weekend 4', dates: '12-13 Jul', venue: 'Leicester', events: 4, status: 'Upcoming' },
    { weekend: 'Weekend 5', dates: '13-14 Sep', venue: 'Barnsley', events: 4, status: 'Upcoming' },
    { weekend: 'Weekend 6', dates: '11-12 Oct', venue: 'Minehead', events: 4, status: 'Upcoming' },
  ];
  const prizePairs = [
    { event: 'Players Championship', men: 10000, women: 2500 },
    { event: 'European Tour event',  men: 25000, women: 6000 },
    { event: 'World Matchplay',      men: 200000, women: 25000 },
    { event: 'World Championship',   men: 500000, women: 50000 },
  ];
  const maxPrize = Math.max(...prizePairs.map(p => p.men));
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">⭐ Women&apos;s Darts</h1>
        <p className="text-xs text-gray-500">Women&apos;s Series, Order of Merit, Matchplay qualification and partnership planning.</p>
      </div>

      {/* Schedule */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <div className="text-sm font-bold text-white">PDC Women&apos;s Series 2025</div>
          <div className="text-[10px] text-gray-500">6 weekends · 4 events per weekend · 24 events total</div>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-black/30 text-gray-500">
            <tr><th className="text-left px-4 py-2 font-medium">Weekend</th><th className="text-left px-4 py-2 font-medium">Dates</th><th className="text-left px-4 py-2 font-medium">Venue</th><th className="text-right px-4 py-2 font-medium">Events</th><th className="text-right px-4 py-2 font-medium">Status</th></tr>
          </thead>
          <tbody>
            {schedule.map((w, i) => (
              <tr key={i} className="border-t border-gray-800/60">
                <td className="px-4 py-2.5 text-gray-300 font-semibold">{w.weekend}</td>
                <td className="px-4 py-2.5 text-gray-500">{w.dates}</td>
                <td className="px-4 py-2.5 text-gray-400">{w.venue}</td>
                <td className="px-4 py-2.5 text-right text-gray-300">{w.events}</td>
                <td className="px-4 py-2.5 text-right"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${w.status === 'Completed' ? 'bg-teal-600/20 text-teal-300' : 'bg-gray-700/40 text-gray-400'}`}>{w.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order of Merit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <div className="text-sm font-bold text-white">Women&apos;s Order of Merit — Top 10</div>
            <div className="text-[10px] text-gray-500">Rolling 12 months · GBP</div>
          </div>
          <div className="divide-y divide-gray-800/60">
            {oom.map(p => (
              <div key={p.rank} className="flex items-center gap-3 px-4 py-2.5">
                <div className={`text-xs font-black w-6 text-center ${p.rank <= 3 ? 'text-orange-400' : 'text-gray-500'}`}>#{p.rank}</div>
                <div className="text-sm shrink-0">{p.country}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{p.name}</div>
                  <div className="text-[10px] text-gray-500">Avg {p.avg}</div>
                </div>
                <div className="text-xs text-orange-300 font-bold">£{p.earnings.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Matchplay qualification */}
        <div className="space-y-4">
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-white">Women&apos;s World Matchplay</div>
              <span className="px-2 py-0.5 bg-red-600/20 text-red-300 text-[10px] font-bold rounded uppercase">Top 8 Qualify</span>
            </div>
            <div className="text-xs text-gray-400 mb-3">Qualification from the Women&apos;s Order of Merit — cutoff as of Weekend 6 (Minehead).</div>
            <div className="space-y-1.5">
              {oom.slice(0, 8).map(p => (
                <div key={p.rank} className="flex items-center gap-2 text-xs">
                  <div className={`w-5 text-center font-black ${p.rank <= 8 ? 'text-teal-400' : 'text-gray-600'}`}>#{p.rank}</div>
                  <div className="flex-1 text-gray-300">{p.name}</div>
                  <CheckCircle size={12} className="text-teal-400" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/20 border border-pink-700/30 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-xl">💜</div>
              <div>
                <div className="text-sm font-bold text-white mb-1">Support Women&apos;s Darts</div>
                <div className="text-xs text-gray-400">Join the PDPA women&apos;s tour membership — advocacy, development grants, and equal prize money campaigning.</div>
              </div>
            </div>
            <button className="w-full bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/40 text-pink-200 text-xs font-semibold px-4 py-2 rounded-lg transition-all">Join PDPA Women&apos;s Tour →</button>
          </div>
        </div>
      </div>

      {/* Prize money comparison */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-bold text-white">Prize Money — Winner&apos;s Cheque</div>
            <div className="text-[10px] text-gray-500">Men vs women per flagship event</div>
          </div>
        </div>
        <div className="space-y-3">
          {prizePairs.map((p, i) => (
            <div key={i}>
              <div className="flex justify-between items-center mb-1">
                <div className="text-xs text-gray-300 font-semibold">{p.event}</div>
                <div className="text-[10px] text-gray-500">£{p.men.toLocaleString()} / £{p.women.toLocaleString()}</div>
              </div>
              <div className="flex gap-1 h-5">
                <div className="rounded-sm bg-gradient-to-r from-red-700 to-red-500" style={{ width: `${(p.men / maxPrize) * 100}%` }} title={`Men: £${p.men.toLocaleString()}`} />
                <div className="rounded-sm bg-gradient-to-r from-pink-700 to-pink-500" style={{ width: `${(p.women / maxPrize) * 100}%` }} title={`Women: £${p.women.toLocaleString()}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3 text-[10px] text-gray-500">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-600" /> Men</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-pink-600" /> Women</div>
        </div>
      </div>

      {/* Mixed doubles partnership planner */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-bold text-white mb-1">Mixed Doubles Partnership Planner</div>
        <div className="text-[10px] text-gray-500 mb-4">Pair with a women&apos;s tour player for the mixed doubles event at the World Cup of Darts.</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {oom.slice(0, 3).map(p => (
            <div key={p.rank} className="bg-black/40 border border-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-lg">{p.country}</div>
                <div>
                  <div className="text-xs font-bold text-white">{p.name}</div>
                  <div className="text-[10px] text-gray-500">Avg {p.avg} · #{p.rank}</div>
                </div>
              </div>
              <button className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-[10px] font-semibold px-3 py-1.5 rounded transition-all">Request pairing</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── STUB VIEW (placeholder for new sidebar items) ───────────────────────────
// ─── DARTBOARD HEATMAP VIEW ───────────────────────────────────────────────────
function DartboardHeatmapView({ player: _player }: { player: DartsPlayer }) {
  const [scenario, setScenario] = useState<'match' | 'practice' | 'pressure'>('match');
  const [hoveredSeg, setHoveredSeg] = useState<number | null>(null);
  const [compare, setCompare] = useState(false);

  const SEGMENTS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

  const heatData: Record<'match' | 'practice' | 'pressure', Record<number, number>> = {
    match: { 20: 0.92, 19: 0.72, 18: 0.38, 16: 0.65, 8: 0.44, 4: 0.31, 1: 0.18, 5: 0.12, 12: 0.14, 9: 0.11, 14: 0.16, 11: 0.13, 6: 0.22, 10: 0.19, 15: 0.21, 2: 0.17, 17: 0.24, 3: 0.28, 7: 0.15, 13: 0.20 },
    practice: { 20: 0.96, 19: 0.75, 18: 0.41, 16: 0.68, 8: 0.48, 4: 0.34, 1: 0.20, 5: 0.14, 12: 0.16, 9: 0.13, 14: 0.18, 11: 0.15, 6: 0.24, 10: 0.21, 15: 0.23, 2: 0.19, 17: 0.26, 3: 0.30, 7: 0.17, 13: 0.22 },
    pressure: { 20: 0.78, 19: 0.65, 18: 0.31, 16: 0.54, 8: 0.37, 4: 0.24, 1: 0.15, 5: 0.10, 12: 0.12, 9: 0.09, 14: 0.13, 11: 0.11, 6: 0.18, 10: 0.16, 15: 0.18, 2: 0.14, 17: 0.20, 3: 0.23, 7: 0.12, 13: 0.17 },
  };

  const doublesData: Record<number, { attempts: number; rate: number; trend: string }> = {
    20: { attempts: 187, rate: 41, trend: '↑' }, 16: { attempts: 142, rate: 38, trend: '↑' },
    18: { attempts: 98, rate: 34, trend: '→' }, 8: { attempts: 76, rate: 49, trend: '↑' },
    4: { attempts: 61, rate: 52, trend: '↑' }, 10: { attempts: 44, rate: 29, trend: '↓' },
    1: { attempts: 38, rate: 27, trend: '→' }, 2: { attempts: 31, rate: 23, trend: '↓' },
    3: { attempts: 29, rate: 31, trend: '↑' }, 5: { attempts: 22, rate: 26, trend: '→' },
    6: { attempts: 19, rate: 28, trend: '→' }, 7: { attempts: 17, rate: 21, trend: '↓' },
    9: { attempts: 15, rate: 25, trend: '→' }, 11: { attempts: 12, rate: 24, trend: '→' },
    12: { attempts: 11, rate: 22, trend: '→' }, 13: { attempts: 9, rate: 18, trend: '↓' },
    14: { attempts: 8, rate: 26, trend: '→' }, 15: { attempts: 7, rate: 30, trend: '↑' },
    17: { attempts: 6, rate: 27, trend: '→' }, 19: { attempts: 5, rate: 33, trend: '↑' },
  };

  const heatToColor = (h: number) => {
    if (h > 0.8) return 'rgba(239,68,68,0.7)';
    if (h > 0.6) return 'rgba(251,146,60,0.65)';
    if (h > 0.4) return 'rgba(250,204,21,0.5)';
    if (h > 0.2) return 'rgba(250,204,21,0.25)';
    return 'rgba(255,255,255,0.05)';
  };

  const renderBoard = (scenarioKey: 'match' | 'practice' | 'pressure', size: number = 320) => {
    const cx = size / 2, cy = size / 2;
    const r = { bull: size * 0.036, bull25: size * 0.072, inner: size * 0.2, treble: size * 0.29, outer: size * 0.4, edge: size * 0.48 };
    const segAngle = 18;
    const polarToXY = (angle: number, radius: number) => ({ x: cx + radius * Math.sin((angle * Math.PI) / 180), y: cy - radius * Math.cos((angle * Math.PI) / 180) });
    const arcPath = (r1: number, r2: number, startDeg: number, endDeg: number) => {
      const s1 = polarToXY(startDeg, r1), s2 = polarToXY(startDeg, r2);
      const e1 = polarToXY(endDeg, r1), e2 = polarToXY(endDeg, r2);
      return `M ${s1.x} ${s1.y} L ${s2.x} ${s2.y} A ${r2} ${r2} 0 0 1 ${e2.x} ${e2.y} L ${e1.x} ${e1.y} A ${r1} ${r1} 0 0 0 ${s1.x} ${s1.y} Z`;
    };
    const data = heatData[scenarioKey];
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r.edge} fill="#1a1a1a" />
        {SEGMENTS.map((num, idx) => {
          const startDeg = idx * segAngle - segAngle / 2;
          const endDeg = startDeg + segAngle;
          const h = data[num] || 0.1;
          const isHovered = hoveredSeg === num;
          const baseLight = idx % 2 === 0 ? '#f5f5dc' : '#1a1a1a';
          const midDeg = startDeg + segAngle / 2;
          const pos = polarToXY(midDeg, r.edge * 1.06);
          return (
            <g key={num} onMouseEnter={() => setHoveredSeg(num)} onMouseLeave={() => setHoveredSeg(null)} style={{ cursor: 'pointer' }}>
              <path d={arcPath(r.treble, r.inner, startDeg, endDeg)} fill={baseLight} stroke="#333" strokeWidth="0.5" opacity={0.9} />
              <path d={arcPath(r.outer, r.treble, startDeg, endDeg)} fill={idx % 2 === 0 ? '#c41e3a' : '#1a7a3c'} stroke="#333" strokeWidth="0.5" />
              <path d={arcPath(r.inner, r.bull25 * 1.4, startDeg, endDeg)} fill={baseLight} stroke="#333" strokeWidth="0.5" opacity={0.9} />
              <path d={arcPath(r.edge, r.outer, startDeg, endDeg)} fill={idx % 2 === 0 ? '#c41e3a' : '#1a7a3c'} stroke="#333" strokeWidth="0.5" />
              <path d={arcPath(r.outer, r.bull25 * 1.4, startDeg, endDeg)} fill={heatToColor(h)} opacity={isHovered ? 0.9 : 0.75} />
              {isHovered && <path d={arcPath(r.edge, r.bull25 * 1.4, startDeg, endDeg)} fill="white" fillOpacity={0.08} stroke="white" strokeWidth="0.5" strokeOpacity={0.3} />}
              <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fontSize={size * 0.038} fill="white" fontWeight="500" style={{ pointerEvents: 'none', userSelect: 'none' }}>{num}</text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={r.bull25} fill="#1a7a3c" stroke="#333" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r={r.bull} fill="#c41e3a" stroke="#333" strokeWidth="0.5" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={size * 0.04} fill="white" fontWeight="600" style={{ pointerEvents: 'none' }}>B</text>
      </svg>
    );
  };

  const hovered = hoveredSeg;
  const dbl = hovered ? doublesData[hovered] : null;
  const heat = hovered ? (heatData[scenario][hovered] || 0.1) : null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Dartboard Heatmap</h1>
        <p className="text-gray-400 text-sm mt-1">Hit distribution · Segment accuracy · Doubles &amp; trebles</p>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex rounded-lg border border-white/5 overflow-hidden">
          {(['match', 'practice', 'pressure'] as const).map(s => (
            <button key={s} onClick={() => setScenario(s)} className={`px-4 py-2 text-xs font-medium transition-colors ${scenario === s ? 'bg-red-600/20 text-red-300 border-r border-white/5' : 'bg-gray-900/40 text-gray-500 hover:text-gray-300 border-r border-white/5'} last:border-r-0`}>
              {s === 'match' ? 'Match play' : s === 'practice' ? 'Practice' : 'Under pressure'}
            </button>
          ))}
        </div>
        <button onClick={() => setCompare(!compare)} className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${compare ? 'bg-blue-600/20 text-blue-300 border-blue-500/30' : 'bg-gray-900/40 text-gray-500 border-white/5 hover:text-gray-300'}`}>
          {compare ? '✕ Close comparison' : 'Compare practice vs match'}
        </button>
      </div>
      <div className="flex gap-6 items-start">
        {compare ? (
          <div className="flex gap-6">
            <div className="flex flex-col items-center gap-2"><p className="text-xs text-gray-500 uppercase tracking-wide">Practice</p>{renderBoard('practice', 280)}</div>
            <div className="flex flex-col items-center gap-2"><p className="text-xs text-gray-500 uppercase tracking-wide">Match play</p>{renderBoard('match', 280)}</div>
          </div>
        ) : renderBoard(scenario, 340)}
        <div className="flex-1 min-w-[200px]">
          <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4 min-h-[200px]">
            {hovered ? (
              <>
                <h3 className="text-white font-medium mb-3">Segment {hovered}</h3>
                <div className="space-y-2.5">
                  <div>
                    <p className="text-xs text-gray-500">Heat score</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-2 flex-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.round((heat || 0) * 100)}%`, background: heatToColor(heat || 0) }} />
                      </div>
                      <span className="text-white text-sm font-medium">{Math.round((heat || 0) * 100)}%</span>
                    </div>
                  </div>
                  {dbl && (
                    <>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Double {hovered} attempts</span><span className="text-white">{dbl.attempts}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Conversion rate</span><span className={`font-medium ${dbl.rate >= 40 ? 'text-green-400' : dbl.rate >= 30 ? 'text-amber-400' : 'text-red-400'}`}>{dbl.rate}%</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Trend</span><span className={dbl.trend === '↑' ? 'text-green-400' : dbl.trend === '↓' ? 'text-red-400' : 'text-gray-400'}>{dbl.trend} {dbl.trend === '↑' ? 'Improving' : dbl.trend === '↓' ? 'Declining' : 'Stable'}</span></div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600 text-sm">Hover a segment to see stats</div>
            )}
          </div>
          <div className="mt-4 bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Heat key</p>
            <div className="space-y-1.5">
              {[
                { color: 'rgba(239,68,68,0.7)', label: 'Very high (80–100%)' },
                { color: 'rgba(251,146,60,0.65)', label: 'High (60–80%)' },
                { color: 'rgba(250,204,21,0.5)', label: 'Medium (40–60%)' },
                { color: 'rgba(250,204,21,0.25)', label: 'Low (20–40%)' },
                { color: 'rgba(255,255,255,0.05)', label: 'Minimal (0–20%)' },
              ].map((it, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: it.color, border: '1px solid rgba(255,255,255,0.1)' }} />
                  {it.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Doubles conversion — 2025 season</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Double</span><span>Attempts</span><span>Hit rate</span><span>Trend</span><span>Rating</span>
          </div>
          {Object.entries(doublesData).sort((a, b) => b[1].attempts - a[1].attempts).map(([num, d]) => (
            <div key={num} onMouseEnter={() => setHoveredSeg(Number(num))} onMouseLeave={() => setHoveredSeg(null)} className={`grid grid-cols-5 gap-2 px-4 py-2.5 border-t border-white/5 text-sm cursor-pointer transition-colors ${hoveredSeg === Number(num) ? 'bg-gray-800/40' : 'hover:bg-gray-900/40'}`}>
              <span className="text-white font-medium">D{num}</span>
              <span className="text-gray-400">{d.attempts}</span>
              <span className={`font-medium ${d.rate >= 45 ? 'text-green-400' : d.rate >= 35 ? 'text-amber-400' : 'text-red-400'}`}>{d.rate}%</span>
              <span className={d.trend === '↑' ? 'text-green-400' : d.trend === '↓' ? 'text-red-400' : 'text-gray-500'}>{d.trend}</span>
              <div className="flex items-center">
                <div className="h-1.5 flex-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${d.rate >= 45 ? 'bg-green-500' : d.rate >= 35 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${d.rate}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ADVANCED STATS VIEW ──────────────────────────────────────────────────────
function AdvancedStatsView({ player }: { player: DartsPlayer }) {
  const first9Avg = [102.1, 106.4, 98.3, 103.8, 108.4, 101.2, 99.8, 105.7, 103.2, 101.6, 108.9, 100.4, 104.8, 102.1, 103.9];
  const scoringZones = [
    { label: '180 (max)', jake: 198, pdc: 162, color: 'bg-red-500' },
    { label: '140+', jake: 312, pdc: 274, color: 'bg-orange-500' },
    { label: '100+', jake: 689, pdc: 641, color: 'bg-amber-500' },
    { label: '60–99', jake: 891, pdc: 908, color: 'bg-blue-500' },
    { label: 'Below 60', jake: 423, pdc: 498, color: 'bg-gray-500' },
  ];
  const legLengths = [
    { darts: 9, won: 1 }, { darts: 12, won: 14 }, { darts: 15, won: 67 },
    { darts: 18, won: 89 }, { darts: 21, won: 76 }, { darts: 24, won: 43 },
  ];
  const maxLegs = Math.max(...legLengths.map(l => l.won));
  const h2h = [
    { opp: 'Luke Littler', rank: 1, w: 2, l: 4, avg: 96.1 },
    { opp: 'Michael van Gerwen', rank: 2, w: 1, l: 5, avg: 95.4 },
    { opp: 'Luke Humphries', rank: 3, w: 3, l: 2, avg: 97.8 },
    { opp: 'Nathan Aspinall', rank: 4, w: 4, l: 3, avg: 98.2 },
    { opp: 'Rob Cross', rank: 9, w: 4, l: 4, avg: 97.1 },
    { opp: 'Gerwyn Price', rank: 7, w: 8, l: 3, avg: 99.4 },
    { opp: 'Gary Anderson', rank: 14, w: 5, l: 4, avg: 98.7 },
    { opp: 'Michael Smith', rank: 6, w: 3, l: 5, avg: 96.8 },
  ];
  const busts = [
    { score: 36, count: 12, reason: 'Hits S18 leaving 18' },
    { score: 32, count: 9, reason: 'Hits S16 leaving 16, then misses' },
    { score: 64, count: 8, reason: 'Hits S16 leaving 48, misses D24' },
    { score: 48, count: 7, reason: 'Misses D16, hits S8 leaving 40' },
    { score: 24, count: 6, reason: 'Hits S8 leaving 16, then misses D8' },
  ];
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-medium text-white">Advanced Performance Stats</h1>
        <p className="text-gray-400 text-sm mt-1">2025 season · 47 matches played · All PDC events</p>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Match average', value: '97.8' }, { label: 'First 9 average', value: String(player.firstNineAverage) },
          { label: 'Checkout %', value: '41.2%' }, { label: '180s / match', value: '4.2' },
          { label: 'Legs won / match', value: '8.1' }, { label: 'Win rate', value: '68%' },
        ].map((k, i) => (
          <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className="text-2xl font-medium text-white">{k.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <div><h2 className="text-white font-medium">First 9-dart average</h2><p className="text-gray-500 text-xs mt-0.5">Average score in the first 3 visits per leg · Elite threshold: 100+</p></div>
          <div className="flex gap-4 text-xs text-gray-400"><span>Jake 2025: <strong className="text-white">{player.firstNineAverage}</strong></span><span>PDC avg: <strong className="text-gray-300">96.8</strong></span></div>
        </div>
        <div className="relative h-28">
          <div className="absolute inset-0 flex items-end gap-1">
            {first9Avg.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full rounded-sm transition-all ${v >= 100 ? 'bg-red-500/70' : 'bg-gray-700'}`} style={{ height: `${((v - 88) / 25) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="absolute left-0 right-0 border-t border-dashed border-red-500/40" style={{ bottom: `${((100 - 88) / 25) * 100}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2"><span>PC 1</span><span>PC 5</span><span>PC 10</span><span>PC 15</span></div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Scoring zones — 2025 season totals</h2>
        <div className="space-y-3">
          {scoringZones.map((z, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-center text-sm">
              <span className="col-span-2 text-gray-400">{z.label}</span>
              <div className="col-span-7 relative h-5 bg-gray-800 rounded overflow-hidden">
                <div className={`absolute left-0 top-0 h-full ${z.color} opacity-70 rounded`} style={{ width: `${(z.jake / 900) * 100}%` }} />
                <div className="absolute top-0 h-full border-r-2 border-white/40" style={{ left: `${(z.pdc / 900) * 100}%` }} />
              </div>
              <div className="col-span-3 flex gap-3 text-xs"><span className="text-white">{z.jake}</span><span className="text-gray-500">PDC: {z.pdc}</span></div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-1">Leg efficiency</h2>
        <p className="text-gray-500 text-xs mb-3">Legs won in X darts · Season avg won: 18.3 darts</p>
        <div className="flex items-end gap-2 h-24">
          {legLengths.map((leg, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-white text-xs font-medium">{leg.won}</span>
              <div className="w-full bg-red-500/60 rounded-sm" style={{ height: `${(leg.won / maxLegs) * 72}px` }} />
              <span className="text-[10px] text-gray-500">{leg.darts}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-1">Bust rate analysis</h2>
        <p className="text-gray-500 text-xs mb-3">Overall 3.8% of checkout attempts — was 5.1% in 2024</p>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide"><span>Score left</span><span>Occurrences</span><span>Common cause</span></div>
          {busts.map((b, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 px-4 py-3 border-t border-white/5 text-sm">
              <span className="text-red-400 font-medium">{b.score}</span>
              <span className="text-gray-300">{b.count}×</span>
              <span className="text-gray-500 text-xs">{b.reason}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Head-to-head vs top players</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide"><span className="col-span-2">Opponent</span><span>Rank</span><span>Record</span><span>Jake avg</span></div>
          {h2h.map((h, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 px-4 py-3 border-t border-white/5 text-sm items-center">
              <span className="col-span-2 text-gray-200">{h.opp}</span>
              <span className="text-gray-500">#{h.rank}</span>
              <span className={`font-medium ${h.w > h.l ? 'text-green-400' : h.w < h.l ? 'text-red-400' : 'text-gray-300'}`}>W{h.w} L{h.l}</span>
              <span className="text-gray-300">{h.avg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MATCH PREP VIEW ──────────────────────────────────────────────────────────
function MatchPrepView({ player: _player }: { player: DartsPlayer }) {
  const routes = [
    { score: 170, route: 'T20 T20 Bull', note: 'Max checkout — only if confident' },
    { score: 164, route: 'T20 T18 Bull', note: 'Keep bull as fallback' },
    { score: 158, route: 'T20 T20 D19', note: 'Practise D19 setup' },
    { score: 132, route: 'T20 T16 D12', note: 'Standard — no surprises' },
    { score: 121, route: 'T20 11 D25', note: 'Bull setup' },
    { score: 100, route: 'T20 D20', note: 'Cleanest finish' },
    { score: 81, route: 'T19 D12', note: 'Price leaves 81 often' },
    { score: 60, route: 'S20 D20', note: 'D20 — your best double' },
    { score: 40, route: 'D20', note: 'Standard' },
    { score: 36, route: 'D18', note: 'Avoid S18 leaving 18' },
    { score: 32, route: 'D16', note: 'Solid double' },
    { score: 16, route: 'D8', note: 'D8 52% — your best' },
  ];
  const mentalChecklist = [
    'Arrive venue 19:15 — dressing room warm-up',
    'Headphones in during warm-up — no distractions',
    '18-second throwing routine between throws',
    'Breathe deeply between visits',
    'Walk calmly between boards — match Price\'s slow tempo',
  ];
  return (
    <div className="p-6 space-y-6 match-prep-content">
      <style dangerouslySetInnerHTML={{ __html: `
@media print {
  body { background: white !important; color: black !important; }
  aside, nav, .quick-actions, .print\\:hidden { display: none !important; }
  .match-prep-content { max-width: 100% !important; padding: 0 !important; }
  .bg-gray-900\\/60, .bg-gray-800\\/40 { background: #f5f5f5 !important; border: 1px solid #ddd !important; }
  .text-white { color: black !important; }
  .text-gray-400, .text-gray-300, .text-gray-500 { color: #555 !important; }
  .text-red-400, .text-red-300 { color: #c41e3a !important; }
  .text-green-400 { color: #166534 !important; }
  .border-white\\/5 { border-color: #ddd !important; }
  h1 { font-size: 18pt !important; }
  h2 { font-size: 13pt !important; }
  p, span { font-size: 10pt !important; }
}
      ` }} />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white">Match Prep</h1>
          <p className="text-gray-400 text-sm mt-1">Tonight&apos;s tactical plan — PDC European Championship R1</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 bg-gray-800/60 border border-white/5 text-gray-400 text-xs rounded-lg hover:text-gray-200 flex items-center gap-1.5 print:hidden"
        >
          <FileText className="w-3 h-3" />
          Print briefing
        </button>
      </div>
      <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-600/30 rounded-xl p-5">
        <div className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">TONIGHT'S MATCH</div>
        <div className="text-white font-bold text-xl mb-1">Jake Morrison vs Gerwyn Price</div>
        <div className="text-sm text-gray-300">20:00 · Westfalenhalle, Dortmund · First round · Win = £110,000</div>
        <div className="text-xs text-gray-500 mt-2">H2H lifetime: <strong className="text-white">W8 L3</strong> · Last 3: W, L, W</div>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-3">Opponent intel — Gerwyn Price (#7)</h2>
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div><p className="text-xs text-gray-500">Average</p><p className="text-white font-medium">96.2</p></div>
          <div><p className="text-xs text-gray-500">Checkout %</p><p className="text-white font-medium">40.1%</p></div>
          <div><p className="text-xs text-gray-500">180s/leg</p><p className="text-white font-medium">0.79</p></div>
          <div><p className="text-xs text-gray-500">Best double</p><p className="text-white font-medium">D16 (52%)</p></div>
        </div>
        <p className="text-xs text-amber-400 mt-3">⚠ Price starts slow — attack first 3 legs aggressively. His scoring drops 6% when behind early.</p>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">3-phase game plan</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { phase: 'Opening (legs 1–3)', color: 'from-red-900/40 to-red-900/10 border-red-600/30', note: 'Attack aggressively. Target 100+ legs. Disrupt Price\'s rhythm before he settles.' },
            { phase: 'Mid-match (legs 4–8)', color: 'from-amber-900/40 to-amber-900/10 border-amber-600/30', note: 'Maintain routine. Capitalise on his scoring dips. Don\'t force 180s — play percentages.' },
            { phase: 'Closing (legs 9+)', color: 'from-teal-900/40 to-teal-900/10 border-teal-600/30', note: 'Stay calm. Trust D20 / D16. If ahead, hold the trigger. If behind, T20–T20 Bull finishes.' },
          ].map((p, i) => (
            <div key={i} className={`bg-gradient-to-br ${p.color} border rounded-xl p-4`}>
              <div className="text-xs font-semibold uppercase tracking-wider text-white mb-2">{p.phase}</div>
              <p className="text-xs text-gray-300 leading-relaxed">{p.note}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Checkout routes — tonight's plan</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span className="col-span-1">Score</span><span className="col-span-3">Route</span><span className="col-span-8">Tonight's note</span>
          </div>
          {routes.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2.5 border-t border-white/5 text-sm">
              <span className="col-span-1 text-red-400 font-medium">{r.score}</span>
              <span className="col-span-3 text-white">{r.route}</span>
              <span className="col-span-8 text-gray-400 text-xs">{r.note}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-3">Mental prep — from Sarah (mental coach)</h2>
        <div className="space-y-2">
          {mentalChecklist.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm">
              <div className="mt-0.5 w-4 h-4 rounded border border-white/20 flex-shrink-0" />
              <span className="text-gray-300">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── WALK-ON MUSIC VIEW ───────────────────────────────────────────────────────
function WalkOnMusicView({ player: _player }: { player: DartsPlayer }) {
  const [showToast, setShowToast] = useState(false);
  const [newTrack, setNewTrack] = useState('');
  const [reason, setReason] = useState('');
  function submit() { setShowToast(true); setNewTrack(''); setReason(''); setTimeout(() => setShowToast(false), 3000); }
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Walk-on Music</h1>
        <p className="text-gray-400 text-sm mt-1">Approved tracks, broadcaster clearance, change requests</p>
      </div>
      <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-600/30 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg bg-black/40 border border-red-600/30 flex items-center justify-center text-3xl flex-shrink-0">🎵</div>
          <div className="flex-1">
            <div className="text-xs text-red-400 uppercase tracking-wider font-semibold mb-1">Current walk-on track</div>
            <div className="text-white font-bold text-lg">"Iron" — Within Temptation</div>
            <div className="text-xs text-gray-400 mt-1">Duration 2:04 · BPM 138 · PDC Ref #WM-2847</div>
          </div>
        </div>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-3">Broadcaster approval status</h2>
        <div className="grid grid-cols-5 gap-2 text-sm">
          {[
            { b: 'Sky Sports', ok: true }, { b: 'DAZN', ok: true }, { b: 'ITV', ok: true },
            { b: 'BBC', ok: true }, { b: 'RTL (DE)', ok: true },
          ].map((s, i) => (
            <div key={i} className="bg-black/30 border border-white/5 rounded-lg p-3 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">{s.b}</div>
              <div className={`text-sm font-medium mt-1 ${s.ok ? 'text-green-400' : 'text-amber-400'}`}>{s.ok ? '✓ Approved' : 'Pending'}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white font-medium">Backup track</h2>
          <span className="text-[10px] text-amber-400 uppercase tracking-wide">Partially approved</span>
        </div>
        <div className="text-gray-300 text-sm">"Eye of the Tiger" — Survivor</div>
        <div className="text-xs text-gray-500 mt-1">Sky ✓ · ITV ✓ · BBC ✓ · DAZN ⏳ Pending · RTL ✓</div>
      </div>
      <div className="bg-amber-950/40 border border-amber-800/30 rounded-xl p-4 text-sm text-amber-200">
        ⚠ DAZN backup approval still pending — submit by <strong className="text-amber-100">May 1</strong> for Grand Slam eligibility.
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-2">Brand identity notes</h2>
        <p className="text-gray-400 text-sm leading-relaxed">"Iron" aligns with the Red Dragon sponsor palette and Jake&apos;s aggressive throwing style. Cadence sits well with the 2m walk-on window. Alternatives must match 130+ BPM and avoid explicit language for broadcast clearance.</p>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Upcoming televised events — music required</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Event</span><span>Date</span><span>Broadcaster</span><span>Status</span>
          </div>
          {[
            { ev: 'Grand Slam of Darts', date: 'Nov 8', br: 'Sky Sports', st: '✓ Approved' },
            { ev: 'Premier League Night 14', date: 'May 2', br: 'Sky + DAZN', st: '⏳ DAZN pending' },
            { ev: 'World Matchplay', date: 'Jul 19', br: 'Sky Sports', st: '✓ Approved' },
            { ev: 'German Masters', date: 'Oct 4', br: 'RTL', st: '✓ Approved' },
          ].map((e, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 px-4 py-2.5 border-t border-white/5 text-sm">
              <span className="text-white">{e.ev}</span>
              <span className="text-gray-400">{e.date}</span>
              <span className="text-gray-400">{e.br}</span>
              <span className={e.st.startsWith('✓') ? 'text-green-400' : 'text-amber-400'}>{e.st}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-3">Request track change</h2>
        <div className="space-y-3">
          <input value={newTrack} onChange={e => setNewTrack(e.target.value)} placeholder="Proposed track (Artist - Title)" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-red-500/60 focus:outline-none" />
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for change" rows={3} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-red-500/60 focus:outline-none" />
          <button onClick={submit} className="px-4 py-2 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 text-sm font-medium hover:bg-red-600/30">Submit request</button>
        </div>
        {showToast && <div className="mt-3 px-3 py-2 rounded-lg bg-green-600/20 border border-green-500/30 text-green-300 text-sm">✓ Request submitted for review</div>}
      </div>
    </div>
  );
}

// ─── PRACTICE GAMES VIEW ──────────────────────────────────────────────────────
// Defaults used when there's nothing in localStorage yet.
const PRACTICE_DEFAULTS: Record<string, number[]> = {
  bobs27:   [45, 52, 48, 63, 58, 71, 66, 78, 72, 85, 79, 91, 87, 83, 94, 88, 96, 92, 101, 97, 104, 98, 112, 108, 119, 115, 127, 123, 135, 141],
  atc:      [340, 332, 328, 319, 312, 305, 298, 294, 289, 282], // seconds (lower = better)
  t180:     [4, 5, 3, 6, 7, 5, 8, 6, 9, 11],
  doubles:  [325, 318, 312, 305, 298, 290, 284, 278, 272, 225], // seconds
  checkout: [8, 9, 10, 9, 11, 10, 12, 11, 13, 14],
  halveit:  [185, 198, 210, 225, 240, 258, 275, 290, 305, 320],
  shanghai: [72, 85, 91, 104, 118, 127, 135, 148, 159, 167],
  cricket:  [3, 4, 4, 5, 5, 6, 6, 7, 7, 8],
};

const PRACTICE_LS_KEYS: Record<string, string> = {
  bobs27:   'lumio_darts_bobs27_scores',
  atc:      'lumio_darts_atc_scores',
  t180:     'lumio_darts_180_scores',
  doubles:  'lumio_darts_doubles_scores',
  checkout: 'lumio_darts_checkout_scores',
  halveit:  'lumio_darts_halveit_scores',
  shanghai: 'lumio_darts_shanghai_scores',
  cricket:  'lumio_darts_cricket_scores',
};

function loadScores(key: string, fallback: number[]): number[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(PRACTICE_LS_KEYS[key]);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every(n => typeof n === 'number') ? parsed : fallback;
  } catch { return fallback; }
}

function PracticeGamesView({ player: _player }: { player: DartsPlayer }) {
  const [bobs27, setBobs27] = useState<number[]>(() => loadScores('bobs27', PRACTICE_DEFAULTS.bobs27));
  const [atc, setAtc] = useState<number[]>(() => loadScores('atc', PRACTICE_DEFAULTS.atc));
  const [t180, setT180] = useState<number[]>(() => loadScores('t180', PRACTICE_DEFAULTS.t180));
  const [doubles, setDoubles] = useState<number[]>(() => loadScores('doubles', PRACTICE_DEFAULTS.doubles));
  const [checkout, setCheckout] = useState<number[]>(() => loadScores('checkout', PRACTICE_DEFAULTS.checkout));
  const [halveit, setHalveit] = useState<number[]>(() => loadScores('halveit', PRACTICE_DEFAULTS.halveit));
  const [shanghai, setShanghai] = useState<number[]>(() => loadScores('shanghai', PRACTICE_DEFAULTS.shanghai));
  const [cricket, setCricket] = useState<number[]>(() => loadScores('cricket', PRACTICE_DEFAULTS.cricket));

  useEffect(() => { localStorage.setItem(PRACTICE_LS_KEYS.bobs27, JSON.stringify(bobs27)); }, [bobs27]);
  useEffect(() => { localStorage.setItem(PRACTICE_LS_KEYS.atc, JSON.stringify(atc)); }, [atc]);
  useEffect(() => { localStorage.setItem(PRACTICE_LS_KEYS.t180, JSON.stringify(t180)); }, [t180]);
  useEffect(() => { localStorage.setItem(PRACTICE_LS_KEYS.doubles, JSON.stringify(doubles)); }, [doubles]);
  useEffect(() => { localStorage.setItem(PRACTICE_LS_KEYS.checkout, JSON.stringify(checkout)); }, [checkout]);
  useEffect(() => { localStorage.setItem(PRACTICE_LS_KEYS.halveit, JSON.stringify(halveit)); }, [halveit]);
  useEffect(() => { localStorage.setItem(PRACTICE_LS_KEYS.shanghai, JSON.stringify(shanghai)); }, [shanghai]);
  useEffect(() => { localStorage.setItem(PRACTICE_LS_KEYS.cricket, JSON.stringify(cricket)); }, [cricket]);

  const [logOpen, setLogOpen] = useState<string | null>(null);
  const [logValue, setLogValue] = useState<string>('');

  const pb = (arr: number[], lower: boolean = false) => {
    if (!arr.length) return 0;
    return lower ? Math.min(...arr) : Math.max(...arr);
  };
  const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

  const fmtTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  type GameCfg = {
    key: string;
    name: string;
    scores: number[];
    setScores: (v: number[]) => void;
    target: string;
    unit: string;
    lowerIsBetter?: boolean;
    displayValue: (n: number) => string;
  };

  const games: GameCfg[] = [
    { key: 'bobs27',   name: "Bob's 27",         scores: bobs27,   setScores: setBobs27,   target: '100',    unit: 'pts',    displayValue: n => String(n) },
    { key: 'atc',      name: 'Around the Clock', scores: atc,      setScores: setAtc,      target: '4:30',   unit: 'time',   lowerIsBetter: true, displayValue: fmtTime },
    { key: 't180',     name: '180 Challenge',    scores: t180,     setScores: setT180,     target: '9',      unit: '180s',   displayValue: n => String(n) },
    { key: 'doubles',  name: 'Doubles Round',    scores: doubles,  setScores: setDoubles,  target: '4:00',   unit: 'time',   lowerIsBetter: true, displayValue: fmtTime },
    { key: 'checkout', name: 'Checkout Trainer', scores: checkout, setScores: setCheckout, target: '13/20',  unit: 'hits',   displayValue: n => `${n}/20` },
    { key: 'halveit',  name: 'Halve It',         scores: halveit,  setScores: setHalveit,  target: '260',    unit: 'pts',    displayValue: n => String(n) },
    { key: 'shanghai', name: 'Shanghai',         scores: shanghai, setScores: setShanghai, target: '130',    unit: 'pts',    displayValue: n => String(n) },
    { key: 'cricket',  name: 'Cricket',          scores: cricket,  setScores: setCricket,  target: '7',      unit: 'rounds', displayValue: n => String(n) },
  ];

  const submitLog = () => {
    if (!logOpen) return;
    const n = Number(logValue);
    if (!Number.isFinite(n)) { setLogOpen(null); setLogValue(''); return; }
    const g = games.find(x => x.key === logOpen);
    if (g) g.setScores([n, ...g.scores].slice(0, 30));
    setLogOpen(null);
    setLogValue('');
  };

  const resetAll = () => {
    if (typeof window === 'undefined') return;
    if (!window.confirm('Reset all practice game scores to the default demo data? This cannot be undone.')) return;
    Object.values(PRACTICE_LS_KEYS).forEach(k => localStorage.removeItem(k));
    setBobs27(PRACTICE_DEFAULTS.bobs27);
    setAtc(PRACTICE_DEFAULTS.atc);
    setT180(PRACTICE_DEFAULTS.t180);
    setDoubles(PRACTICE_DEFAULTS.doubles);
    setCheckout(PRACTICE_DEFAULTS.checkout);
    setHalveit(PRACTICE_DEFAULTS.halveit);
    setShanghai(PRACTICE_DEFAULTS.shanghai);
    setCricket(PRACTICE_DEFAULTS.cricket);
  };

  const bobs27PB = pb(bobs27);
  const bobs27Max = Math.max(...bobs27, 1);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Practice Games</h1>
        <p className="text-gray-400 text-sm mt-1">Logged practice sessions — personal bests, averages, coach targets</p>
      </div>
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900/60 border border-white/5 text-sm">
        <span className="text-base">📊</span>
        <span className="text-gray-300"><strong className="text-white">{bobs27.length} sessions logged</strong> · Bob&apos;s 27 PB: <strong className="text-white">{bobs27PB}</strong> · All scores saved locally</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {games.map(g => {
          const last10 = g.scores.slice(0, 10);
          const gameMax = Math.max(...g.scores, 1);
          const pbVal = pb(g.scores, g.lowerIsBetter);
          const avgVal = avg(g.scores);
          return (
            <div key={g.key} className="bg-gray-900/60 border border-white/5 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-medium">{g.name}</h3>
                  <div className="flex gap-4 mt-1 text-xs">
                    <span className="text-gray-500">PB: <strong className="text-white">{g.displayValue(pbVal)}</strong></span>
                    <span className="text-gray-500">Avg: <strong className="text-gray-300">{g.unit === 'time' ? fmtTime(avgVal) : avgVal}</strong></span>
                    <span className="text-gray-500">Target: <strong className="text-amber-400">{g.target}</strong></span>
                  </div>
                </div>
                <button onClick={() => { setLogOpen(g.key); setLogValue(''); }} className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 text-xs font-medium hover:bg-red-600/30">Log session</button>
              </div>
              {logOpen === g.key && (
                <div className="mb-3 p-3 rounded-lg bg-black/40 border border-white/10">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1.5">Log new score ({g.unit === 'time' ? 'seconds' : g.unit})</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={logValue}
                      onChange={e => setLogValue(e.target.value)}
                      placeholder="Enter score"
                      autoFocus
                      className="flex-1 bg-black/60 border border-white/10 rounded px-2 py-1.5 text-sm text-white placeholder-gray-600 focus:border-red-500/60 focus:outline-none"
                    />
                    <button onClick={submitLog} className="px-3 py-1.5 rounded bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-medium hover:bg-red-600/50">Confirm</button>
                    <button onClick={() => { setLogOpen(null); setLogValue(''); }} className="px-3 py-1.5 rounded bg-gray-800 text-gray-400 border border-white/10 text-xs font-medium hover:bg-gray-700">Cancel</button>
                  </div>
                </div>
              )}
              {last10.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Last {last10.length} sessions</p>
                  <div className="flex items-end gap-1 h-8">
                    {last10.slice().reverse().map((v, j) => (
                      <div key={j} className="flex-1 bg-red-500/60 rounded-sm" style={{ height: `${(v / gameMax) * 100}%` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-3">Bob&apos;s 27 — last {Math.min(bobs27.length, 30)}-session trend</h2>
        <div className="flex items-end gap-1 h-24">
          {bobs27.slice(0, 30).slice().reverse().map((v, i) => (
            <div key={i} className="flex-1 bg-red-500/60 rounded-sm" style={{ height: `${(v / bobs27Max) * 100}%` }} />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">Personal best: <strong className="text-white">{bobs27PB}</strong> · Sessions stored: <strong className="text-gray-300">{bobs27.length}</strong></p>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-3">Coach targets (Marco)</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• Hit 100+ on Bob&apos;s 27 in 80% of sessions</li>
          <li>• Sub-4:30 on Around the Clock consistently</li>
          <li>• 13/20 on Checkout Trainer — focus on 40, 32, 16 finishes</li>
          <li>• 9+ maximums on 180 Challenge</li>
        </ul>
      </div>
      <div className="flex justify-end">
        <button onClick={resetAll} className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 border border-white/10 text-xs font-medium hover:bg-gray-700 hover:text-white">↺ Reset to demo data</button>
      </div>
    </div>
  );
}

// ─── PHYSIO & RECOVERY VIEW ───────────────────────────────────────────────────
function PhysioRecoveryView({ player: _player }: { player: DartsPlayer }) {
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const bodyParts: Record<string, { status: string; note: string; colour: string }> = {
    'Right shoulder': { status: 'Monitor', note: 'Minor tightness 3/10 — cleared for play, ice post-match', colour: 'amber' },
    'Elbow': { status: 'OK', note: 'No issues — full range of motion', colour: 'green' },
    'Wrist': { status: 'OK', note: 'No issues', colour: 'green' },
    'Back': { status: 'OK', note: 'Lower back prevention routine in place', colour: 'green' },
  };
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Physio &amp; Recovery</h1>
        <p className="text-gray-400 text-sm mt-1">Body map, treatment log, prevention programme</p>
      </div>
      <div className="bg-gradient-to-r from-green-900/30 to-green-900/10 border border-green-600/30 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <div className="text-white font-medium">Cleared for tonight</div>
            <div className="text-xs text-gray-400 mt-0.5">Arm good · Minor shoulder tightness 3/10 (right) · No restrictions</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
          <h2 className="text-white font-medium mb-3">Body map</h2>
          <div className="flex justify-center">
            <svg width="180" height="260" viewBox="0 0 180 260">
              <circle cx="90" cy="30" r="22" fill="none" stroke="#4b5563" strokeWidth="2" />
              <rect x="60" y="52" width="60" height="90" rx="10" fill="none" stroke="#4b5563" strokeWidth="2" />
              <rect x="32" y="58" width="22" height="74" rx="8" fill="none" stroke="#4b5563" strokeWidth="2" />
              <rect x="126" y="58" width="22" height="74" rx="8" fill="none" stroke="#4b5563" strokeWidth="2" />
              <rect x="66" y="142" width="22" height="90" rx="8" fill="none" stroke="#4b5563" strokeWidth="2" />
              <rect x="92" y="142" width="22" height="90" rx="8" fill="none" stroke="#4b5563" strokeWidth="2" />
              <circle cx="128" cy="62" r="8" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" style={{ cursor: 'pointer' }} onClick={() => setSelectedBodyPart('Right shoulder')} />
              <circle cx="138" cy="92" r="6" fill="#10b981" stroke="#fff" strokeWidth="1.5" style={{ cursor: 'pointer' }} onClick={() => setSelectedBodyPart('Elbow')} />
              <circle cx="144" cy="128" r="6" fill="#10b981" stroke="#fff" strokeWidth="1.5" style={{ cursor: 'pointer' }} onClick={() => setSelectedBodyPart('Wrist')} />
              <circle cx="90" cy="100" r="6" fill="#10b981" stroke="#fff" strokeWidth="1.5" style={{ cursor: 'pointer' }} onClick={() => setSelectedBodyPart('Back')} />
            </svg>
          </div>
          {selectedBodyPart && (
            <div className="mt-3 bg-black/40 border border-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium text-sm">{selectedBodyPart}</span>
                <span className={`text-xs ${bodyParts[selectedBodyPart].colour === 'amber' ? 'text-amber-400' : 'text-green-400'}`}>{bodyParts[selectedBodyPart].status}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{bodyParts[selectedBodyPart].note}</p>
            </div>
          )}
        </div>
        <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
          <h2 className="text-white font-medium mb-3">Injury history</h2>
          <div className="space-y-2">
            {[
              { date: '2024-11', site: 'Left shoulder strain', severity: 'Moderate', days: 9 },
              { date: '2024-06', site: 'Right elbow tendonitis', severity: 'Mild', days: 4 },
              { date: '2024-02', site: 'Lower back tightness', severity: 'Mild', days: 2 },
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
        </div>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-3">Treatment log — last 5 sessions</h2>
        <div className="rounded-lg border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-black/40 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Date</span><span>Therapist</span><span>Focus</span><span>Duration</span>
          </div>
          {[
            { date: '15 Apr', therapist: 'Dr. Singh', focus: 'Shoulder mobility + soft tissue', time: '45 min' },
            { date: '12 Apr', therapist: 'J. Porter', focus: 'Full upper body sports massage', time: '60 min' },
            { date: '9 Apr', therapist: 'Dr. Singh', focus: 'Elbow ultrasound + ice', time: '30 min' },
            { date: '5 Apr', therapist: 'M. Lawrence', focus: 'Deep tissue — back + shoulders', time: '75 min' },
            { date: '2 Apr', therapist: 'Dr. Singh', focus: 'ROM assessment', time: '30 min' },
          ].map((s, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 px-4 py-2.5 border-t border-white/5 text-sm">
              <span className="text-gray-400">{s.date}</span>
              <span className="text-white">{s.therapist}</span>
              <span className="text-gray-400 text-xs">{s.focus}</span>
              <span className="text-gray-400">{s.time}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-3">Prevention — daily routine</h2>
        <div className="space-y-2">
          {['Foam roll — 10 min', 'Shoulder mobility drills', 'Wrist &amp; forearm stretches', 'Neck release', 'Hydration — 3L water'].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm">
              <div className="w-4 h-4 rounded border border-white/20 flex-shrink-0" />
              <span className="text-gray-300" dangerouslySetInnerHTML={{ __html: item }} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Physio contacts</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: 'Dr. Anita Singh', role: 'Lead Physio', phone: '07700 900001' },
            { name: 'James Porter', role: 'Sports Rehab', phone: '07700 900002' },
            { name: 'Mike Lawrence', role: 'Massage Therapist', phone: '07700 900003' },
          ].map((p, i) => (
            <div key={i} className="bg-gray-900/60 border border-white/5 rounded-xl p-3">
              <div className="text-white font-medium text-sm">{p.name}</div>
              <div className="text-xs text-gray-500">{p.role}</div>
              <div className="text-xs text-red-400 mt-1">{p.phone}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DRAW & BRACKET VIEW ──────────────────────────────────────────────────────
function DrawBracketView({ player: _player }: { player: DartsPlayer }) {
  const [tournament, setTournament] = useState<'european' | 'grand-slam' | 'matchplay' | 'uk-open'>('european');
  const [showFull, setShowFull] = useState(false);
  const path = [
    { round: 'R1', opp: 'Gerwyn Price (#7)', prize: '£25,000', status: 'tonight' },
    { round: 'R2', opp: 'Winner M. Smith/R. Cross', prize: '£35,000', status: 'pending' },
    { round: 'QF', opp: 'Projected: L. Humphries (#3)', prize: '£50,000', status: 'pending' },
    { round: 'SF', opp: 'Projected: L. Littler (#1)', prize: '£80,000', status: 'pending' },
    { round: 'Final', opp: 'Projected: MVG (#2)', prize: '£110,000 winner', status: 'pending' },
  ];
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Draw &amp; Bracket</h1>
        <p className="text-gray-400 text-sm mt-1">Tournament draws and projected paths</p>
      </div>
      <div className="flex items-center gap-2">
        {([
          { id: 'european', label: 'European Championship' },
          { id: 'grand-slam', label: 'Grand Slam' },
          { id: 'matchplay', label: 'World Matchplay' },
          { id: 'uk-open', label: 'UK Open' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTournament(t.id)} className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${tournament === t.id ? 'bg-red-600/20 text-red-300 border-red-500/30' : 'bg-gray-900/40 text-gray-500 border-white/5 hover:text-gray-300'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-4">Jake&apos;s quarter — Round 1</h2>
        <div className="grid grid-cols-4 gap-3 text-xs">
          <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-3">
            <div className="text-red-300 font-semibold">LIVE TONIGHT</div>
            <div className="text-white mt-1">Jake Morrison (#19)</div>
            <div className="text-gray-400">vs Gerwyn Price (#7)</div>
          </div>
          {[
            { top: 'Michael Smith', bot: 'Rob Cross' },
            { top: 'Gary Anderson', bot: 'Dirk van Duijvenbode' },
            { top: 'Luke Humphries', bot: 'Daryl Gurney' },
          ].map((m, i) => (
            <div key={i} className="bg-black/30 border border-white/5 rounded-lg p-3">
              <div className="text-gray-400">{m.top}</div>
              <div className="text-gray-500 text-[10px] my-1">vs</div>
              <div className="text-gray-400">{m.bot}</div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-3">Winner of Jake's bracket enters QF Thursday night</div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Path to the title</h2>
        <div className="space-y-2">
          {path.map((p, i) => (
            <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-lg border ${p.status === 'tonight' ? 'bg-red-600/20 border-red-500/30' : 'bg-gray-900/60 border-white/5'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${p.status === 'tonight' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400'}`}>{p.round}</div>
                <span className={p.status === 'tonight' ? 'text-white font-medium' : 'text-gray-300'}>{p.opp}</span>
              </div>
              <span className={`text-sm font-medium ${p.status === 'tonight' ? 'text-red-300' : 'text-gray-400'}`}>{p.prize}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl">
        <button onClick={() => setShowFull(!showFull)} className="w-full flex items-center justify-between px-5 py-4 text-left">
          <h2 className="text-white font-medium">Full 32-player bracket</h2>
          <span className="text-xs text-gray-400">{showFull ? '▲ Hide' : '▼ Show'}</span>
        </button>
        {showFull && (
          <div className="px-5 pb-5">
            <div className="grid grid-cols-4 gap-2 text-xs">
              {['L. Littler', 'M. Smith', 'R. Cross', 'J. Wade', 'G. Anderson', 'D. van Duijvenbode', 'J. Morrison', 'G. Price', 'L. Humphries', 'D. Gurney', 'M. van Gerwen', 'D. Chisnall', 'N. Aspinall', 'P. Wright', 'D. Noppert', 'G. Clayton'].map((p, i) => (
                <div key={i} className="bg-black/30 border border-white/5 rounded px-2 py-1.5 text-gray-400">{p}</div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-4 text-sm text-amber-200">
        ℹ️ Players Championship events use a no-advance-draw format — opponents are drawn on the day of the event.
      </div>
    </div>
  );
}

// ─── PRIZE MONEY FORECAST VIEW ────────────────────────────────────────────────
function PrizeForecastView({ player: _player }: { player: DartsPlayer }) {
  const pctEarned = (42800 / 150000) * 100;
  const years = [
    { year: '2020', amount: 32000 },
    { year: '2021', amount: 58000 },
    { year: '2022', amount: 71000 },
    { year: '2023', amount: 89000 },
    { year: '2024', amount: 102000 },
    { year: '2025', amount: 139000, projected: true },
  ];
  const upcoming = [
    { ev: 'Prague Open', date: 'Apr 22', pool: '£120k', expect: 'R3', earn: '£3,500' },
    { ev: 'Players Ch. 8', date: 'Apr 28', pool: '£100k', expect: 'QF', earn: '£5,000' },
    { ev: 'Players Ch. 9', date: 'May 3', pool: '£100k', expect: 'R3', earn: '£2,500' },
    { ev: 'Premier League N14', date: 'May 9', pool: '£275k', expect: 'Win', earn: '£15,000' },
    { ev: 'European Open', date: 'May 23', pool: '£150k', expect: 'QF', earn: '£7,500' },
    { ev: 'World Cup', date: 'Jun 12', pool: '£450k', expect: 'SF', earn: '£12,000' },
    { ev: 'Players Ch. 12', date: 'Jun 20', pool: '£100k', expect: 'SF', earn: '£7,500' },
    { ev: 'World Matchplay', date: 'Jul 19', pool: '£800k', expect: 'QF', earn: '£20,000' },
    { ev: 'World Masters', date: 'Aug 15', pool: '£350k', expect: 'SF', earn: '£18,000' },
    { ev: 'German Masters', date: 'Oct 4', pool: '£150k', expect: 'R3', earn: '£4,000' },
    { ev: 'Grand Slam', date: 'Nov 8', pool: '£650k', expect: 'QF', earn: '£16,000' },
    { ev: 'Players Championship Finals', date: 'Nov 22', pool: '£500k', expect: 'R3', earn: '£8,000' },
  ];
  const waterfall = [
    { label: 'Gross earnings', amount: 140000, running: 140000, colour: 'text-white' },
    { label: 'PDPA levy (2%)', amount: -2800, running: 137200, colour: 'text-red-400' },
    { label: 'Agent fee (12%)', amount: -16800, running: 120400, colour: 'text-red-400' },
    { label: 'Travel, hotels, entries', amount: -28000, running: 92400, colour: 'text-red-400' },
    { label: 'Tax (approx)', amount: -25400, running: 67000, colour: 'text-red-400' },
    { label: 'Net to Jake', amount: 67000, running: 67000, colour: 'text-green-400' },
  ];
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Prize Money Forecaster</h1>
        <p className="text-gray-400 text-sm mt-1">Season earnings, projections, deductions</p>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-white font-medium">Season earnings tracker</h2>
            <p className="text-xs text-gray-500 mt-0.5">Through 16 of 48 events</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">£42,800</div>
            <div className="text-xs text-gray-400">earned · on pace for <strong className="text-red-300">£139,000</strong></div>
          </div>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-red-500/70 rounded-full" style={{ width: `${pctEarned}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 mt-1.5">
          <span>£0</span><span>Target: £150k</span>
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Earnings by tour type</h2>
        <div className="space-y-2">
          {[
            { label: 'Players Championships', amount: 18400, pct: 43 },
            { label: 'European Tour', amount: 11200, pct: 26 },
            { label: 'Majors (TV)', amount: 13200, pct: 31 },
          ].map((t, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-center text-sm">
              <span className="col-span-3 text-gray-300">{t.label}</span>
              <div className="col-span-7 h-5 bg-gray-800 rounded overflow-hidden">
                <div className="h-full bg-red-500/70 rounded" style={{ width: `${t.pct}%` }} />
              </div>
              <span className="col-span-2 text-right text-white font-medium">£{t.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Upcoming events — projected earnings</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span className="col-span-4">Event</span><span className="col-span-2">Date</span><span className="col-span-2">Prize pool</span><span className="col-span-2">Expected</span><span className="col-span-2 text-right">Projected</span>
          </div>
          {upcoming.map((u, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2.5 border-t border-white/5 text-sm">
              <span className="col-span-4 text-white">{u.ev}</span>
              <span className="col-span-2 text-gray-400">{u.date}</span>
              <span className="col-span-2 text-gray-500">{u.pool}</span>
              <span className="col-span-2 text-amber-400">{u.expect}</span>
              <span className="col-span-2 text-right text-red-300 font-medium">{u.earn}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-3">Deductions waterfall (annual)</h2>
        <div className="space-y-2">
          {waterfall.map((w, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 text-sm">
              <span className="text-gray-300">{w.label}</span>
              <div className="flex items-center gap-6">
                <span className={w.colour}>{w.amount < 0 ? '-' : ''}£{Math.abs(w.amount).toLocaleString()}</span>
                <span className="text-xs text-gray-500 w-24 text-right">Running: £{w.running.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-3">Net take-home approximately <strong className="text-green-400">£67,000</strong> on projected gross of £140k</p>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Career earnings 2020–2025</h2>
        <div className="flex items-end gap-3 h-32">
          {years.map((y, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-white font-medium">£{(y.amount / 1000).toFixed(0)}k</span>
              <div className={`w-full rounded-sm ${y.projected ? 'bg-amber-500/60' : 'bg-red-500/60'}`} style={{ height: `${(y.amount / 150000) * 100}%` }} />
              <span className="text-[10px] text-gray-500">{y.year}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-600 mt-2">Amber = projected</p>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Pending payments</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Event</span><span>Amount</span><span>Due</span><span>Status</span>
          </div>
          {[
            { ev: 'Players Ch. 19', amount: '£4,200', due: 'May 1', status: 'Pending' },
            { ev: 'Euro Tour 4', amount: '£2,800', due: 'Apr 28', status: 'Processing' },
            { ev: 'Premier League N11', amount: '£5,000', due: 'Apr 20', status: 'Paid' },
          ].map((p, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 px-4 py-2.5 border-t border-white/5 text-sm">
              <span className="text-white">{p.ev}</span>
              <span className="text-gray-300">{p.amount}</span>
              <span className="text-gray-400">{p.due}</span>
              <span className={p.status === 'Paid' ? 'text-green-400' : p.status === 'Processing' ? 'text-amber-400' : 'text-gray-400'}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LIVE SCORES VIEW ─────────────────────────────────────────────────────────
type LiveMatch = { p1: string; r1: number; p2: string; r2: number; avg1: number; avg2: number; status: 'live' | 'upcoming' | 'complete'; board: number; round: string; isJake?: boolean; time?: string };

function LiveScoresView({ player: _player }: { player: DartsPlayer }) {
  const [tab, setTab] = useState<'jake' | 'all' | 'upcoming'>('jake');

  const allMatches: LiveMatch[] = [
    { p1: 'Luke Littler', r1: 2, p2: 'Martin Schindler', r2: 0, avg1: 108.2, avg2: 94.1, status: 'live', board: 1, round: 'R1' },
    { p1: 'Michael van Gerwen', r1: 1, p2: 'Niels Zonneveld', r2: 1, avg1: 99.4, avg2: 97.8, status: 'live', board: 2, round: 'R1' },
    { p1: 'Luke Humphries', r1: 2, p2: 'Ricky Evans', r2: 0, avg1: 104.1, avg2: 91.2, status: 'live', board: 3, round: 'R1' },
    { p1: 'Jake Morrison', r1: 1, p2: 'Gerwyn Price', r2: 0, avg1: 101.4, avg2: 96.8, status: 'live', board: 4, round: 'R1', isJake: true },
    { p1: 'Rob Cross', r1: 1, p2: 'Danny Noppert', r2: 0, avg1: 96.8, avg2: 95.1, status: 'live', board: 5, round: 'R1' },
    { p1: 'Nathan Aspinall', r1: 0, p2: 'Florian Hempel', r2: 0, avg1: 0, avg2: 0, status: 'upcoming', board: 6, round: 'R1', time: '21:00' },
    { p1: 'Michael Smith', r1: 0, p2: 'Kevin Doets', r2: 0, avg1: 0, avg2: 0, status: 'upcoming', board: 7, round: 'R1', time: '21:00' },
    { p1: 'Peter Wright', r1: 2, p2: 'Bradley Brooks', r2: 1, avg1: 97.3, avg2: 94.8, status: 'complete', board: 1, round: 'R1' },
    { p1: 'Damon Heta', r1: 2, p2: 'Callan Rydz', r2: 0, avg1: 98.1, avg2: 88.4, status: 'complete', board: 2, round: 'R1' },
  ];

  const jakeVisits = [
    { visit: 1, jake: 60, price: 60, jakeLeft: 441, priceLeft: 441 },
    { visit: 2, jake: 100, price: 81, jakeLeft: 341, priceLeft: 360 },
    { visit: 3, jake: 60, price: 60, jakeLeft: 281, priceLeft: 300 },
    { visit: 4, jake: 140, price: 89, jakeLeft: 141, priceLeft: 211 },
    { visit: 5, jake: 60, price: 60, jakeLeft: 81, priceLeft: 151 },
  ];

  const live = allMatches.filter(m => m.status === 'live');
  const complete = allMatches.filter(m => m.status === 'complete');
  const upcoming = allMatches.filter(m => m.status === 'upcoming');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white">Live Scores</h1>
          <p className="text-gray-400 text-sm mt-1">PDC European Championship · Dortmund · April 8 2025</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-red-400 font-medium">Live · 5 matches in progress</span>
        </div>
      </div>

      <div className="flex rounded-lg border border-white/5 overflow-hidden w-fit">
        {(['jake', 'all', 'upcoming'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-xs font-medium transition-colors border-r border-white/5 last:border-r-0 ${tab === t ? 'bg-red-600/20 text-red-300' : 'bg-gray-900/40 text-gray-500 hover:text-gray-300'}`}>
            {t === 'jake' ? "Jake's match" : t === 'all' ? 'All matches' : 'Upcoming'}
          </button>
        ))}
      </div>

      {tab === 'jake' && (
        <div className="space-y-4">
          <div className="bg-gray-900/60 rounded-xl border border-red-500/20 p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-red-400 font-medium uppercase tracking-wide">🔴 Live · R1 · Board 4 · Set 1</span>
              <span className="text-xs text-gray-500">PDC European Championship</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div>
                <p className="text-white font-medium">Jake Morrison 🏴󠁧󠁢󠁥󠁮󠁧󠁿</p>
                <p className="text-xs text-gray-500 mb-3">#19 PDC</p>
                <p className="text-5xl font-medium text-white">1</p>
                <p className="text-xs text-gray-500 mt-1">legs</p>
                <p className="text-2xl font-medium text-red-400 mt-3">81</p>
                <p className="text-xs text-gray-500">remaining · on checkout</p>
                <p className="text-xs text-green-400 mt-1">→ T19 D12 or T15 D18</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-gray-600 text-2xl font-medium">vs</p>
                <div className="mt-4 space-y-1 text-xs text-gray-500">
                  <p>avg: 101.4 · 96.8</p>
                  <p>180s: 1 · 0</p>
                  <p>Sets: 0 · 0</p>
                </div>
              </div>
              <div>
                <p className="text-white font-medium">Gerwyn Price 🏴󠁧󠁢󠁷󠁬󠁳󠁿</p>
                <p className="text-xs text-gray-500 mb-3">#7 PDC</p>
                <p className="text-5xl font-medium text-gray-400">0</p>
                <p className="text-xs text-gray-500 mt-1">legs</p>
                <p className="text-2xl font-medium text-gray-300 mt-3">151</p>
                <p className="text-xs text-gray-500">remaining</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-white font-medium mb-3">Current leg — visit by visit</h2>
            <div className="rounded-xl border border-white/5 overflow-hidden">
              <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
                <span>Visit</span><span>Jake</span><span>Jake left</span><span>Price</span><span>Price left</span>
              </div>
              {jakeVisits.map((v, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 px-4 py-2.5 border-t border-white/5 text-sm">
                  <span className="text-gray-500">{v.visit}</span>
                  <span className={`font-medium ${v.jake >= 140 ? 'text-red-400' : v.jake >= 100 ? 'text-amber-400' : 'text-gray-300'}`}>{v.jake}</span>
                  <span className="text-gray-300">{v.jakeLeft}</span>
                  <span className="text-gray-400">{v.price}</span>
                  <span className="text-gray-400">{v.priceLeft}</span>
                </div>
              ))}
              <div className="grid grid-cols-5 gap-2 px-4 py-2.5 border-t border-white/5 text-sm bg-red-950/20">
                <span className="text-gray-500">Now</span>
                <span className="text-red-400 font-medium">On finish</span>
                <span className="text-red-300 font-medium">81</span>
                <span className="text-gray-400">—</span>
                <span className="text-gray-400">151</span>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-900/60 rounded-xl border border-white/5 text-sm text-gray-400">
            H2H: Jake leads <span className="text-white font-medium">8–3</span> · Jake&apos;s avg vs Price: <span className="text-white font-medium">99.4</span> · Win probability tonight: <span className="text-green-400 font-medium">62%</span>
          </div>
        </div>
      )}

      {tab === 'all' && (
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">In progress ({live.length})</p>
            <div className="space-y-2">
              {live.map((m, i) => (
                <div key={i} className={`grid grid-cols-7 gap-2 px-4 py-3 rounded-xl border text-sm items-center ${m.isJake ? 'bg-red-950/20 border-red-500/20' : 'bg-gray-900/60 border-white/5'}`}>
                  <span className="col-span-2 text-gray-200 font-medium">{m.p1} {m.isJake ? '⭐' : ''}</span>
                  <span className="text-center">
                    <span className="text-white font-medium text-lg">{m.r1}</span>
                    <span className="text-gray-600 mx-1">–</span>
                    <span className="text-gray-400 text-lg">{m.r2}</span>
                  </span>
                  <span className="col-span-2 text-gray-400 text-right">{m.p2}</span>
                  <span className="text-gray-600 text-xs text-right col-span-2">avg {m.avg1} · {m.avg2}</span>
                </div>
              ))}
            </div>
          </div>

          {complete.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Completed ({complete.length})</p>
              <div className="space-y-2">
                {complete.map((m, i) => (
                  <div key={i} className="grid grid-cols-7 gap-2 px-4 py-3 rounded-xl border border-white/5 bg-gray-900/30 text-sm items-center opacity-70">
                    <span className="col-span-2 text-gray-300">{m.p1}</span>
                    <span className="text-center">
                      <span className="text-white font-medium">{m.r1}</span>
                      <span className="text-gray-600 mx-1">–</span>
                      <span className="text-gray-500">{m.r2}</span>
                    </span>
                    <span className="col-span-2 text-gray-500 text-right">{m.p2}</span>
                    <span className="text-gray-600 text-xs text-right col-span-2">Final · avg {m.avg1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'upcoming' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Later tonight ({upcoming.length} matches)</p>
          {upcoming.map((m, i) => (
            <div key={i} className="grid grid-cols-7 gap-2 px-4 py-3 rounded-xl border border-white/5 bg-gray-900/60 text-sm items-center">
              <span className="col-span-2 text-gray-300">{m.p1}</span>
              <span className="text-center text-gray-500">vs</span>
              <span className="col-span-2 text-gray-300 text-right">{m.p2}</span>
              <span className="text-gray-500 text-xs text-right col-span-2">Board {m.board} · {m.time}</span>
            </div>
          ))}
          <p className="text-xs text-gray-600 mt-3 text-center">Quarter-finals draw tomorrow following R1 completion</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 px-4 py-3 bg-gray-900/40 rounded-xl border border-white/5 text-xs text-gray-500">
        <span>Most 180s today: <span className="text-white">Littler (4)</span></span>
        <span>Highest finish: <span className="text-white">161 (Humphries)</span></span>
        <span>Highest avg: <span className="text-white">108.2 (Littler)</span></span>
        <span>Total 180s: <span className="text-white">31</span></span>
        <span className="ml-auto text-gray-600">* Demo data · Live would update from DartConnect every 3s</span>
      </div>
    </div>
  );
}

// ─── ACADEMY & DEV VIEW ───────────────────────────────────────────────────────
function AcademyDevView({ player: _player }: { player: DartsPlayer }) {
  const devTour = [
    { pos: 1, name: 'Gian van Veen', flag: '🇳🇱', earned: 18400 },
    { pos: 2, name: 'Niko Springer', flag: '🇩🇪', earned: 14200 },
    { pos: 3, name: 'Nathan Rafferty', flag: '🇮🇪', earned: 12800 },
    { pos: 4, name: 'Bradley Brooks', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earned: 11400 },
    { pos: 5, name: 'James Beeton', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earned: 9600 },
    { pos: 6, name: 'Dylan Slevin', flag: '🇮🇪', earned: 8200 },
    { pos: 7, name: 'Connor Scutt', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earned: 7400 },
    { pos: 8, name: 'Rhys Griffin', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', earned: 6800 },
  ];
  const challengeTour = [
    { pos: 1, name: 'Berry van Peer', flag: '🇳🇱', earned: 22800 },
    { pos: 2, name: 'Owen Bates', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earned: 19400 },
    { pos: 3, name: 'Christian Kist', flag: '🇳🇱', earned: 17200 },
    { pos: 4, name: 'Lewy Williams', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', earned: 14600 },
    { pos: 5, name: 'Paul Hogan', flag: '🇮🇪', earned: 12100 },
    { pos: 6, name: 'Alan Warriner', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earned: 10800 },
    { pos: 7, name: 'Robert Owen', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', earned: 9200 },
    { pos: 8, name: 'Scott Williams', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earned: 8100 },
  ];
  const pathway = [
    { level: 'County / grassroots', detail: 'BDO-affiliated regional play' },
    { level: 'PDC Development Tour', detail: 'Ages 16–24 · 24 events/yr · Top 2 → Tour Card' },
    { level: 'PDC Challenge Tour', detail: 'Open · 24 events/yr · Top 2 → Tour Card' },
    { level: 'PDC Pro Tour', detail: '128 tour card holders · PC + Euro Tour' },
    { level: 'Premier League / Majors', detail: 'Top 8 invitation only' },
  ];
  const careerPath = [
    { year: 2018, event: 'County darts — Yorkshire' },
    { year: 2019, event: 'Q-School attempt — unsuccessful' },
    { year: 2020, event: 'Challenge Tour — finished #8' },
    { year: 2021, event: 'Q-School — won Tour Card (day 3, final stage)' },
    { year: 2022, event: 'First season on Tour — ranked #89' },
    { year: 2023, event: 'Improved to #31' },
    { year: 2024, event: 'Career high #12' },
    { year: 2025, event: 'Currently #19 · targeting Top 10' },
  ];
  const fmt = (n: number) => `£${n.toLocaleString()}`;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Academy &amp; Development</h1>
        <p className="text-gray-400 text-sm mt-1">PDC Development Tour · Challenge Tour · Junior pathway</p>
      </div>

      <div className="px-4 py-3 bg-gray-900/60 rounded-xl border border-white/5 text-sm">
        <span className="text-gray-400">As a PDC Tour Card holder you are above the development pathway. This section tracks the routes players take to reach the Pro Tour and monitors development players in your network.</span>
      </div>

      <div>
        <h2 className="text-white font-medium mb-3">PDC development pathway</h2>
        <div className="space-y-2">
          {pathway.map((p, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`flex-1 px-4 py-3 rounded-xl border text-sm ${i === 3 ? 'bg-red-950/30 border-red-500/30' : 'bg-gray-900/60 border-white/5'}`}>
                <span className={`font-medium ${i === 3 ? 'text-red-300' : 'text-gray-200'}`}>{i === 3 ? '⭐ ' : ''}{p.level}</span>
                <span className="text-gray-500 text-xs ml-2">{p.detail}</span>
              </div>
              {i < pathway.length - 1 && <span className="text-gray-700 text-xs flex-shrink-0">↓</span>}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2">⭐ = Jake&apos;s current level</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-medium">Development Tour 2025 — top 8</h2>
          <span className="text-xs text-gray-500">Ages 16–24 · Top 2 earn Tour Card</span>
        </div>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>#</span><span className="col-span-2">Player</span><span>Earned</span>
          </div>
          {devTour.map((p, i) => (
            <div key={i} className={`grid grid-cols-4 gap-2 px-4 py-2.5 border-t border-white/5 text-sm ${i < 2 ? 'bg-green-950/10' : ''}`}>
              <span className={i < 2 ? 'text-green-400 font-medium' : 'text-gray-500'}>#{p.pos}</span>
              <span className="col-span-2 text-gray-200">
                {p.flag} {p.name}
                {i < 2 && <span className="ml-2 text-[10px] text-green-400">→ Tour Card</span>}
              </span>
              <span className="text-gray-400">{fmt(p.earned)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-sm bg-green-950/40 border border-green-700/30" />
          Tour Card boundary between #2 and #3 · Gap: £1,400
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-medium">Challenge Tour 2025 — top 8</h2>
          <span className="text-xs text-gray-500">Open entry · Top 2 earn Tour Card</span>
        </div>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>#</span><span className="col-span-2">Player</span><span>Earned</span>
          </div>
          {challengeTour.map((p, i) => (
            <div key={i} className={`grid grid-cols-4 gap-2 px-4 py-2.5 border-t border-white/5 text-sm ${i < 2 ? 'bg-green-950/10' : ''}`}>
              <span className={i < 2 ? 'text-green-400 font-medium' : 'text-gray-500'}>#{p.pos}</span>
              <span className="col-span-2 text-gray-200">
                {p.flag} {p.name}
                {i < 2 && <span className="ml-2 text-[10px] text-green-400">→ Tour Card</span>}
              </span>
              <span className="text-gray-400">{fmt(p.earned)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-5">
        <h2 className="text-white font-medium mb-3">Development player — your network</h2>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white font-medium">Jack Sherwood</p>
            <p className="text-gray-500 text-xs mt-0.5">Age 19 · Sheffield · Challenge Tour</p>
          </div>
          <span className="text-xs text-amber-400 bg-amber-950/30 border border-amber-700/30 px-2 py-1 rounded-lg">CT #18</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          {[
            { label: 'Last result', value: 'R2 exit (CT 6)' },
            { label: 'Earned', value: '£800' },
            { label: 'Next event', value: 'CT 7 · Apr 26' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-800/40 rounded-lg p-2.5">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-sm text-gray-200 mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-white font-medium mb-3">Your career pathway</h2>
        <div className="space-y-0">
          {careerPath.map((c, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === careerPath.length - 1 ? 'bg-red-500' : 'bg-gray-700'}`} />
                {i < careerPath.length - 1 && <div className="w-px flex-1 bg-gray-800 min-h-[24px]" />}
              </div>
              <div className="pb-4">
                <span className="text-xs text-gray-600 font-medium">{c.year}</span>
                <p className={`text-sm ${i === careerPath.length - 1 ? 'text-white font-medium' : 'text-gray-400'}`}>{c.event}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PAIRS & TEAM EVENTS VIEW ─────────────────────────────────────────────────
function PairsEventsView({ player }: { player: DartsPlayer }) {
  const englishPlayers = [
    { pos: 1, pdcPos: 1, name: 'Luke Littler', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', selected: true, isJake: false },
    { pos: 2, pdcPos: 6, name: 'Michael Smith', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', selected: true, isJake: false },
    { pos: 3, pdcPos: 9, name: 'Rob Cross', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', selected: false, isJake: false },
    { pos: 4, pdcPos: 12, name: 'Dave Chisnall', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', selected: false, isJake: false },
    { pos: 5, pdcPos: 19, name: 'Jake Morrison', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', selected: false, isJake: true },
  ];
  const wcEvents = [
    { year: 2023, result: 'Did not qualify', detail: 'Pre-top-64 era' },
    { year: 2024, result: 'Did not qualify', detail: '#31 PDC — just missed England top 4' },
    { year: 2025, result: 'Not selected', detail: '#19 PDC — 5th English player' },
    { year: 2026, result: 'Target', detail: 'Need to pass Cross or Chisnall' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Pairs &amp; Team Events</h1>
        <p className="text-gray-400 text-sm mt-1">World Cup of Darts · World Pairs · National team</p>
      </div>

      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-medium">England national team</h2>
          <span className="text-xs text-amber-400 bg-amber-950/30 border border-amber-700/30 px-2 py-1 rounded-lg">#5 English player — not selected</span>
        </div>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Eng rank</span><span className="col-span-2">Player</span><span>PDC rank</span>
          </div>
          {englishPlayers.map((p, i) => (
            <div key={i} className={`grid grid-cols-4 gap-2 px-4 py-3 border-t border-white/5 text-sm items-center ${p.isJake ? 'bg-red-950/10' : p.selected ? 'bg-green-950/10' : ''}`}>
              <span className={p.selected ? 'text-green-400 font-medium' : p.isJake ? 'text-red-400 font-medium' : 'text-gray-500'}>#{p.pos}</span>
              <span className="col-span-2 text-gray-200 font-medium">
                {p.flag} {p.name}
                {p.selected && <span className="ml-2 text-[10px] text-green-400">✅ Selected</span>}
                {p.isJake && <span className="ml-2 text-[10px] text-red-400">← You</span>}
              </span>
              <span className="text-gray-500">#{p.pdcPos}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 px-4 py-3 bg-amber-950/30 border border-amber-700/30 rounded-xl text-sm">
          <span className="text-amber-300">⚠️ </span>
          <span className="text-gray-300">To make the World Cup squad Jake needs to pass <span className="text-white font-medium">Rob Cross (#9 PDC)</span> in the Order of Merit. Gap: approximately £82,000.</span>
        </div>
      </div>

      <div>
        <h2 className="text-white font-medium mb-3">World Cup of Darts</h2>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { label: 'Format', value: 'Pairs · nations compete' },
            { label: 'Venue', value: 'Frankfurt, Germany' },
            { label: 'Prize fund', value: '£800,000+' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-3">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-sm text-gray-200 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Year</span><span>Result</span><span>Context</span>
          </div>
          {wcEvents.map((e, i) => (
            <div key={i} className={`grid grid-cols-3 gap-2 px-4 py-2.5 border-t border-white/5 text-sm ${i === wcEvents.length - 1 ? 'bg-red-950/10' : ''}`}>
              <span className="text-gray-500">{e.year}</span>
              <span className={i === wcEvents.length - 1 ? 'text-red-400 font-medium' : 'text-gray-400'}>{e.result}</span>
              <span className="text-gray-600 text-xs">{e.detail}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-medium">PDC World Pairs Championship</h2>
          <span className="text-xs text-green-400 bg-green-950/30 border border-green-700/30 px-2 py-1 rounded-lg">✅ Entered</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-2">Pairing</p>
            <p className="text-white font-medium">{player.name} + Mark &ldquo;The Spider&rdquo; Webb</p>
            <p className="text-gray-500 text-xs mt-1">Event: August 2025 · Minehead (Butlins)</p>
            <p className="text-gray-500 text-xs">Last year: R2 exit · £800 each</p>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Combined avg', value: '96.4' },
              { label: `${player.name.split(' ')[0]}'s doubles %`, value: '41.2%' },
              { label: "Mark's doubles %", value: '38.7%' },
            ].map((s, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-500">{s.label}</span>
                <span className="text-white font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 bg-gray-900/60 rounded-xl border border-white/5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Premier League — 2026 target</p>
        <p className="text-sm text-gray-300">The Premier League features 8 invited players. Jake is not currently in the PL but a Top 10 OoM finish this season makes a 2026 invitation likely.</p>
        <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 rounded-full" style={{ width: '62%' }} />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>Current: #19</span>
          <span>PL threshold: Top 10</span>
        </div>
      </div>
    </div>
  );
}

function StubView({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-medium text-white mb-2">{title}</h1>
      <p className="text-gray-400">{sub}</p>
    </div>
  );
}

// ─── Entry Manager ────────────────────────────────────────────────────────────
function EntryManagerView({ player: _player }: { player: DartsPlayer }) {
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  type EntryStatus = 'confirmed' | 'action' | 'auto' | 'pending' | 'invited';

  const events: Array<{
    event: string; date: string; type: string;
    status: EntryStatus; qualification: string;
    deadline: string; actionNeeded: boolean;
  }> = [
    { event: 'European Championship', date: 'Apr 8 (tonight)', type: 'Euro Tour', status: 'confirmed', qualification: 'Auto (OoM Top 16)', deadline: 'Past', actionNeeded: false },
    { event: 'Prague Open',           date: 'Apr 25–27',      type: 'Euro Tour',   status: 'action',    qualification: 'Auto-qualified (OoM #19)', deadline: 'Apr 19', actionNeeded: true },
    { event: 'Players Ch. 9',         date: 'Apr 26',          type: 'Players Ch.', status: 'auto',      qualification: 'Tour card holder', deadline: 'Auto', actionNeeded: false },
    { event: 'Players Ch. 10',        date: 'Apr 27',          type: 'Players Ch.', status: 'auto',      qualification: 'Tour card holder', deadline: 'Auto', actionNeeded: false },
    { event: 'German Masters',        date: 'May 2–4',         type: 'Euro Tour',   status: 'action',    qualification: 'Auto-qualified (OoM #19)', deadline: 'Apr 26', actionNeeded: true },
    { event: 'Players Ch. 11',        date: 'May 3',           type: 'Players Ch.', status: 'auto',      qualification: 'Tour card holder', deadline: 'Auto', actionNeeded: false },
    { event: 'Players Ch. 12',        date: 'May 4',           type: 'Players Ch.', status: 'auto',      qualification: 'Tour card holder', deadline: 'Auto', actionNeeded: false },
    { event: 'Bahrain Masters',       date: 'May 9–11',        type: 'Euro Tour',   status: 'pending',   qualification: 'Auto-qualified', deadline: 'May 3', actionNeeded: false },
    { event: 'UK Open',               date: 'May 30–Jun 1',    type: 'Ranking Major', status: 'auto',    qualification: 'Tour card holder', deadline: 'Auto', actionNeeded: false },
    { event: 'Nordic Masters',        date: 'Jun 13–15',       type: 'World Series', status: 'invited',  qualification: 'Invited (OoM Top 32)', deadline: 'Jun 7', actionNeeded: true },
    { event: 'World Matchplay',       date: 'Jul 18–27',       type: 'Major',        status: 'confirmed',qualification: 'Qualified (OoM Top 32)', deadline: 'Auto', actionNeeded: false },
  ];

  const statusConfig: Record<EntryStatus, { label: string; dot: string; row: string }> = {
    confirmed: { label: '✅ Confirmed',      dot: 'bg-green-500',  row: '' },
    action:    { label: '⚠️ Action needed',  dot: 'bg-amber-400',  row: 'bg-amber-950/20' },
    auto:      { label: '✅ Auto-entered',   dot: 'bg-blue-500',   row: '' },
    pending:   { label: '⏳ Not yet open',   dot: 'bg-gray-500',   row: '' },
    invited:   { label: '📨 Invite pending', dot: 'bg-purple-400', row: 'bg-purple-950/10' },
  };

  return (
    <div className="p-6 space-y-6 relative">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-medium text-white">Entry Manager</h1>
        <p className="text-gray-400 text-sm mt-1">PDC PDPA entry system · Tournament entries · Deadlines · Withdrawals</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Upcoming entries confirmed', value: '8', color: 'text-green-400' },
          { label: 'Deadline passed',            value: '2', color: 'text-gray-400' },
          { label: 'Action required',            value: '2', color: 'text-amber-400' },
        ].map((c, i) => (
          <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-3xl font-medium ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-950/30 border border-amber-700/30 text-sm">
        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <span className="text-amber-200">
          <strong>Prague Open entry deadline Apr 19</strong> — 6 days away. You are auto-qualified via OoM. Confirm or skip below.
        </span>
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
          <span className="col-span-3">Event</span>
          <span className="col-span-2">Date</span>
          <span className="col-span-2">Type</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2">Deadline</span>
          <span className="col-span-1">Action</span>
        </div>
        {events.map((ev, i) => {
          const cfg = statusConfig[ev.status];
          return (
            <div key={i} className={`grid grid-cols-12 gap-2 px-4 py-3 border-t border-white/5 text-sm items-center ${cfg.row}`}>
              <span className="col-span-3 text-gray-200 font-medium">{ev.event}</span>
              <span className="col-span-2 text-gray-400">{ev.date}</span>
              <span className="col-span-2">
                <span className="text-xs bg-gray-800/60 border border-white/5 rounded px-1.5 py-0.5 text-gray-400">{ev.type}</span>
              </span>
              <span className="col-span-2 flex items-center gap-1.5 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <span className="text-gray-300">{cfg.label}</span>
              </span>
              <span className={`col-span-2 text-xs ${ev.actionNeeded ? 'text-amber-400 font-medium' : 'text-gray-500'}`}>{ev.deadline}</span>
              <span className="col-span-1 flex gap-1">
                {ev.actionNeeded && (
                  <>
                    <button onClick={() => showToast('Entry confirmed (demo — would submit via PDPA portal)')} className="px-2 py-1 bg-green-600/20 border border-green-500/30 text-green-400 text-[11px] rounded hover:bg-green-600/30">Enter</button>
                    <button onClick={() => showToast('Entry skipped for this event')} className="px-2 py-1 bg-gray-800/40 border border-white/5 text-gray-500 text-[11px] rounded hover:text-gray-300">Skip</button>
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="text-white font-medium mb-3">World Series invitations</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { event: 'US Masters, Las Vegas',     status: 'Expected if OoM holds Top 24', badge: '🟡 Awaited' },
            { event: 'Australian Darts Open',     status: 'Confirmed',                     badge: '✅ Confirmed' },
            { event: 'New Zealand Darts Masters', status: 'To be confirmed',               badge: '⏳ TBC' },
            { event: 'Nordic Masters',            status: 'Invitation pending (Jun 7)',    badge: '📨 Pending' },
          ].map((inv, i) => (
            <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
              <p className="text-sm font-medium text-white">{inv.event}</p>
              <p className="text-xs text-gray-500 mt-1">{inv.status}</p>
              <p className="text-xs text-gray-400 mt-2">{inv.badge}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Pressure Analysis ────────────────────────────────────────────────────────
function PressureAnalysisView({ player }: { player: DartsPlayer }) {
  const comparisons = [
    { label: 'Match average',   standard: 97.8,  pressure: 94.2, unit: '' },
    { label: 'Checkout %',      standard: 41.2,  pressure: 33.8, unit: '%' },
    { label: 'First 9 average', standard: player.firstNineAverage, pressure: 97.1, unit: '' },
    { label: 'T20 accuracy',    standard: 68,    pressure: 61,   unit: '%' },
    { label: '180s per match',  standard: 4.2,   pressure: 3.1,  unit: '' },
  ];

  const tv = [
    { label: 'Average',    tv: 99.1, floor: 97.3 },
    { label: 'Checkout %', tv: 43.7, floor: 40.1 },
    { label: '180s/match', tv: 4.8,  floor: 4.0 },
    { label: 'Win rate',   tv: 71,   floor: 66 },
  ];

  const scorelines = [
    { situation: '2 sets ahead',  avg: 99.1, co: 43.2, wr: 78 },
    { situation: '1 set ahead',   avg: 98.2, co: 41.8, wr: 72 },
    { situation: 'Level',         avg: 97.2, co: 40.8, wr: 65 },
    { situation: '1 set behind',  avg: 96.4, co: 38.2, wr: 54 },
    { situation: '2 sets behind', avg: 94.8, co: 31.1, wr: 38 },
  ];

  const tierData = [
    { tier: 'vs Top 10',     avg: 96.1, co: 38.8, wr: 42 },
    { tier: 'vs Top 11–32',  avg: 98.4, co: 41.3, wr: 68 },
    { tier: 'vs Top 33–64',  avg: 99.7, co: 43.1, wr: 79 },
    { tier: 'vs Outside 64', avg: 102.3,co: 46.7, wr: 91 },
  ];

  const gapColor = (gap: number) => gap >= 5 ? 'text-red-400' : gap >= 2 ? 'text-amber-400' : 'text-green-400';

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-medium text-white">Pressure Performance Analysis</h1>
        <p className="text-gray-400 text-sm mt-1">How your game changes when it matters most</p>
      </div>

      <div>
        <h2 className="text-white font-medium mb-3">Standard vs under pressure</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span className="col-span-2">Metric</span>
            <span>Standard</span>
            <span>Deciding leg</span>
          </div>
          {comparisons.map((c, i) => {
            const gap = Math.abs(c.standard - c.pressure);
            const worse = c.pressure < c.standard;
            return (
              <div key={i} className="grid grid-cols-4 gap-2 px-4 py-3.5 border-t border-white/5 text-sm items-center">
                <span className="col-span-2 text-gray-300">{c.label}</span>
                <span className="text-gray-400">{c.standard}{c.unit}</span>
                <div className="flex items-center gap-2">
                  <span className={worse ? 'text-red-400 font-medium' : 'text-green-400 font-medium'}>{c.pressure}{c.unit}</span>
                  <span className={`text-xs ${gapColor(gap)}`}>({worse ? '-' : '+'}{gap.toFixed(1)}{c.unit})</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 px-4 py-3 bg-red-950/30 border border-red-800/20 rounded-xl text-sm">
          <span className="text-red-300">⚠️ </span>
          <span className="text-gray-300">
            Checkout % drops <strong className="text-red-400">7.4 points</strong> in must-win situations — the biggest gap in your game. This is your primary focus area with Sarah.
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-white font-medium mb-3">TV / stage events vs floor events</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-red-400 font-medium uppercase tracking-wide mb-3">📺 TV / Stage events</p>
            {tv.map((t, i) => (
              <div key={i} className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                <span className="text-gray-400">{t.label}</span>
                <span className="text-white font-medium">{t.tv}{t.label.includes('%') || t.label.includes('rate') ? '%' : ''}</span>
              </div>
            ))}
          </div>
          <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">🏢 Floor events (PC)</p>
            {tv.map((t, i) => (
              <div key={i} className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                <span className="text-gray-400">{t.label}</span>
                <span className="text-gray-300">{t.floor}{t.label.includes('%') || t.label.includes('rate') ? '%' : ''}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 px-4 py-3 bg-green-950/30 border border-green-800/20 rounded-xl text-sm">
          <span className="text-green-400">✅ </span>
          <span className="text-gray-300">
            You average <strong className="text-green-400">1.8 pts higher on TV</strong> — you rise to the occasion. Many players see the opposite. This is a significant mental strength.
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-white font-medium mb-3">Performance by scoreline</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Situation</span><span>Average</span><span>Checkout %</span><span>Win rate</span>
          </div>
          {scorelines.map((s, i) => (
            <div key={i} className={`grid grid-cols-4 gap-2 px-4 py-3 border-t border-white/5 text-sm ${i >= 3 ? 'bg-red-950/10' : ''}`}>
              <span className={i >= 3 ? 'text-amber-300' : 'text-gray-300'}>{s.situation}</span>
              <span className="text-gray-300">{s.avg}</span>
              <span className="text-gray-300">{s.co}%</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-gray-800 rounded overflow-hidden">
                  <div className={`h-full rounded ${s.wr >= 65 ? 'bg-green-500' : s.wr >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.wr}%` }} />
                </div>
                <span className={`text-xs font-medium ${s.wr >= 65 ? 'text-green-400' : s.wr >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{s.wr}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-white font-medium mb-3">Performance by opponent ranking tier</h2>
        <div className="space-y-2">
          {tierData.map((t, i) => (
            <div key={i} className="grid grid-cols-4 gap-3 bg-gray-900/60 rounded-xl border border-white/5 px-4 py-3 text-sm">
              <span className="text-gray-300">{t.tier}</span>
              <span className="text-gray-400">avg {t.avg}</span>
              <span className="text-gray-400">co {t.co}%</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-gray-800 rounded overflow-hidden">
                  <div className={`h-full rounded ${t.wr >= 70 ? 'bg-green-500' : t.wr >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${t.wr}%` }} />
                </div>
                <span className={`text-xs font-medium ${t.wr >= 70 ? 'text-green-400' : t.wr >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{t.wr}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Mental coach — Sarah · Focus areas</p>
        <div className="space-y-3">
          {[
            { n: 1, text: 'Pre-throw routine in must-win legs — breathing pattern and stance reset before each dart' },
            { n: 2, text: 'Reducing T20 cluster drift under pressure — the data shows pulling left when behind' },
            { n: 3, text: 'Checkout confidence — start with D20 more often in deciding legs, stop switching to D16' },
          ].map(item => (
            <div key={item.n} className="flex gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{item.n}</span>
              <span className="text-gray-300">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Merit Forecaster ─────────────────────────────────────────────────────────
function MeritForecasterView({ player: _player }: { player: DartsPlayer }) {
  const [selectedRound, setSelectedRound] = useState<string>('r1-win');

  const currentOom = 687420;
  const currentRank = 19;

  const thisWeek = {
    event: 'PDC European Championship',
    location: 'Dortmund',
    prizeFund: '£500,000',
    rounds: [
      { id: 'lose',    label: 'R1 Loss',  prize: 0,      rankEstimate: 22 },
      { id: 'r1-win',  label: 'R1 Win',   prize: 11000,  rankEstimate: 19 },
      { id: 'qf',      label: 'QF',       prize: 22000,  rankEstimate: 18 },
      { id: 'sf',      label: 'SF',       prize: 50000,  rankEstimate: 16 },
      { id: 'final',   label: 'Final',    prize: 90000,  rankEstimate: 13 },
      { id: 'winner',  label: 'Winner',   prize: 110000, rankEstimate: 11 },
    ],
  };

  const remainingEvents = [
    { event: 'Prague Open',        type: 'Euro Tour',  fund: 175000,  r1: 4000,  sf: 16000, win: 25000 },
    { event: 'Players Ch. 9 & 10', type: 'PC (×2)',    fund: 250000,  r1: 4000,  sf: 16000, win: 30000 },
    { event: 'German Masters',     type: 'Euro Tour',  fund: 175000,  r1: 4000,  sf: 16000, win: 25000 },
    { event: 'PC 11, 12 + Euro',   type: 'Mixed (×3)', fund: 425000,  r1: 9000,  sf: 32000, win: 65000 },
    { event: 'UK Open',            type: 'Ranking',    fund: 500000,  r1: 4000,  sf: 50000, win: 100000 },
    { event: 'PC 13–18 (×6)',      type: 'PC',         fund: 750000,  r1: 12000, sf: 48000, win: 90000 },
    { event: 'World Matchplay',    type: 'Major',      fund: 800000,  r1: 13000, sf: 100000,win: 200000 },
    { event: 'World Grand Prix',   type: 'Major',      fund: 750000,  r1: 12000, sf: 90000, win: 187500 },
    { event: 'Grand Slam',         type: 'Major',      fund: 700000,  r1: 10000, sf: 75000, win: 175000 },
    { event: 'PC Finals',          type: 'Major',      fund: 500000,  r1: 8000,  sf: 60000, win: 120000 },
    { event: 'World Championship', type: 'Major',      fund: 5000000, r1: 35000, sf: 300000,win: 700000 },
  ];

  const milestones = [
    { label: 'Top 32 (PC seeding)',        threshold: 600000,  achieved: true  },
    { label: 'Top 16 (Euro Tour seeding)', threshold: 720000,  achieved: false },
    { label: 'Top 10 (PL invitation)',     threshold: 850000,  achieved: false },
    { label: 'Top 8 (PL confirmed)',       threshold: 1100000, achieved: false },
  ];

  const selected = thisWeek.rounds.find(r => r.id === selectedRound) || thisWeek.rounds[1];
  const newOom = currentOom + selected.prize;
  const fmt = (n: number) => `£${n.toLocaleString()}`;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Merit Forecaster</h1>
        <p className="text-gray-400 text-sm mt-1">Simulate prize money outcomes · PDC Order of Merit (rolling 2-year)</p>
      </div>

      {/* This week simulator */}
      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-medium">{thisWeek.event}</h2>
            <p className="text-gray-500 text-sm">{thisWeek.location} · Prize fund {thisWeek.prizeFund}</p>
          </div>
          <span className="text-xs text-red-400 font-medium px-2 py-1 bg-red-500/10 rounded-lg border border-red-500/20">In progress tonight</span>
        </div>

        <div className="grid grid-cols-6 gap-2 mb-5">
          {thisWeek.rounds.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRound(r.id)}
              className={`rounded-lg border p-3 text-center transition-all ${selectedRound === r.id ? 'bg-red-600/20 border-red-500/40' : 'bg-gray-800/40 border-white/5 hover:border-white/10'}`}
            >
              <p className={`text-xs font-medium ${selectedRound === r.id ? 'text-red-300' : 'text-gray-400'}`}>{r.label}</p>
              <p className={`text-sm font-medium mt-1 ${selectedRound === r.id ? 'text-white' : 'text-gray-300'}`}>
                {r.prize === 0 ? '—' : fmt(r.prize)}
              </p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Prize this week', value: fmt(selected.prize) },
            { label: 'New OoM total',   value: fmt(newOom) },
            { label: 'Estimated rank',  value: `#${selected.rankEstimate}` },
            { label: 'Rank change',     value: selected.rankEstimate < currentRank
              ? `▲ ${currentRank - selected.rankEstimate}`
              : selected.rankEstimate > currentRank
              ? `▼ ${selected.rankEstimate - currentRank}`
              : '— No change' },
          ].map((item, i) => (
            <div key={i} className="bg-gray-800/60 rounded-lg p-3">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className={`text-lg font-medium mt-1 ${i === 3 && selected.rankEstimate < currentRank ? 'text-green-400' : i === 3 && selected.rankEstimate > currentRank ? 'text-red-400' : 'text-white'}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Remaining events table */}
      <div>
        <h2 className="text-white font-medium mb-3">Season earnings potential</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span className="col-span-2">Event</span>
            <span>R1 win</span>
            <span>Semi-final</span>
            <span>Winner</span>
          </div>
          {remainingEvents.map((ev, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 px-4 py-3 border-t border-white/5 text-sm hover:bg-gray-800/20 transition-colors">
              <div className="col-span-2">
                <p className="text-gray-200">{ev.event}</p>
                <p className="text-xs text-gray-500">{ev.type}</p>
              </div>
              <span className="text-gray-400">{fmt(ev.r1)}</span>
              <span className="text-gray-300">{fmt(ev.sf)}</span>
              <span className="text-green-400">{fmt(ev.win)}</span>
            </div>
          ))}
          <div className="grid grid-cols-5 gap-2 px-4 py-3 border-t border-white/10 bg-gray-900/60 text-sm font-medium">
            <span className="col-span-2 text-gray-300">Maximum possible</span>
            <span className="text-gray-300">{fmt(remainingEvents.reduce((s, e) => s + e.r1, 0))}</span>
            <span className="text-gray-200">{fmt(remainingEvents.reduce((s, e) => s + e.sf, 0))}</span>
            <span className="text-green-300">{fmt(remainingEvents.reduce((s, e) => s + e.win, 0))}</span>
          </div>
        </div>
      </div>

      {/* Milestone tracker */}
      <div>
        <h2 className="text-white font-medium mb-3">Rank milestone tracker</h2>
        <div className="space-y-3">
          {milestones.map((m, i) => {
            const pct = Math.min(100, Math.round((currentOom / m.threshold) * 100));
            const gap = Math.max(0, m.threshold - currentOom);
            return (
              <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-200">{m.label}</span>
                  {m.achieved
                    ? <span className="text-xs text-green-400 font-medium">✅ Achieved</span>
                    : <span className="text-xs text-gray-500">Need {fmt(gap)} more</span>}
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${m.achieved ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                  <span>{fmt(currentOom)}</span>
                  <span>Target: {fmt(m.threshold)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Tour Card Monitor ────────────────────────────────────────────────────────
function TourCardMonitorView({ player }: { player: DartsPlayer }) {
  const [targetRank, setTargetRank] = useState(19);

  const currentOom = 687420;
  const rank64threshold = 498000;
  const buffer = currentOom - rank64threshold;

  const dropOffs = [
    { week: 17, event: 'Players Ch. 8 (2023)',       amount: 4200,  date: 'Apr 14' },
    { week: 18, event: 'Euro Tour – Prague (2023)',  amount: 12000, date: 'Apr 21' },
    { week: 19, event: 'Players Ch. 10 (2023)',      amount: 2000,  date: 'Apr 28' },
    { week: 20, event: 'Players Ch. 11 (2023)',      amount: 8000,  date: 'May 5'  },
    { week: 21, event: 'Players Ch. 12 (2023)',      amount: 4200,  date: 'May 12' },
    { week: 22, event: 'Euro Tour – Germany (2023)', amount: 18000, date: 'May 19' },
    { week: 23, event: 'Players Ch. 14 (2023)',      amount: 2000,  date: 'May 26' },
    { week: 24, event: 'World Matchplay QF (2023)',  amount: 22500, date: 'Jun 2'  },
    { week: 25, event: 'Players Ch. 15–18 (2023)',   amount: 6400,  date: 'Jun–Jul'},
    { week: 29, event: 'Euro Tour – Austria (2023)', amount: 8000,  date: 'Jul 21' },
    { week: 30, event: 'Players Ch. 19 (2023)',      amount: 4200,  date: 'Jul 28' },
  ];

  const rankScenarios = [
    { label: 'Hold #19',            target: 19, needed: 42000  },
    { label: 'Break Top 16',        target: 16, needed: 152580 },
    { label: 'Break Top 10',        target: 10, needed: 312580 },
    { label: 'Stay safe (Top 64)',  target: 64, needed: 0      },
  ];

  const scenarioForRank = rankScenarios.find(s => s.target <= targetRank) || rankScenarios[3];
  const fmt = (n: number) => `£${n.toLocaleString()}`;

  let runningTotal = currentOom;

  return (
    <div className="p-6 space-y-6 tour-card-content">
      <style dangerouslySetInnerHTML={{ __html: `
@media print {
  body { background: white !important; color: black !important; }
  aside, nav, .quick-actions, .print\\:hidden { display: none !important; }
  .tour-card-content { max-width: 100% !important; padding: 0 !important; }
  .bg-gray-900\\/60, .bg-gray-800\\/40 { background: #f5f5f5 !important; border: 1px solid #ddd !important; }
  .bg-green-950\\/40 { background: #f0fdf4 !important; border: 1px solid #bbf7d0 !important; }
  .text-white { color: black !important; }
  .text-gray-400, .text-gray-300, .text-gray-500 { color: #555 !important; }
  .text-red-400, .text-red-300 { color: #c41e3a !important; }
  .text-green-400, .text-green-300 { color: #166534 !important; }
  .border-white\\/5, .border-gray-800 { border-color: #ddd !important; }
  h1 { font-size: 18pt !important; }
  h2 { font-size: 13pt !important; }
  p, span { font-size: 10pt !important; }
}
      ` }} />
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white">Tour Card Monitor</h1>
          <p className="text-gray-400 text-sm mt-1">PDC Order of Merit · Rolling 2-year window · Tour card held by top 64</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 bg-gray-800/60 border border-white/5 text-gray-400 text-xs rounded-lg hover:text-gray-200 flex items-center gap-1.5 print:hidden"
        >
          <FileText className="w-3 h-3" />
          Export PDF
        </button>
      </div>

      {/* Status banner */}
      <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-green-950/40 border border-green-700/30">
        <span className="text-2xl">✅</span>
        <div>
          <p className="text-green-300 font-medium">SAFE — You hold #{player.pdcRank}</p>
          <p className="text-green-400/70 text-sm">The 64th-place threshold is {fmt(buffer)} below your current OoM total.</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Current OoM',     value: fmt(currentOom),     sub: `#${player.pdcRank} PDC` },
          { label: '64th place at',   value: fmt(rank64threshold),sub: 'Approximate threshold' },
          { label: 'Buffer above cut',value: fmt(buffer),         sub: 'Your safety margin' },
          { label: 'Card expires',    value: 'Jan 4 2026',        sub: '9 months remaining' },
        ].map((k, i) => (
          <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className="text-xl font-medium text-white">{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Drop-off table */}
      <div>
        <h2 className="text-white font-medium mb-3">Prize money dropping off your OoM — next 12 weeks</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-5 gap-4 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Wk</span>
            <span className="col-span-2">Tournament</span>
            <span>Drops</span>
            <span>New OoM</span>
          </div>
          {dropOffs.map((row, i) => {
            runningTotal -= row.amount;
            const danger = runningTotal - rank64threshold < 50000;
            return (
              <div key={i} className={`grid grid-cols-5 gap-4 px-4 py-3 border-t border-white/5 text-sm ${danger ? 'bg-amber-950/20' : ''}`}>
                <span className="text-gray-500">Wk {row.week}</span>
                <span className="col-span-2 text-gray-300">{row.event}</span>
                <span className={danger ? 'text-amber-400' : 'text-red-400'}>-{fmt(row.amount)}</span>
                <span className={danger ? 'text-amber-300 font-medium' : 'text-gray-300'}>{fmt(runningTotal)}</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">* Amber rows = within £50,000 of the 64th-place cut if unmatched</p>
      </div>

      {/* What do I need calculator */}
      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-5">
        <h2 className="text-white font-medium mb-4">What do I need to earn?</h2>

        <div className="flex flex-wrap gap-2 mb-5">
          {rankScenarios.map((s, i) => (
            <button
              key={i}
              onClick={() => setTargetRank(s.target)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${targetRank === s.target ? 'bg-red-600/20 border-red-500/40 text-red-300' : 'bg-gray-800/60 border-white/5 text-gray-400 hover:text-gray-200'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 mb-5">
          <span className="text-xs text-gray-500 w-24">Target rank</span>
          <input
            type="range" min={1} max={64} value={targetRank}
            onChange={e => setTargetRank(Number(e.target.value))}
            className="flex-1 accent-red-500"
          />
          <span className="text-white font-medium w-8">#{targetRank}</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Target OoM',   value: fmt(currentOom + (scenarioForRank?.needed ?? 0)) },
            { label: 'Current OoM',  value: fmt(currentOom) },
            { label: 'Need to earn', value: fmt(Math.max(0, scenarioForRank?.needed ?? 0)) },
          ].map((item, i) => (
            <div key={i} className="bg-gray-800/40 rounded-lg p-3">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-lg font-medium text-white mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Card timeline */}
      <div>
        <h2 className="text-white font-medium mb-3">Tour card timeline</h2>
        <div className="relative bg-gray-900/60 rounded-xl border border-white/5 p-5">
          <div className="relative h-2 bg-gray-800 rounded-full">
            <div className="absolute left-0 top-0 h-full bg-red-600 rounded-full" style={{ width: '55%' }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900" style={{ left: '55%' }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-3">
            <span>Q-School Jan 2024<br/><span className="text-gray-600">Card start</span></span>
            <span className="text-red-400 font-medium">Apr 2025<br/>NOW</span>
            <span className="text-right">Jan 4 2026<br/><span className="text-gray-600">Expires</span></span>
          </div>
        </div>
      </div>

      {/* Q-School info */}
      <details className="bg-gray-900/60 rounded-xl border border-white/5">
        <summary className="px-5 py-4 text-white font-medium cursor-pointer hover:text-gray-200 list-none flex justify-between items-center">
          If you lost your tour card — Q-School information
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </summary>
        <div className="px-5 pb-5 space-y-2 text-sm text-gray-400">
          <p>📅 <strong className="text-gray-200">Dates:</strong> January 2026 (UK: Milton Keynes · Europe: Kalkar, Germany)</p>
          <p>🏗️ <strong className="text-gray-200">Format:</strong> First Stage (open) → Final Stage (top performers)</p>
          <p>🎯 <strong className="text-gray-200">Cards available:</strong> Top 64 OoM auto-retain. ~40 additional cards via Q-School + Challenge/Development Tour</p>
          <p>💷 <strong className="text-gray-200">Entry:</strong> Free for PDPA members (PDPA membership required)</p>
          <p>⚠️ <strong className="text-gray-200">Reset:</strong> New tour card holders start at £0 OoM — previous earnings do not carry over</p>
        </div>
      </details>
    </div>
  );
}

// Maps a snake_case Supabase row to the camelCase DartsPlayer interface used by views
function mapSupabaseToDartsPlayer(row: Record<string, unknown>): DartsPlayer {
  const r = row as Record<string, string | number | null | undefined>;
  return {
    name:                String(r.name ?? DEMO_PLAYER.name),
    nickname:            String(r.nickname ?? DEMO_PLAYER.nickname),
    nationality:         String(r.nationality ?? DEMO_PLAYER.nationality),
    nationalityFlag:     String(r.flag ?? DEMO_PLAYER.nationalityFlag),
    pdcRank:             Number(r.pdc_rank ?? DEMO_PLAYER.pdcRank),
    orderOfMeritRank:    Number(r.order_of_merit_rank ?? DEMO_PLAYER.orderOfMeritRank),
    threeDartAverage:    Number(r.three_dart_average ?? DEMO_PLAYER.threeDartAverage),
    checkoutPercent:     Number(r.checkout_percent ?? DEMO_PLAYER.checkoutPercent),
    oneEightiesPerLeg:   Number(r.one_eighties_per_leg ?? DEMO_PLAYER.oneEightiesPerLeg),
    firstNineAverage:    Number(r.first_nine_average ?? DEMO_PLAYER.firstNineAverage),
    highestCheckout:     Number(r.highest_checkout ?? DEMO_PLAYER.highestCheckout),
    tourCard:            String(r.tour_card ?? DEMO_PLAYER.tourCard),
    plan:                String(r.plan ?? DEMO_PLAYER.plan),
    manager:             String(r.manager ?? DEMO_PLAYER.manager),
    coach:               String(r.coach ?? DEMO_PLAYER.coach),
    sponsor1:            String(r.sponsor_1 ?? DEMO_PLAYER.sponsor1),
    sponsor2:            String(r.sponsor_2 ?? DEMO_PLAYER.sponsor2),
    walkOnMusic:         String(r.walk_on_music ?? DEMO_PLAYER.walkOnMusic),
    dartSetup:           DEMO_PLAYER.dartSetup, // structured field — keep demo value for now
    careerEarnings:      Number(r.career_earnings ?? DEMO_PLAYER.careerEarnings),
    thisYearEarnings:    Number(r.this_year_earnings ?? DEMO_PLAYER.thisYearEarnings),
    careerTitles:        Number(r.career_titles ?? DEMO_PLAYER.careerTitles),
    majorTitles:         Number(r.major_titles ?? DEMO_PLAYER.majorTitles),
  };
}

// ─── Performance Rating ───────────────────────────────────────────────────────
function PerformanceRatingView({ player }: { player: DartsPlayer }) {
  const components = [
    { label: 'Three-dart average',  weight: 30, score: 78, raw: '97.8',     benchmark: 'PDC avg 96.8' },
    { label: 'Checkout %',          weight: 25, score: 72, raw: '41.2%',    benchmark: 'PDC avg 38.1%' },
    { label: 'Consistency',         weight: 20, score: 81, raw: '±3.2 avg', benchmark: 'Lower is better' },
    { label: 'Recent form (8 wks)', weight: 15, score: 85, raw: '6W 2L',    benchmark: 'Top quartile' },
    { label: '180s per match',      weight: 10, score: 68, raw: '4.2',      benchmark: 'PDC avg 3.9' },
  ];
  const overallScore = Math.round(components.reduce((sum, c) => sum + (c.score * c.weight) / 100, 0));
  const getRating = (score: number) => {
    if (score >= 85) return { label: 'Elite', color: 'text-green-400' };
    if (score >= 75) return { label: 'Strong', color: 'text-teal-400' };
    if (score >= 65) return { label: 'Solid', color: 'text-amber-400' };
    return { label: 'Developing', color: 'text-red-400' };
  };
  const rating = getRating(overallScore);
  const history = [
    { month: 'Oct', score: 71 }, { month: 'Nov', score: 74 }, { month: 'Dec', score: 69 },
    { month: 'Jan', score: 76 }, { month: 'Feb', score: 79 }, { month: 'Mar', score: 77 },
    { month: 'Apr', score: overallScore },
  ];
  const maxH = Math.max(...history.map(h => h.score));
  const peers = [
    { name: 'Luke Littler', rank: 1, score: 96, isJake: false },
    { name: 'M. van Gerwen', rank: 2, score: 94, isJake: false },
    { name: 'Luke Humphries', rank: 3, score: 92, isJake: false },
    { name: 'N. Aspinall', rank: 4, score: 88, isJake: false },
    { name: 'Rob Cross', rank: 9, score: 80, isJake: false },
    { name: 'Jake Morrison', rank: 19, score: overallScore, isJake: true },
    { name: 'G. Anderson', rank: 14, score: 74, isJake: false },
  ].sort((a, b) => b.score - a.score);
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Performance Rating</h1>
        <p className="text-gray-400 text-sm mt-1">Lumio composite score · Weighted across 5 key metrics · 2025 season</p>
      </div>
      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-6 text-center">
        <p className="text-gray-500 text-sm mb-2">Lumio Performance Score</p>
        <p className="text-7xl font-medium text-white mb-2">{overallScore}</p>
        <p className={`text-lg font-medium ${rating.color}`}>{rating.label}</p>
        <p className="text-gray-600 text-xs mt-2">Out of 100 · Updated after each event</p>
        <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden mx-auto max-w-xs">
          <div className="h-full bg-red-500 rounded-full" style={{ width: `${overallScore}%` }} />
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Score breakdown</h2>
        <div className="space-y-3">
          {components.map((c, i) => (
            <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm text-gray-200">{c.label}</span>
                  <span className="text-xs text-gray-600 ml-2">({c.weight}% weight)</span>
                </div>
                <div className="text-right"><span className="text-white font-medium">{c.score}</span><span className="text-gray-600 text-xs ml-1">/ 100</span></div>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${c.score >= 80 ? 'bg-green-500' : c.score >= 70 ? 'bg-teal-500' : 'bg-amber-500'}`} style={{ width: `${c.score}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>{c.raw}</span><span>{c.benchmark}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Score trend — 2024/25 season</h2>
        <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
          <div className="flex items-end gap-3 h-24">
            {history.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400">{h.score}</span>
                <div className={`w-full rounded-sm ${i === history.length - 1 ? 'bg-red-500' : 'bg-gray-700'}`} style={{ height: `${(h.score / maxH) * 72}px` }} />
                <span className="text-[10px] text-gray-600">{h.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">PDC peer comparison</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          {peers.map((p, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 ${p.isJake ? 'bg-red-950/20' : ''}`}>
              <span className="text-gray-600 text-xs w-6">#{p.rank}</span>
              <span className={`text-sm flex-1 ${p.isJake ? 'text-white font-medium' : 'text-gray-300'}`}>
                {p.name} {p.isJake ? '← You' : ''}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${p.isJake ? 'bg-red-500' : 'bg-gray-600'}`} style={{ width: `${p.score}%` }} />
                </div>
                <span className={`text-sm font-medium ${p.isJake ? 'text-red-400' : 'text-gray-400'}`}>{p.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-600 text-center">
        Rating uses {player.name.split(' ')[0]}&apos;s live stats · Recalculates after each event
      </p>
    </div>
  );
}

// ─── Nine-Dart Tracker ────────────────────────────────────────────────────────
function NineDartTrackerView({ player: _player }: { player: DartsPlayer }) {
  const routes = [
    { name: "Classic (Jake's)", darts: ['T20', 'T20', 'T20', 'T20', 'T20', 'T20', 'T19', 'D16'] },
    { name: 'Bull finish', darts: ['T20', 'T20', 'T20', 'T20', 'T20', 'T20', 'T20', 'D25'] },
    { name: 'T19 route', darts: ['T20', 'T20', 'T20', 'T19', 'T19', 'T19', 'T20', 'D12'] },
  ];
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Nine-Dart Tracker</h1>
        <p className="text-gray-400 text-sm mt-1">Career nine-darters · Close calls · Routes to perfection</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Career nine-darters', value: '1', sub: 'Players Ch. 12, Mar 2025', red: true },
          { label: 'Best leg this season', value: '9', sub: 'darts — 1 occurrence' },
          { label: '10-dart legs (2025)', value: '4', sub: '2025 season' },
          { label: 'Avg winning leg', value: '18.3', sub: 'darts to win' },
        ].map((k, i) => (
          <div key={i} className={`rounded-xl border p-4 ${k.red ? 'bg-red-950/30 border-red-500/30' : 'bg-gray-900/60 border-white/5'}`}>
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className={`text-3xl font-medium ${k.red ? 'text-red-400' : 'text-white'}`}>{k.value}</p>
            <p className="text-xs text-gray-600 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-gradient-to-r from-red-950/40 to-amber-950/20 rounded-xl border border-red-500/20 p-5">
        <p className="text-xs text-red-400 font-medium uppercase tracking-wide mb-2">⚡ Career Nine-Darter — Players Championship 12 · March 2025</p>
        <p className="text-white font-medium mb-3">T20 · T20 · T20 · T20 · T20 · T20 · T19 · D16</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Visit 1 — T20 (60)', type: 'score' },
            { label: 'Visit 2 — T20 (60)', type: 'score' },
            { label: 'Visit 3 — T19 (57)', type: 'score' },
            { label: 'D16 (32)', type: 'finish' },
          ].map((d, i) => (
            <div key={i} className={`px-3 py-1.5 rounded text-xs font-medium border ${d.type === 'finish' ? 'bg-green-600/20 border-green-500/30 text-green-300' : 'bg-red-600/20 border-red-500/30 text-red-300'}`}>
              {d.label}
            </div>
          ))}
        </div>
        <p className="text-gray-500 text-xs mt-3">vs Ryan Searle · Players Championship 12 · Wigan · Leg 3 of 4</p>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Close calls — best legs on record</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Date</span><span>Event</span><span>Darts</span><span>Result</span>
          </div>
          {[
            { date: 'Mar 2025', event: 'Players Ch. 12', darts: 9, result: '✅ Nine-darter!', nine: true },
            { date: 'Feb 2025', event: 'Practice session', darts: 10, result: '10 darts', nine: false },
            { date: 'Jan 2025', event: 'Players Ch. 4', darts: 10, result: '10 darts', nine: false },
            { date: 'Dec 2024', event: 'Grand Slam', darts: 11, result: '11 darts', nine: false },
            { date: 'Oct 2024', event: 'Players Ch. 28', darts: 10, result: '10 darts', nine: false },
          ].map((a, i) => (
            <div key={i} className={`grid grid-cols-4 gap-2 px-4 py-3 border-t border-white/5 text-sm ${a.nine ? 'bg-red-950/10' : ''}`}>
              <span className="text-gray-400">{a.date}</span>
              <span className="text-gray-300">{a.event}</span>
              <span className={a.nine ? 'text-red-400 font-medium' : 'text-gray-400'}>{a.darts}</span>
              <span className={a.nine ? 'text-red-300 font-medium' : 'text-gray-500'}>{a.result}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Nine-dart routes to know</h2>
        <div className="space-y-3">
          {routes.map((r, i) => (
            <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
              <p className="text-sm font-medium text-white mb-2">{r.name}</p>
              <div className="flex gap-1.5 flex-wrap">
                {r.darts.map((d, j) => (
                  <span key={j} className={`px-2 py-0.5 rounded text-xs border ${j === r.darts.length - 1 ? 'bg-green-950/30 border-green-600/30 text-green-400' : j >= 6 ? 'bg-amber-950/30 border-amber-600/30 text-amber-400' : 'bg-gray-800 border-white/5 text-gray-300'}`}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Premier League ───────────────────────────────────────────────────────────
function PremierLeagueView({ player: _player }: { player: DartsPlayer }) {
  const plTable = [
    { pos: 1, name: 'Luke Littler', pts: 42, w: 14, d: 0, l: 2, avg: 103.2 },
    { pos: 2, name: 'Michael van Gerwen', pts: 36, w: 11, d: 3, l: 2, avg: 101.8 },
    { pos: 3, name: 'Luke Humphries', pts: 32, w: 10, d: 2, l: 4, avg: 100.1 },
    { pos: 4, name: 'Nathan Aspinall', pts: 28, w: 8, d: 4, l: 4, avg: 98.4 },
    { pos: 5, name: 'Michael Smith', pts: 24, w: 7, d: 3, l: 6, avg: 97.9 },
    { pos: 6, name: 'Rob Cross', pts: 22, w: 6, d: 4, l: 6, avg: 97.1 },
    { pos: 7, name: 'Gary Anderson', pts: 18, w: 5, d: 3, l: 8, avg: 96.8 },
    { pos: 8, name: 'Peter Wright', pts: 14, w: 3, d: 5, l: 8, avg: 95.2 },
  ];
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white">Premier League Darts</h1>
          <p className="text-gray-400 text-sm mt-1">2025 season · 16 nights · Jake&apos;s target: 2026 invitation</p>
        </div>
        <div className="px-3 py-1.5 bg-amber-950/30 border border-amber-700/30 rounded-lg text-xs text-amber-400 font-medium">Aspiration view — not in PL 2025</div>
      </div>
      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Jake&apos;s Premier League pathway</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-2">OoM rank needed for 2026 PL invitation</p>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: '62%' }} />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Current: #19</span><span>Target: Top 8–10</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-medium text-white">9</p>
            <p className="text-xs text-gray-500">ranks to climb</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">Estimated OoM needed: £850,000+ · Current: £687,420 · Gap: £162,580</p>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">2025 Premier League standings</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-7 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>#</span><span className="col-span-2">Player</span><span>Pts</span><span>W</span><span>D</span><span>Avg</span>
          </div>
          {plTable.map((p, i) => (
            <div key={i} className={`grid grid-cols-7 gap-2 px-4 py-3 border-t border-white/5 text-sm items-center ${i < 4 ? 'bg-green-950/5' : ''}`}>
              <span className={i < 4 ? 'text-green-400 font-medium' : 'text-gray-500'}>{p.pos}</span>
              <span className="col-span-2 text-gray-200">{p.name}</span>
              <span className="text-white font-medium">{p.pts}</span>
              <span className="text-gray-400">{p.w}</span>
              <span className="text-gray-400">{p.d}</span>
              <span className="text-gray-400">{p.avg}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2">Top 4 qualify for Play-offs · Green = Play-off places</p>
      </div>
      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
        <h2 className="text-white font-medium mb-3">Premier League format</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Nights', '16 across UK + Europe'],
            ['Format', '8 players · round-robin · 10 legs'],
            ['Prize fund', '£1,000,000 total'],
            ['Winner', '£275,000'],
            ['Play-off', 'Top 4 — semi-finals + final'],
            ['Selection', 'PDC invitation — top OoM + wildcards'],
          ].map(([label, value], i) => (
            <div key={i}><span className="text-gray-500">{label}: </span><span className="text-gray-200">{value}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── World Series ─────────────────────────────────────────────────────────────
function WorldSeriesView({ player: _player }: { player: DartsPlayer }) {
  const events = [
    { name: 'US Masters', location: 'Las Vegas, USA', date: 'Jun 2025', prize: '£450,000', criteria: 'OoM Top 24', status: '🟡 Expected (OoM holds Top 24)', history: 'Never qualified' },
    { name: 'Australian Darts Open', location: 'Brisbane, Australia', date: 'Jul 2025', prize: '£350,000', criteria: 'OoM Top 32 + invite', status: '✅ Confirmed', history: '2024: R2 exit (avg 98.1)' },
    { name: 'NZ Darts Masters', location: 'Auckland, NZ', date: 'Aug 2025', prize: '£300,000', criteria: 'OoM Top 24', status: '⏳ TBC', history: 'Never qualified' },
    { name: 'Nordic Masters', location: 'Copenhagen, Denmark', date: 'Jun 2025', prize: '£300,000', criteria: 'OoM Top 32', status: '📨 Invitation pending (Jun 7)', history: 'Never competed' },
    { name: 'World Series Finals', location: 'Amsterdam, Netherlands', date: 'Nov 2025', prize: '£500,000', criteria: 'Points from WS events', status: '❓ Depends on WS results', history: 'Never qualified' },
  ];
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">World Series of Darts</h1>
        <p className="text-gray-400 text-sm mt-1">Invitational events worldwide · Separate qualification from main OoM</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Confirmed invitations', value: '1', color: 'text-green-400' },
          { label: 'Pending / expected', value: '2', color: 'text-amber-400' },
          { label: 'Total WS prize fund', value: '£1.9M', color: 'text-white' },
        ].map((c, i) => (
          <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-2xl font-medium ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {events.map((ev, i) => (
          <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-white font-medium">{ev.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{ev.location} · {ev.date} · Prize: {ev.prize}</p>
              </div>
              <span className="text-xs text-gray-500">{ev.criteria}</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span className="text-sm text-gray-300">{ev.status}</span>
              <span className="text-xs text-gray-600">{ev.history}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
        <h2 className="text-white font-medium mb-3">How World Series qualification works</h2>
        <div className="space-y-2 text-sm text-gray-400">
          <p>• World Series events are invitational — not open entry</p>
          <p>• PDC invites players from the main OoM (typically Top 8–32 per event)</p>
          <p>• Host nation qualifiers added via local qualifying events</p>
          <p>• Prize money does <strong className="text-white">not</strong> count towards the main PDC OoM</p>
          <p>• World Series Finals uses a separate WS points table</p>
          <p>• Jake&apos;s OoM (#19) puts him in the expected bracket for most WS events</p>
        </div>
      </div>
    </div>
  );
}

// ─── Team Comms ───────────────────────────────────────────────────────────────
function TeamCommsView({ player }: { player: DartsPlayer }) {
  const [activeThread, setActiveThread] = useState<string>('marco');
  const [draft, setDraft] = useState('');
  const first = player.name.split(' ')[0];
  const threads = [
    { id: 'marco', name: 'Marco', role: 'Coach', unread: 1, messages: [
      { from: 'Marco', time: '07:45', text: 'Focus on T20 cluster tightness today — pulling left under pressure. Work on it in your practice session.' },
      { from: 'Marco', time: '06:30', text: 'Watched Price\'s last 5 matches. He is slow to start — take the first two legs aggressively.' },
      { from: first, time: 'Yesterday', text: 'Understood. Will focus on the doubles session on D16 and D18 today.' },
    ] },
    { id: 'james', name: 'James', role: 'Agent', unread: 2, messages: [
      { from: 'James', time: '08:10', text: 'Red Dragon renewal call scheduled Thursday 14:00. I\'ll send over their proposed terms by Wednesday evening.' },
      { from: 'James', time: 'Yesterday', text: 'Paddy Power ambassador inquiry — they want to discuss expanding the deal.' },
      { from: first, time: 'Yesterday', text: 'Good news on Paddy Power. Thursday call confirmed.' },
    ] },
    { id: 'singh', name: 'Dr. Singh', role: 'Physio', unread: 0, messages: [
      { from: 'Dr. Singh', time: '08:00', text: 'Shoulder treatment confirmed 08:30 tomorrow. Will also check the elbow.' },
      { from: first, time: 'Yesterday', text: 'Left elbow felt a bit heavy after Sunday.' },
      { from: 'Dr. Singh', time: 'Yesterday', text: 'Normal after that volume. Ice it tonight for 10 mins.' },
    ] },
    { id: 'sarah', name: 'Sarah', role: 'Mental coach', unread: 1, messages: [
      { from: 'Sarah', time: '07:00', text: 'Pre-match routine updated — check the Match Prep page. Added a breathing anchor for pressure checkouts.' },
      { from: first, time: 'Yesterday', text: 'Will do. Feeling good about tonight.' },
      { from: 'Sarah', time: 'Yesterday', text: 'Your data is strong. You average 99.4 vs Price — trust the process.' },
    ] },
  ];
  const active = threads.find(t => t.id === activeThread) || threads[0];
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-medium text-white">Team Comms</h1>
        <p className="text-gray-400 text-sm mt-1">Messages with your coaching and commercial team</p>
      </div>
      <div className="flex gap-4 h-[520px]">
        <div className="w-48 flex-shrink-0 space-y-1">
          {threads.map(t => (
            <button key={t.id} onClick={() => setActiveThread(t.id)} className={`w-full text-left px-3 py-3 rounded-xl border transition-colors ${activeThread === t.id ? 'bg-red-950/20 border-red-500/30' : 'bg-gray-900/40 border-white/5 hover:border-white/10'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white font-medium">{t.name}</span>
                {t.unread > 0 && <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-medium">{t.unread}</span>}
              </div>
              <span className="text-xs text-gray-500">{t.role}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 flex flex-col bg-gray-900/40 rounded-xl border border-white/5">
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-white font-medium">{active.name}</p>
            <p className="text-gray-500 text-xs">{active.role}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {[...active.messages].reverse().map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.from === first ? 'flex-row-reverse' : ''}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.from === first ? 'bg-red-600/20 border border-red-500/20 text-gray-200' : 'bg-gray-800/60 border border-white/5 text-gray-300'}`}>
                  <p>{msg.text}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-white/5 flex gap-2">
            <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-800/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-white/20" />
            <button onClick={() => setDraft('')} className="px-3 py-2 bg-red-600/20 border border-red-500/30 text-red-400 text-xs rounded-lg hover:bg-red-600/30">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Fan Engagement ───────────────────────────────────────────────────────────
function FanEngagementView({ player: _player }: { player: DartsPlayer }) {
  const platforms = [
    { name: 'Twitter/X', handle: '@JakeMorrisonDarts', followers: 48200, growth: '+2.4%', engagement: '3.8%' },
    { name: 'Instagram', handle: '@jakemorrisondarts', followers: 31400, growth: '+4.1%', engagement: '5.2%' },
    { name: 'YouTube', handle: 'Jake Morrison Darts', followers: 12800, growth: '+8.3%', engagement: '6.1%' },
    { name: 'TikTok', handle: '@thehammerdarts', followers: 24600, growth: '+12.7%', engagement: '8.4%' },
  ];
  const total = platforms.reduce((s, p) => s + p.followers, 0);
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  const topPosts = [
    { platform: 'TikTok', content: 'Walk-on entrance at European Championship', views: '284k', likes: '18.2k', date: 'Tonight' },
    { platform: 'Instagram', content: 'Red Dragon barrel reveal video', views: '41k', likes: '3.1k', date: '2 days ago' },
    { platform: 'Twitter/X', content: 'Post-match reaction — Players Ch. 12 win', views: '89k', likes: '4.8k', date: '3 weeks ago' },
    { platform: 'YouTube', content: '9-dart finish compilation + analysis', views: '67k', likes: '2.3k', date: '1 month ago' },
  ];
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Fan Engagement</h1>
        <p className="text-gray-400 text-sm mt-1">Social media · Brand reach · Content performance</p>
      </div>
      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-5 text-center">
        <p className="text-gray-500 text-sm mb-1">Total audience across all platforms</p>
        <p className="text-5xl font-medium text-white">{fmt(total)}</p>
        <p className="text-green-400 text-sm mt-1">+6.4% average growth this month</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {platforms.map((p, i) => (
          <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white font-medium text-sm">{p.name}</p>
              <span className="text-green-400 text-xs">{p.growth}</span>
            </div>
            <p className="text-2xl font-medium text-white">{fmt(p.followers)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{p.handle}</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-gray-600">Engagement:</span>
              <span className="text-xs text-teal-400 font-medium">{p.engagement}</span>
            </div>
          </div>
        ))}
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Top performing content</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Platform</span><span className="col-span-2">Content</span><span>Performance</span>
          </div>
          {topPosts.map((p, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 px-4 py-3 border-t border-white/5 text-sm items-center">
              <span className="text-gray-400 text-xs">{p.platform}</span>
              <span className="col-span-2 text-gray-200">{p.content}</span>
              <div>
                <p className="text-white text-xs font-medium">{p.views} views</p>
                <p className="text-gray-500 text-xs">{p.likes} · {p.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-600 text-center">Connect social APIs in Settings for real-time data · Currently showing demo estimates</p>
    </div>
  );
}

// ─── Nutrition & Conditioning ─────────────────────────────────────────────────
function NutritionLogView({ player: _player }: { player: DartsPlayer }) {
  const [tab, setTab] = useState<'today' | 'log' | 'plan'>('today');
  const todayMeals = [
    { time: '07:30', meal: 'Breakfast', detail: 'Porridge with banana, black coffee', kcal: 380 },
    { time: '10:30', meal: 'Pre-practice snack', detail: 'Greek yoghurt, handful of almonds', kcal: 220 },
    { time: '12:30', meal: 'Lunch', detail: 'Chicken breast, brown rice, salad', kcal: 560 },
    { time: '15:00', meal: 'Pre-match meal', detail: 'Pasta with chicken — energy focus, no heavy sauces', kcal: 680 },
    { time: '17:00', meal: 'Travel snack', detail: 'Banana, protein bar', kcal: 280 },
  ];
  const rules = [
    { rule: 'No alcohol for 48 hours before a match', status: '✅' },
    { rule: 'Pre-match meal 3–4 hours before throw time', status: '✅' },
    { rule: 'Hydration: 2.5L water across match day', status: '⚠️ 1.8L so far' },
    { rule: 'Avoid caffeine within 2 hours of match', status: '✅' },
    { rule: 'No heavy fried food on match day', status: '✅' },
  ];
  const weekLog: [string, string, string, string][] = [
    ['Monday', 'Practice session + walk', '90 min + 30 min', 'Good energy'],
    ['Tuesday', 'Match day — light warm-up only', '20 min', 'Focus on arm loosening'],
    ['Wednesday', 'Rest + physio', '60 min physio', 'Shoulder treatment'],
    ['Thursday', 'Practice + gym (upper body)', '90 min + 45 min', 'Shoulder exercises'],
    ['Friday', 'Practice', '2 hrs', 'Checkout focus'],
  ];
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Nutrition &amp; Conditioning</h1>
        <p className="text-gray-400 text-sm mt-1">Match-day nutrition · Conditioning log · Guidelines</p>
      </div>
      <div className="flex rounded-lg border border-white/5 overflow-hidden w-fit">
        {(['today', 'log', 'plan'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-xs font-medium transition-colors border-r border-white/5 last:border-r-0 ${tab === t ? 'bg-red-600/20 text-red-300' : 'bg-gray-900/40 text-gray-500 hover:text-gray-300'}`}>
            {t === 'today' ? 'Today' : t === 'log' ? 'Weekly log' : 'Match plan'}
          </button>
        ))}
      </div>
      {tab === 'today' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-medium">Today — match day</h2>
            <span className="text-gray-500 text-xs">Total: {todayMeals.reduce((s, m) => s + m.kcal, 0)} kcal</span>
          </div>
          <div className="space-y-2">
            {todayMeals.map((m, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-900/60 rounded-xl border border-white/5 px-4 py-3">
                <span className="text-xs text-gray-500 w-10 flex-shrink-0 mt-0.5">{m.time}</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{m.meal}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{m.detail}</p>
                </div>
                <span className="text-gray-400 text-xs">{m.kcal} kcal</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === 'plan' && (
        <div className="space-y-4">
          <h2 className="text-white font-medium">Match-day nutrition rules</h2>
          <div className="space-y-2">
            {rules.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 bg-gray-900/60 rounded-xl border border-white/5 text-sm">
                <span>{r.status}</span>
                <span className="text-gray-300">{r.rule}</span>
              </div>
            ))}
          </div>
          <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Nutritionist — Dr. Rachel Keane</p>
            <p className="text-sm text-gray-300">&ldquo;Darts requires sustained concentration over 2–3 hours. Stable blood sugar is more important than energy peaks. Hydration is the most commonly overlooked factor — even mild dehydration impairs fine motor control.&rdquo;</p>
          </div>
        </div>
      )}
      {tab === 'log' && (
        <div>
          <h2 className="text-white font-medium mb-3">This week — conditioning log</h2>
          <div className="rounded-xl border border-white/5 overflow-hidden">
            <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
              <span>Day</span><span>Activity</span><span>Duration</span><span>Notes</span>
            </div>
            {weekLog.map(([day, act, dur, notes], i) => (
              <div key={i} className={`grid grid-cols-4 gap-2 px-4 py-2.5 border-t border-white/5 text-sm ${i % 2 === 0 ? '' : 'bg-gray-900/30'}`}>
                <span className="text-gray-400">{day}</span>
                <span className="text-gray-300">{act}</span>
                <span className="text-gray-500 text-xs">{dur}</span>
                <span className="text-gray-600 text-xs">{notes}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Practice Board Booking ───────────────────────────────────────────────────
function BoardBookingView({ player: _player }: { player: DartsPlayer }) {
  const [city, setCity] = useState('Dortmund');
  type Venue = { name: string; distance: string; boards: number; contact: string; notes: string };
  const venues: Record<string, Venue[]> = {
    Dortmund: [
      { name: 'Westfalenhallen Practice Area', distance: '0km — at venue', boards: 8, contact: 'PDC venue manager', notes: 'Available to entered players 10:00–18:00 on event days' },
      { name: 'Mercure Hotel Dortmund City', distance: '1.2km', boards: 2, contact: '+49 231 1025 0', notes: 'Hotel practice board. Book via concierge. €20/hr.' },
      { name: 'Dart-Sport Dortmund', distance: '3.4km', boards: 12, contact: 'info@dartsport-do.de', notes: 'Dedicated darts venue. Open 14:00–22:00. €15/hr.' },
    ],
    Prague: [
      { name: 'O2 Arena Practice Hall', distance: '0km — at venue', boards: 6, contact: 'PDC venue manager', notes: 'Players only — Euro Tour entry required' },
      { name: 'Hotel Clarion Congress', distance: '0.3km', boards: 1, contact: '+420 211 131 111', notes: 'Board in sports lounge. Request from front desk.' },
      { name: 'Sports Bar Darts Prague', distance: '2.1km', boards: 6, contact: 'info@dartsprague.cz', notes: 'Walk-in or book. Open daily 12:00–24:00.' },
    ],
    Frankfurt: [
      { name: 'Jahrhunderthalle Practice', distance: '0km — at venue', boards: 8, contact: 'PDC venue manager', notes: 'World Cup venue — players only. 09:00–17:00.' },
      { name: 'Dartclub Frankfurt', distance: '6.1km', boards: 10, contact: 'info@dartclub-ffm.de', notes: 'Club booking available. Non-members €20/session.' },
    ],
    Amsterdam: [
      { name: 'Ahoy Rotterdam Practice', distance: '0km — at venue', boards: 8, contact: 'PDC venue manager', notes: 'World Series Finals venue' },
      { name: 'Darts Amsterdam', distance: '8km', boards: 16, contact: 'book@dartsamsterdam.nl', notes: 'Best dedicated venue in Netherlands. Book 48hrs ahead.' },
    ],
  };
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Practice Board Booking</h1>
        <p className="text-gray-400 text-sm mt-1">Find and book practice boards when on tour</p>
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Select city</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(venues).map(c => (
            <button key={c} onClick={() => setCity(c)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${city === c ? 'bg-red-600/20 border-red-500/40 text-red-300' : 'bg-gray-900/40 border-white/5 text-gray-400 hover:text-gray-200'}`}>{c}</button>
          ))}
        </div>
      </div>
      {city === 'Dortmund' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-950/20 border border-red-500/20 rounded-xl text-sm">
          <span className="text-red-400">🎯</span>
          <span className="text-red-200">You play tonight at Westfalenhallen — practice area available 10:00–18:00</span>
        </div>
      )}
      <div className="space-y-3">
        {(venues[city] || []).map((v, i) => (
          <div key={i} className={`bg-gray-900/60 rounded-xl border p-4 ${i === 0 ? 'border-green-500/20' : 'border-white/5'}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-white font-medium text-sm">{v.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{v.distance} · {v.boards} boards</p>
              </div>
              {i === 0 && <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded">At venue</span>}
            </div>
            <p className="text-gray-400 text-xs">{v.notes}</p>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
              <span className="text-gray-600 text-xs">{v.contact}</span>
              <button className="px-3 py-1 bg-gray-800/60 border border-white/5 text-gray-400 text-xs rounded hover:text-gray-200 transition-colors">Copy contact</button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-600 text-center">Venue list is curated and manually maintained · More cities added regularly</p>
    </div>
  );
}

// ─── Accreditations ───────────────────────────────────────────────────────────
function AccreditationsView({ player: _player }: { player: DartsPlayer }) {
  type AccredStatus = 'active' | 'pending' | 'expired';
  const accreds: Array<{ venue: string; event: string; status: AccredStatus; expires: string; badge: string; notes: string }> = [
    { venue: 'Alexandra Palace', event: 'PDC World Championship', status: 'active', expires: 'Jan 2026', badge: 'Player pass + backstage', notes: 'Annual renewal after World Championship. PDPA membership required.' },
    { venue: 'Blackpool Winter Gardens', event: 'World Matchplay', status: 'active', expires: 'Jul 2025', badge: 'Player pass + practice area', notes: 'Event-specific. Issued 2 weeks before event.' },
    { venue: 'Westfalenhallen', event: 'European Championship (tonight)', status: 'active', expires: 'Tonight', badge: 'Player pass — Board 4', notes: 'Collect from PDC desk on arrival at the venue.' },
    { venue: 'Wolverhampton Civic Hall', event: 'Grand Slam of Darts', status: 'pending', expires: 'Nov 2025', badge: 'TBC — qualification pending', notes: 'Issued if Jake qualifies. OoM Top 24 required.' },
    { venue: 'Minehead Butlins', event: 'World Pairs Championship', status: 'active', expires: 'Aug 2025', badge: 'Player + partner pass', notes: 'Shared with Mark Webb. Confirm partner details by Jul 1.' },
    { venue: 'O2 Arena, Prague', event: 'Prague Open', status: 'pending', expires: 'Apr 25', badge: 'Player pass', notes: 'Issued on confirmed entry. Confirm by Apr 19.' },
  ];
  const statusConfig: Record<AccredStatus, { label: string; dot: string; bg: string }> = {
    active: { label: '✅ Active', dot: 'bg-green-500', bg: '' },
    pending: { label: '⏳ Pending', dot: 'bg-amber-400', bg: 'bg-amber-950/10' },
    expired: { label: '❌ Expired', dot: 'bg-red-500', bg: 'bg-red-950/10' },
  };
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Accreditations &amp; Venue Passes</h1>
        <p className="text-gray-400 text-sm mt-1">Event passes · Backstage access · Venue credentials</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active passes', value: String(accreds.filter(a => a.status === 'active').length), color: 'text-green-400' },
          { label: 'Pending', value: String(accreds.filter(a => a.status === 'pending').length), color: 'text-amber-400' },
          { label: 'Expired / needed', value: '0', color: 'text-gray-400' },
        ].map((c, i) => (
          <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-3xl font-medium ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {accreds.map((a, i) => {
          const cfg = statusConfig[a.status];
          return (
            <div key={i} className={`rounded-xl border border-white/5 p-4 ${cfg.bg}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-white font-medium text-sm">{a.venue}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{a.event}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  <span className="text-gray-400">{cfg.label}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Badge: {a.badge}</span>
                <span className="text-gray-500">Expires: {a.expires}</span>
              </div>
              <p className="text-gray-600 text-xs mt-2 pt-2 border-t border-white/5">{a.notes}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── County Darts ─────────────────────────────────────────────────────────────
function CountyDartsView({ player: _player }: { player: DartsPlayer }) {
  const results = [
    { date: 'Mar 2025', opponent: 'Lancashire', result: 'W', score: '8-4', avg: 101.4, competition: 'Yorkshire vs Lancashire' },
    { date: 'Jan 2025', opponent: 'Derbyshire', result: 'W', score: '7-5', avg: 98.7, competition: 'Yorkshire Championship' },
    { date: 'Nov 2024', opponent: 'Durham', result: 'L', score: '5-7', avg: 94.2, competition: 'Northern Counties League' },
    { date: 'Sep 2024', opponent: 'Nottinghamshire', result: 'W', score: '8-3', avg: 102.1, competition: 'Yorkshire Championship' },
  ];
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">County Darts</h1>
        <p className="text-gray-400 text-sm mt-1">Yorkshire County Darts · BDO-affiliated · Non-ranking appearances</p>
      </div>
      <div className="px-4 py-3 bg-gray-900/60 rounded-xl border border-white/5 text-sm text-gray-400">
        PDC Tour Card holders may play county darts but cannot enter BDO-affiliated ranking events. Jake plays for Yorkshire occasionally to stay sharp between PDC events.
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Appearances', value: '4', sub: '2024/25' },
          { label: 'Record', value: '3W 1L', sub: 'For Yorkshire' },
          { label: 'County avg', value: '99.1', sub: 'Above county standard' },
          { label: 'County', value: 'Yorkshire', sub: 'BDA affiliated' },
        ].map((k, i) => (
          <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className="text-2xl font-medium text-white">{k.value}</p>
            <p className="text-xs text-gray-600 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">County results</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Date</span><span>Opponent</span><span>Result</span><span>Score</span><span>Avg</span>
          </div>
          {results.map((r, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 px-4 py-3 border-t border-white/5 text-sm items-center">
              <span className="text-gray-500">{r.date}</span>
              <span className="text-gray-300">vs {r.opponent}</span>
              <span className={r.result === 'W' ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>{r.result}</span>
              <span className="text-gray-400">{r.score}</span>
              <span className="text-gray-300">{r.avg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DartsPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [livePlayer, setLivePlayer] = useState<DartsPlayer | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) return;
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(url, key);
        const { data, error } = await supabase
          .from('darts_players')
          .select('*')
          .eq('slug', slug)
          .single();
        if (cancelled) return;
        if (data && !error) {
          setLivePlayer(mapSupabaseToDartsPlayer(data));
        }
      } catch { /* silent — fall back to demo */ }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const player: DartsPlayer = livePlayer || DEMO_PLAYER;
  const groups = ['OVERVIEW', 'PERFORMANCE', 'TEAM', 'COMMERCIAL', 'OPERATIONS', 'INTEGRATIONS'];

  const renderView = () => {
    // Pro-only feature gate — demo player is on Premier League so all pass.
    if (PRO_FEATURES.includes(activeSection) && !isPro(player.plan)) {
      return (
        <div className="p-8 flex flex-col items-center justify-center min-h-96">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-medium text-white mb-2">Pro feature</h2>
          <p className="text-gray-400 text-sm text-center max-w-xs mb-6">
            {activeSection.replace(/-/g, ' ')} is available on the Premier League plan (£279/mo).
          </p>
          <button className="px-6 py-3 bg-red-600/20 border border-red-500/40 text-red-300 text-sm rounded-xl hover:bg-red-600/30 transition-colors">
            Upgrade to Premier League &rarr;
          </button>
          <p className="text-gray-600 text-xs mt-3">Currently on: {player.plan || 'Essentials'}</p>
        </div>
      );
    }
    switch (activeSection) {
      case 'dashboard':     return <DashboardView player={player} onNavigate={setActiveSection} />;
      case 'morning':       return <MorningBriefingView player={player} />;
      case 'orderofmerit':  return <OrderOfMeritView onNavigate={setActiveSection} />;
      case 'schedule':      return <TournamentScheduleView onNavigate={setActiveSection} />;
      case 'averages':      return <ThreeDartAverageView player={player} onNavigate={setActiveSection} />;
      case 'checkout':      return <CheckoutAnalysisView onNavigate={setActiveSection} />;
      case 'opponentintel': return <OpponentIntelView onNavigate={setActiveSection} />;
      case 'practicelog':   return <PracticeLogView onNavigate={setActiveSection} />;
      case 'matchreports':  return <MatchReportsView onNavigate={setActiveSection} />;
      case 'video':         return <VideoLibraryView onNavigate={setActiveSection} />;
      case 'teamhub':       return <TeamHubView onNavigate={setActiveSection} />;
      case 'mental':        return <MentalPerformanceView onNavigate={setActiveSection} />;
      case 'sponsorship':   return <SponsorshipView onNavigate={setActiveSection} />;
      case 'exhibitions':   return <ExhibitionManagerView onNavigate={setActiveSection} />;
      case 'media':         return <MediaContentView onNavigate={setActiveSection} />;
      case 'financial':     return <FinancialDashboardView onNavigate={setActiveSection} />;
      case 'agent':         return <AgentPipelineView onNavigate={setActiveSection} />;
      case 'travel':        return <TravelLogisticsView onNavigate={setActiveSection} />;
      case 'tourcard':      return <TourCardQSchoolView onNavigate={setActiveSection} />;
      case 'equipment':     return <EquipmentSetupView player={player} />;
      case 'career':        return <CareerPlanningView onNavigate={setActiveSection} />;
      case 'datahub':       return <DataHubView onNavigate={setActiveSection} />;
      case 'settings':      return <SettingsView player={player} onNavigate={setActiveSection} />;
      case 'dartconnect':   return <DartConnectView onNavigate={setActiveSection} />;
      case 'pdclive':       return <PDCLiveView onNavigate={setActiveSection} />;
      case 'womens-darts':  return <WomensDartsView onNavigate={setActiveSection} />;
      case 'merit-forecaster':  return <MeritForecasterView player={player} />;
      case 'entry-manager':     return <EntryManagerView player={player} />;
      case 'live-scores':       return <LiveScoresView player={player} />;
      case 'draw-bracket':      return <DrawBracketView player={player} />;
      case 'advanced-stats':    return <AdvancedStatsView player={player} />;
      case 'dartboard-heatmap': return <DartboardHeatmapView player={player} />;
      case 'pressure-analysis': return <PressureAnalysisView player={player} />;
      case 'match-prep':        return <MatchPrepView player={player} />;
      case 'physio-recovery':   return <PhysioRecoveryView player={player} />;
      case 'walk-on-music':     return <WalkOnMusicView player={player} />;
      case 'pairs-events':      return <PairsEventsView player={player} />;
      case 'tour-card-monitor': return <TourCardMonitorView player={player} />;
      case 'prize-forecaster':  return <PrizeForecastView player={player} />;
      case 'academy-dev':       return <AcademyDevView player={player} />;
      case 'practice-games':    return <PracticeGamesView player={player} />;
      case 'performance-rating': return <PerformanceRatingView player={player} />;
      case 'nine-dart-tracker':  return <NineDartTrackerView player={player} />;
      case 'premier-league':     return <PremierLeagueView player={player} />;
      case 'world-series':       return <WorldSeriesView player={player} />;
      case 'team-comms':         return <TeamCommsView player={player} />;
      case 'fan-engagement':     return <FanEngagementView player={player} />;
      case 'nutrition-log':      return <NutritionLogView player={player} />;
      case 'board-booking':      return <BoardBookingView player={player} />;
      case 'accreditations':     return <AccreditationsView player={player} />;
      case 'county-darts':       return <CountyDartsView player={player} />;
      default:              return <DashboardView player={player} onNavigate={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#07080F', fontFamily: 'DM Sans, sans-serif', color: '#e5e7eb' }}>
      {/* Sidebar */}
      <div className={`flex-shrink-0 transition-all duration-200 flex flex-col border-r border-gray-800 ${sidebarCollapsed ? 'w-14' : 'w-56'}`} style={{ background: '#0a0c14' }}>
        <div className="p-3 border-b border-gray-800 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ background: 'linear-gradient(90deg, #DC2626, #F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LUMIO TOUR</div>
              <div className="text-[10px] text-gray-600">Darts</div>
            </div>
          )}
          {sidebarCollapsed && <span className="text-lg mx-auto">🎯</span>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-gray-600 hover:text-gray-400 text-xs ml-auto flex-shrink-0">
            {sidebarCollapsed ? '>' : '<'}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="p-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm border border-red-500/40" style={{ background: 'linear-gradient(135deg, rgba(185,28,28,0.3), rgba(234,88,12,0.3))' }}>{player.nationalityFlag}</div>
              <div>
                <div className="text-xs font-semibold text-white">{player.name}</div>
                <div className="text-[10px] text-gray-500">#{player.pdcRank} PDC · {player.nationality}</div>
              </div>
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
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg mb-0.5 transition-all text-left ${activeSection === item.id ? 'bg-red-600/20 text-red-300 border border-red-600/30' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}
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
            <div className="text-xs text-red-400 font-semibold mt-0.5">{player.plan}</div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-shrink-0 border-b border-gray-800 px-6 py-3 flex items-center justify-between" style={{ background: '#0a0c14' }}>
          <div className="text-xs text-gray-500 font-medium capitalize">
            {SIDEBAR_ITEMS.find(i => i.id === activeSection)?.icon} {SIDEBAR_ITEMS.find(i => i.id === activeSection)?.label}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-600">PDC European Championship · Dortmund</div>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <div className="text-xs text-gray-500">Week 16 · 2025</div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 pb-16 md:pb-0">{renderView()}</div>

          {/* Right Sidebar — Player Card */}
          <div className="hidden lg:flex flex-col items-center gap-4 p-4 border-l border-gray-800 flex-shrink-0" style={{ width: '220px' }}>
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">{player.nationalityFlag}</div>
              <div className="text-sm font-bold text-white">{player.name}</div>
              <div className="text-[10px] text-gray-500">&quot;{player.nickname}&quot;</div>
              <div className="text-xs text-red-400 font-medium mt-1">#{player.pdcRank} PDC</div>
              <div className="text-xs text-gray-400 mt-1">{player.threeDartAverage} avg</div>
              <div className="text-xs text-gray-500">£{(player.careerEarnings / 1000).toFixed(0)}k career</div>

              <div className="border-t border-white/5 pt-3 mt-3 space-y-1.5 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Doubles %</span>
                  <span className="text-white font-medium">38.2%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">TV avg</span>
                  <span className="text-white font-medium">99.1</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Floor avg</span>
                  <span className="text-white font-medium">97.3</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">180s/match</span>
                  <span className="text-white font-medium">4.2</span>
                </div>
              </div>

              {/* Recent form mini sparkline */}
              <div className="border-t border-white/5 pt-3 mt-3 text-left">
                <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wide">Recent form (avg)</p>
                <div className="flex items-end gap-1 h-10">
                  {[94.1, 98.7, 101.4, 99.2, 103.8, 97.6, 102.1, 96.8].map((avg, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full rounded-sm bg-red-500/60" style={{ height: `${((avg - 90) / 20) * 100}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs mb-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-red-400 font-medium text-[10px] uppercase tracking-wide">Live Tonight</span>
              </div>
              <div className="text-xs text-red-400 font-medium">European Ch. R1</div>
              <div className="text-xs text-gray-300 mt-1">vs G. Price (#7)</div>
              <div className="text-xs text-gray-500">20:00 · Dortmund</div>
              <div className="mt-2 text-xs text-yellow-400">Win = £110,000</div>
            </div>
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Upcoming</div>
              {['Prague Open (Euro Tour)', 'Players Ch. 9', 'German Masters', 'Bahrain Masters'].map((t, i) => (
                <div key={i} className="text-[10px] text-gray-400 py-0.5">{t}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950/95 border-t border-white/10 flex items-center justify-around py-2 md:hidden">
        {[
          { id: 'dashboard',         icon: '🏠',  label: 'Home' },
          { id: 'live-scores',       icon: '🔴',  label: 'Live' },
          { id: 'merit-forecaster',  icon: '📈',  label: 'OoM'  },
          { id: 'match-prep',        icon: '⚡',  label: 'Prep' },
          { id: 'tour-card-monitor', icon: '🛡️', label: 'Card' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${activeSection === item.id ? 'text-red-400' : 'text-gray-600 hover:text-gray-400'}`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

