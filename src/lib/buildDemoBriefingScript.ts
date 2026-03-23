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
}: BriefingOptions): string {
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  const parts: string[] = []

  parts.push(`Good ${timeOfDay}. Welcome to your Lumio demo workspace for ${companyName}.`)

  // Meetings
  const upcoming = meetings.filter(m => m.status !== 'done')
  if (upcoming.length === 0) {
    parts.push('You have no meetings scheduled for today.')
  } else {
    parts.push(`You have ${meetings.length} meeting${meetings.length !== 1 ? 's' : ''} today.`)
    const first = upcoming[0]
    if (first) {
      parts.push(`Your ${first.status === 'now' ? 'current meeting is' : 'next meeting is'} ${first.title}, at ${formatTime(first.time)}.`)
    }
  }

  // Emails
  if (emailCount > 0) {
    const urgentPart = urgentCount > 0 ? `, ${urgentCount} marked urgent` : ''
    parts.push(`You have ${emailCount} email${emailCount !== 1 ? 's' : ''}${urgentPart}.`)
  }

  // Workflow actions
  if (workflowActionCount > 0) {
    parts.push(`${workflowActionCount} workflow${workflowActionCount !== 1 ? 's are' : ' is'} waiting for your attention.`)
  } else {
    parts.push('All workflows are running smoothly.')
  }

  parts.push('This is a demo workspace. Upgrade to connect your real data and see live insights.')

  return parts.join(' ')
}
