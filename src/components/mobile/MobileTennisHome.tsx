'use client'
import React, { useEffect, useMemo, useState } from 'react'
import type { SportsDemoSession } from '@/components/sports-demo'
import { getDailyQuote, TENNIS_QUOTES } from '@/lib/sports-quotes'
import { MobileTopBar } from './tennis/MobileTopBar'
import { MobileHero, type MobileHeroStat, type MobileHeroClock, type MobileHeroWeather } from './tennis/MobileHero'
import { MobileMatchCard } from './tennis/MobileMatchCard'
import { MobileQuickActions, type MobileQuickAction } from './tennis/MobileQuickActions'
import { MobileRoundupStrip, type MobileRoundupChannel } from './tennis/MobileRoundupStrip'
import { MobileSponsorAlert } from './tennis/MobileSponsorAlert'
import { MobilePerformanceIntel } from './tennis/MobilePerformanceIntel'
import { MobileBottomNav, type MobileNavKey } from './tennis/MobileBottomNav'
import { MobileMoreSheet, type MoreSheetItem } from './tennis/MobileMoreSheet'

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
  sidebarItems: MoreSheetItem[]
  hiddenNavIds?: Set<string>
  roundupCount?: number
  groupOrder?: string[]
}

const DEFAULT_HIDDEN_IDS = new Set(['dashboard', 'morning', 'matchprep'])

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
  sidebarItems,
  hiddenNavIds,
  roundupCount = 18,
  groupOrder,
}: MobileTennisHomeProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [bottomNav, setBottomNav] = useState<MobileNavKey>('home')

  useEffect(() => {
    if (typeof document === 'undefined') return
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    const prev = meta?.content
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = '#A855F7'
    return () => { if (meta) meta.content = prev ?? '#07080F' }
  }, [])

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

  const hiddenIds = hiddenNavIds ?? DEFAULT_HIDDEN_IDS

  const handleBottomNav = (key: MobileNavKey) => {
    setBottomNav(key)
    switch (key) {
      case 'home':  onNavigate('dashboard'); break
      case 'today': onNavigate('today'); break
      case 'inbox': onNavigate('morning'); break
      case 'match': onNavigate('matchprep'); break
      case 'more':  setMoreOpen(true); break
    }
  }

  return (
    <div
      className="mobile-home min-h-screen flex flex-col"
      style={{
        background: 'var(--bg-base)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'calc(64px + 22px + env(safe-area-inset-bottom))',
        // Prototype token palette — overrides any sport-specific theme upstream.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ['--bg-base' as any]:      'rgb(13, 8, 32)',
        ['--bg-card' as any]:      'rgb(22, 16, 43)',
        ['--bg-card-alt' as any]:  'rgb(30, 23, 57)',
        ['--text-primary' as any]: 'rgb(245, 243, 255)',
        ['--text-accent' as any]:  'rgb(196, 181, 253)',
        ['--text-muted' as any]:   'rgb(139, 127, 184)',
        ['--text-meta' as any]:    'rgb(94, 79, 133)',
        ['--violet' as any]:       'rgb(168, 85, 247)',
        ['--fuchsia' as any]:      'rgb(217, 70, 239)',
        ['--yellow' as any]:       'rgb(252, 211, 77)',
        ['--green' as any]:        'rgb(16, 185, 129)',
        ['--amber' as any]:        'rgb(245, 158, 11)',
        ['--blue' as any]:         'rgb(96, 165, 250)',
        ['--red' as any]:          'rgb(239, 68, 68)',
        ['--cyan' as any]:         'rgb(34, 211, 238)',
        ['--pink' as any]:         'rgb(236, 72, 153)',
        ['--border' as any]:       'rgba(168, 85, 247, 0.18)',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes mobileCardIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mobileMatchGlow {
          0%, 100% { box-shadow: 0 0 20px 0 rgba(168, 85, 247, 0.55); }
          50%      { box-shadow: 0 0 40px 4px rgba(217, 70, 239, 0.55); }
        }
        @keyframes mobileGreenPulse {
          0%, 100% { transform: scale(1);   opacity: 1; }
          50%      { transform: scale(1.6); opacity: 0.55; }
        }
        @keyframes mobileRedPulse {
          0%, 100% { transform: scale(1);   opacity: 1; }
          50%      { transform: scale(1.5); opacity: 0.55; }
        }
        @keyframes mobileWave { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(18deg); } 75% { transform: rotate(-12deg); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; }
      ` }} />

      <MobileTopBar
        subtitle="TENNIS · MONTE-CARLO"
        photoUrl={session.photoDataUrl ?? null}
        initials={avatarInitials}
        onSearch={() => setMoreOpen(true)}
        onBell={() => { onNavigate('morning'); setBottomNav('inbox') }}
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
        onAll={() => setMoreOpen(true)}
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
        onOpen={() => { onNavigate('morning'); setBottomNav('inbox') }}
        onChannel={() => { onNavigate('morning'); setBottomNav('inbox') }}
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

      <div className="flex-1" />

      <MobileBottomNav
        active={bottomNav}
        onSelect={handleBottomNav}
        inboxBadge={13}
      />

      <MobileMoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        items={sidebarItems}
        hiddenIds={hiddenIds}
        onNavigate={(id) => { onNavigate(id); setBottomNav('more') }}
        groupOrder={groupOrder}
      />
    </div>
  )
}
