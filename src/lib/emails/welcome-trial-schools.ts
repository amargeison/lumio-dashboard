import { emailLayout, ctaButton } from './layout'

export function welcomeTrialSchoolEmail({ name, slug, expiresDate }: { name: string; slug: string; expiresDate: string }) {
  const workspaceUrl = `https://lumiocms.com/demo/schools/${slug}`
  return emailLayout({
    preheader: "Your school demo is live. Here's what to explore first.",
    body: `
<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">You&rsquo;re in. Your school demo is ready.</h1>
<p style="margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  Hi ${name}, your Lumio for Schools demo is live and fully loaded with sample data &mdash; 1,147 pupils, 89 staff, safeguarding concerns, attendance records and more. No setup needed. Just explore.
</p>

<h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#0d9488;">Here&rsquo;s what to explore first:</h2>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
  <tr><td style="padding:12px 0;border-bottom:1px solid #1f2937;">
    <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:#0d9488;color:#fff;text-align:center;line-height:28px;font-size:13px;font-weight:700;margin-right:12px;vertical-align:middle;">1</span>
    <span style="font-size:14px;color:#f9fafb;vertical-align:middle;"><strong>Check today&rsquo;s attendance</strong> &mdash; see whole-school and year-group attendance, flag absences and mark the register.</span>
  </td></tr>
  <tr><td style="padding:12px 0;border-bottom:1px solid #1f2937;">
    <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:#0d9488;color:#fff;text-align:center;line-height:28px;font-size:13px;font-weight:700;margin-right:12px;vertical-align:middle;">2</span>
    <span style="font-size:14px;color:#f9fafb;vertical-align:middle;"><strong>Review your safeguarding dashboard</strong> &mdash; there&rsquo;s an open concern in your demo. See how DSL review, chronology and escalation works.</span>
  </td></tr>
  <tr><td style="padding:12px 0;border-bottom:1px solid #1f2937;">
    <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:#0d9488;color:#fff;text-align:center;line-height:28px;font-size:13px;font-weight:700;margin-right:12px;vertical-align:middle;">3</span>
    <span style="font-size:14px;color:#f9fafb;vertical-align:middle;"><strong>Try School Lockdown</strong> &mdash; one button alerts every staff member instantly. Try it in demo mode &mdash; nothing real happens.</span>
  </td></tr>
  <tr><td style="padding:12px 0;">
    <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:#0d9488;color:#fff;text-align:center;line-height:28px;font-size:13px;font-weight:700;margin-right:12px;vertical-align:middle;">4</span>
    <span style="font-size:14px;color:#f9fafb;vertical-align:middle;"><strong>Explore Insights by role</strong> &mdash; switch between Headteacher, SENCO and Governor views. Every role sees exactly what they need.</span>
  </td></tr>
</table>

<h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#a78bfa;">What Lumio does for your school:</h2>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
  <tr><td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;">&#x2714;&#xFE0F; <strong style="color:#f9fafb;">Attendance, safeguarding and SEND</strong> &mdash; all in one place, Ofsted-ready at a click</td></tr>
  <tr><td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;">&#x2714;&#xFE0F; <strong style="color:#f9fafb;">AI Morning Summary</strong> &mdash; every morning, your school briefing: attendance rate, open concerns, staff absences and key deadlines</td></tr>
  <tr><td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;">&#x2714;&#xFE0F; <strong style="color:#f9fafb;">Automated parent communications</strong> &mdash; letters, alerts and consultation bookings handled automatically</td></tr>
  <tr><td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;">&#x2714;&#xFE0F; <strong style="color:#f9fafb;">Role-based dashboards</strong> &mdash; your headteacher, SENCO, governors and office staff each see exactly what&rsquo;s relevant to them</td></tr>
</table>

${ctaButton('Go to my school dashboard &rarr;', workspaceUrl)}

<p style="margin:24px 0 0;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;">
  Your trial runs until ${expiresDate}. Questions? Just reply to this email &mdash; we&rsquo;re a small team and we actually read them.
</p>`,
  })
}
