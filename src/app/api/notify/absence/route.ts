import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/emails/send'

export async function POST(req: NextRequest) {
  const { name, email, date, notifySlack } = await req.json().catch(() => ({ name: '', email: '', date: '', notifySlack: false }))

  const today = date || new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const managerEmail = process.env.MANAGER_EMAIL || email || 'manager@company.com'

  // Send email notification
  await sendEmail({
    from: 'Lumio <hello@lumiocms.com>',
    to: [managerEmail],
    subject: `${name || 'A team member'} is absent today`,
    html: `<p>${name || 'A team member'} has reported they are unwell and will not be in today — ${today}.</p><p>This was logged automatically via Lumio.</p><p style="color:#6B7280;font-size:12px;">Reply to this email if you need to discuss cover arrangements.</p>`,
  }).catch(err => console.error('[notify/absence] Email failed:', err))

  // Slack notification (if configured)
  const slackToken = process.env.SLACK_BOT_TOKEN
  const slackChannel = process.env.SLACK_GENERAL_CHANNEL || '#general'
  if (notifySlack && slackToken) {
    try {
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${slackToken}` },
        body: JSON.stringify({ channel: slackChannel, text: `📋 ${name || 'A team member'} is unwell today and won't be in. Please plan accordingly.` }),
      })
    } catch (err) { console.error('[notify/absence] Slack failed:', err) }
  }

  return NextResponse.json({ success: true })
}
