// buildBriefingScript.ts
// Context-aware TTS morning briefing script builder.
// Adjusts content based on time of day and which inbox items have been actioned.

export interface BriefingData {
  userName: string
  greeting: string
  date: string
  weather: { temp: string; condition: string; icon: string; location: string }
  todaySummary: { meetings: number; tasks: number; urgent: number; emails: number }
  motivationalLine: string
}

export interface ActionedItem {
  item_type: string
  item_ref: string
  action_taken: string
}

export type BriefingPeriod = 'morning' | 'afternoon' | 'evening'

export function getBriefingPeriod(): BriefingPeriod {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export function buildBriefingScript(data: BriefingData, actioned: ActionedItem[] = []): string {
  const period = getBriefingPeriod()
  const { greeting, todaySummary, motivationalLine, weather } = data
  const { meetings, tasks, urgent, emails } = todaySummary

  // Count unique items actioned per type (avoid double-counting repeat actions on same item)
  const emailsActioned  = new Set(actioned.filter(a => a.item_type === 'email').map(a => a.item_ref)).size
  const slackActioned   = new Set(actioned.filter(a => a.item_type === 'slack').map(a => a.item_ref)).size
  const notionActioned  = new Set(actioned.filter(a => a.item_type === 'notion').map(a => a.item_ref)).size

  const parts: string[] = []

  // ── Morning: full briefing ──────────────────────────────────────────────────

  if (period === 'morning') {
    parts.push(`${greeting}.`)
    parts.push(`Here's your day at a glance.`)

    if (meetings > 0) {
      parts.push(`You have ${meetings} meeting${meetings !== 1 ? 's' : ''} today.`)
    } else {
      parts.push(`No meetings scheduled today — a clear run.`)
    }

    if (emails > 0) {
      if (urgent > 0) {
        parts.push(`On emails, you have ${emails} overnight. ${urgent} ${urgent !== 1 ? 'are' : 'is'} marked urgent — worth checking those first.`)
      } else {
        parts.push(`You have ${emails} email${emails !== 1 ? 's' : ''} waiting. None are marked urgent.`)
      }
    }

    if (tasks > 0) {
      parts.push(`Also, ${tasks} task${tasks !== 1 ? 's' : ''} on your list today.`)
    }

    if (weather?.temp && weather.temp !== '--') {
      parts.push(`Worth noting — it's ${weather.temp} and ${weather.condition} in ${weather.location} today.`)
    }

    parts.push(motivationalLine)
    parts.push(`Have a great day.`)

  // ── Afternoon: unresolved items only ───────────────────────────────────────

  } else if (period === 'afternoon') {
    parts.push(`${greeting}.`)

    const unresolvedEmails = Math.max(0, emails - emailsActioned)
    if (unresolvedEmails > 0) {
      parts.push(`You still have ${unresolvedEmails} email${unresolvedEmails !== 1 ? 's' : ''} waiting for a response.`)
    } else if (emails > 0) {
      parts.push(`Great work — all your morning emails are handled.`)
    }

    if (slackActioned > 0) {
      parts.push(`You've responded to ${slackActioned} Slack message${slackActioned !== 1 ? 's' : ''} today.`)
    }

    if (tasks > 0) {
      parts.push(`Don't forget — ${tasks} task${tasks !== 1 ? 's' : ''} on your list.`)
    }

    if (meetings > 0) {
      parts.push(`You have ${meetings} meeting${meetings !== 1 ? 's' : ''} today — check your calendar for what's still ahead.`)
    }

    if (parts.length <= 1) {
      parts.push(`All looks clear. Good progress this morning.`)
    }

  // ── Evening: summary ───────────────────────────────────────────────────────

  } else {
    parts.push(`${greeting}.`)

    const totalActioned = actioned.length
    if (totalActioned > 0) {
      parts.push(`You took ${totalActioned} action${totalActioned !== 1 ? 's' : ''} today across your inbox.`)
    }

    if (emailsActioned > 0) {
      parts.push(`You replied to or cleared ${emailsActioned} email${emailsActioned !== 1 ? 's' : ''}.`)
    }

    if (slackActioned > 0) {
      parts.push(`${slackActioned} Slack message${slackActioned !== 1 ? 's' : ''} handled.`)
    }

    if (notionActioned > 0) {
      parts.push(`${notionActioned} Notion item${notionActioned !== 1 ? 's' : ''} reviewed.`)
    }

    if (meetings > 0) {
      parts.push(`You had ${meetings} meeting${meetings !== 1 ? 's' : ''} on the calendar today.`)
    }

    parts.push(`Good work. Rest up.`)
  }

  return parts.join('  ')
}
