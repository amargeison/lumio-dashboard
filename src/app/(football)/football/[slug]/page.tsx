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
  Search, Filter, ArrowUpDown, ExternalLink,
} from 'lucide-react'
import { useElevenLabsTTS as useSpeech } from '@/hooks/useElevenLabsTTS'
import { useFootballVoiceCommands, type FootballCommandResult } from '@/hooks/useFootballVoiceCommands'

// ─── Types ───────────────────────────────────────────────────────────────────

type DeptId =
  | 'overview' | 'squad' | 'tactics' | 'transfers'
  | 'medical' | 'scouting' | 'academy' | 'analytics'
  | 'media' | 'matchday' | 'training' | 'finance'
  | 'staff' | 'facilities' | 'settings'

type OverviewTab = 'today' | 'quick-wins' | 'match-week' | 'insights' | 'dont-miss' | 'staff'

type SidebarSection = null | 'Departments' | 'Tools'

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
  'from-red-950/80 via-rose-900/90 to-red-950',
  'from-rose-950 via-red-950/80 to-rose-900/90',
  'from-red-950 via-rose-950/80 to-red-900/90',
  'from-rose-950/90 via-red-950 to-rose-900/80',
  'from-red-950/80 via-rose-900/90 to-rose-950',
  'from-rose-900/90 via-red-950 to-rose-950/80',
  'from-red-950 via-rose-950/90 to-red-900/80',
]

const SIDEBAR_ITEMS: { id: DeptId; label: string; icon: React.ElementType; section: SidebarSection }[] = [
  { id: 'overview',    label: 'Overview',       icon: Home,           section: null },
  { id: 'squad',       label: 'Squad',          icon: Shirt,          section: 'Departments' },
  { id: 'tactics',     label: 'Tactics',        icon: Clipboard,      section: 'Departments' },
  { id: 'transfers',   label: 'Transfers',      icon: ArrowUpDown,    section: 'Departments' },
  { id: 'medical',     label: 'Medical',        icon: Heart,          section: 'Departments' },
  { id: 'scouting',    label: 'Scouting',       icon: Eye,            section: 'Departments' },
  { id: 'academy',     label: 'Academy',        icon: GraduationCap,  section: 'Departments' },
  { id: 'analytics',   label: 'Analytics',      icon: BarChart3,      section: 'Departments' },
  { id: 'media',       label: 'Media & PR',     icon: Newspaper,      section: 'Departments' },
  { id: 'matchday',    label: 'Match Day',      icon: Trophy,         section: 'Departments' },
  { id: 'training',    label: 'Training',       icon: Activity,       section: 'Tools' },
  { id: 'finance',     label: 'Finance',        icon: DollarSign,     section: 'Tools' },
  { id: 'staff',       label: 'Staff',          icon: Users,          section: 'Tools' },
  { id: 'facilities',  label: 'Facilities',     icon: MapPin,         section: 'Tools' },
  { id: 'settings',    label: 'Settings',       icon: Settings,       section: 'Tools' },
]

// ─── Squad Data ──────────────────────────────────────────────────────────────

type FitnessStatus = 'fit' | 'injured' | 'suspended' | 'modified'

interface Player {
  name: string
  position: string
  nationality: string
  age: number
  contractExpiry: string
  fitness: FitnessStatus
}

const SQUAD: Player[] = [
  { name: 'James Walker', position: 'GK', nationality: 'England', age: 28, contractExpiry: 'Jun 2028', fitness: 'fit' },
  { name: 'Liam Burton', position: 'GK', nationality: 'Scotland', age: 22, contractExpiry: 'Jun 2027', fitness: 'fit' },
  { name: 'Callum Henderson', position: 'RB', nationality: 'England', age: 25, contractExpiry: 'Jun 2027', fitness: 'fit' },
  { name: 'Diego Martinez', position: 'CB', nationality: 'Spain', age: 30, contractExpiry: 'Jun 2026', fitness: 'injured' },
  { name: 'Marcus Cole', position: 'CB', nationality: 'England', age: 27, contractExpiry: 'Jun 2028', fitness: 'fit' },
  { name: 'Jake Phillips', position: 'CB', nationality: 'Wales', age: 24, contractExpiry: 'Jun 2029', fitness: 'fit' },
  { name: 'Tyrone Campbell', position: 'LB', nationality: 'Jamaica', age: 26, contractExpiry: 'Jun 2027', fitness: 'fit' },
  { name: 'Nathan Brooks', position: 'LB', nationality: 'England', age: 21, contractExpiry: 'Jun 2028', fitness: 'fit' },
  { name: 'Ryan Thompson', position: 'CM', nationality: 'England', age: 29, contractExpiry: 'Jun 2026', fitness: 'suspended' },
  { name: 'Kai Nakamura', position: 'CM', nationality: 'Japan', age: 24, contractExpiry: 'Jun 2029', fitness: 'fit' },
  { name: 'Ben Gallagher', position: 'CM', nationality: 'Ireland', age: 27, contractExpiry: 'Jun 2027', fitness: 'fit' },
  { name: 'Omar Hassan', position: 'CM', nationality: 'Egypt', age: 23, contractExpiry: 'Jun 2028', fitness: 'fit' },
  { name: 'Ethan Price', position: 'CAM', nationality: 'England', age: 22, contractExpiry: 'Jun 2029', fitness: 'fit' },
  { name: 'Mateo Silva', position: 'CAM', nationality: 'Brazil', age: 26, contractExpiry: 'Jun 2027', fitness: 'modified' },
  { name: "Sean O'Brien", position: 'LW', nationality: 'Ireland', age: 25, contractExpiry: 'Jun 2028', fitness: 'injured' },
  { name: 'Jayden Clarke', position: 'LW', nationality: 'England', age: 20, contractExpiry: 'Jun 2029', fitness: 'fit' },
  { name: 'Rafa Correia', position: 'RW', nationality: 'Portugal', age: 24, contractExpiry: 'Jun 2028', fitness: 'fit' },
  { name: 'Daniel Foster', position: 'RW', nationality: 'England', age: 23, contractExpiry: 'Jun 2027', fitness: 'fit' },
  { name: 'Lucas Santos', position: 'ST', nationality: 'Brazil', age: 27, contractExpiry: 'Jun 2027', fitness: 'injured' },
  { name: 'Tommy Richards', position: 'ST', nationality: 'England', age: 22, contractExpiry: 'Jun 2029', fitness: 'fit' },
  { name: 'Aiden Murphy', position: 'ST', nationality: 'Ireland', age: 30, contractExpiry: 'Jun 2026', fitness: 'fit' },
  { name: 'Kwame Asante', position: 'CM', nationality: 'Ghana', age: 21, contractExpiry: 'Jun 2030', fitness: 'fit' },
  { name: 'Luka Petrovic', position: 'CB', nationality: 'Serbia', age: 28, contractExpiry: 'Jun 2027', fitness: 'fit' },
  { name: 'Charlie Bennett', position: 'RB', nationality: 'England', age: 19, contractExpiry: 'Jun 2029', fitness: 'fit' },
  { name: 'Isaac Mensah', position: 'LW', nationality: 'Ghana', age: 23, contractExpiry: 'Jun 2028', fitness: 'fit' },
]

const INJURIES = [
  { player: 'Diego Martinez', type: 'Hamstring strain (Grade 2)', expectedReturn: '14 Apr 2026' },
  { player: "Sean O'Brien", type: 'Ankle ligament damage', expectedReturn: '21 Apr 2026' },
  { player: 'Lucas Santos', type: 'Knee cartilage irritation', expectedReturn: '7 Apr 2026' },
]

const TRANSFER_TARGETS = [
  { name: 'Yannick Diallo', position: 'LB', club: 'KRC Genk', age: 22, value: '£1.8m', status: 'Bid submitted' },
  { name: 'Tiago Ferreira', position: 'CM', club: 'SC Braga', age: 24, value: '£1.3m', status: 'Watching' },
]

const FIXTURES = [
  { opponent: 'Riverside United', date: 'Sat 4 Apr', time: '15:00', venue: 'Home', competition: 'League' },
  { opponent: 'Northgate City', date: 'Tue 7 Apr', time: '19:45', venue: 'Away', competition: 'League Cup QF' },
  { opponent: 'Crestwood Athletic', date: 'Sat 11 Apr', time: '15:00', venue: 'Away', competition: 'League' },
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
  const expanded = pinned || hovered

  function togglePin() {
    setPinned(p => { const next = !p; localStorage.setItem('lumio_sidebar_pinned', String(next)); return next })
  }
  function handleMouseEnter() { if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null }; setHovered(true) }
  function handleMouseLeave() { leaveTimer.current = setTimeout(() => setHovered(false), 400) }

  const PRIMARY = '#C0392B'
  const DARK = '#922B21'

  // group items by section
  const sections: { label: SidebarSection; items: typeof SIDEBAR_ITEMS }[] = [
    { label: null, items: SIDEBAR_ITEMS.filter(i => i.section === null) },
    { label: 'Departments', items: SIDEBAR_ITEMS.filter(i => i.section === 'Departments') },
    { label: 'Tools', items: SIDEBAR_ITEMS.filter(i => i.section === 'Tools') },
  ]

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col shrink-0 overflow-hidden"
        style={{ width: expanded ? 208 : 48, backgroundColor: '#0A0B10', borderRight: '1px solid #1F2937', transition: 'width 250ms ease' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center gap-2.5 px-2.5 py-3 shrink-0" style={{ borderBottom: '1px solid #1F2937', minHeight: 52 }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: PRIMARY, color: '#F9FAFB' }}>
            FC
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
        <nav className="flex flex-1 flex-col gap-0.5 px-1.5 py-3 overflow-y-auto">
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
            <nav className="flex flex-1 flex-col gap-0.5 p-3 overflow-y-auto">
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

function PersonalBanner({ clubName, firstName, onVoiceCommand }: {
  clubName: string; firstName?: string; onVoiceCommand?: (cmd: FootballCommandResult) => void
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
      <div className={`relative bg-gradient-to-r ${bg} overflow-hidden rounded-2xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] mx-1`}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)', pointerEvents: 'none', borderRadius: 'inherit' }} />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-red-600 rounded-full opacity-10 blur-3xl" />
        <div className="relative z-10 px-6 py-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-white tracking-tight">{greeting}, {firstName || 'gaffer'} ⚽</h1>
                <button onClick={handleBriefing} title="Morning briefing — squad updates, fixtures, and key items" className="flex items-center justify-center rounded-lg transition-all"
                  style={{ width: 32, height: 32, flexShrink: 0, backgroundColor: isPlaying ? 'rgba(192,57,43,0.25)' : 'rgba(255,255,255,0.08)', border: isPlaying ? '1px solid rgba(192,57,43,0.5)' : '1px solid rgba(255,255,255,0.12)', color: isPlaying ? '#E74C3C' : '#9CA3AF', animation: isPlaying ? 'pulse 1.5s ease-in-out infinite' : 'none' }}>
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
              <p className="text-red-300 text-sm mb-2">{date}</p>
              <p style={{ color: '#F1C40F' }} className="text-sm italic">&ldquo;{quote.text}&rdquo; — {quote.author}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {[
                { label: 'Squad', value: SQUAD.length, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '👥' },
                { label: 'Fit', value: fitCount, color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: '✅' },
                { label: 'Injured', value: injuredCount, color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '🏥' },
                { label: 'Suspended', value: suspendedCount, color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', icon: '🟨' },
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
                  <div className="text-xs text-red-300">{weather.condition}</div>
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
]

function QuickActionsBar({ onAction }: { onAction: (label: string) => void }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-none" style={{ backgroundColor: '#0D0E14', borderBottom: '1px solid #1F2937' }}>
      <span className="text-xs font-semibold shrink-0 mr-1" style={{ color: '#4B5563' }}>Quick actions</span>
      {FOOTBALL_QUICK_ACTIONS.map(a => (
        <button key={a.label} onClick={() => onAction(a.label)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap shrink-0" style={{ backgroundColor: '#922B21', color: '#F9FAFB' }}>
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
            style={{ borderBottomColor: tab === t.id ? '#C0392B' : 'transparent', color: tab === t.id ? '#E74C3C' : '#6B7280', backgroundColor: tab === t.id ? 'rgba(192,57,43,0.05)' : 'transparent' }}>
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
                        <span className="text-xs" style={{ color: '#C0392B' }}>Replied</span>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => setShowReply(showReply === msg.id ? null : msg.id)} className="text-xs px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(192,57,43,0.15)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.3)' }}>Reply</button>
                          <button className="text-xs px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.1)' }}>Forward</button>
                        </div>
                      )}
                      {showReply === msg.id && (
                        <div className="mt-2">
                          <textarea value={replyText[msg.id] || ''} onChange={e => setReplyText(t => ({ ...t, [msg.id]: e.target.value }))} placeholder="Write your reply..." rows={2}
                            className="w-full text-xs rounded-lg p-2 resize-none" style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB', outline: 'none' }} />
                          <div className="flex gap-2 mt-1.5">
                            <button onClick={() => handleReply(msg.id)} className="text-xs px-3 py-1 rounded-lg font-semibold" style={{ backgroundColor: '#C0392B', color: '#fff' }}>Send</button>
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
          <div key={i} className="rounded-xl p-4" style={{ backgroundColor: i === 0 ? 'rgba(192,57,43,0.08)' : 'rgba(255,255,255,0.02)', border: i === 0 ? '1px solid rgba(192,57,43,0.25)' : '1px solid #1F2937' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {i === 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                <span className="text-sm font-bold" style={{ color: i === 0 ? '#E74C3C' : '#F9FAFB' }}>{f.opponent}</span>
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
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop',
]

function PhotoFrame() {
  const [photos] = useState<string[]>(DEMO_PHOTOS)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlayingSlideshow, setIsPlayingSlideshow] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isPlayingSlideshow && photos.length > 1) {
      intervalRef.current = setInterval(() => setCurrentIdx(i => (i + 1) % photos.length), 5000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlayingSlideshow, photos.length])

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minHeight: 200 }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🖼️</span>
          <span className="font-bold text-sm" style={{ color: '#F9FAFB' }}>Photo Frame</span>
        </div>
        {photos.length > 1 && (
          <button onClick={() => setIsPlayingSlideshow(p => !p)} className="text-xs px-2 py-1 rounded-lg"
            style={{ backgroundColor: isPlayingSlideshow ? 'rgba(192,57,43,0.15)' : 'rgba(255,255,255,0.05)', color: isPlayingSlideshow ? '#C0392B' : '#6B7280', border: `1px solid ${isPlayingSlideshow ? 'rgba(192,57,43,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
            {isPlayingSlideshow ? 'Pause' : 'Play'}
          </button>
        )}
      </div>
      <div className="flex-1 relative mx-4 mb-4 rounded-xl overflow-hidden" style={{ minHeight: 140 }}>
        <img src={photos[currentIdx]} alt="Photo frame" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, transition: 'opacity 0.5s ease' }} />
        {photos.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.map((_, i) => (
              <button key={i} onClick={() => setCurrentIdx(i)}
                style={{ width: i === currentIdx ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === currentIdx ? '#C0392B' : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }} />
            ))}
          </div>
        )}
      </div>
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
    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #C0392B' }}>
      <button className="flex w-full items-center justify-between px-5 py-4" style={{ backgroundColor: 'rgba(192,57,43,0.08)', borderBottom: open ? '1px solid rgba(192,57,43,0.3)' : undefined }} onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: '#C0392B' }} />
          <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Morning Summary</span>
          <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'rgba(192,57,43,0.2)', color: '#E74C3C' }}>{dayLabel}</span>
        </div>
        {open ? <ChevronUp size={14} style={{ color: '#C0392B' }} /> : <ChevronDown size={14} style={{ color: '#C0392B' }} />}
      </button>
      {open && (
        <div className="flex flex-col gap-3 p-5 overflow-y-auto" style={{ backgroundColor: '#0f0e17', maxHeight: '12rem' }}>
          {MORNING_HIGHLIGHTS_FOOTBALL.map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(192,57,43,0.2)', color: '#E74C3C' }}>{i + 1}</span>
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
    RUNNING: { label: 'RUNNING', color: '#C0392B', bg: 'rgba(192,57,43,0.12)', Icon: Loader2 },
    ACTION: { label: 'ACTION', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', Icon: AlertCircle },
  }[status]
  return <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold" style={{ color: cfg.color, backgroundColor: cfg.bg }}><cfg.Icon size={11} /> {cfg.label}</span>
}

// ─── Tab Content Placeholder ────────────────────────────────────────────────

function TabPlaceholder({ tab }: { tab: OverviewTab }) {
  const labels: Record<OverviewTab, { title: string; icon: string; desc: string }> = {
    'today': { title: 'Today', icon: '🏠', desc: '' },
    'quick-wins': { title: 'Quick Wins', icon: '⚡', desc: 'Your highest-impact actions today — team sheet, press prep, key calls.' },
    'match-week': { title: 'Match Week', icon: '⚽', desc: 'Full match-week planner with fixtures, training schedule, and team news.' },
    'insights': { title: 'Insights', icon: '📊', desc: 'AI-powered performance data, xG analysis, and squad fitness trends.' },
    'dont-miss': { title: "Don't Miss", icon: '🔴', desc: 'Critical items: contract deadlines, injury returns, transfer windows.' },
    'staff': { title: 'Staff', icon: '👥', desc: 'Coaching team availability, meeting schedules, and staff updates.' },
  }
  const { title, icon, desc } = labels[tab]
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-3xl" style={{ backgroundColor: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.2)' }}>{icon}</div>
      <h3 className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>{title}</h3>
      <p className="text-sm max-w-xs" style={{ color: '#9CA3AF' }}>{desc || 'Coming soon.'}</p>
    </div>
  )
}

// ─── Overview View ──────────────────────────────────────────────────────────

function OverviewView({ clubName, firstName, onAction }: { clubName: string; firstName?: string; onAction: (msg: string) => void }) {
  const [tab, setTab] = useState<OverviewTab>('today')

  function handleVoiceCommand(cmd: FootballCommandResult) {
    onAction(cmd.response)
  }

  return (
    <div className="space-y-4">
      <PersonalBanner clubName={clubName} firstName={firstName} onVoiceCommand={handleVoiceCommand} />
      <TabBar tab={tab} onChange={setTab} />

      {tab === 'today' ? (
        <div className="space-y-4">
          <QuickActionsBar onAction={onAction} />

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
                <StatCard label="Squad Size" value={String(SQUAD.length)} icon={Users} color="#C0392B" />
                <StatCard label="Fit Players" value={String(SQUAD.filter(p => p.fitness === 'fit').length)} icon={CheckCircle2} color="#22C55E" />
                <StatCard label="Transfer Budget" value="£4.2m" icon={DollarSign} color="#F59E0B" />
                <StatCard label="Next Match" value={FIXTURES[0]?.date.split(' ')[1] || '--'} icon={Calendar} color="#3B82F6" />
              </div>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Workflow Activity</p>
                  <span className="text-xs" style={{ color: '#C0392B' }}>Live</span>
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
            </div>
          </div>
        </div>
      ) : (
        <TabPlaceholder tab={tab} />
      )}
    </div>
  )
}

// ─── Placeholder Department View ────────────────────────────────────────────

function PlaceholderView({ title, subtitle, stats, highlights, actionButtons, children }: {
  title: string
  subtitle: string
  stats: { label: string; value: string; icon: React.ElementType; color: string }[]
  highlights: string[]
  actionButtons?: { label: string; icon: React.ElementType }[]
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>{title}</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <StatCard key={i} label={s.label} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #C0392B' }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ backgroundColor: 'rgba(192,57,43,0.08)', borderBottom: '1px solid rgba(192,57,43,0.3)' }}>
          <Sparkles size={14} style={{ color: '#C0392B' }} />
          <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
        </div>
        <div className="flex flex-col gap-3 p-5" style={{ backgroundColor: '#0f0e17' }}>
          {highlights.map((h, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(192,57,43,0.2)', color: '#E74C3C' }}>{i + 1}</span>
              <p className="text-xs leading-relaxed" style={{ color: '#FCA5A5' }}>{h}</p>
            </div>
          ))}
        </div>
      </div>

      {actionButtons && actionButtons.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {actionButtons.map((a, i) => (
            <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: '#922B21', color: '#F9FAFB' }}>
              <a.icon size={12} />{a.label}
            </button>
          ))}
        </div>
      )}

      {children && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Squad View ─────────────────────────────────────────────────────────────

function SquadView() {
  return (
    <PlaceholderView
      title="Squad Management"
      subtitle="Full squad overview, contracts, fitness, and availability."
      stats={[
        { label: 'Squad Size', value: String(SQUAD.length), icon: Users, color: '#C0392B' },
        { label: 'Fit', value: String(SQUAD.filter(p => p.fitness === 'fit').length), icon: CheckCircle2, color: '#22C55E' },
        { label: 'Injured', value: String(SQUAD.filter(p => p.fitness === 'injured').length), icon: Heart, color: '#EF4444' },
        { label: 'Avg Age', value: String(Math.round(SQUAD.reduce((s, p) => s + p.age, 0) / SQUAD.length)), icon: Users, color: '#3B82F6' },
      ]}
      highlights={[
        'Martinez, O\'Brien, and Santos are currently injured. Santos closest to return.',
        'Thompson suspended for 1 match (accumulation of yellows).',
        '4 contracts expiring June 2026 — Martinez renewal is highest priority.',
        'Average squad age is 24.5 — one of the youngest in the division.',
        'Silva on modified training — light contact only until assessment Thursday.',
      ]}
      actionButtons={[
        { label: 'Team Sheet Builder', icon: Clipboard },
        { label: 'Contract Manager', icon: FileText },
        { label: 'Log Injury', icon: Heart },
      ]}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Full Squad</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937' }}>
              {['Player', 'Pos', 'Nationality', 'Age', 'Contract', 'Status'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-semibold" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SQUAD.map((p, i) => (
              <tr key={i} style={{ borderBottom: i < SQUAD.length - 1 ? '1px solid #1F2937' : undefined }}>
                <td className="px-5 py-2.5 font-medium" style={{ color: '#F9FAFB' }}>{p.name}</td>
                <td className="px-5 py-2.5" style={{ color: '#9CA3AF' }}>{p.position}</td>
                <td className="px-5 py-2.5" style={{ color: '#9CA3AF' }}>{p.nationality}</td>
                <td className="px-5 py-2.5" style={{ color: '#9CA3AF' }}>{p.age}</td>
                <td className="px-5 py-2.5" style={{ color: p.contractExpiry === 'Jun 2026' ? '#F59E0B' : '#9CA3AF' }}>{p.contractExpiry}</td>
                <td className="px-5 py-2.5"><FitnessBadge status={p.fitness} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlaceholderView>
  )
}

// ─── Tactics View ───────────────────────────────────────────────────────────

function TacticsView() {
  return (
    <PlaceholderView
      title="Tactics & Formation"
      subtitle="Formation planner, set pieces, and opposition analysis."
      stats={[
        { label: 'Current Formation', value: '4-2-3-1', icon: Clipboard, color: '#C0392B' },
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
      ]}
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

function TransfersView() {
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
        { label: 'Active Targets', value: '2', icon: Target, color: '#C0392B' },
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
                  backgroundColor: isActive ? 'rgba(192,57,43,0.15)' : isComplete ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                  color: isActive ? '#E74C3C' : isComplete ? '#22C55E' : '#6B7280',
                  border: isActive ? '1px solid rgba(192,57,43,0.3)' : '1px solid transparent',
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
            <button onClick={() => setResearchStep(2)} className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: '#C0392B', color: '#fff' }}>
              Start Research →
            </button>
          </div>
        )}

        {researchStep === 2 && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 size={28} className="animate-spin" style={{ color: '#C0392B' }} />
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
            <button onClick={() => setResearchStep(3)} className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: '#922B21', color: '#fff' }}>
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
            <button onClick={() => setResearchStep(4)} className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: '#C0392B', color: '#fff' }}>
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
                { label: 'Add to Shortlist', desc: 'Save to your transfer shortlist for board review', icon: Star, color: '#C0392B' },
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
  return (
    <PlaceholderView
      title="Medical Centre"
      subtitle="Injury tracking, rehabilitation, and fitness monitoring."
      stats={[
        { label: 'Currently Injured', value: String(INJURIES.length), icon: Heart, color: '#EF4444' },
        { label: 'Modified Training', value: '1', icon: Activity, color: '#06B6D4' },
        { label: 'Full Recovery (7d)', value: '1', icon: CheckCircle2, color: '#22C55E' },
        { label: 'Season Injuries', value: '9', icon: AlertCircle, color: '#F59E0B' },
      ]}
      highlights={[
        'Santos (knee) cleared for light training — expected return 7 Apr.',
        'Martinez (hamstring Grade 2) — jogging resumed. Target: 14 Apr.',
        'O\'Brien (ankle ligament) still in boot. Earliest return: 21 Apr.',
        'Silva on modified programme — light contact only until Thursday assessment.',
        'Overall squad injury rate this season: 3.2%. League average: 4.1%.',
      ]}
      actionButtons={[
        { label: 'Log Injury', icon: Heart },
        { label: 'Rehab Plan', icon: Activity },
        { label: 'Fitness Report', icon: FileText },
      ]}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Current Injuries</p>
      </div>
      {INJURIES.map((inj, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: i < INJURIES.length - 1 ? '1px solid #1F2937' : undefined }}>
          <div>
            <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{inj.player}</p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{inj.type}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold" style={{ color: '#F59E0B' }}>Expected: {inj.expectedReturn}</p>
          </div>
        </div>
      ))}
    </PlaceholderView>
  )
}

// ─── Scouting View ──────────────────────────────────────────────────────────

function ScoutingView() {
  return (
    <PlaceholderView
      title="Scouting Network"
      subtitle="Scout reports, watchlists, and recruitment pipeline."
      stats={[
        { label: 'Scouts Active', value: '4', icon: Eye, color: '#C0392B' },
        { label: 'Reports This Month', value: '12', icon: FileText, color: '#3B82F6' },
        { label: 'Watchlist', value: '8', icon: Star, color: '#F59E0B' },
        { label: 'Leagues Covered', value: '6', icon: MapPin, color: '#22C55E' },
      ]}
      highlights={[
        '12 scout reports submitted this month. 3 players recommended for further analysis.',
        'Belgian Pro League scout identified 2 potential targets under £1m.',
        'Video analysis backlog: 4 reports queued, 2 in progress.',
        'Next scouting trip: Eredivisie — Ajax U21 vs PSV U21 on Friday.',
      ]}
      actionButtons={[
        { label: 'New Report', icon: FileText },
        { label: 'Watchlist', icon: Star },
        { label: 'Trip Planner', icon: MapPin },
      ]}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Recent Scout Reports</p>
      </div>
      {[
        { player: 'Yannick Diallo', scout: 'Mark Evans', league: 'Belgian Pro League', rating: 'A', date: '25 Mar' },
        { player: 'Tiago Ferreira', scout: 'Carlos Mendes', league: 'Primeira Liga', rating: 'B+', date: '22 Mar' },
        { player: 'Andrei Popescu', scout: 'Mark Evans', league: 'Liga I', rating: 'B', date: '20 Mar' },
        { player: 'Sander de Vries', scout: 'Jan Bakker', league: 'Eredivisie', rating: 'B-', date: '18 Mar' },
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
    </PlaceholderView>
  )
}

// ─── Academy View ───────────────────────────────────────────────────────────

function AcademyView() {
  return (
    <PlaceholderView
      title="Academy"
      subtitle="Youth development, scholarships, and first-team pathway."
      stats={[
        { label: 'Academy Players', value: '42', icon: GraduationCap, color: '#F97316' },
        { label: 'U21 Record', value: 'W8 D2 L1', icon: Trophy, color: '#22C55E' },
        { label: 'First-Team Ready', value: '3', icon: Star, color: '#C0392B' },
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
      ]}
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

// ─── Generic Dept Views ─────────────────────────────────────────────────────

function AnalyticsView() {
  return (
    <PlaceholderView
      title="Performance Analytics"
      subtitle="xG, pass maps, heat maps, and AI-powered match analysis."
      stats={[
        { label: 'xG (Season)', value: '42.6', icon: BarChart3, color: '#C0392B' },
        { label: 'xGA (Season)', value: '28.3', icon: Shield, color: '#3B82F6' },
        { label: 'Possession Avg', value: '58%', icon: Activity, color: '#22C55E' },
        { label: 'Pass Accuracy', value: '84%', icon: Target, color: '#F59E0B' },
      ]}
      highlights={[
        'xG overperformance of +5.4 this season — expect regression if finishing doesn\'t maintain.',
        'Right-side attacks account for 43% of all chances created (Correia influence).',
        'Defensive shape weakest in minutes 60-75 — conceded 38% of goals in this window.',
        'Pressing intensity dropped 12% in away games — fitness or tactical?',
      ]}
      actionButtons={[
        { label: 'Match Report', icon: FileText },
        { label: 'Player Comparison', icon: Users },
        { label: 'Heat Maps', icon: BarChart3 },
        { label: 'Video Clips', icon: Video },
      ]}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Last 5 Matches — Key Metrics</p>
      </div>
      {[
        { match: 'Oakridge 2-1 Riverside', xg: '1.8', xga: '0.9', poss: '62%', date: '22 Mar' },
        { match: 'Ashford 0-0 Oakridge', xg: '0.4', xga: '1.1', poss: '47%', date: '15 Mar' },
        { match: 'Oakridge 3-2 Millfield', xg: '2.4', xga: '1.6', poss: '55%', date: '8 Mar' },
        { match: 'Crestwood 1-2 Oakridge', xg: '1.9', xga: '1.2', poss: '51%', date: '1 Mar' },
        { match: 'Oakridge 1-0 Lakeside', xg: '1.1', xga: '0.7', poss: '59%', date: '22 Feb' },
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
    </PlaceholderView>
  )
}

function MediaView() {
  return (
    <PlaceholderView
      title="Media & PR"
      subtitle="Press conferences, media requests, and public relations."
      stats={[
        { label: 'Press Conf Today', value: '2pm', icon: Newspaper, color: '#8B5CF6' },
        { label: 'Media Requests', value: '4', icon: MessageSquare, color: '#3B82F6' },
        { label: 'Social Followers', value: '124k', icon: Users, color: '#C0392B' },
        { label: 'Press Coverage', value: '+12%', icon: TrendingUp, color: '#22C55E' },
      ]}
      highlights={[
        'Pre-match press conference at 2pm — AI briefing notes prepared.',
        'Sky Sports asking about Diallo transfer — recommended: no comment.',
        'BBC Sport requesting 15-minute pre-match interview for Thursday.',
        'Social media engagement up 18% following last match result.',
      ]}
      actionButtons={[
        { label: 'Press Brief', icon: FileText },
        { label: 'Social Post', icon: MessageSquare },
        { label: 'Media Schedule', icon: Calendar },
      ]}
    />
  )
}

function MatchdayView() {
  return (
    <PlaceholderView
      title="Match Day Operations"
      subtitle="Matchday logistics, team sheet, and operational checklists."
      stats={[
        { label: 'Next Match', value: 'Sat 4 Apr', icon: Calendar, color: '#C0392B' },
        { label: 'Kick Off', value: '15:00', icon: Clock, color: '#3B82F6' },
        { label: 'Expected Attendance', value: '8,200', icon: Users, color: '#22C55E' },
        { label: 'Matchday Revenue', value: '£42k', icon: DollarSign, color: '#F59E0B' },
      ]}
      highlights={[
        'Riverside United at home, Saturday 3pm. Team sheet needed by Thursday 5pm.',
        'Expected attendance: 8,200 — corporate hospitality at 94% capacity.',
        'Matchday operations checklist: 14 of 22 items completed.',
        'Pitch condition rated excellent following maintenance on Tuesday.',
      ]}
      actionButtons={[
        { label: 'Team Sheet', icon: Clipboard },
        { label: 'Operations Checklist', icon: CheckCircle2 },
        { label: 'Ticketing', icon: FileText },
      ]}
    />
  )
}

function TrainingView() {
  return (
    <PlaceholderView
      title="Training"
      subtitle="Session planning, load monitoring, and recovery schedules."
      stats={[
        { label: 'Today\'s Session', value: '10:00', icon: Clock, color: '#C0392B' },
        { label: 'Session Type', value: 'Tactical', icon: Clipboard, color: '#3B82F6' },
        { label: 'Avg Load (7d)', value: '72%', icon: Activity, color: '#22C55E' },
        { label: 'Recovery Group', value: '3', icon: Heart, color: '#F59E0B' },
      ]}
      highlights={[
        'Tactical session at 10am — focus on pressing triggers for Saturday.',
        'Set pieces at 11:30 — corner and free-kick routines.',
        'Recovery group (Martinez, O\'Brien, Santos) in the gym from 9am.',
        'Silva light contact only — reassess Thursday.',
        'Average squad training load at 72% of max — recovery day planned for Friday.',
      ]}
      actionButtons={[
        { label: 'Session Plan', icon: Clipboard },
        { label: 'Load Report', icon: BarChart3 },
        { label: 'Recovery Schedule', icon: Heart },
      ]}
    />
  )
}

function FinanceView() {
  return (
    <PlaceholderView
      title="Club Finance"
      subtitle="Revenue, expenditure, wage bill, and transfer budgets."
      stats={[
        { label: 'Transfer Budget', value: '£4.2m', icon: DollarSign, color: '#22C55E' },
        { label: 'Wage Bill', value: '£2.1m/yr', icon: Users, color: '#C0392B' },
        { label: 'Revenue (YTD)', value: '£3.4m', icon: TrendingUp, color: '#3B82F6' },
        { label: 'Wage/Rev Ratio', value: '62%', icon: BarChart3, color: '#F59E0B' },
      ]}
      highlights={[
        'Wage bill at 62% of revenue — board target is 60%. Needs attention before renewals.',
        'Transfer budget: £4.2m remaining (board approved extra £500k today).',
        'Matchday revenue up 8% YoY — corporate hospitality driving growth.',
        'Youth development grants confirmed: £180k for 2026/27 season.',
      ]}
      actionButtons={[
        { label: 'Budget Overview', icon: DollarSign },
        { label: 'Wage Report', icon: FileText },
        { label: 'Revenue Dashboard', icon: BarChart3 },
      ]}
    />
  )
}

function StaffView() {
  return (
    <PlaceholderView
      title="Staff Management"
      subtitle="Coaching staff, medical team, and administrative personnel."
      stats={[
        { label: 'Coaching Staff', value: '8', icon: Users, color: '#C0392B' },
        { label: 'Medical Team', value: '4', icon: Heart, color: '#22C55E' },
        { label: 'Scouts', value: '4', icon: Eye, color: '#3B82F6' },
        { label: 'Total Staff', value: '32', icon: Briefcase, color: '#F59E0B' },
      ]}
      highlights={[
        '8 coaching staff confirmed for Saturday. GK coach at UEFA Pro Licence course Mon-Wed.',
        'Head Physio holiday approved for 14-18 Apr — cover arranged.',
        'New performance analyst starts Monday. IT setup in progress.',
        'Annual staff performance reviews due by end of April.',
      ]}
      actionButtons={[
        { label: 'Staff Directory', icon: Users },
        { label: 'Leave Calendar', icon: Calendar },
        { label: 'Recruitment', icon: UserPlus },
      ]}
    />
  )
}

function FacilitiesView() {
  return (
    <PlaceholderView
      title="Facilities"
      subtitle="Stadium, training ground, and infrastructure management."
      stats={[
        { label: 'Pitch Condition', value: 'Excellent', icon: CheckCircle2, color: '#22C55E' },
        { label: 'Capacity', value: '12,000', icon: Users, color: '#3B82F6' },
        { label: 'Training Pitches', value: '4', icon: MapPin, color: '#C0392B' },
        { label: 'Next Maintenance', value: 'Thu', icon: Calendar, color: '#F59E0B' },
      ]}
      highlights={[
        'Main pitch re-seeded Tuesday. Rated excellent condition for Saturday.',
        'Training ground pitch 2 waterlogged — sessions moved to pitch 3.',
        'CCTV system upgrade scheduled for next week — minimal disruption.',
        'Floodlight inspection completed — all operational.',
      ]}
      actionButtons={[
        { label: 'Pitch Report', icon: FileText },
        { label: 'Maintenance Log', icon: Clipboard },
        { label: 'Booking Schedule', icon: Calendar },
      ]}
    />
  )
}

// ─── Settings View ──────────────────────────────────────────────────────────

const VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', desc: 'Warm & clear — your daily motivator' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', desc: 'Calm & deep — reassuring and steady' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', desc: 'Bright & energetic — upbeat and clear' },
]

function SettingsView() {
  const [ttsOn, setTtsOn] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_tts_enabled') !== 'false' : true)
  const [vcOn, setVcOn] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_voice_commands_enabled') !== 'false' : true)
  const [activeVoice, setActiveVoice] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_tts_voice') || '21m00Tcm4TlvDq8ikWAM' : '21m00Tcm4TlvDq8ikWAM')
  const [zones, setZones] = useState(getStoredZones)
  const localTz = getUserLocalTz()

  function ToggleButton({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
      <button onClick={onToggle} className="flex-shrink-0" style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: on ? '#C0392B' : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer', position: 'relative' }}>
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
                className="rounded-xl p-4 text-left transition-colors" style={{ backgroundColor: '#0A0B10', border: isActive ? '1px solid #C0392B' : '1px solid #1F2937' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{voice.name}</p>
                  {isActive && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(192,57,43,0.15)', color: '#C0392B' }}>Active</span>}
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
                    backgroundColor: isSelected ? 'rgba(192,57,43,0.08)' : '#0A0B10',
                    border: isSelected ? '1px solid rgba(192,57,43,0.3)' : '1px solid #1F2937',
                    opacity: !isSelected && zones.length >= 4 ? 0.4 : 1,
                    cursor: !isSelected && zones.length >= 4 ? 'not-allowed' : 'pointer',
                  }}>
                  <span className="text-sm" style={{ color: isSelected ? '#C0392B' : '#9CA3AF' }}>{zone.label}</span>
                  {isSelected && <span style={{ color: '#C0392B' }}>✓</span>}
                </button>
              )
            })}
          </div>
          <p className="text-xs" style={{ color: '#6B7280' }}>{zones.length}/4 selected</p>
        </div>
      </div>
    </div>
  )
}

// ─── Toast ──────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: '#C0392B', color: '#F9FAFB' }}>
      {message}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function FootballDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [activeDept, setActiveDept] = useState<DeptId>('overview')
  const [clubName, setClubName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('football_club_name') || 'Oakridge FC'
    }
    return 'Oakridge FC'
  })
  const [userName, setUserName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('football_user_name') || localStorage.getItem('workspace_user_name') || ''
    }
    return ''
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function fireToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const name = localStorage.getItem('football_club_name') || 'Oakridge FC'
    const user = localStorage.getItem('football_user_name') || localStorage.getItem('workspace_user_name') || ''
    setClubName(name)
    setUserName(user)
  }, [slug])

  const deptLabel = SIDEBAR_ITEMS.find(d => d.id === activeDept)?.label || 'Overview'
  const initials = userName ? userName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'FC'

  return (
    <div className="flex flex-col" style={{ backgroundColor: '#07080F', color: '#F9FAFB', height: '100vh', overflow: 'hidden' }}>
      <Toast message={toast} />

      {/* Top-right avatar */}
      <div style={{ position: 'fixed', top: 12, right: 20, zIndex: 60, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button title="Notifications" style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
          <Bell size={16} strokeWidth={1.75} />
          <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EF4444', fontSize: 6, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>3</span>
        </button>
        <button style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#C0392B', border: 'none', color: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          {initials}
        </button>
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-bold">{deptLabel}</h1>
                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Club: <span style={{ color: '#F9FAFB' }}>{clubName}</span></p>
              </div>
            </div>

            {activeDept === 'overview' && <OverviewView clubName={clubName} firstName={userName ? userName.split(' ')[0] : undefined} onAction={fireToast} />}
            {activeDept === 'squad' && <SquadView />}
            {activeDept === 'tactics' && <TacticsView />}
            {activeDept === 'transfers' && <TransfersView />}
            {activeDept === 'medical' && <MedicalView />}
            {activeDept === 'scouting' && <ScoutingView />}
            {activeDept === 'academy' && <AcademyView />}
            {activeDept === 'analytics' && <AnalyticsView />}
            {activeDept === 'media' && <MediaView />}
            {activeDept === 'matchday' && <MatchdayView />}
            {activeDept === 'training' && <TrainingView />}
            {activeDept === 'finance' && <FinanceView />}
            {activeDept === 'staff' && <StaffView />}
            {activeDept === 'facilities' && <FacilitiesView />}
            {activeDept === 'settings' && <SettingsView />}
          </main>
        </div>
      </div>
    </div>
  )
}
