import { emailLayout, ctaButton } from './layout'

const SPORT_LABELS: Record<string, string> = {
  tennis: 'Tennis', golf: 'Golf', darts: 'Darts', boxing: 'Boxing',
  cricket: 'Cricket', rugby: 'Rugby', football: 'Football Pro',
  nonleague: 'Non-League', grassroots: 'Grassroots', womens: "Women's FC",
}

const SPORT_LOGOS: Record<string, string> = {
  tennis: 'https://www.lumiosports.com/tennis_logo.png',
  darts: 'https://www.lumiosports.com/darts_logo.png',
  golf: 'https://www.lumiosports.com/golf_logo.png',
  boxing: 'https://www.lumiosports.com/boxing_logo.png',
  cricket: 'https://www.lumiosports.com/cricket_logo.png',
  rugby: 'https://www.lumiosports.com/rugby_logo.png',
  football: 'https://www.lumiosports.com/football_logo.png',
  nonleague: 'https://www.lumiosports.com/football_logo.png',
  grassroots: 'https://www.lumiosports.com/football_logo.png',
  womens: 'https://www.lumiosports.com/womens_fc_logo.png',
}

const DEMO_SLUGS: Record<string, string> = {
  tennis: 'tennis-demo', golf: 'golf-demo', darts: 'darts-demo',
  boxing: 'lumio-demo', cricket: 'cricket-demo', rugby: 'rugby-demo',
  football: 'lumio-dev', nonleague: 'harfield-fc',
  grassroots: 'sunday-rovers-fc', womens: 'oakridge-women-fc',
}

export function generateSportsWelcomeEmail(
  name: string,
  sport: string,
  setupType: 'lumio' | 'self' | null,
  email?: string
): string {
  const firstName = name.split(' ')[0] || name
  const sportLabel = SPORT_LABELS[sport] || sport
  const demoSlug = DEMO_SLUGS[sport] || `${sport}-demo`
  const demoUrl = `https://www.lumiosports.com/${sport}/${demoSlug}`
  const appUrl = `https://www.lumiosports.com/${sport}/app`
  const sportLogoHtml = `<img src="${SPORT_LOGOS[sport] || SPORT_LOGOS.tennis}" width="48" height="48" style="object-fit:contain;margin-bottom:12px;" alt="${sportLabel}" />`
  const loginUrl = `https://www.lumiosports.com/sports-login?email=${encodeURIComponent(email || '')}&redirectTo=/${sport}/app`

  if (setupType === 'lumio') {
    return emailLayout({
      preheader: `Welcome to Lumio Sports, ${firstName}. Our team will set up your ${sportLabel} portal.`,
      body: `
${sportLogoHtml}
<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">You&rsquo;re in, ${firstName}. Welcome to Lumio Sports.</h1>
<p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  You&rsquo;re now a founding member of Lumio ${sportLabel}. That means 3 months completely free, and we build what you ask for.
</p>

<h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#a855f7;">What happens next:</h2>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
  <tr><td style="padding:10px 0;border-bottom:1px solid #1f2937;">
    <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:#a855f7;color:#fff;text-align:center;line-height:28px;font-size:13px;font-weight:700;margin-right:12px;vertical-align:middle;">1</span>
    <span style="font-size:14px;color:#f9fafb;vertical-align:middle;"><strong>Our team will contact you within 24 hours</strong> to start setting up your ${sportLabel} portal</span>
  </td></tr>
  <tr><td style="padding:10px 0;border-bottom:1px solid #1f2937;">
    <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:#a855f7;color:#fff;text-align:center;line-height:28px;font-size:13px;font-weight:700;margin-right:12px;vertical-align:middle;">2</span>
    <span style="font-size:14px;color:#f9fafb;vertical-align:middle;"><strong>We&rsquo;ll configure your integrations</strong>, import your data, and hand you a fully working portal</span>
  </td></tr>
  <tr><td style="padding:10px 0;">
    <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:#a855f7;color:#fff;text-align:center;line-height:28px;font-size:13px;font-weight:700;margin-right:12px;vertical-align:middle;">3</span>
    <span style="font-size:14px;color:#f9fafb;vertical-align:middle;"><strong>While you wait</strong>, explore the ${sportLabel} demo to see what&rsquo;s coming</span>
  </td></tr>
</table>

${ctaButton(`Explore the ${sportLabel} demo &rarr;`, demoUrl)}

<p style="margin:24px 0 0;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;">
  If you have any questions, just reply to this email. We read every one.
</p>`,
    })
  }

  if (setupType === 'self') {
    return emailLayout({
      preheader: `Your ${sportLabel} portal is ready — sign in now.`,
      body: `
${sportLogoHtml}
<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">Your ${sportLabel} portal is ready, ${firstName}.</h1>
<p style="margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  Everything is set up and waiting for you. Sign in any time to access your AI morning briefing, match prep, travel tools, and more.
</p>

${ctaButton(`Sign in to your portal &rarr;`, loginUrl)}

<p style="margin:24px 0 0;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;">
  Need help with integrations or setup? Just reply to this email.
</p>`,
    })
  }

  // setupType === null — onboarding not yet complete
  return emailLayout({
    preheader: `Welcome to Lumio Sports, ${firstName}. Complete your ${sportLabel} portal setup.`,
    body: `
${sportLogoHtml}
<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">Welcome to Lumio Sports, ${firstName}.</h1>
<p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  You&rsquo;re registered as a Lumio ${sportLabel} founding member. That means 3 months completely free &mdash; no card, no commitment.
</p>

<h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#a855f7;">Your founding member perks:</h2>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
  <tr><td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;">&#x2714;&#xFE0F; <strong style="color:#f9fafb;">3 months completely free</strong> &mdash; no card required</td></tr>
  <tr><td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;">&#x2714;&#xFE0F; <strong style="color:#f9fafb;">AI morning briefing</strong> &mdash; your day read back to you in 60 seconds</td></tr>
  <tr><td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;">&#x2714;&#xFE0F; <strong style="color:#f9fafb;">Smart Flights &amp; Hotels</strong> &mdash; cheapest travel found automatically</td></tr>
  <tr><td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;">&#x2714;&#xFE0F; <strong style="color:#f9fafb;">We build what you ask for</strong> &mdash; direct line to the dev team</td></tr>
</table>

${ctaButton('Complete your portal setup &rarr;', loginUrl)}

<p style="margin:24px 0 0;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;">
  Questions? Reply to this email &mdash; a real person reads every one.
</p>`,
  })
}
