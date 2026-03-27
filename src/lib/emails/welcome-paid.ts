import { emailLayout, ctaButton } from './layout'

export function welcomePaidEmail({ name, slug }: { name: string; slug: string }) {
  const workspaceUrl = `https://lumiocms.com/workspace/${slug}`
  return emailLayout({
    preheader: "You're live on Lumio. Here's everything you need to get started.",
    body: `
<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">Welcome to the full Lumio experience.</h1>
<p style="margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  Hi ${name}, you&rsquo;ve made the move. From today, Lumio is working in the background of your business &mdash; connecting your tools, surfacing your insights, and saving your team hours every week.
</p>

<h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#0d9488;">Your next steps:</h2>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
  <tr><td style="padding:12px 0;border-bottom:1px solid #1f2937;">
    <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:#0d9488;color:#fff;text-align:center;line-height:28px;font-size:13px;font-weight:700;margin-right:12px;vertical-align:middle;">1</span>
    <span style="font-size:14px;color:#f9fafb;vertical-align:middle;"><strong>Replace your demo data</strong> &mdash; go to Settings &gt; Data and connect your live tools</span>
  </td></tr>
  <tr><td style="padding:12px 0;border-bottom:1px solid #1f2937;">
    <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:#0d9488;color:#fff;text-align:center;line-height:28px;font-size:13px;font-weight:700;margin-right:12px;vertical-align:middle;">2</span>
    <span style="font-size:14px;color:#f9fafb;vertical-align:middle;"><strong>Invite your team</strong> &mdash; add colleagues under Settings &gt; Team so everyone has access</span>
  </td></tr>
  <tr><td style="padding:12px 0;border-bottom:1px solid #1f2937;">
    <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:#0d9488;color:#fff;text-align:center;line-height:28px;font-size:13px;font-weight:700;margin-right:12px;vertical-align:middle;">3</span>
    <span style="font-size:14px;color:#f9fafb;vertical-align:middle;"><strong>Set up your workflows</strong> &mdash; head to Workflows and activate the ones that fit your business</span>
  </td></tr>
  <tr><td style="padding:12px 0;">
    <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:#0d9488;color:#fff;text-align:center;line-height:28px;font-size:13px;font-weight:700;margin-right:12px;vertical-align:middle;">4</span>
    <span style="font-size:14px;color:#f9fafb;vertical-align:middle;"><strong>Book your onboarding call</strong> &mdash; we&rsquo;ll walk through setup with you: <a href="https://lumiocms.com/book-demo" style="color:#0d9488;text-decoration:underline;">Book now</a></span>
  </td></tr>
</table>

<h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#a78bfa;">What&rsquo;s included in your plan:</h2>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
  <tr><td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;">&#x2714;&#xFE0F; <strong style="color:#f9fafb;">Unlimited workflows</strong> &mdash; automate anything, no limits</td></tr>
  <tr><td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;">&#x2714;&#xFE0F; <strong style="color:#f9fafb;">AI Morning Roundup</strong> &mdash; your personalised daily briefing</td></tr>
  <tr><td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;">&#x2714;&#xFE0F; <strong style="color:#f9fafb;">Voice commands</strong> &mdash; say &ldquo;Hi Lumio&rdquo; to control your workspace</td></tr>
  <tr><td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;">&#x2714;&#xFE0F; <strong style="color:#f9fafb;">Full integrations</strong> &mdash; connect every tool your team uses</td></tr>
  <tr><td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;">&#x2714;&#xFE0F; <strong style="color:#f9fafb;">Priority support</strong> &mdash; real humans, fast responses</td></tr>
</table>

${ctaButton('Open my Lumio workspace &rarr;', workspaceUrl)}

<p style="margin:24px 0 0;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;">
  Questions? Just reply to this email &mdash; we&rsquo;re a small team and we read everything.
</p>`,
  })
}
