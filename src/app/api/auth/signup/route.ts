import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/emails/send'

/**
 * POST /api/auth/signup — notify Arron of new signups.
 * Actual account creation is handled by /api/demo/signup (existing flow).
 * This route is called AFTER successful OTP verification to send the welcome email.
 */

function welcomeEmailHTML({ firstName, companyName, portalType, portalUrl }: { firstName: string; companyName: string; portalType: string; portalUrl: string }) {
  const isSchools = portalType === 'schools'
  const tips = isSchools ? `
    <tr><td style="padding:8px 0;color:#D1D5DB;font-size:14px;">🛡️ <strong>Click 'Review Now'</strong> — see the safeguarding workflow</td></tr>
    <tr><td style="padding:8px 0;color:#D1D5DB;font-size:14px;">✨ <strong>Try 'Create Lesson Plan'</strong> — AI builds it in seconds</td></tr>
    <tr><td style="padding:8px 0;color:#D1D5DB;font-size:14px;">👑 <strong>Switch roles in the top bar</strong> — see Headteacher vs Teacher view</td></tr>
    <tr><td style="padding:8px 0;color:#D1D5DB;font-size:14px;">🔒 <strong>Try the lockdown protocol</strong> — worth seeing end to end</td></tr>
  ` : `
    <tr><td style="padding:8px 0;color:#D1D5DB;font-size:14px;">🎙️ <strong>Press the voice button</strong> — hear your AI morning briefing</td></tr>
    <tr><td style="padding:8px 0;color:#D1D5DB;font-size:14px;">⚡ <strong>Try a quick action</strong> — they're all live workflows</td></tr>
    <tr><td style="padding:8px 0;color:#D1D5DB;font-size:14px;">📊 <strong>Check Insights</strong> — AI updates every 5 minutes</td></tr>
    <tr><td style="padding:8px 0;color:#D1D5DB;font-size:14px;">👥 <strong>Switch roles in the top bar</strong> — see what your team sees</td></tr>
  `

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#07080F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#07080F;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#111318;border:1px solid #1F2937;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 32px 24px;text-align:center;">
          <img src="https://lumiocms.com/lumio-transparent-new.png" alt="Lumio" width="120" style="display:inline-block;" />
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <h1 style="color:#F9FAFB;font-size:22px;font-weight:700;margin:0 0 12px;">Hi ${firstName},</h1>
          <p style="color:#9CA3AF;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Your <strong style="color:#F9FAFB;">${companyName}</strong> workspace is live and ready to explore.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:0 0 32px;">
              <a href="https://lumiocms.com${portalUrl}" style="display:inline-block;background-color:#0D9488;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
                Open my Lumio workspace →
              </a>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1F2937;padding-top:24px;">
            <tr><td style="padding:0 0 16px;color:#6B7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">What to try first</td></tr>
            ${tips}
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px;border-top:1px solid #1F2937;">
          <p style="color:#6B7280;font-size:13px;line-height:1.6;margin:0 0 16px;">
            Questions? Just reply to this email. I read every one personally.
          </p>
          <p style="color:#F9FAFB;font-size:14px;font-weight:600;margin:0;">Arron</p>
          <p style="color:#6B7280;font-size:12px;margin:4px 0 0;">Founder, Lumio</p>
        </td></tr>
        <tr><td style="padding:16px 32px;text-align:center;border-top:1px solid #1F2937;">
          <a href="https://lumiocms.com" style="color:#6B7280;font-size:11px;text-decoration:none;">lumiocms.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, companyName, portalType, slug } = await req.json()

    if (!firstName || !email || !companyName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const portalUrl = portalType === 'schools' ? `/demo/schools/${slug}` : `/demo/${slug}`

    // Send welcome email to user
    console.log(`[signup] Sending welcome email to ${email} for ${companyName} (${portalType})`)
    const welcomeResult = await sendEmail({
      from: 'Arron at Lumio <hello@lumiocms.com>',
      to: [email],
      subject: `Your Lumio workspace is ready, ${firstName}! 🚀`,
      html: welcomeEmailHTML({ firstName, companyName, portalType, portalUrl }),
    }).catch(err => { console.error('[signup] Welcome email FAILED:', err); return { data: null, error: err } })
    console.log(`[signup] Welcome email result:`, welcomeResult?.data?.id ? `sent (${welcomeResult.data.id})` : 'no ID returned')

    // Notify Arron of new signup
    const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })
    await sendEmail({
      from: 'Lumio Notifications <hello@lumiocms.com>',
      to: ['hello@lumiocms.com'],
      subject: `🚀 New Lumio sign-up — ${firstName} ${lastName || ''} from ${companyName}`,
      html: `
        <div style="font-family:sans-serif;padding:20px;color:#333;">
          <h2>New Lumio Sign-up</h2>
          <table style="font-size:14px;line-height:2;">
            <tr><td><strong>Name:</strong></td><td>${firstName} ${lastName || ''}</td></tr>
            <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
            <tr><td><strong>Company/School:</strong></td><td>${companyName}</td></tr>
            <tr><td><strong>Portal type:</strong></td><td>${portalType === 'schools' ? 'Schools' : 'Business'}</td></tr>
            <tr><td><strong>Signed up:</strong></td><td>${timestamp}</td></tr>
            <tr><td><strong>Portal URL:</strong></td><td>lumiocms.com${portalUrl}</td></tr>
          </table>
        </div>
      `,
    }).catch(err => console.error('[signup] notification email error:', err))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[signup] error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
