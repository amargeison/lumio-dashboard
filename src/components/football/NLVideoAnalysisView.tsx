'use client'

import { useState } from 'react'
import {
  Video, Play, Calendar, Trophy, Target, Eye, Activity,
  Clock, Users, TrendingUp, MapPin, Filter,
  AlertCircle, Flag, Zap, Circle,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

// Video & Analysis — Non-League / Lumio Club portal (Harfield FC NPL West).
// Phase 1: hardcoded demo content. No real APIs, no third-party integrations,
// no link to NLSetPiecesView (Phase 2 hook). Squad + opponent names align with
// NL_FIXTURES and NL_SQUAD where possible.

// Convention break note: this view lives in its own file rather than inline in
// nl-content.tsx (where NLTacticsView etc. are inline functions). Reason:
// nl-content.tsx is approaching 5000 lines; inlining a 700+ line V&A view
// here would push it over.

// ─── Theme tokens ────────────────────────────────────────────────────────────
const C = {
  card: '#0D1017',
  border: '#1F2937',
  text: '#F9FAFB',
  muted: '#6B7280',
  mutedStrong: '#9CA3AF',
  accent: '#F59E0B',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  primary: '#14B8A6',   // Lumio Club teal (NL)
} as const

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab = 'library' | 'detail' | 'training' | 'performance' | 'set-pieces' | 'live' | 'opposition'
type MatchResult = 'W' | 'L' | 'D'
type ClipType = 'goal' | 'chance' | 'set-piece' | 'defensive' | 'transition'
type RoutineType = 'corner' | 'free-kick' | 'penalty' | 'throw-in'

type Match = { id: string; date: string; opp: string; ha: 'H' | 'A'; comp: string; result: MatchResult; score: string; clipsCount: number; processed: boolean }
type Clip = { id: string; ts: string; matchId: string; type: ClipType; player: string; description: string }
type TrainingSession = { id: string; date: string; focus: string; durationMin: number; drills: { type: string; clips: number }[] }
type PlayerStat = { name: string; position: string; apps: number; distance_km: number; sprints: number; high_intensity_runs: number; top_speed_kmh: number; avg_speed_kmh: number; passes: number; pass_accuracy: number; key_passes: number; xG: number }
type Routine = { id: string; name: string; type: RoutineType; successRate: number; attempts: number; goals: number; bestExecution: string; description: string }
type PrematchClip = { id: string; label: string; from: string; type: ClipType }

// ─── Inline helpers ──────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl p-5 ${className}`} style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>{children}</div>
}

function KPI({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${C.accent}18` }}>
          <Icon size={16} style={{ color: C.accent }} />
        </div>
      </div>
      <p className="text-2xl font-black" style={{ color: C.text }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: C.muted }}>{label}</p>
      {sub && <p className="text-[10px] mt-1" style={{ color: C.mutedStrong }}>{sub}</p>}
    </Card>
  )
}

function TabBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
      style={{ backgroundColor: active ? C.accent : '#111318', color: active ? '#000' : C.muted, border: active ? 'none' : `1px solid ${C.border}` }}>
      {label}
    </button>
  )
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-28 shrink-0" style={{ color: C.muted }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, transition: 'width 0.5s ease' }} />
      </div>
      <span className="text-xs w-14 text-right font-bold" style={{ color: C.text }}>{value}</span>
    </div>
  )
}

function VideoPlayerPlaceholder({ caption, isLive = false, ts = '00:00 / 90:00', preMatch = false }: { caption: string; isLive?: boolean; ts?: string; preMatch?: boolean }) {
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16 / 9', backgroundColor: '#020409' }}>
      <svg viewBox="0 0 800 450" className="w-full h-full">
        <rect x="0" y="0" width="800" height="450" fill="#0A2410" />
        <rect x="60" y="40" width="680" height="370" stroke="#143820" strokeWidth="2" fill="none" />
        <line x1="400" y1="40" x2="400" y2="410" stroke="#143820" strokeWidth="2" />
        <circle cx="400" cy="225" r="60" stroke="#143820" strokeWidth="2" fill="none" />
        <rect x="60" y="125" width="100" height="200" stroke="#143820" strokeWidth="2" fill="none" />
        <rect x="640" y="125" width="100" height="200" stroke="#143820" strokeWidth="2" fill="none" />
        <circle cx="400" cy="225" r="42" fill="rgba(0,0,0,0.55)" stroke={C.accent} strokeWidth="2" />
        <polygon points="385,203 385,247 427,225" fill={C.accent} />
      </svg>
      {isLive && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.9)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-bold text-white">LIVE</span>
        </div>
      )}
      {preMatch && (
        <div className="absolute top-3 left-3 px-2 py-1 rounded-full" style={{ backgroundColor: `${C.accent}DD` }}>
          <span className="text-[10px] font-bold text-black">PRE-MATCH</span>
        </div>
      )}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <span className="text-xs font-semibold px-2 py-1 rounded" style={{ color: C.text, backgroundColor: 'rgba(0,0,0,0.6)' }}>{ts}</span>
        <span className="text-xs font-semibold px-2 py-1 rounded text-right" style={{ color: C.text, backgroundColor: 'rgba(0,0,0,0.6)' }}>{caption}</span>
      </div>
    </div>
  )
}

function HeatmapPlaceholder({ accent = C.accent }: { accent?: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '3 / 2', backgroundColor: '#0A2410' }}>
      <svg viewBox="0 0 600 400" className="w-full h-full">
        <rect x="0" y="0" width="600" height="400" fill="#0A2410" />
        <rect x="50" y="30" width="500" height="340" stroke="#143820" strokeWidth="2" fill="none" />
        <line x1="300" y1="30" x2="300" y2="370" stroke="#143820" strokeWidth="2" />
        <circle cx="300" cy="200" r="55" stroke="#143820" strokeWidth="2" fill="none" />
        <ellipse cx="200" cy="180" rx="80" ry="55" fill={accent} opacity="0.35" />
        <ellipse cx="280" cy="160" rx="55" ry="40" fill={accent} opacity="0.55" />
        <ellipse cx="340" cy="200" rx="70" ry="50" fill={accent} opacity="0.4" />
        <ellipse cx="420" cy="220" rx="45" ry="30" fill={accent} opacity="0.3" />
        <ellipse cx="160" cy="240" rx="40" ry="28" fill={accent} opacity="0.25" />
      </svg>
    </div>
  )
}

function ClipRow({ clip, isActive, onWatch }: { clip: Clip; isActive: boolean; onWatch: () => void }) {
  const typeIcons: Record<ClipType, React.ElementType> = { goal: Trophy, chance: Target, 'set-piece': Flag, defensive: AlertCircle, transition: Zap }
  const typeColors: Record<ClipType, string> = { goal: C.success, chance: C.accent, 'set-piece': C.primary, defensive: C.danger, transition: '#A78BFA' }
  const Icon = typeIcons[clip.type]
  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: isActive ? `${C.accent}0F` : 'transparent' }}>
      <span className="text-xs font-mono w-14" style={{ color: C.muted }}>{clip.ts}</span>
      <Icon size={14} style={{ color: typeColors[clip.type] }} />
      <span className="text-xs font-semibold w-36 truncate" style={{ color: C.text }}>{clip.player}</span>
      <span className="text-xs flex-1 truncate" style={{ color: C.mutedStrong }}>{clip.description}</span>
      <button onClick={onWatch} className="text-[11px] font-bold px-2.5 py-1 rounded-md" style={{ backgroundColor: isActive ? C.accent : `${C.accent}1A`, color: isActive ? '#000' : C.accent }}>
        {isActive ? 'Playing' : 'Watch'}
      </button>
    </div>
  )
}

function MatchCard({ match, onClick }: { match: Match; onClick: () => void }) {
  const resultColor = match.result === 'W' ? C.success : match.result === 'D' ? C.warning : C.danger
  return (
    <button onClick={onClick} className="text-left rounded-xl overflow-hidden transition-all hover:scale-[1.01]" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
      <div className="relative" style={{ aspectRatio: '16 / 9', backgroundColor: '#0A2410' }}>
        <svg viewBox="0 0 400 225" className="w-full h-full">
          <rect x="0" y="0" width="400" height="225" fill="#0A2410" />
          <rect x="20" y="15" width="360" height="195" stroke="#143820" strokeWidth="1.5" fill="none" />
          <line x1="200" y1="15" x2="200" y2="210" stroke="#143820" strokeWidth="1.5" />
          <circle cx="200" cy="112" r="35" stroke="#143820" strokeWidth="1.5" fill="none" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.6)', border: `1px solid ${C.accent}` }}>
            <Play size={14} style={{ color: C.accent }} />
          </div>
        </div>
        <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: match.processed ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)', color: match.processed ? C.success : C.warning }}>
          {match.processed ? 'Ready' : 'Processing'}
        </span>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold" style={{ color: C.text }}>{match.ha === 'H' ? 'vs' : '@'} {match.opp}</span>
          <span className="text-xs font-bold" style={{ color: resultColor }}>{match.result} {match.score}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: C.muted }}>{match.date} · {match.comp}</span>
          <span className="text-[11px]" style={{ color: C.muted }}>{match.clipsCount} clips</span>
        </div>
      </div>
    </button>
  )
}

// ─── Demo data ───────────────────────────────────────────────────────────────

const MATCHES: Match[] = [
  // 8 matches — opponents drawn from NL_FIXTURES for cross-portal consistency.
  { id: 'm-01', date: 'Sat 22 Feb', opp: 'Bootle',             ha: 'A', comp: 'NPL West',     result: 'W', score: '2-0', clipsCount: 14, processed: true  },
  { id: 'm-02', date: 'Sat 15 Feb', opp: 'Colne',              ha: 'H', comp: 'NPL West',     result: 'W', score: '3-1', clipsCount: 12, processed: true  },
  { id: 'm-03', date: 'Sat 08 Feb', opp: 'Barnoldswick Town',  ha: 'A', comp: 'NPL West',     result: 'W', score: '2-0', clipsCount: 11, processed: true  },
  { id: 'm-04', date: 'Sat 01 Feb', opp: 'Glossop NE',         ha: 'H', comp: 'NPL West',     result: 'D', score: '1-1', clipsCount: 13, processed: true  },
  { id: 'm-05', date: 'Sat 25 Jan', opp: 'Prescot Cables',     ha: 'A', comp: 'NPL West',     result: 'L', score: '1-3', clipsCount: 12, processed: true  },
  { id: 'm-06', date: 'Sat 18 Jan', opp: 'Trafford',           ha: 'H', comp: 'NPL West',     result: 'W', score: '2-0', clipsCount: 12, processed: true  },
  { id: 'm-07', date: 'Sat 11 Jan', opp: 'Mossley',            ha: 'A', comp: 'NPL West',     result: 'D', score: '0-0', clipsCount: 10, processed: true  },
  { id: 'm-08', date: 'Sat 04 Jan', opp: 'Ramsbottom United',  ha: 'H', comp: 'NPL West',     result: 'W', score: '4-1', clipsCount: 12, processed: false },
]

const ACTIVE_MATCH_ID = 'm-01'

const CLIPS: Clip[] = [
  // 14 clips for m-01 (Harfield 2-0 @ Bootle).
  { id: 'c-01', ts: '04:18', matchId: 'm-01', type: 'chance',     player: 'Liam Grady',       description: 'Early header from corner — saved comfortably.' },
  { id: 'c-02', ts: '11:42', matchId: 'm-01', type: 'defensive',  player: 'Danny Prescott',   description: 'Aerial duel won at far post from Bootle corner.' },
  { id: 'c-03', ts: '17:09', matchId: 'm-01', type: 'transition', player: 'Marcus Webb',      description: 'Counter from turnover — Webb finds Fletcher overlap, cross over.' },
  { id: 'c-04', ts: '23:38', matchId: 'm-01', type: 'set-piece',  player: 'Tom Brennan',      description: 'Wall-Hugger Free Kick routine — over the bar.' },
  { id: 'c-05', ts: '28:14', matchId: 'm-01', type: 'goal',       player: 'Liam Grady',       description: 'Knocked in from Simcox knockdown — 1-0.' },
  { id: 'c-06', ts: '34:51', matchId: 'm-01', type: 'chance',     player: 'Ryan Fletcher',    description: 'Pace down the right, cutback blocked.' },
  { id: 'c-07', ts: '41:22', matchId: 'm-01', type: 'set-piece',  player: 'Marcus Webb',      description: 'Corner inswinger — Cartwright header wide.' },
  { id: 'c-08', ts: '47:30', matchId: 'm-01', type: 'transition', player: 'Josh Whitmore',    description: 'Press triggers turnover, vertical pass to Grady — saved.' },
  { id: 'c-09', ts: '54:12', matchId: 'm-01', type: 'defensive',  player: 'Lewis Cartwright', description: 'Tackle on Bootle striker inside the box.' },
  { id: 'c-10', ts: '62:08', matchId: 'm-01', type: 'chance',     player: 'Harry Simcox',     description: 'Far-post tap-in from Webb cross — flagged offside.' },
  { id: 'c-11', ts: '71:44', matchId: 'm-01', type: 'goal',       player: 'Harry Simcox',     description: 'Finish from Fletcher cutback — 2-0.' },
  { id: 'c-12', ts: '78:20', matchId: 'm-01', type: 'defensive',  player: 'Ryan Calloway',    description: 'Two saves in quick succession from Bootle ST.' },
  { id: 'c-13', ts: '84:55', matchId: 'm-01', type: 'set-piece',  player: 'Tom Brennan',      description: 'Long throw routine — recycled.' },
  { id: 'c-14', ts: '90+2', matchId: 'm-01', type: 'transition', player: 'Adam Walsh',       description: 'Late counter — Walsh shoots wide.' },
]

const TRAINING_SESSIONS: TrainingSession[] = [
  { id: 't-01', date: 'Thu 06 May', focus: 'Pre-Redbourne Match Prep', durationMin: 90, drills: [{ type: 'Defensive Shape', clips: 3 }, { type: 'Set-Piece Drills', clips: 5 }, { type: '11v11', clips: 2 }] },
  { id: 't-02', date: 'Tue 04 May', focus: 'Conditioning + Phase Play', durationMin: 75, drills: [{ type: 'Phase Play', clips: 4 }, { type: 'Box Circulation', clips: 3 }] },
  { id: 't-03', date: 'Thu 29 Apr', focus: 'Long-Throw Workshop', durationMin: 60, drills: [{ type: 'Long Throws — Attacking', clips: 6 }, { type: 'Long Throws — Defending', clips: 3 }] },
  { id: 't-04', date: 'Tue 27 Apr', focus: 'Recovery + Walk-Through', durationMin: 45, drills: [{ type: 'Light Tactics Review', clips: 3 }] },
]

const PLAYER_STATS: PlayerStat[] = [
  { name: 'Ryan Calloway',     position: 'GK',  apps: 26, distance_km: 4.6,  sprints: 2,  high_intensity_runs: 5,  top_speed_kmh: 25.8, avg_speed_kmh: 4.1, passes: 28, pass_accuracy: 82, key_passes: 0, xG: 0.0 },
  { name: 'Jake Morley',       position: 'RB',  apps: 24, distance_km: 10.6, sprints: 30, high_intensity_runs: 50, top_speed_kmh: 31.4, avg_speed_kmh: 7.8, passes: 42, pass_accuracy: 79, key_passes: 3, xG: 0.1 },
  { name: 'Danny Prescott',    position: 'CB',  apps: 27, distance_km: 9.8,  sprints: 20, high_intensity_runs: 42, top_speed_kmh: 27.4, avg_speed_kmh: 7.0, passes: 55, pass_accuracy: 88, key_passes: 1, xG: 0.3 },
  { name: 'Lewis Cartwright',  position: 'CB',  apps: 25, distance_km: 9.6,  sprints: 18, high_intensity_runs: 40, top_speed_kmh: 27.0, avg_speed_kmh: 6.9, passes: 52, pass_accuracy: 86, key_passes: 1, xG: 0.2 },
  { name: 'Sam Okonkwo',       position: 'LB',  apps: 22, distance_km: 10.4, sprints: 28, high_intensity_runs: 48, top_speed_kmh: 30.8, avg_speed_kmh: 7.6, passes: 38, pass_accuracy: 78, key_passes: 2, xG: 0.0 },
  { name: 'Tom Brennan',       position: 'CDM', apps: 27, distance_km: 10.8, sprints: 22, high_intensity_runs: 46, top_speed_kmh: 28.2, avg_speed_kmh: 7.5, passes: 62, pass_accuracy: 85, key_passes: 3, xG: 0.2 },
  { name: 'Josh Whitmore',     position: 'CM',  apps: 24, distance_km: 11.0, sprints: 26, high_intensity_runs: 48, top_speed_kmh: 29.4, avg_speed_kmh: 7.7, passes: 58, pass_accuracy: 84, key_passes: 4, xG: 0.4 },
  { name: 'Callum Deakin',     position: 'CM',  apps: 18, distance_km: 10.2, sprints: 22, high_intensity_runs: 44, top_speed_kmh: 28.0, avg_speed_kmh: 7.3, passes: 48, pass_accuracy: 81, key_passes: 3, xG: 0.2 },
  { name: 'Ryan Fletcher',     position: 'RW',  apps: 20, distance_km: 10.4, sprints: 32, high_intensity_runs: 52, top_speed_kmh: 32.0, avg_speed_kmh: 7.5, passes: 36, pass_accuracy: 77, key_passes: 5, xG: 0.5 },
  { name: 'Marcus Webb',       position: 'LW',  apps: 25, distance_km: 10.6, sprints: 30, high_intensity_runs: 50, top_speed_kmh: 31.2, avg_speed_kmh: 7.6, passes: 38, pass_accuracy: 76, key_passes: 5, xG: 0.4 },
  { name: 'Liam Grady',        position: 'ST',  apps: 27, distance_km: 10.2, sprints: 26, high_intensity_runs: 46, top_speed_kmh: 30.6, avg_speed_kmh: 7.2, passes: 28, pass_accuracy: 75, key_passes: 3, xG: 0.7 },
  { name: 'Harry Simcox',      position: 'ST',  apps: 23, distance_km: 9.8,  sprints: 22, high_intensity_runs: 42, top_speed_kmh: 29.0, avg_speed_kmh: 7.0, passes: 30, pass_accuracy: 76, key_passes: 2, xG: 0.5 },
  { name: 'Tyler Rooney',      position: 'AM',  apps: 16, distance_km: 10.0, sprints: 24, high_intensity_runs: 44, top_speed_kmh: 28.6, avg_speed_kmh: 7.4, passes: 46, pass_accuracy: 82, key_passes: 4, xG: 0.3 },
  { name: 'Adam Walsh',        position: 'RW',  apps: 19, distance_km: 10.2, sprints: 28, high_intensity_runs: 46, top_speed_kmh: 30.2, avg_speed_kmh: 7.4, passes: 32, pass_accuracy: 76, key_passes: 3, xG: 0.3 },
  { name: 'Chris Platt',       position: 'CB',  apps: 18, distance_km: 9.5,  sprints: 18, high_intensity_runs: 38, top_speed_kmh: 27.0, avg_speed_kmh: 6.8, passes: 48, pass_accuracy: 85, key_passes: 0, xG: 0.1 },
  { name: 'Craig Dunne',       position: 'CB',  apps: 15, distance_km: 9.6,  sprints: 16, high_intensity_runs: 38, top_speed_kmh: 26.4, avg_speed_kmh: 6.8, passes: 46, pass_accuracy: 84, key_passes: 0, xG: 0.1 },
]

const SET_PIECE_ROUTINES: Routine[] = [
  { id: 'r-01', name: 'Long Throw to Far Post',     type: 'throw-in',  successRate: 32, attempts: 12, goals: 4, bestExecution: 'vs Barnoldswick Town · 08 Feb', description: 'Cartwright launches long throw to far post; Prescott + Dunne pair to attack second ball.' },
  { id: 'r-02', name: 'Inswinger Near Post',         type: 'corner',    successRate: 28, attempts: 9,  goals: 2, bestExecution: 'vs Colne · 15 Feb',              description: 'Webb inswinger to near post; Grady flicks across goal.' },
  { id: 'r-03', name: 'Brennan Direct',              type: 'free-kick', successRate: 38, attempts: 6,  goals: 2, bestExecution: 'vs Trafford · 18 Jan',           description: 'Brennan direct from 22-25y, aimed at near top corner over jumping wall.' },
  { id: 'r-04', name: 'Short Corner Drag',           type: 'corner',    successRate: 22, attempts: 8,  goals: 1, bestExecution: 'vs Bootle · 22 Feb',             description: 'Webb plays short to Whitmore; pull-back to Brennan arriving at edge.' },
  { id: 'r-05', name: 'Penalty Power',               type: 'penalty',   successRate: 75, attempts: 4,  goals: 3, bestExecution: 'vs Glossop NE · 01 Feb',         description: 'Grady straight power, top half of goal — picks his corner late.' },
  { id: 'r-06', name: 'Wall Switch Free Kick',       type: 'free-kick', successRate: 18, attempts: 5,  goals: 1, bestExecution: 'vs Mossley · 11 Jan',            description: 'Brennan plays short to Whitmore; switch to opposite flank with one-touch cross.' },
]

const PREMATCH_PLAYLIST: PrematchClip[] = [
  { id: 'pm-01', label: 'Redbourne Town · last vs Harfield · opening goal',         from: '08 Mar (away)', type: 'goal' },
  { id: 'pm-02', label: 'Redbourne Town · last vs Harfield · set-piece concession', from: '08 Mar (away)', type: 'set-piece' },
  { id: 'pm-03', label: 'Redbourne Town · vs Glossop · counter-attacking pattern',  from: '03 May (away)', type: 'transition' },
  { id: 'pm-04', label: 'Redbourne Town · vs Trafford · high-block goal',           from: '26 Apr (home)', type: 'goal' },
  { id: 'pm-05', label: 'Redbourne Town · vs Mossley · defensive error from press', from: '19 Apr (home)', type: 'defensive' },
  { id: 'pm-06', label: 'Redbourne Town · vs Bootle · final-third pattern',         from: '12 Apr (away)', type: 'chance' },
]

const LIVE_STATE = {
  status: 'WAITING FOR KICK-OFF' as const,
  competition: 'NPL West',
  homeTeam: 'Harfield',
  awayTeam: 'Redbourne Town',
  date: 'Sat 11 May',
  kickoff: '15:00',
  countdown: '1d 14h to go',
}

const OPPOSITION = {
  name: 'Redbourne Town',
  position: 9,
  form: ['W', 'L', 'D', 'W', 'W'] as MatchResult[],
  dangerPlayers: [
    { name: 'C. Hutchings',  position: 'ST', stat: '12 goals — strong link play, holds the ball up well' },
    { name: 'D. Mariner',    position: 'CM', stat: 'Range passer, 88 long balls / game, set-piece taker' },
    { name: 'L. Greaves',    position: 'RW', stat: '1v1 pace; double up on the left to contain' },
  ],
  setPieceThreat: {
    cornerConversion: 16,
    freeKickZones: 'Wide free-kicks 22-30y, look for crosses to back stick',
    note: 'Mariner takes everything direct. Hutchings runs across the keeper to back post.',
  },
  weakness: 'Slow CB pairing — exploit second-balls and pace down the channels. Their RB struggles 1v1.',
}

// ─── Sub-tab components ─────────────────────────────────────────────────────

function MatchLibraryTab({ onSelectMatch }: { onSelectMatch: (id: string) => void }) {
  const [filterResult, setFilterResult] = useState<'all' | MatchResult>('all')
  const [filterVenue, setFilterVenue] = useState<'all' | 'H' | 'A'>('all')
  const filtered = MATCHES.filter(m => (filterResult === 'all' || m.result === filterResult) && (filterVenue === 'all' || m.ha === filterVenue))
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: C.muted }}><Filter size={12} /> Filter</span>
          <div className="flex gap-1.5">
            {(['all', 'W', 'D', 'L'] as const).map(r => (
              <button key={r} onClick={() => setFilterResult(r)} className="px-2.5 py-1 rounded-md text-[11px] font-semibold"
                style={{ backgroundColor: filterResult === r ? C.accent : '#111318', color: filterResult === r ? '#000' : C.muted, border: `1px solid ${filterResult === r ? C.accent : C.border}` }}>
                {r === 'all' ? 'All results' : r}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {(['all', 'H', 'A'] as const).map(v => (
              <button key={v} onClick={() => setFilterVenue(v)} className="px-2.5 py-1 rounded-md text-[11px] font-semibold"
                style={{ backgroundColor: filterVenue === v ? C.accent : '#111318', color: filterVenue === v ? '#000' : C.muted, border: `1px solid ${filterVenue === v ? C.accent : C.border}` }}>
                {v === 'all' ? 'All venues' : v === 'H' ? 'Home' : 'Away'}
              </button>
            ))}
          </div>
          <span className="text-[11px] ml-auto" style={{ color: C.mutedStrong }}>{filtered.length} of {MATCHES.length} matches</span>
        </div>
      </Card>
      {filtered.length === 0 ? (
        <Card><p className="text-sm text-center py-6" style={{ color: C.muted }}>No matches match the current filter.</p></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(m => <MatchCard key={m.id} match={m} onClick={() => onSelectMatch(m.id)} />)}
        </div>
      )}
    </div>
  )
}

function MatchDetailTab({ matchId }: { matchId: string }) {
  const [typeFilter, setTypeFilter] = useState<'all' | ClipType>('all')
  const [activeClip, setActiveClip] = useState<string | null>(CLIPS[0]?.id ?? null)
  const match = MATCHES.find(m => m.id === matchId) ?? MATCHES[0]
  const matchClips = CLIPS.filter(c => c.matchId === matchId)
  const filtered = typeFilter === 'all' ? matchClips : matchClips.filter(c => c.type === typeFilter)
  const current = matchClips.find(c => c.id === activeClip) ?? matchClips[0]
  const caption = `${match.ha === 'H' ? 'Harfield' : match.opp} ${match.score.split('-')[0]}-${match.score.split('-')[1]} ${match.ha === 'H' ? match.opp : 'Harfield'} · ${match.date}`
  return (
    <div className="space-y-4">
      {!match.processed && (
        <Card className="!p-3">
          <p className="text-xs" style={{ color: C.warning }}><AlertCircle size={12} className="inline mr-1" />This match is still processing — clips will appear here once the analysis pass completes.</p>
        </Card>
      )}
      {matchClips.length === 0 ? (
        <Card><p className="text-sm text-center py-12" style={{ color: C.muted }}>No clips available for this match yet.</p></Card>
      ) : (
        <>
          <VideoPlayerPlaceholder caption={caption} ts={`${current?.ts ?? '00:00'} / 90:00`} />
          <Card>
            <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Timeline</p>
            <div className="relative h-8 rounded-md" style={{ backgroundColor: '#111318', border: `1px solid ${C.border}` }}>
              {matchClips.map(c => {
                const [mm, ss] = c.ts.split(':')
                // Strips '+' from stoppage-time stamps like "90+3" so timeline placement maths works. Phase 2 will store seconds-from-kickoff directly.
                const mins = parseInt(mm.replace('+', '')) + (ss ? parseInt(ss) / 60 : 0)
                const pct = Math.min(100, (mins / 90) * 100)
                const isActive = c.id === activeClip
                const colour = c.type === 'goal' ? C.success : c.type === 'chance' ? C.accent : c.type === 'set-piece' ? C.primary : c.type === 'defensive' ? C.danger : '#A78BFA'
                return (
                  <button key={c.id} onClick={() => setActiveClip(c.id)} title={`${c.ts} — ${c.player}`}
                    className="absolute top-1/2 -translate-y-1/2 rounded-full transition-all hover:scale-150"
                    style={{ left: `${pct}%`, width: isActive ? 12 : 8, height: isActive ? 12 : 8, backgroundColor: colour, border: isActive ? `2px solid ${C.text}` : 'none' }} />
                )
              })}
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px]" style={{ color: C.muted }}>
              <span>0:00</span><span>45:00</span><span>90:00</span>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: C.text }}>Clips ({filtered.length})</p>
              <div className="flex gap-1.5 flex-wrap">
                {(['all', 'goal', 'chance', 'set-piece', 'defensive', 'transition'] as const).map(t => (
                  <button key={t} onClick={() => setTypeFilter(t)} className="px-2 py-1 rounded-md text-[10px] font-semibold"
                    style={{ backgroundColor: typeFilter === t ? C.accent : '#111318', color: typeFilter === t ? '#000' : C.muted, border: `1px solid ${typeFilter === t ? C.accent : C.border}` }}>
                    {t === 'all' ? 'All' : t}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              {filtered.map(c => <ClipRow key={c.id} clip={c} isActive={c.id === activeClip} onWatch={() => setActiveClip(c.id)} />)}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function TrainingTab() {
  const [activeSession, setActiveSession] = useState<string>(TRAINING_SESSIONS[0].id)
  const session = TRAINING_SESSIONS.find(s => s.id === activeSession) ?? TRAINING_SESSIONS[0]
  const totalClips = session.drills.reduce((sum, d) => sum + d.clips, 0)
  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Recent Sessions</p>
        <div className="flex gap-2 flex-wrap">
          {TRAINING_SESSIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSession(s.id)} className="px-3 py-2 rounded-lg text-left transition-all"
              style={{ backgroundColor: s.id === activeSession ? `${C.accent}1A` : '#111318', border: `1px solid ${s.id === activeSession ? C.accent : C.border}` }}>
              <p className="text-xs font-bold" style={{ color: s.id === activeSession ? C.accent : C.text }}>{s.focus}</p>
              <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>{s.date} · {s.durationMin} min</p>
            </button>
          ))}
        </div>
      </Card>
      <VideoPlayerPlaceholder caption={`${session.focus} · ${session.date}`} ts={`Drill 1 of ${session.drills.length}`} />
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold" style={{ color: C.text }}>Drills ({totalClips} clips)</p>
          <span className="text-xs" style={{ color: C.muted }}>{session.durationMin} min total</span>
        </div>
        <div className="space-y-2">
          {session.drills.map((d, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#111318', border: `1px solid ${C.border}` }}>
              <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: `${C.accent}1A` }}>
                <Activity size={14} style={{ color: C.accent }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: C.text }}>{d.type}</p>
                <p className="text-[11px]" style={{ color: C.muted }}>{d.clips} clips · click to expand drill</p>
              </div>
              <button className="text-[11px] font-bold px-2.5 py-1 rounded-md" style={{ backgroundColor: `${C.accent}1A`, color: C.accent }}>View</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function PlayerPerformanceTab() {
  const [sortBy, setSortBy] = useState<keyof PlayerStat>('distance_km')
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)
  const outfield = PLAYER_STATS.filter(p => p.position !== 'GK')
  const sorted = [...outfield].sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number))
  const avgDistance = (outfield.reduce((s, p) => s + p.distance_km, 0) / outfield.length).toFixed(1)
  const avgSprints = Math.round(outfield.reduce((s, p) => s + p.sprints, 0) / outfield.length)
  const topPerformer = sorted[0]
  const trendData = [
    { match: 'M-08', distance: 10.0, sprints: 23 },
    { match: 'M-07', distance: 10.2, sprints: 24 },
    { match: 'M-06', distance: 10.4, sprints: 25 },
    { match: 'M-05', distance: 10.1, sprints: 24 },
    { match: 'M-04', distance: 10.3, sprints: 26 },
    { match: 'M-03', distance: 10.5, sprints: 26 },
    { match: 'M-02', distance: 10.4, sprints: 25 },
    { match: 'M-01', distance: 10.6, sprints: 27 },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={MapPin}     label="Squad Avg Distance"  value={`${avgDistance} km`} sub="per outfield player / match" />
        <KPI icon={Zap}        label="Squad Avg Sprints"   value={`${avgSprints}`}     sub="per outfield player / match" />
        <KPI icon={TrendingUp} label="Top Performer"       value={topPerformer.name}    sub={`${topPerformer.distance_km} km · ${topPerformer.sprints} sprints`} />
        <KPI icon={Calendar}   label="Match Count"         value={`${MATCHES.length}`}  sub="this season" />
      </div>
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Squad Averages — Last 8 Matches</p>
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="match" stroke={C.muted} tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left"  stroke={C.muted} tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke={C.muted} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="left"  type="monotone" dataKey="distance" name="Distance (km)" stroke={C.accent}  strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="sprints"  name="Sprints"        stroke={C.primary} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold" style={{ color: C.text }}>Player Performance</p>
          <div className="flex gap-1.5 flex-wrap">
            {(['distance_km', 'sprints', 'top_speed_kmh', 'passes', 'xG'] as const).map(k => (
              <button key={k} onClick={() => setSortBy(k)} className="px-2 py-1 rounded-md text-[10px] font-semibold"
                style={{ backgroundColor: sortBy === k ? C.accent : '#111318', color: sortBy === k ? '#000' : C.muted, border: `1px solid ${sortBy === k ? C.accent : C.border}` }}>
                Sort: {k.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th className="text-left py-2 pr-4 font-semibold" style={{ color: C.muted }}>Player</th>
                <th className="text-left py-2 pr-4 font-semibold" style={{ color: C.muted }}>Pos</th>
                <th className="text-right py-2 pr-4 font-semibold" style={{ color: C.muted }}>Apps</th>
                <th className="text-right py-2 pr-4 font-semibold" style={{ color: C.muted }}>Dist/m (km)</th>
                <th className="text-right py-2 pr-4 font-semibold" style={{ color: C.muted }}>Sprints/m</th>
                <th className="text-right py-2 pr-4 font-semibold" style={{ color: C.muted }}>Top Speed</th>
                <th className="text-right py-2 pr-4 font-semibold" style={{ color: C.muted }}>Pass %</th>
                <th className="text-right py-2 font-semibold" style={{ color: C.muted }}>xG</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => (
                <tr key={p.name} onClick={() => setExpandedPlayer(expandedPlayer === p.name ? null : p.name)}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: expandedPlayer === p.name ? `${C.accent}0A` : 'transparent' }}>
                  <td className="py-2 pr-4 font-semibold" style={{ color: C.text }}>{p.name}</td>
                  <td className="py-2 pr-4" style={{ color: C.muted }}>{p.position}</td>
                  <td className="py-2 pr-4 text-right font-mono" style={{ color: C.mutedStrong }}>{p.apps}</td>
                  <td className="py-2 pr-4 text-right font-mono" style={{ color: C.text }}>{p.distance_km}</td>
                  <td className="py-2 pr-4 text-right font-mono" style={{ color: C.text }}>{p.sprints}</td>
                  <td className="py-2 pr-4 text-right font-mono" style={{ color: C.text }}>{p.top_speed_kmh}</td>
                  <td className="py-2 pr-4 text-right font-mono" style={{ color: C.text }}>{p.pass_accuracy}%</td>
                  <td className="py-2 text-right font-mono" style={{ color: C.text }}>{p.xG.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {expandedPlayer && (() => {
          const p = PLAYER_STATS.find(x => x.name === expandedPlayer)!
          return (
            <div className="mt-4 pt-4 grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ borderTop: `1px solid ${C.border}` }}>
              <div>
                <p className="text-sm font-bold mb-3" style={{ color: C.text }}>{p.name} — Position Heatmap</p>
                <HeatmapPlaceholder />
              </div>
              <div>
                <p className="text-sm font-bold mb-3" style={{ color: C.text }}>5-Match Trend</p>
                <div className="space-y-2">
                  <StatBar label="Distance (km)"   value={p.distance_km}        max={13}  color={C.accent} />
                  <StatBar label="Sprints"         value={p.sprints}            max={45}  color={C.accent} />
                  <StatBar label="Top Speed (kmh)" value={p.top_speed_kmh}      max={36}  color={C.primary} />
                  <StatBar label="Pass %"          value={p.pass_accuracy}      max={100} color={C.primary} />
                  <StatBar label="Key Passes"      value={p.key_passes}         max={8}   color={C.success} />
                  <StatBar label="xG"              value={Math.round(p.xG * 100) / 100} max={1} color={C.success} />
                </div>
              </div>
            </div>
          )
        })()}
      </Card>
    </div>
  )
}

function SetPieceStudioTab() {
  const [typeFilter, setTypeFilter] = useState<'all' | RoutineType>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const filtered = typeFilter === 'all' ? SET_PIECE_ROUTINES : SET_PIECE_ROUTINES.filter(r => r.type === typeFilter)
  const sorted = [...filtered].sort((a, b) => b.successRate - a.successRate)
  return (
    <div className="space-y-4">
      <Card><p className="text-xs font-semibold" style={{ color: C.muted }}>Phase 1 demo content — hardcoded routines. Phase 2 will wire to the restored Set-Pieces library.</p></Card>
      <Card>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: C.muted }}><Filter size={12} /> Type</span>
          <div className="flex gap-1.5">
            {(['all', 'corner', 'free-kick', 'penalty', 'throw-in'] as const).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className="px-2.5 py-1 rounded-md text-[11px] font-semibold"
                style={{ backgroundColor: typeFilter === t ? C.accent : '#111318', color: typeFilter === t ? '#000' : C.muted, border: `1px solid ${typeFilter === t ? C.accent : C.border}` }}>
                {t}
              </button>
            ))}
          </div>
          <span className="text-[11px] ml-auto" style={{ color: C.mutedStrong }}>Sorted by success rate</span>
        </div>
      </Card>
      <div className="space-y-2">
        {sorted.map(r => (
          <Card key={r.id} className="!p-0">
            <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="w-full text-left p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${C.accent}1A` }}>
                <Target size={18} style={{ color: C.accent }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: C.text }}>{r.name}</p>
                <p className="text-[11px]" style={{ color: C.muted }}>{r.type} · {r.goals} goals from {r.attempts} attempts · best: {r.bestExecution}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black" style={{ color: r.successRate >= 30 ? C.success : r.successRate >= 20 ? C.warning : C.danger }}>{r.successRate}%</p>
                <p className="text-[10px]" style={{ color: C.muted }}>success rate</p>
              </div>
            </button>
            {expanded === r.id && (
              <div className="px-4 pb-4 pt-2 grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ borderTop: `1px solid ${C.border}` }}>
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: C.text }}>Routine Map</p>
                  <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio: '3 / 2', backgroundColor: '#0A2410' }}>
                    <svg viewBox="0 0 600 400" className="w-full h-full">
                      <rect x="0" y="0" width="600" height="400" fill="#0A2410" />
                      <rect x="50" y="30" width="500" height="340" stroke="#143820" strokeWidth="2" fill="none" />
                      <line x1="300" y1="30" x2="300" y2="370" stroke="#143820" strokeWidth="2" />
                      <circle cx="300" cy="200" r="55" stroke="#143820" strokeWidth="2" fill="none" />
                      <rect x="50" y="120" width="80" height="160" stroke="#143820" strokeWidth="2" fill="none" />
                      <rect x="470" y="120" width="80" height="160" stroke="#143820" strokeWidth="2" fill="none" />
                      <circle cx="540" cy="120" r="6" fill={C.accent} />
                      <circle cx="500" cy="180" r="5" fill="#A78BFA" />
                      <circle cx="500" cy="220" r="5" fill="#A78BFA" />
                      <circle cx="470" cy="200" r="5" fill="#A78BFA" />
                      <path d="M 540 120 Q 510 160 490 200" stroke={C.accent} strokeWidth="2" strokeDasharray="4 3" fill="none" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: C.text }}>Description</p>
                  <p className="text-xs mb-3" style={{ color: C.mutedStrong }}>{r.description}</p>
                  <p className="text-xs font-bold mb-2" style={{ color: C.text }}>Best Execution</p>
                  <p className="text-xs" style={{ color: C.mutedStrong }}>{r.bestExecution}</p>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="text-center p-2 rounded-md" style={{ backgroundColor: '#111318' }}><p className="text-lg font-black" style={{ color: C.success }}>{r.goals}</p><p className="text-[10px]" style={{ color: C.muted }}>goals</p></div>
                    <div className="text-center p-2 rounded-md" style={{ backgroundColor: '#111318' }}><p className="text-lg font-black" style={{ color: C.text }}>{r.attempts}</p><p className="text-[10px]" style={{ color: C.muted }}>attempts</p></div>
                    <div className="text-center p-2 rounded-md" style={{ backgroundColor: '#111318' }}><p className="text-lg font-black" style={{ color: C.accent }}>{r.successRate}%</p><p className="text-[10px]" style={{ color: C.muted }}>conv.</p></div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

function LiveMatchTab() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-black tracking-wide" style={{ backgroundColor: `${C.accent}22`, color: C.accent, border: `1px solid ${C.accent}` }}>{LIVE_STATE.status}</span>
            <span className="text-sm font-bold" style={{ color: C.text }}>{LIVE_STATE.homeTeam} vs {LIVE_STATE.awayTeam}</span>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: C.muted }}>{LIVE_STATE.competition} · {LIVE_STATE.date}</p>
            <p className="text-xs font-bold" style={{ color: C.text }}>{LIVE_STATE.kickoff} KO · {LIVE_STATE.countdown}</p>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Pre-Match Preview</p>
          <VideoPlayerPlaceholder caption={`vs ${LIVE_STATE.awayTeam} · Pre-match`} ts="Pre-match" preMatch />
        </Card>
        <Card>
          <p className="text-sm font-bold mb-2" style={{ color: C.text }}>Match Day</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span style={{ color: C.muted }}>Opponent</span><span style={{ color: C.text }} className="font-bold">{LIVE_STATE.awayTeam}</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Competition</span><span style={{ color: C.text }}>{LIVE_STATE.competition}</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Date</span><span style={{ color: C.text }}>{LIVE_STATE.date}</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Kickoff</span><span style={{ color: C.text }}>{LIVE_STATE.kickoff}</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Countdown</span><span style={{ color: C.accent }} className="font-bold">{LIVE_STATE.countdown}</span></div>
          </div>
          <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
            <p className="text-[11px]" style={{ color: C.mutedStrong }}>Live event feed appears here once kick-off begins. Currently in pre-match mode.</p>
          </div>
        </Card>
      </div>
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Opposition Clip Playlist — vs {LIVE_STATE.awayTeam}</p>
        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          {PREMATCH_PLAYLIST.map(p => {
            const typeColors: Record<ClipType, string> = { goal: C.success, chance: C.accent, 'set-piece': C.primary, defensive: C.danger, transition: '#A78BFA' }
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                <Circle size={8} style={{ color: typeColors[p.type] }} fill={typeColors[p.type]} />
                <span className="text-xs flex-1" style={{ color: C.text }}>{p.label}</span>
                <span className="text-[10px]" style={{ color: C.muted }}>{p.from}</span>
                <button className="text-[11px] font-bold px-2.5 py-1 rounded-md" style={{ backgroundColor: `${C.accent}1A`, color: C.accent }}>Watch</button>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function OppositionAnalysisTab() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: `${C.danger}22`, border: `1px solid ${C.danger}` }}>
              <Eye size={20} style={{ color: C.danger }} />
            </div>
            <div>
              <p className="text-xl font-black" style={{ color: C.text }}>{OPPOSITION.name}</p>
              <p className="text-xs" style={{ color: C.muted }}>NPL West · Position {OPPOSITION.position}th</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold mr-1" style={{ color: C.muted }}>Last 5:</span>
            {OPPOSITION.form.map((r, i) => {
              const colour = r === 'W' ? C.success : r === 'D' ? C.warning : C.danger
              return <span key={i} className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold" style={{ backgroundColor: `${colour}22`, color: colour, border: `1px solid ${colour}` }}>{r}</span>
            })}
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Average Positions (last 5)</p>
          <HeatmapPlaceholder accent={C.danger} />
          <p className="text-[11px] mt-3" style={{ color: C.mutedStrong }}>{OPPOSITION.weakness}</p>
        </Card>
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Danger Players</p>
          <div className="space-y-2">
            {OPPOSITION.dangerPlayers.map(p => (
              <div key={p.name} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#111318', border: `1px solid ${C.border}` }}>
                <div className="flex h-8 w-8 items-center justify-center rounded-md shrink-0" style={{ backgroundColor: `${C.danger}1A` }}>
                  <AlertCircle size={14} style={{ color: C.danger }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: C.text }}>{p.name} <span className="text-[10px] font-semibold ml-1" style={{ color: C.muted }}>{p.position}</span></p>
                  <p className="text-[11px] mt-0.5" style={{ color: C.mutedStrong }}>{p.stat}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Set-Piece Threat Profile</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#111318', border: `1px solid ${C.border}` }}>
            <p className="text-xs font-semibold" style={{ color: C.muted }}>Corner Conversion</p>
            <p className="text-2xl font-black mt-1" style={{ color: C.danger }}>{OPPOSITION.setPieceThreat.cornerConversion}%</p>
            <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>above league avg (10%)</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#111318', border: `1px solid ${C.border}` }}>
            <p className="text-xs font-semibold" style={{ color: C.muted }}>Free-Kick Zones</p>
            <p className="text-sm font-bold mt-1" style={{ color: C.text }}>{OPPOSITION.setPieceThreat.freeKickZones}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#111318', border: `1px solid ${C.border}` }}>
            <p className="text-xs font-semibold" style={{ color: C.muted }}>Notes</p>
            <p className="text-[11px] mt-1" style={{ color: C.mutedStrong }}>{OPPOSITION.setPieceThreat.note}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── Main export ────────────────────────────────────────────────────────────

export default function NLVideoAnalysisView() {
  const [tab, setTab] = useState<Tab>('library')
  const [activeMatch, setActiveMatch] = useState<string>(ACTIVE_MATCH_ID)

  const totalClips = MATCHES.reduce((s, m) => s + m.clipsCount, 0)
  const processedCount = MATCHES.filter(m => m.processed).length
  const outfield = PLAYER_STATS.filter(p => p.position !== 'GK')
  const avgDistance = (outfield.reduce((s, p) => s + p.distance_km, 0) / outfield.length).toFixed(1)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${C.accent}1A` }}>
          <Video size={20} style={{ color: C.accent }} />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: C.text }}>Video & Analysis</h2>
          <p className="text-xs" style={{ color: C.muted }}>Tactical clips, performance data, and opposition intelligence — NPL West</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={Trophy}     label="Matches"          value={`${MATCHES.length}`}              sub={`${processedCount} processed`} />
        <KPI icon={Video}      label="Total Clips"      value={`${totalClips}`}                  sub="across season" />
        <KPI icon={MapPin}     label="Avg Distance"     value={`${avgDistance} km`}              sub="outfield / match" />
        <KPI icon={Target}     label="Active Routines"  value={`${SET_PIECE_ROUTINES.length}`}   sub="set-piece library" />
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <TabBtn active={tab === 'library'}     label="Match Library"        onClick={() => setTab('library')} />
        <TabBtn active={tab === 'detail'}      label="Match Detail"         onClick={() => setTab('detail')} />
        <TabBtn active={tab === 'training'}    label="Training"             onClick={() => setTab('training')} />
        <TabBtn active={tab === 'performance'} label="Player Performance"   onClick={() => setTab('performance')} />
        <TabBtn active={tab === 'set-pieces'}  label="Set-Piece Studio"     onClick={() => setTab('set-pieces')} />
        <TabBtn active={tab === 'live'}        label="Live Match"           onClick={() => setTab('live')} />
        <TabBtn active={tab === 'opposition'}  label="Opposition Analysis"  onClick={() => setTab('opposition')} />
      </div>
      {tab === 'library'     && <MatchLibraryTab        onSelectMatch={id => { setActiveMatch(id); setTab('detail') }} />}
      {tab === 'detail'      && <MatchDetailTab         matchId={activeMatch} />}
      {tab === 'training'    && <TrainingTab />}
      {tab === 'performance' && <PlayerPerformanceTab />}
      {tab === 'set-pieces'  && <SetPieceStudioTab />}
      {tab === 'live'        && <LiveMatchTab />}
      {tab === 'opposition'  && <OppositionAnalysisTab />}
    </div>
  )
}
