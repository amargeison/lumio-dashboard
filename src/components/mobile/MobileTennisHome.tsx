'use client'
import React, { useMemo } from 'react'
import type { SportsDemoSession } from '@/components/sports-demo'
import { getDailyQuote, TENNIS_QUOTES } from '@/lib/sports-quotes'
import { MobileTopBar } from './tennis/MobileTopBar'
import { MobileHero, type MobileHeroStat, type MobileHeroClock, type MobileHeroWeather } from './tennis/MobileHero'
import { MobileMatchCard } from './tennis/MobileMatchCard'
import { MobileQuickActions, type MobileQuickAction } from './tennis/MobileQuickActions'
import { MobileRoundupStrip, type MobileRoundupChannel } from './tennis/MobileRoundupStrip'
import { MobileSponsorAlert } from './tennis/MobileSponsorAlert'
import { MobilePerformanceIntel } from './tennis/MobilePerformanceIntel'
import { useMobileLayout } from './MobileLayoutContext'

export type MobileTennisPlayerLike = {
  ranking?: number | null
  race_ranking?: number | null
  ranking_points?: number | null
  career_high?: number | null
}

export type MobileTennisHomeProps = {
  session: SportsDemoSession
  player: MobileTennisPlayerLike
  onNavigate: (sectionId: string) => void
  roundupCount?: number
}

function partOfDay(hour: number): string {
  if (hour < 5) return 'Up early'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Still up'
}

function dateLabel(now: Date): string {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${days[now.getDay()]} · ${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} · R16`
}

function firstNameFrom(name?: string | null, fallback = 'Alex'): string {
  if (!name) return fallback
  const first = name.trim().split(/\s+/)[0]
  return first || fallback
}

function initialsFrom(name?: string | null, fallback = 'AR'): string {
  if (!name) return fallback
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? '').concat(parts[1]?.[0] ?? '').toUpperCase() || fallback
}

function formatTzTime(now: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(now)
  } catch {
    return ''
  }
}

export function MobileTennisHome({
  session,
  player,
  onNavigate,
  roundupCount = 18,
}: MobileTennisHomeProps) {
  const { openMore } = useMobileLayout()
  const now = useMemo(() => new Date(), [])
  const hour = now.getHours()
  const greeting = partOfDay(hour)
  const firstName = firstNameFrom(session.userName)
  const avatarInitials = initialsFrom(session.userName)

  const quote = getDailyQuote(TENNIS_QUOTES)

  const stats: MobileHeroStat[] = [
    { label: 'ATP',    value: `#${player.ranking ?? 67}`,                         tint: 'violet' },
    { label: 'Race',   value: `#${player.race_ranking ?? 54}`,                    tint: 'violet' },
    { label: 'Points', value: (player.ranking_points ?? 1847).toLocaleString(),   tint: 'white'  },
    { label: 'Best',   value: `#${player.career_high ?? 44}`,                     tint: 'yellow' },
  ]

  const weather: MobileHeroWeather = { icon: '☀️', temp: '13°', city: 'Monaco' }
  const clocks: MobileHeroClock[] = [
    { city: 'LON', time: formatTzTime(now, 'Europe/London') || '12:58' },
    { city: 'DXB', time: formatTzTime(now, 'Asia/Dubai')    || '15:58' },
    { city: 'TOK', time: formatTzTime(now, 'Asia/Tokyo')    || '20:58' },
  ]

  const quickActions: MobileQuickAction[] = [
    { id: 'send',      icon: '💬', label: 'Send Message',    onPress: () => onNavigate('teamcomms'),  active: true },
    { id: 'matchprep', icon: '🎯', label: 'Match Prep AI',   onPress: () => onNavigate('matchprep') },
    { id: 'injury',    icon: '⚕️', label: 'Log Injury',      onPress: () => onNavigate('physio') },
    { id: 'warmup',    icon: '⏱️', label: 'Warm-up Timer',   onPress: () => onNavigate('matchprep') },
    { id: 'book',      icon: '📅', label: 'Book Practice',   onPress: () => onNavigate('courtbooking') },
    { id: 'press',     icon: '📰', label: 'Press Statement', onPress: () => onNavigate('media') },
    { id: 'ranksim',   icon: '📈', label: 'Ranking Sim',     onPress: () => onNavigate('forecaster') },
    { id: 'string',    icon: '🎾', label: 'String Order',    onPress: () => onNavigate('racket') },
  ]

  const roundupChannels: MobileRoundupChannel[] = [
    { id: 'agent',     label: 'Agent',              icon: '✉', count: 2, color: 'rgb(168, 85, 247)' },
    { id: 'tournament', label: 'Tournament',        icon: '⚡', count: 3, color: 'rgb(245, 158, 11)', urgent: 1 },
    { id: 'sponsor',   label: 'Media & Sponsor',    icon: '◉', count: 4, color: 'rgb(96, 165, 250)' },
    { id: 'physio',    label: 'Physio & Medical',   icon: '✚', count: 1, color: 'rgb(239, 68, 68)', urgent: 1 },
    { id: 'coach',     label: 'Coach',              icon: '◆', count: 2, color: 'rgb(16, 185, 129)' },
    { id: 'prize',     label: 'Prize Money',        icon: '$', count: 1, color: 'rgb(34, 211, 238)' },
    { id: 'travel',    label: 'Travel & Logistics', icon: '✈', count: 3, color: 'rgb(236, 72, 153)' },
    { id: 'wildcard',  label: 'Wildcard',           icon: '★', count: 2, color: 'rgb(217, 70, 239)' },
  ]

  const totalRoundup = roundupChannels.reduce((sum, c) => sum + c.count, 0)
  const derivedRoundupCount = roundupCount ?? totalRoundup

  return (
    <div className="w-full">
      <MobileTopBar
        subtitle="TENNIS · MONTE-CARLO"
        photoUrl={session.photoDataUrl ?? null}
        initials={avatarInitials}
        onSearch={openMore}
        onBell={() => onNavigate('morning')}
        onAvatar={() => onNavigate('settings')}
      />

      <MobileHero
        dateLabel={dateLabel(now)}
        greeting={greeting}
        firstName={firstName}
        quote={quote.text}
        quoteAuthor={quote.author.toUpperCase()}
        stats={stats}
        weather={weather}
        clocks={clocks}
      />

      <MobileQuickActions
        total={18}
        actions={quickActions}
        onAll={openMore}
      />

      <MobileMatchCard
        whenLabel="Today 13:00"
        eventLabel="ATP Monte-Carlo"
        roundLabel="R16"
        metaLabel="Clay · H2H 3–1"
        home={{ initials: avatarInitials, name: firstName, rank: `ATP #${player.ranking ?? 67}` }}
        away={{ initials: 'CV', name: 'C. Vitelli', rank: 'ATP #41' }}
        onPrep={() => onNavigate('matchprep')}
        onTactics={() => onNavigate('scout')}
      />

      <MobileRoundupStrip
        totalCount={derivedRoundupCount}
        sinceLabel="06:00"
        channels={roundupChannels}
        onOpen={() => onNavigate('morning')}
        onChannel={() => onNavigate('morning')}
      />

      <MobileSponsorAlert
        dueLabel="Due 12:00"
        message="Meridian Watches content past due — Carlos needs kit photo before 12:00."
        onPress={() => onNavigate('sponsorship')}
      />

      <MobilePerformanceIntel
        timestampLabel="AI · 12:58"
        body={<>
          Serve % up to <span style={{ color: 'var(--green)', fontWeight: 700 }}>84%</span> in last 5 matches
          <span style={{ color: 'var(--text-muted)' }}> — above season avg (65%). Clay kick serve landing 12cm deeper.</span>
        </>}
        onPress={() => onNavigate('performance')}
      />
    </div>
  )
}
