'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { use } from 'react'
import {
  Users, TrendingUp, AlertCircle, CheckCircle2, Clock, ArrowRight,
  Star, BarChart3, Sparkles, X, Plus, Check,
  Home, Settings, Menu, ChevronLeft, Calendar, FileText, Target,
  Volume2, Mic, Bell, Activity, Shield, Shirt, Clipboard, Trophy,
  UserPlus, DollarSign, Heart, Eye, MapPin, Briefcase, GraduationCap,
  Newspaper, Phone, MessageSquare, Search, Filter, ArrowUpDown,
  ExternalLink, Car, Wrench, FolderOpen, History, Send, Zap,
  ChevronDown, ChevronUp, Hash, Loader2, Printer, Upload, Link,
  CloudRain, Sun, Wind, Thermometer, Droplets, AlertTriangle,
  Mail, Globe, Info, CircleDot, Circle,
} from 'lucide-react'
import { useElevenLabsTTS as useSpeech } from '@/hooks/useElevenLabsTTS'
import GrassrootsTacticsView from '@/components/football/GrassrootsTacticsView'
import GrassrootsSetPiecesView from '@/components/football/GrassrootsSetPiecesView'
import MediaContentModule from '@/components/sports/media-content/MediaContentModule'
import { SportsDemoGate, RoleSwitcher } from '@/components/sports-demo'
import type { SportsDemoSession } from '@/components/sports-demo'
import { GrassrootsDashboardView, GR_THEME, GR_ACCENT } from './_components/GrassrootsDashboardModules'
import { GrassrootsSidebarNav } from './_components/GrassrootsShell'

// ─── GRASSROOTS ROLES ─────────────────────────────────────────────────────────
const GRASSROOTS_ROLES = [
  { id: 'manager',   label: 'Team Manager',   icon: '⚽', description: 'Full club view'      },
  { id: 'secretary', label: 'Club Secretary', icon: '📋', description: 'Admin & registrations'},
]

// ─── Types ────────────────────────────────────────────��──────────────────────

type DeptId =
  | 'overview' | 'club-profile' | 'squad' | 'matchday' | 'fixtures' | 'tactics' | 'set-pieces'
  | 'finances' | 'welfare' | 'communications' | 'media' | 'referee' | 'pitch' | 'kit'
  | 'volunteers' | 'travel' | 'documents' | 'history' | 'settings'
  | 'morning-roundup' | 'fa-sunday-cup' | 'halftime-talk' | 'availability' | 'discipline'
  | 'dbs-tracker' | 'subs-tracker' | 'juniors' | 'referee-bookings' | 'preseason'
  | 'player-profiles' | 'development' | 'league-reg' | 'safeguarding'

type SidebarSection = null | 'Club' | 'Match' | 'Squad' | 'Club Ops' | 'Players' | 'Admin' | 'Juniors' | 'Operations' | 'Resources' | 'Club Info'

// ─── Constants ───────────��────────────────────────────────────���──────────────

const PRIMARY = '#16A34A'
const DARK = '#15803D'
const ACCENT = '#BBF7D0'
const GOLD = '#F59E0B'
const BG = '#0F172A'
const CARD_BG = '#1E293B'
const BORDER = '#334155'
const TEXT = '#F8FAFC'
const TEXT_SEC = '#94A3B8'

const SIDEBAR_ITEMS: { id: DeptId; label: string; icon: React.ElementType; section: SidebarSection; badge?: string }[] = [
  { id: 'overview',         label: 'Dashboard',          icon: Home,           section: null },
  { id: 'morning-roundup',  label: 'Morning Roundup',    icon: Bell,           section: null, badge: 'NEW' },
  { id: 'fixtures',         label: 'Fixtures',           icon: Calendar,       section: 'Match' },
  { id: 'matchday',         label: 'Match Prep',         icon: Trophy,         section: 'Match' },
  { id: 'fa-sunday-cup',    label: 'FA Sunday Cup',      icon: Trophy,         section: 'Match', badge: 'NEW' },
  { id: 'halftime-talk',    label: 'Halftime Talk',      icon: Mic,            section: 'Match', badge: 'NEW' },
  { id: 'squad',            label: 'Squad List',         icon: Shirt,          section: 'Squad' },
  { id: 'availability',     label: 'Availability',       icon: CheckCircle2,   section: 'Squad' },
  { id: 'discipline',       label: 'Discipline',         icon: AlertCircle,    section: 'Squad' },
  { id: 'dbs-tracker',      label: 'DBS Tracker',        icon: Shield,         section: 'Squad', badge: 'NEW' },
  { id: 'kit',              label: 'Kit & Equipment',    icon: Shirt,          section: 'Club Ops' },
  { id: 'pitch',            label: 'Pitch Booking',      icon: MapPin,         section: 'Club Ops' },
  { id: 'subs-tracker',     label: 'Subs Tracker',       icon: DollarSign,     section: 'Club Ops', badge: 'NEW' },
  { id: 'finances',         label: 'Finances',           icon: DollarSign,     section: 'Club Ops' },
  { id: 'player-profiles',  label: 'Player Profiles',    icon: Users,          section: 'Players' },
  { id: 'development',      label: 'Development Notes',  icon: TrendingUp,     section: 'Players' },
  { id: 'referee-bookings', label: 'Referee Bookings',   icon: Eye,            section: 'Admin', badge: 'NEW' },
  { id: 'league-reg',       label: 'League Registration',icon: FileText,       section: 'Admin' },
  { id: 'safeguarding',     label: 'Safeguarding',       icon: Shield,         section: 'Admin' },
  { id: 'juniors',          label: 'Junior Section',     icon: GraduationCap,  section: 'Juniors', badge: 'NEW' },
  { id: 'tactics',          label: 'Tactics',            icon: Clipboard,      section: 'Club' },
  { id: 'set-pieces',       label: 'Set Pieces',         icon: Target,         section: 'Club' },
  { id: 'welfare',          label: 'Welfare',            icon: Shield,         section: 'Operations' },
  { id: 'communications',   label: 'Comms',              icon: MessageSquare,  section: 'Operations' },
  { id: 'media',            label: 'Media & Content',    icon: Newspaper,      section: 'Operations' },
  { id: 'referee',          label: 'Referees',           icon: Eye,            section: 'Operations' },
  { id: 'volunteers',       label: 'Volunteers',         icon: Users,          section: 'Resources' },
  { id: 'travel',           label: 'Travel',             icon: Car,            section: 'Resources' },
  { id: 'documents',        label: 'Documents',          icon: FolderOpen,     section: 'Resources' },
  { id: 'club-profile',     label: 'Club Profile',       icon: MapPin,         section: 'Club Info' },
  { id: 'history',          label: 'Club History',       icon: History,        section: 'Club Info' },
  { id: 'preseason',        label: 'Pre-Season',         icon: Activity,       section: 'Club Info', badge: 'NEW' },
  { id: 'settings',         label: 'Settings',           icon: Settings,       section: 'Club Info' },
]

// ─── Squad Data ───────────��──────────────────────────────────────────────────

interface AmateurPlayer {
  name: string; number: number; position: string; age: number; phone: string
  registered: boolean; seasonsAtClub: number; subsPaid: boolean; subsOwed: number
  goals: number; assists: number; yellowCards: number; redCards: number; motm: number; gamesPlayed: number
  availability: 'available' | 'unavailable' | 'maybe'
  trainingAvail: 'available' | 'unavailable' | 'maybe'
  last5: ('W' | 'D' | 'L' | '-')[]
  injured: boolean; injuryNote?: string
  medical?: string
}

const SQUAD: AmateurPlayer[] = [
  { name: 'Dave Hartley', number: 1, position: 'GK', age: 34, phone: '07700 900001', registered: true, seasonsAtClub: 8, subsPaid: true, subsOwed: 0, goals: 0, assists: 0, yellowCards: 1, redCards: 0, motm: 2, gamesPlayed: 11, availability: 'available', trainingAvail: 'available', last5: ['W','L','W','D','L'], injured: false },
  { name: 'Tommo Wilson', number: 2, position: 'RB', age: 28, phone: '07700 900002', registered: true, seasonsAtClub: 5, subsPaid: true, subsOwed: 0, goals: 1, assists: 3, yellowCards: 3, redCards: 0, motm: 1, gamesPlayed: 10, availability: 'available', trainingAvail: 'available', last5: ['W','L','W','W','L'], injured: false },
  { name: 'Chris Baker', number: 3, position: 'LB', age: 31, phone: '07700 900003', registered: true, seasonsAtClub: 6, subsPaid: true, subsOwed: 0, goals: 0, assists: 2, yellowCards: 2, redCards: 0, motm: 0, gamesPlayed: 9, availability: 'available', trainingAvail: 'maybe', last5: ['W','D','L','W','-'], injured: false },
  { name: 'Daz Simmons', number: 4, position: 'CB', age: 33, phone: '07700 900004', registered: true, seasonsAtClub: 7, subsPaid: false, subsOwed: 40, goals: 2, assists: 0, yellowCards: 4, redCards: 1, motm: 1, gamesPlayed: 11, availability: 'available', trainingAvail: 'available', last5: ['W','L','L','D','W'], injured: false },
  { name: 'Kev Murphy', number: 5, position: 'CB', age: 30, phone: '07700 900005', registered: true, seasonsAtClub: 4, subsPaid: true, subsOwed: 0, goals: 1, assists: 0, yellowCards: 2, redCards: 0, motm: 2, gamesPlayed: 10, availability: 'maybe', trainingAvail: 'available', last5: ['L','W','W','D','L'], injured: false, medical: 'Asthma — carries inhaler' },
  { name: 'Ryan Jennings', number: 6, position: 'CDM', age: 27, phone: '07700 900006', registered: true, seasonsAtClub: 3, subsPaid: true, subsOwed: 0, goals: 3, assists: 4, yellowCards: 3, redCards: 0, motm: 3, gamesPlayed: 11, availability: 'available', trainingAvail: 'available', last5: ['W','W','L','W','D'], injured: false },
  { name: 'Macca Taylor', number: 7, position: 'RW', age: 24, phone: '07700 900007', registered: true, seasonsAtClub: 2, subsPaid: true, subsOwed: 0, goals: 5, assists: 6, yellowCards: 1, redCards: 0, motm: 4, gamesPlayed: 11, availability: 'available', trainingAvail: 'available', last5: ['W','W','L','W','W'], injured: false },
  { name: 'Jonny Adams', number: 8, position: 'CM', age: 29, phone: '07700 900008', registered: true, seasonsAtClub: 5, subsPaid: false, subsOwed: 60, goals: 4, assists: 5, yellowCards: 2, redCards: 0, motm: 2, gamesPlayed: 10, availability: 'available', trainingAvail: 'unavailable', last5: ['D','W','L','W','L'], injured: false },
  { name: 'Gaz Whitfield', number: 9, position: 'ST', age: 26, phone: '07700 900009', registered: true, seasonsAtClub: 3, subsPaid: true, subsOwed: 0, goals: 9, assists: 2, yellowCards: 1, redCards: 0, motm: 5, gamesPlayed: 11, availability: 'available', trainingAvail: 'available', last5: ['W','W','L','D','W'], injured: false },
  { name: 'Liam Fry', number: 10, position: 'CAM', age: 25, phone: '07700 900010', registered: true, seasonsAtClub: 2, subsPaid: true, subsOwed: 0, goals: 6, assists: 8, yellowCards: 0, redCards: 0, motm: 3, gamesPlayed: 11, availability: 'unavailable', trainingAvail: 'unavailable', last5: ['W','D','W','W','L'], injured: true, injuryNote: 'Hamstring — return est. 12 Apr' },
  { name: 'Smithy Clarke', number: 11, position: 'LW', age: 23, phone: '07700 900011', registered: true, seasonsAtClub: 1, subsPaid: false, subsOwed: 20, goals: 3, assists: 4, yellowCards: 1, redCards: 0, motm: 1, gamesPlayed: 9, availability: 'available', trainingAvail: 'available', last5: ['L','W','-','W','D'], injured: false },
  { name: 'Robbo Davies', number: 12, position: 'CM', age: 32, phone: '07700 900012', registered: true, seasonsAtClub: 6, subsPaid: true, subsOwed: 0, goals: 2, assists: 3, yellowCards: 3, redCards: 0, motm: 1, gamesPlayed: 8, availability: 'available', trainingAvail: 'maybe', last5: ['W','L','-','D','W'], injured: false },
  { name: 'Nige Thornton', number: 14, position: 'CB', age: 35, phone: '07700 900014', registered: true, seasonsAtClub: 10, subsPaid: true, subsOwed: 0, goals: 1, assists: 0, yellowCards: 5, redCards: 0, motm: 0, gamesPlayed: 7, availability: 'maybe', trainingAvail: 'unavailable', last5: ['-','L','W','-','D'], injured: false, medical: 'Knee brace — right knee' },
  { name: 'Pete Langford', number: 15, position: 'RB', age: 22, phone: '07700 900015', registered: true, seasonsAtClub: 1, subsPaid: true, subsOwed: 0, goals: 0, assists: 1, yellowCards: 0, redCards: 0, motm: 0, gamesPlayed: 5, availability: 'available', trainingAvail: 'available', last5: ['-','-','W','L','-'], injured: false },
  { name: 'Ash Cooper', number: 16, position: 'ST', age: 28, phone: '07700 900016', registered: true, seasonsAtClub: 3, subsPaid: false, subsOwed: 80, goals: 4, assists: 1, yellowCards: 2, redCards: 1, motm: 1, gamesPlayed: 9, availability: 'unavailable', trainingAvail: 'unavailable', last5: ['L','D','W','L','L'], injured: true, injuryNote: 'Ankle sprain — 2 weeks' },
  { name: 'Mo Khan', number: 17, position: 'CM', age: 21, phone: '07700 900017', registered: true, seasonsAtClub: 1, subsPaid: true, subsOwed: 0, goals: 1, assists: 2, yellowCards: 0, redCards: 0, motm: 0, gamesPlayed: 6, availability: 'available', trainingAvail: 'available', last5: ['-','W','W','-','L'], injured: false },
  { name: 'Woody Brennan', number: 18, position: 'GK', age: 38, phone: '07700 900018', registered: true, seasonsAtClub: 12, subsPaid: true, subsOwed: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, motm: 1, gamesPlayed: 4, availability: 'available', trainingAvail: 'maybe', last5: ['-','-','W','-','-'], injured: false },
  { name: 'Jake Parsons', number: 20, position: 'LW', age: 20, phone: '07700 900020', registered: false, seasonsAtClub: 0, subsPaid: false, subsOwed: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, motm: 0, gamesPlayed: 0, availability: 'unavailable', trainingAvail: 'unavailable', last5: ['-','-','-','-','-'], injured: false },
]

// ─── Fixtures ────────────���──────────────────────────────────────��────────────

const FIXTURES = [
  { opponent: 'Westfield Arms FC', date: 'Sun 7 Sep', time: '10:30', venue: 'Millfield Rec', homeAway: 'H' as const, result: 'W 3-1', scorers: 'Whitfield 2, Fry', motm: 'Whitfield', cards: '🟨 Simmons' },
  { opponent: 'The Crown FC', date: 'Sun 14 Sep', time: '10:30', venue: 'Crown Meadow', homeAway: 'A' as const, result: 'L 0-2', scorers: '', motm: 'Simmons', cards: '🟨 Wilson, 🟨 Jennings' },
  { opponent: 'Railway Tavern', date: 'Sun 21 Sep', time: '10:30', venue: 'Millfield Rec', homeAway: 'H' as const, result: 'W 4-0', scorers: 'Taylor 2, Whitfield, Adams', motm: 'Taylor', cards: '' },
  { opponent: 'Plough Inn FC', date: 'Sun 28 Sep', time: '10:30', venue: 'Victoria Park', homeAway: 'A' as const, result: 'D 1-1', scorers: 'Fry', motm: 'Jennings', cards: '🟨 Simmons' },
  { opponent: 'Red Lion United', date: 'Sun 5 Oct', time: '10:30', venue: 'Millfield Rec', homeAway: 'H' as const, result: 'L 1-3', scorers: 'Cooper', motm: 'Murphy', cards: '🟥 Cooper' },
  { opponent: 'Hare & Hounds', date: 'Sun 12 Oct', time: '10:30', venue: 'Hare Lane', homeAway: 'A' as const, result: 'W 2-1', scorers: 'Whitfield, Taylor', motm: 'Whitfield', cards: '' },
  { opponent: 'Fox & Goose FC', date: 'Sun 19 Oct', time: '10:30', venue: 'Millfield Rec', homeAway: 'H' as const, result: 'L 0-1', scorers: '', motm: 'Hartley', cards: '🟨 Adams' },
  { opponent: 'Kings Arms Athletic', date: 'Sun 26 Oct', time: '10:30', venue: 'Kings Rec', homeAway: 'A' as const, result: 'D 2-2', scorers: 'Adams, Fry', motm: 'Adams', cards: '🟨 Simmons' },
  { opponent: 'White Hart FC', date: 'Sun 2 Nov', time: '10:30', venue: 'Millfield Rec', homeAway: 'H' as const, result: 'W 3-0', scorers: 'Whitfield 2, Clarke', motm: 'Fry', cards: '' },
  { opponent: 'Bell End FC', date: 'Sun 9 Nov', time: '10:30', venue: 'Bell End Rec', homeAway: 'A' as const, result: 'L 1-4', scorers: 'Taylor', motm: 'Taylor', cards: '🟨 Wilson, 🟥 Simmons' },
  { opponent: 'Old Oak FC', date: 'Sun 16 Nov', time: '10:30', venue: 'Millfield Rec', homeAway: 'H' as const, result: 'L 0-2', scorers: '', motm: 'Jennings', cards: '🟨 Thornton' },
  { opponent: 'The Crown FC', date: 'Sat 5 Apr', time: '14:00', venue: 'Crown Meadow', homeAway: 'A' as const, result: '', scorers: '', motm: '', cards: '' },
  { opponent: 'Railway Tavern', date: 'Sun 13 Apr', time: '10:30', venue: 'Railway Rec', homeAway: 'A' as const, result: '', scorers: '', motm: '', cards: '' },
  { opponent: 'Red Lion United', date: 'Sun 20 Apr', time: '10:30', venue: 'Millfield Rec', homeAway: 'H' as const, result: '', scorers: '', motm: '', cards: '' },
  { opponent: 'Fox & Goose FC', date: 'Sun 27 Apr', time: '10:30', venue: 'Fox Lane', homeAway: 'A' as const, result: '', scorers: '', motm: '', cards: '' },
]

const CUP_FIXTURES = [
  { comp: 'Westshire County FA Cup', round: 'Round 1', opponent: 'Plough Inn FC', result: 'W 3-0', date: 'Sun 5 Oct' },
  { comp: 'Westshire County FA Cup', round: 'Round 2', opponent: 'Riverside Athletic', result: 'W 2-1 (AET)', date: 'Sun 26 Oct' },
  { comp: 'Westshire County FA Cup', round: 'Quarter-Final', opponent: 'TBC — draw 8 Apr', result: '', date: 'Sun 4 May' },
  { comp: 'League Cup', round: 'Round 1', opponent: 'Bell End FC', result: 'W 4-1', date: 'Sun 12 Oct' },
  { comp: 'League Cup', round: 'Semi-Final', opponent: 'Fox & Goose FC', result: '', date: 'Sun 11 May' },
]

const LEAGUE_TABLE = [
  { pos: 1, team: 'Red Lion United', p: 11, w: 9, d: 1, l: 1, gf: 28, ga: 8, gd: 20, pts: 28 },
  { pos: 2, team: 'The Crown FC', p: 11, w: 8, d: 1, l: 2, gf: 22, ga: 10, gd: 12, pts: 25 },
  { pos: 3, team: 'Fox & Goose FC', p: 11, w: 7, d: 2, l: 2, gf: 19, ga: 9, gd: 10, pts: 23 },
  { pos: 4, team: 'Hare & Hounds', p: 11, w: 6, d: 3, l: 2, gf: 18, ga: 11, gd: 7, pts: 21 },
  { pos: 5, team: 'Kings Arms Athletic', p: 11, w: 5, d: 3, l: 3, gf: 20, ga: 15, gd: 5, pts: 18 },
  { pos: 6, team: 'White Hart FC', p: 11, w: 5, d: 2, l: 4, gf: 16, ga: 14, gd: 2, pts: 17 },
  { pos: 7, team: 'Railway Tavern', p: 11, w: 4, d: 3, l: 4, gf: 15, ga: 16, gd: -1, pts: 15 },
  { pos: 8, team: 'Sunday Rovers FC', p: 11, w: 4, d: 2, l: 5, gf: 17, ga: 18, gd: -1, pts: 14 },
  { pos: 9, team: 'Plough Inn FC', p: 11, w: 3, d: 2, l: 6, gf: 12, ga: 19, gd: -7, pts: 11 },
  { pos: 10, team: 'Old Oak FC', p: 11, w: 2, d: 1, l: 8, gf: 8, ga: 24, gd: -16, pts: 7 },
  { pos: 11, team: 'Westfield Arms FC', p: 11, w: 1, d: 2, l: 8, gf: 7, ga: 26, gd: -19, pts: 5 },
  { pos: 12, team: 'Bell End FC', p: 11, w: 1, d: 0, l: 10, gf: 6, ga: 30, gd: -24, pts: 3 },
]

const TRAINING_SESSIONS = [
  { day: 'Tuesday', time: '19:00–21:00', venue: 'Millfield Rec', topic: 'Passing drills + 7v7', status: 'confirmed' },
  { day: 'Thursday', time: '19:00���20:30', venue: 'Millfield Rec (3G)', topic: 'Set pieces + shooting', status: 'weather-check' },
]

// ─── Finance Data ──────���───────────────────────────���─────────────────────────

const EXPENSES = [
  { item: 'Pitch hire — Millfield Rec (6 home games)', amount: 360, category: 'Pitch', date: 'Sep-Nov' },
  { item: 'Referee fees (11 matches)', amount: 385, category: 'Referee', date: 'Sep-Nov' },
  { item: 'Match balls x3', amount: 75, category: 'Equipment', date: '1 Sep' },
  { item: 'Training bibs x20', amount: 48, category: 'Equipment', date: '1 Sep' },
  { item: 'First aid kit refill', amount: 32, category: 'Medical', date: '15 Oct' },
  { item: 'Away travel — minibus (Bell End)', amount: 120, category: 'Travel', date: '9 Nov' },
  { item: 'Kit printing — 18 shirts', amount: 144, category: 'Kit', date: '1 Sep' },
  { item: 'FA affiliation fee', amount: 45, category: 'Admin', date: '1 Aug' },
  { item: 'League registration', amount: 85, category: 'Admin', date: '1 Aug' },
]

const FUNDRAISING = [
  { event: 'Quiz Night — The Crown pub', target: 400, raised: 340, date: '15 Mar' },
  { event: 'Sponsored 5k Run', target: 500, raised: 285, date: '22 Mar' },
  { event: 'End of Season Dinner', target: 600, raised: 120, date: '10 May' },
  { event: 'Car Boot Sale', target: 200, raised: 200, date: '8 Feb' },
]

const SPONSORS = [
  { name: 'Hartley & Sons Plumbing', amount: 500, type: 'Kit Sponsor (front)', renewal: 'Aug 2026' },
  { name: 'The Crown Pub', amount: 200, type: 'Match Ball Sponsor', renewal: 'Aug 2026' },
  { name: 'Westshire Autos', amount: 150, type: 'Training Kit Sponsor', renewal: 'Jan 2027' },
  { name: 'Dave\'s Chippy', amount: 100, type: 'Programme Sponsor', renewal: 'Aug 2026' },
]

// ─── Comms Data ───────���──────────────────────────────────────────────────────

const RECENT_MESSAGES = [
  { to: 'All squad', subject: 'Training Tuesday 7pm — confirmed', date: '30 Mar', method: 'WhatsApp' },
  { to: 'All squad', subject: 'Saturday availability — Crown FC away', date: '28 Mar', method: 'WhatsApp' },
  { to: 'Parents group', subject: 'End of season presentation evening', date: '25 Mar', method: 'Email' },
  { to: 'Daz Simmons', subject: 'Subs reminder — 2 months outstanding', date: '22 Mar', method: 'WhatsApp' },
  { to: 'Committee', subject: 'Fundraiser update — quiz night raised £340', date: '20 Mar', method: 'Email' },
  { to: 'All squad', subject: 'Training cancelled — pitch waterlogged', date: '18 Mar', method: 'WhatsApp' },
  { to: 'Ash Cooper', subject: 'Get well soon — ankle update?', date: '15 Mar', method: 'WhatsApp' },
]

const ANNOUNCEMENTS = [
  { title: 'End of Season Awards Night — 10 May', body: 'Book your tickets — £25pp includes 3-course meal at The Crown. Partners welcome.', date: '28 Mar', pinned: true },
  { title: 'Kit collection day — Saturday 5 Apr after match', body: 'Please bring all club kit back. We need to do an inventory before ordering next season.', date: '26 Mar', pinned: false },
  { title: 'New player trial — Jake Parsons (LW)', body: 'Jake\'s coming to training Tuesday. Make him welcome. He\'s played for Old Oak youth.', date: '20 Mar', pinned: false },
]

// ─── Referee Data ────────────────────────────────────────────────────────────

const REFEREES = [
  { name: 'Graham Foster', phone: '07700 800001', level: 'Level 7', fee: 35, notes: 'Reliable. Prefers Sunday mornings.' },
  { name: 'Mike Hendricks', phone: '07700 800002', level: 'Level 7', fee: 35, notes: 'Available most weekends. Fair ref.' },
  { name: 'Paul Naylor', phone: '07700 800003', level: 'Level 6', fee: 40, notes: 'Strict but consistent. Cards for dissent.' },
]

const REF_BOOKINGS = [
  { fixture: 'vs The Crown FC (A)', date: 'Sat 5 Apr', referee: 'Graham Foster', status: 'Confirmed' as const, fee: 35, paid: false },
  { fixture: 'vs Railway Tavern (A)', date: 'Sun 13 Apr', referee: '', status: 'Unbooked' as const, fee: 35, paid: false },
  { fixture: 'vs Red Lion United (H)', date: 'Sun 20 Apr', referee: 'Mike Hendricks', status: 'Pending' as const, fee: 35, paid: false },
  { fixture: 'vs Fox & Goose FC (A)', date: 'Sun 27 Apr', referee: '', status: 'Unbooked' as const, fee: 35, paid: false },
]

// ─── Welfare Data ────────────────────────────────────────────────────────────

const DBS_RECORDS = [
  { name: 'Dave Hartley', role: 'Manager', dbsNumber: 'DBS-001-2024', expiry: '15 Mar 2027', status: 'Valid' as const },
  { name: 'Sue Hartley', role: 'Club Secretary', dbsNumber: 'DBS-002-2024', expiry: '20 Jun 2027', status: 'Valid' as const },
  { name: 'Nige Thornton', role: 'Assistant Manager', dbsNumber: 'DBS-003-2023', expiry: '10 Sep 2026', status: 'Valid' as const },
  { name: 'Karen Wilson', role: 'Welfare Officer', dbsNumber: 'DBS-004-2023', expiry: '1 Aug 2026', status: 'Valid' as const },
  { name: 'Robbo Davies', role: 'Youth Coach', dbsNumber: 'DBS-005-2022', expiry: '5 May 2025', status: 'Expired' as const },
]

const SAFEGUARDING_LOG = [
  { date: '12 Mar', player: 'Jake Parsons', type: 'Welfare check', severity: 'low' as const, reportedTo: 'Karen Wilson', outcome: 'Resolved — settling in well' },
  { date: '28 Feb', player: 'Mo Khan', type: 'Parental concern', severity: 'medium' as const, reportedTo: 'Karen Wilson', outcome: 'Meeting arranged with parent' },
]

const WELLBEING_SCORES = [
  { week: 'W/C 24 Mar', avg: 3.8, responses: 14 },
  { week: 'W/C 17 Mar', avg: 4.1, responses: 12 },
  { week: 'W/C 10 Mar', avg: 3.5, responses: 15 },
  { week: 'W/C 3 Mar', avg: 3.9, responses: 13 },
]

// ─── Kit Data ────────��───────────────────────────────���───────────────────────

const KIT_INVENTORY = [
  { item: 'Home kit (green/white)', sizes: { S: 2, M: 6, L: 7, XL: 3 }, total: 18 },
  { item: 'Away kit (navy/gold)', sizes: { S: 1, M: 5, L: 6, XL: 3 }, total: 15 },
  { item: 'Training bibs (orange)', sizes: { 'One size': 20 }, total: 20 },
  { item: 'GK kit (yellow)', sizes: { L: 1, XL: 1 }, total: 2 },
]

const EQUIPMENT_INVENTORY = [
  { item: 'Match balls (Mitre Delta)', stock: 3, minStock: 2, status: 'OK' as const },
  { item: 'Training balls', stock: 8, minStock: 6, status: 'OK' as const },
  { item: 'Cones (set of 50)', stock: 1, minStock: 1, status: 'OK' as const },
  { item: 'Training poles', stock: 6, minStock: 6, status: 'Low' as const },
  { item: 'Pop-up goals', stock: 2, minStock: 2, status: 'OK' as const },
  { item: 'First aid kit', stock: 1, minStock: 1, status: 'OK' as const },
  { item: 'Corner flags', stock: 4, minStock: 4, status: 'OK' as const },
]

// ─── Volunteer Data ───────��──────────────────────────────────────────────────

const VOLUNTEER_ROLES = [
  { fixture: 'vs The Crown FC (A)', date: 'Sat 5 Apr', lino1: 'Nige Thornton', lino2: 'Robbo Davies', kitMgr: 'Sue Hartley', firstAid: 'Karen Wilson', refreshments: 'UNFILLED', photos: 'Mo Khan' },
  { fixture: 'vs Railway Tavern (A)', date: 'Sun 13 Apr', lino1: 'UNFILLED', lino2: 'UNFILLED', kitMgr: 'Sue Hartley', firstAid: 'Karen Wilson', refreshments: 'UNFILLED', photos: 'UNFILLED' },
  { fixture: 'vs Red Lion United (H)', date: 'Sun 20 Apr', lino1: 'Nige Thornton', lino2: 'UNFILLED', kitMgr: 'Sue Hartley', firstAid: 'Karen Wilson', refreshments: 'UNFILLED', photos: 'Mo Khan' },
]

const VOLUNTEERS = [
  { name: 'Sue Hartley', role: 'Club Secretary / Kit Manager', dbsValid: true, availability: 'Most weekends' },
  { name: 'Karen Wilson', role: 'Welfare Officer / First Aid', dbsValid: true, availability: 'All weekends' },
  { name: 'Nige Thornton', role: 'Asst Manager / Linesman', dbsValid: true, availability: 'When not playing' },
  { name: 'Robbo Davies', role: 'Youth Coach / Linesman', dbsValid: false, availability: 'Most weekends' },
  { name: 'Mo Khan', role: 'Social Media / Photographer', dbsValid: false, availability: 'Alternate weekends' },
]

// ─── Travel Data ───────���──────────────────────────────────��──────────────────

const AWAY_FIXTURES = [
  { opponent: 'The Crown FC', date: 'Sat 5 Apr', venue: 'Crown Meadow, Westshire WS4 7BQ', meetPoint: 'Millfield car park', depart: '13:00', travelTime: '25 min', drivers: [{ name: 'Tommo Wilson', seats: 3, passengers: ['Baker', 'Khan'] }, { name: 'Jonny Adams', seats: 4, passengers: ['Whitfield', 'Taylor', 'Clarke'] }], needsLift: ['Langford'] },
  { opponent: 'Railway Tavern', date: 'Sun 13 Apr', venue: 'Railway Rec, Westshire WS6 2AB', meetPoint: 'Millfield car park', depart: '09:15', travelTime: '35 min', drivers: [], needsLift: [] },
  { opponent: 'Fox & Goose FC', date: 'Sun 27 Apr', venue: 'Fox Lane, Westshire WS8 1RP', meetPoint: 'Millfield car park', depart: '09:00', travelTime: '40 min', drivers: [], needsLift: [] },
]

// ─── Documents Data ──────��───────────────────────────────────────────────────

const DOCUMENTS = [
  { name: 'Club Constitution', type: 'PDF', uploaded: '1 Aug 2025', expiry: '', status: 'Current' as const },
  { name: 'Safeguarding Policy', type: 'PDF', uploaded: '1 Aug 2025', expiry: '', status: 'Current' as const },
  { name: 'Insurance Certificate', type: 'PDF', uploaded: '15 Jul 2025', expiry: '14 Jul 2026', status: 'Current' as const },
  { name: 'FA Affiliation Letter', type: 'PDF', uploaded: '1 Aug 2025', expiry: '31 Jul 2026', status: 'Current' as const },
  { name: 'Risk Assessment — Millfield Rec', type: 'PDF', uploaded: '1 Sep 2025', expiry: '', status: 'Current' as const },
  { name: 'Emergency Action Plan', type: 'PDF', uploaded: '1 Sep 2025', expiry: '', status: 'Current' as const },
]

// ─── Club History ���───────────────────────────────────────────────────────────

const HONOURS = [
  { season: '2019/20', honour: 'Westshire Sunday League Division 3 — Champions (promoted)' },
  { season: '2017/18', honour: 'Westshire County FA Cup — Runners-up' },
  { season: '2015/16', honour: 'Westshire Sunday League Division 3 — Runners-up' },
  { season: '2010/11', honour: 'Westshire League Cup — Winners' },
  { season: '2005/06', honour: 'Westshire Sunday League Division 4 — Champions (promoted)' },
  { season: '1997/98', honour: 'Westshire County FA Cup — Semi-finalists' },
]

const SEASON_RECORDS = [
  { season: '2024/25', finish: '8th (ongoing)', topScorer: 'Gaz Whitfield (9)', p: 11, w: 4, d: 2, l: 5 },
  { season: '2023/24', finish: '6th', topScorer: 'Liam Fry (14)', p: 22, w: 9, d: 5, l: 8 },
  { season: '2022/23', finish: '5th', topScorer: 'Gaz Whitfield (12)', p: 22, w: 10, d: 4, l: 8 },
  { season: '2021/22', finish: '9th', topScorer: 'Jonny Adams (8)', p: 22, w: 6, d: 4, l: 12 },
  { season: '2020/21', finish: 'Void (COVID)', topScorer: 'N/A', p: 8, w: 3, d: 2, l: 3 },
]

const ALL_TIME_SCORERS = [
  { name: 'Steve "Robbo" Robertson', goals: 142, seasons: '1992–2010' },
  { name: 'Gaz Whitfield', goals: 48, seasons: '2022–present' },
  { name: 'Liam Fry', goals: 38, seasons: '2023–present' },
  { name: 'Jonny Adams', goals: 34, seasons: '2020–present' },
  { name: 'Daz Simmons', goals: 28, seasons: '2018–present' },
  { name: 'Macca Taylor', goals: 22, seasons: '2023–present' },
]

// ─── Workflow Feed ───────��──────────────────────────────────────────────────

const WORKFLOW_FEED = [
  { name: 'Availability request sent — Saturday match', status: 'completed' as const, ts: '30 Mar, 08:15' },
  { name: 'Subs reminder — 6 players outstanding', status: 'pending' as const, ts: '29 Mar, 19:00' },
  { name: 'Training confirmed — Tuesday 7pm', status: 'completed' as const, ts: '29 Mar, 12:00' },
  { name: 'Pitch inspection — Millfield Rec', status: 'running' as const, ts: '29 Mar, 09:00' },
  { name: 'Match report submitted — vs Old Oak FC', status: 'completed' as const, ts: '16 Nov, 14:30' },
  { name: 'DBS expiry alert — Robbo Davies', status: 'overdue' as const, ts: '5 May, auto' },
]

// ─── Weather ────────────────────────────────���────────────────────────────────

const WEATHER_FORECAST = [
  { day: 'Wed 2 Apr', icon: Sun, temp: '14°C', wind: '8mph', rain: '5%', condition: 'Clear' },
  { day: 'Thu 3 Apr', icon: CloudRain, temp: '11°C', wind: '15mph', rain: '70%', condition: 'Rain' },
  { day: 'Fri 4 Apr', icon: CloudRain, temp: '10°C', wind: '18mph', rain: '85%', condition: 'Heavy rain' },
  { day: 'Sat 5 Apr', icon: CloudRain, temp: '9°C', wind: '12mph', rain: '60%', condition: 'Showers' },
  { day: 'Sun 6 Apr', icon: Sun, temp: '13°C', wind: '6mph', rain: '10%', condition: 'Clearing' },
]

// ─── Morning Briefing ───────────────────���────────────────────────────────────

const MORNING_BRIEFING = `Good morning. Training tonight at 7pm — 14 confirmed, 3 unavailable. Match Saturday vs The Crown FC, away, 2pm kick-off. Kit needs collecting from Nige after training. Subs outstanding: 6 players owe a total of £200. One safeguarding note to review — speak to Karen. Weather: rain expected Saturday — pitch inspection at 9am Friday. Cup quarter-final draw is next Tuesday. End of season awards night tickets on sale — 12 sold so far.`

// ─── Quick Actions ────────��─────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: 'Log Result', icon: Clipboard },
  { label: 'Send Message', icon: Send },
  { label: 'Request Availability', icon: CheckCircle2 },
  { label: 'Log Injury', icon: Heart },
  { label: 'Book Pitch', icon: MapPin },
  { label: 'Add Expense', icon: DollarSign },
]

// ─── Helpers ────────��────────────────────────────────────────────────────────

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

function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: PRIMARY, color: TEXT }}>{message}</div>
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: `${color}1a`, color }}>{children}</span>
}

function AvailDot({ status }: { status: 'available' | 'unavailable' | 'maybe' }) {
  const c = status === 'available' ? '#22C55E' : status === 'maybe' ? GOLD : '#EF4444'
  return <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} title={status} />
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

// ─── Sidebar ���────────────────────────────────────────────────────────────────

function Sidebar({ activeDept, onSelect, open, onClose, session, onPinChange }: { activeDept: string; onSelect: (d: string) => void; open: boolean; onClose: () => void; session?: SportsDemoSession; onPinChange?: (pinned: boolean) => void }) {
  const tierColor = '#16A34A'
  const items = SIDEBAR_ITEMS
  const sectionLabels = [...new Set(items.map(i => i.section))]

  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expanded = pinned || hovered

  useEffect(() => { setPinned(typeof window !== 'undefined' && localStorage.getItem('lumio_grassroots_sidebar_pinned') === 'true') }, [])
  const togglePin = () => setPinned(p => { const next = !p; localStorage.setItem('lumio_grassroots_sidebar_pinned', String(next)); onPinChange?.(next); return next })
  const handleMouseEnter = () => { if (timerRef.current) clearTimeout(timerRef.current); setHovered(true) }
  const handleMouseLeave = () => { timerRef.current = setTimeout(() => setHovered(false), 200) }

  const sections = sectionLabels.map(label => ({ label, items: items.filter(i => i.section === label) }))

  return (
    <>
      <aside className="hidden md:flex flex-col shrink-0 z-30 transition-all duration-200" style={{ width: expanded ? 220 : 72, backgroundColor: BG, borderRight: `1px solid ${BORDER}`, position: 'sticky', top: 0, height: 'calc(100vh / 0.9)', alignSelf: 'flex-start' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <div className="flex items-center gap-2.5 px-2.5 py-3 shrink-0" style={{ borderBottom: `1px solid ${BORDER}`, minHeight: 52 }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: tierColor, color: '#fff' }}>SR</div>
          {expanded && (<><div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate" style={{ color: TEXT }}>Sunday Rovers FC</p><p className="text-[10px] truncate" style={{ color: TEXT_SEC }}>Grassroots Portal</p></div>
            <button onClick={togglePin} className="shrink-0 p-1 rounded" style={{ color: pinned ? tierColor : '#4B5563', transform: pinned ? 'rotate(0deg)' : 'rotate(45deg)', transition: 'transform 200ms, color 200ms' }} title={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z"/></svg></button></>)}
        </div>
        <GrassrootsSidebarNav
          T={GR_THEME}
          accent={GR_ACCENT}
          items={items.map(i => ({ id: i.id, label: i.label, group: i.section ?? undefined, badge: i.badge }))}
          expanded={expanded}
          activeId={activeDept}
          onSelect={(id: string) => { onSelect(id); if (!pinned) setHovered(false) }}
        />
        {session && (
          <RoleSwitcher
            session={session}
            roles={GRASSROOTS_ROLES}
            accentColor="#16a34a"
            onRoleChange={(role) => {
              const key = 'lumio_grassroots_demo_session'
              const stored = localStorage.getItem(key)
              if (stored) {
                const parsed = JSON.parse(stored)
                localStorage.setItem(key, JSON.stringify({ ...parsed, role }))
              }
            }}
            sidebarCollapsed={!expanded}
          />
        )}
        <div className="mt-auto shrink-0 flex items-center justify-center py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
          {expanded
            ? <img src="/football_logo.png" alt="Lumio Football" style={{ maxHeight: 32, objectFit: 'contain' }} />
            : <img src="/football_logo.png" alt="Lumio Football" style={{ maxHeight: 24, objectFit: 'contain' }} />
          }
        </div>
      </aside>
      {open && (<div className="md:hidden fixed inset-0 z-40 flex"><div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
        <aside className="relative z-50 w-56 flex flex-col" style={{ backgroundColor: BG, borderRight: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}><span className="text-xs font-semibold" style={{ color: TEXT_SEC }}>NAVIGATION</span><button onClick={onClose} style={{ color: TEXT_SEC }}><ChevronLeft size={16} /></button></div>
          <nav className="flex flex-1 flex-col gap-0.5 p-3 overflow-y-auto amateur-sidebar-scroll">{items.map(item => { const active = activeDept === item.id; return (
            <button key={item.id} onClick={() => { onSelect(item.id); onClose() }} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left w-full" style={{ backgroundColor: active ? `${tierColor}1f` : 'transparent', color: active ? tierColor : TEXT_SEC }}><item.icon size={15} strokeWidth={active ? 2.5 : 2} /><span className="truncate">{item.label}</span></button>
          )})}</nav></aside></div>)}
    </>
  )
}

// ─── AI Briefing Banner ──────────────────────────────────────────────────────

function BriefingBanner({ clubName }: { clubName: string }) {
  const { speak, stop, isPlaying } = useSpeech()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${BG} 0%, #064E3B 100%)`, border: `1px solid ${BORDER}` }}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: ACCENT }} />
            <span className="text-xs font-semibold" style={{ color: ACCENT }}>AI Morning Briefing</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => isPlaying ? stop() : speak(MORNING_BRIEFING)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ backgroundColor: isPlaying ? '#EF4444' : PRIMARY, color: '#fff' }}>
              <Volume2 size={12} />{isPlaying ? 'Stop' : 'Listen'}
            </button>
            <button onClick={() => setExpanded(!expanded)} className="p-1 rounded" style={{ color: TEXT_SEC }}>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
        {expanded ? (
          <p className="text-sm leading-relaxed" style={{ color: TEXT }}>{MORNING_BRIEFING}</p>
        ) : (
          <p className="text-sm truncate" style={{ color: TEXT_SEC }}>Training tonight at 7pm — 14 confirmed. Match Saturday vs The Crown FC, away...</p>
        )}
      </div>
    </div>
  )
}

// ─── Quick Actions Bar ───────────────────────────────────────────────────────

function QuickActionsBar({ onAction }: { onAction: (label: string) => void }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto amateur-quickactions-hide-scroll" style={{ backgroundColor: BG, borderRadius: 12, border: `1px solid ${BORDER}` }}>
      <span className="text-xs font-semibold shrink-0 mr-1" style={{ color: TEXT_SEC }}>Quick actions</span>
      {QUICK_ACTIONS.map(a => (
        <button key={a.label} onClick={() => onAction(a.label)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap shrink-0"
          style={{ backgroundColor: PRIMARY, color: '#fff' }}>
          <a.icon size={12} />{a.label}
        </button>
      ))}
    </div>
  )
}

// ─── Pitch SVG (Formation) ─────���────────────────────────────────────���───────

function PitchFormation({ players }: { players: { name: string; x: number; y: number }[] }) {
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

const FORMATION_442: { name: string; x: number; y: number }[] = [
  { name: 'Hartley', x: 170, y: 460 },
  { name: 'Wilson', x: 60, y: 380 }, { name: 'Simmons', x: 130, y: 390 }, { name: 'Murphy', x: 210, y: 390 }, { name: 'Baker', x: 280, y: 380 },
  { name: 'Taylor', x: 60, y: 280 }, { name: 'Jennings', x: 130, y: 290 }, { name: 'Adams', x: 210, y: 290 }, { name: 'Clarke', x: 280, y: 280 },
  { name: 'Whitfield', x: 130, y: 180 }, { name: 'Fry', x: 210, y: 180 },
]

// ─── Overview View ──────────────────────────────────────────��────────────────

function OverviewView({ clubName, onAction, session }: { clubName: string; onAction: (msg: string) => void; session?: SportsDemoSession }) {
  const availCount = SQUAD.filter(p => p.availability === 'available').length
  const subsOwed = SQUAD.reduce((sum, p) => sum + p.subsOwed, 0)
  const nextMatch = FIXTURES.find(f => !f.result)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const userName = (session?.userName) || 'Dave'

  return (
    <div className="space-y-4">
      {/* Greeting banner with inline KPIs */}
      <div className="rounded-xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${BG} 0%, #064E3B 100%)`, border: `1px solid ${BORDER}` }}>
        <div className="px-5 pt-4 pb-2">
          <h2 className="text-lg font-bold" style={{ color: TEXT }}>{greeting}, {userName}.</h2>
          <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>{clubName} · Westshire Sunday League Div 2</p>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 px-5 pb-4 pt-2">
          <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: TEXT_SEC }}>Squad</p>
            <p className="text-xl font-bold mt-0.5" style={{ color: TEXT }}>{SQUAD.length}</p>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: TEXT_SEC }}>Available</p>
            <p className="text-xl font-bold mt-0.5" style={{ color: '#22C55E' }}>{availCount}</p>
            <p className="text-[10px]" style={{ color: TEXT_SEC }}>{SQUAD.filter(p => p.availability === 'maybe').length} maybe</p>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: TEXT_SEC }}>Subs Owed</p>
            <p className="text-xl font-bold mt-0.5" style={{ color: '#EF4444' }}>&pound;{subsOwed}</p>
            <p className="text-[10px]" style={{ color: TEXT_SEC }}>{SQUAD.filter(p => p.subsOwed > 0).length} players</p>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: TEXT_SEC }}>Next Match</p>
            <p className="text-xl font-bold mt-0.5" style={{ color: '#3B82F6' }}>Sat 5 Apr</p>
            <p className="text-[10px]" style={{ color: TEXT_SEC }}>vs The Crown FC (A)</p>
          </div>
        </div>
      </div>

      <BriefingBanner clubName={clubName} />

      {/* Quick actions — 12 pill buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { id:'availability', label:'WhatsApp Availability', icon:'\uD83D\uDCF1', hot:true, color:'#22C55E' },
          { id:'teamsheet',    label:'Team Sheet AI',         icon:'\uD83D\uDCCB', hot:true, color:'#22C55E' },
          { id:'referee',      label:'Referee Booker',        icon:'\uD83D\uDFE8', hot:false, color:'#6B7280' },
          { id:'pitch',        label:'Pitch Checker AI',      icon:'\uD83C\uDFDF\uFE0F', hot:true, color:'#22C55E' },
          { id:'kit',          label:'Kit Manager',           icon:'\uD83D\uDC55', hot:false, color:'#6B7280' },
          { id:'finance',      label:'Finance Tracker',       icon:'\uD83D\uDCB0', hot:false, color:'#6B7280' },
          { id:'matchreport',  label:'Match Report AI',       icon:'\uD83D\uDCCA', hot:true, color:'#22C55E' },
          { id:'development',  label:'Player Development',    icon:'\uD83D\uDCC8', hot:false, color:'#6B7280' },
          { id:'safeguarding', label:'Safeguarding Check',    icon:'\uD83D\uDEE1\uFE0F', hot:false, color:'#EF4444' },
          { id:'subs',         label:'Subs Tracker',          icon:'\uD83D\uDCB7', hot:false, color:'#6B7280' },
          { id:'discipline',   label:'Discipline Log',        icon:'\uD83D\uDFE5', hot:false, color:'#6B7280' },
          { id:'planner',      label:'Season Planner AI',     icon:'\uD83D\uDCC5', hot:true, color:'#22C55E' },
        ].map(a => (
          <button key={a.id} onClick={() => onAction(a.label)} className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap relative"
            style={{ background: a.hot ? `${a.color}18` : '#111318', border: a.hot ? `1px solid ${a.color}50` : '1px solid #1F2937', color: a.hot ? a.color : '#9CA3AF' }}>
            <span>{a.icon}</span>{a.label}
            {a.hot && <span className="absolute -top-1 -right-1 text-[8px] px-1 rounded-full font-black" style={{ backgroundColor: a.color, color: '#fff' }}>AI</span>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* This Week's Fixtures */}
          <SectionCard title="This Week">
            <div className="space-y-2">
              {TRAINING_SESSIONS.map((s, i) => (
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
                    <p className="text-xs" style={{ color: TEXT_SEC }}>vs {nextMatch.opponent} ({nextMatch.homeAway}) · {nextMatch.venue}</p>
                  </div>
                  <Badge color="#3B82F6">Match Day</Badge>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Workflow Activity */}
          <SectionCard title="Activity Feed" action={<span className="text-xs" style={{ color: PRIMARY }}>Live</span>}>
            <div className="space-y-0">
              {WORKFLOW_FEED.map((run, i) => (
                <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < WORKFLOW_FEED.length - 1 ? `1px solid ${BORDER}` : undefined }}>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm" style={{ color: TEXT }}>{run.name}</p>
                  </div>
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
          {/* Weather */}
          <SectionCard title="Weather — Match Week">
            <div className="space-y-2">
              {WEATHER_FORECAST.map((w, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <w.icon size={14} style={{ color: w.rain !== '5%' && w.rain !== '10%' ? '#60A5FA' : GOLD }} />
                    <span className="text-xs" style={{ color: TEXT }}>{w.day}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: TEXT_SEC }}>{w.temp}</span>
                    <span className="text-xs" style={{ color: parseInt(w.rain) > 50 ? '#EF4444' : TEXT_SEC }}>{w.rain}</span>
                  </div>
                </div>
              ))}
              {parseInt(WEATHER_FORECAST[3]?.rain || '0') > 50 && (
                <div className="mt-2 p-2 rounded-lg text-xs" style={{ backgroundColor: '#EF44441a', color: '#EF4444' }}>
                  <AlertTriangle size={12} className="inline mr-1" />Rain risk Saturday — pitch inspection recommended
                </div>
              )}
            </div>
          </SectionCard>

          {/* League Position */}
          <SectionCard title="League Position">
            <div className="text-center py-2">
              <div className="text-4xl font-bold" style={{ color: TEXT }}>8th</div>
              <div className="text-xs mt-1" style={{ color: TEXT_SEC }}>Westshire Sunday League Div 2</div>
              <div className="text-xs mt-1" style={{ color: TEXT_SEC }}>W4 D2 L5 · 14 pts</div>
            </div>
          </SectionCard>

          {/* Announcements */}
          <SectionCard title="Announcements">
            <div className="space-y-2">
              {ANNOUNCEMENTS.slice(0, 2).map((a, i) => (
                <div key={i} className="py-1.5">
                  <div className="flex items-center gap-1.5">
                    {a.pinned && <Star size={10} style={{ color: GOLD }} />}
                    <p className="text-xs font-medium" style={{ color: TEXT }}>{a.title}</p>
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: TEXT_SEC }}>{a.date}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

// ─── Squad View ────────────���─────────────────────────────────────────────────

function SquadView() {
  const [selected, setSelected] = useState<AmateurPlayer | null>(null)
  const [showAI, setShowAI] = useState(false)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Squad Size" value={String(SQUAD.length)} icon={Users} color={PRIMARY} />
        <StatCard label="Registered" value={String(SQUAD.filter(p => p.registered).length)} icon={CheckCircle2} color="#22C55E" />
        <StatCard label="Injured" value={String(SQUAD.filter(p => p.injured).length)} icon={Heart} color="#EF4444" />
        <StatCard label="Avg Age" value={String(Math.round(SQUAD.reduce((s, p) => s + p.age, 0) / SQUAD.length))} icon={Users} color="#3B82F6" />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setShowAI(!showAI)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: `${GOLD}1a`, border: `1px solid ${GOLD}`, color: GOLD }}>
          <Sparkles size={12} className="inline mr-1" />AI Team Selection
        </button>
      </div>

      {showAI && (
        <SectionCard title="AI Suggested XI — 4-4-2" action={<Badge color={PRIMARY}>Based on availability + form</Badge>}>
          <PitchFormation players={FORMATION_442.filter(p => {
            const player = SQUAD.find(s => s.name.includes(p.name.split(' ').pop()!))
            return player ? player.availability !== 'unavailable' : true
          })} />
          <div className="mt-3 p-3 rounded-lg text-xs" style={{ backgroundColor: `${PRIMARY}0d`, border: `1px solid ${PRIMARY}33` }}>
            <Sparkles size={12} className="inline mr-1" style={{ color: PRIMARY }} />
            <span style={{ color: TEXT }}>Fry unavailable (hamstring). Cooper injured. Suggest Robbo Davies in CM, move Jennings to CAM. Khan on bench. Thornton available as CB cover if Murphy can&apos;t make it.</span>
          </div>
        </SectionCard>
      )}

      {/* Player Register */}
      <SectionCard title="Player Register" action={<span className="text-xs" style={{ color: TEXT_SEC }}>{SQUAD.length} players</span>}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ color: TEXT_SEC, borderBottom: `1px solid ${BORDER}` }}>
              <th className="text-left py-2 px-2">#</th><th className="text-left py-2">Name</th><th className="text-left py-2">Pos</th><th className="text-left py-2">Age</th>
              <th className="text-center py-2">Reg</th><th className="text-center py-2">Sat</th><th className="text-center py-2">Tue</th>
              <th className="text-right py-2">GP</th><th className="text-right py-2">G</th><th className="text-right py-2">A</th><th className="text-right py-2">MOTM</th>
            </tr></thead>
            <tbody>
              {SQUAD.map(p => (
                <tr key={p.number} className="cursor-pointer hover:opacity-80" style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT }} onClick={() => setSelected(p)}>
                  <td className="py-2 px-2 font-mono" style={{ color: TEXT_SEC }}>{p.number}</td>
                  <td className="py-2 font-medium">{p.name}{p.injured && <span className="ml-1 text-red-400">*</span>}</td>
                  <td className="py-2" style={{ color: TEXT_SEC }}>{p.position}</td>
                  <td className="py-2" style={{ color: TEXT_SEC }}>{p.age}</td>
                  <td className="py-2 text-center">{p.registered ? <Check size={12} style={{ color: '#22C55E' }} /> : <X size={12} style={{ color: '#EF4444' }} />}</td>
                  <td className="py-2 text-center"><AvailDot status={p.availability} /></td>
                  <td className="py-2 text-center"><AvailDot status={p.trainingAvail} /></td>
                  <td className="py-2 text-right">{p.gamesPlayed}</td>
                  <td className="py-2 text-right">{p.goals}</td>
                  <td className="py-2 text-right">{p.assists}</td>
                  <td className="py-2 text-right">{p.motm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Form Guide */}
      <SectionCard title="Form Guide — Last 5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {SQUAD.filter(p => p.gamesPlayed > 0).map(p => (
            <div key={p.number} className="flex items-center gap-2 py-1">
              <span className="text-xs w-24 truncate" style={{ color: TEXT }}>{p.name.split(' ').pop()}</span>
              <div className="flex gap-0.5">
                {p.last5.map((r, i) => (
                  <span key={i} className="w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: r === 'W' ? '#22C55E' : r === 'D' ? GOLD : r === 'L' ? '#EF4444' : '#374151', color: '#fff' }}>{r}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

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
                <div><span style={{ color: TEXT_SEC }}>Phone:</span> <span style={{ color: TEXT }}>{selected.phone}</span></div>
                <div><span style={{ color: TEXT_SEC }}>Seasons:</span> <span style={{ color: TEXT }}>{selected.seasonsAtClub}</span></div>
                <div><span style={{ color: TEXT_SEC }}>Registered:</span> <span style={{ color: selected.registered ? '#22C55E' : '#EF4444' }}>{selected.registered ? 'Yes' : 'No'}</span></div>
                <div><span style={{ color: TEXT_SEC }}>Subs:</span> <span style={{ color: selected.subsPaid ? '#22C55E' : '#EF4444' }}>{selected.subsPaid ? 'Paid' : `£${selected.subsOwed} owed`}</span></div>
              </div>
              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
                <p className="text-xs font-semibold mb-2" style={{ color: TEXT_SEC }}>Season Stats</p>
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  {[['Games', selected.gamesPlayed], ['Goals', selected.goals], ['Assists', selected.assists], ['Yellow', selected.yellowCards], ['Red', selected.redCards], ['MOTM', selected.motm]].map(([l, v]) => (
                    <div key={String(l)} className="p-2 rounded-lg" style={{ backgroundColor: BG }}>
                      <div className="font-bold" style={{ color: TEXT }}>{v}</div>
                      <div style={{ color: TEXT_SEC }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              {selected.injured && (
                <div className="p-2 rounded-lg text-xs" style={{ backgroundColor: '#EF44441a', color: '#EF4444' }}>
                  <Heart size={12} className="inline mr-1" />Injured: {selected.injuryNote}
                </div>
              )}
              {selected.medical && (
                <div className="p-2 rounded-lg text-xs" style={{ backgroundColor: '#3B82F61a', color: '#60A5FA' }}>
                  <Shield size={12} className="inline mr-1" />Medical: {selected.medical}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: TEXT_SEC }}>Form (Last 5)</p>
                <div className="flex gap-1">
                  {selected.last5.map((r, i) => (
                    <span key={i} className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center"
                      style={{ backgroundColor: r === 'W' ? '#22C55E' : r === 'D' ? GOLD : r === 'L' ? '#EF4444' : '#374151', color: '#fff' }}>{r}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Match Day View ───────���───────────────────────��──────────────────────────

function MatchDayView({ onToast }: { onToast: (m: string) => void }) {
  const [showTeamSheet, setShowTeamSheet] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const nextMatch = FIXTURES.find(f => !f.result)

  return (
    <div className="space-y-4">
      {/* Next Match Card */}
      {nextMatch && (
        <div className="rounded-xl p-4" style={{ background: `linear-gradient(135deg, ${BG} 0%, #064E3B 100%)`, border: `1px solid ${PRIMARY}33` }}>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} style={{ color: GOLD }} />
            <span className="text-xs font-semibold" style={{ color: GOLD }}>Next Match</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div><span style={{ color: TEXT_SEC }}>Opponent</span><p className="font-semibold mt-0.5" style={{ color: TEXT }}>{nextMatch.opponent}</p></div>
            <div><span style={{ color: TEXT_SEC }}>Date & Time</span><p className="font-semibold mt-0.5" style={{ color: TEXT }}>{nextMatch.date} · {nextMatch.time}</p></div>
            <div><span style={{ color: TEXT_SEC }}>Venue</span><p className="font-semibold mt-0.5" style={{ color: TEXT }}>{nextMatch.venue}</p></div>
            <div><span style={{ color: TEXT_SEC }}>Kit</span><p className="font-semibold mt-0.5" style={{ color: TEXT }}>{nextMatch.homeAway === 'A' ? 'Away (navy/gold)' : 'Home (green/white)'}</p></div>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setShowTeamSheet(!showTeamSheet)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: PRIMARY, color: '#fff' }}>
          <Clipboard size={12} className="inline mr-1" />Team Sheet
        </button>
        <button onClick={() => onToast('Print-ready team sheet generated')} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, color: TEXT }}>
          <Printer size={12} className="inline mr-1" />Print Team Sheet
        </button>
        <button onClick={() => onToast('Referee copy generated')} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, color: TEXT }}>
          <FileText size={12} className="inline mr-1" />Referee Copy
        </button>
        <button onClick={() => setShowResult(!showResult)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: GOLD, color: BG }}>
          <Clipboard size={12} className="inline mr-1" />Enter Result
        </button>
      </div>

      {showTeamSheet && (
        <SectionCard title="Team Sheet — 4-4-2">
          <PitchFormation players={FORMATION_442} />
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg" style={{ backgroundColor: BG }}>
              <p className="font-semibold mb-1" style={{ color: TEXT }}>Subs</p>
              <p style={{ color: TEXT_SEC }}>Woody Brennan (GK), Robbo Davies, Pete Langford, Mo Khan, Nige Thornton</p>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: BG }}>
              <p className="font-semibold mb-1" style={{ color: TEXT }}>Match Officials</p>
              <p style={{ color: TEXT_SEC }}>Referee: Graham Foster</p>
              <p style={{ color: TEXT_SEC }}>Linesmen: Volunteers (TBC)</p>
            </div>
          </div>
        </SectionCard>
      )}

      {showResult && (
        <SectionCard title="Enter Match Result">
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div><label style={{ color: TEXT_SEC }}>Sunday Rovers FC</label><input type="number" className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }} placeholder="0" /></div>
              <div><label style={{ color: TEXT_SEC }}>{nextMatch?.opponent || 'Opponent'}</label><input type="number" className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }} placeholder="0" /></div>
            </div>
            <div><label style={{ color: TEXT_SEC }}>Goalscorers</label><input type="text" className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }} placeholder="Whitfield, Taylor" /></div>
            <div><label style={{ color: TEXT_SEC }}>Assists</label><input type="text" className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }} placeholder="Fry, Adams" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label style={{ color: TEXT_SEC }}>Yellow Cards</label><input type="text" className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }} placeholder="Simmons" /></div>
              <div><label style={{ color: TEXT_SEC }}>Red Cards</label><input type="text" className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }} placeholder="" /></div>
            </div>
            <div><label style={{ color: TEXT_SEC }}>MOTM</label><input type="text" className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }} placeholder="Whitfield" /></div>
            <div><label style={{ color: TEXT_SEC }}>Match Report Notes</label><textarea className="w-full mt-1 px-3 py-2 rounded-lg text-sm" rows={3} style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }} placeholder="Tough away day..." /></div>
            <div className="flex gap-2">
              <button onClick={() => { setShowResult(false); onToast('Result saved and squad notified') }} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: PRIMARY, color: '#fff' }}>Save & Notify Squad</button>
              <button onClick={() => onToast('Result posted to social media')} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, color: TEXT }}>Post to Social</button>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Recent Results */}
      <SectionCard title="Recent Results">
        <div className="space-y-0">
          {FIXTURES.filter(f => f.result).slice(-5).reverse().map((f, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2">
                <Badge color={f.homeAway === 'H' ? PRIMARY : '#3B82F6'}>{f.homeAway}</Badge>
                <span style={{ color: TEXT }}>{f.opponent}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold" style={{ color: f.result.startsWith('W') ? '#22C55E' : f.result.startsWith('D') ? GOLD : '#EF4444' }}>{f.result}</span>
                <span style={{ color: TEXT_SEC }}>{f.date}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Fixtures View ────��──────────────────────────────────────────────────────

function FixturesView() {
  const [tab, setTab] = useState<'fixtures' | 'league' | 'cups' | 'training'>('fixtures')

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: CARD_BG }}>
        {(['fixtures', 'league', 'cups', 'training'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize"
            style={{ backgroundColor: tab === t ? PRIMARY : 'transparent', color: tab === t ? '#fff' : TEXT_SEC }}>{t}</button>
        ))}
      </div>

      {tab === 'fixtures' && (
        <SectionCard title="Season Fixtures">
          <div className="space-y-0">
            {FIXTURES.map((f, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-2">
                  <Badge color={f.homeAway === 'H' ? PRIMARY : '#3B82F6'}>{f.homeAway}</Badge>
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
        <SectionCard title="Westshire Sunday League — Division 2">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr style={{ color: TEXT_SEC, borderBottom: `1px solid ${BORDER}` }}>
                <th className="text-left py-2 w-6">#</th><th className="text-left py-2">Team</th>
                <th className="text-center py-2">P</th><th className="text-center py-2">W</th><th className="text-center py-2">D</th><th className="text-center py-2">L</th>
                <th className="text-center py-2">GF</th><th className="text-center py-2">GA</th><th className="text-center py-2">GD</th><th className="text-center py-2 font-bold">Pts</th>
              </tr></thead>
              <tbody>
                {LEAGUE_TABLE.map(r => (
                  <tr key={r.pos} style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: r.team === 'Sunday Rovers FC' ? `${PRIMARY}1a` : 'transparent' }}>
                    <td className="py-2" style={{ color: TEXT_SEC }}>{r.pos}</td>
                    <td className="py-2 font-medium" style={{ color: r.team === 'Sunday Rovers FC' ? PRIMARY : TEXT }}>{r.team}</td>
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
          {['Westshire County FA Cup', 'League Cup'].map(comp => (
            <SectionCard key={comp} title={comp}>
              <div className="space-y-0">
                {CUP_FIXTURES.filter(c => c.comp === comp).map((c, i) => (
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
          ))}
        </div>
      )}

      {tab === 'training' && (
        <SectionCard title="Training Schedule">
          <div className="space-y-3">
            {TRAINING_SESSIONS.map((s, i) => (
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
      )}
    </div>
  )
}

// ─── Finances View ���──────────────────────���───────────────────────────────────

function FinancesView({ onToast }: { onToast: (m: string) => void }) {
  const totalSubsExpected = SQUAD.filter(p => p.registered).length * 20 * 8
  const totalSubsCollected = totalSubsExpected - SQUAD.reduce((s, p) => s + p.subsOwed, 0)
  const totalExpenses = EXPENSES.reduce((s, e) => s + e.amount, 0)
  const totalSponsorship = SPONSORS.reduce((s, sp) => s + sp.amount, 0)
  const totalFundraised = FUNDRAISING.reduce((s, f) => s + f.raised, 0)

  const incomeCategories = [
    { label: 'Subs', amount: totalSubsCollected, color: PRIMARY },
    { label: 'Match Fees', amount: 440, color: '#3B82F6' },
    { label: 'Sponsorship', amount: totalSponsorship, color: GOLD },
    { label: 'Fundraising', amount: totalFundraised, color: '#8B5CF6' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Subs Collected" value={`£${totalSubsCollected}`} icon={DollarSign} color={PRIMARY} sub={`of £${totalSubsExpected} expected`} />
        <StatCard label="Outstanding" value={`£${SQUAD.reduce((s, p) => s + p.subsOwed, 0)}`} icon={AlertCircle} color="#EF4444" sub={`${SQUAD.filter(p => p.subsOwed > 0).length} players`} />
        <StatCard label="Total Expenses" value={`£${totalExpenses}`} icon={TrendingUp} color="#3B82F6" />
        <StatCard label="Sponsorship" value={`£${totalSponsorship}`} icon={Star} color={GOLD} />
      </div>

      {/* Income Summary Bar Chart */}
      <SectionCard title="Season Income Summary">
        <div className="space-y-2">
          {incomeCategories.map(cat => (
            <div key={cat.label} className="flex items-center gap-3">
              <span className="text-xs w-24" style={{ color: TEXT_SEC }}>{cat.label}</span>
              <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ backgroundColor: `${cat.color}1a` }}>
                <div className="h-full rounded-full flex items-center px-2" style={{ backgroundColor: cat.color, width: `${Math.min(100, (cat.amount / 3000) * 100)}%` }}>
                  <span className="text-[10px] font-bold text-white">£{cat.amount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Subs Tracker */}
      <SectionCard title="Subs Tracker" action={<span className="text-xs" style={{ color: TEXT_SEC }}>£20/month</span>}>
        <div className="space-y-0">
          {SQUAD.filter(p => p.registered).map(p => (
            <div key={p.number} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ color: TEXT }}>{p.name}</span>
              <div className="flex items-center gap-2">
                {p.subsOwed > 0 ? (
                  <>
                    <span style={{ color: '#EF4444' }}>£{p.subsOwed} owed</span>
                    <button onClick={() => onToast(`Reminder sent to ${p.name}`)} className="px-2 py-1 rounded text-[10px] font-semibold" style={{ backgroundColor: '#EF44441a', color: '#EF4444' }}>Remind</button>
                  </>
                ) : (
                  <Badge color="#22C55E">Paid</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Expenses */}
      <SectionCard title="Expenses Log">
        <div className="space-y-0">
          {EXPENSES.map((e, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span style={{ color: TEXT }}>{e.item}</span>
                <div className="mt-0.5"><Badge color={TEXT_SEC}>{e.category}</Badge></div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold" style={{ color: TEXT }}>£{e.amount}</span>
                <p style={{ color: TEXT_SEC }}>{e.date}</p>
              </div>
            </div>
          ))}
          <div className="pt-2 flex justify-between text-xs font-bold">
            <span style={{ color: TEXT }}>Total</span>
            <span style={{ color: TEXT }}>£{totalExpenses}</span>
          </div>
        </div>
      </SectionCard>

      {/* Fundraising */}
      <SectionCard title="Fundraising">
        <div className="space-y-3">
          {FUNDRAISING.map((f, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: TEXT }}>{f.event}</span>
                <span className="text-xs" style={{ color: TEXT_SEC }}>{f.date}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${PRIMARY}1a` }}>
                <div className="h-full rounded-full" style={{ backgroundColor: PRIMARY, width: `${(f.raised / f.target) * 100}%` }} />
              </div>
              <div className="flex justify-between mt-1 text-[10px]" style={{ color: TEXT_SEC }}>
                <span>£{f.raised} raised</span>
                <span>£{f.target} target ({Math.round((f.raised / f.target) * 100)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Sponsors */}
      <SectionCard title="Sponsorship">
        <div className="space-y-0">
          {SPONSORS.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{s.name}</span>
                <p style={{ color: TEXT_SEC }}>{s.type}</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold" style={{ color: GOLD }}>£{s.amount}</span>
                <p style={{ color: TEXT_SEC }}>Renewal: {s.renewal}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Welfare View ────────────────────────────────────────────────────────────

function WelfareView() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Injured Players" value={String(SQUAD.filter(p => p.injured).length)} icon={Heart} color="#EF4444" />
        <StatCard label="DBS Valid" value={`${DBS_RECORDS.filter(d => d.status === 'Valid').length}/${DBS_RECORDS.length}`} icon={Shield} color={PRIMARY} />
        <StatCard label="Wellbeing Avg" value={String(WELLBEING_SCORES[0]?.avg || '-')} icon={Activity} color="#3B82F6" sub="out of 5" />
        <StatCard label="Open Concerns" value={String(SAFEGUARDING_LOG.filter(s => !s.outcome.includes('Resolved')).length)} icon={AlertCircle} color={GOLD} />
      </div>

      {/* Injury Log */}
      <SectionCard title="Injury Log">
        <div className="space-y-0">
          {SQUAD.filter(p => p.injured).map(p => (
            <div key={p.number} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{p.name}</span>
                <p style={{ color: '#EF4444' }}>{p.injuryNote}</p>
              </div>
              <Badge color="#EF4444">Injured</Badge>
            </div>
          ))}
          {SQUAD.filter(p => p.injured).length === 0 && <p className="text-xs py-2" style={{ color: TEXT_SEC }}>No current injuries</p>}
        </div>
      </SectionCard>

      {/* Medical Conditions */}
      <SectionCard title="Medical Conditions Register" action={<Badge color="#EF4444">Confidential</Badge>}>
        <div className="space-y-0">
          {SQUAD.filter(p => p.medical).map(p => (
            <div key={p.number} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ color: TEXT }}>{p.name}</span>
              <span style={{ color: '#60A5FA' }}>{p.medical}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* DBS Tracker */}
      <SectionCard title="DBS Tracker">
        <div className="space-y-0">
          {DBS_RECORDS.map((d, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{d.name}</span>
                <p style={{ color: TEXT_SEC }}>{d.role} · {d.dbsNumber}</p>
              </div>
              <div className="text-right">
                <Badge color={d.status === 'Valid' ? '#22C55E' : '#EF4444'}>{d.status}</Badge>
                <p className="mt-0.5" style={{ color: TEXT_SEC }}>Exp: {d.expiry}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Safeguarding Log */}
      <SectionCard title="Safeguarding Concern Log" action={<Badge color="#EF4444">Restricted</Badge>}>
        <div className="space-y-0">
          {SAFEGUARDING_LOG.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{s.player} — {s.type}</span>
                <p style={{ color: TEXT_SEC }}>Reported to: {s.reportedTo} �� {s.date}</p>
                <p style={{ color: TEXT_SEC }}>{s.outcome}</p>
              </div>
              <Badge color={s.severity === 'low' ? '#22C55E' : s.severity === 'medium' ? GOLD : '#EF4444'}>{s.severity}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* CPO Details */}
      <SectionCard title="Child Protection Officer">
        <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: BG }}>
          <p className="font-medium" style={{ color: TEXT }}>Karen Wilson — Club Welfare Officer</p>
          <p style={{ color: TEXT_SEC }}>Phone: 07700 800010 · Email: karen.wilson@sundayrovers.example</p>
          <p className="mt-1" style={{ color: TEXT_SEC }}>FA Safeguarding Level 2 qualified. Available matchdays and training.</p>
        </div>
      </SectionCard>

      {/* Mental Health */}
      <SectionCard title="Weekly Wellbeing Check-in" action={<Badge color="#3B82F6">Anonymous</Badge>}>
        <div className="space-y-2">
          {WELLBEING_SCORES.map((w, i) => (
            <div key={i} className="flex items-center justify-between py-1 text-xs">
              <span style={{ color: TEXT }}>{w.week}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${PRIMARY}1a` }}>
                  <div className="h-full rounded-full" style={{ backgroundColor: w.avg >= 4 ? '#22C55E' : w.avg >= 3 ? GOLD : '#EF4444', width: `${(w.avg / 5) * 100}%` }} />
                </div>
                <span style={{ color: TEXT }}>{w.avg}/5</span>
                <span style={{ color: TEXT_SEC }}>({w.responses} responses)</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Return to Play */}
      <SectionCard title="Return to Play Workflow">
        <div className="space-y-2">
          {SQUAD.filter(p => p.injured).map(p => (
            <div key={p.number} className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
              <p className="text-xs font-medium mb-2" style={{ color: TEXT }}>{p.name} — {p.injuryNote}</p>
              <div className="flex gap-1">
                {['Injured', 'Physio', 'Doctor', 'Manager', 'Fit'].map((step, i) => (
                  <div key={step} className="flex-1">
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: i < 2 ? PRIMARY : `${TEXT_SEC}33` }} />
                    <p className="text-[9px] mt-0.5 text-center" style={{ color: i < 2 ? PRIMARY : TEXT_SEC }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Communications View ──────────────────────���──────────────────────────────

function CommsView({ onToast }: { onToast: (m: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => onToast('Message composer opened')} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: PRIMARY, color: '#fff' }}>
          <Send size={12} className="inline mr-1" />New Message
        </button>
        <button onClick={() => onToast('Availability request sent to all squad')} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, color: TEXT }}>
          <CheckCircle2 size={12} className="inline mr-1" />Request Availability
        </button>
        <button onClick={() => onToast('Training cancellation sent')} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#EF44441a', border: '1px solid #EF444433', color: '#EF4444' }}>
          <X size={12} className="inline mr-1" />Cancel Training
        </button>
        <button onClick={() => onToast('Match day notification sent — 24hr reminder')} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: `${GOLD}1a`, border: `1px solid ${GOLD}33`, color: GOLD }}>
          <Bell size={12} className="inline mr-1" />Match Day Alert
        </button>
      </div>

      {/* Message Composer */}
      <SectionCard title="Squad Message Composer">
        <div className="space-y-3 text-xs">
          <div className="flex gap-2 flex-wrap">
            {['All Squad', 'Available Only', 'Parents', 'Committee'].map(g => (
              <button key={g} className="px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: g === 'All Squad' ? `${PRIMARY}1a` : BG, border: `1px solid ${g === 'All Squad' ? PRIMARY : BORDER}`, color: g === 'All Squad' ? PRIMARY : TEXT_SEC }}>{g}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {['WhatsApp', 'Email', 'SMS'].map(m => (
              <button key={m} className="px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: m === 'WhatsApp' ? '#25D3661a' : BG, border: `1px solid ${m === 'WhatsApp' ? '#25D366' : BORDER}`, color: m === 'WhatsApp' ? '#25D366' : TEXT_SEC }}>{m}</button>
            ))}
          </div>
          <textarea className="w-full px-3 py-2 rounded-lg text-sm" rows={3} style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: TEXT }} placeholder="Type your message..." />
          <button onClick={() => onToast('Message sent to squad')} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: PRIMARY, color: '#fff' }}>Send Message</button>
        </div>
      </SectionCard>

      {/* Recent Messages */}
      <SectionCard title="Recent Messages">
        <div className="space-y-0">
          {RECENT_MESSAGES.map((m, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{m.subject}</span>
                <p style={{ color: TEXT_SEC }}>To: {m.to}</p>
              </div>
              <div className="text-right">
                <Badge color={m.method === 'WhatsApp' ? '#25D366' : '#3B82F6'}>{m.method}</Badge>
                <p className="mt-0.5" style={{ color: TEXT_SEC }}>{m.date}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Announcements Board */}
      <SectionCard title="Club Announcements">
        <div className="space-y-3">
          {ANNOUNCEMENTS.map((a, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BG, border: a.pinned ? `1px solid ${GOLD}33` : `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-1.5 mb-1">
                {a.pinned && <Star size={10} style={{ color: GOLD }} />}
                <span className="text-xs font-semibold" style={{ color: TEXT }}>{a.title}</span>
              </div>
              <p className="text-xs" style={{ color: TEXT_SEC }}>{a.body}</p>
              <p className="text-[10px] mt-1" style={{ color: TEXT_SEC }}>{a.date}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Referee View ────────────────────────────────────────────────────────────

function RefereeView({ onToast }: { onToast: (m: string) => void }) {
  const totalRefFees = REF_BOOKINGS.length * 35
  const paidFees = REF_BOOKINGS.filter(r => r.paid).length * 35

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Upcoming Matches" value={String(REF_BOOKINGS.length)} icon={Calendar} color="#3B82F6" />
        <StatCard label="Confirmed" value={String(REF_BOOKINGS.filter(r => r.status === 'Confirmed').length)} icon={CheckCircle2} color="#22C55E" />
        <StatCard label="Unbooked" value={String(REF_BOOKINGS.filter(r => r.status === 'Unbooked').length)} icon={AlertCircle} color="#EF4444" />
        <StatCard label="Season Ref Fees" value={`£${totalRefFees}`} icon={DollarSign} color={GOLD} sub={`£${paidFees} paid`} />
      </div>

      {/* Booking Panel */}
      <SectionCard title="Referee Bookings">
        <div className="space-y-0">
          {REF_BOOKINGS.map((r, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{r.fixture}</span>
                <p style={{ color: TEXT_SEC }}>{r.date} · {r.referee || 'No referee assigned'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={r.status === 'Confirmed' ? '#22C55E' : r.status === 'Pending' ? GOLD : '#EF4444'}>{r.status}</Badge>
                {r.status === 'Unbooked' && (
                  <button onClick={() => onToast(`Booking request sent for ${r.fixture}`)} className="px-2 py-1 rounded text-[10px] font-semibold" style={{ backgroundColor: `${PRIMARY}1a`, color: PRIMARY }}>Book</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Referee Contacts */}
      <SectionCard title="Referee Contacts">
        <div className="space-y-0">
          {REFEREES.map((r, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{r.name}</span>
                <p style={{ color: TEXT_SEC }}>{r.level} · {r.phone}</p>
                <p style={{ color: TEXT_SEC }}>{r.notes}</p>
              </div>
              <span className="font-mono" style={{ color: TEXT }}>£{r.fee}/match</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Post-match feedback */}
      <SectionCard title="Post-Match Referee Ratings">
        <div className="space-y-0">
          {FIXTURES.filter(f => f.result).slice(-5).reverse().map((f, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ color: TEXT }}>vs {f.opponent}</span>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={12} style={{ color: s <= 3 + (i % 2) ? GOLD : '#374151' }} fill={s <= 3 + (i % 2) ? GOLD : 'none'} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* FA Requirements */}
      <SectionCard title="FA Referee Requirements">
        <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: BG }}>
          <p style={{ color: TEXT }}>Division 2 minimum: Level 7 referee (or above)</p>
          <p className="mt-1" style={{ color: TEXT_SEC }}>Min age: 16 for youth, 14 for mini-soccer</p>
          <p className="mt-1" style={{ color: TEXT_SEC }}>All referees must be FA registered and insured</p>
          <p className="mt-1" style={{ color: TEXT_SEC }}>Club must provide match fee on day (cash or bank transfer)</p>
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Pitch & Facilities View ─────────────────���───────────────────────────────

function PitchView({ onToast }: { onToast: (m: string) => void }) {
  return (
    <div className="space-y-4">
      {/* Venue Details */}
      <SectionCard title="Home Ground">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
            <p className="font-semibold mb-1" style={{ color: TEXT }}>Millfield Recreation Ground</p>
            <p style={{ color: TEXT_SEC }}>Millfield Lane, Westshire WS2 4PQ</p>
            <p className="mt-1" style={{ color: TEXT_SEC }}>Changing rooms: 2 (shared with other teams)</p>
            <p style={{ color: TEXT_SEC }}>Parking: 30 spaces (overflow on street)</p>
            <p style={{ color: TEXT_SEC }}>Pitch quality: Grass, council maintained</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
            <p className="font-semibold mb-1" style={{ color: TEXT }}>Alternative Venues</p>
            <p style={{ color: TEXT_SEC }}>Westshire Sports Centre (3G) — for waterlogged weekends</p>
            <p style={{ color: TEXT_SEC }}>Kings Road Park — emergency backup</p>
            <p className="mt-1" style={{ color: TEXT_SEC }}>3G hire: £60/hr (11-a-side)</p>
          </div>
        </div>
      </SectionCard>

      {/* Pitch Bookings */}
      <SectionCard title="Pitch Bookings — This Week">
        <div className="space-y-2">
          {TRAINING_SESSIONS.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{s.day} {s.time}</span>
                <p style={{ color: TEXT_SEC }}>{s.venue} — {s.topic}</p>
              </div>
              <Badge color={s.status === 'confirmed' ? '#22C55E' : GOLD}>{s.status}</Badge>
            </div>
          ))}
          <div className="flex items-center justify-between py-2 text-xs">
            <div>
              <span className="font-medium" style={{ color: TEXT }}>Saturday 14:00</span>
              <p style={{ color: TEXT_SEC }}>Crown Meadow (Away)</p>
            </div>
            <Badge color="#3B82F6">Away</Badge>
          </div>
        </div>
      </SectionCard>

      {/* Pitch Inspection */}
      <SectionCard title="Pitch Inspection Log">
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
            <div className="flex items-center justify-between">
              <span className="font-medium" style={{ color: TEXT }}>Last inspection: Sat 29 Mar</span>
              <Badge color="#22C55E">Playable</Badge>
            </div>
            <p className="mt-1" style={{ color: TEXT_SEC }}>Soft in patches near goalmouth. Otherwise good drainage.</p>
          </div>
          {parseInt(WEATHER_FORECAST[3]?.rain || '0') > 50 && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#EF44441a', border: '1px solid #EF444433' }}>
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={12} style={{ color: '#EF4444' }} />
                <span className="font-medium" style={{ color: '#EF4444' }}>Weather alert: Rain expected Saturday</span>
              </div>
              <p className="mt-1" style={{ color: TEXT_SEC }}>Pitch inspection recommended Friday 9am. Contact council groundsman.</p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Weather Widget */}
      <SectionCard title="5-Day Forecast">
        <div className="grid grid-cols-5 gap-2 text-center">
          {WEATHER_FORECAST.map((w, i) => (
            <div key={i} className="p-2 rounded-lg" style={{ backgroundColor: BG }}>
              <p className="text-[10px] font-medium" style={{ color: TEXT_SEC }}>{w.day.split(' ')[0]}</p>
              <w.icon size={20} className="mx-auto my-1" style={{ color: w.condition.includes('Rain') ? '#60A5FA' : GOLD }} />
              <p className="text-xs font-bold" style={{ color: TEXT }}>{w.temp}</p>
              <p className="text-[10px]" style={{ color: TEXT_SEC }}>{w.wind}</p>
              <p className="text-[10px]" style={{ color: parseInt(w.rain) > 50 ? '#EF4444' : TEXT_SEC }}>{w.rain}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Cancellation */}
      <div className="flex gap-2">
        <button onClick={() => onToast('Training cancellation sent to all players')} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#EF44441a', border: '1px solid #EF444433', color: '#EF4444' }}>
          <X size={12} className="inline mr-1" />Cancel Training — Notify All
        </button>
        <button onClick={() => onToast('Match cancellation sent to all players + referee')} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#EF44441a', border: '1px solid #EF444433', color: '#EF4444' }}>
          <X size={12} className="inline mr-1" />Cancel Match — Notify All
        </button>
      </div>
    </div>
  )
}

// ─── Kit & Equipment View ──────��─────────────────────────────────────────────

function KitView() {
  return (
    <div className="space-y-4">
      {/* Kit Inventory */}
      <SectionCard title="Kit Inventory">
        <div className="space-y-0">
          {KIT_INVENTORY.map((k, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{k.item}</span>
                <p style={{ color: TEXT_SEC }}>
                  {Object.entries(k.sizes).map(([s, c]) => `${s}: ${c}`).join(' · ')}
                </p>
              </div>
              <span className="font-mono" style={{ color: TEXT }}>{k.total} total</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Kit Assignment */}
      <SectionCard title="Kit Assignment">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {SQUAD.filter(p => p.registered).map(p => (
            <div key={p.number} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: BG }}>
              <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: PRIMARY, color: '#fff' }}>{p.number}</div>
              <span style={{ color: TEXT }}>{p.name.split(' ').pop()}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Laundry Tracker */}
      <SectionCard title="Laundry Tracker">
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: BG }}>
            <span style={{ color: TEXT }}>Last washed by: Sue Hartley</span>
            <span style={{ color: TEXT_SEC }}>Sat 29 Mar</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: BG }}>
            <span style={{ color: TEXT }}>Kit due back:</span>
            <span style={{ color: GOLD }}>Thursday 3 Apr (before training)</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: BG }}>
            <span style={{ color: TEXT }}>Next wash rota:</span>
            <span style={{ color: TEXT_SEC }}>Tommo Wilson</span>
          </div>
        </div>
      </SectionCard>

      {/* Equipment */}
      <SectionCard title="Equipment Inventory">
        <div className="space-y-0">
          {EQUIPMENT_INVENTORY.map((e, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ color: TEXT }}>{e.item}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono" style={{ color: TEXT }}>{e.stock}/{e.minStock}</span>
                <Badge color={e.status === 'OK' ? '#22C55E' : GOLD}>{e.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Volunteers View ────────────────────────────────────��────────────────────

function VolunteersView({ onToast }: { onToast: (m: string) => void }) {
  const unfilledCount = VOLUNTEER_ROLES.reduce((count, v) => {
    return count + [v.lino1, v.lino2, v.kitMgr, v.firstAid, v.refreshments, v.photos].filter(r => r === 'UNFILLED').length
  }, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        <StatCard label="Volunteers" value={String(VOLUNTEERS.length)} icon={Users} color={PRIMARY} />
        <StatCard label="Unfilled Roles" value={String(unfilledCount)} icon={AlertCircle} color="#EF4444" sub="next 3 matches" />
        <StatCard label="DBS Issues" value={String(VOLUNTEERS.filter(v => !v.dbsValid).length)} icon={Shield} color={GOLD} />
      </div>

      {/* Match Day Roles */}
      <SectionCard title="Match Day Volunteer Rota">
        <div className="space-y-4">
          {VOLUNTEER_ROLES.map((v, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
              <p className="text-xs font-semibold mb-2" style={{ color: TEXT }}>{v.fixture} — {v.date}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[
                  ['Linesman 1', v.lino1], ['Linesman 2', v.lino2], ['Kit Manager', v.kitMgr],
                  ['First Aid', v.firstAid], ['Refreshments', v.refreshments], ['Photographer', v.photos]
                ].map(([role, person]) => (
                  <div key={String(role)} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: person === 'UNFILLED' ? '#EF4444' : '#22C55E' }} />
                    <div>
                      <p style={{ color: TEXT_SEC }}>{role}</p>
                      <p className="font-medium" style={{ color: person === 'UNFILLED' ? '#EF4444' : TEXT }}>{person}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Volunteer List */}
      <SectionCard title="Volunteer Register">
        <div className="space-y-0">
          {VOLUNTEERS.map((v, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{v.name}</span>
                <p style={{ color: TEXT_SEC }}>{v.role}</p>
                <p style={{ color: TEXT_SEC }}>{v.availability}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={v.dbsValid ? '#22C55E' : '#EF4444'}>DBS {v.dbsValid ? 'Valid' : 'Expired'}</Badge>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Thank You Tracker */}
      <SectionCard title="Thank You Tracker — This Season">
        <div className="space-y-2 text-xs">
          {[
            { name: 'Sue Hartley', reason: 'Kit washing every week + organising end of season do', count: 8 },
            { name: 'Karen Wilson', reason: 'Every match day, welfare checks, first aid', count: 11 },
            { name: 'Nige Thornton', reason: 'Running the line when not playing', count: 5 },
            { name: 'Mo Khan', reason: 'Match photos + social media posts', count: 4 },
          ].map((t, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: BG }}>
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{t.name}</span>
                <p style={{ color: TEXT_SEC }}>{t.reason}</p>
              </div>
              <div className="flex items-center gap-1">
                <Star size={12} style={{ color: GOLD }} fill={GOLD} />
                <span style={{ color: GOLD }}>{t.count}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Travel View ──��────────────────────────────���─────────────────────────────

function TravelView({ onToast }: { onToast: (m: string) => void }) {
  return (
    <div className="space-y-4">
      {AWAY_FIXTURES.map((f, i) => (
        <SectionCard key={i} title={`vs ${f.opponent} — ${f.date}`}>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div><span style={{ color: TEXT_SEC }}>Venue</span><p className="font-medium mt-0.5" style={{ color: TEXT }}>{f.venue}</p></div>
              <div><span style={{ color: TEXT_SEC }}>Meeting Point</span><p className="font-medium mt-0.5" style={{ color: TEXT }}>{f.meetPoint}</p></div>
              <div><span style={{ color: TEXT_SEC }}>Departure</span><p className="font-medium mt-0.5" style={{ color: TEXT }}>{f.depart}</p></div>
              <div><span style={{ color: TEXT_SEC }}>Travel Time</span><p className="font-medium mt-0.5" style={{ color: TEXT }}>{f.travelTime}</p></div>
            </div>

            <button onClick={() => window.open(`https://maps.google.com/maps?q=${encodeURIComponent(f.venue)}`, '_blank')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: `${PRIMARY}1a`, color: PRIMARY }}>
              <ExternalLink size={12} />View on Google Maps
            </button>

            {f.drivers.length > 0 && (
              <div>
                <p className="font-semibold mb-1" style={{ color: TEXT }}>Car Sharing</p>
                {f.drivers.map((d, di) => (
                  <div key={di} className="p-2 rounded-lg mb-1" style={{ backgroundColor: BG }}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium" style={{ color: TEXT }}>{d.name}</span>
                      <Badge color={PRIMARY}>{d.passengers.length}/{d.seats} seats</Badge>
                    </div>
                    <p style={{ color: TEXT_SEC }}>Passengers: {d.passengers.join(', ')}</p>
                  </div>
                ))}
              </div>
            )}

            {f.needsLift.length > 0 && (
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#EF44441a' }}>
                <span style={{ color: '#EF4444' }}>Needs a lift: {f.needsLift.join(', ')}</span>
              </div>
            )}
          </div>
        </SectionCard>
      ))}
    </div>
  )
}

// ─── Documents View ────────────────────────────────────��─────────────────────

function DocumentsView() {
  return (
    <div className="space-y-4">
      <SectionCard title="Document Store" action={
        <button className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: PRIMARY, color: '#fff' }}>
          <Upload size={12} className="inline mr-1" />Upload
        </button>
      }>
        <div className="space-y-0">
          {DOCUMENTS.map((d, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2">
                <FileText size={14} style={{ color: PRIMARY }} />
                <div>
                  <span className="font-medium" style={{ color: TEXT }}>{d.name}</span>
                  <p style={{ color: TEXT_SEC }}>Uploaded: {d.uploaded}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={d.status === 'Current' ? '#22C55E' : '#EF4444'}>{d.status}</Badge>
                {d.expiry && <span style={{ color: TEXT_SEC }}>Exp: {d.expiry}</span>}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Renewal Reminders */}
      <SectionCard title="Renewal Reminders">
        <div className="space-y-2 text-xs">
          {DOCUMENTS.filter(d => d.expiry).map((d, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: BG }}>
              <div className="flex items-center gap-2">
                <Clock size={12} style={{ color: GOLD }} />
                <span style={{ color: TEXT }}>{d.name}</span>
              </div>
              <span style={{ color: GOLD }}>Expires: {d.expiry}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* FA Whole Game */}
      <SectionCard title="FA Registration">
        <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: BG }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium" style={{ color: TEXT }}>FA Whole Game System</span>
            <Badge color="#22C55E">Registered</Badge>
          </div>
          <p style={{ color: TEXT_SEC }}>Club ID: WGS-2987-SRFC</p>
          <p style={{ color: TEXT_SEC }}>Affiliation: Westshire FA</p>
          <p style={{ color: TEXT_SEC }}>League: Westshire Sunday League Division 2</p>
          <button className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: `${PRIMARY}1a`, color: PRIMARY }}>
            <ExternalLink size={12} />Open Whole Game System
          </button>
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Club History View ───────────────────────────────────────────────────────

function HistoryView() {
  return (
    <div className="space-y-4">
      {/* Club Info */}
      <SectionCard title="About Sunday Rovers FC">
        <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: BG }}>
          <div className="grid grid-cols-2 gap-3">
            <div><span style={{ color: TEXT_SEC }}>Founded</span><p className="font-semibold" style={{ color: TEXT }}>1987</p></div>
            <div><span style={{ color: TEXT_SEC }}>Ground</span><p className="font-semibold" style={{ color: TEXT }}>Millfield Recreation Ground</p></div>
            <div><span style={{ color: TEXT_SEC }}>Colours</span><p className="font-semibold" style={{ color: TEXT }}>Green & white (home), Navy & gold (away)</p></div>
            <div><span style={{ color: TEXT_SEC }}>Nickname</span><p className="font-semibold" style={{ color: TEXT }}>The Rovers</p></div>
          </div>
          <p className="mt-3" style={{ color: TEXT_SEC }}>
            Sunday Rovers FC was founded in 1987 by a group of mates from The Crown pub who wanted to play competitive Sunday football.
            Originally playing in Division 4, the club has steadily climbed the leagues and currently competes in Division 2 of the Westshire Sunday League.
            The club has always been volunteer-run and prides itself on being a welcoming, community-focused football club.
          </p>
        </div>
      </SectionCard>

      {/* Trophy Cabinet */}
      <SectionCard title="Trophy Cabinet">
        <div className="space-y-0">
          {HONOURS.map((h, i) => (
            <div key={i} className="flex items-center gap-2 py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <Trophy size={14} style={{ color: GOLD }} />
              <div>
                <span className="font-medium" style={{ color: TEXT }}>{h.honour}</span>
                <span className="ml-2" style={{ color: TEXT_SEC }}>{h.season}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Season Records */}
      <SectionCard title="Last 5 Seasons">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ color: TEXT_SEC, borderBottom: `1px solid ${BORDER}` }}>
              <th className="text-left py-2">Season</th><th className="text-left py-2">Finish</th><th className="text-left py-2">Top Scorer</th>
              <th className="text-center py-2">P</th><th className="text-center py-2">W</th><th className="text-center py-2">D</th><th className="text-center py-2">L</th>
            </tr></thead>
            <tbody>
              {SEASON_RECORDS.map(r => (
                <tr key={r.season} style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT }}>
                  <td className="py-2 font-medium">{r.season}</td>
                  <td className="py-2">{r.finish}</td>
                  <td className="py-2" style={{ color: TEXT_SEC }}>{r.topScorer}</td>
                  <td className="py-2 text-center" style={{ color: TEXT_SEC }}>{r.p}</td>
                  <td className="py-2 text-center">{r.w}</td>
                  <td className="py-2 text-center">{r.d}</td>
                  <td className="py-2 text-center">{r.l}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* All-Time Top Scorers */}
      <SectionCard title="All-Time Top Scorers">
        <div className="space-y-0">
          {ALL_TIME_SCORERS.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-xs" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2">
                <span className="w-5 text-center font-bold" style={{ color: i < 3 ? GOLD : TEXT_SEC }}>{i + 1}</span>
                <div>
                  <span className="font-medium" style={{ color: TEXT }}>{s.name}</span>
                  <p style={{ color: TEXT_SEC }}>{s.seasons}</p>
                </div>
              </div>
              <span className="font-mono font-bold text-sm" style={{ color: TEXT }}>{s.goals}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ��── Settings View ──────────────────────────────────────────���────────────────

function SettingsView() {
  return (
    <div className="space-y-4">
      <SectionCard title="Club Profile">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            ['Club Name', 'Sunday Rovers FC'], ['Badge', 'Upload placeholder'], ['Home Colours', 'Green & White'],
            ['Away Colours', 'Navy & Gold'], ['Ground', 'Millfield Recreation Ground'], ['League', 'Westshire Sunday League'],
            ['Division', 'Division 2'], ['Founded', '1987'],
          ].map(([label, value]) => (
            <div key={String(label)} className="p-2 rounded-lg" style={{ backgroundColor: BG }}>
              <span style={{ color: TEXT_SEC }}>{label}</span>
              <p className="font-medium mt-0.5" style={{ color: TEXT }}>{value}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Committee & Staff">
        <div className="space-y-0 text-xs">
          {[
            ['Manager', 'Dave Hartley'], ['Assistant Manager', 'Nige Thornton'], ['Club Secretary', 'Sue Hartley'],
            ['Treasurer', 'Tommo Wilson'], ['Welfare Officer', 'Karen Wilson'],
          ].map(([role, name]) => (
            <div key={String(role)} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ color: TEXT_SEC }}>{role}</span>
              <span className="font-medium" style={{ color: TEXT }}>{name}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Notification Preferences">
        <div className="space-y-2 text-xs">
          {['Match day reminders (24hr before)', 'Training confirmations', 'Subs payment reminders', 'Availability requests', 'Weather alerts', 'Committee updates'].map(pref => (
            <div key={pref} className="flex items-center justify-between py-1.5">
              <span style={{ color: TEXT }}>{pref}</span>
              <div className="w-10 h-5 rounded-full flex items-center px-0.5 cursor-pointer" style={{ backgroundColor: PRIMARY }}>
                <div className="w-4 h-4 rounded-full bg-white ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Integrations">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { name: 'WhatsApp Business API', status: 'Connected', color: '#25D366' },
            { name: 'Stripe (Subs Collection)', status: 'Not connected', color: TEXT_SEC },
            { name: 'FA Whole Game System', status: 'Linked', color: '#22C55E' },
            { name: 'Google Calendar', status: 'Not connected', color: TEXT_SEC },
          ].map(int => (
            <div key={int.name} className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: BG }}>
              <span style={{ color: TEXT }}>{int.name}</span>
              <Badge color={int.color}>{int.status}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Main Page Component ────────���────────────────────────────────────────────

// ─── Club Profile View ──────────────────────────────────────────────────────

type ClubProfileTab = 'info' | 'history' | 'ground' | 'honours' | 'committee' | 'kit' | 'sponsors'

function ClubProfileView() {
  const [tab, setTab] = useState<ClubProfileTab>('info')

  const tabs: { id: ClubProfileTab; label: string; icon: React.ElementType }[] = [
    { id: 'info', label: 'Club Info', icon: Info },
    { id: 'history', label: 'History', icon: History },
    { id: 'ground', label: 'Ground', icon: MapPin },
    { id: 'honours', label: 'Honours', icon: Trophy },
    { id: 'committee', label: 'Committee', icon: Users },
    { id: 'kit', label: 'Kit', icon: Shirt },
    { id: 'sponsors', label: 'Sponsors', icon: DollarSign },
  ]

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 amateur-quickactions-hide-scroll">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              backgroundColor: tab === t.id ? PRIMARY : CARD_BG,
              color: tab === t.id ? '#fff' : TEXT_SEC,
              border: `1px solid ${tab === t.id ? PRIMARY : BORDER}`,
            }}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' && <ClubInfoTab />}
      {tab === 'history' && <ClubHistoryTab />}
      {tab === 'ground' && <ClubGroundTab />}
      {tab === 'honours' && <ClubHonoursTab />}
      {tab === 'committee' && <ClubCommitteeTab />}
      {tab === 'kit' && <ClubKitTab />}
      {tab === 'sponsors' && <ClubSponsorsTab />}
    </div>
  )
}

/* ── Tab 1: Club Info ──────────────────────────────────────────────────────── */

function ClubInfoTab() {
  const details = [
    { label: 'Full Name', value: 'Sunday Rovers FC' },
    { label: 'Nickname', value: 'The Rovers' },
    { label: 'Founded', value: '1994 \u2014 "Started by mates, still going strong"' },
    { label: 'Home Ground', value: 'Millfield Recreation Ground, Westshire' },
    { label: 'Changing Rooms', value: 'Millfield Rec pavilion (shared facility)' },
    { label: 'League', value: 'Westshire Sunday League Division 2' },
    { label: 'County FA', value: 'Westshire County FA' },
    { label: 'WGS Club ID', value: 'WGS-92341' },
    { label: 'Club Colours', value: 'Green and white' },
    { label: 'Club WhatsApp Group', value: '"Ask Pete for the link"' },
    { label: 'Contact', value: 'Club Secretary \u2014 Pete Walsh, 07712 334 891' },
  ]

  return (
    <div className="space-y-4">
      {/* Badge + name */}
      <SectionCard title="Club Badge & Identity">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Badge placeholder */}
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="56" fill={PRIMARY} stroke={ACCENT} strokeWidth="3" />
            <circle cx="60" cy="60" r="46" fill="none" stroke={ACCENT} strokeWidth="1.5" />
            <text x="60" y="52" textAnchor="middle" fill="#fff" fontWeight="700" fontSize="16" fontFamily="sans-serif">{'S\u00B7R\u00B7F\u00B7C'}</text>
            <text x="60" y="72" textAnchor="middle" fill={ACCENT} fontWeight="500" fontSize="11" fontFamily="sans-serif">Est. 1994</text>
          </svg>
          <div>
            <p className="text-lg font-bold" style={{ color: TEXT }}>Sunday Rovers FC</p>
            <p className="text-xs mt-1" style={{ color: TEXT_SEC }}>Westshire Sunday League Division 2</p>
            <div className="flex gap-2 mt-2">
              <Badge color={PRIMARY}>Grassroots</Badge>
              <Badge color={GOLD}>Est. 1994</Badge>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Detail grid */}
      <SectionCard title="Club Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {details.map(d => (
            <div key={d.label} className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: TEXT_SEC }}>{d.label}</p>
              <p className="text-sm font-medium" style={{ color: TEXT }}>{d.value}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

/* ── Tab 2: History ────────────────────────────────────────────────────────── */

function ClubHistoryTab() {
  const timeline = [
    { year: '1994', text: 'Founded by a group of mates from The Crown pub' },
    { year: '1997', text: 'First ever trophy \u2014 Westshire Sunday Vase runners-up' },
    { year: '2003', text: 'Promoted to Division 1 for the first time' },
    { year: '2006', text: "Relegated back to Division 2 (don't mention the manager)" },
    { year: '2011', text: 'Club nearly folded \u2014 8 players turned up one Sunday, but somehow survived' },
    { year: '2014', text: 'Best ever season \u2014 3rd in Division 1' },
    { year: '2018', text: 'Relegated to Division 2 again' },
    { year: '2023', text: 'New committee took over, fresh start' },
    { year: '2024', text: 'Current season \u2014 looking up' },
  ]

  const records = [
    { label: 'Biggest Win', value: '8-1 vs Harwick Wanderers (2014)' },
    { label: 'Biggest Loss', value: '0-9 vs Millfield Athletic (2007) \u2014 "We don\'t talk about that"' },
    { label: 'Top Scorer (All Time)', value: 'Gaz Mullins \u2014 94 goals' },
    { label: 'Most Appearances', value: 'Pete Walsh \u2014 287 (also club secretary)' },
    { label: 'Longest Losing Streak', value: '11 games (2006 \u2014 "the dark times")' },
  ]

  return (
    <div className="space-y-4">
      <SectionCard title="Club Timeline">
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-0.5" style={{ backgroundColor: BORDER }} />
          <div className="space-y-5">
            {timeline.map((e, i) => (
              <div key={i} className="relative">
                {/* Dot */}
                <div
                  className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2"
                  style={{ backgroundColor: i === timeline.length - 1 ? PRIMARY : CARD_BG, borderColor: PRIMARY }}
                />
                <p className="text-xs font-bold" style={{ color: PRIMARY }}>{e.year}</p>
                <p className="text-sm mt-0.5" style={{ color: TEXT }}>{e.text}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Club Records">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {records.map(r => (
            <div key={r.label} className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: TEXT_SEC }}>{r.label}</p>
              <p className="text-sm font-medium" style={{ color: TEXT }}>{r.value}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

/* ── Tab 3: Ground ─────────────────────────────────────────────────────────── */

function ClubGroundTab() {
  const facilities = [
    { name: 'Pitch', available: true, note: 'Decent grass pitch \u2014 gets muddy in winter' },
    { name: 'Changing Rooms', available: true, note: 'Pavilion \u2014 cold showers, bring flip flops' },
    { name: 'Car Park', available: true, note: 'Free, 30 spaces' },
    { name: 'Floodlights', available: false, note: 'None \u2014 all games before dark' },
    { name: 'Bar', available: false, note: 'None on site \u2014 Crown pub nearby' },
    { name: 'Covered Spectator Area', available: false, note: '' },
    { name: 'Toilets', available: true, note: '(in pavilion)' },
  ]

  return (
    <div className="space-y-4">
      <SectionCard title="Millfield Recreation Ground">
        <div className="space-y-3">
          <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: TEXT_SEC }}>Address</p>
            <p className="text-sm font-medium" style={{ color: TEXT }}>Millfield Lane, Westshire, WS4 7TR</p>
          </div>
          <div className="space-y-2">
            {facilities.map(f => (
              <div key={f.name} className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ backgroundColor: BG }}>
                <span className="mt-0.5 text-sm">{f.available ? '\u2705' : '\u274C'}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: TEXT }}>{f.name}</p>
                  {f.note && <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>{f.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Pitch Hire & Booking">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: TEXT_SEC }}>Pitch Hire</p>
            <p className="text-sm font-medium" style={{ color: TEXT }}>{'\u00A3'}35/session</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: TEXT_SEC }}>Booking</p>
            <p className="text-sm font-medium" style={{ color: TEXT }}>Millfield Rec \u2014 01922 445 512</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: TEXT_SEC }}>Groundsman</p>
            <p className="text-sm font-medium" style={{ color: TEXT }}>Council maintained</p>
          </div>
        </div>
      </SectionCard>

      {/* Weather warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: '#78350F33', border: '1px solid #F59E0B44' }}>
        <AlertTriangle size={18} style={{ color: GOLD, flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: GOLD }}>Weather Note</p>
          <p className="text-xs mt-1" style={{ color: TEXT }}>Pitch gets waterlogged after heavy rain \u2014 always check before Saturday morning</p>
        </div>
      </div>
    </div>
  )
}

/* ── Tab 4: Honours ────────────────────────────────────────────────────────── */

function ClubHonoursTab() {
  const honours = [
    {
      category: 'League',
      items: [
        'Westshire Sunday League Div 1 Runners Up \u2014 2014',
        'Westshire Sunday League Div 2 Champions \u2014 2003',
        'Westshire Sunday League Div 2 Champions \u2014 2012',
      ],
    },
    {
      category: 'Cups',
      items: [
        'Westshire Sunday Vase Runners Up \u2014 1997',
        'Westshire Sunday Cup Quarter-final \u2014 2014',
      ],
    },
    {
      category: 'Awards',
      items: [
        'Fair Play Award \u2014 2019',
        'Club of the Month \u2014 November 2022',
      ],
    },
    {
      category: 'Individual',
      items: [
        'Golden Boot \u2014 Gaz Mullins 2013 (22 goals)',
      ],
    },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#2C1810', border: '1px solid #5C3A1E' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #5C3A1E' }}>
          <p className="text-sm font-bold tracking-wide" style={{ color: '#F1C40F' }}>
            <Trophy size={14} className="inline mr-1.5 -mt-0.5" />
            Honours Board
          </p>
        </div>
        <div className="p-4 space-y-5">
          {honours.map(h => (
            <div key={h.category}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#F1C40F' }}>{h.category}</p>
              <div className="space-y-1.5">
                {h.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 pl-2">
                    <Star size={10} style={{ color: '#F1C40F', flexShrink: 0 }} />
                    <p className="text-sm" style={{ color: '#FDE68A' }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Tab 5: Committee ──────────────────────────────────────────────────────── */

function ClubCommitteeTab() {
  const committee = [
    { name: 'Pete Walsh', role: 'Secretary', desc: 'Does everything', phone: '07712 334 891' },
    { name: 'Dave Higgins', role: 'Manager', desc: 'Centre half / Complains about referees', phone: '' },
    { name: 'Carol Walsh', role: 'Treasurer', desc: "Pete's wife / Keeps the money straight", phone: '' },
    { name: 'Jonesy (Steve Jones)', role: 'Kit Man', desc: 'WhatsApp admin / Brings the bibs', phone: '' },
    { name: 'Robbo (Rob Davies)', role: 'Social Secretary', desc: 'Books the curry house', phone: '' },
  ]

  const openRoles = [
    { role: 'Welfare Officer', note: 'Required by FA \u2014 nobody has volunteered yet', urgent: true },
    { role: 'Fixture Secretary', note: 'Pete does it but would love help', urgent: false },
  ]

  return (
    <div className="space-y-4">
      <SectionCard title="Who Runs the Club">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ color: TEXT }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: TEXT_SEC }}>Name</th>
                <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: TEXT_SEC }}>Role</th>
                <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wider font-semibold hidden sm:table-cell" style={{ color: TEXT_SEC }}>Notes</th>
                <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: TEXT_SEC }}>Phone</th>
              </tr>
            </thead>
            <tbody>
              {committee.map(c => (
                <tr key={c.name} style={{ borderBottom: `1px solid ${BORDER}22` }}>
                  <td className="py-2.5 px-2 font-medium">{c.name}</td>
                  <td className="py-2.5 px-2"><Badge color={PRIMARY}>{c.role}</Badge></td>
                  <td className="py-2.5 px-2 hidden sm:table-cell" style={{ color: TEXT_SEC }}>{c.desc}</td>
                  <td className="py-2.5 px-2" style={{ color: TEXT_SEC }}>{c.phone || '\u2014'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Open Roles">
        <div className="space-y-2">
          {openRoles.map(r => (
            <div key={r.role} className="flex items-start gap-2.5 p-3 rounded-lg" style={{ backgroundColor: r.urgent ? '#7F1D1D33' : BG, border: r.urgent ? '1px solid #EF444444' : 'none' }}>
              {r.urgent && <AlertTriangle size={14} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />}
              <div>
                <p className="text-sm font-medium" style={{ color: TEXT }}>{r.role} {r.urgent && <span style={{ color: '#EF4444' }}>{'\u26A0\uFE0F'}</span>}</p>
                <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>{r.note}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="p-3 rounded-lg" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
        <p className="text-xs" style={{ color: TEXT_SEC }}>
          <Calendar size={12} className="inline mr-1 -mt-0.5" />
          Next committee meeting: <span style={{ color: TEXT }} className="font-medium">Post-match at The Crown, first Sunday of the month</span>
        </p>
      </div>
    </div>
  )
}

/* ── Tab 6: Kit ────────────────────────────────────────────────────────────── */

function ClubKitTab() {
  const kitInfo = [
    { label: 'Kit Supplier', value: 'Pro:Direct (bulk order)' },
    { label: 'Sponsor', value: "Walsh's Plumbing (Pete's business \u2014 on the shirts for free)" },
    { label: 'Last Order', value: 'Aug 2023' },
    { label: 'Condition', value: "Most of it's fine. Number 7 shirt has a tear \u2014 needs replacing" },
  ]

  return (
    <div className="space-y-4">
      <SectionCard title="Kit Design">
        <div className="flex flex-wrap gap-8 justify-center py-2">
          {/* Home kit */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-semibold" style={{ color: TEXT }}>Home</p>
            <svg width="120" height="140" viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 30 L10 50 L10 60 L25 55 L25 130 L95 130 L95 55 L110 60 L110 50 L90 30 L75 25 L60 32 L45 25 Z" fill={PRIMARY} stroke={ACCENT} strokeWidth="1.5"/>
              <path d="M45 25 L60 32 L75 25" fill="none" stroke="#fff" strokeWidth="2.5"/>
              <text x="60" y="72" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="600" fontFamily="sans-serif">{"Walsh's"}</text>
              <text x="60" y="82" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="600" fontFamily="sans-serif">Plumbing</text>
              <text x="60" y="110" textAnchor="middle" fill={ACCENT} fontSize="20" fontWeight="700" fontFamily="sans-serif" opacity="0.4">9</text>
            </svg>
            <p className="text-[10px]" style={{ color: TEXT_SEC }}>Green body, white collar</p>
          </div>

          {/* Away kit */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-semibold" style={{ color: TEXT }}>Away</p>
            <svg width="120" height="140" viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 30 L10 50 L10 60 L25 55 L25 130 L95 130 L95 55 L110 60 L110 50 L90 30 L75 25 L60 32 L45 25 Z" fill="#fff" stroke={PRIMARY} strokeWidth="1.5"/>
              <path d="M45 25 L60 32 L75 25" fill="none" stroke={PRIMARY} strokeWidth="2.5"/>
              <line x1="25" y1="55" x2="25" y2="130" stroke={PRIMARY} strokeWidth="1" opacity="0.5"/>
              <line x1="95" y1="55" x2="95" y2="130" stroke={PRIMARY} strokeWidth="1" opacity="0.5"/>
              <text x="60" y="72" textAnchor="middle" fill={DARK} fontSize="7" fontWeight="600" fontFamily="sans-serif">{"Walsh's"}</text>
              <text x="60" y="82" textAnchor="middle" fill={DARK} fontSize="7" fontWeight="600" fontFamily="sans-serif">Plumbing</text>
            </svg>
            <p className="text-[10px]" style={{ color: TEXT_SEC }}>White body, green trim</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Kit Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {kitInfo.map(k => (
            <div key={k.label} className="p-3 rounded-lg" style={{ backgroundColor: BG }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: TEXT_SEC }}>{k.label}</p>
              <p className="text-sm font-medium" style={{ color: TEXT }}>{k.value}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Squad Numbers">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {SQUAD.filter(p => p.number >= 1 && p.number <= 18).sort((a, b) => a.number - b.number).map(p => (
            <div key={p.number} className="p-2 rounded-lg text-center" style={{ backgroundColor: BG }}>
              <p className="text-lg font-bold" style={{ color: PRIMARY }}>#{p.number}</p>
              <p className="text-xs font-medium truncate" style={{ color: TEXT }}>{p.name}</p>
              <p className="text-[10px]" style={{ color: TEXT_SEC }}>{p.position}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="p-3 rounded-lg" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
        <p className="text-xs" style={{ color: TEXT_SEC }}>
          <Shirt size={12} className="inline mr-1 -mt-0.5" />
          Spare kit: <span style={{ color: TEXT }} className="font-medium">{"3 shirts in the boot of Pete's car"}</span>
        </p>
      </div>
    </div>
  )
}

/* ── Tab 7: Sponsors ───────────────────────────────────────────────────────── */

function ClubSponsorsTab() {
  const sponsors = [
    { name: "Walsh's Plumbing", type: 'Shirt Sponsor', value: 'In kind (Pete owns it)', amount: 0 },
    { name: 'The Crown Pub', type: 'Match Ball Sponsor', value: '\u00A320/match (pays for the ball)', amount: 220 },
    { name: 'Westshire Car Wash', type: 'Training Kit', value: '\u00A3300 one-off', amount: 300 },
  ]
  const totalText = '\u00A3620 this season'

  return (
    <div className="space-y-4">
      <SectionCard title="Club Sponsors \u2014 Small but Vital">
        <div className="space-y-3">
          {sponsors.map(s => (
            <div key={s.name} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: BG }}>
              <div>
                <p className="text-sm font-medium" style={{ color: TEXT }}>{s.name}</p>
                <p className="text-xs" style={{ color: TEXT_SEC }}>{s.type}</p>
              </div>
              <Badge color={PRIMARY}>{s.value}</Badge>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${BORDER}` }}>
          <p className="text-xs font-semibold" style={{ color: TEXT_SEC }}>Total Sponsorship</p>
          <p className="text-sm font-bold" style={{ color: PRIMARY }}>{totalText}</p>
        </div>
        <p className="text-xs mt-2 italic" style={{ color: TEXT_SEC }}>{"\"Every bit helps \u2014 covers the referee fees\""}</p>
      </SectionCard>

      {/* CTA panel */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: `${PRIMARY}15`, border: `1px solid ${PRIMARY}44` }}>
        <div className="p-4 space-y-4">
          <p className="text-sm font-bold" style={{ color: PRIMARY }}>Want to Support the Rovers?</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 p-3 rounded-lg" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
              <p className="text-sm font-semibold" style={{ color: TEXT }}>{"Sponsor a Match Ball \u2014 \u00A320"}</p>
              <p className="text-xs mt-1" style={{ color: TEXT_SEC }}>{"\"Talk to Pete\""}</p>
            </div>
            <div className="flex-1 p-3 rounded-lg" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}>
              <p className="text-sm font-semibold" style={{ color: TEXT }}>Sponsor the Kit Next Season</p>
              <p className="text-xs mt-1" style={{ color: TEXT_SEC }}>{"\"Interested? We'll put your logo everywhere\""}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────
export default function GrassrootsPortal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return (
    <SportsDemoGate
      sport="grassroots"
      defaultClubName="Sunday Rovers FC"
      defaultSlug={slug}
      accentColor="#16a34a"
      accentColorLight="#22c55e"
      sportEmoji="⚽"
      sportLabel="Lumio Grassroots"
      roles={GRASSROOTS_ROLES}
    >
      {(session) => <GrassrootsPortalInner session={session} />}
    </SportsDemoGate>
  )
}

// ─── Getting Started Tab ────────────────────────────────────────────────────

const ONBOARDING_ITEMS = [
  { id: 'club-profile', label: 'Set up your club profile' },
  { id: 'add-squad', label: 'Add your squad (18 players)' },
  { id: 'whatsapp', label: 'Connect WhatsApp availability' },
  { id: 'league', label: 'Set your league and fixtures' },
  { id: 'safeguarding', label: 'Upload safeguarding certificates' },
  { id: 'kit', label: 'Add your kit inventory' },
  { id: 'subs', label: 'Set up subs collection' },
  { id: 'pitch', label: 'Add your pitch/venue details' },
  { id: 'committee', label: 'Invite your committee members' },
  { id: 'ready', label: 'You\u2019re ready \u2014 kick off!' },
]

function GettingStartedView({ onToast }: { onToast: (m: string) => void }) {
  const [completed, setCompleted] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lumio_grassroots_onboarding')
        if (stored) setCompleted(JSON.parse(stored))
      } catch { /* ignore */ }
    }
  }, [])

  const toggle = (id: string) => {
    setCompleted(prev => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem('lumio_grassroots_onboarding', JSON.stringify(next))
      return next
    })
    onToast(completed[id] ? `Unmarked: ${ONBOARDING_ITEMS.find(i => i.id === id)?.label}` : `Completed: ${ONBOARDING_ITEMS.find(i => i.id === id)?.label}`)
  }

  const doneCount = Object.values(completed).filter(Boolean).length

  return (
    <div className="space-y-4">
      <SectionCard title="Getting Started Checklist" action={<span className="text-xs font-semibold" style={{ color: PRIMARY }}>{doneCount}/{ONBOARDING_ITEMS.length} done</span>}>
        <div className="space-y-1">
          {ONBOARDING_ITEMS.map((item, i) => {
            const done = !!completed[item.id]
            return (
              <button key={item.id} onClick={() => toggle(item.id)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-all"
                style={{ backgroundColor: done ? `${PRIMARY}0d` : 'transparent', border: `1px solid ${done ? `${PRIMARY}33` : BORDER}` }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{ backgroundColor: done ? PRIMARY : 'transparent', border: done ? 'none' : `2px solid ${BORDER}`, color: done ? '#fff' : TEXT_SEC }}>
                  {done ? <Check size={14} /> : i + 1}
                </div>
                <span className="text-sm font-medium" style={{ color: done ? TEXT_SEC : TEXT, textDecoration: done ? 'line-through' : 'none' }}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </SectionCard>
      {doneCount === ONBOARDING_ITEMS.length && (
        <div className="rounded-xl p-4 text-center" style={{ background: `linear-gradient(135deg, ${BG} 0%, #064E3B 100%)`, border: `1px solid ${PRIMARY}33` }}>
          <p className="text-lg font-bold" style={{ color: PRIMARY }}>All set! Your club is ready to go.</p>
          <p className="text-xs mt-1" style={{ color: TEXT_SEC }}>Head to the Overview tab to start managing your club.</p>
        </div>
      )}
    </div>
  )
}

function GrassrootsPortalInner({ session }: { session: SportsDemoSession }) {
  const [activeDept, setActiveDept] = useState<DeptId>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const [activeTab, setActiveTab] = useState<'gettingstarted'|'today'|'quickwins'|'dailytasks'|'insights'|'dontmiss'|'team'>(() => {
    try { const seen = typeof window !== 'undefined' ? localStorage.getItem('grassroots_getting_started_seen') : null; return seen ? 'today' : 'gettingstarted' } catch { return 'gettingstarted' }
  })
  const activeRole = session.role
  const clubName = session.clubName || 'Sunday Rovers FC'

  useEffect(() => { setSidebarPinned(typeof window !== 'undefined' && localStorage.getItem('lumio_grassroots_sidebar_pinned') === 'true') }, [])

  function fireToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function handleQuickAction(label: string) {
    fireToast(`${label} — opening...`)
  }

  const deptLabel = SIDEBAR_ITEMS.find(d => d.id === activeDept)?.label || 'Overview'

  return (
    <div className="flex flex-col" style={{ backgroundColor: '#07080F', color: TEXT, minHeight: '100vh', zoom: 0.9 }}>
      <Toast message={toast} />

      {/* Scrollbar styles */}
      <style>{`
        .amateur-quickactions-hide-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .amateur-quickactions-hide-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Top-right avatar */}
      <div style={{ position: 'fixed', top: 12, right: 20, zIndex: 60, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button title="Notifications" style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#111318', border: `1px solid ${BORDER}`, color: TEXT_SEC, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
          <Bell size={16} strokeWidth={1.75} />
          <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EF4444', fontSize: 6, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>2</span>
        </button>
        <button style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: PRIMARY, border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          DH
        </button>
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden flex items-center px-4 py-2 shrink-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <button className="p-1.5 rounded-lg" style={{ color: TEXT_SEC }} onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
        <span className="text-sm font-semibold ml-2 truncate" style={{ color: TEXT }}>{clubName}</span>
      </div>

      {/* Body: sidebar + content */}
      <div className="flex flex-1" style={{ minHeight: '100vh' }}>
        <Sidebar activeDept={activeDept} onSelect={(d) => setActiveDept(d as DeptId)} open={sidebarOpen} onClose={() => setSidebarOpen(false)} session={session} onPinChange={setSidebarPinned} />

        <div className="flex-1 flex flex-col min-w-0" style={{ minHeight: '100vh' }}>
          {/* Demo workspace banner */}
          <div className="flex items-center justify-between px-6 py-2 text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#F97316', color: '#ffffff' }}>
            <span>This is a demo &middot; sample data</span>
            <a href="/sports-signup" className="hover:underline font-semibold" style={{ color: '#ffffff' }}>Apply for your free founding access &rarr; lumiosports.com/sports-signup</a>
          </div>

          <div className="flex-1 overflow-y-auto">
            <main className="flex-1 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-lg font-bold">{deptLabel}</h1>
                  <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>{clubName} · Westshire Sunday League Div 2</p>
                </div>
              </div>

              {/* Getting Started / Today tabs for overview */}
              {activeDept === 'overview' && (
                <>
                  {/* Morning Banner — stat boxes + world clock inside */}
                  <div className="relative rounded-2xl overflow-hidden mb-4 p-6" style={{ background: 'linear-gradient(135deg, #052e16 0%, #0f172a 60%, #0c1321 100%)', border: '1px solid rgba(22,163,74,0.2)' }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-1"><h1 className="text-2xl font-bold text-white">Good morning, Dave ⚽</h1></div>
                        <p className="text-sm mb-2" style={{ color: '#9CA3AF' }}>{new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
                        <p className="text-xs italic" style={{ color: '#16A34A' }}>&ldquo;The best teams have the most fun.&rdquo; &mdash; Grassroots wisdom</p>
                      </div>
                      <div className="hidden md:flex items-center gap-3 ml-4">
                        {[{ icon:'🏆', value:'8th', label:'League', color:'#16A34A' },{ icon:'📅', value:'Sun 5', label:'Next Match', color:'#F59E0B' },{ icon:'✅', value:'13/18', label:'Confirmed', color:'#22C55E' },{ icon:'💰', value:'£340', label:'Balance', color:'#0ea5e9' }].map((s,i) => (
                          <div key={i} className="flex flex-col items-center justify-center w-[72px] h-[72px] rounded-xl" style={{ background:`${s.color}22`, border:`1px solid ${s.color}44` }}>
                            <div className="text-xl mb-0.5">{s.icon}</div><div className="text-base font-black leading-none" style={{ color: s.color }}>{s.value}</div><div className="text-[9px] mt-0.5" style={{ color: '#6B7280' }}>{s.label}</div>
                          </div>
                        ))}
                        <div className="flex flex-col items-center justify-center w-[72px] h-[72px] rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div className="text-xl">🌧️</div><div className="text-sm font-bold text-white">9°C</div><div className="text-[9px]" style={{ color: '#6B7280' }}>Sunday</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tab bar */}
                  <div className="flex gap-2 border-b mb-0" style={{ borderColor: BORDER, overflowX: 'hidden' }}>
                    <button onClick={() => setActiveTab('gettingstarted')} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap" style={{ borderColor: activeTab === 'gettingstarted' ? '#F97316' : 'transparent', color: activeTab === 'gettingstarted' ? '#F97316' : TEXT_SEC, backgroundColor: activeTab === 'gettingstarted' ? '#F973160d' : 'transparent' }}>🚀 Getting Started <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: '#F97316' }}>10</span></button>
                    {([{ id:'today' as const,label:'Today',icon:'🏠' },{ id:'quickwins' as const,label:'Quick Wins',icon:'⚡' },{ id:'dailytasks' as const,label:'Daily Tasks',icon:'✅' },{ id:'insights' as const,label:'Insights',icon:'📊' },{ id:'dontmiss' as const,label:"Don't Miss",icon:'🔴' },{ id:'team' as const,label:'Squad',icon:'👥' }]).map(t => (
                      <button key={t.id} onClick={() => setActiveTab(t.id)} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap" style={{ borderColor: activeTab === t.id ? '#F97316' : 'transparent', color: activeTab === t.id ? TEXT : TEXT_SEC, backgroundColor: activeTab === t.id ? '#F973160d' : 'transparent' }}><span>{t.icon}</span>{t.label}</button>
                    ))}
                  </div>

                  {/* Quick Actions — below tab bar */}
                  <div className="mb-5 mt-4">
                    <div className="text-xs font-bold uppercase tracking-wider mb-2.5 px-1" style={{ color: '#4B5563' }}>Quick actions</div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label:'WhatsApp Availability', icon:'📱', color:'#16A34A', hot:false },
                        { label:'Subs Dashboard', icon:'💰', color:'#F59E0B', hot:false },
                        { label:'Post-Match Brief', icon:'📝', color:'#16A34A', hot:true },
                        { label:'Referee Booker', icon:'👁️', color:'#0ea5e9', hot:false },
                        { label:'DBS Tracker', icon:'🛡️', color:'#EF4444', hot:false },
                        { label:'Pitch Checker', icon:'🌧️', color:'#0ea5e9', hot:true },
                        { label:'Halftime Talk', icon:'🎤', color:'#8B5CF6', hot:true },
                        { label:'Kit Manager', icon:'👕', color:'#6B7280', hot:false },
                        { label:'FA FULL-TIME', icon:'📋', color:'#6B7280', hot:false },
                        { label:'Match Report', icon:'📊', color:'#16A34A', hot:true },
                        { label:'Player Dev', icon:'📈', color:'#6B7280', hot:false },
                        { label:'Season Plan', icon:'🏆', color:'#F59E0B', hot:true },
                      ].map((a, i) => (
                        <button key={i} className="relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap"
                          style={{ background: a.hot ? `${a.color}18` : CARD_BG, border: a.hot ? `1px solid ${a.color}50` : `1px solid ${BORDER}`, color: a.hot ? a.color : TEXT_SEC }}>
                          <span>{a.icon}</span>{a.label}
                          {a.hot && <span className="absolute -top-1 -right-1 text-[8px] px-1 py-0.5 rounded-full font-black leading-none" style={{ backgroundColor: a.color, color: '#fff' }}>AI</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeTab === 'gettingstarted' && <GettingStartedView onToast={fireToast} />}
                  {activeTab === 'today' && (
                    <GrassrootsDashboardView
                      onAskLumio={() => fireToast('Ask Lumio — opening...')}
                      onWhosPlaying={() => setActiveDept('availability')}
                    />
                  )}
                  {activeTab === 'quickwins' && <div className="pt-4 space-y-3">
                    <div className="flex items-center justify-between mb-2"><div><h2 className="text-xl font-black flex items-center gap-2" style={{color:TEXT}}>⚡ Quick Wins</h2><p className="text-sm mt-0.5" style={{color:TEXT_SEC}}>High impact, low effort — sorted by priority.</p></div></div>
                    {[{a:'3 players haven\'t replied to availability — deadline Thursday 20:00',i:'Critical',c:'Squad',cta:'Chase now',effort:'2min'},{a:'Dave Nolan DBS OVERDUE — safeguarding risk',i:'Critical',c:'Safeguarding',cta:'Renew now',effort:'5min'},{a:'4 players owe subs — £110 outstanding',i:'High',c:'Finance',cta:'Chase subs',effort:'2min'},{a:'Last result not submitted to FA FULL-TIME',i:'High',c:'Admin',cta:'Submit now',effort:'5min'},{a:'Referee not yet booked for 20 Apr home match',i:'Medium',c:'Admin',cta:'Book referee',effort:'5min'}].map((w,i)=>(<div key={i} className="rounded-2xl p-5 transition-all" style={{backgroundColor:'#111318',border:'1px solid #1F2937'}}><div className="flex items-start justify-between gap-4"><div className="flex-1"><div className="flex items-center gap-2 mb-2 flex-wrap"><span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{backgroundColor:w.i==='Critical'?'rgba(239,68,68,0.12)':w.i==='High'?'rgba(245,158,11,0.12)':'rgba(107,114,128,0.12)',color:w.i==='Critical'?'#EF4444':w.i==='High'?'#F59E0B':'#6B7280'}}>{w.i.toUpperCase()} IMPACT</span><span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{backgroundColor:'#F973161e',color:'#F97316'}}>⏱ {w.effort}</span></div><h3 className="font-bold mb-1" style={{color:'#F9FAFB'}}>{w.a}</h3><p className="text-xs mt-2" style={{color:'#374151'}}>Source: {w.c}</p></div><div className="flex flex-col gap-2 flex-shrink-0"><button className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{backgroundColor:'#F97316'}}>{w.cta} →</button><button className="px-4 py-2 text-xs rounded-xl transition-colors" style={{backgroundColor:'rgba(255,255,255,0.05)',color:'#6B7280'}}>Mark done</button></div></div></div>))}
                  </div>}
                  {activeTab === 'dailytasks' && <div className="pt-4 space-y-3">
                    <div className="flex items-center justify-between mb-2"><div><h2 className="text-xl font-black flex items-center gap-2" style={{color:TEXT}}>✅ Daily Tasks</h2><p className="text-sm mt-0.5" style={{color:TEXT_SEC}}>Your operational checklist for today.</p></div></div>
                    {[{time:'Tue',task:'Send availability request — WhatsApp',cat:'Squad',priority:'High',color:'#EF4444'},{time:'NOW',task:'DBS renewal — Dave Nolan OVERDUE',cat:'Safeguarding',priority:'Urgent',color:'#EF4444'},{time:'Wed',task:'Subs chase — 4 outstanding',cat:'Finance',priority:'Medium',color:'#F59E0B'},{time:'Thu',task:'Confirm pitch booking — council',cat:'Admin',priority:'Medium',color:'#F59E0B'},{time:'Sat',task:'Submit 15 Mar result to FA FULL-TIME',cat:'Admin',priority:'Low',color:'#6B7280'}].map((t,i)=>(<div key={i} className="rounded-xl p-4 transition-all" style={{backgroundColor:'#111318',border:'1px solid #1F2937'}}><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3 flex-1"><div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer" style={{borderColor:'#374151'}}></div><div className="flex-1"><h3 className="font-bold mb-1" style={{color:'#F9FAFB'}}>{t.task}</h3><div className="flex items-center gap-2 flex-wrap"><span className="text-xs font-bold px-2 py-0.5 rounded" style={{backgroundColor:`${t.color}1e`,color:t.color}}>{t.priority}</span><span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor:'#1F2937',color:'#9CA3AF'}}>{t.cat}</span><span className="text-xs px-1.5 py-0.5 rounded" style={{backgroundColor:'#F973161e',color:'#F97316'}}>Lumio</span><span className="text-xs ml-auto" style={{color:'#6B7280'}}>{t.time}</span></div></div></div><div className="flex flex-col gap-2 flex-shrink-0"><button className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{backgroundColor:'#F97316'}}>Action →</button><button className="px-4 py-2 text-xs rounded-xl transition-colors" style={{backgroundColor:'rgba(255,255,255,0.05)',color:'#6B7280'}}>Mark done</button></div></div></div>))}
                  </div>}
                  {activeTab === 'insights' && <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">{[{title:'League Position',value:'8th',sub:'Westshire Sunday League Div 2',color:PRIMARY,icon:'🏆'},{title:'Form (Last 5)',value:'WDLWL',sub:'5 pts from last 15 available',color:'#F59E0B',icon:'📊'},{title:'Top Scorer',value:'Jake Nolan (7)',sub:"Manager's son — 7 goals in 15 apps",color:'#22C55E',icon:'⚽'},{title:'Subs Status',value:'£620 / £720',sub:'86% collected — 4 outstanding',color:'#0ea5e9',icon:'💰'},{title:'DBS Status',value:'2 OVERDUE',sub:'Dave Nolan + Bob Turner',color:'#EF4444',icon:'🛡️'},{title:'Squad Available',value:'13/18',sub:'3 not responded for Sunday',color:'#8B5CF6',icon:'👥'}].map((ins,i)=>(<div key={i} className="flex items-start gap-4 rounded-xl p-5" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><div className="text-2xl flex-shrink-0">{ins.icon}</div><div className="flex-1"><div className="text-xs mb-1" style={{color:TEXT_SEC}}>{ins.title}</div><div className="text-2xl font-black" style={{color:ins.color}}>{ins.value}</div><div className="text-[11px] mt-1" style={{color:TEXT_SEC}}>{ins.sub}</div></div></div>))}</div>}
                  {activeTab === 'dontmiss' && <div className="pt-4 space-y-3">{[{u:'CRITICAL',item:'Dave Nolan + Bob Turner DBS OVERDUE. If missed: safeguarding breach.',action:'Renew now →',color:'#EF4444'},{u:'CRITICAL',item:'Availability deadline Thursday 20:00 — 3 not responded. If missed: can\'t name squad.',action:'Chase now →',color:'#EF4444'},{u:'TODAY',item:'FA FULL-TIME result submission — 3 weeks overdue. If missed: league fine.',action:'Submit now →',color:'#F59E0B'},{u:'THIS WEEK',item:'Subs — collect from 4 players outstanding. If missed: £110 lost.',action:'Chase →',color:'#F59E0B'},{u:'THIS WEEK',item:'Referee not booked for 20 Apr home match. If missed: match abandoned.',action:'Book now →',color:'#6B7280'}].map((d,i)=>(<div key={i} className="flex items-start gap-4 rounded-xl p-4" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><span className="text-[10px] px-2 py-1 rounded font-black flex-shrink-0 mt-0.5" style={{background:d.u==='CRITICAL'?'rgba(239,68,68,0.12)':d.u==='TODAY'?'rgba(245,158,11,0.12)':'rgba(107,114,128,0.12)',color:d.u==='CRITICAL'?'#EF4444':d.u==='TODAY'?'#F59E0B':'#6B7280'}}>{d.u}</span><div className="flex-1"><p className="text-sm mb-1" style={{color:TEXT}}>{d.item}</p><button className="text-[10px] font-semibold" style={{color:d.color}}>{d.action}</button></div></div>))}</div>}
                  {activeTab === 'team' && <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">{[{name:'Dave Nolan',role:'Manager',status:'Availability sent — 13/18 confirmed',available:true,initials:'DN',color:'#16A34A'},{name:'Bob Turner',role:'Treasurer',status:'£110 subs outstanding — chasing',available:true,initials:'BT',color:'#F59E0B'},{name:'Phil Rees',role:'Coach',status:'Training plan ready for Thursday',available:true,initials:'PR',color:'#0ea5e9'},{name:'Sarah Nolan',role:'Welfare Officer',status:'DBS checks reviewed — 2 overdue flagged',available:true,initials:'SN',color:'#8B5CF6'},{name:'Terry Walsh',role:'Groundsman',status:'Pitch marked — lines done Saturday',available:true,initials:'TW',color:'#6B7280'},{name:'Mike Jenkins',role:'Referee (Sunday)',status:'Confirmed for vs The Crown FC',available:true,initials:'MJ',color:'#22C55E'}].map((m,i)=>(<div key={i} className="flex items-center gap-4 rounded-xl p-4" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{background:`${m.color}20`,border:`1px solid ${m.color}40`,color:m.color}}>{m.initials}</div><div className="flex-1 min-w-0"><div className="text-sm font-semibold" style={{color:TEXT}}>{m.name}</div><div className="text-[10px]" style={{color:m.color}}>{m.role}</div><div className="text-[10px] truncate" style={{color:TEXT_SEC}}>{m.status}</div></div><div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:m.available?'#22C55E':'#374151'}}/></div>))}</div>}
                </>
              )}
              {activeDept === 'club-profile' && <ClubProfileView />}
              {activeDept === 'squad' && <SquadView />}
              {activeDept === 'matchday' && <MatchDayView onToast={fireToast} />}
              {activeDept === 'fixtures' && <FixturesView />}
              {activeDept === 'tactics' && <GrassrootsTacticsView />}
              {activeDept === 'set-pieces' && <GrassrootsSetPiecesView />}
              {activeDept === 'finances' && <FinancesView onToast={fireToast} />}
              {activeDept === 'welfare' && <WelfareView />}
              {activeDept === 'communications' && <CommsView onToast={fireToast} />}
              {activeDept === 'media' && <MediaContentModule sport="grassroots" accentColor="#16a34a" isDemoShell={session.isDemoShell !== false} />}
              {activeDept === 'referee' && <RefereeView onToast={fireToast} />}
              {activeDept === 'pitch' && <PitchView onToast={fireToast} />}
              {activeDept === 'kit' && <KitView />}
              {activeDept === 'volunteers' && <VolunteersView onToast={fireToast} />}
              {activeDept === 'travel' && <TravelView onToast={fireToast} />}
              {activeDept === 'documents' && <DocumentsView />}
              {activeDept === 'history' && <HistoryView />}
              {activeDept === 'morning-roundup' && <div className="rounded-xl p-6" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><h2 className="text-lg font-bold mb-2" style={{color:TEXT}}>🌅 Morning Roundup</h2><p className="text-sm" style={{color:TEXT_SEC}}>Your daily inbox — availability, subs, DBS alerts, pitch status, FA FULL-TIME submissions, and weather.</p></div>}
              {activeDept === 'fa-sunday-cup' && <div className="rounded-xl p-6" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><h2 className="text-lg font-bold mb-2" style={{color:TEXT}}>🏆 FA Sunday Cup</h2><p className="text-sm" style={{color:TEXT_SEC}}>FA Sunday Cup R1 — vs Millfield Athletic, Sun 4 May, Riverside Park. Cup run mode, prize money tracker, and draw alerts.</p></div>}
              {activeDept === 'halftime-talk' && <div className="rounded-xl p-6" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><h2 className="text-lg font-bold mb-2" style={{color:TEXT}}>🎤 Halftime Talk Generator</h2><p className="text-sm" style={{color:TEXT_SEC}}>3 taps → 3-point halftime talk via AI → read aloud. Designed for the touchline on your phone.</p></div>}
              {activeDept === 'availability' && <div className="rounded-xl p-6" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><h2 className="text-lg font-bold mb-2" style={{color:TEXT}}>📋 Availability</h2><p className="text-sm" style={{color:TEXT_SEC}}>WhatsApp availability tracker — 13 confirmed, 2 declined, 3 no response for Saturday&apos;s match.</p></div>}
              {activeDept === 'discipline' && <div className="rounded-xl p-6" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><h2 className="text-lg font-bold mb-2" style={{color:TEXT}}>⚠️ Discipline</h2><p className="text-sm" style={{color:TEXT_SEC}}>Yellow and red card tracker, suspensions, and FA discipline record for the season.</p></div>}
              {activeDept === 'dbs-tracker' && <div className="rounded-xl p-6" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><div className="rounded-lg p-3 mb-4" style={{backgroundColor:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)'}}><div className="text-xs font-bold" style={{color:'#EF4444'}}>⚠️ SAFEGUARDING RISK: Dave Nolan and Bob Turner DBS certificates are OVERDUE. They must not have unsupervised access to children until renewed.</div></div><h2 className="text-lg font-bold mb-2" style={{color:TEXT}}>🛡️ DBS Certificate Tracker</h2><div className="space-y-2">{[{name:'Dave Nolan',role:'Manager',expiry:'Mar 2024',status:'🔴 OVERDUE'},{name:'Bob Turner',role:'Treasurer',expiry:'Jan 2025',status:'🔴 OVERDUE'},{name:'Phil Rees',role:'Coach',expiry:'Jun 2026',status:'✅ Valid'},{name:'Sarah Nolan',role:'Welfare',expiry:'Sep 2027',status:'✅ Valid'},{name:'Terry Walsh',role:'Groundsman',expiry:'Nov 2025',status:'🟡 7 months'}].map((p,i)=>(<div key={i} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{backgroundColor:BG,border:`1px solid ${BORDER}`}}><div><div className="text-sm font-bold" style={{color:TEXT}}>{p.name}</div><div className="text-xs" style={{color:TEXT_SEC}}>{p.role} · Expires {p.expiry}</div></div><span className="text-xs font-bold">{p.status}</span></div>))}</div></div>}
              {activeDept === 'subs-tracker' && <div className="rounded-xl p-6" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><h2 className="text-lg font-bold mb-2" style={{color:TEXT}}>💰 Subs Collection</h2><p className="text-sm mb-4" style={{color:TEXT_SEC}}>£620 collected of £720 target · 4 players outstanding · £110 overdue</p><div className="space-y-2">{[{name:'Tommo Jenkins',owed:'£50',weeks:'6 weeks',sev:'🔴'},{name:'Andy Kirby',owed:'£30',weeks:'3 weeks',sev:'🟡'},{name:'Pete Walsh',owed:'£20',weeks:'2 weeks',sev:'🟡'},{name:'Lee Burns',owed:'£10',weeks:'1 week',sev:'🟢'}].map((p,i)=>(<div key={i} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{backgroundColor:BG,border:`1px solid ${BORDER}`}}><div><div className="text-sm font-bold" style={{color:TEXT}}>{p.name}</div><div className="text-xs" style={{color:TEXT_SEC}}>{p.owed} · {p.weeks} overdue</div></div><span>{p.sev}</span></div>))}</div></div>}
              {activeDept === 'juniors' && <div className="rounded-xl p-6" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><h2 className="text-lg font-bold mb-2" style={{color:TEXT}}>🎓 Junior Section</h2><p className="text-sm mb-4" style={{color:TEXT_SEC}}>Sunday Rovers FC Juniors — U12s (14 players) · U14s (12 players)</p><div className="rounded-lg p-3 mb-4" style={{backgroundColor:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)'}}><div className="text-xs" style={{color:'#EF4444'}}>All coaches working with juniors must have a valid Enhanced DBS certificate. Phil Rees ✅ · Sarah Nolan ✅ · Dave Nolan 🔴 OVERDUE — must not coach juniors until renewed.</div></div></div>}
              {activeDept === 'referee-bookings' && <div className="rounded-xl p-6" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><h2 className="text-lg font-bold mb-2" style={{color:TEXT}}>👁️ Referee Bookings</h2><p className="text-sm mb-4" style={{color:TEXT_SEC}}>Upcoming home fixtures with referee status, booking history, and cash reminders.</p><div className="space-y-2">{[{name:'Mike Jenkins',rating:'⭐⭐⭐⭐⭐',status:'✅ Available'},{name:'Dave Pearce',rating:'⭐⭐⭐⭐',status:'✅ Available'},{name:'Steve Cole',rating:'⭐⭐⭐',status:'❓ Unknown'}].map((r,i)=>(<div key={i} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{backgroundColor:BG,border:`1px solid ${BORDER}`}}><div><div className="text-sm font-bold" style={{color:TEXT}}>{r.name}</div><div className="text-xs" style={{color:TEXT_SEC}}>{r.rating}</div></div><span className="text-xs">{r.status}</span></div>))}</div></div>}
              {activeDept === 'player-profiles' && <div className="rounded-xl p-6" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><h2 className="text-lg font-bold mb-2" style={{color:TEXT}}>👤 Player Profiles</h2><p className="text-sm" style={{color:TEXT_SEC}}>Individual player cards with season stats, emergency contacts, DBS status, and subs.</p></div>}
              {activeDept === 'development' && <div className="rounded-xl p-6" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><h2 className="text-lg font-bold mb-2" style={{color:TEXT}}>📈 Development Notes</h2><p className="text-sm" style={{color:TEXT_SEC}}>Private manager notes per player — performance ratings, what improved, what to work on.</p></div>}
              {activeDept === 'league-reg' && <div className="rounded-xl p-6" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><h2 className="text-lg font-bold mb-2" style={{color:TEXT}}>📋 League Registration</h2><p className="text-sm" style={{color:TEXT_SEC}}>FA and league registration status for all players. Westshire Sunday League Division 2.</p></div>}
              {activeDept === 'safeguarding' && <div className="rounded-xl p-6" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><h2 className="text-lg font-bold mb-2" style={{color:TEXT}}>🛡️ Safeguarding</h2><p className="text-sm" style={{color:TEXT_SEC}}>Club safeguarding policy, designated welfare officer (Sarah Nolan), incident log, and parental consent tracker.</p></div>}
              {activeDept === 'preseason' && <div className="rounded-xl p-6" style={{backgroundColor:CARD_BG,border:`1px solid ${BORDER}`}}><h2 className="text-lg font-bold mb-2" style={{color:TEXT}}>⚽ Pre-Season</h2><p className="text-sm" style={{color:TEXT_SEC}}>Pre-season camp tracker — fitness, friendlies, squad readiness, and conditions prep.</p></div>}
              {activeDept === 'settings' && <SettingsView />}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
