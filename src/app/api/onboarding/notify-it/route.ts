import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/emails/send'

export async function POST(req: NextRequest) {
  try {
    const { ownerEmail, itEmail, companyName } = await req.json()

    const recipients = [ownerEmail, itEmail].filter(Boolean)
    if (!recipients.length) {
      return NextResponse.json({ error: 'No email provided' }, { status: 400 })
    }

    await sendEmail({
      from: 'Lumio <hello@lumiocms.com>',
      to: recipients,
      subject: `Lumio setup instructions for ${companyName}`,
      html: `
        <div style="font-family:-apple-system,sans-serif;background:#0a0a0f;color:#fff;padding:40px;">
          <div style="max-width:600px;margin:0 auto;background:#111318;border-radius:16px;border:1px solid #1f2937;overflow:hidden;">
            <div style="padding:28px 32px;border-bottom:1px solid #1f2937;">
              <h1 style="margin:0;font-size:20px;color:#F9FAFB;">Lumio Setup Instructions</h1>
              <p style="margin:4px 0 0;font-size:14px;color:#6B7280;">${companyName}</p>
            </div>
            <div style="padding:32px;">
              <p style="color:#D1D5DB;font-size:14px;line-height:1.6;">Hi,</p>
              <p style="color:#D1D5DB;font-size:14px;line-height:1.6;">${companyName} has set up a Lumio workspace and would like your help connecting their systems. Here's what's needed:</p>
              <ol style="color:#D1D5DB;font-size:14px;line-height:1.8;">
                <li>Log in to the Lumio workspace and go to <strong>Settings &gt; Integrations</strong></li>
                <li>Connect the company's email, calendar, and CRM accounts</li>
                <li>Upload any existing data files (HR records, finance exports, etc.) via <strong>Settings &gt; Data</strong></li>
                <li>Invite team members under <strong>Settings &gt; Team</strong></li>
              </ol>
              <p style="color:#6B7280;font-size:12px;margin-top:24px;">Questions? Reply to this email or contact hello@lumiocms.com</p>
            </div>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[onboarding/notify-it]', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
