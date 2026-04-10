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
  Handshake, Search, Copy, Zap, BarChart3,
} from 'lucide-react'
import { useElevenLabsTTS as useSpeech } from '@/hooks/useElevenLabsTTS'
import NLSetPiecesView from '@/components/football/NLSetPiecesView'

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
  | 'nl-overview' | 'nl-club-profile' | 'nl-squad' | 'nl-fixtures' | 'nl-training' | 'nl-tactics'
  | 'nl-set-pieces' | 'nl-medical' | 'nl-transfers' | 'nl-finance' | 'nl-ground'
  | 'nl-safeguarding' | 'nl-matchday' | 'nl-comms' | 'nl-committee'
  | 'nl-gps' | 'nl-matchfees' | 'nl-cupmanager' | 'nl-preseason'
  | 'nl-registration' | 'nl-discipline' | 'nl-kit' | 'nl-sponsorship'
  | 'nl-fundraising' | 'nl-merchandise' | 'nl-insurance'
  | 'nl-morningroundup' | 'nl-aihalftime'

type NLSection = null | 'Football' | 'Operations' | 'Club'

export const NL_SIDEBAR_ITEMS: { id: NLDeptId; label: string; icon: React.ElementType; section: NLSection }[] = [
  { id: 'nl-overview',        label: 'Overview',                icon: Home,           section: null },
  { id: 'nl-morningroundup',  label: 'Morning Roundup',         icon: Bell,           section: null },
  { id: 'nl-club-profile',    label: 'Club Profile',            icon: MapPin,         section: null },
  { id: 'nl-preseason',       label: 'Pre-Season',              icon: Calendar,       section: null },
  { id: 'nl-aihalftime',      label: 'AI Halftime Brief',       icon: Target,         section: 'Football' },
  { id: 'nl-squad',           label: 'Squad',                   icon: Shirt,          section: 'Football' },
  { id: 'nl-fixtures',        label: 'Fixtures & Cups',         icon: Calendar,       section: 'Football' },
  { id: 'nl-cupmanager',      label: 'Cup Manager',             icon: Trophy,         section: 'Football' },
  { id: 'nl-training',        label: 'Training',                icon: Target,         section: 'Football' },
  { id: 'nl-tactics',         label: 'Tactics',                 icon: Clipboard,      section: 'Football' },
  { id: 'nl-set-pieces',      label: 'Set Pieces',              icon: Target,         section: 'Football' },
  { id: 'nl-gps',             label: 'GPS & Performance',       icon: Activity,       section: 'Football' },
  { id: 'nl-medical',         label: 'Medical',                 icon: Heart,          section: 'Football' },
  { id: 'nl-transfers',       label: 'Transfers & Recruitment', icon: UserPlus,       section: 'Football' },
  { id: 'nl-registration',    label: 'Player Registration',     icon: Shield,         section: 'Operations' },
  { id: 'nl-discipline',      label: 'Discipline Log',          icon: AlertTriangle,  section: 'Operations' },
  { id: 'nl-matchfees',       label: 'Match Fee Tracker',       icon: DollarSign,     section: 'Operations' },
  { id: 'nl-kit',             label: 'Kit & Equipment',         icon: Shirt,          section: 'Operations' },
  { id: 'nl-finance',         label: 'Finance',                 icon: DollarSign,     section: 'Operations' },
  { id: 'nl-ground',          label: 'Ground & Facilities',     icon: MapPin,         section: 'Operations' },
  { id: 'nl-safeguarding',    label: 'Safeguarding',            icon: Shield,         section: 'Operations' },
  { id: 'nl-matchday',        label: 'Matchday',                icon: Trophy,         section: 'Operations' },
  { id: 'nl-sponsorship',     label: 'Sponsorship',             icon: Handshake,      section: 'Club' },
  { id: 'nl-fundraising',     label: 'Fundraising',             icon: Heart,          section: 'Club' },
  { id: 'nl-insurance',       label: 'Insurance',               icon: Shield,         section: 'Club' },
  { id: 'nl-comms',           label: 'Comms',                   icon: MessageSquare,  section: 'Club' },
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

// ─── NL Overview View ───────────────────────────────────────────────────────

function NLOverviewView({ onToast, userName }: { onToast: (m: string) => void; userName?: string }) {
  const { speak, stop, isPlaying } = useSpeech()
  const [briefingExpanded, setBriefingExpanded] = useState(false)
  const [overviewTab, setOverviewTab] = useState<'getting-started' | 'dashboard' | 'quick-wins' | 'daily-tasks' | 'dont-miss' | 'team' | 'insights'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lumio_nonleague_onboarding')
      if (stored) { const parsed = JSON.parse(stored); if (parsed.every((v: boolean) => v)) return 'dashboard' }
    }
    return 'getting-started'
  })
  const [onboardingChecks, setOnboardingChecks] = useState<boolean[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lumio_nonleague_onboarding')
      if (stored) return JSON.parse(stored)
    }
    return Array(10).fill(false)
  })
  const [expandedRoundup, setExpandedRoundup] = useState<string | null>(null)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [teamSubTab, setTeamSubTab] = useState<'today' | 'org' | 'info' | 'club'>('today')
  const nextMatch = NL_FIXTURES.find(f => !f.result)
  const played = NL_FIXTURES.filter(f => f.result)
  const squadFit = NL_SQUAD.filter(p => !p.injured && !p.suspended).length
  const displayName = userName?.split(' ')[0] || 'Steve'

  const onboardingItems = [
    'Register with the FA',
    'Add your first team squad',
    'Set your league fixtures',
    'Upload ground grading docs',
    'Add sponsorship deals',
    'Configure match day operations',
    'Set up player contracts',
    'Add your committee/board',
    'Connect your social media',
    "You're ready — kick off!",
  ]

  function toggleOnboarding(idx: number) {
    const next = [...onboardingChecks]
    next[idx] = !next[idx]
    setOnboardingChecks(next)
    if (typeof window !== 'undefined') localStorage.setItem('lumio_nonleague_onboarding', JSON.stringify(next))
  }

  const roundupCategories = [
    { id: 'player', emoji: '\uD83D\uDCAC', label: 'Player Messages', count: 2, items: [
      { text: 'Ryan Fletcher: "Knee feels better, think I can make Saturday"', time: '07:45' },
      { text: 'Declan Nash: "When does my suspension end? Need to know for work"', time: '08:10' },
    ]},
    { id: 'match', emoji: '\uD83D\uDCCB', label: 'Match Admin', count: 2, items: [
      { text: 'Referee confirmed for Saturday: Mr. D. Hargreaves', time: '09:00' },
      { text: 'Redbourne Town: away kit is white — no clash', time: '08:30' },
    ]},
    { id: 'finance', emoji: '\uD83D\uDCB0', label: 'Finance Alerts', count: 1, urgent: true, items: [
      { text: '6 players owe match fees from last Saturday (total: £240)', time: '08:00' },
    ]},
    { id: 'fa', emoji: '\uD83C\uDFDB\uFE0F', label: 'FA Alerts', count: 1, urgent: true, items: [
      { text: 'Ground grading inspection in 14 days — floodlight lux test OUTSTANDING', time: '07:00' },
    ]},
  ]

  return (
    <div className="space-y-4">
      {/* Good morning panel with inline KPIs */}
      <div className="rounded-xl p-4" style={{ background: `linear-gradient(135deg, ${BG} 0%, #78350F 100%)`, border: `1px solid ${PRIMARY}33` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold" style={{ color: ACCENT }}>Good morning, {displayName}.</div>
            <span className="text-xs" style={{ color: TEXT_SEC }}>Wednesday 2 April 2026</span>
          </div>
          <div className="flex gap-0.5">
            {NL_FORM_LAST5.map((r, i) => (
              <span key={i} className="w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center"
                style={{ backgroundColor: r === 'W' ? '#22C55E' : r === 'D' ? GOLD : '#EF4444', color: '#fff' }}>{r}</span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-lg px-3 py-2" style={{ backgroundColor: `${PRIMARY}22`, border: `1px solid ${PRIMARY}33` }}>
            <div className="text-lg font-black" style={{ color: ACCENT }}>4th</div>
            <div className="text-[10px]" style={{ color: TEXT_SEC }}>League Position</div>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ backgroundColor: '#3B82F622', border: '1px solid #3B82F633' }}>
            <div className="text-lg font-black" style={{ color: '#93C5FD' }}>Sat 15:00</div>
            <div className="text-[10px]" style={{ color: TEXT_SEC }}>vs Redbourne Town (H)</div>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ backgroundColor: '#22C55E22', border: '1px solid #22C55E33' }}>
            <div className="text-lg font-black" style={{ color: '#86EFAC' }}>{squadFit}/23</div>
            <div className="text-[10px]" style={{ color: TEXT_SEC }}>Squad Fit</div>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ backgroundColor: '#EF444422', border: '1px solid #EF444433' }}>
            <div className="text-lg font-black" style={{ color: '#FCA5A5' }}>1</div>
            <div className="text-[10px]" style={{ color: TEXT_SEC }}>Suspended (Nash)</div>
          </div>
        </div>
      </div>

      {/* Expandable Morning Roundup */}
      <SectionCard title="Morning Roundup" action={<Badge color={GOLD}>{roundupCategories.reduce((s, c) => s + c.count, 0)} items</Badge>}>
        <div className="space-y-1">
          {roundupCategories.map(cat => (
            <div key={cat.id}>
              <button onClick={() => setExpandedRoundup(expandedRoundup === cat.id ? null : cat.id)} className="flex items-center justify-between w-full py-2 px-2 rounded-lg text-left transition-all" style={{ backgroundColor: expandedRoundup === cat.id ? `${PRIMARY}12` : 'transparent' }}>
                <div className="flex items-center gap-2">
                  <span>{cat.emoji}</span>
                  <span className="text-sm font-medium" style={{ color: TEXT }}>{cat.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: ('urgent' in cat && cat.urgent) ? '#EF44441a' : `${PRIMARY}1a`, color: ('urgent' in cat && cat.urgent) ? '#EF4444' : PRIMARY }}>{cat.count}</span>
                </div>
                {expandedRoundup === cat.id ? <ChevronUp size={14} style={{ color: TEXT_SEC }} /> : <ChevronDown size={14} style={{ color: TEXT_SEC }} />}
              </button>
              {expandedRoundup === cat.id && (
                <div className="pl-8 pb-2 space-y-2">
                  {cat.items.map((item, j) => (
                    <div key={j} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: BG }}>
                      <div>
                        <p className="text-xs" style={{ color: TEXT }}>{item.text}</p>
                        <p className="text-[10px]" style={{ color: TEXT_SEC }}>{item.time}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-2">
                        <button onClick={() => onToast('Reply sent')} className="px-2 py-1 rounded text-[10px] font-semibold" style={{ backgroundColor: `${PRIMARY}1a`, color: PRIMARY }}>Reply</button>
                        <button onClick={() => onToast('Dismissed')} className="px-2 py-1 rounded text-[10px] font-semibold" style={{ backgroundColor: `${BORDER}`, color: TEXT_SEC }}>Dismiss</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Quick Actions — 12 pill buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { id:'availability',  label:'WhatsApp Availability', icon: MessageSquare, hot:false },
          { id:'matchfees',     label:'Match Fee Tracker',     icon: DollarSign,    hot:false },
          { id:'aihalftime',    label:'AI Halftime Brief',     icon: Target,        hot:true },
          { id:'teamselection', label:'Team Selection AI',     icon: Clipboard,     hot:true },
          { id:'matchreport',   label:'Match Report AI',       icon: FileText,      hot:true },
          { id:'groundgrading', label:'FA Ground Grading',     icon: Shield,        hot:false },
          { id:'opposition',    label:'Opposition Scout AI',   icon: Search,        hot:true },
          { id:'sponsor',       label:'Sponsor Post AI',       icon: Handshake,     hot:true },
          { id:'cupmanager',    label:'Cup Manager',           icon: Trophy,        hot:false },
          { id:'registration',  label:'Player Registration',   icon: Users,         hot:false },
          { id:'finance',       label:'Finance Logger',        icon: DollarSign,    hot:false },
          { id:'discipline',    label:'Discipline Log',        icon: AlertTriangle, hot:false },
        ].map(a => (
          <button key={a.id} onClick={() => setActiveModal(a.id)}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap relative"
            style={{ background: a.hot ? '#F59E0B18' : '#111318', border: a.hot ? '1px solid #F59E0B50' : '1px solid #1F2937', color: a.hot ? '#F59E0B' : '#9CA3AF' }}>
            <a.icon size={12} />{a.label}
            {a.hot && <span className="absolute -top-1 -right-1 text-[8px] px-1 rounded-full font-black" style={{ backgroundColor: '#F59E0B', color: '#fff' }}>AI</span>}
          </button>
        ))}
      </div>

      {/* Overview Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: BORDER }}>
        {(['getting-started', 'dashboard', 'quick-wins', 'daily-tasks', 'dont-miss', 'team', 'insights'] as const).map(t => (
          <button key={t} onClick={() => setOverviewTab(t)} className="px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-all whitespace-nowrap"
            style={{ borderBottomColor: overviewTab === t ? '#F59E0B' : 'transparent', color: overviewTab === t ? TEXT : TEXT_SEC, backgroundColor: overviewTab === t ? '#F59E0B0d' : 'transparent' }}>
            {t === 'getting-started' ? '🚀 Getting Started' : t === 'dashboard' ? '🏠 Dashboard' : t === 'quick-wins' ? '⚡ Quick Wins' : t === 'daily-tasks' ? '✅ Daily Tasks' : t === 'dont-miss' ? "🔴 Don't Miss" : t === 'team' ? '👥 Team' : '📊 Insights'}
          </button>
        ))}
      </div>

      {overviewTab === 'getting-started' && (
        <SectionCard title={`Getting Started — ${onboardingChecks.filter(Boolean).length}/10`}>
          <div className="space-y-1">
            {onboardingItems.map((item, i) => (
              <button key={i} onClick={() => toggleOnboarding(i)} className="flex items-center gap-3 w-full text-left py-2 px-2 rounded-lg transition-all" style={{ backgroundColor: onboardingChecks[i] ? `${PRIMARY}12` : 'transparent' }}>
                <div className="flex items-center justify-center w-5 h-5 rounded-full shrink-0 text-[10px] font-bold" style={{ backgroundColor: onboardingChecks[i] ? '#22C55E' : BORDER, color: onboardingChecks[i] ? '#fff' : TEXT_SEC }}>
                  {onboardingChecks[i] ? <Check size={12} /> : i + 1}
                </div>
                <span className="text-sm" style={{ color: onboardingChecks[i] ? TEXT_SEC : TEXT, textDecoration: onboardingChecks[i] ? 'line-through' : 'none' }}>{item}</span>
              </button>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Quick Wins tab */}
      {overviewTab === 'quick-wins' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2" style={{ color: TEXT }}>⚡ Quick Wins</h2>
              <p className="text-sm mt-0.5" style={{ color: TEXT_SEC }}>High impact, low effort — sorted by priority.</p>
            </div>
          </div>
          {[
            { task: 'Chase 6 outstanding match fees via WhatsApp', priority: 'High', action: 'Send Reminders', color: '#EF4444', effort: '2min', source: 'Finance' },
            { task: 'Confirm Fletcher fitness for Saturday', priority: 'High', action: 'Text Fletcher', color: '#EF4444', effort: '2min', source: 'Squad' },
            { task: 'Post matchday announcement on social media', priority: 'Medium', action: 'Use Template', color: GOLD, effort: '5min', source: 'Social' },
            { task: 'Book floodlight lux test before inspection', priority: 'High', action: 'Call Northern Electricals', color: '#EF4444', effort: '5min', source: 'Ground' },
            { task: 'Update squad availability for Redbourne game', priority: 'Medium', action: 'Send Poll', color: GOLD, effort: '2min', source: 'Squad' },
          ].map((qw, i) => (
            <div key={i} className="rounded-2xl p-5 transition-all" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${qw.color}1e`, color: qw.color }}>{qw.priority.toUpperCase()} IMPACT</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F59E0B1e', color: '#F59E0B' }}>⏱ {qw.effort}</span>
                  </div>
                  <h3 className="font-bold mb-1" style={{ color: '#F9FAFB' }}>{qw.task}</h3>
                  <p className="text-xs mt-2" style={{ color: '#374151' }}>Source: {qw.source}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => onToast(`${qw.action} triggered`)} className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{ backgroundColor: '#F59E0B' }}>{qw.action} →</button>
                  <button className="px-4 py-2 text-xs rounded-xl transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>Mark done</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Daily Tasks tab */}
      {overviewTab === 'daily-tasks' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2" style={{ color: TEXT }}>✅ Daily Tasks</h2>
              <p className="text-sm mt-0.5" style={{ color: TEXT_SEC }}>Your operational checklist for today.</p>
            </div>
          </div>
          {[
            { task: 'Review training attendance from Thursday', priority: 'Medium', category: 'Football', action: 'Open Training', color: GOLD },
            { task: 'Approve programme notes for Saturday', priority: 'Low', category: 'Operations', action: 'Edit Notes', color: TEXT_SEC },
            { task: 'Reply to Harfield Brewery sponsorship email', priority: 'High', category: 'Commercial', action: 'Draft Reply', color: '#EF4444' },
            { task: 'Check pitch condition after overnight rain', priority: 'Medium', category: 'Ground', action: 'Log Inspection', color: GOLD },
            { task: 'Update FA Vase team sheet if Fletcher is fit', priority: 'Low', category: 'Football', action: 'Update Sheet', color: TEXT_SEC },
          ].map((dt, i) => (
            <div key={i} className="rounded-xl p-4 transition-all" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer" style={{ borderColor: '#374151' }}>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold mb-1" style={{ color: '#F9FAFB' }}>{dt.task}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${dt.color}1e`, color: dt.color }}>{dt.priority}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{dt.category}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F59E0B1e', color: '#F59E0B' }}>Lumio</span>
                      <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>Today</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => onToast(dt.action)} className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{ backgroundColor: '#F59E0B' }}>{dt.action} →</button>
                  <button className="px-4 py-2 text-xs rounded-xl transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>Mark done</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Don't Miss tab */}
      {overviewTab === 'dont-miss' && (
        <SectionCard title="Don't Miss">
          <div className="space-y-2">
            {[
              { item: 'Ground grading inspection', urgency: 'Critical', days: '14 days', consequence: 'Fail = possible ground closure or demotion' },
              { item: 'Harfield Brewery sponsorship renewal', urgency: 'High', days: 'End of April', consequence: 'Lose £3,000 shirt sponsor if no decision' },
              { item: 'FA registration deadline', urgency: 'High', days: '15 Apr', consequence: 'New signings ineligible after this date' },
              { item: 'County Cup semi-final date', urgency: 'Medium', days: 'TBC April', consequence: 'Need to confirm availability with league' },
              { item: 'DBS renewal — Pete Hargreaves', urgency: 'High', days: 'Overdue', consequence: 'Treasurer DBS expired — compliance issue' },
            ].map((dm, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold" style={{ color: TEXT }}>{dm.item}</span>
                  <Badge color={dm.urgency === 'Critical' ? '#EF4444' : dm.urgency === 'High' ? GOLD : '#3B82F6'}>{dm.urgency} — {dm.days}</Badge>
                </div>
                <p className="text-[10px]" style={{ color: '#EF4444' }}>{dm.consequence}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Team tab */}
      {overviewTab === 'team' && (
        <div className="space-y-4">
          <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: CARD_BG }}>
            {(['today', 'org', 'info', 'club'] as const).map(t => (
              <button key={t} onClick={() => setTeamSubTab(t)} className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{ backgroundColor: teamSubTab === t ? PRIMARY : 'transparent', color: teamSubTab === t ? '#fff' : TEXT_SEC }}>
                {t === 'today' ? 'Team Today' : t === 'org' ? 'Org Chart' : t === 'info' ? 'Team Info' : 'Club Info'}
              </button>
            ))}
          </div>
          {teamSubTab === 'today' && (
            <SectionCard title="Team Today">
              <div className="space-y-2">
                {[
                  { name: 'Mark Houghton', role: 'Manager', status: 'At training ground', since: '07:30' },
                  { name: 'Gary Fielding', role: 'Assistant Manager', status: 'Scouting Redbourne tonight', since: 'Away' },
                  { name: 'Sandra Whitmore', role: 'Club Secretary', status: 'Office — processing registrations', since: '09:00' },
                  { name: 'Keith Mellor', role: 'Groundsman', status: 'Pitch inspection after rain', since: '06:30' },
                  { name: 'Jess Brennan', role: 'Welfare Officer', status: 'Available on call', since: '' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: BG }}>
                    <div>
                      <p className="text-xs font-medium" style={{ color: TEXT }}>{s.name}</p>
                      <p className="text-[10px]" style={{ color: PRIMARY }}>{s.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px]" style={{ color: TEXT_SEC }}>{s.status}</p>
                      {s.since && <p className="text-[10px]" style={{ color: TEXT_SEC }}>Since {s.since}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
          {teamSubTab === 'org' && (
            <SectionCard title="Organisation Chart">
              <div className="text-center space-y-4">
                <div className="inline-block p-3 rounded-lg" style={{ backgroundColor: `${PRIMARY}1a`, border: `1px solid ${PRIMARY}33` }}>
                  <p className="text-xs font-bold" style={{ color: PRIMARY }}>Brian Crossley</p>
                  <p className="text-[10px]" style={{ color: TEXT_SEC }}>Chairman</p>
                </div>
                <div className="flex justify-center gap-4 flex-wrap">
                  {[{ name: 'Mark Houghton', role: 'Manager' }, { name: 'Sandra Whitmore', role: 'Secretary' }, { name: 'Pete Hargreaves', role: 'Treasurer' }].map((p, i) => (
                    <div key={i} className="p-2 rounded-lg" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
                      <p className="text-[10px] font-semibold" style={{ color: TEXT }}>{p.name}</p>
                      <p className="text-[10px]" style={{ color: TEXT_SEC }}>{p.role}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-3 flex-wrap">
                  {[{ name: 'Gary Fielding', role: 'Asst Manager' }, { name: 'Keith Mellor', role: 'Groundsman' }, { name: 'Jess Brennan', role: 'Welfare' }, { name: 'Mike Thornton', role: 'Commercial' }].map((p, i) => (
                    <div key={i} className="p-2 rounded-lg" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
                      <p className="text-[10px] font-semibold" style={{ color: TEXT }}>{p.name}</p>
                      <p className="text-[10px]" style={{ color: TEXT_SEC }}>{p.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}
          {teamSubTab === 'info' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: 'Mark Houghton', role: 'Manager', badges: 'UEFA B Licence', exp: '4 seasons', style: 'Direct, set-piece focused' },
                { name: 'Gary Fielding', role: 'Assistant', badges: 'FA Level 2', exp: '3 seasons', style: 'Defensive organisation' },
                { name: 'Sandra Whitmore', role: 'Secretary', badges: 'FA Admin Certified', exp: '6 years', style: 'Registrations, compliance' },
              ].map((card, i) => (
                <div key={i} className="rounded-xl overflow-hidden" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
                  <div className="p-1" style={{ backgroundColor: PRIMARY }} />
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-bold" style={{ color: TEXT }}>{card.name}</p>
                    <Badge color={PRIMARY}>{card.role}</Badge>
                    <div className="text-[10px] space-y-1" style={{ color: TEXT_SEC }}>
                      <p>Qualifications: {card.badges}</p>
                      <p>Experience: {card.exp}</p>
                      <p>Focus: {card.style}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {teamSubTab === 'club' && (
            <SectionCard title="Club Info">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ['Founded', '1887'], ['Ground', 'Harfield Community Stadium'], ['Capacity', '1,200'], ['League', 'NPL West (Step 4)'],
                  ['Nickname', 'The Amber Army'], ['Colours', 'Amber & Black'], ['Chairman', 'Brian Crossley'], ['Manager', 'Mark Houghton'],
                ].map(([l, v], i) => (
                  <div key={i} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ color: TEXT_SEC }}>{l}</span>
                    <span className="font-medium" style={{ color: TEXT }}>{v}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {/* Insights tab */}
      {overviewTab === 'insights' && (
        <div className="space-y-4">
          <SectionCard title="Role-Based Insights">
            <div className="space-y-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
                <div className="flex items-center gap-2 mb-2"><span>&#9917;</span><span className="text-xs font-bold" style={{ color: PRIMARY }}>Manager View</span></div>
                <div className="space-y-1 text-xs" style={{ color: TEXT_SEC }}>
                  <p>Form: WDLWW — 3rd best in division over last 5</p>
                  <p>Squad depth concern at LB if Okonkwo injured — only Rafferty as cover</p>
                  <p>Grady on 14 goals — needs 4 more in 5 games for 18-goal target</p>
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
                <div className="flex items-center gap-2 mb-2"><span>&#127963;&#65039;</span><span className="text-xs font-bold" style={{ color: PRIMARY }}>Chairman View</span></div>
                <div className="space-y-1 text-xs" style={{ color: TEXT_SEC }}>
                  <p>Season P&L: +£810 surplus — on track</p>
                  <p>Attendance trending up: 280 record vs Hyde, avg 213</p>
                  <p>Sponsorship renewals due: 3 sponsors pending decision</p>
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
                <div className="flex items-center gap-2 mb-2"><span>&#128176;</span><span className="text-xs font-bold" style={{ color: PRIMARY }}>Treasurer View</span></div>
                <div className="space-y-1 text-xs" style={{ color: TEXT_SEC }}>
                  <p>Outstanding match fees: £240 (6 players)</p>
                  <p>Ground works needed: £1,400 (floodlights + ramp)</p>
                  <p>Bar income tracking +£520 vs budget</p>
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
                <div className="flex items-center gap-2 mb-2"><span>&#128203;</span><span className="text-xs font-bold" style={{ color: PRIMARY }}>Secretary View</span></div>
                <div className="space-y-1 text-xs" style={{ color: TEXT_SEC }}>
                  <p>FA registration deadline: 15 Apr — all current players registered</p>
                  <p>DBS expired: Pete Hargreaves — renewal needed immediately</p>
                  <p>Ground grading inspection: 15 Apr — 2 items outstanding</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {overviewTab === 'dashboard' && <>
      {/* AI Briefing */}
      <div className="rounded-xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${BG} 0%, #78350F 100%)`, border: `1px solid ${BORDER}` }}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles size={14} style={{ color: ACCENT }} />
              <span className="text-xs font-semibold" style={{ color: ACCENT }}>AI Morning Briefing</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => isPlaying ? stop() : speak(NL_MORNING_BRIEFING)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ backgroundColor: isPlaying ? '#EF4444' : PRIMARY, color: '#fff' }}>
                {isPlaying ? <X size={12} /> : <Sparkles size={12} />}{isPlaying ? 'Stop' : 'Listen'}
              </button>
              <button onClick={() => setBriefingExpanded(!briefingExpanded)} className="p-1 rounded" style={{ color: TEXT_SEC }}>
                {briefingExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>
          {briefingExpanded ? (
            <p className="text-sm leading-relaxed" style={{ color: TEXT }}>{NL_MORNING_BRIEFING}</p>
          ) : (
            <p className="text-sm truncate" style={{ color: TEXT_SEC }}>Brennan passed fit. Fletcher doubtful. Ground grading in 14 days...</p>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
        <StatCard label="Squad" value="23" icon={Users} color={PRIMARY} />
        <StatCard label="Fit" value={String(squadFit)} icon={CheckCircle2} color="#22C55E" />
        <StatCard label="Injured" value="2" icon={Heart} color="#EF4444" />
        <StatCard label="Suspended" value="1" icon={AlertCircle} color="#EF4444" sub="Nash (1 match)" />
        <StatCard label="League Position" value="4th" icon={Trophy} color={PRIMARY} sub="NPL West" />
        <StatCard label="Next Match" value="Sat" icon={Calendar} color="#3B82F6" sub="vs Redbourne (H)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <SectionCard title="This Week">
            <div className="space-y-2">
              {NL_TRAINING.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: TEXT }}>{s.day} — {s.time}</p>
                    <p className="text-xs" style={{ color: TEXT_SEC }}>{s.venue} · {s.topic}</p>
                  </div>
                  <Badge color={s.status === 'confirmed' ? '#22C55E' : GOLD}>{s.status}</Badge>
                </div>
              ))}
              {nextMatch && (
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium" style={{ color: TEXT }}>Saturday — {nextMatch.time} KO</p>
                    <p className="text-xs" style={{ color: TEXT_SEC }}>vs {nextMatch.opponent} ({nextMatch.ha}) · {nextMatch.venue}</p>
                  </div>
                  <Badge color="#3B82F6">Match Day</Badge>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Activity Feed" action={<span className="text-xs" style={{ color: PRIMARY }}>Live</span>}>
            <div className="space-y-0">
              {NL_ACTIVITY_FEED.map((run, i) => (
                <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < NL_ACTIVITY_FEED.length - 1 ? `1px solid ${BORDER}` : undefined }}>
                  <div className="flex-1 min-w-0"><p className="truncate text-sm" style={{ color: TEXT }}>{run.name}</p></div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <WFStatusBadge status={run.status} />
                    <p className="text-[10px]" style={{ color: TEXT_SEC }}>{run.ts}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Weather — Match Week">
            <div className="space-y-2">
              {NL_WEATHER.map((w, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <w.icon size={14} style={{ color: w.rain !== '5%' && w.rain !== '10%' && w.rain !== '15%' ? '#60A5FA' : GOLD }} />
                    <span className="text-xs" style={{ color: TEXT }}>{w.day}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: TEXT_SEC }}>{w.temp}</span>
                    <span className="text-xs" style={{ color: parseInt(w.rain) > 50 ? '#EF4444' : TEXT_SEC }}>{w.rain}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="League Position">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr style={{ color: TEXT_SEC, borderBottom: `1px solid ${BORDER}` }}>
                  <th className="text-left py-1 w-4">#</th><th className="text-left py-1">Team</th><th className="text-center py-1">P</th><th className="text-center py-1 font-bold">Pts</th>
                </tr></thead>
                <tbody>
                  {NL_LEAGUE_TABLE.filter(r => r.pos >= 1 && r.pos <= 7).map(r => (
                    <tr key={r.pos} style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: r.team === 'Harfield FC' ? `${PRIMARY}1a` : 'transparent' }}>
                      <td className="py-1" style={{ color: TEXT_SEC }}>{r.pos}</td>
                      <td className="py-1 font-medium" style={{ color: r.team === 'Harfield FC' ? PRIMARY : TEXT }}>{r.team}</td>
                      <td className="py-1 text-center" style={{ color: TEXT_SEC }}>{r.p}</td>
                      <td className="py-1 text-center font-bold" style={{ color: TEXT }}>{r.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Alerts">
            <div className="space-y-2">
              <div className="p-2 rounded-lg text-xs" style={{ backgroundColor: '#EF44441a', color: '#EF4444' }}>
                <AlertTriangle size={12} className="inline mr-1" />Ground grading inspection in 14 days — floodlight check outstanding
              </div>
              <div className="p-2 rounded-lg text-xs" style={{ backgroundColor: `${GOLD}1a`, color: GOLD }}>
                <AlertCircle size={12} className="inline mr-1" />Harfield Brewery sponsorship renewal — decision needed by end of month
              </div>
              <div className="p-2 rounded-lg text-xs" style={{ backgroundColor: `${GOLD}1a`, color: GOLD }}>
                <DollarSign size={12} className="inline mr-1" />Match fees due to 6 players from last week
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
      </>}

      {/* ─── Modals ─── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setActiveModal(null)}>
          <div className="rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-sm font-bold" style={{ color: TEXT }}>
                {activeModal === 'availability' ? 'WhatsApp Availability' :
                 activeModal === 'matchfees' ? 'Match Fee Tracker' :
                 activeModal === 'aihalftime' ? 'AI Halftime Brief' :
                 activeModal === 'matchreport' ? 'Match Report AI' :
                 activeModal === 'groundgrading' ? 'FA Ground Grading' :
                 activeModal === 'opposition' ? 'Opposition Scout AI' :
                 activeModal === 'sponsor' ? 'Sponsor Post AI' : 'Quick Action'}
              </p>
              <button onClick={() => setActiveModal(null)} style={{ color: TEXT_SEC }}><X size={16} /></button>
            </div>
            <div className="p-4">
              {activeModal === 'availability' && <NLAvailabilityModal onToast={onToast} />}
              {activeModal === 'matchfees' && <NLMatchFeeModal onToast={onToast} />}
              {activeModal === 'aihalftime' && <NLHalftimeModal onToast={onToast} />}
              {activeModal === 'matchreport' && <NLMatchReportModal onToast={onToast} />}
              {activeModal === 'groundgrading' && <NLGroundGradingModal onToast={onToast} />}
              {activeModal === 'opposition' && <NLOppositionScoutModal onToast={onToast} />}
              {activeModal === 'sponsor' && <NLSponsorPostModal onToast={onToast} />}
              {!['availability','matchfees','aihalftime','matchreport','groundgrading','opposition','sponsor'].includes(activeModal) && (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: TEXT_SEC }}>This action opens the full view. Use the sidebar to navigate there.</p>
                  <button onClick={() => setActiveModal(null)} className="mt-3 px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: PRIMARY, color: '#fff' }}>Close</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
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

function NLGPSView() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Avg Distance/Game" value="9.2km" icon={Activity} color={PRIMARY} />
        <StatCard label="Top Distance" value="11.4km" icon={TrendingUp} color="#22C55E" sub="Tom Brennan" />
        <StatCard label="Sprint Count Avg" value="42" icon={Zap} color="#3B82F6" />
        <StatCard label="Return to Play" value="2" icon={Heart} color="#EF4444" sub="Platt, Mellor" />
      </div>

      <SectionCard title="Squad Fitness — Last Match Distance (km)">
        <div className="space-y-1.5">
          {NL_SQUAD.filter(p => !p.injured && !p.suspended).slice(0, 11).map((p, i) => {
            const dist = [11.4, 10.8, 10.2, 9.8, 9.6, 9.4, 9.2, 9.0, 8.8, 8.5, 8.2][i] || 8.0
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs w-24 truncate" style={{ color: TEXT }}>{p.name.split(' ').pop()}</span>
                <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ backgroundColor: `${PRIMARY}1a` }}>
                  <div className="h-full rounded-full" style={{ backgroundColor: dist > 10 ? '#22C55E' : dist > 9 ? PRIMARY : '#EF4444', width: `${(dist / 12) * 100}%` }} />
                </div>
                <span className="text-xs font-mono w-12 text-right" style={{ color: TEXT_SEC }}>{dist}km</span>
              </div>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard title="Pitch Heatmap">
        <div className="rounded-lg p-8 text-center" style={{ backgroundColor: '#15803D22', border: `1px solid ${BORDER}` }}>
          <Activity size={32} style={{ color: TEXT_SEC, margin: '0 auto' }} />
          <p className="text-xs mt-2" style={{ color: TEXT_SEC }}>GPS heatmap visualisation — connect Veo or GPS tracker to populate</p>
          <p className="text-[10px] mt-1" style={{ color: PRIMARY }}>Veo integration coming soon</p>
        </div>
      </SectionCard>

      <SectionCard title="Return-to-Play Tracker">
        <div className="space-y-2">
          {NL_INJURIES.map((inj, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: TEXT }}>{inj.name}</span>
                <Badge color={inj.severity === 'Significant' ? '#EF4444' : GOLD}>{inj.severity}</Badge>
              </div>
              <p className="text-[10px]" style={{ color: TEXT_SEC }}>{inj.injury} — expected return: {inj.expectedReturn}</p>
              <div className="h-2 rounded-full overflow-hidden mt-2" style={{ backgroundColor: `${PRIMARY}1a` }}>
                <div className="h-full rounded-full" style={{ backgroundColor: '#22C55E', width: i === 0 ? '75%' : '40%' }} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
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

      {activeDept === 'nl-overview' && <NLOverviewView onToast={onToast} userName={userName} />}
      {activeDept === 'nl-morningroundup' && <NLOverviewView onToast={onToast} userName={userName} />}
      {activeDept === 'nl-club-profile' && <NLClubProfileView />}
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
      {activeDept === 'nl-committee' && <NLCommitteeView />}
      {activeDept === 'nl-gps' && <NLGPSView />}
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
    </div>
  )
}
