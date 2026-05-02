'use client'

import React, { useState } from 'react'
import {
  Users, TrendingUp, AlertCircle, CheckCircle2, Clock,
  Star, Sparkles, X, Check,
  Home, Calendar, FileText, Target,
  Bell, Activity, Shield, Shirt, Clipboard, Trophy,
  UserPlus, DollarSign, Heart, Eye, MapPin,
  MessageSquare,
  ExternalLink, Wrench, Send,
  ChevronDown, ChevronUp, Loader2,
  AlertTriangle, CloudRain, Sun,
  CircleDot, Hash, Printer,
  Handshake, Search, Copy, Zap, BarChart3, Radio, Flame,
  Rocket,
} from 'lucide-react'
import { useElevenLabsTTS as useSpeech } from '@/hooks/useElevenLabsTTS'
import NLSetPiecesView from '@/components/football/NLSetPiecesView'
import MediaContentModule from '@/components/sports/media-content/MediaContentModule'
import { GPSHeatmapsView, type HMPlayer } from '@/components/sports/GPSHeatmapsBlocks'
// ─── NL v2 dashboard imports ─────────────────────────────────────────────
import { THEMES, DENSITY, FONT as V2_FONT, getGreeting as v2GetGreeting } from '@/app/cricket/[slug]/v2/_lib/theme'
import {
  CommandPalette as V2CommandPalette,
  AskLumio as V2AskLumio,
  FixtureDrawer as V2FixtureDrawer,
  Toast as V2Toast,
  useToast as useV2Toast,
  useKey as useV2Key,
} from '@/app/cricket/[slug]/v2/_components/Overlays'
import {
  HeroToday as NlHeroToday,
  TodaySchedule as NlTodaySchedule,
  StatTiles as NlStatTiles,
  AIBrief as NlAIBriefMod,
  Inbox as NlInboxMod,
  Squad as NlSquadModule,
  Fixtures as NlFixturesMod,
  Perf as NlPerfMod,
  Recents as NlRecentsMod,
  Season as NlSeasonMod,
} from './_components/NLDashboardModules'
import { NL_INBOX, NL_ACCENT } from './_lib/nl-dashboard-data'
import type { NlFixture } from './_lib/nl-dashboard-data'

// ─── Colors (Amber theme for Non-League) ────────────────────────────────────

const PRIMARY = '#D97706'
const DARK = '#B45309'
const ACCENT = '#FDE68A'
const GOLD = '#F59E0B'
const BG = '#0F172A'
const CARD_BG = '#1E293B'
const BORDER = '#334155'
const TEXT = '#F8FAFC'
const TEXT_SEC = '#94A3B8'

// ─── Types ──────────────────────────────────────────────────────────────────

export type NLDeptId =
  | 'nl-getting-started'
  | 'nl-overview' | 'nl-club-profile' | 'nl-club-vision' | 'nl-squad' | 'nl-fixtures' | 'nl-training' | 'nl-tactics'
  | 'nl-set-pieces' | 'nl-medical' | 'nl-transfers' | 'nl-finance' | 'nl-ground'
  | 'nl-safeguarding' | 'nl-matchday' | 'nl-comms' | 'nl-committee'
  | 'nl-gps' | 'nl-gps-heatmaps' | 'nl-matchfees' | 'nl-cupmanager' | 'nl-preseason'
  | 'nl-registration' | 'nl-discipline' | 'nl-kit' | 'nl-sponsorship'
  | 'nl-fundraising' | 'nl-merchandise' | 'nl-insurance' | 'nl-media'
  | 'nl-morningroundup' | 'nl-aihalftime' | 'nl-ground-hire'

type NLSection = null | 'Football' | 'GPS & Load' | 'Operations' | 'Facilities' | 'Club'

// Lumio = club management platform. Pitch-side tactical features
// (AI Halftime Brief, Training drills, Tactics, Set Pieces) are
// Hudl/Sportscode territory and are commented out here so the underlying
// view code stays compilable.
export const NL_SIDEBAR_ITEMS: { id: NLDeptId; label: string; icon: React.ElementType; section: NLSection }[] = [
  { id: 'nl-getting-started', label: 'Getting Started',         icon: Rocket,         section: null },
  { id: 'nl-overview',        label: 'Overview',                icon: Home,           section: null },
  { id: 'nl-morningroundup',  label: 'Morning Roundup',         icon: Bell,           section: null },
  { id: 'nl-club-profile',    label: 'Club Profile',            icon: MapPin,         section: null },
  { id: 'nl-club-vision',     label: 'Club Vision',             icon: Rocket,         section: null },
  { id: 'nl-preseason',       label: 'Pre-Season',              icon: Calendar,       section: null },
  /* REMOVED: Pitch-side tactical features — Hudl territory. Uncomment to restore.
  { id: 'nl-aihalftime',      label: 'AI Halftime Brief',       icon: Target,         section: 'Football' },
  */
  { id: 'nl-squad',           label: 'Squad',                   icon: Shirt,          section: 'Football' },
  { id: 'nl-fixtures',        label: 'Fixtures & Cups',         icon: Calendar,       section: 'Football' },
  { id: 'nl-cupmanager',      label: 'Cup Manager',             icon: Trophy,         section: 'Football' },
  /* REMOVED: Pitch-side tactical features — Hudl territory. Uncomment to restore.
  { id: 'nl-training',        label: 'Training',                icon: Target,         section: 'Football' },
  { id: 'nl-tactics',         label: 'Tactics',                 icon: Clipboard,      section: 'Football' },
  { id: 'nl-set-pieces',      label: 'Set Pieces',              icon: Target,         section: 'Football' },
  */
  { id: 'nl-gps',             label: 'GPS & Performance',       icon: Activity,       section: 'GPS & Load' },
  { id: 'nl-gps-heatmaps',    label: 'Heatmaps',                icon: Flame,          section: 'GPS & Load' },
  { id: 'nl-medical',         label: 'Medical',                 icon: Heart,          section: 'Football' },
  { id: 'nl-transfers',       label: 'Transfers & Recruitment', icon: UserPlus,       section: 'Football' },
  { id: 'nl-registration',    label: 'Player Registration',     icon: Shield,         section: 'Operations' },
  { id: 'nl-discipline',      label: 'Discipline Log',          icon: AlertTriangle,  section: 'Operations' },
  { id: 'nl-matchfees',       label: 'Match Fee Tracker',       icon: DollarSign,     section: 'Operations' },
  { id: 'nl-kit',             label: 'Kit & Equipment',         icon: Shirt,          section: 'Operations' },
  { id: 'nl-finance',         label: 'Finance',                 icon: DollarSign,     section: 'Operations' },
  { id: 'nl-safeguarding',    label: 'Safeguarding',            icon: Shield,         section: 'Operations' },
  { id: 'nl-matchday',        label: 'Matchday',                icon: Trophy,         section: 'Operations' },
  { id: 'nl-ground',          label: 'Ground & Facilities',     icon: MapPin,         section: 'Facilities' },
  { id: 'nl-ground-hire',     label: 'Ground Hire',             icon: MapPin,         section: 'Facilities' },
  { id: 'nl-sponsorship',     label: 'Sponsorship',             icon: Handshake,      section: 'Club' },
  { id: 'nl-fundraising',     label: 'Fundraising',             icon: Heart,          section: 'Club' },
  { id: 'nl-insurance',       label: 'Insurance',               icon: Shield,         section: 'Club' },
  { id: 'nl-comms',           label: 'Comms',                   icon: MessageSquare,  section: 'Club' },
  { id: 'nl-media',           label: 'Media & Content',         icon: Radio,          section: 'Club' },
  { id: 'nl-committee',       label: 'Committee',               icon: Users,          section: 'Club' },
]

// ─── Squad Data ─────────────────────────────────────────────────────────────

interface NLPlayer {
  name: string; number: number; position: string; age: number
  signedFrom: string; contractType: 'Seasonal' | 'Monthly' | 'Match-by-match' | 'Loan'
  matchFee: number; travelAllowance: number; faRegistered: boolean
  availability: 'available' | 'unavailable' | 'maybe'
  apps: number; goals: number; assists: number; yc: number; rc: number
  injured: boolean; injuryNote?: string; suspended: boolean
  strengths?: string; weaknesses?: string
}

const NL_SQUAD: NLPlayer[] = [
  { name: 'Ryan Calloway', number: 1, position: 'GK', age: 28, signedFrom: 'Altrincham Town Res', contractType: 'Seasonal', matchFee: 40, travelAllowance: 15, faRegistered: true, availability: 'available', apps: 26, goals: 0, assists: 0, yc: 1, rc: 0, injured: false, suspended: false, strengths: 'Shot-stopping, distribution', weaknesses: 'Crosses in wind' },
  { name: 'Jake Morley', number: 2, position: 'RB', age: 25, signedFrom: 'Bamber Bridge', contractType: 'Monthly', matchFee: 35, travelAllowance: 15, faRegistered: true, availability: 'available', apps: 24, goals: 1, assists: 5, yc: 4, rc: 0, injured: false, suspended: false, strengths: 'Pace, overlapping runs', weaknesses: 'Positional discipline' },
  { name: 'Danny Prescott', number: 4, position: 'CB', age: 30, signedFrom: 'Mossley', contractType: 'Seasonal', matchFee: 45, travelAllowance: 20, faRegistered: true, availability: 'available', apps: 27, goals: 3, assists: 0, yc: 5, rc: 0, injured: false, suspended: false, strengths: 'Aerial ability, leadership', weaknesses: 'Pace against quick strikers' },
  { name: 'Lewis Cartwright', number: 5, position: 'CB', age: 27, signedFrom: 'Hyde United', contractType: 'Seasonal', matchFee: 40, travelAllowance: 15, faRegistered: true, availability: 'available', apps: 25, goals: 1, assists: 0, yc: 3, rc: 0, injured: false, suspended: false, strengths: 'Reading the game, composure', weaknesses: 'Distribution under pressure' },
  { name: 'Sam Okonkwo', number: 3, position: 'LB', age: 23, signedFrom: 'Academy', contractType: 'Monthly', matchFee: 30, travelAllowance: 10, faRegistered: true, availability: 'available', apps: 22, goals: 0, assists: 4, yc: 2, rc: 0, injured: false, suspended: false, strengths: 'Athleticism, crossing', weaknesses: 'Defensive positioning' },
  { name: 'Tom Brennan', number: 6, position: 'CDM', age: 29, signedFrom: 'Radcliffe', contractType: 'Seasonal', matchFee: 50, travelAllowance: 20, faRegistered: true, availability: 'available', apps: 27, goals: 2, assists: 3, yc: 6, rc: 0, injured: false, suspended: false, strengths: 'Tackling, work rate, set pieces', weaknesses: 'Passing range' },
  { name: 'Josh Whitmore', number: 8, position: 'CM', age: 26, signedFrom: 'Clitheroe', contractType: 'Monthly', matchFee: 40, travelAllowance: 15, faRegistered: true, availability: 'available', apps: 24, goals: 4, assists: 6, yc: 3, rc: 0, injured: false, suspended: false, strengths: 'Box-to-box energy, passing', weaknesses: 'Shooting from distance' },
  { name: 'Callum Deakin', number: 14, position: 'CM', age: 24, signedFrom: 'Glossop NE', contractType: 'Match-by-match', matchFee: 35, travelAllowance: 10, faRegistered: true, availability: 'available', apps: 18, goals: 2, assists: 3, yc: 1, rc: 0, injured: false, suspended: false, strengths: 'Technical ability', weaknesses: 'Physical presence' },
  { name: 'Ryan Fletcher', number: 7, position: 'RW', age: 22, signedFrom: 'Marine', contractType: 'Monthly', matchFee: 35, travelAllowance: 15, faRegistered: true, availability: 'maybe', apps: 20, goals: 6, assists: 8, yc: 0, rc: 0, injured: false, suspended: false, strengths: 'Pace, direct running', weaknesses: 'End product inconsistent' },
  { name: 'Marcus Webb', number: 11, position: 'LW', age: 25, signedFrom: 'Prescot Cables', contractType: 'Seasonal', matchFee: 40, travelAllowance: 15, faRegistered: true, availability: 'available', apps: 25, goals: 5, assists: 7, yc: 2, rc: 0, injured: false, suspended: false, strengths: 'Skill, crossing, free kicks', weaknesses: 'Tracking back' },
  { name: 'Liam Grady', number: 9, position: 'ST', age: 27, signedFrom: 'Widnes', contractType: 'Seasonal', matchFee: 55, travelAllowance: 20, faRegistered: true, availability: 'available', apps: 27, goals: 14, assists: 3, yc: 3, rc: 0, injured: false, suspended: false, strengths: 'Finishing, movement, aerial', weaknesses: 'Hold-up play' },
  { name: 'Nathan Hollis', number: 13, position: 'GK', age: 33, signedFrom: 'Kidsgrove Athletic', contractType: 'Match-by-match', matchFee: 30, travelAllowance: 10, faRegistered: true, availability: 'available', apps: 4, goals: 0, assists: 0, yc: 0, rc: 0, injured: false, suspended: false, strengths: 'Experience, communication', weaknesses: 'Mobility declining' },
  { name: 'Ben Ashworth', number: 15, position: 'RB', age: 21, signedFrom: 'Youth setup', contractType: 'Monthly', matchFee: 25, travelAllowance: 10, faRegistered: true, availability: 'available', apps: 8, goals: 0, assists: 1, yc: 0, rc: 0, injured: false, suspended: false, strengths: 'Enthusiasm, learning fast', weaknesses: 'Inexperience at this level' },
  { name: 'Chris Platt', number: 16, position: 'CB', age: 32, signedFrom: 'Colne', contractType: 'Seasonal', matchFee: 35, travelAllowance: 15, faRegistered: true, availability: 'unavailable', apps: 18, goals: 1, assists: 0, yc: 4, rc: 0, injured: true, injuryNote: 'Calf strain — expected return 12 Apr', suspended: false, strengths: 'Experienced, organiser', weaknesses: 'Losing pace' },
  { name: 'Jordan Mellor', number: 17, position: 'CM', age: 28, signedFrom: 'Ramsbottom United', contractType: 'Monthly', matchFee: 40, travelAllowance: 15, faRegistered: true, availability: 'unavailable', apps: 14, goals: 1, assists: 2, yc: 2, rc: 0, injured: true, injuryNote: 'Knee ligament — 3 weeks', suspended: false, strengths: 'Tenacity, set piece delivery', weaknesses: 'Temperament' },
  { name: 'Declan Nash', number: 19, position: 'LW', age: 20, signedFrom: 'Stockport County (loan)', contractType: 'Loan', matchFee: 0, travelAllowance: 0, faRegistered: true, availability: 'unavailable', apps: 12, goals: 3, assists: 4, yc: 5, rc: 0, injured: false, suspended: true, strengths: 'Pace, trickery, EFL pedigree', weaknesses: 'Decision-making under pressure' },
  { name: 'Harry Simcox', number: 10, position: 'ST', age: 30, signedFrom: 'Trafford', contractType: 'Seasonal', matchFee: 45, travelAllowance: 15, faRegistered: true, availability: 'available', apps: 23, goals: 8, assists: 5, yc: 2, rc: 0, injured: false, suspended: false, strengths: 'Link-up play, experience', weaknesses: 'Stamina in last 20 mins' },
  { name: 'Tyler Rooney', number: 20, position: 'AM', age: 23, signedFrom: 'Droylsden', contractType: 'Monthly', matchFee: 35, travelAllowance: 10, faRegistered: true, availability: 'available', apps: 16, goals: 3, assists: 4, yc: 1, rc: 0, injured: false, suspended: false, strengths: 'Creativity, vision', weaknesses: 'Physical battles' },
  { name: 'Kai Pearson', number: 21, position: 'CDM', age: 21, signedFrom: 'Trial', contractType: 'Match-by-match', matchFee: 30, travelAllowance: 10, faRegistered: true, availability: 'available', apps: 10, goals: 0, assists: 1, yc: 1, rc: 0, injured: false, suspended: false, strengths: 'Energy, ball-winning', weaknesses: 'Passing accuracy' },
  { name: 'Adam Walsh', number: 22, position: 'RW', age: 26, signedFrom: 'Atherton Collieries', contractType: 'Seasonal', matchFee: 35, travelAllowance: 15, faRegistered: true, availability: 'available', apps: 19, goals: 4, assists: 3, yc: 1, rc: 0, injured: false, suspended: false, strengths: 'Delivery, work rate', weaknesses: 'Pace' },
  { name: 'Craig Dunne', number: 18, position: 'CB', age: 34, signedFrom: 'Warrington Rylands', contractType: 'Seasonal', matchFee: 40, travelAllowance: 15, faRegistered: true, availability: 'available', apps: 15, goals: 2, assists: 0, yc: 3, rc: 1, injured: false, suspended: false, strengths: 'Aerial dominance, no-nonsense', weaknesses: 'On the ball' },
  { name: 'Sean Rafferty', number: 23, position: 'LB', age: 24, signedFrom: 'Free agent', contractType: 'Match-by-match', matchFee: 30, travelAllowance: 10, faRegistered: true, availability: 'available', apps: 9, goals: 0, assists: 2, yc: 0, rc: 0, injured: false, suspended: false, strengths: 'Left foot, stamina', weaknesses: 'Aerial duels' },
  { name: 'Owen Bright', number: 24, position: 'AM', age: 19, signedFrom: 'Bolton Wanderers (loan)', contractType: 'Loan', matchFee: 0, travelAllowance: 0, faRegistered: true, availability: 'available', apps: 8, goals: 2, assists: 3, yc: 0, rc: 0, injured: false, suspended: false, strengths: 'Technical quality, EFL development', weaknesses: 'Physical side of non-league' },
]

// ─── Player Targets ─────────────────────────────────────────────────────────

const NL_PLAYER_TARGETS = [
  { player: 'Liam Grady', target: 'Score 18 goals', current: 14, total: 18 },
  { player: 'Ryan Fletcher', target: 'Make 25 appearances', current: 20, total: 25 },
  { player: 'Tom Brennan', target: 'Captain — 30 appearances', current: 27, total: 30 },
  { player: 'Marcus Webb', target: '10 assists', current: 7, total: 10 },
  { player: 'Owen Bright', target: '5 goals on loan', current: 2, total: 5 },
]

const NL_TRIALISTS = [
  { name: 'Connor Hughes', position: 'CM', from: 'Nantwich Town', trialMatches: 2, recommendation: 'Sign — good engine, fits system' },
  { name: 'Levi Barrett', position: 'ST', from: 'Leek Town', trialMatches: 1, recommendation: 'Another trial needed — raw but quick' },
]

const NL_RELEASED = [
  { name: 'Darren Cooke', position: 'RB', to: 'Glossop NE', reason: 'Not in manager\'s plans', date: 'Nov 2025' },
  { name: 'Jimmy Lloyd', position: 'ST', to: 'Unknown', reason: 'Moved away for work', date: 'Oct 2025' },
]

// ─── Fixtures ───────────────────────────────────────────────────────────────

const NL_FIXTURES = [
  { opponent: 'Bootle', date: 'Sat 9 Aug', time: '15:00', venue: 'Berry Park', ha: 'A' as const, result: 'L 0-2', scorers: '', motm: 'Calloway' },
  { opponent: 'Colne', date: 'Sat 16 Aug', time: '15:00', venue: 'Harfield Community Stadium', ha: 'H' as const, result: 'W 3-1', scorers: 'Grady 2, Simcox', motm: 'Grady' },
  { opponent: 'Barnoldswick Town', date: 'Sat 23 Aug', time: '15:00', venue: 'Silentnight Stadium', ha: 'A' as const, result: 'W 2-0', scorers: 'Grady, Webb', motm: 'Prescott' },
  { opponent: 'Glossop NE', date: 'Sat 30 Aug', time: '15:00', venue: 'Harfield Community Stadium', ha: 'H' as const, result: 'D 1-1', scorers: 'Whitmore', motm: 'Brennan' },
  { opponent: 'Prescot Cables', date: 'Sat 6 Sep', time: '15:00', venue: 'Valerie Park', ha: 'A' as const, result: 'L 1-3', scorers: 'Fletcher', motm: 'Webb' },
  { opponent: 'Trafford', date: 'Sat 13 Sep', time: '15:00', venue: 'Harfield Community Stadium', ha: 'H' as const, result: 'W 2-0', scorers: 'Grady, Nash', motm: 'Grady' },
  { opponent: 'Mossley', date: 'Sat 20 Sep', time: '15:00', venue: 'Seel Park', ha: 'A' as const, result: 'D 0-0', scorers: '', motm: 'Cartwright' },
  { opponent: 'Ramsbottom United', date: 'Sat 27 Sep', time: '15:00', venue: 'Harfield Community Stadium', ha: 'H' as const, result: 'W 4-1', scorers: 'Grady 2, Simcox, Webb', motm: 'Whitmore' },
  { opponent: 'Droylsden', date: 'Sat 4 Oct', time: '15:00', venue: 'Butchers Arms', ha: 'A' as const, result: 'W 1-0', scorers: 'Simcox', motm: 'Brennan' },
  { opponent: 'Clitheroe', date: 'Sat 11 Oct', time: '15:00', venue: 'Harfield Community Stadium', ha: 'H' as const, result: 'W 3-0', scorers: 'Grady, Fletcher, Nash', motm: 'Nash' },
  { opponent: 'Runcorn Linnets', date: 'Sat 18 Oct', time: '15:00', venue: 'Halton Stadium', ha: 'A' as const, result: 'L 0-1', scorers: '', motm: 'Prescott' },
  { opponent: 'Kidsgrove Athletic', date: 'Sat 25 Oct', time: '15:00', venue: 'Harfield Community Stadium', ha: 'H' as const, result: 'W 2-1', scorers: 'Simcox, Rooney', motm: 'Simcox' },
  { opponent: 'Atherton Collieries', date: 'Sat 1 Nov', time: '15:00', venue: 'Alder House', ha: 'A' as const, result: 'D 2-2', scorers: 'Grady, Webb', motm: 'Morley' },
  { opponent: 'Widnes', date: 'Sat 8 Nov', time: '15:00', venue: 'Harfield Community Stadium', ha: 'H' as const, result: 'W 3-2', scorers: 'Grady 2, Fletcher', motm: 'Grady' },
  { opponent: 'Marine Res', date: 'Sat 15 Nov', time: '15:00', venue: 'Rossett Park', ha: 'A' as const, result: 'L 1-2', scorers: 'Walsh', motm: 'Calloway' },
  { opponent: 'Stocksbridge PS', date: 'Sat 22 Nov', time: '15:00', venue: 'Harfield Community Stadium', ha: 'H' as const, result: 'W 2-0', scorers: 'Grady, Bright', motm: 'Bright' },
  { opponent: 'Warrington Rylands Res', date: 'Sat 6 Dec', time: '15:00', venue: 'Harfield Community Stadium', ha: 'H' as const, result: 'W 4-0', scorers: 'Grady 2, Simcox, Rooney', motm: 'Rooney' },
  { opponent: 'Radcliffe', date: 'Sat 13 Dec', time: '15:00', venue: 'Stainton Park', ha: 'A' as const, result: 'D 1-1', scorers: 'Fletcher', motm: 'Brennan' },
  { opponent: 'Hyde United', date: 'Sat 1 Mar', time: '15:00', venue: 'Harfield Community Stadium', ha: 'H' as const, result: 'W 2-1', scorers: 'Grady, Whitmore', motm: 'Whitmore' },
  { opponent: 'Redbourne Town', date: 'Sat 5 Apr', time: '15:00', venue: 'Harfield Community Stadium', ha: 'H' as const, result: '', scorers: '', motm: '' },
  { opponent: 'Runcorn Linnets', date: 'Sat 12 Apr', time: '15:00', venue: 'Harfield Community Stadium', ha: 'H' as const, result: '', scorers: '', motm: '' },
  { opponent: 'Bootle', date: 'Sat 19 Apr', time: '15:00', venue: 'Harfield Community Stadium', ha: 'H' as const, result: '', scorers: '', motm: '' },
  { opponent: 'Prescot Cables', date: 'Sat 26 Apr', time: '15:00', venue: 'Harfield Community Stadium', ha: 'H' as const, result: '', scorers: '', motm: '' },
  { opponent: 'Trafford', date: 'Sat 3 May', time: '15:00', venue: 'Shawe View', ha: 'A' as const, result: '', scorers: '', motm: '' },
]

const NL_CUP_FIXTURES = [
  { comp: 'FA Cup', round: 'Extra Preliminary', opponent: 'Barnoldswick Town', result: 'W 3-0', date: 'Sat 2 Aug' },
  { comp: 'FA Cup', round: 'Preliminary', opponent: 'Glossop NE', result: 'L 1-2', date: 'Sat 16 Aug' },
  { comp: 'FA Vase', round: '1st Round', opponent: 'Chadderton', result: 'W 2-1', date: 'Sat 27 Sep' },
  { comp: 'FA Vase', round: '2nd Round', opponent: 'Congleton Town', result: 'W 3-0', date: 'Sat 25 Oct' },
  { comp: 'FA Vase', round: '3rd Round', opponent: 'Redbourne Town', result: '', date: 'Sat 8 Nov' },
  { comp: 'County Cup', round: 'Quarter-Final', opponent: 'Hyde United Res', result: 'W 4-2', date: 'Tue 18 Nov' },
  { comp: 'County Cup', round: 'Semi-Final', opponent: 'TBC', result: '', date: 'TBC Apr' },
]

// ─── League Table ───────────────────────────────────────────────────────────

const NL_LEAGUE_TABLE = [
  { pos: 1,  team: 'Runcorn Linnets',        p: 28, w: 20, d: 4, l: 4, gf: 58, ga: 22, gd: 36, pts: 64 },
  { pos: 2,  team: 'Bootle',                 p: 28, w: 18, d: 5, l: 5, gf: 52, ga: 25, gd: 27, pts: 59 },
  { pos: 3,  team: 'Prescot Cables',         p: 28, w: 17, d: 4, l: 7, gf: 49, ga: 28, gd: 21, pts: 55 },
  { pos: 4,  team: 'Harfield FC',            p: 28, w: 14, d: 5, l: 9, gf: 42, ga: 29, gd: 13, pts: 47 },
  { pos: 5,  team: 'Clitheroe',              p: 28, w: 13, d: 6, l: 9, gf: 40, ga: 32, gd: 8,  pts: 45 },
  { pos: 6,  team: 'Atherton Collieries',    p: 28, w: 13, d: 5, l: 10, gf: 38, ga: 33, gd: 5,  pts: 44 },
  { pos: 7,  team: 'Mossley',                p: 28, w: 12, d: 6, l: 10, gf: 35, ga: 31, gd: 4,  pts: 42 },
  { pos: 8,  team: 'Hyde United',            p: 28, w: 12, d: 5, l: 11, gf: 37, ga: 35, gd: 2,  pts: 41 },
  { pos: 9,  team: 'Trafford',               p: 28, w: 11, d: 6, l: 11, gf: 36, ga: 36, gd: 0,  pts: 39 },
  { pos: 10, team: 'Ramsbottom United',      p: 28, w: 11, d: 4, l: 13, gf: 33, ga: 38, gd: -5, pts: 37 },
  { pos: 11, team: 'Colne',                  p: 28, w: 10, d: 5, l: 13, gf: 30, ga: 37, gd: -7, pts: 35 },
  { pos: 12, team: 'Redbourne Town',         p: 28, w: 10, d: 4, l: 14, gf: 32, ga: 40, gd: -8, pts: 34 },
  { pos: 13, team: 'Kidsgrove Athletic',     p: 28, w: 9,  d: 5, l: 14, gf: 28, ga: 39, gd: -11, pts: 32 },
  { pos: 14, team: 'Droylsden',              p: 28, w: 9,  d: 4, l: 15, gf: 27, ga: 42, gd: -15, pts: 31 },
  { pos: 15, team: 'Glossop NE',             p: 28, w: 8,  d: 5, l: 15, gf: 25, ga: 41, gd: -16, pts: 29 },
  { pos: 16, team: 'Radcliffe',              p: 28, w: 8,  d: 4, l: 16, gf: 26, ga: 44, gd: -18, pts: 28 },
  { pos: 17, team: 'Widnes',                 p: 28, w: 7,  d: 5, l: 16, gf: 24, ga: 43, gd: -19, pts: 26 },
  { pos: 18, team: 'Marine Res',             p: 28, w: 7,  d: 4, l: 17, gf: 23, ga: 46, gd: -23, pts: 25 },
  { pos: 19, team: 'Stocksbridge PS',        p: 28, w: 6,  d: 3, l: 19, gf: 20, ga: 50, gd: -30, pts: 21 },
  { pos: 20, team: 'Barnoldswick Town',      p: 28, w: 4,  d: 3, l: 21, gf: 15, ga: 55, gd: -40, pts: 15 },
  { pos: 21, team: 'Warrington Rylands Res', p: 28, w: 3,  d: 4, l: 21, gf: 14, ga: 58, gd: -44, pts: 13 },
]

// ─── Training ───────────────────────────────────────────────────────────────

const NL_TRAINING = [
  { day: 'Tuesday', time: '19:30–21:00', venue: 'Harfield Community Stadium', topic: 'Shape & pressing — preparing for Redbourne', status: 'confirmed' as const },
  { day: 'Thursday', time: '19:30–21:00', venue: 'Harfield Community Stadium (3G)', topic: 'Set pieces + shooting drills', status: 'confirmed' as const },
  { day: 'Friday', time: '10:00–11:00', venue: 'Harfield Community Stadium', topic: 'Goalkeeper session — Calloway & Hollis', status: 'optional' as const },
]

// ─── Transfer Data ──────────────────────────────────────────────────────────

const NL_SIGNINGS = [
  { name: 'Sean Rafferty', from: 'Free agent', fee: 'Free', date: 'Jan 2026', regDate: '20 Jan 2026' },
  { name: 'Owen Bright', from: 'Bolton Wanderers (loan)', fee: 'Loan', date: 'Jan 2026', regDate: '15 Jan 2026' },
  { name: 'Tyler Rooney', from: 'Droylsden', fee: '£500 compensation', date: 'Nov 2025', regDate: '12 Nov 2025' },
  { name: 'Adam Walsh', from: 'Atherton Collieries', fee: 'Free', date: 'Aug 2025', regDate: '1 Aug 2025' },
  { name: 'Callum Deakin', from: 'Glossop NE', fee: 'Free', date: 'Aug 2025', regDate: '5 Aug 2025' },
]

const NL_TRANSFER_TARGETS = [
  { name: 'Aiden Cross', currentClub: 'Nantwich Town', position: 'CM', age: 24, status: 'Contact made', notes: 'Out of contract in summer — expressed interest' },
  { name: 'Rhys Mayfield', currentClub: 'Stalybridge Celtic', position: 'CB', age: 26, status: 'Watching', notes: 'Strong in the air. Would add depth after Dunne retires' },
  { name: 'Joe Hartigan', currentClub: 'Northwich Victoria', position: 'ST', age: 22, status: 'Contact made', notes: '12 goals this season. Quick. Wants step up.' },
]

const NL_LOAN_PLAYERS = [
  { name: 'Declan Nash', parentClub: 'Stockport County', position: 'LW', loanUntil: '30 Apr 2026', apps: 12, goals: 3 },
  { name: 'Owen Bright', parentClub: 'Bolton Wanderers', position: 'AM', loanUntil: '15 May 2026', apps: 8, goals: 2 },
]

// ─── Finance Data ───────────────────────────────────────────────────────────

const NL_INCOME = [
  { category: 'Gate receipts', amount: 15820, detail: '£8 adult avg × ~140 per game × 14 home games' },
  { category: 'Bar & hospitality', amount: 5600, detail: '~£400 per home match' },
  { category: 'Programme sales', amount: 2240, detail: '£2 × ~80 copies × 14 games' },
  { category: 'Sponsorship', amount: 9500, detail: 'Main shirt + 7 board sponsors' },
  { category: 'FA prize money', amount: 1450, detail: 'FA Cup prelim + FA Vase runs' },
  { category: 'Fundraising', amount: 2800, detail: 'Sportsman\'s dinner, race night, 50/50' },
  { category: 'Club lottery', amount: 1800, detail: '150 members × £1/wk × 46 weeks' },
  { category: 'Chairman\'s contribution', amount: 5000, detail: 'Annual top-up from chairman' },
]

const NL_EXPENDITURE = [
  { category: 'Player match fees', amount: 18200, detail: '~£40 avg × 16 players × 28 games' },
  { category: 'Management wages', amount: 14000, detail: 'Manager £250/wk + Asst £100/wk × 40 weeks' },
  { category: 'Referee fees', amount: 1960, detail: '£70 per match × 28 matches' },
  { category: 'Ground maintenance', amount: 3200, detail: 'Pitch, stands, facilities upkeep' },
  { category: 'Floodlight electricity', amount: 2400, detail: '~£150 per evening session × 16 sessions' },
  { category: 'Away travel', amount: 1680, detail: '~£120 per away trip × 14' },
  { category: 'Kit & equipment', amount: 2500, detail: 'Home kit, away kit, training, balls' },
  { category: 'League & FA fees', amount: 850, detail: 'Registration, league entry, FA affiliation' },
  { category: 'Ground grading', amount: 1500, detail: 'Compliance works, safety certificate' },
  { category: 'Insurance', amount: 1200, detail: 'Public liability, player injury' },
]

const NL_GATE_LOG = [
  { match: 'vs Colne (H)', date: '16 Aug', adults: 142, concessions: 28, seasonTickets: 22, gate: 1378, bar: 380 },
  { match: 'vs Glossop NE (H)', date: '30 Aug', adults: 155, concessions: 32, seasonTickets: 22, gate: 1488, bar: 420 },
  { match: 'vs Trafford (H)', date: '13 Sep', adults: 168, concessions: 35, seasonTickets: 22, gate: 1609, bar: 460 },
  { match: 'vs Ramsbottom (H)', date: '27 Sep', adults: 148, concessions: 30, seasonTickets: 22, gate: 1424, bar: 390 },
  { match: 'vs Clitheroe (H)', date: '11 Oct', adults: 175, concessions: 38, seasonTickets: 22, gate: 1672, bar: 480 },
  { match: 'vs Kidsgrove (H)', date: '25 Oct', adults: 138, concessions: 25, seasonTickets: 22, gate: 1334, bar: 350 },
  { match: 'vs Widnes (H)', date: '8 Nov', adults: 192, concessions: 42, seasonTickets: 22, gate: 1828, bar: 520 },
  { match: 'vs Stocksbridge PS (H)', date: '22 Nov', adults: 135, concessions: 22, seasonTickets: 22, gate: 1288, bar: 340 },
  { match: 'vs Warrington (H)', date: '6 Dec', adults: 128, concessions: 20, seasonTickets: 22, gate: 1224, bar: 310 },
  { match: 'vs Hyde United (H)', date: '1 Mar', adults: 210, concessions: 48, seasonTickets: 22, gate: 1992, bar: 560 },
]

const NL_SPONSORS = [
  { name: 'Harfield Brewery', value: 3000, type: 'Main shirt sponsor', expiry: 'Jun 2026', what: 'Front of shirt + matchday programme cover', renewal: 'Decision needed by end of Apr' },
  { name: 'Crossley Motors', value: 1500, type: 'Away shirt sponsor', expiry: 'Jun 2026', what: 'Front of away shirt', renewal: 'Renewed' },
  { name: 'J.D. Construction', value: 1000, type: 'Perimeter board', expiry: 'Jun 2027', what: '2 x perimeter boards (home side)', renewal: 'Active' },
  { name: 'Taylor & Sons Solicitors', value: 800, type: 'Perimeter board', expiry: 'Jun 2026', what: '1 x board (far side)', renewal: 'Pending' },
  { name: 'Harfield Fish Bar', value: 500, type: 'Programme sponsor', expiry: 'Jun 2026', what: 'Back page of matchday programme', renewal: 'Pending' },
  { name: 'Northern Windows Ltd', value: 500, type: 'Perimeter board', expiry: 'Jun 2027', what: '1 x board (behind goal)', renewal: 'Active' },
  { name: 'The Miners Arms', value: 400, type: 'Match ball sponsor (rotating)', expiry: 'Jun 2026', what: 'Match ball sponsor 4 games', renewal: 'Pending' },
]

const NL_BUDGET_VS_ACTUAL = [
  { cat: 'Match fees', budget: 20000, actual: 18200 },
  { cat: 'Mgmt wages', budget: 14000, actual: 14000 },
  { cat: 'Ground', budget: 3000, actual: 3200 },
  { cat: 'Floodlights', budget: 2000, actual: 2400 },
  { cat: 'Travel', budget: 1500, actual: 1680 },
  { cat: 'Kit', budget: 2500, actual: 2500 },
]

// ─── Ground & Facilities ────────────────────────────────────────────────────

const NL_GROUND_GRADING = [
  { requirement: 'Covered standing (min 100)', status: 'pass' as const, notes: '120 covered standing — compliant' },
  { requirement: 'Seated accommodation (min 100 for Step 4)', status: 'pass' as const, notes: '180 seats installed 2024' },
  { requirement: 'Floodlighting (min 180 lux)', status: 'check' as const, notes: 'CHECK OUTSTANDING — lux reading due before inspection' },
  { requirement: 'Hard standing (all round pitch)', status: 'pass' as const, notes: 'Concrete path completed 2023' },
  { requirement: 'Changing rooms (home + away + referee)', status: 'pass' as const, notes: '3 changing rooms, refurbished 2024' },
  { requirement: 'Medical room', status: 'pass' as const, notes: 'Converted store room — equipped' },
  { requirement: 'Disabled access', status: 'check' as const, notes: 'IMPROVEMENT NEEDED — ramp to main stand requires widening' },
  { requirement: 'Turnstiles', status: 'pass' as const, notes: '2 turnstiles operational' },
  { requirement: 'Club bar / refreshments', status: 'pass' as const, notes: 'Licensed clubhouse bar' },
  { requirement: 'Programme issued each home match', status: 'pass' as const, notes: '16-page programme, £2' },
]

const NL_MAINTENANCE = [
  { task: 'Floodlight lux test', priority: 'High' as const, cost: 200, contractor: 'Northern Electricals', status: 'Outstanding' },
  { task: 'Disabled ramp widening', priority: 'High' as const, cost: 1200, contractor: 'J.D. Construction (sponsor)', status: 'Quoted' },
  { task: 'Repaint perimeter barriers', priority: 'Medium' as const, cost: 350, contractor: 'Volunteer day', status: 'Planned — May' },
  { task: 'Dugout roof repair', priority: 'Medium' as const, cost: 400, contractor: 'Local roofer', status: 'Outstanding' },
  { task: 'Bar cellar cooling unit service', priority: 'Low' as const, cost: 150, contractor: 'Northern Refrigeration', status: 'Booked — 10 Apr' },
]

const NL_PITCH_LOG = [
  { date: 'Sat 29 Mar', condition: 'Good' as const, notes: 'Firm, well-drained after dry week', inspector: 'Keith Mellor (groundsman)' },
  { date: 'Sat 22 Mar', condition: 'Playable' as const, notes: 'Soft in places after rain, goalmouths churned', inspector: 'Keith Mellor' },
  { date: 'Sat 15 Mar', condition: 'Good' as const, notes: 'Recovering well, new seed taking', inspector: 'Keith Mellor' },
  { date: 'Sat 1 Mar', condition: 'Poor' as const, notes: 'Heavy rain midweek, standing water in corners. Match went ahead.', inspector: 'Keith Mellor' },
]

// ─── Matchday Data ──────────────────────────────────────────────────────────

const NL_MATCHDAY_CHECKLIST = [
  { task: 'Turnstile operators confirmed', assigned: 'Brian Crossley', status: 'done' as const },
  { task: 'Programme printed and collected', assigned: 'Sandra Whitmore', status: 'done' as const },
  { task: 'Bar stocked and staffed', assigned: 'Pete Hargreaves', status: 'done' as const },
  { task: 'First aider confirmed', assigned: 'Dr. Helen Marsh', status: 'done' as const },
  { task: 'Referee confirmed', assigned: 'Match Secretary', status: 'done' as const },
  { task: 'Groundsman pitch inspection done', assigned: 'Keith Mellor', status: 'done' as const },
  { task: 'PA system tested', assigned: 'Dave Crossley', status: 'pending' as const },
  { task: 'Scoreboard operator confirmed', assigned: 'Mike Thornton', status: 'done' as const },
  { task: 'Social media announcement posted', assigned: 'Jess Brennan', status: 'pending' as const },
  { task: 'Visiting club travel info sent', assigned: 'Club Secretary', status: 'done' as const },
]

const NL_ATTENDANCE_LOG = [
  { match: 'vs Colne', date: '16 Aug', attendance: 192 },
  { match: 'vs Glossop NE', date: '30 Aug', attendance: 209 },
  { match: 'vs Trafford', date: '13 Sep', attendance: 225 },
  { match: 'vs Ramsbottom', date: '27 Sep', attendance: 200 },
  { match: 'vs Clitheroe', date: '11 Oct', attendance: 235 },
  { match: 'vs Kidsgrove', date: '25 Oct', attendance: 185 },
  { match: 'vs Widnes', date: '8 Nov', attendance: 256 },
  { match: 'vs Stocksbridge', date: '22 Nov', attendance: 179 },
  { match: 'vs Warrington', date: '6 Dec', attendance: 170 },
  { match: 'vs Hyde United', date: '1 Mar', attendance: 280 },
]

const NL_SOCIAL_TEMPLATES = [
  { type: 'Pre-match', template: 'MATCHDAY | Harfield FC vs {opponent} | {time} KO at Harfield Community Stadium | Adults £8, Concs £4 | Come on the Stags! #HarfieldFC #NonLeague' },
  { type: 'Half-time', template: 'HT | Harfield FC {score} {opponent} | {summary} | #HarfieldFC' },
  { type: 'Full-time', template: 'FT | Harfield FC {score} {opponent} | {scorers} | MOM: {mom} | #HarfieldFC #NPL' },
  { type: 'MOM', template: 'Your Man of the Match, voted by you — {player}! Well played! #HarfieldFC' },
  { type: 'Signing', template: 'SIGNING | We\'re delighted to announce the signing of {player} from {club}. Welcome to the Stags! #HarfieldFC' },
]

// ─── Medical Data ───────────────────────────────────────────────────────────

const NL_INJURIES = [
  { name: 'Chris Platt', injury: 'Calf strain', date: '15 Mar', expectedReturn: '12 Apr', severity: 'Moderate' as const },
  { name: 'Jordan Mellor', injury: 'Knee ligament', date: '8 Mar', expectedReturn: '26 Apr', severity: 'Significant' as const },
]

const NL_FIRST_AID = {
  name: 'Dr. Helen Marsh',
  qualification: 'Emergency First Aid at Work (Level 3)',
  expiry: '30 Sep 2026',
  kitLastChecked: '28 Mar 2026',
  kitNextDue: '11 Apr 2026',
  itemsToRestock: ['Ice packs (2)', 'Sterile dressings (1)', 'Cohesive bandage (1)'],
}

// ─── Safeguarding Data ──────────────────────────────────────────────────────

const NL_DBS = [
  { name: 'Mark Houghton', role: 'Manager', number: 'DBS-NL-001', expiry: '12 Aug 2027', status: 'Valid' as const },
  { name: 'Gary Fielding', role: 'Assistant Manager', number: 'DBS-NL-002', expiry: '5 Nov 2026', status: 'Valid' as const },
  { name: 'Sandra Whitmore', role: 'Club Secretary', number: 'DBS-NL-003', expiry: '20 Mar 2027', status: 'Valid' as const },
  { name: 'Brian Crossley', role: 'Chairman', number: 'DBS-NL-004', expiry: '15 Jun 2027', status: 'Valid' as const },
  { name: 'Pete Hargreaves', role: 'Treasurer', number: 'DBS-NL-005', expiry: '1 Jan 2026', status: 'Expired' as const },
  { name: 'Keith Mellor', role: 'Groundsman', number: 'DBS-NL-006', expiry: '22 Sep 2026', status: 'Valid' as const },
  { name: 'Jess Brennan', role: 'Welfare Officer', number: 'DBS-NL-007', expiry: '14 Apr 2027', status: 'Valid' as const },
  { name: 'Dr. Helen Marsh', role: 'First Aider', number: 'DBS-NL-008', expiry: '30 Sep 2027', status: 'Valid' as const },
]

const NL_SAFEGUARDING_INCIDENTS: { date: string; type: string; severity: 'low' | 'medium' | 'high'; reportedTo: string; outcome: string }[] = [
  { date: '12 Feb', type: 'Spectator abuse towards match official', severity: 'medium', reportedTo: 'Jess Brennan', outcome: 'Warning issued, reported to FA' },
]

// ─── Committee Data ─────────────────────────────────────────────────────────

const NL_COMMITTEE = [
  { name: 'Brian Crossley', role: 'Chairman', phone: '07700 600001', email: 'chairman@harfieldfc.example' },
  { name: 'Dave Hurst', role: 'Vice-Chairman', phone: '07700 600002', email: 'vicechairman@harfieldfc.example' },
  { name: 'Sandra Whitmore', role: 'Secretary', phone: '07700 600003', email: 'secretary@harfieldfc.example' },
  { name: 'Pete Hargreaves', role: 'Treasurer', phone: '07700 600004', email: 'treasurer@harfieldfc.example' },
  { name: 'Alan Morley', role: 'Fixture Secretary', phone: '07700 600005', email: 'fixtures@harfieldfc.example' },
  { name: 'Jess Brennan', role: 'Welfare Officer', phone: '07700 600006', email: 'welfare@harfieldfc.example' },
  { name: 'Mike Thornton', role: 'Commercial Manager', phone: '07700 600007', email: 'commercial@harfieldfc.example' },
  { name: 'Keith Mellor', role: 'Groundsman', phone: '07700 600008', email: 'ground@harfieldfc.example' },
  { name: 'Tom Whitmore (Jnr)', role: 'Programme Editor', phone: '07700 600009', email: 'programme@harfieldfc.example' },
]

const NL_KEY_CONTACTS = [
  { role: 'League Secretary', name: 'David Booth', org: 'Northern Premier League' },
  { role: 'County FA', name: 'Lancashire FA', org: 'County FA Office, Leyland' },
  { role: 'FA Regional Manager', name: 'Sarah Chadwick', org: 'Football Association' },
]

// ─── Comms Templates ────────────────────────────────────────────────────────

const NL_COMMS_TEMPLATES = [
  { label: 'Match fee reminder', text: 'Hi {name}, just a reminder that match fees of £{amount} are due from last Saturday. Please transfer to the club account or bring cash to training. Cheers, gaffer.' },
  { label: 'Training — full squad needed', text: 'Training Thursday 7:30pm — full squad needed ahead of the {opponent} game. No excuses lads, big week.' },
  { label: 'Signing announcement', text: 'Delighted to announce the signing of {player} from {club}. {player} is a {position} who brings {quality}. Welcome to Harfield FC!' },
  { label: 'Programme notes', text: 'Good afternoon and welcome to Harfield Community Stadium for today\'s game against {opponent}. {notes}' },
  { label: 'Match preview', text: 'MATCH PREVIEW | {opponent} visit the Harfield Community Stadium this Saturday, 3pm KO. {preview}' },
  { label: 'Post-match', text: 'FT: Harfield FC {score} {opponent}. {summary}. Next up: {next}.' },
  { label: 'Volunteer needed', text: 'We need a {role} for Saturday\'s match against {opponent}. If you can help, contact the club. Every volunteer makes a difference!' },
]

// ─── Weather & Briefing ─────────────────────────────────────────────────────

const NL_WEATHER = [
  { day: 'Wed 2 Apr', icon: Sun, temp: '13°C', wind: '10mph', rain: '5%', condition: 'Clear' },
  { day: 'Thu 3 Apr', icon: CloudRain, temp: '11°C', wind: '14mph', rain: '55%', condition: 'Showers' },
  { day: 'Fri 4 Apr', icon: Sun, temp: '12°C', wind: '8mph', rain: '15%', condition: 'Partly cloudy' },
  { day: 'Sat 5 Apr', icon: Sun, temp: '14°C', wind: '6mph', rain: '10%', condition: 'Fine' },
  { day: 'Sun 6 Apr', icon: CloudRain, temp: '10°C', wind: '16mph', rain: '70%', condition: 'Rain' },
]

const NL_MORNING_BRIEFING = `Morning. Squad news: Brennan passed fit after Thursday's training. Fletcher still doubtful — decision Friday. FA Vase 3rd round draw — you're away at Stocksbridge PS if you beat Redbourne. Ground grading inspection in 14 days — floodlights check outstanding. Match fees due to 6 players from last week. Harfield Brewery sponsorship renewal — decision needed by end of month.`

const NL_ACTIVITY_FEED = [
  { name: 'Result logged — W 2-1 vs Hyde United', status: 'completed' as const, ts: '1 Mar, 17:15' },
  { name: 'Owen Bright signed on loan — Bolton Wanderers', status: 'completed' as const, ts: '15 Jan, 10:00' },
  { name: 'Match fees paid — 6 players outstanding', status: 'pending' as const, ts: '30 Mar, 09:00' },
  { name: 'Availability sent — Redbourne Town (H)', status: 'completed' as const, ts: '31 Mar, 08:00' },
  { name: 'Ground grading inspection — 14 days', status: 'running' as const, ts: '15 Apr, scheduled' },
]

const NL_FORM_LAST5 = ['W', 'D', 'L', 'W', 'W'] as const

// ─── Tactics Data ───────────────────────────────────────────────────────────

const NL_FORMATION_442 = [
  { name: 'Calloway', x: 170, y: 460 },
  { name: 'Morley', x: 60, y: 380 }, { name: 'Prescott', x: 130, y: 390 }, { name: 'Cartwright', x: 210, y: 390 }, { name: 'Okonkwo', x: 280, y: 380 },
  { name: 'Walsh', x: 60, y: 280 }, { name: 'Brennan', x: 130, y: 290 }, { name: 'Whitmore', x: 210, y: 290 }, { name: 'Webb', x: 280, y: 280 },
  { name: 'Grady', x: 130, y: 180 }, { name: 'Simcox', x: 210, y: 180 },
]

const NL_LAST_FORMATIONS = [
  { match: 'vs Hyde United (H)', formation: '4-4-2', result: 'W 2-1' },
  { match: 'vs Radcliffe (A)', formation: '4-3-3', result: 'D 1-1' },
  { match: 'vs Warrington (H)', formation: '4-4-2', result: 'W 4-0' },
]

// ─── Helper Components ──────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: string; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <div className="rounded-xl p-3 flex flex-col gap-2" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, minHeight: 90 }}>
      <span className="text-xs truncate" style={{ color: TEXT_SEC }}>{label}</span>
      <div className="flex items-center justify-between w-full">
        <div>
          <div className="text-2xl font-bold" style={{ color: TEXT }}>{value}</div>
          {sub && <div className="text-[10px] mt-0.5" style={{ color: TEXT_SEC }}>{sub}</div>}
        </div>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}1a` }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: `${color}1a`, color }}>{children}</span>
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <p className="text-sm font-semibold" style={{ color: TEXT }}>{title}</p>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function WFStatusBadge({ status }: { status: string }) {
  const c = status === 'completed' ? '#22C55E' : status === 'running' ? '#3B82F6' : status === 'overdue' ? '#EF4444' : GOLD
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: `${c}1a`, color: c }}>
    {status === 'running' && <Loader2 size={8} className="animate-spin" />}{status}
  </span>
}

// ─── Pitch SVG ──────────────────────────────────────────────────────────────

function NLPitchFormation({ players }: { players: { name: string; x: number; y: number }[] }) {
  return (
    <svg viewBox="0 0 340 500" className="w-full max-w-sm mx-auto" style={{ maxHeight: 420 }}>
      <rect x="0" y="0" width="340" height="500" rx="8" fill="#15803D" stroke="#22C55E" strokeWidth="2" />
      <rect x="20" y="20" width="300" height="460" fill="none" stroke="#22C55E55" strokeWidth="1" />
      <line x1="20" y1="250" x2="320" y2="250" stroke="#22C55E55" strokeWidth="1" />
      <circle cx="170" cy="250" r="50" fill="none" stroke="#22C55E55" strokeWidth="1" />
      <rect x="95" y="20" width="150" height="60" fill="none" stroke="#22C55E55" strokeWidth="1" />
      <rect x="95" y="420" width="150" height="60" fill="none" stroke="#22C55E55" strokeWidth="1" />
      <rect x="120" y="20" width="100" height="30" fill="none" stroke="#22C55E55" strokeWidth="1" />
      <rect x="120" y="450" width="100" height="30" fill="none" stroke="#22C55E55" strokeWidth="1" />
      {players.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="16" fill="#fff" stroke={PRIMARY} strokeWidth="2" />
          <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="7" fontWeight="700" fill={BG}>{p.name.split(' ').pop()}</text>
        </g>
      ))}
    </svg>
  )
}

// ─── NL Overview View (v2 modular grid) ─────────────────────────────────────

function NLMatchBriefPanel({ T, accent, open, onClose }: { T: typeof THEMES.dark; accent: typeof NL_ACCENT; open: boolean; onClose: () => void }) {
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
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: T.text }}>Harfield FC <span style={{ color: T.text3, fontWeight: 400 }}>vs</span> Thornvale United</h2>
            <div style={{ fontSize: 11.5, color: T.text2, marginTop: 4 }}>National League South · MD-28</div>
            <div style={{ fontSize: 11.5, color: T.text3, marginTop: 1 }}>Sat 03 May 2026 · Harfield Community Stadium · Kick-off 15:00</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text2, cursor: 'pointer', padding: '6px 12px', fontSize: 11 }}>Close</button>
        </div>

        <Section title="01 · Conditions">
          <div><strong style={{ color: T.text }}>Weather:</strong> 11°C, heavy rain overnight, 15 mph SW wind. Light drizzle expected through KO.</div>
          <div><strong style={{ color: T.text }}>Pitch:</strong> Heavy after rain — pitch inspection 09:00. Likely playable but boggy in the goalmouths.</div>
          <div><strong style={{ color: T.text }}>3G backup:</strong> Ridgefield Stadium 3G confirmed available if waterlogged. Switch decision by 11:30.</div>
          <div><strong style={{ color: T.text }}>Referee:</strong> M. Carter — strict on dissent, cards out for backchat. Brief Brennan + Dunne.</div>
        </Section>

        <Section title="02 · Opposition · Thornvale United">
          <div><strong style={{ color: T.text }}>Form:</strong> W L D W L — inconsistent, 8th in NLS. <strong style={{ color: T.text }}>Formation:</strong> 5-3-2 deep block.</div>
          <div style={{ marginTop: 8, color: T.text }}>Key players:</div>
          <ul style={{ marginTop: 4, paddingLeft: 22 }}>
            <li>Striker <strong>R. Pollard</strong> — 12 league goals, dangerous on the counter, weak in the air.</li>
            <li>Midfielder <strong>L. Banks</strong> — sets the tempo, takes set-pieces left-foot.</li>
            <li>RB <strong>C. Doyle</strong> — overlapping runner, susceptible to pace down his side.</li>
          </ul>
          <div style={{ marginTop: 8 }}><strong style={{ color: T.text }}>Set piece threat:</strong> Tall back five — they target near post on corners. Aerial discipline non-negotiable.</div>
        </Section>

        <Section title="03 · Our Team News">
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li><strong style={{ color: T.text }}>3 unavailable:</strong> Platt (calf), Mellor (knee), Nash (suspended) — call-ups: Jenkins + Osei from reserves.</li>
            <li><strong style={{ color: T.text }}>Fletcher:</strong> doubt — illness mid-week, fitness test 10:30. Walsh ready to start if needed.</li>
            <li><strong style={{ color: T.text }}>Trialists:</strong> Hughes available for bench — first competitive match-day involvement.</li>
            <li><strong style={{ color: T.text }}>Captain:</strong> Brennan to start, Cartwright vice.</li>
          </ul>
        </Section>

        <Section title="04 · Tactical Plan">
          <ol style={{ paddingLeft: 22, margin: 0, listStyle: 'decimal' }}>
            <li>Patient build-up vs their deep block — switch the play, don't commit too many forward.</li>
            <li>Set pieces — 31% of our goals come from these. Three rehearsed routines, target back post.</li>
            <li>Defend their counter — track Pollard, Brennan to drop deep when we lose ball.</li>
            <li>Aerial discipline at corners — Dunne and Prescott on near + far post zones.</li>
          </ol>
        </Section>

        <Section title="05 · Matchday Logistics">
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li>Kit prep: Steve to load home strip into changing rooms by 12:00. Sponsor banner Crown Wagers up by 12:30.</li>
            <li>Referee confirmed: M. Carter + assistants. Pre-match meet 14:15.</li>
            <li>Programme printed: 200 copies, sold by Brian on the gate from 13:30. Pricing £2.</li>
            <li>Bar stock confirmed: 4 kegs, light snacks. Committee on bar rotation.</li>
            <li>Local press: Northbridge Sentinel pre-match quote needed by 12:00 for Sunday paper.</li>
          </ul>
        </Section>

        <div style={{ paddingTop: 14, borderTop: `1px solid ${T.border}`, fontSize: 10, color: T.text3, fontFamily: 'monospace', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' }}>
          Generated by Lumio · Match intelligence · Confidential
        </div>
      </div>
    </div>
  )
}

// ─── Getting Started ────────────────────────────────────────────────────────

const NL_ONBOARDING_ITEMS = [
  'Set up your club profile',
  'Add your squad (20 players)',
  'Add upcoming fixtures',
  'Set up budget tracker',
  'Configure matchday revenue tracking',
  'Connect GPS tracking (Johan Sports)',
  'Set up committee contacts',
  'Upload pitch booking schedule',
  'Add sponsor details',
  'Invite volunteers & staff',
]

function NLGettingStartedView() {
  const PRIMARY = '#D97706'
  const [onboarding, setOnboarding] = useState<boolean[]>(() => {
    try { const s = typeof window !== 'undefined' ? localStorage.getItem('lumio_nonleague_onboarding') : null; return s ? JSON.parse(s) : Array(10).fill(false) } catch { return Array(10).fill(false) }
  })
  const toggleOnboarding = (idx: number) => {
    const next = [...onboarding]; next[idx] = !next[idx]; setOnboarding(next)
    try { localStorage.setItem('lumio_nonleague_onboarding', JSON.stringify(next)); if (next.every(Boolean)) localStorage.setItem('nonleague_getting_started_seen', '1') } catch {}
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Rocket size={22} style={{ color: PRIMARY }} />
        <div>
          <h2 className="text-xl font-black" style={{ color: TEXT }}>Getting Started</h2>
          <p className="text-sm mt-0.5" style={{ color: TEXT_SEC }}>Complete these 10 steps to set up your club</p>
        </div>
      </div>
      <div className="space-y-2">
        {NL_ONBOARDING_ITEMS.map((item, idx) => (
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
      <div className="mt-4 p-3 rounded-xl text-xs" style={{ backgroundColor: `${PRIMARY}15`, border: `1px solid ${PRIMARY}30` }}>
        <span style={{ color: PRIMARY }} className="font-semibold">{onboarding.filter(Boolean).length}/10 complete</span>
        <span className="text-gray-500 ml-2">— {onboarding.every(Boolean) ? 'All done! Switch to Overview.' : 'Keep going, you\'re doing great!'}</span>
      </div>
    </div>
  )
}

function NLOverviewView({ onToast, userName: _userName }: { onToast: (m: string) => void; userName?: string }) {
  const T       = THEMES.dark
  const accent  = NL_ACCENT
  const density = DENSITY.regular
  const greeting = v2GetGreeting('matchday')

  const [openFixture, setOpenFixture] = useState<NlFixture | null>(null)
  const [cmdOpen,     setCmdOpen]     = useState(false)
  const [askOpen,     setAskOpen]     = useState(false)
  const [briefOpen,   setBriefOpen]   = useState(false)
  const [dashToast,   showDashToast]  = useV2Toast()
  useV2Key('cmdk', () => setCmdOpen(o => !o))

  const QUICK_ACTIONS = [
    { id: 'teamsheet',  label: 'Confirm team sheet',   icon: '📋', ai: false, onClick: () => showDashToast('Team sheet sent to league') },
    { id: 'matchprep',  label: 'Match brief',          icon: '🎯', ai: true,  onClick: () => setBriefOpen(true) },
    { id: 'asklumio',   label: 'Ask Lumio',            icon: '✨', ai: true,  onClick: () => setAskOpen(true) },
    { id: 'pitchcheck', label: 'Pitch inspection',     icon: '🌧️', ai: false, onClick: () => onToast('Pitch inspection logged') },
    { id: 'log-injury', label: 'Log Injury',           icon: '⚕️',  ai: false, onClick: () => onToast('Injury logger ready') },
    { id: 'matchfees',  label: 'Match Fees',           icon: '🧾', ai: false, onClick: () => onToast('Match fees · 16 outstanding') },
    { id: 'sponsor',    label: 'Sponsor Post',         icon: '📱', ai: true,  onClick: () => onToast('Sponsor post drafted') },
    { id: 'press',      label: 'Press Quote',          icon: '📣', ai: true,  onClick: () => onToast('Press quote drafted') },
    { id: 'budget',     label: 'Budget Review',        icon: '💷', ai: false, onClick: () => onToast('Budget review opened') },
    { id: 'minibus',    label: 'Minibus rota',         icon: '🚐', ai: false, onClick: () => onToast('Minibus rota — 2 drivers signed up') },
    { id: 'volunteers', label: 'Volunteer Rota',       icon: '👥', ai: false, onClick: () => onToast('Volunteer rota · 6/8 confirmed') },
  ]

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
          <NlHeroToday
            T={T} accent={accent} density={density} greeting={greeting}
            onTodaysBriefing={() => showDashToast("Today's briefing — see Morning Roundup")}
            onMatchdayOps={() => showDashToast('Matchday ops — open Matchday from sidebar')}
            onAsk={() => setAskOpen(true)}
          />
          <NlTodaySchedule T={T} accent={accent} density={density} />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {QUICK_ACTIONS.map((a, i) => (
            <button key={i} onClick={a.onClick}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accent.hex; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2d3139'; e.currentTarget.style.color = '#9CA3AF' }}
              style={{
                appearance: 'none', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 8,
                background: 'transparent', border: '1px solid #2d3139',
                color: '#9CA3AF', fontSize: 12, fontFamily: V2_FONT, cursor: 'pointer',
                transition: 'border-color .12s, color .12s',
              }}>
              <span style={{ fontSize: 13 }}>{a.icon}</span>
              <span>{a.label}</span>
              {a.ai && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#1F2937', color: '#6B7280', fontWeight: 700, letterSpacing: '0.04em' }}>AI</span>}
            </button>
          ))}
        </div>

        <NlStatTiles T={T} accent={accent} density={density} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
          <NlAIBriefMod T={T} accent={accent} density={density} onAsk={() => setAskOpen(true)} />
          <NlInboxMod   T={T} accent={accent} density={density} />
          <NlSquadModule T={T} accent={accent} density={density} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
          <NlFixturesMod T={T} accent={accent} density={density} onPick={f => setOpenFixture(f)} />
          <NlPerfMod     T={T} accent={accent} density={density} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
          <NlRecentsMod T={T} accent={accent} density={density} />
          <NlSeasonMod  T={T} accent={accent} density={density} />
        </div>

        <div style={{ padding: '6px 0 8px', display: 'flex', gap: 14, fontSize: 10.5, color: T.text3, justifyContent: 'center' }}>
          <span>⌘K command palette</span><span>·</span><span>esc close overlays</span>
        </div>
      </div>

      <V2CommandPalette T={T} accent={accent} open={cmdOpen} onClose={() => setCmdOpen(false)} onAskLumio={() => { setCmdOpen(false); setAskOpen(true) }} />
      <V2AskLumio       T={T} accent={accent} open={askOpen} onClose={() => setAskOpen(false)} sport="nonleague" />
      <V2FixtureDrawer  T={T} accent={accent} fixture={openFixture as unknown as never} onClose={() => setOpenFixture(null)} />
      <V2Toast          T={T} accent={accent} msg={dashToast} />
      <NLMatchBriefPanel T={T} accent={accent} open={briefOpen} onClose={() => setBriefOpen(false)} />
    </>
  )
}

// ─── NL Squad View ──────────────────────────────────────────────────────────

function NLSquadView() {
  const [selected, setSelected] = useState<NLPlayer | null>(null)
  const [tab, setTab] = useState<'roster' | 'depth' | 'targets' | 'trialists' | 'released'>('roster')

  const positionOrder = ['GK', 'RB', 'CB', 'LB', 'CDM', 'CM', 'AM', 'RW', 'LW', 'ST']
  const sortedSquad = [...NL_SQUAD].sort((a, b) => positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Squad Size" value="23" icon={Users} color={PRIMARY} />
        <StatCard label="FA Registered" value={String(NL_SQUAD.filter(p => p.faRegistered).length)} icon={CheckCircle2} color="#22C55E" />
        <StatCard label="Injured" value={String(NL_SQUAD.filter(p => p.injured).length)} icon={Heart} color="#EF4444" />
        <StatCard label="Top Scorer" value="Grady (14)" icon={Target} color={PRIMARY} />
      </div>

      <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: CARD_BG }}>
        {(['roster', 'depth', 'targets', 'trialists', 'released'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize"
            style={{ backgroundColor: tab === t ? PRIMARY : 'transparent', color: tab === t ? '#fff' : TEXT_SEC }}>{t}</button>
        ))}
      </div>

      {tab === 'roster' && (
        <SectionCard title="Player Register" action={<span className="text-xs" style={{ color: TEXT_SEC }}>23 players</span>}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr style={{ color: TEXT_SEC, borderBottom: `1px solid ${BORDER}` }}>
                <th className="text-left py-2 px-1">#</th><th className="text-left py-2">Name</th><th className="text-left py-2">Pos</th><th className="text-left py-2">Age</th>
                <th className="text-left py-2">Contract</th><th className="text-left py-2">Fee</th><th className="text-center py-2">Reg</th>
                <th className="text-right py-2">Apps</th><th className="text-right py-2">G</th><th className="text-right py-2">A</th><th className="text-right py-2">YC</th>
              </tr></thead>
              <tbody>
                {sortedSquad.map(p => (
                  <tr key={p.number} className="cursor-pointer hover:opacity-80" style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT }} onClick={() => setSelected(p)}>
                    <td className="py-2 px-1 font-mono" style={{ color: TEXT_SEC }}>{p.number}</td>
                    <td className="py-2 font-medium">{p.name}{p.injured && <span className="ml-1 text-red-400">*</span>}{p.suspended && <span className="ml-1 text-yellow-400">S</span>}</td>
                    <td className="py-2" style={{ color: TEXT_SEC }}>{p.position}</td>
                    <td className="py-2" style={{ color: TEXT_SEC }}>{p.age}</td>
                    <td className="py-2"><Badge color={p.contractType === 'Seasonal' ? '#22C55E' : p.contractType === 'Loan' ? '#3B82F6' : TEXT_SEC}>{p.contractType}</Badge></td>
                    <td className="py-2" style={{ color: TEXT_SEC }}>{p.matchFee > 0 ? `£${p.matchFee}` : 'Loan'}</td>
                    <td className="py-2 text-center">{p.faRegistered ? <Check size={12} style={{ color: '#22C55E' }} /> : <X size={12} style={{ color: '#EF4444' }} />}</td>
                    <td className="py-2 text-right">{p.apps}</td>
                    <td className="py-2 text-right" style={{ color: p.goals > 0 ? '#22C55E' : TEXT_SEC }}>{p.goals}</td>
                    <td className="py-2 text-right">{p.assists}</td>
                    <td className="py-2 text-right" style={{ color: p.yc > 4 ? '#EF4444' : TEXT_SEC }}>{p.yc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {tab === 'depth' && (
        <SectionCard title="Squad Depth by Position">
          <div className="space-y-2">
            {['GK', 'RB', 'CB', 'LB', 'CDM', 'CM', 'AM', 'RW', 'LW', 'ST'].map(pos => {
              const players = NL_SQUAD.filter(p => p.position === pos)
              const isThin = players.length <= 1
              return (
                <div key={pos} className="flex items-center gap-3 py-1.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <span className="text-xs font-bold w-8" style={{ color: isThin ? '#EF4444' : TEXT }}>{pos}</span>
                  <div className="flex gap-1 flex-wrap flex-1">
                    {players.map(p => (
                      <span key={p.number} className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: p.injured ? '#EF44441a' : p.suspended ? `${GOLD}1a` : `${PRIMARY}1a`, color: p.injured ? '#EF4444' : p.suspended ? GOLD : PRIMARY }}>
                        {p.name.split(' ').pop()}{p.injured ? ' (INJ)' : p.suspended ? ' (SUS)' : ''}
                      </span>
                    ))}
                  </div>
                  {isThin && <Badge color="#EF4444">LOW</Badge>}
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}

      {tab === 'targets' && (
        <SectionCard title="Player Targets">
          <div className="space-y-3">
            {NL_PLAYER_TARGETS.map((t, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: TEXT }}>{t.player}</span>
                  <span className="text-xs" style={{ color: TEXT_SEC }}>{t.target}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${PRIMARY}1a` }}>
                  <div className="h-full rounded-full" style={{ backgroundColor: PRIMARY, width: `${(t.current / t.total) * 100}%` }} />
                </div>
                <div className="flex justify-between mt-1 text-[10px]" style={{ color: TEXT_SEC }}>
                  <span>{t.current} / {t.total}</span>
                  <span>{Math.round((t.current / t.total) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'trialists' && (
        <SectionCard title="Trialists Tracker">
          <div className="space-y-0">
            {NL_TRIALISTS.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div>
                  <span className="font-medium" style={{ color: TEXT }}>{t.name}</span>
                  <p style={{ color: TEXT_SEC }}>{t.position} · From: {t.from} · {t.trialMatches} trial match{t.trialMatches > 1 ? 'es' : ''}</p>
                </div>
                <Badge color={t.recommendation.startsWith('Sign') ? '#22C55E' : GOLD}>{t.recommendation.split('—')[0].trim()}</Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'released' && (
        <SectionCard title="Released Players — This Season">
          <div className="space-y-0">
            {NL_RELEASED.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div>
                  <span className="font-medium" style={{ color: TEXT }}>{r.name}</span>
                  <p style={{ color: TEXT_SEC }}>{r.position} · To: {r.to} · {r.date}</p>
                </div>
                <span className="text-xs" style={{ color: TEXT_SEC }}>{r.reason}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Player Profile Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-sm font-bold" style={{ color: TEXT }}>#{selected.number} {selected.name}</p>
              <button onClick={() => setSelected(null)} style={{ color: TEXT_SEC }}><X size={16} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span style={{ color: TEXT_SEC }}>Position:</span> <span style={{ color: TEXT }}>{selected.position}</span></div>
                <div><span style={{ color: TEXT_SEC }}>Age:</span> <span style={{ color: TEXT }}>{selected.age}</span></div>
                <div><span style={{ color: TEXT_SEC }}>Signed from:</span> <span style={{ color: TEXT }}>{selected.signedFrom}</span></div>
                <div><span style={{ color: TEXT_SEC }}>Contract:</span> <span style={{ color: TEXT }}>{selected.contractType}</span></div>
                <div><span style={{ color: TEXT_SEC }}>Match fee:</span> <span style={{ color: TEXT }}>{selected.matchFee > 0 ? `£${selected.matchFee}` : 'Loan (parent club)'}</span></div>
                <div><span style={{ color: TEXT_SEC }}>Travel:</span> <span style={{ color: TEXT }}>£{selected.travelAllowance}</span></div>
                <div><span style={{ color: TEXT_SEC }}>FA Registered:</span> <span style={{ color: '#22C55E' }}>Yes</span></div>
              </div>
              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
                <p className="text-xs font-semibold mb-2" style={{ color: TEXT_SEC }}>Season Stats</p>
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  {[['Apps', selected.apps], ['Goals', selected.goals], ['Assists', selected.assists], ['YC', selected.yc], ['RC', selected.rc]].map(([l, v]) => (
                    <div key={String(l)} className="p-2 rounded-lg" style={{ backgroundColor: BG }}>
                      <div className="font-bold" style={{ color: TEXT }}>{v}</div>
                      <div style={{ color: TEXT_SEC }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              {selected.strengths && (
                <div className="p-2 rounded-lg text-xs" style={{ backgroundColor: '#22C55E1a', color: '#22C55E' }}>
                  <CheckCircle2 size={12} className="inline mr-1" />Strengths: {selected.strengths}
                </div>
              )}
              {selected.weaknesses && (
                <div className="p-2 rounded-lg text-xs" style={{ backgroundColor: '#EF44441a', color: '#EF4444' }}>
                  <AlertCircle size={12} className="inline mr-1" />Weaknesses: {selected.weaknesses}
                </div>
              )}
              {selected.injured && (
                <div className="p-2 rounded-lg text-xs" style={{ backgroundColor: '#EF44441a', color: '#EF4444' }}>
                  <Heart size={12} className="inline mr-1" />Injured: {selected.injuryNote}
                </div>
              )}
              {selected.suspended && (
                <div className="p-2 rounded-lg text-xs" style={{ backgroundColor: `${GOLD}1a`, color: GOLD }}>
                  <AlertTriangle size={12} className="inline mr-1" />Suspended — accumulated yellow cards
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── NL Fixtures & Cups View ────────────────────────────────────────────────

function NLFixturesView() {
  const [tab, setTab] = useState<'fixtures' | 'league' | 'cups' | 'stats'>('fixtures')
  const played = NL_FIXTURES.filter(f => f.result)
  const wins = played.filter(f => f.result.startsWith('W')).length
  const draws = played.filter(f => f.result.startsWith('D')).length
  const losses = played.filter(f => f.result.startsWith('L')).length
  const homeGames = played.filter(f => f.ha === 'H')
  const awayGames = played.filter(f => f.ha === 'A')
  const homeWins = homeGames.filter(f => f.result.startsWith('W')).length
  const awayWins = awayGames.filter(f => f.result.startsWith('W')).length

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: CARD_BG }}>
        {(['fixtures', 'league', 'cups', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize"
            style={{ backgroundColor: tab === t ? PRIMARY : 'transparent', color: tab === t ? '#fff' : TEXT_SEC }}>{t === 'stats' ? 'Stats' : t}</button>
        ))}
      </div>

      {tab === 'fixtures' && (
        <SectionCard title="Season Fixtures — Northern Premier League West">
          <div className="space-y-0">
            {NL_FIXTURES.map((f, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-2">
                  <Badge color={f.ha === 'H' ? PRIMARY : '#3B82F6'}>{f.ha}</Badge>
                  <span style={{ color: TEXT }}>{f.opponent}</span>
                </div>
                <div className="flex items-center gap-3">
                  {f.result ? (
                    <span className="font-mono font-bold" style={{ color: f.result.startsWith('W') ? '#22C55E' : f.result.startsWith('D') ? GOLD : '#EF4444' }}>{f.result}</span>
                  ) : (
                    <span style={{ color: TEXT_SEC }}>{f.time}</span>
                  )}
                  <span style={{ color: TEXT_SEC }}>{f.date}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'league' && (
        <SectionCard title="Northern Premier League West Division — Full Table">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr style={{ color: TEXT_SEC, borderBottom: `1px solid ${BORDER}` }}>
                <th className="text-left py-2 w-6">#</th><th className="text-left py-2">Team</th>
                <th className="text-center py-2">P</th><th className="text-center py-2">W</th><th className="text-center py-2">D</th><th className="text-center py-2">L</th>
                <th className="text-center py-2">GF</th><th className="text-center py-2">GA</th><th className="text-center py-2">GD</th><th className="text-center py-2 font-bold">Pts</th>
              </tr></thead>
              <tbody>
                {NL_LEAGUE_TABLE.map(r => (
                  <tr key={r.pos} style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: r.team === 'Harfield FC' ? `${PRIMARY}1a` : 'transparent' }}>
                    <td className="py-2" style={{ color: TEXT_SEC }}>{r.pos}</td>
                    <td className="py-2 font-medium" style={{ color: r.team === 'Harfield FC' ? PRIMARY : TEXT }}>{r.team}</td>
                    <td className="py-2 text-center" style={{ color: TEXT_SEC }}>{r.p}</td>
                    <td className="py-2 text-center" style={{ color: TEXT }}>{r.w}</td>
                    <td className="py-2 text-center" style={{ color: TEXT }}>{r.d}</td>
                    <td className="py-2 text-center" style={{ color: TEXT }}>{r.l}</td>
                    <td className="py-2 text-center" style={{ color: TEXT_SEC }}>{r.gf}</td>
                    <td className="py-2 text-center" style={{ color: TEXT_SEC }}>{r.ga}</td>
                    <td className="py-2 text-center" style={{ color: r.gd >= 0 ? '#22C55E' : '#EF4444' }}>{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                    <td className="py-2 text-center font-bold" style={{ color: TEXT }}>{r.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {tab === 'cups' && (
        <div className="space-y-4">
          {['FA Cup', 'FA Vase', 'County Cup'].map(comp => {
            const fixtures = NL_CUP_FIXTURES.filter(c => c.comp === comp)
            if (fixtures.length === 0) return null
            return (
              <SectionCard key={comp} title={comp}>
                <div className="space-y-0">
                  {fixtures.map((c, i) => (
                    <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <div>
                        <span className="font-medium" style={{ color: TEXT }}>{c.round}</span>
                        <span className="ml-2" style={{ color: TEXT_SEC }}>vs {c.opponent}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.result ? <Badge color="#22C55E">{c.result}</Badge> : <Badge color={GOLD}>Upcoming</Badge>}
                        <span style={{ color: TEXT_SEC }}>{c.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )
          })}
          <SectionCard title="FA Vase 3rd Round Draw">
            <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: BG }}>
              <p style={{ color: TEXT }}>If Harfield FC beat Redbourne Town:</p>
              <p className="font-semibold mt-1" style={{ color: PRIMARY }}>Away at Stocksbridge Park Steels</p>
              <p className="mt-1" style={{ color: TEXT_SEC }}>Date TBC — November</p>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard label="Played" value={String(played.length)} icon={Calendar} color={PRIMARY} />
            <StatCard label="Record" value={`${wins}W ${draws}D ${losses}L`} icon={TrendingUp} color="#22C55E" />
            <StatCard label="Home" value={`${homeWins}W of ${homeGames.length}`} icon={Home} color={PRIMARY} />
            <StatCard label="Away" value={`${awayWins}W of ${awayGames.length}`} icon={MapPin} color="#3B82F6" />
          </div>

          <SectionCard title="Goals by Time Period">
            <svg viewBox="0 0 400 120" className="w-full">
              {[
                { label: '0-15', goals: 5 }, { label: '16-30', goals: 8 }, { label: '31-45', goals: 6 },
                { label: '46-60', goals: 7 }, { label: '61-75', goals: 9 }, { label: '76-90', goals: 7 },
              ].map((d, i) => {
                const barHeight = (d.goals / 10) * 80
                return (
                  <g key={i}>
                    <rect x={20 + i * 65} y={100 - barHeight} width="40" height={barHeight} rx="4" fill={PRIMARY} opacity={0.8} />
                    <text x={40 + i * 65} y={112} textAnchor="middle" fontSize="9" fill={TEXT_SEC}>{d.label}</text>
                    <text x={40 + i * 65} y={95 - barHeight} textAnchor="middle" fontSize="9" fill={TEXT} fontWeight="700">{d.goals}</text>
                  </g>
                )
              })}
            </svg>
          </SectionCard>

          <SectionCard title="Home vs Away Split">
            <div className="grid grid-cols-2 gap-4 text-center text-xs">
              <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
                <p className="font-semibold mb-2" style={{ color: PRIMARY }}>Home</p>
                <div className="grid grid-cols-3 gap-2">
                  <div><div className="font-bold text-lg" style={{ color: '#22C55E' }}>{homeWins}</div><div style={{ color: TEXT_SEC }}>W</div></div>
                  <div><div className="font-bold text-lg" style={{ color: GOLD }}>{homeGames.filter(f => f.result.startsWith('D')).length}</div><div style={{ color: TEXT_SEC }}>D</div></div>
                  <div><div className="font-bold text-lg" style={{ color: '#EF4444' }}>{homeGames.filter(f => f.result.startsWith('L')).length}</div><div style={{ color: TEXT_SEC }}>L</div></div>
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
                <p className="font-semibold mb-2" style={{ color: '#3B82F6' }}>Away</p>
                <div className="grid grid-cols-3 gap-2">
                  <div><div className="font-bold text-lg" style={{ color: '#22C55E' }}>{awayWins}</div><div style={{ color: TEXT_SEC }}>W</div></div>
                  <div><div className="font-bold text-lg" style={{ color: GOLD }}>{awayGames.filter(f => f.result.startsWith('D')).length}</div><div style={{ color: TEXT_SEC }}>D</div></div>
                  <div><div className="font-bold text-lg" style={{ color: '#EF4444' }}>{awayGames.filter(f => f.result.startsWith('L')).length}</div><div style={{ color: TEXT_SEC }}>L</div></div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  )
}

// ─── NL Training View ───────────────────────────────────────────────────────

function NLTrainingView() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        <StatCard label="Sessions / Week" value="3" icon={Target} color={PRIMARY} />
        <StatCard label="Avg Attendance" value="16" icon={Users} color="#22C55E" sub="of 23 squad" />
        <StatCard label="Next Session" value="Tue 7:30pm" icon={Clock} color="#3B82F6" />
      </div>

      <SectionCard title="This Week's Training">
        <div className="space-y-3">
          {NL_TRAINING.map((s, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: TEXT }}>{s.day} — {s.time}</p>
                  <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>{s.venue}</p>
                  <p className="text-xs mt-0.5" style={{ color: PRIMARY }}>{s.topic}</p>
                </div>
                <Badge color={s.status === 'confirmed' ? '#22C55E' : GOLD}>{s.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Player Attendance — Last 4 Sessions">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ color: TEXT_SEC, borderBottom: `1px solid ${BORDER}` }}>
              <th className="text-left py-2">Player</th><th className="text-center py-2">Tue 25</th><th className="text-center py-2">Thu 27</th><th className="text-center py-2">Tue 1</th><th className="text-center py-2">Thu 3</th><th className="text-right py-2">%</th>
            </tr></thead>
            <tbody>
              {NL_SQUAD.filter(p => !p.injured).slice(0, 12).map((p, i) => {
                const att = [true, i % 3 !== 0, true, i % 2 === 0]
                const pct = Math.round((att.filter(Boolean).length / 4) * 100)
                return (
                  <tr key={p.number} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td className="py-1.5 font-medium" style={{ color: TEXT }}>{p.name.split(' ').pop()}</td>
                    {att.map((a, j) => (
                      <td key={j} className="py-1.5 text-center">
                        <div className="w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: a ? '#22C55E' : '#EF4444' }} />
                      </td>
                    ))}
                    <td className="py-1.5 text-right" style={{ color: pct >= 75 ? '#22C55E' : pct >= 50 ? GOLD : '#EF4444' }}>{pct}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}

// ─── NL Tactics View ────────────────────────────────────────────────────────

function NLTacticsView() {
  const [showTeamTalk, setShowTeamTalk] = useState(false)

  return (
    <div className="space-y-4">
      <SectionCard title="Current Formation — 4-4-2" action={<Badge color={PRIMARY}>vs Redbourne Town (H)</Badge>}>
        <NLPitchFormation players={NL_FORMATION_442} />
        <div className="mt-3 p-3 rounded-lg text-xs" style={{ backgroundColor: `${PRIMARY}0d`, border: `1px solid ${PRIMARY}33` }}>
          <Sparkles size={12} className="inline mr-1" style={{ color: PRIMARY }} />
          <span style={{ color: TEXT }}>Fletcher doubtful — Walsh starts RW. Bright available from bench. Prescott and Cartwright centre-back pairing; Dunne cover. Brennan to screen back four.</span>
        </div>
      </SectionCard>

      <SectionCard title="Style & Approach">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
            <p className="font-semibold mb-1" style={{ color: TEXT }}>Playing Style</p>
            <p style={{ color: TEXT_SEC }}>Direct, physical, exploit set pieces. Quick transitions on the counter through pace of Webb and Fletcher/Walsh.</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
            <p className="font-semibold mb-1" style={{ color: TEXT }}>Opposition Notes — Redbourne Town</p>
            <p style={{ color: TEXT_SEC }}>Sit deep, play on the break. Dangerous 9 (Jordan Ellis, 10 goals). Weak at set pieces — target Prescott and Dunne.</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Set Piece Routines">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
            <p className="font-semibold mb-1" style={{ color: PRIMARY }}>Corners — Near Post</p>
            <p style={{ color: TEXT_SEC }}>Webb delivers inswinger. Prescott near post flick. Grady lurks back post. Brennan edge of box.</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
            <p className="font-semibold mb-1" style={{ color: PRIMARY }}>Free Kicks — Direct</p>
            <p style={{ color: TEXT_SEC }}>Webb takes all within 25 yards. Whitmore and Brennan stand over — Whitmore dummy run over ball.</p>
          </div>
        </div>
      </SectionCard>

      <button onClick={() => setShowTeamTalk(!showTeamTalk)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: PRIMARY, color: '#fff' }}>
        <Clipboard size={12} className="inline mr-1" />Team Talk Planner
      </button>

      {showTeamTalk && (
        <SectionCard title="Team Talk Planner — vs Redbourne Town">
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
              <p className="font-semibold mb-1" style={{ color: '#22C55E' }}>Pre-Match</p>
              <textarea className="w-full mt-1 px-3 py-2 rounded-lg text-sm" rows={2} style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, color: TEXT }} defaultValue="Big game lads. Win this and we're in the Vase 3rd round. They'll sit deep — be patient, work the channels, get crosses in. Prescott, Dunne — dominate set pieces." />
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
              <p className="font-semibold mb-1" style={{ color: GOLD }}>Half-Time (adjust based on score)</p>
              <textarea className="w-full mt-1 px-3 py-2 rounded-lg text-sm" rows={2} style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, color: TEXT }} defaultValue="If winning: control the game, don't give them hope. If losing: push Rooney on, more width, stretch them." />
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
              <p className="font-semibold mb-1" style={{ color: '#3B82F6' }}>Post-Match</p>
              <textarea className="w-full mt-1 px-3 py-2 rounded-lg text-sm" rows={2} style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, color: TEXT }} defaultValue="" placeholder="Post-match notes..." />
            </div>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Last 3 Match Formations">
        <div className="space-y-0">
          {NL_LAST_FORMATIONS.map((f, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ color: TEXT }}>{f.match}</span>
              <div className="flex items-center gap-2">
                <Badge color={PRIMARY}>{f.formation}</Badge>
                <span className="font-mono font-bold" style={{ color: f.result.startsWith('W') ? '#22C55E' : f.result.startsWith('D') ? GOLD : '#EF4444' }}>{f.result}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── NL Medical View ────────────────────────────────────────────────────────

function NLMedicalView() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Injured" value={String(NL_INJURIES.length)} icon={Heart} color="#EF4444" />
        <StatCard label="Suspended" value={String(NL_SQUAD.filter(p => p.suspended).length)} icon={AlertTriangle} color={GOLD} />
        <StatCard label="Fit for Selection" value={String(NL_SQUAD.filter(p => !p.injured && !p.suspended).length)} icon={CheckCircle2} color="#22C55E" />
        <StatCard label="Concussion Protocol" value="0" icon={Shield} color="#3B82F6" sub="None active" />
      </div>

      <SectionCard title="Injury Log">
        <div className="space-y-0">
          {NL_INJURIES.map((inj, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{inj.name}</span>
                <p style={{ color: '#EF4444' }}>{inj.injury} — since {inj.date}</p>
                <p style={{ color: TEXT_SEC }}>Expected return: {inj.expectedReturn}</p>
              </div>
              <Badge color={inj.severity === 'Significant' ? '#EF4444' : GOLD}>{inj.severity}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Player Fitness RAG Status">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {NL_SQUAD.map(p => {
            const rag = p.injured ? '#EF4444' : p.suspended ? GOLD : p.availability === 'maybe' ? GOLD : '#22C55E'
            return (
              <div key={p.number} className="flex items-center gap-2 py-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: rag }} />
                <span className="text-xs" style={{ color: TEXT }}>{p.name.split(' ').pop()}</span>
              </div>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard title="First Aider Details">
        <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: BG }}>
          <p className="font-medium" style={{ color: TEXT }}>{NL_FIRST_AID.name}</p>
          <p style={{ color: TEXT_SEC }}>{NL_FIRST_AID.qualification}</p>
          <p style={{ color: TEXT_SEC }}>Qualification expiry: {NL_FIRST_AID.expiry}</p>
        </div>
      </SectionCard>

      <SectionCard title="First Aid Kit Check">
        <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: BG }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: TEXT }}>Last checked: {NL_FIRST_AID.kitLastChecked}</span>
            <Badge color="#22C55E">OK</Badge>
          </div>
          <p style={{ color: TEXT_SEC }}>Next due: {NL_FIRST_AID.kitNextDue}</p>
          {NL_FIRST_AID.itemsToRestock.length > 0 && (
            <div className="mt-2">
              <p className="font-semibold mb-1" style={{ color: GOLD }}>Items to restock:</p>
              {NL_FIRST_AID.itemsToRestock.map((item, i) => (
                <p key={i} style={{ color: TEXT_SEC }}>• {item}</p>
              ))}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── NL Transfers & Recruitment View ────────────────────────────────────────

function NLTransfersView() {
  const [tab, setTab] = useState<'signings' | 'released' | 'targets' | 'loans' | 'windows'>('signings')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Signings" value={String(NL_SIGNINGS.length)} icon={UserPlus} color="#22C55E" />
        <StatCard label="Released" value={String(NL_RELEASED.length)} icon={X} color="#EF4444" />
        <StatCard label="Loan Players" value={String(NL_LOAN_PLAYERS.length)} icon={Users} color="#3B82F6" />
        <StatCard label="Targets" value={String(NL_TRANSFER_TARGETS.length)} icon={Eye} color={PRIMARY} />
      </div>

      <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: CARD_BG }}>
        {(['signings', 'released', 'targets', 'loans', 'windows'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize"
            style={{ backgroundColor: tab === t ? PRIMARY : 'transparent', color: tab === t ? '#fff' : TEXT_SEC }}>{t}</button>
        ))}
      </div>

      {tab === 'signings' && (
        <SectionCard title="Transfer Register — Signings This Season">
          <div className="space-y-0">
            {NL_SIGNINGS.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div>
                  <span className="font-medium" style={{ color: TEXT }}>{s.name}</span>
                  <p style={{ color: TEXT_SEC }}>From: {s.from} · Signed: {s.date}</p>
                </div>
                <div className="text-right">
                  <Badge color={s.fee === 'Free' || s.fee === 'Loan' ? '#22C55E' : GOLD}>{s.fee}</Badge>
                  <p className="mt-0.5 text-[10px]" style={{ color: TEXT_SEC }}>Reg: {s.regDate}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'released' && (
        <SectionCard title="Players Released This Season">
          <div className="space-y-0">
            {NL_RELEASED.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div>
                  <span className="font-medium" style={{ color: TEXT }}>{r.name}</span>
                  <p style={{ color: TEXT_SEC }}>{r.position} · To: {r.to}</p>
                </div>
                <div className="text-right">
                  <span style={{ color: TEXT_SEC }}>{r.reason}</span>
                  <p className="text-[10px]" style={{ color: TEXT_SEC }}>{r.date}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'targets' && (
        <SectionCard title="Transfer Targets">
          <div className="space-y-3">
            {NL_TRANSFER_TARGETS.map((t, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: TEXT }}>{t.name}</span>
                  <Badge color={t.status === 'Contact made' ? '#22C55E' : GOLD}>{t.status}</Badge>
                </div>
                <p className="text-xs" style={{ color: TEXT_SEC }}>{t.position} · {t.currentClub} · Age {t.age}</p>
                <p className="text-xs mt-1" style={{ color: TEXT_SEC }}>{t.notes}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'loans' && (
        <SectionCard title="Loan Players">
          <div className="space-y-0">
            {NL_LOAN_PLAYERS.map((l, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div>
                  <span className="font-medium" style={{ color: TEXT }}>{l.name}</span>
                  <p style={{ color: TEXT_SEC }}>From: {l.parentClub} · {l.position}</p>
                </div>
                <div className="text-right">
                  <p style={{ color: TEXT_SEC }}>Until: {l.loanUntil}</p>
                  <p style={{ color: TEXT_SEC }}>{l.apps} apps, {l.goals} goals</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'windows' && (
        <div className="space-y-4">
          <SectionCard title="Transfer Window Status">
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
                <div className="flex items-center justify-between">
                  <span className="font-medium" style={{ color: TEXT }}>Non-League Transfer Window</span>
                  <Badge color="#22C55E">OPEN</Badge>
                </div>
                <p className="mt-1" style={{ color: TEXT_SEC }}>Non-league clubs can register players at any time outside of the EFL transfer windows. Monthly registration deadlines apply.</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
                <div className="flex items-center justify-between">
                  <span className="font-medium" style={{ color: TEXT }}>Next FA Registration Deadline</span>
                  <span style={{ color: GOLD }}>15 Apr 2026</span>
                </div>
                <p className="mt-1" style={{ color: TEXT_SEC }}>New signings must be registered by this date to be eligible for matches from 19 Apr onwards.</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
                <div className="flex items-center justify-between">
                  <span className="font-medium" style={{ color: TEXT }}>Season Cut-off</span>
                  <span style={{ color: '#EF4444' }}>31 Mar 2026</span>
                </div>
                <p className="mt-1" style={{ color: TEXT_SEC }}>No new registrations after 31 March for this season&apos;s league matches. Cup competitions may have different deadlines.</p>
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  )
}

// ─── NL Finance View ────────────────────────────────────────────────────────

function NLFinanceView() {
  const totalIncome = NL_INCOME.reduce((s, i) => s + i.amount, 0)
  const totalExpenditure = NL_EXPENDITURE.reduce((s, e) => s + e.amount, 0)
  const surplus = totalIncome - totalExpenditure
  const totalGate = NL_GATE_LOG.reduce((s, g) => s + g.gate, 0)
  const totalBar = NL_GATE_LOG.reduce((s, g) => s + g.bar, 0)
  const avgAttendance = Math.round(NL_GATE_LOG.reduce((s, g) => s + g.adults + g.concessions + g.seasonTickets, 0) / NL_GATE_LOG.length)
  const totalSponsorship = NL_SPONSORS.reduce((s, sp) => s + sp.value, 0)
  const weeklyWageBill = Math.round(NL_SQUAD.reduce((s, p) => s + p.matchFee, 0) * 1.5)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Season Income" value={`£${(totalIncome / 1000).toFixed(1)}k`} icon={TrendingUp} color="#22C55E" />
        <StatCard label="Season Spend" value={`£${(totalExpenditure / 1000).toFixed(1)}k`} icon={DollarSign} color="#EF4444" />
        <StatCard label="Surplus/Deficit" value={`${surplus >= 0 ? '+' : ''}£${(surplus / 1000).toFixed(1)}k`} icon={Activity} color={surplus >= 0 ? '#22C55E' : '#EF4444'} />
        <StatCard label="Avg Gate" value={`£${Math.round(totalGate / NL_GATE_LOG.length)}`} icon={Users} color={PRIMARY} sub={`${avgAttendance} avg attendance`} />
      </div>

      {/* P&L Dashboard */}
      <SectionCard title="Season P&L Dashboard">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#22C55E' }}>Income — £{totalIncome.toLocaleString()}</p>
            <div className="space-y-1.5">
              {NL_INCOME.map((inc, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] w-28 truncate" style={{ color: TEXT_SEC }}>{inc.category}</span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ backgroundColor: '#22C55E1a' }}>
                    <div className="h-full rounded-full flex items-center px-1.5" style={{ backgroundColor: '#22C55E', width: `${Math.min(100, (inc.amount / 20000) * 100)}%` }}>
                      <span className="text-[8px] font-bold text-white whitespace-nowrap">£{inc.amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#EF4444' }}>Expenditure — £{totalExpenditure.toLocaleString()}</p>
            <div className="space-y-1.5">
              {NL_EXPENDITURE.map((exp, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] w-28 truncate" style={{ color: TEXT_SEC }}>{exp.category}</span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ backgroundColor: '#EF44441a' }}>
                    <div className="h-full rounded-full flex items-center px-1.5" style={{ backgroundColor: '#EF4444', width: `${Math.min(100, (exp.amount / 20000) * 100)}%` }}>
                      <span className="text-[8px] font-bold text-white whitespace-nowrap">£{exp.amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Gate Receipt Log */}
      <SectionCard title="Match-by-Match Gate Receipts" action={<span className="text-xs" style={{ color: TEXT_SEC }}>Total gate: £{totalGate.toLocaleString()}</span>}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ color: TEXT_SEC, borderBottom: `1px solid ${BORDER}` }}>
              <th className="text-left py-2">Match</th><th className="text-right py-2">Adults</th><th className="text-right py-2">Conc</th><th className="text-right py-2">ST</th><th className="text-right py-2">Gate £</th><th className="text-right py-2">Bar £</th>
            </tr></thead>
            <tbody>
              {NL_GATE_LOG.map((g, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT }}>
                  <td className="py-2">{g.match}</td>
                  <td className="py-2 text-right" style={{ color: TEXT_SEC }}>{g.adults}</td>
                  <td className="py-2 text-right" style={{ color: TEXT_SEC }}>{g.concessions}</td>
                  <td className="py-2 text-right" style={{ color: TEXT_SEC }}>{g.seasonTickets}</td>
                  <td className="py-2 text-right font-mono">£{g.gate}</td>
                  <td className="py-2 text-right font-mono" style={{ color: TEXT_SEC }}>£{g.bar}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="py-2" style={{ color: TEXT }}>Total</td>
                <td className="py-2 text-right" colSpan={3}></td>
                <td className="py-2 text-right font-mono" style={{ color: TEXT }}>£{totalGate.toLocaleString()}</td>
                <td className="py-2 text-right font-mono" style={{ color: TEXT_SEC }}>£{totalBar.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Sponsorship Tracker */}
      <SectionCard title="Sponsorship Tracker" action={<span className="text-xs" style={{ color: GOLD }}>Total: £{totalSponsorship.toLocaleString()}</span>}>
        <div className="space-y-0">
          {NL_SPONSORS.map((sp, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{sp.name}</span>
                <p style={{ color: TEXT_SEC }}>{sp.type} — {sp.what}</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold" style={{ color: GOLD }}>£{sp.value.toLocaleString()}</span>
                <p className="text-[10px]" style={{ color: TEXT_SEC }}>Exp: {sp.expiry}</p>
                <Badge color={sp.renewal === 'Renewed' || sp.renewal === 'Active' ? '#22C55E' : GOLD}>{sp.renewal}</Badge>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Player Wage Bill */}
      <SectionCard title="Player Match Fee Commitment" action={<span className="text-xs" style={{ color: TEXT_SEC }}>~£{weeklyWageBill}/match day</span>}>
        <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: BG }}>
          <p style={{ color: TEXT }}>Total squad match fees per game: ~£{NL_SQUAD.reduce((s, p) => s + p.matchFee, 0)} (all 23)</p>
          <p style={{ color: TEXT_SEC }}>Typical matchday: 16 players × £40 avg = ~£640</p>
          <p style={{ color: TEXT_SEC }}>Season total (28 games): ~£{(640 * 28).toLocaleString()}</p>
          <p className="mt-2" style={{ color: TEXT_SEC }}>Biggest earner: Liam Grady (£55/game)</p>
          <p style={{ color: TEXT_SEC }}>Loan players (Nash, Bright): £0 — parent clubs cover wages</p>
        </div>
      </SectionCard>

      {/* Budget vs Actual Chart */}
      <SectionCard title="Budget vs Actual — Key Categories">
        <svg viewBox="0 0 500 160" className="w-full">
          {NL_BUDGET_VS_ACTUAL.map((d, i) => {
            const maxVal = 20000
            const budgetW = (d.budget / maxVal) * 200
            const actualW = (d.actual / maxVal) * 200
            const y = 10 + i * 24
            return (
              <g key={i}>
                <text x="0" y={y + 10} fontSize="9" fill={TEXT_SEC}>{d.cat}</text>
                <rect x="100" y={y} width={budgetW} height="8" rx="3" fill="#3B82F633" />
                <rect x="100" y={y + 10} width={actualW} height="8" rx="3" fill={d.actual > d.budget ? '#EF4444' : '#22C55E'} />
                <text x={105 + Math.max(budgetW, actualW)} y={y + 14} fontSize="8" fill={TEXT_SEC}>B:£{(d.budget / 1000).toFixed(0)}k A:£{(d.actual / 1000).toFixed(0)}k</text>
              </g>
            )
          })}
          <g>
            <rect x="100" y={155} width="8" height="8" rx="2" fill="#3B82F633" />
            <text x="112" y={162} fontSize="8" fill={TEXT_SEC}>Budget</text>
            <rect x="160" y={155} width="8" height="8" rx="2" fill="#22C55E" />
            <text x="172" y={162} fontSize="8" fill={TEXT_SEC}>Actual (under)</text>
            <rect x="240" y={155} width="8" height="8" rx="2" fill="#EF4444" />
            <text x="252" y={162} fontSize="8" fill={TEXT_SEC}>Actual (over)</text>
          </g>
        </svg>
      </SectionCard>
    </div>
  )
}

// ─── NL Ground & Facilities View ────────────────────────────────────────────

function NLGroundView() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Capacity" value="1,200" icon={Users} color={PRIMARY} sub="180 seated" />
        <StatCard label="Avg Attendance" value={String(Math.round(NL_ATTENDANCE_LOG.reduce((s, a) => s + a.attendance, 0) / NL_ATTENDANCE_LOG.length))} icon={TrendingUp} color="#22C55E" />
        <StatCard label="Record" value="280" icon={Star} color={GOLD} sub="vs Hyde United" />
        <StatCard label="Inspection" value="14 days" icon={AlertTriangle} color="#EF4444" sub="Ground grading" />
      </div>

      {/* Ground Grading */}
      <SectionCard title="Ground Grading Status — Step 4 Grade H" action={<Badge color={GOLD}>Inspection: 15 Apr</Badge>}>
        <div className="space-y-0">
          {NL_GROUND_GRADING.map((g, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ color: TEXT }}>{g.requirement}</span>
              <div className="flex items-center gap-2">
                {g.status === 'pass' ? (
                  <Badge color="#22C55E">PASS</Badge>
                ) : (
                  <Badge color={GOLD}>CHECK</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2 rounded-lg text-xs" style={{ backgroundColor: '#EF44441a', color: '#EF4444' }}>
          <AlertTriangle size={12} className="inline mr-1" />2 items outstanding — floodlight lux test + disabled ramp widening. Must be resolved before 15 Apr inspection.
        </div>
      </SectionCard>

      {/* Ground Details */}
      <SectionCard title="Harfield Community Stadium">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
            <p className="font-semibold mb-1" style={{ color: TEXT }}>Capacity Breakdown</p>
            <p style={{ color: TEXT_SEC }}>Total capacity: 1,200</p>
            <p style={{ color: TEXT_SEC }}>Seated: 180 (main stand)</p>
            <p style={{ color: TEXT_SEC }}>Covered standing: 120 (home end)</p>
            <p style={{ color: TEXT_SEC }}>Open standing: 900</p>
            <p style={{ color: TEXT_SEC }}>Disabled spaces: 4</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
            <p className="font-semibold mb-1" style={{ color: TEXT }}>Facilities</p>
            <p style={{ color: TEXT_SEC }}>3 changing rooms (home, away, referee)</p>
            <p style={{ color: TEXT_SEC }}>Licensed clubhouse bar</p>
            <p style={{ color: TEXT_SEC }}>Tea bar (matchdays)</p>
            <p style={{ color: TEXT_SEC }}>2 turnstiles</p>
            <p style={{ color: TEXT_SEC }}>PA system, scoreboard</p>
          </div>
        </div>
      </SectionCard>

      {/* Pitch Condition Log */}
      <SectionCard title="Pitch Condition Log" action={<span className="text-xs" style={{ color: TEXT_SEC }}>Groundsman: Keith Mellor</span>}>
        <div className="space-y-0">
          {NL_PITCH_LOG.map((p, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{p.date}</span>
                <p style={{ color: TEXT_SEC }}>{p.notes}</p>
              </div>
              <Badge color={p.condition === 'Good' ? '#22C55E' : p.condition === 'Playable' ? GOLD : '#EF4444'}>{p.condition}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Maintenance Log */}
      <SectionCard title="Maintenance Log">
        <div className="space-y-0">
          {NL_MAINTENANCE.map((m, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{m.task}</span>
                <p style={{ color: TEXT_SEC }}>{m.contractor} · Est. £{m.cost}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={m.priority === 'High' ? '#EF4444' : m.priority === 'Medium' ? GOLD : TEXT_SEC}>{m.priority}</Badge>
                <span className="text-[10px]" style={{ color: TEXT_SEC }}>{m.status}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Floodlight Usage */}
      <SectionCard title="Floodlight Usage">
        <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: BG }}>
          <p style={{ color: TEXT }}>Sessions this season: 16 evening sessions</p>
          <p style={{ color: TEXT_SEC }}>Estimated electricity cost: £2,400 (£150/session avg)</p>
          <p style={{ color: TEXT_SEC }}>4 × 1500W metal halide floodlight pylons</p>
          <p className="mt-2" style={{ color: GOLD }}>Lux reading due before 15 Apr inspection — Northern Electricals booked</p>
        </div>
      </SectionCard>
    </div>
  )
}

// ─── NL Safeguarding View ───────────────────────────────────────────────────

function NLSafeguardingView() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        <StatCard label="DBS Valid" value={`${NL_DBS.filter(d => d.status === 'Valid').length}/${NL_DBS.length}`} icon={Shield} color="#22C55E" />
        <StatCard label="DBS Expired" value={String(NL_DBS.filter(d => d.status === 'Expired').length)} icon={AlertCircle} color="#EF4444" />
        <StatCard label="Open Incidents" value={String(NL_SAFEGUARDING_INCIDENTS.length)} icon={AlertTriangle} color={GOLD} />
      </div>

      <SectionCard title="DBS Tracker">
        <div className="space-y-0">
          {NL_DBS.map((d, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{d.name}</span>
                <p style={{ color: TEXT_SEC }}>{d.role} · {d.number}</p>
              </div>
              <div className="text-right">
                <Badge color={d.status === 'Valid' ? '#22C55E' : '#EF4444'}>{d.status}</Badge>
                <p className="mt-0.5 text-[10px]" style={{ color: TEXT_SEC }}>Exp: {d.expiry}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Welfare Officer">
        <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: BG }}>
          <p className="font-medium" style={{ color: TEXT }}>Jess Brennan — Club Welfare Officer</p>
          <p style={{ color: TEXT_SEC }}>Phone: 07700 600006 · welfare@harfieldfc.example</p>
          <p className="mt-1" style={{ color: TEXT_SEC }}>FA Safeguarding Level 2 qualified. Available all matchdays and training sessions.</p>
        </div>
      </SectionCard>

      <SectionCard title="Safeguarding Policy">
        <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: BG }}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium" style={{ color: TEXT }}>Club Safeguarding Policy v3.1</span>
            <Badge color="#22C55E">Current</Badge>
          </div>
          <p style={{ color: TEXT_SEC }}>Last reviewed: August 2025</p>
          <p style={{ color: TEXT_SEC }}>Next review due: August 2026</p>
          <p style={{ color: TEXT_SEC }}>Approved by: FA County Office</p>
        </div>
      </SectionCard>

      <SectionCard title="Incident Log" action={<Badge color="#EF4444">Restricted</Badge>}>
        <div className="space-y-0">
          {NL_SAFEGUARDING_INCIDENTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{s.type}</span>
                <p style={{ color: TEXT_SEC }}>Reported to: {s.reportedTo} · {s.date}</p>
                <p style={{ color: TEXT_SEC }}>{s.outcome}</p>
              </div>
              <Badge color={s.severity === 'low' ? '#22C55E' : s.severity === 'medium' ? GOLD : '#EF4444'}>{s.severity}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── NL Matchday View ───────────────────────────────────────────────────────

function NLMatchdayView({ onToast }: { onToast: (m: string) => void }) {
  const [tab, setTab] = useState<'checklist' | 'programme' | 'gate' | 'draw' | 'attendance' | 'social'>('checklist')
  const avgAtt = Math.round(NL_ATTENDANCE_LOG.reduce((s, a) => s + a.attendance, 0) / NL_ATTENDANCE_LOG.length)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Next Home Match" value="Sat 5 Apr" icon={Calendar} color={PRIMARY} sub="vs Redbourne Town" />
        <StatCard label="Avg Attendance" value={String(avgAtt)} icon={Users} color="#22C55E" />
        <StatCard label="Season Gate" value={`£${NL_GATE_LOG.reduce((s, g) => s + g.gate, 0).toLocaleString()}`} icon={DollarSign} color={GOLD} />
        <StatCard label="Checklist" value={`${NL_MATCHDAY_CHECKLIST.filter(c => c.status === 'done').length}/${NL_MATCHDAY_CHECKLIST.length}`} icon={CheckCircle2} color="#22C55E" />
      </div>

      <div className="flex gap-1 p-1 rounded-lg flex-wrap" style={{ backgroundColor: CARD_BG }}>
        {(['checklist', 'programme', 'gate', 'draw', 'attendance', 'social'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize"
            style={{ backgroundColor: tab === t ? PRIMARY : 'transparent', color: tab === t ? '#fff' : TEXT_SEC }}>{t}</button>
        ))}
      </div>

      {tab === 'checklist' && (
        <SectionCard title="Matchday Checklist — vs Redbourne Town (H)">
          <div className="space-y-0">
            {NL_MATCHDAY_CHECKLIST.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-2">
                  {c.status === 'done' ? <CheckCircle2 size={14} style={{ color: '#22C55E' }} /> : <CircleDot size={14} style={{ color: GOLD }} />}
                  <span style={{ color: TEXT }}>{c.task}</span>
                </div>
                <span style={{ color: TEXT_SEC }}>{c.assigned}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'programme' && (
        <SectionCard title="Programme Builder — vs Redbourne Town">
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
              <p className="font-semibold mb-1" style={{ color: TEXT }}>Manager&apos;s Notes</p>
              <textarea className="w-full mt-1 px-3 py-2 rounded-lg text-sm" rows={3} style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, color: TEXT }} defaultValue="Good afternoon and welcome to the Harfield Community Stadium. A big game for us today — a win keeps us in the promotion conversation and sets up a tasty FA Vase tie at Stocksbridge..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
                <p className="font-semibold mb-1" style={{ color: TEXT }}>Match Stats Preview</p>
                <p style={{ color: TEXT_SEC }}>Harfield: 4th, 47pts, 42GF 29GA</p>
                <p style={{ color: TEXT_SEC }}>Redbourne: 12th, 34pts, 32GF 40GA</p>
                <p style={{ color: TEXT_SEC }}>Last meeting: Harfield won 2-1 (A)</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
                <p className="font-semibold mb-1" style={{ color: TEXT }}>Sponsor Ads</p>
                <p style={{ color: TEXT_SEC }}>Cover: Harfield Brewery</p>
                <p style={{ color: TEXT_SEC }}>Back page: Harfield Fish Bar</p>
                <p style={{ color: TEXT_SEC }}>Centre spread: J.D. Construction</p>
              </div>
            </div>
            <button onClick={() => onToast('Programme sent to printer')} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: PRIMARY, color: '#fff' }}>
              <Printer size={12} className="inline mr-1" />Send to Printer
            </button>
          </div>
        </SectionCard>
      )}

      {tab === 'gate' && (
        <SectionCard title="Gate Income Tracker — vs Redbourne Town">
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
                <p style={{ color: TEXT_SEC }}>Adult (£8)</p>
                <div className="flex items-center gap-2 mt-1">
                  <input type="number" className="w-20 px-2 py-1 rounded text-sm" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, color: TEXT }} defaultValue={180} />
                  <span style={{ color: TEXT }}>= £1,440</span>
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
                <p style={{ color: TEXT_SEC }}>Concession (£4)</p>
                <div className="flex items-center gap-2 mt-1">
                  <input type="number" className="w-20 px-2 py-1 rounded text-sm" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, color: TEXT }} defaultValue={35} />
                  <span style={{ color: TEXT }}>= £140</span>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
              <div className="flex items-center justify-between">
                <span style={{ color: TEXT_SEC }}>Season ticket holders</span>
                <span style={{ color: TEXT }}>22</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                <span className="font-semibold" style={{ color: TEXT }}>Estimated total gate</span>
                <span className="font-mono font-bold" style={{ color: PRIMARY }}>£1,580</span>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {tab === 'draw' && (
        <SectionCard title="Half-Time Draw">
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
                <p style={{ color: TEXT_SEC }}>Tickets sold</p>
                <p className="text-lg font-bold mt-1" style={{ color: TEXT }}>85</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
                <p style={{ color: TEXT_SEC }}>Prize pot (50% of sales)</p>
                <p className="text-lg font-bold mt-1" style={{ color: GOLD }}>£42.50</p>
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
              <p style={{ color: TEXT_SEC }}>Draw at half time by the Chairman</p>
              <p className="mt-1" style={{ color: TEXT }}>Winner: <span style={{ color: GOLD }}>TBC — draw at HT</span></p>
            </div>
          </div>
        </SectionCard>
      )}

      {tab === 'attendance' && (
        <SectionCard title="Attendance Log" action={<span className="text-xs" style={{ color: TEXT_SEC }}>Avg: {avgAtt}</span>}>
          <div className="space-y-0 mb-4">
            {NL_ATTENDANCE_LOG.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ color: TEXT }}>{a.match}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${PRIMARY}1a` }}>
                    <div className="h-full rounded-full" style={{ backgroundColor: PRIMARY, width: `${(a.attendance / 300) * 100}%` }} />
                  </div>
                  <span className="font-mono w-8 text-right" style={{ color: TEXT }}>{a.attendance}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Sparkline */}
          <svg viewBox="0 0 400 60" className="w-full">
            {NL_ATTENDANCE_LOG.map((a, i) => {
              const x = 20 + i * ((400 - 40) / (NL_ATTENDANCE_LOG.length - 1))
              const y = 55 - ((a.attendance - 150) / 150) * 50
              const nextA = NL_ATTENDANCE_LOG[i + 1]
              const nx = nextA ? 20 + (i + 1) * ((400 - 40) / (NL_ATTENDANCE_LOG.length - 1)) : x
              const ny = nextA ? 55 - ((nextA.attendance - 150) / 150) * 50 : y
              return (
                <g key={i}>
                  {nextA && <line x1={x} y1={y} x2={nx} y2={ny} stroke={PRIMARY} strokeWidth="2" />}
                  <circle cx={x} cy={y} r="3" fill={PRIMARY} />
                </g>
              )
            })}
          </svg>
        </SectionCard>
      )}

      {tab === 'social' && (
        <SectionCard title="Matchday Social Media Posts">
          <div className="space-y-3">
            {NL_SOCIAL_TEMPLATES.map((t, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
                <div className="flex items-center justify-between mb-1">
                  <Badge color={PRIMARY}>{t.type}</Badge>
                  <button onClick={() => { navigator.clipboard?.writeText(t.template); onToast('Template copied!') }} className="text-[10px] px-2 py-0.5 rounded" style={{ color: PRIMARY }}>Copy</button>
                </div>
                <p className="text-xs" style={{ color: TEXT_SEC }}>{t.template}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  )
}

// ─── NL Comms View ──────────────────────────────────────────────────────────

function NLCommsView({ onToast }: { onToast: (m: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => onToast('Message composer opened')} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: PRIMARY, color: '#fff' }}>
          <Send size={12} className="inline mr-1" />New Message
        </button>
        <button onClick={() => onToast('Social media scheduler opened')} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, color: TEXT }}>
          <Hash size={12} className="inline mr-1" />Social Scheduler
        </button>
      </div>

      <SectionCard title="Message Templates">
        <div className="space-y-3">
          {NL_COMMS_TEMPLATES.map((t, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: TEXT }}>{t.label}</span>
                <button onClick={() => onToast(`Template "${t.label}" loaded`)} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: `${PRIMARY}1a`, color: PRIMARY }}>Use</button>
              </div>
              <p className="text-xs" style={{ color: TEXT_SEC }}>{t.text}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Sponsor Communication Log">
        <div className="space-y-0">
          {NL_SPONSORS.map((sp, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{sp.name}</span>
                <p style={{ color: TEXT_SEC }}>{sp.type}</p>
              </div>
              <div className="text-right">
                <Badge color={sp.renewal === 'Renewed' || sp.renewal === 'Active' ? '#22C55E' : GOLD}>{sp.renewal}</Badge>
                <p className="text-[10px] mt-0.5" style={{ color: TEXT_SEC }}>Exp: {sp.expiry}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Press Release Builder">
        <div className="space-y-3 text-xs">
          <div className="flex gap-2 flex-wrap">
            {['Signing Announcement', 'Result Report', 'Community Event', 'Sponsor Welcome'].map(type => (
              <button key={type} onClick={() => onToast(`${type} template loaded`)} className="px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT_SEC }}>{type}</button>
            ))}
          </div>
          <textarea className="w-full px-3 py-2 rounded-lg text-sm" rows={4} style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }} placeholder="Write your press release here..." />
          <button onClick={() => onToast('Press release saved')} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: PRIMARY, color: '#fff' }}>Save Draft</button>
        </div>
      </SectionCard>
    </div>
  )
}

// ─── NL Committee View ──────────────────────────────────────────────────────

function NLCommitteeView() {
  return (
    <div className="space-y-4">
      <SectionCard title="Committee Members">
        <div className="space-y-0">
          {NL_COMMITTEE.map((c, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{c.name}</span>
                <p style={{ color: PRIMARY }}>{c.role}</p>
              </div>
              <div className="text-right">
                <p style={{ color: TEXT_SEC }}>{c.phone}</p>
                <p style={{ color: TEXT_SEC }}>{c.email}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Key Contacts">
        <div className="space-y-0">
          {NL_KEY_CONTACTS.map((c, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{c.role}</span>
                <p style={{ color: TEXT_SEC }}>{c.name}</p>
              </div>
              <span style={{ color: TEXT_SEC }}>{c.org}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Meeting Minutes">
        <div className="space-y-0">
          {[
            { date: '25 Mar 2026', topic: 'Monthly committee meeting — ground grading prep, sponsor renewals, end of season plans', attendees: 8 },
            { date: '25 Feb 2026', topic: 'Monthly committee meeting — January transfer window review, finance update, floodlight quotes', attendees: 7 },
            { date: '28 Jan 2026', topic: 'Emergency meeting — Owen Bright loan paperwork, disabled access improvement', attendees: 5 },
          ].map((m, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{m.date}</span>
                <p style={{ color: TEXT_SEC }}>{m.topic}</p>
              </div>
              <span style={{ color: TEXT_SEC }}>{m.attendees} present</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Club Documents">
        <div className="space-y-0">
          {[
            { name: 'Club Constitution', status: 'Current', updated: 'Aug 2025' },
            { name: 'Safeguarding Policy v3.1', status: 'Current', updated: 'Aug 2025' },
            { name: 'Ground Grading File', status: 'Under review', updated: 'Mar 2026' },
            { name: 'Insurance Certificate', status: 'Current', updated: 'Jul 2025' },
            { name: 'FA Affiliation', status: 'Current', updated: 'Aug 2025' },
            { name: 'Safety Certificate', status: 'Current', updated: 'Sep 2025' },
          ].map((d, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2">
                <FileText size={14} style={{ color: PRIMARY }} />
                <span style={{ color: TEXT }}>{d.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={d.status === 'Current' ? '#22C55E' : GOLD}>{d.status}</Badge>
                <span style={{ color: TEXT_SEC }}>{d.updated}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Club Vision (1/3/5/10-year strategic planner) ──────────────────────────

type NLPlanHorizon = '1yr' | '3yr' | '5yr' | '10yr'

function NonLeagueClubVisionView() {
  const [plan, setPlan] = useState<NLPlanHorizon>('1yr')

  const seasonObjectives = [
    { label: 'Top-half finish in current step', progress: 72, status: 'On Track', color: '#22C55E' },
    { label: 'FA Trophy run to Round 3', progress: 55, status: 'In Progress', color: GOLD },
    { label: 'Achieve ground grading at current level', progress: 88, status: 'On Track', color: '#22C55E' },
    { label: 'Grow average attendance by 15%', progress: 64, status: 'On Track', color: '#22C55E' },
  ]

  const recruitmentPlan = [
    { role: 'Striker',  profile: '20+ goal Step 4 striker',                budget: '£8K signing-on, £400/wk', priority: 'High', status: 'Shortlist of 4' },
    { role: 'CB',       profile: 'Experienced, leadership',                 budget: '£6K signing-on, £350/wk', priority: 'High', status: 'Negotiating' },
    { role: 'Winger',   profile: 'U23 with EFL release',                    budget: 'Free + £200/wk',           priority: 'Med',  status: 'Scouting' },
    { role: 'GK',       profile: 'Backup, dual-reg academy partnership',    budget: 'Free',                     priority: 'Low',  status: 'Monitoring' },
  ]

  const keyMilestones = [
    { date: '12 Aug 2025', title: 'FA Ground Grading inspection — current step',         status: '🔄' },
    { date: '06 Sep 2025', title: 'FA Trophy Extra Preliminary Round',                   status: '🎯' },
    { date: '30 Nov 2025', title: 'Main shirt sponsor renewal deadline',                 status: '⚠️' },
    { date: '15 Dec 2025', title: 'AGM — committee + community trust update',            status: '📋' },
    { date: '08 Feb 2026', title: 'FA Trophy Round 3 — target round',                    status: '🏆' },
    { date: '04 Apr 2026', title: 'Step play-off eligibility cut-off',                   status: '🎯' },
    { date: '24 May 2026', title: 'Season-end review + 2026/27 budget sign-off',         status: '📊' },
  ]

  const threeYearPlan = [
    { t: 'Promotion ambition', items: ['Step 4 → Step 3 progression with promotion challenge in years 2–3', 'Maintain top-half finishes; play-off contention by year 2', 'FA Trophy: regular Round 3 / 4 appearances'] },
    { t: 'Squad evolution',    items: ['Transition from semi-pro to part-time professional model by end of year 2', 'Establish academy / youth pathway (U18, U16 teams)', 'Average squad age target: 24–26'] },
    { t: 'Infrastructure',     items: ['Full ground grading compliance for one step above current', 'Floodlight upgrade to LED, 250 lux minimum', 'Clubhouse modernisation: family room, accessible viewing', 'Pitch surface evaluation (3G / hybrid / drainage)'] },
    { t: 'Commercial',         items: ['Average attendance target: +50% over 3 years', 'Main shirt sponsor: 5-figure annual deal by year 3', 'Match-day revenue per fixture: doubled from baseline', 'Community trust / foundation launch'] },
  ]

  const fiveYearPlan = [
    { t: 'National League ambition', items: ['Target: National League North / South by year 5', 'Full-time professional squad transition complete', 'Manager and coaching staff full-time'] },
    { t: 'Stadium development',      items: ['Capacity to 3,500 (covered standing + family stand)', '4G or hybrid pitch installed', 'Training ground purchased or long-term leased', 'Disabled access compliant with EFL standards'] },
    { t: 'Squad and operations',     items: ['Full academy with EFL feeder relationships', 'Sports science: GPS, video analysis, S&C coach', "Women's first team established (or merged with existing)"] },
    { t: 'Financial sustainability', items: ['Match-day, commercial, and academy revenue split target: 40/40/20', 'Owner subsidy reduced to <20% of operating budget', 'EFL grant / Premier League solidarity routes scoped'] },
  ]

  const tenYearPlan = [
    { t: 'EFL ambition',           items: ['Target: EFL League Two by year 10', 'National League promotion sustained, top-half finishes', 'FA Cup Round 3 regular appearances'] },
    { t: 'Stadium and facilities', items: ['Stadium capacity 5,000–7,500 with all-seater conversion plan', 'Owned training ground complex with 3+ pitches', 'Indoor 3G dome / community sports facility'] },
    { t: 'Community and brand',    items: ['Charitable foundation operating across 3+ programmes', 'Schools and grassroots partnerships in 50+ local schools', 'International tour / pre-season fixtures', 'Local heritage and identity preserved through fan-led ownership trust'] },
    { t: 'Financial',              items: ['EFL parachute readiness: cost base controllable in event of relegation', 'Owner exit / community share scheme available'] },
  ]

  const horizons: { id: NLPlanHorizon; label: string }[] = [
    { id: '1yr',  label: '1 Year' },
    { id: '3yr',  label: '3 Year' },
    { id: '5yr',  label: '5 Year' },
    { id: '10yr', label: '10 Year' },
  ]

  return (
    <div className="space-y-5">
      {/* Header + horizon switcher */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: TEXT }}>
          <Rocket size={18} style={{ color: PRIMARY }} /> Club Vision — Harfield FC
        </h2>
        <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>
          Multi-horizon strategic planning · this season through to a decade ahead.
        </p>
      </div>

      <div className="flex gap-2">
        {horizons.map(h => (
          <button key={h.id} onClick={() => setPlan(h.id)}
            className="px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors"
            style={{
              backgroundColor: plan === h.id ? PRIMARY : '#111318',
              color: plan === h.id ? '#fff' : TEXT_SEC,
              border: plan === h.id ? 'none' : `1px solid ${BORDER}`,
            }}>
            {h.label}
          </button>
        ))}
      </div>

      {/* 1 Year */}
      {plan === '1yr' && (
        <div className="space-y-5">
          <div className="rounded-xl p-5" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
            <div className="text-sm font-semibold mb-4" style={{ color: TEXT }}>Season Objectives (2025/26)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {seasonObjectives.map((o, i) => (
                <div key={i} className="rounded-lg p-3" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium" style={{ color: TEXT }}>{o.label}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${o.color}22`, color: o.color, border: `1px solid ${o.color}55` }}>
                      {o.status}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#0a0c14' }}>
                    <div className="h-full rounded-full" style={{ width: `${o.progress}%`, backgroundColor: o.color }} />
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: TEXT_SEC }}>{o.progress}% to target</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
            <div className="px-5 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="text-sm font-semibold" style={{ color: TEXT }}>This Season&apos;s Recruitment Plan</div>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_SEC }}>
                  <th className="text-left px-5 py-2 font-semibold uppercase tracking-wider text-[10px]">Role</th>
                  <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Target Profile</th>
                  <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Budget</th>
                  <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Priority</th>
                  <th className="text-left px-5 py-2 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {recruitmentPlan.map((r, i) => {
                  const pri = r.priority === 'High' ? '#EF4444' : r.priority === 'Med' ? GOLD : TEXT_SEC
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="px-5 py-2.5 font-semibold" style={{ color: TEXT }}>{r.role}</td>
                      <td className="px-3 py-2.5" style={{ color: TEXT_SEC }}>{r.profile}</td>
                      <td className="px-3 py-2.5" style={{ color: TEXT_SEC }}>{r.budget}</td>
                      <td className="px-3 py-2.5"><span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: `${pri}22`, color: pri, border: `1px solid ${pri}55` }}>{r.priority}</span></td>
                      <td className="px-5 py-2.5" style={{ color: TEXT_SEC }}>{r.status}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl p-5" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
            <div className="text-sm font-semibold mb-3" style={{ color: TEXT }}>Key Milestones Timeline</div>
            <div className="space-y-2">
              {keyMilestones.map((m, i) => (
                <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < keyMilestones.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <span className="text-base">{m.status}</span>
                  <span className="text-[11px] font-mono w-24 shrink-0" style={{ color: PRIMARY }}>{m.date}</span>
                  <span className="text-xs" style={{ color: TEXT }}>{m.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3 Year */}
      {plan === '3yr' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-bold" style={{ color: TEXT }}>Three-Year Strategic Plan (2025–2028)</h3>
            <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>Step progression, squad model transition and infrastructure foundation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {threeYearPlan.map((g, gi) => (
              <div key={gi} className="rounded-xl p-5" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
                <div className="text-sm font-semibold mb-3" style={{ color: PRIMARY }}>{g.t}</div>
                <ul className="space-y-2">
                  {g.items.map((it, ii) => (
                    <li key={ii} className="text-xs flex gap-2" style={{ color: TEXT_SEC }}>
                      <span style={{ color: PRIMARY }}>→</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5 Year */}
      {plan === '5yr' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-bold" style={{ color: TEXT }}>Five-Year Vision (2025–2030)</h3>
            <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>National League ambition, full-time transition and self-sustaining commercial mix.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fiveYearPlan.map((g, gi) => (
              <div key={gi} className="rounded-xl p-5" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
                <div className="text-sm font-semibold mb-3" style={{ color: PRIMARY }}>{g.t}</div>
                <ul className="space-y-2">
                  {g.items.map((it, ii) => (
                    <li key={ii} className="text-xs flex gap-2" style={{ color: TEXT_SEC }}>
                      <span style={{ color: PRIMARY }}>→</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10 Year */}
      {plan === '10yr' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-bold" style={{ color: TEXT }}>Ten-Year Vision (2025–2035)</h3>
            <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>EFL ambition, owned facilities, and a fan-led identity that outlasts any one owner.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenYearPlan.map((g, gi) => (
              <div key={gi} className="rounded-xl p-5" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
                <div className="text-sm font-semibold mb-3" style={{ color: PRIMARY }}>{g.t}</div>
                <ul className="space-y-2">
                  {g.items.map((it, ii) => (
                    <li key={ii} className="text-xs flex gap-2" style={{ color: TEXT_SEC }}>
                      <span style={{ color: PRIMARY }}>→</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
            <p className="text-sm italic leading-relaxed" style={{ color: TEXT_SEC }}>&ldquo;Steps don&apos;t lift you — habits do. Decade-out planning is the habit that turns a Step 4 club into an EFL one.&rdquo;</p>
            <p className="text-xs mt-2" style={{ color: PRIMARY }}>— Steve Whitlock, Manager</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Club Profile View ──────────────────────────────────────────────────────

type ClubProfileTab = 'info' | 'history' | 'ground' | 'honours' | 'committee' | 'kit' | 'sponsors' | 'media'

function NLClubProfileView() {
  const [tab, setTab] = useState<ClubProfileTab>('info')

  const tabs: { id: ClubProfileTab; label: string }[] = [
    { id: 'info', label: 'Info' },
    { id: 'history', label: 'History' },
    { id: 'ground', label: 'Ground' },
    { id: 'honours', label: 'Honours' },
    { id: 'committee', label: 'Committee' },
    { id: 'kit', label: 'Kit & Badge' },
    { id: 'sponsors', label: 'Sponsors' },
    { id: 'media', label: 'Media' },
  ]

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap rounded-xl p-1" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: tab === t.id ? PRIMARY : 'transparent',
              color: tab === t.id ? '#fff' : TEXT_SEC,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── INFO TAB ── */}
      {tab === 'info' && (
        <div className="space-y-4">
          {/* Crest */}
          <div className="flex justify-center">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="66" fill={DARK} stroke={GOLD} strokeWidth="3" />
              <circle cx="70" cy="70" r="56" fill="none" stroke={ACCENT} strokeWidth="1" />
              <text x="70" y="62" textAnchor="middle" fill={ACCENT} fontSize="22" fontWeight="bold" fontFamily="serif">H&#183;F&#183;C</text>
              <text x="70" y="84" textAnchor="middle" fill={GOLD} fontSize="13" fontFamily="serif">1887</text>
              <text x="70" y="120" textAnchor="middle" fill={TEXT_SEC} fontSize="8" fontFamily="sans-serif">Pride, Passion, Community</text>
            </svg>
          </div>

          {/* Club Details */}
          <SectionCard title="Club Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {[
                ['Full name', 'Harfield FC'],
                ['Nickname', 'The Amber Army'],
                ['Founded', '1887'],
                ['Ground', 'Harfield Community Stadium'],
                ['Capacity', '1,200 (180 seated)'],
                ['League', 'Northern Premier League West Division (Step 4)'],
                ['FA affiliation', 'West Riding County FA'],
                ['Club colours', 'Amber & Black'],
                ['Home kit', 'Amber shirts, black shorts, amber socks'],
                ['Away kit', 'All black with amber trim'],
                ['WGS Club ID', 'WGS-48821'],
                ['Affiliated since', '1891'],
                ['Club motto', '"Pride, Passion, Community"'],
              ].map(([label, value], i) => (
                <div key={i} className="flex justify-between py-1.5 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ color: TEXT_SEC }}>{label}</span>
                  <span className="font-medium text-right" style={{ color: TEXT }}>{value}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Contact */}
          <SectionCard title="Contact">
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Users size={14} style={{ color: PRIMARY }} />
                <span style={{ color: TEXT }}>Club Secretary — Brian Hartley</span>
              </div>
              <div className="flex items-center gap-2">
                <Send size={14} style={{ color: PRIMARY }} />
                <span style={{ color: GOLD }}>secretary@harfieldfc.co.uk</span>
              </div>
            </div>
          </SectionCard>

          {/* Social Links */}
          <SectionCard title="Social Links">
            <div className="flex gap-3">
              {['Twitter / X', 'Facebook', 'Instagram'].map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: `${PRIMARY}1a`, color: PRIMARY }}>
                  <ExternalLink size={12} />
                  {s}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div className="space-y-4">
          <SectionCard title="Club Timeline">
            <div className="relative pl-6">
              {/* Connecting line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5" style={{ backgroundColor: BORDER }} />
              {[
                { year: '1887', text: 'Club founded by mill workers in Harfield' },
                { year: '1923', text: 'First county cup win' },
                { year: '1967', text: 'Joined Northern League' },
                { year: '1989', text: 'Promoted to Northern Premier League for first time' },
                { year: '1994', text: 'Record attendance: 3,200 vs Bradford City (FA Cup 1st Round)' },
                { year: '2003', text: 'Relegated to county level' },
                { year: '2011', text: 'Promoted back to Step 5' },
                { year: '2019', text: 'Promoted to Step 4 (current level)' },
                { year: '2023', text: 'Ground redevelopment: new seated stand added' },
              ].map((e, i) => (
                <div key={i} className="relative flex items-start gap-3 pb-4">
                  <div className="absolute left-[-20px] top-1 w-3 h-3 rounded-full" style={{ backgroundColor: PRIMARY, border: `2px solid ${GOLD}` }} />
                  <div>
                    <span className="text-xs font-bold" style={{ color: GOLD }}>{e.year}</span>
                    <span className="text-xs ml-2" style={{ color: TEXT }}>{e.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Club Records">
            <div className="space-y-2">
              {[
                ['Record win', '9-0 vs Skelton United (1978)'],
                ['Record defeat', '1-7 vs Farsley Celtic (2001)'],
                ['Record attendance', '3,200'],
                ['Most appearances', 'Terry Booth — 412 (1978-1994)'],
                ['All-time top scorer', 'Mick Hannigan — 187 goals (1983-1995)'],
                ['Current longest-serving', 'Danny Kershaw — 8 seasons'],
              ].map(([label, value], i) => (
                <div key={i} className="flex justify-between py-1.5 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ color: TEXT_SEC }}>{label}</span>
                  <span className="font-medium" style={{ color: TEXT }}>{value}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── GROUND TAB ── */}
      {tab === 'ground' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="rounded-xl p-4" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
            <h2 className="text-sm font-bold" style={{ color: TEXT }}>Harfield Community Stadium</h2>
            <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>Mill Lane, Harfield, HF4 2RR</p>
          </div>

          {/* Facilities grid */}
          <SectionCard title="Facilities">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {[
                { name: 'Main Stand (seated)', cap: '180', ok: true },
                { name: 'Covered terrace (standing)', cap: '600', ok: true },
                { name: 'Open terrace', cap: '420', ok: true },
                { name: 'Floodlights (180 lux)', cap: null, ok: false, warn: 'Inspection due' },
                { name: 'Club bar & function room', cap: null, ok: true },
                { name: 'Home changing rooms', cap: null, ok: true },
                { name: 'Away changing rooms', cap: null, ok: true },
                { name: 'Referee changing room', cap: null, ok: true },
                { name: 'Medical room', cap: null, ok: true },
                { name: 'Disabled access', cap: null, ok: false, warn: 'Improvement needed' },
                { name: 'Turnstiles (x3)', cap: null, ok: true },
                { name: 'PA system', cap: null, ok: true },
                { name: 'Scoreboard', cap: null, ok: true },
                { name: 'Club shop (matchday)', cap: null, ok: true },
                { name: 'Car parking (60 spaces)', cap: null, ok: true },
              ].map((f, i) => (
                <div key={i} className="rounded-lg p-2 text-xs" style={{ backgroundColor: `${CARD_BG}`, border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center gap-1.5">
                    {f.ok ? <CheckCircle2 size={12} style={{ color: '#22C55E' }} /> : <AlertTriangle size={12} style={{ color: GOLD }} />}
                    <span style={{ color: TEXT }}>{f.name}</span>
                  </div>
                  {f.cap && <span className="text-[10px] ml-4" style={{ color: TEXT_SEC }}>Cap: {f.cap}</span>}
                  {f.warn && <span className="text-[10px] ml-4 block" style={{ color: GOLD }}>{f.warn}</span>}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Ground Grading */}
          <SectionCard title="Ground Grading">
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span style={{ color: TEXT_SEC }}>Required grade:</span>
                <Badge color={PRIMARY}>Grade C</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: TEXT_SEC }}>Status:</span>
                <Badge color={GOLD}>CONDITIONAL PASS</Badge>
                <AlertTriangle size={12} style={{ color: GOLD }} />
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: TEXT_SEC }}>Next inspection:</span>
                <span style={{ color: TEXT }}>14 days</span>
              </div>
              <div style={{ color: TEXT_SEC }}>Outstanding items: floodlight inspection, disabled access improvements</div>
            </div>
          </SectionCard>

          {/* Pitch */}
          <SectionCard title="Pitch Information">
            <div className="space-y-1 text-xs">
              {[
                ['Dimensions', '105m x 68m'],
                ['Surface', 'Natural grass'],
                ['Groundsman', 'Keith Barlow'],
              ].map(([l, v], i) => (
                <div key={i} className="flex justify-between py-1" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ color: TEXT_SEC }}>{l}</span>
                  <span style={{ color: TEXT }}>{v}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Map placeholder */}
          <div className="rounded-xl h-48 flex items-center justify-center" style={{ backgroundColor: '#1a2332', border: `1px solid ${BORDER}` }}>
            <div className="text-center">
              <MapPin size={24} style={{ color: TEXT_SEC, margin: '0 auto' }} />
              <p className="text-xs mt-2" style={{ color: TEXT_SEC }}>Google Maps — Mill Lane, Harfield, HF4 2RR</p>
            </div>
          </div>
        </div>
      )}

      {/* ── HONOURS TAB ── */}
      {tab === 'honours' && (
        <div className="space-y-4">
          <div className="rounded-xl p-6" style={{ backgroundColor: '#2C1810', border: `2px solid #8B6914` }}>
            <h2 className="text-center text-lg font-bold mb-6" style={{ color: '#F1C40F', fontFamily: 'serif' }}>Honours Board</h2>

            <div className="space-y-6">
              {/* League */}
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#F1C40F' }}>League Titles</h3>
                <div className="space-y-1 text-xs" style={{ color: '#D4A843' }}>
                  <div>NPL West Runners Up — 2019/20</div>
                  <div>NCEL Champions — 2018/19</div>
                  <div>WRCFA League Champions — 1967, 1971, 1988</div>
                </div>
              </div>

              {/* Cups */}
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#F1C40F' }}>Cup Wins</h3>
                <div className="space-y-1 text-xs" style={{ color: '#D4A843' }}>
                  <div>WRCFA Cup Winners — 1923, 1967, 1988, 2004</div>
                  <div>NPL Cup Semi-finalists — 2022</div>
                  <div>FA Vase 3rd Round — 2021, 2023</div>
                  <div>FA Cup 1st Round — 1994</div>
                </div>
              </div>
            </div>
          </div>

          {/* Current season targets */}
          <SectionCard title="Current Season Targets">
            <div className="space-y-2 text-xs">
              {[
                'League Top 4',
                'FA Vase 4th Round',
                'County Cup Win',
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-2 py-1" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <Target size={12} style={{ color: GOLD }} />
                  <span style={{ color: TEXT }}>{t}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── COMMITTEE TAB ── */}
      {tab === 'committee' && (
        <div className="space-y-4">
          <SectionCard title="Committee Members">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <th className="text-left py-2 pr-4 font-semibold" style={{ color: TEXT_SEC }}>Name</th>
                    <th className="text-left py-2 pr-4 font-semibold" style={{ color: TEXT_SEC }}>Role</th>
                    <th className="text-right py-2 font-semibold" style={{ color: TEXT_SEC }}>Years at club</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Alan Barker', role: 'Chairman', years: 12 },
                    { name: 'Brian Hartley', role: 'Secretary', years: 8 },
                    { name: 'Sandra Moss', role: 'Treasurer', years: 5 },
                    { name: 'Mike Chambers', role: 'Fixtures Secretary', years: 3 },
                    { name: 'Jess Patel', role: 'Welfare Officer', years: 2 },
                    { name: 'Keith Barlow', role: 'Groundsman', years: 15 },
                    { name: 'Dave Ingram', role: 'Commercial Manager', years: 6 },
                    { name: 'Paul Wright', role: 'Programme Editor', years: 4 },
                    { name: 'Linda Chen', role: 'Social Media', years: 1 },
                  ].map((m, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="py-2 pr-4" style={{ color: TEXT }}>{m.name}</td>
                      <td className="py-2 pr-4" style={{ color: TEXT_SEC }}>{m.role}</td>
                      <td className="py-2 text-right" style={{ color: TEXT }}>{m.years}</td>
                    </tr>
                  ))}
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td className="py-2 pr-4" style={{ color: TEXT_SEC }}>—</td>
                    <td className="py-2 pr-4">
                      <span style={{ color: TEXT_SEC }}>Volunteer Steward Coordinator</span>
                      <AlertTriangle size={10} className="inline ml-1" style={{ color: GOLD }} />
                    </td>
                    <td className="py-2 text-right"><Badge color={GOLD}>OPEN</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Next meeting */}
          <SectionCard title="Next Committee Meeting">
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Calendar size={14} style={{ color: PRIMARY }} />
                <span className="font-medium" style={{ color: TEXT }}>14 Apr 2026, 7:30pm</span>
              </div>
              <div style={{ color: TEXT_SEC }}>
                <p className="font-semibold mb-1" style={{ color: TEXT }}>Agenda preview:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Ground grading inspection update</li>
                  <li>End-of-season budget review</li>
                  <li>Volunteer steward recruitment</li>
                  <li>Summer pre-season planning</li>
                </ul>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── KIT & BADGE TAB ── */}
      {tab === 'kit' && (
        <div className="space-y-4">
          {/* Kit display */}
          <SectionCard title="Match Kits 2025/26">
            <div className="grid grid-cols-2 gap-6">
              {/* Home kit */}
              <div className="text-center">
                <p className="text-xs font-semibold mb-2" style={{ color: TEXT }}>Home</p>
                <svg width="120" height="140" viewBox="0 0 120 140" className="mx-auto">
                  {/* Body */}
                  <rect x="25" y="30" width="70" height="80" rx="8" fill={PRIMARY} />
                  {/* Sleeves */}
                  <rect x="5" y="30" width="25" height="40" rx="6" fill={PRIMARY} />
                  <rect x="90" y="30" width="25" height="40" rx="6" fill={PRIMARY} />
                  {/* Collar */}
                  <rect x="40" y="26" width="40" height="8" rx="4" fill="#1a1a1a" />
                  {/* Sponsor text */}
                  <text x="60" y="70" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">Harfield</text>
                  <text x="60" y="80" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">Brewery</text>
                  {/* Number on back representation */}
                  <text x="60" y="100" textAnchor="middle" fill={ACCENT} fontSize="16" fontWeight="bold">10</text>
                  {/* Shorts */}
                  <rect x="30" y="112" width="25" height="24" rx="4" fill="#1a1a1a" />
                  <rect x="65" y="112" width="25" height="24" rx="4" fill="#1a1a1a" />
                </svg>
                <p className="text-[10px] mt-1" style={{ color: TEXT_SEC }}>Amber shirt, black shorts</p>
              </div>

              {/* Away kit */}
              <div className="text-center">
                <p className="text-xs font-semibold mb-2" style={{ color: TEXT }}>Away</p>
                <svg width="120" height="140" viewBox="0 0 120 140" className="mx-auto">
                  {/* Body */}
                  <rect x="25" y="30" width="70" height="80" rx="8" fill="#1a1a1a" />
                  {/* Sleeves */}
                  <rect x="5" y="30" width="25" height="40" rx="6" fill="#1a1a1a" />
                  <rect x="90" y="30" width="25" height="40" rx="6" fill="#1a1a1a" />
                  {/* Amber trim */}
                  <rect x="25" y="30" width="70" height="3" rx="1" fill={PRIMARY} />
                  <rect x="5" y="30" width="25" height="3" rx="1" fill={PRIMARY} />
                  <rect x="90" y="30" width="25" height="3" rx="1" fill={PRIMARY} />
                  {/* Collar */}
                  <rect x="40" y="26" width="40" height="8" rx="4" fill={PRIMARY} />
                  {/* Sponsor text */}
                  <text x="60" y="70" textAnchor="middle" fill={PRIMARY} fontSize="7" fontWeight="bold">Harfield</text>
                  <text x="60" y="80" textAnchor="middle" fill={PRIMARY} fontSize="7" fontWeight="bold">Brewery</text>
                  {/* Number */}
                  <text x="60" y="100" textAnchor="middle" fill={PRIMARY} fontSize="16" fontWeight="bold">10</text>
                  {/* Shorts */}
                  <rect x="30" y="112" width="25" height="24" rx="4" fill="#1a1a1a" />
                  <rect x="65" y="112" width="25" height="24" rx="4" fill="#1a1a1a" />
                </svg>
                <p className="text-[10px] mt-1" style={{ color: TEXT_SEC }}>All black with amber trim</p>
              </div>
            </div>
          </SectionCard>

          {/* Kit info */}
          <SectionCard title="Kit Details">
            <div className="space-y-1 text-xs">
              {[
                ['Kit supplier', 'Joma'],
                ['Shirt front sponsor', 'Harfield Brewery'],
                ['Shirt back sponsor', 'Mason & Co. Solicitors'],
                ['Ordered', 'July 2024'],
                ['Next review', 'May 2026'],
              ].map(([l, v], i) => (
                <div key={i} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ color: TEXT_SEC }}>{l}</span>
                  <span style={{ color: TEXT }}>{v}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Badge history */}
          <SectionCard title="Club Badge">
            <div className="flex items-center gap-4">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill={DARK} stroke={GOLD} strokeWidth="2" />
                <text x="40" y="38" textAnchor="middle" fill={ACCENT} fontSize="14" fontWeight="bold" fontFamily="serif">H&#183;F&#183;C</text>
                <text x="40" y="54" textAnchor="middle" fill={GOLD} fontSize="8" fontFamily="serif">Est. 1887</text>
              </svg>
              <div className="text-xs" style={{ color: TEXT_SEC }}>
                Badge redesigned in 2015 to mark 125th anniversary.
              </div>
            </div>
          </SectionCard>

          {/* Squad numbers */}
          <SectionCard title="Squad Numbers">
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
              {NL_SQUAD.sort((a, b) => a.number - b.number).slice(0, 25).map((p, i) => (
                <div key={i} className="rounded-lg p-1.5 text-center" style={{ backgroundColor: `${PRIMARY}1a`, border: `1px solid ${BORDER}` }}>
                  <div className="text-sm font-bold" style={{ color: GOLD }}>{p.number}</div>
                  <div className="text-[8px] truncate" style={{ color: TEXT_SEC }}>{p.name.split(' ').pop()}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── SPONSORS TAB ── */}
      {tab === 'sponsors' && (
        <div className="space-y-4">
          <SectionCard title="Current Sponsors">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: 'Harfield Brewery', type: 'Shirt front', value: '\u00A38,000/yr', renewal: 'May 2026', warn: false },
                { name: 'Mason & Co. Solicitors', type: 'Shirt back', value: '\u00A33,500/yr', renewal: 'May 2025', warn: true },
                { name: 'Northfields Toyota', type: 'Board sponsor', value: '\u00A32,000/yr', renewal: '', warn: false },
                { name: 'Harfield Tandoori', type: 'Programme', value: '\u00A3800/yr', renewal: '', warn: false },
                { name: 'County Scaffolding', type: 'Perimeter', value: '\u00A3600/yr', renewal: '', warn: false },
                { name: 'Sportsform Betting', type: 'PA announcements', value: '\u00A31,200/yr', renewal: '', warn: false },
              ].map((s, i) => (
                <div key={i} className="rounded-lg p-3" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold" style={{ color: TEXT }}>{s.name}</span>
                    {s.warn && <Badge color="#EF4444">RENEWAL DUE</Badge>}
                  </div>
                  <div className="text-[10px]" style={{ color: TEXT_SEC }}>{s.type}</div>
                  <div className="text-sm font-bold mt-1" style={{ color: GOLD }}>{s.value}</div>
                  {s.renewal && <div className="text-[10px] mt-0.5" style={{ color: TEXT_SEC }}>Renewal: {s.renewal}</div>}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Totals */}
          <div className="rounded-xl p-4" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: TEXT_SEC }}>Total sponsorship income</span>
              <span className="text-lg font-bold" style={{ color: GOLD }}>&pound;16,100/yr</span>
            </div>
            <div className="text-[10px] mt-1" style={{ color: '#22C55E' }}>+&pound;2,100 vs last season</div>
          </div>

          {/* Opportunities */}
          <SectionCard title="Sponsorship Opportunities">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ color: TEXT }}>Sleeve sponsor</span>
                <div className="flex items-center gap-2">
                  <span style={{ color: GOLD }}>&pound;2,500/yr</span>
                  <Badge color={PRIMARY}>1 remaining</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ color: TEXT }}>Match ball sponsor</span>
                <span style={{ color: GOLD }}>&pound;150/match</span>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── MEDIA TAB ── */}
      {tab === 'media' && (
        <div className="space-y-4">
          {/* Social stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { platform: 'Twitter / X', followers: '1,840' },
              { platform: 'Facebook', followers: '2,210' },
              { platform: 'Instagram', followers: '940' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-4 text-center" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
                <div className="text-lg font-bold" style={{ color: GOLD }}>{s.followers}</div>
                <div className="text-[10px]" style={{ color: TEXT_SEC }}>{s.platform}</div>
              </div>
            ))}
          </div>

          {/* Recent posts */}
          <SectionCard title="Recent Posts">
            <div className="space-y-2">
              {[
                { date: '30 Mar 2026', text: 'FT: Harfield 2-1 Clitheroe. Grady with the winner in stoppage time! What a finish!' },
                { date: '28 Mar 2026', text: 'Training cancelled tonight due to waterlogged pitch. Thursday session confirmed.' },
                { date: '26 Mar 2026', text: 'Matchday programme for Saturday now available online. Vol. 38 No. 14.' },
              ].map((p, i) => (
                <div key={i} className="rounded-lg p-2.5" style={{ backgroundColor: `${CARD_BG}`, border: `1px solid ${BORDER}` }}>
                  <div className="text-[10px] mb-0.5" style={{ color: TEXT_SEC }}>{p.date}</div>
                  <div className="text-xs" style={{ color: TEXT }}>{p.text}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Programme archive */}
          <SectionCard title="Programme Archive — 2025/26">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
              {[
                'Vol.38 No.1 — vs Glossop NE',
                'Vol.38 No.2 — vs Mossley',
                'Vol.38 No.3 — vs Colne',
                'Vol.38 No.4 — vs Hyde United',
                'Vol.38 No.5 — vs Ramsbottom Utd',
                'Vol.38 No.6 — vs Marine',
                'Vol.38 No.7 — vs Prescot Cables',
                'Vol.38 No.8 — vs Widnes',
                'Vol.38 No.9 — vs Trafford',
                'Vol.38 No.10 — vs Radcliffe',
                'Vol.38 No.11 — vs Bamber Bridge',
                'Vol.38 No.12 — vs Droylsden',
                'Vol.38 No.13 — vs Atherton Colls',
                'Vol.38 No.14 — vs Clitheroe',
              ].map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-lg p-1.5 text-[10px]" style={{ backgroundColor: `${PRIMARY}0d`, border: `1px solid ${BORDER}`, color: TEXT_SEC }}>
                  <Printer size={10} style={{ color: PRIMARY }} />
                  {p}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Press coverage */}
          <SectionCard title="Press Coverage">
            <div className="space-y-2">
              {[
                { outlet: 'Harfield Gazette', headline: 'Grady fires Harfield to vital win', date: '31 Mar 2026' },
                { outlet: 'Non-League Paper', headline: 'NPL West round-up: Harfield push for play-offs', date: '29 Mar 2026' },
                { outlet: 'BBC Radio Leeds', headline: 'Non-league round-up featuring Harfield FC', date: '27 Mar 2026' },
                { outlet: 'The NLP Online', headline: 'Step 4 form guide: Harfield in the mix', date: '24 Mar 2026' },
                { outlet: 'Harfield Gazette', headline: 'Chairman Barker: "We believe in promotion"', date: '20 Mar 2026' },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <div>
                    <span style={{ color: TEXT }}>{c.headline}</span>
                    <span className="ml-2 text-[10px]" style={{ color: TEXT_SEC }}>— {c.outlet}</span>
                  </div>
                  <span className="text-[10px] whitespace-nowrap" style={{ color: TEXT_SEC }}>{c.date}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Media contacts */}
          <SectionCard title="Media Contacts">
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Send size={12} style={{ color: PRIMARY }} />
                <span style={{ color: TEXT }}>Harfield Gazette</span>
                <span style={{ color: GOLD }}>sports@harfieldgazette.co.uk</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText size={12} style={{ color: PRIMARY }} />
                <span style={{ color: TEXT }}>Non-League Paper correspondent</span>
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  )
}

// ─── Modal Components ──────────────────────────────────────────────────────

function NLAvailabilityModal({ onToast }: { onToast: (m: string) => void }) {
  const available = NL_SQUAD.filter(p => !p.injured && !p.suspended)
  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: TEXT_SEC }}>Generate WhatsApp availability poll for next match. Tap to toggle player responses.</p>
      <div className="space-y-1">
        {available.slice(0, 10).map((p, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ color: TEXT }}>{p.name}</span>
            <div className="flex gap-1">
              {['Yes','Maybe','No'].map(s => (
                <button key={s} className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: s === 'Yes' ? '#22C55E1a' : s === 'No' ? '#EF44441a' : `${GOLD}1a`, color: s === 'Yes' ? '#22C55E' : s === 'No' ? '#EF4444' : GOLD }}>{s}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => onToast('WhatsApp message copied')} className="w-full px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#25D366', color: '#fff' }}>
        <MessageSquare size={12} className="inline mr-1" />Copy WhatsApp Message
      </button>
    </div>
  )
}

function NLMatchFeeModal({ onToast }: { onToast: (m: string) => void }) {
  const owing = NL_SQUAD.filter(p => p.matchFee > 0).slice(0, 8)
  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: TEXT_SEC }}>Match fees outstanding from last Saturday vs Hyde United.</p>
      <div className="space-y-1">
        {owing.map((p, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ color: TEXT }}>{p.name}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono" style={{ color: GOLD }}>£{p.matchFee}</span>
              <Badge color={i < 3 ? '#22C55E' : '#EF4444'}>{i < 3 ? 'Paid' : 'Owing'}</Badge>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => onToast('WhatsApp chase sent')} className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#25D366', color: '#fff' }}>Chase via WhatsApp</button>
        <button onClick={() => onToast('CSV exported')} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, color: TEXT }}>Export CSV</button>
      </div>
    </div>
  )
}

function NLHalftimeModal({ onToast }: { onToast: (m: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [brief, setBrief] = useState('')
  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: TEXT_SEC }}>Enter first-half details and AI will generate a tactical halftime brief.</p>
      <div className="space-y-2">
        <input className="w-full px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }} placeholder="Score at HT (e.g. 1-0 up)" />
        <textarea className="w-full px-3 py-2 rounded-lg text-xs" rows={3} style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }} placeholder="Key observations: possession, chances, injuries, cards..." />
      </div>
      <button onClick={async () => {
        setLoading(true)
        try {
          const res = await fetch('/api/ai/football', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'Generate a halftime tactical brief for a non-league manager. Score is 1-0 up. We are dominating possession but they are dangerous on the break. Suggest substitutions and tactical tweaks.', type: 'halftime' }) })
          const data = await res.json()
          setBrief(data.result || data.text || 'AI brief generated — keep shape, press high, bring on Rooney for Fletcher at 60 mins if tiring.')
        } catch { setBrief('Keep shape, don\'t sit back. Press their centre-backs — they panic. Bring Rooney on at 60 if we need more creativity. Prescott to stay tight on their 9.') }
        setLoading(false)
      }} disabled={loading} className="w-full px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: PRIMARY, color: '#fff' }}>
        {loading ? <><Loader2 size={12} className="animate-spin" />Generating...</> : <><Sparkles size={12} />Generate AI Brief</>}
      </button>
      {brief && <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: BG, color: TEXT }}>{brief}</div>}
    </div>
  )
}

function NLMatchReportModal({ onToast }: { onToast: (m: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState('')
  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: TEXT_SEC }}>Enter the result and AI generates a match report with social media copy.</p>
      <div className="grid grid-cols-2 gap-2">
        <input className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }} placeholder="Harfield score" />
        <input className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }} placeholder="Opponent score" />
      </div>
      <input className="w-full px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }} placeholder="Scorers (e.g. Grady 23', Simcox 67')" />
      <button onClick={async () => {
        setLoading(true)
        try {
          const res = await fetch('/api/ai/football', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'Write a 100-word match report for Harfield FC 2-0 Redbourne Town in the Northern Premier League West. Grady and Simcox scored.', type: 'matchreport' }) })
          const data = await res.json()
          setReport(data.result || data.text || 'Harfield FC secured a comfortable 2-0 home victory against Redbourne Town. Liam Grady opened the scoring with a clinical finish before Harry Simcox doubled the lead in the second half.')
        } catch { setReport('Harfield FC secured a comfortable 2-0 home victory against Redbourne Town at Harfield Community Stadium. Liam Grady opened the scoring midway through the first half with a poacher\'s finish, before Harry Simcox doubled the advantage with a well-taken volley after the break. The result keeps the Stags firmly in the promotion picture.') }
        setLoading(false)
      }} disabled={loading} className="w-full px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: PRIMARY, color: '#fff' }}>
        {loading ? <><Loader2 size={12} className="animate-spin" />Generating...</> : <><Sparkles size={12} />Generate Report</>}
      </button>
      {report && (
        <div className="space-y-2">
          <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: BG, color: TEXT }}>{report}</div>
          <div className="flex gap-2">
            <button onClick={() => { navigator.clipboard?.writeText(report); onToast('Report copied') }} className="px-3 py-1.5 rounded-lg text-[10px] font-semibold" style={{ backgroundColor: `${PRIMARY}1a`, color: PRIMARY }}>Copy Report</button>
            <button onClick={() => { navigator.clipboard?.writeText(`FT | Harfield FC 2-0 Redbourne Town | Grady, Simcox | #HarfieldFC #NPL`); onToast('Social post copied') }} className="px-3 py-1.5 rounded-lg text-[10px] font-semibold" style={{ backgroundColor: `${PRIMARY}1a`, color: PRIMARY }}>Copy Social Post</button>
          </div>
        </div>
      )}
    </div>
  )
}

function NLGroundGradingModal({ onToast }: { onToast: (m: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold" style={{ color: GOLD }}>FA Grade H (Step 4) — Inspection: 15 Apr 2026</p>
      <div className="space-y-1">
        {NL_GROUND_GRADING.map((g, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ color: TEXT }}>{g.requirement}</span>
            <Badge color={g.status === 'pass' ? '#22C55E' : '#EF4444'}>{g.status === 'pass' ? 'PASS' : 'ACTION'}</Badge>
          </div>
        ))}
      </div>
      <div className="p-2 rounded-lg text-xs" style={{ backgroundColor: '#EF44441a', color: '#EF4444' }}>
        <AlertTriangle size={12} className="inline mr-1" />2 items must be resolved before inspection: floodlight lux test + disabled ramp.
      </div>
    </div>
  )
}

function NLOppositionScoutModal({ onToast }: { onToast: (m: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState('')
  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: TEXT_SEC }}>AI will search for opponent info and generate a scouting brief.</p>
      <input className="w-full px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }} defaultValue="Redbourne Town" placeholder="Opponent name" />
      <button onClick={async () => {
        setLoading(true)
        try {
          const res = await fetch('/api/ai/football', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'Scout report on Redbourne Town FC in the Northern Premier League West. Their form, key players, style of play, and weaknesses.', type: 'scout' }) })
          const data = await res.json()
          setReport(data.result || data.text || 'Redbourne Town sit 12th. They play a low block and counter. Key threat: Jordan Ellis (ST, 10 goals). Weak at set pieces. Target their right side — their LB is slow.')
        } catch { setReport('Redbourne Town (12th, 34pts). Formation: 4-5-1 low block. Key player: Jordan Ellis (10 goals, quick). Weaknesses: set pieces, right-back position, goalkeeper poor on crosses. Recommendation: exploit set pieces via Prescott/Dunne, play wide and deliver crosses, press their centre-backs who panic under pressure.') }
        setLoading(false)
      }} disabled={loading} className="w-full px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: PRIMARY, color: '#fff' }}>
        {loading ? <><Loader2 size={12} className="animate-spin" />Scouting...</> : <><Search size={12} />Generate Scout Report</>}
      </button>
      {report && <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: BG, color: TEXT }}>{report}</div>}
    </div>
  )
}

function NLSponsorPostModal({ onToast }: { onToast: (m: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [post, setPost] = useState('')
  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: TEXT_SEC }}>AI generates a social media post thanking a sponsor.</p>
      <select className="w-full px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }}>
        {NL_SPONSORS.map((sp, i) => <option key={i}>{sp.name}</option>)}
      </select>
      <button onClick={async () => {
        setLoading(true)
        try {
          const res = await fetch('/api/ai/football', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'Write a social media post thanking Harfield Brewery for their continued sponsorship of Harfield FC. Keep it warm, community-focused, non-league tone.', type: 'sponsor' }) })
          const data = await res.json()
          setPost(data.result || data.text || 'Huge thanks to Harfield Brewery for their continued support of the club!')
        } catch { setPost('Massive thank you to @HarfieldBrewery for their continued support as our main shirt sponsor! A proper local business backing a proper local football club. If you haven\'t tried their Amber Ale yet, get yourself down there! #HarfieldFC #CommunityClub #NonLeague') }
        setLoading(false)
      }} disabled={loading} className="w-full px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: PRIMARY, color: '#fff' }}>
        {loading ? <><Loader2 size={12} className="animate-spin" />Generating...</> : <><Sparkles size={12} />Generate Sponsor Post</>}
      </button>
      {post && (
        <div className="space-y-2">
          <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: BG, color: TEXT }}>{post}</div>
          <button onClick={() => { navigator.clipboard?.writeText(post); onToast('Post copied') }} className="px-3 py-1.5 rounded-lg text-[10px] font-semibold" style={{ backgroundColor: `${PRIMARY}1a`, color: PRIMARY }}>Copy to Clipboard</button>
        </div>
      )}
    </div>
  )
}

// ─── New View Components ────────────────────────────────────────────────────

// ─── Non-League GPS view (rebuilt: 6 KPIs + 4 tabs) ──────────────────────────

type NLGpsStatus = 'optimal' | 'manage' | 'overload' | 'underload'
interface NLGpsRow {
  name: string
  pos: string
  distance: number     // km
  hsr: number          // m (>5.5 m/s)
  sprints: number
  topSpeed: number     // km/h
  load: number         // AU
  acute: number
  chronic: number
  status: NLGpsStatus
  zones: { stand:number; walk:number; jog:number; run:number; sprint:number } // metres
}

const NL_GPS_ROWS: NLGpsRow[] = [
  { name:'Ryan Calloway',    pos:'GK',  distance: 5.6, hsr: 120, sprints: 4,  topSpeed:28.4, load:240, acute:1180, chronic:1240, status:'optimal',   zones:{stand:1820,walk:2240,jog:1180,run:280, sprint: 80} },
  { name:'Jake Morley',      pos:'RB',  distance:10.4, hsr: 720, sprints:38, topSpeed:31.6, load:380, acute:1640, chronic:1480, status:'optimal',   zones:{stand:1240,walk:2380,jog:2840,run:2240,sprint:1700} },
  { name:'Danny Prescott',   pos:'CB',  distance: 9.8, hsr: 480, sprints:22, topSpeed:29.8, load:340, acute:1480, chronic:1380, status:'optimal',   zones:{stand:1380,walk:2620,jog:2780,run:1860,sprint:1140} },
  { name:'Lewis Cartwright', pos:'CB',  distance: 9.6, hsr: 460, sprints:21, topSpeed:29.4, load:330, acute:1420, chronic:1340, status:'optimal',   zones:{stand:1420,walk:2640,jog:2740,run:1740,sprint:1060} },
  { name:'Sam Okonkwo',      pos:'LB',  distance:10.6, hsr: 780, sprints:42, topSpeed:32.0, load:400, acute:1820, chronic:1480, status:'manage',    zones:{stand:1180,walk:2240,jog:2820,run:2380,sprint:1980} },
  { name:'Tom Brennan',      pos:'CDM', distance:11.4, hsr: 880, sprints:46, topSpeed:30.8, load:440, acute:2080, chronic:1620, status:'overload',  zones:{stand:1080,walk:2280,jog:3160,run:2680,sprint:2200} },
  { name:'Josh Whitmore',    pos:'CM',  distance:11.0, hsr: 820, sprints:44, topSpeed:31.2, load:420, acute:1880, chronic:1560, status:'manage',    zones:{stand:1140,walk:2320,jog:3080,run:2440,sprint:2020} },
  { name:'Callum Deakin',    pos:'CM',  distance: 9.4, hsr: 540, sprints:28, topSpeed:30.2, load:330, acute:1260, chronic:1340, status:'underload', zones:{stand:1320,walk:2660,jog:2680,run:1740,sprint:1000} },
  { name:'Ryan Fletcher',    pos:'RW',  distance:10.8, hsr:1020, sprints:52, topSpeed:32.8, load:410, acute:1740, chronic:1520, status:'optimal',   zones:{stand:1080,walk:2120,jog:2620,run:2440,sprint:2540} },
  { name:'Marcus Webb',      pos:'LW',  distance:10.6, hsr: 980, sprints:48, topSpeed:32.4, load:400, acute:1660, chronic:1500, status:'optimal',   zones:{stand:1100,walk:2160,jog:2640,run:2360,sprint:2340} },
  { name:'Liam Grady',       pos:'ST',  distance:10.2, hsr: 940, sprints:46, topSpeed:32.6, load:390, acute:1620, chronic:1460, status:'optimal',   zones:{stand:1140,walk:2220,jog:2580,run:2200,sprint:2060} },
  { name:'Harry Simcox',     pos:'ST',  distance: 9.8, hsr: 760, sprints:36, topSpeed:30.6, load:340, acute:1300, chronic:1380, status:'underload', zones:{stand:1280,walk:2480,jog:2640,run:1840,sprint:1560} },
  { name:'Tyler Rooney',     pos:'AM',  distance:10.0, hsr: 720, sprints:32, topSpeed:30.0, load:360, acute:1480, chronic:1380, status:'optimal',   zones:{stand:1240,walk:2360,jog:2840,run:1980,sprint:1580} },
  { name:'Adam Walsh',       pos:'RW',  distance: 9.2, hsr: 580, sprints:26, topSpeed:29.2, load:310, acute:1180, chronic:1280, status:'underload', zones:{stand:1380,walk:2620,jog:2480,run:1620,sprint:1100} },
  { name:'Ben Ashworth',     pos:'RB',  distance: 9.6, hsr: 620, sprints:30, topSpeed:30.4, load:320, acute:1340, chronic:1280, status:'optimal',   zones:{stand:1320,walk:2480,jog:2640,run:1820,sprint:1340} },
  { name:'Kai Pearson',      pos:'CDM', distance:10.2, hsr: 700, sprints:34, topSpeed:30.4, load:360, acute:1440, chronic:1360, status:'optimal',   zones:{stand:1240,walk:2320,jog:2860,run:2080,sprint:1700} },
]

function NLGPSView() {
  type GpsTab = 'session' | 'trends' | 'matchVtraining' | 'connect'
  const [tab, setTab] = useState<GpsTab>('session')
  const [filter, setFilter] = useState<'all' | NLGpsStatus>('all')

  const acwr = (r: NLGpsRow) => r.chronic === 0 ? 0 : (r.acute / (r.chronic / 4))
  const filtered = filter === 'all' ? NL_GPS_ROWS : NL_GPS_ROWS.filter(r => r.status === filter)

  // KPI rollups
  const avgLoad   = Math.round(NL_GPS_ROWS.reduce((s, r) => s + r.load, 0) / NL_GPS_ROWS.length)
  const avgDist   = (NL_GPS_ROWS.reduce((s, r) => s + r.distance, 0) / NL_GPS_ROWS.length)
  const avgHsr    = Math.round(NL_GPS_ROWS.reduce((s, r) => s + r.hsr, 0) / NL_GPS_ROWS.length)
  const maxSpeed  = Math.max(...NL_GPS_ROWS.map(r => r.topSpeed))
  const maxSpeedP = NL_GPS_ROWS.find(r => r.topSpeed === maxSpeed)
  const totalSprints  = NL_GPS_ROWS.reduce((s, r) => s + r.sprints, 0)
  const highLoad  = NL_GPS_ROWS.filter(r => r.status === 'overload' || r.status === 'manage').length

  const sColor = (s: NLGpsStatus) => s === 'optimal' ? '#22C55E' : s === 'manage' ? '#F59E0B' : s === 'overload' ? '#EF4444' : '#3B82F6'
  const sLabel = (s: NLGpsStatus) => s === 'optimal' ? 'Ready' : s === 'manage' ? 'Manage' : s === 'overload' ? 'Rest' : 'Build'

  // ── Session Overview content ──
  const renderSession = () => {
    const zoneCol = { stand:'#475569', walk:'#3B82F6', jog:'#22C55E', run:'#F59E0B', sprint:'#EF4444' } as const
    const zoneTotalMax = Math.max(...NL_GPS_ROWS.map(r => r.zones.stand + r.zones.walk + r.zones.jog + r.zones.run + r.zones.sprint))
    return (
      <div className="space-y-4">
        {/* AI summary + highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 rounded-xl p-4" style={{ backgroundColor: CARD_BG, border: `1px solid ${PRIMARY}55` }}>
            <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: PRIMARY }}>🤖 AI Session Summary</div>
            <p className="text-xs leading-relaxed" style={{ color: TEXT_SEC }}>
              Saturday vs Bamber Bridge (H) · NPL West win 2–1. Squad averaged <span className="font-semibold" style={{ color: TEXT }}>{avgDist.toFixed(1)} km</span> with strong wide play — Fletcher and Webb combined for 100 sprints. Brennan flagged for overload (ACWR {acwr(NL_GPS_ROWS[5]).toFixed(2)}) — ease back Tuesday. Two players underloaded after subs early — Deakin and Walsh. FA Cup R2 next Saturday will need top-up sessions.
            </p>
          </div>
          <SectionCard title="Highlights">
            <div className="space-y-1 text-[11px]">
              <div><span className="font-bold" style={{ color: PRIMARY }}>Top distance</span> · Brennan {NL_GPS_ROWS[5].distance.toFixed(1)} km</div>
              <div><span className="font-bold" style={{ color: '#3B82F6' }}>Top speed</span> · {maxSpeedP?.name} {maxSpeed} km/h</div>
              <div><span className="font-bold" style={{ color: '#22C55E' }}>Most sprints</span> · Fletcher 52</div>
              <div><span className="font-bold" style={{ color: '#EF4444' }}>Rest today</span> · {NL_GPS_ROWS.filter(r => r.status === 'overload').length} player</div>
            </div>
          </SectionCard>
        </div>

        {/* Player breakdown table */}
        <SectionCard title="Player Breakdown · Saturday vs Bamber Bridge (H)">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider" style={{ color: TEXT_SEC, borderBottom: `1px solid ${BORDER}` }}>
                  <th className="text-left py-2 px-2">Player</th>
                  <th className="text-left py-2">Role</th>
                  <th className="text-right py-2">Distance</th>
                  <th className="text-right py-2">HSR</th>
                  <th className="text-right py-2">Sprints</th>
                  <th className="text-right py-2">Top Speed</th>
                  <th className="text-right py-2">Load</th>
                  <th className="text-right py-2">ACWR</th>
                  <th className="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {NL_GPS_ROWS.map((r, i) => {
                  const ratio = acwr(r)
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}55` }}>
                      <td className="py-2 px-2 font-medium" style={{ color: TEXT }}>{r.name}</td>
                      <td className="py-2" style={{ color: TEXT_SEC }}>{r.pos}</td>
                      <td className="py-2 text-right tabular-nums" style={{ color: TEXT }}>{r.distance.toFixed(1)} km</td>
                      <td className="py-2 text-right tabular-nums" style={{ color: TEXT }}>{r.hsr} m</td>
                      <td className="py-2 text-right tabular-nums" style={{ color: TEXT }}>{r.sprints}</td>
                      <td className="py-2 text-right tabular-nums" style={{ color: TEXT }}>{r.topSpeed.toFixed(1)} km/h</td>
                      <td className="py-2 text-right tabular-nums" style={{ color: TEXT }}>{r.load} AU</td>
                      <td className="py-2 text-right font-bold tabular-nums" style={{ color: sColor(r.status) }}>{ratio.toFixed(2)}</td>
                      <td className="py-2 text-center">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: `${sColor(r.status)}26`, color: sColor(r.status), border: `1px solid ${sColor(r.status)}55` }}>
                          {sLabel(r.status)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Distance by intensity zone — horizontal stacked bars */}
        <SectionCard title="Distance by Intensity Zone">
          <div className="flex items-center gap-3 mb-3 text-[10px]">
            {(['stand','walk','jog','run','sprint'] as const).map(k => (
              <span key={k} className="flex items-center gap-1.5 capitalize" style={{ color: TEXT_SEC }}>
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: zoneCol[k] }} />
                {k}
              </span>
            ))}
          </div>
          <svg viewBox={`0 0 600 ${NL_GPS_ROWS.length * 22 + 16}`} width="100%">
            {NL_GPS_ROWS.map((p, i) => {
              const total = p.zones.stand + p.zones.walk + p.zones.jog + p.zones.run + p.zones.sprint
              const w = (total / zoneTotalMax) * 460
              let off = 130
              const segs: Array<[keyof typeof zoneCol, number]> = [
                ['stand',  p.zones.stand],
                ['walk',   p.zones.walk],
                ['jog',    p.zones.jog],
                ['run',    p.zones.run],
                ['sprint', p.zones.sprint],
              ]
              const y = 12 + i * 22
              return (
                <g key={i}>
                  <text x={4} y={y + 11} fontSize="10" fill={TEXT}>{p.name.split(' ').pop()}</text>
                  <text x={120} y={y + 11} fontSize="9" fill="#475569" textAnchor="end">{p.pos}</text>
                  {segs.map(([k, v], si) => {
                    const ww = total > 0 ? (v / total) * w : 0
                    const r = <rect key={si} x={off} y={y} width={ww} height={14} fill={zoneCol[k]} opacity="0.85" />
                    off += ww
                    return r
                  })}
                  <text x={off + 4} y={y + 11} fontSize="9" fill={TEXT_SEC} className="tabular-nums">{(total / 1000).toFixed(2)} km</text>
                </g>
              )
            })}
          </svg>
        </SectionCard>

        {/* Sprint frequency line chart */}
        <SectionCard title="Sprint Frequency · last 8 fixtures (squad avg)">
          {(() => {
            const sprintTrend = [28, 32, 30, 38, 34, 36, 41, 42]
            const fixtures = ['Mossley','FC Utd','Glossop','Hyde','Stalybridge','Bamber','Workington','Bamber']
            const max = Math.max(...sprintTrend)
            return (
              <svg viewBox="0 0 600 180" width="100%">
                {[0,0.25,0.5,0.75,1].map((t, i) => <line key={i} x1={36} x2={580} y1={20 + (1 - t) * 130} y2={20 + (1 - t) * 130} stroke={`${BORDER}66`} />)}
                <path d={sprintTrend.map((v, i) => `${i === 0 ? 'M' : 'L'} ${36 + (i / (sprintTrend.length - 1)) * 540} ${20 + (1 - v / max) * 130}`).join(' ')}
                  fill="none" stroke={PRIMARY} strokeWidth="2.5" strokeLinecap="round" />
                {sprintTrend.map((v, i) => {
                  const x = 36 + (i / (sprintTrend.length - 1)) * 540
                  const y = 20 + (1 - v / max) * 130
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="4" fill={PRIMARY} stroke="#fff" strokeWidth="0.5" />
                      <text x={x} y={y - 8} fontSize="9" fill={PRIMARY} textAnchor="middle" fontWeight="700">{v}</text>
                      <text x={x} y={170} fontSize="8.5" fill={TEXT_SEC} textAnchor="middle">{fixtures[i]}</text>
                    </g>
                  )
                })}
              </svg>
            )
          })()}
        </SectionCard>
      </div>
    )
  }

  // ── Load Trends & ACWR ──
  const renderTrends = () => {
    // 30-day team load
    const TEAM_30D = Array.from({ length: 30 }).map((_, i) => {
      const base = 240 + Math.sin(i / 4) * 60 + (i / 30) * 20
      const matchSpike = (i % 7 === 5) ? 80 : 0
      return Math.round(base + matchSpike + ((i * 11) % 5) * 6)
    })
    const max30 = Math.max(...TEAM_30D)
    const path30 = TEAM_30D.map((v, i) => `${i === 0 ? 'M' : 'L'} ${36 + (i / (TEAM_30D.length - 1)) * 540} ${20 + (1 - v / max30) * 130}`).join(' ')

    return (
      <div className="space-y-4">
        <SectionCard title="30-day Team Load (AU/day)">
          <svg viewBox="0 0 600 180" width="100%">
            {[0,0.25,0.5,0.75,1].map((t, i) => <line key={i} x1={36} x2={580} y1={20 + (1 - t) * 130} y2={20 + (1 - t) * 130} stroke={`${BORDER}66`} />)}
            <defs>
              <linearGradient id="nl-load-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%"  stopColor={PRIMARY} stopOpacity="0.4" />
                <stop offset="100%" stopColor={PRIMARY} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${path30} L 576 150 L 36 150 Z`} fill="url(#nl-load-area)" />
            <path d={path30} fill="none" stroke={PRIMARY} strokeWidth="2" />
            {TEAM_30D.filter((_, i) => i % 5 === 0).map((_, j) => {
              const i = j * 5
              return <text key={i} x={36 + (i / (TEAM_30D.length - 1)) * 540} y={172} fontSize="9" fill={TEXT_SEC} textAnchor="middle">D{i + 1}</text>
            })}
          </svg>
        </SectionCard>

        {/* Squad ACWR table with trend arrows */}
        <SectionCard title={`Full Squad ACWR — ${filtered.length} players${filter !== 'all' ? ` (${filter})` : ''}`}>
          <div className="flex gap-1 mb-3 flex-wrap">
            {(['all','optimal','manage','overload','underload'] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)} className="px-2 py-1 rounded text-[10px] font-medium capitalize"
                style={{ backgroundColor: filter === s ? PRIMARY : `${BORDER}55`, color: filter === s ? '#fff' : TEXT_SEC }}>
                {s}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider" style={{ color: TEXT_SEC, borderBottom: `1px solid ${BORDER}` }}>
                  <th className="text-left py-2 px-2">Player</th>
                  <th className="text-left py-2">Pos</th>
                  <th className="text-right py-2">Acute (7d)</th>
                  <th className="text-right py-2">Chronic (28d)</th>
                  <th className="text-right py-2">Ratio</th>
                  <th className="text-center py-2">Trend</th>
                  <th className="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const ratio = acwr(r)
                  const trend = r.acute > r.chronic / 4 ? '↑' : '↓'
                  const trendCol = trend === '↑' && (r.status === 'overload' || r.status === 'manage') ? '#EF4444' : trend === '↓' && r.status === 'underload' ? '#3B82F6' : '#22C55E'
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}55` }}>
                      <td className="py-2 px-2 font-medium" style={{ color: TEXT }}>{r.name}</td>
                      <td className="py-2" style={{ color: TEXT_SEC }}>{r.pos}</td>
                      <td className="py-2 text-right tabular-nums" style={{ color: TEXT }}>{r.acute.toLocaleString()}</td>
                      <td className="py-2 text-right tabular-nums" style={{ color: TEXT }}>{r.chronic.toLocaleString()}</td>
                      <td className="py-2 text-right font-bold tabular-nums" style={{ color: sColor(r.status) }}>{ratio.toFixed(2)}</td>
                      <td className="py-2 text-center font-bold" style={{ color: trendCol }}>{trend}</td>
                      <td className="py-2 text-center">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: `${sColor(r.status)}26`, color: sColor(r.status), border: `1px solid ${sColor(r.status)}55` }}>
                          {sLabel(r.status)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* 4-week ACWR for flagged players */}
        <SectionCard title="4-week ACWR · flagged players">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {NL_GPS_ROWS.filter(r => r.status === 'overload' || r.status === 'manage').map(r => {
              // Synthetic 4-week ACWR data leading to current
              const seed = r.name.charCodeAt(0)
              const data = Array.from({ length: 4 }).map((_, i) => {
                const base = 0.95 + Math.sin((i + seed) / 2) * 0.18 + (i / 6)
                return +(base + (i === 3 ? (r.status === 'overload' ? 0.35 : 0.18) : 0)).toFixed(2)
              })
              const max = Math.max(...data, 1.6)
              return (
                <div key={r.name} className="rounded-lg p-3" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-semibold" style={{ color: TEXT }}>{r.name}</span>
                      <span className="text-[10px] ml-2" style={{ color: TEXT_SEC }}>{r.pos}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: `${sColor(r.status)}26`, color: sColor(r.status), border: `1px solid ${sColor(r.status)}55` }}>
                      {sLabel(r.status)}
                    </span>
                  </div>
                  <svg viewBox="0 0 280 100" width="100%">
                    {[0.8, 1.3, 1.5].map((t, i) => {
                      const y = 14 + (1 - t / max) * 70
                      const c = t === 1.5 ? '#EF4444' : t === 1.3 ? '#F59E0B' : '#22C55E'
                      return <line key={i} x1={20} x2={270} y1={y} y2={y} stroke={c} strokeOpacity="0.3" strokeDasharray="3 3" />
                    })}
                    <path d={data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${20 + (i / (data.length - 1)) * 250} ${14 + (1 - v / max) * 70}`).join(' ')}
                      fill="none" stroke={sColor(r.status)} strokeWidth="2.5" />
                    {data.map((v, i) => {
                      const x = 20 + (i / (data.length - 1)) * 250
                      const y = 14 + (1 - v / max) * 70
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="3.5" fill={sColor(r.status)} />
                          <text x={x} y={y - 6} fontSize="9" fill={sColor(r.status)} textAnchor="middle" fontWeight="700">{v.toFixed(2)}</text>
                          <text x={x} y={94} fontSize="9" fill={TEXT_SEC} textAnchor="middle">W-{4 - i}</text>
                        </g>
                      )
                    })}
                  </svg>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>
    )
  }

  // ── Match vs Training ──
  const renderMatchVsTraining = () => {
    const ROWS = NL_GPS_ROWS.slice(0, 11).map(r => ({
      name: r.name.split(' ').pop() ?? r.name,
      matchDist: +(r.distance * 1.02).toFixed(1),
      trainDist: +(r.distance * 0.58 + 1.0).toFixed(1),
      matchHsr:  Math.round(r.hsr * 1.05),
      trainHsr:  Math.round(r.hsr * 0.4 + 60),
      matchSpr:  r.sprints,
      trainSpr:  Math.max(0, Math.round(r.sprints * 0.32)),
    }))
    const grouped = (rows: typeof ROWS, getM: (r:typeof ROWS[0]) => number, getT: (r:typeof ROWS[0]) => number, label: string, color: string) => {
      const max = Math.max(...rows.flatMap(r => [getM(r), getT(r)])) * 1.05
      return (
        <SectionCard title={label}>
          <svg viewBox={`0 0 600 ${24 * rows.length + 30}`} width="100%">
            {rows.map((r, i) => {
              const y = 14 + i * 24
              const wM = (getM(r) / max) * 440
              const wT = (getT(r) / max) * 440
              return (
                <g key={i}>
                  <text x={4} y={y + 7} fontSize="10" fill={TEXT}>{r.name}</text>
                  <rect x={130} y={y - 5} width={wM} height={9} fill={color} opacity="0.9" rx="1.5" />
                  <text x={130 + wM + 4} y={y + 3} fontSize="8" fill={color} className="tabular-nums">{getM(r)}</text>
                  <rect x={130} y={y + 5} width={wT} height={9} fill="#3B82F6" opacity="0.85" rx="1.5" />
                  <text x={130 + wT + 4} y={y + 13} fontSize="8" fill="#3B82F6" className="tabular-nums">{getT(r)}</text>
                </g>
              )
            })}
          </svg>
          <div className="flex gap-4 mt-2 text-[10px]" style={{ color: TEXT_SEC }}>
            <span><span className="inline-block w-3 h-3 rounded-sm align-middle mr-1.5" style={{ background: color }} /> Match day</span>
            <span><span className="inline-block w-3 h-3 bg-blue-500 rounded-sm align-middle mr-1.5" /> Training</span>
          </div>
        </SectionCard>
      )
    }
    return (
      <div className="space-y-4">
        {grouped(ROWS, r => r.matchDist, r => r.trainDist, 'Match vs Training · Distance (km)', PRIMARY)}
        {grouped(ROWS, r => r.matchHsr,  r => r.trainHsr,  'Match vs Training · High Speed Running (m)', '#22C55E')}
        {grouped(ROWS, r => r.matchSpr,  r => r.trainSpr,  'Match vs Training · Sprint Count', '#F59E0B')}
      </div>
    )
  }

  // ── Connect GPS ──
  const renderConnect = () => {
    const OTHER = [
      { name:'Johan Sports',     sub:'10Hz GPS · OAuth or CSV import' },
      { name:'CSV Upload',       sub:'Generic GPS export · any vendor · drag and drop' },
      { name:'Polar Team Pro',   sub:'HR + GPS · Bluetooth dock' },
      { name:'Lumio Vision',     sub:'Camera-based positional tracking' },
    ]
    return (
      <div className="space-y-4">
        {/* JOHAN featured partner */}
        <div className="rounded-2xl p-6" style={{ background: `linear-gradient(135deg, ${PRIMARY}33 0%, ${PRIMARY}11 70%, transparent 100%)`, border: `1px solid ${PRIMARY}55` }}>
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: PRIMARY, color: '#fff', boxShadow: `0 0 24px ${PRIMARY}66` }}>
              ⚽
            </div>
            <div className="flex-1 min-w-[260px]">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>Featured Partner</div>
              <h2 className="text-2xl font-black mt-1" style={{ color: TEXT }}>JOHAN Sports</h2>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: TEXT_SEC }}>
                Affordable GPS vests built for non-league budgets. Plug-and-play 10Hz tracking, automatic upload to Lumio, no contracts. Designed for clubs running on volunteer kit managers.
              </p>
              <div className="mt-4 flex gap-2 flex-wrap">
                <button className="px-5 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', boxShadow: `0 0 16px ${PRIMARY}44`, cursor: 'pointer' }}>Connect JOHAN GPS →</button>
                <button className="px-5 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'transparent', color: ACCENT, border: `1px solid ${PRIMARY}66`, cursor: 'pointer' }}>Read setup guide</button>
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { icon:'📡', k:'Match-day tracking',  v:'Distance, HSR, sprints, top speed — every player every game.' },
              { icon:'🏃', k:'Training auto-sync',  v:'Drop vests in dock after session — Lumio populates automatically.' },
              { icon:'🛡️', k:'Injury risk flags',   v:'ACWR + load curve — early warning when a player is heading into overload.' },
            ].map(c => (
              <div key={c.k} className="rounded-xl p-3" style={{ backgroundColor: `${BG}aa`, border: `1px solid ${BORDER}` }}>
                <div className="text-xl mb-1.5">{c.icon}</div>
                <div className="text-sm font-bold" style={{ color: TEXT }}>{c.k}</div>
                <div className="text-[11px] mt-0.5 leading-relaxed" style={{ color: TEXT_SEC }}>{c.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Integration status */}
        <SectionCard title="Integration Status">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
            <div className="p-3 rounded-lg" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: TEXT_SEC }}>Active devices</div>
              <div className="text-xl font-black" style={{ color: '#22C55E' }}>16 / 22</div>
              <div style={{ color: TEXT_SEC }}>JOHAN vests · 6 charging</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: TEXT_SEC }}>Last sync</div>
              <div className="text-xl font-black" style={{ color: PRIMARY }}>Sat 15:42</div>
              <div style={{ color: TEXT_SEC }}>Post-match · Bamber Bridge (H)</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: TEXT_SEC }}>Backlog</div>
              <div className="text-xl font-black" style={{ color: '#22C55E' }}>0 MB</div>
              <div style={{ color: TEXT_SEC }}>All sessions ingested</div>
            </div>
          </div>
        </SectionCard>

        {/* Other devices */}
        <SectionCard title="Other Compatible Devices">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {OTHER.map(d => (
              <div key={d.name} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
                <div>
                  <div className="text-sm font-semibold" style={{ color: TEXT }}>{d.name}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: TEXT_SEC }}>{d.sub}</div>
                </div>
                <button className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md"
                  style={{ backgroundColor: `${BORDER}66`, color: TEXT_SEC, border: `1px solid ${BORDER}`, cursor: 'pointer' }}>Connect</button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 6-KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Avg Player Load"    value={`${avgLoad} AU`}            icon={Activity}    color={PRIMARY} sub="Match day" />
        <StatCard label="Avg Distance"       value={`${avgDist.toFixed(1)} km`} icon={TrendingUp}  color="#22C55E" />
        <StatCard label="Avg HSR"            value={`${avgHsr} m`}              icon={Zap}         color="#3B82F6" sub=">5.5 m/s" />
        <StatCard label="Max Speed"          value={`${maxSpeed} km/h`}         icon={TrendingUp}  color="#F59E0B" sub={maxSpeedP?.name.split(' ').pop()} />
        <StatCard label="Sprint Count"       value={`${totalSprints}`}          icon={Zap}         color="#A855F7" sub="Squad cumulative" />
        <StatCard label="High Load Players"  value={`${highLoad}`}              icon={AlertCircle} color="#EF4444" sub="Manage or rest" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto" style={{ borderBottom: `1px solid ${BORDER}` }}>
        {([
          { id:'session' as const,        icon:'📋', label:'Session Overview' },
          { id:'trends' as const,         icon:'📈', label:'Load Trends & ACWR' },
          { id:'matchVtraining' as const, icon:'🏟️', label:'Match vs Training' },
          { id:'connect' as const,        icon:'🔌', label:'Connect GPS' },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-3 py-2.5 text-xs font-semibold flex items-center gap-1.5 -mb-px whitespace-nowrap"
            style={{
              borderBottom: `2px solid ${tab === t.id ? PRIMARY : 'transparent'}`,
              color: tab === t.id ? PRIMARY : TEXT_SEC,
            }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {tab === 'session'        && renderSession()}
      {tab === 'trends'         && renderTrends()}
      {tab === 'matchVtraining' && renderMatchVsTraining()}
      {tab === 'connect'        && renderConnect()}
    </div>
  )
}

function NLMatchFeesView() {
  const [tab, setTab] = useState<'match' | 'outstanding' | 'season'>('match')
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        <StatCard label="This Match" value="£640" icon={DollarSign} color={PRIMARY} sub="16 players" />
        <StatCard label="Outstanding" value="£240" icon={AlertCircle} color="#EF4444" sub="6 players" />
        <StatCard label="Season Total" value="£18,200" icon={TrendingUp} color="#22C55E" />
      </div>

      <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: CARD_BG }}>
        {(['match', 'outstanding', 'season'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize"
            style={{ backgroundColor: tab === t ? PRIMARY : 'transparent', color: tab === t ? '#fff' : TEXT_SEC }}>
            {t === 'match' ? 'This Match' : t === 'outstanding' ? 'Outstanding' : 'Season'}
          </button>
        ))}
      </div>

      {tab === 'match' && (
        <SectionCard title="Match Fees — vs Redbourne Town (H)">
          <div className="space-y-1">
            {NL_SQUAD.filter(p => !p.injured && !p.suspended && p.matchFee > 0).slice(0, 16).map((p, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ color: TEXT }}>{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono" style={{ color: TEXT_SEC }}>£{p.matchFee}</span>
                  <Badge color={i % 3 === 0 ? '#22C55E' : GOLD}>{i % 3 === 0 ? 'Paid' : 'Pending'}</Badge>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'outstanding' && (
        <SectionCard title="Outstanding Fees" action={<button className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: '#25D366', color: '#fff' }}>Chase All via WhatsApp</button>}>
          <div className="space-y-1">
            {NL_SQUAD.filter(p => p.matchFee > 0).slice(3, 9).map((p, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ color: TEXT }}>{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono" style={{ color: '#EF4444' }}>£{p.matchFee}</span>
                  <button className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: '#25D3661a', color: '#25D366' }}>Chase</button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'season' && (
        <SectionCard title="Season Fee Summary">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ color: TEXT_SEC }}>Total paid</span><span className="font-mono" style={{ color: '#22C55E' }}>£17,960</span>
            </div>
            <div className="flex justify-between py-1" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ color: TEXT_SEC }}>Outstanding</span><span className="font-mono" style={{ color: '#EF4444' }}>£240</span>
            </div>
            <div className="flex justify-between py-1" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ color: TEXT_SEC }}>Budget</span><span className="font-mono" style={{ color: TEXT }}>£20,000</span>
            </div>
            <div className="flex justify-between py-1">
              <span style={{ color: TEXT_SEC }}>Remaining budget</span><span className="font-mono" style={{ color: '#22C55E' }}>£1,800</span>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  )
}

function NLCupManagerView() {
  const [cupRunMode, setCupRunMode] = useState(false)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        <StatCard label="Cups Active" value="2" icon={Trophy} color={PRIMARY} sub="FA Vase + County Cup" />
        <StatCard label="Prize Money Won" value="£1,450" icon={DollarSign} color="#22C55E" />
        <StatCard label="Cup Games" value={String(NL_CUP_FIXTURES.length)} icon={Calendar} color="#3B82F6" />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs" style={{ color: TEXT_SEC }}>Cup Run Mode</span>
        <button onClick={() => setCupRunMode(!cupRunMode)} className="px-3 py-1 rounded-full text-[10px] font-bold" style={{ backgroundColor: cupRunMode ? '#22C55E' : BORDER, color: cupRunMode ? '#fff' : TEXT_SEC }}>{cupRunMode ? 'ON' : 'OFF'}</button>
        {cupRunMode && <span className="text-[10px]" style={{ color: '#22C55E' }}>Prioritising cup fixtures in scheduling</span>}
      </div>

      {['FA Cup', 'FA Vase', 'County Cup'].map(comp => {
        const fixtures = NL_CUP_FIXTURES.filter(c => c.comp === comp)
        if (!fixtures.length) return null
        return (
          <SectionCard key={comp} title={comp}>
            <div className="space-y-1">
              {fixtures.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <div><span className="font-medium" style={{ color: TEXT }}>{c.round}</span> <span style={{ color: TEXT_SEC }}>vs {c.opponent}</span></div>
                  <div className="flex items-center gap-2">
                    {c.result ? <Badge color="#22C55E">{c.result}</Badge> : <Badge color={GOLD}>Upcoming</Badge>}
                    <span style={{ color: TEXT_SEC }}>{c.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )
      })}

      <SectionCard title="FA Cup / Vase Prize Money Guide">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[['Extra Preliminary', '£900'], ['Preliminary', '£1,125'], ['1st Qualifying', '£1,444'], ['2nd Qualifying', '£1,800'], ['FA Vase 1st Round', '£550'], ['FA Vase 2nd Round', '£725']].map(([r, p], i) => (
            <div key={i} className="flex justify-between py-1" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ color: TEXT_SEC }}>{r}</span><span className="font-mono" style={{ color: GOLD }}>{p}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

function NLRegistrationView() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        <StatCard label="Registered" value={String(NL_SQUAD.filter(p => p.faRegistered).length)} icon={CheckCircle2} color="#22C55E" />
        <StatCard label="Squad Size" value={String(NL_SQUAD.length)} icon={Users} color={PRIMARY} />
        <StatCard label="Next Deadline" value="15 Apr" icon={Clock} color={GOLD} />
      </div>

      <SectionCard title="FA Registration Status" action={<Badge color={GOLD}>Deadline: 15 Apr 2026</Badge>}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ color: TEXT_SEC, borderBottom: `1px solid ${BORDER}` }}>
              <th className="text-left py-2">#</th><th className="text-left py-2">Player</th><th className="text-left py-2">Pos</th><th className="text-left py-2">Contract</th><th className="text-center py-2">FA Reg</th>
            </tr></thead>
            <tbody>
              {NL_SQUAD.map(p => (
                <tr key={p.number} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td className="py-1.5" style={{ color: TEXT_SEC }}>{p.number}</td>
                  <td className="py-1.5 font-medium" style={{ color: TEXT }}>{p.name}</td>
                  <td className="py-1.5" style={{ color: TEXT_SEC }}>{p.position}</td>
                  <td className="py-1.5"><Badge color={p.contractType === 'Seasonal' ? '#22C55E' : p.contractType === 'Loan' ? '#3B82F6' : TEXT_SEC}>{p.contractType}</Badge></td>
                  <td className="py-1.5 text-center">{p.faRegistered ? <Check size={12} style={{ color: '#22C55E' }} /> : <X size={12} style={{ color: '#EF4444' }} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}

function NLDisciplineView() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Yellow Cards" value={String(NL_SQUAD.reduce((s, p) => s + p.yc, 0))} icon={AlertTriangle} color={GOLD} />
        <StatCard label="Red Cards" value={String(NL_SQUAD.reduce((s, p) => s + p.rc, 0))} icon={AlertCircle} color="#EF4444" />
        <StatCard label="Suspended" value={String(NL_SQUAD.filter(p => p.suspended).length)} icon={Shield} color="#EF4444" />
        <StatCard label="At Risk (4+ YC)" value={String(NL_SQUAD.filter(p => p.yc >= 4).length)} icon={AlertTriangle} color={GOLD} />
      </div>

      <SectionCard title="Yellow/Red Card Tracker">
        <div className="space-y-1">
          {NL_SQUAD.filter(p => p.yc > 0 || p.rc > 0).sort((a, b) => (b.yc + b.rc * 3) - (a.yc + a.rc * 3)).map((p, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ color: TEXT }}>{p.name}</span>
              <div className="flex items-center gap-2">
                {p.yc > 0 && <span className="flex items-center gap-1"><span className="w-3 h-4 rounded-sm" style={{ backgroundColor: GOLD }} /><span style={{ color: TEXT_SEC }}>{p.yc}</span></span>}
                {p.rc > 0 && <span className="flex items-center gap-1"><span className="w-3 h-4 rounded-sm" style={{ backgroundColor: '#EF4444' }} /><span style={{ color: TEXT_SEC }}>{p.rc}</span></span>}
                {p.yc >= 5 && <Badge color="#EF4444">SUSPENSION DUE</Badge>}
                {p.yc === 4 && <Badge color={GOLD}>AT RISK</Badge>}
                {p.suspended && <Badge color="#EF4444">SUSPENDED</Badge>}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Suspension Calculator">
        <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: BG }}>
          <p style={{ color: TEXT }}>5 yellow cards = 1 match ban (Steps 1-4)</p>
          <p style={{ color: TEXT_SEC }}>10 yellow cards = 2 match ban</p>
          <p style={{ color: TEXT_SEC }}>Straight red = minimum 1 match ban (violent conduct = 3 matches)</p>
          <p className="mt-2" style={{ color: GOLD }}>Declan Nash: Currently serving 1-match ban (5 accumulated yellows)</p>
        </div>
      </SectionCard>

      <SectionCard title="FA Fine Log">
        <div className="space-y-1 text-xs">
          {[
            { date: '15 Feb', offence: 'Failure to control players (3+ yellows in match)', fine: '£50', status: 'Paid' },
            { date: '8 Mar', offence: 'Late team sheet submission', fine: '£25', status: 'Paid' },
          ].map((f, i) => (
            <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div><span style={{ color: TEXT }}>{f.offence}</span><span className="ml-2" style={{ color: TEXT_SEC }}>{f.date}</span></div>
              <div className="flex items-center gap-2">
                <span className="font-mono" style={{ color: '#EF4444' }}>{f.fine}</span>
                <Badge color="#22C55E">{f.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

function NLAIHalftimeView() {
  const [phase, setPhase] = useState<'prematch' | 'halftime'>('prematch')
  const [loading, setLoading] = useState(false)
  const [brief, setBrief] = useState('')
  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: CARD_BG }}>
        {(['prematch', 'halftime'] as const).map(t => (
          <button key={t} onClick={() => setPhase(t)} className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{ backgroundColor: phase === t ? PRIMARY : 'transparent', color: phase === t ? '#fff' : TEXT_SEC }}>
            {t === 'prematch' ? 'Pre-Match Setup' : 'Halftime Input'}
          </button>
        ))}
      </div>

      {phase === 'prematch' && (
        <SectionCard title="Pre-Match Setup">
          <div className="space-y-3">
            <div className="text-xs" style={{ color: TEXT_SEC }}>
              <p>Opponent: <span style={{ color: TEXT }}>Redbourne Town</span></p>
              <p>Formation: <span style={{ color: TEXT }}>4-4-2</span></p>
              <p>Key threat: <span style={{ color: TEXT }}>Jordan Ellis (ST, 10 goals)</span></p>
            </div>
            <textarea className="w-full px-3 py-2 rounded-lg text-xs" rows={3} style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }} placeholder="Pre-match notes: tactical plan, specific instructions..." />
          </div>
        </SectionCard>
      )}

      {phase === 'halftime' && (
        <SectionCard title="Halftime Input">
          <div className="space-y-3">
            <input className="w-full px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }} placeholder="Score at HT (e.g. 1-0)" />
            <textarea className="w-full px-3 py-2 rounded-lg text-xs" rows={4} style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }} placeholder="What happened? Possession, chances, problems, injuries, cards..." />
            <button onClick={async () => {
              setLoading(true)
              try {
                const res = await fetch('/api/ai/football', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'Generate a halftime tactical brief for a Step 4 non-league manager. We are 1-0 up against Redbourne Town. We dominated possession but they look dangerous on the counter through Ellis. Suggest changes.', type: 'halftime' }) })
                const data = await res.json()
                setBrief(data.result || data.text || 'Keep shape. Press their CBs — they panic. Consider Rooney for Fletcher at 60 if tiring. Prescott to stay tight on Ellis.')
              } catch { setBrief('Keep your shape lads, don\'t sit back. We\'re on top but one lapse and Ellis will punish us. Brennan, stay tight to their 10. Webb, keep getting at their right-back — he\'s struggling. If Fletcher tires, Rooney comes on at 60. Set pieces: keep attacking them, Prescott was dominant first half. Let\'s finish this off.') }
              setLoading(false)
            }} disabled={loading} className="w-full px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: PRIMARY, color: '#fff' }}>
              {loading ? <><Loader2 size={12} className="animate-spin" />Generating...</> : <><Sparkles size={12} />Generate Halftime Brief</>}
            </button>
            {brief && <div className="p-3 rounded-lg text-xs leading-relaxed" style={{ backgroundColor: BG, color: TEXT }}>{brief}</div>}
          </div>
        </SectionCard>
      )}
    </div>
  )
}

function NLPreSeasonView() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        <StatCard label="Pre-Season Start" value="1 Jul" icon={Calendar} color={PRIMARY} />
        <StatCard label="Friendlies" value="5 planned" icon={Trophy} color="#3B82F6" />
        <StatCard label="Season Start" value="9 Aug" icon={Target} color="#22C55E" />
      </div>

      <SectionCard title="Pre-Season Plan">
        <div className="space-y-2">
          {[
            { week: 'Week 1 (1-6 Jul)', focus: 'Fitness testing, base conditioning, squad bonding', sessions: 4 },
            { week: 'Week 2 (7-13 Jul)', focus: 'Ball work, shape, tactical basics', sessions: 4 },
            { week: 'Week 3 (14-20 Jul)', focus: 'Friendly 1 + set piece work', sessions: 3 },
            { week: 'Week 4 (21-27 Jul)', focus: 'Friendly 2 & 3, match fitness', sessions: 3 },
            { week: 'Week 5 (28 Jul-3 Aug)', focus: 'Friendly 4 & 5, final prep, squad announcement', sessions: 3 },
          ].map((w, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold" style={{ color: TEXT }}>{w.week}</span>
                <Badge color={PRIMARY}>{w.sessions} sessions</Badge>
              </div>
              <p className="text-[10px]" style={{ color: TEXT_SEC }}>{w.focus}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Friendlies to Arrange">
        <div className="space-y-1 text-xs">
          {[
            { opp: 'Glossop NE', date: 'Sat 19 Jul', status: 'Confirmed' },
            { opp: 'Stalybridge Celtic Res', date: 'Tue 22 Jul', status: 'Confirmed' },
            { opp: 'Colne', date: 'Sat 26 Jul', status: 'Pending' },
            { opp: 'Nantwich Town Res', date: 'Tue 29 Jul', status: 'Pending' },
            { opp: 'Droylsden', date: 'Sat 2 Aug', status: 'TBC' },
          ].map((f, i) => (
            <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div><span style={{ color: TEXT }}>vs {f.opp}</span> <span style={{ color: TEXT_SEC }}>— {f.date}</span></div>
              <Badge color={f.status === 'Confirmed' ? '#22C55E' : f.status === 'Pending' ? GOLD : TEXT_SEC}>{f.status}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Placeholder View for items without dedicated views ─────────────────────

function NLPlaceholderView({ label }: { label: string }) {
  return (
    <div className="rounded-xl p-8 text-center" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
      <Wrench size={32} style={{ color: TEXT_SEC, margin: '0 auto' }} />
      <p className="text-sm font-semibold mt-3" style={{ color: TEXT }}>{label}</p>
      <p className="text-xs mt-1" style={{ color: TEXT_SEC }}>This section is being built. Check back soon.</p>
    </div>
  )
}

// ─── GPS Heatmaps View (wraps shared component with non-league config) ──────
// Squad limited to the starting 11 + 4 first subs to mirror typical
// Northern Premier League West matchday squads. FA Cup + league fixtures
// shown in the match dropdown.

const NL_HEATMAP_PLAYERS: HMPlayer[] = [
  { name: 'Ryan Calloway',    position: 'GK',  group: 'Goalkeeper'  },
  { name: 'Jake Morley',      position: 'RB',  group: 'Defenders'   },
  { name: 'Danny Prescott',   position: 'CB',  group: 'Defenders'   },
  { name: 'Lewis Cartwright', position: 'CB',  group: 'Defenders'   },
  { name: 'Sam Okonkwo',      position: 'LB',  group: 'Defenders'   },
  { name: 'Tom Brennan',      position: 'CDM', group: 'Midfielders' },
  { name: 'Josh Whitmore',    position: 'CM',  group: 'Midfielders' },
  { name: 'Callum Deakin',    position: 'CM',  group: 'Midfielders' },
  { name: 'Ryan Fletcher',    position: 'RW',  group: 'Forwards'    },
  { name: 'Marcus Webb',      position: 'LW',  group: 'Forwards'    },
  { name: 'Liam Grady',       position: 'ST',  group: 'Forwards'    },
]

const NL_HEATMAP_MATCHES = [
  'Bamber Bridge (H) — NPL West, 2-1 W',
  'Mossley (A) — NPL West, 1-1 D',
  'FC United (H) — FA Cup R1, 0-2 L',
  'Glossop NE (A) — NPL West, 3-2 W',
  'Hyde United (H) — FA Trophy R2, 1-0 W',
]

const NL_HEATMAP_TRAINING = [
  'Tue — Tactical (75min)',
  'Thu — Match Prep (60min)',
  'Sat AM — Light Activation (30min)',
]

function NLGPSHeatmapsView() {
  return (
    <GPSHeatmapsView
      sportLabel="Non-League · Harfield FC"
      brandPrimaryKey="lumio_nonleague_brand_primary"
      brandSecondaryKey="lumio_nonleague_brand_secondary"
      defaultPrimary="#D97706"
      defaultSecondary="#FDE68A"
      players={NL_HEATMAP_PLAYERS}
      matches={NL_HEATMAP_MATCHES}
      trainingSessions={NL_HEATMAP_TRAINING}
      matchDayLabel="MATCH"
      comparisonMode="eleven"
    />
  )
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function NonLeagueContent({ activeDept, onToast, userName }: { activeDept: NLDeptId; onToast: (m: string) => void; userName?: string }) {
  const deptLabel = NL_SIDEBAR_ITEMS.find(d => d.id === activeDept)?.label || 'Overview'

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold" style={{ color: TEXT }}>{deptLabel}</h1>
          <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>Harfield FC · Northern Premier League West</p>
        </div>
      </div>

      {activeDept === 'nl-getting-started' && <NLGettingStartedView />}
      {activeDept === 'nl-overview' && <NLOverviewView onToast={onToast} userName={userName} />}
      {activeDept === 'nl-morningroundup' && <NLOverviewView onToast={onToast} userName={userName} />}
      {activeDept === 'nl-club-profile' && <NLClubProfileView />}
      {activeDept === 'nl-club-vision' && <NonLeagueClubVisionView />}
      {activeDept === 'nl-squad' && <NLSquadView />}
      {activeDept === 'nl-fixtures' && <NLFixturesView />}
      {activeDept === 'nl-training' && <NLTrainingView />}
      {activeDept === 'nl-tactics' && <NLTacticsView />}
      {activeDept === 'nl-set-pieces' && <NLSetPiecesView />}
      {activeDept === 'nl-medical' && <NLMedicalView />}
      {activeDept === 'nl-transfers' && <NLTransfersView />}
      {activeDept === 'nl-finance' && <NLFinanceView />}
      {activeDept === 'nl-ground' && <NLGroundView />}
      {activeDept === 'nl-safeguarding' && <NLSafeguardingView />}
      {activeDept === 'nl-matchday' && <NLMatchdayView onToast={onToast} />}
      {activeDept === 'nl-comms' && <NLCommsView onToast={onToast} />}
      {activeDept === 'nl-media' && <MediaContentModule sport="nonleague" accentColor="#D97706" />}
      {activeDept === 'nl-committee' && <NLCommitteeView />}
      {activeDept === 'nl-gps' && <NLGPSView />}
      {activeDept === 'nl-gps-heatmaps' && <NLGPSHeatmapsView />}
      {activeDept === 'nl-matchfees' && <NLMatchFeesView />}
      {activeDept === 'nl-cupmanager' && <NLCupManagerView />}
      {activeDept === 'nl-registration' && <NLRegistrationView />}
      {activeDept === 'nl-discipline' && <NLDisciplineView />}
      {activeDept === 'nl-aihalftime' && <NLAIHalftimeView />}
      {activeDept === 'nl-preseason' && <NLPreSeasonView />}
      {activeDept === 'nl-kit' && <NLPlaceholderView label="Kit & Equipment" />}
      {activeDept === 'nl-sponsorship' && <NLPlaceholderView label="Sponsorship" />}
      {activeDept === 'nl-fundraising' && <NLPlaceholderView label="Fundraising" />}
      {activeDept === 'nl-insurance' && <NLPlaceholderView label="Insurance" />}
      {activeDept === 'nl-merchandise' && <NLPlaceholderView label="Merchandise" />}
      {activeDept === 'nl-ground-hire' && <NLPlaceholderView label="Ground Hire" />}
    </div>
  )
}
