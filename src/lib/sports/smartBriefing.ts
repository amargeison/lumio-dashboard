// ─── Smart Briefing Engine ─────────────────────────────────────────────────
// Generates a time-aware, context-aware TTS script every time the speaker
// button is pressed. Never cached — always reflects NOW.

export interface ScheduleItem {
  id: string
  time: string        // "09:00", "14:30", "EOD"
  label: string
  completed: boolean
  cancelled: boolean
  highlight?: boolean // match / critical items
}

export interface MatchData {
  opponent: string
  time: string               // "13:00", "20:00"
  result?: 'win' | 'loss' | 'draw' | null
  score?: string             // "6-4 4-6 7-5", "3-1", etc.
}

export interface RoundupSummary {
  totalMessages: number
  urgentCount: number
  urgentLabels: string[]     // e.g. ["Manager", "Promoter Desk"]
}

export interface BriefingContext {
  now: Date
  playerName: string
  schedule: ScheduleItem[]
  match: MatchData | null
  roundupSummary: RoundupSummary
  sport: string
  timezone: string
  extra?: string             // sport-specific flavour (ranking, camp day, etc.)
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function timeGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 18) return 'Good afternoon'
  if (hour >= 18 && hour < 22) return 'Good evening'
  return "It's late — here's where things stand"
}

/** Parse "09:00" / "14:30" into today's Date (in local time). Returns null for unparseable ("EOD", "Today", etc.) */
function parseTime(timeStr: string, referenceDate: Date): Date | null {
  const m = timeStr.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const d = new Date(referenceDate)
  d.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0)
  return d
}

function formatTime12(timeStr: string): string {
  const m = timeStr.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return timeStr
  const h = parseInt(m[1], 10)
  const min = m[2]
  const suffix = h >= 12 ? 'pm' : 'am'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return min === '00' ? `${h12}${suffix}` : `${h12}:${min}${suffix}`
}

function minutesBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 60000)
}

// ─── Main ─────────────────────────────────────────────────────────────────

export function generateSmartBriefing(ctx: BriefingContext): string {
  const { now, playerName, schedule, match, roundupSummary, sport, extra } = ctx
  const firstName = playerName.split(' ')[0] || 'there'
  const hour = now.getHours()
  const parts: string[] = []

  // 1 — Greeting + date
  parts.push(`${timeGreeting(hour)}, ${firstName}.`)
  parts.push(`It's ${now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}.`)

  // Extra sport-specific context (ranking, camp day, etc.)
  if (extra) parts.push(extra)

  // 2 — Urgent roundup items (always, regardless of time)
  if (roundupSummary.urgentCount > 0) {
    if (roundupSummary.urgentCount === 1) {
      parts.push(`You have 1 urgent message from ${roundupSummary.urgentLabels[0]}.`)
    } else {
      parts.push(`You have ${roundupSummary.urgentCount} urgent messages — from ${roundupSummary.urgentLabels.join(' and ')}.`)
    }
  }

  // 3 — Match intelligence
  if (match) {
    const matchDate = parseTime(match.time, now)
    if (matchDate && matchDate.getTime() > now.getTime()) {
      const mins = minutesBetween(now, matchDate)
      if (mins <= 120) {
        parts.push(`Focus time — your match against ${match.opponent} is in ${mins} minutes.`)
      } else {
        parts.push(`You have a match against ${match.opponent} at ${formatTime12(match.time)}.`)
      }
    } else if (matchDate && matchDate.getTime() <= now.getTime()) {
      if (match.result === 'win') {
        parts.push(`Well played today — you beat ${match.opponent}${match.score ? `, ${match.score}` : ''}. Great result.`)
      } else if (match.result === 'loss') {
        parts.push(`Tough one today against ${match.opponent}${match.score ? `, ${match.score}` : ''}. You'll get them next time.`)
      } else if (match.result === 'draw') {
        parts.push(`You drew with ${match.opponent} today${match.score ? `, ${match.score}` : ''}.`)
      } else {
        parts.push(`Your match against ${match.opponent} should be done by now — check the result in your portal.`)
      }
    }
  }

  // 4 — Schedule awareness (past vs future)
  const upcoming: ScheduleItem[] = []
  const overdue: ScheduleItem[] = []

  for (const item of schedule) {
    if (item.cancelled) continue
    // Skip the match item — handled above
    if (match && item.label.toLowerCase().includes('match') && item.label.toLowerCase().includes(match.opponent.split(' ')[0].toLowerCase())) continue
    const itemDate = parseTime(item.time, now)
    if (!itemDate) {
      // Unparseable time (e.g. "EOD") — treat as upcoming if not completed
      if (!item.completed) upcoming.push(item)
      continue
    }
    if (itemDate.getTime() > now.getTime()) {
      if (!item.completed) upcoming.push(item)
    } else {
      // Past item
      if (item.completed) continue // completed past items: skip entirely
      // Only flag as overdue if within last 2 hours — older items are just gone
      const minsAgo = minutesBetween(itemDate, now)
      if (minsAgo <= 120) overdue.push(item)
      // Items more than 2 hours past: silently skip
    }
  }

  // Overdue items (recent — within last 2 hours)
  if (overdue.length === 1) {
    parts.push(`Heads up — ${overdue[0].label} at ${formatTime12(overdue[0].time)} looks like it was missed.`)
  } else if (overdue.length > 1) {
    parts.push(`Heads up — ${overdue.length} schedule items look overdue: ${overdue.map(o => o.label).join(', ')}.`)
  }

  // Next upcoming item
  if (upcoming.length > 0) {
    const next = upcoming[0]
    const nextDate = parseTime(next.time, now)
    if (nextDate) {
      const mins = minutesBetween(now, nextDate)
      if (mins <= 60) {
        parts.push(`Your next thing is ${next.label} in ${mins} minutes.`)
      } else {
        parts.push(`Next up: ${next.label} at ${formatTime12(next.time)}.`)
      }
    } else {
      parts.push(`Next up: ${next.label}.`)
    }

    // Remaining items count
    if (upcoming.length > 1) {
      parts.push(`${upcoming.length - 1} more ${upcoming.length - 1 === 1 ? 'item' : 'items'} on the schedule after that.`)
    }
  }

  // Non-urgent roundup summary
  if (roundupSummary.totalMessages > roundupSummary.urgentCount) {
    const nonUrgent = roundupSummary.totalMessages - roundupSummary.urgentCount
    parts.push(`Plus ${nonUrgent} other ${nonUrgent === 1 ? 'message' : 'messages'} in your roundup when you're ready.`)
  }

  // 5 — Contextual close
  const allDone = schedule.length > 0 && schedule.every(s => s.completed || s.cancelled)
  const matchDone = !match || (match.result !== undefined && match.result !== null)

  if (allDone && matchDone) {
    if (hour >= 21) {
      parts.push("That's everything done for today. Rest up.")
    } else {
      parts.push("That's everything done for today. Good work.")
    }
  } else if (upcoming.length === 0 && overdue.length === 0 && !match) {
    if (hour >= 21) {
      parts.push('Nothing left tonight — rest up.')
    } else {
      parts.push("That's your briefing.")
    }
  } else {
    parts.push("That's your briefing.")
  }

  return parts.join(' ')
}

// ─── Helpers for portals to assemble context ─────────────────────────────

/** Build a RoundupSummary from the channel arrays used across portals */
export function buildRoundupSummary(
  channels: { label: string; count: number; urgent: boolean }[]
): RoundupSummary {
  let totalMessages = 0
  let urgentCount = 0
  const urgentLabels: string[] = []
  for (const ch of channels) {
    totalMessages += ch.count
    if (ch.urgent) {
      urgentCount += ch.count
      urgentLabels.push(ch.label)
    }
  }
  return { totalMessages, urgentCount, urgentLabels }
}

/** Build ScheduleItem[] from a portal's schedule array + checked/cancelled sets */
export function buildScheduleItems(
  items: { id: string; time: string; label: string; highlight?: boolean }[],
  checked: Set<string> | Record<string, boolean>,
  cancelled: Set<string> | Record<string, boolean>
): ScheduleItem[] {
  const isChecked = (id: string) =>
    checked instanceof Set ? checked.has(id) : !!checked[id]
  const isCancelled = (id: string) =>
    cancelled instanceof Set ? cancelled.has(id) : !!cancelled[id]
  return items.map(s => ({
    id: s.id,
    time: s.time,
    label: s.label,
    completed: isChecked(s.id),
    cancelled: isCancelled(s.id),
    highlight: s.highlight,
  }))
}

/** Get the user's timezone from localStorage world clock or system default */
export function getUserTimezone(): string {
  if (typeof window === 'undefined') return 'Europe/London'
  try {
    const zones = localStorage.getItem('lumio_world_zones')
    if (zones) {
      const parsed = JSON.parse(zones)
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].tz) return parsed[0].tz
    }
  } catch {}
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
