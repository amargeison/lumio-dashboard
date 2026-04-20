import { emailLayout, ctaButton } from './layout'

const SPORT_LABELS: Record<string, string> = {
  tennis: 'Tennis', golf: 'Golf', darts: 'Darts', boxing: 'Boxing',
  cricket: 'Cricket', rugby: 'Rugby', football: 'Football',
  nonleague: 'Non-League Football', grassroots: 'Grassroots Football', womens: "Women's Football",
}

const DEMO_SLUGS: Record<string, string> = {
  tennis: 'demo', golf: 'demo', darts: 'demo',
  boxing: 'lumio-demo', cricket: 'cricket-demo', rugby: 'rugby-demo',
  football: 'lumio-dev', nonleague: 'harfield-fc',
  grassroots: 'sunday-rovers-fc', womens: 'oakridge-women-fc',
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

const SPORT_FEATURES_EMAIL: Record<string, string[]> = {
  tennis: [
    '🎾 <strong>AI Morning Briefing</strong> &mdash; your day read back in 60 seconds. Rankings movement, points expiry, today&rsquo;s opponent, weather at the venue, travel status.',
    '📊 <strong>Live ATP/WTA Rankings + Race to Finals</strong> &mdash; your ranking, points expiry countdowns, and exactly how many points you need to reach your next target.',
    '🧠 <strong>Opponent Scout AI</strong> &mdash; before every match, AI builds you a full dossier. Surface win rates, serve patterns, H2H record, psychological tendencies.',
    '✈️ <strong>Smart Flights &amp; Hotels</strong> &mdash; searches 8+ airlines and tournament hotels simultaneously. Players save an average of &pound;340 per tournament.',
    '💼 <strong>Sponsorship Pipeline</strong> &mdash; every deal, every obligation, every renewal date. AI writes your sponsor posts in your voice. One click to post.',
  ],
  darts: [
    '🎯 <strong>AI Morning Briefing</strong> &mdash; your day in 60 seconds. PDC ranking movement, tonight&rsquo;s opponent, checkout percentage trends, prize money on the line.',
    '📊 <strong>PDC Order of Merit + Race to Alexandra Palace</strong> &mdash; your ranking, exactly how many points you need, and which events matter most.',
    '🧠 <strong>Opponent Intel AI</strong> &mdash; full breakdown before every match. Checkout routes, pressure performance, H2H record, recent form.',
    '✈️ <strong>Smart Flights &amp; Hotels</strong> &mdash; searches every PDC venue route simultaneously. Finds the cheapest option in seconds. Players save hundreds per season.',
    '🎵 <strong>Walk-on Music Manager</strong> &mdash; broadcaster approvals, PDC clearance, backup track status. Every broadcaster in one dashboard.',
  ],
  golf: [
    '⛳ <strong>AI Morning Briefing</strong> &mdash; your day in 60 seconds. OWGR movement, FedEx points, course conditions, tee time, caddie status, travel update.',
    '📊 <strong>OWGR + World Rankings Tracker</strong> &mdash; your ranking, exemption status, and which events you need to protect your card. Course fit scores for every tournament.',
    '🧠 <strong>Strokes Gained Analysis</strong> &mdash; where you&rsquo;re winning and losing shots vs tour average. Driving, approach, around the green, putting.',
    '✈️ <strong>Smart Flights &amp; Hotels</strong> &mdash; searches every tour venue route. Pre-filled with your home airport. One less thing to think about.',
    '🎒 <strong>Caddie Hub</strong> &mdash; yardage books, course notes, club selections, green reading data. Everything your caddie needs in one place.',
  ],
  boxing: [
    '🥊 <strong>AI Morning Briefing</strong> &mdash; your day in 60 seconds. Camp progress, weight check-in, sparring schedule, opponent research, promoter messages.',
    '⚖️ <strong>Weight Tracker + Cut Planner</strong> &mdash; daily weight logging with a scientifically-modelled cut plan. Colour-coded alerts when off pace.',
    '🧠 <strong>Opponent Scout AI</strong> &mdash; full fighter dossier. Punch output, combinations, guard patterns, knockdown history, psychological profile.',
    '💰 <strong>Purse Simulator</strong> &mdash; enter any fight offer and see your real take-home after manager cut, trainer cut, camp costs, tax.',
    '⚡ <strong>Fight Camp Mode</strong> &mdash; daily readiness score, sparring log, weight trajectory, opposition study. Your entire camp in one dashboard.',
  ],
  cricket: [
    '🏏 <strong>AI Morning Briefing</strong> &mdash; your day in 60 seconds. Bowling load, batting form, training plan, weather, team news.',
    '📊 <strong>Bowling Workload Tracker</strong> &mdash; ACWR load monitoring with 7-day delivery planning. Dual-format cap warnings.',
    '🧠 <strong>Batting Analytics</strong> &mdash; format-split averages, wagon wheel, scoring zone heatmap, dismissal patterns.',
    '⚡ <strong>Pre-Season Camp Mode</strong> &mdash; phase tracker, squad readiness scores, GPS load, fitness test results.',
    '✈️ <strong>Away Tour Mode</strong> &mdash; Smart Flights, hotel finder, ground info, opposition research, time zone management.',
  ],
  rugby: [
    '🏉 <strong>AI Morning Briefing</strong> &mdash; your day in 60 seconds. Salary cap headroom, GPS load, training, injury updates, opposition scout.',
    '💰 <strong>Salary Cap Dashboard</strong> &mdash; live headroom tracking to the pound. The 56-page Premiership regulations built in.',
    '🧠 <strong>Opponent Scout AI</strong> &mdash; set piece tendencies, defensive patterns, key threats, recent form.',
    '⚡ <strong>Pre-Season Camp Mode</strong> &mdash; phase tracker, squad GPS load, fitness tests, friendly match log.',
    '📋 <strong>Set Pieces Library</strong> &mdash; 90+ lineout, scrum and kick-off routines with full SVG pitch diagrams.',
  ],
  football: [
    '⚽ <strong>AI Manager Briefing</strong> &mdash; your day in 60 seconds. PSR headroom, GPS readiness, transfer deadlines, injury updates.',
    '💰 <strong>PSR/FFP Compliance</strong> &mdash; live headroom tracking. Player wage bill, amortisation, P&amp;S calculations.',
    '🧠 <strong>FIFA-Style Pitch View</strong> &mdash; starting XI on a pitch, click to swap, bench panel, formation board.',
    '📊 <strong>Transfer Pipeline</strong> &mdash; agent contacts, scouting reports, player valuations, contract status.',
    '⚡ <strong>Board Suite</strong> &mdash; Club Planner, PSR dashboard, squad investment tracker, commercial pipeline.',
  ],
  womens: [
    '⚽ <strong>AI Club Director Briefing</strong> &mdash; FSR compliance, squad welfare, fixture prep, sponsorship obligations.',
    '💰 <strong>FSR Compliance Dashboard</strong> &mdash; real-time 80% salary cap vs Relevant Revenue tracking.',
    '🧠 <strong>Player Welfare Hub</strong> &mdash; maternity tracker, ACL risk monitor, mental health check-ins.',
    '📋 <strong>Dual Registration Manager</strong> &mdash; expiry alerts, window tracking, parent club comms.',
    '⚡ <strong>Demerger Readiness Tracker</strong> &mdash; for clubs going standalone. Legal checklist, financial modelling.',
  ],
}
SPORT_FEATURES_EMAIL.nonleague = SPORT_FEATURES_EMAIL.football
SPORT_FEATURES_EMAIL.grassroots = SPORT_FEATURES_EMAIL.football

function featureListHtml(sport: string): string {
  const features = SPORT_FEATURES_EMAIL[sport] || SPORT_FEATURES_EMAIL.football
  return features.map(f =>
    `<tr><td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;">${f}</td></tr>`
  ).join('')
}

export function generateSportsWelcomeEmail(
  name: string,
  sport: string,
  emailType: 'demo' | 'founder' | 'pending',
  email?: string
): string {
  const firstName = name.split(' ')[0] || name
  const sportLabel = SPORT_LABELS[sport] || sport
  const demoSlug = DEMO_SLUGS[sport] || `${sport}-demo`
  const demoUrl = `https://www.lumiosports.com/${sport}/${demoSlug}`
  const appUrl = `https://www.lumiosports.com/${sport}/app`
  const loginUrl = `https://www.lumiosports.com/sports-login?email=${encodeURIComponent(email || '')}&redirectTo=/${sport}/app`
  const logoHtml = `<img src="${SPORT_LOGOS[sport] || SPORT_LOGOS.tennis}" width="48" height="48" style="object-fit:contain;margin-bottom:16px;" alt="${sportLabel}" />`

  if (emailType === 'demo') {
    return emailLayout({
      preheader: `Your Lumio ${sportLabel} demo is ready — here's what you're about to see`,
      body: `
${logoHtml}
<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">Your Lumio ${sportLabel} demo is ready.</h1>
<p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  Hi ${firstName}, your interactive portal is live and waiting.
</p>
<p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  This isn&rsquo;t a slideshow or a product tour. It&rsquo;s a fully working portal &mdash; the same one a professional ${sportLabel.toLowerCase()} player would use every day. Add your name and photo and it becomes yours.
</p>

<h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#a855f7;">Here&rsquo;s what&rsquo;s inside:</h2>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
  ${featureListHtml(sport)}
</table>

<p style="margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  Everything you see in the demo is exactly what your live portal would look like with your real data connected. The AI briefing would reference your actual matches. The rankings would be yours. The schedule would be your tour calendar.
</p>

<p style="margin:0 0 28px;font-size:15px;font-weight:700;color:#a855f7;">
  This is what it looks like when sport meets smart business.
</p>

${ctaButton(`Explore your ${sportLabel} demo &rarr;`, demoUrl)}

<p style="margin:24px 0 0;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;">
  Questions? Reply to this email &mdash; a real person reads every one.
</p>`,
    })
  }

  if (emailType === 'founder') {
    return emailLayout({
      preheader: `Welcome to Lumio ${sportLabel}, ${firstName} — your portal is ready to build`,
      body: `
${logoHtml}
<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">Welcome to Lumio ${sportLabel}, ${firstName}.</h1>
<p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  You&rsquo;re in. Welcome to Lumio Sports as a founding member.
</p>
<p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  Your ${sportLabel.toLowerCase()} portal has been created and is waiting for you. When you first sign in, it&rsquo;ll be empty &mdash; that&rsquo;s intentional. Everything in your portal will be built around your real data, your team, and your career. Not someone else&rsquo;s.
</p>
<p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  Before you dive in &mdash; if you haven&rsquo;t explored the demo yet, we strongly recommend it. The demo shows you exactly how the portal works with real data loaded in, so you can see which features matter most to you.
</p>

${ctaButton(`Try the ${sportLabel} demo first &rarr;`, demoUrl)}

<h2 style="margin:28px 0 12px;font-size:16px;font-weight:700;color:#a855f7;">Here&rsquo;s what your portal will include:</h2>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
  ${featureListHtml(sport)}
</table>

<p style="margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  As a founding member, our team will be in touch within 24 hours to start configuring your portal. We&rsquo;ll work with you directly &mdash; no tickets, no waiting. Direct line to the people building it.
</p>

${ctaButton('Sign in to your portal &rarr;', loginUrl)}

<p style="margin:24px 0 0;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;">
  Questions? Reply to this email &mdash; a real person reads every one.
</p>`,
    })
  }

  // pending — registered but onboarding not complete
  return emailLayout({
    preheader: `Welcome to Lumio Sports, ${firstName}. Complete your ${sportLabel} portal setup.`,
    body: `
${logoHtml}
<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">Welcome to Lumio Sports, ${firstName}.</h1>
<p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  You&rsquo;re registered as a Lumio ${sportLabel} founding member. 3 months completely free &mdash; no card, no commitment.
</p>

<h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#a855f7;">What&rsquo;s waiting for you:</h2>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
  ${featureListHtml(sport)}
</table>

${ctaButton('Complete your portal setup &rarr;', loginUrl)}

<p style="margin:24px 0 0;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;">
  Questions? Reply to this email &mdash; a real person reads every one.
</p>`,
  })
}
