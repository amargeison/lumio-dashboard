import { emailLayout, ctaButton } from './layout'

// The email a coach, parent or player gets when a head coach gives them access.
//
// It used to be a bare <div> of text — no layout, no logo, no sense of what they
// had actually been given. Everybody else in the product gets the dark Lumio
// shell (see welcome-sports.ts); there was no reason this one didn't.
//
// The thing it has to establish in the first line is WHO invited them. An email
// from a brand you have never heard of, telling you to sign in, is the shape of
// a phishing attempt. "Freya Jones has added you to New Malden Tennis Club" is
// the sentence that makes it legible.

const LOGO = 'https://www.lumiosports.com/tennis_coach_logo.png'
const LOGIN_URL = 'https://www.lumiosports.com/sports-login'
// The same demo the head coach was pointed at. Worth offering here too: a coach
// invited before their academy has any data in it lands on empty screens, and
// the demo is the only way to see what the portal looks like full.
const DEMO_URL = 'https://www.lumiosports.com/tennis/coach/demo'

const logoHtml = `<img src="${LOGO}" alt="Lumio Tennis Coach" width="96" style="display:block;height:auto;border:0;margin:0 0 24px;" />`

const feature = (icon: string, title: string, body: string) => `
<tr><td style="padding:0 0 14px;">
  <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
    ${icon} <strong style="color:#ffffff;">${title}</strong> &mdash; ${body}
  </p>
</td></tr>`

const COACH_FEATURES = [
  feature('🧠', 'Lumio Coach AI', 'session plans, lesson reviews and player feedback written for you &mdash; it reads each player&rsquo;s history first, so the guidance builds week to week.'),
  feature('📋', 'Session Planner', 'every session laid out with a timed run-sheet and kit list. A confirmed booking becomes a ready-to-build session in two clicks.'),
  feature('👥', 'Your players', 'the players your head coach assigns to you &mdash; profiles, goals, skill progress and lesson history, all in one place.'),
  feature('🏆', 'Racket Progression', 'the reward pathway, per player. See at a glance who is ready to move up.'),
  feature('📅', 'Booking Calendar', 'your lessons, synced to your own calendar.'),
  feature('📍', 'Court Planner', 'the sites you coach at &mdash; contacts, facilities, access notes and today&rsquo;s lessons.'),
  feature('🎒', 'Equipment &amp; Kit', 'start from the club&rsquo;s kit list or build your own. Whatever is actually in your car boot.'),
  feature('📚', 'Resource Centre', 'the academy&rsquo;s drill library, training plans and worksheets.'),
].join('')

const FAMILY_FEATURES = [
  feature('📈', 'Progress you can actually see', 'skills, goals and session-by-session notes from their coach &mdash; not just &ldquo;it went well&rdquo;.'),
  feature('🏆', 'Racket Progression', 'the pathway they are working through, and what comes next.'),
  feature('📅', 'What&rsquo;s coming up', 'lessons, camps and events, with everything you need to know before you turn up.'),
  feature('💬', 'A direct line', 'messages from the coaching team, in one place instead of scattered across texts.'),
].join('')

export function portalInviteEmail({ role, inviteeName, headCoachName, academyName, playerName }: {
  role: 'coach' | 'parent' | 'student'
  inviteeName?: string | null
  headCoachName?: string | null
  academyName?: string | null
  playerName?: string | null
}): { subject: string; html: string } {
  const hi = inviteeName?.trim() ? `Hi ${inviteeName.trim().split(/\s+/)[0]},` : 'Hi,'
  const club = academyName?.trim() || 'their coaching academy'
  const head = headCoachName?.trim() || 'Your head coach'

  if (role === 'coach') {
    return {
      subject: `${head} has added you to ${club} on Lumio`,
      html: emailLayout({
        preheader: `${head} has given you your own coaching portal at ${club}.`,
        body: `
${logoHtml}
<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">You&rsquo;ve got your own portal.</h1>
<p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  ${hi}
</p>
<p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  <strong style="color:#ffffff;">${head}</strong> runs <strong style="color:#ffffff;">${club}</strong> on Lumio Tennis Coach &mdash; and has set you up with your own login.
</p>
<p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  It&rsquo;s the same portal they use, showing your side of it: your players, your sessions, your bookings and your kit. What you write stays yours. You won&rsquo;t see the academy&rsquo;s finances or another coach&rsquo;s players.
</p>

${ctaButton('Sign in to your portal &rarr;', LOGIN_URL)}

<p style="margin:0 0 28px;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;">
  Sign in with this email address and we&rsquo;ll send you a one-time code &mdash; there&rsquo;s no password to remember.
</p>

<h2 style="margin:28px 0 12px;font-size:16px;font-weight:700;color:#a855f7;">What&rsquo;s in there:</h2>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
  ${COACH_FEATURES}
</table>

<p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  If it looks empty when you first sign in, that&rsquo;s normal &mdash; ${head} is still setting things up, and everything they add appears straight away. Nothing to refresh, nothing to install.
</p>
<p style="margin:0 0 4px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  In the meantime, have a play with the demo &mdash; it&rsquo;s a full portal with a season of real-looking data already in it, so you can see how everything fits together.
</p>

${ctaButton('Explore the demo portal &rarr;', DEMO_URL, '#374151')}

<p style="margin:24px 0 0;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;">
  Not expecting this? Ignore this email &mdash; nothing is set up until you sign in.
</p>`,
      }),
    }
  }

  const who = playerName?.trim()
  const about = role === 'parent'
    ? (who ? `follow <strong style="color:#ffffff;">${who}</strong>&rsquo;s coaching` : 'follow your player&rsquo;s coaching')
    : 'see your own coaching'

  return {
    subject: `${head} has invited you to follow the coaching at ${club}`,
    html: emailLayout({
      preheader: `${head} has given you access to ${who ? who + '&rsquo;s' : 'your'} progress at ${club}.`,
      body: `
${logoHtml}
<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">You&rsquo;re in.</h1>
<p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  ${hi}
</p>
<p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  <strong style="color:#ffffff;">${head}</strong> at <strong style="color:#ffffff;">${club}</strong> uses Lumio Tennis Coach to plan sessions and track progress &mdash; and has invited you to ${about}.
</p>

${ctaButton('Open your portal &rarr;', LOGIN_URL)}

<p style="margin:0 0 28px;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;">
  Sign in with this email address and we&rsquo;ll send you a one-time code &mdash; there&rsquo;s no password to remember.
</p>

<h2 style="margin:28px 0 12px;font-size:16px;font-weight:700;color:#a855f7;">What you&rsquo;ll see:</h2>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
  ${FAMILY_FEATURES}
</table>

<p style="margin:0 0 4px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  Want a look around first? The demo portal is a full example with data already in it.
</p>

${ctaButton('Explore the demo &rarr;', DEMO_URL, '#374151')}

<p style="margin:24px 0 0;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;">
  Not expecting this? Ignore this email &mdash; nothing is set up until you sign in.
</p>`,
    }),
  }
}
