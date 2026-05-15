'use client'

import { useState } from 'react'
import {
  Video, Play, Calendar, Trophy, Target, Eye, BarChart3, Activity,
  Clock, Users, TrendingUp, MapPin, Filter,
  AlertCircle, Flag, Zap, Circle,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

// Video & Analysis — Pro portal (Oakridge FC).
// Phase 1: hardcoded demo content. No real APIs, no third-party
// integrations, no link to the restored set-piece library (that's
// a Phase 2 hook). All data inline. Squad + opponent names align with
// the rest of the Pro portal where possible.

// ─── Theme tokens ────────────────────────────────────────────────────────────
const C = {
  card: '#0D1017',
  border: '#1F2937',
  text: '#F9FAFB',
  muted: '#6B7280',
  mutedStrong: '#9CA3AF',
  accent: '#F59E0B',         // V&A signature amber
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  primary: '#003DA5',         // Oakridge FC blue
} as const

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab = 'library' | 'detail' | 'training' | 'performance' | 'set-pieces' | 'live' | 'opposition'
type MatchResult = 'W' | 'L' | 'D'
type ClipType = 'goal' | 'chance' | 'set-piece' | 'defensive' | 'transition'
type RoutineType = 'corner' | 'free-kick' | 'penalty' | 'throw-in'

type Match = {
  id: string
  date: string
  opp: string
  ha: 'H' | 'A'
  comp: string
  result: MatchResult
  score: string
  clipsCount: number
  processed: boolean
}

type Clip = {
  id: string
  ts: string
  matchId: string
  type: ClipType
  player: string
  description: string
}

type TrainingSession = {
  id: string
  date: string
  focus: string
  durationMin: number
  drills: { type: string; clips: number }[]
}

type PlayerStat = {
  name: string
  position: string
  apps: number
  distance_km: number
  sprints: number
  high_intensity_runs: number
  top_speed_kmh: number
  avg_speed_kmh: number
  passes: number
  pass_accuracy: number
  key_passes: number
  xG: number
}

type Routine = {
  id: string
  name: string
  type: RoutineType
  successRate: number
  attempts: number
  goals: number
  bestExecution: string
  description: string
}

type LiveEvent = { min: string; type: 'goal' | 'yellow' | 'red' | 'sub' | 'chance' | 'whistle'; team: 'home' | 'away' | null; text: string }

// ─── Inline helpers ──────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl p-5 ${className}`} style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
      {children}
    </div>
  )
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

function VideoPlayerPlaceholder({ caption, isLive = false, ts = '00:00 / 90:00' }: { caption: string; isLive?: boolean; ts?: string }) {
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
  { id: 'm-01', date: 'Sat 03 May', opp: 'Eastcliff Town',      ha: 'H', comp: 'League One',     result: 'W', score: '2-1', clipsCount: 27, processed: true  },
  { id: 'm-02', date: 'Sat 26 Apr', opp: 'Northgate City',      ha: 'A', comp: 'League One',     result: 'L', score: '1-2', clipsCount: 25, processed: true  },
  { id: 'm-03', date: 'Sat 12 Apr', opp: 'Fernbrook Athletic',  ha: 'A', comp: 'League One',     result: 'D', score: '1-1', clipsCount: 23, processed: true  },
  { id: 'm-04', date: 'Sat 05 Apr', opp: 'Castleton Rovers',    ha: 'H', comp: 'League One',     result: 'W', score: '2-0', clipsCount: 21, processed: true  },
  { id: 'm-05', date: 'Sat 29 Mar', opp: 'Glenmoor Wanderers',  ha: 'H', comp: 'EFL Cup R2',     result: 'W', score: '3-0', clipsCount: 28, processed: true  },
  { id: 'm-06', date: 'Sat 22 Mar', opp: 'Hartwell Town',       ha: 'H', comp: 'League One',     result: 'W', score: '1-0', clipsCount: 24, processed: true  },
  { id: 'm-07', date: 'Tue 18 Mar', opp: 'Ashbourne United',    ha: 'A', comp: 'League One',     result: 'L', score: '0-1', clipsCount: 22, processed: true  },
  { id: 'm-08', date: 'Sat 15 Mar', opp: 'Thornvale FC',        ha: 'A', comp: 'League One',     result: 'D', score: '2-2', clipsCount: 26, processed: true  },
  { id: 'm-09', date: 'Sat 08 Mar', opp: 'Kingsmere City',      ha: 'H', comp: 'League One',     result: 'W', score: '3-1', clipsCount: 30, processed: true  },
  { id: 'm-10', date: 'Wed 04 Mar', opp: 'Ridgefield Athletic', ha: 'H', comp: 'County Cup SF',  result: 'W', score: '2-1', clipsCount: 25, processed: true  },
  { id: 'm-11', date: 'Sat 01 Mar', opp: 'Glenmoor Wanderers',  ha: 'A', comp: 'League One',     result: 'W', score: '1-0', clipsCount: 23, processed: false },
  { id: 'm-12', date: 'Sat 22 Feb', opp: 'Hartwell Town',       ha: 'A', comp: 'League One',     result: 'D', score: '0-0', clipsCount: 0,  processed: false },
]

const ACTIVE_MATCH_ID = 'm-01'

const CLIPS: Clip[] = [
  // 27 clips for m-01 (Oakridge 2-1 Eastcliff Town, 03 May)
  { id: 'c-01', ts: '02:14', matchId: 'm-01', type: 'chance',     player: 'Dean Morris',     description: 'Early shot from edge of box — saved low to the right.' },
  { id: 'c-02', ts: '06:38', matchId: 'm-01', type: 'transition', player: 'James Tilley',    description: 'Counter-press won possession, switch to Tilley on the right.' },
  { id: 'c-03', ts: '09:12', matchId: 'm-01', type: 'goal',       player: 'J. Reece (Eastcliff)', description: 'Header from corner — front-post run beat Webb.' },
  { id: 'c-04', ts: '12:47', matchId: 'm-01', type: 'set-piece',  player: 'Liam Barker',     description: 'Free-kick from 25y — flicked over wall, gathered.' },
  { id: 'c-05', ts: '17:22', matchId: 'm-01', type: 'defensive',  player: 'Marcus Reid',     description: 'Last-ditch block from Doyle inside the area.' },
  { id: 'c-06', ts: '19:05', matchId: 'm-01', type: 'chance',     player: 'Sam Porter',      description: 'Cutback from Tilley — Porter scuffed first time.' },
  { id: 'c-07', ts: '23:18', matchId: 'm-01', type: 'set-piece',  player: 'Myles Okafor',    description: 'Corner inswinger — Reid header wide.' },
  { id: 'c-08', ts: '27:44', matchId: 'm-01', type: 'transition', player: 'Connor Walsh',    description: 'Vertical pass through lines — Morris through one-on-one, saved.' },
  { id: 'c-09', ts: '31:09', matchId: 'm-01', type: 'defensive',  player: 'Tom Fletcher',    description: 'Sliding tackle on Doyle in the channel.' },
  { id: 'c-10', ts: '34:21', matchId: 'm-01', type: 'chance',     player: 'Dean Morris',     description: 'Shot hit the post — Porter rebound blocked.' },
  { id: 'c-11', ts: '38:55', matchId: 'm-01', type: 'set-piece',  player: 'Connor Walsh',    description: 'Set-piece routine "Short Corner Triangle" — no shot.' },
  { id: 'c-12', ts: '41:13', matchId: 'm-01', type: 'goal',       player: 'Sam Porter',      description: 'Volley from Tilley cross — 1-1 equaliser.' },
  { id: 'c-13', ts: '43:02', matchId: 'm-01', type: 'transition', player: 'Liam Barker',     description: 'Quick restart — long ball to Morris, knockdown headed wide.' },
  { id: 'c-14', ts: '45:00', matchId: 'm-01', type: 'chance',     player: 'James Tilley',    description: 'Cross deflected over.' },
  { id: 'c-15', ts: '47:30', matchId: 'm-01', type: 'set-piece',  player: 'Myles Okafor',    description: 'Inswinger to far post — half-cleared.' },
  { id: 'c-16', ts: '52:08', matchId: 'm-01', type: 'defensive',  player: 'Daniel Webb',     description: 'Aerial duel won — clears Faulkner free-kick.' },
  { id: 'c-17', ts: '55:41', matchId: 'm-01', type: 'transition', player: 'Ryan Cole',       description: 'Press triggered turnover — counter ended with Porter shot wide.' },
  { id: 'c-18', ts: '58:19', matchId: 'm-01', type: 'chance',     player: 'Dean Morris',     description: 'Solo run from halfway — shot tipped over.' },
  { id: 'c-19', ts: '62:33', matchId: 'm-01', type: 'set-piece',  player: 'Myles Okafor',    description: 'Corner outswinger to edge — Cole strike blocked.' },
  { id: 'c-20', ts: '67:14', matchId: 'm-01', type: 'defensive',  player: 'Jordan Hayes',    description: 'Two saves in quick succession from Reece.' },
  { id: 'c-21', ts: '71:08', matchId: 'm-01', type: 'transition', player: 'Myles Okafor',    description: 'Switch from left to right — Tilley cross saved.' },
  { id: 'c-22', ts: '74:52', matchId: 'm-01', type: 'chance',     player: 'Antwoine Rowe',   description: 'Header from Okafor cross — over.' },
  { id: 'c-23', ts: '78:19', matchId: 'm-01', type: 'goal',       player: 'Dean Morris',     description: 'Cutback from Okafor — Morris finishes — 2-1.' },
  { id: 'c-24', ts: '81:44', matchId: 'm-01', type: 'defensive',  player: 'Isaac Kemp',      description: 'Header clearance from corner.' },
  { id: 'c-25', ts: '85:02', matchId: 'm-01', type: 'transition', player: 'Connor Walsh',    description: 'Long pass to Tilley — cross over.' },
  { id: 'c-26', ts: '88:39', matchId: 'm-01', type: 'defensive',  player: 'Tom Fletcher',    description: 'Block from Doyle shot at edge of box.' },
  { id: 'c-27', ts: '90+3', matchId: 'm-01', type: 'set-piece',  player: 'Liam Barker',     description: 'Late free-kick — wall blocked.' },
]

const TRAINING_SESSIONS: TrainingSession[] = [
  { id: 't-01', date: 'Fri 02 May', focus: 'Pre-Eastcliff Match Prep',   durationMin: 90,  drills: [{ type: 'Defensive Shape', clips: 4 }, { type: 'Set-Piece Drills', clips: 6 }, { type: '11v11', clips: 3 }] },
  { id: 't-02', date: 'Wed 30 Apr', focus: 'Mid-Week Conditioning',      durationMin: 75,  drills: [{ type: 'Phase Play', clips: 5 }, { type: 'Possession', clips: 4 }] },
  { id: 't-03', date: 'Tue 29 Apr', focus: 'Set-Piece Workshop',         durationMin: 60,  drills: [{ type: 'Attacking Corners', clips: 7 }, { type: 'Defensive Wall', clips: 3 }] },
  { id: 't-04', date: 'Mon 28 Apr', focus: '11v11 Tactical',             durationMin: 120, drills: [{ type: 'Press Triggers', clips: 6 }, { type: 'Build-up Patterns', clips: 8 }] },
  { id: 't-05', date: 'Fri 25 Apr', focus: 'Possession + Finishing',     durationMin: 90,  drills: [{ type: 'Box Circulation', clips: 5 }, { type: 'Shooting from Cutbacks', clips: 9 }] },
  { id: 't-06', date: 'Wed 23 Apr', focus: 'Recovery + Walk-Through',    durationMin: 45,  drills: [{ type: 'Light Tactics Review', clips: 4 }] },
]

const PLAYER_STATS: PlayerStat[] = [
  { name: 'Jordan Hayes',     position: 'GK',  apps: 28, distance_km: 4.8,  sprints: 2,  high_intensity_runs: 6,  top_speed_kmh: 26.4, avg_speed_kmh: 4.2, passes: 38, pass_accuracy: 86, key_passes: 1, xG: 0.0 },
  { name: 'Tom Fletcher',     position: 'LB',  apps: 26, distance_km: 11.4, sprints: 36, high_intensity_runs: 58, top_speed_kmh: 32.1, avg_speed_kmh: 8.2, passes: 58, pass_accuracy: 84, key_passes: 3, xG: 0.2 },
  { name: 'Daniel Webb',      position: 'CB',  apps: 27, distance_km: 10.2, sprints: 22, high_intensity_runs: 46, top_speed_kmh: 28.5, avg_speed_kmh: 7.4, passes: 72, pass_accuracy: 91, key_passes: 1, xG: 0.4 },
  { name: 'Marcus Reid',      position: 'CB',  apps: 25, distance_km: 10.0, sprints: 19, high_intensity_runs: 44, top_speed_kmh: 27.8, avg_speed_kmh: 7.2, passes: 68, pass_accuracy: 89, key_passes: 1, xG: 0.3 },
  { name: 'Isaac Kemp',       position: 'CB',  apps: 20, distance_km: 10.4, sprints: 24, high_intensity_runs: 48, top_speed_kmh: 30.2, avg_speed_kmh: 7.5, passes: 64, pass_accuracy: 88, key_passes: 1, xG: 0.1 },
  { name: 'Joe Lewis',        position: 'CB',  apps: 16, distance_km: 9.8,  sprints: 18, high_intensity_runs: 42, top_speed_kmh: 27.0, avg_speed_kmh: 7.0, passes: 56, pass_accuracy: 86, key_passes: 0, xG: 0.0 },
  { name: 'Kyle Osei',        position: 'RB',  apps: 24, distance_km: 11.6, sprints: 39, high_intensity_runs: 62, top_speed_kmh: 33.2, avg_speed_kmh: 8.4, passes: 54, pass_accuracy: 82, key_passes: 4, xG: 0.1 },
  { name: 'Liam Barker',      position: 'CM',  apps: 28, distance_km: 11.8, sprints: 28, high_intensity_runs: 54, top_speed_kmh: 30.0, avg_speed_kmh: 8.0, passes: 82, pass_accuracy: 90, key_passes: 5, xG: 0.5 },
  { name: 'Connor Walsh',     position: 'CM',  apps: 26, distance_km: 11.2, sprints: 25, high_intensity_runs: 50, top_speed_kmh: 29.4, avg_speed_kmh: 7.8, passes: 78, pass_accuracy: 88, key_passes: 4, xG: 0.3 },
  { name: 'Ryan Cole',        position: 'CM',  apps: 22, distance_km: 11.0, sprints: 27, high_intensity_runs: 52, top_speed_kmh: 30.4, avg_speed_kmh: 7.9, passes: 70, pass_accuracy: 87, key_passes: 4, xG: 0.4 },
  { name: 'Paul Granger',     position: 'CDM', apps: 18, distance_km: 10.6, sprints: 18, high_intensity_runs: 44, top_speed_kmh: 27.4, avg_speed_kmh: 7.6, passes: 76, pass_accuracy: 92, key_passes: 2, xG: 0.1 },
  { name: 'Myles Okafor',     position: 'LW',  apps: 24, distance_km: 11.2, sprints: 34, high_intensity_runs: 58, top_speed_kmh: 32.6, avg_speed_kmh: 7.9, passes: 48, pass_accuracy: 80, key_passes: 6, xG: 0.5 },
  { name: 'Zack Bright',      position: 'CM',  apps: 15, distance_km: 10.8, sprints: 23, high_intensity_runs: 48, top_speed_kmh: 29.0, avg_speed_kmh: 7.7, passes: 60, pass_accuracy: 86, key_passes: 3, xG: 0.2 },
  { name: 'James Tilley',     position: 'RW',  apps: 25, distance_km: 11.4, sprints: 38, high_intensity_runs: 60, top_speed_kmh: 33.0, avg_speed_kmh: 8.0, passes: 52, pass_accuracy: 81, key_passes: 5, xG: 0.4 },
  { name: 'Dean Morris',      position: 'LW',  apps: 27, distance_km: 11.0, sprints: 32, high_intensity_runs: 56, top_speed_kmh: 31.8, avg_speed_kmh: 7.8, passes: 44, pass_accuracy: 79, key_passes: 5, xG: 0.7 },
  { name: 'Sam Porter',       position: 'ST',  apps: 24, distance_km: 10.6, sprints: 30, high_intensity_runs: 52, top_speed_kmh: 30.8, avg_speed_kmh: 7.5, passes: 36, pass_accuracy: 78, key_passes: 3, xG: 0.6 },
  { name: 'Antwoine Rowe',    position: 'CF',  apps: 19, distance_km: 10.4, sprints: 28, high_intensity_runs: 50, top_speed_kmh: 31.2, avg_speed_kmh: 7.5, passes: 38, pass_accuracy: 80, key_passes: 2, xG: 0.4 },
  { name: 'Joe McDonnell',    position: 'GK',  apps: 5,  distance_km: 4.6,  sprints: 1,  high_intensity_runs: 5,  top_speed_kmh: 25.8, avg_speed_kmh: 4.0, passes: 32, pass_accuracy: 84, key_passes: 0, xG: 0.0 },
]

const SET_PIECE_ROUTINES: Routine[] = [
  { id: 'r-01', name: 'Inswinger to Far Post',         type: 'corner',    successRate: 36, attempts: 11, goals: 4, bestExecution: 'vs Glenmoor Wanderers · 29 Mar', description: 'Okafor inswinger; Webb + Reid pair the far post; Porter ghost run from edge.' },
  { id: 'r-02', name: 'Short Corner Triangle',         type: 'corner',    successRate: 28, attempts: 7,  goals: 2, bestExecution: 'vs Castleton Rovers · 05 Apr',    description: 'Three-man triangle Barker/Walsh/Okafor; release through space to byline.' },
  { id: 'r-03', name: 'Wall-Hugger Free Kick',         type: 'free-kick', successRate: 44, attempts: 7,  goals: 3, bestExecution: 'vs Hartwell Town · 22 Mar',       description: 'Barker direct over jumping wall — aimed at near top corner.' },
  { id: 'r-04', name: 'Lofted Switch',                 type: 'free-kick', successRate: 22, attempts: 5,  goals: 1, bestExecution: 'vs Kingsmere City · 08 Mar',     description: 'Barker chips across goal to far stick — Reid run from CB.' },
  { id: 'r-05', name: 'Penalty Cool-Step',             type: 'penalty',   successRate: 80, attempts: 5,  goals: 4, bestExecution: 'vs Ashbourne United · 18 Mar',   description: 'Porter pauses mid-run-up; sends keeper, finishes opposite corner.' },
  { id: 'r-06', name: 'Throw-In Drag-Back',            type: 'throw-in',  successRate: 19, attempts: 8,  goals: 0, bestExecution: 'vs Thornvale FC · 15 Mar',       description: 'Long throw drawn short; Fletcher overlap into space behind RB.' },
  { id: 'r-07', name: 'Outswinger to Edge of Box',     type: 'corner',    successRate: 25, attempts: 8,  goals: 1, bestExecution: 'vs Eastcliff Town · 03 May',     description: 'Okafor outswing; pulled-back to Cole arriving at edge.' },
  { id: 'r-08', name: 'Quick Restart Counter',         type: 'free-kick', successRate: 31, attempts: 6,  goals: 2, bestExecution: 'vs Northgate City · 26 Apr',     description: 'Barker plays short to Walsh while opponents organising — direct vertical pass.' },
]

const LIVE_STATE = {
  status: 'FULL TIME' as const,
  competition: 'League One',
  homeTeam: 'Oakridge',
  awayTeam: 'Eastcliff Town',
  score: '2-1',
  date: 'Sat 03 May',
  recentEvents: [
    { min: '9',    type: 'goal'    as const, team: 'away' as const, text: 'J. Reece — header from corner (1st goal).' },
    { min: '23',   type: 'yellow'  as const, team: 'home' as const, text: 'C. Walsh — yellow card (foul, midfield).' },
    { min: '34',   type: 'chance'  as const, team: 'home' as const, text: 'Morris hit the post — Porter rebound blocked.' },
    { min: '41',   type: 'goal'    as const, team: 'home' as const, text: 'Sam Porter — volley from Tilley cross. 1-1.' },
    { min: 'HT',   type: 'whistle' as const, team: null, text: 'Half time.' },
    { min: '56',   type: 'sub'     as const, team: 'home' as const, text: 'Ryan Cole on for Connor Walsh.' },
    { min: '67',   type: 'yellow'  as const, team: 'away' as const, text: 'T. Faulkner — yellow card (delay of game).' },
    { min: '78',   type: 'goal'    as const, team: 'home' as const, text: 'Dean Morris — cutback from Okafor. 2-1.' },
    { min: 'FT',   type: 'whistle' as const, team: null, text: 'Full time. Oakridge 2-1 Eastcliff Town.' },
  ] as LiveEvent[],
}

const OPPOSITION = {
  name: 'Eastcliff Town',
  position: 14,
  form: ['L', 'W', 'D', 'L', 'L'] as MatchResult[],
  dangerPlayers: [
    { name: 'J. Reece',     position: 'ST', stat: '8 goals, aerial threat (won 64% headers)' },
    { name: 'T. Faulkner',  position: 'CM', stat: 'Set-piece taker, 92 long passes / match' },
    { name: 'M. Doyle',     position: 'LW', stat: '12 dribbles / match, 1v1 pace' },
  ],
  setPieceThreat: {
    cornerConversion: 18,
    freeKickZones: 'Left flank arc, 22-28y',
    note: 'Inswinging corners to near post for Reece. Faulkner direct at goal from 20y+.',
  },
  weakness: 'Vulnerable on counter — RB pushes high, gap behind covered slowly. Switches to left flank exploit their slow CB shift.',
}

// ─── Sub-tab components ─────────────────────────────────────────────────────

function MatchLibraryTab({ onSelectMatch }: { onSelectMatch: (id: string) => void }) {
  const [filterResult, setFilterResult] = useState<'all' | MatchResult>('all')
  const [filterVenue, setFilterVenue] = useState<'all' | 'H' | 'A'>('all')
  const filtered = MATCHES.filter(m =>
    (filterResult === 'all' || m.result === filterResult) &&
    (filterVenue === 'all' || m.ha === filterVenue)
  )
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: C.muted }}>
            <Filter size={12} /> Filter
          </span>
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
        <Card>
          <p className="text-sm text-center py-6" style={{ color: C.muted }}>No matches match the current filter.</p>
        </Card>
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
  const caption = `${match.ha === 'H' ? 'Oakridge' : match.opp} ${match.score.split('-')[0]}-${match.score.split('-')[1]} ${match.ha === 'H' ? match.opp : 'Oakridge'} · ${match.date}`
  return (
    <div className="space-y-4">
      {!match.processed && (
        <Card className="!p-3">
          <p className="text-xs" style={{ color: C.warning }}>
            <AlertCircle size={12} className="inline mr-1" />
            This match is still processing — clips will appear here once the analysis pass completes.
          </p>
        </Card>
      )}
      {matchClips.length === 0 ? (
        <Card>
          <p className="text-sm text-center py-12" style={{ color: C.muted }}>No clips available for this match yet.</p>
        </Card>
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

  // Last-10-match trend (squad averages — hardcoded but plausible)
  const trendData = [
    { match: 'M-12', distance: 9.8,  sprints: 24 },
    { match: 'M-11', distance: 10.1, sprints: 26 },
    { match: 'M-10', distance: 10.4, sprints: 27 },
    { match: 'M-09', distance: 10.6, sprints: 28 },
    { match: 'M-08', distance: 10.3, sprints: 26 },
    { match: 'M-07', distance: 10.5, sprints: 29 },
    { match: 'M-06', distance: 10.7, sprints: 28 },
    { match: 'M-05', distance: 10.8, sprints: 30 },
    { match: 'M-04', distance: 10.5, sprints: 27 },
    { match: 'M-03', distance: 10.6, sprints: 28 },
    { match: 'M-02', distance: 10.4, sprints: 26 },
    { match: 'M-01', distance: 10.7, sprints: 29 },
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
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Squad Averages — Last 12 Matches</p>
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
      <Card>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold" style={{ color: C.muted }}>Phase 1 demo content — hardcoded routines. Phase 2 will wire to the restored Set-Pieces library.</p>
        </div>
      </Card>
      <Card>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: C.muted }}>
            <Filter size={12} /> Type
          </span>
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
                      {/* Routine markers — generic per type */}
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
                    <div className="text-center p-2 rounded-md" style={{ backgroundColor: '#111318' }}>
                      <p className="text-lg font-black" style={{ color: C.success }}>{r.goals}</p>
                      <p className="text-[10px]" style={{ color: C.muted }}>goals</p>
                    </div>
                    <div className="text-center p-2 rounded-md" style={{ backgroundColor: '#111318' }}>
                      <p className="text-lg font-black" style={{ color: C.text }}>{r.attempts}</p>
                      <p className="text-[10px]" style={{ color: C.muted }}>attempts</p>
                    </div>
                    <div className="text-center p-2 rounded-md" style={{ backgroundColor: '#111318' }}>
                      <p className="text-lg font-black" style={{ color: C.accent }}>{r.successRate}%</p>
                      <p className="text-[10px]" style={{ color: C.muted }}>conv.</p>
                    </div>
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
  const status = LIVE_STATE.status
  const isLive = (status as string) === 'LIVE NOW'
  const isFullTime = (status as string) === 'FULL TIME'
  const statusColor = isLive ? C.danger : isFullTime ? C.muted : C.accent
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-black tracking-wide" style={{ backgroundColor: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}` }}>{status}</span>
            <span className="text-sm font-bold" style={{ color: C.text }}>{LIVE_STATE.homeTeam} {LIVE_STATE.score} {LIVE_STATE.awayTeam}</span>
          </div>
          <span className="text-xs" style={{ color: C.muted }}>{LIVE_STATE.competition} · {LIVE_STATE.date}</span>
        </div>
      </Card>
      <VideoPlayerPlaceholder caption={`${LIVE_STATE.homeTeam} ${LIVE_STATE.score} ${LIVE_STATE.awayTeam} — Full Match`} isLive={isLive} ts={isFullTime ? 'Full Time · 90+3' : isLive ? "67' / 90:00" : 'Pre-Match'} />
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Event Timeline</p>
        <div className="space-y-2">
          {LIVE_STATE.recentEvents.map((e, i) => {
            const icons: Record<typeof e.type, React.ElementType> = { goal: Trophy, yellow: Circle, red: AlertCircle, sub: Users, chance: Target, whistle: Clock }
            const colours: Record<typeof e.type, string> = { goal: C.success, yellow: '#EAB308', red: C.danger, sub: '#A78BFA', chance: C.accent, whistle: C.muted }
            const Icon = icons[e.type]
            return (
              <div key={i} className="flex items-center gap-3 p-2 rounded-md" style={{ backgroundColor: '#111318', border: `1px solid ${C.border}` }}>
                <span className="text-xs font-mono w-12 text-center font-bold" style={{ color: C.muted }}>{e.min}'</span>
                <Icon size={14} style={{ color: colours[e.type] }} />
                <span className="text-xs flex-1" style={{ color: C.text }}>{e.text}</span>
                {e.team && (
                  <span className="text-[10px] px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: e.team === 'home' ? `${C.primary}33` : `${C.danger}33`, color: e.team === 'home' ? C.primary : C.danger }}>
                    {e.team === 'home' ? LIVE_STATE.homeTeam : LIVE_STATE.awayTeam}
                  </span>
                )}
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
              <p className="text-xs" style={{ color: C.muted }}>League One · Position {OPPOSITION.position}th</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold mr-1" style={{ color: C.muted }}>Last 5:</span>
            {OPPOSITION.form.map((r, i) => {
              const colour = r === 'W' ? C.success : r === 'D' ? C.warning : C.danger
              return (
                <span key={i} className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
                  style={{ backgroundColor: `${colour}22`, color: colour, border: `1px solid ${colour}` }}>
                  {r}
                </span>
              )
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
            <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>above league avg (11%)</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#111318', border: `1px solid ${C.border}` }}>
            <p className="text-xs font-semibold" style={{ color: C.muted }}>Free-Kick Zones</p>
            <p className="text-sm font-bold mt-1" style={{ color: C.text }}>{OPPOSITION.setPieceThreat.freeKickZones}</p>
          </div>
          <div className="p-3 rounded-lg sm:col-span-1" style={{ backgroundColor: '#111318', border: `1px solid ${C.border}` }}>
            <p className="text-xs font-semibold" style={{ color: C.muted }}>Notes</p>
            <p className="text-[11px] mt-1" style={{ color: C.mutedStrong }}>{OPPOSITION.setPieceThreat.note}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── Main export ────────────────────────────────────────────────────────────

export default function ProVideoAnalysisView() {
  const [tab, setTab] = useState<Tab>('library')
  const [activeMatch, setActiveMatch] = useState<string>(ACTIVE_MATCH_ID)

  const totalClips = MATCHES.reduce((s, m) => s + m.clipsCount, 0)
  const processedCount = MATCHES.filter(m => m.processed).length
  const avgDistance = (PLAYER_STATS.filter(p => p.position !== 'GK').reduce((s, p) => s + p.distance_km, 0) / PLAYER_STATS.filter(p => p.position !== 'GK').length).toFixed(1)

  return (
    <div className="space-y-4">
      {/* Landing-page chrome */}
      <div className="flex items-center gap-3 mb-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${C.accent}1A` }}>
          <Video size={20} style={{ color: C.accent }} />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: C.text }}>Video & Analysis</h2>
          <p className="text-xs" style={{ color: C.muted }}>Tactical clips, performance data, and opposition intelligence</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={Trophy}     label="Matches"          value={`${MATCHES.length}`}              sub={`${processedCount} processed`} />
        <KPI icon={Video}      label="Total Clips"      value={`${totalClips}`}                  sub="across season" />
        <KPI icon={MapPin}     label="Avg Distance"     value={`${avgDistance} km`}              sub="outfield / match" />
        <KPI icon={Target}     label="Active Routines"  value={`${SET_PIECE_ROUTINES.length}`}   sub="set-piece library" />
      </div>

      {/* Sub-tab nav */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <TabBtn active={tab === 'library'}     label="Match Library"        onClick={() => setTab('library')} />
        <TabBtn active={tab === 'detail'}      label="Match Detail"         onClick={() => setTab('detail')} />
        <TabBtn active={tab === 'training'}    label="Training"             onClick={() => setTab('training')} />
        <TabBtn active={tab === 'performance'} label="Player Performance"   onClick={() => setTab('performance')} />
        <TabBtn active={tab === 'set-pieces'}  label="Set-Piece Studio"     onClick={() => setTab('set-pieces')} />
        <TabBtn active={tab === 'live'}        label="Live Match"           onClick={() => setTab('live')} />
        <TabBtn active={tab === 'opposition'}  label="Opposition Analysis"  onClick={() => setTab('opposition')} />
      </div>

      {/* Tab body */}
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
