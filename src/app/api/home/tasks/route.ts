import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    tasks: [
      { id: '1', title: 'Review and respond to Bramble Hill invoice dispute', description: 'They queried the September charge. Email from George Harrison at 11pm.', due: '12:00', priority: 'critical', category: 'Finance', source: 'lumio', done: false, overdue: false },
      { id: '2', title: 'Finalise The Feed Network testing guide sign-off', description: 'Phase 5 review due today. 13 flagged gaps to resolve.', due: '14:00', priority: 'high', category: 'Operations', source: 'notion', done: false, overdue: false },
      { id: '3', title: 'Send investor deck to Marcus', description: 'Promised by end of day.', due: '17:00', priority: 'high', category: 'Finance', source: 'manual', done: false, overdue: false },
      { id: '4', title: 'Approve payroll pack for review', description: 'HR-07 generated the pack. Needs sign-off before Friday.', due: '16:00', priority: 'medium', category: 'HR', source: 'workflow', linkedWorkflow: 'HR-07', done: false, overdue: false },
      { id: '5', title: 'Register Lumio Ltd at Companies House', description: 'Required before signing any customer contracts. £12 online, instant.', due: 'Any time', priority: 'high', category: 'Legal', source: 'manual', done: false, overdue: false },
      { id: '6', title: 'Update Calendly link in nav buttons', due: 'Any time', priority: 'medium', category: 'Tech', source: 'manual', done: false, overdue: false },
    ],
  })
}
