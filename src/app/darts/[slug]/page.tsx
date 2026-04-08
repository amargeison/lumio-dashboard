'use client';

import { useState } from 'react';
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
  { id: 'teamhub',           label: 'Team Hub',              icon: '👥', group: 'TEAM' },
  { id: 'physio-recovery',   label: 'Physio & Recovery',     icon: '⚕️', group: 'TEAM' },
  { id: 'mental',            label: 'Mental Performance',    icon: '🧠', group: 'TEAM' },
  { id: 'walk-on-music',     label: 'Walk-on Music',         icon: '🎤', group: 'TEAM' },
  { id: 'pairs-events',      label: 'Pairs & Team Events',   icon: '👥', group: 'TEAM' },
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
  firstNineAverage: 72.4,
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
function MorningBriefingView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [briefingTab, setBriefingTab] = useState<'player' | 'manager' | 'sponsor'>('player');
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="🌅" title="AI Morning Briefing" subtitle="Daily intelligence for Jake Morrison and team — European Championship week." />
      <div className="flex gap-1 bg-[#0d0f1a] border border-gray-800 rounded-lg p-1 w-fit">
        {(['player', 'manager', 'sponsor'] as const).map(t => (
          <button key={t} onClick={() => setBriefingTab(t)} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${briefingTab === t ? 'bg-red-600/20 text-red-400 border border-red-600/30' : 'text-gray-500 hover:text-gray-300'}`}>{t}</button>
        ))}
      </div>

      {briefingTab === 'player' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-600/30 rounded-xl p-5">
            <div className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">TONIGHT&apos;S MATCH — vs GERWYN PRICE (#7)</div>
            <div className="text-sm text-gray-300 leading-relaxed space-y-2">
              <p>Price enters tonight on a 3-match winning streak but his checkout percentage has dipped to 38.7% in his last 5 outings — down from his season average of 40.1%. His preferred doubles remain D16 (52% hit rate) and D8 (44%).</p>
              <p><span className="text-white font-medium">H2H record:</span> You lead 4-3 in the last 7 meetings. Last 3: Price won 6-4, you won 6-5, Price won 6-3.</p>
              <p><span className="text-red-400 font-medium">Key tactical note:</span> Price struggles when opponents average 100+ in legs 1-3 of a set. His scoring drops 6% when playing from behind early. Attack the first 2 legs aggressively.</p>
              <p><span className="text-teal-400 font-medium">Practice focus:</span> Bull finishing for 170 checkout opportunities. Price leaves 170 setups more often than other top-16 players.</p>
              <p><span className="text-amber-400 font-medium">Mental note:</span> Price uses a slow walk between throws to disrupt rhythm. Maintain your 18-second routine regardless of his tempo.</p>
            </div>
          </div>
        </div>
      )}

      {briefingTab === 'manager' && (
        <div className="space-y-4">
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-3">Manager Briefing — Dave Harris</div>
            <div className="space-y-3 text-sm text-gray-400">
              {[
                { label: 'Match logistics', detail: 'Dortmund venue — dressing room 4 allocated. Practice board booked 18:00-18:45. Sky Sports coverage from 19:30.' },
                { label: 'Red Dragon obligations', detail: '2 social posts due this week. Barrel review video confirmed for 14:00 today — Jake confirmed. YouTube upload by Apr 18.' },
                { label: 'Entry deadline', detail: 'Prague Open entry closes Apr 22 (6 days). Recommend entering — £120k prize fund, good draw expected.' },
                { label: 'Prize money pending', detail: 'Players Championship April event — £4,200 outstanding. PDC finance team contacted, expected within 30 days.' },
                { label: 'Exhibition enquiry', detail: 'Preston Social Club — Apr 22 — £1,800 offered. Below typical rate but short travel. Recommend accepting.' },
              ].map((item, i) => (
                <div key={i} className="py-2 border-b border-gray-800/50">
                  <div className="text-white font-medium text-xs mb-0.5">{item.label}</div>
                  <div>{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {briefingTab === 'sponsor' && (
        <div className="space-y-4">
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-3">Sponsor Briefing</div>
            <div className="space-y-3 text-sm text-gray-400">
              {[
                { label: 'Red Dragon Darts', detail: 'Barrel review video content due today (14:00 shoot confirmed). YouTube upload by Apr 18. Jake to wear branded shirt for European Ch.' },
                { label: 'Ladbrokes', detail: 'Odds update — Jake 4/1 to win European Championship. Post-match interview required tonight if Jake wins. Social graphic to share pre-match.' },
                { label: 'Brand safety note', detail: 'Jake playing Gerwyn Price tonight — big TV audience on Sky Sports. Expect 500k+ viewers. High exposure for all sponsor logos.' },
              ].map((item, i) => (
                <div key={i} className="py-2 border-b border-gray-800/50">
                  <div className="text-white font-medium text-xs mb-0.5">{item.label}</div>
                  <div>{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
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
function EquipmentSetupView({ player, onNavigate }: { player: DartsPlayer; onNavigate: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <QuickActionsBar onNavigate={onNavigate} />
      <SectionHeader icon="📦" title="Equipment Setup & Dart Configuration" subtitle="Current setup, history, and equipment inventory." />

      <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-600/30 rounded-xl p-5">
        <div className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">COMPETITION SETUP</div>
        <div className="text-white font-bold text-lg mb-3">Jake &quot;The Hammer&quot; Morrison</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            { label: 'Barrels', value: 'Red Dragon Hammer 24g — Tungsten 90%' },
            { label: 'Flights', value: 'Red Dragon standard — black/gold design' },
            { label: 'Shafts', value: 'Medium — 41mm — Red Dragon Pro' },
            { label: 'Board', value: 'Winmau Blade 6 (comp & practice)' },
            { label: 'Oche', value: '9ft 7.25 inches' },
            { label: 'Mat', value: 'Winmau circuit board mat' },
          ].map((e, i) => (
            <div key={i} className="bg-black/20 rounded-lg p-2">
              <div className="text-gray-500">{e.label}</div>
              <div className="text-white font-medium mt-0.5">{e.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Setup History (Practice Avg Correlation)</div>
        <div className="space-y-2">
          {[
            { setup: '24g current setup (since Jan 2025)', avg: '97.8', active: true },
            { setup: '22g setup (Aug–Dec 2024)', avg: '95.4', active: false },
            { setup: '26g setup (before Aug 2024)', avg: '93.8', active: false },
          ].map((h, i) => (
            <div key={i} className={`flex items-center justify-between py-2 border-b border-gray-800/50 ${h.active ? 'text-white' : 'text-gray-400'}`}>
              <span className="text-sm">{h.setup}</span>
              <span className={`text-sm font-medium ${h.active ? 'text-teal-400' : ''}`}>avg {h.avg}</span>
            </div>
          ))}
          <div className="text-xs text-gray-500 mt-2">Note: Lighter barrel improved release consistency — significant avg improvement</div>
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Board Maintenance</div>
        <div className="text-xs text-gray-400 space-y-1">
          <div>Rotation schedule: Rotate board every 3 sessions</div>
          <div>Wire condition: Replaced wires Apr 10 — fresh board for European Ch.</div>
          <div>Board position: Standard height (5ft 8in to bull) — checked with laser level</div>
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Equipment Inventory</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Spare barrels', value: '2 sets' }, { label: 'Flights', value: '40 + 6 travel' },
            { label: 'Shafts', value: '20 sets' }, { label: 'Cases', value: 'PDC + practice' },
          ].map((e, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3 text-center">
              <div className="text-white font-bold">{e.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{e.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4 text-xs text-amber-400">
        <Zap className="w-3.5 h-3.5 inline mr-1" /> New &quot;Hammer V2&quot; barrel — 25g variant — arriving April 20 for testing
      </div>
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
function PressureAnalysisView({ player: _player }: { player: DartsPlayer }) {
  const comparisons = [
    { label: 'Match average',   standard: 97.8,  pressure: 94.2, unit: '' },
    { label: 'Checkout %',      standard: 41.2,  pressure: 33.8, unit: '%' },
    { label: 'First 9 average', standard: 101.4, pressure: 97.1, unit: '' },
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium text-white">Tour Card Monitor</h1>
        <p className="text-gray-400 text-sm mt-1">PDC Order of Merit · Rolling 2-year window · Tour card held by top 64</p>
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

export default function DartsPortalPage() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const player = DEMO_PLAYER;
  const groups = ['OVERVIEW', 'PERFORMANCE', 'TEAM', 'COMMERCIAL', 'OPERATIONS', 'INTEGRATIONS'];

  const renderView = () => {
    switch (activeSection) {
      case 'dashboard':     return <DashboardView player={player} onNavigate={setActiveSection} />;
      case 'morning':       return <MorningBriefingView onNavigate={setActiveSection} />;
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
      case 'equipment':     return <EquipmentSetupView player={player} onNavigate={setActiveSection} />;
      case 'career':        return <CareerPlanningView onNavigate={setActiveSection} />;
      case 'datahub':       return <DataHubView onNavigate={setActiveSection} />;
      case 'settings':      return <SettingsView player={player} onNavigate={setActiveSection} />;
      case 'dartconnect':   return <DartConnectView onNavigate={setActiveSection} />;
      case 'pdclive':       return <PDCLiveView onNavigate={setActiveSection} />;
      case 'womens-darts':  return <WomensDartsView onNavigate={setActiveSection} />;
      case 'merit-forecaster':  return <MeritForecasterView player={player} />;
      case 'entry-manager':     return <EntryManagerView player={player} />;
      case 'live-scores':       return <StubView title="Live Scores"             sub="Live PDC match feeds — coming soon." />;
      case 'draw-bracket':      return <StubView title="Draw & Bracket"          sub="Draw viewer and bracket projections — coming soon." />;
      case 'advanced-stats':    return <StubView title="Advanced Stats"          sub="Deep statistical breakdown and percentiles — coming soon." />;
      case 'dartboard-heatmap': return <StubView title="Dartboard Heatmap"       sub="Visual hit-distribution heatmap — coming soon." />;
      case 'pressure-analysis': return <PressureAnalysisView player={player} />;
      case 'match-prep':        return <StubView title="Match Prep"              sub="Pre-match opponent and routine preparation — coming soon." />;
      case 'physio-recovery':   return <StubView title="Physio & Recovery"       sub="Recovery tracking and physio appointments — coming soon." />;
      case 'walk-on-music':     return <StubView title="Walk-on Music"           sub="Manage walk-on tracks and crowd entrance — coming soon." />;
      case 'pairs-events':      return <StubView title="Pairs & Team Events"     sub="World Cup of Darts and doubles pairings — coming soon." />;
      case 'tour-card-monitor': return <TourCardMonitorView player={player} />;
      case 'prize-forecaster':  return <StubView title="Prize Money Forecaster"  sub="Projected season earnings — coming soon." />;
      case 'academy-dev':       return <StubView title="Academy & Dev"           sub="Development squad and youth pathway — coming soon." />;
      case 'practice-games':    return <StubView title="Practice Games"          sub="Round-robin practice game tracker — coming soon." />;
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
          <div className="flex-1 overflow-y-auto p-6">{renderView()}</div>

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
    </div>
  );
}

