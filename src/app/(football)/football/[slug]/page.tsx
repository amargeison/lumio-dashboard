'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { use } from 'react'
import {
  Users, TrendingUp, Headphones, AlertCircle,
  CheckCircle2, Loader2, Clock, ArrowRight,
  Zap, Star, ChevronDown, ChevronUp, BarChart3, Sparkles,
  X, Plus, Check,
  Home, Settings, Hash, Menu, ChevronLeft,
  Calendar, FileText, Target, Volume2, Mic,
  Bell, Activity, Shield, Shirt, Clipboard, Trophy,
  UserPlus, DollarSign, Heart, Eye, Video, MapPin,
  Briefcase, GraduationCap, Newspaper, Phone, MessageSquare,
  Search, Filter, ArrowUpDown, ExternalLink, Crown, Camera,
  Maximize2, Printer, Share2,
} from 'lucide-react'
import { useElevenLabsTTS as useSpeech } from '@/hooks/useElevenLabsTTS'
import { useFootballVoiceCommands, type FootballCommandResult } from '@/hooks/useFootballVoiceCommands'
import FootballActionModal from '@/components/modals/FootballActionModal'
import DeptAISummary from '@/components/DeptAISummary'
import AIInsightsReport from '@/components/AIInsightsReport'
import { EmployeeProfileCard, getGridCols, type StaffRecord } from '@/components/team/EmployeeProfileCard'
import FootballStaffView from '@/components/football/StaffView'
import GPSPerformanceView from '@/components/football/GPSPerformanceView'
import BoardSuiteView from '@/components/football/BoardSuiteView'
import VoiceSettings from '@/components/dashboard/VoiceSettings'
import { WyscoutView, ScoutingDBView, GPSHardwareView, OptaStatsBombView, FindClubView, FindPlayerView, FootballPyramidView } from '@/components/football/IntegrationViews'
import { TeamsView, LeaguesView, FixturesView, StatsBombView } from '@/components/football/LeagueViews'
import ProSetPiecesView from '@/components/football/ProSetPiecesView'
import FootballBodyMap, { DEMO_INJURIES } from '@/components/football/FootballBodyMap'
import AvatarDropdown from '@/components/dashboard/AvatarDropdown'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────

type DeptId =
  | 'overview' | 'insights' | 'board' | 'squad' | 'tactics' | 'set-pieces' | 'transfers'
  | 'medical' | 'scouting' | 'academy' | 'analytics'
  | 'media' | 'social' | 'matchday' | 'training' | 'performance' | 'finance'
  | 'dynamics' | 'psr' | 'squad-planner' | 'club-profile'
  | 'staff' | 'facilities' | 'settings'
  | 'wyscout' | 'scouting-db' | 'gps-hardware' | 'opta'
  | 'find-club' | 'find-player' | 'pyramid'
  | 'teams' | 'leagues' | 'fixtures-results' | 'statsbomb'

type OverviewTab = 'today' | 'quick-wins' | 'match-week' | 'insights' | 'dont-miss' | 'staff'

type SidebarSection = null | 'Departments' | 'Tools' | 'Leagues' | 'Integrations'

// ─── Constants ───────────────────────────────────────────────────────────────

const FOOTBALL_QUOTES = [
  { text: "Football is a simple game. Twenty-two men chase a ball for 90 minutes and at the end, the Germans always win.", author: "Gary Lineker" },
  { text: "I wouldn't say I was the best manager in the business. But I was in the top one.", author: "Brian Clough" },
  { text: "Some people believe football is a matter of life and death. I assure you it is much, much more important than that.", author: "Bill Shankly" },
  { text: "In football, the worst blindness is only seeing the ball.", author: "Nelson Falcao" },
  { text: "I am a firm believer that if you score one more than the opposition then you win.", author: "Sir Alex Ferguson" },
  { text: "The greatest barrier to success is the fear of failure.", author: "Sven-Goran Eriksson" },
  { text: "I don't have any weaknesses. I don't believe in them.", author: "Pep Guardiola" },
  { text: "A manager needs three years to build a team, but can lose it in three months.", author: "Arsene Wenger" },
  { text: "If a player is not interfering with play or seeking to gain an advantage, then he should be.", author: "Bill Shankly" },
  { text: "We must have had 99% of the game. It was the other 1% that cost us.", author: "Ruud Gullit" },
  { text: "The best teams in the world don't just play football. They create it.", author: "Pep Guardiola" },
  { text: "Football is a game about feelings and intelligence.", author: "Arsene Wenger" },
  { text: "The ball is round. The game lasts 90 minutes. Everything else is just theory.", author: "Sepp Herberger" },
  { text: "Players lose you games, not tactics. There's so much crap talked about tactics.", author: "Brian Clough" },
  { text: "Fail, and fail again. Because failure leads to success.", author: "Sir Alex Ferguson" },
]

const BG_GRADIENTS = [
  'from-blue-950 via-blue-900 to-yellow-950/80',
  'from-blue-900 via-blue-950 to-yellow-900/80',
  'from-blue-950 via-indigo-950 to-blue-900/90',
  'from-blue-900 via-blue-950 to-yellow-950/80',
  'from-indigo-950 via-blue-950 to-yellow-900/80',
  'from-blue-950 via-blue-900 to-indigo-950/90',
  'from-blue-900 via-indigo-950 to-yellow-950/80',
]

const SIDEBAR_ITEMS: { id: DeptId; label: string; icon: React.ElementType; section: SidebarSection }[] = [
  { id: 'overview',    label: 'Overview',       icon: Home,           section: null },
  { id: 'insights',    label: 'Insights',       icon: Sparkles,       section: null },
  { id: 'board',       label: 'Board Suite',    icon: Crown,          section: null },
  { id: 'squad',       label: 'Squad',          icon: Shirt,          section: 'Departments' },
  { id: 'tactics',     label: 'Tactics',        icon: Clipboard,      section: 'Departments' },
  { id: 'set-pieces',  label: 'Set Pieces',     icon: Target,         section: 'Departments' },
  { id: 'transfers',   label: 'Transfers',      icon: ArrowUpDown,    section: 'Departments' },
  { id: 'medical',     label: 'Medical',        icon: Heart,          section: 'Departments' },
  { id: 'scouting',    label: 'Scouting',       icon: Eye,            section: 'Departments' },
  { id: 'academy',     label: 'Academy',        icon: GraduationCap,  section: 'Departments' },
  { id: 'analytics',   label: 'Analytics',      icon: BarChart3,      section: 'Departments' },
  { id: 'dynamics',    label: 'Dynamics',       icon: Heart,          section: 'Departments' },
  { id: 'media',       label: 'Media & PR',     icon: Newspaper,      section: 'Departments' },
  { id: 'social',      label: 'Social Media',   icon: MessageSquare,  section: 'Departments' },
  { id: 'matchday',    label: 'Match Day',      icon: Trophy,         section: 'Departments' },
  { id: 'training',    label: 'Training',       icon: Activity,       section: 'Tools' },
  { id: 'performance', label: 'Performance & GPS', icon: Activity,    section: 'Tools' },
  { id: 'psr',         label: 'Finance & PSR',  icon: DollarSign,     section: 'Tools' },
  { id: 'squad-planner', label: 'Squad Planner', icon: Clipboard,     section: 'Tools' },
  { id: 'club-profile', label: 'Club Profile',  icon: Trophy,         section: 'Tools' },
  { id: 'finance',     label: 'Finance',        icon: DollarSign,     section: 'Tools' },
  { id: 'staff',       label: 'Staff',          icon: Users,          section: 'Tools' },
  { id: 'facilities',  label: 'Facilities',     icon: MapPin,         section: 'Tools' },
  { id: 'wyscout',     label: 'Wyscout / Video', icon: Video,          section: 'Integrations' },
  { id: 'scouting-db', label: 'Scouting Database', icon: Search,       section: 'Integrations' },
  { id: 'gps-hardware', label: 'GPS Hardware',   icon: Activity,       section: 'Integrations' },
  { id: 'opta',        label: 'Opta / StatsBomb', icon: BarChart3,     section: 'Integrations' },
  { id: 'teams',        label: 'Teams',          icon: Users,          section: 'Leagues' },
  { id: 'leagues',     label: 'Leagues & Tables', icon: Trophy,       section: 'Leagues' },
  { id: 'fixtures-results', label: 'Fixtures & Results', icon: Calendar, section: 'Leagues' },
  { id: 'pyramid',     label: 'All Leagues',    icon: BarChart3,      section: 'Leagues' },
  { id: 'find-club',   label: 'Find Club',      icon: Search,         section: 'Leagues' },
  { id: 'find-player', label: 'Find Player',    icon: Target,         section: 'Leagues' },
  { id: 'statsbomb',   label: 'StatsBomb',      icon: Activity,       section: 'Leagues' },
  { id: 'settings',    label: 'Settings',       icon: Settings,       section: 'Tools' },
]

const FOOTBALL_ROLE_OPTIONS = [
  { key: 'chairman', label: 'Chairman/CEO', emoji: '👑', level: 1 },
  { key: 'dof', label: 'Director of Football', emoji: '⚽', level: 1 },
  { key: 'head_coach', label: 'Head Coach', emoji: '🎽', level: 2 },
  { key: 'dept_head', label: 'Department Head', emoji: '📋', level: 3 },
  { key: 'support', label: 'Support Staff', emoji: '🔍', level: 4 },
]

// ─── Squad Data ──────────────────────────────────────────────────────────────

type FitnessStatus = 'fit' | 'injured' | 'suspended' | 'modified' | 'doubt'

interface Player {
  name: string
  number: number
  position: string
  nationality: string
  age: number
  contractExpiry: string
  marketValue: string
  fitness: FitnessStatus
  lastRating: number
  goals: number
  assists: number
  stats?: { PAC: number; SHO: number; PAS: number; DRI: number; DEF: number; PHY: number }
}

const FB_PRIMARY = '#003DA5'
const FB_SECONDARY = '#F1C40F'

const SQUAD: Player[] = [
  { name: 'Nathan Bishop', number: 1, position: 'GK', nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 25, contractExpiry: 'Jun 2027', marketValue: '£200k', fitness: 'fit', lastRating: 7.1, goals: 0, assists: 0, stats: { PAC: 58, SHO: 14, PAS: 62, DRI: 52, DEF: 72, PHY: 78 } },
  { name: 'Joe McDonnell', number: 13, position: 'GK', nationality: '🇮🇪', age: 30, contractExpiry: 'Jun 2026', marketValue: '£150k', fitness: 'fit', lastRating: 6.9, goals: 0, assists: 0, stats: { PAC: 52, SHO: 12, PAS: 58, DRI: 48, DEF: 70, PHY: 76 } },
  { name: 'Patrick Bauer', number: 5, position: 'CB', nationality: '🇩🇪', age: 33, contractExpiry: 'Jun 2026', marketValue: '£300k', fitness: 'fit', lastRating: 7.0, goals: 2, assists: 1, stats: { PAC: 62, SHO: 38, PAS: 65, DRI: 55, DEF: 79, PHY: 84 } },
  { name: 'Ryan Johnson', number: 4, position: 'CB', nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 26, contractExpiry: 'Jun 2027', marketValue: '£250k', fitness: 'fit', lastRating: 7.2, goals: 1, assists: 0, stats: { PAC: 68, SHO: 35, PAS: 67, DRI: 58, DEF: 77, PHY: 82 } },
  { name: 'Isaac Ogundere', number: 6, position: 'CB', nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 23, contractExpiry: 'Jun 2027', marketValue: '£200k', fitness: 'injured', lastRating: 6.8, goals: 0, assists: 1, stats: { PAC: 72, SHO: 32, PAS: 64, DRI: 60, DEF: 74, PHY: 80 } },
  { name: 'Steve Seddon', number: 3, position: 'LB', nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 27, contractExpiry: 'Jun 2026', marketValue: '£300k', fitness: 'fit', lastRating: 7.1, goals: 1, assists: 3, stats: { PAC: 74, SHO: 42, PAS: 70, DRI: 68, DEF: 73, PHY: 75 } },
  { name: 'Nathan Asiimwe', number: 2, position: 'RB', nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 21, contractExpiry: 'May 2026', marketValue: '£150k', fitness: 'fit', lastRating: 7.0, goals: 0, assists: 2, stats: { PAC: 78, SHO: 38, PAS: 68, DRI: 70, DEF: 68, PHY: 72 } },
  { name: 'Brodi Hughes', number: 22, position: 'RB', nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 20, contractExpiry: 'Jun 2026', marketValue: '£100k', fitness: 'injured', lastRating: 6.7, goals: 0, assists: 1, stats: { PAC: 76, SHO: 35, PAS: 65, DRI: 68, DEF: 65, PHY: 70 } },
  { name: 'Sam Hutchinson', number: 8, position: 'CM', nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 35, contractExpiry: 'Jun 2026', marketValue: '£100k', fitness: 'fit', lastRating: 7.0, goals: 2, assists: 4, stats: { PAC: 58, SHO: 55, PAS: 76, DRI: 65, DEF: 74, PHY: 80 } },
  { name: 'Delano McCoy-Splatt', number: 14, position: 'CM', nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 22, contractExpiry: 'Jun 2027', marketValue: '£200k', fitness: 'fit', lastRating: 7.1, goals: 3, assists: 5, stats: { PAC: 72, SHO: 60, PAS: 74, DRI: 72, DEF: 62, PHY: 72 } },
  { name: 'Alistair Smith', number: 16, position: 'CM', nationality: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', age: 26, contractExpiry: 'Jun 2026', marketValue: '£200k', fitness: 'injured', lastRating: 6.9, goals: 2, assists: 3, stats: { PAC: 70, SHO: 58, PAS: 72, DRI: 68, DEF: 65, PHY: 74 } },
  { name: 'Zack Nelson', number: 10, position: 'CAM', nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 24, contractExpiry: 'Jun 2026', marketValue: '£250k', fitness: 'fit', lastRating: 7.3, goals: 4, assists: 6, stats: { PAC: 74, SHO: 68, PAS: 78, DRI: 76, DEF: 45, PHY: 66 } },
  { name: 'Marcus Browne', number: 11, position: 'LW', nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 28, contractExpiry: 'Jun 2027', marketValue: '£600k', fitness: 'fit', lastRating: 7.8, goals: 12, assists: 5, stats: { PAC: 82, SHO: 74, PAS: 72, DRI: 80, DEF: 38, PHY: 68 } },
  { name: 'Ed Leach', number: 17, position: 'RW', nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 22, contractExpiry: 'Jun 2026', marketValue: '£150k', fitness: 'fit', lastRating: 6.8, goals: 2, assists: 3, stats: { PAC: 80, SHO: 65, PAS: 68, DRI: 76, DEF: 35, PHY: 62 } },
  { name: 'Antwoine Hackford', number: 9, position: 'ST', nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 23, contractExpiry: 'Jun 2026', marketValue: '£350k', fitness: 'fit', lastRating: 7.2, goals: 8, assists: 2, stats: { PAC: 80, SHO: 76, PAS: 62, DRI: 72, DEF: 28, PHY: 74 } },
  { name: 'Layton Stewart', number: 19, position: 'ST', nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 23, contractExpiry: 'Jun 2026', marketValue: '£300k', fitness: 'fit', lastRating: 7.0, goals: 5, assists: 1, stats: { PAC: 78, SHO: 74, PAS: 60, DRI: 70, DEF: 25, PHY: 72 } },
]

const INJURIES = [
  { player: 'Brodi Hughes', type: 'Hamstring strain', expectedReturn: 'Apr 2026', phase: 'Rehabilitation', since: 'Mar 2026', matchesMissed: 3 },
  { player: 'Alistair Smith', type: 'Ankle ligament', expectedReturn: 'May 2026', phase: 'Recovery', since: 'Feb 2026', matchesMissed: 7 },
  { player: 'Isaac Ogundere', type: 'Knee bruise', expectedReturn: 'Apr 2026', phase: 'Light training', since: 'Mar 2026', matchesMissed: 2 },
]

const TRANSFER_TARGETS = [
  { name: 'Yannick Diallo', position: 'LB', club: 'KRC Genk', age: 22, value: '£1.8m', status: 'Bid submitted' },
  { name: 'Tiago Ferreira', position: 'CM', club: 'SC Braga', age: 24, value: '£1.3m', status: 'Watching' },
]

// ─── Recent Form ────────────────────────────────────────────────────────────

const RECENT_FORM = [
  { opponent: 'Riverside United', score: '2-1', result: 'W' as const, home: true, scorers: "Santos 34', Thompson 67'" },
  { opponent: 'City Vale', score: '0-0', result: 'D' as const, home: false, scorers: '' },
  { opponent: 'Northern Town', score: '3-1', result: 'W' as const, home: true, scorers: "Santos 12', 45', O'Brien 78'" },
  { opponent: 'Westfield Athletic', score: '1-2', result: 'L' as const, home: false, scorers: "Thompson 55'" },
  { opponent: 'South Park Rangers', score: '4-0', result: 'W' as const, home: true, scorers: "Santos 22', 41', Collins 67', Martinez 89'" },
]

// ─── GPS Training Data ──────────────────────────────────────────────────────

const GPS_DATA = [
  { player: 'Santos', distance: 10.2, hiSpeed: 1420, sprints: 34, maxSpeed: 33.1, load: 'optimal' as const },
  { player: 'Thompson', distance: 11.4, hiSpeed: 1680, sprints: 28, maxSpeed: 31.8, load: 'high' as const },
  { player: 'Walker', distance: 5.8, hiSpeed: 320, sprints: 8, maxSpeed: 24.2, load: 'optimal' as const },
  { player: 'Henderson', distance: 10.8, hiSpeed: 1550, sprints: 42, maxSpeed: 34.2, load: 'optimal' as const },
  { player: "O'Brien", distance: 9.1, hiSpeed: 1200, sprints: 22, maxSpeed: 32.6, load: 'amber' as const },
  { player: 'Collins', distance: 10.6, hiSpeed: 1380, sprints: 30, maxSpeed: 33.8, load: 'high' as const },
  { player: 'Martinez', distance: 9.8, hiSpeed: 890, sprints: 18, maxSpeed: 28.4, load: 'optimal' as const },
  { player: 'Okafor', distance: 10.1, hiSpeed: 1490, sprints: 36, maxSpeed: 34.8, load: 'overload' as const },
]

// ─── Scout Targets ──────────────────────────────────────────────────────────

const SCOUT_TARGETS = [
  { name: 'Rui Silva', position: 'LB', age: 23, club: 'KRC Genk', nationality: '🇵🇹', value: '£1.8m', contract: 'Jun 2027', rating: 4, status: 'Approached', notes: 'Athletic, good crosser' },
  { name: 'André Costa', position: 'CM', age: 25, club: 'SC Braga', nationality: '🇧🇷', value: '£2.4m', contract: 'Jun 2026', rating: 5, status: 'Bid Submitted', notes: 'Box-to-box, excellent range' },
  { name: 'Kasper Eriksen', position: 'ST', age: 21, club: 'FC Nordsjælland', nationality: '🇩🇰', value: '£1.2m', contract: 'Jun 2028', rating: 3, status: 'Monitoring', notes: 'Pacy, needs development' },
  { name: "Jean-Marc N'Golo", position: 'CB', age: 27, club: 'Metz', nationality: '🇫🇷', value: '£0.9m', contract: 'Jun 2025', rating: 4, status: 'Shortlisted', notes: 'Free agent June, strong aerial' },
  { name: 'Liam Brennan', position: 'GK', age: 20, club: 'Shamrock Rovers', nationality: '🇮🇪', value: '£0.3m', contract: 'Jun 2027', rating: 3, status: 'Monitoring', notes: 'Good shot-stopper, needs loans' },
]

// ─── Contract Data ──────────────────────────────────────────────────────────

const CONTRACT_DATA = [
  { player: 'Diego Martinez', position: 'CB', weeklyWage: '£18,000', end: 'Jun 2025', status: 'Negotiating' as const, agent: 'Stellar Group' },
  { player: 'Ryan Thompson', position: 'CM', weeklyWage: '£22,000', end: 'Jun 2026', status: 'Offered' as const, agent: 'CAA Base' },
  { player: 'James Walker', position: 'GK', weeklyWage: '£15,000', end: 'Jun 2026', status: 'No Action' as const, agent: 'Unique Sports' },
  { player: "Sean O'Brien", position: 'LW', weeklyWage: '£20,000', end: 'Jun 2027', status: 'Signed' as const, agent: 'Wasserman' },
]

// ─── Academy Standouts ─────────────────────────────────────────────────────

const ACADEMY_STANDOUTS = [
  { name: 'Tyler James', age: 17, position: 'AMF', ageGroup: 'U18', devRating: '9.1', pathway: 'First Team Ready' },
  { name: 'Luca Ferreira', age: 16, position: 'CB', ageGroup: 'U18', devRating: '8.4', pathway: 'Pathway' },
  { name: 'Kai Thompson', age: 15, position: 'ST', ageGroup: 'U16', devRating: '8.8', pathway: 'Developing' },
  { name: 'Remi Santos', age: 18, position: 'CM', ageGroup: 'U23', devRating: '9.3', pathway: 'First Team Ready' },
]

// ─── Match Formations ───────────────────────────────────────────────────────

const MATCH_FORMATIONS = [
  { match: 'vs Riverside (W 2-1)', formation: '4-3-3', positions: [
    { num: 1, x: 50, y: 90, name: 'Walker' }, { num: 2, x: 80, y: 75, name: 'Henderson' },
    { num: 5, x: 60, y: 75, name: 'Martinez' }, { num: 6, x: 40, y: 75, name: 'Clarke' },
    { num: 3, x: 20, y: 75, name: 'Davies' }, { num: 8, x: 65, y: 55, name: 'Thompson' },
    { num: 4, x: 50, y: 50, name: 'Okafor' }, { num: 14, x: 35, y: 55, name: 'Fernandez' },
    { num: 7, x: 80, y: 30, name: 'Collins' }, { num: 9, x: 50, y: 20, name: 'Santos' },
    { num: 11, x: 20, y: 30, name: "O'Brien" },
  ], stats: { possession: 58, shots: 14, xG: 1.82, passes: 487, duels: 52 }},
  { match: 'vs City Vale (D 0-0)', formation: '4-2-3-1', positions: [
    { num: 1, x: 50, y: 90, name: 'Walker' }, { num: 2, x: 80, y: 75, name: 'Henderson' },
    { num: 5, x: 60, y: 75, name: 'Cole' }, { num: 6, x: 40, y: 75, name: 'Phillips' },
    { num: 3, x: 20, y: 75, name: 'Campbell' }, { num: 8, x: 60, y: 55, name: 'Nakamura' },
    { num: 16, x: 40, y: 55, name: 'Gallagher' }, { num: 7, x: 80, y: 38, name: 'Correia' },
    { num: 10, x: 50, y: 35, name: 'Price' }, { num: 11, x: 20, y: 38, name: 'Clarke' },
    { num: 9, x: 50, y: 20, name: 'Richards' },
  ], stats: { possession: 47, shots: 6, xG: 0.42, passes: 382, duels: 61 }},
  { match: 'vs Northern (W 3-1)', formation: '4-3-3', positions: [
    { num: 1, x: 50, y: 90, name: 'Walker' }, { num: 2, x: 80, y: 75, name: 'Henderson' },
    { num: 5, x: 60, y: 75, name: 'Cole' }, { num: 6, x: 40, y: 75, name: 'Martinez' },
    { num: 3, x: 20, y: 75, name: 'Campbell' }, { num: 8, x: 65, y: 55, name: 'Thompson' },
    { num: 14, x: 50, y: 50, name: 'Nakamura' }, { num: 16, x: 35, y: 55, name: 'Gallagher' },
    { num: 7, x: 80, y: 30, name: 'Correia' }, { num: 9, x: 50, y: 20, name: 'Santos' },
    { num: 11, x: 20, y: 30, name: "O'Brien" },
  ], stats: { possession: 62, shots: 18, xG: 2.41, passes: 521, duels: 48 }},
]

const FIXTURES = [
  { opponent: 'Stockport County', date: 'Sat 5 Apr', time: '15:00', venue: 'Away', competition: 'League One' },
  { opponent: 'Huddersfield Town', date: 'Sat 12 Apr', time: '15:00', venue: 'Home', competition: 'League One' },
  { opponent: 'Peterborough United', date: 'Fri 18 Apr', time: '19:45', venue: 'Away', competition: 'League One' },
]

const ACADEMY_PLAYERS = [
  { name: 'Josh Collins', age: 17, position: 'ST', highlight: 'U21 hat-trick vs Riverside. Recommended for first-team training.' },
  { name: 'Alfie Morgan', age: 16, position: 'CM', highlight: 'Outstanding passing range. Youth coach rates as generational talent.' },
  { name: 'Rhys Okonkwo', age: 18, position: 'CB', highlight: 'Bench squad inclusion pending. Dominant in U21 aerial duels.' },
  { name: 'Elijah Shaw', age: 17, position: 'LW', highlight: 'Pace merchant. 7 assists in last 8 U18 appearances.' },
]

// ─── Football Roundup Data ──────────────────────────────────────────────────

const FOOTBALL_ROUNDUP_ITEMS = [
  {
    id: 'agents', icon: '📱', label: 'Agent Messages', count: 3, urgent: true,
    color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)',
    messages: [
      { id: 'a1', from: 'Stellar Group', avatar: 'SG', subject: 'Martinez contract — urgent', preview: 'Diego\'s representatives want to discuss the renewal terms before the window. They have interest from Serie A.', time: '8:05am', urgent: true, read: false },
      { id: 'a2', from: 'ProSport Agency', avatar: 'PA', subject: 'Santos availability', preview: 'Lucas Santos is open to a loan move in January if he isn\'t first choice by then. Interested clubs in touch.', time: '7:30am', urgent: false, read: false },
      { id: 'a3', from: 'Elite Sports Mgmt', avatar: 'ES', subject: 'Academy prospect query', preview: 'We represent Josh Collins. His family want to discuss first-team pathway and improved academy terms.', time: 'Yesterday', urgent: false, read: true },
    ]
  },
  {
    id: 'board', icon: '🏛️', label: 'Board Messages', count: 2, urgent: false,
    color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',
    messages: [
      { id: 'b1', from: 'Chairman\'s Office', avatar: 'CO', subject: 'Transfer budget update', preview: 'The board has approved an additional £500k for the summer window. Total budget now £4.2m.', time: '9:15am', urgent: false, read: false },
      { id: 'b2', from: 'Finance Director', avatar: 'FD', subject: 'Wage bill review', preview: 'Current wage bill at 62% of revenue. Board target is 60%. Need to discuss before renewals.', time: 'Yesterday', urgent: false, read: true },
    ]
  },
  {
    id: 'media', icon: '📰', label: 'Media & Press', count: 4, urgent: false,
    color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)',
    messages: [
      { id: 'm1', from: 'BBC Sport', avatar: 'BB', subject: 'Pre-match interview request', preview: 'We\'d like to arrange a 15-minute pre-match interview for Saturday\'s game. Available Thursday PM?', time: '8:45am', urgent: false, read: false },
      { id: 'm2', from: 'Sky Sports', avatar: 'SS', subject: 'Transfer rumours — comment?', preview: 'We\'re running a piece on your interest in Yannick Diallo. Any comment from the club?', time: '8:00am', urgent: false, read: false },
      { id: 'm3', from: 'Local Gazette', avatar: 'LG', subject: 'Fan forum coverage', preview: 'We\'re covering the fan forum on Thursday evening. Will the manager be attending?', time: 'Yesterday', urgent: false, read: true },
      { id: 'm4', from: 'Press Officer', avatar: 'PO', subject: 'Press conference at 2pm', preview: 'Reminder: pre-match presser at 2pm today in the media suite. AI briefing notes attached.', time: '7:30am', urgent: false, read: false },
    ]
  },
  {
    id: 'transfers', icon: '🔄', label: 'Transfer Activity', count: 2, urgent: true,
    color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',
    messages: [
      { id: 't1', from: 'Chief Scout', avatar: 'CS', subject: 'Diallo update — Genk respond', preview: 'Genk have countered at £2.1m. They want a 15% sell-on clause. Recommend we push back to £1.9m.', time: '9:02am', urgent: true, read: false },
      { id: 't2', from: 'Analyst Team', avatar: 'AT', subject: 'Ferreira video analysis ready', preview: 'Full match analysis of Tiago Ferreira vs Porto is ready for review. 94-minute breakdown with heat maps.', time: 'Yesterday', urgent: false, read: true },
    ]
  },
  {
    id: 'staff', icon: '👔', label: 'Staff Updates', count: 2, urgent: false,
    color: '#06B6D4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)',
    messages: [
      { id: 's1', from: 'Head Physio', avatar: 'HP', subject: 'Injury update — morning report', preview: 'Martinez did light jogging this morning. Santos completed pool session. O\'Brien still in boot.', time: '8:30am', urgent: false, read: false },
      { id: 's2', from: 'Goalkeeping Coach', avatar: 'GC', subject: 'Walker — distribution drill results', preview: 'Walker\'s long distribution accuracy improved to 74% in yesterday\'s session. Significant progress.', time: 'Yesterday', urgent: false, read: true },
    ]
  },
  {
    id: 'academy', icon: '🎓', label: 'Academy', count: 2, urgent: false,
    color: '#F97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)',
    messages: [
      { id: 'ac1', from: 'U21 Coach', avatar: 'U2', subject: 'Collins hat-trick — match report', preview: 'Josh Collins scored a hat-trick in yesterday\'s U21 win. Strong recommendation for first-team bench.', time: '8:15am', urgent: false, read: false },
      { id: 'ac2', from: 'Academy Director', avatar: 'AD', subject: 'Scholarship intake review', preview: 'We have 4 offers out for next season\'s scholarship cohort. 2 have accepted, 2 pending.', time: 'Yesterday', urgent: false, read: true },
    ]
  },
  {
    id: 'sms', icon: '💬', label: 'SMS / Text', count: 3, urgent: true,
    color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)',
    messages: [
      { id: 'sms1', from: 'Nathan Bishop', avatar: 'NB', subject: 'Contract chat', preview: 'Gaffer, can we chat about my contract situation?', time: '7:45am', urgent: false, read: false },
      { id: 'sms2', from: 'Unknown Number', avatar: '??', subject: 'Agent interest', preview: 'My client is very interested — call me', time: '8:12am', urgent: true, read: false },
      { id: 'sms3', from: 'Marcus Browne', avatar: 'MB', subject: 'Match ready', preview: 'Feeling sharp today. Ready for Saturday 💪', time: '8:30am', urgent: false, read: false },
    ]
  },
  {
    id: 'whatsapp', icon: '💚', label: 'WhatsApp Business', count: 4, urgent: false,
    color: '#22C55E', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)',
    messages: [
      { id: 'wa1', from: 'Plough Lane Staff', avatar: 'PL', subject: 'Pitch inspection', preview: 'Pitch inspection at 09:00 — all clear for training', time: '7:30am', urgent: false, read: false },
      { id: 'wa2', from: 'Kit Man Dave', avatar: 'KD', subject: 'Away kit ready', preview: 'Away kit packed and loaded onto coach', time: '8:00am', urgent: false, read: false },
      { id: 'wa3', from: 'Club Doctor', avatar: 'CD', subject: 'Hughes update', preview: 'Hughes cleared for light training today', time: '8:45am', urgent: false, read: false },
      { id: 'wa4', from: 'Fan Trust Rep', avatar: 'FT', subject: 'Supporter Q&A', preview: 'Q&A with supporters confirmed for Tuesday', time: '9:00am', urgent: false, read: true },
    ]
  },
  {
    id: 'slack', icon: '🔷', label: 'Slack', count: 4, urgent: false,
    color: '#4A154B', bg: 'rgba(74,21,75,0.08)', border: 'rgba(74,21,75,0.2)',
    messages: [
      { id: 'sl1', from: '#analyst-room', avatar: 'AN', subject: 'Stockport stats', preview: 'Stockport County pressing stats uploaded to shared drive', time: '8:10am', urgent: false, read: false },
      { id: 'sl2', from: '#scouting', avatar: 'SC', subject: 'Peterborough winger', preview: 'Video package on Peterborough winger ready for review', time: '8:25am', urgent: false, read: false },
      { id: 'sl3', from: '#medical', avatar: 'ME', subject: 'GPS report', preview: 'Weekly GPS load report available in Medical channel', time: '8:40am', urgent: false, read: false },
      { id: 'sl4', from: '#board', avatar: 'BD', subject: 'Q3 review', preview: 'Q3 financial review scheduled for next Monday', time: '9:05am', urgent: false, read: true },
    ]
  },
]

// ─── Football Opening / Closing Lines ───────────────────────────────────────

const FOOTBALL_OPENING_LINES = [
  "Let's get into the morning briefing, gaffer.",
  "Here's what's happened overnight and what's ahead today.",
  "Morning, boss. Here's your daily football operations rundown.",
  "Right, let's run through today's priorities.",
  "Here's everything you need before training kicks off.",
]

const FOOTBALL_CLOSING_LINES = [
  "That's your briefing. Now go run that training session.",
  "Have a good day, gaffer. The lads are waiting.",
  "That's everything. Go make it a good one.",
  "Briefing done. Time to get to work on the training pitch.",
  "All set. Go put that session plan into action.",
]

// ─── Morning Highlights ─────────────────────────────────────────────────────

const MORNING_HIGHLIGHTS_FOOTBALL = [
  '3 injured players — Martinez, O\'Brien, Santos. Santos closest to return (7 Apr).',
  'Thompson suspended for Saturday. Nakamura or Gallagher to start in CM.',
  'Transfer target Diallo — Genk countered at £2.1m. Budget remaining: £4.2m.',
  'Press conference at 2pm today. AI briefing notes prepared.',
  'U21s won 3-0 yesterday. Collins hat-trick — recommended for first-team bench.',
  'Saturday\'s match vs Riverside United at home, 3pm kick-off. Team sheet needed by Thursday.',
]

// ─── World Clock (reused) ───────────────────────────────────────────────────

const DEFAULT_WORLD_ZONES = [
  { label: 'London',   tz: 'Europe/London'    },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'Dubai',    tz: 'Asia/Dubai'       },
  { label: 'Tokyo',    tz: 'Asia/Tokyo'       },
]

const ALL_TIMEZONES = [
  { label: 'London', tz: 'Europe/London' },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'Dubai', tz: 'Asia/Dubai' },
  { label: 'Tokyo', tz: 'Asia/Tokyo' },
  { label: 'Sydney', tz: 'Australia/Sydney' },
  { label: 'Los Angeles', tz: 'America/Los_Angeles' },
  { label: 'Paris', tz: 'Europe/Paris' },
  { label: 'Berlin', tz: 'Europe/Berlin' },
  { label: 'Singapore', tz: 'Asia/Singapore' },
  { label: 'Madrid', tz: 'Europe/Madrid' },
  { label: 'Lisbon', tz: 'Europe/Lisbon' },
  { label: 'Rio de Janeiro', tz: 'America/Sao_Paulo' },
  { label: 'Buenos Aires', tz: 'America/Argentina/Buenos_Aires' },
  { label: 'Mumbai', tz: 'Asia/Kolkata' },
  { label: 'Riyadh', tz: 'Asia/Riyadh' },
]

function getStoredZones(): { label: string; tz: string }[] {
  if (typeof window === 'undefined') return DEFAULT_WORLD_ZONES
  try {
    const stored = localStorage.getItem('lumio_world_zones')
    if (stored) return JSON.parse(stored)
  } catch {}
  return DEFAULT_WORLD_ZONES
}

function getUserLocalTz(): { label: string; tz: string } {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const match = ALL_TIMEZONES.find(z => z.tz === tz)
  return match || { label: tz.split('/').pop()?.replace(/_/g, ' ') || 'Local', tz }
}

function WorldClock() {
  const [now, setNow] = useState(() => new Date())
  const [zones, setZones] = useState(getStoredZones)
  const localTz = getUserLocalTz()
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id) }, [])
  useEffect(() => {
    function onStorage(e: StorageEvent) { if (e.key === 'lumio_world_zones') setZones(getStoredZones()) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 relative" style={{ minWidth: 160 }}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {zones.map(z => {
          const isLocal = z.tz === localTz.tz
          return (
            <div key={z.label} className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-black text-white">{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: z.tz, hour12: false })}</span>
              <span className="text-xs" style={{ color: isLocal ? '#FBBF24' : 'rgba(248,113,113,0.7)' }}>{z.label}</span>
            </div>
          )
        })}
      </div>
      <div className="text-xs mt-1" style={{ color: '#FBBF24' }}>World Clock</div>
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ activeDept, onSelect, open, onClose, clubName }: {
  activeDept: DeptId; onSelect: (d: DeptId) => void; open: boolean; onClose: () => void; clubName?: string
}) {
  const [pinned, setPinned] = useState(() => typeof window !== 'undefined' && localStorage.getItem('lumio_sidebar_pinned') === 'true')
  const [hovered, setHovered] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoFileRef = useRef<HTMLInputElement>(null)
  const [clubLogo, setClubLogo] = useState<string | null>(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_football_logo') : null)
  const [logoHover, setLogoHover] = useState(false)
  const expanded = pinned || hovered


  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || file.size > 2 * 1024 * 1024) return
    if (!['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type)) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setClubLogo(dataUrl)
      localStorage.setItem('lumio_football_logo', dataUrl)
    }
    reader.readAsDataURL(file)
  }

  function togglePin() {
    setPinned(p => { const next = !p; localStorage.setItem('lumio_sidebar_pinned', String(next)); return next })
  }
  function handleMouseEnter() { if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null }; setHovered(true) }
  function handleMouseLeave() { leaveTimer.current = setTimeout(() => setHovered(false), 400) }

  const PRIMARY = '#003DA5'
  const DARK = '#002D7A'
  const SECONDARY = '#F1C40F'

  // group items by section
  const sections: { label: SidebarSection; items: typeof SIDEBAR_ITEMS }[] = [
    { label: null, items: SIDEBAR_ITEMS.filter(i => i.section === null) },
    { label: 'Departments', items: SIDEBAR_ITEMS.filter(i => i.section === 'Departments') },
    { label: 'Tools', items: SIDEBAR_ITEMS.filter(i => i.section === 'Tools') },
    { label: 'Leagues', items: SIDEBAR_ITEMS.filter(i => i.section === 'Leagues') },
    { label: 'Integrations', items: SIDEBAR_ITEMS.filter(i => i.section === 'Integrations') },
  ]

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col shrink-0 overflow-hidden"
        style={{ width: expanded ? 208 : 72, backgroundColor: '#0A0B10', borderRight: '1px solid #1F2937', transition: 'width 250ms ease' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <input ref={logoFileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        <div className="flex items-center justify-center gap-2.5 py-3 shrink-0" style={{ borderBottom: '1px solid #1F2937', minHeight: 72, padding: expanded ? '12px 16px' : '12px 0' }}>
          <button onClick={() => logoFileRef.current?.click()} onMouseEnter={() => setLogoHover(true)} onMouseLeave={() => setLogoHover(false)} className="relative flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden" style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: clubLogo ? 'transparent' : PRIMARY, color: '#F9FAFB', border: '1px solid #1F2937' }} title="Upload club badge">
            {clubLogo ? <img src={clubLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 9 }} onError={() => setClubLogo(null)} /> : 'FC'}
            {logoHover && <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 9 }}><Camera size={16} color="#fff" /></div>}
          </button>
          {expanded && (
            <>
              <div className="flex-1 min-w-0">
                {clubName && <p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{clubName}</p>}
                <p className="text-[10px] truncate" style={{ color: '#6B7280' }}>Football Portal</p>
              </div>
              <button onClick={togglePin} className="shrink-0 p-1 rounded" style={{ color: pinned ? PRIMARY : '#4B5563', transform: pinned ? 'rotate(0deg)' : 'rotate(45deg)' }} title={pinned ? 'Unpin' : 'Pin open'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z"/></svg>
              </button>
            </>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-1.5 py-3 overflow-y-auto football-sidebar-scroll">
          {sections.map((sec, si) => (
            <div key={si}>
              {sec.label && expanded && (
                <p className="text-[10px] font-semibold uppercase tracking-wider px-3 pt-3 pb-1.5" style={{ color: '#4B5563' }}>{sec.label}</p>
              )}
              {sec.items.map(item => {
                const active = activeDept === item.id
                return (
                  <button key={item.id}
                    onClick={() => { onSelect(item.id); if (!pinned) setHovered(false) }}
                    className="flex items-center gap-2.5 py-2 rounded-lg text-sm font-medium text-left w-full transition-all"
                    style={{
                      backgroundColor: active ? `${PRIMARY}1f` : 'transparent',
                      color: active ? PRIMARY : '#9CA3AF',
                      borderLeft: active ? `2px solid ${PRIMARY}` : '2px solid transparent',
                      paddingLeft: expanded ? 12 : 0,
                      justifyContent: expanded ? 'flex-start' : 'center',
                    }}
                    title={expanded ? undefined : item.label}>
                    <item.icon size={15} strokeWidth={active ? 2.5 : 2} />
                    {expanded && <span className="truncate">{item.label}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="mt-auto shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          {expanded && (
            <div className="pb-3">
              <a href="https://lumiocms.com" target="_blank" rel="noreferrer" className="block mx-auto opacity-40 hover:opacity-70 transition-opacity" style={{ width: 'fit-content' }}>
                <Image src="/lumio-transparent-new.png" alt="Lumio" width={180} height={90} style={{ width: 120, height: 'auto', objectFit: 'contain' }} />
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
          <aside className="relative z-50 w-56 flex flex-col" style={{ backgroundColor: '#0A0B10', borderRight: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
              <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>NAVIGATION</span>
              <button onClick={onClose} style={{ color: '#6B7280' }}><ChevronLeft size={16} /></button>
            </div>
            <nav className="flex flex-1 flex-col gap-0.5 p-3 overflow-y-auto football-sidebar-scroll">
              {SIDEBAR_ITEMS.map(item => {
                const active = activeDept === item.id
                return (
                  <button key={item.id} onClick={() => { onSelect(item.id); onClose() }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left w-full"
                    style={{ backgroundColor: active ? `${PRIMARY}1f` : 'transparent', color: active ? PRIMARY : '#9CA3AF' }}>
                    <item.icon size={15} strokeWidth={active ? 2.5 : 2} />
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </nav>
            <div className="mt-auto px-4 pb-3" style={{ borderTop: '1px solid #1F2937' }}>
              <a href="https://lumiocms.com" target="_blank" rel="noreferrer" className="block mx-auto opacity-40 hover:opacity-70 transition-opacity" style={{ width: 'fit-content' }}>
                <Image src="/lumio-transparent-new.png" alt="Lumio" width={180} height={90} style={{ width: 120, height: 'auto', objectFit: 'contain' }} />
              </a>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

// ─── Personal Banner ─────────────────────────────────────────────────────────

function PersonalBanner({ clubName, firstName, onVoiceCommand, isDemo = false, clubLogo }: {
  clubName: string; firstName?: string; onVoiceCommand?: (cmd: FootballCommandResult) => void; isDemo?: boolean; clubLogo?: string | null
}) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const [bg] = useState(() => BG_GRADIENTS[new Date().getDay()])
  const { speak, stop, isPlaying } = useSpeech()
  const [quote, setQuote] = useState(FOOTBALL_QUOTES[0])
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', icon: '🌤️' })

  useEffect(() => {
    const start = new Date(new Date().getFullYear(), 0, 1).getTime()
    const dayOfYear = Math.floor((Date.now() - start) / 86400000)
    setQuote(FOOTBALL_QUOTES[dayOfYear % FOOTBALL_QUOTES.length])
  }, [])

  useEffect(() => { fetch('/api/home/weather').then(r => r.json()).then(setWeather).catch(() => {}) }, [])

  const { isListening, lastCommand, startListening, stopListening } = useFootballVoiceCommands()

  useEffect(() => {
    if (!lastCommand) return
    speak(lastCommand.response)
    if (lastCommand.action === 'PLAY_BRIEFING') {
      setTimeout(() => handleBriefing(), 1800)
    } else if (lastCommand.action === 'STOP_AUDIO') {
      stop()
    }
    if (onVoiceCommand) onVoiceCommand(lastCommand)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCommand])

  function handleBriefing() {
    if (isPlaying) { stop(); return }
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    const openingLine = FOOTBALL_OPENING_LINES[dayOfYear % FOOTBALL_OPENING_LINES.length]
    const closingLine = FOOTBALL_CLOSING_LINES[dayOfYear % FOOTBALL_CLOSING_LINES.length]
    const fitCount = SQUAD.filter(p => p.fitness === 'fit').length
    const injuredCount = SQUAD.filter(p => p.fitness === 'injured').length
    const script = `${greeting}, ${firstName || 'gaffer'}. ${openingLine} You have ${fitCount} players fit for selection, ${injuredCount} injured, and 1 suspended. ${FIXTURES[0] ? `Next match: ${FIXTURES[0].opponent} on ${FIXTURES[0].date} at ${FIXTURES[0].time}, ${FIXTURES[0].venue}.` : ''} ${closingLine}`
    speak(script)
  }

  const fitCount = SQUAD.filter(p => p.fitness === 'fit').length
  const injuredCount = SQUAD.filter(p => p.fitness === 'injured').length
  const suspendedCount = SQUAD.filter(p => p.fitness === 'suspended').length

  return (
    <>
      <div className={`relative bg-gradient-to-r ${bg} overflow-visible rounded-2xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] mx-1`}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)', pointerEvents: 'none', borderRadius: 'inherit' }} />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-yellow-400 rounded-full opacity-10 blur-3xl" />
        <img src="/badges/afc_wimbledon_badge_studio.png" alt="Club badge" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 16, height: 120, width: 'auto', zIndex: 10, filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.6))' }} />
        <div className="relative z-10 px-6 py-5" style={{ paddingLeft: 140 }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-white tracking-tight">{greeting}, {firstName || 'gaffer'} ⚽</h1>
                <button onClick={handleBriefing} title="Morning briefing — squad updates, fixtures, and key items" className="flex items-center justify-center rounded-lg transition-all"
                  style={{ width: 32, height: 32, flexShrink: 0, backgroundColor: isPlaying ? 'rgba(0,61,165,0.25)' : 'rgba(255,255,255,0.08)', border: isPlaying ? '1px solid rgba(0,61,165,0.5)' : '1px solid rgba(255,255,255,0.12)', color: isPlaying ? '#F1C40F' : '#9CA3AF', animation: isPlaying ? 'pulse 1.5s ease-in-out infinite' : 'none' }}>
                  <Volume2 size={15} strokeWidth={1.75} />
                </button>
                <button
                  onClick={() => isListening ? stopListening() : startListening()}
                  title={isListening ? 'Listening...' : "Voice Commands — say 'who\\'s fit' or 'transfer budget'"}
                  className="flex items-center justify-center rounded-lg transition-all"
                  style={{
                    width: 32, height: 32, flexShrink: 0, cursor: 'pointer',
                    backgroundColor: isListening ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
                    border: isListening ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)',
                    color: isListening ? '#EF4444' : '#F9FAFB',
                    animation: isListening ? 'pulse 1.5s infinite' : 'none',
                  }}>
                  <Mic size={14} strokeWidth={1.75} />
                </button>
              </div>
              <p className="text-sm mb-2" style={{ color: '#F1C40F' }}>{date}</p>
              <p style={{ color: '#F1C40F' }} className="text-sm italic">&ldquo;{quote.text}&rdquo; — {quote.author}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {[
                { label: 'Squad', value: isDemo ? SQUAD.length : '—', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '👥' },
                { label: 'Fit', value: isDemo ? fitCount : '—', color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: '✅' },
                { label: 'Injured', value: isDemo ? injuredCount : '—', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '🏥' },
                { label: 'Suspended', value: isDemo ? suspendedCount : '—', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', icon: '🟨' },
              ].map(item => (
                <div key={item.label} className={`flex flex-col items-center px-3 py-2 rounded-xl border ${item.color} min-w-[70px]`}>
                  <span className="text-base">{item.icon}</span>
                  <span className="text-lg font-black text-white">{item.value}</span>
                  <span className="text-xs opacity-70">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3 flex-shrink-0">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <span className="text-3xl">{weather.icon}</span>
                <div>
                  <div className="text-xl font-black text-white">{weather.temp}</div>
                  <div className="text-xs" style={{ color: '#F1C40F' }}>{weather.condition}</div>
                </div>
              </div>
              <WorldClock />
            </div>
          </div>
        </div>
      </div>
      {isListening && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#111318', border: '1px solid #EF4444',
          borderRadius: 999, padding: '8px 20px', zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 8, color: '#F9FAFB', fontSize: 14,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EF4444', animation: 'pulse 1s infinite' }} />
          Listening... say a command
        </div>
      )}
    </>
  )
}

// ─── Quick Actions Bar ──────────────────────────────────────────────────────

const FOOTBALL_QUICK_ACTIONS = [
  { label: 'Team Sheet', icon: Clipboard },
  { label: 'Log Injury', icon: Heart },
  { label: 'Transfer Hub', icon: ArrowUpDown },
  { label: 'Book Video Room', icon: Video },
  { label: 'Press Conf', icon: Newspaper },
  { label: 'Training Plan', icon: Activity },
  { label: 'Scout Report', icon: Eye },
  { label: 'Board Report', icon: Briefcase },
  { label: 'Dept Insights', icon: BarChart3 },
]

function QuickActionsBar({ onAction }: { onAction: (label: string) => void }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto football-quickactions-hide-scroll" style={{ backgroundColor: '#0D0E14', borderBottom: '1px solid #1F2937' }}>
      <span className="text-xs font-semibold shrink-0 mr-1" style={{ color: '#4B5563' }}>Quick actions</span>
      {FOOTBALL_QUICK_ACTIONS.map(a => (
        <button key={a.label} onClick={() => onAction(a.label)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap shrink-0"
          style={a.label === 'Dept Insights' ? { backgroundColor: 'transparent', border: '1px solid #F1C40F', color: '#F1C40F' } : { backgroundColor: '#002D7A', color: '#F1C40F' }}>
          <a.icon size={12} />{a.label}
        </button>
      ))}
    </div>
  )
}

// ─── Tab Bar ─────────────────────────────────────────────────────────────────

const OVERVIEW_TABS: { id: OverviewTab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '🏠' },
  { id: 'quick-wins', label: 'Quick Wins', icon: '⚡' },
  { id: 'match-week', label: 'Match Week', icon: '⚽' },
  { id: 'insights', label: 'Insights', icon: '📊' },
  { id: 'dont-miss', label: "Don't Miss", icon: '🔴' },
  { id: 'staff', label: 'Staff', icon: '👥' },
]

function TabBar({ tab, onChange }: { tab: OverviewTab; onChange: (t: OverviewTab) => void }) {
  return (
    <div className="border-b overflow-x-auto scrollbar-none -mx-4 sm:-mx-5" style={{ backgroundColor: '#0D0E14', borderColor: '#1F2937' }}>
      <div className="flex items-center gap-0 min-w-max px-2">
        {OVERVIEW_TABS.map(t => (
          <button key={t.id} onClick={() => onChange(t.id)} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap"
            style={{ borderBottomColor: tab === t.id ? '#003DA5' : 'transparent', color: tab === t.id ? '#F1C40F' : '#6B7280', backgroundColor: tab === t.id ? 'rgba(0,61,165,0.05)' : 'transparent' }}>
            <span className="text-base">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Morning Roundup (Football) ─────────────────────────────────────────────

function MorningRoundup() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [replied, setReplied] = useState<string[]>([])
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [showReply, setShowReply] = useState<string | null>(null)

  function handleReply(msgId: string) {
    if (replyText[msgId]?.trim()) {
      setReplied(r => [...r, msgId])
      setShowReply(null)
      setReplyText(t => ({ ...t, [msgId]: '' }))
    }
  }

  return (
    <div className="rounded-2xl p-5 h-full" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: '#F9FAFB' }}>🌅 Morning Roundup</h3>
        <span className="text-xs" style={{ color: '#6B7280' }}>Since you were last here</span>
      </div>
      <div className="space-y-2">
        {FOOTBALL_ROUNDUP_ITEMS.map(item => {
          const isOpen = expanded === item.id
          return (
            <div key={item.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: item.bg, border: `1px solid ${item.border}` }}>
              <button onClick={() => setExpanded(isOpen ? null : item.id)} className="w-full flex items-center justify-between p-3 text-left">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm font-bold" style={{ color: item.color }}>{item.label}</span>
                  {item.urgent && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#F87171' }}>Urgent</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black" style={{ color: item.color }}>{item.count}</span>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 space-y-2">
                  {item.messages.map(msg => (
                    <div key={msg.id} className="rounded-lg p-3" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', opacity: msg.read ? 0.7 : 1 }}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: item.color + '22', color: item.color }}>
                            {msg.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{msg.from}</span>
                              {!msg.read && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />}
                              {msg.urgent && <span className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#F87171', fontSize: 10 }}>Urgent</span>}
                            </div>
                            <div className="text-xs font-medium" style={{ color: '#D1D5DB' }}>{msg.subject}</div>
                          </div>
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color: '#6B7280' }}>{msg.time}</span>
                      </div>
                      <p className="text-xs mb-2 leading-relaxed" style={{ color: '#9CA3AF' }}>{msg.preview}</p>
                      {replied.includes(msg.id) ? (
                        <span className="text-xs" style={{ color: '#003DA5' }}>Replied</span>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => setShowReply(showReply === msg.id ? null : msg.id)} className="text-xs px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: '#003DA5', border: '1px solid rgba(0,61,165,0.3)' }}>Reply</button>
                          <button className="text-xs px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.1)' }}>Forward</button>
                        </div>
                      )}
                      {showReply === msg.id && (
                        <div className="mt-2">
                          <textarea value={replyText[msg.id] || ''} onChange={e => setReplyText(t => ({ ...t, [msg.id]: e.target.value }))} placeholder="Write your reply..." rows={2}
                            className="w-full text-xs rounded-lg p-2 resize-none" style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB', outline: 'none' }} />
                          <div className="flex gap-2 mt-1.5">
                            <button onClick={() => handleReply(msg.id)} className="text-xs px-3 py-1 rounded-lg font-semibold" style={{ backgroundColor: '#003DA5', color: '#F1C40F' }}>Send</button>
                            <button onClick={() => setShowReply(null)} className="text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF' }}>Cancel</button>
                          </div>
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
    </div>
  )
}

// ─── Fixtures Panel ─────────────────────────────────────────────────────────

function FixturesPanel() {
  return (
    <div className="rounded-2xl p-5 h-full" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: '#F9FAFB' }}>📅 This Week&apos;s Fixtures</h3>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>{FIXTURES.length} matches</span>
      </div>
      <div className="space-y-3">
        {FIXTURES.map((f, i) => (
          <div key={i} className="rounded-xl p-4" style={{ backgroundColor: i === 0 ? 'rgba(0,61,165,0.08)' : 'rgba(255,255,255,0.02)', border: i === 0 ? '1px solid rgba(0,61,165,0.25)' : '1px solid #1F2937' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {i === 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                <span className="text-sm font-bold" style={{ color: i === 0 ? '#F1C40F' : '#F9FAFB' }}>{f.opponent}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-lg" style={{ backgroundColor: f.venue === 'Home' ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.12)', color: f.venue === 'Home' ? '#22C55E' : '#60A5FA' }}>
                {f.venue}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: '#9CA3AF' }}>
              <span>{f.date}</span>
              <span>{f.time} KO</span>
              <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>{f.competition}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3" style={{ borderTop: '1px solid #1F2937' }}>
        <div className="text-xs" style={{ color: '#6B7280' }}>
          <span className="font-semibold" style={{ color: '#9CA3AF' }}>Team Sheet Deadline:</span> Thursday 5pm for Saturday&apos;s match
        </div>
      </div>
    </div>
  )
}

// ─── Photo Frame ─────────────────────────────────────────────────────────────

const DEMO_PHOTOS = [
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80',
]

function PhotoFrame() {
  const [photos, setPhotos] = useState<string[]>(() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem('lumio-football-photo-frame') : null; if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p.map((x: any) => typeof x === 'string' ? x : x.src) } } catch {} return typeof window !== 'undefined' && localStorage.getItem('lumio_football_demo_active') === 'true' ? DEMO_PHOTOS : [] })
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [intervalSecs, setIntervalSecs] = useState(5)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [photoPositions, setPhotoPositions] = useState<Record<number, { x: number; y: number }>>(() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem('lumio-football-photo-positions') : null; return s ? JSON.parse(s) : {} } catch { return {} } })
  const [hasEverDragged, setHasEverDragged] = useState(() => typeof window !== 'undefined' && localStorage.getItem('lumio-football-photo-dragged') === 'true')
  const [hoveringFrame, setHoveringFrame] = useState(false)
  const [showCloudModal, setShowCloudModal] = useState<'google' | 'icloud' | null>(null)
  const isDragging = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const posStartRef = useRef({ x: 50, y: 50 })

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isPlaying && photos.length > 1) intervalRef.current = setInterval(() => setCurrentIdx(i => (i + 1) % photos.length), intervalSecs * 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, photos.length, intervalSecs])
  useEffect(() => { localStorage.setItem('lumio-football-photo-frame', JSON.stringify(photos)) }, [photos])
  useEffect(() => { localStorage.setItem('lumio-football-photo-positions', JSON.stringify(photoPositions)) }, [photoPositions])
  function handleAddPhoto(e: React.ChangeEvent<HTMLInputElement>) { const file = e.target.files?.[0]; if (!file || photos.length >= 5) return; const reader = new FileReader(); reader.onload = (ev) => { const src = ev.target?.result as string; setPhotos(prev => [...prev, src]); setCurrentIdx(photos.length) }; reader.readAsDataURL(file); e.target.value = '' }
  function handleRemovePhoto() { if (photos.length <= 1) return; setPhotos(prev => prev.filter((_, i) => i !== currentIdx)); setCurrentIdx(prev => Math.max(0, prev - 1)) }

  function onDragStart(cx: number, cy: number) {
    isDragging.current = true; dragStartRef.current = { x: cx, y: cy }
    posStartRef.current = photoPositions[currentIdx] || { x: 50, y: 50 }
    if (!hasEverDragged) { setHasEverDragged(true); localStorage.setItem('lumio-football-photo-dragged', 'true') }
  }
  function onDragMove(cx: number, cy: number, el: HTMLElement) {
    if (!isDragging.current) return
    const r = el.getBoundingClientRect()
    const dx = (cx - dragStartRef.current.x) / r.width * 100
    const dy = (cy - dragStartRef.current.y) / r.height * 100
    setPhotoPositions(p => ({ ...p, [currentIdx]: { x: Math.min(100, Math.max(0, posStartRef.current.x - dx)), y: Math.min(100, Math.max(0, posStartRef.current.y - dy)) } }))
  }
  function onDragEnd() { isDragging.current = false }
  function resetPosition() { setPhotoPositions(p => { const n = { ...p }; delete n[currentIdx]; return n }) }
  const pos = photoPositions[currentIdx] || { x: 50, y: 50 }

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minHeight: 240 }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2"><span className="text-base">🖼️</span><span className="font-bold text-sm" style={{ color: '#F9FAFB' }}>Photo Frame</span></div>
        <div className="flex items-center gap-2">
          {photos.length > 1 && <button onClick={() => setIsPlaying(p => !p)} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: isPlaying ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.05)', color: isPlaying ? '#0D9488' : '#6B7280' }}>{isPlaying ? '⏸ Pause' : '▶ Play'}</button>}
          {photos.length > 1 && <button onClick={handleRemovePhoto} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid #1F2937', background: 'transparent', color: '#EF4444', cursor: 'pointer', fontWeight: 600 }} title="Remove this photo">✕ Remove</button>}
          <button onClick={() => fileInputRef.current?.click()} disabled={photos.length >= 5} title={photos.length >= 5 ? 'Maximum 5 photos' : 'Add a photo'} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid #1F2937', background: 'transparent', color: photos.length >= 5 ? '#6B7280' : '#0D9488', cursor: photos.length >= 5 ? 'not-allowed' : 'pointer', fontWeight: 600 }}>+ Add</button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAddPhoto} style={{ display: 'none' }} />
        </div>
      </div>
      {photos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 mx-4 mb-4 rounded-xl cursor-pointer" style={{ border: '2px dashed #374151' }} onClick={() => fileInputRef.current?.click()}>
          <div className="text-3xl">📷</div><div className="text-xs" style={{ color: '#9CA3AF' }}>Add your photos</div>
        </div>
      ) : (
      <div className="flex-1 relative mx-4 mb-2 rounded-xl overflow-hidden" style={{ minHeight: 150, cursor: isDragging.current ? 'grabbing' : 'grab', userSelect: 'none' }}
        onMouseEnter={() => setHoveringFrame(true)} onMouseLeave={() => { setHoveringFrame(false); onDragEnd() }}
        onMouseDown={e => { e.preventDefault(); onDragStart(e.clientX, e.clientY) }}
        onMouseMove={e => onDragMove(e.clientX, e.clientY, e.currentTarget)}
        onMouseUp={onDragEnd}
        onTouchStart={e => { const t = e.touches[0]; if (t) onDragStart(t.clientX, t.clientY) }}
        onTouchMove={e => { const t = e.touches[0]; if (t) onDragMove(t.clientX, t.clientY, e.currentTarget as HTMLElement) }}
        onTouchEnd={onDragEnd}>
        <img src={photos[currentIdx]} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${pos.x}% ${pos.y}%`, position: 'absolute', inset: 0, pointerEvents: 'none', transition: isDragging.current ? 'none' : 'object-position 0.15s ease', userSelect: 'none' }} />
        {photos.length > 1 && (<>
          <button onClick={e => { e.stopPropagation(); setCurrentIdx(i => (i - 1 + photos.length) % photos.length) }} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center" style={{ width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 12 }}>{'‹'}</button>
          <button onClick={e => { e.stopPropagation(); setCurrentIdx(i => (i + 1) % photos.length) }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center" style={{ width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 12 }}>{'›'}</button>
        </>)}
        <div className="absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#D1D5DB' }}>{currentIdx + 1} / {photos.length}</div>
        {(pos.x !== 50 || pos.y !== 50) && hoveringFrame && <button onClick={e => { e.stopPropagation(); resetPosition() }} className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded transition-opacity" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>Reset</button>}
        {!hasEverDragged && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-full pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', whiteSpace: 'nowrap' }}>✥ Drag to reposition</div>}
      </div>
      )}
      {photos.length > 1 && <div className="px-4 pb-3 flex items-center gap-2"><span className="text-xs" style={{ color: '#6B7280' }}>Speed:</span>{[3,5,10,30].map(s => <button key={s} onClick={() => setIntervalSecs(s)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: intervalSecs === s ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.05)', color: intervalSecs === s ? '#0D9488' : '#6B7280' }}>{s}s</button>)}</div>}
      <div style={{ padding: '8px 12px', borderTop: '1px solid #1F2937', background: '#0A0B10', borderRadius: '0 0 16px 16px' }}>
        <p style={{ fontSize: 10, color: '#6B7280', margin: '0 0 6px', textAlign: 'center' }}>Import from</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowCloudModal('google')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, border: '1px solid #1F2937', background: '#111318', color: '#9CA3AF', fontSize: 11, fontWeight: 600, cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.background = '#1F2937'; e.currentTarget.style.color = '#F9FAFB' }} onMouseLeave={e => { e.currentTarget.style.background = '#111318'; e.currentTarget.style.color = '#9CA3AF' }}>
            <svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#4285F4"/><path d="M12 7c-2.76 0-5 2.24-5 5h5V7z" fill="#EA4335"/><path d="M7 12c0 2.76 2.24 5 5 5v-5H7z" fill="#FBBC04"/><path d="M12 17c2.76 0 5-2.24 5-5h-5v5z" fill="#34A853"/><path d="M17 12c0-2.76-2.24-5-5-5v5h5z" fill="#4285F4"/></svg>
            Google Photos ✦
          </button>
          <button onClick={() => setShowCloudModal('icloud')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, border: '1px solid #1F2937', background: '#111318', color: '#9CA3AF', fontSize: 11, fontWeight: 600, cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.background = '#1F2937'; e.currentTarget.style.color = '#F9FAFB' }} onMouseLeave={e => { e.currentTarget.style.background = '#111318'; e.currentTarget.style.color = '#9CA3AF' }}>
            <svg width="14" height="10" viewBox="0 0 24 16"><path d="M19.35 6.04A7.49 7.49 0 0 0 12 0C9.11 0 6.6 1.64 5.35 4.04A5.994 5.994 0 0 0 0 10c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#3B82F6"/></svg>
            iCloud ✦
          </button>
        </div>
      </div>
      {showCloudModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowCloudModal(null)}>
          <div style={{ background: '#111318', border: '1px solid #1F2937', borderRadius: 16, padding: 28, maxWidth: 380, width: '90%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{showCloudModal === 'google' ? '📸' : '☁️'}</div>
            <h3 style={{ color: '#F9FAFB', fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>{showCloudModal === 'google' ? 'Google Photos' : 'iCloud Photos'}</h3>
            <p style={{ color: '#9CA3AF', fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>Connect your {showCloudModal === 'google' ? 'Google Photos' : 'iCloud'} to import photos directly into your frame. Available in the next update — for now, upload photos directly using the + Add button above.</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', background: '#1A1B23', borderRadius: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>Notify me when available</span>
              <div style={{ width: 36, height: 20, borderRadius: 10, background: '#0D9488', position: 'relative', cursor: 'pointer' }}><div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, right: 2 }} /></div>
            </div>
            <button onClick={() => setShowCloudModal(null)} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#0D9488', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%' }}>Got it</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AI Morning Summary ─────────────────────────────────────────────────────

function MorningAIPanel() {
  const [open, setOpen] = useState(true)
  const now = new Date()
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const dayLabel = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`

  return (
    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #003DA5' }}>
      <button className="flex w-full items-center justify-between px-5 py-4" style={{ backgroundColor: 'rgba(0,61,165,0.08)', borderBottom: open ? '1px solid rgba(0,61,165,0.3)' : undefined }} onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: '#003DA5' }} />
          <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Morning Summary</span>
          <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'rgba(0,61,165,0.2)', color: '#F1C40F' }}>{dayLabel}</span>
        </div>
        {open ? <ChevronUp size={14} style={{ color: '#003DA5' }} /> : <ChevronDown size={14} style={{ color: '#003DA5' }} />}
      </button>
      {open && (
        <div className="flex flex-col gap-3 p-5 overflow-y-auto" style={{ backgroundColor: '#0f0e17', maxHeight: '12rem' }}>
          {MORNING_HIGHLIGHTS_FOOTBALL.map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(0,61,165,0.2)', color: '#F1C40F' }}>{i + 1}</span>
              <p className="text-xs leading-relaxed" style={{ color: '#FCA5A5' }}>{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl p-3 flex flex-col gap-2" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minHeight: 90 }}>
      <span className="text-xs truncate" style={{ color: '#9CA3AF' }}>{label}</span>
      <div className="flex items-center justify-between w-full">
        <div className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>{value}</div>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}1a` }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

// ─── Status Badge ───────────────────────────────────────────────────────────

function FitnessBadge({ status }: { status: FitnessStatus }) {
  const cfg: Record<FitnessStatus, { label: string; color: string; bg: string }> = {
    fit: { label: 'FIT', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
    injured: { label: 'INJURED', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
    suspended: { label: 'SUSPENDED', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    modified: { label: 'MODIFIED', color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
    doubt: { label: 'DOUBT', color: '#F97316', bg: 'rgba(249,115,22,0.12)' },
  }
  const c = cfg[status]
  return <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold" style={{ color: c.color, backgroundColor: c.bg }}>{c.label}</span>
}

// ─── Workflow Activity Feed ─────────────────────────────────────────────────

const WORKFLOW_FEED = [
  { name: 'Pre-match analysis — Riverside United', status: 'COMPLETE' as const, ts: 'Just now' },
  { name: 'Injury assessment — Santos', status: 'RUNNING' as const, ts: '3 min ago' },
  { name: 'Transfer negotiation — Diallo', status: 'ACTION' as const, ts: '15 min ago' },
  { name: 'Training load report — weekly', status: 'COMPLETE' as const, ts: '1 hr ago' },
  { name: 'Academy performance review', status: 'COMPLETE' as const, ts: '2 hr ago' },
  { name: 'Press conference prep — AI brief', status: 'COMPLETE' as const, ts: '3 hr ago' },
  { name: 'Opposition scouting — Northgate City', status: 'RUNNING' as const, ts: '4 hr ago' },
  { name: 'Matchday operations checklist', status: 'ACTION' as const, ts: 'Yesterday' },
]

type WFStatus = 'COMPLETE' | 'RUNNING' | 'ACTION'

function WFStatusBadge({ status }: { status: WFStatus }) {
  const cfg = {
    COMPLETE: { label: 'COMPLETE', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', Icon: CheckCircle2 },
    RUNNING: { label: 'RUNNING', color: '#003DA5', bg: 'rgba(0,61,165,0.12)', Icon: Loader2 },
    ACTION: { label: 'ACTION', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', Icon: AlertCircle },
  }[status]
  return <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold" style={{ color: cfg.color, backgroundColor: cfg.bg }}><cfg.Icon size={11} /> {cfg.label}</span>
}

// ─── Tab Content Placeholder ────────────────────────────────────────────────

function QWItem({ priority, title, desc, action }: { priority: '🔴' | '🟡' | '🟢'; title: string; desc: string; action: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <span className="text-lg mt-0.5">{priority}</span>
      <div className="flex-1 min-w-0"><p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{title}</p><p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{desc}</p></div>
      <button className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}>{action}</button>
    </div>
  )
}

function FifaCard({ p, size = 'pitch', selected, onClick }: { p: { id: string; name: string; pos: string; initials: string; overall: number; color: string; stats?: Record<string, number> }; size?: 'pitch' | 'bench'; selected?: boolean; onClick?: () => void }) {
  const w = size === 'pitch' ? 64 : 56
  const h = size === 'pitch' ? 80 : 70
  const ratingColor = p.overall >= 80 ? '#F59E0B' : p.overall >= 70 ? '#F9FAFB' : '#6B7280'
  const topStats = p.stats ? Object.entries(p.stats).slice(0, 3) : []
  return (
    <div onClick={onClick} style={{ width: w, height: h, background: 'linear-gradient(135deg, #0D0D1A 0%, #1a1a2e 100%)', border: selected ? '2px solid #0D9488' : '1px solid rgba(255,255,255,0.1)', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3px 2px', cursor: onClick ? 'pointer' : 'default', boxShadow: selected ? '0 0 12px #0D9488' : 'none', opacity: size === 'bench' ? 0.7 : 1, transition: 'box-shadow 0.2s, border 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 3px' }}>
        <span style={{ fontSize: size === 'pitch' ? 13 : 11, fontWeight: 900, color: ratingColor, lineHeight: 1 }}>{p.overall}</span>
        <span style={{ fontSize: 7, fontWeight: 700, color: p.color }}>{p.pos}</span>
      </div>
      <div style={{ width: size === 'pitch' ? 28 : 24, height: size === 'pitch' ? 28 : 24, borderRadius: '50%', backgroundColor: `${p.color}30`, border: `1.5px solid ${p.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size === 'pitch' ? 9 : 8, fontWeight: 800, color: p.color, margin: '2px 0', overflow: 'hidden' }}>
        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.name)}&backgroundColor=${p.color.replace('#', '')}`} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.textContent = p.initials }} />
      </div>
      <span style={{ fontSize: size === 'pitch' ? 8 : 7, fontWeight: 700, color: '#F9FAFB', textAlign: 'center', lineHeight: 1.1, maxWidth: w - 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name.split(' ').pop()}</span>
      <div style={{ display: 'flex', gap: 2, marginTop: 'auto' }}>
        {topStats.map(([k, v]) => (<div key={k} style={{ textAlign: 'center' }}><div style={{ fontSize: 8, fontWeight: 700, color: '#F9FAFB' }}>{v}</div><div style={{ fontSize: 6, color: '#6B7280' }}>{k}</div></div>))}
      </div>
    </div>
  )
}

function TeamInfoTab() {
  const PLAYERS = [
    { id: 'gk', name: 'Sam Fletcher', pos: 'GK', initials: 'SF', overall: 79, color: '#F59E0B', stats: { PAC: 55, SHO: 28, PAS: 65, DRI: 48, DEF: 82, PHY: 83 } },
    { id: 'rb', name: 'Ryan Cole', pos: 'RB', initials: 'RC', overall: 81, color: '#3B82F6', stats: { PAC: 82, SHO: 55, PAS: 74, DRI: 78, DEF: 81, PHY: 80 } },
    { id: 'cb1', name: 'Kyle Brennan', pos: 'CB', initials: 'KB', overall: 82, color: '#3B82F6', stats: { PAC: 72, SHO: 42, PAS: 68, DRI: 61, DEF: 89, PHY: 86 } },
    { id: 'cb2', name: 'Nate Ward', pos: 'CB', initials: 'NW', overall: 78, color: '#3B82F6', stats: { PAC: 68, SHO: 35, PAS: 62, DRI: 55, DEF: 85, PHY: 84 } },
    { id: 'lb', name: 'Tyler Shaw', pos: 'LB', initials: 'TS', overall: 76, color: '#3B82F6', stats: { PAC: 84, SHO: 48, PAS: 70, DRI: 72, DEF: 78, PHY: 74 } },
    { id: 'cdm1', name: 'Jamie Torres', pos: 'CM', initials: 'JT', overall: 84, color: '#22C55E', stats: { PAC: 78, SHO: 71, PAS: 89, DRI: 82, DEF: 68, PHY: 74 } },
    { id: 'cdm2', name: 'Ben Hardy', pos: 'CM', initials: 'BH', overall: 77, color: '#22C55E', stats: { PAC: 72, SHO: 62, PAS: 80, DRI: 74, DEF: 72, PHY: 78 } },
    { id: 'cam', name: 'Kai Ellis', pos: 'CAM', initials: 'KE', overall: 83, color: '#22C55E', stats: { PAC: 80, SHO: 78, PAS: 86, DRI: 88, DEF: 42, PHY: 68 } },
    { id: 'lm', name: 'Dele Adeyemi', pos: 'LW', initials: 'DA', overall: 85, color: '#EF4444', stats: { PAC: 93, SHO: 79, PAS: 81, DRI: 90, DEF: 41, PHY: 72 } },
    { id: 'rm', name: 'Zak Osei', pos: 'RW', initials: 'ZO', overall: 80, color: '#EF4444', stats: { PAC: 88, SHO: 74, PAS: 72, DRI: 84, DEF: 38, PHY: 70 } },
    { id: 'st', name: 'Liam Cross', pos: 'ST', initials: 'LC', overall: 86, color: '#EF4444', stats: { PAC: 88, SHO: 91, PAS: 67, DRI: 85, DEF: 32, PHY: 78 } },
  ]
  const COACHES = [
    { name: 'Johnnie Jackson', role: 'Head Coach', initials: 'MR', color: '#C8960C' },
    { name: 'Danny Hughes', role: 'Asst Coach', initials: 'DH', color: '#0D9488' },
    { name: 'Priya Nair', role: 'Head Medical', initials: 'PN', color: '#EC4899' },
  ]
  type Formation = '4-2-3-1' | '4-3-3' | '3-5-2' | '4-4-2'
  const FORMATIONS: Record<Formation, Record<string, { top: string; left: string }>> = {
    '4-2-3-1': { gk: { top: '84%', left: '50%' }, rb: { top: '68%', left: '88%' }, cb1: { top: '68%', left: '35%' }, cb2: { top: '68%', left: '65%' }, lb: { top: '68%', left: '12%' }, cdm1: { top: '52%', left: '38%' }, cdm2: { top: '52%', left: '62%' }, cam: { top: '32%', left: '50%' }, rm: { top: '32%', left: '86%' }, lm: { top: '32%', left: '14%' }, st: { top: '14%', left: '50%' } },
    '4-3-3': { gk: { top: '84%', left: '50%' }, rb: { top: '68%', left: '90%' }, cb1: { top: '68%', left: '35%' }, cb2: { top: '68%', left: '65%' }, lb: { top: '68%', left: '10%' }, cdm1: { top: '48%', left: '25%' }, cdm2: { top: '48%', left: '50%' }, cam: { top: '48%', left: '75%' }, rm: { top: '18%', left: '88%' }, lm: { top: '18%', left: '12%' }, st: { top: '14%', left: '50%' } },
    '3-5-2': { gk: { top: '84%', left: '50%' }, rb: { top: '68%', left: '75%' }, cb1: { top: '68%', left: '25%' }, cb2: { top: '68%', left: '50%' }, lb: { top: '48%', left: '10%' }, cdm1: { top: '48%', left: '30%' }, cdm2: { top: '48%', left: '50%' }, cam: { top: '48%', left: '70%' }, rm: { top: '48%', left: '90%' }, lm: { top: '18%', left: '35%' }, st: { top: '18%', left: '65%' } },
    '4-4-2': { gk: { top: '84%', left: '50%' }, rb: { top: '68%', left: '90%' }, cb1: { top: '68%', left: '35%' }, cb2: { top: '68%', left: '65%' }, lb: { top: '68%', left: '10%' }, cdm1: { top: '46%', left: '10%' }, cdm2: { top: '46%', left: '35%' }, cam: { top: '46%', left: '65%' }, rm: { top: '46%', left: '90%' }, lm: { top: '18%', left: '35%' }, st: { top: '18%', left: '65%' } },
  }
  const SUBS = [
    { id: 'gk2', name: 'Aiden Park', pos: 'GK', initials: 'AP', overall: 74, color: '#F59E0B', stats: { PAC: 52, SHO: 24, PAS: 60, DRI: 44, DEF: 78, PHY: 80 } },
    { id: 'cb3', name: 'Jake Morris', pos: 'CB', initials: 'JM', overall: 75, color: '#3B82F6', stats: { PAC: 65, SHO: 30, PAS: 58, DRI: 52, DEF: 82, PHY: 81 } },
    { id: 'rb2', name: 'Leo Grant', pos: 'RB', initials: 'LG', overall: 73, color: '#3B82F6', stats: { PAC: 78, SHO: 42, PAS: 64, DRI: 68, DEF: 74, PHY: 72 } },
    { id: 'cm3', name: 'Finn Carey', pos: 'CM', initials: 'FC', overall: 76, color: '#22C55E', stats: { PAC: 70, SHO: 58, PAS: 78, DRI: 72, DEF: 66, PHY: 74 } },
    { id: 'lw2', name: 'Omar Diallo', pos: 'LW', initials: 'OD', overall: 78, color: '#EF4444', stats: { PAC: 90, SHO: 72, PAS: 68, DRI: 82, DEF: 34, PHY: 68 } },
    { id: 'st2', name: 'Rafe Adeyemi', pos: 'ST', initials: 'RA', overall: 77, color: '#EF4444', stats: { PAC: 84, SHO: 80, PAS: 62, DRI: 76, DEF: 28, PHY: 74 } },
  ]
  const [starters, setStarters] = useState(PLAYERS)
  const [bench, setBench] = useState(SUBS)
  const [formation, setFormation] = useState<Formation>('4-2-3-1')
  const [viewMode, setViewMode] = useState<'pitch' | 'grid'>('pitch')
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [swapToast, setSwapToast] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  useEffect(() => setMounted(true), [])

  function handlePitchClick(playerId: string) {
    if (selectedPlayer === playerId) { setSelectedPlayer(null); return }
    if (selectedPlayer) {
      // selectedPlayer is on pitch, playerId is also on pitch — just switch selection
      setSelectedPlayer(playerId)
    } else {
      setSelectedPlayer(playerId)
    }
  }
  function handleBenchClick(benchPlayerId: string) {
    if (!selectedPlayer) return
    const pitchIdx = starters.findIndex(p => p.id === selectedPlayer)
    const benchIdx = bench.findIndex(p => p.id === benchPlayerId)
    if (pitchIdx < 0 || benchIdx < 0) { setSelectedPlayer(null); return }
    const newStarters = [...starters]; const newBench = [...bench]
    const temp = newStarters[pitchIdx]
    newStarters[pitchIdx] = { ...newBench[benchIdx], id: temp.id }
    newBench[benchIdx] = { ...temp, id: bench[benchIdx].id }
    setStarters(newStarters); setBench(newBench)
    setSelectedPlayer(null); setSwapToast(true)
    setTimeout(() => setSwapToast(false), 1500)
  }

  const positions = FORMATIONS[formation]
  const posColor: Record<string, string> = { GK: '#F59E0B', CB: '#3B82F6', RB: '#3B82F6', LB: '#3B82F6', CM: '#22C55E', CAM: '#22C55E', LW: '#EF4444', RW: '#EF4444', ST: '#EF4444' }

  if (!mounted) return null

  const GRID_CARDS = [
    { name: 'Johnnie Jackson', role: 'Head Coach', dept: 'Coaching', overall: 87, initials: 'MR', color: '#C8960C', stats: { PAC: 72, SHO: 45, PAS: 88, DRI: 79, DEF: 65, PHY: 71 }, id: 'OFC-001', date: '01/07/2025' },
    { name: 'Danny Hughes', role: 'Assistant Coach', dept: 'Coaching', overall: 79, initials: 'DH', color: '#0D9488', stats: { PAC: 68, SHO: 52, PAS: 81, DRI: 74, DEF: 71, PHY: 69 }, id: 'OFC-002', date: '01/07/2025' },
    { name: 'Kyle Brennan', role: 'Captain / CB', dept: 'First Team', overall: 82, initials: 'KB', color: '#1D4ED8', stats: { PAC: 72, SHO: 42, PAS: 68, DRI: 61, DEF: 89, PHY: 86 }, id: 'OFC-003', date: '01/07/2025' },
    { name: 'Sam Fletcher', role: 'Goalkeeper', dept: 'First Team', overall: 79, initials: 'SF', color: '#15803D', stats: { PAC: 55, SHO: 28, PAS: 65, DRI: 48, DEF: 82, PHY: 83 }, id: 'OFC-004', date: '01/07/2025' },
    { name: 'Dele Adeyemi', role: 'Left Wing', dept: 'First Team', overall: 85, initials: 'DA', color: '#7C3AED', stats: { PAC: 93, SHO: 79, PAS: 81, DRI: 90, DEF: 41, PHY: 72 }, id: 'OFC-005', date: '01/07/2025' },
    { name: 'Ryan Cole', role: 'Right Back', dept: 'First Team', overall: 81, initials: 'RC', color: '#B91C1C', stats: { PAC: 82, SHO: 55, PAS: 74, DRI: 78, DEF: 81, PHY: 80 }, id: 'OFC-006', date: '01/07/2025' },
    { name: 'Jamie Torres', role: 'Central Midfielder', dept: 'First Team', overall: 84, initials: 'JT', color: '#0EA5E9', stats: { PAC: 78, SHO: 71, PAS: 89, DRI: 82, DEF: 68, PHY: 74 }, id: 'OFC-007', date: '01/07/2025' },
    { name: 'Liam Cross', role: 'Striker', dept: 'First Team', overall: 86, initials: 'LC', color: '#EA580C', stats: { PAC: 88, SHO: 91, PAS: 67, DRI: 85, DEF: 32, PHY: 78 }, id: 'OFC-008', date: '01/07/2025' },
    { name: 'Priya Nair', role: 'Head of Medical', dept: 'Medical', overall: 91, initials: 'PN', color: '#EC4899', stats: { PAC: 61, SHO: 44, PAS: 82, DRI: 58, DEF: 77, PHY: 69 }, id: 'OFC-009', date: '01/07/2025' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black" style={{ color: '#F9FAFB' }}>Team Info</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('pitch')} className="p-2 rounded-lg" style={{ backgroundColor: viewMode === 'pitch' ? '#003DA5' : '#111318', color: viewMode === 'pitch' ? '#fff' : '#6B7280', border: '1px solid #1F2937' }} title="Pitch View">⚽</button>
          <button onClick={() => setViewMode('grid')} className="p-2 rounded-lg" style={{ backgroundColor: viewMode === 'grid' ? '#003DA5' : '#111318', color: viewMode === 'grid' ? '#fff' : '#6B7280', border: '1px solid #1F2937' }} title="Grid View">🃏</button>
        </div>
      </div>

      {viewMode === 'pitch' ? (
        <>
          {/* Formation + Toolbar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-2">
              {(['4-2-3-1', '4-3-3', '3-5-2', '4-4-2'] as Formation[]).map(f => (
                <button key={f} onClick={() => { setFormation(f); setSelectedPlayer(null) }} className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ backgroundColor: formation === f ? '#003DA5' : '#111318', color: formation === f ? '#fff' : '#6B7280', border: `1px solid ${formation === f ? '#003DA5' : '#1F2937'}` }}>{f}</button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setFullscreen(true)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs" style={{ backgroundColor: '#111318', color: '#6B7280', border: '1px solid #1F2937' }}><Maximize2 size={12} /> Fullscreen</button>
              <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs" style={{ backgroundColor: '#111318', color: '#6B7280', border: '1px solid #1F2937' }}><Printer size={12} /> Print</button>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000) }} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs" style={{ backgroundColor: '#111318', color: copiedLink ? '#22C55E' : '#6B7280', border: '1px solid #1F2937' }}><Share2 size={12} /> {copiedLink ? 'Copied!' : 'Share'}</button>
            </div>
          </div>

          {/* Pitch + Squad Panel — 2 columns */}
          <div className="flex gap-0 rounded-2xl overflow-hidden" style={{ border: '1px solid #1F2937', height: 500 }}>
            {/* Left: Pitch (50%) */}
            <div style={{ width: '50%', position: 'relative', background: 'linear-gradient(180deg, #1a6b3c 0%, #1f7a44 25%, #1a6b3c 50%, #1f7a44 75%, #1a6b3c 100%)' }}>
              <svg viewBox="0 0 68 100" className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
                <rect x="1" y="1" width="66" height="98" fill="none" stroke="white" strokeWidth="0.5" />
                <line x1="1" y1="50" x2="67" y2="50" stroke="white" strokeWidth="0.3" />
                <circle cx="34" cy="50" r="9" fill="none" stroke="white" strokeWidth="0.3" />
                <rect x="14" y="1" width="40" height="16" fill="none" stroke="white" strokeWidth="0.3" />
                <rect x="22" y="1" width="24" height="6" fill="none" stroke="white" strokeWidth="0.3" />
                <rect x="14" y="83" width="40" height="16" fill="none" stroke="white" strokeWidth="0.3" />
                <rect x="22" y="93" width="24" height="6" fill="none" stroke="white" strokeWidth="0.3" />
              </svg>
              {starters.map(p => { const pos = positions[p.id]; if (!pos) return null; return (<div key={p.id} style={{ position: 'absolute', top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)', transition: 'top 0.5s ease, left 0.5s ease', zIndex: selectedPlayer === p.id ? 20 : 10 }}><FifaCard p={p} size="pitch" selected={selectedPlayer === p.id} onClick={() => handlePitchClick(p.id)} /></div>) })}
            </div>

            {/* Right: Squad Panel (50%) */}
            <div style={{ width: '50%', backgroundColor: '#0a0d13', borderLeft: '1px solid #1F2937', overflowY: 'auto' }}>
              <div className="px-3 py-2.5" style={{ borderBottom: '1px solid #1F2937' }}>
                <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>Squad ({starters.length + bench.length})</p>
                <p className="text-[10px]" style={{ color: '#6B7280' }}>{starters.length} starting · {bench.length} bench</p>
              </div>
              {[
                { label: '🧤 GOALKEEPERS', positions: ['GK'] },
                { label: '⬛ DEFENDERS', positions: ['RB', 'CB', 'LB'] },
                { label: '🟦 MIDFIELDERS', positions: ['CM', 'DM', 'CAM', 'AM'] },
                { label: '🔴 ATTACKERS', positions: ['RW', 'LW', 'ST', 'CF'] },
              ].map(group => {
                const players = [...starters, ...bench].filter(p => group.positions.includes(p.pos))
                if (!players.length) return null
                const starterIds = new Set(starters.map(p => p.id))
                return (
                  <div key={group.label}>
                    <div className="px-3 pt-3 pb-1 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#4B5563' }}>{group.label}</span>
                      <div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} />
                    </div>
                    {players.map(p => {
                      const isStarting = starterIds.has(p.id)
                      const c = posColor[p.pos] || '#6B7280'
                      return (
                        <div key={p.id} className="flex items-center gap-2.5 px-3 py-1.5">
                          <div className="flex items-center justify-center rounded-full text-[9px] font-bold shrink-0" style={{ width: 32, height: 32, backgroundColor: `${c}25`, color: c }}>{p.initials}</div>
                          <div className="flex-1 min-w-0 flex items-center gap-1.5">
                            <span className="text-xs truncate" style={{ color: isStarting ? '#F9FAFB' : '#6B7280' }}>{p.name}</span>
                            <span className="text-[8px] font-bold px-1 rounded shrink-0" style={{ backgroundColor: `${c}20`, color: c }}>{p.pos}</span>
                          </div>
                          <span className="text-[11px] font-black w-6 text-center shrink-0" style={{ color: c }}>{p.overall}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: isStarting ? 'rgba(13,148,136,0.12)' : 'rgba(255,255,255,0.03)', color: isStarting ? '#0D9488' : '#4B5563' }}>{isStarting ? 'Starting' : 'Sub'}</span>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dugout */}
          <div className="rounded-xl p-3 flex items-center gap-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4B5563' }}>Dugout</span>
            {COACHES.map(c => (<div key={c.name} className="flex items-center gap-2"><div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: c.color + '25', color: c.color, border: '1px solid ' + c.color + '50' }}>{c.initials}</div><div><p className="text-[10px] font-bold" style={{ color: '#F9FAFB' }}>{c.name}</p><p className="text-[8px]" style={{ color: '#6B7280' }}>{c.role}</p></div></div>))}
          </div>

          {/* Bench Cards */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>BENCH &amp; SQUAD</p>
            <div className="flex flex-wrap gap-2">
              {bench.map(p => (<FifaCard key={p.id} p={{ ...p, stats: { PAC: 70 + (p.overall % 10), SHO: 60 + (p.overall % 12), PAS: 65 + (p.overall % 8) } }} size="bench" selected={false} onClick={() => handleBenchClick(p.id)} />))}
            </div>
          </div>

          {/* Swap toast */}
          {swapToast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0D9488', color: '#fff', padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 9999 }}>Swapped!</div>}
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {GRID_CARDS.map(card => (
            <div key={card.id} style={{ background: `linear-gradient(135deg, ${card.color}22 0%, #0A0B10 60%)`, border: `1px solid ${card.color}44`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 320 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><div><div style={{ fontSize: 32, fontWeight: 900, color: card.color, lineHeight: 1 }}>{card.overall}</div><div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, letterSpacing: '0.1em' }}>OVERALL</div></div><div style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 700, background: `${card.color}33`, color: card.color, border: `1px solid ${card.color}55` }}>{card.dept}</div></div>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}><div style={{ width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${card.color}44 0%, ${card.color}11 70%)`, border: `2px solid ${card.color}`, boxShadow: `0 0 20px ${card.color}44, 0 0 40px ${card.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: card.color }}>{card.initials}</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB' }}>{card.name}</div><div style={{ fontSize: 13, color: card.color, fontWeight: 500, marginTop: 2 }}>{card.role}</div></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, padding: '8px 0', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>{Object.entries(card.stats).map(([key, val]) => (<div key={key} style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 700, color: val >= 85 ? '#22C55E' : val >= 70 ? '#F59E0B' : '#EF4444' }}>{val}</div><div style={{ fontSize: 9, color: '#6B7280', fontWeight: 600, letterSpacing: '0.05em' }}>{key}</div></div>))}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#4B5563' }}><span>{card.id}</span><span>{card.date}</span></div>
              <div style={{ display: 'flex', gap: 8 }}><button style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid #1F2937', background: 'transparent', color: '#9CA3AF', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Profile</button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabContent({ tab }: { tab: OverviewTab }) {
  const [activeStaffTab, setActiveStaffTab] = useState<'today'|'orgchart'|'clubinfo'|'teaminfo'>('today')
  if (tab === 'today') return null // handled separately

  if (tab === 'quick-wins') return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2" style={{ color: '#F9FAFB' }}>⚡ Quick Wins</h2>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>High impact, low effort — sorted by priority.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-4" style={{ backgroundColor: 'rgba(0,61,165,0.08)', border: '1px solid rgba(0,61,165,0.2)' }}>
        <span>🔗</span>
        <span className="text-sm" style={{ color: '#FCA5A5' }}>These suggestions are AI-generated based on your role. Connect your club data in Settings for personalised insights.</span>
      </div>
      <div className="space-y-3">
        {([
          { id: 'fqw1', title: 'Kyle Brennan fitness check overdue', description: 'Last GPS session flagged fatigue risk. Clear for Saturday?', impact: 'high' as const, effort: '2min', category: 'Squad', action: 'Check fitness', source: 'GPS' },
          { id: 'fqw2', title: 'Opposition report not reviewed', description: 'Riverside United match in 3 days. Scout report ready.', impact: 'high' as const, effort: '5min', category: 'Tactics', action: 'View report', source: 'Scouting' },
          { id: 'fqw3', title: 'Agent contact overdue — Diallo deal', description: 'No contact logged in 4 days. Window closes in 11 days.', impact: 'medium' as const, effort: '5min', category: 'Transfers', action: 'Log contact', source: 'CRM' },
          { id: 'fqw4', title: 'Press conference prep outstanding', description: 'Match day press conf tomorrow at 10am. No notes prepared.', impact: 'medium' as const, effort: '10min', category: 'Media', action: 'Prepare notes', source: 'Calendar' },
          { id: 'fqw5', title: '3 player expense claims pending', description: 'Awaiting manager approval for over 72 hours.', impact: 'medium' as const, effort: '5min', category: 'Finance', action: 'Approve', source: 'Finance' },
        ]).map(win => {
          const ic = win.impact === 'high' ? { bg: 'rgba(239,68,68,0.12)', color: '#F87171' } : { bg: 'rgba(251,191,36,0.12)', color: '#FBBF24' }
          return (
            <div key={win.id} className="rounded-2xl p-5 transition-all" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: ic.bg, color: ic.color }}>{win.impact.toUpperCase()} IMPACT</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,61,165,0.12)', color: '#F1C40F' }}>⏱ {win.effort}</span>
                    <span className="text-xs" style={{ color: '#6B7280' }}>{win.category}</span>
                  </div>
                  <h3 className="font-bold mb-1" style={{ color: '#F9FAFB' }}>{win.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{win.description}</p>
                  <p className="text-xs mt-2" style={{ color: '#374151' }}>Source: {win.source}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{ backgroundColor: '#003DA5' }}>{win.action} →</button>
                  <button className="px-4 py-2 text-xs rounded-xl transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>Mark done</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  if (tab === 'match-week') return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2" style={{ color: '#F9FAFB' }}>📅 Match Week</h2>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Your match preparation checklist — everything that needs doing.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-4" style={{ backgroundColor: 'rgba(0,61,165,0.08)', border: '1px solid rgba(0,61,165,0.2)' }}>
        <span>🔗</span>
        <span className="text-sm" style={{ color: '#FCA5A5' }}>These suggestions are AI-generated based on your role. Connect your club data in Settings for personalised insights.</span>
      </div>
      <div className="space-y-3">
        {([
          { id: 'fmw1', title: 'Finalise starting XI for Saturday', description: 'Formation set, but 2 positions undecided. Confirm by Thursday.', impact: 'high' as const, effort: '15min', category: 'Tactics', action: 'Set lineup', source: 'Squad Planner' },
          { id: 'fmw2', title: 'Pre-match fitness assessment', description: 'Four players require sign-off from physio before training today.', impact: 'high' as const, effort: '10min', category: 'Medical', action: 'View assessments', source: 'Medical' },
          { id: 'fmw3', title: 'Post training video clips ready', description: "Three clips uploaded from today's session. Review before posting.", impact: 'medium' as const, effort: '5min', category: 'Media', action: 'Review clips', source: 'Social Media' },
          { id: 'fmw4', title: 'Opposition set piece analysis', description: 'Riverside United scored 3 set piece goals last 5 games.', impact: 'medium' as const, effort: '30min', category: 'Tactics', action: 'View analysis', source: 'Analytics' },
          { id: 'fmw5', title: 'Under-18 match report overdue', description: "Tuesday fixture. Coach hasn't submitted report yet.", impact: 'medium' as const, effort: '5min', category: 'Academy', action: 'Chase report', source: 'Academy' },
        ]).map(task => {
          const ic = task.impact === 'high' ? { bg: 'rgba(239,68,68,0.12)', color: '#F87171' } : { bg: 'rgba(251,191,36,0.12)', color: '#FBBF24' }
          return (
            <div key={task.id} className="rounded-2xl p-5 transition-all" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: ic.bg, color: ic.color }}>{task.impact.toUpperCase()} IMPACT</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,61,165,0.12)', color: '#F1C40F' }}>⏱ {task.effort}</span>
                    <span className="text-xs" style={{ color: '#6B7280' }}>{task.category}</span>
                  </div>
                  <h3 className="font-bold mb-1" style={{ color: '#F9FAFB' }}>{task.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{task.description}</p>
                  <p className="text-xs mt-2" style={{ color: '#374151' }}>Source: {task.source}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{ backgroundColor: '#003DA5' }}>{task.action} →</button>
                  <button className="px-4 py-2 text-xs rounded-xl transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>Mark done</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  if (tab === 'insights') return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {[{ l: 'League Position', v: '8th', c: '#F1C40F' }, { l: 'Squad Value', v: '£34.2m', c: '#22C55E' }, { l: 'Transfer Budget', v: '£3.2m', c: '#003DA5' }, { l: 'Injury Rate', v: '12%', c: '#F59E0B' }, { l: 'Form (Last 5)', v: 'WWDLW', c: '#22C55E' }].map(s => (
          <div key={s.l} className="rounded-xl p-4 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-xs" style={{ color: '#6B7280' }}>{s.l}</p>
            <p className="text-xl font-black" style={{ color: s.c }}>{s.v}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[{ emoji: '🟢', dept: 'Medical', status: '21 fit — healthy', color: '#22C55E' }, { emoji: '🟡', dept: 'Transfers', status: '2 targets, window 11 days', color: '#F59E0B' }, { emoji: '🔴', dept: 'Contracts', status: '3 expiring, no offers', color: '#EF4444' }, { emoji: '🟢', dept: 'Academy', status: 'EPPP 94% compliant', color: '#22C55E' }].map(d => (
          <div key={d.dept} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: `1px solid ${d.color}33` }}>
            <div className="flex items-center gap-2 mb-1"><span>{d.emoji}</span><p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{d.dept}</p></div>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{d.status}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Key Metrics</p>
        <div className="grid grid-cols-2 gap-2">{[{ l: 'Top Scorer', v: 'Marcus Webb — 12 goals' }, { l: 'Clean Sheet Rate', v: '39% (7/18)' }, { l: 'Wage Budget Used', v: '91% (£187k/wk)' }, { l: 'Academy Ready', v: '2 players' }, { l: 'Fan NPS', v: '72/100' }, { l: 'Position Trend', v: '11→10→9→8→8' }].map(m => (
          <div key={m.l} className="flex justify-between py-1.5 px-2 rounded" style={{ backgroundColor: '#0A0B10' }}><span className="text-xs" style={{ color: '#9CA3AF' }}>{m.l}</span><span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{m.v}</span></div>
        ))}</div>
      </div>
    </div>
  )

  if (tab === 'dont-miss') return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2" style={{ color: '#F9FAFB' }}>🔴 Don&apos;t Miss</h2>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Urgent deadlines and compliance actions — these cannot wait.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-4" style={{ backgroundColor: 'rgba(0,61,165,0.08)', border: '1px solid rgba(0,61,165,0.2)' }}>
        <span>🔗</span>
        <span className="text-sm" style={{ color: '#FCA5A5' }}>These suggestions are AI-generated based on your role. Connect your club data in Settings for personalised insights.</span>
      </div>
      <div className="space-y-3">
        {([
          { id: 'fdm1', title: 'Diallo negotiation stalled — counter offer needed', description: 'Transfer window closes in 11 days. Rivals have tabled £140k. Our last offer was £120k.', effort: '15min', category: 'Transfers', action: 'Send offer', source: 'CRM' },
          { id: 'fdm2', title: 'Press conference 10am — no prep completed', description: 'Tomorrow morning. Manager expects AI-generated talking points by tonight.', effort: '10min', category: 'Media', action: 'Prepare now', source: 'Calendar' },
          { id: 'fdm3', title: '3 player contracts expiring in 60 days', description: 'No renewal talks started for James, Ward, or Shaw. Free agent risk.', effort: '30min', category: 'Contracts', action: 'Start talks', source: 'HR' },
          { id: 'fdm4', title: 'PSR compliance check — quarterly submission missed', description: 'Deadline was last Friday. Finance team needs to submit immediately.', effort: '10min', category: 'Finance', action: 'Submit now', source: 'Finance' },
        ]).map(item => (
          <div key={item.id} className="rounded-2xl p-5 transition-all" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#F87171' }}>HIGH IMPACT</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,61,165,0.12)', color: '#F1C40F' }}>⏱ {item.effort}</span>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{item.category}</span>
                </div>
                <h3 className="font-bold mb-1" style={{ color: '#F9FAFB' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{item.description}</p>
                <p className="text-xs mt-2" style={{ color: '#374151' }}>Source: {item.source}</p>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{ backgroundColor: '#003DA5' }}>{item.action} →</button>
                <button className="px-4 py-2 text-xs rounded-xl transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>Mark done</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (tab === 'staff') return (
    <div className="space-y-5">
      {/* Sub-tab pills */}
      <div className="flex gap-2">
        {[{ id: 'today' as const, label: '👥 Staff Today' }, { id: 'orgchart' as const, label: '🏢 Org Chart' }, { id: 'teaminfo' as const, label: '🃏 Team Info' }, { id: 'clubinfo' as const, label: '🏟️ Club Info' }].map(t => (
          <button key={t.id} onClick={() => setActiveStaffTab(t.id)} className="px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ backgroundColor: activeStaffTab === t.id ? '#003DA5' : '#111318', color: activeStaffTab === t.id ? '#F9FAFB' : '#6B7280', border: activeStaffTab === t.id ? 'none' : '1px solid #1F2937' }}>{t.label}</button>
        ))}
      </div>

      {/* ═══ STAFF TODAY ═══ */}
      {activeStaffTab === 'today' && <>
        <div><h2 className="text-xl font-black" style={{ color: '#F9FAFB' }}>Staff Today</h2><p className="text-xs" style={{ color: '#6B7280' }}>12 staff · 2 away · 0 alerts</p></div>
        <div className="flex gap-1 flex-wrap">
          {['All', 'In Today', 'Away', 'Coaching', 'Medical', 'Scouting', 'Academy'].map(f => (
            <button key={f} className="px-3 py-1.5 text-xs font-bold rounded-xl" style={{ backgroundColor: f === 'All' ? '#003DA5' : 'rgba(255,255,255,0.05)', color: f === 'All' ? '#fff' : '#6B7280' }}>{f}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[
            { name: 'Johnnie Jackson', role: 'Head Coach', dept: 'Coaching', status: 'In today', location: 'Training ground, 9am-6pm', rel: 'Your manager', color: '#003DA5' },
            { name: 'David Hughes', role: 'Assistant Manager', dept: 'Coaching', status: 'In today', location: 'Training ground', rel: 'Works closely with you', color: '#003DA5' },
            { name: 'Dr Sarah Phillips', role: 'Club Doctor', dept: 'Medical', status: 'In today', location: 'Medical centre, 8am-5pm', rel: 'Medical dept', color: '#2980B9' },
            { name: 'Pete Morrison', role: 'Head Physio', dept: 'Medical', status: 'In today', location: 'Medical centre, 8am-6pm', rel: 'Medical dept', color: '#2980B9' },
            { name: 'Dave Thompson', role: 'Head of Recruitment', dept: 'Scouting', status: 'In today', location: 'Office + scout trip tomorrow', rel: 'Direct report', color: '#F39C12' },
            { name: 'Ian Brooks', role: 'Academy Director', dept: 'Academy', status: 'In today', location: 'Academy building', rel: 'Direct report', color: '#27AE60' },
            { name: 'Steve Walsh', role: 'Chief Scout', dept: 'Scouting', status: 'Away', location: 'Valencia scouting trip', rel: 'Scouting dept', color: '#F39C12' },
            { name: 'Lisa Chen', role: 'Sports Scientist', dept: 'Performance', status: 'Away', location: 'Conference — back Thursday', rel: 'Performance dept', color: '#8E44AD' },
            { name: 'Emma Clark', role: 'Performance Analyst', dept: 'Analytics', status: 'In today', location: 'Analysis suite', rel: 'Analytics dept', color: '#8E44AD' },
            { name: 'Alan Cooper', role: 'GK Coach', dept: 'Coaching', status: 'Away', location: 'UEFA Pro Licence course Mon-Wed', rel: 'Coaching dept', color: '#003DA5' },
            { name: 'Tom Wallace', role: 'Fitness Coach', dept: 'Performance', status: 'In today', location: 'Gym, 7am-4pm', rel: 'Performance dept', color: '#8E44AD' },
            { name: 'Mark Evans', role: 'Scout', dept: 'Scouting', status: 'In today', location: 'Office', rel: 'Scouting dept', color: '#F39C12' },
          ].map(m => (
            <div key={m.name} className="rounded-2xl p-4 cursor-pointer transition-all hover:border-[#374151]" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: `${m.color}20`, color: m.color }}>{m.name.split(' ').map(w => w[0]).join('')}</div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2" style={{ backgroundColor: m.status === 'In today' ? '#22C55E' : '#F59E0B', borderColor: '#111318' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="font-bold text-sm truncate" style={{ color: '#E5E7EB' }}>{m.name}</span></div>
                  <p className="text-xs truncate" style={{ color: '#6B7280' }}>{m.role} · {m.dept}</p>
                  <div className="flex gap-1 mt-1"><span className="text-xs font-medium" style={{ color: m.status === 'In today' ? '#4ADE80' : '#FBBF24' }}>{m.status}</span><span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>{m.rel}</span></div>
                  <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{m.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Upcoming Staff Events</p>
          {['Board meeting Thursday 2pm', 'Staff reviews: Clarke, Morrison — end of month', 'New analyst starts Monday'].map(e => (
            <p key={e} className="text-xs py-1" style={{ color: '#D1D5DB' }}>📅 {e}</p>
          ))}
        </div>
      </>}

      {/* ═══ ORG CHART ═══ */}
      {activeStaffTab === 'orgchart' && (
        <div>
          <h2 className="text-xl font-black mb-6" style={{ color: '#F9FAFB' }}>Club Organisation</h2>
          {/* Chairman */}
          <div className="flex justify-center mb-8">
            <div className="rounded-xl p-4 text-center cursor-pointer w-48" style={{ backgroundColor: '#111318', border: '2px solid #7F8C8D' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2" style={{ backgroundColor: 'rgba(127,140,141,0.2)', color: '#7F8C8D' }}>RB</div>
              <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>The Dons Trust</p>
              <p className="text-[10px]" style={{ color: '#7F8C8D' }}>Chairman</p>
            </div>
          </div>
          <div className="flex justify-center mb-2"><div className="w-px h-8" style={{ backgroundColor: '#374151' }} /></div>
          <div className="flex justify-center mb-2"><div className="h-px" style={{ backgroundColor: '#374151', width: '40%' }} /></div>
          {/* Level 2 */}
          <div className="flex justify-center gap-6 mb-4">
            {[{ name: 'Dave Thompson', role: 'Director of Football', color: '#F39C12' }, { name: 'Johnnie Jackson', role: 'Head Coach', color: '#003DA5' }].map(m => (
              <div key={m.name} className="flex flex-col items-center">
                <div className="w-px h-6 mb-2" style={{ backgroundColor: '#374151' }} />
                <div className="rounded-xl p-3 text-center cursor-pointer w-44" style={{ backgroundColor: '#111318', border: `1px solid ${m.color}` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs mx-auto mb-1" style={{ backgroundColor: `${m.color}20`, color: m.color }}>{m.name.split(' ').map(w => w[0]).join('')}</div>
                  <p className="text-xs font-bold truncate" style={{ color: '#F9FAFB' }}>{m.name}</p>
                  <p className="text-[10px] truncate" style={{ color: m.color }}>{m.role}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Level 3 */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 pl-4">
            {[
              { name: 'David Hughes', role: 'Asst Manager', color: '#003DA5' },
              { name: 'Alan Cooper', role: 'GK Coach', color: '#003DA5' },
              { name: 'Tom Wallace', role: 'Fitness Coach', color: '#8E44AD' },
              { name: 'Lisa Chen', role: 'Sports Scientist', color: '#8E44AD' },
              { name: 'Emma Clark', role: 'Analyst', color: '#8E44AD' },
              { name: 'Dr Sarah Phillips', role: 'Club Doctor', color: '#2980B9' },
              { name: 'Pete Morrison', role: 'Head Physio', color: '#2980B9' },
              { name: 'Steve Walsh', role: 'Chief Scout', color: '#F39C12' },
              { name: 'Ian Brooks', role: 'Academy Director', color: '#27AE60' },
            ].map(m => (
              <div key={m.name} className="rounded-xl p-3 text-center cursor-pointer" style={{ backgroundColor: '#0A0B10', border: `1px solid ${m.color}40` }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] mx-auto mb-1" style={{ backgroundColor: `${m.color}15`, color: m.color }}>{m.name.split(' ').map(w => w[0]).join('')}</div>
                <p className="text-xs font-medium truncate" style={{ color: '#D1D5DB' }}>{m.name}</p>
                <p className="text-[10px] truncate" style={{ color: m.color }}>{m.role}</p>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex gap-3 justify-center mt-6 flex-wrap">
            {[['#003DA5','Coaching'],['#2980B9','Medical'],['#F39C12','Scouting'],['#27AE60','Academy'],['#8E44AD','Performance']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5 text-xs" style={{ color: '#6B7280' }}><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />{l}</div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ CLUB INFO ═══ */}
      {activeStaffTab === 'clubinfo' && (
        <div className="space-y-6">
          <h2 className="text-xl font-black" style={{ color: '#F9FAFB' }}>Club Info</h2>
          {/* Documents */}
          <div>
            <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Club Documents</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: '📋', title: 'Staff Code of Conduct', desc: 'Professional standards and disciplinary procedures' },
                { icon: '🏥', title: 'Medical & Welfare', desc: 'Player medical confidentiality and treatment protocols' },
                { icon: '🔒', title: 'Data & GDPR', desc: 'Player data handling and scouting database compliance' },
                { icon: '💰', title: 'Expenses & Travel', desc: 'Away trips, scouting travel and meal allowances' },
                { icon: '🎓', title: 'Coaching & CPD', desc: 'UEFA licence requirements and CPD policy' },
                { icon: '🤝', title: 'Agent Policy', desc: 'FA regulations on agent contacts and disclosure' },
                { icon: '📱', title: 'Media & Social', desc: 'What staff can post and player privacy rules' },
                { icon: '👔', title: 'Employment', desc: 'Staff contracts, notice periods and exit procedures' },
              ].map(p => (
                <div key={p.title} className="rounded-xl p-4 cursor-pointer transition-all hover:border-[#003DA5]" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <span className="text-2xl block mb-2">{p.icon}</span>
                  <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{p.title}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Club Details + Key Contacts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Club Details</p>
              {[['Club','AFC Wimbledon'],['Founded','2002'],['Nickname','The Dons'],['Colours','Blue & Yellow'],['Stadium','Plough Lane (9,215)'],['Training Ground','Wimbledon Training Ground'],['League','EFL League One'],['EPPP Category','Category 2']].map(([l,v]) => (
                <div key={l} className="flex justify-between py-1"><span className="text-xs" style={{ color: '#6B7280' }}>{l}</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{v}</span></div>
              ))}
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Key Contacts</p>
              {[['Chairman','The Dons Trust'],['Director of Football','Dave Thompson'],['Head Coach','Johnnie Jackson'],['Club Doctor','Dr Sarah Phillips'],['Club Secretary','James Morton'],['Media Manager','Claire Hughes']].map(([r,n]) => (
                <div key={r} className="flex justify-between py-1"><span className="text-xs" style={{ color: '#6B7280' }}>{r}</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{n}</span></div>
              ))}
            </div>
          </div>
          {/* Birthdays */}
          <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Upcoming This Month</p>
            {[['🎂','Pete Morrison','Birthday 3 Apr'],['🎉','David Hughes','5 year club anniversary 8 Apr'],['🎂','Emma Clark','Birthday 22 Apr']].map(([icon,name,event]) => (
              <p key={name} className="text-xs py-1" style={{ color: '#D1D5DB' }}>{icon} {name} — {event}</p>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TEAM INFO — Pitch Lineup + Grid toggle ═══ */}
      {activeStaffTab === 'teaminfo' && <TeamInfoTab />}
    </div>
  )

  return null
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function FootballEmptyState({ dept }: { dept: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl mb-6" style={{ background: 'linear-gradient(135deg, rgba(0,61,165,0.2), rgba(0,61,165,0.05))', border: '1px solid rgba(0,61,165,0.3)' }}>
        <span className="text-4xl">⚽</span>
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>No {dept} data yet</h2>
      <p className="text-sm max-w-md mb-8" style={{ color: '#9CA3AF' }}>Import your club data or explore with demo data to unlock {dept} features.</p>
      <button onClick={() => { localStorage.setItem('lumio_football_demo_active', 'true'); window.location.reload() }}
        className="px-6 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: '#003DA5', color: '#F1C40F' }}>
        ✨ Explore with Demo Data
      </button>
      <p className="text-xs mt-3" style={{ color: '#4B5563' }}>Demo data is pre-filled sample data so you can explore all features</p>
    </div>
  )
}

// ─── Injury Room Card (Today tab) ──────────────────────────────────────────

function InjuryRoomCard() {
  const injured = SQUAD.filter(p => p.fitness === 'injured')
  const suspended = SQUAD.filter(p => p.fitness === 'suspended')
  const [manualInjuries, setManualInjuries] = useState<any[]>([])

  useEffect(() => {
    try { const stored = localStorage.getItem('football_injuries'); if (stored) setManualInjuries(JSON.parse(stored)) } catch { /* */ }
  }, [])

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <span className="text-base">{'\u{1F3E5}'}</span>
        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Injury Room</p>
        {(injured.length > 0 || manualInjuries.length > 0) && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>{injured.length + manualInjuries.length}</span>
        )}
      </div>
      <div className="p-5 space-y-3">
        <div className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{injured.length} player{injured.length !== 1 ? 's' : ''} currently injured</div>
        {injured.map((p, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>INJ</span>
            <div>
              <div className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{p.name}</div>
              <div className="text-xs" style={{ color: '#6B7280' }}>{p.position}</div>
            </div>
          </div>
        ))}
        {manualInjuries.length > 0 && (
          <>
            <div className="text-xs font-semibold mt-2" style={{ color: '#6B7280' }}>Manual entries</div>
            {manualInjuries.map((inj: any) => (
              <div key={inj.id} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>MAN</span>
                <div>
                  <div className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{inj.playerName}</div>
                  <div className="text-xs" style={{ color: '#6B7280' }}>{inj.injuryType}</div>
                </div>
              </div>
            ))}
          </>
        )}
        {suspended.length > 0 && (
          <div className="text-sm" style={{ color: '#F59E0B' }}>{suspended.length} suspended</div>
        )}
        {injured.length === 0 && manualInjuries.length === 0 && suspended.length === 0 && (
          <div className="text-xs" style={{ color: '#22C55E' }}>All players available</div>
        )}
      </div>
    </div>
  )
}

// ─── Overview View ──────────────────────────────────────────────────────────

function OverviewView({ clubName, firstName, onAction, isDemo = false, clubLogo }: { clubName: string; firstName?: string; onAction: (msg: string) => void; isDemo?: boolean; clubLogo?: string | null }) {
  const [tab, setTab] = useState<OverviewTab>('today')

  function handleVoiceCommand(cmd: FootballCommandResult) {
    onAction(cmd.response)
  }

  return (
    <div className="space-y-4">
      <PersonalBanner clubName={clubName} firstName={firstName} onVoiceCommand={handleVoiceCommand} isDemo={isDemo} clubLogo={clubLogo} />
      <TabBar tab={tab} onChange={setTab} />

      {tab === 'today' ? (
        <div className="space-y-4">
          <QuickActionsBar onAction={onAction} />
          <ApiStatusStrip />

          {!isDemo && (
            <>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-5xl mb-4">⚽</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#F9FAFB' }}>Connect your club data to get started</h3>
              <p className="text-sm max-w-md mb-6" style={{ color: '#6B7280' }}>Your daily overview, AI insights and fixtures will appear here once your data is connected. Load demo data to explore.</p>
              <button onClick={() => { localStorage.setItem('lumio_football_demo_active', 'true'); window.location.reload() }} className="px-6 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: '#003DA5', color: '#F1C40F' }}>✨ Explore with Demo Data</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
              <div className="lg:col-span-1 rounded-2xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <h3 className="font-bold text-sm mb-3" style={{ color: '#F9FAFB' }}>📨 Match Inbox</h3>
                <p className="text-xs mb-4" style={{ color: '#6B7280' }}>Connect your communications to see WhatsApp, email and Slack messages in one place.</p>
                <div className="space-y-2">
                  {['WhatsApp Group Chat', 'Club Email', 'Slack Channel'].map(s => (
                    <div key={s} className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>{s}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,61,165,0.12)', color: '#F1C40F' }}>Connect</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-1 rounded-2xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <h3 className="font-bold text-sm mb-3" style={{ color: '#F9FAFB' }}>📅 Fixtures This Week</h3>
                <p className="text-xs mb-4" style={{ color: '#6B7280' }}>Connect your calendar to see training sessions, matches and meetings.</p>
                <div className="flex items-center justify-center py-6">
                  <button className="text-xs font-semibold px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(0,61,165,0.12)', color: '#F1C40F', border: '1px solid rgba(0,61,165,0.3)' }}>Connect Calendar →</button>
                </div>
              </div>
              <div className="lg:col-span-1 flex flex-col gap-4">
                <PhotoFrame />
                <div className="rounded-2xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <h3 className="font-bold text-sm mb-3" style={{ color: '#F9FAFB' }}>🤖 AI Match Summary</h3>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Connect your tools to generate your AI match day summary with squad news, form analysis and tactical suggestions.</p>
                </div>
              </div>
            </div>
            </>
          )}

          {isDemo && <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            <div className="lg:col-span-1 flex flex-col">
              <MorningRoundup />
            </div>
            <div className="lg:col-span-1 flex flex-col">
              <FixturesPanel />
            </div>
            <div className="lg:col-span-1 flex flex-col gap-4">
              <PhotoFrame />
              <MorningAIPanel />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                <StatCard label="Squad Size" value={String(SQUAD.length)} icon={Users} color="#003DA5" />
                <StatCard label="Fit Players" value={String(SQUAD.filter(p => p.fitness === 'fit').length)} icon={CheckCircle2} color="#22C55E" />
                <StatCard label="Transfer Budget" value="£4.2m" icon={DollarSign} color="#F59E0B" />
                <StatCard label="Next Match" value={FIXTURES[0]?.date.split(' ')[1] || '--'} icon={Calendar} color="#3B82F6" />
              </div>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Workflow Activity</p>
                  <span className="text-xs" style={{ color: '#003DA5' }}>Live</span>
                </div>
                {WORKFLOW_FEED.map((run, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: i < WORKFLOW_FEED.length - 1 ? '1px solid #1F2937' : undefined }}>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium" style={{ color: '#F9FAFB' }}>{run.name}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <WFStatusBadge status={run.status} />
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>{run.ts}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Squad Readiness — GPS */}
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #003DA5' }}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937', backgroundColor: 'rgba(0,61,165,0.06)' }}>
                  <div className="flex items-center gap-2">
                    <Activity size={14} style={{ color: '#003DA5' }} />
                    <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Squad Readiness</p>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: '#F1C40F' }}>GPS</span>
                  </div>
                  <span className="text-xs" style={{ color: '#6B7280' }}>ACWR-based</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1.5"><span>🟢</span><span className="text-sm font-bold" style={{ color: '#22C55E' }}>7</span><span className="text-xs" style={{ color: '#6B7280' }}>ready</span></div>
                    <div className="flex items-center gap-1.5"><span>🟡</span><span className="text-sm font-bold" style={{ color: '#F59E0B' }}>3</span><span className="text-xs" style={{ color: '#6B7280' }}>manage</span></div>
                    <div className="flex items-center gap-1.5"><span>🔴</span><span className="text-sm font-bold" style={{ color: '#EF4444' }}>1</span><span className="text-xs" style={{ color: '#6B7280' }}>rest</span></div>
                    <div className="flex items-center gap-1.5"><span>🔵</span><span className="text-sm font-bold" style={{ color: '#3B82F6' }}>1</span><span className="text-xs" style={{ color: '#6B7280' }}>under</span></div>
                  </div>
                  {/* Injury Risk Alert */}
                  <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} style={{ color: '#EF4444' }} />
                      <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>GPS Injury Risk: Sean O&apos;Brien (ACWR 1.58) — rest recommended</p>
                    </div>
                  </div>
                  <p className="text-xs mb-2" style={{ color: '#6B7280' }}>Last session: 31 Mar — Tactical Session — Set Pieces</p>
                  <button className="text-xs font-semibold" style={{ color: '#003DA5' }}>View Performance Dashboard →</button>
                </div>
              </div>

              {/* Injury Room */}
              <InjuryRoomCard />
            </div>
          </div>
          </>}
        </div>
      ) : (
        <TabContent tab={tab} />
      )}
    </div>
  )
}

// ─── Placeholder Department View ────────────────────────────────────────────

function PlaceholderView({ title, subtitle, stats, highlights, actionButtons, onActionClick, children }: {
  title: string
  subtitle: string
  stats: { label: string; value: string; icon: React.ElementType; color: string }[]
  highlights: string[]
  actionButtons?: { label: string; icon: React.ElementType }[]
  onActionClick?: (label: string) => void
  children?: React.ReactNode
}) {
  const [toast, setToast] = useState<string | null>(null)
  function handleAction(label: string) {
    if (onActionClick) { onActionClick(label); return }
    setToast(`${label} — opening workflow...`)
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>{title}</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>{subtitle}</p>
      </div>

      {/* Quick Actions — always at the top */}
      {actionButtons && actionButtons.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {actionButtons.map((a, i) => (
            <button key={i} onClick={() => handleAction(a.label)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
              style={a.label === 'Dept Insights' ? { backgroundColor: 'transparent', border: '1px solid #F1C40F', color: '#F1C40F' } : { backgroundColor: '#002D7A', color: '#F1C40F' }}>
              <a.icon size={12} />{a.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <StatCard key={i} label={s.label} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>

      {children && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          {children}
        </div>
      )}

      {toast && <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: '#003DA5', color: '#F1C40F' }}>{toast}</div>}
    </div>
  )
}

// ─── Insights View (8 Role-Based Dashboards) ────────────────────────────────

const ROLES = [
  { id: 'dof', emoji: '👔', title: 'Director of Football', summary: 'Transfers & Squad' },
  { id: 'chairman', emoji: '🧑‍💼', title: 'Chairman / CEO', summary: 'Finance & Strategy' },
  { id: 'coach', emoji: '⚽', title: 'Head Coach', summary: 'Squad & Tactics' },
  { id: 'medical', emoji: '🏥', title: 'Head of Medical', summary: 'Injuries & Load' },
  { id: 'recruitment', emoji: '🔭', title: 'Head of Recruitment', summary: 'Targets & Scouts' },
  { id: 'academy', emoji: '🎓', title: 'Academy Director', summary: 'Youth & EPPP' },
  { id: 'analysis', emoji: '📊', title: 'Head of Analysis', summary: 'xG & Tactics' },
  { id: 'commercial', emoji: '📣', title: 'Commercial Director', summary: 'Revenue & Sponsors' },
]

function InsightCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <p className="text-xs mb-1" style={{ color: '#6B7280' }}>{label}</p>
      <p className="text-2xl font-black" style={{ color: color || '#F9FAFB' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{sub}</p>}
    </div>
  )
}

function InsightTable({ cols, rows }: { cols: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
      <table className="w-full text-sm">
        <thead><tr style={{ backgroundColor: '#111318', borderBottom: '1px solid #1F2937' }}>
          {cols.map(c => <th key={c} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{c}</th>)}
        </tr></thead>
        <tbody>{rows.map((row, i) => (
          <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid #1F2937' : 'none' }}>
            {row.map((cell, j) => <td key={j} className="px-4 py-3" style={{ color: j === 0 ? '#F9FAFB' : '#9CA3AF' }}>{cell}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}

function InsightsView() {
  const [role, setRole] = useState('dof')
  const [range, setRange] = useState('season')

  return (
    <div className="space-y-6">
      {/* Header + Role Tabs */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
          <div>
            <h1 className="text-xl font-black" style={{ color: '#F9FAFB' }}>Club Intelligence</h1>
            <p className="text-xs" style={{ color: '#6B7280' }}>Everything your club needs to know — by role, by department, by moment</p>
          </div>
          <div className="flex gap-2">
            {[['today', 'Today'], ['week', 'This Week'], ['month', 'This Month'], ['season', 'This Season']].map(([k, l]) => (
              <button key={k} onClick={() => setRange(k)} className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: range === k ? '#003DA5' : '#111318', color: range === k ? '#F9FAFB' : '#9CA3AF', border: range === k ? 'none' : '1px solid #1F2937' }}>{l}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {ROLES.map(r => (
            <button key={r.id} onClick={() => setRole(r.id)} className="inline-flex items-center gap-1.5 shrink-0 rounded-full transition-all"
              style={{ padding: '6px 14px', fontSize: 13, fontWeight: 600, backgroundColor: role === r.id ? '#0D9488' : '#111318', color: role === r.id ? '#F9FAFB' : '#9CA3AF', border: role === r.id ? 'none' : '1px solid #1F2937' }}>
              <span>{r.emoji}</span>{r.title}
            </button>
          ))}
        </div>
      </div>

      {/* ── DIRECTOR OF FOOTBALL ── */}
      {role === 'dof' && <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InsightCard label="League Position" value="8th" sub="Championship" color="#F1C40F" />
          <InsightCard label="Squad Value" value="£34.2m" sub="↑ 12% vs start of season" color="#22C55E" />
          <InsightCard label="Net Transfer Spend" value="-£2.1m" sub="Sales £4.8m · Purchases £6.9m" />
          <InsightCard label="Window Closes" value="11 days" color="#EF4444" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Squad Overview</p>
            {[{ label: 'Fitness', values: [{ l: 'Fit', v: 21, c: '#22C55E' }, { l: 'Injured', v: 3, c: '#EF4444' }, { l: 'Suspended', v: 1, c: '#F59E0B' }] },
              { label: 'Contracts', values: [{ l: 'Expiring', v: 8, c: '#EF4444' }, { l: 'Negotiating', v: 4, c: '#F59E0B' }, { l: 'Secure', v: 13, c: '#22C55E' }] },
              { label: 'Age Profile', values: [{ l: 'U21', v: 6, c: '#22D3EE' }, { l: '21-25', v: 8, c: '#0D9488' }, { l: '26-30', v: 9, c: '#8B5CF6' }, { l: '30+', v: 2, c: '#6B7280' }] },
            ].map(row => (
              <div key={row.label} className="mb-3">
                <p className="text-xs mb-1" style={{ color: '#6B7280' }}>{row.label}</p>
                <div className="flex h-4 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                  {row.values.map(v => <div key={v.l} style={{ width: `${(v.v / 25) * 100}%`, backgroundColor: v.c }} title={`${v.l}: ${v.v}`} />)}
                </div>
                <div className="flex gap-3 mt-1">{row.values.map(v => <span key={v.l} className="text-[10px]" style={{ color: v.c }}>{v.l}: {v.v}</span>)}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Financial Snapshot</p>
            {[{ l: 'Weekly Wage Bill', v: '£187,000', s: 'Budget: £200,000', pct: 94 }, { l: 'Transfer Budget Used', v: '£4.8m of £8m', s: '£3.2m remaining', pct: 60 }, { l: 'Commercial Revenue', v: '£2.1m', s: 'Target: £2.8m (75%)', pct: 75 }].map(f => (
              <div key={f.l} className="mb-3">
                <div className="flex justify-between text-xs mb-1"><span style={{ color: '#9CA3AF' }}>{f.l}</span><span style={{ color: '#F9FAFB' }}>{f.v}</span></div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}><div className="h-full rounded-full" style={{ width: `${f.pct}%`, backgroundColor: f.pct > 90 ? '#EF4444' : f.pct > 75 ? '#F59E0B' : '#22C55E' }} /></div>
                <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{f.s}</p>
              </div>
            ))}
          </div>
        </div>
        <InsightTable cols={['Target', 'Position', 'Club', 'Value', 'Status', 'Agent', 'Deadline']}
          rows={SCOUT_TARGETS.map(t => [t.name, t.position, t.club, t.value, <span key={t.name} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: t.status === 'Bid Submitted' ? 'rgba(239,68,68,0.12)' : t.status === 'Approached' ? 'rgba(245,158,11,0.12)' : 'rgba(107,114,128,0.12)', color: t.status === 'Bid Submitted' ? '#EF4444' : t.status === 'Approached' ? '#F59E0B' : '#6B7280' }}>{t.status}</span>, 'CAA Base', '11 days'])} />
      </>}

      {/* ── HEAD COACH ── */}
      {role === 'coach' && <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InsightCard label="Next Match" value="Saturday 3pm" sub="vs Bristol City (H)" color="#003DA5" />
          <InsightCard label="Days to Match" value="4" />
          <InsightCard label="Squad Available" value="21 / 25" sub="3 injured, 1 suspended" />
          <InsightCard label="Last Result" value="W 2-1" sub="vs Riverside United" color="#22C55E" />
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Squad Availability</p>
          <div className="grid grid-cols-5 md:grid-cols-8 gap-2">
            {SQUAD.map(p => (
              <div key={p.name} className="rounded-lg p-2 text-center" style={{ backgroundColor: p.fitness === 'fit' ? 'rgba(34,197,94,0.08)' : p.fitness === 'doubt' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${p.fitness === 'fit' ? 'rgba(34,197,94,0.2)' : p.fitness === 'doubt' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                <p className="text-xs font-bold" style={{ color: p.fitness === 'fit' ? '#22C55E' : p.fitness === 'doubt' ? '#F59E0B' : '#EF4444' }}>{p.number}</p>
                <p className="text-[10px] truncate" style={{ color: '#D1D5DB' }}>{p.name.split(' ').pop()}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Form — Last 5</p>
            <div className="flex gap-2">{RECENT_FORM.map((r, i) => (
              <div key={i} className="flex-1 rounded-lg p-3 text-center" style={{ backgroundColor: r.result === 'W' ? 'rgba(34,197,94,0.08)' : r.result === 'D' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)' }}>
                <p className="text-lg font-black" style={{ color: r.result === 'W' ? '#22C55E' : r.result === 'D' ? '#F59E0B' : '#EF4444' }}>{r.result}</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{r.score}</p>
                <p className="text-[10px] truncate" style={{ color: '#6B7280' }}>{r.opponent}</p>
              </div>
            ))}</div>
          </div>
          <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Season Stats</p>
            <div className="grid grid-cols-4 gap-2">{[{ l: 'xG For', v: '28.4', c: '#22C55E' }, { l: 'xG Against', v: '22.1', c: '#EF4444' }, { l: 'Possession', v: '52%' }, { l: 'Clean Sheets', v: '7' }].map(s => (
              <div key={s.l} className="text-center"><p className="text-lg font-black" style={{ color: s.c || '#F9FAFB' }}>{s.v}</p><p className="text-[10px]" style={{ color: '#6B7280' }}>{s.l}</p></div>
            ))}</div>
          </div>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Next Opposition — Bristol City</p>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs font-bold mb-2" style={{ color: '#003DA5' }}>THEIR THREATS</p>{['Top scorer: A. Wells (12 goals)', 'Set piece danger from corners', 'Fast counter-attack through right side'].map(t => <p key={t} className="text-xs mb-1" style={{ color: '#D1D5DB' }}>⚠️ {t}</p>)}</div>
            <div><p className="text-xs font-bold mb-2" style={{ color: '#22C55E' }}>THEIR WEAKNESSES</p>{['Poor defending from crosses (12 goals conceded)', 'Slow build-up on left side', 'Vulnerable to high press (9.2 PPDA)'].map(t => <p key={t} className="text-xs mb-1" style={{ color: '#D1D5DB' }}>✅ {t}</p>)}</div>
          </div>
        </div>
      </>}

      {/* ── HEAD OF MEDICAL ── */}
      {role === 'medical' && <>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <InsightCard label="Currently Injured" value="3" color="#EF4444" />
          <InsightCard label="In Rehab" value="2" />
          <InsightCard label="Returning This Week" value="1" color="#22C55E" />
          <InsightCard label="Days Lost (Season)" value="47" />
          <InsightCard label="Injury Cost Est." value="£284k" sub="Wages during absence" color="#F59E0B" />
        </div>
        <InsightTable cols={['Player', 'Injury', 'Phase', 'Injured', 'Expected Return', 'Missed', 'Physio']}
          rows={INJURIES.map(inj => [inj.player, inj.type, <span key={inj.player} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>{inj.phase || 'Rehab'}</span>, inj.since || '12 Mar', inj.expectedReturn, `${inj.matchesMissed || 3}`, 'Dr. J. Williams'])} />
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>GPS Load — Last Session</p>
          <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr style={{ borderBottom: '1px solid #1F2937' }}>{['Player', 'Distance', 'Hi-Speed', 'Sprints', 'Max Speed', 'Load'].map(h => <th key={h} className="text-left px-3 py-2" style={{ color: '#6B7280' }}>{h}</th>)}</tr></thead>
          <tbody>{GPS_DATA.map(g => <tr key={g.player} style={{ borderBottom: '1px solid #1F2937' }}><td className="px-3 py-2 font-medium" style={{ color: '#F9FAFB' }}>{g.player}</td><td className="px-3 py-2" style={{ color: '#9CA3AF' }}>{g.distance}km</td><td className="px-3 py-2" style={{ color: '#9CA3AF' }}>{g.hiSpeed}m</td><td className="px-3 py-2" style={{ color: '#9CA3AF' }}>{g.sprints}</td><td className="px-3 py-2" style={{ color: '#9CA3AF' }}>{g.maxSpeed}km/h</td><td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: g.load === 'optimal' ? 'rgba(34,197,94,0.12)' : g.load === 'high' ? 'rgba(245,158,11,0.12)' : g.load === 'overload' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: g.load === 'optimal' ? '#22C55E' : g.load === 'high' ? '#F59E0B' : g.load === 'overload' ? '#EF4444' : '#F59E0B' }}>{g.load}</span></td></tr>)}</tbody></table></div>
        </div>
      </>}

      {/* ── HEAD OF RECRUITMENT ── */}
      {role === 'recruitment' && <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InsightCard label="Active Targets" value="5" />
          <InsightCard label="Bid Submitted" value="1" color="#EF4444" />
          <InsightCard label="Budget Remaining" value="£3.2m" color="#22C55E" />
          <InsightCard label="Window Closes" value="11 days" color="#F59E0B" />
        </div>
        <InsightTable cols={['Player', 'Club', 'Age', 'Pos', 'Value', 'Contract', '⭐', 'Status']}
          rows={SCOUT_TARGETS.map(t => [t.name, t.club, String(t.age), t.position, t.value, t.contract, '⭐'.repeat(t.rating), <span key={t.name} className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: t.status === 'Bid Submitted' ? 'rgba(239,68,68,0.12)' : t.status === 'Approached' ? 'rgba(245,158,11,0.12)' : 'rgba(107,114,128,0.12)', color: t.status === 'Bid Submitted' ? '#EF4444' : t.status === 'Approached' ? '#F59E0B' : '#6B7280' }}>{t.status}</span>])} />
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Scouting Activity This Month</p>
          <div className="grid grid-cols-4 gap-3">{[{ l: 'Reports Submitted', v: '12' }, { l: 'Scouts Deployed', v: '4' }, { l: 'Countries Covered', v: '8' }, { l: 'Top Pick', v: 'André Costa ⭐⭐⭐⭐⭐' }].map(s => (
            <div key={s.l} className="text-center"><p className="text-lg font-black" style={{ color: '#F9FAFB' }}>{s.v}</p><p className="text-[10px]" style={{ color: '#6B7280' }}>{s.l}</p></div>
          ))}</div>
        </div>
      </>}

      {/* ── ACADEMY DIRECTOR ── */}
      {role === 'academy' && <>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <InsightCard label="Academy Players" value="68" />
          <InsightCard label="On Pathway" value="8" color="#22C55E" />
          <InsightCard label="EPPP Compliance" value="94%" color="#F1C40F" />
          <InsightCard label="Scholarships" value="6" />
          <InsightCard label="Released" value="4" color="#EF4444" />
        </div>
        <InsightTable cols={['Player', 'Age', 'Position', 'Age Group', 'Dev. Rating', 'Pathway', 'Status']}
          rows={ACADEMY_STANDOUTS.map(p => [p.name, String(p.age), p.position, p.ageGroup || 'U21', `${p.devRating || 82}/100`, p.pathway || 'Developing', <span key={p.name} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>Active</span>])} />
      </>}

      {/* ── HEAD OF ANALYSIS ── */}
      {role === 'analysis' && <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InsightCard label="xG For" value="28.4" color="#22C55E" />
          <InsightCard label="xG Against" value="22.1" color="#EF4444" />
          <InsightCard label="Possession Avg" value="52%" />
          <InsightCard label="PPDA" value="8.4" sub="Press intensity" />
        </div>
        <InsightTable cols={['Formation', 'Games', 'W', 'D', 'L', 'Win%', 'GF', 'GA', 'xG Diff']}
          rows={[['4-3-3', '10', '6', '2', '2', '60%', '14', '9', '+4.2'], ['4-2-3-1', '6', '3', '1', '2', '50%', '8', '7', '+1.8'], ['3-5-2', '2', '1', '0', '1', '50%', '3', '3', '-0.4']]} />
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Set Piece Record</p>
          <div className="grid grid-cols-4 gap-3">{[{ l: 'Corners/Game', v: '4.2' }, { l: 'Goals from Corners', v: '3 (8%)' }, { l: 'Penalties', v: '3/3 (100%)' }, { l: 'Set Pieces Conceded', v: '4 goals' }].map(s => (
            <div key={s.l} className="text-center"><p className="text-lg font-black" style={{ color: '#F9FAFB' }}>{s.v}</p><p className="text-[10px]" style={{ color: '#6B7280' }}>{s.l}</p></div>
          ))}</div>
        </div>
      </>}

      {/* ── COMMERCIAL DIRECTOR ── */}
      {role === 'commercial' && <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InsightCard label="Match Day Revenue" value="£1.4m" sub="Budget: £1.6m" />
          <InsightCard label="Commercial Revenue" value="£2.1m" sub="Budget: £2.8m" />
          <InsightCard label="Season Tickets" value="8,400" sub="of 9,000 (93%)" color="#22C55E" />
          <InsightCard label="Fan Sentiment" value="72/100" />
        </div>
        <InsightTable cols={['Sponsor', 'Deal Value', 'Contract End', 'Deliverables', 'Status']}
          rows={[['MK Insurance', '£400k/yr', 'Jun 2027', '12/14 complete', <span key="1" className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>On Track</span>], ['Apex Motors', '£250k/yr', 'Jun 2026', '8/10 complete', <span key="2" className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>On Track</span>], ['LocalBrew Co', '£80k/yr', 'Dec 2025', '3/6 complete', <span key="3" className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>Behind</span>]]} />
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Social & Digital</p>
            {[{ l: 'Total Followers', v: '284,000' }, { l: 'Engagement Rate', v: '4.2%' }, { l: 'Shirt Sales', v: '4,200 (↑10%)' }].map(s => <div key={s.l} className="flex justify-between py-1.5"><span className="text-xs" style={{ color: '#9CA3AF' }}>{s.l}</span><span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{s.v}</span></div>)}
          </div>
          <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Attendance</p>
            {[{ l: 'Average', v: '16,200 / 24,000 (68%)' }, { l: 'Hospitality', v: '89% sold' }, { l: 'Next Match Projected', v: '18,500' }].map(s => <div key={s.l} className="flex justify-between py-1.5"><span className="text-xs" style={{ color: '#9CA3AF' }}>{s.l}</span><span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{s.v}</span></div>)}
          </div>
        </div>
      </>}

      {/* ── CHAIRMAN / CEO ── */}
      {role === 'chairman' && <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InsightCard label="Total Revenue (YTD)" value="£8.2m" sub="Budget: £9.4m (87%)" />
          <InsightCard label="Wage/Revenue Ratio" value="62%" sub="PSR limit: 70%" color={62 > 65 ? '#F59E0B' : '#22C55E'} />
          <InsightCard label="Net Spend" value="-£2.1m" sub="FFP position: Safe" color="#22C55E" />
          <InsightCard label="Board Meeting" value="Thu 2pm" sub="3 agenda items" />
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Board Agenda Items</p>
          {['Martinez contract renewal — £22k/week proposed, agent wants £28k', 'Academy EPPP Cat 2 re-assessment — due May, compliance at 94%', 'Commercial pipeline — 3 new sponsor conversations active, 1 near close'].map((item, i) => (
            <div key={i} className="flex gap-3 py-2"><span className="text-xs font-bold shrink-0" style={{ color: '#003DA5' }}>{i + 1}.</span><p className="text-xs" style={{ color: '#D1D5DB' }}>{item}</p></div>
          ))}
        </div>
      </>}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION A — Performance Charts */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div style={{ borderLeft: '3px solid #6C3FC5', paddingLeft: 12, marginBottom: 16 }}><h2 style={{ color: '#F9FAFB', fontSize: 16, fontWeight: 700, margin: 0 }}>Performance Charts</h2></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* League Position Trend */}
        <div style={{ backgroundColor: '#0D1017', border: '1px solid #1F2937', borderRadius: 12, padding: 20 }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>League Position Trend</p>
          <svg viewBox="0 0 500 200" width="100%" style={{ overflow: 'visible' }}>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (<line key={n} x1="40" y1={16*n+4} x2="490" y2={16*n+4} stroke="#1F2937" strokeWidth="0.5" />))}
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (<text key={n} x="30" y={16*n+8} fill="#6B7280" fontSize="9" textAnchor="end">{n}</text>))}
            {(() => { const pts = [8,7,9,8,7,6,7,6,5,6,6,6]; const coords = pts.map((p,i) => `${40+i*((490-40)/11)},${p*16+4}`); return (<><polyline points={coords.join(' ')} fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinejoin="round" />{pts.map((p,i) => (<circle key={i} cx={40+i*((490-40)/11)} cy={p*16+4} r={i===11?5:3} fill={i===11?'#F1C40F':'#0D9488'} />))}{pts.map((p,i) => (<text key={`l${i}`} x={40+i*((490-40)/11)} y={196} fill="#6B7280" fontSize="8" textAnchor="middle">GW{i+1}</text>))}</>)})()}
          </svg>
          <p className="text-xs mt-2 text-center" style={{ color: '#6B7280' }}>Current: <span style={{ color: '#F1C40F', fontWeight: 700 }}>6th</span></p>
        </div>
        {/* Goals For vs Against */}
        <div style={{ backgroundColor: '#0D1017', border: '1px solid #1F2937', borderRadius: 12, padding: 20 }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Goals For vs Against</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180 }}>
            {[{m:'Aug',f:8,a:5},{m:'Sep',f:11,a:4},{m:'Oct',f:9,a:6},{m:'Nov',f:7,a:5},{m:'Dec',f:12,a:3},{m:'Jan',f:9,a:6},{m:'Feb',f:10,a:5},{m:'Mar',f:8,a:3}].map(d => (
              <div key={d.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 160 }}>
                  <div style={{ width: 14, height: `${(d.f/12)*140}px`, backgroundColor: '#0D9488', borderRadius: '3px 3px 0 0' }} title={`For: ${d.f}`} />
                  <div style={{ width: 14, height: `${(d.a/12)*140}px`, backgroundColor: '#EF4444', borderRadius: '3px 3px 0 0' }} title={`Against: ${d.a}`} />
                </div>
                <span style={{ fontSize: 9, color: '#6B7280' }}>{d.m}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 justify-center"><span className="flex items-center gap-1 text-xs" style={{ color: '#0D9488' }}><span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#0D9488', display: 'inline-block' }} /> For</span><span className="flex items-center gap-1 text-xs" style={{ color: '#EF4444' }}><span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#EF4444', display: 'inline-block' }} /> Against</span></div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION B — Squad Analytics */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div style={{ borderLeft: '3px solid #6C3FC5', paddingLeft: 12, marginBottom: 16, marginTop: 24 }}><h2 style={{ color: '#F9FAFB', fontSize: 16, fontWeight: 700, margin: 0 }}>Squad Analytics</h2></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Age Distribution */}
        <div style={{ backgroundColor: '#0D1017', border: '1px solid #1F2937', borderRadius: 12, padding: 20 }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Age Distribution</p>
          <svg viewBox="0 0 120 120" width="120" style={{ display: 'block', margin: '0 auto' }}>
            {(() => { const data = [{v:26,c:'#3B82F6'},{v:35,c:'#0D9488'},{v:26,c:'#8B5CF6'},{v:13,c:'#F59E0B'}]; let acc = 0; return data.map((d,i) => { const start = acc; acc += d.v; const s = (start/100)*Math.PI*2-Math.PI/2; const e = (acc/100)*Math.PI*2-Math.PI/2; const la = d.v > 50 ? 1 : 0; return <path key={i} d={`M${60+40*Math.cos(s)},${60+40*Math.sin(s)} A40,40 0 ${la},1 ${60+40*Math.cos(e)},${60+40*Math.sin(e)} L${60+25*Math.cos(e)},${60+25*Math.sin(e)} A25,25 0 ${la},0 ${60+25*Math.cos(s)},${60+25*Math.sin(s)} Z`} fill={d.c} /> }) })()}
            <text x="60" y="57" textAnchor="middle" fill="#F9FAFB" fontSize="12" fontWeight="800">23</text>
            <text x="60" y="69" textAnchor="middle" fill="#6B7280" fontSize="7">Players</text>
          </svg>
          <div className="grid grid-cols-2 gap-1 mt-3">{[{l:'U21',c:'#3B82F6',v:'6 (26%)'},{l:'21-25',c:'#0D9488',v:'8 (35%)'},{l:'26-29',c:'#8B5CF6',v:'6 (26%)'},{l:'30+',c:'#F59E0B',v:'3 (13%)'}].map(d => (<div key={d.l} className="flex items-center gap-2"><span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: d.c }} /><span className="text-xs" style={{ color: '#9CA3AF' }}>{d.l}: {d.v}</span></div>))}</div>
        </div>
        {/* Nationality */}
        <div style={{ backgroundColor: '#0D1017', border: '1px solid #1F2937', borderRadius: 12, padding: 20 }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Nationality Breakdown</p>
          <div className="space-y-2">{[{n:'England',v:39,c:'#0D9488'},{n:'Nigeria',v:13,c:'#3B82F6'},{n:'Brazil',v:9,c:'#22C55E'},{n:'Spain',v:9,c:'#F59E0B'},{n:'Other',v:30,c:'#8B5CF6'}].map(d => (<div key={d.n}><div className="flex justify-between text-xs mb-1"><span style={{ color: '#D1D5DB' }}>{d.n}</span><span style={{ color: '#6B7280' }}>{d.v}%</span></div><div style={{ height: 6, borderRadius: 3, backgroundColor: '#1F2937' }}><div style={{ height: 6, borderRadius: 3, width: `${d.v}%`, backgroundColor: d.c }} /></div></div>))}</div>
        </div>
        {/* Contract Status */}
        <div style={{ backgroundColor: '#0D1017', border: '1px solid #1F2937', borderRadius: 12, padding: 20 }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Contract Status</p>
          <svg viewBox="0 0 120 120" width="120" style={{ display: 'block', margin: '0 auto' }}>
            {(() => { const data = [{v:13,c:'#EF4444'},{v:22,c:'#F59E0B'},{v:39,c:'#22C55E'},{v:26,c:'#0D9488'}]; let acc = 0; return data.map((d,i) => { const start = acc; acc += d.v; const s = (start/100)*Math.PI*2-Math.PI/2; const e = (acc/100)*Math.PI*2-Math.PI/2; const la = d.v > 50 ? 1 : 0; return <path key={i} d={`M${60+40*Math.cos(s)},${60+40*Math.sin(s)} A40,40 0 ${la},1 ${60+40*Math.cos(e)},${60+40*Math.sin(e)} L${60+25*Math.cos(e)},${60+25*Math.sin(e)} A25,25 0 ${la},0 ${60+25*Math.cos(s)},${60+25*Math.sin(s)} Z`} fill={d.c} /> }) })()}
            <text x="60" y="57" textAnchor="middle" fill="#F9FAFB" fontSize="12" fontWeight="800">23</text>
            <text x="60" y="69" textAnchor="middle" fill="#6B7280" fontSize="7">Players</text>
          </svg>
          <div className="grid grid-cols-2 gap-1 mt-3">{[{l:'<6 months',c:'#EF4444',v:'3'},{l:'6-12 mo',c:'#F59E0B',v:'5'},{l:'1-2 years',c:'#22C55E',v:'9'},{l:'2+ years',c:'#0D9488',v:'6'}].map(d => (<div key={d.l} className="flex items-center gap-2"><span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: d.c }} /><span className="text-xs" style={{ color: '#9CA3AF' }}>{d.l}: {d.v}</span></div>))}</div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION C — Financial Intelligence */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div style={{ borderLeft: '3px solid #6C3FC5', paddingLeft: 12, marginBottom: 16, marginTop: 24 }}><h2 style={{ color: '#F9FAFB', fontSize: 16, fontWeight: 700, margin: 0 }}>Financial Intelligence</h2></div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[{l:'Revenue YTD',v:'£8.2M',s:'vs £9.4M budget (87%)',c:'#F59E0B'},{l:'Wage Bill',v:'£2.52M',s:'Ratio 62%',c:'#0D9488'},{l:'Transfer Spend',v:'£2.1M',s:'Net spend',c:'#3B82F6'},{l:'Matchday Rev',v:'£480K',s:'42% of total',c:'#8B5CF6'},{l:'Commercial',v:'£270K',s:'▲ +18%',c:'#22C55E'},{l:'Cash Reserves',v:'£1.2M',s:'Healthy',c:'#0D9488'}].map(d => (
          <div key={d.l} style={{ backgroundColor: '#0D1017', border: '1px solid #1F2937', borderRadius: 12, padding: 16 }}>
            <p className="text-[10px] font-semibold uppercase" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>{d.l}</p>
            <p className="text-xl font-black mt-1" style={{ color: d.c }}>{d.v}</p>
            <p className="text-[10px] mt-1" style={{ color: '#6B7280' }}>{d.s}</p>
          </div>
        ))}
      </div>
      {/* Monthly Revenue */}
      <div style={{ backgroundColor: '#0D1017', border: '1px solid #1F2937', borderRadius: 12, padding: 20, marginTop: 16 }}>
        <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Monthly Revenue (Season)</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, borderBottom: '1px dashed #374151' }}><span className="text-[8px] absolute -top-3 right-0" style={{ color: '#4B5563' }}>£800K</span></div>
          {[{m:'Jul',v:580},{m:'Aug',v:720},{m:'Sep',v:680},{m:'Oct',v:650},{m:'Nov',v:590},{m:'Dec',v:710},{m:'Jan',v:680},{m:'Feb',v:660},{m:'Mar',v:700},{m:'Apr',v:0},{m:'May',v:0},{m:'Jun',v:0}].map(d => (
            <div key={d.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{ width: '100%', maxWidth: 28, height: d.v > 0 ? `${(d.v/800)*140}px` : 20, backgroundColor: d.v > 0 ? '#0D9488' : 'transparent', border: d.v === 0 ? '1px dashed #374151' : 'none', borderRadius: '3px 3px 0 0' }} />
              <span style={{ fontSize: 8, color: '#6B7280', marginTop: 4 }}>{d.m}</span>
            </div>
          ))}
        </div>
      </div>
      {/* P&L Table */}
      <div style={{ backgroundColor: '#0D1017', border: '1px solid #1F2937', borderRadius: 12, overflow: 'hidden', marginTop: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ backgroundColor: '#111318' }}>{['Category','Budget','Actual','Remaining','Status'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #1F2937' }}>{h}</th>)}</tr></thead>
          <tbody>{[{c:'Playing staff wages',b:'£2.8M',a:'£2.52M',r:'£280K',s:'✅ Under'},{c:'Transfer fees',b:'£2.5M',a:'£2.1M',r:'£400K',s:'✅ Under'},{c:'Stadium/Operations',b:'£480K',a:'£510K',r:'-£30K',s:'⚠️ Over'},{c:'Academy',b:'£320K',a:'£298K',r:'£22K',s:'✅ Under'},{c:'Commercial/Marketing',b:'£180K',a:'£162K',r:'£18K',s:'✅ Under'},{c:'Medical/Science',b:'£140K',a:'£128K',r:'£12K',s:'✅ Under'}].map((r,i) => (<tr key={i} style={{ borderBottom: '1px solid #1F2937' }}><td style={{ padding: '10px 14px', color: '#F9FAFB', fontWeight: 500 }}>{r.c}</td><td style={{ padding: '10px 14px', color: '#9CA3AF' }}>{r.b}</td><td style={{ padding: '10px 14px', color: '#D1D5DB' }}>{r.a}</td><td style={{ padding: '10px 14px', color: r.r.startsWith('-') ? '#EF4444' : '#22C55E' }}>{r.r}</td><td style={{ padding: '10px 14px' }}>{r.s}</td></tr>))}</tbody>
        </table>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION D — Match Performance */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div style={{ borderLeft: '3px solid #6C3FC5', paddingLeft: 12, marginBottom: 16, marginTop: 24 }}><h2 style={{ color: '#F9FAFB', fontSize: 16, fontWeight: 700, margin: 0 }}>Match Performance</h2></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{l:'Avg Possession',v:'54%',s:'▲ +3%',c:'#0D9488'},{l:'Shots per Game',v:'14.2',s:'▲ +1.8',c:'#3B82F6'},{l:'xG per Game',v:'1.84',s:'▲ +0.22',c:'#8B5CF6'},{l:'Clean Sheets',v:'11 (34%)',s:'League 4th',c:'#22C55E'}].map(d => (
          <div key={d.l} style={{ backgroundColor: '#0D1017', border: '1px solid #1F2937', borderRadius: 12, padding: 16 }}>
            <p className="text-[10px] font-semibold uppercase" style={{ color: '#6B7280' }}>{d.l}</p>
            <p className="text-xl font-black mt-1" style={{ color: d.c }}>{d.v}</p>
            <p className="text-[10px] mt-1" style={{ color: '#22C55E' }}>{d.s}</p>
          </div>
        ))}
      </div>
      {/* Form heatmap */}
      <div style={{ backgroundColor: '#0D1017', border: '1px solid #1F2937', borderRadius: 12, padding: 20, marginTop: 16 }}>
        <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Last 20 Games</p>
        <div className="flex flex-wrap gap-1.5">
          {[{r:'W',s:'2-0'},{r:'W',s:'1-0'},{r:'D',s:'1-1'},{r:'W',s:'3-1'},{r:'L',s:'0-2'},{r:'W',s:'2-0'},{r:'W',s:'2-1'},{r:'W',s:'4-0'},{r:'D',s:'0-0'},{r:'W',s:'1-0'},{r:'L',s:'1-3'},{r:'W',s:'2-1'},{r:'D',s:'2-2'},{r:'W',s:'3-0'},{r:'W',s:'2-0'},{r:'W',s:'1-0'},{r:'L',s:'0-1'},{r:'W',s:'2-0'},{r:'W',s:'3-1'},{r:'D',s:'1-1'}].map((g,i) => (
            <div key={i} className="flex flex-col items-center" style={{ width: 36 }}>
              <div style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: g.r === 'W' ? '#22C55E' : g.r === 'D' ? '#F59E0B' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>{g.r}</div>
              <span style={{ fontSize: 8, color: '#6B7280', marginTop: 2 }}>{g.s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION E — Scouting Pipeline */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div style={{ borderLeft: '3px solid #6C3FC5', paddingLeft: 12, marginBottom: 16, marginTop: 24 }}><h2 style={{ color: '#F9FAFB', fontSize: 16, fontWeight: 700, margin: 0 }}>Scouting &amp; Recruitment Pipeline</h2></div>
      <div style={{ backgroundColor: '#0D1017', border: '1px solid #1F2937', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ backgroundColor: '#111318' }}>{['Player','Age','Pos','Club','Value','Status'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', borderBottom: '1px solid #1F2937' }}>{h}</th>)}</tr></thead>
          <tbody>{[{n:'D. Osei',a:22,p:'ST',cl:'Harlow Town',v:'£180K',s:'✅ Signed'},{n:'A. Mensah',a:24,p:'CM',cl:'Braintree',v:'£95K',s:'🔄 Negotiating'},{n:'T. Park',a:21,p:'RB',cl:'Chelmsford',v:'£65K',s:'👁️ Scouting'},{n:'L. Diallo',a:19,p:'LW',cl:'AFC Sudbury',v:'£45K',s:'👁️ Scouting'},{n:'K. Walsh',a:26,p:'CB',cl:'Bishops Stortford',v:'£80K',s:'💬 Interested'},{n:'R. Santos',a:23,p:'GK',cl:'Maldon',v:'£55K',s:'📋 Watching'}].map((r,i) => (<tr key={i} style={{ borderBottom: '1px solid #1F2937' }}><td style={{ padding: '10px 14px', color: '#F9FAFB', fontWeight: 600 }}>{r.n}</td><td style={{ padding: '10px 14px', color: '#9CA3AF' }}>{r.a}</td><td style={{ padding: '10px 14px', color: '#9CA3AF' }}>{r.p}</td><td style={{ padding: '10px 14px', color: '#D1D5DB' }}>{r.cl}</td><td style={{ padding: '10px 14px', color: '#F1C40F' }}>{r.v}</td><td style={{ padding: '10px 14px' }}>{r.s}</td></tr>))}</tbody>
        </table>
      </div>
      <div style={{ backgroundColor: '#0D1017', border: '1px solid #1F2937', borderRadius: 12, padding: 16, marginTop: 12 }}>
        <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>Summer Budget</span><span className="text-xs" style={{ color: '#6B7280' }}>£500K total · £150K committed · £350K available</span></div>
        <div style={{ height: 8, borderRadius: 4, backgroundColor: '#1F2937', display: 'flex', overflow: 'hidden' }}><div style={{ width: '30%', backgroundColor: '#0D9488' }} /><div style={{ width: '70%', backgroundColor: '#8B5CF6' }} /></div>
        <div className="flex gap-4 mt-2">{[{l:'Committed',c:'#0D9488'},{l:'Available',c:'#8B5CF6'}].map(d => <span key={d.l} className="flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}><span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: d.c, display: 'inline-block' }} />{d.l}</span>)}</div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECTION F — Attendance & Fanbase */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div style={{ borderLeft: '3px solid #6C3FC5', paddingLeft: 12, marginBottom: 16, marginTop: 24 }}><h2 style={{ color: '#F9FAFB', fontSize: 16, fontWeight: 700, margin: 0 }}>Attendance &amp; Fanbase</h2></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{l:'Season Avg',v:'4,240',s:'/ 6,000 (71%)',c:'#0D9488'},{l:'Season Tickets',v:'1,847',s:'▲ +124 vs last season',c:'#22C55E'},{l:'Highest',v:'5,980',s:'Derby vs Riverside',c:'#F1C40F'},{l:'Lowest',v:'1,240',s:'League Cup R1',c:'#EF4444'}].map(d => (
          <div key={d.l} style={{ backgroundColor: '#0D1017', border: '1px solid #1F2937', borderRadius: 12, padding: 16 }}>
            <p className="text-[10px] font-semibold uppercase" style={{ color: '#6B7280' }}>{d.l}</p>
            <p className="text-xl font-black mt-1" style={{ color: d.c }}>{d.v}</p>
            <p className="text-[10px] mt-1" style={{ color: '#6B7280' }}>{d.s}</p>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: '#0D1017', border: '1px solid #1F2937', borderRadius: 12, padding: 20, marginTop: 16 }}>
        <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Home Attendance (10 Games)</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, borderBottom: '1px dashed #374151' }}><span className="text-[8px] absolute -top-3 right-0" style={{ color: '#4B5563' }}>6,000 cap</span></div>
          {[{g:'vs Town',v:3800},{g:'vs City',v:4100},{g:'vs Utd',v:4400},{g:'vs Rangers',v:3600},{g:'vs Athletic',v:4800},{g:'vs Vale',v:4200},{g:'vs Borough',v:5100},{g:'vs Rovers',v:3900},{g:'vs FC',v:4500},{g:'vs Riverside',v:5980}].map(d => (
            <div key={d.g} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{ width: '100%', maxWidth: 32, height: `${(d.v/6000)*140}px`, backgroundColor: '#0D9488', borderRadius: '3px 3px 0 0' }} />
              <span style={{ fontSize: 7, color: '#6B7280', marginTop: 4, textAlign: 'center', lineHeight: 1.1 }}>{d.g}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Squad View ─────────────────────────────────────────────────────────────

function SquadView() {
  const [sortCol, setSortCol] = useState<string>('number')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [posFilter, setPosFilter] = useState<string>('All')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  function handleSort(col: string) {
    if (sortCol === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc') }
    else { setSortCol(col); setSortDir('asc') }
  }

  const filtered = posFilter === 'All' ? SQUAD : SQUAD.filter(p => p.position === posFilter)
  const sorted = [...filtered].sort((a, b) => {
    const key = sortCol as keyof Player
    const av = a[key], bv = b[key]
    if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
    return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
  })

  const topScorer = [...SQUAD].sort((a, b) => b.goals - a.goals)[0]
  const topAssists = [...SQUAD].sort((a, b) => b.assists - a.assists)[0]
  const topRated = [...SQUAD].sort((a, b) => b.lastRating - a.lastRating)[0]

  const [sqToast, setSqToast] = useState<string | null>(null)
  function sqAction(l: string) { setSqToast(`${l} — opening workflow...`); setTimeout(() => setSqToast(null), 2500) }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Squad Management</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Full squad overview, contracts, fitness, and availability.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[{ l: 'Team Sheet', i: Clipboard }, { l: 'Training Plan', i: Calendar }, { l: 'Player Ratings', i: Star }, { l: 'Match Report', i: FileText }, { l: 'Set Pieces', i: Target }, { l: 'Recovery Session', i: Heart }, { l: 'Dept Insights', i: BarChart3 }].map(a => (
          <button key={a.l} onClick={() => sqAction(a.l)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
            style={a.l === 'Dept Insights' ? { backgroundColor: 'transparent', border: '1px solid #F1C40F', color: '#F1C40F' } : { backgroundColor: '#002D7A', color: '#F1C40F' }}>
            <a.i size={12} />{a.l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Squad Size" value={String(SQUAD.length)} icon={Users} color="#003DA5" />
        <StatCard label="Fit" value={String(SQUAD.filter(p => p.fitness === 'fit').length)} icon={CheckCircle2} color="#22C55E" />
        <StatCard label="Injured" value={String(SQUAD.filter(p => p.fitness === 'injured').length)} icon={Heart} color="#EF4444" />
        <StatCard label="Avg Age" value={(SQUAD.reduce((s, p) => s + p.age, 0) / SQUAD.length).toFixed(1)} icon={Users} color="#3B82F6" />
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { title: 'Top Scorer', player: topScorer, stat: `${topScorer.goals} goals`, color: '#EF4444', icon: '⚽' },
          { title: 'Most Assists', player: topAssists, stat: `${topAssists.assists} assists`, color: '#3B82F6', icon: '🅰️' },
          { title: 'Highest Rated', player: topRated, stat: `${topRated.lastRating.toFixed(1)} avg`, color: '#F59E0B', icon: '⭐' },
        ].map((card, i) => (
          <div key={i} className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: `${card.color}1a` }}>{card.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs" style={{ color: '#6B7280' }}>{card.title}</p>
              <p className="text-sm font-bold truncate" style={{ color: '#F9FAFB' }}>{card.player.name}</p>
              <p className="text-xs font-semibold" style={{ color: card.color }}>{card.stat}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Form */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Recent Form (Last 5)</p>
          <div className="flex gap-1">
            {RECENT_FORM.map((r, i) => (
              <span key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{
                backgroundColor: r.result === 'W' ? 'rgba(34,197,94,0.15)' : r.result === 'D' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                color: r.result === 'W' ? '#22C55E' : r.result === 'D' ? '#F59E0B' : '#EF4444',
              }}>{r.result}</span>
            ))}
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          {RECENT_FORM.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-2.5">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{
                  backgroundColor: r.result === 'W' ? 'rgba(34,197,94,0.15)' : r.result === 'D' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                  color: r.result === 'W' ? '#22C55E' : r.result === 'D' ? '#F59E0B' : '#EF4444',
                }}>{r.result}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{r.home ? 'vs' : '@'} {r.opponent}</p>
                  {r.scorers && <p className="text-xs" style={{ color: '#6B7280' }}>{r.scorers}</p>}
                </div>
              </div>
              <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{r.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Season Stats */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Season Stats</p>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-0">
          {[
            { label: 'P', value: '28' }, { label: 'W', value: '17' }, { label: 'D', value: '5' }, { label: 'L', value: '6' },
            { label: 'GF', value: '48' }, { label: 'GA', value: '24' }, { label: 'CS', value: '11' }, { label: 'Pos', value: '3rd' },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center py-4" style={{ borderRight: i < 7 ? '1px solid #1F2937' : undefined }}>
              <span className="text-xs" style={{ color: '#6B7280' }}>{s.label}</span>
              <span className="text-lg font-black" style={{ color: '#F9FAFB' }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Training */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Today&apos;s Training Schedule</p>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          {[
            { time: '09:00', session: 'Recovery Group (Martinez, O\'Brien, Santos)', type: 'Rehab', color: '#EF4444' },
            { time: '10:00', session: 'Tactical — Pressing Triggers', type: 'Tactical', color: '#3B82F6' },
            { time: '10:45', session: 'Possession Drills (Full Squad)', type: 'Technical', color: '#22C55E' },
            { time: '11:30', session: 'Set Pieces — Corners & Free Kicks', type: 'Set Piece', color: '#F59E0B' },
            { time: '12:00', session: 'Cool Down & Individual Meetings', type: 'Recovery', color: '#8B5CF6' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3">
              <span className="text-xs font-mono font-bold w-12" style={{ color: '#9CA3AF' }}>{s.time}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#F9FAFB' }}>{s.session}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-lg font-semibold" style={{ backgroundColor: `${s.color}1a`, color: s.color }}>{s.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Full Squad Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Full Squad</p>
          <div className="flex items-center gap-2">
            <Filter size={12} style={{ color: '#6B7280' }} />
            <select value={posFilter} onChange={e => setPosFilter(e.target.value)} className="text-xs rounded-lg px-2 py-1" style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', outline: 'none' }}>
              <option value="All">All Positions</option>
              {['GK','CB','RB','LB','CM','CAM','LW','RW','ST'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {[
                  { key: 'number', label: '#' }, { key: 'name', label: 'Player' }, { key: 'position', label: 'Pos' },
                  { key: 'nationality', label: 'Nat' }, { key: 'age', label: 'Age' }, { key: 'marketValue', label: 'Value' },
                  { key: 'contractExpiry', label: 'Contract' }, { key: 'lastRating', label: 'Rating' },
                  { key: 'goals', label: 'G' }, { key: 'assists', label: 'A' }, { key: 'fitness', label: 'Status' },
                ].map(h => (
                  <th key={h.key} className="text-left px-4 py-3 font-semibold cursor-pointer select-none hover:text-white" style={{ color: sortCol === h.key ? '#003DA5' : '#6B7280' }} onClick={() => handleSort(h.key)}>
                    {h.label} {sortCol === h.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={i} onClick={() => setSelectedPlayer(p)} style={{ borderBottom: i < sorted.length - 1 ? '1px solid #1F2937' : undefined, cursor: 'pointer' }} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 font-bold" style={{ color: '#6B7280' }}>{p.number}</td>
                  <td className="px-4 py-2.5 font-medium" style={{ color: '#F9FAFB' }}>{p.name}</td>
                  <td className="px-4 py-2.5"><span className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'rgba(0,61,165,0.1)', color: '#F1C40F' }}>{p.position}</span></td>
                  <td className="px-4 py-2.5">{p.nationality}</td>
                  <td className="px-4 py-2.5" style={{ color: '#9CA3AF' }}>{p.age}</td>
                  <td className="px-4 py-2.5" style={{ color: '#9CA3AF' }}>{p.marketValue}</td>
                  <td className="px-4 py-2.5" style={{ color: p.contractExpiry === 'Jun 2025' ? '#EF4444' : p.contractExpiry === 'Jun 2026' ? '#F59E0B' : '#9CA3AF' }}>{p.contractExpiry}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-bold" style={{ color: p.lastRating >= 7.5 ? '#22C55E' : p.lastRating >= 7.0 ? '#F59E0B' : '#9CA3AF' }}>{p.lastRating.toFixed(1)}</span>
                  </td>
                  <td className="px-4 py-2.5 font-bold" style={{ color: p.goals > 0 ? '#F9FAFB' : '#4B5563' }}>{p.goals}</td>
                  <td className="px-4 py-2.5 font-bold" style={{ color: p.assists > 0 ? '#F9FAFB' : '#4B5563' }}>{p.assists}</td>
                  <td className="px-4 py-2.5"><FitnessBadge status={p.fitness} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: 'Team Sheet Builder', icon: Clipboard },
          { label: 'Contract Manager', icon: FileText },
          { label: 'Log Injury', icon: Heart },
        ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}>
            <a.icon size={12} />{a.label}
          </button>
        ))}
      </div>

      {/* ═══ Squad Statistics Panel ═══ */}
      <div style={{ borderLeft: '3px solid #6C3FC5', paddingLeft: 12, marginBottom: 16, marginTop: 24 }}><h2 style={{ color: '#F9FAFB', fontSize: 16, fontWeight: 700, margin: 0 }}>Squad Statistics</h2></div>

      <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
        {[{l:'Total Players',v:'23'},{l:'Average Age',v:'24.8 yrs'},{l:'Avg Rating',v:'81.2'},{l:'Internationals',v:'4'},{l:'Academy Grads',v:'6'},{l:'Contracted >2026',v:'11'}].map(s=>(
          <div key={s.l} className="rounded-xl p-4 text-center" style={{backgroundColor:'#0D1017',border:'1px solid #1F2937'}}><p className="text-xl font-black" style={{color:'#F9FAFB'}}>{s.v}</p><p className="text-[10px]" style={{color:'#6B7280'}}>{s.l}</p></div>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{backgroundColor:'#0D1017',border:'1px solid #1F2937'}}>
        <div className="px-5 py-3" style={{borderBottom:'1px solid #1F2937'}}><p className="text-sm font-bold" style={{color:'#F9FAFB'}}>Top Scorers This Season</p></div>
        <table className="w-full text-xs">
          <thead><tr style={{borderBottom:'1px solid #1F2937',backgroundColor:'#111318'}}>
            {['#','Player','Pos','Apps','Goals','Assists','Mins'].map(h=><th key={h} className="text-left py-2 px-4 font-semibold" style={{color:'#6B7280'}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {[{m:'🥇',n:'M. Okafor',p:'ST',a:28,g:16,as:4,mn:'2,340'},{m:'🥈',n:'L. Santos',p:'LW',a:26,g:9,as:7,mn:'2,180'},{m:'🥉',n:'Z. Osei',p:'RW',a:24,g:7,as:5,mn:'1,920'},{m:'',n:'T. Torres',p:'CM',a:30,g:5,as:11,mn:'2,580'},{m:'',n:'B. Hardy',p:'CM',a:28,g:4,as:8,mn:'2,240'}].map(r=>(
              <tr key={r.n} style={{borderBottom:'1px solid #1F2937'}}>
                <td className="py-2 px-4">{r.m}</td>
                <td className="py-2 px-4 font-bold" style={{color:'#F9FAFB'}}>{r.n}</td>
                <td className="py-2 px-4" style={{color:'#6B7280'}}>{r.p}</td>
                <td className="py-2 px-4" style={{color:'#9CA3AF'}}>{r.a}</td>
                <td className="py-2 px-4 font-bold" style={{color:'#22C55E'}}>{r.g}</td>
                <td className="py-2 px-4" style={{color:'#9CA3AF'}}>{r.as}</td>
                <td className="py-2 px-4" style={{color:'#6B7280'}}>{r.mn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl p-5" style={{backgroundColor:'#0D1017',border:'1px solid #1F2937'}}>
        <p className="text-sm font-bold mb-3" style={{color:'#F9FAFB'}}>Player Ratings Distribution</p>
        <div className="space-y-2">
          {[{b:'90+',c:0},{b:'85-89',c:2},{b:'80-84',c:8},{b:'75-79',c:9},{b:'70-74',c:4},{b:'<70',c:0}].map(r=>(
            <div key={r.b} className="flex items-center gap-3">
              <span className="text-xs w-12 shrink-0 text-right" style={{color:'#6B7280'}}>{r.b}</span>
              <div className="flex-1 h-4 rounded" style={{backgroundColor:'#1F2937'}}><div className="h-full rounded" style={{width:`${(r.c/9)*100}%`,backgroundColor:'#6C3FC5',minWidth:r.c>0?4:0}}/></div>
              <span className="text-xs w-6 font-bold" style={{color:'#F9FAFB'}}>{r.c}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{backgroundColor:'#0D1017',border:'1px solid #1F2937'}}>
          <p className="text-sm font-bold mb-3" style={{color:'#F9FAFB'}}>Injury & Availability</p>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-xs" style={{color:'#6B7280'}}>Available</span><span className="text-xs font-bold" style={{color:'#22C55E'}}>19 ✅</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{color:'#6B7280'}}>Suspended</span><span className="text-xs font-bold" style={{color:'#F59E0B'}}>1 🟡</span></div>
            <div className="pt-2" style={{borderTop:'1px solid #1F2937'}}>
              <p className="text-xs font-bold mb-2" style={{color:'#EF4444'}}>Injured (3) 🔴</p>
              {[{n:'J. Walsh',i:'Hamstring',r:'2 weeks'},{n:'D. Cole',i:'Ankle',r:'4 weeks'},{n:'P. Ryan',i:'Illness',r:'TBC'}].map(p=>(
                <div key={p.n} className="flex justify-between py-1"><span className="text-xs" style={{color:'#F9FAFB'}}>{p.n} — {p.i}</span><span className="text-[10px]" style={{color:'#6B7280'}}>{p.r}</span></div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-xl p-5" style={{backgroundColor:'#0D1017',border:'1px solid #1F2937'}}>
          <p className="text-sm font-bold mb-3" style={{color:'#F9FAFB'}}>Contract Expiry Timeline</p>
          <div className="space-y-2">
            {[{n:'J. Hartley',d:'Jun 2025',c:'#EF4444',u:'🔴'},{n:'M. Cross',d:'Jun 2025',c:'#EF4444',u:'🔴'},{n:'T. Shaw',d:'Dec 2025',c:'#F59E0B',u:'🟡'},{n:'L. Adeyemi',d:'Jun 2026',c:'#22C55E',u:'🟢'}].map(p=>(
              <div key={p.n} className="flex items-center justify-between rounded-lg px-3 py-2" style={{backgroundColor:'#0A0B10',border:'1px solid #1F2937'}}>
                <span className="text-xs font-medium" style={{color:'#F9FAFB'}}>{p.n}</span>
                <span className="text-xs font-bold" style={{color:p.c}}>{p.u} {p.d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedPlayer && (
        <PlayerProfileModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          PRIMARY={FB_PRIMARY}
          SECONDARY={FB_SECONDARY}
        />
      )}
    </div>
  )
}

// ─── Tactics View ───────────────────────────────────────────────────────────

function TacticsView({ onActionClick }: { onActionClick?: (label: string) => void }) {
  return (
    <PlaceholderView
      title="Tactics & Formation"
      subtitle="Formation planner, set pieces, and opposition analysis."
      stats={[
        { label: 'Current Formation', value: '4-2-3-1', icon: Clipboard, color: '#003DA5' },
        { label: 'Win Rate', value: '62%', icon: Trophy, color: '#22C55E' },
        { label: 'Goals Scored', value: '48', icon: Target, color: '#3B82F6' },
        { label: 'Clean Sheets', value: '11', icon: Shield, color: '#F59E0B' },
      ]}
      highlights={[
        'Current 4-2-3-1 has a 68% win rate compared to 54% with 4-3-3.',
        'Set piece conversion at 14% — above league average of 11%.',
        'Opposition (Riverside United) weak against high press — 34% turnover rate in own half.',
        'Rafa Correia averages 3.2 key passes per game from right wing.',
      ]}
      actionButtons={[
        { label: 'Formation Builder', icon: Clipboard },
        { label: 'Opposition Report', icon: Eye },
        { label: 'Set Piece Planner', icon: Target },
        { label: 'Video Analysis', icon: Video },
        { label: 'Dept Insights', icon: BarChart3 },
      ]}
      onActionClick={onActionClick}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Recent Formations Used</p>
      </div>
      <div className="space-y-0">
        {[
          { formation: '4-2-3-1', matches: 14, wins: 9, draws: 3, losses: 2 },
          { formation: '4-3-3', matches: 8, wins: 4, draws: 2, losses: 2 },
          { formation: '3-5-2', matches: 4, wins: 3, draws: 0, losses: 1 },
          { formation: '4-4-2', matches: 2, wins: 1, draws: 1, losses: 0 },
        ].map((f, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{f.formation}</span>
              <span className="text-xs" style={{ color: '#6B7280' }}>{f.matches} matches</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span style={{ color: '#22C55E' }}>W{f.wins}</span>
              <span style={{ color: '#F59E0B' }}>D{f.draws}</span>
              <span style={{ color: '#EF4444' }}>L{f.losses}</span>
            </div>
          </div>
        ))}
      </div>
    </PlaceholderView>
  )
}

// ─── Transfers View (with Multi-Step Researcher) ────────────────────────────

function TransfersView({ onActionClick }: { onActionClick?: (label: string) => void }) {
  const [researchStep, setResearchStep] = useState(1)

  const RESEARCH_TARGETS = [
    { name: 'Yannick Diallo', position: 'LB', club: 'KRC Genk', age: 22, value: '£1.8m', fit: 92, summary: 'Athletic left-back, strong in 1v1 duels. 4 assists this season. Suited to overlapping style.' },
    { name: 'Tiago Ferreira', position: 'CM', club: 'SC Braga', age: 24, value: '£1.3m', fit: 87, summary: 'Box-to-box midfielder, high work rate. Press-resistant with 89% pass accuracy.' },
    { name: 'Andrei Popescu', position: 'CB', club: 'CFR Cluj', age: 23, value: '£900k', fit: 78, summary: 'Left-footed centre-back, good distribution. 2 goals from set pieces this season.' },
  ]

  return (
    <PlaceholderView
      title="Transfer Hub"
      subtitle="Target research, negotiations, and budget tracking."
      stats={[
        { label: 'Budget Remaining', value: '£4.2m', icon: DollarSign, color: '#22C55E' },
        { label: 'Active Targets', value: '2', icon: Target, color: '#003DA5' },
        { label: 'Window Closes', value: '11 days', icon: Clock, color: '#F59E0B' },
        { label: 'Bids Submitted', value: '1', icon: ArrowUpDown, color: '#3B82F6' },
      ]}
      highlights={[
        'Diallo bid submitted at £1.8m — Genk countered at £2.1m with 15% sell-on clause.',
        'Ferreira on watchlist. Full video analysis report now available.',
        'Budget: £4.2m remaining. Board approved extra £500k this morning.',
        'Transfer window closes in 11 days. Prioritise Diallo negotiation.',
        'Agent for Popescu has made contact — willing to discuss personal terms.',
      ]}
      actionButtons={[
        { label: 'Submit Bid', icon: DollarSign },
        { label: 'New Target', icon: Plus },
        { label: 'Scout Network', icon: Eye },
        { label: 'Board Approval', icon: Briefcase },
        { label: 'Dept Insights', icon: BarChart3 },
      ]}
      onActionClick={onActionClick}
    >
      {/* Multi-step Researcher */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Transfer Researcher</p>
        <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Use the 4-step process to identify and action transfer targets</p>
      </div>

      {/* Steps indicator */}
      <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #1F2937' }}>
        {['Configure', 'Research', 'Results', 'Action'].map((step, i) => {
          const stepNum = i + 1
          const isActive = researchStep === stepNum
          const isComplete = researchStep > stepNum
          return (
            <React.Fragment key={step}>
              <button onClick={() => setResearchStep(stepNum)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: isActive ? 'rgba(0,61,165,0.15)' : isComplete ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                  color: isActive ? '#F1C40F' : isComplete ? '#22C55E' : '#6B7280',
                  border: isActive ? '1px solid rgba(0,61,165,0.3)' : '1px solid transparent',
                }}>
                {isComplete ? <Check size={10} /> : <span>{stepNum}</span>}
                {step}
              </button>
              {i < 3 && <span style={{ color: '#374151' }}>→</span>}
            </React.Fragment>
          )
        })}
      </div>

      {/* Step content */}
      <div className="p-5">
        {researchStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: '#9CA3AF' }}>Position Needed</label>
                <select className="w-full text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', outline: 'none' }}>
                  <option>Left Back</option><option>Centre Midfielder</option><option>Centre Back</option><option>Striker</option><option>Winger</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: '#9CA3AF' }}>Max Budget</label>
                <select className="w-full text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', outline: 'none' }}>
                  <option>£500k - £1m</option><option>£1m - £2m</option><option>£2m - £3m</option><option>£3m+</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: '#9CA3AF' }}>Age Range</label>
                <select className="w-full text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', outline: 'none' }}>
                  <option>18-23</option><option>21-26</option><option>24-30</option><option>Any</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: '#9CA3AF' }}>League Preference</label>
                <select className="w-full text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', outline: 'none' }}>
                  <option>Any</option><option>Belgian Pro League</option><option>Primeira Liga</option><option>Eredivisie</option><option>Championship</option>
                </select>
              </div>
            </div>
            <button onClick={() => setResearchStep(2)} className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: '#003DA5', color: '#F1C40F' }}>
              Start Research →
            </button>
          </div>
        )}

        {researchStep === 2 && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 size={28} className="animate-spin" style={{ color: '#003DA5' }} />
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Researcher scanning databases...</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>Analysing 2,400+ players across 12 leagues</p>
            <div className="flex gap-2 mt-2">
              {['Stats', 'Video', 'Medical', 'Agent'].map((stage, i) => (
                <span key={stage} className="text-xs px-2 py-1 rounded-lg" style={{
                  backgroundColor: i < 2 ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                  color: i < 2 ? '#22C55E' : '#6B7280',
                }}>{i < 2 ? '✓' : '...'} {stage}</span>
              ))}
            </div>
            <button onClick={() => setResearchStep(3)} className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}>
              Skip to Results →
            </button>
          </div>
        )}

        {researchStep === 3 && (
          <div className="space-y-3">
            <p className="text-xs" style={{ color: '#6B7280' }}>3 targets identified matching your criteria</p>
            {RESEARCH_TARGETS.map((t, i) => (
              <div key={i} className="rounded-xl p-4" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{t.name}</span>
                    <span className="text-xs ml-2" style={{ color: '#6B7280' }}>{t.position} · {t.club} · Age {t.age}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: '#22C55E' }}>{t.value}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      backgroundColor: t.fit >= 90 ? 'rgba(34,197,94,0.12)' : t.fit >= 80 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                      color: t.fit >= 90 ? '#22C55E' : t.fit >= 80 ? '#F59E0B' : '#EF4444',
                    }}>{t.fit}% fit</span>
                  </div>
                </div>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{t.summary}</p>
              </div>
            ))}
            <button onClick={() => setResearchStep(4)} className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: '#003DA5', color: '#F1C40F' }}>
              Take Action →
            </button>
          </div>
        )}

        {researchStep === 4 && (
          <div className="space-y-4">
            <p className="text-xs" style={{ color: '#6B7280' }}>Choose an action for your selected targets</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Submit Bid', desc: 'Create a formal offer and send to the club', icon: DollarSign, color: '#22C55E' },
                { label: 'Request Video Analysis', desc: 'Queue a full match analysis from the scouting team', icon: Video, color: '#3B82F6' },
                { label: 'Contact Agent', desc: 'Send an enquiry to the player\'s representative', icon: Phone, color: '#F59E0B' },
                { label: 'Add to Shortlist', desc: 'Save to your transfer shortlist for board review', icon: Star, color: '#003DA5' },
              ].map((action, i) => (
                <button key={i} className="rounded-xl p-4 text-left transition-all hover:opacity-90" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}
                  onClick={() => setResearchStep(1)}>
                  <div className="flex items-center gap-2 mb-1">
                    <action.icon size={14} style={{ color: action.color }} />
                    <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{action.label}</span>
                  </div>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{action.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </PlaceholderView>
  )
}

// ─── Medical View ───────────────────────────────────────────────────────────

function MedicalView() {
  const [medToast, setMedToast] = useState<string | null>(null)
  function medAction(l: string) { setMedToast(`${l} — opening workflow...`); setTimeout(() => setMedToast(null), 2500) }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Medical Centre</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Injury tracking, rehabilitation, GPS load monitoring, and return-to-play pipeline.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[{ l: 'Log Injury', i: Heart }, { l: 'Return to Play', i: CheckCircle2 }, { l: 'Load Report', i: BarChart3 }, { l: 'Screen Player', i: Eye }, { l: 'Medical Clearance', i: Shield }, { l: 'GPS Report', i: Activity }, { l: 'Dept Insights', i: BarChart3 }].map(a => (
          <button key={a.l} onClick={() => medAction(a.l)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
            style={a.l === 'Dept Insights' ? { backgroundColor: 'transparent', border: '1px solid #F1C40F', color: '#F1C40F' } : { backgroundColor: '#002D7A', color: '#F1C40F' }}>
            <a.i size={12} />{a.l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Currently Injured" value={String(INJURIES.length)} icon={Heart} color="#EF4444" />
        <StatCard label="Modified Training" value="1" icon={Activity} color="#06B6D4" />
        <StatCard label="Full Recovery (7d)" value="1" icon={CheckCircle2} color="#22C55E" />
        <StatCard label="Season Injuries" value="9" icon={AlertCircle} color="#F59E0B" />
      </div>

      {/* Injury Tracker Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Injury Tracker</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Player', 'Injury', 'Treatment Phase', 'Expected Return', 'Days Out'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INJURIES.map((inj, i) => {
                const returnDate = new Date(inj.expectedReturn.replace(/(\d+) (\w+) (\d+)/, '$2 $1, $3'))
                const daysOut = Math.max(0, Math.ceil((returnDate.getTime() - Date.now()) / 86400000))
                return (
                  <tr key={i} style={{ borderBottom: i < INJURIES.length - 1 ? '1px solid #1F2937' : undefined }}>
                    <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{inj.player}</td>
                    <td className="px-5 py-3" style={{ color: '#EF4444' }}>{inj.type}</td>
                    <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-lg text-xs" style={{ backgroundColor: 'rgba(6,182,212,0.12)', color: '#06B6D4' }}>{inj.phase}</span></td>
                    <td className="px-5 py-3" style={{ color: '#F59E0B' }}>{inj.expectedReturn}</td>
                    <td className="px-5 py-3 font-bold" style={{ color: daysOut <= 7 ? '#22C55E' : daysOut <= 14 ? '#F59E0B' : '#EF4444' }}>{daysOut}d</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GPS Training Load */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>GPS Training Load (Yesterday)</p>
          <span className="text-xs" style={{ color: '#6B7280' }}>8 players tracked</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Player', 'Distance (km)', 'Hi-Speed (m)', 'Sprints', 'Max Speed (km/h)', 'Load'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GPS_DATA.map((g, i) => {
                const loadColor = g.load === 'optimal' ? '#22C55E' : g.load === 'high' ? '#F59E0B' : g.load === 'amber' ? '#F97316' : '#EF4444'
                return (
                  <tr key={i} style={{ borderBottom: i < GPS_DATA.length - 1 ? '1px solid #1F2937' : undefined }}>
                    <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{g.player}</td>
                    <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{g.distance.toFixed(1)}</td>
                    <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{g.hiSpeed.toLocaleString()}</td>
                    <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{g.sprints}</td>
                    <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{g.maxSpeed.toFixed(1)}</td>
                    <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-lg text-xs font-semibold uppercase" style={{ backgroundColor: `${loadColor}1a`, color: loadColor }}>{g.load}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GPS Injury Risk — ACWR Alerts */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid rgba(239,68,68,0.4)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937', backgroundColor: 'rgba(239,68,68,0.05)' }}>
          <div className="flex items-center gap-2">
            <Activity size={14} style={{ color: '#EF4444' }} />
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>GPS Injury Risk — ACWR Monitoring</p>
          </div>
          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>Live GPS Data</span>
        </div>
        <div className="p-5 space-y-3">
          {[
            { player: "Sean O'Brien", acwr: 1.58, load: 478, note: 'Steady increase over 8 weeks. Rest recommended — remove from starting XI consideration.' },
            { player: 'Diego Martinez', acwr: 1.48, load: 298, note: 'Returning from injury — load ramp too aggressive. Reduce intensity for next 2 sessions.' },
            { player: 'Jamie Wilson', acwr: 1.42, load: 456, note: 'Match-to-training spike of +47%. Conditioning concern — increase training intensity or limit match minutes.' },
            { player: 'Jamal Henderson', acwr: 1.35, load: 445, note: 'Two consecutive match starts caused spike. One training rest day recommended.' },
          ].map((p, i) => {
            const color = p.acwr > 1.5 ? '#EF4444' : '#F59E0B'
            const label = p.acwr > 1.5 ? 'HIGH RISK' : 'CAUTION'
            return (
              <div key={i} className="rounded-lg p-4" style={{ backgroundColor: '#0A0B10', border: `1px solid ${color}33` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{p.acwr > 1.5 ? '🔴' : '🟡'}</span>
                    <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{p.player}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${color}1a`, color }}>{label}</span>
                    <span className="text-xs font-mono" style={{ color }}>ACWR {p.acwr.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{p.note}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs" style={{ color: '#6B7280' }}>Load: {p.load}</span>
                  <button onClick={() => medAction('Add medical note')} className="text-xs font-semibold" style={{ color: '#003DA5' }}>+ Add Note</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Return to Play Pipeline */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Return to Play Pipeline</p>
        </div>
        <div className="p-5 space-y-3">
          {[
            { player: 'Lucas Santos', stages: ['Diagnosis', 'Treatment', 'Rehab', 'Light Training', 'Full Training', 'Match Ready'], current: 3 },
            { player: 'Diego Martinez', stages: ['Diagnosis', 'Treatment', 'Rehab', 'Light Training', 'Full Training', 'Match Ready'], current: 2 },
            { player: "Sean O'Brien", stages: ['Diagnosis', 'Treatment', 'Rehab', 'Light Training', 'Full Training', 'Match Ready'], current: 1 },
          ].map((p, pi) => (
            <div key={pi} className="rounded-lg p-4" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
              <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>{p.player}</p>
              <div className="flex items-center gap-1">
                {p.stages.map((stage, si) => (
                  <div key={si} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full h-2 rounded-full" style={{ backgroundColor: si <= p.current ? '#22C55E' : '#1F2937' }} />
                    <span className="text-[10px]" style={{ color: si <= p.current ? '#22C55E' : '#4B5563' }}>{stage}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Injury Season Comparison */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Injury Season Comparison</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {[
            { label: 'Total Injuries', thisYear: '9', lastYear: '14', better: true },
            { label: 'Muscle Injuries', thisYear: '4', lastYear: '8', better: true },
            { label: 'Days Lost', thisYear: '142', lastYear: '231', better: true },
            { label: 'Avg Recovery (d)', thisYear: '15.8', lastYear: '16.5', better: true },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center py-4 px-3" style={{ borderRight: i < 3 ? '1px solid #1F2937' : undefined }}>
              <span className="text-xs mb-1" style={{ color: '#6B7280' }}>{s.label}</span>
              <span className="text-lg font-black" style={{ color: '#F9FAFB' }}>{s.thisYear}</span>
              <span className="text-xs mt-0.5" style={{ color: s.better ? '#22C55E' : '#EF4444' }}>
                vs {s.lastYear} last season {s.better ? '↓' : '↑'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: 'Log Injury', icon: Heart },
          { label: 'Rehab Plan', icon: Activity },
          { label: 'Fitness Report', icon: FileText },
          { label: 'Dept Insights', icon: BarChart3 },
        ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={a.label === 'Dept Insights' ? { backgroundColor: 'transparent', border: '1px solid #F1C40F', color: '#F1C40F' } : { backgroundColor: '#002D7A', color: '#F1C40F' }}>
            <a.icon size={12} />{a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Scouting View ──────────────────────────────────────────────────────────

function ScoutingView() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Scouting Network</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Scout reports, watchlists, recruitment pipeline, and target tracking.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: 'New Report', icon: FileText },
          { label: 'Watchlist', icon: Star },
          { label: 'Trip Planner', icon: MapPin },
          { label: 'Dept Insights', icon: BarChart3 },
        ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={a.label === 'Dept Insights' ? { backgroundColor: 'transparent', border: '1px solid #F1C40F', color: '#F1C40F' } : { backgroundColor: '#002D7A', color: '#F1C40F' }}>
            <a.icon size={12} />{a.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Scouts Active" value="4" icon={Eye} color="#003DA5" />
        <StatCard label="Reports This Month" value="12" icon={FileText} color="#3B82F6" />
        <StatCard label="Watchlist" value={String(SCOUT_TARGETS.length)} icon={Star} color="#F59E0B" />
        <StatCard label="Leagues Covered" value="6" icon={MapPin} color="#22C55E" />
      </div>

      {/* Scout Targets Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Active Targets</p>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>{SCOUT_TARGETS.length} targets</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Player', 'Pos', 'Age', 'Club', 'Nat', 'Value', 'Contract', 'Rating', 'Status', 'Notes'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SCOUT_TARGETS.map((t, i) => {
                const statusColor = t.status === 'Bid Submitted' ? '#22C55E' : t.status === 'Approached' ? '#3B82F6' : t.status === 'Shortlisted' ? '#F59E0B' : '#6B7280'
                return (
                  <tr key={i} style={{ borderBottom: i < SCOUT_TARGETS.length - 1 ? '1px solid #1F2937' : undefined }} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{t.name}</td>
                    <td className="px-4 py-3"><span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,61,165,0.1)', color: '#F1C40F' }}>{t.position}</span></td>
                    <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{t.age}</td>
                    <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{t.club}</td>
                    <td className="px-4 py-3">{t.nationality}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#22C55E' }}>{t.value}</td>
                    <td className="px-4 py-3" style={{ color: t.contract === 'Jun 2025' ? '#EF4444' : '#9CA3AF' }}>{t.contract}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <span key={si} style={{ color: si < t.rating ? '#F59E0B' : '#374151' }}>★</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: `${statusColor}1a`, color: statusColor }}>{t.status}</span></td>
                    <td className="px-4 py-3" style={{ color: '#6B7280' }}>{t.notes}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scout Assignments */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Scout Assignments</p>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          {[
            { scout: 'Mark Evans', region: 'Belgium / Netherlands', currentTrip: 'KRC Genk vs Club Brugge (Fri)', targets: 2, reports: 5 },
            { scout: 'Carlos Mendes', region: 'Portugal / Spain', currentTrip: 'SC Braga vs Benfica (Sat)', targets: 1, reports: 4 },
            { scout: 'Jan Bakker', region: 'Netherlands / Denmark', currentTrip: 'Ajax U21 vs PSV U21 (Fri)', targets: 1, reports: 2 },
            { scout: 'Pierre Dumont', region: 'France / Belgium', currentTrip: 'Metz vs Auxerre (Sun)', targets: 1, reports: 1 },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(0,61,165,0.1)', color: '#F1C40F' }}>
                  {s.scout.split(' ').map(w => w[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{s.scout}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{s.region}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{s.currentTrip}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>{s.targets} targets · {s.reports} reports</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Recent Scout Reports</p>
        </div>
        {[
          { player: 'Rui Silva', scout: 'Mark Evans', league: 'Belgian Pro League', rating: 'A', date: '25 Mar' },
          { player: 'André Costa', scout: 'Carlos Mendes', league: 'Primeira Liga', rating: 'A-', date: '22 Mar' },
          { player: "Jean-Marc N'Golo", scout: 'Pierre Dumont', league: 'Ligue 2', rating: 'B+', date: '20 Mar' },
          { player: 'Kasper Eriksen', scout: 'Jan Bakker', league: 'Danish Superliga', rating: 'B', date: '18 Mar' },
          { player: 'Liam Brennan', scout: 'Mark Evans', league: 'League of Ireland', rating: 'B-', date: '15 Mar' },
        ].map((r, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{r.player}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{r.scout} · {r.league}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: r.rating.startsWith('A') ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', color: r.rating.startsWith('A') ? '#22C55E' : '#F59E0B' }}>{r.rating}</span>
              <span className="text-xs" style={{ color: '#6B7280' }}>{r.date}</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

// ─── Academy View ───────────────────────────────────────────────────────────

function AcademyView({ onActionClick }: { onActionClick?: (label: string) => void }) {
  return (
    <PlaceholderView
      title="Academy"
      subtitle="Youth development, scholarships, and first-team pathway."
      stats={[
        { label: 'Academy Players', value: '42', icon: GraduationCap, color: '#F97316' },
        { label: 'U21 Record', value: 'W8 D2 L1', icon: Trophy, color: '#22C55E' },
        { label: 'First-Team Ready', value: '3', icon: Star, color: '#003DA5' },
        { label: 'Scholarships', value: '4', icon: FileText, color: '#3B82F6' },
      ]}
      highlights={[
        'Josh Collins (17, ST) hat-trick in U21s — strong first-team bench candidate.',
        'Alfie Morgan (16, CM) rated as generational talent by youth coaching staff.',
        'Rhys Okonkwo (18, CB) dominant aerially — bench squad inclusion pending.',
        'Elijah Shaw (17, LW) — 7 assists in last 8 U18 appearances.',
        'U21s won 3-0 yesterday. Unbeaten in last 6 matches.',
      ]}
      actionButtons={[
        { label: 'Promote to First Team', icon: ArrowRight },
        { label: 'Development Plan', icon: FileText },
        { label: 'Scholarship Offers', icon: GraduationCap },
        { label: 'Dept Insights', icon: BarChart3 },
      ]}
      onActionClick={onActionClick}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Standout Academy Players</p>
      </div>
      {ACADEMY_PLAYERS.map((p, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: i < ACADEMY_PLAYERS.length - 1 ? '1px solid #1F2937' : undefined }}>
          <div>
            <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{p.name} <span className="text-xs" style={{ color: '#6B7280' }}>Age {p.age} · {p.position}</span></p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{p.highlight}</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(249,115,22,0.12)', color: '#F97316' }}>Standout</span>
        </div>
      ))}
    </PlaceholderView>
  )
}

// ─── Pitch Diagram ──────────────────────────────────────────────────────────

function PitchDiagram({ positions, onPlayerClick }: { positions: { num: number; x: number; y: number; name: string }[]; onPlayerClick?: (name: string) => void }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full" style={{ maxHeight: 400 }}>
      {/* Pitch background */}
      <rect x="0" y="0" width="100" height="100" fill="#2d5a27" rx="2" />
      {/* Pitch markings */}
      <rect x="5" y="5" width="90" height="90" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
      <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
      <circle cx="50" cy="50" r="9" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
      <circle cx="50" cy="50" r="0.5" fill="rgba(255,255,255,0.4)" />
      {/* Penalty areas */}
      <rect x="25" y="5" width="50" height="16" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
      <rect x="35" y="5" width="30" height="6" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
      <rect x="25" y="79" width="50" height="16" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
      <rect x="35" y="89" width="30" height="6" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
      {/* Players */}
      {positions.map(p => (
        <g key={p.num} onClick={() => onPlayerClick?.(p.name)} style={{ cursor: 'pointer' }}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#003DA5" stroke="white" strokeWidth="0.4" />
          <text x={p.x} y={p.y + 0.8} textAnchor="middle" fill="white" fontSize="2.2" fontWeight="bold">{p.num}</text>
          <text x={p.x} y={p.y + 5.5} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="1.8">{p.name}</text>
        </g>
      ))}
    </svg>
  )
}

// ─── Generic Dept Views ─────────────────────────────────────────────────────

function AnalyticsView() {
  const [selectedMatch, setSelectedMatch] = useState(0)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)

  const currentFormation = MATCH_FORMATIONS[selectedMatch]

  const [anToast, setAnToast] = useState<string | null>(null)
  function anAction(l: string) { setAnToast(`${l} — opening workflow...`); setTimeout(() => setAnToast(null), 2500) }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Performance Analytics</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>xG, formations, match stats, and AI-powered analysis.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[{ l: 'Match Report', i: FileText }, { l: 'Opposition Analysis', i: Search }, { l: 'Set Piece Review', i: Target }, { l: 'Formation Builder', i: Clipboard }, { l: 'Video Session', i: Video }, { l: 'Stats Report', i: BarChart3 }, { l: 'Dept Insights', i: BarChart3 }].map(a => (
          <button key={a.l} onClick={() => anAction(a.l)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
            style={a.l === 'Dept Insights' ? { backgroundColor: 'transparent', border: '1px solid #F1C40F', color: '#F1C40F' } : { backgroundColor: '#002D7A', color: '#F1C40F' }}>
            <a.i size={12} />{a.l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="xG (Season)" value="42.6" icon={BarChart3} color="#003DA5" />
        <StatCard label="xGA (Season)" value="28.3" icon={Shield} color="#3B82F6" />
        <StatCard label="Possession Avg" value="58%" icon={Activity} color="#22C55E" />
        <StatCard label="Pass Accuracy" value="84%" icon={Target} color="#F59E0B" />
      </div>

      {/* Formation Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Formation Viewer</p>
            <select value={selectedMatch} onChange={e => { setSelectedMatch(Number(e.target.value)); setSelectedPlayer(null) }} className="text-xs rounded-lg px-2 py-1" style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', outline: 'none' }}>
              {MATCH_FORMATIONS.map((m, i) => <option key={i} value={i}>{m.match} ({m.formation})</option>)}
            </select>
          </div>
          <div className="p-4">
            <PitchDiagram positions={currentFormation.positions} onPlayerClick={name => setSelectedPlayer(name === selectedPlayer ? null : name)} />
          </div>
        </div>

        {/* Match Stats */}
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Match Stats — {currentFormation.match}</p>
            </div>
            <div className="grid grid-cols-5 gap-0">
              {[
                { label: 'Poss', value: `${currentFormation.stats.possession}%` },
                { label: 'Shots', value: String(currentFormation.stats.shots) },
                { label: 'xG', value: currentFormation.stats.xG.toFixed(2) },
                { label: 'Passes', value: String(currentFormation.stats.passes) },
                { label: 'Duels', value: `${currentFormation.stats.duels}%` },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center py-4" style={{ borderRight: i < 4 ? '1px solid #1F2937' : undefined }}>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{s.label}</span>
                  <span className="text-lg font-black" style={{ color: '#F9FAFB' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Player Modal */}
          {selectedPlayer && (
            <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #003DA5' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{selectedPlayer} — Match Stats</p>
                <button onClick={() => setSelectedPlayer(null)} className="p-1 rounded" style={{ color: '#6B7280' }}><X size={14} /></button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Passes', value: String(Math.floor(Math.random() * 40 + 20)) },
                  { label: 'Pass %', value: `${Math.floor(Math.random() * 15 + 80)}%` },
                  { label: 'Duels Won', value: `${Math.floor(Math.random() * 8 + 2)}/${Math.floor(Math.random() * 5 + 8)}` },
                  { label: 'Touches', value: String(Math.floor(Math.random() * 50 + 30)) },
                  { label: 'Distance', value: `${(Math.random() * 4 + 8).toFixed(1)}km` },
                  { label: 'Rating', value: (Math.random() * 2 + 6.5).toFixed(1) },
                ].map((s, i) => (
                  <div key={i} className="rounded-lg p-3 text-center" style={{ backgroundColor: '#0A0B10' }}>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{s.label}</p>
                    <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Season Formation Summary */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Season Formation Summary</p>
            </div>
            {[
              { formation: '4-3-3', matches: 14, wins: 9, winRate: '64%' },
              { formation: '4-2-3-1', matches: 8, wins: 5, winRate: '63%' },
              { formation: '3-5-2', matches: 4, wins: 3, winRate: '75%' },
              { formation: '4-4-2', matches: 2, wins: 0, winRate: '0%' },
            ].map((f, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{f.formation}</span>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{f.matches} matches</span>
                </div>
                <span className="text-xs font-bold" style={{ color: '#22C55E' }}>{f.winRate} win rate</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Set Piece Record */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Set Piece Record</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {[
            { label: 'Corner Goals', value: '6', total: '142 corners', rate: '4.2%' },
            { label: 'Free Kick Goals', value: '3', total: '48 attempts', rate: '6.3%' },
            { label: 'Penalties', value: '4/5', total: '80% conversion', rate: '' },
            { label: 'Throw-in Chances', value: '8', total: 'Long throws', rate: '' },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center py-4 px-3" style={{ borderRight: i < 3 ? '1px solid #1F2937' : undefined }}>
              <span className="text-xs mb-1" style={{ color: '#6B7280' }}>{s.label}</span>
              <span className="text-lg font-black" style={{ color: '#F9FAFB' }}>{s.value}</span>
              <span className="text-xs" style={{ color: '#9CA3AF' }}>{s.total}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Last 5 Matches */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Last 5 Matches — Key Metrics</p>
        </div>
        {[
          { match: 'Wimbledon 2-1 Riverside', xg: '1.8', xga: '0.9', poss: '62%', date: '22 Mar' },
          { match: 'Ashford 0-0 Wimbledon', xg: '0.4', xga: '1.1', poss: '47%', date: '15 Mar' },
          { match: 'Wimbledon 3-2 Millfield', xg: '2.4', xga: '1.6', poss: '55%', date: '8 Mar' },
          { match: 'Crestwood 1-2 Wimbledon', xg: '1.9', xga: '1.2', poss: '51%', date: '1 Mar' },
          { match: 'Wimbledon 1-0 Lakeside', xg: '1.1', xga: '0.7', poss: '59%', date: '22 Feb' },
        ].map((m, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{m.match}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{m.date}</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span style={{ color: '#22C55E' }}>xG {m.xg}</span>
              <span style={{ color: '#EF4444' }}>xGA {m.xga}</span>
              <span style={{ color: '#9CA3AF' }}>{m.poss}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: 'Match Report', icon: FileText },
          { label: 'Player Comparison', icon: Users },
          { label: 'Heat Maps', icon: BarChart3 },
          { label: 'Video Clips', icon: Video },
          { label: 'Dept Insights', icon: BarChart3 },
        ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={a.label === 'Dept Insights' ? { backgroundColor: 'transparent', border: '1px solid #F1C40F', color: '#F1C40F' } : { backgroundColor: '#002D7A', color: '#F1C40F' }}>
            <a.icon size={12} />{a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function MediaView() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Media & PR</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Press conferences, media requests, social media, and public relations.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: 'Press Brief', icon: FileText },
          { label: 'Social Post', icon: MessageSquare },
          { label: 'Media Schedule', icon: Calendar },
          { label: 'Dept Insights', icon: BarChart3 },
        ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={a.label === 'Dept Insights' ? { backgroundColor: 'transparent', border: '1px solid #F1C40F', color: '#F1C40F' } : { backgroundColor: '#002D7A', color: '#F1C40F' }}>
            <a.icon size={12} />{a.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Press Conf Today" value="2pm" icon={Newspaper} color="#8B5CF6" />
        <StatCard label="Media Requests" value="4" icon={MessageSquare} color="#3B82F6" />
        <StatCard label="Social Followers" value="124k" icon={Users} color="#003DA5" />
        <StatCard label="Press Coverage" value="+12%" icon={TrendingUp} color="#22C55E" />
      </div>

      {/* Media Requests Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Pending Media Requests</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Outlet', 'Type', 'Subject', 'Deadline', 'Status', 'Recommendation'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { outlet: 'BBC Sport', type: 'Interview', subject: 'Pre-match preview', deadline: 'Thu PM', status: 'Pending', rec: 'Accept', recColor: '#22C55E' },
                { outlet: 'Sky Sports', type: 'Comment', subject: 'Diallo transfer rumour', deadline: 'Today', status: 'Urgent', rec: 'No comment', recColor: '#EF4444' },
                { outlet: 'Local Gazette', type: 'Access', subject: 'Fan forum coverage', deadline: 'Thu Eve', status: 'Pending', rec: 'Accept', recColor: '#22C55E' },
                { outlet: 'TalkSport', type: 'Phone-in', subject: 'Weekend preview', deadline: 'Fri AM', status: 'New', rec: 'Decline — schedule clash', recColor: '#F59E0B' },
              ].map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1F2937' }} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{r.outlet}</td>
                  <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{r.type}</td>
                  <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{r.subject}</td>
                  <td className="px-4 py-3" style={{ color: r.status === 'Urgent' ? '#EF4444' : '#9CA3AF' }}>{r.deadline}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: r.status === 'Urgent' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)', color: r.status === 'Urgent' ? '#EF4444' : '#3B82F6' }}>{r.status}</span></td>
                  <td className="px-4 py-3 font-semibold" style={{ color: r.recColor }}>{r.rec}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Social Media Performance */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Social Media Performance (7 days)</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {[
            { platform: 'X / Twitter', followers: '68.2k', engagement: '+18%', color: '#1DA1F2' },
            { platform: 'Instagram', followers: '42.1k', engagement: '+12%', color: '#E4405F' },
            { platform: 'Facebook', followers: '11.4k', engagement: '+5%', color: '#1877F2' },
            { platform: 'TikTok', followers: '2.3k', engagement: '+34%', color: '#FE2C55' },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center py-4 px-3" style={{ borderRight: i < 3 ? '1px solid #1F2937' : undefined }}>
              <span className="text-xs mb-1" style={{ color: s.color }}>{s.platform}</span>
              <span className="text-lg font-black" style={{ color: '#F9FAFB' }}>{s.followers}</span>
              <span className="text-xs font-semibold" style={{ color: '#22C55E' }}>{s.engagement}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Press Conference Schedule */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Press Conference Schedule</p>
        </div>
        {[
          { time: 'Today 2:00pm', event: 'Pre-match press conference', venue: 'Media Suite', briefing: 'AI notes ready', status: 'Confirmed' },
          { time: 'Sat 1:00pm', event: 'Matchday flash interview zone', venue: 'Tunnel Area', briefing: 'Pending', status: 'Scheduled' },
          { time: 'Sat 5:15pm', event: 'Post-match press conference', venue: 'Media Suite', briefing: 'Auto-generated post-match', status: 'Scheduled' },
        ].map((e, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold w-24" style={{ color: '#9CA3AF' }}>{e.time}</span>
              <div>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{e.event}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>{e.venue} · {e.briefing}</p>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-lg font-semibold" style={{ backgroundColor: e.status === 'Confirmed' ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.12)', color: e.status === 'Confirmed' ? '#22C55E' : '#3B82F6' }}>{e.status}</span>
          </div>
        ))}
      </div>

    </div>
  )
}

function MatchdayView() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Match Day Operations</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Matchday logistics, team sheet, ticketing, and operational checklists.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: 'Team Sheet', icon: Clipboard },
          { label: 'Operations Checklist', icon: CheckCircle2 },
          { label: 'Ticketing', icon: FileText },
          { label: 'Dept Insights', icon: BarChart3 },
        ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={a.label === 'Dept Insights' ? { backgroundColor: 'transparent', border: '1px solid #F1C40F', color: '#F1C40F' } : { backgroundColor: '#002D7A', color: '#F1C40F' }}>
            <a.icon size={12} />{a.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Next Match" value="Sat 4 Apr" icon={Calendar} color="#003DA5" />
        <StatCard label="Kick Off" value="15:00" icon={Clock} color="#3B82F6" />
        <StatCard label="Expected Attendance" value="8,200" icon={Users} color="#22C55E" />
        <StatCard label="Matchday Revenue" value="£42k" icon={DollarSign} color="#F59E0B" />
      </div>

      {/* Operations Checklist */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Operations Checklist</p>
          <span className="text-xs font-bold" style={{ color: '#22C55E' }}>14/22 complete</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          {[
            { task: 'Pitch inspection', status: 'done' }, { task: 'Referee confirmation', status: 'done' },
            { task: 'Team sheet submitted', status: 'pending' }, { task: 'Corporate hospitality setup', status: 'done' },
            { task: 'Steward briefing', status: 'pending' }, { task: 'PA system check', status: 'done' },
            { task: 'First aid stations ready', status: 'done' }, { task: 'Media accreditation', status: 'pending' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: item.status === 'done' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', color: item.status === 'done' ? '#22C55E' : '#F59E0B' }}>
                  {item.status === 'done' ? '✓' : '○'}
                </span>
                <span className="text-sm" style={{ color: '#F9FAFB' }}>{item.task}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-lg" style={{ backgroundColor: item.status === 'done' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', color: item.status === 'done' ? '#22C55E' : '#F59E0B' }}>{item.status === 'done' ? 'Complete' : 'Pending'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ticketing */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Ticketing & Attendance</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {[
            { label: 'General', sold: 6800, capacity: 8000 },
            { label: 'Away', sold: 620, capacity: 800 },
            { label: 'Corporate', sold: 280, capacity: 300 },
            { label: 'Season Tickets', sold: 4200, capacity: 4200 },
          ].map((t, i) => (
            <div key={i} className="flex flex-col items-center py-4 px-3" style={{ borderRight: i < 3 ? '1px solid #1F2937' : undefined }}>
              <span className="text-xs mb-1" style={{ color: '#6B7280' }}>{t.label}</span>
              <span className="text-lg font-black" style={{ color: '#F9FAFB' }}>{t.sold.toLocaleString()}</span>
              <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2">
                <div className="h-1.5 rounded-full" style={{ width: `${(t.sold / t.capacity) * 100}%`, backgroundColor: t.sold / t.capacity > 0.9 ? '#22C55E' : '#F59E0B' }} />
              </div>
              <span className="text-xs mt-1" style={{ color: '#6B7280' }}>{Math.round((t.sold / t.capacity) * 100)}% sold</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// ─── Performance & GPS View ─────────────────────────────────────────────────

type PerfTab = 'session' | 'readiness' | 'trends' | 'match-vs-training' | 'connect'

const GPS_SESSIONS_DEMO = [
  { date: '2026-03-31', type: 'training', name: 'Tactical Session — Set Pieces', players: 22 },
  { date: '2026-03-29', type: 'match', name: 'vs Millwall (H) — W 2-1', players: 14 },
  { date: '2026-03-28', type: 'training', name: 'Recovery & Activation', players: 18 },
  { date: '2026-03-27', type: 'training', name: 'High Intensity Pressing', players: 22 },
  { date: '2026-03-25', type: 'training', name: 'Possession & Build-Up', players: 20 },
]

const GPS_PLAYER_DEMO = [
  { name: 'Ryan Thompson', distance: 11.4, hsr: 1680, sprints: 28, maxSpeed: 33.8, load: 420, acwr: 1.12, status: 'optimal' as const },
  { name: 'Jamal Henderson', distance: 10.8, hsr: 1550, sprints: 42, maxSpeed: 34.2, load: 445, acwr: 1.35, status: 'caution' as const },
  { name: 'Marcus Cole', distance: 9.2, hsr: 620, sprints: 12, maxSpeed: 28.4, load: 310, acwr: 0.92, status: 'optimal' as const },
  { name: "Sean O'Brien", distance: 10.1, hsr: 1490, sprints: 36, maxSpeed: 34.8, load: 478, acwr: 1.58, status: 'high-risk' as const },
  { name: 'Kwame Okafor', distance: 10.6, hsr: 1380, sprints: 30, maxSpeed: 33.1, load: 398, acwr: 1.02, status: 'optimal' as const },
  { name: 'Lucas Santos', distance: 9.8, hsr: 890, sprints: 18, maxSpeed: 30.6, load: 280, acwr: 0.72, status: 'under' as const },
  { name: 'Alex Collins', distance: 10.2, hsr: 1420, sprints: 34, maxSpeed: 33.1, load: 412, acwr: 1.18, status: 'optimal' as const },
  { name: 'Jamie Wilson', distance: 11.1, hsr: 1620, sprints: 38, maxSpeed: 35.2, load: 456, acwr: 1.42, status: 'caution' as const },
  { name: 'Tom Richards', distance: 8.4, hsr: 520, sprints: 10, maxSpeed: 26.8, load: 245, acwr: 0.85, status: 'optimal' as const },
  { name: 'Jake Phillips', distance: 9.0, hsr: 640, sprints: 14, maxSpeed: 29.2, load: 322, acwr: 0.95, status: 'optimal' as const },
  { name: 'Diego Martinez', distance: 8.8, hsr: 580, sprints: 11, maxSpeed: 27.6, load: 298, acwr: 1.48, status: 'caution' as const },
  { name: 'James Walker', distance: 5.8, hsr: 320, sprints: 4, maxSpeed: 24.2, load: 165, acwr: 0.88, status: 'optimal' as const },
]

const WEEKLY_LOAD_DEMO = [
  { week: 'W1', 'Ryan Thompson': 380, 'Jamal Henderson': 420, "Sean O'Brien": 350, 'Kwame Okafor': 360, avg: 378 },
  { week: 'W2', 'Ryan Thompson': 395, 'Jamal Henderson': 410, "Sean O'Brien": 380, 'Kwame Okafor': 375, avg: 390 },
  { week: 'W3', 'Ryan Thompson': 410, 'Jamal Henderson': 430, "Sean O'Brien": 420, 'Kwame Okafor': 390, avg: 413 },
  { week: 'W4', 'Ryan Thompson': 390, 'Jamal Henderson': 440, "Sean O'Brien": 445, 'Kwame Okafor': 385, avg: 415 },
  { week: 'W5', 'Ryan Thompson': 420, 'Jamal Henderson': 435, "Sean O'Brien": 460, 'Kwame Okafor': 400, avg: 429 },
  { week: 'W6', 'Ryan Thompson': 405, 'Jamal Henderson': 445, "Sean O'Brien": 470, 'Kwame Okafor': 395, avg: 429 },
  { week: 'W7', 'Ryan Thompson': 415, 'Jamal Henderson': 440, "Sean O'Brien": 475, 'Kwame Okafor': 398, avg: 432 },
  { week: 'W8', 'Ryan Thompson': 420, 'Jamal Henderson': 445, "Sean O'Brien": 478, 'Kwame Okafor': 412, avg: 439 },
]

const MATCH_VS_TRAIN_DEMO = [
  { name: 'Ryan Thompson', matchDist: 11.4, trainDist: 9.8, matchHSR: 1680, trainHSR: 1220, matchLoad: 420, trainLoad: 340, diff: '+24%' },
  { name: 'Jamal Henderson', matchDist: 10.8, trainDist: 10.2, matchHSR: 1550, trainHSR: 1380, matchLoad: 445, trainLoad: 410, diff: '+9%' },
  { name: "Sean O'Brien", matchDist: 10.1, trainDist: 9.5, matchHSR: 1490, trainHSR: 1100, matchLoad: 478, trainLoad: 350, diff: '+37%' },
  { name: 'Kwame Okafor', matchDist: 10.6, trainDist: 10.0, matchHSR: 1380, trainHSR: 1280, matchLoad: 398, trainLoad: 370, diff: '+8%' },
  { name: 'Jamie Wilson', matchDist: 11.1, trainDist: 9.2, matchHSR: 1620, trainHSR: 1050, matchLoad: 456, trainLoad: 310, diff: '+47%' },
  { name: 'Alex Collins', matchDist: 10.2, trainDist: 9.6, matchHSR: 1420, trainHSR: 1200, matchLoad: 412, trainLoad: 360, diff: '+14%' },
]

function PerformanceGPSView() {
  const [tab, setTab] = useState<PerfTab>('session')
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [connectToken, setConnectToken] = useState('')
  const [connectProvider, setConnectProvider] = useState<'catapult' | 'statsports'>('catapult')

  const acwrColor = (acwr: number) => acwr > 1.5 ? '#EF4444' : acwr > 1.3 ? '#F59E0B' : acwr < 0.8 ? '#3B82F6' : '#22C55E'
  const acwrLabel = (acwr: number) => acwr > 1.5 ? 'High Risk' : acwr > 1.3 ? 'Caution' : acwr < 0.8 ? 'Under-trained' : 'Optimal'
  const statusIcon = (acwr: number) => acwr > 1.5 ? '🔴' : acwr > 1.3 ? '🟡' : acwr < 0.8 ? '🔵' : '🟢'
  const readinessLabel = (acwr: number) => acwr > 1.5 ? 'Rest recommended' : acwr > 1.3 ? 'Manage load' : acwr < 0.8 ? 'Build load' : 'Ready to play'

  const readyCt = GPS_PLAYER_DEMO.filter(p => p.acwr >= 0.8 && p.acwr <= 1.3).length
  const cautionCt = GPS_PLAYER_DEMO.filter(p => p.acwr > 1.3 && p.acwr <= 1.5).length
  const riskCt = GPS_PLAYER_DEMO.filter(p => p.acwr > 1.5).length
  const underCt = GPS_PLAYER_DEMO.filter(p => p.acwr < 0.8).length

  const perfTabs: { id: PerfTab; label: string }[] = [
    { id: 'session', label: 'Session Overview' },
    { id: 'readiness', label: 'Player Readiness' },
    { id: 'trends', label: 'Load Trends' },
    { id: 'match-vs-training', label: 'Match vs Training' },
    { id: 'connect', label: 'Connect GPS' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Performance & GPS</h2>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>GPS wearables data, player load monitoring, ACWR injury risk, and squad readiness.</p>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: '#F1C40F', border: '1px solid rgba(0,61,165,0.4)' }}>Industry First</span>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: 'Sync GPS Data', icon: Activity },
          { label: 'Load Report', icon: BarChart3 },
          { label: 'Readiness Check', icon: CheckCircle2 },
          { label: 'Upload CSV', icon: FileText },
          { label: 'Dept Insights', icon: BarChart3 },
        ].map((a, i) => (
          <button key={i} onClick={() => { setToast(`${a.label} — opening workflow...`); setTimeout(() => setToast(null), 2500) }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
            style={a.label === 'Dept Insights' ? { backgroundColor: 'transparent', border: '1px solid #F1C40F', color: '#F1C40F' } : { backgroundColor: '#002D7A', color: '#F1C40F' }}>
            <a.icon size={12} />{a.label}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Ready to Play" value={String(readyCt)} icon={CheckCircle2} color="#22C55E" />
        <StatCard label="Manage Load" value={String(cautionCt)} icon={AlertCircle} color="#F59E0B" />
        <StatCard label="Injury Risk" value={String(riskCt)} icon={Heart} color="#EF4444" />
        <StatCard label="Last Session" value={GPS_SESSIONS_DEMO[0].date.split('-').slice(1).join('/')} icon={Activity} color="#003DA5" />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto" style={{ borderBottom: '1px solid #1F2937' }}>
        {perfTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors"
            style={{
              color: tab === t.id ? '#F9FAFB' : '#6B7280',
              borderBottom: tab === t.id ? '2px solid #003DA5' : '2px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1 — SESSION OVERVIEW */}
      {tab === 'session' && (
        <div className="space-y-4">
          {/* Recent Sessions */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Recent Sessions</p>
              <span className="text-xs" style={{ color: '#6B7280' }}>{GPS_SESSIONS_DEMO.length} sessions</span>
            </div>
            <div className="divide-y" style={{ borderColor: '#1F2937' }}>
              {GPS_SESSIONS_DEMO.map((s, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                      style={{ backgroundColor: s.type === 'match' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)', color: s.type === 'match' ? '#EF4444' : '#3B82F6' }}>
                      {s.type}
                    </span>
                    <span className="text-sm" style={{ color: '#F9FAFB' }}>{s.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs" style={{ color: '#6B7280' }}>{s.players} players</span>
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{s.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Latest Session Player Breakdown */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Player Breakdown — {GPS_SESSIONS_DEMO[0].name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{GPS_SESSIONS_DEMO[0].date} &middot; {GPS_SESSIONS_DEMO[0].type}</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span style={{ color: '#22C55E' }}>● Normal</span>
                <span style={{ color: '#F59E0B' }}>● High</span>
                <span style={{ color: '#EF4444' }}>● Very High</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1F2937' }}>
                    {['Player', 'Distance (km)', 'HSR (m)', 'Sprints', 'Max Speed', 'Load', 'ACWR', 'Status'].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...GPS_PLAYER_DEMO].sort((a, b) => b.load - a.load).map((p, i) => (
                    <tr key={i} className="cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => setSelectedPlayer(selectedPlayer === p.name ? null : p.name)}
                      style={{ borderBottom: i < GPS_PLAYER_DEMO.length - 1 ? '1px solid #1F2937' : undefined }}>
                      <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{p.name}</td>
                      <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{p.distance.toFixed(1)}</td>
                      <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{p.hsr.toLocaleString()}</td>
                      <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{p.sprints}</td>
                      <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{p.maxSpeed.toFixed(1)} km/h</td>
                      <td className="px-5 py-3 font-bold" style={{ color: p.load > 450 ? '#EF4444' : p.load > 400 ? '#F59E0B' : '#22C55E' }}>{p.load}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: `${acwrColor(p.acwr)}1a`, color: acwrColor(p.acwr) }}>
                          {p.acwr.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: `${acwrColor(p.acwr)}1a`, color: acwrColor(p.acwr) }}>
                          {acwrLabel(p.acwr)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Squad Summary Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-xs" style={{ color: '#6B7280' }}>Avg Player Load</p>
              <p className="text-2xl font-black mt-1" style={{ color: '#F9FAFB' }}>{Math.round(GPS_PLAYER_DEMO.reduce((s, p) => s + p.load, 0) / GPS_PLAYER_DEMO.length)}</p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-xs" style={{ color: '#6B7280' }}>Avg Distance (km)</p>
              <p className="text-2xl font-black mt-1" style={{ color: '#F9FAFB' }}>{(GPS_PLAYER_DEMO.reduce((s, p) => s + p.distance, 0) / GPS_PLAYER_DEMO.length).toFixed(1)}</p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-xs" style={{ color: '#6B7280' }}>Avg HSR (m)</p>
              <p className="text-2xl font-black mt-1" style={{ color: '#F9FAFB' }}>{Math.round(GPS_PLAYER_DEMO.reduce((s, p) => s + p.hsr, 0) / GPS_PLAYER_DEMO.length)}</p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-xs" style={{ color: '#6B7280' }}>Max Speed Recorded</p>
              <p className="text-2xl font-black mt-1" style={{ color: '#F9FAFB' }}>{Math.max(...GPS_PLAYER_DEMO.map(p => p.maxSpeed)).toFixed(1)} km/h</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 — PLAYER READINESS */}
      {tab === 'readiness' && (
        <div className="space-y-4">
          {/* Readiness Summary */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <p className="text-3xl font-black" style={{ color: '#22C55E' }}>{readyCt}</p>
              <p className="text-xs mt-1 font-semibold" style={{ color: '#22C55E' }}>Ready to Play</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>ACWR 0.8 – 1.3</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <p className="text-3xl font-black" style={{ color: '#F59E0B' }}>{cautionCt}</p>
              <p className="text-xs mt-1 font-semibold" style={{ color: '#F59E0B' }}>Manage Load</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>ACWR 1.3 – 1.5</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <p className="text-3xl font-black" style={{ color: '#EF4444' }}>{riskCt}</p>
              <p className="text-xs mt-1 font-semibold" style={{ color: '#EF4444' }}>High Injury Risk</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>ACWR &gt; 1.5</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <p className="text-3xl font-black" style={{ color: '#3B82F6' }}>{underCt}</p>
              <p className="text-xs mt-1 font-semibold" style={{ color: '#3B82F6' }}>Under-trained</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>ACWR &lt; 0.8</p>
            </div>
          </div>

          {/* Player Readiness List */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Squad Readiness — ACWR Traffic Lights</p>
            </div>
            <div className="divide-y" style={{ borderColor: '#1F2937' }}>
              {[...GPS_PLAYER_DEMO].sort((a, b) => b.acwr - a.acwr).map((p, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{statusIcon(p.acwr)}</span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{p.name}</p>
                      <p className="text-xs" style={{ color: '#6B7280' }}>Load: {p.load} &middot; ACWR: {p.acwr.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${acwrColor(p.acwr)}1a`, color: acwrColor(p.acwr) }}>
                      {readinessLabel(p.acwr)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 — LOAD TRENDS */}
      {tab === 'trends' && (
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold mb-4" style={{ color: '#F9FAFB' }}>Weekly Player Load — Last 8 Weeks</p>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <LineChart data={WEEKLY_LOAD_DEMO}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="week" stroke="#6B7280" fontSize={11} />
                  <YAxis stroke="#6B7280" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#111318', border: '1px solid #1F2937', borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Ryan Thompson" stroke="#3B82F6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Jamal Henderson" stroke="#EF4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Sean O'Brien" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Kwame Okafor" stroke="#22C55E" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="avg" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 5" dot={false} name="4-Week Avg" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Observations */}
          <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold mb-2" style={{ color: '#F9FAFB' }}>Key Observations</p>
            <div className="space-y-2">
              {[
                "Sean O'Brien's load has increased steadily over 8 weeks — now at high injury risk (ACWR 1.58).",
                "Jamal Henderson spiked in W4 following two consecutive match starts — manage carefully.",
                "Squad average load trending upward — consider a recovery week before next fixture run.",
                "Ryan Thompson and Kwame Okafor both within optimal range — available for full selection.",
              ].map((obs, i) => (
                <div key={i} className="flex gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold" style={{ backgroundColor: 'rgba(0,61,165,0.2)', color: '#F1C40F' }}>{i + 1}</span>
                  <p className="text-xs leading-relaxed" style={{ color: '#FCA5A5' }}>{obs}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4 — MATCH vs TRAINING */}
      {tab === 'match-vs-training' && (
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Match Day vs Average Training Output</p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Identifies conditioning gaps — who drops off or spikes on match day?</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1F2937' }}>
                    {['Player', 'Match Dist', 'Train Dist', 'Match HSR', 'Train HSR', 'Match Load', 'Train Load', 'Diff'].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MATCH_VS_TRAIN_DEMO.map((p, i) => {
                    const diffNum = parseInt(p.diff)
                    const diffColor = diffNum > 30 ? '#EF4444' : diffNum > 20 ? '#F59E0B' : '#22C55E'
                    return (
                      <tr key={i} style={{ borderBottom: i < MATCH_VS_TRAIN_DEMO.length - 1 ? '1px solid #1F2937' : undefined }}>
                        <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{p.name}</td>
                        <td className="px-5 py-3" style={{ color: '#F9FAFB' }}>{p.matchDist.toFixed(1)}</td>
                        <td className="px-5 py-3" style={{ color: '#6B7280' }}>{p.trainDist.toFixed(1)}</td>
                        <td className="px-5 py-3" style={{ color: '#F9FAFB' }}>{p.matchHSR}</td>
                        <td className="px-5 py-3" style={{ color: '#6B7280' }}>{p.trainHSR}</td>
                        <td className="px-5 py-3 font-bold" style={{ color: '#F9FAFB' }}>{p.matchLoad}</td>
                        <td className="px-5 py-3" style={{ color: '#6B7280' }}>{p.trainLoad}</td>
                        <td className="px-5 py-3"><span className="font-bold" style={{ color: diffColor }}>{p.diff}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold mb-2" style={{ color: '#F9FAFB' }}>Fitness Coach Notes</p>
            <div className="space-y-2">
              {[
                "Jamie Wilson shows highest match-to-training spike (+47%) — condition needs work or his training intensity is too low.",
                "Sean O'Brien +37% spike on match day with already high ACWR — limit minutes or start from bench.",
                "Jamal Henderson and Kwame Okafor both consistent — match output mirrors training. Good conditioning base.",
              ].map((n, i) => (
                <div key={i} className="flex gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold" style={{ backgroundColor: 'rgba(0,61,165,0.2)', color: '#F1C40F' }}>{i + 1}</span>
                  <p className="text-xs leading-relaxed" style={{ color: '#FCA5A5' }}>{n}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5 — CONNECT GPS */}
      {tab === 'connect' && (
        <div className="space-y-4">
          {/* Provider Connection Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Catapult */}
            <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59,130,246,0.15)' }}>
                  <Activity size={20} style={{ color: '#3B82F6' }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Catapult OpenField</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Connect via API bearer token</p>
                </div>
              </div>
              <input type="text" placeholder="Paste Catapult API token..."
                className="w-full px-4 py-2.5 rounded-lg text-sm mb-3"
                style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB', outline: 'none' }}
                value={connectProvider === 'catapult' ? connectToken : ''}
                onChange={e => { setConnectProvider('catapult'); setConnectToken(e.target.value) }} />
              <button onClick={() => { setToast('Catapult connected — syncing sessions...'); setConnectToken(''); setTimeout(() => setToast(null), 2500) }}
                className="w-full px-4 py-2.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#3B82F6', color: '#FFF' }}>
                Connect Catapult
              </button>
            </div>

            {/* STATSports */}
            <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}>
                  <Activity size={20} style={{ color: '#22C55E' }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>STATSports Sonra</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Connect via API key</p>
                </div>
              </div>
              <input type="text" placeholder="Paste STATSports API key..."
                className="w-full px-4 py-2.5 rounded-lg text-sm mb-3"
                style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB', outline: 'none' }}
                value={connectProvider === 'statsports' ? connectToken : ''}
                onChange={e => { setConnectProvider('statsports'); setConnectToken(e.target.value) }} />
              <button onClick={() => { setToast('STATSports connected — syncing sessions...'); setConnectToken(''); setTimeout(() => setToast(null), 2500) }}
                className="w-full px-4 py-2.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#22C55E', color: '#FFF' }}>
                Connect STATSports
              </button>
            </div>
          </div>

          {/* CSV Upload */}
          <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}>
                <FileText size={20} style={{ color: '#F59E0B' }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>CSV Upload</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>Manually export from your GPS platform and upload directly. Supports both Catapult and STATSports formats.</p>
              </div>
            </div>
            <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-amber-600"
              style={{ borderColor: '#374151' }}>
              <FileText size={32} className="mx-auto mb-2" style={{ color: '#6B7280' }} />
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Drop CSV file here or click to browse</p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Auto-detects Catapult or STATSports format from column headers</p>
            </div>
          </div>

          {/* Sync Status */}
          <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>Sync Status</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10' }}>
                <p className="text-xs" style={{ color: '#6B7280' }}>Last Sync</p>
                <p className="text-sm font-bold mt-1" style={{ color: '#F9FAFB' }}>31 Mar 2026, 09:15</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10' }}>
                <p className="text-xs" style={{ color: '#6B7280' }}>Sessions Synced</p>
                <p className="text-sm font-bold mt-1" style={{ color: '#F9FAFB' }}>48</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10' }}>
                <p className="text-xs" style={{ color: '#6B7280' }}>Provider</p>
                <p className="text-sm font-bold mt-1" style={{ color: '#3B82F6' }}>Catapult OpenField</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold" style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}>
          {toast}
        </div>
      )}
    </div>
  )
}

// ─── Training View ──────────────────────────────────────────────────────────

function TrainingView() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Training</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Session planning, GPS load monitoring, and recovery schedules.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: 'Session Plan', icon: Clipboard },
          { label: 'Load Report', icon: BarChart3 },
          { label: 'Recovery Schedule', icon: Heart },
          { label: 'Dept Insights', icon: BarChart3 },
        ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={a.label === 'Dept Insights' ? { backgroundColor: 'transparent', border: '1px solid #F1C40F', color: '#F1C40F' } : { backgroundColor: '#002D7A', color: '#F1C40F' }}>
            <a.icon size={12} />{a.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Today's Session" value="10:00" icon={Clock} color="#003DA5" />
        <StatCard label="Session Type" value="Tactical" icon={Clipboard} color="#3B82F6" />
        <StatCard label="Avg Load (7d)" value="72%" icon={Activity} color="#22C55E" />
        <StatCard label="Recovery Group" value="3" icon={Heart} color="#F59E0B" />
      </div>

      {/* Weekly Plan */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Weekly Training Plan</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Day', 'AM Session', 'PM Session', 'Intensity', 'Focus'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { day: 'Mon', am: 'Recovery & Pool', pm: 'Video Review', intensity: 'Low', focus: 'Recovery' },
                { day: 'Tue', am: 'Tactical Pressing', pm: 'Set Pieces', intensity: 'High', focus: 'Tactical' },
                { day: 'Wed', am: 'Possession & Patterns', pm: 'Gym', intensity: 'Medium', focus: 'Technical' },
                { day: 'Thu', am: 'Match Simulation', pm: 'Rest', intensity: 'High', focus: 'Match Prep' },
                { day: 'Fri', am: 'Light Walk-through', pm: 'Pre-match Talk', intensity: 'Low', focus: 'Recovery' },
                { day: 'Sat', am: 'MATCHDAY', pm: '—', intensity: '—', focus: 'Riverside United' },
                { day: 'Sun', am: 'Rest Day', pm: '—', intensity: '—', focus: 'Recovery' },
              ].map((d, i) => {
                const intColor = d.intensity === 'High' ? '#EF4444' : d.intensity === 'Medium' ? '#F59E0B' : d.intensity === 'Low' ? '#22C55E' : '#6B7280'
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #1F2937', backgroundColor: d.day === 'Sat' ? 'rgba(0,61,165,0.05)' : undefined }} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-bold" style={{ color: d.day === 'Sat' ? '#F1C40F' : '#F9FAFB' }}>{d.day}</td>
                    <td className="px-4 py-3" style={{ color: d.day === 'Sat' ? '#F1C40F' : '#9CA3AF' }}>{d.am}</td>
                    <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{d.pm}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-lg font-semibold" style={{ backgroundColor: `${intColor}1a`, color: intColor }}>{d.intensity}</span></td>
                    <td className="px-4 py-3" style={{ color: '#6B7280' }}>{d.focus}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GPS Load from Medical */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>GPS Training Load (Yesterday)</p>
          <span className="text-xs" style={{ color: '#6B7280' }}>{GPS_DATA.length} players tracked</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Player', 'Distance', 'Hi-Speed', 'Sprints', 'Max Speed', 'Load'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GPS_DATA.map((g, i) => {
                const loadColor = g.load === 'optimal' ? '#22C55E' : g.load === 'high' ? '#F59E0B' : g.load === 'amber' ? '#F97316' : '#EF4444'
                return (
                  <tr key={i} style={{ borderBottom: i < GPS_DATA.length - 1 ? '1px solid #1F2937' : undefined }}>
                    <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{g.player}</td>
                    <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{g.distance.toFixed(1)} km</td>
                    <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{g.hiSpeed.toLocaleString()} m</td>
                    <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{g.sprints}</td>
                    <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{g.maxSpeed.toFixed(1)} km/h</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-lg font-semibold uppercase" style={{ backgroundColor: `${loadColor}1a`, color: loadColor }}>{g.load}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}


function FinanceView() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Club Finance</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Revenue, expenditure, wage bill, transfer budgets, and contract management.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: 'Budget Overview', icon: DollarSign },
          { label: 'Wage Report', icon: FileText },
          { label: 'Revenue Dashboard', icon: BarChart3 },
          { label: 'Dept Insights', icon: BarChart3 },
        ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={a.label === 'Dept Insights' ? { backgroundColor: 'transparent', border: '1px solid #F1C40F', color: '#F1C40F' } : { backgroundColor: '#002D7A', color: '#F1C40F' }}>
            <a.icon size={12} />{a.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Transfer Budget" value="£4.2m" icon={DollarSign} color="#22C55E" />
        <StatCard label="Wage Bill" value="£2.1m/yr" icon={Users} color="#003DA5" />
        <StatCard label="Revenue (YTD)" value="£3.4m" icon={TrendingUp} color="#3B82F6" />
        <StatCard label="Wage/Rev Ratio" value="62%" icon={BarChart3} color="#F59E0B" />
      </div>

      {/* Contract Tracker */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Contract Tracker</p>
          <span className="text-xs" style={{ color: '#6B7280' }}>Sorted by expiry</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Player', 'Position', 'Weekly Wage', 'Expiry', 'Status', 'Agent'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONTRACT_DATA.map((c, i) => {
                const statusColor = c.status === 'Signed' ? '#22C55E' : c.status === 'Offered' ? '#3B82F6' : c.status === 'Negotiating' ? '#F59E0B' : '#6B7280'
                return (
                  <tr key={i} style={{ borderBottom: i < CONTRACT_DATA.length - 1 ? '1px solid #1F2937' : undefined }} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{c.player}</td>
                    <td className="px-4 py-3"><span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,61,165,0.1)', color: '#F1C40F' }}>{c.position}</span></td>
                    <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{c.weeklyWage}</td>
                    <td className="px-4 py-3" style={{ color: c.end === 'Jun 2025' ? '#EF4444' : c.end === 'Jun 2026' ? '#F59E0B' : '#9CA3AF' }}>{c.end}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-lg font-semibold" style={{ backgroundColor: `${statusColor}1a`, color: statusColor }}>{c.status}</span></td>
                    <td className="px-4 py-3" style={{ color: '#6B7280' }}>{c.agent}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Revenue Breakdown (YTD)</p>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          {[
            { source: 'Matchday Revenue', amount: '£1.2m', pct: '35%', trend: '+8%', color: '#22C55E' },
            { source: 'Broadcasting', amount: '£980k', pct: '29%', trend: '+2%', color: '#3B82F6' },
            { source: 'Sponsorship', amount: '£620k', pct: '18%', trend: '+15%', color: '#F59E0B' },
            { source: 'Merchandise', amount: '£340k', pct: '10%', trend: '+22%', color: '#8B5CF6' },
            { source: 'Youth Grants', amount: '£180k', pct: '5%', trend: '—', color: '#06B6D4' },
            { source: 'Other', amount: '£80k', pct: '3%', trend: '-5%', color: '#6B7280' },
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{r.source}</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="font-bold" style={{ color: '#F9FAFB' }}>{r.amount}</span>
                <span style={{ color: '#6B7280' }}>{r.pct}</span>
                <span style={{ color: r.trend.startsWith('+') ? '#22C55E' : r.trend === '—' ? '#6B7280' : '#EF4444' }}>{r.trend}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

function StaffView() { return <FootballStaffView /> }

function _OriginalStaffView() {
  return (
    <div className="space-y-5" style={{display:'none'}}>
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Staff Management</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Coaching staff, medical team, scouts, and administrative personnel.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: 'Staff Directory', icon: Users },
          { label: 'Leave Calendar', icon: Calendar },
          { label: 'Recruitment', icon: UserPlus },
          { label: 'Dept Insights', icon: BarChart3 },
        ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={a.label === 'Dept Insights' ? { backgroundColor: 'transparent', border: '1px solid #F1C40F', color: '#F1C40F' } : { backgroundColor: '#002D7A', color: '#F1C40F' }}>
            <a.icon size={12} />{a.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Coaching Staff" value="8" icon={Users} color="#003DA5" />
        <StatCard label="Medical Team" value="4" icon={Heart} color="#22C55E" />
        <StatCard label="Scouts" value="4" icon={Eye} color="#3B82F6" />
        <StatCard label="Total Staff" value="32" icon={Briefcase} color="#F59E0B" />
      </div>

      {/* Staff Directory */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Staff Directory</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Name', 'Role', 'Department', 'Qualifications', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'David Hughes', role: 'Assistant Manager', dept: 'Coaching', quals: 'UEFA A', status: 'Available' },
                { name: 'Mike Reynolds', role: 'First Team Coach', dept: 'Coaching', quals: 'UEFA A', status: 'Available' },
                { name: 'Alan Cooper', role: 'GK Coach', dept: 'Coaching', quals: 'UEFA Pro (in progress)', status: 'Course Mon-Wed' },
                { name: 'Sarah Mitchell', role: 'Head Physio', dept: 'Medical', quals: 'MSc Sports Med', status: 'Available' },
                { name: 'Dr. James Hart', role: 'Club Doctor', dept: 'Medical', quals: 'MBBS, MRCGP', status: 'Available' },
                { name: 'Tom Wallace', role: 'Fitness Coach', dept: 'Coaching', quals: 'BSc S&C', status: 'Available' },
                { name: 'Mark Evans', role: 'Chief Scout', dept: 'Scouting', quals: 'UEFA B', status: 'Belgium trip' },
                { name: 'Emma Clark', role: 'Performance Analyst', dept: 'Analytics', quals: 'MSc Data Science', status: 'Starts Monday' },
              ].map((s, i) => {
                const statusColor = s.status === 'Available' ? '#22C55E' : '#F59E0B'
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #1F2937' }} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{s.name}</td>
                    <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{s.role}</td>
                    <td className="px-4 py-3"><span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,61,165,0.1)', color: '#F1C40F' }}>{s.dept}</span></td>
                    <td className="px-4 py-3" style={{ color: '#6B7280' }}>{s.quals}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-lg font-semibold" style={{ backgroundColor: `${statusColor}1a`, color: statusColor }}>{s.status}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Calendar */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Upcoming Leave & Absences</p>
        </div>
        {[
          { name: 'Alan Cooper', dates: '28-30 Mar', reason: 'UEFA Pro Licence course', cover: 'David Hughes' },
          { name: 'Sarah Mitchell', dates: '14-18 Apr', reason: 'Annual leave', cover: 'Dr. James Hart' },
          { name: 'Mark Evans', dates: '25-29 Mar', reason: 'Scouting trip — Belgium', cover: 'Carlos Mendes (remote)' },
        ].map((l, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{l.name}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{l.reason}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold" style={{ color: '#F59E0B' }}>{l.dates}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Cover: {l.cover}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

function FacilitiesView() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Facilities</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Stadium, training ground, pitch maintenance, and infrastructure management.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: 'Pitch Report', icon: FileText },
          { label: 'Maintenance Log', icon: Clipboard },
          { label: 'Booking Schedule', icon: Calendar },
          { label: 'Dept Insights', icon: BarChart3 },
        ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={a.label === 'Dept Insights' ? { backgroundColor: 'transparent', border: '1px solid #F1C40F', color: '#F1C40F' } : { backgroundColor: '#002D7A', color: '#F1C40F' }}>
            <a.icon size={12} />{a.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Pitch Condition" value="Excellent" icon={CheckCircle2} color="#22C55E" />
        <StatCard label="Capacity" value="12,000" icon={Users} color="#3B82F6" />
        <StatCard label="Training Pitches" value="4" icon={MapPin} color="#003DA5" />
        <StatCard label="Next Maintenance" value="Thu" icon={Calendar} color="#F59E0B" />
      </div>

      {/* Facility Status */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Facility Status</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Facility', 'Condition', 'Last Inspected', 'Next Maintenance', 'Notes'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { facility: 'Main Stadium Pitch', condition: 'Excellent', inspected: '26 Mar', next: 'Thu 3 Apr', notes: 'Re-seeded Tuesday', color: '#22C55E' },
                { facility: 'Training Pitch 1', condition: 'Good', inspected: '25 Mar', next: 'Mon 31 Mar', notes: 'Normal use', color: '#22C55E' },
                { facility: 'Training Pitch 2', condition: 'Poor', inspected: '26 Mar', next: 'Immediate', notes: 'Waterlogged — closed', color: '#EF4444' },
                { facility: 'Training Pitch 3', condition: 'Good', inspected: '25 Mar', next: 'Fri 4 Apr', notes: 'Sessions redirected here', color: '#22C55E' },
                { facility: 'Training Pitch 4 (Astro)', condition: 'Excellent', inspected: '20 Mar', next: 'Apr', notes: 'All-weather, no issues', color: '#22C55E' },
                { facility: 'Gym & Weights Room', condition: 'Good', inspected: '24 Mar', next: 'Weekly', notes: 'New equipment arriving Mon', color: '#22C55E' },
                { facility: 'Hydrotherapy Pool', condition: 'Good', inspected: '23 Mar', next: 'Bi-weekly', notes: 'Used for rehab daily', color: '#22C55E' },
                { facility: 'Floodlights', condition: 'Operational', inspected: '25 Mar', next: 'Monthly', notes: 'Inspection passed', color: '#22C55E' },
              ].map((f, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1F2937' }} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{f.facility}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-lg font-semibold" style={{ backgroundColor: `${f.color}1a`, color: f.color }}>{f.condition}</span></td>
                  <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{f.inspected}</td>
                  <td className="px-4 py-3" style={{ color: f.next === 'Immediate' ? '#EF4444' : '#9CA3AF' }}>{f.next}</td>
                  <td className="px-4 py-3" style={{ color: '#6B7280' }}>{f.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Maintenance */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Upcoming Maintenance & Projects</p>
        </div>
        {[
          { project: 'Pitch 2 drainage repair', date: '28-30 Mar', cost: '£4,200', priority: 'Urgent', color: '#EF4444' },
          { project: 'CCTV system upgrade', date: 'Next week', cost: '£8,500', priority: 'Planned', color: '#3B82F6' },
          { project: 'Gym equipment installation', date: 'Mon 31 Mar', cost: '£12,000', priority: 'Planned', color: '#3B82F6' },
          { project: 'Away dugout seating replacement', date: 'Apr', cost: '£3,800', priority: 'Low', color: '#6B7280' },
        ].map((p, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{p.project}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{p.date} · Est. {p.cost}</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-lg font-semibold" style={{ backgroundColor: `${p.color}1a`, color: p.color }}>{p.priority}</span>
          </div>
        ))}
      </div>

    </div>
  )
}

// ─── Settings View ──────────────────────────────────────────────────────────

const VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', desc: 'Warm & clear — your daily motivator' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', desc: 'Calm & deep — reassuring and steady' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', desc: 'Bright & energetic — upbeat and clear' },
]

// ─── Social Media View ──────────────────────────────────────────────────────

const SOCIAL_MENTIONS = [
  { user: '@AFCWimbFan92', content: 'Great performance from AFC Wimbledon last night! Santos was incredible ⚽🔥', time: '2 min ago', likes: 847, sentiment: 'positive' as const },
  { user: '@SportsBlogger', content: 'Hearing AFC Wimbledon are close to signing André Costa — big move if true 👀', time: '15 min ago', likes: 234, sentiment: 'neutral' as const },
  { user: '@LocalFan', content: 'Season ticket renewed. Can\'t wait for Saturday. Come on Wimbledon! 🔴', time: '32 min ago', likes: 45, sentiment: 'positive' as const },
  { user: '@ChampionshipNews', content: 'AFC Wimbledon move up to 8th after beating Riverside. Genuine playoff push?', time: '1 hr ago', likes: 1240, sentiment: 'positive' as const },
  { user: '@TacticsBoard', content: 'Thompson\'s pass map vs Riverside was elite. 92% accuracy, 4 key passes.', time: '2 hrs ago', likes: 312, sentiment: 'positive' as const },
  { user: '@DisappointedFan', content: 'Still think we need a proper left-back. Davies isn\'t good enough for this level.', time: '3 hrs ago', likes: 89, sentiment: 'negative' as const },
  { user: '@YouthFootball', content: 'Tyler James (17) training with Wimbledon first team today. One to watch 🌟', time: '4 hrs ago', likes: 567, sentiment: 'positive' as const },
  { user: '@TransferWatch', content: 'AFC Wimbledon have reportedly bid for SC Braga midfielder. Championship clubs circling.', time: '5 hrs ago', likes: 1890, sentiment: 'neutral' as const },
]

const SOCIAL_PLATFORMS = [
  { name: 'X / Twitter', emoji: '🐦', followers: '124k', growth: '+840', engagement: '5.1%', bestTime: '12:30pm' },
  { name: 'Instagram', emoji: '📸', followers: '89k', growth: '+620', engagement: '4.8%', bestTime: '6:00pm' },
  { name: 'Facebook', emoji: '📘', followers: '42k', growth: '+180', engagement: '2.1%', bestTime: '9:00am' },
  { name: 'YouTube', emoji: '▶️', followers: '18k', growth: '+340', engagement: '6.2%', bestTime: '2:00pm' },
  { name: 'LinkedIn', emoji: '💼', followers: '8k', growth: '+90', engagement: '3.4%', bestTime: '8:00am' },
  { name: 'TikTok', emoji: '🎵', followers: '3k', growth: '+420', engagement: '8.7%', bestTime: '7:00pm' },
]

const SOCIAL_CALENDAR = [
  { day: 'Mon', time: '9am', content: 'Match preview graphic', platforms: 'IG + X' },
  { day: 'Tue', time: '2pm', content: 'Training ground photos', platforms: 'IG' },
  { day: 'Wed', time: '12pm', content: 'Player spotlight — Santos', platforms: 'All' },
  { day: 'Thu', time: '10am', content: 'Match day -2 countdown', platforms: 'X + Stories' },
  { day: 'Fri', time: '9am', content: 'Squad announcement', platforms: 'All' },
  { day: 'Sat', time: '12pm', content: 'Match day live', platforms: 'All' },
  { day: 'Sun', time: '11am', content: 'Highlights + report', platforms: 'All' },
]

function SocialMediaView() {
  const [platform, setPlatform] = useState(0)
  const [sentimentFilter, setSentimentFilter] = useState<string>('all')
  const [socToast, setSocToast] = useState<string | null>(null)
  function socAction(l: string) { setSocToast(`${l} — opening...`); setTimeout(() => setSocToast(null), 2500) }

  const filtered = sentimentFilter === 'all' ? SOCIAL_MENTIONS : SOCIAL_MENTIONS.filter(m => m.sentiment === sentimentFilter)
  const p = SOCIAL_PLATFORMS[platform]

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Social Media Hub</h2><p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Everything the world is saying about AFC Wimbledon</p></div>

      <div className="flex items-center gap-2 flex-wrap">
        {[{ l: 'Create Post', i: Plus }, { l: 'Schedule Content', i: Calendar }, { l: 'Analytics Report', i: BarChart3 }, { l: 'Set Up Alerts', i: Bell }, { l: 'Reply to Mentions', i: MessageSquare }, { l: 'Dept Insights', i: BarChart3 }].map(a => (
          <button key={a.l} onClick={() => socAction(a.l)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
            style={a.l === 'Dept Insights' ? { backgroundColor: 'transparent', border: '1px solid #F1C40F', color: '#F1C40F' } : { backgroundColor: '#002D7A', color: '#F1C40F' }}><a.i size={12} />{a.l}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Total Followers" value="284k" icon={Users} color="#003DA5" />
        <StatCard label="Engagement Rate" value="4.2%" icon={Activity} color="#22C55E" />
        <StatCard label="Mentions Today" value="847" icon={MessageSquare} color="#8B5CF6" />
        <StatCard label="Sentiment Score" value="72/100" icon={Heart} color="#F1C40F" />
      </div>

      {/* Platform Tabs */}
      <div className="flex gap-2 flex-wrap">
        {SOCIAL_PLATFORMS.map((sp, i) => (
          <button key={sp.name} onClick={() => setPlatform(i)} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: platform === i ? '#003DA5' : '#111318', color: platform === i ? '#F9FAFB' : '#9CA3AF', border: platform === i ? 'none' : '1px solid #1F2937' }}>
            {sp.emoji} {sp.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Platform Stats */}
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>{p.emoji} {p.name}</p>
          {[{ l: 'Followers', v: p.followers }, { l: 'Weekly Growth', v: p.growth }, { l: 'Engagement', v: p.engagement }, { l: 'Best Post Time', v: p.bestTime }].map(s => (
            <div key={s.l} className="flex justify-between py-1.5"><span className="text-xs" style={{ color: '#9CA3AF' }}>{s.l}</span><span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{s.v}</span></div>
          ))}
        </div>

        {/* Mentions Feed */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Mentions</p>
            <div className="flex gap-1">{['all', 'positive', 'neutral', 'negative'].map(f => (
              <button key={f} onClick={() => setSentimentFilter(f)} className="px-2 py-1 rounded text-[10px] font-semibold capitalize" style={{ backgroundColor: sentimentFilter === f ? '#003DA5' : '#1F2937', color: '#F9FAFB' }}>{f}</button>
            ))}</div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {filtered.map((m, i) => (
              <div key={i} className="px-5 py-3 flex gap-3" style={{ borderBottom: i < filtered.length - 1 ? '1px solid #1F2937' : undefined }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{m.user[1].toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs"><span className="font-bold" style={{ color: '#F9FAFB' }}>{m.user}</span> <span style={{ color: '#6B7280' }}>· {m.time}</span></p>
                  <p className="text-xs mt-1" style={{ color: '#D1D5DB' }}>{m.content}</p>
                  <div className="flex items-center gap-3 mt-1"><span className="text-[10px]" style={{ color: '#6B7280' }}>❤️ {m.likes}</span><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: m.sentiment === 'positive' ? 'rgba(34,197,94,0.12)' : m.sentiment === 'negative' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: m.sentiment === 'positive' ? '#22C55E' : m.sentiment === 'negative' ? '#EF4444' : '#F59E0B' }}>{m.sentiment}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sentiment + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Sentiment Analysis</p>
          {[{ l: 'Positive', v: 68, c: '#22C55E' }, { l: 'Neutral', v: 22, c: '#F59E0B' }, { l: 'Negative', v: 10, c: '#EF4444' }].map(s => (
            <div key={s.l} className="mb-2"><div className="flex justify-between text-xs mb-1"><span style={{ color: '#9CA3AF' }}>{s.l}</span><span style={{ color: s.c }}>{s.v}%</span></div><div className="h-2 rounded-full" style={{ backgroundColor: '#1F2937' }}><div className="h-full rounded-full" style={{ width: `${s.v}%`, backgroundColor: s.c }} /></div></div>
          ))}
        </div>
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Content Calendar</p></div>
          {SOCIAL_CALENDAR.map((c, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-2.5" style={{ borderBottom: i < SOCIAL_CALENDAR.length - 1 ? '1px solid #1F2937' : undefined }}>
              <span className="text-xs font-bold w-8" style={{ color: '#003DA5' }}>{c.day}</span>
              <span className="text-xs w-10" style={{ color: '#6B7280' }}>{c.time}</span>
              <span className="text-xs flex-1" style={{ color: '#D1D5DB' }}>{c.content}</span>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>{c.platforms}</span>
            </div>
          ))}
        </div>
      </div>

      {socToast && <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: '#003DA5', color: '#F1C40F' }}>{socToast}</div>}
    </div>
  )
}

function DynamicsView() {
  const [socToast, setSocToast] = useState<string | null>(null)
  function action(l: string) { setSocToast(`${l} — opening...`); setTimeout(() => setSocToast(null), 2500) }

  const PLAYER_HAPPINESS = [
    { name: 'Marcus Webb', overall: 9, morale: 9, training: 8, playingTime: 9, contract: 8, form: 9, risk: 'Low' },
    { name: 'Jordan Ellis', overall: 8, morale: 8, training: 9, playingTime: 7, contract: 8, form: 8, risk: 'Low' },
    { name: 'Lucas Santos', overall: 7, morale: 7, training: 8, playingTime: 6, contract: 7, form: 8, risk: 'Low' },
    { name: 'Ryan Thompson', overall: 7, morale: 7, training: 7, playingTime: 8, contract: 5, form: 7, risk: 'Medium' },
    { name: 'Danny Okafor', overall: 4, morale: 4, training: 5, playingTime: 2, contract: 6, form: 3, risk: 'High' },
    { name: 'Kenji Nakamura', overall: 5, morale: 6, training: 7, playingTime: 5, contract: 3, form: 5, risk: 'High' },
    { name: 'Chris Walsh', overall: 5, morale: 4, training: 6, playingTime: 5, contract: 7, form: 3, risk: 'Medium' },
  ]

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Dressing Room Intelligence</h2><p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Squad harmony, morale and player wellbeing</p></div>

      <div className="flex items-center gap-2 flex-wrap">
        {[{ l: 'Team Meeting', i: Users }, { l: 'Player Chat', i: MessageSquare }, { l: 'Issue Fine', i: AlertCircle }, { l: 'Set Mentoring', i: Heart }, { l: 'Code of Conduct', i: Shield }, { l: 'Atmosphere Report', i: BarChart3 }, { l: 'Dept Insights', i: BarChart3 }].map(a => (
          <button key={a.l} onClick={() => action(a.l)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={a.l === 'Dept Insights' ? { backgroundColor: 'transparent', border: '1px solid #F1C40F', color: '#F1C40F' } : { backgroundColor: '#002D7A', color: '#F1C40F' }}><a.i size={12} />{a.l}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-xs" style={{ color: '#6B7280' }}>DRESSING ROOM ATMOSPHERE</p>
          <p className="text-4xl font-black my-2" style={{ color: '#F1C40F' }}>74<span className="text-lg">/100</span></p>
          <p className="text-xs" style={{ color: '#22C55E' }}>Good — ↑3 from last week</p>
          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'linear-gradient(90deg, #EF4444, #F59E0B, #22C55E)' }}><div className="h-full" style={{ width: '74%', backgroundColor: 'transparent' }} /></div>
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          {[{ l: 'Squad Cohesion', v: 78, s: '🟢' }, { l: 'Manager Trust', v: 82, s: '🟢' }, { l: 'Playing Time Satisfaction', v: 61, s: '🟡' }, { l: 'Training Happiness', v: 71, s: '🟢' }].map(p => (
            <div key={p.l} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-xs mb-1" style={{ color: '#6B7280' }}>{p.l}</p>
              <p className="text-xl font-black" style={{ color: p.v >= 70 ? '#22C55E' : p.v >= 50 ? '#F59E0B' : '#EF4444' }}>{p.v}/100 {p.s}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ backgroundColor: '#111318', borderBottom: '1px solid #1F2937' }}><p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Player Happiness</p></div>
        <table className="w-full text-xs"><thead><tr style={{ borderBottom: '1px solid #1F2937' }}>{['Player','Overall','Morale','Training','Playing Time','Contract','Form','Risk'].map(h => <th key={h} className="text-left px-3 py-2" style={{ color: '#6B7280' }}>{h}</th>)}</tr></thead>
        <tbody>{PLAYER_HAPPINESS.map(p => {
          function sc(v: number) { return v >= 8 ? '#22C55E' : v >= 5 ? '#F59E0B' : '#EF4444' }
          return <tr key={p.name} style={{ borderBottom: '1px solid #1F2937' }}><td className="px-3 py-2 font-medium" style={{ color: '#F9FAFB' }}>{p.name}</td>{[p.overall,p.morale,p.training,p.playingTime,p.contract,p.form].map((v,i) => <td key={i} className="px-3 py-2 font-bold" style={{ color: sc(v) }}>{v}</td>)}<td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: p.risk === 'High' ? 'rgba(239,68,68,0.12)' : p.risk === 'Medium' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)', color: p.risk === 'High' ? '#EF4444' : p.risk === 'Medium' ? '#F59E0B' : '#22C55E' }}>{p.risk}</span></td></tr>
        })}</tbody></table>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Disciplinary Log (Last 30 Days)</p>
        <table className="w-full text-xs"><thead><tr style={{ borderBottom: '1px solid #1F2937' }}>{['Player','Offence','Date','Punishment','Status'].map(h => <th key={h} className="text-left px-3 py-2" style={{ color: '#6B7280' }}>{h}</th>)}</tr></thead>
        <tbody>{[{ p: 'Marcus Webb', o: 'Late to training', d: '12 Mar', pun: 'Verbal warning', s: 'Resolved' },{ p: 'Danny Okafor', o: 'Missed training', d: '18 Mar', pun: 'Fine: £500', s: 'Active' },{ p: 'Kenji Nakamura', o: 'Red card reaction', d: '22 Mar', pun: 'Fine: £1,000', s: 'Active' }].map(r => <tr key={r.p} style={{ borderBottom: '1px solid #1F2937' }}><td className="px-3 py-2 font-medium" style={{ color: '#F9FAFB' }}>{r.p}</td><td className="px-3 py-2" style={{ color: '#9CA3AF' }}>{r.o}</td><td className="px-3 py-2" style={{ color: '#9CA3AF' }}>{r.d}</td><td className="px-3 py-2" style={{ color: '#9CA3AF' }}>{r.pun}</td><td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: r.s === 'Active' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)', color: r.s === 'Active' ? '#EF4444' : '#22C55E' }}>{r.s}</span></td></tr>)}</tbody></table>
      </div>

      {socToast && <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: '#003DA5', color: '#F1C40F' }}>{socToast}</div>}
    </div>
  )
}

function PSRView() {
  const [purchaseSlider, setPurchaseSlider] = useState(0)
  const [saleSlider, setSaleSlider] = useState(0)
  const baseLoss = 20.7
  const projected = baseLoss + purchaseSlider - saleSlider
  const [psrToast, setPsrToast] = useState<string | null>(null)
  function psrAction(l: string) { setPsrToast(`${l} — generating...`); setTimeout(() => setPsrToast(null), 2500) }

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Finance & Profit & Sustainability Rules</h2><p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Championship PSR limit: £39m loss over 3 rolling years</p></div>

      <div className="flex items-center gap-2 flex-wrap">
        {[{ l: 'PSR Report', i: FileText }, { l: 'Revenue Forecast', i: TrendingUp }, { l: 'Budget Review', i: BarChart3 }, { l: 'What-If Calculator', i: Target }, { l: 'Board Financial Pack', i: Briefcase }, { l: 'Flag Risk', i: AlertCircle }, { l: 'Dept Insights', i: BarChart3 }].map(a => (
          <button key={a.l} onClick={() => psrAction(a.l)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={a.l === 'Dept Insights' ? { backgroundColor: 'transparent', border: '1px solid #F1C40F', color: '#F1C40F' } : { backgroundColor: '#002D7A', color: '#F1C40F' }}><a.i size={12} />{a.l}</button>
        ))}
      </div>

      <div className="rounded-2xl p-6" style={{ backgroundColor: '#111318', border: '2px solid #F59E0B' }}>
        <p className="text-xs font-bold mb-2" style={{ color: '#F59E0B' }}>PSR STATUS: ⚠️ MONITOR</p>
        <div className="flex items-center gap-6"><div><p className="text-3xl font-black" style={{ color: '#F9FAFB' }}>£{projected.toFixed(1)}m</p><p className="text-xs" style={{ color: '#6B7280' }}>3-year rolling loss</p></div><div><p className="text-3xl font-black" style={{ color: '#22C55E' }}>£{(39 - projected).toFixed(1)}m</p><p className="text-xs" style={{ color: '#6B7280' }}>Headroom remaining</p></div><div className="flex-1"><div className="h-4 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}><div className="h-full rounded-full" style={{ width: `${(projected / 39) * 100}%`, backgroundColor: projected > 30 ? '#EF4444' : projected > 20 ? '#F59E0B' : '#22C55E' }} /></div><p className="text-[10px] text-right mt-0.5" style={{ color: '#6B7280' }}>£39m limit</p></div></div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
        <table className="w-full text-sm"><thead><tr style={{ backgroundColor: '#111318', borderBottom: '1px solid #1F2937' }}>{['Year','Revenue','Expenditure','Net P&L','Deductions','PSR Figure'].map(h => <th key={h} className="text-left px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{h}</th>)}</tr></thead>
        <tbody>{[['2023/24','£42.1m','£54.3m','-£12.2m','-£4.1m','-£8.1m'],['2024/25','£46.8m','£57.2m','-£10.4m','-£3.8m','-£6.6m'],['2025/26*','£51.2m','£61.1m','-£9.9m','-£3.9m','-£6.0m']].map((r,i) => <tr key={i} style={{ borderBottom: '1px solid #1F2937' }}>{r.map((c,j) => <td key={j} className="px-4 py-3" style={{ color: j === 0 ? '#F9FAFB' : c.startsWith('-') ? '#EF4444' : '#9CA3AF' }}>{c}</td>)}</tr>)}<tr style={{ backgroundColor: '#0A0B10' }}><td className="px-4 py-3 font-bold" style={{ color: '#F9FAFB' }}>TOTAL</td><td colSpan={3} /><td /><td className="px-4 py-3 font-bold" style={{ color: '#22C55E' }}>-£20.7m ✅</td></tr></tbody></table>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[{ l: 'Match Day', v: '£8.2m', b: '£8.5m' },{ l: 'Broadcasting', v: '£22.4m', b: '£22.0m' },{ l: 'Commercial', v: '£12.1m', b: '£14.0m' },{ l: 'Weekly Wages', v: '£187k', b: '£200k limit' }].map(r => (
          <div key={r.l} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><p className="text-xs" style={{ color: '#6B7280' }}>{r.l}</p><p className="text-lg font-black" style={{ color: '#F9FAFB' }}>{r.v}</p><p className="text-[10px]" style={{ color: '#6B7280' }}>Budget: {r.b}</p></div>
        ))}
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <p className="text-sm font-bold mb-4" style={{ color: '#F9FAFB' }}>What-If PSR Calculator</p>
        <div className="grid grid-cols-2 gap-6">
          <div><p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>Purchase: £{purchaseSlider}m</p><input type="range" min={0} max={20} step={0.5} value={purchaseSlider} onChange={e => setPurchaseSlider(parseFloat(e.target.value))} className="w-full" style={{ accentColor: '#003DA5' }} /></div>
          <div><p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>Sale: £{saleSlider}m</p><input type="range" min={0} max={20} step={0.5} value={saleSlider} onChange={e => setSaleSlider(parseFloat(e.target.value))} className="w-full" style={{ accentColor: '#22C55E' }} /></div>
        </div>
        <div className="mt-4 rounded-lg p-3 text-center" style={{ backgroundColor: projected > 30 ? 'rgba(239,68,68,0.08)' : projected > 20 ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)', border: `1px solid ${projected > 30 ? 'rgba(239,68,68,0.3)' : projected > 20 ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}` }}>
          <p className="text-sm font-bold" style={{ color: projected > 30 ? '#EF4444' : projected > 20 ? '#F59E0B' : '#22C55E' }}>Projected PSR: -£{projected.toFixed(1)}m of £39m limit — {projected > 39 ? '❌ BREACH' : projected > 30 ? '⚠️ AT RISK' : '✅ SAFE'}</p>
        </div>
      </div>

      {psrToast && <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: '#003DA5', color: '#F1C40F' }}>{psrToast}</div>}
    </div>
  )
}

function SquadPlannerView() {
  const [season, setSeason] = useState<'current' | 'next' | 'after'>('current')
  const [spToast, setSpToast] = useState<string | null>(null)
  function spAction(l: string) { setSpToast(`${l} — opening...`); setTimeout(() => setSpToast(null), 2500) }

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Squad Planner</h2><p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Plan your squad for this season, next season and beyond</p></div>

      <div className="flex items-center gap-2 flex-wrap">
        {[{ l: 'Add Target', i: Plus }, { l: 'Save Plan', i: Check }, { l: 'Export to Board', i: FileText }, { l: 'Reset', i: X }, { l: 'Age Profile', i: BarChart3 }, { l: 'Recruitment Priorities', i: Target }, { l: 'Dept Insights', i: BarChart3 }].map(a => (
          <button key={a.l} onClick={() => spAction(a.l)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={a.l === 'Dept Insights' ? { backgroundColor: 'transparent', border: '1px solid #F1C40F', color: '#F1C40F' } : { backgroundColor: '#002D7A', color: '#F1C40F' }}><a.i size={12} />{a.l}</button>
        ))}
      </div>

      <div className="flex gap-2">
        {[{ k: 'current' as const, l: '2025/26 — Current' },{ k: 'next' as const, l: '2026/27 — Next' },{ k: 'after' as const, l: '2027/28 — After' }].map(s => (
          <button key={s.k} onClick={() => setSeason(s.k)} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: season === s.k ? '#003DA5' : '#111318', color: '#F9FAFB', border: season === s.k ? 'none' : '1px solid #1F2937' }}>{s.l}</button>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
        <table className="w-full text-xs"><thead><tr style={{ backgroundColor: '#111318', borderBottom: '1px solid #1F2937' }}>{['#','Player','Pos','Age','Contract','Value','Status'].map(h => <th key={h} className="text-left px-3 py-2" style={{ color: '#6B7280' }}>{h}</th>)}</tr></thead>
        <tbody>{SQUAD.map((p, i) => {
          const expiring = p.contractExpiry.includes('2025') || p.contractExpiry.includes('2026')
          const leaving = season !== 'current' && p.contractExpiry.includes('2025')
          return <tr key={i} style={{ borderBottom: '1px solid #1F2937', opacity: leaving ? 0.3 : 1, textDecoration: leaving ? 'line-through' : 'none' }}>
            <td className="px-3 py-2" style={{ color: '#6B7280' }}>{p.number}</td>
            <td className="px-3 py-2 font-medium" style={{ color: '#F9FAFB' }}>{p.name}</td>
            <td className="px-3 py-2" style={{ color: '#9CA3AF' }}>{p.position}</td>
            <td className="px-3 py-2" style={{ color: '#9CA3AF' }}>{season === 'current' ? p.age : season === 'next' ? p.age + 1 : p.age + 2}</td>
            <td className="px-3 py-2" style={{ color: expiring ? '#EF4444' : '#9CA3AF' }}>{p.contractExpiry}</td>
            <td className="px-3 py-2" style={{ color: '#9CA3AF' }}>{p.marketValue}</td>
            <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: leaving ? 'rgba(239,68,68,0.12)' : expiring ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)', color: leaving ? '#EF4444' : expiring ? '#F59E0B' : '#22C55E' }}>{leaving ? 'Leaving' : expiring ? 'Expiring' : 'Secure'}</span></td>
          </tr>
        })}</tbody></table>
      </div>

      {season !== 'current' && (
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #F59E0B' }}>
          <p className="text-sm font-bold mb-2" style={{ color: '#F59E0B' }}>Positions Needing Recruitment</p>
          <div className="flex gap-3">{['RB', 'CM', 'ST'].map(pos => <span key={pos} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>{pos} — Recruit Needed</span>)}</div>
        </div>
      )}

      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Academy Pipeline</p>
        {ACADEMY_STANDOUTS.map(p => <div key={p.name} className="flex justify-between py-1.5"><span className="text-xs" style={{ color: '#F9FAFB' }}>{p.name} — {p.position}</span><span className="text-xs" style={{ color: '#F1C40F' }}>Ready: {p.pathway === 'First Team Ready' ? 'Now' : '2027'}</span></div>)}
      </div>

      {spToast && <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: '#003DA5', color: '#F1C40F' }}>{spToast}</div>}
    </div>
  )
}

function ClubProfileView() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: '#003DA5' }}>⚽</div>
        <div><h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>AFC Wimbledon</h2><p className="text-sm" style={{ color: '#9CA3AF' }}>EFL League One · Founded 2002</p></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[{ l: 'Nickname', v: 'The Dons' },{ l: 'Colours', v: 'Blue & Yellow' },{ l: 'Stadium', v: 'Plough Lane' },{ l: 'Capacity', v: '9,215' }].map(s => (
          <div key={s.l} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><p className="text-xs" style={{ color: '#6B7280' }}>{s.l}</p><p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{s.v}</p></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F1C40F' }}>🏆 Honours</p>
          {['League One title: 2019/20','League Two title: 2015/16','FA Cup Semi-finals: 1978, 1994','League Cup QF: 2021'].map(h => <p key={h} className="text-xs py-1" style={{ color: '#D1D5DB' }}>{h}</p>)}
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Facilities</p>
          {[{ l: 'Training Ground', v: '⭐⭐⭐⭐ Cat 1' },{ l: 'Stadium', v: '⭐⭐⭐ Championship' },{ l: 'Academy', v: '⭐⭐⭐⭐ EPPP Cat 2' },{ l: 'Medical Centre', v: '⭐⭐⭐⭐' }].map(f => <div key={f.l} className="flex justify-between py-1"><span className="text-xs" style={{ color: '#9CA3AF' }}>{f.l}</span><span className="text-xs" style={{ color: '#F1C40F' }}>{f.v}</span></div>)}
        </div>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Board & Ownership</p>
        {[['Owner', 'The Dons Trust (fan-owned)'],['Manager', 'Johnnie Jackson'],['Founded', '2002'],['Philosophy', '"By the fans, for the fans"']].map(([l,v]) => <div key={l} className="flex justify-between py-1.5"><span className="text-xs" style={{ color: '#9CA3AF' }}>{l}</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{v}</span></div>)}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ backgroundColor: '#111318', borderBottom: '1px solid #1F2937' }}><p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Recent League History</p></div>
        <table className="w-full text-xs"><thead><tr style={{ borderBottom: '1px solid #1F2937' }}>{['Season','Division','Position','Pts'].map(h => <th key={h} className="text-left px-4 py-2" style={{ color: '#6B7280' }}>{h}</th>)}</tr></thead>
        <tbody>{[['2025/26','Championship','8th','—'],['2024/25','Championship','14th','58'],['2023/24','Championship','11th','62'],['2022/23','League One','1st 🏆','92'],['2021/22','League One','4th','78']].map((r,i) => <tr key={i} style={{ borderBottom: '1px solid #1F2937' }}>{r.map((c,j) => <td key={j} className="px-4 py-2" style={{ color: j === 0 ? '#F9FAFB' : c.includes('🏆') ? '#F1C40F' : '#9CA3AF' }}>{c}</td>)}</tr>)}</tbody></table>
      </div>
    </div>
  )
}

function useApiStatus() {
  const [status, setStatus] = useState<{ plan: string; used: number; limit: number; remaining: number } | null>(null)
  useEffect(() => {
    fetch('/api/football/status').then(r => r.json()).then(d => {
      if (d?.response) {
        const s = d.response.requests
        setStatus({ plan: d.response.subscription?.plan || 'Free', used: s.current, limit: s.limit_day, remaining: s.limit_day - s.current })
      }
    }).catch(() => {})
  }, [])
  return status
}

function ApiUsageCard() {
  const status = useApiStatus()
  if (!status) return null
  const pct = Math.round((status.used / status.limit) * 100)
  const barColor = pct >= 85 ? '#EF4444' : pct >= 60 ? '#F59E0B' : '#22C55E'
  const resetTime = new Date(); resetTime.setUTCDate(resetTime.getUTCDate() + 1); resetTime.setUTCHours(0, 0, 0, 0)
  const resetLocal = resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <div className="flex items-center gap-2">
          <span className="text-base">📡</span>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>API & Integrations</p>
        </div>
      </div>
      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: '#9CA3AF' }}>API-Football Plan</span>
          <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{status.plan}</span>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Requests used today</span>
            <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{status.used} / {status.limit}</span>
          </div>
          <div style={{ height: 8, backgroundColor: '#374151', borderRadius: 4 }}>
            <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', backgroundColor: barColor, borderRadius: 4, transition: 'width 0.5s' }} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: '#9CA3AF' }}>Remaining today</span>
          <span className="text-sm font-bold" style={{ color: barColor }}>{status.remaining}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: '#9CA3AF' }}>Quota resets at</span>
          <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{resetLocal} (midnight UTC)</span>
        </div>
        <p className="text-xs" style={{ color: '#6B7280' }}>Upgrade at api-football.com for unlimited calls (~£7/mo)</p>
      </div>
    </div>
  )
}

function ApiStatusStrip() {
  const status = useApiStatus()
  if (!status) return null
  const pct = Math.round((status.used / status.limit) * 100)
  const dotColor = pct >= 85 ? '#EF4444' : pct >= 60 ? '#F59E0B' : '#22C55E'
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#0D1017', border: '1px solid #1F2937' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />
      <span className="text-[11px]" style={{ color: '#6B7280' }}>API: {status.used}/{status.limit} calls used today</span>
    </div>
  )
}

function SettingsView({ isDemo = false, slug = '' }: { isDemo?: boolean; slug?: string }) {
  const [ttsOn, setTtsOn] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_tts_enabled') !== 'false' : true)
  const [vcOn, setVcOn] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_voice_commands_enabled') !== 'false' : true)
  const [activeVoice, setActiveVoice] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_tts_voice') || '21m00Tcm4TlvDq8ikWAM' : '21m00Tcm4TlvDq8ikWAM')
  const [zones, setZones] = useState(getStoredZones)
  const localTz = getUserLocalTz()

  function ToggleButton({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
      <button onClick={onToggle} className="flex-shrink-0" style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: on ? '#003DA5' : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer', position: 'relative' }}>
        <span style={{ position: 'absolute', top: 3, left: on ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
      </button>
    )
  }

  function toggleZone(zone: { label: string; tz: string }) {
    const exists = zones.some(z => z.tz === zone.tz)
    let next: { label: string; tz: string }[]
    if (exists) { next = zones.filter(z => z.tz !== zone.tz) }
    else { if (zones.length >= 4) return; next = [...zones, zone] }
    setZones(next)
    localStorage.setItem('lumio_world_zones', JSON.stringify(next))
    window.dispatchEvent(new StorageEvent('storage', { key: 'lumio_world_zones', newValue: JSON.stringify(next) }))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Settings</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Configure your football portal preferences.</p>
      </div>

      {/* TTS & Voice Commands */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🎙️</span>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Voice Assistant</p>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Text to Speech</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>AI voice reads your morning briefing</p>
            </div>
            <ToggleButton on={ttsOn} onToggle={() => { const v = !ttsOn; setTtsOn(v); localStorage.setItem('lumio_tts_enabled', String(v)) }} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Voice Commands</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Say &ldquo;who&apos;s fit&rdquo;, &ldquo;transfer budget&rdquo;, or &ldquo;team sheet&rdquo;</p>
            </div>
            <ToggleButton on={vcOn} onToggle={() => { const v = !vcOn; setVcOn(v); localStorage.setItem('lumio_voice_commands_enabled', String(v)) }} />
          </div>
        </div>
      </div>

      {/* Voice Selector */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Voice Selection</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5">
          {VOICES.map(voice => {
            const isActive = activeVoice === voice.id
            return (
              <button key={voice.id} onClick={() => { setActiveVoice(voice.id); localStorage.setItem('lumio_tts_voice', voice.id) }}
                className="rounded-xl p-4 text-left transition-colors" style={{ backgroundColor: '#0A0B10', border: isActive ? '1px solid #003DA5' : '1px solid #1F2937' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{voice.name}</p>
                  {isActive && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: '#003DA5' }}>Active</span>}
                </div>
                <p className="text-xs" style={{ color: '#6B7280' }}>{voice.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* World Clock */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🕐</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>World Clock Timezones</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Choose up to 4 timezones for your dashboard</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between rounded-lg px-4 py-2.5" style={{ backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: '#FBBF24' }}>📍</span>
              <span className="text-sm font-medium" style={{ color: '#FBBF24' }}>{localTz.label}</span>
              <span className="text-xs" style={{ color: 'rgba(251,191,36,0.6)' }}>Your timezone</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto">
            {ALL_TIMEZONES.map(zone => {
              const isSelected = zones.some(z => z.tz === zone.tz)
              return (
                <button key={zone.tz} onClick={() => toggleZone(zone)} disabled={!isSelected && zones.length >= 4}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors"
                  style={{
                    backgroundColor: isSelected ? 'rgba(0,61,165,0.08)' : '#0A0B10',
                    border: isSelected ? '1px solid rgba(0,61,165,0.3)' : '1px solid #1F2937',
                    opacity: !isSelected && zones.length >= 4 ? 0.4 : 1,
                    cursor: !isSelected && zones.length >= 4 ? 'not-allowed' : 'pointer',
                  }}>
                  <span className="text-sm" style={{ color: isSelected ? '#003DA5' : '#9CA3AF' }}>{zone.label}</span>
                  {isSelected && <span style={{ color: '#003DA5' }}>✓</span>}
                </button>
              )
            })}
          </div>
          <p className="text-xs" style={{ color: '#6B7280' }}>{zones.length}/4 selected</p>
        </div>
      </div>

      {/* Voice Settings */}
      <VoiceSettings commands={[
        { phrase: 'Show squad fitness', description: 'Lists fit, injured and suspended players' },
        { phrase: 'Next fixture', description: 'Shows the next upcoming match details' },
        { phrase: 'Top scorer this season', description: 'Current leading goalscorer' },
        { phrase: 'Transfer activity', description: 'Latest transfer news and agent messages' },
        { phrase: 'Show injured players', description: 'Full injury list with return dates' },
        { phrase: 'Who is suspended', description: 'Players currently suspended' },
        { phrase: 'Show training schedule today', description: "Today's training session plan" },
        { phrase: 'What is our league position', description: 'Current league standing and points' },
        { phrase: 'Show last match result', description: 'Most recent match score and stats' },
        { phrase: 'Any agent messages', description: 'Unread agent communications' },
        { phrase: 'Show board messages', description: 'Latest messages from the board' },
        { phrase: 'What is our goal difference', description: 'Current goals for and against' },
        { phrase: 'Show press requests', description: 'Outstanding media and press requests' },
        { phrase: 'Any contract renewals due', description: 'Players with contracts expiring soon' },
        { phrase: 'Show the team sheet', description: 'Current selected starting eleven' },
        { phrase: 'What is our home record', description: 'Home match wins draws and losses' },
        { phrase: 'Show youth team results', description: 'Latest academy and youth team scores' },
        { phrase: 'Any scouting reports', description: 'New player scouting reports available' },
        { phrase: 'Show PSR status', description: 'Profitability and sustainability rules position' },
        { phrase: 'What is our wage bill', description: 'Current total squad wage expenditure' },
        { phrase: 'Show transfer budget remaining', description: 'Available transfer window spend' },
        { phrase: 'Any disciplinary issues', description: 'Yellow card accumulations and bans' },
        { phrase: 'Show the tactics board', description: 'Current formation and tactical setup' },
        { phrase: 'What is our clean sheet record', description: 'Clean sheets this season' },
        { phrase: 'Show attendance figures', description: 'Recent home match attendance numbers' },
        { phrase: 'Any loan players due back', description: 'Loan players returning from clubs' },
        { phrase: 'Show the squad depth chart', description: 'Position by position squad coverage' },
        { phrase: 'What is our xG this season', description: 'Expected goals for and against' },
        { phrase: 'Show medical room update', description: 'Full medical and physio department update' },
        { phrase: 'Any academy players ready', description: 'Academy players close to first team' },
        { phrase: 'Show set piece analysis', description: 'Set piece goals scored and conceded' },
        { phrase: 'What is our away record', description: 'Away match wins draws and losses' },
        { phrase: 'Show the GPS data', description: 'Latest player GPS and load monitoring data' },
        { phrase: 'Any contract disputes', description: 'Player or staff contract issues flagged' },
        { phrase: 'Show matchday revenue', description: 'Last home match revenue breakdown' },
        { phrase: 'What players are out of contract', description: 'Players whose deals end this summer' },
        { phrase: 'Show the recruitment targets', description: 'Current transfer target shortlist' },
        { phrase: 'Any international call ups', description: 'Players called up for international duty' },
        { phrase: 'Show pressing stats', description: 'High press and PPDA metrics this season' },
        { phrase: 'What is our possession average', description: 'Average possession percentage this season' },
        { phrase: 'Show the fixture congestion', description: 'Upcoming fixture pile up and rotation needs' },
        { phrase: 'Any travel arrangements needed', description: 'Away trip logistics and travel plans' },
        { phrase: 'Show commercial revenue', description: 'Sponsorship and commercial income summary' },
        { phrase: 'What is our fan base size', description: 'Season ticket holders and fan numbers' },
        { phrase: 'Show social media engagement', description: 'Club social media stats and growth' },
        { phrase: 'Any kit sponsorship updates', description: 'Kit and shirt sponsorship news' },
        { phrase: 'Show the youth development plan', description: 'Academy pathway and development programme' },
        { phrase: 'What is our longest unbeaten run', description: 'Current or best unbeaten sequence' },
        { phrase: 'Show referee assignments', description: 'Upcoming match referee appointments' },
        { phrase: 'Any VAR decisions pending', description: 'Outstanding VAR or appeal decisions' },
        { phrase: 'Show the player ratings', description: 'Average player ratings across the season' },
        { phrase: 'What is our corners won', description: 'Corners won and conversion rate' },
        { phrase: 'Show the dressing room report', description: 'Squad morale and dynamics summary' },
        { phrase: 'Any work permit applications', description: 'Outstanding international player permits' },
        { phrase: 'Show the club planner', description: 'Season schedule and key club dates' },
        { phrase: 'What is our shots on target ratio', description: 'Shots on target percentage this season' },
        { phrase: 'Show offload pipeline', description: 'Players available for transfer or loan' },
        { phrase: 'Any safeguarding concerns', description: 'Youth or community safeguarding flags' },
        { phrase: 'Show the nutrition plan', description: 'Squad nutrition and diet programme' },
        { phrase: 'What is our points per game', description: 'Average points earned per match' },
        { phrase: 'Show fan trust updates', description: 'Latest communications from supporter trust' },
        { phrase: 'Any community programme updates', description: 'Club community and outreach activity' },
        { phrase: 'Show the video analysis', description: 'Latest match analysis and video reports' },
        { phrase: 'What is our goal conversion rate', description: 'Shots to goals conversion percentage' },
        { phrase: 'Show the physio report', description: 'Full squad injury and recovery status' },
        { phrase: 'Any stadium maintenance issues', description: 'Ground and facility maintenance flags' },
        { phrase: 'Show the half time stats', description: 'Half time performance data from last match' },
        { phrase: 'What is our heading success rate', description: 'Aerial duel win percentage' },
        { phrase: 'Show youth fixture list', description: 'Academy and youth team upcoming fixtures' },
        { phrase: 'Any media training needed', description: 'Players scheduled for media training' },
        { phrase: 'Show the match report', description: 'Latest post match report and analysis' },
        { phrase: 'What is our dribble success rate', description: 'Successful dribbles per game average' },
        { phrase: 'Show talent ID targets', description: 'Emerging talent on scouting radar' },
        { phrase: 'Any charity partnership updates', description: 'Club charity and CSR commitments' },
        { phrase: 'Show the FFP position', description: 'Financial fair play compliance status' },
        { phrase: 'What is our save percentage', description: 'Goalkeeper save percentage this season' },
        { phrase: 'Show the player welfare report', description: 'Player wellbeing and welfare checks' },
        { phrase: 'Any kit issues flagged', description: 'Kit room and equipment issues reported' },
        { phrase: 'Show the opponents analysis', description: 'Next opponent scouting and analysis' },
        { phrase: 'What is our tackle success rate', description: 'Tackle win percentage this season' },
        { phrase: 'Show the pre match plan', description: 'Pre match preparation and schedule' },
        { phrase: 'Any loan signings available', description: 'Emergency loan options currently available' },
        { phrase: 'Show the fan survey results', description: 'Latest supporter satisfaction survey' },
        { phrase: 'What is our distance covered', description: 'Average distance covered per match' },
        { phrase: 'Show the captain report', description: "Captain's squad report and feedback" },
        { phrase: 'Any visa applications pending', description: 'Player or staff visa status' },
        { phrase: 'Show the pitch report', description: 'Playing surface condition and forecast' },
        { phrase: 'What is our interception rate', description: 'Interceptions per game this season' },
        { phrase: 'Show the recovery sessions', description: 'Post match recovery programme' },
        { phrase: 'Any kit launch updates', description: 'New kit design and launch planning' },
        { phrase: 'Show the travel budget', description: 'Away travel costs and budget remaining' },
        { phrase: 'What is our sprint speed average', description: 'Peak sprint speed across the squad' },
        { phrase: 'Show the end of season plan', description: 'Season end review and planning schedule' },
        { phrase: 'Any doping test results', description: 'Anti-doping programme and test outcomes' },
        { phrase: 'Show the insurance claims', description: 'Player injury insurance claims status' },
        { phrase: 'What is our pass completion rate', description: 'Passing accuracy percentage this season' },
        { phrase: 'Show the mentorship programme', description: 'Senior and youth mentoring pairs' },
        { phrase: 'Any pre season friendlies confirmed', description: 'Confirmed pre season match schedule' },
      ]} />

      {/* API & Integrations */}
      <ApiUsageCard />

      {/* Demo Data */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Data & Display</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{isDemo ? 'Demo data is active' : 'Demo data'}</p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
              {isDemo ? 'Your portal is showing sample data. Clear it to see your real workspace.' : 'Load sample data to explore all features before connecting your real data.'}
            </p>
          </div>
          <button onClick={() => {
            if (isDemo) { localStorage.removeItem('lumio_football_demo_active'); window.location.href = `/football/${slug}` }
            else { localStorage.setItem('lumio_football_demo_active', 'true'); window.location.href = `/football/${slug}` }
          }} className="w-full rounded-xl py-2.5 text-sm font-semibold" style={{
            backgroundColor: isDemo ? 'rgba(239,68,68,0.1)' : 'rgba(0,61,165,0.1)',
            color: isDemo ? '#EF4444' : '#003DA5',
            border: `1px solid ${isDemo ? 'rgba(239,68,68,0.3)' : 'rgba(0,61,165,0.3)'}`,
          }}>
            {isDemo ? 'Clear demo data' : 'Load demo data'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Toast ──────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: '#003DA5', color: '#F1C40F' }}>
      {message}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

function PlayerProfileModal({ player, onClose, PRIMARY, SECONDARY }: { player: Player, onClose: () => void, PRIMARY: string, SECONDARY: string }) {
  const form = [7.8, 6.9, 7.5, 8.1, 7.2]
  const statColor = (v: number) => v >= 80 ? '#22c55e' : v >= 65 ? PRIMARY : v >= 50 ? '#eab308' : '#ef4444'
  const moraleScore = player.fitness === 'fit' ? 82 : player.fitness === 'injured' ? 45 : player.fitness === 'suspended' ? 60 : 70
  const injuryHistory = player.fitness === 'injured'
    ? [{ type: 'Current', date: 'Mar 2026', games: 3 }]
    : [{ type: 'Muscle strain', date: 'Oct 2025', games: 2 }, { type: 'None recent', date: '—', games: 0 }]

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#0F1117', border: `1px solid ${PRIMARY}40`, borderRadius: 16, width: '100%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', padding: 32 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: SECONDARY }}>
              {player.number}
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#F9FAFB' }}>{player.name}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                <span style={{ backgroundColor: PRIMARY + '30', color: PRIMARY === '#003DA5' ? SECONDARY : PRIMARY, padding: '2px 10px', borderRadius: 6, fontSize: 13, fontWeight: 700 }}>{player.position}</span>
                <span style={{ fontSize: 18 }}>{player.nationality}</span>
                <span style={{ color: '#6B7280', fontSize: 13 }}>Age {player.age}</span>
                <span style={{ backgroundColor: player.fitness === 'fit' ? '#16a34a30' : player.fitness === 'injured' ? '#dc262630' : '#d9770630', color: player.fitness === 'fit' ? '#4ade80' : player.fitness === 'injured' ? '#f87171' : '#fb923c', padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{player.fitness}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #374151', color: '#9CA3AF', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>✕ Close</button>
        </div>

        {/* 3 column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>

          {/* Col 1 — Performance */}
          <div style={{ backgroundColor: '#1A1D27', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Performance</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 28, fontWeight: 900, color: SECONDARY }}>{player.lastRating.toFixed(1)}</div><div style={{ fontSize: 11, color: '#6B7280' }}>Rating</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 28, fontWeight: 900, color: '#F9FAFB' }}>{player.goals}</div><div style={{ fontSize: 11, color: '#6B7280' }}>Goals</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 28, fontWeight: 900, color: '#F9FAFB' }}>{player.assists}</div><div style={{ fontSize: 11, color: '#6B7280' }}>Assists</div></div>
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>Last 5 matches</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {form.map((r, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', backgroundColor: r >= 7.5 ? '#16a34a30' : r >= 6.5 ? PRIMARY + '30' : '#dc262630', borderRadius: 6, padding: '4px 0' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: r >= 7.5 ? '#4ade80' : r >= 6.5 ? SECONDARY : '#f87171' }}>{r.toFixed(1)}</div>
                </div>
              ))}
            </div>
            {player.stats && (
              <div>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>Attributes</div>
                {Object.entries({ PAC: player.stats.PAC, SHO: player.stats.SHO, PAS: player.stats.PAS, DRI: player.stats.DRI, DEF: player.stats.DEF, PHY: player.stats.PHY }).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 30, fontSize: 11, color: '#9CA3AF', fontWeight: 700 }}>{k}</div>
                    <div style={{ flex: 1, height: 6, backgroundColor: '#374151', borderRadius: 3 }}>
                      <div style={{ width: `${v}%`, height: '100%', backgroundColor: statColor(v), borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ width: 24, fontSize: 11, fontWeight: 700, color: statColor(v), textAlign: 'right' }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Col 2 — Contract & Value */}
          <div style={{ backgroundColor: '#1A1D27', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Contract & Value</div>
            {[
              { label: 'Market Value', value: player.marketValue },
              { label: 'Contract Until', value: player.contractExpiry },
              { label: 'Wage Band', value: player.marketValue === '£600k' ? '£4,200/wk' : player.marketValue === '£350k' ? '£2,800/wk' : player.marketValue === '£300k' ? '£2,200/wk' : '£1,800/wk' },
              { label: 'Agent', value: 'Stellar Group' },
              { label: 'Nationality', value: player.nationality + ' ' + (player.nationality === '🏴󠁧󠁢󠁥󠁮󠁧󠁿' ? 'English' : player.nationality === '🇮🇪' ? 'Irish' : player.nationality === '🇩🇪' ? 'German' : player.nationality === '🏴󠁧󠁢󠁳󠁣󠁴󠁿' ? 'Scottish' : 'International') },
              { label: 'Appearances', value: '28' },
              { label: 'Minutes Played', value: '2,340' },
              { label: 'Signed From', value: 'Academy' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid #1F2937' }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#F9FAFB' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Col 3 — Wellbeing */}
          <div style={{ backgroundColor: '#1A1D27', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Wellbeing & Load</div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>Morale</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: moraleScore >= 75 ? '#4ade80' : moraleScore >= 50 ? SECONDARY : '#f87171' }}>{moraleScore}/100</span>
              </div>
              <div style={{ height: 8, backgroundColor: '#374151', borderRadius: 4 }}>
                <div style={{ width: `${moraleScore}%`, height: '100%', backgroundColor: moraleScore >= 75 ? '#16a34a' : moraleScore >= 50 ? PRIMARY : '#dc2626', borderRadius: 4 }} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>GPS Load (this week)</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB' }}>74%</span>
              </div>
              <div style={{ height: 8, backgroundColor: '#374151', borderRadius: 4 }}>
                <div style={{ width: '74%', height: '100%', backgroundColor: SECONDARY, borderRadius: 4 }} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>Recovery Score</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>88%</span>
              </div>
              <div style={{ height: 8, backgroundColor: '#374151', borderRadius: 4 }}>
                <div style={{ width: '88%', height: '100%', backgroundColor: '#16a34a', borderRadius: 4 }} />
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Injury History</div>
            {injuryHistory.map((inj, i) => (
              <div key={i} style={{ backgroundColor: '#111318', borderRadius: 8, padding: '8px 12px', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#F9FAFB' }}>{inj.type}</span>
                <span style={{ fontSize: 12, color: '#6B7280' }}>{inj.date} {inj.games > 0 ? `· ${inj.games} games` : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer quick actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['Log Injury', 'Contact Agent', 'Extend Contract', 'Transfer List', 'Player Report', 'Team Talk'].map(action => (
            <button key={action} onClick={() => {}} style={{ backgroundColor: PRIMARY, color: SECONDARY, border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function FootballDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [activeDept, setActiveDept] = useState<DeptId>('overview')
  const [clubName, setClubName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('football_club_name') || 'AFC Wimbledon'
    }
    return 'AFC Wimbledon'
  })
  const [userName, setUserName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('football_user_name') || localStorage.getItem('workspace_user_name') || ''
    }
    return ''
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [isFootballDemo, setIsFootballDemo] = useState(false)
  const [fbMounted, setFbMounted] = useState(false)
  const [clubLogo, setClubLogo] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('lumio_football_logo') : null
  )

  useEffect(() => {
    const check = () => setIsFootballDemo(localStorage.getItem('lumio_football_demo_active') === 'true')
    check()
    setFbMounted(true)
    const interval = setInterval(check, 1000)
    return () => clearInterval(interval)
  }, [])

  // Set default badge when demo is active — state only, no localStorage
  useEffect(() => {
    if (isFootballDemo && !localStorage.getItem('lumio_football_logo')) {
      setClubLogo('/badges/afc_wimbledon_badge_studio.png')
    } else if (!isFootballDemo && !localStorage.getItem('lumio_football_logo')) {
      setClubLogo(null)
    }
  }, [isFootballDemo])

  function fireToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const LABEL_TO_ACTION: Record<string, string> = {
    'Team Sheet': 'team-sheet', 'Log Injury': 'log-injury', 'Scout Report': 'scout-report',
    'Board Report': 'board-report', 'Training Plan': 'training-plan', 'Press Conf': 'press-conference',
    'Book Video Room': 'video-analysis', 'Opposition Report': 'match-prep', 'Set Piece Planner': 'set-pieces',
    'Video Analysis': 'video-analysis', 'Submit Bid': 'submit-bid', 'New Target': 'add-target',
    'Rehab Plan': 'return-to-play', 'Fitness Report': 'load-report',
    'New Report': 'scout-report', 'Watchlist': 'add-target', 'Trip Planner': 'travel-booking',
    'Development Plan': 'development-plan', 'Match Report': 'match-report',
    'Player Comparison': 'market-value', 'Heat Maps': 'load-report', 'Video Clips': 'video-analysis',
    'Press Brief': 'press-conference', 'Social Post': 'social-post', 'Media Schedule': 'interview-request',
    'Session Plan': 'training-plan', 'Load Report': 'load-report', 'Recovery Schedule': 'recovery-session',
    'Budget Overview': 'board-report', 'Wage Report': 'renewal', 'Revenue Dashboard': 'sponsor-report',
    'Operations Checklist': 'compliance-check', 'Match Prep': 'match-prep', 'Set Pieces': 'set-pieces',
    'Recovery Session': 'recovery-session', 'Formation Builder': 'team-sheet',
    'Ticketing': 'travel-booking', 'Pitch Report': 'compliance-check',
  }

  function handleActionClick(label: string) {
    if (label === 'Dept Insights') { setShowAIInsights(true); return }
    const actionId = LABEL_TO_ACTION[label]
    if (actionId) setActiveAction(actionId)
    else fireToast(`${label} — coming soon`)
  }

  useEffect(() => {
    const name = localStorage.getItem('football_club_name') || 'AFC Wimbledon'
    const user = localStorage.getItem('football_user_name') || localStorage.getItem('workspace_user_name') || ''
    setClubName(name)
    setUserName(user)
  }, [slug])

  const deptLabel = SIDEBAR_ITEMS.find(d => d.id === activeDept)?.label || 'Overview'
  const initials = userName ? userName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'FC'

  if (!fbMounted) return null

  return (
    <div className="flex flex-col" style={{ backgroundColor: '#07080F', color: '#F9FAFB', height: '100vh', overflow: 'hidden' }}>
      <Toast message={toast} />

      {/* Demo banner */}
      {isFootballDemo && (
        <div className="flex items-center justify-between px-6 pr-20 shrink-0" style={{ height: 40, minHeight: 40, background: '#003DA5', color: '#F1C40F' }}>
          <div className="flex items-center gap-2 text-xs font-medium"><span>Demo workspace — exploring with sample data</span><span style={{ opacity: 0.7 }}>· Connect your real club data to see live insights</span></div>
          <button onClick={() => { localStorage.removeItem('lumio_football_demo_active'); window.location.href = `/football/${slug}` }} className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ border: '1px solid rgba(241,196,15,0.4)', background: 'transparent', color: '#F1C40F' }}>Clear Demo Data</button>
        </div>
      )}

      {/* Top-right avatar */}
      <div className="fixed hidden md:flex items-center gap-2" style={{ top: 12, right: 20, zIndex: 60 }}>
        <button title="Notifications" style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
          <Bell size={16} strokeWidth={1.75} />
          <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EF4444', fontSize: 6, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>3</span>
        </button>
        <AvatarDropdown initials={initials} settingsHref={`/football/${slug}/settings`} />
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden flex items-center px-4 py-2 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
        <button className="p-1.5 rounded-lg" style={{ color: '#9CA3AF' }} onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
        <span className="text-sm font-semibold ml-2 truncate" style={{ color: '#F9FAFB' }}>{clubName}</span>
      </div>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeDept={activeDept} onSelect={setActiveDept} open={sidebarOpen} onClose={() => setSidebarOpen(false)} clubName={clubName} />

        <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
          <main className="flex-1 p-4 sm:p-5">
            {activeDept !== 'overview' && (
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-lg font-bold">{deptLabel}</h1>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Club: <span style={{ color: '#F9FAFB' }}>{clubName}</span></p>
                </div>
              </div>
            )}

            {activeDept === 'overview' && <OverviewView clubName={clubName} firstName={userName ? userName.split(' ')[0] : undefined} onAction={handleActionClick} isDemo={isFootballDemo} clubLogo={clubLogo} />}
            {activeDept === 'insights' && (isFootballDemo ? <InsightsView /> : <FootballEmptyState dept="Insights" />)}
            {activeDept !== 'overview' && activeDept !== 'settings' && activeDept !== 'insights' && !isFootballDemo && <FootballEmptyState dept={deptLabel} />}
            {activeDept !== 'overview' && activeDept !== 'settings' && activeDept !== 'insights' && isFootballDemo && (() => {
              const DEPT_HIGHLIGHTS: Record<string, string[]> = {
                squad: ['Top performers this week: Dele Adeyemi (8.2 avg), Liam Cross (7.9)', 'Jamie Torres back from injury — available for selection Saturday', '2 contract renewals due before June window', 'Academy graduate Ryan Mills recommended for first-team squad', 'No international call-ups affecting next 3 fixtures'],
                tactics: ['4-3-3 formation win rate 62% — highest this season', 'Set piece conversion improved to 18% after Thursday drill', 'Opposition weakness: left-back area exploitable on transitions', 'Key matchup: Adeyemi vs their RB — pace advantage significant', 'Pressing success rate 34% — above league average 28%'],
                transfers: ['3 inbound targets shortlisted for summer window', 'Enquiry received for Kyle Brennan — £180k offer', '2 contracts expiring in 6 months — negotiations needed', 'Transfer budget remaining: £120k of £400k allocation', 'Agent meeting scheduled Thursday for loan extension'],
                medical: ['2 players currently in rehab — Torres (knee), Fletcher (shoulder)', 'Torres expected return: 10 days, Fletcher: 3 weeks', 'Fitness tests due this week for 4 returning players', 'Injury risk flag: Adeyemi high load last 3 matches', 'Match fitness: squad average 87% — target 90%'],
                scouting: ['3 new targets added to watchlist this month', '2 scouting reports due by end of week', 'Trial session scheduled Saturday AM — 2 youth prospects', 'Recommended signing: LB target rated 8/10 by chief scout', 'Watchlist updated: 14 active targets across 3 positions'],
                academy: ['2 graduates ready for first-team consideration', 'Academy win rate this season: 71% across all age groups', '3 scholarship renewals due for review by April', 'Talent pathway review meeting scheduled next Tuesday', 'Parent liaison meetings: 4 outstanding this term'],
                analytics: ['xG vs actual goals: +2.3 over-performance this month', 'Pressing intensity 12% above league average', 'Defensive line height 34m — 2m higher than last month', 'Set piece efficiency: 22% from corners (league avg 16%)', 'Possession vs win rate: 58% possession correlates with 68% win rate'],
                dynamics: ['Team morale indicators: 8.2/10 — highest since October', 'Training intensity scores up 6% week-on-week', 'Leadership group action: captain meeting scheduled Friday', 'No conflict flags this week', 'Team bonding session planned for Wednesday afternoon'],
                media: ['Press conference scheduled Friday 2pm — pre-match', 'Social media reach this week: 124k (+18% vs last week)', 'Sponsor content deadline: Thursday for matchday programme', '2 interview requests pending — local press + podcast', 'No crisis comms flags currently active'],
                social: ['Best performing post: matchday highlight reel (42k views)', 'Follower growth: +820 this week across all platforms', 'Content schedule: 2 gaps identified in next week plan', 'Fan engagement rate: 4.8% — above 3.5% benchmark', 'Viral opportunity: behind-the-scenes training video trending'],
                matchday: ['Pre-match prep checklist: 85% complete', 'Travel arrangements confirmed for Saturday away fixture', 'Kit and equipment check completed — all clear', 'Referee briefing notes shared with coaching staff', 'Starting XI finalised — announced Friday 3pm'],
                training: ['Session attendance this week: 94%', 'Fitness benchmark results: 3 players improved their times', 'Tactical drill completion rate: 88%', 'Load management flag: Adeyemi recommended light session Thursday', 'Next session plan uploaded — Friday AM recovery session'],
                performance: ['Highest load player this week: Dele Adeyemi (2,840 AU)', 'Recovery scores: squad average 7.8/10', 'Sprint distance leaders: Adeyemi 1.2km, Cole 1.1km', 'Fatigue risk players: Torres (amber), Adeyemi (amber)', 'GPS anomaly flagged: Fletcher — reduced output in last session'],
                finance: ['PSR headroom: £85k remaining for this reporting period', 'Wage bill at 72% of revenue — target under 75%', 'Player sale target: £150k needed to balance books by June', 'Commercial revenue 8% above target year-to-date', 'Cost overrun flagged: medical department 12% over budget'],
                staff: ['All coaching staff DBS checks current', 'Physio vacancy — interviews scheduled next week', 'CPD compliance: 2 staff outstanding', 'Staff wellbeing survey results: 7.6/10', 'Annual reviews: 3 due this month'],
                facilities: ['Pitch maintenance scheduled Monday', 'Floodlight inspection due — annual certificate expiring', 'Changing room refurb quote received — £12k', 'Car park resurfacing flagged', 'Groundsman leave cover arranged'],
                'squad-planner': ['Left-back position still requires cover signing', 'Squad depth: thin at centre-back if Brennan injured', '1 loan return due end of April — decision needed', '2 trialists awaiting final decision by Friday', 'Summer window priority: left-back, central midfielder, backup striker'],
                'club-profile': ['Club rating 7.2 — above league average 6.8', 'Stadium capacity utilisation: 78% average this season', 'Academy output rank: 3rd in division', 'Fanbase growth: +4.2% year-on-year', 'Commercial partnerships: 8 active, 2 in negotiation'],
                psr: ['PSR submission deadline: 45 days away', 'Current projected position: within limits', 'Wage-to-revenue ratio: 72% (limit 75%)', 'Amortisation schedule on track', 'No transfer embargo risk flagged'],
              }
              const highlights = DEPT_HIGHLIGHTS[activeDept] || ['No highlights available for this department']
              const deptName = SIDEBAR_ITEMS.find(d => d.id === activeDept)?.label || activeDept
              return (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch mb-4">
                  <DeptAISummary dept={activeDept} portal="football" />
                  <div className="rounded-xl overflow-hidden flex flex-col" style={{ border: '1px solid rgba(0,61,165,0.4)' }}>
                    <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: 'rgba(0,61,165,0.08)', borderBottom: '1px solid rgba(0,61,165,0.2)' }}>
                      <Sparkles size={14} style={{ color: '#003DA5' }} />
                      <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: '#F1C40F' }}>{deptName}</span>
                    </div>
                    <div className="flex flex-col gap-3 p-4 flex-1" style={{ backgroundColor: '#07080F' }}>
                      {highlights.map((item, i) => (
                        <div key={i} className="flex gap-3">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: '#F1C40F' }}>{i + 1}</span>
                          <p className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mb-2">
                  <button onClick={() => setShowAIInsights(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-opacity hover:opacity-90" style={{ backgroundColor: '#1a1a2e', border: '1px solid #F1C40F', color: '#F1C40F' }}>
                    📊 Insights
                  </button>
                </div>
              </>
              )
            })()}
            {isFootballDemo && activeDept === 'squad' && <SquadView />}
            {isFootballDemo && activeDept === 'tactics' && <TacticsView onActionClick={handleActionClick} />}
            {isFootballDemo && activeDept === 'set-pieces' && <ProSetPiecesView />}
            {isFootballDemo && activeDept === 'transfers' && <TransfersView onActionClick={handleActionClick} />}
            {isFootballDemo && activeDept === 'board' && <BoardSuiteView />}
            {isFootballDemo && activeDept === 'medical' && <MedicalView />}
            {isFootballDemo && activeDept === 'scouting' && <ScoutingView />}
            {isFootballDemo && activeDept === 'academy' && <AcademyView onActionClick={handleActionClick} />}
            {isFootballDemo && activeDept === 'analytics' && <AnalyticsView />}
            {isFootballDemo && activeDept === 'media' && <MediaView />}
            {isFootballDemo && activeDept === 'social' && <SocialMediaView />}
            {isFootballDemo && activeDept === 'matchday' && <MatchdayView />}
            {isFootballDemo && activeDept === 'training' && <TrainingView />}
            {isFootballDemo && activeDept === 'performance' && <GPSPerformanceView />}
            {isFootballDemo && activeDept === 'finance' && <FinanceView />}
            {isFootballDemo && activeDept === 'staff' && <StaffView />}
            {isFootballDemo && activeDept === 'facilities' && <FacilitiesView />}
            {isFootballDemo && activeDept === 'dynamics' && <DynamicsView />}
            {isFootballDemo && activeDept === 'psr' && <PSRView />}
            {isFootballDemo && activeDept === 'squad-planner' && <SquadPlannerView />}
            {isFootballDemo && activeDept === 'club-profile' && <ClubProfileView />}
            {activeDept === 'wyscout' && <WyscoutView />}
            {activeDept === 'scouting-db' && <ScoutingDBView />}
            {activeDept === 'gps-hardware' && <GPSHardwareView />}
            {activeDept === 'opta' && <OptaStatsBombView />}
            {activeDept === 'find-club' && <FindClubView />}
            {activeDept === 'find-player' && <FindPlayerView />}
            {activeDept === 'teams' && <TeamsView />}
            {activeDept === 'leagues' && <LeaguesView />}
            {activeDept === 'fixtures-results' && <FixturesView />}
            {activeDept === 'pyramid' && <FootballPyramidView />}
            {activeDept === 'statsbomb' && <StatsBombView />}
            {activeDept === 'settings' && <SettingsView isDemo={isFootballDemo} slug={slug} />}
          </main>
        </div>
      </div>

      {activeAction && (
        <FootballActionModal
          actionId={activeAction}
          onClose={() => setActiveAction(null)}
          onToast={fireToast}
        />
      )}
      <AIInsightsReport dept={activeDept} portal="football" isOpen={showAIInsights} onClose={() => setShowAIInsights(false)} />
    </div>
  )
}
