// ═══════════════════════════════════════════════════════════════════════════════
// ROUTING: dev.lumiocms.com/football/[slug]  →  THIS FILE
// ═══════════════════════════════════════════════════════════════════════════════
'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SportsDemoGate, RoleSwitcher } from '@/components/sports-demo'
import type { SportsDemoSession } from '@/components/sports-demo'
import MediaContentModule from '@/components/sports/media-content/MediaContentModule'
import { use } from 'react'
import {
  Users, TrendingUp, Headphones, AlertCircle,
  CheckCircle2, Loader2, Clock, ArrowRight,
  Zap, Star, ChevronDown, ChevronUp, BarChart3, Sparkles,
  X, Plus, Check,
  Home, Settings, Hash, Menu, ChevronLeft,
  Calendar, FileText, Target, Volume2,
  Bell, Activity, Shield, Shirt, Clipboard, Trophy,
  UserPlus, DollarSign, Heart, Eye, Video, MapPin,
  Briefcase, GraduationCap, Newspaper, Phone, MessageSquare,
  Search, Filter, ArrowUpDown, ExternalLink, Crown,
  Maximize2, Printer, Share2, Flame,
  Building, Plane, Brain, Calculator,
} from 'lucide-react'
import { useDraggableList } from '@/hooks/useDraggableList'
import { useElevenLabsTTS as useSpeech } from '@/hooks/useElevenLabsTTS'
import FootballActionModal from '@/components/modals/FootballActionModal'
import PlayerWelfareHub from '@/components/football/PlayerWelfareHub'
import CommercialView from '@/components/football/CommercialView'
import CommunityView from '@/components/football/CommunityView'
import ToursAndCampsView from '@/components/football/ToursAndCampsView'
import DiscoverView from '@/components/football/DiscoverView'
import ConcussionTrackerView from '@/components/football/ConcussionTrackerView'
import PSRScenarioModellerView from '@/components/football/PSRScenarioModellerView'
import RoleAwareQuickActionsBar from '@/components/portals/RoleAwareQuickActionsBar'
// ─── Football v2 dashboard imports ────────────────────────────────────────
import { THEMES, DENSITY, FONT as V2_FONT, getGreeting as v2GetGreeting } from '@/app/cricket/[slug]/v2/_lib/theme'
import {
  CommandPalette as V2CommandPalette,
  AskLumio as V2AskLumio,
  FixtureDrawer as V2FixtureDrawer,
  Toast as V2Toast,
  useToast as useV2Toast,
  useKey as useV2Key,
} from '@/app/cricket/[slug]/v2/_components/Overlays'
import { Icon as V2Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import {
  HeroToday as FbHeroToday,
  TodaySchedule as FbTodaySchedule,
  StatTiles as FbStatTiles,
  AIBrief as FbAIBrief,
  Inbox as FbInbox,
  Squad as FbSquadModule,
  Fixtures as FbFixturesModule,
  Perf as FbPerf,
  Recents as FbRecents,
  Season as FbSeason,
} from './_components/FootballDashboardModules'
import { FOOTBALL_INBOX, FOOTBALL_ACCENT } from './_lib/football-dashboard-data'
import type { FbFixture } from './_lib/football-dashboard-data'
import { EmployeeProfileCard, getGridCols, type StaffRecord } from '@/components/team/EmployeeProfileCard'
import FootballStaffView from '@/components/football/StaffView'
import GPSPerformanceView from '@/components/football/GPSPerformanceView'
import BoardSuiteView from '@/components/football/BoardSuiteView'
import VoiceSettings from '@/components/dashboard/VoiceSettings'
import { FootballScoutIntegrationView, ScoutingDBView, GPSHardwareView, FootballEventDataView } from '@/components/football/IntegrationViews'
import { FootballLeagueDataView } from '@/components/football/LeagueViews'
import ProSetPiecesView from '@/components/football/ProSetPiecesView'
import FootballBodyMap, { DEMO_INJURIES } from '@/components/football/FootballBodyMap'
import AvatarDropdown from '@/components/dashboard/AvatarDropdown'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────

type DeptId =
  | 'overview' | 'insights' | 'board' | 'squad' | 'tactics' | 'set-pieces' | 'transfers'
  | 'medical' | 'scouting' | 'academy' | 'analytics'
  | 'media' | 'social' | 'matchday' | 'training' | 'performance' | 'finance'
  | 'dynamics' | 'psr-scr-modeller' | 'concussion-tracker' | 'squad-planner'
  | 'staff' | 'facilities' | 'settings'
  | 'lumio-vision' | 'scouting-db' | 'gps-hardware' | 'gps-heatmaps' | 'opta'
  | 'discover' | 'lumio-data-pro'
  | 'tours-camps'
  | 'player-welfare' | 'club-operations'
  | 'commercial' | 'community'

type OverviewTab = 'getting-started' | 'today' | 'quick-wins' | 'match-week' | 'insights' | 'dont-miss' | 'staff'

type SidebarSection = null | 'OVERVIEW' | 'BOARD' | 'COMMUNITY' | 'PERFORMANCE' | 'FIRST TEAM' | 'MEDICAL' | 'GPS & LOAD' | 'OPERATIONS' | 'RECRUITMENT' | 'COMMERCIAL' | 'COMPLIANCE' | 'DISCOVER' | 'INTEGRATIONS'

// ─── Constants ───────────────────────────────────────────────────────────────

const FOOTBALL_QUOTES = [
  { text: "Football is a simple game. Twenty-two men chase a ball for 90 minutes and at the end, the Germans always win.", author: "Gary Lineker" },
  { text: "I wouldn't say I was the best manager in the business. But I was in the top one.", author: "Brian Clough" },
  { text: "Some people believe football is a matter of life and death. I assure you it is much, much more important than that.", author: "Bill Shankly" },
  { text: "In football, the worst blindness is only seeing the ball.", author: "Bright Falcao" },
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
  { id: 'overview',       label: 'Dashboard',            icon: Home,           section: 'OVERVIEW' },
  { id: 'insights',       label: 'Insights',             icon: Sparkles,       section: 'OVERVIEW' },
  { id: 'board',          label: 'Board Suite',          icon: Crown,          section: 'BOARD' },
  { id: 'facilities',     label: 'Stadium & Facilities', icon: MapPin,         section: 'BOARD' },
  { id: 'community',      label: 'Community',            icon: Heart,          section: 'COMMUNITY' },
  { id: 'matchday',       label: 'Match Centre',         icon: Trophy,         section: 'PERFORMANCE' },
  { id: 'lumio-vision',   label: 'Lumio Vision',         icon: Video,          section: 'PERFORMANCE' },
  { id: 'analytics',      label: 'Performance Stats',    icon: BarChart3,      section: 'PERFORMANCE' },
  { id: 'set-pieces',     label: 'Set Piece Analysis',   icon: Target,         section: 'PERFORMANCE' },
  { id: 'scouting',       label: 'Opposition Scout',     icon: Eye,            section: 'PERFORMANCE' },
  { id: 'squad',          label: 'Squad Manager',        icon: Shirt,          section: 'FIRST TEAM' },
  { id: 'squad-planner',  label: 'Team Selection',       icon: Clipboard,      section: 'FIRST TEAM' },
  { id: 'tactics',        label: 'Formation Builder',    icon: Clipboard,      section: 'FIRST TEAM' },
  { id: 'training',       label: 'Training Planner',     icon: Activity,       section: 'FIRST TEAM' },
  { id: 'tours-camps',    label: 'Tours & Camps',        icon: Plane,          section: 'FIRST TEAM' },
  { id: 'staff',          label: 'Staff',                icon: Users,          section: 'FIRST TEAM' },
  { id: 'medical',        label: 'Medical Hub',          icon: Heart,          section: 'MEDICAL' },
  { id: 'concussion-tracker', label: 'Concussion Tracker', icon: Brain,         section: 'MEDICAL' },
  { id: 'dynamics',       label: 'Mental Performance',   icon: Heart,          section: 'MEDICAL' },
  { id: 'player-welfare', label: 'Player Welfare Hub',   icon: Heart,          section: 'MEDICAL' },
  { id: 'performance',    label: 'GPS Tracking',         icon: Activity,       section: 'GPS & LOAD' },
  { id: 'gps-heatmaps',   label: 'Heatmaps',             icon: Flame,          section: 'GPS & LOAD' },
  { id: 'gps-hardware',   label: 'GPS Hardware',         icon: Activity,       section: 'GPS & LOAD' },
  { id: 'club-operations', label: 'Club Operations',     icon: Building,       section: 'OPERATIONS' },
  { id: 'transfers',      label: 'Recruitment Hub',      icon: ArrowUpDown,    section: 'RECRUITMENT' },
  { id: 'academy',        label: 'Academy',              icon: GraduationCap,  section: 'RECRUITMENT' },
  { id: 'commercial',     label: 'Commercial',           icon: Briefcase,      section: 'COMMERCIAL' },
  { id: 'media',          label: 'Media & PR',           icon: Newspaper,      section: 'COMMERCIAL' },
  { id: 'social',         label: 'Social Media',         icon: MessageSquare,  section: 'COMMERCIAL' },
  { id: 'finance',        label: 'Finance',              icon: DollarSign,     section: 'COMPLIANCE' },
  { id: 'psr-scr-modeller', label: 'PSR / SCR Modeller', icon: Calculator,     section: 'COMPLIANCE' },
  { id: 'discover',       label: 'Discover',             icon: Search,         section: 'DISCOVER' },
  { id: 'scouting-db',    label: 'Scouting Database',    icon: Search,         section: 'INTEGRATIONS' },
  { id: 'opta',           label: 'Lumio Data',           icon: BarChart3,      section: 'INTEGRATIONS' },
  { id: 'lumio-data-pro', label: 'Lumio Data Pro',       icon: Activity,       section: 'INTEGRATIONS' },
  { id: 'settings',       label: 'Settings',             icon: Settings,       section: null },
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
  // Goalkeepers
  { name: 'Jordan Hayes',       number: 1,  position: 'GK',  nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 26, contractExpiry: 'Jun 2027', marketValue: '£180k', fitness: 'fit',     lastRating: 6.8,  goals: 0,  assists: 0, stats: { PAC: 45, SHO: 20, PAS: 52, DRI: 30, DEF: 28, PHY: 65 } },
  { name: 'Joe McDonnell',       number: 20, position: 'GK',  nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 31, contractExpiry: 'Jun 2026', marketValue: '£100k', fitness: 'fit',     lastRating: 6.9,  goals: 0,  assists: 0, stats: { PAC: 42, SHO: 18, PAS: 50, DRI: 28, DEF: 26, PHY: 62 } },
  // Defenders
  { name: 'Tom Fletcher',        number: 3,  position: 'LB',  nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 28, contractExpiry: 'Jun 2027', marketValue: '£450k', fitness: 'fit',     lastRating: 7.18, goals: 1,  assists: 8, stats: { PAC: 72, SHO: 55, PAS: 68, DRI: 65, DEF: 71, PHY: 70 } },
  { name: 'Daniel Webb',        number: 6,  position: 'CB',  nationality: '🇮🇪',         age: 29, contractExpiry: 'Jun 2027', marketValue: '£350k', fitness: 'fit',     lastRating: 7.08, goals: 2,  assists: 1, stats: { PAC: 62, SHO: 40, PAS: 55, DRI: 45, DEF: 74, PHY: 76 } },
  { name: 'Marcus Reid',       number: 15, position: 'CB',  nationality: '🇩🇪',         age: 33, contractExpiry: 'Jun 2026', marketValue: '£200k', fitness: 'fit',     lastRating: 6.9,  goals: 1,  assists: 0, stats: { PAC: 55, SHO: 38, PAS: 52, DRI: 42, DEF: 72, PHY: 78 } },
  { name: 'Isaac Kemp',      number: 33, position: 'CB',  nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 23, contractExpiry: 'Jun 2027', marketValue: '£300k', fitness: 'fit',     lastRating: 6.8,  goals: 0,  assists: 0, stats: { PAC: 68, SHO: 35, PAS: 50, DRI: 44, DEF: 70, PHY: 74 } },
  { name: 'Joe Lewis',           number: 31, position: 'CB',  nationality: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', age: 26, contractExpiry: 'Jun 2026', marketValue: '£175k', fitness: 'fit',     lastRating: 6.7,  goals: 0,  assists: 0, stats: { PAC: 60, SHO: 32, PAS: 48, DRI: 40, DEF: 68, PHY: 72 } },
  { name: 'Kyle Osei',      number: 2,  position: 'RB',  nationality: '🇺🇬',         age: 21, contractExpiry: 'Jun 2026', marketValue: '£250k', fitness: 'fit',     lastRating: 6.6,  goals: 0,  assists: 1, stats: { PAC: 76, SHO: 42, PAS: 58, DRI: 62, DEF: 65, PHY: 68 } },
  { name: 'Brodi Chen',        number: 17, position: 'CB',  nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 21, contractExpiry: 'Jun 2026', marketValue: '£200k', fitness: 'doubt',   lastRating: 6.5,  goals: 0,  assists: 0, stats: { PAC: 64, SHO: 30, PAS: 46, DRI: 38, DEF: 66, PHY: 70 } },
  // Midfielders
  { name: 'Liam Barker',      number: 8,  position: 'CM',  nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 28, contractExpiry: 'Jun 2027', marketValue: '£400k', fitness: 'fit',     lastRating: 7.05, goals: 3,  assists: 4, stats: { PAC: 65, SHO: 62, PAS: 72, DRI: 68, DEF: 66, PHY: 72 } },
  { name: 'Connor Walsh',         number: 4,  position: 'CM',  nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 32, contractExpiry: 'Jun 2026', marketValue: '£200k', fitness: 'fit',     lastRating: 6.95, goals: 2,  assists: 3, stats: { PAC: 58, SHO: 58, PAS: 70, DRI: 64, DEF: 68, PHY: 70 } },
  { name: 'Ryan Cole',      number: 12, position: 'CM',  nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 26, contractExpiry: 'Jun 2027', marketValue: '£400k', fitness: 'fit',     lastRating: 6.96, goals: 4,  assists: 5, stats: { PAC: 66, SHO: 64, PAS: 70, DRI: 66, DEF: 62, PHY: 68 } },
  { name: 'Paul Granger',      number: 5,  position: 'CDM', nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 36, contractExpiry: 'Jun 2026', marketValue: '£100k', fitness: 'fit',     lastRating: 6.85, goals: 0,  assists: 1, stats: { PAC: 50, SHO: 45, PAS: 65, DRI: 55, DEF: 72, PHY: 74 } },
  { name: 'Myles Okafor',     number: 21, position: 'LW',  nationality: '🇬🇩',         age: 31, contractExpiry: 'Jun 2026', marketValue: '£250k', fitness: 'fit',     lastRating: 6.9,  goals: 3,  assists: 4, stats: { PAC: 74, SHO: 60, PAS: 62, DRI: 72, DEF: 40, PHY: 65 } },
  { name: 'Zack Bright',         number: 37, position: 'CM',  nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 20, contractExpiry: 'Jun 2026', marketValue: '£200k', fitness: 'fit',     lastRating: 6.7,  goals: 1,  assists: 1, stats: { PAC: 70, SHO: 55, PAS: 64, DRI: 62, DEF: 56, PHY: 60 } },
  { name: 'Delano Ashton', number: 16, position: 'CM',  nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 21, contractExpiry: 'Jun 2027', marketValue: '£150k', fitness: 'fit',     lastRating: 6.5,  goals: 0,  assists: 0, stats: { PAC: 68, SHO: 48, PAS: 58, DRI: 56, DEF: 54, PHY: 62 } },
  { name: 'James Tilley',        number: 19, position: 'RW',  nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 27, contractExpiry: 'Jun 2026', marketValue: '£275k', fitness: 'fit',     lastRating: 6.8,  goals: 2,  assists: 3, stats: { PAC: 75, SHO: 64, PAS: 66, DRI: 74, DEF: 38, PHY: 62 } },
  // Forwards
  { name: 'Dean Morris',       number: 11, position: 'LW',  nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 28, contractExpiry: 'Jun 2027', marketValue: '£600k', fitness: 'fit',     lastRating: 7.2,  goals: 12, assists: 3, stats: { PAC: 78, SHO: 72, PAS: 68, DRI: 76, DEF: 35, PHY: 66 } },
  { name: 'Sam Porter',      number: 10, position: 'ST',  nationality: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', age: 26, contractExpiry: 'Jun 2026', marketValue: '£450k', fitness: 'fit',     lastRating: 7.0,  goals: 9,  assists: 4, stats: { PAC: 70, SHO: 72, PAS: 60, DRI: 64, DEF: 32, PHY: 74 } },
  { name: 'Chris Nwosu',         number: 9,  position: 'ST',  nationality: '🇱🇧',         age: 30, contractExpiry: 'Jun 2026', marketValue: '£300k', fitness: 'injured', lastRating: 6.95, goals: 5,  assists: 4, stats: { PAC: 62, SHO: 68, PAS: 58, DRI: 56, DEF: 38, PHY: 78 } },
  { name: 'Antwoine Rowe',   number: 18, position: 'CF',  nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 22, contractExpiry: 'Jun 2027', marketValue: '£350k', fitness: 'fit',     lastRating: 6.75, goals: 4,  assists: 2, stats: { PAC: 76, SHO: 66, PAS: 56, DRI: 68, DEF: 30, PHY: 70 } },
]

const INJURIES = [
  { player: 'Chris Nwosu',   type: 'Calf strain',          expectedReturn: 'Apr 2026', phase: 'Rehabilitation',  since: 'Mar 2026', matchesMissed: 4 },
  { player: 'Brodi Chen',  type: 'Hamstring tightness',  expectedReturn: 'Apr 2026', phase: 'Light training',   since: 'Mar 2026', matchesMissed: 2 },
]

const TRANSFER_TARGETS = [
  { name: 'Aaron Collins',  position: 'LW', club: 'Redmill United',        age: 28, value: 'Free',   status: 'Shortlisted' },
  { name: 'Harvey Knibbs',  position: 'ST', club: 'Oakridge Albion',  age: 25, value: '£500k',  status: 'In pipeline' },
]

// ─── Recent Form ────────────────────────────────────────────────────────────

const RECENT_FORM = [
  { opponent: 'Northgate City', score: '1-2', result: 'L' as const, home: true,  scorers: "Morris 61'" },
  { opponent: 'Plymouth Argyle',   score: '1-2', result: 'L' as const, home: false, scorers: "Porter 44'" },
  { opponent: 'Fernbrook Athletic',  score: '1-1', result: 'D' as const, home: true,  scorers: "Barker 78'" },
  { opponent: 'Castleton Rovers',         score: '2-0', result: 'W' as const, home: false, scorers: "Morris 32', Porter 71'" },
  { opponent: 'Redmill United',           score: '2-2', result: 'D' as const, home: true,  scorers: "Morris 18', Rowe 55'" },
]

// ─── GPS Training Data ──────────────────────────────────────────────────────

const GPS_DATA = [
  { player: 'Jordan Hayes', distance: 5.2, hiSpeed: 0.3, sprints: 2, maxSpeed: 22.1, load: 'optimal' as const, acwr: 0.88 },
  { player: 'Tom Fletcher', distance: 10.8, hiSpeed: 2.1, sprints: 18, maxSpeed: 30.5, load: 'high' as const, acwr: 1.08 },
  { player: 'Daniel Webb', distance: 9.4, hiSpeed: 1.2, sprints: 8, maxSpeed: 28.2, load: 'optimal' as const, acwr: 0.94 },
  { player: 'Dean Morris', distance: 11.2, hiSpeed: 2.8, sprints: 22, maxSpeed: 32.1, load: 'high' as const, acwr: 1.12 },
  { player: 'Sam Porter', distance: 10.1, hiSpeed: 2.4, sprints: 20, maxSpeed: 31.0, load: 'optimal' as const, acwr: 0.91 },
  { player: 'Chris Nwosu', distance: 9.8, hiSpeed: 1.9, sprints: 15, maxSpeed: 29.8, load: 'overload' as const, acwr: 1.38 },
  { player: 'Liam Barker', distance: 11.5, hiSpeed: 1.8, sprints: 14, maxSpeed: 29.2, load: 'optimal' as const, acwr: 0.95 },
  { player: 'Paul Granger', distance: 9.0, hiSpeed: 1.0, sprints: 6, maxSpeed: 27.5, load: 'optimal' as const, acwr: 0.78 },
]

// ─── Scout Targets ──────────────────────────────────────────────────────────

const SCOUT_TARGETS = [
  { name: 'Aaron Collins', position: 'LW', age: 28, club: 'Redmill United', nationality: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', value: '£700k', contract: 'Jun 2026', rating: 4, status: 'Shortlisted', notes: 'Contract expiring — free agent opportunity.' },
  { name: 'Louie Barry', position: 'CAM', age: 22, club: 'Eastcliff Town', nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', value: '£1.2M', contract: 'Jun 2027', rating: 4, status: 'Under review', notes: 'Villa-owned. Loan candidate.' },
  { name: 'Harvey Knibbs', position: 'ST', age: 25, club: 'Oakridge Albion', nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', value: '£500k', contract: 'Jun 2026', rating: 4, status: 'In pipeline', notes: 'Proven L1 finisher. Contract up Jun 2026.' },
  { name: 'Jordan Slew', position: 'RW', age: 24, club: 'Eastbridge Orient', nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', value: '£400k', contract: 'Jun 2026', rating: 3, status: 'Flagged', notes: 'Quick winger, contract expiring.' },
  { name: 'Ibou Sawaneh', position: 'ST', age: 23, club: 'Forest Green Rovers', nationality: '🇬🇲', value: '£300k', contract: 'Jun 2027', rating: 3, status: 'Shortlisted', notes: 'League Two top scorer. Step up candidate.' },
]

// ─── Contract Data ──────────────────────────────────────────────────────────

const CONTRACT_DATA = [
  { player: 'Connor Walsh', position: 'CM', weeklyWage: '£4,500/wk', end: 'Jun 2026', status: 'Offered' as const, agent: 'N/A' },
  { player: 'Chris Nwosu', position: 'ST', weeklyWage: '£5,000/wk', end: 'Jun 2026', status: 'Negotiating' as const, agent: 'N/A' },
  { player: 'Sam Porter', position: 'ST', weeklyWage: '£5,500/wk', end: 'Jun 2026', status: 'Offered' as const, agent: 'N/A' },
  { player: 'Myles Okafor', position: 'LW', weeklyWage: '£4,000/wk', end: 'Jun 2026', status: 'No Action' as const, agent: 'N/A' },
]

// ─── Academy Standouts ─────────────────────────────────────────────────────

const ACADEMY_STANDOUTS = [
  { name: 'Academy Player A', age: 17, position: 'AMF', ageGroup: 'U18', devRating: '7.2', pathway: 'Pathway' },
  { name: 'Academy Player B', age: 16, position: 'CB', ageGroup: 'U18', devRating: '6.8', pathway: 'Developing' },
  { name: 'Academy Player C', age: 15, position: 'ST', ageGroup: 'U16', devRating: '6.5', pathway: 'Developing' },
  { name: 'Academy Player D', age: 18, position: 'CM', ageGroup: 'U21', devRating: '7.0', pathway: 'Pathway' },
]

// ─── Match Formations ───────────────────────────────────────────────────────

const MATCH_FORMATIONS = [
  { match: 'vs Northgate City (L 1-2)', formation: '4-3-3', positions: [
    { num: 1, x: 50, y: 90, name: 'Hayes' }, { num: 2, x: 80, y: 75, name: 'Osei' },
    { num: 15, x: 60, y: 75, name: 'Reid' }, { num: 6, x: 40, y: 75, name: 'Webb' },
    { num: 3, x: 20, y: 75, name: 'Fletcher' }, { num: 8, x: 65, y: 55, name: 'Barker' },
    { num: 5, x: 50, y: 50, name: 'Granger' }, { num: 12, x: 35, y: 55, name: 'Smith' },
    { num: 19, x: 80, y: 30, name: 'Tilley' }, { num: 10, x: 50, y: 20, name: 'Porter' },
    { num: 11, x: 20, y: 30, name: 'Morris' },
  ], stats: { possession: 48, shots: 11, xG: 1.24, passes: 412, duels: 55 }},
  { match: 'vs Plymouth Argyle (L 1-2)', formation: '4-3-3', positions: [
    { num: 1, x: 50, y: 90, name: 'Hayes' }, { num: 2, x: 80, y: 75, name: 'Osei' },
    { num: 33, x: 60, y: 75, name: 'Kemp' }, { num: 6, x: 40, y: 75, name: 'Webb' },
    { num: 3, x: 20, y: 75, name: 'Fletcher' }, { num: 8, x: 65, y: 55, name: 'Barker' },
    { num: 4, x: 50, y: 50, name: 'Walsh' }, { num: 12, x: 35, y: 55, name: 'Smith' },
    { num: 21, x: 80, y: 30, name: 'Okafor' }, { num: 9, x: 50, y: 20, name: 'Nwosu' },
    { num: 11, x: 20, y: 30, name: 'Morris' },
  ], stats: { possession: 44, shots: 9, xG: 0.98, passes: 378, duels: 62 }},
  { match: 'vs Fernbrook Athletic (D 1-1)', formation: '4-3-3', positions: [
    { num: 1, x: 50, y: 90, name: 'Hayes' }, { num: 2, x: 80, y: 75, name: 'Osei' },
    { num: 15, x: 60, y: 75, name: 'Reid' }, { num: 6, x: 40, y: 75, name: 'Webb' },
    { num: 3, x: 20, y: 75, name: 'Fletcher' }, { num: 8, x: 65, y: 55, name: 'Barker' },
    { num: 5, x: 50, y: 50, name: 'Granger' }, { num: 12, x: 35, y: 55, name: 'Smith' },
    { num: 19, x: 80, y: 30, name: 'Tilley' }, { num: 10, x: 50, y: 20, name: 'Porter' },
    { num: 11, x: 20, y: 30, name: 'Morris' },
  ], stats: { possession: 51, shots: 10, xG: 1.11, passes: 441, duels: 58 }},
]

const FIXTURES = [
  { opponent: 'Eastcliff Town', date: 'Sat 5 Apr', time: '15:00', venue: 'Away', competition: 'League One' },
  { opponent: 'Greyfield Town', date: 'Sat 12 Apr', time: '15:00', venue: 'Home', competition: 'League One' },
  { opponent: 'Barford Town', date: 'Sat 18 Apr', time: '19:45', venue: 'Away', competition: 'League One' },
  { opponent: 'Cardiff City', date: 'Tue 21 Apr', time: '15:00', venue: 'Home', competition: 'League One' },
  { opponent: 'Kingsport FC', date: 'Sat 26 Apr', time: '15:00', venue: 'Away', competition: 'League One' },
]

const ACADEMY_PLAYERS = [
  { name: 'Academy Player E', age: 17, position: 'ST', highlight: 'U21 hat-trick vs reserve opponents' },
  { name: 'Academy Player F', age: 16, position: 'CM', highlight: 'Outstanding passing range in U18s' },
  { name: 'Academy Player G', age: 18, position: 'CB', highlight: 'Dominant in U21 aerial duels' },
  { name: 'Academy Player H', age: 17, position: 'LW', highlight: '7 assists in 8 U18 games' },
]

// ─── Football Roundup Data ──────────────────────────────────────────────────

const FOOTBALL_ROUNDUP_ITEMS = [
  {
    id: 'agents', icon: '📱', label: 'Agent Messages', count: 3, urgent: true,
    color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)',
    messages: [
      { id: 'a1', from: 'Stellar Group', avatar: 'SG', subject: 'Nwosu contract — urgent', preview: 'Chris\'s representatives want to discuss the renewal terms before the window. They have interest from Serie A.', time: '8:05am', urgent: true, read: false },
      { id: 'a2', from: 'ProSport Agency', avatar: 'PA', subject: 'Morris availability', preview: 'Dean Morris is open to a loan move in January if he isn\'t first choice by then. Interested clubs in touch.', time: '7:30am', urgent: false, read: false },
      { id: 'a3', from: 'Elite Sports Mgmt', avatar: 'ES', subject: 'Academy prospect query', preview: 'We represent an Academy Player. His family want to discuss first-team pathway and improved academy terms.', time: 'Yesterday', urgent: false, read: true },
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
      { id: 'm1', from: 'Crown Broadcasting', avatar: 'BB', subject: 'Pre-match interview request', preview: 'We\'d like to arrange a 15-minute pre-match interview for Saturday\'s game. Available Thursday PM?', time: '8:45am', urgent: false, read: false },
      { id: 'm2', from: 'Northbridge Sport', avatar: 'SS', subject: 'Transfer rumours — comment?', preview: 'We\'re running a piece on your interest in Aaron Collins. Any comment from the club?', time: '8:00am', urgent: false, read: false },
      { id: 'm3', from: 'Local Gazette', avatar: 'LG', subject: 'Fan forum coverage', preview: 'We\'re covering the fan forum on Thursday evening. Will the manager be attending?', time: 'Yesterday', urgent: false, read: true },
      { id: 'm4', from: 'Press Officer', avatar: 'PO', subject: 'Press conference at 2pm', preview: 'Reminder: pre-match presser at 2pm today in the media suite. AI briefing notes attached.', time: '7:30am', urgent: false, read: false },
    ]
  },
  {
    id: 'transfers', icon: '🔄', label: 'Transfer Activity', count: 2, urgent: true,
    color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',
    messages: [
      { id: 't1', from: 'Chief Scout', avatar: 'CS', subject: 'Collins update — Redmill United respond', preview: 'Redmill United have countered at £800k. They want a 15% sell-on clause. Recommend we push back to £750k.', time: '9:02am', urgent: true, read: false },
      { id: 't2', from: 'Analyst Team', avatar: 'AT', subject: 'Knibbs video analysis ready', preview: 'Full match analysis of Harvey Knibbs vs Hawthorne FC is ready for review. 94-minute breakdown with heat maps.', time: 'Yesterday', urgent: false, read: true },
    ]
  },
  {
    id: 'staff', icon: '👔', label: 'Staff Updates', count: 2, urgent: false,
    color: '#06B6D4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)',
    messages: [
      { id: 's1', from: 'Head Physio', avatar: 'HP', subject: 'Injury update — morning report', preview: 'Nwosu did light jogging this morning. Morris completed pool session. Morris still in boot.', time: '8:30am', urgent: false, read: false },
      { id: 's2', from: 'Goalkeeping Coach', avatar: 'GC', subject: 'Hayes — distribution drill results', preview: 'Hayes\'s long distribution accuracy improved to 74% in yesterday\'s session. Significant progress.', time: 'Yesterday', urgent: false, read: true },
    ]
  },
  {
    id: 'academy', icon: '🎓', label: 'Academy', count: 2, urgent: false,
    color: '#F97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)',
    messages: [
      { id: 'ac1', from: 'U21 Coach', avatar: 'U2', subject: 'Academy Player hat-trick — match report', preview: 'Academy Player scored a hat-trick in yesterday\'s U21 win. Strong recommendation for first-team bench.', time: '8:15am', urgent: false, read: false },
      { id: 'ac2', from: 'Academy Director', avatar: 'AD', subject: 'Scholarship intake review', preview: 'We have 4 offers out for next season\'s scholarship cohort. 2 have accepted, 2 pending.', time: 'Yesterday', urgent: false, read: true },
    ]
  },
  {
    id: 'sms', icon: '💬', label: 'SMS / Text', count: 3, urgent: true,
    color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)',
    messages: [
      { id: 'sms1', from: 'Jordan Hayes', avatar: 'NB', subject: 'Contract chat', preview: 'Gaffer, can we chat about my contract situation?', time: '7:45am', urgent: false, read: false },
      { id: 'sms2', from: 'Unknown Number', avatar: '??', subject: 'Agent interest', preview: 'My client is very interested — call me', time: '8:12am', urgent: true, read: false },
      { id: 'sms3', from: 'Dean Morris', avatar: 'MB', subject: 'Match ready', preview: 'Feeling sharp today. Ready for Saturday 💪', time: '8:30am', urgent: false, read: false },
    ]
  },
  {
    id: 'whatsapp', icon: '💚', label: 'WhatsApp Business', count: 4, urgent: false,
    color: '#22C55E', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)',
    messages: [
      { id: 'wa1', from: 'Lumio Park Staff', avatar: 'PL', subject: 'Pitch inspection', preview: 'Pitch inspection at 09:00 — all clear for training', time: '7:30am', urgent: false, read: false },
      { id: 'wa2', from: 'Kit Manager', avatar: 'KM', subject: 'Away kit ready', preview: 'Away kit packed and loaded onto coach', time: '8:00am', urgent: false, read: false },
      { id: 'wa3', from: 'Club Doctor', avatar: 'CD', subject: 'Chen update', preview: 'Chen cleared for light training today', time: '8:45am', urgent: false, read: false },
      { id: 'wa4', from: 'Fan Trust Rep', avatar: 'FT', subject: 'Supporter Q&A', preview: 'Q&A with supporters confirmed for Tuesday', time: '9:00am', urgent: false, read: true },
    ]
  },
  {
    id: 'slack', icon: '🔷', label: 'Slack', count: 4, urgent: false,
    color: '#4A154B', bg: 'rgba(74,21,75,0.08)', border: 'rgba(74,21,75,0.2)',
    messages: [
      { id: 'sl1', from: '#analyst-room', avatar: 'AN', subject: 'Eastcliff Town stats', preview: 'Eastcliff Town pressing stats uploaded to shared drive', time: '8:10am', urgent: false, read: false },
      { id: 'sl2', from: '#scouting', avatar: 'SC', subject: 'Barford Town winger', preview: 'Video package on Barford Town winger ready for review', time: '8:25am', urgent: false, read: false },
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
  '3 injured players — Nwosu, Fletcher, Morris. Morris closest to return (7 Apr).',
  'Walsh suspended for Saturday. Bright or Ashton to start in CM.',
  'Transfer target Aaron Collins — Redmill United countered at £800k. Budget remaining: £4.2m.',
  'Press conference at 2pm today. AI briefing notes prepared.',
  'U21s won 3-0 yesterday. Academy Player hat-trick — recommended for first-team bench.',
  'Saturday\'s match vs Eastcliff Town at home, 3pm kick-off. Team sheet needed by Thursday.',
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

function Sidebar({ activeDept, onSelect, open, onClose, clubName, allowedIds, session, onRoleChange, isFootballDemo }: {
  activeDept: DeptId; onSelect: (d: DeptId) => void; open: boolean; onClose: () => void; clubName?: string;
  allowedIds: 'all' | string[];
  session?: SportsDemoSession;
  onRoleChange?: (role: string) => void;
  isFootballDemo?: boolean;
}) {
  const [pinned, setPinned] = useState(() => typeof window !== 'undefined' && localStorage.getItem('lumio_sidebar_pinned') === 'true')
  const [hovered, setHovered] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [clubLogo, setClubLogo] = useState<string | null>(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_football_logo') : null)
  const expanded = pinned || hovered

  function togglePin() {
    setPinned(p => { const next = !p; localStorage.setItem('lumio_sidebar_pinned', String(next)); return next })
  }
  function handleMouseEnter() { if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null }; setHovered(true) }
  function handleMouseLeave() { leaveTimer.current = setTimeout(() => setHovered(false), 400) }

  const PRIMARY = '#003DA5'
  const DARK = '#002D7A'
  const SECONDARY = '#F1C40F'

  // group items by section — granular grouping matches Women's FC pattern
  // Role-gated: when allowedIds !== 'all', filter every section by the whitelist
  // so the active role only sees the nav items it has access to.
  const isAllowed = (id: DeptId) => allowedIds === 'all' || (allowedIds as string[]).includes(id)
  const sections: { label: SidebarSection; items: typeof SIDEBAR_ITEMS }[] = [
    { label: 'OVERVIEW', items: SIDEBAR_ITEMS.filter(i => i.section === 'OVERVIEW' && isAllowed(i.id)) },
    { label: 'BOARD', items: SIDEBAR_ITEMS.filter(i => i.section === 'BOARD' && isAllowed(i.id)) },
    { label: 'COMMUNITY', items: SIDEBAR_ITEMS.filter(i => i.section === 'COMMUNITY' && isAllowed(i.id)) },
    { label: 'PERFORMANCE', items: SIDEBAR_ITEMS.filter(i => i.section === 'PERFORMANCE' && isAllowed(i.id)) },
    { label: 'FIRST TEAM', items: SIDEBAR_ITEMS.filter(i => i.section === 'FIRST TEAM' && isAllowed(i.id)) },
    { label: 'MEDICAL', items: SIDEBAR_ITEMS.filter(i => i.section === 'MEDICAL' && isAllowed(i.id)) },
    { label: 'GPS & LOAD', items: SIDEBAR_ITEMS.filter(i => i.section === 'GPS & LOAD' && isAllowed(i.id)) },
    { label: 'OPERATIONS', items: SIDEBAR_ITEMS.filter(i => i.section === 'OPERATIONS' && isAllowed(i.id)) },
    { label: 'RECRUITMENT', items: SIDEBAR_ITEMS.filter(i => i.section === 'RECRUITMENT' && isAllowed(i.id)) },
    { label: 'COMMERCIAL', items: SIDEBAR_ITEMS.filter(i => i.section === 'COMMERCIAL' && isAllowed(i.id)) },
    { label: 'COMPLIANCE', items: SIDEBAR_ITEMS.filter(i => i.section === 'COMPLIANCE' && isAllowed(i.id)) },
    { label: 'DISCOVER', items: SIDEBAR_ITEMS.filter(i => i.section === 'DISCOVER' && isAllowed(i.id)) },
    { label: 'INTEGRATIONS', items: SIDEBAR_ITEMS.filter(i => i.section === 'INTEGRATIONS' && isAllowed(i.id)) },
    { label: null, items: SIDEBAR_ITEMS.filter(i => i.section === null && isAllowed(i.id)) },
  ]

  return (
    <>
      {/* Desktop sidebar */}
      {/* SIDEBAR/PADDING ALIGNMENT — values aligned to cricket reference
          (cricket/[slug]/page.tsx). Same fonts and densities; horizontal
          width parity needs identical sidebar width + main padding to
          prevent "football looks bigger" perception. */}
      <aside
        className="hidden md:flex flex-col shrink-0 overflow-hidden"
        style={{ width: expanded ? 220 : 72, backgroundColor: '#0A0B10', borderRight: '1px solid #1F2937', transition: 'width 250ms ease', position: 'sticky', top: 0, height: 'calc(100vh / 0.9)', alignSelf: 'flex-start' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center justify-center gap-2.5 py-3 shrink-0" style={{ borderBottom: '1px solid #1F2937', minHeight: 72, padding: expanded ? '12px 16px' : '12px 0' }}>
          <div className="relative flex items-center justify-center shrink-0 overflow-hidden" style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: clubLogo ? 'transparent' : PRIMARY, color: '#F9FAFB', border: '1px solid #1F2937', fontSize: 26, fontWeight: 700 }}>
            {clubLogo
              ? <img key={clubLogo} src={clubLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9 }} onError={() => setClubLogo(null)} />
              : isFootballDemo
                ? <img src="/badges/oakridge_fc_crest.svg" alt="Oakridge FC" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 9 }} />
                : 'FC'}
          </div>
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
                    {expanded && (item.id === 'player-welfare' || item.id === 'community' || item.id === 'commercial' || item.id === 'tours-camps' || item.id === 'discover') && (
                      <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: PRIMARY }}>NEW</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        {session && onRoleChange && (
          <div style={{ flexShrink: 0 }}>
            <RoleSwitcher
              session={session}
              roles={FOOTBALL_ROLES}
              accentColor={PRIMARY}
              onRoleChange={onRoleChange}
              sidebarCollapsed={!expanded}
            />
          </div>
        )}
        <div className="shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
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

function PersonalBanner({ clubName, firstName, onNavigate, isDemo = false, clubLogo }: {
  clubName: string; firstName?: string; onNavigate?: (dept: string) => void; isDemo?: boolean; clubLogo?: string | null
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
      <div className={`relative bg-gradient-to-r ${bg} overflow-hidden rounded-2xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] mx-1`}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)', pointerEvents: 'none', borderRadius: 'inherit' }} />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-yellow-400 rounded-full opacity-10 blur-3xl" />
        <img src="/badges/oakridge_fc_crest.svg" alt="" style={{ position: 'absolute', right: '320px', top: '50%', transform: 'translateY(-50%)', width: 180, height: 180, objectFit: 'contain', opacity: 0.07, filter: 'saturate(0.2) brightness(3)', userSelect: 'none', pointerEvents: 'none', zIndex: 1 }} />
        <img src="/badges/oakridge_fc_crest.svg" alt="Club badge" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 16, height: 120, width: 'auto', zIndex: 10, filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.6))' }} />
        <div className="relative z-10 px-6 py-5" style={{ paddingLeft: 140 }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-white tracking-tight">{greeting}, {firstName || 'gaffer'} ⚽</h1>
                <button onClick={handleBriefing} title="Morning briefing — squad updates, fixtures, and key items" className="flex items-center justify-center rounded-lg transition-all"
                  style={{ width: 32, height: 32, flexShrink: 0, backgroundColor: isPlaying ? 'rgba(0,61,165,0.25)' : 'rgba(255,255,255,0.08)', border: isPlaying ? '1px solid rgba(0,61,165,0.5)' : '1px solid rgba(255,255,255,0.12)', color: isPlaying ? '#F1C40F' : '#9CA3AF' }}>
                  <Volume2 size={15} strokeWidth={1.75} />
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
    </>
  )
}

// ─── Tab Bar ─────────────────────────────────────────────────────────────────

const OVERVIEW_TABS: { id: OverviewTab; label: string; icon: string }[] = [
  { id: 'getting-started', label: 'Getting Started', icon: '🚀' },
  { id: 'today', label: 'Today', icon: '🏠' },
  { id: 'quick-wins', label: 'Quick Wins', icon: '⚡' },
  { id: 'match-week', label: 'Match Week', icon: '⚽' },
  { id: 'insights', label: 'Insights', icon: '📊' },
  { id: 'dont-miss', label: "Don't Miss", icon: '🔴' },
  { id: 'staff', label: 'Staff', icon: '👥' },
]

const FB_ONBOARDING_ITEMS = [
  'Connect your club profile',
  'Upload squad & staff data (25 players)',
  'Set up Board Suite (directors, reporting schedule)',
  'Configure team formation (4-3-3 default)',
  'Add upcoming fixtures',
  'Connect GPS tracking (Johan Sports)',
  'Set up scouting pipeline',
  'Configure medical records',
  'Upload sponsor agreements',
  'Invite coaching staff',
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
  const { items: roundupItems, dragProps, reset } = useDraggableList(FOOTBALL_ROUNDUP_ITEMS, 'lumio_football_overview_order')

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
        <div className="flex items-center gap-3">
          <button onClick={reset} style={{ fontSize: 11, color: '#475569', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Reset order</button>
          <span className="text-xs" style={{ color: '#6B7280' }}>Since you were last here</span>
        </div>
      </div>
      <div className="space-y-2">
        {roundupItems.map((item, index) => {
          const isOpen = expanded === item.id
          const dp = dragProps(index)
          return (
            <div key={item.id} draggable={dp.draggable} onDragStart={dp.onDragStart} onDragEnter={dp.onDragEnter} onDragEnd={dp.onDragEnd} onDragOver={dp.onDragOver} className="rounded-xl overflow-hidden" style={{ ...dp.style, backgroundColor: item.bg, border: `1px solid ${item.border}` }}>
              <button onClick={() => setExpanded(isOpen ? null : item.id)} className="w-full flex items-center justify-between p-3 text-left">
                <div className="flex items-center gap-2.5">
                  <span style={{ color: '#334155', marginRight: 4, fontSize: 14, cursor: 'grab', opacity: 0.4 }}>⠿</span>
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
                {i === 0 && <span className="w-2 h-2 rounded-full bg-red-500" />}
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
  { name: 'Pre-match analysis — Eastcliff Town', status: 'COMPLETE' as const, ts: 'Just now' },
  { name: 'Injury assessment — Chris Nwosu', status: 'RUNNING' as const, ts: '3 min ago' },
  { name: 'Transfer negotiation — Aaron Collins', status: 'ACTION' as const, ts: '15 min ago' },
  { name: 'Training load report — weekly', status: 'COMPLETE' as const, ts: '1 hr ago' },
  { name: 'Academy performance review', status: 'COMPLETE' as const, ts: '2 hr ago' },
  { name: 'Press conference prep — AI brief', status: 'COMPLETE' as const, ts: '3 hr ago' },
  { name: 'Opposition scouting — Greyfield Town', status: 'RUNNING' as const, ts: '4 hr ago' },
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
    { id: 'gk', name: 'Jordan Hayes', pos: 'GK', initials: 'NB', overall: 68, color: '#F59E0B', stats: { PAC: 52, SHO: 24, PAS: 58, DRI: 44, DEF: 76, PHY: 78 } },
    { id: 'rb', name: 'Kyle Osei', pos: 'RB', initials: 'NA', overall: 66, color: '#3B82F6', stats: { PAC: 76, SHO: 48, PAS: 62, DRI: 68, DEF: 70, PHY: 70 } },
    { id: 'cb1', name: 'Daniel Webb', pos: 'CB', initials: 'RJ', overall: 71, color: '#3B82F6', stats: { PAC: 66, SHO: 35, PAS: 60, DRI: 52, DEF: 80, PHY: 80 } },
    { id: 'cb2', name: 'Marcus Reid', pos: 'CB', initials: 'PB', overall: 69, color: '#3B82F6', stats: { PAC: 62, SHO: 30, PAS: 58, DRI: 50, DEF: 78, PHY: 79 } },
    { id: 'lb', name: 'Tom Fletcher', pos: 'LB', initials: 'SS', overall: 72, color: '#3B82F6', stats: { PAC: 76, SHO: 44, PAS: 68, DRI: 70, DEF: 74, PHY: 72 } },
    { id: 'cdm1', name: 'Liam Barker', pos: 'CM', initials: 'CM', overall: 71, color: '#22C55E', stats: { PAC: 70, SHO: 58, PAS: 76, DRI: 72, DEF: 64, PHY: 70 } },
    { id: 'cdm2', name: 'Paul Granger', pos: 'CDM', initials: 'SH', overall: 69, color: '#22C55E', stats: { PAC: 62, SHO: 48, PAS: 68, DRI: 60, DEF: 76, PHY: 74 } },
    { id: 'cam', name: 'Ryan Cole', pos: 'CM', initials: 'AS', overall: 70, color: '#22C55E', stats: { PAC: 68, SHO: 60, PAS: 74, DRI: 70, DEF: 58, PHY: 68 } },
    { id: 'lm', name: 'Dean Morris', pos: 'LW', initials: 'MB', overall: 72, color: '#EF4444', stats: { PAC: 82, SHO: 68, PAS: 70, DRI: 80, DEF: 38, PHY: 68 } },
    { id: 'rm', name: 'James Tilley', pos: 'RW', initials: 'JT', overall: 68, color: '#EF4444', stats: { PAC: 80, SHO: 62, PAS: 64, DRI: 76, DEF: 34, PHY: 66 } },
    { id: 'st', name: 'Sam Porter', pos: 'ST', initials: 'MS', overall: 70, color: '#EF4444', stats: { PAC: 76, SHO: 76, PAS: 60, DRI: 72, DEF: 28, PHY: 72 } },
  ]
  const COACHES = [
    { name: 'Johnnie Jackson', role: 'Head Coach', initials: 'JJ', color: '#C8960C' },
    { name: 'Assistant Manager', role: 'Assistant Coach', initials: 'AM', color: '#0D9488' },
    { name: 'Head Physio', role: 'Head Medical', initials: 'HP', color: '#EC4899' },
  ]
  type Formation = '4-2-3-1' | '4-3-3' | '3-5-2' | '4-4-2'
  const FORMATIONS: Record<Formation, Record<string, { top: string; left: string }>> = {
    '4-2-3-1': { gk: { top: '84%', left: '50%' }, rb: { top: '68%', left: '88%' }, cb1: { top: '68%', left: '35%' }, cb2: { top: '68%', left: '65%' }, lb: { top: '68%', left: '12%' }, cdm1: { top: '52%', left: '38%' }, cdm2: { top: '52%', left: '62%' }, cam: { top: '32%', left: '50%' }, rm: { top: '32%', left: '86%' }, lm: { top: '32%', left: '14%' }, st: { top: '14%', left: '50%' } },
    '4-3-3': { gk: { top: '84%', left: '50%' }, rb: { top: '68%', left: '90%' }, cb1: { top: '68%', left: '35%' }, cb2: { top: '68%', left: '65%' }, lb: { top: '68%', left: '10%' }, cdm1: { top: '48%', left: '25%' }, cdm2: { top: '48%', left: '50%' }, cam: { top: '48%', left: '75%' }, rm: { top: '18%', left: '88%' }, lm: { top: '18%', left: '12%' }, st: { top: '14%', left: '50%' } },
    '3-5-2': { gk: { top: '84%', left: '50%' }, rb: { top: '68%', left: '75%' }, cb1: { top: '68%', left: '25%' }, cb2: { top: '68%', left: '50%' }, lb: { top: '48%', left: '10%' }, cdm1: { top: '48%', left: '30%' }, cdm2: { top: '48%', left: '50%' }, cam: { top: '48%', left: '70%' }, rm: { top: '48%', left: '90%' }, lm: { top: '18%', left: '35%' }, st: { top: '18%', left: '65%' } },
    '4-4-2': { gk: { top: '84%', left: '50%' }, rb: { top: '68%', left: '90%' }, cb1: { top: '68%', left: '35%' }, cb2: { top: '68%', left: '65%' }, lb: { top: '68%', left: '10%' }, cdm1: { top: '46%', left: '10%' }, cdm2: { top: '46%', left: '35%' }, cam: { top: '46%', left: '65%' }, rm: { top: '46%', left: '90%' }, lm: { top: '18%', left: '35%' }, st: { top: '18%', left: '65%' } },
  }
  const SUBS = [
    { id: 'gk2', name: 'Joe McDonnell', pos: 'GK', initials: 'JM', overall: 69, color: '#F59E0B', stats: { PAC: 50, SHO: 22, PAS: 58, DRI: 42, DEF: 74, PHY: 76 } },
    { id: 'cb3', name: 'Isaac Kemp', pos: 'CB', initials: 'IO', overall: 68, color: '#3B82F6', stats: { PAC: 62, SHO: 28, PAS: 56, DRI: 50, DEF: 76, PHY: 78 } },
    { id: 'rb2', name: 'Brodi Chen', pos: 'RB', initials: 'BH', overall: 65, color: '#3B82F6', stats: { PAC: 74, SHO: 38, PAS: 60, DRI: 64, DEF: 68, PHY: 68 } },
    { id: 'cm3', name: 'Connor Walsh', pos: 'CM', initials: 'JR', overall: 70, color: '#22C55E', stats: { PAC: 66, SHO: 54, PAS: 76, DRI: 68, DEF: 64, PHY: 72 } },
    { id: 'lw2', name: 'Myles Okafor', pos: 'LW', initials: 'MH', overall: 69, color: '#EF4444', stats: { PAC: 84, SHO: 64, PAS: 66, DRI: 78, DEF: 30, PHY: 64 } },
    { id: 'st2', name: 'Chris Nwosu', pos: 'ST', initials: 'OB', overall: 70, color: '#EF4444', stats: { PAC: 76, SHO: 74, PAS: 58, DRI: 70, DEF: 26, PHY: 70 } },
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
    { name: 'Johnnie Jackson', role: 'Head Coach', dept: 'Coaching', overall: 87, initials: 'JJ', color: '#C8960C', stats: { PAC: 72, SHO: 45, PAS: 88, DRI: 79, DEF: 65, PHY: 71 }, id: 'OFC-001', date: '01/07/2025' },
    { name: 'Jordan Hayes', role: 'Goalkeeper', dept: 'First Team', overall: 68, initials: 'NB', color: '#15803D', stats: { PAC: 52, SHO: 24, PAS: 58, DRI: 44, DEF: 76, PHY: 78 }, id: 'OFC-002', date: '01/07/2025' },
    { name: 'Daniel Webb', role: 'Centre Back', dept: 'First Team', overall: 71, initials: 'RJ', color: '#1D4ED8', stats: { PAC: 66, SHO: 35, PAS: 60, DRI: 52, DEF: 80, PHY: 80 }, id: 'OFC-003', date: '01/07/2025' },
    { name: 'Tom Fletcher', role: 'Left Back', dept: 'First Team', overall: 72, initials: 'SS', color: '#B91C1C', stats: { PAC: 76, SHO: 44, PAS: 68, DRI: 70, DEF: 74, PHY: 72 }, id: 'OFC-004', date: '01/07/2025' },
    { name: 'Dean Morris', role: 'Left Wing', dept: 'First Team', overall: 72, initials: 'MB', color: '#7C3AED', stats: { PAC: 82, SHO: 68, PAS: 70, DRI: 80, DEF: 38, PHY: 68 }, id: 'OFC-005', date: '01/07/2025' },
    { name: 'Liam Barker', role: 'Central Midfielder', dept: 'First Team', overall: 71, initials: 'CM', color: '#0EA5E9', stats: { PAC: 70, SHO: 58, PAS: 76, DRI: 72, DEF: 64, PHY: 70 }, id: 'OFC-006', date: '01/07/2025' },
    { name: 'Sam Porter', role: 'Striker', dept: 'First Team', overall: 70, initials: 'MS', color: '#EA580C', stats: { PAC: 76, SHO: 76, PAS: 60, DRI: 72, DEF: 28, PHY: 72 }, id: 'OFC-007', date: '01/07/2025' },
    { name: 'Paul Granger', role: 'Defensive Midfielder', dept: 'First Team', overall: 69, initials: 'SH', color: '#0D9488', stats: { PAC: 62, SHO: 48, PAS: 68, DRI: 60, DEF: 76, PHY: 74 }, id: 'OFC-008', date: '01/07/2025' },
    { name: 'Head Physio', role: 'Head of Medical', dept: 'Medical', overall: 88, initials: 'HP', color: '#EC4899', stats: { PAC: 58, SHO: 40, PAS: 80, DRI: 55, DEF: 74, PHY: 66 }, id: 'OFC-009', date: '01/07/2025' },
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
  const [onboarding, setOnboarding] = useState<boolean[]>(() => {
    try { const s = typeof window !== 'undefined' ? localStorage.getItem('lumio_football_onboarding') : null; return s ? JSON.parse(s) : Array(10).fill(false) } catch { return Array(10).fill(false) }
  })
  const toggleOnboarding = (idx: number) => {
    const next = [...onboarding]; next[idx] = !next[idx]; setOnboarding(next)
    try { localStorage.setItem('lumio_football_onboarding', JSON.stringify(next)); if (next.every(Boolean)) localStorage.setItem('football_getting_started_seen', '1') } catch {}
  }
  if (tab === 'today') return null // handled separately

  if (tab === 'getting-started') return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🚀</span>
        <div>
          <h2 className="text-xl font-black" style={{ color: '#F9FAFB' }}>Getting Started</h2>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Complete these 10 steps to set up your club</p>
        </div>
      </div>
      <div className="space-y-2">
        {FB_ONBOARDING_ITEMS.map((item, idx) => (
          <button key={idx} onClick={() => toggleOnboarding(idx)}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
            style={{ backgroundColor: onboarding[idx] ? '#111318' : '#0D1117', border: onboarding[idx] ? '1px solid #22C55E30' : '1px solid #1F2937' }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: onboarding[idx] ? '#22C55E20' : '#1F2937', border: onboarding[idx] ? '1px solid #22C55E50' : '1px solid #374151' }}>
              {onboarding[idx] ? <span className="text-green-400 text-xs">✓</span> : <span className="text-gray-500 text-xs">{idx + 1}</span>}
            </div>
            <span className={`text-xs ${onboarding[idx] ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{item}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 p-3 rounded-xl text-xs" style={{ backgroundColor: '#003DA515', border: '1px solid #003DA530' }}>
        <span style={{ color: '#F1C40F' }} className="font-semibold">{onboarding.filter(Boolean).length}/10 complete</span>
        <span className="text-gray-500 ml-2">— {onboarding.every(Boolean) ? 'All done! Switch to Today tab.' : 'Keep going, you\'re doing great!'}</span>
      </div>
    </div>
  )

  if (tab === 'quick-wins') return (
    <div>
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
          { id: 'fqw1', title: 'James Dutton fitness check overdue', description: 'Last GPS session flagged fatigue risk. Clear for Saturday?', impact: 'high' as const, effort: '2min', category: 'Squad', action: 'Check fitness', source: 'GPS' },
          { id: 'fqw2', title: 'Opposition report not reviewed', description: 'Eastcliff Town match in 3 days. Scout report ready.', impact: 'high' as const, effort: '5min', category: 'Tactics', action: 'View report', source: 'Scouting' },
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
    <div>
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
          { id: 'fmw4', title: 'Opposition set piece analysis', description: 'Eastcliff Town scored 3 set piece goals in their last 5 games.', impact: 'medium' as const, effort: '30min', category: 'Tactics', action: 'View analysis', source: 'Analytics' },
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
        {[{ l: 'League Position', v: '14th', c: '#F1C40F' }, { l: 'Squad Value', v: '£6.1m', c: '#22C55E' }, { l: 'Transfer Budget', v: '£250k', c: '#003DA5' }, { l: 'Injury Rate', v: '12%', c: '#F59E0B' }, { l: 'Form (Last 5)', v: 'L-L-D-W-D', c: '#F59E0B' }].map(s => (
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
        <div className="grid grid-cols-2 gap-2">{[{ l: 'Top Scorer', v: 'Dean Morris — 12 goals' }, { l: 'Clean Sheet Rate', v: '22% (8/37)' }, { l: 'Wage Budget Used', v: '82% (£42k/wk)' }, { l: 'Academy Ready', v: '2 players' }, { l: 'Fan NPS', v: '72/100' }, { l: 'Position Trend', v: '16→15→14→14→14' }].map(m => (
          <div key={m.l} className="flex justify-between py-1.5 px-2 rounded" style={{ backgroundColor: '#0A0B10' }}><span className="text-xs" style={{ color: '#9CA3AF' }}>{m.l}</span><span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{m.v}</span></div>
        ))}</div>
      </div>
    </div>
  )

  if (tab === 'dont-miss') return (
    <div>
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
          { id: 'fdm3', title: '3 player contracts expiring in 60 days', description: 'No renewal talks started for Walsh, Nwosu, or Okafor. Free agent risk.', effort: '30min', category: 'Contracts', action: 'Start talks', source: 'HR' },
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
            { name: 'Assistant Manager', role: 'Assistant Manager', dept: 'Coaching', status: 'In today', location: 'Training ground', rel: 'Works closely with you', color: '#003DA5' },
            { name: 'Team Doctor', role: 'Club Doctor', dept: 'Medical', status: 'In today', location: 'Medical centre, 8am-5pm', rel: 'Medical dept', color: '#2980B9' },
            { name: 'Head Physio', role: 'Head Physio', dept: 'Medical', status: 'In today', location: 'Medical centre, 8am-6pm', rel: 'Medical dept', color: '#2980B9' },
            { name: 'Head of Recruitment', role: 'Head of Recruitment', dept: 'Scouting', status: 'In today', location: 'Office + scout trip tomorrow', rel: 'Direct report', color: '#F39C12' },
            { name: 'Goalkeeping Coach', role: 'GK Coach', dept: 'Coaching', status: 'In today', location: 'Training ground', rel: 'Coaching dept', color: '#003DA5' },
            { name: 'Chief Scout', role: 'Chief Scout', dept: 'Scouting', status: 'Away', location: 'Away — Scouting', rel: 'Scouting dept', color: '#F39C12' },
            { name: 'First Team Analyst', role: 'Performance Analyst', dept: 'Analytics', status: 'In today', location: 'Analysis suite', rel: 'Analytics dept', color: '#8E44AD' },
            { name: 'Fitness Coach', role: 'Fitness Coach', dept: 'Performance', status: 'In today', location: 'Gym, 7am-4pm', rel: 'Performance dept', color: '#8E44AD' },
            
            
            
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
              <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Lumio Sports FC Trust</p>
              <p className="text-[10px]" style={{ color: '#7F8C8D' }}>Fan Owner</p>
            </div>
          </div>
          <div className="flex justify-center mb-2"><div className="w-px h-8" style={{ backgroundColor: '#374151' }} /></div>
          <div className="flex justify-center mb-2"><div className="h-px" style={{ backgroundColor: '#374151', width: '40%' }} /></div>
          {/* Level 2 */}
          <div className="flex justify-center gap-6 mb-4">
            {[{ name: 'Joe Palmer', role: 'Chief Executive', color: '#F39C12' }, { name: 'Johnnie Jackson', role: 'Head Coach', color: '#003DA5' }, { name: 'Ivor Heller', role: 'Director', color: '#7F8C8D' }].map(m => (
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
              { name: 'Head of Recruitment', role: 'Head of Recruitment', color: '#F39C12' },
              { name: 'Chief Scout', role: 'Chief Scout', color: '#F39C12' },
              { name: 'Assistant Manager', role: 'Asst Manager', color: '#003DA5' },
              { name: 'Goalkeeping Coach', role: 'GK Coach', color: '#003DA5' },
              { name: 'First Team Analyst', role: 'Analyst', color: '#8E44AD' },
              { name: 'Head Physio', role: 'Head Physio', color: '#2980B9' },
              { name: 'Team Doctor', role: 'Club Doctor', color: '#2980B9' },
              { name: 'Fitness Coach', role: 'Fitness Coach', color: '#8E44AD' },
              
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
              {[['Club','Lumio Sports FC'],['Founded','2002'],['Nickname','Lumio Sports FC'],['Colours','Blue & Yellow'],['Stadium','Lumio Park (9,215)'],['Training Ground','Lumio Sports Training Ground'],['League','EFL League One'],['EPPP Category','Category 2']].map(([l,v]) => (
                <div key={l} className="flex justify-between py-1"><span className="text-xs" style={{ color: '#6B7280' }}>{l}</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{v}</span></div>
              ))}
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Key Contacts</p>
              {[['Chairman','Lumio Sports FC Trust'],['Chief Executive','Joe Palmer'],['Head Coach','Johnnie Jackson'],['Club Doctor','Team Doctor'],['Club Secretary','Club Secretary'],['Media Manager','Media Manager']].map(([r,n]) => (
                <div key={r} className="flex justify-between py-1"><span className="text-xs" style={{ color: '#6B7280' }}>{r}</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{n}</span></div>
              ))}
            </div>
          </div>
          {/* Birthdays */}
          <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Upcoming This Month</p>
            {[['📋','Pre-match briefing','Eastcliff Town — 4 Apr'],['⚽','Matchday','vs Eastcliff Town (A) — 5 Apr'],['📋','Post-match debrief','7 Apr']].map(([icon,label,date], i) => (
              <p key={i} className="text-xs py-1" style={{ color: '#D1D5DB' }}>{icon} {label} — {date}</p>
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

// ─── Overview View (v2 modular grid + tabs + quick actions) ────────────────

const FOOTBALL_INBOX_BODIES: Record<string, string> = {
  'SMS · Coaches':      'Evans: confirm Saturday XI please. Walsh ban served, Henderson scan at 14:00. Need team sheet by 13:30 for league submission.',
  'WhatsApp · Squad':   'Captain: pitch walk done, surface firm but soft underfoot. 4G studs recommended. Met steward, away end open from 13:30.',
  'Email · Selectors':  'Henderson scan results — Grade 1 hamstring, 10 days minimum. Recommend Wilson holds the 8 spot, monitor Saturday training intensity.',
  'Agent messages':     'Okafor — wants 3-year extension at £8k/wk. Current expires June. Competing offer from Championship side reportedly £10k. Decision Friday.',
  'Board messages':     'Caroline: Q3 financials filed. Cap return due 10 May. PSR position remains compliant. Stadium feasibility doc ready Monday.',
  'Medical Hub':        'Dr Patel: Osei ACL review with consultant — 4 months minimum. Targeted return September pre-season. Trescott ankle scan clear.',
  'Media & Press':      'Northbridge Sport — pre-match feature with you + captain Friday 14:00. Talking points: Walsh return, Henderson absence, automatic vs play-off race.',
  'Scouting':           'Okafor (Ridgefield) watched twice — strong, deceptive pace, weak right foot. Suggest one more live look before recommending.',
  'Academy':            'U18s won 3-1 last night — Bryant brace + assist, Patel scored. Two prospects (Bryant, Lopez) ready for first-team training next week.',
}

function fbBtnGhost(): React.CSSProperties {
  return { fontSize: 11, padding: '5px 10px', background: 'transparent', color: '#9CA3AF', border: '1px solid #2d3139', borderRadius: 6, cursor: 'pointer', transition: 'border-color .12s, color .12s' }
}
function fbBtnPrimary(accentHex: string): React.CSSProperties {
  return { fontSize: 11.5, padding: '5px 12px', background: accentHex, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }
}

function InteractiveFootballInbox({ T, accent, density }: { T: typeof THEMES.dark; accent: typeof FOOTBALL_ACCENT; density: typeof DENSITY.regular }) {
  type RowState = { expanded: boolean; mode: 'idle' | 'replying' | 'forwarding'; reply: string; forwardTo: string; sentLabel: string | null; dismissed: boolean }
  const init = (): Record<string, RowState> => Object.fromEntries(FOOTBALL_INBOX.map(c => [c.ch, { expanded: false, mode: 'idle' as const, reply: '', forwardTo: 'Head Coach', sentLabel: null, dismissed: false }]))
  const [state, setState] = useState<Record<string, RowState>>(init)
  const update = (ch: string, patch: Partial<RowState>) => setState(s => ({ ...s, [ch]: { ...s[ch], ...patch } }))
  const items = FOOTBALL_INBOX.filter(c => !state[c.ch]?.dismissed)
  return (
    <div style={{ gridColumn: '6 / span 4', position: 'relative', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad }}>
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10, gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Inbox</div>
        <div style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3, fontFamily: 'monospace' }}>{items.length} · click to expand</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 420, overflow: 'auto' }}>
        {items.map((c, i) => {
          const s = state[c.ch] ?? { expanded: false, mode: 'idle' as const, reply: '', forwardTo: 'Head Coach', sentLabel: null, dismissed: false }
          const body = FOOTBALL_INBOX_BODIES[c.ch] ?? c.last
          return (
            <div key={c.ch} style={{ borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <div onClick={() => update(c.ch, { expanded: !s.expanded, mode: 'idle' })}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 4px', cursor: 'pointer' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.urgent ? T.bad : T.text4 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: T.text, fontWeight: 500 }}>{c.ch}</div>
                  <div style={{ fontSize: 11, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.last}</div>
                </div>
                <div className="tnum" style={{ fontSize: 11, color: T.text3, fontFamily: 'monospace' }}>{c.time}</div>
                <div className="tnum" style={{ minWidth: 22, height: 18, padding: '0 6px', borderRadius: 9, display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 600, background: c.urgent ? 'rgba(199,90,90,0.12)' : T.hover, color: c.urgent ? T.bad : T.text2 }}>{c.count}</div>
              </div>
              {s.expanded && (
                <div style={{ padding: '6px 6px 12px 22px' }}>
                  <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.55, padding: 10, background: T.panel2, borderRadius: 6, border: `1px solid ${T.border}` }}>{body}</div>
                  {s.sentLabel && <div style={{ marginTop: 6, fontSize: 11, color: T.good, fontFamily: 'monospace' }}>{s.sentLabel}</div>}
                  {s.mode === 'idle' && !s.sentLabel && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button onClick={() => update(c.ch, { mode: 'replying' })}   style={fbBtnGhost()}>Reply</button>
                      <button onClick={() => update(c.ch, { mode: 'forwarding' })} style={fbBtnGhost()}>Forward</button>
                      <button onClick={() => update(c.ch, { dismissed: true })}    style={fbBtnGhost()}>Dismiss</button>
                    </div>
                  )}
                  {s.mode === 'replying' && (
                    <div style={{ marginTop: 8 }}>
                      <textarea value={s.reply} onChange={e => update(c.ch, { reply: e.target.value })}
                        placeholder="Type your reply…" rows={3}
                        style={{ width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 12, fontFamily: V2_FONT, resize: 'vertical' }} />
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button onClick={() => update(c.ch, { mode: 'idle', reply: '', sentLabel: 'Sent ✓' })} style={fbBtnPrimary(accent.hex)}>Send</button>
                        <button onClick={() => update(c.ch, { mode: 'idle', reply: '' })} style={fbBtnGhost()}>Cancel</button>
                      </div>
                    </div>
                  )}
                  {s.mode === 'forwarding' && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: T.text3 }}>Forward to:</span>
                      <select value={s.forwardTo} onChange={e => update(c.ch, { forwardTo: e.target.value })}
                        style={{ background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 11.5, fontFamily: V2_FONT }}>
                        <option>Head Coach</option><option>Assistant Manager</option><option>Director of Football</option>
                        <option>Medical Lead</option><option>CEO</option><option>Head of Recruitment</option>
                      </select>
                      <button onClick={() => update(c.ch, { mode: 'idle', sentLabel: `Forwarded to ${s.forwardTo} ✓` })} style={fbBtnPrimary(accent.hex)}>Forward</button>
                      <button onClick={() => update(c.ch, { mode: 'idle' })} style={fbBtnGhost()}>Cancel</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {items.length === 0 && <div style={{ fontSize: 12, color: T.text3, fontStyle: 'italic', padding: '14px 0' }}>Inbox cleared.</div>}
      </div>
    </div>
  )
}

function FootballMatchBriefPanel({ T, accent, open, onClose }: { T: typeof THEMES.dark; accent: typeof FOOTBALL_ACCENT; open: boolean; onClose: () => void }) {
  if (!open) return null
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, color: accent.hex, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>{title}</div>
      <div style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.7 }}>{children}</div>
    </div>
  )
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 80, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '100%', maxWidth: 760, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 28, fontFamily: V2_FONT, color: T.text }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10, color: accent.hex, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 4 }}>Match Brief</div>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: T.text }}>Oakridge FC <span style={{ color: T.text3, fontWeight: 400 }}>vs</span> Hartwell Town</h2>
            <div style={{ fontSize: 11.5, color: T.text2, marginTop: 4 }}>League One · MD-39</div>
            <div style={{ fontSize: 11.5, color: T.text3, marginTop: 1 }}>Sat 02 May 2026 · Oakridge Park · Kick-off 15:00</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text2, cursor: 'pointer', padding: '6px 12px', fontSize: 11 }}>Close</button>
        </div>

        <Section title="01 · Conditions">
          <div><strong style={{ color: T.text }}>Weather:</strong> 12°C light cloud, 11 mph SW wind.</div>
          <div><strong style={{ color: T.text }}>Pitch:</strong> Natural grass, firm surface, soft underfoot — 4G studs recommended.</div>
          <div><strong style={{ color: T.text }}>Wind factor:</strong> Slight cross-wind, attacking the south end first half preferred for set-piece delivery.</div>
          <div><strong style={{ color: T.text }}>Referee:</strong> M. Carter — strict on holding at corners (12 fouls/match avg). Yellow-card-prone, watch reckless tackles.</div>
        </Section>

        <Section title="02 · Opposition Analysis · Hartwell Town">
          <div><strong style={{ color: T.text }}>Position:</strong> 11th in League One. <strong style={{ color: T.text }}>Last 5:</strong> W L L W D — middle-of-the-table form.</div>
          <div style={{ marginTop: 8, color: T.text }}>Key threats:</div>
          <ul style={{ marginTop: 4, paddingLeft: 22 }}>
            <li>Striker <strong>R. Kanu</strong> — 14 league goals, dangerous off the shoulder of the last defender.</li>
            <li>Winger <strong>J. Doyle</strong> — quick on the half-turn, 6 assists, takes set-pieces left-foot.</li>
            <li>Midfielder <strong>L. Greenway</strong> — sets the tempo, top in the league for forward passes (12.4/match).</li>
          </ul>
          <div style={{ marginTop: 8 }}><strong style={{ color: T.text }}>Weakness:</strong> High press from goal kicks but back four play very flat — space behind for runners. Their LB pushes high; exploit the channel with Morris diagonal.</div>
        </Section>

        <Section title="03 · Our Team News">
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li><strong style={{ color: T.text }}>Walsh:</strong> 3-match ban served — available for selection. Decision: start or hold for Tuesday cup.</li>
            <li><strong style={{ color: T.text }}>Henderson:</strong> Hamstring tightness — light training only. Scan results 14:00. Likely unavailable.</li>
            <li><strong style={{ color: T.text }}>Osei:</strong> Long-term ACL — 4 months. Out.</li>
            <li><strong style={{ color: T.text }}>Front line:</strong> Forwards coach recommends Morris–Porter pairing; Rowe off the bench from 65 minutes.</li>
          </ul>
        </Section>

        <Section title="04 · Tactical Priorities">
          <ol style={{ paddingLeft: 22, margin: 0, listStyle: 'decimal' }}>
            <li>Short build-up vs their high press from goal kicks — split CBs wide, bring 6 deep.</li>
            <li>Attack the LB channel — Morris diagonal runs, Tilley overlap.</li>
            <li>Set pieces — 22% of our goals come from these. Three rehearsed routines, target near post.</li>
            <li>PPDA target 8.0 — press their CB on first pass, force long ball to Kanu (in the air we win).</li>
            <li>Late-game tempo — substitutions 60'/70'/80' to hold a lead or chase a goal.</li>
          </ol>
        </Section>

        <Section title="05 · Logistics">
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li>Kit van: confirmed 09:00, all GPS vests charged.</li>
            <li>Warm-up: 14:15 on main pitch, set-piece runs 14:35.</li>
            <li>Media: Northbridge Sport pitchside from 14:00, manager + captain post-match.</li>
            <li>Medical: Dr Patel pitchside, ambulance confirmed, away medics briefed.</li>
            <li>Backup venue: Glenmoor Park (3G) on standby if pitch fails inspection.</li>
          </ul>
        </Section>

        <div style={{ paddingTop: 14, borderTop: `1px solid ${T.border}`, fontSize: 10, color: T.text3, fontFamily: 'monospace', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' }}>
          Generated by Lumio · Match intelligence · Confidential
        </div>
      </div>
    </div>
  )
}

function OverviewView({ clubName, firstName, onAction, onNavigate, role = 'ceo', onModal, isDemo = false, clubLogo }: { clubName: string; firstName?: string; onAction: (msg: string) => void; onNavigate?: (dept: string) => void; role?: string; onModal?: (modalId: string) => void; isDemo?: boolean; clubLogo?: string | null }) {
  const [tab, setTab] = useState<OverviewTab>(() => {
    try { const seen = typeof window !== 'undefined' ? localStorage.getItem('football_getting_started_seen') : null; return seen ? 'today' : 'getting-started' } catch { return 'today' }
  })
  const T       = THEMES.dark
  const accent  = FOOTBALL_ACCENT
  const density = DENSITY.regular
  const greeting = v2GetGreeting('matchday')

  const [openFixture, setOpenFixture] = useState<FbFixture | null>(null)
  const [cmdOpen,     setCmdOpen]     = useState(false)
  const [askOpen,     setAskOpen]     = useState(false)
  const [briefOpen,   setBriefOpen]   = useState(false)
  const [dashToast,   showDashToast]  = useV2Toast()

  useV2Key('cmdk', () => setCmdOpen(o => !o))

  const tabIcon = (id: OverviewTab): string => ({
    'getting-started': 'sparkles',
    today: 'home',
    'quick-wins': 'lightning',
    'match-week': 'flag',
    insights: 'bars',
    'dont-miss': 'flame',
    staff: 'people',
  } as const)[id]

  return (
    <>
      <style jsx global>{`
        .tnum { font-variant-numeric: tabular-nums; }
        @keyframes cricketV2PulseDim   { 0%,100% { opacity: .5 } 50% { opacity: .95 } }
        @keyframes cricketV2FadeUp     { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        @keyframes cricketV2SlideLeft  { from { opacity: 0; transform: translateX(20px) } to { opacity: 1; transform: none } }
        @keyframes cricketV2SlideUp    { from { opacity: 0; transform: translate(-50%, 8px) } to { opacity: 1; transform: translate(-50%, 0) } }
      `}</style>

      <div style={{ background: T.bg, color: T.text, fontFamily: V2_FONT, padding: density.gap, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: density.gap }}>

        {/* Hero — match-day banner FIRST, persistent across tabs */}
        {/* BANNER FULL WIDTH — Today schedule moved into the three-column
            row alongside AI Morning Summary and Inbox; Squad Availability
            moved to bottom of page as full-width strip. Layout reflow per
            user spec — do not re-add Today as banner sibling without
            product approval. The wrapper div with explicit gridColumn
            overrides the FbHeroToday Card's internal '1 / span 8'. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap, alignItems: 'start' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <FbHeroToday
              T={T} accent={accent} density={density} greeting={greeting}
              onConfirm={() => showDashToast('Starting XI confirmed · squad notified')}
              onAsk={() => setAskOpen(true)}
              onMatchBrief={() => setBriefOpen(true)}
            />
          </div>
        </div>

        {/* Tab bar — Lucide icons + accent underline (matches rugby v2). */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderBottom: `1px solid ${T.border}`, overflowX: 'auto' }}>
          {OVERVIEW_TABS.map(t => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = T.text2 }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = T.text3 }}
                style={{
                  appearance: 'none', border: 0, background: 'transparent',
                  padding: '10px 14px',
                  fontFamily: V2_FONT, fontSize: 12.5, fontWeight: active ? 600 : 500,
                  color: active ? '#fff' : T.text3,
                  borderBottom: `2px solid ${active ? accent.hex : 'transparent'}`,
                  marginBottom: -1,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  transition: 'color .12s, border-color .12s',
                }}>
                <V2Icon name={tabIcon(t.id)} size={12} stroke={1.6} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Quick Actions — role-aware: 6 buttons reshape per active role. */}
        <RoleAwareQuickActionsBar
          sport="football"
          role={role}
          onNavigate={(dept) => { if (onNavigate) onNavigate(dept); else onAction(dept) }}
          onAction={(modalId) => { if (onModal) onModal(modalId); else onAction(modalId) }}
          accentHex={accent.hex}
        />


        {/* TAB CONTENT — Today renders v2 grid; others fall through to v1 TabContent */}
        {tab === 'today' ? (
          <>
            <FbStatTiles T={T} accent={accent} density={density} />

            {/* Three-column row — AI Morning Summary | Inbox | Today.
                Wrapper divs with explicit gridColumn override each Card's
                internal placement (FbAIBrief '1 / span 5',
                InteractiveFootballInbox '6 / span 4', FbTodaySchedule
                '9 / span 4'). Result: three equal 4-col cards.
                AI and Inbox have density reductions (FootballDashboardModules
                AIBrief, this file's InteractiveFootballInbox) so all three
                converge on Today's compact natural height.
                CARD ROW GAP — three-card row spacing matches cricket
                reference. Wrappers use bare `display: grid` (NOT
                gridTemplate: 1fr/1fr) because the latter makes cards
                fill the cell width, which pushes visible whitespace
                OUTWARD between cards. Cricket uses the simpler pattern
                that lets cards sit tighter together. */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8, alignItems: 'stretch' }}>
              <div style={{ gridColumn: '1 / span 4', display: 'grid' }}>
                <FbAIBrief T={T} accent={accent} density={density} onAsk={() => setAskOpen(true)} />
              </div>
              <div style={{ gridColumn: '5 / span 4', display: 'grid' }}>
                <InteractiveFootballInbox T={T} accent={accent} density={density} />
              </div>
              <div style={{ gridColumn: '9 / span 4', display: 'grid' }}>
                <FbTodaySchedule T={T} accent={accent} density={density} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
              <FbFixturesModule T={T} accent={accent} density={density} onPick={f => setOpenFixture(f)} />
              <FbPerf            T={T} accent={accent} density={density} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
              <FbRecents T={T} accent={accent} density={density} />
              <FbSeason  T={T} accent={accent} density={density} />
            </div>

            {/* Squad Availability — full-width strip at bottom of page.
                Wrapper div overrides FbSquadModule's internal '10 / span 3'. */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <FbSquadModule T={T} accent={accent} density={density} />
              </div>
            </div>

            <div style={{ padding: '6px 0 8px', display: 'flex', gap: 14, fontSize: 10.5, color: T.text3, justifyContent: 'center' }}>
              <span>⌘K command palette</span><span>·</span><span>esc close overlays</span>
            </div>
          </>
        ) : (
          <TabContent tab={tab} />
        )}
      </div>

      <V2CommandPalette T={T} accent={accent} open={cmdOpen} onClose={() => setCmdOpen(false)} onAskLumio={() => { setCmdOpen(false); setAskOpen(true) }} />
      <V2AskLumio       T={T} accent={accent} open={askOpen} onClose={() => setAskOpen(false)} />
      <V2FixtureDrawer  T={T} accent={accent} fixture={openFixture as unknown as never} onClose={() => setOpenFixture(null)} />
      <V2Toast          T={T} accent={accent} msg={dashToast} />
      <FootballMatchBriefPanel T={T} accent={accent} open={briefOpen} onClose={() => setBriefOpen(false)} />
    </>
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
              style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}>
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
          <InsightCard label="Last Result" value="W 2-1" sub="vs Eastcliff Town" color="#22C55E" />
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
          rows={INJURIES.map(inj => [inj.player, inj.type, <span key={inj.player} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>{inj.phase || 'Rehab'}</span>, inj.since || '12 Mar', inj.expectedReturn, `${inj.matchesMissed || 3}`, 'Team Doctor'])} />
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
          {['Nwosu contract renewal — £22k/week proposed, agent wants £28k', 'Academy EPPP Cat 2 re-assessment — due May, compliance at 94%', 'Commercial pipeline — 3 new sponsor conversations active, 1 near close'].map((item, i) => (
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
        {[{l:'Season Avg',v:'4,240',s:'/ 6,000 (71%)',c:'#0D9488'},{l:'Season Tickets',v:'1,847',s:'▲ +124 vs last season',c:'#22C55E'},{l:'Highest',v:'5,980',s:'Ironvale County vs Riverside',c:'#F1C40F'},{l:'Lowest',v:'1,240',s:'League Cup R1',c:'#EF4444'}].map(d => (
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

  const [sqLiveSquad, setSqLiveSquad] = useState<any[]|null>(null)
  const [sqLoadingSquad, setSqLoadingSquad] = useState(false)
  useEffect(() => {
    setSqLoadingSquad(true)
    fetch('/api/football/squad?teamId=638&season=2025')
      .then(r => r.ok ? r.json() : null)
      .then(data => { const items = data?.response || data?.data || data; if (Array.isArray(items) && items.length > 0) setSqLiveSquad(items) })
      .catch(() => {})
      .finally(() => setSqLoadingSquad(false))
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Squad Management</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Full squad overview, contracts, fitness, and availability.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[{ l: 'Team Sheet', i: Clipboard }, { l: 'Training Plan', i: Calendar }, { l: 'Player Ratings', i: Star }, { l: 'Match Report', i: FileText }, { l: 'Set Pieces', i: Target }, { l: 'Recovery Session', i: Heart }].map(a => (
          <button key={a.l} onClick={() => sqAction(a.l)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}>
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
            { label: 'P', value: '37' }, { label: 'W', value: '11' }, { label: 'D', value: '8' }, { label: 'L', value: '18' },
            { label: 'GF', value: '48' }, { label: 'GA', value: '56' }, { label: 'CS', value: '8' }, { label: 'Pos', value: '14th' },
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
            { time: '09:00', session: 'Recovery Group (Nwosu, Chen, Kemp)', type: 'Rehab', color: '#EF4444' },
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
      {sqLoadingSquad && (
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
          <div className="w-3 h-3 border border-gray-600 border-t-blue-500 rounded-full animate-spin"/>
          Loading live squad data...
        </div>
      )}
      {sqLiveSquad && (
        <div className="flex items-center gap-2 mb-3 text-xs text-emerald-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500"/>
          Live data from API-Football · {sqLiveSquad.length} players loaded
        </div>
      )}
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
            {[{m:'🥇',n:'M. Morris',p:'LW',a:36,g:12,as:6,mn:'2,980'},{m:'🥈',n:'M. Porter',p:'ST',a:34,g:9,as:3,mn:'2,740'},{m:'🥉',n:'O. Nwosu',p:'ST',a:32,g:5,as:2,mn:'1,820'},{m:'',n:'A. Smith',p:'CM',a:33,g:4,as:5,mn:'2,460'},{m:'',n:'A. Rowe',p:'CF',a:22,g:4,as:3,mn:'1,340'}].map(r=>(
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
        'Opposition (Eastcliff Town) weak against high press — 34% turnover rate in own half.',
        'Rafa Correia averages 3.2 key passes per game from right wing.',
      ]}
      actionButtons={[
        { label: 'Formation Builder', icon: Clipboard },
        { label: 'Opposition Report', icon: Eye },
        { label: 'Set Piece Planner', icon: Target },
        { label: 'Video Analysis', icon: Video },
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
  const [recruitTab, setRecruitTab] = useState<'window' | 'contracts' | 'agents' | 'loans'>('window')

  const RESEARCH_TARGETS = [
    { name: 'Aaron Collins', position: 'LW', club: 'Redmill United', age: 26, value: '£700k', fit: 92, summary: 'Direct left winger, strong in 1v1 duels. 4 assists this season. Suited to wide attacking style.' },
    { name: 'Louie Barry', position: 'CAM', club: 'Eastcliff Town', age: 22, value: '£1.2m', fit: 87, summary: 'Creative attacking midfielder, high work rate. Press-resistant with 89% pass accuracy.' },
    { name: 'Harvey Knibbs', position: 'ST', club: 'Oakridge Albion', age: 24, value: '£500k', fit: 78, summary: 'Mobile striker, good movement. 2 goals from set pieces this season.' },
  ]

  const CONTRACTS = [
    { player: 'Henderson',  pos: 'CB', expires: 'Jun 2026', wage: '£8,400/wk', status: 'Renewal in negotiation', flag: 'amber' as const },
    { player: 'Walsh',      pos: 'CM', expires: 'Jun 2027', wage: '£6,200/wk', status: 'Active',                   flag: 'green' as const },
    { player: 'Knibbs',     pos: 'ST', expires: 'Jun 2026', wage: '£5,800/wk', status: 'Renewal pending',         flag: 'amber' as const },
    { player: 'Diallo',     pos: 'LB', expires: 'Jan 2027', wage: '£4,400/wk', status: 'Active',                   flag: 'green' as const },
    { player: 'Wilson',     pos: 'CM', expires: 'May 2026', wage: '£3,800/wk', status: 'Released — formal letter', flag: 'red' as const   },
    { player: 'Osei',       pos: 'CB', expires: 'Jun 2028', wage: '£7,100/wk', status: 'Active',                   flag: 'green' as const },
  ]

  const AGENTS = [
    { agent: 'Stellar Group',     player: 'Henderson',  status: 'Negotiating',  meetingDue: 'Fri 02 May', notes: 'Wants 4-yr deal at £10k/wk. Counter at 3+1 / £9k.' },
    { agent: 'Base Soccer',       player: 'Knibbs',     status: 'Reviewing',    meetingDue: 'Mon 12 May', notes: 'Open to renewal — son just signed Academy.' },
    { agent: 'Wasserman',         player: 'Diallo',     status: 'Long-term',    meetingDue: '—',           notes: 'Annual catch-up due Q3. No active issues.' },
    { agent: 'Unique Sports',     player: 'Aaron Collins (target)', status: 'Initial contact', meetingDue: 'Tue 06 May', notes: 'Player open to move. Club willing to listen above £900k.' },
    { agent: 'CAA Stellar',       player: 'Louie Barry (target)',   status: 'Watching',         meetingDue: '—',          notes: 'Agent flagged interest from Championship clubs.' },
  ]

  const LOANS = [
    { player: 'Tanaka',     to: 'Northshore Athletic',  league: 'NL South',     until: 'May 2026', minutes: 1840, rating: 7.4, recallClause: 'Yes' },
    { player: 'Pollard',    to: 'Heritage Hill Town',   league: 'NL North',     until: 'May 2026', minutes: 2210, rating: 7.1, recallClause: 'Yes' },
    { player: 'Mason (U21)',to: 'Riverside FC',          league: 'Step 4',       until: 'May 2026', minutes: 1480, rating: 6.9, recallClause: 'Yes' },
    { player: 'Frost (U21)',to: 'Calderbrook Rovers',   league: 'Step 5',       until: 'Jan 2026', minutes: 920,  rating: 7.0, recallClause: 'No'  },
  ]

  const flagColor = (f: 'green' | 'amber' | 'red') => f === 'red' ? '#EF4444' : f === 'amber' ? '#F59E0B' : '#22C55E'
  const TABS: { id: 'window' | 'contracts' | 'agents' | 'loans'; label: string }[] = [
    { id: 'window',    label: 'Transfer Window Plan' },
    { id: 'contracts', label: 'Contract Tracker' },
    { id: 'agents',    label: 'Agent Pipeline' },
    { id: 'loans',     label: 'Loan Watchlist' },
  ]

  if (recruitTab !== 'window') {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2" style={{ color: '#F9FAFB' }}>📥 Recruitment Hub</h2>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Window plan · contracts · agents · loans</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderBottom: '1px solid #1F2937', overflowX: 'auto' }}>
          {TABS.map(t => {
            const active = recruitTab === t.id
            return (
              <button key={t.id} onClick={() => setRecruitTab(t.id)}
                style={{
                  appearance: 'none', border: 0, background: 'transparent',
                  padding: '10px 14px', fontSize: 12.5, fontWeight: active ? 600 : 500,
                  color: active ? '#fff' : '#9CA3AF',
                  borderBottom: `2px solid ${active ? '#003DA5' : 'transparent'}`,
                  marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'color .12s, border-color .12s',
                }}>{t.label}</button>
            )
          })}
        </div>

        {recruitTab === 'contracts' && (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <table className="w-full text-xs">
              <thead><tr style={{ background: '#0D0F14' }}>
                {['Player','Position','Expires','Wage','Status','Flag'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {CONTRACTS.map(c => (
                  <tr key={c.player} style={{ borderTop: '1px solid #1F2937' }}>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: '#F9FAFB' }}>{c.player}</td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: '#9CA3AF' }}>{c.pos}</td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: flagColor(c.flag) }}>{c.expires}</td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: '#D1D5DB' }}>{c.wage}</td>
                    <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{c.status}</td>
                    <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${flagColor(c.flag)}26`, color: flagColor(c.flag) }}>{c.flag.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {recruitTab === 'agents' && (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <table className="w-full text-xs">
              <thead><tr style={{ background: '#0D0F14' }}>
                {['Agency','Re: Player','Status','Next meeting','Notes'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {AGENTS.map((a, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #1F2937' }}>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: '#F9FAFB' }}>{a.agent}</td>
                    <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{a.player}</td>
                    <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,61,165,0.26)', color: '#7AAEFF' }}>{a.status.toUpperCase()}</span></td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: '#9CA3AF' }}>{a.meetingDue}</td>
                    <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{a.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {recruitTab === 'loans' && (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <table className="w-full text-xs">
              <thead><tr style={{ background: '#0D0F14' }}>
                {['Player','Loaned to','League','Until','Minutes','Rating','Recall'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {LOANS.map(l => (
                  <tr key={l.player} style={{ borderTop: '1px solid #1F2937' }}>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: '#F9FAFB' }}>{l.player}</td>
                    <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{l.to}</td>
                    <td className="px-3 py-2.5" style={{ color: '#9CA3AF' }}>{l.league}</td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: '#9CA3AF' }}>{l.until}</td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: '#D1D5DB' }}>{l.minutes}</td>
                    <td className="px-3 py-2.5 font-mono font-bold" style={{ color: l.rating >= 7.2 ? '#22C55E' : '#D1D5DB' }}>{l.rating.toFixed(1)}</td>
                    <td className="px-3 py-2.5" style={{ color: l.recallClause === 'Yes' ? '#22C55E' : '#9CA3AF' }}>{l.recallClause}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderBottom: '1px solid #1F2937', overflowX: 'auto' }}>
        {TABS.map(t => {
          const active = recruitTab === t.id
          return (
            <button key={t.id} onClick={() => setRecruitTab(t.id)}
              style={{
                appearance: 'none', border: 0, background: 'transparent',
                padding: '10px 14px', fontSize: 12.5, fontWeight: active ? 600 : 500,
                color: active ? '#fff' : '#9CA3AF',
                borderBottom: `2px solid ${active ? '#003DA5' : 'transparent'}`,
                marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'color .12s, border-color .12s',
              }}>{t.label}</button>
          )
        })}
      </div>
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
    </div>
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
        {[{ l: 'Log Injury', i: Heart }, { l: 'Return to Play', i: CheckCircle2 }, { l: 'Load Report', i: BarChart3 }, { l: 'Screen Player', i: Eye }, { l: 'Medical Clearance', i: Shield }, { l: 'GPS Report', i: Activity }].map(a => (
          <button key={a.l} onClick={() => medAction(a.l)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}>
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
                const loadColor = g.load === 'optimal' ? '#22C55E' : g.load === 'high' ? '#F59E0B' : '#EF4444'
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
            { player: 'Chris Nwosu', acwr: 1.38, load: 478, note: 'Steady increase over 8 weeks. Rest recommended — remove from starting XI consideration.' },
            { player: 'Tom Fletcher', acwr: 1.08, load: 298, note: 'Returning from injury — monitor load carefully. Reduce intensity for next 2 sessions if needed.' },
            { player: 'Dean Morris', acwr: 1.12, load: 445, note: 'Two consecutive match starts caused spike. One training rest day recommended.' },
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
            { player: 'Chris Nwosu', stages: ['Diagnosis', 'Treatment', 'Rehab', 'Light Training', 'Full Training', 'Match Ready'], current: 3 },
            { player: 'Brodi Chen', stages: ['Diagnosis', 'Treatment', 'Rehab', 'Light Training', 'Full Training', 'Match Ready'], current: 4 },
            { player: 'Isaac Kemp', stages: ['Diagnosis', 'Treatment', 'Rehab', 'Light Training', 'Full Training', 'Match Ready'], current: 4 },
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
          ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}>
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
          ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}>
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
            { scout: 'Chief Scout', region: 'England — League One', currentTrip: 'Redmill United vs MK Lumio Sports FC (Sat)', targets: 2, reports: 5 },
            { scout: 'Scout A', region: 'England — League Two', currentTrip: 'Eastcliff Town vs Bradford (Fri)', targets: 1, reports: 4 },
            { scout: 'Scout B', region: 'Northern Europe', currentTrip: 'Ajax U21 vs PSV U21 (Fri)', targets: 1, reports: 2 },
            { scout: 'Scout C', region: 'France / Belgium', currentTrip: 'Metz vs Auxerre (Sun)', targets: 1, reports: 1 },
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
          { player: 'Aaron Collins', scout: 'Chief Scout', league: 'League One — Redmill United', rating: 'A', date: '25 Mar' },
          { player: 'Louie Barry', scout: 'Scout A', league: 'League One — Eastcliff Town', rating: 'A-', date: '22 Mar' },
          { player: 'Harvey Knibbs', scout: 'Scout C', league: 'League One — Oakridge Albion', rating: 'B+', date: '20 Mar' },
          { player: 'Jordan Slew', scout: 'Scout B', league: 'League One — Eastbridge Orient', rating: 'B', date: '18 Mar' },
          { player: 'Ibou Sawaneh', scout: 'Chief Scout', league: 'League Two — Forest Green Rovers', rating: 'B-', date: '15 Mar' },
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
        'Academy Player (17, ST) hat-trick in U21s — strong first-team bench candidate.',
        'Alfie Morgan (16, CM) rated as generational talent by youth coaching staff.',
        'Rhys Okonkwo (18, CB) dominant aerially — bench squad inclusion pending.',
        'Elijah Shaw (17, LW) — 7 assists in last 8 U18 appearances.',
        'U21s won 3-0 yesterday. Unbeaten in last 6 matches.',
      ]}
      actionButtons={[
        { label: 'Promote to First Team', icon: ArrowRight },
        { label: 'Development Plan', icon: FileText },
        { label: 'Scholarship Offers', icon: GraduationCap },
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
        {[{ l: 'Match Report', i: FileText }, { l: 'Opposition Analysis', i: Search }, { l: 'Set Piece Review', i: Target }, { l: 'Formation Builder', i: Clipboard }, { l: 'Video Session', i: Video }, { l: 'Stats Report', i: BarChart3 }].map(a => (
          <button key={a.l} onClick={() => anAction(a.l)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}>
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
          { match: 'Lumio Sports 2-1 Riverside', xg: '1.8', xga: '0.9', poss: '62%', date: '22 Mar' },
          { match: 'Ashford 0-0 Lumio Sports', xg: '0.4', xga: '1.1', poss: '47%', date: '15 Mar' },
          { match: 'Lumio Sports 3-2 Millfield', xg: '2.4', xga: '1.6', poss: '55%', date: '8 Mar' },
          { match: 'Crestwood 1-2 Lumio Sports', xg: '1.9', xga: '1.2', poss: '51%', date: '1 Mar' },
          { match: 'Lumio Sports 1-0 Lakeside', xg: '1.1', xga: '0.7', poss: '59%', date: '22 Feb' },
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
          ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}>
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
          ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}>
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
                { outlet: 'Crown Broadcasting', type: 'Interview', subject: 'Pre-match preview', deadline: 'Thu PM', status: 'Pending', rec: 'Accept', recColor: '#22C55E' },
                { outlet: 'Northbridge Sport', type: 'Comment', subject: 'Diallo transfer rumour', deadline: 'Today', status: 'Urgent', rec: 'No comment', recColor: '#EF4444' },
                { outlet: 'Local Gazette', type: 'Access', subject: 'Fan forum coverage', deadline: 'Thu Eve', status: 'Pending', rec: 'Accept', recColor: '#22C55E' },
                { outlet: 'Northbridge Talk', type: 'Phone-in', subject: 'Weekend preview', deadline: 'Fri AM', status: 'New', rec: 'Decline — schedule clash', recColor: '#F59E0B' },
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
  const [htLoading, setHtLoading] = useState(false);
  const [htBrief, setHtBrief] = useState<{
    headline: string;
    fatigue_alerts: {player: string; stat: string; flag: string}[];
    tactical_insight: string;
    substitution_rec: string;
    second_half_instruction: string;
  } | null>(null);
  const [htScore, setHtScore] = useState('0-0');
  const [htOpponent, setHtOpponent] = useState('Millwall');
  const [htManualData, setHtManualData] = useState(
    GPS_PLAYER_DEMO.slice(0,11).map(p => ({
      name: p.name,
      dist: (p.distance * 0.48).toFixed(1),
      load: Math.round(p.load * 0.52),
      hsr: Math.round(p.hsr * 0.5),
      acwr: p.acwr,
    }))
  );

  const generateHalfTimeBrief = async () => {
    setHtLoading(true);
    try {
      const highLoad = htManualData.filter(p => Number(p.load) > 240).map(p => `${p.name} (${p.load} AU)`);
      const highACWR = htManualData.filter(p => p.acwr > 1.3).map(p => `${p.name} (ACWR ${p.acwr.toFixed(2)})`);
      const avgDist = (htManualData.reduce((a,p) => a + Number(p.dist), 0) / htManualData.length).toFixed(1);
      const response = await fetch('/api/ai/football', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: `You are a football performance analyst generating a half-time GPS brief for the manager. Be direct, specific, and actionable — this will be read in a 15-minute dressing room break.

Match: Lumio Sports FC vs ${htOpponent}. Half-time score: ${htScore}.
Average first-half distance covered: ${avgDist}km per player.
High session load players (>240 AU): ${highLoad.length > 0 ? highLoad.join(', ') : 'None'}.
High ACWR risk players (>1.3): ${highACWR.length > 0 ? highACWR.join(', ') : 'None'}.
Full GPS data: ${htManualData.map(p => `${p.name}: ${p.dist}km, ${p.load} AU, ${p.hsr}m HSR, ACWR ${p.acwr}`).join(' | ')}.

Respond ONLY in JSON (no markdown):
{
  "headline": "one sentence overall performance summary based on GPS data",
  "fatigue_alerts": [{"player": "name", "stat": "specific GPS stat", "flag": "short flag e.g. Withdraw at 60min"}],
  "tactical_insight": "2 sentences on what the GPS movement patterns suggest about tactical effectiveness in the first half",
  "substitution_rec": "specific substitution recommendation with GPS reasoning — name the player and who to bring on",
  "second_half_instruction": "2 sentences of specific second-half tactical instruction based on the GPS data"
}`
          }]
        })
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      const s = text.indexOf('{'); const e = text.lastIndexOf('}');
      if (s !== -1 && e !== -1) setHtBrief(JSON.parse(text.slice(s, e+1)));
    } catch (err) {
      console.error('Half-time brief failed:', err);
    } finally {
      setHtLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Match Day Operations</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Matchday logistics, team sheet, ticketing, and operational checklists.</p>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #F1C40F33' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>🤖 AI Half-Time GPS Brief</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>LIVE</span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>GPS data from first 45 minutes → AI coach brief for the dressing room</p>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Half-time score</p>
              <input value={htScore} onChange={e => setHtScore(e.target.value)}
                className="w-full text-sm font-bold rounded-lg px-3 py-2"
                style={{ backgroundColor: '#0d0f1a', border: '1px solid #1F2937', color: '#F9FAFB' }}
                placeholder="e.g. 0-1"/>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Opposition</p>
              <input value={htOpponent} onChange={e => setHtOpponent(e.target.value)}
                className="w-full text-sm rounded-lg px-3 py-2"
                style={{ backgroundColor: '#0d0f1a', border: '1px solid #1F2937', color: '#F9FAFB' }}/>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden mb-4" style={{ border: '1px solid #1F2937' }}>
            <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: '#0d0f1a', borderBottom: '1px solid #1F2937' }}>
              <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>First Half GPS Data (editable)</p>
              <span className="text-xs" style={{ color: '#6B7280' }}>Auto-filled from last match session</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1F2937', backgroundColor: '#111318' }}>
                    {['Player','Dist (km)','Load (AU)','HSR (m)','ACWR'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6B7280', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {htManualData.map((p, i) => (
                    <tr key={i} style={{ borderBottom: i < htManualData.length-1 ? '1px solid #1F2937' : 'none', backgroundColor: p.acwr > 1.3 ? 'rgba(239,68,68,0.05)' : 'transparent' }}>
                      <td style={{ padding: '7px 12px', color: '#F9FAFB', fontWeight: 500 }}>{p.name}</td>
                      {(['dist','load','hsr'] as const).map(key => (
                        <td key={key} style={{ padding: '7px 12px' }}>
                          <input
                            value={String((p as Record<string, string | number>)[key])}
                            onChange={e => setHtManualData(prev => prev.map((x,j) => j===i ? {...x,[key]:e.target.value} : x))}
                            style={{ width: 60, backgroundColor: 'transparent', border: 'none', color: '#D1D5DB', fontSize: 12, outline: 'none' }}/>
                        </td>
                      ))}
                      <td style={{ padding: '7px 12px' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: p.acwr > 1.3 ? '#EF4444' : p.acwr > 1.15 ? '#F59E0B' : '#22C55E' }}>
                          {p.acwr.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button onClick={generateHalfTimeBrief} disabled={htLoading}
            className="w-full py-3 rounded-xl text-sm font-bold mb-4 transition-all"
            style={{ backgroundColor: htLoading ? '#1F2937' : '#003DA5', color: '#F1C40F', opacity: htLoading ? 0.6 : 1 }}>
            {htLoading ? '⏳ Generating brief...' : '🎯 Generate Half-Time Brief'}
          </button>

          {htBrief && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: '#0d0f1a', border: '1px solid #003DA5' }}>
                <p className="text-sm font-bold" style={{ color: '#93C5FD' }}>{htBrief.headline}</p>
              </div>
              {htBrief.fatigue_alerts.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
                  <div className="px-4 py-2" style={{ backgroundColor: '#0d0f1a', borderBottom: '1px solid #1F2937' }}>
                    <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>⚠ Fatigue Alerts</p>
                  </div>
                  {htBrief.fatigue_alerts.map((a, i) => (
                    <div key={i} className="px-4 py-3 flex items-start gap-3" style={{ borderBottom: i < htBrief.fatigue_alerts.length-1 ? '1px solid #1F2937' : 'none' }}>
                      <span className="text-sm font-bold" style={{ color: '#F9FAFB', minWidth: 120 }}>{a.player}</span>
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>{a.stat}</span>
                      <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444', whiteSpace: 'nowrap' }}>{a.flag}</span>
                    </div>
                  ))}
                </div>
              )}
              {[
                { label: '📊 Tactical Insight', value: htBrief.tactical_insight, color: '#3B82F6' },
                { label: '🔄 Substitution Recommendation', value: htBrief.substitution_rec, color: '#F59E0B' },
                { label: '▶ Second Half Instruction', value: htBrief.second_half_instruction, color: '#22C55E' },
              ].map(item => (
                <div key={item.label} className="p-4 rounded-xl" style={{ backgroundColor: '#0d0f1a', border: '1px solid #1F2937' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: item.color }}>{item.label}</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{item.value}</p>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <button onClick={() => setHtBrief(null)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium"
                  style={{ border: '1px solid #1F2937', color: '#6B7280' }}>
                  Regenerate
                </button>
                <button onClick={() => {
                  const text = `HALF-TIME GPS BRIEF\n\n${htBrief.headline}\n\nFATIGUE ALERTS:\n${htBrief.fatigue_alerts.map(a=>`• ${a.player}: ${a.stat} — ${a.flag}`).join('\n')}\n\nTACTICAL: ${htBrief.tactical_insight}\n\nSUBSTITUTION: ${htBrief.substitution_rec}\n\nSECOND HALF: ${htBrief.second_half_instruction}`;
                  navigator.clipboard.writeText(text);
                }} className="flex-1 py-2 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: '#003DA5', color: '#F1C40F' }}>
                  Copy for tablet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: 'Team Sheet', icon: Clipboard },
          { label: 'Operations Checklist', icon: CheckCircle2 },
          { label: 'Ticketing', icon: FileText },
          ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}>
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
  { name: 'Jordan Hayes', distance: 11.4, hsr: 1680, sprints: 28, maxSpeed: 33.8, load: 420, acwr: 0.88, readiness: 95, status: 'optimal' as const },
  { name: 'Tom Fletcher', distance: 10.8, hsr: 1550, sprints: 42, maxSpeed: 34.2, load: 445, acwr: 1.08, readiness: 82, status: 'optimal' as const },
  { name: 'Daniel Webb', distance: 9.2, hsr: 620, sprints: 12, maxSpeed: 28.4, load: 310, acwr: 0.94, readiness: 91, status: 'optimal' as const },
  { name: 'Marcus Reid', distance: 10.1, hsr: 1490, sprints: 36, maxSpeed: 34.8, load: 478, acwr: 0.90, readiness: 92, status: 'optimal' as const },
  { name: 'Kyle Osei', distance: 10.6, hsr: 1380, sprints: 30, maxSpeed: 33.1, load: 398, acwr: 0.96, readiness: 89, status: 'optimal' as const },
  { name: 'Liam Barker', distance: 9.8, hsr: 890, sprints: 18, maxSpeed: 30.6, load: 280, acwr: 0.95, readiness: 90, status: 'optimal' as const },
  { name: 'Connor Walsh', distance: 10.2, hsr: 1420, sprints: 34, maxSpeed: 33.1, load: 412, acwr: 0.92, readiness: 88, status: 'optimal' as const },
  { name: 'Ryan Cole', distance: 11.1, hsr: 1620, sprints: 38, maxSpeed: 35.2, load: 456, acwr: 0.97, readiness: 87, status: 'optimal' as const },
  { name: 'Dean Morris', distance: 8.4, hsr: 520, sprints: 10, maxSpeed: 26.8, load: 245, acwr: 1.12, readiness: 88, status: 'caution' as const },
  { name: 'Sam Porter', distance: 9.0, hsr: 640, sprints: 14, maxSpeed: 29.2, load: 322, acwr: 0.91, readiness: 93, status: 'optimal' as const },
  { name: 'Chris Nwosu', distance: 8.8, hsr: 580, sprints: 11, maxSpeed: 27.6, load: 298, acwr: 1.38, readiness: 61, status: 'caution' as const },
  { name: 'Paul Granger', distance: 5.8, hsr: 320, sprints: 4, maxSpeed: 24.2, load: 165, acwr: 0.78, readiness: 96, status: 'optimal' as const },
]

const WEEKLY_LOAD_DEMO = [
  { week: 'W1', 'Tom Fletcher': 380, 'Dean Morris': 420, 'Chris Nwosu': 350, 'Sam Porter': 360, avg: 378 },
  { week: 'W2', 'Tom Fletcher': 395, 'Dean Morris': 410, 'Chris Nwosu': 380, 'Sam Porter': 375, avg: 390 },
  { week: 'W3', 'Tom Fletcher': 410, 'Dean Morris': 430, 'Chris Nwosu': 420, 'Sam Porter': 390, avg: 413 },
  { week: 'W4', 'Tom Fletcher': 390, 'Dean Morris': 440, 'Chris Nwosu': 445, 'Sam Porter': 385, avg: 415 },
  { week: 'W5', 'Tom Fletcher': 420, 'Dean Morris': 435, 'Chris Nwosu': 460, 'Sam Porter': 400, avg: 429 },
  { week: 'W6', 'Tom Fletcher': 405, 'Dean Morris': 445, 'Chris Nwosu': 470, 'Sam Porter': 395, avg: 429 },
  { week: 'W7', 'Tom Fletcher': 415, 'Dean Morris': 440, 'Chris Nwosu': 475, 'Sam Porter': 398, avg: 432 },
  { week: 'W8', 'Tom Fletcher': 420, 'Dean Morris': 445, 'Chris Nwosu': 478, 'Sam Porter': 412, avg: 439 },
]

const MATCH_VS_TRAIN_DEMO = [
  { name: 'Tom Fletcher', matchDist: 11.4, trainDist: 9.8, matchHSR: 1680, trainHSR: 1220, matchLoad: 420, trainLoad: 340, diff: '+24%' },
  { name: 'Dean Morris', matchDist: 10.8, trainDist: 10.2, matchHSR: 1550, trainHSR: 1380, matchLoad: 445, trainLoad: 410, diff: '+9%' },
  { name: 'Chris Nwosu', matchDist: 10.1, trainDist: 9.5, matchHSR: 1490, trainHSR: 1100, matchLoad: 478, trainLoad: 350, diff: '+37%' },
  { name: 'Sam Porter', matchDist: 10.6, trainDist: 10.0, matchHSR: 1380, trainHSR: 1280, matchLoad: 398, trainLoad: 370, diff: '+8%' },
  { name: 'Liam Barker', matchDist: 11.1, trainDist: 9.2, matchHSR: 1620, trainHSR: 1050, matchLoad: 456, trainLoad: 310, diff: '+47%' },
  { name: 'Paul Granger', matchDist: 10.2, trainDist: 9.6, matchHSR: 1420, trainHSR: 1200, matchLoad: 412, trainLoad: 360, diff: '+14%' },
]

const PITCH_HEATMAP_DATA: Record<string, {x:number;y:number;r:number;o:number}[]> = {
  'Jordan Hayes':   [{x:420,y:34,r:28,o:0.8},{x:420,y:34,r:50,o:0.3}],
  'Tom Fletcher':    [{x:95,y:20,r:32,o:0.7},{x:120,y:40,r:24,o:0.55},{x:180,y:25,r:20,o:0.45},{x:240,y:18,r:18,o:0.38}],
  'Daniel Webb':    [{x:210,y:34,r:30,o:0.72},{x:235,y:34,r:22,o:0.58},{x:175,y:34,r:18,o:0.42}],
  'Marcus Reid':   [{x:200,y:22,r:30,o:0.70},{x:225,y:22,r:22,o:0.55},{x:190,y:34,r:18,o:0.40}],
  'Kyle Osei':  [{x:105,y:48,r:30,o:0.68},{x:140,y:52,r:24,o:0.52},{x:200,y:48,r:20,o:0.42}],
  'Liam Barker':  [{x:300,y:15,r:34,o:0.72},{x:340,y:20,r:26,o:0.58},{x:360,y:34,r:22,o:0.48},{x:320,y:45,r:18,o:0.38}],
  'Connor Walsh':     [{x:210,y:20,r:28,o:0.68},{x:250,y:25,r:22,o:0.54},{x:280,y:34,r:18,o:0.42},{x:240,y:44,r:16,o:0.35}],
  'Ryan Cole':  [{x:300,y:52,r:32,o:0.70},{x:340,y:48,r:26,o:0.55},{x:360,y:34,r:22,o:0.45},{x:310,y:40,r:18,o:0.36}],
  'Dean Morris':   [{x:340,y:20,r:36,o:0.74},{x:370,y:15,r:28,o:0.60},{x:390,y:25,r:22,o:0.48},{x:360,y:34,r:18,o:0.38}],
  'Sam Porter':  [{x:280,y:20,r:30,o:0.65},{x:310,y:15,r:24,o:0.52},{x:340,y:25,r:20,o:0.42}],
  'Chris Nwosu':     [{x:355,y:34,r:38,o:0.76},{x:380,y:25,r:30,o:0.62},{x:400,y:20,r:24,o:0.50},{x:385,y:44,r:20,o:0.40}],
  'Paul Granger':  [{x:210,y:34,r:26,o:0.62},{x:230,y:28,r:20,o:0.48},{x:195,y:40,r:16,o:0.36}],
};

function FootballPitchHeatmap({ selectedPlayer }: { selectedPlayer: string | null }) {
  const W = 420; const H = 68;
  const zones = selectedPlayer ? (PITCH_HEATMAP_DATA[selectedPlayer] || []) : Object.values(PITCH_HEATMAP_DATA).flat();
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 640, display: 'block', borderRadius: 8, border: '1px solid #1F2937' }}>
        <rect x={0} y={0} width={W} height={H} fill="#1a3d1a"/>
        {Array.from({length:7},(_,i)=>(
          <rect key={i} x={i*60} y={0} width={60} height={H} fill={i%2===0?'rgba(255,255,255,0.02)':'transparent'}/>
        ))}
        <rect x={2} y={2} width={W-4} height={H-4} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1"/>
        <line x1={W/2} y1={2} x2={W/2} y2={H-2} stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
        <circle cx={W/2} cy={H/2} r={9.15} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
        <circle cx={W/2} cy={H/2} r={1} fill="rgba(255,255,255,0.6)"/>
        <rect x={2} y={(H-40.32)/2} width={16.5} height={40.32} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
        <rect x={2} y={(H-18.32)/2} width={5.5} height={18.32} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
        <rect x={W-18.5} y={(H-40.32)/2} width={16.5} height={40.32} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
        <rect x={W-7.5} y={(H-18.32)/2} width={5.5} height={18.32} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
        <rect x={0} y={(H-7.32)/2} width={1.5} height={7.32} fill="rgba(255,255,255,0.4)"/>
        <rect x={W-1.5} y={(H-7.32)/2} width={1.5} height={7.32} fill="rgba(255,255,255,0.4)"/>
        <circle cx={11} cy={H/2} r={0.8} fill="rgba(255,255,255,0.6)"/>
        <circle cx={W-11} cy={H/2} r={0.8} fill="rgba(255,255,255,0.6)"/>
        {zones.map((z,i)=>(
          <circle key={i} cx={z.x} cy={z.y} r={z.r} fill="#003DA5" opacity={z.o} style={{filter:'blur(6px)'}}/>
        ))}
        <text x={W/2} y={H-1} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="4">ATTACKING DIRECTION →</text>
      </svg>
    </div>
  );
}

function PerformanceGPSView() {
  const [tab, setTab] = useState<PerfTab>('session')
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [connectToken, setConnectToken] = useState('')
  const [connectProvider, setConnectProvider] = useState<'johansports' | 'csv'>('johansports')
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionAnalysis, setSessionAnalysis] = useState<{
    session_rating: string;
    load_summary: string;
    rest_today: string[];
    push_harder: string[];
    injury_watch: string[];
    tomorrow_recommendation: string;
  } | null>(null);

  const generateSessionAnalysis = async () => {
    setSessionLoading(true);
    try {
      const highACWR = GPS_PLAYER_DEMO.filter(p => p.acwr > 1.3);
      const lowACWR = GPS_PLAYER_DEMO.filter(p => p.acwr < 0.8);
      const avgLoad = Math.round(GPS_PLAYER_DEMO.reduce((a,p) => a+p.load, 0) / GPS_PLAYER_DEMO.length);
      const avgDist = (GPS_PLAYER_DEMO.reduce((a,p) => a+p.distance, 0) / GPS_PLAYER_DEMO.length).toFixed(1);
      const response = await fetch('/api/ai/football', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 700,
          messages: [{
            role: 'user',
            content: `You are a football performance analyst for Lumio Sports FC. Analyse this training session GPS data and give specific coaching recommendations.

Session: ${GPS_SESSIONS_DEMO[0].name} (${GPS_SESSIONS_DEMO[0].date}). ${GPS_PLAYER_DEMO.length} players tracked.
Squad average: ${avgDist}km distance, ${avgLoad} AU load.
High ACWR risk (>1.3): ${highACWR.length > 0 ? highACWR.map(p=>`${p.name} (${p.acwr.toFixed(2)})`).join(', ') : 'None'}.
Undertraining (<0.8 ACWR): ${lowACWR.length > 0 ? lowACWR.map(p=>`${p.name} (${p.acwr.toFixed(2)})`).join(', ') : 'None'}.
Full data: ${GPS_PLAYER_DEMO.map(p=>`${p.name}: ${p.distance}km, load ${p.load}AU, ACWR ${p.acwr.toFixed(2)}, readiness ${p.readiness}%`).join(' | ')}.
Next match: Saturday (4 days away).

Respond ONLY in JSON (no markdown):
{
  "session_rating": "e.g. 7.5/10 — Good",
  "load_summary": "2 sentences on the overall squad load picture and whether it's appropriate for 4 days before a match",
  "rest_today": ["Player name — specific reason e.g. ACWR 1.38, approaching injury zone"],
  "push_harder": ["Player name — specific reason e.g. ACWR 0.78, undertraining relative to peers"],
  "injury_watch": ["Player name — specific concern to monitor"],
  "tomorrow_recommendation": "2 sentences on what tomorrow's session should look like based on today's data — intensity, focus, who to manage"
}`
          }]
        })
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      const s = text.indexOf('{'); const e = text.lastIndexOf('}');
      if (s !== -1 && e !== -1) setSessionAnalysis(JSON.parse(text.slice(s, e+1)));
    } catch (err) {
      console.error('Session analysis failed:', err);
    } finally {
      setSessionLoading(false);
    }
  };

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
          ].map((a, i) => (
          <button key={i} onClick={() => { setToast(`${a.label} — opening workflow...`); setTimeout(() => setToast(null), 2500) }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}>
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

          {/* Pitch Heatmap */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>⚽ Pitch Position Heatmap</p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>GPS positional data — last session · Lumio GPS</p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: '#F1C40F' }}>LUMIO GPS VEST</span>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => setSelectedPlayer(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ backgroundColor: selectedPlayer === null ? 'rgba(0,61,165,0.3)' : 'transparent', border: `1px solid ${selectedPlayer === null ? '#003DA5' : '#1F2937'}`, color: selectedPlayer === null ? '#93C5FD' : '#6B7280' }}>
                  Full Squad
                </button>
                {GPS_PLAYER_DEMO.map(p => (
                  <button key={p.name} onClick={() => setSelectedPlayer(p.name)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ backgroundColor: selectedPlayer === p.name ? 'rgba(0,61,165,0.3)' : 'transparent', border: `1px solid ${selectedPlayer === p.name ? '#003DA5' : '#1F2937'}`, color: selectedPlayer === p.name ? '#93C5FD' : '#6B7280' }}>
                    {p.name.split(' ')[1] || p.name}
                  </button>
                ))}
              </div>
              <FootballPitchHeatmap selectedPlayer={selectedPlayer} />
              <div className="flex items-center gap-6 mt-3 text-xs" style={{ color: '#6B7280' }}>
                <div className="flex items-center gap-2"><div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#003DA5', opacity: 0.8 }}/><span>High activity</span></div>
                <div className="flex items-center gap-2"><div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#003DA5', opacity: 0.4 }}/><span>Medium activity</span></div>
                <div className="flex items-center gap-2"><div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#003DA5', opacity: 0.2 }}/><span>Low activity</span></div>
              </div>
              {selectedPlayer && (() => {
                const p = GPS_PLAYER_DEMO.find(x => x.name === selectedPlayer);
                if (!p) return null;
                return (
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {[
                      { label: 'Distance', value: `${p.distance}km` },
                      { label: 'HSR', value: `${p.hsr}m` },
                      { label: 'Sprints', value: p.sprints },
                      { label: 'ACWR', value: p.acwr.toFixed(2) },
                    ].map(s => (
                      <div key={s.label} className="text-center p-2 rounded-lg" style={{ backgroundColor: '#0d0f1a', border: '1px solid #1F2937' }}>
                        <div className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{s.value}</div>
                        <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* AI Post-Session Analysis */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>🤖 AI Post-Session Analysis</p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Claude analyses the full squad GPS load and generates coaching recommendations</p>
              </div>
              <button onClick={generateSessionAnalysis} disabled={sessionLoading}
                className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                style={{ backgroundColor: sessionLoading ? '#1F2937' : '#003DA5', color: '#F1C40F', opacity: sessionLoading ? 0.6 : 1 }}>
                {sessionLoading ? 'Analysing...' : '🏆 Analyse Session'}
              </button>
            </div>
            {!sessionAnalysis && !sessionLoading && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm" style={{ color: '#6B7280' }}>Click Analyse Session to get AI coaching recommendations based on today&apos;s GPS data.</p>
                <p className="text-xs mt-2" style={{ color: '#374151' }}>Covers: load summary, who to rest, who can push harder, injury watch list, tomorrow&apos;s recommendation.</p>
              </div>
            )}
            {sessionLoading && (
              <div className="px-5 py-8 text-center">
                <div className="text-2xl mb-2">⏳</div>
                <p className="text-sm" style={{ color: '#6B7280' }}>Analysing {GPS_PLAYER_DEMO.length} players across {GPS_SESSIONS_DEMO.length} recent sessions...</p>
              </div>
            )}
            {sessionAnalysis && (
              <div className="p-5 space-y-4">
                <div className="p-4 rounded-xl" style={{ backgroundColor: '#0d0f1a', border: '1px solid #003DA5' }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Session Rating</p>
                    <p className="text-lg font-black" style={{ color: '#F1C40F' }}>{sessionAnalysis.session_rating}</p>
                  </div>
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: '#D1D5DB' }}>{sessionAnalysis.load_summary}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
                    <div className="px-4 py-2" style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
                      <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>🛑 Rest Today</p>
                    </div>
                    <div className="p-3 space-y-1">
                      {sessionAnalysis.rest_today.map((p, i) => (
                        <p key={i} className="text-xs" style={{ color: '#F9FAFB' }}>• {p}</p>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(34,197,94,0.3)' }}>
                    <div className="px-4 py-2" style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderBottom: '1px solid rgba(34,197,94,0.2)' }}>
                      <p className="text-xs font-semibold" style={{ color: '#22C55E' }}>✅ Can Push Harder</p>
                    </div>
                    <div className="p-3 space-y-1">
                      {sessionAnalysis.push_harder.map((p, i) => (
                        <p key={i} className="text-xs" style={{ color: '#F9FAFB' }}>• {p}</p>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
                    <div className="px-4 py-2" style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
                      <p className="text-xs font-semibold" style={{ color: '#F59E0B' }}>⚠ Injury Watch</p>
                    </div>
                    <div className="p-3 space-y-1">
                      {sessionAnalysis.injury_watch.map((p, i) => (
                        <p key={i} className="text-xs" style={{ color: '#F9FAFB' }}>• {p}</p>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl" style={{ backgroundColor: '#0d0f1a', border: '1px solid #1F2937' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#3B82F6' }}>📅 Tomorrow&apos;s Training Recommendation</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{sessionAnalysis.tomorrow_recommendation}</p>
                </div>
                <button onClick={() => setSessionAnalysis(null)}
                  className="text-xs" style={{ color: '#374151' }}>
                  Clear analysis
                </button>
              </div>
            )}
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
                  <Line type="monotone" dataKey="Tom Fletcher" stroke="#3B82F6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Dean Morris" stroke="#EF4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Chris Nwosu" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Sam Porter" stroke="#22C55E" strokeWidth={2} dot={false} />
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
                "Chris Nwosu's load has increased steadily over 8 weeks — now at elevated injury risk (ACWR 1.38).",
                "Dean Morris spiked in W4 following two consecutive match starts — manage carefully.",
                "Squad average load trending upward — consider a recovery week before next fixture run.",
                "Tom Fletcher and Sam Porter both within optimal range — available for full selection.",
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
                "Liam Barker shows highest match-to-training spike (+47%) — condition needs work or his training intensity is too low.",
                "Chris Nwosu +37% spike on match day with elevated ACWR — limit minutes or start from bench.",
                "Tom Fletcher and Sam Porter both consistent — match output mirrors training. Good conditioning base.",
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
            {/* Lumio GPS (Primary) */}
            <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59,130,246,0.15)' }}>
                  <Activity size={20} style={{ color: '#3B82F6' }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Lumio GPS</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Connect your Lumio GPS account to sync vest data automatically into your squad dashboard.</p>
                </div>
              </div>
              <input type="text" placeholder="Enter your Lumio GPS API key"
                className="w-full px-4 py-2.5 rounded-lg text-sm mb-3"
                style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB', outline: 'none' }}
                value={connectProvider === 'johansports' ? connectToken : ''}
                onChange={e => { setConnectProvider('johansports'); setConnectToken(e.target.value) }} />
              <button onClick={() => { setToast('Lumio GPS connected — syncing sessions...'); setConnectToken(''); setTimeout(() => setToast(null), 2500) }}
                className="w-full px-4 py-2.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#3B82F6', color: '#FFF' }}>
                Connect Lumio GPS
              </button>
            </div>

            {/* Legacy Providers */}
            <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}>
                  <Activity size={20} style={{ color: '#22C55E' }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Legacy GPS Platform</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Manual sync via CSV upload — see below</p>
                </div>
              </div>
              <input type="text" placeholder="Paste legacy provider API key..."
                className="w-full px-4 py-2.5 rounded-lg text-sm mb-3"
                style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB', outline: 'none' }}
                value={connectProvider === 'csv' ? connectToken : ''}
                onChange={e => { setConnectProvider('csv'); setConnectToken(e.target.value) }} />
              <button onClick={() => { setToast('Legacy provider connected — syncing sessions...'); setConnectToken(''); setTimeout(() => setToast(null), 2500) }}
                className="w-full px-4 py-2.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#22C55E', color: '#FFF' }}>
                Connect Legacy Provider
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
                <p className="text-xs" style={{ color: '#6B7280' }}>Manually export from your GPS platform and upload directly. Supports Lumio GPS and standard GPS CSV formats.</p>
              </div>
            </div>
            <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-amber-600"
              style={{ borderColor: '#374151' }}>
              <FileText size={32} className="mx-auto mb-2" style={{ color: '#6B7280' }} />
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Drop CSV file here or click to browse</p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Auto-detects Lumio GPS and standard GPS CSV formats from column headers</p>
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
                <p className="text-sm font-bold mt-1" style={{ color: '#3B82F6' }}>Lumio GPS</p>
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

// ─── GPS Heatmaps View ──────────────────────────────────────────────────────
// Showpiece visualisation hub — pure inline SVG, green→red heat scale,
// brand colours pulled from localStorage at mount. All data is demo seed
// (deterministic per player so the view is stable across re-renders).

const HEAT_STOPS = ['#0E7C3A', '#22C55E', '#FACC15', '#F59E0B', '#EF4444', '#7F1D1D']
const heatColor = (intensity: number) => {
  const t = Math.max(0, Math.min(1, intensity))
  const idx = Math.min(HEAT_STOPS.length - 1, Math.floor(t * (HEAT_STOPS.length - 1)))
  return HEAT_STOPS[idx]
}

// Deterministic pseudo-random — keeps heat clouds stable across renders
// without seeding a full PRNG. Inputs collapse name + index into a hash.
function hashAt(str: string, salt: number): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  }
  return ((h >>> 0) % 10000) / 10000
}

const GPS_HEATMAP_PLAYERS = [
  { name: 'Tom Fletcher',  position: 'LB',  group: 'Defenders' },
  { name: 'Daniel Webb',   position: 'CB',  group: 'Defenders' },
  { name: 'Marcus Reid',   position: 'CB',  group: 'Defenders' },
  { name: 'Kyle Osei',     position: 'RB',  group: 'Defenders' },
  { name: 'Liam Barker',   position: 'CM',  group: 'Midfielders' },
  { name: 'Connor Walsh',  position: 'CM',  group: 'Midfielders' },
  { name: 'Ryan Cole',     position: 'CM',  group: 'Midfielders' },
  { name: 'Paul Granger',  position: 'CDM', group: 'Midfielders' },
  { name: 'Dean Morris',   position: 'LW',  group: 'Forwards' },
  { name: 'Sam Porter',    position: 'ST',  group: 'Forwards' },
  { name: 'Myles Okafor',  position: 'LW',  group: 'Forwards' },
  { name: 'James Tilley',  position: 'RW',  group: 'Forwards' },
]

const GPS_HEATMAP_MATCHES = [
  'Northgate City (H) — 1-2 L',
  'Plymouth Argyle (A) — 1-2 L',
  'Fernbrook Athletic (H) — 1-1 D',
  'Castleton Rovers (A) — 2-0 W',
  'Redmill United (H) — 2-2 D',
]

const GPS_HEATMAP_TRAINING = [
  'Tue — Tactical (90min)',
  'Wed — High Intensity (75min)',
  'Thu — S&C (60min)',
  "Fri — Captain's Run (45min)",
]

function FootballPitch({ width, height, lineCol = 'rgba(255,255,255,0.18)' }: { width: number; height: number; lineCol?: string }) {
  const W = width, H = height
  return (
    <g>
      <rect width={W} height={H} fill="#06140a" rx={6} />
      <rect x={1} y={1} width={W - 2} height={H - 2} fill="none" stroke={lineCol} strokeWidth={1.5} />
      <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke={lineCol} strokeWidth={1.2} />
      <circle cx={W / 2} cy={H / 2} r={H * 0.13} fill="none" stroke={lineCol} strokeWidth={1} />
      <circle cx={W / 2} cy={H / 2} r={2.5} fill={lineCol} />
      {/* Penalty boxes */}
      <rect x={0} y={H * 0.22} width={W * 0.16} height={H * 0.56} fill="none" stroke={lineCol} strokeWidth={1} />
      <rect x={W - W * 0.16} y={H * 0.22} width={W * 0.16} height={H * 0.56} fill="none" stroke={lineCol} strokeWidth={1} />
      {/* 6-yard boxes */}
      <rect x={0} y={H * 0.36} width={W * 0.06} height={H * 0.28} fill="none" stroke={lineCol} strokeWidth={1} />
      <rect x={W - W * 0.06} y={H * 0.36} width={W * 0.06} height={H * 0.28} fill="none" stroke={lineCol} strokeWidth={1} />
      {/* Goals */}
      <line x1={0} y1={H * 0.44} x2={0} y2={H * 0.56} stroke="rgba(255,255,255,0.55)" strokeWidth={3} />
      <line x1={W} y1={H * 0.44} x2={W} y2={H * 0.56} stroke="rgba(255,255,255,0.55)" strokeWidth={3} />
      {/* Penalty arcs */}
      <path d={`M ${W * 0.16} ${H * 0.4} A ${H * 0.13} ${H * 0.13} 0 0 1 ${W * 0.16} ${H * 0.6}`} fill="none" stroke={lineCol} strokeWidth={1} />
      <path d={`M ${W - W * 0.16} ${H * 0.4} A ${H * 0.13} ${H * 0.13} 0 0 0 ${W - W * 0.16} ${H * 0.6}`} fill="none" stroke={lineCol} strokeWidth={1} />
    </g>
  )
}

function PositionalHeatmap({ width, height, player, matchIdx, intensity = 1 }: {
  width: number; height: number; player: string; matchIdx: number; intensity?: number
}) {
  const W = width, H = height
  // 12x8 cell grid sampled deterministically. Anchor the densest cell on a
  // player-specific zone so each squad member's heatmap has a believable
  // shape (LB hugs left flank, ST hovers around the box, etc).
  const meta = GPS_HEATMAP_PLAYERS.find(p => p.name === player)
  const anchor = (() => {
    switch (meta?.position) {
      case 'LB': return { x: 0.18, y: 0.22 }
      case 'RB': return { x: 0.18, y: 0.78 }
      case 'CB': return { x: 0.22, y: 0.5 }
      case 'CM': return { x: 0.5, y: 0.5 }
      case 'CDM': return { x: 0.36, y: 0.5 }
      case 'CAM': return { x: 0.62, y: 0.5 }
      case 'LW': return { x: 0.78, y: 0.22 }
      case 'RW': return { x: 0.78, y: 0.78 }
      case 'ST':
      case 'CF': return { x: 0.82, y: 0.5 }
      default: return { x: 0.5, y: 0.5 }
    }
  })()
  const cols = 14, rows = 9
  const cellW = W / cols, cellH = H / rows
  const cells: { x: number; y: number; t: number }[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = (c + 0.5) / cols
      const cy = (r + 0.5) / rows
      const dx = cx - anchor.x
      const dy = cy - anchor.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const noise = hashAt(`${player}-${matchIdx}-${r}-${c}`, 7) * 0.45
      const base = Math.max(0, 1 - dist * 1.9) + noise * 0.5
      const t = Math.min(1, base * intensity)
      if (t > 0.08) cells.push({ x: c * cellW, y: r * cellH, t })
    }
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 360 }}>
      <defs>
        <filter id={`blur-${player.replace(/\s+/g, '')}-${matchIdx}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <FootballPitch width={W} height={H} />
      <g filter={`url(#blur-${player.replace(/\s+/g, '')}-${matchIdx})`} opacity={0.85}>
        {cells.map((cell, i) => (
          <rect
            key={i}
            x={cell.x}
            y={cell.y}
            width={cellW + 2}
            height={cellH + 2}
            fill={heatColor(cell.t)}
            opacity={0.35 + cell.t * 0.55}
          />
        ))}
      </g>
    </svg>
  )
}

function TouchMap({ width, height, player, matchIdx, brandPrimary }: {
  width: number; height: number; player: string; matchIdx: number; brandPrimary: string
}) {
  const meta = GPS_HEATMAP_PLAYERS.find(p => p.name === player)
  const cluster = (() => {
    switch (meta?.position) {
      case 'LB': return { x: 0.22, y: 0.2, spread: 0.18 }
      case 'RB': return { x: 0.22, y: 0.8, spread: 0.18 }
      case 'CB': return { x: 0.18, y: 0.5, spread: 0.14 }
      case 'CM': return { x: 0.5, y: 0.5, spread: 0.22 }
      case 'CDM': return { x: 0.34, y: 0.5, spread: 0.18 }
      case 'LW': return { x: 0.74, y: 0.22, spread: 0.18 }
      case 'RW': return { x: 0.74, y: 0.78, spread: 0.18 }
      case 'ST':
      case 'CF': return { x: 0.82, y: 0.5, spread: 0.16 }
      default: return { x: 0.5, y: 0.5, spread: 0.2 }
    }
  })()
  const touches = 48
  const dots: { x: number; y: number; r: number }[] = []
  for (let i = 0; i < touches; i++) {
    const a = hashAt(`${player}-tm-${matchIdx}-${i}-a`, 11) * Math.PI * 2
    const r = hashAt(`${player}-tm-${matchIdx}-${i}-r`, 13) * cluster.spread
    const x = (cluster.x + Math.cos(a) * r) * width
    const y = (cluster.y + Math.sin(a) * r) * height
    dots.push({ x, y, r: 2.5 + hashAt(`${player}-tm-${matchIdx}-${i}-s`, 19) * 2.5 })
  }
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxHeight: 360 }}>
      <FootballPitch width={width} height={height} />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={brandPrimary} opacity={0.75} stroke="white" strokeOpacity={0.35} strokeWidth={0.6} />
      ))}
    </svg>
  )
}

function ZoneThirdsMap({ width, height, player, matchIdx }: {
  width: number; height: number; player: string; matchIdx: number
}) {
  const meta = GPS_HEATMAP_PLAYERS.find(p => p.name === player)
  // Skew thirds by role
  const baseDef = (() => {
    if (meta?.group === 'Defenders') return 58
    if (meta?.group === 'Midfielders') return 32
    return 12
  })()
  const baseAtt = (() => {
    if (meta?.group === 'Forwards') return 56
    if (meta?.group === 'Midfielders') return 30
    return 10
  })()
  const noise = Math.round((hashAt(`${player}-zt-${matchIdx}`, 23) - 0.5) * 8)
  const def = Math.max(5, Math.min(80, baseDef + noise))
  const att = Math.max(5, Math.min(80, baseAtt - noise))
  const mid = Math.max(5, 100 - def - att)
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxHeight: 320 }}>
      <FootballPitch width={width} height={height} />
      <rect x={0} y={0} width={width / 3} height={height} fill={heatColor(def / 80)} opacity={0.45} />
      <rect x={width / 3} y={0} width={width / 3} height={height} fill={heatColor(mid / 80)} opacity={0.45} />
      <rect x={(width / 3) * 2} y={0} width={width / 3} height={height} fill={heatColor(att / 80)} opacity={0.45} />
      <text x={width / 6} y={height / 2 + 6} textAnchor="middle" fontSize={28} fontWeight={800} fill="white" opacity={0.92}>{def}%</text>
      <text x={width / 2} y={height / 2 + 6} textAnchor="middle" fontSize={28} fontWeight={800} fill="white" opacity={0.92}>{mid}%</text>
      <text x={(width / 6) * 5} y={height / 2 + 6} textAnchor="middle" fontSize={28} fontWeight={800} fill="white" opacity={0.92}>{att}%</text>
      <text x={width / 6} y={height - 10} textAnchor="middle" fontSize={9} fill="white" opacity={0.55}>DEFENSIVE</text>
      <text x={width / 2} y={height - 10} textAnchor="middle" fontSize={9} fill="white" opacity={0.55}>MIDDLE</text>
      <text x={(width / 6) * 5} y={height - 10} textAnchor="middle" fontSize={9} fill="white" opacity={0.55}>ATTACKING</text>
    </svg>
  )
}

function SprintPathOverlay({ width, height, player, matchIdx, brandSecondary }: {
  width: number; height: number; player: string; matchIdx: number; brandSecondary: string
}) {
  const sprintCount = 8 + Math.floor(hashAt(`${player}-sp-${matchIdx}`, 29) * 6)
  const sprints: { x1: number; y1: number; x2: number; y2: number; speed: number }[] = []
  for (let i = 0; i < sprintCount; i++) {
    const sx = hashAt(`${player}-sp-${matchIdx}-${i}-x`, 31)
    const sy = hashAt(`${player}-sp-${matchIdx}-${i}-y`, 37)
    const ex = sx + (hashAt(`${player}-sp-${matchIdx}-${i}-dx`, 41) - 0.5) * 0.5
    const ey = sy + (hashAt(`${player}-sp-${matchIdx}-${i}-dy`, 43) - 0.5) * 0.4
    sprints.push({
      x1: sx * width,
      y1: sy * height,
      x2: Math.max(8, Math.min(width - 8, ex * width)),
      y2: Math.max(8, Math.min(height - 8, ey * height)),
      speed: 0.5 + hashAt(`${player}-sp-${matchIdx}-${i}-s`, 47) * 0.5,
    })
  }
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxHeight: 320 }}>
      <FootballPitch width={width} height={height} />
      {sprints.map((s, i) => (
        <g key={i}>
          <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={heatColor(s.speed)} strokeWidth={2.2} strokeLinecap="round" opacity={0.85} />
          <circle cx={s.x2} cy={s.y2} r={3.2} fill={brandSecondary} stroke={heatColor(s.speed)} strokeWidth={1.5} />
        </g>
      ))}
    </svg>
  )
}

function HighIntensityZones({ width, height, sessionIdx }: { width: number; height: number; sessionIdx: number }) {
  const W = width, H = height
  const blobs: { cx: number; cy: number; r: number; t: number }[] = []
  for (let i = 0; i < 16; i++) {
    blobs.push({
      cx: hashAt(`hi-${sessionIdx}-${i}-x`, 53) * W,
      cy: hashAt(`hi-${sessionIdx}-${i}-y`, 59) * H,
      r: 18 + hashAt(`hi-${sessionIdx}-${i}-r`, 61) * 38,
      t: 0.4 + hashAt(`hi-${sessionIdx}-${i}-t`, 67) * 0.6,
    })
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 320 }}>
      <defs>
        <filter id={`hi-blur-${sessionIdx}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <FootballPitch width={W} height={H} />
      <g filter={`url(#hi-blur-${sessionIdx})`}>
        {blobs.map((b, i) => (
          <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={heatColor(b.t)} opacity={0.45} />
        ))}
      </g>
    </svg>
  )
}

function WeeklyLoadCalendar({ brandPrimary, brandSecondary }: { brandPrimary: string; brandSecondary: string }) {
  void brandPrimary
  void brandSecondary
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const labels = ['Recovery', 'Tactical', 'High Intensity', 'S&C', "Captain's Run", 'MATCH', 'Off']
  // Authentic football week microcycle: peak Wed, MD-1 (Fri) light, match Sat
  const intensities = [0.18, 0.62, 0.92, 0.45, 0.3, 1.0, 0.05]
  const distances = [3.2, 7.4, 9.8, 5.1, 4.0, 11.2, 0]
  const loads = [320, 740, 1140, 560, 420, 1410, 0]
  const cellW = 100 / 7
  return (
    <svg viewBox="0 0 700 200" width="100%" style={{ maxHeight: 220 }}>
      <rect width={700} height={200} fill="#0d1117" rx={8} />
      {days.map((d, i) => {
        const x = i * (700 / 7)
        const w = 700 / 7 - 6
        return (
          <g key={d}>
            <rect x={x + 3} y={28} width={w} height={150} rx={6}
              fill={heatColor(intensities[i])} opacity={0.18 + intensities[i] * 0.55} />
            <rect x={x + 3} y={28} width={w} height={150} rx={6}
              fill="none" stroke={heatColor(intensities[i])} strokeOpacity={0.6} strokeWidth={1} />
            <text x={x + (700 / 7) / 2} y={20} textAnchor="middle" fontSize={11} fontWeight={700} fill="rgba(255,255,255,0.7)">{d}</text>
            <text x={x + (700 / 7) / 2} y={62} textAnchor="middle" fontSize={10} fill="white" opacity={0.85}>{labels[i]}</text>
            <text x={x + (700 / 7) / 2} y={110} textAnchor="middle" fontSize={26} fontWeight={800} fill="white">{loads[i]}</text>
            <text x={x + (700 / 7) / 2} y={128} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.6)">AU load</text>
            <text x={x + (700 / 7) / 2} y={158} textAnchor="middle" fontSize={11} fontWeight={600} fill="white" opacity={0.9}>{distances[i] > 0 ? `${distances[i]} km` : '—'}</text>
          </g>
        )
      })}
      <text x={4} y={195} fontSize={9} fill="rgba(255,255,255,0.4)">Squad average · 7-day rolling intensity</text>
      <text x={696} y={195} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.4)">Cell colour = relative session intensity</text>
      <line x1={0} y1={0} x2={cellW} y2={0} stroke="transparent" />
    </svg>
  )
}

function SpeedZoneBars({ player, brandPrimary }: { player: string; brandPrimary: string }) {
  void brandPrimary
  const meta = GPS_HEATMAP_PLAYERS.find(p => p.name === player)
  // Default split adjusted by group
  const base = meta?.group === 'Forwards'
    ? [10, 22, 28, 24, 16]
    : meta?.group === 'Defenders'
    ? [16, 30, 28, 18, 8]
    : [12, 26, 30, 20, 12]
  const noise = (i: number) => Math.round((hashAt(`${player}-sz-${i}`, 71) - 0.5) * 6)
  const dist = base.map((v, i) => Math.max(2, v + noise(i)))
  const total = dist.reduce((a, b) => a + b, 0)
  const pct = dist.map(v => (v / total) * 100)
  const labels = ['Stand 0–2 km/h', 'Walk 2–7', 'Jog 7–14', 'Run 14–20', 'Sprint 20+']
  const colors = [HEAT_STOPS[0], HEAT_STOPS[1], HEAT_STOPS[2], HEAT_STOPS[3], HEAT_STOPS[4]]
  const W = 700, BAR_H = 30, GAP = 14
  const totalH = labels.length * (BAR_H + GAP) + 16
  return (
    <svg viewBox={`0 0 ${W} ${totalH}`} width="100%" style={{ maxHeight: totalH + 8 }}>
      {labels.map((label, i) => {
        const y = 8 + i * (BAR_H + GAP)
        const barW = (pct[i] / 100) * (W - 220)
        return (
          <g key={label}>
            <text x={4} y={y + BAR_H / 2 + 4} fontSize={11} fontWeight={600} fill="rgba(255,255,255,0.85)">{label}</text>
            <rect x={150} y={y} width={W - 220} height={BAR_H} rx={4} fill="rgba(255,255,255,0.04)" />
            <rect x={150} y={y} width={barW} height={BAR_H} rx={4} fill={colors[i]} opacity={0.85} />
            <text x={150 + barW + 8} y={y + BAR_H / 2 + 4} fontSize={11} fontWeight={700} fill="white">
              {pct[i].toFixed(1)}% · {(dist[i] * 0.13).toFixed(2)} km
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function TopSpeedScatter({ brandPrimary }: { brandPrimary: string }) {
  const players = GPS_HEATMAP_PLAYERS
  const W = 700, H = 240, padL = 36, padB = 28
  const minSpeed = 24, maxSpeed = 34
  const points = players.flatMap((p, pi) => {
    return Array.from({ length: 6 }, (_, si) => {
      const session = si
      const baseSpeed = p.group === 'Forwards' ? 31 : p.group === 'Midfielders' ? 29 : 28.5
      const v = baseSpeed + (hashAt(`${p.name}-ts-${si}`, 79) - 0.5) * 4
      const clamped = Math.max(minSpeed, Math.min(maxSpeed, v))
      const x = padL + (session / 5) * (W - padL - 16)
      const y = H - padB - ((clamped - minSpeed) / (maxSpeed - minSpeed)) * (H - padB - 16)
      return { x, y, v: clamped, group: p.group, pi, si }
    })
  })
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 280 }}>
      <rect width={W} height={H} fill="#0d1117" rx={6} />
      {/* Y axis ticks */}
      {[24, 26, 28, 30, 32, 34].map(v => {
        const y = H - padB - ((v - minSpeed) / (maxSpeed - minSpeed)) * (H - padB - 16)
        return (
          <g key={v}>
            <line x1={padL} y1={y} x2={W - 8} y2={y} stroke="rgba(255,255,255,0.06)" />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.45)">{v}</text>
          </g>
        )
      })}
      {/* X axis labels */}
      {['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map((s, i) => {
        const x = padL + (i / 5) * (W - padL - 16)
        return <text key={s} x={x} y={H - 8} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.5)">{s}</text>
      })}
      <text x={padL - 30} y={14} fontSize={10} fill="rgba(255,255,255,0.6)" fontWeight={700}>km/h</text>
      {points.map((p, i) => {
        const norm = (p.v - minSpeed) / (maxSpeed - minSpeed)
        return (
          <circle key={i} cx={p.x + (p.pi % 5) * 1.2 - 3} cy={p.y} r={3.6}
            fill={heatColor(norm)} stroke={brandPrimary} strokeOpacity={0.4} strokeWidth={0.6} opacity={0.85} />
        )
      })}
    </svg>
  )
}

function AccelDecelMap({ width, height }: { width: number; height: number }) {
  const W = width, H = height
  const events = Array.from({ length: 24 }, (_, i) => ({
    x: hashAt(`accel-${i}-x`, 83) * W,
    y: hashAt(`accel-${i}-y`, 89) * H,
    accel: hashAt(`accel-${i}-a`, 97) > 0.5,
    intensity: 0.4 + hashAt(`accel-${i}-int`, 101) * 0.6,
  }))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 320 }}>
      <FootballPitch width={W} height={H} />
      {events.map((e, i) => (
        <g key={i}>
          <circle cx={e.x} cy={e.y} r={6 + e.intensity * 6} fill={heatColor(e.intensity)} opacity={0.25} />
          <polygon
            points={e.accel
              ? `${e.x},${e.y - 5} ${e.x - 4},${e.y + 4} ${e.x + 4},${e.y + 4}`
              : `${e.x},${e.y + 5} ${e.x - 4},${e.y - 4} ${e.x + 4},${e.y - 4}`}
            fill={e.accel ? '#22C55E' : '#EF4444'}
            stroke="white" strokeOpacity={0.3} strokeWidth={0.6}
          />
        </g>
      ))}
    </svg>
  )
}

function GPSHeatmapsView() {
  const [brandPrimary, setBrandPrimary] = useState('#003DA5')
  const [brandSecondary, setBrandSecondary] = useState('#F1C40F')
  const [matchIdx, setMatchIdx] = useState(0)
  const [selectedPlayer, setSelectedPlayer] = useState(GPS_HEATMAP_PLAYERS[0].name)
  const [trainingIdx, setTrainingIdx] = useState(0)
  const [compareSessionA, setCompareSessionA] = useState(0)
  const [compareSessionB, setCompareSessionB] = useState(1)
  const [comparePlayers, setComparePlayers] = useState<string[]>([
    GPS_HEATMAP_PLAYERS[0].name,
    GPS_HEATMAP_PLAYERS[4].name,
    GPS_HEATMAP_PLAYERS[8].name,
    GPS_HEATMAP_PLAYERS[9].name,
  ])

  useEffect(() => {
    try {
      const p = localStorage.getItem('lumio_football_brand_primary')
      const s = localStorage.getItem('lumio_football_brand_secondary')
      if (p) setBrandPrimary(p)
      if (s) setBrandSecondary(s)
    } catch { /* localStorage may be unavailable */ }
  }, [])

  const PW = 600, PH = 380
  const PW_S = 360, PH_S = 230

  const Section = ({ title, subtitle, children, accentColor }: { title: string; subtitle?: string; children: React.ReactNode; accentColor?: string }) => (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: accentColor || brandPrimary }}>{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="hidden md:flex items-center gap-3 text-[10px] text-gray-500">
          <span className="uppercase tracking-wider">Heat scale</span>
          <div className="flex h-2 rounded overflow-hidden border border-gray-800" style={{ width: 220 }}>
            {HEAT_STOPS.map(c => <div key={c} style={{ flex: 1, background: c }} />)}
          </div>
          <span className="text-gray-500">low → high</span>
        </div>
      </div>
      {children}
    </section>
  )

  const Card = ({ title, subtitle, children }: { title?: string; subtitle?: string; children: React.ReactNode }) => (
    <div className="rounded-xl p-4 border" style={{ background: '#0d1117', borderColor: '#1F2937' }}>
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <div className="text-sm font-semibold text-white">{title}</div>}
          {subtitle && <div className="text-[11px] text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
      )}
      {children}
    </div>
  )

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${brandPrimary}, ${brandSecondary})` }}>
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">GPS Heatmaps</h1>
              <p className="text-xs text-gray-400 mt-0.5">Spatial movement analysis across matches, training, and the season — squad and individual.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="px-2 py-1 rounded-full font-bold uppercase tracking-wider"
            style={{ background: `${brandPrimary}20`, color: brandPrimary, border: `1px solid ${brandPrimary}50` }}>
            10Hz GPS
          </span>
          <span className="px-2 py-1 rounded-full font-bold uppercase tracking-wider"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.4)' }}>
            Live · synced 12 min ago
          </span>
        </div>
      </div>

      {/* ─── 1. MATCH HEATMAPS ─────────────────────────────────────── */}
      <Section title="1 · Match Heatmaps" subtitle="Match-day positional intelligence — who covered which space, where they touched the ball, and what they did under load.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">Player</label>
            <div className="flex flex-wrap gap-1">
              {GPS_HEATMAP_PLAYERS.map(p => (
                <button key={p.name} onClick={() => setSelectedPlayer(p.name)}
                  className="px-2.5 py-1 rounded text-[11px] font-medium transition-all border"
                  style={selectedPlayer === p.name
                    ? { background: brandPrimary, color: 'white', borderColor: brandPrimary }
                    : { background: '#0d1117', color: '#9CA3AF', borderColor: '#1F2937' }}>
                  {p.name} <span className="opacity-60">· {p.position}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">Match</label>
            <select value={matchIdx} onChange={e => setMatchIdx(Number(e.target.value))}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              style={{ borderColor: '#1F2937' }}>
              {GPS_HEATMAP_MATCHES.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Positional Heatmap" subtitle={`${selectedPlayer} — full pitch density`}>
            <PositionalHeatmap width={PW} height={PH} player={selectedPlayer} matchIdx={matchIdx} />
          </Card>
          <Card title="Touch Map" subtitle="Every ball touch logged by GPS-synced event data">
            <TouchMap width={PW} height={PH} player={selectedPlayer} matchIdx={matchIdx} brandPrimary={brandPrimary} />
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Defensive vs Attacking Thirds" subtitle="% of total time spent in each third of the pitch">
            <ZoneThirdsMap width={PW} height={PH * 0.8} player={selectedPlayer} matchIdx={matchIdx} />
          </Card>
          <Card title="Sprint Path Overlay" subtitle="High-speed runs (>20 km/h) — colour = peak speed">
            <SprintPathOverlay width={PW} height={PH * 0.8} player={selectedPlayer} matchIdx={matchIdx} brandSecondary={brandSecondary} />
          </Card>
        </div>
      </Section>

      {/* ─── 2. TRAINING HEATMAPS ──────────────────────────────────── */}
      <Section title="2 · Training Heatmaps" subtitle="Session-level distribution and weekly load microcycle." accentColor={brandSecondary}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">Session</label>
            <select value={trainingIdx} onChange={e => setTrainingIdx(Number(e.target.value))}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white">
              {GPS_HEATMAP_TRAINING.map((t, i) => <option key={t} value={i}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Session Movement Heatmap" subtitle={`${GPS_HEATMAP_TRAINING[trainingIdx]} — squad aggregate`}>
            <PositionalHeatmap width={PW} height={PH} player="Liam Barker" matchIdx={trainingIdx + 100} intensity={0.85} />
          </Card>
          <Card title="High-Intensity Zones" subtitle="Sprints + accelerations density (≥3 m/s²)">
            <HighIntensityZones width={PW} height={PH} sessionIdx={trainingIdx} />
          </Card>
        </div>

        <Card title="Session vs Session Comparison" subtitle="Side-by-side movement footprint">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <select value={compareSessionA} onChange={e => setCompareSessionA(Number(e.target.value))}
              className="w-full bg-[#0a0c12] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white">
              {GPS_HEATMAP_TRAINING.map((t, i) => <option key={t} value={i}>{t}</option>)}
            </select>
            <select value={compareSessionB} onChange={e => setCompareSessionB(Number(e.target.value))}
              className="w-full bg-[#0a0c12] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white">
              {GPS_HEATMAP_TRAINING.map((t, i) => <option key={t} value={i}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] text-gray-500 mb-1">{GPS_HEATMAP_TRAINING[compareSessionA]}</div>
              <PositionalHeatmap width={PW_S} height={PH_S} player="Connor Walsh" matchIdx={compareSessionA + 200} intensity={0.85} />
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-1">{GPS_HEATMAP_TRAINING[compareSessionB]}</div>
              <PositionalHeatmap width={PW_S} height={PH_S} player="Connor Walsh" matchIdx={compareSessionB + 200} intensity={0.85} />
            </div>
          </div>
        </Card>

        <Card title="Weekly Load Calendar" subtitle="7-day microcycle — match Saturday">
          <WeeklyLoadCalendar brandPrimary={brandPrimary} brandSecondary={brandSecondary} />
        </Card>
      </Section>

      {/* ─── 3. SPEED & INTENSITY ZONES ────────────────────────────── */}
      <Section title="3 · Speed & Intensity Zones" subtitle="How distance, speed and accel/decel events distribute across the squad.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Distance by Speed Zone" subtitle={`${selectedPlayer} — match average across last 5`}>
            <SpeedZoneBars player={selectedPlayer} brandPrimary={brandPrimary} />
          </Card>
          <Card title="Top Speed Distribution" subtitle="All squad members across last 6 sessions">
            <TopSpeedScatter brandPrimary={brandPrimary} />
          </Card>
        </div>
        <Card title="Acceleration & Deceleration Map" subtitle="Where high-magnitude accel (▲ green) and decel (▼ red) events happen on the pitch">
          <AccelDecelMap width={PW} height={PH * 0.7} />
        </Card>
      </Section>

      {/* ─── 4. SQUAD COMPARISON ───────────────────────────────────── */}
      <Section title="4 · Squad Comparison" subtitle="Up to 4 players side-by-side — grouped by role.">
        <Card>
          <div className="mb-3">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Comparing 4 players (click a slot to change)</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {comparePlayers.map((p, slot) => (
                <select key={slot} value={p}
                  onChange={e => {
                    const next = [...comparePlayers]
                    next[slot] = e.target.value
                    setComparePlayers(next)
                  }}
                  className="w-full bg-[#0a0c12] border border-gray-800 rounded-lg px-2 py-1.5 text-[11px] text-white">
                  {GPS_HEATMAP_PLAYERS.map(pl => <option key={pl.name} value={pl.name}>{pl.name} · {pl.position}</option>)}
                </select>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {comparePlayers.map((p, slot) => {
              const meta = GPS_HEATMAP_PLAYERS.find(pl => pl.name === p)
              return (
                <div key={`${p}-${slot}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-white">{p}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                      style={{ background: `${brandPrimary}25`, color: brandPrimary }}>
                      {meta?.position}
                    </span>
                  </div>
                  <div className="text-[9px] text-gray-500 mb-1">{meta?.group}</div>
                  <PositionalHeatmap width={300} height={190} player={p} matchIdx={matchIdx} />
                </div>
              )
            })}
          </div>
        </Card>

        <Card title="Position Group Aggregates" subtitle="Combined heat for each role group">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['Defenders', 'Midfielders', 'Forwards'] as const).map(group => {
              const groupAnchor = GPS_HEATMAP_PLAYERS.find(p => p.group === group)?.name ?? GPS_HEATMAP_PLAYERS[0].name
              return (
                <div key={group}>
                  <div className="text-[11px] font-bold text-white mb-1" style={{ color: brandSecondary }}>{group}</div>
                  <PositionalHeatmap width={400} height={250} player={groupAnchor} matchIdx={matchIdx + 1000} intensity={0.95} />
                </div>
              )
            })}
          </div>
        </Card>
      </Section>

      {/* ─── 5. SEASON OVERVIEW ────────────────────────────────────── */}
      <Section title="5 · Season Overview" subtitle="Trend grids and home/away differentials across the campaign.">
        <Card title="Rolling 10-Match Load Grid" subtitle="Rows = players · columns = last 10 matches · cell colour = relative load (AU)">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr>
                  <th className="text-left p-1.5 text-gray-500 font-semibold">Player</th>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <th key={i} className="p-1.5 text-gray-500 font-semibold">M{i + 1}</th>
                  ))}
                  <th className="p-1.5 text-gray-400 font-semibold">Avg</th>
                </tr>
              </thead>
              <tbody>
                {GPS_HEATMAP_PLAYERS.map(p => {
                  const cells = Array.from({ length: 10 }, (_, i) => {
                    const baseRange = p.group === 'Forwards' ? [0.55, 0.95] : p.group === 'Midfielders' ? [0.6, 0.98] : [0.5, 0.85]
                    const t = baseRange[0] + hashAt(`${p.name}-rolling-${i}`, 103) * (baseRange[1] - baseRange[0])
                    return t
                  })
                  const avg = cells.reduce((a, b) => a + b, 0) / cells.length
                  return (
                    <tr key={p.name} className="border-t border-gray-900">
                      <td className="p-1.5 text-white whitespace-nowrap">
                        {p.name} <span className="text-gray-600">· {p.position}</span>
                      </td>
                      {cells.map((t, i) => (
                        <td key={i} className="p-0.5">
                          <div className="rounded text-center font-bold text-white"
                            style={{
                              background: heatColor(t),
                              opacity: 0.45 + t * 0.5,
                              padding: '6px 0',
                              minWidth: 28,
                              fontSize: 10,
                            }}>
                            {Math.round(800 + t * 800)}
                          </div>
                        </td>
                      ))}
                      <td className="p-0.5">
                        <div className="rounded text-center font-bold text-white"
                          style={{
                            background: heatColor(avg),
                            opacity: 0.6 + avg * 0.4,
                            padding: '6px 0',
                            minWidth: 36,
                            fontSize: 10,
                            border: '1px solid rgba(255,255,255,0.2)',
                          }}>
                          {Math.round(800 + avg * 800)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Home vs Away Positional Difference" subtitle="Δ density — which zones each side of the squad covers more away vs home">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] mb-1 font-semibold" style={{ color: brandPrimary }}>Home — squad average</div>
              <PositionalHeatmap width={PW_S + 60} height={PH_S + 30} player="Liam Barker" matchIdx={500} intensity={0.95} />
            </div>
            <div>
              <div className="text-[11px] mb-1 font-semibold" style={{ color: brandSecondary }}>Away — squad average</div>
              <PositionalHeatmap width={PW_S + 60} height={PH_S + 30} player="Liam Barker" matchIdx={501} intensity={0.78} />
            </div>
          </div>
          <div className="grid grid-cols-3 mt-4 gap-3 text-[11px]">
            <div className="rounded-lg p-3 border" style={{ borderColor: '#1F2937', background: '#0a0c12' }}>
              <div className="text-gray-500 uppercase tracking-wider text-[9px]">Home territory</div>
              <div className="text-white text-xl font-black">+8.4%</div>
              <div className="text-gray-400">more time in opp half at home</div>
            </div>
            <div className="rounded-lg p-3 border" style={{ borderColor: '#1F2937', background: '#0a0c12' }}>
              <div className="text-gray-500 uppercase tracking-wider text-[9px]">Defensive shape (away)</div>
              <div className="text-white text-xl font-black">−12 m</div>
              <div className="text-gray-400">deeper defensive line away</div>
            </div>
            <div className="rounded-lg p-3 border" style={{ borderColor: '#1F2937', background: '#0a0c12' }}>
              <div className="text-gray-500 uppercase tracking-wider text-[9px]">Sprint volume</div>
              <div className="text-white text-xl font-black">+14%</div>
              <div className="text-gray-400">higher away (more transitions)</div>
            </div>
          </div>
        </Card>
      </Section>

      <div className="text-[10px] text-gray-700 text-center pt-2">
        GPS data sourced from Lumio GPS · 10Hz sampling · Demo data shown — connect Johan Sports or import via CSV for live feed
      </div>
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
          ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}>
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
                { day: 'Sat', am: 'MATCHDAY', pm: '—', intensity: '—', focus: 'Eastcliff Town' },
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
                const loadColor = g.load === 'optimal' ? '#22C55E' : g.load === 'high' ? '#F59E0B' : '#EF4444'
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
          ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}>
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
                const statusColor = c.status === 'Offered' ? '#3B82F6' : c.status === 'Negotiating' ? '#F59E0B' : '#6B7280'
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
          ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}>
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
                { name: 'Johnnie Jackson', role: 'Head Coach', dept: 'Coaching', quals: 'UEFA Pro', status: 'Available' },
                { name: 'Assistant Manager', role: 'Assistant Manager', dept: 'Coaching', quals: 'UEFA A', status: 'Available' },
                { name: 'Goalkeeping Coach', role: 'GK Coach', dept: 'Coaching', quals: 'UEFA Pro (in progress)', status: 'Course Mon-Wed' },
                { name: 'First Team Analyst', role: 'Performance Analyst', dept: 'Analytics', quals: 'MSc Data Science', status: 'Available' },
                { name: 'Head Physio', role: 'Head Physio', dept: 'Medical', quals: 'MSc Sports Med', status: 'Available' },
                { name: 'Team Doctor', role: 'Club Doctor', dept: 'Medical', quals: 'MBBS, MRCGP', status: 'Available' },
                { name: 'Fitness Coach', role: 'Fitness Coach', dept: 'Coaching', quals: 'BSc S&C', status: 'Available' },
                { name: 'Chief Scout', role: 'Chief Scout', dept: 'Scouting', quals: 'UEFA B', status: 'Scouting trip' },
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
          { name: 'Goalkeeping Coach', dates: '28-30 Mar', reason: 'UEFA Pro Licence course', cover: 'Assistant Manager' },
          { name: 'Head Physio', dates: '14-18 Apr', reason: 'Annual leave', cover: 'Team Doctor' },
          { name: 'Chief Scout', dates: '25-29 Mar', reason: 'Scouting trip', cover: 'Head of Recruitment' },
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
          ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}>
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
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', desc: 'Mature & reassuring — your daily motivator' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', desc: 'Deep & comforting — reassuring and steady' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', desc: 'Bright & energetic — upbeat and clear' },
]

// ─── Social Media View ──────────────────────────────────────────────────────

const SOCIAL_MENTIONS = [
  { user: '@LumioSportsFan92', content: 'Great performance from Lumio Sports FC last night! Morris was incredible ⚽🔥', time: '2 min ago', likes: 847, sentiment: 'positive' as const },
  { user: '@SportsBlogger', content: 'Hearing Lumio Sports FC are close to signing a new winger — big move if true 👀', time: '15 min ago', likes: 234, sentiment: 'neutral' as const },
  { user: '@LocalFan', content: 'Season ticket renewed. Can\'t wait for Saturday. Come on Lumio Sports! 🔴', time: '32 min ago', likes: 45, sentiment: 'positive' as const },
  { user: '@League1News', content: 'Lumio Sports FC move up to 14th after beating Eastcliff Town. Solid showing.', time: '1 hr ago', likes: 1240, sentiment: 'positive' as const },
  { user: '@TacticsBoard', content: 'Porter\'s pass map vs Eastcliff Town was elite. 92% accuracy, 4 key passes.', time: '2 hrs ago', likes: 312, sentiment: 'positive' as const },
  { user: '@DisappointedFan', content: 'Still think we need a proper left-back. Davies isn\'t good enough for this level.', time: '3 hrs ago', likes: 89, sentiment: 'negative' as const },
  { user: '@YouthFootball', content: 'Academy Player (17) training with Lumio Sports first team today. One to watch 🌟', time: '4 hrs ago', likes: 567, sentiment: 'positive' as const },
  { user: '@TransferWatch', content: 'Lumio Sports FC have reportedly tracked a League One winger. Clubs circling.', time: '5 hrs ago', likes: 1890, sentiment: 'neutral' as const },
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
  { day: 'Wed', time: '12pm', content: 'Player spotlight — Morris', platforms: 'All' },
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
      <div><h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Social Media Hub</h2><p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Everything the world is saying about Lumio Sports FC</p></div>

      <div className="flex items-center gap-2 flex-wrap">
        {[{ l: 'Create Post', i: Plus }, { l: 'Schedule Content', i: Calendar }, { l: 'Analytics Report', i: BarChart3 }, { l: 'Set Up Alerts', i: Bell }, { l: 'Reply to Mentions', i: MessageSquare }].map(a => (
          <button key={a.l} onClick={() => socAction(a.l)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}><a.i size={12} />{a.l}</button>
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
    { name: 'Dean Morris', overall: 9, morale: 9, training: 8, playingTime: 9, contract: 8, form: 9, risk: 'Low' },
    { name: 'Sam Porter', overall: 8, morale: 8, training: 9, playingTime: 7, contract: 8, form: 8, risk: 'Low' },
    { name: 'Chris Nwosu', overall: 7, morale: 7, training: 8, playingTime: 6, contract: 7, form: 8, risk: 'Low' },
    { name: 'Tom Fletcher', overall: 7, morale: 7, training: 7, playingTime: 8, contract: 5, form: 7, risk: 'Medium' },
    { name: 'Liam Barker', overall: 4, morale: 4, training: 5, playingTime: 2, contract: 6, form: 3, risk: 'High' },
    { name: 'Connor Walsh', overall: 5, morale: 6, training: 7, playingTime: 5, contract: 3, form: 5, risk: 'High' },
    { name: 'Paul Granger', overall: 5, morale: 4, training: 6, playingTime: 5, contract: 7, form: 3, risk: 'Medium' },
  ]

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Dressing Room Intelligence</h2><p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Squad harmony, morale and player wellbeing</p></div>

      <div className="flex items-center gap-2 flex-wrap">
        {[{ l: 'Team Meeting', i: Users }, { l: 'Player Chat', i: MessageSquare }, { l: 'Issue Fine', i: AlertCircle }, { l: 'Set Mentoring', i: Heart }, { l: 'Code of Conduct', i: Shield }, { l: 'Atmosphere Report', i: BarChart3 }].map(a => (
          <button key={a.l} onClick={() => action(a.l)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}><a.i size={12} />{a.l}</button>
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
        <tbody>{[{ p: 'Dean Morris', o: 'Late to training', d: '12 Mar', pun: 'Verbal warning', s: 'Resolved' },{ p: 'Liam Barker', o: 'Missed training session', d: '18 Mar', pun: 'Fine: £500', s: 'Active' },{ p: 'Connor Walsh', o: 'Yellow card accumulation', d: '22 Mar', pun: '1-match suspension', s: 'Active' }].map(r => <tr key={r.p} style={{ borderBottom: '1px solid #1F2937' }}><td className="px-3 py-2 font-medium" style={{ color: '#F9FAFB' }}>{r.p}</td><td className="px-3 py-2" style={{ color: '#9CA3AF' }}>{r.o}</td><td className="px-3 py-2" style={{ color: '#9CA3AF' }}>{r.d}</td><td className="px-3 py-2" style={{ color: '#9CA3AF' }}>{r.pun}</td><td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: r.s === 'Active' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)', color: r.s === 'Active' ? '#EF4444' : '#22C55E' }}>{r.s}</span></td></tr>)}</tbody></table>
      </div>

      {socToast && <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: '#003DA5', color: '#F1C40F' }}>{socToast}</div>}
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
        {[{ l: 'Add Target', i: Plus }, { l: 'Save Plan', i: Check }, { l: 'Export to Board', i: FileText }, { l: 'Reset', i: X }, { l: 'Age Profile', i: BarChart3 }, { l: 'Recruitment Priorities', i: Target }].map(a => (
          <button key={a.l} onClick={() => spAction(a.l)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: '#002D7A', color: '#F1C40F' }}><a.i size={12} />{a.l}</button>
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

function SettingsView({ isDemo = false, slug = '', clubLogo, onLogoUpload, onLogoRemove }: { isDemo?: boolean; slug?: string; clubLogo?: string | null; onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void; onLogoRemove?: () => void }) {
  const [ttsOn, setTtsOn] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_tts_enabled') !== 'false' : true)
  const [activeVoice, setActiveVoice] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_tts_voice') || 'EXAVITQu4vr4xnSDxMaL' : 'EXAVITQu4vr4xnSDxMaL')
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

      {/* ── Club Details ──────────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Club</p>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Club name</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'My Club'}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Stadium</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>—</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>League</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>—</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Season</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>2025-26</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Plan</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Lumio Football</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Status</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>Active</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Billing</span>
            <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: '#60A5FA', border: '1px solid rgba(0,61,165,0.3)' }}>Manage billing</button>
          </div>
        </div>
      </div>

      {/* ── Football-Specific Settings ────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Football Configuration</p>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="flex items-center justify-between px-5 py-3">
            <div><p className="text-sm" style={{ color: '#F9FAFB' }}>API-Football Team ID</p><p className="text-xs" style={{ color: '#6B7280' }}>For live fixture and stats data</p></div>
            <input type="number" placeholder="e.g. 42" className="text-sm rounded-lg px-3 py-1.5 outline-none w-28 text-right" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }} />
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <div><p className="text-sm" style={{ color: '#F9FAFB' }}>GPS Hardware Provider</p><p className="text-xs" style={{ color: '#6B7280' }}>Player tracking system</p></div>
            <select className="text-sm rounded-lg px-3 py-1.5 outline-none" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }}>
              <option>None</option><option>Johan Sports (recommended)</option><option>CSV Upload (manual)</option>
            </select>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <div><p className="text-sm" style={{ color: '#F9FAFB' }}>Home kit — primary colour</p></div>
            <input type="color" defaultValue="#003DA5" className="w-10 h-8 rounded cursor-pointer" style={{ border: '1px solid #374151' }} />
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <div><p className="text-sm" style={{ color: '#F9FAFB' }}>Home kit — secondary colour</p></div>
            <input type="color" defaultValue="#F1C40F" className="w-10 h-8 rounded cursor-pointer" style={{ border: '1px solid #374151' }} />
          </div>
        </div>
      </div>

      {/* ── Integrations ──────────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Integrations</p>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>DATA PROVIDERS</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { name: 'API-Football', desc: 'Live fixtures, results & stats' },
                { name: 'Lumio Data', desc: 'Advanced analytics & xG data' },
                { name: 'Lumio Scout', desc: 'Scouting reports & video' },
                { name: 'Lumio Data Pro', desc: 'Event-level match data' },
              ].map(integ => (
                <div key={integ.name} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                  <div className="min-w-0"><p className="text-sm font-medium truncate" style={{ color: '#F9FAFB' }}>{integ.name}</p><p className="text-xs truncate" style={{ color: '#6B7280' }}>{integ.desc}</p></div>
                  <button className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 ml-3" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: '#60A5FA', border: '1px solid rgba(0,61,165,0.3)' }}>Connect</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>COMMUNICATION</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { name: 'Slack', desc: 'Team messaging & alerts' },
                { name: 'Microsoft Teams', desc: 'Chat & video conferencing' },
                { name: 'Google Workspace', desc: 'Calendar, Drive & email' },
                { name: 'WhatsApp Business', desc: 'Player & agent messaging' },
              ].map(integ => (
                <div key={integ.name} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                  <div className="min-w-0"><p className="text-sm font-medium truncate" style={{ color: '#F9FAFB' }}>{integ.name}</p><p className="text-xs truncate" style={{ color: '#6B7280' }}>{integ.desc}</p></div>
                  <button className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 ml-3" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: '#60A5FA', border: '1px solid rgba(0,61,165,0.3)' }}>Connect</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Team & Staff ──────────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Team & Staff</p>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Staff members</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>1 (you)</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Pending invites</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>0</span>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-semibold mb-3" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>INVITE STAFF MEMBER</p>
            <div className="flex gap-2">
              <input placeholder="colleague@club.com" className="flex-1 text-sm rounded-lg px-3 py-2.5 outline-none" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }} />
              <select className="text-sm rounded-lg px-3 py-2.5 outline-none" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }}>
                <option>Manager</option><option>Coach</option><option>Analyst</option><option>Physio</option><option>Scout</option><option>Admin</option>
              </select>
              <button className="px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap" style={{ backgroundColor: '#003DA5', color: '#F1C40F' }}>Send Invite</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Notifications ─────────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🔔</span>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Notifications</p>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm" style={{ color: '#F9FAFB' }}>Email notifications</p><p className="text-xs" style={{ color: '#6B7280' }}>Receive match and squad updates via email</p></div>
            <ToggleButton on={true} onToggle={() => {}} />
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm" style={{ color: '#F9FAFB' }}>In-app notifications</p><p className="text-xs" style={{ color: '#6B7280' }}>Show alerts inside your Lumio dashboard</p></div>
            <ToggleButton on={true} onToggle={() => {}} />
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm" style={{ color: '#F9FAFB' }}>Weekly summary email</p><p className="text-xs" style={{ color: '#6B7280' }}>A digest of your club activity every Monday</p></div>
            <ToggleButton on={true} onToggle={() => {}} />
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm" style={{ color: '#F9FAFB' }}>Injury alerts</p><p className="text-xs" style={{ color: '#6B7280' }}>Instant notification when a player is flagged injured</p></div>
            <ToggleButton on={true} onToggle={() => {}} />
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm" style={{ color: '#F9FAFB' }}>Transfer window alerts</p><p className="text-xs" style={{ color: '#6B7280' }}>Updates on transfer targets and agent activity</p></div>
            <ToggleButton on={true} onToggle={() => {}} />
          </div>
        </div>
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

      {/* Club Badge */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Appearance</p>
        </div>
        <div className="px-5">
          <div className="flex items-center justify-between py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <div>
              <div className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Club badge</div>
              <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Shown in your portal banner. Upload or change in Settings only.</div>
            </div>
            <div className="flex items-center gap-3">
              {clubLogo ? (
                <>
                  <img src={clubLogo} alt="Club badge" className="h-10 w-10 rounded-lg object-cover" style={{ border: '1px solid #374151', backgroundColor: '#111318' }} />
                  <label className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all" style={{ backgroundColor: '#1F2937', color: '#D1D5DB', border: '1px solid #374151' }}>
                    Change
                    <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
                  </label>
                  <button onClick={onLogoRemove} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ backgroundColor: 'rgba(127,29,29,0.2)', color: '#F87171', border: '1px solid rgba(127,29,29,0.3)' }}>
                    Remove
                  </button>
                </>
              ) : (
                <label className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all" style={{ backgroundColor: '#003DA5', color: '#F1C40F' }}>
                  Upload badge
                  <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

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

// ─── Football Notifications Panel ───────────────────────────────────────────

const FB_NOTIFICATIONS = [
  { id: '1', read: false, icon: '🔴', cat: 'Transfer', title: 'Agent response received — Harvey Knibbs representation', time: '2 min ago' },
  { id: '2', read: false, icon: '🟡', cat: 'Medical', title: 'Chris Nwosu fitness test — result available', time: '1 hour ago' },
  { id: '3', read: false, icon: '🔵', cat: 'Match', title: 'Team sheet deadline — Eastcliff Town (A) · 2 hours remaining', time: '2 hours ago' },
  { id: '4', read: true, icon: '✅', cat: 'Board', title: 'PSR calculation updated — within limits', time: '3 hours ago' },
  { id: '5', read: true, icon: '🔵', cat: 'Scouting', title: 'Aaron Collins — Redmill United confirm availability to sell', time: 'Yesterday' },
  { id: '6', read: true, icon: '🟡', cat: 'Training', title: 'GPS alert — Sean O\'Brien ACWR 1.58 · rest recommended', time: 'Yesterday' },
]

function FootballNotificationsPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState(FB_NOTIFICATIONS)
  const unread = items.filter(n => !n.read).length
  return (
    <>
      <div className="fixed inset-0 z-[79]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full z-[80] flex flex-col" style={{ width: 380, backgroundColor: '#111318', borderLeft: '1px solid #1F2937', boxShadow: '-8px 0 32px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Notifications</h2>
            {unread > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>{unread}</span>}
          </div>
          <div className="flex items-center gap-3">
            {unread > 0 && <button onClick={() => setItems(p => p.map(n => ({ ...n, read: true })))} className="text-xs font-medium" style={{ color: '#0D9488' }}>Mark all read</button>}
            <button onClick={onClose} style={{ color: '#6B7280' }}><X size={18} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items.map(n => (
            <div key={n.id} onClick={() => setItems(p => p.map(x => x.id === n.id ? { ...x, read: true } : x))} className="px-5 py-4 cursor-pointer" style={{ borderBottom: '1px solid #1F2937', borderLeft: n.read ? 'none' : '3px solid #003DA5', backgroundColor: n.read ? 'transparent' : 'rgba(0,61,165,0.04)' }}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ backgroundColor: '#1F2937' }}>{n.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,61,165,0.12)', color: '#60A5FA' }}>{n.cat}</span>
                    {!n.read && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#003DA5' }} />}
                  </div>
                  <p className="text-sm font-medium" style={{ color: n.read ? '#6B7280' : '#F9FAFB' }}>{n.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#4B5563' }}>{n.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

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

const FOOTBALL_ROLES = [
  { id: 'ceo',                label: 'CEO',                       icon: '🏛️' },
  { id: 'chairman',           label: 'Chairman',                  icon: '👑' },
  { id: 'manager',            label: 'Manager / Head Coach',      icon: '🎽' },
  { id: 'director_football',  label: 'Director of Football',      icon: '📋' },
  { id: 'head_performance',   label: 'Head of Performance',       icon: '🏃' },
  { id: 'head_medical',       label: 'Head of Medical',           icon: '🏥' },
  { id: 'analyst',            label: 'Analyst / Head of Data',    icon: '📊' },
  { id: 'commercial',         label: 'Commercial Director',       icon: '💼' },
  { id: 'head_operations',    label: 'Head of Operations',        icon: '🧰' },
  { id: 'head_community',     label: 'Head of Community',         icon: '❤️' },
]

const FOOTBALL_ROLE_CONFIG: Record<string, { label: string; icon: string; accent: string; sidebar: 'all' | string[]; message: string | null }> = {
  ceo:               { label: 'CEO',                    icon: '🏛️', accent: '#003DA5', sidebar: 'all', message: null },
  chairman:          { label: 'Chairman',               icon: '👑', accent: '#7C3AED', sidebar: ['overview','insights','board','finance','psr-scr-modeller','commercial','community','discover','concussion-tracker','settings'], message: 'Strategic top-line view.' },
  manager:           { label: 'Manager / Head Coach',   icon: '🎽', accent: '#10B981', sidebar: ['overview','insights','squad','squad-planner','tactics','matchday','training','tours-camps','set-pieces','scouting','analytics','medical','concussion-tracker','discover','settings'], message: 'Operational first-team view.' },
  director_football: { label: 'Director of Football',   icon: '📋', accent: '#0EA5E9', sidebar: ['overview','insights','squad','transfers','scouting','scouting-db','academy','board','psr-scr-modeller','discover','settings'], message: 'Squad strategy and recruitment view.' },
  head_performance:  { label: 'Head of Performance',    icon: '🏃', accent: '#22C55E', sidebar: ['overview','insights','performance','gps-heatmaps','gps-hardware','training','analytics','medical','concussion-tracker','tours-camps','settings'], message: 'S&C, GPS and sport science view.' },
  head_medical:      { label: 'Head of Medical',        icon: '🏥', accent: '#DC2626', sidebar: ['overview','insights','medical','concussion-tracker','dynamics','squad','tours-camps','player-welfare','settings'], message: 'Welfare, injury and return-to-play view.' },
  analyst:           { label: 'Analyst / Head of Data', icon: '📊', accent: '#F59E0B', sidebar: ['overview','insights','matchday','lumio-vision','analytics','scouting','set-pieces','gps-heatmaps','opta','lumio-data-pro','discover','settings'], message: 'Video, opposition and performance data view.' },
  commercial:        { label: 'Commercial Director',    icon: '💼', accent: '#EC4899', sidebar: ['overview','insights','commercial','board','finance','psr-scr-modeller','media','social','community','settings'], message: 'Sponsorship, hospitality and brand view.' },
  head_operations:   { label: 'Head of Operations',     icon: '🧰', accent: '#0EA5E9', sidebar: ['overview','insights','club-operations','facilities','tours-camps','matchday','commercial','psr-scr-modeller','discover','settings'], message: 'Matchday, facilities and travel logistics view.' },
  head_community:    { label: 'Head of Community',      icon: '❤️', accent: '#F97316', sidebar: ['overview','insights','community','commercial','media','social','settings'], message: 'Foundation, schools and fan engagement view.' },
}

export default function FootballDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return (
    <SportsDemoGate
      sport="football"
      accentColor="#10B981"
      sportLabel="Football"
      defaultClubName="Lumio FC"
      roles={FOOTBALL_ROLES}
    >
      {(session) => <FootballDashboardInner slug={slug} session={session} />}
    </SportsDemoGate>
  )
}

// Slug → demo-club display name. Slugs not in this map fall through to the
// existing 'Lumio Sports FC' default (which is the passcoded demo persona).
// Same fix pattern as yesterday's founder-name leaks: the route slug is the
// source of truth for the persona, NOT a hardcoded literal.
const FOOTBALL_SLUG_CLUB_NAMES: Record<string, string> = {
  'oakridge-fc': 'Oakridge FC',
}
function defaultClubNameForSlug(slug: string): string {
  return FOOTBALL_SLUG_CLUB_NAMES[slug] ?? 'Lumio Sports FC'
}

function FootballDashboardInner({ slug, session }: { slug: string; session: SportsDemoSession }) {
  const [roleOverride, setRoleOverride] = useState<string>(session?.role || 'ceo')
  const currentRole = (roleOverride || 'ceo') as keyof typeof FOOTBALL_ROLE_CONFIG
  const roleConfig = FOOTBALL_ROLE_CONFIG[currentRole] ?? FOOTBALL_ROLE_CONFIG.ceo
  const liveSession = session ? { ...session, role: roleOverride } : session

  const [activeDept, setActiveDept] = useState<DeptId>('overview')
  const [clubName, setClubName] = useState(() => {
    const fallback = defaultClubNameForSlug(slug)
    if (typeof window !== 'undefined') {
      return localStorage.getItem('football_club_name') || fallback
    }
    return fallback
  })
  const [userName, setUserName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('football_user_name') || localStorage.getItem('workspace_user_name') || ''
    }
    return ''
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [fbNotifOpen, setFbNotifOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [isFootballDemo, setIsFootballDemo] = useState(false)
  const [fbMounted, setFbMounted] = useState(false)
  const [clubLogo, setClubLogo] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('lumio_football_logo') : null
  )

  // Live API data
  const [liveSquad, setLiveSquad] = useState<any[]|null>(null);
  const [liveFixtures, setLiveFixtures] = useState<any[]|null>(null);
  const [liveResults, setLiveResults] = useState<any[]|null>(null);
  const [liveStandings, setLiveStandings] = useState<any[]|null>(null);
  const [liveTopScorers, setLiveTopScorers] = useState<any[]|null>(null);
  const [liveInjuries, setLiveInjuries] = useState<any[]|null>(null);
  const [loadingLive, setLoadingLive] = useState<Record<string,boolean>>({});

  useEffect(() => {
    const fetchLive = async (key: string, url: string, setter: (d:any)=>void) => {
      setLoadingLive(prev => ({...prev, [key]: true}));
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const items = data?.response || data?.data || data;
          if (Array.isArray(items) && items.length > 0) setter(items);
        }
      } catch(e) { console.warn(`Failed to fetch ${key}:`, e); }
      finally { setLoadingLive(prev => ({...prev, [key]: false})); }
    };

    fetchLive('squad', '/api/football/squad?teamId=638&season=2025', setLiveSquad);
    fetchLive('fixtures', '/api/football/fixtures?teamId=638&season=2025&next=10', setLiveFixtures);
    fetchLive('results', '/api/football/fixtures?teamId=638&season=2025&last=5', setLiveResults);
    fetchLive('standings', '/api/football/standings?leagueId=41&season=2025', setLiveStandings);
    fetchLive('topscorers', '/api/football/topscorers?leagueId=41&season=2025', setLiveTopScorers);
    fetchLive('injuries', '/api/football/injuries?teamId=638&season=2025', setLiveInjuries);
  }, []);

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
      setClubLogo('/badges/oakridge_fc_crest.svg')
    } else if (!isFootballDemo && !localStorage.getItem('lumio_football_logo')) {
      setClubLogo(null)
    }
  }, [isFootballDemo])

  function fireToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

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

  function handleLogoRemove() {
    setClubLogo(null)
    localStorage.removeItem('lumio_football_logo')
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
    const actionId = LABEL_TO_ACTION[label]
    if (actionId) setActiveAction(actionId)
    else fireToast(`${label} — coming soon`)
  }

  useEffect(() => {
    const name = localStorage.getItem('football_club_name') || defaultClubNameForSlug(slug)
    const user = localStorage.getItem('football_user_name') || localStorage.getItem('workspace_user_name') || ''
    setClubName(name)
    setUserName(user)
  }, [slug])

  const deptLabel = SIDEBAR_ITEMS.find(d => d.id === activeDept)?.label || 'Overview'
  const initials = userName ? userName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'FC'

  if (!fbMounted) return null

  return (
    <div className="flex flex-col" style={{ backgroundColor: '#07080F', color: '#F9FAFB', minHeight: '100vh', zoom: 0.9 }}>
      <Toast message={toast} />

      {/* Demo banner */}
      {isFootballDemo && (
        <div className="flex items-center justify-between px-6 shrink-0" style={{ height: 40, minHeight: 40, background: '#003DA5', color: '#F1C40F', paddingRight: 140 }}>
          <div className="flex items-center gap-2 text-xs font-medium"><span>Demo workspace — exploring with sample data</span><span style={{ opacity: 0.7 }}>· Connect your real club data to see live insights</span></div>
          <button onClick={() => { localStorage.removeItem('lumio_football_demo_active'); window.location.href = `/football/${slug}` }} className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ display: 'none' }}>Clear Demo Data</button>
        </div>
      )}

      {/* Top-right avatar */}
      <div className="fixed hidden md:flex items-center gap-2" style={{ top: 12, right: 20, zIndex: 60 }}>
        <button onClick={() => setFbNotifOpen(o => !o)} title="Notifications" style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
          <Bell size={16} strokeWidth={1.75} />
          <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EF4444', fontSize: 6, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }} />
        </button>
        <AvatarDropdown initials={initials} settingsHref={`/football/${slug}/settings`} />
      </div>
      {fbNotifOpen && <FootballNotificationsPanel onClose={() => setFbNotifOpen(false)} />}

      {/* Mobile menu button */}
      <div className="md:hidden flex items-center px-4 py-2 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
        <button className="p-1.5 rounded-lg" style={{ color: '#9CA3AF' }} onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
        <span className="text-sm font-semibold ml-2 truncate" style={{ color: '#F9FAFB' }}>{clubName}</span>
      </div>

      {/* Body: sidebar + content */}
      <div className="flex flex-1" style={{ minHeight: '100vh' }}>
        <Sidebar
          activeDept={activeDept}
          onSelect={setActiveDept}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          clubName={clubName}
          allowedIds={roleConfig.sidebar}
          session={liveSession}
          isFootballDemo={isFootballDemo}
          onRoleChange={(role) => {
            setRoleOverride(role)
            const newConfig = FOOTBALL_ROLE_CONFIG[role as keyof typeof FOOTBALL_ROLE_CONFIG]
            if (newConfig) {
              const allFlat = SIDEBAR_ITEMS.map(s => s.id)
              const firstAllowed = newConfig.sidebar === 'all'
                ? allFlat[0]
                : (newConfig.sidebar as string[])[0]
              if (firstAllowed) setActiveDept(firstAllowed as DeptId)
            }
            try {
              const key = 'lumio_sports_demo_football'
              const stored = localStorage.getItem(key)
              if (stored) {
                const parsed = JSON.parse(stored)
                localStorage.setItem(key, JSON.stringify({ ...parsed, role }))
              }
            } catch { /* ignore */ }
          }}
        />

        <div className="flex-1 flex flex-col min-w-0" style={{ minHeight: '100vh' }}>
          {/* SIDEBAR/PADDING ALIGNMENT — values aligned to cricket reference
              (cricket/[slug]/page.tsx). Same fonts and densities; horizontal
              width parity needs identical sidebar width + main padding to
              prevent "football looks bigger" perception. */}
          <main className="flex-1" style={{ padding: '24px 28px' }}>
            {activeDept !== 'overview' && (
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-lg font-bold">{deptLabel}</h1>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Club: <span style={{ color: '#F9FAFB' }}>{clubName}</span></p>
                </div>
              </div>
            )}

            {activeDept === 'overview' && <OverviewView clubName={clubName} firstName={userName ? userName.split(' ')[0] : undefined} onAction={handleActionClick} onNavigate={(dept) => setActiveDept(dept as DeptId)} role={currentRole as string} onModal={(modalId) => fireToast(`${modalId} — coming soon`)} isDemo={isFootballDemo} clubLogo={clubLogo} />}
            {activeDept === 'insights' && (isFootballDemo ? <InsightsView /> : <FootballEmptyState dept="Insights" />)}
            {activeDept !== 'overview' && activeDept !== 'settings' && activeDept !== 'insights' && !isFootballDemo && <FootballEmptyState dept={deptLabel} />}
            {isFootballDemo && activeDept === 'squad' && <SquadView />}
            {isFootballDemo && activeDept === 'tactics' && <TacticsView onActionClick={handleActionClick} />}
            {isFootballDemo && activeDept === 'set-pieces' && <ProSetPiecesView />}
            {isFootballDemo && activeDept === 'transfers' && <TransfersView onActionClick={handleActionClick} />}
            {isFootballDemo && activeDept === 'board' && <BoardSuiteView />}
            {isFootballDemo && activeDept === 'medical' && <MedicalView />}
            {isFootballDemo && activeDept === 'scouting' && <ScoutingView />}
            {isFootballDemo && activeDept === 'academy' && <AcademyView onActionClick={handleActionClick} />}
            {isFootballDemo && activeDept === 'analytics' && <AnalyticsView />}
            {isFootballDemo && activeDept === 'media' && <MediaContentModule sport="football-pro" accentColor="#003DA5" existingContentLabel="Football Pro — Media & PR (existing)" existingContent={<MediaView />} isDemoShell={session?.isDemoShell !== false} />}
            {isFootballDemo && activeDept === 'social' && <SocialMediaView />}
            {isFootballDemo && activeDept === 'matchday' && <MatchdayView />}
            {isFootballDemo && activeDept === 'training' && <TrainingView />}
            {isFootballDemo && activeDept === 'performance' && <GPSPerformanceView />}
            {isFootballDemo && activeDept === 'gps-heatmaps' && <GPSHeatmapsView />}
            {isFootballDemo && activeDept === 'finance' && <FinanceView />}
            {isFootballDemo && activeDept === 'staff' && <StaffView />}
            {isFootballDemo && activeDept === 'facilities' && <FacilitiesView />}
            {isFootballDemo && activeDept === 'dynamics' && <DynamicsView />}
            {isFootballDemo && activeDept === 'concussion-tracker' && <ConcussionTrackerView />}
            {isFootballDemo && activeDept === 'psr-scr-modeller' && <PSRScenarioModellerView />}
            {isFootballDemo && activeDept === 'squad-planner' && <SquadPlannerView />}
            {isFootballDemo && activeDept === 'tours-camps' && <ToursAndCampsView />}
            {activeDept === 'lumio-vision' && <FootballScoutIntegrationView />}
            {activeDept === 'scouting-db' && <ScoutingDBView />}
            {activeDept === 'gps-hardware' && <GPSHardwareView />}
            {activeDept === 'opta' && <FootballEventDataView />}
            {activeDept === 'discover' && <DiscoverView />}
            {activeDept === 'lumio-data-pro' && <FootballLeagueDataView />}
            {activeDept === 'settings' && <SettingsView isDemo={isFootballDemo} slug={slug} clubLogo={clubLogo} onLogoUpload={handleLogoUpload} onLogoRemove={handleLogoRemove} />}
            {activeDept === 'player-welfare' && <PlayerWelfareHub accent="#003DA5" defaultTab="overview" title="Player Welfare Hub" subtitle="Foreign player integration · wellbeing · cultural support" />}
            {activeDept === 'club-operations' && <PlayerWelfareHub accent="#003DA5" defaultTab="travel" title="Club Operations" subtitle="Travel logistics · matchday ops · compliance · insurance" />}
            {isFootballDemo && activeDept === 'commercial' && <CommercialView />}
            {isFootballDemo && activeDept === 'community' && <CommunityView />}
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
    </div>
  )
}
