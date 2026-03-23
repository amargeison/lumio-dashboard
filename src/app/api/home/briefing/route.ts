import { NextResponse } from 'next/server'

function getGreeting(name: string): string {
  const h = new Date().getHours()
  if (h < 12) return `Good morning, ${name}`
  if (h < 17) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
}

const MOTIVATIONAL_LINES = [
  'Ready to automate everything.',
  'Your workflows are running. You should be too.',
  'Every workflow that ran overnight saved you time this morning.',
  'The machine never sleeps — and neither do your automations.',
  'Focus on the work only you can do. Lumio handles the rest.',
]

export async function GET() {
  const name = process.env.USER_NAME || 'Arron'
  return NextResponse.json({
    userName: name,
    greeting: getGreeting(name),
    date: new Date().toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }),
    motivationalLine: MOTIVATIONAL_LINES[new Date().getDay() % MOTIVATIONAL_LINES.length],
    todaySummary: {
      meetings: 4,  // TODO: pull from Google Calendar API
      tasks: 7,     // TODO: pull from Notion/Supabase tasks
      urgent: 2,    // TODO: pull from workflow alerts
      emails: 12,   // TODO: pull from Gmail API
    },
  })
}
