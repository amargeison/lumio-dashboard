'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Sparkles, Volume2 } from 'lucide-react'
import type { SportsDemoSession } from '@/components/sports-demo'
import { getDailyQuote, TENNIS_QUOTES } from '@/lib/sports-quotes'
import { generateSmartBriefing, buildRoundupSummary, buildScheduleItems, getUserTimezone } from '@/lib/sports/smartBriefing'
import { useAudioBriefing } from '@/hooks/useAudioBriefing'
import { MobileTopBar } from './tennis/MobileTopBar'
import { MobileHero, type MobileHeroStat, type MobileHeroClock, type MobileHeroWeather } from './tennis/MobileHero'
import { MobileMatchCard } from './tennis/MobileMatchCard'
import { MobileQuickActions, type MobileQuickAction } from './tennis/MobileQuickActions'
import { MobileRoundupStrip, type MobileRoundupChannel } from './tennis/MobileRoundupStrip'
import { MobileSponsorAlert } from './tennis/MobileSponsorAlert'
import { MobilePerformanceIntel } from './tennis/MobilePerformanceIntel'
import { MobileMessageSheet } from './tennis/MobileMessageSheet'
import { MobileNotificationsSheet } from './tennis/MobileNotificationsSheet'
import { ComingSoonModal } from './ComingSoonModal'
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
  roundupCount,
}: MobileTennisHomeProps) {
  const { openMore } = useMobileLayout()
  const now = useMemo(() => new Date(), [])
  const hour = now.getHours()
  const greeting = partOfDay(hour)
  const firstName = firstNameFrom(session.userName)
  const avatarInitials = initialsFrom(session.userName)
  const aiSummaryLabel = hour < 12 ? 'AI Morning Summary' : hour < 17 ? 'AI Afternoon Summary' : 'AI Evening Summary'

  const quote = getDailyQuote(TENNIS_QUOTES)

  // Class A placeholder modal — speaker icon, every Quick Action, "All N →"
  // link, AI Summary speaker icon, and the disabled Reply button on the
  // MessageSheet all route through this single state.
  const [comingSoonLabel, setComingSoonLabel] = useState<string | null>(null)
  const stub = (label: string) => () => setComingSoonLabel(label)

  // Morning Roundup row tap → message sheet.
  const [activeChannel, setActiveChannel] = useState<MobileRoundupChannel | null>(null)
  // Top-bar bell → notifications sheet (flat list across all channels).
  const [notificationsOpen, setNotificationsOpen] = useState(false)

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

  // 18 actions ported from desktop (src/app/tennis/[slug]/page.tsx). Every tap
  // routes to ComingSoonModal — placeholder pattern until each lands.
  const quickActions: MobileQuickAction[] = [
    { id: 'sendmessage',   icon: '📨',  label: 'Send Message',        onPress: stub('Send Message') },
    { id: 'socialmedia',   icon: '📱',  label: 'Social Media',        onPress: stub('Social Media'),        hot: true },
    { id: 'flights',       icon: '✈️',  label: 'Smart Flights',       onPress: stub('Smart Flights'),       hot: true },
    { id: 'hotel',         icon: '🏨',  label: 'Find Hotel',          onPress: stub('Find Hotel') },
    { id: 'matchprep',     icon: '🎾',  label: 'Match Prep AI',       onPress: stub('Match Prep AI'),       hot: true },
    { id: 'practicecourt', icon: '🏟️', label: 'Book Practice Court', onPress: stub('Book Practice Court') },
    { id: 'warmup',        icon: '⏱️',  label: 'Warm-up Timer',       onPress: stub('Warm-up Timer') },
    { id: 'sponsor',       icon: '📱',  label: 'Sponsor Post',        onPress: stub('Sponsor Post') },
    { id: 'press',         icon: '📣',  label: 'Press Statement',     onPress: stub('Press Statement') },
    { id: 'ranking',       icon: '📊',  label: 'Ranking Simulator',   onPress: stub('Ranking Simulator') },
    { id: 'wildcard',      icon: '🎯',  label: 'Wildcard Request',    onPress: stub('Wildcard Request') },
    { id: 'agentbrief',    icon: '💼',  label: 'Agent Brief',         onPress: stub('Agent Brief'),         hot: true },
    { id: 'entries',       icon: '🏆',  label: 'Entry Manager',       onPress: stub('Entry Manager') },
    { id: 'injury',        icon: '💊',  label: 'Log Injury',          onPress: stub('Log Injury') },
    { id: 'expense',       icon: '🧾',  label: 'Log Expense',         onPress: stub('Log Expense') },
    { id: 'strings',       icon: '🎵',  label: 'String Order',        onPress: stub('String Order') },
    { id: 'visa',          icon: '🌍',  label: 'Visa Check',          onPress: stub('Visa Check') },
    { id: 'notes',         icon: '📝',  label: 'Match Notes',         onPress: stub('Match Notes') },
  ]

  const roundupChannels: MobileRoundupChannel[] = [
    {
      id: 'sms', label: 'SMS', icon: '📲', count: 3, color: 'rgb(14, 165, 233)',
      demoMessages: [
        { sender: 'Carlos',       timestamp: '8:55 today', body: 'Courts 3 + 4 open from 11:00 if you want to warm up away from the show courts. Bring the new frames — I want to feel the 23.5kg tension off the ground before we talk match plan.' },
        { sender: 'Travel desk',  timestamp: '8:31 today', body: 'Driver confirmed at hotel 10:45. Plate MC-7142. Back exit to avoid press. Traffic clear on Boulevard Princesse Charlotte — 9 minutes to the club.' },
        { sender: 'Dr Sarah Lee', timestamp: '8:06 today', body: "Don't forget ice 12:45 before strapping. Your window is tight — I want 20 minutes on the shoulder, not 10. Come straight to treatment room B after warm-up." },
      ],
    },
    {
      id: 'whatsapp', label: 'WhatsApp', icon: '💬', count: 5, color: 'rgb(37, 211, 102)',
      demoMessages: [
        { sender: 'Team chat',    timestamp: '9:03 today', body: 'Carlos: gameplan doc updated on the shared drive — read before warm-up please. Serve patterns on page 3, return formations on page 5, pressure triggers on page 6.' },
        { sender: 'James Wright', timestamp: '8:40 today', body: "Hamburg agent called back. He'll take the wildcard fee offer. Confirm before 5pm — I need to sign off the commercial terms today or they move to the next player on the list." },
        { sender: 'Family 💛',    timestamp: '7:58 today', body: 'Mum: landing Nice 14:10 Sunday. Proud of you. Good luck today xxx — whatever happens on court, we love you and we\'re on our way.' },
        { sender: 'Tom Ellis',    timestamp: '7:41 today', body: "Two frames strung at 23.5kg, one at 24. Bag at the locker by 11:30. Vanta Sports Luxe Pro throughout — same cross on all three so there's zero feel difference swapping mid-match." },
        { sender: 'Ben Parker',   timestamp: '7:20 today', body: "Good luck vs Vega — he's been shanking the BH DTL all clay. Keep the ball deep in the ad court and you'll force the short ball every time. Catch up in Halle?" },
      ],
    },
    {
      id: 'email', label: 'Email', icon: '✉️', count: 8, color: 'rgb(99, 102, 241)',
      demoMessages: [
        { sender: 'Monte-Carlo Press Office', timestamp: '8:50 today',    body: 'Post-match press schedule attached. Slot 3 if you win, slot 1 if you lose. 15 min cap. English + French press in the room; FFT have provided the interpreter.' },
        { sender: 'ATP Player Services',      timestamp: '8:25 today',    body: 'April ranking bulletin — your projected points with/without QF result enclosed. Reminder: 312 points drop off after Monte-Carlo. Madrid entry deadline is also flagged in the PDF.' },
        { sender: 'Meridian Watches',         timestamp: '8:04 today',    body: 'Renewal term sheet + comparator decks attached. James has a copy. Aiming for a yes by EOW — TAG Heuer\'s counter-offer lands tomorrow and we\'d rather finalise before that noise hits.' },
        { sender: 'Paul Reid (accountant)',   timestamp: '7:48 today',    body: 'Q1 VAT return filed. Monaco prize allocation note attached — review when you can. One flag: double-taxation relief on the Brighton prize may need a sign-off before 30 April.' },
        { sender: 'Fairmont Monte Carlo',     timestamp: '7:30 today',    body: 'Checkout extended to Sunday 13:00 at no charge. Late-stay vouchers enclosed. Car transfer to Nice airport pre-booked; driver will be waiting at the front door from 10:30.' },
        { sender: 'Nutrition team',           timestamp: 'Yesterday',     body: "Pre-match meal plan v3 — 3 hours before first serve. Carlos CC'd. Slight tweak to the carb load vs Brighton; more complex carbs, less simple sugar, same timing." },
        { sender: 'Roland-Garros Entry',      timestamp: 'Yesterday',     body: 'Main draw entry confirmed. Direct acceptance, seed band 33–48. Player accreditation collection window: Sunday 28 May, 10:00–18:00. Bring photo ID and your ATP card.' },
        { sender: 'Fan-club newsletter',      timestamp: '2 days ago',    body: 'May mailout: 2 signed posters promised. Send a high-res match photo for the cover by Friday. Ideally something from the Brighton run — that serve moment in the Brennan match was a great capture.' },
      ],
    },
    {
      id: 'agent', label: 'Agent', icon: '✉', count: 2, color: 'rgb(168, 85, 247)',
      demoMessages: [
        { sender: 'James Wright (Agent)', timestamp: '09:32 today', body: 'Meridian Watches renewal terms came back — 3-year deal at £120k/yr + bonuses. Need your call by Friday. TAG Heuer have surfaced a counter-offer; happy to brief you on both before you decide.' },
        { sender: 'James Wright (Agent)', timestamp: 'Yesterday 18:14', body: 'Hamburg 500 wildcard offer is on the table — director needs an answer in 24 hours. Clashes with Eastbourne prep though, so let\'s talk before you commit.' },
      ],
    },
    {
      id: 'tournament', label: 'Tournament', icon: '⚡', count: 3, color: 'rgb(245, 158, 11)', urgent: 1,
      demoMessages: [
        { sender: 'ATP Tournament Desk', timestamp: '08:47 today', body: 'Court 4 time moved 30 minutes earlier — your QF is now 13:00 sharp. Confirm receipt so we can update broadcast schedules. Press call shifts to 11:30.' },
        { sender: 'Roland-Garros Entry', timestamp: 'Yesterday 14:02', body: 'Direct entry confirmed for the main draw. Player accreditation pickup window is Sunday 28 May, 10:00–18:00. Bring photo ID and your ATP card.' },
        { sender: 'Madrid Open Logistics', timestamp: '2 days ago', body: 'Practice court allocation for Madrid published. You\'re on Court 8, 11:00 daily. Hitting partner request received — we\'ll match before you arrive.' },
      ],
    },
    {
      id: 'sponsor', label: 'Media & Sponsor', icon: '◉', count: 4, color: 'rgb(96, 165, 250)',
      demoMessages: [
        { sender: 'Carlos (Apex Performance)', timestamp: '11:08 today', body: 'Need that match-day kit photo before 12:00 today — content goes live at 13:30 to coincide with your QF. Penalty clause if we miss the window.' },
        { sender: 'Meridian Sport Press', timestamp: '07:44 today', body: 'Quick post-match interview request after today\'s match — 5 minutes max. Two questions on clay-court form, one on Roland-Garros prep. Approve?' },
        { sender: 'Vanta Sports Comms', timestamp: 'Yesterday', body: 'Two Instagram posts outstanding from March. Captions drafted — just need your sign-off. Renewal review meeting moved to 12 May.' },
        { sender: 'Tour Pulse Magazine', timestamp: '2 days ago', body: 'Cover story slot for July issue is yours if you want it. Deep-dive on the clay swing. Photoshoot Madrid week, copy approval rights included.' },
      ],
    },
    {
      id: 'physio', label: 'Physio & Medical', icon: '✚', count: 1, color: 'rgb(239, 68, 68)', urgent: 1,
      demoMessages: [
        { sender: 'Dr Lee (Physio)', timestamp: '10:21 today', body: 'Right shoulder shows minor inflammation flag on this morning\'s scan — nothing match-stopping but I want to see you at 12:30 before warm-up. Bring strapping.' },
      ],
    },
    {
      id: 'coach', label: 'Coach', icon: '◆', count: 2, color: 'rgb(16, 185, 129)',
      demoMessages: [
        { sender: 'Marco (Head Coach)', timestamp: '06:50 today', body: 'Vega\'s last 5 clay matches uploaded to the share. He\'s leaking second-serve returns to the deuce side — kick serve into the body should give you a free point pattern. Look at the 11-min mark.' },
        { sender: 'Marco (Head Coach)', timestamp: 'Yesterday 19:30', body: 'Practice plan for Madrid attached — 60 min serve patterns, 45 min cross-court rallies, 30 min match scenarios. Stringer has tensions ready for clay.' },
      ],
    },
    {
      id: 'prize', label: 'Prize Money', icon: '$', count: 1, color: 'rgb(34, 211, 238)',
      demoMessages: [
        { sender: 'ATP Finance', timestamp: 'Yesterday', body: 'Brighton ATP 250 prize money cleared — €38,400 net of taxes wired to your London account. Statement attached. R3 bonus paid separately on 30-day schedule.' },
      ],
    },
    {
      id: 'travel', label: 'Travel & Logistics', icon: '✈', count: 3, color: 'rgb(236, 72, 153)',
      demoMessages: [
        { sender: 'Travel Desk', timestamp: '08:12 today', body: 'Roland-Garros apartment owner needs deposit by 1 May or releases the booking. €2,400. Need card details — usual card on file?' },
        { sender: 'Travel Desk', timestamp: 'Yesterday', body: 'Madrid hotel confirmed — NH Eurobuilding, 26 Apr–4 May, 2 rooms (you + Carlos). Driver booked airport→hotel. Tournament shuttle daily from lobby.' },
        { sender: 'Travel Desk', timestamp: '3 days ago', body: 'Visa for the US Open swing — paperwork submitted to embassy. Standard 4-week turnaround. Backup ESTA route is in place if anything slips.' },
      ],
    },
    {
      id: 'wildcard', label: 'Wildcard', icon: '★', count: 2, color: 'rgb(217, 70, 239)',
      demoMessages: [
        { sender: 'ATP Entry', timestamp: 'Yesterday', body: 'Hamburg 500 wildcard offer — tournament director needs your answer today. Direct entry rank improves your seeding by 4 spots. Replies via James (agent).' },
        { sender: 'ATP Entry', timestamp: '3 days ago', body: 'Winston-Salem application submitted on your behalf. Decision letter expected by 15 August. Travel desk ringfenced flights pending confirmation.' },
      ],
    },
  ]

  const totalRoundup = roundupChannels.reduce((sum, c) => sum + c.count, 0)
  const derivedRoundupCount = roundupCount ?? totalRoundup

  // ── Today's Schedule (mirrors desktop tennis Today tab) ──────────────────
  const scheduleItems = [
    { id: 's1', time: '07:30', label: 'AI Morning Briefing',       highlight: false },
    { id: 's2', time: '08:30', label: 'Physio — right shoulder',   highlight: false },
    { id: 's3', time: '10:00', label: 'Practice — serve patterns', highlight: false },
    { id: 's4', time: '11:45', label: 'Stringing with Carlos',     highlight: false },
    { id: 's5', time: '13:00', label: 'Match vs C. Vega',        highlight: true  },
    { id: 's6', time: '15:30', label: 'Post-match physio',          highlight: false },
    { id: 's7', time: '17:00', label: 'Coach debrief',              highlight: false },
  ]

  const aiSummaryItems = [
    { icon: '🎾', text: 'Match today vs C. Vega — 13:00 Court 4. Clay. H2H 3–1 in your favour. Kick serve to his backhand on deuce court.' },
    { icon: '📬', text: '2 urgent messages: Tournament Desk moved your court time 30 min (confirm receipt) + Physio flagged shoulder inflammation — see Dr Lee at 12:30.' },
    { icon: '📅', text: 'Today: Practice 10:00 (serve patterns) → Stringing 11:45 → Match 13:00 → Physio 15:30 → Coach debrief 17:00.' },
    { icon: '🤝', text: 'Apex Performance post due today — Carlos needs kit photo before 12:00. Reply to agent about Meridian Watches renewal this week.' },
    { icon: '✈️', text: 'Madrid hotel confirmed (NH Eurobuilding, 26 Apr). Roland-Garros apartment deposit due 1 May — travel desk waiting.' },
  ]

  // ── Audio briefing (shared hook — same TTS engine as desktop) ────────────
  const [audioErrorMsg, setAudioErrorMsg] = useState<string | null>(null)
  useEffect(() => {
    if (!audioErrorMsg) return
    const t = setTimeout(() => setAudioErrorMsg(null), 3000)
    return () => clearTimeout(t)
  }, [audioErrorMsg])
  const { isSpeaking, toggle: toggleBriefing } = useAudioBriefing(
    () => generateSmartBriefing({
      now: new Date(),
      playerName: session.userName || firstName,
      schedule: buildScheduleItems(scheduleItems, new Set(), new Set()),
      match: { opponent: 'C. Vega', time: '13:00', result: null },
      roundupSummary: buildRoundupSummary(
        roundupChannels.map(c => ({ label: c.label, count: c.count, urgent: (c.urgent ?? 0) > 0 })),
      ),
      sport: 'tennis',
      timezone: getUserTimezone(),
      extra: `You're ranked ${player.ranking ?? 67} on the ATP tour with ${(player.ranking_points ?? 1847).toLocaleString()} points.`,
    }),
    { onError: () => setAudioErrorMsg('Audio briefing unavailable') },
  )

  return (
    <div className="w-full">
      <MobileTopBar
        subtitle="TENNIS · MONTE-CARLO"
        // Demo URLs show Alex Rivera's photo; founders fall back to initials
        // (their own avatar if they've uploaded one).
        photoUrl={session.photoDataUrl ?? (session.isDemoShell !== false ? '/alex_rivera.jpg' : null)}
        initials={avatarInitials}
        // Club crest renders for demo; founders get the generic Lumio "L" badge.
        logoUrl={session.isDemoShell !== false ? '/lumio_tennis_club_crest.svg' : null}
        unreadCount={derivedRoundupCount}
        onSearch={openMore}
        onBell={() => setNotificationsOpen(true)}
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
        onSpeakerTap={toggleBriefing}
        isSpeaking={isSpeaking}
      />

      <MobileQuickActions
        total={quickActions.length}
        actions={quickActions}
        onAll={stub(`All ${quickActions.length} actions`)}
      />

      <MobileMatchCard
        whenLabel="Today 13:00"
        eventLabel="ATP Monte-Carlo"
        roundLabel="R16"
        metaLabel="Clay · H2H 3–1"
        home={{
          initials: avatarInitials,
          name: firstName,
          rank: `ATP #${player.ranking ?? 67}`,
          // Demo player photo — falls back to initials for live founder accounts
          // that have no avatar uploaded yet.
          photoUrl: session.photoDataUrl ?? '/alex_rivera.jpg',
        }}
        away={{
          initials: 'CV',
          name: 'C. Vega',
          rank: 'ATP #41',
          // Demo opponent stand-in (see /public/opponents/c-vega.jpg).
          photoUrl: '/opponents/c-vega.jpg',
        }}
        onPrep={() => onNavigate('matchprep')}
        onTactics={() => onNavigate('scout')}
      />

      <MobileRoundupStrip
        totalCount={derivedRoundupCount}
        sinceLabel="06:00"
        channels={roundupChannels}
        onOpen={() => onNavigate('morning')}
        onChannel={(channel) => setActiveChannel(channel)}
      />

      <MobileSponsorAlert
        dueLabel="Due 12:00"
        message="Meridian Watches content past due — Carlos needs kit photo before 12:00."
        onPress={() => onNavigate('sponsorship')}
      />

      {/* ── Today's Schedule (ported from desktop Today tab) ────────────── */}
      <div className="mx-4 mt-5">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(168, 85, 247, 0.18)',
          }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(168, 85, 247, 0.12)' }}
          >
            <span className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>
              Today&apos;s Schedule
            </span>
            <span
              className="uppercase"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                fontSize: 9.5,
                letterSpacing: '0.9px',
                color: 'var(--text-meta)',
              }}
            >
              7 items
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(168, 85, 247, 0.08)' }}>
            {scheduleItems.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 px-4 py-2.5"
                style={{ borderTop: '1px solid rgba(168, 85, 247, 0.08)' }}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    background: s.highlight ? 'var(--violet)' : 'rgba(168, 85, 247, 0.25)',
                    boxShadow: s.highlight ? '0 0 8px rgba(217, 70, 239, 0.55)' : undefined,
                  }}
                />
                <span
                  className="uppercase font-bold w-12 flex-shrink-0"
                  style={{
                    fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                    fontSize: 10.5,
                    letterSpacing: '0.7px',
                    color: 'var(--text-muted)',
                  }}
                >
                  {s.time}
                </span>
                <span
                  className="text-[13px] flex-1 min-w-0 truncate"
                  style={{
                    color: s.highlight ? 'var(--text-primary)' : 'rgba(245, 243, 255, 0.78)',
                    fontWeight: s.highlight ? 600 : 500,
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Today's Venue ───────────────────────────────────────────────── */}
      <div className="mx-4 mt-4">
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-alt) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.18)',
          }}
        >
          <div
            className="uppercase font-bold mb-2"
            style={{
              fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
              fontSize: 10,
              letterSpacing: '1.1px',
              color: 'var(--text-meta)',
            }}
          >
            Today&apos;s Venue
          </div>
          <div className="text-[14px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Monte-Carlo Country Club
          </div>
          <div className="text-[11.5px] mb-3" style={{ color: 'rgba(196, 181, 253, 0.7)' }}>
            18°C · Sunny · Court 4 open 10:00
          </div>
          <div
            className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-3"
            style={{ borderTop: '1px solid rgba(168, 85, 247, 0.12)' }}
          >
            {[
              { label: 'Match',   value: '13:00' },
              { label: 'Court',   value: 'Court 4 · Clay' },
              { label: 'Prize W', value: '£342,000', tint: 'var(--green)' },
              { label: 'Prize L', value: '£57,000' },
              { label: 'TV',      value: 'Apex Tennis Network' },
            ].map(row => (
              <React.Fragment key={row.label}>
                <span
                  className="uppercase"
                  style={{
                    fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                    fontSize: 9.5,
                    letterSpacing: '0.8px',
                    color: 'var(--text-muted)',
                  }}
                >
                  {row.label}
                </span>
                <span
                  className="text-[11.5px] font-semibold text-right"
                  style={{ color: row.tint ?? 'rgba(245, 243, 255, 0.92)' }}
                >
                  {row.value}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI Morning Summary ──────────────────────────────────────────── */}
      <div className="mx-4 mt-4">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(168, 85, 247, 0.18)',
          }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between gap-2"
            style={{ borderBottom: '1px solid rgba(168, 85, 247, 0.12)' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles size={14} style={{ color: 'var(--violet)' }} />
              <span className="text-[12.5px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {aiSummaryLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleBriefing}
              aria-label={isSpeaking ? 'Stop reading' : 'Play summary'}
              aria-pressed={isSpeaking}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors active:scale-[0.95]"
              style={{
                background: isSpeaking ? 'rgba(14, 165, 233, 0.22)' : 'rgba(168, 85, 247, 0.18)',
                border: `1px solid ${isSpeaking ? 'rgba(14, 165, 233, 0.55)' : 'rgba(168, 85, 247, 0.4)'}`,
                color: isSpeaking ? 'rgb(56, 189, 248)' : 'var(--text-accent)',
              }}
            >
              <Volume2 size={12} strokeWidth={2} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                {isSpeaking ? 'Stop' : 'Listen'}
              </span>
            </button>
          </div>
          <div className="px-4 py-3 space-y-2.5">
            {aiSummaryItems.map((item, i) => (
              <div key={i} className="flex gap-2.5 text-[12.5px]">
                <span className="text-base flex-shrink-0 leading-tight">{item.icon}</span>
                <span style={{ color: 'rgba(245, 243, 255, 0.85)', lineHeight: 1.55 }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Performance Intelligence (existing component, reused) ───────── */}
      <MobilePerformanceIntel
        timestampLabel="AI · 12:58"
        body={<>
          Serve % up to <span style={{ color: 'var(--green)', fontWeight: 700 }}>84%</span> in last 5 matches
          <span style={{ color: 'var(--text-muted)' }}> — above season avg (65%). Clay kick serve landing 12cm deeper.</span>
        </>}
        onPress={() => onNavigate('performance')}
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
        channelColor={activeChannel?.color ?? 'rgb(168, 85, 247)'}
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
