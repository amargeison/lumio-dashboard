interface BriefingMeeting {
  title: string
  time: string   // e.g. "09:00"
  status: string // 'done' | 'now' | 'upcoming'
}

interface BriefingOptions {
  companyName: string
  meetings: BriefingMeeting[]
  emailCount: number
  urgentCount: number
  workflowActionCount: number
  openingLine?: string
  closingLine?: string
}

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  const suffix = h < 12 ? 'am' : 'pm'
  const h12 = h % 12 || 12
  return m === 0 ? `${h12}${suffix}` : `${h12}:${mStr}${suffix}`
}

export function buildDemoBriefingScript({
  companyName,
  meetings,
  emailCount,
  urgentCount,
  workflowActionCount,
  openingLine,
  closingLine,
}: BriefingOptions): string {
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  const parts: string[] = []

  if (openingLine) {
    parts.push(`Good ${timeOfDay}. ${openingLine}`)
  } else {
    parts.push(`Good ${timeOfDay}. Welcome to your Lumio demo workspace for ${companyName}.`)
    parts.push(`Here's a quick rundown of your day.`)
  }

  // Meetings
  const upcoming = meetings.filter(m => m.status !== 'done')
  if (upcoming.length === 0) {
    parts.push(`No meetings scheduled for today.`)
  } else {
    parts.push(`You have ${meetings.length} meeting${meetings.length !== 1 ? 's' : ''} today.`)
    const first = upcoming[0]
    if (first) {
      const when = first.status === 'now' ? 'right now' : `at ${formatTime(first.time)}`
      parts.push(`${first.status === 'now' ? 'You are currently in' : 'First up —'} ${first.title}, ${when}.`)
    }
  }

  // Emails
  if (emailCount > 0) {
    if (urgentCount > 0) {
      parts.push(`On emails, you have ${emailCount} waiting. ${urgentCount} ${urgentCount !== 1 ? 'are' : 'is'} marked urgent — worth a look.`)
    } else {
      parts.push(`You have ${emailCount} email${emailCount !== 1 ? 's' : ''} waiting. None are marked urgent.`)
    }
  }

  // Workflow actions
  if (workflowActionCount > 0) {
    parts.push(`Also — ${workflowActionCount} workflow${workflowActionCount !== 1 ? 's need' : ' needs'} your attention today.`)
  } else {
    parts.push(`All workflows are running smoothly.`)
  }

  parts.push(`And finally — this is a live demo. Connect your real data and Lumio will brief you like this every morning.`)
  parts.push(closingLine || `Have a great day.`)

  return parts.join('  ')
}
