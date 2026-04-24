'use client'
import React, { useEffect, useMemo, useState } from 'react'
import type { SportsDemoSession } from '@/components/sports-demo'
import type { SportMobileConfig } from '@/lib/mobile/types'
import { useAudioBriefing } from '@/hooks/useAudioBriefing'
import { MobileTopBar } from './tennis/MobileTopBar'
import { MobileHero, type MobileHeroStat, type MobileHeroClock } from './tennis/MobileHero'
import { MobileMatchCard } from './tennis/MobileMatchCard'
import { MobileQuickActions, type MobileQuickAction } from './tennis/MobileQuickActions'
import { MobileRoundupStrip, type MobileRoundupChannel } from './tennis/MobileRoundupStrip'
import { MobileSponsorAlert } from './tennis/MobileSponsorAlert'
import { MobilePerformanceIntel } from './tennis/MobilePerformanceIntel'
import { MobileMessageSheet } from './tennis/MobileMessageSheet'
import { MobileNotificationsSheet } from './tennis/MobileNotificationsSheet'
import { MobileSchedule } from './shared/MobileSchedule'
import { MobileVenue } from './shared/MobileVenue'
import { MobileAISummary } from './shared/MobileAISummary'
import { ComingSoonModal } from './ComingSoonModal'
import { useMobileLayout } from './MobileLayoutContext'

export type MobileSportHomeProps = {
  session: SportsDemoSession
  config: SportMobileConfig
  onNavigate: (sectionId: string) => void
  /** Override the auto-summed roundup count (defaults to sum of channel counts). */
  roundupCount?: number
}

function partOfDay(hour: number): string {
  if (hour < 5) return 'Up early'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Still up'
}

function dateLabel(now: Date, suffix: string): string {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${days[now.getDay()]} · ${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} · ${suffix}`
}

function firstNameFrom(name: string | null | undefined, fallback: string): string {
  if (!name) return fallback
  const first = name.trim().split(/\s+/)[0]
  return first || fallback
}

function initialsFrom(name: string | null | undefined, fallback: string): string {
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

/**
 * Highlight token used inside `performanceIntel.body` — replaced at render
 * time with a green-tinted span so each sport can call out a single number
 * without losing the surrounding muted-grey context line.
 */
const HIGHLIGHT_TOKEN = '{hl}'

export function MobileSportHome({ session, config, onNavigate, roundupCount }: MobileSportHomeProps) {
  const { openMore } = useMobileLayout()
  const now = useMemo(() => new Date(), [])
  const hour = now.getHours()
  const greeting = partOfDay(hour)
  const isDemo = session.isDemoShell !== false

  // Persona resolution. Demo URLs lean on the per-sport config (Alex Rivera,
  // Jake Morrison, etc.). Founder URLs (gated upstream by isDemoSlug) read
  // the authed user's profile instead — without this branch the founder's
  // greeting leaked the demo persona.
  const displayName = isDemo
    ? (session.userName || config.personaName)
    : session.userName
  const fallbackFirstName = isDemo ? firstNameFrom(config.personaName, 'Player') : 'there'
  const fallbackInitials  = isDemo ? config.personaInitials : 'L'
  const firstName = firstNameFrom(displayName, fallbackFirstName)
  const avatarInitials = initialsFrom(displayName, fallbackInitials)

  // Top-bar surfaces. Demo gets persona photo + club crest + sport-specific
  // venue subtitle. Founder gets uploaded photo (or initials), generic Lumio
  // "L" badge, and a generic "TENNIS · LUMIO TOUR" subtitle.
  const topBarPhoto = isDemo
    ? (session.photoDataUrl ?? config.personaPhotoUrl ?? null)
    : (session.photoDataUrl ?? null)
  const topBarLogo = isDemo && config.teamLogoUrl ? config.teamLogoUrl : null
  const topBarSubtitle = isDemo
    ? config.headerSubtitle
    : `${config.sport.toUpperCase()} · LUMIO TOUR`

  const aiSummaryLabel = hour < 12 ? 'AI Morning Summary' : hour < 17 ? 'AI Afternoon Summary' : 'AI Evening Summary'

  // Class A placeholder modal — speaker icon, every Quick Action, "All N →"
  // link, AI Summary speaker icon, and the disabled Reply button on the
  // MessageSheet all route through this single state.
  const [comingSoonLabel, setComingSoonLabel] = useState<string | null>(null)
  const stub = (label: string) => () => setComingSoonLabel(label)

  // Morning Roundup row tap → message sheet.
  const [activeChannel, setActiveChannel] = useState<MobileRoundupChannel | null>(null)
  // Top-bar bell → notifications sheet (flat list across all channels).
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const stats: MobileHeroStat[] = config.heroStats
  const clocks: MobileHeroClock[] = config.clocks.map(c => ({
    city: c.city,
    time: formatTzTime(now, c.tz) || '—',
  }))

  const quickActions: MobileQuickAction[] = config.quickActions.map(a => ({
    id: a.id,
    icon: a.icon,
    label: a.label,
    active: a.active,
    hot: a.hot,
    onPress: stub(a.label),
  }))

  const roundupChannels: MobileRoundupChannel[] = config.roundupChannels
  const totalRoundup = roundupChannels.reduce((sum, c) => sum + c.count, 0)
  const derivedRoundupCount = roundupCount ?? totalRoundup

  // Audio briefing — same TTS engine as desktop. Each sport's config supplies
  // a pre-baked briefing string; we don't recompute via generateSmartBriefing
  // because demo data is static and copy is editorialised per persona.
  const [audioErrorMsg, setAudioErrorMsg] = useState<string | null>(null)
  useEffect(() => {
    if (!audioErrorMsg) return
    const t = setTimeout(() => setAudioErrorMsg(null), 3000)
    return () => clearTimeout(t)
  }, [audioErrorMsg])
  const { isSpeaking, toggle: toggleBriefing } = useAudioBriefing(
    () => config.aiSummary.briefingText,
    { onError: () => setAudioErrorMsg('Audio briefing unavailable') },
  )

  // Performance intel body — `{hl}` token swapped for a green-tinted span.
  const intelBody: React.ReactNode = (() => {
    const { body, highlight } = config.performanceIntel
    if (!highlight || !body.includes(HIGHLIGHT_TOKEN)) {
      return <span style={{ color: 'var(--text-muted)' }}>{body}</span>
    }
    const [before, after] = body.split(HIGHLIGHT_TOKEN)
    return (
      <>
        {before}
        <span style={{ color: 'var(--green)', fontWeight: 700 }}>{highlight}</span>
        <span style={{ color: 'var(--text-muted)' }}>{after}</span>
      </>
    )
  })()

  return (
    <div className="w-full">
      <MobileTopBar
        subtitle={topBarSubtitle}
        photoUrl={topBarPhoto}
        initials={avatarInitials}
        logoUrl={topBarLogo}
        unreadCount={derivedRoundupCount}
        onSearch={openMore}
        onBell={() => setNotificationsOpen(true)}
        onAvatar={() => onNavigate('settings')}
      />

      <MobileHero
        dateLabel={dateLabel(now, config.dateLabelSuffix)}
        greeting={greeting}
        firstName={firstName}
        quote={config.quote.text}
        quoteAuthor={config.quote.author.toUpperCase()}
        stats={stats}
        weather={config.weather}
        clocks={clocks}
        onSpeakerTap={toggleBriefing}
        isSpeaking={isSpeaking}
      />

      <MobileQuickActions
        total={config.allActionsCount}
        actions={quickActions}
        onAll={stub(`All ${config.allActionsCount} actions`)}
      />

      <MobileMatchCard
        whenLabel={config.match.timeLabel}
        whenTint={config.match.timeLabelTint}
        eventLabel={config.match.eventLabel}
        roundLabel={config.match.roundLabel}
        metaLabel={config.match.metaLabel}
        primaryLabel={config.match.primaryButtonLabel}
        secondaryLabel={config.match.secondaryButtonLabel}
        home={{
          initials: avatarInitials,
          name: firstName,
          rank: config.match.player.rank,
          photoUrl: session.photoDataUrl ?? (isDemo ? config.match.player.photoUrl ?? null : null),
        }}
        away={{
          initials: config.match.opponent.initials,
          name: config.match.opponent.name,
          rank: config.match.opponent.rank,
          photoUrl: isDemo ? config.match.opponent.photoUrl ?? null : null,
        }}
        onPrep={() => onNavigate(config.match.primaryButtonTarget)}
        onTactics={() => onNavigate(config.match.secondaryButtonTarget)}
      />

      <MobileRoundupStrip
        totalCount={derivedRoundupCount}
        sinceLabel="06:00"
        channels={roundupChannels}
        onOpen={() => onNavigate('morning')}
        onChannel={(channel) => setActiveChannel(channel)}
      />

      <MobileSponsorAlert
        dueLabel={config.sponsorAlert.dueLabel}
        message={config.sponsorAlert.message}
        onPress={() => onNavigate(config.sponsorAlert.target)}
      />

      <MobileSchedule items={config.schedule} />

      <MobileVenue
        eyebrow={config.venue.eyebrow}
        name={config.venue.name}
        conditionsLine={config.venue.conditionsLine}
        rows={config.venue.rows}
      />

      <MobileAISummary
        title={aiSummaryLabel}
        items={config.aiSummary.items}
        isSpeaking={isSpeaking}
        onToggle={toggleBriefing}
      />

      <MobilePerformanceIntel
        timestampLabel={config.performanceIntel.timestampLabel}
        body={intelBody}
        onPress={() => onNavigate(config.performanceIntel.target)}
      />

      {/* ── Modals + sheets (mounted at the end so they stack above content) ─ */}
      {comingSoonLabel && (
        <ComingSoonModal
          label={comingSoonLabel}
          onClose={() => setComingSoonLabel(null)}
        />
      )}

      <MobileMessageSheet
        open={activeChannel != null}
        onClose={() => setActiveChannel(null)}
        channelLabel={activeChannel?.label ?? ''}
        channelIcon={activeChannel?.icon ?? '·'}
        channelColor={activeChannel?.color ?? 'var(--violet)'}
        messages={activeChannel?.demoMessages ?? []}
        onReplyTap={stub(`Reply to ${activeChannel?.label ?? 'channel'}`)}
      />

      <MobileNotificationsSheet
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        channels={roundupChannels}
        onSelectChannel={(channel) => {
          setNotificationsOpen(false)
          setActiveChannel(channel)
        }}
      />

      {/* Transient toast — audio-briefing failures (no SpeechSynthesis support,
          offline, .speak() threw). 3-second auto-dismiss. */}
      {audioErrorMsg && (
        <div
          className="fixed left-4 right-4 z-50 rounded-xl px-4 py-3 text-center text-[13px] font-semibold"
          style={{
            bottom: 'calc(64px + 22px + env(safe-area-inset-bottom) + 12px)',
            background: 'rgba(22, 16, 43, 0.96)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            color: 'rgb(254, 202, 202)',
            boxShadow: '0 12px 30px -6px rgba(0, 0, 0, 0.6)',
            animation: 'mobileCardIn 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
          }}
        >
          {audioErrorMsg}
        </div>
      )}
    </div>
  )
}
