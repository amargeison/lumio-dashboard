import { emailLayout, ctaButton } from './layout'

export function welcomeTrialEmail({ name, slug, expiresDate }: { name: string; slug: string; expiresDate: string }) {
  const workspaceUrl = `https://lumiocms.com/demo/${slug}`
  return emailLayout({
    preheader: "Your 14-day trial starts now. Here's how to make the most of it.",
    body: `
<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">You&rsquo;re in. Let&rsquo;s make the next 14 days count.</h1>
<p style="margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  Hi ${name}, most businesses waste hours every week on tasks Lumio handles automatically. You&rsquo;ve just taken the first step to getting that time back.
</p>

<h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#0d9488;">Here&rsquo;s what you can do right now:</h2>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
  <tr><td style="padding:12px 0;border-bottom:1px solid #1f2937;">
    <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:#0d9488;color:#fff;text-align:center;line-height:28px;font-size:13px;font-weight:700;margin-right:12px;vertical-align:middle;">1</span>
    <span style="font-size:14px;color:#f9fafb;vertical-align:middle;"><strong>Explore your demo data</strong> &mdash; see exactly how Lumio works with real-looking data</span>
  </td></tr>
  <tr><td style="padding:12px 0;border-bottom:1px solid #1f2937;">
    <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:#0d9488;color:#fff;text-align:center;line-height:28px;font-size:13px;font-weight:700;margin-right:12px;vertical-align:middle;">2</span>
    <span style="font-size:14px;color:#f9fafb;vertical-align:middle;"><strong>Personalise your workspace</strong> &mdash; add your name, company name and logo, and your employee FIFA-style card to get a feel for what the real system looks like</span>
  </td></tr>
  <tr><td style="padding:12px 0;border-bottom:1px solid #1f2937;">
    <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:#0d9488;color:#fff;text-align:center;line-height:28px;font-size:13px;font-weight:700;margin-right:12px;vertical-align:middle;">3</span>
    <span style="font-size:14px;color:#f9fafb;vertical-align:middle;"><strong>Set up your team</strong> &mdash; invite colleagues under Settings &gt; Team</span>
  </td></tr>
  <tr><td style="padding:12px 0;">
    <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:#0d9488;color:#fff;text-align:center;line-height:28px;font-size:13px;font-weight:700;margin-right:12px;vertical-align:middle;">4</span>
    <span style="font-size:14px;color:#f9fafb;vertical-align:middle;"><strong>Join our Early Pilot</strong> &mdash; sign up now and get 6 months completely free as a founding member</span>
  </td></tr>
</table>

<h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#a78bfa;">What Lumio does for your business:</h2>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
  <tr><td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;">&#x2714;&#xFE0F; <strong style="color:#f9fafb;">Unifies your communications</strong> &mdash; email, Slack, CRM in one morning roundup</td></tr>
  <tr><td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;">&#x2714;&#xFE0F; <strong style="color:#f9fafb;">Automates repetitive workflows</strong> so your team focuses on what matters</td></tr>
  <tr><td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;">&#x2714;&#xFE0F; <strong style="color:#f9fafb;">AI-powered insights</strong> across every part of your business</td></tr>
  <tr><td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;">&#x2714;&#xFE0F; <strong style="color:#f9fafb;">Speaks to you &mdash; literally.</strong> Try saying &ldquo;Hi Lumio&rdquo; in your dashboard.</td></tr>
</table>

${ctaButton('Go to my workspace &rarr;', workspaceUrl)}

<p style="margin:24px 0 0;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;">
  Your trial runs until ${expiresDate}. If you have any questions, just reply to this email.
</p>`,
  })
}
